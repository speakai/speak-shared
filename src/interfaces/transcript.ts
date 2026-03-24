export interface ITranscriptInstance {
  start: string;
  end: string;
  startInSec?: number;
  endInSec?: number;
}

export interface ITranscriptSegment {
  id: number;
  speakerId: string;
  text: string;
  confidence: number;
  language?: string;
  instances: ITranscriptInstance[];
}

export interface ISpeaker {
  id: number;
  name: string;
  wpm?: number;
  totalWords?: number;
  duration?: number;
}
