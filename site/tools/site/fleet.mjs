// Build-time markup of the whole-vehicle view (a CONCEPT). It renders the default state of <fleet-view> with the same
// functions the element uses in the browser, so the page reads without JavaScript and the page scan can read it.
// It never throws: a missing file or module gives a short "in preparation" frame.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCites } from './cites.mjs';
import { toHtml, raw } from './html.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let view = null;
try {
  view = await import('../../assets/js/fleet-view.js');
} catch {
  view = null;
}

const frame = (mode) => raw(`<fleet-view mode="${mode}"><p class="fleet-frame small" data-concept>Concept. The whole-vehicle view is in preparation.</p></fleet-view>`);

const readJson = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

/**
 * Markup for one mode ("overview" or "scenario"). `site` is { evidence, root? }: `evidence` is the Map of records the page
 * cites from; `root` defaults to the repository root. Pass the page's `cites` so footnote numbers continue its own.
 */
export function renderFleetStatic(site, mode = 'overview', cites = createCites(site?.evidence ?? new Map())) {
  try {
    if (!view) return frame(mode);
    const root = site?.root ?? REPO;
    const fleet = readJson(root, 'data/fleet.json');
    const passport = readJson(root, 'data/passport.json');
    const evidence = site?.evidence ?? new Map();
    const marks = (ids) => toHtml(cites.markers(ids.filter((id) => evidence.has(id))));
    const claims = (ids) => ids.map((id) => {
      const record = evidence.get(id);
      if (!record) return `<p class="cite--pending" data-evidence="${view.esc(id)}">[source missing: ${view.esc(id)}]</p>`;
      return `<p data-evidence="${view.esc(id)}">${view.esc(record.claim)}${marks([id])}</p>`;
    }).join('');
    const state = mode === 'scenario' ? 0 : view.initialOverview(fleet, passport);
    const ctx = { fleet, passport, rules: view.DEFAULT_RULES, claims, mark: marks, layout: 'wide', uid: mode === 'scenario' ? 's' : 'o' };
    return raw(`<fleet-view mode="${mode === 'scenario' ? 'scenario' : 'overview'}">${view.renderFleet(mode === 'scenario' ? 'scenario' : 'overview', state, ctx)}</fleet-view>`);
  } catch {
    return frame(mode);
  }
}
