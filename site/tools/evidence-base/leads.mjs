import { existsSync, readFileSync } from 'node:fs';
import { writeIfChanged } from './base.mjs';
import { ConfigError } from './errors.mjs';
import { runProgram } from './exec.mjs';
import { findGbrain, SOURCES } from './gbrain.mjs';

function readJson(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new ConfigError(`${file} is not readable JSON (${error.message}). Fix the file or run without --leads.`);
  }
}

/** The next story to write: the first entry of data/stories.json that is not published yet and is not the home story, as { id, title }, or null. */
export function nextStory(siteRoot) {
  const story = (readJson(`${siteRoot}/data/stories.json`) ?? []).find((item) => item.state !== 'published' && item.home !== true);
  if (!story) return null;
  if (typeof story.title !== 'string' || story.title === '') throw new ConfigError(`data/stories.json: the next story "${story.id}" has no title.`);
  return { id: story.id, title: story.title };
}

const rowsOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : null);

/** gbrain returns one row per matching chunk; a lead is one page, so the first (best) row of each page is kept. */
const onePerPage = (rows) => rows.filter((row, index) => row.slug === undefined || rows.findIndex((other) => other.slug === row.slug) === index);

/** The matching passage of a row, short enough for one line. */
function passage(row) {
  const text = String(row.snippet ?? row.chunk_text ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 240 ? `${text.slice(0, 240)}...` : text;
}

function renderLeads(story, rows, raw) {
  const head = [
    `# Reading leads for "${story.title}"`,
    '',
    '**This file creates no evidence.** It lists pages of the NASA evidence source that matched the title of the next story, as places for a person or an agent to start reading. A claim needs a verbatim quote, a verified record and the three gates before it counts (see docs/evidence-base.md).',
    '',
  ];
  if (!rows) return [...head, 'The search output had a shape this pipeline does not read. It is kept as printed:', '', '```json', raw.trim(), '```', ''].join('\n');
  if (rows.length === 0) return [...head, 'The search found no page.', ''].join('\n');
  return [...head, ...onePerPage(rows).map((row) => `- ${row.slug ?? row.id ?? '(no slug)'}: ${row.title ?? ''}${row.score !== undefined ? ` (score ${row.score})` : ''}${passage(row) ? `\n  ${passage(row)}` : ''}`), ''].join('\n');
}

/** Searches the NASA source for the title of the next story and writes reports/leads-<story id>.md. */
export async function writeLeads({ base, siteRoot, env, log, execute = runProgram }) {
  const story = nextStory(siteRoot);
  if (!story) return log('leads: data/stories.json has no story waiting to be written; nothing to search');
  const binary = findGbrain(env);
  if (!binary) return log('leads: gbrain not found; skipped');
  let stdout;
  try {
    ({ stdout } = await execute(binary, ['search', story.title, '--source', SOURCES.nasa, '--json'], { env }));
  } catch (error) {
    throw new ConfigError(`${error.message}\nThe reading leads were not written. Run the search by hand to see why.`);
  }
  let rows = null;
  try { rows = rowsOf(JSON.parse(stdout)); } catch { /* shown raw */ }
  const file = `${base}/reports/leads-${story.id}.md`;
  writeIfChanged(file, renderLeads(story, rows, stdout));
  log(`leads: wrote ${file}`);
}
