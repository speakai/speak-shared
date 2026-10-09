import {
  PUSH_NOTIFICATION_ACTIONS_DELIMITER,
  PUSH_NOTIFICATION_REGISTRY,
  PushNotificationAction,
  type PushNotificationType,
} from '../enums/pushNotification.js';
import type {
  AndroidPushData,
  AndroidPushFields,
  EntityPushFields,
  EntityPushNotificationType,
  EntityPushNotificationPayload,
  PushNotificationPayload,
  PushNotificationRegistryEntry,
  PushPayloadFields,
  WebPushData,
  WebPushFields,
} from '../interfaces/pushNotification.js';

const KNOWN_ACTIONS: ReadonlySet<string> = new Set(Object.values(PushNotificationAction));

export const getPushNotificationConfig = (
  type: PushNotificationType | `${PushNotificationType}`,
): PushNotificationRegistryEntry | undefined =>
  Object.prototype.hasOwnProperty.call(PUSH_NOTIFICATION_REGISTRY, type)
    ? PUSH_NOTIFICATION_REGISTRY[type as PushNotificationType]
    : undefined;

const requirePushNotificationConfig = (type: PushNotificationType): PushNotificationRegistryEntry => {
  const config = getPushNotificationConfig(type);
  if (!config) throw new Error(`Unknown push notification type: ${type}`);
  return config;
};

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

export const buildPushPayload = (
  type: PushNotificationType,
  fields: PushPayloadFields,
): PushNotificationPayload => {
  const config = requirePushNotificationConfig(type);
  return {
    type,
    ...fields,
    category: config.categoryId,
    actions: serializePushNotificationActions(config.actions),
  };
};

export const buildEntityPushPayload = (
  type: EntityPushNotificationType,
  fields: EntityPushFields,
): EntityPushNotificationPayload => {
  const config = requirePushNotificationConfig(type);
  const missing = config.requiredDataKeys.filter((key) => !fields[key]);
  if (missing.length > 0) {
    throw new Error(`Push notification ${type} is missing data keys: ${missing.join(', ')}`);
  }
  const data = Object.fromEntries(config.requiredDataKeys.map((key) => [key, fields[key]]));
  return {
    ...data,
    type,
    tapTarget: config.tapTarget,
    category: config.categoryId,
    actions: serializePushNotificationActions(config.actions),
  } as EntityPushNotificationPayload;
};

export const buildAndroidPushData = (
  type: PushNotificationType,
  fields: AndroidPushFields,
): AndroidPushData => {
  const config = requirePushNotificationConfig(type);
  return { ...fields, categoryId: config.categoryId, channelId: config.androidChannelId };
};

export const buildWebPushData = (type: PushNotificationType, fields: WebPushFields): WebPushData => {
  requirePushNotificationConfig(type);
  return { ...fields };
};

export const isPushForUser = (data: { uid?: unknown } | null | undefined, userId: string): boolean =>
  typeof data?.uid === 'string' && data.uid !== '' && data.uid === userId;
