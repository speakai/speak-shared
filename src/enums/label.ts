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
