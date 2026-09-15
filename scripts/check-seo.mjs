// Kontrollerar SEO/GEO-grunderna: metadata, JSON-LD, synlig FAQ, sitemap, robots.txt,
// llms.txt och att viktigt innehåll finns i HTML:en utan JavaScript.
//
//   node scripts/check-seo.mjs         # källfilerna
//   node scripts/check-seo.mjs dist    # produktionsbygget (kör efter `npm run build`)

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import * as cheerio from 'cheerio';

const SITE = 'https://studioklaro.se';
const ROOT = path.resolve(import.meta.dirname, '..');
const target = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : ROOT;
const publicDir = target === ROOT ? path.join(ROOT, 'public') : target;

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Sidorna hämtas från Vite-konfigurationen så att listan aldrig glider isär.
const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
const pageFiles = [...viteConfig.matchAll(/resolve\(__dirname, '([^']+\.html)'\)/g)].map((m) => m[1]);
if (!pageFiles.length) fail('vite.config.js', 'hittade inga sidor');

const urlFor = (file) => SITE + '/' + file.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
const publicFileExists = (url) => fs.existsSync(path.join(publicDir, new URL(url).pathname));

const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

let referenceOrg = null;
const indexable = [];

for (const file of pageFiles) {
  const $ = cheerio.load(fs.readFileSync(path.join(target, file), 'utf8'));
  const robots = $('meta[name=robots]').attr('content') || '';
  const noindex = /noindex/i.test(robots);
  const url = urlFor(file);

  const title = clean($('title').text());
  if (title.length < 10 || title.length > 65) fail(file, `title har ${title.length} tecken (10–65)`);
  if (!clean($('h1').first().text())) fail(file, 'saknar h1 med text');
  if ($('html').attr('lang') !== 'sv') fail(file, 'html lang ska vara "sv"');

  if (noindex) {
    if (sitemapUrls.includes(url)) fail(file, 'noindex-sida finns i sitemap.xml');
    continue;
  }
  indexable.push(url);

  const description = $('meta[name=description]').attr('content') || '';
  if (description.length < 70 || description.length > 160) fail(file, `metabeskrivning har ${description.length} tecken (70–160)`);

  const canonical = $('link[rel=canonical]').attr('href');
  if (canonical !== url) fail(file, `canonical är ${canonical}, förväntat ${url}`);
  if (!sitemapUrls.includes(url)) fail(file, `${url} saknas i sitemap.xml`);

  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:locale', 'og:site_name']) {
    if (!$(`meta[property="${prop}"]`).attr('content')) fail(file, `saknar ${prop}`);
  }
  if ($('meta[property="og:url"]').attr('content') !== canonical) fail(file, 'og:url matchar inte canonical');
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage && !publicFileExists(ogImage)) fail(file, `og:image finns inte: ${ogImage}`);

  // JSON-LD
  const nodes = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      nodes.push(...(data['@graph'] || [data]));
    } catch (e) {
      fail(file, 'JSON-LD kan inte tolkas: ' + e.message);
    }
  });
  const byType = (type) => nodes.filter((n) => [].concat(n['@type']).includes(type));

  const org = byType('Organization')[0];
  if (!org) fail(file, 'saknar Organization i JSON-LD');
  else if (!referenceOrg) referenceOrg = org;
  else if (!isDeepStrictEqual(org, referenceOrg)) fail(file, 'Organization skiljer sig från övriga sidor');
  if (!byType('WebSite').length) fail(file, 'saknar WebSite i JSON-LD');

  for (const node of nodes) {
    const id = node['@id'];
    if (id && !id.startsWith(SITE + '/')) fail(file, `@id utanför sajten: ${id}`);
  }

  const crumbs = byType('BreadcrumbList')[0];
  if (file !== 'index.html') {
    if (!crumbs) fail(file, 'saknar BreadcrumbList');
    else if (crumbs.itemListElement.at(-1).item !== url) fail(file, 'sista brödsmulan pekar inte på sidan');
  }

  // FAQPage måste motsvara exakt den FAQ som syns på sidan.
  const visible = [];
  $('.faq-item').each((i, item) => {
    const $item = $(item);
    const q = $item.find('.faq-q-btn').length ? $item.find('.faq-q-btn') : $item.find('.faq-q').clone().children('.faq-icon').remove().end();
    const a = $item.find('.faq-ans').length ? $item.find('.faq-ans') : $item.find('.faq-a');
    visible.push({ q: clean(q.text()), a: clean(a.text()) });
  });
  const faq = byType('FAQPage')[0];
  if (visible.length && !faq) fail(file, `synlig FAQ (${visible.length} frågor) saknar FAQPage`);
  if (faq) {
    const schema = faq.mainEntity.map((q) => ({ q: q.name, a: q.acceptedAnswer.text }));
    if (!isDeepStrictEqual(schema, visible)) fail(file, 'FAQPage matchar inte den synliga FAQ:n');
  }

  // Innehåll som ska synas utan JavaScript.
  if ($('[data-reveal]').length && !$('noscript').text().includes('[data-reveal]')) {
    fail(file, 'data-reveal används men noscript-fallback saknas');
  }
  if ($('#pf-name').length && !clean($('#pf-name').text())) fail(file, 'case-sektionen är tom utan JavaScript');
}

// Innehåll som tidigare var motsägelsefullt: /priser är source of truth.
const CONTENT_FILES = [...pageFiles, 'public/llms.txt'].filter((f) => fs.existsSync(path.join(ROOT, f)));
const FORBIDDEN = [
  [/19 ?900 kr/, 'gammalt pris för Komplett närvaro (ska vara från 22 900 kr)'],
  [/(\d|en|ett|två|tre) (korrekturrund|korrigeringsrund)/i,'fast antal korrekturrundor (ska vara löpande feedback inom avtalad omfattning)'],
  [/08:00–17:00|mån–fre 08/i, 'gamla tider (ska vara vardagar 09–17)'],
  [/Klart inom 7–10 arbetsdagar|Ett vanligt (frisör|restaurang|salongs)?projekt blir normalt klart inom 7–10/, 'generellt löfte om 7–10 arbetsdagar för alla projekt'],
];
// Påhittade verksamheter som bara får förekomma med en tydlig fiktiv-märkning i samma sektion.
const FICTIONAL = ['Trattoria Nord', 'ELIN STUDIO', 'Emma L.', 'Sara M.', 'Anna &amp; Julia', '186 recensioner'];
const FICTIONAL_LABEL = 'Illustrativt exempel – fiktiv verksamhet';

for (const file of CONTENT_FILES) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const [pattern, why] of FORBIDDEN) {
    if (pattern.test(raw)) fail(file, why);
  }
  if (!file.endsWith('.html')) continue;
  const $ = cheerio.load(raw);
  $('section').each((i, section) => {
    const html = $(section).html();
    const names = FICTIONAL.filter((name) => html.includes(name));
    if (names.length && !$(section).text().includes(FICTIONAL_LABEL)) {
      fail(file, `fiktiva uppgifter utan märkning: ${names.join(', ')}`);
    }
  });
}
const priser = fs.readFileSync(path.join(target, 'priser.html'), 'utf8');
for (const price of ['7 900 kr', '13 900 kr', '22 900 kr']) {
  if (!priser.includes(price)) fail('priser.html', `saknar ${price} – kontrollera att övriga sidor följer /priser`);
}

for (const url of sitemapUrls) {
  if (!indexable.includes(url)) fail('sitemap.xml', `${url} motsvarar ingen indexerbar sida`);
}
if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) fail('sitemap.xml', 'saknar lastmod');

const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt', 'saknar Sitemap-rad');
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'blockerar hela sajten för någon user agent');
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot', 'Bingbot']) {
  if (!robots.includes(`User-agent: ${bot}`)) fail('robots.txt', `${bot} nämns inte`);
}

const llmsPath = path.join(publicDir, 'llms.txt');
if (!fs.existsSync(llmsPath)) {
  fail('llms.txt', 'saknas');
} else {
  const llms = fs.readFileSync(llmsPath, 'utf8');
  if (!/^# Studio Klaro\n\n> /.test(llms)) fail('llms.txt', 'ska börja med "# Studio Klaro" och en sammanfattning i blockcitat');
  for (const [, link] of llms.matchAll(/\]\((https:\/\/studioklaro\.se[^)]*)\)/g)) {
    if (!sitemapUrls.includes(link) && !link.endsWith('/sitemap.xml')) fail('llms.txt', `länk finns inte i sitemap: ${link}`);
  }
}

// Dokumentation: alla länkar ska gå att tolka, och länkar till sajten ska peka på rätt domän.
const docFiles = [
  ...fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => path.join('docs', f)),
  'public/llms.txt',
];
for (const file of docFiles) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const [raw] of text.matchAll(/https?:\/\/[^\s`)<>"'\]]+/g)) {
    let url;
    try {
      url = new URL(raw);
    } catch (e) {
      fail(file, `ogiltig länk: ${raw}`);
      continue;
    }
    if (url.protocol !== 'https:') fail(file, `länk utan https: ${raw}`);
    if (/studioklaro/i.test(url.hostname) && url.hostname !== 'studioklaro.se') fail(file, `fel domän i länk: ${raw}`);
    if (url.hostname === 'studioklaro.se' && url.searchParams.has('ga_debug')) {
      fail(file, `ga_debug-länk i dokumentationen (beskriv parametern i stället): ${raw}`);
    }
  }
}

const label = path.relative(ROOT, target) || 'källfiler';
if (errors.length) {
  console.error(`SEO-kontroll (${label}) misslyckades:\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`SEO-kontroll (${label}) OK: ${indexable.length} indexerbara sidor, ${pageFiles.length - indexable.length} noindex.`);
