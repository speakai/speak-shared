import { describe, expect, it } from "vitest";

import {
  CMU_ERROR_MESSAGE,
  CMU_PHONEME_REGEX,
  IPA_CHAR_REGEX,
  IPA_ERROR_MESSAGE,
  MAX_PRONUNCIATION_RULES,
  PRONUNCIATION_PRONOUNCE_AS_MAX_LENGTH,
  PRONUNCIATION_TERM_MAX_LENGTH,
} from "../src/index.js";

describe("pronunciation limits", () => {
  it("are the stable cross-repo contract", () => {
    expect(MAX_PRONUNCIATION_RULES).toBe(500);
    expect(PRONUNCIATION_TERM_MAX_LENGTH).toBe(200);
    expect(PRONUNCIATION_PRONOUNCE_AS_MAX_LENGTH).toBe(200);
  });
});

describe("CMU_PHONEME_REGEX", () => {
  it.each([
    "M",
    "M IH1 T R EH0 K S",
    "AA0",
    "HH AH0 L OW1",
    "ZHX2",
    "M  IH1\tT",
  ])("accepts %j", (value) => {
    expect(CMU_PHONEME_REGEX.test(value)).toBe(true);
  });

  it.each([
    "",
    " M IH1",
    "M IH1 ",
    "m ih1 t",
    "ABCD",
    "IH12",
    "1IH",
    "M,IH1",
    "M-IH1",
    "mih-TREKS",
  ])("rejects %j", (value) => {
    expect(CMU_PHONEME_REGEX.test(value)).toBe(false);
  });
});

describe("IPA_CHAR_REGEX", () => {
  it.each(["mɪtrɛks", "æ", "ə", "ʃ", "ˈmitrex", "ʰ", "ã", "ɐ", "ʯ"])(
    "flags %j as containing IPA",
    (value) => {
      expect(IPA_CHAR_REGEX.test(value)).toBe(true);
    },
  );

  it.each(["mih-TREKS", "M IH1 T R EH0 K S", "O'Brien", "café", "naïve", "Zürich", ""])(
    "passes %j as plain respelling",
    (value) => {
      expect(IPA_CHAR_REGEX.test(value)).toBe(false);
    },
  );

  it("keeps no state between calls", () => {
    expect(IPA_CHAR_REGEX.test("ə")).toBe(true);
    expect(IPA_CHAR_REGEX.test("ə")).toBe(true);
  });
});

describe("pronunciation error messages", () => {
  it("name the fix the user should make", () => {
    expect(IPA_ERROR_MESSAGE).toContain("plain English respelling, not IPA");
    expect(CMU_ERROR_MESSAGE).toContain("M IH1 T R EH0 K S");
  });
});
