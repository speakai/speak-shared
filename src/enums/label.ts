export enum LabelSource {
  USER = 'user',
  SPEAK = 'speak',
}

export enum AnchorStatus {
  ACTIVE = 'active',
  SHIFTED = 'shifted',
  NEEDS_REVIEW = 'needs_review',
}

export enum DashboardLabelsMode {
  VIEW = 'view',
  /** Reviewers chosen on the dashboard may also apply and remove labels */
  APPLY = 'apply',
}

export enum DashboardCommentsMode {
  VIEW = 'view',
  /** Reviewers chosen on the dashboard may also comment and reply */
  REPLY = 'reply',
}

/** status query of GET /v1/labels */
export enum LabelListStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  ALL = 'all',
}

/** action of PATCH /v1/media/:mediaId/labels/:mediaLabelId when reviewing a moved passage */
export enum MediaLabelAction {
  KEEP = 'keep',
  REPLACE = 'replace',
}

/** filter query of GET /v1/media/:mediaId/comments */
export enum CommentListFilter {
  ALL = 'all',
  OPEN = 'open',
  RESOLVED = 'resolved',
  FILE = 'file',
}

/** Keys of the ready-made label sets POST /v1/labels/speak-sets accepts */
export enum SpeakLabelSet {
  SALES_QA = 'sales_qa',
  RESEARCH = 'research',
  MEETINGS = 'meetings',
  TRANSCRIPT_FEEDBACK = 'transcript_feedback',
}
