import { citedSentence, createCites } from './cites.mjs';
import { html } from './html.mjs';
import { extras, fleetBlock, paragraphsOf, sourcesScene, tagsFor } from './home-page.mjs';
import { page } from './layout.mjs';

const plain = (sentences) => sentences.map(({ text }) => text).join(' ');

/**
 * vehicle/index.html: the whole-vehicle scene of the home story on a page of its own. The text is the text of that beat,
 * the interactive plan is the same <fleet-view> the home page used to carry.
 */
export function vehiclePage({ root, passport, stories, evidence, home }) {
  const beat = stories.get(home.id).beats.find((item) => item.interactive === 'fleet');
  const cites = createCites(evidence);
  const ctx = { cites, site: { root, passport, stories, evidence } };
  const scene = html`<section class="scene scene--beat scene--home scene--live" id="vehicle" aria-labelledby="vehicle-title">
    <div class="scene__inner beat beat--wide">
      <div class="beat__head">
        <div class="beat__title">
          <h1 id="vehicle-title">${beat.heading}</h1>
          ${tagsFor(beat.sentences)}
        </div>
      </div>
      <div class="beat__text">
        ${paragraphsOf(beat.sentences).map((group) => html`<p class="prose">${group.map((sentence) => citedSentence(sentence, ctx.cites))}</p>`)}
      </div>
      <div class="beat__live">${fleetBlock('overview', ctx)}</div>
    </div>
  </section>`;

  return page({
    title: `${beat.heading} · Cargo Passport`,
    description: plain(beat.sentences.slice(0, 2)),
    base: '../',
    top: { href: '../', label: 'Cargo Passport' },
    skipTo: 'vehicle',
    railItems: [{ id: 'vehicle', label: beat.heading }, ...(cites.records().length ? [{ id: 'sources', label: 'Sources' }] : [])],
    styles: ['passport', 'home', ...extras(root, 'css', ['fleet'])],
    scripts: [...extras(root, 'js', ['fleet-view'])],
    body: html`${scene}
${cites.records().length ? sourcesScene(cites) : ''}`,
  });
}
