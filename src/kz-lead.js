/* Förslagskort på undersidor (variation av startsidans "Se hur din hemsida kan se ut").
   Skickas via samma Web3Forms-lösning som övriga formulär. Markup: .kzf med data-kzf-kind och data-kzf-subject. */
(function () {
  var KEY = '3e1c55ed-82c4-435f-8126-33f86c5d4a92';
  document.querySelectorAll('.kzf').forEach(function (root) {
    var form = root.querySelector('.kzf-form'); if (!form) return;
    var site = form.querySelector('[name="site"]'), email = form.querySelector('[name="email"]');
    var siteErr = form.querySelector('[data-err="site"]'), emailErr = form.querySelector('[data-err="email"]');
    var formErr = form.querySelector('.kzf-formerr'), btn = form.querySelector('.kzf-btn');
    var ok = root.querySelector('.kzf-ok'), label = btn.textContent, sending = false;
    var kind = root.getAttribute('data-kzf-kind') || 'undersida-forslag';
    var subject = root.getAttribute('data-kzf-subject') || 'Förslagsförfrågan';
    function normUrl(v) {
      v = v.trim();
      if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      try { var x = new URL(v); if ((x.protocol === 'http:' || x.protocol === 'https:') && /^[^.\s]+(\.[^.\s]+)+$/.test(x.hostname)) return x.href; } catch (e) {}
      return null;
    }
    function mark(input, box, msg) { box.textContent = msg || ''; if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    site.addEventListener('input', function () { mark(site, siteErr, ''); formErr.textContent = ''; });
    email.addEventListener('input', function () { mark(email, emailErr, ''); formErr.textContent = ''; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var s = site.value.trim(), em = email.value.trim();
      var u = normUrl(s), sOk = !!u, emOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
      mark(site, siteErr, sOk ? '' : (s ? 'Ange en giltig webbadress, till exempel https://dittforetag.se.' : 'Fyll i din nuvarande hemsida.'));
      mark(email, emailErr, emOk ? '' : (em ? 'Ange en giltig e-postadress, till exempel du@foretag.se.' : 'Fyll i din e-post.'));
      if (!sOk || !emOk) { (sOk ? email : site).focus(); return; }
      sending = true; btn.disabled = true; btn.textContent = 'Skickar …';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ access_key: KEY, subject: subject + ' – ' + u, from_name: 'Studio Klaro – ' + subject.toLowerCase(), replyto: em,
          'Typ av förfrågan': kind, 'Nuvarande hemsida': u, 'E-post': em, 'Sida': location.pathname })
      })
        .then(function (r) { return r.json().then(function (d) { return r.ok && d && d.success; }); })
        .then(function (good) {
          if (!good) throw new Error('send');
          if (window.klaroTrackLead) window.klaroTrackLead(kind, kind);
          form.hidden = true; ok.hidden = false; ok.focus({ preventScroll: true });
        })
        .catch(function () {
          sending = false; btn.disabled = false; btn.textContent = label;
          formErr.textContent = 'Något gick fel när förfrågan skulle skickas. Försök igen eller mejla hej@studioklaro.se.';
        });
    });
  });
})();
