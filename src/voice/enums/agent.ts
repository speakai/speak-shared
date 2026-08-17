/**
 * Agent Status
 * Represents the lifecycle state of an agent
 */
export enum AgentStatus {
  /** Agent is being configured, not yet ready for use */
  DRAFT = "draft",
  /** Agent is processing (e.g., knowledge base being built) */
  PROCESSING = "processing",
  /** Agent is live and ready to handle conversations */
  ACTIVE = "active",
  /** Agent is paused/disabled */
  INACTIVE = "inactive",
}

/** Type alias for agent status values */
export type AgentStatusType = `${AgentStatus}`;

/** Array of all valid agent statuses */
export const AGENT_STATUSES = Object.values(AgentStatus) as AgentStatusType[];
