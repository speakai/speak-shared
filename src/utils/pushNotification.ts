import {
  PUSH_NOTIFICATION_ACTIONS_DELIMITER,
  PUSH_NOTIFICATION_REGISTRY,
  PushNotificationAction,
  type PushNotificationType,
} from '../enums/pushNotification.js';
import type { PushNotificationRegistryEntry } from '../interfaces/pushNotification.js';

const KNOWN_ACTIONS: ReadonlySet<string> = new Set(Object.values(PushNotificationAction));

export const getPushNotificationConfig = (
  type: PushNotificationType | `${PushNotificationType}`,
): PushNotificationRegistryEntry | undefined =>
  Object.prototype.hasOwnProperty.call(PUSH_NOTIFICATION_REGISTRY, type)
    ? PUSH_NOTIFICATION_REGISTRY[type as PushNotificationType]
    : undefined;

export const serializePushNotificationActions = (
  actions: readonly PushNotificationAction[],
): string => actions.join(PUSH_NOTIFICATION_ACTIONS_DELIMITER);

export const parsePushNotificationActions = (
  actions: string | null | undefined,
): PushNotificationAction[] =>
  (actions ?? '')
    .split(PUSH_NOTIFICATION_ACTIONS_DELIMITER)
    .map((action) => action.trim())
    .filter((action): action is PushNotificationAction => KNOWN_ACTIONS.has(action));
