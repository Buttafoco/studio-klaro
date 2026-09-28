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
      'Ny frisyr och skäggrakning för herrar'
    ],
    beauty: [
      'Skönhetssalong med behandlingar för ansikte och kropp',
      'Jag gör naglar och fransar',
      'Bryn och fransar – vill synas mer',
      'Hudvård och massage i Vasastan',
      'Jag är stylist och har en egen salong'
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

describe('frisör/salong: The Chairman eller Salong & skönhet', () => {
  test('"Jag driver en frisörsalong" → The Chairman', () => {
    assert.equal(categorize('Jag driver en frisörsalong'), 'salon');
    assert.equal(CARD_INDEX[categorize('Jag driver en frisörsalong')], 0);
  });
  test('"Nagelsalong med bokning" → Salong & skönhet', () => {
    assert.equal(categorize('Nagelsalong med bokning'), 'beauty');
    assert.equal(CARD_INDEX.beauty, 1);
  });
  test('"Fransar och brynbehandlingar" → Salong & skönhet', () => {
    assert.equal(categorize('Fransar och brynbehandlingar'), 'beauty');
  });
  test('"Barberare och rakning" → The Chairman', () => {
    assert.equal(categorize('Barberare och rakning'), 'salon');
  });
  test('båda typerna med tydlig poängskillnad', () => {
    // hår: frisör 3 + barberare 3 = 6; skönhet: naglar 2
    assert.equal(categorize('Frisör och barberare som också gör naglar'), 'salon');
    // skönhet: skönhet 2 + salong 2 + ansiktsbehandling 2 + behandling 1 + massage 2 = 9; hår: klippning 2
    assert.equal(categorize('Skönhetssalong med ansiktsbehandlingar, massage och lite klippning'), 'beauty');
  });
  test('"salong" utan tydligare hårord → Salong & skönhet; hårsalong → The Chairman', () => {
    assert.equal(categorize('Vi har en liten salong'), 'beauty');
    assert.equal(categorize('Hårsalong i Solna'), 'salon');
  });
  test('lika poäng → The Chairman', () => {
    // hår: klippning 2; skönhet: salong 2
    assert.equal(categorize('Salong med klippning'), 'salon');
  });
  test('frisör/salong tävlar som en kategori mot andra branscher', () => {
    // salon totalt: fransar 2 + bryn 2 = 4; restaurant: café 3
    assert.equal(categorize('Fransar och bryn, och ett litet café'), 'beauty');
  });
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
    assert.equal(categorize('skäggrakning'), 'salon');
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
  const state = { touched: false, inView: !!opts.inView, stored: opts.stored || null, lead: null, autoplay: true, card: 0 };
  const p = createIndustryPersonalizer({
    carousel: {
      // Som i index.html: show() avstår om besökaren rört karusellen och stänger annars av autoplay
      show(index, animate) {
        if (state.touched) return false;
        state.autoplay = false;
        state.card = index;
        calls.push({ index, animate });
        return true;
      },
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
  test('ny text med annan kategori uppdaterar under samma sidvisning', () => {
    const { p, calls } = setup();
    p.text('restaurang');
    assert.equal(p.text('nej förresten, jag är fotograf'), 'creator');
    assert.equal(calls.length, 2);
    assert.equal(p.current(), 'creator');
  });
  test('osäker text ger ingen förflyttning', () => {
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

describe('hero-texten byter bransch under samma sidvisning', () => {
  const BEAUTY = 'Jag driver en nagelsalong med fransar och bryn';
  const RESTAURANT = 'Jag har en restaurang med meny och bordsbokning';
  const SHOP = 'Jag säljer produkter i en webbshop';

  test('beauty → restaurant', () => {
    const { p, state } = setup();
    assert.equal(p.text(BEAUTY), 'beauty');
    assert.equal(state.card, CARD_INDEX.beauty);
    assert.equal(p.text(RESTAURANT), 'restaurant');
    assert.equal(state.card, CARD_INDEX.restaurant);
  });
  test('restaurant → e-handel', () => {
    const { p, state } = setup();
    p.text(RESTAURANT);
    assert.equal(p.text(SHOP), 'shop');
    assert.equal(state.card, CARD_INDEX.shop);
  });
  test('tre branscher i följd utan omladdning', () => {
    const { p, calls } = setup();
    [BEAUTY, RESTAURANT, SHOP].forEach((t) => p.text(t));
    assert.deepEqual(calls.map((c) => c.index), [CARD_INDEX.beauty, CARD_INDEX.restaurant, CARD_INDEX.shop]);
  });
  test('samma kategori två gånger ger ingen ny förflyttning', () => {
    const { p, calls } = setup();
    p.text(RESTAURANT);
    assert.equal(p.text('Vi har ett litet café och en bar'), null);
    assert.equal(calls.length, 1);
  });
  test('tillfälligt tomt fält behåller senaste giltiga kategori', () => {
    const { p, calls, state } = setup();
    p.text(BEAUTY);
    assert.equal(p.text(''), null);
    assert.equal(p.text('   '), null);
    assert.equal(calls.length, 1);
    assert.equal(p.current(), 'beauty');
    assert.equal(state.lead, LEADS.beauty);
    assert.deepEqual(state.stored, { code: 'beauty', source: 'text' });
  });
  test('okänd mellantext behåller senaste giltiga kategori', () => {
    const { p, calls, state } = setup();
    p.text(BEAUTY);
    assert.equal(p.text('Jag har en'), null);
    assert.equal(p.text('Vår hemsida känns gammal'), null);
    assert.equal(calls.length, 1);
    assert.equal(state.card, CARD_INDEX.beauty);
  });
  test('sessionStorage följer senaste giltiga kod, aldrig texten', () => {
    const { p, state } = setup();
    p.text(BEAUTY);
    p.text(RESTAURANT);
    p.text('Jag har en');
    p.text(SHOP);
    assert.deepEqual(state.stored, { code: 'shop', source: 'text' });
    assert.ok(!JSON.stringify(state.stored).includes('webbshop'));
  });
  test('autoplay förblir avstängd efter första personaliseringen', () => {
    const { p, state } = setup();
    assert.equal(state.autoplay, true);
    p.text(BEAUTY);
    assert.equal(state.autoplay, false);
    p.text('');
    p.text(RESTAURANT);
    assert.equal(state.autoplay, false);
  });
  test('manuell karusellinteraktion blockerar efterföljande textändringar', () => {
    const { p, calls, state } = setup({ inView: true });
    p.text(BEAUTY);
    state.touched = true; // drag, swipe, sidledes scroll, piltangent eller klick i karusellen
    assert.equal(p.text(RESTAURANT), null);
    assert.equal(p.text(SHOP), null);
    assert.equal(calls.length, 1);
    assert.equal(state.lead, LEADS.beauty); // underrubriken ändras inte heller
  });
  test('att skriva flera texter räknas inte som manuell interaktion', () => {
    const { p, calls } = setup();
    ['Jag', BEAUTY, 'Jag har', RESTAURANT, '', SHOP].forEach((t) => p.text(t));
    assert.equal(calls.length, 3);
  });
  test('kort och underrubrik förblir synkroniserade', () => {
    const { p, state } = setup();
    for (const [t, code] of [[BEAUTY, 'beauty'], [RESTAURANT, 'restaurant'], ['Jag har en', 'restaurant'], [SHOP, 'shop']]) {
      p.text(t);
      assert.equal(state.card, CARD_INDEX[code]);
      assert.equal(state.lead, LEADS[code]);
      assert.equal(p.current(), code);
    }
  });
  test('mjuk animation när sektionen syns, direkt när den inte syns', () => {
    const { p, calls, state } = setup({ inView: true });
    p.text(BEAUTY);
    state.inView = false;
    p.text(RESTAURANT);
    assert.deepEqual(calls.map((c) => c.animate), [true, false]);
  });
  test('reduced motion: varje byte sker direkt', () => {
    const { p, calls } = setup({ inView: true, reduced: true });
    [BEAUTY, RESTAURANT, SHOP].forEach((t) => p.text(t));
    assert.equal(calls.length, 3);
    assert.ok(calls.every((c) => c.animate === false));
  });
});
