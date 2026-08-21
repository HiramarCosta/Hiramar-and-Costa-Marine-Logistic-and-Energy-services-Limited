/* =============================================================
   HIRAMAR AND COSTA — light and dark

   Loaded in the <head>, before the stylesheet has a body to paint,
   so the theme is decided and set on <html> ahead of the first
   frame. Deciding it any later — on DOMContentLoaded, or from a
   deferred script — would show the visitor a flash of the light
   page before the dark one arrived.

   The rule for which theme to open in:

     1. whatever the visitor last chose here, if they have chosen;
     2. otherwise, whatever their device is set to.

   The device preference is the opening position and nothing more.
   Once someone has pressed the switch, their choice is the answer
   on every later visit, whatever the device goes on to say.

   The choice is kept in localStorage under 'hc-theme'. It belongs
   to the browser it was made in, which is the whole of what a
   theme preference is — it does not go to Supabase, and there is
   no signed-in visitor to hang it on: the only account on this
   site is the one that opens the manager.
   ============================================================= */
(function () {
  'use strict';

  var KEY  = 'hc-theme';
  var root = document.documentElement;

  /* The colour the phone paints its status bar and the browser its
     window furniture. Follows the theme so the chrome around the
     page matches the page. */
  var BAR = { light: '#005020', dark: '#03150C' };

  var media = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  /* Storage throws rather than returning null in a locked-down
     browser — private windows, third-party contexts, cookies off.
     Everything still works there; the choice just does not outlive
     the page. */
  function saved() {
    try {
      var v = window.localStorage.getItem(KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) { return null; }
  }

  function remember(theme) {
    try { window.localStorage.setItem(KEY, theme); } catch (e) {}
  }

  function device() {
    return media && media.matches ? 'dark' : 'light';
  }

  function paint(theme) {
    root.setAttribute('data-theme', theme);
    var bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.setAttribute('content', BAR[theme]);
  }

  /* ---- before anything is drawn ---- */
  paint(saved() || device());


  /* ---- the control ----
     Everything below needs the header, so it waits for the document.
     The button carries no text: the mark inside it says which theme
     is on, and the label says what pressing it will do. The label is
     rewritten on every switch, so a screen reader reading the button
     again after the press is told the new action, not the old one. */

  function label(theme) {
    return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  var buttons = [];

  function dress(theme) {
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-label', label(theme));
      buttons[i].setAttribute('title', label(theme));
    }
  }

  var settling;

  function switchTo(theme, persist) {
    /* The crossfade is lent to the page for the length of the switch
       and taken back afterwards — see THE SWITCH ITSELF in the
       stylesheet. Held a little past the 400ms transition so the last
       frame is not cut off. */
    root.classList.add('theme-switching');
    paint(theme);
    if (persist) remember(theme);
    dress(theme);
    window.clearTimeout(settling);
    settling = window.setTimeout(function () {
      root.classList.remove('theme-switching');
    }, 520);
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function wire() {
    buttons = Array.prototype.slice.call(
      document.querySelectorAll('[data-theme-toggle]')
    );

    dress(current());

    for (var i = 0; i < buttons.length; i++) {
      /* A real <button type="button">, so Enter and Space arrive as
         clicks and the focus ring is the browser's own. There is
         nothing here to add for the keyboard. */
      buttons[i].addEventListener('click', function () {
        switchTo(current() === 'dark' ? 'light' : 'dark', true);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  /* If the device changes its mind — sunset on a phone set to switch
     automatically — follow it, but only for a visitor who has never
     pressed the switch. A stored choice outranks the device. */
  if (media) {
    /* Not persisted: following the device is not a choice the visitor
       made, and writing it down would turn their first sunset into a
       preference they never set. */
    var follow = function () { if (!saved()) switchTo(device(), false); };
    if (media.addEventListener) media.addEventListener('change', follow);
    else if (media.addListener) media.addListener(follow);
  }
})();
