// Layout, camera and small drawing helpers shared by every part of the flame duct figure.
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

export const WIDTH = 760;
export const HEIGHT = 440;
export const AZIMUTH = 122;

export const PLATE = { x: -186, y: -72, w: 372, d: 144, r: 9 };
export const PLATE_H = 12;
export const FOOT_H = 5;

export const AX = 62;
export const R = 27;
export const WALL = 1.6;

export const X = {
  fanFrom: -160,
  fanTo: -132,
  neck: -122,
  ductFrom: -122,
  ductTo: 110,
  exitTo: 128,
  honey: [-112, -96],
  rodTip: -14,
  rodEnd: 30,
  holderTo: 40,
  post: 35,
  igniter: -22,
};
export const ROD_R = 3.5;

export const PANEL = { x: -22, y: 49, w: 112, d: 12, r: 3, h: 40 };
export const DIAL_R = 15;
export const DIALS = {
  air: { x: 6, z: 22 },
  o2: { x: 62, z: 22 },
};
export const DIAL_FACE_Y = PANEL.y + PANEL.d;

const extremes = [
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [X.fanFrom, 0, AX + 52],
  [X.exitTo, 0, AX + 36],
  [X.exitTo, 0, AX - 36],
  [-40, -78, AX + 28],
];
export const P = k.fitProjection(extremes, WIDTH, HEIGHT, { pad: 22, azimuth: AZIMUTH, elevation: 30 });

export const at = (point) => k.iso(point, P);
export const S = (paths, style) => k.solidSvg(paths, style);
export const L = (d, style) => k.lineSvg(d, style);
export const D = (points, style) => k.dotsSvg(points, style);
export const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

/** A frame on the duct axis: s runs along +x, angle 0 points to +y, angle 90 degrees to +z. */
export const ductFrame = (x, y = 0, z = AX) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
/** A frame on a vertical post: s runs up. */
export const postFrame = (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
/** A frame on a horizontal axis along y, facing the viewer's side. */
export const faceFrame = (x, y, z) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
