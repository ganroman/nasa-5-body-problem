import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export class BuildError extends Error {
  constructor(problems) {
    super(`build failed with ${problems.length} problem(s):\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    this.problems = problems;
  }
}

const readJson = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const isText = (value) => typeof value === 'string' && value.trim() !== '';

export const INTERACTIVES = ['passport', 'fleet'];

function shapeProblems(story, file) {
  const problems = [];
  const need = (ok, message) => { if (!ok) problems.push(`${file} ${message}`); };
  for (const field of ['id', 'title', 'dek', 'status', 'status_reason']) need(isText(story[field]), `has no text in "${field}"`);
  need(Array.isArray(story.beats) && story.beats.length > 0, 'needs a non-empty "beats" list');
  need(Array.isArray(story.limits) && story.limits.every(isText), '"limits" must be a list of texts');
  need(Array.isArray(story.open_questions) && story.open_questions.every((question) => isText(question?.text)), '"open_questions" must be a list of { text, story }');
  (story.beats ?? []).forEach((beat, b) => {
    need(isText(beat.id) && isText(beat.heading), `beats[${b}] needs "id" and "heading"`);
    need(Array.isArray(beat.sentences) && beat.sentences.every((sentence) => isText(sentence.text) && Array.isArray(sentence.evidence)),
      `beats[${b}].sentences must be a list of { text, evidence: [ids] }`);
    need((beat.sentences ?? []).every((sentence) => sentence.new_paragraph === undefined || sentence.new_paragraph === true),
      `beats[${b}].sentences carry "new_paragraph" with a value other than true`);
    need((beat.sentences ?? []).every((sentence) => sentence.computed === undefined || isText(sentence.computed)),
      `beats[${b}].sentences carry "computed" without a text that says how the value is computed`);
    for (const flag of ['illustrative', 'concept']) {
      need((beat.sentences ?? []).every((sentence) => sentence[flag] === undefined || sentence[flag] === true || sentence[flag] === false),
        `beats[${b}].sentences carry "${flag}" with a value other than true`);
    }
    need(beat.interactive === undefined || beat.interactive === null || INTERACTIVES.includes(beat.interactive),
      `beats[${b}].interactive is "${beat.interactive}", which is not one of ${INTERACTIVES.join(', ')} or null`);
    need(beat.link === undefined || beat.link === null || (isText(beat.link.story) && isText(beat.link.text)),
      `beats[${b}].link must be { story, text }`);
  });
  return problems;
}

function contentProblems(story, file, evidence, isHome) {
  const shape = shapeProblems(story, file);
  if (shape.length) return shape;
  const problems = [];
  const where = (path) => `${file} ${path}`;
  const check = (id, path) => {
    if (!evidence.has(id)) problems.push(`${where(path)} cites evidence id "${id}", which is not in data/evidence.json`);
  };
  story.beats.forEach((beat, b) => {
    beat.sentences.forEach((sentence, s) => sentence.evidence.forEach((id) => check(id, `beats[${b}].sentences[${s}]`)));
    if (beat.pull_quote) check(beat.pull_quote.evidence, `beats[${b}].pull_quote`);
    if (beat.interactive && !isHome) problems.push(`${where(`beats[${b}]`)} asks for the interactive "${beat.interactive}", which only the home story can show`);
  });
  if (isHome) {
    for (const name of INTERACTIVES) {
      const count = story.beats.filter((beat) => beat.interactive === name).length;
      if (count !== 1) problems.push(`${file} must have exactly one beat with "interactive": "${name}", it has ${count}`);
    }
  }
  return problems;
}

/** Open questions that name a story with no shelf entry: the page renders them without a link, so this is a warning. */
export const danglingQuestions = ({ shelf, stories }) => {
  const shelfIds = new Set(shelf.map((entry) => entry.id));
  return [...stories.values()].flatMap((story) => story.open_questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => typeof question.story === 'string' && !shelfIds.has(question.story))
    .map(({ question, index }) => `content/stories/${story.id}.json open_questions[${index}] names story "${question.story}", which has no entry in data/stories.json`));
};

/** Reads the three inputs and fails loudly, listing every problem at once. */
export function loadSite(root) {
  const shelf = readJson(root, 'data/stories.json');
  const passport = readJson(root, 'data/passport.json');
  const evidence = new Map(readJson(root, 'data/evidence.json').map((record) => [record.id, record]));
  const files = readdirSync(join(root, 'content/stories')).filter((name) => name.endsWith('.json')).sort();
  const loaded = files.map((name) => ({ file: `content/stories/${name}`, story: readJson(root, `content/stories/${name}`) }));
  const stories = new Map(loaded.map(({ file, story }) => [story.id, { file, story }]));
  const shelfIds = new Set(shelf.map((entry) => entry.id));
  const homes = shelf.filter((entry) => entry.home === true);

  const problems = [];
  if (homes.length !== 1) problems.push(`data/stories.json must mark exactly one entry with "home": true, it marks ${homes.length}`);
  const home = homes[0] ?? null;
  for (const [id, { file, story }] of stories) {
    if (!shelfIds.has(id)) problems.push(`${file} has no entry with id "${id}" in data/stories.json`);
    problems.push(...contentProblems(story, file, evidence, id === home?.id));
    for (const [b, beat] of (story.beats ?? []).entries()) {
      const target = beat.link?.story;
      if (target && (!stories.has(target) || target === home?.id)) problems.push(`${file} beats[${b}].link names story "${target}", which has no page of its own`);
    }
  }
  for (const entry of shelf) {
    if (entry.state === 'published' && !stories.has(entry.id)) {
      problems.push(`data/stories.json entry "${entry.id}" is published but content/stories/${entry.id}.json does not exist`);
    }
  }
  if (problems.length) throw new BuildError(problems);

  return { shelf, passport, evidence, home, stories: new Map([...stories].map(([id, { story }]) => [id, story])) };
}
