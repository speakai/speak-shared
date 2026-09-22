import { describe, expect, it } from "vitest";

import {
  AGENT_TEMPLATES,
  AGENT_TEMPLATE_IDS,
  ALL_AGENT_TEMPLATES,
  BLANK_TEMPLATE,
  TEMPLATE_CATEGORIES,
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

  it("resolves the restored HR/Tech and Hospitality templates", () => {
    expect(getAgentTemplateById("technical-interviewer-marcus")?.category).toBe("HR/Tech");
    expect(getAgentTemplateById("concierge-ava")?.category).toBe("Hospitality");
  });

  it("returns undefined rather than throwing on untrusted input", () => {
    expect(getAgentTemplateById("nope")).toBeUndefined();
    expect(getAgentTemplateById(null)).toBeUndefined();
    expect(getAgentTemplateById(undefined)).toBeUndefined();
    expect(getAgentTemplateById("")).toBeUndefined();
    expect(getAgentTemplateName("nope")).toBeUndefined();
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
