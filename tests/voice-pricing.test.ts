import { describe, expect, it } from "vitest";
import {
  AvatarProvider,
  LLMModels,
  OPENAI_DEFAULT_MODEL,
  TTSProvider,
  VOICE_AVATAR_RATES,
  VOICE_TTS_RATES,
  getModelPricing,
  getVoiceLlmTokenRate,
  getVoicePerMinuteRate,
} from "../src/index.js";

const tokenRateOf = (model: string) => {
  const pricing = getModelPricing(model)!;
  return { input1M: pricing.inputPerMillion, output1M: pricing.outputPerMillion };
};

describe("getVoiceLlmTokenRate", () => {
  it("prices a known model from MODEL_PRICING", () => {
    expect(getVoiceLlmTokenRate(LLMModels.GPT_5_4_MINI)).toEqual(tokenRateOf(LLMModels.GPT_5_4_MINI));
  });

  it.each([["an unknown model", "not-a-model"], ["no model", undefined]])(
    "prices %s at the OpenAI default",
    (_label, model) => {
      expect(getVoiceLlmTokenRate(model, "openai")).toEqual(tokenRateOf(OPENAI_DEFAULT_MODEL));
    },
  );
});

describe("getVoicePerMinuteRate", () => {
  it("matches a provider in any case", () => {
    expect(getVoicePerMinuteRate(VOICE_TTS_RATES, "ElevenLabs")).toBe(VOICE_TTS_RATES[TTSProvider.ELEVENLABS]);
  });

  it("returns undefined for an unpriced or missing provider", () => {
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, "heygen")).toBeUndefined();
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, undefined)).toBeUndefined();
  });

  it("prices the avatar providers the worker runs", () => {
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, AvatarProvider.BEY)?.perMinute).toBe(0.1);
    expect(getVoicePerMinuteRate(VOICE_AVATAR_RATES, AvatarProvider.TAVUS)?.perMinute).toBe(0.1);
  });
});
