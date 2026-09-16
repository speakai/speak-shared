/**
 * Shared value types for the LLM registry.
 *
 * Separated from `registry.ts` so the registry can import them without a cycle, and so
 * consumers that only need a rate shape don't pull in the whole table.
 */
import type { LLMProvider } from "../enums/llm.js";

/**
 * USD per 1M tokens.
 *
 * `cachedInputPerMillion` is the cached-input READ rate (omitted where the provider doesn't
 * publish one). `*Long` is the long-context tier: providers price the WHOLE request at the
 * higher rate once the input passes `longContextThresholdTokens`.
 */
export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  provider: LLMProvider;
  longContextThresholdTokens?: number;
  inputPerMillionLong?: number;
  outputPerMillionLong?: number;
  cachedInputPerMillionLong?: number;
}

/**
 * USD per 1M tokens for prompt tokens the provider attributed to audio and video.
 *
 * Priced separately because providers bill media well above text — leaving them folded into
 * the text rate undercharges a media turn by roughly 3x.
 */
export interface ModalityRates {
  audioPerMillion: number;
  videoPerMillion: number;
}
