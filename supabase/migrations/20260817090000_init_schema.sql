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
grant usage on schema public to anon, authenticated;

grant select on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media
  to anon, authenticated;

grant insert, update, delete on
  public.site_settings, public.page_sections, public.about_paragraphs,
  public.registry_facts, public.capabilities, public.value_statements,
  public.service_groups, public.services, public.equipment,
  public.equipment_photos, public.option_lists, public.site_media,
  public.enquiries
  to authenticated;

grant select on public.enquiries to authenticated;


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
