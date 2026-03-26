export interface ITranscriptInstance {
  start: string | number;
  end: string | number;
  startInSec?: number;
  endInSec?: number;
  startChar?: number;
  endChar?: number;
}

export interface ITranscriptSegment {
  id: number;
  speakerId: string | number;
  text: string;
  confidence: number;
  language?: string;
  instances: ITranscriptInstance[];
  speaker?: {
    userId?: string;
    name?: string;
    email?: string | null;
  };
  score?: {
    compound: number;
    neg: number;
    neu: number;
    pos: number;
  };
  entities?: IWordEntity[];
}

export interface IWordEntity {
  id?: number;
  text?: string;
  speakerId?: string;
  confidence?: number;
  language?: string;
  speaker_confidence?: number;
  instances?: {
    startInSec?: number;
    endInSec?: number;
  };
}

export interface ISpeaker {
  id: number;
  name: string;
  wpm?: number;
  totalWords?: number;
  duration?: number;
  durationInPercentage?: number;
  instances?: ITranscriptInstance[];
}
