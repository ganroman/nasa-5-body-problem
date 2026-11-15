import { createCites } from './cites.mjs';
import { html } from './html.mjs';
import { page } from './layout.mjs';
import { storiesPage } from './shelf.mjs';

/** stories/index.html: every published story. Stories that are not written yet are not listed. */
export function storiesIndexPage({ shelf, evidence }) {
  const cites = createCites(evidence);
  return page({
    title: 'All stories · Cargo Passport',
    description: 'The whole shelf of Cargo Passport stories, with the evidence status of each and what it leaves open.',
    base: '../',
    top: { href: '../', label: 'Cargo Passport' },
    skipTo: 'library',
    railItems: [{ id: 'library', label: 'All stories' }],
    styles: ['home'],
    body: html`${storiesPage(shelf, cites)}`,
  });
}
