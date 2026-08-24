/**
 * Notification Interfaces
 */

import {
  VoiceNotificationType,
  NotificationResourceType,
} from "../enums/notification.js";

/**
 * Notification entity
 */
export interface Notification {
  notificationId: string;
  userId: string;
  type: VoiceNotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
