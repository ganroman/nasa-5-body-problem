import { html } from './html.mjs';

/** Numbers sources in order of first use on one page, the same order assets/js/evidence.js uses in the browser. */
export function createCites(evidence) {
  const numbers = new Map();
  const number = (id) => {
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
    return numbers.get(id);
  };
  return {
    number,
    records: () => [...numbers].map(([id, n]) => ({ n, record: evidence.get(id) })),
    markers: (ids) => ids.map((id) => html`<sup class="fn"><a href="#src-${number(id)}">${number(id)}</a></sup>`),
  };
}

const sourceLine = ({ n, record }) => html`<li id="src-${n}">
    <span class="src-title">${record.source_title}</span>
    <span class="src-meta">${record.source_org}, ${record.source_year}. ${record.locator ?? ''} </span>
    <a href="${record.landing_url}" target="_blank" rel="noopener noreferrer">Source page</a>${record.doc_url ? html` · <a href="${record.doc_url}" target="_blank" rel="noopener noreferrer">Document</a>` : ''}
  </li>`;

export const sourceList = (cites) => html`<ol data-evidence-list data-computed="title, organisation, year, locator and links of the evidence records cited on this page, from data/evidence.json">
  ${cites.records().map(sourceLine)}
</ol>`;

/** A sentence with its citations; illustrative and concept sentences are wrapped so the gates know they are not sourced facts. */
export function citedSentence(sentence, cites) {
  let out = sentence.evidence.length
    ? html`<span class="fact" data-evidence="${sentence.evidence.join(' ')}">${sentence.text}${cites.markers(sentence.evidence)}</span>`
    : html`${sentence.text}`;
  if (sentence.illustrative) out = html`<span data-illustrative>${out}</span>`;
  if (sentence.concept) out = html`<span data-concept>${out}</span>`;
  return html`${out} `;
}
