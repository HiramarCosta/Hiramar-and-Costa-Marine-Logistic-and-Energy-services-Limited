#!/usr/bin/env node
/**
 * browser-check — drive the user's real Chrome, screenshot a page,
 * and report console errors + failed network requests as JSON.
 *
 *   node browser-check.mjs "<url>" "<outName>" "<profile>"
 *
 *   url      required, e.g. http://localhost:8080/admin.html
 *   outName  screenshot base name        (default: derived from the URL)
 *   profile  Chrome profile directory    (default: Default)
 *
 * Runs headed and maximized on purpose — the point is that the user
 * watches it happen. Chrome must be closed first: it locks the profile.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots');

const [, , urlArg, nameArg, profileArg] = process.argv;

if (!urlArg) {
  console.error('Usage: node browser-check.mjs "<url>" ["<outName>"] ["<profile>"]');
  process.exit(2);
}

const profile = profileArg || 'Default';
const outName =
  nameArg ||
  urlArg.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) ||
  'shot';

// BROWSER_CHECK_USER_DATA lets you point at a throwaway profile (useful for
// testing, or when you cannot close your main Chrome window).
const USER_DATA =
  process.env.BROWSER_CHECK_USER_DATA ||
  join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');

if (!existsSync(USER_DATA)) {
  console.error(JSON.stringify({ ok: false, error: `Chrome user data not found at ${USER_DATA}` }));
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

const consoleErrors = [];
const failedRequests = [];
const pageErrors = [];

let context;
try {
  context = await chromium.launchPersistentContext(USER_DATA, {
    channel: 'chrome',
    headless: false,                       // the user wants to watch
    viewport: null,                        // real window, not a fixed viewport
    args: [`--profile-directory=${profile}`, '--start-maximized'],
    ignoreDefaultArgs: ['--enable-automation']
  });
} catch (err) {
  console.error(JSON.stringify({
    ok: false,
    error: String(err.message || err),
    hint: 'Close Google Chrome completely first — it locks the profile while running.'
  }, null, 2));
  process.exit(1);
}

const page = context.pages()[0] || (await context.newPage());

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
page.on('requestfailed', (req) => {
  failedRequests.push({ url: req.url(), reason: req.failure()?.errorText || 'unknown' });
});
page.on('response', (res) => {
  if (res.status() >= 400) failedRequests.push({ url: res.url(), status: res.status() });
});

let status = null;
let error = null;

try {
  await page.bringToFront();
  const res = await page.goto(urlArg, { waitUntil: 'networkidle', timeout: 45000 });
  status = res ? res.status() : null;
  await page.waitForTimeout(1200);          // let fonts, images and animations settle
} catch (err) {
  error = String(err.message || err);
}

const shotPath = join(SHOTS, `${outName}.png`);
try {
  await page.screenshot({ path: shotPath, fullPage: true });
} catch (err) {
  error = error || `screenshot failed: ${err.message}`;
}

const report = {
  ok: !error && status !== null && status < 400 && consoleErrors.length === 0 && pageErrors.length === 0,
  url: urlArg,
  status,
  screenshot: shotPath,
  title: await page.title().catch(() => null),
  consoleErrors,
  pageErrors,
  failedRequests,
  error
};

console.log(JSON.stringify(report, null, 2));

await context.close();
process.exit(report.ok ? 0 : 1);
