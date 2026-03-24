export enum WebhookEvent {
  EMBED_RECORDER_CREATED = 'embed_recorder.created',
  EMBED_RECORDER_DELETED = 'embed_recorder.deleted',
  EMBED_RECORDER_RECORDING_RECEIVED = 'embed_recorder.recording_received',
  MEDIA_ANALYZED = 'media.analyzed',
  MEDIA_CREATED = 'media.created',
  MEDIA_DELETED = 'media.deleted',
  MEDIA_FAILED = 'media.failed',
  MEDIA_REANALYZED = 'media.reanalyzed',
  MEDIA_UPDATED = 'media.updated',
  TEXT_ANALYZED = 'text.analyzed',
  TEXT_CREATED = 'text.created',
  TEXT_DELETED = 'text.deleted',
  TEXT_FAILED = 'text.failed',
  TEXT_REANALYZED = 'text.reanalyzed',
  MEETING_ASSISTANT_STATUS = 'meeting_assistant.status',
  CHAT_STATUS = 'chat.status',
  CSV_UPLOADED = 'csv.uploaded',
  CSV_FAILED = 'csv.failed',
}

export enum WebhookEventSource {
  SPEAK = 'speak',
  ZAPIER = 'zapier',
}
