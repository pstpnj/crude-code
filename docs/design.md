# Terminal Agent Simulator Design

Status: Design confirmed by the user. Implemented and checked locally; public deployment pending.

## Agreed decisions

- Viewers connect to a public URL using curl alone, without installation or a separate script.
- The display presents scripted task sequences with varied pauses and fictional project names.
- Use detailed multi-feature project briefs, wrapped to the terminal width, with implementation plans and incremental milestones. Include simulated diff review, workspace type checks, and tests.
- Stream expanded result sections progressively, including inspected files, implementation progress, package checks, individual test cases, and detailed implementation, validation, and next-milestone reports. Wrap paragraphs to the terminal width.
- Sequences portray project inspection, code edits, tests, and completion.
- Displayed commands do not execute.
- Match the supplied screenshot with a persistent compact mascot header, a display-only prompt between gray horizontal dividers, and a bottom mode hint. Keep live status below the prompt. Use the supplied terminal width and height for dividers and activity history; default to 80×24 because curl does not send dimensions. Accept 80–400 columns and 24–200 rows through cols/rows query parameters. Reconnect after resizing.
- Clear each redrawn row and use explicit carriage returns with line feeds to prevent stale text and terminal-dependent overlap. Regression checks emulate consecutive frames at 80×24 and 212×52.
- Clear the visible terminal and move to the top-left once per connection before showing the welcome panel; retain scrollback.
- Use the Crude Code name, a green crab mascot and accents, prompt markers, and Bash/Update tool-call rows. Keep the simulation label visible and retain the timer and simulated quota; the displayed model is Octopus 5.5.
- Continue cycling through fictional tasks until the viewer presses Ctrl+C.
- Include a built-in mix of coding tasks with fictional project names, without viewer customization in the first version.
- Hosting must be free.
- Show elapsed connection time, a fictional model name, and a simulated remaining limit during thinking and at completion. Each connection starts fresh; the fake limit drops from 100% by one point per minute, bottoms out at 0%, and does not gate playback.

## Confirmed delivery

- Keep curl-only streaming, with no local Bash script.
- GitHub stores the source code; a free Node.js web service runs the stream.
- Render is the selected initial deployment target.

## Hosting research

- GitHub Pages serves static files; it cannot run the continuously timed server stream envisioned for curl alone.
- A static shell script can be hosted on GitHub and downloaded with curl. Bash on the viewer's computer would provide the timing, colors, and repetition.
- Choosing the shell script changes the viewer requirement from curl alone to curl plus Bash.
- Source: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Reference: parrot.live

- The user supplied https://github.com/hugomd/parrot.live as the intended delivery experience.
- Its Node.js HTTP server repeatedly sends ANSI screen-control sequences and colored frames over an open response. The source schedules frames approximately every 70 milliseconds.
- Its nginx configuration disables proxy buffering and forwards requests to the Node.js server on port 3000. GitHub stores the source; GitHub Pages does not run this server.
- The same streaming approach can display fictional agent activity with curl alone, without a local Bash script.
- Sources: https://github.com/hugomd/parrot.live/blob/master/index.js and https://github.com/hugomd/parrot.live/blob/master/nginx.conf
- Candidate hosting: Render offers free Node.js web services. Free services sleep after 15 minutes without inbound traffic and take about a minute to wake; monthly usage limits also apply. Long-running curl sessions still require deployment verification.
- Source: https://render.com/docs/free
