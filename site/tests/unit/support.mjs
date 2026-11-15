import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FIXTURES = join(REPO, 'tests', 'fixtures');
export const fixture = (name) => readFileSync(join(FIXTURES, name));

export const tempDir = () => mkdtempSync(join(tmpdir(), 'cargo-passport-'));
export const removeDir = (dir) => rmSync(dir, { recursive: true, force: true });

export function listen(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise((done) => { server.closeAllConnections(); server.close(done); }),
    }));
  });
}

export function sourceServer() {
  return listen((request, response) => {
    const files = { '/tea.html': ['text/html', 'tea.html'], '/tea.pdf': ['application/pdf', 'tea.pdf'] };
    const hit = files[request.url];
    if (!hit) return response.writeHead(404).end('missing');
    return response.writeHead(200, { 'content-type': hit[0] }).end(fixture(hit[1]));
  });
}

export function run(script, args, env = {}) {
  const { NODE_TEST_CONTEXT, ...inherited } = process.env;
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: REPO, env: { ...inherited, ...env } });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (status) => resolve({ status, output }));
  });
}

export function localEvidenceFile(dir, baseUrl) {
  const text = readFileSync(join(FIXTURES, 'site-clean/data/evidence.json'), 'utf8').replaceAll('https://example.invalid/tea', `${baseUrl}/tea`);
  const file = join(dir, 'evidence.json');
  writeFileSync(file, text);
  return file;
}

/**
 * The words of a test descriptor ("gravity", "form") that the cited record does not state. A descriptor is allowed
 * only when every word of it is in the record's claim or quote; a number must match as a whole number.
 * Returns [] for a null descriptor.
 */
export function unstatedWords(value, record) {
  if (value === null || value === undefined) return [];
  const text = `${record.claim} ${record.quote}`.toLowerCase();
  const words = String(value).toLowerCase().split(/[^a-z0-9.\-%]+/).filter(Boolean);
  return words.filter((word) => {
    const escaped = word.replace(/[.\-%]/g, (ch) => `\\${ch}`);
    const pattern = /^[\d.]+$/.test(word) ? `(?<![\\d.])${escaped}(?![\\d]|\\.\\d)` : `(?<![a-z0-9])${escaped}`;
    return !new RegExp(pattern).test(text);
  });
}
