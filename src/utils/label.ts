import { CommentListFilter, SpeakLabelSet, UserRole } from '../enums/index.js';
import type { IMediaComment } from '../interfaces/label.js';
import type { IUserPermission } from '../interfaces/user.js';

// Limits the server enforces on labels and comments; front ends and the MCP read the same values.
export const LABEL_NAME_MAX = 80;
export const LABEL_DESCRIPTION_MAX = 500;
export const LABEL_SORT_ORDER_MAX = 1_000_000;
export const MAX_LABELS_PER_SPAN = 20;
export const MEDIA_COMMENT_BODY_MAX = 5000;
export const MAX_DASHBOARD_REVIEWERS = 200;
export const MAX_DASHBOARD_LABEL_GROUPS = 100;

/** labelId, mediaLabelId and commentId; also keeps the id safe inside a query filter */
export const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** #rrggbb, any case; stored lowercase */
export const LABEL_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
/** A user's 24-character hex ObjectId, such as a dashboard reviewerUserId */
export const USER_ID_PATTERN = /^[0-9a-f]{24}$/i;

/** Colour a label gets when it is created without one */
export const DEFAULT_LABEL_COLOR = '#6366f1';

/** Colours the label colour picker offers, in order */
export const LABEL_COLOR_PRESETS = [
  '#0d9488',
  '#d97706',
  '#e11d48',
  '#0284c7',
  '#7c3aed',
  '#65a30d',
  '#ea580c',
  '#db2777',
  '#4f46e5',
  '#0891b2',
  '#475569',
  '#92400e',
] as const;

export interface ISpeakLabelSetDefinition {
  /** Name of the label group the set creates */
  name: string;
  labels: ReadonlyArray<{ name: string; color: string }>;
}

/** Ready-made label groups POST /v1/labels/speak-sets creates */
export const SPEAK_LABEL_SETS: Readonly<Record<SpeakLabelSet, ISpeakLabelSetDefinition>> = {
  [SpeakLabelSet.SALES_QA]: {
    name: 'Sales QA',
    labels: [
      { name: 'Unprofessional', color: '#f97316' },
      { name: 'Slang', color: '#eab308' },
      { name: 'Objection', color: '#8b5cf6' },
      { name: 'Great moment', color: '#22c55e' },
      { name: 'Compliance risk', color: '#ef4444' },
    ],
  },
  [SpeakLabelSet.RESEARCH]: {
    name: 'Research',
    labels: [
      { name: 'Pain point', color: '#ef4444' },
      { name: 'Motivation', color: '#22c55e' },
      { name: 'Quote for report', color: '#6366f1' },
      { name: 'Surprise', color: '#ec4899' },
      { name: 'Follow-up', color: '#0ea5e9' },
    ],
  },
  [SpeakLabelSet.MEETINGS]: {
    name: 'Meetings',
    labels: [
      { name: 'Decision', color: '#22c55e' },
      { name: 'Action item', color: '#6366f1' },
      { name: 'Risk', color: '#ef4444' },
      { name: 'Open question', color: '#eab308' },
    ],
  },
  [SpeakLabelSet.TRANSCRIPT_FEEDBACK]: {
    name: 'Transcript feedback',
    labels: [
      { name: 'Wrong split', color: '#f97316' },
      { name: 'Misheard word', color: '#ef4444' },
      { name: 'Wrong speaker', color: '#8b5cf6' },
      { name: 'Bad translation', color: '#0ea5e9' },
    ],
  },
};

export type ILabelPermissionDefaults = Required<Pick<IUserPermission, 'labels' | 'comments'>>;

// Frozen because owner and admin share this one object
const ALL_LABEL_PERMISSIONS: ILabelPermissionDefaults = Object.freeze({
  labels: Object.freeze({ create: true, update: true, delete: true, assign: true }),
  comments: Object.freeze({ create: true, update: true, delete: true }),
});

/** Labels and comments permissions a user gets by role; also the fallback for users saved before these groups existed */
export const LABEL_PERMISSION_DEFAULTS: Readonly<Record<UserRole, ILabelPermissionDefaults>> = {
  [UserRole.OWNER]: ALL_LABEL_PERMISSIONS,
  [UserRole.ADMIN]: ALL_LABEL_PERMISSIONS,
  [UserRole.MEMBER]: {
    labels: { create: false, update: false, delete: false, assign: true },
    comments: { create: true, update: true, delete: false },
  },
};

/** A label name as stored: trimmed, with runs of whitespace collapsed to one space */
export function normalizeLabelName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** The key two label names are compared by when checking for a duplicate; the server stores it as nameLower */
export function labelNameKey(name: string): string {
  return normalizeLabelName(name).toLowerCase();
}

/** Whether a comment thread belongs under a comments filter, by its starter; ALL matches every thread */
export function matchesCommentFilter(
  thread: Pick<IMediaComment, 'isResolved'> & { anchor?: IMediaComment['anchor'] },
  filter: CommentListFilter
): boolean {
  if (filter === CommentListFilter.OPEN) return !thread.isResolved;
  if (filter === CommentListFilter.RESOLVED) return thread.isResolved;
  if (filter === CommentListFilter.FILE) return !thread.anchor;
  return true;
}
