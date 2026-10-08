import { describe, it, expect } from "vitest";
import { CommentListFilter } from "../src/enums/index.js";
import {
  DEFAULT_LABEL_COLOR,
  LABEL_COLOR_PRESETS,
  SPEAK_LABEL_SETS,
  labelNameKey,
  matchesCommentFilter,
  normalizeLabelName,
  reviewerNameKey,
} from "../src/utils/label.js";
import { hasAnchorsBehind } from "../src/utils/anchor.js";

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
