import { describe, expect, it } from "vitest";
import {
  LLMModels,
  LLMProvider,
  OPENAI_DEFAULT_MODEL,
  VOICE_AGENT_LLM_MODELS,
  VOICE_AGENT_LLM_PROVIDERS,
  getModel,
} from "../src/index.js";

describe("voice agent LLMs", () => {
  it("limits providers to the ones the voice worker runs", () => {
    expect([...VOICE_AGENT_LLM_PROVIDERS].sort()).toEqual([
      LLMProvider.GOOGLE,
      LLMProvider.OPENAI,
    ]);
  });

  it("offers only models from those providers", () => {
    expect(VOICE_AGENT_LLM_MODELS.length).toBeGreaterThan(0);
    for (const id of VOICE_AGENT_LLM_MODELS) {
      expect(VOICE_AGENT_LLM_PROVIDERS).toContain(getModel(id)?.provider);
    }
  });

  it.each([
    OPENAI_DEFAULT_MODEL,
    LLMModels.GEMINI_3_7_FLASH,
    LLMModels.GEMINI_1_5_FLASH,
  ])("includes %s", (id) => {
    expect(VOICE_AGENT_LLM_MODELS).toContain(id);
  });

  it.each([LLMModels.CLAUDE_SONNET_5, LLMModels.GROK_4_5])(
    "excludes %s, which has no voice engine",
    (id) => {
      expect(VOICE_AGENT_LLM_MODELS).not.toContain(id);
    },
  );
});
