/**
 * Canonical LLM model pricing — USD per 1M tokens.
 *
 * This is now a PROJECTION of `MODEL_REGISTRY` rather than a table of its own. It kept
 * drifting from the other six places a model is described: a model could be added to the
 * chat catalog with no pricing row, or priced here and missing from the capability helpers.
 * The registry is the one place a model is declared; this file exists so the existing
 * `MODEL_PRICING` / `getModelPricing` surface keeps working unchanged.
 *
 * To add or reprice a model, edit `src/llm/registry.ts`.
 *
 * Rates verified 2026-06 against:
 *   OpenAI    — https://platform.openai.com/docs/pricing
 *   Anthropic — https://docs.anthropic.com/en/docs/about-claude/pricing  (cache read = 0.1x input)
 *   Gemini    — https://ai.google.dev/gemini-api/docs/pricing
 */
import { MODEL_REGISTRY } from "../llm/registry.js";
import type { ModelPricing } from "../llm/types.js";

export type { ModelPricing } from "../llm/types.js";

/**
 * Every model's rate card, keyed by model id — including deprecated and retired models, so
 * a stored id on an old row still bills correctly.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = Object.fromEntries(
  MODEL_REGISTRY.map((model) => [model.id, model.pricing]),
);

/** Look up pricing for a model id (enum value or raw string). Undefined if unknown. */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
