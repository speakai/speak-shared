import { MeetingPlatform, MeetingStatus, MeetingAttendeeType } from '../enums/index';

export interface IMeetingAttendee {
  email: string;
  name: string;
  type: MeetingAttendeeType;
  events: { code: string; createdAt: Date }[];
}

export interface IMeetingEvent {
  _id: string;
  meetingAssistantEventId: string;
  meetingURL: string;
  title: string;
  description?: string;
  meetingLanguage: string;
  meetingAssistantId: string;
  mediaId?: string;
  platform: MeetingPlatform;
  currentStatus: MeetingStatus;
  startTime: Date;
  endTime?: Date;
  tags: string[];
  attendees: IMeetingAttendee[];
  folderId?: string;
  speakers: { timestamp: number; name: string }[];
  history: IMeetingEventHistory[];
  createdAt?: Date;
}

export interface IMeetingEventHistory {
  status: MeetingStatus;
  createdAt: Date;
  code: string;
  message: string;
}

export interface IMeetingScheduleRequest {
  meetingURL: string;
  title: string;
  meetingDate?: Date;
  meetingLanguage?: string;
  tags?: string[];
}
