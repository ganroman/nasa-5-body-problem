import * as k from "../kit/iso-kit.mjs";

export const WIDTH = 584;
export const HEIGHT = 440;

export const BAY = { x: 352, y: 220, h: 150, wall: 7 };

export const INSTRUMENT = { w: 24, d: 15, h: 9 };

export const GAUGES = {
  o2: { id: "o2", cx: 31, max: 40, majorEvery: 10, minorEvery: 2, unit: "O2" },
  pressure: { id: "pressure", cx: 68, max: 110, majorEvery: 10, minorEvery: 5, unit: "kPa" },
};
export const DIAL = { cz: 103, r: 17, face: 9, sweep: 270, parked: 180 };

// spot: where the instrument's footprint is centred, at the height of the surface it stands on.
// out: how the instrument leaves the place; "up" lifts it straight, "front" slides it out along +y first.
export const PLACES = [
  { id: "airlock", label: "Airlock", where: "at the airlock bench", spot: [26, 58, 18], zone: { x: 2, y: 14, w: 62, d: 92, r: 3 }, flag: [60, 104] },
  { id: "vent", label: "Vent", where: "at the vent tray", spot: [139, 46, 55], zone: { x: 106, y: 0, w: 82, d: 72, r: 3 }, flag: [184, 70] },
  { id: "power", label: "Power", where: "on the charging shelf", spot: [224, 22, 68.5], zone: { x: 190, y: 0, w: 68, d: 52, r: 3 }, flag: [254, 50] },
  { id: "locker", label: "Locker", where: "in the locker", spot: [318, 33, 10], zone: { x: 258, y: 0, w: 90, d: 64, r: 3 }, flag: [346, 30], out: "front", front: 56 },
  { id: "rack", label: "Rack", where: "on the rack", spot: [24, 186, 62], zone: { x: 0, y: 154, w: 52, d: 62, r: 3 }, flag: [50, 214] },
];
export const DOOR = { slide: -36 };
export const PARKED = { spot: [196, 122, 0], size: 30 };

export const P = k.fitProjection(
  k.boxCorners({ x: -BAY.wall, y: -BAY.wall, w: BAY.x + BAY.wall + 4, d: BAY.y + BAY.wall + 4 }, -17, BAY.h + 2),
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: 52, elevation: 30 },
);
