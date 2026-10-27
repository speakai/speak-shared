import type { IconMeaning, TypeRole } from '../enums/design.js';
import type { ICON_NAMES } from '../design/tokens.js';

/** One value per colour scheme. */
export interface ModeValues<T> {
  light: T;
  dark: T;
}

/** Neutral, surface and semantic colours for one colour scheme, as `#rrggbb` (or `rgba()` for the scrim). */
export interface ColorTokens {
  background: string;
  surface: string;
  raised: string;
  separator: string;
  line: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  record: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  critical: string;
  criticalSoft: string;
  scrim: string;
}

export type ColorToken = keyof ColorTokens;

/** An account accent theme. `id` is the value stored as the user's appearance theme. */
export interface AccentPreset {
  id: string;
  name: string;
  /** The two dots shown in the theme picker. */
  preview: { primary: string; secondary: string };
  light: { accent: string; onAccent: string };
  dark: { accent: string; onAccent: string };
}

export type IosTextStyle = 'largeTitle' | 'title3' | 'headline' | 'body' | 'callout' | 'footnote' | 'caption1';

export type AndroidTypeRole =
  | 'headlineMedium'
  | 'titleLarge'
  | 'titleMedium'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelSmall'
  | 'labelMedium';

/** Sizes and line heights are points on mobile and CSS pixels on web and desktop. */
export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: 400 | 500 | 600;
  heading: boolean;
  /** Dynamic Type style the size follows on iOS; null when it stays fixed. */
  ios: IosTextStyle | null;
  android: { role: AndroidTypeRole; fontSize: number; lineHeight: number } | null;
  /** Largest multiple of the system text size this role grows to; 1 means fixed. */
  maxScale: number;
}

export type TypeScale = Record<TypeRole, TypeStyle>;

export interface ElevationLevel {
  offsetY: number;
  blur: number;
  shadowOpacity: number;
}

export interface MotionTokens {
  durationMs: { state: number; menu: number; sheet: number };
  /** Cubic bezier control points for the one easing curve. */
  easing: readonly [number, number, number, number];
  /** With reduced motion on, movement becomes a fade of this length and loops stop. */
  reducedMotion: { fadeMs: number; stopLoops: boolean };
}

/** Speaker hue = speaker number x hueStep, mod 360, in OKLCH. */
export interface SpeakerPalette {
  hueStep: number;
  chroma: number;
  lightness: ModeValues<number>;
}

export interface MediaStatusDesign {
  labelKey: string;
  color: ColorToken;
  fill: ColorToken;
  icon: IconMeaning;
}

export type LucideIconName = (typeof ICON_NAMES)[IconMeaning];
