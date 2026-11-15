import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const load = async (path) => (existsSync(path) ? import(pathToFileURL(path).href) : null);

/** Modules other builders own. A missing one is not an error: the page then shows a quiet placeholder where it would go. */
export const rules = await load(join(here, '../../assets/js/passport-rules.js'));
export const fleet = await load(join(here, 'fleet.mjs'));
