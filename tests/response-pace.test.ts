import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESPONSE_PACE,
  RESPONSE_PACES,
  RESPONSE_PACE_PRESETS,
  ResponsePace,
  resolveResponsePace,
} from "../src/index.js";

describe("response pace vocabulary", () => {
  it("is the stable cross-repo contract", () => {
    expect([...RESPONSE_PACES]).toEqual(["snappy", "balanced", "patient", "very_patient"]);
  });

  it("defaults to balanced", () => {
    expect(DEFAULT_RESPONSE_PACE).toBe(ResponsePace.BALANCED);
  });
});

describe("resolveResponsePace presets", () => {
  it("resolves snappy", () => {
    expect(resolveResponsePace("snappy")).toStrictEqual({
      mode: "fixed",
      minDelay: 200,
      maxDelay: 2000,
    });
  });

  it("resolves balanced", () => {
    expect(resolveResponsePace("balanced")).toStrictEqual({
      mode: "fixed",
      minDelay: 300,
      maxDelay: 2500,
    });
  });

  it("resolves patient", () => {
    expect(resolveResponsePace("patient")).toStrictEqual({
      mode: "dynamic",
      minDelay: 600,
      maxDelay: 3500,
      alpha: 0.9,
    });
  });

  it("resolves very_patient", () => {
    expect(resolveResponsePace("very_patient")).toStrictEqual({
      mode: "dynamic",
      minDelay: 900,
      maxDelay: 5000,
      alpha: 0.9,
    });
  });

  it("accepts the enum members themselves", () => {
    for (const pace of RESPONSE_PACES) {
      expect(resolveResponsePace(pace)).toStrictEqual({ ...RESPONSE_PACE_PRESETS[pace] });
    }
  });
});

describe("resolveResponsePace fallbacks", () => {
  const balanced = { mode: "fixed", minDelay: 300, maxDelay: 2500 };

  it("falls back for an agent that stores no pace", () => {
    expect(resolveResponsePace()).toStrictEqual(balanced);
    expect(resolveResponsePace(undefined)).toStrictEqual(balanced);
    expect(resolveResponsePace(null)).toStrictEqual(balanced);
  });

  it("falls back for non-strings", () => {
    for (const value of [0, 1, true, false, {}, [], () => {}, Symbol("snappy")]) {
      expect(resolveResponsePace(value)).toStrictEqual(balanced);
    }
  });

  it("falls back for unknown strings", () => {
    for (const value of ["", "SNAPPY", "Balanced", "impatient", " patient"]) {
      expect(resolveResponsePace(value)).toStrictEqual(balanced);
    }
  });

  it("falls back for inherited Object keys", () => {
    for (const value of ["constructor", "__proto__", "toString", "hasOwnProperty", "valueOf"]) {
      expect(resolveResponsePace(value)).toStrictEqual(balanced);
    }
  });
});

describe("preset immutability", () => {
  it("hands back a fresh copy, never the frozen singleton", () => {
    const first = resolveResponsePace("patient");
    const second = resolveResponsePace("patient");

    expect(first).not.toBe(second);
    expect(first).not.toBe(RESPONSE_PACE_PRESETS.patient);

    first.minDelay = 1;
    expect(RESPONSE_PACE_PRESETS.patient.minDelay).toBe(600);
    expect(resolveResponsePace("patient").minDelay).toBe(600);
  });
});
