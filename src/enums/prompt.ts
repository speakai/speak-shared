export enum PromptState {
  Initiated = 'initiated',
  Preparing = 'preparing',
  Processing = 'processing',
  Failed = 'failed',
  PendingPayment = 'pendingPayment',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Expired = 'expired',
  InProgress = 'inProgress',
  Streaming = 'streaming',
}

export enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
}

export enum PromptSource {
  Folder = 'folder',
  MediaFiles = 'mediaFiles',
  CsvFile = 'csvFile',
  KnowledgeBase = 'knowledgeBase',
  ExploreAnalytics = 'exploreAnalytics',
}

export enum ToolName {
  OpenSupport = 'open_support',
  CreateClip = 'create_clip',
  UpdateSpeakers = 'update_speakers',
  UpdateTranscription = 'update_transcription',
  SearchMedia = 'search_media',
  GenerateChart = 'generate_chart',
  ExportTranscription = 'export_transcription',
  CompareMedia = 'compare_media',
}

export enum FileType {
  Image = 'image',
  Csv = 'csv',
  Pdf = 'pdf',
  Docx = 'docx',
  Txt = 'txt',
  Zip = 'zip',
}
