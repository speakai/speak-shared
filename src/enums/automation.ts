export enum AutomationTrigger {
  FOLDERS = 'folders',
  TAGS = 'tags',
  KEYWORDS = 'keywords',
  // Reserved for the Composio integration slice; native execution ignores it for now.
  COMPOSIO = 'composio',
}

export enum AutomationAction {
  MAGIC_PROMPT = 'magic-prompt',
  TRANSLATION = 'translation',
}

/**
 * The kinds of step a graph automation (schemaVersion >= 2) can contain. Legacy
 * single-action rows are projected to a one-step graph at read/execution time.
 */
export enum AutomationStepType {
  // The trigger node — always the first step in a graph; describes what fires the
  // automation. Non-executable: the runner skips it (the indexed matching key
  // stays top-level on the automation).
  TRIGGER = 'trigger',
  MAGIC_PROMPT = 'magic-prompt',
  TRANSLATION = 'translation',
  COMPOSIO_ACTION = 'composio-action',
  FILTER = 'filter',
}

/** Lifecycle status of an automation run and of each step within it. */
export enum AutomationRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  // Filter step did not match: the run stops here without being an error.
  KILLED = 'killed',
}

/**
 * The data type flowing between trigger and steps in a graph. Used by the catalog
 * to validate that each step accepts what the previous one emits.
 */
export enum AutomationIOType {
  FILE = 'file',
  MEDIA = 'media',
  INSIGHT = 'insight',
  NOTIFY = 'notify',
}

export enum AutomationRunType {
  INSTANT = 'instant',
  SCHEDULE = 'schedule',
}

export enum AutomationScheduleTimePeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last7days',
  LAST_14_DAYS = 'last14days',
  THIS_WEEK = 'thisWeek',
}

export enum AssistantType {
  RESEARCHER = 'researcher',
  MARKETER = 'marketer',
  SALES = 'sales',
  GENERAL = 'general',
  RECRUITER = 'recruiter',
  CUSTOM = 'custom',
}
