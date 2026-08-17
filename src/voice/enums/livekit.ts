/**
 * LiveKit Types
 */

export type LiveKitMessageType =
  | "user_message"
  | "agent_message"
  | "system_message";

export enum LiveKitDataMessageType {
  // Existing message types (locked contract)
  USER_MESSAGE       = "user_message",
  AGENT_MESSAGE      = "agent_message",
  AGENT_STATE        = "agent_state",
  USER_STATE         = "user_state",
  // Session lifecycle
  SESSION_WARNING    = "session_warning",
  CALL_ENDING        = "call_ending",
  // Transfer status
  TRANSFER_STARTED   = "transfer_started",
  TRANSFER_COMPLETED = "transfer_completed",
  TRANSFER_FAILED    = "transfer_failed",
  // Canvas / content sharing
  CANVAS_SHOW        = "canvas_show",
  CANVAS_CLEAR       = "canvas_clear",
  CANVAS_COMPLETED   = "canvas_completed",
  // Web search state
  WEB_SEARCH_START   = "web_search_start",
  WEB_SEARCH_END     = "web_search_end",
  // Tool call state (live-UI frames for a Composio tool running)
  TOOL_CALL_START    = "tool_call_start",
  TOOL_CALL_END      = "tool_call_end",
  // Resource sharing
  RESOURCE_LINK      = "resource_link",
  // Data collection
  DATA_COLLECTION_COMPLETE = "data_collection_complete",
  // Avatar lifecycle
  AVATAR_DEGRADED_CAPACITY = "avatar_degraded_capacity",
}
