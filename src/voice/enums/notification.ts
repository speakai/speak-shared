/**
 * Notification Types
 */

export type NotificationType =
  | "agent_created"
  | "agent_updated"
  | "agent_deleted"
  | "conversation_recorded"
  | "ai_usage_charged"
  | "low_credits"
  | "tool_connected"
  | "tool_expiry_warning"
  | "tool_disconnected";

export type NotificationResourceType =
  | "agent"
  | "conversation"
  | "integration";
