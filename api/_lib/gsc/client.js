// Search Analytics API-klient. Returnerar bara validerade rader; allt som ser fel
// ut kastar, så att en trasig hämtning aldrig kan tolkas som "noll trafik".

const { isIsoDate } = require("./dates");

const PAGE_SIZE = 25000;
const MAX_PAGES = 40; // skyddsgräns (1 miljon rader per dimension och körning)

class GscApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "GscApiError";
    this.code = code || "gsc_api_error";
  }
}

function num(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new GscApiError(`Ogiltigt värde för ${name}.`, "invalid_response");
  }
  return value;
}

function parseRow(raw, dimensions, start, end) {
  if (!raw || !Array.isArray(raw.keys) || raw.keys.length !== dimensions.length) {
    throw new GscApiError("Oväntad radstruktur från Search Console.", "invalid_response");
  }
  const date = raw.keys[0];
  if (!isIsoDate(date) || date < start || date > end) {
    throw new GscApiError("Rad med datum utanför begärt intervall.", "invalid_response");
  }
  const clicks = num(raw.clicks, "clicks");
  const impressions = num(raw.impressions, "impressions");
  const ctr = num(raw.ctr, "ctr");
  const position = num(raw.position, "position");
  if (!Number.isInteger(clicks) || !Number.isInteger(impressions) || clicks > impressions || ctr > 1) {
    throw new GscApiError("Orimliga mätvärden från Search Console.", "invalid_response");
  }
  for (const key of raw.keys.slice(1)) {
    if (typeof key !== "string" || key.length === 0) {
      throw new GscApiError("Tom dimensionsnyckel.", "invalid_response");
    }
  }
  return { date, key: raw.keys.length > 1 ? raw.keys[1] : null, clicks, impressions, ctr, position };
}

async function fetchDimension({ accessToken, siteUrl, start, end, dimensions, fetchImpl = fetch }) {
  const endpoint =
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const rows = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let res;
    try {
      res = await fetchImpl(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          dimensions,
          type: "web",
          dataState: "final",
          rowLimit: PAGE_SIZE,
          startRow: page * PAGE_SIZE,
        }),
      });
    } catch (_) {
      throw new GscApiError("Nätverksfel mot Search Console API.", "network_error");
    }

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      /* hanteras nedan */
    }
    if (!res.ok) {
      const reason = (data && data.error && (data.error.message || data.error.status)) || "okänt fel";
      throw new GscApiError(`Search Console svarade ${res.status}: ${String(reason).slice(0, 200)}`);
    }
    if (!data || typeof data !== "object") {
      throw new GscApiError("Tomt eller ogiltigt svar från Search Console.", "invalid_response");
    }

    // Ett giltigt svar utan rader saknar "rows"; det är legitimt (inga data).
    const batch = data.rows === undefined ? [] : data.rows;
    if (!Array.isArray(batch)) {
      throw new GscApiError("Fältet rows har fel typ.", "invalid_response");
    }
    for (const raw of batch) rows.push(parseRow(raw, dimensions, start, end));
    if (batch.length < PAGE_SIZE) return rows;
  }
  throw new GscApiError("För många sidor; avbryter hellre än att spara ofullständig data.", "too_many_rows");
}

module.exports = { fetchDimension, GscApiError, PAGE_SIZE, MAX_PAGES };
