/**
 * Voice Agent Enums Index
 * Client-facing Voice Agent domain enums. Internal-only worker/server enums
 * (CriticalErrorType, LogService/LogLevel, SystemAlertType, the prospect/demo
 * domain, and auth eligibility) are intentionally NOT re-exported here — they
 * remain private to speak-server.
 */

export * from "./agent.js";
export * from "./auth.js";
export * from "./avatar.js";
export * from "./billing.js";
export * from "./conversation.js";
export * from "./dataCollection.js";
export * from "./integration.js";
export * from "./livekit.js";
export * from "./notification.js";
export * from "./organization.js";
export * from "./providers.js";
export * from "./structuredOutput.js";
export * from "./telephony.js";
export * from "./voice.js";
// Compatibility re-export: consumers import LLMProvider (the canonical enum in the root package)
// from "@speakai/shared/voice"; keep it available here until they migrate to the root import.
export { LLMProvider } from "../../enums/llm.js";
