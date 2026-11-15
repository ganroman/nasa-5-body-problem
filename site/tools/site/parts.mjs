import { html } from './html.mjs';

export const STATUS = {
  data: { label: 'Data', meaning: 'Experiments answer the question.' },
  partial: { label: 'Partly data', meaning: 'Some pieces come from experiments; the link between them is our reading.' },
  hypothesis: { label: 'Hypothesis', meaning: 'Experiments do not answer it yet; this is a question to work on.' },
};

const GLYPH = {
  data: html`<circle cx="10" cy="10" r="8" fill="currentColor"/>`,
  partial: html`<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.5a7.5 7.5 0 0 0 0 15z" fill="currentColor"/>`,
  hypothesis: html`<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.4"/>`,
};

export const statusMark = (status) => html`<span class="status status--${status}"><svg class="status__glyph" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">${GLYPH[status]}</svg><span class="status__label">${STATUS[status].label}</span></span>`;

export const recordMark = (file, path) => `${file} ${path}, rendered unchanged`;

export const pad = (number) => String(number).padStart(2, '0');
