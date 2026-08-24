/**
 * Agent Types and Interfaces
 * Client-facing agent contract shared across backend and client.
 *
 * The proprietary agent-generation pipeline types (GenerationMeta/Step/Event,
 * ExtractedInput, InstructionGapSuggestion, GENERATION_STEP_ORDER/_LABELS,
 * PromptQuality, …) and the runtime AgentConfig/WorkerConfig live privately in
 * speak-server (`@speak-voice-generation-internal`) and are intentionally NOT
 * part of this public package.
 */

import {
  AvatarProvider,
  TTSProvider,
  STTProvider,
} from "../enums/providers.js";
import { LLMProvider } from "../../enums/llm.js";
import { AgentStatusType } from "../enums/agent.js";
import { IntegrationSlug } from "../enums/integration.js";
import { AgentTelephonySettings } from "./telephony.js";

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
