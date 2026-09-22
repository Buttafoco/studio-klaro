/* ==========================================================================
   Studio Klaro – flytande formulärrad ("Få konkreta idéer") för undersidorna.
   Samma formulär, steg, validering och inskickning som på startsidan. Raden
   glider upp när besökaren har scrollat en bit och göms igen högst upp på sidan
   samt när sidans eget formulär syns.
   Startsidan och portfolio har egna kopior av formuläret och använder inte den här filen.
   ========================================================================== */
var esc = function (s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
};
var WZ_TEMPLATE = "\n\n    <!-- SUCCESS -->\n    <div id=\"wz-success\" class=\"wz-card\" style=\"display:none;text-align:center;animation:fadeUp .5s cubic-bezier(0.22,1,0.36,1);\">\n      <div style=\"width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#146EF5,#3B8CFF);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;margin:12px auto 24px;box-shadow:0 10px 24px rgba(20,110,245,0.35);\" aria-hidden=\"true\">✓</div>\n      <h3 id=\"wz-success-title\" tabindex=\"-1\" style=\"font-size:24px;font-weight:800;color:#0F172A;margin:0 0 14px;line-height:1.3;outline:none;\">Tack! Vi kikar på det.</h3>\n      <p style=\"font-size:15px;color:#52657A;line-height:1.6;margin:0 0 24px;\">Vi går igenom det du skickat och återkommer personligt så snart vi kan.</p>\n      <div style=\"display:flex;gap:8px;justify-content:center;margin-bottom:12px;\" aria-hidden=\"true\">\n        <div style=\"width:8px;height:8px;border-radius:50%;background:#146EF5;\"></div>\n        <div style=\"width:8px;height:8px;border-radius:50%;background:#146EF5;\"></div>\n        <div style=\"width:8px;height:8px;border-radius:50%;background:#146EF5;\"></div>\n      </div>\n    </div>\n\n    <!-- FORM -->\n    <div id=\"wz-form-wrap\">\n      <form id=\"wz-form\" novalidate>\n        <div id=\"wz-card\" class=\"wz-card wz-prompt-card\">\n          <!-- Steg 1: prompt -->\n          <label for=\"wz-f-message\" class=\"sr-only\">Berätta kort om ditt företag och vad du vill förbättra</label>\n          <textarea class=\"wz-input wz-prompt\" id=\"wz-f-message\" data-field=\"message\" rows=\"5\" placeholder=\"Berätta kort om ditt företag och vad du vill förbättra…\" aria-describedby=\"wz-prompt-hint\"></textarea>\n          <div id=\"wz-prompt-error\" class=\"wz-prompt-error\" role=\"alert\"></div>\n          <div id=\"wz-prompt-bar\" class=\"wz-prompt-bar\">\n            <div id=\"wz-prompt-hint\" class=\"wz-prompt-hint\">Några rader räcker – du får personlig återkoppling.</div>\n            <button type=\"button\" id=\"wz-next\" class=\"wz-next btn-lift lift-primary\" aria-controls=\"wz-expand\" aria-expanded=\"false\">Få konkreta idéer <span aria-hidden=\"true\">→</span></button>\n          </div>\n\n          <!-- Steg 2: kontaktuppgifter -->\n          <div id=\"wz-expand\" class=\"wz-expand\" inert>\n            <div class=\"wz-expand-inner\">\n              <div class=\"wz-step2\" role=\"group\" aria-labelledby=\"wz-step2-title\">\n                <div id=\"wz-step2-title\" class=\"wz-step2-title\">Toppen! Vart ska vi skicka idéerna?</div>\n                <div class=\"wz-fields\">\n                  <div>\n                    <label for=\"wz-f-name\" class=\"wz-label\">Namn *</label>\n                    <input class=\"wz-input\" id=\"wz-f-name\" type=\"text\" placeholder=\"Ditt namn\" data-field=\"name\" autocomplete=\"name\">\n                  </div>\n                  <div>\n                    <label for=\"wz-f-email\" class=\"wz-label\">E-post *</label>\n                    <input class=\"wz-input\" id=\"wz-f-email\" type=\"email\" placeholder=\"din@email.se\" data-field=\"email\" autocomplete=\"email\">\n                  </div>\n                  <div>\n                    <label for=\"wz-f-company\" class=\"wz-label\">Företagsnamn *</label>\n                    <input class=\"wz-input\" id=\"wz-f-company\" type=\"text\" placeholder=\"Företagets namn\" data-field=\"company\" autocomplete=\"organization\">\n                  </div>\n                  <div>\n                    <label for=\"wz-f-website\" class=\"wz-label\">Nuvarande hemsida <span style=\"color:#8FA6C2;font-weight:600;\">(valfritt)</span></label>\n                    <input class=\"wz-input\" id=\"wz-f-website\" type=\"text\" placeholder=\"https://...\" data-field=\"website\" autocomplete=\"url\" aria-describedby=\"wz-website-hint\">\n                    <div id=\"wz-website-hint\" style=\"font-size:12px;color:#8FA6C2;margin-top:6px;\">Lämna tomt om du inte har någon hemsida idag.</div>\n                  </div>\n                </div>\n                <div style=\"margin-bottom:26px;\">\n                  <div id=\"wz-goals-label\" class=\"wz-label\" style=\"margin-bottom:12px;\">Vad vill du ha hjälp med? *</div>\n                  <div id=\"wz-goals\" class=\"wz-goals\" role=\"group\" aria-labelledby=\"wz-goals-label\" style=\"display:flex;flex-wrap:wrap;gap:10px;\"></div>\n                </div>\n\n                <div id=\"wz-error\" aria-live=\"polite\" style=\"font-size:13px;color:#D64545;font-weight:600;margin-bottom:14px;display:none;\"></div>\n                <div id=\"wz-btnrow\" class=\"wz-btnrow\" style=\"display:flex;justify-content:flex-end;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;\">\n                  <button type=\"button\" id=\"wz-callback-toggle\" class=\"wz-callback-toggle\" style=\"background:transparent;border:1.5px solid rgba(15,23,42,0.15);color:#0F172A;font-size:13px;font-weight:700;padding:14px 16px;border-radius:12px;cursor:pointer;font-family:inherit;transition:transform 0.2s cubic-bezier(0.22,1,0.36,1);\">Bli kontaktad istället</button>\n                  <button type=\"submit\" id=\"wz-submit\" class=\"wz-submit btn-next\" style=\"background:#146EF5;color:#fff;font-size:15px;font-weight:700;padding:15px 32px;border-radius:14px;border:none;cursor:pointer;box-shadow:0 10px 24px rgba(20,110,245,0.3);font-family:inherit;\">Få min gratis genomgång →</button>\n                </div>\n                <div id=\"wz-form-note\" class=\"wz-form-note\">\n                  <div style=\"text-align:right;font-size:12px;color:#52657A;line-height:1.5;\">Vi återkommer personligt så snart vi kan.</div>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </form>\n\n      <div id=\"wz-callback-panel\" style=\"overflow:hidden;max-height:0;transition:max-height 0.4s cubic-bezier(0.22,1,0.36,1);\">\n        <div id=\"wz-callback-success\" style=\"display:none;background:#0F172A;border-radius:16px;padding:36px;margin-top:16px;text-align:center;\">\n          <div style=\"width:52px;height:52px;border-radius:50%;background:#146EF5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px;\">✓</div>\n          <div style=\"font-size:19px;font-weight:800;color:#fff;margin-bottom:8px;\">Tack, <span id=\"wz-callback-succ-name\"></span>!</div>\n          <div style=\"font-size:14px;color:#B8C6DC;line-height:1.6;\">Vi har tagit emot din förfrågan och kontaktar dig inom en timme under vardagar 09–17.</div>\n        </div>\n        <form id=\"wz-callback-form\" novalidate style=\"background:#0F172A;border-radius:16px;padding:24px;margin-top:16px;\">\n          <div style=\"font-size:16px;font-weight:800;color:#fff;margin-bottom:6px;\">Bli kontaktad istället?</div>\n          <div style=\"font-size:13px;color:#B8C6DC;margin-bottom:16px;\">Lämna dina uppgifter, vi kontaktar dig inom en timme under vardagar 09–17.</div>\n          <div style=\"display:flex;flex-direction:column;gap:12px;\">\n            <input id=\"wz-cb-name\" type=\"text\" placeholder=\"Namn *\" style=\"background:#1B2A44;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#fff;\">\n            <input id=\"wz-cb-email\" type=\"email\" placeholder=\"Email *\" style=\"background:#1B2A44;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#fff;\">\n            <input id=\"wz-cb-phone\" type=\"tel\" placeholder=\"Telefonnummer *\" style=\"background:#1B2A44;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#fff;\">\n            <input id=\"wz-cb-company\" type=\"text\" placeholder=\"Företag (valfritt)\" style=\"background:#1B2A44;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#fff;\">\n            <input id=\"wz-cb-website\" type=\"url\" placeholder=\"Hemsida (valfritt)\" style=\"background:#1B2A44;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#fff;\">\n            <div id=\"wz-callback-error\" style=\"font-size:13px;color:#FF8A8A;font-weight:600;display:none;\">Fyll i namn, e-post och telefonnummer.</div>\n            <button type=\"submit\" id=\"wz-callback-submit\" style=\"background:#146EF5;color:#fff;font-size:14px;font-weight:700;padding:12px 22px;border-radius:12px;border:none;white-space:nowrap;cursor:pointer;align-self:flex-start;transition:transform 0.2s cubic-bezier(0.22,1,0.36,1);\">Skicka</button>\n          </div>\n        </form>\n      </div>\n    </div>\n";

  var WEB3FORMS_KEY = '3e1c55ed-82c4-435f-8126-33f86c5d4a92';

  var goalOptions = ['Förbättra befintlig hemsida','Ny hemsida','SEO / synlighet','Vet inte än'];

  // Samma formulär (steg, validering, inskick) på flera ställen: varje [data-wz-mount]
  // får en egen klon av #wz-template och en egen, självständig instans av logiken nedan.
  var WZ_REF_ATTRS = ['for', 'aria-controls', 'aria-labelledby', 'aria-describedby'];
  function mountLeadForm(mount) {
    var key = mount.getAttribute('data-wz-mount');
    var holder = document.createElement('template');
    holder.innerHTML = WZ_TEMPLATE;
    var frag = holder.content;
    frag.querySelectorAll('[id]').forEach(function (el) { el.id = el.id + '-' + key; });
    frag.querySelectorAll('[' + WZ_REF_ATTRS.join('],[') + ']').forEach(function (el) {
      WZ_REF_ATTRS.forEach(function (attr) {
        var v = el.getAttribute(attr);
        if (v) el.setAttribute(attr, v.split(/\s+/).map(function (id) { return id + '-' + key; }).join(' '));
      });
    });
    mount.appendChild(frag);
    initLeadForm(mount, key);
  }

  function initLeadForm(root, key) {
    var $ = function (id) { return root.querySelector('#' + id + '-' + key); };

    var wz = { submitting: false, name: '', company: '', email: '', website: '', goal: '', message: '' };

    var errorBox = $('wz-error');
    var formEl = $('wz-form');
    var formWrap = $('wz-form-wrap');
    var successEl = $('wz-success');
    var submitBtn = $('wz-submit');
    var goalsWrap = $('wz-goals');
    var nameInput = $('wz-f-name');
    var emailInput = $('wz-f-email');
    var companyInput = $('wz-f-company');
    var websiteInput = $('wz-f-website');
    var messageInput = $('wz-f-message');

    // Tvåstegsflöde: steg 1 är prompten (Kort beskrivning), steg 2 kontaktuppgifterna.
    // Att gå vidare till steg 2 skickar ingenting och triggar inga lead-event.
    var promptCard = $('wz-card');
    var promptError = $('wz-prompt-error');
    var nextBtn = $('wz-next');
    var successTitle = $('wz-success-title');
    var expandWrap = $('wz-expand');
    var formExpanded = false;
    function revealForm() {
      if (formExpanded) return;
      formExpanded = true;
      promptCard.classList.add('is-step2');
      expandWrap.classList.add('wz-open');
      expandWrap.removeAttribute('inert');
      nextBtn.setAttribute('aria-expanded', 'true');
    }
    function setPromptInvalid(bad) {
      messageInput.classList.toggle('wz-invalid', bad);
      promptCard.classList.toggle('wz-card-invalid', bad);
      if (bad) messageInput.setAttribute('aria-invalid', 'true');
      else messageInput.removeAttribute('aria-invalid');
    }
    function goToStep2() {
      if (messageInput.value.trim() === '') {
        setPromptInvalid(true);
        promptError.textContent = 'Skriv några rader om ditt företag och vad du vill ha hjälp med först.';
        messageInput.focus();
        return;
      }
      setPromptInvalid(false);
      promptError.textContent = '';
      revealForm();
      nameInput.focus();
    }
    nextBtn.addEventListener('click', goToStep2);
    // Cmd/Ctrl + Enter i prompten tar en vidare, som i en chatt. Vanlig Enter ger radbrytning.
    messageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !formExpanded) {
        e.preventDefault();
        goToStep2();
      }
    });
    messageInput.addEventListener('input', function () {
      setPromptInvalid(false);
      promptError.textContent = '';
    });
    // Om kontaktfälten redan innehåller data vid sidladdning (t.ex. bfcache/autofill) visas steg 2 direkt.
    if (nameInput.value !== '' || emailInput.value !== '' || companyInput.value !== '' || websiteInput.value !== '') {
      revealForm();
    }

    // "Bli kontaktad istället" – fällbar panel
    var callbackToggle = $('wz-callback-toggle');
    var callbackPanel = $('wz-callback-panel');
    var callbackFormEl = $('wz-callback-form');
    var callbackSuccess = $('wz-callback-success');
    var callbackSuccName = $('wz-callback-succ-name');
    var callbackError = $('wz-callback-error');
    var callbackSubmit = $('wz-callback-submit');
    var cbName = $('wz-cb-name');
    var cbEmail = $('wz-cb-email');
    var cbPhone = $('wz-cb-phone');
    var cbCompany = $('wz-cb-company');
    var cbWebsite = $('wz-cb-website');
    var CALLBACK_MAX = '540px';
    var callbackOpen = false;

    function resetCallbackView() {
      callbackSuccess.style.display = 'none';
      callbackFormEl.style.display = 'block';
      callbackError.style.display = 'none';
    }
    callbackToggle.addEventListener('click', function () {
      callbackOpen = !callbackOpen;
      if (callbackOpen) resetCallbackView();
      callbackPanel.style.maxHeight = callbackOpen ? CALLBACK_MAX : '0';
    });
    callbackFormEl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (callbackSubmit.disabled) return;
      var name = cbName.value.trim(), email = cbEmail.value.trim(), phone = cbPhone.value.trim();
      if (!name || !email || !phone) { callbackError.style.display = 'block'; return; }
      callbackError.style.display = 'none';
      callbackSubmit.disabled = true;
      callbackSubmit.textContent = 'Skickar …';
      var ok = function () {
        callbackSuccName.textContent = name;
        callbackSuccess.style.display = 'block';
        callbackFormEl.style.display = 'none';
        callbackPanel.style.maxHeight = CALLBACK_MAX;
      };
      if (!WEB3FORMS_KEY) { ok(); return; }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Bli kontaktad – begäran från webbplatsen',
          from_name: 'Studio Klaro – kontaktförfrågan',
          replyto: email,
          'Namn': name,
          'E-post': email,
          'Telefonnummer': phone,
          'Företag': cbCompany.value.trim() || '—',
          'Hemsida': cbWebsite.value.trim() || '—'
        })
      })
        .then(function (r) {
          return r.json().then(function (d) {
            if (r.ok && d && d.success && window.klaroTrackLead) window.klaroTrackLead('bli_kontaktad', key);
          }, function () {});
        })
        .then(function () { ok(); })
        .catch(function () { ok(); });
    });

    root.querySelectorAll('.wz-input').forEach(function (input) {
      input.addEventListener('input', function () {
        wz[input.getAttribute('data-field')] = input.value;
        input.classList.remove('wz-invalid');
        errorBox.style.display = 'none';
      });
    });

    function buildChips(container, options, field) {
      container.innerHTML = options.map(function (o) {
        return '<button type="button" class="wz-chip" data-val="' + esc(o) + '">' + esc(o) + '</button>';
      }).join('');
      container.querySelectorAll('.wz-chip').forEach(function (btn) {
        btn.addEventListener('click', function () {
          wz[field] = btn.getAttribute('data-val');
          container.querySelectorAll('.wz-chip').forEach(function (b) {
            b.classList.toggle('selected', b.getAttribute('data-val') === wz[field]);
          });
          container.classList.remove('wz-goals-invalid');
          errorBox.style.display = 'none';
        });
      });
    }
    buildChips(goalsWrap, goalOptions, 'goal');

    function validateAndMark() {
      var ok = true;
      // Läs om fälten så att värden som återställts utan input-event (bfcache/autofill) också räknas.
      root.querySelectorAll('.wz-input').forEach(function (input) {
        wz[input.getAttribute('data-field')] = input.value;
      });
      [
        [nameInput, wz.name],
        [emailInput, wz.email],
        [companyInput, wz.company],
        [messageInput, wz.message]
      ].forEach(function (pair) {
        var bad = pair[1].trim() === '';
        pair[0].classList.toggle('wz-invalid', bad);
        if (bad) ok = false;
      });
      setPromptInvalid(wz.message.trim() === '');
      var goalBad = wz.goal.trim() === '';
      goalsWrap.classList.toggle('wz-goals-invalid', goalBad);
      if (goalBad) ok = false;
      return ok;
    }

    function showSuccess() {
      formWrap.style.display = 'none';
      successEl.style.display = 'block';
      successTitle.focus({ preventScroll: true });
      // Formuläret var högre än kvittot – se till att kvittot hamnar i synfältet.
      successEl.scrollIntoView({ block: 'center' });
    }

    function resetSubmitBtn() {
      wz.submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Få min gratis genomgång →';
      submitBtn.style.opacity = '1';
    }

    function submitForm() {
      if (wz.submitting) return;
      if (!validateAndMark()) {
        errorBox.textContent = 'Fyll i namn, e-post, företagsnamn, vad du behöver hjälp med och en kort beskrivning för att skicka.';
        errorBox.style.display = 'block';
        return;
      }
      errorBox.style.display = 'none';
      if (!WEB3FORMS_KEY) {
        errorBox.textContent = 'Formuläret är inte kopplat än (access key saknas). Mejla oss på hej@studioklaro.se så länge.';
        errorBox.style.display = 'block';
        return;
      }
      wz.submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Skickar …';
      submitBtn.style.opacity = '0.75';

      var payload = {
        access_key: WEB3FORMS_KEY,
        subject: 'Ny förfrågan – ' + (wz.company || 'okänt företag'),
        from_name: 'Studio Klaro – webbformulär',
        replyto: wz.email,
        'Namn': wz.name,
        'Företag': wz.company,
        'E-post': wz.email,
        'Nuvarande hemsida': wz.website || '—',
        'Vad de behöver hjälp med': wz.goal,
        'Kort beskrivning': wz.message
      };

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.success) {
            if (window.klaroTrackLead) window.klaroTrackLead('kontakt_genomgang', key);
            showSuccess();
          } else {
            resetSubmitBtn();
            errorBox.textContent = 'Något gick fel när förfrågan skulle skickas. Försök igen eller mejla hej@studioklaro.se.';
            errorBox.style.display = 'block';
          }
        })
        .catch(function () {
          resetSubmitBtn();
          errorBox.textContent = 'Kunde inte nå servern. Kontrollera din uppkoppling eller mejla hej@studioklaro.se.';
          errorBox.style.display = 'block';
        });
    }
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      // Säkerhetsspärr: skicka aldrig från steg 1, gå bara vidare.
      if (!formExpanded) { goToStep2(); return; }
      submitForm();
    });
  }


/* Montera alla formulärplatser på sidan (raden och eventuella formulär i innehållet) */
document.querySelectorAll('[data-wz-mount]').forEach(mountLeadForm);

/* Styr när den flytande raden syns */
(function () {
  var dock = document.getElementById('wz-dock');
  if (!dock) return;
  var mount = dock.querySelector('[data-wz-mount]');
  if (!mount) return;

  var msg = document.getElementById('wz-f-message-dock');
  var card = document.getElementById('wz-card-dock');
  // Raden göms när sidans eget formulär syns – och när en yta som inte får skymmas är i bild
  // (t.ex. jämförelsetabeller och FAQ, markerade med data-wz-dock-clear).
  var blockers = Array.prototype.slice.call(document.querySelectorAll('[data-wz-mount],[data-wz-dock-clear]'))
    .filter(function (el) { return el !== mount && !dock.contains(el); });
  var formVisible = false;

  function focusInside() { return dock.contains(document.activeElement); }
  function evaluate() {
    var vh = window.innerHeight;
    var past = window.scrollY > vh * 0.8;
    var atTop = window.scrollY < vh * 0.45;
    var show = past && !formVisible;
    // Dölj aldrig raden mitt i en inmatning – vänta tills fokus lämnat den.
    if (!show && focusInside()) return;
    if (show) dock.classList.add('is-shown');
    else if (atTop || formVisible || !past) dock.classList.remove('is-shown');
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; evaluate(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Sidans eget formulär (om det finns) har företräde – då göms raden.
  if (blockers.length && 'IntersectionObserver' in window) {
    var visible = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = visible.indexOf(e.target);
        if (e.isIntersecting && i === -1) visible.push(e.target);
        else if (!e.isIntersecting && i > -1) visible.splice(i, 1);
      });
      formVisible = visible.length > 0;
      evaluate();
    }, { rootMargin: '0px 0px -10% 0px' });
    blockers.forEach(function (el) { io.observe(el); });
  }

  // Öppet läge: vid fokus, när fältet har text, i steg 2 och efter inskickning. Text bevaras alltid.
  function syncOpen() {
    var wrap = document.getElementById('wz-form-wrap-dock');
    var open = focusInside() || (msg && msg.value.trim() !== '') ||
      (card && card.classList.contains('is-step2')) || !wrap || wrap.style.display === 'none';
    dock.classList.toggle('is-open', !!open);
    dock.classList.toggle('has-text', !!(msg && msg.value.trim() !== ''));
  }
  dock.addEventListener('focusin', syncOpen);
  dock.addEventListener('focusout', function () { setTimeout(function () { syncOpen(); evaluate(); }, 0); });
  if (msg) msg.addEventListener('input', syncOpen);
  if (card) card.addEventListener('mousedown', function (e) {
    if (!dock.classList.contains('is-open') && !e.target.closest('button') && msg) { e.preventDefault(); msg.focus(); }
  });
  syncOpen();
  evaluate();
})();
