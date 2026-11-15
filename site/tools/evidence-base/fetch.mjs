const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const TIMEOUT_MS = 90_000;
const ATTEMPTS = 3;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPdf = (bytes) => Buffer.from(bytes.subarray(0, 4)).toString('latin1') === '%PDF';

const decoder = new TextDecoder('utf-8', { fatal: true });

/** Kind of a downloaded body: "pdf", or "html", "json", "csv" or "txt" for text. Throws for anything that is not text or PDF. */
export function kindOf(bytes, contentType) {
  if (isPdf(bytes)) return 'pdf';
  try {
    decoder.decode(bytes);
  } catch {
    throw new Error(`unsupported content type "${(contentType ?? 'unknown').split(';')[0].trim()}": only text and PDF documents are read`);
  }
  if (bytes.includes(0)) throw new Error(`unsupported content type "${(contentType ?? 'unknown').split(';')[0].trim()}": the body contains binary data`);
  const type = (contentType ?? '').toLowerCase();
  if (type.includes('html') || type.includes('xml') || type === '') return 'html';
  if (type.includes('json')) return 'json';
  if (type.includes('csv') || type.includes('ms-excel')) return 'csv';
  return 'txt';
}

/**
 * Downloads one document. A conditional request is sent when an etag or last-modified is known.
 * Network errors, 429 and 5xx are retried; any other non-2xx answer fails at once.
 * Returns { notModified: true } or { bytes, contentType, etag, lastModified }.
 */
export async function fetchDocument(url, { etag, lastModified, retryMs }) {
  const headers = { 'user-agent': USER_AGENT, accept: '*/*' };
  if (etag) headers['if-none-match'] = etag;
  if (lastModified) headers['if-modified-since'] = lastModified;
  let failure;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(retryMs * (attempt - 1));
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (response.status === 304) return { notModified: true };
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        failure = new Error(`http ${response.status}`);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw Object.assign(new Error(`http ${response.status}`), { final: true });
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length === 0) throw Object.assign(new Error('empty answer (0 bytes)'), { final: true });
      return {
        bytes,
        contentType: response.headers.get('content-type'),
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
      };
    } catch (error) {
      if (error.final) throw error;
      failure = new Error(error.cause?.message ?? error.message);
    }
  }
  throw failure;
}
