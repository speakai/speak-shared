import { MODEL_REGISTRY } from "../llm/registry.js";
import type { ModelPricing } from "../llm/types.js";

export type { ModelPricing } from "../llm/types.js";

export const MODEL_PRICING: Record<string, ModelPricing> = Object.fromEntries(
  MODEL_REGISTRY.map((model) => [model.id, model.pricing]),
);

export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}
