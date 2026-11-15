import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { classOf } from './classify.mjs';
import { ConfigError } from './errors.mjs';

/** One document URL is one key: no fragment, lower-case scheme and host. */
export function documentKey(url) {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.href;
}

function readJsonList(file, label) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new ConfigError(`${label} (${file}) is not readable JSON: ${error.message}. Fix or remove the file.`);
  }
  if (!Array.isArray(data)) throw new ConfigError(`${label} (${file}) must be a JSON list of claims.`);
  return data;
}

function readInbox(file) {
  if (!existsSync(file)) return [];
  const entries = [];
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === '' || line.trim().startsWith('#')) return;
    const [url, ...rest] = line.split('\t');
    try {
      if (!/^https?:$/.test(new URL(url.trim()).protocol)) throw new Error('not http(s)');
    } catch {
      throw new ConfigError(`${file} line ${index + 1}: "${url.trim()}" is not an http(s) URL. Fix the line or start it with #.`);
    }
    entries.push({ url: url.trim(), title: rest.join('\t').trim() || null });
  });
  return entries;
}

function newDocument(url) {
  return { url, class: classOf(url), title: null, authors: null, year: null, publisher: null, landingUrl: null, doi: null, kinds: new Set(), topics: new Set(), origins: new Set(), claims: [] };
}

const authorsText = (value) => (Array.isArray(value) ? value.join('; ') : value ?? null);

/**
 * Collects the documents to build from data/evidence.json, research/evidence/*.verified.json and research/sources-inbox.txt.
 * A claim id counts once; the first input that has it wins, so the published claim beats the research copy.
 * Document metadata comes from the claims that cite it, in that order.
 */
export function collectDocuments({ siteRoot, evidenceFile }) {
  const documents = new Map();
  const seenClaims = new Set();
  const documentOf = (url) => {
    const key = documentKey(url);
    if (!documents.has(key)) documents.set(key, newDocument(key));
    return documents.get(key);
  };

  const addClaims = (claims, origin, published) => {
    for (const claim of claims) {
      for (const field of ['id', 'quote', 'doc_url']) {
        if (typeof claim?.[field] !== 'string' || claim[field] === '') throw new ConfigError(`${origin}: a claim has no "${field}". Fix the file.`);
      }
      if (seenClaims.has(claim.id)) continue;
      seenClaims.add(claim.id);
      let doc;
      try {
        doc = documentOf(claim.doc_url);
      } catch {
        throw new ConfigError(`${origin}: claim ${claim.id} has an invalid doc_url "${claim.doc_url}". Fix the file.`);
      }
      doc.origins.add(origin);
      doc.title ??= claim.source_title ?? null;
      doc.authors ??= authorsText(claim.source_authors);
      doc.year ??= Number.isInteger(claim.source_year) ? claim.source_year : null;
      doc.publisher ??= claim.source_org ?? null;
      doc.landingUrl ??= claim.landing_url ?? null;
      doc.doi ??= claim.doi ?? null;
      if (claim.source_kind) doc.kinds.add(claim.source_kind);
      if (claim.topic) doc.topics.add(claim.topic);
      doc.claims.push({ id: claim.id, claim: claim.claim ?? '', quote: claim.quote, locator: claim.locator ?? '', limits: claim.limits ?? '', published });
    }
  };

  if (existsSync(evidenceFile)) addClaims(readJsonList(evidenceFile, 'the evidence file'), 'data/evidence.json', true);
  const researchDir = `${siteRoot}/research/evidence`;
  if (existsSync(researchDir)) {
    for (const name of readdirSync(researchDir).filter((file) => file.endsWith('.verified.json')).sort()) {
      addClaims(readJsonList(`${researchDir}/${name}`, 'a research claim file'), `research/${name.replace(/\.verified\.json$/, '')}`, false);
    }
  }
  for (const { url, title } of readInbox(`${siteRoot}/research/sources-inbox.txt`)) {
    const doc = documentOf(url);
    doc.origins.add('research/sources-inbox.txt');
    doc.title ??= title;
  }
  return documents;
}
