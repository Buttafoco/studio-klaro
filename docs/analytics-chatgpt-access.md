# Säker läsåtkomst för ChatGPT (framtida steg)

**Status: dokumentation, inget är byggt.** Målet är en schemalagd
ChatGPT-uppgift som varje måndag skriver en SEO- och Growth-rapport med riktiga
siffror ur Studio Klaro Analytics. Ingen Custom GPT Action eller rapportleverans
byggs innan punkterna under "Verifiera först" är klara.

## Förutsättningar som redan finns

- Rollen `analytics_reader` (`NOLOGIN`): bara `select` på `analytics`-tabellerna
  och `execute` på `compare_periods` / `compare_periods_by_dimension`. Den kan
  inte skriva, och funktionerna vägrar jämföra perioder med saknade dagar.
- `compare_periods` räknar CTR som klick/exponeringar och position viktad på
  exponeringar. Rapporten får alltså färdiga, korrekta nyckeltal.
- RLS är på, `anon`/`authenticated`/`service_role` har inga rättigheter, och
  schemat är inte exponerat i Supabases Data API.

## Principer (gäller alla alternativ)

1. ChatGPT får **aldrig** `analytics_writer`-lösenordet, Supabase `service_role`-
   nyckeln, Google-uppgifter eller `CRON_SECRET`.
2. Ingen oautentiserad endpoint. Åtkomst kräver en dedikerad, roterbar hemlighet
   som bara kan läsa.
3. Dataminimering: aggregat och topplistor (t.ex. topp 25 sökfrågor), inte hela
   tabeller. Svaret begränsas i storlek.
4. Dataåtkomst sker via läsrollen eller färdiga funktioner, inte fri SQL mot
   skrivbara tabeller.
5. Läsaren ska kunna stängas av utan att något annat påverkas (egen hemlighet).

## Alternativ

| | A. Skicka (push) | B. Hämta via Action/app (pull) | C. Supabase MCP, read-only |
|---|---|---|---|
| Idé | Måndags-cron beräknar rapportunderlaget i SQL och lägger det i en kanal ChatGPT redan når (t.ex. e-post/Drive via anslutning) | ChatGPT anropar en skyddad, skrivskyddad endpoint som returnerar veckoaggregat | ChatGPT ansluter till Supabases MCP-server, begränsad till projektet och skrivskyddad |
| Inkommande åtkomst till databasen | Ingen | Endpoint med API-nyckel | OAuth mot Supabase |
| Hemlighet hos OpenAI | Ingen | API-nyckel för endpointen | OAuth-token |
| Risk | Låg | Medel: endpoint på internet | Medel/hög: fri SQL mot hela projektet (även `sync_runs`) |
| Kräver ny kod | Ja (rapportbyggare + leverans) | Ja (endpoint + auth + rate limit) | Nej, men ingen kontroll över frågorna |

**Rekommendation:** börja med A om ChatGPT-uppgiften kan läsa den kanalen, annars B.
C bara om uppgiften inte kan nå A eller B, och då i ett projekt som enbart
innehåller analysdata (vilket det gör).

### Så skulle B byggas säkert

- Endpoint `GET /api/analytics/weekly` (egen fil), `Authorization: Bearer <READ_TOKEN>`
  där `READ_TOKEN` är en egen hemlighet (inte `CRON_SECRET`), lagrad som hash och
  jämförd med konstant tid.
- Ansluter som `analytics_reader` (sätt `LOGIN` och lösenord först, med egen
  `ANALYTICS_READER_DATABASE_URL`) och kör bara de två jämförelsefunktionerna.
- Parametrar valideras (`week_start` måste vara en måndag och en komplett vecka);
  inga fria SQL-fragment. Om veckan inte är komplett svarar endpointen med fel,
  inte med delvis data.
- `Cache-Control: no-store`, rate limit, loggning av anrop utan data och
  möjlighet att rotera token.

## Verifiera först (innan något byggs)

1. **Kan en schemalagd ChatGPT-uppgift köras utan tillsyn mot det valda
   alternativet?** Kontrollera i din ChatGPT-plan om schemalagda uppgifter kan
   använda anslutningar/Actions/appar. Det här är inte verifierat och avgör valet.
2. **Testa med låtsasdata:** bygg en dummy-källa (en fast JSON eller ett test-
   mejl) och låt en schemalagd uppgift hämta och sammanfatta den över minst två
   måndagar.
3. **Hur lagras hemligheten hos OpenAI** och vem i kontot kan se den?
4. **Vilken data går ut?** Granska exakt fältlista och godkänn att den lämnar
   Supabase (sökfrågor kan innehålla personnamn eller företagsnamn).
5. **Felbeteende:** uppgiften ska säga "data saknas" om veckan inte är komplett,
   inte räkna på luckor.

När 1–5 är klara kan nästa steg godkännas.
