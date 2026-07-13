/**
 * Canonical LLM model + provider enums — single source of truth shared by
 * speak-server and the voice-agent backend/worker.
 *
 * Values are the REAL provider API model-id strings. Within each provider,
 * DEPRECATED models are grouped first, then LIVE/current models.
 */
export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
  OPENROUTER = 'openrouter',
}

export enum LLMModels {
  // ═══════════════ OpenAI ═══════════════
  // Deprecated
  GPT_3_5 = 'gpt-3.5',
  GPT_3_5_TURBO_16K = 'gpt-3.5-turbo-16k',
  GPT_3_5_TURBO_0125 = 'gpt-3.5-turbo-0125',
  GPT_4 = 'gpt-4',
  GPT_4_1106_PREVIEW = 'gpt-4-1106-preview',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4_O_2024_05_13 = 'gpt-4o-2024-05-13',
  // Live
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_O_2024_08_06 = 'gpt-4o-2024-08-06',
  GPT_4_MINI_2024_07_18 = 'gpt-4o-mini-2024-07-18',
  GPT_4_1_2025_04_14 = 'gpt-4.1-2025-04-14',
  GPT_5_1_2025_11_13 = 'gpt-5.1-2025-11-13',
  GPT_5_2 = 'gpt-5.2',
  GPT_5_4 = 'gpt-5.4',
  GPT_5_4_MINI = 'gpt-5.4-mini',
  GPT_5_4_MINI_2026_03_17 = 'gpt-5.4-mini-2026-03-17',
  GPT_5_4_NANO = 'gpt-5.4-nano',
  GPT_5_5 = 'gpt-5.5',
  GPT_5_5_THINKING = 'gpt-5.5-thinking',
  GPT_5_6_SOL = 'gpt-5.6-sol',
  GPT_5_6_TERRA = 'gpt-5.6-terra',
  GPT_5_6_LUNA = 'gpt-5.6-luna',

  // ═══════════════ Anthropic ═══════════════
  // Deprecated
  CLAUDE_2 = 'claude-2',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet',
  CLAUDE_3_5_SONNET_20241022 = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_7_SONNET_LATEST = 'claude-3-7-sonnet-latest',
  // Live
  CLAUDE_HAIKU_4_5 = 'claude-haiku-4-5',
  CLAUDE_SONNET_4_6 = 'claude-sonnet-4-6',
  CLAUDE_SONNET_5 = 'claude-sonnet-5',
  CLAUDE_OPUS_4_8 = 'claude-opus-4-8',

  // ═══════════════ Google Gemini ═══════════════
  // Deprecated
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
  GEMINI_2_0_FLASH = 'gemini-2.0-flash',
  // Live
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE = 'gemini-2.5-flash-lite',
  GEMINI_3_FLASH_PREVIEW = 'gemini-3-flash-preview',
  GEMINI_3_1_FLASH_LITE = 'gemini-3.1-flash-lite',
  GEMINI_3_1_PRO_PREVIEW = 'gemini-3.1-pro-preview',
  GEMINI_3_5_FLASH = 'gemini-3.5-flash',

  GROK_4_5 = 'x-ai/grok-4.5',
  GLM_5_2 = 'z-ai/glm-5.2',
}
