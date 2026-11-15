import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { jsStrings } from '../../tools/js-strings.mjs';
import { evidenceIdsInJson, formatFinding, scanHtml, scanJs, scanJson, scanPage } from '../../tools/page-scan.mjs';
import { FIXTURES, run } from './support.mjs';

const kinds = (result) => result.offenders.map((o) => `${o.line}:${o.kind}:${o.text}`);

describe('scanHtml', () => {
  it('lets sourced, computed and illustrative elements carry numbers and claims', () => {
    const page = [
      '<p data-evidence="a">Tested at 21 % oxygen.</p>',
      '<p><span data-computed="2 x 4 min">8 min</span> total</p>',
      '<ul data-illustrative><li>Mass share 40 %</li></ul>',
    ].join('\n');
    assert.deepEqual(scanHtml(page, 'p.html').offenders, []);
  });

  it('reports an uncited number with a unit and an uncited claim sentence, with line numbers', () => {
    const page = '<h1>Title</h1>\n<p>Narrative.\nThe foam was tested at 30 kPa. Nothing else.</p>\n<p>The limit is not stated.</p>';
    assert.deepEqual(kinds(scanHtml(page, 'p.html')), [
      '3:number-with-unit:30 kPa',
      '3:claim-sentence:The foam was tested at 30 kPa.',
      '4:claim-sentence:The limit is not stated.',
    ]);
  });

  it('ignores scripts, styles, the head and numbers without a unit', () => {
    const page = '<head><title>5 mm tested</title><style>a{width:5mm}</style></head><script>var s = "tested 5 mm";</script><p>Step 3 of 5 in 2026.</p><p>Untested items are listed.</p>';
    assert.deepEqual(scanHtml(page, 'p.html').offenders, []);
  });

  it('treats "Show" and one- or two-word labels as labels and "shows" in a sentence as a claim', () => {
    assert.deepEqual(scanHtml('<button>Show passport</button><span>Tested</span><span>Not tested</span>', 'p.html').offenders, []);
    assert.equal(scanHtml('<p>The page shows the result.</p>', 'p.html').offenders.length, 1);
  });

  it('collects evidence references and flags data-slot and empty markers', () => {
    const page = '<p data-evidence="x  y">a</p>\n<p data-evidence="">b</p>\n<div data-slot="s"></div>\n<p data-computed="">c</p>';
    const result = scanHtml(page, 'p.html');
    assert.deepEqual(result.refs.map((r) => r.id), ['x', 'y']);
    assert.deepEqual(result.problems.map((p) => `${p.line}:${p.kind}`), ['2:empty-marker', '3:data-slot', '4:empty-marker']);
  });

  it('handles void elements, self-closing svg and unclosed tags without losing the marker', () => {
    const page = '<div data-illustrative><img src="a.png"><svg><circle r="1"/><text>5 mm</text></svg><br>12 s</div><p>after 7 s</p>';
    assert.deepEqual(kinds(scanHtml(page, 'p.html')), ['1:number-with-unit:7 s']);
  });
});

describe('jsStrings and scanJs', () => {
  it('extracts quoted and template strings, skipping comments and regular expressions', () => {
    const source = "// 'no'\nconst a = 'one'; /* \"no\" */ const b = /\"x/.test(s); const c = `t ${f(\"in\")} e`;";
    assert.deepEqual(jsStrings(source).map((s) => s.text), ['one', 'in', 't  e']);
  });

  it('checks HTML templates and prose strings but not css or svg path strings', () => {
    const source = [
      "const css = 'opacity 0.5s ease';",
      "const path = 'M 10 20 L 30 40';",
      'const row = (c) => `<li>${c} % of mass</li>`;',
      "const note = 'Burn rate of 3 mm/s measured here';",
    ].join('\n');
    assert.deepEqual(kinds(scanJs(source, 'a.js')), ['3:number-with-unit:0 %', '4:number-with-unit:3 mm/s', '4:claim-sentence:Burn rate of 3 mm/s measured here']);
  });

  it('accepts a prose string that sits next to an evidence, computed or illustrative marker', () => {
    const source = "const note = 'Burn rate of 3 mm/s measured here';\nel.dataset.evidence = 'a';";
    assert.deepEqual(scanJs(source, 'a.js').offenders, []);
  });
});

describe('scanJson and evidenceIdsInJson', () => {
  it('skips illustrative data and flags other numbers with a unit', () => {
    assert.deepEqual(scanJson('{"provenance":"illustrative","m":"Rubber, 1.5 mm"}', 'p.json').offenders, []);
    assert.deepEqual(kinds(scanJson('{\n  "m": "Rubber, 1.5 mm"\n}', 'p.json')), ['2:number-with-unit:.m: 1.5 mm']);
  });
  it('reads evidence ids from evidence keys', () => {
    assert.deepEqual(evidenceIdsInJson({ components: [{ evidence: ['a', 'b'], other: { evidence_id: 'c' } }] }), ['a', 'b', 'c']);
  });
});

describe('scanPage on fixture sites', () => {
  it('passes the clean site, following the script and its JSON data', () => {
    const scan = scanPage(`${FIXTURES}/site-clean`, 'stories/quiet-fire/index.html');
    assert.deepEqual([scan.offenders, scan.problems], [[], []]);
    assert.deepEqual(scan.sources.scripts.map((s) => s.file), ['stories/quiet-fire/app.js']);
    assert.ok(scan.sources.json.some((j) => j.file === 'data/passport.json'));
  });

  it('finds every planted offender in the bad site', () => {
    const root = `${FIXTURES}/site-bad`;
    const home = scanPage(root, 'index.html');
    assert.deepEqual(home.offenders.map(formatFinding), [
      'index.html:6  [number-with-unit]  85 °C',
      'index.html:6  [claim-sentence]  The kettle was tested at 85 °C for the whole afternoon.',
      'data/passport.json:5  [number-with-unit]  .components[0].material: 1.5 mm',
    ]);
    assert.deepEqual(home.problems.map(formatFinding), ['index.html:7  [data-slot]  <div data-slot="intro"> is unfinished copy']);
    assert.deepEqual(home.refs.map((r) => r.id), ['no-such-id', 'tea-steep']);
    assert.deepEqual(scanPage(root, 'stories/quiet-fire/index.html').offenders.map(formatFinding).slice(0, 3), [
      'stories/quiet-fire/app.js:2  [number-with-unit]  3 mm/s',
      'stories/quiet-fire/app.js:2  [claim-sentence]  Burn rate of 3 mm/s measured here',
      'stories/quiet-fire/app.js:3  [number-with-unit]  0 %',
    ]);
  });
});

describe('the offline gate as a whole', () => {
  const gate = (site) => run('--test', ['tests/pages-citations.test.mjs', 'tests/evidence-schema.test.mjs'], { SITE_ROOT: `${FIXTURES}/${site}` });

  it('fails loudly on a site with uncited numbers and lists the offenders', async () => {
    const { status, output } = await gate('site-bad');
    assert.notEqual(status, 0);
    assert.match(output, /index\.html:6 {2}\[number-with-unit\] {2}85 °C/);
    assert.match(output, /index\.html:7 {2}\[data-slot\]/);
    assert.match(output, /unresolved evidence id\(s\)[\s\S]*no-such-id/);
    assert.match(output, /stories\/quiet-fire\/app\.js:3 {2}\[number-with-unit\]/);
  });

  it('passes on a clean site', async () => {
    const { status, output } = await gate('site-clean');
    assert.equal(status, 0, output);
  });

  it('reports a missing evidence file and missing pages instead of crashing', async () => {
    const { status, output } = await gate('does-not-exist');
    assert.notEqual(status, 0);
    assert.match(output, /does not exist/);
    assert.doesNotMatch(output, /TypeError|ENOENT/);
  });
});

describe('scanHtml and data-concept', () => {
  it('lets concept text carry claim words and numbers with units only when it has no digits at all', () => {
    assert.deepEqual(scanHtml('<p><span data-concept>The watch would show the flag to the crew.</span></p>', 'p.html').offenders, []);
  });

  it('reports a digit inside concept text, with its line', () => {
    const page = '<p>Plain.</p>\n<p><span data-concept>The hatch would hold 3 items.</span></p>';
    assert.deepEqual(kinds(scanHtml(page, 'p.html')), ['2:concept-digit:The hatch would hold 3 items.']);
  });

  it('does not count the number of a citation marker as a digit of the concept text', () => {
    const page = '<p><span data-concept><span data-evidence="a">Registration would be required.<sup class="fn"><a href="#src-1">1</a></sup></span></span></p>';
    assert.deepEqual(scanHtml(page, 'p.html').offenders, []);
  });

  it('reports digits in every nested element of concept text', () => {
    assert.equal(scanHtml('<div data-concept><p>Version 2 of the plan.</p><p>No digits here.</p></div>', 'p.html').offenders.length, 1);
  });

  it('does not exempt unmarked text next to concept text', () => {
    const page = '<p><span data-concept>Would flag.</span> The foam was tested at 30 kPa.</p>';
    assert.ok(scanHtml(page, 'p.html').offenders.some((offender) => offender.kind === 'number-with-unit'));
  });
});
