import {
  AutomationTrigger,
  AutomationAction,
  AutomationRunType,
  AutomationScheduleTimePeriod,
  AssistantType,
  AllowedValuesMode,
} from '../enums/index';

export interface IAutomationAction {
  type: AutomationAction;
  magicPrompt: {
    title: string;
    assistantType: AssistantType;
    assistantTemplateId: string;
    prompt: string;
    fieldId?: string;
    isIndividualFolder?: boolean;
    allowedValues?: string[];
    allowedValuesMode?: AllowedValuesMode;
    otherValues?: boolean;
    notApplicableValues?: string;
  };
  translation: {
    targetLanguage: string;
  };
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
  trigger: {
    type: AutomationTrigger;
    folderIds: string[];
    values: string[];
  };
  action: IAutomationAction;
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
