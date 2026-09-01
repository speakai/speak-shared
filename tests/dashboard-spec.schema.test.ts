/**
 * Dashboard spec v2 — schema tests.
 *
 * The spec is an LLM-facing surface. Hand-picked negatives do not cover it, so
 * this suite is deliberately adversarial: it asserts issue PATHS (not just
 * `success === false`), it feeds pathological depth by construction, and it
 * pins the key names a model is most likely to typo.
 */
import { describe, expect, it } from 'vitest';

import {
  MAX_FILTER_DEPTH,
  MAX_JSON_DEPTH,
  SECTION_OVERVIEW_ID,
  exceedsJsonDepth,
  rectsOverlap,
  resolveSectionGroups,
} from '../src/utils/dashboard-spec.js';
import {
  baseMetricSchema,
  bindingSchema,
  buildDashboardSpecSchema,
  columnSchema,
  dashboardSpecSchema,
  exprSchema,
  fieldRef,
  fieldReferenceSchema,
  filterSchema,
  metricSchema,
  widgetSchema,
  widgetTypeSchema,
} from '../src/schemas/dashboard-spec.schema.js';
import type { DashboardSpec, DashboardSpecInput, FieldTypeMap } from '../src/schemas/dashboard-spec.schema.js';
import * as schemaModule from '../src/schemas/dashboard-spec.schema.js';

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const FIELD_TYPES: FieldTypeMap = {
  Status: 'text',
  Country: 'text',
  Sentiment: 'text',
  Region: 'text',
  'Session Score': 'number',
  Revenue: 'currency',
  Age: 'number',
  'Recorded On': 'datetime',
  'Signed On': 'date',
  Active: 'boolean',
};

/** A valid envelope wrapping the given widgets/sections. */
function specWith(widgets: unknown[] = [], sections: unknown[] = [], overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test dashboard',
    source: { type: 'workspace' },
    dateRange: { preset: 'allTime' },
    sections,
    widgets,
    ...overrides,
  };
}

const LAYOUT = { x: 0, y: 0, w: 6, h: 4 };

/** A metric-chart widget with a swappable config. */
function chart(config: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return {
    id: 'chart-1',
    type: 'metric-chart',
    title: 'Chart',
    layout: LAYOUT,
    config: { mark: 'bar', ...config },
    ...overrides,
  };
}

const MEDIA_COUNT = { kind: 'builtin', name: 'mediaCount' } as const;

/**
 * A filter nested `depth` levels of `and`, built as a STRING.
 *
 * Built by string concatenation on purpose: a recursive JS builder would
 * overflow the harness's own stack at the depths this suite needs, which is the
 * exact failure it exists to detect in the schema.
 */
function deepFilter(depth: number): unknown {
  const leaf = '{"field":"Status","op":"eq","value":"x"}';
  return JSON.parse('{"and":['.repeat(depth) + leaf + ']}'.repeat(depth));
}

/* ── Valid specs parse ───────────────────────────────────────────────────── */

describe('valid specs', () => {
  it('parses a blank canvas — zero widgets, zero sections', () => {
    const result = dashboardSpecSchema.safeParse(specWith());
    expect(result.success).toBe(true);
  });

  it('parses a flat dashboard — widgets, no sections (implicit Overview)', () => {
    const result = dashboardSpecSchema.safeParse(
      specWith([
        chart({ metric: MEDIA_COUNT }),
        { id: 'notes-1', type: 'notes', title: 'Notes', layout: { x: 6, y: 0, w: 6, h: 4 }, config: { content: 'hi' } },
      ]),
    );
    expect(result.success).toBe(true);
  });

  it('defaults `revision` to 0 when omitted', () => {
    const result = dashboardSpecSchema.safeParse(specWith());
    expect(result.success).toBe(true);
    expect((result.data as DashboardSpec).revision).toBe(0);
  });

  it('parses a sectioned dashboard with narrative, series chart, and a rank column', () => {
    const widgets = [
      {
        id: 'summary', type: 'narrative', title: 'Summary', layout: { x: 0, y: 0, w: 12, h: 3 },
        config: { focus: 'How did scoring trend this quarter?', generatedText: 'Scores rose.', generatedAt: '2026-07-13T10:00:00Z' },
      },
      {
        id: 'score-over-time', type: 'metric-chart', title: 'Score over time', layout: { x: 0, y: 3, w: 8, h: 5 },
        config: {
          mark: 'line',
          metric: { kind: 'field', fieldName: 'Session Score', agg: 'avg' },
          groupBy: { kind: 'time', fieldName: 'Recorded On', granularity: 'record' },
          series: { kind: 'speaker' },
          thresholds: [{ when: { op: 'between', value: [0, 50] }, status: 'critical', label: 'Low' }],
        },
      },
      {
        id: 'tiles', type: 'stat-cards', title: 'Tiles', layout: { x: 8, y: 3, w: 4, h: 5 },
        config: {
          tiles: [{
            metric: { kind: 'expr', expr: { op: 'ratio', numerator: MEDIA_COUNT, denominator: MEDIA_COUNT } },
            label: 'Scored ratio',
            thresholds: [{ when: { op: 'gte', value: 0.8 }, status: 'good' }],
          }],
        },
      },
      {
        id: 'leaderboard', type: 'table', title: 'Leaderboard', layout: { x: 0, y: 0, w: 12, h: 6 },
        config: {
          rowsAre: 'groups',
          groupBy: { kind: 'speaker' },
          columns: [
            { header: 'Person', field: 'Country' },
            { header: 'Rank', metric: { kind: 'expr', expr: { op: 'rank', metric: { kind: 'field', fieldName: 'Session Score', agg: 'avg' }, direction: 'desc' } } },
          ],
          sort: { column: 'Rank', dir: 'desc' },
        },
      },
    ];
    const sections = [
      { id: 'overview', title: 'Overview', icon: 'layout-dashboard', widgetIds: ['summary', 'score-over-time', 'tiles'] },
      { id: 'people', title: 'People', icon: 'users', widgetIds: ['leaderboard'] },
    ];

    const result = buildDashboardSpecSchema(FIELD_TYPES).safeParse(specWith(widgets, sections));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it('parses every widget type once', () => {
    const configs: Array<[string, unknown]> = [
      ['narrative', { focus: 'What happened?' }],
      ['stat-cards', { tiles: [{ metric: MEDIA_COUNT, label: 'Media' }] }],
      ['metric-chart', { mark: 'bar', metric: MEDIA_COUNT }],
      ['table', { rowsAre: 'records', columns: [{ header: 'Status', field: 'Status' }] }],
      ['comparison', { dimension: 'folder', a: {}, b: {}, metrics: [MEDIA_COUNT] }],
      ['field-distribution', { fieldName: 'Status', measure: 'count', chartType: 'bar' }],
      ['sentiment-trend', { granularity: 'week' }],
      ['themes', { limit: 10 }],
      ['people', { metrics: [MEDIA_COUNT], limit: 10 }],
      ['team-activity', { metrics: ['uploads'] }],
      ['notes', { content: 'A note' }],
    ];

    const widgets = configs.map(([type, config], i) => ({
      id: `w-${i}`, type, title: `W${i}`, layout: { x: 0, y: i * 4, w: 12, h: 4 }, config,
    }));

    // team-activity requires an effective team source.
    const result = buildDashboardSpecSchema(FIELD_TYPES).safeParse(
      specWith(widgets, [], { source: { type: 'team' } }),
    );
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it('parses a filter nested 3 levels deep', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: { ...MEDIA_COUNT, filter: { and: [{ or: [{ field: 'Status', op: 'eq', value: 'x' }] }] } } }),
    ]));
    expect(result.success).toBe(true);
  });
});

/* ── widgetTypeSchema parity with the widget union ───────────────────────── */

describe('widgetTypeSchema parity with the widget union', () => {
  // The hand-written enum drives the editor palette and the MCP tool enum. The
  // compile-time `_WidgetTypeParity` assertion in the schema module ties it to the
  // widgetSchemaRaw discriminated union (a drift breaks `npm run build`); this pins
  // the runtime option list a consumer iterates so a silent enum edit is caught.
  it('lists exactly the widget discriminator literals', () => {
    expect([...widgetTypeSchema.options].sort()).toEqual([
      'comparison', 'field-distribution', 'metric-chart', 'narrative', 'notes',
      'people', 'sentiment-trend', 'stat-cards', 'table', 'team-activity', 'themes',
    ]);
  });

  it('every enum option is a type widgetSchema accepts as a fully-formed widget', () => {
    const config: Record<string, unknown> = {
      narrative: { focus: 'What happened?' },
      'stat-cards': { tiles: [{ metric: MEDIA_COUNT, label: 'Media' }] },
      'metric-chart': { mark: 'bar', metric: MEDIA_COUNT },
      table: { rowsAre: 'records', columns: [{ header: 'Status', field: 'Status' }] },
      comparison: { dimension: 'folder', a: {}, b: {}, metrics: [MEDIA_COUNT] },
      'field-distribution': { fieldName: 'Status', measure: 'count', chartType: 'bar' },
      'sentiment-trend': { granularity: 'week' },
      themes: { limit: 10 },
      people: { metrics: [MEDIA_COUNT], limit: 10 },
      'team-activity': { metrics: ['uploads'] },
      notes: { content: 'A note' },
    };
    for (const type of widgetTypeSchema.options) {
      const widget = { id: 'w', type, title: 'W', layout: LAYOUT, config: config[type] };
      expect(widgetSchema.safeParse(widget).success, `type "${type}" should parse`).toBe(true);
    }
  });
});

/* ── The bound: expr may not nest inside expr (Decision 1) ───────────────── */

describe('the bound — expr cannot nest inside expr', () => {
  const exprMetric = (expr: unknown) => ({ kind: 'expr', expr });
  const DIFF = { op: 'diff', a: MEDIA_COUNT, b: MEDIA_COUNT };

  it('REJECTS ratio(diff(a,b), diff(c,d)) — the canonical arbitrary-arithmetic payload', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: exprMetric({ op: 'ratio', numerator: exprMetric(DIFF), denominator: exprMetric(DIFF) }) }),
    ]));
    expect(result.success).toBe(false);
  });

  it('rejects ratio(rank(…), builtin) — an expr as a ratio operand', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({
        metric: exprMetric({
          op: 'ratio',
          numerator: exprMetric({ op: 'rank', metric: MEDIA_COUNT, direction: 'desc' }),
          denominator: MEDIA_COUNT,
        }),
      }),
    ]));
    expect(result.success).toBe(false);
  });

  it('rejects delta(expr(…)) — an expr as a delta operand', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: exprMetric({ op: 'delta', metric: exprMetric(DIFF), over: 'prev-period' }) }),
    ]));
    expect(result.success).toBe(false);
  });

  // Negative controls — the bound must reject NESTING, not exprs themselves.
  const FIELD_METRIC = { kind: 'field', fieldName: 'Session Score', agg: 'avg' };
  it.each([
    ['ratio(builtin, builtin)', { op: 'ratio', numerator: MEDIA_COUNT, denominator: MEDIA_COUNT }],
    ['diff(field, field)', { op: 'diff', a: FIELD_METRIC, b: FIELD_METRIC }],
    ['delta(field)', { op: 'delta', metric: FIELD_METRIC, over: 'first-to-last' }],
    ['rank(field)', { op: 'rank', metric: FIELD_METRIC, direction: 'asc' }],
  ])('accepts %s', (_name, expr) => {
    const result = dashboardSpecSchema.safeParse(specWith([chart({ metric: exprMetric(expr) })]));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });
});

/* ── superRefine 1 — referential integrity ───────────────────────────────── */

describe('referential integrity', () => {
  const w = (id: string, y = 0) => chart({ metric: MEDIA_COUNT }, { id, layout: { ...LAYOUT, y } });

  it('rejects a section referencing an unknown widget', () => {
    const result = dashboardSpecSchema.safeParse(specWith(
      [w('chart-a')],
      [{ id: 'sec', title: 'S', icon: 'star', widgetIds: ['ghost'] }],
    ));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'section "sec" references unknown widget "ghost"',
      path: ['sections', 0, 'widgetIds', 0],
    }));
  });

  it('rejects the same widget appearing in two sections', () => {
    const result = dashboardSpecSchema.safeParse(specWith(
      [w('chart-a')],
      [
        { id: 'sec-a', title: 'A', icon: 'star', widgetIds: ['chart-a'] },
        { id: 'sec-b', title: 'B', icon: 'star', widgetIds: ['chart-a'] },
      ],
    ));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'widget "chart-a" appears in more than one section',
      path: ['sections', 1, 'widgetIds', 0],
    }));
  });

  it('rejects a duplicate widget id', () => {
    const result = dashboardSpecSchema.safeParse(specWith([w('dup'), w('dup', 10)]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'duplicate widget id "dup"',
      path: ['widgets', 1, 'id'],
    }));
  });

  it('rejects a duplicate section id', () => {
    const result = dashboardSpecSchema.safeParse(specWith(
      [w('chart-a')],
      [
        { id: 'sec', title: 'A', icon: 'star', widgetIds: ['chart-a'] },
        { id: 'sec', title: 'B', icon: 'star', widgetIds: [] },
      ],
    ));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'duplicate section id "sec"',
      path: ['sections', 1, 'id'],
    }));
  });
});

/* ── superRefine 2 — layout collision ────────────────────────────────────── */

describe('layout collision', () => {
  const at = (id: string, layout: Record<string, number>) => chart({ metric: MEDIA_COUNT }, { id, layout });

  it('rejects two widgets on the identical rect', () => {
    const result = dashboardSpecSchema.safeParse(specWith([at('a', LAYOUT), at('b', LAYOUT)]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'widget "b" overlaps "a" in section "overview"',
      path: ['widgets', 1, 'layout'],
    }));
  });

  it('rejects a partial horizontal overlap', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      at('a', { x: 0, y: 0, w: 6, h: 4 }),
      at('b', { x: 4, y: 0, w: 6, h: 4 }),
    ]));
    expect(result.success).toBe(false);
  });

  it('rejects a vertical overlap', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      at('a', { x: 0, y: 0, w: 6, h: 4 }),
      at('b', { x: 0, y: 2, w: 6, h: 4 }),
    ]));
    expect(result.success).toBe(false);
  });

  it('ACCEPTS the same rect in DIFFERENT sections — y restarts per section', () => {
    const result = dashboardSpecSchema.safeParse(specWith(
      [at('a', LAYOUT), at('b', LAYOUT)],
      [
        { id: 'sec-a', title: 'A', icon: 'star', widgetIds: ['a'] },
        { id: 'sec-b', title: 'B', icon: 'star', widgetIds: ['b'] },
      ],
    ));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it('ACCEPTS a perfect side-by-side split', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      at('a', { x: 0, y: 0, w: 6, h: 4 }),
      at('b', { x: 6, y: 0, w: 6, h: 4 }),
    ]));
    expect(result.success).toBe(true);
  });

  it('rejects x + w overflowing the 12-column grid', () => {
    const result = dashboardSpecSchema.safeParse(specWith([at('a', { x: 8, y: 0, w: 6, h: 4 })]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'layout', 'w'],
    }));
  });
});

/* ── superRefine 3 — aggregator / field type ─────────────────────────────── */

describe('aggregator / field-type compatibility', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);
  const metricChart = (metric: unknown) => specWith([chart({ metric })]);

  it('rejects avg on a text field', () => {
    const result = schema.safeParse(metricChart({ kind: 'field', fieldName: 'Status', agg: 'avg' }));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'agg "avg" requires a number/currency field; "Status" is text',
      path: ['widgets', 0, 'config', 'metric', 'fieldName'],
    }));
  });

  it('accepts sum on a currency field', () => {
    const result = schema.safeParse(metricChart({ kind: 'field', fieldName: 'Revenue', agg: 'sum' }));
    expect(result.success).toBe(true);
  });

  it('accepts count on a text field — count/countDistinct are type-agnostic', () => {
    const result = schema.safeParse(metricChart({ kind: 'field', fieldName: 'Status', agg: 'count' }));
    expect(result.success).toBe(true);
  });

  it.each(['Recorded On', 'Signed On'])('rejects groupBy kind:"field" on the temporal field %s', (fieldName) => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'field', fieldName } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'config', 'groupBy', 'fieldName'],
    }));
  });

  it('accepts groupBy kind:"time" with an explicit granularity on a datetime field', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'Recorded On', granularity: 'record' } }),
    ]));
    expect(result.success).toBe(true);
  });

  it.each(['Status', 'Age', 'Active'])('rejects groupBy kind:"time" on the non-temporal field %s', (fieldName) => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName, granularity: 'month' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: expect.stringContaining('grouping by time requires a date/datetime field'),
      path: ['widgets', 0, 'config', 'groupBy', 'fieldName'],
    }));
  });

  it('rejects a time series (2nd dimension) on a non-temporal field', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, series: { kind: 'time', fieldName: 'Status', granularity: 'week' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'config', 'series', 'fieldName'],
    }));
  });

  it('degrades structurally with NO field map — the same bad-agg spec parses', () => {
    const result = dashboardSpecSchema.safeParse(metricChart({ kind: 'field', fieldName: 'Status', agg: 'avg' }));
    expect(result.success).toBe(true);
  });
});

/* ── superRefine 3 — unknown field, at every one of the five sites ───────── */

describe('unknown field name — all five sites', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  const cases: Array<[string, unknown[], (string | number)[]]> = [
    [
      'metric fieldName',
      [chart({ metric: { kind: 'field', fieldName: 'Sessionn Score', agg: 'avg' } })],
      ['widgets', 0, 'config', 'metric', 'fieldName'],
    ],
    [
      'groupBy fieldName',
      [chart({ metric: MEDIA_COUNT, groupBy: { kind: 'field', fieldName: 'Countryy' } })],
      ['widgets', 0, 'config', 'groupBy', 'fieldName'],
    ],
    [
      'series fieldName',
      [chart({ metric: MEDIA_COUNT, series: { kind: 'field', fieldName: 'Countryy' } })],
      ['widgets', 0, 'config', 'series', 'fieldName'],
    ],
    [
      'field-distribution fieldName',
      [{ id: 'fd', type: 'field-distribution', title: 'FD', layout: LAYOUT, config: { fieldName: 'Sentimentt', measure: 'count', chartType: 'bar' } }],
      ['widgets', 0, 'config', 'fieldName'],
    ],
    [
      'Filter.field — metric-level',
      [chart({ metric: { ...MEDIA_COUNT, filter: { field: 'Statuss', op: 'eq', value: 'Scored' } } })],
      ['widgets', 0, 'config', 'metric', 'filter', 'field'],
    ],
    [
      'Filter.field — nested two levels inside and/or',
      [chart({
        metric: {
          ...MEDIA_COUNT,
          filter: { and: [{ field: 'Status', op: 'eq', value: 'x' }, { or: [{ field: 'Ageee', op: 'gte', value: 30 }] }] },
        },
      })],
      ['widgets', 0, 'config', 'metric', 'filter', 'and', 1, 'or', 0, 'field'],
    ],
    [
      'Filter.field — widget binding',
      [chart({ metric: MEDIA_COUNT }, { binding: { filter: { field: 'Regionn', op: 'exists' } } })],
      ['widgets', 0, 'binding', 'filter', 'field'],
    ],
    [
      'Filter.field — comparison.a binding',
      [{
        id: 'cmp', type: 'comparison', title: 'Cmp', layout: LAYOUT,
        config: { dimension: 'folder', a: { filter: { field: 'Regionn', op: 'exists' } }, b: {}, metrics: [MEDIA_COUNT] },
      }],
      ['widgets', 0, 'config', 'a', 'filter', 'field'],
    ],
    [
      'Filter.field — comparison.b binding',
      [{
        id: 'cmp', type: 'comparison', title: 'Cmp', layout: LAYOUT,
        config: { dimension: 'folder', a: {}, b: { filter: { field: 'Regionn', op: 'exists' } }, metrics: [MEDIA_COUNT] },
      }],
      ['widgets', 0, 'config', 'b', 'filter', 'field'],
    ],
    [
      'raw table column field',
      [{
        id: 'tbl', type: 'table', title: 'T', layout: LAYOUT,
        config: { rowsAre: 'records', columns: [{ header: 'Status', field: 'Statuss' }] },
      }],
      ['widgets', 0, 'config', 'columns', 0, 'field'],
    ],
  ];

  it.each(cases)('rejects a hallucinated field at: %s', (_name, widgets, path) => {
    const result = schema.safeParse(specWith(widgets));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({ path }));
  });

  // A field named after a JS prototype member must NOT resolve via prototype
  // lookup ("toString" → Object.prototype.toString). Left unguarded, the
  // unknown-field check is bypassed and the widget silently renders a 0.
  it.each(['toString', 'constructor', 'hasOwnProperty', 'valueOf', '__proto__'])(
    'treats prototype-named field "%s" as unknown at a mention site (filter predicate)',
    (fieldName) => {
      const result = schema.safeParse(specWith([
        chart({ metric: { ...MEDIA_COUNT, filter: { field: fieldName, op: 'exists' } } }),
      ]));
      expect(result.success).toBe(false);
      expect(result.error!.issues).toContainEqual(expect.objectContaining({
        message: `unknown field "${fieldName}"`,
        path: ['widgets', 0, 'config', 'metric', 'filter', 'field'],
      }));
    },
  );

  it('treats a prototype-named field as unknown at an agg site — no garbage type in the message', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: { kind: 'field', fieldName: 'toString', agg: 'sum' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "toString"',
      path: ['widgets', 0, 'config', 'metric', 'fieldName'],
    }));
  });

  // THE HEADLINE CASE — hallucinated field, two levels deep, inside an expr
  // operand's filter. Assert the EXACT path: a vague path is an error the LLM
  // cannot self-correct from, and it is how you catch a walker that descends but
  // mislabels.
  it('rejects a hallucinated field two levels deep inside an expr operand filter — exact path', () => {
    const widget = {
      id: 'scored-ratio', type: 'metric-chart', title: 'Scored ratio',
      layout: { x: 0, y: 0, w: 6, h: 4 },
      config: {
        mark: 'bar',
        metric: {
          kind: 'expr',
          expr: {
            op: 'ratio',
            numerator: {
              kind: 'builtin', name: 'mediaCount',
              filter: {
                and: [
                  { field: 'Status', op: 'eq', value: 'Scored' },
                  { or: [{ field: 'Ageee', op: 'gte', value: 30 }] },
                ],
              },
            },
            denominator: { kind: 'field', fieldName: 'Session Score', agg: 'avg' },
          },
        },
      },
    };

    const result = buildDashboardSpecSchema({ Status: 'text', 'Session Score': 'number' })
      .safeParse(specWith([widget]));

    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "Ageee"',
      // The operand's REAL document key is `numerator` — not a synthetic
      // `operands[0]` segment. The path must be navigable in the input payload.
      path: ['widgets', 0, 'config', 'metric', 'expr', 'numerator', 'filter', 'and', 1, 'or', 0, 'field'],
    }));
  });

  it('addresses a diff operand by its real `b` key, not a synthetic operands index', () => {
    const result = buildDashboardSpecSchema({ 'Session Score': 'number' }).safeParse(specWith([
      chart({ metric: { kind: 'expr', expr: { op: 'diff', a: MEDIA_COUNT, b: { kind: 'field', fieldName: 'Scoree', agg: 'avg' } } } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "Scoree"',
      path: ['widgets', 0, 'config', 'metric', 'expr', 'b', 'fieldName'],
    }));
  });
});

/* ── superRefine 5 + the structural guard — depth (Decision 6) ────────────── */

describe('filter depth', () => {
  it(`accepts a filter nested exactly ${MAX_FILTER_DEPTH} deep`, () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: { ...MEDIA_COUNT, filter: deepFilter(MAX_FILTER_DEPTH - 1) } }),
    ]));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it(`rejects a filter nested ${MAX_FILTER_DEPTH + 1} deep, naming the limit`, () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: { ...MEDIA_COUNT, filter: deepFilter(MAX_FILTER_DEPTH) } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: `filter nesting exceeds the maximum depth of ${MAX_FILTER_DEPTH}`,
      path: ['widgets', 0, 'config', 'metric', 'filter'],
    }));
  });

  it('applies the depth cap to binding.filter too, not just metric filters', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT }, { binding: { filter: deepFilter(MAX_FILTER_DEPTH) } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'binding', 'filter'],
    }));
  });

  // THE DEPTH LADDER. The THROW is the bug: an uncaught RangeError from
  // safeParse is a 500 where a 400 belongs. `.not.toThrow()` is the assertion
  // that matters — `success === false` alone would pass even while throwing.
  it.each([3, 5, 6, 50, 1200, 5000])('depth %i — safeParse never throws', (depth) => {
    const payload = specWith([chart({ metric: { ...MEDIA_COUNT, filter: deepFilter(depth) } })]);
    expect(() => dashboardSpecSchema.safeParse(payload)).not.toThrow();
  });

  it.each([6, 50, 1200, 5000])('depth %i — rejected cleanly with success:false', (depth) => {
    const payload = specWith([chart({ metric: { ...MEDIA_COUNT, filter: deepFilter(depth) } })]);
    const result = dashboardSpecSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBeGreaterThan(0);
  });

  it('a depth-1200 payload is only ~12 KB and survives JSON.parse — the body parser hands it straight to us', () => {
    // Measure and parse the RAW JSON string the body parser would receive. Stringifying a
    // 1200-deep OBJECT recurses ~1200 frames and overflows the smaller Windows stack — that's
    // a JSON.stringify limitation, not what this test is about (JSON.parse of this depth survives
    // everywhere, as the depth-ladder tests confirm, and the iterative guard rejects it before zod).
    const leaf = '{"field":"Status","op":"eq","value":"x"}';
    const filterJson = '{"and":['.repeat(1200) + leaf + ']}'.repeat(1200);
    expect(filterJson.length).toBeLessThan(64_000);
    expect(() => JSON.parse(filterJson)).not.toThrow();
  });

  // Negative control: the deepest LEGAL spec must still parse. If this ever
  // fails, RAISE MAX_JSON_DEPTH — do not lower the filter depth.
  it(`a maximally-deep legal spec parses — MAX_JSON_DEPTH (${MAX_JSON_DEPTH}) does not reject legitimate specs`, () => {
    // widget → config → columns → metric → expr → operand → filter nested 5.
    const deepestLegalFilter = deepFilter(MAX_FILTER_DEPTH - 1);
    const result = dashboardSpecSchema.safeParse(specWith([{
      id: 'deep-table', type: 'table', title: 'Deep', layout: LAYOUT,
      config: {
        rowsAre: 'records',
        columns: [{
          header: 'Ratio',
          metric: {
            kind: 'expr',
            expr: {
              op: 'ratio',
              numerator: { ...MEDIA_COUNT, filter: deepestLegalFilter },
              denominator: { ...MEDIA_COUNT, filter: deepestLegalFilter },
            },
          },
        }],
      },
    }]));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });
});

/* ── Every exported filter-containing schema carries the guard ───────────── */

describe('no unguarded schema in the public surface', () => {
  const DEEP = deepFilter(5000);

  // Each entry feeds its schema a depth-5000 payload: it must reject, not throw.
  // NOTE: this list is hand-maintained — appending a schema here is NOT automatic.
  // The `guarded list covers the public surface` canary below is the mechanical
  // backstop: it fails when ANY new schema is exported, forcing a decision about
  // whether that schema is filter-containing and therefore needs withDepthGuard().
  const guarded: Array<[string, { safeParse: (v: unknown) => { success: boolean } }, unknown]> = [
    ['filterSchema', filterSchema, DEEP],
    ['baseMetricSchema', baseMetricSchema, { kind: 'builtin', name: 'mediaCount', filter: DEEP }],
    ['exprSchema', exprSchema, { op: 'diff', a: { kind: 'builtin', name: 'mediaCount', filter: DEEP }, b: MEDIA_COUNT }],
    ['metricSchema', metricSchema, { kind: 'builtin', name: 'mediaCount', filter: DEEP }],
    ['bindingSchema', bindingSchema, { filter: DEEP }],
    ['columnSchema', columnSchema, { header: 'H', metric: { kind: 'builtin', name: 'mediaCount', filter: DEEP } }],
    ['widgetSchema', widgetSchema, chart({ metric: MEDIA_COUNT }, { binding: { filter: DEEP } })],
    ['dashboardSpecSchema', dashboardSpecSchema, specWith([chart({ metric: { ...MEDIA_COUNT, filter: DEEP } })])],
  ];

  it.each(guarded)('%s rejects a depth-5000 payload without throwing', (_name, schema, payload) => {
    expect(() => schema.safeParse(payload)).not.toThrow();
    expect(schema.safeParse(payload).success).toBe(false);
  });

  it.each(guarded)('%s still parses a legitimate shallow payload', (name, schema) => {
    const ok: Record<string, unknown> = {
      filterSchema: { field: 'Status', op: 'eq', value: 'x' },
      baseMetricSchema: MEDIA_COUNT,
      exprSchema: { op: 'diff', a: MEDIA_COUNT, b: MEDIA_COUNT },
      metricSchema: MEDIA_COUNT,
      bindingSchema: { filter: { field: 'Status', op: 'exists' } },
      columnSchema: { header: 'H', field: 'Status' },
      widgetSchema: chart({ metric: MEDIA_COUNT }),
      dashboardSpecSchema: specWith(),
    };
    expect(schema.safeParse(ok[name]).success).toBe(true);
  });

  // Mechanical backstop for the hand-maintained `guarded` list. Enumerates the
  // ACTUAL exported schema surface; a newly exported schema fails this until the
  // author accounts for it — and, if it can transitively hold a Filter, adds it to
  // `guarded` above with withDepthGuard(). Without this, a new unguarded
  // filter-schema export would reintroduce the depth-500 RangeError undetected.
  it('the guarded list covers every exported schema (canary — no silent new export)', () => {
    const exportedSchemas = Object.entries(schemaModule)
      .filter(([, v]) => typeof (v as { safeParse?: unknown } | undefined)?.safeParse === 'function')
      .map(([name]) => name)
      .sort();

    // Filter-containing schemas MUST appear in `guarded` above with a depth guard.
    const filterContaining = new Set(guarded.map(([name]) => name));
    // Filter-FREE exported schemas — safe without a depth guard.
    const filterFree = [
      'filterOpSchema', 'aggSchema', 'builtinMetricSchema', 'granularitySchema',
      'groupBySchema', 'thresholdStatusSchema', 'thresholdSchema', 'sourceSchema',
      'dateRangePresetSchema', 'dateRangeSchema', 'layoutSchema', 'widgetTypeSchema',
      'sectionSchema', 'fieldReferenceSchema',
    ];
    const accountedFor = [...filterContaining, ...filterFree].sort();

    expect(exportedSchemas).toEqual(accountedFor);
  });
});

/* ── superRefine 4 — team-activity ───────────────────────────────────────── */

describe('team-activity source requirement', () => {
  const teamWidget = (overrides: Record<string, unknown> = {}) => ({
    id: 'ta', type: 'team-activity', title: 'Team', layout: LAYOUT,
    config: { metrics: ['uploads', 'minutes'] }, ...overrides,
  });

  it('rejects team-activity under a folders source', () => {
    const result = dashboardSpecSchema.safeParse(
      specWith([teamWidget()], [], { source: { type: 'folders', folderIds: ['f1'] } }),
    );
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'team-activity is only valid when the effective source is {type:"team"}',
      path: ['widgets', 0, 'type'],
    }));
  });

  it('accepts team-activity when binding.source overrides a folders dashboard to team', () => {
    const result = dashboardSpecSchema.safeParse(specWith(
      [teamWidget({ binding: { source: { type: 'team' } } })],
      [],
      { source: { type: 'folders', folderIds: ['f1'] } },
    ));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });
});

/* ── Local refinements ───────────────────────────────────────────────────── */

describe('filter op/value coherence', () => {
  const withFilter = (filter: unknown) => specWith([chart({ metric: { ...MEDIA_COUNT, filter } })]);

  it('rejects op:"in" with a scalar value', () => {
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'in', value: 'x' })).success).toBe(false);
  });

  it('rejects op:"exists" carrying a value', () => {
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'exists', value: 'x' })).success).toBe(false);
  });

  it('rejects op:"eq" with no value', () => {
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'eq' })).success).toBe(false);
  });

  it('rejects op:"eq" with an array value', () => {
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'eq', value: ['a', 'b'] })).success).toBe(false);
  });

  it('accepts op:"in" with an array and op:"notExists" with no value', () => {
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'in', value: ['a', 'b'] })).success).toBe(true);
    expect(dashboardSpecSchema.safeParse(withFilter({ field: 'Status', op: 'notExists' })).success).toBe(true);
  });
});

describe('threshold op/value coherence', () => {
  const withThresholds = (thresholds: unknown) =>
    specWith([chart({ metric: MEDIA_COUNT, thresholds })]);

  it('rejects {op:"gte", value:[1,2]}', () => {
    expect(dashboardSpecSchema.safeParse(withThresholds([{ when: { op: 'gte', value: [1, 2] }, status: 'good' }])).success).toBe(false);
  });

  it('rejects {op:"between", value:5}', () => {
    expect(dashboardSpecSchema.safeParse(withThresholds([{ when: { op: 'between', value: 5 }, status: 'good' }])).success).toBe(false);
  });

  it('accepts {op:"between", value:[1,2]} and {op:"lt", value:5}', () => {
    expect(dashboardSpecSchema.safeParse(withThresholds([
      { when: { op: 'between', value: [1, 2] }, status: 'warn' },
      { when: { op: 'lt', value: 5 }, status: 'critical' },
    ])).success).toBe(true);
  });

  it('rejects {op:"between", value:[50,0]} — reversed bounds never fire', () => {
    const result = dashboardSpecSchema.safeParse(withThresholds([{ when: { op: 'between', value: [50, 0] }, status: 'good' }]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'between bounds must be [low, high]',
      path: ['widgets', 0, 'config', 'thresholds', 0, 'when', 'value'],
    }));
  });

  it('accepts {op:"between", value:[5,5]} — an equal-bounds band is degenerate but valid', () => {
    expect(dashboardSpecSchema.safeParse(withThresholds([{ when: { op: 'between', value: [5, 5] }, status: 'good' }])).success).toBe(true);
  });
});

describe('table config', () => {
  const table = (config: Record<string, unknown>) =>
    specWith([{ id: 'tbl', type: 'table', title: 'T', layout: LAYOUT, config }]);

  it('rejects a sort column that is not one of the headers', () => {
    const result = dashboardSpecSchema.safeParse(table({
      rowsAre: 'records',
      columns: [{ header: 'Status', field: 'Status' }],
      sort: { column: 'Nope', dir: 'asc' },
    }));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'config', 'sort', 'column'],
    }));
  });

  it('rejects duplicate column headers', () => {
    const result = dashboardSpecSchema.safeParse(table({
      rowsAre: 'records',
      columns: [{ header: 'Status', field: 'Status' }, { header: 'Status', field: 'Country' }],
    }));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'config', 'columns', 1, 'header'],
    }));
  });

  it('rejects rowsAre:"groups" with no groupBy', () => {
    const result = dashboardSpecSchema.safeParse(table({
      rowsAre: 'groups',
      columns: [{ header: 'Status', field: 'Status' }],
    }));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      path: ['widgets', 0, 'config', 'groupBy'],
    }));
  });

  it('rejects rowsAre:"records" carrying a groupBy — a meaningless combination', () => {
    const result = dashboardSpecSchema.safeParse(table({
      rowsAre: 'records',
      groupBy: { kind: 'folder' },
      columns: [{ header: 'Status', field: 'Status' }],
    }));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'rowsAre:"records" must not carry a groupBy',
      path: ['widgets', 0, 'config', 'groupBy'],
    }));
  });

  it('rejects a column carrying BOTH field and metric', () => {
    const result = dashboardSpecSchema.safeParse(table({
      rowsAre: 'records',
      columns: [{ header: 'Status', field: 'Status', metric: MEDIA_COUNT }],
    }));
    expect(result.success).toBe(false);
  });
});

/* ── Strictness / key drift (R14) ────────────────────────────────────────── */

describe('strictness — unknown keys are rejected, never stripped', () => {
  it.each([
    ['envelope', specWith([], [], { bogus: 1 })],
    ['widget', specWith([chart({ metric: MEDIA_COUNT }, { bogus: 1 })])],
    ['widget config', specWith([chart({ metric: MEDIA_COUNT, bogus: 1 })])],
    ['metric', specWith([chart({ metric: { ...MEDIA_COUNT, bogus: 1 } })])],
    ['filter', specWith([chart({ metric: { ...MEDIA_COUNT, filter: { field: 'Status', op: 'exists', bogus: 1 } } })])],
    ['layout', specWith([chart({ metric: MEDIA_COUNT }, { layout: { ...LAYOUT, bogus: 1 } })])],
    ['section', specWith([], [{ id: 'sec', title: 'S', icon: 'star', widgetIds: [], bogus: 1 }])],
    ['threshold', specWith([chart({ metric: MEDIA_COUNT, thresholds: [{ when: { op: 'gte', value: 1 }, status: 'good', bogus: 1 }] })])],
  ])('rejects an unknown key on the %s', (_site, payload) => {
    expect(dashboardSpecSchema.safeParse(payload).success).toBe(false);
  });

  // KEY-DRIFT CANARIES. Zod's default (non-strict) behaviour would silently
  // STRIP each wrong key below — leaving a user with a setting they configured
  // and a dashboard that ignores it. Same trust-bug family as a confident zero.
  describe('key-drift canaries — wrong key rejected, right key accepted', () => {
    const FIELD_OK = { kind: 'field', fieldName: 'Session Score', agg: 'avg' };

    const drifts: Array<[string, unknown, unknown]> = [
      [
        'agg (not "aggregator")',
        specWith([chart({ metric: { kind: 'field', fieldName: 'Session Score', aggregator: 'avg' } })]),
        specWith([chart({ metric: FIELD_OK })]),
      ],
      [
        'fieldName on a metric (not "field" — Filter uses `field`, Metric uses `fieldName`)',
        specWith([chart({ metric: { kind: 'field', field: 'Session Score', agg: 'avg' } })]),
        specWith([chart({ metric: FIELD_OK })]),
      ],
      [
        'folderIds (not "folders")',
        specWith([], [], { source: { type: 'folders', folders: ['f1'] } }),
        specWith([], [], { source: { type: 'folders', folderIds: ['f1'] } }),
      ],
      [
        'groupBy (not "groupby")',
        specWith([chart({ metric: MEDIA_COUNT, groupby: { kind: 'folder' } })]),
        specWith([chart({ metric: MEDIA_COUNT, groupBy: { kind: 'folder' } })]),
      ],
      [
        'groupBy (not "group_by")',
        specWith([chart({ metric: MEDIA_COUNT, group_by: { kind: 'folder' } })]),
        specWith([chart({ metric: MEDIA_COUNT, groupBy: { kind: 'folder' } })]),
      ],
      [
        'series (not "secondary")',
        specWith([chart({ metric: MEDIA_COUNT, secondary: { kind: 'speaker' } })]),
        specWith([chart({ metric: MEDIA_COUNT, series: { kind: 'speaker' } })]),
      ],
      [
        'rowsAre (not "rows")',
        specWith([{ id: 'tbl', type: 'table', title: 'T', layout: LAYOUT, config: { rows: 'records', columns: [{ header: 'S', field: 'Status' }] } }]),
        specWith([{ id: 'tbl', type: 'table', title: 'T', layout: LAYOUT, config: { rowsAre: 'records', columns: [{ header: 'S', field: 'Status' }] } }]),
      ],
      [
        'status on a threshold (not "severity")',
        specWith([chart({ metric: MEDIA_COUNT, thresholds: [{ when: { op: 'gte', value: 1 }, severity: 'good' }] })]),
        specWith([chart({ metric: MEDIA_COUNT, thresholds: [{ when: { op: 'gte', value: 1 }, status: 'good' }] })]),
      ],
    ];

    it.each(drifts)('%s', (_name, wrong, right) => {
      expect(dashboardSpecSchema.safeParse(wrong).success).toBe(false);
      expect(dashboardSpecSchema.safeParse(right).success).toBe(true);
    });
  });
});

/* ── Fuzz ────────────────────────────────────────────────────────────────── */

describe('fuzz — safeParse never throws', () => {
  const WIDGET_TYPES = [
    'narrative', 'stat-cards', 'metric-chart', 'table', 'comparison', 'field-distribution',
    'sentiment-trend', 'themes', 'people', 'team-activity', 'notes', 'not-a-widget',
  ];
  const LEAVES = [0, 1, -1, 1.5, '', 'x', true, false, null, undefined, [], {}, NaN];

  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;

  function randomValue(depth: number): unknown {
    if (depth > 3 || rand() < 0.4) return pick(LEAVES);
    if (rand() < 0.5) return Array.from({ length: Math.floor(rand() * 3) }, () => randomValue(depth + 1));
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < Math.floor(rand() * 4); i++) {
      obj[pick(['id', 'type', 'title', 'config', 'layout', 'metric', 'filter', 'kind', 'op', 'zzz'])] = randomValue(depth + 1);
    }
    return obj;
  }

  it('500 structurally random payloads — never throws, never hangs', () => {
    for (let i = 0; i < 500; i++) {
      const payload = {
        title: randomValue(2),
        source: randomValue(1),
        dateRange: randomValue(1),
        sections: randomValue(1),
        widgets: [{ type: pick(WIDGET_TYPES), id: randomValue(2), config: randomValue(0), layout: randomValue(1) }],
      };
      expect(() => dashboardSpecSchema.safeParse(payload)).not.toThrow();
      expect(() => buildDashboardSpecSchema(FIELD_TYPES).safeParse(payload)).not.toThrow();
    }
  });

  it('mutation fuzz — deleting or retyping any leaf of a valid spec never crashes', () => {
    const valid = specWith([chart({ metric: { ...MEDIA_COUNT, filter: { and: [{ field: 'Status', op: 'eq', value: 'x' }] } } })]);
    const keys = ['title', 'source', 'dateRange', 'sections', 'widgets'] as const;

    for (const key of keys) {
      const deleted: Record<string, unknown> = { ...valid };
      delete deleted[key];
      expect(() => dashboardSpecSchema.safeParse(deleted)).not.toThrow();

      const retyped = { ...valid, [key]: pick(LEAVES) };
      expect(() => dashboardSpecSchema.safeParse(retyped)).not.toThrow();
    }
  });

  it('round-trip — parse(JSON round-trip of a spec) deep-equals parse(spec)', () => {
    const spec = specWith(
      [chart({ metric: { kind: 'expr', expr: { op: 'diff', a: MEDIA_COUNT, b: MEDIA_COUNT } } })],
      [{ id: 'sec', title: 'S', icon: 'star', widgetIds: ['chart-1'] }],
    );
    const direct = dashboardSpecSchema.safeParse(spec);
    const roundTripped = dashboardSpecSchema.safeParse(JSON.parse(JSON.stringify(spec)));

    expect(direct.success).toBe(true);
    expect(roundTripped.success).toBe(true);
    expect(roundTripped.data).toEqual(direct.data);
    // No `.transform` may sneak in: what we store must equal what we parsed.
    expect(direct.data).toEqual({ ...spec, revision: 0 });
  });
});

/* ── Type-level contract (R9) ────────────────────────────────────────────── */

describe('input vs output types', () => {
  it('DashboardSpecInput omits revision; DashboardSpec requires it', () => {
    const input: DashboardSpecInput = {
      title: 'T', source: { type: 'team' },
      dateRange: { preset: 'allTime' }, sections: [], widgets: [],
    };
    const parsed = dashboardSpecSchema.safeParse(input);
    expect(parsed.success).toBe(true);

    const output: DashboardSpec = parsed.data as DashboardSpec;
    const revision: number = output.revision;
    expect(revision).toBe(0);
  });
});

/* ── Pure helpers ────────────────────────────────────────────────────────── */

describe('resolveSectionGroups', () => {
  const widgets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('zero sections → one implicit Overview holding every widget', () => {
    const groups = resolveSectionGroups([], widgets);
    expect(groups).toEqual([
      { id: SECTION_OVERVIEW_ID, title: 'Overview', icon: 'layout-dashboard', widgetIds: ['a', 'b', 'c'], isImplicit: true },
    ]);
  });

  it('all widgets claimed → no implicit group', () => {
    const groups = resolveSectionGroups(
      [{ id: 'sec', title: 'S', icon: 'star', widgetIds: ['a', 'b', 'c'] }],
      widgets,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.isImplicit).toBe(false);
  });

  it('an explicit section already using id "overview" → orphans appended, no duplicate group', () => {
    const groups = resolveSectionGroups(
      [{ id: SECTION_OVERVIEW_ID, title: 'Custom', icon: 'star', widgetIds: ['a'] }],
      widgets,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.title).toBe('Custom');
    expect(groups[0]!.isImplicit).toBe(false);
    expect(groups[0]!.widgetIds).toEqual(['a', 'b', 'c']);
  });

  it('zero widgets, zero sections → []', () => {
    expect(resolveSectionGroups([], [])).toEqual([]);
  });

  it('the implicit Overview is PREPENDED so the narrative still leads', () => {
    const groups = resolveSectionGroups(
      [{ id: 'people', title: 'People', icon: 'users', widgetIds: ['c'] }],
      widgets,
    );
    expect(groups.map((g) => g.id)).toEqual([SECTION_OVERVIEW_ID, 'people']);
  });
});

describe('rectsOverlap', () => {
  it.each([
    ['identical', { x: 0, y: 0, w: 6, h: 4 }, { x: 0, y: 0, w: 6, h: 4 }, true],
    ['partial horizontal', { x: 0, y: 0, w: 6, h: 4 }, { x: 4, y: 0, w: 6, h: 4 }, true],
    ['partial vertical', { x: 0, y: 0, w: 6, h: 4 }, { x: 0, y: 2, w: 6, h: 4 }, true],
    ['side by side', { x: 0, y: 0, w: 6, h: 4 }, { x: 6, y: 0, w: 6, h: 4 }, false],
    ['stacked', { x: 0, y: 0, w: 6, h: 4 }, { x: 0, y: 4, w: 6, h: 4 }, false],
  ])('%s', (_name, a, b, expected) => {
    expect(rectsOverlap(a, b)).toBe(expected);
    expect(rectsOverlap(b, a)).toBe(expected);
  });
});

describe('exceedsJsonDepth', () => {
  it('is iterative — a depth-50000 payload does not overflow the checker itself', () => {
    const deep = JSON.parse('{"a":'.repeat(50_000) + '1' + '}'.repeat(50_000));
    expect(() => exceedsJsonDepth(deep, MAX_JSON_DEPTH)).not.toThrow();
    expect(exceedsJsonDepth(deep, MAX_JSON_DEPTH)).toBe(true);
  });

  it('accepts shallow payloads and primitives', () => {
    expect(exceedsJsonDepth({ a: { b: 1 } }, MAX_JSON_DEPTH)).toBe(false);
    expect(exceedsJsonDepth(null, MAX_JSON_DEPTH)).toBe(false);
    expect(exceedsJsonDepth('x', MAX_JSON_DEPTH)).toBe(false);
  });

  it('counts array nesting as depth too', () => {
    const nested = JSON.parse('['.repeat(60) + ']'.repeat(60));
    expect(exceedsJsonDepth(nested, MAX_JSON_DEPTH)).toBe(true);
  });
});

/* ── Reserved media timestamp: `createdAt` ───────────────────────────────── */

describe('reserved "createdAt" name', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  it('is valid as a raw records-table column', () => {
    const result = schema.safeParse(specWith([
      {
        id: 'tbl', type: 'table', title: 'T', layout: LAYOUT,
        config: {
          rowsAre: 'records',
          columns: [{ header: 'Date', field: 'createdAt' }, { header: 'Status', field: 'Status' }],
        },
      },
    ]));
    expect(result.success).toBe(true);
  });

  it('is valid as a kind:"time" groupBy', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'createdAt', granularity: 'week' } }),
    ]));
    expect(result.success).toBe(true);
  });

  it('stays unknown as a kind:"field" groupBy', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'field', fieldName: 'createdAt' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "createdAt"',
      path: ['widgets', 0, 'config', 'groupBy', 'fieldName'],
    }));
  });

  it('stays unknown under an aggregator', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: { kind: 'field', fieldName: 'createdAt', agg: 'avg' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "createdAt"',
      path: ['widgets', 0, 'config', 'metric', 'fieldName'],
    }));
  });

  it('stays unknown in a filter predicate', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: { ...MEDIA_COUNT, filter: { field: 'createdAt', op: 'exists' } } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "createdAt"',
      path: ['widgets', 0, 'config', 'metric', 'filter', 'field'],
    }));
  });

  it('a real custom field named createdAt keeps normal type checks', () => {
    const withField = buildDashboardSpecSchema({ ...FIELD_TYPES, createdAt: 'text' });
    const result = withField.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'createdAt', granularity: 'week' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: expect.stringContaining('grouping by time requires a date/datetime field'),
    }));
  });
});

/* ── Field reference: { fieldId } | { reserved: "createdAt" } ────────────── */

const FIELD_ID = { fieldId: '3fdf29434505' } as const;
const RESERVED = { reserved: 'createdAt' } as const;

const tableWidget = (config: Record<string, unknown>, overrides: Record<string, unknown> = {}) =>
  ({ id: 'tbl-1', type: 'table', title: 'T', layout: LAYOUT, config, ...overrides });

const tiles = (tile: Record<string, unknown>) =>
  ({ id: 'tiles-1', type: 'stat-cards', title: 'Tiles', layout: LAYOUT, config: { tiles: [tile] } });

const comparison = (config: Record<string, unknown>) =>
  ({ id: 'cmp-1', type: 'comparison', title: 'Cmp', layout: LAYOUT, config: { dimension: 'folder', a: {}, b: {}, metrics: [MEDIA_COUNT], ...config } });

const distribution = (config: Record<string, unknown>, overrides: Record<string, unknown> = {}) =>
  ({ id: 'fd-1', type: 'field-distribution', title: 'FD', layout: LAYOUT, config: { measure: 'count', chartType: 'bar', ...config }, ...overrides });

describe('field reference — { fieldId } arm', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  // Every path that holds a field reference. A site missing from the schema
  // rejects `ref` as an unknown key (strictObject), so this list IS the coverage.
  const sites: Array<[string, unknown[]]> = [
    ['config.metric.fieldName', [chart({ metric: { kind: 'field', fieldName: 'Session Score', ref: FIELD_ID, agg: 'avg' } })]],
    ['config.metric.filter.field', [chart({ metric: { ...MEDIA_COUNT, filter: { field: 'Status', ref: FIELD_ID, op: 'exists' } } })]],
    ['config.metric.expr operand fieldName', [chart({ metric: { kind: 'expr', expr: { op: 'diff', a: MEDIA_COUNT, b: { kind: 'field', fieldName: 'Revenue', ref: FIELD_ID, agg: 'sum' } } } })]],
    ['config.groupBy.fieldName', [chart({ metric: MEDIA_COUNT, groupBy: { kind: 'field', fieldName: 'Country', ref: FIELD_ID } })]],
    ['config.groupBy.fieldName (kind:"time")', [chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'Recorded On', ref: FIELD_ID, granularity: 'week' } })]],
    ['config.series.fieldName', [chart({ metric: MEDIA_COUNT, series: { kind: 'field', fieldName: 'Region', ref: FIELD_ID } })]],
    ['config.tiles[].metric.fieldName', [tiles({ metric: { kind: 'field', fieldName: 'Revenue', ref: FIELD_ID, agg: 'sum' }, label: 'Rev' })]],
    ['config.tiles[].metric.filter.field', [tiles({ metric: { ...MEDIA_COUNT, filter: { field: 'Status', ref: FIELD_ID, op: 'exists' } }, label: 'Count' })]],
    ['config.columns[].field', [tableWidget({ rowsAre: 'records', columns: [{ header: 'Status', field: 'Status', ref: FIELD_ID }] })]],
    ['config.columns[].metric.fieldName', [tableWidget({ rowsAre: 'groups', groupBy: { kind: 'folder' }, columns: [{ header: 'Rev', metric: { kind: 'field', fieldName: 'Revenue', ref: FIELD_ID, agg: 'sum' } }] })]],
    ['config.columns[].metric.filter.field', [tableWidget({ rowsAre: 'groups', groupBy: { kind: 'folder' }, columns: [{ header: 'N', metric: { ...MEDIA_COUNT, filter: { field: 'Status', ref: FIELD_ID, op: 'exists' } } }] })]],
    ['table config.groupBy.fieldName', [tableWidget({ rowsAre: 'groups', groupBy: { kind: 'field', fieldName: 'Country', ref: FIELD_ID }, columns: [{ header: 'N', metric: MEDIA_COUNT }] })]],
    ['config.fieldName (field-distribution)', [distribution({ fieldName: 'Sentiment', ref: FIELD_ID })]],
    ['config.metrics[].fieldName (comparison)', [comparison({ metrics: [{ kind: 'field', fieldName: 'Age', ref: FIELD_ID, agg: 'avg' }] })]],
    ['config.metrics[].fieldName (people)', [{ id: 'ppl-1', type: 'people', title: 'P', layout: LAYOUT, config: { limit: 10, metrics: [{ kind: 'field', fieldName: 'Age', ref: FIELD_ID, agg: 'avg' }] } }]],
    ['comparison binding filter.field', [comparison({ a: { filter: { field: 'Region', ref: FIELD_ID, op: 'exists' } } })]],
    ['binding.filter.field', [chart({ metric: MEDIA_COUNT }, { binding: { filter: { field: 'Region', ref: FIELD_ID, op: 'exists' } } })]],
  ];

  it.each(sites)('parses a fieldId reference at %s', (_name, widgets) => {
    const result = schema.safeParse(specWith(widgets));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  it('keeps the reference intact — additive, never stripped', () => {
    const widgets = [tableWidget({ rowsAre: 'records', columns: [{ header: 'Status', field: 'Status', ref: FIELD_ID }] })];
    const result = schema.safeParse(specWith(widgets));
    expect(result.success).toBe(true);
    expect((result.data as DashboardSpec).widgets).toStrictEqual(widgets);
  });

  it('does not relax the name check — fieldName is still resolved and validated', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: { kind: 'field', fieldName: 'Sessionn Score', ref: FIELD_ID, agg: 'avg' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'unknown field "Sessionn Score"',
      path: ['widgets', 0, 'config', 'metric', 'fieldName'],
    }));
  });

  it('rejects an empty fieldId', () => {
    expect(schema.safeParse(specWith([
      tableWidget({ rowsAre: 'records', columns: [{ header: 'Status', field: 'Status', ref: { fieldId: '' } }] }),
    ])).success).toBe(false);
  });
});

describe('field reference — { reserved } arm', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);
  const ONLY_TWO_USES = 'reserved "createdAt" is only valid as a raw table column or a kind:"time" groupBy';

  const permitted: Array<[string, unknown[]]> = [
    ['a raw records-table column', [tableWidget({ rowsAre: 'records', columns: [{ header: 'Date', field: 'createdAt', ref: RESERVED }] })]],
    ['a kind:"time" groupBy', [chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'createdAt', ref: RESERVED, granularity: 'week' } })]],
    ['a kind:"time" series', [chart({ metric: MEDIA_COUNT, series: { kind: 'time', fieldName: 'createdAt', ref: RESERVED, granularity: 'month' } })]],
    ['a kind:"time" table groupBy', [tableWidget({ rowsAre: 'groups', groupBy: { kind: 'time', fieldName: 'createdAt', ref: RESERVED, granularity: 'day' }, columns: [{ header: 'N', metric: MEDIA_COUNT }] })]],
  ];

  it.each(permitted)('parses at %s', (_name, widgets) => {
    const result = schema.safeParse(specWith(widgets));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });

  const forbidden: Array<[string, unknown[], (string | number)[]]> = [
    [
      'under an aggregator',
      [chart({ metric: { kind: 'field', fieldName: 'createdAt', ref: RESERVED, agg: 'avg' } })],
      ['widgets', 0, 'config', 'metric', 'ref'],
    ],
    [
      'a kind:"field" groupBy',
      [chart({ metric: MEDIA_COUNT, groupBy: { kind: 'field', fieldName: 'createdAt', ref: RESERVED } })],
      ['widgets', 0, 'config', 'groupBy', 'ref'],
    ],
    [
      'a kind:"field" series',
      [chart({ metric: MEDIA_COUNT, series: { kind: 'field', fieldName: 'createdAt', ref: RESERVED } })],
      ['widgets', 0, 'config', 'series', 'ref'],
    ],
    [
      'a metric filter predicate',
      [chart({ metric: { ...MEDIA_COUNT, filter: { field: 'createdAt', ref: RESERVED, op: 'exists' } } })],
      ['widgets', 0, 'config', 'metric', 'filter', 'ref'],
    ],
    [
      'a filter predicate nested inside and/or',
      [chart({ metric: { ...MEDIA_COUNT, filter: { and: [{ field: 'Status', op: 'exists' }, { field: 'createdAt', ref: RESERVED, op: 'exists' }] } } })],
      ['widgets', 0, 'config', 'metric', 'filter', 'and', 1, 'ref'],
    ],
    [
      'a widget binding filter',
      [chart({ metric: MEDIA_COUNT }, { binding: { filter: { field: 'createdAt', ref: RESERVED, op: 'exists' } } })],
      ['widgets', 0, 'binding', 'filter', 'ref'],
    ],
    [
      'a field-distribution',
      [distribution({ fieldName: 'createdAt', ref: RESERVED })],
      ['widgets', 0, 'config', 'ref'],
    ],
    [
      'a stat-card metric',
      [tiles({ metric: { kind: 'field', fieldName: 'createdAt', ref: RESERVED, agg: 'max' }, label: 'Latest' })],
      ['widgets', 0, 'config', 'tiles', 0, 'metric', 'ref'],
    ],
  ];

  it.each(forbidden)('rejects at %s, pointing at the ref', (_name, widgets, path) => {
    const result = schema.safeParse(specWith(widgets));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({ message: ONLY_TWO_USES, path }));
  });

  // The use rule is structural: a client validating without a field-type map
  // must reject a misplaced reserved arm too, or the server is the only gate.
  it('applies without a field-type map', () => {
    const result = dashboardSpecSchema.safeParse(specWith([
      chart({ metric: { kind: 'field', fieldName: 'createdAt', ref: RESERVED, agg: 'avg' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: ONLY_TWO_USES,
      path: ['widgets', 0, 'config', 'metric', 'ref'],
    }));
  });

  it('rejects a reserved arm that contradicts the name it accompanies', () => {
    const result = schema.safeParse(specWith([
      chart({ metric: MEDIA_COUNT, groupBy: { kind: 'time', fieldName: 'Recorded On', ref: RESERVED, granularity: 'week' } }),
    ]));
    expect(result.success).toBe(false);
    expect(result.error!.issues).toContainEqual(expect.objectContaining({
      message: 'reserved "createdAt" contradicts the name "Recorded On"',
      path: ['widgets', 0, 'config', 'groupBy', 'ref'],
    }));
  });

  it('rejects any other reserved name — the arm is a closed protocol constant', () => {
    expect(schema.safeParse(specWith([
      tableWidget({ rowsAre: 'records', columns: [{ header: 'Date', field: 'updatedAt', ref: { reserved: 'updatedAt' } }] }),
    ])).success).toBe(false);
  });
});

describe('field reference — the two keys are mutually exclusive', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  it('rejects a reference carrying both keys', () => {
    expect(fieldReferenceSchema.safeParse({ fieldId: '3fdf29434505', reserved: 'createdAt' }).success).toBe(false);
  });

  it('rejects a spec whose reference carries both keys', () => {
    expect(schema.safeParse(specWith([
      tableWidget({ rowsAre: 'records', columns: [{ header: 'Date', field: 'createdAt', ref: { fieldId: '3fdf29434505', reserved: 'createdAt' } }] }),
    ])).success).toBe(false);
  });

  it('rejects a reference carrying neither key', () => {
    expect(fieldReferenceSchema.safeParse({}).success).toBe(false);
  });

  // Zod's default would STRIP each wrong key, leaving a reference that resolves
  // to nothing while looking configured — the same trust bug as a confident zero.
  it.each([
    ['field_id', { field_id: 'abc' }],
    ['id', { id: 'abc' }],
    ['fieldID', { fieldID: 'abc' }],
    ['a sentinel name instead of the reserved arm', { fieldId: '@createdAt', reserved: 'createdAt' }],
    ['an extra key beside fieldId', { fieldId: '3fdf29434505', kind: 'field' }],
    ['an extra key beside reserved', { reserved: 'createdAt', kind: 'reserved' }],
  ])('rejects %s', (_name, ref) => {
    expect(fieldReferenceSchema.safeParse(ref).success).toBe(false);
    expect(schema.safeParse(specWith([
      tableWidget({ rowsAre: 'records', columns: [{ header: 'Status', field: 'Status', ref }] }),
    ])).success).toBe(false);
  });
});

describe('fieldRef builder', () => {
  it('builds both arms', () => {
    expect(fieldRef({ fieldId: '3fdf29434505' })).toStrictEqual({ fieldId: '3fdf29434505' });
    expect(fieldRef({ reserved: 'createdAt' })).toStrictEqual({ reserved: 'createdAt' });
  });

  it('throws on a reference the schema would reject', () => {
    expect(() => fieldRef({ fieldId: '' })).toThrow();
    expect(() => fieldRef({ fieldId: '3fdf29434505', reserved: 'createdAt' } as never)).toThrow();
  });

  it('produces references the spec accepts', () => {
    const result = buildDashboardSpecSchema(FIELD_TYPES).safeParse(specWith([
      tableWidget({
        rowsAre: 'records',
        columns: [
          { header: 'Date', field: 'createdAt', ref: fieldRef({ reserved: 'createdAt' }) },
          { header: 'Status', field: 'Status', ref: fieldRef({ fieldId: '3fdf29434505' }) },
        ],
      }),
    ]));
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });
});

describe('a malformed ref is reported at its own path', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  const refIssue = (doc: unknown) => {
    const r = schema.safeParse(doc);
    const hit = (r.error?.issues ?? []).find((i) => i.path.join('.').endsWith('.ref'));
    return hit ? { path: hit.path.join('.'), message: hit.message } : undefined;
  };

  const columnWith = (ref: unknown) =>
    specWith([tableWidget({ rowsAre: 'records', columns: [{ header: 'S', field: 'Status', ref }] })]);

  const filterWith = (ref: unknown) =>
    specWith([
      chart({
        metric: {
          kind: 'field', fieldName: 'Session Score', agg: 'avg',
          filter: { field: 'Status', op: 'eq', value: 'x', ref },
        },
        groupBy: { kind: 'field', fieldName: 'Country' },
      }),
    ]);

  // Both sites sit inside a parent z.union, which collapsed the failure to the
  // parent as a bare "Invalid input" naming neither ref nor the problem.
  it.each([
    ['both keys', { fieldId: '3fdf29434505', reserved: 'createdAt' }],
    ['neither key', {}],
    ['a typo key', { field_id: '3fdf29434505' }],
    ['a sentinel string', '@createdAt'],
  ])('names the column ref for %s', (_label, ref) => {
    const issue = refIssue(columnWith(ref));
    expect(issue?.path).toBe('widgets.0.config.columns.0.ref');
    expect(issue?.message).toContain('exactly one of');
  });

  it.each([
    ['both keys', { fieldId: '3fdf29434505', reserved: 'createdAt' }],
    ['a typo key', { fieldID: '3fdf29434505' }],
  ])('names the filter ref for %s', (_label, ref) => {
    const issue = refIssue(filterWith(ref));
    expect(issue?.path).toBe('widgets.0.config.metric.filter.ref');
    expect(issue?.message).toContain('exactly one of');
  });

  it('rejects a fieldId that is not 12 lowercase hex characters', () => {
    for (const bad of ['abc', 'ABCDEF123456', '3fdf2943450', '3fdf294345050', '../../etc/passwd']) {
      expect(fieldReferenceSchema.safeParse({ fieldId: bad }).success).toBe(false);
    }
    expect(fieldReferenceSchema.safeParse({ fieldId: '3fdf29434505' }).success).toBe(true);
  });

  // Locally decidable, so unlike the use restriction it holds on the standalone
  // exports, which never run the envelope's superRefine.
  it('catches a reserved arm contradicting its name on a standalone export', () => {
    const r = columnSchema.safeParse({ header: 'S', field: 'Status', ref: { reserved: 'createdAt' } });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.message.includes('contradicts the name'))).toBe(true);
  });

  it('accepts the reserved arm on a standalone export when the name agrees', () => {
    expect(
      columnSchema.safeParse({ header: 'D', field: 'createdAt', ref: { reserved: 'createdAt' } }).success,
    ).toBe(true);
  });
});

describe('field reference is optional everywhere — pre-migration specs are untouched', () => {
  const schema = buildDashboardSpecSchema(FIELD_TYPES);

  it('parses a ref-free spec at every site and injects no ref key', () => {
    const widgets = [
      chart({
        metric: { kind: 'field', fieldName: 'Session Score', agg: 'avg', filter: { field: 'Status', op: 'eq', value: 'Scored' } },
        groupBy: { kind: 'time', fieldName: 'Recorded On', granularity: 'week' },
        series: { kind: 'field', fieldName: 'Country' },
      }, { binding: { filter: { field: 'Region', op: 'exists' } } }),
      tableWidget({
        rowsAre: 'records',
        columns: [{ header: 'Status', field: 'Status' }, { header: 'Date', field: 'createdAt' }],
      }, { id: 'tbl-2', layout: { x: 0, y: 4, w: 6, h: 4 } }),
      distribution({ fieldName: 'Sentiment' }, { id: 'fd-2', layout: { x: 6, y: 4, w: 6, h: 4 } }),
    ];

    const result = schema.safeParse(specWith(widgets));
    expect(result.error?.issues ?? []).toEqual([]);
    expect((result.data as DashboardSpec).widgets).toStrictEqual(widgets);
  });
});
