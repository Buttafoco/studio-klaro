const PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const TIMEOUT_MS = 25000;
const GENERIC_ERROR = "PageSpeed-data kunde inte hämtas.";

// Lighthouse's own numericUnit strings ("millisecond", "unitless", ...)
// aren't consumer-friendly, so we normalize to our own unit per metric.
const METRIC_DEFINITIONS = [
  { key: "firstContentfulPaint", auditId: "first-contentful-paint", unit: "ms" },
  { key: "largestContentfulPaint", auditId: "largest-contentful-paint", unit: "ms" },
  { key: "totalBlockingTime", auditId: "total-blocking-time", unit: "ms" },
  { key: "cumulativeLayoutShift", auditId: "cumulative-layout-shift", unit: "score" },
  { key: "speedIndex", auditId: "speed-index", unit: "ms" },
];

function emptyMetrics() {
  const metrics = {};
  for (const { key } of METRIC_DEFINITIONS) {
    metrics[key] = null;
  }
  return metrics;
}

function unavailableResult(error) {
  return {
    available: false,
    strategy: "mobile",
    performanceScore: null,
    lighthouseSeoScore: null,
    lighthouseVersion: null,
    fetchTime: null,
    metrics: emptyMetrics(),
    error,
  };
}

function toScore(category) {
  return category && typeof category.score === "number" ? Math.round(category.score * 100) : null;
}

function extractMetric(audits, auditId, unit) {
  const audit = audits && audits[auditId];
  if (!audit || typeof audit.numericValue !== "number") {
    return null;
  }
  return {
    value: audit.numericValue,
    unit,
    displayValue: typeof audit.displayValue === "string" ? audit.displayValue : "",
  };
}

function extractMetrics(audits) {
  const metrics = {};
  for (const { key, auditId, unit } of METRIC_DEFINITIONS) {
    metrics[key] = extractMetric(audits, auditId, unit);
  }
  return metrics;
}

/**
 * Runs Google PageSpeed Insights (mobile, performance + seo categories)
 * against `url` and returns a small normalized result — never the raw
 * Google response. PageSpeed is a best-effort complement to the audit:
 * any failure (timeout, quota, Google outage, malformed response) resolves
 * to an { available: false, error } shape instead of throwing, so it can
 * never fail the rest of the SEO audit.
 */
async function analyzePageSpeed(url) {
  const params = new URLSearchParams();
  params.append("url", url);
  params.append("strategy", "mobile");
  params.append("category", "performance");
  params.append("category", "seo");

  // PAGESPEED_API_KEY is optional locally (the API works unauthenticated
  // at a low quota), but strongly recommended in production for quota and
  // reliability. It is read server-side only and is never logged, echoed
  // back in a response, or exposed to the client.
  if (process.env.PAGESPEED_API_KEY) {
    params.append("key", process.env.PAGESPEED_API_KEY);
  }

  const requestUrl = `${PAGESPEED_ENDPOINT}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(requestUrl, { signal: controller.signal });
  } catch (err) {
    return unavailableResult(err.name === "AbortError" ? "PageSpeed-analysen tog för lång tid." : GENERIC_ERROR);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // Covers 429 (quota), 500/502/503 (Google-side errors), etc.
    return unavailableResult(GENERIC_ERROR);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return unavailableResult(GENERIC_ERROR);
  }

  const lighthouseResult = data && data.lighthouseResult;
  if (!lighthouseResult) {
    return unavailableResult(GENERIC_ERROR);
  }

  const categories = lighthouseResult.categories || {};
  const audits = lighthouseResult.audits || {};

  return {
    available: true,
    strategy: "mobile",
    performanceScore: toScore(categories.performance),
    lighthouseSeoScore: toScore(categories.seo),
    lighthouseVersion: lighthouseResult.lighthouseVersion || null,
    fetchTime: lighthouseResult.fetchTime || null,
    metrics: extractMetrics(audits),
  };
}

module.exports = { analyzePageSpeed };
