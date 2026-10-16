import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmbedSessionEventType, EmbedSessionMediaOpenSource } from '../src/enums/index.js';
import type {
  EmbedSessionStorageLike,
  EmbedSessionTransport,
  IEmbedSessionSaveBody,
  IEmbedSessionSaveResponse,
} from '../src/interfaces/index.js';
import { createEmbedSessionTracker } from '../src/index.js';

const TOKEN = 'embed-token';
const SESSION_KEY = `speak.embedSession.${TOKEN}`;
const VISITOR_KEY = `speak.embedVisitor.${TOKEN}`;

interface SaveResult {
  status: number;
  data?: IEmbedSessionSaveResponse;
}

function memoryStorage(entries: Map<string, string> = new Map()): EmbedSessionStorageLike & { entries: Map<string, string> } {
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
  };
}

function fakeTransport() {
  const sends: IEmbedSessionSaveBody[] = [];
  const beacons: IEmbedSessionSaveBody[] = [];
  let hold: ((result: SaveResult) => void) | null = null;
  let holdNext = false;
  let respond: ((body: IEmbedSessionSaveBody) => SaveResult | undefined) | null = null;
  const transport: EmbedSessionTransport = {
    send(_url, body) {
      sends.push(structuredClone(body));
      const override = respond?.(body);
      if (override) return Promise.resolve(override);
      if (holdNext) {
        holdNext = false;
        return new Promise<SaveResult>((resolve) => {
          hold = resolve;
        });
      }
      return Promise.resolve({ status: 200, data: { sessionId: body.sessionId, lastSeq: body.seq, applied: true } });
    },
    beacon(_url, body) {
      beacons.push(structuredClone(body));
      return true;
    },
  };
  return {
    transport,
    sends,
    beacons,
    holdNextSend: () => {
      holdNext = true;
    },
    release: (result: SaveResult) => hold?.(result),
    respondWith: (responder: typeof respond) => {
      respond = responder;
    },
  };
}

const types = (body: IEmbedSessionSaveBody | undefined) => body?.events.map((event) => event.type);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('createEmbedSessionTracker', () => {
  it('starts, flushes, resumes after a refresh, beacons on pagehide and rolls over after the idle timeout', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fakeWindow = Object.assign(new EventTarget(), {
      location: { pathname: '/library', search: '?utm_source=email', hostname: 'example.com' },
      screen: { width: 1440, height: 900 },
    });
    Object.assign(fakeWindow, { self: fakeWindow, top: fakeWindow });
    const fakeDocument = Object.assign(new EventTarget(), { visibilityState: 'visible', referrer: 'https://mail.example.com/' });
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('document', fakeDocument);

    const session = memoryStorage();
    const local = memoryStorage();
    const fake = fakeTransport();
    const options = { token: TOKEN, apiBaseUrl: 'https://api.example.com/v1', transport: fake.transport, now: () => Date.now() };

    const first = createEmbedSessionTracker({ ...options, sessionStorage: session, localStorage: local });
    first.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(fake.sends).toHaveLength(1);
    expect(fake.sends[0]).toMatchObject({ version: 1, seq: 1, sessionId: first.sessionId, visitorId: first.visitorId, viewerId: null });
    expect(fake.sends[0]?.context).toMatchObject({ path: '/library', embedded: false, utm: { utmSource: 'email' } });
    expect(types(fake.sends[0])).toEqual([EmbedSessionEventType.SESSION_START]);
    expect(local.entries.get(VISITOR_KEY)).toBe(first.visitorId);

    first.pageView('/library/media/m1?code=secret#top');
    const media = first.media('m1');
    media.open(EmbedSessionMediaOpenSource.LIST);
    media.timeUpdate(0, 100);
    media.play(0);
    first.track(EmbedSessionEventType.CHAT_QUESTION);
    fake.holdNextSend();
    await vi.advanceTimersByTimeAsync(30_000);

    const inflight = fake.sends[1];
    expect(inflight?.seq).toBe(2);
    expect(types(inflight)).toEqual([EmbedSessionEventType.PAGE_VIEW, EmbedSessionEventType.MEDIA_OPEN, EmbedSessionEventType.PLAY]);
    expect(inflight?.events[0]?.data).toEqual({ path: '/library/media/m1' });
    expect(inflight?.totals.timing).toMatchObject({ wallClockMs: 30_000, visibleMs: 30_000, activeMs: 30_000 });
    expect(inflight?.totals.media[0]).toMatchObject({ mediaId: 'm1', opens: 1, plays: 1, playedMs: 30_000, activeMs: 30_000 });

    fakeWindow.dispatchEvent(new Event('pagehide'));
    expect(fake.beacons).toHaveLength(1);
    expect(fake.beacons[0]?.seq).toBe(3);
    expect(fake.beacons[0]?.events.map((event) => event.i)).toEqual([...inflight!.events.map((event) => event.i), 5]);
    expect(fake.beacons[0]?.events.at(-1)).toMatchObject({ type: EmbedSessionEventType.SESSION_END, data: { reason: 'pagehide' } });

    const refreshedSession = memoryStorage(new Map(session.entries));
    first.stop();
    fake.release({ status: 200, data: { sessionId: first.sessionId, lastSeq: 2, applied: true } });
    await vi.advanceTimersByTimeAsync(0);
    const sentBeforeRefresh = fake.sends.length;

    const second = createEmbedSessionTracker({ ...options, sessionStorage: refreshedSession, localStorage: local });
    second.start();
    expect(second.sessionId).toBe(first.sessionId);
    await vi.advanceTimersByTimeAsync(150);

    const resumed = fake.sends[sentBeforeRefresh];
    expect(resumed?.seq).toBe(4);
    expect(resumed?.sessionId).toBe(first.sessionId);
    expect(resumed?.events.map((event) => event.i)).toEqual([2, 3, 4, 5, 6]);
    expect(resumed?.events.at(-1)?.type).toBe(EmbedSessionEventType.SESSION_RESUME);

    const isIdleEnd = (body: IEmbedSessionSaveBody) => body.events.some((event) => event.type === EmbedSessionEventType.SESSION_END);
    let failedIdleEnd = false;
    fake.respondWith((body) => {
      if (!isIdleEnd(body) || failedIdleEnd) return undefined;
      failedIdleEnd = true;
      return { status: 503 };
    });
    await vi.advanceTimersByTimeAsync(30 * 60_000 + 30_000);
    const idleEnd = fake.sends.findLast(isIdleEnd);
    const lastActiveOffset = resumed!.events.at(-1)!.t;
    expect(idleEnd?.events.at(-1)).toMatchObject({ t: lastActiveOffset, data: { reason: 'idle_timeout' } });
    expect(idleEnd?.totals.timing.wallClockMs).toBe(lastActiveOffset);
    expect(refreshedSession.entries.has(SESSION_KEY)).toBe(true);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fake.sends.at(-1)).toEqual(idleEnd);
    expect(refreshedSession.entries.has(SESSION_KEY)).toBe(false);
    const sentAfterIdle = fake.sends.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fake.sends).toHaveLength(sentAfterIdle);

    fakeWindow.dispatchEvent(new Event('pointerdown'));
    await vi.advanceTimersByTimeAsync(0);
    const restarted = fake.sends.at(-1);
    expect(second.sessionId).not.toBe(first.sessionId);
    expect(restarted).toMatchObject({ seq: 1, sessionId: second.sessionId, visitorId: first.visitorId });
    expect(types(restarted)).toEqual([EmbedSessionEventType.SESSION_START]);

    second.stop();
  });

  it('survives a StrictMode remount, hands a duplicated tab a new session and caps long media ids', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fake = fakeTransport();
    const session = memoryStorage();
    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: 'https://api.example.com/v1',
      transport: fake.transport,
      sessionStorage: session,
      localStorage: memoryStorage(),
    });
    tracker.start();
    tracker.stop();
    tracker.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fake.sends.flatMap((body) => types(body))).toEqual([EmbedSessionEventType.SESSION_START]);

    const forkedId = tracker.sessionId;
    const longId = 'm'.repeat(150);
    tracker.media(longId).open(EmbedSessionMediaOpenSource.LIST);
    tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'pricing' } });
    fake.respondWith((body) =>
      body.sessionId === forkedId ? { status: 200, data: { sessionId: forkedId, lastSeq: body.seq, applied: false } } : undefined,
    );
    await tracker.flush();

    const forkedSave = fake.sends.at(-2);
    expect(forkedSave?.events[0]?.mediaId).toHaveLength(100);
    expect(forkedSave?.totals.media[0]?.mediaId).toBe(forkedSave?.events[0]?.mediaId);
    expect(tracker.sessionId).not.toBe(forkedId);
    expect(fake.sends.at(-1)).toMatchObject({ seq: 1, sessionId: tracker.sessionId });
    expect(fake.sends.at(-1)?.events.map((event) => [event.i, event.type])).toEqual([
      [1, EmbedSessionEventType.SESSION_START],
      [2, EmbedSessionEventType.MEDIA_OPEN],
      [3, EmbedSessionEventType.SEARCH],
    ]);
    expect(JSON.parse(session.entries.get(SESSION_KEY)!).pending).toEqual([]);

    tracker.stop();
  });

  it('keeps the keepalive budget for the pagehide save', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fakeWindow = Object.assign(new EventTarget(), { location: { pathname: '/', search: '', hostname: 'example.com' } });
    Object.assign(fakeWindow, { self: fakeWindow, top: fakeWindow });
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible', referrer: '' }));
    vi.stubGlobal('navigator', { sendBeacon: () => false, language: 'en' });
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => ({
      status: 200,
      json: async () => ({ data: { lastSeq: JSON.parse(String(init.body)).seq, applied: true } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: 'https://api.example.com/v1',
      sessionStorage: memoryStorage(),
      localStorage: memoryStorage(),
    });
    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    fakeWindow.dispatchEvent(new Event('pagehide'));

    expect(fetchMock.mock.calls.map(([, init]) => init.keepalive)).toEqual([false, true]);
    tracker.stop();
  });
});
