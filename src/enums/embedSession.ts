import type { IEmbedSessionEventEntry } from '../interfaces/embedSession.js';

export enum EmbedSessionEventCategory {
  LIFECYCLE = 'lifecycle',
  NAVIGATION = 'navigation',
  PLAYBACK = 'playback',
  CHAT = 'chat',
  ENGAGEMENT = 'engagement',
  IDENTITY = 'identity',
  SHARING = 'sharing',
}

export enum EmbedSessionEventType {
  SESSION_START = 'session_start',
  SESSION_RESUME = 'session_resume',
  SESSION_END = 'session_end',
  PAGE_VIEW = 'page_view',
  DASHBOARD_VIEW = 'dashboard_view',
  WIDGET_OPEN = 'widget_open',
  MEDIA_OPEN = 'media_open',
  MEDIA_CLOSE = 'media_close',
  CITATION_OPEN = 'citation_open',
  SEARCH = 'search',
  TRANSCRIPT_DOWNLOAD = 'transcript_download',
  MEDIA_DOWNLOAD = 'media_download',
  CLIP_SHARE = 'clip_share',
  EXPORT = 'export',
  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
  ENDED = 'ended',
  RATE_CHANGE = 'rate_change',
  CHAT_QUESTION = 'chat_question',
  CHAT_FEEDBACK = 'chat_feedback',
  HIDDEN = 'hidden',
  IDLE = 'idle',
  GATE_SHOWN = 'gate_shown',
  LEAD_CAPTURED = 'lead_captured',
  SIGNED_IN = 'signed_in',
}

export enum EmbedSessionEventSource {
  CLIENT = 'client',
  SERVER = 'server',
}

export enum EmbedSessionEndReason {
  PAGEHIDE = 'pagehide',
  IDLE_TIMEOUT = 'idle_timeout',
}

export enum EmbedSessionMediaOpenSource {
  LIST = 'list',
  CITATION = 'citation',
  SEARCH = 'search',
  WIDGET = 'widget',
  CHAT = 'chat',
  DIRECT = 'direct',
}

export enum EmbedSessionSearchScope {
  LIBRARY = 'library',
  DASHBOARD = 'dashboard',
  TRANSCRIPT = 'transcript',
}

export enum EmbedSessionChatFeedbackScale {
  THUMBS = 'thumbs',
}

export enum EmbedSessionTranscriptFormat {
  DOCX = 'docx',
  PDF = 'pdf',
  TXT = 'txt',
  SRT = 'srt',
  VTT = 'vtt',
  CLIPBOARD = 'clipboard',
}

export enum EmbedSessionExportKind {
  CHAT_ANSWER = 'chat_answer',
}

export enum EmbedSessionBotKind {
  RENDER = 'render',
  CRAWLER = 'crawler',
}

export enum EmbedViewerAuthMethod {
  EMAIL_GATE = 'email_gate',
  EMAIL_VERIFIED = 'email_verified',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  SPEAK_ACCOUNT = 'speak_account',
  SSO = 'sso',
}

export enum EmbedSessionTrafficFilter {
  ALL = 'all',
  PEOPLE = 'people',
  BOTS = 'bots',
}

export enum EmbedSessionViewerFilter {
  ALL = 'all',
  IDENTIFIED = 'identified',
  ANONYMOUS = 'anonymous',
}

export enum EmbedSessionDeviceFilter {
  ALL = 'all',
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

export enum EmbedSessionSort {
  STARTED_DESC = 'startedAt:desc',
  STARTED_ASC = 'startedAt:asc',
  ACTIVE_DESC = 'activeMs:desc',
  WATCHED_DESC = 'watchedMs:desc',
  QUESTIONS_DESC = 'questions:desc',
}

export const EMBED_SESSION_EVENTS: Readonly<Record<EmbedSessionEventType, IEmbedSessionEventEntry>> = {
  [EmbedSessionEventType.SESSION_START]: {
    category: EmbedSessionEventCategory.LIFECYCLE,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer opened the embed and a new session started.',
  },
  [EmbedSessionEventType.SESSION_RESUME]: {
    category: EmbedSessionEventCategory.LIFECYCLE,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer came back to the same session, for example after a refresh.',
  },
  [EmbedSessionEventType.SESSION_END]: {
    category: EmbedSessionEventCategory.LIFECYCLE,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer left the page or was inactive for too long, so the session ended.',
  },
  [EmbedSessionEventType.PAGE_VIEW]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer moved to another page inside the embed.',
  },
  [EmbedSessionEventType.DASHBOARD_VIEW]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer opened the dashboard.',
  },
  [EmbedSessionEventType.WIDGET_OPEN]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer opened a dashboard widget.',
  },
  [EmbedSessionEventType.MEDIA_OPEN]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer opened a media file.',
  },
  [EmbedSessionEventType.MEDIA_CLOSE]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer closed a media file.',
  },
  [EmbedSessionEventType.CITATION_OPEN]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer opened a citation from an AI answer.',
  },
  [EmbedSessionEventType.SEARCH]: {
    category: EmbedSessionEventCategory.NAVIGATION,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer searched the library, dashboard or transcript.',
  },
  [EmbedSessionEventType.TRANSCRIPT_DOWNLOAD]: {
    category: EmbedSessionEventCategory.SHARING,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer downloaded a transcript.',
  },
  [EmbedSessionEventType.MEDIA_DOWNLOAD]: {
    category: EmbedSessionEventCategory.SHARING,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer downloaded a media file.',
  },
  [EmbedSessionEventType.CLIP_SHARE]: {
    category: EmbedSessionEventCategory.SHARING,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer shared a clip.',
  },
  [EmbedSessionEventType.EXPORT]: {
    category: EmbedSessionEventCategory.SHARING,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer exported content.',
  },
  [EmbedSessionEventType.PLAY]: {
    category: EmbedSessionEventCategory.PLAYBACK,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer started playing a media file.',
  },
  [EmbedSessionEventType.PAUSE]: {
    category: EmbedSessionEventCategory.PLAYBACK,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer paused a media file.',
  },
  [EmbedSessionEventType.SEEK]: {
    category: EmbedSessionEventCategory.PLAYBACK,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer jumped to another point in a media file.',
  },
  [EmbedSessionEventType.ENDED]: {
    category: EmbedSessionEventCategory.PLAYBACK,
    source: EmbedSessionEventSource.CLIENT,
    description: 'A media file played to the end.',
  },
  [EmbedSessionEventType.RATE_CHANGE]: {
    category: EmbedSessionEventCategory.PLAYBACK,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer changed the playback speed.',
  },
  [EmbedSessionEventType.CHAT_QUESTION]: {
    category: EmbedSessionEventCategory.CHAT,
    source: EmbedSessionEventSource.SERVER,
    description: 'The viewer asked the AI a question.',
  },
  [EmbedSessionEventType.CHAT_FEEDBACK]: {
    category: EmbedSessionEventCategory.CHAT,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer rated an AI answer.',
  },
  [EmbedSessionEventType.HIDDEN]: {
    category: EmbedSessionEventCategory.ENGAGEMENT,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The page was in a background tab for more than a minute.',
  },
  [EmbedSessionEventType.IDLE]: {
    category: EmbedSessionEventCategory.ENGAGEMENT,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer did nothing on the page for more than a minute.',
  },
  [EmbedSessionEventType.GATE_SHOWN]: {
    category: EmbedSessionEventCategory.IDENTITY,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer was asked for their email before viewing.',
  },
  [EmbedSessionEventType.LEAD_CAPTURED]: {
    category: EmbedSessionEventCategory.IDENTITY,
    source: EmbedSessionEventSource.SERVER,
    description: 'The viewer entered their email to get access.',
  },
  [EmbedSessionEventType.SIGNED_IN]: {
    category: EmbedSessionEventCategory.IDENTITY,
    source: EmbedSessionEventSource.CLIENT,
    description: 'The viewer signed in to view the embed.',
  },
};
