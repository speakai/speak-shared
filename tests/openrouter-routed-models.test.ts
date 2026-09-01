/**
 * OpenRouter-routed model ids.
 *
 * The provider a request bills through is a property of the model id, not of the workspace,
 * so a model reachable both directly and through OpenRouter needs two ids. These assert the
 * pair stays distinct: the OpenRouter alias must route to OpenRouter, and its direct
 * counterpart must keep routing to the vendor, or a BYOK workspace silently pays through the
 * wrong key.
 */
import { describe, it, expect } from "vitest";
import { LLMModels, LLMProvider } from "../src/enums/llm.js";
import { MODEL_PRICING } from "../src/pricing/modelPricing.js";

const OPENROUTER_ALIASES = [
  LLMModels.OR_GPT_5_5,
  LLMModels.OR_GPT_5_6_TERRA,
  LLMModels.OR_GPT_5_6_SOL,
  LLMModels.OR_GPT_5_4_MINI,
  LLMModels.OR_CLAUDE_SONNET_5,
  LLMModels.OR_CLAUDE_OPUS_4_8,
  LLMModels.OR_CLAUDE_SONNET_4_6,
  LLMModels.OR_GEMINI_2_5_FLASH,
  LLMModels.OR_GEMINI_3_5_FLASH,
];

/** The direct id each alias shadows, which must keep its own vendor routing. */
const DIRECT_COUNTERPART: [LLMModels, LLMModels, LLMProvider][] = [
  [LLMModels.OR_GPT_5_5, LLMModels.GPT_5_5, LLMProvider.OPENAI],
  [LLMModels.OR_GPT_5_6_TERRA, LLMModels.GPT_5_6_TERRA, LLMProvider.OPENAI],
  [LLMModels.OR_GPT_5_6_SOL, LLMModels.GPT_5_6_SOL, LLMProvider.OPENAI],
  [LLMModels.OR_CLAUDE_SONNET_5, LLMModels.CLAUDE_SONNET_5, LLMProvider.ANTHROPIC],
  [LLMModels.OR_CLAUDE_OPUS_4_8, LLMModels.CLAUDE_OPUS_4_8, LLMProvider.ANTHROPIC],
  [LLMModels.OR_CLAUDE_SONNET_4_6, LLMModels.CLAUDE_SONNET_4_6, LLMProvider.ANTHROPIC],
  [LLMModels.OR_GEMINI_2_5_FLASH, LLMModels.GEMINI_2_5_FLASH, LLMProvider.GOOGLE],
  [LLMModels.OR_GEMINI_3_5_FLASH, LLMModels.GEMINI_3_5_FLASH, LLMProvider.GOOGLE],
];

describe("OpenRouter-routed models", () => {
  it.each(OPENROUTER_ALIASES)("%s is priced and routes through OpenRouter", (id) => {
    const pricing = MODEL_PRICING[id];
    expect(pricing).toBeDefined();
    expect(pricing.provider).toBe(LLMProvider.OPENROUTER);
  });

  // A slug is what OpenRouter accepts; an unprefixed id would be sent as-is and 404.
  it.each(OPENROUTER_ALIASES)("%s carries a vendor-prefixed slug", (id) => {
    expect(id).toMatch(/^(openai|anthropic|google)\//);
  });

  it.each(DIRECT_COUNTERPART)("%s does not change how %s routes", (alias, direct, provider) => {
    expect(alias).not.toBe(direct);
    expect(MODEL_PRICING[direct].provider).toBe(provider);
  });

  // Rates are what the customer's own key is charged, so they track OpenRouter, not the vendor.
  it.each(OPENROUTER_ALIASES)("%s has sane rates with a cheaper cached read", (id) => {
    const { inputPerMillion, outputPerMillion, cachedInputPerMillion } = MODEL_PRICING[id];
    expect(inputPerMillion).toBeGreaterThan(0);
    expect(outputPerMillion).toBeGreaterThan(inputPerMillion);
    expect(cachedInputPerMillion).toBeGreaterThan(0);
    expect(cachedInputPerMillion!).toBeLessThan(inputPerMillion);
  });
});
