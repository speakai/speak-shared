import { MediaType, EmbedType } from '../enums/index.js';

export interface IEmbedSettings {
  backgroundImg: string;
  logo: string;
  primaryColor: string;
  titleColor: string;
  callToActionButtons: { url: string; label: string }[];
  features: { name: string; isActive: boolean }[];
  isDataVizDownloadable: boolean;
  isDescription: boolean;
  isSEOIndexing: boolean;
  isRemarks: boolean;
  isPromptAsk: boolean;
  isPromptHistory: boolean;
  chatWelcomeMessage: string;
  isMediaExport: boolean;
  isTitle: boolean;
  assistantTemplateId?: string;
}

export interface IEmbed {
  _id: string;
  embedId?: string;
  mediaId: string;
  folderIds: string[];
  mediaType: MediaType;
  token: string;
  password: string;
  size: string;
  embedType: EmbedType;
  isActive: boolean;
  isDeleted: boolean;
  privacyMode?: string;
  meta: IEmbedSettings;
  createdAt: Date;
  updatedAt: Date;
}
