# The Kingverse 1.7 — Batch 02: individual stories and collection memberships

Peildatum: 26 oktober 2026. Basis: `61e3a840c75e0d1e774656b4fcf5ccd864c97167`. Batch 01 was schoon; beide validators en alle 64 bestaande tests slaagden vóór wijzigingen. Deze oplevering stopt na Batch 02, met één expliciet gevraagde spoilerarme trilogieaanvulling. Geen editie- of adaptatiemigratie gestart.

## Aantallen en definities

| Eenheid | Batch 02 | Cumulatief |
| --- | ---: | ---: |
| Nieuwe unieke werkidentiteiten | 170 | 241 werken |
| Collecties | 0 nieuw | 15 |
| Verhaalweergaven met identiteit, credits en bundelprojectie | 173 | 173 |
| Bestaande boekidentiteiten hergebruikt | 3 | geen dubbel werk |
| Verhaal-bundelparen | 151 | 151 |
| Verzamelde-roman/bundelparen | 4 | 4 |
| Unieke bundelrelaties | 155 | 155 |
| Bronondersteunde bundelrelaties | 150 | geen onafhankelijke bibliografische bevestiging geclaimd |
| Voorlopige bundelrelaties | 5 | aanvullende inhouds-/editiecontrole nodig |
| Geverifieerde inhoudsvolgorden | 0 | alle `order`-waarden null |
| Personen / credits | 1 / 173 nieuw | 12 / 272 |
| Editievoorbeelden / artworks / publicatie-events / adaptaties | 0 nieuw | 4 / 4 / 2 / 0 |
| Nieuwe spoilerarme reeksrelaties op aanvullende opdracht | 1 | 9 connections, waarvan acht behouden seedrelaties |

Een werkidentiteit is een geregistreerd literair werk, geen indexregel, publicatie, herdruk of opname in een andere bundel. De 173 bestaande verhaalweergaven bevatten 142 korte verhalen, 24 novellen, vijf gedichten, één essay en één scenario; drie van de novellen waren al via de bibliotheek gemodelleerd. Er blijven **256 bestaande literaire identiteiten**: 241 werken en 15 collecties. Dit is technische identiteitsdekking van de huidige catalogus, geen complete bibliografie of volledige recordmigratie.

Een membership is één uniek werk/bundelpaar. De 151 verhaalparen zijn verdeeld over 145 verhaalweergaven; zes verhalen komen in meerdere geregistreerde bundels voor. Bij 28 weergaven is geen bundel geregistreerd. Dat bewijst niet dat zij nooit gebundeld zijn. De vier extra paren betreffen de bestaande romans in The Bachman Books; zij worden niet als vier extra verhalen geteld. Bekende titels of pagina-arrayposities zijn niet als inhoudsvolgorde overgenomen. Nederlandse/Engelse editie-inhoud is niet automatisch gelijkgesteld.

## Identiteitsbeslissingen en bronclaims

Blockade Billy, Elevation en Gwendy's Button Box hergebruiken exact hun bestaande canonieke boek-ID op basis van de gedeelde legacy-workId. Er zijn geen nieuwe titelgestuurde merges. Het verhaal Hearts in Atlantis blijft een ander werk dan de gelijknamige collectie. N/N.-indexweergaven creëren geen extra werk. Drie reeds in de bron aanwezige spelling-/hoofdlettervarianten (Quitters Inc., Batman and Robin Have An Altercation, Herman Wouk is Still Alive) zijn als aliases aan hun bestaande geregistreerde verhaalidentiteit gekoppeld; de oorspronkelijke weergavetitel blijft behouden.

Alle oude Batch-01-entiteiten zijn per ID en volledige inhoudsdigest ongewijzigd. `id-register.json` blijft byte-identiek. Alleen aanvullende opaque slots staan in `batch-02-register.json`; de migrator schrijft het register niet. Nieuwe namen worden niet automatisch samengevoegd. Joe Hill krijgt één geregistreerde identiteit; Stewart O'Nan en Richard Chizmar gebruiken hun bestaande IDs. Richard Bachman wordt geen extra co-auteur. De drie gedeelde boek/verhaalweergaven krijgen geen dubbele makerscredits.

138 verhaalparen hebben een expliciete bundellink in de bewaarde officiële detailmetadata, naast de eerder gecontroleerde bundelregistratie. Een gerichte controle van de officiële inhoudsopgaven van Skeleton Crew, Nightmares & Dreamscapes en The Bazaar of Bad Dreams onderbouwt nog zeven poëzie-/essay-/scenarioparen die buiten het oude linkparserpatroon vielen. De Bazaar-inhoudsopgave verwijst daarnaast bij Under the Weather specifiek naar een mass-marketuitgave van Full Dark, No Stars. Die relatie is alleen in die betekenis ondersteund: de exacte editie/ISBN is niet gemigreerd en geen universele inhoud voor alle uitgaven of vertalingen wordt geclaimd. De vier Bachman-romans worden expliciet genoemd op de officiële Bachman Books-pagina.

De vijf bestaande secundaire koppelingen naar Stephen King Goes to the Movies blijven voorlopig: The Mangler, Children of the Corn, Rita Hayworth and Shawshank Redemption, Low Men in Yellow Coats en 1408. De officiële collectiepagina biedt geen inhoudslijst. Vooral een eventuele retiteling rond Hearts in Atlantis/Low Men vraagt editiecontrole; er is geen titelmerge uitgevoerd. De bronstatus is per membership bewaard en de twee veldclaims noemen beide eindpunten, bron en locator. Geen synopsis of verhaaltekst is gekopieerd.

De volgorde en exacte editiecontext blijven open. Alle 173 verhaalrecords behouden hun bestaande open bibliografische vragen, waaronder eerste publicatie. Nieuwe werk-/auteursclaims zijn voorlopige overdrachten; bevestiging van een membership certificeert niet het hele werk. `independentlyConfirmed` blijft false. Huidige `contentsNotMigrated`-vragen uit Batch 01 worden niet automatisch gewist: volledige collectie-inhoud inclusief overige bijdragen/edities is niet gecertificeerd.

## Expliciet gevraagde Talisman-trilogieaanvulling

Other Worlds Than These bestond al als **`wrk:000067`**. StephenKing.com identificeert het als finale van de trilogie met The Talisman en Black House; de officiële Simon & Schuster-pagina vermeldt Book #3. Het bestaande werk wordt hergebruikt, met één nieuwe expliciete `sequel_to`-relatie naar Black House (`rel:000009`). De bestaande relatie Black House → The Talisman blijft behouden.

De canonieke keten is `wrk:000001` → `wrk:000002` → `wrk:000067`. Vijf veldclaims verwijzen naar beide officiële bronnen. De nieuwe uitleg bevat alleen titel, trilogiepositie en voorganger; `spoiler.level` is `none`. Geen plotgegevens, personagefeiten, nieuwe publicatiedatum, ISBN of cover zijn overgenomen. Deze aanvulling schakelt de twee-werkenpreview niet om en creëert geen derde identiteit voor hetzelfde boek.

## Verschillenrapport en viewprojectie

`differences.json` verantwoordt alle 15.350 bladvelden van de zes bestaande DB-tabellen. Nu hebben 2.082 velden een expliciete canonieke of viewprojectiemapping; 13.268 zijn met pointer, hash en uitstelreden behouden in de ongewijzigde bron. 259 viewrecords zijn getraceerd (86 boeken + 173 verhalen), geen daarvan wordt als volledig gemigreerd record aangemerkt: publicatie-, vertaal-, editie- en andere velden zijn nog niet volledig omgezet.

`story-views.json` verwijst naar bestaande canonieke werken en membership-IDs en bewaart de huidige standaardbundelkeuze. Die keuze is een viewvoorkeur, geen bewijs van eerste publicatie. De ledger benoemt bij zulke doelen expliciet het projectieartefact en de JSON-pointer. Verhalen krijgen geen eigen afbeelding; de huidige bundelcoverfunctie blijft in de oude runtime intact, zonder nieuwe covers of editie-identiteiten toe te voegen.

`batch-02-decisions.json` bevat alle paren, bronstatussen/locators, hergebruikbeslissingen, titelvarianten en open vragen. `batch-02-review.json` documenteert de gerichte bronraadpleging en mislukte URL-varianten. De bestaande 703 indexregels en 692 gelinkte bibliografieregels zijn niet opnieuw opgehaald en blijven bronregels, geen unieke werken. De URL-vergelijking en schaduw-identiteitsdekking zijn herberekend; de onopgeloste bronregels zijn niet automatisch toegevoegd.

## Reproduceren en controle

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
npm run migrate:shadow
npm run validate:foundation
npm run validate:shadow
npm run report:migration
npm test
```

De normale migratie, rapportage en tests zijn offline. `generateShadow(root, {batch:'01'})` reproduceert de historische basis; standaard worden 01–02 opgebouwd. Beide registers, de oude inputhashes, het officiële metadatasnapshot en de gerichte review worden gecontroleerd vóór schrijven. Alle bestaande publieke bestanden, de twee-werkenfixture en de Explorer worden op byte-identiteit bewaakt.

De suite telt 73 geslaagde tests; beide validators melden geen fouten. Nieuwe controles omvatten alle 173 titels/types/auteurs en oude URLs, de drie gedeelde IDs, gelijknamig verhaal versus bundel, meervoudige memberships, standaardbundeleigenaarschap, 28 records zonder geregistreerde bundel, bronstatus en scope, ontbrekende verwijzingen/claims, dubbele paren, ongefundeerde volgorde, onjuiste auteursrollen en de spoilerarme trilogieketen. Ook de grenzen rond onveranderde edities, covers, publicatie-events en adaptaties worden getoetst. Syntaxchecks en de bestaande catalogus-/rapportgeneratoren worden uitgevoerd; geen nieuwe dependencies of betaalde diensten.

## Resterend en stopgrens

- Vijf voorlopige secondary memberships en exacte editiecontext/volgorde van alle paren vragen nadere controle.
- Volledige collectie-inhouden en 13.268 bronbladvelden zijn niet volledig canoniek gekoppeld. Eerste-publicatiegeschiedenis en vertalingen blijven open.
- 150 overige editievoorbeelden, 96 adaptaties en 17 legacy-Tower-records zijn niet gemigreerd. De ene nieuwe trilogierelatie is de expliciete menselijke aanvulling, geen start van de Tower-batch.
- Coverrechten en de eerder vastgelegde Referer-afhankelijke bronweigeringen blijven open; geen beeldonderzoek of omzeiling in deze batch.
- Geen volledige Explorer-integratie of runtimeomschakeling. Batch 03 is niet gestart.

Push, exacte commit, Pages-deployment en live-bestandscontrole worden na publicatie in het eindbericht bevestigd. De technische view-/dashboardcontrole is geen nieuwe volledige visuele audit van alle bestaande boeken, afbeeldingen of mobiele browsers.
