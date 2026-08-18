#!/usr/bin/env node
/**
 * contact-flow — end-to-end check of the new /contact page:
 * contact details, map, email/telephone links, validation, a real
 * submission, the navigation menu and the mobile layout.
 */
import { chromium, devices } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE  = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots');
mkdirSync(SHOTS, { recursive: true });

const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const USER_DATA = process.env.BROWSER_CHECK_USER_DATA || '/tmp/hc-browser-check';

const results = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

function check(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail === undefined ? '' : String(detail) });
}

const context = await chromium.launchPersistentContext(USER_DATA, {
  channel: 'chrome',
  headless: false,
  viewport: null,
  args: ['--start-maximized'],
  ignoreDefaultArgs: ['--enable-automation']
});

const page = context.pages()[0] || (await context.newPage());
page.on('console',       m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror',     e => pageErrors.push(String(e.message || e)));
page.on('requestfailed', r => failedRequests.push({ url: r.url(), reason: r.failure()?.errorText }));
page.on('response',      r => { if (r.status() >= 400) failedRequests.push({ url: r.url(), status: r.status() }); });

await page.bringToFront();

/* ---------- 1. the contact page loads ---------- */
const res = await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle', timeout: 45000 });
check('/contact responds 200', res && res.status() === 200, res && res.status());
await page.waitForTimeout(1500);
check('title is the contact page', (await page.title()).includes('Contact Us'), await page.title());

/* ---------- 2. details arrive from the database ---------- */
const email = await page.getAttribute('#cEmail', 'href');
const phone = await page.getAttribute('#cPhone', 'href');
const addr  = (await page.textContent('#cAddress') || '').trim();
const hours = (await page.textContent('#cHours')   || '').trim();
const rc    = (await page.textContent('#cRc')      || '').trim();

check('email link is a mailto:',  /^mailto:.+@.+/.test(email || ''), email);
check('telephone link is a tel:', /^tel:\+?\d{6,}$/.test((phone || '').replace(/\s/g, '')), phone);
check('address is filled in',     addr.length > 2, addr);
check('business hours filled in', hours.length > 2, hours);
check('RC number filled in',      rc.length > 2, rc);

/* ---------- 3. the map points at the office ---------- */
const mapSrc = await page.getAttribute('#cMap', 'src');
const dirHref = await page.getAttribute('#cDirections', 'href');
const slug = encodeURIComponent(addr);
check('map frame targets the saved address', (mapSrc || '').includes(slug), mapSrc);
check('directions link targets the address', (dirHref || '').includes(slug), dirHref);
const mapBox = await page.locator('#cMap').boundingBox();
check('map is visible and has height', mapBox && mapBox.height > 200, mapBox && Math.round(mapBox.height));

/* ---------- 4. validation: empty submit ---------- */
await page.click('#formSubmit');
await page.waitForTimeout(400);
const badCount = await page.locator('.field.is-bad').count();
check('empty submit flags all six fields', badCount === 6, `${badCount} flagged`);
const status1 = (await page.textContent('#formStatus') || '').trim();
check('status line reports the problem', /need your attention/i.test(status1), status1);
await page.screenshot({ path: join(SHOTS, 'contact-validation.png'), fullPage: true });

/* ---------- 5. validation: bad email, bad phone, no subject ---------- */
await page.fill('#firstName', 'Adaeze');
await page.fill('#surname',   'Okafor');
await page.fill('#email',     'not-an-email');
await page.fill('#phone',     '123');
await page.fill('#enquiry',   'Hi');
await page.click('#formSubmit');
await page.waitForTimeout(400);

const emailErr   = (await page.textContent('#err-email')   || '').trim();
const phoneErr   = (await page.textContent('#err-phone')   || '').trim();
const subjectErr = (await page.textContent('#err-subject') || '').trim();
check('bad email is rejected',       emailErr.length > 0, emailErr);
check('short telephone is rejected', phoneErr.length > 0, phoneErr);
check('missing subject is rejected', subjectErr.length > 0, subjectErr);

/* editing a field clears its complaint */
await page.fill('#email', 'test@example.com');
await page.waitForTimeout(200);
const clearedEmail = await page.locator('#err-email').textContent();
check('fixing a field clears its message', !(clearedEmail || '').trim(), clearedEmail);

/* ---------- 6. a real submission ---------- */
await page.fill('#phone', '+234 800 000 0000');
await page.selectOption('#subject', { label: 'Vessel chartering' });
await page.fill('#enquiry',
  'TEST — automated browser check of the new /contact page. Safe to delete from the manager.');
await page.click('#formSubmit');
await page.waitForTimeout(4000);

const status2 = (await page.textContent('#formStatus') || '').trim();
const statusClass = await page.getAttribute('#formStatus', 'class');
check('submission reports success', /received|sent/i.test(status2) && /is-ok/.test(statusClass || ''),
  status2);
const leftover = await page.inputValue('#firstName');
check('form is cleared after sending', leftover === '', `firstName="${leftover}"`);
await page.screenshot({ path: join(SHOTS, 'contact-success.png'), fullPage: true });

/* ---------- 7. navigation ---------- */
const navContact = await page.getAttribute('.nav .nav__link[aria-current="page"]', 'href');
check('Contact is the current page in the nav', navContact === '/contact', navContact);
const quote = await page.getAttribute('.masthead .btn--solid', 'href');
check('Request a Quote points at /contact', quote === '/contact', quote);

/* ---------- 8. the homepage no longer carries the form ---------- */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
check('homepage has no contact form',   (await page.locator('#contactForm').count()) === 0);
check('homepage has no contact details',(await page.locator('#cEmail').count()) === 0);
check('homepage keeps a contact band',  (await page.locator('#contact').count()) === 1);
const teaser = await page.getAttribute('#contact .btn', 'href');
check('homepage Contact Us button links to /contact', teaser === '/contact', teaser);
const homeNav = await page.getAttribute('.nav .nav__link:last-child', 'href');
check('homepage nav Contact points at /contact', homeNav === '/contact', homeNav);

/* clicking it actually lands on the contact page */
await page.click('#contact .btn');
await page.waitForLoadState('networkidle');
check('Contact Us button navigates to /contact', page.url().endsWith('/contact'), page.url());
await page.waitForTimeout(800);
await page.screenshot({ path: join(SHOTS, 'contact-desktop.png'), fullPage: true });

await context.close();

/* ---------- 9. mobile ---------- */
const iPhone = devices['iPhone 13'];
const mob = await chromium.launchPersistentContext(USER_DATA + '-mobile', {
  channel: 'chrome',
  headless: false,
  ...iPhone,
  ignoreDefaultArgs: ['--enable-automation']
});
const mp = mob.pages()[0] || (await mob.newPage());
mp.on('pageerror', e => pageErrors.push('mobile: ' + String(e.message || e)));
await mp.bringToFront();
await mp.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
await mp.waitForTimeout(1200);

const doc = await mp.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth
}));
check('no sideways scroll on mobile', doc.scrollW <= doc.clientW + 1,
  `scrollWidth ${doc.scrollW} vs ${doc.clientW}`);

const mapW = await mp.locator('#cMap').boundingBox();
check('map fits the mobile width', mapW && mapW.width <= doc.clientW + 1,
  mapW && Math.round(mapW.width));

/* the drawer */
check('burger is visible on mobile', await mp.isVisible('#burger'));
await mp.click('#burger');
await mp.waitForTimeout(500);
check('drawer opens', (await mp.getAttribute('#burger', 'aria-expanded')) === 'true');
const drawerContact = await mp.getAttribute('#drawer a[aria-current="page"]', 'href');
check('drawer Contact points at /contact', drawerContact === '/contact', drawerContact);
await mp.screenshot({ path: join(SHOTS, 'contact-mobile-drawer.png'), fullPage: false });

await mp.click('#burger');
await mp.waitForTimeout(400);
await mp.screenshot({ path: join(SHOTS, 'contact-mobile.png'), fullPage: true });

/* the drawer on the homepage leads here too */
await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await mp.waitForTimeout(800);
await mp.click('#burger');
await mp.waitForTimeout(400);
await mp.click('#drawer a:last-child');
await mp.waitForLoadState('networkidle');
check('mobile drawer navigates to /contact', mp.url().endsWith('/contact'), mp.url());

await mob.close();

const failed = results.filter(r => !r.pass);
console.log(JSON.stringify({
  ok: failed.length === 0 && pageErrors.length === 0,
  passed: results.length - failed.length,
  total: results.length,
  failed,
  results,
  consoleErrors,
  pageErrors,
  failedRequests
}, null, 2));
process.exit(failed.length === 0 && pageErrors.length === 0 ? 0 : 1);
