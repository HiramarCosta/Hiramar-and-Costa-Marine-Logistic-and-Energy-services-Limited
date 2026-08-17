---
name: browser-check
description: Drive real Chrome (the user's profile + logins) to open a URL, click through the running site, screenshot it, capture console/network errors, and autonomously fix issues found. Use when asked to "open my browser", visually check a page, verify a UI change in the real site, or run an observe→fix→recheck loop. Triggers: "check it in the browser", "open the browser and look", "screenshot the site", "browser-check".
---

# browser-check

Gives Claude eyes on the running site: launches the user's real Chrome (with their
logins) via Playwright, navigates, screenshots, and captures errors. Combine with
Edit/Write to close the observe → diagnose → fix → re-check loop.

## Setup

Already done in this project:
- `playwright-core` installed here in `node_modules/` (13 MB — it drives the
  **installed Google Chrome**, it does not download its own browser).
- Helper: `browser-check.mjs`. Screenshots land in `shots/`.

## How to run a check

Run from the skill directory so `playwright-core` resolves:

```
cd .claude/skills/browser-check && node browser-check.mjs "<url>" "<outName>" "<profile>"
```

- `<url>` — e.g. `http://localhost:8080/admin.html`
- `<outName>` — screenshot base name (optional; derived from the URL if omitted)
- `<profile>` — Chrome profile: `Default`, `Profile 1`, … (optional, default `Default`)

Then **Read** `shots/<outName>.png` to see the page, and inspect the JSON output for
`status`, `consoleErrors`, `pageErrors` and `failedRequests`.

Exit code is `0` when the page loaded clean, `1` when anything was wrong — so it can
gate a loop.

## Preconditions

1. **Close Chrome first** — Chrome locks the profile while open; the launch fails
   otherwise. The error message says so explicitly if you forget.
   To check a page without closing Chrome, point at a throwaway profile:
   `BROWSER_CHECK_USER_DATA=/tmp/some-profile node browser-check.mjs "<url>"`
   (no saved logins in that case).
2. **Local server running.** This project is static files served on port 8080:
   ```
   python3 -m http.server 8080 --bind 127.0.0.1
   ```
   or double-click `Start Website.command`. Confirm with
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` before navigating.
3. Pick the right **profile** — the user's logins may live in a specific profile
   (Default or Profile 1–5). Ask if unsure which.

## The autonomous loop

1. Start the server if needed; confirm it responds.
2. Run `browser-check.mjs` against the target URL.
3. Read the screenshot + error JSON.
4. If something is wrong, locate the cause (`index.html`, `admin.html`,
   `assets/css/styles.css`, `assets/js/*.js`) and Edit the fix.
5. Re-run the check on the same URL and compare. Repeat until clean.
6. Summarize what was broken and what changed.

## Pages worth checking in this project

| Page | URL |
|---|---|
| Landing page | `http://localhost:8080/` |
| Equipment manager | `http://localhost:8080/admin.html` |

## Visibility (required)

The user wants to WATCH the automation on their screen. Always run **headed**
(`headless: false`), **maximized** (`viewport: null` + `--start-maximized`), and call
`page.bringToFront()` so the window surfaces in front of their other windows. Never run
headless or let the window stay hidden in the background. `browser-check.mjs` already
does all three.

## Notes

- Full-page screenshots; window is maximized (not a fixed viewport). Landing-page
  shots come out very tall (~2900×14000) — crop before reading if you only need one
  section.
- For multi-step flows (fill the enquiry form, add equipment, click through), extend
  `browser-check.mjs` or write a one-off script in the scratchpad using the same
  `launchPersistentContext` setup.
- CLI-based, so it works without reloading Claude Code.
