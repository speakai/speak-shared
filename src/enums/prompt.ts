export enum PromptState {
  INITIATED = 'initiated',
  PREPARING = 'preparing',
  PROCESSING = 'processing',
  FAILED = 'failed',
  PENDING_PAYMENT = 'pendingPayment',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  IN_PROGRESS = 'inProgress',
  STREAMING = 'streaming',
}

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum PromptSource {
  FOLDER = 'folder',
  MEDIA_FILES = 'mediaFiles',
  CSV_FILE = 'csvFile',
  KNOWLEDGE_BASE = 'knowledgeBase',
  EXPLORE_ANALYTICS = 'exploreAnalytics',
}

export enum ToolName {
  OPEN_SUPPORT = 'open_support',
  CREATE_CLIP = 'create_clip',
  UPDATE_SPEAKERS = 'update_speakers',
  UPDATE_TRANSCRIPTION = 'update_transcription',
  SEARCH_MEDIA = 'search_media',
  GENERATE_CHART = 'generate_chart',
  EXPORT_TRANSCRIPTION = 'export_transcription',
  COMPARE_MEDIA = 'compare_media',
}

export enum FileType {
  IMAGE = 'image',
  CSV = 'csv',
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  ZIP = 'zip',
}

/** What one agent step on a chat turn represents — server, client and media-library each read/write this the same way. */
export enum ChatStepType {
  TOOL_CALLS = 'tool_calls',
  MESSAGE_CREATION = 'message_creation',
  THINKING = 'thinking',
  NEEDS_CONNECTION = 'needs_connection',
  NEEDS_CONFIRMATION = 'needs_confirmation',
  NEEDS_CLARIFICATION = 'needs_clarification',
}

/** HMAC-signed confirmation gate on a needs_confirmation step; walks awaiting -> approved | rejected | expired. */
export enum ChatStepConfirmationStatus {
  AWAITING = 'awaiting',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/** Clarification gate on a needs_clarification step. */
export enum ChatStepClarificationStatus {
  AWAITING = 'awaiting',
  ANSWERED = 'answered',
  SKIPPED = 'skipped',
}
