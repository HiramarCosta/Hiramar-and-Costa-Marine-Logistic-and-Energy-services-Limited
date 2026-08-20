-- =============================================================
-- THE RC BADGE
--
-- "RC 9463814 · Incorporated in Nigeria" is dropped. It ran twice
-- on the landing page — as the brass pill above the headline, and
-- again in the footer bar — and once more in the footer of every
-- other page, so the same registration line met the visitor four
-- or five times over on a single visit.
--
-- The hero pill was the only thing this row's eyebrow was ever
-- printed as, and that paragraph is gone from index.html, so the
-- eyebrow is cleared here to keep the database saying the same
-- thing as the markup.
--
-- Left empty rather than dropped, so a new small label can be put
-- back above the headline from the manager whenever one is wanted.
--
-- The footer line was never a row of its own: content.js built it
-- from site_settings.rc_number. That script no longer writes it,
-- and the span is out of all five pages, so nothing here needs to
-- change for the footer.
--
-- The registration number itself is untouched. site_settings.rc_number
-- still holds it, the registry plate on /about-us still lists it,
-- and the incorporation paragraph in about_paragraphs still states
-- it — the company's registered details are staying on the site.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, and the heading and lede beneath it are left exactly
-- as they were.
-- =============================================================

update public.page_sections
   set eyebrow = null
 where key = 'home';
