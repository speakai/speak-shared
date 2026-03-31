import type { ITranscriptSegment, IWordEntity, IParagraph, ISpeaker } from '../interfaces/transcript.js';

/**
 * Group flat transcript segments into paragraphs by speaker.
 *
 * Consecutive segments with the same speakerId are merged into one paragraph.
 * Optionally enriches speaker metadata from a speakers array.
 *
 * @param segments - Flat array of transcript segments from the API
 * @param speakers - Optional speaker metadata for enrichment (images, names)
 * @returns Grouped paragraphs for display (display grouping by speaker)
 */
export function groupSegmentsByParagraph(
  segments: ITranscriptSegment[],
  speakers?: ISpeaker[]
): IParagraph[] {
  if (!segments || segments.length === 0) return [];

  const speakerMap = new Map<string, ISpeaker>();
  if (speakers) {
    for (const s of speakers) {
      speakerMap.set(String(s.id), s);
    }
  }

  const paragraphs: IParagraph[] = [];
  let currentParagraph: IParagraph | null = null;

  for (const segment of segments) {
    const speakerId = String(segment.speakerId);

    // Start a new paragraph if speaker changes or first segment
    if (!currentParagraph || String(currentParagraph.speakerId) !== speakerId) {
      const speakerMeta = speakerMap.get(speakerId);
      const firstInstance = segment.instances?.[0];

      currentParagraph = {
        id: paragraphs.length,
        speakerId,
        speaker: segment.speaker,
        language: segment.language,
        isEntity: segment.isEntity,
        start: firstInstance?.start ?? firstInstance?.startInSec ?? 0,
        end: firstInstance?.end ?? firstInstance?.endInSec ?? 0,
        isFinal: true,
        sentences: [],
      };

      // Enrich with speaker metadata if available
      if (speakerMeta) {
        currentParagraph.speaker = {
          ...currentParagraph.speaker,
          name: speakerMeta.name,
        };
      }

      paragraphs.push(currentParagraph);
    }

    // Add sentence to current paragraph
    const instance = segment.instances?.[0];
    currentParagraph.sentences.push({
      id: segment.id,
      text: segment.text,
      start: instance?.start ?? instance?.startInSec ?? 0,
      end: instance?.end ?? instance?.endInSec ?? 0,
      confidence: segment.confidence,
      entities: segment.entities,
    });

    // Update paragraph end time to the latest sentence
    currentParagraph.end = instance?.end ?? instance?.endInSec ?? currentParagraph.end;
  }

  return paragraphs;
}

/**
 * Format seconds into transcript display time (H:MM:SS or HH:MM:SS).
 *
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTranscriptTime(seconds: number | string): string {
  const totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parse a transcript time string (H:MM:SS or HH:MM:SS) into seconds.
 *
 * @param timeStr - Time string like "1:23:45" or "01:23:45"
 * @returns Time in seconds
 */
export function parseTranscriptTime(timeStr: string): number {
  if (!timeStr) return 0;

  // Handle numeric input
  const numeric = parseFloat(timeStr);
  if (!isNaN(numeric) && !timeStr.includes(':')) return numeric;

  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return numeric || 0;
}
