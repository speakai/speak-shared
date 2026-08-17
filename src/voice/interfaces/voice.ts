/**
 * Voice/TTS Interfaces
 */

import { TTSProvider } from "../enums/providers.js";
import { VoiceCategory } from "../enums/voice.js";

/**
 * Voice entity
 */
export interface Voice {
  id: string;
  name: string;
  provider: TTSProvider;
  language: string;
  gender?: string;
  age?: string;
  accent?: string;
  description?: string;
  previewUrl?: string;
  category?: VoiceCategory;
  isPremium?: boolean;
  isMultilingual?: boolean;
  isLowLatency?: boolean;
  providerData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Voice list response
 */
export interface VoiceListResponse {
  success: boolean;
  voices: Voice[];
  total?: number;
}
