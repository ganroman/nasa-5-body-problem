import { P, k } from "./draw.mjs";

// What a reader can point at: the outline of each place's fixtures, from the corners of their boxes in the world.
const BOXES = {
  airlock: [[0, 14, 8, 8.5, 92, 122], [4, 20, 0, 48, 96, 18]],
  vent: [[109, 0, 0, 175, 33, 134], [172, 6, 20, 194, 26, 50], [116, 30, 42, 162, 62, 59]],
  power: [[196, 0, 44, 250, 40, 66], [202, 0, 76, 244, 8, 114], [220, 2, 114, 226, 8, 134]],
  locker: [[260, 0, 0, 342, 49, 96]],
  rack: [[4, 160, 0, 44, 213, 70]],
};

function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const chain = [];
    for (const point of list) {
      while (chain.length > 1 && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) chain.pop();
      chain.push(point);
    }
    return chain.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

export function hitOutline(id) {
  const corners = BOXES[id].flatMap(([x0, y0, z0, x1, y1, z1]) => k.boxCorners({ x: x0, y: y0, w: x1 - x0, d: y1 - y0 }, z0, z1));
  return k.pathOf(hull(corners.map((corner) => k.iso(corner, P))), true);
}
