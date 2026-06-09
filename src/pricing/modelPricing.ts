/**
 * Canonical LLM model pricing — single source of truth shared by speak-server
 * and the voice-agent backend. All rates are USD per 1M tokens.
 *
 * `cachedInputPerMillion` is the provider's discounted CACHED-input read rate.
 * The `*Long` fields are the LONG-CONTEXT tier (applied per-request above
 * `longContextThresholdTokens`); only set for models that actually charge it.
 *
 * REFERENCE PAGES (verify here):
 *   OpenAI    — https://platform.openai.com/docs/pricing  /  https://openai.com/api/pricing/
 *   Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing
 *   Gemini    — https://ai.google.dev/gemini-api/docs/pricing
 *
 * Confidence (cross-checked 2026-06 against the official pages above):
 *   [V]  verified against the live/official page
 *   [S]  legacy/superseded model, not on the current page — historical list rate
 *
 * Anthropic note: cache read = 0.1x base input (confirmed on page) → every Claude
 * cachedInputPerMillion is 10% of its input rate. [V]
 */
import { LLMModels, LLMProvider } from "../enums/llm.js";

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  provider: LLMProvider;
  // Long-context tier (per-request above the threshold). Only set when the
  // provider charges a premium for large single requests.
  longContextThresholdTokens?: number;
  inputPerMillionLong?: number;
  outputPerMillionLong?: number;
  cachedInputPerMillionLong?: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI — https://platform.openai.com/docs/pricing (official, verified) ─
  [LLMModels.GPT_3_5]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [V] gpt-3.5-turbo / -0125
  [LLMModels.GPT_3_5_TURBO_16K]: { inputPerMillion: 3, outputPerMillion: 4, provider: LLMProvider.OPENAI }, // [V] CORRECTED from $0.5/$1.5 (16k-0613 = $3/$4)
  [LLMModels.GPT_3_5_TURBO_0125]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4]: { inputPerMillion: 30, outputPerMillion: 60, provider: LLMProvider.OPENAI }, // [V] gpt-4 (0613/0314 = $30/$60)
  [LLMModels.GPT_4_1106_PREVIEW]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4_TURBO]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [V] gpt-4-turbo-2024-04-09
  [LLMModels.GPT_4O]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4O_MINI]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4_O_2024_05_13]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI }, // [V] (no cached)
  [LLMModels.GPT_4_O_2024_08_06]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V] = current gpt-4o
  [LLMModels.GPT_4_MINI_2024_07_18]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] = current gpt-4o-mini
  [LLMModels.GPT_4_1_2025_04_14]: { inputPerMillion: 2, outputPerMillion: 8, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [V] gpt-4.1
  [LLMModels.GPT_5_1_2025_11_13]: { inputPerMillion: 1.25, outputPerMillion: 10, cachedInputPerMillion: 0.125, provider: LLMProvider.OPENAI }, // [V] gpt-5.1 (official $1.25/$10)
  [LLMModels.GPT_5_4]: { inputPerMillion: 2.5, outputPerMillion: 15, cachedInputPerMillion: 0.25, longContextThresholdTokens: 272000, inputPerMillionLong: 5, outputPerMillionLong: 22.5, cachedInputPerMillionLong: 0.5, provider: LLMProvider.OPENAI }, // [V] short + long tiers
  [LLMModels.GPT_5_4_MINI]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] (no long tier)
  [LLMModels.GPT_5_4_MINI_2026_03_17]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] dated alias
  [LLMModels.GPT_5_5]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, longContextThresholdTokens: 272000, inputPerMillionLong: 10, outputPerMillionLong: 45, cachedInputPerMillionLong: 1, provider: LLMProvider.OPENAI }, // [V] short + long tiers
  [LLMModels.GPT_5_5_THINKING]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, longContextThresholdTokens: 272000, inputPerMillionLong: 10, outputPerMillionLong: 45, cachedInputPerMillionLong: 1, provider: LLMProvider.OPENAI }, // [V] gpt-5.5 reasoning mode = same rate (no separate SKU; the $30/$180 tier is gpt-5.5-pro, not modeled)

  // ── Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing ──
  // cache read = 0.1x input (confirmed on page) [V]
  [LLMModels.CLAUDE_2]: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC }, // [S] legacy
  [LLMModels.CLAUDE_3_5_SONNET]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_3_5_SONNET_20241022]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_3_7_SONNET_LATEST]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_SONNET_4_6]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_OPUS_4_8]: { inputPerMillion: 5, outputPerMillion: 25, cachedInputPerMillion: 0.5, provider: LLMProvider.ANTHROPIC }, // [V]

  // ── Google Gemini — https://ai.google.dev/gemini-api/docs/pricing ────────
  [LLMModels.GEMINI_1_5_PRO]: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE }, // [S] superseded (<=128K tier)
  [LLMModels.GEMINI_1_5_FLASH]: { inputPerMillion: 0.075, outputPerMillion: 0.3, cachedInputPerMillion: 0.01875, provider: LLMProvider.GOOGLE }, // [S] superseded
  [LLMModels.GEMINI_2_0_FLASH]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.025, provider: LLMProvider.GOOGLE }, // [V] (deprecated, shut down 2026-06-01)
  [LLMModels.GEMINI_2_5_FLASH]: { inputPerMillion: 0.3, outputPerMillion: 2.5, cachedInputPerMillion: 0.03, provider: LLMProvider.GOOGLE }, // [V]
  [LLMModels.GEMINI_2_5_FLASH_LITE]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.01, provider: LLMProvider.GOOGLE }, // [V]
};

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
