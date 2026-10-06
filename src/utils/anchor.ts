import type { ITranscriptSegment, ITranscriptInstance } from '../interfaces/transcript.js';
import type { IAnchor, IFlatWord, IWordRange } from '../interfaces/label.js';
import { parseTranscriptTime } from './transcript.js';

const ANCHOR_CONTEXT_CHARS = 32;
const EDGE_PUNCTUATION = /^\p{P}+|\p{P}+$/gu;
const CURLY_APOSTROPHE = /[‘’ʼ]/g;
const WHITESPACE = /\s+/;

/**
 * Normalize a word for matching across transcript edits.
 *
 * NFC, lowercase, curly apostrophes made straight, and leading/trailing
 * punctuation removed. Inner apostrophes and hyphens are kept ("don't", "e-mail").
 */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFC')
    .toLowerCase()
    .replace(CURLY_APOSTROPHE, "'")
    .replace(EDGE_PUNCTUATION, '');
}

/**
 * Flatten a transcript into one array of words, in transcript order.
 *
 * This is the single word count used by speak-ui and speak-server, so anchor
 * word positions mean the same thing on both sides.
 *
 * - Segments with entities use entity word timings; an entity holding several
 *   words ("New York") is split, with its time spread evenly across them.
 * - Segments without entities split their text on whitespace, with times
 *   spread evenly across the segment.
 * - Tokens that are empty after normalizeWord() (bare punctuation) are skipped.
 * - Segments are identified by array position; segment ids repeat in live and
 *   split transcripts.
 *
 * @param transcript - Flat array of transcript segments from the API
 * @returns Every word with its time, segment position and speaker
 */
export function flattenWords(transcript: ITranscriptSegment[]): IFlatWord[] {
  const words: IFlatWord[] = [];
  if (!transcript || transcript.length === 0) return words;

  transcript.forEach((segment, segmentIndex) => {
    const speakerId = String(segment.speakerId ?? '');
    const previousEnd = words.length > 0 ? words[words.length - 1].endInSec : 0;
    const segmentStart = instanceTime(segment.instances?.[0], 'start') ?? previousEnd;
    const segmentEnd = instanceTime(segment.instances?.[0], 'end') ?? segmentStart;
    let wordIndex = 0;

    const pushTokens = (text: string | undefined, start: number, end: number) => {
      const tokens = (text ?? '')
        .split(WHITESPACE)
        .map((token) => ({ text: token, norm: normalizeWord(token) }))
        .filter((token) => token.norm !== '');
      tokens.forEach((token, i) => {
        words.push({
          text: token.text,
          norm: token.norm,
          startInSec: spreadTime(start, end, i, tokens.length),
          endInSec: spreadTime(start, end, i + 1, tokens.length),
          segmentIndex,
          wordIndex: wordIndex++,
          speakerId,
        });
      });
    };

    const entities = segment.entities ?? [];
    if (entities.length === 0) {
      pushTokens(segment.text, segmentStart, segmentEnd);
      return;
    }

    let cursor = segmentStart;
    for (const entity of entities) {
      // Entities without timings continue from the previous word so times never go backwards
      const start = finiteOrUndefined(entity.instances?.startInSec) ?? cursor;
      const end = finiteOrUndefined(entity.instances?.endInSec) ?? start;
      pushTokens(entity.text, start, end);
      cursor = end;
    }
  });

  return words;
}

/**
 * Build an anchor for an inclusive range of flattenWords() indices.
 *
 * @param transcript - Flat array of transcript segments from the API
 * @param range - Inclusive word range, from flattenWords() order
 * @param transcriptRevision - media.transcriptRevision the range was taken from
 * @throws RangeError when the range is not inside the transcript
 */
export function buildAnchor(
  transcript: ITranscriptSegment[],
  range: IWordRange,
  transcriptRevision: number
): IAnchor {
  return buildAnchorFromWords(flattenWords(transcript), range, transcriptRevision);
}

/**
 * Same as buildAnchor(), for callers that already hold flattenWords() output.
 * Avoids re-flattening when building many anchors on one transcript.
 */
export function buildAnchorFromWords(
  words: IFlatWord[],
  range: IWordRange,
  transcriptRevision: number
): IAnchor {
  assertValidRange(words, range);
  if (!Number.isInteger(transcriptRevision) || transcriptRevision < 0) {
    throw new RangeError(`transcriptRevision must be a non-negative integer, got ${transcriptRevision}`);
  }

  const selected = words.slice(range.start, range.end + 1);
  const speakerIds = [...new Set(selected.map((word) => word.speakerId))];

  return {
    startWord: range.start,
    endWord: range.end,
    exact: selected.map((word) => word.text).join(' '),
    prefix: contextBefore(words, range.start),
    suffix: contextAfter(words, range.end),
    startInSec: selected[0].startInSec,
    endInSec: selected[selected.length - 1].endInSec,
    speakerIds,
    transcriptRevision,
  };
}

function assertValidRange(words: IFlatWord[], range: IWordRange): void {
  const { start, end } = range ?? ({} as IWordRange);
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new RangeError(`Word range must use integer indices, got ${start}..${end}`);
  }
  if (start < 0 || end < start || end >= words.length) {
    throw new RangeError(`Word range ${start}..${end} is outside 0..${words.length - 1}`);
  }
}

function contextBefore(words: IFlatWord[], start: number): string {
  let text = '';
  for (let i = start - 1; i >= 0 && text.length < ANCHOR_CONTEXT_CHARS; i--) {
    text = text ? `${words[i].text} ${text}` : words[i].text;
  }
  return text.slice(-ANCHOR_CONTEXT_CHARS);
}

function contextAfter(words: IFlatWord[], end: number): string {
  let text = '';
  for (let i = end + 1; i < words.length && text.length < ANCHOR_CONTEXT_CHARS; i++) {
    text = text ? `${text} ${words[i].text}` : words[i].text;
  }
  return text.slice(0, ANCHOR_CONTEXT_CHARS);
}

function instanceTime(instance: ITranscriptInstance | undefined, edge: 'start' | 'end'): number | undefined {
  if (!instance) return undefined;
  const inSec = finiteOrUndefined(edge === 'start' ? instance.startInSec : instance.endInSec);
  if (inSec !== undefined) return inSec;
  const raw = edge === 'start' ? instance.start : instance.end;
  if (typeof raw === 'number') return finiteOrUndefined(raw);
  if (typeof raw === 'string' && raw.trim() !== '') return finiteOrUndefined(parseTranscriptTime(raw));
  return undefined;
}

function finiteOrUndefined(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

// Rounded to milliseconds so interpolated times compare equal on client and server
function spreadTime(start: number, end: number, step: number, steps: number): number {
  return Math.round((start + ((end - start) * step) / steps) * 1000) / 1000;
}
