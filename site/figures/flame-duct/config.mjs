// The drawing numbers the live script needs, gathered once so figure.js and the first frame agree.
import * as k from "../kit/iso-kit.mjs";
import { CTRL, FAN_SWITCH, GSW, GSW_AT, KNOB_AT, KNOB_TOP, LEVER } from "./base.mjs";
import { GAUGES, RING_R, RING_X, gaugeSpec } from "./bench.mjs";
import { BLADES, FAN_X, HUB_R, SHROUD_R } from "./duct.mjs";
import { MODEL } from "./data.mjs";
import { AX, DIAL_R, P, ROD_R, X } from "./world.mjs";

const mean = (pair) => (pair[0] + pair[1]) / 2;

export const DYN = {
  blades: { x: FAN_X, z: AX, hub: HUB_R, outer: SHROUD_R, count: BLADES },
  gauges: { air: gaugeSpec(GAUGES.air), o2: gaugeSpec(GAUGES.o2) },
  knob: { x: KNOB_AT[0], y: KNOB_AT[1], z: KNOB_TOP, r0: 1.2, r1: 6.9, from: -Math.PI * 0.75, span: Math.PI * 1.5 },
  levers: {
    fan: { x: FAN_SWITCH[0], y: FAN_SWITCH[1], z: CTRL.h + 3.6, rise: LEVER.rise, lean: LEVER.lean },
    gravity: { x: GSW_AT[0], y: GSW_AT[1], z: GSW.h + 3.4, rise: LEVER.rise, lean: LEVER.lean },
  },
  flame: { x: X.rodTip, z: AX, ...MODEL.drawing.flame, standoff_max: MODEL.weightless.standoff_mm, rod_r: ROD_R, tear_gap: mean(MODEL.earth.standoff_mm) },
  igniter: { x: RING_X, r: RING_R },
  dial_r: DIAL_R,
};

export const CAM = { ...k.cameraOf(P), ox: P.origin[0], oy: P.origin[1] };
