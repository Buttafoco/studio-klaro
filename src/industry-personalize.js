/* ==========================================================================
   Studio Klaro – branschkarusellen visar det mest relevanta kortet först.
   Logik och tester: src/industry-match.mjs, tests/industry-match.test.mjs.
   Signaler (endast förstapartsbeteende på sidan, ingen profilering):
     1. texten besökaren själv skriver i hero-formuläret (lokalt, efter 400 ms debounce)
     2. branschlandningssida: ?bransch=… eller föregående sida på samma webbplats
     3. ett branschkort besökaren själv har klickat på
   Endast en kategorikod sparas i sessionStorage (t.ex. "salon:text") – aldrig texten.
   Ingen tracking. Karusellen (inline i index.html) exponerar indTrack.klaroIndustry.
   ========================================================================== */
import { createIndustryPersonalizer, codeFromPath, codeFromParam, CARD_CODES } from './industry-match.mjs';

(function () {
  var track = document.getElementById('ind-track');
  var api = track && track.klaroIndustry;
  if (!api) return;

  var KEY = 'klaro-bransch';
  var SOURCES = ['text', 'url', 'click'];
  var storage = {
    get: function () {
      try {
        var v = (sessionStorage.getItem(KEY) || '').split(':');
        return CARD_CODES.indexOf(v[0]) !== -1 && SOURCES.indexOf(v[1]) !== -1 ? { code: v[0], source: v[1] } : null;
      } catch (e) { return null; }
    },
    set: function (code, source) { try { sessionStorage.setItem(KEY, code + ':' + source); } catch (e) {} }
  };

  // Underrubriken: alla varianter finns i HTML:en; vi visar den som matchar texten
  var leads = Array.prototype.slice.call(document.querySelectorAll('#ind-lead .ind-lead-v'));
  function setLead(text) {
    var target = leads.filter(function (el) { return el.textContent.trim() === text; })[0];
    if (!target) return;
    leads.forEach(function (el) {
      var on = el === target;
      el.classList.toggle('is-on', on);
      if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
    });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var p = createIndustryPersonalizer({
    carousel: api,
    setLead: setLead,
    storage: storage,
    reducedMotion: function () { return reduce.matches; }
  });

  // 2. URL: aktuell sida, ?bransch=… eller föregående sida på samma webbplats
  function urlSignal() {
    var code = codeFromPath(location.pathname);
    if (code) return code;
    try {
      code = codeFromParam(new URLSearchParams(location.search).get('bransch') || '');
      if (code) return code;
      if (document.referrer) {
        var ref = new URL(document.referrer);
        if (ref.origin === location.origin) return codeFromPath(ref.pathname);
      }
    } catch (e) {}
    return null;
  }
  p.init({ url: urlSignal() });

  // 1. Hero-texten: kategoriseras lokalt när besökaren gjort en paus i skrivandet
  var hero = document.getElementById('wz-f-message-hero');
  if (hero) {
    var timer = null;
    var run = function () { timer = null; p.text(hero.value); };
    hero.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 400); });
    // Webbläsaren kan återställa fältets text vid bakåtnavigering
    if (hero.value.trim()) run();
  }

  // 3. Klick på ett kort som öppnas (inte bara centreras): kom ihåg kategorin i den här fliken
  track.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var item = e.target.closest('.ind-item:not(.ind-clone)');
    if (!item) return;
    var real = Array.prototype.slice.call(track.querySelectorAll('.ind-item:not(.ind-clone)'));
    p.click(CARD_CODES[real.indexOf(item)]);
  });
})();
