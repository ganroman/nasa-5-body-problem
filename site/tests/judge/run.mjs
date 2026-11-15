import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { REPO, PAGES, loadEvidence, missingEvidenceMessage, siteRoot } from '../../tools/site.mjs';
import { buildCoverageCall, buildSupportCall, expectedCalls } from './inputs.mjs';
import { askModel, defaultModel } from './model.mjs';
import { buildReport, renderMarkdown } from './report.mjs';
import { parseJsonLoose, validateCoverage, validateSupport } from './validate.mjs';

const USAGE = 'usage: node tests/judge/run.mjs [--emit-inputs <dir> | --ingest <dir>]';
const CONCURRENCY = 4;

function stop(code, message) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const [flag, dir, extra] = argv;
  if (argv.length === 0) return { mode: 'live' };
  if (argv.length !== 2 || extra !== undefined || !['--emit-inputs', '--ingest'].includes(flag) || !dir) stop(2, USAGE);
  return { mode: flag === '--emit-inputs' ? 'emit' : 'ingest', dir };
}

async function pool(list, work) {
  const results = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, async () => {
    while (next < list.length) {
      const at = next++;
      results[at] = await work(list[at]);
    }
  }));
  return results;
}

const problemOf = (error) => (error.cause?.message ?? error.message);
const failedSupport = (id, judge, message) => ({ id, verdict: 'error', problems: [message], judge });
const failedCoverage = (page, judge, message) => ({ page, assertions: [], judge, error: message });

function accept(call, answer, knownIds) {
  const errors = call.kind === 'support' ? validateSupport(answer, call.key) : validateCoverage(answer, call.key, knownIds);
  if (errors.length) throw new Error(`invalid answer: ${errors.join('; ')}`);
  return call.kind === 'support'
    ? { id: answer.id, verdict: answer.verdict, problems: answer.problems }
    : { page: answer.page, assertions: answer.assertions };
}

async function judgeLive(call, spec, config, knownIds) {
  let failure;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await askModel({ system: call.system, user: call.user, model: config.model, apiKey: config.apiKey });
      return { ...accept(spec, parseJsonLoose(text), knownIds), judge: config.model };
    } catch (error) {
      failure = error;
    }
  }
  const message = `judge call failed: ${problemOf(failure)}`;
  return spec.kind === 'support' ? failedSupport(spec.key, config.model, message) : failedCoverage(spec.key, config.model, message);
}

function ingestOne(spec, dir, knownIds) {
  const file = `${dir}/${spec.name}.json`;
  const fail = (message) => (spec.kind === 'support' ? failedSupport(spec.key, 'unknown', message) : failedCoverage(spec.key, 'unknown', message));
  if (!existsSync(file)) return fail(`verdict file ${spec.name}.json is missing`);
  let answer;
  try {
    answer = parseJsonLoose(readFileSync(file, 'utf8'));
    return { ...accept(spec, answer, knownIds), judge: typeof answer.judge === 'string' && answer.judge ? answer.judge : 'unnamed' };
  } catch (error) {
    return { ...fail(`${spec.name}.json: ${problemOf(error)}`), judge: typeof answer?.judge === 'string' ? answer.judge : 'unknown' };
  }
}

function writeReport(report) {
  const dir = process.env.REPORT_DIR ?? `${REPO}/reports`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/judge-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(`${dir}/judge-report.md`, renderMarkdown(report));
  return dir;
}

function printSummary(report, dir) {
  const { support, coverage } = report.totals;
  console.log(`judge ${report.pass ? 'PASS' : 'FAIL'}  model=${report.model}  mode=${report.mode}`);
  console.log(`support: ${support.supported} supported, ${support.partial} partial, ${support.unsupported} unsupported, ${support.error} error`);
  console.log(`coverage: ${coverage.assertions} assertions, ${coverage.backed} backed, ${coverage.unbacked} unbacked, ${coverage.page_errors} page error(s)`);
  for (const r of report.support.filter((r) => r.verdict !== 'supported')) console.log(`  ${r.verdict}  ${r.id}: ${r.problems.join(' ')}`);
  for (const page of report.coverage) {
    if (page.error) console.log(`  error  ${page.page}: ${page.error}`);
    for (const a of page.assertions.filter((a) => a.evidence === 'unbacked')) console.log(`  unbacked  ${page.page}:${a.line ?? '?'}  ${a.text}`);
  }
  console.log(`reports written to ${dir}/judge-report.json and judge-report.md`);
}

const { mode, dir } = parseArgs(process.argv.slice(2));
const evidence = loadEvidence();
if (evidence.status !== 'ok') stop(2, `judge did not run: ${missingEvidenceMessage(evidence)}`);
const missingPages = PAGES.filter((page) => !existsSync(`${siteRoot()}/${page}`));
if (missingPages.length) stop(2, `judge did not run: page(s) not found: ${missingPages.join(', ')}`);

const knownIds = new Set(evidence.items.map((item) => item.id));
const specs = expectedCalls(evidence.items, PAGES);
const itemById = new Map(evidence.items.map((item) => [item.id, item]));
const model = defaultModel();
const build = (spec) => (spec.kind === 'support' ? buildSupportCall(itemById.get(spec.key)) : buildCoverageCall(spec.key, evidence.items));

let results;
if (mode === 'ingest') {
  results = specs.map((spec) => ingestOne(spec, dir, knownIds));
} else if (mode === 'emit') {
  mkdirSync(dir, { recursive: true });
  const skipped = [];
  await pool(specs, async (spec) => {
    try {
      writeFileSync(`${dir}/${spec.name}.json`, `${JSON.stringify(await build(spec), null, 2)}\n`);
    } catch (error) {
      skipped.push(`${spec.name}: ${problemOf(error)}`);
    }
  });
  console.log(`${specs.length - skipped.length} judge input(s) written to ${dir}; no model was called`);
  if (skipped.length) stop(1, `input(s) not written:\n${skipped.join('\n')}`);
  process.exit(0);
} else {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) stop(2, 'judge did not run: ANTHROPIC_API_KEY is not set');
  results = await pool(specs, async (spec) => {
    try {
      return await judgeLive(await build(spec), spec, { model, apiKey }, knownIds);
    } catch (error) {
      const message = `could not build the judge input: ${problemOf(error)}`;
      return spec.kind === 'support' ? failedSupport(spec.key, model, message) : failedCoverage(spec.key, model, message);
    }
  });
}

const report = buildReport({
  model: mode === 'ingest' ? 'ingested verdicts' : model,
  mode,
  support: results.filter((_, i) => specs[i].kind === 'support'),
  coverage: results.filter((_, i) => specs[i].kind === 'coverage'),
});
printSummary(report, writeReport(report));
process.exit(report.pass ? 0 : 1);
