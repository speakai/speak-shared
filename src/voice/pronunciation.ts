/**
 * Pronunciation rule limits and validation patterns
 *
 * The single source for the bounds and patterns a `PronunciationRule` must meet,
 * so the server validator and the client form reject exactly the same input
 * with exactly the same message.
 */

/** Most rules one agent may store */
export const MAX_PRONUNCIATION_RULES = 500;

/** Longest `term` allowed, counted after trimming */
export const PRONUNCIATION_TERM_MAX_LENGTH = 200;

/** Longest `pronounceAs` allowed, counted after trimming */
export const PRONUNCIATION_PRONOUNCE_AS_MAX_LENGTH = 200;

/**
 * Matches any single IPA character. `pronounceAs` containing one is rejected,
 * because the phoneme rule type that accepts IPA is unsupported on the TTS
 * models in use, so IPA would be spoken literally.
 */
export const IPA_CHAR_REGEX = /[æɐ-ʯʰ-˿̀-ͯ]/u;

/** Message shown when `pronounceAs` contains an IPA character */
export const IPA_ERROR_MESSAGE =
  "Pronunciation must use plain English respelling, not IPA. Remove IPA characters (ɪ, ɛ, ə, æ, etc.) and use capital letters, dashes, or apostrophes to force pronunciation. Example: 'Mitrex' → 'mih-TREKS'.";

/**
 * Matches a whole CMU Arpabet phoneme string: space-separated tokens of one to
 * three uppercase letters, each with an optional stress digit.
 */
export const CMU_PHONEME_REGEX = /^[A-Z]{1,3}\d?(?:\s+[A-Z]{1,3}\d?)*$/;

/** Message shown when a phoneme rule's `pronounceAs` is not valid CMU Arpabet */
export const CMU_ERROR_MESSAGE =
  "CMU phoneme must be space-separated tokens of uppercase letters with optional stress digit (0, 1, or 2). Example: 'M IH1 T R EH0 K S'";
