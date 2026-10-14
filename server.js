const http = require('node:http');
const { once } = require('node:events');
const { setTimeout: sleep } = require('node:timers/promises');

const reset = '\x1b[0m';
const clearLine = '\r\x1b[2K';
const paint = (code, text) => `\x1b[${code}m${text}${reset}`;
const accent = '32';

const tasks = [
  {
    project: 'orbit-dashboard',
    title: 'Keep the search filters when switching pages',
    prompt: 'Build a multi-tenant SaaS analytics platform with team workspaces, role-based access, subscription billing, live dashboards, saved reports, and CSV exports. Include accessible UI states, audit logs, integration tests, and deployment documentation. Work in milestones; start by keeping search and report filters intact during pagination.',
    inspect: 'rg -n "searchParams|pagination" src/',
    found: 'src/search/filters.ts:18    src/search/pagination.ts:42\n     src/reports/saved-query.ts:36\n     src/workspaces/report-route.ts:81\n     tests/search/pagination.test.ts:24',
    thinking: 'Tracing how pagination rebuilds the query string',
    plan: 'Implementation plan:\n  1. Map workspace routes and saved-report state.\n  2. Preserve filters before setting the next page.\n  3. Cover report navigation with regression tests.\n  4. Review types, diffs, and integration boundaries.',
    file: 'src/search/pagination.ts',
    before: '- const query = new URLSearchParams();',
    after: '+ const query = new URLSearchParams(currentQuery);',
    test: 'npm test -- pagination',
    result: 'PASS pagination.test.ts\n     ✓ keeps workspace and date-range filters across pages\n     ✓ preserves saved report queries and sort direction\n     ✓ resets the cursor after a filter change\n     ✓ handles empty results and the last page\n     Test files: 1 passed\n     Tests: 12 tests passed | 0 failed | 0 skipped\n     Duration: 1.84s',
    details: 'Implementation result: Report pagination now carries the current workspace, date range, search phrase, and sort settings into the next request. The change stays inside the shared query builder, so saved reports and interactive dashboards follow the same navigation rules.\nValidation: Reviewed empty datasets, repeated page changes, saved-view links, and resetting a cursor after changing filters. The regression suite covers query preservation without changing the public report response shape.\nNext milestone: Connect saved report definitions to the workspace dashboard, then add export-job progress and audit events. Subscription enforcement and live dashboard refresh remain later milestones in the larger SaaS brief.',
    summary: 'Filters now survive page changes. Added a regression check.',
  },
  {
    project: 'harbor-api',
    title: 'Handle an empty activity feed',
    prompt: 'Build an enterprise customer-support platform with organizations, ticket queues, assignment rules, internal notes, notifications, and an activity timeline. Add permission checks, cursor pagination, API documentation, and integration coverage. Implement it incrementally; begin with a reliable activity-feed contract for new accounts.',
    inspect: 'rg -n "latestActivity|activities" src/',
    found: 'src/activity/service.ts:31    src/activity/route.ts:16\n     src/organizations/access.ts:52\n     src/activity/cursor.ts:19\n     tests/activity/service.test.ts:44',
    thinking: 'Checking the empty result path and response contract',
    plan: 'Implementation plan:\n  1. Trace organization access and timeline queries.\n  2. Return an empty list for new accounts.\n  3. Check pagination and response compatibility.\n  4. Validate types and API regression coverage.',
    file: 'src/activity/service.ts',
    before: '- return rows.map(toActivity);',
    after: '+ return (rows ?? []).map(toActivity);',
    test: 'npm test -- activity',
    result: 'PASS activity.test.ts\n     ✓ returns an empty list for a new organization\n     ✓ preserves the existing activity response envelope\n     ✓ keeps tenant access checks ahead of the query\n     ✓ accepts an empty terminal cursor\n     Test files: 1 passed\n     Tests: 9 tests passed | 0 failed | 0 skipped\n     Duration: 1.26s',
    details: 'Implementation result: New support organizations can load their activity timeline before any tickets or notes exist. Empty query results use the same list contract as populated timelines, allowing the UI to show its onboarding state without a special error path.\nValidation: Checked organization access, empty result handling, cursor boundaries, and serialization of existing events. Regression cases preserve the response envelope expected by the ticket sidebar and notification timeline.\nNext milestone: Add ticket assignment events, internal-note activity, and notification preferences. Queue routing and delivery workers remain separate milestones so the feed contract can be reviewed before those integrations are introduced.',
    summary: 'Empty feeds return a valid list. Existing responses preserved.',
  },
  {
    project: 'meadow-ui',
    title: 'Restore keyboard focus after closing the dialog',
    prompt: 'Build a project-management workspace with task boards, milestones, team invitations, searchable documents, and a shared component library. Support keyboard navigation, responsive layouts, loading states, and automated UI checks. Deliver this in small milestones; first make all shared dialogs restore keyboard focus correctly.',
    inspect: 'rg -n "onClose|triggerRef" src/components/',
    found: 'src/components/Dialog.tsx:27    src/components/Dialog.tsx:54\n     src/boards/TaskDialog.tsx:62\n     src/teams/InviteDialog.tsx:39\n     tests/components/Dialog.test.tsx:18',
    thinking: 'Following the close handler and keyboard navigation',
    plan: 'Implementation plan:\n  1. Audit dialogs across boards and team settings.\n  2. Restore focus to the element that opened each dialog.\n  3. Cover Escape, close buttons, and keyboard navigation.\n  4. Review shared component types and regression tests.',
    file: 'src/components/Dialog.tsx',
    before: '  setOpen(false);',
    after: '+ triggerRef.current?.focus();',
    test: 'npm test -- Dialog',
    result: 'PASS Dialog.test.tsx\n     ✓ restores focus after pressing Escape\n     ✓ restores focus after using the close button\n     ✓ handles a removed trigger without throwing\n     ✓ preserves keyboard navigation inside the dialog\n     Test files: 1 passed\n     Tests: 16 tests passed | 0 failed | 0 skipped\n     Duration: 2.17s',
    details: 'Implementation result: The shared dialog returns keyboard focus to its opening control after dismissal. Board details, milestone editors, and team invitations inherit the behavior through the existing component rather than adding separate focus handlers to each screen.\nValidation: Covered Escape, explicit close actions, keyboard traversal, and the case where the trigger disappears before dismissal. Component checks preserve the existing open-state contract and avoid introducing new page-level dependencies.\nNext milestone: Extend the shared component library with accessible menus and loading states, then connect milestone editing to the task board. Searchable documents and invitation delivery remain subsequent stages of the workspace project.',
    summary: 'Focus returns to the trigger on Escape and button close.',
  },
  {
    project: 'atlas-worker',
    title: 'Avoid retrying completed jobs',
    prompt: 'Build a background-processing platform for scheduled imports, webhook delivery, report generation, and email notifications. Include tenant isolation, retry policies, job history, metrics, and operational documentation. Work through the architecture in milestones; begin by making completed jobs safe from duplicate retry scheduling.',
    inspect: 'rg -n "retry|completedAt" src/jobs/',
    found: 'src/jobs/retry.ts:22    src/jobs/worker.ts:68\n     src/jobs/history.ts:47\n     src/queues/tenant-routing.ts:33\n     tests/jobs/retry.test.ts:21',
    thinking: 'Reviewing job state transitions before scheduling retries',
    plan: 'Implementation plan:\n  1. Map queue states and tenant-scoped job ownership.\n  2. Skip retries for jobs that already completed.\n  3. Check duplicate delivery and retry boundaries.\n  4. Validate worker types and regression coverage.',
    file: 'src/jobs/retry.ts',
    before: '  async function retry(job) {',
    after: '+   if (job.completedAt) return;',
    test: 'npm test -- retry',
    result: 'PASS retry.test.ts\n     ✓ skips retry scheduling for completed jobs\n     ✓ retains retry behavior for pending jobs\n     ✓ preserves tenant-scoped queue routing\n     ✓ handles repeated completion notifications\n     Test files: 1 passed\n     Tests: 11 tests passed | 0 failed | 0 skipped\n     Duration: 1.63s',
    details: 'Implementation result: Retry scheduling now checks completion state before adding another queue entry. Finished import, report, and notification jobs keep their completed status, while pending work continues through the existing retry policy and tenant routing.\nValidation: Reviewed duplicate completion notifications, pending retries, job-history updates, and queue ownership. Regression cases confirm that the completion guard does not bypass existing tenant checks or change the retry timing of unfinished work.\nNext milestone: Add structured retry metrics and operator-visible job history, followed by webhook delivery diagnostics. Scheduled import orchestration and reporting dashboards remain later milestones of the processing platform.',
    summary: 'Completed jobs stay completed. Pending retries still run.',
  },
];

function* thinking(label) {
  yield [`${label}\n`, 0];
  const ticks = 18 + Math.floor(Math.random() * 23);
  for (let tick = 0; tick < ticks; tick++) {
    yield [clearLine + paint(accent, `${'✶✻✽✻'[tick % 4]} Thinking...`), 120];
  }
  yield [clearLine, 0];
}

function* activityFrames(cols) {
  yield ['', 0];
  let index = Math.floor(Math.random() * tasks.length);
  while (true) {
    const task = tasks[index];
    yield ['\n' + paint('90', `  ~/projects/${task.project}\n`) +
      paint('90', '─'.repeat(cols - 1)) + '\n' +
      paint('1', wrapText(`❯ ${task.prompt}`, cols - 1)) + '\n' +
      paint('90', '─'.repeat(cols - 1)) + '\n' +
      `Current milestone: ${task.title}\n\n`, 2500];
    yield [paint('32', '● ') + paint('1', `Bash(${task.inspect})\n`), 700];
    yield* report(`  ⎿  ${task.found}`, cols);
    yield* thinking(task.thinking);
    yield [`● ${task.plan}\n\n`, 1200];
    yield [paint('32', '● ') + paint('1', `Update(${task.file})\n`) +
      paint('90', '  ⎿  Editing 1 file\n') +
      paint('31', `     ${task.before}\n`) + paint('32', `     ${task.after}\n\n`), 1600];
    yield* report(`● Implementation progress:\n  Reviewed entry points, shared consumers, and error paths.\n  Updated ${task.file} through the existing interface.\n  Added regression cases for the milestone boundary conditions.\n  Checking the change against the larger project brief.`, cols);
    yield* thinking('Checking the change against existing callers');
    yield [paint('32', '● ') + paint('1', 'Bash(git diff --check)\n') +
      paint('90', '  ⎿  No whitespace errors or conflict markers\n\n'), 1000];
    yield [paint('32', '● ') + paint('1', 'Bash(npm run typecheck)\n'), 800];
    yield* thinking('Validating shared types and module boundaries');
    yield* report('  ⎿  Workspace type check\n     shared contracts: passed\n     application modules: passed\n     route and component consumers: passed\n     Type check passed across workspace packages\n     Errors: 0 | Build artifacts: not emitted', cols);
    yield [paint('32', '● ') + paint('1', `Bash(${task.test})\n`), 800];
    yield* thinking('Running tests');
    yield* report(`  ⎿  ${task.result}`, cols, '32');
    yield* report(task.details, cols, '0');
    yield [paint(accent, '● Done. ') + `${task.summary}\n`, 2500];
    index = (index + 1) % tasks.length;
  }
}

function* report(text, cols, color = '90') {
  for (const paragraph of text.split('\n')) {
    yield [paint(color, wrapText(paragraph, cols - 1)) + '\n', 1200];
  }
  yield ['\n', 400];
}

function wrapText(text, width) {
  const lines = [''];
  for (const word of text.split(/\s+/)) {
    const last = lines.length - 1;
    if (lines[last].length + word.length + 1 > width) lines.push(word);
    else lines[last] += (lines[last] ? ' ' : '') + word;
  }
  return lines.join('\n');
}

function* frames(now = () => performance.now(), { cols = 80, rows = 24 } = {}) {
  const started = now();
  const lines = [''];
  const header = paint(accent, ' ▐▛███▜▌  ') + paint('1', 'Crude Code') + paint('90', ' / simulation\n') +
    paint(accent, '▝▜█████▛▘ ') + paint('90', 'Octopus 5.5 · Simulated usage\n') +
    paint(accent, '  ▘▘ ▝▝   ') + paint('90', '~/projects · Fictional coding activity\n\n');
  const divider = paint('90', '─'.repeat(cols - 1));
  let first = true;
  for (const [text, pause] of activityFrames(cols)) {
    for (const part of text.replaceAll(clearLine, '\r').split(/([\r\n])/)) {
      if (part === '\n') lines.push('');
      else if (part === '\r') lines[lines.length - 1] = '';
      else lines[lines.length - 1] += part;
    }
    const activityRows = rows - 10;
    if (lines.length > activityRows) lines.splice(0, lines.length - activityRows);
    const seconds = Math.max(0, Math.floor((now() - started) / 1000));
    const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
      .map((part) => String(part).padStart(2, '0')).join(':');
    const remaining = Math.max(0, 100 - Math.floor(seconds / 60));
    const status = `Working time: ${time} | Model: Octopus 5.5 | Limit left: ${remaining}%`;
    const prompt = `${divider}\n` + paint('1', '❯ ') + paint('90', 'Try "build a SaaS platform with teams, billing, and analytics"\n') +
      `${divider}\n` + paint('90', `${status}\n`) +
      paint('36', '  manual mode on') + paint('90', ' · playback only · Ctrl+C to leave');
    const body = (header + lines.join('\n')).replaceAll('\n', '\r\n\x1b[2K');
    const footer = prompt.replaceAll('\n', '\r\n\x1b[2K');
    yield [(first ? '\x1b[2J' : '') + '\x1b[H\x1b[2K' + body + '\x1b[J' +
      '\x1b[999;1H\x1b[4A\x1b[2K' + footer + '\x1b[3A\r\x1b[2C', pause];
    first = false;
  }
}

async function streamActivity(res, dimensions) {
  const controller = new AbortController();
  const { signal } = controller;
  const stop = () => controller.abort();
  res.once('close', stop);
  res.once('error', stop);
  try {
    for (const [text, pause] of frames(undefined, dimensions)) {
      signal.throwIfAborted();
      if (!res.write(text)) await once(res, 'drain', { signal });
      if (pause) await sleep(pause, undefined, { signal });
    }
  } catch (error) {
    if (!signal.aborted) {
      console.error('Stream failed:', error);
      res.destroy();
    }
  } finally {
    res.off('close', stop);
    res.off('error', stop);
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed\n');
  }
  const [path, query] = req.url.split('?', 2);
  if (path === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('ok\n');
  }
  if (path !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found\n');
  }
  const params = new URLSearchParams(query);
  const cols = Number(params.get('cols') ?? 80);
  const rows = Number(params.get('rows') ?? 24);
  if (!Number.isInteger(cols) || cols < 80 || cols > 400 ||
      !Number.isInteger(rows) || rows < 24 || rows > 200) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('cols must be 80–400 and rows must be 24–200 (integers).\n');
  }
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  res.flushHeaders();
  void streamActivity(res, { cols, rows });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`Agent simulator: http://localhost:${port}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close();
      server.closeAllConnections();
    });
  }
}

module.exports = { server, frames };
