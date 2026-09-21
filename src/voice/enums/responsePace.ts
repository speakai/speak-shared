/**
 * Response Pace
 * How long an agent waits for the caller to finish before it replies
 */
export enum ResponsePace {
  /** Replies as soon as the caller pauses */
  SNAPPY = "snappy",
  /** The default pause — natural back-and-forth */
  BALANCED = "balanced",
  /** Leaves room for the caller to think mid-sentence */
  PATIENT = "patient",
  /** Longest wait, for callers who need time to finish */
  VERY_PATIENT = "very_patient",
}

/** Type alias for response pace values */
export type ResponsePaceType = `${ResponsePace}`;

/** Array of all valid response paces */
export const RESPONSE_PACES = Object.values(ResponsePace) as ResponsePaceType[];
