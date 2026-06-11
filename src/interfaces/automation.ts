import {
  AutomationTrigger,
  AutomationAction,
  AutomationRunType,
  AutomationRunStatus,
  AutomationScheduleTimePeriod,
  AssistantType,
  AllowedValuesMode,
  StepType,
} from '../enums/index.js';

export interface IAutomationMagicPromptConfig {
  title: string;
  assistantType: AssistantType;
  assistantTemplateId: string;
  prompt: string;
  fieldId?: string;
  fieldIds?: string[];
  isIndividualFolder?: boolean;
  allowedValues?: string[];
  allowedValuesMode?: AllowedValuesMode;
  otherValues?: boolean;
  notApplicableValues?: string;
}

export interface IAutomationTranslationConfig {
  targetLanguage: string;
}

export interface IAutomationAction {
  type: AutomationAction;
  magicPrompt: IAutomationMagicPromptConfig;
  translation: IAutomationTranslationConfig;
}

export interface IAutomationTrigger {
  type: AutomationTrigger;
  folderIds: string[];
  values: string[];
  provider?: 'speak' | 'composio';
  app?: string;
  triggerSlug?: string;
}

export interface IAutomationFilterRule {
  field: string;
  op: string;
  value?: string | number;
}

export interface IAutomationStep {
  stepId: string;
  stepType: StepType;
  magicPrompt?: IAutomationMagicPromptConfig;
  translation?: IAutomationTranslationConfig;
  composio?: {
    app: string;
    action: string;
    connectedAccountId?: string;
    argsTemplate?: Record<string, unknown>;
    destructive?: boolean;
    acknowledged?: boolean;
  };
  filter?: {
    logic: 'AND' | 'OR';
    rules: IAutomationFilterRule[];
  };
  dependsOn?: string[];
}

export interface IAutomation {
  _id: string;
  automationId: string;
  name: string;
  description: string;
  isActive: boolean;
  isUpdated: boolean;
  isDeleted: boolean;
  runType: AutomationRunType;
  schemaVersion?: number;
  trigger: IAutomationTrigger;
  action: IAutomationAction;
  steps?: IAutomationStep[];
  schedule: {
    timePeriod: AutomationScheduleTimePeriod;
    repeatAt: string;
  };
  actionHistory: {
    type: AutomationAction;
    id: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAutomationRunStep {
  stepId: string;
  stepType: StepType;
  status: AutomationRunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  attemptCount?: number;
  output?: Record<string, unknown>;
  error?: string;
}

export interface IAutomationRun {
  runId: string;
  automationId: string;
  companyId: string;
  userId: string;
  schemaVersion: number;
  externalEventId?: string;
  status: AutomationRunStatus;
  trigger: IAutomationTrigger;
  awaitingMediaId?: string;
  nextStepId?: string;
  steps: IAutomationRunStep[];
  createdAt: Date;
  updatedAt: Date;
}
