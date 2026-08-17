/**
 * Data Collection Enums
 * Shared enums for data collection field types, categories, and timing
 */

/**
 * Field types for data collection
 */
export enum DataCollectionFieldType {
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  CHOICE = 'choice',
  URL = 'url',
}

/**
 * Categories for organizing templates
 */
export enum DataCollectionCategory {
  CONTACT = 'contact',
  BOOKING = 'booking',
  QUALIFICATION = 'qualification',
  PAYMENT = 'payment',
  CUSTOM = 'custom',
}

/**
 * Method used to collect the data
 */
export enum CollectionMethod {
  VOICE = 'voice',      // Collected via voice input
  TEXT = 'text',        // Collected via text input
  UI = 'ui',            // Collected via UI element (button, date picker, etc.)
}

/**
 * Blocking mode for required fields
 */
export enum BlockingMode {
  NONE = 'none',        // No blocking (optional field)
  SOFT = 'soft',        // Allow conversation, block action completion
  HARD = 'hard',        // Block everything (rare, for legal requirements)
}

/**
 * What to do when the user does not answer a data-collection question
 */
export enum NoResponseBehavior {
  MOVE_TO_NEXT_QUESTION = 'move_to_next_question',
  END_CONVERSATION = 'end_conversation',
}

export const MAX_DATA_COLLECTION_PROMPT_ATTEMPTS = 3;
