import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { ConfigError } from './errors.mjs';
import { runProgram } from './exec.mjs';

const GITIGNORE = 'raw/\nreports/\n.evidence-base.lock\n';
/** Everything a base directory may hold at its top level. Anything else means the directory is not an evidence base. */
const BASE_ENTRIES = new Set(['.git', '.gitignore', '.evidence-base.lock', 'manifest.json', 'raw', 'reports', 'nasa', 'other']);
const LOCK_MAX_AGE_MS = 6 * 60 * 60_000;

/** Writes a file only when its content differs. Returns true when it wrote. */
export function writeIfChanged(file, content) {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return false;
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, content);
  renameSync(temporary, file);
  return true;
}

const processIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

/** Takes the lock file of the base. Returns a function that releases it. Throws ConfigError when another run holds it. */
export function acquireLock(file, { now = Date.now() } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(file, 'wx');
      writeSync(fd, JSON.stringify({ pid: process.pid, started: now }));
      closeSync(fd);
      return () => rmSync(file, { force: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw new ConfigError(`cannot create the lock ${file} (${error.code ?? error.message}). Check that this user may write to the base directory.`);
      let holder = {};
      try { holder = JSON.parse(readFileSync(file, 'utf8')); } catch { /* an unreadable lock is stale */ }
      const fresh = Number.isInteger(holder.pid) && processIsAlive(holder.pid) && now - holder.started < LOCK_MAX_AGE_MS;
      if (fresh) throw new ConfigError(`another run is active (pid ${holder.pid}, lock ${file}). Wait for it to finish; if it is gone, delete the lock file.`);
      rmSync(file, { force: true });
    }
  }
  throw new ConfigError(`cannot take the lock ${file}. Check that no other run is active and delete the file.`);
}

export function loadManifest(base) {
  const file = `${base}/manifest.json`;
  if (!existsSync(file)) return { version: 1, documents: {} };
  try {
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    if (manifest.version !== 1 || typeof manifest.documents !== 'object') throw new Error('unknown layout');
    return manifest;
  } catch (error) {
    throw new ConfigError(`${file} is not a readable manifest (${error.message}). Restore it from the base repository with git, or delete it to rebuild.`);
  }
}

export function manifestText(manifest) {
  const documents = Object.fromEntries(Object.entries(manifest.documents).sort(([a], [b]) => (a < b ? -1 : 1)));
  return `${JSON.stringify({ version: 1, documents }, null, 2)}\n`;
}

const git = (base, args, options = {}) => runProgram('git', ['-C', base, ...args], options);

/**
 * Creates the directory and its own git repository, with the ignore file.
 * Refuses a directory that already holds other files: the run commits everything in the base with `git add --all`,
 * so a wrong --base (a home directory, a checkout) must never be taken over.
 */
export async function ensureBase(base) {
  let foreign;
  try {
    mkdirSync(base, { recursive: true });
    foreign = readdirSync(base).filter((name) => !BASE_ENTRIES.has(name));
  } catch (error) {
    throw new ConfigError(`cannot use ${base} as the evidence base (${error.code ?? error.message}). Check that the path is a directory this user may read and write.`);
  }
  if (foreign.length > 0) {
    throw new ConfigError(`${base} is not an evidence base: it holds ${foreign.slice(0, 3).join(', ')}${foreign.length > 3 ? ', ...' : ''}. Give --base a new or empty directory.`);
  }
  if (!existsSync(`${base}/.git`)) {
    try {
      await git(base, ['init', '--quiet']);
    } catch (error) {
      throw new ConfigError(`cannot create the git repository of the base: ${error.message}. Check that git is installed and ${base} is writable.`);
    }
  }
  writeIfChanged(`${base}/.gitignore`, GITIGNORE);
}

/** Commits everything that changed. Returns true when a commit was made. */
export async function commitAll(base, { name, email, message }) {
  try {
    await git(base, ['add', '--all']);
    const { stdout } = await git(base, ['status', '--porcelain']);
    if (stdout.trim() === '') return false;
    await git(base, ['-c', `user.name=${name}`, '-c', `user.email=${email}`, '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', message]);
    return true;
  } catch (error) {
    throw new ConfigError(`the git repository of the base could not commit: ${error.message}\nCheck that ${base} belongs to the user running this, that the disk is not full, and that ${base}/.git is intact.`);
  }
}

/** True when the commit at HEAD tracks at least one file under the subdirectory. gbrain reads only committed files. */
export async function hasCommittedFiles(base, subdirectory) {
  try {
    const { stdout } = await git(base, ['ls-tree', '-r', '--name-only', 'HEAD', '--', subdirectory]);
    return stdout.trim() !== '';
  } catch {
    return false;
  }
}
