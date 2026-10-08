import type {
  NotificationChannel,
  NotificationEventKey,
  NotificationSettingsGroup,
} from '../enums/notificationEvent.js';
import type { PushNotificationType } from '../enums/pushNotification.js';

export interface NotificationEventEntry {
  key: NotificationEventKey;
  group: NotificationSettingsGroup;
  preferencePath: `${NotificationSettingsGroup}.${string}`;
  channels: readonly NotificationChannel[];
  pushType?: PushNotificationType;
}
