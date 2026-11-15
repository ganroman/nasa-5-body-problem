import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { NASA_DOMAINS, classOf, slugFor } from '../../tools/evidence-base/classify.mjs';
import { ConfigError } from '../../tools/evidence-base/errors.mjs';
import { collectDocuments } from '../../tools/evidence-base/inputs.mjs';
import { splitPages } from '../../tools/evidence-base/page.mjs';
import { main } from '../../tools/evidence-base/run.mjs';
import { findGbrain } from '../../tools/evidence-base/gbrain.mjs';
import { REPO, removeDir, tempDir } from './support.mjs';

const FIXTURES = join(REPO, 'tests', 'fixtures', 'evidence-base');
const fixtureText = (name) => readFileSync(join(FIXTURES, name), 'utf8');

/** A local document server. `pages` maps a path to { type, body, etag }; the answers can be changed during a test. */
async function documentServer(urlHost) {
  const pages = new Map();
  const log = [];
  const server = createServer((request, response) => {
    const path = request.url.split('?')[0];
    const page = pages.get(path);
    log.push({ path, ifNoneMatch: request.headers['if-none-match'] ?? null });
    if (!page) return response.writeHead(404).end('missing');
    if (page.status) return response.writeHead(page.status).end('server trouble');
    if (page.etag && request.headers['if-none-match'] === page.etag) return response.writeHead(304).end();
    const headers = { 'content-type': page.type };
    if (page.etag) headers.etag = page.etag;
    return response.writeHead(200, headers).end(page.body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://${urlHost}:${server.address().port}`,
    pages,
    log,
    close: () => new Promise((done) => { server.closeAllConnections(); server.close(done); }),
  };
}

const html = (name, extra = {}) => ({ type: 'text/html; charset=utf-8', body: fixtureText(name), ...extra });

/** A world: the "nasa" server (host 127.0.0.1, which the tests add to the NASA hosts), the "other" server (host localhost), a site root and a base. */
async function makeWorld() {
  const dir = tempDir();
  const nasa = await documentServer('127.0.0.1');
  const other = await documentServer('localhost');
  nasa.pages.set('/alpha.html', html('alpha.html'));
  nasa.pages.set('/tea.pdf', { type: 'application/pdf', body: readFileSync(join(REPO, 'tests/fixtures/tea.pdf')) });
  other.pages.set('/beta.html', html('beta.html'));
  other.pages.set('/gamma.html', html('gamma.html'));
  const site = join(dir, 'site');
  mkdirSync(`${site}/data`, { recursive: true });
  mkdirSync(`${site}/research/evidence`, { recursive: true });
  const fill = (text) => text.replaceAll('{{NASA}}', nasa.url).replaceAll('{{OTHER}}', other.url);
  writeFileSync(`${site}/data/evidence.json`, fill(fixtureText('evidence.template.json')));
  writeFileSync(`${site}/research/evidence/fixture-lane.verified.json`, fill(fixtureText('lane.verified.template.json')));
  writeFileSync(`${site}/research/sources-inbox.txt`, fill(fixtureText('inbox.template.txt')));
  const base = join(dir, 'base');
  const env = {
    PATH: '/usr/bin:/bin',
    SITE_ROOT: site,
    EVIDENCE_HOST_PAUSE_MS: '0',
    EVIDENCE_RETRY_MS: '1',
  };
  const run = async (args = [], extraEnv = {}) => {
    const lines = [];
    const errors = [];
    const code = await main(['--base', base, '--no-sync', ...args], { ...env, ...extraEnv }, (line) => lines.push(line), (line) => errors.push(line));
    return { code, lines, errors, output: [...lines, ...errors].join('\n') };
  };
  return {
    dir, site, base, env, nasa, other, run,
    page: (documentClass, slugPart) => {
      const folder = `${base}/${documentClass}/documents`;
      const name = readdirSync(folder).find((file) => file.includes(slugPart));
      return name ? readFileSync(`${folder}/${name}`, 'utf8') : null;
    },
    manifest: () => JSON.parse(readFileSync(`${base}/manifest.json`, 'utf8')),
    head: () => execFileSync('git', ['-C', base, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    gitStatus: () => execFileSync('git', ['-C', base, 'status', '--porcelain'], { encoding: 'utf8' }),
    commitCount: () => Number(execFileSync('git', ['-C', base, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' })),
    close: async () => { await nasa.close(); await other.close(); removeDir(dir); },
  };
}

/** The frontmatter of a page. Every value is written as JSON, which is also valid YAML. */
function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  assert.ok(match, 'page starts with frontmatter');
  return Object.fromEntries(match[1].split('\n').map((line) => {
    const at = line.indexOf(': ');
    return [line.slice(0, at), JSON.parse(line.slice(at + 2))];
  }));
}

before(() => { NASA_DOMAINS.push('127.0.0.1'); });
after(() => { NASA_DOMAINS.pop(); });

describe('document class and slug', () => {
  it('calls nasa.gov and its subdomains "nasa" and everything else "other"', () => {
    for (const url of ['https://nasa.gov/a', 'https://www.nasa.gov/a.pdf', 'https://ntrs.nasa.gov/api/citations/1/downloads/x.pdf', 'https://NTRS.NASA.GOV/x', 'https://psi.nasa.gov./x']) {
      assert.equal(classOf(url), 'nasa', url);
    }
    for (const url of ['https://www.nist.gov/x', 'https://notnasa.gov/x', 'https://nasa.gov.example.com/x', 'https://example.com/nasa.gov', 'https://bpb-us-w2.wpmucdn.com/x.pdf']) {
      assert.equal(classOf(url), 'other', url);
    }
  });

  it('builds a stable lower-case slug from organisation, year, title and a hash of the URL', () => {
    const input = { url: 'https://ntrs.nasa.gov/x.pdf', org: 'NASA Glenn Research Center / NASA ISS Office', year: 2016, title: 'A Researcher\'s Guide to: Combustion Science (ISS Researcher\'s Guide series; NP-2015)' };
    const slug = slugFor(input);
    assert.equal(slug, slugFor({ ...input }));
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.match(slug, /^nasa-glenn-research-2016-a-researcher-s-guide-to-combustion-science-[0-9a-f]{8}$/);
    assert.notEqual(slug, slugFor({ ...input, url: 'https://ntrs.nasa.gov/y.pdf' }));
  });

  it('uses "nd" for a missing year, clips long titles and falls back to the file name', () => {
    assert.match(slugFor({ url: 'https://example.com/a/report-final.pdf', org: null, year: null, title: null }), /^nd-report-final-pdf-[0-9a-f]{8}$/);
    const long = slugFor({ url: 'https://example.com/x', org: 'Org', year: 2000, title: 'word '.repeat(60) });
    assert.ok(long.length <= 100, long);
  });
});

describe('collecting documents', () => {
  it('merges the three inputs, counts a claim id once and keeps the published claim', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    const documents = collectDocuments({ siteRoot: world.site, evidenceFile: `${world.site}/data/evidence.json` });
    assert.equal(documents.size, 4, 'alpha (one document despite the #fragment), beta, tea and the inbox-only gamma');
    const alpha = documents.get(`${world.nasa.url}/alpha.html`);
    assert.deepEqual(alpha.claims.map((claim) => claim.id), ['fake-alpha-1', 'fake-alpha-2']);
    assert.equal(alpha.claims[0].published, true);
    assert.equal(alpha.claims[1].published, false);
    assert.equal(alpha.title, 'Fictional Fire Bulletin');
    assert.equal(alpha.authors, 'Made-Up Author; Second Invented Author');
    assert.equal(alpha.class, 'nasa');
    assert.equal(documents.get(`${world.other.url}/beta.html`).class, 'other');
    const gamma = documents.get(`${world.other.url}/gamma.html`);
    assert.deepEqual([gamma.claims.length, gamma.title], [0, 'Gamma title from the list']);
  });

  it('refuses an inbox line that is not a URL and names the line', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    writeFileSync(`${world.site}/research/sources-inbox.txt`, '# list\n\nnot a url\ttitle\n');
    assert.throws(() => collectDocuments({ siteRoot: world.site, evidenceFile: `${world.site}/data/evidence.json` }), (error) => error instanceof ConfigError && /line 3/.test(error.message));
  });
});

describe('the build', () => {
  it('writes pages, indexes, manifest and a commit; the frontmatter parses and the quote status is right', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    const first = await world.run();
    assert.equal(first.code, 0, first.output);
    const alpha = world.page('nasa', 'fictional-fire-bulletin');
    const meta = frontmatter(alpha);
    assert.equal(meta.type, 'source');
    assert.equal(meta.title, 'Fictional Fire Bulletin');
    assert.deepEqual(meta.claim_ids, ['fake-alpha-1', 'fake-alpha-2']);
    assert.equal(meta.source_class, 'nasa');
    assert.equal(meta.date, '2001-01-01');
    assert.equal(meta.source_url, `${world.nasa.url}/alpha.html`);
    assert.equal(meta.authors, 'Made-Up Author; Second Invented Author');
    assert.match(meta.sha256, /^[0-9a-f]{64}$/);
    assert.match(meta.licence_note, /not checked/);
    assert.match(alpha, /Quote in the text fetched on \d{4}-\d{2}-\d{2}: found \(exact match\)/);
    assert.match(alpha, /> The imaginary sample flamed for nine seconds/);
    assert.match(alpha, /## Full text/);
    assert.match(alpha, /pretend chamber was cleaned/);
    const beta = world.page('other', 'imaginary-gas-report');
    const betaMeta = frontmatter(beta);
    assert.equal(betaMeta.title, 'Imaginary Gas Report: with a colon, "quotes" and a # sign');
    assert.equal(betaMeta.doi, '10.1234/fake.beta');
    assert.equal(betaMeta.licence_note, 'licence not confirmed; kept for private research, do not republish');
    assert.ok(world.page('other', 'gamma-title-from-the-list'), 'the inbox-only document has a page');
    assert.match(readFileSync(`${world.base}/nasa/index.md`, 'utf8'), /\[Fictional Fire Bulletin\]\(documents\/.*\.md\), 2001, 2 claims/);
    const manifest = world.manifest();
    const entry = manifest.documents[`${world.nasa.url}/alpha.html`];
    assert.deepEqual(entry.claims, [{ id: 'fake-alpha-1', found: true, match: 'exact' }, { id: 'fake-alpha-2', found: true, match: 'exact' }]);
    assert.equal(entry.failures, 0);
    assert.equal(world.commitCount(), 1);
    assert.equal(world.gitStatus(), '');
    assert.ok(!execFileSync('git', ['-C', world.base, 'ls-files'], { encoding: 'utf8' }).includes('raw/'), 'raw files are not tracked');
    assert.ok(existsSync(`${world.base}/raw/nasa`), 'but they are kept on disk');
  });

  it('writes frontmatter that a real YAML parser reads back to the same values (when python3 with PyYAML is installed)', async (t) => {
    const probe = spawnSync('python3', ['-c', 'import yaml'], { encoding: 'utf8' });
    if (probe.status !== 0) return t.skip('python3 with PyYAML is not installed');
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    const script = 'import sys, json, re, yaml\ntext = open(sys.argv[1], encoding="utf8").read()\nprint(json.dumps(yaml.safe_load(re.match(r"^---\\n(.*?)\\n---\\n", text, re.S).group(1))))';
    for (const [documentClass, part] of [['nasa', 'fictional-fire-bulletin'], ['other', 'imaginary-gas-report']]) {
      const folder = `${world.base}/${documentClass}/documents`;
      const file = join(folder, readdirSync(folder).find((name) => name.includes(part)));
      const parsed = JSON.parse(execFileSync('python3', ['-c', script, file], { encoding: 'utf8' }));
      assert.deepEqual(parsed, frontmatter(readFileSync(file, 'utf8')));
    }
  });

  it('splits a PDF by page and checks quotes against its text', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    const tea = world.page('nasa', 'fictional-tea-handbook');
    assert.match(tea, /### Page 1\n\nFictional Tea Handbook/);
    assert.match(tea, /Quote in the text fetched on \d{4}-\d{2}-\d{2}: found/);
    assert.deepEqual(splitPages('one\ftwo\f\n\n=====LAYOUT=====\n\nignored').map((page) => [page.number, page.text]), [[1, 'one'], [2, 'two']]);
  });

  it('is idempotent: a second run changes no file, makes no commit and writes no report', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    const head = world.head();
    const manifestBefore = readFileSync(`${world.base}/manifest.json`, 'utf8');
    const reports = readdirSync(`${world.base}/reports`);
    const second = await world.run();
    assert.equal(second.code, 0, second.output);
    assert.equal(world.head(), head);
    assert.equal(readFileSync(`${world.base}/manifest.json`, 'utf8'), manifestBefore);
    assert.equal(world.gitStatus(), '');
    assert.deepEqual(readdirSync(`${world.base}/reports`), reports);
    assert.match(second.output, /files changed 0, commit none/);
  });

  it('sends a conditional request after the first run and treats a 304 as unchanged', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    world.nasa.pages.set('/alpha.html', html('alpha.html', { etag: '"v1"' }));
    assert.equal((await world.run()).code, 0);
    const head = world.head();
    world.nasa.log.length = 0;
    const second = await world.run();
    assert.equal(second.code, 0, second.output);
    assert.deepEqual(world.nasa.log.filter((entry) => entry.path === '/alpha.html').map((entry) => entry.ifNoneMatch), ['"v1"']);
    assert.equal(world.head(), head);
    assert.match(second.output, /new 0, changed 0, unreachable 0, files changed 0/);
  });

  it('rewrites the page and commits when a document changes', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    const before = world.page('nasa', 'fictional-fire-bulletin');
    world.nasa.pages.set('/alpha.html', html('alpha.html', { body: fixtureText('alpha.html').replace('</body>', '<p>A third paragraph was added later to this made-up bulletin.</p></body>') }));
    const second = await world.run();
    assert.equal(second.code, 0, second.output);
    const after = world.page('nasa', 'fictional-fire-bulletin');
    assert.notEqual(after, before);
    assert.match(after, /A third paragraph was added later/);
    assert.equal(frontmatter(after).sha256 === frontmatter(before).sha256, false);
    assert.equal(world.commitCount(), 2);
    assert.match(readFileSync(`${world.base}/reports/${new Date().toISOString().slice(0, 10)}.md`, 'utf8'), /### Changed documents\n- Fictional Fire Bulletin/);
  });

  it('keeps the last good page when a fetch fails, marks the entry and fails the run after three runs in a row', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    const before = world.page('nasa', 'fictional-fire-bulletin');
    world.nasa.pages.set('/alpha.html', { status: 503 });
    for (const failures of [1, 2]) {
      const failed = await world.run();
      assert.equal(failed.code, 0, failed.output);
      assert.match(failed.output, /unreachable: .*alpha\.html: http 503/);
      assert.equal(world.page('nasa', 'fictional-fire-bulletin'), before, 'the page is not deleted or changed');
      assert.equal(world.manifest().documents[`${world.nasa.url}/alpha.html`].failures, failures);
    }
    const third = await world.run();
    assert.equal(third.code, 1);
    assert.match(third.output, /FAILED 3 RUNS IN A ROW: .*alpha\.html/);
    assert.equal(world.page('nasa', 'fictional-fire-bulletin'), before);
    world.nasa.pages.set('/alpha.html', html('alpha.html'));
    const recovered = await world.run();
    assert.equal(recovered.code, 0, recovered.output);
    assert.equal(world.manifest().documents[`${world.nasa.url}/alpha.html`].failures, 0);
  });

  it('exits 1 and names the claim when a quote is no longer in its document', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    world.nasa.pages.set('/alpha.html', html('alpha.html', { body: fixtureText('alpha.html').replace('flamed for nine seconds', 'flamed for ten seconds') }));
    const second = await world.run();
    assert.equal(second.code, 1);
    assert.match(second.output, /QUOTE NOT FOUND: fake-alpha-1 in .*alpha\.html/);
    assert.doesNotMatch(second.output, /QUOTE NOT FOUND: fake-alpha-2/);
    assert.match(world.page('nasa', 'fictional-fire-bulletin'), /Quote in the text fetched on \d{4}-\d{2}-\d{2}: NOT FOUND/);
    const report = readFileSync(`${world.base}/reports/${new Date().toISOString().slice(0, 10)}.md`, 'utf8');
    assert.match(report, /### Quotes no longer found\n- fake-alpha-1 in /);
    assert.deepEqual(world.manifest().documents[`${world.nasa.url}/alpha.html`].claims.map((claim) => claim.found), [false, true]);
  });

  it('keeps full text for "other" by default and only quoted passages with --other-text excerpts', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    assert.match(world.page('other', 'imaginary-gas-report'), /## Full text/);
    assert.match(world.page('other', 'imaginary-gas-report'), /This page is a test fixture\. It is made up/);
    assert.equal((await world.run(['--other-text', 'excerpts'])).code, 0);
    const excerpts = world.page('other', 'imaginary-gas-report');
    assert.match(excerpts, /## Excerpts/);
    assert.doesNotMatch(excerpts, /## Full text/);
    assert.match(excerpts, /held a pretend mixture for seven days/);
    assert.match(frontmatter(excerpts).licence_note, /only the quoted passages/);
    assert.match(world.page('nasa', 'fictional-fire-bulletin'), /## Full text/, 'the NASA class always keeps the full text');
  });

  it('leaves the page type out when the setting says none', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run([], { EVIDENCE_PAGE_TYPE: 'none' })).code, 0);
    assert.equal('type' in frontmatter(world.page('nasa', 'fictional-fire-bulletin')), false);
  });

  it('reads JSON and CSV answers as text, the way the site\'s quote check does', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    world.other.pages.set('/gamma.html', { type: 'application/json', body: JSON.stringify({ note: 'A made-up record with a pretend value of seven.', range: 'between <5 and >2 in a pretend unit' }) });
    const run = await world.run();
    assert.equal(run.code, 0, run.output);
    assert.match(world.page('other', 'gamma-title-from-the-list'), /A made-up record with a pretend value of seven\./);
    assert.match(world.page('other', 'gamma-title-from-the-list'), /between <5 and >2 in a pretend unit/, 'text between < and > is kept, which the site\'s HTML stripping would cut');
    assert.ok(readdirSync(`${world.base}/raw/other`).some((name) => name.endsWith('.json')));
  });

  it('builds only one class with --only and leaves the other alone', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run(['--only', 'other'])).code, 0);
    assert.ok(existsSync(`${world.base}/other/documents`));
    assert.ok(!existsSync(`${world.base}/nasa`));
  });

  it('reports a document of an unsupported type as unreachable instead of writing an empty page', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    world.other.pages.set('/gamma.html', { type: 'image/png', body: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0xfe]) });
    const run = await world.run();
    assert.equal(run.code, 0, 'an inbox-only document that fails does not fail the run');
    assert.match(run.output, /unreachable: .*gamma\.html: unsupported content type "image\/png"/);
    assert.equal(world.page('other', 'gamma'), null);
  });
});

describe('hostile input and bad setups', () => {
  it('writes frontmatter and body safely for a title with a colon, quotes and newline, a URL with & and ;, and comment markers', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    const claims = JSON.parse(readFileSync(`${world.site}/data/evidence.json`, 'utf8'));
    claims.push({
      id: 'hostile-1',
      claim: 'two\nlines <!--- gbrain:facts:begin --> here',
      quote: 'The imaginary sample flamed for nine seconds',
      source_title: 'Evil: "quoted"\nnew line --- # { } [ ] <!-- timeline -->',
      source_org: 'Org: "x"\n--- title: y',
      source_year: 2005,
      doc_url: `${world.nasa.url}/alpha.html?a=1&b=2;x=$(touch PWNED)#frag`,
      locator: 'p. 1\n<!-- timeline -->',
      limits: 'a\n<!-- timeline -->\nb',
    });
    writeFileSync(`${world.site}/data/evidence.json`, JSON.stringify(claims));
    world.nasa.pages.set('/alpha.html', html('alpha.html'));
    const run = await world.run();
    assert.equal(run.code, 0, run.output);
    const text = world.page('nasa', 'evil-quoted');
    const meta = frontmatter(text);
    assert.equal(meta.title, 'Evil: "quoted"\nnew line --- # { } [ ] <!-- timeline -->');
    assert.equal(meta.source_url, `${world.nasa.url}/alpha.html?a=1&b=2;x=$(touch%20PWNED)`, 'the URL is stored as the URL parser writes it, without the fragment');
    const body = text.slice(text.indexOf('\n---\n', 4) + 5);
    assert.equal(body.match(/^<!--/gm), null, 'no line of the body opens a comment, so no forged timeline or facts marker');
    assert.doesNotMatch(body, /<!--/, 'the comment opener is written out everywhere in the body');
    assert.ok(!existsSync(join(REPO, 'PWNED')));
  });

  it('refuses a base directory that already holds other files, and leaves them alone', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    mkdirSync(world.base, { recursive: true });
    writeFileSync(`${world.base}/precious.txt`, 'keep me');
    const run = await world.run();
    assert.equal(run.code, 2);
    assert.match(run.output, /not an evidence base: it holds precious\.txt\. Give --base a new or empty directory/);
    assert.equal(readdirSync(world.base).join(), 'precious.txt', 'nothing was added: no git repository, no commit');
  });

  it('exits 2 with a clear message when the base cannot be created', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    writeFileSync(`${world.dir}/a-file`, 'x');
    const lines = [];
    const code = await main(['--base', `${world.dir}/a-file/inside`, '--no-sync'], world.env, () => {}, (line) => lines.push(line));
    assert.equal(code, 2);
    assert.match(lines.join('\n'), /cannot use .*a-file\/inside as the evidence base \(ENOTDIR\)\. Check that the path is a directory this user may read and write/);
  });

  it('exits 2 with advice, not a stack trace, when the base\'s git repository is damaged', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    writeFileSync(`${world.base}/.git/HEAD`, 'garbage\n');
    const run = await world.run();
    assert.equal(run.code, 2);
    assert.match(run.output, /the git repository of the base could not commit: .*\nCheck that .* belongs to the user running this/);
    assert.doesNotMatch(run.output, /unexpected error/);
  });

  it('exits 2 instead of silently doing nothing when the inputs hold no document at all', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    const lines = [];
    const code = await main(['--base', world.base, '--no-sync'], { ...world.env, SITE_ROOT: `${world.dir}/no-such-site` }, () => {}, (line) => lines.push(line));
    assert.equal(code, 2);
    assert.match(lines.join('\n'), /no document found in the inputs: .*Check SITE_ROOT/);
  });

  it('keeps blank and comment lines of the reading list out of the base, and a failed fetch of a new claim still shows its status', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    writeFileSync(`${world.site}/research/sources-inbox.txt`, '# a comment\n\n   \n\t\n  # an indented comment\n');
    assert.equal((await world.run()).code, 0);
    assert.equal(Object.keys(world.manifest().documents).length, 3, 'alpha, beta and tea from the claims; nothing from the comment lines');
    world.nasa.pages.set('/alpha.html', { status: 503 });
    const claims = JSON.parse(readFileSync(`${world.site}/data/evidence.json`, 'utf8'));
    claims.push({ ...claims[0], id: 'fake-alpha-extra', quote: 'The imaginary sample flamed for nine seconds in the pretend chamber' });
    writeFileSync(`${world.site}/data/evidence.json`, JSON.stringify(claims));
    const run = await world.run();
    assert.equal(run.code, 0, run.output);
    assert.match(world.page('nasa', 'fictional-fire-bulletin'), /### fake-alpha-extra[\s\S]*?: found \(exact match\)/, 'a claim added while the document is down is checked against the last good text');
  });

  it('does not write a page it cannot date when the manifest is lost and the document is down', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    assert.equal((await world.run()).code, 0);
    writeFileSync(`${world.base}/manifest.json`, `${JSON.stringify({ version: 1, documents: {} })}\n`);
    world.nasa.pages.set('/alpha.html', { status: 503 });
    const run = await world.run();
    assert.equal(run.code, 0, run.output);
    assert.doesNotMatch(world.page('nasa', 'fictional-fire-bulletin'), /fetched_at: "null"|sha256: "null"/);
  });
});

describe('the lock and the settings', () => {
  it('refuses to run while another live run holds the lock, and ignores a stale lock', async (t) => {
    const world = await makeWorld();
    t.after(() => world.close());
    mkdirSync(world.base, { recursive: true });
    writeFileSync(`${world.base}/.evidence-base.lock`, JSON.stringify({ pid: process.pid, started: Date.now() }));
    const blocked = await world.run();
    assert.equal(blocked.code, 2);
    assert.match(blocked.output, /another run is active/);
    assert.ok(existsSync(`${world.base}/.evidence-base.lock`), 'the lock of the other run stays');
    writeFileSync(`${world.base}/.evidence-base.lock`, JSON.stringify({ pid: 99999999, started: Date.now() }));
    const run = await world.run();
    assert.equal(run.code, 0, run.output);
    assert.ok(!existsSync(`${world.base}/.evidence-base.lock`), 'the lock is released');
  });

  it('exits 2 with a clear message on bad settings', async () => {
    const run = async (argv, env = {}) => {
      const errors = [];
      const code = await main(argv, { PATH: '/usr/bin:/bin', ...env }, () => {}, (line) => errors.push(line));
      return { code, text: errors.join('\n') };
    };
    assert.match((await run([])).text, /no base directory/);
    assert.equal((await run(['--base', '/tmp/x', '--only', 'mars'])).code, 2);
    assert.equal((await run(['--base', '/tmp/x', '--other-text', 'some'])).code, 2);
    assert.equal((await run(['--base', '/tmp/x', '--nonsense'])).code, 2);
    assert.match((await run(['--base', '/tmp/x'], { EVIDENCE_HOST_PAUSE_MS: 'soon' })).text, /EVIDENCE_HOST_PAUSE_MS/);
  });
});

/** A fake gbrain: records its arguments, keeps the registered sources in a file and shows what git had committed when sync ran. */
function fakeGbrain(dir) {
  const file = join(dir, 'gbrain');
  writeFileSync(file, `#!${process.execPath}
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2);
const state = process.env.FAKE_GBRAIN_STATE;
const sources = existsSync(state) ? JSON.parse(readFileSync(state, 'utf8')) : [];
let committed = null;
if (process.env.FAKE_GBRAIN_FAIL === args[0]) {
  console.error('simulated gbrain failure: database is locked');
  process.exit(1);
}
if (args[0] === 'sync') {
  const path = sources.find((source) => source.id === args[2]).local_path;
  committed = execFileSync('git', ['-C', path, 'ls-tree', '-r', '--name-only', 'HEAD', '--', '.'], { encoding: 'utf8' }).trim().split('\\n').length;
}
appendFileSync(process.env.FAKE_GBRAIN_LOG, JSON.stringify({ args, committed }) + '\\n');
// The real \`gbrain sources list --json\` prints { sources: [{ id, name, local_path, federated, archived, ... }] }.
if (args[0] === 'sources' && args[1] === 'list') console.log(JSON.stringify({ sources: sources }, null, 2));
if (args[0] === 'sources' && args[1] === 'add') writeFileSync(state, JSON.stringify([...sources, { id: args[2], name: args[2], local_path: args[4], federated: args.includes('--federated'), archived: false }]));
if (args[0] === 'sync') console.log('ok, ' + committed + ' files');
// The real search prints a list with one row per matching chunk, the passage in chunk_text.
if (args[0] === 'search') console.log(JSON.stringify([
  { slug: 'documents/some-page', title: 'Some page', score: 0.5, chunk_text: 'a  made-up\\nsnippet' },
  { slug: 'documents/some-page', title: 'Some page', score: 0.4, chunk_text: 'a second chunk of the same page' },
]));
`);
  chmodSync(file, 0o755);
  return file;
}

describe('gbrain sync', () => {
  async function gbrainWorld(t) {
    const world = await makeWorld();
    const tools = join(world.dir, 'tools');
    mkdirSync(tools);
    const bin = fakeGbrain(tools);
    // The fake is an ES module script: give it a package scope so node reads it as one.
    writeFileSync(`${tools}/package.json`, '{"type":"module"}');
    const log = join(world.dir, 'gbrain.log');
    const env = { GBRAIN_BIN: bin, FAKE_GBRAIN_LOG: log, FAKE_GBRAIN_STATE: join(world.dir, 'gbrain-state.json') };
    const calls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []);
    t.after(() => world.close());
    return { world, env, calls };
  }

  // The harness runs with --no-sync; these tests need the sync step, so they call main directly.
  async function runWithSync(world, env, args = []) {
    const lines = [];
    const errors = [];
    const code = await main(['--base', world.base, ...args], { ...world.env, ...env }, (line) => lines.push(line), (line) => errors.push(line));
    return { code, output: [...lines, ...errors].join('\n') };
  }

  it('registers each missing source as federated, then syncs it by id after the commit', async (t) => {
    const { world, env, calls } = await gbrainWorld(t);
    const run = await runWithSync(world, env);
    assert.equal(run.code, 0, run.output);
    const recorded = calls();
    assert.deepEqual(recorded.map((call) => call.args.slice(0, 3)), [
      ['sources', 'list', '--json'],
      ['sources', 'add', 'nasa-evidence'],
      ['sync', '--source', 'nasa-evidence'],
      ['sources', 'add', 'other-evidence'],
      ['sync', '--source', 'other-evidence'],
    ]);
    assert.deepEqual(recorded[1].args, ['sources', 'add', 'nasa-evidence', '--path', `${world.base}/nasa`, '--federated']);
    assert.deepEqual(recorded[3].args, ['sources', 'add', 'other-evidence', '--path', `${world.base}/other`, '--federated']);
    assert.deepEqual(recorded[2].args, ['sync', '--source', 'nasa-evidence', '--no-pull']);
    assert.ok(recorded[2].committed >= 2 && recorded[4].committed >= 2, 'the files were already committed when sync ran');
    assert.match(run.output, /registered nasa-evidence/);
    assert.match(run.output, /synced other-evidence/);
  });

  it('registers nothing on the next run, only syncs', async (t) => {
    const { world, env, calls } = await gbrainWorld(t);
    assert.equal((await runWithSync(world, env)).code, 0);
    const before = calls().length;
    assert.equal((await runWithSync(world, env)).code, 0);
    const second = calls().slice(before);
    assert.deepEqual(second.map((call) => call.args.slice(0, 2)), [['sources', 'list'], ['sync', '--source'], ['sync', '--source']]);
  });

  it('prints the commands and runs none with --dry-run, and writes nothing', async (t) => {
    const { world, env, calls } = await gbrainWorld(t);
    const run = await runWithSync(world, env, ['--dry-run']);
    assert.equal(run.code, 0, run.output);
    assert.deepEqual(calls(), []);
    assert.match(run.output, /would run \S+ sources add nasa-evidence --path \S+\/nasa --federated/);
    assert.match(run.output, /would run \S+ sync --source other-evidence --no-pull/);
    assert.ok(!existsSync(world.base), 'a dry run creates no base');
  });

  it('skips the sync with a message when gbrain is absent, and fails only with --require-gbrain', async (t) => {
    const { world } = await gbrainWorld(t);
    const skipped = await runWithSync(world, {});
    assert.equal(skipped.code, 0, skipped.output);
    assert.match(skipped.output, /gbrain not found .*sync skipped/);
    const required = await runWithSync(world, {}, ['--require-gbrain']);
    assert.equal(required.code, 2);
    assert.equal(findGbrain({ PATH: '/usr/bin:/bin' }), null);
    assert.equal(findGbrain({ GBRAIN_BIN: '/nonexistent/gbrain' }), null);
  });

  it('passes every argument as one list entry: a path with spaces, quotes and shell syntax reaches gbrain untouched', async (t) => {
    const { world, env, calls } = await gbrainWorld(t);
    const odd = join(world.dir, 'my base; touch PWNED $(touch PWNED2) `touch PWNED3`');
    const lines = [];
    const code = await main(['--base', odd], { ...world.env, ...env }, (line) => lines.push(line), (line) => lines.push(line));
    assert.equal(code, 0, lines.join('\n'));
    assert.deepEqual(calls().find((call) => call.args[1] === 'add').args, ['sources', 'add', 'nasa-evidence', '--path', `${odd}/nasa`, '--federated']);
    for (const name of ['PWNED', 'PWNED2', 'PWNED3']) assert.ok(!existsSync(join(world.dir, name)) && !existsSync(join(REPO, name)), name);
  });

  it('keeps the commit, writes the report and exits 2 with the gbrain message when gbrain fails', async (t) => {
    const { world, env } = await gbrainWorld(t);
    const run = await runWithSync(world, { ...env, FAKE_GBRAIN_FAIL: 'sync' });
    assert.equal(run.code, 2);
    assert.match(run.output, /simulated gbrain failure: database is locked/);
    assert.match(run.output, /fix gbrain|Fix gbrain/);
    assert.doesNotMatch(run.output, /unexpected error/, 'a gbrain failure is a setup problem with advice, not a stack trace');
    assert.equal(world.commitCount(), 1, 'the base is committed before gbrain runs');
    const report = readFileSync(`${world.base}/reports/${new Date().toISOString().slice(0, 10)}.md`, 'utf8');
    assert.match(report, /The gbrain step FAILED: .*simulated gbrain failure/);
    assert.match(report, /registered nasa-evidence/, 'what was done before the failure is reported');
  });

  it('stops with advice when a registered source is archived or points at another directory', async (t) => {
    const { world, env } = await gbrainWorld(t);
    assert.equal((await runWithSync(world, env)).code, 0);
    const state = env.FAKE_GBRAIN_STATE;
    const sources = JSON.parse(readFileSync(state, 'utf8'));
    writeFileSync(state, JSON.stringify(sources.map((source) => (source.id === 'nasa-evidence' ? { ...source, archived: true } : source))));
    const archived = await runWithSync(world, env);
    assert.equal(archived.code, 2);
    assert.match(archived.output, /nasa-evidence is archived\. Restore it with "gbrain sources restore nasa-evidence"/);
    writeFileSync(state, JSON.stringify(sources.map((source) => (source.id === 'nasa-evidence' ? { ...source, local_path: '/somewhere/else' } : source))));
    const moved = await runWithSync(world, env);
    assert.equal(moved.code, 2);
    assert.match(moved.output, /registered at \/somewhere\/else, but this base is at .*gbrain sources set-path nasa-evidence/);
  });

  it('writes reading leads for the next story and says they create no evidence', async (t) => {
    const { world, env } = await gbrainWorld(t);
    writeFileSync(`${world.site}/data/stories.json`, JSON.stringify([{ id: 'round-flame', title: 'The round flame' }]));
    writeFileSync(`${world.site}/data/votes.json`, JSON.stringify({ next: 'round-flame', proposals: [], stories: {} }));
    const run = await runWithSync(world, env, ['--leads']);
    assert.equal(run.code, 0, run.output);
    const leads = readFileSync(`${world.base}/reports/leads-round-flame.md`, 'utf8');
    assert.match(leads, /creates no evidence/);
    assert.match(leads, /documents\/some-page: Some page \(score 0\.5\)\n {2}a made-up snippet/);
    assert.equal(leads.match(/documents\/some-page/g).length, 1, 'a page that matched in two chunks is listed once');
  });
});

describe('no shell anywhere', () => {
  it('starts programs only through execFile with an argument list', () => {
    const sources = readdirSync(join(REPO, 'tools/evidence-base')).filter((name) => name.endsWith('.mjs'));
    for (const name of sources) {
      const text = readFileSync(join(REPO, 'tools/evidence-base', name), 'utf8');
      assert.doesNotMatch(text, /\bexecSync\(|(?<![.\w])exec\(|shell:\s*true/, `${name} must not use a shell`);
    }
    assert.match(readFileSync(join(REPO, 'tools/evidence-base/exec.mjs'), 'utf8'), /execFile\(file, args,/);
  });

  it('can be run as a program: --dry-run exits 0 and a missing base exits 2', () => {
    const env = { ...process.env, SITE_ROOT: join(REPO, 'tests/fixtures/site-clean') };
    delete env.EVIDENCE_BASE_DIR;
    assert.equal(spawnSync(process.execPath, ['tools/evidence-base/run.mjs', '--dry-run', '--base', '/tmp/never-created-base'], { cwd: REPO, env }).status, 0);
    assert.equal(spawnSync(process.execPath, ['tools/evidence-base/run.mjs'], { cwd: REPO, env }).status, 2);
  });
});
