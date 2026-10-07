// Hero-gubben: en streckgubbe landar på hero-formulärets överkant, går längs den, hoppar upp på ett moln
// som glider in och flyger iväg sittande på det. Spelas en gång per sidvisning, efter KlaroIntro.
// Första besöket (när KlaroIntro visas) åker gubben i stället med loggan när den flyger till headern: han hänger
// under den, drar ner den på plats i menyn, svingar sig och hoppar ner på formuläret (window.__hsRide anropas av introt).
// Klick på headerns logga (på startsidan): gubben går in i formulärets textfält och skriver en hälsning med en penna.
// Hoppas över vid reducerad rörelse eller om formuläret inte syns. Avbryts (tonas bort) om besökaren
// börjar använda formuläret eller ändrar fönsterbredden. Stil: src/hero-stickman.css. Figuren: src/stickman.js.
import { NS, makeFigure, makeCloud } from './stickman.js';

(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var form = document.querySelector('.hc .hero-form');
  if (!form || !form.animate) return;

  var root = document.documentElement;
  var EASE = 'cubic-bezier(0.22,1,0.36,1)';
  var stage = null, sky = null, anims = [], timers = [], cleanups = [], raf = 0, over = false, rode = false, startW = 0;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function anim(node, frames, opts) { var a = node.animate(frames, opts); anims.push(a); return a; }
  function wait(a) { return new Promise(function (r) { a.onfinish = r; }); }
  function sleep(ms) { return new Promise(function (r) { later(r, ms); }); }
  function getCard() { return form.querySelector('[data-wz-mount="hero"] .wz-prompt-card'); }

  function listen() {
    startW = innerWidth;
    window.addEventListener('resize', onResize);
    form.addEventListener('focusin', stop);
    form.addEventListener('pointerdown', stop);
  }
  function unlisten() {
    window.removeEventListener('resize', onResize);
    form.removeEventListener('focusin', stop);
    form.removeEventListener('pointerdown', stop);
  }
  function runCleanups() { cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} }); }
  // Avbryter: väntande steg (timers, onfinish) kopplas bort direkt så att inget gammalt förlopp kan fortsätta
  function stop() {
    if (over) return;
    over = true;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(raf);
    unlisten();
    runCleanups();
    var old = anims;
    old.forEach(function (a) { a.onfinish = null; });
    [stage, sky].forEach(function (s) {
      if (!s) return;
      s.classList.add('is-gone');
      setTimeout(function () { old.forEach(function (a) { try { a.cancel(); } catch (e) {} }); s.remove(); }, 350);
    });
  }
  // Klart utan avbrott
  function finish() {
    over = true;
    unlisten();
    if (stage) stage.remove();
    runCleanups();
  }
  // Ny körning: stoppar det som pågår och börjar om med tomma listor
  function reset() {
    if (!over) stop();
    over = false; anims = []; timers = []; cleanups = []; stage = null; sky = null;
  }
  function onResize() { if (innerWidth !== startW) stop(); }

  function tr(x, y, extra) { return 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : ''); }
  function sizes() { var small = innerWidth < 600, H = small ? 36 : 44; return { small: small, H: H, W: H * 40 / 60 }; }

  // Scenen i formuläret (gubben + molnet), mätt mot formulärkortets överkant
  function buildStage(card, fig) {
    var sz = sizes(), fr = form.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var CW = sz.small ? 104 : 128;
    var c = {
      small: sz.small, H: sz.H, W: sz.W, HIP: sz.H * 34 / 60, CW: CW, CH: CW / 2, cr: cr,
      top: cr.top - fr.top, left: cr.left - fr.left, right: cr.right - fr.left
    };
    c.groundY = c.top - c.H + 1;                                // fötterna precis på kortets kant
    c.cloudX = c.right - CW - (c.small ? 6 : 18); c.cloudY = c.top - c.CH - 8;
    c.x1 = c.cloudX - c.W - (c.small ? 6 : 12);                 // där gubben stannar, framför molnet
    c.seatX = c.cloudX + CW * 0.5 - c.W / 2; c.seatY = c.cloudY + c.CH * 0.48 - c.HIP;

    stage = document.createElement('div');
    stage.className = 'hs-stage';
    stage.setAttribute('aria-hidden', 'true');
    c.gx = document.createElement('div'); c.gx.className = 'hs-x';
    c.gy = document.createElement('div'); c.gy.className = 'hs-y';
    c.fig = fig || makeFigure(c.H);
    c.gy.appendChild(c.fig); c.gx.appendChild(c.gy);
    c.cloud = makeCloud(CW); c.bob = c.cloud.firstChild;
    c.cloud.style.opacity = '0';
    stage.appendChild(c.cloud); stage.appendChild(c.gx);
    form.appendChild(stage);
    return c;
  }

  // Vanliga besök: landar uppifrån på kanten, sedan promenaden
  async function play() {
    var card = getCard();
    if (!card || over) return;
    var cr = card.getBoundingClientRect();
    if (cr.top > innerHeight - 40 || cr.bottom < 60) return;   // formuläret syns inte: hoppa över
    var c = buildStage(card);
    listen();
    var x0 = c.left + (c.small ? 22 : 34);
    c.gx.style.transform = tr(x0, 0);
    await wait(anim(c.gy, [
      { transform: tr(0, c.groundY - 46), opacity: 0, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(0, c.groundY), opacity: 1, offset: 0.7, easing: 'ease-out' },
      { transform: tr(0, c.groundY - 5), offset: 0.85, easing: 'ease-in' },
      { transform: tr(0, c.groundY) }
    ], { duration: 620, fill: 'forwards' }));
    if (over) return;
    await sleep(260);
    walkAndFly(c, x0);
  }

  async function walkAndFly(c, x0) {
    var fig = c.fig, gx = c.gx, gy = c.gy, cloud = c.cloud, bob = c.bob, groundY = c.groundY;
    var x1 = c.x1, cloudX = c.cloudX, cloudY = c.cloudY, seatX = c.seatX, seatY = c.seatY, CW = c.CW, CH = c.CH;
    if (over) return;

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
    var cr = c.cr;
    var dx = Math.max(innerWidth - cr.right + CW + 120, 360), dy = -(cr.top + CH + 120);
    var FLY = c.small ? 3600 : 4400;
    await wait(anim(cloud, [
      { transform: tr(cloudX, cloudY), opacity: 1, easing: 'ease-in-out' },
      { transform: tr(cloudX - 8, cloudY + 6) + ' rotate(-2deg)', offset: 0.12, easing: 'cubic-bezier(0.5,0,0.7,0.6)' },
      { transform: tr(cloudX + dx * 0.32, cloudY + dy * 0.22) + ' rotate(3deg) scale(0.92)', offset: 0.5, easing: 'cubic-bezier(0.3,0.4,0.6,1)' },
      { transform: tr(cloudX + dx, cloudY + dy) + ' rotate(-2deg) scale(0.7)', opacity: 0.85 }
    ], { duration: FLY, fill: 'forwards' }));
    if (over) return;
    finish();
  }

  // Första besöket: KlaroIntro anropar detta när loggan börjar flyga mot headern. info = { mark, logo, pullAt, end }
  // (ms från start): loggan stannar en bit ovanför sin plats, gubben drar ner den vid pullAt och den landar vid end.
  // Returnerar false om formuläret inte syns – då flyger loggan som vanligt och gubben kommer som vanligt efteråt.
  window.__hsRide = function (info) {
    delete window.__hsRide;
    var card = getCard();
    if (over || !card) return false;
    var cr = card.getBoundingClientRect();
    if (cr.top > innerHeight - 40 || cr.bottom < 60) return false;
    rode = true;

    var sz = sizes(), H = sz.H, W = sz.W;
    var HX = W / 2, HY = H * 2.3 / 60;                          // händerna (greppet) i figuren
    var L = H * 0.5, G = 2600;                                  // pendellängd (px) och tyngd (px/s²)
    sky = document.createElement('div');
    sky.className = 'hs-sky';
    sky.setAttribute('aria-hidden', 'true');
    var gx = document.createElement('div'); gx.className = 'hs-x';
    var gy = document.createElement('div'); gy.className = 'hs-y';
    gy.style.transformOrigin = HX + 'px ' + HY + 'px';
    var fig = makeFigure(H);
    fig.classList.add('hs-hang');
    gy.appendChild(fig); gx.appendChild(gy); sky.appendChild(gx);
    document.body.appendChild(sky);
    listen();

    // Greppet: under "a" i "klaro", i bokstävernas underkant (huvudet hänger nedanför loggan)
    function grip() {
      var el = info.mark.isConnected ? info.mark : info.logo, r = el.getBoundingClientRect();
      return { x: r.left + r.width * 0.56, y: r.bottom - r.height * 0.03 };
    }
    function place(x, y, deg) { gx.style.transform = tr(x - HX, y - HY); gy.style.transform = deg ? 'rotate(' + deg + 'deg)' : ''; }

    var t0 = performance.now(), last = t0, phi = 0, om = 0, px = null, vx = 0;
    var swingAt = info.end + 420, SWING = 760, released = null;
    var stance = 'hang';
    function pose(p) {
      if (p === stance) return;
      fig.classList.remove('hs-hang', 'hs-tug', 'hs-kick', 'hs-air');
      if (p === 'hang' || p === 'tug' || p === 'kick') fig.classList.add('hs-hang');
      if (p && p !== 'hang') fig.classList.add('hs-' + p);
      stance = p;
    }
    gx.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });

    function frame(now) {
      if (over) return;
      var t = now - t0, dt = Math.min(0.034, (now - last) / 1000) || 0.016;
      last = now;
      if (released) return fall(now);
      var g = grip();

      if (t < swingAt) {
        // Hänger fritt: pendel som drivs av loggans acceleration i sidled
        var nvx = px === null ? 0 : (g.x - px) / dt, ax = (nvx - vx) / dt;
        px = g.x; vx = nvx;
        om += (-(G / L) * Math.sin(phi) - 4 * om - Math.max(-9000, Math.min(9000, ax)) / L * Math.cos(phi)) * dt;
        phi = Math.max(-0.8, Math.min(0.8, phi + om * dt));
        pose(t >= info.pullAt && t < info.end + 160 ? 'tug' : 'hang');
      } else {
        // Svingar bakåt och sedan framåt mot formuläret, släpper i framsvingen
        var s = Math.min(1, (t - swingAt) / SWING), dir = aim(g).dir;
        var back = -0.42 * dir, fwd = 0.62 * dir;
        if (!dir) { phi = 0; s = 1; }
        else if (s < 0.42) phi = phi + (back - phi) * Math.min(1, dt * 9);
        else phi = back + (fwd - back) * (1 - Math.cos(Math.PI * (s - 0.42) / 0.58)) / 2;
        pose(s < 0.42 ? 'tug' : 'kick');
        if (s >= 1) { released = launch(g, now, dir); }
      }
      place(g.x, g.y, -phi * 180 / Math.PI);
      raf = requestAnimationFrame(frame);
    }

    // Var gubben landar: en bit framför greppet, men alltid på kortets vänstra del (så att promenaden blir kvar)
    var aimed = null;
    function aim(g) {
      if (aimed) return aimed;
      var r = getCard().getBoundingClientRect(), pad = sz.small ? 22 : 34;
      var lx = Math.max(r.left + pad + HX, Math.min(r.left + r.width * 0.38, g.x + 90));
      aimed = { lx: lx, dir: Math.abs(lx - g.x) < 24 ? 0 : (lx > g.x ? 1 : -1) };
      return aimed;
    }

    // Kastbana från greppet till kortets kant; målet läses om varje bildruta (scroll, sena layoutskiften)
    function launch(g, now, dir) {
      var a = aim(g);
      // Från greppet; kroppen rätar upp sig kring händerna under första delen av fallet
      var x0 = g.x, y0 = g.y, dx = a.lx - x0;
      pose('air');
      return { t: now, x0: x0, y0: y0, dx: dx, phi: phi, vy: dir ? -340 : 0, T: Math.max(640, Math.min(1050, 560 + Math.abs(dx) * 0.55)) };
    }
    function fall(now) {
      var f = released, s = Math.min(1, (now - f.t) / f.T), T = f.T / 1000, t = s * T;
      var card = getCard();
      if (!card) { stop(); return; }
      var feetY = card.getBoundingClientRect().top + 1;          // där fötterna ska landa (viewport)
      var y1 = feetY - H + HY;                                  // greppets höjd när han står på kanten
      var g = 2 * (y1 - f.y0 - f.vy * T) / (T * T);
      var x = f.x0 + f.dx * s, y = f.y0 + f.vy * t + 0.5 * g * t * t;
      var k = Math.min(1, s / 0.45), rot = f.phi * (1 - k * k * (3 - 2 * k));
      if (s > 0.78) pose(null);                                  // benen sträcks ut inför landningen
      place(x, y, -rot * 180 / Math.PI);
      if (s < 1) { raf = requestAnimationFrame(frame); return; }
      land(card, x);
    }

    // Landar på kortet: flyttar över gubben till formulärets scen och fortsätter med promenaden
    async function land(card, hx) {
      var c = buildStage(card, fig);
      var x0 = hx - HX - form.getBoundingClientRect().left;
      gy.style.transformOrigin = '';
      c.gx.style.transform = tr(x0, 0);
      c.gy.style.transform = tr(0, c.groundY);
      sky.remove(); sky = null;
      fig.classList.add('hs-crouch');
      await sleep(190);
      if (over) return;
      fig.classList.remove('hs-crouch');
      await sleep(380);
      walkAndFly(c, x0);
    }

    raf = requestAnimationFrame(frame);
    return true;
  };

  // ---------- Klick på loggan: gubben skriver i textfältet ----------
  var NOTES = ['Hej! Berätta om ditt företag här', 'Hej! Skriv några rader här', 'Hej! Skriv här'];
  var HAND = '"Caveat", "Segoe Print", "Bradley Hand", cursive';
  var fontLink = null;
  function loadHand() {
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=block&text=' + encodeURIComponent(NOTES.join(''));
      document.head.appendChild(fontLink);
    }
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var t = new Promise(function (r) { setTimeout(r, 1200); });  // långsam uppkoppling: skriv med reservtypsnittet
    return Promise.race([t, new Promise(function (r) {
      fontLink.addEventListener('load', function () { document.fonts.load('600 24px Caveat', NOTES[0]).then(r, r); });
      if (fontLink.sheet) document.fonts.load('600 24px Caveat', NOTES[0]).then(r, r);
    })]);
  }

  // Pennan hålls i höger hand uppåt-framåt, i axelns koordinater (samma led som armen); spetsen i (39,-4), ovanför huvudet
  function addPen(fig) {
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', 'translate(20 18)');
    g.innerHTML = '<g class="hs-limb hs-pen">' +
      '<line class="hs-pen-edge" x1="5.6" y1="-7.3" x2="15.3" y2="-17.9"/>' +
      '<line class="hs-pen-body" x1="5.6" y1="-7.3" x2="15.3" y2="-17.9"/>' +
      '<line class="hs-pen-rubber" x1="5.6" y1="-7.3" x2="8" y2="-9.9"/>' +
      '<path class="hs-pen-wood" d="M16.7 -16.6L13.9 -19.2L19 -22Z"/>' +
      '<path class="hs-pen-lead" d="M18.3 -20.5L17.5 -21.2L19 -22Z"/></g>';
    fig.querySelector('.hs-body').appendChild(g);
  }

  var writing = false;
  async function write() {
    reset();
    writing = true;
    var done = function () { writing = false; };
    cleanups.push(done);
    if (scrollY > 2) {                                           // längre ner på sidan: först upp till hero
      scrollTo({ top: 0, behavior: 'smooth' });
      for (var i = 0; i < 40 && scrollY > 2; i++) await sleep(50);
      if (over) return;
      if (scrollY > 2) { scrollTo(0, 0); await sleep(60); }        // mjuk scroll hann inte fram (t.ex. bakgrundsflik)
    }
    var fontReady = loadHand();
    var card = getCard();
    if (!card) return finish();
    var cr = card.getBoundingClientRect();
    if (cr.top > innerHeight - 60 || cr.bottom < 60) return finish();

    var c = buildStage(card), fig = c.fig, gx = c.gx, gy = c.gy, H = c.H, k = H / 60;
    listen();
    var field = card.querySelector('.wz-typing') || card.querySelector('textarea');
    var fr = form.getBoundingClientRect(), wr = field.getBoundingClientRect();
    var TIP = 39 * k;                                            // pennspetsen från figurens vänsterkant
    var textX = wr.left - fr.left + 24;
    var maxW = c.right - 28 - textX;                             // texten får gå nästan ut till kortets kant

    // Exempeltexterna göms medan gubben skriver; hans text ligger i formuläret och tonar bort när han har flugit iväg
    if (field.classList.contains('wz-typing')) field.classList.add('hs-writing');
    var note = document.createElement('div');
    note.className = 'hs-note';
    note.setAttribute('aria-hidden', 'true');
    form.appendChild(note);
    cleanups.push(function () {
      field.classList.remove('hs-writing');
      note.classList.add('is-gone');
      setTimeout(function () { note.remove(); }, 450);
    });

    // 1. Landar på kortets kant
    var x0 = c.left + (c.small ? 22 : 34);
    gx.style.transform = tr(x0, 0);
    await wait(anim(gy, [
      { transform: tr(0, c.groundY - 46), opacity: 0, easing: 'cubic-bezier(0.5,0,0.9,0.5)' },
      { transform: tr(0, c.groundY), opacity: 1, offset: 0.7, easing: 'ease-out' },
      { transform: tr(0, c.groundY - 5), offset: 0.85, easing: 'ease-in' },
      { transform: tr(0, c.groundY) }
    ], { duration: 620, fill: 'forwards' }));
    if (over) return;
    await fontReady;
    if (over) return;

    // Texten: den längsta som får plats (typsnittet krymper vid behov, minst 19 px)
    var size = c.small ? 24 : 28, text = NOTES[NOTES.length - 1];
    note.style.font = '600 ' + size + 'px/1 ' + HAND;
    for (var n = 0; n < NOTES.length; n++) {
      note.textContent = NOTES[n];
      var w = note.getBoundingClientRect().width, fit = Math.min(size, Math.floor(size * maxW / w));
      if (fit >= 19 || n === NOTES.length - 1) { text = NOTES[n]; size = Math.max(16, fit); break; }
    }
    note.style.fontSize = size + 'px';
    note.textContent = '';
    var chars = text.split('').map(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch;
      note.appendChild(s);
      return s;
    });
    // Texten överst i fältet; gubben står under raden och skriver uppåt, så att han aldrig skymmer bokstäverna
    var baseY = wr.top - fr.top + size * 0.8 + 4;                // baslinjen ≈ 0,8 em ner med line-height 1
    note.style.left = textX + 'px';
    note.style.top = (baseY - size * 0.8) + 'px';
    var nr = note.getBoundingClientRect();
    var ends = chars.map(function (s) { var r = s.getBoundingClientRect(); return r.right - nr.left; });

    // 2. Hoppar ner i fältet, där första bokstaven ska börja
    var sx = textX - TIP + 2, sy = baseY + 2;               // huvudet strax under baslinjen
    fig.classList.add('hs-crouch');
    await sleep(200);
    if (over) return;
    fig.classList.remove('hs-crouch');
    fig.classList.add('hs-air');
    var HOP = 560;
    anim(gx, [{ transform: tr(x0, 0) }, { transform: tr(sx, 0) }], { duration: HOP, easing: 'cubic-bezier(0.3,0,0.6,1)', fill: 'forwards' });
    later(function () { fig.classList.remove('hs-air'); }, HOP * 0.7);
    await wait(anim(gy, [
      { transform: tr(0, c.groundY), easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(0, c.groundY - 26), offset: 0.3, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
      { transform: tr(0, sy) }
    ], { duration: HOP, fill: 'forwards' }));
    if (over) return;
    fig.classList.add('hs-crouch');
    await sleep(170);
    if (over) return;
    fig.classList.remove('hs-crouch');

    // 3. Tar fram pennan
    addPen(fig);
    fig.classList.add('hs-pen-ready');
    await sleep(60);
    fig.classList.add('hs-haspen');
    await sleep(520);
    if (over) return;

    // 4. Skriver: en bokstav i taget, gubben flyttar sig så att spetsen följer texten
    var t = 0, times = chars.map(function (s, i) {
      var ch = text.charAt(i), prev = text.charAt(i - 1);
      t += ch === ' ' ? 120 : 78 + Math.random() * 40;
      if (prev === '!' || prev === '.') t += 260;
      return t;
    });
    var T = t + 60, frames = [{ transform: tr(sx, 0), offset: 0 }];
    times.forEach(function (ti, i) { frames.push({ transform: tr(textX + ends[i] - TIP + 2, 0), offset: ti / T }); });
    frames.push({ transform: frames[frames.length - 1].transform, offset: 1 });
    fig.style.setProperty('--cyc', '760ms');
    fig.classList.add('hs-write');
    anim(gx, frames, { duration: T, fill: 'forwards' });
    chars.forEach(function (s, i) { later(function () { s.className = 'on'; }, times[i] - 40); });
    await sleep(T);
    if (over) return;
    fig.classList.remove('hs-write');
    var xw = textX + ends[ends.length - 1] - TIP + 2;

    // 5. Lägger undan pennan och vinkar
    await sleep(350);
    fig.classList.remove('hs-haspen');
    await sleep(250);
    fig.classList.remove('hs-pen-ready');
    fig.classList.add('hs-wave-up');
    await sleep(1300);
    if (over) return;
    fig.classList.remove('hs-wave-up');
    await sleep(250);

    // 6. Hoppar upp på kanten igen och fortsätter till molnet
    fig.classList.add('hs-crouch');
    await sleep(220);
    if (over) return;
    fig.classList.remove('hs-crouch');
    fig.classList.add('hs-air');
    var UP = 600, xe = Math.min(xw + 14, c.x1 - 40);             // alltid före molnets plats, så att han går framåt dit
    anim(gx, [{ transform: tr(xw, 0) }, { transform: tr(xe, 0) }], { duration: UP, easing: 'cubic-bezier(0.3,0,0.6,1)', fill: 'forwards' });
    later(function () { fig.classList.remove('hs-air'); }, UP * 0.72);
    await wait(anim(gy, [
      { transform: tr(0, sy), easing: 'cubic-bezier(0.2,0.6,0.4,1)' },
      { transform: tr(0, c.groundY - 30), offset: 0.55, easing: 'cubic-bezier(0.6,0,0.8,0.4)' },
      { transform: tr(0, c.groundY) }
    ], { duration: UP, fill: 'forwards' }));
    if (over) return;
    await sleep(300);
    walkAndFly(c, xe);
  }

  var logo = document.querySelector('.nav-wrap.sh .sh-logo');
  if (logo) logo.addEventListener('click', function (e) {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (root.classList.contains('ki-play')) return;
    e.preventDefault();
    if (!writing) write();
  });

  // Start: när KlaroIntro är klart (eller direkt om det inte visas), när hero har tonat in och formuläret är monterat
  function whenIntroDone(fn) {
    if (!root.classList.contains('ki-play')) return fn();
    var mo = new MutationObserver(function () {
      if (!root.classList.contains('ki-play')) { mo.disconnect(); fn(); }
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
  if (!root.classList.contains('ki-play')) delete window.__hsRide;
  whenIntroDone(function () {
    delete window.__hsRide;
    if (rode) return;                                            // gubben kom redan med loggan
    later(function tryPlay(n) {
      if (over) return;
      if (getCard()) play();
      else if ((n || 0) < 20) later(function () { tryPlay((n || 0) + 1); }, 150);
    }, 1500);
  });
})();
