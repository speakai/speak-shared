/**
 * Dashboard feature — shared wire contract.
 *
 * Single source of truth for the Dashboards API shape, consumed by speak-client
 * (builder + queries) and speak-server (@speak-dashboards). The server's Mongoose
 * document type may extend these; the client imports them directly.
 */

/**
 * Built-in dashboard widget types — the canonical render contract shared by the
 * builder (speak-client) and the public view (speak-media-library).
 *
 * The first eight are the server-recognised core types served by the public
 * widget-data endpoint; the last four (`people`, `comparison`, `sentiment-trend`,
 * `notes`) are client-rendered bodies the builder enumerates. Persisting these
 * extra literals is safe because `IDashboardWidget.type` is `… | string`.
 */
export type DashboardWidgetType =
  | 'stat-cards'
  | 'sentiment'
  | 'media-list'
  | 'field-distribution'
  | 'upload-timeline'
  | 'themes'
  | 'team-activity'
  | 'kpi-trend'
  | 'people'
  | 'comparison'
  | 'sentiment-trend'
  | 'notes';

/** Grid placement for a widget (react-grid-layout geometry; legacy order/colSpan optional). */
export interface IDashboardWidgetLayout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  minH?: number;
  /** @deprecated legacy linear ordering — superseded by x/y. */
  order?: number;
  /** @deprecated legacy column span — superseded by w. */
  colSpan?: number;
}

/** A single configured widget on a dashboard. */
export interface IDashboardWidget {
  id: string;
  type: DashboardWidgetType | string;
  title: string;
  /** Render-only, widget-type-specific settings (chartType, fieldId, accentColor, …). */
  config: Record<string, unknown>;
  layout: IDashboardWidgetLayout;
}

/** Date scope for a dashboard (preset key, with optional explicit bounds). */
export interface IDashboardDateRange {
  preset?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

/** Full dashboard wire shape (owner/authed view). */
export interface IDashboard {
  dashboardId: string;
  title: string;
  description?: string;
  icon?: string;
  /** Folder ids the dashboard is scoped to (empty = all accessible). */
  folderScope: string[];
  dateRange?: IDashboardDateRange;
  filters?: Record<string, unknown>;
  widgets: IDashboardWidget[];
  /** Public share token — present only to the owner when sharing is enabled. */
  shareToken?: string;
  isShareEnabled?: boolean;
  /** Team/group ids the dashboard is shared with ("<id> (G)" convention). */
  sharedWithGroups?: string[];
  isDefault?: boolean;
  schemaVersion?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** Public (token-resolved, unauthenticated) projection — secret/internal fields stripped. */
export interface IPublicDashboard {
  title: string;
  description?: string;
  icon?: string;
  widgets: IDashboardWidget[];
  folderScope: string[];
  dateRange?: IDashboardDateRange;
}

/** Create payload. */
export interface ICreateDashboardPayload {
  title: string;
  description?: string;
  icon?: string;
  folderScope?: string[];
  dateRange?: IDashboardDateRange;
  filters?: Record<string, unknown>;
  widgets?: IDashboardWidget[];
  sharedWithGroups?: string[];
  isDefault?: boolean;
}

/** Update payload (partial). */
export type IUpdateDashboardPayload = Partial<ICreateDashboardPayload>;

/* ===================================================================
 * Widget metadata + sizing (builder layout contract)
 * =================================================================== */

/** react-grid-layout column count the dashboard grid is laid out on. */
export const DASHBOARD_GRID_COLS = 12;

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
