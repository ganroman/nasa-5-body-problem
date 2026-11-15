const FIELDS = ['id', 'topic', 'claim', 'quote', 'source_title', 'source_authors', 'source_year', 'source_org', 'source_kind',
  'landing_url', 'doc_url', 'doi', 'locator', 'material', 'conditions', 'limits'];
const CONDITION_KEYS = ['o2_percent', 'pressure_text', 'pressure_kpa', 'gravity', 'flow_text'];

const text = (value) => typeof value === 'string' && value.trim() !== '';
const numberOrNull = (value) => value === null || (typeof value === 'number' && Number.isFinite(value));
const textOrNull = (value) => value === null || text(value);
const isHttps = (value) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const wordCount = (value) => value.trim().split(/\s+/).length;

function sentenceCount(claim) {
  const flat = claim
    .replace(/\b(?:e\.g|i\.e|vs|approx|etc|al|Fig|No)\./g, (m) => m.replace('.', ''))
    .replace(/\b(?:[A-Za-z]\.){2,}/g, (m) => m.replaceAll('.', ''));
  return flat.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).filter(Boolean).length;
}

export function validateItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return ['is not an object'];
  const problems = [];
  const need = (ok, message) => { if (!ok) problems.push(message); };
  for (const field of FIELDS) need(field in item, `missing field "${field}"`);
  need(/^[a-z0-9][a-z0-9_-]*$/.test(item.id ?? ''), 'id must be lower-case letters, digits, "-" or "_"');
  need(text(item.topic), 'topic must be a non-empty string');
  need(text(item.claim), 'claim must be a non-empty string');
  if (text(item.claim)) need(sentenceCount(item.claim) === 1, `claim must be exactly one sentence (found ${sentenceCount(item.claim)})`);
  need(text(item.quote), 'quote must be a non-empty string');
  if (text(item.quote)) need(wordCount(item.quote) >= 8 && wordCount(item.quote) <= 60, `quote must be 8 to 60 words (found ${wordCount(item.quote)})`);
  need(text(item.source_title), 'source_title must be a non-empty string');
  need(text(item.source_authors) || (Array.isArray(item.source_authors) && item.source_authors.length > 0 && item.source_authors.every(text)),
    'source_authors must be a non-empty string or a list of non-empty strings');
  need(Number.isInteger(item.source_year) && item.source_year >= 1900 && item.source_year <= new Date().getFullYear() + 1, 'source_year must be a four-digit year');
  need(text(item.source_org), 'source_org must be a non-empty string');
  need(text(item.source_kind), 'source_kind must be a non-empty string');
  need(isHttps(item.landing_url), 'landing_url must be an https URL');
  need(isHttps(item.doc_url), 'doc_url must be an https URL');
  need(item.doi === null || (typeof item.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(item.doi)), 'doi must be null or a DOI such as 10.1234/abc');
  need(text(item.locator), 'locator must be a non-empty string');
  need(text(item.material), 'material must be a non-empty string');
  need(text(item.limits), 'limits must be a non-empty string');
  const c = item.conditions;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    problems.push('conditions must be an object');
  } else {
    for (const key of CONDITION_KEYS) need(key in c, `conditions is missing "${key}" (use null when the source does not state it)`);
    need(numberOrNull(c.o2_percent), 'conditions.o2_percent must be a number or null');
    need(numberOrNull(c.pressure_kpa), 'conditions.pressure_kpa must be a number or null');
    need(textOrNull(c.pressure_text), 'conditions.pressure_text must be a string or null');
    need(textOrNull(c.flow_text), 'conditions.flow_text must be a string or null');
    need(textOrNull(c.gravity) || (typeof c.gravity === 'number' && Number.isFinite(c.gravity)), 'conditions.gravity must be a string, a number or null');
  }
  return problems;
}

export function validateEvidence(items) {
  const seen = new Set();
  return items.map((item, index) => {
    const problems = validateItem(item);
    if (item?.id !== undefined) {
      if (seen.has(item.id)) problems.push(`duplicate id "${item.id}"`);
      seen.add(item.id);
    }
    return { index, id: item?.id ?? `#${index}`, problems };
  });
}
