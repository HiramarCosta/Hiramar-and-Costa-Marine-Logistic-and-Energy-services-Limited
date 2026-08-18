# Hiramar and Costa — Marine Logistics and Energy Services Limited

The company website, backed by a Supabase database. Plain HTML, CSS and
JavaScript — no build step, no framework, nothing to compile.

```
Start Website.command   Double-click this to view the site on this Mac
index.html              The website — home, about intro, mission, services, contact
about-us.html           About Us, served at /about-us
equipment.html          Equipment for Sale, served at /equipment
admin.html              The manager — equipment, enquiries, content, settings
assets/js/config.js       <-- the only file you normally need to edit
assets/js/api.js        Talks to Supabase
assets/js/content.js    Fills the page with what the database holds
assets/js/main.js       Site behaviour and the contact form
assets/js/equipment.js  The "Equipment for Sale" grid, filters and Enquire
assets/js/store.js      Browser fallback, used if the database is unreachable
supabase/schema.sql     The database: tables, security rules, read API
supabase/seed.sql       The website's wording, ready to load
supabase/migrations/    The same two files, for the Supabase CLI
.claude/skills/         Three project skills (see below)
```

---

## What is stored in the database

Everything on the page, not just the equipment:

| Table | Holds |
| --- | --- |
| `site_settings` | Company name, RC number, email, phone, WhatsApp, address, page title and description |
| `page_sections` | The label, headline and opening line of every section, plus menu wording and order |
| `about_paragraphs` | The About Us copy, one row per paragraph |
| `registry_facts` | The registry plate beside About Us |
| `capabilities` | The strip that travels under the hero photograph |
| `value_statements` | Mission and Vision |
| `service_groups` · `services` | The four operating groups and the services inside them |
| `equipment` · `equipment_photos` | Equipment for Sale, and the photographs |
| `option_lists` | The enquiry types on the contact form, and the equipment categories and conditions |
| `site_media` | The hero photograph and logo files |
| `enquiries` | **Every message the website receives** |

### Enquiries are sorted by which button the visitor pressed

The contact form is one form, but four doors lead to it. Each enquiry is
saved with the door it came through, so the inbox can be triaged:

- **Request a Quote** (header button) → `quote`
- **Talk to our team** (hero button) → `team`
- **Enquire** on an equipment listing → `equipment`, with the listing attached
- Anyone who simply scrolls to the form → `general`

Each one also records the enquiry type chosen, the page it came from and
when it arrived. Read them in the manager's **Enquiries** tab, mark them
in progress, answered or closed, leave a note for the team, or download
the lot as a spreadsheet.

---

## The database — already set up

**This was applied on 17 August 2026** via `supabase db push`, against project
`pewmcfatznoonjkatnuf` ("Hiramar and Costa-Marine Logistics and Energy
Services Limited"). All 13 tables exist, the website reads live content, and
public sign-ups are switched off.

You do not need to run anything below again. It is kept as the record of what
was applied, and for rebuilding the database from scratch if that is ever
needed.

### The quick way — paste one file

1. Open your project: <https://supabase.com/dashboard/project/pewmcfatznoonjkatnuf>
2. **SQL Editor → New query.**
3. Open **`supabase/SETUP.sql`**, select all of it, copy, paste it into the
   editor and press **Run**. That is the whole database in one go.
4. **Authentication → Users → Add user** — create the email and password
   you will sign in with at `admin.html`.
5. **Authentication → Sign In / Providers** — turn *off*
   "Allow new users to sign up", so nobody else can register.

Reload the website. It is now reading from the database.

`SETUP.sql` is simply `schema.sql` and `seed.sql` joined together, with
instructions at the top. Those two files are still there if you would rather
run them separately — the structure first, the wording second.

### The command-line way

The Supabase CLI is installed. From this folder:

```
supabase login                                    # opens your browser
supabase link --project-ref pewmcfatznoonjkatnuf  # asks for the database password
supabase db push                                  # applies supabase/migrations/
```

`supabase db push` runs both migration files in order and does exactly what
the two pastes above do. Steps 4 and 5 are still done in the dashboard.

---

## Where the About Us profile lives

The full profile has its own page, `about-us.html`, served at `/about-us` —
the company paragraphs and the registry plate beside them. The About link in
the menu, on a computer and on a phone, opens it.

The home page keeps a short About band: the same heading, the opening
paragraph, and a **Learn More** button through to the page. Both are edited
in the manager exactly as before — the heading under the **about** section,
the paragraphs under **About Us** — and the home page shows whichever
paragraph is marked as the lead.

---

## Where the equipment listings live

The listings have their own page, `equipment.html`, served at `/equipment`.
The Equipment link in the menu — on a computer and on a phone — opens it, as
do the buttons on the home page.

The home page keeps a short Equipment band introducing it. Its wording is
still edited in the manager under the **equipment** section, exactly as
before, and both pages read that same wording.

---

## Day to day: the manager

Open the manager and sign in — `https://hiramar-and-costa-marine-logistic-a.vercel.app/manager` on the live
site, or `http://localhost:8080/admin.html` on this Mac. It is the same
manager either way; both edit the same database.

**Forgotten the password?** Type your email into the sign-in form and press
*Forgotten your password?*. Supabase emails a one-time link; opening it brings
you back to the manager to choose a new password. This is the only way to
change it — a password is stored as a one-way hash, so nobody, including the
database owner, can read the existing one.

**A warning about browsers filling the form for you.** Chrome and Safari will
offer to save and re-fill the Supabase dashboard's *Add user* password box, and
they sometimes overwrite what you typed. If a new account will not sign in,
that is almost always why. Create the user in a Private or Incognito window,
where auto-fill does not run.

- **Equipment** — add, edit, hide or delete listings. Photographs are shrunk
  automatically before upload, so pages stay fast.
- **Enquiries** — everything the website has received. Filter by type, mark
  progress, add notes, export to CSV.
- **Content** — the wording of every section: headlines, About Us paragraphs,
  the registry plate, the capability strip, Mission and Vision, the core
  services, and the choices in the contact form's dropdown.
- **Settings** — company and contact details, and the page's search-engine
  title and description.

Changes appear on the website the next time a visitor loads the page.

**A note on safety.** The key in `config.js` is *publishable* — it is meant to
be readable by anyone. It can read published content and leave an enquiry, and
that is all. It cannot read the enquiry inbox, and it cannot change a single
row. Every edit requires your sign-in. Those rules live in the database itself
(`supabase/schema.sql`, section 12), not in the JavaScript, so they hold even
if someone bypasses the page entirely.

---

## Viewing the site on this computer

**Double-click `Start Website.command`.** A Terminal window opens, the site
opens in your browser, and it stays running until you close that window or
press Control-C in it.

- Website: `http://localhost:8080/`
- Manager: `http://localhost:8080/admin.html`

If port 8080 is busy the script picks the next free one and tells you the
address to use.

---

## If the database is ever unreachable

The site never shows a broken page. The wording published in `index.html`
stays visible, and the equipment section falls back to anything saved in that
browser. A short note appears above the listings explaining that they are
local only. Once the database answers again, everything switches back on its
own — nothing to reset.

---

## Optional: an email copy of each enquiry

Enquiries are always saved to the database. If you also want one emailed the
moment it arrives:

1. Sign up free at **formspree.io** and create a form.
2. Paste the endpoint into `assets/js/config.js`:
   ```js
   FORMSPREE_ENDPOINT: 'https://formspree.io/f/abcdwxyz'
   ```

If the database is ever unreachable, this becomes the safety net — and if
neither is available, the form opens the visitor's email app with the enquiry
already written out, so nothing is lost.

---

## Online: Vercel

The site is hosted on Vercel, deployed from the GitHub repository. Vercel
serves this folder exactly as it is — there is nothing to build.

### The manager is already up there

`admin.html` is part of the same folder, so it went online with the site.
There is no second website to host and no server to run.

| | Address |
| --- | --- |
| Website | `https://hiramar-and-costa-marine-logistic-a.vercel.app/` |
| About Us | `https://hiramar-and-costa-marine-logistic-a.vercel.app/about-us` |
| Equipment | `https://hiramar-and-costa-marine-logistic-a.vercel.app/equipment` |
| Manager | `https://hiramar-and-costa-marine-logistic-a.vercel.app/manager` — or `/admin.html`, both work |

`vercel.json` adds the tidy `/about-us`, `/equipment` and `/manager` addresses, and tells search engines to
skip it. The page is unlinked and marked `noindex`, but its address is still
public — the sign-in is what protects your data. Never remove the security
rules in `schema.sql`.

### One setting to change in Supabase

Open **Authentication → URL Configuration** in the Supabase dashboard:

- **Site URL** — your Vercel address, `https://hiramar-and-costa-marine-logistic-a.vercel.app`
- **Redirect URLs** — add both:
  - `https://hiramar-and-costa-marine-logistic-a.vercel.app/admin.html`
  - `http://localhost:8080/admin.html` (so it still works on this Mac)

Without this, the *Forgotten your password?* email sends you to the wrong
address. Signing in normally works either way.

### Where the uploads actually go

Photographs and logos never touch Vercel. The manager sends them straight to
Supabase Storage from your browser, and the website reads them back from the
same place. So:

- Uploading online works exactly as it does on this Mac.
- New equipment, edited wording and uploaded photographs appear on the live
  site straight away. **No redeploy is needed.**
- A redeploy is only for changes to the files themselves — HTML, CSS, JS.
  Push to GitHub `main` and Vercel rebuilds on its own.

### Publishing a change to the files

```
git add -A
git commit -m "what changed"
git push
```

Vercel picks it up within a minute or so.

---

## Project skills

Three skills are installed in `.claude/skills/`, so they are available whenever
Claude Code is working in this folder. Type the slash command, or just ask.

### `/roast` — pressure-test an idea before building it

Convenes a council of five personas who attack an idea from every angle, then a
Judge returns one **GO / RESHAPE / KILL** verdict plus the cheapest test to
de-risk it. Deliberately adversarial — Claude's default is to agree with you,
and this is the opposite.

```
/roast should we lead the homepage with equipment sales or chartering?
```

### `/browser-check` — open the real browser and look

Launches your actual Chrome, opens a page, takes a full-page screenshot, and
reports console errors and failed network requests. Claude reads the screenshot,
finds the cause of anything broken, fixes it, and re-checks.

**Close Chrome before running it** — Chrome locks its profile while open.

```
cd .claude/skills/browser-check && node browser-check.mjs "http://localhost:8080/" "home"
```

### `/session-handoff` — carry context into a new session

Produces a structured summary — decisions made, what shipped, key files, running
state, how to verify, what was deferred, where to pick up.

---

## Design notes

- Colours come from the logo itself: deep forest `#005020` and emerald
  `#08A848`, with a brass `#C6952F` accent drawn from ship fittings and buoy
  markers.
- Type pairs **Archivo** (expanded uppercase, echoing hull lettering) for
  headlines, **Source Serif 4** for body copy, and **IBM Plex Mono** for
  specifications and reference numbers.
- The vertical scale down the left edge on wide screens is a **draft mark** —
  the depth scale painted on every hull, visible on the jack-up legs in the hero
  photograph. It doubles as the scroll position indicator.

### Swapping the hero photograph

Replace `assets/img/hero.jpg`. Use a wide, high-resolution image with the
subject on the right-hand side — the left is darkened for the headline.
