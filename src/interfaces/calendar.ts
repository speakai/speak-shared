import { CalendarType, MeetingPlatform, MeetingAttendeeType } from '../enums/index.js';

export interface ICalendarEvent {
  _id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  platform: MeetingPlatform;
  meetingURL: string;
  calendarType: CalendarType | string;
  eventStatus: string;
  accountId: string;
  meetingStatus: string;
  attendees: ICalendarAttendee[];
  isActive?: boolean;
}

export interface ICalendarAttendee {
  email: string;
  name: string;
  type: MeetingAttendeeType;
  events: { code: string; createdAt: Date }[];
}

export interface ICalendarSync {
  calendarId: string;
  calendarName: string;
  calendarType: CalendarType;
  email: string;
  isActive: boolean;
  isDeleted: boolean;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
