import type { PushNotificationRegistryEntry } from '../interfaces/pushNotification.js';

export enum PushNotificationAction {
  JOIN = 'join',
  RECORD = 'record',
  OPEN_MEDIA = 'open-media',
}

export enum PushNotificationType {
  MEETING_REMINDER = 'meeting-reminder',
}

export enum AndroidPushDataKey {
  TITLE = 'title',
  MESSAGE = 'message',
  CATEGORY_ID = 'categoryId',
  CHANNEL_ID = 'channelId',
  TAG = 'tag',
}

export const PUSH_NOTIFICATION_ACTIONS_DELIMITER = ',';

export const PUSH_NOTIFICATION_REGISTRY: Readonly<
  Record<PushNotificationType, PushNotificationRegistryEntry>
> = {
  [PushNotificationType.MEETING_REMINDER]: {
    categoryId: 'MEETING_REMINDER',
    androidChannelId: 'meeting-reminders',
    actions: [PushNotificationAction.JOIN, PushNotificationAction.RECORD],
  },
};
