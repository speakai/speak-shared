import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmbedSessionEventType, EmbedSessionMediaOpenSource } from '../src/enums/index.js';
import type {
  EmbedSessionStorageLike,
  EmbedSessionTransport,
  IEmbedSessionSaveBody,
  IEmbedSessionSaveResponse,
  IEmbedSessionSaveSkippedResponse,
} from '../src/interfaces/index.js';
import { createEmbedSessionTracker } from '../src/index.js';

const TOKEN = 'embed-token';
const SESSION_PREFIX = 'speak.embedSession.';
const VISITOR_PREFIX = 'speak.embedVisitor.';

interface SaveResult {
  status: number;
  data?: IEmbedSessionSaveResponse | IEmbedSessionSaveSkippedResponse;
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

function hashedKey(storage: { entries: Map<string, string> }, prefix: string): string {
  const keys = [...storage.entries.keys()].filter((key) => key.startsWith(prefix));
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^speak\.embed(Session|Visitor)\.[0-9a-f]{16}$/);
  return keys[0]!;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('createEmbedSessionTracker', () => {
  it('starts, flushes, resumes after a refresh, beacons on pagehide and rolls over after the idle timeout', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fakeWindow = Object.assign(new EventTarget(), {
      location: { pathname: '/library', search: '?utm_source=email&code=secret', hostname: 'example.com' },
      screen: { width: 1440, height: 900 },
    });
    Object.assign(fakeWindow, { self: fakeWindow, top: fakeWindow });
    const fakeDocument = Object.assign(new EventTarget(), { visibilityState: 'visible', referrer: 'https://mail.example.com/inbox?thread=secret#m1' });
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
    expect(fake.sends[0]?.context).toMatchObject({
      path: '/library',
      referrer: 'https://mail.example.com/inbox',
      embedded: false,
      utm: { utmSource: 'email' },
    });
    expect(JSON.stringify(fake.sends[0])).not.toContain('secret');
    expect(types(fake.sends[0])).toEqual([EmbedSessionEventType.SESSION_START]);
    expect(local.entries.get(hashedKey(local, VISITOR_PREFIX))).toBe(first.visitorId);
    expect(JSON.stringify([...session.entries.keys(), ...local.entries.keys()])).not.toContain(TOKEN);

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
    const sessionKey = hashedKey(refreshedSession, SESSION_PREFIX);
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
    expect(refreshedSession.entries.has(sessionKey)).toBe(true);
    fakeWindow.dispatchEvent(new Event('pagehide'));
    expect(fake.beacons.at(-1)).toEqual(idleEnd);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fake.sends.at(-1)).toEqual(idleEnd);
    expect(refreshedSession.entries.has(sessionKey)).toBe(false);
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

  it('survives a StrictMode remount, hands a duplicated tab a new session, keeps long media ids intact and stops on a render-bot reply', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fake = fakeTransport();
    const session = memoryStorage();
    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: 'https://api.example.com/v1',
      transport: fake.transport,
      sessionStorage: session,
      localStorage: memoryStorage(),
      viewerId: 'not-a-viewer-id',
    });
    tracker.start();
    tracker.stop();
    tracker.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fake.sends.flatMap((body) => types(body))).toEqual([EmbedSessionEventType.SESSION_START]);
    expect(fake.sends[0]?.viewerId).toBeNull();

    const forkedId = tracker.sessionId;
    const longId = 'm'.repeat(150);
    const scrubbed = tracker.media(longId, { inferSeeks: true });
    scrubbed.open(EmbedSessionMediaOpenSource.LIST);
    scrubbed.timeUpdate(10, 100);
    scrubbed.timeUpdate(40, 100);
    tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'pricing' } });
    fake.respondWith((body) =>
      body.sessionId === forkedId ? { status: 200, data: { sessionId: forkedId, lastSeq: body.seq, applied: false } } : undefined,
    );
    await tracker.flush();

    const forkedSave = fake.sends.at(-2);
    expect(forkedSave?.events[0]?.mediaId).toBe(longId);
    expect(forkedSave?.totals.media[0]?.mediaId).toBe(forkedSave?.events[0]?.mediaId);
    expect(tracker.sessionId).not.toBe(forkedId);
    expect(fake.sends.at(-1)).toMatchObject({ seq: 1, sessionId: tracker.sessionId });
    expect(fake.sends.at(-1)?.events.map((event) => [event.i, event.type])).toEqual([
      [1, EmbedSessionEventType.SESSION_START],
      [2, EmbedSessionEventType.MEDIA_OPEN],
      [3, EmbedSessionEventType.SEEK],
      [4, EmbedSessionEventType.SEARCH],
    ]);
    expect(fake.sends.at(-1)?.events[2]?.data).toEqual({ fromSec: 10, toSec: 40 });
    expect(JSON.parse(session.entries.get(hashedKey(session, SESSION_PREFIX))!).pending).toEqual([]);
    tracker.stop();

    {
      const render = fakeTransport();
      render.respondWith(() => ({ status: 200, data: { applied: false } }));
      const bot = createEmbedSessionTracker({
        token: TOKEN,
        apiBaseUrl: 'https://api.example.com/v1',
        transport: render.transport,
        sessionStorage: memoryStorage(),
        localStorage: memoryStorage(),
      });
      bot.start();
      await vi.advanceTimersByTimeAsync(0);
      bot.track(EmbedSessionEventType.SEARCH, { data: { text: 'pricing' } });
      await bot.flush();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(render.sends.map((body) => body.seq)).toEqual([1]);
    }
  });

  it('sends long strings, many data keys, over 1,000 pending events and over 500 media intact', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fake = fakeTransport();
    let online = false;
    const delivered: IEmbedSessionSaveBody[] = [];
    fake.respondWith((body) => {
      if (!online) return { status: 503 };
      delivered.push(structuredClone(body));
      return undefined;
    });
    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: 'https://api.example.com/v1',
      transport: fake.transport,
      sessionStorage: memoryStorage(),
      localStorage: memoryStorage(),
    });
    tracker.start();
    await vi.advanceTimersByTimeAsync(0);

    const longText = 'q'.repeat(5_000);
    const manyKeys = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`key${index}`, `value${index}`]));
    const mediaIds = Array.from({ length: 600 }, (_, index) => `media-${index}-${'x'.repeat(200)}`);
    for (const mediaId of mediaIds) tracker.media(mediaId).open(EmbedSessionMediaOpenSource.LIST);
    for (let count = 0; count < 1_200; count += 1) {
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: longText, ...manyKeys } });
    }
    await vi.advanceTimersByTimeAsync(0);

    online = true;
    for (let round = 0; round < 100; round += 1) await tracker.flush();

    const events = new Map(delivered.flatMap((body) => body.events).map((event) => [event.i, event]));
    expect([...events.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 1_801 }, (_, index) => index + 1));
    const searches = [...events.values()].filter((event) => event.type === EmbedSessionEventType.SEARCH);
    expect(searches).toHaveLength(1_200);
    expect(searches.every((event) => event.data?.text === longText && Object.keys(event.data).length === 31)).toBe(true);
    const sentMedia = new Set(delivered.flatMap((body) => body.totals.media.map((entry) => entry.mediaId)));
    expect(sentMedia).toEqual(new Set(mediaIds));
    tracker.stop();
  });

  it('sends credentials only to speakai.co hosts, skips keepalive for an oversized body and splits the pagehide send into keepalive chunks', async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 16, 10) });
    const fakeWindow = Object.assign(new EventTarget(), { location: { pathname: '/', search: '', hostname: 'evilspeakai.co' } });
    Object.assign(fakeWindow, { self: fakeWindow, top: fakeWindow });
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('location', fakeWindow.location);
    const fakeDocument = Object.assign(new EventTarget(), { visibilityState: 'visible', referrer: '' });
    vi.stubGlobal('document', fakeDocument);
    const beaconBlobs: Blob[] = [];
    vi.stubGlobal('navigator', {
      language: 'en',
      sendBeacon: (_url: string, blob: Blob) => {
        beaconBlobs.push(blob);
        return true;
      },
    });
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      Promise.resolve({
        status: 200,
        json: async () => ({ data: { lastSeq: JSON.parse(String(init.body)).seq, applied: true } }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: 'https://api.example.com/v1',
      sessionStorage: memoryStorage(),
      localStorage: memoryStorage(),
    });
    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    fakeWindow.location.hostname = 'app.speakai.co';
    const hugeText = 'h'.repeat(40_000);
    tracker.track(EmbedSessionEventType.SEARCH, { data: { text: hugeText } });
    await tracker.flush();

    expect(fetchMock.mock.calls.map(([, init]) => [init.credentials, init.keepalive])).toEqual([
      ['omit', true],
      ['include', false],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1].body)).events[0].data.text).toBe(hugeText);

    for (let count = 0; count < 300; count += 1) {
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 's'.repeat(1_000) } });
    }
    fakeWindow.dispatchEvent(new Event('pagehide'));

    expect(beaconBlobs.length).toBeGreaterThan(1);
    expect(beaconBlobs.every((blob) => blob.size < 65_536)).toBe(true);
    const beaconed = await Promise.all(beaconBlobs.map(async (blob) => JSON.parse(await blob.text()) as IEmbedSessionSaveBody));
    const beaconedIndexes = beaconed.flatMap((body) => body.events.map((event) => event.i));
    expect(new Set(beaconedIndexes).size).toBe(beaconedIndexes.length);
    expect(beaconed.flatMap((body) => types(body))).toEqual([
      ...Array.from({ length: 300 }, () => EmbedSessionEventType.SEARCH),
      EmbedSessionEventType.SESSION_END,
    ]);
    tracker.stop();
  });
});
