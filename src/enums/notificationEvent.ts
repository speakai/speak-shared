import type { NotificationEventEntry } from '../interfaces/notificationEvent.js';
import { PushNotificationType } from './pushNotification.js';

export enum NotificationChannel {
  EMAIL = 'email',
  WEB = 'web',
  MOBILE = 'mobile',
}

export enum NotificationSettingsGroup {
  MEETINGS = 'meetings',
  MEDIA = 'media',
  RECORDER = 'recorder',
  TRANSCRIPTION = 'transcription',
  USAGE = 'usage',
  MAGIC_PROMPT = 'magicPrompt',
}

export enum NotificationEventKey {
  MEETING_REMINDER = 'meeting-reminder',
  MEDIA_FAILED = 'media-failed',
  MEDIA_ANALYZED = 'media-analyzed',
  RECORDER_SUBMISSION = 'recorder-submission',
  RECORDER_DISABLED = 'recorder-disabled',
  TRANSCRIPTION_APPROVED = 'transcription-approved',
  TRANSCRIPTION_COMPLETED = 'transcription-completed',
  USAGE_BALANCE = 'usage-balance',
  MAGIC_PROMPT_COMPLETED = 'magic-prompt-completed',
}

export const NOTIFICATION_SETTINGS_GROUP_ORDER: readonly NotificationSettingsGroup[] = [
  NotificationSettingsGroup.MEETINGS,
  NotificationSettingsGroup.MEDIA,
  NotificationSettingsGroup.RECORDER,
  NotificationSettingsGroup.TRANSCRIPTION,
  NotificationSettingsGroup.USAGE,
  NotificationSettingsGroup.MAGIC_PROMPT,
];

const ALL_CHANNELS = [
  NotificationChannel.EMAIL,
  NotificationChannel.WEB,
  NotificationChannel.MOBILE,
] as const;
const PUSH_CHANNELS = [NotificationChannel.WEB, NotificationChannel.MOBILE] as const;
const EMAIL_ONLY = [NotificationChannel.EMAIL] as const;

export const NOTIFICATION_EVENTS: Readonly<Record<NotificationEventKey, NotificationEventEntry>> = {
  [NotificationEventKey.MEETING_REMINDER]: {
    key: NotificationEventKey.MEETING_REMINDER,
    group: NotificationSettingsGroup.MEETINGS,
    preferencePath: 'meetings.reminders',
    channels: PUSH_CHANNELS,
    pushType: PushNotificationType.MEETING_REMINDER,
  },
  [NotificationEventKey.MEDIA_FAILED]: {
    key: NotificationEventKey.MEDIA_FAILED,
    group: NotificationSettingsGroup.MEDIA,
    preferencePath: 'media.failed',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.MEDIA_FAILED,
  },
  [NotificationEventKey.MEDIA_ANALYZED]: {
    key: NotificationEventKey.MEDIA_ANALYZED,
    group: NotificationSettingsGroup.MEDIA,
    preferencePath: 'media.analyzed',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.MEDIA_ANALYZED,
  },
  [NotificationEventKey.RECORDER_SUBMISSION]: {
    key: NotificationEventKey.RECORDER_SUBMISSION,
    group: NotificationSettingsGroup.RECORDER,
    preferencePath: 'recorder.submission',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.RECORDER_SUBMISSION,
  },
  [NotificationEventKey.RECORDER_DISABLED]: {
    key: NotificationEventKey.RECORDER_DISABLED,
    group: NotificationSettingsGroup.RECORDER,
    preferencePath: 'recorder.disabled',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.RECORDER_DISABLED,
  },
  [NotificationEventKey.TRANSCRIPTION_APPROVED]: {
    key: NotificationEventKey.TRANSCRIPTION_APPROVED,
    group: NotificationSettingsGroup.TRANSCRIPTION,
    preferencePath: 'transcription.approved',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.TRANSCRIPTION_APPROVED,
  },
  [NotificationEventKey.TRANSCRIPTION_COMPLETED]: {
    key: NotificationEventKey.TRANSCRIPTION_COMPLETED,
    group: NotificationSettingsGroup.TRANSCRIPTION,
    preferencePath: 'transcription.completed',
    channels: ALL_CHANNELS,
    pushType: PushNotificationType.TRANSCRIPTION_COMPLETED,
  },
  [NotificationEventKey.USAGE_BALANCE]: {
    key: NotificationEventKey.USAGE_BALANCE,
    group: NotificationSettingsGroup.USAGE,
    preferencePath: 'usage.balance',
    channels: EMAIL_ONLY,
  },
  [NotificationEventKey.MAGIC_PROMPT_COMPLETED]: {
    key: NotificationEventKey.MAGIC_PROMPT_COMPLETED,
    group: NotificationSettingsGroup.MAGIC_PROMPT,
    preferencePath: 'magicPrompt.completed',
    channels: EMAIL_ONLY,
  },
};
