const { fetchSafely, isValidHttpUrl } = require("./safeFetch");

const ROBOTS_MAX_BYTES = 500 * 1024; // 500 KB
const SITEMAP_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const SITEMAP_SNIFF_LENGTH = 5000; // root element is always near the top

function parseSitemapDirectives(robotsTxt) {
  const urls = [];
  const lines = robotsTxt.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*sitemap\s*:\s*(.+?)\s*$/i);
    if (match) {
      const candidate = match[1].trim();
      if (isValidHttpUrl(candidate)) {
        urls.push(candidate);
      }
    }
  }

  return urls;
}

function detectSitemapType(xmlText) {
  const snippet = xmlText.slice(0, SITEMAP_SNIFF_LENGTH).toLowerCase();
  if (snippet.includes("<sitemapindex")) return "sitemapindex";
  if (snippet.includes("<urlset")) return "urlset";
  return "unknown";
}

async function fetchRobotsTxt(origin) {
  const url = `${origin}/robots.txt`;

  try {
    // requiredContentType is intentionally omitted: real-world robots.txt
    // files show up with inconsistent content-types, so we sniff the body
    // instead of gatekeeping on the header.
    const result = await fetchSafely(url, {
      maxBytes: ROBOTS_MAX_BYTES,
      onLimitExceeded: "truncate",
      rejectOnServerError: false,
    });

    if (result.status !== 200) {
      return { exists: false, status: result.status, url: result.finalUrl, sitemaps: [] };
    }

    const text = result.body.toString("utf8");
    return {
      exists: true,
      status: result.status,
      url: result.finalUrl,
      sitemaps: parseSitemapDirectives(text),
    };
  } catch {
    // Any failure (SSRF block, DNS error, timeout, connection error, ...)
    // must not fail the whole audit — robots.txt is optional.
    return { exists: false, status: null, url, sitemaps: [] };
  }
}

async function fetchSitemap(url) {
  try {
    // The URL may come straight from robots.txt (untrusted input), so it
    // goes through the exact same SSRF/DNS-guarded fetchSafely as any
    // other URL in this project.
    const result = await fetchSafely(url, {
      maxBytes: SITEMAP_MAX_BYTES,
      onLimitExceeded: "truncate",
      rejectOnServerError: false,
    });

    if (result.status !== 200) {
      return { exists: false, status: result.status, url: result.finalUrl, type: null };
    }

    const text = result.body.toString("utf8");
    return { exists: true, status: result.status, url: result.finalUrl, type: detectSitemapType(text) };
  } catch {
    return { exists: false, status: null, url, type: null };
  }
}

async function analyzeTechnicalSeo(finalUrl) {
  const origin = new URL(finalUrl).origin;

  const robotsTxt = await fetchRobotsTxt(origin);
  const candidateSitemapUrl = robotsTxt.sitemaps[0] || `${origin}/sitemap.xml`;
  const sitemap = await fetchSitemap(candidateSitemapUrl);

  return { robotsTxt, sitemap };
}

module.exports = { analyzeTechnicalSeo, parseSitemapDirectives, fetchRobotsTxt, fetchSitemap };
