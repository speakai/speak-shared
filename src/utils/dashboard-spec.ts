/**
 * Zod-free helpers for dashboard spec v2.
 *
 * Deliberately free of any zod import: the schema module consumes these, and so
 * does the renderer in speak-media-library — which pins zod v3 and must never
 * pull v4 through the root barrel. Keep this module dependency-free.
 */

/**
 * react-grid-layout column count the dashboard grid is laid out on.
 *
 * Lives here (rather than in `interfaces/dashboard.ts`, which re-exports it) so
 * the schema's `layout` bounds can reach it without the schema module pulling in
 * an interfaces import. There is exactly ONE grid-width constant with ONE name.
 */
export const DASHBOARD_GRID_COLS = 12;

/** Id of the implicit section that holds widgets no explicit section claims. */
export const SECTION_OVERVIEW_ID = 'overview';

/**
 * Max nesting depth of `and`/`or` in a filter. A leaf predicate is depth 1.
 * Semantic cap — produces a correctable error. NOT the stack-overflow defense.
 */
export const MAX_FILTER_DEPTH = 5;

/**
 * Max nesting depth of the raw payload. This IS the stack-overflow defense: the
 * spec's filter schema is recursive, and zod recurses while parsing it, so a
 * deeply-nested filter makes `safeParse` THROW RangeError (a 500) rather than
 * reject (a 400). 40 sits comfortably above the deepest legal spec (~25).
 */
export const MAX_JSON_DEPTH = 40;

/**
 * True if `root` nests deeper than `max`.
 *
 * ITERATIVE BY CONSTRUCTION — an explicit stack, never a recursive call. A
 * recursive depth-checker would overflow on exactly the input it exists to
 * reject, which is the whole point. Do not "simplify" this into recursion.
 */
export function exceedsJsonDepth(root: unknown, max: number): boolean {
  const stack: Array<{ node: unknown; depth: number }> = [{ node: root, depth: 0 }];
  while (stack.length > 0) {
    const { node, depth } = stack.pop()!;
    if (depth > max) return true;
    if (node === null || typeof node !== 'object') continue;
    for (const value of Object.values(node as Record<string, unknown>)) {
      stack.push({ node: value, depth: depth + 1 });
    }
  }
  return false;
}

/** Grid geometry a widget occupies. Structural — mirrors the schema's `layout`. */
export interface SpecLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Half-open rectangle overlap on the 12-column grid: [x, x+w) x [y, y+h). */
export function rectsOverlap(a: SpecLayout, b: SpecLayout): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** A section as the renderer sees it — explicit or implicit. */
export interface ResolvedSectionGroup {
  id: string;
  title: string;
  icon: string;
  widgetIds: string[];
  /** True for the synthesized Overview group (not present in `spec.sections`). */
  isImplicit: boolean;
}

/**
 * Resolves the sections a dashboard actually renders.
 *
 * Widgets that no explicit section claims are gathered into an implicit
 * "Overview" group, PREPENDED so the narrative still leads. If an explicit
 * section already uses the `overview` id, the orphans are appended to it
 * instead of synthesizing a colliding group.
 *
 * This is the single implementation shared by the validator's collision check
 * and by both renderers. Do not reimplement it.
 *
 * `title: 'Overview'` is an English literal — a renderer must localise implicit
 * groups via `t()` rather than printing it directly.
 */
export function resolveSectionGroups(
  sections: ReadonlyArray<{ id: string; title: string; icon: string; widgetIds: readonly string[] }>,
  widgets: ReadonlyArray<{ id: string }>,
): ResolvedSectionGroup[] {
  const claimed = new Set(sections.flatMap((s) => [...s.widgetIds]));
  const orphans = widgets.filter((w) => !claimed.has(w.id)).map((w) => w.id);

  const groups: ResolvedSectionGroup[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    icon: s.icon,
    widgetIds: [...s.widgetIds],
    isImplicit: false,
  }));

  if (orphans.length === 0) return groups;

  const existingOverview = groups.find((g) => g.id === SECTION_OVERVIEW_ID);
  if (existingOverview) {
    existingOverview.widgetIds.push(...orphans);
    return groups;
  }

  return [
    { id: SECTION_OVERVIEW_ID, title: 'Overview', icon: 'layout-dashboard', widgetIds: orphans, isImplicit: true },
    ...groups,
  ];
}
