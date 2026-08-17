/**
 * Conversation Types
 * Shared types for conversation tracking and events
 */

import { UsageMetrics, CostBreakdown } from "./billing.js";
import {
  CallType,
  RecordingStatus,
  ConversationStatus,
} from "../enums/billing.js";
import { PhoneCallMetadata, HandoffMetadata } from "./telephony.js";
import { StructuredOutputsMap } from "./structuredOutput.js";
import { CanonicalEndReason, SentimentType } from "../enums/conversation.js";

export interface TranscriptMessage {
  role: "user" | "agent";
  message: string;
  timestamp: string;
  messageId?: string;
}

export interface ConversationMetadata {
  systemPrompt?: string;
  agentName?: string;
  voiceProvider?: string;
  [key: string]: unknown;
}

export interface WordTimestamp {
  word: string;
  start?: number;
  end?: number;
  confidence?: number;
}

export interface ConversationSummaryMeta {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface ConversationSummary {
  text: string;
  sentiment: SentimentType;
  keyTopics: string[];
  actionItems: string[];
  generatedAt: string;
  meta: ConversationSummaryMeta;
}

export interface ConversationAnalysis {
  structuredData?: Record<string, any>;
  structuredOutputs?: StructuredOutputsMap;
  successEvaluation?: string;
  summary?: ConversationSummary;
}

/**
 * Full Conversation interface
 * Used by client and backend
 */
export interface Conversation {
  conversationId: string;
  agentId: string;
  agentName?: string; // Populated via aggregation
  userId: string;
  widgetSessionId?: string;
  participants: string[];
  sessionId: string;
  transcript: TranscriptMessage[];
  status: ConversationStatus;
  duration: number;
  usage?: UsageMetrics;
  costs?: CostBreakdown;
  startedAt: string;
  endedAt?: string;
  analysis?: ConversationAnalysis;
  /** Post-call feedback submitted by the end user (rating is 1-5; submittedAt is ISO). */
  feedback?: {
    rating?: number;
    comment?: string;
    submittedAt?: string;
  };
  endedReason?: CanonicalEndReason;
  recordingUrls?: {
    mixed?: string;
    user?: string;
    agent?: string;
  };
  recordingStatus?: RecordingStatus;
  metadata?: Record<string, any>;
  callType?: CallType;
  phone?: PhoneCallMetadata;
  handoff?: HandoffMetadata;
  callerId?: string;
  createdAt: string;
}

export interface ConversationEvent {
  eventId: string;
  conversationId: string;
  agentId?: string;
  userId?: string;
  eventType: string; // ConversationEventType value
  timestamp: string;
  cost?: number;
  platformCost?: number;
  data: Record<string, unknown>;
  metadata?: {
    turnNumber?: number;
    requestId?: string;
  };
}

export interface ConversationSearchEvent {
  type: "kb" | "web";
  query: string;
  resultCount: number;
  durationMs: number;
  topUrl?: string;
  avgScore?: number;
  failed?: boolean;
}

export interface ConversationTurn {
  turnNumber: number;
  userMessage?: { text: string; timestamp: number };
  agentMessage?: { text: string; timestamp: number };
  searches: ConversationSearchEvent[];
  errors: Array<{ service: string; message: string }>;
  attribution: {
    primarySource: "kb" | "web" | "none";
    sources: Array<"kb" | "web">;
  };
}
