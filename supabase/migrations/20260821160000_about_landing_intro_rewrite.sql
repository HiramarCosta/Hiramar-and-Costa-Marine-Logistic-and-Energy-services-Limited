-- =============================================================
-- THE ABOUT US INTRODUCTION ON THE LANDING PAGE, CORRECTED
--
-- The introduction read as a list of sectors the company is in —
-- "marine logistics, offshore, oil and gas, and energy services"
-- — and ended on "dependable logistics solutions". It now says
-- what the company does and who it does it for: integrated marine
-- logistics services to the offshore oil & gas and energy
-- sectors, ending on engineering and installation.
--
-- This is the "about" row's lede, the short paragraph under the
-- heading on the landing page, above the Learn More About Us
-- button. It replaces the wording set in
-- 20260820060000_about_landing_intro.sql.
--
-- One row, matched on its key. Nothing is inserted, nothing is
-- dropped, the eyebrow and heading above it are untouched, and
-- the full profile in about_paragraphs on /about-us is untouched.
-- =============================================================

update public.page_sections
   set lede = 'Hiramar and Costa provides integrated marine logistics services to the offshore oil & gas and energy sectors. We support clients through vessel chartering, marine equipment supply, crude evacuation, engineering and installation.'
 where key = 'about';
