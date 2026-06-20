import { MediaType, EmbedType } from '../enums/index.js';
import { LeadCapture } from './dashboard.js';

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
  /** Set when `embedType === EmbedType.DASHBOARD` — the shared dashboard this embed renders. */
  dashboardId?: string;
  /** Owner-settable lead-capture config for the shared surface. Defaults OFF. */
  leadCapture?: LeadCapture;
  createdAt: Date;
  updatedAt: Date;
}
