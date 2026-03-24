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
