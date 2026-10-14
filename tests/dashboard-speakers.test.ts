import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_SPEAKER_BIO_MAX,
  DASHBOARD_SPEAKER_MAX_PROFILES,
  DASHBOARD_SPEAKER_NAME_MAX,
} from '../src/index.js';

describe('dashboard speaker caps', () => {
  it('are exported from the root with the agreed limits', () => {
    expect(DASHBOARD_SPEAKER_BIO_MAX).toBe(600);
    expect(DASHBOARD_SPEAKER_MAX_PROFILES).toBe(60);
    expect(DASHBOARD_SPEAKER_NAME_MAX).toBe(80);
  });
});
