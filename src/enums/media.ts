export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video',
  TEXT = 'text',
  MEDIA = 'media',
  CSV = 'csv',
}

export enum MediaState {
  NOT_UPLOADED = 'notUploaded',
  UPLOADED = 'uploaded',
  QUEUED = 'queued',
  PENDING_PAYMENT = 'pendingPayment',
  PREPARING = 'preparing',
  PREPARING_TRANSCRIPTION = 'preparingTranscription',
  PROCESSING = 'processing',
  TRANSLATION = 'translation',
  PREPARING_ANALYSIS = 'preparingAnalysis',
  PROCESSED = 'processed',
  DUBBING = 'dubbing',
  FAILED = 'failed',
  COMPLETE = 'complete',
  LIVE_TRANSCRIPT = 'liveTranscript',
}

export enum MediaPrivacyMode {
  PUBLIC = 'public',
  PRIVATE = 'private',
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
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  KILLED = 'killed',
}

export enum MediaProcessType {
  TRANSCRIPTION = 'transcription',
  DUBBING = 'dubbing',
  TRANSLATION = 'translation',
}

export enum ThumbnailStatus {
  PENDING = 'pending',
  CREATED = 'created',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  DELETED = 'deleted',
}

export enum ThumbnailOrigin {
  AUTO = 'auto',
  CUSTOM = 'custom',
}

export enum MediaUploadType {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  TEXT = 'text',
  ZAPIER = 'zapier',
  API = 'api',
  RECORDER = 'recorder',
  CSV = 'csv',
  ZOOM = 'zoom',
  WEB_SCRAPER = 'web-scraper',
  APP_RECORDER = 'app-recorder',
  MEETING_ASSISTANT = 'meeting-assistant',
  CHROME_EXTENSION = 'chrome-extension',
  TOOLS = 'tools',
  RETRANSCRIBE = 'retranscribe',
  SAMPLE = 'sample',
  TRANSLATION = 'translation',
  VOICE_AGENT = 'voice-agent',
  DESKTOP = 'desktop',
}
