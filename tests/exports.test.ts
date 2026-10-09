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
