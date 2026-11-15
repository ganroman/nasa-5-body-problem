// Runtime of the instrument figure. build.mjs fills in the drawing numbers where DATA is declared.
const DATA = {"idle":"illustrative item · 5 components","stage":-116.45092051037585,"components":[{"id":"enclosure","name":"Enclosure","material":"PMMA cast sheet","mass_share":0.4},{"id":"battery","name":"Battery pack","material":"Lithium-ion cells","mass_share":0.3},{"id":"gasket","name":"Gaskets","material":"Silicone rubber, ~1.5 mm","mass_share":0.1},{"id":"wiring","name":"Wiring","material":"PTFE-insulated wire","mass_share":0.1},{"id":"strap","name":"Carry strap","material":"Kevlar/PBI webbing, black","mass_share":0.1}],"pieces":[{"id":"strap-pins","delay":2,"shift":[0,-109.6]},{"id":"tray","delay":5,"shift":[0,0]},{"id":"strap","delay":2,"shift":[0,-109.6]},{"id":"battery","delay":3,"shift":[0,-59.37]},{"id":"tray-front","delay":5,"shift":[0,0]},{"id":"gasket","delay":2,"shift":[0,-118.73]},{"id":"wiring","delay":1,"shift":[0,-173.53]},{"id":"top","delay":0,"shift":[0,-232.9]},{"id":"wiring-head","delay":1,"shift":[0,-173.53]}]};

const CALM = "(prefers-reduced-motion: reduce)";
const TOUR = { start: 1.4, closed: 2.6, step: 2.4 };

export function mount(host) {
  const root = host.matches("[data-figure='instrument']") ? host : host.querySelector("[data-figure='instrument']");
  const svg = root.querySelector("svg");
  const readout = root.querySelector("[data-readout]");
  const still = matchMedia(CALM);
  const byId = new Map(DATA.components.map((item) => [item.id, item]));
  const stage = svg.querySelector("[data-stage]");
  const nodes = [...svg.querySelectorAll("[data-piece]")];
  const pieces = nodes.map((node) => {
    const spec = DATA.pieces.find((item) => item.id === node.dataset.piece);
    return { ...spec, node, share: 0, speed: 0, goal: 0, due: 0 };
  });
  const solids = new Map(DATA.components.map((item) => [item.id, [...svg.querySelectorAll(`[data-component="${item.id}"] .iso-solid`)]]));
  const tags = new Map(DATA.components.map((item) => [item.id, svg.querySelector(`[data-tag="${item.id}"]`)]));

  const model = { apart: false, lit: null, picked: null, active: null, touring: !still.matches };
  let frame = 0;
  let last = 0;
  let clock = 0;
  let visible = false;
  let alive = true;

  const label = (item) => `${item.name} · ${item.material} · ${Math.round(item.mass_share * 100)} % of mass`;
  const say = () => {
    const shown = byId.get(model.picked ?? model.active ?? model.lit);
    const text = shown ? label(shown) : DATA.idle;
    if (readout.textContent !== text) readout.textContent = text;
  };

  const place = (piece) => {
    const [dx, dy] = piece.shift;
    piece.node.setAttribute("transform", piece.share === 0 ? "" : `translate(${(dx * piece.share).toFixed(2)} ${(dy * piece.share).toFixed(2)})`);
  };

  // The closed instrument sits mid-card; opening it lowers the whole drawing to keep the stack framed.
  const frameStage = () => {
    const open = pieces.reduce((sum, piece) => sum + piece.share, 0) / pieces.length;
    stage.setAttribute("transform", `translate(0 ${(DATA.stage * (1 - open)).toFixed(2)})`);
  };

  const aim = (apart) => {
    if (model.apart === apart) return;
    model.apart = apart;
    const order = [...pieces].sort((a, b) => (apart ? a.delay - b.delay : b.delay - a.delay));
    order.forEach((piece, index) => {
      piece.goal = apart ? 1 : 0;
      piece.due = clock + (still.matches ? 0 : index * 0.06);
    });
    run();
  };

  const light = (id) => {
    if (model.lit === id) return;
    for (const [component, list] of solids) for (const solid of list) solid.toggleAttribute("data-lit", component === id);
    for (const piece of pieces) piece.node.toggleAttribute("data-lit", piece.component === id);
    model.lit = id;
    model.picked = null;
    mark();
  };

  const FLAGS = ["applies", "differs", "none"];
  const flag = (id, value) => {
    const tag = tags.get(id);
    if (tag && FLAGS.includes(value)) tag.dataset.flag = value;
  };

  const mark = () => {
    for (const piece of pieces) piece.node.toggleAttribute("data-picked", piece.component === (model.picked ?? model.active));
    say();
  };

  const pick = (id) => {
    stopTour();
    model.picked = id;
    mark();
    root.dispatchEvent(new CustomEvent("figure:select", { bubbles: true, detail: { id } }));
  };

  const stopTour = () => {
    model.touring = false;
    if (model.active !== null) {
      model.active = null;
      mark();
    }
  };

  const tourAt = (time) => {
    const open = DATA.components.length * TOUR.step + 1.2;
    const cycle = TOUR.closed + open + 1.4;
    const t = time % cycle;
    if (t < TOUR.closed || t >= TOUR.closed + open) return { apart: false, active: null };
    const index = Math.floor((t - TOUR.closed - 1.0) / TOUR.step);
    return { apart: true, active: index >= 0 && index < DATA.components.length ? DATA.components[index].id : null };
  };

  const tick = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    clock += dt;
    if (model.touring) {
      const plan = tourAt(clock - TOUR.start < 0 ? 0 : clock - TOUR.start);
      aim(plan.apart);
      if (plan.active !== model.active) {
        model.active = plan.active;
        mark();
      }
    }
    let moving = false;
    for (const piece of pieces) {
      if (clock < piece.due) {
        moving = true;
        continue;
      }
      if (still.matches) {
        piece.share = piece.goal;
        piece.speed = 0;
      } else {
        for (let step = 0; step < 4; step++) {
          piece.speed += ((piece.goal - piece.share) * 64 - piece.speed * 14.2) * (dt / 4);
          piece.share += piece.speed * (dt / 4);
        }
        if (Math.abs(piece.goal - piece.share) < 5e-4 && Math.abs(piece.speed) < 5e-4) {
          piece.share = piece.goal;
          piece.speed = 0;
        }
      }
      if (piece.share !== piece.goal || piece.speed !== 0) moving = true;
      place(piece);
    }
    frameStage();
    frame = alive && visible && (moving || model.touring) ? requestAnimationFrame(tick) : 0;
  };

  const run = () => {
    if (!frame && visible && alive) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  }, { rootMargin: "120px 0px" });
  observer.observe(root);

  const componentOf = (event) => event.target.closest?.("[data-component]")?.dataset.component;
  const onPointer = (event) => {
    const id = componentOf(event);
    if (id) pick(id);
  };
  const onKey = (event) => {
    const node = event.target.closest?.("[data-piece][tabindex]");
    if (!node) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(node.dataset.component);
    }
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step) {
      event.preventDefault();
      stopTour();
      const stops = [...svg.querySelectorAll("[data-piece][tabindex]")];
      stops[(stops.indexOf(node) + step + stops.length) % stops.length].focus();
    }
  };
  svg.addEventListener("click", onPointer);
  svg.addEventListener("keydown", onKey);
  svg.addEventListener("pointerdown", stopTour);
  svg.addEventListener("focusin", stopTour);

  say();
  frameStage();
  run();

  return {
    set(state = {}) {
      if (state.apart !== undefined) {
        model.touring = false;
        aim(Boolean(state.apart));
      }
      if (state.lit !== undefined) light(state.lit);
      if (state.flags) for (const [id, value] of Object.entries(state.flags)) flag(id, value);
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      svg.removeEventListener("click", onPointer);
      svg.removeEventListener("keydown", onKey);
      svg.removeEventListener("pointerdown", stopTour);
      svg.removeEventListener("focusin", stopTour);
    },
  };
}
