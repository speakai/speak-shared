import type { MeetingPlatform } from '../enums/meeting.js';
import type {
  PushNotificationAction,
  PushNotificationType,
} from '../enums/pushNotification.js';

export interface PushNotificationRegistryEntry {
  categoryId: string;
  androidChannelId: string;
  actions: readonly PushNotificationAction[];
}

export interface PushNotificationPayload {
  type: `${PushNotificationType}`;
  eventId: string;
  title: string;
  platform: `${MeetingPlatform}`;
  meetingURL: string;
  startTime: string;
  category: string;
  actions: string;
}

export interface AndroidPushData {
  title: string;
  message: string;
  categoryId: string;
  channelId: string;
  tag: string;
}

export interface PushNotificationPreferences {
  meetingReminders: boolean;
}

export interface PushPayloadFields {
  eventId: string;
  title: string;
  platform: MeetingPlatform;
  meetingURL: string;
  startTime: string;
}

export interface AndroidPushFields {
  title: string;
  message: string;
  tag: string;
}
