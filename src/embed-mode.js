/* Portfolio embed mode – sajten visas som live-preview i Danilos portfolio
   (iframe med ?embed=portfolio). Det här är enda stället som läser parametern.

   - isPortfolioEmbed styr analytics.js och speed-insights.js: ingen icke-nödvändig
     mätning och ingen cookie-banner. Inget samtycke ges eller sparas.
   - Läget följer med vid klick på länkar inne i previewn (sessionStorage), men
     bara när sidan faktiskt ligger i en iframe. Iframens sessionStorage är skild
     från vanliga besök, så studioklaro.se påverkas inte.
   - Autoscroll: långsam presentation av sidan som pausar så fort besökaren
     själv tar över, och fortsätter där den var efter en stunds inaktivitet. Körs bara på sidan som laddades med parametern,
     och aldrig med prefers-reduced-motion. */

const EMBED_KEY = 'sk_portfolio_embed';

const fromUrl = new URLSearchParams(window.location.search).get('embed') === 'portfolio';

function isFramed() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function fromSession() {
  try {
    return sessionStorage.getItem(EMBED_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export const isPortfolioEmbed = fromUrl || (isFramed() && fromSession());

if (fromUrl && isFramed()) {
  try {
    sessionStorage.setItem(EMBED_KEY, '1');
  } catch (e) {
    // sessionStorage otillgängligt – läget gäller då bara den här sidvisningen.
  }
}

const SPEED = 55; // px per sekund
const START_DELAY = 1800;
const RAMP = 1200; // mjuk start, ms
const BOTTOM_PAUSE = 3000;
const RETURN_MS = 2600;
const TOP_PAUSE = 2000;
const IDLE_RESUME = 7000; // fortsätt där den var efter 7 s utan interaktion

function startAutoscroll() {
  const scroller = document.scrollingElement || document.documentElement;
  const maxY = () => scroller.scrollHeight - window.innerHeight;
  // html{scroll-behavior:smooth} skulle annars jämna ut varje litet steg.
  const scrollTo = (y) => window.scrollTo({ top: y, behavior: 'instant' });
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let stopped = false;
  let raf = 0;
  let timer = 0;
  let idleTimer = 0;

  // Besökaren tar över: pausa, och fortsätt nedåt från där sidan står efter
  // IDLE_RESUME ms utan ny interaktion.
  const pause = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      stopped = false;
      glideDown();
    }, IDLE_RESUME);
  };
  ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'].forEach((type) =>
    window.addEventListener(type, pause, { capture: true, passive: true })
  );

  const later = (fn, ms) => {
    if (!stopped) timer = setTimeout(fn, ms);
  };

  function glideDown() {
    let y = window.scrollY;
    let start = 0;
    let last = 0;
    const step = (now) => {
      if (stopped) return;
      if (!start) start = last = now;
      // Begränsa steget så en bakgrundsflik inte hoppar långt när den vaknar.
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const ramp = Math.min((now - start) / RAMP, 1);
      y = Math.min(y + SPEED * ramp * dt, maxY());
      scrollTo(y);
      if (y >= maxY() - 1) later(glideUp, BOTTOM_PAUSE);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function glideUp() {
    const from = window.scrollY;
    let start = 0;
    const step = (now) => {
      if (stopped) return;
      if (!start) start = now;
      const t = Math.min((now - start) / RETURN_MS, 1);
      scrollTo(from * (1 - easeInOut(t)));
      if (t < 1) raf = requestAnimationFrame(step);
      else later(glideDown, TOP_PAUSE);
    };
    raf = requestAnimationFrame(step);
  }

  later(glideDown, START_DELAY);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fromUrl && !reducedMotion) {
  if (document.readyState === 'complete') startAutoscroll();
  else window.addEventListener('load', startAutoscroll, { once: true });
}
