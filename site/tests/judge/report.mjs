const count = (list, test) => list.filter(test).length;

export function buildReport({ model, mode, support, coverage }) {
  const assertions = coverage.flatMap((page) => page.assertions ?? []);
  const totals = {
    support: Object.fromEntries(['supported', 'partial', 'unsupported', 'error'].map((v) => [v, count(support, (r) => r.verdict === v)])),
    coverage: {
      pages: coverage.length,
      page_errors: count(coverage, (page) => page.error),
      assertions: assertions.length,
      backed: count(assertions, (a) => a.evidence !== 'unbacked'),
      unbacked: count(assertions, (a) => a.evidence === 'unbacked'),
    },
  };
  const pass = totals.support.unsupported === 0 && totals.support.error === 0 && totals.coverage.unbacked === 0 && totals.coverage.page_errors === 0;
  const judges = [...new Set([...support, ...coverage].map((r) => r.judge))].sort();
  return { date: new Date().toISOString(), model, mode, judges, pass, totals, support, coverage };
}

export function renderMarkdown(report) {
  const { totals } = report;
  const lines = [
    '# Judge report',
    '',
    `- Date: ${report.date}`,
    `- Model: ${report.model}`,
    `- Mode: ${report.mode}`,
    `- Judge(s): ${report.judges.join(', ') || 'none'}`,
    `- Result: ${report.pass ? 'PASS' : 'FAIL'}`,
    '',
    '## Totals',
    '',
    `- Support: ${totals.support.supported} supported, ${totals.support.partial} partial, ${totals.support.unsupported} unsupported, ${totals.support.error} error`,
    `- Coverage: ${totals.coverage.assertions} assertions on ${totals.coverage.pages} page(s), ${totals.coverage.backed} backed, ${totals.coverage.unbacked} unbacked, ${totals.coverage.page_errors} page error(s)`,
    '',
    '## Support, per evidence item',
    '',
    '| Evidence id | Verdict | Problems |',
    '| --- | --- | --- |',
    ...report.support.map((r) => `| ${r.id} | ${r.verdict} | ${r.problems.join(' ') || '-'} |`),
    '',
    '## Coverage, per page',
  ];
  for (const page of report.coverage) {
    lines.push('', `### ${page.page}`, '');
    if (page.error) lines.push(`Error: ${page.error}`);
    else if (!page.assertions.length) lines.push('No assertions listed.');
    else lines.push('| Line | Assertion | Evidence |', '| --- | --- | --- |', ...page.assertions.map((a) => `| ${a.line ?? '-'} | ${a.text.replaceAll('|', '\\|')} | ${a.evidence === 'unbacked' ? '**unbacked**' : a.evidence.join(', ')} |`));
  }
  return `${lines.join('\n')}\n`;
}
