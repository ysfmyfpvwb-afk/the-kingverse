# The Kingverse 1.5.1 — catalogusaudit en datakwaliteit

Peildatum: **25 oktober 2026**. Dit rapport beschrijft een reproduceerbare auditbatch. Het archief is aantoonbaar uitgebreid; de volledige bibliografie, eerste-publicatiegeschiedenis en alle afgeleide adaptaties zijn **niet** volledig onafhankelijk geverifieerd. Op verzoek ligt de afronding nu eerst bij de Engelse structuur, pagina’s en gegevens. Engels is de standaard voor nieuwe bezoekers; bestaande NL-functionaliteit blijft behouden, verdere Nederlandse uitwerking en beeldresearch zijn latere fasen.

## Bronnen en scope

De primaire standaard is [StephenKing.com — works/all/](https://stephenking.com/works/all/): 703 bronregels. Er zijn 346 detailpagina’s uit de fictie-/adaptatiescope gecontroleerd op gestructureerde metadata. De [officiële bibliografie](https://stephenking.com/bibliography/) leverde daarnaast 692 feitelijke publicatievermeldingen. We bewaren bron-URL’s, peildatum, bronhashes, datumprecisie en gecontroleerde velden in `data/reference/` en `data/audit.json`. Geen synopsisteksten zijn overgenomen in de bronadministratie.

Gespecialiseerde overzichten zijn volledig naast de hoofdindex gelegd:

| Overzicht | Bronregels | Bron |
| --- | ---: | --- |
| novel | 100 | [Officieel overzicht](https://stephenking.com/works/novel/index.html) |
| collection | 13 | [Officieel overzicht](https://stephenking.com/works/collection/index.html) |
| short | 195 | [Officieel overzicht](https://stephenking.com/works/short/index.html) |
| movie | 57 | [Officieel overzicht](https://stephenking.com/works/movie/index.html) |
| television | 32 | [Officieel overzicht](https://stephenking.com/works/television/index.html) |
| collaboration | 11 | [Officieel overzicht](https://stephenking.com/works/collaboration/index.html) |

De romanlijst omvat ook novellen en heruitgaven; de short-lijst omvat naast fictie essays, poëzie, interviews en toespraken. De hoofdindex telt 58 Movie-regels, het gespecialiseerde filmoverzicht 57. Firestarter (1984 en 2022) heeft in de hoofdindex twee vermeldingen met dezelfde URL die naar de 2022-film leidt. De veldcontrole voorkomt dat de credits en poster daardoor naar de verkeerde film worden gekopieerd.

Voor Nederlandse edities zijn 94 pagina’s uit de officiële Luitingh-Sijthoff-auteurscatalogus verwerkt. Van 110 fanclubpagina’s leverden 81 HTTP 503; die zijn als onbereikbaar vastgelegd, zonder omzeiling. De gecontroleerde uitgeverspagina’s geven titel, taal en ISBN/beeld. Een ontbrekende Nederlandse editie in deze dataset betekent niet dat er geen vertaling bestaat.

## Onafhankelijke verificatie en Brooks

Justin Brooks’ *Stephen King: A Primary Bibliography of the World’s Most Popular Author* is gecontroleerd via [de uitgever](https://www.cemeterydance.com/stephen-king-a-primary-bibliography-of-the-worlds-most-popular-author.html) en [WorldCat](https://search.worldcat.org/title/Stephen-King-%3A-a-primary-bibliography-of-the-world%27s-most-popular-author/oclc/234087633). De geraadpleegde publicatiegegevens betreffen de editie van mei 2008, Cemetery Dance, 560 pagina’s, ISBN 1-58767-153-0. De uitgeversbeschrijving noemt dekking tot eind 2005 en veel meer soorten bijdragen en verschijningsvormen dan onze fictiescope. Die aantallen zijn dus geen vervangende telling van unieke werken.

Er is **geen volledige, geautoriseerde tekst of systematische entry-voor-entrycontrole van Brooks** uitgevoerd. Een zoekresultaat bood een externe 2013-tekstspiegel; de herkomst/volledigheid is niet vastgesteld en die is niet als geverifieerde hoofdlijst gebruikt. Diepgaande eerste-publicatiecontrole, obscure bijdragen en overige genres blijven open.

Films/TV zijn primair gecontroleerd met de officiële King-detailpagina’s en bibliografie, aangevuld met Amazon/Prime Video, Hulu, Paramount en NEON voor actuele of conflicterende feiten. [De onafhankelijke adaptatielijst](https://en.wikipedia.org/wiki/List_of_adaptations_of_works_by_Stephen_King) is voor aanvullende kandidaatgroepen bekeken; die kandidaten zijn niet automatisch als bevestigde releases geïmporteerd.

## Werk is niet hetzelfde als uitgave

Er zijn 256 unieke literaire identiteiten in `works`. De bibliotheek heeft 86 records; de verhalenpagina 173 unieke verhaal-/bundelbijdragen. Drie zelfstandig uitgegeven novellen zijn vanuit beide indexen bereikbaar en delen één `workId`. Gelijknamige verhalen en bundels (zoals *Hearts in Atlantis*) blijven verschillende werken. 154 vastgelegde editievoorbeelden verwijzen naar een werk, taal, bron en waar bekend ISBN. Een cover verwijst naar zo’n editie.

- The Green Mile is één literair werk. De zes seriële publicaties uit 1996 en de verzamelde editie worden als publicatiegeschiedenis vastgelegd, niet als zeven extra romans. De bronvermelding 2000 bij een latere verzamelde editie overschrijft de seriële start van maart 1996 niet.
- Vier heruitgaven/versies uit de romanindex zijn gekoppeld aan hun oorspronkelijke werk. Zij verhogen het aantal unieke werken niet.
- Een verhaal dat in meerdere bundels voorkomt staat één keer in de verhalenindex, met meerdere bundelkoppelingen. De vier Bachman-romans uit *The Bachman Books* zijn als boeken gekoppeld en niet meer misleidend als korte verhalen geteld.
- Een bronregistratiedatum is geen bewezen eerste publicatie. Datumprecisie blijft jaar/maand/dag; onafhankelijke eerste-publicatiegeschiedenis staat per record nog open tenzij uitdrukkelijk onderbouwd.

## Dekking per categorie

“Titel vergeleken” betekent dat het record tegen een genoemde bron is gelegd; het betekent **niet** dat alle velden onafhankelijk bevestigd zijn. “Onzekere metadata” telt records met ten minste één open auditveld, inclusief eerste-publicatiegeschiedenis.

| Categorie | Verwacht volgens vastgelegde scope | Aanwezig | Titel vergeleken | Ontbrekende bronwerken | Records met onzekere metadata |
| --- | ---: | ---: | ---: | ---: | ---: |
| Boeken/bundels + afgebakende samenwerkingsuitbreiding | 86 | 86 | 86 | 0 | 85 |
| Korte fictie + behouden overige bundelbijdragen | 166 | 173 | 173 | 0 | 173 |
| Film/TV uit primaire lijst + aanvullingen | 90 | 96 | 96 | 0 | 92 |

De 166 unieke korte-fictiewerken corresponderen met 168 afzonderlijke officiële URL’s: *N/N.* en *The Glass Floor* komen in meerdere bronrubrieken voor; daarnaast bevat de index een herhaalde Glass Floor-vermelding. Er blijven zeven bestaande bijdragen buiten die fictionele types behouden (zoals gedichten, een essay en een scenario). De film/TV-telling omvat 90 primaire bronentiteiten en zes aanvullende records. De boekenvergelijking omvat ook 92 publicatie-/werkregels vóór werk/uitgave-consolidatie, plus de vier afzonderlijk toegevoegde samenwerkingsprojecten.

Alle bronrecords binnen deze **vastgestelde inventarisatiescope zijn vergeleken**. Geen van deze categorieën wordt als volledig onafhankelijk geverifieerde wereldbibliografie gepresenteerd. De bredere genres, onbekende extra werken, alle vervolgfilms, losse TV-afleveringen en korte films blijven een afzonderlijke auditopgave.

## Covers en posters — juiste noemers

| Groep | Werkrecords / bewezen zelfstandige verhalen | NL-cover beschikbaar | EN-cover beschikbaar | NL niet beschikbaar | EN niet beschikbaar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Boeken en bundels | 86 | 61 | 86 | 25 | 0 |
| Aangetoonde zelfstandige verhaaluitgaven (deels dezelfde novellen als hierboven) | 8 | 5 | 3 | 3 | 5 |

Er zijn 82 gecontroleerde Engelstalige posters bij 96 adaptatierecords; 14 posters ontbreken nog. De zelfstandige-verhalenrij is een **deels overlappende deelverzameling**, geen optelling bij de boekenrij. De vijf afzonderlijke Nederlandse uitgeversuitgaven zijn The Mist, A Good Marriage, Mile 81, In the Tall Grass en Throttle. Voor de getelde ontbrekende taalvarianten is niet automatisch vastgesteld dat een zelfstandige uitgave in die taal bestaat; editieonderzoek blijft nodig.

145 individuele bijdragen hebben een geregistreerde standaardbundel en gebruiken de bundelcover (145 in NL, inclusief toegestane Engelse fallback; 145 in EN). Andere bundelrelaties blijven apart aanklikbaar. 28 bijdragen hebben geen geregistreerde bundel. **Geen van deze bijdragen wordt als ontbrekende eigen cover geteld alleen omdat er geen zelfstandige boekuitgave is.** Een zelfstandige verhaalcover mag uitsluitend uit een aangetoonde editie komen; verhaalillustraties en filmposters worden niet tot covers gepromoveerd.

De beelddataset bevat alleen visueel op titel/taal beoordeelde beelden die bij ophalen echte afbeeldingsbestanden waren. Afgewezen: de NL-cover-URL voor Het verloren rijk gaf tekst “Not found”; een Lisey-uitgeverpagina gaf niet passend Engels promotiemateriaal; de aangeleverde Outsider-serieafbeelding was onvoldoende herkenbaar. Zij verschijnen niet als goedgekeurde cover/poster. Engelse fallback is zichtbaar gemarkeerd. Afbeeldingen blijven extern geladen met broncredit; er is geen vrije licentie of toestemming voor verdere herdistributie geclaimd. Bronnen kunnen later uitvallen; de layout behoudt dan een placeholder.

## Samenwerkingen en auteursrollen

Alle 11 vermeldingen uit de officiële samenwerkingsindex zijn tegen de aanwezige werken vergeleken. Er zijn 13 unieke geregistreerde samenwerkingsprojecten, inclusief Gwendy’s Button Box en Other Worlds Than These buiten die index. Drie links in de samenwerkingsindex verwijzen naar verouderde `/short_story/`-paden die 404 geven; de corresponderende werken bestaan wel op de actuele `/short/`-paden uit de hoofdlijst.

Het filter “Samenwerkingen / Collaborations” werkt op de boeken- en verhalenpagina. Peter Straub, Owen King, Richard Chizmar, Joe Hill en Stewart O’Nan zijn met auteursrollen vastgelegd. Richard Bachman is een schrijfnaam van Stephen King, geen extra co-auteur. American Vampire vermeldt de afzonderlijke verhaallijnen van King en Scott Snyder en illustrator Rafael Albuquerque. Nightmares in the Sky onderscheidt Kings tekst en fotografie van f-stop Fitzgerald. Mid-Life Confidential is een bijdragenbundel; de genoemde makerslijst is nog onvolledig en staat als zodanig gemarkeerd. Geen voorwoord of aanbeveling wordt als co-auteurschap geregistreerd. Andere gezamenlijke/afgeleide projecten, waaronder theater- en anthologiebijdragen buiten deze scope, vereisen aanvullend rollen- en editieonderzoek.

## Dark Tower en navigatie

Er zijn 17 onderbouwde connectierecords met concrete concepten, bron, tweetalige toelichting en zichtbaar zekerheidsniveau. Nieuwe/uitgewerkte koppelingen betreffen onder meer Dinky Earnshaw, UR, de Territories, Lud en Other Worlds Than These. De IT-schildpadkoppeling is interpretatief gelabeld; de bron bewijst geen identieke entiteit. Boeken en verhalen openen de gerelateerde werken rechtstreeks.

De vier cataloguspagina’s en individuele details hebben deelbare hash-URL’s, met herstel van zoeken/filteren/sorteren en browser terug/vooruit. De zichtbare zoekknop met vergrootglas, Enter en live zoeken delen dezelfde logica. Er is een afzonderlijke, tweetalige pagina Bronnen & Werkwijze.

## Toevoegingen en verplaatsingen

- books: **Blockade Billy** — added.
- books: **American Vampire** — added.
- books: **Faithful** — added.
- books: **Mid-Life Confidential: The Rock Bottom Remainders Tour America With Three Chords and an Attitude** — added.
- books: **Nightmares in the Sky** — added.
- stories: **A Face in the Crowd** — added.
- stories: **Before the Play** — added.
- stories: **The Blue Air Compressor** — added.
- stories: **Cookie Jar** — added.
- stories: **The Crate** — added.
- stories: **Dinah's Hat** — added.
- stories: **Elevation** — added.
- stories: **The Extra Hour** — added.
- stories: **Father's Day** — added.
- stories: **The Glass Floor** — added.
- stories: **Gwendy's Button Box** — added.
- stories: **In the Tall Grass** — added.
- stories: **Jumper** — added.
- stories: **The Lonesome Death of Jordy Verrill** — added.
- stories: **Man With a Belly** — added.
- stories: **Memory** — added.
- stories: **The Music Room** — added.
- stories: **The Night of the Tiger** — added.
- stories: **The Old Dude's Ticker** — added.
- stories: **The Reploids** — added.
- stories: **The Revelations of 'Becka Paulson** — added.
- stories: **Rush Call** — added.
- stories: **Something to Tide You Over** — added.
- stories: **The Tale of Gray Dick** — added.
- stories: **They're Creeping Up on You** — added.
- stories: **Thin Scenery** — added.
- stories: **Throttle** — added.
- stories: **Weeds** — added.
- films: **The Diary of Ellen Rimbauer** — added.
- films: **Golden Years** — added.
- films: **Hearts** — added.
- films: **Kingdom Hospital** — added.
- films: **Mercy** — added.
- films: **My Pretty Pony** — added.
- films: **Quicksilver Highway** — added.
- films: **Sleeping Beauties** — added.
- films: **Sleepwalkers** — added.
- films: **Tales from the Darkside: The Movie** — added.
- stories: **Rage** — moved-novel-to-book-contents.
- stories: **The Long Walk** — moved-novel-to-book-contents.
- stories: **Roadwork** — moved-novel-to-book-contents.
- stories: **The Running Man** — moved-novel-to-book-contents.
- films: **Pet Sematary: Bloodlines** — added.
- films: **The Rage: Carrie 2** — added.

NL-titelcorrecties volgen de gecontroleerde editiebron, onder meer Vel over been (Bag of Bones), Rosie (Rose Madder), Het geheim van de Buick en Duma. Originele titels en eerdere naamvarianten blijven doorzoekbaar. De oorspronkelijke 1.4-weergavedata is bewaard in `data/legacy-v1.4.json`.

## Tegenstrijdigheden

| Werk | Verschil | Beslissing | Bron |
| --- | --- | --- | --- |
| Blaze | December 2006 / 2007 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/blaze.html) |
| Cycle of the Werewolf | 1983 / 1985-04 | Retain legacy year; do not equate edition, festival, broadcast and first publication dates | [Bron](https://stephenking.com/works/novel/cycle-of-the-werewolf.html) |
| Dolores Claiborne | 1992 / 1993-11 | Retain legacy year; do not equate edition, festival, broadcast and first publication dates | [Bron](https://stephenking.com/works/novel/dolores-claiborne.html) |
| The Green Mile: The Complete Serial Novel | 1996 / 2000-10 | Retain legacy year; do not equate edition, festival, broadcast and first publication dates | [Bron](https://stephenking.com/works/novel/green-mile-the-complete-serial-novel.html) |
| The Long Walk | December 1978 / 1979 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/long-walk.html) |
| Rage | December 1976 / 1977 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/rage.html) |
| The Regulators | December 1995 / 1996 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/regulators.html) |
| Roadwork | December 1980 / 1981 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/roadwork.html) |
| The Running Man | December 1981 / 1982 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/novel/running-man.html) |
| The Crate | December 1980 / 1981 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/short/crate.html) |
| The Night of the Tiger | December 1978 / 1979 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/short/night-of-the-tiger.html) |
| The Reploids | December 1987 / 1988 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/short/reploids.html) |
| The Revelations of 'Becka Paulson | December 1990 / 1991 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/short/revelations-of-becka-paulson.html) |
| Rush Call | December 1999 / 2000 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/short/rush-call.html) |
| 11/22/63 | November 19th, 2015 / November 19th, 2015 | Use detail field; keep index as evidence | [Bron](https://stephenking.com/works/television/11-22-63.html) |
| Trucks | 1997 / 2000-12-26 | Retain legacy year; do not equate edition, festival, broadcast and first publication dates | [Bron](https://stephenking.com/works/television/trucks.html) |
| Carrie | Miniserie / Televisieserie | Renewal from the cited current studio source takes precedence over the older miniseries label. | [Bron](https://stephenking.com/bibliography/) |

Andere betekenisverschillen worden niet tot fouten platgeslagen: The Life of Chuck behoudt de festivalpremière in 2024, terwijl de bioscoopuitbreng in 2025 plaatsvond. Carrie is opnieuw tegen de actuele Amazon-bron gelegd: oktober 2026-release en verlenging zijn gedocumenteerd; de oudere miniserieclassificatie wijkt af van de huidige doorlopende serie. Geen datum voor seizoen 2 is verzonnen.

## Resterend onderzoek

### Nederlandse boek-/bundelcovers niet beschikbaar

- Rage
- Cycle of the Werewolf
- The Dark Tower: The Waste Lands
- Lisey's Story
- Sleeping Beauties
- Gwendy's Button Box
- The Outsider
- Elevation
- The Institute
- Later
- Billy Summers
- Gwendy's Final Task
- Fairy Tale
- Holly
- You Like It Darker
- Never Flinch
- Other Worlds Than These
- Stephen King Goes to the Movies
- If It Bleeds
- The Bachman Books
- Blockade Billy
- American Vampire
- Faithful
- Mid-Life Confidential: The Rock Bottom Remainders Tour America With Three Chords and an Attitude
- Nightmares in the Sky

### Engelse boek-/bundelcovers niet beschikbaar

Geen ontbrekende Engelse boek-/bundelcover binnen de huidige bibliotheekselectie. Dit is geen claim over alle mogelijke edities.

### Posters niet beschikbaar

- Firestarter (1984)
- The Girl Who Loved Tom Gordon (jaar onbevestigd)
- Suffer the Little Children (jaar onbevestigd)
- Carrie (2002)
- The Outsider (2020)
- The Dead Zone (2002)
- Haven (2010)
- Carrie (2013)
- Hearts (jaar onbevestigd)
- Mercy (2012)
- My Pretty Pony (2017)
- Sleeping Beauties (jaar onbevestigd)
- Pet Sematary: Bloodlines (2023)
- The Rage: Carrie 2 (1999)

### Aanvullende film/TV-groepen buiten de afgeronde primaire vergelijking

- Children of the Corn (2009)
- Children of the Corn (2020/2023)
- Children of the Corn sequels
- Pet Sematary Two (1992)
- The Lawnmower Man (1992; disputed connection)
- Julie Ganapathi (2003)
- No Smoking (2007)
- Creepshow (2019 series)
- The Dead Zone / other anthology episodes
- Dollar Baby and other short-film adaptations
- Derivative sequels to The Mangler, Sometimes They Come Back and Firestarter

Deze groepen zijn geen definitieve telling van afzonderlijke ontbrekende records. Eerste publicaties, alle Nederlandse vertalingen en bundelinhouden, aanvullende co-auteursrollen en castinformatie vereisen verdere controle. De machineleesbare ledger somt per record de open velden op.

## Reproduceren en toetsen

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
node --check app.js
node --check catalog.js
node --check media.js
node --check about.js
node --test tests/*.test.cjs
```

Bronnen opnieuw ophalen gebeurt apart via `scripts/collect_reference.py` en `scripts/collect-dutch.py`, met cache en maximaal twee gelijktijdige verzoeken. Visuele goedkeuring wordt niet uit HTTP-succes afgeleid. `scripts/check_images.py` is voor een latere beeldcontrolefase en wijzigt zelf geen goedkeuringsstatus. `VALIDATION.md` beschrijft de daadwerkelijk uitgevoerde tests. Publicatiestatus wordt pas na deployment in de oplevering bevestigd.

## Update 1.5.1 — vier aanvullende film/TV-records

Carrie (2002), Carrie (2013), The Dead Zone (2002) en Haven (2010) zijn per veld gecontroleerd buiten de primaire King-lijst. De bronfeiten, rollen, datumsemantiek en beperkingen staan reproduceerbaar in `data/reference/screen-1.5.1.json`. De 96 film/TV-titels zijn nu alle tegen een benoemde bron vergeleken; dat is geen volledige verificatie van alle metadata.

IMDb levert aanvullende gebruikersscores en beschrijvingsfeiten. Scores zijn opgeslagen waarnemingen uit geïndexeerde IMDb-resultaten, geraadpleegd op 25 oktober 2026; de index kan ouder zijn. Het zijn geen live scores. Korte beschrijvingen zijn in eigen woorden geschreven. Bij de twee Carrie-records gebruiken de beschrijvingen productie-/distributeursfeiten, omdat de IMDb-hoofdpagina’s 403 gaven. De score van Carrie (2002) blijft expliciet onbevestigd. Geen toegangsbeperking is omzeild.

| Record | Hoofdbron | Resultaat / grens |
| --- | --- | --- |
| Carrie|2002 | [Bron](https://tv.apple.com/us/movie/carrie/umc.cmc.4iz6xmn32vca6hcyv5ulbtfx) | Swank mixes multiple crew roles in its Directors field; David Carson is independently confirmed by Apple TV.; Exact broadcast date is not certified here: the contemporary Playbill result was indexed but its full page returned 403.; IMDb title page returned 403; no verified numeric rating or IMDb synopsis was available. Summary uses distributor facts. |
| Carrie|2013 | [Bron](https://www.demilofilm.com/works/carrie) | IMDb rating available in indexed ratings page; main title page returned 403. Summary uses production-company facts rather than an inaccessible IMDb synopsis. |
| The Dead Zone|2002 | [Bron](https://tv.apple.com/us/show/the-dead-zone/umc.cmc.5syjc2wjt8qygwav1wvrb8hh3) | Titel, formaat, credits, bronwerk en releasedatum per veld vastgelegd. |
| Haven|2010 | [Bron](https://www.awn.com/news/syfys-haven-renewed-season-two) | Syfy press release reproduced by AWN establishes the original US premiere; Canada premiered on Showcase on July 12.; The Colorado Kid is a loose inspiration, not a scene-for-scene adaptation.; Showrunner credit is scoped to the contemporary first-season press release. |

Swank presenteert bij Carrie (2002) meerdere crewrollen samen onder Directors. Apple TV bevestigt afzonderlijk David Carson; de overige namen zijn niet als regisseurs overgenomen. De exacte TV-premièredatum blijft open omdat de volledige contemporaine Playbill-pagina 403 gaf. Demilo bevestigt voor Carrie (2013) de Amerikaanse bioscooprelease van 18 oktober 2013. Het contemporaine producenteninterview bij TV Tech bevestigt Michael Piller als showrunner van The Dead Zone en de USA-première van 16 juni 2002. Het Syfy-persbericht, gereproduceerd door AWN, bevestigt Haven op 9 juli 2010 in de VS versus 12 juli in Canada; Scott Shepherd is uitsluitend als showrunner van seizoen 1 vermeld. Haven is los geïnspireerd op The Colorado Kid.

Geen nieuwe afbeeldingen of verdere Nederlandse uitwerking in deze batch. Eerste-publicatieonderzoek volgt later.

## Foundation 1.6 — beperkte schaduwmigratie

Naast de actieve catalogus staat nu een v2-proof of concept met uitsluitend The Talisman en Black House. De bestaande catalogus, runtime en beelddata blijven ongewijzigd. Er is geen volledige migratie en geen nieuwe Explorer-pagina. De nieuwe canonieke IDs zijn titelonafhankelijke nummers; oude IDs en detailhashes blijven als aliases bewaard.

De proef omvat twee werken, vier bestaande EN/NL-editievoorbeelden met editiegebonden covers, twee personen, vier co-auteurscredits, twee personages, één locatie, acht relaties, vijf bronnen en veldgerichte verificatieclaims. Twee externe Tower-verwijzingen worden tegen de legacycatalogus opgelost en zijn geen extra gemigreerde werken. Bundel-/adaptatietabellen blijven leeg: geen bundelinhoud of projectstatus is verzonnen.

De officiële werkpagina’s en Tower Connections zijn voor de geselecteerde feiten geraadpleegd. Nederlandse editievoorbeelden gebruiken de bestaande uitgeverssnapshots; zij zijn niet als nieuwe editieaudit gepresenteerd. Druk, vertaler en eerste-publicatiegeschiedenis blijven open. Interpretatieve zekerheid wordt door schema en tests ondersteund; er is geen nieuwe theorie toegevoegd om een label te vullen.

### Huidige scores en omschrijvingen: hergebruik ter beoordeling

Er is geen OMDb- of IMDb-API-integratie. Vier IMDb-objecten komen uit handmatig opgeslagen waarnemingen van geïndexeerde zoekresultaten in 1.5.1. Drie scores en de twee op IMDb-feiten gebaseerde eigen omschrijvingen hebben geen aangetroffen toestemmingsbewijs en zijn als needs-review geregistreerd in `data/reviews/screen-data-rights.json`. De Carrie-omschrijvingen zijn eigen redactionele teksten op andere, afzonderlijk genoemde bronfeiten. Bestaande data blijft binnen deze foundation intact; geen recht op herpublicatie wordt daarmee aangenomen en deze velden zijn niet als toegestane v2-import overgenomen.

[IMDb beschrijft beperkingen op extractie en herpublicatie](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX). Betaalde IMDb-API’s en abonnementen zijn uitgesloten. Een mogelijke kosteloze route is [TMDb onder de toepasselijke voorwaarden](https://developer.themoviedb.org/docs/faq): eerst geschiktheid en volledige voorwaarden vaststellen, vereiste attributie toepassen, en een TMDb-score nooit IMDb noemen. Er is geen account/key/dienst geactiveerd. De directe veilige fallback is een externe verwijzing zonder onbevestigd overgenomen score plus eigen korte tekst uit gecontroleerde productiefeiten.

Validator: `npm ci --ignore-scripts`, daarna `npm run validate:foundation`. Volledige tests: `npm test`. De validator controleert JSON Schema, register/referenties, bronclaims, rollen, datums, ISBN, relaties, bundelinhoud, coverkoppelingen en oude routes; runtimehashes bewaken dat de bestaande site intact blijft. Werkelijke test-/browserresultaten en beperkingen staan in `FOUNDATION-DELIVERY.md`. De bibliografische/beeldtellingen hierboven blijven die van de actieve catalogus.

## Historische schaduwkwaliteit — Batch 03

Zie [MIGRATION-BATCH-03.md](MIGRATION-BATCH-03.md) en het afzonderlijke migratiedashboard. Eerdere tabellen betreffen de actieve catalogus of historische opleveringen; de actieve site en Explorer blijven ongewijzigd.

Alle 154 bestaande editievoorbeelden zijn opgenomen (150 nieuw): 86 EN en 68 NL, naast 239 publicatiewaarnemingen. 66 uitgeversmatches ondersteunen alleen NL-titel, ISBN en taal. Nul volledige drukgeschiedenissen zijn vastgesteld. Alle 154 specifieke editiedata, uitgevers, formaten en drukken blijven onbekend; NL-vertalers zijn niet verzonnen. 30 verhaalweergaven missen een bronrecorddatum en 147 publicatiewaarnemingen een uitgever. Drie jaarconflicten blijven als afzonderlijke observaties behouden.

152 covers zijn bibliografisch geregistreerd; 2 edities hebben geen geregistreerde cover. Nul hebben vastgestelde hergebruiktoestemming en toegestane betrouwbare levering. Twee eerdere Referer-weigeringen blijven aan bewijs en datum gekoppeld; geen nieuwe beeldproeven, downloads of omzeiling. Historische visuele/fetchmetadata is geen licentie. Vijf bestaande NL-ISBNverhaaluitgaven blijven behouden; bundel-only verhalen krijgen geen fictieve eigen cover.

4,058 van 15,350 DB-bladvelden zijn gekoppeld; 11,292 blijven behouden maar niet canoniek gekoppeld. De aanvullende ledger verantwoordt afzonderlijk 1.160 gekoppelde en 5.440 behouden bewijsvelden. Deze scopes bevatten herhaalde bewijzen, geen unieke feiten. 703 indexregels en 692 gelinkte bibliografieregels blijven bronregels, geen aantallen unieke werken. Alle eerdere identiteiten/claims blijven behouden. Geen wereldwijde volledigheidsclaim; 96 adaptaties en 17 Tower-records blijven buiten deze batch. Batch 04 is niet gestart.

## Actuele schaduwkwaliteit — Batch 04

Alle 96 bestaande schermweergaven zijn als 96 afzonderlijke canonieke producties gemigreerd. Geen titelmerge of nieuwe literaire identiteit. Brongecontroleerde literaire relaties: 14; voorlopige canonieke relatie: 2; voorlopige schermprequel: 1. 78 overige bronkandidaten, 18 bundelcontexten en vijf oorspronkelijke scenariodelen blijven afzonderlijk herkenbaar. 83 producties hebben nog geen bronondersteunde literaire relatie; originele scenario’s vereisen niet automatisch een literair bronwerk.

61 films, 15 miniseries, zeven televisiefilms en 13 televisieseries zijn binnen de overgenomen scope geclassificeerd. 91 producties staan als uitgebracht en vijf als onbekend geregistreerd. Dit certificeert geen volledige filmografie of actuele status van ieder project. Carrie seizoen 1 is uitgebracht; seizoen 2 is afzonderlijk aangekondigd zonder releasedatum. Mercy gebruikt het onderbouwde jaar 2014, terwijl de oorspronkelijke aankondigingsdatum uit 2012 behouden blijft. Trucks behoudt een jaarconflict. My Pretty Pony blijft bij tegenstrijdige productie-/releasebewoording onbekend.

82 bekende posterverwijzingen; 14 producties zonder geregistreerde poster. Nul posters met vastgestelde hergebruikrechten en toegestane betrouwbare levering. Geen beelden gedownload, overgenomen scores geïmporteerd of beperkingen omzeild. Drie numerieke IMDb-waarnemingen en twee IMDb-gebaseerde omschrijvingen blijven in de oude bron ter beoordeling. Nieuwe metadataomschrijvingen bevatten geen plot. Vier beschadigde makersnamen en 95 ontbrekende land-/taalbevestigingen blijven expliciet open.

5657 van 15350 catalogusbladvelden zijn gekoppeld; 9693 behouden maar nog niet gekoppeld. De Batch-04-bewijsledger omvat 1.827 bladen: 574 gekoppeld, 1.253 behouden, naast de afzonderlijke Batch-03-ledger. Herhaalde bewijzen worden niet als unieke feiten opgeteld. Alle Batch-03-records zijn op digest behouden; website, Explorer en spoilerbediening blijven onveranderd. Zie [MIGRATION-BATCH-04.md](MIGRATION-BATCH-04.md). 17 Tower-records en de resterende semantische veldcontrole volgen alleen op nieuwe opdracht. Batch 05 is niet gestart.
