import type {
  EmbedSessionBotKind,
  EmbedSessionChatFeedbackScale,
  EmbedSessionDeviceFilter,
  EmbedSessionEventCategory,
  EmbedSessionEventSource,
  EmbedSessionEventType,
  EmbedSessionExportKind,
  EmbedSessionMediaOpenSource,
  EmbedSessionSort,
  EmbedSessionTrafficFilter,
  EmbedSessionTranscriptFormat,
  EmbedSessionViewerFilter,
  EmbedViewerAuthMethod,
} from '../enums/embedSession.js';

export type EmbedSessionEventData = Record<string, string | number | boolean | null>;

export type EmbedSessionChatFeedbackData = {
  score: number;
  scale: EmbedSessionChatFeedbackScale;
  messageId?: string;
};

export type EmbedSessionTranscriptDownloadData = {
  format: EmbedSessionTranscriptFormat;
};

export type EmbedSessionExportData = {
  format: string;
  kind: EmbedSessionExportKind;
};

export interface IEmbedSessionEventEntry {
  category: EmbedSessionEventCategory;
  source: EmbedSessionEventSource;
  description: string;
}

export interface IEmbedSessionCampaign {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface IEmbedSessionContext {
  path: string;
  referrer?: string;
  screen?: string;
  language?: string;
  timeZone?: string;
  userAgent?: string;
  embedded: boolean;
  utm?: IEmbedSessionCampaign;
}

export interface IEmbedSessionClientEvent {
  i: number;
  t: number;
  type: EmbedSessionEventType;
  mediaId?: string;
  promptId?: string;
  data?: EmbedSessionEventData;
}

export interface IEmbedSessionTiming {
  wallClockMs: number;
  visibleMs: number;
  activeMs: number;
}

export interface IEmbedSessionMediaTotals {
  mediaId: string;
  opens: number;
  activeMs: number;
  playedMs: number;
  plays: number;
  seeks: number;
  maxPositionPct: number;
  completed: boolean;
}

export interface IEmbedSessionTotals {
  timing: IEmbedSessionTiming;
  pageViews: number;
  media: IEmbedSessionMediaTotals[];
}

export interface IEmbedSessionSaveBody {
  version: number;
  sessionId: string;
  visitorId: string;
  seq: number;
  viewerId?: string | null;
  context: IEmbedSessionContext;
  events: IEmbedSessionClientEvent[];
  totals: IEmbedSessionTotals;
}

export interface IEmbedSessionSaveResponse {
  sessionId: string;
  lastSeq: number;
  applied: boolean;
  rejected?: { i?: number; index?: number; reason: string }[];
}

export interface IEmbedSessionSaveSkippedResponse {
  applied: false;
}

export interface IEmbedSessionClient {
  country?: string;
  region?: string;
  city?: string;
  continent?: string;
  timeZone?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  referer?: string;
  referrerHost?: string;
  screen?: string;
  language?: string;
  embedded?: boolean;
}

export interface IEmbedSessionBot {
  kind: EmbedSessionBotKind;
  name?: string;
}

export interface IEmbedSessionSummary {
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  timing: IEmbedSessionTiming;
  media: { opened: number; watchedMs: number };
  chat: { questions: number };
  pages: { views: number };
}

export interface IEmbedSessionMedia extends IEmbedSessionMediaTotals {
  firstOpenedAt: string;
}

export interface IEmbedSessionChat {
  promptId: string;
  messageId: string;
  askedAt: string;
  mediaIds: string[];
}

export interface IEmbedSessionEvent {
  t: number;
  type: EmbedSessionEventType;
  category: EmbedSessionEventCategory;
  mediaId?: string;
  promptId?: string;
  data?: EmbedSessionEventData;
  receivedAt: string;
}

export interface IEmbedSessionViewer {
  viewerId: string;
  email?: string;
  name?: string;
  consent?: boolean;
  consentText?: string;
  authMethod?: EmbedViewerAuthMethod;
  verifiedAt?: string;
}

export interface IEmbedSessionListQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  viewer?: EmbedSessionViewerFilter;
  traffic?: EmbedSessionTrafficFilter;
  device?: EmbedSessionDeviceFilter;
  country?: string;
  includeOwner?: boolean;
  includeLegacy?: boolean;
  viewerId?: string;
  visitorId?: string;
  mediaId?: string;
  sort?: EmbedSessionSort;
}

export interface IEmbedSessionListItem {
  _id: string;
  sessionId: string;
  isLegacy: boolean;
  isOwner: boolean;
  isLive: boolean;
  visitorId?: string;
  viewerId?: string;
  email?: string;
  name?: string;
  authMethod?: EmbedViewerAuthMethod;
  startedAt: string;
  lastActiveAt?: string;
  endedAt?: string;
  durationMs: number | null;
  activeMs: number | null;
  mediaOpened: number | null;
  watchedMs: number | null;
  questions: number | null;
  client?: IEmbedSessionClient;
  campaign?: IEmbedSessionCampaign;
  bot?: IEmbedSessionBot;
}

export interface IEmbedSessionListResponse {
  sessions: IEmbedSessionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IEmbedSessionDetailMedia extends IEmbedSessionMedia {
  name?: string;
  durationSec?: number;
}

export interface IEmbedSessionDetailChat extends IEmbedSessionChat {
  question?: string;
  state?: string;
  feedbackScore?: number;
}

export interface IEmbedSessionDetailResponse {
  session: IEmbedSessionListItem & {
    summary?: IEmbedSessionSummary;
    media: IEmbedSessionDetailMedia[];
    chat: IEmbedSessionDetailChat[];
    events: IEmbedSessionEvent[];
    eventsPage: number;
    eventsPageSize: number;
    eventsTotal: number;
    parts: number;
  };
  visitorSessions: number;
}

export interface EmbedSessionEventsPageQuery {
  eventsPage?: number;
  eventsPageSize?: number;
}

export interface EmbedSessionCountriesQuery {
  from?: string;
  to?: string;
  includeOwner?: boolean;
  includeLegacy?: boolean;
}

export interface EmbedSessionCountryRow {
  country: string;
  sessions: number;
}

export interface EmbedSessionCountriesResponse {
  countries: EmbedSessionCountryRow[];
}

export interface IEmbedSessionSummaryQuery {
  from?: string;
  to?: string;
  tz?: string;
  traffic?: EmbedSessionTrafficFilter;
  includeOwner?: boolean;
  mediaPage?: number;
  mediaPageSize?: number;
}

export type IEmbedSessionLiveQuery = Pick<IEmbedSessionSummaryQuery, 'traffic' | 'includeOwner'>;

export interface IEmbedSessionMediaRow {
  mediaId: string;
  name?: string;
  durationSec?: number;
  opens: number;
  uniqueViewers: number;
  plays: number;
  watchedMs: number;
  avgWatchedMs: number;
  completionRate: number;
  questions: number;
  downloads: number;
  shares: number;
}

export interface IEmbedSessionLiveResponse {
  liveNow: number;
  lastActivityAt: string | null;
}

export interface IEmbedSessionSummaryResponse {
  kpis: {
    sessions: number;
    people: number;
    bots: number;
    uniqueVisitors: number;
    returningVisitors: number;
    identifiedViewers: number;
    avgActiveMs: number;
    totalActiveMs: number;
    mediaOpens: number;
    watchedMs: number;
    questions: number;
    sessionsWithQuestions: number;
  };
  overTime: { date: string; sessions: number; visitors: number; activeMs: number }[];
  media: IEmbedSessionMediaRow[];
  mediaPage: number;
  mediaPageSize: number;
  mediaTotal: number;
  legacy: { sessions: number };
}

export interface IEmbedViewerSummary {
  viewerId: string;
  email: string;
  name?: string;
  viewCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  authMethod?: EmbedViewerAuthMethod;
  activeMs: number;
  watchedMs: number;
  questions: number;
  location?: { city?: string; regionName?: string; countryName?: string };
}

export interface EmbedSessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EmbedSessionTransport {
  send(url: string, body: IEmbedSessionSaveBody, token: string): Promise<{
    status: number;
    data?: IEmbedSessionSaveResponse | IEmbedSessionSaveSkippedResponse;
  }>;
  beacon(url: string, body: IEmbedSessionSaveBody, token: string): boolean;
}

export interface EmbedSessionTrackerOptions {
  token: string;
  apiBaseUrl: string;
  viewerId?: string | null;
  sessionStorage?: EmbedSessionStorageLike | null;
  localStorage?: EmbedSessionStorageLike | null;
  transport?: EmbedSessionTransport;
  now?: () => number;
  onError?: (error: unknown) => void;
}

export interface EmbedSessionMediaHandle {
  open(source?: EmbedSessionMediaOpenSource): void;
  close(): void;
  play(positionSec: number): void;
  pause(positionSec: number): void;
  seek(fromSec: number, toSec: number): void;
  ended(durationSec: number): void;
  rateChange(rate: number): void;
  timeUpdate(positionSec: number, durationSec?: number): void;
}

export interface EmbedSessionTrackFields<T extends EmbedSessionEventType = EmbedSessionEventType> {
  mediaId?: string;
  promptId?: string;
  data?: T extends EmbedSessionEventType.CHAT_FEEDBACK
    ? EmbedSessionChatFeedbackData
    : T extends EmbedSessionEventType.TRANSCRIPT_DOWNLOAD
      ? EmbedSessionTranscriptDownloadData
      : T extends EmbedSessionEventType.EXPORT
        ? EmbedSessionExportData
        : EmbedSessionEventData;
}

export interface EmbedSessionTracker {
  readonly sessionId: string;
  readonly visitorId: string;
  start(): void;
  stop(): void;
  track<T extends EmbedSessionEventType>(type: T, fields?: EmbedSessionTrackFields<T>): void;
  pageView(path: string): void;
  setViewerId(viewerId: string | null): void;
  media(mediaId: string, options?: { inferSeeks?: boolean }): EmbedSessionMediaHandle;
  chatContext(): { embedSessionId: string; viewerId?: string };
  flush(): Promise<void>;
}

export interface IEmbedSessionTrackerState {
  sessionId: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
  seq: number;
  eventIndex: number;
  totals: IEmbedSessionTotals;
  pending: IEmbedSessionClientEvent[];
}

export interface IEmbedSessionMediaRuntime {
  mediaId: string;
  inferSeeks: boolean;
  isOpen: boolean;
  playingSince: number | null;
  lastPositionSec: number | null;
  lastPositionAt: number | null;
  durationSec: number | null;
  rate: number;
}

export interface IEmbedSessionMediaHandleDeps {
  clock(): number;
  run(action: () => void): void;
  totals(mediaId: string): IEmbedSessionMediaTotals | null;
  emit(type: EmbedSessionEventType, fields: EmbedSessionTrackFields): void;
  onActivity(): void;
  onPlaybackStop(): void;
}
