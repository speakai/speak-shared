import { IconMeaning, MediaStatusKind, TypeRole } from '../enums/design.js';
import type {
  AccentPreset,
  ColorTokens,
  ElevationLevel,
  MediaStatusDesign,
  ModeValues,
  MotionTokens,
  SpeakerPalette,
  TypeScale,
} from '../interfaces/design.js';

export const COLOR_TOKENS: Readonly<ModeValues<Readonly<ColorTokens>>> = Object.freeze({
  light: Object.freeze({
    background: '#ffffff',
    surface: '#f4f4f5',
    raised: '#ffffff',
    separator: '#e4e4e7',
    line: '#d4d4d8',
    text: '#18181b',
    textSecondary: '#52525b',
    textTertiary: '#6b6b76',
    record: '#dc2626',
    success: '#15803d',
    successSoft: '#ecfdf3',
    warning: '#a15c07',
    warningSoft: '#fef6e7',
    critical: '#b42318',
    criticalSoft: '#fef3f2',
    scrim: 'rgba(0,0,0,0.4)',
  }),
  dark: Object.freeze({
    background: '#09090b',
    surface: '#18181b',
    raised: '#1c1c1f',
    separator: '#27272a',
    line: '#3f3f46',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#8b8b94',
    record: '#ef4444',
    success: '#4ade80',
    successSoft: '#0f2a1a',
    warning: '#fbbf24',
    warningSoft: '#2e2208',
    critical: '#f87171',
    criticalSoft: '#2d1414',
    scrim: 'rgba(0,0,0,0.6)',
  }),
});

/** The preset an account without a stored theme, or a signed-out app, uses. */
export const DEFAULT_ACCENT_ID = 'default';

/** Each preset carries the on-accent text colour that clears 4.5:1 on its accent, which is not always white. */
export const ACCENT_PRESETS: readonly AccentPreset[] = Object.freeze([
  {
    id: DEFAULT_ACCENT_ID,
    name: 'Monochrome',
    preview: { primary: '#171717', secondary: '#737373' },
    light: { accent: '#171717', onAccent: '#ffffff' },
    dark: { accent: '#f2f2f2', onAccent: '#18181b' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    preview: { primary: '#6366f1', secondary: '#818cf8' },
    light: { accent: '#6264f1', onAccent: '#ffffff' },
    dark: { accent: '#6264f1', onAccent: '#ffffff' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    preview: { primary: '#10b981', secondary: '#34d399' },
    light: { accent: '#10b77f', onAccent: '#18181b' },
    dark: { accent: '#12d393', onAccent: '#18181b' },
  },
  {
    id: 'rose',
    name: 'Rose',
    preview: { primary: '#f43f5e', secondary: '#fb7185' },
    light: { accent: '#f43e5c', onAccent: '#18181b' },
    dark: { accent: '#f43e5c', onAccent: '#18181b' },
  },
  {
    id: 'orange',
    name: 'Orange',
    preview: { primary: '#f97316', secondary: '#fb923c' },
    light: { accent: '#f97415', onAccent: '#18181b' },
    dark: { accent: '#f97415', onAccent: '#18181b' },
  },
  {
    id: 'purple',
    name: 'Purple',
    preview: { primary: '#8b5cf6', secondary: '#a78bfa' },
    light: { accent: '#6b26d9', onAccent: '#ffffff' },
    dark: { accent: '#8852e0', onAccent: '#ffffff' },
  },
]);

export const TYPE_SCALE: Readonly<TypeScale> = Object.freeze({
  [TypeRole.TITLE]: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 600,
    heading: true,
    ios: 'largeTitle',
    android: { role: 'headlineMedium', fontSize: 28, lineHeight: 36 },
    maxScale: 1.4,
  },
  [TypeRole.HEADING]: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 600,
    heading: true,
    ios: 'title3',
    android: { role: 'titleLarge', fontSize: 22, lineHeight: 28 },
    maxScale: 1.4,
  },
  [TypeRole.HEADLINE]: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: 600,
    heading: false,
    ios: 'headline',
    android: { role: 'titleMedium', fontSize: 16, lineHeight: 24 },
    maxScale: 2,
  },
  [TypeRole.BODY]: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: 400,
    heading: false,
    ios: 'body',
    android: { role: 'bodyLarge', fontSize: 16, lineHeight: 24 },
    maxScale: 2,
  },
  [TypeRole.CALLOUT]: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 400,
    heading: false,
    ios: 'callout',
    android: { role: 'bodyMedium', fontSize: 14, lineHeight: 20 },
    maxScale: 2,
  },
  [TypeRole.FOOTNOTE]: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
    heading: false,
    ios: 'footnote',
    android: { role: 'bodySmall', fontSize: 12, lineHeight: 16 },
    maxScale: 2,
  },
  [TypeRole.CAPTION]: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: 600,
    heading: false,
    ios: 'caption1',
    android: { role: 'labelSmall', fontSize: 11, lineHeight: 16 },
    maxScale: 2,
  },
  [TypeRole.TIMER]: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: 500,
    heading: true,
    ios: null,
    android: null,
    maxScale: 1,
  },
  [TypeRole.TAB]: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: 600,
    heading: false,
    ios: null,
    android: { role: 'labelMedium', fontSize: 12, lineHeight: 16 },
    maxScale: 1,
  },
} satisfies TypeScale);

export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  gutterMax: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const);

export const RADIUS = Object.freeze({
  control: 10,
  card: 12,
  sheet: 16,
  pill: 999,
} as const);

/** Screens and lists are flat; only sheets, dialogs, menus and the selected segment are raised. */
export const ELEVATION: Readonly<{ flat: null; raised: Readonly<ElevationLevel> }> = Object.freeze({
  flat: null,
  raised: Object.freeze({ offsetY: 1, blur: 2, shadowOpacity: 0.08 }),
});

export const MOTION: Readonly<MotionTokens> = Object.freeze({
  durationMs: Object.freeze({ state: 150, menu: 200, sheet: 300 }),
  easing: Object.freeze([0, 0, 0.58, 1] as const),
  reducedMotion: Object.freeze({ fadeMs: 150, stopLoops: true }),
});

export const SPEAKER_PALETTE: Readonly<SpeakerPalette> = Object.freeze({
  hueStep: 137.508,
  chroma: 0.14,
  lightness: Object.freeze({ light: 0.52, dark: 0.72 }),
});

/** Lucide icon names (lucide.dev, kebab-case) per meaning, so every app shows the same glyph for the same thing. */
export const ICON_NAMES = Object.freeze({
  [IconMeaning.RECORD]: 'mic',
  [IconMeaning.STOP]: 'square',
  [IconMeaning.PAUSE]: 'pause',
  [IconMeaning.PLAY]: 'play',
  [IconMeaning.UPLOAD]: 'cloud-upload',
  [IconMeaning.DOWNLOAD]: 'download',
  [IconMeaning.FOLDER]: 'folder',
  [IconMeaning.FOLDERS]: 'folders',
  [IconMeaning.MEDIA_LIBRARY]: 'square-play',
  [IconMeaning.AUDIO]: 'audio-lines',
  [IconMeaning.VIDEO]: 'video',
  [IconMeaning.DOCUMENT]: 'file-text',
  [IconMeaning.TRANSCRIPT]: 'file-text',
  [IconMeaning.MEETING]: 'calendar-clock',
  [IconMeaning.RECORDER]: 'radio',
  [IconMeaning.PROFILE]: 'circle-user-round',
  [IconMeaning.SETTINGS]: 'settings',
  [IconMeaning.AI]: 'sparkles',
  [IconMeaning.BACK]: 'chevron-left',
  [IconMeaning.MORE]: 'ellipsis',
  [IconMeaning.DELETE]: 'trash',
  [IconMeaning.EDIT]: 'pencil',
  [IconMeaning.UNDO]: 'undo-2',
  [IconMeaning.REDO]: 'redo-2',
  [IconMeaning.SKIP_BACK]: 'rotate-ccw',
  [IconMeaning.SKIP_FORWARD]: 'rotate-cw',
  [IconMeaning.READY]: 'circle-check',
  [IconMeaning.PROCESSING]: 'loader-circle',
  [IconMeaning.FAILED]: 'circle-alert',
  [IconMeaning.NEEDS_ATTENTION]: 'triangle-alert',
  [IconMeaning.PAYMENT_NEEDED]: 'credit-card',
  [IconMeaning.LOCAL_ONLY]: 'cloud-off',
  [IconMeaning.UPLOADED]: 'cloud-check',
  [IconMeaning.WAITING]: 'clock',
  [IconMeaning.LIVE]: 'radio',
} as const satisfies Record<IconMeaning, string>);

/** Android uses an arrow for Back; every other platform uses the map. */
export const ANDROID_ICON_NAMES = Object.freeze({
  [IconMeaning.BACK]: 'arrow-left',
} as const satisfies Partial<Record<IconMeaning, string>>);

export const MEDIA_STATUS_DESIGN: Readonly<Record<MediaStatusKind, Readonly<MediaStatusDesign>>> = Object.freeze({
  [MediaStatusKind.UPLOADING]: { labelKey: 'MEDIA_STATUS.UPLOADING', color: 'textSecondary', fill: 'surface', icon: IconMeaning.UPLOAD },
  [MediaStatusKind.WAITING]: { labelKey: 'MEDIA_STATUS.WAITING', color: 'textSecondary', fill: 'surface', icon: IconMeaning.WAITING },
  [MediaStatusKind.PROCESSING]: { labelKey: 'MEDIA_STATUS.PROCESSING', color: 'textSecondary', fill: 'surface', icon: IconMeaning.PROCESSING },
  [MediaStatusKind.TAKING_LONGER]: { labelKey: 'MEDIA_STATUS.TAKING_LONGER', color: 'warning', fill: 'warningSoft', icon: IconMeaning.NEEDS_ATTENTION },
  [MediaStatusKind.READY]: { labelKey: 'MEDIA_STATUS.READY', color: 'success', fill: 'successSoft', icon: IconMeaning.READY },
  [MediaStatusKind.FAILED]: { labelKey: 'MEDIA_STATUS.FAILED', color: 'critical', fill: 'criticalSoft', icon: IconMeaning.FAILED },
  [MediaStatusKind.PAYMENT_NEEDED]: { labelKey: 'MEDIA_STATUS.PAYMENT_NEEDED', color: 'critical', fill: 'criticalSoft', icon: IconMeaning.PAYMENT_NEEDED },
  [MediaStatusKind.LOCAL_ONLY]: { labelKey: 'MEDIA_STATUS.LOCAL_ONLY', color: 'textSecondary', fill: 'surface', icon: IconMeaning.LOCAL_ONLY },
  [MediaStatusKind.LIVE]: { labelKey: 'MEDIA_STATUS.LIVE', color: 'textSecondary', fill: 'surface', icon: IconMeaning.LIVE },
});
