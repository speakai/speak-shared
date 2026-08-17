/**
 * Testing Interfaces
 * Types for the automated agent testing framework
 */

export type TestScenarioCategory =
  | "greeting"
  | "kb_retrieval"
  | "off_topic"
  | "edge_case"
  | "custom";

export type TestRunStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "budget_exceeded";

export type TestRunTrigger =
  | "manual"
  | "kb_update"
  | "instruction_save"
  | "scheduled";

export type ScenarioStatus = "pending" | "running" | "completed" | "skipped";

export type RecommendationType =
  | "instructions"
  | "personality"
  | "kb"
  | "topics_to_avoid"
  | "lexicon"
  | "welcome_message"
  | "response_length";

export type RecommendationSeverity = "high" | "medium" | "low";

export type QuickActionType =
  | "add_to_kb"
  | "patch_instructions"
  | "add_topic_to_avoid"
  | "add_lexicon_term"
  | "update_personality";

/**
 * How a TestCriterion is evaluated. Deterministic types (response_length,
 * regex_match, tool_called) route through code-side checks before the LLM
 * judge runs, eliminating LLM variance for objectively-checkable rules.
 */
export type CriterionType =
  | "llm_judged"        // Default — sent to LLM judge with evaluationPrompt
  | "response_length"   // Deterministic — fails if any agent response exceeds maxWords
  | "regex_match"       // Deterministic — fails if pattern doesn't match (or matches, depending on mustMatch) any agent response
  | "tool_called";      // Deterministic — fails if expectedToolName never appears in transcript toolCalls

export interface TestCriterion {
  criterionId: string;
  name: string;
  evaluationPrompt: string;
  weight: number;
  isCritical: boolean;
  /** Defaults to "llm_judged" when omitted. Existing criteria without a type behave as before. */
  type?: CriterionType;
  /** For type === "response_length". Fails if ANY agent response exceeds this word count. */
  maxWords?: number;
  /** For type === "regex_match". JavaScript regex source (no slashes). */
  regexPattern?: string;
  /** For type === "regex_match". When true (default), at least one agent response must match. When false, no response may match. */
  mustMatch?: boolean;
  /** For type === "tool_called". The tool name to look for in transcript toolCalls. */
  expectedToolName?: string;
}

export interface TestScenario {
  scenarioId: string;
  name: string;
  description?: string;
  userMessages: string[];
  criteria: TestCriterion[];
  category: TestScenarioCategory;
  isEnabled: boolean;
}

export interface TestSuiteConfig {
  suiteId: string;
  agentId: string;
  orgId: string;
  scenarios: TestScenario[];
  maxCostPerRun: number;
  autoRunOnKbUpdate: boolean;
  autoRunOnInstructionSave: boolean;
  scheduledCron: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, any>;
  result: string;
  durationMs: number;
}

export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  passed: boolean;
  reasoning: string;
  weight: number;
}

export interface KbSearchRecord {
  query: string;
  resultCount: number;
  avgScore: number;
  topChunk?: string;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  status: ScenarioStatus;
  passed: boolean;
  score: number;
  criteriaResults: CriterionResult[];
  transcript: Array<{
    role: "user" | "agent";
    content: string;
    toolCalls?: ToolCallRecord[];
  }>;
  kbSearches: KbSearchRecord[];
  costUsd: number;
  durationMs: number;
}

export interface TestRecommendation {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  suggestedFix: string;
  affectedScenarios: string[];
  applied?: boolean;
  appliedAt?: string;
  quickAction?: {
    type: QuickActionType;
    payload: Record<string, any>;
  };
}

export interface TestRunResult {
  runId: string;
  suiteId: string;
  agentId: string;
  orgId: string;
  status: TestRunStatus;
  trigger: TestRunTrigger;
  currentScenarioIndex: number;
  totalScenarios: number;
  scenarioResults: ScenarioResult[];
  overallScore: number;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  isRegression: boolean;
  baselineScore: number | null;
  scoreDelta: number | null;
  recommendations: TestRecommendation[];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  /** Optional human-readable reason when status is "failed" or "budget_exceeded". */
  failureReason?: string | null;
}

export interface TestBaseline {
  agentId: string;
  suiteId: string;
  bestScore: number;
  bestRunId: string;
  scenarioBaselines: Record<string, number>;
  updatedAt: string;
}
