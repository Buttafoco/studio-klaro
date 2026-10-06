# A/B-test: hero-CTA (`hero_cta_v1`)

Startsidans hero-knapp i formulärets steg 1. Allt annat (H1, ingress, formulär, layout) är identiskt.

| Variant | Knapptext | |
|---|---|---|
| A | Starta gratis | kontroll |
| B | Få konkreta idéer | |

## Så fungerar det

- 50/50-lottning per ny besökare (`index.html`, `HERO_AB`). Texten sätts när formuläret klonas in – ingen flimmer eller layoutförskjutning.
- Med godkänd **Statistik** sparas varianten i `localStorage` (`sk_ab_hero_cta_v1`) i 90 dagar och behålls vid återbesök. Utan samtycke sparas inget och varianten lottas per sidvisning (de besökarna mäts inte heller).
- Drar besökaren tillbaka samtycket raderas varianten.
- QA: `?ab_hero=A` / `?ab_hero=B` tvingar en variant för sidvisningen, sparas inte och skickar inga event.

## Event i GA4 (endast med godkänd Statistik)

Alla har `experiment_name = hero_cta_v1` och `experiment_variant = A|B`. Inga fältvärden eller persondata skickas.

| Event | När | Extra parametrar |
|---|---|---|
| `hero_cta_clicked` | Klick på hero-knappen (en gång per sidvisning) | – |
| `hero_form_started` | Första inmatningen i hero-formuläret (en gång per sidvisning) | – |
| `hero_step_2_opened` | Steg 2 öppnas från heron (en gång per sidvisning) | – |
| `lead_form_submitted` | Lyckat inskick från startsidans formulär | `form_location` (hero/kontakt/dock), `form_type` (genomgang/bli_kontaktad) |

`lead_form_submitted` skickas från alla startsidans formulär, eftersom hero och kontaktsektionen delar utkast – en besökare kan börja i heron och skicka längre ner. Primärt resultat = alla inskick per variant; filtrera på `form_location = hero` för en snävare bild.

## Läsa resultaten (manuellt, efter 3–4 veckor)

Engångsinställning i GA4 → Admin → Custom definitions → *Create custom dimension* (scope: Event):
`experiment_name`, `experiment_variant`, `form_location`, `form_type`.
Dimensioner samlar bara data från den dag de skapas – gör det innan testet startar.

Sedan: Explore → Free form. Rader: `experiment_variant`. Värden: *Event count* och *Total users*.
Filter: `experiment_name` exactly matches `hero_cta_v1`, `Event name` = något av de fyra eventen ovan.

Jämför per variant: inskick (primärt), samt steg 2 / påbörjat / klick. Räkna konvertering mot antal användare med `hero_cta_clicked` eller mot sidvisningar av `/`. Ingen automatisk vinnare – med låg trafik krävs ofta längre tid än 4 veckor för en säker skillnad.

## Avsluta testet

Ersätt `HERO_AB.label` i `mountLeadForm` med vinnartexten och ta bort `HERO_AB` och dess `track`-anrop. `window.klaroTrackEvent` i `src/analytics.js` kan stå kvar för framtida tester.
