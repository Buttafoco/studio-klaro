// Kontrollerar att analytics_writer fungerar via den valda Supabase-poolern och
// har minsta möjliga behörigheter. Körs manuellt av projektägaren:
//
//   ANALYTICS_DATABASE_URL='postgresql://analytics_writer.<ref>:<lösenord>@…:6543/postgres' \
//     node scripts/verify-analytics-db.mjs
//
// Allt sker i en transaktion som rullas tillbaka, och inga hemligheter skrivs ut.
// ANALYTICS_DATABASE_CA=<PEM> är obligatoriskt: certifikatet verifieras alltid.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createPool } = require('../api/_lib/gsc/db.js');

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` – ${detail}` : ''}`);
};

const pool = createPool(process.env);
const client = await pool.connect();

async function expectDenied(name, sql) {
  await client.query('savepoint s');
  try {
    await client.query(sql);
    record(name, false, 'borde ha nekats men lyckades');
  } catch (err) {
    record(name, /permission denied|must be owner|violates row-level security/i.test(err.message), err.message);
  }
  await client.query('rollback to savepoint s');
}

try {
  await client.query('begin');

  const who = await client.query('select current_user as u, current_database() as d');
  record('ansluten som analytics_writer', /^analytics_writer(\.|$)/.test(who.rows[0].u), who.rows[0].u);

  // Skrivning fungerar (och rullas tillbaka).
  await client.query(
    `insert into analytics.gsc_daily_site (property, date, clicks, impressions, ctr, position)
     values ('__verify__', '2000-01-01', 1, 10, 0.1, 5)`
  );
  const back = await client.query(`select count(*)::int as n from analytics.gsc_daily_site where property = '__verify__'`);
  record('kan skriva och läsa analytics.gsc_daily_site', back.rows[0].n === 1);

  const run = await client.query(
    `insert into analytics.sync_runs (source, trigger, property, range_start, range_end)
     values ('gsc', 'backfill', '__verify__', '2000-01-01', '2000-01-01') returning id`
  );
  record('kan skriva analytics.sync_runs', Boolean(run.rows[0].id));

  // Det som INTE ska gå.
  await expectDenied('kan inte skapa tabeller i analytics', 'create table analytics.__verify_x (i int)');
  await expectDenied('kan inte skapa tabeller i public', 'create table public.__verify_x (i int)');
  await expectDenied('kan inte TRUNCATE', 'truncate analytics.gsc_daily_site');
  await expectDenied('kan inte läsa pg_authid', 'select * from pg_authid limit 1');
  await expectDenied('kan inte köra jämförelsefunktionen', `select * from analytics.compare_periods('x', '2000-01-08', '2000-01-01')`);
  await expectDenied('kan inte ändra roller', 'create role __verify_role');

  // Inga rättigheter utanför analytics-schemat.
  const grants = await client.query(
    `select distinct table_schema from information_schema.role_table_grants
      where grantee = current_user and table_schema not in ('pg_catalog', 'information_schema')`
  );
  const schemas = grants.rows.map((r) => r.table_schema);
  record('tabellrättigheter finns bara i schemat analytics', schemas.every((s) => s === 'analytics'), schemas.join(', '));
} catch (err) {
  record('oväntat fel', false, err.message);
} finally {
  try {
    await client.query('rollback');
  } catch (_) {}
  client.release();
  await pool.end();
}

const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `\n${failed.length} kontroll(er) misslyckades.` : '\nAlla kontroller godkända.');
process.exit(failed.length ? 1 : 0);
