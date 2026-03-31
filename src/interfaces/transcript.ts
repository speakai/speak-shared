// ── Core Transcript Types ──────────────────────────────────────────

export interface ITranscriptInstance {
  start: string | number;
  end: string | number;
  startInSec?: number;
  endInSec?: number;
  startChar?: number;
  endChar?: number;
}

export interface ITranscriptSegment {
  id: number;
  speakerId: string | number;
  text: string;
  confidence: number;
  language?: string;
  instances: ITranscriptInstance[];
  speaker?: {
    userId?: string;
    name?: string;
    email?: string | null;
  };
  score?: {
    compound: number;
    neg: number;
    neu: number;
    pos: number;
  };
  entities?: IWordEntity[];
  /** Whether this segment represents an entity-type annotation */
  isEntity?: boolean;
  /** Speaker email from user matching */
  email?: string | null;
  /** Speaker user ID from user matching */
  userId?: string | null;
}

export interface IWordEntity {
  id?: string | number;
  text?: string;
  speakerId?: string;
  confidence?: number;
  language?: string;
  speaker_confidence?: number;
  instances?: {
    startInSec?: number;
    endInSec?: number;
  };
}

export interface ISpeaker {
  id: number;
  name: string;
  wpm?: number;
  totalWords?: number;
  duration?: number;
  durationInPercentage?: number;
  instances?: ITranscriptInstance[];
}

// ── Paragraph — display grouping of segments by speaker ───────────

export interface IParagraph {
  id?: number;
  isEntity?: boolean;
  sentences: {
    id: number;
    text: string;
    start: string | number;
    end: string | number;
    confidence: number;
    entities?: IWordEntity[];
  }[];
  speakerId: string;
  speakerImg?: string;
  speaker?: {
    userId?: string;
    name?: string;
    email?: string | null;
  };
  language?: string;
  start: string | number;
  end: string | number;
  /** False for live interim paragraphs, true or absent for finalized */
  isFinal?: boolean;
}

// ── Transcript Editor State ───────────────────────────────────────

export interface IJobRevision {
  jobRevisionId: string;
  title: string;
  createdAt: string;
  isOriginal?: boolean;
}

export interface ITranscriptEditState {
  isEditing: boolean;
  isDirty: boolean;
  originalSentences?: ITranscriptSegment[];
  currentSentences?: ITranscriptSegment[];
}

export interface IFindReplaceState {
  searchQuery: string;
  replaceQuery: string;
  caseSensitive: boolean;
  useRegex: boolean;
  isActive: boolean;
  matches: Array<{ from: number; to: number }>;
  currentMatchIndex: number;
  matchCount: number;
}

// ── Context Menu & Copy ───────────────────────────────────────────

export interface IContextMenuInfo {
  type: 'selection' | 'word' | 'sentence' | 'block';
  text: string;
  start?: number;
  end?: number;
  speakerId?: string;
  paragraphId?: number;
  wordIndex?: number;
  /** Browser-only fields — typed as `unknown` here to avoid DOM dependency in shared.
   *  Consumers cast to `Range`, `MouseEvent`, `HTMLElement` in browser context. */
  selectionRange?: unknown;
  event?: unknown;
  domTarget?: unknown;
}

export interface ICopyOptions {
  includeSpeakers: boolean;
  includeTimestamps: boolean;
}

// ── Live Transcript State ─────────────────────────────────────────

export interface ITranscriptState {
  mediaId: string | null;
  words: IWordEntity[];
  lastApiCall: number;
  wordId: number;
  mediaCreated: boolean;
  mediaCreationInProgress: boolean;
  isConnectionClosed: boolean;
  pendingWords: IWordEntity[];
}
