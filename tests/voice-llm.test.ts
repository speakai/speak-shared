import { describe, expect, it } from "vitest";
import {
  LLMModels,
  LLMProvider,
  MODEL_REGISTRY,
  OPENAI_DEFAULT_MODEL,
  VOICE_AGENT_LLM_CHOICES,
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

  it("offers only live voice-provider models with a voice reasoning setting", () => {
    const offered = MODEL_REGISTRY.filter((m) => m.offeredInVoice);
    expect(offered.length).toBeGreaterThan(0);
    for (const model of offered) {
      expect(model.status).toBe("live");
      expect(VOICE_AGENT_LLM_PROVIDERS).toContain(model.provider);
      expect(model.voiceReasoning).toBeDefined();
    }
  });

  it("gives a voice reasoning setting only to models offered in voice", () => {
    const stray = MODEL_REGISTRY.filter((m) => !m.offeredInVoice && m.voiceReasoning !== undefined);
    expect(stray.map((m) => m.id)).toEqual([]);
  });

  it("offers exactly the fast-starting models in voice pickers, the default included", () => {
    const ids = VOICE_AGENT_LLM_CHOICES.map((m) => m.id);
    expect([...ids].sort()).toEqual(
      [
        LLMModels.GPT_5_4_MINI_2026_03_17,
        LLMModels.GPT_5_5,
        LLMModels.GPT_5_6_SOL,
        LLMModels.GPT_5_6_TERRA,
        LLMModels.GEMINI_3_5_FLASH,
      ].sort(),
    );
    expect(ids).toContain(OPENAI_DEFAULT_MODEL);
  });

  it.each([
    LLMModels.GEMINI_3_7_FLASH,
    LLMModels.GEMINI_3_8_FLASH,
    LLMModels.GEMINI_3_FLASH_PREVIEW,
    LLMModels.GPT_5_4,
  ])("does not offer %s in voice pickers", (id) => {
    expect(VOICE_AGENT_LLM_CHOICES.map((m) => m.id)).not.toContain(id);
  });

  it.each([
    [LLMModels.GPT_5_5, "none"],
    [LLMModels.GEMINI_3_5_FLASH, "minimal"],
  ] as const)("sends %s the %s reasoning setting", (id, reasoning) => {
    expect(getModel(id)?.voiceReasoning).toBe(reasoning);
  });
});
