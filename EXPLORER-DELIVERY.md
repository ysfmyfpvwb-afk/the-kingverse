# The Kingverse 1.6 — Connected Explorer preview

Peildatum: 25 oktober 2026. Huidige preview: **1.6.1 UX refinement**, voortbouwend op previewcommit `48ec18b` en foundationcommit `87ef9dd`. Dit is de afzonderlijk geautoriseerde preview vóór de volledige schaduwmigratie. De standaardapplicatie blijft 1.5.1.

## Routes en functionaliteit

- Preview: https://ysfmyfpvwb-afk.github.io/the-kingverse/explorer/
- The Talisman: `explorer/work/000001/`
- Black House: `explorer/work/000002/`
- Auteurs: `explorer/person/000001/` en `explorer/person/000002/`.
- Personages: `explorer/character/000001/` en `explorer/character/000002/`.
- The Territories: `explorer/location/000001/`.

Engelse statische boekpagina’s met originele titel, korte eigen premisseomschrijving, bestaande Engelse editiecover met credit/fallback, beide co-auteurs en hun hele-tekstrol, bronrelease met maand-/dagprecisie, vier EN/NL-editievoorbeelden en veldgerichte bronnen. Het donkere, groene/gouden ontwerp behoudt de Kingverse-identiteit en gebruikt systeemfonts; geen framework, externe fontdependency of extra npm-package.

Eén klikbare kaart per relatie combineert navigatie, uitleg, zekerheidslabel en uitklapbare bronnen, afgeleid van bestaande connections/credits. De eerder dubbele visuele en tekstuele kaarten zijn samengevoegd. Filters werken op doeltype en zekerheid. Personage-, locatie- en auteurspagina’s hebben werkende terugkoppelingen; omgekeerde relaties zijn afgeleid, niet dubbel opgeslagen. Externe Tower-doelen openen de bestaande exacte legacyboekroute. De huidige homepage, URL’s en opgeslagen taalkeuze zijn niet aangepast. De preview is uitsluitend Engels.

## Gegevens en grenzen

Twee werken, twee auteurs met vier co-auteurscredits, twee personages (Jack Sawyer en Lily Cavanaugh Sawyer), één locatie, vier editie-/covervoorbeelden en acht unieke connecties blijven de scope. Vijf bronnen en nu 115 claims: alleen twee eigen Engelse inleidingen zijn toegevoegd met afzonderlijke claims `clm:000114`/`clm:000115`. De officiële werkpagina’s zijn daarvoor opnieuw gelezen; geen synopsis of boektekst is gekopieerd. Canonieke IDs, schema en bestaande relaties blijven ongewijzigd.

Vijf van de acht unieke connecties bevatten hoogstens premisse-informatie en staan standaard in de relevante pagina’s. Drie plotconnecties (twee officiële Tower-verwijzingen en één sterk geïmpliceerd kosmologieverband) worden pas geladen na “Reveal plot connections”. Zij kunnen beide boeken spoilen. De keuze wordt niet opgeslagen; navigatie en terugkeer uit de browsercache herstellen de veilige stand. Plottekst ontbreekt in de standaard-HTML, metadata en toegankelijke namen. De JSON is publiek beschikbaar: dit is een leesvoorkeur, geen toegangsbeveiliging.

Zekerheid en bronstatus blijven afzonderlijk: explicit, strongly implied en interpretative hebben eigen labels/filteropties. Er is **geen interpretatieve relatie** geregistreerd en er is er geen verzonnen voor de preview. De sterk geïmpliceerde relatie blijft als voorlopig onderbouwd herkenbaar.

Editie-identiteit is onvolledig: Engelse ISBN’s ontbreken; druk, editiepublicatiedatum en vertaler zijn niet bevestigd. De bronrelease is geen onafhankelijk bewezen eerste publicatie. Geen complete personagebiografieën, verschijningsindex of actuele adaptatieprojecten zijn toegevoegd. Geen nieuwe beeldresearch. Bestaande IMDb-hergebruikvragen blijven `needs-review`; deze preview importeert geen IMDb-data, scores of omschrijvingen. Betaalde API’s blijven uitgesloten.

## Reproduceerbaarheid en automatische controle

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
npm run build:explorer
npm run validate:foundation
npm test
```

De generator valideert de v2-bundle vóór schrijven. `scripts/explorer_model.cjs` leest de canonieke entiteiten, het register en veldclaims; legacydata wordt uitsluitend tijdens de build gebruikt voor externe verwijzingen. De browser laadt geen DB/MEDIA-catalogus, volledige claims/snapshots of npm-code.

55 tests slagen: 26 bestaande catalogustests, 17 foundationtests en 12 Explorer-tests. Nieuwe controles omvatten deterministische gegenereerde bestanden, alle statische en geopenbaarde lokale links onder een GitHub Pages-subpad, afwezigheid van plottekst in veilige HTML, bron-/editielabels, omgekeerde navigatie, escaping, opt-in laden, filters, mislukte fetch met retry, afbeeldingsfallback en herstel na browsercache-terugkeer. Aanvullende UX-regressies controleren één kaart per relatie met aparte brondisclosure, herstel van een fout-/cachetoestand bij afbeeldingen en filtering bij tientallen relaties. Decoratieve verbindingslijnen verdwijnen bij meer dan acht zichtbare kaarten, terwijl alle kaarten en filters beschikbaar blijven. De validator meldt `valid: true`, `errors: []`.

De bestaande catalogus- en rapportgeneratoren zijn uitgevoerd: actieve runtime, catalogus, media, Sources-pagina en auditcijfers blijven byte-identiek aan de foundation. JavaScript-syntaxchecks worden voor alle runtime-/build-/testmodules uitgevoerd. Generatie en tests werken offline.

Ongecomprimeerde lokale payloads: grootste HTML 12420 bytes, CSS 16217 bytes, JS 4920 bytes en grootste optionele plot-JSON 1812 bytes. Geen detail-JSON op de initiële route, geen zoekindex of referentiesnapshot. Deze getallen sluiten de externe cover uit; geen claim over mobiele overdracht of algemene laadsnelheid.

## Browsercontrole en publicatie

Gecontroleerd in de echte in-app browser op 1440 × 1000, 768 × 1024, 390 × 844 en 320 × 568: boekpagina’s, geladen Engelse covers, kaart, filters, leeg resultaat, expliciet onthullen en verbergen van plotverbanden, reset bij navigatie, personage-/locatie-/auteursnavigatie en toetsenbord-Enter. Geen horizontale overflow in de gemeten views; geen waargenomen JavaScript-consolefouten in de gecontroleerde Explorer-flows.

De oorspronkelijke applicatie is ook geopend: zoeken op Talisman met live invoer, Enter en zoekknop, detailmodal, sluiten en NL-taalwisseling functioneren. Alle bestaande regressietests blijven slagen. Kernnavigatie en bronnen zonder JavaScript zijn statisch aanwezig en automatisch op links gecontroleerd; er is geen afzonderlijke browserronde met uitgeschakeld JavaScript uitgevoerd. De echte Engelse cover-URL’s gaven beide HTTP 200 met JPEG-data. Een tijdelijke lokale QA-server simuleerde een 404 en verwees bij een volgende poging door naar de bestaande officiële cover: foutstatus, Retry cover en zichtbaar herstel zijn in de browser getest. De QA-server en fixture zijn geen publicatiebestanden. Geen volledige screenreaderaudit of volledige browsermatrix.

Commit/push volgen pas na de kritieke controles. De exacte commit, Pages-deployment en bytevergelijking van gepubliceerde bestanden worden na publicatie afzonderlijk in het eindbericht bevestigd; deze notitie claimt ze niet vooraf.


## UX-verfijning 1.6.1 en coveronderzoek

De goedgekeurde zwarte/donkergroene stijl, subtiel goud en literaire typografie blijven behouden. Mobiel staat de titel bovenaan met beide auteurs, rollen en bronjaar; een compacte bestaande Engelse cover staat ernaast. De korte introductie en directe knop naar de connecties volgen meteen. Op 390 px breed zijn titel, auteurs en jaar binnen de bovenste circa 270 px zichtbaar. Publicatiedetails en hun bronnen zijn uitklapbaar. Desktop behoudt een ruimere tweekolomsindeling.

Op smalle schermen staan de relatiekaarten in één kolom onder de centrale You are here-kaart. Eén native, uitgerekte link maakt de kaart klikbaar; de bronnen blijven aparte toetsenbordbedienbare disclosures met eigen links. De kaart bevat een compact type-icoon, label, zekerheid en uitleg. Navigatie gebruikt dezelfde stabiele Explorer-routes. Filters en spoilerbescherming blijven werken, ook bij terugnavigatie. Er zijn geen v2-records, IDs, relaties of standaardapplicatiebestanden gewijzigd.

**Coverbevinding:** de bestaande Engelse bron-URL’s zijn bereikbaar en de afbeeldingen laden tijdens deze controle. De exacte oorspronkelijke netwerk-/browserfout bij de gebruikersreview kon niet worden gereproduceerd; er is geen bewijs voor een foutieve cover- of editiekoppeling. Wel bleef de oude foutafhandeling een afbeelding verbergen na een mislukte aanvraag (`complete` zonder natuurlijke breedte of een `error`), zonder herstel bij een latere succesvolle `load` en zonder herlaadactie. Dit is hersteld: een succesvolle of al gecachete load herstelt de afbeelding, en Retry cover probeert dezelfde goedgekeurde URL opnieuw met normale browsercache. Geen proxy, alternatieve willekeurige cover, lokale herverdeling of nieuwe beeldresearch. De placeholder is compact, maar is niet als enige oplossing gebruikt. Externe beschikbaarheid blijft afhankelijk van de bronserver.

## Aanbevolen volgende fase

Beoordeel de bezoekerservaring van deze twee boeken. Plan daarna de volledige fase-2-schaduwmigratie met een veldmapping en verschillenrapport, zonder omschakeling van de standaardsite tot de migratiepoort is gehaald. Werk editie-onzekerheden en bron-/rechtenvragen gericht af. De uitgebreide Explorer en verdere entiteiten volgen op dat fundament.
