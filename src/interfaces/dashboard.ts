/**
 * Dashboard feature — shared wire contract.
 *
 * Single source of truth for the Dashboards API shape, consumed by speak-client
 * (builder + queries) and speak-server (@speak-dashboards). The server's Mongoose
 * document type may extend these; the client imports them directly.
 */

/** Built-in dashboard widget types. */
export type DashboardWidgetType =
  | 'stat-cards'
  | 'sentiment'
  | 'media-list'
  | 'field-distribution'
  | 'upload-timeline'
  | 'themes'
  | 'team-activity'
  | 'kpi-trend';

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
