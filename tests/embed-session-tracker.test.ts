import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmbedSessionEventType, EmbedSessionMediaOpenSource } from '../src/enums/index.js';
import type { IEmbedSessionSaveBody, IEmbedSessionTrackerOptions } from '../src/interfaces/index.js';
import { createEmbedSessionTracker } from '../src/index.js';

const TOKEN = 'embed-token';
const API = 'https://api.example.com/v1';
const STARTED_AT = Date.UTC(2026, 9, 16, 10);
const SESSION_PREFIX = 'speak.embedSession.';
const VISITOR_PREFIX = 'speak.embedVisitor.';

type StorageLike = NonNullable<IEmbedSessionTrackerOptions['sessionStorage']>;
type Transport = NonNullable<IEmbedSessionTrackerOptions['transport']>;
type SaveResult = Awaited<ReturnType<Transport['send']>>;
type MemoryStorage = ReturnType<typeof memoryStorage>;
type FakeTransport = ReturnType<typeof fakeTransport>;

function memoryStorage(entries: Map<string, string> = new Map()): StorageLike & { entries: Map<string, string>; writes: number } {
  const storage = {
    entries,
    writes: 0,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.writes += 1;
      entries.set(key, value);
    },
    removeItem: (key: string) => void entries.delete(key),
  };
  return storage;
}

function fakeTransport() {
  const sends: IEmbedSessionSaveBody[] = [];
  const beacons: IEmbedSessionSaveBody[] = [];
  let hold: ((result: SaveResult) => void) | null = null;
  let holdNext = false;
  let respond: ((body: IEmbedSessionSaveBody) => SaveResult | undefined) | null = null;
  const transport: Transport = {
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

/** Stubs a top-level (not embedded) page; returns the fakes so a test can dispatch events or flip visibility. */
function stubPage(page: { location?: Record<string, string>; referrer?: string; visibilityState?: string; screen?: object } = {}) {
  const fakeWindow = Object.assign(new EventTarget(), {
    location: { pathname: '/', search: '', hostname: 'example.com', ...page.location },
    ...(page.screen ? { screen: page.screen } : {}),
  });
  Object.assign(fakeWindow, { self: fakeWindow, top: fakeWindow });
  const fakeDocument = Object.assign(new EventTarget(), {
    visibilityState: page.visibilityState ?? 'visible',
    referrer: page.referrer ?? '',
  });
  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('document', fakeDocument);
  return { fakeWindow, fakeDocument };
}

const types = (body: IEmbedSessionSaveBody | undefined) => body?.events.map((event) => event.type);
const storedIndexes = (storage: { entries: Map<string, string> }, key: string): number[] =>
  JSON.parse(storage.entries.get(key)!).pending.map((event: { i: number }) => event.i);
const isSessionEnd = (body: IEmbedSessionSaveBody) => body.events.some((event) => event.type === EmbedSessionEventType.SESSION_END);

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
  it('records, stores and sends nothing in an automated browser while every method stays safe to call', async () => {
    vi.stubGlobal('window', Object.assign(new EventTarget(), { location: { pathname: '/', search: '', hostname: 'example.com' } }));
    vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible', referrer: '' }));
    vi.stubGlobal('navigator', { webdriver: true });
    const session = memoryStorage();
    const local = memoryStorage();
    const fake = fakeTransport();

    const tracker = createEmbedSessionTracker({
      token: TOKEN,
      apiBaseUrl: API,
      transport: fake.transport,
      sessionStorage: session,
      localStorage: local,
    });
    tracker.start();
    tracker.pageView('/library');
    tracker.track(EmbedSessionEventType.CHAT_QUESTION);
    tracker.setViewerId('9c0e1d2f3a4b5c6d7e8f9a0b1c2d3e4f');
    const media = tracker.media('m1');
    media.open(EmbedSessionMediaOpenSource.LIST);
    media.play(0);
    await tracker.flush();
    tracker.stop();

    expect(tracker.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(tracker.chatContext()).toEqual({ embedSessionId: '' });
    expect(fake.sends).toEqual([]);
    expect(fake.beacons).toEqual([]);
    expect(session.writes + local.writes).toBe(0);
  });

  it('exposes the tracker, event map and helpers from the root barrel without touching the DOM', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    const pkg = await import('../src/index.js');

    expect(typeof pkg.createEmbedSessionTracker).toBe('function');
    expect(Object.keys(pkg.EMBED_SESSION_EVENTS).sort()).toEqual(Object.values(EmbedSessionEventType).sort());
    const serverTypes = Object.entries(pkg.EMBED_SESSION_EVENTS)
      .filter(([, entry]) => entry.source === pkg.EmbedSessionEventSource.SERVER)
      .map(([type]) => type)
      .sort();
    expect(serverTypes).toEqual([EmbedSessionEventType.CHAT_QUESTION, EmbedSessionEventType.LEAD_CAPTURED]);
    expect(pkg.isLegacyEmbedSessionId('legacy:abc')).toBe(true);
    expect(pkg.embedSessionVisitorCode('7f3a91c2-0b6e-4e9b-8d1a-5c2e4f6a8b10')).toBe('7F3A');
    expect(pkg.embedSessionEventCategory(EmbedSessionEventType.SEEK)).toBe('playback');

    const tracker = pkg.createEmbedSessionTracker({ token: 't', apiBaseUrl: API });
    expect(pkg.EMBED_SESSION_ID_PATTERN.test(tracker.sessionId)).toBe(true);
    expect(tracker.chatContext()).toEqual({ embedSessionId: tracker.sessionId });
  });

  describe('a visit: first save, burst, pagehide, refresh and idle end', () => {
    async function startVisit() {
      vi.useFakeTimers({ now: STARTED_AT });
      const { fakeWindow } = stubPage({
        location: { pathname: '/library', search: '?utm_source=email&code=secret' },
        referrer: 'https://mail.example.com/inbox?thread=secret#m1',
        screen: { width: 1440, height: 900 },
      });
      const session = memoryStorage();
      const local = memoryStorage();
      const fake = fakeTransport();
      const options = { token: TOKEN, apiBaseUrl: API, transport: fake.transport, now: () => Date.now() };
      const first = createEmbedSessionTracker({ ...options, sessionStorage: session, localStorage: local });
      first.start();
      await vi.advanceTimersByTimeAsync(0);
      return { fakeWindow, session, local, fake, options, first };
    }
    type Visit = Awaited<ReturnType<typeof startVisit>>;

    /** Fires a burst of events, lets the 1 s storage debounce run, then holds the 30 s save in flight. */
    async function burstThenHoldSave({ first, session, fake }: Visit) {
      const firstKey = hashedKey(session, SESSION_PREFIX);
      const writesBeforeBurst = session.writes;
      first.pageView('/library/media/m1?code=secret#top');
      const media = first.media('m1');
      media.open(EmbedSessionMediaOpenSource.LIST);
      media.timeUpdate(0, 100);
      media.play(0);
      first.track(EmbedSessionEventType.CHAT_QUESTION);
      const writesRightAfterBurst = session.writes;
      await vi.advanceTimersByTimeAsync(1_000);
      const writesAfterDebounce = session.writes;
      const storedAfterDebounce = storedIndexes(session, firstKey);
      const coalescedSession = memoryStorage(new Map(session.entries));
      fake.holdNextSend();
      await vi.advanceTimersByTimeAsync(29_000);
      return { firstKey, writesBeforeBurst, writesRightAfterBurst, writesAfterDebounce, storedAfterDebounce, coalescedSession, inflight: fake.sends[1]! };
    }

    /** Pagehide, then a refresh that resumes from what the first page stored. */
    async function pagehideThenRefresh(visit: Visit) {
      visit.fakeWindow.dispatchEvent(new Event('pagehide'));
      const refreshedSession = memoryStorage(new Map(visit.session.entries));
      visit.first.stop();
      visit.fake.release({ status: 200, data: { sessionId: visit.first.sessionId, lastSeq: 2, applied: true } });
      await vi.advanceTimersByTimeAsync(0);
      const sentBeforeRefresh = visit.fake.sends.length;
      const second = createEmbedSessionTracker({ ...visit.options, sessionStorage: refreshedSession, localStorage: visit.local });
      second.start();
      const sessionKey = hashedKey(refreshedSession, SESSION_PREFIX);
      await vi.advanceTimersByTimeAsync(150);
      return { refreshedSession, second, sessionKey, resumed: visit.fake.sends[sentBeforeRefresh]! };
    }

    /** Leaves the resumed session idle for 30 minutes; the first idle-end save answers 503. */
    async function idleOut({ fake, fakeWindow }: Visit, { refreshedSession, sessionKey }: Awaited<ReturnType<typeof pagehideThenRefresh>>) {
      let failedIdleEnd = false;
      fake.respondWith((body) => {
        if (!isSessionEnd(body) || failedIdleEnd) return undefined;
        failedIdleEnd = true;
        return { status: 503 };
      });
      await vi.advanceTimersByTimeAsync(30 * 60_000 + 30_000);
      const idleEnd = fake.sends.findLast(isSessionEnd)!;
      const storedAfterFailedEnd = refreshedSession.entries.has(sessionKey);
      fakeWindow.dispatchEvent(new Event('pagehide'));
      const beaconAfterIdle = fake.beacons.at(-1);
      await vi.advanceTimersByTimeAsync(30_000);
      const retriedEnd = fake.sends.at(-1);
      const storedAfterRetry = refreshedSession.entries.has(sessionKey);
      const sentAfterIdle = fake.sends.length;
      await vi.advanceTimersByTimeAsync(60_000);
      return { idleEnd, storedAfterFailedEnd, beaconAfterIdle, retriedEnd, storedAfterRetry, sentAfterIdle, sentAfterQuiet: fake.sends.length };
    }

    it('sends the first save with the page context, strips query and referrer secrets and keeps the token out of storage', async () => {
      const { fake, first, local, session } = await startVisit();

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
    });

    it('coalesces a burst into one storage write and one 30 s save carrying page and media totals', async () => {
      const burst = await burstThenHoldSave(await startVisit());

      expect(burst.writesRightAfterBurst).toBe(burst.writesBeforeBurst);
      expect(burst.writesAfterDebounce).toBe(burst.writesBeforeBurst + 1);
      expect(burst.storedAfterDebounce).toEqual([2, 3, 4]);
      expect(burst.inflight.seq).toBe(2);
      expect(types(burst.inflight)).toEqual([EmbedSessionEventType.PAGE_VIEW, EmbedSessionEventType.MEDIA_OPEN, EmbedSessionEventType.PLAY]);
      expect(burst.inflight.events[0]?.data).toEqual({ path: '/library/media/m1' });
      expect(burst.inflight.totals.timing).toMatchObject({ wallClockMs: 30_000, visibleMs: 30_000, activeMs: 30_000 });
      expect(burst.inflight.totals.media[0]).toMatchObject({ mediaId: 'm1', opens: 1, plays: 1, playedMs: 30_000, activeMs: 30_000 });
    });

    it('on pagehide beacons the session end first, re-beacons the in-flight batch and keeps both stored', async () => {
      const visit = await startVisit();
      const burst = await burstThenHoldSave(visit);
      visit.fakeWindow.dispatchEvent(new Event('pagehide'));

      expect(visit.fake.beacons.map((body) => body.seq)).toEqual([3, 4]);
      expect(visit.fake.beacons[0]?.events).toEqual([
        expect.objectContaining({ i: 5, type: EmbedSessionEventType.SESSION_END, data: { reason: 'pagehide' } }),
      ]);
      expect(visit.fake.beacons[0]?.totals.media[0]).toMatchObject({ mediaId: 'm1', opens: 1, plays: 1, playedMs: 30_000 });
      expect(visit.fake.beacons[1]?.events.map((event) => event.i)).toEqual(burst.inflight.events.map((event) => event.i));
      expect(storedIndexes(visit.session, burst.firstKey)).toEqual([2, 3, 4, 5]);
    });

    it('resumes the same session from storage written before the save landed and re-sends every stored event', async () => {
      const visit = await startVisit();
      const { coalescedSession } = await burstThenHoldSave(visit);
      visit.first.stop();

      const coalescedFake = fakeTransport();
      const fromCoalesced = createEmbedSessionTracker({
        ...visit.options,
        transport: coalescedFake.transport,
        sessionStorage: coalescedSession,
        localStorage: visit.local,
      });
      fromCoalesced.start();
      await vi.advanceTimersByTimeAsync(150);
      expect(coalescedFake.sends[0]).toMatchObject({ seq: 2, sessionId: visit.first.sessionId });
      expect(coalescedFake.sends[0]?.events.map((event) => event.i)).toEqual([2, 3, 4, 5]);
      expect(types(coalescedFake.sends[0])).toEqual([
        EmbedSessionEventType.PAGE_VIEW,
        EmbedSessionEventType.MEDIA_OPEN,
        EmbedSessionEventType.PLAY,
        EmbedSessionEventType.SESSION_RESUME,
      ]);
      fromCoalesced.stop();
    });

    it('resumes the same session after a pagehide refresh, continuing seq and appending a resume event', async () => {
      const visit = await startVisit();
      await burstThenHoldSave(visit);
      const { second, resumed } = await pagehideThenRefresh(visit);

      expect(second.sessionId).toBe(visit.first.sessionId);
      expect(resumed.seq).toBe(5);
      expect(resumed.sessionId).toBe(visit.first.sessionId);
      expect(resumed.events.map((event) => event.i)).toEqual([2, 3, 4, 5, 6]);
      expect(resumed.events.at(-1)?.type).toBe(EmbedSessionEventType.SESSION_RESUME);
      second.stop();
    });

    it('ends an idle session at its last activity, retries a failed end, then clears storage and goes quiet', async () => {
      const visit = await startVisit();
      await burstThenHoldSave(visit);
      const refresh = await pagehideThenRefresh(visit);
      const idle = await idleOut(visit, refresh);

      const lastActiveOffset = refresh.resumed.events.at(-1)!.t;
      expect(idle.idleEnd.events.at(-1)).toMatchObject({ t: lastActiveOffset, data: { reason: 'idle_timeout' } });
      expect(idle.idleEnd.totals.timing.wallClockMs).toBe(lastActiveOffset);
      expect(idle.storedAfterFailedEnd).toBe(true);
      expect(idle.beaconAfterIdle).toEqual(idle.idleEnd);
      expect(idle.retriedEnd).toEqual(idle.idleEnd);
      expect(idle.storedAfterRetry).toBe(false);
      expect(idle.sentAfterQuiet).toBe(idle.sentAfterIdle);
      refresh.second.stop();
    });

    it('starts a new session for the same visitor on the next input after an idle end', async () => {
      const visit = await startVisit();
      await burstThenHoldSave(visit);
      const refresh = await pagehideThenRefresh(visit);
      await idleOut(visit, refresh);

      visit.fakeWindow.dispatchEvent(new Event('pointerdown'));
      await vi.advanceTimersByTimeAsync(0);
      const restarted = visit.fake.sends.at(-1);
      expect(refresh.second.sessionId).not.toBe(visit.first.sessionId);
      expect(restarted).toMatchObject({ seq: 1, sessionId: refresh.second.sessionId, visitorId: visit.first.visitorId });
      expect(types(restarted)).toEqual([EmbedSessionEventType.SESSION_START]);
      refresh.second.stop();
    });
  });

  describe('session identity', () => {
    function plainTracker(fake: FakeTransport, session: MemoryStorage = memoryStorage(), extra: Partial<IEmbedSessionTrackerOptions> = {}) {
      return createEmbedSessionTracker({
        token: TOKEN,
        apiBaseUrl: API,
        transport: fake.transport,
        sessionStorage: session,
        localStorage: memoryStorage(),
        ...extra,
      });
    }

    it('starts once across a StrictMode stop/start remount and drops an invalid viewer id', async () => {
      vi.useFakeTimers({ now: STARTED_AT });
      const fake = fakeTransport();
      const tracker = plainTracker(fake, memoryStorage(), { viewerId: 'not-a-viewer-id' });
      tracker.start();
      tracker.stop();
      tracker.start();
      await vi.advanceTimersByTimeAsync(1_000);

      expect(fake.sends.flatMap((body) => types(body))).toEqual([EmbedSessionEventType.SESSION_START]);
      expect(fake.sends[0]?.viewerId).toBeNull();
      tracker.stop();
    });

    it('hands a duplicated tab a new session, re-sends its events under it with long media ids intact, and keeps unsent events stored on stop', async () => {
      vi.useFakeTimers({ now: STARTED_AT });
      const fake = fakeTransport();
      const session = memoryStorage();
      const tracker = plainTracker(fake, session);
      tracker.start();
      await vi.advanceTimersByTimeAsync(1_000);

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
      const sessionKey = hashedKey(session, SESSION_PREFIX);
      expect(storedIndexes(session, sessionKey)).toEqual([]);
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'first' } });
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'second' } });
      tracker.stop();
      expect(storedIndexes(session, sessionKey)).toEqual([5, 6]);
    });

    it('stops sending for good when the server answers like a render bot (applied false, no session id)', async () => {
      vi.useFakeTimers({ now: STARTED_AT });
      const render = fakeTransport();
      render.respondWith(() => ({ status: 200, data: { applied: false } }));
      const bot = plainTracker(render);
      bot.start();
      await vi.advanceTimersByTimeAsync(0);
      bot.track(EmbedSessionEventType.SEARCH, { data: { text: 'pricing' } });
      await bot.flush();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(render.sends.map((body) => body.seq)).toEqual([1]);
      bot.stop();
    });
  });

  // One test: the 1,800-event drain takes about 3 s, so its checks share a single run.
  describe('a backlog after a 400 and an outage', () => {
    const longText = 'q'.repeat(1_000);
    const manyKeys = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`key${index}`, `value${index}`]));
    const mediaIds = Array.from({ length: 600 }, (_, index) => `media-${index}-${'x'.repeat(200)}`);

    /** First save answers 400, the rest 503 until back online; then 1,200 large events and 600 media drain. */
    async function drainBacklog() {
      vi.useFakeTimers({ now: STARTED_AT });
      const fake = fakeTransport();
      let online = false;
      const delivered: IEmbedSessionSaveBody[] = [];
      const onError = vi.fn();
      fake.respondWith((body) => {
        if (!online) return { status: fake.sends.length === 1 ? 400 : 503 };
        delivered.push(structuredClone(body));
        return undefined;
      });
      const tracker = createEmbedSessionTracker({
        token: TOKEN,
        apiBaseUrl: API,
        transport: fake.transport,
        sessionStorage: memoryStorage(),
        localStorage: memoryStorage(),
        onError,
      });
      tracker.start();
      await vi.advanceTimersByTimeAsync(0);
      for (const mediaId of mediaIds) tracker.media(mediaId).open(EmbedSessionMediaOpenSource.LIST);
      for (let count = 0; count < 1_200; count += 1) {
        tracker.track(EmbedSessionEventType.SEARCH, { data: { text: longText, ...manyKeys } });
      }
      await vi.advanceTimersByTimeAsync(0);
      online = true;
      for (let round = 0; round < 100; round += 1) await tracker.flush();
      tracker.stop();
      const events = new Map(delivered.flatMap((body) => body.events).map((event) => [event.i, event]));
      return { fake, delivered, onError, events };
    }

    it('drops only the batch the server answered 400 and delivers every other event once, with long strings, many keys and over 500 media intact', async () => {
      const { fake, delivered, onError, events } = await drainBacklog();

      expect(onError).toHaveBeenCalledTimes(1);
      const dropped = new Set(fake.sends[0]!.events.map((event) => event.i));
      expect(dropped.size).toBeGreaterThan(0);
      expect([...events.keys()].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 1_801 }, (_, index) => index + 1).filter((i) => !dropped.has(i)),
      );
      const searches = [...events.values()].filter((event) => event.type === EmbedSessionEventType.SEARCH);
      expect(searches).toHaveLength(1_200);
      expect(searches.every((event) => event.data?.text === longText && Object.keys(event.data).length === 31)).toBe(true);
      const sentMedia = new Set(delivered.flatMap((body) => body.totals.media.map((entry) => entry.mediaId)));
      expect(sentMedia).toEqual(new Set(mediaIds));
    });
  });

  describe('the default fetch and beacon transport', () => {
    function stubNetwork() {
      vi.useFakeTimers({ now: STARTED_AT });
      const { fakeWindow } = stubPage({ location: { hostname: 'evilspeakai.co' } });
      vi.stubGlobal('location', fakeWindow.location);
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
        apiBaseUrl: API,
        sessionStorage: memoryStorage(),
        localStorage: memoryStorage(),
      });
      return { fakeWindow, beaconBlobs, fetchMock, tracker };
    }

    it('sends credentials only to speakai.co hosts and skips keepalive for an oversized body', async () => {
      const { fakeWindow, fetchMock, tracker } = stubNetwork();
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
      tracker.stop();
    });

    it('splits a large pagehide send into keepalive-sized beacons, session end first, with no event sent twice', async () => {
      const { fakeWindow, beaconBlobs, tracker } = stubNetwork();
      tracker.start();
      await vi.advanceTimersByTimeAsync(0);
      for (let count = 0; count < 300; count += 1) {
        tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 's'.repeat(1_000) } });
      }
      fakeWindow.dispatchEvent(new Event('pagehide'));

      expect(beaconBlobs.length).toBeGreaterThan(1);
      expect(beaconBlobs.every((blob) => blob.size < 65_536)).toBe(true);
      const beaconed = await Promise.all(beaconBlobs.map(async (blob) => JSON.parse(await blob.text()) as IEmbedSessionSaveBody));
      const beaconedIndexes = beaconed.flatMap((body) => body.events.map((event) => event.i));
      expect(new Set(beaconedIndexes).size).toBe(beaconedIndexes.length);
      expect(types(beaconed[0])).toEqual([EmbedSessionEventType.SESSION_END]);
      expect(beaconBlobs[0]!.size).toBeLessThan(2_000);
      expect(beaconed.slice(1).flatMap((body) => types(body))).toEqual(Array.from({ length: 300 }, () => EmbedSessionEventType.SEARCH));
      tracker.stop();
    });
  });

  describe('an open tab with no input', () => {
    /** Starts a visible tab and lets it run its first minute of 30 s saves. */
    async function openTab() {
      vi.useFakeTimers({ now: STARTED_AT });
      const { fakeWindow, fakeDocument } = stubPage();
      const fake = fakeTransport();
      const tracker = createEmbedSessionTracker({
        token: TOKEN,
        apiBaseUrl: API,
        transport: fake.transport,
        sessionStorage: memoryStorage(),
        localStorage: memoryStorage(),
        now: () => Date.now(),
      });
      const sentAt = () => fake.sends.map((body) => body.totals.timing.wallClockMs);
      tracker.start();
      await vi.advanceTimersByTimeAsync(60_000);
      return { fakeWindow, fakeDocument, fake, tracker, sentAt };
    }
    type Tab = Awaited<ReturnType<typeof openTab>>;

    async function idleUntilFirstPing({ fake }: Tab) {
      await vi.advanceTimersByTimeAsync(240_000);
      const sentBeforePing = fake.sends.length;
      await vi.advanceTimersByTimeAsync(60_000);
      return { sentBeforePing };
    }

    async function inputAfterIdle({ fake, fakeWindow }: Tab) {
      await vi.advanceTimersByTimeAsync(140_000);
      const sentBeforeInput = fake.sends.length;
      fakeWindow.dispatchEvent(new Event('pointerdown'));
      await vi.advanceTimersByTimeAsync(40_000);
      return { sentBeforeInput };
    }

    async function hideTab({ fakeDocument, sentAt }: Tab) {
      await vi.advanceTimersByTimeAsync(60_000);
      const sentAtBeforeHide = sentAt();
      fakeDocument.visibilityState = 'hidden';
      fakeDocument.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      return { sentAtBeforeHide };
    }

    it('stops timed saves after a minute without input and sends an empty ping every 5 minutes', async () => {
      const tab = await openTab();
      expect(tab.sentAt()).toEqual([0, 30_000, 60_000]);
      const { sentBeforePing } = await idleUntilFirstPing(tab);

      expect(sentBeforePing).toBe(3);
      expect(tab.sentAt()).toEqual([0, 30_000, 60_000, 360_000]);
      expect(tab.fake.sends[3]?.events).toEqual([]);
      expect(tab.fake.sends[3]?.totals.timing).toMatchObject({ visibleMs: 360_000, activeMs: tab.fake.sends[2]?.totals.timing.activeMs });
      tab.tracker.stop();
    });

    it('resumes 30 s saves on input with an idle event', async () => {
      const tab = await openTab();
      await idleUntilFirstPing(tab);
      const { sentBeforeInput } = await inputAfterIdle(tab);

      expect(sentBeforeInput).toBe(4);
      expect(tab.sentAt().slice(4)).toEqual([510_000, 540_000]);
      expect(tab.fake.sends[4]?.totals.timing.visibleMs).toBe(510_000);
      expect(types(tab.fake.sends[4])).toEqual([EmbedSessionEventType.IDLE]);
      tab.tracker.stop();
    });

    it('saves right away when the tab is hidden', async () => {
      const tab = await openTab();
      await idleUntilFirstPing(tab);
      await inputAfterIdle(tab);
      const { sentAtBeforeHide } = await hideTab(tab);

      expect(sentAtBeforeHide.slice(6)).toEqual([570_000]);
      expect(tab.sentAt().slice(7)).toEqual([600_000]);
      expect(tab.fake.sends[7]?.totals.timing.visibleMs).toBe(600_000);
      tab.tracker.stop();
    });

    it('still ends the session 30 idle minutes after the last input, dated at that input', async () => {
      const tab = await openTab();
      await idleUntilFirstPing(tab);
      await inputAfterIdle(tab);
      await hideTab(tab);
      tab.fakeDocument.visibilityState = 'visible';
      tab.fakeDocument.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(30 * 60_000);

      const idleEnd = tab.fake.sends.at(-1);
      expect(idleEnd?.events.at(-1)).toMatchObject({ type: EmbedSessionEventType.SESSION_END, t: 500_000, data: { reason: 'idle_timeout' } });
      expect(idleEnd?.totals.timing.wallClockMs).toBe(500_000);
      tab.tracker.stop();
    });
  });

  describe('retries', () => {
    /** Goes offline after the first save; every other failed attempt is a network error instead of a 503. */
    async function failingTracker() {
      vi.useFakeTimers({ now: STARTED_AT });
      const fake = fakeTransport();
      const network = { online: true };
      const attempts: number[] = [];
      const delivered: IEmbedSessionSaveBody[] = [];
      fake.respondWith((body) => {
        attempts.push((Date.now() - STARTED_AT) / 1_000);
        if (!network.online) {
          if (attempts.length % 2 === 0) throw new TypeError('Failed to fetch');
          return { status: 503 };
        }
        delivered.push(structuredClone(body));
        return undefined;
      });
      const tracker = createEmbedSessionTracker({
        token: TOKEN,
        apiBaseUrl: API,
        transport: fake.transport,
        sessionStorage: memoryStorage(),
        localStorage: memoryStorage(),
        now: () => Date.now(),
      });
      tracker.start();
      await vi.advanceTimersByTimeAsync(0);
      network.online = false;
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'first' } });
      await vi.advanceTimersByTimeAsync(400_000);
      return { network, attempts, delivered, tracker };
    }
    type Failing = Awaited<ReturnType<typeof failingTracker>>;

    async function recoverThenFailAgain({ network, tracker }: Failing) {
      network.online = true;
      await vi.advanceTimersByTimeAsync(85_000);
      network.online = false;
      tracker.track(EmbedSessionEventType.SEARCH, { data: { text: 'second' } });
      await vi.advanceTimersByTimeAsync(120_000);
    }

    it('backs off to 30 s, 60 s and then 120 s after repeated 5xx and network errors', async () => {
      const { attempts, tracker } = await failingTracker();

      expect(attempts).toEqual([0, 30, 60, 120, 240, 360]);
      tracker.stop();
    });

    it('resets the backoff to 30 s after a successful save', async () => {
      const failing = await failingTracker();
      await recoverThenFailAgain(failing);

      expect(failing.attempts.slice(6)).toEqual([480, 510, 540, 600]);
      failing.tracker.stop();
    });

    it('after a long outage sends the idle end and its totals before queued events, and loses no event', async () => {
      const failing = await failingTracker();
      await recoverThenFailAgain(failing);
      await vi.advanceTimersByTimeAsync(1_800_000);
      failing.network.online = true;
      await vi.advanceTimersByTimeAsync(120_000);

      const { delivered } = failing;
      const endIndex = delivered.findIndex((body) => types(body)?.includes(EmbedSessionEventType.SESSION_END));
      expect(delivered[endIndex]?.events).toEqual([
        expect.objectContaining({ type: EmbedSessionEventType.SESSION_END, t: 485_000, data: { reason: 'idle_timeout' } }),
      ]);
      expect(delivered[endIndex]?.totals.timing.wallClockMs).toBe(485_000);
      expect(types(delivered[endIndex + 1])).toEqual([EmbedSessionEventType.SEARCH]);
      const searches = delivered.flatMap((body) => body.events).filter((event) => event.type === EmbedSessionEventType.SEARCH);
      expect(new Set(searches.map((event) => event.data?.text))).toEqual(new Set(['first', 'second']));
      failing.tracker.stop();
    });
  });

  // Two tests, not four: reaching the cap fires about 2,900 timed saves (about 2 s per run).
  describe('the 24 hour cap', () => {
    /** Plays media in a hidden tab until the session hits 24 hours. */
    async function playPastCap() {
      vi.useFakeTimers({ now: STARTED_AT });
      const { fakeWindow } = stubPage({ visibilityState: 'hidden' });
      const fake = fakeTransport();
      const session = memoryStorage();
      const options = { token: TOKEN, apiBaseUrl: API, transport: fake.transport, localStorage: memoryStorage(), now: () => Date.now() };
      const tracker = createEmbedSessionTracker({ ...options, sessionStorage: session });
      tracker.start();
      await vi.advanceTimersByTimeAsync(0);
      const cappedId = tracker.sessionId;
      const media = tracker.media('m1');
      media.open(EmbedSessionMediaOpenSource.LIST);
      media.play(0);
      await vi.advanceTimersByTimeAsync(86_400_000 - 30_000);
      const beforeCap = memoryStorage(new Map(session.entries));
      await vi.advanceTimersByTimeAsync(30_000);
      return { fakeWindow, fake, options, tracker, media, cappedId, beforeCap };
    }
    type Capped = Awaited<ReturnType<typeof playPastCap>>;

    /** Ten more minutes of playback ticks after the cap. */
    async function tickAfterCap({ media }: Capped) {
      for (let second = 1; second <= 600; second += 1) {
        await vi.advanceTimersByTimeAsync(1_000);
        media.timeUpdate(86_400 + second, 200_000);
      }
    }

    it('ends the session at 24 hours while media keeps playing, with full totals, and ignores playback ticks after it', async () => {
      const capped = await playPastCap();

      const capEnd = capped.fake.sends.at(-1);
      expect(capEnd).toMatchObject({ sessionId: capped.cappedId });
      expect(capEnd?.events).toEqual([
        expect.objectContaining({ type: EmbedSessionEventType.SESSION_END, t: 86_400_000, data: { reason: 'max_duration' } }),
      ]);
      expect(capEnd?.totals.timing.wallClockMs).toBe(86_400_000);
      expect(capEnd?.totals.media[0]).toMatchObject({ mediaId: 'm1', playedMs: 86_400_000 });

      const sentAtCap = capped.fake.sends.length;
      await tickAfterCap(capped);
      expect(capped.fake.sends).toHaveLength(sentAtCap);
      expect(capped.tracker.sessionId).toBe(capped.cappedId);
      capped.tracker.stop();
    });

    it('after the cap starts a new session on the next input with media totals from zero, and a refresh does not resume the capped session', async () => {
      const capped = await playPastCap();
      await tickAfterCap(capped);
      capped.fakeWindow.dispatchEvent(new Event('pointerdown'));
      await vi.advanceTimersByTimeAsync(0);

      expect(capped.tracker.sessionId).not.toBe(capped.cappedId);
      expect(capped.fake.sends.at(-1)).toMatchObject({ seq: 1, sessionId: capped.tracker.sessionId });
      expect(types(capped.fake.sends.at(-1))).toEqual([EmbedSessionEventType.SESSION_START]);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(capped.fake.sends.at(-1)?.totals.media[0]).toMatchObject({ mediaId: 'm1', playedMs: 30_000 });
      capped.tracker.stop();

      const refreshed = createEmbedSessionTracker({ ...capped.options, sessionStorage: capped.beforeCap });
      refreshed.start();
      await vi.advanceTimersByTimeAsync(150);
      expect(refreshed.sessionId).not.toBe(capped.cappedId);
      refreshed.stop();
    });
  });
});
