export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum UserPermissionType {
  FOLDER = 'folder',
  RECORDER = 'recorder',
  MEDIA = 'media',
  PAYMENT = 'payment',
  TEAM_MANAGEMENT = 'teamManagement',
  DEVELOPER = 'developer',
  PROFILE_SETTINGS = 'profileSettings',
  MEETING_ASSISTANT = 'meetingAssistant',
}

export enum UserActionType {
  CREATE = 'create',
  DOWNLOAD = 'download',
  UPDATE = 'update',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  ASSIGN = 'assign',
  MANAGE_CARDS = 'manageCards',
  MANAGE_INVOICES = 'manageInvoices',
  MANAGE_MEMBERS = 'manageMembers',
  MANAGE_GROUPS = 'manageGroups',
  ACCESS_KEYS = 'accessKeys',
  ACCOUNT_PREFERENCES = 'accountPreferences',
  ACCOUNT_CUSTOMIZATION = 'accountCustomization',
  DATA_MANAGEMENT = 'dataManagement',
  CUSTOMIZE_ASSISTANT = 'customizeAssistant',
  SHARE_MEETINGS = 'shareMeetings',
  ROUTE_MEETINGS = 'routeMeetings',
  EXCLUDE_MEETINGS = 'excludeMeetings',
  GLOBAL_SETTINGS = 'globalSettings',
  ACCESS_ALL = 'accessAll',
}
