import { describe, expect, it } from "vitest";

import { CMU_PHONEME_REGEX, IPA_CHAR_REGEX } from "../src/index.js";

describe("CMU_PHONEME_REGEX", () => {
  it.each([
    "M",
    "K W IH1 L OW0 T R AE2 K S",
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
    "KWIL-oh-traks",
  ])("rejects %j", (value) => {
    expect(CMU_PHONEME_REGEX.test(value)).toBe(false);
  });
});

describe("IPA_CHAR_REGEX", () => {
  it.each(["kwɪlotræks", "æ", "ə", "ʃ", "ˈkwilotrax", "ʰ", "ã", "ɐ", "ʯ"])(
    "flags %j as containing IPA",
    (value) => {
      expect(IPA_CHAR_REGEX.test(value)).toBe(true);
    },
  );

  it.each(["KWIL-oh-traks", "K W IH1 L OW0 T R AE2 K S", "O'Brien", "café", "naïve", "Zürich", ""])(
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
