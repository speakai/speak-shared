/**
 * Canonical LLM model registry — ONE entry per model, holding every fact any consumer
 * needs about it.
 *
 * Before this file, a model's facts were spread across seven places: the `LLMModels` enum,
 * `MODEL_PRICING` here in shared, and `CHAT_MODELS`, `MODEL_MAX_OUTPUT`, `MODALITY_RATES`,
 * the prefix-matching capability helpers and the BYOK/OpenRouter mappings in speak-server.
 * Adding a model meant remembering all seven; missing one mispriced media turns (~3x, via
 * the "dearest known rates" fallback) or silently capped a Gemini model at Anthropic's
 * output budget. Deprecating a model had no mechanism at all — only a `// Deprecated`
 * comment and absence from an array.
 *
 * Every one of those tables is now a projection of this registry. Nothing here is derived
 * from a model id's SHAPE: the string prefixes (`startsWith('claude')`, `startsWith('gpt')`,
 * `startsWith('gemini-2.5')`) that encoded routing, capability and family are replaced by
 * declared fields, so a model whose id does not follow the house naming pattern cannot be
 * silently misrouted.
 *
 * Adding a model: add one entry. The invariants test fails on an incomplete one.
 * Deprecating a model: set `status` and `replacedBy`. Every consumer follows.
 */
import { LLMModels, LLMProvider } from "../enums/llm.js";
import type { ModelPricing, ModalityRates } from "./types.js";

/**
 * Lifecycle of a model in our catalog. Three states, not a boolean: a boolean cannot
 * express `claude-2`, which is still stored on ~21 company documents and must still price
 * correctly for historical rows, but must never be sent to Anthropic again.
 *
 * - `live`       — offered in the picker, dispatchable.
 * - `deprecated` — not offered, still dispatchable for chats already pinned to it.
 * - `retired`    — never dispatched; the resolver always substitutes `replacedBy`.
 *
 * Pricing is retained for all three, so a stored id on an old row still bills correctly.
 * This is deliberate: retire from the offered catalog, never remove from the enum.
 */
export type ModelStatus = "live" | "deprecated" | "retired";

/**
 * Model family — what the `startsWith` chains were really asking. Distinct from `provider`,
 * which is how the model is REACHED: Grok is family `grok`, provider `openrouter`.
 */
export type ModelFamily = "gpt" | "claude" | "gemini" | "grok" | "glm";

/**
 * Which BYOK key can serve this model. Mirrors `AIProviderName` in speak-server; Gemini is
 * `undefined` because only a customer's own Vertex project makes a Gemini call BYOK, which
 * is a per-request fact rather than a property of the model.
 */
export type ByokProvider = "anthropic" | "openai" | "openrouter";

/** What a model can do. Replaces the prefix-matching helpers in `modelCapabilities.ts`. */
export interface ModelCapabilities {
  /** Native reasoning/thinking support. */
  thinking: boolean;
  /**
   * Rejects the legacy `thinking: { type: 'enabled', budget_tokens }` shape with a 400 and
   * requires `{ type: 'adaptive' }`. Anthropic removed `budget_tokens` on Opus 4.7+ and the
   * Fable/Mythos 5 families; Opus 4.6 and Sonnet 4.6 still accept the legacy shape.
   */
  adaptiveThinking: boolean;
  /** Accepts image input on the OpenRouter driver. Other providers gate vision themselves. */
  vision: boolean;
  /**
   * Accepts a custom `temperature`. OpenAI reasoning models (GPT-5 family, o-series) reject
   * any non-default value with a 400.
   */
  customTemperature: boolean;
  /**
   * Accepts audio and video parts natively. The replacement for `!startsWith('gemini')` in
   * `requiresGeminiForMedia`: a turn carrying audio or video must route to a model with this
   * flag, because the other drivers SKIP parts they cannot represent and answer from the
   * text alone, which looks like a real answer. Images are universal and never force a
   * re-route.
   */
  nativeAudioVideo: boolean;
}

export interface ModelDefinition {
  id: LLMModels;
  /** Display name for the picker. NEVER routed on — see `provider` and `family`. */
  label: string;
  /** How the model is reached. The single provider vocabulary. */
  provider: LLMProvider;
  family: ModelFamily;
  status: ModelStatus;
  /**
   * Where a `deprecated`/`retired` id resolves to. Required for both, because the
   * alternative — falling back to the family default — is exactly the collapsing behaviour
   * that funnelled every Claude workspace onto one model and tripped Anthropic's org rate
   * limit. It also flattens tiers: retiring Opus 4.8 ($5/$25) onto a family default of
   * Sonnet 5 ($3/$15) silently moves a customer off the tier they chose.
   *
   * Points at the nearest live model of the same family and tier. Where no such model
   * exists the entry says so in a comment rather than pretending the mapping is clean.
   */
  replacedBy?: LLMModels;
  /** Shown in the chat model picker. Only ever true for `status: 'live'`. */
  offeredInChat: boolean;
  /**
   * Position in the picker, ascending. Explicit rather than implied by array position
   * because it carries meaning the array cannot: the LOWEST value is the catalog default for
   * a company that has resolved none, so a reordering of this file must not silently change
   * which model new workspaces land on. Set if and only if `offeredInChat`.
   */
  chatOrder?: number;
  /** Gated behind a paid plan when offered in chat. */
  premium: boolean;
  pricing: ModelPricing;
  /** Per-second media rates. Required for any model that can serve a media turn. */
  modality?: ModalityRates;
  maxOutputTokens: number;
  capabilities: ModelCapabilities;
  byokProvider?: ByokProvider;
  /** How OpenRouter addresses a model we can also reach directly. */
  openRouterSlug?: string;
}

/**
 * Uniform output-token cap. Must stay <= 21,333: the Anthropic SDK throws "Streaming is
 * required for operations that may take longer than 10 minutes" on non-streaming requests
 * where (60*60*max_tokens)/128000 > 600s.
 */
export const MAX_OUTPUT_TOKENS = 14_500;

/**
 * Gemini is not bound by the Anthropic streaming constraint and its 2.5 thinking models bill
 * thinking against the output budget. A budget sized for Anthropic starves the answer when
 * thinking is large (the empty-answer bug), so Gemini gets headroom for thinking and the
 * answer together. 49,152 sits under Gemini 2.5 Flash's 65,536 hard output cap with margin.
 */
export const GEMINI_MAX_OUTPUT_TOKENS = 49_152;

/** OpenRouter (Grok / GLM) is not bound by the Anthropic constraint either. */
export const OPENROUTER_MAX_OUTPUT_TOKENS = 16_384;

// Capability presets. Spelled out rather than computed so an entry reads as a declaration.
const NO_CAPS: ModelCapabilities = {
  thinking: false,
  adaptiveThinking: false,
  vision: false,
  customTemperature: true,
  nativeAudioVideo: false,
};
const GPT_LEGACY: ModelCapabilities = { ...NO_CAPS };
/** GPT-5 family: reasoning, and rejects a custom temperature. */
const GPT_5: ModelCapabilities = { ...NO_CAPS, thinking: true, customTemperature: false };
const CLAUDE_LEGACY: ModelCapabilities = { ...NO_CAPS };
/** Claude 4.x: thinking with the legacy `budget_tokens` shape. */
const CLAUDE_4: ModelCapabilities = { ...NO_CAPS, thinking: true };
/** Claude that requires `thinking: { type: 'adaptive' }`. */
const CLAUDE_ADAPTIVE: ModelCapabilities = { ...NO_CAPS, thinking: true, adaptiveThinking: true };
/** Gemini before 2.5: multimodal, no native thinking control. */
const GEMINI_LEGACY: ModelCapabilities = { ...NO_CAPS, nativeAudioVideo: true };
/** Gemini 2.5+ and 3.x: multimodal with thinking. */
const GEMINI_THINKING: ModelCapabilities = { ...NO_CAPS, thinking: true, nativeAudioVideo: true };

/**
 * The registry. Ordered by provider, then by lifecycle (retired, deprecated, live) so the
 * currently-offered models read together at the end of each block.
 *
 * `status` classification rule, applied consistently:
 *   - in `CHAT_MODELS` today                  -> live
 *   - dispatchable but not offered in the UI  -> deprecated
 *   - provider no longer serves the id        -> retired
 */
export const MODEL_REGISTRY: readonly ModelDefinition[] = [
  // ═══════════════════════════ OpenAI ═══════════════════════════
  {
    id: LLMModels.GPT_3_5,
    label: "GPT-3.5",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_3_5_TURBO_16K,
    label: "GPT-3.5 Turbo 16k",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 3, outputPerMillion: 4, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_3_5_TURBO_0125,
    label: "GPT-3.5 Turbo",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4,
    label: "GPT-4",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 30, outputPerMillion: 60, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_1106_PREVIEW,
    label: "GPT-4 Turbo Preview",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_TURBO,
    label: "GPT-4 Turbo",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 10, outputPerMillion: 30, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_O_2024_05_13,
    label: "GPT-4o (2024-05-13)",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "retired",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 5, outputPerMillion: 15, provider: LLMProvider.OPENAI },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4O,
    label: "GPT-4o",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 10,
      cachedInputPerMillion: 1.25,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4O_MINI,
    label: "GPT-4o mini",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_O_2024_08_06,
    label: "GPT-4o (2024-08-06)",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 10,
      cachedInputPerMillion: 1.25,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_MINI_2024_07_18,
    label: "GPT-4o mini (2024-07-18)",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_4_1_2025_04_14,
    label: "GPT-4.1",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 2,
      outputPerMillion: 8,
      cachedInputPerMillion: 0.5,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_LEGACY,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_1_2025_11_13,
    label: "GPT-5.1",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 1.25,
      outputPerMillion: 10,
      cachedInputPerMillion: 0.125,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_2,
    label: "GPT-5.2",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 1.75,
      outputPerMillion: 14,
      cachedInputPerMillion: 0.175,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_4,
    label: "GPT-5.4",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.25,
      longContextThresholdTokens: 272000,
      inputPerMillionLong: 5,
      outputPerMillionLong: 22.5,
      cachedInputPerMillionLong: 0.5,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_4_MINI,
    label: "GPT-5.4 mini",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 0.75,
      outputPerMillion: 4.5,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_4_NANO,
    label: "GPT-5.4 nano",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.2,
      outputPerMillion: 1.25,
      cachedInputPerMillion: 0.02,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    // gpt-5.5 reasoning mode — same rate card as gpt-5.5.
    id: LLMModels.GPT_5_5_THINKING,
    label: "GPT-5.5 Thinking",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 5,
      outputPerMillion: 30,
      cachedInputPerMillion: 0.5,
      longContextThresholdTokens: 272000,
      inputPerMillionLong: 10,
      outputPerMillionLong: 45,
      cachedInputPerMillionLong: 1,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_6_LUNA,
    label: "GPT-5.6 Luna",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "deprecated",
    replacedBy: LLMModels.GPT_5_4_MINI_2026_03_17,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 1,
      outputPerMillion: 6,
      cachedInputPerMillion: 0.1,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
  },
  {
    id: LLMModels.GPT_5_4_MINI_2026_03_17,
    label: "GPT-5.4 mini",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "live",
    offeredInChat: true,
    chatOrder: 7,
    premium: true,
    pricing: {
      inputPerMillion: 0.75,
      outputPerMillion: 4.5,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
    openRouterSlug: "openai/gpt-5.4-mini",
  },
  {
    id: LLMModels.GPT_5_5,
    label: "GPT-5.5",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "live",
    offeredInChat: true,
    chatOrder: 6,
    premium: true,
    pricing: {
      inputPerMillion: 5,
      outputPerMillion: 30,
      cachedInputPerMillion: 0.5,
      longContextThresholdTokens: 272000,
      inputPerMillionLong: 10,
      outputPerMillionLong: 45,
      cachedInputPerMillionLong: 1,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
    openRouterSlug: "openai/gpt-5.5",
  },
  {
    id: LLMModels.GPT_5_6_SOL,
    label: "GPT-5.6 Sol",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "live",
    offeredInChat: true,
    chatOrder: 5,
    premium: true,
    pricing: {
      inputPerMillion: 5,
      outputPerMillion: 30,
      cachedInputPerMillion: 0.5,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
    openRouterSlug: "openai/gpt-5.6-sol",
  },
  {
    id: LLMModels.GPT_5_6_TERRA,
    label: "GPT-5.6 Terra",
    provider: LLMProvider.OPENAI,
    family: "gpt",
    status: "live",
    offeredInChat: true,
    chatOrder: 4,
    premium: true,
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.25,
      provider: LLMProvider.OPENAI,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GPT_5,
    byokProvider: "openai",
    openRouterSlug: "openai/gpt-5.6-terra",
  },

  // ═════════════════════ Anthropic (cache read = 0.1x input) ═════════════════════
  {
    id: LLMModels.CLAUDE_2,
    label: "Claude 2",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    // Still stored on ~21 company documents. PR #4338 had to special-case this id by hand;
    // `retired` is that special case, declared once.
    status: "retired",
    replacedBy: LLMModels.CLAUDE_SONNET_5,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 8, outputPerMillion: 24, provider: LLMProvider.ANTHROPIC },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_LEGACY,
    byokProvider: "anthropic",
  },
  {
    id: LLMModels.CLAUDE_3_5_SONNET,
    label: "Claude 3.5 Sonnet",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "retired",
    replacedBy: LLMModels.CLAUDE_SONNET_5,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.3,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_LEGACY,
    byokProvider: "anthropic",
  },
  {
    id: LLMModels.CLAUDE_3_5_SONNET_20241022,
    label: "Claude 3.5 Sonnet (2024-10-22)",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "retired",
    replacedBy: LLMModels.CLAUDE_SONNET_5,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.3,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_LEGACY,
    byokProvider: "anthropic",
  },
  {
    id: LLMModels.CLAUDE_3_7_SONNET_LATEST,
    label: "Claude 3.7 Sonnet",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "retired",
    replacedBy: LLMModels.CLAUDE_SONNET_5,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.3,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_LEGACY,
    byokProvider: "anthropic",
  },
  {
    id: LLMModels.CLAUDE_HAIKU_4_5,
    label: "Claude Haiku 4.5",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "deprecated",
    // No cheap-tier Claude is currently offered, so this is a tier-up rather than a like-for-
    // like swap. Revisit when a Haiku 5 lands in the catalog.
    replacedBy: LLMModels.CLAUDE_SONNET_5,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 1,
      outputPerMillion: 5,
      cachedInputPerMillion: 0.1,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Anthropic supports extended thinking on Haiku 4.5, but we have never enabled it: the
    // prefix chain this registry replaces matched only sonnet-4/sonnet-5/opus-4, so Haiku has
    // always run without it. Encoded as-is to keep this change inert; turning it on is a
    // deliberate decision, not a side effect of a refactor.
    capabilities: { ...CLAUDE_4, thinking: false },
    byokProvider: "anthropic",
  },
  {
    id: LLMModels.CLAUDE_SONNET_4_6,
    label: "Claude Sonnet 4.6",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "live",
    offeredInChat: true,
    chatOrder: 10,
    premium: true,
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.3,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_4,
    byokProvider: "anthropic",
    openRouterSlug: "anthropic/claude-sonnet-4.6",
  },
  {
    id: LLMModels.CLAUDE_SONNET_5,
    label: "Claude Sonnet 5",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "live",
    offeredInChat: true,
    chatOrder: 8,
    premium: true,
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cachedInputPerMillion: 0.3,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_ADAPTIVE,
    byokProvider: "anthropic",
    openRouterSlug: "anthropic/claude-sonnet-5",
  },
  {
    id: LLMModels.CLAUDE_OPUS_4_8,
    label: "Claude Opus 4.8",
    provider: LLMProvider.ANTHROPIC,
    family: "claude",
    status: "live",
    offeredInChat: true,
    chatOrder: 9,
    premium: true,
    pricing: {
      inputPerMillion: 5,
      outputPerMillion: 25,
      cachedInputPerMillion: 0.5,
      provider: LLMProvider.ANTHROPIC,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: CLAUDE_ADAPTIVE,
    byokProvider: "anthropic",
    openRouterSlug: "anthropic/claude-opus-4.8",
  },

  // ═══════════════════════════ Google Gemini ═══════════════════════════
  {
    id: LLMModels.GEMINI_1_5_PRO,
    label: "Gemini 1.5 Pro",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "retired",
    // No Pro-tier Gemini is currently offered in chat; 3.8 Flash is the strongest live
    // Gemini. Revisit if a Pro model returns to the catalog.
    replacedBy: LLMModels.GEMINI_3_8_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 1.25, outputPerMillion: 5, provider: LLMProvider.GOOGLE },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_LEGACY,
  },
  {
    id: LLMModels.GEMINI_1_5_FLASH,
    label: "Gemini 1.5 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "retired",
    replacedBy: LLMModels.GEMINI_3_7_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
      cachedInputPerMillion: 0.01875,
      provider: LLMProvider.GOOGLE,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_LEGACY,
  },
  {
    id: LLMModels.GEMINI_2_0_FLASH,
    label: "Gemini 2.0 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "retired",
    replacedBy: LLMModels.GEMINI_3_7_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.1,
      outputPerMillion: 0.4,
      cachedInputPerMillion: 0.025,
      provider: LLMProvider.GOOGLE,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_LEGACY,
  },
  {
    id: LLMModels.GEMINI_2_5_FLASH,
    label: "Gemini 2.5 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "deprecated",
    replacedBy: LLMModels.GEMINI_3_7_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.3,
      outputPerMillion: 2.5,
      cachedInputPerMillion: 0.03,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 1.0, videoPerMillion: 0.3 },
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
  },
  {
    id: LLMModels.GEMINI_2_5_PRO,
    label: "Gemini 2.5 Pro",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "deprecated",
    replacedBy: LLMModels.GEMINI_3_8_FLASH,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 1.25,
      outputPerMillion: 10,
      longContextThresholdTokens: 200000,
      inputPerMillionLong: 2.5,
      outputPerMillionLong: 15,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 1.25, videoPerMillion: 1.25 },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
  },
  {
    id: LLMModels.GEMINI_2_5_FLASH_LITE,
    label: "Gemini 2.5 Flash Lite",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "deprecated",
    replacedBy: LLMModels.GEMINI_3_7_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: {
      inputPerMillion: 0.1,
      outputPerMillion: 0.4,
      cachedInputPerMillion: 0.01,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 0.3, videoPerMillion: 0.1 },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
  },
  {
    id: LLMModels.GEMINI_3_1_FLASH_LITE,
    label: "Gemini 3.1 Flash Lite",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "deprecated",
    replacedBy: LLMModels.GEMINI_3_7_FLASH,
    offeredInChat: false,
    premium: false,
    pricing: { inputPerMillion: 0.25, outputPerMillion: 1.5, provider: LLMProvider.GOOGLE },
    modality: { audioPerMillion: 0.5, videoPerMillion: 0.25 },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
  },
  {
    id: LLMModels.GEMINI_3_1_PRO_PREVIEW,
    label: "Gemini 3.1 Pro",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "deprecated",
    replacedBy: LLMModels.GEMINI_3_8_FLASH,
    offeredInChat: false,
    premium: true,
    pricing: {
      inputPerMillion: 2,
      outputPerMillion: 12,
      longContextThresholdTokens: 200000,
      inputPerMillionLong: 4,
      outputPerMillionLong: 18,
      provider: LLMProvider.GOOGLE,
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
  },
  {
    id: LLMModels.GEMINI_3_FLASH_PREVIEW,
    label: "Gemini 3 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "live",
    offeredInChat: true,
    chatOrder: 1,
    premium: true,
    pricing: {
      inputPerMillion: 0.5,
      outputPerMillion: 3,
      cachedInputPerMillion: 0.05,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 1.0, videoPerMillion: 0.5 },
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
    openRouterSlug: "google/gemini-3-flash-preview",
  },
  {
    id: LLMModels.GEMINI_3_5_FLASH,
    label: "Gemini 3.5 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "live",
    offeredInChat: true,
    chatOrder: 2,
    premium: true,
    pricing: {
      inputPerMillion: 1.5,
      outputPerMillion: 9,
      cachedInputPerMillion: 0.15,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 3.0, videoPerMillion: 1.5 },
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
    openRouterSlug: "google/gemini-3.5-flash",
  },
  {
    id: LLMModels.GEMINI_3_7_FLASH,
    label: "Gemini 3.7 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "live",
    // Non-premium because it is also the free-tier model, which `locked` would otherwise gate.
    offeredInChat: true,
    chatOrder: 0,
    premium: false,
    // Introductory pricing through 2026-12-31; rises to 1.5/7.5 (cached 0.15) on 2027-01-01.
    pricing: {
      inputPerMillion: 0.75,
      outputPerMillion: 3.75,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.GOOGLE,
    },
    // Google publishes no separate audio row for 3.7/3.8 yet. These hold the audio=2x-text /
    // video=1x-text ratio every other Gemini 3.x Flash model bills at.
    modality: { audioPerMillion: 1.5, videoPerMillion: 0.75 },
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
    openRouterSlug: "google/gemini-3.7-flash",
  },
  {
    id: LLMModels.GEMINI_3_8_FLASH,
    label: "Gemini 3.8 Flash",
    provider: LLMProvider.GOOGLE,
    family: "gemini",
    status: "live",
    offeredInChat: true,
    chatOrder: 3,
    premium: true,
    // Introductory pricing through 2026-12-31; rises to 1.5/7.5 (cached 0.15) on 2027-01-01.
    pricing: {
      inputPerMillion: 0.75,
      outputPerMillion: 3.75,
      cachedInputPerMillion: 0.075,
      provider: LLMProvider.GOOGLE,
    },
    modality: { audioPerMillion: 1.5, videoPerMillion: 0.75 },
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    capabilities: GEMINI_THINKING,
    openRouterSlug: "google/gemini-3.8-flash",
  },

  // ═══════════════════════════ OpenRouter ═══════════════════════════
  // Reached through OpenRouter, so `provider` is OPENROUTER while `family` stays the vendor's.
  // Their ids carry a vendor prefix rather than a family one, which is exactly what the
  // `startsWith` chains could not express — a Grok selection fell through to the OpenAI
  // default before `family` existed.
  {
    id: LLMModels.GROK_4_5,
    label: "Grok 4.5",
    provider: LLMProvider.OPENROUTER,
    family: "grok",
    status: "live",
    offeredInChat: true,
    chatOrder: 11,
    premium: true,
    pricing: {
      inputPerMillion: 2.2,
      outputPerMillion: 6.6,
      cachedInputPerMillion: 0.22,
      provider: LLMProvider.OPENROUTER,
    },
    maxOutputTokens: OPENROUTER_MAX_OUTPUT_TOKENS,
    capabilities: { ...NO_CAPS, thinking: true, vision: true },
    byokProvider: "openrouter",
  },
  {
    id: LLMModels.GLM_5_2,
    label: "GLM 5.2",
    provider: LLMProvider.OPENROUTER,
    family: "glm",
    status: "live",
    offeredInChat: true,
    chatOrder: 12,
    premium: true,
    pricing: {
      inputPerMillion: 1.023,
      outputPerMillion: 3.3,
      cachedInputPerMillion: 0.1023,
      provider: LLMProvider.OPENROUTER,
    },
    maxOutputTokens: OPENROUTER_MAX_OUTPUT_TOKENS,
    // GLM 5.2 is text-only; GLM's vision variants are separate ids.
    capabilities: { ...NO_CAPS, thinking: true },
    byokProvider: "openrouter",
  },
] as const;

/**
 * Default model per provider surface, and the two special-purpose defaults.
 *
 * Declared here, with the models, so the invariants test can prove each one points at a
 * model that is actually `live`. A default left pointing at a model that had been dropped
 * from the catalog is how the client came to hold a stale hardcoded `claude-sonnet-4-6`
 * after the server default moved to Sonnet 5.
 *
 * They also need to be importable cheaply: the speak-server drivers that used to own these
 * constants pull in a tool chain that the test parser cannot load, so every module wanting a
 * default had to either drag that in or redeclare the value.
 */
export const OPENAI_DEFAULT_MODEL = LLMModels.GPT_5_5;
export const CLAUDE_DEFAULT_MODEL = LLMModels.CLAUDE_SONNET_5;
export const GEMINI_DEFAULT_MODEL = LLMModels.GEMINI_3_7_FLASH;
export const OPENROUTER_DEFAULT_MODEL = LLMModels.GROK_4_5;

/**
 * The model an audio/video turn is routed to when the chosen one cannot accept media.
 * Currently the Gemini default, but named separately because it answers a different question.
 */
export const MEDIA_ROUTED_MODEL = GEMINI_DEFAULT_MODEL;

/** The model a free-trial company runs on when its choice is premium. */
export const FREE_TIER_MODEL = LLMModels.GEMINI_3_7_FLASH;

/** Every default, for the invariant that each points at a live model. */
export const DEFAULT_MODELS = {
  OPENAI_DEFAULT_MODEL,
  CLAUDE_DEFAULT_MODEL,
  GEMINI_DEFAULT_MODEL,
  OPENROUTER_DEFAULT_MODEL,
  MEDIA_ROUTED_MODEL,
  FREE_TIER_MODEL,
} as const;

/**
 * Indexed by lower-cased id for O(1) lookup.
 *
 * Case-insensitive because the prefix helpers this registry replaces all lower-cased the id
 * before matching, so an id that reached them in a different case still resolved. Keeping
 * that is not cosmetic: a capability lookup that silently misses returns `false`, which reads
 * as "this model cannot do that" rather than as an error.
 */
const BY_ID = new Map<string, ModelDefinition>(MODEL_REGISTRY.map((m) => [m.id.toLowerCase(), m]));

/** The registry entry for a model id (enum value or raw string). Undefined if unknown. */
export function getModel(modelId: string): ModelDefinition | undefined {
  return BY_ID.get(modelId.toLowerCase());
}

/** Every model with the given status. */
export function modelsByStatus(status: ModelStatus): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.status === status);
}

/**
 * The models offered in the chat picker, in catalog order.
 *
 * `CHAT_MODELS` in speak-server becomes this. Order matters: the first entry is the catalog
 * default for a company with none resolved.
 */
export function offeredChatModels(): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.status === "live" && m.offeredInChat).sort(
    (a, b) => (a.chatOrder ?? Infinity) - (b.chatOrder ?? Infinity),
  );
}

/**
 * Where a model id should actually resolve to, following `replacedBy` until a live model is
 * reached. A `live` or `deprecated` model resolves to itself — only `retired` is substituted,
 * because a chat already pinned to a deprecated model keeps running on it until the user
 * switches. Unknown ids return undefined; the caller decides the default.
 *
 * Chains terminate: the invariants test proves there are no cycles.
 */
export function resolveModelId(modelId: string): LLMModels | undefined {
  let current = getModel(modelId);
  const seen = new Set<string>();
  while (current && current.status === "retired" && current.replacedBy) {
    if (seen.has(current.id)) return undefined;
    seen.add(current.id);
    current = getModel(current.replacedBy);
  }
  return current?.id;
}

/** True when a turn carrying these modalities cannot run on this model. */
export function requiresMediaCapableModel(
  modelId: string | undefined,
  modalities: ReadonlySet<"audio" | "video" | "image">,
): boolean {
  if (!modalities.has("audio") && !modalities.has("video")) return false;
  return !(modelId && getModel(modelId)?.capabilities.nativeAudioVideo);
}
