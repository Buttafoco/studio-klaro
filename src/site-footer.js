/* Studio Klaro – gemensam footer: signaturens understreck ritas en gång när det syns,
   och "Tillbaka till toppen" scrollar mjukt (direkt vid reducerad rörelse). */
(function () {
  var footer = document.querySelector('.sf');
  if (!footer) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mark = footer.querySelector('.sf-mark');
  if (mark && !reduce && 'IntersectionObserver' in window) {
    footer.classList.add('sf-js');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      mark.classList.add('is-drawn');
      io.disconnect();
    }, { threshold: 0.6 });
    io.observe(mark);
  }

  var toTop = footer.querySelector('[data-sf-top]');
  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
