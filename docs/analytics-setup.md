# Studio Klaro Analytics – installation

Daglig hämtning av Google Search Console-data till Supabase (projektet
**Studio Klaro Analytics**, `fqvptjqqcemjcwyonikj`, eu-west-1). Allt körs som en
Vercel-funktion i det här repot. Hemsidans frontend, Klaro OS och Galleri 86
berörs inte.

```
Vercel Cron (1 gång/dygn)
  → GET /api/cron/gsc-sync   (Bearer CRON_SECRET)
      → Vercel OIDC-token → Google STS → servicekontot (webmasters.readonly, 10 min)
      → Search Console API (final data, D-10…D-3)
      → Supabase-pooler som analytics_writer → schema analytics (en transaktion)
```

## Garantier

- **Misslyckad synk blir aldrig noll trafik.** Allt hämtas och valideras innan
  något skrivs. Skrivningen är en enda transaktion. En dag finns i
  `analytics.gsc_sync_days` först när hela hämtningen lyckats; en saknad dag
  betyder alltså "okänd", inte "0 klick".
- **Tomt svar efter nyligen registrerad trafik behandlas som fel**
  (`suspicious_empty_response`).
- **Dubblettskydd:** primärnycklar per (property, search_type, datum, dimension),
  fönstret ersätts atomiskt, och en advisory lock stoppar parallella körningar.
- **Googles fördröjning:** bara `dataState: final`, och fönstret slutar 3 dagar
  före idag. De senaste 8 dagarna hämtas om varje dygn så att sena justeringar
  rättas.
- **Jämförelser kräver kompletta perioder:** `analytics.compare_periods(...)`
  avbryter om någon av de 14 dagarna saknas i `gsc_sync_days`.
- **Inga svar innehåller analysdata.** Endpointen returnerar bara status och
  radantal, och den kräver `CRON_SECRET` (stängd om hemligheten saknas).

## Filer

| Fil | Syfte |
|---|---|
| `supabase/migrations/20261013000000_analytics_schema.sql` | Schema, tabeller, RLS, roller, jämförelsefunktioner |
| `supabase/tests/verify_access.sql` | Kontrollerar RLS och behörigheter (rullas tillbaka) |
| `api/cron/gsc-sync.js` | Endpoint: GET = daglig synk, POST = backfill |
| `api/_lib/gsc/{auth,client,sync,dates,db}.js` | Google-auth (WIF), API-klient, synk, datum, DB-guard |
| `scripts/verify-analytics-db.mjs` | Verifierar analytics_writer mot vald pooler |
| `tests/gsc-sync.test.mjs` | Enhetstester (offline) |
| `vercel.json` | `crons`: `30 6 * * *` (06:30 UTC, Hobby kan starta upp till 59 min senare) |

## Miljövariabler (Vercel, Production, markera som *Sensitive*)

| Variabel | Värde |
|---|---|
| `GSC_SITE_URL` | `sc-domain:studioklaro.se` |
| `GCP_PROJECT_NUMBER` | Projektnummer för *Studio Klaro SEO* (IAM & Admin → Settings) |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | t.ex. `vercel` |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | t.ex. `vercel` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `studio-klaro-gsc@studio-klaro-seo.iam.gserviceaccount.com` |
| `ANALYTICS_DATABASE_URL` | Poolerns anslutningssträng som `analytics_writer` (steg 1) |
| `ANALYTICS_DATABASE_CA` | **Obligatorisk.** Supabase rot-CA i PEM-format (steg 1.7) |
| `CRON_SECRET` | `openssl rand -hex 32`. Vercel skickar den automatiskt som Bearer till cron. |

Koden vägrar att köra mot annat än rollen `analytics_writer` och projektet
`fqvptjqqcemjcwyonikj`, så en felaktig sträng (t.ex. Klaro OS) avvisas.

---

## Steg 1 – Supabase (Studio Klaro Analytics)

1. Öppna **rätt projekt** (kontrollera ref `fqvptjqqcemjcwyonikj` i URL:en).
2. **SQL Editor** → klistra in `supabase/migrations/20261013000000_analytics_schema.sql` → *Run*.
3. Sätt lösenord för skrivrollen (använd en lång slumpmässig sträng, helst
   bara bokstäver och siffror; lagra den i lösenordshanteraren, aldrig i Git):
   ```sql
   alter role analytics_writer with password '<långt-slumpmässigt-lösenord>';
   ```
4. Kör `supabase/tests/verify_access.sql` i SQL Editor. Alla rader ska ha `ok = true`.
5. **Project Settings → Data API → Exposed schemas:** kontrollera att `analytics`
   *inte* finns med (standard är `public, graphql_public`).
6. **Connect → Transaction pooler** (port 6543, fungerar över IPv4 från Vercel).
   Kopiera strängen och ersätt användarnamnet:
   `postgresql://analytics_writer.fqvptjqqcemjcwyonikj:<lösenord>@<pooler-host>:6543/postgres`
   Använd värdnamnet exakt som dashboarden visar (det varierar per region).
   Lösenord med specialtecken måste URL-kodas.
7. **Obligatoriskt:** **Project Settings → Database → SSL Configuration →**
   ladda ner certifikatet och lägg hela PEM-innehållet i `ANALYTICS_DATABASE_CA`.
   Koden verifierar certifikatkedjan och värdnamnet och vägrar ansluta utan
   CA. Det finns ingen reserv till osäker verifiering; om verifieringen
   misslyckas avbryts körningen (fel loggas, inget skrivs).
8. Verifiera mot poolern från din dator (hemligheten skrivs inte ut):
   ```bash
   ANALYTICS_DATABASE_URL='postgresql://analytics_writer.fqvptjqqcemjcwyonikj:…@…:6543/postgres' \
   ANALYTICS_DATABASE_CA="$(cat prod-ca-2021.crt)" \
     node scripts/verify-analytics-db.mjs
   ```
   Alla rader ska börja med `OK`.

> Gratisplanen pausar projekt efter 7 dagars inaktivitet. Den dagliga synken
> räknas som aktivitet, men om synken stängs av en längre tid pausas projektet.

## Steg 2 – Google Cloud (projekt *Studio Klaro SEO*)

Ingen servicekontonyckel skapas. Vercel bevisar sin identitet med en kortlivad
OIDC-token som Google växlar mot en kortlivad access-token.

1. **APIs & Services → Library:** aktivera *Security Token Service API* och
   *IAM Service Account Credentials API* (Search Console API är redan aktivt).
2. **IAM & Admin → Workload Identity Federation → Create pool**
   - Namn/ID: `vercel`.
   - Provider: *OpenID Connect (OIDC)*, namn/ID `vercel`.
   - **Issuer URL:** `https://oidc.vercel.com/<TEAM_SLUG>` (team-slug = sökvägen i din Vercel-URL).
   - **Audience:** *Allowed audiences* → `https://vercel.com/<TEAM_SLUG>`.
   - **Attribute mapping:** `google.subject` = `assertion.sub`.
   - **Attribute condition (rekommenderas):**
     `assertion.sub == "owner:<TEAM_SLUG>:project:<VERCEL_PROJEKT>:environment:production"`
3. **IAM & Admin → Service Accounts →** `studio-klaro-gsc@…` → **Permissions →
   Grant access:** ny principal
   `principal://iam.googleapis.com/projects/<PROJEKTNUMMER>/locations/global/workloadIdentityPools/vercel/subject/owner:<TEAM_SLUG>:project:<VERCEL_PROJEKT>:environment:production`
   med rollen **Workload Identity User** (`roles/iam.workloadIdentityUser`).
   Preview-deployar får därmed ingen åtkomst.
4. Servicekontot behöver **inga** projektroller. Åtkomsten till datan ges av
   att kontot är tillagt som *Restricted*-användare på `sc-domain:studioklaro.se`
   i Search Console (redan gjort).
5. *(Valfritt, rekommenderas)* Aktivera organisationspolicyn
   `iam.disableServiceAccountKeyCreation` så att nycklar inte kan skapas av misstag.

## Steg 3 – Vercel

1. **Settings → Security → Secure backend access with OIDC federation:** *Enabled*,
   issuer-läge **Team**.
2. **Settings → Environment Variables:** lägg in tabellen ovan (Production).
3. Efter att koden godkänts och deployats: **Settings → Cron Jobs** ska visa
   `/api/cron/gsc-sync`. Använd *Run* för ett första test.
   (Cron körs bara i production-deployen.)

## Steg 4 – Första körning och backfill

Daglig synk täcker D-10…D-3. För historik (Search Console sparar ca 16
månader) körs backfill i bitar om högst 31 dagar, äldsta först:

```bash
SECRET='<CRON_SECRET>'   # sätt inte i Git eller i shell-historiken om du kan undvika det
curl -sS -X POST https://studioklaro.se/api/cron/gsc-sync \
  -H "Authorization: Bearer $SECRET" -H 'content-type: application/json' \
  -d '{"from":"2026-09-01","to":"2026-09-30"}'
```

Upprepa för varje månad. Svaret är `{"ok":true,"days":30,…}` eller ett fel med
kod (se nedan). Backfill är idempotent och kan köras om.

## Kontrollfrågor (SQL Editor)

```sql
-- Senaste körningar
select started_at, trigger, range_start, range_end, status, error_code, rows_written
  from analytics.sync_runs order by started_at desc limit 10;

-- Hur färsk är datan, och finns det luckor?
select max(date) as senaste_dag, count(*) as dagar from analytics.gsc_sync_days;

-- Veckojämförelse (A = senaste kompletta sjudagarsperioden, B = veckan före)
select * from analytics.compare_periods('sc-domain:studioklaro.se', date '2026-10-03', date '2026-09-26');
select * from analytics.compare_periods_by_dimension('sc-domain:studioklaro.se', 'query', date '2026-10-03', date '2026-09-26', 25);
```

Kör jämförelserna som `postgres` i SQL Editor; läsrollen `analytics_reader` är
`NOLOGIN` tills läsåtkomst aktiveras (se `docs/analytics-chatgpt-access.md`).

## Felkoder

| Kod | Betydelse | Åtgärd |
|---|---|---|
| `unauthorized` (401) | Fel eller saknad `CRON_SECRET` | Kontrollera Bearer och env |
| `not_configured` (500) | Miljövariabel saknas (namn listas) | Lägg in variabeln |
| `db_not_configured` | Fel roll/projekt/lösenord i `ANALYTICS_DATABASE_URL` | Se steg 1.6 |
| `no_oidc_token` | OIDC är inte aktiverat | Steg 3.1, deploya om |
| `google_auth_failed` | WIF/servicekonto fel (403/400 i meddelandet) | Kontrollera steg 2, särskilt principal och audience |
| `gsc_api_error` | Search Console nekar (403 = kontot saknas i Search Console) | Kontrollera behörighet och `GSC_SITE_URL` |
| `invalid_response`, `inconsistent_response`, `duplicate_rows` | Googles svar såg fel ut; inget skrevs | Kör om; kontakta mig om det består |
| `suspicious_empty_response` | Tomt svar trots nylig trafik; inget skrevs | Kontrollera Search Console; kör om |
| `lock_busy` | En annan synk pågår | Vänta och kör om |
| `invalid_range` (400) | Backfill-intervall ogiltigt | Max 31 dagar, till och med D-3 |

Varje körning, även misslyckade, loggas i `analytics.sync_runs`. En misslyckad
cron ger HTTP 502 och syns som fel i Vercel (Settings → Cron Jobs, Logs).

## Underhåll

- **Rotera databaslösenordet:** `alter role analytics_writer with password '…';`
  och uppdatera `ANALYTICS_DATABASE_URL` i Vercel.
- **Rotera `CRON_SECRET`:** ny hemlighet i Vercel, deploya om.
- Det finns inga Google-nycklar att rotera.
