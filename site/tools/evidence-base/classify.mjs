import { createHash } from 'node:crypto';

/** Hosts that count as NASA. A host matches when it equals an entry or is a subdomain of it. To add one, add it here. */
export const NASA_DOMAINS = ['nasa.gov'];

/** "nasa" for NASA documents, "other" for everything else. The one place where this is decided. */
export function classOf(url) {
  const host = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  return NASA_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`)) ? 'nasa' : 'other';
}

const hash = (text, length) => createHash('sha256').update(text).digest('hex').slice(0, length);

/** Name of the raw file of a document: a hash of its URL, so it never depends on the title. */
export const rawKey = (url) => hash(url, 16);

function words(text, max) {
  const flat = text
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const at = cut.lastIndexOf('-');
  return (at > max / 2 ? cut.slice(0, at) : cut).replace(/-+$/g, '');
}

/**
 * The slug of a document page: organisation, year, title and a short hash of the URL, lower case, hyphens.
 * The same inputs always give the same slug. The run keeps the first slug of a document in the manifest,
 * so a later change of the title does not move the page.
 */
export function slugFor({ url, org, year, title }) {
  const orgPart = words(String(org ?? '').split(/[\/;,]/)[0], 24);
  const titlePart = words(String(title ?? ''), 48) || words(new URL(url).pathname.split('/').filter(Boolean).pop() ?? '', 48);
  return [orgPart, Number.isInteger(year) ? String(year) : 'nd', titlePart, hash(url, 8)].filter(Boolean).join('-');
}
