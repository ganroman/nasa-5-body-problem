import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rawKey } from './classify.mjs';
import { fetchDocument, kindOf, sleep } from './fetch.mjs';
import { extractText, locateQuote, normalise } from '../source-text.mjs';

/** Raise this when the way text is extracted changes: stored text is then fetched again instead of trusted after a 304. */
export const EXTRACTOR = 2;

const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const LAYOUT_MARK = '=====LAYOUT=====';

const htmlTitle = (bytes) => {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(Buffer.from(bytes).toString('utf8'));
  return match ? normalise(match[1]) || null : null;
};

/**
 * Fetches one document and extracts its text. The raw file and the extracted text are kept in raw/<class>/ (never committed).
 * Results: { state: "new" | "changed" | "unchanged", text, fresh } or { state: "failed", error }.
 * "unchanged" covers an answer 304 and an answer 200 whose text equals the stored one.
 */
export async function refreshDocument({ doc, previous, base, retryMs }) {
  const key = rawKey(doc.url);
  const directory = `${base}/raw/${doc.class}`;
  const textFile = `${directory}/${key}.txt`;
  const haveText = previous?.text_sha256 && previous.extractor === EXTRACTOR && existsSync(textFile);
  let answer;
  try {
    answer = await fetchDocument(doc.url, haveText ? { etag: previous.etag, lastModified: previous.last_modified, retryMs } : { retryMs });
    if (answer.notModified) return { state: 'unchanged', text: readFileSync(textFile, 'utf8') };
    const kind = kindOf(answer.bytes, answer.contentType);
    mkdirSync(directory, { recursive: true });
    const rawFile = `${directory}/${key}.${kind}`;
    writeFileSync(rawFile, answer.bytes);
    // The site's extractText strips anything between "<" and ">" from every non-PDF body, which cuts rows out of a CSV or JSON file.
    // Those formats are read as plain text here.
    const text = kind === 'pdf' || kind === 'html' ? extractText(answer.bytes, rawFile) : Buffer.from(answer.bytes).toString('utf8');
    if (normalise(text.replace(LAYOUT_MARK, '')) === '') throw new Error('no text could be extracted (a scanned PDF has no text layer); this pipeline reads text only');
    const textSha = sha256(text);
    writeFileSync(textFile, text);
    if (previous?.text_sha256 === textSha) return { state: 'unchanged', text };
    return {
      state: previous?.text_sha256 ? 'changed' : 'new',
      text,
      fresh: {
        sha256: sha256(answer.bytes),
        text_sha256: textSha,
        bytes: answer.bytes.length,
        content_type: answer.contentType,
        etag: answer.etag,
        last_modified: answer.lastModified,
        raw: `raw/${doc.class}/${key}.${kind}`,
        html_title: kind === 'html' ? htmlTitle(answer.bytes) : null,
      },
    };
  } catch (error) {
    return { state: 'failed', error: error.message };
  }
}

/** Reads the stored text of a document, or null when there is none. */
export function storedText(base, doc) {
  const file = `${base}/raw/${doc.class}/${rawKey(doc.url)}.txt`;
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

/** Runs the tasks of one host one after the other with a pause; different hosts run side by side. */
export async function perHost(documents, pauseMs, task) {
  const groups = new Map();
  for (const doc of documents) {
    const host = new URL(doc.url).host;
    groups.set(host, [...(groups.get(host) ?? []), doc]);
  }
  await Promise.all([...groups.values()].map(async (group) => {
    for (const [index, doc] of group.entries()) {
      if (index > 0) await sleep(pauseMs);
      await task(doc);
    }
  }));
}

/** Checks every claim's quote against the text with the normaliser and matcher the site's live quote check uses. */
export function checkQuotes(rawText, claims) {
  const text = normalise(rawText);
  return claims.map((claim) => {
    const result = locateQuote(text, claim.quote);
    return { id: claim.id, found: result.found, match: result.found ? result.match : null };
  });
}
