import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PAGES = ['index.html', 'stories/quiet-fire/index.html'];

export const siteRoot = () => resolve(process.env.SITE_ROOT ?? REPO);
export const evidencePath = () => resolve(process.env.EVIDENCE_FILE ?? `${siteRoot()}/data/evidence.json`);
export const passportPath = () => `${siteRoot()}/data/passport.json`;

export function loadEvidence() {
  const path = evidencePath();
  if (!existsSync(path)) return { path, status: 'missing', items: [] };
  try {
    const items = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(items)) return { path, status: 'invalid', items: [], error: 'top level is not an array' };
    return { path, status: 'ok', items };
  } catch (error) {
    return { path, status: 'invalid', items: [], error: error.message };
  }
}

export const missingEvidenceMessage = ({ path, status, error }) =>
  status === 'missing'
    ? `${path} does not exist: no verified evidence has been delivered, so the evidence gates cannot run`
    : `${path} is not a valid evidence file: ${error}`;
