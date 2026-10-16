import { EmbedSessionEventType, EmbedSessionMediaOpenSource } from '../enums/embedSession.js';
import type {
  EmbedSessionMediaHandle,
  IEmbedSessionMediaHandleDeps,
  IEmbedSessionMediaRuntime,
  IEmbedSessionMediaTotals,
} from '../interfaces/embedSession.js';
import { EMBED_SESSION_LIMITS } from '../utils/embedSession.js';

const SEEK_INFERENCE_THRESHOLD_SEC = 2;
const POSITION_PRECISION = 100;

const roundPosition = (value: number): number => Math.round(value * POSITION_PRECISION) / POSITION_PRECISION;

const isFiniteNonNegative = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function createEmbedSessionMediaRuntime(mediaId: string, inferSeeks: boolean): IEmbedSessionMediaRuntime {
  return {
    mediaId,
    inferSeeks,
    isOpen: false,
    playingSince: null,
    lastPositionSec: null,
    lastPositionAt: null,
    durationSec: null,
    rate: 1,
  };
}

export function settleEmbedSessionMediaPlayback(
  runtime: IEmbedSessionMediaRuntime,
  totals: IEmbedSessionMediaTotals | null,
  at: number,
): void {
  if (runtime.playingSince === null) return;
  if (totals) totals.playedMs += Math.max(0, Math.round(at - runtime.playingSince));
  runtime.playingSince = at;
}

export function createEmbedSessionMediaHandle(
  runtime: IEmbedSessionMediaRuntime,
  deps: IEmbedSessionMediaHandleDeps,
): EmbedSessionMediaHandle {
  const { mediaId } = runtime;

  const markPosition = (positionSec: number): void => {
    runtime.lastPositionSec = positionSec;
    runtime.lastPositionAt = deps.clock();
  };

  const recordPosition = (totals: IEmbedSessionMediaTotals, positionSec: number): void => {
    const durationSec = runtime.durationSec;
    if (!durationSec || durationSec <= 0) return;
    const pct = roundPosition(Math.min(100, Math.max(0, (positionSec / durationSec) * 100)));
    totals.maxPositionPct = Math.max(totals.maxPositionPct, pct);
    if (totals.maxPositionPct >= EMBED_SESSION_LIMITS.completedPositionPct) totals.completed = true;
  };

  const stopPlayback = (totals: IEmbedSessionMediaTotals): void => {
    if (runtime.playingSince === null) return;
    settleEmbedSessionMediaPlayback(runtime, totals, deps.clock());
    runtime.playingSince = null;
    deps.onPlaybackStop();
  };

  const withTotals = (action: (totals: IEmbedSessionMediaTotals) => void): void =>
    deps.run(() => {
      const totals = deps.totals(mediaId);
      if (totals) action(totals);
    });

  const seekTo = (totals: IEmbedSessionMediaTotals, fromSec: number, toSec: number): void => {
    totals.seeks += 1;
    markPosition(toSec);
    recordPosition(totals, toSec);
    deps.emit(EmbedSessionEventType.SEEK, {
      mediaId,
      data: { fromSec: roundPosition(fromSec), toSec: roundPosition(toSec) },
    });
  };

  return {
    open(source = EmbedSessionMediaOpenSource.DIRECT) {
      withTotals((totals) => {
        runtime.isOpen = true;
        totals.opens += 1;
        deps.onActivity();
        deps.emit(EmbedSessionEventType.MEDIA_OPEN, { mediaId, data: { source } });
      });
    },
    close() {
      withTotals((totals) => {
        stopPlayback(totals);
        runtime.isOpen = false;
        deps.emit(EmbedSessionEventType.MEDIA_CLOSE, {
          mediaId,
          data: { activeMs: totals.activeMs, playedMs: totals.playedMs },
        });
      });
    },
    play(positionSec) {
      withTotals((totals) => {
        if (runtime.playingSince === null) runtime.playingSince = deps.clock();
        totals.plays += 1;
        markPosition(positionSec);
        recordPosition(totals, positionSec);
        deps.onActivity();
        deps.emit(EmbedSessionEventType.PLAY, { mediaId, data: { positionSec: roundPosition(positionSec) } });
      });
    },
    pause(positionSec) {
      withTotals((totals) => {
        stopPlayback(totals);
        markPosition(positionSec);
        recordPosition(totals, positionSec);
        deps.emit(EmbedSessionEventType.PAUSE, { mediaId, data: { positionSec: roundPosition(positionSec) } });
      });
    },
    seek(fromSec, toSec) {
      withTotals((totals) => seekTo(totals, fromSec, toSec));
    },
    ended(durationSec) {
      withTotals((totals) => {
        stopPlayback(totals);
        if (isFiniteNonNegative(durationSec) && durationSec > 0) runtime.durationSec = durationSec;
        markPosition(durationSec);
        totals.maxPositionPct = 100;
        totals.completed = true;
        deps.emit(EmbedSessionEventType.ENDED, { mediaId, data: { durationSec: roundPosition(durationSec) } });
      });
    },
    rateChange(rate) {
      withTotals(() => {
        if (Number.isFinite(rate) && rate > 0) runtime.rate = rate;
        deps.emit(EmbedSessionEventType.RATE_CHANGE, { mediaId, data: { rate } });
      });
    },
    timeUpdate(positionSec, durationSec) {
      if (!isFiniteNonNegative(positionSec)) return;
      withTotals((totals) => {
        if (isFiniteNonNegative(durationSec) && durationSec > 0) runtime.durationSec = durationSec;
        const { lastPositionSec, lastPositionAt } = runtime;
        if (runtime.inferSeeks && lastPositionSec !== null && lastPositionAt !== null) {
          const elapsedSec = runtime.playingSince === null ? 0 : ((deps.clock() - lastPositionAt) / 1000) * runtime.rate;
          if (Math.abs(positionSec - (lastPositionSec + elapsedSec)) > SEEK_INFERENCE_THRESHOLD_SEC) {
            seekTo(totals, lastPositionSec, positionSec);
            return;
          }
        }
        markPosition(positionSec);
        recordPosition(totals, positionSec);
      });
    },
  };
}
