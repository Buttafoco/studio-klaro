# Trafik från AI-assistenter i GA4

Sajten mäter besök från ChatGPT, Perplexity, Gemini, Claude och Copilot på två sätt:

1. **Automatiskt i GA4:s standardrapporter** – GA4 sparar redan sessionskälla
   (referrer-domän eller `utm_source`) för varje besök. `src/analytics.js` behåller
   referrer-domänen och `utm_source` när URL:er rensas, så källan följer med.
2. **Händelsen `ai_referral`** – skickas av `src/analytics.js` en gång per session när
   besökaren kommer från en AI-assistent.

| Parameter      | Värden                                                        |
| -------------- | ------------------------------------------------------------- |
| `ai_source`    | `chatgpt`, `perplexity`, `gemini`, `claude`, `copilot`        |
| `ai_match`     | `referrer` (referrer-domän) eller `utm_source`                |
| `landing_page` | Sökvägen besökaren landade på, t.ex. `/priser`                |

Domäner som känns igen:

| Källa      | Referrer / `utm_source`                         |
| ---------- | ----------------------------------------------- |
| ChatGPT    | `chatgpt.com`, `chat.openai.com`                |
| Perplexity | `perplexity.ai` (inkl. `www.`)                  |
| Gemini     | `gemini.google.com`, `bard.google.com`          |
| Claude     | `claude.ai`                                     |
| Copilot    | `copilot.microsoft.com`, `copilot.cloud.microsoft` |

Samma regler som resten av analytics gäller: inget skickas för interna användare
(`?klaro_internal=1`), inget skickas från andra domäner än produktionen, och Consent Mode
styr om cookies används.

### Verifiering hittills

Kontrollerat 2026-09-15 mot produktionsbygget lokalt. GA4-träffen (`/g/collect`) innehöll:

```
en=ai_referral&ep.ai_source=chatgpt&ep.ai_match=utm_source&ep.landing_page=%2Fpriser
```

Händelsen skickades bara en gång per session (inte igen vid omladdning). Matchningen av
alla referrer-domäner ovan är enhetstestad, och den avvisar liknande falska domäner
(t.ex. `notclaude.ai`).

Webbläsaren rapporterade HTTP 503 på träffarna från localhost, även på `page_view`, så
mottagningen hos Google gick inte att bekräfta därifrån. Testa därför i DebugView enligt
nedan innan dimensionerna skapas.

### Testa i DebugView med Google Tag Assistant

Gör testet efter att ändringen är deployad till produktion
(`https://studioklaro.se/`). Taggen skickar inte data från andra domäner, så en
Vercel Preview går inte att testa på det här sättet.

**Förberedelser**

- Stäng av annonsblockerare och privacy-tillägg (t.ex. uBlock Origin, Ghostery,
  Privacy Badger) under testet. De stoppar ofta anrop till Google Analytics, och då syns
  inget i DebugView.
- Testa på en enhet där `klaro_internal` inte är satt – annars är all spårning avstängd.
  Använd ett privat fönster, eller besök först
  `https://studioklaro.se/?klaro_internal=0` för att ta bort flaggan. Kom ihåg att sätta
  tillbaka den med `?klaro_internal=1` efter testet.
- `ai_referral` skickas bara en gång per session. Börja med ett nytt fönster om du
  redan har testat i samma session.

**Steg**

1. Öppna Google Tag Assistant: `https://tagassistant.google.com/`
2. Välj *Add domain* och anslut `https://studioklaro.se/`. Sajten öppnas i ett nytt
   fönster som är kopplat till Tag Assistant.
3. Klicka **Godkänn statistik** i cookie-bannern i det fönstret.
4. I samma fönster, gå till `https://studioklaro.se/?utm_source=chatgpt.com` så att
   händelsen utlöses med samtycke givet.
5. Öppna GA4 → **Admin → DebugView** och välj den aktuella debug-enheten.
6. Kontrollera att `ai_referral` syns och klicka på den. Parametrarna ska vara
   `ai_source = chatgpt`, `ai_match = utm_source` och `landing_page = /`.

När händelsen och alla tre parametrarna syns kan dimensionerna nedan skapas.

**Alternativ för tillfällig felsökning: `debug_mode: true`**

Om Tag Assistant inte går att använda kan en enskild sidvisning skickas med
`debug_mode: true`. `src/analytics.js` gör det när query-parametern `ga_debug` har
värdet `1` på den sida som laddas. Använd det bara tillfälligt vid felsökning.

Lägg aldrig in `debug_mode: true` permanent i gtag-konfigurationen i produktion. Då
markeras alla besökares träffar som debug-/utvecklartrafik, DebugView fylls av vanliga
besök, och om ett datafilter för utvecklartrafik är aktivt i GA4 försvinner trafiken ur
rapporterna.

## Manuell konfiguration i GA4 (krävs en gång)

### 1. Registrera parametrarna som anpassade dimensioner

GA4 → Admin → Anpassade definitioner → Skapa anpassad dimension (omfattning: *Händelse*):

- `ai_source` → visningsnamn "AI-källa"
- `ai_match` → "AI-matchning"
- `landing_page` → "AI-landningssida"

Dimensionerna börjar samla data från att de skapas, inte bakåt i tiden.

### 2. Skapa en anpassad kanalgrupp

GA4 → Admin → Kanalgrupper → Kopiera standardgruppen → Lägg till ny kanal:

- **Namn:** AI-assistenter
- **Villkor:** *Källa* matchar regex
  ```
  (chatgpt\.com|chat\.openai\.com|perplexity|gemini\.google\.com|bard\.google\.com|claude\.ai|copilot\.microsoft\.com|copilot\.cloud\.microsoft)
  ```
- Flytta kanalen **ovanför "Referral"** i listan, annars hamnar trafiken där först.

Kanalgrupper gäller även historisk data, så befintliga besök från AI-källor syns direkt.

### 3. Rapporter att följa

- **Förvärv → Trafikförvärv**, primär dimension = den nya kanalgruppen: sessioner,
  engagemang och `generate_lead` från AI-assistenter jämfört med övriga kanaler.
- **Utforska → Friform**: rader `AI-källa` + `AI-landningssida`, värde `Händelseantal`,
  filter `Händelsenamn = ai_referral`. Visar vilka sidor AI-tjänsterna skickar folk till.

## Begränsningar

- Alla AI-appar skickar inte referrer. Klick från mobilappar och vissa skrivbordsappar
  syns ofta som *(direct)* och kan inte särskiljas. Siffrorna är därför ett golv, inte
  ett exakt värde.
- Google AI Overviews / AI Mode räknas som vanlig Google-trafik (`google / organic`)
  och går inte att skilja ut i GA4. Använd Search Console för det.
- Copilot i Bing-sökningen kan komma som `bing.com` och räknas då som organisk Bing-trafik.

## Crawler-åtkomst (utanför GA4)

GA4 ser inte AI-crawlers eftersom de inte kör JavaScript. Kontrollera åtkomsten så här:

- **Vercel → Project → Firewall / Bot Management:** se till att regler för "AI Bots"
  inte blockerar (ska vara av eller *Log*). Test 2026-09-15: GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User,
  Google-Extended, Googlebot, Bingbot, CCBot och Applebot-Extended fick alla HTTP 200.
- **Vercel → Logs:** filtrera på user agent (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`,
  `PerplexityBot` m.fl.) för att se att sidorna faktiskt hämtas.
- **Google Search Console** och **Bing Webmaster Tools:** skicka in
  `https://studioklaro.se/sitemap.xml`. Copilot och ChatGPT-sök bygger delvis på Bings index.
- Snabbtest från terminalen:
  ```
  curl -s -o /dev/null -w '%{http_code}\n' -A 'Mozilla/5.0 (compatible; GPTBot/1.1)' https://studioklaro.se/priser
  ```
