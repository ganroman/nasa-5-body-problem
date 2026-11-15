import { html, raw } from './html.mjs';
import { appLink } from './layout.mjs';
import { BuildError } from './load.mjs';
import { qrSvg } from './qr.mjs';

const GLYPH = {
  applies: raw('<circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M4.7 8.3l2.2 2.2 4.4-4.7" fill="none" stroke="#0b1628" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  differs: raw('<path d="M8 1.3l6.7 6.7L8 14.7 1.3 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5.6 6.7h4.8M5.6 9.3h4.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'),
  none: raw('<circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 2.1"/><path d="M5.7 8h4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
};

const CHIPS = {
  applies: { label: 'Evidence applies', lead: 'A record covers this air:' },
  differs: { label: 'Conditions differ', lead: 'The nearest records were gathered in different conditions:' },
  none: { label: 'No evidence', lead: 'No record covers this material in this air.' },
};

const chip = (status) => html`<span class="pp-chip pp-chip--${status}"><svg class="pp-chip__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">${GLYPH[status]}</svg><span>${CHIPS[status].label}</span></span>`;

const ASSESS_NOTE = 'component status and evidence ids from assess() in assets/js/passport-rules.js, rules and tolerances from data/passport.json';

const claimLines = (ids, ctx) => ids.map((id) => {
  const record = ctx.evidence.get(id);
  if (!record) throw new BuildError([`data/passport.json (through assets/js/passport-rules.js) names evidence id "${id}", which is not in data/evidence.json`]);
  return html`<p data-evidence="${id}">${record.claim}${ctx.cites.markers([id])}</p>`;
});

const rowWhy = (status, ids, ctx) => html`<p class="pp-row__lead small" data-computed="${ASSESS_NOTE}">${CHIPS[status].lead}</p>${claimLines(ids, ctx)}`;

const gravityCaveat = (assessed, component, ctx) => (assessed.caveats.gravity_caveat_components.includes(component.id)
  ? html`<div class="pp-row__caveat" data-pp-caveat>${claimLines(assessed.caveats.gravity_evidence, ctx)}</div>`
  : '');

/** Evidence ids that assess() lists for every component (for example because the item is powered here): written once, not once per row. */
const sharedEvidence = (components) => (components.length
  ? components[0].evidence.filter((id) => components.every((component) => component.evidence.includes(id)))
  : []);

const sharedBlock = (shared, ctx) => html`<div class="pp-shared" data-pp-shared${shared.length ? '' : raw(' hidden')}>
        <p class="pp-shared__title" data-computed="${ASSESS_NOTE}">Applies to every component here</p>
        <div data-pp-shared-why>${claimLines(shared, ctx)}</div>
      </div>`;

const componentRow = (component, result, assessed, ctx) => html`<li class="pp-row" id="pp-row-${component.id}" data-component="${component.id}" data-status="${result.status}">
        <div class="pp-row__what">
          <h4 class="pp-row__name" data-illustrative>${component.name}</h4>
          <p class="pp-row__material small" data-illustrative>${component.material}</p>
        </div>
        <div class="pp-row__chip" data-pp-chip>${chip(result.status)}</div>
        <div class="pp-row__why" data-pp-why>${rowWhy(result.status, result.evidence.filter((id) => !assessed.shared.includes(id)), ctx)}${gravityCaveat(assessed, component, ctx)}</div>
      </li>`;

const choice = (name, value, label, checked) => html`<label class="pp-choice"><input type="radio" name="${name}" value="${value}"${checked ? raw(' checked') : ''}><span>${label}</span></label>`;

const controls = (passport, vehicle, place) => html`<div class="pp-controls" data-pp-controls hidden>
          <fieldset class="pp-field"><legend>Which air</legend><div class="pp-choices">${passport.vehicles.map((item) => choice('pp-vehicle', item.id, item.label, item.id === vehicle))}</div></fieldset>
          <fieldset class="pp-field"><legend>Where is it</legend><div class="pp-choices">${passport.places.map((item) => choice('pp-place', item.id, item.label, item.id === place))}</div></fieldset>
        </div>`;

const air = (assessed, ctx) => {
  const env = assessed.env;
  const ids = env.evidence;
  return html`<div class="pp-air" data-pp-air>
          <p class="pp-air__label eyebrow" data-computed="air label from assess() in assets/js/passport-rules.js, from data/passport.json"><span data-pp-air-label>${env.label}</span></p>
          <div class="pp-air__values" data-pp-air-values>
            <span class="pp-air__cited" data-pp-air-cited data-evidence="${ids.join(' ')}">
              <span class="pp-air__value"><span class="pp-air__num" data-pp-o2>${env.o2_percent}</span><span class="pp-air__unit"> % oxygen</span></span>
              <span class="pp-air__value" data-pp-psia-box${env.pressure_psia === null ? raw(' hidden') : ''}><span class="pp-air__num" data-pp-psia>${env.pressure_psia}</span><span class="pp-air__unit"> psia</span></span>
              ${ctx.cites.markers(ids)}
            </span>
            <span class="pp-air__value pp-air__value--computed"><span class="pp-air__unit" data-pp-eq${env.pressure_psia === null ? raw(' hidden') : ''}>=</span><span class="pp-air__num" data-computed="pressure in kilopascals, from data/passport.json" data-pp-pressure>${env.pressure_kpa}</span><span class="pp-air__unit"> kPa</span></span>
          </div>
        </div>`;
};

const placeNote = (place, record, ctx) => html`<div class="pp-note" data-pp-note${place.flagged ? '' : raw(' hidden')}>
        <h4 class="pp-note__title"><span data-pp-note-title>${record.label}</span></h4>
        <p class="pp-note__about small" data-computed="place description from data/passport.json" data-pp-note-about>${record.about}</p>
        <div data-pp-note-why>${place.flagged ? claimLines(place.evidence, ctx) : ''}</div>
      </div>`;

const summary = (counts) => html`<p class="pp-summary" data-pp-summary aria-live="polite" data-computed="count of components by status, from assess() in assets/js/passport-rules.js">
        ${['applies', 'differs', 'none'].map((status) => html`<span class="pp-count pp-count--${status}"><b data-pp-count="${status}">${counts[status]}</b> ${CHIPS[status].label}</span>`)}
      </p>`;

const figureHost = (name, label, ratio) => html`<figure-host name="${name}" style="--figure-ratio: ${ratio}" role="group" aria-label="${label}"><noscript><p class="small">${label} needs JavaScript.</p></noscript></figure-host>`;

const scan = (passport) => {
  const url = appLink(passport.slug, { absolute: true });
  return html`<div class="pp-scan slab" data-pp-scan>
        <div class="pp-qr">${qrSvg(url, `QR code that opens the live passport of the ${passport.name.toLowerCase()}`)}</div>
        <div class="pp-scan__text">
          <span class="eyebrow">Scan</span>
          <h3>One code on the item</h3>
          <p class="small">The code opens the <a href="${appLink(passport.slug)}">live app</a> on a phone, with the passport of this item.</p>
          <div class="actions"><a class="btn btn--primary" href="${appLink(passport.slug)}">Open the passport</a><button type="button" class="btn" data-pp-open aria-controls="pp-card" aria-expanded="false" hidden>Preview it here</button></div>
        </div>
      </div>`;
};

/** The default state is the first air, and the first place that carries no flag in it. */
export function defaultState(passport, assess) {
  const vehicle = passport.vehicles[0].id;
  const open = passport.places.find((place) => !assess(passport, { vehicle, place: place.id }).places.find((item) => item.id === place.id).flagged);
  return { vehicle, place: (open ?? passport.places[0]).id };
}

export function passportBlock({ passport, evidence, cites, rules }) {
  if (!rules) return html`<div class="pp pp--missing"><p class="figure-missing small">The interactive passport is in preparation.</p></div>`;
  const ctx = { evidence, cites };
  const { assess } = rules;
  const state = defaultState(passport, assess);
  const assessed = assess(passport, state);
  assessed.shared = sharedEvidence(assessed.components);
  const vehicle = passport.vehicles.find((item) => item.id === state.vehicle);
  const place = passport.places.find((item) => item.id === state.place);
  const placeResult = assessed.places.find((item) => item.id === state.place);
  const resultOf = new Map(assessed.components.map((item) => [item.id, item]));
  return html`<div class="pp" data-passport id="passport-app" data-vehicle="${state.vehicle}" data-place="${state.place}">
      ${scan(passport)}
      <div class="pp-card slab" id="pp-card" data-pp-card tabindex="-1" role="region" aria-labelledby="pp-title">
        <header class="pp-head">
          <div class="pp-head__id">
            <span class="eyebrow">Cargo Passport</span>
            <h3 id="pp-title" data-illustrative>${passport.name}</h3>
            <p class="pp-head__purpose" data-illustrative>${passport.purpose}</p>
            <span class="beat__mark">Illustrative item</span>
          </div>
          ${controls(passport, state.vehicle, state.place)}
        </header>
        <p class="pp-where small" data-computed="selection from data/passport.json">Shown for <strong data-pp-vehicle>${vehicle.label}</strong>, <strong data-pp-place>${place.label}</strong>.</p>
        <div class="pp-stage">
          ${air(assessed, ctx)}
          <div class="pp-fig pp-fig--bay">${figureHost('stowage-bay', 'Interactive drawing of a habitat bay with five places', '584 / 440')}</div>
          <div class="pp-fig pp-fig--item">${figureHost('instrument', 'Interactive exploded drawing of the item and its five components', '8 / 7')}</div>
        </div>
        ${placeNote(placeResult, place, ctx)}
        ${summary(assessed.summary)}
        ${sharedBlock(assessed.shared, ctx)}
        <ul class="pp-rows" aria-label="Components of the item">
          ${passport.components.map((component) => componentRow(component, resultOf.get(component.id), assessed, ctx))}
        </ul>
        <template data-pp-chips>${['applies', 'differs', 'none'].map((status) => html`<div data-status="${status}">${chip(status)}<p class="pp-row__lead small">${CHIPS[status].lead}</p></div>`)}</template>
      </div>
    </div>`;
}
