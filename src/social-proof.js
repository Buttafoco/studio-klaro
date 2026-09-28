/* ==========================================================================
   Studio Klaro – kundcase i social proof-sektionen (#referenser). Stil: src/social-proof.css.
   Läser varje cases datablock (.pc-data) och visar KPI-raden endast när minst en KPI har
   värde, etikett, mätperiod och källa (src/proof-kpi.mjs). Utan giltiga KPI:er – eller utan
   JS – förblir raden dold, så inga tomma eller påhittade siffror kan visas.
   ========================================================================== */
import { parseCase, renderKpis } from './proof-kpi.mjs';

document.querySelectorAll('#referenser .pc').forEach(function (card) {
  var dataEl = card.querySelector('.pc-data');
  var slot = card.querySelector('[data-kpi-slot]');
  if (!dataEl || !slot) return;
  var data = parseCase(dataEl.textContent);
  if (!data) return;
  card.setAttribute('data-status', data.status);
  var html = renderKpis(data.kpis);
  if (!html) return;
  slot.innerHTML = html;
  slot.hidden = false;
});
