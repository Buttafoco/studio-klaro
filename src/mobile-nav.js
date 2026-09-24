/* ==========================================================================
   Studio Klaro – mobilmeny (alla sidor). Stil: src/mobile-nav.css.
   Bygger en gemensam helskärmspanel utifrån sidans menyknapp (#mnav-toggle) och headerns CTA.
   - Tillgänglig modal navigation: aria-expanded/aria-controls, fokus in i menyn och fångat där,
     Escape och webbläsarens tillbaka stänger, bakgrunden är inert, fokus tillbaka till knappen.
   - Scrollåsning utan att sidan bakom flyttar sig (overflow på roten + scrollbar-gutter).
   - Sidbyte: vald rad markeras, panelen ligger kvar och täcker, navigeringen startar bakom den
     och sidövergången (page-transition, pt-cover) låter panelen glida upp på den nya sidan.
     Ankare på samma sida: sektionen placeras bakom panelen innan den dras tillbaka.
   ========================================================================== */
(function () {
  var toggle = document.getElementById('mnav-toggle');
  var navWrap = toggle && toggle.closest('.nav-wrap');
  if (!toggle || !navWrap) return;

  var root = document.documentElement;
  var mq = window.matchMedia('(max-width: 820px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OPEN_MS = reduce ? 200 : 520;
  var CLOSE_MS = reduce ? 200 : 520;

  var ITEMS = [
    ['Process', '/#processen', 'Så går det till'],
    ['Case', '/#portfolio', 'Se vad vi har byggt'],
    ['SEO', '/seo-koll', 'Få koll på synligheten'],
    ['Priser', '/priser', 'Hitta rätt upplägg'],
    ['Om', '/om', 'Lär känna Studio Klaro']
  ];
  var norm = function (p) { p = p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, ''); return p || '/'; };
  var here = norm(location.pathname);

  // Headerns CTA gäller även i menyn (samma text och mål som på desktop)
  var headCta = navWrap.querySelector('a[data-rhide]');
  var ctaText = headCta ? headCta.textContent.replace(/\s*→\s*$/, '').trim() : 'Få en gratis genomgång';
  var ctaHref = headCta ? headCta.getAttribute('href') : '/#kontakt';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARROW = '<svg class="mnav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg>';

  /* ---------- Panelen ---------- */
  var panel = document.createElement('div');
  panel.className = 'mnav';
  panel.id = 'mnav';
  panel.innerHTML =
    '<div class="mnav-scroll"><div class="mnav-inner">' +
      '<nav aria-label="Huvudmeny"><ol class="mnav-list">' +
      ITEMS.map(function (it, i) {
        // Aktuell sida; case-sidorna hör till Case (som pekar på startsidans sektion, därför aria-current="true")
        var page = norm(it[1].split('#')[0]) === here && it[1].indexOf('#') < 0;
        var cur = page || (it[0] === 'Case' && /^\/case-/.test(here));
        return '<li class="mnav-item" style="--i:' + i + '"><a class="mnav-link" href="' + it[1] + '"' + (cur ? ' aria-current="' + (page ? 'page' : 'true') + '"' : '') + '>' +
          '<span class="mnav-n" aria-hidden="true">0' + (i + 1) + '</span>' +
          '<span><span class="mnav-t">' + it[0] + '</span>' +
          '<span class="mnav-d">' + (cur ? '<span class="mnav-here">Du är här</span>' : it[2]) + '</span></span>' + ARROW + '</a></li>';
      }).join('') +
      '</ol></nav>' +
      '<div class="mnav-foot mnav-item" style="--i:6.5">' +
        '<a class="mnav-cta" href="' + esc(ctaHref) + '">' + esc(ctaText) + ' <span aria-hidden="true">→</span></a>' +
        '<p class="mnav-contact"><a href="mailto:hej@studioklaro.se">hej@studioklaro.se</a><span>Stockholm · Vardagar 09–17</span></p>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(panel);
  var scroller = panel.querySelector('.mnav-scroll');

  toggle.setAttribute('aria-controls', 'mnav');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Öppna meny');

  /* ---------- Bakgrunden: inert medan menyn är öppen (headern med logga och knapp undantas) ---------- */
  var inerted = [];
  function setInert(on) {
    if (!on) { inerted.forEach(function (n) { n.inert = false; }); inerted = []; return; }
    var el = navWrap;
    while (el && el.parentElement) {
      var p = el.parentElement;
      Array.prototype.forEach.call(p.children, function (s) {
        if (s === el || s === panel || s.inert || /^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(s.tagName)) return;
        s.inert = true; inerted.push(s);
      });
      if (p === document.body) break;
      el = p;
    }
  }

  /* ---------- Öppna / stäng ---------- */
  var isOpen = false, pushed = false, ignorePop = false, popCb = null, endT = 0, focusT = 0;
  function focusables() {
    var list = Array.prototype.slice.call(navWrap.querySelectorAll('a[href],button')).concat(Array.prototype.slice.call(panel.querySelectorAll('a[href]')));
    return list.filter(function (n) { return n.offsetParent !== null || n === toggle; });
  }
  function setIcon(open) {
    root.classList.toggle('mnav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny');
  }

  function open() {
    if (isOpen || !mq.matches) return;
    isOpen = true;
    clearTimeout(endT);
    panel.classList.remove('is-leaving', 'is-fading');
    panel.querySelectorAll('.is-picked').forEach(function (n) { n.classList.remove('is-picked'); });
    scroller.scrollTop = 0;
    root.classList.add('mnav-active', 'mnav-lock');
    setIcon(true);
    setInert(true);
    void panel.offsetWidth;                         // startläget registreras innan övergången
    panel.classList.add('is-open');
    try { history.pushState({ mnav: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    clearTimeout(focusT);
    focusT = setTimeout(function () {
      var first = panel.querySelector('.mnav-link');
      if (isOpen && first) first.focus({ preventScroll: true });
    }, reduce ? 0 : 200);
  }

  // Stänger: innehållet tonas bort, panelen dras upp mot headern, krysset blir menyikon, fokus till knappen
  function close(opts) {
    opts = opts || {};
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(focusT);
    panel.classList.remove('is-open');
    setIcon(false);
    root.classList.remove('mnav-lock');
    setInert(false);
    if (!opts.noFocus) toggle.focus({ preventScroll: true });
    endT = setTimeout(function () {
      root.classList.remove('mnav-active');
      panel.classList.remove('is-leaving', 'is-fading');
    }, CLOSE_MS);
    if (pushed && !opts.fromPop) { pushed = false; ignorePop = true; history.back(); }
  }

  // Direkt återställning (bredd över brytpunkten, tillbaka från bfcache)
  function reset() {
    isOpen = false; pushed = false; popCb = null;
    clearTimeout(endT); clearTimeout(focusT);
    panel.classList.remove('is-open', 'is-leaving', 'is-fading');
    setIcon(false);
    root.classList.remove('mnav-active', 'mnav-lock', 'mnav-leaving');
    setInert(false);
  }

  // Tar bort menyns egen historikpost innan något annat sker (ankare på samma sida)
  function unwindHistory(cb) {
    if (!pushed) { cb(); return; }
    pushed = false; ignorePop = true; popCb = cb;
    history.back();
    setTimeout(function () { if (popCb) { var f = popCb; popCb = null; f(); } }, 400);
  }

  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    if (isOpen) close(); else open();
  });

  window.addEventListener('popstate', function () {
    if (ignorePop) {
      ignorePop = false;
      if (popCb) { var f = popCb; popCb = null; f(); }
      return;
    }
    if (isOpen) { pushed = false; close({ fromPop: true }); }   // tillbaka-knappen stänger menyn
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
  });

  // Loggan i headern leder till startsidan: samma sammanhängande sidbyte som menylänkarna
  navWrap.addEventListener('click', function (e) {
    if (!isOpen) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && !a.hasAttribute('data-rhide')) go(a, e);
  });
  panel.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) go(a, e);
  });

  function go(a, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;            // mailto m.m.: webbläsarens vanliga beteende
    e.preventDefault();
    var samePage = norm(url.pathname) === here && url.search === location.search;
    var row = a.classList.contains('mnav-link') ? a : null;
    if (row) row.classList.add('is-picked');
    panel.classList.add('is-leaving');

    if (samePage) {
      var target = null;
      if (url.hash) { try { target = document.querySelector(decodeURIComponent(url.hash)); } catch (err) { target = null; } }
      setTimeout(function () {
        unwindHistory(function () {
          if (target) {
            // Sektionen placeras bakom panelen, sedan dras panelen tillbaka och visar den
            root.classList.remove('mnav-lock');
            var sm = parseFloat(getComputedStyle(target).scrollMarginTop) || 100;
            window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - sm), behavior: 'instant' });
            try { history.replaceState(history.state, '', url.hash); } catch (err) {}
          }
          close({ noFocus: !!target });
          if (target) {
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
        });
      }, reduce ? 0 : 180);
      return;
    }

    // Annan sida: raden markeras, innehållet tonas bort och panelen täcker medan nya sidan laddas
    setTimeout(function () {
      panel.classList.add('is-fading');
      root.classList.add('mnav-leaving');
    }, reduce ? 0 : 160);
    setTimeout(function () {
      try {
        sessionStorage.setItem('pt-arrive', '1');
        sessionStorage.setItem('pt-cover', '1');
        sessionStorage.removeItem('pt-y');
      } catch (err) {}
      // Menyns historikpost ersätts, så att tillbaka leder till föregående sida och inte till en öppen meny
      if (pushed) { pushed = false; location.replace(url.href); }
      else location.assign(url.href);
    }, reduce ? 60 : 420);
  }

  var onMq = function () { if (!mq.matches && (isOpen || root.classList.contains('mnav-active'))) reset(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
})();
