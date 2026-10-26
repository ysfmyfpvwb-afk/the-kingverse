# The Kingverse 1.7 — Batch 03: Publications, Editions & Cover Provenance

Peildatum: 26 oktober 2026. Basis: `82edfb3f865256e591c530e25ed2d774b752f45c`. Alleen de afzonderlijke schaduwlaag is uitgebreid. De applicatie 1.5.1, alle bestaande routes, de Explorer, spoilerbediening en `data/v2/` blijven byte-identiek. Batch 04 is niet gestart.

## Omvang en definities

| Onderdeel | Nieuw in Batch 03 | Cumulatief | Betekenis |
| --- | ---: | ---: | --- |
| Literaire werken / bundels | 0 / 0 | 241 / 15 | Alle identiteiten, ook `wrk:000067`, blijven behouden. |
| Editievoorbeelden | 150 | 154 | 86 EN, 68 NL; een voorbeeld identificeert niet noodzakelijk een bepaalde druk. |
| Publicatiewaarnemingen | 237 | 239 | Geregistreerd onderwerp + gebeurtenistype + datum + eventuele verschijningsvormtitel. |
| Editiegebonden covermetadata | 148 | 152 | Alleen bestaande URLs/metadata, geen nieuwe beeldbestanden of toestemming. |
| Bronnen | 76 | 338 | Bestaande bron-URLs, niet opnieuw integraal online gecontroleerd. |
| Veldclaims | 2.594 | 4.865 | Veldscope; geen recordbrede verificatieclaim. |
| Credits / bundelrelaties / verbindingen | 0 / 0 / 0 | 272 / 155 / 9 | Eerdere inhoud blijft exact behouden. |
| Adaptaties | 0 | 0 | 96 legacyrecords blijven buiten deze batch. |

Alle 150 resterende voorbeelden zijn verwerkt. Canonieke editie-IDs zijn eenmalig opaque toegewezen in `batch-03-register.json`; ISBN, titel of URL bepaalt het nieuwe ID niet. Bestaande aliases worden niet hergebonden. Iedere eerdere Batch-02-entiteit is met zijn volledige digest bevroren; de oorspronkelijke registers zijn onveranderd.

## Publicatie is niet hetzelfde als eerste publicatie of editie

De 239 waarnemingen bestaan uit 226 `source-reported-release`, zes `serial-part`, vier `edition-variant-reported-release` en drie `legacy-bibliographic-year`. De laatste twee typen expliciteren de betekenis van bestaande gegevens. `publisher` mag onbekend/null zijn. De tien verschijningsvormen bewaren hun eigen titel, bron en datumprecisie. Zij krijgen geen verzonnen ISBN, editie-ID, deelnummer of claim van eerste publicatie. Een gereviseerde/illustrated verschijningsvorm maakt geen nieuw literair werk.

De boek-/verhaalweergaven van Blockade Billy, Elevation en Gwendy's Button Box delen per paar dezelfde geregistreerde identiteit en datum; drie dubbele datumwaarnemingen zijn daarom samengevoegd. Er is geen nieuwe titelmerge. De verschillen tussen legacyjaar en officiële recorddatum van Cycle of the Werewolf (1983 / 1985-04), Dolores Claiborne (1992 / 1993-11) en The Green Mile (1996 / 2000-10) blijven expliciet onopgelost. Geen van deze observaties wordt als eerste verschijning gecertificeerd. Een maand wordt niet naar dag 01 uitgebreid.

Dertig verhaalweergaven hebben geen bronrecorddatum. Bij 147 publicatiewaarnemingen ontbreekt een uitgever; dat omvat ook de afzonderlijke jaarobservaties. Dit zijn geen ontbrekende editiedata die uit het oorspronkelijke werkjaar mogen worden ingevuld.

## Internationale edities en verificatiegrenzen

Alle 154 edities bewaren titel, taal, ISBN of expliciet ontbrekend ISBN, bron, werkbinding en legacy-ID. De 68 NL-ISBNs hebben een geldige checksum en zijn onderling uniek; de 86 EN-voorbeelden hebben geen bevestigd ISBN. Dit zijn vaak oorspronkelijke covervoorbeelden, geen bewezen eerste drukken. Bij alle 154 blijven specifieke editiedatum, uitgever, formaat en druk onbekend; NL-vertalers zijn niet ingevuld zonder bewijs. De uitgever van een werkpublicatie wordt niet automatisch de uitgever van een latere editie.

Het bewaarde `data/reference/dutch.json` ondersteunt bij 66 NL-voorbeelden exact titel, ISBN en taal (`nl-NL`). De overige twee, Carrie en Christine, missen in dat snapshot de exacte uitgeversvergelijking; bestaande gegevens blijven voorlopig behouden. Er is geen nieuwe vertaling verzonnen. De vier foundationrecords worden niet aangepast; hun aanvullende vergelijkingsscope staat in `edition-views.json`. Dat bestand geeft per canoniek onderwerp en taal de editievoorbeelden, bronvelden en open vragen. Het selecteert nog geen editie in de Explorer.

66 verschillende canonieke onderwerpen hebben hiermee een editie met deze drie bronondersteunde identiteitsvelden. **Nul volledig geverifieerde druk-/editiegeschiedenissen**; 66 is geen volledige editiecertificering. Vijf bestaande NL-ISBNvoorbeelden behoren aan afzonderlijke verhalen buiten de bibliotheekweergave (The Mist, A Good Marriage, Mile 81, In the Tall Grass, Throttle). Hun uitgeversmetadata blijft behouden; er worden geen eigen covers voor bundel-only verhalen verzonnen. Co-auteurs, Bachman-pseudoniem en meervoudige bundelrelaties blijven exact behouden, zonder automatisch een bundelinhoud aan een Nederlandse editie toe te kennen.

## Coverherkomst, rechten en levering

`artworks` bewaart de bibliografisch bekende, editiegebonden beeldverwijzing. Het afzonderlijk geschematiseerde `cover-provenance.json` bevat voor **iedere editie** een beleidsbeslissing: originele URL, herkomst, rechtenstatus/bewijs, beschikbaarheid/bewijsdatum, leveringsstatus, eventuele toegestane lokale asset en placeholderfallback. Dit overlay voorkomt dat bestaande fixture-/Batch-02-records stilzwijgend veranderen. `validate_cover_provenance.cjs` controleert schema, eigenaarschap, volledigheid en de toestemmingspoort. De live renderer gebruikt deze schaduwlaag nog niet.

- 152 bekende covers; twee edities zonder geregistreerde cover: Het verloren rijk (`9789021053653`) en Lisey's verhaal (`9789021030098`). Afwezigheid van een geregistreerde cover bewijst niet dat er geen omslag bestaat.
- **0 covers met vastgestelde hergebruiktoestemming; 0 goedgekeurd voor betrouwbare toegestane weergave; 0 goedgekeurde lokale beeldbestanden.**
- Twee bestaande EN-covers hebben eerder vastgelegde Referer-afhankelijke weigeringen (HTTP 403 tegenover 200 zonder Referer). Die observatie blijft aan bron en datum gekoppeld; geen nieuwe netwerkproef, omzeiling, proxy of verwijzeronderdrukking.
- De overige 150 bekende verwijzingen zijn niet opnieuw op actuele levering gecontroleerd. Historische visuele goedkeuring of HTTP 200 is geen licentie of huidige beschikbaarheid.
- De fallback is expliciet een placeholderbeslissing, geen alternatief extern beeld. Nieuwe weergave blijft geblokkeerd zolang rechten en levering niet zijn onderbouwd. Geen beelden gedownload of nieuw gepubliceerd.

## Reproduceerbaarheid en veldverantwoording

`migrate_shadow.cjs` bouwt standaard 01–03; `{batch:'01'}` en `{batch:'02'}` reproduceren de historische projecties. `migrate_publications.cjs` verwerkt uitsluitend vastgelegde bronnen en toegewezen slots; gewijzigde inputhashes stoppen de migratie. Het register genereert zich niet opnieuw tijdens een build. Er zijn geen nieuwe dependencies, APIs, abonnementen of secrets.

`differences.json` bevat 15.350 DB-bladvelden: **4.058 gekoppeld**, **11.292 expliciet behouden maar nog niet canoniek gekoppeld**. Een mapping naar bronclaim of coverbeleid is als zodanig gemarkeerd (`@source` / `@coverProvenance`), niet als native editieveld voorgesteld. De 259 boek-/verhaalweergaven en 154 editievoorbeelden hebben verschillende noemers; zij worden niet opgeteld als unieke werken of volledig gemigreerde records.

Aanvullend verantwoordt `batch-03-source-fields.json` 6.600 bladvelden uit vijf bronbestanden/scopes: 1.160 gekoppeld, 5.440 behouden. Alle 912 covermetadata- en 50 verschijningsvormvelden zijn gekoppeld; 198 van 1.376 Nederlandse referentievelden zijn gekoppeld. De overige 1.178 referentievelden en alle 2.605 historische beeldreview- en 1.657 fetchvelden blijven op hun originele plek met hash behouden. Dit zijn deels herhaalde bewijzen, geen extra unieke feiten. `media.js`-scope betreft alleen `covers`, niet posters of andere weergavemetadata. Brondata wordt niet gewist; snapshots worden niet als nieuwe volledige bronraadpleging gepresenteerd. Brooks is in deze batch niet opnieuw geraadpleegd.

## Controles, publicatie en resterend werk

Uitvoeren:

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
npm run migrate:shadow
npm run validate:foundation
npm run validate:shadow
npm run report:migration
npm test
```

82 automatische tests slagen, inclusief negen nieuwe controles voor alle editie-aliases/ISBNs/talen, precieze bronveldscope, publicatiesemantiek/deduplicatie, serials, foutieve ISBNs/verwijzingen/talen, covereigenaarschap, ontbrekende covers, de rechtenpoort, aanvullende veldledgers en het volledige behoud van Batch 02. Syntax en byte-identiteit van publieke runtime/Explorer/fixture worden gecontroleerd. De validators en gewone builds zijn offline. Het dashboard is lokaal visueel gecontroleerd op 390, 768 en 1440 px: tabellen blijven binnen scrollbare, focusbare regio’s zonder pagina-overloop. De bestaande app is kort gecontroleerd op EN/NL, live zoeken, zoekknop, Enter, samenwerkingenfilter, detailopening per toetsenbord en bestaande afbeeldingsfallback. In de ongewijzigde Explorer zijn filter, expliciete spoilerbediening en toetsenbordnavigatie naar Black House met spoilerreset bevestigd. Dit is geen volledige nieuwe audit van iedere cover of mobiele browser. Live-verificatie en exacte commit/deploymentstatus worden bij oplevering afzonderlijk gerapporteerd.

De wereldwijde bibliografie blijft onvolledig onderzocht: 703 indexregels en 692 gelinkte bibliografieregels zijn bronregels, geen unieke werken. De technische migratie van alle 154 bestaande voorbeelden bewijst geen wereldwijde editiedekking. Vijf secundaire memberships, inhoudsvolgorden, editie-/vertaalgeschiedenis, coverrechten, drie jaarconflicten, overige bronvelden, 96 adaptaties en 17 Tower-records blijven open. Geen volledige catalogus-/Exploreromschakeling. **Stop na Batch 03; Batch 04 vereist een volgende opdracht.**
