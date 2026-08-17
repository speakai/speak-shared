export interface KbGapSuggestion {
  gapId: string;
  agentId: string;
  query: string;
  context: string;
  avgRetrievalScore: number;
  conversationId: string;
  suggestedAnswer: string;
  suggestedTitle: string;
  status: "pending" | "added" | "dismissed";
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt?: string | null;
}

export interface KbGapReport {
  agentId: string;
  gaps: KbGapSuggestion[];
  lastAnalyzedAt: string | null;
  conversationsSampled: number;
}
