export enum AutomationTrigger {
  FOLDERS = "folders",
  TAGS = "tags",
  KEYWORDS = "keywords",
  COMPOSIO = "composio",
  WEBHOOK = "webhook",
}

export enum AutomationAction {
  MAGIC_PROMPT = "magic-prompt",
  TRANSLATION = "translation",
}

export enum AutomationStepType {
  TRIGGER = "trigger",
  MAGIC_PROMPT = "magic-prompt",
  TRANSLATION = "translation",
  COMPOSIO_ACTION = "composio-action",
  FILTER = "filter",
  SPEAK_UPLOAD = "speak-upload",
  // Native notification step (in-app / email / Slack). Non-terminal once the DAG runner ships.
  NOTIFY = "notify",
  // Outbound HTTP call to an external URL (token-templated body/headers).
  OUTBOUND_WEBHOOK = "outbound-webhook",
  // Branch step: evaluates rules and routes execution down the matching ('true'/'false') edge.
  CONDITION = "condition",
}

export enum AutomationRunStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  KILLED = "killed",
}

export enum AutomationIOType {
  FILE = "file",
  MEDIA = "media",
  INSIGHT = "insight",
  NOTIFY = "notify",
  DATA = "data",
}

export enum AutomationRunType {
  INSTANT = "instant",
  SCHEDULE = "schedule",
}

export enum AutomationScheduleTimePeriod {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_7_DAYS = "last7days",
  LAST_14_DAYS = "last14days",
  THIS_WEEK = "thisWeek",
}

export enum AssistantType {
  RESEARCHER = "researcher",
  MARKETER = "marketer",
  SALES = "sales",
  GENERAL = "general",
  RECRUITER = "recruiter",
  CUSTOM = "custom",
}
