import { WebhookEvent, WebhookEventSource, MediaState, PromptState } from '../enums/index.js';

export interface IWebhook {
  _id: string;
  webhookId?: string;
  callbackUrl: string;
  events: string[];
  description: string;
  source: WebhookEventSource;
  isActive: boolean;
  isDeleted: boolean;
  metaData?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebhookPayload {
  event: WebhookEvent;
  data: IWebhookEventData;
  timestamp: Date;
}

export interface IWebhookEventData {
  folderId?: string;
  mediaId?: string;
  mediaIds?: string[];
  state?: MediaState | PromptState | string;
  webhookMetaData?: unknown;
  meetingAssistantId?: string;
  meetingAssistantStatus?: string;
  recorderId?: string;
  promptId?: string;
  messageId?: string;
  prompt?: string;
  answer?: string;
  [key: string]: unknown;
}
