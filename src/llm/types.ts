import type { LLMProvider } from "../enums/llm.js";

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

export interface ModalityRates {
  audioPerMillion: number;
  videoPerMillion: number;
}
