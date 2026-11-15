import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { parseJsonLoose, validateCoverage, validateSupport } from '../judge/validate.mjs';
import { FIXTURES, REPO, listen, localEvidenceFile, removeDir, run, sourceServer, tempDir } from './support.mjs';

const RUN = `${REPO}/tests/judge/run.mjs`;
const SUPPORT_FILES = ['support-tea-pdf.json', 'support-tea-steep.json'];
const COVERAGE_PAGES = ['index.html', 'vehicle/index.html', 'stories/index.html', ...['quiet-fire', 'moon-air', 'battery-orbit', 'cygnus-big-fires', 'round-flame', 'cool-flame', 'weightless-extinguish', 'smoke-alarm', 'fans-off', 'moon-gravity', 'earth-spinoffs'].map((id) => `stories/${id}/index.html`)];
const fileOf = (page) => `coverage-${page.replaceAll('/', '_').replace('.html', '')}.json`;
const COVERAGE_FILES = COVERAGE_PAGES.map(fileOf).sort();

let dir;
let sources;
let env;

before(async () => {
  dir = tempDir();
  sources = await sourceServer();
  env = {
    SITE_ROOT: `${FIXTURES}/site-clean`,
    EVIDENCE_FILE: localEvidenceFile(dir, sources.url),
    CACHE_DIR: `${dir}/cache`,
    REPORT_DIR: `${dir}/reports`,
    ANTHROPIC_API_KEY: '',
  };
});
after(async () => {
  removeDir(dir);
  await sources.close();
});

const readReport = () => JSON.parse(readFileSync(`${dir}/reports/judge-report.json`, 'utf8'));

function writeVerdicts(target, { support = {}, coverage = {} } = {}) {
  mkdirSync(target, { recursive: true });
  const verdict = (id, change) => ({ id, verdict: 'supported', problems: [], judge: 'external-judge', ...change });
  writeFileSync(`${target}/support-tea-steep.json`, JSON.stringify(verdict('tea-steep', support['tea-steep'])));
  writeFileSync(`${target}/support-tea-pdf.json`, JSON.stringify(verdict('tea-pdf', support['tea-pdf'])));
  const page = (name, change) => ({ page: name, judge: 'external-judge', assertions: [{ text: 'a claim', line: 6, evidence: ['tea-steep'] }], ...change });
  for (const name of COVERAGE_PAGES) writeFileSync(`${target}/${fileOf(name)}`, JSON.stringify(page(name, coverage[name])));
}

describe('answer parsing and validation', () => {
  it('parses plain JSON, fenced JSON and JSON inside prose', () => {
    assert.deepEqual(parseJsonLoose('{"a":1}'), { a: 1 });
    assert.deepEqual(parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(parseJsonLoose('Here is my answer: {"a":{"b":2}} done'), { a: { b: 2 } });
    assert.throws(() => parseJsonLoose('no json here'), /not a JSON object/);
  });
  it('validates support answers', () => {
    assert.deepEqual(validateSupport({ id: 'x', verdict: 'supported', problems: [] }, 'x'), []);
    assert.match(validateSupport({ id: 'y', verdict: 'maybe', problems: [] }, 'x').join(), /id is "y".*verdict "maybe"/);
    assert.match(validateSupport({ id: 'x', verdict: 'partial', problems: [] }, 'x').join(), /needs at least one problem/);
  });
  it('validates coverage answers against the known ids', () => {
    const known = new Set(['a']);
    assert.deepEqual(validateCoverage({ page: 'p', assertions: [{ text: 't', line: null, evidence: ['a'] }, { text: 'u', line: 3, evidence: 'unbacked' }] }, 'p', known), []);
    assert.match(validateCoverage({ page: 'p', assertions: [{ text: 't', line: 1, evidence: ['zzz'] }] }, 'p', known).join(), /unknown id "zzz"/);
    assert.match(validateCoverage({ page: 'p', assertions: [{ text: 't', line: 1, evidence: [] }] }, 'p', known).join(), /non-empty list/);
  });
});

describe('without a key or without evidence the judge does not pretend', () => {
  it('exits 2 and says the judge did not run when ANTHROPIC_API_KEY is not set', async () => {
    const { status, output } = await run(RUN, [], env);
    assert.equal(status, 2);
    assert.match(output, /judge did not run: ANTHROPIC_API_KEY is not set/);
  });
  it('exits 2 when there is no evidence file', async () => {
    const { status, output } = await run(RUN, [], { ...env, EVIDENCE_FILE: `${dir}/none.json`, ANTHROPIC_API_KEY: 'k' });
    assert.equal(status, 2);
    assert.match(output, /judge did not run: .*does not exist/);
  });
  it('exits 2 on bad arguments', async () => {
    assert.equal((await run(RUN, ['--ingest'], env)).status, 2);
  });
});

describe('--emit-inputs', () => {
  it('writes one file per call with the full prompt and the answer schema, and calls no model', async () => {
    const out = `${dir}/emitted`;
    const { status, output } = await run(RUN, ['--emit-inputs', out], env);
    assert.equal(status, 0, output);
    assert.deepEqual(readdirSync(out).sort(), [...COVERAGE_FILES, ...SUPPORT_FILES]);
    const support = JSON.parse(readFileSync(`${out}/support-tea-steep.json`, 'utf8'));
    assert.equal(support.kind, 'support');
    assert.match(support.system, /evidence auditor/);
    assert.match(support.user, /Claim: The made-up handbook says/);
    assert.match(support.user, /<<<SOURCE[\s\S]*steeped for four minutes[\s\S]*SOURCE>>>/);
    assert.deepEqual(support.answer_schema.required, ['id', 'verdict', 'problems']);
    const coverage = JSON.parse(readFileSync(`${out}/coverage-index.json`, 'utf8'));
    assert.match(coverage.user, /L7: The handbook shows that the sample was steeped/);
    assert.match(coverage.user, /- id: tea-pdf/);
    assert.deepEqual(coverage.answer_schema.required, ['page', 'assertions']);
  });

  it('marks a quote that is missing from the live source', async () => {
    const out = `${dir}/emitted-wrong`;
    const wrong = JSON.parse(readFileSync(env.EVIDENCE_FILE, 'utf8'));
    wrong[0].quote = 'This sentence does not occur anywhere in the fictional handbook at all today';
    const file = `${dir}/evidence-wrong.json`;
    writeFileSync(file, JSON.stringify(wrong));
    assert.equal((await run(RUN, ['--emit-inputs', out], { ...env, EVIDENCE_FILE: file })).status, 0);
    assert.match(JSON.parse(readFileSync(`${out}/support-tea-steep.json`, 'utf8')).user, /THE QUOTE WAS NOT FOUND/);
  });
});

describe('--ingest', () => {
  it('produces the report and exit 0 when every item is supported and every assertion is backed', async () => {
    writeVerdicts(`${dir}/verdicts-ok`, { support: { 'tea-pdf': { verdict: 'partial', problems: ['Temperature is made up.'] } } });
    const { status, output } = await run(RUN, ['--ingest', `${dir}/verdicts-ok`], env);
    assert.equal(status, 0, output);
    const report = readReport();
    assert.equal(report.mode, 'ingest');
    assert.deepEqual(report.judges, ['external-judge']);
    assert.deepEqual(report.totals.support, { supported: 1, partial: 1, unsupported: 0, error: 0 });
    assert.equal(report.pass, true);
    assert.match(readFileSync(`${dir}/reports/judge-report.md`, 'utf8'), /\| tea-pdf \| partial \| Temperature is made up\. \|/);
  });

  it('exits 1 when an item is unsupported', async () => {
    writeVerdicts(`${dir}/verdicts-bad`, { support: { 'tea-steep': { verdict: 'unsupported', problems: ['Number differs.'] } } });
    const { status, output } = await run(RUN, ['--ingest', `${dir}/verdicts-bad`], env);
    assert.equal(status, 1);
    assert.match(output, /unsupported {2}tea-steep: Number differs\./);
  });

  it('exits 1 when an assertion is unbacked', async () => {
    writeVerdicts(`${dir}/verdicts-unbacked`, { coverage: { 'index.html': { assertions: [{ text: 'Foam never burns.', line: 9, evidence: 'unbacked' }] } } });
    const { status, output } = await run(RUN, ['--ingest', `${dir}/verdicts-unbacked`], env);
    assert.equal(status, 1);
    assert.match(output, /unbacked {2}index\.html:9 {2}Foam never burns\./);
  });

  it('counts a missing or malformed verdict file as an error, never as a pass', async () => {
    writeVerdicts(`${dir}/verdicts-gap`);
    writeFileSync(`${dir}/verdicts-gap/support-tea-pdf.json`, '{"id":"tea-pdf","verdict":"great"}');
    assert.equal(existsSync(`${dir}/verdicts-gap/coverage-index.json`), true);
    writeFileSync(`${dir}/verdicts-gap/coverage-index.json`, 'not json');
    const { status, output } = await run(RUN, ['--ingest', `${dir}/verdicts-gap`], env);
    assert.equal(status, 1);
    assert.match(output, /2 error|1 error/);
    assert.equal(readReport().totals.support.error, 1);
    assert.equal(readReport().totals.coverage.page_errors, 1);
  });
});

describe('live mode against a stand-in for the Messages API', () => {
  const seen = [];
  let api;
  let behaviour = {};

  const reply = (text) => ({ id: 'msg_x', type: 'message', role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text }] });

  before(async () => {
    api = await listen((request, response) => {
      let body = '';
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        const call = JSON.parse(body);
        seen.push({ headers: request.headers, call, url: request.url });
        const user = call.messages[0].content;
        const id = user.match(/^Evidence id: (.+)$/m)?.[1];
        const page = user.match(/^Page: (.+)$/m)?.[1];
        const answer = id
          ? { id, verdict: behaviour[id] ?? 'supported', problems: behaviour[id] === 'unsupported' ? ['The number differs.'] : [] }
          : { page, assertions: [{ text: 'A sourced sentence.', line: 6, evidence: behaviour.unbacked ? 'unbacked' : ['tea-steep'] }] };
        response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(reply(`\`\`\`json\n${JSON.stringify(answer)}\n\`\`\``)));
      });
    });
  });
  after(() => api.close());

  const live = (extra = {}) => run(RUN, [], { ...env, ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: api.url, ...extra });

  it('sends the documented request, reads the text block, and passes', async () => {
    seen.length = 0;
    behaviour = {};
    const { status, output } = await live();
    assert.equal(status, 0, output);
    assert.equal(seen.length, 2 + COVERAGE_PAGES.length);
    const first = seen[0];
    assert.equal(first.url, '/v1/messages');
    assert.equal(first.headers['x-api-key'], 'test-key');
    assert.equal(first.headers['anthropic-version'], '2023-06-01');
    assert.equal(first.call.model, 'claude-sonnet-5-5');
    assert.ok(first.call.max_tokens > 0 && typeof first.call.system === 'string');
    const report = readReport();
    assert.equal(report.model, 'claude-sonnet-5-5');
    assert.deepEqual(report.judges, ['claude-sonnet-5-5']);
    assert.equal(report.totals.coverage.assertions, COVERAGE_PAGES.length);
  });

  it('takes the model from JUDGE_MODEL and exits 1 on an unsupported item', async () => {
    seen.length = 0;
    behaviour = { 'tea-pdf': 'unsupported' };
    const { status } = await live({ JUDGE_MODEL: 'claude-test-model' });
    assert.equal(status, 1);
    assert.equal(seen[0].call.model, 'claude-test-model');
    assert.equal(readReport().support.find((r) => r.id === 'tea-pdf').verdict, 'unsupported');
  });

  it('exits 1 on an unbacked assertion', async () => {
    behaviour = { unbacked: true };
    assert.equal((await live()).status, 1);
  });

  it('records an answer that stays invalid after one retry as an error', async () => {
    const broken = await listen((request, response) => {
      request.resume();
      request.on('end', () => response.writeHead(200).end(JSON.stringify(reply('I cannot answer in JSON.'))));
    });
    const { status } = await live({ ANTHROPIC_BASE_URL: broken.url });
    await broken.close();
    assert.equal(status, 1);
    assert.equal(readReport().totals.support.error, 2);
  });
});
