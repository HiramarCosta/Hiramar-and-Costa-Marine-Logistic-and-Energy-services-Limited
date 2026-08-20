-- =============================================================
-- HIRAMAR AND COSTA
-- MARINE LOGISTICS AND ENERGY SERVICES LIMITED
--
-- COMPLETE DATABASE SETUP — RUN THIS ONCE
--
-- HOW TO USE THIS FILE
--   1. Open  https://supabase.com/dashboard/project/pewmcfatznoonjkatnuf
--   2. Click  SQL Editor  in the left sidebar
--   3. Click  New query
--   4. Select ALL of this file, copy it, paste it into the editor
--   5. Press  Run   (or Cmd+Enter)
--
-- It should finish in a few seconds and report "Success".
--
-- WHAT IT DOES
--   Part A  builds the tables, the security rules and the read API
--   Part B  fills them with the wording currently on the website
--
-- Running it a second time is safe. It will not duplicate anything,
-- and it will not overwrite wording you have edited since.
--
-- AFTERWARDS, in the dashboard:
--   Authentication > Users > Add user
--       — create the email and password you will sign in with at
--         admin.html
--   Authentication > Sign In / Providers
--       — turn OFF "Allow new users to sign up", so nobody else can
--         register an account on your project
-- =============================================================


-- #############################################################
-- ##                                                         ##
-- ##   PART A — TABLES, SECURITY AND THE READ API            ##
-- ##                                                         ##
-- #############################################################

-- =============================================================
-- HIRAMAR AND COSTA — MARINE LOGISTICS AND ENERGY SERVICES LTD
-- Supabase database: structure, security and the read API.
--
-- Run this once:  Supabase dashboard > SQL Editor > New query
--                 > paste ALL of this > Run.
-- Then run supabase/seed.sql the same way to load the website copy.
--
-- Safe to run more than once — everything is written to be repeatable.
-- =============================================================

-- -------------------------------------------------------------
-- 0. Shared helpers
-- -------------------------------------------------------------

-- Every table carries updated_at; this keeps it honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Enquiry classification. Wrapped so re-running the file is harmless.
do $$
begin
  create type public.enquiry_kind as enum ('general', 'quote', 'team', 'equipment');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.enquiry_status as enum ('new', 'in_progress', 'answered', 'closed');
exception when duplicate_object then null;
end $$;


-- =============================================================
-- 1. COMPANY SETTINGS  — one row, id 1. Contact panel, footer,
--    page metadata and the header call-to-action all read this.
-- =============================================================
create table if not exists public.site_settings (
  id                smallint primary key default 1 check (id = 1),

  company_name      text not null default 'Hiramar and Costa — Marine Logistics and Energy Services Limited',
  short_name        text not null default 'Hiramar and Costa',
  tagline           text,
  rc_number         text,
  legal_form        text,
  governing_act     text,
  registrar         text,

  email             text,
  phone             text,
  whatsapp          text,
  whatsapp_message  text,
  address           text,
  office_hours      text,

  facebook_url      text,
  linkedin_url      text,
  instagram_url     text,
  twitter_url       text,

  header_cta_label  text default 'Request a Quote',
  footer_blurb      text,

  meta_title        text,
  meta_description  text,
  og_image          text,

  -- Where enquiry notifications should land. Falls back to email.
  notify_email      text,

  updated_at        timestamptz not null default now()
);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 2. PAGE SECTIONS — the heading block at the top of every band,
--    plus the navigation label and running order.
--    keys: home · about · mission · services · equipment · contact
-- =============================================================
create table if not exists public.page_sections (
  id               uuid primary key default gen_random_uuid(),
  key              text not null unique,
  nav_label        text,
  nav_number       text,            -- the draft-mark figure: 00, 02, 04 …
  eyebrow          text,
  title            text,
  title_emphasis   text,            -- italic tail of the hero headline
  lede             text,
  extra            jsonb not null default '{}'::jsonb,   -- buttons, images
  sort_order       integer not null default 0,
  in_nav           boolean not null default true,
  is_visible       boolean not null default true,
  updated_at       timestamptz not null default now()
);

create index if not exists page_sections_order_idx
  on public.page_sections (sort_order);

drop trigger if exists page_sections_touch on public.page_sections;
create trigger page_sections_touch before update on public.page_sections
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 3. ABOUT US — the body copy, one row per paragraph.
-- =============================================================
create table if not exists public.about_paragraphs (
  id           uuid primary key default gen_random_uuid(),
  body         text not null,
  is_lead      boolean not null default false,   -- the larger opening paragraph
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists about_paragraphs_order_idx
  on public.about_paragraphs (sort_order);

drop trigger if exists about_paragraphs_touch on public.about_paragraphs;
create trigger about_paragraphs_touch before update on public.about_paragraphs
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 4. REGISTRY PANEL — the label/value plate beside About Us.
-- =============================================================
create table if not exists public.registry_facts (
  id           uuid primary key default gen_random_uuid(),
  label        text not null unique,
  value        text not null,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now()
);

drop trigger if exists registry_facts_touch on public.registry_facts;
create trigger registry_facts_touch before update on public.registry_facts
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 5. CAPABILITY STRIP — the row that travels under the hero.
-- =============================================================
create table if not exists public.capabilities (
  id           uuid primary key default gen_random_uuid(),
  label        text not null unique,
  number_label text,                 -- 01, 02, 03 …
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now()
);

drop trigger if exists capabilities_touch on public.capabilities;
create trigger capabilities_touch before update on public.capabilities
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 6. MISSION & VISION — one row per statement card.
-- =============================================================
create table if not exists public.value_statements (
  id           uuid primary key default gen_random_uuid(),
  kicker       text not null unique,     -- "Our Vision" / "Our Mission"
  heading      text not null,
  body         text not null,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now()
);

drop trigger if exists value_statements_touch on public.value_statements;
create trigger value_statements_touch before update on public.value_statements
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 7. CORE SERVICES — four groups, each holding its services.
-- =============================================================
create table if not exists public.service_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  blurb        text,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.service_groups (id) on delete cascade,
  name         text not null,
  description  text,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (group_id, name)
);

create index if not exists services_group_idx
  on public.services (group_id, sort_order);

drop trigger if exists service_groups_touch on public.service_groups;
create trigger service_groups_touch before update on public.service_groups
  for each row execute function public.touch_updated_at();

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 8. EQUIPMENT FOR SALE
-- =============================================================
create table if not exists public.equipment (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  name          text not null,
  slug          text,
  category      text,
  condition     text,
  year          integer,
  location      text,
  price         text default 'Price on application',
  reference     text,
  description   text,
  specs         jsonb not null default '{}'::jsonb,   -- free-form spec sheet

  photo_path    text,          -- file name inside the storage bucket
  photo_url     text,          -- or a full external image URL instead

  is_featured   boolean not null default false,
  is_sample     boolean not null default false,       -- the starter listings
  is_available  boolean not null default true,
  sort_order    integer not null default 0
);

-- Older projects may already have this table; bring it up to date.
alter table public.equipment add column if not exists updated_at   timestamptz not null default now();
alter table public.equipment add column if not exists slug         text;
alter table public.equipment add column if not exists description  text;
alter table public.equipment add column if not exists specs        jsonb not null default '{}'::jsonb;
alter table public.equipment add column if not exists is_featured  boolean not null default false;
alter table public.equipment add column if not exists is_sample    boolean not null default false;
alter table public.equipment add column if not exists sort_order   integer not null default 0;

create index if not exists equipment_available_idx
  on public.equipment (is_available, sort_order, created_at desc);
create unique index if not exists equipment_reference_idx
  on public.equipment (reference) where reference is not null;

drop trigger if exists equipment_touch on public.equipment;
create trigger equipment_touch before update on public.equipment
  for each row execute function public.touch_updated_at();

-- Extra photographs for a listing, beyond the cover image.
create table if not exists public.equipment_photos (
  id            uuid primary key default gen_random_uuid(),
  equipment_id  uuid not null references public.equipment (id) on delete cascade,
  photo_path    text,
  photo_url     text,
  alt           text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists equipment_photos_owner_idx
  on public.equipment_photos (equipment_id, sort_order);


-- =============================================================
-- 9. OPTION LISTS — the choices offered in dropdowns, kept as
--    data so they can be changed without touching the code.
--    list_key: enquiry_type · equipment_category · equipment_condition
-- =============================================================
create table if not exists public.option_lists (
  id           uuid primary key default gen_random_uuid(),
  list_key     text not null,
  value        text not null,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (list_key, value)
);

create index if not exists option_lists_key_idx
  on public.option_lists (list_key, sort_order);

drop trigger if exists option_lists_touch on public.option_lists;
create trigger option_lists_touch before update on public.option_lists
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 10. SITE MEDIA — the hero photograph and logo files, by role.
-- =============================================================
create table if not exists public.site_media (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,    -- hero · logo · logo_light · og_image
  photo_path   text,                    -- inside the site-media bucket
  photo_url    text,                    -- or an external / local path
  alt          text,
  updated_at   timestamptz not null default now()
);

drop trigger if exists site_media_touch on public.site_media;
create trigger site_media_touch before update on public.site_media
  for each row execute function public.touch_updated_at();


-- =============================================================
-- 11. ENQUIRIES — every message the website collects.
--     kind tells you which door the visitor came through:
--       general   — the contact form
--       quote     — the "Request a Quote" button
--       team      — the "Talk to our team" button
--       equipment — the Enquire button on a listing
-- =============================================================
create table if not exists public.enquiries (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  kind            public.enquiry_kind not null default 'general',
  first_name      text not null,
  surname         text not null,
  email           text not null,
  phone           text not null,
  company         text,
  enquiry_type    text,
  message         text not null,

  equipment_id    uuid references public.equipment (id) on delete set null,
  equipment_name  text,

  source_url      text,
  referrer        text,
  user_agent      text,

  status          public.enquiry_status not null default 'new',
  staff_notes     text,
  handled_at      timestamptz
);

create index if not exists enquiries_inbox_idx
  on public.enquiries (status, created_at desc);
create index if not exists enquiries_kind_idx
  on public.enquiries (kind, created_at desc);


-- =============================================================
-- 12. ROW LEVEL SECURITY
--     Visitors read published content and may leave an enquiry.
--     Nothing else. Signed-in staff do everything.
-- =============================================================

alter table public.site_settings     enable row level security;
alter table public.page_sections     enable row level security;
alter table public.about_paragraphs  enable row level security;
alter table public.registry_facts    enable row level security;
alter table public.capabilities      enable row level security;
alter table public.value_statements  enable row level security;
alter table public.service_groups    enable row level security;
alter table public.services          enable row level security;
alter table public.equipment         enable row level security;
alter table public.equipment_photos  enable row level security;
alter table public.option_lists      enable row level security;
alter table public.site_media        enable row level security;
alter table public.enquiries         enable row level security;

-- Public read of published content ----------------------------
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('site_settings',    'true'),
      ('page_sections',    'is_visible = true'),
      ('about_paragraphs', 'is_visible = true'),
      ('registry_facts',   'is_visible = true'),
      ('capabilities',     'is_visible = true'),
      ('value_statements', 'is_visible = true'),
      ('service_groups',   'is_visible = true'),
      ('services',         'is_visible = true'),
      ('equipment',        'is_available = true'),
      ('equipment_photos', 'true'),
      ('option_lists',     'is_visible = true'),
      ('site_media',       'true')
    ) as v(tbl, clause)
  loop
    execute format('drop policy if exists "public reads %1$s" on public.%1$I', t.tbl);
    execute format(
      'create policy "public reads %1$s" on public.%1$I for select to anon using (%2$s)',
      t.tbl, t.clause);

    execute format('drop policy if exists "staff read %1$s" on public.%1$I', t.tbl);
    execute format(
      'create policy "staff read %1$s" on public.%1$I for select to authenticated using (true)',
      t.tbl);

    execute format('drop policy if exists "staff write %1$s" on public.%1$I', t.tbl);
    execute format(
      'create policy "staff write %1$s" on public.%1$I for insert to authenticated with check (true)',
      t.tbl);

    execute format('drop policy if exists "staff update %1$s" on public.%1$I', t.tbl);
    execute format(
      'create policy "staff update %1$s" on public.%1$I for update to authenticated using (true) with check (true)',
      t.tbl);

    execute format('drop policy if exists "staff delete %1$s" on public.%1$I', t.tbl);
    execute format(
      'create policy "staff delete %1$s" on public.%1$I for delete to authenticated using (true)',
      t.tbl);
  end loop;
end $$;

-- Enquiries: write-only for visitors -------------------------
-- A visitor may leave a message and nothing more: they cannot read
-- the inbox, cannot mark anything handled, and cannot write notes.
drop policy if exists "visitors leave an enquiry" on public.enquiries;
create policy "visitors leave an enquiry"
  on public.enquiries for insert
  to anon
  with check (
    status = 'new'
    and staff_notes is null
    and handled_at is null
    and char_length(first_name) between 1 and 120
    and char_length(surname)    between 1 and 120
    and char_length(email)      between 5 and 254
    and email like '%_@_%.__%'
    and char_length(phone)      between 4 and 40
    and char_length(message)    between 2 and 5000
    and char_length(coalesce(company, ''))      <= 200
    and char_length(coalesce(enquiry_type, '')) <= 120
    and char_length(coalesce(source_url, ''))   <= 500
    and char_length(coalesce(referrer, ''))     <= 500
    and char_length(coalesce(user_agent, ''))   <= 500
  );

drop policy if exists "staff read enquiries" on public.enquiries;
create policy "staff read enquiries"
  on public.enquiries for select to authenticated using (true);

drop policy if exists "staff update enquiries" on public.enquiries;
create policy "staff update enquiries"
  on public.enquiries for update to authenticated using (true) with check (true);

drop policy if exists "staff delete enquiries" on public.enquiries;
create policy "staff delete enquiries"
  on public.enquiries for delete to authenticated using (true);

-- Visitors must not be able to read back what they inserted.
revoke select on public.enquiries from anon;
grant insert on public.enquiries to anon;


-- Table privileges. RLS decides which rows; these decide which verbs.
--
-- Supabase grants every new table in `public` to anon and authenticated
-- in full, and RLS then polices the rows — except for TRUNCATE, which
-- RLS does not police. So both roles start from nothing here and are
-- handed back only what they genuinely need.
grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- Visitors: read published content.
grant select on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media
  to anon;

-- Visitors: leave an enquiry, and nothing else. No SELECT, so the
-- inbox is invisible; no UPDATE, DELETE or TRUNCATE.
grant insert on public.enquiries to anon;

-- Signed-in staff: the four verbs the manager uses. No TRUNCATE.
grant select, insert, update, delete on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media,
  public.enquiries
  to authenticated;


-- =============================================================
-- 13. STORAGE — two public buckets.
--     Some projects do not let the SQL editor touch storage's own
--     tables. If that happens here, the rest of this file still
--     applies and a notice explains what to finish by hand.
-- =============================================================
do $$
declare
  stmt text;
begin
  insert into storage.buckets (id, name, public)
  values ('equipment-photos', 'equipment-photos', true)
  on conflict (id) do update set public = true;

  insert into storage.buckets (id, name, public)
  values ('site-media', 'site-media', true)
  on conflict (id) do update set public = true;

  -- Retired policies from the first version of this file.
  foreach stmt in array array[
    'drop policy if exists "public views equipment photos"  on storage.objects',
    'drop policy if exists "staff uploads equipment photos" on storage.objects',
    'drop policy if exists "staff updates equipment photos" on storage.objects',
    'drop policy if exists "staff deletes equipment photos" on storage.objects',
    'drop policy if exists "public views site files"  on storage.objects',
    'drop policy if exists "staff uploads site files" on storage.objects',
    'drop policy if exists "staff updates site files" on storage.objects',
    'drop policy if exists "staff deletes site files" on storage.objects',

    'create policy "public views site files" on storage.objects for select
       to anon, authenticated
       using (bucket_id in (''equipment-photos'', ''site-media''))',

    'create policy "staff uploads site files" on storage.objects for insert
       to authenticated
       with check (bucket_id in (''equipment-photos'', ''site-media''))',

    'create policy "staff updates site files" on storage.objects for update
       to authenticated
       using (bucket_id in (''equipment-photos'', ''site-media''))
       with check (bucket_id in (''equipment-photos'', ''site-media''))',

    'create policy "staff deletes site files" on storage.objects for delete
       to authenticated
       using (bucket_id in (''equipment-photos'', ''site-media''))'
  ]
  loop
    execute stmt;
  end loop;

exception
  when insufficient_privilege then
    raise notice 'Storage could not be configured from SQL. In the dashboard, open Storage and create two public buckets named equipment-photos and site-media. Everything else in this file has been applied.';
end $$;


-- =============================================================
-- 14. THE READ API — one call returns the whole website.
--     The page calls this instead of making a dozen requests.
--     Runs as the caller, so the policies above still decide
--     what comes back.
-- =============================================================
create or replace function public.site_bundle()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'settings',
      (select to_jsonb(s) from public.site_settings s where s.id = 1),

    'sections',
      (select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
         from public.page_sections x where x.is_visible),

    'about',
      (select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
         from public.about_paragraphs x where x.is_visible),

    'registry',
      (select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
         from public.registry_facts x where x.is_visible),

    'capabilities',
      (select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
         from public.capabilities x where x.is_visible),

    'values',
      (select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
         from public.value_statements x where x.is_visible),

    'service_groups',
      (select coalesce(jsonb_agg(grouped.g order by grouped.sort_order), '[]'::jsonb)
         from (
           select to_jsonb(sg) || jsonb_build_object(
                    'services',
                    (select coalesce(jsonb_agg(to_jsonb(sv) order by sv.sort_order), '[]'::jsonb)
                       from public.services sv
                      where sv.group_id = sg.id and sv.is_visible)
                  ) as g,
                  sg.sort_order
             from public.service_groups sg
            where sg.is_visible
         ) as grouped),

    'equipment',
      (select coalesce(jsonb_agg(listed.e order by listed.sort_order, listed.created_at desc), '[]'::jsonb)
         from (
           select to_jsonb(eq) || jsonb_build_object(
                    'photos',
                    (select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order), '[]'::jsonb)
                       from public.equipment_photos p
                      where p.equipment_id = eq.id)
                  ) as e,
                  eq.sort_order, eq.created_at
             from public.equipment eq
            where eq.is_available
         ) as listed),

    'options',
      (select coalesce(jsonb_object_agg(o.list_key, o.vals), '{}'::jsonb)
         from (
           select list_key,
                  jsonb_agg(value order by sort_order, value) as vals
             from public.option_lists
            where is_visible
            group by list_key
         ) as o),

    'media',
      (select coalesce(jsonb_object_agg(m.key, to_jsonb(m)), '{}'::jsonb)
         from public.site_media m),

    'generated_at', to_jsonb(now())
  );
$$;

grant execute on function public.site_bundle() to anon, authenticated;

-- =============================================================
-- Last step, done in the dashboard rather than here:
--   Authentication > Users > Add user — create the email and
--   password used to sign in at admin.html.
--   Then Authentication > Sign In / Providers, and turn OFF
--   "Allow new users to sign up" so nobody else can register.
-- =============================================================


-- #############################################################
-- ##                                                         ##
-- ##   PART B — THE WEBSITE'S WORDING                        ##
-- ##                                                         ##
-- #############################################################

-- =============================================================
-- HIRAMAR AND COSTA — website content
-- Run this AFTER supabase/schema.sql, the same way:
--   SQL Editor > New query > paste all > Run.
--
-- This loads the copy the website ships with. Running it a second
-- time changes nothing that has been edited since — existing rows
-- are left exactly as they are.
-- =============================================================

-- -------------------------------------------------------------
-- Company details
-- -------------------------------------------------------------
insert into public.site_settings (
  id, company_name, short_name, tagline,
  rc_number, legal_form, governing_act, registrar,
  email, phone, whatsapp, whatsapp_message, address, office_hours,
  header_cta_label, footer_blurb, meta_title, meta_description, og_image
) values (
  1,
  'Hiramar and Costa — Marine Logistics and Energy Services Limited',
  'Hiramar and Costa',
  'Marine Logistics & Energy',
  '9463814',
  'Private Company Limited by Shares',
  'CAMA 2020',
  'CAC Nigeria',
  'info@hiramarandcosta.com',
  '+234 817 207 0347',
  '',
  'Hello Hiramar and Costa, I would like to make an enquiry.',
  'Lagos, Nigeria',
  'Monday to Friday, 8am–5pm WAT',
  'Request a Quote',
  'A Nigerian marine logistics and energy services company delivering integrated solutions across the maritime, oil and gas, energy, logistics and offshore sectors.',
  'Hiramar and Costa — Marine Logistics and Energy Services Limited',
  'Hiramar and Costa is a Nigerian marine logistics and energy services company delivering vessel chartering, offshore support, crude oil evacuation, ship-to-ship operations and marine equipment supply.',
  'assets/img/hero.jpg'
)
on conflict (id) do nothing;


-- -------------------------------------------------------------
-- Sections — heading copy, navigation labels, running order
-- -------------------------------------------------------------
insert into public.page_sections
  (key, nav_label, nav_number, eyebrow, title, title_emphasis, lede, extra, sort_order)
values
  ('home', 'Home', '00',
   'RC 9463814 · Incorporated in Nigeria',
   'Marine logistics', 'run to schedule',
   'We support offshore operations, supply marine equipment, evacuate crude and charter vessels.',
   jsonb_build_object(
     'cta_primary',   jsonb_build_object('label', 'View equipment for sale', 'href', '#equipment'),
     'cta_secondary', jsonb_build_object('label', 'Talk to our team',        'href', '#contact',   'intent', 'team')
   ),
   10),

  ('about', 'About', '02',
   'About Us',
   'Integrated solutions across maritime, oil and gas, and energy', null,
   null, '{}'::jsonb, 20),

  ('mission', 'Mission', '04',
   'Mission & Vision',
   'What we are building toward', null,
   null, '{}'::jsonb, 30),

  ('services', 'Services', '06',
   'Core Services',
   'Seventeen services, four operating groups', null,
   'We cover the marine, energy and engineering scope of clients need.',
   '{}'::jsonb, 40),

  ('equipment', 'Equipment', '08',
   'Equipment for Sale',
   'Marine and oilfield equipment, ready to move', null,
   'Inspected units available for immediate sale. Ask for full specifications, inspection reports and delivery terms on any listing.',
   '{}'::jsonb, 50),

  ('contact', 'Contact', '10',
   'Contact Us',
   'Tell us what you need moved, chartered or supplied', null,
   'Send the details and our team will come back to you with availability, scope and pricing.',
   jsonb_build_object(
     'whatsapp_note', 'Prefer to send a quick message? Chat with our team directly and we will pick it up during Lagos business hours.',
     'submit_label',  'Send enquiry'
   ),
   60)
on conflict (key) do nothing;


-- -------------------------------------------------------------
-- About Us — body copy
-- -------------------------------------------------------------
insert into public.about_paragraphs (body, is_lead, sort_order)
select * from (values
  ('Hiramar and Costa — Marine Logistics and Energy Services Limited is a Nigerian marine logistics and energy services company established to provide integrated solutions across the maritime, oil and gas, energy, logistics and offshore sectors.', true, 10),
  ('The company is incorporated in Nigeria as a Private Company Limited by Shares under the Companies and Allied Matters Act 2020, registered with the Corporate Affairs Commission under company registration number 9463814.', false, 20),
  ('Our operations cover maritime and shipping services, marine logistics, vessel chartering, crude oil evacuation, container terminal and jetty operations, procurement of marine equipment, and ship-to-ship operations. We also provide marine support services to the oil, gas and energy industries, including offshore support, anchor handling, towing, mooring, dredging and underwater services.', false, 30),
  ('Our energy services extend to the procurement, supply, trading, distribution and marketing of petroleum and energy-related products, including crude oil, diesel, petrol, kerosene, LPG, LNG and other energy products.', false, 40),
  ('We also provide logistics, haulage, warehousing, storage and supply chain management services for petroleum products, equipment and industrial materials. Our technical capabilities cover offshore and onshore engineering services, maintenance, installation, fabrication and construction works for oil and gas facilities, pipelines and marine infrastructure.', false, 50),
  ('Our goal is to deliver safe, dependable, efficient and professional solutions tailored to the operational needs of our clients — supported by strong operational standards, effective project management and strategic partnerships. We also seek opportunities to collaborate with local and international organisations through partnerships and joint ventures, supporting sustainable growth and the expansion of our services within Nigeria and international markets.', false, 60)
) as v(body, is_lead, sort_order)
where not exists (select 1 from public.about_paragraphs);


-- -------------------------------------------------------------
-- Registry plate
-- -------------------------------------------------------------
insert into public.registry_facts (label, value, sort_order) values
  ('Registered name', 'Hiramar and Costa',                10),
  ('RC number',       '9463814',                          20),
  ('Company type',    'Ltd by Shares',                    30),
  ('Governing act',   'CAMA 2020',                        40),
  ('Registrar',       'CAC Nigeria',                      50),
  ('Sectors',         'Marine · Oil & Gas · Energy',      60),
  ('Coverage',        'Nigeria & International',          70)
on conflict (label) do nothing;


-- -------------------------------------------------------------
-- Capability strip
-- -------------------------------------------------------------
insert into public.capabilities (label, number_label, sort_order) values
  ('Vessel Chartering', '01', 10),
  ('Offshore Support',  '02', 20),
  ('Crude Evacuation',  '03', 30),
  ('Energy Products',   '04', 40),
  ('Equipment Supply',  '05', 50)
on conflict (label) do nothing;


-- -------------------------------------------------------------
-- Mission & Vision
-- -------------------------------------------------------------
insert into public.value_statements (kicker, heading, body, sort_order) values
  ('Our Vision',
   'Recognised for operational excellence',
   'To become a trusted marine logistics and energy services company recognised for operational excellence, safety, reliability and sustainable service delivery across Nigeria and international markets.',
   10),
  ('Our Mission',
   'Efficient solutions, responsibly delivered',
   'To provide efficient marine, logistics, oil and gas, and energy solutions through professional expertise, responsible operations, strong partnerships and a commitment to meeting our clients’ operational requirements.',
   20)
on conflict (kicker) do nothing;


-- -------------------------------------------------------------
-- Core services — four groups, seventeen services
-- -------------------------------------------------------------
insert into public.service_groups (name, sort_order) values
  ('Marine & Shipping',        10),
  ('Offshore & Subsea',        20),
  ('Energy & Supply Chain',    30),
  ('Engineering & Projects',   40)
on conflict (name) do nothing;

insert into public.services (group_id, name, sort_order)
select g.id, v.name, v.sort_order
  from (values
    ('Marine & Shipping',      'Marine logistics and shipping services',              10),
    ('Marine & Shipping',      'Vessel chartering and marine support',                20),
    ('Marine & Shipping',      'Crude oil evacuation',                                30),
    ('Marine & Shipping',      'Ship-to-ship operations',                             40),
    ('Marine & Shipping',      'Container terminal and jetty operations',             50),

    ('Offshore & Subsea',      'Offshore support and anchor handling',                10),
    ('Offshore & Subsea',      'Towing, mooring and dredging services',               20),
    ('Offshore & Subsea',      'Underwater marine services',                          30),

    ('Energy & Supply Chain',  'Petroleum and energy product supply',                 10),
    ('Energy & Supply Chain',  'Oil and gas logistics and haulage',                   20),
    ('Energy & Supply Chain',  'Warehousing and supply chain management',             30),
    ('Energy & Supply Chain',  'Import and export of marine and oilfield equipment',  40),

    ('Engineering & Projects', 'Offshore and onshore engineering services',           10),
    ('Engineering & Projects', 'Fabrication, installation and maintenance',           20),
    ('Engineering & Projects', 'Pipeline and marine infrastructure services',         30),
    ('Engineering & Projects', 'Marine equipment procurement and supply',             40),
    ('Engineering & Projects', 'Project management and consultancy',                  50)
  ) as v(group_name, name, sort_order)
  join public.service_groups g on g.name = v.group_name
on conflict (group_id, name) do nothing;


-- -------------------------------------------------------------
-- Dropdown choices
-- -------------------------------------------------------------
insert into public.option_lists (list_key, value, sort_order) values
  ('enquiry_type', 'General enquiry',                 10),
  ('enquiry_type', 'Vessel chartering',               20),
  ('enquiry_type', 'Offshore support',                30),
  ('enquiry_type', 'Crude oil evacuation',            40),
  ('enquiry_type', 'Petroleum and energy products',   50),
  ('enquiry_type', 'Equipment purchase',              60),
  ('enquiry_type', 'Partnership or joint venture',    70),

  ('equipment_category', 'Vessels',         10),
  ('equipment_category', 'Deck Equipment',  20),
  ('equipment_category', 'Power',           30),
  ('equipment_category', 'Subsea',          40),
  ('equipment_category', 'Transfer',        50),
  ('equipment_category', 'Safety',          60),
  ('equipment_category', 'Spares',          70),

  ('equipment_condition', 'New',                 10),
  ('equipment_condition', 'Refurbished',         20),
  ('equipment_condition', 'Used — surveyed',     30),
  ('equipment_condition', 'Used — tested',       40),
  ('equipment_condition', 'Used — certified',    50),
  ('equipment_condition', 'Used — low hours',    60)
on conflict (list_key, value) do nothing;


-- -------------------------------------------------------------
-- Site media
-- -------------------------------------------------------------
insert into public.site_media (key, photo_url, alt) values
  ('hero',       'assets/img/hero.jpg',
   'Self-elevating jack-up platform standing on its legs alongside a berth'),
  ('logo',       'assets/img/logo-mark.png',      'Hiramar and Costa'),
  ('logo_lockup','assets/img/logo-lockup.png',
   'Hiramar and Costa — Marine Logistics and Energy Services Limited'),
  ('logo_light', 'assets/img/logo-mark-light.png','Hiramar and Costa'),
  ('logo_full',  'assets/img/logo-footer.png',
   'Hiramar and Costa — Marine Logistics and Energy Services Limited'),
  ('og_image',   'assets/img/hero.jpg',           'Hiramar and Costa')
on conflict (key) do nothing;


-- -------------------------------------------------------------
-- Sample equipment, so the section looks complete on day one.
-- Delete these from the manager once your own listings are in.
-- -------------------------------------------------------------
insert into public.equipment
  (name, category, condition, year, location, price, reference, is_sample, sort_order)
values
  ('Anchor handling tug supply vessel',        'Vessels',        'Used — surveyed',  2011, 'Onne, Rivers State', 'Price on application', 'HC-AHT-001', true, 10),
  ('Deck crane, 25 t knuckle boom',            'Deck Equipment', 'Refurbished',      2016, 'Lagos',              'Price on application', 'HC-CRN-014', true, 20),
  ('Mooring winch, double drum',               'Deck Equipment', 'Used — tested',    2014, 'Warri, Delta State', 'Price on application', 'HC-WCH-006', true, 30),
  ('Containerised diesel generator, 500 kVA',  'Power',          'Used — low hours', 2019, 'Port Harcourt',      'Price on application', 'HC-GEN-022', true, 40),
  ('Subsea ROV, inspection class',             'Subsea',         'Used — certified', 2018, 'Lagos',              'Price on application', 'HC-ROV-003', true, 50),
  ('Cargo hose reel with 6 in. hoses',         'Transfer',       'New',              2024, 'Onne, Rivers State', 'Price on application', 'HC-HOS-031', true, 60)
on conflict (reference) where reference is not null do nothing;


-- =============================================================
-- FINISHED.
--
-- Reload your website — it is now reading from this database.
-- Reload admin.html and sign in to edit any of it.
-- =============================================================
