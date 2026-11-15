import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { html, raw } from './html.mjs';

const REPO_URL = 'https://github.com/Hantok/cargo-passport';
export const APP_URL = 'https://cargo.qwadratic.me';
export const repoFile = (path) => `${REPO_URL}/blob/HEAD/${path}`;
const SI_DISCLOSURE =
  'The code, layout and first drafts of text of this site were produced with SI assistance. Every numbered sentence links to a verbatim quote from its source.';

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='none' stroke='%23ff8c1a' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='8' fill='%234fb3ff'/%3E%3C/svg%3E";

const COSMOS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'cosmos.html'), 'utf8');
const STYLES = ['tokens', 'base', 'cosmos', 'depth', 'components', 'library', 'story'];
const SCRIPTS = ['rail', 'figure-host', 'figure-controls', 'shelf-filter', 'evidence'];

const footer = (base) => html`<footer class="foot">
  <div class="foot__inner">
    <p class="foot__verdict">Not a safety verdict. This library organises evidence; people decide.</p>
    <p>${SI_DISCLOSURE}</p>
    <ul>
      <li><a href="${APP_URL}" rel="noopener">Live app</a></li>
      <li><a href="${REPO_URL}" rel="noopener">Repository</a></li>
      <li><a href="${repoFile('LICENSE')}" rel="noopener">MIT License</a></li>
    </ul>
  </div>
</footer>`;

const rail = (items) => html`<nav class="rail" aria-label="Sections">
  ${items.map(({ id, label }, index) => html`<a href="#${id}" aria-label="${label}"${index === 0 ? raw(' aria-current="true"') : ''}></a>`)}
</nav>`;

/**
 * One page shell. `base` is the relative path back to the site root ("" or "../../").
 * `top` is the header link on the right, `skipTo` the id of the first content scene.
 */
export function page({ title, description, base, top, skipTo, railItems, body, styles = [], scripts = [] }) {
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="si-disclosure" content="${SI_DISCLOSURE}">
<meta name="theme-color" content="#0b1628">
<link rel="icon" href="${FAVICON}">
${[...STYLES, ...styles].map((name) => html`<link rel="stylesheet" href="${base}assets/css/${name}.css">\n`)}<script type="module" src="${base}vendor/ui-sdk/web.js"></script>
${[...SCRIPTS, ...scripts].map((name) => html`<script type="module" src="${base}assets/js/${name}.js"></script>\n`)}</head>
<body>
<a class="skip" href="#${skipTo}">Skip to the content</a>

${raw(COSMOS)}
<header class="top">
  <a class="brand" href="${base || './'}">Cargo <span>Passport</span></a>
  <a class="btn" href="${top.href}">${top.label}</a>
</header>

<main>
${body}
</main>

${footer(base)}

${rail(railItems)}
</body>
</html>
`;
}
