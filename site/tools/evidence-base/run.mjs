#!/usr/bin/env node
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { acquireLock, commitAll, ensureBase, loadManifest, manifestText, writeIfChanged } from './base.mjs';
import { slugFor } from './classify.mjs';
import { parseConfig } from './config.mjs';
import { ConfigError } from './errors.mjs';
import { syncGbrain } from './gbrain.mjs';
import { collectDocuments } from './inputs.mjs';
import { writeLeads } from './leads.mjs';
import { renderIndex, renderPage } from './page.mjs';
import { EXTRACTOR, checkQuotes, perHost, refreshDocument, storedText } from './refresh.mjs';
import { renderReport } from './report.mjs';

const CLASSES = ['nasa', 'other'];
const STUCK_RUNS = 3;
const isoSeconds = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

/** The last part of the URL path as a title, for a document that no claim or list line names. */
function fileNameTitle(url) {
  const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? url;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** The manifest entry of a document after this run. */
function buildEntry({ doc, previous, result, now }) {
  const entry = {
    url: doc.url,
    class: doc.class,
    slug: previous?.slug ?? slugFor({ url: doc.url, org: doc.publisher, year: doc.year, title: doc.title }),
    title: doc.title ?? result.fresh?.html_title ?? previous?.title ?? null,
    authors: doc.authors ?? previous?.authors ?? null,
    year: doc.year ?? previous?.year ?? null,
    publisher: doc.publisher ?? previous?.publisher ?? null,
    landing_url: doc.landingUrl ?? previous?.landing_url ?? null,
    doi: doc.doi ?? previous?.doi ?? null,
    sha256: previous?.sha256 ?? null,
    text_sha256: previous?.text_sha256 ?? null,
    bytes: previous?.bytes ?? null,
    content_type: previous?.content_type ?? null,
    fetched_at: previous?.fetched_at ?? null,
    etag: previous?.etag ?? null,
    last_modified: previous?.last_modified ?? null,
    raw: previous?.raw ?? null,
    extractor: previous?.extractor ?? null,
    failures: 0,
    last_error: null,
    has_page: previous?.has_page ?? false,
    origins: [...doc.origins].sort(),
    claims: [],
  };
  entry.title ??= fileNameTitle(doc.url);
  if (result.fresh) {
    const { html_title, ...stored } = result.fresh;
    Object.assign(entry, stored, { fetched_at: isoSeconds(now) });
  }
  if (result.state !== 'failed') entry.extractor = EXTRACTOR;
  if (result.state === 'failed') {
    entry.failures = (previous?.failures ?? 0) + 1;
    entry.last_error = result.error;
  }
  return entry;
}

/** Quote status of every claim against the text the page holds: the fresh text, or the last good text when the fetch failed. */
const claimStatuses = (doc, text) => (text === null ? doc.claims.map((claim) => ({ id: claim.id, found: null, match: null })) : checkQuotes(text, doc.claims));

/** One readable line for a ConfigError, a file system error (permissions, full disk) or anything unexpected. */
function describeError(error) {
  if (error instanceof ConfigError) return error.message;
  if (typeof error.code === 'string' && error.syscall) return `file system error ${error.code} (${error.syscall} ${error.path ?? ''}). Check the permissions and free space of the base directory.`.replace(' )', ')');
  return `unexpected error: ${error.stack}`;
}

export async function main(argv, env = process.env, out = (line) => console.log(line), err = (line) => console.error(line)) {
  let release = () => {};
  const onSignal = () => { release(); process.exit(2); };
  try {
    const cfg = parseConfig(argv, env);
    const inputs = collectDocuments(cfg);
    if (inputs.size === 0) {
      throw new ConfigError(`no document found in the inputs: ${cfg.evidenceFile}, ${cfg.siteRoot}/research/evidence/*.verified.json and ${cfg.siteRoot}/research/sources-inbox.txt. Check SITE_ROOT (now ${cfg.siteRoot}) and that this user may read these files.`);
    }
    const classes = cfg.only ? [cfg.only] : CLASSES;
    const documents = [...inputs.values()].filter((doc) => classes.includes(doc.class));
    const count = (documentClass) => documents.filter((doc) => doc.class === documentClass).length;
    out(`collected ${documents.length} documents (nasa ${count('nasa')}, other ${count('other')}) for ${cfg.base}`);

    if (cfg.dryRun) {
      out('dry run: nothing fetched, written or committed');
      if (cfg.sync) await syncGbrain({ base: cfg.base, classes, env, dryRun: true, log: out });
      return 0;
    }

    await ensureBase(cfg.base);
    release = acquireLock(`${cfg.base}/.evidence-base.lock`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, onSignal);

    const manifest = loadManifest(cfg.base);
    const now = new Date();
    const results = new Map();
    await perHost(documents, cfg.hostPauseMs, async (doc) => {
      results.set(doc.url, await refreshDocument({ doc, previous: manifest.documents[doc.url], base: cfg.base, retryMs: cfg.retryMs }));
    });

    const settings = { pageType: cfg.pageType, otherText: cfg.otherText };
    const changedFiles = [];
    const outcome = { checked: documents.length, fresh: [], changed: [], failed: [] };
    for (const doc of documents) {
      const previous = manifest.documents[doc.url];
      const result = results.get(doc.url);
      const entry = buildEntry({ doc, previous, result, now });
      // Stored text counts only when the manifest knows where and when it was fetched; without that the page could not say.
      const text = result.text ?? (previous?.fetched_at ? storedText(cfg.base, doc) : null);
      entry.claims = claimStatuses(doc, text);
      if (text !== null) {
        entry.has_page = true;
        const page = renderPage({ entry, doc, rawText: text, settings });
        if (writeIfChanged(`${cfg.base}/${doc.class}/documents/${entry.slug}.md`, page)) changedFiles.push(`${doc.class}/documents/${entry.slug}.md`);
      }
      manifest.documents[doc.url] = entry;
      const info = { title: entry.title, url: doc.url };
      if (result.state === 'new') outcome.fresh.push(info);
      if (result.state === 'changed') outcome.changed.push(info);
      if (result.state === 'failed') outcome.failed.push({ ...info, error: result.error, failures: entry.failures, hasPage: entry.has_page });
    }
    for (const documentClass of classes) {
      if (writeIfChanged(`${cfg.base}/${documentClass}/index.md`, renderIndex(documentClass, Object.values(manifest.documents)))) changedFiles.push(`${documentClass}/index.md`);
    }
    if (writeIfChanged(`${cfg.base}/manifest.json`, manifestText(manifest))) changedFiles.push('manifest.json');

    const claimsById = new Map(documents.flatMap((doc) => doc.claims.map((claim) => [claim.id, claim])));
    const standing = { missingQuotes: [], stuck: [] };
    for (const doc of documents) {
      const entry = manifest.documents[doc.url];
      for (const status of entry.claims) {
        if (status.found === false) standing.missingQuotes.push({ id: status.id, url: doc.url, locator: claimsById.get(status.id).locator, quote: claimsById.get(status.id).quote });
      }
      if (entry.failures >= STUCK_RUNS && doc.claims.length > 0) standing.stuck.push({ url: doc.url, failures: entry.failures, error: entry.last_error });
    }

    const committed = await commitAll(cfg.base, {
      name: cfg.gitName,
      email: cfg.gitEmail,
      message: `Evidence base: ${outcome.fresh.length} new, ${outcome.changed.length} changed, ${outcome.failed.length} unreachable (${isoSeconds(now)})`,
    });
    // A failing gbrain must not lose the report: the base is already committed and the report says what happened.
    let synced = [];
    let setupProblem = null;
    if (cfg.sync) {
      try {
        synced = (await syncGbrain({ base: cfg.base, classes, env, dryRun: false, requireGbrain: cfg.requireGbrain, log: out })).lines;
        if (cfg.leads) await writeLeads({ base: cfg.base, siteRoot: cfg.siteRoot, env, log: out });
      } catch (error) {
        if (!(error instanceof ConfigError)) throw error;
        setupProblem = error;
        synced = error.lines ?? [];
      }
    } else if (cfg.leads) {
      await writeLeads({ base: cfg.base, siteRoot: cfg.siteRoot, env, log: out });
    }

    const worthReporting = changedFiles.length > 0 || standing.missingQuotes.length > 0 || standing.stuck.length > 0 || setupProblem !== null;
    if (worthReporting) {
      const reportFile = `${cfg.base}/reports/${now.toISOString().slice(0, 10)}.md`;
      mkdirSync(`${cfg.base}/reports`, { recursive: true });
      const section = renderReport({ time: isoSeconds(now), outcome, standing, synced, committed, syncProblem: setupProblem?.message ?? null });
      if (existsSync(reportFile)) appendFileSync(reportFile, `\n${section}`);
      else writeIfChanged(reportFile, `# Evidence base report ${now.toISOString().slice(0, 10)}\n\n${section}`);
    }

    out(`new ${outcome.fresh.length}, changed ${outcome.changed.length}, unreachable ${outcome.failed.length}, files changed ${changedFiles.length}, commit ${committed ? 'made' : 'none'}`);
    for (const item of outcome.failed) out(`unreachable: ${item.url}: ${item.error} (${item.failures} in a row)`);
    for (const item of standing.missingQuotes) out(`QUOTE NOT FOUND: ${item.id} in ${item.url}`);
    for (const item of standing.stuck) out(`FAILED ${item.failures} RUNS IN A ROW: ${item.url}: ${item.error}`);
    if (setupProblem) {
      err(`evidence-base: ${setupProblem.message}`);
      return 2;
    }
    return standing.missingQuotes.length > 0 || standing.stuck.length > 0 ? 1 : 0;
  } catch (error) {
    err(`evidence-base: ${describeError(error)}`);
    return 2;
  } finally {
    for (const signal of ['SIGINT', 'SIGTERM']) process.off(signal, onSignal);
    release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
