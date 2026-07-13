/**
 * CI guard — the root barrel's module graph must never reach `zod`.
 *
 * speak-media-library imports RUNTIME values (MediaType, MediaState,
 * MediaPrivacyMode, FieldType, AssistantType, PromptState, MessageRole) from
 * `@speakai/shared`'s ROOT across six files, while pinning zod v3. Its bundler
 * therefore loads `dist/index.js`. A single `export * from './schemas/index.js'`
 * in `src/index.ts` would make `dist/index.js → dist/schemas/index.js →
 * import { z } from 'zod'`, putting zod v4 in media-library's bundle beside its
 * own zod v3.
 *
 * The schemas are reachable ONLY through the `@speakai/shared/schemas` subpath.
 * This test is the only thing stopping that invariant from rotting the first
 * time someone adds a convenience re-export to the root barrel.
 *
 * It walks actual ESM import specifiers — NOT a text grep. The word "zod"
 * appears in comments throughout the built output; only a real import matters.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

/** Every module specifier a built ESM file imports or re-exports from. */
function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  // `import ... from 'x'` / `export ... from 'x'` / bare `import 'x'`
  const staticRe = /(?:^|[\s;}])(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
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

describe('root barrel is zod-free', () => {
  beforeAll(() => {
    if (!existsSync(resolve(DIST, 'index.js'))) {
      execSync('npm run build', { cwd: resolve(DIST, '..'), stdio: 'inherit' });
    }
  });

  it('dist/index.js has been built', () => {
    expect(existsSync(resolve(DIST, 'index.js'))).toBe(true);
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
