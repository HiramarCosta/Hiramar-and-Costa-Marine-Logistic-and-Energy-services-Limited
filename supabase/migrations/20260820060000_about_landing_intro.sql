-- =============================================================
-- THE SHORT ABOUT US INTRODUCTION ON THE LANDING PAGE
--
-- The company profile ran in full twice — once on the landing
-- page and again on /about-us. It now runs once, on /about-us,
-- and the landing page's About band carries the heading, a short
-- introduction and a Learn More About Us button through to the
-- page, the same shape the Core Services and Equipment bands
-- already use.
--
-- The introduction is the "about" row's lede, the column those
-- other bands read their own opening line from. The paragraphs in
-- about_paragraphs are untouched: every one of them still shows,
-- in full, on /about-us.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, and the eyebrow and the heading above it are left
-- exactly as they were.
-- =============================================================

update public.page_sections
   set lede = 'Hiramar and Costa provides integrated marine logistics, offshore, oil and gas, and energy services. We support clients through vessel chartering, marine equipment supply, crude oil evacuation, engineering and dependable logistics solutions.'
 where key = 'about';
