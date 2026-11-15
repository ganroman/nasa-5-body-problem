const VERDICTS = ['supported', 'partial', 'unsupported'];

export const SUPPORT_SCHEMA = {
  type: 'object',
  required: ['id', 'verdict', 'problems'],
  properties: {
    id: { type: 'string' },
    verdict: { enum: VERDICTS },
    problems: { type: 'array', items: { type: 'string' } },
  },
};

export const COVERAGE_SCHEMA = {
  type: 'object',
  required: ['page', 'assertions'],
  properties: {
    page: { type: 'string' },
    assertions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text', 'line', 'evidence'],
        properties: {
          text: { type: 'string' },
          line: { type: ['integer', 'null'] },
          evidence: { oneOf: [{ const: 'unbacked' }, { type: 'array', minItems: 1, items: { type: 'string' } }] },
        },
      },
    },
  },
};

export function parseJsonLoose(text) {
  const attempts = [text.trim(), text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()];
  const open = text.indexOf('{');
  const close = text.lastIndexOf('}');
  if (open >= 0 && close > open) attempts.push(text.slice(open, close + 1));
  for (const candidate of attempts) {
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    } catch { /* try the next form */ }
  }
  throw new Error(`the answer is not a JSON object: ${text.slice(0, 120).replace(/\s+/g, ' ')}`);
}

export function validateSupport(answer, expectedId) {
  const errors = [];
  if (answer.id !== expectedId) errors.push(`id is "${answer.id}", expected "${expectedId}"`);
  if (!VERDICTS.includes(answer.verdict)) errors.push(`verdict "${answer.verdict}" is not one of ${VERDICTS.join(', ')}`);
  if (!Array.isArray(answer.problems) || !answer.problems.every((p) => typeof p === 'string')) errors.push('problems must be a list of strings');
  else if (answer.verdict !== 'supported' && answer.problems.length === 0) errors.push(`verdict "${answer.verdict}" needs at least one problem`);
  return errors;
}

export function validateCoverage(answer, expectedPage, knownIds) {
  const errors = [];
  if (answer.page !== expectedPage) errors.push(`page is "${answer.page}", expected "${expectedPage}"`);
  if (!Array.isArray(answer.assertions)) return [...errors, 'assertions must be a list'];
  answer.assertions.forEach((item, index) => {
    const at = `assertions[${index}]`;
    if (typeof item?.text !== 'string' || !item.text.trim()) errors.push(`${at}.text must be a non-empty string`);
    if (item?.line !== null && !Number.isInteger(item?.line)) errors.push(`${at}.line must be an integer or null`);
    if (item?.evidence === 'unbacked') return;
    if (!Array.isArray(item?.evidence) || item.evidence.length === 0) errors.push(`${at}.evidence must be "unbacked" or a non-empty list of ids`);
    else for (const id of item.evidence) if (!knownIds.has(id)) errors.push(`${at}.evidence names unknown id "${id}"`);
  });
  return errors;
}
