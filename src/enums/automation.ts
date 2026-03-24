export enum AutomationTrigger {
  Folders = 'folders',
  Tags = 'tags',
  Keywords = 'keywords',
}

export enum AutomationAction {
  MagicPrompt = 'magic-prompt',
  Translation = 'translation',
}

export enum AutomationRunType {
  Instant = 'instant',
  Schedule = 'schedule',
}

export enum AutomationScheduleTimePeriod {
  Today = 'today',
  Yesterday = 'yesterday',
  Last7Days = 'last7days',
  Last14Days = 'last14days',
  ThisWeek = 'thisWeek',
}

export enum AssistantType {
  Researcher = 'researcher',
  Marketer = 'marketer',
  Sales = 'sales',
  General = 'general',
  Recruiter = 'recruiter',
  Custom = 'custom',
}
