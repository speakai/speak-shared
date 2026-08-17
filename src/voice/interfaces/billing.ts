/**
 * Billing Interfaces
 * Usage metrics, cost tracking, transaction records, plan configuration,
 * and billing API response shapes.
 */

import {
  TransactionEventType,
  PlanTier,
  SubscriptionStatus,
  BillingCycle,
} from "../enums/billing.js";

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

/* ------------------------------------------------------------------ */
/* Plan configuration (DB-driven — `planconfigs` collection)          */
/* ------------------------------------------------------------------ */

/**
 * Resource caps enforced per plan. `-1` means unlimited.
 */
export interface PlanLimits {
  maxAgents: number;
  maxConversations: number;
  maxMembers: number;
  maxDocuments: number; // max knowledge-base documents per agent; -1 = unlimited
  maxAutomations: number; // max automation rules per org; -1 = unlimited
  maxIntegrationAccounts: number; // max connected integration accounts per org; -1 = unlimited
  maxConcurrentSessions: number; // total concurrent live conversations per org; -1 = unlimited
  maxConcurrentAvatarSessions: number; // concurrent avatar-enabled sessions per org; -1 = unlimited
  maxPhoneNumbers: number; // purchased phone numbers per org; -1 = unlimited
}

/**
 * Feature toggles enforced per plan.
 */
export interface PlanFeatures {
  avatarEnabled: boolean;
  phoneEnabled: boolean;
  apiKeysEnabled: boolean;
  webhooksEnabled: boolean;
  teamInvitesEnabled: boolean;
  analyticsEnabled: boolean;
  instructionImprovementsEnabled: boolean;
  testSuitesEnabled: boolean;
  automationRulesEnabled: boolean;
  byopEnabled: boolean; // bring-your-own-phone-number (separate from buying a number)
}

/**
 * Credit allocation for a plan. 1 credit = $1.
 */
export interface PlanCredits {
  monthlyCreditGrantDollars: number;
  includedCreditsDollars: number;
  trialCreditGrantDollars?: number;
  paygCapOptions: number[];
  paygCapDefault: number;
}

/**
 * Stripe references attached to a plan. Populated by provisioning script.
 */
export interface PlanStripeRefs {
  priceIdMonthly?: string;
  priceIdAnnual?: string;
  overagePriceId?: string;
  meterId?: string;
}

/**
 * Presentation fields used by the pricing page + upgrade CTAs.
 */
export interface PlanDisplay {
  name: string;
  description: string;
  badge?: string;
  priceMonthlyCents?: number | null;
  priceAnnualCents?: number | null;
  annualDiscountPct?: number;
  ctaLabel?: string;
}

/**
 * Copy snippets surfaced in banners, upgrade prompts, and pricing cards.
 */
export interface PlanCopy {
  trialLimitBanner?: string;
  upgradeCta?: string;
  featureListExtra?: string[];
}

/**
 * Contract metadata — only populated on `enterprise-<slug>` PlanConfig docs.
 */
export interface PlanContract {
  mrrCents: number;
  startedAt: string | Date;
  renewsAt: string | Date;
  termMonths: number;
  billingMode: "stripe" | "invoice" | "wire";
  accountManagerId?: string;
  slaLevel?: string;
  notes?: string;
}

/**
 * Full PlanConfig document shape (DB: `planconfigs`).
 * The `key` is the unique slug (e.g. `trial`, `team`, `enterprise`, `enterprise-acme`).
 */
export interface PlanConfig {
  key: string;
  tier: PlanTier;
  active: boolean;
  trialDays?: number;
  display: PlanDisplay;
  limits: PlanLimits;
  features: PlanFeatures;
  credits: PlanCredits;
  stripe: PlanStripeRefs;
  copy: PlanCopy;
  contract?: PlanContract;
  isDeleted: boolean;
  deletedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ------------------------------------------------------------------ */
/* Organization sub-objects — nested groups on the Organization doc   */
/* ------------------------------------------------------------------ */

/**
 * Subscription state block nested under Organization.subscription.
 */
export interface OrgSubscription {
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialEndsAt?: string | Date;
  currentPeriodStart?: string | Date;
  currentPeriodEnd?: string | Date;
  cancelScheduledAt?: string | Date;
  /**
   * Timestamp the subscription first entered a failed-payment state.
   * Backend stamps this when Stripe reports `past_due` and clears it
   * (to `null`) on payment recovery. Absent when never in dunning.
   */
  paymentFailedAt?: string | Date | null;
}

/**
 * Stripe identifiers block nested under Organization.stripe.
 */
export interface OrgStripe {
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  overagePriceItemId?: string;
}

/**
 * Billing counters block nested under Organization.billing.
 */
export interface OrgBilling {
  monthlyCreditGrantDollars: number;
  creditsUsedThisPeriod: number;
  paygCapDollars: number;
}

/* ------------------------------------------------------------------ */
/* API response shapes — single source of truth for BE + FE           */
/* ------------------------------------------------------------------ */

/**
 * PUBLIC (unauth) response shape for `GET /api/plans`.
 * Redacts Stripe refs, contract details, and soft-delete bookkeeping.
 */
export interface PublicPlanListResponse {
  plans: Array<Omit<PlanConfig, "stripe" | "contract" | "isDeleted" | "deletedAt">>;
}

/**
 * Response shape for `GET /api/billing/plan-status`.
 * Both backend and client import this so contract drift is a build error.
 */
export interface PlanStatusResponse {
  planTier: PlanTier;
  planConfigKey: string;
  planConfig: Omit<PlanConfig, "stripe" | "contract" | "isDeleted" | "deletedAt">;
  subscription: OrgSubscription;
  billing: OrgBilling;
  creditsBalance: number;
}
