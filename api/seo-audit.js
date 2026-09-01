const cheerio = require("cheerio");
const { AuditFetchError, isValidHttpUrl, isObviouslyBlockedHost, fetchSafely } = require("./_lib/safeFetch");
const { analyzeTechnicalSeo } = require("./_lib/technicalSeo");
const { analyzeStructuredData } = require("./_lib/structuredData");
const { analyzePageSpeed } = require("./_lib/pageSpeed");
const { analyzeContentSignals } = require("./_lib/contentSignals");
const { determineLocalSeoRelevance } = require("./_lib/localSeoRelevance");
const { buildSeoChecks } = require("./_lib/seoChecks");
const { calculateSeoScore } = require("./_lib/seoScore");

// Some site builders (notably Wix) return several megabytes of server-rendered
// HTML. Read enough to cover those pages, but keep a hard memory/network cap.
// If the cap is reached, safeFetch returns the bytes collected so far instead
// of failing the entire audit; the document head and early body still contain
// the SEO signals this endpoint needs.
const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

function findMetaTag($, name) {
  let node = null;
  $("meta").each((_, el) => {
    const attrName = ($(el).attr("name") || "").trim().toLowerCase();
    if (attrName === name) {
      node = el;
      return false;
    }
  });
  return node;
}

function parseTitle($) {
  const value = ($("title").first().text() || "").trim();
  return { value, length: value.length, exists: value.length > 0 };
}

function parseMetaDescription($) {
  const node = findMetaTag($, "description");
  const value = node ? ($(node).attr("content") || "").trim() : "";
  return { value, length: value.length, exists: value.length > 0 };
}

function parseHeadings($, selector) {
  const elements = $(selector);
  const values = [];
  elements.each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      values.push(text);
    }
  });
  return { count: elements.length, values };
}

function parseImages($) {
  const imgs = $("img");
  let withAlt = 0;
  let missingAlt = 0;
  let emptyAlt = 0;

  imgs.each((_, el) => {
    const altAttr = $(el).attr("alt");
    if (altAttr === undefined) {
      missingAlt += 1;
    } else if (altAttr.trim() === "") {
      emptyAlt += 1;
    } else {
      withAlt += 1;
    }
  });

  return { total: imgs.length, withAlt, missingAlt, emptyAlt };
}

function parseCanonical($) {
  let href = null;
  $("link").each((_, el) => {
    const relValues = ($(el).attr("rel") || "").toLowerCase().split(/\s+/).filter(Boolean);
    if (relValues.includes("canonical")) {
      href = ($(el).attr("href") || "").trim();
      return false;
    }
  });
  return { exists: href !== null, value: href || "" };
}

function parseRobots($) {
  const node = findMetaTag($, "robots");
  if (!node) {
    return { exists: false, value: "", noindex: false };
  }
  const value = ($(node).attr("content") || "").trim();
  return { exists: true, value, noindex: value.toLowerCase().includes("noindex") };
}

function parseViewport($) {
  const node = findMetaTag($, "viewport");
  if (!node) {
    return { exists: false, value: "" };
  }
  return { exists: true, value: ($(node).attr("content") || "").trim() };
}

function parseLang($) {
  const value = ($("html").first().attr("lang") || "").trim();
  return { exists: value.length > 0, value };
}

function analyzeSeo($) {
  return {
    title: parseTitle($),
    metaDescription: parseMetaDescription($),
    h1: parseHeadings($, "h1"),
    h2: parseHeadings($, "h2"),
    images: parseImages($),
    canonical: parseCanonical($),
    robots: parseRobots($),
    viewport: parseViewport($),
    lang: parseLang($),
    structuredData: analyzeStructuredData($),
  };
}

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    return;
  }

  const { url } = req.body || {};

  if (!isValidHttpUrl(url)) {
    res.status(400).json({
      success: false,
      error: "Missing or invalid 'url'. Provide a valid http/https URL.",
    });
    return;
  }

  const parsed = new URL(url);
  if (isObviouslyBlockedHost(parsed.hostname)) {
    res.status(400).json({
      success: false,
      error: "Adressen pekar mot en privat/lokal resurs och är blockerad.",
    });
    return;
  }

  fetchSafely(url, {
    maxBytes: MAX_HTML_BYTES,
    onLimitExceeded: "truncate",
    requiredContentType: "text/html",
  })
    .then(async ({ body, truncated, ...result }) => {
      const html = body.toString("utf8");
      const $ = cheerio.load(html);
      const seo = analyzeSeo($);
      const [technicalSeo, pageSpeed] = await Promise.all([
        analyzeTechnicalSeo(result.finalUrl),
        analyzePageSpeed(result.finalUrl),
      ]);
      const contentSignals = analyzeContentSignals($, seo.structuredData);
      const localSeoRelevant = determineLocalSeoRelevance(seo, contentSignals);
      const checks = buildSeoChecks(seo, technicalSeo, pageSpeed, contentSignals, localSeoRelevant);
      const score = calculateSeoScore(checks);
      score.localSeoRelevant = localSeoRelevant;

      res.status(200).json({
        success: true,
        url,
        ...result,
        htmlLength: html.length,
        truncated,
        score,
        pageSpeed,
        seo,
        technicalSeo,
        contentSignals,
        checks,
      });
    })
    .catch((err) => {
      const status = err instanceof AuditFetchError ? err.status : 502;
      const message = err instanceof AuditFetchError ? err.message : "Kunde inte hämta sidan.";
      res.status(status).json({ success: false, error: message });
    });
};
