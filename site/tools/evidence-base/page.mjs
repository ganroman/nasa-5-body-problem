import { excerptAround, normalise } from '../source-text.mjs';

const LAYOUT_MARK = '\n\n=====LAYOUT=====\n\n';
const EXCERPT_RADIUS = 800;

/** A YAML double-quoted scalar. JSON strings are valid YAML; the two line separators are escaped as well. */
export const yamlText = (value) => JSON.stringify(String(value)).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const yamlList = (values) => `[${values.map(yamlText).join(', ')}]`;

const LICENCE_NOTES = {
  nasa: 'licence not checked by this pipeline; check the publisher\'s terms before republishing',
  otherFull: 'licence not confirmed; kept for private research, do not republish',
  otherExcerpts: 'licence not confirmed; only the quoted passages with some text around them are kept; do not republish',
};

export const licenceNote = (documentClass, otherText) => (documentClass === 'nasa' ? LICENCE_NOTES.nasa : otherText === 'excerpts' ? LICENCE_NOTES.otherExcerpts : LICENCE_NOTES.otherFull);

/** Drops control characters and writes the comment opener as `&lt;!--`, so that no document or claim can forge gbrain's timeline or facts markers. */
const clean = (text) => text.replace(/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/g, '').replaceAll('<!--', '&lt;!--');

function tidy(text) {
  return clean(text).split('\n').map((line) => line.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** The pages of a document: pdftotext separates pages with form feeds. HTML has a single block. */
export function splitPages(rawText) {
  if (!rawText.includes(LAYOUT_MARK)) {
    const lines = clean(rawText).split('\n').map((line) => line.trim()).filter(Boolean);
    return [{ number: null, text: lines.join('\n') }];
  }
  const plain = rawText.slice(0, rawText.indexOf(LAYOUT_MARK));
  const pages = plain.split('\f');
  if (pages.length > 1 && pages.at(-1).trim() === '') pages.pop();
  return pages.map((text, index) => ({ number: index + 1, text: tidy(text) }));
}

function statusLine(status) {
  if (!status || status.found === null) return 'not checked yet';
  if (!status.found) return 'NOT FOUND';
  return status.match === 'exact' ? 'found (exact match)' : `found (${status.match} match)`;
}

const quoteBlock = (quote) => quote.split('\n').map((line) => `> ${line}`).join('\n');
const oneLine = (text) => clean(String(text)).replace(/\s+/g, ' ').trim();

function claimsSection(claims, statuses, fetchedAt) {
  const byId = new Map(statuses.map((status) => [status.id, status]));
  const blocks = claims.map((claim) => [
    `### ${claim.id}`,
    '',
    `Claim: ${oneLine(claim.claim)}`,
    '',
    quoteBlock(claim.quote),
    '',
    `Locator: ${oneLine(claim.locator) || 'not given'}`,
    `Claim id: ${claim.id}`,
    `Quote in the text fetched on ${fetchedAt.slice(0, 10)}: ${statusLine(byId.get(claim.id))}`,
    ...(claim.limits ? [`Limits stated with the claim: ${oneLine(claim.limits)}`] : []),
  ].join('\n'));
  return ['## Claims cited from this document', '', claims.length ? blocks.join('\n\n') : 'No claim cites this document yet. It was added from the reading list.'].join('\n');
}

function fullTextSection(rawText) {
  const pages = splitPages(rawText);
  if (pages.length === 1 && pages[0].number === null) return ['## Full text', '', pages[0].text].join('\n');
  const body = pages.filter((page) => page.text !== '').map((page) => `### Page ${page.number}\n\n${page.text}`);
  return ['## Full text', '', body.join('\n\n')].join('\n');
}

function excerptsSection(rawText, claims) {
  const text = normalise(rawText);
  const blocks = claims.map((claim) => {
    const excerpt = excerptAround(text, claim.quote, EXCERPT_RADIUS);
    return `### Around ${claim.id}\n\n${excerpt.located ? clean(excerpt.text) : 'The quote was not found in the fetched text, so no excerpt is kept.'}`;
  });
  return ['## Excerpts', '', 'Only the quoted passages with some text around them are kept for this document.', '', blocks.join('\n\n')].join('\n');
}

/**
 * The Markdown page of one document, with YAML frontmatter that gbrain reads.
 * `entry` is the manifest entry, `doc` the collected document, `rawText` the extracted text.
 */
export function renderPage({ entry, doc, rawText, settings }) {
  const claimIds = doc.claims.map((claim) => claim.id);
  const tags = [...new Set(['evidence', entry.class, ...doc.kinds, ...doc.topics])];
  const lines = ['---'];
  if (settings.pageType !== 'none') lines.push(`type: ${yamlText(settings.pageType)}`);
  lines.push(`title: ${yamlText(entry.title)}`, `tags: ${yamlList(tags)}`);
  if (entry.year) lines.push(`date: ${yamlText(`${entry.year}-01-01`)}`, 'date_precision: "year"', `source_year: ${entry.year}`);
  lines.push(`source_url: ${yamlText(entry.url)}`);
  if (entry.landing_url) lines.push(`landing_url: ${yamlText(entry.landing_url)}`);
  if (entry.doi) lines.push(`doi: ${yamlText(entry.doi)}`);
  if (entry.publisher) lines.push(`publisher: ${yamlText(entry.publisher)}`);
  if (entry.authors) lines.push(`authors: ${yamlText(entry.authors)}`);
  lines.push(
    `source_class: ${yamlText(entry.class)}`,
    `sha256: ${yamlText(entry.sha256)}`,
    `fetched_at: ${yamlText(entry.fetched_at)}`,
    `claim_ids: ${yamlList(claimIds)}`,
    `licence_note: ${yamlText(licenceNote(entry.class, settings.otherText))}`,
    '---',
    '',
    `# ${oneLine(entry.title)}`,
    '',
  );
  const who = oneLine([entry.publisher, entry.year].filter(Boolean).join(', '));
  lines.push(`Source document${who ? ` from ${who}` : ''}, fetched from ${entry.url} on ${entry.fetched_at}.`, '');
  lines.push(`Licence note: ${licenceNote(entry.class, settings.otherText)}.`, '');
  lines.push(claimsSection(doc.claims, entry.claims, entry.fetched_at), '');
  lines.push(entry.class === 'other' && settings.otherText === 'excerpts' ? excerptsSection(rawText, doc.claims) : fullTextSection(rawText), '');
  return lines.join('\n');
}

const link = (text) => oneLine(text).replace(/[\[\]]/g, (bracket) => (bracket === '[' ? '(' : ')'));

/** index.md of one class: every document with title, year, number of claims and a link. */
export function renderIndex(documentClass, entries) {
  const label = documentClass === 'nasa' ? 'NASA documents' : 'Other documents';
  const rows = entries
    .filter((entry) => entry.class === documentClass && entry.has_page)
    .sort((a, b) => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : a.slug < b.slug ? -1 : 1))
    .map((entry) => `- [${link(entry.title)}](documents/${entry.slug}.md), ${entry.year ?? 'year not given'}, ${entry.claims.length} ${entry.claims.length === 1 ? 'claim' : 'claims'}`);
  return [
    '---',
    `title: ${yamlText(`Evidence base: ${label}`)}`,
    `tags: ${yamlList(['evidence', documentClass, 'index'])}`,
    '---',
    '',
    `# Evidence base: ${label}`,
    '',
    `${rows.length} ${rows.length === 1 ? 'document' : 'documents'}, each with the claims that cite it.`,
    '',
    rows.join('\n'),
    '',
  ].join('\n');
}
