export enum CalendarType {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
}

export enum EventStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum AutoJoinStatus {
  NONE = 'none',
  INVITE_ASSISTANT = 'inviteAssistant',
  ALL_MEETINGS = 'allMeetings',
  HOST = 'host',
  SPEAK_TEAM_MEMBERS_NOT_HOST = 'speakTeamMembersNotHost',
}
