-- =============================================================
-- THE LINE UNDER THE CONTACT HEADING
--
-- "Send the details and our team will come back to you with
-- availability, scope and pricing." is dropped. The heading above
-- it — "Tell us what you need moved, chartered or supplied" —
-- already asks for the same thing, and the form beneath it says
-- the rest, so the sentence only repeated them both.
--
-- This one row is read twice: by the contact band on the landing
-- page, and again at the top of /contact. The paragraph is gone
-- from the markup of both, so the line is off the site either way;
-- clearing it here keeps the database saying the same thing.
--
-- Left empty rather than dropped, so the manager can put a new
-- opening line back under "Opening line" whenever one is wanted.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, and the eyebrow and the heading above it are left
-- exactly as they were.
-- =============================================================

update public.page_sections
   set lede = null
 where key = 'contact';
