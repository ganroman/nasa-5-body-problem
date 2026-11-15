import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toHtml } from './site/html.mjs';
import { homePage } from './site/home-page.mjs';
import { BuildError, danglingQuestions, loadSite } from './site/load.mjs';
import { storyPage } from './site/story-page.mjs';

/** Renders every page of the site as { path, html }, relative to the site root. */
export function buildPages(root) {
  const { shelf, passport, evidence, home, stories } = loadSite(root);
  const mismatches = [...stories.values()]
    .filter((story) => story.status !== shelf.find((entry) => entry.id === story.id).evidence_status)
    .map((story) => `content/stories/${story.id}.json status "${story.status}" differs from evidence_status in data/stories.json`);
  if (mismatches.length) throw new BuildError(mismatches);

  const pages = [{ path: 'index.html', html: toHtml(homePage({ root, shelf, passport, stories, evidence, home })) }];
  for (const [id, story] of stories) {
    if (id === home.id) continue;
    const entry = shelf.find((item) => item.id === id);
    pages.push({ path: `stories/${id}/index.html`, html: toHtml(storyPage({ story, entry, file: `content/stories/${id}.json`, evidence, shelf })) });
  }
  return pages;
}

export const siteWarnings = (root) => danglingQuestions(loadSite(root));

export function writePages(root) {
  const pages = buildPages(root);
  for (const { path, html } of pages) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
  }
  return pages.map(({ path }) => path);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  try {
    console.log(writePages(root).map((path) => `wrote ${path}`).join('\n'));
    for (const warning of siteWarnings(root)) console.warn(`warning: ${warning}`);
  } catch (error) {
    if (!(error instanceof BuildError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
