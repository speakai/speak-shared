export enum WebhookEvent {
  'embed_recorder.created' = 'embed_recorder.created',
  'embed_recorder.deleted' = 'embed_recorder.deleted',
  'embed_recorder.recording_received' = 'embed_recorder.recording_received',

  'media.analyzed' = 'media.analyzed',
  'media.created' = 'media.created',
  'media.deleted' = 'media.deleted',
  'media.failed' = 'media.failed',
  'media.reanalyzed' = 'media.reanalyzed',
  'media.updated' = 'media.updated',

  'text.analyzed' = 'text.analyzed',
  'text.created' = 'text.created',
  'text.deleted' = 'text.deleted',
  'text.failed' = 'text.failed',
  'text.reanalyzed' = 'text.reanalyzed',

  'meeting_assistant.status' = 'meeting_assistant.status',

  'chat.status' = 'chat.status',

  'csv.uploaded' = 'csv.uploaded',
  'csv.failed' = 'csv.failed',
}

export enum WebhookEventSource {
  SPEAK = 'speak',
  ZAPIER = 'zapier',
}
