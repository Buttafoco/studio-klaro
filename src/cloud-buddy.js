// Cloud – sajtens streckgubbe (samma figur som hero-gubben på startsidan, src/stickman.js).
// Han dyker upp om och om igen medan man är på sidan: första gången strax efter sidbytet, sedan med slumpade
// mellanrum (GAP) och lite tidigare om man har scrollat en bit. Var och hur väljs slumpvis bland två sorters varianter:
// - på skärmen (SCREEN): tittar upp från nederkanten, kikar in från sidan, svävar förbi på moln, ballong, paraply …
// - på sidan (FITS): på en rubrik, bild eller ett kort som syns just då – sitter, promenerar, fiskar, jonglerar,
//   dansar, säger hej, kastar pappersflygplan, trixar med en fotboll, åker skateboard, kikar fram bakom en bild, hänger i en kant, målar …
// Han gör inte om det han gjorde nyss (minns de senaste även mellan sidbyten) och sidans "egen" variant (PAGES)
// kommer gärna först. Aldrig två samtidigt och aldrig ihop med hero-gubben, en öppen meny eller ett formulär i fokus.
// Rent dekorativ (aria-hidden, inga klick). Hoppas över vid reducerad rörelse; tonas bort om fönsterbredden ändras.
// Test: ?cloud (tätare) eller ?cloud=fish (bara den varianten). Stil: src/cloud-buddy.css.
import { NS, makeFigure, makeCloud } from './stickman.js';

(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.body || !document.body.animate) return;

  var PAGES = {
    '/': null,                                      // startsidan: hero-gubben tar introt
    '/om': 'sit',
    '/priser': 'peek',
    '/portfolio': 'doze',
    '/case-galleri86': 'side',
    '/hemsida-frisor-stockholm': 'walk',
    '/hemsida-restaurang-stockholm': 'soccer',
    '/hemsida-fotograf': 'photo',
    '/hemsida-skonhetssalong-stockholm': 'balloon',
    '/seo-koll': 'search'
  };
  var path = location.pathname.replace(/\.html$/, '').replace(/\/(index)?$/, '') || '/';
  var guide = /^\/guider(\/|$)/.test(path);
  if (!(path in PAGES) && !guide) return;
  var signature = guide ? 'read' : PAGES[path];

  var GAP = [1200, 3200], MAX = 60;                 // paus efter varje framträdande (ms, slumpad inom spannet), max per sidvisning
  var force = new URLSearchParams(location.search).get('cloud');
  if (force !== null) GAP = [800, 1400];
  var only = force || null;
  var PHRASES = ['Hej!', 'Snyggt, va?', 'Kul att du kikar!', 'Hallå där!', 'Läser du också?', 'Psst … scrolla vidare'];

  var root = document.documentElement;
  var EASE = 'cubic-bezier(0.22,1,0.36,1)';
  var layer = null, anims = [], timers = [], over = true, busy = false, startW = 0, away = null;
  var lastEnd = 0, nextAt = Date.now() + (path === '/' ? 4000 : 600 + Math.random() * 500), shown = 0;  // startsidan: hero-gubben först
  var small, H, W, k, HIP;
  var recent = [];
  try { recent = JSON.parse(sessionStorage.getItem('cb-recent') || '[]'); } catch (e) {}
  // Instagram-bubblan är sällsynt: som mest en gång per sidvisning, och sedan inte igen förrän INSTA.every sidvisningar senare
  var INSTA = { url: 'https://www.instagram.com/studioklaro/', chance: 0.15, after: 2, every: 4 };
  var views = 1, instaAt = -99, instaDone = false;
  try {
    views = (+sessionStorage.getItem('cb-views') || 0) + 1;
    sessionStorage.setItem('cb-views', views);
    var ia = sessionStorage.getItem('cb-insta');
    if (ia !== null) instaAt = +ia;
  } catch (e) {}

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function sleep(ms) { return new Promise(function (r) { later(r, ms); }); }
  function anim(node, frames, opts) { var a = node.animate(frames, opts); anims.push(a); return a; }
  function wait(a) { return new Promise(function (r) { a.onfinish = r; }); }
  function tr(x, y, extra) { return 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : ''); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function el(cls, parent) { var d = document.createElement('div'); d.className = cls; (parent || layer).appendChild(d); return d; }
  function svgIn(fig, sel, html) {
    var g = document.createElementNS(NS, 'g');
    g.innerHTML = html;
    var node = g.firstChild;
    fig.querySelector(sel).appendChild(node);
    return node;
  }
  function sizes() { small = innerWidth < 600; H = small ? 32 : 40; W = H * 40 / 60; k = H / 60; HIP = 34 * k; }

  // ---------- Körningen ----------

  function stop() {
    if (over) return;
    over = true;
    ended();
    timers.forEach(clearTimeout);
    var old = anims, l = layer;
    old.forEach(function (a) { a.onfinish = null; });
    if (!l) return;
    l.classList.add('is-gone');
    setTimeout(function () { old.forEach(function (a) { try { a.cancel(); } catch (e) {} }); l.remove(); }, 350);
  }
  function finish() {
    over = true;
    ended();
    if (layer) layer.remove();
  }
  function ended() {
    busy = false;
    lastEnd = Date.now();
    nextAt = lastEnd + rand(GAP[0], GAP[1]) * (shown > 20 ? 1.5 : 1);
    removeEventListener('resize', onResize);
    if (away) { away.disconnect(); away = null; }
  }
  function onResize() { if (innerWidth !== startW) stop(); }

  function play(kind, s) {
    busy = true; over = false; anims = []; timers = [];
    layer = document.createElement('div');
    layer.className = 'cb-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    startW = innerWidth;
    addEventListener('resize', onResize);
    recent = [kind].concat(recent.filter(function (r) { return r !== kind; })).slice(0, 8);
    try { sessionStorage.setItem('cb-recent', JSON.stringify(recent)); } catch (e) {}
    var me = layer;
    RUN[kind](s).then(
      function () { if (layer === me && !over) finish(); },
      function () { if (layer === me) stop(); }
    );
  }

  // På sidan: lagret följer med när man scrollar; han tonas bort om elementet han är vid scrollas ur bild
  function onPage(s) {
    layer.classList.add('is-page');
    layer.style.height = root.scrollHeight + 'px';
    if (!s || !window.IntersectionObserver) return;
    away = new IntersectionObserver(function (es) { if (!es[es.length - 1].isIntersecting) stop(); });
    away.observe(s.el);
  }

  // ---------- Gubben ----------

  // Två omslag: gx flyttar i sidled, gy i höjdled (och roterar)
  function guy(parent) {
    var gx = el('hs-x', parent), gy = el('hs-y', gx), fig = makeFigure(H);
    gy.appendChild(fig);
    return { gx: gx, gy: gy, fig: fig };
  }
  function pose(fig) { fig.setAttribute('class', 'hs-fig ' + Array.prototype.slice.call(arguments, 1).join(' ')); }
  function face(fig, left) { fig.style.transform = left ? 'scaleX(-1)' : ''; }
  async function wave(fig, ms) {
    fig.classList.add('hs-wave');
    await sleep(ms || 1300);
    fig.classList.remove('hs-wave');
  }
  async function tada(fig, ms) {
    fig.classList.add('cb-tada');
    await sleep(ms || 900);
    fig.classList.remove('cb-tada');
  }
  // Landar uppifrån på (x, y) = figurens övre vänstra hörn; poseLand läggs på i landningen (t.ex. sittande)
  async function land(g, x, y, poseLand) {
    g.gx.style.transform = tr(x, 0);
    g.fig.classList.add('hs-air');
    later(function () { g.fig.classList.remove('hs-air'); if (poseLand) g.fig.classList.add(poseLand); }, 400);
    await wait(anim(g.gy, [
      { transform: tr(0, y - 56), opacity: 0, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(0, y), opacity: 1, offset: 0.7, easing: 'ease-out' },
      { transform: tr(0, y - 5), offset: 0.85, easing: 'ease-in' },
      { transform: tr(0, y) }
    ], { duration: 640, fill: 'forwards' }));
  }
  // Hoppar iväg i sidled och tonas bort
  async function hopOff(g, x, y, dx) {
    if (over) return;
    pose(g.fig, 'hs-crouch');
    await sleep(200);
    if (over) return;
    pose(g.fig, 'hs-air');
    anim(g.gx, [{ transform: tr(x, 0) }, { transform: tr(x + dx, 0) }], { duration: 560, easing: 'cubic-bezier(0.3,0,0.6,1)', fill: 'forwards' });
    await wait(anim(g.gy, [
      { transform: tr(0, y), opacity: 1, easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(0, y - 38), opacity: 1, offset: 0.45, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
      { transform: tr(0, y - 8), opacity: 0 }
    ], { duration: 560, fill: 'forwards' }));
  }
  // Promenad: ett helt antal steg, så att benen stannar i viloläge
  function walkMs(dist) { return Math.max(2, Math.round(Math.abs(dist) / 58)) * 560; }
  async function walkTo(g, a, b, ms) {
    g.fig.style.setProperty('--cyc', '560ms');
    g.fig.classList.add('hs-walk');
    await wait(anim(g.gx, [{ transform: tr(a, 0) }, { transform: tr(b, 0) }], { duration: ms || walkMs(b - a), easing: 'linear', fill: 'forwards' }));
    g.fig.classList.remove('hs-walk');
  }

  // ---------- Omgivningen ----------

  // Var "golvet" är vid skärmens nederkant: ovanpå det flytande formuläret om det ligger i vägen för x0–x1
  function floorFor(x0, x1) {
    var d = document.querySelector('.wz-dock.is-shown');
    if (d) {
      var r = d.getBoundingClientRect();
      if (r.top < innerHeight && r.left < x1 + 8 && r.right > x0 - 8) return r.top - 2;
    }
    return innerHeight;
  }
  function headerBottom() {
    var n = document.querySelector('.nav-wrap');
    return n ? Math.max(0, n.getBoundingClientRect().bottom) : 72;
  }
  function seatOn(cloudW, g) {
    g.gx.style.transform = tr(cloudW * 0.5 - W / 2, 0);
    g.gy.style.transform = tr(0, cloudW / 2 * 0.48 - HIP);
  }

  // Ytor han kan vara på just nu: rubrikers första rad (text) och överkanten på bilder/kort (box), helt i bild,
  // inte täckta av något annat. Koordinater i fönstret (y, x0, x1) och på sidan (Y, X0, X1, B = boxens underkant).
  var TEXT = /^H[1-3]$/, BOX = /^(IMG|PICTURE|VIDEO|FIGURE|ARTICLE|ASIDE|SECTION|DIV|A|LI|BLOCKQUOTE|BUTTON)$/;
  var SKIP = 'footer, nav, .nav-wrap, .wz-dock, .wz-prompt-card, .mnav, form, .cb-layer, .hs-stage, .hs-sky, [aria-hidden="true"]';
  function surfaces() {
    var out = [], vw = root.clientWidth, minY = headerBottom() + H + 24, maxY = innerHeight - 56;
    document.querySelectorAll('body *').forEach(function (n) {
      var text = TEXT.test(n.tagName);
      if (!text && !BOX.test(n.tagName)) return;
      var r = n.getBoundingClientRect();
      if (r.bottom < minY || r.top > maxY || r.width < 100 || n.closest(SKIP)) return;
      var y, x0, x1;
      if (text) {
        var line = firstLine(n);
        if (!line) return;
        y = line.top + line.height * 0.41;                             // ≈ gemenernas överkant
        x0 = line.left; x1 = line.right;
      } else {
        if (r.height < 60 || r.width > vw * 0.96) return;
        y = r.top; x0 = r.left + 6; x1 = r.right - 6;
      }
      x0 = Math.max(x0, 8); x1 = Math.min(x1, vw - 8);
      if (y < minY || y > maxY || x1 - x0 < W + 16) return;
      var cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || +cs.opacity < 0.6) return;
      if (!text && !looksSolid(n, cs)) return;                         // osynliga omslag är inget att stå på
      var hit = document.elementFromPoint((x0 + x1) / 2, y + (text ? 2 : 6));
      if (!hit || !n.contains(hit)) return;                             // något annat ligger ovanpå
      for (var p = n; p && p !== document.body; p = p.parentElement) {   // inte på cookie-rutor, menyer o.d. som ligger fast
        if (/fixed|sticky/.test(getComputedStyle(p).position)) return;
      }
      if (out.some(function (q) { return Math.abs(q.y - y) < 6 && Math.abs(q.x0 - x0) < 24; })) return; // bild i figur o.d.
      out.push({
        el: n, box: !text, r: r, y: y, x0: x0, x1: x1,
        Y: y + scrollY, X0: x0 + scrollX, X1: x1 + scrollX, B: r.bottom + scrollY
      });
    });
    return out;
  }
  // Rubrikens första textrad (bara texten, inte blockets bredd)
  function firstLine(n) {
    var tw = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), t, line = null, rg = document.createRange();
    while ((t = tw.nextNode())) {
      if (!t.nodeValue.trim()) continue;
      rg.selectNodeContents(t);
      var rs = rg.getClientRects();
      for (var i = 0; i < rs.length; i++) {
        var q = rs[i];
        if (q.width < 2) continue;
        if (!line) line = { top: q.top, height: q.height, left: q.left, right: q.right };
        else if (Math.abs(q.top - line.top) < line.height * 0.5) { line.left = Math.min(line.left, q.left); line.right = Math.max(line.right, q.right); }
        else return line;
      }
    }
    return line;
  }
  // En box syns som en yta om den är en bild/video eller har bakgrund, kant eller skugga
  function looksSolid(n, cs) {
    if (/^(IMG|PICTURE|VIDEO)$/.test(n.tagName) || n.querySelector(':scope > img:only-child, :scope > picture:only-child')) return true;
    var bg = cs.backgroundColor.match(/[\d.]+/g);
    return (bg && (bg.length < 4 || +bg[3] > 0.15)) && cs.backgroundColor !== 'transparent' ||
      cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
  }
  function spot(s, w) { return rand(s.X0 + 4, Math.max(s.X0 + 4, s.X1 - (w || W) - 4)); }

  // =====================================================================================================
  // Varianter på skärmen
  // =====================================================================================================

  // Tittar upp från nederkanten och vinkar – eller letar med förstoringsglas
  async function peek(search) {
    var vw = root.clientWidth, boxW = W + (search ? 64 : 20), boxH = H + 8;
    var x = Math.round(rand(12, Math.max(12, vw - boxW - 12)));
    var box = el('cb-clip');
    box.style.cssText = 'left:' + x + 'px;top:' + (floorFor(x, x + boxW) - boxH) + 'px;width:' + boxW + 'px;height:' + boxH + 'px;';
    var g = guy(box), up = boxH - H * 0.6;
    g.gx.style.transform = tr(10, 0);
    if (search) svgIn(g.fig, '.hs-arm-r', '<g class="cb-lens"><line x1="0" y1="13" x2="0" y2="17"/><circle cx="0" cy="21.5" r="4.5"/></g>');
    await wait(anim(g.gy, [{ transform: tr(0, boxH) }, { transform: tr(0, up) }], { duration: 750, easing: EASE, fill: 'forwards' }));
    if (over) return;
    await sleep(450);
    if (search) {
      g.fig.classList.add('cb-lens-on');
      await sleep(450);
      g.fig.classList.add('cb-scan');
      await wait(anim(g.gx, [
        { transform: tr(10, 0) }, { transform: tr(boxW - W - 6, 0), offset: 0.5 }, { transform: tr(10, 0) }
      ], { duration: 3600, easing: 'ease-in-out', fill: 'forwards' }));
      if (over) return;
      g.fig.classList.remove('cb-scan', 'cb-lens-on');
      await sleep(450);
    } else {
      await wave(g.fig, 1500);
      await sleep(350);
    }
    if (over) return;
    await wait(anim(g.gy, [{ transform: tr(0, up) }, { transform: tr(0, boxH) }], { duration: 520, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'forwards' }));
  }

  // Lutar sig in från vänster- eller högerkanten, vinkar och drar sig tillbaka
  async function side() {
    var vw = root.clientWidth, left = Math.random() < 0.5, boxW = W + 24, boxH = H + 30;
    var top = Math.round(rand(headerBottom() + 40, Math.max(headerBottom() + 41, innerHeight - boxH - 70)));
    var box = el('cb-clip');
    box.style.cssText = 'left:' + (left ? 0 : vw - boxW) + 'px;top:' + top + 'px;width:' + boxW + 'px;height:' + boxH + 'px;';
    var g = guy(box), ty = boxH - H - 2;
    var out = left ? -W - 4 : boxW, inX = left ? -W * 0.18 : boxW - W * 0.82, lean = left ? 'rotate(18deg)' : 'rotate(-18deg)';
    face(g.fig, !left);                                                  // tittar in mot sidan
    g.gy.style.transformOrigin = (W / 2) + 'px ' + H + 'px';             // lutar kring fötterna
    anim(g.gx, [{ transform: tr(out, 0) }, { transform: tr(inX, 0) }], { duration: 700, easing: EASE, fill: 'forwards' });
    await wait(anim(g.gy, [{ transform: tr(0, ty) }, { transform: tr(0, ty, lean) }], { duration: 700, easing: EASE, fill: 'forwards' }));
    if (over) return;
    await sleep(450);
    await wave(g.fig, 1300);
    await sleep(500);
    if (over) return;
    anim(g.gx, [{ transform: tr(inX, 0) }, { transform: tr(out, 0) }], { duration: 480, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'forwards' });
    await wait(anim(g.gy, [{ transform: tr(0, ty, lean) }, { transform: tr(0, ty) }], { duration: 480, easing: 'ease-in', fill: 'forwards' }));
  }

  // Promenerar in längs nederkanten från ena sidan, ser sig om och vinkar – eller tar en bild med blixt
  async function walk(camera) {
    var vw = root.clientWidth, fromLeft = Math.random() < 0.5, span = rand(80, Math.max(90, Math.min(vw * 0.35, 380)));
    var x0 = fromLeft ? -W - 8 : vw + 8, xEnd = fromLeft ? span : vw - span - W;
    var g = guy(), ms = walkMs(xEnd - x0);
    g.gy.style.transform = tr(0, floorFor(Math.min(x0, xEnd), Math.max(x0, xEnd) + W) - H + 1);
    face(g.fig, !fromLeft);
    await walkTo(g, x0, xEnd, ms);
    if (over) return;
    await sleep(500);
    if (over) return;
    if (camera) {
      var flash = svgIn(g.fig, '.hs-body', '<g class="cb-cam"><rect x="26" y="5" width="11" height="8" rx="1.6"/><rect x="28" y="3.3" width="3.6" height="2"/><circle cx="31.5" cy="9" r="2.3"/><circle class="cb-flash" cx="29.8" cy="3.4" r="5"/></g>').lastChild;
      g.fig.classList.add('cb-shoot');
      await sleep(750);
      if (over) return;
      anim(flash, [
        { opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.5)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.9)' }
      ], { duration: 420, easing: 'ease-out' });
      await sleep(1100);
      g.fig.classList.remove('cb-shoot');
      await sleep(500);
    } else {
      face(g.fig, fromLeft);                                             // ser sig om
      await sleep(700);
      face(g.fig, !fromLeft);
      await sleep(450);
      await wave(g.fig, 1300);
      await sleep(350);
    }
    if (over) return;
    face(g.fig, fromLeft);
    await walkTo(g, xEnd, x0, ms);
  }

  // Svävar långsamt upp genom bilden med en ballong
  async function balloon() {
    var vw = root.clientWidth, x = Math.round(rand(0.05, 0.85) * vw), g = guy();
    pose(g.fig, 'cb-float');
    g.gy.style.position = 'relative';
    var b = el('cb-balloon', g.gy);                                      // snöret slutar i höger hand, (23.6, 4.5) i figuren
    b.innerHTML = '<i></i><svg viewBox="0 0 2 22" preserveAspectRatio="none"><path d="M1 0C2 7 0 14 1 22"/></svg>';
    b.style.left = (23.6 * k - 13) + 'px';
    b.style.bottom = (H - 4.5 * k) + 'px';
    b.style.setProperty('--cb-balloon', pick(['#F58BA6', '#146EF5', '#FFC83D']));
    var D = small ? 6000 : 7000;
    anim(g.gx, [
      { transform: tr(x, 0) }, { transform: tr(x + 16, 0), offset: 0.25 }, { transform: tr(x - 6, 0), offset: 0.5 },
      { transform: tr(x + 14, 0), offset: 0.75 }, { transform: tr(x, 0) }
    ], { duration: D, easing: 'ease-in-out', fill: 'forwards' });
    await wait(anim(g.gy, [{ transform: tr(0, innerHeight + 10) }, { transform: tr(0, -H - 90) }], { duration: D, easing: 'cubic-bezier(0.35,0,0.65,1)', fill: 'forwards' }));
  }

  // Seglar ner med ett paraply, och en vindpust tar honom åt sidan
  async function umbrella() {
    var vw = root.clientWidth, x = Math.round(rand(0.08, 0.85) * vw), g = guy();
    var yEnd = rand(innerHeight * 0.32, innerHeight * 0.58), dir = x < vw / 2 ? 1 : -1;
    pose(g.fig, 'cb-float');
    g.gy.style.position = 'relative';
    g.gy.style.transformOrigin = '50% 0';
    var u = el('cb-umbrella', g.gy);                                     // skaftet (x 22, y 34) i höger hand
    u.innerHTML = '<svg viewBox="0 0 44 40"><path class="cb-canopy" d="M2 16C6 3 38 3 42 16C38 13 33.5 13 29.5 16C26 13 18 13 14.5 16C10.5 13 6 13 2 16Z"/><path class="cb-shaft" d="M22 6V36C22 39.5 17.5 39.5 17.5 36"/></svg>';
    u.style.left = (23.6 * k - 22) + 'px';
    u.style.top = (4.5 * k - 34) + 'px';
    var D = 3600;
    anim(g.gx, [
      { transform: tr(x, 0) }, { transform: tr(x + 14, 0), offset: 0.3 }, { transform: tr(x - 10, 0), offset: 0.65 }, { transform: tr(x, 0) }
    ], { duration: D, easing: 'ease-in-out', fill: 'forwards' });
    await wait(anim(g.gy, [{ transform: tr(0, -H - 70) }, { transform: tr(0, yEnd) }], { duration: D, easing: 'cubic-bezier(0.25,0.1,0.35,1)', fill: 'forwards' }));
    if (over) return;
    g.fig.classList.add('cb-dangle');
    await sleep(900);
    if (over) return;
    anim(g.gx, [{ transform: tr(x, 0) }, { transform: tr(x + dir * vw * 0.45, 0) }], { duration: 1700, easing: 'cubic-bezier(0.5,0,0.8,0.6)', fill: 'forwards' });
    await wait(anim(g.gy, [
      { transform: tr(0, yEnd, 'rotate(0deg)'), opacity: 1 },
      { transform: tr(0, yEnd - 30, 'rotate(' + dir * 12 + 'deg)'), opacity: 1, offset: 0.4 },
      { transform: tr(0, yEnd - 90, 'rotate(' + dir * 18 + 'deg)'), opacity: 0 }
    ], { duration: 1700, easing: 'ease-in', fill: 'forwards' }));
  }

  // Ett litet moln driver förbi: han sover på det (doze) eller åker och vinkar (flyby)
  async function cloudRide(sleepy) {
    var CW = small ? 80 : 96, vw = root.clientWidth, dir = Math.random() < 0.5 ? 1 : -1;
    var cloud = makeCloud(CW);
    layer.appendChild(cloud);
    var bob = cloud.firstChild;
    bob.classList.add('is-bobbing');
    var g = guy(bob);
    seatOn(CW, g);
    face(g.fig, dir < 0);
    pose(g.fig, 'hs-sit', sleepy ? 'cb-doze' : '');
    if (sleepy) {
      var z = el('cb-zzz', bob);
      z.innerHTML = '<i>z</i><i>z</i><i>z</i>';
      z.style.left = (CW * 0.5 + W * 0.3) + 'px';
      z.style.top = (CW / 2 * 0.48 - HIP) + 'px';
    }
    var y = rand(headerBottom() + 20, innerHeight * 0.6), from = dir > 0 ? -CW - 20 : vw + 20, to = dir > 0 ? vw + 20 : -CW - 20;
    var D = (vw + CW + 40) / (sleepy ? 0.13 : 0.22);
    if (!sleepy) { later(function () { g.fig.classList.add('hs-wave'); }, D * 0.3); later(function () { g.fig.classList.remove('hs-wave'); }, D * 0.62); }
    await wait(anim(cloud, [
      { transform: tr(from, y), opacity: 0 },
      { opacity: 1, offset: 0.05 },
      { transform: tr((from + to) / 2, y + (sleepy ? 10 : -40)), offset: 0.5 },
      { opacity: 1, offset: 0.95 },
      { transform: tr(to, y + (sleepy ? 18 : 0)), opacity: 0 }
    ], { duration: D, easing: 'linear', fill: 'forwards' }));
  }

  // Kommer upp på ett moln från nederkanten, läser, vänder blad, vinkar och sjunker undan
  async function read() {
    var CW = small ? 84 : 100, vw = root.clientWidth, x = Math.round(rand(10, Math.max(10, vw - CW - 10)));
    var cloud = makeCloud(CW);
    layer.appendChild(cloud);
    var bob = cloud.firstChild, g = guy(bob);
    seatOn(CW, g);
    pose(g.fig, 'hs-sit');
    var page = svgIn(g.fig, '.hs-body', '<g class="cb-book"><path d="M29 10.5L35 12L41 10.5L41 17.5L35 19L29 17.5Z"/><path class="cb-page" d="M35 12L40 10.8L40 17.2L35 18.4Z"/><line x1="35" y1="12" x2="35" y2="19"/></g>').querySelector('.cb-page');
    var yUp = floorFor(x, x + CW) - CW / 2 - 12, yDown = innerHeight + 30;
    await wait(anim(cloud, [{ transform: tr(x, yDown) }, { transform: tr(x, yUp) }], { duration: 1200, easing: EASE, fill: 'forwards' }));
    if (over) return;
    bob.classList.add('is-bobbing');
    g.fig.classList.add('cb-reading');
    await sleep(2600);
    if (over) return;
    anim(page, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }], { duration: 480, easing: 'ease-in-out' });
    await sleep(2200);
    if (over) return;
    g.fig.classList.remove('cb-reading');
    await sleep(400);
    await wave(g.fig, 1200);
    await sleep(300);
    if (over) return;
    await wait(anim(cloud, [{ transform: tr(x, yUp) }, { transform: tr(x, yDown) }], { duration: 900, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'forwards' }));
  }

  // =====================================================================================================
  // Varianter på sidan: s = en yta (rubrik eller bild/kort) som syns just nu
  // =====================================================================================================

  // Hoppar ner och sätter sig, dinglar med benen, vinkar och hoppar iväg (på en rubrik vid radens slut)
  async function sit(s) {
    onPage(s);
    var x = s.box ? spot(s) : Math.max(s.X0, s.X1 - W * 0.9), y = s.Y + 1 - HIP, g = guy();
    await land(g, x, y, 'hs-sit');
    if (over) return;
    g.fig.classList.add('cb-swing');
    await sleep(rand(2200, 3200));
    if (over) return;
    await wave(g.fig, 1300);
    await sleep(600);
    await hopOff(g, x, y, pick([-30, 30]));
  }

  // Landar och promenerar längs kanten, ser sig om och hoppar av
  async function stroll(s) {
    onPage(s);
    var dir = Math.random() < 0.5 ? 1 : -1, len = Math.min(s.X1 - s.X0 - W - 8, rand(160, 380));
    var a = s.X0 + 4 + rand(0, Math.max(0, s.X1 - s.X0 - W - 8 - len));
    var from = dir > 0 ? a : a + len, to = dir > 0 ? a + len : a, y = s.Y - H + 1, g = guy();
    face(g.fig, dir < 0);
    await land(g, from, y);
    await sleep(250);
    if (over) return;
    await walkTo(g, from, to);
    if (over) return;
    await sleep(300);
    face(g.fig, dir > 0);
    await sleep(650);
    face(g.fig, dir < 0);
    await sleep(300);
    await hopOff(g, to, y, 34 * dir);
  }

  // Bakåtvolt, ta-da, och iväg
  async function flip(s) {
    onPage(s);
    var x = spot(s), y = s.Y - H + 1, g = guy();
    await land(g, x, y);
    await sleep(350);
    if (over) return;
    pose(g.fig, 'hs-crouch');
    await sleep(220);
    if (over) return;
    pose(g.fig, 'hs-air');
    g.gy.style.transformOrigin = (W / 2) + 'px ' + (H / 2) + 'px';
    later(function () { pose(g.fig, 'cb-tuck'); }, 120);
    later(function () { pose(g.fig, 'hs-air'); }, 560);
    await wait(anim(g.gy, [
      { transform: tr(0, y, 'rotate(0deg)'), easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(0, y - 56, 'rotate(-180deg)'), offset: 0.5, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
      { transform: tr(0, y, 'rotate(-360deg)') }
    ], { duration: 780, fill: 'forwards' }));
    if (over) return;
    pose(g.fig, 'hs-crouch');
    await sleep(180);
    pose(g.fig);
    await tada(g.fig, 1100);
    await sleep(250);
    await hopOff(g, x, y, pick([-30, 30]));
  }

  // Sitter vid kanten och fiskar: linan ner, flötet guppar, napp – och upp kommer en liten fisk
  async function fish(s) {
    var vwR = scrollX + root.clientWidth - 10, x = s.X1 - W * 0.55, left = false;
    if (x + 49.4 * k > vwR) { x = s.X0 - W * 0.45; left = true; }      // ingen plats till höger: fiskar åt vänster
    var tipX = x + (left ? -9.4 : 49.4) * k;                            // spöets topp (armen roterad -120°, spö 35 långt)
    if (tipX < scrollX + 10 || tipX > vwR) return sit(s);
    onPage(s);
    var y = s.Y + 1 - HIP, tipY = y + 0.5 * k, L = rand(60, 110), g = guy();
    face(g.fig, left);
    svgIn(g.fig, '.hs-arm-r', '<line class="cb-rodline" x1="0" y1="11" x2="0" y2="35"/>');
    await land(g, x, y, 'hs-sit');
    if (over) return;
    g.fig.classList.add('cb-rod');
    await sleep(550);
    if (over) return;
    var line = el('cb-fishline'), bob = el('cb-bobber'), catchy = el('cb-fish', bob);
    line.style.cssText = 'left:' + (tipX - 0.5) + 'px;top:' + tipY + 'px;height:' + L + 'px;';
    bob.style.cssText = 'left:' + (tipX - 3) + 'px;top:' + (tipY - 3) + 'px;';
    if (left) catchy.style.transform = 'scaleX(-1)';
    anim(line, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
    await wait(anim(bob, [{ transform: tr(0, 0) }, { transform: tr(0, L) }], { duration: 700, easing: 'ease-out', fill: 'forwards' }));
    if (over) return;
    g.fig.classList.add('cb-swing');
    await wait(anim(bob, [{ transform: tr(0, L) }, { transform: tr(0, L + 3) }], { duration: 650, direction: 'alternate', iterations: 4, easing: 'ease-in-out' }));
    if (over) return;
    catchy.classList.add('on');                                         // napp!
    await wait(anim(bob, [{ transform: tr(0, L) }, { transform: tr(0, L + 12), offset: 0.3 }, { transform: tr(0, L - 3) }], { duration: 380, easing: 'ease-out' }));
    if (over) return;
    g.fig.classList.remove('cb-swing');
    g.fig.classList.add('cb-reel');
    anim(line, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    await wait(anim(bob, [{ transform: tr(0, L) }, { transform: tr(0, 0) }], { duration: 650, easing: 'ease-in', fill: 'forwards' }));
    if (over) return;
    await sleep(700);
    anim(bob, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    pose(g.fig, 'hs-sit');
    await tada(g.fig, 900);
    await hopOff(g, x, y, left ? 30 : -30);
  }

  // Jonglerar med tre bollar
  async function juggle(s) {
    onPage(s);
    var x = spot(s), y = s.Y - H + 1, g = guy();
    await land(g, x, y);
    await sleep(300);
    if (over) return;
    g.fig.classList.add('cb-juggle');
    var L = [x + 29 * k, y + 26 * k], R = [x + 38 * k, y + 24 * k], P = [x + 33.5 * k, y - 8];
    var balls = ['#146EF5', '#FFC83D', '#F58BA6'].map(function (c, i) {
      var b = el('cb-ball');
      b.style.background = c;
      anim(b, [
        { transform: tr(L[0], L[1]), easing: 'ease-out' },
        { transform: tr(P[0], P[1]), offset: 0.42, easing: 'ease-in' },
        { transform: tr(R[0], R[1]), offset: 0.78 },
        { transform: tr(L[0], L[1]) }
      ], { duration: 1050, iterations: Infinity, delay: -i * 350 });
      return b;
    });
    await sleep(rand(3000, 4200));
    if (over) return;
    balls.forEach(function (b) { anim(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }); });
    pose(g.fig);
    await sleep(200);
    await tada(g.fig, 900);
    await hopOff(g, x, y, pick([-30, 30]));
  }

  // Dansar en stund, med noter som stiger
  async function dance(s) {
    onPage(s);
    var x = spot(s), y = s.Y - H + 1, g = guy();
    await land(g, x, y);
    await sleep(250);
    if (over) return;
    g.fig.classList.add('cb-dance');
    var n = el('cb-notes');
    n.innerHTML = '<i>♪</i><i>♫</i><i>♪</i>';
    n.style.left = (x + W * 0.7) + 'px';
    n.style.top = (y + 2) + 'px';
    later(function () { face(g.fig, true); }, 1500);
    later(function () { face(g.fig, false); }, 2300);
    await sleep(3100);
    if (over) return;
    n.remove();
    pose(g.fig);
    await tada(g.fig, 800);
    await hopOff(g, x, y, pick([-30, 30]));
  }

  // Säger något i en pratbubbla och vinkar
  async function say(s) {
    onPage(s);
    var x = spot(s), y = s.Y - H + 1, g = guy();
    await land(g, x, y);
    await sleep(250);
    if (over) return;
    var b = el('cb-say');
    b.textContent = pick(PHRASES);
    var bw = b.offsetWidth, right = x + W * 0.7 + bw < scrollX + root.clientWidth - 8;
    b.classList.toggle('is-left', !right);
    b.style.left = (right ? x + W * 0.7 : x + W * 0.3 - bw) + 'px';
    b.style.top = (y - b.offsetHeight - 4) + 'px';
    anim(b, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });
    await wave(g.fig, 1700);
    await sleep(500);
    if (over) return;
    await wait(anim(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }));
    await hopOff(g, x, y, right ? -30 : 30);
  }

  // Kastar ett pappersflygplan som glider iväg över sidan
  async function plane(s) {
    onPage(s);
    var x = spot(s), y = s.Y - H + 1, dir = x - scrollX < root.clientWidth / 2 ? 1 : -1, g = guy();
    face(g.fig, dir < 0);
    await land(g, x, y);
    await sleep(350);
    if (over) return;
    g.fig.classList.add('cb-windup');
    await sleep(420);
    if (over) return;
    g.fig.classList.remove('cb-windup');
    g.fig.classList.add('cb-throw');
    var p = el('cb-plane');
    p.innerHTML = '<svg viewBox="0 0 22 12"><path d="M0 6L22 0L9 7.5Z" fill="#fff"/><path d="M9 7.5L22 0L11 12Z" fill="#DCE6F5"/><path d="M0 6L22 0L9 7.5L11 12L22 0" fill="none" stroke="#0F172A" stroke-width="1" stroke-linejoin="round"/></svg>';
    var hx = x + (dir > 0 ? 32 : 8) * k, hy = y + 8 * k, dx = dir * Math.min(root.clientWidth * 0.55, 560), f = ' scaleX(' + dir + ')';
    anim(p, [
      { transform: tr(hx, hy) + f + ' rotate(-14deg)', opacity: 1 },
      { transform: tr(hx + dx * 0.35, hy - 64) + f + ' rotate(-4deg)', offset: 0.35 },
      { transform: tr(hx + dx * 0.7, hy - 44) + f + ' rotate(8deg)', opacity: 1, offset: 0.72 },
      { transform: tr(hx + dx, hy + 8) + f + ' rotate(16deg)', opacity: 0 }
    ], { duration: 2600, easing: 'cubic-bezier(0.25,0.6,0.4,1)', fill: 'forwards' });
    await sleep(700);
    g.fig.classList.remove('cb-throw');
    await sleep(500);
    await wave(g.fig, 1200);
    await sleep(300);
    await hopOff(g, x, y, -30 * dir);
  }

  // Åker skateboard längs kanten, gör en ollie och rullar vidare ut
  async function skate(s) {
    onPage(s);
    var dir = Math.random() < 0.5 ? 1 : -1, len = Math.min(s.X1 - s.X0 - W - 10, 440);
    var a = s.X0 + 4, from = dir > 0 ? a : a + len, to = dir > 0 ? a + len : a, y = s.Y - H - 4, g = guy();
    face(g.fig, dir < 0);
    g.gy.style.position = 'relative';
    var board = el('cb-board', g.gy);
    board.style.cssText = 'left:-4px;top:' + (H - 1) + 'px;width:' + (W + 8) + 'px;';
    await land(g, from, y, 'cb-skate');
    await sleep(250);
    if (over) return;
    var D = Math.max(1200, len / 0.24);
    later(function () {
      anim(g.gy, [
        { transform: tr(0, y), easing: 'ease-out' }, { transform: tr(0, y - 22), offset: 0.5, easing: 'ease-in' }, { transform: tr(0, y) }
      ], { duration: 440, fill: 'forwards' });
    }, D * 0.55);
    await wait(anim(g.gx, [{ transform: tr(from, 0) }, { transform: tr(to, 0) }], { duration: D, easing: 'cubic-bezier(0.45,0,0.55,1)', fill: 'forwards' }));
    if (over) return;
    anim(g.gx, [{ transform: tr(to, 0) }, { transform: tr(to + dir * 60, 0) }], { duration: 450, easing: 'ease-out', fill: 'forwards' });
    await wait(anim(g.gy, [{ transform: tr(0, y), opacity: 1 }, { transform: tr(0, y), opacity: 0 }], { duration: 450, fill: 'forwards' }));
  }

  // Kikar fram bakom en bild/ett kort, ser sig om och dyker ner igen
  async function peekover(s) {
    onPage(s);
    var x = spot(s, W + 8), clipH = Math.round(H * 0.62);
    var box = el('cb-clip');
    box.style.cssText = 'left:' + (x - 8) + 'px;top:' + (s.Y - clipH) + 'px;width:' + (W + 16) + 'px;height:' + clipH + 'px;';
    var g = guy(box), up = clipH - H * 0.5;
    g.gx.style.transform = tr(8, 0);
    await wait(anim(g.gy, [{ transform: tr(0, clipH) }, { transform: tr(0, up) }], { duration: 520, easing: EASE, fill: 'forwards' }));
    if (over) return;
    await sleep(400);
    face(g.fig, true);
    await sleep(650);
    face(g.fig, false);
    await sleep(500);
    if (Math.random() < 0.6) await wave(g.fig, 1100);
    await sleep(250);
    if (over) return;
    await wait(anim(g.gy, [{ transform: tr(0, up) }, { transform: tr(0, clipH) }], { duration: 380, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'forwards' }));
  }

  // Hänger i underkanten av en bild/ett kort, svingar, sparkar med benen och släpper
  async function hangon(s) {
    onPage(s);
    var HY = 1.8 * k, x = spot(s), y = s.B - HY, g = guy();
    g.gx.style.transform = tr(x, 0);
    g.gy.style.transformOrigin = (W / 2) + 'px ' + HY + 'px';
    pose(g.fig, 'cb-hang');
    await wait(anim(g.gy, [
      { transform: tr(0, y, 'rotate(-28deg)'), opacity: 0 },
      { transform: tr(0, y, 'rotate(20deg)'), opacity: 1, offset: 0.3 },
      { transform: tr(0, y, 'rotate(-11deg)'), offset: 0.55 },
      { transform: tr(0, y, 'rotate(5deg)'), offset: 0.78 },
      { transform: tr(0, y, 'rotate(0deg)') }
    ], { duration: 2200, easing: 'ease-in-out', fill: 'forwards' }));
    if (over) return;
    g.fig.classList.add('cb-dangle');
    await sleep(1700);
    if (over) return;
    pose(g.fig, 'hs-air');
    await wait(anim(g.gy, [
      { transform: tr(0, y, 'rotate(0deg)'), opacity: 1 }, { transform: tr(0, y + 70, 'rotate(0deg)'), opacity: 0 }
    ], { duration: 600, easing: 'cubic-bezier(0.5,0,0.9,0.5)', fill: 'forwards' }));
  }

  // Målar en blå rand längs överkanten med en färgroller
  async function paint(s) {
    onPage(s);
    var len = Math.min(s.X1 - s.X0 - W - 40, rand(160, 340));
    var x0 = s.X0 + 4 + rand(0, Math.max(0, s.X1 - s.X0 - W - 40 - len)), y = s.Y - H + 1, g = guy();
    svgIn(g.fig, '.hs-body', '<g class="cb-roller"><line x1="29" y1="29" x2="37" y2="54"/><rect x="33" y="53.5" width="9" height="4.5" rx="1.6"/></g>');
    await land(g, x0, y);
    if (over) return;
    g.fig.classList.add('cb-roll');
    await sleep(400);
    if (over) return;
    var ms = walkMs(len), stripe = el('cb-paint');
    stripe.style.cssText = 'left:' + (x0 + 37.5 * k) + 'px;top:' + (s.Y - 2) + 'px;width:' + len + 'px;';
    anim(stripe, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
    await walkTo(g, x0, x0 + len, ms);
    if (over) return;
    await sleep(300);
    face(g.fig, true);                                                   // beundrar resultatet
    await sleep(800);
    face(g.fig, false);
    g.fig.classList.remove('cb-roll');
    await tada(g.fig, 900);
    anim(stripe, [{ opacity: 1 }, { opacity: 0 }], { duration: 1200, delay: 400, fill: 'forwards' });
    await hopOff(g, x0 + len, y, 30);
  }

  // Trixar med en fotboll: bollen studsar ner, tre tillslag med foten, en rejäl spark – bollen far iväg över sidan
  async function soccer(s) {
    onPage(s);
    var x = spot(s, W + 14), y = s.Y - H + 1, dir = x - scrollX < root.clientWidth / 2 ? 1 : -1, g = guy();
    var R = 5.5, bx = x + (dir > 0 ? 34 : 6) * k - R, ground = s.Y - 2 * R;  // bollens vänstra överkant när den ligger vid foten
    face(g.fig, dir < 0);
    await land(g, x, y);
    if (over) return;
    var ball = el('cb-soccer');
    ball.innerHTML = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#fff" stroke="#0F172A" stroke-width="1.6"/><path d="M10 6.2l3.6 2.6-1.4 4.2H7.8L6.4 8.8Z" fill="#0F172A"/><path d="M10 1.4v4.8M13.6 8.8l4.6-1.5M12.2 13l2.8 3.9M7.8 13L5 16.9M6.4 8.8L1.8 7.3" fill="none" stroke="#0F172A" stroke-width="1.2"/></svg>';
    // Bollen studsar ner framför honom
    await wait(anim(ball, [
      { transform: tr(bx, ground - 80) + ' rotate(0deg)', opacity: 0, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(bx, ground) + ' rotate(90deg)', opacity: 1, offset: 0.45, easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(bx, ground - 22) + ' rotate(140deg)', offset: 0.68, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(bx, ground) + ' rotate(180deg)', offset: 0.86, easing: 'ease-out' },
      { transform: tr(bx, ground - 5) + ' rotate(190deg)', offset: 0.93, easing: 'ease-in' },
      { transform: tr(bx, ground) + ' rotate(200deg)' }
    ], { duration: 900, fill: 'forwards' }));
    if (over) return;
    await sleep(300);
    // Tre tillslag: foten upp, bollen upp och ner
    for (var i = 0; i < 3; i++) {
      if (over) return;
      g.fig.classList.add('cb-toe');
      later(function () { g.fig.classList.remove('cb-toe'); }, 200);
      await wait(anim(ball, [
        { transform: tr(bx, ground) + ' rotate(' + (200 + i * 120) + 'deg)', easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
        { transform: tr(bx, ground - 30 - i * 6) + ' rotate(' + (260 + i * 120) + 'deg)', offset: 0.5, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
        { transform: tr(bx, ground) + ' rotate(' + (320 + i * 120) + 'deg)' }
      ], { duration: 520, fill: 'forwards' }));
    }
    if (over) return;
    // Sats … och spark
    g.fig.classList.add('cb-legback');
    await sleep(320);
    if (over) return;
    g.fig.classList.remove('cb-legback');
    g.fig.classList.add('cb-kick');
    var dx = dir * Math.min(root.clientWidth * 0.5, 520);
    anim(ball, [
      { transform: tr(bx, ground) + ' rotate(560deg)', opacity: 1, easing: 'cubic-bezier(0.2,0.7,0.5,1)' },
      { transform: tr(bx + dx * 0.5, ground - 120) + ' rotate(' + (560 + dir * 540) + 'deg)', opacity: 1, offset: 0.45, easing: 'cubic-bezier(0.5,0,0.9,0.6)' },
      { opacity: 1, offset: 0.8 },
      { transform: tr(bx + dx, ground + 30) + ' rotate(' + (560 + dir * 1080) + 'deg)', opacity: 0 }
    ], { duration: 1500, fill: 'forwards' });
    await sleep(450);
    if (over) return;
    g.fig.classList.remove('cb-kick');
    await sleep(500);
    await tada(g.fig, 1000);
    await hopOff(g, x, y, -30 * dir);
  }

  // Sällsynt: hoppar ner med en pratbubbla "Följ oss på Instagram!" som går att klicka på. Bubblan stannar kvar så länge
  // muspekaren är på den. Klicket mäts via analytics.js (bara med samtycke).
  async function insta(s) {
    onPage(s);
    instaDone = true;
    try { sessionStorage.setItem('cb-insta', views); } catch (e) {}
    var x = spot(s), y = s.Y - H + 1, g = guy();
    await land(g, x, y);
    await sleep(250);
    if (over) return;
    var b = document.createElement('a');
    b.className = 'cb-say cb-insta';
    b.href = INSTA.url;
    b.target = '_blank';
    b.rel = 'noopener';
    b.tabIndex = -1;                                                     // dekorativ genväg; länken finns även i sidfoten
    b.innerHTML = '<span>Följ oss på Instagram!</span><b><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle class="cb-dot" cx="17.3" cy="6.7" r="1.1"/></svg>@studioklaro</b>';
    layer.appendChild(b);
    var hover = false, clicked = false;
    b.addEventListener('pointerenter', function () { hover = true; });
    b.addEventListener('pointerleave', function () { hover = false; });
    b.addEventListener('click', function () {
      clicked = true;
      if (window.klaroTrackEvent) window.klaroTrackEvent('cloud_instagram_click', { page: path });
    });
    var bw = b.offsetWidth, right = x + W * 0.7 + bw < scrollX + root.clientWidth - 8;
    b.classList.toggle('is-left', !right);
    b.style.left = (right ? x + W * 0.7 : x + W * 0.3 - bw) + 'px';
    b.style.top = (y - b.offsetHeight - 4) + 'px';
    anim(b, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });
    g.fig.classList.add('cb-point');                                     // pekar upp mot bubblan
    await sleep(900);
    if (over) return;
    g.fig.classList.remove('cb-point');
    await wave(g.fig, 1400);
    // Kvar minst ~5 s, längre så länge pekaren är på bubblan (högst 20 s)
    for (var t = 0; (t < 3000 || hover) && t < 20000 && !clicked; t += 200) {
      await sleep(200);
      if (over) return;
    }
    if (clicked) await tada(g.fig, 800);
    await wait(anim(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }));
    b.remove();
    await hopOff(g, x, y, right ? -30 : 30);
  }

  // =====================================================================================================
  // Urval och schema
  // =====================================================================================================

  var RUN = {
    peek: function () { return peek(false); }, search: function () { return peek(true); }, side: side,
    walk: function () { return walk(false); }, photo: function () { return walk(true); }, balloon: balloon,
    umbrella: umbrella, doze: function () { return cloudRide(true); }, flyby: function () { return cloudRide(false); }, read: read,
    sit: sit, stroll: stroll, flip: flip, fish: fish, juggle: juggle, dance: dance, say: say, plane: plane, skate: skate,
    peekover: peekover, hangon: hangon, paint: paint, soccer: soccer, insta: insta
  };
  var SCREEN = ['peek', 'search', 'side', 'walk', 'photo', 'balloon', 'umbrella', 'doze', 'flyby', 'read'];
  // Syskon som liknar varandra för mycket för att komma direkt efter varandra
  var KIN = { walk: 'bottom', photo: 'bottom', peek: 'bottom', search: 'bottom', doze: 'cloud', flyby: 'cloud', read: 'cloud',
    balloon: 'float', umbrella: 'float', stroll: 'move', skate: 'move', paint: 'move' };
  // Vilka ytor varianterna på sidan kan använda
  var ANY = function () { return true; };
  var FITS = {
    sit: ANY, flip: ANY, fish: ANY, juggle: ANY, dance: ANY, say: ANY, plane: ANY,
    soccer: function (s) { return s.X1 - s.X0 > W + 40; },
    stroll: function (s) { return s.X1 - s.X0 > W + 120; },
    skate: function (s) { return s.X1 - s.X0 > 240; },
    peekover: function (s) { return s.box && s.X1 - s.X0 > W + 30; },
    hangon: function (s) { return s.box && s.r.bottom > headerBottom() + 40 && s.r.bottom < innerHeight - H - 40; },
    paint: function (s) { return s.box && s.X1 - s.X0 > W + 200; }
  };

  // Slumpar variant (sidan väger tyngre än skärmen) bland dem som får plats just nu och som han inte har gjort nyss
  function choose(screenOnly) {
    var S = screenOnly ? [] : surfaces(), opts = [];
    function add(kind, weight, c) {
      if (only && kind !== only) return;
      if (c && !c.length) return;
      opts.push({ k: kind, w: weight, c: c });
    }
    SCREEN.forEach(function (kind) { add(kind, 1, null); });
    Object.keys(FITS).forEach(function (kind) { add(kind, 2.4, S.filter(FITS[kind])); });
    // Instagram-bubblan: ibland, efter några andra framträdanden, och bara på en yta mitt på sidan
    var instaOk = only === 'insta' || (!only && !instaDone && views - instaAt >= INSTA.every && shown >= INSTA.after && Math.random() < INSTA.chance);
    if (instaOk && S.length) return { k: 'insta', s: pick(S) };
    if (!opts.length) return null;
    // Sidans egen variant kommer gärna först
    if (!shown && signature && recent.indexOf(signature) < 0 && Math.random() < 0.6) {
      var own = opts.filter(function (o) { return o.k === signature; })[0];
      if (own) return { k: own.k, s: own.c ? pick(own.c) : null };
    }
    var kin = KIN[recent[0]] || recent[0];                                 // inte heller ett syskon till den senaste
    var fresh = opts.filter(function (o) { return recent.indexOf(o.k) < 0 && (KIN[o.k] || o.k) !== kin; });
    if (fresh.length) opts = fresh;
    var sum = opts.reduce(function (t, o) { return t + o.w; }, 0), r = Math.random() * sum, o = opts[0];
    for (var i = 0; i < opts.length; i++) { r -= opts[i].w; if (r <= 0) { o = opts[i]; break; } }
    return { k: o.k, s: o.c ? pick(o.c) : null };
  }

  // Annat som pågår: hero-gubben, introt, öppen mobilmeny, sidövergång, ett formulär som används
  function blocked() {
    var a = document.activeElement;
    return document.hidden || root.classList.contains('mnav-active') || root.classList.contains('pt-hold') ||
      root.classList.contains('ki-play') || document.querySelector('.hs-stage, .hs-sky, .wz-dock.is-open') ||
      (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  }

  var lastScroll = 0, moved = 0, lastY = scrollY;
  addEventListener('scroll', function () {
    lastScroll = Date.now();
    moved += Math.abs(scrollY - lastY);
    lastY = scrollY;
  }, { passive: true });

  // Var 300:e ms: dags (pausen är slut, eller man har scrollat en bit)? Under pågående scroll bara varianter på skärmen.
  setInterval(function () {
    if (busy && document.querySelector('.hs-stage, .hs-sky')) stop();  // hero-gubben (startsidan) går före
    if (busy || shown >= MAX || blocked()) return;
    var now = Date.now();
    if (now < nextAt && !(moved > innerHeight * 0.6 && now - lastEnd > 800)) return;
    sizes();
    var c = choose(now - lastScroll < 300);
    if (!c) return;
    moved = 0;
    shown++;
    play(c.k, c.s);
  }, 300);

  if (force !== null) window.__cloud = { surfaces: function () { sizes(); return surfaces(); } };   // felsökning i testläget

  // Klick på loggan (startsidan: hero-gubben skriver i formuläret) – den här gubben går undan
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.sh-logo')) stop(); });
})();
