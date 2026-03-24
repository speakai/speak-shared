import { MediaType, MediaState } from '../enums/index';

export interface ISentiment {
  document: {
    Compound: number;
    Negative: number;
    Neutral: number;
    Positive: number;
  };
  sentences: ISentenceSentiment[];
}

export interface ISentenceSentiment {
  id: number;
  speakerId: string | number;
  text: string;
  confidence: number;
  language: string;
  score?: {
    compound: number;
    neg: number;
    neu: number;
    pos: number;
  };
  instances: {
    start: string;
    end: string;
    startInSec: number;
    endInSec: number;
  }[];
}

export interface IMedia {
  _id: string;
  mediaId: string;
  name: string;
  description: string;
  mediaType: MediaType;
  state: MediaState;
  privacyMode: string;
  sourceLanguage: string;
  originalSourceLanguage: string;
  tags: string[];
  folderId: string;
  externalId: string;
  size: number;
  duration: {
    start: string;
    end: string;
    inSecond: number;
  };
  processingProgress: string;
  isFavorite: boolean;
  isDeleted: boolean;
  count?: {
    wordCount: number;
    characterCount: number;
    characterCountWithoutSpace: number;
  };
  fields: IMediaFieldValue[];
  sentiment: ISentiment[];
  summary: {
    original: {
      text: string;
      createdAt: Date;
    };
  };
  sourceUrl: string;
  uploadType: string;
  feedback: {
    sentiment: number;
    summary: number;
    transcription?: number;
  };
  integrations: {
    youtubeId: string;
    vimeoId: string;
    zoomId: string;
  };
  failure?: {
    attempt: number;
    code: number;
    message: string;
  };
  text?: string;
  rawText?: string;
  remark: string;
  originalCreatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaFieldValue {
  id: string;
  value: string;
}

export interface IMediaUploadRequest {
  name: string;
  url: string;
  mediaType: MediaType;
  description?: string;
  sourceLanguage?: string;
  tags?: string[];
  folderId?: string;
  callbackUrl?: string;
  fields?: IMediaFieldValue[];
}

export interface IMediaStatus {
  name: string;
  state: MediaState;
  mediaType: MediaType;
  duration: {
    start: string;
    end: string;
    inSecond: number;
  };
  createdAt: Date;
}
