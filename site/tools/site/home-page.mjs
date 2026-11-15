import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { citedSentence, createCites, sourceList } from './cites.mjs';
import { html, raw } from './html.mjs';
import { appLink, page } from './layout.mjs';
import { fleet, rules } from './optional.mjs';
import { passportBlock } from './passport.mjs';
import { pad } from './parts.mjs';
import { limitsScene } from './story-page.mjs';
import { bornScene, citedCounts, honestScene, featuredScene } from './shelf.mjs';

const SENTENCES_PER_PARAGRAPH = 3;

const STAGE = {
  journey: 'Same cargo, different environment',
  air: 'The air differs by place',
  passport: 'The passport',
  fits: 'Where it fits',
  earth: 'On Earth',
  more: 'Stories',
};

const MARKS = [
  ['illustrative', 'Illustrative: invented, not a record.'],
  ['concept', 'Concept: not built, written as what would happen.'],
];

export const tagsFor = (sentences) => {
  const present = MARKS.filter(([key]) => sentences.some((sentence) => sentence[key]));
  return present.length ? html`<p class="beat__mark">${present.map(([, label]) => label).join(' ')}</p>` : '';
};

export const paragraphsOf = (sentences) => {
  if (sentences.some((sentence) => sentence.new_paragraph)) {
    // the story names its own paragraph breaks: a sentence with "new_paragraph" opens a paragraph, nothing is re-split
    const groups = [];
    for (const sentence of sentences) {
      if (!groups.length || sentence.new_paragraph) groups.push([]);
      groups.at(-1).push(sentence);
    }
    return groups;
  }
  const count = Math.ceil(sentences.length / SENTENCES_PER_PARAGRAPH);
  const base = Math.floor(sentences.length / count);
  const larger = sentences.length % count;
  let start = 0;
  return Array.from({ length: count }, (_, index) => {
    const group = sentences.slice(start, start + base + (index < larger ? 1 : 0));
    start += group.length;
    return group;
  });
};

const pullQuote = (id, evidence, cites) => {
  const record = evidence.get(id);
  return html`<figure class="pull slab">
        <blockquote data-evidence="${id}">“${record.quote}”${cites.markers([id])}</blockquote>
        <figcaption data-computed="source title, organisation, year and link of evidence record ${id}, from data/evidence.json">${record.source_title}, ${record.source_org}, ${record.source_year}. <a href="${record.landing_url}" target="_blank" rel="noopener noreferrer">Open the source</a></figcaption>
      </figure>`;
};

const beatLink = (link) => (link ? html`<p class="beat__link"><a class="btn" href="stories/${link.story}/">${link.text}</a></p>` : '');

export const fleetBlock = (mode, ctx) => {
  if (!fleet?.renderFleetStatic) {
    const label = mode === 'overview' ? 'Model of the whole vehicle' : 'The watch, step by step';
    return html`<div class="fleet-slot fleet-slot--missing" data-mode="${mode}"><p class="figure-missing small">${label}: in preparation.</p></div>`;
  }
  const inner = fleet.renderFleetStatic({ evidence: ctx.site.evidence, root: ctx.site.root }, mode, ctx.cites);
  return typeof inner === 'string' ? raw(inner) : inner;
};

const interactiveBlock = (name, ctx) => {
  if (name === 'passport') return html`<div class="beat__live">${passportBlock({ passport: ctx.site.passport, evidence: ctx.site.evidence, cites: ctx.cites, rules })}</div>`;
  return '';
};

const beatScene = (beat, sentences, number, ctx) => html`<section class="scene scene--beat scene--home${beat.interactive ? ' scene--live' : ''}" id="beat-${beat.id}" aria-labelledby="beat-${beat.id}-title">
    <div class="scene__inner beat${beat.interactive ? ' beat--wide' : ''}">
      <div class="beat__head">
        <div class="beat__title">
          <h2 id="beat-${beat.id}-title">${beat.heading}</h2>
          ${tagsFor(sentences)}
        </div>
      </div>
      <div class="beat__text">
        ${paragraphsOf(sentences).map((group) => html`<p class="prose">${group.map((sentence) => citedSentence(sentence, ctx.cites))}</p>`)}
        ${beat.pull_quote ? pullQuote(beat.pull_quote.evidence, ctx.site.evidence, ctx.cites) : ''}
        ${beatLink(beat.link)}
      </div>
      ${interactiveBlock(beat.interactive, ctx)}
    </div>
  </section>`;

const openingScene = (story, passport) => html`<section class="scene" id="hook" aria-labelledby="hook-title">
    <div class="scene__inner hook hook--hero">
      <div class="hook__text">
        <h1 id="hook-title">${story.title}</h1>
        <p class="lead hook__line">${story.dek}</p>
        <div class="actions">
          <a class="btn btn--primary" href="${appLink(passport.slug)}">Open the passport</a>
          <a class="btn" href="#library">Stories</a>
        </div>
      </div>
    </div>
  </section>`;

export const sourcesScene = (cites) => html`<section class="scene scene--short sources" id="sources" aria-labelledby="sources-title">
    <div class="scene__inner">
      <h2 id="sources-title">Sources</h2>
      ${sourceList(cites)}
    </div>
  </section>`;

export const extras = (root, kind, names) => names.filter((name) => existsSync(join(root, `assets/${kind}/${name}.${kind}`)));

/** The home page: the story of the home entry, then the shelf of the other stories. */
export function homePage({ root, shelf, passport, stories, evidence, home }) {
  const story = stories.get(home.id);
  const cites = createCites(evidence);
  const ctx = { cites, site: { root, shelf, passport, stories, evidence } };
  const more = story.beats.find((beat) => beat.id === 'more');
  const scenes = [];
  const railItems = [{ id: 'hook', label: 'Start' }];
  let number = 0;
  const openingHtml = openingScene(story, passport);

  for (const beat of story.beats) {
    if (beat === more || beat.interactive === 'fleet') continue; // the whole-vehicle scene has its own page: vehicle-page.mjs
    const sentences = beat.sentences;
    if (!sentences.length && !beat.interactive && !beat.pull_quote && !beat.link) continue;
    number += 1;
    scenes.push(beatScene(beat, sentences, pad(number), ctx));
    railItems.push({ id: `beat-${beat.id}`, label: STAGE[beat.id] ?? beat.heading });
  }
  const fleetBeat = story.beats.find((beat) => beat.interactive === 'fleet');
  const shelfHtml = featuredScene(shelf, more ?? { heading: 'Stories', sentences: [] }, pad(number + 1), cites, fleetBeat);
  railItems.push({ id: 'library', label: more?.heading ?? 'Stories' }, { id: 'born', label: 'How a story is born' }, { id: 'honest', label: 'How we keep it honest' });
  const born = bornScene(pad(number + 2));
  const honest = honestScene(citedCounts(stories, evidence), pad(number + 3));
  const limits = limitsScene(story, home.file ?? `content/stories/${home.id}.json`, 'What this page does not show');
  const sources = sourcesScene(cites);
  railItems.push({ id: 'limits', label: 'What this page does not show' }, { id: 'sources', label: 'Sources' });

  return page({
    title: 'Cargo Passport · A record that travels with every cargo item',
    description: 'A Cargo Passport travels with a cargo item and lists which fire-safety evidence applies to each material in the air it is going to, and what has no evidence. People decide.',
    base: '',
    top: { href: '#library', label: 'Stories' },
    skipTo: 'hook',
    railItems,
    styles: ['passport', 'home'],
    scripts: ['passport-ui'],
    body: html`${openingHtml}
${scenes}
${shelfHtml}
${born}
${honest}
${limits}
${sources}`,
  });
}
