import { MediaState } from '../enums/index';
import { ISentiment } from './media';

export interface ITextNote {
  _id: string;
  mediaId: string;
  name: string;
  text: string;
  rawText?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  fields?: { id: string; value: string }[];
  sourceLanguage?: string;
  state: MediaState;
  count?: {
    wordCount: number;
    characterCount: number;
    characterCountWithoutSpace: number;
  };
  isFavorite: boolean;
  privacyMode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITextInsight {
  _id: string;
  mediaId: string;
  name: string;
  state: MediaState;
  sentiment: ISentiment[];
  summary: {
    original: {
      text: string;
      createdAt: Date;
    };
  };
  insight: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
