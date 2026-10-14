# Crude Code — AI agent working, via curl

A fictional AI coding session streamed to your terminal, like parrot.live,
with a compact green crab mascot header, green accents, prompt markers,
tool-call output, and animated thinking indicator. This is an independent
simulation; the prompt is part of the playback, not an interactive input.
Commands, edits, and test results are scripted text. No AI service is called and
none of the displayed commands execute.

## Quick start on Windows

1. Open PowerShell in this project folder.
2. Start the server and leave that terminal open:

   ```powershell
   npm start
   ```

3. Open a second PowerShell terminal and run:

   ```powershell
   curl.exe -N "http://localhost:3000/?cols=$([Console]::WindowWidth)&rows=$([Console]::WindowHeight)"
   ```

Press **Ctrl+C** in the viewer to leave. Press **Ctrl+C** in the server terminal
to stop the server. The prompt area is display-only and does not accept input.

## Requirements and other viewing commands

The server needs Node.js 22 or newer. No dependencies or installation step.

```sh
npm start
```

In another terminal:

```sh
curl -N http://localhost:3000
```

On Windows PowerShell use `curl.exe -N http://localhost:3000` to avoid the
`curl` alias in older PowerShell versions. Viewers need curl and a terminal
that supports ANSI colors and cursor positioning, at least 80 columns by 24 rows.
To use your full terminal size in PowerShell:

```powershell
curl.exe -N "http://localhost:3000/?cols=$([Console]::WindowWidth)&rows=$([Console]::WindowHeight)"
```

In macOS/Linux shells with `tput`:

```sh
curl -N "http://localhost:3000/?cols=$(tput cols)&rows=$(tput lines)"
```

Curl does not send terminal dimensions automatically. Without these parameters,
the display uses 80×24. Accepted sizes are 80–400 columns and 24–200 rows.
Reconnect with the command above after resizing the terminal.

You can also specify the size manually:

```sh
curl -N "http://localhost:3000/?cols=160&rows=45"
```

Use dimensions that match your terminal. `-N` disables curl output buffering
so animation updates appear immediately.

Press Ctrl+C to leave. Bash is not required.
Each connection clears the visible terminal and moves to the top-left before
showing the compact header. Scrollback is retained; window size and OS fullscreen
are controlled by your terminal application.

A prompt between horizontal dividers stays anchored to the bottom of the terminal,
with the live status and mode hint underneath, following the supplied screenshot.
The compact header stays at the top; activity uses the available rows above the
footer, and dividers span the supplied width minus one column to avoid wrapping.
Every redrawn row is cleared and positioned explicitly to prevent leftover text.
The prompt is display-only: curl does not send typed prompts.

Tasks cycle through four fictional projects, with inspection, thinking spinners,
edits, tests, and completion. Each connection gets its own session. To change the
stories, edit the `tasks` array in `server.js`.
Each project starts with a detailed build request covering several features,
followed by an implementation plan and a current milestone. Long requests wrap
to the supplied terminal width. Simulated checks include diff review, workspace
type checking, and tests; each completion finishes a milestone of the larger brief.
Results stream in readable sections: file inspection, implementation progress,
package checks, named test cases, and detailed implementation, validation, and
next-milestone reports. Long result paragraphs wrap to the terminal width too.

The status shows elapsed working time for your connection, a fictional model
(`Octopus 5.5`), and a simulated limit remaining. The limit starts at 100%, drops
one percentage point per minute, and stops at 0%; it does not stop playback.
Time and limit update with each animation frame. Every connection
starts fresh. These values are not connected to any real model or account quota.

## Publish for free

1. Push this directory to a GitHub repository.
2. In [Render](https://dashboard.render.com/), choose **New > Blueprint** and
   connect that repository. The included `render.yaml` selects the **Free** plan.
3. Deploy, then copy the service's actual public URL:

```sh
curl -N https://YOUR-SERVICE.onrender.com
```

For a full-window display on Windows, replace `YOUR-SERVICE` with the deployed
service name:

```powershell
curl.exe -N "https://YOUR-SERVICE.onrender.com/?cols=$([Console]::WindowWidth)&rows=$([Console]::WindowHeight)"
```

GitHub hosts the source code; Render runs the HTTP server. GitHub Pages alone
cannot run it. `PORT` is supplied by the host (defaults to 3000 locally), and
`/healthz` is the health check.

[Render's free services](https://render.com/docs/free) sleep after 15 minutes
without inbound traffic, take about a minute to wake, and have monthly usage
limits. Without a payment method, bandwidth overages suspend free services
instead of charging. A long-running curl response is not a guarantee against
idle suspension: outbound animation is not a new inbound request. If the host
closes a connection, rerun curl. Continuous public playback must be checked on
the deployed service; this app does not bypass hosting limits.

If adding your own reverse proxy, disable response buffering (for nginx:
`proxy_buffering off;`) so updates reach curl immediately.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Cannot connect to localhost | Start the server with `npm start` and leave it running. |
| Display uses only part of the window | Use the command that sends your terminal's width and height. |
| Text overlaps after resizing | Stop the viewer and reconnect with the updated terminal dimensions. |
| Old layout appears after editing code | Stop and restart the server, then reconnect the viewer. |
| HTTP 400 response | Use whole numbers: `cols` between 80 and 400, `rows` between 24 and 200. |
| Strange characters or escape codes | Use an ANSI-compatible terminal, such as Windows Terminal. |
| Typing in the prompt does nothing | The prompt is part of the animation; curl does not send typed prompts. |
| Public URL is slow or disconnects | Allow the free host to wake, then rerun curl if needed. |

## Customize and check

Edit the `tasks` array in `server.js` to change fictional project names, commands,
edits, and results. The model name and appearance are also in that file.
Restart the server after making changes.

To use another local port in PowerShell:

```powershell
$env:PORT = '3001'
npm start
```

Then replace `3000` with `3001` in the viewer URL.

Run the checks:

```sh
npm test
```

Uses Node's built-in test runner to check task cycling, timed HTTP streaming,
disconnect handling, and the health/error routes.
