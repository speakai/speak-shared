/**
 * Dashboard feature — shared wire contract.
 *
 * Single source of truth for the Dashboards API shape, consumed by speak-client
 * (builder + queries) and speak-server (@speak-dashboards). The server's Mongoose
 * document type may extend these; the client imports them directly.
 */

/* ===================================================================
 * Dashboard spec v2 — types
 * ===================================================================
 *
 * Type-only re-exports of the Zod-inferred spec types. `export type` is erased
 * at build, so importing these from the package root does NOT pull zod into the
 * consumer's bundle. To VALIDATE a spec (not just type it), import the schema
 * from the `@speakai/shared/schemas` subpath instead.
 */
export type {
  Agg,
  BaseMetric,
  Binding,
  BuiltinMetric,
  Column,
  DashboardSpec,
  DashboardSpecInput,
  DateRange,
  DateRangePreset,
  Expr,
  FieldTypeMap,
  Filter,
  FilterOp,
  Granularity,
  GroupBy,
  Metric,
  Section,
  Source,
  SpecFieldType,
  Threshold,
  ThresholdStatus,
  Widget,
  WidgetLayout,
  WidgetOf,
  WidgetType,
} from '../schemas/dashboard-spec.schema.js';

/* ===================================================================
 * Widget metadata + sizing (builder layout contract)
 * =================================================================== */

/**
 * react-grid-layout column count the dashboard grid is laid out on.
 *
 * Defined in `utils/dashboard-spec.ts` (which must stay zod-free, and which the
 * schema's `layout` bounds import) and re-exported here so existing consumers
 * keep compiling unchanged. One grid width, one name — do not add a second.
 */
export { DASHBOARD_GRID_COLS } from '../utils/dashboard-spec.js';

/**
 * Per-widget-type presentation metadata: default title, default grid geometry,
 * minimum geometry, and which config affordances apply. The single source of
 * truth for the builder's "Add widget" flow and template instantiation, so the
 * two never drift. `titleDefault` is an English fallback; call sites localise it.
 */
export interface WidgetMeta {
  /** Default width in grid columns. */
  w: number;
  /** Default height in grid rows. */
  h: number;
  /** Minimum width in grid columns. */
  minW: number;
  /** Minimum height in grid rows. */
  minH: number;
  /** English fallback title. */
  titleDefault: string;
  /** Whether a chart-type toggle (bar/line/pie) applies in widget config. */
  supportsChartType: boolean;
  /** Whether a field picker applies in widget config. */
  supportsFieldId: boolean;
}

/* ===================================================================
 * Public widget-data response shapes
 * ===================================================================
 *
 * The canonical per-widget response bodies the public widget-data endpoint
 * returns, consumed identically by the builder's public-preview override and the
 * media-library public view. Each matches the server `computePublic*` return
 * shape exactly. These mirror the authed analytics response bodies so the same
 * widget components render in both the authed builder and the anonymous view.
 */

/** One theme cluster: a keyword/phrase and how many times it occurred. */
export interface PublicThemeCluster {
  name: string;
  nTimes: number;
}

/** One field-distribution row: a value and its occurrence count. */
export interface PublicFieldInsight {
  text: string;
  nTimes: number;
}

/** Sentiment buckets on the [-1, 1] domain, keyed by qualitative label. */
export type PublicSentimentLabel =
  | 'veryPositive'
  | 'positive'
  | 'slightlyPositive'
  | 'neutral'
  | 'slightlyNegative'
  | 'negative'
  | 'veryNegative';

/** One overall-sentiment bucket: its share of scored media and the media count. */
export interface PublicSentimentOverallEntry {
  label: PublicSentimentLabel;
  percentage: number;
  mediaCount: number;
}

/** Aggregated sentiment rate: per-date compound series + overall distribution. */
export interface PublicSentimentRate {
  timeline: string[];
  compound: number[];
  overall: Record<PublicSentimentLabel, PublicSentimentOverallEntry>;
}

/** One representative sentiment-scored sentence. */
export interface PublicSentimentSentence {
  text: string;
  score: number;
  folderId?: string;
  mediaId?: string;
  mediaType?: string;
  name?: string;
  instances?: unknown[];
}

/** The sentiment chart body: aggregated rate plus representative sentences. */
export interface PublicSentimentChart {
  rate: PublicSentimentRate;
  sentences: PublicSentimentSentence[];
}

/**
 * `sentiment` + `sentiment-trend` widget data. `compareSentiment` is omitted on
 * the public path (the server returns it as `undefined`), so it is optional.
 */
export interface PublicSentimentData {
  sentiment: PublicSentimentChart;
  compareSentiment?: PublicSentimentChart;
}

/** Alias for the `sentiment-trend` widget — same body, different render. */
export type PublicSentimentTrendData = PublicSentimentData;

/** `field-distribution` widget data — value-frequency rows for one field. */
export interface PublicFieldDistributionData {
  insights: PublicFieldInsight[];
  compareInsights: PublicFieldInsight[];
}

/** `themes` widget data — dominant theme clusters and an emptiness flag. */
export interface PublicThemesData {
  clusters: PublicThemeCluster[];
  hasKeywordsData: boolean;
}

/** Per-media-type upload-timeline series. `text` carries no duration/speakers. */
export interface PublicUploadTimelineSeries {
  dates: string[];
  counts: number[];
  words: number[];
  durations?: number[];
  speakerCount?: number;
}

/** `upload-timeline` widget data — per-type date/count series plus rollup totals. */
export interface PublicUploadTimelineData {
  audio: PublicUploadTimelineSeries;
  video: PublicUploadTimelineSeries;
  text: PublicUploadTimelineSeries;
  overall: {
    counts: number;
    durations: number;
    words: number;
    speakerCount: number;
  };
}

/** Sentiment distribution carried on an insight snapshot. */
export interface PublicInsightSentiment {
  positive: number;
  neutral: number;
  negative: number;
  mixed?: number;
}

/** One theme on an insight snapshot. */
export interface PublicInsightTheme {
  name: string;
  keywordCount: number;
  rank?: number;
}

/** Current-window totals on an insight snapshot (the `current` payload). */
export interface PublicInsightCurrent {
  totalFiles: number;
  totalDurationSeconds: number;
  totalWords: number;
  uniqueSpeakers: number;
  sentiment: PublicInsightSentiment;
  themes?: PublicInsightTheme[];
}

/** Period-over-period deltas on an insight snapshot. Null fields = no prior. */
export interface PublicInsightDelta {
  totalFilesDelta: number | null;
  totalDurationSecondsDelta: number | null;
  totalWordsDelta: number | null;
  uniqueSpeakersDelta: number | null;
  /** UTC ISO — start of current window. */
  periodStart: string;
  /** UTC ISO — end of current window. */
  periodEnd: string;
}

/**
 * `kpi-trend` + `comparison` widget data — current totals plus an optional
 * period-over-period delta. Matches the server insight-snapshot response.
 */
export interface PublicInsightSnapshotData {
  current: PublicInsightCurrent;
  delta: PublicInsightDelta | null;
  /** UTC ISO date of the current snapshot. */
  snapshotDate: string;
}

/** `stat-cards` widget data — folder-scopable totals + average sentiment only. */
export interface PublicStatCardsData {
  totalMedia: number;
  fileSize: number;
  totalWords: number;
  uniqueSpeakers: number;
  totalDurationSeconds: number;
  avgSentiment: number | null;
}

/** One row on the public `media-list` widget. The created date is pre-formatted. */
export interface PublicMediaListRow {
  id: string;
  name: string;
  type: string;
  /** Pre-formatted created date (e.g. "Jun 18, 2026"). */
  created: string;
}

/**
 * `media-list` widget data — the most recent media inside the dashboard's shared
 * folderScope. Rows are confined to COMPLETE/PROCESSED media in folderScope and
 * carry no identity beyond the media id used to open the public insight view.
 */
export interface PublicMediaListData {
  rows: PublicMediaListRow[];
  total: number;
}

/* ===================================================================
 * Lead capture (shared embed/dashboard sharing contract)
 * =================================================================== */

/**
 * Owner-settable lead-capture config for a shared surface (dashboard or embed).
 * Gates an email prompt on the public view. All flags default OFF, so a surface
 * without this config never prompts a viewer.
 *
 * - `isEnabled`      — master switch; when false no prompt is shown.
 * - `collectName`    — also ask for the viewer's name.
 * - `requireConsent` — require an explicit consent checkbox before submit.
 * - `consentText`    — copy shown beside the consent checkbox.
 */
export interface LeadCapture {
  isEnabled: boolean;
  collectName: boolean;
  requireConsent: boolean;
  consentText?: string;
}
