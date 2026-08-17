/**
 * Agent Types and Interfaces
 * Shared across backend, worker, and client
 */

import {
  AvatarProvider,
  TTSProvider,
  LLMProvider,
  STTProvider,
} from "../enums/providers.js";
import { AgentStatusType } from "../enums/agent.js";
import { IntegrationSlug } from "../enums/integration.js";
import { AgentTelephonySettings } from "./telephony.js";
import { ResolvedDataCollectionField } from "./dataCollection.js";
import { DemoConfig } from "./prospect.js";

/**
 * Pronunciation rule for TTS providers that support pronunciation dictionaries
 * (currently ElevenLabs). `term` is the input text to match; `pronounceAs` is the
 * alias the TTS should speak instead.
 */
export interface PronunciationRule {
  term: string;
  pronounceAs: string;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  type?: "alias" | "phoneme";
  alphabet?: "cmu-arpabet";
}

export type PronunciationAlphabet = "cmu-arpabet" | "respelling";

export type PronunciationSyncStatus = "synced" | "unsynced" | "failed" | "not_applicable";

export interface PronunciationSuggestion {
  phonemes: string;
  syllable_breakdown: string;
  confidence: "high" | "medium" | "low";
}

export interface PronunciationSuggestionInput {
  term: string;
  alphabet: PronunciationAlphabet;
  hint?: string;
}

export interface PronunciationData {
  rules: PronunciationRule[];
  syncStatus: PronunciationSyncStatus;
  syncedAt?: string;
  elevenLabsDictId?: string;
  elevenLabsVersionId?: string;
}

/**
 * Widget configuration for embedded agents
 */
export interface WidgetConfig {
  displayMode?: "floating" | "inline";
  position?: "bottom-left" | "bottom-right";
  bubbleIconType?: "avatar" | "generic";
  buttonSize?: "small" | "medium" | "large";
  buttonColor?: string;
  theme?: "light" | "dark" | "auto";
  compactMode?: boolean;
  defaultMode?: "voice" | "avatar";
  showAvatar?: boolean;
  voiceEnabled?: boolean;
  fontFamily?: string; // One of: "system","Inter","DM Sans","Plus Jakarta Sans","Roboto","Open Sans","Lato","Poppins","Nunito"
  borderRadius?: number; // 0-24, default 12
  backgroundColor?: string; // Widget background override
  enableUserCamera?: boolean; // Enable user's camera capture (default: false)
  /** When true, the chat panel opens automatically once the agent joins the conversation. Defaults to false. */
  chatOpenByDefault?: boolean;
  language?: string;
  companyLogoUrl?: string;

  // Launcher greeting (shown beside the floating bubble; floating mode only)
  /** Launcher greeting title beside the bubble. Default: "👋 Hi! Want to chat?" */
  launcherTitle?: string;
  /** Launcher greeting subtitle beside the bubble. Default: "Start a conversation" */
  launcherSubtitle?: string;
  /** Whether the launcher greeting is shown (floating mode only). Default: true */
  showLauncher?: boolean;

  // Before-call screen (in-widget, pre-start)
  /** Title on the pre-start screen. Default: "Ready to start" */
  beforeCallTitle?: string;
  /** Description on the pre-start screen. Default: "Tap below to start a quick conversation." */
  beforeCallDescription?: string;
  /** Label for the start button. Default: "Start conversation" */
  startButtonLabel?: string;

  // After-call screen (in-widget, post-end)
  /** Title on the post-end screen. Default: "Thanks for chatting" */
  afterCallTitle?: string;
  /** Description on the post-end screen. Default: "We hope it was useful." */
  afterCallDescription?: string;

  // Feedback collection
  /** When true, show the post-call feedback card (stars + comment). Default: false */
  feedbackEnabled?: boolean;
}

/** Subset of WidgetConfig for API update payloads (partial updates) */
export type WidgetConfigUpdate = Partial<WidgetConfig>;

/**
 * Agent share settings
 */
export interface AgentShareSettings {
  isPublic: boolean;
  shareToken?: string;
  shortCode?: string;
  allowedDomains: string[];
  expiresAt?: string;
  widgetConfig?: WidgetConfig;
}

/**
 * A single Composio tool selected for an agent.
 *
 * The tool's JSON Schema (`paramsSchema`) is persisted at pick-time so the
 * worker/dispatcher can register the live LiveKit tool without making a
 * Composio API call. Connections are ORG-scoped (D3): `slug` references an
 * org-connected app, and `toolName` is the specific Composio tool slug on
 * that app.
 */
export interface AgentSelectedTool {
  /** The org-connected Composio app this tool belongs to (e.g. IntegrationSlug.GMAIL). */
  slug: IntegrationSlug;
  /** Composio tool slug, e.g. "GMAIL_SEND_EMAIL". */
  toolName: string;
  /** Human-readable label shown in the UI. */
  displayName: string;
  /** The tool's JSON Schema, persisted at pick-time so the worker needs no Composio call. */
  paramsSchema: Record<string, any>;
  /** When true, the agent must confirm with the user before invoking (drives the confirm gate). */
  destructive?: boolean;
  /**
   * Provider-side account id (Composio connected-account id) this tool is bound
   * to. Optional for backwards compatibility; pins the tool to a specific
   * connected account when multiple accounts exist for the same provider.
   */
  providerAccountId?: string;
  /** Best-effort account email for the bound account (display only; may be absent). */
  accountEmail?: string;
}

/**
 * Full Agent entity (for client/frontend use)
 */
export interface Agent {
  agentId: string;
  userId: string;
  name: string;
  avatar: {
    avatarId?: string;
    avatarUrl?: string;
    provider?: AvatarProvider;
    tavusFaceId?: string;
    tavusPalId?: string;
  };
  voice: {
    provider: TTSProvider;
    voiceId: string;
    model?: string;
    pronunciationRules?: PronunciationRule[];
    elevenLabsDictId?: string;
    elevenLabsVersionId?: string;
    pronunciationSyncedAt?: string;
    /**
     * Set to `true` when the most recent ElevenLabs sync attempt failed. The
     * UI uses this to show a persistent "Sync failed" banner across page
     * reloads. Cleared on the next successful sync or when rules are cleared.
     */
    pronunciationSyncFailed?: boolean;
  };
  stt: {
    provider: STTProvider;
    model?: string;
    lexiconTerms?: string[];
  };
  llm: {
    provider: LLMProvider;
    model?: string;
  };
  personality: string;
  instructions: string;

  chatSettings: {
    welcomeMessage: string;
    conversationStarters: string[];
    maxResponseLength?: number;
    topicsToAvoid: string[];
    maxSessionLength: number;
    language: string;
  };
  knowledgeBaseId?: string;
  creativityLevel: number;
  conversationMode: "voice" | "avatar";
  recordingEnabled?: boolean;
  status: AgentStatusType;
  shareSettings: AgentShareSettings;
  structuredOutputIds?: string[];
  telephony?: AgentTelephonySettings;
  demoConfig?: DemoConfig;
  generation?: GenerationMeta;
  conversationCount?: number;
  websiteUrl?: string;
  enableWebSearch?: boolean;
  /** Composio tools (max 3) selected for this agent; enforced backend-side. */
  selectedTools?: AgentSelectedTool[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a new agent
 */
export interface CreateAgentRequest {
  name: string;
  avatar?: {
    avatarId?: string;
    avatarUrl?: string;
    provider?: AvatarProvider;
    tavusFaceId?: string;
    tavusPalId?: string;
  };
  voice: {
    provider: TTSProvider;
    voiceId: string;
    model?: string;
  };
  stt?: {
    provider: STTProvider;
    model?: string;
  };
  llm?: {
    provider: LLMProvider;
    model?: string;
  };
  personality: string;
  instructions: string;
  chatSettings: {
    welcomeMessage: string;
    conversationStarters: string[];
    maxResponseLength?: number;
    topicsToAvoid: string[];
    maxSessionLength: number;
    language: string;
  };
  creativityLevel: number;
}

/**
 * AI Agent Generation Types
 */

export type GenerationStepStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped";
export type GenerationStatus =
  | "extracting"
  | "awaiting_followup"
  | "awaiting_page_selection"
  | "generating"
  | "ready"
  | null;

export interface ExtractedPage {
  url: string;
  title?: string;
  /** URL category assigned by classifyUrl() — e.g. "services", "pricing", "about" */
  bucket?: string;
  score?: number;
}
export type GenerationMode =
  | "ai-generate"
  | "ai-template-hybrid"
  | "template"
  | "manual";
export type PromptQuality = "rich" | "adequate" | "vague";

export interface ExtractedInput {
  companyName: string | null;
  agentName: string | null;
  industry: string | null;
  useCase: string | null;
  targetAudience: string | null;
  // primaryGoal?: string | null;
  // relationshipStyle?: string | null;
  // interactionSetting?: string | null;
  websiteUrl: string | null;
  wantsFileUpload: boolean;
  brandColors: string[] | null;
  logoUrl: string | null;
  toneHints: string[] | null;
  // formalityLevel?: string | null;
  // emotionalStyle?: string | null;
  // handoffPreference?: string | null;
  // forbiddenClaims?: string[] | null;
  language: string | null;
  voicePreference: string | null;
  promptQuality: PromptQuality;
  instructionAnchors?: string[];
}

export interface GenerationStep {
  status: GenerationStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  detail: string | null;
}

/** Ordered step keys for the AI generation pipeline. */
export const GENERATION_STEP_ORDER = [
  "extract",
  "scrape",
  "brand",
  "generate",
  "config",
  "kb",
] as const;
export type GenerationStepKey = (typeof GENERATION_STEP_ORDER)[number];

/** Canonical display labels for each pipeline step (used in admin UI). */
export const GENERATION_STEP_LABELS: Record<GenerationStepKey, string> = {
  extract: "Extract",
  scrape: "Scrape",
  brand: "Brand",
  generate: "Generate",
  config: "Config",
  kb: "Knowledge Base",
};

/** A single instruction gap suggestion produced by analyzeInstructionGaps() */
export interface InstructionGapSuggestion {
  /** Index into instructionAnchors[] if this gap maps to a specific anchor */
  anchorIndex?: number;
  /** One sentence describing the gap (e.g. "Agent is not collecting caller email before ending calls") */
  description: string;
  /** Prose paragraph written in the same style as the existing instructions; appended verbatim on apply */
  suggestedPatch: string;
  /** Section heading in the current instructions after which to insert the patch; append to end if omitted */
  insertAfterSection?: string;
  severity: "low" | "medium" | "high";
  /** Number of conversation summaries sampled when gap was detected */
  conversationSampleCount: number;
  createdAt: string;
  appliedAt?: string | null;
  dismissedAt?: string | null;
}

export interface GenerationMeta {
  status: GenerationStatus;
  mode: GenerationMode;
  originalPrompt: string | null;
  /** Optional explicit behavioral rules/constraints the user provided at creation time */
  manualInstructions?: string | null;
  followUpQuestion: string | null;
  /** All follow-up submissions in order */
  followUpHistory: string[];
  /** Explicit behavioral rules extracted from originalPrompt + manualInstructions + follow-ups */
  instructionAnchors?: string[];
  /** Pending gap suggestions from analyzeInstructionGaps() */
  instructionGapSuggestions?: InstructionGapSuggestion[];
  /** Timestamp of last gap analysis run (auto or on-demand) */
  lastGapAnalysisAt?: string | null;
  extracted: ExtractedInput | null;
  extractedPages?: ExtractedPage[];
  steps: {
    extract: GenerationStep;
    scrape: GenerationStep;
    brand: GenerationStep;
    generate: GenerationStep;
    config: GenerationStep;
    kb: GenerationStep;
  };
  fieldsEditedByUser: string[];
  totalDurationMs: number | null;
  createdAt: string | null;
}

/** SSE event emitted during agent generation */
export interface GenerationEvent {
  step: string;
  status?: GenerationStepStatus;
  detail?: string;
  data?: any;
  question?: string;
  pages?: ExtractedPage[];
  agentPreview?: Partial<Agent>;
}

export interface AgentResource {
  resourceId: string;
  agentId: string;
  organizationId: string;
  url: string;
  title: string;
  description: string;
  action: "link" | "presentation";
  contentType?: "video" | "pdf" | "image";
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AgentConfig {
  agentId: string;
  userId: string;
  orgId: string;
  name: string;
  instructions: string;
  personality: string;
  avatar: {
    avatarId?: string;
    avatarUrl?: string;
    provider?: AvatarProvider;
    tavusFaceId?: string;
    tavusPalId?: string;
  };
  voice: {
    provider: TTSProvider;
    voiceId: string;
    model?: string;
    pronunciationRules?: PronunciationRule[];
    elevenLabsDictId?: string;
    elevenLabsVersionId?: string;
    pronunciationSyncedAt?: string;
    /**
     * Set to `true` when the most recent ElevenLabs sync attempt failed.
     * Mirrors `Agent.voice.pronunciationSyncFailed` so the worker/backend
     * can read and report sync state from the dispatched config. Cleared
     * on the next successful sync or when rules are cleared.
     */
    pronunciationSyncFailed?: boolean;
  };
  stt: {
    provider: STTProvider;
    model?: string;
    lexiconTerms?: string[];
  };
  llm: {
    provider: LLMProvider;
    model?: string;
  };
  chatSettings: {
    welcomeMessage: string;
    maxSessionLength: number;
    maxResponseLength?: number;
    topicsToAvoid?: string[];
    language: string;
  };
  knowledgeBase?: {
    hasEmbeddings: boolean;
    creativityLevel: number;
  };
  creativityLevel: number;
  recordingEnabled?: boolean;
  conversationMode?: "voice" | "avatar";
  telephony?: AgentTelephonySettings;
  resources?: AgentResource[];
  websiteUrl?: string;
  enableWebSearch?: boolean;
  /** Composio tools (max 3) selected for this agent; enforced backend-side. */
  selectedTools?: AgentSelectedTool[];
}

/**
 * WorkerConfig — everything the worker needs, bundled for room metadata transport.
 * Serialized into LiveKit room metadata at room creation so the worker can read
 * it at +0ms instead of making HTTP round-trips.
 */
export interface WorkerConfig {
  agentConfig: AgentConfig;
  dataCollectionFields: ResolvedDataCollectionField[];
}
