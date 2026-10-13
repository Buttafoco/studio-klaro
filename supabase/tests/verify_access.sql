-- Verifierar åtkomstkontrollen i Studio Klaro Analytics.
-- Körs EFTER migrationen i Supabase SQL Editor (som postgres). Ändrar ingenting
-- bestående: allt sker i en transaktion som rullas tillbaka.
--
-- Förväntat resultat: varje rad i resultatet ska ha ok = true.

begin;

create temp table _checks (name text, ok boolean);
grant all on _checks to public;

-- 1. RLS är på för alla tabeller i schemat.
insert into _checks
select 'rls enabled: ' || c.relname, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'analytics' and c.relkind = 'r';

-- 2. anon/authenticated/service_role saknar rättigheter på schemat och tabellerna.
insert into _checks
select format('no %s access: %s', r.rolname, c.relname),
       not has_table_privilege(r.rolname, format('analytics.%I', c.relname), 'select,insert,update,delete')
  from pg_roles r
  cross join (select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'analytics' and c.relkind in ('r', 'v')) c
 where r.rolname in ('anon', 'authenticated', 'service_role');

insert into _checks
select format('no %s schema usage', r.rolname),
       not has_schema_privilege(r.rolname, 'analytics', 'usage')
  from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role');

-- 3. Skrivrollen: rätt rättigheter, inte mer.
insert into _checks values
  ('writer can insert site',        has_table_privilege('analytics_writer', 'analytics.gsc_daily_site', 'insert')),
  ('writer cannot truncate site',   not has_table_privilege('analytics_writer', 'analytics.gsc_daily_site', 'truncate')),
  ('writer cannot create in schema', not has_schema_privilege('analytics_writer', 'analytics', 'create')),
  ('writer cannot create in public', not has_schema_privilege('analytics_writer', 'public', 'create')),
  ('writer is not superuser',       not (select rolsuper from pg_roles where rolname = 'analytics_writer')),
  ('writer does not bypass rls',    not (select rolbypassrls from pg_roles where rolname = 'analytics_writer')),
  ('reader cannot login',           not (select rolcanlogin from pg_roles where rolname = 'analytics_reader')),
  ('reader cannot write',           not has_table_privilege('analytics_reader', 'analytics.gsc_daily_site', 'insert,update,delete'));

-- 4. Jämförelsefunktionerna är inte körbara för PUBLIC/anon/authenticated.
insert into _checks
select 'function not public: ' || p.proname,
       not has_function_privilege('anon', p.oid, 'execute')
       and not has_function_privilege('authenticated', p.oid, 'execute')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'analytics';

select name, ok from _checks order by ok, name;

rollback;
