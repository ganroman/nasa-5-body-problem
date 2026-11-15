import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { PAGES, loadEvidence, missingEvidenceMessage, siteRoot } from '../tools/site.mjs';
import { formatFinding, scanPage } from '../tools/page-scan.mjs';

const evidence = loadEvidence();
const known = new Set(evidence.items.map((item) => item.id));

const report = (list, what) => `${list.length} ${what}:\n${list.map(formatFinding).join('\n')}`;

for (const page of PAGES) {
  describe(`page ${page}`, () => {
    const exists = existsSync(`${siteRoot()}/${page}`);
    it('exists', () => assert.ok(exists, `${siteRoot()}/${page} does not exist yet`));
    if (!exists) return;
    const scan = scanPage(siteRoot(), page);

    it('has no unfinished copy (data-slot) and no empty markers', () => {
      assert.equal(scan.problems.length, 0, report(scan.problems, 'problem(s)'));
    });

    it('every data-evidence id resolves to an evidence item', () => {
      assert.equal(evidence.status, 'ok', missingEvidenceMessage(evidence));
      const unresolved = scan.refs.filter((ref) => !known.has(ref.id))
        .map((ref) => ({ file: ref.file, line: ref.line, kind: 'unknown-evidence-id', text: ref.id }));
      assert.equal(unresolved.length, 0, report(unresolved, 'unresolved evidence id(s)'));
    });

    it('every number with a unit and every claim sentence is sourced, computed or illustrative', () => {
      assert.equal(scan.offenders.length, 0, report(scan.offenders, 'unsourced statement(s)'));
    });
  });
}
