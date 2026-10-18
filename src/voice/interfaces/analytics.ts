/**
 * Analytics Interfaces
 * Dashboard and reporting aggregations
 */

import type { CallType } from "../enums/billing.js";
import type { SentimentType } from "../enums/conversation.js";

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AnalyticsOverview {
  totalConversations: number;
  thisWeekCount: number;
  lastWeekCount: number;
  completionRate: number; // 0–1, percentage of conversations with status completed/ended
  avgDurationSeconds: number;
  dailyCounts: DailyCount[]; // last 14 days, ordered oldest → newest
}

export interface EngagementBucket {
  label: string; // "Bounce (0–1)", "Brief (2–5)", "Engaged (6–15)", "Deep (16+)"
  minMessages: number;
  maxMessages: number | null; // null = unbounded (16+)
  count: number;
  percentage: number; // 0–100, rounded
  avgDurationSeconds: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    unanalyzed: number; // count - positive - neutral - negative
  };
}

export interface EngagementFunnel {
  buckets: EngagementBucket[]; // always 4, ordered Bounce → Deep
  totalConversations: number;
  since: string | null; // ISO date string, or null = all-time
}

export interface AgentFunnelSummary {
  agentId: string;
  agentName: string;
  totalConversations: number;
  bounceRate: number; // 0–100
  briefRate: number;
  engagedRate: number;
  deepRate: number;
}

export interface IVoiceAnalyticsKpis {
  conversations: number;
  completionRate: number;
  avgDurationSeconds: number;
  returningCallers: number;
}

export interface IVoiceAnalyticsDay {
  date: string;
  conversations: number;
  web: number;
  phone: number;
}

export interface IVoiceAnalyticsLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  count: number;
}

export interface IVoiceAnalyticsNamedCount {
  name: string;
  count: number;
}

export interface IVoiceAnalyticsSource {
  kind: "page" | "campaign" | "direct";
  label: string;
  count: number;
}

export interface IVoiceAnalyticsRecentConversation {
  conversationId: string;
  createdAt: string;
  callType: CallType;
  status: string;
  durationSeconds: number;
  city: string | null;
  country: string | null;
  callerPhoneMasked: string | null;
  sentiment: SentimentType | null;
  mediaId: string | null;
  folderId: string | null;
}

export interface IVoiceAnalyticsCallerQuestion {
  question: string;
  askedCount: number;
  lastAskedAt: string;
  lastConversationId: string;
}

export interface IVoiceAnalyticsChannelStats {
  count: number;
  avgDurationSeconds: number;
}

export interface IVoiceAgentAnalytics {
  range: {
    start: string | null;
    end: string;
    tz: string;
    previousStart: string | null;
    previousEnd: string | null;
  };
  testCalls: { count: number; included: boolean };
  overview: {
    kpis: IVoiceAnalyticsKpis;
    previousKpis: IVoiceAnalyticsKpis | null;
    overTime: IVoiceAnalyticsDay[];
  };
  audience: {
    locations: IVoiceAnalyticsLocation[];
    locationUnknown: number;
    devices: {
      withDeviceData: number;
      deviceTypes: { desktop: number; mobile: number; tablet: number };
      browsers: IVoiceAnalyticsNamedCount[];
      os: IVoiceAnalyticsNamedCount[];
    };
    sources: IVoiceAnalyticsSource[];
  };
  conversations: {
    recent: IVoiceAnalyticsRecentConversation[];
    callerQuestions: IVoiceAnalyticsCallerQuestion[];
    callerQuestionsScan: { conversations: number; capped: boolean };
  };
  outcomes: {
    leads: { count: number; rate: number; fields: { field: string; count: number }[] };
    handoffs: { count: number; rate: number; reasons: { reason: string; count: number }[] };
    actionItems: {
      conversations: number;
      rate: number;
      recent: { conversationId: string; createdAt: string; item: string }[];
    };
  };
  quality: {
    engagement: EngagementBucket[];
    sentiment: { positive: number; neutral: number; negative: number; unanalyzed: number };
    topTopics: { topic: string; count: number }[];
    endReasons: { reason: string; count: number }[];
    satisfaction: { average: number; count: number } | null;
  };
  whenAndWho: {
    byHour: { hour: number; count: number }[];
    byWeekday: { weekday: number; count: number }[];
    languages: { language: string; count: number }[];
  };
  channel: { web: IVoiceAnalyticsChannelStats; phone: IVoiceAnalyticsChannelStats };
}
