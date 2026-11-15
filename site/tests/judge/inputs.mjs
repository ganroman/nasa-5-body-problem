import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { excerptAround, getSourceText } from '../../tools/source-text.mjs';
import { collectSources, renderedStrings, visibleText } from '../../tools/page-scan.mjs';
import { siteRoot } from '../../tools/site.mjs';
import { COVERAGE_SCHEMA, SUPPORT_SCHEMA } from './validate.mjs';

const prompt = (name) => readFileSync(`${dirname(fileURLToPath(import.meta.url))}/prompts/${name}.md`, 'utf8');
const safe = (text) => text.replace(/[^A-Za-z0-9._-]+/g, '_');

export const supportName = (id) => `support-${safe(id)}`;
export const coverageName = (page) => `coverage-${safe(page.replace(/\.html$/, ''))}`;

export function expectedCalls(items, pages) {
  return [
    ...items.map((item) => ({ kind: 'support', key: item.id, name: supportName(item.id) })),
    ...pages.map((page) => ({ kind: 'coverage', key: page, name: coverageName(page) })),
  ];
}

const describeClaim = (item) => [
  `- id: ${item.id}`,
  `  material: ${item.material}`,
  `  conditions: ${JSON.stringify(item.conditions)}`,
  `  claim: ${item.claim}`,
  `  quote: ${item.quote}`,
].join('\n');

export async function buildSupportCall(item) {
  const source = await getSourceText(item.doc_url);
  const excerpt = excerptAround(source, item.quote);
  const user = [
    `Evidence id: ${item.id}`,
    `Material: ${item.material}`,
    `Conditions as recorded: ${JSON.stringify(item.conditions)}`,
    `Claim: ${item.claim}`,
    `Quote: ${item.quote}`,
    `Source: ${item.source_title}, ${item.source_org}, ${item.source_year} (${item.doc_url})`,
    excerpt.located
      ? 'Source excerpt (taken live, the quote lies in the middle):'
      : 'Source excerpt: THE QUOTE WAS NOT FOUND in the source text. The opening of the source text follows.',
    '<<<SOURCE',
    excerpt.text,
    'SOURCE>>>',
  ].join('\n');
  return { name: supportName(item.id), kind: 'support', id: item.id, system: prompt('support'), user, answer_schema: SUPPORT_SCHEMA };
}

export function buildCoverageCall(page, items) {
  const sources = collectSources(siteRoot(), page);
  const data = [
    ...sources.json.map((file) => `### ${file.file}\n${file.text.trim()}`),
    ...sources.scripts.map((file) => {
      const lines = renderedStrings(file.text).map((entry) => `L${entry.line + file.lineBase - 1}: ${entry.text}`);
      return lines.length ? `### ${file.file} (text strings)\n${lines.join('\n')}` : null;
    }).filter(Boolean),
  ];
  const user = [
    `Page: ${page}`,
    '',
    '## Visible text of the page',
    visibleText(sources.html) || '(none)',
    '',
    '## Rendered data',
    data.join('\n\n') || '(none)',
    '',
    '## Evidence claims',
    items.map(describeClaim).join('\n'),
  ].join('\n');
  return { name: coverageName(page), kind: 'coverage', page, system: prompt('coverage'), user, answer_schema: COVERAGE_SCHEMA };
}
