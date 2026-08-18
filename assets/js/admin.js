/* =============================================================
   WEBSITE MANAGER

   Four tabs, all writing to Supabase:
     Equipment  — the listings shown in "Equipment for Sale"
     Enquiries  — every message the website has received
     Content    — the wording of every section of the site
     Settings   — company and contact details

   Reading the site needs nothing. Everything in here needs a
   sign-in, which the database enforces itself: the publishable
   key in config.js cannot write a single row.
   ============================================================= */
(function () {
  'use strict';

  var API   = window.HC_API;
  var STORE = window.HC_STORE;
  var CFG   = window.HC_CONFIG || {};

  var $    = function (id) { return document.getElementById(id); };
  var show = function (el) { if (el) el.classList.remove('hidden'); };
  var hide = function (el) { if (el) el.classList.add('hidden'); };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function say(el, msg, ok) {
    if (!el) return;
    if (!msg) { el.textContent = ''; el.className = 'form__status u-mono'; return; }
    el.textContent = msg;
    el.className = 'form__status u-mono is-shown ' + (ok ? 'is-ok' : 'is-err');
  }

  /* A short confirmation beside the button that was just pressed. */
  function flash(el, msg, ok) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'rec__note' + (ok ? '' : ' rec__note--err');
    if (ok) setTimeout(function () { if (el.textContent === msg) el.textContent = ''; }, 2600);
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }


  /* =========================================================
     1. FIELDS — the shared form builder used by every tab
     ========================================================= */

  function fieldHTML(f, value) {
    var id = 'f_' + Math.random().toString(36).slice(2, 9);
    var v  = value == null ? '' : value;

    if (f.type === 'checkbox') {
      return '<div class="field rec__check">' +
               '<input type="checkbox" id="' + id + '" data-k="' + esc(f.k) + '"' +
                 (value ? ' checked' : '') + '>' +
               '<label for="' + id + '">' + esc(f.label) + '</label>' +
             '</div>';
    }

    if (f.type === 'textarea') {
      return '<div class="field">' +
               '<label for="' + id + '">' + esc(f.label) + '</label>' +
               '<textarea id="' + id + '" data-k="' + esc(f.k) + '"' +
                 (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + '>' +
                 esc(v) + '</textarea>' +
             '</div>';
    }

    if (f.type === 'select') {
      return '<div class="field">' +
               '<label for="' + id + '">' + esc(f.label) + '</label>' +
               '<select id="' + id + '" data-k="' + esc(f.k) + '">' +
                 (f.options || []).map(function (o) {
                   return '<option' + (String(o) === String(v) ? ' selected' : '') + '>' +
                          esc(o) + '</option>';
                 }).join('') +
               '</select>' +
             '</div>';
    }

    /* A jsonb column, shown as one row per value. Nested objects
       are flattened to "parent.child" so nothing needs hand-written
       JSON to edit a button label. */
    if (f.type === 'kv') {
      var flat = flatten(v || {});
      var keys = Object.keys(flat);
      if (!keys.length) return '';
      return '<div class="field" data-kv="' + esc(f.k) + '">' +
               '<label>' + esc(f.label) + '</label>' +
               keys.map(function (path) {
                 return '<div style="display:flex;gap:8px;margin-bottom:6px;align-items:center">' +
                          '<span class="muted" style="flex:0 0 auto;min-width:130px">' + esc(path) + '</span>' +
                          '<input type="text" data-kvk="' + esc(path) + '" value="' + esc(flat[path]) + '">' +
                        '</div>';
               }).join('') +
             '</div>';
    }

    var type = f.type || 'text';
    return '<div class="field">' +
             '<label for="' + id + '">' + esc(f.label) + '</label>' +
             '<input type="' + esc(type) + '" id="' + id + '" data-k="' + esc(f.k) + '"' +
               ' value="' + esc(v) + '"' +
               (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
               (f.list ? ' list="' + esc(f.list) + '"' : '') + '>' +
           '</div>';
  }

  function flatten(obj, prefix, out) {
    out = out || {}; prefix = prefix || '';
    Object.keys(obj || {}).forEach(function (k) {
      var val = obj[k];
      var path = prefix ? prefix + '.' + k : k;
      if (val && typeof val === 'object' && !Array.isArray(val)) flatten(val, path, out);
      else out[path] = val == null ? '' : val;
    });
    return out;
  }

  function unflatten(flat) {
    var out = {};
    Object.keys(flat).forEach(function (path) {
      var parts = path.split('.');
      var node = out;
      for (var i = 0; i < parts.length - 1; i++) {
        node[parts[i]] = node[parts[i]] || {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = flat[path];
    });
    return out;
  }

  /* Read every field back out of a card, ready for the database. */
  function readFields(root, fields) {
    var row = {};
    fields.forEach(function (f) {
      if (f.type === 'kv') {
        var wrap = root.querySelector('[data-kv="' + f.k + '"]');
        if (!wrap) return;
        var flat = {};
        Array.prototype.forEach.call(wrap.querySelectorAll('[data-kvk]'), function (inp) {
          flat[inp.getAttribute('data-kvk')] = inp.value;
        });
        row[f.k] = unflatten(flat);
        return;
      }

      var el = root.querySelector('[data-k="' + f.k + '"]');
      if (!el) return;

      if (f.type === 'checkbox')    row[f.k] = el.checked;
      else if (f.type === 'number') {
        var n = parseInt(el.value, 10);
        row[f.k] = isNaN(n) ? null : n;
      }
      else {
        var t = el.value.trim();
        row[f.k] = t === '' ? (f.required ? '' : null) : t;
      }
    });
    return row;
  }


  /* =========================================================
     2. WHAT LIVES WHERE — one description per editable table
     ========================================================= */

  var COLLECTIONS = [
    {
      table: 'page_sections',
      title: 'Section headings',
      sub: 'The small label, the headline and the opening line at the top of each part of the page.',
      order: 'sort_order.asc',
      canAdd: false, canDelete: false,
      label: function (r) { return r.nav_label || r.key; },
      fields: [
        { k: 'nav_label',      label: 'Menu label',      type: 'text' },
        { k: 'eyebrow',        label: 'Small label above the headline', type: 'text' },
        { k: 'title',          label: 'Headline',        type: 'text', required: true },
        { k: 'title_emphasis', label: 'Italic tail of the headline (home page only)', type: 'text' },
        { k: 'lede',           label: 'Opening line',    type: 'textarea' },
        { k: 'extra',          label: 'Buttons and extras', type: 'kv' },
        { k: 'sort_order',     label: 'Order',           type: 'number' },
        { k: 'is_visible',     label: 'Show this section on the website', type: 'checkbox' }
      ]
    },
    {
      table: 'about_paragraphs',
      title: 'About Us',
      sub: 'One card per paragraph. The opening paragraph is set in larger type.',
      order: 'sort_order.asc',
      label: function (r) { return String(r.body || '').slice(0, 60) + '…'; },
      blank: { body: '', is_lead: false, is_visible: true, sort_order: 100 },
      fields: [
        { k: 'body',       label: 'Paragraph', type: 'textarea', required: true },
        { k: 'is_lead',    label: 'Opening paragraph (larger type)', type: 'checkbox' },
        { k: 'sort_order', label: 'Order',     type: 'number' },
        { k: 'is_visible', label: 'Show on the website', type: 'checkbox' }
      ]
    },
    {
      table: 'registry_facts',
      title: 'Registry panel',
      sub: 'The list of company details printed beside About Us.',
      order: 'sort_order.asc',
      label: function (r) { return r.label; },
      blank: { label: '', value: '', is_visible: true, sort_order: 100 },
      fields: [
        { k: 'label',      label: 'Label',  type: 'text', required: true },
        { k: 'value',      label: 'Value',  type: 'text', required: true },
        { k: 'sort_order', label: 'Order',  type: 'number' },
        { k: 'is_visible', label: 'Show on the website', type: 'checkbox' }
      ]
    },
    {
      table: 'capabilities',
      title: 'Capability strip',
      sub: 'The row that travels across the screen under the hero photograph.',
      order: 'sort_order.asc',
      label: function (r) { return r.label; },
      blank: { label: '', number_label: '', is_visible: true, sort_order: 100 },
      fields: [
        { k: 'number_label', label: 'Number', type: 'text', placeholder: '06' },
        { k: 'label',        label: 'Capability', type: 'text', required: true },
        { k: 'sort_order',   label: 'Order',  type: 'number' },
        { k: 'is_visible',   label: 'Show on the website', type: 'checkbox' }
      ]
    },
    {
      table: 'value_statements',
      title: 'Mission & Vision',
      sub: 'The two statements on the dark band.',
      order: 'sort_order.asc',
      label: function (r) { return r.kicker; },
      blank: { kicker: '', heading: '', body: '', is_visible: true, sort_order: 100 },
      fields: [
        { k: 'kicker',     label: 'Label',    type: 'text', required: true, placeholder: 'Our Vision' },
        { k: 'heading',    label: 'Heading',  type: 'text', required: true },
        { k: 'body',       label: 'Statement', type: 'textarea', required: true },
        { k: 'sort_order', label: 'Order',    type: 'number' },
        { k: 'is_visible', label: 'Show on the website', type: 'checkbox' }
      ]
    },
    {
      table: 'option_lists',
      title: 'Dropdown choices',
      sub: 'The enquiry types offered on the contact form, and the categories and ' +
           'conditions suggested when adding equipment.',
      order: 'list_key.asc,sort_order.asc',
      label: function (r) { return r.list_key + ' · ' + r.value; },
      blank: { list_key: 'enquiry_type', value: '', is_visible: true, sort_order: 100 },
      fields: [
        { k: 'list_key',   label: 'List', type: 'select',
          options: ['enquiry_type', 'equipment_category', 'equipment_condition'] },
        { k: 'value',      label: 'Choice', type: 'text', required: true },
        { k: 'sort_order', label: 'Order',  type: 'number' },
        { k: 'is_visible', label: 'Offer this choice', type: 'checkbox' }
      ]
    },
    {
      table: 'site_media',
      title: 'Images',
      sub: 'The hero photograph and the logo files. Leave these alone unless you are ' +
           'swapping an image for one you have uploaded.',
      order: 'key.asc',
      canAdd: false,
      label: function (r) { return r.key; },
      fields: [
        { k: 'photo_url',  label: 'Image address', type: 'text' },
        { k: 'photo_path', label: 'Or a file in the site-media bucket', type: 'text' },
        { k: 'alt',        label: 'Description for screen readers', type: 'text' }
      ]
    }
  ];


  /* =========================================================
     3. RECORD CARDS
     ========================================================= */

  function recordCard(def, row, isNew) {
    var title = isNew ? 'New entry' : (def.label ? def.label(row) : '');
    return '<div class="rec' + (isNew ? ' rec--new' : '') + '" data-id="' + esc(row.id || '') + '">' +
             '<div class="rec__head">' +
               '<span class="rec__title">' + esc(title) + '</span>' +
             '</div>' +
             def.fields.map(function (f) { return fieldHTML(f, row[f.k]); }).join('') +
             '<div class="rec__acts">' +
               '<button class="mini mini--go" data-save type="button">' +
                 (isNew ? 'Add' : 'Save') + '</button>' +
               (!isNew && def.canDelete !== false
                 ? '<button class="mini mini--danger" data-del type="button">Delete</button>' : '') +
               '<span class="rec__note"></span>' +
             '</div>' +
           '</div>';
  }

  function wireCollection(pane, def) {
    pane.addEventListener('click', function (e) {
      var saveBtn = e.target.closest('[data-save]');
      var delBtn  = e.target.closest('[data-del]');
      if (!saveBtn && !delBtn) return;

      var card = e.target.closest('.rec');
      var note = card.querySelector('.rec__note');
      var id   = card.getAttribute('data-id');

      if (saveBtn) {
        var row = readFields(card, def.fields);

        var missing = def.fields.filter(function (f) {
          return f.required && !String(row[f.k] == null ? '' : row[f.k]).trim();
        });
        if (missing.length) {
          flash(note, 'Fill in ' + missing[0].label.toLowerCase(), false);
          return;
        }

        saveBtn.disabled = true;
        flash(note, 'Saving…', true);

        var work = id
          ? API.update(def.table, 'id=eq.' + id, row)
          : API.insert(def.table, row);

        work.then(function () {
          flash(note, id ? 'Saved' : 'Added', true);
          if (!id) loadCollection(pane, def);      /* the new row needs its id */
        })
        .catch(function (err) { flash(note, err.message, false); })
        .finally(function () { saveBtn.disabled = false; });
        return;
      }

      if (!window.confirm('Delete this entry? This cannot be undone.')) return;
      delBtn.disabled = true;
      API.remove(def.table, 'id=eq.' + id)
        .then(function () { card.remove(); })
        .catch(function (err) { flash(note, err.message, false); delBtn.disabled = false; });
    });
  }

  function loadCollection(pane, def) {
    var body = pane.querySelector('[data-body]');
    body.innerHTML = '<p class="muted">Loading…</p>';

    API.select(def.table, { order: def.order })
      .then(function (rows) {
        var html = rows.map(function (r) { return recordCard(def, r, false); }).join('');
        if (def.canAdd !== false) {
          html += recordCard(def, def.blank || {}, true);
        }
        body.innerHTML = html || '<p class="muted">Nothing here yet.</p>';
      })
      .catch(function (err) {
        body.innerHTML = '<p class="muted" style="color:#C0453B">Could not load: ' +
                         esc(err.message) + '</p>';
      });
  }


  /* =========================================================
     4. CORE SERVICES — groups, each holding its own services
     ========================================================= */

  var SERVICE_GROUP_FIELDS = [
    { k: 'name',       label: 'Group name', type: 'text', required: true },
    { k: 'blurb',      label: 'Description (optional)', type: 'text' },
    { k: 'sort_order', label: 'Order',      type: 'number' },
    { k: 'is_visible', label: 'Show this group', type: 'checkbox' }
  ];

  var SERVICE_FIELDS = [
    { k: 'name',       label: 'Service',  type: 'text', required: true },
    { k: 'sort_order', label: 'Order',    type: 'number' },
    { k: 'is_visible', label: 'Show',     type: 'checkbox' }
  ];

  function renderServices(pane) {
    var body = pane.querySelector('[data-body]');
    body.innerHTML = '<p class="muted">Loading…</p>';

    Promise.all([
      API.select('service_groups', { order: 'sort_order.asc' }),
      API.select('services', { order: 'sort_order.asc' })
    ])
    .then(function (res) {
      var groups = res[0], services = res[1];

      body.innerHTML = groups.map(function (g) {
        var mine = services.filter(function (s) { return s.group_id === g.id; });
        return '<div class="group" data-group="' + esc(g.id) + '">' +
                 '<h3 class="group__h">' + esc(g.name) + '</h3>' +
                 recordCard({ fields: SERVICE_GROUP_FIELDS, canDelete: true,
                              label: function () { return 'Group'; } }, g, false) +
                 mine.map(function (s) {
                   return recordCard({ fields: SERVICE_FIELDS, canDelete: true,
                                       label: function (r) { return r.name; } }, s, false);
                 }).join('') +
                 recordCard({ fields: SERVICE_FIELDS,
                              label: function () { return 'New service'; } },
                            { name: '', sort_order: 100, is_visible: true }, true) +
               '</div>';
      }).join('') +
      '<div class="group">' +
        '<h3 class="group__h">Add a group</h3>' +
        recordCard({ fields: SERVICE_GROUP_FIELDS, label: function () { return 'New group'; } },
                   { name: '', sort_order: 100, is_visible: true }, true) +
      '</div>';
    })
    .catch(function (err) {
      body.innerHTML = '<p class="muted" style="color:#C0453B">Could not load: ' +
                       esc(err.message) + '</p>';
    });
  }

  function wireServices(pane) {
    pane.addEventListener('click', function (e) {
      var saveBtn = e.target.closest('[data-save]');
      var delBtn  = e.target.closest('[data-del]');
      if (!saveBtn && !delBtn) return;

      var card    = e.target.closest('.rec');
      var groupEl = e.target.closest('[data-group]');
      var note    = card.querySelector('.rec__note');
      var id      = card.getAttribute('data-id');

      /* A card inside a group that carries a group_id field is a
         service; everything else is the group itself. */
      var isGroupCard = card.querySelector('[data-k="blurb"]') !== null;
      var table  = isGroupCard ? 'service_groups' : 'services';
      var fields = isGroupCard ? SERVICE_GROUP_FIELDS : SERVICE_FIELDS;

      if (delBtn) {
        var what = isGroupCard
          ? 'Delete this group and every service inside it?'
          : 'Delete this service?';
        if (!window.confirm(what)) return;
        delBtn.disabled = true;
        API.remove(table, 'id=eq.' + id)
          .then(function () { renderServices(pane); })
          .catch(function (err) { flash(note, err.message, false); delBtn.disabled = false; });
        return;
      }

      var row = readFields(card, fields);
      if (!row.name) { flash(note, 'Give it a name', false); return; }
      if (!isGroupCard && !id) {
        if (!groupEl) { flash(note, 'No group', false); return; }
        row.group_id = groupEl.getAttribute('data-group');
      }

      saveBtn.disabled = true;
      flash(note, 'Saving…', true);

      var work = id ? API.update(table, 'id=eq.' + id, row) : API.insert(table, row);
      work.then(function () {
        flash(note, id ? 'Saved' : 'Added', true);
        if (!id) renderServices(pane);
      })
      .catch(function (err) { flash(note, err.message, false); saveBtn.disabled = false; });
    });
  }


  /* =========================================================
     5. THE CONTENT TAB
     ========================================================= */

  function buildContentTab() {
    var host = $('contentPanes');
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';

    /* Section headings first, then the services editor, then the rest. */
    var order = COLLECTIONS.slice();
    var panes = [];

    order.forEach(function (def, i) {
      panes.push({ def: def, open: i === 0 });
      if (def.table === 'value_statements') {
        panes.push({ services: true });
      }
    });

    host.innerHTML = panes.map(function (p) {
      if (p.services) {
        return '<details class="panel" data-pane="services">' +
                 '<summary>Core services</summary>' +
                 '<p class="panel__sub" style="margin-top:14px">' +
                   'The four operating groups and the services inside each one.</p>' +
                 '<div data-body></div>' +
               '</details>';
      }
      return '<details class="panel" data-pane="' + esc(p.def.table) + '"' +
               (p.open ? ' open' : '') + '>' +
               '<summary>' + esc(p.def.title) + '</summary>' +
               '<p class="panel__sub" style="margin-top:14px">' + esc(p.def.sub) + '</p>' +
               '<div data-body></div>' +
             '</details>';
    }).join('');

    /* Load a section the first time it is opened, not before. */
    Array.prototype.forEach.call(host.querySelectorAll('details[data-pane]'), function (pane) {
      var key = pane.getAttribute('data-pane');
      var def = COLLECTIONS.filter(function (d) { return d.table === key; })[0];

      var load = function () {
        if (pane.dataset.loaded) return;
        pane.dataset.loaded = '1';
        if (key === 'services') { renderServices(pane); wireServices(pane); }
        else { loadCollection(pane, def); wireCollection(pane, def); }
      };

      pane.addEventListener('toggle', function () { if (pane.open) load(); });
      if (pane.open) load();
    });
  }


  /* =========================================================
     6. SETTINGS
     ========================================================= */

  var SETTINGS_FIELDS = [
    { k: 'company_name',     label: 'Full registered name', type: 'text' },
    { k: 'short_name',       label: 'Short name (used in the header)', type: 'text' },
    { k: 'tagline',          label: 'Tagline under the logo', type: 'text' },
    { k: 'rc_number',        label: 'RC number',   type: 'text' },
    { k: 'legal_form',       label: 'Company type', type: 'text' },
    { k: 'governing_act',    label: 'Governing act', type: 'text' },
    { k: 'registrar',        label: 'Registrar',   type: 'text' },
    { k: 'email',            label: 'Email address', type: 'email' },
    { k: 'phone',            label: 'Telephone',   type: 'tel' },
    { k: 'whatsapp',         label: 'WhatsApp number (leave blank to reuse the telephone)', type: 'tel' },
    { k: 'whatsapp_message', label: 'Message the WhatsApp chat opens with', type: 'text' },
    { k: 'address',          label: 'Registered office', type: 'text' },
    { k: 'office_hours',     label: 'Office hours', type: 'text' },
    { k: 'header_cta_label', label: 'Header button wording', type: 'text' },
    { k: 'footer_blurb',     label: 'Footer paragraph', type: 'textarea' },
    { k: 'meta_title',       label: 'Browser tab and search-result title', type: 'text' },
    { k: 'meta_description', label: 'Search-result description', type: 'textarea' },
    { k: 'notify_email',     label: 'Send enquiry alerts to', type: 'email' },
    { k: 'facebook_url',     label: 'Facebook', type: 'url' },
    { k: 'linkedin_url',     label: 'LinkedIn', type: 'url' },
    { k: 'instagram_url',    label: 'Instagram', type: 'url' },
    { k: 'twitter_url',      label: 'X / Twitter', type: 'url' }
  ];

  function buildSettingsTab() {
    var host = $('settingsForm');
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';
    host.innerHTML = '<p class="muted">Loading…</p>';

    API.select('site_settings', { filter: 'id=eq.1' })
      .then(function (rows) {
        var row = rows[0] || { id: 1 };
        host.innerHTML =
          '<div class="rec" data-id="1">' +
            SETTINGS_FIELDS.map(function (f) { return fieldHTML(f, row[f.k]); }).join('') +
            '<div class="rec__acts">' +
              '<button class="btn btn--solid" data-save-settings type="button">Save details</button>' +
              '<span class="rec__note"></span>' +
            '</div>' +
          '</div>';
      })
      .catch(function (err) {
        host.innerHTML = '<p class="muted" style="color:#C0453B">Could not load: ' +
                         esc(err.message) + '</p>';
      });

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-save-settings]');
      if (!btn) return;
      var card = e.target.closest('.rec');
      var note = card.querySelector('.rec__note');
      var row  = readFields(card, SETTINGS_FIELDS);
      row.id = 1;

      /* The database refuses these two empty; say so plainly here. */
      if (!row.company_name || !row.short_name) {
        flash(note, 'The full name and the short name are both required', false);
        return;
      }

      btn.disabled = true;
      flash(note, 'Saving…', true);
      API.upsert('site_settings', row, 'id')
        .then(function () { flash(note, 'Saved', true); })
        .catch(function (err) { flash(note, err.message, false); })
        .finally(function () { btn.disabled = false; });
    });
  }


  /* =========================================================
     7. ENQUIRIES
     ========================================================= */

  var enquiries = [];
  var enqFilter = 'all';

  var KIND_LABEL = {
    general: 'General enquiry', quote: 'Quote request',
    team: 'Talk to our team',   equipment: 'Equipment'
  };

  function enquiryHTML(e) {
    var name = [e.first_name, e.surname].filter(Boolean).join(' ');
    var meta = [];
    if (e.email) meta.push('<a href="mailto:' + esc(e.email) + '">' + esc(e.email) + '</a>');
    if (e.phone) meta.push('<a href="tel:' + esc(String(e.phone).replace(/[^\d+]/g, '')) + '">' +
                           esc(e.phone) + '</a>');
    if (e.enquiry_type)   meta.push(esc(e.enquiry_type));
    if (e.equipment_name) meta.push('Listing: ' + esc(e.equipment_name));

    return '<article class="enq' + (e.status === 'new' ? ' is-new' : '') + '" data-enq="' + esc(e.id) + '">' +
             '<div class="enq__top">' +
               '<span class="enq__who">' + esc(name) + '</span>' +
               '<span class="pill pill--' + esc(e.kind) + '">' + esc(KIND_LABEL[e.kind] || e.kind) + '</span>' +
               (e.status === 'new' ? '<span class="pill pill--new">New</span>'
                                   : '<span class="pill">' + esc(e.status.replace('_', ' ')) + '</span>') +
               '<span class="enq__when">' + esc(when(e.created_at)) + '</span>' +
             '</div>' +
             '<p class="enq__body">' + esc(e.message) + '</p>' +
             '<p class="enq__meta">' + meta.join(' &middot; ') + '</p>' +
             (e.staff_notes ? '<p class="enq__meta"><b>Note:</b> ' + esc(e.staff_notes) + '</p>' : '') +
             '<div class="enq__acts">' +
               '<a class="mini mini--go" href="mailto:' + esc(e.email) +
                 '?subject=' + encodeURIComponent('Re: your enquiry to Hiramar and Costa') + '">Reply</a>' +
               (e.status === 'new'
                 ? '<button class="mini" data-status="in_progress" type="button">Mark in progress</button>' : '') +
               (e.status !== 'answered'
                 ? '<button class="mini" data-status="answered" type="button">Mark answered</button>' : '') +
               (e.status !== 'closed'
                 ? '<button class="mini" data-status="closed" type="button">Close</button>' : '') +
               '<button class="mini" data-note type="button">Add note</button>' +
               '<button class="mini mini--danger" data-delete type="button">Delete</button>' +
               '<span class="rec__note"></span>' +
             '</div>' +
           '</article>';
  }

  function renderEnquiries() {
    var list = $('enqList');
    var rows = enquiries.filter(function (e) {
      if (enqFilter === 'all') return true;
      if (enqFilter === 'new') return e.status === 'new';
      return e.kind === enqFilter;
    });

    list.innerHTML = rows.length
      ? rows.map(enquiryHTML).join('')
      : '<p class="muted">Nothing here yet.</p>';

    var fresh = enquiries.filter(function (e) { return e.status === 'new'; }).length;
    $('enqCount').textContent = enquiries.length +
      (enquiries.length === 1 ? ' enquiry' : ' enquiries') +
      (fresh ? ' — ' + fresh + ' not yet dealt with.' : '');

    var badge = $('newCount');
    if (fresh) { badge.textContent = fresh; show(badge); } else { hide(badge); }
  }

  function loadEnquiries() {
    var list = $('enqList');
    list.innerHTML = '<p class="muted">Loading…</p>';
    return API.select('enquiries', { order: 'created_at.desc', limit: 500 })
      .then(function (rows) { enquiries = rows || []; renderEnquiries(); })
      .catch(function (err) {
        list.innerHTML = '<p class="muted" style="color:#C0453B">Could not load: ' +
                         esc(err.message) + '</p>';
      });
  }

  function wireEnquiries() {
    $('enqFilters').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      enqFilter = btn.getAttribute('data-filter');
      Array.prototype.forEach.call($('enqFilters').querySelectorAll('.chipbtn'), function (c) {
        c.classList.toggle('is-on', c === btn);
      });
      renderEnquiries();
    });

    $('enqList').addEventListener('click', function (e) {
      var card = e.target.closest('[data-enq]');
      if (!card) return;
      var id   = card.getAttribute('data-enq');
      var note = card.querySelector('.rec__note');

      var statusBtn = e.target.closest('[data-status]');
      if (statusBtn) {
        var status = statusBtn.getAttribute('data-status');
        var patch = { status: status };
        if (status !== 'new') patch.handled_at = new Date().toISOString();
        flash(note, 'Saving…', true);
        API.update('enquiries', 'id=eq.' + id, patch)
          .then(loadEnquiries)
          .catch(function (err) { flash(note, err.message, false); });
        return;
      }

      if (e.target.closest('[data-note]')) {
        var current = (enquiries.filter(function (x) { return x.id === id; })[0] || {}).staff_notes || '';
        var text = window.prompt('Note for the team:', current);
        if (text === null) return;
        API.update('enquiries', 'id=eq.' + id, { staff_notes: text || null })
          .then(loadEnquiries)
          .catch(function (err) { flash(note, err.message, false); });
        return;
      }

      if (e.target.closest('[data-delete]')) {
        if (!window.confirm('Delete this enquiry permanently?')) return;
        API.remove('enquiries', 'id=eq.' + id)
          .then(loadEnquiries)
          .catch(function (err) { flash(note, err.message, false); });
      }
    });

    $('enqRefresh').addEventListener('click', loadEnquiries);
    $('enqExport').addEventListener('click', exportEnquiries);
  }

  function exportEnquiries() {
    var cols = ['created_at', 'kind', 'status', 'first_name', 'surname', 'email', 'phone',
                'enquiry_type', 'equipment_name', 'message', 'staff_notes', 'source_url'];

    var cell = function (v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    };
    var csv = [cols.join(',')].concat(
      enquiries.map(function (e) { return cols.map(function (c) { return cell(e[c]); }).join(','); })
    ).join('\r\n');

    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = 'hiramar-enquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }


  /* =========================================================
     8. EQUIPMENT
     ========================================================= */

  var chosenFile = null;
  var editingId  = null;

  function equipFields() {
    var year = parseInt($('eYear').value, 10);
    return {
      name:        $('eName').value.trim(),
      category:    $('eCategory').value.trim()    || null,
      condition:   $('eCondition').value.trim()   || null,
      year:        isNaN(year) ? null : year,
      location:    $('eLocation').value.trim()    || null,
      price:       $('ePrice').value.trim()       || 'Price on application',
      reference:   $('eRef').value.trim()         || null,
      description: $('eDescription').value.trim() || null
    };
  }

  function clearEquipForm() {
    $('addForm').reset();
    chosenFile = null;
    editingId = null;
    hide($('preview')); show($('dropText')); $('preview').src = '';
    $('addPanelH').textContent = 'Add equipment';
    $('addBtn').textContent = 'Save listing';
    hide($('cancelEdit'));
  }

  function takeFile(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      say($('addStatus'), 'That file is not an image. Choose a JPG or PNG.', false);
      return;
    }
    chosenFile = f;
    say($('addStatus'), '', true);
    var reader = new FileReader();
    reader.onload = function (ev) {
      $('preview').src = ev.target.result;
      show($('preview')); hide($('dropText'));
    };
    reader.readAsDataURL(f);
  }

  function equipRowHTML(r) {
    var thumb = API.photoUrl(r) || STORE.placeholder(r.name, true);
    var meta = [r.category, r.condition, r.year, r.location, r.reference]
      .filter(Boolean).join(' · ');
    return '<div class="rowitem" data-row="' + esc(r.id) + '">' +
             '<img src="' + esc(thumb) + '" alt="">' +
             '<div class="rowitem__main">' +
               '<div class="rowitem__name">' + esc(r.name) + '</div>' +
               '<div class="rowitem__meta">' + esc(meta) +
                 (r.is_available ? '' : ' · HIDDEN') + '</div>' +
             '</div>' +
             '<div class="rowitem__acts">' +
               '<button class="mini" data-edit type="button">Edit</button>' +
               '<button class="mini" data-toggle type="button">' +
                 (r.is_available ? 'Hide' : 'Show') + '</button>' +
               '<button class="mini mini--danger" data-del type="button">Delete</button>' +
             '</div>' +
           '</div>';
  }

  var listings = [];

  function loadEquipment() {
    var wrap = $('rowlist');
    wrap.innerHTML = '<p class="muted">Loading…</p>';
    return API.select('equipment', { order: 'sort_order.asc,created_at.desc' })
      .then(function (rows) {
        listings = rows || [];
        if (!listings.length) {
          wrap.innerHTML = '<p class="muted">Nothing listed yet. Add your first unit above.</p>';
          $('listCount').textContent = '';
          return;
        }
        var visible = listings.filter(function (r) { return r.is_available; }).length;
        $('listCount').textContent = listings.length +
          (listings.length === 1 ? ' listing' : ' listings') +
          ' — ' + visible + ' showing on the website.';
        wrap.innerHTML = listings.map(equipRowHTML).join('');
      })
      .catch(function (err) {
        wrap.innerHTML = '<p class="muted" style="color:#C0453B">Could not load: ' +
                         esc(err.message) + '</p>';
      });
  }

  function fillDatalists() {
    API.select('option_lists', { order: 'sort_order.asc' })
      .then(function (rows) {
        var fill = function (listKey, el) {
          el.innerHTML = rows
            .filter(function (r) { return r.list_key === listKey; })
            .map(function (r) { return '<option value="' + esc(r.value) + '">'; })
            .join('');
        };
        fill('equipment_category',  $('catList'));
        fill('equipment_condition', $('condList'));
      })
      .catch(function () { /* the inputs still accept free text */ });
  }

  function wireEquipment() {
    var input = $('photo'), drop = $('drop');
    input.addEventListener('change', function () { takeFile(this.files[0]); });

    ['dragenter', 'dragover'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) takeFile(e.dataTransfer.files[0]);
    });

    $('cancelEdit').addEventListener('click', function () {
      clearEquipForm();
      say($('addStatus'), '', true);
    });

    $('addForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var data = equipFields();
      if (!data.name) {
        say($('addStatus'), 'Give the equipment a name before saving.', false);
        return;
      }

      var btn = $('addBtn');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      say($('addStatus'), chosenFile ? 'Uploading photograph…' : 'Saving…', true);

      /* Shrink the photograph before it goes up: faster to upload,
         faster for every visitor afterwards. */
      var upload = Promise.resolve(null);
      if (chosenFile) {
        var safe = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                     .replace(/^-|-$/g, '').slice(0, 48);
        var path = Date.now() + '-' + (safe || 'listing') + '.jpg';
        upload = STORE.readPhoto(chosenFile, 1600, 0.82)
          .then(function (dataUrl) { return fetch(dataUrl); })
          .then(function (r) { return r.blob(); })
          .then(function (blob) { return API.upload(CFG.SUPABASE_BUCKET || 'equipment-photos', path, blob); });
      }

      upload
        .then(function (path) {
          if (path) data.photo_path = path;
          say($('addStatus'), 'Saving listing…', true);
          return editingId
            ? API.update('equipment', 'id=eq.' + editingId, data)
            : API.insert('equipment', data);
        })
        .then(function () {
          var wasEditing = editingId;
          clearEquipForm();
          say($('addStatus'), wasEditing
            ? 'Updated. The website now shows the new details.'
            : 'Saved. The listing is live on the website.', true);
          loadEquipment();
        })
        .catch(function (err) { say($('addStatus'), 'Could not save: ' + err.message, false); })
        .finally(function () { btn.disabled = false; btn.textContent = editingId ? 'Update listing' : 'Save listing'; });
    });

    $('rowlist').addEventListener('click', function (e) {
      var row = e.target.closest('[data-row]');
      if (!row) return;
      var id = row.getAttribute('data-row');
      var item = listings.filter(function (r) { return r.id === id; })[0];
      if (!item) return;

      if (e.target.closest('[data-edit]')) {
        editingId = id;
        $('eName').value        = item.name || '';
        $('eCategory').value    = item.category || '';
        $('eCondition').value   = item.condition || '';
        $('eYear').value        = item.year || '';
        $('eLocation').value    = item.location || '';
        $('ePrice').value       = item.price || '';
        $('eRef').value         = item.reference || '';
        $('eDescription').value = item.description || '';

        var photo = API.photoUrl(item);
        if (photo) { $('preview').src = photo; show($('preview')); hide($('dropText')); }
        else { hide($('preview')); show($('dropText')); }
        chosenFile = null;

        $('addPanelH').textContent = 'Edit listing';
        $('addBtn').textContent = 'Update listing';
        show($('cancelEdit'));
        say($('addStatus'), 'Editing “' + item.name + '”. Leave the photograph alone to keep it.', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (e.target.closest('[data-toggle]')) {
        API.update('equipment', 'id=eq.' + id, { is_available: !item.is_available })
          .then(loadEquipment)
          .catch(function (err) { say($('addStatus'), err.message, false); });
        return;
      }

      if (e.target.closest('[data-del]')) {
        if (!window.confirm('Delete “' + item.name + '” permanently? This cannot be undone.')) return;
        API.remove('equipment', 'id=eq.' + id)
          .then(function () {
            if (item.photo_path) {
              API.removeFile(CFG.SUPABASE_BUCKET || 'equipment-photos', item.photo_path);
            }
            if (editingId === id) clearEquipForm();
            loadEquipment();
          })
          .catch(function (err) { say($('addStatus'), err.message, false); });
      }
    });
  }


  /* =========================================================
     9. TABS, SIGN IN, AND BOOT
     ========================================================= */

  var built = {};
  var wired = false;

  function openTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('is-on', t.getAttribute('data-tab') === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tabpane'), function (p) {
      p.classList.toggle('hidden', p.id !== 'pane-' + name);
    });

    if (built[name]) return;
    built[name] = true;

    if (name === 'enquiries') { wireEnquiries(); loadEnquiries(); }
    if (name === 'content')   { buildContentTab(); }
    if (name === 'settings')  { buildSettingsTab(); }
  }

  /* The tab strip. Without this the manager opens on Equipment and
     the other three panes can never be reached. */
  function wireTabs() {
    var bar = $('tabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab');
      if (!btn) return;
      openTab(btn.getAttribute('data-tab'));
    });
  }

  function enterManager(user) {
    hide($('loginPanel'));
    hide($('setupBanner'));
    show($('tabs'));
    show($('signOut'));

    if (user && user.email) {
      $('whoAmI').textContent = 'Signed in as ' + user.email;
      show($('whoAmI'));
    }

    built = {};
    openTab('equipment');
    if (!wired) { wireTabs(); wireEquipment(); wired = true; }
    fillDatalists();
    loadEquipment();

    /* Keep the badge on the Enquiries tab honest without opening it. */
    API.select('enquiries', { select: 'id', filter: 'status=eq.new', limit: 200 })
      .then(function (rows) {
        var badge = $('newCount');
        if (rows && rows.length) { badge.textContent = rows.length; show(badge); }
      })
      .catch(function () {});
  }

  function leaveManager() {
    hide($('tabs'));
    hide($('signOut'));
    hide($('whoAmI'));
    Array.prototype.forEach.call(document.querySelectorAll('.tabpane'), hide);
    show($('loginPanel'));
  }

  function wireSignIn() {
    $('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('loginBtn');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      say($('loginStatus'), '', true);

      API.signIn($('loginEmail').value.trim(), $('loginPass').value, $('loginRemember').checked)
        .then(function (session) {
          $('loginForm').reset();
          enterManager(session.user);
        })
        .catch(function (err) {
          say($('loginStatus'), err.message +
            '. Check the email and password set in Supabase → Authentication → Users.', false);
        })
        .finally(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
    });

    $('signOut').addEventListener('click', function () {
      API.signOut().then(leaveManager);
    });

    /* Forgotten password: Supabase emails a one-time link. */
    $('forgotBtn').addEventListener('click', function () {
      var email = $('loginEmail').value.trim();
      if (!email) {
        say($('loginStatus'), 'Type your email address above first, then press this again.', false);
        $('loginEmail').focus();
        return;
      }
      var btn = this;
      btn.disabled = true;
      say($('loginStatus'), 'Sending a reset link to ' + email + '…', true);

      API.requestPasswordReset(email)
        .then(function () {
          say($('loginStatus'),
            'Check ' + email + ' for a link from Supabase. Opening it brings you ' +
            'back here to choose a new password. It can take a minute to arrive.', true);
        })
        .catch(function (err) {
          say($('loginStatus'), 'Could not send the link: ' + err.message, false);
        })
        .finally(function () { btn.disabled = false; });
    });

    /* The form shown after a reset link has been opened. */
    $('resetForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var a = $('newPass').value, b = $('newPass2').value;

      if (a.length < 8) {
        say($('resetStatus'), 'Use at least 8 characters.', false); return;
      }
      if (a !== b) {
        say($('resetStatus'), 'The two passwords do not match.', false); return;
      }

      var btn = $('resetBtn');
      btn.disabled = true;
      say($('resetStatus'), 'Saving…', true);

      API.setPassword(a)
        .then(function () {
          say($('resetStatus'), 'Saved. Signing you in…', true);
          return API.whoAmI();
        })
        .then(function (user) {
          hide($('resetPanel'));
          enterManager(user);
        })
        .catch(function (err) {
          say($('resetStatus'), 'Could not save it: ' + err.message +
            '. The link may have expired — request a new one.', false);
          btn.disabled = false;
        });
    });
  }

  /* ---------- start ---------- */

  if (!API || !API.configured) {
    show($('setupBanner'));
    $('setupBannerText').innerHTML =
      'No Supabase project is set in <code>assets/js/config.js</code>. ' +
      'Add the project URL and publishable key, then reload this page.';
    return;
  }

  wireSignIn();

  /* Is the database actually set up? Ask it for the settings row —
     a request the publishable key is allowed to make. */
  API.select('site_settings', { select: 'id', limit: 1 })
    .catch(function (err) {
      show($('setupBanner'));
      $('setupBannerText').innerHTML =
        'The database answered: <code>' + esc(err.message) + '</code><br>' +
        'Run <code>supabase/schema.sql</code> and then <code>supabase/seed.sql</code> ' +
        'in your Supabase project&rsquo;s SQL Editor, and reload this page.';
    });

  /* Arriving from a reset email? Take the tokens out of the address
     bar and offer the new-password form instead of the sign-in form. */
  var linkType = API.adoptLinkSession();

  if (linkType === 'recovery') {
    leaveManager();
    hide($('loginPanel'));
    show($('resetPanel'));
  } else if (API.signedIn()) {
    API.whoAmI()
      .then(enterManager)
      .catch(function () { API.signOut(); leaveManager(); });
  } else {
    leaveManager();
  }
})();
