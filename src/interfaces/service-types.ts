import { MediaType } from '../enums/index';

/**
 * Service-specific request/response types used across speak-client,
 * embed-player, embed-recorder, and media-library.
 */

// ── Media Service ──────────────────────────────────────────────────

export interface IMediaStatistics {
  totalCount: number;
  totalDuration: number;
  totalSize: number;
  audioCount: number;
  videoCount: number;
  textCount: number;
}

export interface IMediaProcessRequest {
  id: string;
  mediaType: MediaType;
  isPaid?: boolean;
}

export interface IMediaProcessResponse {
  mediaId: string;
  mediaType: MediaType;
  state?: string;
  totalCost?: number;
}

export interface IMediaUpdateRequest {
  name?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  remark?: string;
  manageBy?: string;
  status?: string;
}

export interface IMediaMoveRequest {
  mediaIds: string[];
  folderId: string;
}

// ── Meeting Assistant Service ──────────────────────────────────────

export interface IScheduleMeetingRequest {
  meetingURL: string;
  title: string;
  meetingDate?: string;
  meetingLanguage?: string;
  tags?: string[];
}

// ── User Service ───────────────────────────────────────────────────

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

// ── Category Service ───────────────────────────────────────────────

export interface ICategoryUpdate {
  name: string;
  description?: string;
  categories?: string[];
}

// ── Paginated List Responses ───────────────────────────────────────

export interface IMediaListResponse {
  totalCount: number;
  pages: number;
  mediaList: IMediaListItem[];
}

export interface IMediaListItem {
  _id?: string;
  mediaId: string;
  name: string;
  description: string;
  mediaType: MediaType;
  state: string;
  sourceLanguage: string;
  tags: string[];
  folderId: string;
  size: number;
  duration: {
    start: string;
    end: string;
    inSecond: number;
  };
  processingProgress: string;
  isFavorite: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFolderListResponse {
  totalCount: number;
  pages: number;
  folders: IFolderListItem[];
}

export interface IFolderListItem {
  _id: string;
  folderId: string;
  name: string;
  showOrder: number;
  createdAt: string;
}
