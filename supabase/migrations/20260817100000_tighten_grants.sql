-- =============================================================
-- LEAST PRIVILEGE FOR THE PUBLIC KEY
--
-- Supabase grants every new table in `public` to the anon and
-- authenticated roles in full. Row level security then decides
-- which rows each may touch — except for TRUNCATE, which RLS
-- does not police at all.
--
-- Nothing exposes TRUNCATE over the REST API today, so this is
-- not an open door. It is a key left in a lock that no longer
-- needs to exist: the publishable key in config.js should be
-- able to read published content and file an enquiry, and hold
-- no other privilege whatsoever.
--
-- Safe to run more than once.
-- =============================================================

-- Start from nothing for both roles, then hand back the minimum.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- Visitors: read published content.
grant select on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media
  to anon;

-- Visitors: leave an enquiry, and nothing more. No SELECT — the
-- inbox stays invisible — and no UPDATE, DELETE or TRUNCATE.
grant insert on public.enquiries to anon;

-- Signed-in staff: the four verbs the manager actually uses.
-- Deliberately no TRUNCATE, no TRIGGER, no REFERENCES.
grant select, insert, update, delete on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media,
  public.enquiries
  to authenticated;

-- The read API stays reachable by both.
grant execute on function public.site_bundle() to anon, authenticated;
