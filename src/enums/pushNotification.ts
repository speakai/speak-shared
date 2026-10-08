import type { PushNotificationRegistryEntry } from '../interfaces/pushNotification.js';

export const MEETING_REMINDER_LEAD_MINUTES = 2;

export enum PushNotificationAction {
  JOIN = 'join',
  RECORD = 'record',
  OPEN_MEDIA = 'open-media',
}

export enum PushNotificationType {
  MEETING_REMINDER = 'meeting-reminder',
  MEDIA_FAILED = 'media-failed',
  MEDIA_ANALYZED = 'media-analyzed',
  TRANSCRIPTION_APPROVED = 'transcription-approved',
  TRANSCRIPTION_COMPLETED = 'transcription-completed',
  RECORDER_SUBMISSION = 'recorder-submission',
  RECORDER_DISABLED = 'recorder-disabled',
}

export enum PushTapTarget {
  MEETING = 'meeting',
  MEDIA = 'media',
  RECORDER = 'recorder',
}

export enum PushDataKey {
  EVENT_ID = 'eventId',
  UID = 'uid',
  TITLE = 'title',
  PLATFORM = 'platform',
  MEETING_URL = 'meetingURL',
  START_TIME = 'startTime',
  MEDIA_ID = 'mediaId',
  RECORDER_ID = 'recorderId',
}

export enum AndroidPushDataKey {
  TITLE = 'title',
  MESSAGE = 'message',
  CATEGORY_ID = 'categoryId',
  CHANNEL_ID = 'channelId',
  TAG = 'tag',
}

export enum WebPushDataKey {
  TITLE = 'title',
  MESSAGE = 'message',
  TAG = 'tag',
}

export const PUSH_NOTIFICATION_ACTIONS_DELIMITER = ',';

export const PUSH_NOTIFICATION_ACTION_LABELS: Readonly<Record<PushNotificationAction, string>> = {
  [PushNotificationAction.JOIN]: 'Join',
  [PushNotificationAction.RECORD]: 'Record',
  [PushNotificationAction.OPEN_MEDIA]: 'Open',
};

const MEDIA_PUSH_DATA_KEYS = [PushDataKey.UID, PushDataKey.MEDIA_ID] as const;
const RECORDER_PUSH_DATA_KEYS = [PushDataKey.UID, PushDataKey.RECORDER_ID] as const;

export const PUSH_NOTIFICATION_REGISTRY: Readonly<
  Record<PushNotificationType, PushNotificationRegistryEntry>
> = {
  [PushNotificationType.MEETING_REMINDER]: {
    categoryId: 'MEETING_REMINDER',
    androidChannelId: 'meeting-reminders',
    actions: [PushNotificationAction.JOIN, PushNotificationAction.RECORD],
    requiredDataKeys: [
      PushDataKey.EVENT_ID,
      PushDataKey.UID,
      PushDataKey.TITLE,
      PushDataKey.PLATFORM,
      PushDataKey.MEETING_URL,
      PushDataKey.START_TIME,
    ],
    tapTarget: PushTapTarget.MEETING,
  },
  [PushNotificationType.MEDIA_FAILED]: {
    categoryId: 'MEDIA_FAILED',
    androidChannelId: 'media-updates',
    actions: [],
    requiredDataKeys: MEDIA_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.MEDIA,
  },
  [PushNotificationType.MEDIA_ANALYZED]: {
    categoryId: 'MEDIA_ANALYZED',
    androidChannelId: 'media-updates',
    actions: [],
    requiredDataKeys: MEDIA_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.MEDIA,
  },
  [PushNotificationType.TRANSCRIPTION_APPROVED]: {
    categoryId: 'TRANSCRIPTION_APPROVED',
    androidChannelId: 'transcription-updates',
    actions: [],
    requiredDataKeys: MEDIA_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.MEDIA,
  },
  [PushNotificationType.TRANSCRIPTION_COMPLETED]: {
    categoryId: 'TRANSCRIPTION_COMPLETED',
    androidChannelId: 'transcription-updates',
    actions: [],
    requiredDataKeys: MEDIA_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.MEDIA,
  },
  [PushNotificationType.RECORDER_SUBMISSION]: {
    categoryId: 'RECORDER_SUBMISSION',
    androidChannelId: 'recorder-updates',
    actions: [],
    requiredDataKeys: RECORDER_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.RECORDER,
  },
  [PushNotificationType.RECORDER_DISABLED]: {
    categoryId: 'RECORDER_DISABLED',
    androidChannelId: 'recorder-updates',
    actions: [],
    requiredDataKeys: RECORDER_PUSH_DATA_KEYS,
    tapTarget: PushTapTarget.RECORDER,
  },
};
