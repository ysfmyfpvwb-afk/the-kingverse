# The Kingverse 1.8 — huidige opleverstand na Batch 06

Batch 06 is uitgevoerd vanaf `12f14beb0abb201afc40943e98658647323cb8db`. Zie [EXPLORER-READINESS.md](EXPLORER-READINESS.md) voor de actuele scope, bron-/mediarechten, integratiecases en GO/NO-GO. Het dashboard staat op `migration-quality.html#explorer-readiness`.

De canonieke Batch-05-dataset, bestaande website en tweeboeken-Explorer blijven ongewijzigd. Een reproduceerbare testprojectie ondersteunt 546 navigeerbare entiteiten en alle 94 native relaties: standaard 540/66, afzonderlijk opt-in zes/28. 155 memberships, 291 credits, 239 publicatiewaarnemingen en 54 onzekere bronkandidaten behouden hun eigen betekenis. 355 legacyroutes zijn automatisch op hetzelfde doel gecontroleerd. 69 bestaande bestanden zijn door een digest-baseline beschermd.

De lokale mediabibliotheek inventariseert 152 bekende covers en 82 posters. Nul echte omslagen/posters hebben voldoende vastgelegde toestemming voor lokale publicatie; nul zijn gedownload. Twee originele, neutrale SVG-fallbacks zijn lokaal geregistreerd. Onbekende rechtshouders, ontbrekende toestemming en technische onzekerheid blijven expliciet.

GO voor de geïsoleerde fixture buiten de repository; voorwaardelijke GO voor een afzonderlijk geautoriseerde Engelse bibliografische fase. De bestaande renderer is nog geen consument van dit contract. Productiepayloads, bezoekersacceptatie en rollback zijn kritieke activeringspoorten. Ontbrekende beelden kunnen met expliciete placeholders worden opgevangen; onzekere bronparen mogen gelabeld of uitgesloten blijven. Dit is geen volledige veldmigratie, bibliografische volledigheidsclaim of publieke Explorer-uitbreiding. **Stop na Batch 06.**

---

## Historische oplevering Batch 05 (onderstaande cijfers en stopgrens horen bij die uitvoering)

Batch 05 is uitgevoerd vanaf `e26c74638a72a58d1cce581a0ebd1337781dafdf`. Zie [MIGRATION-BATCH-05.md](MIGRATION-BATCH-05.md) voor definities, broncontrole, tests en blokkades. Het actuele dashboard staat op `migration-quality.html#connected-universe`.

De schaduwlaag bevat 241 werken, 15 bundels, 154 edities, 239 publicatiewaarnemingen en 96 schermidentiteiten. De 155 bundellidmaatschappen en 291 makerscredits blijven afzonderlijk. Nieuw: 68 native relaties; totaal 94, met 8 personages, 2 locaties en 2 reeksen. Alle eerdere native records en aliases blijven behouden. Totaal 482 bronnen en 7.322 veldclaims.

17 Tower-bronrecords: 13 gemigreerd, 2 met bestaande relaties samengevoegd, 2 voorlopig behouden, 0 geheel afgewezen. 78 exacte adaptatie/bron-paren: 24 bevestigd, 11 voorlopig, 43 onvoldoende bewijs, 0 bewezen onjuist. Nu 38 bronondersteunde literaire bronrelaties (37 `adaptation_of`, één `inspired_by`), naast één bevestigde reeksadaptatie en twee remake-relaties. De historische Batch-04-projectie blijft bewaard; de actuele beoordeling is een afzonderlijke laag.

5.674 van 15.350 catalogusbladvelden gekoppeld; 9.676 expliciet behouden maar nog niet gekoppeld. De 17 extra koppelingen zijn Tower-zekerheidsbeoordelingen, geen claim dat alle legacy-tekst semantisch is gemigreerd. Nieuwe bronclaims zijn geen extra unieke werken.

Standaardwebsite en tweeboeken-Explorer blijven byte-identiek. Geen nieuwe afbeeldingen of rechten vastgesteld. De standaardgrafiek filtert plot/einde vóór labels en toelichtingen; openbare technische JSON is geen geheimhouding. **Stop na Batch 05.** Volledige Explorer-integratie vereist een afzonderlijke opdracht en verdere kwaliteitscontrole.

---

## Historische stand na Batch 04

Batch 04 is uitgevoerd op basis van `aede96a374a263f91357df50eadb0a5ef9a9e9e2`. Zie **[MIGRATION-BATCH-04.md](MIGRATION-BATCH-04.md)** voor de historische scope, exacte tellingen en blokkades; `migration-quality.html#screen-adaptations` is het gegenereerde dashboard.

Alle 96 legacy-schermrecords hebben een afzonderlijke canonieke identiteit: 61 films, 15 miniseries, zeven televisiefilms en 13 series. 91 zijn als uitgebracht en vijf als onbekend geregistreerd, met bron- en seizoensscope. 14 literaire relaties zijn bronondersteund, twee voorlopig; één aanvullende schermprequelrelatie blijft voorlopig. 78 overige bronkandidaten, 18 bundelcontexten en vijf oorspronkelijke scenariodelen zijn geen bevestigde adaptaties. Geen titelmerge of fictieve bronwerken.

82 bestaande posterverwijzingen zijn productiegebonden behouden; nul hebben vastgestelde hergebruikrechten en toegestane betrouwbare levering. Geen beeldbestanden, ratings of legacyomschrijvingen geïmporteerd. Drie opgeslagen scores en twee IMDb-gebaseerde omschrijvingen blijven in de oude bron ter beoordeling.

De literaire aantallen blijven 241 werken, 15 collecties, 154 edities en 239 publicatiewaarnemingen. Alle Batch-03-records/IDs, de Talisman-trilogie en 155 memberships zijn behouden. Cumulatief: 28 personen, 291 credits, 26 verbindingen, 453 bronnen en 6.864 claims. 5.657 van 15.350 DB-bladvelden zijn gekoppeld; 9.693 expliciet behouden. De aparte bewijsledgers hebben eigen, niet optelbare bibliografische noemers.

Geen volledige filmografische of bibliografische volledigheid claimen. Website, Explorer, bestaande routes en spoilerbediening blijven ongewijzigd. Deze cijfers zijn het bevroren vertrekpunt voor Batch 05. Historische opleveringen: [Batch 03](MIGRATION-BATCH-03.md), [Batch 02](MIGRATION-BATCH-02.md).

---

## Historische oplevering Batch 01 (onderstaande cijfers zijn de toenmalige stand)

# The Kingverse 1.7 — batch 01 delivery

Peildatum: 26 oktober 2026. Basis: `c230d4d4eab3bb8c8f3edfd5a3cd029ad5064d68`.

**Dit is een gedeeltelijke, gecontroleerde batch; de volledige schaduwmigratie is niet af.** De resterende semantische conversie van verhaal-, editie-, publicatie-, adaptatie- en Tower-data is te verschillend om zonder afzonderlijke controlepoort betrouwbaar als één batch af te tekenen. De eigenaar heeft expliciet toegestaan een correcte batch op te leveren met een exacte restlijst.

## A — coveronderzoek

De bestaande Engelse Talisman-cover blijft gekoppeld aan `edn:000002` via `art:000002`; Black House aan `edn:000004` via `art:000004`. De URLs zijn absoluut en verwijzen naar StephenKing.com, niet naar een verkeerd GitHub Pages-subpad. De eerdere visuele titel-/taalgoedkeuring blijft bewaard en is geen bewijs van een herpublicatielicentie.

Op 26 oktober gaven beide afbeeldingsbronnen HTTP 200, image/jpeg en een echte JPEG-signatuur zonder Referer. Met de exacte externe Explorer-URL als Referer gaven beide HTTP 403. Onder dezelfde client verschilde alleen deze header. Dit wijst op een bronbeperking afhankelijk van de verwijzende pagina en kan de uitval verklaren. De browser in deze controle laadde de Talisman-cover wel (natuurlijke breedte 255 px, zichtbaar, geen waargenomen consolefout); er is geen bewijs dat elke browser hetzelfde verzoek uitstuurt of altijd wordt geweigerd. De precieze serverconfiguratie en oorspronkelijke telefoonaanvraag zijn niet ingezien.

De bestaande 1.6.1-fallback, herstel bij succesvolle load en handmatige retry zijn al getest en blijven intact. Er is geen rechtmatige lokale kopie of alternatieve editiecover met bewezen toestemming vastgesteld. Daarom geen proxy, spiegelkopie, verwijzeronderdrukking of andere omzeiling van de weigering. De officiële werkpagina toont de afbeelding en een all-rights-reserved-notice; een poging tot een aparte terms-pagina was ontoegankelijk. Geen expliciete hotlink-/herpublicatietoestemming gevonden. De twee beelden staan in de nieuwe onderzoeksadministratie op `needs-review`, niet op toegestaan. Geen afbeeldingen zijn gedownload naar repository/publicatieartefact.

**Blokkade:** toestemming/toegestane levering vaststellen of een aantoonbaar toegestane editiecover verkrijgen. Betrouwbaarheid kan niet door de bezoeker-runtime worden gegarandeerd als de externe bron weigert. Hetzelfde risico bestaat voor andere extern geladen beelden; alleen deze twee zijn nu op netwerkgedrag onderzocht. De overige 84 Engelse bibliotheekcovers zijn niet opnieuw opgehaald of goedgekeurd. Bewijs: `data/migration/source-audit.json`.

## B — uitgevoerde migratiebatch

De aparte `data/v2-shadow/`-bundle gebruikt hetzelfde v2-schema, met een expliciet nieuw manifestscope. De foundationscope behoudt haar maximum van twee werken; de uitgebreidere bundle heeft een eigen strikte projectievalidator. De preview blijft lezen uit `data/v2/`; niets is omgeschakeld.

| Eenheid | Stand |
| --- | ---: |
| Bibliotheekidentiteiten | 86 / 86 |
| Native werken / bundels | 71 / 15 |
| Personen / makerscredits | 11 / 99 |
| Gemodelleerde literaire identiteiten | 86 / 256 |
| Bronbladvelden met canonieke mapping | 550 / 15.350 |
| Bronbladvelden behouden maar nog niet gemigreerd | 14.800 |
| Volledig gemigreerde weergaverecords | 0 |
| Editie-/covervoorbeelden uit foundation | 4 / 4 |
| Nieuwe edities, covers of adaptaties geïmporteerd | 0 |

De 65 roman-, drie novelle-, strip-, nonfiction- en fotoboekrecords behouden hun betekenis; de fotoboekclassificatie blijft als oorspronkelijke Type-waarde in de bronledger beschikbaar, terwijl het v2-werk `nonfiction` is. De 15 bundels zijn afzonderlijke collecties; The Bachman Books is `collected-novels`, Mid-Life Confidential is `contributed-collection` met onvolledige makerslijst. Bundelinhouden zijn nog niet overgezet.

Richard Bachman blijft een pseudoniem van Stephen King; `creditedAs` wordt behouden, geen tweede auteur aangemaakt. American Vampire behoudt afzonderlijke verhaallijnen voor de eerste vijf nummers en een illustrator; Nightmares in the Sky onderscheidt tekst en fotografie. De foundationcredits van King/Straub blijven beide coauthor; de expliciete transformatie van de oude King-authorrol staat in de veldledger. Andere bestaande rollen worden niet stilzwijgend naar coauthor veranderd. Nieuwe claims zijn voorlopige overdrachten van bestaande bronfeiten, niet onafhankelijk bevestigde claims.

`data/migration/id-register.json` bevat eenmalig vastgelegde opaque toewijzingen. De build leidt IDs niet af uit titel, ISBN, bron-URL of veranderlijke hashes en voegt mensen niet automatisch samen. Bekende foundation-IDs/aliases blijven behouden. Nieuwe of gewijzigde broninput stopt de build totdat de baseline en toewijzing zijn beoordeeld; het gewone script schrijft het register niet.

`differences.json` bevat voor ieder bladveld in de zes DB-tabellen een bronpointer en waardehash, plus een canoniek doel/transformatie of expliciet uitstel. Geen synopsis, IMDb-omschrijving, score of persoonlijk legacy-statusveld wordt in de ledger gekopieerd. Niet-gemigreerde informatie blijft in de byte-identieke bronbestanden staan. De ledger is een volledig verschillenoverzicht voor deze batch, geen claim dat alle velden naar v2 zijn overgezet. MEDIA en bestaande audit-/researchbestanden zijn behouden; hun inhoudelijke migratie volgt later.

## C — officiële bronvergelijking

De actuele officiële index leverde 703 regels. De gelinkte bibliografie leverde 692 regels. Alle aldus geparseerde regels zijn op exacte URL vergeleken: 346 indexregels en 183 bibliografieregels hebben een catalogus-URL-match; 86 respectievelijk 65 bronregels raken een schaduwidentiteit uit deze batch. De overige 357 respectievelijk 509 regels zijn afzonderlijk geregistreerd als onopgelost, niet als bewezen ontbrekend werk. Zij bevatten ook andere genres, edities, bijdragen en varianten. Geen titels zijn automatisch samengevoegd of toegevoegd.

De bibliografiescope omvat alleen de 692 gelinkte regels, niet de vele onverbonden tekstvermeldingen. Technische aanwezigheid van een URL bewijst geen eerste publicatie, precieze editie of onafhankelijke verificatie van het record. De 17 bestaande bibliografische conflicten zijn behouden; de drie herhaalde officiële URL-groepen worden apart getoond en niet zonder deduplicatie opgeteld. `bibliography-comparison.json` bewaart de volledige rijvergelijking. Er is geen volledige Brooks-tekst of nieuwe systematische Brooks-controle ingezien.

## D — dashboard en blokkades

Het afzonderlijke `migration-quality.html` geeft native aantallen, oorspronkelijke categorieën, edities per taal, adaptaties/statussen, bron- en conflictcijfers, veldmapping en bronrijdekking. De hoofdsite krijgt geen nieuwe standaardroute of navigatie. 145 verhalen gebruiken een bundelcover; die worden niet als ontbrekende eigen cover geteld. De aantallen zelfstandige verhaaluitgaven overlappen deels met bibliotheeknovellen. De 25 ontbrekende geregistreerde NL-covers bewijzen niet dat in die taal een zelfstandige editie bestaat. De nul ontbrekende geregistreerde EN-covers is geen beschikbaarheids- of rechtenclaim: beide onderzochte beelden weigerden verzoeken met de geteste Referer.

Vóór enige omschakeling resteren:

1. 170 overige literaire identiteiten en 173 verhaalweergaven, inclusief drie gedeelde identiteiten; gecontroleerde bundelrelaties.
2. 150 overige editievoorbeelden, taal-/vertalersgegevens, publicatiegeschiedenis en seriële delen; editiegebonden beeldkoppelingen en afzonderlijke rechtenbeslissingen.
3. 96 adaptaties, exacte remake-identiteiten, makersrollen, bronwerken, distributie en statusonzekerheid. Bestaande IMDb-hergebruikvragen blijven `needs-review`; geen nieuwe scores/omschrijvingen geïmporteerd.
4. 17 oorspronkelijke Tower-bronrecords, getypeerde eindpunten en veldgerichte onderbouwing. De acht seedrelaties zijn een andere noemer; zeven hebben alleen bronondersteunde geselecteerde claims, nul nieuw onafhankelijk geverifieerde relaties.
5. Alle overige libraryvelden, auditconflicten, onopgeloste officiële bronregels en volledige oude/nieuwe runtimeprojectie. Pas na verliesloze vergelijking, spoilercontrole, rechtenbeslissingen en regressietests kan aansluiting van de volledige Explorer worden overwogen.

## E — reproduceren en verifiëren

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
npm run migrate:shadow
npm run validate:shadow
npm run report:migration
npm run validate:foundation
npm test
```

Online onderzoek is afzonderlijk: `python3 scripts/audit_migration_sources.py`. De gewone migratie, rapportage, validator en tests doen geen netwerkverzoeken en gebruiken geen nieuwe npm-dependencies.

De volledige suite telt 64 geslaagde tests. De shadow- en foundationvalidators geven geen fouten. Tests bewaken determinisme, volledige veldledger, baselinewijzigingen, ID/alias/creditcorruptie, Bachman, bundelclassificatie, makerrollen, eerlijke noemers en byte-identieke app/Explorer/fixture. Syntaxchecks worden voor alle JS/CJS/Python-scripts uitgevoerd. De twee bestaande catalogus-/rapportgeneratoren laten de actieve bestanden en auditcijfers ongewijzigd.

Browsercontrole omvat de bestaande live coverstatus en de afzonderlijke kwaliteitsdashboardroute; de schaduwmigratie raakt geen bestaande UI-code. Dit is geen nieuwe volledige controle van alle oude routes, alle afbeeldingen, alle schermlezers of alle mobiele browsers. Push-, deployment- en live-bestandsstatus worden pas in de definitieve oplevering na controle bevestigd.


## 1.9 — Explorer Integration Pilot

De afzonderlijke publieke route is `/explorer/pilot/`, gebouwd op Batch 06 (`1bf82bb232d9f8e0f4ad8dd08724883ffa9b3c76`). Geen nieuwe migratie: dezelfde 546 identiteiten, 66 standaardrelaties en 28 plotrelaties. Alle canonieke schaduwdata en oude runtimebestanden zijn ongewijzigd. Makerscredits, bundellidmaatschappen, editievoorbeelden en onbevestigde adaptatiebronnen blijven afzonderlijk gekwalificeerd.

Oplevering: een Engelse mobiele ontdekkingservaring voor acht entiteitstypen, directe trilogienavigatie, bron- en onzekerheidslabels, begrensde payloads, luie zoekindex, gepagineerde lijsten en expliciete spoilerbediening. Zie [PILOT-ACCEPTANCE.md](PILOT-ACCEPTANCE.md) en [het dashboard](migration-quality.html#explorer-pilot). `npm run build:pilot` genereert de publieke bestanden; `npm run validate:pilot` bewaakt reproduceerbaarheid, bronbehoud, verwijzingen, scope en eerdere bestanden.

Publicatie wordt na commit apart gecontroleerd op de juiste SHA en live bestanden. De uitslag staat in het opleverbericht. De pilot vervangt de oorspronkelijke Explorer of standaardwebsite niet; verdere uitrol vereist een nieuwe afgebakende opdracht.


## 1.9.1 — presentatieverfijning, geen migratie

Dezelfde 546 identiteiten en 94 relaties blijven behouden. Uitsluitend de pilotpresentatie, payloadverdeling, tests en documentatie zijn verfijnd; canonieke records, registers, standaardapp en oorspronkelijke preview blijven ongewijzigd. Zie [EXPERIENCE-REFINEMENT.md](EXPERIENCE-REFINEMENT.md) voor scope en beperkingen. Publicatie en live acceptatie worden na de commit apart gecontroleerd en in het opleverbericht gerapporteerd.
