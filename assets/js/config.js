/* =============================================================
   HIRAMAR AND COSTA — SITE CONFIGURATION
   This is the only file you need to edit to connect the site.
   ============================================================= */

window.HC_CONFIG = {

  /* -----------------------------------------------------------
     1. SUPABASE — the database behind the whole website.
     Every section (home, about, mission, services, equipment,
     contact) and every enquiry the site receives lives here.

     Find these under: Dashboard > Project Settings > API Keys.
     The publishable key is safe to leave in this file — it can
     only read published content and leave an enquiry. Editing
     anything requires signing in at admin.html.
     ----------------------------------------------------------- */
  SUPABASE_URL: 'https://pewmcfatznoonjkatnuf.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_U8fwKVZRerDnP80D9pDN4w_GkUyd0sz',

  /* Older name for the same thing. Supabase renamed the "anon
     public" key to the "publishable" key; either works here. */
  SUPABASE_ANON_KEY: 'sb_publishable_U8fwKVZRerDnP80D9pDN4w_GkUyd0sz',

  /* Storage buckets. Both are created for you by supabase/schema.sql. */
  SUPABASE_BUCKET: 'equipment-photos',   /* photographs of listings */
  SUPABASE_MEDIA_BUCKET: 'site-media',   /* hero image, logos       */

  /* -----------------------------------------------------------
     2. FORMSPREE — optional.
     Enquiries are saved to Supabase and read in the manager's
     Enquiries tab. Add a Formspree endpoint as well if you also
     want each one emailed to you the moment it arrives.
     ----------------------------------------------------------- */
  FORMSPREE_ENDPOINT: '',

  /* -----------------------------------------------------------
     3. COMPANY DETAILS
     These are the fallback, used only before the database
     answers or if it cannot be reached. The live values are
     edited in admin.html > Settings, and they win.
     ----------------------------------------------------------- */
  COMPANY: {
    name: 'Hiramar and Costa — Marine Logistics and Energy Services Limited',
    shortName: 'Hiramar and Costa',
    rcNumber: '9463814',
    email: 'info@hiramarandcosta.com',
    phone: '+234 817 207 0347',
    address: 'Lagos, Nigeria',

    /* Leave blank to reuse the phone number above. Set it only if
       WhatsApp uses a different line. Full international form. */
    whatsapp: '',
    whatsappMessage: 'Hello Hiramar and Costa, I would like to make an enquiry.'
  }
};
