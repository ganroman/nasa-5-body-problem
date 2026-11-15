const { CAM, PLACES, PARKED, DIAL, GAUGES, DOOR } = CONFIG;

const CLEARANCE = 22; // height above its shelf at which the instrument leaves a place's painter's order
const FRONT_REACH = 5.5; // locker: how far the instrument's centre may be past its spot while it still sits inside
const CRUISE = 44; // cruise height above the higher of the two places
const DWELL = 3; // seconds the idle tour rests at each place
const TAU = { needle: 0.35, door: 0.3 };

const places = new Map(PLACES.map((place) => [place.id, place]));
const parked = { spot: PARKED.spot };
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const smoother = (t) => t * t * t * (t * (6 * t - 15) + 10);
const wrap = (angle) => ((((angle + 180) % 360) + 360) % 360) - 180;
const number = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const project = (x, y, z) => [
  CAM.ox + (x * CAM.sinA - y * CAM.cosA) * CAM.k,
  CAM.oy + ((x * CAM.cosA + y * CAM.sinA) * CAM.sinE - z * CAM.cosE) * CAM.k,
];
const shift = ([x, y, z]) => {
  const [px, py] = project(x, y, z);
  const [ox, oy] = project(0, 0, 0);
  return `translate(${(px - ox).toFixed(2)} ${(py - oy).toFixed(2)})`;
};

function exitPoints(place, ceiling) {
  const [x, y, z] = place.spot;
  return place.out === "front" ? [[x, y, z], [x, place.front, z], [x, place.front, ceiling]] : [[x, y, z], [x, y, ceiling]];
}

// Straight legs with their corners rounded, so the instrument lifts, glides and sets down in one motion.
function rounded(points, radius) {
  const legs = points.filter((point, i) => !i || gap(point, points[i - 1]) > 0.01);
  const out = [legs[0]];
  for (let i = 1; i < legs.length - 1; i++) {
    const [a, b, c] = [legs[i - 1], legs[i], legs[i + 1]];
    const r = Math.min(radius, gap(a, b) / 2, gap(b, c) / 2);
    const along = (to) => b.map((value, axis) => value + ((to[axis] - value) * r) / gap(b, to));
    const [p, q] = [along(a), along(c)];
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      out.push(b.map((_, axis) => (1 - t) ** 2 * p[axis] + 2 * (1 - t) * t * b[axis] + t * t * q[axis]));
    }
  }
  out.push(legs[legs.length - 1]);
  return out;
}

function flightFrom(pos, fromId, toId) {
  const fromPlace = fromId ? places.get(fromId) : null;
  const toPlace = toId ? places.get(toId) : parked;
  const startZ = fromPlace ? fromPlace.spot[2] : pos[2];
  const ceiling = Math.max(startZ, toPlace.spot[2]) + CRUISE;
  const leave = fromPlace ? exitPoints(fromPlace, ceiling) : [pos, [pos[0], pos[1], Math.max(pos[2], ceiling)]];
  const points = rounded([...leave, ...exitPoints(toPlace, ceiling).reverse()], 14);
  const reach = [0];
  points.forEach((point, i) => i && reach.push(reach[i - 1] + gap(point, points[i - 1])));
  const total = reach[reach.length - 1];
  return { points, reach, total, duration: clamp(1.5 + total / 190, 2, 4.4), t: 0, fromId, toId, base: Math.min(startZ, toPlace.spot[2]) };
}

function along(flight, distance) {
  const { points, reach } = flight;
  let i = 1;
  while (i < reach.length - 1 && reach[i] < distance) i++;
  const span = reach[i] - reach[i - 1] || 1;
  const t = clamp((distance - reach[i - 1]) / span, 0, 1);
  return points[i].map((value, axis) => points[i - 1][axis] + (value - points[i - 1][axis]) * t);
}

function within(place, pos) {
  const [x, y, z] = place.spot;
  if (Math.abs(pos[0] - x) > 2.5) return false;
  if (place.out === "front") return pos[1] <= y + FRONT_REACH;
  return Math.abs(pos[1] - y) <= 2.5 && pos[2] - z < CLEARANCE;
}

export function mount(root) {
  const q = (selector) => root.querySelector(selector);
  const instrument = q(".instrument");
  const air = q(".air");
  const shadow = q(".shadow");
  const door = q("[data-door]");
  const readout = q("[data-readout]");
  const power = q('[data-art="power"]');
  const outputs = Object.fromEntries(["label", "o2", "pressure", "place"].map((name) => [name, q(`[data-out="${name}"]`)]));
  const slots = new Map(PLACES.map(({ id }) => [id, q(`[data-slot="${id}"]`)]));
  const zones = new Map(PLACES.map(({ id }) => [id, q(`[data-zone="${id}"]`)]));
  const beacons = new Map(PLACES.map(({ id }) => [id, q(`[data-beacon="${id}"]`)]));
  const buttons = new Map(PLACES.map(({ id }) => [id, q(`[data-place="${id}"]`)]));
  const needles = Object.values(GAUGES).map((gauge) => ({ gauge, el: q(`[data-needle="${gauge.id}"]`), angle: DIAL.parked, goal: DIAL.parked }));
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  let env = { label: null, o2: null, pressure: null };
  let flags = {};
  let pos = [...PARKED.spot];
  let rest = null;
  let flight = null;
  let target = null;
  let layer = null;
  let doorOpen = 0;
  let touring = !still.matches;
  let dwell = DWELL - 1.5;
  let tourAt = -1;
  let visible = true;
  let frameId = 0;
  let last = 0;
  let applied = "";

  function aim(id) {
    target = id;
    if (id === (flight ? flight.toId : rest)) return;
    if (still.matches) {
      pos = [...(id ? places.get(id) : parked).spot];
      rest = id;
      flight = null;
      return;
    }
    flight = flightFrom(pos, flight ? null : rest, id);
  }

  const slotOf = () => [flight ? flight.fromId : rest, flight?.toId].find((id) => id && within(places.get(id), pos)) ?? null;
  const doorWanted = () => (target === "locker" || (flight ? flight.fromId === "locker" && pos[1] < 50 : rest === "locker") ? 1 : 0);

  function step(dt) {
    if (flight) {
      flight.t = Math.min(1, flight.t + dt / flight.duration);
      pos = along(flight, smoother(flight.t) * flight.total);
      if (flight.t === 1) {
        rest = flight.toId;
        flight = null;
      }
    } else if (touring && !still.matches) {
      dwell += dt;
      if (dwell >= DWELL) {
        dwell = 0;
        tourAt = (tourAt + 1) % PLACES.length;
        aim(PLACES[tourAt].id);
      }
    }
    const ease = (tau) => (still.matches ? 1 : 1 - Math.exp(-dt / tau));
    doorOpen += (doorWanted() - doorOpen) * ease(TAU.door);
    for (const needle of needles) {
      needle.angle = wrap(needle.angle + wrap(needle.goal - needle.angle) * ease(TAU.needle));
      if (Math.abs(wrap(needle.goal - needle.angle)) < 0.05) needle.angle = needle.goal;
    }
    if (Math.abs(doorWanted() - doorOpen) < 0.002) doorOpen = doorWanted();
  }

  const settled = () => !flight && !touring && doorOpen === doorWanted() && needles.every((needle) => needle.angle === needle.goal);

  // Everything that changes only with the state, not with every animation frame.
  function syncState() {
    const key = JSON.stringify([target, rest, Boolean(flight), flags, env]);
    if (key === applied) return;
    applied = key;
    for (const [id, zone] of zones) zone.toggleAttribute("data-active", id === target);
    for (const [id, node] of beacons) node.dataset.flag = flags[id] === "flag" ? "flag" : "none";
    for (const [id, button] of buttons) button.setAttribute("aria-pressed", String(id === target));
    power.toggleAttribute("data-charging", rest === "power" && !flight);
    outputs.label.textContent = env.label ?? "not set";
    outputs.o2.textContent = env.o2 === null ? "unknown" : `${env.o2.toFixed(1)} %`;
    outputs.pressure.textContent = env.pressure === null ? "unknown" : `${env.pressure.toFixed(1)} kPa`;
    outputs.place.textContent = target ? places.get(target).label : "nowhere yet";
  }

  function render() {
    instrument.setAttribute("transform", shift(pos));
    const slot = slotOf();
    if (slot !== layer) {
      (slot ? slots.get(slot) : air).append(instrument);
      layer = slot;
    }
    const lift = flight ? smoother(clamp((pos[2] - flight.base) / 18, 0, 1)) : 0;
    shadow.setAttribute("transform", shift([pos[0], pos[1], 0]));
    shadow.style.opacity = lift.toFixed(2);
    door.setAttribute("transform", shift([DOOR.slide * doorOpen, 0, 0]));
    for (const { el, angle } of needles) el.setAttribute("transform", `rotate(${angle.toFixed(2)})`);
    syncState();
  }

  function frame(now) {
    frameId = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    step(dt);
    render();
    if (visible && !settled()) frameId = requestAnimationFrame(frame);
  }

  function wake() {
    if (still.matches) {
      step(1);
      step(1);
    }
    render();
    if (visible && !frameId && !settled()) {
      last = 0;
      frameId = requestAnimationFrame(frame);
    }
  }

  function aimNeedles() {
    needles[0].goal = env.o2 === null ? DIAL.parked : gaugeAngle(env.o2, GAUGES.o2.max);
    needles[1].goal = env.pressure === null ? DIAL.parked : gaugeAngle(env.pressure, GAUGES.pressure.max);
  }

  const interact = () => {
    touring = false;
    readout.setAttribute("aria-live", "polite");
  };

  function pick(id) {
    interact();
    aim(id);
    wake();
    root.dispatchEvent(new CustomEvent("figure:select", { bubbles: true, detail: { id } }));
  }

  const placeOf = (event) => event.target.closest?.("[data-place]")?.dataset.place;
  const heat = (id, on) => id && zones.get(id).toggleAttribute("data-hot", on);
  const listeners = {
    click: (event) => placeOf(event) && pick(placeOf(event)),
    keydown: (event) => {
      if ((event.key === "Enter" || event.key === " ") && placeOf(event)) {
        event.preventDefault();
        pick(placeOf(event));
      }
    },
    pointerdown: interact,
    focusin: (event) => {
      interact();
      heat(placeOf(event), true);
    },
    focusout: (event) => heat(placeOf(event), false),
    pointerover: (event) => heat(placeOf(event), true),
    pointerout: (event) => heat(placeOf(event), false),
  };
  for (const [name, handler] of Object.entries(listeners)) root.addEventListener(name, handler);

  const observer = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) wake();
  }, { rootMargin: "120px 0px" });
  observer.observe(root);
  const onMotion = () => {
    if (still.matches) touring = false;
    wake();
  };
  still.addEventListener("change", onMotion);

  aimNeedles();
  render();
  wake();

  return {
    set(next = {}) {
      if ("env" in next) {
        env = { label: next.env?.label ?? null, o2: number(next.env?.o2_percent), pressure: number(next.env?.pressure_kpa) };
        aimNeedles();
      }
      if ("flags" in next) flags = { ...next.flags };
      if (places.has(next.place)) {
        interact();
        aim(next.place);
      } else if ("place" in next && !touring) aim(null);
      wake();
    },
    destroy() {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      still.removeEventListener("change", onMotion);
      for (const [name, handler] of Object.entries(listeners)) root.removeEventListener(name, handler);
    },
  };
}
