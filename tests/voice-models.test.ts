import { describe, expect, it } from "vitest";
import {
  ALL_AGENT_TEMPLATES,
  AvatarProvider,
  LLMModels,
  MODEL_REGISTRY,
  OPENAI_DEFAULT_MODEL,
  TTSProvider,
  VOICE_AGENT_LLM_CHOICES,
  VOICE_AGENT_LLM_MODELS,
  VOICE_AGENT_LLM_PROVIDERS,
  VOICE_AGENT_MODEL_IDS,
  VOICE_AVATAR_RATES,
  VOICE_DEFAULT_MODELS,
  VOICE_LIVE_CHOICES,
  VOICE_LIVE_MODELS,
  VOICE_TTS_RATES,
  getModel,
  getModelPricing,
  getVoiceLiveModel,
  getVoiceLlmTokenRate,
  getVoicePerMinuteRate,
  liveVoicePreviewPath,
} from "../src/index.js";

const voiceProviders = VOICE_AGENT_LLM_PROVIDERS as readonly string[];
const tokenRateOf = (model: string) => {
  const pricing = getModelPricing(model)!;
  return { input1M: pricing.inputPerMillion, output1M: pricing.outputPerMillion };
};

describe("voice pipeline models", () => {
  it("offers only live models from providers the voice worker runs, each with a voice reasoning setting", () => {
    expect(VOICE_AGENT_LLM_MODELS.length).toBeGreaterThan(0);
    for (const id of VOICE_AGENT_LLM_MODELS) expect(voiceProviders).toContain(getModel(id)?.provider);
    for (const model of MODEL_REGISTRY) {
      if (model.offeredInVoice) {
        expect(model.status, model.id).toBe("live");
        expect(voiceProviders, model.id).toContain(model.provider);
        expect(model.voiceReasoning, model.id).toBeDefined();
      } else {
        expect(model.voiceReasoning, model.id).toBeUndefined();
      }
    }
  });

  it("gives every voice provider an offered default and keeps the OpenAI default in the picker", () => {
    for (const provider of VOICE_AGENT_LLM_PROVIDERS) {
      const model = getModel(VOICE_DEFAULT_MODELS[provider]);
      expect(model?.offeredInVoice).toBe(true);
      expect(model?.provider).toBe(provider);
    }
    expect(VOICE_AGENT_LLM_CHOICES.map((m) => m.id)).toContain(OPENAI_DEFAULT_MODEL);
  });
});

describe("voice Live models", () => {
  it.each(VOICE_LIVE_MODELS.map((m) => [m.id, m] as const))("%s is complete, priced and has unique labelled voices", (_id, model) => {
    const ids = model.voices.map((voice) => voice.id);
    expect(ids).toContain(model.defaultVoice);
    expect(new Set(ids).size).toBe(ids.length);
    for (const voice of model.voices) expect(voice.label.toLowerCase()).toBe(voice.id.toLowerCase());
    expect(model.perMinute).toBeGreaterThan(0);
    expect(voiceProviders).toContain(model.provider);
    expect(getModel(model.textModel)?.offeredInVoice).toBe(true);
    expect(VOICE_LIVE_CHOICES.map((m) => m.id)).toContain(model.id);
  });

  it("keeps Live ids apart from pipeline ids and out of the pipeline picker", () => {
    const pipelineIds = new Set<string>(Object.values(LLMModels));
    const liveIds = new Set(VOICE_LIVE_MODELS.map((m) => m.id));
    expect(VOICE_LIVE_MODELS.filter((m) => pipelineIds.has(m.id))).toEqual([]);
    expect(VOICE_AGENT_LLM_CHOICES.filter((m) => liveIds.has(m.id))).toEqual([]);
    expect(VOICE_AGENT_MODEL_IDS).toEqual([...VOICE_AGENT_LLM_MODELS, ...liveIds]);
  });

  it("looks a Live model up in any case and returns undefined for anything else", () => {
    expect(getVoiceLiveModel("GPT-Live-1")?.id).toBe("gpt-live-1");
    for (const id of [undefined, "", LLMModels.GPT_5_5, "not-a-model"]) expect(getVoiceLiveModel(id)).toBeUndefined();
    expect(liveVoicePreviewPath("gemini-3.8-live", "Puck")).toBe("/voice-previews/live/gemini-3.8-live/Puck.mp3");
  });
});

describe("voice pricing", () => {
  it("prices a known model from the registry and anything else at the OpenAI default", () => {
    expect(getVoiceLlmTokenRate(LLMModels.GPT_5_4_MINI)).toEqual(tokenRateOf(LLMModels.GPT_5_4_MINI));
    expect(getVoiceLlmTokenRate("not-a-model", "openai")).toEqual(tokenRateOf(OPENAI_DEFAULT_MODEL));
    expect(getVoiceLlmTokenRate(undefined, "openai")).toEqual(tokenRateOf(OPENAI_DEFAULT_MODEL));
  });

  it("matches per-minute providers in any case and prices the avatar providers the worker runs", () => {
    expect(getVoicePerMinuteRate(VOICE_TTS_RATES, "ElevenLabs")).toBe(VOICE_TTS_RATES[TTSProvider.ELEVENLABS]);
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, "heygen")).toBeUndefined();
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, undefined)).toBeUndefined();
    for (const provider of [AvatarProvider.BEY, AvatarProvider.TAVUS]) {
      expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, provider)?.perMinute).toBeGreaterThan(0);
    }
  });
});

describe("agent template models", () => {
  it("name only live registry models on providers the voice worker runs", () => {
    const byId = new Map(MODEL_REGISTRY.map((model) => [model.id as string, model]));
    for (const tpl of ALL_AGENT_TEMPLATES) {
      if (!tpl.llm) continue;
      const model = byId.get(tpl.llm.model);
      expect(model?.status, `${tpl.id}: ${tpl.llm.model}`).toBe("live");
      expect(model?.provider, tpl.id).toBe(tpl.llm.provider);
      expect(voiceProviders, tpl.id).toContain(tpl.llm.provider);
    }
  });
});
