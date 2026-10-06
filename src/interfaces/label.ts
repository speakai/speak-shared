import { LabelSource, AnchorStatus } from '../enums/index.js';

// ── Anchor — a span of transcript words, shared by labels and comments ──

export interface IAnchor {
  /** Index of the first word in flattenWords() order at transcriptRevision */
  startWord: number;
  /** Index of the last word (inclusive) */
  endWord: number;
  /** The quoted words, joined by single spaces */
  exact: string;
  /** Up to 32 characters of text before the quote */
  prefix: string;
  /** Up to 32 characters of text after the quote */
  suffix: string;
  /** Time of the first word; a sanity check only, word positions are primary */
  startInSec: number;
  /** Time of the last word; a sanity check only, word positions are primary */
  endInSec: number;
  speakerIds: string[];
  transcriptRevision: number;
}

/** One transcript word as counted by flattenWords() */
export interface IFlatWord {
  text: string;
  /** normalizeWord(text), used for matching across edits */
  norm: string;
  startInSec: number;
  endInSec: number;
  /** Position of the segment in the transcript array (segment ids are not unique) */
  segmentIndex: number;
  /** Position of the word within its segment */
  wordIndex: number;
  speakerId: string;
}

/** Inclusive range of flattenWords() indices */
export interface IWordRange {
  start: number;
  end: number;
}

// ── Label — company-wide list entry (model Label, collection labels) ──

export interface ILabel {
  _id: string;
  labelId: string;
  companyId: string;
  /** Creator */
  userId: string;
  /** A group holds labels and cannot be applied */
  isGroup: boolean;
  name: string;
  description?: string;
  /** #rrggbb; groups have none */
  color?: string;
  /** labelId of the parent group, one level only */
  parentId?: string;
  source: LabelSource;
  /** False when archived */
  isActive: boolean;
  /** labelId this label was merged into */
  mergedInto?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Media Label — labels applied to a transcript span (collection medialabels) ──

export interface IMediaLabel {
  _id: string;
  mediaLabelId: string;
  companyId: string;
  userId: string;
  mediaId: string;
  labelIds: string[];
  anchor: IAnchor;
  status: AnchorStatus;
  /** Last anchor a person confirmed, kept while status is needs_review */
  lastResolved?: IAnchor;
  /** Set when a reviewer applied the label from a dashboard */
  dashboardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Media Comment — comment thread on a span or whole file (collection mediacomments) ──

export interface IMediaComment {
  _id: string;
  commentId: string;
  companyId: string;
  userId: string;
  mediaId: string;
  /** Null means the comment is on the whole file */
  anchor: IAnchor | null;
  /** commentId of the thread starter, one level of replies */
  parentId?: string;
  body: string;
  mediaLabelId?: string;
  /** Present only when anchor is set */
  status?: AnchorStatus;
  isResolved: boolean;
  isDeleted: boolean;
  /** Set when a reviewer commented from a dashboard */
  dashboardId?: string;
  createdAt: Date;
  updatedAt: Date;
}
