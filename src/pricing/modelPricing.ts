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
 * Confidence legend (per-line), as of 2026-06 cross-check against the pages above:
 *   [V]  verified against the live page
 *   [S]  standard/known rate, but the model is legacy/superseded and NOT on the
 *        current page — value is from historical list pricing
 *   [?]  sources DISAGREE — flagged for manual confirmation (see inline note)
 *
 * Anthropic note: cache read = 0.1x base input (confirmed on the page), so every
 * Claude cachedInputPerMillion below is exactly 10% of its input rate. [V]
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
  [LLMModels.GPT_3_5]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [?] gpt-3.5-turbo-0125 list = $0.5/$1.5; pricepertoken shows $0.25/$0.75 — legacy, confirm
  [LLMModels.GPT_3_5_TURBO_16K]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [?] legacy
  [LLMModels.GPT_3_5_TURBO_0125]: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI }, // [?] legacy
  [LLMModels.GPT_4]: { inputPerMillion: 30, outputPerMillion: 60, provider: LLMProvider.OPENAI }, // [V] CORRECTED $10/$30 -> $30/$60 (gpt-4 8k base rate)
  [LLMModels.GPT_4_1106_PREVIEW]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [S] gpt-4-turbo-preview
  [LLMModels.GPT_4_TURBO]: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI }, // [?] official $10/$30; pricepertoken shows $5/$15 — legacy, confirm
  [LLMModels.GPT_4O]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4O_MINI]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_4_O_2024_05_13]: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI }, // [S] original gpt-4o snapshot ($5/$15)
  [LLMModels.GPT_4_O_2024_08_06]: { inputPerMillion: 2.5, outputPerMillion: 10, cachedInputPerMillion: 1.25, provider: LLMProvider.OPENAI }, // [V] CORRECTED from $5/$15
  [LLMModels.GPT_4_MINI_2024_07_18]: { inputPerMillion: 0.15, outputPerMillion: 0.6, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] CORRECTED from $0.8/$3.2
  [LLMModels.GPT_4_1_2025_04_14]: { inputPerMillion: 2, outputPerMillion: 8, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [V] gpt-4.1
  [LLMModels.GPT_5_1_2025_11_13]: { inputPerMillion: 0.625, outputPerMillion: 5, cachedInputPerMillion: 0.125, provider: LLMProvider.OPENAI }, // [V] CORRECTED $1.25/$10 -> $0.625/$5
  [LLMModels.GPT_5_4]: { inputPerMillion: 2.5, outputPerMillion: 15, cachedInputPerMillion: 0.25, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_5_4_MINI]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V]
  [LLMModels.GPT_5_4_MINI_2026_03_17]: { inputPerMillion: 0.75, outputPerMillion: 4.5, cachedInputPerMillion: 0.075, provider: LLMProvider.OPENAI }, // [V] dated alias of gpt-5.4-mini
  [LLMModels.GPT_5_5]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [V] gpt-5.5 standard
  [LLMModels.GPT_5_5_THINKING]: { inputPerMillion: 5, outputPerMillion: 30, cachedInputPerMillion: 0.5, provider: LLMProvider.OPENAI }, // [?] same base rate; a "Pro" variant is reported at $30/$180 — confirm which "thinking" maps to

  // ── Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing ──
  // cache read = 0.1x input (confirmed on page) [V]
  [LLMModels.CLAUDE_2]: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC }, // [S] legacy claude-2
  [LLMModels.CLAUDE_3_5_SONNET]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_3_5_SONNET_20241022]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_3_7_SONNET_LATEST]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_SONNET_4_6]: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3, provider: LLMProvider.ANTHROPIC }, // [V]
  [LLMModels.CLAUDE_OPUS_4_8]: { inputPerMillion: 5, outputPerMillion: 25, cachedInputPerMillion: 0.5, provider: LLMProvider.ANTHROPIC }, // [V]

  // ── Google Gemini — https://ai.google.dev/gemini-api/docs/pricing ────────
  [LLMModels.GEMINI_1_5_PRO]: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE }, // [S] superseded, not on page (<=128K tier)
  [LLMModels.GEMINI_1_5_FLASH]: { inputPerMillion: 0.075, outputPerMillion: 0.3, cachedInputPerMillion: 0.01875, provider: LLMProvider.GOOGLE }, // [S] CORRECTED from $0.35/$1.05; superseded
  [LLMModels.GEMINI_2_0_FLASH]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.025, provider: LLMProvider.GOOGLE }, // [V] (NOTE: deprecated, shut down 2026-06-01)
  [LLMModels.GEMINI_2_5_FLASH]: { inputPerMillion: 0.3, outputPerMillion: 2.5, cachedInputPerMillion: 0.03, provider: LLMProvider.GOOGLE }, // [V] cached CORRECTED $0.075 -> $0.03
  [LLMModels.GEMINI_2_5_FLASH_LITE]: { inputPerMillion: 0.1, outputPerMillion: 0.4, cachedInputPerMillion: 0.01, provider: LLMProvider.GOOGLE }, // [V]
};

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
