import { EMBED_SESSION_EVENTS } from '../enums/embedSession.js';
import type { EmbedSessionEventCategory, EmbedSessionEventType } from '../enums/embedSession.js';

export const EMBED_SESSION_PROTOCOL_VERSION = 1;
export const EMBED_SESSION_LEGACY_PREFIX = 'legacy:';
export const EMBED_SESSION_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
export const EMBED_VIEWER_ID_PATTERN = /^[a-f0-9]{32}$/;
export const EMBED_SESSION_DATA_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
export const EMBED_SESSION_LIMITS = {
  flushIntervalMs: 30_000,
  idleAfterMs: 60_000,
  engagementGapMs: 60_000,
  sessionTimeoutMs: 1_800_000,
  liveWindowMs: 60_000,
  maxEventsPerBatch: 200,
  maxPendingEvents: 1_000,
  maxEventsPerDocument: 10_000,
  maxMediaPerSession: 500,
  maxMediaPerBatch: 200,
  maxBodyBytes: 65_536,
  maxDataKeys: 10,
  maxDataStringLength: 500,
  maxSearchTextLength: 200,
  maxPathLength: 500,
  maxReferrerLength: 2_000,
  maxEventOffsetMs: 7 * 24 * 3_600_000,
  completedPositionPct: 95,
  eventsPageSize: 200,
  maxEventsPageSize: 500,
} as const;

export const isLegacyEmbedSessionId = (sessionId: string): boolean =>
  sessionId.startsWith(EMBED_SESSION_LEGACY_PREFIX);

export const embedSessionEventCategory = (type: EmbedSessionEventType): EmbedSessionEventCategory =>
  EMBED_SESSION_EVENTS[type].category;

export const embedSessionVisitorCode = (visitorId: string): string =>
  visitorId.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
