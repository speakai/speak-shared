import {
  IntegrationSlug,
  IntegrationAuthType,
  IntegrationStatus,
  RuleConditionField,
  RuleOperator,
} from "../enums/integration.js";

/**
 * Org-level integration record as returned by the backend `GET /integrations`
 * list endpoint. Represents a single connected (or connecting) integration for
 * the organization — distinct from `ConnectedIntegration`, which is scoped to a
 * specific agent.
 */
export interface OrgIntegration {
  integrationId: string;
  orgId: string;
  slug: IntegrationSlug;
  status: IntegrationStatus;
  /**
   * Provider-side account identifier (Composio connected-account id). Required:
   * uniquely identifies which connected account this org integration maps to,
   * enabling multiple accounts per provider.
   */
  providerAccountId: string;
  /**
   * Best-effort account email. OPTIONAL — Composio's list API does NOT expose
   * the email, so this is frequently absent; the human-facing label is
   * primarily driven by `accountLabel`.
   */
  accountEmail?: string;
  /** User-provided human label distinguishing this account from others on the same provider. */
  accountLabel?: string;
  /** User id of the org member who connected this account. */
  connectedByUserId?: string;
  connectedAt?: string | Date;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * A tool descriptor as returned by the backend `GET /:slug/tools`
 * endpoint. Describes a single callable tool exposed by an integration.
 */
export interface ToolDescriptor {
  toolName: string;
  displayName: string;
  description: string;
  paramsSchema: Record<string, any>;
  destructive: boolean;
  /** Optional icon URL for the tool/provider, surfaced in the picker UI. */
  iconUrl?: string;
}

export interface ConnectedIntegration {
  integrationId: string;
  agentId: string;
  orgId: string;
  slug: IntegrationSlug;
  status: IntegrationStatus;
  config?: Record<string, any>;
  connectedAt?: string;
  lastSyncedAt?: string;
  error?: string | null;
}

/**
 * Describes a single credential field the user must supply when connecting an
 * API-key integration. The backend is the source of truth for these specs
 * (per-provider field names come from the provider's connect-account schema);
 * the client renders a form from `ConnectFieldsResponse.fields`.
 */
export interface CredentialFieldSpec {
  /** Provider-specific field key sent back in `ConnectKeyRequest.fields`. */
  name: string;
  /** Human-facing label for the input. */
  label: string;
  /** Input type — `password` masks the value in the UI. */
  type: "text" | "password";
  required: boolean;
  /** Optional placeholder shown in the empty input. */
  placeholder?: string;
  /** Optional "where do I find this?" help link. */
  helpUrl?: string;
  /** Optional longer-form description / hint for the field. */
  description?: string;
  /** When true, the value is a secret (never echoed back, never logged). */
  secret?: boolean;
}

/**
 * Response shape for `GET /integrations/:slug/connect-fields`. Tells the client
 * which auth flow a provider uses and, for API-key providers, the fields to
 * render in the connect form.
 */
export interface ConnectFieldsResponse {
  slug: IntegrationSlug;
  authType: IntegrationAuthType;
  fields: CredentialFieldSpec[];
}

/**
 * Request body for `POST /integrations/:slug/connect-key`. Maps each
 * `CredentialFieldSpec.name` to the user-entered value. Pass-through only —
 * the secret is never persisted by our backend.
 */
export interface ConnectKeyRequest {
  fields: Record<string, string>;
}

/**
 * Response shape for `POST /integrations/:slug/connect-key`. On success the
 * connected account summary is returned; on failure `reason` carries a
 * machine-readable code (e.g. failed key verification).
 */
export interface ConnectKeyResponse {
  status: "connected" | "failed";
  reason?: string;
  account?: {
    providerAccountId: string;
    status: string;
  };
}

export interface CallSyncPayload {
  conversationId: string;
  agentId: string;
  summary?: string;
  sentiment?: string; // 'positive' | 'neutral' | 'negative'
  transcript: string;
  structuredOutputs: Record<string, any>;
  durationSeconds: number;
  callerPhone?: string;
  [key: string]: any; // allow _ruleAction, _ruleParams spread from rule engine
}

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleOperator;
  value?: string | number;
  outputKey?: string; // only when field = STRUCTURED_OUTPUT
}

export interface RuleAction {
  slug: IntegrationSlug;
  action: string;
  params?: Record<string, any>;
}

export interface AutomationRule {
  ruleId: string;
  agentId: string;
  orgId: string;
  name: string;
  enabled: boolean;
  conditionLogic: "AND" | "OR";
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
}
