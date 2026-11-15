import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { PLACEHOLDER, jsStrings, lineAt, lineStarts } from './js-strings.mjs';

const UNITS = ['%', 'percent', '°C', '°F', 'K', 'kPa', 'MPa', 'Pa', 'psi', 'atm', 'bar', 'mm', 'cm', 'µm', 'μm', 'nm', 'km', 'm', 'kg', 'mg', 'g',
  'ms', 's', 'min', 'minutes', 'minute', 'h', 'hours', 'hour', 'days', 'day', 'seconds', 'second', 'kW', 'W', 'kJ', 'MJ', 'J', 'Hz', 'V', 'mL', 'L',
  'ppm', 'm/s', 'cm/s', 'mm/s', 'g/cm³'];
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const NUMBER_WITH_UNIT = new RegExp(
  `(?<![\\p{L}\\p{N}_.])\\d+(?:[.,]\\d+)?(?:/\\d+)?\\s?(?:%|(?:${[...UNITS].filter((u) => u !== '%').sort((a, b) => b.length - a.length).map(escapeRe).join('|')})(?![\\p{L}\\p{N}_]))`,
  'gu');
const CLAIM_WORDS = /\b(?:tested|NASA found|found that|shows|showed|limits?|thresholds?|measured|demonstrated)\b/i;
const MARKERS = ['data-evidence', 'data-computed', 'data-illustrative', 'data-concept'];
const BARE_MARKERS = new Set(['data-illustrative', 'data-concept']);
const MARKER_NEAR = /data-(?:evidence|computed|illustrative|concept)|dataset\.(?:evidence|computed|illustrative|concept)/;
const CITATION_MARKS = new Set(['sup']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const HIDDEN = new Set(['head', 'script', 'style', 'noscript']);

function parseAttributes(source) {
  const attrs = {};
  for (const m of source.matchAll(/([^\s=\/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function parseHtml(html, lineBase = 1) {
  const starts = lineStarts(html);
  const line = (offset) => lineAt(starts, offset) + lineBase - 1;
  const tokens = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  const nodes = [];
  const elements = [];
  const scripts = [];
  const stack = [];
  let last = 0;
  const text = (end) => {
    const raw = html.slice(last, end);
    if (raw.trim() && !stack.some((e) => HIDDEN.has(e.tag))) nodes.push({ text: raw.trim(), line: line(last + raw.search(/\S/)), chain: [...stack] });
  };
  let match;
  while ((match = tokens.exec(html))) {
    text(match.index);
    last = match.index + match[0].length;
    if (match[1]) {
      const at = stack.map((e) => e.tag).lastIndexOf(match[1].toLowerCase());
      if (at >= 0) stack.length = at;
    } else if (match[2]) {
      const tag = match[2].toLowerCase();
      const selfClosed = match[3].trimEnd().endsWith('/');
      const element = { tag, attrs: parseAttributes(match[3]), line: line(match.index), chain: [...stack] };
      elements.push(element);
      if (tag === 'script' || tag === 'style') {
        const close = html.toLowerCase().indexOf(`</${tag}`, last);
        const end = close < 0 ? html.length : close;
        if (tag === 'script') scripts.push({ attrs: element.attrs, text: html.slice(last, end), line: line(last) });
        tokens.lastIndex = last = end;
      } else if (!VOID.has(tag) && !selfClosed) {
        stack.push(element);
      }
    }
  }
  text(html.length);
  return { nodes, elements, scripts };
}

function isMarked(chain) {
  return chain.some(({ attrs }) => MARKERS.some((name) => attrs[name] !== undefined && (BARE_MARKERS.has(name) || attrs[name].trim() !== '')));
}

function findings(source) {
  const text = source.replaceAll(PLACEHOLDER, '0');
  const out = [];
  for (const match of text.matchAll(NUMBER_WITH_UNIT)) out.push({ kind: 'number-with-unit', text: match[0], offset: match.index });
  for (const match of text.matchAll(/\S[\s\S]*?(?:[.!?](?=\s|$)|$)/g)) {
    if (CLAIM_WORDS.test(match[0]) && match[0].split(/\s+/).length >= 3) out.push({ kind: 'claim-sentence', text: match[0], offset: match.index });
  }
  return out;
}

const newlinesBefore = (text, offset) => text.slice(0, offset).split('\n').length - 1;

const forDisplay = (text) => text.replaceAll(PLACEHOLDER, '0').replace(/\s+/g, ' ');
const shorten = (text) => (text.length > 140 ? `${text.slice(0, 137)}...` : text);
const offender = (file, line, kind, text) => ({ file, line, kind, text: shorten(forDisplay(text)) });

export function scanHtml(html, file, lineBase = 1) {
  const { nodes, elements, scripts } = parseHtml(html, lineBase);
  const offenders = [];
  for (const node of nodes) {
    if (node.chain.some(({ attrs }) => attrs['data-concept'] !== undefined) && !node.chain.some(({ tag }) => CITATION_MARKS.has(tag))) {
      const digits = node.text.replaceAll(PLACEHOLDER, '').match(/\d+/);
      if (digits) offenders.push(offender(file, node.line, 'concept-digit', node.text));
    }
    if (isMarked(node.chain)) continue;
    for (const found of findings(node.text)) offenders.push(offender(file, node.line + newlinesBefore(node.text, found.offset), found.kind, found.text));
  }
  const refs = [];
  const problems = [];
  for (const element of elements) {
    if (element.attrs['data-slot'] !== undefined) problems.push(offender(file, element.line, 'data-slot', `<${element.tag} data-slot="${element.attrs['data-slot']}"> is unfinished copy`));
    if (element.attrs['data-evidence'] !== undefined) {
      const ids = element.attrs['data-evidence'].split(/\s+/).filter(Boolean);
      if (!ids.length) problems.push(offender(file, element.line, 'empty-marker', `<${element.tag} data-evidence> lists no id`));
      for (const id of ids) if (!id.includes(PLACEHOLDER)) refs.push({ id, file, line: element.line });
    }
    if (element.attrs['data-computed'] !== undefined && !element.attrs['data-computed'].trim()) {
      problems.push(offender(file, element.line, 'empty-marker', `<${element.tag} data-computed> does not say how the value is computed`));
    }
  }
  return { offenders, refs, problems, scripts };
}

const isProse = (text) => {
  if (/[;{}<>=]/.test(text)) return false;
  const words = text.match(/[A-Za-z]{2,}/g)?.length ?? 0;
  return (/^\s*[A-Z]/.test(text) && words >= 3) || words >= 6;
};

export function scanJs(source, file, lineBase = 1) {
  const sourceLines = source.split('\n');
  const offenders = [];
  const refs = [];
  const problems = [];
  for (const literal of jsStrings(source)) {
    const line = literal.line + lineBase - 1;
    if (/data-slot/.test(literal.text)) problems.push(offender(file, line, 'data-slot', 'string contains data-slot: unfinished copy'));
    if (/<[a-zA-Z][^>]*>/.test(literal.text)) {
      const html = scanHtml(literal.text, file, line);
      offenders.push(...html.offenders);
      refs.push(...html.refs);
      problems.push(...html.problems);
    } else if (isProse(literal.text)) {
      const near = sourceLines.slice(Math.max(0, literal.line - 7), literal.line + 6).join('\n');
      if (MARKER_NEAR.test(near)) continue;
      for (const found of findings(literal.text)) offenders.push(offender(file, line + newlinesBefore(literal.text, found.offset), found.kind, found.text));
    }
  }
  return { offenders, refs, problems };
}

function walkJson(value, trail, illustrative, visit) {
  if (typeof value === 'string') visit(value, trail, illustrative);
  else if (Array.isArray(value)) value.forEach((item, i) => walkJson(item, `${trail}[${i}]`, illustrative, visit));
  else if (value && typeof value === 'object') {
    const flag = illustrative || value.provenance === 'illustrative';
    for (const [key, child] of Object.entries(value)) walkJson(child, `${trail}.${key}`, flag, visit);
  }
}

export function scanJson(raw, file) {
  const offenders = [];
  walkJson(JSON.parse(raw), '', false, (text, trail, illustrative) => {
    if (illustrative) return;
    const at = raw.indexOf(JSON.stringify(text));
    for (const found of findings(text)) offenders.push(offender(file, lineAt(lineStarts(raw), Math.max(at, 0)), found.kind, `${trail}: ${found.text}`));
  });
  return { offenders, refs: [], problems: [] };
}

export function evidenceIdsInJson(value) {
  const ids = [];
  const visit = (node) => {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        if (/^evidence(?:_ids?)?$/.test(key)) ids.push(...[child].flat().filter((id) => typeof id === 'string'));
        else visit(child);
      }
    }
  };
  visit(value);
  return ids;
}

function resolveLocal(root, specifier, ...bases) {
  const clean = specifier.split(/[?#]/)[0];
  for (const base of bases) {
    const candidate = clean.startsWith('/') ? join(root, clean) : resolve(base, clean);
    if (existsSync(candidate) && candidate.startsWith(root) && !relative(root, candidate).startsWith('vendor')) return candidate;
  }
  return null;
}

export function collectSources(root, pageRel) {
  const pagePath = join(root, pageRel);
  const html = readFileSync(pagePath, 'utf8');
  const pageDir = dirname(pagePath);
  const parsed = parseHtml(html);
  const files = new Map();
  const jsonFiles = new Set();
  const inline = [];
  const queue = [];
  const visit = (file) => {
    if (!file || files.has(file)) return;
    const text = readFileSync(file, 'utf8');
    files.set(file, text);
    queue.push(file);
  };
  const follow = (text, baseDir) => {
    for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|new URL\(\s*)['"]([^'"]+)['"]|['"]([^'"\s]+\.json)['"]/g)) {
      const specifier = m[1] ?? m[2];
      if (!/^(?:\.|\/)/.test(specifier) && !specifier.endsWith('.json')) continue;
      const found = resolveLocal(root, specifier, baseDir, pageDir, root);
      if (!found) continue;
      if (found.endsWith('.json')) jsonFiles.add(found);
      else if (/\.m?js$/.test(found)) visit(found);
    }
  };
  for (const script of parsed.scripts) {
    if (script.attrs.src) visit(resolveLocal(root, script.attrs.src, pageDir));
    else {
      inline.push({ file: `${pageRel}#inline-script`, text: script.text, lineBase: script.line });
      follow(script.text, pageDir);
    }
  }
  while (queue.length) {
    const file = queue.shift();
    follow(files.get(file), dirname(file));
  }
  follow(html, pageDir);
  const passport = join(root, 'data/passport.json');
  if (existsSync(passport)) jsonFiles.add(passport);
  return {
    html,
    scripts: [...[...files].map(([file, text]) => ({ file: relative(root, file), text, lineBase: 1 })), ...inline],
    json: [...jsonFiles].filter((file) => !file.endsWith('evidence.json')).map((file) => ({ file: relative(root, file), text: readFileSync(file, 'utf8') })),
  };
}

export function scanPage(root, pageRel) {
  const sources = collectSources(root, pageRel);
  const html = scanHtml(sources.html, pageRel);
  const results = [html];
  for (const script of sources.scripts) results.push(scanJs(script.text, script.file, script.lineBase));
  for (const json of sources.json) results.push(scanJson(json.text, json.file));
  const refs = results.flatMap((r) => r.refs);
  for (const file of sources.json) {
    for (const id of evidenceIdsInJson(JSON.parse(file.text))) refs.push({ id, file: file.file, line: 1 });
  }
  return {
    offenders: results.flatMap((r) => r.offenders),
    problems: results.flatMap((r) => r.problems),
    refs,
    sources,
  };
}

export function renderedStrings(source) {
  return jsStrings(source).flatMap(({ line, text }) => {
    if (/<[a-zA-Z][^>]*>/.test(text)) return [{ line, text: parseHtml(text).nodes.map((node) => node.text.replace(/\s+/g, ' ')).join(' ').replaceAll(PLACEHOLDER, '{value}') }];
    return isProse(text) ? [{ line, text }] : [];
  }).filter((entry) => entry.text.trim());
}

export function visibleText(html) {
  return parseHtml(html).nodes.map((node) => `L${node.line}: ${node.text.replace(/\s+/g, ' ')}`).join('\n');
}

export const formatFinding = ({ file, line, kind, text }) => `${file}:${line}  [${kind}]  ${text}`;
