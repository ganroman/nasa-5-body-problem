// Facts backed by evidence. Every element with data-evidence="id1 id2" is marked as a fact (class "fact", plain text).
// Only its small footnote marker (sup.fn) is visible. Hover, focus or tap on the marker shows a tooltip with the verbatim quote, the source and a link to the
// original web page; <ol data-evidence-list> gets the source list. The generated pages already carry plain
// footnote numbers (sup.fn) and the same source list, so they read without JavaScript.

const EVIDENCE_URL = new URL("../../data/evidence.json", import.meta.url);

function h(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((child) => child !== undefined && child !== ""));
  return node;
}

async function loadEvidence() {
  try {
    const response = await fetch(EVIDENCE_URL);
    if (!response.ok) return null;
    const records = await response.json();
    return Array.isArray(records) ? new Map(records.map((record) => [record.id, record])) : null;
  } catch {
    return null;
  }
}

function row(label, value) {
  return value ? [h("dt", {}, label), h("dd", {}, value)] : [];
}

function link(href, text) {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer" }, text);
}

function sourceItem(number, record) {
  const item = h(
    "li",
    { id: `src-${number}` },
    h("span", { className: "src-title" }, record.source_title),
    h("span", { className: "src-meta" }, `${record.source_org}, ${record.source_year}. ${record.locator ?? ""} `),
    link(record.landing_url, "Source page"),
  );
  if (record.doc_url) item.append(" · ", link(record.doc_url, "Document"));
  return item;
}

const tip = {
  node: null,
  owner: null,
  timer: 0,
  records: null,
  numbers: null,
};

function tipBody(element) {
  const ids = element.dataset.evidence.split(/\s+/).filter((id) => tip.records.has(id));
  return ids.map((id) => {
    const record = tip.records.get(id);
    const where = [`${record.source_org}, ${record.source_year}`, record.locator].filter(Boolean).join(" · ");
    const links = h("p", { className: "fact-tip__links" }, link(record.landing_url, "Open the source"));
    if (record.doc_url) links.append(" · ", link(record.doc_url, "Document"));
    return h(
      "div",
      { className: "fact-tip__item" },
      h("blockquote", {}, record.quote),
      h("p", { className: "fact-tip__src" }, `${tip.numbers.has(id) ? `${tip.numbers.get(id)}. ` : ""}${record.source_title}`),
      h("p", { className: "fact-tip__where" }, where),
      links,
    );
  });
}

function placeTip(element, point) {
  const node = tip.node;
  const rects = [...element.getClientRects()];
  const rect = (point && rects.find((r) => point.y >= r.top - 4 && point.y <= r.bottom + 4)) || rects[0] || element.getBoundingClientRect();
  const margin = 8;
  const gap = 6;
  node.style.left = "0px";
  node.style.top = "0px";
  node.style.bottom = "auto";
  node.style.maxHeight = "";
  const { width, height } = node.getBoundingClientRect();
  const left = Math.min(Math.max(margin, (point ? point.x : rect.left) - 24), Math.max(margin, innerWidth - width - margin));
  const roomBelow = innerHeight - rect.bottom - gap - margin;
  const roomAbove = rect.top - gap - margin;
  node.style.left = `${left}px`;
  if (height <= roomBelow) {
    node.style.top = `${rect.bottom + gap}px`;
  } else if (height <= roomAbove) {
    node.style.top = `${rect.top - gap - height}px`;
  } else if (innerWidth <= 759) {
    // a phone, and neither side has room: a sheet at the bottom of the screen, as tall as it needs up to 60% of the screen
    node.style.left = `${margin}px`;
    node.style.top = "auto";
    node.style.bottom = `${margin}px`;
    node.style.maxHeight = `${Math.round(innerHeight * 0.6)}px`;
  } else {
    // a wide screen: the larger side, with the tooltip scrolling inside it
    const below = roomBelow >= roomAbove;
    const room = Math.max(roomBelow, roomAbove);
    node.style.maxHeight = `${Math.max(room, 80)}px`;
    node.style.top = below ? `${rect.bottom + gap}px` : `${Math.max(margin, rect.top - gap - Math.min(height, room))}px`;
  }
  // last guard: whatever side was chosen, the box ends up inside the screen (the marker itself may be at the edge of it)
  if (node.style.bottom === "auto") {
    const box = node.getBoundingClientRect();
    if (box.height > innerHeight - 2 * margin) node.style.maxHeight = `${innerHeight - 2 * margin}px`;
    const fitted = node.getBoundingClientRect();
    const top = Math.min(Math.max(margin, fitted.top), innerHeight - fitted.height - margin);
    node.style.top = `${Math.max(margin, top)}px`;
  }
}

function showTip(element, point) {
  if (!tip.records) return;
  clearTimeout(tip.timer);
  if (!tip.node) {
    tip.node = h("div", { className: "fact-tip", role: "tooltip", id: "fact-tip" });
    tip.node.hidden = true;
    tip.node.addEventListener("pointerenter", () => clearTimeout(tip.timer));
    tip.node.addEventListener("pointerleave", () => hideTip(250));
    document.body.append(tip.node);
  }
  if (tip.owner !== element) {
    tip.node.replaceChildren(...tipBody(element));
    tip.owner?.removeAttribute("aria-describedby");
    element.setAttribute("aria-describedby", "fact-tip");
    tip.owner = element;
  }
  tip.node.hidden = false;
  placeTip(element, point);
}

function hideTip(delay = 0) {
  clearTimeout(tip.timer);
  tip.timer = setTimeout(() => {
    if (!tip.node) return;
    tip.node.hidden = true;
    tip.owner?.removeAttribute("aria-describedby");
    tip.owner = null;
  }, delay);
}

function wireTips() {
  const fact = (event) => event.target.closest?.("sup.fn")?.closest(".fact");
  const point = (event) => ({ x: event.clientX, y: event.clientY });
  document.addEventListener("pointerover", (event) => {
    const el = fact(event);
    if (el && event.pointerType === "mouse") showTip(el, point(event));
  });
  document.addEventListener("pointerout", (event) => {
    const el = fact(event);
    if (el && event.pointerType === "mouse" && !event.target.closest("sup.fn").contains(event.relatedTarget)) hideTip(250);
  });
  document.addEventListener("click", (event) => {
    const el = fact(event);
    if (!el) {
      if (!event.target.closest?.(".fact-tip")) hideTip();
      return;
    }
    event.preventDefault();
    if (tip.owner === el && tip.node && !tip.node.hidden && event.pointerType !== "mouse" && event.detail !== 0) hideTip();
    else showTip(el, point(event));
  });
  document.addEventListener("focusin", (event) => {
    const el = fact(event);
    if (el?.querySelector("sup.fn a:focus-visible")) showTip(el, null);
  });
  document.addEventListener("focusout", (event) => {
    if (fact(event)) hideTip(150);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTip();
  });
  addEventListener("scroll", () => hideTip(), { passive: true });
  addEventListener("resize", () => hideTip());
}

function markMissing(element, id) {
  element.append(" ", h("span", { className: "cite cite--pending", title: "data/evidence.json" }, `[source missing: ${id}]`));
}

const ready = loadEvidence().then((records) => {
  const state = { records, numbers: new Map(), list: document.querySelector("[data-evidence-list]") };
  tip.records = records;
  tip.numbers = state.numbers;
  if (records) wireTips();
  return state;
});

function decorate({ records, numbers, list }, element) {
  for (const id of element.dataset.evidence.split(/\s+/).filter(Boolean)) {
    const record = records.get(id);
    if (!record) {
      markMissing(element, id);
      continue;
    }
    if (!numbers.has(id)) {
      numbers.set(id, numbers.size + 1);
      list?.append(sourceItem(numbers.get(id), record));
    }
  }
  element.classList.add("fact");
  if (!element.querySelector(":scope > sup.fn")) {
    const ids = element.dataset.evidence.split(/\s+/).filter((id) => numbers.has(id));
    element.append(...ids.map((id) => h("sup", { className: "fn" }, h("a", { href: `#src-${numbers.get(id)}` }, String(numbers.get(id))))));
  }
}

/** One paragraph per known evidence id: the claim sentence of the record, with its citation marker. */
export async function claimParagraphs(ids) {
  const state = await ready;
  if (!state.records) return [];
  return ids.filter((id) => state.records.has(id)).map((id) => {
    const paragraph = h("p", { textContent: state.records.get(id).claim });
    paragraph.dataset.evidence = id;
    decorate(state, paragraph);
    return paragraph;
  });
}

/** Cites `ids` on an element that was built after load: sets data-evidence and appends one marker per id. */
export async function cite(element, ids) {
  const state = await ready;
  if (!state.records) return;
  element.dataset.evidence = ids.join(" ");
  decorate(state, element);
}

async function init() {
  const state = await ready;
  if (!state.records) return;
  state.list?.replaceChildren();
  document.querySelectorAll("[data-evidence]").forEach((element) => decorate(state, element));
}

init();
