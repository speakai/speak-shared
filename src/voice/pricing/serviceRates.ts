/**
 * Per-minute vendor rates for the non-LLM services a voice call uses, in USD.
 *
 * LLM pricing is NOT here — it lives in `pricing/modelPricing.ts`, which is the
 * canonical table for every Speak surface and carries cache-read rates. Use
 * `getModelPricing()` for tokens and this file for everything billed by time.
 *
 * Keyed by the provider enum values, so a rate lookup and a provider field cannot
 * drift apart.
 */

import { AvatarProvider, STTProvider, TTSProvider } from "../enums/providers.js";

export interface PerMinuteRate {
  perMinute: number;
}

export interface TelephonyRate extends PerMinuteRate {
  /** Charged on top of the carrier's own per-minute rate. */
  platformMarkupPerMinute: number;
}

/** Text to speech, per minute of generated audio. */
export const TTS_RATES: Partial<Record<TTSProvider, PerMinuteRate>> = {
  [TTSProvider.ELEVENLABS]: { perMinute: 0.03 },
  [TTSProvider.OPENAI]: { perMinute: 0.01 },
  [TTSProvider.CARTESIA]: { perMinute: 0.02 },
};

/** Speech to text, per minute of audio transcribed. */
export const STT_RATES: Partial<Record<STTProvider, PerMinuteRate>> = {
  [STTProvider.DEEPGRAM]: { perMinute: 0.0125 },
  [STTProvider.OPENAI]: { perMinute: 0.02 },
};

/** Avatar video, per minute rendered. */
export const AVATAR_RATES: Partial<Record<AvatarProvider, PerMinuteRate>> = {
  [AvatarProvider.BEY]: { perMinute: 0.1 },
  [AvatarProvider.TAVUS]: { perMinute: 0.1 },
};

/** Carrier minutes. Twilio's figure is a US inbound average. */
export const TELEPHONY_RATES: Record<string, TelephonyRate> = {
  twilio: { perMinute: 0.0085, platformMarkupPerMinute: 0.02 },
};

/** Applied once per call against its duration, not per event. */
export const PLATFORM_RATE: PerMinuteRate = { perMinute: 0.05 };

/** Used when telephony usage names no provider. */
export const DEFAULT_TELEPHONY_PROVIDER = "twilio";

/**
 * Bumped whenever a rate above changes, so a row can record which table priced it.
 * Independent of the LLM table's own versioning.
 */
export const SERVICE_RATES_VERSION = 1;

/**
 * Look up a per-minute rate for a provider, whatever case it arrives in.
 *
 * @param rates One of the rate tables above.
 * @param provider Provider name as recorded on the usage metrics.
 * @returns The rate, or undefined when the provider is not priced.
 */
export const getPerMinuteRate = (
  rates: Partial<Record<string, PerMinuteRate>>,
  provider: string | undefined,
): PerMinuteRate | undefined =>
  provider ? rates[provider.toLowerCase()] : undefined;
