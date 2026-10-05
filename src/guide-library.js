/* Studio Klaro – guidebiblioteket (/guider): kategorifilter.
   Knapparna (aria-pressed) visar guider vars data-category matchar. Vald kategori speglas i URL:en som
   ?kategori=<slug> (replaceState, så bakåtknappen inte fylls med filterbyten) och läses in vid sidladdning.
   Efter varje byte får de synliga guiderna sin layout efter position (utvald, nästa, rutnät), och en
   aria-live-rad meddelar antalet. En framtida sökning kan återanvända apply() med ett eget villkor. */
(function () {
  var bar = document.querySelector('[data-gcat]');
  if (!bar) return;
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-cat]'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.gk-item'));
  var status = document.querySelector('[data-gcat-status]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var POS = ['is-lead', 'is-next'];

  function apply(cat, opts) {
    var shown = 0;
    items.forEach(function (li) {
      var match = !cat || li.getAttribute('data-category') === cat;
      var wasHidden = li.hidden;
      li.hidden = !match;
      li.classList.remove('is-lead', 'is-next', 'is-grid', 'is-entering');
      if (!match) return;
      li.classList.add(POS[shown] || 'is-grid');
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
