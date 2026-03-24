export enum MeetingPlatform {
  GoogleMeet = 'googleMeet',
  Zoom = 'zoom',
  MicrosoftTeams = 'microsoftTeams',
  Webex = 'webex',
}

export enum MeetingStatus {
  WillJoin = 'willJoin',
  Scheduled = 'scheduled',
  Ready = 'ready',
  JoiningCall = 'joiningCall',
  InWaitingRoom = 'inWaitingRoom',
  InCallNotRecording = 'inCallNotRecording',
  RecordingPermissionDenied = 'recordingPermissionDenied',
  InCallRecording = 'inCallRecording',
  CallEnded = 'callEnded',
  Done = 'done',
  Fatal = 'fatal',
  AnalysisDone = 'analysisDone',
  Paused = 'paused',
  Resumed = 'resumed',
  Cancelled = 'cancelled',
  NotInvited = 'notInvited',
}

export enum MeetingRecordingMode {
  SpeakerView = 'speakerView',
  GalleryView = 'galleryView',
  GalleryViewV2 = 'galleryViewV2',
  AudioOnly = 'audioOnly',
}

export enum ScreenShareRecordingMode {
  Hide = 'hide',
  Beside = 'beside',
  Overlap = 'overlap',
}

export enum MeetingSummarySettings {
  Self = 'self',
  AllAttendees = 'allAttendees',
  None = 'none',
}

export enum MediaPlayerSettings {
  AllAttendees = 'allAttendees',
  TeamMembers = 'teamMembers',
  FolderTeamMembers = 'folderTeamMembers',
  Self = 'self',
  None = 'none',
}

export enum MeetingFilterEventCondition {
  Contains = 'contains',
  Equals = 'equals',
}

export enum MeetingAttendeeType {
  Host = 'host',
  Assistant = 'assistant',
  Self = 'self',
  Guest = 'guest',
}

export enum MeetingAssistantEventSource {
  Instant = 'instant',
  Assistant = 'assistant',
}
