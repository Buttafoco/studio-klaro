// Guide: Varför syns inte mitt företag på Google?
//
// Metadata och innehåll för en guide. Sidan byggs av scripts/build-guides.mjs (gemensam mall för alla guider).
// Lästid och innehållsförteckning räknas fram automatiskt: varje <h2> behöver ett id, och data-toc ger en
// kortare etikett i innehållsförteckningen. Påståenden om hur Google fungerar länkar till Googles egen dokumentation.

const ext = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;
const G = {
  howSearch: 'https://developers.google.com/search/docs/fundamentals/how-search-works',
  console: 'https://search.google.com/search-console/about',
  local: 'https://support.google.com/business/answer/7091',
  noindex: 'https://developers.google.com/search/docs/crawling-indexing/block-indexing',
  links: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  sitemap: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview',
  recrawl: 'https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl',
};

export default {
  slug: 'varfor-syns-inte-mitt-foretag-pa-google',
  title: 'Varför syns inte mitt företag på Google?',
  seoTitle: 'Varför syns inte mitt företag på Google? | Studio Klaro',
  description: 'Tio vanliga anledningar till att ett företag inte syns på Google – och vad du kan göra åt dem, från Search Console och tydliga sidor till lokal synlighet.',
  teaser: 'Tio vanliga anledningar till att konkurrenterna syns men inte du – och en enkel ordning att börja kontrollera grunderna i.',
  category: 'SEO & synlighet',
  eyebrow: 'SEO för småföretag',
  lead: 'Du har en hemsida med tjänster och kontaktuppgifter. Men när du söker på det du erbjuder syns konkurrenterna – och ditt företag verkar vara långt borta. Här är de vanligaste anledningarna, och vad du kan göra åt dem.',
  author: 'Studio Klaro',
  published: '2026-10-05',
  ogImage: '/guider/syns-pa-google-og.jpg',
  ogImageAlt: 'Illustration av en sökning med tre resultat och en tom plats där företaget saknas, bredvid en karta med en markering.',
  illustrationLabel: 'Illustration av en sökning efter en frisör på Södermalm: tre sökresultat, en tom streckad plats där det egna företaget saknas, en karta med en platsmarkering och en liten sidstruktur.',
  illustration,
  cta: {
    title: 'Vet du inte varför din hemsida inte syns?',
    text: 'Vi hjälper företag att förstå hur hemsidan fungerar – från SEO och struktur till design och användarupplevelse. Berätta kort om din hemsida, så tittar vi på vad som kan förbättras och vilka möjligheter som finns för bättre synlighet.',
  },
  body: `
<section class="ga-sec" aria-labelledby="inledning">
  <h2 id="inledning" data-toc="Tre saker Google behöver">Ett vanligt problem – med flera orsaker</h2>
  <p>Att inte synas är vanligt, och det betyder inte automatiskt att något är fel på hemsidan. Att synas på Google handlar om flera saker samtidigt. Google behöver:</p>
  <ol class="g-qs">
    <li><span class="g-qs-n" aria-hidden="true">01</span><span class="g-qs-t">kunna hitta sidan,</span></li>
    <li><span class="g-qs-n" aria-hidden="true">02</span><span class="g-qs-t">förstå vad företaget erbjuder</span></li>
    <li><span class="g-qs-n" aria-hidden="true">03</span><span class="g-qs-t">och bedöma att sidan är relevant för det någon söker efter.</span></li>
  </ol>
  <p>Här är tio av de vanligaste anledningarna till att ett företag inte syns – och vad du kan göra åt dem. Längre ned finns en kort ordning att börja kontrollera i.</p>
</section>

<section class="ga-sec" aria-labelledby="inte-hittad">
  <h2 id="inte-hittad" data-toc="Google har inte hittat sidan"><span class="g-h2-n">Orsak 1<span class="sr-only">:</span></span> Google har inte hittat din hemsida ännu</h2>
  <p>För att hemsidan ska kunna visas i sökresultatet behöver Google först hitta och läsa den. Det kallas genomsökning, på engelska <em>crawling</em>. Därefter kan sidan läggas till i Googles index.</p>
  <p>En helt ny hemsida dyker därför inte nödvändigtvis upp direkt efter lanseringen. Google ${ext(G.howSearch, 'skriver själva')} att det inte finns någon garanti för att en sida genomsöks eller indexeras, och det kan ta tid.</p>

  <h3>Så kontrollerar du om sidan finns på Google</h3>
  <p>Sök efter din domän med <code>site:</code> framför, till exempel så här:</p>
  <figure class="g-fig g-search">
    <div class="g-search-box" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>
      <span>site:dindomän.se</span>
    </div>
    <p class="sr-only">En sökruta med texten site:dindomän.se.</p>
    <figcaption>Visar Google sidor från webbplatsen finns åtminstone delar av den i indexet. Visas ingenting behöver du undersöka vidare.</figcaption>
  </figure>
  <p>Det bästa verktyget för att undersöka vidare är ${ext(G.console, 'Google Search Console')}, Googles eget verktyg för att förstå hur webbplatsen genomsöks, indexeras och visas. Där kan du bland annat se:</p>
  <ul class="g-list">
    <li>vilka sidor Google känner till</li>
    <li>vilka sidor som är indexerade</li>
    <li>vilka problem Google har hittat</li>
    <li>vilka sökningar som leder till din hemsida</li>
    <li>hur ofta du visas i sökresultatet</li>
  </ul>
</section>

<section class="ga-sec" aria-labelledby="otydligt">
  <h2 id="otydligt" data-toc="Otydligt erbjudande"><span class="g-h2-n">Orsak 2<span class="sr-only">:</span></span> Hemsidan berättar inte tydligt vad du erbjuder</h2>
  <p>Google försöker förstå vad varje sida handlar om. Är hemsidan väldigt vag blir det svårare. Tänk dig två företag som erbjuder samma tjänst:</p>
  <figure class="g-fig g-words">
    <div class="g-words-row g-words-row--before">
      <p class="g-mock-label">Vagt</p>
      <p class="g-words-q">”Vi skapar möjligheter för framtiden.”</p>
    </div>
    <div class="g-words-row g-words-row--after">
      <p class="g-mock-label">Tydligt</p>
      <p class="g-words-q">”Redovisning för småföretag i Stockholm.”</p>
    </div>
    <figcaption>Den andra versionen är tydligare för en kund – och samma princip gäller för Google.</figcaption>
  </figure>
  <p>Det betyder inte att du ska fylla hemsidan med sökord. Men de viktigaste sidorna bör tydligt beskriva vad du erbjuder, vem du hjälper och var du finns eller arbetar. Mer om det i guiden <a href="/guider/3-misstag-pa-din-hemsida-som-kan-fa-dig-att-tappa-kunder">3 misstag på din hemsida som kan få dig att tappa kunder</a>.</p>

  <h3>Ett vanligt misstag: startsidan ska ranka för allt</h3>
  <p>Många företag räknar upp allt på startsidan – webbdesign, SEO, grafisk design, annonsering, fotografering, sociala medier och marknadsföring. Det blir snabbt otydligt. Är en tjänst viktig för verksamheten är det ofta bättre att ge den en egen sida:</p>
  <figure class="g-fig g-urls">
    <ul class="g-urls-list" aria-label="Exempel på egna sidor per tjänst">
      <li><span>dindomän.se</span>/webbdesign</li>
      <li><span>dindomän.se</span>/seo</li>
      <li><span>dindomän.se</span>/fotografering</li>
    </ul>
    <figcaption>En sida per viktig tjänst ger både kunden och Google en tydligare bild av vad sidan handlar om.</figcaption>
  </figure>
</section>

<section class="ga-sec" aria-labelledby="andra-ord">
  <h2 id="andra-ord" data-toc="Andra ord än kunderna"><span class="g-h2-n">Orsak 3<span class="sr-only">:</span></span> Du använder andra ord än dina kunder</h2>
  <p>Det här är ett av de enklaste problemen att missa. Om språket på hemsidan skiljer sig mycket från det kunderna använder kan du gå miste om relevanta sökningar.</p>
  <figure class="g-fig g-lang">
    <div class="g-lang-grid">
      <div class="g-lang-col">
        <p class="g-mock-label">Företaget skriver</p>
        <p class="g-lang-we">”Strategisk digital transformation”</p>
      </div>
      <span class="g-lang-arrow" aria-hidden="true">→</span>
      <div class="g-lang-col">
        <p class="g-mock-label">Kunden söker</p>
        <p class="g-lang-they"><span>hjälp med hemsida</span><span>webbyrå stockholm</span></p>
      </div>
    </div>
    <figcaption>Samma tjänst, två helt olika språk.</figcaption>
  </figure>
  <aside class="g-check" aria-label="Kontrollfråga">
    <p class="g-check-label">Tänk mindre som företaget – mer som kunden</p>
    <p class="g-check-q">Vad skulle någon faktiskt skriva på Google för att hitta er – inte vad ni kallar tjänsten internt?</p>
  </aside>
  <p>Det är en liten skillnad som kan påverka hela strukturen på hemsidan.</p>
</section>

<section class="ga-sec" aria-labelledby="foretagsprofil">
  <h2 id="foretagsprofil" data-toc="Ingen företagsprofil"><span class="g-h2-n">Orsak 4<span class="sr-only">:</span></span> Du saknar en företagsprofil på Google</h2>
  <p>För lokala företag är Googles företagsprofil (Google Business Profile) en av de viktigaste delarna av synligheten. Det är informationen som kan visas när någon söker efter till exempel ”frisör nära mig”, ”restaurang Södermalm” eller ”elektriker Stockholm”.</p>
  <figure class="g-fig g-profile">
    <div class="g-profile-card" aria-hidden="true">
      <span class="g-profile-img"></span>
      <div class="g-profile-body">
        <b>Ditt företagsnamn</b>
        <span class="g-profile-cat">Kategori · Stadsdel</span>
        <span class="g-profile-stars">★★★★★ <em>Recensioner</em></span>
        <dl>
          <div><dt>Adress</dt><dd></dd></div>
          <div><dt>Öppettider</dt><dd></dd></div>
          <div><dt>Telefon</dt><dd></dd></div>
          <div><dt>Hemsida</dt><dd></dd></div>
        </dl>
      </div>
    </div>
    <p class="sr-only">En skiss av en företagsprofil med namn, kategori, recensioner, bild, adress, öppettider, telefonnummer och hemsida.</p>
    <figcaption>Profilen kan innehålla företagsnamn, kategori, adress, öppettider, telefonnummer, hemsida, recensioner och bilder.</figcaption>
  </figure>
  <p>Google ${ext(G.local, 'rekommenderar')} att företag verifierar sin profil och håller informationen komplett och uppdaterad – företag med fullständig och korrekt information har lättare att synas i lokala sökresultat. Arbetar du lokalt men saknar en genomarbetad profil är det ett bra ställe att börja.</p>
</section>

<section class="ga-sec" aria-labelledby="var-du-finns">
  <h2 id="var-du-finns" data-toc="Var du finns"><span class="g-h2-n">Orsak 5<span class="sr-only">:</span></span> Google förstår inte var du finns</h2>
  <p>Det här är särskilt viktigt för företag som är beroende av lokala kunder. Säg att du driver en frisörsalong på Södermalm. Om hemsidan aldrig tydligt nämner Stockholm, Södermalm, adressen eller området blir det svårare att förstå den geografiska kopplingen.</p>
  <p>Enligt ${ext(G.local, 'Google')} avgörs lokala sökresultat främst av tre saker:</p>
  <dl class="g-paths">
    <div><dt>Relevans</dt><dd>Hur väl företaget matchar det någon söker efter.</dd></div>
    <div><dt>Avstånd</dt><dd>Hur långt från den som söker – eller från platsen i sökningen – företaget finns.</dd></div>
    <div><dt>Hur känt företaget är</dt><dd>Förenklat: hur etablerat och välkänt företaget verkar vara, både online och utanför nätet.</dd></div>
  </dl>
  <h3>Därför bör lokala företag vara tydliga</h3>
  <figure class="g-fig g-words">
    <div class="g-words-row g-words-row--before">
      <p class="g-mock-label">I stället för</p>
      <p class="g-words-q">”Välkommen till vår salong.”</p>
    </div>
    <div class="g-words-row g-words-row--after">
      <p class="g-mock-label">Skriv</p>
      <p class="g-words-q">”Frisör i Hornstull på Södermalm.”</p>
    </div>
    <figcaption>Det hjälper kunden – och det ger Google mer sammanhang.</figcaption>
  </figure>
</section>

<section class="ga-sec" aria-labelledby="lite-innehall">
  <h2 id="lite-innehall" data-toc="För lite innehåll"><span class="g-h2-n">Orsak 6<span class="sr-only">:</span></span> Du har väldigt lite innehåll</h2>
  <p>En hemsida med fyra meningar kan vara visuellt snygg, men Google behöver fortfarande förstå vad verksamheten erbjuder. Om en tjänstesida om fasadmålning bara säger ”Vi erbjuder professionell fasadmålning. Kontakta oss för mer information.” finns det väldigt lite att arbeta med.</p>
  <p>En bättre sida kan förklara:</p>
  <ul class="g-list">
    <li>vilken typ av arbete ni gör</li>
    <li>vilka fastigheter ni arbetar med</li>
    <li>hur processen fungerar</li>
    <li>vilka områden ni arbetar i</li>
    <li>vanliga frågor</li>
    <li>exempel på tidigare projekt</li>
  </ul>
  <p>Det viktiga är inte att skriva så mycket som möjligt, utan att sidan faktiskt hjälper den som söker.</p>
</section>

<section class="ga-sec" aria-labelledby="konkurrenter">
  <h2 id="konkurrenter" data-toc="Starkare konkurrenter"><span class="g-h2-n">Orsak 7<span class="sr-only">:</span></span> Andra företag verkar mer trovärdiga</h2>
  <p>SEO sker inte i ett vakuum. Om tio företag erbjuder samma tjänst behöver Google avgöra vilka resultat som är mest relevanta och användbara. Ett konkurrerande företag kanske har:</p>
  <ul class="g-list">
    <li>funnits längre</li>
    <li>fler relevanta sidor</li>
    <li>fler kundrecensioner</li>
    <li>fler länkar från andra webbplatser</li>
    <li>en välskött företagsprofil på Google</li>
    <li>tydligare lokala signaler</li>
    <li>bättre och mer hjälpsamt innehåll</li>
  </ul>
  <p>Du behöver inte slå konkurrenterna på varje punkt. Men det förklarar varför det inte alltid räcker att bara ha en hemsida.</p>
  <h3>Titta på vilka som redan syns</h3>
  <p>Sök efter den tjänst du själv vill hittas på och gå in på företagen som ligger högt. Titta inte bara på designen, utan på:</p>
  <ol class="g-qs">
    <li><span class="g-qs-n" aria-hidden="true">01</span><span class="g-qs-t">Vilka sidor har de?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">02</span><span class="g-qs-t">Vad skriver de om tjänsten?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">03</span><span class="g-qs-t">Har de recensioner?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">04</span><span class="g-qs-t">Har de guider eller artiklar?</span></li>
    <li><span class="g-qs-n" aria-hidden="true">05</span><span class="g-qs-t">Hur tydligt framgår var de finns?</span></li>
  </ol>
  <p>Det kan snabbt visa vad Google redan verkar anse vara användbart för just den sökningen.</p>
</section>

<section class="ga-sec" aria-labelledby="tekniskt">
  <h2 id="tekniskt" data-toc="Tekniska problem"><span class="g-h2-n">Orsak 8<span class="sr-only">:</span></span> Hemsidan har tekniska problem</h2>
  <p>Ibland är problemet inte innehållet alls, utan tekniskt. En sida kan till exempel av misstag ha fått instruktionen <code>noindex</code>:</p>
  <figure class="g-fig g-code">
    <pre><code>&lt;meta name="robots" content="<mark>noindex</mark>"&gt;</code></pre>
    <figcaption>En rad i sidans kod som i praktiken säger till sökmotorn att sidan inte ska visas i sökresultatet.</figcaption>
  </figure>
  <p>Andra problem kan vara att Google blockeras från att läsa delar av webbplatsen eller att viktiga sidor är svåra att hitta via interna länkar. Google ${ext(G.noindex, 'beskriver')} hur <code>noindex</code> och liknande instruktioner fungerar – och viktiga sidor ska inte blockeras av till exempel <code>robots.txt</code>, <code>noindex</code> eller krav på inloggning. Det här är återigen sådant du kan upptäcka i Search Console.</p>
</section>

<section class="ga-sec" aria-labelledby="interna-lankar">
  <h2 id="interna-lankar" data-toc="Svårhittade sidor"><span class="g-h2-n">Orsak 9<span class="sr-only">:</span></span> Google hittar inte dina viktigaste sidor</h2>
  <p>Tänk dig att du har en riktigt bra sida om ”bröllopsfotograf Stockholm” – men ingen tydlig länk till den från resten av hemsidan. Då blir den svårare att upptäcka, både för människor och sökmotorer. Därför spelar interna länkar roll:</p>
  <figure class="g-fig g-tree">
    <div class="g-tree-stage">
      <span class="g-tree-node g-tree-node--root">Startsida</span>
      <span class="g-tree-node g-tree-node--mid">Tjänster</span>
      <span class="g-tree-leaves"><span class="g-tree-node">Bröllopsfotografering</span><span class="g-tree-node">Företagsfotografering</span><span class="g-tree-node">Porträttfotografering</span></span>
    </div>
    <figcaption>Startsidan länkar till Tjänster, som länkar vidare till varje tjänst. Det skapar en logisk struktur.</figcaption>
  </figure>
  <p>Google ${ext(G.links, 'rekommenderar')} vanliga länkar som går att genomsöka – i praktiken <code>&lt;a href&gt;</code>-länkar – för att hitta sidor.</p>
</section>

<section class="ga-sec" aria-labelledby="sitemap">
  <h2 id="sitemap" data-toc="Ingen sitemap"><span class="g-h2-n">Orsak 10<span class="sr-only">:</span></span> Du saknar en sitemap</h2>
  <p>En sitemap är förenklat en lista över de sidor du vill att sökmotorer ska kunna hitta. På mindre hemsidor hittar Google ofta sidorna ändå, men det är fortfarande god praxis att ha en korrekt sitemap och skicka in den i Search Console.</p>
  <p>Google ${ext(G.sitemap, 'skriver')} att en sitemap hjälper dem att upptäcka sidor, men att den inte garanterar att sidorna genomsöks och indexeras. Många moderna publiceringsverktyg skapar en sitemap automatiskt – det viktiga är att kontrollera att den faktiskt finns och innehåller rätt sidor.</p>
</section>

<section class="ga-sec" aria-labelledby="borja-har">
  <h2 id="borja-har" data-toc="Så börjar du">Så börjar du om ditt företag inte syns</h2>
  <p>SEO kan snabbt kännas komplicerat. Börja inte med hundra saker samtidigt – kontrollera grunderna, i den här ordningen:</p>
  <ol class="g-steps">
    <li><h3>Finns hemsidan i Google?</h3><p>Sök på <code>site:dindomän.se</code>.</p></li>
    <li><h3>Har du Google Search Console?</h3><p>Om inte, sätt upp det.</p></li>
    <li><h3>Är de viktigaste sidorna indexerade?</h3><p>Kontrollera dem med verktyget för webbadressgranskning (URL Inspection) i Search Console.</p></li>
    <li><h3>Har du en sitemap?</h3><p>Kontrollera att rätt sidor finns med och skicka in den i Search Console.</p></li>
    <li><h3>Är det tydligt vad företaget erbjuder?</h3><p>Läs rubrikerna på startsidan och tjänstesidorna.</p></li>
    <li><h3>Är det tydligt var företaget finns?</h3><p>Extra viktigt för lokala verksamheter.</p></li>
    <li><h3>Har du en företagsprofil på Google?</h3><p>Kontrollera att den är verifierad och komplett.</p></li>
    <li><h3>Har varje viktig tjänst tillräckligt med information?</h3><p>En tjänstesida ska hjälpa kunden – inte bara finnas för SEO.</p></li>
  </ol>
  <p>Vill du ha hjälp med en första överblick kan du göra en <a href="/seo-koll">kostnadsfri SEO-koll</a> av din hemsida. Den går igenom teknik, innehåll och lokal SEO och förklarar resultatet i klartext.</p>
</section>

<section class="ga-sec" aria-labelledby="tar-tid">
  <h2 id="tar-tid" data-toc="SEO tar tid">SEO tar tid</h2>
  <p>Det kanske viktigaste att förstå är att SEO sällan ger resultat från en dag till nästa. Google behöver upptäcka förändringarna, sidorna behöver genomsökas igen – och sedan konkurrerar du med andra webbplatser om samma sökningar.</p>
  <p>Google ${ext(G.recrawl, 'skriver')} att en ny genomsökning kan ta från några dagar upp till några veckor, och att en begäran inte garanterar att sidan tas med i sökresultatet.</p>
  <aside class="g-check" aria-label="Var försiktig">
    <p class="g-check-label">Var försiktig med den som lovar</p>
    <p class="g-check-q">”Förstaplats på Google inom en vecka.” Ingen seriös aktör kan garantera en viss placering i de vanliga sökresultaten.</p>
  </aside>
</section>

<section class="ga-sec" aria-labelledby="inte-lura">
  <h2 id="inte-lura" data-toc="Inte att lura Google">Det handlar inte om att lura Google</h2>
  <p>Bra SEO handlar i grunden om att göra det enkelt att förstå ditt företag – för kunden och för sökmotorn. En bra hemsida svarar tydligt på frågor som:</p>
  <ul class="g-checklist">
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>Vad erbjuder ni?</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>Var finns ni?</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>Varför ska jag välja er?</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>Hur fungerar tjänsten?</li>
    <li><span class="g-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9"/></svg></span>Hur kontaktar jag er?</li>
  </ul>
  <p class="g-closing">När den tekniska grunden samtidigt fungerar har du mycket bättre förutsättningar att synas på de sökningar som betyder något för verksamheten.</p>
</section>
`,
};

// Hero-illustration: en sökning med tre resultat och en tom, streckad plats där det egna företaget saknas,
// en karta med platsmarkering (lokal synlighet) och en liten sidstruktur (interna länkar och sitemap).
// Inline-SVG med viewBox: skalar utan bildfil och utan layoutskift.
function illustration(idp = 'gs') {
  return `<svg class="g-illus-svg" viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <path id="${idp}-cloud" d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/>
    <clipPath id="${idp}-map"><rect x="446" y="132" width="146" height="170" rx="22"/></clipPath>
  </defs>
  <path class="gi-blob" d="M58 214C40 118 118 38 252 42C352 45 424 26 526 50C614 70 632 162 616 244C600 334 524 400 402 392C302 386 238 406 148 394C66 383 74 306 58 214Z"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(478 20) scale(.56)"/>
  <use class="gi-cloud" href="#${idp}-cloud" transform="translate(8 318) scale(.48)"/>

  <rect class="gi-shadow" x="84" y="66" width="404" height="54" rx="27"/>
  <rect class="gs-box" x="80" y="58" width="404" height="54" rx="27"/>
  <circle class="gs-lens" cx="112" cy="83" r="9"/><path class="gs-lens" d="M119 90l7 7"/>
  <text class="gs-q" x="138" y="91">frisör södermalm</text>

  <rect class="gi-shadow" x="84" y="140" width="340" height="236" rx="22"/>
  <rect class="gi-win" x="80" y="132" width="340" height="236" rx="22"/>
  <g>
    <rect class="gs-url" x="104" y="154" width="90" height="6" rx="3"/>
    <rect class="gs-title" x="104" y="166" width="210" height="10" rx="5"/>
    <rect class="gi-sk" x="104" y="182" width="270" height="5" rx="2.5"/><rect class="gi-sk" x="104" y="192" width="220" height="5" rx="2.5"/>
  </g>
  <g>
    <rect class="gs-url" x="104" y="214" width="76" height="6" rx="3"/>
    <rect class="gs-title" x="104" y="226" width="180" height="10" rx="5"/>
    <rect class="gi-sk" x="104" y="242" width="262" height="5" rx="2.5"/><rect class="gi-sk" x="104" y="252" width="200" height="5" rx="2.5"/>
  </g>
  <g>
    <rect class="gs-url" x="104" y="274" width="100" height="6" rx="3"/>
    <rect class="gs-title" x="104" y="286" width="196" height="10" rx="5"/>
    <rect class="gi-sk" x="104" y="302" width="250" height="5" rx="2.5"/>
  </g>
  <rect class="gs-missing" x="98" y="320" width="304" height="34" rx="12"/>
  <text class="gs-missing-t" x="250" y="337">Ditt företag?</text>

  <rect class="gi-shadow" x="450" y="140" width="146" height="170" rx="22"/>
  <g clip-path="url(#${idp}-map)">
    <rect class="gs-map" x="446" y="132" width="146" height="170"/>
    <path class="gs-road" d="M446 220C490 210 520 240 592 226M500 132C506 190 488 240 512 302M446 170C500 176 540 150 592 160"/>
    <path class="gs-water" d="M540 302C548 270 580 262 592 250L592 302Z"/>
  </g>
  <rect class="gs-map-frame" x="446" y="132" width="146" height="170" rx="22"/>
  <g class="gs-pin"><path d="M518 168c-15 0-26 11-26 25 0 19 26 41 26 41s26-22 26-41c0-14-11-25-26-25z"/><circle cx="518" cy="193" r="9"/></g>

  <g class="gs-tree">
    <rect class="gt-speed-card" x="436" y="324" width="166" height="62" rx="18"/>
    <path class="gs-tree-line" d="M466 346V366M466 356H506M506 356V346M506 356V366M506 356H546M546 346V366"/>
    <circle class="gs-node gs-node--root" cx="466" cy="344" r="7"/>
    <circle class="gs-node" cx="506" cy="344" r="5.5"/><circle class="gs-node" cx="506" cy="368" r="5.5"/>
    <circle class="gs-node" cx="546" cy="344" r="5.5"/><circle class="gs-node" cx="546" cy="368" r="5.5"/>
    <circle class="gs-node" cx="466" cy="368" r="5.5"/>
    <rect class="gi-sk" x="566" y="342" width="22" height="5" rx="2.5"/><rect class="gi-sk" x="566" y="364" width="18" height="5" rx="2.5"/>
  </g>
</svg>`;
}
