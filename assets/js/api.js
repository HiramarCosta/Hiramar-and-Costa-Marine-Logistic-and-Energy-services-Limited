/* =============================================================
   SUPABASE CLIENT

   A small wrapper over the Supabase REST and Auth endpoints —
   no build step, no npm package, nothing to install.

   Reading uses the publishable key from config.js and is limited
   by the database's own rules: published content only, and the
   enquiry inbox stays invisible. Writing requires a sign-in from
   admin.html, which swaps in that staff member's access token.
   ============================================================= */
(function () {
  'use strict';

  var CFG  = window.HC_CONFIG || {};
  var BASE = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var KEY  = CFG.SUPABASE_PUBLISHABLE_KEY || CFG.SUPABASE_ANON_KEY || '';
  var TOKEN_KEY = 'hc_session';

  /* ---------- the signed-in session, if there is one ---------- */
  var session = null;
  try {
    var saved = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (saved) session = JSON.parse(saved);
  } catch (e) { /* storage blocked — carry on signed out */ }

  function saveSession(next, remember) {
    session = next;
    try {
      var store = remember ? localStorage : sessionStorage;
      if (next) store.setItem(TOKEN_KEY, JSON.stringify(next));
      else { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); }
    } catch (e) {}
  }

  function authToken() {
    return (session && session.access_token) || KEY;
  }

  /* Encode each folder step separately, so "/" keeps its meaning
     while spaces and accents in a file name do not break the URL. */
  function encodePath(path) {
    return String(path).split('/').map(encodeURIComponent).join('/');
  }

  function headers(extra) {
    var h = { apikey: KEY, Authorization: 'Bearer ' + authToken() };
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    }
    return h;
  }

  /* Supabase reports problems as JSON; surface the useful line. */
  function fail(res) {
    return res.text().then(function (body) {
      var msg = body;
      try {
        var j = JSON.parse(body);
        msg = j.message || j.error_description || j.msg || j.error || body;
      } catch (e) {}
      var err = new Error(msg || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      throw err;
    });
  }

  function request(path, options) {
    options = options || {};
    return fetch(BASE + path, {
      method:  options.method || 'GET',
      headers: headers(options.headers),
      body:    options.body
    }).then(function (res) {
      if (!res.ok) return fail(res);
      if (res.status === 204) return null;
      return res.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }

  var HC_API = {

    configured: Boolean(BASE && KEY),
    url: BASE,

    /* ---------- session ---------- */
    session:    function () { return session; },
    signedIn:   function () { return Boolean(session && session.access_token); },

    signIn: function (email, password, remember) {
      return fetch(BASE + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function (res) { return res.ok ? res.json() : fail(res); })
      .then(function (body) {
        if (!body.access_token) throw new Error('Sign in failed.');
        saveSession(body, remember);
        return body;
      });
    },

    signOut: function () {
      var had = session;
      saveSession(null);
      if (!had) return Promise.resolve();
      return fetch(BASE + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + had.access_token }
      }).catch(function () { /* the local session is gone either way */ });
    },

    /* ---------- forgotten passwords ----------
       Supabase emails a one-time link. Opening it returns here with
       the tokens in the URL fragment, which adoptLinkSession() below
       turns into a signed-in session just long enough to choose a
       new password. */
    requestPasswordReset: function (email) {
      return fetch(BASE + '/auth/v1/recover', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (res) {
        if (!res.ok) return fail(res);
        return true;
      });
    },

    /* Sets a new password for whoever is signed in right now. */
    setPassword: function (password) {
      return request('/auth/v1/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
    },

    /* Picks up the tokens Supabase leaves in the address bar after a
       recovery link is opened, then tidies the address bar so they are
       not left sitting in browser history. Returns the link type. */
    adoptLinkSession: function () {
      var hash = String(window.location.hash || '').replace(/^#/, '');
      if (!hash) return null;

      var parts = {};
      hash.split('&').forEach(function (pair) {
        var i = pair.indexOf('=');
        if (i > 0) parts[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
      });
      if (!parts.access_token) return null;

      saveSession({
        access_token: parts.access_token,
        refresh_token: parts.refresh_token || '',
        token_type: parts.token_type || 'bearer'
      }, false);

      try {
        window.history.replaceState(null, '',
          window.location.pathname + window.location.search);
      } catch (e) { window.location.hash = ''; }

      return parts.type || 'recovery';
    },

    /* Confirms a stored token is still good. */
    whoAmI: function () {
      if (!this.signedIn()) return Promise.reject(new Error('Not signed in'));
      return request('/auth/v1/user', {});
    },

    /* ---------- reading ---------- */

    /* The whole website in one request. */
    bundle: function () {
      return request('/rest/v1/rpc/site_bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    },

    /* Rows from one table. opts: { select, order, filter, limit } */
    select: function (table, opts) {
      opts = opts || {};
      var q = ['select=' + encodeURIComponent(opts.select || '*')];
      if (opts.order)  q.push('order=' + encodeURIComponent(opts.order));
      if (opts.limit)  q.push('limit=' + opts.limit);
      if (opts.filter) q.push(opts.filter);
      return request('/rest/v1/' + table + '?' + q.join('&'), {});
    },

    insert: function (table, rows, opts) {
      opts = opts || {};
      return request('/rest/v1/' + table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          /* Visitors cannot read the enquiries table back, so an
             insert must not ask for the row it just wrote. */
          Prefer: opts.returning === false ? 'return=minimal' : 'return=representation'
        },
        body: JSON.stringify(rows)
      });
    },

    update: function (table, filter, patch) {
      return request('/rest/v1/' + table + '?' + filter, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(patch)
      });
    },

    /* Insert, or overwrite the row that clashes on `onConflict`. */
    upsert: function (table, rows, onConflict) {
      var path = '/rest/v1/' + table +
                 (onConflict ? '?on_conflict=' + encodeURIComponent(onConflict) : '');
      return request(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(rows)
      });
    },

    remove: function (table, filter) {
      return request('/rest/v1/' + table + '?' + filter, { method: 'DELETE' });
    },

    /* ---------- files ---------- */

    /* Upload to a bucket and hand back the path stored on the row. */
    upload: function (bucket, path, file) {
      return fetch(BASE + '/storage/v1/object/' + bucket + '/' + encodePath(path), {
        method: 'POST',
        headers: headers({ 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }),
        body: file
      }).then(function (res) {
        if (!res.ok) return fail(res);
        return path;
      });
    },

    removeFile: function (bucket, path) {
      return fetch(BASE + '/storage/v1/object/' + bucket + '/' + encodePath(path), {
        method: 'DELETE', headers: headers()
      }).catch(function () {});
    },

    publicUrl: function (bucket, path) {
      if (!path) return '';
      if (/^(https?:)?\/\//.test(path) || path.indexOf('data:') === 0) return path;
      return BASE + '/storage/v1/object/public/' + bucket + '/' + encodePath(path);
    },

    /* The address of a listing's photograph, wherever it is kept. */
    photoUrl: function (row) {
      if (!row) return '';
      if (row.photo_data) return row.photo_data;                       /* local preview mode */
      if (row.photo_path) return this.publicUrl(CFG.SUPABASE_BUCKET || 'equipment-photos', row.photo_path);
      return row.photo_url || '';
    }
  };

  window.HC_API = HC_API;
})();
