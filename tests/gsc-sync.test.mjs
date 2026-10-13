// Tester för GSC-synken (node --test). Körs med `npm test`. Helt offline:
// Google-anrop och databas ersätts av fakes.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dates = require('../api/_lib/gsc/dates.js');
const { getAccessToken, getOidcToken } = require('../api/_lib/gsc/auth.js');
const { fetchDimension, PAGE_SIZE } = require('../api/_lib/gsc/client.js');
const { syncRange, assessFetch } = require('../api/_lib/gsc/sync.js');
const { parseDatabaseUrl, createPool } = require('../api/_lib/gsc/db.js');
const { createHandler } = require('../api/cron/gsc-sync.js');

const NOW = new Date('2026-10-13T06:45:00Z');
const PROPERTY = 'sc-domain:studioklaro.se';
const SECRET = 'a-long-enough-test-secret';

// ---------------------------------------------------------------- datum
describe('dates', () => {
  test('dygnsfönstret slutar tre dagar före idag och omfattar åtta dagar', () => {
    assert.deepEqual(dates.dailyWindow(NOW), { start: '2026-10-03', end: '2026-10-10' });
    assert.equal(dates.eachDay('2026-10-03', '2026-10-10').length, 8);
  });

  test('datumaritmetik klarar månads- och årsskifte', () => {
    assert.equal(dates.addDays('2026-01-01', -1), '2025-12-31');
    assert.equal(dates.addDays('2026-02-28', 1), '2026-03-01');
  });

  test('isIsoDate avvisar ogiltiga datum', () => {
    assert.equal(dates.isIsoDate('2026-02-30'), false);
    assert.equal(dates.isIsoDate('2026-2-3'), false);
    assert.equal(dates.isIsoDate(20260101), false);
    assert.equal(dates.isIsoDate('2026-10-13'), true);
  });

  test('backfill: godkänner giltigt intervall', () => {
    assert.deepEqual(dates.validateBackfillRange('2026-09-01', '2026-09-30', NOW), {
      start: '2026-09-01',
      end: '2026-09-30',
    });
  });

  test('backfill: avvisar preliminära dagar, för långa och för gamla intervall', () => {
    assert.throws(() => dates.validateBackfillRange('2026-10-01', '2026-10-12', NOW), /högst vara 2026-10-10/);
    assert.throws(() => dates.validateBackfillRange('2026-08-01', '2026-09-30', NOW), /Högst 31/);
    assert.throws(() => dates.validateBackfillRange('2024-01-01', '2024-01-10', NOW), /historik/);
    assert.throws(() => dates.validateBackfillRange('2026-09-30', '2026-09-01', NOW), /före eller lika/);
    assert.throws(() => dates.validateBackfillRange('x', '2026-09-01', NOW), /YYYY-MM-DD/);
  });
});

// ---------------------------------------------------------------- auth
describe('auth (Workload Identity Federation)', () => {
  const env = {
    GCP_PROJECT_NUMBER: '123456789',
    GCP_WORKLOAD_IDENTITY_POOL_ID: 'vercel',
    GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: 'vercel',
    GCP_SERVICE_ACCOUNT_EMAIL: 'studio-klaro-gsc@studio-klaro-seo.iam.gserviceaccount.com',
  };

  test('växlar OIDC-token mot token med enbart webmasters.readonly', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      if (url.startsWith('https://sts.googleapis.com')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'federated' }) };
      }
      return { ok: true, status: 200, json: async () => ({ accessToken: 'sa-token' }) };
    };
    const token = await getAccessToken({ oidcToken: 'oidc-jwt', env, fetchImpl });
    assert.equal(token, 'sa-token');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.subjectToken, 'oidc-jwt');
    assert.equal(
      calls[0].body.audience,
      '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/vercel'
    );
    assert.match(calls[1].url, /serviceAccounts\/studio-klaro-gsc%40studio-klaro-seo\.iam\.gserviceaccount\.com:generateAccessToken$/);
    assert.equal(calls[1].init.headers.authorization, 'Bearer federated');
    assert.deepEqual(calls[1].body.scope, ['https://www.googleapis.com/auth/webmasters.readonly']);
  });

  test('fel från Google läcker inte tokens', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Permission denied' } }),
    });
    await assert.rejects(
      () => getAccessToken({ oidcToken: 'SECRET-OIDC', env, fetchImpl }),
      (err) => /403/.test(err.message) && !/SECRET-OIDC/.test(err.message)
    );
  });

  test('saknad konfiguration ger tydligt fel', async () => {
    await assert.rejects(() => getAccessToken({ oidcToken: 'x', env: {}, fetchImpl: async () => {} }), /GCP_PROJECT_NUMBER/);
  });

  test('OIDC-token läses från Vercels header, annars env', () => {
    assert.equal(getOidcToken({ headers: { 'x-vercel-oidc-token': 'h' } }, {}), 'h');
    assert.equal(getOidcToken({ headers: {} }, { VERCEL_OIDC_TOKEN: 'e' }), 'e');
    assert.throws(() => getOidcToken({ headers: {} }, {}), /OIDC/);
  });
});

// ---------------------------------------------------------------- klient
describe('Search Analytics-klient', () => {
  const row = (date, key, clicks = 1, impressions = 10) => ({
    keys: key === null ? [date] : [date, key],
    clicks,
    impressions,
    ctr: clicks / impressions,
    position: 4.2,
  });
  const ok = (rows) => async () => ({ ok: true, status: 200, json: async () => (rows === undefined ? {} : { rows }) });
  const base = { accessToken: 't', siteUrl: PROPERTY, start: '2026-10-03', end: '2026-10-10' };

  test('begär final data för web och kodar property i URL:en', async () => {
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url, body: JSON.parse(init.body) };
      return { ok: true, status: 200, json: async () => ({ rows: [row('2026-10-03', 'q')] }) };
    };
    const rows = await fetchDimension({ ...base, dimensions: ['date', 'query'], fetchImpl });
    assert.match(seen.url, /sites\/sc-domain%3Astudioklaro\.se\/searchAnalytics\/query$/);
    assert.equal(seen.body.dataState, 'final');
    assert.equal(seen.body.type, 'web');
    assert.deepEqual(rows[0], { date: '2026-10-03', key: 'q', clicks: 1, impressions: 10, ctr: 0.1, position: 4.2 });
  });

  test('pagination fortsätter tills en sida är kortare än radgränsen', async () => {
    const starts = [];
    const fetchImpl = async (_url, init) => {
      const body = JSON.parse(init.body);
      starts.push(body.startRow);
      const n = body.startRow === 0 ? PAGE_SIZE : 3;
      const rows = Array.from({ length: n }, (_, i) => row('2026-10-03', `q${body.startRow + i}`));
      return { ok: true, status: 200, json: async () => ({ rows }) };
    };
    const rows = await fetchDimension({ ...base, dimensions: ['date', 'query'], fetchImpl });
    assert.deepEqual(starts, [0, PAGE_SIZE]);
    assert.equal(rows.length, PAGE_SIZE + 3);
  });

  test('svar utan rows är ett giltigt, tomt resultat', async () => {
    assert.deepEqual(await fetchDimension({ ...base, dimensions: ['date'], fetchImpl: ok(undefined) }), []);
  });

  test('HTTP-fel kastar (blir aldrig tom lista)', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({ error: { message: 'Backend Error' } }) });
    await assert.rejects(() => fetchDimension({ ...base, dimensions: ['date'], fetchImpl }), /503/);
  });

  test('nätverksfel kastar', async () => {
    const fetchImpl = async () => {
      throw new Error('socket hang up');
    };
    await assert.rejects(() => fetchDimension({ ...base, dimensions: ['date'], fetchImpl }), /Nätverksfel/);
  });

  test('ogiltiga rader avvisas', async () => {
    for (const bad of [
      row('2026-09-01', null), // utanför intervallet
      { keys: ['2026-10-03'], clicks: -1, impressions: 5, ctr: 0, position: 1 },
      { keys: ['2026-10-03'], clicks: 9, impressions: 5, ctr: 1, position: 1 },
      { keys: ['2026-10-03'], clicks: 1, impressions: 5, ctr: 0.2 }, // position saknas
    ]) {
      await assert.rejects(() => fetchDimension({ ...base, dimensions: ['date'], fetchImpl: ok([bad]) }));
    }
    await assert.rejects(() => fetchDimension({ ...base, dimensions: ['date'], fetchImpl: ok('inte-en-lista') }));
  });
});

// ---------------------------------------------------------------- synk
function fakePool({ recentRows = 0, failOn = null, lockOk = true } = {}) {
  const log = [];
  const client = {
    async query(sql, params) {
      log.push({ via: 'client', sql: sql.replace(/\s+/g, ' ').trim(), params });
      if (failOn && sql.includes(failOn)) throw new Error(`simulerat fel vid ${failOn}`);
      if (sql.includes('pg_try_advisory_xact_lock')) return { rows: [{ locked: lockOk }] };
      return { rows: [] };
    },
    release() {
      log.push({ via: 'client', sql: 'release' });
    },
  };
  return {
    log,
    async query(sql, params) {
      log.push({ via: 'pool', sql: sql.replace(/\s+/g, ' ').trim(), params });
      if (sql.includes('insert into analytics.sync_runs')) return { rows: [{ id: 'run-1' }] };
      if (sql.includes('select count(*)')) return { rows: [{ n: recentRows }] };
      return { rows: [] };
    },
    async connect() {
      return client;
    },
    async end() {},
  };
}

const siteRow = (date, clicks = 5, impressions = 100) => ({
  date, key: null, clicks, impressions, ctr: clicks / impressions, position: 7.5,
});
const dimRow = (date, key, clicks = 1, impressions = 10) => ({
  date, key, clicks, impressions, ctr: clicks / impressions, position: 7.5,
});

function fetcher(map) {
  return async (dimensions) => {
    const name = dimensions.length === 1 ? 'site' : dimensions[1];
    const value = map[name];
    if (value instanceof Error) throw value;
    return value || [];
  };
}

const range = { property: PROPERTY, start: '2026-10-03', end: '2026-10-05', trigger: 'cron' };
const sqlOf = (pool, via) => pool.log.filter((l) => !via || l.via === via).map((l) => l.sql);
const wrote = (pool) => pool.log.some((l) => /^(insert into analytics\.gsc_|delete from)/.test(l.sql));

describe('syncRange', () => {
  test('lyckad synk skriver allt i en transaktion och markerar täckta dagar', async () => {
    const pool = fakePool();
    const result = await syncRange({
      pool,
      ...range,
      fetchDimension: fetcher({
        site: [siteRow('2026-10-03'), siteRow('2026-10-05')],
        query: [dimRow('2026-10-03', 'klaro')],
        page: [dimRow('2026-10-03', 'https://studioklaro.se/')],
        country: [dimRow('2026-10-03', 'swe')],
        device: [dimRow('2026-10-03', 'MOBILE')],
      }),
    });
    assert.equal(result.days, 3);
    assert.equal(result.daysWithData, 2);

    const clientSql = sqlOf(pool, 'client');
    assert.equal(clientSql[0], 'begin');
    assert.equal(clientSql.at(-2), 'commit');
    assert.ok(clientSql.some((s) => s.includes('on conflict')));

    const coverage = pool.log.find((l) => l.sql.includes('insert into analytics.gsc_sync_days'));
    assert.deepEqual(coverage.params[2], ['2026-10-03', '2026-10-04', '2026-10-05']);
    // 04:e hämtades korrekt men hade inga rader → täckt med has_data=false, inte "saknad".
    assert.deepEqual(coverage.params[3], [true, false, true]);

    assert.match(sqlOf(pool, 'pool').at(-1), /status = 'success'/);
  });

  test('misslyckad hämtning: inga skrivningar, ingen täckning, körningen loggas som failed', async () => {
    const pool = fakePool();
    await assert.rejects(
      () => syncRange({ pool, ...range, fetchDimension: fetcher({ site: [siteRow('2026-10-03')], query: new Error('Search Console svarade 503') }) }),
      (err) => err.runId === 'run-1' && /503/.test(err.message)
    );
    assert.equal(wrote(pool), false);
    assert.equal(sqlOf(pool, 'client').length, 0, 'ingen transaktion ska ha öppnats');
    assert.ok(!sqlOf(pool).some((s) => s.includes('gsc_sync_days')));
    assert.match(sqlOf(pool, 'pool').at(-1), /status = 'failed'/);
  });

  test('tomt svar efter nylig trafik behandlas som fel, inte som noll trafik', async () => {
    const pool = fakePool({ recentRows: 20 });
    await assert.rejects(
      () => syncRange({ pool, ...range, fetchDimension: fetcher({}) }),
      (err) => err.code === 'suspicious_empty_response'
    );
    assert.equal(wrote(pool), false);
  });

  test('tomt svar utan tidigare trafik (ny property) accepteras som okänt→noll-dagar med has_data=false', async () => {
    const pool = fakePool({ recentRows: 0 });
    const result = await syncRange({ pool, ...range, fetchDimension: fetcher({}) });
    assert.equal(result.daysWithData, 0);
  });

  test('dimensionsrader för dag utan totalrad avvisas som inkonsekvent svar', async () => {
    const pool = fakePool();
    await assert.rejects(
      () => syncRange({
        pool, ...range,
        fetchDimension: fetcher({ site: [siteRow('2026-10-03')], query: [dimRow('2026-10-04', 'x')] }),
      }),
      (err) => err.code === 'inconsistent_response'
    );
    assert.equal(wrote(pool), false);
  });

  test('dubbletter i svaret avvisas innan något skrivs', async () => {
    const pool = fakePool();
    await assert.rejects(
      () => syncRange({
        pool, ...range,
        fetchDimension: fetcher({
          site: [siteRow('2026-10-03')],
          query: [dimRow('2026-10-03', 'x'), dimRow('2026-10-03', 'x')],
        }),
      }),
      (err) => err.code === 'duplicate_rows'
    );
    assert.equal(wrote(pool), false);
  });

  test('fel mitt i skrivningen rullar tillbaka och registrerar ingen täckning', async () => {
    const pool = fakePool({ failOn: 'insert into analytics.gsc_daily_page' });
    await assert.rejects(
      () => syncRange({
        pool, ...range,
        fetchDimension: fetcher({
          site: [siteRow('2026-10-03')],
          query: [dimRow('2026-10-03', 'x')],
          page: [dimRow('2026-10-03', 'p')],
        }),
      }),
      /simulerat fel/
    );
    const clientSql = sqlOf(pool, 'client');
    assert.ok(clientSql.includes('rollback'));
    assert.ok(!clientSql.includes('commit'));
    assert.ok(!clientSql.some((s) => s.includes('insert into analytics.gsc_sync_days')));
    assert.match(sqlOf(pool, 'pool').at(-1), /status = 'failed'/);
  });

  test('parallell körning stoppas av advisory lock', async () => {
    const pool = fakePool({ lockOk: false });
    await assert.rejects(
      () => syncRange({ pool, ...range, fetchDimension: fetcher({ site: [siteRow('2026-10-03')] }) }),
      (err) => err.code === 'lock_busy'
    );
    assert.ok(!sqlOf(pool, 'client').some((s) => s.startsWith('delete')));
  });

  test('assessFetch är ren och markerar dagar utan rader som has_data=false', () => {
    const { days } = assessFetch({
      start: '2026-10-03', end: '2026-10-04',
      results: { site: [siteRow('2026-10-04')], query: [], page: [], country: [], device: [] },
      recentSiteRows: 3,
    });
    assert.deepEqual(days, [
      { date: '2026-10-03', hasData: false },
      { date: '2026-10-04', hasData: true },
    ]);
  });
});

// ---------------------------------------------------------------- db-guard
describe('parseDatabaseUrl', () => {
  const pw = 'p%40ss';
  test('godkänner pooler med analytics_writer.<projekt>', () => {
    const cfg = parseDatabaseUrl(`postgresql://analytics_writer.fqvptjqqcemjcwyonikj:${pw}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`);
    assert.equal(cfg.user, 'analytics_writer.fqvptjqqcemjcwyonikj');
    assert.equal(cfg.password, 'p@ss');
    assert.equal(cfg.port, 6543);
  });

  test('godkänner direktanslutning till rätt projekt', () => {
    assert.ok(parseDatabaseUrl(`postgresql://analytics_writer:${pw}@db.fqvptjqqcemjcwyonikj.supabase.co:5432/postgres`));
  });

  test('vägrar fel roll, fel projekt och saknat lösenord', () => {
    assert.throws(() => parseDatabaseUrl(`postgresql://postgres.fqvptjqqcemjcwyonikj:${pw}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`), /analytics_writer/);
    assert.throws(() => parseDatabaseUrl(`postgresql://analytics_writer.abcdefghijklmnopqrst:${pw}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`), /Analytics/);
    assert.throws(() => parseDatabaseUrl('postgresql://analytics_writer.fqvptjqqcemjcwyonikj@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'), /Lösenord/);
    assert.throws(() => parseDatabaseUrl('inte en url'), /giltig URL/);
  });
});

describe('createPool (TLS-verifiering)', () => {
  const url = 'postgresql://analytics_writer.fqvptjqqcemjcwyonikj:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

  test('vägrar starta utan CA (ingen tyst reserv)', () => {
    assert.throws(() => createPool({ ANALYTICS_DATABASE_URL: url }), /ANALYTICS_DATABASE_CA/);
    assert.throws(() => createPool({ ANALYTICS_DATABASE_URL: url, ANALYTICS_DATABASE_CA: '  ' }), /ANALYTICS_DATABASE_CA/);
    assert.throws(() => createPool({ ANALYTICS_DATABASE_URL: url, ANALYTICS_DATABASE_CA: 'inte-pem' }), /PEM/);
  });

  test('kräver verifierat certifikat och värdnamn (rejectUnauthorized: true)', async () => {
    const pool = createPool({ ANALYTICS_DATABASE_URL: url, ANALYTICS_DATABASE_CA: pem });
    assert.equal(pool.options.ssl.rejectUnauthorized, true);
    assert.equal(pool.options.ssl.ca, pem);
    assert.equal(pool.options.ssl.checkServerIdentity, undefined, 'standardkontrollen av värdnamn ska gälla');
    await pool.end();
  });

  test('accepterar PEM med bokstavliga \\n från env-variabler', async () => {
    const escaped = pem.replace(/\n/g, '\\n');
    const pool = createPool({ ANALYTICS_DATABASE_URL: url, ANALYTICS_DATABASE_CA: escaped });
    assert.equal(pool.options.ssl.ca, pem);
    await pool.end();
  });

  test('källkoden innehåller ingen avstängd certifikatkontroll', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of ['api/_lib/gsc/db.js', 'api/cron/gsc-sync.js', 'scripts/verify-analytics-db.mjs']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      assert.ok(!/rejectUnauthorized\s*:\s*false/.test(src), `${f} får inte stänga av certifikatverifiering`);
      assert.ok(!/NODE_TLS_REJECT_UNAUTHORIZED/.test(src), `${f} får inte röra NODE_TLS_REJECT_UNAUTHORIZED`);
    }
  });
});

// ---------------------------------------------------------------- handler
function fakeRes() {
  const res = { headers: {}, statusCode: null, body: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

describe('cron-endpoint', () => {
  const env = {
    CRON_SECRET: SECRET,
    GSC_SITE_URL: PROPERTY,
    ANALYTICS_DATABASE_URL: 'x',
  };
  const auth = { authorization: `Bearer ${SECRET}`, 'x-vercel-oidc-token': 'jwt' };

  function handlerWith(overrides = {}) {
    const pool = fakePool();
    const calls = { dimensions: [] };
    const handler = createHandler({
      env,
      now: () => NOW,
      createPool: () => pool,
      getAccessToken: async () => 'tok',
      fetchDimension: async ({ dimensions, start, end }) => {
        calls.dimensions.push(dimensions);
        calls.range = { start, end };
        return dimensions.length === 1 ? [siteRow(start)] : [];
      },
      ...overrides,
    });
    return { handler, pool, calls };
  }

  test('nekar utan hemlighet och med fel hemlighet (fail closed)', async () => {
    const { handler } = handlerWith();
    for (const headers of [{}, { authorization: 'Bearer fel' }, { authorization: SECRET }]) {
      const res = fakeRes();
      await handler({ method: 'GET', headers }, res);
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { ok: false, error: 'unauthorized' });
    }
  });

  test('nekar allt om CRON_SECRET saknas eller är för kort', async () => {
    for (const secret of [undefined, 'kort']) {
      const { handler } = handlerWith({ env: { ...env, CRON_SECRET: secret } });
      const res = fakeRes();
      await handler({ method: 'GET', headers: { authorization: `Bearer ${secret}` } }, res);
      assert.equal(res.statusCode, 401);
    }
  });

  test('GET kör dygnsfönstret och svarar utan analysdata', async () => {
    const { handler, calls } = handlerWith();
    const res = fakeRes();
    await handler({ method: 'GET', headers: auth }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(calls.range, { start: '2026-10-03', end: '2026-10-10' });
    assert.equal(res.body.ok, true);
    assert.equal(res.body.trigger, 'cron');
    assert.deepEqual(Object.keys(res.body).sort(), ['daysWithData', 'days', 'ok', 'range', 'rows', 'runId', 'trigger'].sort());
  });

  test('POST kör backfill för angivet intervall', async () => {
    const { handler, calls } = handlerWith();
    const res = fakeRes();
    await handler({ method: 'POST', headers: auth, body: { from: '2026-09-01', to: '2026-09-07' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.trigger, 'backfill');
    assert.deepEqual(calls.range, { start: '2026-09-01', end: '2026-09-07' });
  });

  test('ogiltigt backfill-intervall ger 400 utan databas- eller Google-anrop', async () => {
    const { handler, pool, calls } = handlerWith();
    const res = fakeRes();
    await handler({ method: 'POST', headers: auth, body: { from: '2026-10-01', to: '2026-10-12' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(pool.log.length, 0);
    assert.equal(calls.dimensions.length, 0);
  });

  test('andra metoder ger 405 och saknad konfiguration 500', async () => {
    const { handler } = handlerWith();
    let res = fakeRes();
    await handler({ method: 'DELETE', headers: auth }, res);
    assert.equal(res.statusCode, 405);

    const { handler: h2 } = handlerWith({ env: { CRON_SECRET: SECRET } });
    res = fakeRes();
    await h2({ method: 'GET', headers: auth }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body.missing.sort(), ['ANALYTICS_DATABASE_URL', 'GSC_SITE_URL']);
  });

  test('misslyckad synk ger 502 (så att cron markeras som fel) och loggas i sync_runs', async () => {
    const { handler, pool } = handlerWith({
      fetchDimension: async () => { throw Object.assign(new Error('Search Console svarade 500'), { code: 'gsc_api_error' }); },
    });
    const res = fakeRes();
    const orig = console.error;
    console.error = () => {};
    try {
      await handler({ method: 'GET', headers: auth }, res);
    } finally {
      console.error = orig;
    }
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'gsc_api_error');
    assert.match(sqlOf(pool, 'pool').at(-1), /status = 'failed'/);
    assert.equal(wrote(pool), false);
  });

  test('autentiseringsfel loggas också i sync_runs', async () => {
    const { handler, pool } = handlerWith({
      getAccessToken: async () => { throw Object.assign(new Error('Google svarade 403'), { code: 'google_auth_failed' }); },
      fetchDimension: undefined,
    });
    const res = fakeRes();
    const orig = console.error;
    console.error = () => {};
    try {
      await handler({ method: 'GET', headers: auth }, res);
    } finally {
      console.error = orig;
    }
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.error, 'google_auth_failed');
    assert.match(sqlOf(pool, 'pool').at(-1), /status = 'failed'/);
  });
});
