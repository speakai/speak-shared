/**
 * Canonical LLM model pricing — single source of truth shared by speak-server
 * and the voice-agent backend. All rates are USD per 1M tokens.
 *
 * `cachedInputPerMillion` is the provider's discounted CACHED-input read rate
 * (OpenAI ~10–50% of input; Anthropic ~10% of input). Omit when unknown.
 *
 * NOTE: values preserve each system's existing numbers to avoid changing live
 * billing on consolidation; tune per-model here in ONE place going forward.
 */
import { LLMModels, LLMProvider } from '../enums/llm.js';

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  provider: LLMProvider;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI ──────────────────────────────────────────────
  [LLMModels.GPT_3_5]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_3_5_TURBO_16K]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_3_5_TURBO_0125]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_1106_PREVIEW]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_TURBO]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4O]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4O_MINI]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_O_2024_05_13]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_O_2024_08_06]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_MINI_2024_07_18]: { inputPerMillion: 0.8, outputPerMillion: 3.2, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_4_1_2025_04_14]: { inputPerMillion: 2, outputPerMillion: 8, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_1_2025_11_13]: { inputPerMillion: 1.25, outputPerMillion: 10, cachedInputPerMillion: 0.125, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4]: { inputPerMillion: 2.5, outputPerMillion: 15, cachedInputPerMillion: 0.25, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4_MINI]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_4_MINI_2026_03_17]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_5]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI },
  [LLMModels.GPT_5_5_THINKING]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI },

  // ── Anthropic (cached read ~10% of input) ───────────────
  [LLMModels.CLAUDE_2]: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_3_5_SONNET]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_3_5_SONNET_20241022]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_3_7_SONNET_LATEST]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_SONNET_4_6]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC },
  [LLMModels.CLAUDE_OPUS_4_8]: { inputPerMillion: 5, outputPerMillion: 25, cachedInputPerMillion: 0.5, provider: LLMProvider.ANTHROPIC },

  // ── Google Gemini ───────────────────────────────────────
  [LLMModels.GEMINI_1_5_PRO]: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE },
  [LLMModels.GEMINI_1_5_FLASH]: { inputPerMillion: 0.35, outputPerMillion: 1.05, cachedInputPerMillion: 0.075, provider: LLMProvider.GOOGLE },
  [LLMModels.GEMINI_2_0_FLASH]: { inputPerMillion: 0.1, outputPerMillion: 0.4, provider: LLMProvider.GOOGLE },
  [LLMModels.GEMINI_2_5_FLASH]: { inputPerMillion: 0.3, outputPerMillion: 2.5, cachedInputPerMillion: 0.075, provider: LLMProvider.GOOGLE },
  [LLMModels.GEMINI_2_5_FLASH_LITE]: { inputPerMillion: 0.1, outputPerMillion: 0.4, provider: LLMProvider.GOOGLE },
};

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
