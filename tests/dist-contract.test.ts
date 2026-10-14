import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const DIST_SCHEMAS = '../dist/schemas/index.js';
const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

/** Newest mtime (ms) among all `.ts` sources — the freshness bar `dist` must clear. */
function newestSrcMtimeMs(dir: string = SRC): number {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestSrcMtimeMs(full));
    } else if (entry.name.endsWith('.ts')) {
      newest = Math.max(newest, statSync(full).mtimeMs);
    }
  }
  return newest;
}

/** Every module specifier a built ESM file imports or re-exports from. */
function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  // `import ... from 'x'` / `export ... from 'x'` / bare `import 'x'`.
  // The clause-before-`from` scan excludes `;` and quotes so a match can never
  // span past the end of its own statement — otherwise a bare side-effect import
  // sitting between a no-`from` `export { x };` and a later ` from ` is swallowed.
  const staticRe = /(?:^|[\s;}])(?:import|export)\s+(?:[^;'"]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
  // `import('x')`
  const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const re of [staticRe, dynamicRe]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) specifiers.push(match[1]!);
  }
  return specifiers;
}

/** Bare (non-relative) specifiers reachable from `entry`, following relative imports. */
function reachableBareSpecifiers(entry: string): Set<string> {
  const bare = new Set<string>();
  const seen = new Set<string>();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);

    for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
      if (spec.startsWith('.')) {
        queue.push(resolve(dirname(file), spec));
      } else {
        bare.add(spec);
      }
    }
  }
  return bare;
}

const isZod = (spec: string) => spec === 'zod' || spec.startsWith('zod/');

beforeAll(() => {
  const indexJs = resolve(DIST, 'index.js');
  if (!existsSync(indexJs) || statSync(indexJs).mtimeMs < newestSrcMtimeMs()) {
    execSync('npm run build', { cwd: resolve(DIST, '..'), stdio: 'inherit' });
  }
});

describe('root barrel is zod-free', () => {
  it('dist is not stale relative to src — the walk ran against current output', () => {
    const indexMtime = statSync(resolve(DIST, 'index.js')).mtimeMs;
    expect(indexMtime).toBeGreaterThanOrEqual(newestSrcMtimeMs());
  });

  it('no module reachable from dist/index.js imports zod', () => {
    const reachable = reachableBareSpecifiers(resolve(DIST, 'index.js'));
    expect([...reachable].filter(isZod)).toEqual([]);
  });

  // Non-vacuity: proves the walker can actually SEE a zod import. Without this,
  // a broken specifier regex would make the test above pass for the wrong reason.
  it('dist/schemas/index.js DOES reach zod (the walker is not blind)', () => {
    const reachable = reachableBareSpecifiers(resolve(DIST, 'schemas/index.js'));
    expect([...reachable].filter(isZod).length).toBeGreaterThan(0);
  });

  it('dist/interfaces/dashboard.js re-exports spec types with zero runtime cost', () => {
    const built = readFileSync(resolve(DIST, 'interfaces/dashboard.js'), 'utf8');
    // `export type { … }` must be fully erased — a value re-export here would
    // silently drag the schema module (and zod) into the root barrel.
    expect(built).not.toContain('dashboard-spec.schema.js');
  });
});

describe('importSpecifiers — statement-bounded parsing', () => {
  // Regression: a lazy cross-statement scan swallowed a bare side-effect import
  // that followed a no-`from` `export { x };` while hunting for the next ` from `,
  // hiding that import's subtree (and any zod behind it) from the graph walk.
  it('captures a side-effect import that follows a no-"from" export statement', () => {
    const src = "export { other };\nimport './zz.js';\nexport { other as o2 } from './other.js';";
    const specs = importSpecifiers(src);
    expect(specs).toContain('./zz.js');
    expect(specs).toContain('./other.js');
  });

  it('still captures the ordinary import/export/side-effect/dynamic forms', () => {
    const src = [
      "import { z } from 'zod';",
      "export * from './schemas/index.js';",
      "import './polyfill.js';",
      "const x = await import('./lazy.js');",
    ].join('\n');
    const specs = importSpecifiers(src);
    expect(specs).toEqual(expect.arrayContaining(['zod', './schemas/index.js', './polyfill.js', './lazy.js']));
  });
});

describe('built schemas subpath', () => {
  it('exports the dashboard field reference surface consumers import', async () => {
    const dist = await import(DIST_SCHEMAS);

    for (const symbol of [
      'fieldReferenceSchema',
      'fieldRef',
      'collectWidgetRefs',
      'refPath',
      'buildDashboardSpecSchema',
      'widgetSchema',
      'columnSchema',
      'metricSchema',
      'filterSchema',
    ]) {
      expect(dist[symbol], `dist/schemas is missing ${symbol}`).toBeDefined();
    }
  });

  it('builds a reference through the built entry', async () => {
    const { fieldRef } = await import(DIST_SCHEMAS);

    expect(fieldRef({ fieldId: '3fdf29434505' })).toStrictEqual({ fieldId: '3fdf29434505' });
    expect(fieldRef({ reserved: 'createdAt' })).toStrictEqual({ reserved: 'createdAt' });
    expect(() => fieldRef({ fieldId: 'nope' })).toThrow();
  });
});

describe('built type declarations', () => {
  it('publishes IMediaTranscriptMeta from the root entry for transcript payload consumers', () => {
    const mediaDts = readFileSync(new URL('../dist/interfaces/media.d.ts', import.meta.url), 'utf8');
    const labelDts = readFileSync(new URL('../dist/interfaces/label.d.ts', import.meta.url), 'utf8');
    const rootDts = readFileSync(new URL('../dist/index.d.ts', import.meta.url), 'utf8');

    expect(mediaDts).toMatch(/export interface IMediaTranscriptMeta \{\s*transcriptRevision: number;/);
    expect(labelDts).toMatch(/interface IMediaLabelsResponse extends IMediaTranscriptMeta/);
    expect(rootDts).toMatch(/from '\.\/interfaces\/index\.js'|from "\.\/interfaces\/index\.js"/);
  });
});
