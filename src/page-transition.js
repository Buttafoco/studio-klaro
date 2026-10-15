/* ==========================================================================
   Studio Klaro – sidövergång för intern navigation ("route transition" för hela sajten).

   Sajten är en MPA (en HTML-fil per sida, ingen klient-router). Flödet:
   1. Klick på en intern länk: aktuell scrollposition sparas och navigeringen sker direkt
      (URL:en byts omedelbart, den gamla sidan scrollas inte).
   2. Nya sidan: <head> döljer innehållet (pt-hold) tills sidan har placerats på motsvarande
      scrollposition – min(tidigare scrollY, scrollHeight − innerHeight) – innan första bildrutan.
      Webbläsaren håller kvar den gamla sidan på skärmen under tiden (paint holding).
   3. Efter två bildrutor glider den NYA sidan mjukt upp till toppen med en egen rAF-loop
      (en loop, skriver scrollpositionen direkt, avbryts om besökaren själv scrollar).
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Easing: lugn ease-in-out (cubic) ---------- */
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- Ankomst: placera nya sidan och låt den glida upp ---------- */
  function focusMain() {
    if (location.hash) return;
    var target = document.querySelector('main') || document.querySelector('h1');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.setAttribute('data-pt-focus', '');
    target.focus({ preventScroll: true });
  }
  function settle() {
    // Läggs till i samma synkrona steg som pt-fast tas bort (ingen bildruta emellan) och ligger kvar
    // under hela besöket, så att inline-fadeUp inte startar om och får innehållet att blinka.
    root.classList.add('pt-internal-settled');
    root.classList.remove('pt-hold', 'pt-running', 'pt-fast');
    focusMain();
  }

  /* ---------- Ankomst från mobilmenyn: panelen som täcker sidan glider upp ---------- */
  if (root.classList.contains('pt-cover')) {
    var coverGone = false;
    var reveal = function () {
      if (coverGone) return;
      coverGone = true;
      root.classList.add('pt-cover-out');
      setTimeout(function () { root.classList.remove('pt-cover', 'pt-cover-out'); }, reduce ? 260 : 700);
    };
    // Två bildrutor efter montering (sidan är målad bakom panelen), med tidsgräns om bildrutorna dröjer
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(reveal, 60); }); });
    setTimeout(reveal, 450);
  }

  if (root.classList.contains('pt-arrive')) {
    var saved = typeof window.__ptY === 'number' ? window.__ptY : 0;
    if (location.hash || reduce || saved < 2) {
      settle();
    } else {
      // Före första bildrutan: samma position som på förra sidan (begränsad av nya sidans höjd)
      var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var startY = Math.min(saved, maxY);
      root.classList.add('pt-running');                 // ingen native smooth scroll under tiden
      window.scrollTo({ top: startY, behavior: 'instant' });
      root.classList.remove('pt-hold');

      var raf = 0, stopped = false;
      var stop = function () {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('keydown', onKey);
        settle();
      };
      // Besökaren tar över: avbryt där sidan befinner sig
      var onKey = function (e) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].indexOf(e.key) > -1) stop();
      };
      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('keydown', onKey);

      // Två bildrutor efter montering (layouten färdig), sedan en enda loop mot toppen
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (stopped) return;
          var from = window.scrollY;
          if (from < 2) { stop(); return; }
          var dur = Math.min(1000, Math.max(from < 300 ? 420 : 600, 520 + from * 0.1));
          var t0 = performance.now();
          var frame = function (now) {
            if (stopped) return;
            var p = Math.min(1, (now - t0) / dur);
            window.scrollTo({ top: Math.round(from * (1 - ease(p))), behavior: 'instant' });
            if (p < 1) raf = requestAnimationFrame(frame);
            else stop();
          };
          raf = requestAnimationFrame(frame);
        });
      });
    }
  }

  /* ---------- Vilka länkar omfattas ---------- */
  var SKIP_EXT = /\.(pdf|zip|png|jpe?g|webp|gif|svg|mp4|webm|docx?|xlsx?|pptx?)$/i;
  function eligible(a, e) {
    if (!a || !a.href || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return null;
    if (a.target && a.target !== '_self') return null;
    if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return null; }
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
    if (SKIP_EXT.test(url.pathname)) return null;
    // Samma sida (även ankarlänkar på samma sida) lämnas åt webbläsaren
    var here = location.pathname.replace(/\/$/, '') || '/';
    var there = url.pathname.replace(/\/$/, '') || '/';
    if (there === here && url.search === location.search) return null;
    return url;
  }

  /* ---------- Förladdning vid hover/fokus ---------- */
  var prefetched = {};
  function onIntent(e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    var url = a && eligible(a, null);
    if (!url) return;
    var key = url.pathname + url.search;
    if (prefetched[key]) return;
    prefetched[key] = true;
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = key;
    document.head.appendChild(l);
  }
  document.addEventListener('pointerover', onIntent, { passive: true });
  document.addEventListener('focusin', onIntent);

  /* ---------- Klick: spara position och navigera direkt ---------- */
  var busy = false;
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target && e.target.closest && e.target.closest('a');
    var url = a && eligible(a, e);
    if (!url) return;
    e.preventDefault();
    if (busy) return;                 // dubbelklick: navigeringen pågår redan
    busy = true;
    try {
      if (!url.hash && !reduce) sessionStorage.setItem('pt-y', String(Math.round(window.scrollY)));
      sessionStorage.setItem('pt-arrive', '1');
    } catch (err) {}
    location.assign(url.href);        // samma som ett vanligt länkklick: en history-post, korrekt URL
  });

  // Tillbaka från bfcache (bakåt/framåt): webbläsarens vanliga scrollåterställning gäller
  window.addEventListener('pageshow', function (e) { if (e.persisted) busy = false; });
})();
