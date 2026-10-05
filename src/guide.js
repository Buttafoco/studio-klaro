/* Studio Klaro – guider: headern krymper vid scroll (som på övriga sidor) och innehållsförteckningen
   markerar avsnittet som läses. Ingen rörelse i texten – bara en färg- och linjemarkering. */
(function () {
  var navWrap = document.querySelector('.nav-wrap');
  if (navWrap) {
    var onScroll = function () { navWrap.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.g-toc a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var sections = targets.map(function (h) { return h && h.closest('section'); });
  var visible = new Set();

  function mark() {
    // Det översta synliga avsnittet vinner; utan synligt avsnitt behålls senaste markeringen
    var index = -1;
    sections.forEach(function (s, i) { if (index < 0 && visible.has(s)) index = i; });
    if (index < 0) return;
    links.forEach(function (a, i) {
      a.classList.toggle('is-active', i === index);
      if (i === index) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    mark();
  }, { rootMargin: '-20% 0px -55% 0px' });
  sections.forEach(function (s) { if (s) io.observe(s); });
})();
