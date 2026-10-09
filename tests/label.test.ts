import { describe, it, expect } from "vitest";
import { CommentListFilter } from "../src/enums/index.js";
import {
  DEFAULT_LABEL_COLOR,
  LABEL_COLOR_PRESETS,
  SPEAK_LABEL_SETS,
  labelNameKey,
  matchesCommentFilter,
  normalizeLabelName,
  rangeConfidence,
  reviewerNameKey,
} from "../src/utils/label.js";
import { hasAnchorsBehind } from "../src/utils/anchor.js";
import { confidenceBand, LOW_CONFIDENCE, VERY_LOW_CONFIDENCE } from "../src/utils/transcript.js";

describe("label name key", () => {
  it("treats names that differ only in case or spacing as the same label", () => {
    expect(normalizeLabelName("  Great   moment ")).toBe("Great moment");
    expect(labelNameKey("  Great \t moment ")).toBe(labelNameKey("great moment"));
    expect(labelNameKey("Great moment")).not.toBe(labelNameKey("Greatmoment"));
  });
});

describe("reviewer name key", () => {
  it("matches a dashboard reviewer name in any case, spacing or compatibility form, and nothing else", () => {
    expect(reviewerNameKey("  Ana \u00a0 REVIEWER ")).toBe(reviewerNameKey("ana reviewer"));
    expect(reviewerNameKey("\uff21na Reviewer")).toBe(reviewerNameKey("Ana Reviewer"));
    expect(reviewerNameKey("Ana Reviewer")).not.toBe(reviewerNameKey("Ana Reviewers"));
  });
});

describe("matchesCommentFilter", () => {
  const open = { isResolved: false, anchor: { transcriptRevision: 1 } as never };
  const resolvedOnFile = { isResolved: true, anchor: null };

  it("sorts threads into open, resolved and whole-file, and ALL keeps every thread", () => {
    expect([open, resolvedOnFile].map((thread) => matchesCommentFilter(thread, CommentListFilter.OPEN))).toEqual([true, false]);
    expect([open, resolvedOnFile].map((thread) => matchesCommentFilter(thread, CommentListFilter.RESOLVED))).toEqual([false, true]);
    expect([open, resolvedOnFile].map((thread) => matchesCommentFilter(thread, CommentListFilter.FILE))).toEqual([false, true]);
    expect([open, resolvedOnFile].map((thread) => matchesCommentFilter(thread, CommentListFilter.ALL))).toEqual([true, true]);
  });
});

describe("hasAnchorsBehind", () => {
  it("is true only while an anchor carries an older revision; whole-file comments never count", () => {
    expect(hasAnchorsBehind([{ transcriptRevision: 3 }, null], 3)).toBe(false);
    expect(hasAnchorsBehind([{ transcriptRevision: 2 }, null], 3)).toBe(true);
    expect(hasAnchorsBehind([], 3)).toBe(false);
  });
});

describe("label palette", () => {
  it("gives new labels and every Speak label set a colour the picker offers, distinct within each set", () => {
    const presets: readonly string[] = LABEL_COLOR_PRESETS;
    expect(DEFAULT_LABEL_COLOR).toBe(LABEL_COLOR_PRESETS[0]);
    for (const set of Object.values(SPEAK_LABEL_SETS)) {
      const colors = set.labels.map((label) => label.color);
      for (const color of colors) expect(presets).toContain(color);
      expect(new Set(colors).size).toBe(colors.length);
    }
  });
});

describe("rangeConfidence", () => {
  it("averages measured words in the inclusive range, takes the worst band, and is null when nothing is measured", () => {
    const confidences = [0.2, 0.9, undefined, 0.6, 0, 0.5, 1];
    expect(rangeConfidence(confidences, 1, 3)).toEqual({ average: 0.75, band: "low", lowWords: 1 });
    expect(rangeConfidence(confidences, 3, 6)).toEqual({ average: expect.closeTo(0.7), band: "very-low", lowWords: 2 });
    expect(rangeConfidence(confidences, 2, 2)).toBeNull();
    expect(rangeConfidence([], 0, 4)).toBeNull();
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
