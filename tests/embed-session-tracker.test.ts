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
  const transport: EmbedSessionTransport = {
    send(_url, body) {
      sends.push(structuredClone(body));
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
    expect(fake.sends[0]?.context).toMatchObject({ path: '/library?utm_source=email', embedded: false, utm: { utmSource: 'email' } });
    expect(types(fake.sends[0])).toEqual([EmbedSessionEventType.SESSION_START]);
    expect(local.entries.get(VISITOR_KEY)).toBe(first.visitorId);

    first.pageView('/library/media/m1');
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

    await vi.advanceTimersByTimeAsync(31 * 60_000);
    const idleEnd = fake.sends.findLast((body) => body.events.some((event) => event.type === EmbedSessionEventType.SESSION_END));
    expect(idleEnd?.events.at(-1)?.data).toEqual({ reason: 'idle_timeout' });
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
});
