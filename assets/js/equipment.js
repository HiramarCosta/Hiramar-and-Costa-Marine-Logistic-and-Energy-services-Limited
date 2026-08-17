/* =============================================================
   EQUIPMENT FOR SALE

   Listings come from Supabase, arriving with the rest of the
   site content in one request. If the database has not been set
   up, or cannot be reached, the section falls back to whatever
   is saved in this browser so the page never looks broken.
   ============================================================= */
(function () {
  'use strict';

  var API   = window.HC_API;
  var STORE = window.HC_STORE;

  var grid    = document.getElementById('equipGrid');
  var count   = document.getElementById('equipCount');
  var filters = document.getElementById('equipFilters');
  var note    = document.getElementById('equipNote');
  if (!grid) return;

  var all = [];
  var active = 'All';
  var live = false;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function photoFor(item) {
    return (API && API.photoUrl(item)) || item.photo_data || item.photo_url || '';
  }

  function cardHTML(item) {
    var src = photoFor(item) || STORE.placeholder(item.name);
    var specs = '';
    if (item.condition) specs += '<li><span>Condition</span><b>' + esc(item.condition) + '</b></li>';
    if (item.year)      specs += '<li><span>Year</span><b>' + esc(item.year) + '</b></li>';
    if (item.location)  specs += '<li><span>Location</span><b>' + esc(item.location) + '</b></li>';
    if (item.reference) specs += '<li><span>Ref</span><b>' + esc(item.reference) + '</b></li>';

    /* Anything typed into the spec sheet shows here too. */
    var extra = item.specs && typeof item.specs === 'object' ? item.specs : {};
    Object.keys(extra).forEach(function (k) {
      if (extra[k] == null || extra[k] === '') return;
      specs += '<li><span>' + esc(k) + '</span><b>' + esc(extra[k]) + '</b></li>';
    });

    return '' +
      '<article class="card card--beam reveal">' +
        '<div class="card__media">' +
          '<img src="' + esc(src) + '" alt="' + esc(item.name) + '" loading="lazy">' +
          (item.category ? '<span class="card__tag">' + esc(item.category) + '</span>' : '') +
        '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__title">' + esc(item.name) + '</h3>' +
          (item.description ? '<p class="card__blurb">' + esc(item.description) + '</p>' : '') +
          (specs ? '<ul class="card__spec">' + specs + '</ul>' : '') +
          '<div class="card__foot">' +
            '<span class="card__price">' + esc(item.price || 'Price on application') + '</span>' +
            '<button class="btn btn--ghost btn--sm" type="button" ' +
              'data-enquire="' + esc(item.id) + '">Enquire</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var list = active === 'All'
      ? all
      : all.filter(function (i) { return i.category === active; });

    if (!list.length) {
      grid.innerHTML = '<p class="equip__empty u-mono">' +
        (all.length ? 'No listings in this category right now.'
                    : 'No equipment listed yet. Add your first unit from admin.html.') +
        '</p>';
    } else {
      grid.innerHTML = list.map(cardHTML).join('');
      Array.prototype.forEach.call(grid.querySelectorAll('.reveal'), function (el) {
        if (window.HC_reveal) window.HC_reveal(el); else el.classList.add('is-in');
      });
    }

    if (count) {
      count.textContent = list.length + (list.length === 1 ? ' unit listed' : ' units listed');
    }
  }

  function buildFilters() {
    if (!filters) return;
    var cats = ['All'];
    all.forEach(function (i) {
      if (i.category && cats.indexOf(i.category) === -1) cats.push(i.category);
    });
    if (cats.length <= 2) { filters.innerHTML = ''; return; }

    filters.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === active ? ' is-on' : '') +
             '" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  function show(rows) {
    all = rows || [];
    if (active !== 'All' && !all.some(function (i) { return i.category === active; })) {
      active = 'All';
    }
    buildFilters();
    render();
  }

  /* ---------- filtering ---------- */
  if (filters) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;
      active = btn.getAttribute('data-cat');
      Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
        c.classList.toggle('is-on', c === btn);
      });
      render();
    });
  }

  /* ---------- Enquire: carry the listing into the contact form ---------- */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-enquire]');
    if (!btn) return;

    var id = btn.getAttribute('data-enquire');
    var item = all.filter(function (i) { return String(i.id) === id; })[0];
    if (!item) return;

    if (window.HC_setEnquiryIntent) window.HC_setEnquiryIntent('equipment', item);

    var subject = document.getElementById('subject');
    if (subject) {
      for (var i = 0; i < subject.options.length; i++) {
        if (subject.options[i].value === 'Equipment purchase') { subject.selectedIndex = i; break; }
      }
    }

    var enquiry = document.getElementById('enquiry');
    if (enquiry) {
      enquiry.value = 'I would like details on: ' + item.name +
        (item.reference ? ' (ref ' + item.reference + ')' : '') +
        '\n\nPlease send specifications, inspection report, current condition ' +
        'and delivery terms.';
    }

    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      var first = document.getElementById('firstName');
      if (first) first.focus({ preventScroll: true });
    }, 600);
  });

  /* ---------- loading ---------- */

  function showLocal(reason) {
    show(STORE ? STORE.visible() : []);
    if (!note) return;

    var total  = STORE ? STORE.list().length : 0;
    var hidden = total - all.length;
    note.innerHTML = (reason ? esc(reason) + ' ' : '') +
      'These listings are saved in this browser only, so visitors will not see ' +
      'them yet. Add and remove equipment from ' +
      '<a href="admin.html" style="color:inherit">admin.html</a>.' +
      (hidden ? ' ' + hidden + (hidden === 1 ? ' listing is' : ' listings are') + ' hidden.' : '');
    note.hidden = false;
  }

  function watchLocal() {
    window.addEventListener('hc:equipment-changed', function () { showLocal(); });
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'hc_equipment_local') showLocal();
    });
    window.addEventListener('pageshow', function () { if (!live) showLocal(); });
  }

  /* The site content arrives in one request; the listings ride along. */
  window.addEventListener('hc:content', function (e) {
    var data = e.detail || {};
    live = true;
    if (note) { note.hidden = true; note.textContent = ''; }
    show(data.equipment || []);
  });

  window.addEventListener('hc:content-offline', function () {
    if (live) return;
    showLocal(API && API.configured ? 'Live listings could not be loaded.' : '');
    watchLocal();
  });

  /* Nothing configured at all — go straight to the browser copy. */
  if (!API || !API.configured) {
    showLocal();
    watchLocal();
  }
})();
