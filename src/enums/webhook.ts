export enum WebhookEvent {
  EmbedRecorderCreated = 'embed_recorder.created',
  EmbedRecorderDeleted = 'embed_recorder.deleted',
  EmbedRecorderRecordingReceived = 'embed_recorder.recording_received',
  MediaAnalyzed = 'media.analyzed',
  MediaCreated = 'media.created',
  MediaDeleted = 'media.deleted',
  MediaFailed = 'media.failed',
  MediaReanalyzed = 'media.reanalyzed',
  MediaUpdated = 'media.updated',
  TextAnalyzed = 'text.analyzed',
  TextCreated = 'text.created',
  TextDeleted = 'text.deleted',
  TextFailed = 'text.failed',
  TextReanalyzed = 'text.reanalyzed',
  MeetingAssistantStatus = 'meeting_assistant.status',
  ChatStatus = 'chat.status',
  CsvUploaded = 'csv.uploaded',
  CsvFailed = 'csv.failed',
}

export enum WebhookEventSource {
  Speak = 'speak',
  Zapier = 'zapier',
}
