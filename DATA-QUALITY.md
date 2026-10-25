# Update 1.4 — bronnen en datakwaliteit

Controle uitgevoerd op 25 oktober 2026. Dit is een werkcatalogus, geen volledig geverifieerde bibliografie.

## Inventaris en wijzigingen

De oorspronkelijke site was één HTML-bestand zonder afbeeldingen: 82 boekrecords, 155 verhaalvermeldingen, 83 adaptatierecords en 10 Tower-verbanden. Zoeken, filteren, sorteren, taalopslag en doorklikken bestaan nog. HTML, stijl, gedrag, oorspronkelijke data en gecontroleerde media zijn nu afzonderlijke bestanden.

De volledige geïmporteerde catalogus blijft in `catalog.js` staan. De weergave bevat 81 unieke boeken, 155 verhaalvermeldingen, 84 adaptaties en 10 Tower-verbanden:

- `You Like It Darker` stond dubbel: als roman en als bundel. De bundelregistratie, inclusief de waarschuwing over Nederlandse bundelinhoud, wordt getoond. Zie [officiële catalogus](https://stephenking.com/works/all/).
- `The Dark Tower` (2017) stond zowel als film als televisieproductie geregistreerd. Alleen de film verschijnt in de weergave: de [officiële bron](https://stephenking.com/works/movie/dark-tower.html) bevestigt de bioscoopfilm van Nikolaj Arcel. Het originele televisie-record blijft bewaard in de import.
- Carrie (2013) en Carrie (2026) zijn toegevoegd; Carrie (1976) en Carrie (2002) zijn behouden. Titel + jaar bepalen de afbeelding en directe detailkoppeling. Carrie (2002) is als televisiefilm gespecificeerd.
- Alle 155 verhaalvermeldingen verwijzen naar een bestaande bundel. Dit bewijst de koppeling, niet de inhoud van iedere Nederlandse editie. `In the Tall Grass` heeft nog geen eigen verhaalrecord. De bronwaarden `Original screenplay`, `Original stories` en `King universe (original)` zijn geen ontbrekende boekrecords.
- NL toont een gecontroleerde Nederlandse editie waar beschikbaar. Bij een bekende Nederlandse titel zonder gecontroleerd omslag verschijnt een Nederlandse placeholder. Als de Nederlandse titel/editie onbekend is, kan een expliciet als Engels aangeduide fallback verschijnen; dit beweert niet dat er geen vertaling bestaat.

## Gecontroleerde beelden

30 boekafbeeldingen: 14 Nederlandse uitgeversedities en 16 Engelse boekafbeeldingen. Acht Engelstalige film-/serieposters. Alle 38 URL’s zijn succesvol opgehaald en de afbeeldingen zijn visueel op titel en taal gecontroleerd. De Engelse boekafbeeldingen zijn officiële voorbeelden van uitgaven; een exacte ISBN-koppeling is nog niet voor elk Engels omslag bevestigd.

De Nederlandse ISBN’s komen uit de uitgeverspagina en de bijbehorende omslag. Een ISBN is geen garantie voor een unieke omslagvariant: de [fanclub documenteert hergebruik bij Carrie](https://www.stephenking.nl/skfnieuw/boeken/boeken-op-titel/boek-carrie/). Daarom zijn exacte afbeeldings- en editiebron apart opgeslagen. De huidige Carrie-bron wijst naar ISBN 9789024591350; er is geen omslag bij het andere, hergebruikte ISBN 9789021022789 geraden.

Afbeeldingen worden extern geladen vanaf de expliciet gecontroleerde officiële bron, met bronlink en rechthebbendecredit. Ze worden niet in deze repository herverdeeld en er wordt geen vrije licentie geclaimd. Het gaat om redactionele identificatie van de uitgave/verfilming. Voor hergebruik buiten deze context moet toestemming van de rechthebbende worden beoordeeld. Er worden geen toegangslimieten omzeild. Bij een laadfout blijft dezelfde afbeeldingsruimte bestaan en verschijnt de placeholder. Externe hosts kunnen de beschikbaarheid later wijzigen.

De [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) staat publieke embeds toe en is een geschikte bron voor toekomstige exact geverifieerde ISBN-koppelingen. Deze update gebruikt geen onbevestigde Open Library-zoekafbeeldingen en geen TMDb-API of API-sleutels.

| Werk | Taal | ISBN (indien bevestigd) | Bron |
| --- | --- | --- | --- |
| 'Salem's Lot | EN | Nog niet bevestigd | ['Salem's Lot](https://stephenking.com/works/novel/salems-lot.html) |
| 'Salem's Lot | NL | 9789024578108 | [Bezeten stad](https://www.lsuitgeverij.nl/boek/bezeten-stad/) |
| Billy Summers | EN | Nog niet bevestigd | [Billy Summers](https://stephenking.com/works/novel/billy-summers.html) |
| Carrie | EN | Nog niet bevestigd | [Carrie](https://stephenking.com/works/novel/carrie.html) |
| Carrie | NL | 9789024591350 | [Carrie](https://www.lsuitgeverij.nl/boek/carrie-2/) |
| Christine | EN | Nog niet bevestigd | [Christine](https://stephenking.com/works/novel/christine.html) |
| Christine | NL | 9789024561575 | [Christine](https://www.lsuitgeverij.nl/boek/christine-ebook/) |
| Cujo | EN | Nog niet bevestigd | [Cujo](https://stephenking.com/works/novel/cujo.html) |
| Cujo | NL | 9789021031354 | [Cujo](https://www.lsuitgeverij.nl/boek/cujo/) |
| Fairy Tale | EN | Nog niet bevestigd | [Fairy Tale](https://stephenking.com/works/novel/fairy-tale.html) |
| Firestarter | EN | Nog niet bevestigd | [Firestarter](https://stephenking.com/works/novel/firestarter.html) |
| Firestarter | NL | 9789024578146 | [Ogen van vuur](https://www.lsuitgeverij.nl/boek/ogen-van-vuur/) |
| Holly | EN | Nog niet bevestigd | [Holly](https://stephenking.com/works/novel/holly.html) |
| IT | EN | Nog niet bevestigd | [IT](https://stephenking.com/works/novel/it.html) |
| IT | NL | 9789021027432 | [IT](https://www.lsuitgeverij.nl/boek/it/) |
| Later | EN | Nog niet bevestigd | [Later](https://stephenking.com/works/novel/later.html) |
| Misery | EN | Nog niet bevestigd | [Misery](https://stephenking.com/works/novel/misery.html) |
| Misery | NL | 9789024578160 | [Misery](https://www.lsuitgeverij.nl/boek/misery/) |
| Pet Sematary | EN | Nog niet bevestigd | [Pet Sematary](https://stephenking.com/works/novel/pet-sematary.html) |
| Pet Sematary | NL | 9789021015873 | [Dodenwake](https://www.lsuitgeverij.nl/boek/dodenwake/) |
| The Dark Tower I: The Gunslinger | NL | 9789021049151 | [De scherpschutter](https://www.lsuitgeverij.nl/boek/de-scherpschutter/) |
| The Dead Zone | EN | Nog niet bevestigd | [The Dead Zone](https://stephenking.com/works/novel/dead-zone.html) |
| The Dead Zone | NL | 9789021043425 | [Dodelijk dilemma](https://www.lsuitgeverij.nl/boek/dodelijk-dilemma/) |
| The Green Mile | NL | 9789021025360 | [De groene mijl](https://www.lsuitgeverij.nl/boek/de-groene-mijl/) |
| The Long Walk | EN | Nog niet bevestigd | [The Long Walk](https://stephenking.com/works/novel/long-walk.html) |
| The Long Walk | NL | 9789021025131 | [De marathon](https://www.lsuitgeverij.nl/boek/de-marathon/) |
| The Shining | EN | Nog niet bevestigd | [The Shining](https://stephenking.com/works/novel/shining.html) |
| The Shining | NL | 9789021066561 | [De Shining (luxe editie)](https://www.lsuitgeverij.nl/boek/de-shining/) |
| The Stand | EN | Nog niet bevestigd | [The Stand](https://stephenking.com/works/novel/stand.html) |
| The Stand | NL | 9789021027791 | [De Beproeving](https://www.lsuitgeverij.nl/boek/de-beproeving/) |

| Adaptatie | Jaar | Afbeeldingsbron |
| --- | --- | --- |
| Carrie | 1976 | [Officiële bron](https://stephenking.com/works/movie/carrie.html) |
| Carrie | 2026 | [Officiële bron](https://stephenking.com/works/television/carrie.html) |
| Misery | 1990 | [Officiële bron](https://stephenking.com/works/movie/misery.html) |
| Stand by Me | 1986 | [Officiële bron](https://stephenking.com/works/movie/stand-by-me.html) |
| The Dark Tower | 2017 | [Officiële bron](https://stephenking.com/works/movie/dark-tower.html) |
| The Green Mile | 1999 | [Officiële bron](https://stephenking.com/works/movie/green-mile.html) |
| The Shawshank Redemption | 1994 | [Officiële bron](https://stephenking.com/works/movie/shawshank-redemption.html) |
| The Shining | 1980 | [Officiële bron](https://stephenking.com/works/movie/shining.html) |

## Carrie (2026)

[StephenKing.com](https://stephenking.com/works/television/carrie.html) en [Amazon](https://www.aboutamazon.com/news/entertainment/carrie-stephen-king-mike-flanagan-prime-video) bevestigen:

- Eerste seizoen verschenen op 7 oktober 2026 op Prime Video; acht afleveringen.
- Mike Flanagan: showrunner, schrijver en uitvoerend producent; Amazon MGM Studios produceert.
- Regie: Flanagan (1, 2, 7, 8), Kate Siegel (3), Axelle Carolyn (4), Kyra Sedgwick (5), Hiromi Kamata (6).
- Tien hoofdrollen zijn opgenomen, waaronder Summer H. Howell (Carrie), Samantha Sloyan (Margaret), Siena Agudong (Sue), Alison Thornton (Chris), Joel Oulette (Tommy), Josie Totah (Tina), Arthur Conti (Billy), Thalia Dudek (Emaline), Amber Midthunder (Miss Desjardin) en Matthew Lillard (Principal Grayle).
- De officiële Engelse serieposter is afkomstig van de afzonderlijke 2026-pagina, niet van de gelijknamige films.
- Amazon bevestigde op 22 oktober 2026 seizoen 2. De releasedatum daarvan wordt als onbevestigd getoond. Geen afzonderlijk productiejaar voor seizoen 1 bevestigd in deze controle: 2026 is het releasejaar.

Carrie (2013): [productiebedrijf](https://www.demilofilm.com/works/carrie) bevestigt Kimberly Peirce, hoofdrollen, bronroman en Amerikaanse release op 18 oktober 2013. Carrie (2002): [licentiehouder](https://www.swank.com/public-libraries/details/21296-carrie) bevestigt jaar, cast, bronroman en David Carson. Posters voor 2002 en 2013 zijn nog niet gekoppeld. De franchise omvat ook het vervolg The Rage: Carrie 2 (1999); dat stond niet in de import en is niet als directe romanadaptatie toegevoegd.

## Nog te controleren

De onderstaande lijsten zijn expliciet open werk. Voor alle overige credits, releasegegevens, Nederlandse vertalingen/bundelverschillen en de tien geïmporteerde Tower-verbanden is nog geen volledige onafhankelijke inhoudscontrole gedaan. Er wordt geen catalogusbrede released-status afgeleid uit een jaartal. De generieke categorie `Televisie` blijft een te verfijnen categorie; alleen waar bronnen zijn gecontroleerd, is een preciezer formaat vastgelegd. Onder meer `Other Worlds Than These` (2026) en de twee films zonder jaar vragen aparte actuele controle.

Nederlandse omslagen ontbreken voor 67 van de 81 unieke boeken; Engelse voor 65. Posters ontbreken voor 76 van de 84 adaptaties. Ontbrekend betekent niet dat er geen editie of poster bestaat.

### Nederlandse omslagen / edities nog controleren

- Rage
- Roadwork
- The Running Man
- Cycle of the Werewolf
- The Talisman
- Thinner
- The Eyes of the Dragon
- The Dark Tower II: The Drawing of the Three
- The Tommyknockers
- The Dark Half
- The Dark Tower III: The Waste Lands
- Needful Things
- Gerald's Game
- Dolores Claiborne
- Insomnia
- Rose Madder
- Desperation
- The Regulators
- The Dark Tower IV: Wizard and Glass
- Bag of Bones
- The Girl Who Loved Tom Gordon
- Dreamcatcher
- Black House
- From a Buick 8
- The Dark Tower V: Wolves of the Calla
- The Dark Tower VI: Song of Susannah
- The Dark Tower VII: The Dark Tower
- The Colorado Kid
- Cell
- Lisey's Story
- Blaze
- Duma Key
- Under the Dome
- 11/22/63
- The Dark Tower: The Wind Through the Keyhole
- Joyland
- Doctor Sleep
- Mr. Mercedes
- Revival
- Finders Keepers
- End of Watch
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
- Night Shift
- Different Seasons
- Skeleton Crew
- Four Past Midnight
- Nightmares & Dreamscapes
- Hearts in Atlantis
- Everything's Eventual
- Just After Sunset
- Stephen King Goes to the Movies
- Full Dark, No Stars
- The Bazaar of Bad Dreams
- If It Bleeds
- The Bachman Books

### Engelse omslagen / edities nog controleren

- Rage
- Roadwork
- The Running Man
- The Dark Tower I: The Gunslinger
- Cycle of the Werewolf
- The Talisman
- Thinner
- The Eyes of the Dragon
- The Dark Tower II: The Drawing of the Three
- The Tommyknockers
- The Dark Half
- The Dark Tower III: The Waste Lands
- Needful Things
- Gerald's Game
- Dolores Claiborne
- Insomnia
- Rose Madder
- The Green Mile
- Desperation
- The Regulators
- The Dark Tower IV: Wizard and Glass
- Bag of Bones
- The Girl Who Loved Tom Gordon
- Dreamcatcher
- Black House
- From a Buick 8
- The Dark Tower V: Wolves of the Calla
- The Dark Tower VI: Song of Susannah
- The Dark Tower VII: The Dark Tower
- The Colorado Kid
- Cell
- Lisey's Story
- Blaze
- Duma Key
- Under the Dome
- 11/22/63
- The Dark Tower: The Wind Through the Keyhole
- Joyland
- Doctor Sleep
- Mr. Mercedes
- Revival
- Finders Keepers
- End of Watch
- Sleeping Beauties
- Gwendy's Button Box
- The Outsider
- Elevation
- The Institute
- Gwendy's Final Task
- You Like It Darker
- Never Flinch
- Other Worlds Than These
- Night Shift
- Different Seasons
- Skeleton Crew
- Four Past Midnight
- Nightmares & Dreamscapes
- Hearts in Atlantis
- Everything's Eventual
- Just After Sunset
- Stephen King Goes to the Movies
- Full Dark, No Stars
- The Bazaar of Bad Dreams
- If It Bleeds
- The Bachman Books

### Posters en aanvullende adaptatiegegevens nog controleren

- A Good Marriage (2014)
- Apt Pupil (1998)
- The Boogeyman (2023)
- Cat's Eye (1985)
- Cell (2016)
- Children of the Corn (1984)
- Christine (1983)
- Creepshow (1982)
- Creepshow 2 (1987)
- Cujo (1983)
- The Dark Half (1993)
- The Dead Zone (1983)
- Doctor Sleep (2019)
- Dolan's Cadillac (2009)
- Dolores Claiborne (1995)
- Dreamcatcher (2003)
- Firestarter (1984)
- Firestarter (2022)
- Gerald's Game (2017)
- Graveyard Shift (1990)
- Hearts in Atlantis (2001)
- In the Tall Grass (2019)
- IT (2017)
- IT Chapter Two (2019)
- The Life of Chuck (2024)
- The Long Walk (2025)
- The Mangler (1995)
- Maximum Overdrive (1986)
- The Mist (2007)
- The Monkey (2025)
- Mr. Harrigan's Phone (2022)
- Needful Things (1993)
- The Night Flier (1997)
- Pet Sematary (1989)
- Pet Sematary (2019)
- Riding the Bullet (2004)
- The Running Man (1987)
- The Running Man (2025)
- 'Salem's Lot (2024)
- Secret Window (2004)
- Silver Bullet (1985)
- Thinner (1996)
- 1408 (2007)
- 1922 (2017)
- The Girl Who Loved Tom Gordon (jaar onbevestigd)
- Suffer the Little Children (jaar onbevestigd)
- 11.22.63 (2016)
- Bag of Bones (2011)
- Big Driver (2014)
- Carrie (2002)
- Chapelwaite (2021)
- Desperation (2006)
- The Institute (2025)
- IT (1990)
- IT: Welcome to Derry (2025)
- The Langoliers (1995)
- Lisey's Story (2021)
- The Mist (2017)
- Mr. Mercedes (2017)
- Nightmares & Dreamscapes (2006)
- 'Salem's Lot (1979)
- 'Salem's Lot (2004)
- The Shining (1997)
- Sometimes They Come Back (1991)
- The Stand (1994)
- The Stand (2020)
- The Tommyknockers (1993)
- Trucks (1997)
- Under the Dome (2013)
- The Outsider (2020)
- The Dead Zone (2002)
- Haven (2010)
- Castle Rock (2018)
- Rose Red (2002)
- Storm of the Century (1999)
- Carrie (2013)
