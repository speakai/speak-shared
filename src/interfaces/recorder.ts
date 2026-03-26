import { RecorderAnswerType } from '../enums/index.js';

export interface IRecorderQuestion {
  id: string;
  question: string;
  isRequired: boolean;
  answerType: RecorderAnswerType;
  options: string[];
  includeOther: boolean;
  fieldId?: string;
}

export interface IRecorderMeta {
  backgroundImg: string;
  logo: string;
  primaryColor: string;
  fontColor?: string;
  fontFamily?: string;
  theme?: string;
  customCSS?: string;
  hideWaveform?: boolean;
  hideTitle?: boolean;
  hideDescription?: boolean;
  hideSubmitButton?: boolean;
  submitButtonLabel?: string;
  countdown?: boolean;
  hideImages?: boolean;
  type: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
    upload: {
      file: boolean;
      text: boolean;
      multiple: boolean;
      url: boolean;
    };
    liveTranscription: boolean;
  };
  client: {
    email: boolean;
    name: boolean;
    questions: IRecorderQuestion[];
    consent?: {
      isEnabled: boolean;
      title: string;
      description: string;
      yesButtonLabel: string;
      noButtonLabel: string;
      isRequired: boolean;
      fieldId?: string;
    };
  };
}

export interface IRecorder {
  _id: string;
  recorderId: string;
  name: string;
  description: string;
  folderId: string;
  sourceLanguage: string;
  isActive: boolean;
  isAutoAnalyze: boolean;
  isDeleted: boolean;
  isDisabled: boolean;
  privacyMode: string;
  token: string;
  password: string;
  minDuration: number;
  maxDuration: number;
  meta: IRecorderMeta;
  notification: {
    upload: boolean;
    client: boolean;
    notifyUsers: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecordingQuestion {
  id: string;
  question: string;
  answer: string;
  answerType: RecorderAnswerType;
  fieldId: string;
}

export interface IRecording {
  _id: string;
  recorderId: string;
  mediaId: string;
  isDeleted: boolean;
  client: {
    name: string;
    email: string;
    questions: IRecordingQuestion[];
    isConsent?: boolean;
  };
  meta: {
    isScreenShare: boolean;
    microphoneMuted: boolean;
    microphoneReadyState: string;
    microphoneName: string;
    microphoneNumber: number;
    cameraMuted: boolean;
    cameraReadyState: string;
    cameraName: string;
    cameraNumber: number;
  };
  feedback?: {
    message: string;
    rating: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
