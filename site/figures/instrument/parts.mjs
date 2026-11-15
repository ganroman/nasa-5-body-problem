// Geometry of the instrument, assembled. Each function returns the SVG markup of one piece.
// World units are about one pixel of the drawing; x is the long axis, y the width, z up.
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

export const BODY = { x: -62, y: -34, w: 124, d: 68, r: 12 };
const RIM = 20;
export const TOP = 34;
const WALL = 3.2;
const FLOOR = 3;
const GASKET_TOP = 21.6;
const CAVITY = k.insetPlan(BODY, WALL);
const SEAT = { outer: 0.9, inner: 2.3 };
const END = BODY.x + BODY.w;
const HEAD = { y: 0, z: 21, r: 5.4 };
const POST_R = 3.8;
const POSTS = k.corners(CAVITY, CAVITY.r - (CAVITY.r - POST_R) / Math.SQRT2);
const LUGS = [-18, 18];
const BOARD = { x: -46, y: -19, w: 102, d: 38, r: 3 };
const BOARD_Z = [22.6, 24];
const CELL = { r: 7.25, y: [-15.5, 0, 15.5], x0: -25, x1: 25 };

export function parts(P, ids) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const at = (point) => k.iso(point, P);
  const path = (points) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

  const screwHeads = (list, z, r = 1.9) =>
    byDepth(list)
      .map(([x, y]) => S(k.cylinder(x, y, r, z, 0.7, P, 14), { tone: "mid" }) + L(k.lineOnTop([x - r * 0.7, y], [x + r * 0.7, y], z + 0.7, P), { tone: "lo" }))
      .join("");

  // A stadium slot cut into a vertical face (y = face, or x = face when across is "x"): a closed outline, so it has no loose ends.
  const slot = (face, along, z0, z1, width, across = "y") => {
    const r = width / 2;
    const ring = [];
    for (let step = 0; step <= 8; step++) ring.push([along + r * Math.cos(Math.PI * (step / 8)), z1 - r + r * Math.sin(Math.PI * (step / 8))]);
    for (let step = 0; step <= 8; step++) ring.push([along - r * Math.cos(Math.PI * (step / 8)), z0 + r - r * Math.sin(Math.PI * (step / 8))]);
    const world = ([u, z]) => (across === "y" ? [u, face, z] : [face, u, z]);
    return `<path class="in-slot" d="${path(ring.map((point) => at(world(point))))}Z"/>`;
  };
  const slots = (face, z0, z1, list, across = "y") => list.map((along) => slot(face, along, z0, z1, 3.2, across)).join("");

  // The round port the sensor head passes through, drawn on the end face; `part` keeps the half above or below `cut`.
  const portHalf = (cut, part) => {
    const points = [];
    for (let step = 0; step <= 48; step++) {
      const angle = (step / 48) * Math.PI * 2;
      const z = HEAD.z + HEAD.r * Math.sin(angle);
      if (part === "below" ? z <= cut : z >= cut) points.push(at([END, HEAD.y + HEAD.r * Math.cos(angle), z]));
    }
    return `<path class="in-port" d="${path(points)}Z"/>`;
  };

  // The tray's open top: a recess with its far walls and floor, clipped to the rim opening.
  const pocket = () => {
    const ring = k.ringOf(CAVITY, 8);
    const [vx, vy] = k.towardViewer(P);
    const area = ring.reduce((sum, [x, y], index) => sum + x * ring[(index + 1) % ring.length][1] - ring[(index + 1) % ring.length][0] * y, 0);
    const sign = Math.sign(area);
    const rim = k.onTop(ring, RIM, P, true);
    const floor = k.onTop(ring, FLOOR, P, true);
    const walls = ring
      .map(([x, y], index) => {
        const [nx, ny] = ring[(index + 1) % ring.length];
        const outward = [(ny - y) * sign, (x - nx) * sign];
        if (outward[0] * vx + outward[1] * vy > -1e-6) return "";
        const tone = G.toneOf([-outward[0], -outward[1], 0], P);
        return `<path class="iso-shade" data-shade="${tone}" d="${path([at([x, y, RIM]), at([nx, ny, RIM]), at([nx, ny, FLOOR]), at([x, y, FLOOR])])}Z"/>`;
      })
      .join("");
    return `<clipPath id="instrument-pocket"><path d="${rim}"/></clipPath><g clip-path="url(#instrument-pocket)"><path class="in-floor" d="${floor}"/>${walls}${L(floor, { tone: "faint" })}</g>${L(rim, { tone: "lo" })}`;
  };

  // Screen region below the near edge of the tray's opening: what must be painted again after the battery.
  const nearRegion = () => {
    const edge = k.ringOf(CAVITY, 8).map(([x, y]) => at([x, y, RIM]));
    const left = edge.reduce((a, b) => (b[0] < a[0] ? b : a));
    const right = edge.reduce((a, b) => (b[0] > a[0] ? b : a));
    const chord = (x) => left[1] + ((right[1] - left[1]) * (x - left[0])) / (right[0] - left[0]);
    const lower = edge.filter(([x, y]) => x >= left[0] && x <= right[0] && y >= chord(x)).sort((a, b) => a[0] - b[0]);
    const reach = 12;
    return `${path([[left[0] - reach, left[1]], left, ...lower, right, [right[0] + reach, right[1]], [right[0] + reach, 2000], [left[0] - reach, 2000]])}Z`;
  };

  const shell = () =>
    S(k.slabOf(BODY, 0, RIM, P, 8, 1.2), { tone: "mid" }) +
    L(k.planOutline(k.insetPlan(BODY, SEAT.outer), RIM, P), { tone: "faint" }) +
    L(k.planOutline(k.insetPlan(BODY, SEAT.inner), RIM, P), { tone: "faint" });

  const lugs = () =>
    LUGS.map((y) => S(k.slabOf({ x: -74, y: y - 6, w: 12, d: 12, r: 3 }, 4, 4, P, 4, 0.4), { tone: "mid" }) + L(k.ring(-68, y, 2.4, 8, P, 16), { tone: "lo" })).join("");

  // Battery bay on the tray floor: a seat outline, four corner clips and two contact springs.
  const bay = () => {
    const seat = { x: -32, y: -28, w: 64, d: 56, r: 3 };
    const clips = k.corners(seat, 2).map(([x, y]) => S(k.slabOf({ x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.6 }, FLOOR, 4.5, P, 2, 0.2), { tone: "lo" }));
    const springs = [-1, 1].map((side) => S(k.slabOf({ x: side * 36 - 0.8, y: -9, w: 1.6, d: 18, r: 0.4 }, FLOOR, 5, P, 2), { tone: "lo", crease: "none" }));
    const ribs = [-1, 1].flatMap((side) => [41, 46, 51].map((x) => S(k.slabOf({ x: side * x - 0.8, y: -23, w: 1.6, d: 46, r: 0.4 }, FLOOR, 1.8, P, 2), { tone: "lo", crease: "none" })));
    return L(k.planOutline(seat, FLOOR, P, 4), { tone: "lo" }) + ribs.join("") + clips.join("") + springs.join("");
  };

  const posts = (near) =>
    POSTS.filter(([, y]) => y > 0 === near)
      .map(([x, y]) => S(k.cylinder(x, y, POST_R, FLOOR, RIM - FLOOR, P, 20), { tone: "mid" }) + L(k.ring(x, y, 1.5, RIM, P, 14), { tone: "lo" }) + D([at([x, y, RIM])], { size: 0.4, tone: "lo" }))
      .join("");

  const tray = () => {
    const rimLine = L(k.onTop(k.ringOf(CAVITY, 8), RIM, P, true), { tone: "lo" });
    const back = `<path class="iso-halo" d="${k.haloOf(BODY, 0, RIM, P)}"/>${lugs()}${shell()}${slots(BODY.y + BODY.d, 6.5, 17.5, [-30, -22.5, -15, -7.5, 0, 7.5, 15, 22.5, 30])}${slots(END, 6.5, 17.5, [-17, -12, 12, 17], "x")}${pocket()}${bay()}${posts(false)}${portHalf(RIM, "below")}`;
    const over = `${posts(true)}<clipPath id="instrument-near"><path d="${nearRegion()}"/></clipPath><g clip-path="url(#instrument-near)">${shell()}${slots(BODY.y + BODY.d, 6.5, 17.5, [-30, -22.5, -15, -7.5, 0, 7.5, 15, 22.5, 30])}${slots(END, 6.5, 17.5, [-17, -12, 12, 17], "x")}</g>${portHalf(RIM, "below")}${rimLine}`;
    return { back, over };
  };

  const cable = (points, lane) => {
    const d = path(points.map(at));
    return `<g class="in-cable" data-lane="${lane}"><path class="in-cable-body" d="${d}"/><path class="in-cable-core" d="${d}"/></g>`;
  };

  const battery = (tag) => {
    const out = [];
    const floor = FLOOR + 1.2;
    const cz = floor + CELL.r;
    out.push(S(k.slabOf({ x: -30, y: -26, w: 60, d: 52, r: 2 }, FLOOR, 1.2, P, 3, 0.3), { tone: "lo" }));
    out.push(S(k.slabOf({ x: -30, y: -26, w: 5, d: 52, r: 1.6 }, floor, 10.5, P, 3, 0.4), { tone: "mid" }));
    for (const y of CELL.y) {
      const F = G.frameAlong([CELL.x0, y, cz], [1, 0, 0]);
      const bands = [5, 9, 41, 45].map((s) => L(G.arcOf(F, s, CELL.r, P), { tone: "faint" })).join("");
      out.push(S(G.disc(0, CELL.x1 - CELL.x0, CELL.r, F, P), { tone: "mid", crease: "lo", inner: bands }));
    }
    out.push(S(k.slabOf({ x: 25, y: -26, w: 5, d: 52, r: 1.6 }, floor, 10.5, P, 3, 0.4), { tone: "mid" }));
    const tabs = [
      { x: CELL.x1 + 0.2, y: -15.5 - 3.6, d: 22.7, z: cz - 3.2, h: 6.4 },
      { x: CELL.x0 - 1.1, y: -7.8, d: 23.6, z: cz - 3.2, h: 6.4 },
    ];
    for (const tab of tabs) out.push(S(k.slabOf({ x: tab.x, y: tab.y, w: 0.9, d: tab.d, r: 0.3 }, tab.z, tab.h, P, 2), { tone: "lo", crease: "none" }));
    out.push(D([at([CELL.x1 + 1.1, -15.5, cz]), at([CELL.x1 + 1.1, 3.8, cz]), at([CELL.x0 - 0.2, -7, cz]), at([CELL.x0 - 0.2, 14, cz])], { size: 0.45 }));
    out.push(S(k.slabOf({ x: -29.8, y: 20.5, w: 4.6, d: 5.6, r: 0.8 }, floor + 10.5, 4.5, P, 2, 0.3), { tone: "hi" }));
    out.push(L(k.lineOnTop([-28.6, 21], [-28.6, 25.5], floor + 15, P), { tone: "faint" }) + L(k.lineOnTop([-26.4, 21], [-26.4, 25.5], floor + 15, P), { tone: "faint" }));
    out.push(tag(-27.5, -21, floor + 10.5));
    return out.join("");
  };

  const gasket = (tag) => {
    const centre = k.insetPlan(BODY, (SEAT.outer + SEAT.inner) / 2);
    const width = (SEAT.inner - SEAT.outer) * P.scale;
    const ringAt = (z) => k.planOutline(centre, z, P);
    const out = [];
    for (let step = 0; step <= 4; step++) out.push(`<path class="in-gasket-side" d="${ringAt(RIM + (step / 4) * (GASKET_TOP - RIM))}" style="stroke-width:${width.toFixed(2)}px"/>`);
    out.push(`<path class="in-gasket-top" d="${ringAt(GASKET_TOP)}" style="stroke-width:${width.toFixed(2)}px"/>`);
    for (const inset of [SEAT.outer, SEAT.inner]) out.push(`<path class="in-gasket-edge" d="${k.planOutline(k.insetPlan(BODY, inset), GASKET_TOP, P)}"/>`);
    out.push(S(k.slabOf({ x: -14, y: BODY.y + BODY.d - 0.6, w: 12, d: 6.6, r: 1.6 }, RIM, GASKET_TOP - RIM, P, 3), { tone: "lo" }));
    out.push(L(k.ring(-8, BODY.y + BODY.d + 3, 1.3, GASKET_TOP, P, 12), { tone: "lo" }));
    out.push(tag(-4.6, BODY.y + BODY.d + 3.4, GASKET_TOP));
    return out.join("");
  };

  // The sensor head leaves through the end wall: its stub belongs with the board, the part outside is painted after the shells.
  const headFrame = G.frameAlong([END - 6, HEAD.y, HEAD.z], [1, 0, 0]);
  const head = () =>
    S(G.solidOf([[6, 4.4], [9, 4.4], [9, 3.9], [10.5, 3.9], [10.5, 4.4], [14, 4.4], [14, 3.9], [15.5, 3.9], [15.5, 4.4], [23, 4.4], [23, 3.4], [27, 3.4]], headFrame, P), { tone: "mid", crease: "lo" }) +
    S(G.disc(27, 27.8, 2.5, headFrame, P), { tone: "lo" });

  const wiring = (tag) => {
    const out = [];
    const [z0, z1] = BOARD_Z;
    const sockets = { board: [33, 15, z1 + 4.4], plug: [-24.2, 23.2, 22] };
    out.push(S(k.slabOf(BOARD, z0, z1 - z0, P, 3, 0.3), { tone: "lo" }));
    const holes = k.corners(BOARD, 4);
    out.push(L(holes.map(([x, y]) => k.ring(x, y, 1.6, z1, P, 12)).join(""), { tone: "faint" }));
    out.push(D(holes.map(([x, y]) => at([x, y, z1])), { size: 0.45 }));
    for (const chip of [{ x: -34, y: -10, w: 12, d: 12 }, { x: -14, y: -4, w: 9, d: 9 }]) {
      out.push(S(k.slabOf({ ...chip, r: 0.6 }, z1, 1.6, P, 2, 0.3), { tone: "mid" }));
      const pads = [];
      for (let step = 1.5; step < chip.w; step += 2.5) pads.push(at([chip.x + step, chip.y - 0.6, z1]), at([chip.x + step, chip.y + chip.d + 0.6, z1]));
      out.push(D(pads, { size: 0.4, tone: "mid" }));
    }
    out.push(L(k.onTop([[-22, -4], [-14, -4]], z1, P), { tone: "lo" }));
    out.push(L(k.onTop([[-5, 0], [4, 0], [4, 8], [18, 8]], z1, P), { tone: "lo" }));
    for (const x of [10, 18]) out.push(S(k.cylinder(x, -10, 2.3, z1, 3.4, P, 14), { tone: "mid" }));
    for (let index = 0; index < 5; index++) out.push(S(k.slabOf({ x: -2 + index * 3.6, y: 11, w: 2.6, d: 1.4, r: 0.2 }, z1, 0.7, P, 2), { tone: "lo", crease: "none" }));
    out.push(L(k.planOutline({ x: 24, y: -16, w: 18, d: 12, r: 1.4 }, z1, P, 3), { tone: "faint" }));
    const pads = [];
    for (let column = 0; column < 4; column++) for (let row = 0; row < 2; row++) pads.push(at([27 + column * 3.6, -13 + row * 3.6, z1]));
    out.push(D(pads, { size: 0.55, tone: "hi" }));
    for (let lane = -1; lane <= 1; lane++) {
      const y = 22.2 + lane * 1.3;
      const run = [[...sockets.board.slice(0, 2), sockets.board[2] - 1.6 + lane * 0.5], [33 + lane * 0.4, y, 25.8], [-20, y, 23.2 + lane * 0.4], [-24.2, y, sockets.plug[2] + lane * 0.5]];
      out.push(cable(run, lane));
    }
    out.push(S(k.slabOf({ x: 28, y: 12, w: 9, d: 6.2, r: 0.8 }, z1, 4.4, P, 2, 0.3), { tone: "hi" }));
    out.push(L(k.lineOnTop([30, 15], [35, 15], z1 + 4.4, P), { tone: "faint" }));
    out.push(S(k.slabOf({ x: -29.2, y: 20.5, w: 5.4, d: 6.2, r: 0.8 }, 19.5, 4.6, P, 2, 0.3), { tone: "hi" }));
    for (const x of [8, -4]) out.push(S(k.slabOf({ x, y: 20.6, w: 3, d: 3.4, r: 0.6 }, 22.6, 2.2, P, 2), { tone: "mid" }));
    out.push(S(G.solidOf([[0, 5.4], [3, 5.4], [3, 4.4], [6, 4.4]], headFrame, P), { tone: "mid", crease: "lo" }));
    out.push(tag(-36, 12, z1));
    return out.join("");
  };

  const top = (tag) => {
    const out = [];
    out.push(S(k.slabOf(BODY, GASKET_TOP, TOP - GASKET_TOP, P, 8, 1.2), { tone: "mid" }));
    out.push(slots(BODY.y + BODY.d, 25.5, 32.2, [-24, -16, -8, 0, 8, 16, 24]) + slots(END, 25.5, 32.2, [-17, -12, 12, 17], "x"));
    out.push(portHalf(GASKET_TOP, "above"));
    out.push(L(k.planOutline(k.insetPlan(BODY, 2.4), TOP, P), { tone: "faint" }));
    const screen = { x: -46, y: -24, w: 62, d: 36, r: 3 };
    out.push(S(k.slabOf(k.insetPlan(screen, -1.6), TOP, 0.5, P, 4), { tone: "mid", crease: "faint" }));
    out.push(S(k.slabOf(screen, TOP + 0.5, 0.3, P, 4), { tone: "lo", crease: "none" }));
    out.push(L(k.planOutline(k.insetPlan(screen, 2), TOP + 0.8, P), { tone: "faint" }));
    out.push(Array.from({ length: 16 }, (_, cell) => L(k.planOutline({ x: -42 + cell * 3.4, y: -20, w: 2.6, d: 4.4, r: 0.6 }, TOP + 0.8, P, 2), { tone: "mid" })).join(""));
    const ticks = k.topTicks(-42, 12, 4, 5, 6, TOP + 0.8, [1.4, 2.6], P);
    out.push(L(k.lineOnTop([-42, 6], [12, 6], TOP + 0.8, P), { tone: "lo" }), L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    for (const [x, y] of byDepth([[34, -14], [34, -2], [34, 10]])) {
      out.push(L(k.ring(x, y, 4.6, TOP, P, 20), { tone: "faint" }));
      out.push(S(k.cylinder(x, y, 3.4, TOP, 1.8, P, 20, 0.3), { tone: "hi" }));
    }
    const grille = [-27.5, -24.5, -21.5, -18.5].map((y) => `<path class="in-slot" d="${k.planOutline({ x: 37, y, w: 13, d: 1.6, r: 0.8 }, TOP, P, 3)}"/>`).join("");
    out.push(grille);
    for (const y of [-20, -15]) out.push(L(k.ring(24, y, 1.5, TOP, P, 10), { tone: "lo" }) + D([at([24, y, TOP])], { size: 0.5, tone: "hi" }));
    out.push(k.faceTextSvg(k.topMatrix([-42, -3], TOP + 0.8, P, "x"), "--.-", { size: 9, tone: "hi" }));
    out.push(S(k.slabOf({ x: 46, y: -14, w: 8, d: 26, r: 2.5 }, TOP, 1.4, P, 4, 0.4), { tone: "hi" }));
    out.push(L(k.lineOnTop([46, -1], [54, -1], TOP + 1.4, P), { tone: "lo" }));
    const plate = { x: -46, y: 17, w: 52, d: 11, r: 1.6 };
    out.push(S(k.slabOf(plate, TOP, 0.6, P, 3), { tone: "lo", crease: "none" }));
    out.push(L(k.planOutline(k.insetPlan(plate, 1.4), TOP + 0.6, P, 3), { tone: "faint" }));
    for (const [y, length] of [[20, 34], [22.6, 26], [25.2, 18]]) out.push(L(k.lineOnTop([-42, y], [-42 + length, y], TOP + 0.6, P), { tone: "lo", free: true }));
    out.push(D([at([-44, 22.5, TOP + 0.6]), at([4, 22.5, TOP + 0.6])], { size: 0.45 }));
    out.push(screwHeads(POSTS, TOP));
    out.push(tag(22, 22, TOP));
    return out.join("");
  };

  // The pin shanks go through the lugs, so they are painted before the tray and hide behind it when assembled.
  const pins = () => LUGS.map((y) => S(k.cylinder(-68, y, 1.5, 0.6, 8, P, 12), { tone: "mid", crease: "none" })).join("");

  const strap = (tag) => {
    const out = [];
    const z0 = 8;
    const band = z0 + 1.2;
    for (const y of LUGS) {
      out.push(S(k.slabOf({ x: -112, y: y - 5, w: 41, d: 10, r: 1.2 }, z0, 1.2, P, 3, 0.3), { tone: "lo" }));
      for (const x of [-77, -80]) out.push(L(k.lineOnTop([x, y - 5], [x, y + 5], band, P), { tone: "faint" }));
      out.push(L(k.planOutline({ x: -94, y: y - 3, w: 10, d: 6, r: 0.2 }, band, P, 2), { tone: "faint" }));
      out.push(L(k.lineOnTop([-94, y - 3], [-84, y + 3], band, P) + k.lineOnTop([-94, y + 3], [-84, y - 3], band, P), { tone: "faint" }));
      out.push(L(k.ring(-68, y, 2.4, band, P, 16), { tone: "faint" }));
    }
    out.push(S(k.slabOf({ x: -100, y: -24, w: 4, d: 48, r: 1 }, z0, 2.4, P, 2, 0.3), { tone: "mid" }));
    const buckle = { x: -120, y: -27, w: 13, d: 54, r: 3 };
    out.push(S(k.slabOf(buckle, z0, 3.2, P, 4, 0.5), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(buckle, 2.2), z0 + 3.2, P, 3), { tone: "faint" }));
    out.push(S(k.slabOf({ x: -115, y: -24, w: 3, d: 48, r: 1 }, z0 + 3.2, 1.2, P, 2), { tone: "hi" }));
    for (const y of LUGS) {
      out.push(S(k.cylinder(-68, y, 2.4, band, 1.4, P, 16, 0.2), { tone: "hi" }));
      out.push(L(k.lineOnTop([-69.6, y], [-66.4, y], band + 1.4, P), { tone: "lo" }));
    }
    out.push(tag(-113.5, -21, z0 + 3.2));
    return out.join("");
  };

  // A tag on a stake: lying down when there is nothing to flag, standing up when evidence applies,
  // standing up and struck through when it differs. The page switches the variant with data-flag.
  const tagAt = (id) => (x, y, z) => {
    const stake = S(k.cylinder(x, y, 0.8, z, 7, P, 8), { tone: "mid", crease: "none" });
    const lying = S(k.slabOf({ x: x - 4, y: y - 6.4, w: 8, d: 6.4, r: 0.6 }, z, 0.7, P, 2), { tone: "lo", crease: "none" });
    const standing = S(k.slabOf({ x: x - 4, y: y - 0.6, w: 8, d: 1.2, r: 0.3 }, z + 2.6, 6.4, P, 2), { tone: "hi" });
    const struck = L(k.segment([x - 4, y + 0.6, z + 2.6], [x + 4, y + 0.6, z + 9], P), { tone: "lit" });
    return `<g class="in-tag" data-tag="${id}" data-flag="none">${stake}<g class="in-tag-none">${lying}</g><g class="in-tag-applies">${standing}</g><g class="in-tag-differs">${standing}${struck}</g></g>`;
  };

  return {
    tray: tray(),
    battery: battery(tagAt(ids.battery)),
    gasket: gasket(tagAt(ids.gasket)),
    wiring: wiring(tagAt(ids.wiring)),
    top: top(tagAt(ids.enclosure)),
    strap: strap(tagAt(ids.strap)),
    pins: pins(),
    head: head(),
  };
}
