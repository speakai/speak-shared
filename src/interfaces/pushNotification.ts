import type { MeetingPlatform } from '../enums/meeting.js';
import type {
  PushDataKey,
  PushNotificationAction,
  PushNotificationType,
  PushTapTarget,
} from '../enums/pushNotification.js';

export interface PushNotificationRegistryEntry {
  categoryId: string;
  androidChannelId: string;
  actions: readonly PushNotificationAction[];
  requiredDataKeys: readonly PushDataKey[];
  tapTarget: PushTapTarget;
}

export interface EntityPushNotificationPayload {
  type: `${PushNotificationType}`;
  uid: string;
  tapTarget: `${PushTapTarget}`;
  category: string;
  actions: string;
  mediaId?: string;
  recorderId?: string;
}

export type EntityPushFields = Partial<Record<`${PushDataKey}`, string>>;

export interface PushNotificationPayload {
  type: `${PushNotificationType}`;
  eventId: string;
  uid: string;
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
  uid: string;
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

export interface WebPushFields {
  title: string;
  message: string;
  tag: string;
}

export type WebPushData = WebPushFields;
