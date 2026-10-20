import { EMBED_SESSION_EVENTS } from '../enums/embedSession.js';
import type { EmbedSessionEventCategory, EmbedSessionEventType } from '../enums/embedSession.js';

export const EMBED_SESSION_PROTOCOL_VERSION = 1;
export const EMBED_SESSION_LEGACY_PREFIX = 'legacy:';
export const EMBED_SESSION_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
export const EMBED_SESSION_UNKNOWN_VALUE = 'unknown';
export const EMBED_VIEWER_ID_PATTERN = /^[a-f0-9]{32}$/;
export const EMBED_SESSION_DATA_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
export const EMBED_SESSION_LIMITS = {
  flushIntervalMs: 30_000,
  idleAfterMs: 60_000,
  engagementGapMs: 60_000,
  sessionTimeoutMs: 1_800_000,
  maxSessionMs: 86_400_000,
  liveWindowMs: 60_000,
  maxEventsPerDocument: 10_000,
  completedPositionPct: 95,
  eventsPageSize: 200,
  maxEventsPageSize: 500,
  listPageSize: 25,
  maxListPageSize: 100,
  mediaPageSize: 25,
  maxMediaPageSize: 100,
  maxSearchLength: 100,
  searchDebounceMs: 1_000,
} as const;

export const isLegacyEmbedSessionId = (sessionId: string): boolean =>
  sessionId.startsWith(EMBED_SESSION_LEGACY_PREFIX);

export const embedSessionEventCategory = (type: EmbedSessionEventType): EmbedSessionEventCategory =>
  EMBED_SESSION_EVENTS[type].category;

export const embedSessionVisitorCode = (visitorId: string): string =>
  visitorId.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
