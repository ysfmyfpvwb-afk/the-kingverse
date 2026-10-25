# The Kingverse 1.6 — Foundation oplevering

Peildatum: 25 oktober 2026. Basis vóór deze wijziging: `a8fde6da35233673e57685b61f447c5d97b82c18`. De foundation staat naast de bestaande site; de actieve runtime en catalogus blijven versie 1.5.1.

## Gebouwd

- Draft 2020-12 JSON Schema voor werken/verhalen, bundels/inhoud, edities/vertalingen, covers/posters, personen/credits, adaptaties, personages, locaties, relaties, publicatiegebeurtenissen, bronnen en claims.
- Permanente opaque IDs zoals `wrk:000001`, onafhankelijk van titels, namen, ISBN’s of URL’s. Een apart register bewaart de oude werk-, boek-, editie-, cover-IDs en detailhashes als aliases.
- Read-only validator met Ajv 8.20.0, een vastgepinde ontwikkelafhankelijkheid. Geen npm-code in de browser.
- Read-only compatibiliteitsadapter voor oude IDs/URL’s en een projectie van de gemigreerde feiten naar bestaande viewcontracten. De actieve router is niet vervangen.
- Rights-reviewadministratie voor de vier bestaande IMDb-objecten en bijgewerkte permanente projectafspraken. Geen betaalde API, account of key geactiveerd.

## Beperkte migratie

| Legacywerk | Nieuw canoniek ID |
| --- | --- |
| `work:the-talisman` / `books:the-talisman` | `wrk:000001` |
| `work:black-house` / `books:black-house` | `wrk:000002` |

De losse tabellen in `data/v2/` bevatten 2 werken, 4 editievoorbeelden, 4 covers, 2 personen, 4 co-auteurscredits, 2 personages, 1 locatie, 8 relaties, 5 bronnen, 113 veldclaims en 2 publicatie-events. Stephen King en Peter Straub zijn beiden co-auteur van beide werken. Black House is expliciet als vervolg gekoppeld. Nederlandse en Engelse editievoorbeelden en hun bestaande covers zijn behouden; onbekende EN-ISBN’s, druk, datum en vertaler zijn niet ingevuld.

Twee externe verwijzingen lossen bestaande Tower-werken op in de ongewijzigde catalogus; die werken zijn niet als extra v2-werk geïmporteerd. Bundel- en adaptatietabellen blijven leeg omdat deze proef geen bewezen bundelinhoud of betrouwbaar actuele adaptatieprojecten toevoegt. Hun schema’s en domeinregels worden met synthetische testrecords getoetst. De echte relaties zijn expliciet of het reeds bestaande, als voorlopig geclaimde sterk geïmpliceerde kosmologieverband. Interpretatief wordt als afzonderlijke zekerheid ondersteund en getest; er is geen nieuwe theorie verzonnen om dat label in de echte proef te vullen.

De oorspronkelijke import, snapshots, gehele legacycatalogus en persoonlijke legacyvelden blijven intact. Niet-overgezette legacyvelden worden niet uit hun oorspronkelijke records verwijderd. Dit is geen volledige verliesloze catalogusmigratie; slechts de afgebakende feiten van twee werken zijn naast hun ongewijzigde origineel gemodelleerd.

## Validator en tests

```sh
npm ci --ignore-scripts
npm run validate:foundation
npm test
```

De validator gaf **valid: true, errors: []**. Hij controleert structurele schema’s, unieke getypeerde IDs/registerentries, aliasconflicten, bronclaims per inhoudelijk veld, claimwaarden en claim-eigenaren, bestaande verwijzingen, geldige rollen, auteursaanwezigheid, bundel-/editie-inhoud, realistische datumprecisie, ISBN-checksum/conflicten, relatie-eindpunten, spoilerscope, covertaal en editie-eigenaarschap. Compatibiliteitscontrole vergelijkt de geselecteerde werkfeiten, vier editie-/coverkoppelingen en oude routes met de bestaande catalogus. De manifesthashes bewijzen dat de zeven actieve runtimebestanden ongewijzigd zijn.

**43 tests geslaagd:** 26 bestaande catalogus-/runtime-regressietests en 17 nieuwe foundationtests. Negatieve gevallen omvatten ontbrekende velden/bronnen, conflicterende IDs, verkeerde relatietypen/rollen, ontbrekende entiteiten, ongeldige bundel-/editiekoppeling, ongeldige datum/ISBN, cross-remake cover-eigenaarschap en een numerieke score zonder bevestigde hergebruikstatus. Een titel/ISBN/bron-URL-correctie verandert geen canonieke identiteit. De CLI is offline/read-only en geeft bij ongeldige/missende invoer exitcode 1.

JavaScript-syntaxchecks zijn uitgevoerd voor de vier bestaande scripts en beide nieuwe modules; de bestaande Python-generatoren compileren. De bestaande catalogus- en rapportgenerator zijn uitgevoerd: de actieve catalogus, media en Sources-pagina blijven byte-identiek; alleen het kwaliteitsrapport krijgt de foundation-/rechtensectie. npm audit meldt nul bekende kwetsbaarheden voor de geïnstalleerde ontwikkeldependencies. De aanvankelijk gekozen oudere Ajv-versie is vóór oplevering vervangen door 8.20.0.

## Browserregressie

Uitgevoerd op de lokale statische server, in de echte in-app browser:

- Desktop 1440 × 1000: Engelse Talisman- en Black House-details, aanwezige EN-cover, beide auteurs en bestaande Tower-links.
- Zoeken op Peter Straub met de zichtbare zoekknop en het Collaborations-filter: drie bestaande treffers, waaronder beide proefwerken; bestaande query-/filterroute blijft functioneren.
- Mobiel 390 × 844: Nederlandse Black House- en Talisman-details, geladen Nederlandse covers en correct ISBN waar bekend. De detailbreedte blijft 390 px; geen pagina-brede horizontale overflow.
- Een opgeslagen Nederlandse taalkeuze blijft bij een URL zonder expliciete taal behouden. `?lang=en` schakelt terug naar Engels.
- Mobiele Engelse verhalenzoekopdracht 1408: één treffer met de Everything’s Eventual-bundelcover en aanklikbare bundelrelatie. Enter geeft dezelfde treffer.
- Full Dark, No Stars opent in NL als Aardedonker, zonder sterren met bestaande cover, verhalen en adaptatielinks.
- Haven-adaptatiedetails openen; de ontbrekende poster toont de bestaande stabiele placeholder. De legacy-IMDb-scoreweergave is functioneel ongewijzigd, maar haar hergebruikstatus staat apart ter beoordeling.
- Geen JavaScript-consolefouten waargenomen in deze gecontroleerde flows. Desktop en mobiel hadden geen horizontale overflow in de gemeten views.

Een extern kapot afbeeldingsverzoek is niet live geforceerd: het bestaande unit-testscenario voor een afbeeldingsfout slaagt, en ontbrekend beeld is in de browser gecontroleerd. Dit is geen hernieuwde beschikbaarheids- of rechtencontrole van alle externe beelden. Er is geen nieuwe beeldresearch gedaan.

## Huidige screen-data en open punten

De applicatie gebruikt geen OMDb of IMDb-API. Vier objecten zijn in 1.5.1 handmatig gevuld vanuit geïndexeerde IMDb-resultaten. Drie numerieke scores en twee eigen omschrijvingen op IMDb-feiten hebben geen aangetroffen toestemmingsbewijs en staan op `needs-review` in `data/reviews/screen-data-rights.json`. De twee Carrie-omschrijvingen zijn eigen tekst op andere feitelijke bronnen. De gebruiker vroeg de bestaande data voorlopig intact te houden; deze foundation kent geen toestemming toe en voegt geen IMDb-data toe aan de nieuwe adaptatietabel.

Betaalde IMDb-integratie is uit architectuur en roadmap verwijderd. Een externe IMDb-link zonder overgenomen score plus eigen tekst uit productiefeiten is de directe fallback. TMDb is alleen als mogelijk kosteloos alternatief onderzocht: toepasselijke voorwaarden, niet-commerciële geschiktheid en vereiste attributie moeten vóór gebruik zijn vastgesteld. TMDb-scores zouden als TMDb worden gelabeld. Geen account, key, abonnement, import of betaalde dienst is geactiveerd.

De broncontrole is per veld, geen onafhankelijke verificatie van de hele bibliografie. Nederlandse editievoorbeelden gebruiken bestaande uitgeverssnapshots; onbekende druk-/vertalersgegevens en eerste-publicatiegeschiedenis blijven open. Zonder opnieuw bewezen actuele status wordt geen Talisman/Black House-adaptatieproject ingevoerd.

## Volgende stap en publicatie

Volgende concrete stap: een eerste Engelse Explorer-preview voor deze twee werken op de gevalideerde v2-data, met bron-/zekerheidslabels en veilige inhoud. Oude URL’s blijven via het register herleidbaar. Die pagina en volledige catalogusmigratie zijn in deze foundation nog niet uitgevoerd.

Commit en push volgen alleen na alle kritieke checks. De werkelijke commit, Pages-deployment en live-bestandscontrole worden in het eindbericht bevestigd; deze notitie claimt geen publicatie voordat die is uitgevoerd. De ontwikkelvalidator draait lokaal; GitHub Pages hoeft geen Node/Ajv te starten. Publieke foundation-JSON bevat uitsluitend bewust publieke feiten en bronverwijzingen, zonder credentials of nieuw geïmporteerde gebruikersdata.
