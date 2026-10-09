import { CommentListFilter, SpeakLabelSet, UserRole } from '../enums/index.js';
import type { IMediaComment, IRangeConfidence } from '../interfaces/label.js';
import type { ConfidenceBand } from '../interfaces/transcript.js';
import type { IUserPermission } from '../interfaces/user.js';
import { confidenceBand } from './transcript.js';

// Limits the server enforces on labels and comments; front ends and the MCP read the same values.
export const LABEL_NAME_MAX = 80;
export const LABEL_DESCRIPTION_MAX = 500;
export const LABEL_SORT_ORDER_MAX = 1_000_000;
export const MAX_LABELS_PER_SPAN = 20;
export const MEDIA_COMMENT_BODY_MAX = 5000;
export const MAX_DASHBOARD_LABEL_GROUPS = 100;

/** labelId, mediaLabelId and commentId; also keeps the id safe inside a query filter */
export const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** #rrggbb, any case; stored lowercase */
export const LABEL_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

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

/** Colour a label gets when it is created without one */
export const DEFAULT_LABEL_COLOR = LABEL_COLOR_PRESETS[0];

export interface ISpeakLabelSetDefinition {
  /** Name of the label group the set creates */
  name: string;
  labels: ReadonlyArray<{ name: string; color: string }>;
}

/** Ready-made label groups POST /v1/labels/speak-sets creates; colours are presets so the picker shows them as selected */
export const SPEAK_LABEL_SETS: Readonly<Record<SpeakLabelSet, ISpeakLabelSetDefinition>> = {
  [SpeakLabelSet.SALES_QA]: {
    name: 'Sales QA',
    labels: [
      { name: 'Unprofessional', color: '#ea580c' },
      { name: 'Slang', color: '#d97706' },
      { name: 'Objection', color: '#7c3aed' },
      { name: 'Great moment', color: '#65a30d' },
      { name: 'Compliance risk', color: '#e11d48' },
    ],
  },
  [SpeakLabelSet.RESEARCH]: {
    name: 'Research',
    labels: [
      { name: 'Pain point', color: '#e11d48' },
      { name: 'Motivation', color: '#65a30d' },
      { name: 'Quote for report', color: '#4f46e5' },
      { name: 'Surprise', color: '#db2777' },
      { name: 'Follow-up', color: '#0284c7' },
    ],
  },
  [SpeakLabelSet.MEETINGS]: {
    name: 'Meetings',
    labels: [
      { name: 'Decision', color: '#65a30d' },
      { name: 'Action item', color: '#4f46e5' },
      { name: 'Risk', color: '#e11d48' },
      { name: 'Open question', color: '#d97706' },
    ],
  },
  [SpeakLabelSet.TRANSCRIPT_FEEDBACK]: {
    name: 'Transcript feedback',
    labels: [
      { name: 'Wrong split', color: '#ea580c' },
      { name: 'Misheard word', color: '#e11d48' },
      { name: 'Wrong speaker', color: '#7c3aed' },
      { name: 'Bad translation', color: '#0284c7' },
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

/**
 * The key two dashboard reviewer names are compared by: compatibility forms folded (NFKC), so a
 * look-alike width or space cannot pass for another name, then trimmed, spaces collapsed, lowercased.
 * The server stores it as reviewerKey and matches own entries on it.
 */
export function reviewerNameKey(name: string): string {
  return labelNameKey(name.normalize("NFKC"));
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

export function rangeConfidence(confidences: (number | undefined)[], start: number, end: number): IRangeConfidence | null {
  const measured: number[] = [];
  for (let i = Math.max(0, start); i <= end && i < confidences.length; i++) {
    const value = confidences[i];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1) measured.push(value);
  }
  if (measured.length === 0) return null;
  const bands = measured.map(confidenceBand);
  const band: ConfidenceBand = bands.includes('very-low') ? 'very-low' : bands.includes('low') ? 'low' : 'ok';
  return {
    average: measured.reduce((sum, value) => sum + value, 0) / measured.length,
    band,
    lowWords: bands.filter((b) => b !== 'ok').length,
  };
}
