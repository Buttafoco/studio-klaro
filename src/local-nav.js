/* Lokalmeny (som på /seo-koll): ersätter huvudmenyn när elementet i data-after scrollats förbi. */
(function () {
  var bar = document.getElementById('sln');
  if (!bar) return;
  var ref = document.querySelector(bar.getAttribute('data-after') || 'main > section');
  if (!ref) return;
  var ticking = false;
  function update() {
    ticking = false;
    var on = ref.getBoundingClientRect().bottom < 90;
    bar.classList.toggle('is-on', on);
    document.documentElement.classList.toggle('sln-active', on);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
