import { citedSentence, createCites, sourceList } from './cites.mjs';
import { html } from './html.mjs';
import { page } from './layout.mjs';
import { BuildError } from './load.mjs';
import { pad, recordMark, statusMark } from './parts.mjs';

const SENTENCES_PER_PARAGRAPH = 3;

const FIGURE_CONTROLS = {
  'flame-duct': {
    label: 'Interactive drawing of a small flame in an air duct',
    ratio: '4 / 3',
    buttons: [
      { label: 'Fan on', state: { fan: true, gravity: '0g' } },
      { label: 'Fan off', state: { fan: false, gravity: '0g' } },
      { label: 'Earth gravity', state: { fan: true, gravity: '1g' } },
    ],
  },
};

/** Splits a beat's sentences into paragraphs of at most three, as even in size as possible. */
export function paragraphs(sentences) {
  const count = Math.ceil(sentences.length / SENTENCES_PER_PARAGRAPH);
  const base = Math.floor(sentences.length / count);
  const larger = sentences.length % count;
  let start = 0;
  return Array.from({ length: count }, (_, index) => {
    const group = sentences.slice(start, start + base + (index < larger ? 1 : 0));
    start += group.length;
    return group;
  });
}

const pullQuote = (id, evidence, cites) => {
  const record = evidence.get(id);
  return html`<figure class="pull slab">
        <blockquote data-evidence="${id}">“${record.quote}”${cites.markers([id])}</blockquote>
        <figcaption data-computed="source title, organisation, year and link of evidence record ${id}, from data/evidence.json">${record.source_title}, ${record.source_org}, ${record.source_year}. <a href="${record.landing_url}" target="_blank" rel="noopener noreferrer">Open the source</a></figcaption>
      </figure>`;
};

const figureBlock = (name) => {
  if (!FIGURE_CONTROLS[name]) throw new BuildError([`a beat asks for figure "${name}", which tools/site/story-page.mjs has no controls for`]);
  const { label, ratio, buttons } = FIGURE_CONTROLS[name];
  return html`<div class="beat__figure">
      <figure-host name="${name}" style="--figure-ratio: ${ratio}" role="group" aria-label="${label}"><noscript><p class="small">${label} needs JavaScript.</p></noscript></figure-host>
      <div class="figure-controls" data-figure-controls role="group" aria-label="Set the drawing" hidden>
        ${buttons.map(({ label: text, state }) => html`<button type="button" class="btn" aria-pressed="false" data-figure-state="${JSON.stringify(state)}">${text}</button>`)}
      </div>
      <div class="figcap" data-figure-caption aria-live="polite"></div>
    </div>`;
};

const beatScene = (beat, index, total, ctx) => {
  const { evidence, cites } = ctx;
  const figure = beat.figure ? figureBlock(beat.figure) : '';
  return html`<section class="scene scene--beat" id="beat-${beat.id}" aria-labelledby="beat-${beat.id}-title">
    <div class="scene__inner beat${beat.figure ? ' beat--figure' : ''}">
      <div class="beat__head">
        <div class="beat__title">
          <div><span class="eyebrow">${pad(index + 1)} of ${pad(total)}</span></div>
          <h2 id="beat-${beat.id}-title">${beat.heading}</h2>
        </div>
      </div>
      <div class="beat__text">
        ${paragraphs(beat.sentences).map((group) => html`<p class="prose">${group.map((sentence) => citedSentence(sentence, cites))}</p>`)}
        ${beat.pull_quote ? pullQuote(beat.pull_quote.evidence, evidence, cites) : ''}
      </div>
      ${figure}
    </div>
  </section>`;
};

const LIMITS_SHOWN = 6;

const limitItem = (file, text, index) => html`<li data-computed="${recordMark(file, `limits[${index}]`)}">${text}</li>`;

export const limitsScene = (story, file, heading = 'What this story does not show') => html`<section class="scene scene--short" id="limits" aria-labelledby="limits-title">
    <div class="scene__inner">
      <div class="slab limits">
        <h2 id="limits-title">${heading}</h2>
        <ul>
          ${story.limits.slice(0, LIMITS_SHOWN).map((text, index) => limitItem(file, text, index))}
        </ul>
        ${story.limits.length > LIMITS_SHOWN ? html`<details class="limits__more">
          <summary><span><span data-computed="number of limits after the first ${LIMITS_SHOWN} in the story file">${story.limits.length - LIMITS_SHOWN}</span> more</span></summary>
          <ul>${story.limits.slice(LIMITS_SHOWN).map((text, index) => limitItem(file, text, index + LIMITS_SHOWN))}</ul>
        </details>` : ''}
      </div>
    </div>
  </section>`;

const questionItem = (question, shelfById) => {
  const target = question.story ? shelfById.get(question.story) : null;
  if (target && target.state !== 'published') return html`<li class="question slab"><p>${question.text}</p></li>`; // a story that is not written yet is hidden
  if (!target) return html`<li class="question slab"><p>${question.text}</p></li>`;
  return html`<li class="question slab" data-story="${target.id}">
      <p>${question.text}</p>
      <p class="question__link"><a href="../#story-${target.id}">${target.title}</a></p>
    </li>`;
};

const unknownScene = (story, shelfById) => html`<section class="scene scene--short" id="unknown" aria-labelledby="unknown-title">
    <div class="scene__inner">
      <h2 id="unknown-title">What nobody knows yet</h2>
      <p class="lead">Each question that names another story links to its card in the library.</p>
      <ul class="questions">
        ${story.open_questions.map((question) => questionItem(question, shelfById))}
      </ul>
    </div>
  </section>`;

const headScene = (story, entry, file) => html`<section class="scene scene--title" id="story-top" aria-labelledby="story-title">
    <div class="scene__inner story-head">
      <div><span class="eyebrow">A story from the library</span></div>
      <h1 id="story-title">${story.title}</h1>
      <p class="lead">${story.dek}</p>
      <div>
        <div class="slab statusbox" data-story="${entry.id}">
          <div class="statusbox__row">${statusMark(story.status)}</div>
          <p data-computed="${recordMark(file, 'status_reason')}">${story.status_reason}</p>
        </div>
      </div>
    </div>
  </section>`;

const sourcesScene = (cites) => html`<section class="scene scene--short sources" id="sources" aria-labelledby="sources-title">
    <div class="scene__inner">
      <h2 id="sources-title">Sources</h2>
      <p class="small">Each numbered marker in the story opens the passage it rests on.</p>
      ${sourceList(cites)}
      <div class="actions"><a class="btn btn--primary" href="../../#library">Back to more stories</a></div>
    </div>
  </section>`;

export function storyPage({ story, entry, file, evidence, shelf }) {
  const cites = createCites(evidence);
  const ctx = { evidence, cites };
  const shelfById = new Map(shelf.map((item) => [item.id, item]));
  const beats = story.beats.map((beat, index) => beatScene(beat, index, story.beats.length, ctx));
  const railItems = [
    { id: 'story-top', label: 'Start of the story' },
    ...story.beats.map((beat) => ({ id: `beat-${beat.id}`, label: beat.heading })),
    { id: 'limits', label: 'What this story does not show' },
    { id: 'unknown', label: 'What nobody knows yet' },
    { id: 'sources', label: 'Sources' },
  ];
  return page({
    title: `${story.title} · Cargo Passport`,
    description: story.dek,
    base: '../../',
    top: { href: '../../#library', label: 'Stories' },
    skipTo: 'story-top',
    railItems,
    body: html`${headScene(story, entry, file)}
${beats}
${limitsScene(story, file)}
${unknownScene(story, shelfById)}
${sourcesScene(cites)}`,
  });
}
