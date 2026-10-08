import { DevicePlatform } from '../enums/auth.js';
import {
  NOTIFICATION_EVENTS,
  NotificationChannel,
  type NotificationSettingsGroup,
} from '../enums/notificationEvent.js';
import type { NotificationEventEntry } from '../interfaces/notificationEvent.js';

export const getNotificationChannelForPlatform = (
  platform: DevicePlatform | `${DevicePlatform}` | null | undefined,
): NotificationChannel | undefined => {
  if (platform === DevicePlatform.IOS || platform === DevicePlatform.ANDROID) {
    return NotificationChannel.MOBILE;
  }
  if (platform === DevicePlatform.WEB) return NotificationChannel.WEB;
  return undefined;
};

export const getNotificationEventsByGroup = (
  group: NotificationSettingsGroup,
): NotificationEventEntry[] =>
  Object.values(NOTIFICATION_EVENTS).filter((event) => event.group === group);
