import {
  AssistantType,
  PromptState,
  MessageRole,
  ChatStepType,
  ChatStepConfirmationStatus,
  ChatStepClarificationStatus,
} from '../enums/index.js';

export interface IPromptRequest {
  mediaIds: string[];
  prompt: string;
  assistantType?: AssistantType;
  assistantTemplateId?: string;
  folderId?: string;
  folderIds?: string[];
  tags?: string[];
  speakers?: string[];
  isEmbedPlayer?: boolean;
  embedToken?: string;
  fieldId?: string;
  isIndividualPrompt?: boolean;
  title?: string;
  isStream?: boolean;
}

export interface IPromptResponse {
  promptId: string;
  messageId: string;
  state: PromptState;
  answer?: string;
  isError: boolean;
  message: string;
  totalMedia?: number;
  references?: IPromptReference[];
}

export interface IPromptReference {
  mediaId: string;
  name: string;
  folderId: string;
  sourceUrl: string;
  type: string;
  tags: string[];
  score: number;
  sentences: {
    speaker: string;
    startTime: string;
    endTime: string;
    text: string;
    link: string;
    score: number;
  }[];
}

/** Prompt history item as returned by embed/library insight APIs */
export interface IPromptHistoryItem {
  _id: string;
  title: string;
  answer: string;
  state: string;
  references: IPromptReference[];
  createdAt: string;
}

/** Lightweight chat message for UI state */
export interface IChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
  references?: IPromptReference[];
  promptId?: string;
  state?: string;
}

/**
 * One agent step recorded on a chat turn — a thinking note, a tool call, or a gate awaiting
 * user action. Server, client and media-library each read/write this shape independently today;
 * this is the canonical form all three should converge on.
 */
export interface IChatStep {
  id: string;
  typeId: string;
  type: ChatStepType;
  status?: PromptState;
  answer?: string;
  outputs?: unknown;
  /** Echoed verbatim back on confirm; the server recomputes a hash and rejects tampering. */
  args?: unknown;
  provider?: string;
  connectUrl?: string;
  externalId?: string;
  confirmation?: {
    /** Scrubbed server-side on any read path (history/messages) — only present on the live turn that minted it. */
    token?: string;
    nonce: string;
    expiresAt: number;
    status: ChatStepConfirmationStatus;
  };
  clarification?: {
    question: string;
    options?: string[];
    status: ChatStepClarificationStatus;
    userReply?: string;
    expiresAt: number;
  };
}

export interface IPromptMessage {
  messageId: string;
  role: MessageRole;
  content: string;
  state: PromptState;
  prompt: string;
  answer: string;
  references?: IPromptReference[];
  createdAt: Date;
  completedAt?: Date;
  feedback?: {
    score: number;
    reason: string;
    createdAt: Date;
  };
  failure?: {
    message: string;
    code: number;
    attempt: number;
  };
  /** The agent's step-by-step trail for this turn. Absent (not empty) when the caller isn't allowed to see it. */
  steps?: IChatStep[];
}
