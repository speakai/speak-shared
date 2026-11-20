import { describe, it, expect } from "vitest";

describe("package entry points", () => {
  it("keeps the zod schemas out of the main entry", async () => {
    const pkg = await import("../src/index.js");

    expect("dashboardSpecSchema" in pkg).toBe(false);
    expect("buildDashboardSpecSchema" in pkg).toBe(false);
  });

  it("does not leak the raw schemas that skip the depth guard", async () => {
    const schemas = await import("../src/schemas/index.js");

    for (const name of ["filterSchemaRaw", "metricSchemaRaw", "widgetSchemaRaw", "bindingSchemaRaw", "columnSchemaRaw", "baseMetricSchemaRaw", "exprSchemaRaw"]) {
      expect(name in schemas).toBe(false);
    }
  });
});

describe("Recorder session events", () => {
  it("RECORDER_SESSION_EVENTS covers every session event with a category and description", async () => {
    const { RECORDER_SESSION_EVENTS, RecorderSessionEventCategory, RecorderSessionEventType } = await import("../src/index.js");

    expect(Object.keys(RECORDER_SESSION_EVENTS).sort()).toEqual(Object.values(RecorderSessionEventType).sort());
    const categories = Object.values(RecorderSessionEventCategory);
    for (const entry of Object.values(RECORDER_SESSION_EVENTS)) {
      expect(categories).toContain(entry.category);
      expect(entry.description.trim()).not.toBe("");
    }
    expect(new Set(Object.values(RECORDER_SESSION_EVENTS).map((e) => e.category))).toEqual(new Set(categories));
  });
});

describe("OFFER_PAGE_VERSION_PATTERN", () => {
  it("accepts lowercase letters, digits and hyphens up to 40 characters", async () => {
    const { OFFER_PAGE_VERSION_PATTERN } = await import("../src/index.js");

    for (const name of ["control", "v2", "year-end-2026", "a", "-", "a".repeat(40)]) {
      expect(OFFER_PAGE_VERSION_PATTERN.test(name)).toBe(true);
    }
  });

  it("rejects empty, long, uppercase and other characters", async () => {
    const { OFFER_PAGE_VERSION_PATTERN } = await import("../src/index.js");

    for (const name of ["", "a".repeat(41), "Control", "v_2", "v 2", "v.2", "v2\n", "../x"]) {
      expect(OFFER_PAGE_VERSION_PATTERN.test(name)).toBe(false);
    }
  });
});

describe("OFFER_PAGE_SLUG_PATTERN", () => {
  it("accepts lowercase letters, digits and hyphens from 3 to 40 characters", async () => {
    const { OFFER_PAGE_SLUG_PATTERN } = await import("../src/index.js");

    for (const slug of ["abc", "legal-teams", "year-end-2026", "a".repeat(40)]) {
      expect(OFFER_PAGE_SLUG_PATTERN.test(slug)).toBe(true);
    }
  });

  it("rejects short, long, uppercase and other characters", async () => {
    const { OFFER_PAGE_SLUG_PATTERN } = await import("../src/index.js");

    for (const slug of ["", "ab", "a".repeat(41), "Legal", "legal_teams", "legal teams", "legal.teams", "x\n", "../x"]) {
      expect(OFFER_PAGE_SLUG_PATTERN.test(slug)).toBe(false);
    }
  });
});

describe("OFFER_PAGE_TEXT_LIMITS", () => {
  it("keeps the limit for every audience page text field", async () => {
    const { OFFER_PAGE_TEXT_LIMITS } = await import("../src/index.js");

    expect(OFFER_PAGE_TEXT_LIMITS).toEqual({
      dialogTitle: 40,
      description: 120,
      cta: 32,
      continueLabel: 30,
      cardLabel: 30,
      paypalLabel: 30,
    });
  });
});
