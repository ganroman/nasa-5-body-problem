import { citedSentence } from './cites.mjs';
import { html } from './html.mjs';
import { repoFile } from './layout.mjs';
import { STATUS, recordMark, stageTag, statusMark } from './parts.mjs';

const DATA_FILE = 'data/stories.json';
const FILTERS = ['data', 'partial', 'hypothesis'];
const BORN_STEPS = [
  ['Collect evidence', 'A direction gets its evidence: short quotes from NASA records and papers.'],
  ['Pass the gates', 'Every quote is checked against its source before the text is accepted.'],
  ['Publish', 'The story joins the shelf with its evidence status and what it leaves open.'],
];
const HONEST_LINES = [
  'Every sentence with a number mark links to a verbatim quote and its source.',
  'A program opens each link and checks that the quote is on the page.',
  'A language-model judge checks that each claim says no more than its quote.',
];

const basisItem = (basis) => html`<li>
          <a href="${basis.doi_url}" target="_blank" rel="noopener noreferrer"><span class="mono">${basis.accession}</span> ${basis.acronym}</a>
          <span class="small mono">DOI ${basis.doi}</span>
        </li>`;

const basisBlock = (entry) => {
  const count = entry.basis.length;
  if (!count) return html`<p class="card__basis small">Rests on <span data-computed="number of basis entries of this story in ${DATA_FILE}">0</span> NASA investigations yet.</p>`;
  return html`<details class="card__basis" data-computed="${recordMark(DATA_FILE, `${entry.id} basis`)}">
        <summary><span>Rests on <span data-computed="number of basis entries of this story in ${DATA_FILE}">${count}</span> NASA ${count === 1 ? 'investigation' : 'investigations'}</span></summary>
        <ul class="basis">${entry.basis.map(basisItem)}</ul>
      </details>`;
};

const gapsBlock = (entry) => (entry.gaps.length
  ? html`<details class="card__gaps" data-computed="${recordMark(DATA_FILE, `${entry.id} gaps`)}">
        <summary><span>Known gaps (<span data-computed="number of gaps of this story in ${DATA_FILE}">${entry.gaps.length}</span>)</span></summary>
        <ul>${entry.gaps.map((gap) => html`<li>${gap}</li>`)}</ul>
      </details>`
  : '');

const cardAction = (entry) => (entry.state === 'published'
  ? html`<a class="btn btn--primary" href="stories/${entry.id}/">Read the story</a>`
  : html`<p class="card__note small">Not written yet.</p>`);

const storyCard = (entry, index) => html`<li class="shelf__item" data-status="${entry.evidence_status}">
      <article class="card slab" id="story-${entry.id}" data-story="${entry.id}" data-status="${entry.evidence_status}" data-state="${entry.state}">
        <div class="card__top">${statusMark(entry.evidence_status)}${stageTag(entry.state)}</div>
        <h3>${entry.state === 'published' ? html`<a href="stories/${entry.id}/">${entry.title}</a>` : entry.title}</h3>
        <p class="card__premise" data-computed="${recordMark(DATA_FILE, `${entry.id} premise`)}">${entry.premise}</p>
        <p class="card__reason small" data-computed="${recordMark(DATA_FILE, `${entry.id} status_reason`)}"><span class="visually-hidden">Why this status: </span>${entry.status_reason}</p>
        ${basisBlock(entry)}
        ${gapsBlock(entry)}
        <div class="card__foot">
          ${cardAction(entry)}
        </div>
      </article>
    </li>`;

const filterBar = (shelf) => {
  const counts = Object.fromEntries(FILTERS.map((key) => [key, shelf.filter((entry) => entry.evidence_status === key).length]));
  return html`<div class="filter" data-shelf-filter hidden role="group" aria-label="Filter the stories by evidence status">
        <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span data-computed="number of stories on the shelf in ${DATA_FILE}">${shelf.length}</span></button>
        ${FILTERS.map((key) => html`<button type="button" class="chip" data-filter="${key}" aria-pressed="false">${STATUS[key].label} <span data-computed="number of stories on the shelf with this evidence status in ${DATA_FILE}">${counts[key]}</span></button>`)}
      </div>`;
};

/** The shelf of the other stories. `beat` is the "more" beat of the home story: its heading and sentences open the scene. */
export const libraryScene = (shelf, beat, index, cites, link) => html`<section class="scene" id="library" aria-labelledby="library-title">
    <div class="scene__inner">
      <div class="scene__head">
        <div><span class="eyebrow">${index} · Other stories</span></div>
        <h2 id="library-title">${beat.heading}</h2>
        <p class="lead">${beat.sentences.map((sentence) => citedSentence(sentence, cites))}</p>
        ${link}
      </div>
      <div>${filterBar(shelf)}</div>
      <ul class="shelf" data-shelf>
        ${shelf.map(storyCard)}
      </ul>
      <p class="shelf__empty small" data-shelf-empty hidden>No story has this status.</p>
      <p class="visually-hidden" role="status" data-shelf-status></p>
    </div>
  </section>`;

export const bornScene = (index) => html`<section class="scene scene--short" id="born" aria-labelledby="born-title">
    <div class="scene__inner">
      <div class="scene__head">
        <div><span class="eyebrow">The method</span></div>
        <h2 id="born-title">How a story is born</h2>
      </div>
      <ol class="steps">
        ${BORN_STEPS.map(([name, text], index) => html`<li class="step slab"><span class="step__n mono" aria-hidden="true">${index + 1}</span><h3>${name}</h3><p class="small">${text}</p></li>`)}
      </ol>
      <div class="actions">
        <a class="btn" href="${repoFile('docs/how-stories-grow.md')}" rel="noopener">How stories grow</a>
      </div>
    </div>
  </section>`;

export const honestScene = (counts, index) => html`<section class="scene scene--short" id="honest" aria-labelledby="honest-title">
    <div class="scene__inner">
      <div class="scene__head">
        <div><span class="eyebrow">The gates</span></div>
        <h2 id="honest-title">How we keep it honest</h2>
      </div>
      <ol class="gates">
        ${HONEST_LINES.map((line) => html`<li class="gate">${line}</li>`)}
      </ol>
      <p class="lead">Today the published stories cite <strong data-computed="distinct evidence ids cited in content/stories/*.json">${counts.claims}</strong> claims from <strong data-computed="distinct source documents (doc_url) among those records in data/evidence.json">${counts.sources}</strong> sources.</p>
      <div class="actions"><a class="btn" href="${repoFile('docs/evidence-method.md')}" rel="noopener">Read the evidence method</a></div>
    </div>
  </section>`;

export function citedCounts(stories, evidence) {
  const ids = new Set([...stories.values()].flatMap((story) => story.beats.flatMap((beat) => [
    ...beat.sentences.flatMap((sentence) => sentence.evidence),
    ...(beat.pull_quote ? [beat.pull_quote.evidence] : []),
  ])));
  return { claims: ids.size, sources: new Set([...ids].map((id) => evidence.get(id).doc_url)).size };
}
