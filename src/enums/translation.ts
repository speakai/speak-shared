export enum TranslationState {
  NOTFOUND = 'notFound',
  INITIATE = 'initiate',
  PENDING_TRANSCRIPTION = 'pendingTranscription',
  PENDING_PAYMENT = 'pendingPayment',
  PROCESSING = 'processing',
  DUBBING = 'dubbing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export enum DubbingState {
  DUBBING = 'dubbing',
  UPLOADING = 'uploading',
  COMPLETE = 'complete',
  FAILED = 'failed',
}
