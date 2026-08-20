-- =============================================================
-- THE CORE SERVICES HEADING
--
-- "Seventeen services, four operating groups" now reads simply
-- "Four operating groups". The service count is dropped from the
-- heading; the seventeen services themselves are untouched, and
-- so are the four groups they sit in.
--
-- content.js still keeps the number in the heading true as groups
-- are added or removed in the manager, so this wording stays
-- correct on its own — "Four" becomes "Five" if a fifth group is
-- ever added.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, and the eyebrow and the line beneath the heading are
-- left exactly as they were.
-- =============================================================

update public.page_sections
   set title = 'Four operating groups'
 where key = 'services';
