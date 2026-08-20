-- =============================================================
-- THE LINE UNDER THE CORE SERVICES HEADING
--
-- "From a vessel alongside to a pipeline tie-in, we cover the
-- marine, energy and engineering scopes our clients need under
-- one contract." now reads simply "We cover the marine, energy
-- and engineering scope of clients need."
--
-- The vessel-to-pipeline opener and the "under one contract"
-- ending are dropped; what is left says the same thing in one
-- short breath. It shows on the landing page and again at the
-- top of /services, both of which read this one row.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, and the eyebrow and the heading above it are left
-- exactly as they were.
-- =============================================================

update public.page_sections
   set lede = 'We cover the marine, energy and engineering scope of clients need.'
 where key = 'services';
