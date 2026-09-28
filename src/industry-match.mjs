/* ==========================================================================
   Studio Klaro – branschmatchning för branschkarusellen på startsidan.
   Ren logik utan DOM (testas i tests/industry-match.test.mjs, kopplas in av
   src/industry-personalize.js). Allt körs lokalt i webbläsaren: ingen text skickas
   någonstans och ingen fulltext sparas – bara en generell kategorikod.

   Kategorisering: texten normaliseras (svenska gemener, NFC, é → e), delas i ord och
   matchas mot nyckelord med vikt och matchningsläge:
     word     – exakt ord, eller någon av de uppräknade böjningsformerna
     prefix   – ordet börjar med nyckelordet (böjningar: frisören, restaurangen)
     contains – nyckelordet finns i ordet (sammansättningar: hårsalong, bröllopsfotograf)
   Korta, mångtydiga ord (hår, mat, bar, foto, byrå) matchar bara som hela ord/böjningar.
   Varje nyckelord räknas en gång. Vinnaren måste nå MIN_SCORE och slå tvåan –
   vid lika eller svag matchning returneras null (standardordningen gäller).
   ========================================================================== */

export const MIN_SCORE = 2;

// Kategorikoder (det enda som sparas) → kortets plats i karusellen (riktig ordning i DOM)
export const CARD_INDEX = { salon: 0, beauty: 1, restaurant: 2, shop: 3, creator: 4, consultant: 5 };
export const CARD_CODES = ['salon', 'beauty', 'restaurant', 'shop', 'creator', 'consultant'];

export const DEFAULT_LEAD = 'Utforska exempel anpassade efter olika verksamheter, kundresor och mål.';
// Underrubrik per kategori (beauty delar frisör/salong-texten)
export const LEADS = {
  salon: 'Exempel för verksamheter där behandlingar, förtroende och enkel bokning står i centrum.',
  beauty: 'Exempel för verksamheter där behandlingar, förtroende och enkel bokning står i centrum.',
  restaurant: 'Exempel där känslan, menyn och vägen till bokning behöver bli tydliga.',
  shop: 'Exempel som gör produkter lättare att upptäcka, förstå och köpa.',
  creator: 'Exempel där arbetet får stå i centrum och kontaktvägen känns självklar.',
  consultant: 'Exempel som förklarar värdet tydligt och gör nästa steg enkelt.'
};

// k: nyckelord, w: vikt, m: läge, forms: tillåtna hela ord, not: ord som aldrig ska matcha
const RULES = {
  salon: [
    { k: 'frisör', w: 3, m: 'contains' },
    { k: 'barberare', w: 3, m: 'prefix' },
    { k: 'barbershop', w: 3, m: 'prefix' },
    { k: 'barber', w: 3, m: 'word', forms: ['barber', 'barbers', 'barbern'] },
    { k: 'salong', w: 2, m: 'contains' },
    { k: 'hår', w: 1, m: 'word', forms: ['hår', 'håret', 'hårvård', 'hårfärgning'] },
    { k: 'klippning', w: 2, m: 'contains' },
    { k: 'skönhet', w: 2, m: 'contains' },
    { k: 'behandling', w: 1, m: 'contains', not: ['databehandling', 'personuppgiftsbehandling', 'ärendebehandling'] },
    { k: 'naglar', w: 2, m: 'word', forms: ['naglar', 'naglarna', 'nagel', 'nagelsalong', 'nagelteknolog', 'nageltekniker', 'manikyr', 'pedikyr'] },
    { k: 'fransar', w: 2, m: 'word', forms: ['fransar', 'fransarna', 'fransförlängning', 'fransstylist', 'lashes'] },
    { k: 'bryn', w: 2, m: 'word', forms: ['bryn', 'brynen', 'ögonbryn', 'ögonbrynen', 'brynstyling'] }
  ],
  restaurant: [
    { k: 'restaurang', w: 3, m: 'contains' },
    { k: 'cafe', w: 3, m: 'prefix', not: ['cafeteria'] },
    { k: 'kafe', w: 3, m: 'prefix' },
    { k: 'meny', w: 1, m: 'word', forms: ['meny', 'menyn', 'menyer', 'menyerna', 'lunchmeny', 'lunchmenyn', 'matmeny', 'dryckesmeny'] },
    { k: 'mat', w: 1, m: 'word', forms: ['mat', 'maten', 'matställe', 'lunch', 'luncher'] },
    { k: 'bordsbokning', w: 3, m: 'prefix' },
    { k: 'catering', w: 2, m: 'contains' },
    { k: 'bar', w: 1, m: 'word', forms: ['bar', 'baren', 'barer', 'vinbar', 'vinbaren', 'cocktailbar', 'cocktailbaren'] }
  ],
  shop: [
    { k: 'butik', w: 3, m: 'contains' },
    { k: 'e-handel', w: 3, m: 'prefix' },
    { k: 'ehandel', w: 3, m: 'prefix' },
    { k: 'webbshop', w: 3, m: 'prefix' },
    { k: 'webshop', w: 3, m: 'prefix' },
    { k: 'nätbutik', w: 3, m: 'prefix' },
    { k: 'produkt', w: 1, m: 'prefix', not: ['produktion', 'produktionen', 'produktiv', 'produktivitet', 'produktivt'] },
    { k: 'sälja online', w: 3, m: 'phrase', forms: ['sälja online', 'säljer online', 'sälja på nätet', 'säljer på nätet'] },
    { k: 'beställning', w: 1, m: 'contains' }
  ],
  creator: [
    { k: 'fotograf', w: 3, m: 'contains' },
    { k: 'foto', w: 2, m: 'word', forms: ['foto', 'foton', 'fotot', 'fotona'] },
    { k: 'portfolio', w: 3, m: 'prefix' },
    { k: 'galleri', w: 2, m: 'contains' },
    { k: 'konstnär', w: 3, m: 'contains' },
    { k: 'kreatör', w: 3, m: 'contains' },
    { k: 'designer', w: 1, m: 'word', forms: ['designer', 'designern', 'designers'] }
  ],
  consultant: [
    { k: 'konsult', w: 3, m: 'contains', not: ['konsultation', 'konsultationen', 'konsultationer'] },
    { k: 'rådgivning', w: 3, m: 'contains' },
    { k: 'rådgivare', w: 3, m: 'contains' },
    { k: 'byrå', w: 1, m: 'word', forms: ['byrå', 'byrån', 'byråer', 'redovisningsbyrå', 'redovisningsbyrån', 'revisionsbyrå', 'advokatbyrå', 'arkitektbyrå'] },
    { k: 'coach', w: 3, m: 'prefix' },
    { k: 'redovisning', w: 3, m: 'prefix' },
    { k: 'ekonomi', w: 1, m: 'word', forms: ['ekonomi', 'ekonomin', 'ekonom', 'ekonomer', 'ekonomitjänster'] },
    { k: 'tjänsteföretag', w: 3, m: 'prefix' },
    { k: 'bokningsbart möte', w: 2, m: 'phrase', forms: ['bokningsbart möte', 'bokningsbara möten', 'boka möte', 'boka möten'] }
  ]
};

// Svenska gemener, é → e (café/cafe), allt som inte är bokstav/siffra/bindestreck blir mellanslag
export function normalize(text) {
  if (typeof text !== 'string') return '';
  return text.normalize('NFC').toLocaleLowerCase('sv-SE')
    .replace(/[éèê]/g, 'e')
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    .replace(/(^|\s)-+|-+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenMatches(rule, token) {
  if (rule.not && rule.not.indexOf(token) !== -1) return false;
  if (rule.m === 'word') return rule.forms.indexOf(token) !== -1;
  if (rule.m === 'prefix') return token.indexOf(rule.k) === 0;
  if (rule.m === 'contains') return token.indexOf(rule.k) !== -1;
  return false;
}

// Poäng per kategori. Varje nyckelord räknas högst en gång.
export function score(text) {
  const norm = normalize(text);
  const out = {};
  Object.keys(RULES).forEach((cat) => { out[cat] = 0; });
  if (!norm) return out;
  const tokens = norm.split(' ');
  const padded = ' ' + norm + ' ';
  Object.keys(RULES).forEach((cat) => {
    RULES[cat].forEach((rule) => {
      const hit = rule.m === 'phrase'
        ? rule.forms.some((f) => padded.indexOf(' ' + f + ' ') !== -1)
        : tokens.some((t) => tokenMatches(rule, t));
      if (hit) out[cat] += rule.w;
    });
  });
  return out;
}

// Säker kategori eller null (tom text, okänd bransch, för svag eller oavgjord matchning)
export function categorize(text) {
  const s = score(text);
  let best = null, bestScore = 0, second = 0;
  Object.keys(s).forEach((cat) => {
    if (s[cat] > bestScore) { second = bestScore; bestScore = s[cat]; best = cat; }
    else if (s[cat] > second) second = s[cat];
  });
  if (bestScore < MIN_SCORE || bestScore === second) return null;
  return best;
}

// Branschlandningssidor → kategorikod (sökväg utan .html och avslutande snedstreck)
const PATHS = {
  '/hemsida-frisor-stockholm': 'salon',
  '/hemsida-skonhetssalong-stockholm': 'beauty',
  '/hemsida-restaurang-stockholm': 'restaurant',
  '/hemsida-fotograf': 'creator'
};
// ?bransch=… (t.ex. kampanjlänkar) – bara kända koder och enkla alias
const PARAM_ALIASES = {
  salon: 'salon', frisor: 'salon', 'frisör': 'salon', barber: 'salon',
  beauty: 'beauty', salong: 'beauty', skonhet: 'beauty', 'skönhet': 'beauty',
  restaurant: 'restaurant', restaurang: 'restaurant', cafe: 'restaurant',
  shop: 'shop', butik: 'shop', ehandel: 'shop', 'e-handel': 'shop',
  creator: 'creator', fotograf: 'creator', kreator: 'creator', 'kreatör': 'creator',
  consultant: 'consultant', konsult: 'consultant'
};

export function codeFromPath(pathname) {
  if (typeof pathname !== 'string') return null;
  const p = pathname.replace(/\.html$/, '').replace(/\/+$/, '').toLowerCase();
  return PATHS[p] || null;
}

export function codeFromParam(value) {
  if (typeof value !== 'string') return null;
  return PARAM_ALIASES[value.trim().toLocaleLowerCase('sv-SE')] || null;
}

export function isCode(code) { return CARD_CODES.indexOf(code) !== -1; }

/* --------------------------------------------------------------------------
   Styrenhet: prioriterar signalerna och bestämmer när karusellen får flyttas.
   Prioritet: 1 text i hero-fältet, 2 landningssida/URL, 3 klickat kort, 4 standard.
   Beroenden injiceras (testbart utan DOM):
     carousel.show(index, animate) → true om kortet visades
     carousel.touched()            → besökaren har själv rört karusellen
     carousel.inView()             → sektionen syns just nu
     setLead(text)                 → byt underrubrik
     storage                       → { get(), set(code, source) } (sessionStorage)
     reducedMotion()               → prefers-reduced-motion
   -------------------------------------------------------------------------- */
export const SOURCE_RANK = { text: 1, url: 2, click: 3 };

export function createIndustryPersonalizer(deps) {
  const { carousel, setLead, storage, reducedMotion } = deps;
  let applied = null;      // { code, source } som styr just nu
  let textApplied = false; // textanpassningen görs högst en gång per sidvisning

  function apply(code, source, opts) {
    if (!isCode(code)) return false;
    if (applied && SOURCE_RANK[source] > SOURCE_RANK[applied.source]) return false;
    if (applied && applied.code === code) { applied = { code, source }; return false; }
    if (carousel.touched()) return false; // kämpa aldrig emot besökaren
    const animate = !!(opts && opts.animate) && carousel.inView() && !reducedMotion();
    if (!carousel.show(CARD_INDEX[code], animate)) return false;
    applied = { code, source };
    setLead(LEADS[code]);
    return true;
  }

  return {
    // Vid sidladdning: starkaste sparade/URL-signal visas direkt (ingen animation)
    init(signals) {
      const cands = [];
      const stored = storage.get();
      if (stored && isCode(stored.code) && SOURCE_RANK[stored.source]) cands.push(stored);
      if (signals && isCode(signals.url)) cands.push({ code: signals.url, source: 'url' });
      cands.sort((a, b) => SOURCE_RANK[a.source] - SOURCE_RANK[b.source]);
      if (!cands.length) return null;
      const c = cands[0];
      if (apply(c.code, c.source, { animate: false })) {
        if (c.source !== 'click') storage.set(c.code, c.source);
        return c.code;
      }
      return null;
    },
    // Hero-texten (anropas efter debounce). Bara första säkra matchningen används.
    text(value) {
      if (textApplied) return null;
      const code = categorize(value);
      if (!code) return null;
      textApplied = true;
      storage.set(code, 'text');
      return apply(code, 'text', { animate: true }) ? code : null;
    },
    // Besökaren klickade själv på ett kort: kom ihåg kategorin för nästa besök på startsidan i fliken
    click(code) {
      if (!isCode(code)) return;
      const cur = storage.get();
      if (!cur || SOURCE_RANK[cur.source] >= SOURCE_RANK.click) storage.set(code, 'click');
    },
    current() { return applied ? applied.code : null; }
  };
}
