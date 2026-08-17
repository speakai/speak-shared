/**
 * Avatar Interfaces
 */

import { AvatarProvider } from "../enums/providers.js";
import { AvatarCategory } from "../enums/avatar.js";

/**
 * Tavus-specific avatar data
 */
export interface TavusAvatarData {
  faceId: string;
  palId?: string;
  status?: "started" | "completed" | "error";
  trainingProgress?: string;
  faceType?: "user" | "system";
  modelType?: string;
  isRecommended?: boolean;
}

/**
 * Beyond Presence-specific avatar data
 */
export interface BeyAvatarData {
  avatarId: string;
  gender?: string;
  ethnicity?: string;
  ageRange?: string;
  style?: string;
  isDefault?: boolean;
}

/**
 * Custom avatar data
 */
export interface CustomAvatarData {
  uploadedBy?: string;
  originalFileName?: string;
}

/**
 * Avatar entity
 */
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  category: AvatarCategory;
  isPremium: boolean;
  provider: AvatarProvider;
  tavus?: TavusAvatarData;
  bey?: BeyAvatarData;
  custom?: CustomAvatarData;
  metadata?: Record<string, unknown>;
}

/**
 * Avatar list response
 */
export interface AvatarListResponse {
  success: boolean;
  avatars: Avatar[];
  total: number;
}
