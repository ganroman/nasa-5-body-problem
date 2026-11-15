// Runtime of the flame duct figure. build.mjs puts MODEL, CONFIG and the pure functions of model.mjs and dynamic.mjs above this file.
const CALM = "(prefers-reduced-motion: reduce)";
const LIGHT_S = 1.1;
const FOLLOW = { air: 0.55, o2: 0.5, lever: 0.1, knob: 0.14, size: 0.45, rps: 0.9 };
const follow = (value, goal, dt, seconds) => goal + (value - goal) * Math.exp(-dt / seconds);
const lerp = (a, b, t) => a + (b - a) * t;

function projectionOf({ sinA, cosA, sinE, cosE, k, ox, oy }) {
  const forward = ([x, y, z]) => [ox + (x * sinA - y * cosA) * k, oy + ((x * cosA + y * sinA) * sinE - z * cosE) * k];
  const onPlane = (sx, sy, z) => {
    const u = (sx - ox) / k;
    const v = (sy - oy) / k + z * cosE;
    return [u * sinA + (v / sinE) * cosA, -u * cosA + (v / sinE) * sinA];
  };
  return { forward, onPlane };
}

export function mount(host) {
  const root = host.matches("[data-figure='flame-duct']") ? host : host.querySelector("[data-figure='flame-duct']");
  const svg = root.querySelector("svg");
  const part = (name) => svg.querySelector(`[data-part="${name}"]`);
  const control = (name) => svg.querySelector(`[data-control="${name}"]`);
  const cam = projectionOf(CONFIG.CAM);
  const still = matchMedia(CALM);
  const range = MODEL.bench.flow_range_cm_s;
  const dwell = MODEL.weightless.quench_dwell_s.value;
  const cutOut = MODEL.weightless.fan_cut_out_s;

  const el = {
    blades: part("blades"),
    air: part("needle-air"),
    o2: part("needle-o2"),
    pointer: part("pointer"),
    flame: part("flame"),
    layers: ["glow", "shell", "inner", "core", "rim"].map((name) => svg.querySelector(`.fd-f-${name}`)),
    igniter: part("igniter"),
    streams: part("streams"),
    leverFan: part("lever-fan"),
    leverGravity: part("lever-gravity"),
    tipFan: part("lever-fan-tip"),
    tipGravity: part("lever-gravity-tip"),
    lamps: Object.fromEntries([...svg.querySelectorAll("[data-lamp]")].map((lamp) => [lamp.dataset.lamp, lamp])),
    knob: control("knob"),
    fan: control("fan"),
    gravity: control("gravity"),
    out: Object.fromEntries([...root.querySelectorAll("[data-out]")].map((node) => [node.dataset.out, node])),
    live: root.querySelector("[data-live]"),
  };

  const { burn_from_cm_s: burnFrom, full_at_cm_s: fullAt } = MODEL.weightless;
  const tourFlow = { full: fullAt, mid: Math.round((burnFrom + fullAt) / 2), quench: burnFrom / 2 };
  let target = normalise(MODEL, { flow_cm_s: fullAt, fan: true, gravity: "0g" });
  const sim = {
    air: airOf(target),
    o2: o2Of(MODEL, target.gravity),
    spin: 0,
    rps: 0.5,
    lean: { fan: 1, gravity: -1 },
    knob: target.flow_cm_s / range.max,
    heat: 0,
    clock: 0,
    kind: "dome",
    mix: 1,
    flame: { phase: "lit", life: 1, size: vigourAt(MODEL, target.flow_cm_s), clock: 0, from: 1, quench: 0, fast: false },
  };
  const view = { text: {}, phase: "lit" };
  const tour = { on: !still.matches, step: -1, wait: CONFIG.TOUR.start_s };
  let frame = 0;
  let last = 0;
  let visible = false;
  let alive = true;
  let dragging = false;
  let liveTimer = 0;

  const emit = (source) => {
    const detail = { state: { ...target }, flame: sim.flame.phase, evidence: evidenceIds(MODEL, target, sim.flame.phase), source };
    root.dispatchEvent(new CustomEvent("figure:change", { bubbles: true, detail }));
  };

  const calmJump = () => {
    if (!still.matches) return;
    const reg = regimeOf(MODEL, target);
    const f = sim.flame;
    sim.air = airOf(target);
    sim.o2 = o2Of(MODEL, target.gravity);
    sim.lean = { fan: target.fan ? 1 : -1, gravity: target.gravity === "1g" ? 1 : -1 };
    sim.knob = target.flow_cm_s / range.max;
    sim.kind = target.gravity === "1g" ? "teardrop" : "dome";
    sim.mix = 1;
    f.size = reg.regime === "quench" ? 0.08 : reg.vigour;
    f.life = reg.regime === "cut" ? 0 : 1;
    f.phase = reg.regime === "cut" ? "out" : reg.regime === "quench" ? "quench" : "lit";
  };

  const setState = (next, source) => {
    const state = normalise(MODEL, { ...target, ...next });
    if (state.flow_cm_s === target.flow_cm_s && state.fan === target.fan && state.gravity === target.gravity) return;
    target = state;
    calmJump();
    describe();
    emit(source);
    wake();
  };

  const stopTour = () => {
    tour.on = false;
  };

  const flameStep = (dt) => {
    const f = sim.flame;
    const reg = regimeOf(MODEL, target);
    const good = reg.regime === "burn" || reg.regime === "earth";
    if (f.phase === "out") {
      if (good) {
        f.phase = "lighting";
        f.clock = 0;
      }
      return;
    }
    if (f.phase === "lighting") {
      f.clock += dt;
      f.life = clamp((f.clock - 0.55) / 0.7, 0, 1);
      f.size = reg.regime === "earth" ? 1 : reg.vigour;
      if (f.clock >= LIGHT_S) {
        f.phase = "lit";
        f.life = 1;
      }
      if (!good) f.phase = "dying";
      return;
    }
    if (f.phase === "dying") {
      f.clock += dt;
      f.life = 1 - smoothstep(clamp(f.clock / (f.fast ? 0.8 : cutOut), 0, 1));
      if (good && f.life > 0.5) {
        f.phase = "lit";
        f.life = 1;
      } else if (f.life <= 0.002) {
        f.life = 0;
        f.phase = "out";
      }
      return;
    }
    if (reg.regime === "cut") {
      f.phase = "dying";
      f.clock = 0;
      f.fast = false;
      return;
    }
    if (reg.regime === "quench") {
      if (f.phase !== "quench") {
        f.phase = "quench";
        f.clock = 0;
        f.from = f.size;
      }
      f.clock += dt;
      f.quench = clamp(f.clock / dwell, 0, 1);
      f.size = lerp(f.from, 0.08, smoothstep(f.quench));
      if (f.clock >= dwell) {
        f.phase = "dying";
        f.clock = 0;
        f.fast = true;
      }
      return;
    }
    f.phase = "lit";
    f.quench = 0;
    f.size = follow(f.size, reg.vigour, dt, FOLLOW.size);
  };

  const step = (dt) => {
    sim.clock += dt;
    const air = airOf(target);
    sim.air = follow(sim.air, air, dt, FOLLOW.air);
    sim.o2 = follow(sim.o2, o2Of(MODEL, target.gravity), dt, FOLLOW.o2);
    sim.lean.fan = follow(sim.lean.fan, target.fan ? 1 : -1, dt, FOLLOW.lever);
    sim.lean.gravity = follow(sim.lean.gravity, target.gravity === "1g" ? 1 : -1, dt, FOLLOW.lever);
    sim.knob = follow(sim.knob, target.flow_cm_s / range.max, dt, FOLLOW.knob);
    sim.rps = follow(sim.rps, target.fan ? 0.4 + 2.4 * (air / range.max) : 0, dt, FOLLOW.rps);
    sim.spin += sim.rps * dt * Math.PI * 2;
    const wanted = target.gravity === "1g" ? "teardrop" : "dome";
    if (sim.kind !== wanted) {
      sim.mix = Math.max(0, sim.mix - dt / 0.3);
      if (sim.mix === 0) sim.kind = wanted;
    } else sim.mix = Math.min(1, sim.mix + dt / 0.4);
    flameStep(dt);
    sim.heat = sim.flame.phase === "lighting" ? 1 : follow(sim.heat, 0, dt, 0.5);
  };

  const wobbleOf = () => {
    if (still.matches) return { wobble: 0, sway: 0 };
    const t = sim.clock * Math.PI * 2;
    const f = sim.flame;
    if (sim.kind === "teardrop") return { wobble: 0.55 * Math.sin(t * 3.1) + 0.3 * Math.sin(t * 5.3 + 0.7), sway: 0.7 * Math.sin(t * 2.1) + 0.3 * Math.sin(t * 3.7 + 1.1) };
    if (f.phase === "quench") return { wobble: (0.15 + 0.85 * f.quench) * Math.sin(t * 4.2), sway: 0 };
    return { wobble: 0.35 * Math.sin(t * 1.1) + 0.15 * Math.sin(t * 2.3 + 1), sway: 0 };
  };

  const write = (name, text) => {
    if (view.text[name] === text) return;
    view.text[name] = text;
    el.out[name].textContent = text;
  };

  const say = () => {
    const f = sim.flame;
    const air = Math.round(sim.air * 10) / 10;
    write("air", `${air >= 10 ? Math.round(sim.air) : air} cm/s`);
    write("fan", target.fan ? "on" : "off");
    write("gravity", target.gravity === "1g" ? "Earth" : "weightless");
    write("flame", flameWords(f.phase, target.gravity, f.size));
    if (view.phase === f.phase) return;
    view.phase = f.phase;
    emit("flame");
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      if (alive) el.live.textContent = `Flame: ${flameWords(f.phase, target.gravity, f.size)}`;
    }, 300);
  };

  const draw = () => {
    const f = sim.flame;
    el.blades.setAttribute("d", bladesPath(cam.forward, CONFIG.DYN.blades, sim.spin));
    el.air.setAttribute("d", needlePath(cam.forward, CONFIG.DYN.gauges.air, clamp(sim.air, range.min, range.max)));
    el.o2.setAttribute("d", needlePath(cam.forward, CONFIG.DYN.gauges.o2, sim.o2));
    el.pointer.setAttribute("d", pointerPath(cam.forward, CONFIG.DYN.knob, sim.knob));
    el.leverFan.setAttribute("d", leverPath(cam.forward, CONFIG.DYN.levers.fan, sim.lean.fan));
    el.leverGravity.setAttribute("d", leverPath(cam.forward, CONFIG.DYN.levers.gravity, sim.lean.gravity));
    for (const [name, tip] of [["fan", el.tipFan], ["gravity", el.tipGravity]]) {
      const [tx, ty] = leverTip(cam.forward, CONFIG.DYN.levers[name], sim.lean[name]);
      tip.setAttribute("cx", tx.toFixed(1));
      tip.setAttribute("cy", ty.toFixed(1));
    }
    for (const [id, lamp] of Object.entries(el.lamps)) lamp.toggleAttribute("data-on", (id === "1g") === (target.gravity === "1g"));
    el.igniter.toggleAttribute("data-hot", sim.heat > 0.25);
    const strength = clamp(sim.air / 8, 0, 1);
    el.streams.style.opacity = (strength * 0.85).toFixed(2);
    el.streams.style.setProperty("--fd-flow-ms", `${Math.round(clamp(14000 / Math.max(sim.air, 1), 450, 9000))}ms`);
    const opacity = f.life * sim.mix;
    el.flame.setAttribute("opacity", opacity.toFixed(3));
    el.flame.dataset.kind = sim.kind;
    if (opacity > 0.004) {
      const shapes = flameShapes(cam.forward, { ...CONFIG.DYN.flame, kind: sim.kind, size: f.size, ...wobbleOf() });
      [shapes.glow, shapes.shell, shapes.inner, shapes.core, shapes.shell].forEach((d, i) => el.layers[i].setAttribute("d", d));
    }
    say();
  };

  const describe = () => {
    el.knob.setAttribute("aria-valuenow", String(Math.round(target.flow_cm_s * 10) / 10));
    el.knob.setAttribute("aria-valuetext", `${Math.round(target.flow_cm_s * 10) / 10} centimetres per second`);
    el.fan.setAttribute("aria-checked", String(target.fan));
    el.gravity.setAttribute("aria-checked", String(target.gravity === "1g"));
  };

  const tourStep = (dt) => {
    if (!tour.on) return;
    tour.wait -= dt;
    if (tour.wait > 0) return;
    tour.step = (tour.step + 1) % CONFIG.TOUR.steps.length;
    const { flow, fan, gravity, hold_s } = CONFIG.TOUR.steps[tour.step];
    tour.wait = hold_s;
    setState({ flow_cm_s: tourFlow[flow], fan, gravity }, "tour");
  };

  const tick = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    tourStep(dt);
    step(dt);
    draw();
    describe();
    frame = visible && alive && !still.matches ? requestAnimationFrame(tick) : 0;
  };

  function wake() {
    if (frame || !alive) return;
    if (still.matches) {
      draw();
      describe();
      return;
    }
    if (visible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: "120px 0px" },
  );
  observer.observe(svg);

  const flowFromPointer = (event) => {
    const box = svg.getBoundingClientRect();
    const sx = ((event.clientX - box.left) / box.width) * CONFIG.VIEW.width;
    const sy = ((event.clientY - box.top) / box.height) * CONFIG.VIEW.height;
    const kn = CONFIG.DYN.knob;
    const [x, y] = cam.onPlane(sx, sy, kn.z);
    const angle = Math.atan2(x - kn.x, -(y - kn.y));
    const share = angle >= kn.from && angle <= kn.from + kn.span ? (angle - kn.from) / kn.span : angle > 0 ? 1 : 0;
    return Math.round(share * range.max * 10) / 10;
  };

  const listeners = [];
  const on = (node, type, handler) => {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  };

  on(el.knob, "pointerdown", (event) => {
    stopTour();
    dragging = true;
    el.knob.setPointerCapture(event.pointerId);
    setState({ flow_cm_s: flowFromPointer(event) }, "user");
  });
  on(el.knob, "pointermove", (event) => {
    if (dragging) setState({ flow_cm_s: flowFromPointer(event) }, "user");
  });
  const release = (event) => {
    dragging = false;
    if (el.knob.hasPointerCapture(event.pointerId)) el.knob.releasePointerCapture(event.pointerId);
  };
  on(el.knob, "pointerup", release);
  on(el.knob, "pointercancel", release);
  on(el.knob, "keydown", (event) => {
    const big = event.shiftKey ? 5 : 1;
    const moves = { ArrowRight: big, ArrowUp: big, ArrowLeft: -big, ArrowDown: -big, PageUp: 5, PageDown: -5 };
    let flow = null;
    if (event.key in moves) flow = target.flow_cm_s + moves[event.key];
    if (event.key === "Home") flow = range.min;
    if (event.key === "End") flow = range.max;
    if (flow === null) return;
    event.preventDefault();
    stopTour();
    setState({ flow_cm_s: flow }, "user");
  });
  const flip = (name) => () => {
    stopTour();
    setState(name === "fan" ? { fan: !target.fan } : { gravity: target.gravity === "1g" ? "0g" : "1g" }, "user");
  };
  for (const name of ["fan", "gravity"]) {
    on(el[name], "click", flip(name));
    on(el[name], "keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      flip(name)();
    });
  }
  on(still, "change", () => {
    calmJump();
    wake();
  });

  calmJump();
  draw();
  describe();
  emit("init");
  wake();

  return {
    set(state) {
      stopTour();
      setState(state, "api");
      wake();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      clearTimeout(liveTimer);
      observer.disconnect();
      listeners.forEach((off) => off());
    },
  };
}
