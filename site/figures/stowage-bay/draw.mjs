import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { P } from "./world.mjs";

export const at = (x, y, z) => k.iso([x, y, z], P);

export const box = (x, y, z, w, d, h, { r = 1, steps = 3, bevel = 0, ...style } = {}) =>
  k.solidSvg(k.slabOf({ x, y, w, d, r }, z, h, P, steps, bevel), { tone: "mid", ...style });

export const post = (cx, cy, r, z, h, { steps = 20, bevel = 0, ...style } = {}) =>
  k.solidSvg(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone: "mid", ...style });

export const line = (d, tone = "lo", free) => k.lineSvg(d, { tone, free });

export const dots = (points, size = 0.45, tone = "mid") => k.dotsSvg(points.map(([x, y, z]) => at(x, y, z)), { size, tone });

const frame = (centre, axis) => G.frameAlong(centre, axis);

export const disc = (centre, axis, s0, s1, r, style = {}) =>
  k.solidSvg(G.disc(s0, s1, r, frame(centre, axis), P), { tone: "mid", ...style });

export const band = (centre, axis, s0, s1, rIn, rOut, style = {}) =>
  k.solidSvg(G.ringBand(s0, s1, rIn, rOut, frame(centre, axis), P), { tone: "mid", ...style });

export const ball = (centre, r, style = {}) => k.solidSvg(G.sphereOf(centre, r, P), { tone: "mid", ...style });

// Face-local drawing: u runs along the face, v runs down it, one unit is one world unit.
// "b" faces +y (u along +x), "a" faces +x (u along -y).
const faceMatrix = { b: (x, y, z) => k.sideMatrix([x, y], z, P, "left"), a: (x, y, z) => k.sideMatrix([x, y], z, P, "right") };
export const onFace = (face, origin, content, attributes = "") => `<g transform="${faceMatrix[face](...origin)}"${attributes}>${content}</g>`;

export const strokes = (d, tone = "lo", extra = "") => `<path class="iso-line" data-tone="${tone}" d="${d}"${extra}/>`;

export const roundRect = (u0, v0, u1, v1, r = 1) =>
  `M${u0 + r} ${v0}H${u1 - r}Q${u1} ${v0} ${u1} ${v0 + r}V${v1 - r}Q${u1} ${v1} ${u1 - r} ${v1}H${u0 + r}Q${u0} ${v1} ${u0} ${v1 - r}V${v0 + r}Q${u0} ${v0} ${u0 + r} ${v0}Z`;

export const circle = (cu, cv, r, cls = "iso-line", tone = "lo", extra = "") =>
  `<circle class="${cls}"${cls === "iso-line" ? ` data-tone="${tone}"` : ""} cx="${cu}" cy="${cv}" r="${r}"${extra}/>`;

export const byDepth = (items) => [...items].sort((a, b) => k.depthOf(a, P) - k.depthOf(b, P));
export { k, P };
