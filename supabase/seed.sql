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
   null,
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
