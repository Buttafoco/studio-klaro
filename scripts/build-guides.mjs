// Bygger Studio Klaros guider (/guider och /guider/<slug>) från innehållsfilerna i content/guider/.
//
//   node scripts/build-guides.mjs          # skriver guider/*.html, sitemapens guider-block och llms.txt-avsnittet
//   node scripts/build-guides.mjs --check  # kontrollerar att de genererade filerna är aktuella (körs i npm test)
//
// En ny guide = en ny fil i content/guider/<slug>.mjs (se den första guiden som mall), därefter kör skriptet.
// Sidorna är vanlig statisk HTML, så Vite, Vercel och SEO-kontrollen behandlar dem som övriga sidor.
// Header och footer hämtas från om.html, och Organization/WebSite i JSON-LD från index.html, så att guiderna
// alltid följer resten av sajten. Lästid och innehållsförteckning räknas fram ur guidens text.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';

const SITE = 'https://studioklaro.se';
const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content/guider');
const OUT_DIR = path.join(ROOT, 'guider');
const WORDS_PER_MINUTE = 200;
const HUB = {
  url: `${SITE}/guider`,
  title: 'Guider om webbdesign och synlighet | Studio Klaro',
  description: 'Guider från Studio Klaro som hjälper småföretag att förstå webbdesign, synlighet och digitala kundvägar – och fatta tydligare beslut.',
};

const check = process.argv.includes('--check');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dateLabel = (iso) => new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));

/* ---------- Innehåll ---------- */
const guides = [];
for (const file of fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
  const guide = (await import(pathToFileURL(path.join(CONTENT_DIR, file)).href)).default;
  if (file !== guide.slug + '.mjs') throw new Error(`${file}: filnamnet ska vara slug + .mjs`);
  for (const key of ['slug', 'title', 'seoTitle', 'description', 'teaser', 'category', 'eyebrow', 'lead', 'author', 'published', 'body', 'cta']) {
    if (!guide[key]) throw new Error(`${file}: saknar ${key}`);
  }
  const $ = cheerio.load(guide.body, null, false);
  // Lästid: det som faktiskt läses – dekorativa (aria-hidden) delar av figurerna räknas inte
  const $text = cheerio.load(guide.body, null, false);
  $text('[aria-hidden="true"]').remove();
  const text = $text.root().text().replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  const toc = [];
  $('h2').each((i, el) => {
    const id = $(el).attr('id');
    if (!id) throw new Error(`${file}: varje h2 behöver ett id`);
    toc.push({ id, label: $(el).attr('data-toc') || $(el).text().trim() });
  });
  guides.push({
    ...guide,
    url: `${SITE}/guider/${guide.slug}`,
    path: `/guider/${guide.slug}`,
    modified: guide.modified || guide.published,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    toc,
  });
}
// Nyast först
guides.sort((a, b) => b.published.localeCompare(a.published));

/* ---------- Delar som hämtas från befintliga sidor ---------- */
const om = read('om.html');
const header = om.match(/<header class="nav-wrap sh">[\s\S]*?<\/header>/)[0]
  .replace(/ aria-current="page"/g, '')
  .replace('src="logo-studio-klaro.webp"', 'src="/logo-studio-klaro.webp"');
const footer = om.match(/<footer class="sf"[\s\S]*?<\/footer>/)[0];
if (!footer.includes('href="/guider"')) throw new Error('footern i om.html saknar länken till /guider');

const $index = cheerio.load(read('index.html'));
const siteNodes = [];
$index('script[type="application/ld+json"]').each((i, el) => {
  const data = JSON.parse($index(el).html());
  for (const node of data['@graph'] || [data]) {
    if (['Organization', 'WebSite'].includes(node['@type'])) siteNodes.push(node);
  }
});
if (siteNodes.length !== 2) throw new Error('hittade inte Organization och WebSite i index.html');

/* ---------- Gemensam sidmall ---------- */
function page({ url, title, description, ogType, ogImage, ogImageAlt, graph, extraHead = '', body, footerCurrent = false, scripts = '' }) {
  const ogTitle = title.replace(/ \| Studio Klaro$/, '');
  const foot = footerCurrent ? footer.replace('<a href="/guider">', '<a href="/guider" aria-current="page">') : footer;
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Genererad av scripts/build-guides.mjs från content/guider/ – ändra innehållet där och kör skriptet igen. -->
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Studio Klaro">
<meta property="og:locale" content="sv_SE">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogImageAlt)}">
${extraHead}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}${ogImage}">
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': [...siteNodes, ...graph] }, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<script type="module" src="/src/analytics.js"></script>
<script type="module" src="/src/speed-insights.js"></script>
<script>try{if(sessionStorage.getItem('pt-arrive')){sessionStorage.removeItem('pt-arrive');var c=document.documentElement.classList;c.add('pt-arrive','pt-fast');if(sessionStorage.getItem('pt-cover')){sessionStorage.removeItem('pt-cover');c.add('pt-cover');setTimeout(function(){c.remove('pt-cover','pt-cover-out');},3000);}var ptY=sessionStorage.getItem('pt-y');sessionStorage.removeItem('pt-y');if(ptY&&!location.hash){window.__ptY=+ptY;c.add('pt-hold');setTimeout(function(){c.remove('pt-hold');},1000);}}}catch(e){}</script>
<link rel="stylesheet" href="/src/page-transition.css">
<link rel="stylesheet" href="/src/mobile-nav.css">
<link rel="stylesheet" href="/src/site-header.css">
<link rel="stylesheet" href="/src/klaro-button.css">
<link rel="stylesheet" href="/src/site-footer.css">
<link rel="stylesheet" href="/src/lead-dock.css">
<link rel="stylesheet" href="/src/guide.css">
</head>
<body>

<!-- NAV – ligger utanför sidans 1440-ram så att headern alltid är lika bred som fönstret -->
${header}
<div style="max-width:1440px;width:100%;margin:0 auto;position:relative;">

${body}

    <!-- FOOTER – gemensam för alla sidor (stil: src/site-footer.css, beteende: src/site-footer.js) -->
  ${foot}

</div>
${scripts}<script type="module" src="/src/guide.js"></script>
<script type="module" src="/src/site-footer.js"></script>
<script type="module" src="/src/mobile-nav.js"></script>
<script type="module" src="/src/page-transition.js"></script>
</body>
</html>
`;
}

const meta = (g, cls = '') => `<p class="g-meta${cls}"><span>${esc(g.category)}</span><span>${g.minutes} min läsning</span><span><time datetime="${g.published}">${dateLabel(g.published)}</time></span></p>`;
const illus = (g, idp, cls) => `<div class="g-illus ${cls}" role="img" aria-label="${esc(g.illustrationLabel)}">${g.illustration(idp)}</div>`;
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  '@id': `${items.at(-1)[1]}#breadcrumb`,
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

/* ---------- /guider ---------- */
function hubPage() {
  // Huvudinslaget: guiden markerad med featured: true, annars den nyaste
  const featured = guides.find((g) => g.featured) || guides[0];
  const rest = guides.filter((g) => g !== featured);
  const list = rest.length ? `
  <section class="gl" aria-labelledby="gl-title">
    <h2 id="gl-title" class="gl-title">Fler guider</h2>
    <ul class="gl-list">
${rest.map((g, i) => `      <li class="gl-item">
        <div class="gl-text">
          ${meta(g)}
          <h3 class="gl-h"><a href="${g.path}">${esc(g.title)}</a></h3>
          <p class="gl-teaser">${esc(g.teaser)}</p>
          <p class="gf-more" aria-hidden="true">Läs guiden <span>→</span></p>
        </div>
        ${illus(g, `gl${i}`, 'gl-illus')}
      </li>`).join('\n')}
    </ul>
  </section>
` : '';

  const body = `  <main class="gh-main">
  <div class="g-wrap">
    <nav class="g-crumbs" aria-label="Brödsmulor">
      <ol><li><a href="/">Hem</a></li><li><span aria-current="page">Guider</span></li></ol>
    </nav>

    <header class="gh">
      <p class="g-eyebrow g-in">Guider från Studio Klaro</p>
      <h1 class="gh-h1 g-in">Tydligare beslut för din digitala närvaro.</h1>
      <p class="gh-intro g-in">Korta, konkreta guider som hjälper småföretag att förstå webbdesign, synlighet och hur kunder hittar fram – så att det blir enklare att veta vad hemsidan faktiskt behöver.</p>
    </header>

    <article class="gf g-in" aria-labelledby="gf-title">
      ${illus(featured, 'gf', 'gf-illus')}
      <div class="gf-text">
        ${meta(featured)}
        <h2 id="gf-title" class="gf-title"><a class="gf-link" href="${featured.path}">${esc(featured.title)}</a></h2>
        <p class="gf-teaser">${esc(featured.teaser)}</p>
        <p class="gf-more" aria-hidden="true">Läs guiden <span>→</span></p>
      </div>
    </article>
${list}
    <section class="gc" aria-labelledby="gc-title">
      <h2 id="gc-title" class="gc-title">Osäker på vad din hemsida behöver?</h2>
      <p class="gc-text">Berätta kort om företaget, så återkommer vi med konkreta idéer.</p>
      <div class="gc-actions">
        <a class="klaro-button klaro-button--primary gc-btn" href="/#kontakt">Få konkreta idéer <span aria-hidden="true">→</span></a>
        <a class="g-textlink" href="mailto:hej@studioklaro.se">Eller mejla hej@studioklaro.se</a>
      </div>
    </section>
  </div>
  </main>`;

  const graph = [
    {
      '@type': 'CollectionPage',
      '@id': `${HUB.url}#webpage`,
      url: HUB.url,
      name: HUB.title,
      description: HUB.description,
      inLanguage: 'sv-SE',
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#business` },
      breadcrumb: { '@id': `${HUB.url}#breadcrumb` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [featured, ...rest].map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: g.url, name: g.title })),
      },
    },
    crumbs([['Hem', `${SITE}/`], ['Guider', HUB.url]]),
  ];

  return page({
    url: HUB.url, title: HUB.title, description: HUB.description, ogType: 'website',
    ogImage: featured.ogImage, ogImageAlt: featured.ogImageAlt, graph, body, footerCurrent: true,
  });
}

/* ---------- /guider/<slug> ---------- */
function articlePage(g) {
  const tocList = g.toc.map((t) => `<li><a href="#${t.id}">${esc(t.label)}</a></li>`).join('');
  const body = `  <main class="ga-main">
  <article class="ga" aria-labelledby="ga-title">
    <header class="ga-hero g-wrap">
      <nav class="g-crumbs" aria-label="Brödsmulor">
        <ol><li><a href="/guider">Guider</a></li><li><span>${esc(g.category)}</span></li></ol>
      </nav>
      <div class="ga-hero-grid">
        <div class="ga-hero-text">
          <p class="g-eyebrow g-in">${esc(g.eyebrow)}</p>
          <h1 id="ga-title" class="ga-h1 g-in">${esc(g.title)}</h1>
          <p class="ga-lead g-in">${esc(g.lead)}</p>
          <p class="ga-byline g-in"><span class="ga-author">${esc(g.author)}</span><span><time datetime="${g.published}">${dateLabel(g.published)}</time></span><span>${g.minutes} min läsning</span></p>
        </div>
        ${illus(g, 'ga', 'ga-illus g-in')}
      </div>
    </header>

    <div class="ga-layout g-wrap">
      <nav class="g-toc" aria-labelledby="g-toc-title">
        <p id="g-toc-title" class="g-toc-title">I den här guiden</p>
        <ol>${tocList}</ol>
      </nav>
      <div class="ga-body">
${g.body.trim()}
      </div>
    </div>
  </article>

  <!-- Avslutning med sidans formulär (samma formulär som på startsidan, src/lead-dock.js) -->
  <section class="ga-cta" id="kontakt-guide" aria-labelledby="ga-cta-title">
    <div class="g-wrap">
      <p class="g-eyebrow">Nästa steg</p>
      <h2 id="ga-cta-title" class="ga-cta-title">${esc(g.cta.title)}</h2>
      <p class="ga-cta-text">${esc(g.cta.text)}</p>
      <div class="ga-cta-form">
        <div class="wz-shell" data-wz-mount="guide"></div>
        <noscript><p class="ga-cta-noscript"><a class="klaro-button klaro-button--primary" href="/#kontakt">Få konkreta idéer <span aria-hidden="true">→</span></a></p></noscript>
      </div>
      <p class="ga-cta-alt"><a class="g-textlink" href="mailto:hej@studioklaro.se">Eller mejla hej@studioklaro.se</a></p>
    </div>
  </section>
  </main>`;

  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${g.url}#webpage`,
      url: g.url,
      name: g.seoTitle,
      description: g.description,
      inLanguage: 'sv-SE',
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${g.url}#breadcrumb` },
      primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}${g.ogImage}`, width: 1200, height: 630 },
      mainEntity: { '@id': `${g.url}#article` },
    },
    {
      '@type': 'Article',
      '@id': `${g.url}#article`,
      headline: g.title,
      description: g.description,
      image: `${SITE}${g.ogImage}`,
      datePublished: g.published,
      dateModified: g.modified,
      author: { '@id': `${SITE}/#business` },
      publisher: { '@id': `${SITE}/#business` },
      isPartOf: { '@id': `${SITE}/#website` },
      mainEntityOfPage: { '@id': `${g.url}#webpage` },
      articleSection: g.category,
      inLanguage: 'sv-SE',
      wordCount: g.words,
      timeRequired: `PT${g.minutes}M`,
    },
    crumbs([['Hem', `${SITE}/`], ['Guider', HUB.url], [g.title, g.url]]),
  ];

  const extraHead = `<meta property="article:published_time" content="${g.published}">
<meta property="article:modified_time" content="${g.modified}">
<meta property="article:section" content="${esc(g.category)}">
`;

  return page({
    url: g.url, title: g.seoTitle, description: g.description, ogType: 'article',
    ogImage: g.ogImage, ogImageAlt: g.ogImageAlt, graph, extraHead, body,
    scripts: '<script type="module" src="/src/lead-dock.js"></script>\n',
  });
}

/* ---------- Sitemap och llms.txt ---------- */
function withSitemap(xml) {
  const lastmod = guides.map((g) => g.modified).sort().at(-1);
  const entry = (loc, mod, priority) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const block = ['  <!-- guider:start – genereras av scripts/build-guides.mjs -->',
    entry(HUB.url, lastmod, '0.7'), ...guides.map((g) => entry(g.url, g.modified, '0.7')),
    '  <!-- guider:end -->'].join('\n');
  const re = /  <!-- guider:start[\s\S]*?<!-- guider:end -->/;
  return re.test(xml) ? xml.replace(re, block) : xml.replace('</urlset>', block + '\n</urlset>');
}
function withLlms(txt) {
  const section = '## Guider\n\n' +
    `- [Guider](${HUB.url}): Guider om webbdesign, synlighet och digitala kundvägar för småföretag\n` +
    guides.map((g) => `- [${g.title}](${g.url}): ${g.description}`).join('\n') + '\n\n';
  const re = /## Guider\n[\s\S]*?\n(?=## )/;
  return re.test(txt) ? txt.replace(re, section) : txt.replace('## Om Studio Klaro', section + '## Om Studio Klaro');
}

/* ---------- Skriv eller kontrollera ---------- */
const outputs = new Map([
  ['guider/index.html', hubPage()],
  ...guides.map((g) => [`guider/${g.slug}.html`, articlePage(g)]),
  ['public/sitemap.xml', withSitemap(read('public/sitemap.xml'))],
  ['public/llms.txt', withLlms(read('public/llms.txt'))],
]);

const stale = [];
for (const [file, content] of outputs) {
  const full = path.join(ROOT, file);
  const current = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  if (current === content) continue;
  if (check) stale.push(file);
  else {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}
const orphans = fs.existsSync(OUT_DIR)
  ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.html') && !outputs.has(`guider/${f}`))
  : [];

if (check) {
  if (stale.length || orphans.length) {
    console.error('Guiderna är inte uppdaterade – kör `node scripts/build-guides.mjs`:\n- ' +
      [...stale, ...orphans.map((f) => `guider/${f} saknar innehållsfil`)].join('\n- '));
    process.exit(1);
  }
  console.log(`Guider OK: ${guides.length} ${guides.length === 1 ? 'guide är aktuell' : 'guider är aktuella'}.`);
} else {
  for (const f of orphans) fs.unlinkSync(path.join(OUT_DIR, f));
  for (const g of guides) console.log(`${g.path} – ${g.words} ord, ${g.minutes} min läsning`);
}
