/**
 * Export verification against the BUILT output, not the source.
 *
 * The sibling exports.test.ts imports from `src/`, so it passes even when the
 * published tarball is missing symbols entirely — which is how 2.1.11 reached
 * npm without the dashboard field reference. Consumers resolve `dist/`, so that
 * is what has to be asserted.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';

const DIST = '../dist/schemas/index.js';

describe('built schemas subpath', () => {
  it('is built before this suite is meaningful', () => {
    expect(existsSync(new URL('../dist/schemas/index.js', import.meta.url))).toBe(true);
  });

  it('exports the dashboard field reference surface consumers import', async () => {
    const dist = await import(DIST);

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
    const { fieldRef } = await import(DIST);

    expect(fieldRef({ fieldId: '3fdf29434505' })).toStrictEqual({ fieldId: '3fdf29434505' });
    expect(fieldRef({ reserved: 'createdAt' })).toStrictEqual({ reserved: 'createdAt' });
    expect(() => fieldRef({ fieldId: 'nope' })).toThrow();
  });
});
