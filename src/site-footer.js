/* Studio Klaro – gemensam footer: signaturen studsar upp en gång när den syns och vickar vid hover,
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

  // Gelé-vick vid hover: klassen tas bort först när animationen spelat klart, så den aldrig hackar av
  if (mark && !reduce) {
    var rows = mark.querySelectorAll('.sf-mark-row');
    var last = rows[rows.length - 1];
    var jelly = function () {
      if (!mark.classList.contains('is-drawn') || mark.classList.contains('is-jelly')) return;
      mark.classList.add('is-jelly');
    };
    mark.addEventListener('mouseenter', jelly);
    mark.addEventListener('focus', jelly);
    if (last) last.addEventListener('animationend', function () { mark.classList.remove('is-jelly'); });
  }

  var toTop = footer.querySelector('[data-sf-top]');
  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
