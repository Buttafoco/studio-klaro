/* Google Analytics 4 med Google Consent Mode v2 och cookie-banner.
   Laddas som modul på varje sida (se <head>), så all logik finns på ett ställe.

   - Standard: analytics_storage (och alla annonsrelaterade signaler) = denied.
   - Besökaren väljer "Godkänn statistik" eller "Endast nödvändiga"; valet sparas
     i localStorage i 12 månader så bannern inte visas vid varje besök.
   - Sajten är flersidig (ingen klient-routing), så varje navigering är en ny
     sidladdning och config-anropet nedan registrerar sidvisningen.
   - Inga formulärvärden, namn, e-post eller telefonnummer skickas någonsin.
     Query-parametrar rensas bort ur page_location/page_referrer (t.ex.
     /seo-koll?url=… som innehåller det besökaren skrev i ett formulär). */

const MEASUREMENT_ID = 'G-LF04L4G9WG';
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

function readConsent() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (!stored || (stored.value !== 'granted' && stored.value !== 'denied')) return null;
    if (Date.now() - stored.ts > CONSENT_MAX_AGE_MS) return null;
    return stored.value;
  } catch (e) {
    return null;
  }
}

function saveConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, ts: Date.now() }));
  } catch (e) {
    // Privat läge o.d. – valet gäller då bara den här sidvisningen.
  }
}

// Tar bort GA-cookies om besökaren drar tillbaka ett tidigare godkännande.
function clearGaCookies() {
  const host = location.hostname;
  const domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0].trim();
    if (name === '_ga' || name.indexOf('_ga_') === 0) {
      domains.forEach((domain) => {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    }
  });
}

function init() {
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

  const stored = readConsent();
  if (stored === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' });

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

  // Anropas av sidornas formulärkod först när en förfrågan har tagits emot.
  // Tar bara ett formulärnamn – aldrig några fältvärden.
  window.klaroTrackLead = function (formName) {
    gtag('event', 'generate_lead', { form_name: String(formName || 'kontaktformular').slice(0, 40) });
  };

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

  // Öppnar bannern igen, t.ex. från en framtida "Cookie-inställningar"-länk.
  window.klaroCookieSettings = showBanner;
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-cookie-settings]');
    if (trigger) {
      event.preventDefault();
      showBanner();
    }
  });

  if (!stored) showBanner();

  function applyChoice(value) {
    const previous = readConsent();
    saveConsent(value);
    gtag('consent', 'update', { analytics_storage: value });
    if (value === 'denied' && previous === 'granted') clearGaCookies();
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
      '<p class="skc-text"><strong>Cookies för statistik</strong>' +
      'Vi vill använda Google Analytics för att förstå hur sajten används och göra den bättre. ' +
      'Uppgifterna används inte för annonser. Du kan också välja att bara tillåta nödvändiga cookies.</p>' +
      '<div class="skc-actions">' +
      '<button type="button" class="skc-btn" data-choice="denied">Endast nödvändiga</button>' +
      '<button type="button" class="skc-btn" data-choice="granted">Godkänn statistik</button>' +
      '</div>';
    el.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-choice]');
      if (btn) applyChoice(btn.getAttribute('data-choice'));
    });
    document.body.appendChild(el);
  }
}

const BANNER_CSS = `
#sk-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;box-sizing:border-box;background:#0F172A;color:#E2E8F0;border:1px solid rgba(255,255,255,0.16);border-radius:16px;padding:20px;box-shadow:0 18px 40px rgba(15,23,42,0.28);font-family:'Manrope',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.55;}
#sk-cookie-banner .skc-text{margin:0 0 16px;}
#sk-cookie-banner .skc-text strong{display:block;color:#fff;font-size:15px;font-weight:800;margin-bottom:4px;}
#sk-cookie-banner .skc-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;}
#sk-cookie-banner .skc-btn{flex:1 1 180px;min-height:44px;border-radius:12px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer;border:none;background:#fff;color:#0F172A;}
#sk-cookie-banner .skc-btn:focus-visible{outline:2px solid #AFC6E8;outline-offset:2px;}
`;

init();
