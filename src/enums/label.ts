export enum LabelSource {
  USER = 'user',
  SPEAK = 'speak',
}

export enum AnchorStatus {
  ACTIVE = 'active',
  SHIFTED = 'shifted',
  NEEDS_REVIEW = 'needs_review',
}

/** What a shared dashboard's viewers may do with labels */
export enum DashboardLabelsMode {
  VIEW = 'view',
  /** Reviewers chosen on the dashboard may also apply and remove labels */
  APPLY = 'apply',
}

/** What a shared dashboard's viewers may do with comments */
export enum DashboardCommentsMode {
  VIEW = 'view',
  /** Reviewers chosen on the dashboard may also comment and reply */
  REPLY = 'reply',
}
