import {
  LabelSource,
  AnchorStatus,
  DashboardLabelsMode,
  DashboardCommentsMode,
  MediaLabelAction,
  SpeakLabelSet,
} from '../enums/index.js';
import type { IMediaTranscriptMeta } from './media.js';
import type { ConfidenceBand } from './transcript.js';

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
  wordIndex: number;
  speakerId: string;
  /** The entity's confidence, or the segment's when it has no entities; absent when not measured */
  confidence?: number;
}

/** Inclusive range of flattenWords() indices */
export interface IWordRange {
  start: number;
  end: number;
}

/** A label or group as the API returns it; internal _id and companyId are never sent */
export interface ILabel {
  labelId: string;
  userId: string;
  /** A group holds labels and cannot be applied */
  isGroup: boolean;
  name: string;
  description?: string;
  /** #rrggbb; groups have none */
  color?: string;
  /** labelId of the parent group, one level only; null at the top level */
  parentId: string | null;
  source: LabelSource;
  isActive: boolean;
  mergedInto?: string;
  sortOrder: number;
  /** The creator's display name; absent when they are no longer a member of the company */
  authorName?: string;
  /** The creator's profile picture as a viewable URL; absent when they have none, are inactive or left the company */
  authorImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** An entry of GET /v1/labels: counts cover only media the caller may open */
export interface ILabelListItem extends ILabel {
  /** Labelled spans carrying this label; on a group, summed over its labels */
  usageCount: number;
  /** Distinct files carrying this label; on a group, files carrying any of its labels */
  fileCount: number;
  /** A group's labels that match the list filters; groups only */
  labels?: ILabelListItem[];
}

/** A labelled span as the API returns it; internal _id and companyId are never sent */
export interface IMediaLabel {
  mediaLabelId: string;
  /** The author's userId; absent on entries written from a dashboard link, which carry reviewerName instead */
  userId?: string;
  /** The author's display name: reviewerName for entries written from a dashboard link; absent when a member left the company */
  authorName?: string;
  /** The author's profile picture as a viewable URL; absent when they have none, are inactive or left the company */
  authorImage?: string;
  mediaId: string;
  labelIds: string[];
  anchor: IAnchor;
  status: AnchorStatus;
  /** Last anchor a person confirmed, kept while status is needs_review */
  lastResolved?: IAnchor;
  /** Set when a link viewer applied the label from a dashboard */
  dashboardId?: string;
  /** The name a link viewer wrote as; set with dashboardId */
  reviewerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A comment as the API returns it; internal _id and companyId are never sent */
export interface IMediaComment {
  commentId: string;
  /** The author's userId; absent on entries written from a dashboard link, which carry reviewerName instead */
  userId?: string;
  /** The author's display name: reviewerName for entries written from a dashboard link; absent when a member left the company */
  authorName?: string;
  /** The author's profile picture as a viewable URL; absent when they have none, are inactive or left the company */
  authorImage?: string;
  mediaId: string;
  /** Null means the comment is on the whole file */
  anchor: IAnchor | null;
  /** commentId of the thread starter, one level of replies; null on a starter */
  parentId: string | null;
  body: string;
  mediaLabelId?: string;
  /** Present only when anchor is set */
  status?: AnchorStatus;
  /** Last anchor a person confirmed, kept while status is needs_review */
  lastResolved?: IAnchor;
  isResolved: boolean;
  resolvedBy?: string;
  isDeleted: boolean;
  /** Set when a link viewer commented from a dashboard */
  dashboardId?: string;
  /** The name a link viewer wrote as; set with dashboardId */
  reviewerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A thread starter with its replies, oldest first; a deleted starter with replies has an empty body */
export interface IMediaCommentThread extends IMediaComment {
  replies: IMediaComment[];
}

/** GET /v1/media/:mediaId/labels */
export interface IMediaLabelsResponse extends IMediaTranscriptMeta {
  mediaLabels: IMediaLabel[];
}

/** GET /v1/media/:mediaId/comments */
export interface IMediaCommentsResponse extends IMediaTranscriptMeta {
  threads: IMediaCommentThread[];
}

/** Off and view-only unless the owner saved otherwise */
export interface IDashboardLabelsSettings {
  isEnabled: boolean;
  mode: DashboardLabelsMode;
  /** Label groups the dashboard shows and offers; empty means every active label */
  labelGroupIds: string[];
}

export interface IDashboardCommentsSettings {
  isEnabled: boolean;
  mode: DashboardCommentsMode;
}

/** The labels and comments keys of dashboard.settings, saved with POST/PUT /v1/dashboards */
export interface IDashboardAnnotationSettings {
  labels: IDashboardLabelsSettings;
  comments: IDashboardCommentsSettings;
}

export interface ILinkLabel {
  labelId: string;
  name: string;
  color?: string;
  description?: string;
  parentId: string | null;
}

/** annotationSettings on GET /v1/embed/insight for dashboard links */
export interface IPublicAnnotationSettings {
  labels: {
    isEnabled: boolean;
    mode: DashboardLabelsMode;
    groups: Array<{ labelId: string; name: string }>;
    /** Active labels of the allowed groups; empty while labels are off */
    labels: ILinkLabel[];
  };
  comments: { isEnabled: boolean; mode: DashboardCommentsMode };
  /** Names a viewer may write as: the dashboard's feedback submitters; empty unless a write mode is on */
  reviewers: string[];
  /** The viewer may type any name: exactly when feedback allows other submitters and lists at least one name */
  allowOtherReviewer: boolean;
}

/** A labelled span on GET /v1/embed/media/:mediaId/labels, narrowed to the labels the link shows */
export type ILinkMediaLabel = Pick<
  IMediaLabel,
  | 'mediaLabelId'
  | 'mediaId'
  | 'labelIds'
  | 'anchor'
  | 'status'
  | 'lastResolved'
  | 'dashboardId'
  | 'createdAt'
  | 'updatedAt'
> & {
  /** The author's display name, the reviewerName of a link entry, or "Team member" when a member has none or left the company; link holders never get userIds */
  authorName: string;
};

/** GET /v1/embed/media/:mediaId/labels */
export interface ILinkMediaLabelsResponse extends IMediaTranscriptMeta {
  /** Only the labels used on this media */
  labels: ILinkLabel[];
  mediaLabels: ILinkMediaLabel[];
}

/** A comment as a link viewer sees it: the author's name, no resolver or span link */
export type ILinkComment = Pick<
  IMediaComment,
  | 'commentId'
  | 'mediaId'
  | 'anchor'
  | 'parentId'
  | 'body'
  | 'status'
  | 'lastResolved'
  | 'isResolved'
  | 'isDeleted'
  | 'dashboardId'
  | 'createdAt'
  | 'updatedAt'
> & {
  /** The author's display name, the reviewerName of a link entry, or "Team member" when a member has none or left the company; link holders never get userIds */
  authorName: string;
};

/** A thread starter with its replies, oldest first */
export interface ILinkCommentThread extends ILinkComment {
  replies: ILinkComment[];
}

/** GET /v1/embed/media/:mediaId/comments */
export interface ILinkMediaCommentsResponse extends IMediaTranscriptMeta {
  threads: ILinkCommentThread[];
}

// ── Request bodies and responses of the labels and comments API ──

/** POST /v1/labels */
export interface ICreateLabelBody {
  name: string;
  /** A group holds labels; it takes no color or parentId */
  isGroup?: boolean;
  description?: string;
  color?: string;
  parentId?: string | null;
  sortOrder?: number;
}

/** PUT /v1/labels/:labelId; at least one key */
export type IUpdateLabelBody = Partial<Omit<ICreateLabelBody, 'isGroup'>>;

/** GET /v1/labels */
export interface ILabelListResponse {
  labels: ILabelListItem[];
}

/** POST /v1/labels/:labelId/archive; a group archives its labels too */
export interface ILabelArchiveResult {
  labelId: string;
  archivedCount: number;
}

/** POST /v1/labels/:labelId/restore */
export interface ILabelRestoreResult {
  labelId: string;
  restoredCount: number;
  /** Group labels left archived because an active label already uses the name */
  skippedCount: number;
}

/** POST /v1/labels/:labelId/merge */
export interface IMergeLabelBody {
  targetLabelId: string;
}

export interface ILabelMergeResult {
  labelId: string;
  mergedInto: string;
  /** Labelled spans moved to the target */
  movedCount: number;
}

/** POST /v1/labels/speak-sets */
export interface IAddSpeakLabelSetsBody {
  sets: SpeakLabelSet[];
}

export interface ISpeakLabelSetsResult {
  groups: ILabelListItem[];
  createdCount: number;
  /** Sets already added, so nothing was created for them */
  skippedSets: SpeakLabelSet[];
}

/** POST /v1/media/:mediaId/labels */
export interface ICreateMediaLabelBody {
  range: IWordRange;
  labelIds: string[];
  expectedTranscriptRevision: number;
}

/** PATCH /v1/media/:mediaId/labels/:mediaLabelId: change the labels, or review a passage that moved */
export type IUpdateMediaLabelBody =
  | { labelIds: string[] }
  | { action: MediaLabelAction.KEEP }
  | { action: MediaLabelAction.REPLACE; range: IWordRange; expectedTranscriptRevision: number };

/** DELETE /v1/media/:mediaId/labels/:mediaLabelId */
export interface IDeleteMediaLabelResult {
  mediaLabelId: string;
}

/** POST /v1/media/:mediaId/comments; a reply (parentId) takes no range or mediaLabelId */
export interface ICreateMediaCommentBody {
  body: string;
  range?: IWordRange;
  /** Required with range */
  expectedTranscriptRevision?: number;
  parentId?: string;
  mediaLabelId?: string;
}

/** PATCH /v1/media/:mediaId/comments/:commentId: edit the body, or resolve or reopen the thread */
export type IUpdateMediaCommentBody = { body: string } | { isResolved: boolean };

/** DELETE /v1/media/:mediaId/comments/:commentId */
export interface IDeleteMediaCommentResult {
  commentId: string;
}

/** The name a dashboard viewer writes as, one of IPublicAnnotationSettings.reviewers unless allowOtherReviewer; sent on every dashboard-link write */
export interface ILinkReviewerBody {
  reviewerName: string;
}

/** POST /v1/embed/media/:mediaId/labels */
export type ILinkCreateMediaLabelBody = ICreateMediaLabelBody & ILinkReviewerBody;

/** PATCH /v1/embed/media/:mediaId/labels/:mediaLabelId */
export interface ILinkUpdateMediaLabelBody extends ILinkReviewerBody {
  labelIds: string[];
}

/** POST /v1/embed/media/:mediaId/comments */
export type ILinkCreateMediaCommentBody = Omit<ICreateMediaCommentBody, 'mediaLabelId'> & ILinkReviewerBody;

/** PATCH /v1/embed/media/:mediaId/comments/:commentId */
export interface ILinkUpdateMediaCommentBody extends ILinkReviewerBody {
  body: string;
}

export interface IRangeConfidence {
  average: number;
  band: ConfidenceBand;
  lowWords: number;
}
