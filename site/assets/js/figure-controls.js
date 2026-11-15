// Plain buttons that set the state of the <figure-host> beside them. Each button carries the state it sets
// as JSON in data-figure-state. The figure reports every change as "figure:change" with the evidence ids
// behind what it now shows; the caption renders the claim sentences of those records, each with its citation.
// The controls are hidden in the markup and shown here, so they never appear without JavaScript.

import { claimParagraphs } from "./evidence.js";

const CLAIMS_SHOWN = 3;

const matches = (patch, state) => Object.entries(patch).every(([key, value]) => state[key] === value);

for (const controls of document.querySelectorAll("[data-figure-controls]")) {
  const scope = controls.parentElement;
  const host = scope.querySelector("figure-host");
  const caption = scope.querySelector("[data-figure-caption]");
  const buttons = [...controls.querySelectorAll("[data-figure-state]")];
  let latest = 0;

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-figure-state]");
    if (button) host.state = { ...host.state, ...JSON.parse(button.dataset.figureState) };
  });

  host.addEventListener("figure:change", async ({ detail }) => {
    const turn = ++latest;
    for (const button of buttons) button.setAttribute("aria-pressed", String(matches(JSON.parse(button.dataset.figureState), detail.state)));
    const paragraphs = await claimParagraphs(detail.evidence.slice(-CLAIMS_SHOWN));
    if (turn === latest) caption.replaceChildren(...paragraphs);
  });

  controls.hidden = false;
}
