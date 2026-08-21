-- =============================================================
-- "OIL AND GAS" BECOMES "OIL & GAS" IN THE ABOUT HEADING
--
-- The heading set the word AND twice in a line already carrying a
-- comma — "maritime, oil and gas, and energy" — and at heading size,
-- in caps, the repetition was the thing you read. The first one is
-- now an ampersand: "maritime, oil & gas, and energy". The serial
-- comma and the final "and" stay, so the sentence still reads as a
-- sentence.
--
-- This also brings the heading into line with the lede beneath it,
-- which has said "offshore oil & gas and energy sectors" since the
-- introduction was rewritten.
--
-- One row, matched on its key. The eyebrow, the lede and the label
-- are untouched, and the same heading is the fallback in index.html
-- and about-us.html — both pages read this row.
-- =============================================================

update public.page_sections
   set title = 'Integrated solutions across maritime, oil & gas, and energy'
 where key = 'about';
