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

/* ---------- Slutdestinationen (#kj-dest) ----------
   Linjen byggs som en SVG-bana genom nodernas faktiska mittpunkter: från kapitel 04:s nod, förbi
   inledningen, genom de sex stoppen och till Live; därefter grenar till sidovägen och Klaro Care.
   Banan byggs om vid storleksändring (rAF-strypt), ritas en gång när kartan syns (IntersectionObserver)
   och stoppen tänds när linjen passerar dem. Reducerad rörelse: allt visas direkt. */
(function () {
  var kd = document.getElementById('kj-dest');
  if (!kd || !('IntersectionObserver' in window)) return;

  var svg = kd.querySelector('.kd-svg');
  var main = kd.querySelector('.kd-main');
  var glow = kd.querySelector('.kd-glow');
  var bOpt = kd.querySelector('.kd-branch--opt');
  var bCare = kd.querySelector('.kd-branch--care');
  var intro = kd.querySelector('.kd-intro');
  var stops = Array.prototype.slice.call(kd.querySelectorAll('.kd-stop'));
  var dots = stops.map(function (s) { return s.querySelector('.kd-dot'); });
  var live = kd.querySelector('.kd-live-dot');
  var fOpt = kd.querySelector('.kd-fork--opt .kd-fdot');
  var fCare = kd.querySelector('.kd-fork--care .kd-fdot');
  var railNodes = document.querySelectorAll('#processen .kj-node');
  var lastNode = railNodes[railNodes.length - 1];
  var btn = kd.querySelector('.kd-fork-btn');
  var panel = document.getElementById(btn.getAttribute('aria-controls'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var small = window.matchMedia('(max-width: 760px)');
  var probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  var drawn = false;

  kd.classList.add('kd-js');
  svg.appendChild(probe);
  probe.setAttribute('fill', 'none');

  // Sidovägen: stängd från start (öppen utan JS), aria-expanded + inert på panelen
  function setOpen(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.inert = !open;
  }
  setOpen(false);
  btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });

  function center(el, base) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
  }
  // Mjuk kurva med lodräta tangenter mellan två punkter
  function curve(a, b) {
    var m = (b.y - a.y) / 2;
    return ' C ' + a.x + ' ' + (a.y + m) + ' ' + b.x + ' ' + (b.y - m) + ' ' + b.x + ' ' + b.y;
  }
  function lengthOf(d) { probe.setAttribute('d', d); return probe.getTotalLength(); }
  function dash(p, len) {
    p.style.strokeDasharray = len + ' ' + len;
    p.style.strokeDashoffset = drawn ? 0 : len;
  }

  function build() {
    pending = false;
    var base = kd.getBoundingClientRect();
    if (!base.width) return;
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);

    var s = lastNode && lastNode.offsetParent ? center(lastNode, base) : { x: 22, y: 0 };
    if (lastNode && lastNode.offsetParent) s.y += lastNode.offsetHeight / 2;
    var bend = { x: s.x, y: intro.getBoundingClientRect().bottom - base.top + 24 };
    var d = 'M ' + s.x + ' ' + s.y + ' L ' + bend.x + ' ' + bend.y;
    var prev = bend;
    var at = [];
    dots.forEach(function (dot) {
      var p = center(dot, base);
      d += curve(prev, p); prev = p;
      at.push(lengthOf(d));
    });
    var L = center(live, base);
    d += curve(prev, L);
    var total = lengthOf(d);
    main.setAttribute('d', d);
    glow.setAttribute('d', d);

    var o = center(fOpt, base), k = center(fCare, base);
    var dOpt = 'M ' + L.x + ' ' + L.y + curve(L, o);
    bOpt.setAttribute('d', dOpt);
    // Staplat (mobil): Care ligger under sidovägen, så den prickade grenen fortsätter därifrån
    var from = Math.abs(k.x - o.x) < 30 && k.y > o.y ? o : L;
    bCare.setAttribute('d', 'M ' + from.x + ' ' + from.y + curve(from, k));

    var dur = reduce.matches ? 0 : small.matches ? 1400 : 2400;
    kd.style.setProperty('--kd-dur', dur + 'ms');
    at.forEach(function (len, i) { stops[i].style.setProperty('--kd-d', Math.round(len / total * dur) + 'ms'); });
    dash(main, total);
    dash(glow, total);
    dash(bOpt, lengthOf(dOpt));
  }

  var pending = false;
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(build); } }

  function draw() {
    if (drawn) return;
    drawn = true;
    kd.getBoundingClientRect(); // starttillståndet renderas innan övergången börjar
    kd.classList.add('is-drawn');
    [main, glow, bOpt].forEach(function (p) { p.style.strokeDashoffset = 0; });
  }

  build();
  if (reduce.matches) draw();
  else {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { draw(); io.disconnect(); }
    }, { rootMargin: '0px 0px -30% 0px' });
    io.observe(kd.querySelector('.kd-map'));
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(schedule);
    ro.observe(kd);
    // Kapitlen ovanför kan byta höjd (t.ex. delat/staplat läge) och flytta startpunkten
    ro.observe(document.querySelector('#processen .kj-story'));
  } else window.addEventListener('resize', schedule, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
