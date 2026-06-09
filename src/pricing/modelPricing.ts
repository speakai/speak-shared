/**
 * Canonical LLM model pricing — single source of truth shared by speak-server
 * and the voice-agent backend. USD per 1M tokens.
 *
 * `cachedInputPerMillion` = provider's cached-input read rate.
 * `*Long` = long-context tier (per-request above `longContextThresholdTokens`).
 *
 * Verified 2026-06 against:
 *   OpenAI    — https://platform.openai.com/docs/pricing
 *   Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing  (cache read = 0.1x input)
 *   Gemini    — https://ai.google.dev/gemini-api/docs/pricing
 * [S] = legacy/superseded model (not on current page; historical rate).
 */
import { LLMModels, LLMProvider } from "../enums/llm.js";

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

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  [LLMModels.GPT_3_5]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_3_5_TURBO_16K]: { inputPerMillion: 3, outputPerMillion: 4, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_3_5_TURBO_0125]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4]: { inputPerMillion: 30, outputPerMillion: 60, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_1106_PREVIEW]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_TURBO]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4O]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4O_MINI]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_O_2024_05_13]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_O_2024_08_06]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_MINI_2024_07_18]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_1_2025_04_14]: { inputPerMillion: 2, outputPerMillion: 8, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_1_2025_11_13]: { inputPerMillion: 1.25, outputPerMillion: 10, cachedInputPerMillion: 0.125, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4]: { inputPerMillion: 2.5, outputPerMillion: 15, cachedInputPerMillion: 0.25, longContextThresholdTokens: 272000, inputPerMillionLong: 5, outputPerMillionLong: 22.5, cachedInputPerMillionLong: 0.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4_MINI]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4_MINI_2026_03_17]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_5]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, longContextThresholdTokens: 272000, inputPerMillionLong: 10, outputPerMillionLong: 45, cachedInputPerMillionLong: 1, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_5_THINKING]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, longContextThresholdTokens: 272000, inputPerMillionLong: 10, outputPerMillionLong: 45, cachedInputPerMillionLong: 1, provider: LLMProvider.OPENAI }, // gpt-5.5 reasoning mode (same rate)

  // Anthropic
  [LLMModels.CLAUDE_2]: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC }, // [S]
  [LLMModels.CLAUDE_3_5_SONNET]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_3_5_SONNET_20241022]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_3_7_SONNET_LATEST]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_SONNET_4_6]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_OPUS_4_8]: { inputPerMillion: 5, outputPerMillion: 25, cachedInputPerMillion: 0.5, provider: LLMProvider.ANTHROPIC },

  // Google Gemini
  [LLMModels.GEMINI_1_5_PRO]: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE }, // [S]
  [LLMModels.GEMINI_1_5_FLASH]: { inputPerMillion: 0.075, outputPerMillion: 0.3, cachedInputPerMillion: 0.01875, provider: LLMProvider.GOOGLE }, // [S]
  [LLMModels.GEMINI_2_0_FLASH]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.025, provider: LLMProvider.GOOGLE }, // deprecated 2026-06-01
  [LLMModels.GEMINI_2_5_FLASH]: { inputPerMillion: 0.3, outputPerMillion: 2.5, cachedInputPerMillion: 0.03, provider: LLMProvider.GOOGLE },
  [LLMModels.GEMINI_2_5_FLASH_LITE]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.01, provider: LLMProvider.GOOGLE },
};

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
