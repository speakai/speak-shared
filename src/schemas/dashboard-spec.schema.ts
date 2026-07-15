/**
 * Dashboard spec v2 — the validated dashboard contract.
 *
 * The single source of truth for what a dashboard IS, shared by the manual
 * editor (speak-client), the chat generation LLM's structured output, the MCP
 * tool surface, and the public viewer. Every write path parses against this.
 *
 * Import via the `@speakai/shared/schemas` subpath ONLY. This module has a
 * runtime dependency on zod; the package's root barrel must never reach it
 * (see tests/no-zod-in-root-barrel.test.ts).
 *
 * Every exported schema that can transitively contain a `Filter` ships
 * pre-wrapped in the structural depth guard (`withDepthGuard`). The raw,
 * unguarded schemas are private to this module and exist only for composition —
 * there is deliberately no unguarded schema in the public surface to misuse.
 */
import { z } from 'zod';
import {
  DASHBOARD_GRID_COLS,
  MAX_FILTER_DEPTH,
  MAX_JSON_DEPTH,
  SECTION_OVERVIEW_ID,
  exceedsJsonDepth,
  rectsOverlap,
  resolveSectionGroups,
} from '../utils/dashboard-spec.js';

/* ── Field-type context ──────────────────────────────────────────────────── */

/** Field types the spec reasons about. Mirrors the `FieldType` enum. */
export type SpecFieldType =
  | 'text' | 'url' | 'boolean' | 'date' | 'datetime' | 'number' | 'currency';

/** `fieldName → type`, built by the caller from the company's Field collection. */
export type FieldTypeMap = Readonly<Record<string, SpecFieldType>>;

const NUMERIC_FIELD_TYPES: ReadonlySet<SpecFieldType> = new Set(['number', 'currency']);
const TEMPORAL_FIELD_TYPES: ReadonlySet<SpecFieldType> = new Set(['date', 'datetime']);
const NUMERIC_AGGS: ReadonlySet<string> = new Set(['sum', 'avg', 'median', 'min', 'max']);

/* ── Structural depth guard ──────────────────────────────────────────────── */

/**
 * Wraps a schema in the ITERATIVE structural depth guard.
 *
 * ⛔ DO NOT "SIMPLIFY" THIS INTO A `superRefine`. That is the obvious refactor
 * and it silently reintroduces the bug. `filterSchema` is recursive, and zod
 * recurses while parsing it. A 12 KB payload nesting `and` ~1200 deep makes
 * `safeParse` THROW `RangeError: Maximum call stack size exceeded` — an uncaught
 * throw, i.e. a 500 where a 400 belongs. `JSON.parse` survives that depth, so a
 * body parser hands it straight through to us.
 *
 * A `superRefine` CANNOT defend against this: it runs AFTER the inner schemas
 * have parsed, by which point the recursive descent has already blown the stack.
 * The guard has to run BEFORE the recursion begins — hence `z.preprocess` — and
 * it has to be iterative (see `exceedsJsonDepth`).
 */
function withDepthGuard<T extends z.ZodType>(schema: T) {
  return z.preprocess((raw, ctx) => {
    if (exceedsJsonDepth(raw, MAX_JSON_DEPTH)) {
      ctx.addIssue({
        code: 'custom',
        message: `payload nesting exceeds the maximum depth of ${MAX_JSON_DEPTH}`,
      });
      return z.NEVER;
    }
    return raw;
  }, schema);
}

/* ── Filter (self-recursive) ─────────────────────────────────────────────── */

export const filterOpSchema = z.enum([
  'eq', 'neq', 'in', 'gt', 'gte', 'lt', 'lte', 'exists', 'notExists',
]);

const filterScalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const filterListSchema = z.array(z.union([z.string(), z.number()])).min(1).max(100);

const filterLeafSchema = z
  .strictObject({
    field: z.string().min(1).max(120),
    op: filterOpSchema,
    value: z.union([filterScalarSchema, filterListSchema]).optional(),
  })
  .superRefine((f, ctx) => {
    const valueless = f.op === 'exists' || f.op === 'notExists';
    const isList = Array.isArray(f.value);

    if (valueless && f.value !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: `op "${f.op}" must not carry a value` });
      return;
    }
    if (valueless) return;
    if (f.value === undefined) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: `op "${f.op}" requires a value` });
      return;
    }
    if (f.op === 'in' && !isList) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'op "in" requires an array value' });
    }
    if (f.op !== 'in' && isList) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: `op "${f.op}" requires a scalar value` });
    }
  });

/**
 * Recursive predicate. Zod 4's getter syntax lets `z.infer` derive the recursive
 * type with no hand-written interface.
 *
 * PRIVATE — composition only. The public `filterSchema` below carries the depth
 * guard; this raw one would throw RangeError on a deeply-nested payload.
 */
const filterSchemaRaw = z.union([
  filterLeafSchema,
  z.strictObject({ get and() { return z.array(filterSchemaRaw).min(1).max(10); } }),
  z.strictObject({ get or() { return z.array(filterSchemaRaw).min(1).max(10); } }),
]);

/* ── Metric — STRATIFIED (see plan Decision 1) ───────────────────────────── */

export const aggSchema = z.enum([
  'sum', 'avg', 'min', 'max', 'median', 'count', 'countDistinct',
]);
export const builtinMetricSchema = z.enum([
  'mediaCount', 'totalDuration', 'avgSentiment', 'speakerCount', 'wordCount',
]);

/** A LEAF metric. `Expr` operands are always base metrics — never other exprs. */
const baseMetricSchemaRaw = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('builtin'),
    name: builtinMetricSchema,
    filter: filterSchemaRaw.optional(),
  }),
  z.strictObject({
    kind: z.literal('field'),
    fieldName: z.string().min(1).max(120),
    agg: aggSchema,
    filter: filterSchemaRaw.optional(),
  }),
]);

/**
 * Derived metrics — a BOUNDED four-op grammar. Operands are `baseMetric`, so an
 * expr can never nest inside an expr. That bound is what keeps LLM-generated
 * specs safe to validate and cheap to compute; anything outside these four goes
 * in a `narrative` widget instead. `ratio(diff(a,b), diff(c,d))` must not parse.
 */
const exprSchemaRaw = z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('ratio'), numerator: baseMetricSchemaRaw, denominator: baseMetricSchemaRaw }),
  z.strictObject({ op: z.literal('diff'), a: baseMetricSchemaRaw, b: baseMetricSchemaRaw }),
  z.strictObject({ op: z.literal('delta'), metric: baseMetricSchemaRaw, over: z.enum(['first-to-last', 'prev-period']) }),
  z.strictObject({ op: z.literal('rank'), metric: baseMetricSchemaRaw, direction: z.enum(['desc', 'asc']) }),
]);

const metricSchemaRaw = z.discriminatedUnion('kind', [
  ...baseMetricSchemaRaw.options,
  z.strictObject({
    kind: z.literal('expr'),
    expr: exprSchemaRaw,
    filter: filterSchemaRaw.optional(),
  }),
]);

/* ── GroupBy ─────────────────────────────────────────────────────────────── */

export const granularitySchema = z.enum(['record', 'day', 'week', 'month', 'quarter']);

export const groupBySchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('field'), fieldName: z.string().min(1).max(120) }),
  z.strictObject({ kind: z.literal('time'), fieldName: z.string().min(1).max(120), granularity: granularitySchema }),
  z.strictObject({ kind: z.literal('folder') }),
  z.strictObject({ kind: z.literal('speaker') }),
]);

/* ── Threshold ───────────────────────────────────────────────────────────── */

export const thresholdStatusSchema = z.enum(['good', 'warn', 'critical', 'neutral']);

/** Discriminated on `op` so `between` is the only form that takes a tuple. */
const thresholdWhenSchema = z
  .discriminatedUnion('op', [
    z.strictObject({ op: z.enum(['gte', 'gt', 'lt', 'lte']), value: z.number() }),
    z.strictObject({ op: z.literal('between'), value: z.tuple([z.number(), z.number()]) }),
  ])
  .superRefine((w, ctx) => {
    // A reversed band ([high, low]) validates structurally but matches no value —
    // the configured coloring silently never fires. Reject it, don't strip it.
    if (w.op === 'between' && w.value[0] > w.value[1]) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'between bounds must be [low, high]' });
    }
  });

export const thresholdSchema = z.strictObject({
  when: thresholdWhenSchema,
  status: thresholdStatusSchema,
  label: z.string().min(1).max(40).optional(),
});
const thresholdsSchema = z.array(thresholdSchema).max(8);

/* ── Source / DateRange / Binding ────────────────────────────────────────── */

export const sourceSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('folders'), folderIds: z.array(z.string().min(1).max(64)).min(1).max(50) }),
  z.strictObject({ type: z.literal('team') }),
  z.strictObject({ type: z.literal('workspace') }),
]);

export const dateRangePresetSchema = z.enum([
  'last7days', 'last30days', 'last3months', 'yearToDate', 'allTime',
]);
export const dateRangeSchema = z.strictObject({ preset: dateRangePresetSchema });

/** Per-widget override. Omit any key to inherit the dashboard's value. */
const bindingSchemaRaw = z.strictObject({
  source: sourceSchema.optional(),
  dateRange: dateRangeSchema.optional(),
  filter: filterSchemaRaw.optional(),
});

/* ── Column (table) ──────────────────────────────────────────────────────── */

/**
 * `{header} & ({field} | {metric}) & {thresholds?}`. Both branches are strict,
 * so a column carrying BOTH `field` and `metric` fails both — the intersection
 * semantics come for free.
 */
const columnSchemaRaw = z.union([
  z.strictObject({
    header: z.string().min(1).max(40),
    field: z.string().min(1).max(120),
    thresholds: thresholdsSchema.optional(),
  }),
  z.strictObject({
    header: z.string().min(1).max(40),
    metric: metricSchemaRaw,
    thresholds: thresholdsSchema.optional(),
  }),
]);

/* ── Layout ──────────────────────────────────────────────────────────────── */

export const layoutSchema = z
  .strictObject({
    x: z.number().int().min(0).max(DASHBOARD_GRID_COLS - 1),
    y: z.number().int().min(0).max(200),
    w: z.number().int().min(1).max(DASHBOARD_GRID_COLS),
    h: z.number().int().min(1).max(40),
  })
  .refine((l) => l.x + l.w <= DASHBOARD_GRID_COLS, {
    message: `widget overflows the ${DASHBOARD_GRID_COLS}-column grid (x + w must be <= ${DASHBOARD_GRID_COLS})`,
    path: ['w'],
  });

/* ── Widgets ─────────────────────────────────────────────────────────────── */

const widgetBase = {
  id: z.string().min(1).max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'widget id must be kebab-case'),
  title: z.string().min(1).max(40),
  binding: bindingSchemaRaw.optional(),
  layout: layoutSchema,
};

const tableConfigSchema = z
  .strictObject({
    rowsAre: z.enum(['records', 'groups']),
    groupBy: groupBySchema.optional(),
    columns: z.array(columnSchemaRaw).min(1).max(12),
    sort: z.strictObject({ column: z.string().min(1), dir: z.enum(['asc', 'desc']) }).optional(),
    limit: z.number().int().min(1).max(500).optional(),
    searchable: z.boolean().optional(),
    rowClick: z.enum(['openMedia', 'none']).optional(),
  })
  .superRefine((c, ctx) => {
    const headers = c.columns.map((col) => col.header);
    headers.forEach((h, i) => {
      if (headers.indexOf(h) !== i) {
        ctx.addIssue({ code: 'custom', path: ['columns', i, 'header'], message: `duplicate column header "${h}"` });
      }
    });
    if (c.sort && !headers.includes(c.sort.column)) {
      ctx.addIssue({ code: 'custom', path: ['sort', 'column'], message: `sort column "${c.sort.column}" is not one of the table's headers` });
    }
    if (c.rowsAre === 'groups' && !c.groupBy) {
      ctx.addIssue({ code: 'custom', path: ['groupBy'], message: 'rowsAre:"groups" requires a groupBy' });
    }
    if (c.rowsAre === 'records' && c.groupBy) {
      ctx.addIssue({ code: 'custom', path: ['groupBy'], message: 'rowsAre:"records" must not carry a groupBy' });
    }
  });

const widgetSchemaRaw = z.discriminatedUnion('type', [
  // Narrative — the headline element. `focus` is what the LLM emits; the
  // generated* fields are written by the server (generate-on-author) and served
  // to public viewers as static content.
  z.strictObject({
    ...widgetBase,
    type: z.literal('narrative'),
    config: z.strictObject({
      focus: z.string().min(1).max(400),
      generatedText: z.string().max(4000).optional(),
      // z.iso.datetime(), NOT z.string().datetime() — the latter is @deprecated
      // in zod 4 (still functional in 4.4.3, but it will go at the next major).
      generatedAt: z.iso.datetime().optional(),
      generatedForDateRange: dateRangeSchema.optional(),
    }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('stat-cards'),
    config: z.strictObject({
      tiles: z.array(z.strictObject({
        metric: metricSchemaRaw,
        label: z.string().min(1).max(40),
        caption: z.string().max(80).optional(),
        thresholds: thresholdsSchema.optional(),
      })).min(1).max(6),
    }),
  }),

  // The chart workhorse. `series` (a 2nd groupBy dimension) is the single
  // highest-leverage primitive the design spike found — without it, "score over
  // time, one line per person" cannot be drawn.
  z.strictObject({
    ...widgetBase,
    type: z.literal('metric-chart'),
    config: z.strictObject({
      mark: z.enum(['line', 'bar', 'area', 'donut', 'stacked-bar']),
      metric: metricSchemaRaw,
      groupBy: groupBySchema.optional(),
      series: groupBySchema.optional(),
      sort: z.enum(['value-desc', 'value-asc', 'label']).optional(),
      limit: z.number().int().min(1).max(100).optional(),
      thresholds: thresholdsSchema.optional(),
    }),
  }),

  z.strictObject({ ...widgetBase, type: z.literal('table'), config: tableConfigSchema }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('comparison'),
    config: z.strictObject({
      dimension: z.enum(['folder', 'time', 'fieldValue']),
      a: bindingSchemaRaw,
      b: bindingSchemaRaw,
      metrics: z.array(metricSchemaRaw).min(1).max(6),
    }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('field-distribution'),
    config: z.strictObject({
      fieldName: z.string().min(1).max(120), // name, not id
      measure: z.enum(['count', 'percent']),
      chartType: z.enum(['bar', 'donut']),
    }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('sentiment-trend'),
    config: z.strictObject({ granularity: z.enum(['day', 'week', 'month']) }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('themes'),
    config: z.strictObject({ limit: z.number().int().min(1).max(50) }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('people'),
    config: z.strictObject({
      metrics: z.array(metricSchemaRaw).min(1).max(6),
      limit: z.number().int().min(1).max(100),
    }),
  }),

  // team-activity is valid ONLY under an effective source.type === "team"
  // (envelope check 4). It IS publicly shareable; the member `email` is masked
  // by the server-side public serializer, not here.
  z.strictObject({
    ...widgetBase,
    type: z.literal('team-activity'),
    config: z.strictObject({
      metrics: z.array(z.enum(['uploads', 'minutes', 'meetings', 'chatUsage', 'lastActive'])).min(1).max(5),
    }),
  }),

  z.strictObject({
    ...widgetBase,
    type: z.literal('notes'),
    config: z.strictObject({ content: z.string().min(1).max(4000) }),
  }),
]);

export const widgetTypeSchema = z.enum([
  'narrative', 'stat-cards', 'metric-chart', 'table', 'comparison',
  'field-distribution', 'sentiment-trend', 'themes', 'people',
  'team-activity', 'notes',
]);

/* ── Section ─────────────────────────────────────────────────────────────── */

export const sectionSchema = z.strictObject({
  id: z.string().min(1).max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'section id must be kebab-case'),
  title: z.string().min(1).max(24),
  icon: z.string().min(1).max(40).regex(/^[a-z][a-z0-9-]*$/, 'icon must be a kebab-case lucide name'),
  widgetIds: z.array(z.string().min(1).max(64)).max(24),
});

/* ── Envelope ────────────────────────────────────────────────────────────── */

/**
 * Structural base. `widgets`/`sections` carry CAPS only, never minimums — a
 * blank dashboard (zero widgets) is valid, and the spec's "4–16 widgets"
 * guidance is a generation-prompt rule, not a persistence invariant.
 */
const dashboardSpecBaseSchema = z.strictObject({
  title: z.string().min(1).max(60),
  description: z.string().max(280).optional(),
  source: sourceSchema,
  dateRange: dateRangeSchema,
  sections: z.array(sectionSchema).max(12),
  widgets: z.array(widgetSchemaRaw).max(24),
  /** Optimistic-concurrency token. Server-owned; generators omit it. */
  revision: z.number().int().nonnegative().default(0),
});

/* ── Inferred types — the ONLY type source. Never hand-write a parallel. ──── */

export type Filter = z.infer<typeof filterSchemaRaw>;
export type FilterOp = z.infer<typeof filterOpSchema>;
export type Agg = z.infer<typeof aggSchema>;
export type BuiltinMetric = z.infer<typeof builtinMetricSchema>;
export type BaseMetric = z.infer<typeof baseMetricSchemaRaw>;
export type Expr = z.infer<typeof exprSchemaRaw>;
export type Metric = z.infer<typeof metricSchemaRaw>;
export type GroupBy = z.infer<typeof groupBySchema>;
export type Granularity = z.infer<typeof granularitySchema>;
export type Threshold = z.infer<typeof thresholdSchema>;
export type ThresholdStatus = z.infer<typeof thresholdStatusSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type DateRangePreset = z.infer<typeof dateRangePresetSchema>;
export type Binding = z.infer<typeof bindingSchemaRaw>;
export type Column = z.infer<typeof columnSchemaRaw>;
export type WidgetLayout = z.infer<typeof layoutSchema>;
export type Widget = z.infer<typeof widgetSchemaRaw>;
export type WidgetType = z.infer<typeof widgetTypeSchema>;
export type Section = z.infer<typeof sectionSchema>;

/**
 * Drift guard: `widgetTypeSchema` (which drives the editor palette and MCP tool
 * enum) is hand-written, so it can silently fall out of sync with the discriminated
 * union in `widgetSchemaRaw`. This assertion ties the two at compile time — add a
 * variant to one but not the other and `_WidgetTypeParity` resolves to `false`,
 * failing `AssertTrue` and breaking the build. Bidirectional by construction.
 */
type AssertTrue<T extends true> = T;
type WidgetTypeParity = [Widget['type']] extends [WidgetType]
  ? [WidgetType] extends [Widget['type']]
    ? true
    : false
  : false;
type _WidgetTypeParity = AssertTrue<WidgetTypeParity>;

/**
 * Parsed/persisted spec — `revision` is always present.
 *
 * Derived from the BASE schema, not from `dashboardSpecSchema`. The exported
 * envelope is a `z.preprocess` pipe whose INPUT type is `unknown` by
 * construction, so `z.input<typeof dashboardSpecSchema>` would erase the shape.
 */
export type DashboardSpec = z.infer<typeof dashboardSpecBaseSchema>;
/** Input spec — `revision` is optional (generators and the MCP tool omit it). */
export type DashboardSpecInput = z.input<typeof dashboardSpecBaseSchema>;

/** Narrow a widget to one variant: `WidgetOf<'table'>`. */
export type WidgetOf<T extends WidgetType> = Extract<Widget, { type: T }>;

/* ── Public schemas — every filter-containing one carries the depth guard ─── */

export const filterSchema = withDepthGuard(filterSchemaRaw);
export const baseMetricSchema = withDepthGuard(baseMetricSchemaRaw);
export const exprSchema = withDepthGuard(exprSchemaRaw);
export const metricSchema = withDepthGuard(metricSchemaRaw);
export const bindingSchema = withDepthGuard(bindingSchemaRaw);
export const columnSchema = withDepthGuard(columnSchemaRaw);
export const widgetSchema = withDepthGuard(widgetSchemaRaw);

/* ── Field-reference + filter walker ─────────────────────────────────────── */

type Path = (string | number)[];

/**
 * A reference to a field by name, and how it is being used.
 *
 * - `agg`       — an aggregator is applied (must be a number/currency field)
 * - `group`     — used as a `kind:"field"` groupBy (must NOT be date/datetime)
 * - `timeGroup` — used as a `kind:"time"` groupBy (MUST be date/datetime)
 * - `mention`   — merely named (filter predicate, raw table column, distribution).
 *                 Only existence is checked; any field type is fine.
 */
type FieldRef =
  | { use: 'agg'; fieldName: string; agg: Agg; path: Path }
  | { use: 'group'; fieldName: string; path: Path }
  | { use: 'timeGroup'; fieldName: string; path: Path }
  | { use: 'mention'; fieldName: string; path: Path };

/**
 * Everything the envelope's semantic checks need from one widget: every field
 * name it references (for the existence + aggregator checks) and every filter
 * tree it contains (for the nesting-depth check).
 *
 * ONE walker, ONE switch, ONE exhaustiveness guard. Collecting fields and
 * filters in separate walks would mean two switches over widget type, and only
 * one of them would have the `never` guard — so a newly added widget type would
 * silently escape the other check.
 */
interface WidgetRefs {
  fields: FieldRef[];
  filters: Array<{ filter: Filter; path: Path }>;
}

/** Records a filter tree AND every field its predicates name, recursively. */
function addFilter(acc: WidgetRefs, filter: Filter | undefined, path: Path): void {
  if (!filter) return;
  acc.filters.push({ filter, path });
  acc.fields.push(...fieldRefsInFilter(filter, path));
}

/** Walks a filter tree (incl. `and`/`or`) and yields every `field` it names. */
function fieldRefsInFilter(filter: Filter, path: Path): FieldRef[] {
  if ('and' in filter) {
    return filter.and.flatMap((f, i) => fieldRefsInFilter(f, [...path, 'and', i]));
  }
  if ('or' in filter) {
    return filter.or.flatMap((f, i) => fieldRefsInFilter(f, [...path, 'or', i]));
  }
  return [{ use: 'mention', fieldName: filter.field, path: [...path, 'field'] }];
}

function addBaseMetric(acc: WidgetRefs, metric: BaseMetric, path: Path): void {
  if (metric.kind === 'field') {
    acc.fields.push({ use: 'agg', fieldName: metric.fieldName, agg: metric.agg, path: [...path, 'fieldName'] });
  }
  addFilter(acc, metric.filter, [...path, 'filter']);
}

function addMetric(acc: WidgetRefs, metric: Metric, path: Path): void {
  if (metric.kind !== 'expr') {
    addBaseMetric(acc, metric, path);
    return;
  }
  exprOperands(metric.expr).forEach(([key, operand]) =>
    addBaseMetric(acc, operand, [...path, 'expr', key]),
  );
  addFilter(acc, metric.filter, [...path, 'filter']);
}

function addGroupBy(acc: WidgetRefs, groupBy: GroupBy, path: Path): void {
  if (groupBy.kind === 'field') {
    acc.fields.push({ use: 'group', fieldName: groupBy.fieldName, path: [...path, 'fieldName'] });
  } else if (groupBy.kind === 'time') {
    acc.fields.push({ use: 'timeGroup', fieldName: groupBy.fieldName, path: [...path, 'fieldName'] });
  }
  // folder | speaker name no field.
}

function addBinding(acc: WidgetRefs, binding: Binding | undefined, path: Path): void {
  addFilter(acc, binding?.filter, [...path, 'filter']);
}

/**
 * EVERY field name and filter reachable from a widget — all five field sites.
 *
 * Metrics, groupBy/series, and field-distribution are the obvious three. The two
 * that are easy to miss, and that an LLM is most likely to typo, are FILTER
 * PREDICATES (metric-level and binding-level, recursively through and/or) and
 * RAW TABLE COLUMNS. A hallucinated field name in either one validates clean,
 * matches nothing, and renders a confident `0` — a plausible wrong number, which
 * is strictly worse than an error. Do not narrow this function.
 */
function collectWidgetRefs(widget: Widget): WidgetRefs {
  const acc: WidgetRefs = { fields: [], filters: [] };

  // Site 5: per-widget binding filter (applies to every widget type).
  addBinding(acc, widget.binding, ['binding']);

  const c: Path = ['config'];

  switch (widget.type) {
    case 'metric-chart':
      addMetric(acc, widget.config.metric, [...c, 'metric']);
      if (widget.config.groupBy) addGroupBy(acc, widget.config.groupBy, [...c, 'groupBy']);
      if (widget.config.series) addGroupBy(acc, widget.config.series, [...c, 'series']);
      break;

    case 'stat-cards':
      widget.config.tiles.forEach((t, i) => addMetric(acc, t.metric, [...c, 'tiles', i, 'metric']));
      break;

    case 'comparison':
      widget.config.metrics.forEach((m, i) => addMetric(acc, m, [...c, 'metrics', i]));
      // Both sides of a comparison are bindings, and each may carry a filter.
      addBinding(acc, widget.config.a, [...c, 'a']);
      addBinding(acc, widget.config.b, [...c, 'b']);
      break;

    case 'people':
      widget.config.metrics.forEach((m, i) => addMetric(acc, m, [...c, 'metrics', i]));
      break;

    case 'table':
      if (widget.config.groupBy) addGroupBy(acc, widget.config.groupBy, [...c, 'groupBy']);
      widget.config.columns.forEach((col, i) => {
        if ('metric' in col) {
          addMetric(acc, col.metric, [...c, 'columns', i, 'metric']);
        } else {
          // A raw-field column names a field. Easy to miss; unchecked = silent 0.
          acc.fields.push({ use: 'mention', fieldName: col.field, path: [...c, 'columns', i, 'field'] });
        }
      });
      break;

    case 'field-distribution':
      acc.fields.push({ use: 'mention', fieldName: widget.config.fieldName, path: [...c, 'fieldName'] });
      break;

    // Field-free widget types, listed EXPLICITLY — no `default:` clause.
    // A `default: break` would silently exempt any widget type added later, and
    // an unchecked field name is a silent-wrong-number bug. With these spelled
    // out, adding a widget type makes `assertNoFieldRefs` a COMPILE ERROR until
    // someone decides whether it names a field.
    case 'narrative':
    case 'sentiment-trend':
    case 'themes':
    case 'team-activity':
    case 'notes':
      break;

    default:
      assertNoFieldRefs(widget);
  }

  return acc;
}

/** Exhaustiveness guard: a new widget type fails to compile here until handled. */
function assertNoFieldRefs(widget: never): never {
  throw new Error(`unhandled widget type in collectWidgetRefs: ${JSON.stringify(widget)}`);
}

/**
 * The four bounded ops, flattened to `[documentKey, operand]` pairs. The key is
 * the operand's ACTUAL name in the payload (`numerator`, `a`, `metric`, …) so an
 * issue path points at a location the caller can navigate — there is no synthetic
 * `operands` array in the document.
 */
function exprOperands(expr: Expr): Array<[string, BaseMetric]> {
  switch (expr.op) {
    case 'ratio': return [['numerator', expr.numerator], ['denominator', expr.denominator]];
    case 'diff': return [['a', expr.a], ['b', expr.b]];
    case 'delta':
    case 'rank': return [['metric', expr.metric]];
  }
}

/** Nesting depth of a filter tree. A leaf predicate is depth 1. */
function filterDepth(filter: Filter): number {
  if ('and' in filter) return 1 + Math.max(...filter.and.map(filterDepth));
  if ('or' in filter) return 1 + Math.max(...filter.or.map(filterDepth));
  return 1;
}

/* ── The envelope schema ─────────────────────────────────────────────────── */

/**
 * Builds the dashboard spec schema.
 *
 * @param fieldTypes Optional `fieldName → FieldType` map. When supplied, the
 *   aggregator/field-type check (#3) runs and unknown field names are rejected.
 *   When omitted, only the structural checks (#1, #2, #4, #5) run — the resulting
 *   schema is a strict superset, so anything the field-aware schema accepts,
 *   the structural one accepts too.
 *
 *   Pass it on the SERVER (which already loads the company's fields). The
 *   CLIENT may omit it and validate structurally in `zodResolver`; the server
 *   is the authority.
 */
export function buildDashboardSpecSchema(fieldTypes?: FieldTypeMap) {
  const checked = dashboardSpecBaseSchema.superRefine((spec, ctx) => {
    const widgetsById = new Map(spec.widgets.map((w) => [w.id, w]));

    /* ── 1. Referential integrity + uniqueness ───────────────────────────── */
    const seenWidgetIds = new Set<string>();
    spec.widgets.forEach((w, i) => {
      if (seenWidgetIds.has(w.id)) {
        ctx.addIssue({ code: 'custom', path: ['widgets', i, 'id'], message: `duplicate widget id "${w.id}"` });
      }
      seenWidgetIds.add(w.id);
    });

    const seenSectionIds = new Set<string>();
    const claimed = new Set<string>();
    spec.sections.forEach((s, si) => {
      if (seenSectionIds.has(s.id)) {
        ctx.addIssue({ code: 'custom', path: ['sections', si, 'id'], message: `duplicate section id "${s.id}"` });
      }
      seenSectionIds.add(s.id);

      s.widgetIds.forEach((wid, wi) => {
        if (!widgetsById.has(wid)) {
          ctx.addIssue({ code: 'custom', path: ['sections', si, 'widgetIds', wi], message: `section "${s.id}" references unknown widget "${wid}"` });
          return;
        }
        if (claimed.has(wid)) {
          ctx.addIssue({ code: 'custom', path: ['sections', si, 'widgetIds', wi], message: `widget "${wid}" appears in more than one section` });
        }
        claimed.add(wid);
      });
    });

    /* ── 2. Layout collision, PER RESOLVED SECTION ───────────────────────── */
    // Unsectioned widgets form the implicit "Overview" group. `y` restarts at 0
    // in each section, so collisions are only meaningful WITHIN a group.
    for (const group of resolveSectionGroups(spec.sections, spec.widgets)) {
      for (let i = 0; i < group.widgetIds.length; i++) {
        for (let j = i + 1; j < group.widgetIds.length; j++) {
          const a = widgetsById.get(group.widgetIds[i]!);
          const b = widgetsById.get(group.widgetIds[j]!);
          if (!a || !b || !rectsOverlap(a.layout, b.layout)) continue;
          ctx.addIssue({
            code: 'custom',
            path: ['widgets', spec.widgets.indexOf(b), 'layout'],
            message: `widget "${b.id}" overlaps "${a.id}" in section "${group.id}"`,
          });
        }
      }
    }

    /* ── 4. team-activity requires an effective source.type === "team" ────── */
    spec.widgets.forEach((w, i) => {
      if (w.type !== 'team-activity') return;
      const effective = w.binding?.source ?? spec.source;
      if (effective.type !== 'team') {
        ctx.addIssue({ code: 'custom', path: ['widgets', i, 'type'], message: 'team-activity is only valid when the effective source is {type:"team"}' });
      }
    });

    const refsByWidget = spec.widgets.map(collectWidgetRefs);

    /* ── 5. Filter nesting depth (semantic; the structural guard already ran) ─ */
    // Safe to recurse here ONLY because the envelope's z.preprocess has already
    // rejected anything deeper than MAX_JSON_DEPTH. Without that, this check is
    // unreachable — the stack overflows during the recursive filter parse, long
    // before any superRefine runs.
    refsByWidget.forEach((refs, wi) => {
      for (const { filter, path } of refs.filters) {
        if (filterDepth(filter) > MAX_FILTER_DEPTH) {
          ctx.addIssue({
            code: 'custom',
            path: ['widgets', wi, ...path],
            message: `filter nesting exceeds the maximum depth of ${MAX_FILTER_DEPTH}`,
          });
        }
      }
    });

    /* ── 3. Field existence + aggregator/field-type compatibility ──────────── */
    // Context-dependent: runs only when the caller supplied a field-type map.
    // Walks ALL FIVE sites a field name can appear (see collectWidgetRefs) —
    // including filter predicates and raw table columns, the two an LLM is most
    // likely to typo and the two whose failure mode is a confident wrong number.
    if (!fieldTypes) return;

    refsByWidget.forEach((refs, wi) => {
      for (const ref of refs.fields) {
        const path = ['widgets', wi, ...ref.path];
        // Own-property lookup only: a field named after a JS prototype member
        // ("toString", "constructor", "__proto__", …) must resolve to undefined,
        // not to `Object.prototype.toString`, or the unknown-field guard below is
        // bypassed and the widget silently renders a confident 0.
        const type = Object.hasOwn(fieldTypes, ref.fieldName) ? fieldTypes[ref.fieldName] : undefined;

        if (!type) {
          ctx.addIssue({ code: 'custom', path, message: `unknown field "${ref.fieldName}"` });
          continue;
        }

        if (ref.use === 'agg' && NUMERIC_AGGS.has(ref.agg) && !NUMERIC_FIELD_TYPES.has(type)) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `agg "${ref.agg}" requires a number/currency field; "${ref.fieldName}" is ${type}`,
          });
        }

        if (ref.use === 'group' && TEMPORAL_FIELD_TYPES.has(type)) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `field "${ref.fieldName}" is ${type}; grouping it requires kind:"time" with an explicit granularity`,
          });
        }

        if (ref.use === 'timeGroup' && !TEMPORAL_FIELD_TYPES.has(type)) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `grouping by time requires a date/datetime field; "${ref.fieldName}" is ${type}`,
          });
        }
      }
    });
  });

  return withDepthGuard(checked);
}

/** Structural-only schema (checks 1, 2, 4, 5). Safe where field types are unknown. */
export const dashboardSpecSchema = buildDashboardSpecSchema();

export { SECTION_OVERVIEW_ID };
