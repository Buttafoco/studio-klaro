// Synkens kärna. Regler som aldrig får brytas:
//   * Allt hämtas och valideras FÖRE första skrivningen. Ett fel ger noll skrivningar.
//   * Skrivningarna sker i EN transaktion (rader + täckning) eller inte alls.
//   * En dag registreras i gsc_sync_days först när hela hämtningen lyckats.
//     Misslyckad synk lämnar därför luckor ("okänt"), aldrig nollor.
//   * Ett helt tomt svar efter nyligen registrerad trafik behandlas som fel.

const { eachDay, addDays } = require("./dates");

const PROPERTY_SEARCH_TYPE = "web";
const BATCH_SIZE = 5000;
const SUSPICIOUS_LOOKBACK_DAYS = 28;
const ADVISORY_LOCK_NAME = "analytics.gsc_sync";

// Tabellnamn och kolumner är konstanter; inget här kommer från användarinput.
const DIMENSIONS = [
  { name: "site", dimensions: ["date"], table: "gsc_daily_site", keyColumn: null },
  { name: "query", dimensions: ["date", "query"], table: "gsc_daily_query", keyColumn: "query" },
  { name: "page", dimensions: ["date", "page"], table: "gsc_daily_page", keyColumn: "page" },
  { name: "country", dimensions: ["date", "country"], table: "gsc_daily_country", keyColumn: "country" },
  { name: "device", dimensions: ["date", "device"], table: "gsc_daily_device", keyColumn: "device" },
];

class SyncError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SyncError";
    this.code = code || "sync_failed";
  }
}

function assertNoDuplicateKeys(name, rows) {
  const seen = new Set();
  for (const r of rows) {
    const k = `${r.date}\u0000${r.key === null ? "" : r.key}`;
    if (seen.has(k)) throw new SyncError(`Dubblettrad i svaret för ${name}.`, "duplicate_rows");
    seen.add(k);
  }
}

// Ren funktion: kontrollerar hela svaret och avgör vilka dagar som är täckta.
function assessFetch({ start, end, results, recentSiteRows }) {
  const site = results.site;
  const siteDates = new Set(site.map((r) => r.date));

  for (const d of DIMENSIONS) assertNoDuplicateKeys(d.name, results[d.name]);

  // Dimensionsrader för en dag som saknar totalrad betyder ett ofullständigt svar.
  for (const d of DIMENSIONS) {
    if (d.name === "site") continue;
    for (const r of results[d.name]) {
      if (!siteDates.has(r.date)) {
        throw new SyncError(
          `Svaret för ${d.name} innehåller dag ${r.date} som saknas i totalerna.`,
          "inconsistent_response"
        );
      }
    }
  }

  if (site.length === 0 && recentSiteRows > 0) {
    throw new SyncError(
      "Search Console returnerade inga rader trots att det finns trafik de senaste veckorna. " +
        "Svaret behandlas som fel, inte som noll trafik.",
      "suspicious_empty_response"
    );
  }

  const days = eachDay(start, end).map((date) => ({ date, hasData: siteDates.has(date) }));
  return { days };
}

async function insertDimensionRows(client, table, keyColumn, property, rows) {
  const cols = ["property", "search_type", "date"];
  if (keyColumn) cols.push(keyColumn);
  cols.push("clicks", "impressions", "ctr", "position");
  const pk = cols.slice(0, keyColumn ? 4 : 3).join(", ");

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const params = [property, PROPERTY_SEARCH_TYPE, batch.map((r) => r.date)];
    const selectCols = ["$1::text", "$2::text", "t.date"];
    const unnestCols = ["date"];
    const unnestTypes = ["$3::date[]"];
    let n = 4;
    if (keyColumn) {
      params.push(batch.map((r) => r.key));
      selectCols.push("t.key");
      unnestCols.push("key");
      unnestTypes.push(`$${n}::text[]`);
      n += 1;
    }
    for (const [field, type] of [
      ["clicks", "int[]"],
      ["impressions", "int[]"],
      ["ctr", "float8[]"],
      ["position", "float8[]"],
    ]) {
      params.push(batch.map((r) => r[field]));
      selectCols.push(`t.${field}`);
      unnestCols.push(field);
      unnestTypes.push(`$${n}::${type}`);
      n += 1;
    }
    await client.query(
      `insert into analytics.${table} (${cols.join(", ")})
       select ${selectCols.join(", ")}
         from unnest(${unnestTypes.join(", ")}) as t(${unnestCols.join(", ")})
       on conflict (${pk}) do update set
         clicks = excluded.clicks, impressions = excluded.impressions,
         ctr = excluded.ctr, position = excluded.position, fetched_at = now()`,
      params
    );
  }
}

async function writeWindow(pool, { property, start, end, results, days, runId }) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const lock = await client.query("select pg_try_advisory_xact_lock(hashtext($1)) as locked", [
      ADVISORY_LOCK_NAME,
    ]);
    if (!lock.rows[0] || lock.rows[0].locked !== true) {
      throw new SyncError("En annan synk pågår redan.", "lock_busy");
    }

    // Fönstret ersätts helt så att rader som Google tagit bort inte blir kvar.
    for (const d of DIMENSIONS) {
      await client.query(
        `delete from analytics.${d.table}
          where property = $1 and search_type = $2 and date between $3 and $4`,
        [property, PROPERTY_SEARCH_TYPE, start, end]
      );
    }
    await client.query(
      `delete from analytics.gsc_sync_days
        where property = $1 and search_type = $2 and date between $3 and $4`,
      [property, PROPERTY_SEARCH_TYPE, start, end]
    );

    const counts = {};
    for (const d of DIMENSIONS) {
      await insertDimensionRows(client, d.table, d.keyColumn, property, results[d.name]);
      counts[d.name] = results[d.name].length;
    }

    await client.query(
      `insert into analytics.gsc_sync_days (property, search_type, date, has_data, data_state, run_id)
       select $1, $2, t.date, t.has_data, 'final', $5::uuid
         from unnest($3::date[], $4::boolean[]) as t(date, has_data)`,
      [property, PROPERTY_SEARCH_TYPE, days.map((d) => d.date), days.map((d) => d.hasData), runId]
    );

    await client.query("commit");
    return counts;
  } catch (err) {
    try {
      await client.query("rollback");
    } catch (_) {
      /* anslutningen kan redan vara stängd */
    }
    throw err;
  } finally {
    client.release();
  }
}

function describeError(err) {
  const code = (err && err.code && typeof err.code === "string" && err.code) || "unexpected_error";
  const message = String((err && err.message) || "Okänt fel").replace(/\s+/g, " ").slice(0, 500);
  return { code: code.slice(0, 64), message };
}

// fetchDimension(dimensions) → Promise<rader>; injiceras så att testerna är offline.
async function syncRange({ pool, fetchDimension, property, start, end, trigger }) {
  const started = await pool.query(
    `insert into analytics.sync_runs (source, trigger, property, range_start, range_end)
     values ('gsc', $1, $2, $3, $4) returning id`,
    [trigger, property, start, end]
  );
  const runId = started.rows[0].id;

  try {
    // 1. Hämta och validera allt. Inga skrivningar än.
    const results = {};
    for (const d of DIMENSIONS) {
      results[d.name] = await fetchDimension(d.dimensions);
    }

    const recent = await pool.query(
      `select count(*)::int as n from analytics.gsc_daily_site
        where property = $1 and search_type = $2 and date between $3 and $4
          and (clicks > 0 or impressions > 0)`,
      [property, PROPERTY_SEARCH_TYPE, addDays(start, -SUSPICIOUS_LOOKBACK_DAYS), addDays(start, -1)]
    );
    const recentSiteRows = recent.rows[0] ? recent.rows[0].n : 0;

    const { days } = assessFetch({ start, end, results, recentSiteRows });

    // 2. Skriv allt eller inget.
    const counts = await writeWindow(pool, { property, start, end, results, days, runId });
    const daysWithData = days.filter((d) => d.hasData).length;

    await pool.query(
      `update analytics.sync_runs
          set status = 'success', finished_at = now(), rows_written = $2::jsonb
        where id = $1`,
      [runId, JSON.stringify({ ...counts, days: days.length, days_with_data: daysWithData })]
    );
    return { runId, counts, days: days.length, daysWithData };
  } catch (err) {
    const { code, message } = describeError(err);
    try {
      await pool.query(
        `update analytics.sync_runs
            set status = 'failed', finished_at = now(), error_code = $2, error_message = $3
          where id = $1`,
        [runId, code, message]
      );
    } catch (_) {
      /* loggfel får inte maskera det riktiga felet */
    }
    const wrapped = new SyncError(message, code);
    wrapped.runId = runId;
    throw wrapped;
  }
}

module.exports = { syncRange, assessFetch, SyncError, DIMENSIONS, PROPERTY_SEARCH_TYPE };
