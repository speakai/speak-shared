import { describe, expect, it } from 'vitest';
import { shortId, objectIdString, isShortId, isObjectIdString } from '../src/utils/ids.js';

describe('shortId', () => {
  it('accepts the 12-hex id generateId produces', () => {
    expect(shortId('79139b20ddfe')).toBe('79139b20ddfe');
  });

  it('names an ObjectId as that specific mistake', () => {
    // The plausible wrong value: right type, right character set, wrong id space.
    expect(() => shortId('6aaab9585b8fec51f015dc08', 'knowledgeBaseId')).toThrow(
      /this is a Mongo _id, not the short id/,
    );
  });

  it.each([[undefined], [null], [''], ['79139B20DDFE'], ['79139b20ddf'], ['79139b20ddfef'], [12]])(
    'rejects %p',
    (value) => {
      expect(() => shortId(value)).toThrow();
    },
  );
});

describe('objectIdString', () => {
  it('accepts a 24-hex string', () => {
    expect(objectIdString('6aaab9585b8fec51f015dc08')).toBe('6aaab9585b8fec51f015dc08');
  });

  it('rejects the short id', () => {
    expect(() => objectIdString('79139b20ddfe')).toThrow();
  });
});

describe('guards', () => {
  it('separate the two spaces', () => {
    expect(isShortId('79139b20ddfe')).toBe(true);
    expect(isShortId('6aaab9585b8fec51f015dc08')).toBe(false);
    expect(isObjectIdString('6aaab9585b8fec51f015dc08')).toBe(true);
    expect(isObjectIdString('79139b20ddfe')).toBe(false);
  });
});
