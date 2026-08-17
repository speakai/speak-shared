/**
 * Demo Distribution Enums
 */

export enum ProspectStatus {
  PENDING = "pending",
  AGENT_CREATED = "agent_created",
  OUTREACH_SENT = "outreach_sent",
  DEMO_VIEWED = "demo_viewed",
  DEMO_ENGAGED = "demo_engaged",
  CONVERTED = "converted",
  DEAD = "dead",
}

/** Numeric rank for auto-advancement — only advance forward, never regress */
export const PROSPECT_STATUS_RANK: Record<ProspectStatus, number> = {
  [ProspectStatus.PENDING]: 0,
  [ProspectStatus.AGENT_CREATED]: 1,
  [ProspectStatus.OUTREACH_SENT]: 2,
  [ProspectStatus.DEMO_VIEWED]: 3,
  [ProspectStatus.DEMO_ENGAGED]: 4,
  [ProspectStatus.CONVERTED]: 5,
  [ProspectStatus.DEAD]: 6,
};

export const PROSPECT_STATUSES = Object.values(ProspectStatus);

export enum DemoEventType {
  PAGE_LOADED = "page_loaded",
  CALL_STARTED = "call_started",
  CALL_ENDED = "call_ended",
  CTA_CLICKED = "cta_clicked",
  RETURN_VISIT = "return_visit",
}

export const DEMO_EVENT_TYPES = Object.values(DemoEventType);

export enum UserType {
  USER = "user",
  DEMO = "demo",
}

export const USER_TYPES = Object.values(UserType);
