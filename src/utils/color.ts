const HEX_COLOR = /^#([0-9a-f]{6})$/i;

/** WCAG 2.1 relative luminance of a `#rrggbb` colour. Throws on any other format. */
export const relativeLuminance = (hex: string): number => {
  const match = HEX_COLOR.exec(hex);
  if (!match) throw new Error(`Expected a #rrggbb colour, got ${hex}`);
  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const channel = parseInt(match[1]!.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
};

/** WCAG 2.1 contrast ratio between two `#rrggbb` colours, from 1 to 21; the order does not matter. */
export const contrastRatio = (first: string, second: string): number => {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};
