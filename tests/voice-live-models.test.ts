import { describe, expect, it } from "vitest";
import {
  LLMModels,
  VOICE_AGENT_LLM_CHOICES,
  VOICE_AGENT_LLM_MODELS,
  VOICE_AGENT_LLM_PROVIDERS,
  VOICE_AGENT_MODEL_IDS,
  VOICE_LIVE_CHOICES,
  VOICE_LIVE_MODELS,
  LLMProvider,
  getModel,
  getVoiceLiveModel,
  liveVoicePreviewPath,
} from "../src/index.js";

describe("VOICE_LIVE_MODELS", () => {
  it.each(VOICE_LIVE_MODELS.map((m) => [m.id, m] as const))("%s is a complete Live model", (_id, model) => {
    expect(model.voices.map((voice) => voice.id)).toContain(model.defaultVoice);
    expect(model.perMinute).toBeGreaterThan(0);
    expect(VOICE_AGENT_LLM_PROVIDERS).toContain(model.provider);
    expect(getModel(model.textModel)?.offeredInVoice).toBe(true);
  });

  it.each(VOICE_LIVE_MODELS.map((m) => [m.id, m] as const))("%s has unique, labelled voices", (_id, model) => {
    const ids = model.voices.map((voice) => voice.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const voice of model.voices) {
      expect(voice.label).toBe(voice.id.charAt(0).toUpperCase() + voice.id.slice(1));
    }
  });

  it("uses ids that no pipeline model has", () => {
    const pipelineIds = new Set<string>(Object.values(LLMModels));
    expect(VOICE_LIVE_MODELS.filter((m) => pipelineIds.has(m.id))).toEqual([]);
  });

  it("offers GPT-Live as a full-duplex model", () => {
    expect(getVoiceLiveModel("gpt-live-1")).toMatchObject({ fullDuplex: true, defaultVoice: "marin" });
    expect(VOICE_LIVE_CHOICES.map((m) => m.id)).toContain("gpt-live-1");
  });
});

describe("Gemini Live", () => {
  it("offers Gemini Live as a turn-taking Google model with the plugin's 30 voices", () => {
    const gemini = getVoiceLiveModel("gemini-3.8-live");
    expect(gemini).toMatchObject({
      label: "Gemini Live",
      provider: LLMProvider.GOOGLE,
      fullDuplex: false,
      defaultVoice: "Puck",
      perMinute: 0.023,
      offeredInVoice: true,
      textModel: LLMModels.GEMINI_3_5_FLASH,
    });
    expect(gemini?.voices).toHaveLength(30);
    expect(gemini?.voices).toContainEqual({ id: "Puck", label: "Puck" });
    expect(VOICE_LIVE_CHOICES.map((m) => m.id)).toContain("gemini-3.8-live");
  });
});

describe("liveVoicePreviewPath", () => {
  it("points at the static preview for a model's voice", () => {
    expect(liveVoicePreviewPath("gpt-live-1", "marin")).toBe("/voice-previews/live/gpt-live-1/marin.mp3");
    expect(liveVoicePreviewPath("gemini-3.8-live", "Puck")).toBe("/voice-previews/live/gemini-3.8-live/Puck.mp3");
  });
});

describe("getVoiceLiveModel", () => {
  it("matches an id in any case", () => {
    expect(getVoiceLiveModel("GPT-Live-1")?.id).toBe("gpt-live-1");
  });

  it.each([undefined, "", LLMModels.GPT_5_5, "not-a-model"])("returns undefined for %s", (id) => {
    expect(getVoiceLiveModel(id)).toBeUndefined();
  });
});

describe("VOICE_AGENT_MODEL_IDS", () => {
  it("accepts every pipeline and Live model id", () => {
    expect(VOICE_AGENT_MODEL_IDS).toEqual([...VOICE_AGENT_LLM_MODELS, ...VOICE_LIVE_MODELS.map((m) => m.id)]);
  });

  it("leaves the pipeline picker choices without Live models", () => {
    const liveIds = new Set(VOICE_LIVE_MODELS.map((m) => m.id));
    expect(VOICE_AGENT_LLM_CHOICES.filter((m) => liveIds.has(m.id))).toEqual([]);
  });
});

describe("GPT-Live backend model", () => {
  it("runs tools on gpt-5.6 Terra", () => {
    expect(getVoiceLiveModel("gpt-live-1")?.textModel).toBe(LLMModels.GPT_5_6_TERRA);
  });
});
