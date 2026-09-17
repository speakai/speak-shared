/**
 * The two id spaces, kept apart by the type system.
 *
 * A Mongo `_id` and the id `generateId()` produces are both `string`, so assigning one where the
 * other belongs compiles, runs, and writes. A migration once filed 1429 documents, 1514
 * embeddings and an agent mapping under a collection's `_id` instead of its short id. Every
 * write succeeded; nothing could read them back.
 *
 * Branding costs nothing at runtime — these are strings — but makes the swap a compile error at
 * the line where it happens rather than a support ticket weeks later.
 */

/** The 12-character lowercase hex id `generateId()` returns, and the id business rows key on. */
export type ShortId = string & { readonly __brand: 'ShortId' };

/** A Mongo ObjectId rendered as its 24-character hex string. */
export type ObjectIdString = string & { readonly __brand: 'ObjectIdString' };

const SHORT_ID = /^[0-9a-f]{12}$/;
const OBJECT_ID = /^[0-9a-f]{24}$/;

/** Whether a value is shaped like a short business id. */
export const isShortId = (value: unknown): value is ShortId =>
  typeof value === 'string' && SHORT_ID.test(value);

/** Whether a value is shaped like a stringified ObjectId. */
export const isObjectIdString = (value: unknown): value is ObjectIdString =>
  typeof value === 'string' && OBJECT_ID.test(value);

/**
 * Narrow a value to a {@link ShortId}, or throw.
 *
 * An ObjectId arriving here is reported as that specific mistake rather than as a generic bad
 * value, because it is the one this exists to catch and the one that reads as plausible.
 *
 * @param value Candidate id.
 * @param label What is being identified, for the error message.
 * @throws When the value is not 12 lowercase hex characters.
 */
export const shortId = (value: unknown, label = 'id'): ShortId => {
  if (isShortId(value)) return value;
  const hint = isObjectIdString(value)
    ? ' — this is a Mongo _id, not the short id business rows key on'
    : '';
  throw new Error(`${label}: expected 12 hex characters, got ${JSON.stringify(value)}${hint}`);
};

/**
 * Narrow a value to an {@link ObjectIdString}, or throw.
 *
 * @param value Candidate id.
 * @param label What is being identified, for the error message.
 * @throws When the value is not 24 lowercase hex characters.
 */
export const objectIdString = (value: unknown, label = 'id'): ObjectIdString => {
  if (isObjectIdString(value)) return value;
  throw new Error(`${label}: expected a 24-character ObjectId string, got ${JSON.stringify(value)}`);
};
