const MIN_LIKES = 1;
const LIKE_REACTION = '+1';

export const LABELS = {
  story: { name: 'story', color: '0e8a16', description: 'A story direction of the library. A thumbs-up reaction is a like.' },
  proposal: { name: 'story-proposal', color: '1d76db', description: 'A reader proposal for a new story direction.' },
  next: { name: 'next-up', color: 'fbca04', description: 'The direction the library develops next.' },
};

const EVIDENCE_STATUS_TEXT = {
  data: 'Rests on data.',
  partial: 'Rests partly on data.',
  hypothesis: 'A hypothesis: not yet backed by data.',
};

const MARKER_PATTERN = /<!--\s*cargo-passport-story:([a-z0-9-]+)\s*-->/;
const NO_RESPONSE = '_No response_';
const PROPOSAL_TITLE_PREFIX = /^proposal:\s*/i;

export const storyMarker = (id) => `<!-- cargo-passport-story:${id} -->`;
export const markerStoryId = (body) => MARKER_PATTERN.exec(body)?.[1] ?? null;
const proposalId = (issueNumber) => `proposal-${issueNumber}`;
const isEligible = (likes) => likes >= MIN_LIKES;

/**
 * Turns the issue objects of the GitHub REST API into the shape the rules use.
 * Pull requests are dropped. A missing field is an error, never a zero.
 */
export function normalizeIssues(rawIssues) {
  return rawIssues.filter((raw) => !raw.pull_request).map(normalizeIssue);
}

function normalizeIssue(raw) {
  for (const field of ['number', 'html_url', 'title', 'state', 'created_at', 'labels', 'comments']) {
    if (raw[field] === undefined) throw new Error(`Issue #${raw.number ?? '?'} has no "${field}" field`);
  }
  if (typeof raw.reactions?.[LIKE_REACTION] !== 'number') throw new Error(`Issue #${raw.number} has no "${LIKE_REACTION}" reaction count`);
  return {
    number: raw.number,
    url: raw.html_url,
    title: raw.title,
    body: raw.body ?? '',
    state: raw.state,
    created_at: raw.created_at,
    labels: raw.labels.map((label) => (typeof label === 'string' ? label : label.name)),
    likes: raw.reactions[LIKE_REACTION],
    comments: raw.comments,
  };
}

/**
 * Finds the issue that belongs to a story by the hidden marker in its body.
 * Only issues with the "story" label count, so a reader cannot claim a story by copying its marker.
 */
export function findIssueForStory(issues, storyId) {
  return issues.find((issue) => issue.labels.includes(LABELS.story.name) && markerStoryId(issue.body) === storyId) ?? null;
}

export function storyIssueText(story) {
  const body = [
    storyMarker(story.id),
    story.premise,
    `**Evidence status:** ${EVIDENCE_STATUS_TEXT[story.evidence_status]} ${story.status_reason}`,
    `**How to vote:** add a thumbs-up reaction to this issue. The library develops a direction further only if it has at least ${MIN_LIKES} like. With no like it waits.`,
    '**How to discuss:** write a comment below.',
  ].join('\n\n');
  return { title: story.title, body, labels: [LABELS.story.name] };
}

/**
 * Reads the sections of a GitHub issue form body ("### Field" followed by the answer).
 * A body without sections counts as one unnamed answer.
 */
function formSections(body) {
  const sections = new Map();
  const parts = body.split(/^### +(.+)$/m);
  if (parts.length === 1) return sections.set('', body.trim());
  for (let i = 1; i < parts.length; i += 2) {
    const answer = parts[i + 1].trim();
    sections.set(parts[i].trim(), answer === NO_RESPONSE ? '' : answer);
  }
  return sections;
}

/** Turns a reader proposal issue into a proposed story entry. */
export function proposalToStory(issue) {
  const sections = formSections(issue.body);
  const question = sections.get('The question') ?? sections.get('') ?? '';
  const source = sections.get('Any source you know (optional)') ?? '';
  const title = issue.title.replace(PROPOSAL_TITLE_PREFIX, '').trim() || question.split('\n')[0].slice(0, 80);
  return {
    id: proposalId(issue.number),
    title,
    premise: question,
    evidence_status: 'hypothesis',
    status_reason: 'A reader proposed this direction. No evidence has been collected for it yet.',
    state: 'proposed',
    basis: [],
    gaps: ['No evidence has been collected yet.', ...(source ? [`Source named by the reader, not yet checked: ${source}`] : [])],
    issue: issue.number,
  };
}

/**
 * The next direction: the eligible, unpublished candidate with the most likes.
 * Ties go to the oldest issue (the lowest issue number). Returns an id or null.
 */
export function chooseNext(candidates) {
  const open = candidates.filter((candidate) => candidate.state !== 'published' && isEligible(candidate.likes));
  open.sort((a, b) => b.likes - a.likes || a.issue - b.issue);
  return open[0]?.id ?? null;
}

function stageOf({ state, eligible, isNext }) {
  if (state === 'published') return 'published';
  if (isNext) return 'researching';
  return eligible ? 'eligible' : 'proposed';
}

function issueOfStory(story, issuesByNumber) {
  if (story.issue === null) return null;
  const issue = issuesByNumber.get(story.issue);
  if (!issue) throw new Error(`Story "${story.id}" points at issue #${story.issue}, which was not read`);
  return issue;
}

function openProposals(issues, stories) {
  const storyIssues = new Set(stories.map((story) => story.issue));
  return issues
    .filter((issue) => issue.state === 'open' && issue.labels.includes(LABELS.proposal.name) && !storyIssues.has(issue.number))
    .sort((a, b) => a.number - b.number);
}

/**
 * The content of data/votes.json: counts, eligibility and stage for every story,
 * the open reader proposals, and the next direction.
 */
export function computeVotes({ stories, issues, repository, generatedAt }) {
  const issuesByNumber = new Map(issues.map((issue) => [issue.number, issue]));
  const storyRows = stories.map((story) => ({ story, issue: issueOfStory(story, issuesByNumber) }));
  const proposals = openProposals(issues, stories);

  const candidates = [
    ...storyRows.map(({ story, issue }) => ({ id: story.id, issue: story.issue, likes: issue?.likes ?? 0, state: story.state })),
    ...proposals.map((issue) => ({ id: proposalId(issue.number), issue: issue.number, likes: issue.likes, state: 'proposed' })),
  ];
  const next = chooseNext(candidates);

  return {
    generated_at: generatedAt,
    repository,
    stories: Object.fromEntries(storyRows.map(({ story, issue }) => {
      const likes = issue?.likes ?? 0;
      const eligible = isEligible(likes);
      const stage = stageOf({ state: story.state, eligible, isNext: story.id === next });
      return [story.id, { issue: story.issue, url: issue?.url ?? null, likes, comments: issue?.comments ?? 0, eligible, stage }];
    })),
    proposals: proposals.map((issue) => ({
      issue: issue.number,
      url: issue.url,
      title: proposalToStory(issue).title,
      likes: issue.likes,
      comments: issue.comments,
      eligible: isEligible(issue.likes),
    })),
    next,
  };
}

/** The issue number of the chosen direction, or null. */
export function nextIssueNumber(votes) {
  if (votes.next === null) return null;
  return votes.stories[votes.next]?.issue ?? votes.proposals.find((proposal) => proposalId(proposal.issue) === votes.next).issue;
}

/** True when two vote files differ only in generated_at. */
export function sameVotes(a, b) {
  return JSON.stringify({ ...a, generated_at: null }) === JSON.stringify({ ...b, generated_at: null });
}
