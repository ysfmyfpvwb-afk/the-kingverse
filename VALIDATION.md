# The Kingverse 1.5.1 — validation

Checked locally on 25 October 2026. This is an English-first structure/data batch. Further Dutch development and image research have been deferred at the user's request. Existing Dutch behavior remains available.

## Automated checks

- JavaScript syntax checked for `app.js`, `about.js`, `catalog.js` and `media.js`.
- 26 Node tests pass. They cover original-work preservation, stable work/view/edition identities, source-scope coverage, serial-publication consolidation, unique story membership, collection artwork by language, standalone-publication rules, approved artwork, contributor roles, collaborations filtering, remake collisions, date precision, cross-language/exact-title search, a shared search submission action, quality-report counts, image-error behavior, Tower links, secondary collection filters and the English default shell.
- Generated output is checked for deterministic rebuilds from the committed factual snapshots.
- Raw original 1.4 import is preserved separately from the original 1.4 view data. Imported works survive corrected titles/aliases and documented consolidation.

## Browser checks

- Library, Stories, Adaptations and Dark Tower catalog pages load. Hash URLs retain query/filter/sort state; a detail URL survives reload. Browser Back returned from a collection detail to the previous story query.
- The English story page resolves the exact title `1408` to one record, displays the Everything's Eventual collection edition, and links both recorded collections plus the 2007 adaptation.
- The visible search button, Enter and live input execute the same search action. Searches by titles in the other language, co-author names and collection titles work. A complete exact title takes precedence over incidental matches in a collection edition's marketing subtitle.
- Collaborations filtering and searches for Peter Straub and Owen King return the correct works. Sleeping Beauties details identify Stephen King and Owen King separately; an English edition remains available as a marked fallback in the retained Dutch interface.
- Carrie (2026) opens its distinct series details with the retained current studio-sourced metadata. Other remakes retain separate identities; the shared Firestarter URL cannot copy 2022 credits/artwork to 1984.
- A Dinky Earnshaw search opens the explicitly sourced Everything's Eventual connection and direct links to its story and The Dark Tower.
- The English Sources & Method page opens from the header, explains the source hierarchy and verification limits, and links back to the catalog pages.
- Keyboard Escape closes details. The modal stays within the iPhone viewport.
- Responsive checks: iPhone 390 × 844 (two columns; search button about 104 px wide), iPad 768 × 1024 (three columns), desktop 1440 × 1000 (five columns). Catalog and Sources page had no page-wide horizontal overflow in the checked views.
- No JavaScript console errors were observed in the tested English flows. Earlier bilingual regression checks were retained; further NL visual/content refinement is not claimed complete.

## Evidence limits

Title/type inventory comparison is distinct from independent first-publication research. The quality report identifies open fields, source conflicts and the derivative/short-film groups not exhaustively audited. Brooks was checked through publisher/library metadata, not through a complete authorized text. Image approval performed before the priority change remains recorded; no additional image research is required to complete this structure batch.

Push and GitHub Pages publication are verified after committing. Their actual result is reported in the delivery message; this file does not claim deployment succeeded before it happened.

## 1.5.1 focused verification

The four supplementary adaptation records have exact title/year keys and per-field sources. Added tests check distinct Carrie directors, series showrunner roles, resolved source works, IMDb IDs, cached-score dates, unavailable ratings and description rendering. JavaScript/Python syntax and whitespace checks passed. Catalog/report rebuilding is deterministic and existing media mappings remain identical. Browser checks opened the English Haven details, its linked Colorado Kid record and reverse adaptation link; the four updated detail routes display their credits, score state and release precision. Earlier 1.5 responsive checks above describe the previous batch, not newly repeated checks.


## Batch 06 / 1.8 — readiness en lokale media

Na de bestaande catalogus- en schaduwgeneratie: `npm run build:media`, `npm run build:readiness`, `python3 scripts/report_quality.py`, `npm run report:migration`, alle drie validators (`validate:foundation`, `validate:shadow`, `validate:readiness`) en `npm test`. Gewone builds en tests zijn offline; geen nieuw npm-pakket. Controleer syntax en `git diff --check`.

`data/readiness/batch-06-baseline.json` bewaakt 69 bestaande bestanden, inclusief de volledige schaduwdataset en publieke fixture. De readinessvalidator controleert bronmetadata, zekerheid, getypeerde referenties, duplicaten, standaard-/plotgrenzen, media-eigenaars, toestemmingspoort, lokale paden/integriteit en actuele gegenereerde bestanden. De suite bevat ook een vertraagd plotverzoek dat na navigatie niet alsnog mag onthullen. Nieuwe kunstmatige bronrelaties of beeldtoestemmingen zijn geen oplossing voor falende controles.

De geïsoleerde browsertest wordt met `npm run build:readiness-fixture -- --out /tmp/kingverse-b06-integration` buiten de repository gebouwd. Serveer die map alleen op localhost; testpad `/the-kingverse/readiness/` controleert subpaden. Geen gegenereerde test-HTML in de publieke Explorer plaatsen. Test 390/768/1440 px, de zes vastgelegde integratiecases, keyboard/bronuitklappers, expliciete spoilerfetch en reset, echte afbeeldingsuitval, en gerichte regressie van de ongewijzigde app/preview. Zie `EXPLORER-READINESS.md` voor verificatiegrenzen en acceptatiepoorten.


## 1.9 — Explorer-pilot

Voer na de bestaande generatie `npm run build:pilot`, `python3 scripts/report_quality.py` en `npm run report:migration` uit. Alle vier validators (`validate:foundation`, `validate:shadow`, `validate:readiness`, `validate:pilot`) en `npm test` vormen de releasepoort. Controleer JavaScript/Python-syntax en `git diff --check`; een tweede build moet dezelfde bytes opleveren.

De pilotvalidator beschermt 176 eerdere bestanden, alle 546 detailingangen en hun paginaverwijzingen, de 94 oorspronkelijke verbindingen, exacte bronmetadata, de 48-KiB-limiet en de standaard-/plotgrens. De tests controleren zoekalternatieven, alle acht typen, trilogy/edities/bundels/remakes, paginering, negatieve datacorruptie en de echte client met vertraagde netwerkantwoorden, gate/reset en afbeeldingsuitval. De browseracceptatie is afgebakend in [PILOT-ACCEPTANCE.md](PILOT-ACCEPTANCE.md): 390/768/1440 px, keyboard, bronnen, filters, directe links, terug/refresh en regressies. Een browserviewport is geen fysieke iPhone- of VoiceOver-test.
