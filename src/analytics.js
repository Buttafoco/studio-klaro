/* Google Analytics 4 med Google Consent Mode v2, Meta Pixel och cookie-banner.
   Laddas som modul på varje sida (se <head>), så all logik finns på ett ställe.

   - Standard: analytics_storage (och alla annonsrelaterade signaler) = denied.
   - Två kategorier utöver nödvändiga: Statistik (GA4) och Marknadsföring (Meta
     Pixel). Valet sparas i localStorage i 12 månader så bannern inte visas vid
     varje besök.
   - Meta Pixel laddas, initieras och skickar PageView först när Marknadsföring
     är godkänd. Ingen <noscript>-bild används, eftersom den skulle kringgå samtycket.
   - Sajten är flersidig (ingen klient-routing), så varje navigering är en ny
     sidladdning och config-anropet nedan registrerar sidvisningen.
   - Inga formulärvärden, namn, e-post eller telefonnummer skickas någonsin.
     Query-parametrar rensas bort ur page_location/page_referrer (t.ex.
     /seo-koll?url=… som innehåller det besökaren skrev i ett formulär). */

import { isPortfolioEmbed } from './embed-mode.js';

const MEASUREMENT_ID = 'G-LF04L4G9WG';
const META_PIXEL_ID = '1088666567360094';

const INTERNAL_STORAGE_KEY = 'klaro_internal';

const analyticsParams = new URLSearchParams(window.location.search);

if (analyticsParams.get('klaro_internal') === '1') {
  localStorage.setItem(INTERNAL_STORAGE_KEY, '1');
}

if (analyticsParams.get('klaro_internal') === '0') {
  localStorage.removeItem(INTERNAL_STORAGE_KEY);
}

const isInternalUser =
  localStorage.getItem(INTERNAL_STORAGE_KEY) === '1';

if (isInternalUser) {
  console.info('[Klaro Analytics] Internal user – tracking disabled');
}
const CONSENT_KEY = 'sk_consent_v1';
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
// Taggen skickar bara data från produktionsdomänen, så lokala tester och
// Vercel-förhandsversioner inte förorenar statistiken. ?ga_debug=1 tvingar på
// (och slår på GA:s DebugView) för felsökning.
const PROD_HOSTS = ['studioklaro.se', 'www.studioklaro.se'];
// Kampanjparametrar är det enda som får följa med i URL:er till GA.
const ALLOWED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid'];

function cleanUrl(href) {
  if (!href) return '';
  try {
    const url = new URL(href);
    const kept = new URLSearchParams();
    ALLOWED_PARAMS.forEach((key) => {
      if (url.searchParams.has(key)) kept.set(key, url.searchParams.get(key));
    });
    const query = kept.toString();
    return url.origin + url.pathname + (query ? '?' + query : '');
  } catch (e) {
    return '';
  }
}

// `value` är statistikvalet (samma fält som före Meta Pixel, så gamla val
// fortsätter gälla). `marketing` saknas i val gjorda innan kategorin fanns;
// då är marknadsföring inte godkänd och bannern visas igen för att fråga.
function readConsent() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (!stored || (stored.value !== 'granted' && stored.value !== 'denied')) return null;
    if (Date.now() - stored.ts > CONSENT_MAX_AGE_MS) return null;
    return {
      analytics: stored.value === 'granted',
      marketing: stored.marketing === 'granted',
      complete: stored.marketing === 'granted' || stored.marketing === 'denied',
    };
  } catch (e) {
    return null;
  }
}

function saveConsent(choice) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      value: choice.analytics ? 'granted' : 'denied',
      marketing: choice.marketing ? 'granted' : 'denied',
      ts: Date.now(),
    }));
  } catch (e) {
    // Privat läge o.d. – valet gäller då bara den här sidvisningen.
  }
}

// Tar bort cookies om besökaren drar tillbaka ett tidigare godkännande.
function clearCookies(isTarget) {
  const host = location.hostname;
  const domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0].trim();
    if (isTarget(name)) {
      domains.forEach((domain) => {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    }
  });
}

const isGaCookie = (name) => name === '_ga' || name.indexOf('_ga_') === 0;
const isMetaCookie = (name) => name === '_fbp' || name === '_fbc';

// Meta Pixel: laddas bara från produktionsdomänen (som GA-taggen), eller med
// ?meta_debug=1 för felsökning. window.__klaroMetaPixel är 'active' när pixeln
// är initierad och samtycket gäller, 'revoked' om samtycket dragits tillbaka
// under sidvisningen, och saknas innan pixeln har laddats.
function enableMetaPixel() {
  const allowed = /[?&]meta_debug=1\b/.test(location.search) || PROD_HOSTS.indexOf(location.hostname) !== -1;
  if (!allowed) return;

  // Redan initierad på den här sidvisningen: slå bara på samtycket igen, utan
  // ny init eller ett andra PageView.
  if (window.__klaroMetaPixel) {
    window.fbq('consent', 'grant');
    window.__klaroMetaPixel = 'active';
    return;
  }
  window.__klaroMetaPixel = 'active';

  // Metas bas-kod (fbevents.js), utan <noscript>-bilden.
  if (!window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function disableMetaPixel() {
  if (window.__klaroMetaPixel === 'active') {
    window.fbq('consent', 'revoke');
    window.__klaroMetaPixel = 'revoked';
  }
  clearCookies(isMetaCookie);
}

// Besök som kommer från AI-assistenter. Matchas på referrer-domän och på
// utm_source (ChatGPT lägger t.ex. till utm_source=chatgpt.com på länkar).
// Se docs/ai-trafik-analytics.md för hur händelsen används i GA4.
const AI_SOURCES = [
  { name: 'chatgpt', hosts: ['chatgpt.com', 'chat.openai.com'] },
  { name: 'perplexity', hosts: ['perplexity.ai'] },
  { name: 'gemini', hosts: ['gemini.google.com', 'bard.google.com'] },
  { name: 'claude', hosts: ['claude.ai'] },
  { name: 'copilot', hosts: ['copilot.microsoft.com', 'copilot.cloud.microsoft'] },
];
const AI_SESSION_KEY = 'sk_ai_referral';

function matchAiSource(value) {
  const needle = String(value || '').toLowerCase();
  if (!needle) return null;
  const source = AI_SOURCES.find((s) =>
    s.name === needle || s.hosts.some((host) => needle === host || needle.endsWith('.' + host))
  );
  return source ? source.name : null;
}

function trackAiReferral(gtag) {
  let referrerHost = '';
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
  } catch (e) {
    referrerHost = '';
  }
  const referrerSource = matchAiSource(referrerHost);
  const source = referrerSource || matchAiSource(analyticsParams.get('utm_source'));
  if (!source) return;

  // En gång per session räcker; interna navigeringar har egen domän som referrer.
  try {
    if (sessionStorage.getItem(AI_SESSION_KEY)) return;
    sessionStorage.setItem(AI_SESSION_KEY, source);
  } catch (e) {
    // sessionStorage otillgängligt – skicka ändå.
  }

  gtag('event', 'ai_referral', {
    ai_source: source,
    ai_match: referrerSource ? 'referrer' : 'utm_source',
    landing_page: location.pathname,
  });
}

function init() {
  // Live-preview i Danilos portfolio: ingen mätning och ingen banner. Inget
  // samtycke ges eller sparas – ett tidigare val på studioklaro.se står kvar.
  if (isPortfolioEmbed) return;

  // Danilo / interna enheter ska aldrig laddas eller skicka GA4-data.
  if (isInternalUser) {
    clearCookies(isGaCookie);
    clearCookies(isMetaCookie);
    return;
  }

  // Skydd mot dubbla Google-taggar (om modulen skulle köras två gånger).
  if (window.__klaroAnalytics) return;
  window.__klaroAnalytics = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  const gtag = window.gtag;

  // Consent Mode: måste sättas innan config och innan gtag.js laddas.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  });

  // Aktuellt val; uppdateras i applyChoice så det gäller även om localStorage inte går att skriva.
  let consent = readConsent();
  if (consent && consent.analytics) gtag('consent', 'update', { analytics_storage: 'granted' });

  const debug = /[?&]ga_debug=1\b/.test(location.search);
  const shouldLoad = debug || PROD_HOSTS.indexOf(location.hostname) !== -1;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    page_location: cleanUrl(location.href),
    page_referrer: cleanUrl(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debug ? { debug_mode: true } : {}),
  });

  if (shouldLoad && !document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  trackAiReferral(gtag);

  // Tidigare sparat godkännande av marknadsföring: starta pixeln direkt.
  if (consent && consent.marketing) enableMetaPixel();

  // Anropas av sidornas formulärkod först när en förfrågan har tagits emot.
  // Tar bara ett formulärnamn – aldrig några fältvärden.
  // formLocation (valfri) anger var på sidan formuläret satt, t.ex. 'hero' eller 'kontakt'.
  window.klaroTrackLead = function (formName, formLocation) {
    const params = { form_name: String(formName || 'kontaktformular').slice(0, 40) };
    if (formLocation) params.form_location = String(formLocation).slice(0, 40);
    gtag('event', 'generate_lead', params);
    if (consent && consent.marketing && window.__klaroMetaPixel === 'active') {
      window.fbq('track', 'Lead');
    }
  };

  // Spåra visningar av kundcase.
  const caseMatch = location.pathname.match(/\/case-([^/]+?)(?:\.html)?$/);
  if (caseMatch) {
    gtag('event', 'case_view', {
      case_name: caseMatch[1],
    });
  }

  // Spåra klick på huvud-CTA:n "Få en gratis genomgång".
  document.addEventListener('click', (event) => {
    const cta = event.target.closest && event.target.closest('a, button');
    if (!cta) return;
    if (cta.textContent.trim() !== 'Få en gratis genomgång') return;

    let ctaLocation = 'other';
    const className = String(cta.className || '');

    if (/nav/i.test(className)) ctaLocation = 'nav';
    else if (/footer/i.test(className)) ctaLocation = 'footer';
    else if (/primary|main|dark/i.test(className)) ctaLocation = 'main';

    gtag('event', 'cta_click', {
      cta_name: 'gratis_genomgang',
      cta_location: ctaLocation,
    });
  });

  // Spåra klick på e-postlänkar utan att skicka e-postadressen till GA4.
  document.addEventListener('click', (event) => {
    const emailLink = event.target.closest && event.target.closest('a[href^="mailto:"]');
    if (!emailLink) return;

    event.preventDefault();

    const href = emailLink.getAttribute('href');
    let opened = false;

    const openMail = () => {
      if (opened) return;
      opened = true;
      window.location.href = href;
    };

    gtag('event', 'email_click', {
      link_location: location.pathname,
      transport_type: 'beacon',
      event_callback: openMail,
      event_timeout: 500,
    });

    window.setTimeout(openMail, 700);
  });

  // Öppnar bannern igen, t.ex. från en framtida "Cookie-inställningar"-länk.
  window.klaroCookieSettings = showBanner;
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-cookie-settings]');
    if (trigger) {
      event.preventDefault();
      showBanner();
    }
  });

  if (!consent || !consent.complete) showBanner();

  function applyChoice(choice) {
    const previous = consent;
    consent = { analytics: choice.analytics, marketing: choice.marketing, complete: true };
    saveConsent(consent);
    gtag('consent', 'update', { analytics_storage: choice.analytics ? 'granted' : 'denied' });
    if (!choice.analytics && previous && previous.analytics) clearCookies(isGaCookie);
    if (choice.marketing) enableMetaPixel();
    else if (previous && previous.marketing) disableMetaPixel();
    hideBanner();
  }

  function hideBanner() {
    const el = document.getElementById('sk-cookie-banner');
    if (el) el.remove();
  }

  function showBanner() {
    if (document.getElementById('sk-cookie-banner')) return;
    if (!document.getElementById('sk-cookie-style')) {
      const style = document.createElement('style');
      style.id = 'sk-cookie-style';
      style.textContent = BANNER_CSS;
      document.head.appendChild(style);
    }
    const el = document.createElement('div');
    el.id = 'sk-cookie-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie-inställningar');
    el.innerHTML =
      '<p class="skc-text"><strong>Cookies</strong>' +
      'Vi vill använda Google Analytics för att förstå hur sajten används, och Meta Pixel för att mäta ' +
      'hur våra annonser på Facebook och Instagram fungerar. Välj vad du godkänner. ' +
      'Nödvändiga cookies används alltid.</p>' +
      '<div class="skc-options">' +
      '<label class="skc-option"><input type="checkbox" data-category="analytics"' + (consent && consent.analytics ? ' checked' : '') + '>' +
      '<span><strong>Statistik</strong> – Google Analytics</span></label>' +
      '<label class="skc-option"><input type="checkbox" data-category="marketing"' + (consent && consent.marketing ? ' checked' : '') + '>' +
      '<span><strong>Marknadsföring</strong> – Meta Pixel</span></label>' +
      '</div>' +
      '<div class="skc-actions">' +
      '<button type="button" class="skc-btn" data-choice="necessary">Endast nödvändiga</button>' +
      '<button type="button" class="skc-btn" data-choice="save">Spara val</button>' +
      '<button type="button" class="skc-btn" data-choice="all">Godkänn alla</button>' +
      '</div>';
    el.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-choice]');
      if (!btn) return;
      const action = btn.getAttribute('data-choice');
      const checked = (category) => el.querySelector('[data-category="' + category + '"]').checked;
      if (action === 'all') applyChoice({ analytics: true, marketing: true });
      else if (action === 'save') applyChoice({ analytics: checked('analytics'), marketing: checked('marketing') });
      else applyChoice({ analytics: false, marketing: false });
    });
    document.body.appendChild(el);
  }
}

const BANNER_CSS = `
#sk-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;box-sizing:border-box;background:#0F172A;color:#E2E8F0;border:1px solid rgba(255,255,255,0.16);border-radius:16px;padding:20px;box-shadow:0 18px 40px rgba(15,23,42,0.28);font-family:'Manrope',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.55;}
#sk-cookie-banner .skc-text{margin:0 0 16px;}
#sk-cookie-banner .skc-text strong{display:block;color:#fff;font-size:15px;font-weight:800;margin-bottom:4px;}
#sk-cookie-banner .skc-options{display:grid;gap:8px;margin:0 0 16px;}
#sk-cookie-banner .skc-option{display:flex;align-items:center;gap:10px;cursor:pointer;}
#sk-cookie-banner .skc-option input{width:18px;height:18px;margin:0;flex:none;accent-color:#AFC6E8;cursor:pointer;}
#sk-cookie-banner .skc-option strong{color:#fff;font-weight:700;}
#sk-cookie-banner .skc-option input:focus-visible{outline:2px solid #AFC6E8;outline-offset:2px;}
#sk-cookie-banner .skc-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;}
#sk-cookie-banner .skc-btn{flex:1 1 180px;min-height:44px;border-radius:12px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer;border:none;background:#fff;color:#0F172A;}
#sk-cookie-banner .skc-btn:focus-visible{outline:2px solid #AFC6E8;outline-offset:2px;}
`;

init();
