/**
 * Billing Interfaces
 * Usage metrics, cost tracking, and transaction records.
 */

import { TransactionEventType } from "../enums/billing.js";

/**
 * Usage metrics tracked per conversation event
 * Fields align with LiveKit Agents SDK metric types
 */
export interface UsageMetrics {
  llm?: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number; // Prompt tokens served from cache (cost savings)
    totalTokens: number;
    latency?: number; // TTFT - Time to First Token (ms)
    completionDuration?: number;
    tokensPerSecond?: number; // Generation speed
    speechId?: string;
    cancelled?: boolean; // Whether request was cancelled
  };
  tts?: {
    provider: string;
    voice: string;
    characters: number;
    duration?: number; // Audio duration in seconds
    latency?: number; // TTFB - Time to First Byte (ms)
    generationDuration?: number;
    speechId?: string;
    isStreaming?: boolean;
    cancelled?: boolean; // Whether synthesis was cancelled
  };
  stt?: {
    provider: string;
    duration?: number; // Audio duration in seconds
    latency?: number; // Request duration or transcriptionDelayMs from EOU (ms)
    processingDuration?: number;
    isStreaming?: boolean; // Whether STT is using streaming mode
    endOfUtteranceDelay?: number; // Time from VAD speech end to turn decision (ms)
    onUserTurnCompletedDelay?: number;
    speechId?: string;
  };
  avatar?: {
    provider: string;
    duration?: number; // Video duration in seconds
    frames?: number; // Number of frames rendered
    latency?: number; // TTFF - Time to First Frame (ms)
  };
  telephony?: {
    provider: string; // Default: 'twilio'
    duration?: number; // Call duration in seconds
    billedMinutes?: number; // Rounded up for billing
  };
}

/**
 * Cost breakdown for a conversation
 */
export interface CostBreakdown {
  llmCost: number;
  ttsCost: number;
  sttCost: number;
  avatarCost: number;
  telephonyCost?: number;
  platformCost: number;
  totalCost: number;
}

/**
 * User credits balance
 */
export interface Credits {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  orgId: string;
}

/**
 * Transaction record (API-facing)
 */
export interface Transaction {
  transactionId: string;
  conversationId: string;
  agentId: string;
  orgId: string;
  eventType: TransactionEventType;
  timestamp: string;
  costs: {
    totalCost: number;
    llmCost: number;
    ttsCost: number;
    sttCost: number;
    avatarCost: number;
    telephonyCost: number;
  };
  metadata?: {
    durationMinutes?: number;
  };
  status: string;
}

/**
 * Billing statistics
 */
export interface BillingStats {
  totalSpend: number;
  todaySpend: number;
  availableCredits: number;
}

/**
 * Pricing information
 */
export interface Pricing {
  perMinute: number;
  version: string;
}

/**
 * Conversation cost summary
 */
export interface ConversationCost {
  conversationId: string;
  totalCost: number;
  llmCost: number;
  ttsCost: number;
  sttCost: number;
  avatarCost: number;
  telephonyCost?: number;
  transactionCount: number;
  durationMinutes?: number;
}
