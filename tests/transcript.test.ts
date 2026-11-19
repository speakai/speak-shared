import { describe, it, expect } from "vitest";
import { formatTranscriptTime, parseTranscriptTime } from "../src/utils/transcript.js";

describe("formatTranscriptTime", () => {
  it.each([Infinity, -Infinity, NaN, -1, "Infinity", ""])("shows 0:00:00 for %s instead of an invalid time", (input) => {
    expect(formatTranscriptTime(input)).toBe("0:00:00");
  });
});

describe("parseTranscriptTime", () => {
  it.each(["1:xx:00", "1:2:3:4", "1::00", ":", "", "abc", "Infinity"])("returns 0 for malformed %j", (input) => {
    expect(parseTranscriptTime(input)).toBe(0);
  });

  it.each([
    ["1:23:45", 5025],
    ["2:05", 125],
    ["12.5", 12.5],
  ])("still parses %j as %d seconds", (input, expected) => {
    expect(parseTranscriptTime(input)).toBe(expected);
  });
});
