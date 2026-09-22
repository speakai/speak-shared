import { describe, expect, it } from "vitest";

import {
  AGENT_TEMPLATES,
  AGENT_TEMPLATE_IDS,
  ALL_AGENT_TEMPLATES,
  BLANK_TEMPLATE,
  MODEL_REGISTRY,
  TEMPLATE_CATEGORIES,
  VOICE_AGENT_LLM_PROVIDERS,
  getAgentTemplateById,
  getAgentTemplateName,
  isAgentTemplateId,
} from "../src/index.js";

describe("agent template ids", () => {
  // Deep-linked as ?templateId=… from the agents site into the Speak builder.
  // Renaming one silently breaks every live link, so pin the exact set.
  it("are the stable cross-repo contract", () => {
    expect([...AGENT_TEMPLATE_IDS]).toEqual([
      "blank-agent",
      "customer-support-alex",
      "sales-rep-jordan",
      "executive-coach-sarah",
      "healthcare-receptionist-megan",
      "technical-interviewer-marcus",
      "language-tutor-luna",
      "real-estate-agent-sam",
      "concierge-ava",
    ]);
  });

  it("cover every catalog entry exactly once", () => {
    const ids = ALL_AGENT_TEMPLATES.map((tpl) => tpl.id);
    expect(ids).toHaveLength(AGENT_TEMPLATE_IDS.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(AGENT_TEMPLATE_IDS));
  });
});

describe("catalog shape", () => {
  it("puts the blank template first and keeps it out of AGENT_TEMPLATES", () => {
    expect(ALL_AGENT_TEMPLATES[0]).toBe(BLANK_TEMPLATE);
    expect(AGENT_TEMPLATES.some((tpl) => tpl.id === BLANK_TEMPLATE.id)).toBe(false);
  });

  it("gives every template the fields both surfaces render", () => {
    for (const tpl of ALL_AGENT_TEMPLATES) {
      expect(tpl.name, tpl.id).toBeTruthy();
      expect(tpl.description, tpl.id).toBeTruthy();
      expect(tpl.icon, tpl.id).toBeTruthy();
      expect(tpl.gradient, tpl.id).toBeTruthy();
      expect(tpl.instructions, tpl.id).toBeTruthy();
      expect(tpl.voice.provider, tpl.id).toBeTruthy();
    }
  });

  it("only uses categories the filter offers", () => {
    for (const tpl of AGENT_TEMPLATES) {
      expect(TEMPLATE_CATEGORIES, tpl.id).toContain(tpl.category);
    }
  });

  // An offered category with no template renders as a chip that filters to nothing.
  it("offers no category without at least one template", () => {
    for (const category of TEMPLATE_CATEGORIES) {
      if (category === "All") continue;
      expect(
        AGENT_TEMPLATES.some((tpl) => tpl.category === category),
        category,
      ).toBe(true);
    }
  });
});

describe("getAgentTemplateById", () => {
  it("resolves a known id", () => {
    expect(getAgentTemplateById("sales-rep-jordan")?.id).toBe("sales-rep-jordan");
    expect(getAgentTemplateName("sales-rep-jordan")).toBeTruthy();
  });

  it("resolves every restored template on its goal-aligned category", () => {
    expect(getAgentTemplateById("technical-interviewer-marcus")?.category).toBe("Research");
    expect(getAgentTemplateById("concierge-ava")?.category).toBe("Support");
    expect(getAgentTemplateById("language-tutor-luna")?.category).toBe("Research");
    expect(getAgentTemplateById("real-estate-agent-sam")?.category).toBe("Sales");
  });

  it("returns undefined rather than throwing on untrusted input", () => {
    expect(getAgentTemplateById("nope")).toBeUndefined();
    expect(getAgentTemplateById(null)).toBeUndefined();
    expect(getAgentTemplateById(undefined)).toBeUndefined();
    expect(getAgentTemplateById("")).toBeUndefined();
    expect(getAgentTemplateName("nope")).toBeUndefined();
  });
});

describe("template models", () => {
  // A template pinned to a deprecated or retired id deploys an agent the voice worker
  // has to silently re-route, so the catalog may only name live registry models.
  it("name only models the registry still serves", () => {
    const byId = new Map(MODEL_REGISTRY.map((model) => [model.id as string, model]));
    for (const tpl of ALL_AGENT_TEMPLATES) {
      if (!tpl.llm) continue;
      const model = byId.get(tpl.llm.model);
      expect(model, `${tpl.id}: ${tpl.llm.model}`).toBeDefined();
      expect(model?.status, tpl.id).toBe("live");
      expect(model?.provider, tpl.id).toBe(tpl.llm.provider);
    }
  });

  it("only run on providers the voice worker has an engine for", () => {
    for (const tpl of ALL_AGENT_TEMPLATES) {
      if (!tpl.llm) continue;
      expect(VOICE_AGENT_LLM_PROVIDERS as readonly string[], tpl.id).toContain(tpl.llm.provider);
    }
  });
});

describe("isAgentTemplateId", () => {
  it("narrows only known ids", () => {
    expect(isAgentTemplateId("blank-agent")).toBe(true);
    expect(isAgentTemplateId("nope")).toBe(false);
    expect(isAgentTemplateId(null)).toBe(false);
    expect(isAgentTemplateId(42)).toBe(false);
  });
});
