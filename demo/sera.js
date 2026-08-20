/* ==========================================================================
   SERA — konceptrestaurang (Studio Klaro-demo)
   All interaktion för /demo/sera. Ingen extern beroendekedja.
   ========================================================================== */

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileMQ = window.matchMedia('(max-width: 760px)');

const isReduced = () => reduced.matches;

/* --------------------------------------------------------------------------
   Tema — light / brown / black
   -------------------------------------------------------------------------- */

const THEMES = ['light', 'brown', 'black'];
const THEME_KEY = 'sera-theme';

function initThemes() {
  const buttons = Array.from(document.querySelectorAll('[data-sera-theme-btn]'));
  if (!buttons.length) return;

  const apply = (name, persist) => {
    if (!THEMES.includes(name)) name = 'light';
    root.setAttribute('data-sera-theme', name);
    buttons.forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.seraThemeBtn === name));
    });
    if (persist) {
      try { localStorage.setItem(THEME_KEY, name); } catch (e) { /* private mode */ }
    }
  };

  buttons.forEach((b) => {
    b.addEventListener('click', () => apply(b.dataset.seraThemeBtn, true));
  });

  apply(root.getAttribute('data-sera-theme') || 'light', false);
}

/* --------------------------------------------------------------------------
   Mobilmeny
   -------------------------------------------------------------------------- */

function initMobileNav() {
  const panel = document.querySelector('[data-sera-mnav]');
  const burger = document.querySelector('[data-sera-burger]');
  if (!panel || !burger) return;

  const close = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    burger.focus();
  };

  const open = () => {
    panel.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    const first = panel.querySelector('button, a');
    if (first) first.focus();
  };

  burger.addEventListener('click', open);

  panel.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-sera-mnav-close]')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  // Enkel fokusfälla så tabbning stannar i overlayen
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(panel.querySelectorAll('a, button')).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  mobileMQ.addEventListener('change', (e) => { if (!e.matches) close(); });
}

/* --------------------------------------------------------------------------
   Mjuk avtäckning vid scroll
   -------------------------------------------------------------------------- */

function initReveal() {
  const items = document.querySelectorAll('.sera-reveal');
  if (!items.length) return;

  if (isReduced() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Den genomgående linjen
   Path-datan är normaliserad (x: 0–100, y: 0–1000) och skalas till exakta
   pixlar, så viewBox blir 1:1 med elementet. Det ger en verkligt tunn linje
   och en rund punkt — till skillnad från en utsträckt viewBox.
   -------------------------------------------------------------------------- */

/* Linjen som en kedja av kubiska kurvsegment i ett normaliserat rutnät
   (x: 0–100 av sidbredden, y: 0–1000 av sträckans höjd), skalad till exakta
   pixlar vid ritning. Ankarpunkterna ligger nära mittlinjen medan
   kontrollpunkterna svänger brett åt sidorna — det ger en obruten,
   kalligrafisk vågrörelse genom hela sträckan istället för raka lodräta
   segment mellan få utspridda ankare. Formen är hämtad från originaldesignen
   (Claude Design, SERA.dc.html) och återges här i produktionens
   pixel-skalade teknik för att undvika den gamla stretchade-viewBox-buggen. */

const FLOW_CURVES = {
  // Desktop: vandrar i en jämn våg kring mitten och viker ut åt höger i slutet.
  desktop: {
    start: [50, 0],
    segments: [
      [42, 60, 58, 110, 50, 170],
      [40, 230, 60, 290, 50, 350],
      [38, 410, 62, 470, 48, 530],
      [35, 590, 60, 650, 50, 710],
      [42, 760, 58, 800, 50, 850],
      [60, 900, 72, 960, 78, 1000],
    ],
  },
  // Mobil: samma rytm, förenklad och skalad in mot vänsterkanten.
  mobile: {
    start: [20, 0],
    segments: [
      [15, 60, 25, 110, 18, 170],
      [13, 230, 27, 290, 20, 350],
      [14, 410, 26, 470, 18, 530],
      [13, 590, 25, 650, 20, 710],
      [15, 760, 24, 800, 20, 850],
      [24, 900, 27, 960, 28, 1000],
    ],
  },
};

const PIN_R = 4;

function buildPath(curve, w, h) {
  const px = (x) => ((x / 100) * w).toFixed(2);
  const py = (y) => ((y / 1000) * h).toFixed(2);

  let d = `M${px(curve.start[0])},${py(curve.start[1])}`;
  curve.segments.forEach(([x1, y1, x2, y2, x, y]) => {
    d += ` C${px(x1)},${py(y1)} ${px(x2)},${py(y2)} ${px(x)},${py(y)}`;
  });
  return d;
}

function initFlow() {
  const wrap = document.querySelector('[data-sera-flow-wrap]');
  const svg = document.querySelector('[data-sera-flow] svg');
  const path = svg && svg.querySelector('path');
  const pin = svg && svg.querySelector('circle');
  if (!wrap || !svg || !path || !pin) return null;

  let length = 0;

  const layout = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;

    // Lämna plats för punktens radie så den inte klipps vid kartsektionens kant.
    const usable = Math.max(h - PIN_R * 2, 1);
    const curve = mobileMQ.matches ? FLOW_CURVES.mobile : FLOW_CURVES.desktop;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    path.setAttribute('d', buildPath(curve, w, usable));

    length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    const end = path.getPointAtLength(length);
    pin.setAttribute('cx', end.x.toFixed(2));
    pin.setAttribute('cy', end.y.toFixed(2));
    pin.setAttribute('r', String(PIN_R));

    if (isReduced()) {
      // Statisk linje, ingen scroll-ritning.
      path.style.strokeDashoffset = '0';
      pin.style.opacity = '1';
    } else {
      draw();
    }
  };

  const draw = () => {
    if (isReduced() || !length) return;
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight || root.clientHeight;
    // 0 när hero-botten når vyns underkant, 1 när kartsektionen möter den.
    let p = (vh - rect.top) / rect.height;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    path.style.strokeDashoffset = `${length * (1 - p)}`;
    pin.style.opacity = p >= 0.995 ? '1' : '0';
  };

  if ('ResizeObserver' in window) {
    let queued = false;
    new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; layout(); });
    }).observe(wrap);
  } else {
    window.addEventListener('resize', layout);
  }

  mobileMQ.addEventListener('change', layout);
  reduced.addEventListener('change', layout);
  layout();

  return draw;
}

/* --------------------------------------------------------------------------
   Lugn parallax på de två helbredsbilderna
   -------------------------------------------------------------------------- */

function initParallax() {
  const layers = Array.from(document.querySelectorAll('[data-sera-parallax]'))
    .map((el) => ({ el, frame: el.parentElement, mode: el.dataset.seraParallax }))
    .filter((l) => l.frame);

  if (!layers.length) return null;

  return () => {
    if (isReduced()) return;
    const y = window.scrollY || window.pageYOffset;
    layers.forEach(({ el, frame, mode }) => {
      const overhang = frame.offsetHeight * 0.08;
      let shift;
      if (mode === 'hero') {
        shift = Math.min(y * 0.15, overhang);
      } else {
        shift = frame.getBoundingClientRect().top * -0.1;
      }
      shift = Math.max(-overhang, Math.min(overhang, shift));
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    });
  };
}

/* --------------------------------------------------------------------------
   Konceptnotis för demo-interaktioner
   -------------------------------------------------------------------------- */

function initDemoActions() {
  const note = document.querySelector('[data-sera-note]');
  if (!note) return;
  let timer;

  const show = (text) => {
    note.textContent = text;
    note.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => note.classList.remove('is-on'), 4200);
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-sera-demo]');
    if (!trigger) return;
    e.preventDefault();
    show(trigger.dataset.seraDemo);
  });
}

/* --------------------------------------------------------------------------
   Start
   -------------------------------------------------------------------------- */

function boot() {
  root.classList.add('sera-js');
  root.classList.remove('sera-js-pending');

  initThemes();
  initMobileNav();
  initReveal();
  initDemoActions();

  const drawFlow = initFlow();
  const moveParallax = initParallax();

  if (!drawFlow && !moveParallax) return;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (moveParallax) moveParallax();
      if (drawFlow) drawFlow();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
