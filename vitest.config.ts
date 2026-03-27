import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/interfaces/**"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 50,
        statements: 70,
      },
    },
  },
});
