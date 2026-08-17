/**
 * Structured Output Interfaces
 * Defines the contract for structured output extraction from conversations
 */

import { StructuredOutputType } from "../enums/structuredOutput.js";

/**
 * Property schema for object/array types
 */
export interface PropertySchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  allowedValues?: string[];
}

/**
 * Core structured output definition
 */
export interface StructuredOutput {
  structuredOutputId: string;
  userId: string;
  name: string;
  description: string;
  type: StructuredOutputType;
  schemaDescription: string;
  properties?: PropertySchema[];
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  agentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a structured output
 */
export interface StructuredOutputInput {
  name: string;
  description: string;
  type: StructuredOutputType;
  schemaDescription: string;
  properties?: PropertySchema[];
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

/**
 * Extracted value stored in conversation analysis
 */
export interface ExtractedStructuredOutput {
  name: string;
  type: StructuredOutputType;
  value: any;
  extractedAt: Date;
  extractedValue?: any;
  manuallyEdited?: boolean;
  editedAt?: Date;
  editedBy?: string;
  allowedValues?: string[];
}

/**
 * Map of extracted outputs by structuredOutputId
 */
export interface StructuredOutputsMap {
  [structuredOutputId: string]: ExtractedStructuredOutput;
}
