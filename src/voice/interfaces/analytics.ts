/**
 * Analytics Interfaces
 * Dashboard and reporting aggregations
 */

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
