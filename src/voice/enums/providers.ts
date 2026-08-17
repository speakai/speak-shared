/**
 * Provider Enums
 * Single source of truth for all AI service providers
 */

export enum STTProvider {
  DEEPGRAM = "deepgram",
  OPENAI = "openai",
  GOOGLE = "google",
  AZURE = "azure",
  GROQ = "groq",
  ASSEMBLYAI = "assemblyai",
}

export enum TTSProvider {
  ELEVENLABS = "elevenlabs",
  OPENAI = "openai",
  DEEPGRAM = "deepgram",
  CARTESIA = "cartesia",
  GOOGLE = "google",
  AZURE = "azure",
}

export enum LLMProvider {
  OPENAI = "openai",
  GOOGLE = "google",
}

// NOTE: The LLM model enum + pricing moved to `@speakai/shared` (single source
// of truth across speak-server + voice-agent). Import `LLMModels` and
// `getModelPricing` / `MODEL_PRICING` from "@speakai/shared".

export enum AvatarProvider {
  BEY = "bey",
  TAVUS = "tavus",
  HEYGEN = "heygen",
  SYNTHESIA = "synthesia",
  D_ID = "d-id",
}
