/**
 * Conversation Event Types
 * Used for tracking conversation lifecycle and billing events
 */

export enum ConversationEventType {
  STT = "stt",
  LLM = "llm",
  TTS = "tts",
  AVATAR = "avatar",
  USER_MESSAGE = "user_message",
  AGENT_MESSAGE = "agent_message",
  ERROR = "error",
  SYSTEM = "system",
  AGENT_CONNECTED = "agent_connected",
  USER_CONNECTED = "user_connected",
  USER_DISCONNECTED = "user_disconnected",
  STT_START = "stt_start",
  STT_END = "stt_end",
  LLM_START = "llm_start",
  LLM_END = "llm_end",
  TTS_START = "tts_start",
  TTS_END = "tts_end",
  TRANSCRIPTION = "transcription",
  // Telephony events
  PHONE_CALL_STARTED = "phone_call_started",
  PHONE_CALL_ENDED = "phone_call_ended",
  PHONE_DTMF = "phone_dtmf",
  HANDOFF_INITIATED = "handoff_initiated",
  HANDOFF_COMPLETED = "handoff_completed",
  HANDOFF_FAILED = "handoff_failed",
  // Knowledge base events
  KB_SEARCH = "kb_search",
  // Web search events
  WEB_SEARCH = "web_search",
  // Tool execution (input args + output result persisted under this type)
  TOOL_CALL = "tool_call",
  // Resource sharing events
  RESOURCE_LINK = "resource_link",
  // Data collection events
  DATA_COLLECTION_FIELD = "data_collection_field",
  DATA_COLLECTION_SKIPPED = "data_collection_skipped",
  DATA_COLLECTION_COMPLETE = "data_collection_complete",
  // Turn-level aggregate latency (end-to-end: STT + LLM TTFT + TTS first chunk)
  TURN_E2E = "turn_e2e",
  // Avatar lifecycle
  AVATAR_DEGRADED_CAPACITY = "avatar_degraded_capacity",
}

export enum SentimentType {
  POSITIVE = "positive",
  NEUTRAL  = "neutral",
  NEGATIVE = "negative",
}

export enum CanonicalEndReason {
  USER_GOODBYE       = "user-goodbye",
  USER_MANUAL_END    = "user-manual-end",
  USER_DISCONNECTED  = "user-disconnected",
  MAX_DURATION       = "max-duration-reached",
  TOOL_END_CALL      = "tool-end-call",
  TOOL_TRANSFER_CALL = "tool-transfer-call",
  PHONE_COMPLETED    = "phone-call-completed",
  PHONE_BUSY         = "phone-busy",
  PHONE_NO_ANSWER    = "phone-no-answer",
  PHONE_FAILED       = "phone-failed",
  PHONE_CANCELED     = "phone-canceled",
  SYSTEM_SHUTDOWN    = "system-shutdown",
  SYSTEM_ERROR       = "system-error",
  LIVEKIT_ORPHAN     = "livekit-orphan",
  PARTICIPANT_NEVER_JOINED = "participant-never-joined",
}

/**
 * End reasons that represent technical failures or non-user-initiated ends.
 * Sub-30s sessions with these reasons are NOT product-quality signals and
 * should not trigger early-dropoff alerts to admins.
 */
export const EARLY_DROPOFF_EXCLUDED_REASONS: ReadonlySet<CanonicalEndReason> = new Set([
  CanonicalEndReason.LIVEKIT_ORPHAN,
  CanonicalEndReason.SYSTEM_SHUTDOWN,
  CanonicalEndReason.SYSTEM_ERROR,
  CanonicalEndReason.PHONE_NO_ANSWER,
  CanonicalEndReason.PHONE_BUSY,
  CanonicalEndReason.PHONE_FAILED,
  CanonicalEndReason.PHONE_CANCELED,
  CanonicalEndReason.PARTICIPANT_NEVER_JOINED,
]);
