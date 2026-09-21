/**
 * Voice call vendor rates in USD: the single source every voice stack prices calls from.
 * LLM tokens are priced from `MODEL_PRICING`; everything billed by time is priced here.
 */

import { getModelPricing } from "../pricing/modelPricing.js";
import { OPENAI_DEFAULT_MODEL } from "../llm/registry.js";
import { AvatarProvider, STTProvider, TTSProvider } from "./enums/providers.js";

export interface VoicePerMinuteRate {
  perMinute: number;
}

export interface VoiceTelephonyRate extends VoicePerMinuteRate {
  /** Charged on top of the carrier's own per-minute rate. */
  platformMarkupPerMinute: number;
}

export interface VoiceLlmTokenRate {
  input1M: number;
  output1M: number;
}

/** Text to speech, per minute of generated audio. */
export const VOICE_TTS_RATES: Readonly<Record<string, VoicePerMinuteRate>> = {
  [TTSProvider.ELEVENLABS]: { perMinute: 0.03 },
  [TTSProvider.OPENAI]: { perMinute: 0.01 },
  [TTSProvider.CARTESIA]: { perMinute: 0.02 },
};

/** Speech to text, per minute of audio transcribed. */
export const VOICE_STT_RATES: Readonly<Record<string, VoicePerMinuteRate>> = {
  [STTProvider.DEEPGRAM]: { perMinute: 0.0125 },
  [STTProvider.OPENAI]: { perMinute: 0.02 },
};

/** Avatar video, per minute rendered. */
export const VOICE_AVATAR_RATES: Readonly<Record<string, VoicePerMinuteRate>> = {
  [AvatarProvider.BEY]: { perMinute: 0.1 },
  [AvatarProvider.TAVUS]: { perMinute: 0.1 },
};

/** Carrier minutes. Twilio's figure is a US inbound average. */
export const VOICE_TELEPHONY_RATES: Readonly<Record<string, VoiceTelephonyRate>> = {
  twilio: { perMinute: 0.0085, platformMarkupPerMinute: 0.02 },
};

/** Used when telephony usage names no provider. */
export const VOICE_DEFAULT_TELEPHONY_PROVIDER = "twilio";

/** Applied once per call against its duration, not per event. */
export const VOICE_PLATFORM_RATE: VoicePerMinuteRate = { perMinute: 0.05 };

/** Per-minute LLM figure for usage that reports a duration but no tokens. */
export const VOICE_LLM_PER_MINUTE_RATE: VoicePerMinuteRate = { perMinute: 0.04 };

/**
 * Token rate for a model: the model's own rate, else its provider's, else the OpenAI default,
 * which is the model the voice worker runs in place of an unknown one.
 */
export function getVoiceLlmTokenRate(model?: string, provider?: string): VoiceLlmTokenRate {
  const pricing =
    getModelPricing(model ?? "") ??
    getModelPricing(provider ?? "") ??
    getModelPricing(OPENAI_DEFAULT_MODEL)!;
  return { input1M: pricing.inputPerMillion, output1M: pricing.outputPerMillion };
}

/** Per-minute rate for a provider in any case, or undefined when it is not priced. */
export function getVoicePerMinuteRate(
  rates: Readonly<Record<string, VoicePerMinuteRate>>,
  provider: string | undefined,
): VoicePerMinuteRate | undefined {
  return provider ? rates[provider.toLowerCase()] : undefined;
}
