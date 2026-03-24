export enum UserRole {
  Admin = 'admin',
  Owner = 'owner',
  Member = 'member',
}

export enum UserPermissionType {
  Folder = 'folder',
  Recorder = 'recorder',
  Media = 'media',
  Payment = 'payment',
  TeamManagement = 'teamManagement',
  Developer = 'developer',
  ProfileSettings = 'profileSettings',
  MeetingAssistant = 'meetingAssistant',
}

export enum UserActionType {
  Create = 'create',
  Download = 'download',
  Update = 'update',
  Edit = 'edit',
  Delete = 'delete',
  Share = 'share',
  Assign = 'assign',
  ManageCards = 'manageCards',
  ManageInvoices = 'manageInvoices',
  ManageMembers = 'manageMembers',
  ManageGroups = 'manageGroups',
  AccessKeys = 'accessKeys',
  AccountPreferences = 'accountPreferences',
  AccountCustomization = 'accountCustomization',
  DataManagement = 'dataManagement',
  CustomizeAssistant = 'customizeAssistant',
  ShareMeetings = 'shareMeetings',
  RouteMeetings = 'routeMeetings',
  ExcludeMeetings = 'excludeMeetings',
  GlobalSettings = 'globalSettings',
  AccessAll = 'accessAll',
}
