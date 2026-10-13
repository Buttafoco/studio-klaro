// Daglig synk av Google Search Console → Supabase (Studio Klaro Analytics).
//
//   GET  /api/cron/gsc-sync                      Vercel Cron, rullande fönster D-10…D-3
//   POST /api/cron/gsc-sync  {"from":"…","to":"…"}  Backfill, högst 31 dagar per anrop
//
// Båda kräver `Authorization: Bearer $CRON_SECRET`. Svaret innehåller aldrig
// analysdata, bara status och antal rader.

const crypto = require("crypto");
const { dailyWindow, validateBackfillRange, InvalidRangeError } = require("../_lib/gsc/dates");
const { getOidcToken, getAccessToken } = require("../_lib/gsc/auth");
const { fetchDimension } = require("../_lib/gsc/client");
const { createPool } = require("../_lib/gsc/db");
const { syncRange } = require("../_lib/gsc/sync");

const REQUIRED_ENV = ["GSC_SITE_URL", "ANALYTICS_DATABASE_URL"];

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function isAuthorized(req, env) {
  const secret = env.CRON_SECRET;
  if (!secret || secret.length < 16) return false; // stängt som standard
  const header = req.headers && req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  return safeEqual(header.slice(7), secret);
}

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

function createHandler(deps = {}) {
  const env = deps.env || process.env;
  const now = deps.now || (() => new Date());
  const makePool = deps.createPool || createPool;
  const authenticate = deps.getAccessToken || getAccessToken;
  const fetchDim = deps.fetchDimension || fetchDimension;
  const fetchImpl = deps.fetchImpl || fetch;

  return async function handler(req, res) {
    if (!isAuthorized(req, env)) {
      json(res, 401, { ok: false, error: "unauthorized" });
      return;
    }
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      json(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    const missing = REQUIRED_ENV.filter((n) => !env[n]);
    if (missing.length) {
      json(res, 500, { ok: false, error: "not_configured", missing });
      return;
    }

    let range;
    let trigger = "cron";
    try {
      if (req.method === "POST") {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        range = validateBackfillRange(body.from, body.to, now());
        trigger = "backfill";
      } else {
        range = dailyWindow(now());
      }
    } catch (err) {
      if (err instanceof InvalidRangeError) {
        json(res, 400, { ok: false, error: "invalid_range", message: err.message });
        return;
      }
      throw err;
    }

    let pool;
    try {
      pool = makePool(env);
      // Token hämtas först inne i syncRange (vid första dimensionen) så att även
      // autentiseringsfel hamnar i analytics.sync_runs.
      let tokenPromise = null;
      const accessToken = () => {
        if (!tokenPromise) {
          tokenPromise = Promise.resolve().then(() =>
            authenticate({ oidcToken: getOidcToken(req, env), env, fetchImpl })
          );
        }
        return tokenPromise;
      };
      const result = await syncRange({
        pool,
        property: env.GSC_SITE_URL,
        start: range.start,
        end: range.end,
        trigger,
        fetchDimension: async (dimensions) =>
          fetchDim({
            accessToken: await accessToken(),
            siteUrl: env.GSC_SITE_URL,
            start: range.start,
            end: range.end,
            dimensions,
            fetchImpl,
          }),
      });
      json(res, 200, {
        ok: true,
        runId: result.runId,
        range,
        trigger,
        days: result.days,
        daysWithData: result.daysWithData,
        rows: result.counts,
      });
    } catch (err) {
      // Loggas utan hemligheter; felet finns även i analytics.sync_runs när
      // databasen var nåbar.
      console.error(
        JSON.stringify({
          event: "gsc_sync_failed",
          code: err && err.code,
          message: String((err && err.message) || err).slice(0, 300),
          runId: err && err.runId,
          range,
        })
      );
      json(res, 502, {
        ok: false,
        error: (err && err.code) || "sync_failed",
        runId: (err && err.runId) || null,
      });
    } finally {
      if (pool) await pool.end().catch(() => {});
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.isAuthorized = isAuthorized;
