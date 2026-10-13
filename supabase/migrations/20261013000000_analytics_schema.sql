-- Studio Klaro Analytics – schema för Google Search Console-historik.
--
-- Körs MANUELLT av projektägaren i Supabase-projektet "Studio Klaro Analytics"
-- (SQL Editor, som rollen postgres). Ska inte köras mot något annat projekt.
--
-- Principer
--   * Eget schema `analytics` som inte exponeras via PostgREST/Data API.
--   * RLS på alla tabeller. anon/authenticated har varken rättigheter eller policies.
--   * `analytics_writer` (skriv, används av Vercel-funktionen) och
--     `analytics_reader` (bara läs, NOLOGIN tills läsåtkomst aktiveras senare).
--   * En dag räknas bara som "täckt" i gsc_sync_days när hela hämtningen lyckats.
--     Saknade dagar betyder alltså "okänt", aldrig "noll trafik".

begin;

create schema if not exists analytics;

-- Roller --------------------------------------------------------------------
-- Lösenord sätts manuellt efteråt (se docs/analytics-setup.md). Aldrig i Git.
do $$
begin
  if not exists (select from pg_roles where rolname = 'analytics_writer') then
    create role analytics_writer login nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'analytics_reader') then
    create role analytics_reader nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

alter role analytics_writer connection limit 5;
alter role analytics_writer set statement_timeout = '60s';
alter role analytics_writer set idle_in_transaction_session_timeout = '30s';
alter role analytics_writer set search_path = analytics, pg_temp;
alter role analytics_reader set statement_timeout = '30s';
alter role analytics_reader set search_path = analytics, pg_temp;

-- Tabeller ------------------------------------------------------------------
-- Gemensam form: (property, search_type, date[, dimension]) är primärnyckel,
-- vilket är själva dubblettskyddet. ctr är en kvot (0–1), position är Googles
-- genomsnittliga position för raden.

create table if not exists analytics.sync_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null check (source in ('gsc', 'ga4')),
  trigger       text not null check (trigger in ('cron', 'backfill')),
  property      text not null,
  range_start   date not null,
  range_end     date not null,
  status        text not null default 'running'
                  check (status in ('running', 'success', 'failed')),
  rows_written  jsonb,
  error_code    text,
  error_message text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  check (range_start <= range_end)
);
create index if not exists sync_runs_started_idx on analytics.sync_runs (started_at desc);

-- Täckning: en rad per dag som hämtats KOMPLETT (alla dimensioner, dataState=final).
-- has_data=false betyder att Google svarade korrekt men inte hade några rader.
create table if not exists analytics.gsc_sync_days (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  has_data    boolean not null,
  data_state  text not null default 'final',
  run_id      uuid references analytics.sync_runs (id),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date)
);

create table if not exists analytics.gsc_daily_site (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  clicks      integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr         double precision not null check (ctr >= 0 and ctr <= 1),
  position    double precision not null check (position >= 0),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date)
);

create table if not exists analytics.gsc_daily_query (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  query       text not null,
  clicks      integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr         double precision not null check (ctr >= 0 and ctr <= 1),
  position    double precision not null check (position >= 0),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date, query)
);

create table if not exists analytics.gsc_daily_page (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  page        text not null,
  clicks      integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr         double precision not null check (ctr >= 0 and ctr <= 1),
  position    double precision not null check (position >= 0),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date, page)
);

create table if not exists analytics.gsc_daily_country (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  country     text not null,
  clicks      integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr         double precision not null check (ctr >= 0 and ctr <= 1),
  position    double precision not null check (position >= 0),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date, country)
);

create table if not exists analytics.gsc_daily_device (
  property    text not null,
  search_type text not null default 'web',
  date        date not null,
  device      text not null,
  clicks      integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr         double precision not null check (ctr >= 0 and ctr <= 1),
  position    double precision not null check (position >= 0),
  fetched_at  timestamptz not null default now(),
  primary key (property, search_type, date, device)
);

-- Dimensionsvy för jämförelser (en nyckel per dimension).
create or replace view analytics.gsc_daily_dimension
with (security_invoker = true) as
  select property, search_type, date, 'query'::text   as dimension, query   as key,
         clicks, impressions, position from analytics.gsc_daily_query
  union all
  select property, search_type, date, 'page'::text,    page,    clicks, impressions, position
    from analytics.gsc_daily_page
  union all
  select property, search_type, date, 'country'::text, country, clicks, impressions, position
    from analytics.gsc_daily_country
  union all
  select property, search_type, date, 'device'::text,  device,  clicks, impressions, position
    from analytics.gsc_daily_device;

-- Jämförelsefunktioner ------------------------------------------------------
-- Båda perioderna måste vara kompletta sjudagarsperioder där varje dag finns i
-- gsc_sync_days. Annars avbryts anropet i stället för att räkna på luckor.

create or replace function analytics._assert_complete_week(
  p_property text, p_start date, p_search_type text default 'web'
) returns void
language plpgsql
stable
set search_path = analytics, pg_temp
as $$
declare
  covered integer;
begin
  select count(*) into covered
    from gsc_sync_days
   where property = p_property
     and search_type = p_search_type
     and date between p_start and p_start + 6;
  if covered <> 7 then
    raise exception
      'Perioden % – % är inte komplett (% av 7 dagar hämtade)',
      p_start, p_start + 6, covered
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function analytics.compare_periods(
  p_property   text,
  p_a_start    date,           -- nyare period (7 dagar från och med detta datum)
  p_b_start    date,           -- period att jämföra mot (7 dagar)
  p_search_type text default 'web'
) returns table (
  a_clicks bigint, b_clicks bigint, clicks_delta bigint, clicks_delta_pct numeric,
  a_impressions bigint, b_impressions bigint, impressions_delta bigint, impressions_delta_pct numeric,
  a_ctr numeric, b_ctr numeric, ctr_delta numeric,
  a_position numeric, b_position numeric, position_delta numeric
)
language plpgsql
stable
set search_path = analytics, pg_temp
as $$
begin
  if p_a_start = p_b_start then
    raise exception 'Perioderna måste vara olika';
  end if;
  if abs(p_a_start - p_b_start) < 7 then
    raise exception 'Perioderna får inte överlappa';
  end if;
  perform analytics._assert_complete_week(p_property, p_a_start, p_search_type);
  perform analytics._assert_complete_week(p_property, p_b_start, p_search_type);

  return query
  with a as (
    select coalesce(sum(clicks), 0)::bigint as clicks,
           coalesce(sum(impressions), 0)::bigint as impressions,
           sum(position * impressions) / nullif(sum(impressions), 0) as position
      from gsc_daily_site
     where property = p_property and search_type = p_search_type
       and date between p_a_start and p_a_start + 6
  ), b as (
    select coalesce(sum(clicks), 0)::bigint as clicks,
           coalesce(sum(impressions), 0)::bigint as impressions,
           sum(position * impressions) / nullif(sum(impressions), 0) as position
      from gsc_daily_site
     where property = p_property and search_type = p_search_type
       and date between p_b_start and p_b_start + 6
  )
  select a.clicks, b.clicks, a.clicks - b.clicks,
         round(100.0 * (a.clicks - b.clicks) / nullif(b.clicks, 0), 1),
         a.impressions, b.impressions, a.impressions - b.impressions,
         round(100.0 * (a.impressions - b.impressions) / nullif(b.impressions, 0), 1),
         round((a.clicks::numeric / nullif(a.impressions, 0)), 4),
         round((b.clicks::numeric / nullif(b.impressions, 0)), 4),
         round((a.clicks::numeric / nullif(a.impressions, 0))
             - (b.clicks::numeric / nullif(b.impressions, 0)), 4),
         round(a.position::numeric, 2), round(b.position::numeric, 2),
         round((a.position - b.position)::numeric, 2)
    from a, b;
end;
$$;

create or replace function analytics.compare_periods_by_dimension(
  p_property    text,
  p_dimension   text,          -- 'query' | 'page' | 'country' | 'device'
  p_a_start     date,
  p_b_start     date,
  p_limit       integer default 25,
  p_search_type text default 'web'
) returns table (
  key text,
  a_clicks bigint, b_clicks bigint, clicks_delta bigint,
  a_impressions bigint, b_impressions bigint, impressions_delta bigint,
  a_position numeric, b_position numeric
)
language plpgsql
stable
set search_path = analytics, pg_temp
as $$
begin
  if p_dimension not in ('query', 'page', 'country', 'device') then
    raise exception 'Okänd dimension: %', p_dimension;
  end if;
  if p_limit < 1 or p_limit > 500 then
    raise exception 'p_limit måste vara 1–500';
  end if;
  if abs(p_a_start - p_b_start) < 7 then
    raise exception 'Perioderna får inte överlappa';
  end if;
  perform analytics._assert_complete_week(p_property, p_a_start, p_search_type);
  perform analytics._assert_complete_week(p_property, p_b_start, p_search_type);

  return query
  with agg as (
    select d.key,
           sum(d.clicks) filter (where d.date between p_a_start and p_a_start + 6) as a_clicks,
           sum(d.clicks) filter (where d.date between p_b_start and p_b_start + 6) as b_clicks,
           sum(d.impressions) filter (where d.date between p_a_start and p_a_start + 6) as a_impr,
           sum(d.impressions) filter (where d.date between p_b_start and p_b_start + 6) as b_impr,
           sum(d.position * d.impressions) filter (where d.date between p_a_start and p_a_start + 6) as a_pw,
           sum(d.position * d.impressions) filter (where d.date between p_b_start and p_b_start + 6) as b_pw
      from gsc_daily_dimension d
     where d.property = p_property and d.search_type = p_search_type
       and d.dimension = p_dimension
       and (d.date between p_a_start and p_a_start + 6
         or d.date between p_b_start and p_b_start + 6)
     group by d.key
  )
  select agg.key,
         coalesce(agg.a_clicks, 0)::bigint, coalesce(agg.b_clicks, 0)::bigint,
         (coalesce(agg.a_clicks, 0) - coalesce(agg.b_clicks, 0))::bigint,
         coalesce(agg.a_impr, 0)::bigint, coalesce(agg.b_impr, 0)::bigint,
         (coalesce(agg.a_impr, 0) - coalesce(agg.b_impr, 0))::bigint,
         round((agg.a_pw / nullif(agg.a_impr, 0))::numeric, 2),
         round((agg.b_pw / nullif(agg.b_impr, 0))::numeric, 2)
    from agg
   order by abs(coalesce(agg.a_clicks, 0) - coalesce(agg.b_clicks, 0)) desc,
            coalesce(agg.a_impr, 0) desc, agg.key
   limit p_limit;
end;
$$;

-- RLS -----------------------------------------------------------------------
alter table analytics.sync_runs         enable row level security;
alter table analytics.gsc_sync_days     enable row level security;
alter table analytics.gsc_daily_site    enable row level security;
alter table analytics.gsc_daily_query   enable row level security;
alter table analytics.gsc_daily_page    enable row level security;
alter table analytics.gsc_daily_country enable row level security;
alter table analytics.gsc_daily_device  enable row level security;

-- Policies finns bara för de två analytics-rollerna. Utan policy nekas allt,
-- så anon och authenticated får inga rader även om en rättighet skulle läcka.
do $$
declare
  t text;
begin
  foreach t in array array[
    'sync_runs', 'gsc_sync_days', 'gsc_daily_site', 'gsc_daily_query',
    'gsc_daily_page', 'gsc_daily_country', 'gsc_daily_device'
  ] loop
    execute format('drop policy if exists writer_all on analytics.%I', t);
    execute format('drop policy if exists reader_select on analytics.%I', t);
    execute format(
      'create policy writer_all on analytics.%I for all to analytics_writer using (true) with check (true)', t);
    execute format(
      'create policy reader_select on analytics.%I for select to analytics_reader using (true)', t);
  end loop;
end
$$;

-- Rättigheter (minsta möjliga) ----------------------------------------------
revoke all on schema analytics from public, anon, authenticated;
revoke all on all tables    in schema analytics from public, anon, authenticated;
revoke all on all functions in schema analytics from public, anon, authenticated;
revoke all on all sequences in schema analytics from public, anon, authenticated;

-- service_role används inte av den här integrationen och får inga rättigheter.
do $$
begin
  if exists (select from pg_roles where rolname = 'service_role') then
    execute 'revoke all on schema analytics from service_role';
    execute 'revoke all on all tables in schema analytics from service_role';
    execute 'revoke all on all functions in schema analytics from service_role';
  end if;
end
$$;

grant usage on schema analytics to analytics_writer, analytics_reader;

-- Skrivrollen: bara det synken behöver. Ingen DDL, ingen TRUNCATE, inga funktioner.
grant select, insert, update on analytics.sync_runs to analytics_writer;
grant select, insert, update, delete on
  analytics.gsc_sync_days,
  analytics.gsc_daily_site,
  analytics.gsc_daily_query,
  analytics.gsc_daily_page,
  analytics.gsc_daily_country,
  analytics.gsc_daily_device
to analytics_writer;

-- Läsrollen: select och jämförelsefunktionerna.
grant select on
  analytics.sync_runs,
  analytics.gsc_sync_days,
  analytics.gsc_daily_site,
  analytics.gsc_daily_query,
  analytics.gsc_daily_page,
  analytics.gsc_daily_country,
  analytics.gsc_daily_device,
  analytics.gsc_daily_dimension
to analytics_reader;

grant execute on function
  analytics._assert_complete_week(text, date, text),
  analytics.compare_periods(text, date, date, text),
  analytics.compare_periods_by_dimension(text, text, date, date, integer, text)
to analytics_reader;

-- Framtida objekt i schemat ärver inga rättigheter till anon/authenticated.
alter default privileges in schema analytics revoke all on tables from anon, authenticated;
alter default privileges in schema analytics revoke all on functions from anon, authenticated;

commit;
