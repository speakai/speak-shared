import { LabelSource, AnchorStatus, DashboardLabelsMode, DashboardCommentsMode } from '../enums/index.js';

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
  /** The creator's profile picture as a viewable URL; absent when they have none or are no longer a member */
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
  userId: string;
  /** The author's display name; absent when they are no longer a member of the company */
  authorName?: string;
  /** The author's profile picture as a viewable URL; absent when they have none or are no longer a member */
  authorImage?: string;
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

/** A comment as the API returns it; internal _id and companyId are never sent */
export interface IMediaComment {
  commentId: string;
  userId: string;
  /** The author's display name; absent when they are no longer a member of the company */
  authorName?: string;
  /** The author's profile picture as a viewable URL; absent when they have none or are no longer a member */
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
  /** Set when a reviewer commented from a dashboard */
  dashboardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A thread starter with its replies, oldest first; a deleted starter with replies has an empty body */
export interface IMediaCommentThread extends IMediaComment {
  replies: IMediaComment[];
}

/** GET /v1/media/:mediaId/labels */
export interface IMediaLabelsResponse {
  transcriptRevision: number;
  mediaLabels: IMediaLabel[];
}

/** GET /v1/media/:mediaId/comments */
export interface IMediaCommentsResponse {
  transcriptRevision: number;
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
  /** Team members a viewer may write labels and comments as; active members of the company */
  reviewerUserIds: string[];
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

/** A reviewer a dashboard viewer may write as; names only, never emails */
export interface ILinkMember {
  userId: string;
  name: string;
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
  /** Empty unless a write mode is on */
  reviewers: ILinkMember[];
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
  | 'userId'
  | 'dashboardId'
  | 'createdAt'
  | 'updatedAt'
> & {
  /** The author's display name, or "Team member" when they have none or left the company */
  authorName: string;
  /** The author's profile picture as a viewable URL; absent when they have none or are no longer a member */
  authorImage?: string;
};

/** GET /v1/embed/media/:mediaId/labels */
export interface ILinkMediaLabelsResponse {
  transcriptRevision: number;
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
  | 'userId'
  | 'dashboardId'
  | 'createdAt'
  | 'updatedAt'
> & {
  /** The author's display name, or "Team member" when they have none or left the company */
  authorName: string;
  /** The author's profile picture as a viewable URL; absent when they have none or are no longer a member */
  authorImage?: string;
};

/** A thread starter with its replies, oldest first */
export interface ILinkCommentThread extends ILinkComment {
  replies: ILinkComment[];
}

/** GET /v1/embed/media/:mediaId/comments */
export interface ILinkMediaCommentsResponse {
  transcriptRevision: number;
  threads: ILinkCommentThread[];
}
