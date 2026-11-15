// The one data file of the figure, parsed once at the boundary.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseModel } from "./model.mjs";

export const MODEL = parseModel(JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "model.json"), "utf8")));
