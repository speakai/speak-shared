export const MEETING_LINK_MAX_LENGTH = 2048;

export const MEETING_LINK_HOST_DOMAINS = ['zoom.us', 'zoomgov.com', 'webex.com', 'teams.microsoft.us'] as const;

export const MEETING_LINK_EXACT_HOSTS = ['meet.google.com', 'teams.microsoft.com', 'teams.live.com'] as const;

export enum MeetingPlatform {
  GOOGLE_MEET = 'googleMeet',
  ZOOM = 'zoom',
  MICROSOFT_TEAMS = 'microsoftTeams',
  WEBEX = 'webex',
}

export const MEETING_PLATFORM_LABELS: Readonly<Record<MeetingPlatform, string>> = {
  [MeetingPlatform.ZOOM]: 'Zoom',
  [MeetingPlatform.GOOGLE_MEET]: 'Google Meet',
  [MeetingPlatform.MICROSOFT_TEAMS]: 'Microsoft Teams',
  [MeetingPlatform.WEBEX]: 'Webex',
};

export enum MeetingStatus {
  WILL_JOIN = 'willJoin',
  SCHEDULED = 'scheduled',
  READY = 'ready',
  JOINING_CALL = 'joiningCall',
  IN_WAITING_ROOM = 'inWaitingRoom',
  IN_CALL_NOT_RECORDING = 'inCallNotRecording',
  RECORDING_PERMISSION_DENIED = 'recordingPermissionDenied',
  IN_CALL_RECORDING = 'inCallRecording',
  CALL_ENDED = 'callEnded',
  DONE = 'done',
  FATAL = 'fatal',
  ANALYSIS_DONE = 'analysisDone',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  CANCELLED = 'cancelled',
  NOT_INVITED = 'notInvited',
}

export enum MeetingRecordingMode {
  SPEAKER_VIEW = 'speakerView',
  GALLERY_VIEW = 'galleryView',
  GALLERY_VIEW_V2 = 'galleryViewV2',
  AUDIO_ONLY = 'audioOnly',
}

export enum ScreenShareRecordingMode {
  HIDE = 'hide',
  BESIDE = 'beside',
  OVERLAP = 'overlap',
}

export enum MeetingSummarySettings {
  SELF = 'self',
  ALL_ATTENDEES = 'allAttendees',
  NONE = 'none',
}

export enum MediaPlayerSettings {
  ALL_ATTENDEES = 'allAttendees',
  TEAM_MEMBERS = 'teamMembers',
  FOLDER_TEAM_MEMBERS = 'folderTeamMembers',
  SELF = 'self',
  NONE = 'none',
}

export enum MeetingFilterEventCondition {
  CONTAINS = 'contains',
  EQUALS = 'equals',
}

export enum MeetingAttendeeType {
  HOST = 'host',
  ASSISTANT = 'assistant',
  SELF = 'self',
  GUEST = 'guest',
}

export enum MeetingAssistantEventSource {
  INSTANT = 'instant',
  ASSISTANT = 'assistant',
}
