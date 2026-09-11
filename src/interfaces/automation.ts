import { WebSearchProvider } from "../enums/automation.js";
import {
  AutomationTrigger,
  AutomationAction,
  AutomationRunType,
  AutomationScheduleTimePeriod,
  AutomationStepType,
  AutomationRunStatus,
  AssistantType,
  AllowedValuesMode,
} from '../enums/index.js';

/** Configuration of a magic-prompt action/step. Shared by the legacy action body and graph steps. */
export interface IAutomationMagicPromptConfig {
  title: string;
  assistantType: AssistantType;
  assistantTemplateId: string;
  prompt: string;
  fieldId?: string;
  fieldIds?: string[];
  isIndividualFolder?: boolean;
  allowedValues?: string[];
  allowedValuesMode?: AllowedValuesMode;
  otherValues?: boolean;
  notApplicableValues?: string;
}

/** Configuration of a translation action/step. */
export interface IAutomationTranslationConfig {
  targetLanguage: string;
}

export interface IAutomationAction {
  type: AutomationAction;
  magicPrompt: IAutomationMagicPromptConfig;
  translation: IAutomationTranslationConfig;
}

/** Configuration of a Composio integration step (reserved for the Composio slice). */
export interface IAutomationComposioConfig {
  app: string;
  action: string;
  connectedAccountId?: string;
  argsTemplate?: Record<string, unknown>;
  destructive?: boolean;
  acknowledged?: boolean;
}

/** A single condition inside a filter step. */
export interface IAutomationFilterRule {
  field: string;
  op: string;
  value?: string | number;
}

/**
 * Per-field value constraint for `field_updated` triggers. When present in
 * `IAutomationTriggerConfig.fieldValueMatches`, the automation fires only when
 * the named field changes to one of the listed values. A field absent from the
 * list matches any value — backward compatible.
 */
export interface IFieldValueMatch {
  fieldId: string;
  values: string[];
}

/**
 * Config of the trigger node (the first step in a graph). All fields are optional:
 * the indexed matching key (`type`, `folderIds`) is stored top-level on the
 * automation, so a stored trigger node typically carries only the descriptor
 * fields (triggerSlug/provider/app/values).
 */
export interface IAutomationTriggerConfig {
  type?: AutomationTrigger;
  folderIds?: string[];
  values?: string[];
  provider?: 'speak' | 'composio';
  app?: string;
  triggerSlug?: string;
  /**
   * Optional per-field value constraints for `field_updated` triggers.
   * Absent / empty = any value fires for all watched fields (backward compatible).
   * Each entry names a watched field id; the automation fires only when that
   * field changes to one of the listed values.
   */
  fieldValueMatches?: IFieldValueMatch[];
}

/** Configuration of a notify step (in-app / email / Slack). `message` is token-templated. */
export interface IAutomationNotifyConfig {
  channel: 'in_app' | 'email' | 'slack';
  target?: string;
  message: string;
}

/**
 * Configuration of an outbound-webhook step. `url`, `headers`, and `bodyTemplate` may carry
 * `{{trigger.payload.*}}` / `{{step.<stepId>.*}}` tokens resolved at runtime.
 */
export interface IAutomationOutboundWebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  bodyTemplate?: string | Record<string, unknown>;
}

/** Configuration of a condition step: evaluates rules and routes down the matching branch. */
export interface IAutomationConditionConfig {
  logic: 'AND' | 'OR';
  rules: IAutomationFilterRule[];
}

/** A node in a graph automation (schemaVersion >= 2). */
/**
 * One source a web search returned. Provider-neutral on purpose: `score` and
 * `publishedAt` are optional because Tavily supplies a relevance score and no date,
 * while Perplexity supplies a date and no score.
 */
export interface IWebSearchSource {
  /** 1-based position in the result set the answer was built from. */
  rank: number;
  title: string;
  url: string;
  /** Host without "www.", denormalised so references can be queried by publisher. */
  domain: string;
  snippet?: string;
  /** Tavily relevance score. Absent for providers that do not rank. */
  score?: number;
  /** Publication date as the provider reported it, unparsed. */
  publishedAt?: string;
}

/**
 * One completed web search. Stored in its own collection, not on the media and not on the
 * run: a run carries a 90 day TTL, and one reference measures 4 KB to 23 KB against a 4 KB
 * average media document.
 *
 * The shape is provider-neutral: everything a provider cannot supply is optional, and
 * nothing in it is Tavily-specific or Perplexity-specific.
 */
export interface IWebSearchReference {
  searchId: string;
  provider: WebSearchProvider;
  /** Which key paid, not reconstructable afterwards. */
  keySource: "company" | "platform";
  /** The query after token and field resolution, not the authored template. */
  query: string;
  /** The condensed answer, matching what was written to the field. */
  answer: string;
  /** Custom field the answer was written to. */
  destinationFieldId: string;
  sources: IWebSearchSource[];
  /** Results the relevance floor removed. Counted, not stored. */
  droppedBelowScore?: number;
  /** Searches the provider actually performed; Perplexity fans out beyond one. */
  searchesPerformed?: number;
  latencyMs?: number;
  /** Provider-reported cost where the provider reports one. */
  costUsd?: number;
  automationId?: string;
  runId?: string;
  stepId?: string;
  createdAt: Date | string;
}

/**
 * WEB_SEARCH step: a Tavily search, an LLM pass over the results, and a write of that
 * answer into `destinationFieldId`, which is required because a search whose answer
 * lands nowhere spends credits for no effect.
 */
export interface IAutomationWebSearchConfig {
  /** Token-templated search query. */
  query: string;
  /** Custom field the condensed answer is written to. */
  destinationFieldId: string;
  /** Which provider runs the search. Absent means Tavily, so saved steps are unaffected. */
  provider?: WebSearchProvider;
  searchDepth?: "ultra-fast" | "fast" | "basic" | "advanced";
  maxResults?: number;
  topic?: "general" | "news";
  timeRange?: "day" | "week" | "month" | "year";
  country?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  /** Ask Tavily for its own answer and pass it to the LLM as a cross-check input. */
  includeAnswer?: boolean | "advanced";
  /** Author override of the condensation instruction. */
  prompt?: string;
  modelId?: string;
  /** Relevance floor; results below it are dropped before the LLM sees them. */
  minScore?: number;
}

export interface IAutomationStep {
  stepId: string;
  stepType: AutomationStepType;
  trigger?: IAutomationTriggerConfig;
  magicPrompt?: IAutomationMagicPromptConfig;
  translation?: IAutomationTranslationConfig;
  composio?: IAutomationComposioConfig;
  notify?: IAutomationNotifyConfig;
  outboundWebhook?: IAutomationOutboundWebhookConfig;
  condition?: IAutomationConditionConfig;
  webSearch?: IAutomationWebSearchConfig;
  filter?: {
    logic: 'AND' | 'OR';
    rules: IAutomationFilterRule[];
  };
  /** Parent step ids (graph edges). A step runs once all dependsOn parents complete. */
  dependsOn?: string[];
  /** For a step reached from a CONDITION parent: which branch of that parent leads here. */
  branch?: 'true' | 'false';
}

export interface IAutomation {
  _id: string;
  automationId: string;
  name: string;
  description: string;
  // 1 = legacy single-action shape (trigger/action), 2 = graph shape (trigger/steps[]).
  schemaVersion?: number;
  isActive: boolean;
  isUpdated: boolean;
  isDeleted: boolean;
  runType: AutomationRunType;
  trigger: {
    type: AutomationTrigger;
    folderIds: string[];
    values: string[];
    provider?: 'speak' | 'composio';
    app?: string;
    triggerSlug?: string;
  };
  // Additional "Or" triggers: the automation enrolls when ANY of `trigger` or these
  // match an event (fired once per event). Absent/empty = single-trigger (today's shape).
  triggers?: IAutomationTriggerConfig[];
  action: IAutomationAction;
  // Graph steps (schemaVersion >= 2). Legacy rows leave this empty and keep using action.
  steps?: IAutomationStep[];
  schedule: {
    timePeriod: AutomationScheduleTimePeriod;
    repeatAt: string;
  };
  actionHistory: {
    type: AutomationAction;
    id: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/** Per-step execution record on a run. */
export interface IAutomationRunStep {
  stepId: string;
  stepType: AutomationStepType;
  status: AutomationRunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  attemptCount?: number;
  /**
   * Executor config (magicPrompt/translation/filter/composio block) snapshotted at
   * run creation, so resuming a deferred step cannot be misaligned by a mid-flight
   * edit to the automation. Absent on runs created before snapshots shipped.
   */
  config?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

/** One document per automation execution (graph engine run ledger). */
export interface IAutomationRun {
  _id: string;
  runId: string;
  automationId: string;
  companyId: string;
  userId: string;
  schemaVersion: number;
  // Composio delivery id only; native runs leave this absent (partial dedup index contract).
  externalEventId?: string;
  status: AutomationRunStatus;
  trigger: {
    source: string;
    mediaId?: string;
    folderId?: string;
    payload?: Record<string, unknown>;
  };
  awaitingMediaId?: string;
  nextStepId?: string;
  /** Run-level failure reason (deferred-seam failures, stale-run sweep). */
  error?: string;
  steps: IAutomationRunStep[];
  createdAt: Date;
  updatedAt: Date;
}
