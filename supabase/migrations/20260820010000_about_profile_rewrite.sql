-- =============================================================
-- THE ABOUT US PROFILE, REWRITTEN
--
-- The company supplied new wording for About Us. The profile now
-- runs in full on the home page as well as on /about-us, so both
-- read from these rows and there is one copy of the text, not two.
--
-- What changed against the seeded wording:
--
--   * The opening line leads with the short name — "Hiramar and
--     Costa is a marine logistics and energy services company" —
--     rather than the full registered name.
--   * The incorporation paragraph (CAMA 2020, CAC, RC 9463814) is
--     switched off rather than deleted. The same facts are already
--     on the registry plate beside the profile on /about-us, and
--     the paragraph can be switched back on from the manager if it
--     is ever wanted in the body copy again.
--   * "We also provide logistics" reads "We provide logistics".
--   * The closing paragraph ends at strategic partnerships; the
--     sentence about joint ventures has been dropped.
--
-- Rows are matched on sort_order, which is how they were seeded and
-- how they still stand. Nothing is inserted and nothing is dropped,
-- so the table keeps its six rows and its shape.
-- =============================================================

update public.about_paragraphs
   set body = 'Hiramar and Costa is a marine logistics and energy services company established to provide integrated solutions across the maritime, oil and gas, energy, logistics and offshore sectors.'
 where sort_order = 10;

update public.about_paragraphs
   set is_visible = false
 where sort_order = 20;

update public.about_paragraphs
   set body = 'Our operations cover maritime and shipping services, marine logistics, vessel chartering, crude oil evacuation, container terminal and jetty operations, procurement of marine equipment, and ship-to-ship operations. We also provide marine support services to the oil, gas and energy industries, including offshore support, anchor handling, towing, mooring, dredging and underwater services.'
 where sort_order = 30;

update public.about_paragraphs
   set body = 'Our energy services extend to the procurement, supply, trading, distribution and marketing of petroleum and energy-related products, including crude oil, diesel, petrol, kerosene, LPG, LNG and other energy products.'
 where sort_order = 40;

update public.about_paragraphs
   set body = 'We provide logistics, haulage, warehousing, storage and supply chain management services for petroleum products, equipment and industrial materials. Our technical capabilities cover offshore and onshore engineering services, maintenance, installation, fabrication and construction works for oil and gas facilities, pipelines and marine infrastructure.'
 where sort_order = 50;

update public.about_paragraphs
   set body = 'Our goal is to deliver safe, dependable, efficient and professional solutions tailored to the operational needs of our clients, supported by strong operational standards, effective project management and strategic partnerships.'
 where sort_order = 60;
