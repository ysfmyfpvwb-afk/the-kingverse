# The Kingverse 1.7 — Batch 04: Film, Television & Screen Adaptations

Basis: `aede96a374a263f91357df50eadb0a5ef9a9e9e2`. Peildatum: 26 oktober 2026. Alle 96 bestaande schermrecords zijn in de afzonderlijke schaduwlaag opgenomen. De standaardsite, publieke routes, Explorer-fixture en spoilerbediening blijven byte-identiek. Geen Tower-migratie of nieuwe Explorer-functionaliteit; Batch 05 is niet gestart.

## Exacte scope en aantallen

| Onderdeel | Nieuw / verwerkt | Cumulatief |
| --- | ---: | ---: |
| Schermweergaven / canonieke producties | 96 / 96 | 96 |
| Films | 61 | 61 |
| Miniseries | 15 | 15 |
| Televisiefilms | 7 | 7 |
| Televisieseries | 13 | 13 |
| Uitgebracht / onbekende status | 91 / 5 | 91 / 5 |
| Bronondersteunde literaire relaties | 14 | 14 |
| Voorlopige canonieke literaire relaties | 2 | 2 |
| Voorlopige schermprequelrelatie | 1 | 1 |
| Geregistreerde posters | 82 | 82 |
| Nieuwe personen / gescopeerde credits | 16 / 19 | 28 / 291 |
| Bronnen / veldclaims | 115 / 1.999 | 453 / 6.864 |
| Artworks: covers + posters | 82 posters | 234: 152 + 82 |
| Werken / bundels / edities / publicatie-events | 0 / 0 / 0 / 0 | 241 / 15 / 154 / 239 |
| Bundelrelaties / alle verbindingen | 0 / 17 | 155 / 26 |

Dit zijn tellingen binnen de 96 overgenomen schermidentiteiten, geen volledige wereldwijde filmografie of onafhankelijke verificatie van alle velden. Ook oorspronkelijke schermproducties en onzekere projecten zitten in deze legacyselectie. Geen nieuwe productie toegevoegd omdat een bron nog andere films of afleveringen noemt. `short`, `episode`, `season` en `other-screen` blijven ondersteunde typen; de bestaande 96 records leveren geen aanvullend afzonderlijk geverifieerd exemplaar in die categorieën op. Er is geen volledige aflevering-/seizoensinventarisatie uitgevoerd.

Geen identiteiten zijn samengevoegd. Carrie, IT, The Stand, The Shining, Firestarter en Pet Sematary behouden hun afzonderlijke producties, jaren en aliases. `batch-04-register.json` bevat eenmalige opaque slots met bronhashes en digests van **ieder** Batch-03-record. Oude registers en canonieke records blijven ongewijzigd. De 96 bestaande film-ID’s en hashes verwijzen via aliases naar de nieuwe IDs; geen titelmerge, naamsmerge of hernummering. Elf vergelijkingsgroepen tonen gedeelde bronkandidaten, zonder automatisch iedere nieuwe versie als remake, vervolg of gedeelde continuïteit te bestempelen.

## Relaties: bewijs, kandidaat en context

`screen-views.json` bindt iedere legacyweergave aan één canonieke productie en bewaart de oorspronkelijke jaar-, datum-, status- en relatiewaarnemingen. Bronkandidaten verwijzen uitsluitend via geregistreerde IDs naar bestaande werken of bundels. Elke kandidaat bevat bron, verificatiestatus, zekerheidsniveau of expliciet onbekende zekerheid, verklaring en eventuele canonieke verbinding.

Er zijn 117 onderscheiden onderwerp/productie-associaties: de 115 bestaande koppelingen plus de nu expliciet aan bestaande identiteiten verbonden Gramma/Mercy en My Pretty Pony. Hiervan zijn 14 relaties bronondersteund, twee voorlopig, 78 onbesliste literaire bronkandidaten, 18 bundelcontexten en vijf oorspronkelijke scenariodelen. De contexten zijn geen extra directe adaptaties. 83 producties hebben nog geen bronondersteunde literaire relatie; bij oorspronkelijke scenario’s is een ontbrekend literair bronwerk niet vanzelf een fout. Negen hebben geen geregistreerde literaire bronkandidaat.

De 14 ondersteunde relaties omvatten beide Firestarter-versies, Mercy/Gramma, A Good Marriage/het verhaal, Hearts in Atlantis/Low Men in Yellow Coats, Cat’s Eye/Quitters, Inc. en The Ledge, Pet Sematary uit 1989 en Bloodlines, Carrie uit 1976/2013/2026, My Pretty Pony/het verhaal en de losse inspiratie van Haven door The Colorado Kid. Een bronondersteunde relatie certificeert niet de complete productie of een scènegetrouwe bewerking. De karaktergebaseerde The Dead Zone-serierelatie en de Pet Sematary-2019-romanrelatie blijven voorlopig; de oude studiopagina van de laatste verwijst naar een algemene homepage. Creepshow’s vijf oorspronkelijke scenariodelen worden niet automatisch eerdere literaire bronwerken; Weeds blijft een onbesliste afzonderlijke kandidaat.

Paramounts geïndexeerde trailerbeschrijving noemt een prequelrelatie tussen Bloodlines en de film uit 2019, maar de pagina kon niet worden opgehaald. De exacte schermcontinuïteit blijft voorlopig; het toegankelijke regisseursinterview ondersteunt de romanbron. De geografisch geblokkeerde perspagina is alleen als onbesliste bronaanwijzing behouden, zonder omzeiling. Dit is een schermrelatie, geen Tower-migratie. The Rage: Carrie 2 blijft een afzonderlijke productie met de overgenomen vervolgclassificatie als kandidaatlabel; de oude verwijzingen worden niet opgewaardeerd tot een nu onafhankelijk bewezen directe romanadaptatie of canonieke sequelverbinding.

Voor toekomstige navigatie kunnen bronondersteunde native `connections` in beide richtingen worden afgeleid. Onbevestigde kandidaten en bundelcontext blijven expliciet buiten een bevestigde-adaptatielijst. Dit is datavoorbereiding; geen nieuwe publieke routes of runtime-integratie.

## Productiegegevens en broncontrole

`adaptations` bewaart Engelse titel, alternatieve labels, productietype, geselecteerd releasejaar of null, releasewaarnemingen met precisie/territorium, gescopeerde statusgeschiedenis, landen/talen waar onderbouwd, makerswaarnemingen, distributiegegevens, relevante seizoensinformatie en korte eigen metadataomschrijvingen zonder plot. Ontbrekende waarden blijven onbekend. Jaar of datum is nooit automatisch de wereldwijd eerste première.

Bronhiërarchie: producent/distributeur/omroep waar beschikbaar, daarnaast StephenKing.com en AFI als primaire institutionele catalogus met productie-/creditbewijs. `batch-04-review.json` bewaart geselecteerde feitelijke notities en URLs van de gerichte raadpleging. Er zijn geen volledige synopses of bronpagina’s opgeslagen. De overige velden blijven gescopeerde overnames van de bewaarde audit/snapshots; niet alle 96 producties zijn opnieuw integraal online geverifieerd. De Haven-inspiratierelatie steunt op de reeds bewaarde Syfy-persberichtbron via AWN; zij is geen nieuw onafhankelijk bevestigde bronraadpleging.

- **Mercy:** StephenKing.com toont 2012-12-14 naast pre-productietekst; het nieuwsbericht van die dag is een aankondiging. Universal vermeldt releasejaar 2014. Selectie: 2014 op jaarprecisie, zonder verzonnen dag; de oorspronkelijke velden blijven in de view en bron staan.
- **Trucks:** 1997 versus de bronrecorddatum 2000-12-26 blijft onopgelost. Het geselecteerde releasejaar is null; de gedateerde bronwaarneming blijft voorlopig en is geen eerste-premièreclaim.
- **My Pretty Pony:** een releasekop en aangekondigde opnamen spreken elkaar tegen. Status onbekend, geen bevestigde releaseEvents; de bronwaarneming blijft behouden. Geen kortefilm-/voltooide productie-identiteit verzonnen op basis van de titel.
- **Vier TBD-projecten:** The Girl Who Loved Tom Gordon, Suffer the Little Children, Hearts en Sleeping Beauties blijven onbekend. Geen actuele annulering of release uit een oude TBD-pagina afgeleid.
- **Carrie:** één serie-identiteit, acht uitgebrachte afleveringen van seizoen 1 en een afzonderlijk aangekondigd seizoen 2 zonder datum/aantal afleveringen. De bronupdate van 22 oktober over verlenging is geen release. Episodegebonden regiecredits houden hun exacte scope; geen volledige-serieregie aangenomen.
- **Firestarter:** de gedeelde legacy-URL toont de film uit 2022. Voor 1984 zijn Universal en AFI afzonderlijk geraadpleegd. Mark L. Lester en Keith Thomas blijven productiegebonden; er is geen 2022-poster aan 1984 gekoppeld.

95 producties missen een onderbouwd land en oorspronkelijke taal; de taal van een Engelse titel bewijst de oorspronkelijke productietaal niet. Vier records bevatten beschadigde makersnamen in de overgenomen tekst (Cell, beide recente IT-films, Pet Sematary 2019). De letterlijke waarnemingen blijven behouden met een open markering; geen personen op basis van corrupte tekst aangemaakt. Pet Sematary 2019 heeft daarnaast nieuwe, afzonderlijk uit geïndexeerde studiometadata overgenomen, voorlopige credits. Samengestelde credits en niet volledig gecontroleerde castregels blijven makerswaarnemingen; geen fictieve persoons-/personage-identiteiten of ononderbouwde rolomvang.

## Posters, ratings en omschrijvingen

82 bestaande posterverwijzingen zijn op de **exacte legacyproductie** gekoppeld aan native artworkrecords. Veertien producties hebben geen geregistreerde poster. Een gedeelde titel/bron-URL mag geen poster naar een remake overbrengen.

`poster-provenance.json` geeft voor alle 96 producties een geschematiseerde beslissing: herkomst, originele URL, historische visuele review, rechtenbewijs, actuele beschikbaarheid/levering, eventuele toegestane lokale asset en placeholderfallback. **0 vastgestelde hergebruiktoestemmingen, 0 goedgekeurd voor betrouwbare toegestane weergave, 0 nieuwe beeldbestanden.** Er zijn geen posters opgehaald, gespiegeld, geproxied of opnieuw op hotlinkgedrag getest. Historische HTTP-/visuele goedkeuring is geen huidige beschikbaarheid of licentie.

Geen numerieke ratings en geen bestaande IMDb-gebaseerde omschrijvingen zijn in de canonieke adaptaties geïmporteerd. Drie opgeslagen scores en twee IMDb-gebaseerde omschrijvingen blijven ongewijzigd in hun oude bronnen ter beoordeling. `screen-rights-dispositions.json` bewaart de veldbeslissingen zonder de scores of teksten opnieuw te publiceren. De twee andere bestaande redactionele omschrijvingen zijn evenmin overgenomen; alle nieuwe adaptatiebeschrijvingen zijn neutrale, zelfgeschreven metadatazinnen zonder plot. IMDb-gebaseerde makerswaarnemingen worden niet als nieuw geverifieerde credits gepresenteerd. Geen API, key, betaalde dienst of nieuwe dependency.

## Reproduceerbaarheid en veldledger

`migrate_shadow.cjs` bouwt standaard Batches 01–04 met `migrate_adaptations.cjs`. `{batch:'01'}`, `{batch:'02'}` en `{batch:'03'}` reproduceren de historische projecties. Nieuwe slots worden niet tijdens gewone builds gegenereerd. Gewijzigde inputhashes stoppen de migratie. `validate_screens.cjs` toetst verwijzingen, kandidaten versus bevestigde relaties, statusclaims, seizoensscope, posterrechten en eigenaarschap. De hoofdvalidator bewaakt schema, claims, aliases, oude recorddigests en reproduceerbaarheid.

De DB-ledger bevat 15.350 bladvelden: **5.657 gekoppeld, 9.693 behouden maar nog niet canoniek gekoppeld**. Batch 04 voegt 1.599 mappings toe. 259 literaire weergaven, 154 editievoorbeelden en 96 schermweergaven hebben verschillende noemers en zijn geen optelbare unieke-werktelling. Geen volledig gemigreerde record-/filmografieclaim. `@screenView`, `@source`, `@posterProvenance` en `@boundAdaptation` benoemen expliciet een overlay, bewijsverwijzing of eigenaarschapstransformatie; zij doen zich niet voor als native veldpointers.

Aanvullende Batch-04-ledger: 1.827 bladvelden, 574 gekoppeld en 1.253 behouden. Scope: uitsluitend `MEDIA.films` (1.558 bladen, 574 gekoppeld), het aanvullende screen-snapshot (209 behouden) en de eerdere rechtenreview (60 behouden). Die aanvullende snapshots bevatten deels reeds via DB gekoppelde feiten; behoud als bewijs is geen verlies, maar wordt niet dubbel als canonicalisatie geteld. De afzonderlijke Batch-03-ledger blijft onveranderd. Geen bronbestand of legacyveld verwijderd.

Het dashboard onderscheidt identiteitmigratie, relatiebewijs, productieonzekerheid en wereldwijde dekking. De bestaande 703 indexregels en 692 gelinkte bibliografieregels blijven bronregels. Door nu ook geregistreerde scherm-ID’s te herkennen stijgt de shadow-aanwezigheidsmatch naar 346 index- en 183 bibliografieregels. Dat is aanwezigheid, geen onafhankelijke filmografische volledigheid of verificatie van die volledige records.

## Controles en stopgrens

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
npm run migrate:shadow
npm run validate:foundation
npm run validate:shadow
npm run report:migration
npm test
```

De bestaande 82 tests en twaalf nieuwe screen-migratietests slagen: **94/94**. Controles omvatten alle 96 IDs/titels/routes, varianten/remakes zonder naamsmerge, meervoudige werkrelaties, bundelcontext, voorlopige claims, releaseconflicten, onbekende projecten, seizoensscope, posterbinding/rechten, uitgesloten ratings/teksten, makersrollen, behoud van alle Batch-03-records en offline reproduceerbaarheid. Beide validators en syntaxchecks moeten slagen vóór publicatie. Het dashboard is visueel gecontroleerd op 390, 768 en 1440 px, zonder pagina-overloop; de hoofdtellingen blijven ook mobiel zichtbaar, brede detailtabellen zijn focusbaar en scrollbaar. De ongewijzigde standaardapp is kort getest op live zoeken, Enter, zoekknop, filmfilter, toetsenborddetail, EN/NL met Engelse filmtitels en bestaande foutafbeeldingsfallback. De bestaande Explorer is getest op filter, expliciete spoileractie, toetsenbordnavigatie en spoilerreset. Dit is geen nieuwe integrale audit van iedere afbeelding of browser. Deployment en live-bestandsresultaten worden afzonderlijk bij oplevering bevestigd.

Blokkades: 78 onbesliste bronkandidaten plus twee voorlopige native literaire relaties en één voorlopige schermprequel; 83 producties zonder bronondersteunde literaire relatie; bron-/datum-/type-/makersscope, 95 land-/taalbevestigingen, vier beschadigde namen, vijf onbekende productiestatussen, twee jaarconflicten en alle posterrechten/levering. Elf vergelijkingsgroepen zijn geen volledig bewezen remake-/continuïteitsnetwerk. Eerdere editie-/vertaalgeschiedenissen, vijf voorlopige memberships, inhoudsvolgorden en resterende bronvelden blijven open. Volgende migratieonderdelen: 17 legacy-Tower-records en de uiteindelijke veld-/compatibiliteitsacceptatie, uitsluitend na een nieuwe opdracht. **Stop na Batch 04.**
