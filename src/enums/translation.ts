export enum TranslationState {
  NotFound = 'notFound',
  Initiate = 'initiate',
  PendingTranscription = 'pendingTranscription',
  PendingPayment = 'pendingPayment',
  Processing = 'processing',
  Dubbing = 'dubbing',
  Complete = 'complete',
  Failed = 'failed',
}

export enum DubbingState {
  Dubbing = 'dubbing',
  Uploading = 'uploading',
  Complete = 'complete',
  Failed = 'failed',
}
