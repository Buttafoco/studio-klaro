/* ==========================================================================
   Studio Klaro – molnresan på startsidan (#processen). Stil: src/klaro-journey.css.
   Efter uppstigningen (skriptet sist i index.html – den enda delen som tillfälligt pausar scrollen) styrs
   allt av scrollen:
   - Färdlinjen byggs som en SVG-bana från landningens lösa linje, genom framtidsbilderna, bryggan och de tre
     stoppen, mitt genom den mörknande himlen och fram till liveindikatorn. Banan mäts bara vid storleksändring;
     vid scroll räknas ritad längd fram ur en förberäknad tabell (y → längd) – inga layoutmätningar per bildruta.
   - Desktop: framtidsbilderna byts i en sticky scen (data-f -1…2) efter hur långt man scrollat genom den.
     Mobil och statiskt: varje framtidsbild och varje stopp tänds när linjen når dess nod.
   - Himlens färg är en gradient i dokumentet; molnen sjunker och ljuspunkterna tänds efter --n (0→1).
   - När linjen når live: indikatorn tänds, webbplatsen blir fullt synlig och en svag ljusimpuls går genom linjen.
   Reducerad rörelse: ingen sticky scen, linjen visas färdig och allt syns direkt.
   ========================================================================== */
(function () {
  var kr = document.querySelector('#processen .kr');
  if (!kr) return;
  var svg = kr.querySelector('.kr-route');
  var main = svg.querySelector('.kr-main'), glow = svg.querySelector('.kr-glow'), pulse = svg.querySelector('.kr-pulse');
  var tip = svg.querySelector('.kr-tip'), grad = svg.querySelector('#kr-grad');
  var exit = document.querySelector('#processen .kj-idea-exit');
  var kf = kr.querySelector('.kf');
  var items = Array.prototype.slice.call(kf.querySelectorAll('.kf-item'));
  var bridge = kr.querySelector('.kr-intro-main');
  var stops = Array.prototype.slice.call(kr.querySelectorAll('.kr-stop'));
  var night = kr.querySelector('.kr-night');
  var destHead = kr.querySelector('.kr-dest-head');
  var live = kr.querySelector('.kr-live'), liveDot = kr.querySelector('.kr-live-dot');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 1024px)');
  var small = window.matchMedia('(max-width: 760px)');

  var total = 1, N = 0, ys = [], xs = [], marks = [];
  var krTop = 0, kfTop = 0, kfH = 1, nightTop = 0, nightH = 1, nightMidY = 0, headTop = 0;
  var still = false, stick = false, f = null, headIn = false, isLive = false, tipOn = false, tipNight = false;
  var lastLen = -1, lastN = -1;

  kr.classList.add('kr-js');

  function mode() {
    still = reduce.matches;
    stick = wide.matches && !still;
    kf.classList.toggle('kf--stick', stick);
    if (!stick) { kf.setAttribute('data-f', '2'); f = null; }
  }

  function rel(el, base) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
  }
  // Mjuk kurva med lodräta tangenter: y växer alltid längs banan (krävs för tabellen y → längd)
  function curve(a, b) {
    var m = (b.y - a.y) / 2;
    return ' C ' + a.x + ' ' + (a.y + m) + ' ' + b.x + ' ' + (b.y - m) + ' ' + b.x + ' ' + b.y;
  }
  function lengthAtY(y) {
    if (y <= ys[0]) return 0;
    if (y >= ys[N]) return total;
    var lo = 0, hi = N;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (ys[mid] <= y) lo = mid; else hi = mid; }
    var t = (y - ys[lo]) / Math.max(0.001, ys[hi] - ys[lo]);
    return (lo + t) / N * total;
  }
  function pointAt(len) {
    var i = len / total * N, lo = Math.floor(i), t = i - lo;
    if (lo >= N) return { x: xs[N], y: ys[N] };
    return { x: xs[lo] + (xs[lo + 1] - xs[lo]) * t, y: ys[lo] + (ys[lo + 1] - ys[lo]) * t };
  }

  function build() {
    pending = false;
    var base = kr.getBoundingClientRect();
    if (!base.width) return;
    var sy = window.scrollY || window.pageYOffset;
    krTop = base.top + sy;
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);
    svg.setAttribute('viewBox', '0 0 ' + base.width + ' ' + base.height);

    var pts = [], nodeMarks = [];
    // En nod med ett "rakt ned förbi texten"-steg, så att linjen aldrig korsar innehållet
    function addNode(node, textEl, target) {
      var p = rel(node, base);
      pts.push(p);
      nodeMarks.push({ y: p.y, node: node, target: target });
      var tb = textEl.getBoundingClientRect().bottom - base.top;
      pts.push({ x: p.x, y: Math.max(p.y + 1, tb + 28) });
    }
    if (exit && exit.offsetParent) pts.push(rel(exit, base));
    var bridgeNode = bridge.querySelector('.kr-node');
    var gx = rel(bridgeNode, base).x;
    var kr0 = kf.getBoundingClientRect();
    kfTop = kr0.top + sy; kfH = Math.max(1, kr0.height);
    if (stick) {
      // Sticky scen: linjen går lodrätt längs vänsterkanten genom hela scenen
      pts.push({ x: gx, y: kr0.top - base.top + 40 });
      pts.push({ x: gx, y: kr0.bottom - base.top - 40 });
    } else {
      items.forEach(function (it) { addNode(it.querySelector('.kr-node'), it, it); });
    }
    addNode(bridgeNode, bridge, null);
    stops.forEach(function (s) {
      // Portalscenen före Lanseringen: linjen passerar lodrätt längs vänsterkanten, aldrig genom texten
      var prev = s.previousElementSibling;
      if (prev && prev.classList.contains('kr-ps')) {
        var pr = prev.getBoundingClientRect();
        pts.push({ x: gx, y: pr.top - base.top - 12 });
        pts.push({ x: gx, y: pr.bottom - base.top + 12 });
      }
      addNode(s.querySelector('.kr-node'), s.querySelector('.kr-stop-txt'), s);
    });
    var nr = night.getBoundingClientRect();
    nightTop = nr.top + sy; nightH = Math.max(1, nr.height);
    var mid = { x: base.width * (small.matches ? 0.5 : 0.56), y: nr.top - base.top + nr.height * 0.52 };
    var L = rel(liveDot, base);
    var hr = destHead.getBoundingClientRect();
    headTop = hr.top + sy;
    pts.push(mid);
    pts.push({ x: L.x, y: Math.max(mid.y + 1, hr.top - base.top - 36) });
    pts.push(L);
    for (var k = 1; k < pts.length; k++) if (pts[k].y <= pts[k - 1].y) pts[k].y = pts[k - 1].y + 1;

    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j];
      d += Math.abs(a.x - b.x) < 0.5 ? ' L ' + b.x + ' ' + b.y : curve(a, b);
    }
    main.setAttribute('d', d); glow.setAttribute('d', d); pulse.setAttribute('d', d);
    total = main.getTotalLength() || 1;
    N = Math.min(1600, Math.max(240, Math.ceil(total / 6)));
    ys = []; xs = [];
    for (var s = 0; s <= N; s++) {
      var pt = main.getPointAtLength(total * s / N);
      xs.push(pt.x); ys.push(pt.y);
    }
    for (var m = 1; m <= N; m++) if (ys[m] < ys[m - 1]) ys[m] = ys[m - 1];
    // Rensa tillstånd från en tidigare byggd bana (t.ex. byte mellan sticky och linjärt)
    marks.forEach(function (mk) { mk.node.classList.remove('is-on'); if (mk.target) mk.target.classList.remove('is-reached'); });
    marks = nodeMarks.map(function (mk) { mk.at = lengthAtY(mk.y); mk.on = false; return mk; });
    nightMidY = mid.y;

    // Linjen går från Klaro-blå till ljust blå genom den mörknande himlen
    grad.setAttribute('y1', nr.top - base.top + nr.height * 0.3);
    grad.setAttribute('y2', nr.top - base.top + nr.height * 0.9);
    main.style.strokeDasharray = glow.style.strokeDasharray = total + ' ' + total;
    lastLen = -1; lastN = -1;
    paint();
  }
  var pending = false;
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(build); } }

  function paint() {
    ticking = false;
    if (!N) return;
    var sy = window.scrollY || window.pageYOffset, vh = window.innerHeight;
    var len = still ? total : lengthAtY(sy + vh * (small.matches ? 0.66 : 0.6) - krTop);

    // Framtidsbilderna i sticky-scenen: skiss tills scenen nått halvvägs upp, sedan en bild per tredjedel
    if (stick) {
      var p = (sy - kfTop) / Math.max(1, kfH - vh);
      var nf = sy + vh * 0.5 < kfTop ? -1 : p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2;
      if (nf !== f) { f = nf; kf.setAttribute('data-f', String(nf)); }
    }

    if (Math.abs(len - lastLen) > 0.25) {
      lastLen = len;
      main.style.strokeDashoffset = glow.style.strokeDashoffset = total - len;
      var showTip = !still && len > 2 && len < total - 2;
      if (showTip !== tipOn) { tipOn = showTip; tip.classList.toggle('is-on', showTip); }
      if (showTip) {
        var pt = pointAt(len);
        tip.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
        var nt = pt.y > nightMidY - nightH * 0.2;
        if (nt !== tipNight) { tipNight = nt; tip.classList.toggle('is-night', nt); }
      }
      // Noder, framtidsbilder och stopp tänds när linjen når dem – och släcks igen om man scrollar tillbaka
      for (var i = 0; i < marks.length; i++) {
        var on = len >= marks[i].at - 1;
        if (on !== marks[i].on) {
          marks[i].on = on;
          marks[i].node.classList.toggle('is-on', on);
          if (marks[i].target) marks[i].target.classList.toggle('is-reached', on);
        }
      }
      if (!isLive && len >= total - 1.5) arrive();
    }

    var n = still ? 1 : Math.min(1, Math.max(0, (sy + vh - nightTop) / (nightH + vh * 0.55)));
    if (Math.abs(n - lastN) > 0.002) { lastN = n; night.style.setProperty('--n', n.toFixed(3)); }

    // "När vi är framme" kommer fram först när den mörka himlen är etablerad (en gång)
    if (!headIn && (still || sy + vh * 0.8 > headTop)) { headIn = true; destHead.classList.add('is-in'); }
  }

  // Ankomsten: liveindikatorn tänds, webbplatsen blir fullt synlig och en svag ljusimpuls löper in i punkten
  function arrive() {
    isLive = true;
    live.classList.add('is-live');
    if (still || typeof pulse.animate !== 'function') return;
    var P = 64, from = Math.max(0, total - 520);
    pulse.style.strokeDasharray = P + ' ' + (total + P);
    pulse.animate([
      { strokeDashoffset: -from, opacity: 0 },
      { opacity: 0.9, offset: 0.25 },
      { strokeDashoffset: -(total - P), opacity: 0 }
    ], { duration: 1300, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' });
  }

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }

  mode();
  build();
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(schedule);
    ro.observe(kr);
    var scene = document.querySelector('#processen .kj-ascent');
    if (scene) ro.observe(scene); // landningens linje flyttas om scenen byter höjd
  } else window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  [reduce, wide, small].forEach(function (mq) {
    function change() { mode(); schedule(); }
    if (mq.addEventListener) mq.addEventListener('change', change);
    else if (mq.addListener) mq.addListener(change);
  });
})();

/* ---------- Efter resan: sidovägen "Anpassas efter din resa" ----------
   Stängd från start med JS (öppen utan JS); aria-expanded på knappen och inert på panelen. */
(function () {
  var btn = document.querySelector('#processen .ka-fork-btn');
  if (!btn) return;
  var panel = document.getElementById(btn.getAttribute('aria-controls'));
  function setOpen(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.inert = !open;
  }
  setOpen(false);
  btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
})();

/* ---------- Övergången till kontaktsektionen (#kontakt) ----------
   Den visade projektresan är klar – nu kan besökarens egen börja. En kort linje lämnar LIVE-punkten,
   går rakt ned mellan grenarna (inte genom Klaro Care) och gör en mjuk båge till startpunkten
   "Ditt första steg". På mobil: en kort lodrät anslutning. En gång per sidvisning, när ~22 % av sektionen
   syns (IntersectionObserver, kopplas bort direkt): linjen ritas (rAF, ~0,7 s på desktop, ~0,4 s på mobil)
   och samtidigt glider innehållet upp i tre steg (se .kx-in i klaro-journey.css). Fokus i formuläret visar allt direkt. Reducerad rörelse: direkt. */
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
  // Tre steg: etikett, eyebrow och rubrik först, brödtexten +100 ms, formulär och trygghetsrad +220 ms
  ins.forEach(function (el) {
    var d = el.matches('.wz-shell, .wz-perks') ? 220 : (el.tagName === 'P' && !el.classList.contains('kx-start')) ? 100 : 0;
    el.style.setProperty('--kx-d', d + 'ms');
  });
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
    open(); // innehållet börjar direkt när sektionen nått in i viewporten; linjen ritas samtidigt
    var dur = small.matches ? 400 : 700, t0 = null;
    function frame(now) {
      if (prog >= 1) return;
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      prog = ease(t);
      render(prog);
      if (t < 1) requestAnimationFrame(frame); else finish();
    }
    requestAnimationFrame(frame);
  }

  build();
  if (reduce.matches) finish();
  else {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); draw(); }
    }, { threshold: 0.22 });
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
