import {
  EMBED_SESSION_EVENTS,
  EmbedSessionEndReason,
  EmbedSessionEventSource,
  EmbedSessionEventType,
} from '../enums/embedSession.js';
import type {
  EmbedSessionEventData,
  EmbedSessionMediaHandle,
  EmbedSessionStorageLike,
  EmbedSessionTrackFields,
  EmbedSessionTracker,
  EmbedSessionTrackerOptions,
  EmbedSessionTransport,
  IEmbedSessionCampaign,
  IEmbedSessionClientEvent,
  IEmbedSessionContext,
  IEmbedSessionMediaRuntime,
  IEmbedSessionMediaTotals,
  IEmbedSessionSaveBody,
  IEmbedSessionSaveResponse,
  IEmbedSessionTotals,
  IEmbedSessionTrackerState,
} from '../interfaces/embedSession.js';
import {
  EMBED_SESSION_DATA_KEY_PATTERN,
  EMBED_SESSION_ID_PATTERN,
  EMBED_SESSION_LIMITS,
  EMBED_SESSION_PROTOCOL_VERSION,
  EMBED_VIEWER_ID_PATTERN,
} from '../utils/embedSession.js';
import {
  createEmbedSessionMediaHandle,
  createEmbedSessionMediaRuntime,
  settleEmbedSessionMediaPlayback,
} from './playback.js';

const SESSION_STORAGE_PREFIX = 'speak.embedSession.';
const VISITOR_STORAGE_PREFIX = 'speak.embedVisitor.';
const CLAIM_CHANNEL_NAME = 'speak-embed-session';
const CLAIM_TIMEOUT_MS = 150;
const TICK_INTERVAL_MS = 1_000;
const MAX_TICK_DELTA_MS = 5_000;
const MOUSEMOVE_THROTTLE_MS = 5_000;
const FALLBACK_PATH = '/';
const CREDENTIALED_HOST = 'speakai.co';
const BEACON_CONTENT_TYPE = 'text/plain;charset=UTF-8';
const KEEPALIVE_BODY_BYTES = 32_768;
const EVENTS_PER_BATCH = 200;
const STORAGE_KEY_HASH_OFFSET = 0xcbf29ce484222325n;
const STORAGE_KEY_HASH_PRIME = 0x100000001b3n;
const STORAGE_KEY_HASH_MASK = 0xffffffffffffffffn;
const STORAGE_KEY_HASH_LENGTH = 16;
const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const UTM_PARAMS: Readonly<Record<keyof IEmbedSessionCampaign, string>> = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmTerm: 'utm_term',
  utmContent: 'utm_content',
};
const ACTIVITY_NEUTRAL_EVENTS: ReadonlySet<EmbedSessionEventType> = new Set([
  EmbedSessionEventType.SESSION_END,
  EmbedSessionEventType.HIDDEN,
  EmbedSessionEventType.IDLE,
]);
const SESSION_LIFECYCLE_EVENTS: ReadonlySet<EmbedSessionEventType> = new Set([
  EmbedSessionEventType.SESSION_START,
  EmbedSessionEventType.SESSION_RESUME,
  EmbedSessionEventType.SESSION_END,
]);

interface QueuedAction {
  at: number;
  action: () => void;
}

interface ClaimMessage {
  type: 'claim' | 'owned';
  sessionId: string;
}

const hasWindow = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

function randomId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function browserStorage(kind: 'sessionStorage' | 'localStorage'): EmbedSessionStorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind] ?? null;
  } catch {
    return null;
  }
}

function readStorage(storage: EmbedSessionStorageLike | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: EmbedSessionStorageLike | null, key: string, value: string | null): void {
  if (!storage) return;
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    return;
  }
}

function storageKeyHash(value: string): string {
  let hash = STORAGE_KEY_HASH_OFFSET;
  for (const byte of new TextEncoder().encode(value)) {
    hash = ((hash ^ BigInt(byte)) * STORAGE_KEY_HASH_PRIME) & STORAGE_KEY_HASH_MASK;
  }
  return hash.toString(16).padStart(STORAGE_KEY_HASH_LENGTH, '0');
}

function zeroTotals(): IEmbedSessionTotals {
  return { timing: { wallClockMs: 0, visibleMs: 0, activeMs: 0 }, pageViews: 0, media: [] };
}

function isTrackerState(value: unknown): value is IEmbedSessionTrackerState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<IEmbedSessionTrackerState>;
  return (
    typeof state.sessionId === 'string' &&
    EMBED_SESSION_ID_PATTERN.test(state.sessionId) &&
    typeof state.visitorId === 'string' &&
    EMBED_SESSION_ID_PATTERN.test(state.visitorId) &&
    typeof state.startedAt === 'number' &&
    typeof state.lastActivityAt === 'number' &&
    typeof state.seq === 'number' &&
    typeof state.eventIndex === 'number' &&
    Array.isArray(state.pending) &&
    !!state.totals &&
    typeof state.totals === 'object' &&
    !!state.totals.timing &&
    Array.isArray(state.totals.media)
  );
}

function validViewerId(viewerId: string | null | undefined): string | null {
  return typeof viewerId === 'string' && EMBED_VIEWER_ID_PATTERN.test(viewerId) ? viewerId : null;
}

function sanitizeData(data: EmbedSessionEventData): EmbedSessionEventData {
  const clean: EmbedSessionEventData = {};
  for (const [key, value] of Object.entries(data)) {
    if (!EMBED_SESSION_DATA_KEY_PATTERN.test(key)) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      clean[key] = value;
    }
  }
  return clean;
}

function readCampaign(search: string): IEmbedSessionCampaign | undefined {
  const params = new URLSearchParams(search);
  const campaign: IEmbedSessionCampaign = {};
  let found = false;
  for (const [field, param] of Object.entries(UTM_PARAMS) as [keyof IEmbedSessionCampaign, string][]) {
    const value = params.get(param);
    if (!value) continue;
    campaign[field] = value;
    found = true;
  }
  return found ? campaign : undefined;
}

function readReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === 'null') return undefined;
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return undefined;
  }
}

function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function readContext(): IEmbedSessionContext {
  if (!hasWindow()) return { path: FALLBACK_PATH, embedded: false };
  try {
    const context: IEmbedSessionContext = {
      path: window.location.pathname || FALLBACK_PATH,
      embedded: isEmbedded(),
    };
    const referrer = readReferrer();
    if (referrer) context.referrer = referrer;
    if (window.screen) context.screen = `${window.screen.width}x${window.screen.height}`;
    if (navigator.language) context.language = navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) context.timeZone = timeZone;
    if (navigator.userAgent) context.userAgent = navigator.userAgent;
    const utm = readCampaign(window.location.search);
    if (utm) context.utm = utm;
    return context;
  } catch {
    return { path: FALLBACK_PATH, embedded: false };
  }
}

function isVisible(): boolean {
  return hasWindow() && document.visibilityState === 'visible';
}

function isCredentialedHost(): boolean {
  if (typeof location === 'undefined') return false;
  const { hostname } = location;
  return hostname === CREDENTIALED_HOST || hostname.endsWith(`.${CREDENTIALED_HOST}`);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function createDefaultTransport(): EmbedSessionTransport {
  const post = async (url: string, body: IEmbedSessionSaveBody, token: string) => {
    const payload = JSON.stringify(body);
    const response = await fetch(url, {
      method: 'POST',
      keepalive: byteLength(payload) <= KEEPALIVE_BODY_BYTES,
      headers: { 'Content-Type': 'application/json', 'x-speakai-player-token': token },
      credentials: isCredentialedHost() ? 'include' : 'omit',
      body: payload,
    });
    let data;
    try {
      data = (await response.json())?.data;
    } catch {
      data = undefined;
    }
    return { status: response.status, data };
  };
  return {
    send: (url, body, token) => post(url, body, token),
    beacon(url, body, token) {
      let queued = false;
      try {
        queued =
          typeof navigator !== 'undefined' &&
          typeof navigator.sendBeacon === 'function' &&
          navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: BEACON_CONTENT_TYPE }));
      } catch {
        queued = false;
      }
      if (!queued) post(url, body, token).catch(() => undefined);
      return true;
    },
  };
}

export function createEmbedSessionTracker(options: EmbedSessionTrackerOptions): EmbedSessionTracker {
  const now = options.now ?? (() => Date.now());
  const transport = options.transport ?? createDefaultTransport();
  const url = `${options.apiBaseUrl.replace(/\/+$/, '')}/embed/session?token=${encodeURIComponent(options.token)}`;
  const sessionStore = options.sessionStorage === undefined ? browserStorage('sessionStorage') : options.sessionStorage;
  const localStore = options.localStorage === undefined ? browserStorage('localStorage') : options.localStorage;
  const tokenHash = storageKeyHash(options.token);
  const sessionKey = `${SESSION_STORAGE_PREFIX}${tokenHash}`;
  const visitorKey = `${VISITOR_STORAGE_PREFIX}${tokenHash}`;

  const loadStoredState = (): IEmbedSessionTrackerState | null => {
    const raw = readStorage(sessionStore, sessionKey);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isTrackerState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const loadVisitorId = (fallback: string | undefined): string => {
    const stored = readStorage(localStore, visitorKey);
    const visitorId = stored && EMBED_SESSION_ID_PATTERN.test(stored) ? stored : (fallback ?? randomId());
    if (visitorId !== stored) writeStorage(localStore, visitorKey, visitorId);
    return visitorId;
  };

  const storedState = loadStoredState();
  const visitorId = loadVisitorId(storedState?.visitorId);

  const newState = (at: number, sessionId: string = randomId()): IEmbedSessionTrackerState => ({
    sessionId,
    visitorId,
    startedAt: at,
    lastActivityAt: at,
    seq: 0,
    eventIndex: 0,
    totals: zeroTotals(),
    pending: [],
  });

  const initialAt = now();
  let resumable =
    !!storedState &&
    storedState.lastActivityAt <= initialAt &&
    initialAt - storedState.lastActivityAt < EMBED_SESSION_LIMITS.sessionTimeoutMs;
  let state: IEmbedSessionTrackerState = resumable && storedState ? { ...storedState, visitorId } : newState(initialAt);
  let viewerId = validViewerId(options.viewerId);
  let viewerDirty = viewerId !== null;
  let started = false;
  let decided = false;
  let claiming = false;
  let ended = false;
  let dead = false;
  let pageHidden = false;
  let replayAt: number | null = null;
  let queued: QueuedAction[] = [];
  let inflight: Promise<void> | null = null;
  let retryBody: IEmbedSessionSaveBody | null = null;
  const finalBodies: IEmbedSessionSaveBody[] = [];
  let ackedTiming = '';
  let ackedPageViews = -1;
  const ackedMedia = new Map<string, string>();
  const runtimes = new Map<string, IEmbedSessionMediaRuntime>();
  const handles = new Map<string, EmbedSessionMediaHandle>();
  let lastInputAt = initialAt;
  let idleFrom = initialAt;
  let lastMouseMoveAt = 0;
  let hiddenAt: number | null = null;
  let pageHiddenAt: number | null = null;
  let lastTickAt = initialAt;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let claimTimer: ReturnType<typeof setTimeout> | null = null;
  let channel: BroadcastChannel | null = null;
  let detachListeners: (() => void)[] = [];

  const clock = (): number => replayAt ?? now();

  const reportError = (error: unknown): void => {
    try {
      options.onError?.(error);
    } catch {
      return;
    }
  };

  const persist = (): void => {
    if (ended) return;
    writeStorage(sessionStore, sessionKey, JSON.stringify(state));
  };

  const mediaTotals = (mediaId: string): IEmbedSessionMediaTotals => {
    const existing = state.totals.media.find((entry) => entry.mediaId === mediaId);
    if (existing) return existing;
    const created: IEmbedSessionMediaTotals = {
      mediaId,
      opens: 0,
      activeMs: 0,
      playedMs: 0,
      plays: 0,
      seeks: 0,
      maxPositionPct: 0,
      completed: false,
    };
    state.totals.media.push(created);
    return created;
  };

  const anyPlaying = (): boolean => {
    for (const runtime of runtimes.values()) if (runtime.playingSince !== null) return true;
    return false;
  };

  const settlePlayback = (at: number): void => {
    for (const runtime of runtimes.values()) {
      if (runtime.playingSince === null) continue;
      settleEmbedSessionMediaPlayback(runtime, mediaTotals(runtime.mediaId), at);
    }
  };

  const appendEvent = (type: EmbedSessionEventType, fields: EmbedSessionTrackFields = {}, at: number = clock()): void => {
    state.eventIndex += 1;
    const event: IEmbedSessionClientEvent = {
      i: state.eventIndex,
      t: Math.max(0, Math.round(at - state.startedAt)),
      type,
    };
    if (fields.mediaId) event.mediaId = fields.mediaId;
    if (fields.promptId) event.promptId = fields.promptId;
    if (fields.data) event.data = sanitizeData(fields.data);
    state.pending.push(event);
    if (!ACTIVITY_NEUTRAL_EVENTS.has(type)) state.lastActivityAt = Math.max(state.lastActivityAt, clock());
    persist();
    if (state.pending.length >= EVENTS_PER_BATCH) void flush();
  };

  const changedMedia = (): IEmbedSessionMediaTotals[] =>
    state.totals.media.filter((entry) => ackedMedia.get(entry.mediaId) !== JSON.stringify(entry));

  const timingKey = (totals: IEmbedSessionTotals): string =>
    `${totals.timing.visibleMs}:${totals.timing.activeMs}`;

  const isDirty = (): boolean =>
    retryBody !== null ||
    viewerDirty ||
    state.pending.length > 0 ||
    timingKey(state.totals) !== ackedTiming ||
    state.totals.pageViews !== ackedPageViews ||
    changedMedia().length > 0;

  const settleTotals = (at: number): void => {
    if (tickTimer !== null) tick();
    settlePlayback(at);
    const timing = state.totals.timing;
    timing.wallClockMs = Math.max(0, Math.round(at - state.startedAt));
    timing.visibleMs = Math.min(timing.visibleMs, timing.wallClockMs);
    timing.activeMs = Math.min(timing.activeMs, timing.wallClockMs);
  };

  const buildBody = (
    pendingEvents: IEmbedSessionClientEvent[],
    changed: IEmbedSessionMediaTotals[],
  ): IEmbedSessionSaveBody => {
    state.seq += 1;
    persist();
    const build = (events: IEmbedSessionClientEvent[], media: IEmbedSessionMediaTotals[]): IEmbedSessionSaveBody => ({
      version: EMBED_SESSION_PROTOCOL_VERSION,
      sessionId: state.sessionId,
      visitorId: state.visitorId,
      seq: state.seq,
      viewerId,
      context: readContext(),
      events,
      totals: {
        timing: { ...state.totals.timing },
        pageViews: state.totals.pageViews,
        media: media.map((entry) => ({ ...entry })),
      },
    });
    let events = pendingEvents.slice(0, EVENTS_PER_BATCH);
    let media = changed;
    let body = build(events, media);
    while (byteLength(JSON.stringify(body)) > KEEPALIVE_BODY_BYTES && (events.length > 1 || media.length > 1)) {
      if (events.length > 1) events = events.slice(0, Math.ceil(events.length / 2));
      else media = media.slice(0, Math.ceil(media.length / 2));
      body = build(events, media);
    }
    return body;
  };

  const buildNextBody = (): { body: IEmbedSessionSaveBody; partial: boolean } => {
    settleTotals(clock());
    const changed = changedMedia();
    const body = buildBody(state.pending, changed);
    return {
      body,
      partial: body.events.length < state.pending.length || body.totals.media.length < changed.length,
    };
  };

  const buildAllBodies = (at: number): IEmbedSessionSaveBody[] => {
    settleTotals(at);
    const bodies: IEmbedSessionSaveBody[] = [];
    let events = state.pending;
    let media = changedMedia();
    do {
      const body = buildBody(events, media);
      bodies.push(body);
      events = events.slice(body.events.length);
      media = media.slice(body.totals.media.length);
    } while (events.length > 0 || media.length > 0);
    return bodies;
  };

  const removeSentEvents = (body: IEmbedSessionSaveBody): void => {
    const lastIndex = body.events.reduce((max, event) => Math.max(max, event.i), 0);
    state.pending = state.pending.filter((event) => event.i > lastIndex);
  };

  const acknowledge = (body: IEmbedSessionSaveBody): void => {
    if (body.sessionId !== state.sessionId) return;
    removeSentEvents(body);
    ackedTiming = timingKey(body.totals);
    ackedPageViews = body.totals.pageViews;
    for (const entry of body.totals.media) ackedMedia.set(entry.mediaId, JSON.stringify(entry));
    if (body.viewerId === viewerId) viewerDirty = false;
    persist();
  };

  const resetAcks = (): void => {
    ackedTiming = '';
    ackedPageViews = -1;
    ackedMedia.clear();
    viewerDirty = viewerId !== null;
  };

  const forkSession = (): void => {
    const previousStartedAt = state.startedAt;
    const carried = state.pending.filter((event) => !SESSION_LIFECYCLE_EVENTS.has(event.type));
    const at = clock();
    const startAt = carried[0] ? Math.min(at, previousStartedAt + carried[0].t) : at;
    state = newState(startAt);
    resetAcks();
    appendEvent(EmbedSessionEventType.SESSION_START, { data: sessionStartData() }, startAt);
    for (const event of carried) {
      state.eventIndex += 1;
      state.pending.push({ ...event, i: state.eventIndex, t: Math.max(0, previousStartedAt + event.t - startAt) });
    }
    persist();
  };

  const isForked = (body: IEmbedSessionSaveBody, data: IEmbedSessionSaveResponse, isRetry: boolean): boolean =>
    !isRetry &&
    !ended &&
    !data.applied &&
    body.sessionId === state.sessionId &&
    (data.lastSeq === body.seq || data.lastSeq > state.seq);

  const deliver = async (body: IEmbedSessionSaveBody, isRetry: boolean): Promise<void> => {
    try {
      const response = await transport.send(url, body, options.token);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        if (data?.applied === false && !('lastSeq' in data)) {
          shutdown();
          return;
        }
        if (data && 'lastSeq' in data && data.lastSeq < body.seq) {
          retryBody = body;
          return;
        }
        retryBody = null;
        if (data && 'lastSeq' in data && isForked(body, data, isRetry)) forkSession();
        else acknowledge(body);
        return;
      }
      if (response.status === 404) {
        shutdown();
        return;
      }
      const neverAccepted = response.status >= 400 && response.status < 500 && response.status !== 429;
      retryBody = neverAccepted ? null : body;
      if (response.status === 429 || response.status >= 500) return;
      reportError(new Error(`Embed session save rejected with status ${response.status}`));
      if (neverAccepted && body.sessionId === state.sessionId) {
        removeSentEvents(body);
        persist();
      }
    } catch {
      retryBody = body;
    }
  };

  const flush = async (): Promise<void> => {
    if (dead || !decided) return;
    if (inflight) return inflight;
    const isRetry = retryBody !== null;
    let body = retryBody ?? finalBodies.shift() ?? null;
    let partial = false;
    if (!body && !ended && isDirty()) ({ body, partial } = buildNextBody());
    if (!body) return;
    inflight = deliver(body, isRetry).finally(() => {
      inflight = null;
    });
    await inflight;
    if (dead || retryBody !== null) return;
    if (ended && finalBodies.length === 0 && body.sessionId === state.sessionId) {
      writeStorage(sessionStore, sessionKey, null);
    }
    if (
      finalBodies.length > 0 ||
      body.sessionId !== state.sessionId ||
      (!ended && (partial || state.pending.length >= EVENTS_PER_BATCH))
    ) {
      await flush();
    }
  };

  const beacon = (body: IEmbedSessionSaveBody): void => {
    try {
      transport.beacon(url, body, options.token);
    } catch (error) {
      reportError(error);
    }
  };

  const beaconUnsentFinalBodies = (): void => {
    if (retryBody) beacon(retryBody);
    for (const body of finalBodies) beacon(body);
  };

  const sessionStartData = (): EmbedSessionEventData => {
    const context = readContext();
    return { path: context.path, embedded: context.embedded };
  };

  const beginNewSession = (at: number): void => {
    state = newState(at);
    ended = false;
    resumable = true;
    resetAcks();
    lastInputAt = at;
    idleFrom = at;
    appendEvent(EmbedSessionEventType.SESSION_START, { data: sessionStartData() }, at);
    void flush();
  };

  const whenReady = (action: () => void): void => {
    if (dead) return;
    if (!decided) {
      queued.push({ at: now(), action });
      return;
    }
    if (ended) beginNewSession(clock());
    action();
  };

  const decide = (owned: boolean): void => {
    if (claimTimer !== null) clearTimeout(claimTimer);
    claimTimer = null;
    claiming = false;
    decided = true;
    const at = now();
    if (resumable && !owned && !ended) {
      appendEvent(EmbedSessionEventType.SESSION_RESUME, { data: { gapMs: Math.max(0, at - state.lastActivityAt) } }, at);
    } else {
      if (owned || ended || state.eventIndex > 0) {
        state = newState(at);
        resetAcks();
      } else {
        state.startedAt = at;
        state.lastActivityAt = at;
      }
      ended = false;
      appendEvent(EmbedSessionEventType.SESSION_START, { data: sessionStartData() }, at);
    }
    resumable = true;
    lastInputAt = at;
    idleFrom = at;
    const replay = queued;
    queued = [];
    for (const item of replay) {
      replayAt = Math.max(item.at, state.startedAt);
      try {
        item.action();
      } finally {
        replayAt = null;
      }
    }
    void flush();
  };

  const tick = (): void => {
    const at = now();
    const delta = Math.min(MAX_TICK_DELTA_MS, Math.max(0, Math.round(at - lastTickAt)));
    lastTickAt = at;
    if (!decided || ended || dead || !isVisible()) return;
    state.totals.timing.visibleMs += delta;
    const playing = anyPlaying();
    if (playing) state.lastActivityAt = at;
    if (!playing && at - lastInputAt >= EMBED_SESSION_LIMITS.idleAfterMs) return;
    state.totals.timing.activeMs += delta;
    for (const runtime of runtimes.values()) {
      if (!runtime.isOpen) continue;
      const totals = mediaTotals(runtime.mediaId);
      if (totals) totals.activeMs += delta;
    }
  };

  const startTicker = (): void => {
    if (tickTimer !== null || !isVisible()) return;
    lastTickAt = now();
    tickTimer = setInterval(tick, TICK_INTERVAL_MS);
  };

  const stopTicker = (): void => {
    if (tickTimer === null) return;
    tick();
    clearInterval(tickTimer);
    tickTimer = null;
  };

  const idleExpired = (at: number): boolean =>
    !anyPlaying() &&
    at - state.lastActivityAt >= EMBED_SESSION_LIMITS.sessionTimeoutMs &&
    at - lastInputAt >= EMBED_SESSION_LIMITS.sessionTimeoutMs;

  const endForIdle = (): void => {
    const endAt = Math.max(state.startedAt, state.lastActivityAt);
    appendEvent(EmbedSessionEventType.SESSION_END, { data: { reason: EmbedSessionEndReason.IDLE_TIMEOUT } }, endAt);
    finalBodies.push(...buildAllBodies(endAt));
    state.pending = [];
    ended = true;
    resumable = false;
    void flush();
  };

  const onFlushTimer = (): void => {
    if (decided && !ended && !dead) {
      const at = now();
      if (anyPlaying()) {
        state.lastActivityAt = at;
        settlePlayback(at);
      } else if (idleExpired(at)) {
        endForIdle();
        return;
      }
    }
    void flush();
  };

  const onInput = (): void => {
    if (dead) return;
    const at = now();
    if (decided && ended) {
      beginNewSession(at);
    } else if (decided && idleExpired(at)) {
      endForIdle();
      beginNewSession(at);
    } else if (decided && isVisible() && !anyPlaying() && at - idleFrom > EMBED_SESSION_LIMITS.engagementGapMs) {
      appendEvent(EmbedSessionEventType.IDLE, { data: { durationMs: Math.round(at - idleFrom) } }, idleFrom);
    }
    lastInputAt = at;
    idleFrom = at;
    if (decided && !ended) state.lastActivityAt = at;
  };

  const onMouseMove = (): void => {
    const at = now();
    if (at - lastMouseMoveAt < MOUSEMOVE_THROTTLE_MS) return;
    lastMouseMoveAt = at;
    onInput();
  };

  const onVisibilityChange = (): void => {
    if (dead) return;
    const at = now();
    if (!isVisible()) {
      stopTicker();
      hiddenAt = at;
      persist();
      void flush();
      return;
    }
    if (decided && !ended && idleExpired(at)) {
      endForIdle();
    } else if (hiddenAt !== null && decided && !ended && at - hiddenAt > EMBED_SESSION_LIMITS.engagementGapMs) {
      appendEvent(EmbedSessionEventType.HIDDEN, { data: { durationMs: Math.round(at - hiddenAt) } }, hiddenAt);
    }
    hiddenAt = null;
    idleFrom = Math.max(idleFrom, at);
    startTicker();
  };

  const onPageHide = (): void => {
    if (dead) return;
    pageHidden = true;
    pageHiddenAt = now();
    if (!decided) return;
    if (ended) {
      beaconUnsentFinalBodies();
      return;
    }
    stopTicker();
    appendEvent(EmbedSessionEventType.SESSION_END, { data: { reason: EmbedSessionEndReason.PAGEHIDE } });
    for (const body of buildAllBodies(clock())) beacon(body);
  };

  const onPageShow = (event: Event): void => {
    if (dead) return;
    pageHidden = false;
    if (!(event as PageTransitionEvent).persisted || !decided || ended) return;
    const at = now();
    if (idleExpired(at)) {
      beginNewSession(at);
    } else {
      appendEvent(EmbedSessionEventType.SESSION_RESUME, {
        data: { gapMs: Math.max(0, at - (pageHiddenAt ?? at)) },
      });
    }
    lastInputAt = at;
    idleFrom = at;
    startTicker();
    void flush();
  };

  const onChannelMessage = (event: MessageEvent): void => {
    const message = event.data as Partial<ClaimMessage> | null;
    if (!message || message.sessionId !== state.sessionId) return;
    if (message.type === 'claim' && decided && !ended && !pageHidden && !dead) {
      channel?.postMessage({ type: 'owned', sessionId: state.sessionId } satisfies ClaimMessage);
    } else if (message.type === 'owned' && claiming) {
      decide(true);
    }
  };

  const openChannel = (): void => {
    if (channel || typeof BroadcastChannel === 'undefined') return;
    try {
      channel = new BroadcastChannel(CLAIM_CHANNEL_NAME);
      channel.onmessage = onChannelMessage;
    } catch {
      channel = null;
    }
  };

  const closeChannel = (): void => {
    if (!channel) return;
    const current = channel;
    channel = null;
    try {
      current.close();
    } catch {
      return;
    }
  };

  const attachListeners = (): void => {
    if (!hasWindow()) return;
    const listen = (target: EventTarget, type: string, handler: (event: Event) => void, capture = false): void => {
      const listenerOptions: AddEventListenerOptions = { passive: true, capture };
      target.addEventListener(type, handler, listenerOptions);
      detachListeners.push(() => target.removeEventListener(type, handler, listenerOptions));
    };
    for (const type of INPUT_EVENTS) listen(window, type, onInput, true);
    listen(window, 'scroll', onInput, true);
    listen(window, 'mousemove', onMouseMove, true);
    listen(window, 'pagehide', onPageHide);
    listen(window, 'pageshow', onPageShow);
    listen(document, 'visibilitychange', onVisibilityChange);
  };

  const teardown = (): void => {
    for (const detach of detachListeners) detach();
    detachListeners = [];
    if (tickTimer !== null) clearInterval(tickTimer);
    tickTimer = null;
    if (flushTimer !== null) clearInterval(flushTimer);
    flushTimer = null;
    if (claimTimer !== null) clearTimeout(claimTimer);
    claimTimer = null;
    claiming = false;
    closeChannel();
  };

  function shutdown(): void {
    dead = true;
    started = false;
    teardown();
    queued = [];
  }

  const tracker: EmbedSessionTracker = {
    get sessionId() {
      return state.sessionId;
    },
    get visitorId() {
      return state.visitorId;
    },
    start() {
      if (started || dead) return;
      started = true;
      attachListeners();
      flushTimer = setInterval(onFlushTimer, EMBED_SESSION_LIMITS.flushIntervalMs);
      startTicker();
      openChannel();
      if (decided) return;
      if (resumable && !ended && channel) {
        decided = false;
        claiming = true;
        channel.postMessage({ type: 'claim', sessionId: state.sessionId } satisfies ClaimMessage);
        claimTimer = setTimeout(() => decide(false), CLAIM_TIMEOUT_MS);
        return;
      }
      decide(false);
    },
    stop() {
      if (!started) return;
      started = false;
      teardown();
      if (decided) {
        persist();
        void flush();
      }
    },
    track(type, fields) {
      if (EMBED_SESSION_EVENTS[type]?.source !== EmbedSessionEventSource.CLIENT) return;
      whenReady(() => appendEvent(type, fields ?? {}));
    },
    pageView(path) {
      whenReady(() => {
        state.totals.pageViews += 1;
        const pathname = path.split(/[?#]/)[0] ?? '';
        appendEvent(EmbedSessionEventType.PAGE_VIEW, { data: { path: pathname } });
      });
    },
    setViewerId(nextViewerId) {
      const valid = validViewerId(nextViewerId);
      if (valid === viewerId) return;
      viewerId = valid;
      viewerDirty = valid !== null;
      void flush();
    },
    media(mediaId, mediaOptions) {
      const existing = handles.get(mediaId);
      if (existing) return existing;
      const runtime = createEmbedSessionMediaRuntime(mediaId, mediaOptions?.inferSeeks === true);
      const handle = createEmbedSessionMediaHandle(runtime, {
        clock,
        run: whenReady,
        totals: mediaTotals,
        emit: (type, fields) => appendEvent(type, fields),
        onActivity: () => {
          state.lastActivityAt = Math.max(state.lastActivityAt, clock());
        },
        onPlaybackStop: () => {
          idleFrom = Math.max(idleFrom, clock());
        },
      });
      runtimes.set(mediaId, runtime);
      handles.set(mediaId, handle);
      return handle;
    },
    chatContext() {
      return viewerId ? { embedSessionId: state.sessionId, viewerId } : { embedSessionId: state.sessionId };
    },
    flush,
  };

  return tracker;
}
