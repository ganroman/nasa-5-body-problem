import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateEvidence, validateItem } from '../../tools/evidence-schema.mjs';
import { FIXTURES } from './support.mjs';

const good = JSON.parse(readFileSync(`${FIXTURES}/site-clean/data/evidence.json`, 'utf8'));
const fail = (change) => validateItem({ ...good[0], ...change });

describe('validateEvidence', () => {
  it('accepts the fixture items', () => {
    assert.deepEqual(validateEvidence(good).flatMap((r) => r.problems), []);
  });
  it('flags a duplicate id', () => {
    assert.match(validateEvidence([good[0], good[0]])[1].problems.join(), /duplicate id "tea-steep"/);
  });
  it('flags missing fields', () => {
    const { quote, ...rest } = good[0];
    assert.match(validateItem(rest).join(), /missing field "quote"/);
  });
  it('requires https URLs', () => {
    assert.match(fail({ doc_url: 'http://example.invalid/x' }).join(), /doc_url must be an https URL/);
    assert.match(fail({ landing_url: 'not a url' }).join(), /landing_url must be an https URL/);
  });
  it('requires a quote of 8 to 60 words', () => {
    assert.match(fail({ quote: 'too short for this' }).join(), /8 to 60 words \(found 4\)/);
    assert.match(fail({ quote: 'word '.repeat(61) }).join(), /found 61/);
  });
  it('requires a one-sentence claim and tolerates abbreviations and decimals', () => {
    assert.match(fail({ claim: 'It burned. It went out.' }).join(), /exactly one sentence \(found 2\)/);
    assert.deepEqual(fail({ claim: 'The U.S. sample burned at 21.5 percent, e.g. in air, per Fig. 3.' }), []);
  });
  it('checks year, doi and conditions', () => {
    assert.match(fail({ source_year: '2001' }).join(), /source_year/);
    assert.match(fail({ doi: 'doi:abc' }).join(), /doi must be null or a DOI/);
    assert.match(fail({ conditions: { o2_percent: '21' } }).join(), /o2_percent must be a number or null/);
    assert.match(fail({ conditions: {} }).join(), /conditions is missing "gravity"/);
  });
  it('rejects an item that is not an object', () => {
    assert.deepEqual(validateItem('x'), ['is not an object']);
  });
});
