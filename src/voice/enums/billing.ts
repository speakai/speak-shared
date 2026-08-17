/**
 * Billing Types
 */

export type CallType = "web" | "phone";

export type RecordingStatus = "pending" | "recording" | "processing" | "completed" | "failed";

export type ConversationStatus = "active" | "completed" | "ended" | "transferred";

export const BASE_TRANSACTION_EVENT_TYPES = [
  "message",
  "session_start",
  "session_end",
  "telephony_cost",
  "agent_generation",
  "kb_faq_generation",
  "kb_gap_analysis",
  "phone_number_purchase",
  "agent_test_run",
] as const;

export const ANALYSIS_OPERATION_CONFIG = {
  summary: {
    eventType: "analysis_summary",
    label: "conversation summary",
  },
  extraction: {
    eventType: "analysis_extraction",
    label: "structured data extraction",
  },
  reextract: {
    eventType: "analysis_reextract",
    label: "single output re-extraction",
  },
} as const;

export type AnalysisOperation = keyof typeof ANALYSIS_OPERATION_CONFIG;
export type AnalysisTransactionEventType =
  (typeof ANALYSIS_OPERATION_CONFIG)[AnalysisOperation]["eventType"];
export type BaseTransactionEventType =
  (typeof BASE_TRANSACTION_EVENT_TYPES)[number];
export type TransactionEventType =
  | BaseTransactionEventType
  | AnalysisTransactionEventType;
