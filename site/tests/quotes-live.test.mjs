import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSourceText, landingStatus, locateQuote } from '../tools/source-text.mjs';
import { loadEvidence, missingEvidenceMessage } from '../tools/site.mjs';

const evidence = loadEvidence();

describe('evidence sources (network)', { concurrency: 4 }, () => {
  it('evidence file exists and is valid', () => {
    assert.equal(evidence.status, 'ok', missingEvidenceMessage(evidence));
  });

  for (const item of evidence.items) {
    it(`${item.id}: doc_url contains the quote verbatim`, { timeout: 240_000 }, async (t) => {
      const result = locateQuote(await getSourceText(item.doc_url), item.quote);
      if (result.found && result.match !== 'exact') t.diagnostic(`${item.id}: matched only ignoring letter case`);
      assert.ok(result.found, [
        `quote not found in ${item.doc_url}`,
        `quote: ${item.quote}`,
        result.fragment ? `longest fragment that does occur: ${result.fragment}\nsource around it: ${result.hint}` : 'no run of four or more quote words occurs in the source',
      ].join('\n'));
    });

    it(`${item.id}: landing_url answers with 2xx or 3xx`, { timeout: 240_000 }, async () => {
      const status = await landingStatus(item.landing_url);
      assert.ok(status >= 200 && status < 400, `${item.landing_url} answered ${status}`);
    });
  }
});
