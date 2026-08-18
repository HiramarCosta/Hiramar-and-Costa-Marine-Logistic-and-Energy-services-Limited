/* =============================================================
   SITE CONTENT

   Fetches the entire website from Supabase in a single request
   and writes it into the page: hero, capability strip, about,
   registry plate, mission and vision, core services, section
   headings, navigation labels, contact details and footer.

   The copy already written into index.html is the fallback. If
   the database is slow, unreachable, or has not been set up yet,
   the visitor still sees a complete page — nothing here empties
   anything it cannot replace.
   ============================================================= */
(function () {
  'use strict';

  var API = window.HC_API;
  var CFG = window.HC_CONFIG || {};

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Only ever writes when there is something to write. */
  function setText(el, value) {
    if (el && value != null && String(value).trim() !== '') el.textContent = value;
  }

  function one(root, sel) { return root ? root.querySelector(sel) : null; }

  /* Which section a navigation link points at. There are three shapes
     of link now: "#mission" within a page, "index.html#mission" from
     another page, and "/about-us", "/services" or "/equipment" — the
     three sections that have a page to themselves. */
  function sectionKey(href) {
    href = String(href || '');
    var hash = href.indexOf('#');
    if (hash !== -1) return href.slice(hash + 1);
    if (/(^|\/)about-us(\.html)?$/.test(href))  return 'about';
    if (/(^|\/)services(\.html)?$/.test(href))  return 'services';
    if (/(^|\/)equipment(\.html)?$/.test(href)) return 'equipment';
    if (/(^|\/)contact(\.html)?$/.test(href))   return 'contact';
    return '';
  }

  /* Four sections moved to pages of their own. An "#about",
     "#services", "#equipment" or "#contact" saved in the manager
     before the move still has to arrive there. */
  var OWN_PAGE = {
    '#about':     '/about-us',
    '#services':  '/services',
    '#equipment': '/equipment',
    '#contact':   '/contact'
  };

  function pageHref(href) {
    return OWN_PAGE[String(href)] || String(href);
  }

  function reveal(el) {
    if (window.HC_reveal) window.HC_reveal(el); else el.classList.add('is-in');
  }

  function revealAll(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.reveal'), reveal);
  }

  /* ---------- section headings ---------- */

  function applySections(sections) {
    if (!sections || !sections.length) return;

    var byKey = {};
    sections.forEach(function (s) { byKey[s.key] = s; });

    sections.forEach(function (s) {
      var band = document.getElementById(s.key);
      if (!band) return;

      if (s.key === 'home') {
        applyHero(s, band);
      } else {
        setText(one(band, '.band__eyebrow'), s.eyebrow);
        setText(one(band, '.band__title'),   s.title);
        setText(one(band, '.band__lede'),    s.lede);
      }
    });

    /* Navigation labels, in the header, the drawer, the draft-mark
       rail and the footer. The links themselves stay put, so the
       scroll spy set up in main.js keeps working. */
    var navSelectors = '.nav__link, .drawer a, .draft-tick, .foot__list a';
    Array.prototype.forEach.call(document.querySelectorAll(navSelectors), function (a) {
      var key = sectionKey(a.getAttribute('href'));
      if (!key) return;
      var s = byKey[key];
      var li = a.closest('li');

      if (!s) {                       /* section was switched off */
        a.hidden = true;
        if (li) li.hidden = true;
        return;
      }

      var label = one(a, '.draft-tick__label');
      var num   = one(a, '.draft-tick__num');
      if (label) { setText(label, s.nav_label); setText(num, s.nav_number); }
      else       { setText(a, s.nav_label); }
    });

    /* A section that is switched off should not be on the page. */
    ['home', 'about', 'mission', 'services', 'equipment', 'contact'].forEach(function (key) {
      var band = document.getElementById(key);
      if (band && !byKey[key]) band.hidden = true;
    });
  }

  function applyHero(s, hero) {
    setText(one(hero, '.hero__eyebrow'), s.eyebrow);
    setText(one(hero, '.hero__lede'),    s.lede);

    var title = one(hero, '.hero__title');
    if (title && s.title) {
      title.innerHTML = esc(s.title) +
        (s.title_emphasis ? ' <em>' + esc(s.title_emphasis) + '</em>' : '');
    }

    var extra = s.extra || {};
    var buttons = hero.querySelectorAll('.hero__cta .btn');
    [extra.cta_primary, extra.cta_secondary].forEach(function (cta, i) {
      var btn = buttons[i];
      if (!btn) return;
      if (!cta || !cta.label) { btn.hidden = true; return; }
      btn.hidden = false;
      btn.textContent = cta.label;
      if (cta.href) btn.setAttribute('href', pageHref(cta.href));
      if (cta.intent) btn.setAttribute('data-intent', cta.intent);
    });
  }

  /* ---------- hero photograph and logos ---------- */

  function applyMedia(media) {
    if (!media) return;
    var bucket = CFG.SUPABASE_MEDIA_BUCKET || 'site-media';

    function srcFor(entry) {
      if (!entry) return '';
      if (entry.photo_path) return API.publicUrl(bucket, entry.photo_path);
      return entry.photo_url || '';
    }

    var hero = document.querySelector('.hero__media img');
    var heroSrc = srcFor(media.hero);
    if (hero && heroSrc) {
      hero.setAttribute('src', heroSrc);
      if (media.hero.alt) hero.setAttribute('alt', media.hero.alt);
    }

    var footLogo = document.querySelector('.foot__logo');
    var footSrc  = srcFor(media.logo_full);
    if (footLogo && footSrc) footLogo.setAttribute('src', footSrc);

    /* The masthead lockup. Its alt text is set from the company
       name in applySettings, so only the artwork is swapped here. */
    var lockup  = document.querySelector('.brand__logo');
    var lockSrc = srcFor(media.logo_lockup);
    if (lockup && lockSrc) lockup.setAttribute('src', lockSrc);
  }

  /* ---------- capability strip ---------- */

  function applyCapabilities(rows) {
    var group = document.querySelector('#capTrack .capstrip__group');
    if (!group || !rows || !rows.length) return;

    group.innerHTML = rows.map(function (c) {
      return '<div class="capstrip__item">' +
               '<i>' + esc(c.number_label || '') + '</i>' +
               '<span class="u-mono">' + esc(c.label) + '</span>' +
             '</div>';
    }).join('');

    /* The strip clones this group to fill the screen; it has to
       measure and copy again now the contents have changed. */
    if (window.HC_rebuildCapstrip) window.HC_rebuildCapstrip();
  }

  /* ---------- about us ---------- */

  /* The opening paragraph leads with the company's full name; it is
     set in bold, as it is in the printed profile. */
  function aboutBody(p, companyName) {
    var body = String(p.body || '');
    if (p.is_lead && companyName && body.indexOf(companyName) === 0) {
      return '<strong>' + esc(companyName) + '</strong>' +
             esc(body.slice(companyName.length));
    }
    return esc(body);
  }

  function applyAbout(paragraphs, settings) {
    if (!paragraphs || !paragraphs.length) return;

    var companyName = (settings && settings.company_name) || '';

    /* The whole profile, on /about-us. */
    var prose = document.querySelector('.about__prose');
    if (prose) {
      prose.innerHTML = paragraphs.map(function (p) {
        return '<p' + (p.is_lead ? ' class="lead"' : '') + '>' +
               aboutBody(p, companyName) + '</p>';
      }).join('');
    }

    /* The home page keeps only the opening paragraph, above the
       Learn More button — the rest is read on /about-us. */
    var intro = document.querySelector('.about__intro');
    if (intro) {
      var lead = paragraphs.filter(function (p) { return p.is_lead; })[0] || paragraphs[0];
      intro.innerHTML = aboutBody(lead, companyName);
    }
  }

  function applyRegistry(facts) {
    var plate = document.querySelector('.plate');
    if (!plate || !facts || !facts.length) return;

    var title = one(plate, '.plate__title');
    plate.innerHTML =
      (title ? title.outerHTML : '') +
      facts.map(function (f) {
        return '<div class="plate__row">' +
                 '<span class="plate__k">' + esc(f.label) + '</span>' +
                 '<span class="plate__v">' + esc(f.value) + '</span>' +
               '</div>';
      }).join('');
  }

  /* ---------- mission and vision ---------- */

  function applyValues(rows, media) {
    var wrap = document.querySelector('.mv');
    if (!wrap || !rows || !rows.length) return;

    var glyph = document.querySelector('.mv__glyph');
    var glyphSrc = glyph ? glyph.getAttribute('src') : '';
    if (media && media.logo_light) {
      glyphSrc = media.logo_light.photo_path
        ? API.publicUrl(CFG.SUPABASE_MEDIA_BUCKET || 'site-media', media.logo_light.photo_path)
        : (media.logo_light.photo_url || glyphSrc);
    }

    wrap.innerHTML = rows.map(function (v) {
      return '<article class="mv__cell">' +
               (glyphSrc ? '<img class="mv__glyph" src="' + esc(glyphSrc) + '" alt="" aria-hidden="true">' : '') +
               '<span class="mv__k u-mono">' + esc(v.kicker) + '</span>' +
               '<h3 class="mv__h">' + esc(v.heading) + '</h3>' +
               '<p class="mv__p">' + esc(v.body) + '</p>' +
             '</article>';
    }).join('');
  }

  /* ---------- core services ---------- */

  function applyServices(groups) {
    if (!groups || !groups.length) return;

    /* The four groups and every service inside them, on /services.
       The home page keeps only the heading and the opening line,
       above the View All Services button, so it has no grid to fill. */
    var wrap = document.querySelector('.svc');
    if (wrap) wrap.innerHTML = groups.map(function (g) {
      var items = (g.services || []).map(function (s) {
        return '<li>' + esc(s.name) +
               (s.description ? ' <span class="svc__note">' + esc(s.description) + '</span>' : '') +
               '</li>';
      }).join('');

      return '<article class="svc__col reveal">' +
               '<h3 class="svc__h">' + esc(g.name) + '</h3>' +
               (g.blurb ? '<p class="svc__blurb">' + esc(g.blurb) + '</p>' : '') +
               '<ul class="svc__list">' + items + '</ul>' +
             '</article>';
    }).join('');

    if (wrap) revealAll(wrap);

    /* "Seventeen services, four operating groups" — kept true
       automatically as services are added or removed, on the home
       page's introduction as well as on /services itself. */
    var total = groups.reduce(function (n, g) { return n + (g.services || []).length; }, 0);
    var heading = document.querySelector('#services .band__title');
    if (heading && total) {
      heading.textContent = countIn(
        countIn(heading.textContent, /^\s*\w+(?=\s+services\b)/i, total),
        /\b\w+(?=\s+operating groups\b)/i, groups.length);
    }
  }

  /* Swap a spelled-out number into a sentence, keeping the case the
     writer chose: "four groups" stays lower case, "Four" stays capital. */
  function countIn(text, pattern, n) {
    return text.replace(pattern, function (found) {
      var word = spellOut(n);
      return /^[a-z]/.test(found) ? word.toLowerCase() : word;
    });
  }

  var NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

  function spellOut(n) {
    return NUMBER_WORDS[n] || String(n);
  }

  /* ---------- company details ---------- */

  function applySettings(s) {
    if (!s) return;

    function link(id, value, href) {
      var el = document.getElementById(id);
      if (el && value) { el.textContent = value; el.setAttribute('href', href); }
    }
    function text(id, value) { setText(document.getElementById(id), value); }

    if (s.email) {
      link('cEmail', s.email, 'mailto:' + s.email);
      link('fEmail', s.email, 'mailto:' + s.email);
    }
    if (s.phone) {
      var tel = 'tel:' + String(s.phone).replace(/[^\d+]/g, '');
      link('cPhone', s.phone, tel);
      link('fPhone', s.phone, tel);
    }
    text('cAddress', s.address);
    text('fAddress', s.address);
    text('cHours', s.office_hours);
    text('cRc', s.rc_number);

    applyMap(s.address);

    setText(document.querySelector('.foot__blurb'), s.footer_blurb);
    /* The masthead shows the logo artwork, so the company name only
       survives here as the image's accessible name. */
    var brandLogo = document.querySelector('.brand__logo');
    if (brandLogo && s.short_name) {
      brandLogo.setAttribute('alt', s.tagline ? s.short_name + ' \u2014 ' + s.tagline : s.short_name);
    }

    var quoteBtn = document.querySelector('.masthead .btn--solid');
    setText(quoteBtn, s.header_cta_label);

    /* WhatsApp, wherever it appears. */
    var digits = String(s.whatsapp || s.phone || '').replace(/\D/g, '');
    if (digits) {
      var href = 'https://wa.me/' + digits +
        (s.whatsapp_message ? '?text=' + encodeURIComponent(s.whatsapp_message) : '');
      ['cWhatsapp', 'fWhatsapp'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.setAttribute('href', href);
      });
      var card = document.getElementById('waCard');
      var item = document.getElementById('fWhatsappItem');
      if (card) card.hidden = false;
      if (item) item.hidden = false;
    }

    /* Page metadata, for search results and shared links. A page that
       carries its own — the equipment listings do — keeps it. */
    if (document.documentElement.getAttribute('data-meta') !== 'own') {
      if (s.meta_title) document.title = s.meta_title;
      setMeta('name', 'description', s.meta_description);
      setMeta('property', 'og:title', s.meta_title);
      setMeta('property', 'og:description', s.meta_description);
    }

    var rcLine = document.querySelector('.foot__bar .u-mono:last-child');
    if (rcLine && s.rc_number) {
      rcLine.textContent = 'RC ' + s.rc_number + ' · Incorporated in Nigeria';
    }
  }

  /* The pin follows the registered office as it is edited in the
     manager. Both addresses are Google's keyless embed forms, so
     there is no map key to keep out of this file. */
  function applyMap(address) {
    var place = String(address || '').trim();
    if (!place) return;

    var frame = document.getElementById('cMap');
    if (frame) {
      frame.setAttribute('src',
        'https://www.google.com/maps?q=' + encodeURIComponent(place) + '&output=embed');
      frame.setAttribute('title', 'Map showing ' + place);
    }

    var directions = document.getElementById('cDirections');
    if (directions) {
      directions.setAttribute('href',
        'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place));
    }
  }

  function setMeta(attr, key, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (el) el.setAttribute('content', value);
  }

  /* ---------- contact form choices ---------- */

  function applyOptions(options) {
    var list = options && options.enquiry_type;
    var select = document.getElementById('subject');
    if (!select || !list || !list.length) return;

    var chosen = select.value;

    /* The empty first option is what makes "choose a subject" a real
       requirement, so it survives the rebuild. Keep the wording the
       page shipped with if it has one. */
    var placeholder = select.querySelector('option[value=""]');
    var prompt = placeholder ? placeholder.textContent : 'Choose an enquiry type\u2026';

    select.innerHTML =
      '<option value="">' + esc(prompt) + '</option>' +
      list.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');

    select.value = (chosen && list.indexOf(chosen) !== -1) ? chosen : '';
  }

  var contactSection = document.getElementById('contact');
  function applyContactExtras(sections) {
    if (!contactSection || !sections) return;
    var contact = sections.filter(function (s) { return s.key === 'contact'; })[0];
    var extra = (contact && contact.extra) || {};
    setText(one(contactSection, '.contact__wa-note'), extra.whatsapp_note);
    setText(document.getElementById('formSubmit'), extra.submit_label);
  }

  /* ---------- go ---------- */

  var HC_CONTENT = {
    data: null,
    ready: null,

    apply: function (data) {
      if (!data) return;
      this.data = data;
      window.HC_DATA = data;

      applySettings(data.settings);
      applySections(data.sections);
      applyContactExtras(data.sections);
      applyMedia(data.media);
      applyCapabilities(data.capabilities);
      applyAbout(data.about, data.settings);
      applyRegistry(data.registry);
      applyValues(data['values'], data.media);
      applyServices(data.service_groups);
      applyOptions(data.options);

      document.documentElement.setAttribute('data-hc-live', 'yes');
      try {
        window.dispatchEvent(new CustomEvent('hc:content', { detail: data }));
      } catch (e) {}
    }
  };

  if (!API || !API.configured) {
    HC_CONTENT.ready = Promise.resolve(null);
    try { window.dispatchEvent(new CustomEvent('hc:content-offline')); } catch (e) {}
  } else {
    HC_CONTENT.ready = API.bundle()
      .then(function (data) {
        HC_CONTENT.apply(data);
        return data;
      })
      .catch(function (err) {
        /* The page keeps the copy it was published with. */
        if (window.console) console.warn('[Hiramar] content not loaded:', err.message);
        try { window.dispatchEvent(new CustomEvent('hc:content-offline')); } catch (e) {}
        return null;
      });
  }

  window.HC_CONTENT = HC_CONTENT;
})();
