export enum IntegrationSlug {
  // CRM
  HUBSPOT    = 'hubspot',
  SALESFORCE = 'salesforce',
  PIPEDRIVE  = 'pipedrive',
  ZOHO       = 'zoho',
  ATTIO      = 'attio',
  CLOSE      = 'close',
  // Messaging
  SLACK      = 'slack',
  TEAMS      = 'microsoft-teams',
  WHATSAPP   = 'whatsapp',
  DISCORD    = 'discord',
  DIALPAD    = 'dialpad',
  TELEGRAM   = 'telegram',
  // Scheduling
  GOOGLE_CALENDAR = 'google-calendar',
  CALENDLY        = 'calendly',
  CAL_COM         = 'cal',
  // Notes & Productivity
  NOTION        = 'notion',
  GOOGLE_SHEETS = 'google-sheets',
  AIRTABLE      = 'airtable',
  // Support
  ZENDESK  = 'zendesk',
  INTERCOM = 'intercom',
  GORGIAS  = 'gorgias',
  FRESHDESK = 'freshdesk',
  // Email
  GMAIL   = 'gmail',
  OUTLOOK = 'outlook',
  // Project Management
  JIRA    = 'jira',
  LINEAR  = 'linear',
  ASANA   = 'asana',
  CLICKUP = 'clickup',
  TRELLO  = 'trello',
  MONDAY  = 'monday',
  // Storage
  DROPBOX      = 'dropbox',
  ONEDRIVE     = 'onedrive',
  BOX          = 'box',
  GOOGLE_DRIVE = 'google-drive',
  // Documents
  GOOGLE_DOCS = 'google-docs',
  CONFLUENCE  = 'confluence',
  // Video
  ZOOM        = 'zoom',
  GOOGLE_MEET = 'google-meet',
}

export enum IntegrationCategory {
  CRM          = 'CRM',
  MESSAGING    = 'Messaging',
  SCHEDULING   = 'Scheduling',
  NOTES        = 'Notes & Productivity',
  SUPPORT      = 'Support',
  EMAIL        = 'Email',
  PROJECT_MGMT = 'Project Management',
  STORAGE      = 'Storage',
  DOCUMENTS    = 'Documents',
  VIDEO        = 'Video',
}

export enum IntegrationAuthType {
  OAUTH   = 'oauth',
  API_KEY = 'apiKey',
}

export enum IntegrationStatus {
  PENDING      = 'pending',
  CONNECTED    = 'connected',
  EXPIRED      = 'expired',
  DISCONNECTED = 'disconnected',
  ERROR        = 'error',
}

export enum RuleConditionField {
  SENTIMENT         = 'sentiment',
  DURATION_SECONDS  = 'duration_seconds',
  STRUCTURED_OUTPUT = 'structured_output',
  CALLER_PHONE      = 'caller_phone',
  SUMMARY           = 'summary',
}

export enum RuleOperator {
  EQUALS       = 'equals',
  NOT_EQUALS   = 'not_equals',
  CONTAINS     = 'contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN    = 'less_than',
  IS_SET       = 'is_set',
  IS_NOT_SET   = 'is_not_set',
}
