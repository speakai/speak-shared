export enum AutomationTrigger {
  FOLDERS = 'folders',
  TAGS = 'tags',
  KEYWORDS = 'keywords',
}

export enum AutomationAction {
  MAGIC_PROMPT = 'magic-prompt',
  TRANSLATION = 'translation',
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
