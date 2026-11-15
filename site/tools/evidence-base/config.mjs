import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { REPO } from '../site.mjs';
import { ConfigError } from './errors.mjs';

export const USAGE = 'usage: node tools/evidence-base/run.mjs [--base DIR] [--only nasa|other] [--other-text full|excerpts] [--no-sync] [--dry-run] [--leads] [--require-gbrain]';

const OPTIONS = {
  base: { type: 'string' },
  only: { type: 'string' },
  'other-text': { type: 'string' },
  'no-sync': { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  leads: { type: 'boolean' },
  'require-gbrain': { type: 'boolean' },
};

function integer(env, name, fallback) {
  if (env[name] === undefined || env[name] === '') return fallback;
  const value = Number(env[name]);
  if (!Number.isInteger(value) || value < 0) throw new ConfigError(`${name} must be a whole number of milliseconds, got "${env[name]}"`);
  return value;
}

/** Turns the command line and the environment into one settings object. Throws ConfigError. */
export function parseConfig(argv, env) {
  let values;
  try {
    ({ values } = parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false }));
  } catch (error) {
    throw new ConfigError(`${error.message}\n${USAGE}`);
  }
  const baseText = values.base ?? env.EVIDENCE_BASE_DIR;
  if (!baseText) throw new ConfigError(`no base directory: pass --base DIR or set EVIDENCE_BASE_DIR\n${USAGE}`);
  if (values.only !== undefined && !['nasa', 'other'].includes(values.only)) throw new ConfigError(`--only must be "nasa" or "other", got "${values.only}"`);
  const otherText = values['other-text'] ?? (env.EVIDENCE_OTHER_TEXT || 'full');
  if (!['full', 'excerpts'].includes(otherText)) throw new ConfigError(`--other-text (or EVIDENCE_OTHER_TEXT) must be "full" or "excerpts", got "${otherText}"`);
  const siteRoot = resolve(env.SITE_ROOT ?? REPO);
  return {
    base: resolve(baseText),
    only: values.only ?? null,
    otherText,
    sync: !values['no-sync'],
    dryRun: Boolean(values['dry-run']),
    leads: Boolean(values.leads),
    requireGbrain: Boolean(values['require-gbrain']),
    siteRoot,
    evidenceFile: resolve(env.EVIDENCE_FILE ?? `${siteRoot}/data/evidence.json`),
    pageType: env.EVIDENCE_PAGE_TYPE || 'source',
    gitName: env.EVIDENCE_GIT_NAME || 'Evidence Base',
    gitEmail: env.EVIDENCE_GIT_EMAIL || 'evidence-base@localhost',
    hostPauseMs: integer(env, 'EVIDENCE_HOST_PAUSE_MS', 1500),
    retryMs: integer(env, 'EVIDENCE_RETRY_MS', 2000),
    env,
  };
}
