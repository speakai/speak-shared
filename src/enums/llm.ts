/**
 * Canonical LLM model + provider enums — single source of truth shared by
 * speak-server and the voice-agent backend/worker.
 *
 * Values are the REAL provider API model-id strings (what gets sent to the
 * provider and stored on records), so both systems can keep using their own
 * existing ids. Where the two systems pinned the same model to different ids
 * (e.g. gpt-5.4-mini), BOTH are kept as distinct members.
 */
export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}

export enum LLMModels {
  // ── OpenAI ──────────────────────────────────────────────
  GPT_3_5 = 'gpt-3.5', // deprecated
  GPT_3_5_TURBO_16K = 'gpt-3.5-turbo-16k', // deprecated
  GPT_3_5_TURBO_0125 = 'gpt-3.5-turbo-0125', // deprecated
  GPT_4 = 'gpt-4', // deprecated
  GPT_4_1106_PREVIEW = 'gpt-4-1106-preview', // deprecated
  GPT_4_TURBO = 'gpt-4-turbo', // deprecated
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_O_2024_05_13 = 'gpt-4o-2024-05-13', // deprecated (original gpt-4o snapshot)
  GPT_4_O_2024_08_06 = 'gpt-4o-2024-08-06', // pinned gpt-4o snapshot
  GPT_4_MINI_2024_07_18 = 'gpt-4o-mini-2024-07-18', // pinned gpt-4o-mini snapshot
  GPT_4_1_2025_04_14 = 'gpt-4.1-2025-04-14',
  GPT_5_1_2025_11_13 = 'gpt-5.1-2025-11-13',
  GPT_5_2 = 'gpt-5.2',
  GPT_5_4 = 'gpt-5.4',
  GPT_5_4_MINI = 'gpt-5.4-mini',
  GPT_5_4_MINI_2026_03_17 = 'gpt-5.4-mini-2026-03-17', // pinned gpt-5.4-mini snapshot
  GPT_5_4_NANO = 'gpt-5.4-nano',
  GPT_5_5 = 'gpt-5.5',
  GPT_5_5_THINKING = 'gpt-5.5-thinking',

  // ── Anthropic ───────────────────────────────────────────
  CLAUDE_2 = 'claude-2', // deprecated
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet', // deprecated
  CLAUDE_3_5_SONNET_20241022 = 'claude-3-5-sonnet-20241022', // deprecated
  CLAUDE_3_7_SONNET_LATEST = 'claude-3-7-sonnet-latest', // deprecated
  CLAUDE_HAIKU_4_5 = 'claude-haiku-4-5',
  CLAUDE_SONNET_4_6 = 'claude-sonnet-4-6',
  CLAUDE_OPUS_4_8 = 'claude-opus-4-8',

  // ── Google Gemini ───────────────────────────────────────
  GEMINI_1_5_PRO = 'gemini-1.5-pro', // deprecated (superseded)
  GEMINI_1_5_FLASH = 'gemini-1.5-flash', // deprecated (superseded)
  GEMINI_2_0_FLASH = 'gemini-2.0-flash', // deprecated (shut down 2026-06-01)
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE = 'gemini-2.5-flash-lite',
}
