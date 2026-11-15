import { accessSync, constants, realpathSync } from 'node:fs';
import { delimiter, resolve } from 'node:path';
import { hasCommittedFiles } from './base.mjs';
import { ConfigError } from './errors.mjs';
import { runProgram } from './exec.mjs';

/** The two gbrain sources: the subdirectory of the base, and the id it is registered under. */
export const SOURCES = { nasa: 'nasa-evidence', other: 'other-evidence' };

const executable = (file) => {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

/** The gbrain program: GBRAIN_BIN when set, else the first "gbrain" on PATH. Null when there is none. */
export function findGbrain(env) {
  if (env.GBRAIN_BIN) return executable(env.GBRAIN_BIN) ? env.GBRAIN_BIN : null;
  for (const directory of (env.PATH ?? '').split(delimiter).filter(Boolean)) {
    if (executable(`${directory}/gbrain`)) return `${directory}/gbrain`;
  }
  return null;
}

/**
 * The registered sources by id, from the JSON of `gbrain sources list --json`.
 * gbrain prints { sources: [{ id, name, local_path, federated, archived, ... }] }; a bare list of such rows is read too.
 */
export function registeredSources(stdout) {
  let data;
  try {
    data = JSON.parse(stdout);
  } catch (error) {
    throw new ConfigError(`"gbrain sources list --json" did not print JSON (${error.message}). Run it by hand and check the gbrain installation.`);
  }
  const rows = Array.isArray(data) ? data : Array.isArray(data?.sources) ? data.sources : null;
  if (!rows) throw new ConfigError('"gbrain sources list --json" printed JSON this pipeline cannot read: expected an object with a "sources" list.');
  return new Map(rows.filter((row) => typeof row?.id === 'string').map((row) => [row.id, row]));
}

const samePath = (a, b) => {
  const real = (path) => {
    try {
      return realpathSync(path);
    } catch {
      return resolve(path);
    }
  };
  return real(a) === real(b);
};

/** A source that is already registered must still be usable and must point at this base. */
function checkRegistered(id, row, path) {
  if (row.archived === true) throw new ConfigError(`gbrain source ${id} is archived. Restore it with "gbrain sources restore ${id}" and run again.`);
  if (typeof row.local_path === 'string' && !samePath(row.local_path, path)) {
    throw new ConfigError(`gbrain source ${id} is registered at ${row.local_path}, but this base is at ${path}. Run "gbrain sources set-path ${id} ${path}" or use the base it was registered with.`);
  }
}

const sourceAdd = (id, path) => ['sources', 'add', id, '--path', path, '--federated'];
const sourceSync = (id) => ['sync', '--source', id, '--no-pull'];

/**
 * Registers the missing sources and syncs each one by id. Runs after the commit: gbrain reads committed files.
 * With dryRun it prints the commands and runs none. Returns { skipped, lines } where lines say what was synced.
 */
export async function syncGbrain({ base, classes, env, dryRun, requireGbrain, log, execute = runProgram }) {
  const binary = findGbrain(env);
  if (dryRun) {
    const shown = binary ?? 'gbrain';
    log(`dry run: would run ${shown} sources list --json`);
    for (const documentClass of classes) {
      log(`dry run: would run ${shown} ${sourceAdd(SOURCES[documentClass], `${base}/${documentClass}`).join(' ')}   (only if ${SOURCES[documentClass]} is not registered)`);
      log(`dry run: would run ${shown} ${sourceSync(SOURCES[documentClass]).join(' ')}`);
    }
    return { skipped: null, lines: [] };
  }
  if (!binary) {
    const message = 'gbrain not found (set GBRAIN_BIN or put gbrain on PATH); sync skipped';
    if (requireGbrain) throw new ConfigError(`${message}, and --require-gbrain was given.`);
    log(message);
    return { skipped: message, lines: [] };
  }
  const lines = [];
  const run = async (args) => {
    try {
      return await execute(binary, args, { env });
    } catch (error) {
      throw Object.assign(new ConfigError(`${error.message}\nThe base is already committed. Fix gbrain (run the command by hand as the user that owns the brain) and run this again.`), { lines });
    }
  };
  const registered = registeredSources((await run(['sources', 'list', '--json'])).stdout);
  for (const documentClass of classes) {
    const id = SOURCES[documentClass];
    const path = `${base}/${documentClass}`;
    if (registered.has(id)) {
      checkRegistered(id, registered.get(id), path);
    } else {
      if (!(await hasCommittedFiles(base, documentClass))) {
        log(`${id}: nothing committed under ${path} yet; not registered`);
        continue;
      }
      await run(sourceAdd(id, path));
      lines.push(`registered ${id} (path ${path}, federated)`);
      log(lines.at(-1));
    }
    const { stdout } = await run(sourceSync(id));
    lines.push(`synced ${id}${stdout.trim() ? `: ${stdout.trim().split('\n').slice(-1)[0]}` : ''}`);
    log(lines.at(-1));
  }
  return { skipped: null, lines };
}
