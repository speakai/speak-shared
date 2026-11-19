import { describe, it, expect } from 'vitest';
import { parseLiveInterimText } from '../src/utils/transcript.js';

describe('parseLiveInterimText', () => {
  it('reads the provisional text, trimmed', () => {
    expect(parseLiveInterimText({ type: 'transcript-interim', text: '  hello there ', words: [] })).toBe('hello there');
  });

  it('returns an empty string for a clearing event', () => {
    expect(parseLiveInterimText({ text: '', words: [] })).toBe('');
  });

  it('returns null for malformed payloads so callers keep what they show', () => {
    for (const payload of [null, undefined, 'text', 42, {}, { text: 5 }, { words: [] }]) {
      expect(parseLiveInterimText(payload)).toBeNull();
    }
  });
});
