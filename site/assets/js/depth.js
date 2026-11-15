// Parallax and drift engine. Markup carries all the intent:
//   data-depth="d"  distance from the reader. 1 is the content plane, below 1 is far, above 1 is near.
//   data-at="p"     fixed layers only: the scroll progress (0..1) at which the layer sits at its CSS position.
//   data-loop="px"  fixed layers only: wrap the scroll travel at this period, for a layer tiled at the same size.
//   data-z="px"     translateZ inside the scene's perspective.
//   data-drift="px" free float with its own phase, amplitude in px, a little rotation.
//   data-turn="deg" rotation over the whole page scroll.
// Elements inside [data-cosmos] are fixed layers; all others move relative to their place in the page.
// Everything animates transform only, from one requestAnimationFrame loop.

const POINTER_SHIFT = { x: 12, y: 9 };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (el, name, fallback) => (el.dataset[name] === undefined ? fallback : parseFloat(el.dataset[name]));
const follow = (rate, frames) => 1 - Math.pow(1 - rate, frames);

const pointer = { target: { x: 0, y: 0 }, x: 0, y: 0 };
let items = [];
let visibleObserver = null;
const byElement = new Map();
let frameId = 0;
let lastTime = 0;
let lastLight = "";

function createItem(el, index) {
  const depth = num(el, "depth", 1);
  return {
    el,
    depth,
    at: num(el, "at", 0),
    z: num(el, "z", 0),
    loop: num(el, "loop", 0),
    turn: num(el, "turn", 0),
    drift: num(el, "drift", 0),
    fixed: Boolean(el.closest("[data-cosmos]")),
    rate: clamp(0.04 + 0.05 * Math.abs(depth), 0.04, 0.14),
    phase: index * 2.399,
    speed: 0.18 + ((index * 7) % 5) * 0.03,
    visible: true,
    center: 0,
    offset: 0,
    scroll: window.scrollY,
    px: 0,
    py: 0,
    progress: 0,
    written: "",
  };
}

function measure() {
  for (const item of items) {
    if (item.fixed) continue;
    const rect = item.el.getBoundingClientRect();
    item.center = rect.top + window.scrollY + rect.height / 2 - item.offset;
  }
}

function collect() {
  items = [...document.querySelectorAll("[data-depth], [data-drift], [data-turn]")].map(createItem);
  items.forEach((item) => byElement.set(item.el, item));
  visibleObserver?.disconnect();
  visibleObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) byElement.get(entry.target).visible = entry.isIntersecting;
    },
    { rootMargin: "25% 0px" },
  );
  for (const item of items) if (!item.fixed) visibleObserver.observe(item.el);
  measure();
}

function place(item, seconds, scrollY, maxScroll, viewport, frames) {
  const rate = follow(item.rate, frames);
  item.scroll += (scrollY - item.scroll) * rate;
  item.px += (pointer.target.x - item.px) * rate;
  item.py += (pointer.target.y - item.py) * rate;
  item.progress += (scrollY / maxScroll - item.progress) * follow(0.05, frames);

  const focal = item.depth - 1;
  let y = item.fixed
    ? -(item.scroll - item.at * maxScroll) * item.depth
    : (item.scroll - (item.center - viewport / 2)) * (1 - item.depth);
  if (item.loop) y = (((y % item.loop) + item.loop) % item.loop) - item.loop;
  let x = -item.px * focal * POINTER_SHIFT.x;
  y -= item.py * focal * POINTER_SHIFT.y;

  let rotation = item.turn * item.progress;
  if (item.drift) {
    const w = seconds * item.speed + item.phase;
    x += item.drift * Math.sin(w);
    y += item.drift * Math.cos(w * 0.77 + item.phase);
    rotation += item.drift * 0.04 * Math.sin(w * 0.6 + 1);
  }
  item.offset = y;

  const value = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${item.z}px) rotate(${rotation.toFixed(3)}deg)`;
  if (value !== item.written) {
    item.el.style.transform = value;
    item.written = value;
  }
}

function frame(now) {
  frameId = requestAnimationFrame(frame);
  const frames = Math.min(now - lastTime, 64) / 16.67;
  lastTime = now;

  const viewport = window.innerHeight;
  const maxScroll = Math.max(1, root.scrollHeight - viewport);
  const scrollY = window.scrollY;

  const ease = follow(0.06, frames);
  pointer.x += (pointer.target.x - pointer.x) * ease;
  pointer.y += (pointer.target.y - pointer.y) * ease;
  const light = `${pointer.x.toFixed(3)} ${pointer.y.toFixed(3)}`;
  if (light !== lastLight) {
    root.style.setProperty("--lx", pointer.x.toFixed(3));
    root.style.setProperty("--ly", pointer.y.toFixed(3));
    lastLight = light;
  }

  for (const item of items) {
    if (item.visible) place(item, now / 1000, scrollY, maxScroll, viewport, frames);
  }
}

function start() {
  if (frameId || document.hidden || reduceMotion.matches) return;
  root.classList.add("depth-live");
  lastTime = performance.now();
  frameId = requestAnimationFrame(frame);
}

function stop() {
  cancelAnimationFrame(frameId);
  frameId = 0;
}

function rest() {
  stop();
  root.classList.remove("depth-live");
  for (const item of items) {
    item.el.style.transform = "";
    item.written = "";
  }
  root.style.removeProperty("--lx");
  root.style.removeProperty("--ly");
  lastLight = "";
}

function onPointerMove(event) {
  if (event.pointerType === "touch") return;
  pointer.target.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.target.y = (event.clientY / window.innerHeight) * 2 - 1;
}

function init() {
  collect();
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("mouseleave", () => { pointer.target.x = pointer.target.y = 0; });
  window.addEventListener("resize", measure);
  new ResizeObserver(measure).observe(document.body);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener("change", () => (reduceMotion.matches ? rest() : start()));
  start();
}

init();
