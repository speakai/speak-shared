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

// NOTE: The LLM provider + model enum + pricing are the canonical ones in
// `@speakai/shared` (single source of truth across speak-server + voice-agent).
// Import `LLMProvider`, `LLMModels`, and `getModelPricing` / `MODEL_PRICING`
// from "@speakai/shared" — do not redefine them here.

export enum AvatarProvider {
  BEY = "bey",
  TAVUS = "tavus",
  HEYGEN = "heygen",
  SYNTHESIA = "synthesia",
  D_ID = "d-id",
}
