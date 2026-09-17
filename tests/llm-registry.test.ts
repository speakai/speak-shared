/**
 * Registry invariants.
 *
 * These encode the rules that were previously comments, tribal knowledge, or nothing at all.
 * Each one corresponds to a way the seven-table arrangement actually failed:
 *
 *   - a Gemini model added without modality rates priced media ~3x high via the
 *     "dearest known rates" fallback, and the affordability gate then refused turns the
 *     customer could afford;
 *   - a Gemini model added without a max-output entry silently inherited Anthropic's
 *     14.5k cap, truncating answers;
 *   - a default constant left pointing at a model that had been dropped from the catalog
 *     is exactly how the client came to hold a stale hardcoded default.
 */
import { describe, it, expect } from "vitest";
import { LLMModels, LLMProvider } from "../src/enums/llm.js";
import {
  MODEL_REGISTRY,
  getModel,
  offeredChatModels,
  resolveModelId,
  requiresMediaCapableModel,
  type ModelDefinition,
} from "../src/llm/registry.js";
import { MODEL_PRICING, getModelPricing } from "../src/pricing/modelPricing.js";

const live = MODEL_REGISTRY.filter((m) => m.status === "live");
const notLive = MODEL_REGISTRY.filter((m) => m.status !== "live");

const label = (m: ModelDefinition) => `${m.id} (${m.status})`;

describe("registry covers the enum exactly", () => {
  it("has an entry for every LLMModels value", () => {
    const missing = Object.values(LLMModels).filter((id) => !getModel(id));
    expect(missing).toEqual([]);
  });

  it("has no entry for an id that is not in the enum", () => {
    const enumIds = new Set<string>(Object.values(LLMModels));
    const orphans = MODEL_REGISTRY.filter((m) => !enumIds.has(m.id)).map((m) => m.id);
    expect(orphans).toEqual([]);
  });

  it("has no duplicate ids", () => {
    const ids = MODEL_REGISTRY.map((m) => m.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("every model is priceable", () => {
  // Pricing is kept for deprecated AND retired models: a stored id on an old row must still
  // bill correctly. That is the whole reason models are retired from the catalog rather than
  // deleted from the enum.
  it.each(MODEL_REGISTRY.map((m) => [label(m), m] as const))("%s has positive rates", (_, model) => {
    expect(model.pricing.inputPerMillion).toBeGreaterThan(0);
    expect(model.pricing.outputPerMillion).toBeGreaterThan(0);
  });

  it("declares pricing.provider consistently with the entry's provider", () => {
    const mismatched = MODEL_REGISTRY.filter((m) => m.pricing.provider !== m.provider).map(label);
    expect(mismatched).toEqual([]);
  });

  it("gives every long-context tier both a threshold and a raised rate", () => {
    const broken = MODEL_REGISTRY.filter((m) => {
      const p = m.pricing;
      const hasTier = p.longContextThresholdTokens !== undefined;
      const hasRates = p.inputPerMillionLong !== undefined && p.outputPerMillionLong !== undefined;
      return hasTier !== hasRates;
    }).map(label);
    expect(broken).toEqual([]);
  });

  it("never prices the long-context tier below the standard tier", () => {
    const cheaper = MODEL_REGISTRY.filter(
      (m) =>
        (m.pricing.inputPerMillionLong ?? Infinity) < m.pricing.inputPerMillion ||
        (m.pricing.outputPerMillionLong ?? Infinity) < m.pricing.outputPerMillion,
    ).map(label);
    expect(cheaper).toEqual([]);
  });
});

describe("every live model is fully specified", () => {
  it.each(live.map((m) => [m.id, m] as const))("%s has a positive output cap", (_, model) => {
    expect(model.maxOutputTokens).toBeGreaterThan(0);
  });

  // The rule `multimodalPricing.ts` states in a comment and nothing enforced: a model that
  // can serve a media turn MUST have modality rates, or that turn prices against the ceiling.
  it.each(live.filter((m) => m.capabilities.nativeAudioVideo).map((m) => [m.id, m] as const))(
    "%s accepts audio/video and so declares modality rates",
    (_, model) => {
      expect(model.modality).toBeDefined();
      expect(model.modality!.audioPerMillion).toBeGreaterThan(0);
      expect(model.modality!.videoPerMillion).toBeGreaterThan(0);
    },
  );

  it("has a non-empty label for anything shown in the picker", () => {
    const unlabelled = offeredChatModels().filter((m) => !m.label.trim()).map(label);
    expect(unlabelled).toEqual([]);
  });
});

describe("deprecation is resolvable", () => {
  it("gives every non-live model a replacedBy", () => {
    const orphaned = notLive.filter((m) => !m.replacedBy).map(label);
    expect(orphaned).toEqual([]);
  });

  it.each(notLive.map((m) => [label(m), m] as const))("%s points at a live model", (_, model) => {
    const target = getModel(model.replacedBy!);
    expect(target, `${model.id} -> ${model.replacedBy} is not in the registry`).toBeDefined();
    expect(target!.status, `${model.id} -> ${model.replacedBy}`).toBe("live");
  });

  it("never points a model at itself", () => {
    const selfish = MODEL_REGISTRY.filter((m) => m.replacedBy === m.id).map(label);
    expect(selfish).toEqual([]);
  });

  it("resolves every id in the enum to a live model", () => {
    // Because replacedBy always targets a live model, this terminates in one hop — but assert
    // on the outcome rather than the hop count so a future chain stays covered.
    for (const id of Object.values(LLMModels)) {
      const resolved = resolveModelId(id);
      expect(resolved, `${id} did not resolve`).toBeDefined();
      expect(getModel(resolved!)!.status).not.toBe("retired");
    }
  });

  it("keeps a deprecated model dispatchable, substituting only retired ones", () => {
    // A chat already pinned to a deprecated model keeps running on it until the user
    // switches; only a retired id is rewritten. This is the decision recorded in the plan.
    const deprecated = MODEL_REGISTRY.find((m) => m.status === "deprecated")!;
    const retired = MODEL_REGISTRY.find((m) => m.status === "retired")!;
    expect(resolveModelId(deprecated.id)).toBe(deprecated.id);
    expect(resolveModelId(retired.id)).toBe(retired.replacedBy);
  });

  it("never replaces a model with one that has lost a capability it had", () => {
    const regressions: string[] = [];
    for (const model of notLive) {
      const target = getModel(model.replacedBy!)!;
      for (const [capability, had] of Object.entries(model.capabilities)) {
        const kept = target.capabilities[capability as keyof typeof target.capabilities];
        // customTemperature is deliberately lost on the GPT-5 family: reasoning models reject
        // a custom temperature, and every live OpenAI model is one.
        if (capability === "customTemperature") continue;
        if (had && !kept) regressions.push(`${model.id} -> ${target.id} loses ${capability}`);
      }
    }
    expect(regressions).toEqual([]);
  });
});

describe("status and visibility agree", () => {
  it("offers only live models in the picker", () => {
    const offered = MODEL_REGISTRY.filter((m) => m.offeredInChat && m.status !== "live").map(label);
    expect(offered).toEqual([]);
  });

  it("sets chatOrder if and only if the model is offered", () => {
    const wrong = MODEL_REGISTRY.filter((m) => m.offeredInChat !== (m.chatOrder !== undefined)).map(label);
    expect(wrong).toEqual([]);
  });

  it("gives every offered model a unique chatOrder", () => {
    const orders = offeredChatModels().map((m) => m.chatOrder);
    expect(orders.length).toBe(new Set(orders).size);
  });

  it("returns the picker in chatOrder, since position 0 is the catalog default", () => {
    const orders = offeredChatModels().map((m) => m.chatOrder!);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("offers at least one model per live provider surface", () => {
    const providers = new Set(offeredChatModels().map((m) => m.provider));
    expect(providers).toContain(LLMProvider.OPENAI);
    expect(providers).toContain(LLMProvider.ANTHROPIC);
    expect(providers).toContain(LLMProvider.GOOGLE);
    expect(providers).toContain(LLMProvider.OPENROUTER);
  });

  it("offers at least one media-capable model, since media turns must route to one", () => {
    expect(offeredChatModels().some((m) => m.capabilities.nativeAudioVideo)).toBe(true);
  });

  it("offers at least one non-premium model for the free tier to land on", () => {
    expect(offeredChatModels().some((m) => !m.premium)).toBe(true);
  });
});

describe("routing identity is declared, not inferred from the id", () => {
  // The bug this prevents: Grok and GLM carry a vendor prefix rather than a family one, so
  // every `startsWith` chain fell through to the OpenAI default. A workspace that picked Grok
  // silently ran GPT.
  it("routes OpenRouter-served models by provider while keeping the vendor family", () => {
    expect(getModel(LLMModels.GROK_4_5)!.provider).toBe(LLMProvider.OPENROUTER);
    expect(getModel(LLMModels.GROK_4_5)!.family).toBe("grok");
    expect(getModel(LLMModels.GLM_5_2)!.provider).toBe(LLMProvider.OPENROUTER);
    expect(getModel(LLMModels.GLM_5_2)!.family).toBe("glm");
  });

  it("gives Gemini no BYOK provider — only a customer's own Vertex project makes it BYOK", () => {
    const gemini = MODEL_REGISTRY.filter((m) => m.provider === LLMProvider.GOOGLE);
    expect(gemini.every((m) => m.byokProvider === undefined)).toBe(true);
  });

  it("gives every non-Gemini model a BYOK provider matching how it is reached", () => {
    const expected: Partial<Record<LLMProvider, string>> = {
      [LLMProvider.OPENAI]: "openai",
      [LLMProvider.ANTHROPIC]: "anthropic",
      [LLMProvider.OPENROUTER]: "openrouter",
    };
    const wrong = MODEL_REGISTRY.filter(
      (m) => m.provider !== LLMProvider.GOOGLE && m.byokProvider !== expected[m.provider],
    ).map(label);
    expect(wrong).toEqual([]);
  });

  it("only gives an OpenRouter slug to a model OpenRouter can actually be asked for", () => {
    // A slug is how OpenRouter addresses a model we can ALSO reach directly, so the models
    // OpenRouter itself serves natively never carry one.
    const wrong = MODEL_REGISTRY.filter(
      (m) => m.openRouterSlug && m.provider === LLMProvider.OPENROUTER,
    ).map(label);
    expect(wrong).toEqual([]);
  });

  it("gives every offered non-OpenRouter model a slug, so BYOK routing never guesses", () => {
    const missing = offeredChatModels()
      .filter((m) => m.provider !== LLMProvider.OPENROUTER && !m.openRouterSlug)
      .map(label);
    expect(missing).toEqual([]);
  });
});

describe("media routing", () => {
  it("does not re-route an images-only turn", () => {
    // Images are universal; only audio and video force a media-capable model. An images-only
    // carousel must stay on whatever the chat picked.
    expect(requiresMediaCapableModel(LLMModels.CLAUDE_SONNET_5, new Set(["image"]))).toBe(false);
  });

  it("re-routes an audio or video turn off a text-only model", () => {
    expect(requiresMediaCapableModel(LLMModels.CLAUDE_SONNET_5, new Set(["audio"]))).toBe(true);
    expect(requiresMediaCapableModel(LLMModels.GPT_5_5, new Set(["video"]))).toBe(true);
  });

  it("leaves a media-capable model alone", () => {
    expect(requiresMediaCapableModel(LLMModels.GEMINI_3_7_FLASH, new Set(["audio"]))).toBe(false);
  });

  it("re-routes when the model is unknown rather than assuming it copes", () => {
    expect(requiresMediaCapableModel(undefined, new Set(["audio"]))).toBe(true);
    expect(requiresMediaCapableModel("some-model-we-never-heard-of", new Set(["video"]))).toBe(true);
  });
});

describe("the pricing projection keeps its existing surface", () => {
  it("exposes a rate card for every registry entry", () => {
    expect(Object.keys(MODEL_PRICING).sort()).toEqual(MODEL_REGISTRY.map((m) => m.id).sort());
  });

  it("returns the same object the registry holds", () => {
    expect(getModelPricing(LLMModels.CLAUDE_SONNET_5)).toBe(
      getModel(LLMModels.CLAUDE_SONNET_5)!.pricing,
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(getModelPricing("not-a-model")).toBeUndefined();
  });

  it("looks a model up case-insensitively, as the prefix helpers did", () => {
    expect(getModel("CLAUDE-SONNET-5")).toBe(getModel(LLMModels.CLAUDE_SONNET_5));
    expect(requiresMediaCapableModel("GEMINI-3.7-FLASH", new Set(["audio"]))).toBe(false);
    expect(resolveModelId("Claude-2")).toBe(LLMModels.CLAUDE_SONNET_5);
  });
});
