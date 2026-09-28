// Tester för branschmatchningen (node --test). Körs med `npm test`.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  categorize, score, normalize, codeFromPath, codeFromParam,
  createIndustryPersonalizer, CARD_INDEX, LEADS, MIN_SCORE
} from '../src/industry-match.mjs';

describe('categorize – varje kategori', () => {
  const cases = {
    salon: [
      'Jag driver en frisörsalong i Stockholm och vill göra det enklare att boka tid.',
      'Vi är ett barbershop på Söder.',
      'Jag är barberare och vill ha fler kunder.',
      'Vi har en salong med klippning och färg.',
      'Skönhetssalong med behandlingar för ansikte och kropp',
      'Jag gör naglar och fransar',
      'Bryn och fransar – vill synas mer'
    ],
    restaurant: [
      'Vi öppnar en restaurang och behöver en hemsida med meny och bordsbokning.',
      'Litet café i Vasastan',
      'Vi driver ett kafé och vill visa menyn',
      'Catering för företag',
      'Vi har en bar och serverar mat på helgerna'
    ],
    shop: [
      'Jag har en butik och vill visa våra produkter.',
      'Vi vill starta e-handel för våra kläder',
      'Behöver en webbshop',
      'Vi vill sälja online och ta emot beställningar'
    ],
    creator: [
      'Jag är fotograf och behöver en portfolio som känns professionell.',
      'Bröllopsfotograf som vill få fler förfrågningar',
      'Vi har ett galleri för samtida konst',
      'Jag är konstnär och vill visa mina verk',
      'Innehållskreatör som behöver en enkel sida'
    ],
    consultant: [
      'Jag startar ett konsultföretag och behöver förklara våra tjänster tydligt.',
      'Vi erbjuder rådgivning inom ekonomi',
      'Redovisningsbyrå med fem anställda',
      'Jag är coach och vill att kunder ska kunna boka möte',
      'Litet tjänsteföretag inom IT'
    ]
  };
  for (const [cat, texts] of Object.entries(cases)) {
    for (const t of texts) {
      test(`${cat}: "${t}"`, () => assert.equal(categorize(t), cat));
    }
  }
});

describe('svenska böjningar, sammansättningar och versaler', () => {
  test('bestämd form och plural', () => {
    assert.equal(categorize('Frisören behöver ny sida'), 'salon');
    assert.equal(categorize('Restaurangen har flyttat'), 'restaurant');
    assert.equal(categorize('Butiken säljer kläder'), 'shop');
    assert.equal(categorize('Fotografen tar porträtt'), 'creator');
    assert.equal(categorize('Konsulterna jobbar med strategi'), 'consultant');
  });
  test('sammansättningar', () => {
    assert.equal(categorize('Herrfrisör'), 'salon');
    assert.equal(categorize('hårsalong i Solna'), 'salon');
    assert.equal(categorize('Klädbutik online'), 'shop');
    assert.equal(categorize('IT-konsult'), 'consultant');
  });
  test('VERSALER och blandad skiftläge', () => {
    assert.equal(categorize('FRISÖR I GÖTEBORG'), 'salon');
    assert.equal(categorize('ReStAuRaNg'), 'restaurant');
    assert.equal(categorize('ÄGER EN BUTIK'), 'shop');
  });
  test('café med och utan accent', () => {
    assert.equal(categorize('Café'), 'restaurant');
    assert.equal(categorize('cafe'), 'restaurant');
    assert.equal(categorize('CAFÉET'), 'restaurant');
  });
  test('normalize: gemener, skiljetecken och bindestreck', () => {
    assert.equal(normalize('  Hej, FRISÖR!  E-handel – nu. '), 'hej frisör e-handel nu');
  });
});

describe('hela ord – korta delsträngar ger ingen falsk kategori', () => {
  test('"bara" är inte "bar", "hård" är inte "hår", "matcha" är inte "mat"', () => {
    assert.equal(categorize('Jag vill bara ha en hård och tydlig sida som matchar oss'), null);
  });
  test('användbar/sökbar ger inte bar', () => {
    assert.equal(score('en användbar och sökbar hemsida').restaurant, 0);
  });
  test('webbyrå räknas inte som byrå, konsultation inte som konsult', () => {
    const s = score('Vi har anlitat en webbyrå och fått en konsultation');
    assert.equal(s.consultant, 0);
  });
  test('databehandling räknas inte som behandling', () => {
    assert.equal(score('databehandling enligt GDPR').salon, 0);
  });
  test('produktion räknas inte som produkt', () => {
    assert.equal(score('Vi arbetar med produktion').shop, 0);
  });
});

describe('flera samtidiga matchningar', () => {
  test('starkast kategori vinner', () => {
    // salon: frisör 3 + salong 2 = 5; shop: produkter 1
    assert.equal(categorize('Frisörsalong som även säljer produkter'), 'salon');
    // restaurant: restaurang 3 + meny 1 + bordsbokning 3; creator: foto 2
    assert.equal(categorize('Restaurang med meny, bordsbokning och foton'), 'restaurant');
  });
  test('oavgjort ger standardordningen', () => {
    assert.equal(categorize('Jag är fotograf och har en butik'), null);
  });
  test('svag matchning under tröskeln ger standardordningen', () => {
    assert.ok(MIN_SCORE >= 2);
    assert.equal(categorize('Vi serverar mat'), null);      // mat = 1
    assert.equal(categorize('Menyn på hemsidan är rörig'), null); // meny = 1
  });
});

describe('okänd bransch och tom text', () => {
  test('okänd bransch', () => {
    assert.equal(categorize('Vår nuvarande hemsida känns gammal och syns dåligt på Google.'), null);
    assert.equal(categorize('Vi är en bilverkstad i Täby'), null);
  });
  test('tom text och ogiltig indata', () => {
    assert.equal(categorize(''), null);
    assert.equal(categorize('   '), null);
    assert.equal(categorize(null), null);
    assert.equal(categorize(undefined), null);
  });
});

describe('URL-signaler', () => {
  test('landningssidor', () => {
    assert.equal(codeFromPath('/hemsida-frisor-stockholm'), 'salon');
    assert.equal(codeFromPath('/hemsida-frisor-stockholm.html'), 'salon');
    assert.equal(codeFromPath('/hemsida-skonhetssalong-stockholm/'), 'beauty');
    assert.equal(codeFromPath('/hemsida-restaurang-stockholm'), 'restaurant');
    assert.equal(codeFromPath('/hemsida-fotograf'), 'creator');
    assert.equal(codeFromPath('/'), null);
    assert.equal(codeFromPath('/priser'), null);
  });
  test('?bransch=', () => {
    assert.equal(codeFromParam('Frisör'), 'salon');
    assert.equal(codeFromParam('butik'), 'shop');
    assert.equal(codeFromParam('okänd'), null);
  });
});

// Falsk karusell och lagring för styrenheten
function setup(opts = {}) {
  const calls = [];
  const state = { touched: false, inView: !!opts.inView, stored: opts.stored || null, lead: null };
  const p = createIndustryPersonalizer({
    carousel: {
      show(index, animate) { if (state.touched) return false; calls.push({ index, animate }); return true; },
      touched: () => state.touched,
      inView: () => state.inView
    },
    setLead: (t) => { state.lead = t; },
    storage: {
      get: () => state.stored,
      set: (code, source) => { state.stored = { code, source }; }
    },
    reducedMotion: () => !!opts.reduced
  });
  return { p, calls, state };
}

describe('styrenhet: anpassning, prioritet och manuell interaktion', () => {
  test('text flyttar karusellen till rätt kort och byter underrubrik', () => {
    const { p, calls, state } = setup();
    assert.equal(p.text('Vi har en restaurang'), 'restaurant');
    assert.deepEqual(calls, [{ index: CARD_INDEX.restaurant, animate: false }]);
    assert.equal(state.lead, LEADS.restaurant);
  });
  test('sparar bara kategorikoden, aldrig texten', () => {
    const { p, state } = setup();
    p.text('Jag driver en frisörsalong på Kungsholmen, ring 070-1234567');
    assert.deepEqual(state.stored, { code: 'salon', source: 'text' });
    assert.ok(!JSON.stringify(state.stored).includes('Kungsholmen'));
  });
  test('glider in (animerat) när sektionen syns, direkt när den inte syns', () => {
    const a = setup({ inView: true });
    a.p.text('fotograf');
    assert.equal(a.calls[0].animate, true);
    const b = setup({ inView: false });
    b.p.text('fotograf');
    assert.equal(b.calls[0].animate, false);
  });
  test('reduced motion: aldrig animerat', () => {
    const { p, calls } = setup({ inView: true, reduced: true });
    p.text('Vi har en butik');
    assert.equal(calls[0].animate, false);
  });
  test('bara första automatiska textanpassningen per sidvisning', () => {
    const { p, calls } = setup();
    p.text('restaurang');
    p.text('nej förresten, jag är fotograf');
    assert.equal(calls.length, 1);
    assert.equal(p.current(), 'restaurant');
  });
  test('osäker text förbrukar inte anpassningen', () => {
    const { p, calls } = setup();
    assert.equal(p.text('Hej! Vi behöver'), null);
    assert.equal(p.text('Hej! Vi behöver en ny sida för vår restaurang'), 'restaurant');
    assert.equal(calls.length, 1);
  });
  test('manuell interaktion efter automatisk anpassning: ingen ny omplacering', () => {
    const { p, calls, state } = setup({ inView: true });
    p.init({ url: 'creator' });
    state.touched = true; // besökaren drar/scrollar karusellen
    p.text('Vi har en restaurang');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].index, CARD_INDEX.creator);
  });
  test('URL-signal är aktiv från start, utan animation', () => {
    const { p, calls, state } = setup({ inView: true });
    assert.equal(p.init({ url: 'beauty' }), 'beauty');
    assert.deepEqual(calls, [{ index: CARD_INDEX.beauty, animate: false }]);
    assert.equal(state.lead, LEADS.beauty);
  });
  test('prioritet: text före URL före klick', () => {
    const t = setup({ stored: { code: 'shop', source: 'text' } });
    assert.equal(t.p.init({ url: 'salon' }), 'shop');
    const u = setup({ stored: { code: 'consultant', source: 'click' } });
    assert.equal(u.p.init({ url: 'salon' }), 'salon');
    const c = setup({ stored: { code: 'consultant', source: 'click' } });
    assert.equal(c.p.init({}), 'consultant');
  });
  test('text får ersätta en URL-anpassning (starkare signal)', () => {
    const { p, calls } = setup();
    p.init({ url: 'creator' });
    p.text('Vi driver en restaurang');
    assert.equal(calls.length, 2);
    assert.equal(p.current(), 'restaurant');
  });
  test('klick skriver inte över en starkare sparad signal', () => {
    const { p, state } = setup({ stored: { code: 'salon', source: 'text' } });
    p.click('shop');
    assert.deepEqual(state.stored, { code: 'salon', source: 'text' });
  });
  test('ingen signal: standardordningen och ingen ändring', () => {
    const { p, calls, state } = setup();
    assert.equal(p.init({}), null);
    assert.equal(p.text(''), null);
    assert.equal(calls.length, 0);
    assert.equal(state.lead, null);
  });
  test('ogiltig sparad kod ignoreras', () => {
    const { p, calls } = setup({ stored: { code: '<script>', source: 'text' } });
    assert.equal(p.init({}), null);
    assert.equal(calls.length, 0);
  });
});
