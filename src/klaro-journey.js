/* ==========================================================================
   Studio Klaro – kundresan på startsidan (#processen). Stil: src/klaro-journey.css.
   - Aktivt kapitel väljs med IntersectionObserver (ett smalt band mitt i viewporten),
     inga tillståndsuppdateringar per scroll-event.
   - ≥1024px: portalvyerna flyttas från kapitlen in i det sticky portalfönstret och
     byts när aktivt kapitel ändras. Under 1024px ligger de kvar i sina kapitel och
     spelar sin intoning en gång när kapitlet syns.
   - Progresslinjen mellan 01–04: en transform per bildruta via rAF, och bara medan
     sektionen syns.
   - Reducerad rörelse hanteras i CSS (slutlägen direkt, inga förskjutningar).
   ========================================================================== */
(function () {
  var root = document.getElementById('processen');
  if (!root || !root.classList.contains('kj') || !('IntersectionObserver' in window)) return;

  var list = root.querySelector('.kj-chapters');
  var chapters = Array.prototype.slice.call(root.querySelectorAll('.kj-ch'));
  var views = chapters.map(function (ch) { return ch.querySelector('.kj-view'); });
  var bodies = chapters.map(function (ch) { return ch.querySelector('.kj-frame-body'); });
  var frames = chapters.map(function (ch) { return ch.querySelector('.kj-frame'); });
  var nodes = chapters.map(function (ch) { return ch.querySelector('.kj-node'); });
  var portal = root.querySelector('.kj-portal');
  var viewport = portal.querySelector('.kj-viewport');
  var phases = Array.prototype.slice.call(portal.querySelectorAll('.kj-phases li'));
  var rail = root.querySelector('.kj-rail');
  var fill = rail.querySelector('.kj-rail-fill');
  var splitMq = window.matchMedia('(min-width: 1024px)');
  var THEMES = ['start', 'build', 'launch', 'care'];
  var active = 0;
  var split = false;
  var started = false; // vyernas intoningar startar först när berättelsen syns

  root.classList.add('kj-js');

  function setActive(i) {
    active = i;
    chapters.forEach(function (ch, n) {
      ch.classList.toggle('is-active', n === i);
      ch.classList.toggle('is-done', n < i);
    });
    phases.forEach(function (p, n) {
      p.classList.toggle('is-current', n === i);
      p.classList.toggle('is-done', n < i);
    });
    portal.setAttribute('data-theme', THEMES[i]);
    if (split) {
      // is-cur styr vilken vy som syns, is-on startar vyns intoning
      views.forEach(function (v, n) {
        v.classList.toggle('is-cur', n === i);
        v.classList.toggle('is-on', started && n === i);
        v.classList.toggle('is-past', n < i);
      });
      if (started) portal.classList.add('kj-logo-in');
    }
  }

  // Vyerna flyttas mellan kapitlen (staplat) och portalfönstret (delat) utan att klonas
  function layout() {
    split = splitMq.matches;
    root.classList.toggle('kj--split', split);
    views.forEach(function (v, n) {
      var host = split ? viewport : bodies[n];
      if (v.parentNode !== host) host.appendChild(v);
      v.classList.remove('is-on', 'is-cur', 'is-past');
      if (!split && chapters[n].classList.contains('is-seen')) v.classList.add('is-on');
    });
    setActive(active);
    measure();
  }

  // Aktivt kapitel: det kapitel som korsar ett smalt band strax ovanför mitten
  var crossing = {};
  var bandIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { crossing[chapters.indexOf(e.target)] = e.isIntersecting; });
    for (var n = chapters.length - 1; n >= 0; n--) {
      if (crossing[n]) { if (n !== active) setActive(n); break; }
    }
  }, { rootMargin: '-45% 0px -54% 0px' });

  // Staplat läge: kapitlets vy spelar sin intoning en gång när den syns
  var seenIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var n = frames.indexOf(e.target);
      chapters[n].classList.add('is-seen');
      e.target.classList.add('kj-logo-in');
      if (!split) views[n].classList.add('is-on');
      seenIo.unobserve(e.target);
    });
  }, { threshold: 0.35 });

  chapters.forEach(function (ch) { bandIo.observe(ch); });
  frames.forEach(function (f) { seenIo.observe(f); });

  // Progresslinjen: mäts vid storleksändring, fylls med scrollen medan sektionen syns
  var railTop = 0, railH = 1, ticking = false, inView = false;
  function measure() {
    var base = list.getBoundingClientRect().top;
    var a = nodes[0].getBoundingClientRect(), b = nodes[nodes.length - 1].getBoundingClientRect();
    railTop = a.top + a.height / 2 - base;
    railH = Math.max(1, b.top + b.height / 2 - base - railTop);
    rail.style.top = railTop + 'px';
    rail.style.height = railH + 'px';
    paint();
  }
  function paint() {
    ticking = false;
    var top = list.getBoundingClientRect().top + railTop;
    var p = (window.innerHeight * 0.5 - top) / railH;
    fill.style.setProperty('--kj-p', (p < 0 ? 0 : p > 1 ? 1 : p).toFixed(4));
  }
  function onScroll() { if (inView && !ticking) { ticking = true; requestAnimationFrame(paint); } }

  new IntersectionObserver(function (entries) {
    inView = entries[0].isIntersecting;
    if (inView) onScroll();
  }).observe(list);
  // Intoningarna startar när berättelsen har kommit en bit in i viewporten
  var startIo = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    started = true;
    setActive(active);
    startIo.disconnect();
  }, { rootMargin: '0px 0px -35% 0px' });
  startIo.observe(list);
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(list);
  else window.addEventListener('resize', measure, { passive: true });

  if (splitMq.addEventListener) splitMq.addEventListener('change', layout);
  else if (splitMq.addListener) splitMq.addListener(layout);
  layout();
})();
