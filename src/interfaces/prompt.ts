import { AssistantType, PromptState, MessageRole } from '../enums/index';

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
}
