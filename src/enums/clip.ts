export enum ClipState {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ClipGenerationSource {
  MANUAL = 'manual',
  CHAT = 'chat',
  AI = 'ai',
}
