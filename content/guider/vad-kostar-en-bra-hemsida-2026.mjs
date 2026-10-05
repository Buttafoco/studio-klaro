// Guide: Vad kostar en bra hemsida 2026?
//
// Metadata och innehåll för en guide. Sidan byggs av scripts/build-guides.mjs (gemensam mall för alla guider).
// Lästid och innehållsförteckning räknas fram automatiskt: varje <h2> behöver ett id, och data-toc ger en
// kortare etikett i innehållsförteckningen. Studio Klaros egna priser följer /priser (source of truth) –
// ändras paketen där behöver avsnittet "Studio Klaro" längst ned uppdateras.

const tick = '<span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>';

export default {
  slug: 'vad-kostar-en-bra-hemsida-2026',
  title: 'Vad kostar en bra hemsida 2026?',
  seoTitle: 'Vad kostar en bra hemsida 2026? | Studio Klaro',
  description: 'Vad kostar en hemsida för ett företag 2026? Ungefärliga prisnivåer, vad som påverkar priset, hur du jämför offerter och vad det kostar efter lansering.',
  teaser: 'Från några tusenlappar till över 100 000 kronor. Vad som faktiskt påverkar priset – och hur du jämför två offerter utan att bara titta på totalsumman.',
  category: 'Priser & upplägg',
  eyebrow: 'Hemsidans kostnad',
  lead: 'Det korta svaret: allt från några tusenlappar till över 100 000 kronor. Den mer intressanta frågan är vad just ditt företag behöver – och vad som faktiskt påverkar priset. Här går vi igenom båda.',
  author: 'Studio Klaro',
  published: '2026-10-05',
  ogImage: '/guider/kostnad-og.jpg',
  ogImageAlt: 'Illustration av en hemsida med en organisk prislapp, en prisstege i fyra steg och en offert med bockar.',
  illustrationLabel: 'Illustration av en hemsida med en organisk prislapp, en liten prisstege i fyra steg från bygga själv till skräddarsytt och en offert där några rader är avbockade.',
  illustration,
  cta: {
    title: 'Vill du veta vad just din hemsida skulle kosta?',
    text: 'Berätta kort om företaget och vad du behöver, så hjälper vi dig att hitta en rimlig nivå för projektet.',
  },
  body: `
<section class="ga-sec" aria-labelledby="inledning">
  <h2 id="inledning" data-toc="Rätt fråga att ställa">Rätt fråga är inte bara vad det kostar</h2>
  <p>”Vad kostar en hemsida?” är svårare att svara på än det verkar. En hemsida för en lokal frisör och en hemsida för ett företag med 40 tjänstesidor, flera språk och specialbyggda funktioner är två helt olika projekt.</p>
  <p>Därför är den intressanta frågan inte bara vad en hemsida kostar, utan <strong>vad ert företag faktiskt behöver</strong>. I den här guiden går vi igenom vad du kan förvänta dig att betala för en företagshemsida 2026 – och framför allt vad som påverkar priset.</p>
</section>

<section class="ga-sec" aria-labelledby="prisnivaer">
  <h2 id="prisnivaer" data-toc="Prisnivåer 2026">Vad kostar en hemsida i Sverige 2026?</h2>
  <p>För ett mindre företag kan marknaden förenklat delas in ungefär så här:</p>
  <figure class="g-fig g-ladder">
    <ol class="g-ladder-list">
      <li style="--h:22%"><span class="g-ladder-bar"></span><b>Bygga själv</b><em>ca 100–500 kr/mån</em></li>
      <li style="--h:42%"><span class="g-ladder-bar"></span><b>Mindre studio eller frilansare</b><em>ca 8 000–25 000 kr</em></li>
      <li style="--h:66%"><span class="g-ladder-bar"></span><b>Traditionell webbyrå</b><em>ca 25 000–80 000 kr</em></li>
      <li style="--h:92%"><span class="g-ladder-bar"></span><b>Större och skräddarsytt</b><em>80 000 kr och uppåt</em></li>
    </ol>
    <figcaption>Ungefärliga nivåer för ett mindre företag. Priserna varierar mellan leverantörer och projekt – staplarna visar ordningen, inte en exakt skala.</figcaption>
  </figure>

  <h3>Bygga själv: cirka 100–500 kr/mån</h3>
  <p>Tjänster som Wix, Squarespace och liknande gör det möjligt att skapa en hemsida själv för en relativt låg månadskostnad. Det är ofta det billigaste alternativet i pengar – men inte nödvändigtvis i tid. Du behöver själv tänka på design, struktur, mobilanpassning, texter, bilder, SEO, domän, formulär och hur sidan faktiskt ska hjälpa företaget att få kunder.</p>
  <p>För vissa företag fungerar det utmärkt. För andra slutar det med en hemsida som aldrig riktigt blir klar.</p>

  <h3>Mindre studio eller frilansare: cirka 8 000–25 000 kr</h3>
  <p>För ett mindre företag som behöver en relativt enkel hemsida kan det här vara ett väldigt intressant segment. Du kan till exempel få en startsida, tjänstesidor, en sida om företaget, kontakt, mobilanpassning, grundläggande SEO, kontaktformulär och en design som är anpassad efter företaget.</p>
  <p>En mindre studio har ofta betydligt lägre kostnader än en traditionell byrå: inget stort kontor, ingen projektledare mellan kunden och designern, inga långa workshops och färre personer inblandade. Det gör det möjligt att leverera en bra hemsida till ett lägre pris utan att kompromissa med resultatet.</p>
  <p>Men titta noggrant på <strong>vad som faktiskt ingår</strong>. Två offerter på 12 000 kronor kan innehålla helt olika saker.</p>

  <h3>Traditionell webbyrå: cirka 25 000–80 000 kr</h3>
  <p>Hos en etablerad webbyrå blir projektet ofta större. Det kan ingå strategi, workshops, UX-arbete, design, texter, SEO-analys, utveckling, projektledning, testning, utbildning och support efter lansering.</p>
  <p>För större företag kan det vara helt rätt – det finns fler personer att tillgå och större kapacitet om projektet växer. Men du betalar också för fler arbetstimmar. För ett lokalt företag som egentligen behöver en modern hemsida på fem till tio sidor kan processen ibland vara större än vad som behövs.</p>

  <h3>Större och skräddarsydda hemsidor: 80 000 kr och uppåt</h3>
  <p>Här börjar vi lämna den vanliga företagssidan. Det kan handla om kundportaler, medlemsinloggning, specialbyggda bokningssystem, avancerade integrationer, flera språk, stora mängder innehåll, egna databaser, e-handel eller andra verksamhetskritiska funktioner.</p>
  <p>Då är det inte längre bara en hemsida som ska byggas, utan ett digitalt system – och priset kan snabbt passera både 100 000 och 200 000 kronor.</p>
</section>

<section class="ga-sec" aria-labelledby="skillnaden">
  <h2 id="skillnaden" data-toc="Vad som påverkar priset">Varför kan två liknande hemsidor kosta 10 000 och 50 000 kronor?</h2>
  <p>På ytan kan slutresultatet se ganska likt ut. Skillnaden ligger ofta i allt arbete runt omkring. Här är sex av de största faktorerna.</p>

  <h3><span class="g-h3-n">1</span> Hur många sidor behövs?</h3>
  <p>En one-page-hemsida är något helt annat än en webbplats med startsida, om oss, sex tjänster, case, blogg, vanliga frågor, kontakt och lokala landningssidor. Fler sidor betyder inte bara mer utveckling – varje sida behöver struktur, innehåll, design och kvalitetssäkring. Jämför därför inte två priser innan du vet ungefär hur omfattande båda projekten är.</p>

  <h3><span class="g-h3-n">2</span> Är designen unik?</h3>
  <p>Det går betydligt snabbare att utgå från en färdig mall och byta logotyp, färger, bilder och texter. Det behöver inte vara dåligt – för vissa företag är det precis vad som behövs. Men ska designen tas fram utifrån företagets varumärke, målgrupp, innehåll, tjänster och mål krävs mer arbete. Frågan är inte om en mall är rätt eller fel, utan <strong>hur mycket anpassning ditt företag behöver</strong>.</p>

  <h3><span class="g-h3-n">3</span> Vem skriver innehållet?</h3>
  <p>Det här glöms ofta bort. Någon måste skriva rubriker, tjänstebeskrivningar, knapptexter, texten om företaget, vanliga frågor, sidtitlar och annat innehåll. Levererar du allt färdigt blir projektet billigare. Ska webbyrån intervjua företaget, göra research och skriva all text blir kostnaden högre. Samma sak gäller bilder och annat material.</p>

  <h3><span class="g-h3-n">4</span> Hur mycket SEO ingår?</h3>
  <p>”SEO ingår” kan betyda väldigt olika saker:</p>
  <figure class="g-fig g-flow">
    <div class="g-flow-grid">
      <div class="g-flow-col">
        <p class="g-mock-label">En teknisk grund</p>
        <ol class="g-flow-list">
          <li>Korrekta sidtitlar</li><li>Metabeskrivningar</li><li>Rubrikstruktur</li><li>Sitemap</li><li>Indexering</li><li>En tekniskt bra grund</li>
        </ol>
      </div>
      <div class="g-flow-col">
        <p class="g-mock-label">Ett större SEO-arbete</p>
        <ol class="g-flow-list">
          <li class="is-trio">Allt till vänster, plus</li><li>Sökordsanalys</li><li>Konkurrentanalys</li><li>Innehållsstrategi</li><li>Lokala landningssidor</li><li>Länkstrategi</li><li>Löpande innehåll och uppföljning</li>
        </ol>
      </div>
    </div>
    <figcaption>Två helt olika omfattningar bakom samma ord.</figcaption>
  </figure>
  <p>Fråga därför alltid <strong>vad SEO faktiskt innebär i offerten</strong>. Vill du veta var din nuvarande hemsida står kan du börja med en <a href="/seo-koll">kostnadsfri SEO-koll</a>.</p>

  <h3><span class="g-h3-n">5</span> Finns specialfunktioner?</h3>
  <p>En kontaktknapp kostar nästan ingenting att bygga. Ett specialbyggt bokningsflöde är något helt annat. Vanliga funktioner som påverkar priset är bokningssystem, betalningar, e-handel, kundportal, inloggning, integrationer med andra system, flera språk, avancerade formulär, filter och databaser. Ju mer hemsidan ska <strong>göra</strong>, desto mer kostar den normalt att bygga.</p>

  <h3><span class="g-h3-n">6</span> Hur mycket tid läggs på projektet?</h3>
  <p>Det här är kanske den största skillnaden. En hemsida för 10 000 kronor och en för 60 000 kronor behöver inte använda fundamentalt olika teknik. Men det dyrare projektet kanske innehåller flera workshops, research, skisser, två designers, en copywriter, utvecklare, en projektledare, flera presentationsmöten och fler omgångar av feedback. All den tiden måste betalas.</p>
  <p>För vissa företag skapar processen stort värde. För andra är den onödigt omfattande.</p>
</section>

<section class="ga-sec" aria-labelledby="billig">
  <h2 id="billig" data-toc="Billig är inte dålig">Billig betyder inte automatiskt dålig</h2>
  <p>Ett lägre pris betyder inte automatiskt att hemsidan blir sämre. En liten studio kan arbeta betydligt mer effektivt än en stor byrå. Om samma person pratar med kunden, designar sidan, bygger den och lanserar den försvinner mycket projektledning och kommunikation mellan olika team.</p>
  <p>Moderna utvecklingsverktyg har dessutom gjort det snabbare att bygga webbplatser av hög kvalitet än tidigare. Det gör att mindre aktörer kan konkurrera på ett sätt som var betydligt svårare för några år sedan.</p>
  <p>Men ett lågt pris måste fortfarande vara realistiskt:</p>
  <figure class="g-fig g-offer">
    <div class="g-offer-card">
      <p class="g-mock-label">En offert som är för bra för att vara sann</p>
      <ul>
        <li>15 unika sidor</li><li>Komplett SEO</li><li>Alla texter</li><li>Specialdesign</li><li>Obegränsade ändringar</li><li>Bokningssystem</li><li>Support</li>
      </ul>
      <p class="g-offer-total"><span>Totalt</span><b>3 000 kr</b><em aria-hidden="true">?</em></p>
    </div>
    <figcaption>Påhittat exempel. Får du ett sådant erbjudande – fråga hur det faktiskt går ihop.</figcaption>
  </figure>
</section>

<section class="ga-sec" aria-labelledby="dyr">
  <h2 id="dyr" data-toc="Dyr är inte bra">Dyr betyder inte automatiskt bra heller</h2>
  <p>Samma sak gäller åt andra hållet. En hemsida för 70 000 kronor är inte automatiskt bättre än en för 15 000 kronor. Det viktiga är om investeringen passar företagets behov.</p>
  <figure class="g-fig g-need">
    <div class="g-need-grid">
      <div class="g-need-col g-need-col--not">
        <p class="g-mock-label">En lokal frisör behöver kanske inte</p>
        <ul><li>sex veckors strategi</li><li>tre workshops</li><li>en projektledare</li><li>två designers</li><li>en omfattande varumärkesanalys</li></ul>
      </div>
      <div class="g-need-col">
        <p class="g-mock-label">Men behöver förmodligen</p>
        <ul><li>en riktigt bra startsida</li><li>tydliga priser</li><li>en presentation av salongen</li><li>en struktur som Google förstår</li><li>en bra mobilupplevelse</li></ul>
        <span class="g-mock-btn g-mock-btn--block" aria-hidden="true">Boka tid</span>
      </div>
    </div>
    <figcaption>Och en stor knapp för det viktigaste nästa steget.</figcaption>
  </figure>
  <p>Därför är det riskabelt att bedöma ett webbprojekt enbart efter priset.</p>
</section>

<section class="ga-sec" aria-labelledby="innehalla">
  <h2 id="innehalla" data-toc="Det du kan förvänta dig">Vad ska en bra företagshemsida innehålla?</h2>
  <p>Oavsett om du betalar 10 000 eller 50 000 kronor finns några saker du bör kunna förvänta dig.</p>
  <ul class="g-steps g-steps--check">
    <li>${tick}<h3>Den fungerar bra i mobilen</h3><p>Inte bara ”går att öppna” – den är genomtänkt för mindre skärmar.</p></li>
    <li>${tick}<h3>Det är tydligt vad företaget erbjuder</h3><p>En besökare förstår snabbt att den har hamnat rätt.</p></li>
    <li>${tick}<h3>Det är enkelt att ta nästa steg</h3><p>Kontakta, boka, begära offert, ringa – eller det som är viktigast för just din verksamhet.</p></li>
    <li>${tick}<h3>Den är snabb</h3><p>En snygg hemsida som känns tung och långsam är fortfarande en dålig upplevelse.</p></li>
    <li>${tick}<h3>Google kan förstå sidan</h3><p>Det finns en bra teknisk grund för SEO, indexering och struktur.</p></li>
    <li>${tick}<h3>Den känns som ditt företag</h3><p>Inte som en mall där bara logotypen har bytts ut.</p></li>
  </ul>
  <p>Vi går igenom flera av punkterna mer i detalj i guiderna om <a href="/guider/mobilanpassad-hemsida-8-vanliga-problem">mobilen</a> och om <a href="/guider/varfor-syns-inte-mitt-foretag-pa-google">att synas på Google</a>.</p>
</section>

<section class="ga-sec" aria-labelledby="efter-lansering">
  <h2 id="efter-lansering" data-toc="Kostnaden efter lansering">Glöm inte kostnaden efter lansering</h2>
  <p>När du jämför priser bör du också fråga vad som händer när hemsidan är klar. Finns det kostnader för:</p>
  <ul class="g-weigh">
    <li><span>hosting?</span></li>
    <li><span>domän?</span></li>
    <li><span>support?</span></li>
    <li><span>underhåll?</span></li>
    <li><span>säkerhetsuppdateringar?</span></li>
    <li><span>licenser?</span></li>
    <li><span>andra månadskostnader?</span></li>
    <li><span>framtida ändringar?</span></li>
  </ul>
  <figure class="g-fig g-total">
    <div class="g-total-card">
      <p class="g-mock-label">Räkneexempel över tre år</p>
      <div class="g-total-row"><span>Att bygga hemsidan</span><b>5 000 kr</b></div>
      <div class="g-total-row"><span>2 000 kr i månaden × 36 månader</span><b>72 000 kr</b></div>
      <div class="g-total-row g-total-row--sum"><span>Totalkostnad</span><b>77 000 kr</b></div>
    </div>
    <figcaption>En hemsida som kostar 5 000 kronor att bygga men 2 000 kronor varje månad kan över några år bli betydligt dyrare än ett projekt med högre startkostnad.</figcaption>
  </figure>
  <p>Fråga därför alltid om <strong>totalkostnaden</strong>, inte bara startpriset.</p>
</section>

<section class="ga-sec" aria-labelledby="rimligt">
  <h2 id="rimligt" data-toc="Rimligt för ett mindre företag">Vad är rimligt för ett mindre företag?</h2>
  <p>Driver du ett mindre företag behöver du sällan börja med den största möjliga lösningen. För många är det viktigare att få</p>
  <p class="g-closing">5–10 riktigt bra sidor än 30 halvfärdiga.</p>
  <p>En tydlig hemsida med bra design, en bra mobilupplevelse, teknisk SEO och en tydlig väg till kontakt kan räcka väldigt långt. Sedan går det alltid att utveckla sidan när företaget växer – med blogg, fler tjänster, case, fler sidor för SEO eller nya funktioner. Det behöver inte byggas dag ett.</p>
</section>

<section class="ga-sec" aria-labelledby="offerter">
  <h2 id="offerter" data-toc="Jämför två offerter">Så jämför du två offerter</h2>
  <p>Titta inte bara längst ned på sidan där totalsumman står. Gå igenom frågorna nedan för båda offerterna – gärna sida vid sida.</p>
  <figure class="g-fig g-quote-table">
    <div class="g-table-wrap">
      <table>
        <caption class="sr-only">Frågor att jämföra mellan två offerter</caption>
        <thead><tr><th scope="col">Fråga</th><th scope="col">Offert A</th><th scope="col">Offert B</th></tr></thead>
        <tbody>
          <tr><th scope="row">Hur många sidor ingår?</th><td></td><td></td></tr>
          <tr><th scope="row">Är designen anpassad efter företaget?</th><td></td><td></td></tr>
          <tr><th scope="row">Vem skriver texterna?</th><td></td><td></td></tr>
          <tr><th scope="row">Vad innebär SEO-arbetet?</th><td></td><td></td></tr>
          <tr><th scope="row">Ingår mobilanpassning?</th><td></td><td></td></tr>
          <tr><th scope="row">Hur många omgångar av feedback ingår?</th><td></td><td></td></tr>
          <tr><th scope="row">Vem äger hemsidan efteråt?</th><td></td><td></td></tr>
          <tr><th scope="row">Finns det löpande kostnader?</th><td></td><td></td></tr>
          <tr><th scope="row">Vad kostar framtida ändringar?</th><td></td><td></td></tr>
          <tr><th scope="row">Ingår support efter lansering?</th><td></td><td></td></tr>
        </tbody>
      </table>
    </div>
    <figcaption>Fyll i svaren för varje offert. Då blir det betydligt enklare att förstå varför priserna skiljer sig.</figcaption>
  </figure>
</section>

<section class="ga-sec" aria-labelledby="sa-vad-kostar">
  <h2 id="sa-vad-kostar" data-toc="Så vad kostar det?">Så vad kostar en bra hemsida?</h2>
  <p>För ett mindre företag behöver en bra hemsida inte kosta 100 000 kronor. Men den bör heller inte behandlas som en utgift för ”några sidor på internet”.</p>
  <p class="g-closing">Din hemsida arbetar när du inte gör det.</p>
  <ul class="g-list">
    <li>När någon googlar företaget.</li>
    <li>När en möjlig kund jämför dig med en konkurrent.</li>
    <li>När någon vill se dina priser.</li>
    <li>När någon funderar på om verksamheten känns seriös.</li>
    <li>Och när någon bestämmer sig för om de ska kontakta dig – eller gå vidare till nästa företag.</li>
  </ul>
  <p>Det är där värdet egentligen finns.</p>
</section>

<section class="ga-sec" aria-labelledby="studio-klaro">
  <h2 id="studio-klaro" data-toc="Priser hos Studio Klaro">Vad kostar en hemsida hos Studio Klaro?</h2>
  <p>Vi arbetar framför allt med mindre och medelstora företag som inte behöver den stora byråprocessen. Vi håller projekten fokuserade, arbetar effektivt och bygger det företaget faktiskt behöver. Det gör att vi kan hålla ett lägre pris, med fokus på design, användarupplevelse, mobilen och en bra teknisk grund.</p>
  <dl class="g-paths g-paths--price">
    <div><dt>Startklar</dt><dd><b>från 7 900 kr</b> En fokuserad one-page-hemsida.</dd></div>
    <div><dt>Professionell</dt><dd><b>från 13 900 kr</b> Upp till fem sidor.</dd></div>
    <div><dt>Komplett närvaro</dt><dd><b>från 22 900 kr</b> Upp till åtta sidor.</dd></div>
  </dl>
  <p>Alla priser är exkl. moms, och slutligt pris och omfattning bekräftas alltid innan projektet startar. Efter lansering kan du välja till Klaro Care för 499 kr/mån – det är valfritt. Se hela upplägget, vad som ingår och vem som äger vad på <a href="/priser">vår prissida</a>.</p>
</section>
`,
};

// Hero-illustration: en hemsida med en organisk prislapp (samma mjuka form som knapparna), en prisstege i fyra steg
// och en offert med avbockade rader. Inline-SVG med viewBox: skalar utan bildfil och utan layoutskift.
function illustration(idp = 'gp') {
  return `<svg class="g-illus-svg" viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <path id="${idp}-cloud" d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/>
  </defs>
  <path class="gi-blob" d="M58 214C40 118 118 38 252 42C352 45 424 26 526 50C614 70 632 162 616 244C600 334 524 400 402 392C302 386 238 406 148 394C66 383 74 306 58 214Z"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(470 22) scale(.58)"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(6 322) scale(.48)"/>

  <rect class="gi-shadow" x="74" y="78" width="330" height="236" rx="20"/>
  <rect class="gi-win" x="70" y="68" width="330" height="236" rx="20"/>
  <circle class="gi-dot" cx="90" cy="88" r="3.5"/><circle class="gi-dot" cx="102" cy="88" r="3.5"/><circle class="gi-dot" cx="114" cy="88" r="3.5"/>
  <line class="gi-rule" x1="70" y1="104" x2="400" y2="104"/>
  <rect class="gi-ink" x="90" y="118" width="46" height="8" rx="4"/>
  <rect class="gi-sk" x="270" y="120" width="26" height="5" rx="2.5"/><rect class="gi-sk" x="302" y="120" width="26" height="5" rx="2.5"/><rect class="gi-sk" x="334" y="120" width="26" height="5" rx="2.5"/>
  <rect class="gi-sk gi-sk--dark" x="90" y="146" width="170" height="12" rx="6"/><rect class="gi-sk gi-sk--dark" x="90" y="166" width="120" height="12" rx="6"/>
  <rect class="gi-sk" x="90" y="190" width="150" height="5" rx="2.5"/><rect class="gi-sk" x="90" y="200" width="120" height="5" rx="2.5"/>
  <rect class="gt-pbtn" x="90" y="218" width="80" height="22" rx="11"/>
  <rect class="gi-card" x="90" y="256" width="92" height="32" rx="10"/><rect class="gi-card" x="190" y="256" width="92" height="32" rx="10"/><rect class="gi-card" x="290" y="256" width="92" height="32" rx="10"/>

  <g class="gp-tag">
    <path class="gp-string" d="M330 92C340 70 364 64 380 80"/>
    <path class="gp-tag-body" d="M300 118C296 98 312 90 334 92L404 98C424 100 432 112 430 130L426 186C424 204 412 212 394 210L322 204C304 202 296 190 298 172Z"/>
    <circle class="gp-hole" cx="324" cy="112" r="6"/>
    <text class="gp-kr" x="364" y="166">kr</text>
  </g>

  <g>
    <rect class="gi-shadow" x="440" y="146" width="160" height="128" rx="20"/>
    <rect class="gt-speed-card" x="436" y="138" width="160" height="128" rx="20"/>
    <rect class="gp-step" x="456" y="226" width="26" height="22" rx="6"/>
    <rect class="gp-step gp-step--on" x="490" y="204" width="26" height="44" rx="6"/>
    <rect class="gp-step" x="524" y="180" width="26" height="68" rx="6"/>
    <rect class="gp-step" x="558" y="154" width="26" height="94" rx="6"/>
  </g>

  <g>
    <rect class="gi-shadow" x="300" y="300" width="200" height="104" rx="18"/>
    <rect class="gp-paper" x="296" y="292" width="200" height="104" rx="18"/>
    <rect class="gi-ink" x="314" y="308" width="64" height="7" rx="3.5"/>
    <circle class="gp-check" cx="320" cy="334" r="7"/><path class="gp-check-i" d="M316.5 334l2.5 2.5 4.5-5"/><rect class="gi-sk" x="334" y="331" width="110" height="5" rx="2.5"/>
    <circle class="gp-check" cx="320" cy="354" r="7"/><path class="gp-check-i" d="M316.5 354l2.5 2.5 4.5-5"/><rect class="gi-sk" x="334" y="351" width="90" height="5" rx="2.5"/>
    <circle class="gp-check gp-check--open" cx="320" cy="374" r="7"/><rect class="gi-sk" x="334" y="371" width="120" height="5" rx="2.5"/>
  </g>
</svg>`;
}
