/**
 * Demo Distribution Interfaces
 */

import { ProspectStatus, DemoEventType } from "../enums/prospect.js";

/** Per-agent demo controls — only fields that differ per prospect */
export interface DemoConfig {
  isDemo: boolean;
  expiresAt?: string;
  maxConversations?: number;
  conversationCount: number;
}

/** Global demo settings — configured once in admin panel, applied to all demo agents */
export interface DemoSettings {
  ctaText: string;
  ctaUrl: string;
  bookingLink: string;
  defaultMaxConversations: number;
  defaultExpiryDays: number;
}

export type GenerationState =
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "kb_blocked";
export type ApolloSyncState = "queued" | "processing" | "synced" | "failed";

export type ProspectEventType =
  | "queued"
  | "started"
  | "step_update"
  | "ready"
  | "failed"
  | "kb_blocked"
  | "warning"
  | "apollo_queued"
  | "apollo_started"
  | "apollo_synced"
  | "apollo_failed";

export interface ProspectEventData {
  step?: string;
  stepStatus?: string;
  error?: string;
  demoUrl?: string;
  warningCode?: string;
  warningMessage?: string;
  apolloSyncState?: ApolloSyncState;
}

export interface ProspectEvent {
  prospectId: string;
  type: ProspectEventType;
  data?: ProspectEventData;
}

export interface ProspectApolloSync {
  state?: ApolloSyncState | null;
  attempts: number;
  lastError?: string | null;
  lastAttemptAt?: string | null;
  syncedAt?: string | null;
}

export interface ProspectApollo {
  contactId?: string | null;
  sync?: ProspectApolloSync | null;
}

export interface Prospect {
  _id: string;
  prospectId: string;
  userId?: string;
  companyName: string;
  contactName?: string;
  contactEmail: string;
  websiteUrl?: string;
  industry?: string;
  agentId?: string;
  status: ProspectStatus;
  engagementScore: number;
  notes?: string;
  tags?: string[];
  agentContext?: string;
  importId?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  // Generation pipeline fields
  generationState?: GenerationState | null;
  generationAttempts?: number;
  generationLastError?: string | null;
  generationWarningCode?: string | null;
  generationWarningMessage?: string | null;
  generationStartedAt?: string | null;
  generationCompletedAt?: string | null;
  apollo?: ProspectApollo | null;
}

export interface DemoEvent {
  _id: string;
  agentId: string;
  prospectId?: string;
  sessionId: string;
  eventType: DemoEventType;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  utmContent?: string;
  metadata?: {
    durationSeconds?: number;
    turnCount?: number;
    userAgent?: string;
  };
  timestamp: string;
}

/** Response from GET /widget/demo/:agentId — merged agent info + global settings */
export interface DemoAgentResponse {
  agent: {
    agentId: string;
    name: string;
    shareToken: string;
    avatar: {
      avatarId: string;
      avatarUrl: string;
    };
    chatSettings: {
      welcomeMessage: string;
      language: string;
    };
    widgetConfig?: {
      buttonColor?: string;
      fontFamily?: string;
      borderRadius?: number;
      companyLogoUrl?: string;
    };
  };
  demoConfig: {
    expiresAt?: string;
    maxConversations?: number;
    conversationCount: number;
  };
  demoSettings: DemoSettings;
}
