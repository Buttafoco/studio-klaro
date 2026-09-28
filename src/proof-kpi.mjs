/* ==========================================================================
   Studio Klaro – datamodell för kundcase i social proof-sektionen.
   Varje case har ett JSON-block (<script type="application/json" class="pc-data">) med:
     id, status ('published' = publicerat kundprojekt | 'concept' = illustrativt koncept),
     company, industry, location, url (publicerad hemsida, valfri), caseUrl, kpis[].
   En KPI är { value, label, period, source } – alla fyra krävs. Ofullständiga KPI:er
   visas aldrig, och KPI-raden visas inte alls förrän minst en giltig KPI finns.
   Ren logik utan DOM; testas i tests/proof-kpi.test.mjs, används av src/social-proof.js.
   ========================================================================== */

export const KPI_FIELDS = ['value', 'label', 'period', 'source'];
export const STATUSES = ['published', 'concept'];

function filled(v) { return typeof v === 'string' ? v.trim() !== '' : typeof v === 'number' && isFinite(v); }

// Bara KPI:er där värde, etikett, mätperiod och källa finns
export function validKpis(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((k) => k && typeof k === 'object' && KPI_FIELDS.every((f) => filled(k[f])));
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(v) { return String(v).replace(/[&<>"']/g, (c) => ESC[c]); }

// HTML för KPI-raden; tom sträng när inga giltiga KPI:er finns (då visas inget)
export function renderKpis(list) {
  const kpis = validKpis(list);
  if (!kpis.length) return '';
  return '<dl class="pc-kpi-list">' + kpis.map((k) =>
    '<div class="pc-kpi"><dt class="pc-kpi-l">' + esc(k.label) + '</dt>' +
    '<dd class="pc-kpi-v">' + esc(k.value) + '</dd>' +
    '<dd class="pc-kpi-src">' + esc(k.period) + ' · Källa: ' + esc(k.source) + '</dd></div>'
  ).join('') + '</dl>';
}

// Läser och validerar ett case-block; okänd status behandlas som koncept (aldrig som publicerat)
export function parseCase(json) {
  let d;
  try { d = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return null; }
  if (!d || typeof d !== 'object') return null;
  return {
    id: String(d.id || ''),
    status: STATUSES.indexOf(d.status) !== -1 ? d.status : 'concept',
    company: String(d.company || ''),
    industry: String(d.industry || ''),
    location: String(d.location || ''),
    url: typeof d.url === 'string' ? d.url : '',
    caseUrl: typeof d.caseUrl === 'string' ? d.caseUrl : '',
    kpis: validKpis(d.kpis)
  };
}
