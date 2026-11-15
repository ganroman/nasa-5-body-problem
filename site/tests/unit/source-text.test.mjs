import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { after, describe, it } from 'node:test';
import { excerptAround, extractText, getSourceText, htmlToText, landingStatus, locateQuote, normalise } from '../../tools/source-text.mjs';
import { fixture, listen, removeDir, sourceServer, tempDir } from './support.mjs';

describe('normalise', () => {
  it('applies NFKC and straightens quotes and dashes', () => {
    assert.equal(normalise('“fire” ‘safe’ 5–6 − 7 ﬁre'), '"fire" \'safe\' 5-6 - 7 fire');
  });
  it('removes soft hyphens and joins words hyphenated across a line break', () => {
    assert.equal(normalise('flam­mability and co-\n  operate and well-known'), 'flammability and cooperate and well-known');
  });
  it('keeps a hyphen that is not at a line end', () => {
    assert.equal(normalise('micro-gravity - test'), 'micro-gravity - test');
  });
  it('collapses whitespace and decodes entities', () => {
    assert.equal(normalise('  a&nbsp;&amp;\t b \n\n c &#176;C &#x2013; d '), 'a & b c °C - d');
  });
});

describe('htmlToText', () => {
  it('drops scripts, styles, comments and tags, and keeps entities decoded', () => {
    const text = htmlToText('<p>Fire<script>var x = "hidden";</script><style>p { }</style><!-- note --> &amp; <b>flame</b></p>');
    assert.equal(normalise(text), 'Fire & flame');
  });
});

describe('extractText', () => {
  it('extracts the HTML fixture without script or style text', () => {
    const text = normalise(extractText(fixture('tea.html')));
    assert.match(text, /steeped for four minutes at a fictional temperature of eighty-five degrees/);
    assert.match(text, /cooperates with the "saucer" - or so/);
    assert.doesNotMatch(text, /never extracted/);
  });

  it('extracts the PDF fixture with pdftotext, plain and layout', () => {
    const dir = tempDir();
    after(() => removeDir(dir));
    const file = `${dir}/tea.pdf`;
    writeFileSync(file, fixture('tea.pdf'));
    const text = extractText(fixture('tea.pdf'), file);
    assert.match(text, /=====LAYOUT=====/);
    assert.match(normalise(text), /steeped for four minutes in the demonstration cup at a made-up temperature/);
  });
});

describe('locateQuote and excerptAround', () => {
  const text = normalise('Alpha beta gamma delta. The Sample burned for twelve seconds in the test cell. Omega epsilon.');
  it('finds an exact quote after normalising it', () => {
    assert.deepEqual(locateQuote(text, 'The “Sample” burned'.replace('“Sample”', 'Sample')), { found: true, match: 'exact' });
  });
  it('reports a case-insensitive match as such', () => {
    assert.deepEqual(locateQuote(text, 'the sample BURNED for twelve seconds'), { found: true, match: 'case-insensitive' });
  });
  it('reports the longest fragment that does occur when the quote is wrong', () => {
    const result = locateQuote(text, 'The Sample burned for twelve seconds in the test cell at five minutes');
    assert.equal(result.found, false);
    assert.equal(result.fragment, 'The Sample burned for twelve seconds in the test cell');
    assert.match(result.hint, /Alpha beta/);
  });
  it('reports no fragment when nothing matches', () => {
    assert.deepEqual(locateQuote(text, 'completely unrelated words appear here'), { found: false, fragment: '', hint: '' });
  });
  it('cuts the excerpt around the quote and flags a missing quote', () => {
    assert.deepEqual(excerptAround(text, 'burned for twelve seconds', 10), { located: true, text: 'he Sample burned for twelve seconds in the te' });
    assert.equal(excerptAround(text, 'not there at all', 10).located, false);
  });
});

describe('getSourceText and landingStatus', () => {
  it('downloads, extracts, caches and reuses the text', async (t) => {
    const dir = tempDir();
    const server = await sourceServer();
    after(async () => { removeDir(dir); await server.close(); });
    const html = await getSourceText(`${server.url}/tea.html`, dir);
    assert.match(html, /demonstration cup/);
    const pdf = await getSourceText(`${server.url}/tea.pdf`, dir);
    assert.match(pdf, /made-up temperature/);
    await server.close();
    assert.equal(await getSourceText(`${server.url}/tea.html`, dir), html, 'second call is served from memory');
    t.diagnostic('cache holds the extracted text of both documents');
  });

  it('retries once after a server error and then succeeds', async () => {
    let calls = 0;
    const server = await listen((request, response) => {
      calls += 1;
      if (calls === 1) return response.writeHead(503).end('busy');
      return response.writeHead(200, { 'content-type': 'text/html' }).end('<p>ok</p>');
    });
    after(() => server.close());
    assert.equal(await landingStatus(`${server.url}/x`), 200);
    assert.equal(calls, 2);
  });

  it('reports a 404 landing page and rejects a download that failed', async () => {
    const server = await listen((request, response) => response.writeHead(404).end('gone'));
    const dir = tempDir();
    after(async () => { removeDir(dir); await server.close(); });
    assert.equal(await landingStatus(`${server.url}/x`), 404);
    await assert.rejects(getSourceText(`${server.url}/missing.html`, dir), /download failed/);
  });
});
