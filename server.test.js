const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { frames, server } = require('./server');

// Model the ANSI commands this display emits, including LF without an implicit CR.
function terminal(cols, rows) {
  const screen = Array.from({ length: rows }, () => Array(cols).fill(' '));
  let row = 0;
  let col = 0;
  const down = () => {
    if (++row === rows) {
      screen.shift();
      screen.push(Array(cols).fill(' '));
      row--;
    }
  };
  return {
    screen,
    write(text) {
      for (const match of text.matchAll(/\x1b\[([0-9;]*)([A-Za-z])|([^\x1b])/gu)) {
        if (match[2]) {
          const params = match[1].split(';').map(Number);
          const amount = params[0] || 1;
          switch (match[2]) {
            case 'H':
              row = Math.min(rows, amount) - 1;
              col = Math.min(cols, params[1] || 1) - 1;
              break;
            case 'A': row = Math.max(0, row - amount); break;
            case 'C': col = Math.min(cols - 1, col + amount); break;
            case 'K': screen[row].fill(' '); break;
            case 'J':
              if (params[0] === 2) screen.forEach((line) => line.fill(' '));
              else {
                screen[row].fill(' ', col);
                for (let line = row + 1; line < rows; line++) screen[line].fill(' ');
              }
              break;
          }
        } else if (match[3] === '\r') col = 0;
        else if (match[3] === '\n') down();
        else {
          if (col === cols) { col = 0; down(); }
          screen[row][col++] = match[3];
        }
      }
    },
  };
}

test('redraw clears old row tails and fills the requested terminal viewport', () => {
  for (const [cols, rows] of [[80, 24], [212, 52]]) {
    const display = terminal(cols, rows);
    const sequence = frames(() => 0, { cols, rows });
    for (let frame = 0; frame < 500; frame++) {
      const text = sequence.next().value[0];
      display.write(text);
      const freshDisplay = terminal(cols, rows);
      freshDisplay.write(text);
      assert.deepEqual(display.screen, freshDisplay.screen, 'no text from previous screens remains');
      assert.equal(display.screen[0].join('').trimEnd(), ' ▐▛███▜▌  Crude Code / simulation');
      assert.equal(display.screen[1].join('').trimEnd(), '▝▜█████▛▘ Octopus 5.5 · Simulated usage');
      assert.equal(display.screen[rows - 5].join(''), '─'.repeat(cols - 1) + ' ');
      assert.equal(display.screen[rows - 4].join('').trimEnd(), '❯ Try "build a SaaS platform with teams, billing, and analytics"');
      assert.equal(display.screen[rows - 3].join(''), '─'.repeat(cols - 1) + ' ');
    }
    assert.ok(display.screen.slice(rows - 9, rows - 6).some((line) => line.join('').trim()),
      'activity uses the available height above the footer');
    sequence.return();
  }
});

test('fictional tasks reach completion and keep cycling', () => {
  const sequence = frames();
  let output = '';
  let completions = 0;
  let lastCompletion;
  for (let count = 0; count < 2000 && completions < 5; count++) {
    const frame = sequence.next();
    assert.equal(frame.done, false);
    const [text, pause] = frame.value;
    assert.equal(typeof text, 'string');
    assert.ok(pause >= 0 && pause <= 2500);
    output += text;
    assert.match(text, /Try "build a SaaS platform/, 'every screen keeps the prompt visible');
    assert.match(text, /Crude Code.*simulation/, 'the compact header stays visible');
    assert.ok(text.includes('\x1b[32m ▐▛███▜▌  '), 'the crab mascot is green');
    assert.doesNotMatch(text, /[╭╮╰╯]/, 'use horizontal dividers instead of rounded boxes');
    assert.match(text, /\x1b\[999;1H\x1b\[4A/, 'anchor the prompt above the terminal bottom');
    const plainFrame = text.replace(/\x1b\[[0-9;]*m/g, '');
    const completion = plainFrame.match(/● Done\. ([^\r\n]+)/)?.[1];
    if (completion && completion !== lastCompletion) {
      completions++;
      lastCompletion = completion;
    }
  }
  sequence.return();
  assert.equal(completions, 5);
  assert.ok(output.startsWith('\x1b[2J\x1b[H'), 'clear and home before the welcome panel');
  assert.equal(output.split('\x1b[2J').length - 1, 1, 'clear only when the session starts');
  assert.equal(new Set(output.match(/~\/projects\/[a-z-]+/g)).size, 4);
  assert.match(output, /Fictional coding activity/);
  assert.match(output, /Crude Code.*simulation/);
  assert.match(output, /manual mode on/);
  assert.match(output, /❯ /);
  assert.match(output, /Bash\(rg /);
  assert.match(output, /Update\(/);
  assert.match(output, /tests passed/);
  assert.match(output, /Implementation plan:/);
  assert.match(output, /Current milestone:/);
  assert.match(output, /Bash\(npm run typecheck\)/);
  assert.match(output, /❯ Build /);
  assert.match(output, /Implementation progress:/);
  assert.match(output, /Implementation result:/);
  assert.match(output, /Validation:/);
  assert.match(output, /Next milestone:/);
  assert.match(output, /0 failed/);
  assert.match(output, /Build artifacts: not emitted/);
  const plain = output.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[JHKAC]/g, '\n');
  for (const line of plain.split(/[\r\n]/)) {
    assert.ok(line.length <= 80, `Line exceeds 80 columns: ${line}`);
  }
});

test('working time advances and the fictional limit stays within bounds per session', () => {
  let elapsed = 0;
  const sequence = frames(() => elapsed);
  assert.match(sequence.next().value[0], /Working time: 00:00:00.*Model: Octopus 5\.5.*Limit left: 100%/);
  const nextSpinner = () => {
    for (let count = 0; count < 200; count++) {
      const [text] = sequence.next().value;
      if (text.includes('Thinking...')) return text;
    }
    assert.fail('No thinking status frame found');
  };
  elapsed = 65_000;
  assert.match(nextSpinner(), /Working time: 00:01:05.*Limit left: 99%/);
  elapsed = 3_661_000;
  assert.match(nextSpinner(), /Working time: 01:01:01.*Limit left: 39%/);
  elapsed = 6_100_000;
  assert.match(nextSpinner(), /Limit left: 0%/);
  sequence.return();
  const anotherSession = frames(() => elapsed);
  assert.match(anotherSession.next().value[0], /Working time: 00:00:00.*Limit left: 100%/);
  anotherSession.return();
});

test('HTTP streams incrementally, handles routes, and cleans up on disconnect', async (t) => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(await (await fetch(`${base}/healthz`)).text(), 'ok\n');
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  for (const query of ['cols=79', 'cols=401', 'rows=23', 'rows=201', 'cols=NaN', 'rows=24.5']) {
    assert.equal((await fetch(`${base}/?${query}`)).status, 400);
  }
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');

  const request = http.get(`${base}/?cols=212&rows=52`);
  const [response] = await once(request, 'response');
  assert.equal(response.headers['x-accel-buffering'], 'no');
  assert.equal(response.headers['cache-control'], 'no-store, no-transform');
  assert.match(response.headers['content-type'], /text\/plain/);
  let text = '';
  let chunks = 0;
  for await (const chunk of response) {
    text += chunk;
    chunks++;
    if (text.includes('Bash(rg ')) break;
  }
  assert.ok(chunks >= 2, 'activity must arrive in separate timed chunks');
  assert.ok(text.startsWith('\x1b[2J\x1b[H'));
  assert.match(text, /Fictional coding activity/);
  assert.match(text, /❯ /);
  assert.match(text, /Try "build a SaaS platform/);
  assert.match(text, /Working time: 00:00:00.*Model: Octopus 5\.5.*Limit left: 100%/);
  assert.ok(text.includes('─'.repeat(211)), 'HTTP passes terminal dimensions to the renderer');
  request.destroy();
  // A fresh request must still succeed after the streaming viewer leaves.
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
});
