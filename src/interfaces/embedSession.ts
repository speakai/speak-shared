import type {
  EmbedSessionBotKind,
  EmbedSessionDeviceFilter,
  EmbedSessionEventCategory,
  EmbedSessionEventSource,
  EmbedSessionEventType,
  EmbedSessionMediaOpenSource,
  EmbedSessionSort,
  EmbedSessionTrafficFilter,
  EmbedSessionViewerFilter,
} from '../enums/embedSession.js';
import type { ExportFormatType } from '../enums/export.js';

export type EmbedSessionEventData = Record<string, string | number | boolean | null>;

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

export interface IEmbedSessionClientEvent {
  i: number;
  t: number;
  type: EmbedSessionEventType;
  mediaId?: string;
  promptId?: string;
  data?: EmbedSessionEventData;
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

export interface IEmbedSessionMedia extends IEmbedSessionMediaTotals {
  firstOpenedAt: string;
  name?: string;
  durationSec?: number;
}

export interface IEmbedSessionChat {
  promptId: string;
  messageId: string;
  askedAt: string;
  mediaIds: string[];
  question?: string;
  state?: string;
  feedbackScore?: number;
}

export interface IEmbedSessionSaveBody {
  version: number;
  sessionId: string;
  visitorId: string;
  seq: number;
  viewerId?: string | null;
  context: IEmbedSessionContext;
  events: IEmbedSessionClientEvent[];
  totals: {
    timing: IEmbedSessionTiming;
    pageViews: number;
    media: IEmbedSessionMediaTotals[];
  };
}

export interface IEmbedSessionSaveResponse {
  sessionId: string;
  lastSeq: number;
  applied: boolean;
  rejected?: { i?: number; index?: number; reason: string }[];
}

export interface IEmbedSessionQuery {
  from?: string;
  to?: string;
  traffic?: EmbedSessionTrafficFilter;
  includeOwner?: boolean;
}

export interface IEmbedSessionListQuery extends IEmbedSessionQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  viewer?: EmbedSessionViewerFilter;
  device?: EmbedSessionDeviceFilter;
  country?: string;
  includeLegacy?: boolean;
  viewerId?: string;
  visitorId?: string;
  mediaId?: string;
  sort?: EmbedSessionSort;
}

export interface IEmbedSessionSummaryQuery extends IEmbedSessionQuery {
  tz?: string;
  mediaPage?: number;
  mediaPageSize?: number;
}

export type IEmbedSessionCountriesQuery = Pick<IEmbedSessionListQuery, 'from' | 'to' | 'includeOwner' | 'includeLegacy' | 'traffic'>;

export type IEmbedSessionLiveQuery = Pick<IEmbedSessionQuery, 'traffic' | 'includeOwner'>;

export interface IEmbedSessionDetailQuery {
  eventsPage?: number;
  eventsPageSize?: number;
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
  bot?: { kind: EmbedSessionBotKind; name?: string };
}

export interface IEmbedSessionListResponse {
  sessions: IEmbedSessionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IEmbedSessionDetailResponse {
  session: IEmbedSessionListItem & {
    media: IEmbedSessionMedia[];
    chat: IEmbedSessionChat[];
    events: IEmbedSessionEvent[];
    eventsPage: number;
    eventsPageSize: number;
    eventsTotal: number;
  };
  visitorSessions: number;
}

export interface IEmbedSessionCountriesResponse {
  countries: { country: string; sessions: number }[];
}

export interface IEmbedSessionLiveResponse {
  liveNow: number;
  idleOpen: number;
  lastActivityAt: string | null;
}

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
}

export interface IEmbedSessionSummaryResponse {
  kpis: {
    sessions: number;
    uniqueVisitors: number;
    returningVisitors: number;
    identifiedViewers: number;
    avgActiveMs: number;
    mediaOpens: number;
    watchedMs: number;
    questions: number;
    sessionsWithQuestions: number;
  };
  overTime: { date: string; sessions: number; visitors: number }[];
  sources: { source: string; sessions: number }[];
  media: IEmbedSessionMediaRow[];
  mediaPage: number;
  mediaPageSize: number;
  mediaTotal: number;
}

export interface IEmbedViewerSummary {
  viewerId: string;
  email: string;
  name?: string;
  viewCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  activeMs: number;
  watchedMs: number;
  questions: number;
  location?: { city?: string; regionName?: string; countryName?: string };
}

export interface IEmbedSessionTrackerOptions {
  token: string;
  apiBaseUrl: string;
  viewerId?: string | null;
  sessionStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  } | null;
  localStorage?: IEmbedSessionTrackerOptions['sessionStorage'];
  transport?: {
    send(url: string, body: IEmbedSessionSaveBody, token: string): Promise<{
      status: number;
      data?: IEmbedSessionSaveResponse | { applied: false };
    }>;
    beacon(url: string, body: IEmbedSessionSaveBody, token: string): boolean;
  };
  now?: () => number;
  onError?: (error: unknown) => void;
}

export interface IEmbedSessionMediaHandle {
  open(source?: EmbedSessionMediaOpenSource): void;
  close(): void;
  play(positionSec: number): void;
  pause(positionSec: number): void;
  seek(fromSec: number, toSec: number): void;
  ended(durationSec: number): void;
  rateChange(rate: number): void;
  timeUpdate(positionSec: number, durationSec?: number): void;
}

export interface IEmbedSessionTrackFields<T extends EmbedSessionEventType = EmbedSessionEventType> {
  mediaId?: string;
  promptId?: string;
  data?: T extends EmbedSessionEventType.CHAT_FEEDBACK
    ? { score: number; messageId?: string }
    : T extends EmbedSessionEventType.TRANSCRIPT_DOWNLOAD | EmbedSessionEventType.EXPORT
      ? { format: ExportFormatType }
      : EmbedSessionEventData;
}

export interface IEmbedSessionChatContext {
  embedSessionId: string;
  viewerId?: string;
}

export interface IEmbedSessionTracker {
  readonly sessionId: string;
  readonly visitorId: string;
  start(): void;
  stop(): void;
  track<T extends EmbedSessionEventType>(type: T, fields?: IEmbedSessionTrackFields<T>): void;
  pageView(path: string): void;
  setViewerId(viewerId: string | null): void;
  media(mediaId: string, options?: { inferSeeks?: boolean }): IEmbedSessionMediaHandle;
  chatContext(): IEmbedSessionChatContext;
  flush(): Promise<void>;
}
