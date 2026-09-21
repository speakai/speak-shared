/**
 * Turn Taking Interfaces
 */

/**
 * LiveKit `turnHandling.endpointing` options. Delays are in milliseconds.
 */
export interface TurnTakingConfig {
  /** `fixed` always waits minDelay; `dynamic` adapts within the delay window */
  mode: "fixed" | "dynamic";
  /** Shortest silence, in ms, before the agent may take the turn */
  minDelay: number;
  /** Longest silence, in ms, the agent waits before it takes the turn anyway */
  maxDelay: number;
  /** Smoothing factor for `dynamic` mode; higher leans towards longer waits */
  alpha?: number;
}
