import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { REPO } from './site.mjs';

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const TIMEOUT_MS = 90_000;
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '­', ndash: '–', mdash: '—',
  minus: '−', hyphen: '‐', lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“',
  rdquo: '”', bdquo: '„', hellip: '…', deg: '°', plusmn: '±', times: '×',
  divide: '÷', micro: 'µ', middot: '·', bull: '•', copy: '©', reg: '®',
  trade: '™', larr: '←', rarr: '→', uarr: '↑', darr: '↓', le: '≤', ge: '≥',
  ne: '≠', asymp: '≈', infin: '∞', sup2: '²', sup3: '³', frac12: '½',
  frac14: '¼', frac34: '¾', prime: '′', Prime: '″', sect: '§', para: '¶',
  laquo: '«', raquo: '»', euro: '€', pound: '£', cent: '¢', alpha: 'α',
  beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', mu: 'μ', pi: 'π',
  sigma: 'σ', omega: 'ω', Omega: 'Ω', theta: 'θ', lambda: 'λ', eacute: 'é',
  egrave: 'è', uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß',
};
const WORD = '[\\p{L}\\p{N}_]';

function decodeEntities(text) {
  return text.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));/g, (whole, dec, hex, name) => {
    if (name) return NAMED_ENTITIES[name] ?? whole;
    const code = dec ? Number(dec) : parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

export function normalise(text) {
  return decodeEntities(text)
    .normalize('NFKC')
    .replace(/­/g, '')
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(new RegExp(`(${WORD})-\\s*\\n\\s*(${WORD})`, 'gu'), '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlToText(html) {
  const markup = /<!--[\s\S]*?-->|<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>|<(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  const nodes = [];
  let last = 0;
  const push = (chunk) => chunk && nodes.push(decodeEntities(chunk));
  for (const match of html.matchAll(markup)) {
    push(html.slice(last, match.index));
    last = match.index + match[0].length;
  }
  push(html.slice(last));
  return nodes.join('\n');
}

function pdfToText(file) {
  const run = (...args) => {
    try {
      return execFileSync('pdftotext', [...args, file, '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    } catch (error) {
      throw new Error(`pdftotext failed (is poppler-utils installed?): ${error.message.split('\n')[0]}`);
    }
  };
  return `${run()}\n\n=====LAYOUT=====\n\n${run('-layout')}`;
}

export function extractText(bytes, rawFile) {
  if (Buffer.from(bytes.subarray(0, 4)).toString('latin1') === '%PDF') return pdfToText(rawFile);
  return htmlToText(Buffer.from(bytes).toString('utf8'));
}

async function request(url, init) {
  let failure;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'user-agent': USER_AGENT, accept: '*/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status < 500) return response;
      failure = new Error(`http ${response.status}`);
    } catch (error) {
      failure = error;
    }
  }
  throw new Error(`download failed for ${url}: ${failure.cause?.message ?? failure.message}`);
}

export async function landingStatus(url) {
  const response = await request(url, { method: 'GET' });
  await response.body?.cancel();
  return response.status;
}

const memory = new Map();

export function getSourceText(url, cacheDir = process.env.CACHE_DIR ?? `${REPO}/.cache`) {
  if (!memory.has(url)) memory.set(url, loadSourceText(url, cacheDir));
  return memory.get(url);
}

async function loadSourceText(url, cacheDir) {
  const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const rawFile = `${cacheDir}/${key}.bin`;
  const textFile = `${cacheDir}/${key}.txt`;
  if (!existsSync(textFile) || readFileSync(textFile).length === 0) {
    mkdirSync(cacheDir, { recursive: true });
    const response = await request(url, { method: 'GET' });
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!response.ok || bytes.length === 0) throw new Error(`download failed for ${url}: http ${response.status}, ${bytes.length} bytes`);
    writeFileSync(rawFile, bytes);
    writeFileSync(textFile, extractText(bytes, rawFile));
  }
  return normalise(readFileSync(textFile, 'utf8'));
}

export function locateQuote(normalisedText, quote) {
  const wanted = normalise(quote);
  if (wanted && normalisedText.includes(wanted)) return { found: true, match: 'exact' };
  if (wanted && normalisedText.toLowerCase().includes(wanted.toLowerCase())) return { found: true, match: 'case-insensitive' };
  const words = wanted.split(' ');
  for (let size = Math.min(words.length, 12); size > 3; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      const fragment = words.slice(start, start + size).join(' ');
      const at = normalisedText.indexOf(fragment);
      if (at >= 0) {
        return { found: false, fragment, hint: normalisedText.slice(Math.max(0, at - 200), at + 400) };
      }
    }
  }
  return { found: false, fragment: '', hint: '' };
}

export function excerptAround(normalisedText, quote, radius = 1500) {
  const wanted = normalise(quote);
  let at = normalisedText.indexOf(wanted);
  if (at < 0 && normalisedText.toLowerCase().length === normalisedText.length) at = normalisedText.toLowerCase().indexOf(wanted.toLowerCase());
  if (at < 0) return { located: false, text: normalisedText.slice(0, 2 * radius) };
  return { located: true, text: normalisedText.slice(Math.max(0, at - radius), at + wanted.length + radius) };
}
