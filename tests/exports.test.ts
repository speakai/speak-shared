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

describe("Label constants", () => {
  it("keep the limits, patterns and defaults the server enforces", async () => {
    const c = await import("../src/utils/label.js");
    const { SpeakLabelSet, UserRole } = await import("../src/enums/index.js");

    expect([c.LABEL_NAME_MAX, c.LABEL_DESCRIPTION_MAX, c.MAX_LABELS_PER_SPAN, c.MEDIA_COMMENT_BODY_MAX]).toEqual([80, 500, 20, 5000]);
    expect([c.LABEL_SORT_ORDER_MAX, c.MAX_DASHBOARD_LABEL_GROUPS]).toEqual([1_000_000, 100]);
    // Link reviewers are feedback submitter names now, so nothing validates reviewer user ids any more.
    expect("MAX_DASHBOARD_REVIEWERS" in c).toBe(false);
    expect("USER_ID_PATTERN" in c).toBe(false);
    expect(c.PUBLIC_ID_PATTERN.test("Ab_9-x")).toBe(true);
    expect(c.PUBLIC_ID_PATTERN.test("a.b")).toBe(false);
    expect(c.LABEL_COLOR_PATTERN.test("#A1b2C3")).toBe(true);
    expect(c.LABEL_COLOR_PATTERN.test("#abc")).toBe(false);
    expect(c.LABEL_COLOR_PATTERN.test(c.DEFAULT_LABEL_COLOR)).toBe(true);
    expect(c.LABEL_COLOR_PRESETS).toHaveLength(12);
    for (const color of c.LABEL_COLOR_PRESETS) expect(c.LABEL_COLOR_PATTERN.test(color)).toBe(true);

    expect(Object.keys(c.SPEAK_LABEL_SETS).sort()).toEqual(Object.values(SpeakLabelSet).sort());
    for (const set of Object.values(c.SPEAK_LABEL_SETS)) {
      for (const label of set.labels) expect(c.LABEL_COLOR_PATTERN.test(label.color)).toBe(true);
    }

    expect(Object.keys(c.LABEL_PERMISSION_DEFAULTS).sort()).toEqual(Object.values(UserRole).sort());
    expect(c.LABEL_PERMISSION_DEFAULTS[UserRole.OWNER].labels).toEqual({ create: true, update: true, delete: true, assign: true });
    expect(c.LABEL_PERMISSION_DEFAULTS[UserRole.MEMBER]).toEqual({
      labels: { create: true, update: true, delete: false, assign: true },
      comments: { create: true, update: true, delete: false },
    });
    expect(Object.isFrozen(c.LABEL_PERMISSION_DEFAULTS[UserRole.ADMIN].labels)).toBe(true);
  });
});

describe("Recorder session events", () => {
  it("RECORDER_SESSION_EVENTS covers every session event with a category and description", async () => {
    const {
      RECORDER_SESSION_EVENTS,
      RecorderSessionEventCategory,
      RecorderSessionEventType,
      RecorderSessionWakeLock,
    } = await import("../src/index.js");

    expect(RecorderSessionEventType.SUSPEND_DETECTED).toBe("suspend_detected");
    expect(Object.values(RecorderSessionWakeLock)).toEqual([
      "acquired",
      "denied",
      "unsupported",
      "released",
    ]);
    expect(Object.values(RecorderSessionEventType)).toHaveLength(31);
    expect(Object.keys(RECORDER_SESSION_EVENTS).sort()).toEqual(
      Object.values(RecorderSessionEventType).sort(),
    );
    const categories = Object.values(RecorderSessionEventCategory);
    for (const entry of Object.values(RECORDER_SESSION_EVENTS)) {
      expect(categories).toContain(entry.category);
      expect(entry.description.trim()).not.toBe("");
    }
    expect(new Set(Object.values(RECORDER_SESSION_EVENTS).map((e) => e.category))).toEqual(
      new Set(categories),
    );
  });
});
