# The Kingverse — permanente projectstandaard

## Huidige uitvoeringsprioriteit

Rond eerst de Engelse structuur en pagina’s af. Engels is de standaard voor nieuwe bezoekers; respecteer een opgeslagen taalkeuze. Behoud bestaande NL-functionaliteit, maar stel verdere Nederlandse uitwerking en nieuwe beeldresearch uit tot een volgende door de gebruiker gestuurde fase.

## Doel en architectuur

The Kingverse is een tweetalige encyclopedie van Stephen Kings literaire werken, Richard Bachman-publicaties, samenwerkingen, adaptaties en aantoonbare Dark Tower-connecties. Behoud de statische GitHub Pages-architectuur, bestaande functionaliteit en identiteit. Geen backend, publieke API-sleutels of tokens voor basisfunctionaliteit.

## Bronnenhiërarchie en verificatie

1. Gebruik https://stephenking.com/works/all/ als primaire inventarisatiestandaard. Vergelijk ook de officiële bibliografie, gespecialiseerde categorieën en de samenwerkingslijst.
2. De officiële site is niet automatisch onfeilbaar of uitputtend. Leg conflicten tussen index, detailpagina, editie, eerste publicatie, festivalpremière en distributiedatum vast. Neem een gesynthetiseerde eerste dag van een maand nooit als bevestigde dag over.
3. Gebruik waar toegankelijk Justin Brooks, *Stephen King: A Primary Bibliography of the World's Most Popular Author*, voor onafhankelijke dieptecontrole. Vermeld welke editie/onderdelen daadwerkelijk zijn ingezien. Een uitgeversbeschrijving is geen raadpleging van het hele boek.
4. Gebruik voor Nederlandse titels en edities uitgevers- en bibliotheekcatalogi; de Nederlandse fanclub is aanvullend. Verifieer de taal van de editie, niet alleen die van de website.
5. Voor film en TV gaan actuele officiële productie-, distributeurs- en streamingbronnen voor. Betrouwbare filmdatabases zijn aanvullend. Een oude TBD-pagina bewijst geen actuele productie of releasedatum.
6. Bewaar bron-URL, datum, precisie, gecontroleerde velden, tegenstrijdigheden en onzekerheden. Een gecontroleerde titel betekent niet dat het hele record of zijn eerste publicatie onafhankelijk bevestigd is.
7. Respecteer toegangsbeperkingen en limieten. Registreer ontoegankelijke bronnen; omzeil ze niet. Publiceer geen overgenomen synopsis- of boekteksten als auditdata.

## Werk, publicatie, bundel, vertaling en editie

- Een literair werk heeft één stabiele `workId`. Meerdere indexweergaven verwijzen naar dezelfde identiteit.
- Een bundel is een eigen collectie met expliciete veel-op-veelrelaties naar de opgenomen werken. Verschillende verhalen en bundels met dezelfde titel zijn afzonderlijke identiteiten.
- Registreer eerste publicatie los van de datum van een latere bundel, vertaling of editie. Heruitgaven, ISBN-varianten en seriële delen verhogen het aantal unieke werken niet.
- Nederlandse vertalingen en specifieke uitgaven horen in `editions`; covers verwijzen naar een aantoonbare editie via `editionId`/`coverId`.
- Bewaar de oorspronkelijke 1.4-import in `data/import-v1.4.json` en de toenmalige weergavedata in `data/legacy-v1.4.json`. Documenteer consolidaties, correcties en verplaatsingen. Verwijder geen gegevens zonder controleerbare reden.

## Talen en afbeeldingen

- NL: Nederlandse titel en cover van de juiste Nederlandse editie waar gecontroleerd. EN: originele Engelse titel en Engelse editiecover.
- Een Engelse cover is op NL toegestaan als duidelijk gemarkeerde fallback. Een niet bevestigde Nederlandse editie betekent niet dat er geen vertaling bestaat.
- Beeldkoppeling vereist werk, taal en editie; geen willekeurige zoekafbeelding, fanart, tijdschriftillustratie of filmposter als boekcover.
- Controleer URL, werkelijk afbeeldingsbestand, titel en taal visueel, bron en gebruiksvoorwaarden. HTTP 200 alleen bewijst geen juiste afbeelding. Publiceer alleen goedgekeurde kandidaten; behoud broncredit en claim geen vrije licentie zonder bewijs.
- Gebruik bij uitval een stabiele placeholder, lazy loading en normale browsercache. Respecteer externe beperkingen; herverdeel afbeeldingen niet zonder grondslag.

## Individuele verhalen

- Zoek geen fictieve eigen covers voor verhalen die alleen in een bundel verschenen. Houd elk verhaal zelfstandig doorzoekbaar.
- Toon standaard de editiecover van de eerste/relevantste geregistreerde bundel, in de actieve taal, met aanklikbaar “Onderdeel van …” / “Collected in …”. Leg andere bundelrelaties apart vast.
- Een eigen cover is alleen toegestaan bij een aangetoonde zelfstandige editie. Een artikelafbeelding of filmbeeld is geen bewijs.
- Tel verhalen zonder zelfstandige boekuitgave nooit als ontbrekende eigen cover. Rapporteer boeken/bundels, bewezen zelfstandige verhaaluitgaven en bundelcovergebruik afzonderlijk, zonder dubbeltelling.

## Samenwerkingen en makersrollen

- Meerdere auteurs zijn nooit een reden om een bevestigd gezamenlijk werk uit te sluiten. Vergelijk de volledige officiële samenwerkingslijst en relevante aanvullende bronnen.
- Registreer alle bevestigde namen met rollen: auteur/co-auteur, afzonderlijke verhaallijn, redacteur, bundelbijdrager, illustrator, fotograaf, voorwoord of andere maker. Een illustrator of voorwoordschrijver is geen co-auteur van de tekst.
- Houd onvolledige makerslijsten expliciet onzeker. Presenteer een bijdragenbundel niet als gezamenlijk geschreven roman of een aanbeveling als auteurschap.
- Behoud het filter “Samenwerkingen / Collaborations” en dezelfde zoek-, taal-, editie-, adaptatie- en detailfunctionaliteit. Controlevoorbeelden: The Talisman, Black House, Sleeping Beauties; de inventarisatie is niet tot deze voorbeelden beperkt.
- Richard Bachman is een pseudoniem van Stephen King, geen tweede co-auteur.

## Adaptaties en Dark Tower

- Film-/serietitels en posters blijven Engels in beide interfaces. Gebruik een stabiele identiteit die remakes onderscheidt; koppel nooit alleen op titel.
- Leg formaat, bronwerk, relevante credits, distributie, releasedatum en bevestigde status afzonderlijk vast. Onderscheid romanadaptatie, verhaaladaptatie, prequel, vervolg en origineel scenario.
- Een gedeelde foutieve bron-URL voor twee remakes mag geen poster of credits van de ene naar de andere overbrengen.
- Tower-connecties noemen betrokken werken, concrete personages/plaatsen/concepten, toelichting, onderbouwing en zekerheid: expliciet, sterk geïmpliceerd of interpretatief. Gedeelde algemene thema's alleen zijn onvoldoende.
- Bied directe navigatie vanuit boeken/verhalen naar gerelateerde werken. Markeer interpretatie zichtbaar.

## Code, toegankelijkheid en tests

- Behoud live zoeken, één gedeelde zoekactie voor knop en Enter, filters, sortering, opgeslagen taalvoorkeur en detailnavigatie.
- Behoud toetsenbordbediening, zichtbare focus, beschrijvende alt-teksten, semantische zoekknop, modal focusbeheer en responsive weergave.
- Houd gegenereerde catalogus en rapporten reproduceerbaar. Pas brondata/overrides en scripts aan, niet uitsluitend gegenereerde bestanden.
- Voer `python3 scripts/build_catalog.py`, `python3 scripts/report_quality.py`, JavaScript-syntaxchecks en `node --test tests/*.test.cjs` uit. Controleer de diff op onverwachte gegenereerde wijzigingen.
- Test integriteit van werkidentiteiten, editie/covers, bundelrelaties, co-auteursrollen, remake-identiteiten en auditcijfers. Test visueel zoeken (live/knop/Enter), beide talen, filters, details, foutafbeeldingen en mobiel/tablet/desktop. Rapporteer concrete verificatiegrenzen.
- Markeer een categorie alleen volledig vergeleken als alle records binnen de expliciet vastgelegde scope daadwerkelijk zijn vergeleken. Claim nooit catalogusbrede volledigheid op grond van één bron of alleen de bestaande records.

## Git en publicatie

Werk vanuit de bestaande repository en behoud onverwachte gebruikerswijzigingen. Geen force-push. Controleer branch, remote, diff en tests; commit uitsluitend gecontroleerde wijzigingen. Push naar `origin/main` wanneer de opdracht publicatie autoriseert. Stop bij conflicten of branchregels die toestemming vereisen. Controleer de deployment voor de juiste commit en controleer de daadwerkelijk gepubliceerde bestanden/site. Meld push-, publicatie- en live-verificatiestatus afzonderlijk; claim geen succes zonder bewijs.
