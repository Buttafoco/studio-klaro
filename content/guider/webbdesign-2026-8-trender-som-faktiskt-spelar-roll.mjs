// Guide: Webbdesign 2026 – 8 trender som faktiskt spelar roll
//
// Metadata och innehåll för en guide. Sidan byggs av scripts/build-guides.mjs (gemensam mall för alla guider).
// Lästid och innehållsförteckning räknas fram automatiskt: varje <h2> behöver ett id, och data-toc ger en
// kortare etikett i innehållsförteckningen. Påståenden om Webflow och Google länkar till källan.

const WEBFLOW = 'https://webflow.com/blog/web-design-trends-2026';
const ext = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;

export default {
  slug: 'webbdesign-2026-8-trender-som-faktiskt-spelar-roll',
  title: 'Webbdesign 2026: 8 trender som faktiskt spelar roll',
  seoTitle: 'Webbdesign 2026: 8 trender som spelar roll | Studio Klaro',
  description: 'Åtta webbdesigntrender för 2026 som faktiskt spelar roll för företag – från egen identitet och kortare text till mobilen och prestanda.',
  teaser: 'Mindre mallkänsla, kortare text och mer mänsklighet. Åtta trender som är värda att följa – och varför du inte behöver följa alla.',
  category: 'Webbdesign',
  eyebrow: 'Trender i webbdesign',
  lead: 'Webbdesign förändras snabbt, men ditt företag behöver inte bygga om hemsidan varje gång en ny trend dyker upp. 2026 handlar mindre om en viss stil och mer om tydlighet, identitet, användarupplevelse – och att våga kännas mänsklig.',
  author: 'Studio Klaro',
  published: '2026-10-05',
  featured: true,
  ogImage: '/guider/webbdesign-2026-og.jpg',
  ogImageAlt: 'Illustration av en hemsida med stor typografi, en handritad understrykning, en mobilvy med tydliga val och en snabbhetsmätare.',
  illustrationLabel: 'Illustration av en hemsida som samlar årets trender: stor typografi med en handritad understrykning, kort text, en organisk knapp med muspekare, en mobilvy med tydliga val och en snabbhetsmätare.',
  illustration,
  cta: {
    title: 'Är din hemsida redo för 2026?',
    text: 'Vi hjälper företag att skapa hemsidor med fokus på tydlighet och användarupplevelse – inte design för designens skull. Berätta kort om din hemsida, så tittar vi på vad som fungerar i dag och vad som kan bli bättre.',
  },
  body: `
<section class="ga-sec" aria-labelledby="inledning">
  <h2 id="inledning" data-toc="Varför 2026 är annorlunda">Snyggt räcker inte längre</h2>
  <p>AI har gjort det betydligt enklare att skapa tekniskt snygga hemsidor. Det höjer ribban, men skapar också ett nytt problem: många webbplatser börjar kännas väldigt lika.</p>
  <p>Webflow beskriver samma utveckling i sin ${ext(WEBFLOW, 'trendrapport för 2026')}. När avancerade designverktyg blir tillgängliga för fler blir en egen visuell identitet och ett tydligt hantverk allt viktigare.</p>
  <p>Här är åtta trender som vi på Studio Klaro tycker faktiskt är värda att hålla koll på – och vad de betyder för ett företag som vill ha en hemsida som fungerar.</p>
</section>

<section class="ga-sec" aria-labelledby="identitet">
  <h2 id="identitet" data-toc="Egen identitet"><span class="g-h2-n">Trend 1<span class="sr-only">:</span></span> Mindre mallkänsla – mer egen identitet</h2>
  <p>Det har aldrig varit enklare att skapa en snygg hemsida. Mallar, AI-verktyg och moderna webbplattformar gör att nästan vilket företag som helst snabbt kan få fram en professionell layout. Det är både positivt och negativt.</p>
  <p>Resultatet är att många hemsidor börjar se likadana ut:</p>
  <figure class="g-fig g-stack">
    <ol class="g-stack-list">
      <li><span class="g-stack-b g-stack-b--h"></span>Stor rubrik</li>
      <li><span class="g-stack-b g-stack-b--grad"></span>Gradient</li>
      <li><span class="g-stack-b g-stack-b--cards"><i></i><i></i><i></i></span>Tre kort</li>
      <li><span class="g-stack-b g-stack-b--logos"><i></i><i></i><i></i><i></i><i></i></span>Loggor i en rad</li>
      <li><span class="g-stack-b g-stack-b--quote"></span>Kundomdömen</li>
      <li><span class="g-stack-b g-stack-b--cta"></span>Knapp</li>
    </ol>
    <figcaption>Det fungerar – men det blir svårare att komma ihåg vilket företag man faktiskt besökte.</figcaption>
  </figure>

  <h3>2026 handlar därför mer om igenkänning</h3>
  <p>Det betyder inte att varje hemsida behöver vara extrem eller experimentell. Snarare att några delar känns tydligt kopplade till just ert företag. Det kan vara ett särskilt sätt att använda färg, egen typografi, illustrationer, fotografi, former, ikoner, rörelse, tonen i texten eller ett återkommande grafiskt element.</p>
  <p>Webflow pekar ut just egna visuella system och effekter som en tydlig trend. När avancerade verktyg blir vanligare ligger skillnaden allt mer i hur varumärket använder dem.</p>

  <aside class="g-check" aria-label="Kontrollfråga">
    <p class="g-check-label">Kontrollfråga</p>
    <p class="g-check-q">Fråga inte bara om hemsidan ser modern ut. Fråga: skulle någon känna igen att det här är ni om logotypen försvann?</p>
  </aside>
</section>

<section class="ga-sec" aria-labelledby="mindre-text">
  <h2 id="mindre-text" data-toc="Mindre, bättre text"><span class="g-h2-n">Trend 2<span class="sr-only">:</span></span> Mindre text – bättre text</h2>
  <p>AI har gjort det väldigt enkelt att producera text, och det märks. Hemsidor fylls snabbt med långa stycken om vision, process, värderingar, lösningar och passion. Problemet är att besökaren sällan vill läsa allt.</p>
  <p>Därför växer nästan motsatsen fram: kortare och mer genomtänkt text. Webflow kallar det minimalism i texten – företag tar bort det som inte tillför något och låter de viktigaste budskapen få mer utrymme.</p>
  <figure class="g-fig g-words">
    <div class="g-words-row g-words-row--before">
      <p class="g-mock-label">Före</p>
      <p class="g-words-q">”Vi erbjuder innovativa och skräddarsydda lösningar som hjälper företag att nå sin fulla potential i en ständigt föränderlig digital värld.”</p>
    </div>
    <div class="g-words-row g-words-row--after">
      <p class="g-mock-label">Efter</p>
      <p class="g-words-q">”Vi bygger hemsidor för svenska småföretag.”</p>
    </div>
    <figcaption>Den andra låter kanske inte lika avancerad. Men du förstår direkt vad företaget gör.</figcaption>
  </figure>
  <h3>En bra tumregel</h3>
  <p>Varje sektion på hemsidan bör ha ett tydligt jobb. Kan du inte förklara varför en text behöver finnas där kan den förmodligen kortas ned eller tas bort.</p>
</section>

<section class="ga-sec" aria-labelledby="skanna">
  <h2 id="skanna" data-toc="Byggt för att skannas"><span class="g-h2-n">Trend 3<span class="sr-only">:</span></span> Hemsidor designas för att skannas</h2>
  <p>De flesta läser inte en företagssida från första ordet till det sista. Vi skannar: rubrik, bild, pris, tjänster, omdömen, knapp. Sedan avgör vi om något är intressant nog att läsa mer om.</p>
  <p>Därför blir så kallade TL;DR-upplevelser vanligare – sidor där besökaren snabbt får en överblick och sedan själv väljer vad den vill fördjupa sig i. Webflow lyfter det särskilt för komplexa tjänster, B2B-företag och konsultbolag.</p>
  <figure class="g-fig g-flow">
    <div class="g-flow-grid">
      <div class="g-flow-col">
        <p class="g-mock-label">En lång vägg</p>
        <ol class="g-flow-list g-flow-list--wall">
          <li class="is-h">Rubrik</li><li>Långt textstycke</li><li>Långt textstycke</li><li>Långt textstycke</li>
        </ol>
      </div>
      <div class="g-flow-col">
        <p class="g-mock-label">Flera ingångar</p>
        <ol class="g-flow-list">
          <li class="is-h">Tydlig rubrik</li><li>Kort förklaring</li><li class="is-trio">Tre konkreta fördelar</li><li>Visuell förklaring</li><li>Resultat eller case</li><li class="is-next">Nästa steg</li>
        </ol>
      </div>
    </div>
    <figcaption>Samma innehåll kan byggas som en lång vägg eller med flera tydliga ingångar.</figcaption>
  </figure>
  <p>För småföretag är det här en av de viktigaste trenderna på hela listan. Du behöver inte få människor att läsa mer – du behöver göra det enklare för dem att hitta det de faktiskt letar efter.</p>
</section>

<section class="ga-sec" aria-labelledby="typografi">
  <h2 id="typografi" data-toc="Större typografi"><span class="g-h2-n">Trend 4<span class="sr-only">:</span></span> Typografi får ta större plats</h2>
  <p>Under flera år har många företagssidor använt ungefär samma upplägg: en stor rubrik och mindre brödtext, båda i samma typ av typsnitt. 2026 ser vi betydligt mer personlighet – större rubriker, tydligare storleksskillnader, variabla typsnitt, blandade typstilar och text som fungerar som grafiskt element. Ibland med en diskret animation direkt i texten.</p>
  <p>Webflow lyfter de här textbehandlingarna som en av årets riktningar, där typografin används för att dra uppmärksamhet till det viktigaste snarare än som dekoration.</p>
  <figure class="g-fig g-type">
    <div class="g-type-stage" aria-hidden="true">
      <span class="g-type-1">Det viktigaste</span>
      <span class="g-type-2">ska kännas viktigast.</span>
      <span class="g-type-3">Det sekundära tar ett steg tillbaka – mindre, lugnare och i en dämpad färg.</span>
    </div>
    <p class="sr-only">Typografiexempel i tre nivåer: en mycket stor rubrik, en mellanstor fortsättning och en liten, dämpad brödtext.</p>
    <figcaption>Hierarki i tre nivåer: storlek, vikt och färg berättar vad som ska läsas först.</figcaption>
  </figure>
  <h3>Men större är inte automatiskt bättre</h3>
  <p>En enorm rubrik som tar upp hela skärmen är inte bra design om kunden fortfarande inte förstår vad du erbjuder. Typografi ska förstärka hierarkin – det är där trenden faktiskt blir användbar.</p>
</section>

<section class="ga-sec" aria-labelledby="animation">
  <h2 id="animation" data-toc="Animation som guidar"><span class="g-h2-n">Trend 5<span class="sr-only">:</span></span> Animation används för att guida – inte imponera</h2>
  <p>För några år sedan var det nästan en tävling om vem som kunde bygga den mest spektakulära scrollupplevelsen. Objekt flög över skärmen, text roterade och hela hemsidan fungerade som en film. Det kan fortfarande vara fantastiskt när det görs rätt.</p>
  <p>Men för de flesta företag finns en viktigare användning: att visa besökaren vad som händer och vart den ska titta. Till exempel:</p>
  <ul class="g-list">
    <li>ett kort som reagerar när du håller muspekaren över det</li>
    <li>en meny som öppnas mjukt</li>
    <li>en knapp som ger tydlig återkoppling</li>
    <li>ett steg i en process som aktiveras när du scrollar</li>
    <li>en produktbild som ändras när du väljer något</li>
    <li>en markering som visar hur långt du har kommit</li>
  </ul>
  <p>Webflow beskriver det som guidad scrollning: rörelse och visuella signaler som hjälper besökaren att förstå var den befinner sig och vad som kommer härnäst. Innehållsförteckningen på den här sidan är ett litet exempel – den markerar avsnittet du läser just nu.</p>
  <aside class="g-check" aria-label="Kontrollfråga">
    <p class="g-check-label">Kontrollfråga</p>
    <p class="g-check-q">Hjälper animationen besökaren – eller finns den bara för att den är snygg?</p>
  </aside>
</section>

<section class="ga-sec" aria-labelledby="manskligt">
  <h2 id="manskligt" data-toc="Det mänskliga"><span class="g-h2-n">Trend 6<span class="sr-only">:</span></span> Det mänskliga får en comeback</h2>
  <p>När nästan perfekta bilder, texter och layouter kan genereras på några sekunder händer något intressant: det perfekta börjar kännas mindre speciellt.</p>
  <p>Därför ser vi mer av handritade detaljer, organiska former, riktig fotografering, personliga illustrationer, texturer, asymmetri och små visuella ojämnheter. Webflows trendanalys beskriver samma rörelse – när digitalt skapande blir mer automatiserat söker sig vissa varumärken mot uttryck som tydligare signalerar mänskligt hantverk.</p>
  <p>Det betyder inte att hemsidor ska se amatörmässiga ut. Det handlar om att inte designa bort all personlighet.</p>
  <h3>För småföretag är det extra relevant</h3>
  <dl class="g-paths">
    <div><dt>Frisörsalong</dt><dd>Visa salongen.</dd></div>
    <div><dt>Restaurang</dt><dd>Visa maten, köket och människorna bakom den.</dd></div>
    <div><dt>Konsultbolag</dt><dd>Visa personerna kunden faktiskt kommer att arbeta med.</dd></div>
  </dl>
  <p>En riktig bild från verksamheten kan ibland skapa mer förtroende än världens snyggaste AI-genererade bild.</p>
</section>

<section class="ga-sec" aria-labelledby="mobilen">
  <h2 id="mobilen" data-toc="Designat för mobilen"><span class="g-h2-n">Trend 7<span class="sr-only">:</span></span> Mobilen först betyder mer än responsiv design</h2>
  <p>Att en hemsida fungerar i mobilen borde vara en självklarhet 2026. Men det räcker inte längre. Mobilupplevelsen behöver vara designad för mobilen, inte vara datorversionen ihoptryckt på en mindre skärm.</p>
  <p>Google använder dessutom ${ext('https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing', 'mobilversionen av webbplatsens innehåll')} för indexering och ranking, och rekommenderar responsiv webbdesign.</p>
  <p>I mobilen ändras förutsättningarna: skärmen är mindre, besökaren använder fingret i stället för en mus, sidan blir längre att scrolla och sammanhanget är ofta ett helt annat.</p>
  <figure class="g-fig g-devices">
    <div class="g-devices-grid">
      <div class="g-desk" aria-hidden="true">
        <div class="g-mock-bar"><i></i><i></i><i></i></div>
        <div class="g-desk-body">
          <span class="g-desk-img"></span>
          <span class="g-desk-text"><b>Om vårt kök</b><i></i><i></i><i></i><em></em></span>
        </div>
      </div>
      <div class="g-phone g-phone--own g-phone--resto" aria-hidden="true">
        <span class="g-phone-notch"></span>
        <span class="g-pnav"><b></b><em>Meny</em></span>
        <span class="g-ph">Restaurang i Uppsala</span>
        <span class="g-mock-btn g-mock-btn--block">Boka bord</span>
        <span class="g-ptile">Meny <span>→</span></span>
        <span class="g-ptile">Hitta hit <span>→</span></span>
      </div>
    </div>
    <p class="sr-only">Påhittat exempel: på datorn ger sidan plats åt en stor bild och berättelsen om köket. I mobilen ligger ”Boka bord”, ”Meny” och ”Hitta hit” direkt högst upp.</p>
    <figcaption>Påhittat exempel. Samma innehåll, olika prioritering: berättelsen får plats på datorn, medan mobilen visar Boka bord, Meny och Hitta hit direkt.</figcaption>
  </figure>
  <p>Det är skillnaden mellan en hemsida som bara är responsiv och en upplevelse som faktiskt är genomtänkt för olika skärmar. Vi skriver mer om det i guiden <a href="/guider/3-misstag-pa-din-hemsida-som-kan-fa-dig-att-tappa-kunder">3 misstag på din hemsida som kan få dig att tappa kunder</a>.</p>
</section>

<section class="ga-sec" aria-labelledby="prestanda">
  <h2 id="prestanda" data-toc="Prestanda"><span class="g-h2-n">Trend 8<span class="sr-only">:</span></span> Prestanda blir en del av designen</h2>
  <p>Den sista trenden syns inte på en skärmbild, men besökaren känner den direkt: hastighet. En hemsida kan ha fantastiska animationer, högupplösta videor och avancerade effekter – men blir upplevelsen långsam har designen misslyckats.</p>
  <p>Google rekommenderar bra ${ext('https://developers.google.com/search/docs/appearance/core-web-vitals', 'Core Web Vitals')} som en del av en god användarupplevelse. Mätvärdena tittar bland annat på laddningstid, hur snabbt sidan svarar och hur stabil den är medan den laddas.</p>
  <p>Det betyder inte att varje företag behöver jaga ett perfekt resultat i PageSpeed. Men prestanda behöver finnas med redan när sidan formges. Behöver vi verkligen:</p>
  <ul class="g-weigh">
    <li><span>fyra videor?</span></li>
    <li><span>tre olika typsnitt?</span></li>
    <li><span>en enorm bakgrundsanimation?</span></li>
    <li><span>tio skript från andra tjänster?</span></li>
  </ul>
  <p>Gör en effekt hemsidan märkbart långsammare behöver den bidra med något betydande för att vara värd det. Vill du veta hur din nuvarande sida klarar grunderna kan du göra en <a href="/seo-koll">kostnadsfri SEO-koll</a>.</p>
  <h3>Bra webbdesign 2026 känns snabb</h3>
  <ul class="g-list">
    <li>Klick ger respons.</li>
    <li>Sidan känns stabil.</li>
    <li>Innehållet dyker upp snabbt.</li>
    <li>Animationerna flyter.</li>
  </ul>
  <p>Det är kanske inte den mest spännande trenden. Men det är en av de viktigaste.</p>
</section>

<section class="ga-sec" aria-labelledby="alla-trender">
  <h2 id="alla-trender" data-toc="Måste du följa alla?">Så behöver din hemsida följa alla trender?</h2>
  <p>Nej. Och det är egentligen hela poängen. En bra företagssida behöver inte se ut som den vann ett designpris. Den behöver:</p>
  <ul class="g-checklist">
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>vara tydlig</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>kännas trovärdig</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>fungera bra i mobilen</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>ladda snabbt</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>ha en egen identitet</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>göra nästa steg enkelt för kunden</li>
  </ul>
  <p>Trender är användbara när de förbättrar någon av de sakerna – inte när de läggs till bara för att hemsidan ska kännas modern. En frisör, en redovisningsbyrå och ett techbolag behöver inte samma design. Det viktiga är att designen passar företaget och människorna som ska använda hemsidan.</p>
</section>

<section class="ga-sec" aria-labelledby="intention">
  <h2 id="intention" data-toc="Intention före effekter">Webbdesign 2026 handlar om intention</h2>
  <p>Om vi skulle sammanfatta utvecklingen med ett ord skulle det vara <strong>intention</strong>. Varje del av sidan borde kunna svara på en fråga om varför:</p>
  <ol class="g-qs">
    <li><span class="g-qs-n" aria-hidden="true">01</span><span class="g-qs-t">Varför finns den här sektionen?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">02</span><span class="g-qs-t">Varför använder vi den här animationen?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">03</span><span class="g-qs-t">Varför står den här texten här?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">04</span><span class="g-qs-t">Varför ser knappen ut så?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">05</span><span class="g-qs-t">Varför behöver kunden scrolla hit?</span></li>
  </ol>
  <p>Ju bättre svar du har på de frågorna, desto mindre viktigt blir det att följa varje ny trend.</p>
  <p class="g-closing">Den mest moderna hemsidan är inte den med flest effekter. Det är den som känns genomtänkt.</p>
  <p>Vill du se hur vi arbetar med det i praktiken? Titta på <a href="/#portfolio">några av våra projekt</a> eller läs om <a href="/#processen">hur ett projekt går till</a>.</p>
</section>
`,
};

// Hero-illustration: en hemsida som samlar årets trender – stor typografi med handritad understrykning (identitet,
// typografi, det mänskliga), kort text, en organisk knapp med muspekare (animation som guidar), en mobilvy med tydliga
// val (mobilen först) och en snabbhetsmätare (prestanda). Inline-SVG med viewBox: skalar utan bildfil och layoutskift.
function illustration(idp = 'gt') {
  return `<svg class="g-illus-svg" viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <path id="${idp}-cloud" d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/>
  </defs>
  <path class="gi-blob" d="M58 214C40 118 118 38 252 42C352 45 424 26 526 50C614 70 632 162 616 244C600 334 524 400 402 392C302 386 238 406 148 394C66 383 74 306 58 214Z"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(462 18) scale(.6)"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(4 300) scale(.5)"/>

  <g>
    <rect class="gi-shadow" x="74" y="80" width="404" height="276" rx="22"/>
    <rect class="gi-win" x="70" y="68" width="404" height="276" rx="22"/>
    <circle class="gi-dot" cx="92" cy="90" r="4"/><circle class="gi-dot" cx="106" cy="90" r="4"/><circle class="gi-dot" cx="120" cy="90" r="4"/>
    <rect class="gi-url" x="140" y="84" width="124" height="12" rx="6"/>
    <line class="gi-rule" x1="70" y1="110" x2="474" y2="110"/>
    <rect class="gi-ink" x="94" y="126" width="56" height="10" rx="5"/>
    <rect class="gi-sk" x="330" y="128" width="34" height="6" rx="3"/><rect class="gi-sk" x="372" y="128" width="34" height="6" rx="3"/><rect class="gi-sk" x="414" y="128" width="34" height="6" rx="3"/>

    <text class="gt-big" x="94" y="200">Tydligt.</text>
    <path class="gt-scribble" d="M98 214C140 206 196 220 244 210C266 206 280 208 290 212"/>
    <rect class="gi-sk" x="96" y="236" width="170" height="7" rx="3.5"/>

    <path class="gt-blobbtn" d="M100 286C96 270 112 262 136 263C158 264 172 266 196 264C220 262 232 270 230 284C228 298 214 304 192 303C170 302 150 306 128 305C108 304 102 298 100 286Z"/>
    <text class="gt-btn-t" x="165" y="289">Boka tid</text>
    <path class="gt-cursor" d="M222 296l0 26l7-7l6 12l5-2.5l-6-12l10 0z"/>
    <path class="gt-motion" d="M256 300c8-6 14-6 20 0M260 314c6-4 10-4 14 0"/>

    <rect class="gt-sticker" x="318" y="166" width="120" height="96" rx="20" transform="rotate(4 378 214)"/>
    <path class="gt-star" d="M378 190l6 15 16 1-12 10 4 16-14-9-14 9 4-16-12-10 16-1z" transform="rotate(4 378 214)"/>
  </g>

  <g>
    <rect class="gi-shadow" x="446" y="158" width="140" height="244" rx="26"/>
    <rect class="gi-phone-body" x="442" y="148" width="140" height="244" rx="26"/>
    <rect class="gi-ink" x="492" y="160" width="40" height="7" rx="3.5"/>
    <text class="gt-ph" x="458" y="202">Restaurang</text>
    <rect class="gt-pbtn" x="458" y="214" width="108" height="30" rx="15"/>
    <text class="gt-pbtn-t" x="512" y="233">Boka bord</text>
    <rect class="gt-ptile" x="458" y="254" width="108" height="26" rx="10"/><text class="gt-ptile-t" x="468" y="271">Meny</text>
    <rect class="gt-ptile" x="458" y="288" width="108" height="26" rx="10"/><text class="gt-ptile-t" x="468" y="305">Hitta hit</text>
    <rect class="gi-sk" x="458" y="330" width="90" height="4" rx="2"/><rect class="gi-sk" x="458" y="340" width="70" height="4" rx="2"/>
  </g>

  <g class="gt-speed">
    <rect class="gt-speed-card" x="300" y="318" width="168" height="54" rx="18"/>
    <path class="gt-bolt" d="M326 330l-10 16h9l-4 14 13-19h-9l5-11z"/>
    <rect class="gt-bar" x="350" y="342" width="100" height="8" rx="4"/>
    <rect class="gt-bar-fill" x="350" y="342" width="86" height="8" rx="4"/>
  </g>
</svg>`;
}
