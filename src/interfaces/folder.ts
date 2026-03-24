import { FieldType } from '../enums/index';

export interface IFolder {
  _id: string;
  folderId: string;
  name: string;
  description: string;
  folderType: string;
  showOrder: number;
  assignTo: string[];
  defaultAssignTo: string;
  isDeleted: boolean;
  source?: {
    type: string;
    subCategory: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFolderViewColumn {
  fieldId?: string;
  name: string;
  type: FieldType | string;
  definition?: string;
  order: number;
}

export interface IFolderViewData {
  id: string;
  name: string;
  isDefault: boolean;
  columns: IFolderViewColumn[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFolderView {
  _id: string;
  folderId: string;
  views: IFolderViewData[];
  createdAt: Date;
  updatedAt: Date;
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
