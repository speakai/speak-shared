import { UserRole, UserPermissionType } from '../enums/index.js';

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  isNewUser: boolean;
  isArchive: boolean;
  companyId: string;
  phone: string;
  picture: string;
  timezone: string;
  userType: string;
  permission: IUserPermission;
  primaryColor?: string;
  isTeamMember?: boolean;
  platformLanguage: string;
  referralId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPermission {
  role: UserRole;
  folder: {
    create: boolean;
    delete: boolean;
    download: boolean;
    share: boolean;
    assign: boolean;
    accessAll: boolean;
  };
  recorder: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    download: boolean;
    accessAll: boolean;
  };
  media: {
    delete: boolean;
    edit: boolean;
    download: boolean;
    share: boolean;
  };
  payment: {
    manageCards: boolean;
    manageInvoices: boolean;
  };
  teamManagement: {
    manageMembers: boolean;
    manageGroups: boolean;
  };
  developer: {
    accessKeys: boolean;
  };
  profileSettings: {
    accountPreferences: boolean;
    accountCustomization: boolean;
    dataManagement: boolean;
  };
  meetingAssistant: {
    customizeAssistant: boolean;
    shareMeetings: boolean;
    routeMeetings: boolean;
    excludeMeetings: boolean;
    globalSettings: boolean;
  };
}

export interface IUserProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ISupportTicket {
  subject: string;
  message: string;
  category?: string;
}
