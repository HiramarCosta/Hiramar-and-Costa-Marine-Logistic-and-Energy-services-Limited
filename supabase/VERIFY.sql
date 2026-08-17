-- =============================================================
-- HIRAMAR AND COSTA — "IS THE DATABASE THERE?" CHECK
--
-- Paste this into  Dashboard > SQL Editor > New query > Run.
-- It changes nothing. It only reports what exists.
--
-- Expect 13 rows back, one per table, each marked  OK.
-- Any table showing  MISSING  means SETUP.sql has not been run
-- (or did not finish). In that case run supabase/SETUP.sql.
-- =============================================================

select
  t.expected                                   as table_name,
  case when c.oid is null then 'MISSING' else 'OK' end as status,
  coalesce(c.relrowsecurity, false)            as rls_on,
  coalesce((select count(*) from pg_policies p
             where p.schemaname = 'public'
               and p.tablename  = t.expected), 0) as policies,
  case when c.oid is null then null
       else (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from public.%I', t.expected),
                           false, true, '')))[1]::text::bigint
  end                                          as rows
from (values
  ('site_settings'), ('page_sections'), ('about_paragraphs'),
  ('registry_facts'), ('capabilities'), ('value_statements'),
  ('service_groups'), ('services'), ('equipment'),
  ('equipment_photos'), ('option_lists'), ('site_media'),
  ('enquiries')
) as t(expected)
left join pg_class c
       on c.relname = t.expected
      and c.relnamespace = 'public'::regnamespace
      and c.relkind = 'r'
order by 2 desc, 1;


-- The read API the website calls on every page load.
select case when exists (
         select 1 from pg_proc
          where proname = 'site_bundle'
            and pronamespace = 'public'::regnamespace)
       then 'OK — public.site_bundle() exists'
       else 'MISSING — run SETUP.sql'
       end as read_api;


-- The two storage buckets, both of which must be public.
select id, public,
       case when public then 'OK' else 'NOT PUBLIC — images will not load' end as status
  from storage.buckets
 where id in ('equipment-photos', 'site-media');


-- Who can sign in to admin.html.
select email, created_at, last_sign_in_at
  from auth.users
 order by created_at;
