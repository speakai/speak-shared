import { describe, expect, it } from "vitest";

import {
  AVATAR_RATES,
  AvatarProvider,
  DEFAULT_TELEPHONY_PROVIDER,
  PLATFORM_RATE,
  STTProvider,
  STT_RATES,
  TELEPHONY_RATES,
  TTSProvider,
  TTS_RATES,
  getModelPricing,
  getPerMinuteRate,
} from "../src/index.js";

describe("service rates", () => {
  it("keys every table by the provider enum, so a rate cannot drift from a provider field", () => {
    expect(TTS_RATES[TTSProvider.ELEVENLABS]).toBeDefined();
    expect(STT_RATES[STTProvider.DEEPGRAM]).toBeDefined();
    expect(AVATAR_RATES[AvatarProvider.TAVUS]).toBeDefined();
  });

  it("prices telephony as carrier plus markup", () => {
    const twilio = TELEPHONY_RATES[DEFAULT_TELEPHONY_PROVIDER];
    expect(twilio.perMinute).toBeGreaterThan(0);
    expect(twilio.platformMarkupPerMinute).toBeGreaterThan(0);
  });

  it("states a platform rate, which is charged per call rather than per event", () => {
    expect(PLATFORM_RATE.perMinute).toBeGreaterThan(0);
  });

  it("carries no LLM rates — those belong to the canonical model table", () => {
    // Guards against someone re-adding a second source of truth for token pricing.
    const tables = { ...TTS_RATES, ...STT_RATES, ...AVATAR_RATES };
    for (const key of Object.keys(tables)) {
      expect(getModelPricing(key)).toBeUndefined();
    }
  });
});

describe("getPerMinuteRate", () => {
  it("matches a provider whatever case it arrives in", () => {
    expect(getPerMinuteRate(TTS_RATES, "ELEVENLABS")).toEqual(TTS_RATES[TTSProvider.ELEVENLABS]);
    expect(getPerMinuteRate(STT_RATES, "Deepgram")).toEqual(STT_RATES[STTProvider.DEEPGRAM]);
  });

  it("returns undefined rather than a wrong number for an unpriced provider", () => {
    expect(getPerMinuteRate(TTS_RATES, "someone-new")).toBeUndefined();
    expect(getPerMinuteRate(TTS_RATES, undefined)).toBeUndefined();
    expect(getPerMinuteRate(TTS_RATES, "")).toBeUndefined();
  });
});

describe("model pricing, for the models voice actually uses", () => {
  it("charges cached input at a reduced rate, not free", () => {
    // The reason this file does not carry its own LLM table: cache reads are
    // discounted, not zero, and only the canonical table knows by how much.
    const gpt = getModelPricing("gpt-5.4");
    expect(gpt?.cachedInputPerMillion).toBeGreaterThan(0);
    expect(gpt?.cachedInputPerMillion).toBeLessThan(gpt!.inputPerMillion);
  });
});
