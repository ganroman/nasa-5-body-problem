import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateEvidence } from '../tools/evidence-schema.mjs';
import { PAGES, loadEvidence, missingEvidenceMessage, passportPath, siteRoot } from '../tools/site.mjs';
import { evidenceIdsInJson, scanPage } from '../tools/page-scan.mjs';

const evidence = loadEvidence();

describe('evidence file', () => {
  it('exists and is valid JSON', () => {
    assert.equal(evidence.status, 'ok', missingEvidenceMessage(evidence));
  });

  const checked = evidence.status === 'ok' ? validateEvidence(evidence.items) : [];
  for (const { id, problems } of checked) {
    it(`item ${id} has the required shape`, () => {
      assert.deepEqual(problems, []);
    });
  }
});

describe('references to evidence ids', { skip: evidence.status !== 'ok' && 'no evidence file to resolve references against' }, () => {
  const known = new Set(evidence.items.map((item) => item.id));
  const refs = [];
  for (const page of PAGES) {
    if (existsSync(`${siteRoot()}/${page}`)) refs.push(...scanPage(siteRoot(), page).refs.map((ref) => ({ ...ref, page })));
  }
  if (existsSync(passportPath())) {
    for (const id of evidenceIdsInJson(JSON.parse(readFileSync(passportPath(), 'utf8')))) refs.push({ id, file: 'data/passport.json', line: 1 });
  }

  it('every id used by the pages and by passport.json exists', () => {
    const unknown = [...new Set(refs.filter((ref) => !known.has(ref.id)).map((ref) => `${ref.file}:${ref.line}  unknown evidence id "${ref.id}"`))];
    assert.equal(unknown.length, 0, `${unknown.length} unresolved reference(s):\n${unknown.join('\n')}`);
  });

  it('every evidence item is used at least once (unused ones are listed)', (t) => {
    const used = new Set(refs.map((ref) => ref.id));
    const unused = [...known].filter((id) => !used.has(id));
    if (unused.length) t.diagnostic(`unused evidence items (${unused.length}): ${unused.join(', ')}`);
  });
});
