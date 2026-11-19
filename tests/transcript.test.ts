import { describe, it, expect } from "vitest";
import {
  confidenceBand,
  formatTranscriptTime,
  groupSegmentsByParagraph,
  LOW_CONFIDENCE,
  parseTranscriptTime,
  VERY_LOW_CONFIDENCE,
} from "../src/utils/transcript.js";
import type { ITranscriptInstance, ITranscriptSegment } from "../src/interfaces/transcript.js";

// Synthetic fixtures only
function segment(id: number, speakerId: string | number, instance?: Partial<ITranscriptInstance>): ITranscriptSegment {
  return {
    id,
    speakerId,
    text: `sentence ${id}`,
    confidence: 0.9,
    instances: instance ? [instance as ITranscriptInstance] : [],
  };
}

describe("groupSegmentsByParagraph", () => {
  it("returns no paragraphs for an empty or missing transcript", () => {
    expect(groupSegmentsByParagraph([])).toEqual([]);
    expect(groupSegmentsByParagraph(undefined as unknown as ITranscriptSegment[])).toEqual([]);
  });

  it("merges consecutive segments of one speaker even when the id is a number in one and a string in the other", () => {
    const paragraphs = groupSegmentsByParagraph([
      segment(0, 1, { start: 0, end: 2 }),
      segment(1, "1", { start: 2, end: 5 }),
    ]);

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toMatchObject({ id: 0, speakerId: "1", start: 0, end: 5 });
    expect(paragraphs[0]!.sentences.map((s) => s.id)).toEqual([0, 1]);
  });

  it("starts a new paragraph on every speaker change, including a speaker who returns", () => {
    const paragraphs = groupSegmentsByParagraph([
      segment(0, 1, { start: 0, end: 1 }),
      segment(1, 2, { start: 1, end: 2 }),
      segment(2, 1, { start: 2, end: 3 }),
    ]);

    expect(paragraphs.map((p) => [p.id, p.speakerId, p.start, p.end])).toEqual([
      [0, "1", 0, 1],
      [1, "2", 1, 2],
      [2, "1", 2, 3],
    ]);
  });

  it("falls back to the *InSec timings, and keeps the last known end when a segment has no timing", () => {
    const [paragraph] = groupSegmentsByParagraph([
      segment(0, 1, { startInSec: 4, endInSec: 6 }),
      segment(1, 1),
    ]);

    expect(paragraph).toMatchObject({ start: 4, end: 6 });
    expect(paragraph!.sentences.map((s) => [s.start, s.end])).toEqual([
      [4, 6],
      [0, 0],
    ]);
  });

  it("names the speaker from the speakers list, matching numeric list ids to string segment ids", () => {
    const [named, unnamed] = groupSegmentsByParagraph(
      [{ ...segment(0, "7", { start: 0, end: 1 }), speaker: { userId: "u7" } }, segment(1, 8, { start: 1, end: 2 })],
      [{ id: 7, name: "Ana" }],
    );

    expect(named!.speaker).toEqual({ userId: "u7", name: "Ana" });
    expect(unnamed!.speaker).toBeUndefined();
  });
});

describe("formatTranscriptTime", () => {
  it.each([
    [0, "0:00:00"],
    [59.9, "0:00:59"],
    [3599, "0:59:59"],
    [3600, "1:00:00"],
    [36_061, "10:01:01"],
    ["90.5", "0:01:30"],
  ])("formats %j as %s", (input, expected) => {
    expect(formatTranscriptTime(input)).toBe(expected);
  });

  it.each([NaN, -1, "", "abc"])("shows 0:00:00 instead of NaN or a negative time for %j", (input) => {
    expect(formatTranscriptTime(input)).toBe("0:00:00");
  });
});

describe("parseTranscriptTime", () => {
  it.each([
    ["1:23:45", 5025],
    ["01:23:45", 5025],
    ["10:00:00", 36_000],
    ["2:05", 125],
    ["90", 90],
    ["12.5", 12.5],
    ["", 0],
    ["abc", 0],
  ])("parses %j as %d seconds", (input, expected) => {
    expect(parseTranscriptTime(input)).toBe(expected);
  });

  it("round-trips every displayed time across the hour boundaries", () => {
    for (const seconds of [0, 59, 60, 3599, 3600, 3661, 86_399, 86_400, 360_000]) {
      expect(parseTranscriptTime(formatTranscriptTime(seconds))).toBe(seconds);
    }
  });
});

describe("confidenceBand", () => {
  it("bands real word confidences and treats missing or out-of-range values as ok", () => {
    expect(confidenceBand(0.9)).toBe("ok");
    expect(confidenceBand(LOW_CONFIDENCE)).toBe("ok");
    expect(confidenceBand(0.74)).toBe("low");
    expect(confidenceBand(VERY_LOW_CONFIDENCE)).toBe("low");
    expect(confidenceBand(0.54)).toBe("very-low");
    for (const value of [undefined, null, NaN, 0, -0.2, 1.5, "0.3"]) expect(confidenceBand(value)).toBe("ok");
  });
});
