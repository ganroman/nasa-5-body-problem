export const PLACEHOLDER = '\uE000';

export const lineStarts = (text) => [0, ...[...text.matchAll(/\n/g)].map((m) => m.index + 1)];
export function lineAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (starts[mid] <= offset) low = mid; else high = mid - 1;
  }
  return low + 1;
}

function unescapeJs(raw) {
  const simple = { n: '\n', t: '\t', r: '\r' };
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, code) => {
    if (code[0] === 'u' && code.length > 1) return String.fromCodePoint(parseInt(code.replace(/[u{}]/g, ''), 16));
    if (code[0] === 'x' && code.length > 1) return String.fromCharCode(parseInt(code.slice(1), 16));
    return simple[code] ?? code;
  });
}

export function jsStrings(source) {
  const starts = lineStarts(source);
  const out = [];
  let i = 0;
  const skipQuoted = (quote) => {
    const begin = i++;
    while (i < source.length && source[i] !== quote && source[i] !== '\n') i += source[i] === '\\' ? 2 : 1;
    out.push({ text: unescapeJs(source.slice(begin + 1, i)), line: lineAt(starts, begin), template: false });
    i++;
  };
  const skipTemplate = () => {
    const begin = i++;
    let text = '';
    while (i < source.length && source[i] !== '`') {
      if (source[i] === '\\') { text += unescapeJs(source.slice(i, i + 2)); i += 2; }
      else if (source[i] === '$' && source[i + 1] === '{') { text += PLACEHOLDER; i += 2; code(true); }
      else text += source[i++];
    }
    out.push({ text, line: lineAt(starts, begin), template: true });
    i++;
  };
  function code(stopOnBrace) {
    let depth = 0;
    let previous = '';
    while (i < source.length) {
      const c = source[i];
      if (c === '/' && source[i + 1] === '/') { while (i < source.length && source[i] !== '\n') i++; continue; }
      if (c === '/' && source[i + 1] === '*') { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
      if (c === '"' || c === "'") { skipQuoted(c); previous = c; continue; }
      if (c === '`') { skipTemplate(); previous = c; continue; }
      if (c === '/' && (previous === '' || '(,=:[!&|?{};+-*%<>~^'.includes(previous))) {
        i++;
        for (let inClass = false; i < source.length && (inClass || source[i] !== '/') && source[i] !== '\n'; i++) {
          if (source[i] === '\\') i++;
          else if (source[i] === '[') inClass = true;
          else if (source[i] === ']') inClass = false;
        }
        i++;
        previous = ')';
        continue;
      }
      if (c === '{') depth++;
      if (c === '}') { if (stopOnBrace && depth === 0) { i++; return; } depth--; }
      if (!/\s/.test(c)) previous = c;
      i++;
    }
  }
  code(false);
  return out;
}

