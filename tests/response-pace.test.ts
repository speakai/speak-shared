import { describe, expect, it } from "vitest";

import { RESPONSE_PACES, RESPONSE_PACE_PRESETS, resolveResponsePace } from "../src/index.js";

const BALANCED = { mode: "fixed", minDelay: 300, maxDelay: 2500 };

describe("resolveResponsePace", () => {
  it("resolves every pace to a copy of its preset", () => {
    for (const pace of RESPONSE_PACES) {
      expect(resolveResponsePace(pace)).toStrictEqual({ ...RESPONSE_PACE_PRESETS[pace] });
    }
  });

  it.each([
    undefined,
    null,
    0,
    true,
    {},
    [],
    Symbol("snappy"),
    "",
    "SNAPPY",
    " patient",
    "impatient",
    "constructor",
    "__proto__",
    "toString",
  ])("falls back to balanced for %s", (value) => {
    expect(resolveResponsePace(value)).toStrictEqual(BALANCED);
  });

  it("hands back a fresh copy that cannot change the preset", () => {
    const first = resolveResponsePace("patient");
    first.minDelay = 1;
    expect(RESPONSE_PACE_PRESETS.patient.minDelay).not.toBe(1);
    expect(resolveResponsePace("patient")).not.toBe(first);
  });
});
