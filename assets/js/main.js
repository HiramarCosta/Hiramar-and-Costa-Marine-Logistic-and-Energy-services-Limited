/* =============================================================
   HIRAMAR AND COSTA — site behaviour
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.HC_CONFIG || {};
  var CO  = CFG.COMPANY || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- company details into the page ---------- */
  function text(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }
  function link(id, value, href) {
    var el = document.getElementById(id);
    if (el && value) { el.textContent = value; el.setAttribute('href', href); }
  }

  link('cEmail', CO.email, 'mailto:' + CO.email);
  link('fEmail', CO.email, 'mailto:' + CO.email);
  link('cPhone', CO.phone, 'tel:' + String(CO.phone || '').replace(/[^\d+]/g, ''));
  link('fPhone', CO.phone, 'tel:' + String(CO.phone || '').replace(/[^\d+]/g, ''));
  text('cAddress', CO.address);
  text('fAddress', CO.address);
  text('cRc', CO.rcNumber);
  text('year', new Date().getFullYear());

  /* ---------- WhatsApp: second contact option ----------
     wa.me wants the full international number as bare digits, so the
     "+", spaces and dashes come out. Falls back to the phone number
     when no separate WhatsApp line is configured. */
  var waNumber = String(CO.whatsapp || CO.phone || '').replace(/\D/g, '');
  var waCard   = document.getElementById('waCard');
  var waFootLi = document.getElementById('fWhatsappItem');
  var waLink   = document.getElementById('cWhatsapp');
  var waFoot   = document.getElementById('fWhatsapp');

  if (waNumber) {
    var waHref = 'https://wa.me/' + waNumber;
    if (CO.whatsappMessage) waHref += '?text=' + encodeURIComponent(CO.whatsappMessage);

    if (waLink) waLink.setAttribute('href', waHref);
    if (waCard) waCard.hidden = false;
    if (waFoot) { waFoot.setAttribute('href', waHref); waFoot.textContent = 'WhatsApp us'; }
    if (waFootLi) waFootLi.hidden = false;
  }

  /* ---------- mobile drawer ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- draft-mark rail + active nav ---------- */
  var sections = ['home', 'about', 'mission', 'services', 'equipment', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var ticks    = Array.prototype.slice.call(document.querySelectorAll('.draft-tick'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var fill     = document.querySelector('.draft-rail__fill');
  var rail     = document.querySelector('.draft-rail');
  var DARK_SECTIONS = ['home', 'mission'];
  var ticking  = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (fill) fill.style.setProperty('--scroll-pct', pct.toFixed(2) + '%');

    // the section occupying the upper third of the viewport is "current"
    var mark = window.scrollY + window.innerHeight * 0.33;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= mark) current = sections[i];
    }
    var id = current ? current.id : 'home';

    ticks.forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tick') === id);
    });

    // invert the rail while a dark band is in view
    if (rail) rail.classList.toggle('on-dark', DARK_SECTIONS.indexOf(id) !== -1);
    navLinks.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      /* Links to another page — Equipment, for one — mark themselves
         and are none of the scroll spy's business. */
      if (href.charAt(0) !== '#') return;
      a.classList.toggle('is-active', href === '#' + id);
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }
  // expose so equipment cards added later can be revealed too
  window.HC_reveal = function (el) {
    if (reduced || !('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    o.observe(el);
  };

  /* ---------- capability strip: an endless left-to-right roll ----------
     One group of capabilities is written in index.html. Copy it until the
     track is wider than the screen, then slide the track right by exactly
     one group width, forever — every copy is identical, so the moment it
     starts over looks like no moment at all. */
  (function capabilityStrip() {
    var track = document.getElementById('capTrack');
    var seed  = track && track.querySelector('.capstrip__group');
    if (!seed) return;

    var PIXELS_PER_SECOND = 46;   // raise this to make the row travel faster
    var resizeTimer;

    function build() {
      // back to the single authored group, so resizing never compounds
      while (track.children.length > 1) track.removeChild(track.lastChild);
      track.classList.remove('is-rolling');

      var groupWidth = seed.getBoundingClientRect().width;
      if (!groupWidth) return;

      // enough copies for the screen plus the width the track travels
      var copies = Math.ceil(window.innerWidth / groupWidth) + 1;
      for (var i = 1; i < copies; i++) {
        var clone = seed.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');   // screen readers hear it once
        track.appendChild(clone);
      }

      track.style.setProperty('--cap-shift', groupWidth + 'px');
      track.style.setProperty('--cap-dur', (groupWidth / PIXELS_PER_SECOND) + 's');
      if (!reduced) track.classList.add('is-rolling');
    }

    build();

    // the web fonts land after this runs and change the measurement
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    // content.js calls this once the live capabilities are in place
    window.HC_rebuildCapstrip = build;

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 180);
    });
  })();

  /* ---------- contact form ---------- */
  var API    = window.HC_API;
  var form   = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var submit = document.getElementById('formSubmit');

  function say(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form__status u-mono is-shown ' + (ok ? 'is-ok' : 'is-err');
  }

  /* ---------- field-by-field validation ----------
     The database enforces these same limits in its insert policy, so
     a message that fails here would have been rejected there anyway.
     Checking in the browser first means the visitor is told which
     field is wrong instead of being handed a database error. */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldOf(name) { return document.getElementById(name); }

  function markField(name, message) {
    var input = fieldOf(name);
    var note  = document.getElementById('err-' + name);
    var wrap  = input && input.closest ? input.closest('.field') : null;

    if (note) note.textContent = message || '';
    if (wrap) wrap.classList.toggle('is-bad', !!message);
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function clearErrors() {
    ['firstName', 'surname', 'email', 'phone', 'subject', 'enquiry']
      .forEach(function (name) { markField(name, ''); });
  }

  /* Each rule returns the complaint to show, or nothing when the
     value passes. They run in the order the fields are read. */
  var RULES = [
    ['firstName', function (v) {
      if (!v) return 'Enter your first name.';
      if (v.length > 120) return 'That first name is too long (120 characters at most).';
    }],
    ['surname', function (v) {
      if (!v) return 'Enter your surname.';
      if (v.length > 120) return 'That surname is too long (120 characters at most).';
    }],
    ['email', function (v) {
      if (!v) return 'Enter your email address.';
      if (v.length < 5 || v.length > 254 || !EMAIL_RE.test(v)) {
        return 'Enter a complete email address, such as you@company.com.';
      }
    }],
    ['phone', function (v) {
      if (!v) return 'Enter your telephone number.';
      if (v.replace(/\D/g, '').length < 7) return 'Enter a full telephone number, including the area or country code.';
      if (v.length > 40) return 'That telephone number is too long.';
      if (/[^\d\s+()\-.]/.test(v)) return 'Use only digits, spaces and + ( ) - in the telephone number.';
    }],
    ['subject', function (v) {
      if (!v) return 'Choose what your enquiry is about.';
      if (v.length > 120) return 'That subject is too long.';
    }],
    ['enquiry', function (v) {
      if (!v) return 'Tell us what you need.';
      if (v.length < 2) return 'Add a little more detail so we can help.';
      if (v.length > 5000) return 'That message is too long (5,000 characters at most).';
    }]
  ];

  /* True when everything passes. Otherwise every bad field is
     marked, the first one is focused, and the status line says how
     many need attention. */
  function validate(data) {
    var values = {
      firstName: data.firstName, surname: data.surname, email: data.email,
      phone: data.phone, subject: data.subject, enquiry: data.enquiry
    };

    var bad = [];
    RULES.forEach(function (rule) {
      var name = rule[0];
      var complaint = rule[1](values[name] || '');
      markField(name, complaint || '');
      if (complaint) bad.push(name);
    });

    if (!bad.length) return true;

    var first = fieldOf(bad[0]);
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    say(bad.length === 1
      ? 'One field needs your attention before this can be sent.'
      : bad.length + ' fields need your attention before this can be sent.', false);
    return false;
  }

  /* Clear a field's complaint as soon as the visitor edits it. */
  if (form) {
    ['input', 'change'].forEach(function (evt) {
      form.addEventListener(evt, function (e) {
        var el = e.target;
        if (!el || !el.id) return;
        var wrap = el.closest && el.closest('.field');
        if (wrap && wrap.classList.contains('is-bad')) markField(el.id, '');
      });
    });
  }

  /* ---------- which door the visitor came through ----------
     A quote request, a "talk to our team" click and an enquiry
     about a particular listing all land in the same form. Noting
     which one it was lets the office sort the inbox later. */
  var intent = { kind: 'general', equipmentId: null, equipmentName: null };

  function resetIntent() {
    intent = { kind: 'general', equipmentId: null, equipmentName: null };
  }

  /* Called by equipment.js when Enquire is pressed on a listing. */
  window.HC_setEnquiryIntent = function (kind, equipment) {
    intent.kind = kind || 'general';
    intent.equipmentId = (equipment && equipment.id) || null;
    intent.equipmentName = (equipment && equipment.name) || null;
  };

  /* ---------- carrying an enquiry between pages ----------
     The form is on /contact; the listings are on /equipment. An
     enquiry started over there is parked in the browser for a
     moment and picked up when the contact page loads. */
  var HANDOFF = 'hc_enquiry_handoff';

  window.HC_stashEnquiry = function (payload) {
    try { sessionStorage.setItem(HANDOFF, JSON.stringify(payload || {})); } catch (e) {}
  };

  function takeHandoff() {
    var raw = null;
    try {
      raw = sessionStorage.getItem(HANDOFF);
      sessionStorage.removeItem(HANDOFF);
    } catch (e) {}
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* Point the form at a listing: enquiry type, message, and the note
     of where the visitor came from. */
  window.HC_prefillEnquiry = function (payload) {
    payload = payload || {};
    window.HC_setEnquiryIntent(payload.kind || 'equipment', {
      id: payload.equipmentId, name: payload.equipmentName
    });

    var select = document.getElementById('subject');
    if (select && payload.subject) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === payload.subject) { select.selectedIndex = i; break; }
      }
    }

    var textarea = document.getElementById('enquiry');
    if (textarea && payload.message) textarea.value = payload.message;
  };

  window.HC_focusEnquiryForm = function () {
    var target = document.getElementById('contactForm') || document.getElementById('contact');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      var first = document.getElementById('firstName');
      if (first) first.focus({ preventScroll: true });
    }, 600);
  };

  /* Buttons that carry the visitor to the form declare their own
     intent. Anything pointing elsewhere is just navigation. */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-intent]');
    if (!trigger) return;
    /* "/contact" from every page, and "#contact" from anything saved
       before the contact page existed. */
    if (!/(#contact|(^|\/)contact(\.html)?)$/.test(trigger.getAttribute('href') || '')) return;

    var kind = trigger.getAttribute('data-intent');
    if (document.getElementById('contactForm')) window.HC_setEnquiryIntent(kind);
    else window.HC_stashEnquiry({ kind: kind });
  });

  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function enquiryRow(data) {
    return {
      kind:           intent.kind,
      first_name:     data.firstName,
      surname:        data.surname,
      email:          data.email,
      phone:          data.phone,
      enquiry_type:   data.subject,
      message:        data.enquiry,
      /* sample listings have local ids, which are not database rows */
      equipment_id:   UUID.test(intent.equipmentId || '') ? intent.equipmentId : null,
      equipment_name: intent.equipmentName,
      source_url:     String(window.location.href).slice(0, 500),
      referrer:       String(document.referrer || '').slice(0, 500),
      user_agent:     String(navigator.userAgent || '').slice(0, 500)
    };
  }

  /* Optional second copy, emailed the moment it arrives. */
  function notifyByEmail(data) {
    var endpoint = CFG.FORMSPREE_ENDPOINT;
    /* Rejecting when unset matters: it keeps the fallback chain
       below honest, so a failed save never reports success. */
    if (!endpoint) return Promise.reject(new Error('No email endpoint configured'));
    return fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        data.firstName + ' ' + data.surname,
        email:       data.email,
        phone:       data.phone,
        _subject:    'Website enquiry — ' + data.subject,
        enquiryType: data.subject,
        enquiryKind: intent.kind,
        equipment:   intent.equipmentName || '',
        message:     data.enquiry
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('Notification failed (' + res.status + ')');
    });
  }

  /* Last resort: hand the enquiry to the visitor's email app so
     that nothing is ever silently lost. */
  function handToEmailApp(data) {
    var body =
      'Name: ' + data.firstName + ' ' + data.surname + '\n' +
      'Email: ' + data.email + '\n' +
      'Phone: ' + data.phone + '\n' +
      'Enquiry type: ' + data.subject + '\n' +
      (intent.equipmentName ? 'Equipment: ' + intent.equipmentName + '\n' : '') +
      '\n' + data.enquiry;

    var to = (window.HC_DATA && window.HC_DATA.settings && window.HC_DATA.settings.email) ||
             CO.email || '';

    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('Website enquiry — ' + data.subject) +
      '&body=' + encodeURIComponent(body);
  }

  /* An enquiry begun on /equipment arrives with the page. */
  if (form) {
    var handed = takeHandoff();
    if (handed) {
      window.HC_prefillEnquiry(handed);
      if (handed.equipmentName) window.HC_focusEnquiryForm();
    }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        firstName: form.firstName.value.trim(),
        surname:   form.surname.value.trim(),
        email:     form.email.value.trim(),
        phone:     form.phone.value.trim(),
        subject:   form.subject.value,
        enquiry:   form.enquiry.value.trim()
      };

      if (!validate(data)) return;
      clearErrors();

      /* Nowhere to send it — open the email app instead. */
      if (!API || !API.configured) {
        if (!CFG.FORMSPREE_ENDPOINT) {
          handToEmailApp(data);
          say('Opening your email app to send this enquiry.', true);
          return;
        }
      }

      submit.disabled = true;
      var original = submit.textContent;
      submit.textContent = 'Sending…';
      say('Sending your enquiry…', true);

      var saved = (API && API.configured)
        ? API.insert('enquiries', enquiryRow(data), { returning: false })
        : Promise.reject(new Error('No database configured'));

      saved
        .then(function () {
          /* Saved. An email copy is a bonus, never a blocker. */
          notifyByEmail(data).catch(function () {});
          form.reset();
          resetIntent();
          say('Thank you — your enquiry has been received. Our team will respond shortly.', true);
        })
        .catch(function (err) {
          return notifyByEmail(data)
            .then(function () {
              form.reset();
              resetIntent();
              say('Thank you — your enquiry has been sent. Our team will respond shortly.', true);
            })
            .catch(function () {
              handToEmailApp(data);
              say('We could not send that automatically (' + err.message +
                  '), so your email app is opening with the enquiry ready.', false);
            });
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = original;
        });
    });
  }
})();
