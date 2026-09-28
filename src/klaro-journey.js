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
   Banan byggs om vid storleksändring (rAF-strypt). Ritningen startar en gång per sidvisning när
   inledningen når ~68 % ned i viewporten (IntersectionObserver) och fortsätter sedan av sig själv med
   requestAnimationFrame: ~3,2 s enligt en mjuk tidsplan per etapp (se KEY_T), oberoende av scrollen. En lysande
   punkt följer spetsen, varje stopp tänds när linjen når det och LIVE tänds sist. Scrollar besökaren
   förbi en spets som redan har synts ritas linjen ikapp snabbare. Reducerad rörelse: allt visas direkt. */
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
  var head = kd.querySelector('.kd-head');
  var DRAW_MS = 3200;
  var total = 1, at = [];  // banans längd och varje stopps position längs den
  var prog = 0;            // ritad andel 0–1 (tillstånd som överlever ombyggnad vid storleksändring)
  var started = false, finished = false;

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

  // Tidsplan för ritningen. Banan är ojämn: infarten från kapitel 04 förbi inledningen är över hälften
  // av längden, stoppen ligger tätt därefter. En easing på hela längden skulle därför klumpa ihop stoppen
  // och lämna en lång, seg sista etapp. I stället får varje etapp sin tid – infarten ~30 %, stopp 1–6 med
  // jämna mellanrum, LIVE sist – och punkterna binds ihop med en monoton kubisk kurva (Fritsch–Carlson),
  // så att farten ändras mjukt utan ryck och bromsar in lugnt mot LIVE.
  var KEY_T = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1];
  var schedule = function (t) { return t; };
  function makeSchedule(ys) {
    var xs = KEY_T, n = xs.length, d = [], m = [], i;
    for (i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0] * 1.4;          // lugn men tydlig start
    m[n - 1] = d[n - 2] * 0.2;  // mjuk ankomst till LIVE
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      var a2 = m[i] / d[i], b2 = m[i + 1] / d[i], h2 = a2 * a2 + b2 * b2;
      if (h2 > 9) { var k = 3 / Math.sqrt(h2); m[i] = k * a2 * d[i]; m[i + 1] = k * b2 * d[i]; }
    }
    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      for (var j = 0; j < n - 1 && t > xs[j + 1]; j++);
      var h = xs[j + 1] - xs[j], u = (t - xs[j]) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * ys[j] + (u3 - 2 * u2 + u) * h * m[j] +
        (-2 * u3 + 3 * u2) * ys[j + 1] + (u3 - u2) * h * m[j + 1];
    };
  }

  // Visa ritad andel: linje, glöd, spets och de stopp linjen har nått
  function render(p) {
    var len = total * p;
    main.style.strokeDashoffset = glow.style.strokeDashoffset = total - len;
    if (head) {
      var pt = main.getPointAtLength(len);
      head.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
    }
    for (var i = 0; i < at.length; i++) {
      if (len >= at[i] - 1 && !stops[i].classList.contains('is-on')) stops[i].classList.add('is-on');
    }
  }
  function arrive() {
    finished = true;
    prog = 1;
    render(1);
    if (head) head.classList.remove('is-on');
    kd.classList.add('is-live');
    bOpt.style.strokeDashoffset = 0;
    if (!reduce.matches) confetti();
  }

  // Avslutande konfetti från LIVE-punkten: ~22 små partiklar (Klaro-blå, LIVE-grön, vitt, lite ljusblått)
  // som skjuts mjukt uppåt och utåt, singlar ned en bit och tonar bort på ~1,6–2 s. Bara transform/opacity
  // via Web Animations, absolut positionerat (ingen layoutförskjutning), aria-hidden, pointer-events: none,
  // och tas bort ur DOM när den är klar. Körs bara från arrive(), dvs. en gång när linjen når LIVE.
  function confetti() {
    var map = kd.querySelector('.kd-map');
    if (!map || !live || typeof Element.prototype.animate !== 'function') return;
    var mr = map.getBoundingClientRect(), lr = live.getBoundingClientRect();
    var box = document.createElement('div');
    box.className = 'kd-confetti';
    box.setAttribute('aria-hidden', 'true');
    box.style.left = (lr.left + lr.width / 2 - mr.left) + 'px';
    box.style.top = (lr.top + lr.height / 2 - mr.top) + 'px';
    map.appendChild(box);

    var narrow = small.matches;
    var COLORS = ['#146EF5', '#146EF5', '#146EF5', '#43A866', '#43A866', '#43A866', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#9CC3FF'];
    var SHAPES = ['rect', 'rect', 'rect', 'streak', 'streak', 'dot'];
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var anims = [];
    for (var i = 0; i < 22; i++) {
      var el = document.createElement('i');
      var shape = SHAPES[i % SHAPES.length];
      el.className = 'kd-cf kd-cf--' + shape;
      el.style.background = COLORS[(i * 7) % COLORS.length];
      var sz = rnd(0.8, 1.25);
      if (shape === 'rect') { el.style.width = (6 * sz) + 'px'; el.style.height = (3.2 * sz) + 'px'; }
      else if (shape === 'streak') { el.style.width = (1.6 * sz) + 'px'; el.style.height = (9 * sz) + 'px'; }
      else { el.style.width = el.style.height = (4.2 * sz) + 'px'; }
      box.appendChild(el);

      // Kon uppåt och ut åt sidorna; på mobil ligger punkten vid vänsterkanten, så konen vänds åt höger
      var ang = (narrow ? rnd(-100, -15) : rnd(-165, -15)) * Math.PI / 180;
      var dist = narrow ? rnd(55, 120) : rnd(70, 165);
      var x1 = Math.cos(ang) * dist, y1 = Math.sin(ang) * dist;
      var x2 = x1 * rnd(1.1, 1.3) + rnd(-10, 10), y2 = y1 + rnd(45, 95);
      var r0 = rnd(0, 180), r1 = r0 + rnd(-220, 220), r2 = r1 + rnd(-160, 160);
      var dur = rnd(1600, 2000);
      anims.push(el.animate([
        { transform: 'translate(-50%,-50%) translate(0,0) rotate(' + r0 + 'deg) scale(.5)', opacity: 0, easing: 'cubic-bezier(0.16,1,0.3,1)' },
        { transform: 'translate(-50%,-50%) translate(' + x1 * 0.35 + 'px,' + y1 * 0.35 + 'px) rotate(' + (r0 + (r1 - r0) * 0.3) + 'deg) scale(1)', opacity: 1, offset: 0.08, easing: 'cubic-bezier(0.16,1,0.3,1)' },
        { transform: 'translate(-50%,-50%) translate(' + x1 + 'px,' + y1 + 'px) rotate(' + r1 + 'deg) scale(1)', opacity: 1, offset: 0.42, easing: 'cubic-bezier(0.45,0,0.7,1)' },
        { transform: 'translate(-50%,-50%) translate(' + x2 + 'px,' + y2 + 'px) rotate(' + r2 + 'deg) scale(.9)', opacity: 0 }
      ], { duration: dur, delay: rnd(0, 90), fill: 'both' }));
    }
    var done = false;
    var clean = function () { if (!done) { done = true; box.remove(); } };
    Promise.all(anims.map(function (a) { return a.finished; })).then(clean, clean);
    setTimeout(clean, 2600); // säkerhetsnät om en animation avbryts
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
    at = [];
    dots.forEach(function (dot) {
      var p = center(dot, base);
      d += curve(prev, p); prev = p;
      at.push(lengthOf(d));
    });
    var L = center(live, base);
    d += curve(prev, L);
    total = lengthOf(d);
    schedule = makeSchedule([0].concat(at.map(function (x) { return x / total; }), [1]));
    main.setAttribute('d', d);
    glow.setAttribute('d', d);
    main.style.strokeDasharray = glow.style.strokeDasharray = total + ' ' + total;

    var o = center(fOpt, base), k = center(fCare, base);
    var dOpt = 'M ' + L.x + ' ' + L.y + curve(L, o);
    bOpt.setAttribute('d', dOpt);
    var optLen = lengthOf(dOpt);
    bOpt.style.strokeDasharray = optLen + ' ' + optLen;
    bOpt.style.strokeDashoffset = finished ? 0 : optLen;
    // Staplat (mobil): Care ligger under sidovägen, så den prickade grenen fortsätter därifrån
    var from = Math.abs(k.x - o.x) < 30 && k.y > o.y ? o : L;
    bCare.setAttribute('d', 'M ' + from.x + ' ' + from.y + curve(from, k));

    render(prog); // behåller ritad andel vid storleksändring (0 = helt dold, 1 = klar)
  }

  var pending = false;
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(build); } }

  // Ritningen: tidsstyrd med rAF. Normal takt ger ~3,2 s; om spetsen hamnat ovanför viewporten
  // (besökaren har scrollat förbi) går tiden fortare så att linjen hinner ikapp.
  function draw() {
    if (started) return;
    started = true;
    if (reduce.matches) { arrive(); return; }
    if (head) head.classList.add('is-on');
    var elapsed = 0, last = null, tipSeen = false;
    function frame(now) {
      if (finished) return;
      if (last === null) last = now;
      var dt = Math.min(64, now - last); last = now;
      var speed = 1;
      if (head) {
        // Ikapp bara när spetsen redan har synts och besökaren sedan scrollat förbi den – inte i början,
        // när linjen startar vid kapitel 04:s nod ovanför viewporten.
        var r = head.getBoundingClientRect();
        if (r.top > 0 && r.bottom < window.innerHeight) tipSeen = true;
        else if (tipSeen && r.bottom < window.innerHeight * 0.15) speed = 3.5;
      }
      elapsed += dt * speed;
      var t = Math.min(1, elapsed / DRAW_MS);
      prog = Math.max(prog, schedule(t)); // aldrig bakåt, även om banan byggs om under ritningen
      render(prog);
      if (t >= 1) { arrive(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  build();
  if (reduce.matches) draw();
  else {
    // Start när inledningen (eller något senare i resan) når ~68 % ned i viewporten. Om besökaren redan
    // har passerat sektionen (t.ex. återställd scrollposition längre ned) startar den när den syns igen.
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { draw(); io.disconnect(); return; }
      }
    }, { rootMargin: '0px 0px -32% 0px' });
    io.observe(intro);
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

/* ---------- Övergången till kontaktsektionen (#kontakt) ----------
   Den visade projektresan är klar – nu kan besökarens egen börja. En kort linje lämnar LIVE-punkten,
   går rakt ned mellan grenarna (inte genom Klaro Care) och gör en mjuk båge till startpunkten
   "Ditt första steg". På mobil: en kort lodrät anslutning. Ritas en gång per sidvisning när sektionen
   når mitten av viewporten (IntersectionObserver + rAF, ~1,2 s på desktop, ~0,6 s på mobil); därefter
   tonar etikett, rubrik och formulär in. Fokus i formuläret visar allt direkt. Reducerad rörelse: direkt. */
(function () {
  var kx = document.getElementById('kontakt');
  if (!kx || !kx.classList.contains('kx') || !('IntersectionObserver' in window)) return;
  var svg = kx.querySelector('.kx-svg'), path = kx.querySelector('.kx-path'), glow = kx.querySelector('.kx-glow');
  var dot = kx.querySelector('.kx-dot');
  var kd = document.getElementById('kj-dest');
  var live = kd && kd.querySelector('.kd-live-dot');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var small = window.matchMedia('(max-width: 760px)');
  var ins = Array.prototype.slice.call(kx.querySelectorAll('.kx-in'));
  var total = 1, prog = 0, started = false, opened = false;
  ins.forEach(function (el, i) { el.style.setProperty('--kx-i', i); });
  kx.classList.add('kx-js');

  function center(el, base) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
  }
  function render(p) {
    path.style.strokeDashoffset = glow.style.strokeDashoffset = total * (1 - p);
  }
  function build() {
    pending = false;
    var base = kx.getBoundingClientRect();
    if (!base.width) return;
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);
    var end = center(dot, base); end.y -= 11; // landar precis ovanför startpunkten
    var d;
    if (small.matches || !live || !live.offsetParent) {
      d = 'M ' + end.x + ' ' + (end.y - 56) + ' L ' + end.x + ' ' + end.y;
    } else {
      var L = center(live, base);
      var from = { x: L.x, y: L.y + 18 };
      var bend = { x: L.x, y: kd.getBoundingClientRect().bottom - base.top }; // rakt ned mellan grenarna
      if (bend.y < from.y) bend.y = from.y;
      var m = (end.y - bend.y) / 2;
      d = 'M ' + from.x + ' ' + from.y + ' L ' + bend.x + ' ' + bend.y +
        ' C ' + bend.x + ' ' + (bend.y + m) + ' ' + end.x + ' ' + (end.y - m) + ' ' + end.x + ' ' + end.y;
    }
    path.setAttribute('d', d); glow.setAttribute('d', d);
    total = path.getTotalLength() || 1;
    path.style.strokeDasharray = glow.style.strokeDasharray = total + ' ' + total;
    render(prog);
  }
  var pending = false;
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(build); } }

  function open() { if (opened) return; opened = true; kx.classList.add('is-open'); }
  function finish() { prog = 1; render(1); open(); }
  // ease-in-out: lugn start, mjuk landning
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function draw() {
    if (started) return;
    started = true;
    if (reduce.matches) { finish(); return; }
    var dur = small.matches ? 600 : 1200, t0 = null;
    function frame(now) {
      if (prog >= 1) return;
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      prog = ease(t);
      render(prog);
      if (t >= 0.72) open(); // rubrik och formulär börjar tona in när linjen närmar sig startpunkten
      if (t < 1) requestAnimationFrame(frame); else finish();
    }
    requestAnimationFrame(frame);
  }

  build();
  if (reduce.matches) finish();
  else {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { draw(); io.disconnect(); }
    }, { rootMargin: '0px 0px -50% 0px' });
    io.observe(kx);
  }
  // Tangentbord eller hopp direkt till formuläret: visa allt direkt
  kx.addEventListener('focusin', function () { if (!opened) { started = true; finish(); } });
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(schedule);
    ro.observe(kx);
    if (kd) ro.observe(kd);
  } else window.addEventListener('resize', schedule, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
