import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { buildPages, siteWarnings, writePages } from '../../tools/build-site.mjs';
import { defaultState } from '../../tools/site/passport.mjs';
import { rules } from '../../tools/site/optional.mjs';
import { PAGES, REPO } from '../../tools/site.mjs';
import { scanHtml } from '../../tools/page-scan.mjs';
import { BuildError } from '../../tools/site/load.mjs';
import { paragraphs } from '../../tools/site/story-page.mjs';
import { removeDir, tempDir } from './support.mjs';

const record = (id, extra = {}) => ({
  id, topic: 'flames', claim: `Claim ${id}.`, quote: 'The flame burned as a round ball and was hard to see for the crew on the station that day.',
  source_title: `Source ${id}`, source_authors: ['A. Author'], source_year: 2001, source_org: 'Example org', source_kind: 'report',
  landing_url: `https://example.org/${id}`, doc_url: `https://example.org/${id}.pdf`, doi: null, locator: 'p. 3', material: 'candle', conditions: {}, limits: 'Small sample.', ...extra,
});
const entry = (id, extra = {}) => ({
  id, title: `Title of ${id}`, premise: 'A premise.', evidence_status: 'partial', status_reason: 'A reason.', state: 'published', theme: 'behaviour',
  basis: [{ accession: 'PSI-1', acronym: 'ABC', doi: '10.1/x', doi_url: 'https://doi.org/10.1/x', what_it_measured: 'Things.', test_rows: 3 }], gaps: ['A gap.'], issue: null, ...extra,
});
const story = (id, extra = {}) => ({
  id, title: `Story ${id}`, dek: 'A dek.', status: 'partial', status_reason: 'A reason.',
  beats: [
    { id: 'one', heading: 'One', sentences: [{ text: 'First sentence.', evidence: ['a'] }, { text: 'Second sentence.', evidence: ['b', 'a'] }, { text: 'Plain sentence.', evidence: [] }], pull_quote: { evidence: 'b' }, figure: null },
    { id: 'two', heading: 'Two', sentences: [{ text: 'Third sentence.', evidence: ['c'] }], pull_quote: null, figure: 'flame-duct' },
  ],
  limits: ['A limit.'], open_questions: [{ text: 'A question?', story: null }], ...extra,
});

const live = (id, name, extra = {}) => ({ id, heading: name, sentences: [{ text: `Text of ${name}.`, evidence: [] }], pull_quote: null, figure: null, interactive: name, ...extra });
const homeStory = (extra = {}) => ({
  id: 'home', title: 'Home story', dek: 'A dek of the home story.', status: 'partial', status_reason: 'A reason.',
  beats: [
    { id: 'without', heading: 'Without', sentences: [{ text: 'Opening one.', evidence: [], illustrative: true }, { text: 'Opening two.', evidence: [], illustrative: true }, { text: 'Cited sentence.', evidence: ['a'] }], pull_quote: null, figure: null, interactive: null },
    { id: 'onboard', heading: 'Onboard', sentences: [{ text: 'Every item would be registered.', evidence: [], concept: true }], pull_quote: null, figure: null, interactive: null },
    live('passport', 'passport', { sentences: [{ text: 'Try the passport.', evidence: [] }] }),
    live('fleet', 'fleet'),
    live('watch', 'watch'),
    { id: 'more', heading: 'More stories', sentences: [{ text: 'More stories follow.', evidence: [] }], pull_quote: null, figure: null, interactive: null, link: { story: 's', text: 'Read story s' } },
  ],
  limits: ['A limit of the home story.'], open_questions: [], ...extra,
});

const realEvidence = JSON.parse(readFileSync(join(REPO, 'data/evidence.json'), 'utf8'));
const realPassport = readFileSync(join(REPO, 'data/passport.json'), 'utf8');
const roots = [];
function site({ shelf = [entry('s')], stories = [story('s')], home = homeStory(), evidence = [record('a'), record('b'), record('c')] } = {}) {
  const root = tempDir();
  roots.push(root);
  const homeEntry = entry('home', { home: true, basis: [], gaps: [] });
  const all = home ? [home, ...stories] : stories;
  const files = {
    'data/stories.json': home ? [homeEntry, ...shelf] : shelf,
    'data/evidence.json': [...realEvidence, ...evidence],
    ...Object.fromEntries(all.map((item) => [`content/stories/${item.id}.json`, item])),
  };
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data/passport.json'), realPassport);
  if (existsSync(join(REPO, 'data/fleet.json'))) writeFileSync(join(root, 'data/fleet.json'), readFileSync(join(REPO, 'data/fleet.json')));
  for (const [path, value] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(value));
  }
  return root;
}
after(() => roots.forEach(removeDir));

const problemsOf = (root) => {
  try {
    buildPages(root);
  } catch (error) {
    assert.ok(error instanceof BuildError, error.message);
    return error.problems;
  }
  return [];
};

describe('build-site failures', () => {
  it('builds a consistent site without problems', () => {
    assert.deepEqual(problemsOf(site()), []);
  });

  it('fails when a sentence cites an evidence id that does not exist', () => {
    const bad = story('s');
    bad.beats[0].sentences[0].evidence = ['missing-id'];
    assert.deepEqual(problemsOf(site({ stories: [bad] })), ['content/stories/s.json beats[0].sentences[0] cites evidence id "missing-id", which is not in data/evidence.json']);
  });

  it('fails when a pull quote cites an unknown evidence id', () => {
    const bad = story('s');
    bad.beats[0].pull_quote = { evidence: 'nope' };
    assert.match(problemsOf(site({ stories: [bad] }))[0], /beats\[0\]\.pull_quote cites evidence id "nope"/);
  });

  it('fails when a story in content has no shelf entry', () => {
    const problems = problemsOf(site({ shelf: [entry('other', { state: 'proposed' })], stories: [story('s')] }));
    assert.ok(problems.includes('content/stories/s.json has no entry with id "s" in data/stories.json'), problems.join('\n'));
  });

  it('fails when a published shelf entry has no content', () => {
    const problems = problemsOf(site({ shelf: [entry('s'), entry('t')], stories: [story('s')] }));
    assert.deepEqual(problems, ['data/stories.json entry "t" is published but content/stories/t.json does not exist']);
  });

  it('does not require content for a proposed shelf entry', () => {
    assert.deepEqual(problemsOf(site({ shelf: [entry('s'), entry('t', { state: 'proposed' })] })), []);
  });

  it('warns, and renders the question without a link, when it names a story that is not on the shelf', () => {
    const root = site({ stories: [story('s', { open_questions: [{ text: 'Why?', story: 'ghost' }] })] });
    assert.deepEqual(problemsOf(root), []);
    assert.deepEqual(siteWarnings(root), ['content/stories/s.json open_questions[0] names story "ghost", which has no entry in data/stories.json']);
    const page = buildPages(root).find(({ path }) => path === 'stories/s/index.html').html;
    assert.ok(page.includes('Why?') && !page.includes('#story-ghost'));
  });

  it('links a question to the card of the story it names', () => {
    const root = site({ shelf: [entry('s'), entry('t', { state: 'proposed' })], stories: [story('s', { open_questions: [{ text: 'Why?', story: 't' }] })] });
    const page = buildPages(root).find(({ path }) => path === 'stories/s/index.html').html;
    assert.ok(page.includes('href="../../#story-t"') && page.includes('data-story="t"'));
    assert.deepEqual(siteWarnings(root), []);
  });

  it('fails when the status in content differs from the shelf', () => {
    const problems = problemsOf(site({ shelf: [entry('s', { evidence_status: 'data' })] }));
    assert.deepEqual(problems, ['content/stories/s.json status "partial" differs from evidence_status in data/stories.json']);
  });

  it('fails with a message, not a crash, when a story has the wrong shape', () => {
    const bad = story('s');
    delete bad.beats[0].sentences[0].evidence;
    assert.deepEqual(problemsOf(site({ stories: [bad] })), ['content/stories/s.json beats[0].sentences must be a list of { text, evidence: [ids] }']);
  });

  it('fails when a beat names a figure that has no controls', () => {
    const bad = story('s');
    bad.beats[1].figure = 'no-such-figure';
    assert.deepEqual(problemsOf(site({ stories: [bad] })), ['a beat asks for figure "no-such-figure", which tools/site/story-page.mjs has no controls for']);
  });

  it('reports every problem at once', () => {
    const bad = story('s');
    bad.beats[0].sentences[0].evidence = ['x1'];
    bad.beats[1].sentences[0].evidence = ['x2'];
    assert.equal(problemsOf(site({ stories: [bad] })).length, 2);
  });
});

describe('paragraphs', () => {
  const sizes = (count) => paragraphs(Array.from({ length: count }, (_, index) => index)).map((group) => group.length);

  it('keeps at most three sentences together and splits the rest as evenly as possible', () => {
    assert.deepEqual([0, 1, 3, 4, 5, 6, 7, 10].map(sizes), [[], [1], [3], [2, 2], [3, 2], [3, 3], [3, 2, 2], [3, 3, 2, 2]]);
  });

  it('keeps the sentences in order', () => {
    assert.deepEqual(paragraphs(['a', 'b', 'c', 'd']).flat(), ['a', 'b', 'c', 'd']);
  });
});

describe('build-site output', () => {
  it('escapes every text from the data files', () => {
    const hostile = '<img src=x onerror="alert(1)"> & "q"';
    const root = site({ shelf: [entry('s', { title: hostile, premise: hostile })], stories: [story('s', { title: hostile, dek: hostile })] });
    for (const { path, html } of buildPages(root)) {
      assert.ok(!html.includes('<img src=x'), `${path} contains unescaped markup`);
      assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;q&quot;'), `${path} does not show the escaped text`);
    }
  });

  it('wraps each cited sentence in data-evidence and numbers sources in order of first use', () => {
    const page = buildPages(site()).find(({ path }) => path === 'stories/s/index.html').html;
    assert.match(page, /<span class="fact" data-evidence="a">First sentence\.<sup class="fn"><a href="#src-1">1<\/a><\/sup><\/span>/);
    assert.match(page, /<span class="fact" data-evidence="b a">Second sentence\.<sup class="fn"><a href="#src-2">2<\/a><\/sup><sup class="fn"><a href="#src-1">1<\/a><\/sup><\/span>/);
    assert.match(page, / Plain sentence\. /);
    assert.equal([...page.matchAll(/<li id="src-\d+">/g)].length, 3);
    assert.ok(page.indexOf('id="src-3"') > page.indexOf('id="src-2"'));
  });

  it('puts the verbatim quote of a pull quote on the page with its source', () => {
    const page = buildPages(site()).find(({ path }) => path === 'stories/s/index.html').html;
    assert.ok(page.includes('“The flame burned as a round ball and was hard to see for the crew on the station that day.”'));
    assert.ok(page.includes('Source b, Example org, 2001.'));
  });

  it('writes one story page per content file and a home page with a card for every shelf entry', () => {
    const root = site({ shelf: [entry('s'), entry('t', { state: 'proposed' })] });
    const written = writePages(root);
    assert.deepEqual(written, ['index.html', 'stories/s/index.html']);
    const home = readFileSync(join(root, 'index.html'), 'utf8');
    for (const id of ['s', 't']) assert.ok(home.includes(`id="story-${id}" data-story="${id}"`), `no card for ${id}`);
    assert.match(home, /Not written yet\./);
    assert.ok(!/data-like|data-discuss|votes__count/.test(home), 'no likes or comments on the shelf');
  });

  it('is idempotent', () => {
    const root = site();
    writePages(root);
    const first = readFileSync(join(root, 'index.html'), 'utf8');
    writePages(root);
    assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), first);
  });

  it('puts the SI disclosure meta tag on every page', () => {
    for (const { path, html } of buildPages(site())) assert.match(html, /<meta name="si-disclosure" content="[^"]+SI assistance[^"]+">/, path);
  });
});

describe('the committed site', () => {
  it('has no open question that names a story missing from the shelf', () => {
    assert.deepEqual(siteWarnings(REPO), []);
  });

  it('has every generated page listed in PAGES, so each one is gated', () => {
    assert.deepEqual(buildPages(REPO).map(({ path }) => path).sort(), [...PAGES].sort());
  });

  for (const path of PAGES) {
    it(`${path} is what npm run build writes now`, () => {
      const generated = buildPages(REPO).find((item) => item.path === path);
      assert.ok(generated, `the generator does not write ${path}`);
      assert.equal(readFileSync(join(REPO, path), 'utf8'), generated.html, `${path} is out of date: run npm run build`);
    });
  }
});

const homePageOf = (root) => buildPages(root).find(({ path }) => path === 'index.html').html;
const withBeat = (id, change) => {
  const bad = homeStory();
  Object.assign(bad.beats.find((beat) => beat.id === id), change);
  return bad;
};

describe('the home story', () => {
  it('needs exactly one shelf entry marked home', () => {
    const none = site({ home: null });
    assert.deepEqual(problemsOf(none), ['data/stories.json must mark exactly one entry with "home": true, it marks 0']);
  });

  it('writes no page of its own for the home story and leaves it off the shelf', () => {
    const root = site();
    assert.deepEqual(buildPages(root).map(({ path }) => path), ['index.html', 'stories/s/index.html']);
    const page = homePageOf(root);
    assert.ok(!page.includes('id="story-home"'), 'the home story has a card on the shelf');
    assert.ok(page.includes('id="story-s"'));
    assert.match(page, /<h1 id="hook-title"[^>]*>Home story<\/h1>/);
  });

  it('shows the first two sentences of the opening beat in the opening and the rest in the scene', () => {
    const page = homePageOf(site());
    const opening = page.slice(page.indexOf('id="hook"'), page.indexOf('id="beat-without"'));
    assert.ok(opening.includes('Opening one.') && opening.includes('Opening two.') && !opening.includes('Cited sentence.'));
    const scene = page.slice(page.indexOf('id="beat-without"'), page.indexOf('id="beat-onboard"'));
    assert.ok(scene.includes('Cited sentence.') && !scene.includes('Opening one.'));
  });

  it('wraps illustrative sentences in data-illustrative and tags the scene', () => {
    const page = homePageOf(site());
    assert.match(page, /<span data-illustrative>Opening one\.<\/span>/);
    assert.match(page, /<p class="beat__mark">Illustrative: invented, not a record\.<\/p>/);
  });

  it('wraps concept sentences in data-concept and tags only the scenes that contain one', () => {
    const page = homePageOf(site());
    assert.match(page, /<span data-concept>Every item would be registered\.<\/span>/);
    const onboard = page.slice(page.indexOf('id="beat-onboard"'), page.indexOf('id="beat-passport"'));
    assert.match(onboard, /<p class="beat__mark">Concept: not built, written as what would happen\.<\/p>/);
    assert.ok(!onboard.includes('Illustrative:'));
    const passport = page.slice(page.indexOf('id="beat-passport"'), page.indexOf('id="beat-fleet"'));
    assert.ok(!passport.includes('Concept: not built'));
  });

  it('keeps a sentence that is both illustrative and cited inside both wrappers', () => {
    const both = withBeat('without', { sentences: [{ text: 'Both.', evidence: ['a'], illustrative: true }, { text: 'Two.', evidence: [] }, { text: 'Three.', evidence: [] }] });
    assert.match(homePageOf(site({ home: both })), /<span data-illustrative><span class="fact" data-evidence="a">Both\.<sup class="fn">/);
  });

  it('fails when a beat names an interactive that does not exist', () => {
    const problems = problemsOf(site({ home: withBeat('fleet', { interactive: 'hologram' }) }));
    assert.ok(problems.includes('content/stories/home.json beats[3].interactive is "hologram", which is not one of passport, fleet, watch or null'), problems.join('\n'));
  });

  it('fails when the home story lacks one of the three interactives, or repeats one', () => {
    assert.ok(problemsOf(site({ home: withBeat('watch', { interactive: null }) })).includes('content/stories/home.json must have exactly one beat with "interactive": "watch", it has 0'));
    assert.ok(problemsOf(site({ home: withBeat('onboard', { interactive: 'fleet' }) })).includes('content/stories/home.json must have exactly one beat with "interactive": "fleet", it has 2'));
  });

  it('fails when another story asks for an interactive', () => {
    const other = story('s');
    other.beats[0].interactive = 'passport';
    assert.match(problemsOf(site({ stories: [other] }))[0], /beats\[0\] asks for the interactive "passport", which only the home story can show/);
  });

  it('fails on a sentence flag that is not a boolean and on a link that names no page', () => {
    const flag = withBeat('onboard', { sentences: [{ text: 'X.', evidence: [], concept: 'yes' }] });
    assert.match(problemsOf(site({ home: flag }))[0], /sentences carry "concept" with a value other than true/);
    const link = withBeat('more', { link: { story: 'home', text: 'Itself' } });
    assert.deepEqual(problemsOf(site({ home: link })), ['content/stories/home.json beats[5].link names story "home", which has no page of its own']);
  });

  it('shows the link of a beat as a link to the page of that story', () => {
    assert.match(homePageOf(site()), /<a class="btn" href="stories\/s\/">Read story s<\/a>/);
  });

  it('shows the shelf, the method and the gates after the story, with computed counts', () => {
    const page = homePageOf(site({ shelf: [entry('s'), entry('t', { state: 'proposed', evidence_status: 'hypothesis' })] }));
    assert.ok(page.indexOf('id="library"') > page.indexOf('id="beat-more"') || !page.includes('id="beat-more"'));
    assert.ok(page.indexOf('id="born"') > page.indexOf('id="library"') && page.indexOf('id="honest"') > page.indexOf('id="born"'));
    assert.match(page, /All <span data-computed="[^"]+">2<\/span>/);
    assert.match(page, /Every sentence with a number mark links to a verbatim quote and its source\./);
    assert.ok(!page.includes('Every fact carries a verbatim quote'));
  });

  it('words the footer so that it is true: numbered sentences link to a verbatim quote, facts are not claimed to be quotes', () => {
    const page = homePageOf(site());
    const footer = page.slice(page.indexOf('<footer class="foot">'), page.indexOf('</footer>'));
    assert.ok(footer.includes('Every numbered sentence links to a verbatim quote from its source.'));
    assert.ok(!page.includes('Every fact is a verbatim quote'));
    assert.ok(footer.includes('Not a safety verdict. This library organises evidence; people decide.'));
    assert.ok(footer.includes('Live app') && footer.includes('Repository') && footer.includes('MIT License'));
  });

  it('lists on a shelf card only the acronym, accession and DOI of an investigation', () => {
    const page = homePageOf(site());
    assert.ok(page.includes('<span class="mono">PSI-1</span> ABC') && page.includes('DOI 10.1/x'));
    assert.ok(!page.includes('Things.') && !page.includes('test rows'));
  });

  it('loads the fleet files only when they exist in the site', () => {
    const root = site();
    assert.ok(!homePageOf(root).includes('assets/css/fleet.css'));
    mkdirSync(join(root, 'assets/css'), { recursive: true });
    mkdirSync(join(root, 'assets/js'), { recursive: true });
    writeFileSync(join(root, 'assets/css/fleet.css'), '');
    writeFileSync(join(root, 'assets/js/fleet-view.js'), '');
    const page = homePageOf(root);
    assert.ok(page.includes('assets/css/fleet.css') && page.includes('assets/js/fleet-view.js'));
    assert.ok(!buildPages(root).find(({ path }) => path === 'stories/s/index.html').html.includes('fleet.css'));
  });

  it('puts a fleet view, or a quiet placeholder, in the two fleet beats', () => {
    const page = homePageOf(site());
    const views = [...page.matchAll(/<fleet-view mode="(overview|scenario)"/g)].map((match) => match[1]);
    const placeholders = [...page.matchAll(/fleet-slot--missing" data-mode="(overview|scenario)"/g)].map((match) => match[1]);
    assert.deepEqual([...views, ...placeholders].sort(), ['overview', 'scenario']);
  });
});

describe('the passport on the home page, written at build time', () => {
  const passport = JSON.parse(realPassport);
  const page = homePageOf(site());

  it('has a real QR code for the live passport and a link to the same address', () => {
    const url = `https://cargo.qwadratic.me/frontend/?cargo=${passport.slug}&route=R23`;
    assert.match(page, /<svg class="pp-qr__svg" viewBox="0 0 \d+ \d+" role="img" aria-label="QR code that opens the live passport/);
    assert.ok(page.includes(`href="${url.replaceAll('&', '&amp;')}"`));
    assert.ok((page.match(/<svg class="pp-qr__svg"[\s\S]*?<\/svg>/)[0].match(/h1v1h-1z/g) ?? []).length > 200, 'the code has too few dark modules to be a QR code');
  });

  it('marks the item details illustrative and lists every component of the passport', () => {
    assert.ok(page.includes(`<h3 id="pp-title" data-illustrative>${passport.name}</h3>`));
    for (const component of passport.components) {
      assert.ok(page.includes(`<h4 class="pp-row__name" data-illustrative>${component.name}</h4>`), component.id);
      assert.match(page, new RegExp(`id="pp-row-${component.id}" data-component="${component.id}" data-status="(applies|differs|none)"`));
    }
  });

  it('offers both controls and the two drawings, and shows the state it was written for', () => {
    for (const vehicle of passport.vehicles) assert.ok(page.includes(`name="pp-vehicle" value="${vehicle.id}"`));
    for (const place of passport.places) assert.ok(page.includes(`name="pp-place" value="${place.id}"`));
    assert.ok(page.includes('<figure-host name="stowage-bay"') && page.includes('<figure-host name="instrument"'));
    if (!rules) return;
    const state = defaultState(passport, rules.assess);
    assert.ok(page.includes(`data-vehicle="${state.vehicle}" data-place="${state.place}"`));
    const expected = rules.assess(passport, state);
    for (const status of ['applies', 'differs', 'none']) assert.ok(page.includes(`<b data-pp-count="${status}">${expected.summary[status]}</b>`), status);
    assert.ok(page.includes(`data-pp-o2>${expected.env.o2_percent}</span>`) && page.includes(`data-pp-pressure>${expected.env.pressure_kpa}</span>`));
  });

  it('words the three statuses exactly and gives each its own shape', () => {
    const chips = [...page.matchAll(/<template data-pp-chips>[\s\S]*?<\/template>/g)][0][0];
    for (const [status, label] of [['applies', 'Evidence applies'], ['differs', 'Conditions differ'], ['none', 'No evidence']]) {
      assert.ok(chips.includes(`pp-chip--${status}"`) && chips.includes(`<span>${label}</span>`), status);
    }
    const glyphs = new Set([...chips.matchAll(/<svg class="pp-chip__glyph"[^>]*>([\s\S]*?)<\/svg>/g)].map((match) => match[1]));
    assert.equal(glyphs.size, 3);
  });

  it('cites every reason it writes: each claim paragraph carries data-evidence', () => {
    const rows = page.slice(page.indexOf('class="pp-rows"'), page.indexOf('<template data-pp-chips>'));
    assert.ok((rows.match(/<p data-evidence="[^"]+">/g) ?? []).length >= passport.components.length);
  });

  it('writes the caveat about gravity as the cited record, not as a sentence of its own', () => {
    const caveats = [...page.matchAll(/<div class="pp-row__caveat" data-pp-caveat>([\s\S]*?)<\/div>/g)].map((match) => match[1]);
    assert.ok(caveats.length >= 1, 'a row that applies carries the caveat');
    for (const caveat of caveats) {
      assert.match(caveat, /^<p data-evidence="eclss-tm-essentially-all-flammability-test-data-1g">A NASA reduced-pressure-atmospheres report says that essentially all existing test data for flammability of flight materials are from 1-g testing/);
      assert.ok(caveat.includes('class="fn"'), 'the claim carries its citation mark');
      assert.ok(!/<p class="small"/.test(caveat), 'no hand-written paragraph before the record');
    }
    assert.ok(!page.includes('where gravity is present'));
  });

  it('writes no number or finding of its own into the markup outside computed or cited elements', () => {
    const scan = scanHtml(page, 'index.html');
    assert.deepEqual(scan.offenders.filter((item) => /pp-|passport/i.test(item.text)), []);
  });
});
