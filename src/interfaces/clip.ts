import { MediaType } from '../enums/index.js';

// ── Clip Transcript ───────────────────────────────────────────────

export interface IClipTranscript {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  speakerId: string;
}

// ── Time Range — for clip creation ────────────────────────────────

export interface ITimeRange {
  mediaId: string;
  mediaType: MediaType;
  startTime: number;
  endTime: number;
  duration?: number;
  order?: number;
  name?: string;
  url?: string;
  transcript?: IClipTranscript;
  type?: 'fine' | 'paragraph';
  paragraphId?: string;
}

// ── Fine Segment — text selection for clip creation ───────────────

export interface IFineSegment {
  start: number;
  end: number;
  text: string;
  order: number;
}

export interface IFineSegmentEvent {
  start: number;
  end: number;
  action: 'add' | 'remove' | 'create';
  text?: string;
  order?: number;
}
