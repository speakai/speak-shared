/**
 * Canonical LLM model pricing — single source of truth shared by speak-server
 * and the voice-agent backend. All rates are USD per 1M tokens.
 *
 * `cachedInputPerMillion` is the provider's discounted CACHED-input read rate.
 *
 * REFERENCE PAGES (verify here):
 *   OpenAI    — https://platform.openai.com/docs/pricing  /  https://openai.com/api/pricing/
 *   Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing
 *   Gemini    — https://ai.google.dev/gemini-api/docs/pricing
 *
 * Confidence legend (per-line):
 *   [V]  verified against the live page (2026-06)
 *   [S]  standard/well-known list rate (high confidence, not re-pulled this pass)
 *   [~]  plausible but NOT individually re-verified — confirm before relying on
 *   [c~] the cachedInputPerMillion is a pattern-based ESTIMATE (OpenAI ~10–50%,
 *        Anthropic ~10% of input), not a verified figure
 */
import { LLMModels, LLMProvider } from '../enums/llm.js';

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  provider: LLMProvider;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI — https://platform.openai.com/docs/pricing ────────────────────
  [LLMModels.GPT_3_5]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [S] gpt-3.5-turbo
  [LLMModels.GPT_3_5_TURBO_16K]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [S]
  [LLMModels.GPT_3_5_TURBO_0125]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [S]
  [LLMModels.GPT_4]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [S] legacy gpt-4
  [LLMModels.GPT_4_1106_PREVIEW]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [S]
  [LLMModels.GPT_4_TURBO]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [S] gpt-4-turbo
  [LLMModels.GPT_4O]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V] gpt-4o (cached 50%)
  [LLMModels.GPT_4O_MINI]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] (cached 50%)
  [LLMModels.GPT_4_O_2024_05_13]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI }, // [S] original gpt-4o snapshot ($5/$15)
  [LLMModels.GPT_4_O_2024_08_06]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V] CORRECTED (was $5/$15; Aug-2024 snapshot dropped to $2.5/$10)
  [LLMModels.GPT_4_MINI_2024_07_18]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] CORRECTED (was $0.8/$3.2)
  [LLMModels.GPT_4_1_2025_04_14]: { inputPerMillion: 2, outputPerMillion: 8, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [S] gpt-4.1; [c~] cached
  [LLMModels.GPT_5_1_2025_11_13]: { inputPerMillion: 1.25, outputPerMillion: 10, cachedInputPerMillion: 0.125, provider: LLMProvider.OPENAI }, // [~] gpt-5.1; [c~] cached
  [LLMModels.GPT_5_4]: { inputPerMillion: 2.5, outputPerMillion: 15, cachedInputPerMillion: 0.25, provider: LLMProvider.OPENAI }, // [V] gpt-5.4 (cached verified $0.25)
  [LLMModels.GPT_5_4_MINI]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [~] gpt-5.4-mini; [c~] cached
  [LLMModels.GPT_5_4_MINI_2026_03_17]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [~] dated alias of gpt-5.4-mini
  [LLMModels.GPT_5_5]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [V] gpt-5.5 (cached 90% off)
  [LLMModels.GPT_5_5_THINKING]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [V] same rates; thinking = more output, no rate premium

  // ── Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing ──
  // (Anthropic cached READ ≈ 10% of input.)
  [LLMModels.CLAUDE_2]: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC }, // [S] legacy claude-2
  [LLMModels.CLAUDE_3_5_SONNET]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [S]; [c~] cached
  [LLMModels.CLAUDE_3_5_SONNET_20241022]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [S]; [c~]
  [LLMModels.CLAUDE_3_7_SONNET_LATEST]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [S]; [c~]
  [LLMModels.CLAUDE_SONNET_4_6]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V] sonnet-4.6; [c~] cached
  [LLMModels.CLAUDE_OPUS_4_8]: { inputPerMillion: 5, outputPerMillion: 25, cachedInputPerMillion: 0.5, provider: LLMProvider.ANTHROPIC }, // [V] opus-4.8 (cached 90% off)

  // ── Google Gemini — https://ai.google.dev/gemini-api/docs/pricing ────────
  [LLMModels.GEMINI_1_5_PRO]: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE }, // [S] gemini-1.5-pro (<=128K tier)
  [LLMModels.GEMINI_1_5_FLASH]: { inputPerMillion: 0.075, outputPerMillion: 0.3, cachedInputPerMillion: 0.01875, provider: LLMProvider.GOOGLE }, // [V] CORRECTED (was $0.35/$1.05); <=128K tier
  [LLMModels.GEMINI_2_0_FLASH]: { inputPerMillion: 0.1, outputPerMillion: 0.4, provider: LLMProvider.GOOGLE }, // [S]
  [LLMModels.GEMINI_2_5_FLASH]: { inputPerMillion: 0.3, outputPerMillion: 2.5, cachedInputPerMillion: 0.075, provider: LLMProvider.GOOGLE }, // [~] 2.5-flash (output is the thinking rate); [c~]
  [LLMModels.GEMINI_2_5_FLASH_LITE]: { inputPerMillion: 0.1, outputPerMillion: 0.4, provider: LLMProvider.GOOGLE }, // [S]
};

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
