/* =============================================================
   EQUIPMENT STORE
   Two modes, chosen automatically:

   • LOCAL  — no database configured. Listings live in this
              browser's storage. Photos are downscaled and kept
              as data URLs. Good for building and reviewing the
              site; nothing is shared with visitors.

   • REMOTE — Supabase details present in config.js. The site
              reads live listings instead. (Wired up already;
              nothing to change here when you switch over.)
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.HC_CONFIG || {};
  var KEY = 'hc_equipment_local';
  var SEEDED = 'hc_equipment_seeded';

  var SEED = [
    { name: 'Anchor handling tug supply vessel', category: 'Vessels',
      condition: 'Used — surveyed', year: 2011, location: 'Onne, Rivers State',
      price: 'Price on application', reference: 'HC-AHT-001' },
    { name: 'Deck crane, 25 t knuckle boom', category: 'Deck Equipment',
      condition: 'Refurbished', year: 2016, location: 'Lagos',
      price: 'Price on application', reference: 'HC-CRN-014' },
    { name: 'Mooring winch, double drum', category: 'Deck Equipment',
      condition: 'Used — tested', year: 2014, location: 'Warri, Delta State',
      price: 'Price on application', reference: 'HC-WCH-006' },
    { name: 'Containerised diesel generator, 500 kVA', category: 'Power',
      condition: 'Used — low hours', year: 2019, location: 'Port Harcourt',
      price: 'Price on application', reference: 'HC-GEN-022' },
    { name: 'Subsea ROV, inspection class', category: 'Subsea',
      condition: 'Used — certified', year: 2018, location: 'Lagos',
      price: 'Price on application', reference: 'HC-ROV-003' },
    { name: 'Cargo hose reel with 6 in. hoses', category: 'Transfer',
      condition: 'New', year: 2024, location: 'Onne, Rivers State',
      price: 'Price on application', reference: 'HC-HOS-031' }
  ];

  function uid() {
    return 'hc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable or corrupt — fall through */ }
    return null;
  }

  function write(rows) {
    try {
      localStorage.setItem(KEY, JSON.stringify(rows));
      return { ok: true };
    } catch (e) {
      var full = e && (e.name === 'QuotaExceededError' ||
                       e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);
      return {
        ok: false,
        message: full
          ? 'This browser’s storage is full. Delete a listing, or use smaller photos.'
          : 'Could not save to this browser’s storage.'
      };
    }
  }

  var HC_STORE = {

    configured: Boolean(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY),

    /* All listings, newest first. Seeds the samples once, so an
       empty list stays empty after you delete them. */
    list: function () {
      var rows = read();
      if (rows) return rows;

      var seededBefore = false;
      try { seededBefore = localStorage.getItem(SEEDED) === '1'; } catch (e) {}
      if (seededBefore) return [];

      rows = SEED.map(function (s, i) {
        var row = {};
        for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) row[k] = s[k];
        row.id = uid();
        row.is_available = true;
        row.is_sample = true;
        row.created_at = new Date(Date.now() - i * 1000).toISOString();
        return row;
      });
      write(rows);
      try { localStorage.setItem(SEEDED, '1'); } catch (e) {}
      return rows;
    },

    /* Only the listings a visitor should see. */
    visible: function () {
      return this.list().filter(function (r) { return r.is_available !== false; });
    },

    add: function (item) {
      var rows = this.list();
      item.id = uid();
      item.created_at = new Date().toISOString();
      if (item.is_available === undefined) item.is_available = true;
      rows.unshift(item);
      var res = write(rows);
      if (res.ok) this.announce();
      return res;
    },

    update: function (id, patch) {
      var rows = this.list();
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) rows[i][k] = patch[k];
          break;
        }
      }
      var res = write(rows);
      if (res.ok) this.announce();
      return res;
    },

    remove: function (id) {
      var rows = this.list().filter(function (r) { return r.id !== id; });
      var res = write(rows);
      if (res.ok) this.announce();
      return res;
    },

    clearAll: function () {
      try { localStorage.removeItem(KEY); localStorage.removeItem(SEEDED); } catch (e) {}
      this.announce();
    },

    /* Let an open site tab know something changed. */
    announce: function () {
      try { window.dispatchEvent(new CustomEvent('hc:equipment-changed')); } catch (e) {}
    },


    /* Branded stand-in used wherever a listing has no photograph. */
    placeholder: function (label, compact) {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="' +
          String(label || 'Equipment').replace(/[<>&"]/g, '') + '">' +
          '<rect width="400" height="300" fill="#D8EADF"/>' +
          '<path d="M0 232c40-14 74 10 114 0s70-22 110-12 66 20 106 8 70-18 70-18v90H0z" fill="#005020" opacity=".14"/>' +
          '<g fill="none" stroke="#005020" stroke-width="7" opacity=".42" stroke-linecap="round">' +
            '<circle cx="200" cy="104" r="17"/>' +
            '<path d="M200 121v82M170 143h60M156 178a44 44 0 0 0 88 0"/>' +
          '</g>' +
          (compact ? '' :
            '<text x="200" y="268" font-family="IBM Plex Mono, monospace" font-size="13" ' +
            'letter-spacing="2.5" fill="#005020" opacity=".55" text-anchor="middle">PHOTO ON REQUEST</text>') +
        '</svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },

    /* Downscale a chosen photo so it fits in browser storage and
       loads quickly. Returns a data URL. */
    readPhoto: function (file, maxWidth, quality) {
      maxWidth = maxWidth || 1400;
      quality = quality || 0.78;
      return new Promise(function (resolve, reject) {
        if (!file || !/^image\//.test(file.type)) {
          reject(new Error('That file is not an image. Choose a JPG or PNG.'));
          return;
        }
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxWidth / img.naturalWidth);
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            reject(new Error('Could not process that image.'));
          }
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error('Could not read that image file.'));
        };
        img.src = url;
      });
    }
  };

  window.HC_STORE = HC_STORE;
})();
