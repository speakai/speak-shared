import { describe, expect, it } from 'vitest';

import { ACCENT_PRESETS, COLOR_TOKENS, MEDIA_STATUS_DESIGN, contrastRatio } from '../src/index.js';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
const MODES = ['light', 'dark'] as const;

describe('contrastRatio', () => {
  it('measures WCAG contrast in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(contrastRatio('#52525b', '#ffffff')).toBeCloseTo(7.73, 2);
  });

  it.each(['#fff', 'rgba(0,0,0,0.4)', '', 'ffffff'])('rejects %s', (value) => {
    expect(() => contrastRatio(value, '#ffffff')).toThrow();
  });
});

describe('design tokens', () => {
  it.each(MODES)('keep every text and status pair at AA in %s mode', (mode) => {
    const c = COLOR_TOKENS[mode];
    for (const text of [c.text, c.textSecondary, c.textTertiary]) {
      for (const ground of [c.background, c.surface, c.raised]) {
        expect(contrastRatio(text, ground)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
    for (const status of Object.values(MEDIA_STATUS_DESIGN)) {
      expect(contrastRatio(c[status.color], c[status.fill])).toBeGreaterThanOrEqual(AA_TEXT);
    }
    expect(contrastRatio(c.record, c.background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(ACCENT_PRESETS.map((preset) => [preset.id, preset] as const))(
    'keeps the %s accent label at AA in both modes',
    (_id, preset) => {
      for (const mode of MODES) {
        expect(contrastRatio(preset[mode].onAccent, preset[mode].accent)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    },
  );
});
