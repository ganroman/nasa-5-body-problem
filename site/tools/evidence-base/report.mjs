const quoteStart = (quote) => (quote.length > 90 ? `${quote.slice(0, 90)}...` : quote);

/** The sections of a run report, from what the run found. */
export function renderReport({ time, outcome, standing, synced, committed, syncProblem }) {
  const list = (items, line) => (items.length ? items.map(line).join('\n') : 'None.');
  return [
    `## Run at ${time}`,
    '',
    `Documents checked: ${outcome.checked}. New: ${outcome.fresh.length}. Changed: ${outcome.changed.length}. Unreachable this run: ${outcome.failed.length}.`,
    `Commit: ${committed ? 'made' : 'none (no file changed)'}.`,
    '',
    '### New documents',
    list(outcome.fresh, (doc) => `- ${doc.title} (${doc.url})`),
    '',
    '### Changed documents',
    list(outcome.changed, (doc) => `- ${doc.title} (${doc.url})`),
    '',
    '### Unreachable documents',
    list(outcome.failed, (doc) => `- ${doc.url}: ${doc.error}; failed ${doc.failures} run${doc.failures === 1 ? '' : 's'} in a row${doc.hasPage ? '; the last good text is kept' : '; no text yet'}`),
    '',
    '### Quotes no longer found',
    list(standing.missingQuotes, (item) => `- ${item.id} in ${item.url} (${item.locator || 'no locator'}): "${quoteStart(item.quote)}"`),
    '',
    '### Cited documents that failed three runs in a row',
    list(standing.stuck, (doc) => `- ${doc.url}: ${doc.failures} runs, last error: ${doc.error}`),
    '',
    '### Synced to gbrain',
    synced.length ? synced.map((line) => `- ${line}`).join('\n') : 'Nothing synced in this run.',
    ...(syncProblem ? ['', `The gbrain step FAILED: ${syncProblem}`] : []),
    '',
  ].join('\n');
}
