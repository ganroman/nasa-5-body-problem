import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  chooseNext, computeVotes, findIssueForStory, markerStoryId, nextIssueNumber, normalizeIssues, proposalToStory, storyIssueText, storyMarker,
} from '../tools/library-rules.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const REPOSITORY = 'owner/name';
const NOW = '2026-11-15T12:00:00.000Z';
const LATER = '2026-11-15T13:00:00.000Z';

const story = (id, overrides = {}) => ({
  id,
  title: `Title of ${id}`,
  premise: `Premise of ${id}.`,
  evidence_status: 'partial',
  status_reason: `Reason for ${id}.`,
  state: 'proposed',
  basis: [],
  gaps: [],
  issue: null,
  ...overrides,
});

const rawIssue = (number, { labels = ['story'], likes = 0, comments = 0, body = '', state = 'open', title = `Issue ${number}` } = {}) => ({
  number,
  html_url: `https://github.com/${REPOSITORY}/issues/${number}`,
  title,
  body,
  state,
  created_at: `2026-11-0${(number % 9) + 1}T00:00:00Z`,
  labels: labels.map((name) => ({ name })),
  reactions: { '+1': likes, '-1': 0, total_count: likes },
  comments,
});

const votesFor = (stories, rawIssues) =>
  computeVotes({ stories, issues: normalizeIssues(rawIssues), repository: REPOSITORY, generatedAt: NOW });

describe('eligibility', () => {
  it('needs one like: zero likes waits, one like is eligible', () => {
    const votes = votesFor(
      [story('a', { issue: 1 }), story('b', { issue: 2 })],
      [rawIssue(1, { likes: 0 }), rawIssue(2, { likes: 1 })],
    );
    assert.equal(votes.stories.a.eligible, false);
    assert.equal(votes.stories.a.stage, 'proposed');
    assert.equal(votes.stories.b.eligible, true);
  });

  it('counts comments and reads the likes of the thumbs-up reaction only', () => {
    const issue = { ...rawIssue(1, { likes: 2, comments: 5 }), reactions: { '+1': 2, heart: 9, total_count: 11 } };
    const votes = votesFor([story('a', { issue: 1 })], [issue]);
    assert.deepEqual([votes.stories.a.likes, votes.stories.a.comments], [2, 5]);
  });

  it('reports a story without an issue as zero likes, not eligible, and no link', () => {
    const votes = votesFor([story('a')], []);
    assert.deepEqual(votes.stories.a, { issue: null, url: null, likes: 0, comments: 0, eligible: false, stage: 'proposed' });
    assert.equal(votes.next, null);
  });
});

describe('the next direction', () => {
  const stories = [story('low', { issue: 5 }), story('high-new', { issue: 9 }), story('high-old', { issue: 7 })];

  it('picks the most liked, and the oldest issue when likes tie', () => {
    const votes = votesFor(stories, [rawIssue(5, { likes: 2 }), rawIssue(9, { likes: 3 }), rawIssue(7, { likes: 3 })]);
    assert.equal(votes.next, 'high-old');
    assert.deepEqual(
      [votes.stories['high-old'].stage, votes.stories['high-new'].stage, votes.stories.low.stage],
      ['researching', 'eligible', 'eligible'],
    );
    assert.equal(nextIssueNumber(votes), 7);
  });

  it('picks nothing when no story has a like', () => {
    const votes = votesFor(stories, [rawIssue(5), rawIssue(9), rawIssue(7)]);
    assert.equal(votes.next, null);
    assert.equal(nextIssueNumber(votes), null);
  });

  it('never picks a published story, however many likes it has', () => {
    const withPublished = [story('done', { issue: 1, state: 'published' }), story('open', { issue: 2 })];
    const votes = votesFor(withPublished, [rawIssue(1, { likes: 10 }), rawIssue(2, { likes: 1 })]);
    assert.equal(votes.next, 'open');
    assert.equal(votes.stories.done.stage, 'published');
    assert.equal(votes.stories.done.eligible, true);
  });

  it('picks nothing when only a published story has likes', () => {
    const votes = votesFor([story('done', { issue: 1, state: 'published' })], [rawIssue(1, { likes: 4 })]);
    assert.equal(votes.next, null);
  });

  it('chooses from plain candidates in the same way', () => {
    const candidates = [
      { id: 'a', issue: 3, likes: 1, state: 'proposed' },
      { id: 'b', issue: 2, likes: 1, state: 'proposed' },
      { id: 'c', issue: 1, likes: 0, state: 'proposed' },
    ];
    assert.equal(chooseNext(candidates), 'b');
    assert.equal(chooseNext([]), null);
  });
});

describe('reader proposals', () => {
  const formBody = [
    '### The question', '', 'Can a spark travel through a sealed bag?', '',
    '### Why it matters', '', 'Bags are everywhere in cargo.', '',
    '### What you would like to see', '', 'A short story with a diagram.', '',
    '### Any source you know (optional)', '', '_No response_',
  ].join('\n');

  it('turns the issue form into a proposed hypothesis entry', () => {
    const entry = proposalToStory(normalizeIssues([rawIssue(12, { labels: ['story-proposal'], title: 'Proposal: Sparks in bags', body: formBody })])[0]);
    assert.equal(entry.id, 'proposal-12');
    assert.equal(entry.title, 'Sparks in bags');
    assert.equal(entry.premise, 'Can a spark travel through a sealed bag?');
    assert.equal(entry.evidence_status, 'hypothesis');
    assert.equal(entry.state, 'proposed');
    assert.equal(entry.issue, 12);
    assert.deepEqual(entry.basis, []);
    assert.equal(entry.gaps.length, 1);
  });

  it('records a source named by the reader as unchecked', () => {
    const body = formBody.replace('_No response_', 'https://example.org/paper');
    const entry = proposalToStory(normalizeIssues([rawIssue(12, { labels: ['story-proposal'], body })])[0]);
    assert.match(entry.gaps[1], /not yet checked: https:\/\/example\.org\/paper$/);
  });

  it('lists open proposals, skips closed ones and ones already turned into a story', () => {
    const votes = votesFor([story('promoted', { issue: 20 })], [
      rawIssue(20, { labels: ['story-proposal'] }),
      rawIssue(21, { labels: ['story-proposal'], title: 'Proposal: Open one' }),
      rawIssue(22, { labels: ['story-proposal'], state: 'closed' }),
    ]);
    assert.deepEqual(votes.proposals.map((p) => p.issue), [21]);
    assert.equal(votes.proposals[0].title, 'Open one');
  });

  it('can be the next direction once it has a like', () => {
    const votes = votesFor([story('a', { issue: 1 })], [rawIssue(1, { likes: 1 }), rawIssue(30, { labels: ['story-proposal'], likes: 3 })]);
    assert.equal(votes.next, 'proposal-30');
    assert.equal(nextIssueNumber(votes), 30);
    assert.equal(votes.proposals[0].eligible, true);
  });
});

describe('duplicate-issue protection', () => {
  it('writes a hidden marker into the issue body and reads it back', () => {
    const { body, labels } = storyIssueText(story('quiet-fire'));
    assert.ok(body.startsWith('<!-- cargo-passport-story:quiet-fire -->'));
    assert.equal(markerStoryId(body), 'quiet-fire');
    assert.deepEqual(labels, ['story']);
  });

  it('puts the premise, the evidence status and the voting rule in the body', () => {
    const { body } = storyIssueText(story('a', { evidence_status: 'hypothesis' }));
    assert.match(body, /Premise of a\./);
    assert.match(body, /\*\*Evidence status:\*\* A hypothesis: not yet backed by data\. Reason for a\./);
    assert.match(body, /thumbs-up reaction/);
  });

  it('finds an existing issue by marker, closed or open', () => {
    const issues = normalizeIssues([
      rawIssue(3, { body: `${storyMarker('other')}\ntext` }),
      rawIssue(4, { body: `${storyMarker('quiet-fire')}\ntext`, state: 'closed' }),
    ]);
    assert.equal(findIssueForStory(issues, 'quiet-fire').number, 4);
    assert.equal(findIssueForStory(issues, 'missing'), null);
  });

  it('ignores a reader proposal that copies a marker', () => {
    const issues = normalizeIssues([rawIssue(8, { labels: ['story-proposal'], body: storyMarker('quiet-fire') })]);
    assert.equal(findIssueForStory(issues, 'quiet-fire'), null);
  });
});

describe('boundary checks', () => {
  it('drops pull requests from the issue list', () => {
    assert.deepEqual(normalizeIssues([{ ...rawIssue(1), pull_request: {} }, rawIssue(2)]).map((i) => i.number), [2]);
  });

  it('fails loudly when an issue has no reaction counts', () => {
    const { reactions, ...withoutReactions } = rawIssue(1);
    assert.throws(() => normalizeIssues([withoutReactions]), /Issue #1 has no "\+1" reaction count/);
  });

  it('fails loudly when a story points at an issue that was not read', () => {
    assert.throws(() => votesFor([story('a', { issue: 99 })], []), /Story "a" points at issue #99/);
  });
});

describe('data/votes.json', () => {
  it('has the documented shape and agrees with data/stories.json', async () => {
    const [votes, stories] = await Promise.all(['votes', 'stories'].map(async (name) => JSON.parse(await readFile(`${REPO_ROOT}data/${name}.json`, 'utf8'))));
    assert.deepEqual(Object.keys(votes), ['generated_at', 'repository', 'stories', 'proposals', 'next']);
    assert.equal(votes.repository, 'Hantok/cargo-passport');
    const known = new Map(stories.map((s) => [s.id, s]));
    for (const [id, entry] of Object.entries(votes.stories)) {
      assert.ok(known.has(id), `votes.json has "${id}", which data/stories.json does not`);
      assert.equal(entry.issue, known.get(id).issue, `issue number of "${id}" differs between the two files`);
      assert.equal(entry.eligible, entry.likes >= 1, `eligible of "${id}" does not follow its likes`);
      assert.ok(['proposed', 'eligible', 'researching', 'published'].includes(entry.stage), `stage of "${id}"`);
    }
    assert.ok(votes.next === null || votes.next in votes.stories || votes.proposals.some((p) => votes.next === `proposal-${p.issue}`));
  });
});
