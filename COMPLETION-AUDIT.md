# The Kingverse — Completion Audit

**Peildatum:** 27 oktober 2026. **Basis:** Explorer 1.9.1, `3f77d793e27f28adb45373bdb123079cfe613cd3`.

**Conclusie:** de bestaande catalogus is technisch ontsloten, maar geen volledige King-encyclopedie. Hiaten: publicatie-/editieonderzoek, genres buiten de fictiescope, afgeleide schermproducties, entiteiten en beeldrechten. Meer UX-werk is niet de eerste stap.

## 1. Dekking en gewenste eindgrens

Tellingen: [kwaliteitsrapport](data/migration/quality.json), [editiebesluiten](data/migration/batch-03-decisions.json), [readiness](data/readiness/report.json) en [mediaregister](data/media/library.json).

| Onderdeel | Aantoonbaar aanwezig | Nog nodig |
| --- | --- | --- |
| Literaire identiteiten | 241 werken: 65 romans, 24 novellen, 142 korte verhalen, 5 gedichten, 2 non-fictie, 1 strip, 1 scenario, 1 essay; daarnaast 15 collecties | Alle relevante officiële bronvermeldingen inhoudelijk classificeren; niet iedere indexregel is een nieuw werk. |
| Bundels en verhalen | 13 reguliere verhalenbundels, één verzameling romans en één bijdragenbundel; 155 lidmaatschappen | Vijf voorlopige lidmaatschappen onderzoeken; inhoudsvolgorde nergens geverifieerd. 28 verhaalweergaven hebben geen geregistreerde bundel: dat bewijst niet dat zij ongebundeld zijn. |
| Edities/publicaties | 154 editievoorbeelden: 86 EN en 68 NL, elk gekoppeld aan een verschillend onderwerp binnen die taal; 239 publicatiewaarnemingen | Alle 154 missen specifieke editiedatum, uitgever en formaat; NL-vertalers zijn niet vastgelegd. 86 EN-voorbeelden missen ISBN. 66 voorbeelden hebben bronondersteunde identiteitsvelden, geen volledige editiecertificering. Bij 30 verhaalweergaven ontbreekt een brondatum; 147 publicatiewaarnemingen missen een uitgever. |
| Schermproducties | 96 identiteiten: 61 films, 15 miniseries, 7 televisiefilms, 13 series | Vijf hebben status `unknown`; 54 bronwerkparen zijn onbevestigd. Afleveringen, korte films en franchisevervolgen zijn niet volledig geïnventariseerd. |
| Connected Universe | 8 personages, 2 locaties, 2 reeksen; 94 native relaties, waarvan 87 bronondersteund en 7 voorlopig | Veel meer afzonderlijke entiteiten en gecontroleerde verschijningen. De 66 standaard- en 28 plotrelaties zijn geen totaal van alle King-connecties. Credits en bundellidmaatschappen zijn afzonderlijke relatiesets. |
| Media | 152 bekende covers en 82 posters; twee eigen placeholders | Nul vastgelegde herpublicatiegrondslagen voor de 234 externe beelden. Daarnaast twee geregistreerde edities zonder cover en 14 producties zonder poster. |

**Gewenste, toetsbare dekking:** alle vermeldingen uit een gedateerde officiële inventaris hebben een besluit: bestaande identiteit, publicatie/editie, nieuwe onderbouwde identiteit, bijdrage of gemotiveerd buiten scope. Per boek/bundel minimaal één geïdentificeerde oorspronkelijke EN-uitgave en een geverifieerde NL-uitgave waar aantoonbaar aanwezig; verhaalpublicaties en bundels afzonderlijk. Een volledige wereldwijde druk-/vertalingsgeschiedenis heeft nog geen betrouwbare eindnoemer.

Identiteitsmigratie is **256/256 geërfde literaire identiteiten en 96/96 schermrecords**. Dat is geen bibliografische volledigheid: slechts **5.674/15.350 legacy-bladvelden (37,0%)** zijn canoniek gekoppeld; 9.676 zijn behouden maar uitgesteld. Aanvullende ledgers overlappen; niet optellen.

## 2. Concrete bibliografische hiaten

Een eenmalige actuele controle van [de officiële hoofdindex](https://stephenking.com/works/all/) levert opnieuw **703 regels** op: nul toegevoegde of verdwenen titel/type/URL-combinaties tegenover de bestaande snapshot. Geen nieuwe volledige detailcrawl uitgevoerd. De bestaande vergelijking houdt 357 hoofdindexregels en 509 van 692 gelinkte bibliografieregels onopgelost; deze overlappende bronvermeldingen zijn **geen aantallen ontbrekende unieke werken**.

**Negen concrete dossiers ontbreken als eigen canonieke werk-/collectie-/projectidentiteit:**

| Dossier en officiële bron | Benodigde behandeling |
| --- | --- |
| [On Writing](https://stephenking.com/works/nonfiction/on-writing-a-memoir-of-the-craft.html), [Danse Macabre](https://stephenking.com/works/nonfiction/danse-macabre.html), [GUNS](https://stephenking.com/works/nonfiction/guns.html), [Secret Windows](https://stephenking.com/works/nonfiction/secret-windows-essays-and-fiction-on-the-craft-of-writing.html) | Non-fictie, essayuitgave en gemengde bundel onderscheiden; bijdragen niet als co-auteurschap overnemen. |
| [Charlie the Choo-Choo](https://stephenking.com/works/other-project/charlie-the-choo-choo.html), [Hansel and Gretel](https://stephenking.com/works/other-project/hansel-and-gretel.html) | Kinderboeken; schrijfnaam, hervertelling, illustratie en voorwoord afzonderlijk verifiëren. Hansel and Gretel is officieel als uitgave uit 2025 geregistreerd. |
| [The Plant: Zenith Rising](https://stephenking.com/works/other-project/plant-zenith-rising.html) | Onvoltooide roman/seriële e-bookpublicatie; geen zes nieuwe werken en geen voltooide roman suggereren. |
| [Storm of the Century](https://stephenking.com/works/screenplay/storm-of-the-century.html) | Gepubliceerd scenario onderscheiden van de al aanwezige schermproductie. |
| [Ghost Brothers of Darkland County](https://stephenking.com/works/other-project/ghost-brothers-of-darkland-county.html) | Theaterproject; tekst-, muziek- en overige makersrollen en soundtrack als verschijningsvorm afzonderlijk onderzoeken. |

Dit zijn negen **dossiers**, geen vooraf goedgekeurde negen nieuwe `workId`s. Het schema kent bijvoorbeeld nog geen expliciet kinderboek- of toneeltype; classificatie moet eerst worden besloten, zonder fictieve genres of automatische schemawijziging.

**Voorkom dubbel werk:** `N./N` bestaat als `wrk:000171`, The Glass Floor als `wrk:000224`. De tien onopgeloste Novel-regels betreffen onder meer zes Green Mile-delen en geïllustreerde/herziene uitgaven; zij bewijzen geen tien ontbrekende romans. Binnen de eerdere fictiescope is geen extra ontbrekende unieke titel vastgesteld. **Jumper (`wrk:000226`) en Rush Call (`wrk:000235`) bestaan al**; de officiële Secret Windows-inhoud is aanleiding voor aanvullende bundelrelaties, niet voor dubbele verhalen.

De [11 officiële samenwerkingsvermeldingen](https://stephenking.com/works/collaboration/index.html) waren al vergeleken; 13 projecten zijn geregistreerd inclusief twee aanvullingen. Open werk zit onder meer in volledige bijdragenlijsten, theater en de 84 onopgeloste Anthology-regels. Essays, interviews, strips, voorwoorden en ongepubliceerde projecten vragen scopebesluiten; andermans anthologie is geen door King geschreven boek. Brooks is eerder alleen via metadata geraadpleegd; onafhankelijke eerste-publicatiecontrole vereist geautoriseerde bibliotheek-/boekraadpleging.

## 3. Engelse en Nederlandse edities

Hergebruik de 154 voorbeelden en uitgeverssnapshot. Bij Carrie en Christine blijven twee NL-identiteitsvergelijkingen voorlopig. Werkjaar, werkuitgever, eerste druk, herdruk en vertaling mogen niet worden gelijkgesteld.

Concrete aanvullingen: oorspronkelijke EN-uitgaven met editie-identificatie/ISBN waar van toepassing; de herziene Gunslinger, uitgebreide Stand, geïllustreerde ’Salem’s Lot/Joyland en de Green Mile-publicatiegeschiedenis. [On Writing](https://stephenking.com/works/nonfiction/on-writing-a-memoir-of-the-craft.html) vermeldt bijvoorbeeld zowel 2000 als een specifieke jubileumuitgave uit 2020: twee verschillende bibliografische niveaus. [Upcoming](https://stephenking.com/upcoming/) noemt een IT-jubileumeditie voor 26 november 2026; editie-aanvulling, geen nieuw literair werk.

Voor NL bevestigt [de uitgeversleeswijzer](https://www.lsuitgeverij.nl/stephen-king-boeken/) de titel **Over leven en schrijven**, terwijl het onderliggende On Writing nog ontbreekt. Taal, ISBN, druk, vertaler en datum moeten per editie worden gecontroleerd. Noch 25 ontbrekende NL-covers, noch het verschil 86 EN versus 68 NL bewijst een vertalingsachterstand. Gebruik uitgever en bibliotheekcatalogi; de eerdere 81 ontoegankelijke fanclubpagina’s niet opnieuw massaal bevragen.

## 4. Adaptaties en universum

Hergebruik de elf groepen in `data/audit.json#supplementaryScreenQueue`. **Minstens zeven concrete schermproducties ontbreken als afzonderlijke identiteit:** [Firestarter 2: Rekindled](https://www.universalpicturesathome.com/tv/firestarter-2-rekindled), de [Creepshow-serie](https://www.amcnetworks.com/press-releases/production-starts-on-greg-nicoteros-creepshow-anthology-series-for-shudder/) en de vijf Children of the Corn-vervolgen II, IV, V, 666 en Revelation uit [Miramax’ overzicht](https://www.miramax.com/profile/stephen-king/). Dit bevestigt producties, niet zeven directe adaptaties van King-teksten. Franchiseverwantschap, scenario-auteurschap en verhaalbron apart bewijzen. Miramax vermeldt voor deel II 1991: releasedatum blijft een te onderzoeken bronconflict. Dollar Babies en de overige kandidaatgroepen blijven onvolledig onderzocht.

[Amazons actuele Carrie-informatie](https://www.aboutamazon.com/news/entertainment/carrie-stephen-king-mike-flanagan-prime-video) bevestigt seizoen 1 en de aankondiging van seizoen 2; beide staan **al** bij `adp:000084`. Geen dubbele serie toevoegen en geen releasedatum voor seizoen 2 verzinnen. De vijf onbekende projecten en latere aankondigingen vereisen nieuwe productie-/distributiebronnen; oude TBD-vermeldingen bewijzen geen actuele productie. Geen uitputtende ontwikkelkalender vastgesteld.

De bestaande Tower-inventaris bevat **41 bronrijen bij 40 URL’s**, tegenover de 17 eerder beoordeelde legacy-Tower-rijen: verschillende noemers, geen simpele aftreksom van ontbrekende verbindingen. Concrete entiteitsgaten zijn onder meer **Eddie Dean, Susannah Dean en Jake Chambers**, genoemd in de [officiële personagelijst](https://stephenking.com/darktower/misc/dark_tower_characters.html), en **Mid-World/Gilead** in [de glossary](https://stephenking.com/darktower/glossary.html). Ook de **Mr. Mercedes-trilogie** ontbreekt als reeksentiteit; de uitgeversleeswijzer noemt die reeks. Verwerk vervolgens gecontroleerde verschijningen en instellingen, met veldbronnen en zekerheid. Hier worden geen nieuwe verhaalverbanden of plotdetails gepubliceerd. Bronpagina’s kunnen spoilers bevatten; faninzendingen zijn geen primaire bevestiging.

## 5. Media: bereikbaarheid is geen publicatierecht

Alle 234 inventarisrecords hebben verschillende URL’s. **232 nieuwe HEAD-controles**, met de normale publieke Explorer-Referer, twee workers en zonder beeldbody, zijn uitgevoerd; de twee reeds vastgelegde verwijzerweigeringen zijn hergebruikt. Geen GET-download, nieuwe visuele controle, spiegeling of omzeiling.

| Inventarisgroep | Technische vaststelling | Rechten/publicatie |
| --- | --- | --- |
| 66 NL-covers bij Luitingh-Sijthoff | Alle 66: `200 image/jpeg` bij HEAD | Technische kandidaten; geen vastgelegd toestemmingsbewijs. |
| 86 EN-covers bij StephenKing.com | 84 nieuwe `403`-antwoorden plus twee eerder vastgelegde verwijzerweigeringen | Levering voor deze context niet bruikbaar; rechten niet vastgesteld. |
| 82 posters bij StephenKing.com | Alle 82: `403` bij HEAD | Levering voor deze context niet bruikbaar; rechten niet vastgesteld. |

**Bevestigd inzetbaar uit de externe inventaris: 0. Nader rechtenonderzoek: 234.** HEAD-successen bewijzen geen volledige download/decodering, juiste editie of licentie. Er is geen individuele licentieweigering vastgelegd: niet stellen dat alle 234 juridisch verboden zijn. **Volgens het huidige projectbeleid mogen zij nu niet worden vrijgegeven.** Omzeilen van de 168 verwijzerweigeringen en publiceren zonder vastgestelde grondslag zijn geen toegestane oplossing. De twee eigen SVG-placeholders blijven inzetbaar, buiten deze 234. De legacy-app gebruikt al `no-referrer`; zichtbaarheid daar is geen publicatiegrondslag. Dit wordt niet uitgebreid of aangepast in deze audit.

Gebundelde toestemmingsroute:

- **66 NL-covers:** [Marketing & Publiciteit van Luitingh-Sijthoff](https://www.lsuitgeverij.nl/contact/) vragen om een gespecificeerde titel-/ISBN-lijst en eventuele catalogusbrede toestemming. Hun [disclaimer](https://www.lsuitgeverij.nl/disclaimer/) kent auteursrecht toe aan LS of derden; dat is geen doorlicentie aan The Kingverse.
- **86 EN-covers:** per geïdentificeerde editie naar het echte imprint/rechthebbende. [Simon & Schuster Rights & Permissions](https://www.simonandschuster.biz/p/rights-and-permissions) en publicity zijn concrete loketten, geen algemene weblicentie. De covercategorie prop/set dressing is geen encyclopedielicentie. De [King-webmaster](https://stephenking.com/contact/) behandelt geen rechtenvragen over zijn werk.
- **82 posters:** oorspronkelijke producent/distributeur om toegestane persassets of een schriftelijke weblicentie vragen. Een perskit, downloadknop of publiek toegankelijke afbeelding alleen is onvoldoende.

Leg per toestemming artwork-/editie-/productie-ID, bevoegde rechthebbende, lokale hosting, thumbnails/bewerkingen, credit, territorium, looptijd en commerciële voorwaarden vast. Onderzoek eerst kosteloze toestemming; geen betaalde dienst of licentie activeren. Citaatrecht/fair use is hier niet per beeld beoordeeld. Er zijn geen aanvragen verstuurd. Ook de eerdere review van drie IMDb-scores en twee IMDb-gebaseerde omschrijvingen blijft open; geen nieuwe ratingsimport.

## 6. Prioriteiten, parallel werk en weinig opdrachten

| Prioriteit/werkpakket | Afhankelijkheid en afbakening |
| --- | --- |
| **P0 — identiteitconcordantie en bibliografische basis** | Classificeer de 357 open indexregels en hergebruik de bibliografievergelijking; sluit eerst bovenstaande negen dossiers en bekende schijngaten. Behoud IDs, aliases en oorspronkelijke bronvelden. Beslis classificatie vóór registratie; herbeoordeel de 17 bewaarde bronconflicten en drie URL-botsingsgroepen. |
| **P1 — EN/NL-edities en eerste publicaties** | Bouw op P0 en de 154 voorbeelden; verifieer velden met datumprecisie en afzonderlijke bronnen. Werk de 30 datumgaten en vijf voorlopige bundelrelaties af; onbekend blijft onbekend. |
| **P1 — screen/universe** | Na relevante identiteitsbesluiten: elf bestaande screen-kandidaatgroepen, 54 bronwerkparen, vijf onbekende statussen en de bewaarde Tower-inventaris. Geen automatische relaties op titel, gedeeld thema of filmfranchise. |
| **Parallel — rechten en media** | Kan direct beginnen met bestaande IDs: contact-/toestemmingsdossiers en rechthebbenden groeperen. Nieuwe beeldbinding wacht op editie-/productie-identificatie; downloaden en publiceren wachten op positieve rechtenbesluiten. |
| **P2 — opleverpoort** | Gecontroleerde inhoud en uitsluitend toegestane media samenvoegen; gerichte regressies, bron-/spoilercontrole en echte iPhone/VoiceOver-review. Geen automatische omschakeling van website of oude Explorer. |

**Advies: drie gecombineerde Codex-opdrachten**, met herstartbare subbatches en een voortgangsledger binnen elke opdracht: **A)** bibliografie + EN/NL-edities, parallel toestemmingsvoorbereiding; **B)** screen + universe, parallel behandeling van ontvangen rechtenbewijs; **C)** uitsluitend vrijgegeven media verwerken en inhoudelijke/releaseacceptatie afronden. Eén integrator beheert ID-registers; onderzoeksstromen leveren gescheiden bevindingen. Hergebruik bronnen; geen opdracht per titel. Drie opdrachten garanderen geen uitputtende werelddekking: externe rechtenreacties, ontbrekende bronnen en de afgesproken scope bepalen het resterende werk.

**Eerstvolgende uitvoeringsbatch: “Bibliographic Completion A — identities, editions and rights dossiers”.** Start bij de negen genoemde dossiers, herstel N./Glass Floor-/heruitgaveconcordanties zonder dubbele IDs, koppel waar bewezen bestaande verhalen aan Secret Windows en triageer alle 154 editievoorbeelden. Verifieer eerst een controlebatch van zes EN- en zes NL-edities, daarna dezelfde bronregels in subbatches van maximaal twintig waar bewijs beschikbaar is. Bereid parallel de LS-toestemmingslijst en EN/poster-rechthebbendenmatrix voor. Opleveren: veldclaims, exacte aantallen afgehandeld/open, herhaalbare bronbesluiten en gemotiveerde blokkades. Geen automatische beeldimport, UX-werk, nieuwe screen-/Tower-uitbreiding of live omschakeling binnen A.

## Verificatiegrens van deze audit

Gelezen/hergebruikt: AGENTS, architectuur/roadmap, opleveringen, schema, kwaliteitsrapporten, schaduwtabellen, broninventarisaties, verschillenledger en rechtenregisters. Gerichte officiële controles zijn aanvullend; geen wereldwijde ISBN-/premièrecontrole. Alleen dit rapport is gewijzigd; geen generatoren of volledige testsuite uitgevoerd. Bronlinks, aantallen en de rapportdiff zijn gecontroleerd. **Stop na inventarisatie; alle werkpakketten zijn voorstellen.**
