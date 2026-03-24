export enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Text = 'text',
  Media = 'media',
  Csv = 'csv',
}

export enum MediaState {
  NotUploaded = 'notUploaded',
  Uploaded = 'uploaded',
  Queued = 'queued',
  PendingPayment = 'pendingPayment',
  Preparing = 'preparing',
  PreparingTranscription = 'preparingTranscription',
  Processing = 'processing',
  Translation = 'translation',
  PreparingAnalysis = 'preparingAnalysis',
  Processed = 'processed',
  Dubbing = 'dubbing',
  Failed = 'failed',
  Complete = 'complete',
  LiveTranscript = 'liveTranscript',
}

export enum MediaPrivacyMode {
  Public = 'public',
  Private = 'private',
}

export enum MediaInsightType {
  Arts = 'arts',
  Brands = 'brands',
  Cardinals = 'cardinals',
  Dates = 'dates',
  Events = 'events',
  Geopolitical = 'geopolitical',
  Keywords = 'keywords',
  Languages = 'languages',
  Laws = 'laws',
  Locations = 'locations',
  Money = 'money',
  Nationalities = 'nationalities',
  Ordinals = 'ordinals',
  People = 'people',
  Percentages = 'percentages',
  Products = 'products',
  Quantities = 'quantities',
  Times = 'times',
  Topics = 'topics',
  Transcript = 'transcript',
  Addresses = 'addresses',
}

export enum MediaInsightStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Killed = 'killed',
}

export enum MediaProcessType {
  Transcription = 'transcription',
  Dubbing = 'dubbing',
  Translation = 'translation',
}
