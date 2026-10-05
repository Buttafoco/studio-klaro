// Guide: Därför tappar du kunder på mobilen utan att märka det
//
// Metadata och innehåll för en guide. Sidan byggs av scripts/build-guides.mjs (gemensam mall för alla guider).
// Lästid och innehållsförteckning räknas fram automatiskt: varje <h2> behöver ett id, och data-toc ger en
// kortare etikett i innehållsförteckningen. Påståenden om Google länkar till Googles egen dokumentation.

const ext = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;
const G = {
  pageExperience: 'https://developers.google.com/search/docs/appearance/page-experience',
  interstitials: 'https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials',
};
const tick = '<span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>';

export default {
  slug: 'darfor-tappar-du-kunder-pa-mobilen',
  title: 'Därför tappar du kunder på mobilen utan att märka det',
  seoTitle: 'Därför tappar du kunder på mobilen | Studio Klaro',
  description: 'Åtta vanliga anledningar till att företag tappar kunder på mobilen – från otydlig hierarki och små knappar till långa formulär och popup-rutor.',
  teaser: 'Hemsidan kan se bra ut på datorn och ändå kosta dig kunder i mobilen. Åtta problem som är lätta att missa – och hur du hittar dem.',
  category: 'Webbdesign',
  eyebrow: 'Mobilupplevelse',
  lead: 'Din hemsida kan se riktigt bra ut på datorn och ändå kosta dig kunder på mobilen. Det räcker inte att sidan får plats på en mobilskärm – den behöver fungera bra där också. Och problemen är inte alltid uppenbara.',
  author: 'Studio Klaro',
  published: '2026-10-05',
  modified: '2026-10-05',
  ogImage: '/guider/mobilen-og.jpg',
  ogImageAlt: 'Illustration av en hemsida som ser bra ut på datorn, bredvid en mobil där rutor och små knappar täcker innehållet.',
  illustrationLabel: 'Illustration av en hemsida som ser bra ut på datorn, bredvid samma sida i en mobil där en popup, en cookie-ruta och en chattikon täcker innehållet, knapparna är små och sidan fortfarande laddar.',
  illustration,
  cta: {
    title: 'Hur fungerar din hemsida i mobilen?',
    text: 'Berätta kort om företaget och din hemsida, så tittar vi på hur den fungerar i mobilen och återkommer med konkreta idéer.',
  },
  body: `
<section class="ga-sec" aria-labelledby="inledning">
  <h2 id="inledning" data-toc="Datorn är inte mobilen">Granskad på datorn, använd i mobilen</h2>
  <p>När en hemsida byggs, granskas och godkänns sker mycket av arbetet på en stor skärm. Där finns gott om plats för rubriker, bilder, menyer och animationer.</p>
  <p>Men kunden kanske möter samma sida stående i tunnelbanan – med en hand, dålig uppkoppling och några sekunders tålamod. Det förändrar hela upplevelsen.</p>
  <p>Här är några av de vanligaste anledningarna till att företag tappar kunder på mobilen utan att märka det.</p>
</section>

<section class="ga-sec" aria-labelledby="mindre-format">
  <h2 id="mindre-format" data-toc="Datorn i mindre format"><span class="g-h2-n">Problem 1<span class="sr-only">:</span></span> Mobilversionen är bara datorversionen i mindre format</h2>
  <p>Det här är kanske det vanligaste misstaget. Hemsidan designas först för datorn. Sedan krymps elementen, staplas under varandra och justeras tills ingenting längre sticker utanför skärmen. Tekniskt sett är sidan responsiv – men upplevelsen kan fortfarande vara dålig.</p>
  <p>I mobilen har besökaren mindre skärmyta, mindre överblick, längre scroll, ett finger i stället för en muspekare och ofta mindre tålamod. Innehållet behöver därför ibland prioriteras annorlunda, inte bara göras mindre.</p>
  <h3>Ett enkelt exempel</h3>
  <figure class="g-fig g-flow">
    <div class="g-flow-grid">
      <div class="g-flow-col">
        <p class="g-mock-label">Frisören på datorn</p>
        <ol class="g-flow-list">
          <li>Stor bild på salongen</li><li>Presentation av varumärket</li><li>Tjänster</li><li>Teamet</li><li>Kundomdömen</li><li class="is-next">Boka tid</li>
        </ol>
      </div>
      <div class="g-flow-col">
        <p class="g-mock-label">Frisören i mobilen</p>
        <ol class="g-flow-list">
          <li class="is-next">Boka tid</li><li class="is-trio">Se priser</li><li class="is-trio">Hitta hit</li><li>Tjänster, teamet och omdömen</li>
        </ol>
      </div>
    </div>
    <figcaption>Påhittat exempel. Inget behöver tas bort – men det mest relevanta ska bli enklare att nå.</figcaption>
  </figure>
  <p>Vi skriver mer om mobilens egna prioriteringar i guiden <a href="/guider/3-misstag-pa-din-hemsida-som-kan-fa-dig-att-tappa-kunder">3 misstag på din hemsida som kan få dig att tappa kunder</a>.</p>
</section>

<section class="ga-sec" aria-labelledby="forsta-skarmen">
  <h2 id="forsta-skarmen" data-toc="Otydlig första skärm"><span class="g-h2-n">Problem 2<span class="sr-only">:</span></span> Det tar för lång tid att förstå vad företaget erbjuder</h2>
  <p>På en stor skärm ser besökaren ofta flera delar av sidan samtidigt. I mobilen ser man kanske bara en stor bild, en rubrik och början på en text. Det gör den första delen av sidan extra viktig.</p>
  <p>Står det något vagt som ”Vi skapar möjligheter tillsammans.” och besökaren måste scrolla flera gånger innan det framgår vad företaget gör, skapar du onödig friktion. I mobilen behöver hierarkin vara extremt tydlig. Besökaren ska snabbt kunna förstå:</p>
  <ol class="g-qs">
    <li><span class="g-qs-n" aria-hidden="true">01</span><span class="g-qs-t">Vad erbjuder ni?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">02</span><span class="g-qs-t">Är det relevant för mig?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">03</span><span class="g-qs-t">Vad kan jag göra härnäst?</span></li>
  </ol>
  <p>Det handlar inte om att pressa in allt ovanför första scrollen. Det handlar om att visa rätt saker först.</p>
</section>

<section class="ga-sec" aria-labelledby="nasta-steg">
  <h2 id="nasta-steg" data-toc="Kunden måste leta"><span class="g-h2-n">Problem 3<span class="sr-only">:</span></span> Kunden måste leta efter nästa steg</h2>
  <p>Föreställ dig att någon hittar din hemsida efter att ha sökt på ”målare Stockholm”. Personen gillar det den ser och vill kontakta dig. Sedan börjar letandet:</p>
  <figure class="g-fig g-hunt">
    <ol class="g-hunt-list">
      <li><span>Kontaktknappen finns bara i menyn</span></li>
      <li><span>Telefonnumret ligger längst ned i sidfoten</span></li>
      <li><span>Formuläret finns på en separat kontaktsida</span></li>
      <li><span>Formuläret har nio fält</span></li>
    </ol>
    <figcaption>Varje extra steg ger personen ännu en möjlighet att lämna sidan.</figcaption>
  </figure>
  <h3>Gör nästa steg tydligt</h3>
  <dl class="g-paths">
    <div><dt>Tjänsteföretag</dt><dd>Få offert</dd></div>
    <div><dt>Restaurang</dt><dd>Boka bord</dd></div>
    <div><dt>Frisör</dt><dd>Boka tid</dd></div>
    <div><dt>Konsult</dt><dd>Boka ett samtal</dd></div>
  </dl>
  <p>Den viktigaste handlingen bör vara lätt att hitta även när personen befinner sig långt ned på sidan. En tydlig knapp på rätt plats kan vara betydligt viktigare än ännu en snygg sektion.</p>
</section>

<section class="ga-sec" aria-labelledby="knappar">
  <h2 id="knappar" data-toc="Knappar för en mus"><span class="g-h2-n">Problem 4<span class="sr-only">:</span></span> Dina knappar är gjorda för en mus</h2>
  <p>På datorn är det ganska enkelt att klicka på en liten textlänk med muspekaren. Med tummen på en telefon är det en annan sak. Små knappar, länkar som ligger för nära varandra, små ikoner utan tillräcklig tryckyta och rullgardinsmenyer som kräver precision skapar små irritationsmoment.</p>
  <p>Var för sig kan de verka obetydliga. Tills kunden trycker på fel sak två gånger och lämnar sidan.</p>
  <figure class="g-fig g-thumb">
    <div class="g-thumb-grid" aria-hidden="true">
      <div class="g-thumb-col">
        <div class="g-thumb-row g-thumb-row--tight"><span>Priser</span><span>Om</span><span>Kontakt</span><span>Boka</span></div>
        <p class="g-mock-label">Små och tätt</p>
      </div>
      <div class="g-thumb-col">
        <div class="g-thumb-row g-thumb-row--roomy"><span>Priser</span><span>Boka tid</span></div>
        <p class="g-mock-label">Stora och luftigt</p>
      </div>
    </div>
    <p class="sr-only">Till vänster fyra små länkar tätt intill varandra. Till höger två stora knappar med luft emellan.</p>
    <figcaption>Tryckytan ska passa en tumme – inte en muspekare.</figcaption>
  </figure>
  <h3>Testa med tummen</h3>
  <p>Gå igenom din hemsida med en hand. Inte försiktigt – använd den som en vanlig besökare skulle göra. Kan du enkelt:</p>
  <ul class="g-weigh">
    <li><span>öppna menyn?</span></li>
    <li><span>trycka på alla knappar?</span></li>
    <li><span>stänga popup-rutor?</span></li>
    <li><span>välja alternativ?</span></li>
    <li><span>fylla i formulär?</span></li>
    <li><span>gå tillbaka?</span></li>
  </ul>
  <p>Det är ett väldigt enkelt test som avslöjar mycket.</p>
</section>

<section class="ga-sec" aria-labelledby="menyn">
  <h2 id="menyn" data-toc="Menyn som förråd"><span class="g-h2-n">Problem 5<span class="sr-only">:</span></span> Mobilmenyn har blivit ett förråd</h2>
  <p>På datorn finns gott om plats i navigationen. I mobilen hamnar allt bakom en menyikon – och då är det lätt att tänka ”vi lägger in allt där”.</p>
  <figure class="g-fig g-menus">
    <div class="g-menus-grid">
      <div class="g-menu g-menu--full">
        <p class="g-mock-label">Förrådet</p>
        <ul aria-label="Exempel på en överfull mobilmeny">
          <li>Hem</li><li>Om oss</li><li>Alla tjänster</li><li>Alla undersidor</li><li>Blogg</li><li>Case</li><li>FAQ</li><li>Kontakt</li><li>Karriär</li><li>Nyheter</li><li>Partners</li><li>Instagram</li><li>Facebook</li><li>LinkedIn</li>
        </ul>
      </div>
      <div class="g-menu g-menu--focus">
        <p class="g-mock-label">Det kunden behöver</p>
        <ul aria-label="Exempel på en prioriterad mobilmeny">
          <li>Tjänster</li><li>Case</li><li>Om oss</li><li>Kontakt</li>
        </ul>
        <span class="g-mock-btn g-mock-btn--block">Få offert</span>
      </div>
    </div>
    <figcaption>En mobilmeny ska inte vara en kopia av hela webbplatsen. Den ska hjälpa personen att snabbt komma vidare.</figcaption>
  </figure>
  <p>För ett mindre företag räcker det ofta med tjänster, case, om oss och kontakt – plus en tydlig knapp för det viktigaste nästa steget. Det är betydligt enklare att navigera.</p>
</section>

<section class="ga-sec" aria-labelledby="formularet">
  <h2 id="formularet" data-toc="Formulär ingen orkar fylla i"><span class="g-h2-n">Problem 6<span class="sr-only">:</span></span> Formuläret fungerar – men ingen vill fylla i det</h2>
  <p>Kontaktformulär är ett klassiskt exempel på något som fungerar tekniskt men ändå skapar problem. På datorn känns sex eller sju fält kanske inte särskilt jobbigt. I mobilen innebär varje fält ett tryck, ett tangentbord som öppnas, skrivande, stängning, scroll – och sedan nästa fält.</p>
  <p>Behöver du verkligen veta företagsnamn, organisationsnummer, telefon, mejl, adress, budget, deadline, tjänst och en lång projektbeskrivning innan du ens har pratat med personen? Förmodligen inte.</p>
  <figure class="g-fig g-forms">
    <div class="g-forms-grid" aria-hidden="true">
      <div class="g-form g-form--long">
        <p class="g-mock-label">Nio fält</p>
        <span>Företagsnamn</span><span>Organisationsnummer</span><span>Telefon</span><span>Mejl</span><span>Adress</span><span>Budget</span><span>Deadline</span><span>Tjänst</span><span class="is-area">Projektbeskrivning</span>
      </div>
      <div class="g-form g-form--short">
        <p class="g-mock-label">Tre fält</p>
        <span>Namn</span><span>E-post</span><span class="is-area">Vad behöver du hjälp med?</span>
        <em class="g-mock-btn g-mock-btn--block">Skicka</em>
      </div>
    </div>
    <p class="sr-only">Ett formulär med nio fält bredvid ett med tre: namn, e-post och vad du behöver hjälp med.</p>
    <figcaption>Fråga bara efter det du behöver nu. Resten kan ni ta senare.</figcaption>
  </figure>
  <p>Ju mindre arbete du kräver av kunden innan kontakten är etablerad, desto enklare blir det att faktiskt skicka förfrågan.</p>
</section>

<section class="ga-sec" aria-labelledby="langsam">
  <h2 id="langsam" data-toc="Långsam i mobilen"><span class="g-h2-n">Problem 7<span class="sr-only">:</span></span> Sidan känns långsam på mobilen</h2>
  <p>En hemsida kan kännas snabb på kontorets wifi och betydligt långsammare på en telefon ute på stan. Var för sig är de små, men tillsammans gör de sidan tyngre:</p>
  <ul class="g-list">
    <li><span>stora bilder</span></li>
    <li><span>video som spelas automatiskt</span></li>
    <li><span>tunga animationer</span></li>
    <li><span>många typsnitt</span></li>
    <li><span>spårningsskript</span></li>
    <li><span>chattverktyg och andra externa tjänster</span></li>
  </ul>
  <p>Mobilanvändaren märker det snabbt. Google ${ext(G.pageExperience, 'lyfter fram')} bland annat Core Web Vitals och att innehållet visas bra på mobila enheter som en del av en bra sidupplevelse. Vill du se hur din sida klarar grunderna kan du göra en <a href="/seo-koll">kostnadsfri SEO-koll</a>.</p>
  <h3>Design och prestanda hör ihop</h3>
  <p>Det är lätt att tänka att designern gör designen och utvecklaren löser prestandan. Men bra webbdesign behöver ta hänsyn till båda. Kräver en animation så mycket att sidan känns långsam i mobilen är det också ett designproblem. Och är en video högst upp sidans tyngsta element utan att tillföra något, är det värt att fråga om den verkligen behövs.</p>
  <p class="g-closing">En modern hemsida ska inte bara se snabb ut. Den ska kännas snabb.</p>
</section>

<section class="ga-sec" aria-labelledby="popup">
  <h2 id="popup" data-toc="Rutor som tar över"><span class="g-h2-n">Problem 8<span class="sr-only">:</span></span> Cookie-rutor och popup-fönster tar över hela skärmen</h2>
  <p>På datorn tar en cookie-ruta kanske upp en liten del av skärmen. I mobilen kan samma ruta täcka halva sidan. Lägg sedan till en chattikon, ett nyhetsbrev, en erbjudandepopup och kanske en fast knapp längst ned – plötsligt finns det nästan inget innehåll kvar.</p>
  <figure class="g-fig g-overlay">
    <div class="g-overlay-stage">
      <div class="g-phone g-phone--crowded" aria-hidden="true">
        <span class="g-phone-notch"></span>
        <span class="g-pl g-pl--nav"></span>
        <span class="g-pl g-pl--h"></span><span class="g-pl"></span><span class="g-pl g-pl--short"></span>
        <span class="g-ov g-ov--popup"><b>Nyhetsbrev</b><i></i><i></i><em>×</em></span>
        <span class="g-ov g-ov--chat"></span>
        <span class="g-ov g-ov--sticky">Boka nu</span>
        <span class="g-ov g-ov--cookie"><b>Cookies</b><i></i><span><u></u><u></u></span></span>
      </div>
    </div>
    <p class="sr-only">En mobil där en popup för nyhetsbrev, en chattikon, en fast knapp och en cookie-ruta täcker nästan hela sidan.</p>
    <figcaption>Varje ruta kan vara motiverad var för sig. Tillsammans lämnar de nästan ingen plats åt det besökaren kom för.</figcaption>
  </figure>
  <p>Google ${ext(G.interstitials, 'beskriver')} också störande rutor och dialoger som täcker innehållet som ett problem: de gör det svårare både för besökare och för sökmotorer att ta del av sidan. I stället föreslår Google banners som bara tar upp en liten del av skärmen.</p>
  <p>Vissa rutor behövs – en cookie-ruta kan till exempel vara nödvändig. Men den kan utformas så att den inte tar över hela skärmen, och du kan vara sparsam med allt annat som läggs ovanpå innehållet.</p>
  <aside class="g-check" aria-label="Kontrollfråga">
    <p class="g-check-label">Kontrollfråga</p>
    <p class="g-check-q">Hur mycket av själva sidan syns i mobilen när allt har laddat klart?</p>
  </aside>
</section>

<section class="ga-sec" aria-labelledby="testa">
  <h2 id="testa" data-toc="Testa din egen sida">Testa din egen hemsida i mobilen</h2>
  <p>Ta fram telefonen, öppna din hemsida via mobilnätet och gå igenom den som en ny kund. Stämmer det här?</p>
  <ul class="g-checklist">
    <li>${tick}Det viktigaste är lätt att nå – inte bara krympt.</li>
    <li>${tick}Det framgår direkt vad du erbjuder.</li>
    <li>${tick}Nästa steg finns nära till hands hela vägen.</li>
    <li>${tick}Knappar och länkar går att träffa med tummen.</li>
    <li>${tick}Menyn innehåller det kunden behöver – inte allt.</li>
    <li>${tick}Formuläret frågar bara efter det du behöver nu.</li>
    <li>${tick}Sidan känns snabb även utanför kontorets wifi.</li>
    <li>${tick}Innehållet syns – inte rutorna ovanpå det.</li>
  </ul>
  <p class="g-closing">Det är sällan en enda stor sak som får en kund att lämna. Oftare är det många små – och de flesta går att hitta med en telefon och några minuters ärlig testning.</p>
</section>
`,
};

// Hero-illustration: samma hemsida på datorn (ser bra ut, bock) och i mobilen, där en popup, en cookie-ruta och en
// chattikon täcker innehållet, länkarna är små och sidan fortfarande laddar. Inline-SVG med viewBox: inget layoutskift.
function illustration(idp = 'gm') {
  return `<svg class="g-illus-svg" viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <path id="${idp}-cloud" d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/>
    <clipPath id="${idp}-screen"><rect x="358" y="104" width="164" height="290" rx="22"/></clipPath>
  </defs>
  <path class="gi-blob" d="M58 214C40 118 118 38 252 42C352 45 424 26 526 50C614 70 632 162 616 244C600 334 524 400 402 392C302 386 238 406 148 394C66 383 74 306 58 214Z"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(478 26) scale(.56)"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(8 318) scale(.48)"/>

  <g class="gm-desk">
    <rect class="gi-shadow" x="64" y="76" width="330" height="236" rx="20"/>
    <rect class="gi-win" x="60" y="66" width="330" height="236" rx="20"/>
    <circle class="gi-dot" cx="80" cy="86" r="3.5"/><circle class="gi-dot" cx="92" cy="86" r="3.5"/><circle class="gi-dot" cx="104" cy="86" r="3.5"/>
    <line class="gi-rule" x1="60" y1="102" x2="390" y2="102"/>
    <rect class="gi-ink" x="80" y="116" width="46" height="8" rx="4"/>
    <rect class="gi-sk" x="246" y="118" width="26" height="5" rx="2.5"/><rect class="gi-sk" x="278" y="118" width="26" height="5" rx="2.5"/>
    <rect class="gm-hero" x="80" y="138" width="290" height="100" rx="14"/>
    <rect class="gm-hero-h" x="98" y="162" width="150" height="12" rx="6"/><rect class="gm-hero-t" x="98" y="182" width="110" height="7" rx="3.5"/>
    <rect class="gt-pbtn" x="98" y="202" width="70" height="20" rx="10"/>
    <rect class="gi-card" x="80" y="250" width="90" height="34" rx="10"/><rect class="gi-card" x="180" y="250" width="90" height="34" rx="10"/><rect class="gi-card" x="280" y="250" width="90" height="34" rx="10"/>
    <circle class="gm-ok" cx="378" cy="70" r="16"/><path class="gm-ok-tick" d="M371 70l5 5 9-10"/>
  </g>

  <g>
    <rect class="gi-shadow" x="356" y="108" width="176" height="302" rx="30"/>
    <rect class="gi-phone-body" x="352" y="98" width="176" height="302" rx="30"/>
    <g clip-path="url(#${idp}-screen)">
      <rect class="gi-ink" x="420" y="110" width="40" height="7" rx="3.5"/>
      <rect class="gi-sk" x="370" y="132" width="16" height="4" rx="2"/><rect class="gi-sk" x="390" y="132" width="16" height="4" rx="2"/><rect class="gi-sk" x="410" y="132" width="16" height="4" rx="2"/><rect class="gi-sk" x="430" y="132" width="16" height="4" rx="2"/>
      <rect class="gm-hero" x="368" y="146" width="144" height="60" rx="10"/>
      <rect class="gi-sk" x="370" y="216" width="130" height="4" rx="2"/><rect class="gi-sk" x="370" y="226" width="110" height="4" rx="2"/>
      <rect class="gm-pop-shade" x="358" y="104" width="164" height="290"/>
      <rect class="gm-pop" x="372" y="190" width="136" height="88" rx="14"/>
      <rect class="gi-ink" x="386" y="206" width="70" height="7" rx="3.5"/>
      <rect class="gi-sk" x="386" y="222" width="104" height="4" rx="2"/><rect class="gi-sk" x="386" y="232" width="88" height="4" rx="2"/>
      <rect class="gt-pbtn" x="386" y="248" width="60" height="18" rx="9"/>
      <path class="gm-x" d="M488 202l8 8M496 202l-8 8"/>
      <rect class="gm-cookie" x="358" y="324" width="164" height="70"/>
      <rect class="gm-cookie-t" x="372" y="336" width="90" height="6" rx="3"/><rect class="gm-cookie-t gm-cookie-t--dim" x="372" y="348" width="120" height="4" rx="2"/>
      <rect class="gm-cookie-b" x="372" y="362" width="60" height="18" rx="9"/><rect class="gm-cookie-b gm-cookie-b--alt" x="440" y="362" width="60" height="18" rx="9"/>
    </g>
    <circle class="gm-chat" cx="498" cy="300" r="15"/><path class="gm-chat-i" d="M491 297h14M491 303h9"/>
  </g>

  <g class="gm-tap"><circle class="gm-tap-r" cx="398" cy="134" r="10"/><circle class="gm-tap-r gm-tap-r--2" cx="398" cy="134" r="18"/></g>

  <g>
    <rect class="gt-speed-card" x="530" y="140" width="84" height="48" rx="16"/>
    <path class="gm-spin-track" d="M572 152a12 12 0 1 1 0 24a12 12 0 1 1 0-24"/>
    <path class="gm-spin" d="M572 152a12 12 0 0 1 12 12"/>
  </g>
</svg>`;
}
