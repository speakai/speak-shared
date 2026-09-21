/**
 * Response-pace presets
 *
 * The single mapping from a named `ResponsePace` to the `TurnTakingConfig` each
 * backend sends to the worker, so an agent paces the same way whichever pool
 * answers the call.
 */

import { ResponsePace, type ResponsePaceType } from "./enums/responsePace.js";
import type { TurnTakingConfig } from "./interfaces/turnTaking.js";

/** Pace applied when an agent stores no preset of its own */
export const DEFAULT_RESPONSE_PACE: ResponsePaceType = ResponsePace.BALANCED;

/** Turn-taking numbers behind each preset */
export const RESPONSE_PACE_PRESETS: Readonly<
  Record<ResponsePaceType, Readonly<TurnTakingConfig>>
> = Object.freeze({
  [ResponsePace.SNAPPY]: Object.freeze({ mode: "fixed", minDelay: 200, maxDelay: 2000 }),
  [ResponsePace.BALANCED]: Object.freeze({ mode: "fixed", minDelay: 300, maxDelay: 2500 }),
  [ResponsePace.PATIENT]: Object.freeze({
    mode: "dynamic",
    minDelay: 600,
    maxDelay: 3500,
    alpha: 0.9,
  }),
  [ResponsePace.VERY_PATIENT]: Object.freeze({
    mode: "dynamic",
    minDelay: 900,
    maxDelay: 5000,
    alpha: 0.9,
  }),
} satisfies Record<ResponsePaceType, TurnTakingConfig>);

/**
 * Resolve a stored response-pace value to its turn-taking config.
 *
 * Anything that is not a known preset key — undefined, null, a non-string, an
 * unknown string, or an inherited `Object.prototype` key — resolves to the
 * balanced preset, which is the pace agents ran at before presets existed.
 *
 * @param pace raw value read off the agent document
 * @returns a fresh, mutable copy of the resolved config
 */
export const resolveResponsePace = (pace?: unknown): TurnTakingConfig => {
  const key =
    typeof pace === "string" && Object.prototype.hasOwnProperty.call(RESPONSE_PACE_PRESETS, pace)
      ? (pace as ResponsePaceType)
      : DEFAULT_RESPONSE_PACE;

  return { ...RESPONSE_PACE_PRESETS[key] };
};
