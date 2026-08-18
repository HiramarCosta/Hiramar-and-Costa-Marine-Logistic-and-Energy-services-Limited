-- =============================================================
-- THE FOOTER LOGO
--
-- The footer was seeded with the white knockout lockup
-- (logo-full-light.png). White artwork on a near-white plate
-- read as a smudge: the wordmark all but vanished. Dropping the
-- plate did not help either — the logo's dark green on the dark
-- footer disappears just as thoroughly.
--
-- The footer now carries the original company logo, full colour,
-- on the pale ground it was drawn on: assets/img/logo-footer.png,
-- cropped from the original artwork with an even margin.
--
-- Seeds only insert where nothing exists, so a project that has
-- already been set up still holds the old value. This corrects
-- it in place, and touches nothing else.
-- =============================================================

update public.site_media
   set photo_url  = 'assets/img/logo-footer.png',
       photo_path = null,
       alt        = 'Hiramar and Costa — Marine Logistics and Energy Services Limited'
 where key = 'logo_full';
