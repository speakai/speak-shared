import { describe, it, expect } from "vitest";
import {
  flattenWords,
  buildAnchor,
  buildAnchorFromWords,
  normalizeWord,
  tokenizeWords,
  isAnchorOnRevision,
} from "../src/utils/anchor.js";
import type { ITranscriptSegment, IWordEntity } from "../src/interfaces/transcript.js";

// Synthetic fixtures only
function entity(text: string, startInSec?: number, endInSec?: number): IWordEntity {
  return { text, instances: startInSec === undefined ? undefined : { startInSec, endInSec } };
}

function segment(
  id: number,
  speakerId: string | number,
  text: string,
  start: number | string,
  end: number | string,
  entities?: IWordEntity[]
): ITranscriptSegment {
  return { id, speakerId, text, confidence: 0.9, instances: [{ start, end }], entities };
}

const transcript: ITranscriptSegment[] = [
  // Normal word entities, with a bare punctuation entity that is not a word
  segment(0, 1, "Hello, team. Welcome!", 0, 2, [
    entity("Hello,", 0, 0.5),
    entity("team.", 0.5, 1),
    entity("—", 1, 1),
    entity("Welcome!", 1, 2),
  ]),
  // One phrase entity holding two words, and an entity with no timings
  segment(1, 2, "We moved to New York today", 2, 5, [
    entity("We", 2, 2.5),
    entity("moved", 2.5, 3),
    entity("to", 3, 3.2),
    entity("New York", 3.2, 4),
    entity("today"),
  ]),
  // No entities: text split on whitespace, times spread across the segment, string times
  segment(1, 2, "“Don’t   stop”  now", "5", "8"),
  // Duplicate id 1 again, as live transcripts produce
  segment(1, 1, "Okay.", 8, 9, [entity("Okay.", 8, 9)]),
];

describe("flattenWords", () => {
  const words = flattenWords(transcript);

  it("counts words by array position across entities, phrases, fallbacks and duplicate ids", () => {
    expect(words.map((w) => w.text)).toEqual([
      "Hello,", "team.", "Welcome!",
      "We", "moved", "to", "New", "York", "today",
      "“Don’t", "stop”", "now",
      "Okay.",
    ]);
    expect(words.map((w) => w.norm)).toEqual([
      "hello", "team", "welcome",
      "we", "moved", "to", "new", "york", "today",
      "don't", "stop", "now",
      "okay",
    ]);
    expect(words.map((w) => w.segmentIndex)).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3]);
    expect(words.map((w) => w.wordIndex)).toEqual([0, 1, 2, 0, 1, 2, 3, 4, 5, 0, 1, 2, 0]);
    expect(words.map((w) => w.speakerId)).toEqual(["1", "1", "1", "2", "2", "2", "2", "2", "2", "2", "2", "2", "1"]);
  });

  it("uses entity timings, splits phrase time evenly, and interpolates missing times", () => {
    const times = words.map((w) => [w.startInSec, w.endInSec]);

    expect(times[0]).toEqual([0, 0.5]);
    expect(times[6]).toEqual([3.2, 3.6]); // "New"
    expect(times[7]).toEqual([3.6, 4]); // "York"
    expect(times[8]).toEqual([4, 4]); // "today" has no timings: continues from previous word
    expect(times.slice(9, 12)).toEqual([[5, 6], [6, 7], [7, 8]]);
  });

  it("returns an empty list for an empty transcript", () => {
    expect(flattenWords([])).toEqual([]);
  });
});

describe("normalizeWord", () => {
  it("lowercases, straightens apostrophes, strips edge punctuation and keeps inner marks", () => {
    expect(normalizeWord("“Don’t,")).toBe("don't");
    expect(normalizeWord("(e-mail)...")).toBe("e-mail");
    expect(normalizeWord("Café")).toBe("café");
    expect(normalizeWord("?!")).toBe("");
  });
});

describe("buildAnchor", () => {
  it("builds quote, context, speakers and times for a range spanning segments", () => {
    const anchor = buildAnchor(transcript, { start: 6, end: 10 }, 3);

    expect(anchor).toEqual({
      startWord: 6,
      endWord: 10,
      exact: "New York today “Don’t stop”",
      prefix: "ello, team. Welcome! We moved to",
      suffix: "now Okay.",
      startInSec: 3.2,
      endInSec: 7,
      speakerIds: ["2"],
      transcriptRevision: 3,
    });
  });

  it("caps prefix and suffix at 32 characters next to the quote", () => {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    const words = flattenWords([segment(0, "a", long, 0, 30), segment(0, "b", long, 30, 60)]);
    const anchor = buildAnchorFromWords(words, { start: 29, end: 30 }, 0);

    expect(anchor.exact).toBe("word29 word0");
    expect(anchor.prefix).toHaveLength(32);
    expect(anchor.prefix.endsWith("word27 word28")).toBe(true);
    expect(anchor.suffix).toHaveLength(32);
    expect(anchor.suffix.startsWith("word1 word2")).toBe(true);
    expect(anchor.speakerIds).toEqual(["a", "b"]);
    expect(buildAnchor(transcript, { start: 0, end: 0 }, 0).prefix).toBe("");
  });

  it("rejects ranges outside the transcript and bad revisions", () => {
    for (const range of [
      { start: -1, end: 2 },
      { start: 3, end: 2 },
      { start: 0, end: 13 },
      { start: 0.5, end: 2 },
      { start: Number.NaN, end: 2 },
    ]) {
      expect(() => buildAnchor(transcript, range, 0)).toThrow(RangeError);
    }
    expect(() => buildAnchor([], { start: 0, end: 0 }, 0)).toThrow(RangeError);
    expect(() => buildAnchor(transcript, { start: 0, end: 1 }, -1)).toThrow(RangeError);
  });
});

describe("tokenizeWords and word confidence", () => {
  it("splits text exactly as flattenWords counts it", () => {
    expect(tokenizeWords("  “Don’t   stop” — now ")).toEqual([
      { text: "“Don’t", norm: "don't" },
      { text: "stop”", norm: "stop" },
      { text: "now", norm: "now" },
    ]);
    expect(tokenizeWords(undefined)).toEqual([]);

    const words = flattenWords(transcript);
    const fromSegments = transcript.flatMap((s) =>
      s.entities?.length ? s.entities.flatMap((e) => tokenizeWords(e.text)) : tokenizeWords(s.text)
    );
    expect(fromSegments.map((t) => t.norm)).toEqual(words.map((w) => w.norm));
  });

  it("takes confidence from the entity when there are entities, otherwise from the segment", () => {
    const words = flattenWords([
      { ...segment(0, 1, "a b", 0, 1, [{ ...entity("a", 0, 0.5), confidence: 0.4 }, entity("b", 0.5, 1)]) },
      segment(1, 1, "c d", 1, 2),
    ]);
    expect(words.map((w) => w.confidence)).toEqual([0.4, undefined, 0.9, 0.9]);
    expect("confidence" in words[1]).toBe(false);
  });
});

describe("isAnchorOnRevision", () => {
  const anchor = buildAnchor(transcript, { start: 2, end: 4 }, 3);

  it("matches the revision, and the word range when a word count is given", () => {
    expect(isAnchorOnRevision(anchor, 3)).toBe(true);
    expect(isAnchorOnRevision(anchor, 4)).toBe(false);
    expect(isAnchorOnRevision(anchor, undefined)).toBe(false);
    expect(isAnchorOnRevision(null, 3)).toBe(false);
    expect(isAnchorOnRevision({ transcriptRevision: 3 }, 3)).toBe(true);
    expect(isAnchorOnRevision(anchor, 3, 13)).toBe(true);
    expect(isAnchorOnRevision(anchor, 3, 4)).toBe(false);
    expect(isAnchorOnRevision({ transcriptRevision: 3 }, 3, 13)).toBe(false);
  });
});
