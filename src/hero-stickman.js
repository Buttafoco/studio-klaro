// Hero-gubben: en streckgubbe landar på hero-formulärets överkant, går längs den, hoppar upp på ett moln
// som glider in och flyger iväg sittande på det. Spelas en gång per sidvisning, efter KlaroIntro.
// Hoppas över vid reducerad rörelse eller om formuläret inte syns. Avbryts (tonas bort) om besökaren
// börjar använda formuläret eller ändrar fönsterbredden. Stil: src/hero-stickman.css.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var form = document.querySelector('.hc .hero-form');
  if (!form || !form.animate) return;

  var root = document.documentElement;
  var NS = 'http://www.w3.org/2000/svg';
  var EASE = 'cubic-bezier(0.22,1,0.36,1)';
  var stage = null, anims = [], timers = [], over = false, startW = 0;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function anim(node, frames, opts) { var a = node.animate(frames, opts); anims.push(a); return a; }
  function wait(a) { return new Promise(function (r) { a.onfinish = r; }); }
  function sleep(ms) { return new Promise(function (r) { later(r, ms); }); }

  function stop() {
    if (over) return;
    over = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('resize', onResize);
    form.removeEventListener('focusin', stop);
    form.removeEventListener('pointerdown', stop);
    if (!stage) return;
    var s = stage;
    s.classList.add('is-gone');
    setTimeout(function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); s.remove(); }, 350);
  }
  function onResize() { if (innerWidth !== startW) stop(); }

  // Gubben: viewBox 40×60, höft i (20,34), axlar i (20,18), fötter i y≈58
  function limb(x, y, cls, len, child) {
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    var r = document.createElementNS(NS, 'g');
    r.setAttribute('class', 'hs-limb ' + cls);
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 0); l.setAttribute('y1', 0); l.setAttribute('x2', 0); l.setAttribute('y2', len);
    r.appendChild(l);
    if (child) r.appendChild(child);
    g.appendChild(r);
    return g;
  }
  function makeFigure(h) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 40 60');
    svg.setAttribute('width', h * 40 / 60);
    svg.setAttribute('height', h);
    svg.setAttribute('class', 'hs-fig');
    var body = document.createElementNS(NS, 'g');
    body.setAttribute('class', 'hs-body');
    body.innerHTML = '<line x1="20" y1="15" x2="20" y2="34"/><circle class="hs-head" cx="21" cy="8.5" r="6"/>';
    // bakre arm/ben först (ritas bakom kroppen)
    body.insertBefore(limb(20, 18, 'hs-arm-l', 14), body.firstChild);
    body.insertBefore(limb(20, 34, 'hs-thigh-l', 12, limb(0, 12, 'hs-shin-l', 12)), body.firstChild);
    body.appendChild(limb(20, 34, 'hs-thigh-r', 12, limb(0, 12, 'hs-shin-r', 12)));
    body.appendChild(limb(20, 18, 'hs-arm-r', 14));
    svg.appendChild(body);
    return svg;
  }
  function makeCloud(w) {
    var c = document.createElement('div');
    c.className = 'hs-cloud';
    c.style.width = w + 'px';
    c.innerHTML = '<div class="hs-bob"><div class="hs-puff"><svg viewBox="0 0 200 100"><path d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/></svg></div></div>';
    return c;
  }
  function tr(x, y, extra) { return 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : ''); }

  async function play() {
    var card = form.querySelector('[data-wz-mount="hero"] .wz-prompt-card');
    if (!card || over) return;
    var fr = form.getBoundingClientRect(), cr = card.getBoundingClientRect();
    if (cr.top > innerHeight - 40 || cr.bottom < 60) return;   // formuläret syns inte: hoppa över

    var small = innerWidth < 600;
    var H = small ? 36 : 44, W = H * 40 / 60, HIP = H * 34 / 60;
    var CW = small ? 104 : 128, CH = CW / 2;
    var top = cr.top - fr.top, left = cr.left - fr.left, right = cr.right - fr.left;
    var groundY = top - H + 1;                                  // fötterna precis på kortets kant
    var x0 = left + (small ? 22 : 34);
    var cloudX = right - CW - (small ? 6 : 18), cloudY = top - CH - 8;
    var x1 = cloudX - W - (small ? 6 : 12);                     // där gubben stannar, framför molnet
    var seatX = cloudX + CW * 0.5 - W / 2, seatY = cloudY + CH * 0.48 - HIP;

    stage = document.createElement('div');
    stage.className = 'hs-stage';
    stage.setAttribute('aria-hidden', 'true');
    var gx = document.createElement('div'); gx.className = 'hs-x';
    var gy = document.createElement('div'); gy.className = 'hs-y';
    var fig = makeFigure(H);
    gy.appendChild(fig); gx.appendChild(gy);
    var cloud = makeCloud(CW), bob = cloud.firstChild;
    cloud.style.opacity = '0';
    stage.appendChild(cloud); stage.appendChild(gx);
    form.appendChild(stage);
    startW = innerWidth;
    window.addEventListener('resize', onResize);
    form.addEventListener('focusin', stop);
    form.addEventListener('pointerdown', stop);

    // 1. Landar på kanten
    gx.style.transform = tr(x0, 0);
    await wait(anim(gy, [
      { transform: tr(0, groundY - 46), opacity: 0, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(0, groundY), opacity: 1, offset: 0.7, easing: 'ease-out' },
      { transform: tr(0, groundY - 5), offset: 0.85, easing: 'ease-in' },
      { transform: tr(0, groundY) }
    ], { duration: 620, fill: 'forwards' }));
    if (over) return;
    await sleep(260);

    // 2. Går längs kanten; ett helt antal steg så att benen stannar i viloläge
    var dist = Math.max(40, x1 - x0), cyc = 560;
    var walkMs = Math.max(2, Math.round(dist / 58)) * cyc;
    fig.style.setProperty('--cyc', cyc + 'ms');
    fig.classList.add('hs-walk');
    anim(gx, [{ transform: tr(x0, 0) }, { transform: tr(x1, 0) }], { duration: walkMs, easing: 'linear', fill: 'forwards' });

    // Molnet glider in från höger och ska vara på plats när gubben stannar
    var cloudMs = Math.min(1900, walkMs);
    later(function () {
      anim(cloud, [
        { transform: tr(cloudX + 150, cloudY - 14), opacity: 0 },
        { transform: tr(cloudX, cloudY), opacity: 1 }
      ], { duration: cloudMs, easing: EASE, fill: 'forwards' });
    }, walkMs - cloudMs + 200);
    await sleep(walkMs);
    if (over) return;
    fig.classList.remove('hs-walk');
    await sleep(cloudMs > walkMs - 200 ? 600 : 420);

    // 3. Tar sats och hoppar upp på molnet
    fig.classList.add('hs-crouch');
    await sleep(230);
    if (over) return;
    fig.classList.remove('hs-crouch');
    fig.classList.add('hs-air');
    var peak = Math.min(groundY, seatY) - 34, JUMP = 640;
    anim(gx, [{ transform: tr(x1, 0) }, { transform: tr(seatX, 0) }], { duration: JUMP, easing: 'cubic-bezier(0.3,0,0.6,1)', fill: 'forwards' });
    later(function () { fig.classList.remove('hs-air'); fig.classList.add('hs-sit'); }, JUMP * 0.62);
    await wait(anim(gy, [
      { transform: tr(0, groundY), easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(0, peak), offset: 0.45, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
      { transform: tr(0, seatY) }
    ], { duration: JUMP, fill: 'forwards' }));
    if (over) return;

    // Landningen: gubben flyttas in i molnet så att de rör sig som en enhet; molnet sjunker lätt av tyngden
    anims.forEach(function (a) { if (a.effect && (a.effect.target === gx || a.effect.target === gy)) a.cancel(); });
    gx.style.transform = tr(seatX - cloudX, 0);
    gy.style.transform = tr(0, seatY - cloudY);
    bob.appendChild(gx);
    await wait(anim(bob, [
      { transform: 'none', easing: 'ease-out' },
      { transform: 'translateY(6px) scale(1.04,0.96)', offset: 0.35, easing: 'ease-in-out' },
      { transform: 'none' }
    ], { duration: 520 }));
    if (over) return;
    bob.classList.add('is-bobbing');
    await sleep(500);
    if (over) return;

    // 4. Iväg: tar fart i en mjuk båge upp åt höger, vinkar, och försvinner ut ur bild
    fig.classList.add('hs-wave');
    var dx = Math.max(innerWidth - cr.right + CW + 120, 360), dy = -(cr.top + CH + 120);
    var FLY = small ? 3600 : 4400;
    await wait(anim(cloud, [
      { transform: tr(cloudX, cloudY), opacity: 1, easing: 'ease-in-out' },
      { transform: tr(cloudX - 8, cloudY + 6) + ' rotate(-2deg)', offset: 0.12, easing: 'cubic-bezier(0.5,0,0.7,0.6)' },
      { transform: tr(cloudX + dx * 0.32, cloudY + dy * 0.22) + ' rotate(3deg) scale(0.92)', offset: 0.5, easing: 'cubic-bezier(0.3,0.4,0.6,1)' },
      { transform: tr(cloudX + dx, cloudY + dy) + ' rotate(-2deg) scale(0.7)', opacity: 0.85 }
    ], { duration: FLY, fill: 'forwards' }));
    if (over) return;
    over = true;
    window.removeEventListener('resize', onResize);
    form.removeEventListener('focusin', stop);
    form.removeEventListener('pointerdown', stop);
    stage.remove();
  }

  // Start: när KlaroIntro är klart (eller direkt om det inte visas), när hero har tonat in och formuläret är monterat
  function whenIntroDone(fn) {
    if (!root.classList.contains('ki-play')) return fn();
    var mo = new MutationObserver(function () {
      if (!root.classList.contains('ki-play')) { mo.disconnect(); fn(); }
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
  whenIntroDone(function () {
    later(function tryPlay(n) {
      if (over) return;
      if (form.querySelector('[data-wz-mount="hero"] .wz-prompt-card')) play();
      else if ((n || 0) < 20) later(function () { tryPlay((n || 0) + 1); }, 150);
    }, 1500);
  });
})();
