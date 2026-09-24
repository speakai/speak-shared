/**
 * Voice Agent Question Interfaces
 * Shared types for the questions a voice agent asks during a call
 */

import {
  DataCollectionFieldType,
  DataCollectionCategory,
  CollectionMethod,
  NoResponseBehavior,
} from "../enums/dataCollection.js";

/**
 * Validation configuration for a field
 */
export interface ValidationConfig {
  pattern?: string; // Regex pattern for validation
  minLength?: number; // Minimum text length
  maxLength?: number; // Maximum text length
  min?: number; // Minimum number value
  max?: number; // Maximum number value
  allowedValues?: string[]; // For choice type - list of valid options
  customValidation?: string; // Custom validation logic (future use)
}

/**
 * Field configuration (template defaults or agent overrides)
 */
export interface FieldConfig {
  displayLabel: string; // Short name spoken/logged in confirmations (e.g., "Email Address")
  question: string; // What the agent asks (e.g., "What's your email?")
  confirmationText?: string; // Confirmation message (e.g., "Got it, ${value}")
  validationPrompt?: string; // What to say if validation fails
  validation?: ValidationConfig; // Validation rules
}

/**
 * Question Template (global, reusable)
 */
export interface QuestionTemplate {
  templateId: string;
  userId?: string; // null for system templates
  name: string; // Template name
  description: string; // Template description
  category: DataCollectionCategory;
  fieldType: DataCollectionFieldType;
  defaultConfig: FieldConfig;
  isSystemTemplate: boolean; // Built-in vs user-created
  isPublic: boolean; // Share in marketplace (future)
  tags: string[]; // For search/filtering
  usageCount: number; // How many agents use this
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom configuration (agent-level overrides)
 */
export interface CustomFieldConfig {
  displayLabel?: string;
  question?: string;
  confirmationText?: string;
  validationPrompt?: string;
  validation?: Partial<ValidationConfig>;
}

/**
 * Agent Question (mapping a template to an agent)
 */
export interface AgentQuestion {
  fieldId: string;
  agentId: string;
  templateId: string;
  customConfig?: CustomFieldConfig; // Overrides template defaults
  required: boolean; // Is this question required?
  maxPromptAttempts: number; // Maximum number of times the agent should ask
  noResponseBehavior: NoResponseBehavior; // What to do if user does not answer
  triggerCondition?: string; // For conditional questions
  order: number; // Display order
  enabled: boolean; // Is question active?
  /** Points at a general company Field this question's answer maps to; undefined until mapped or backfilled. */
  mappedFieldId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resolved Agent Question (template + agent config merged)
 */
export interface ResolvedAgentQuestion {
  fieldId: string;
  agentId: string;
  templateId: string;
  template: QuestionTemplate;
  resolvedConfig: FieldConfig; // Merged config
  required: boolean;
  maxPromptAttempts: number;
  noResponseBehavior: NoResponseBehavior;
  triggerCondition?: string;
  order: number;
  enabled: boolean;
  hasCustomizations: boolean; // Has agent-level overrides?
}

/**
 * Collection event stored in conversation metadata
 */
export interface CollectionEvent {
  fieldId?: string;
  fieldName: string;
  value: any;
  method: CollectionMethod;
  timestamp: string;
}

/**
 * Collected data entry
 */
export interface CollectedFieldData {
  value: any; // The collected value
  collectedAt: string; // When it was collected
  method: CollectionMethod; // How it was collected
  confirmed: boolean; // Has user confirmed this value?
  attempts: number; // How many validation attempts
}

/**
 * Collection state for a conversation
 */
export interface CollectionState {
  [fieldName: string]: CollectedFieldData;
}

/**
 * Request to add a question to an agent
 */
export interface AddFieldToAgentRequest {
  templateId: string;
  customConfig?: CustomFieldConfig;
  required?: boolean;
  maxPromptAttempts?: number;
  noResponseBehavior?: NoResponseBehavior;
  triggerCondition?: string;
  order?: number;
  mappedFieldId?: string;
}

/**
 * Request to update an agent question
 */
export interface UpdateAgentFieldRequest {
  customConfig?: CustomFieldConfig;
  required?: boolean;
  maxPromptAttempts?: number;
  noResponseBehavior?: NoResponseBehavior;
  triggerCondition?: string;
  order?: number;
  enabled?: boolean;
  mappedFieldId?: string;
}

/**
 * Request to reorder questions
 */
export interface ReorderFieldsRequest {
  fieldOrders: Array<{
    fieldId: string;
    order: number;
  }>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Collection progress
 */
export interface CollectionProgress {
  totalFields: number;
  collectedFields: number;
  missingRequired: string[]; // Field names of missing required fields
  percentComplete: number;
}
