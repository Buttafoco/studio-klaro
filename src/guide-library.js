/* Studio Klaro – guidebiblioteket (/guider): kategorifilter.
   Knapparna (aria-pressed) visar guider vars data-category matchar. Vald kategori speglas i URL:en som
   ?kategori=<slug> (replaceState, så bakåtknappen inte fylls med filterbyten) och läses in vid sidladdning.
   Efter varje byte får de synliga guiderna sin layout efter position (utvald eller rutnät), och en
   aria-live-rad meddelar antalet. En framtida sökning kan återanvända apply() med ett eget villkor. */
(function () {
  var bar = document.querySelector('[data-gcat]');
  if (!bar) return;
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-cat]'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.gk-item'));
  var status = document.querySelector('[data-gcat-status]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var list = document.querySelector('.gk-list');
  // Samma regler som i scripts/build-guides.mjs: den första synliga är utvald, övriga ligger i ett rutnät med tre
  // kolumner – eller två när antalet går jämnt upp i två men inte i tre, så att inget kort blir ensamt på en rad.
  function cols(n) { var k = n - 1; return k % 3 === 0 ? 3 : (k % 2 === 0 || k === 1 ? 2 : 3); }

  function apply(cat, opts) {
    var matches = items.filter(function (li) { return !cat || li.getAttribute('data-category') === cat; });
    if (list) list.setAttribute('data-cols', String(cols(matches.length)));
    var shown = 0;
    items.forEach(function (li) {
      var match = matches.indexOf(li) > -1;
      var wasHidden = li.hidden;
      li.hidden = !match;
      li.classList.remove('is-lead', 'is-grid', 'is-entering');
      if (!match) return;
      li.classList.add(shown === 0 ? 'is-lead' : 'is-grid');
      if (wasHidden && opts.animate && !reduce) {
        void li.offsetWidth; // starta om intoningen
        li.classList.add('is-entering');
      }
      shown++;
    });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === cat)); });
    if (status) status.textContent = 'Visar ' + shown + (shown === 1 ? ' guide' : ' guider');
  }

  function catFromUrl() {
    var cat = new URLSearchParams(location.search).get('kategori') || '';
    return buttons.some(function (b) { return b.getAttribute('data-cat') === cat; }) ? cat : '';
  }

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat');
    apply(cat, { animate: true });
    try {
      var url = new URL(location.href);
      if (cat) url.searchParams.set('kategori', cat); else url.searchParams.delete('kategori');
      history.replaceState(history.state, '', url);
    } catch (err) { /* URL:en är en bekvämlighet – filtret fungerar ändå */ }
  });

  var initial = catFromUrl();
  if (initial) apply(initial, { animate: false });
})();
