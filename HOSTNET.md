# Publiceren bij Hostnet

De website blijft statisch en inhoudelijk identiek. GitHub blijft het bronarchief; GitHub Pages blijft beschikbaar tijdens de verhuizing.

## Eenmalige inrichting

- SSH-host: `ssh.cxek53six.service.one`, gebruiker: `cxek53six_u`, poort 22.
- De bestaande lokale sleutel staat in `~/.ssh/hostnet_ed25519`. Alleen het `.pub`-bestand hoort in Mijn Hostnet; de privésleutel blijft buiten deze repository. Gebruik een passphrase en ontgrendel zo nodig lokaal met `ssh-add ~/.ssh/hostnet_ed25519`.
- De verbinding gebruikt uitsluitend public-key-authenticatie en een al vertrouwde serverkey in `~/.ssh/known_hosts`. Geen automatische acceptatie of uitgeschakelde hostcontrole. Controleer een onbekende serverfingerprint onafhankelijk bij Hostnet.
- Zorg in Hostnet voor een afzonderlijke route voor **kingverse.eddyhuisman.nl**, de juiste documentroot, DNS en een geldig HTTPS-certificaat. Kingverse heeft een aparte root `/webroots/sites/kingverse.eddyhuisman.nl`, naast de bestaande root met daphne en theorie. De fysieke prefix staat uitsluitend in de lokale configuratie. De nameservers staan bij Cloudflare; DNS-wijzigingen horen daar, zonder de nameservers te wijzigen.
- Kopieer `deploy/hostnet.example.json` naar `.hostnet/config.json` en vul uitsluitend de werkelijk gecontroleerde Kingverse-documentroot in. Het configuratiebestand, pakketten en back-ups worden door Git genegeerd.

Officiële instructies: [SSH en SFTP](https://helpdesk.hostnet.nl/hc/nl-nl/articles/5690291022737-SSH-en-sftp-gebruiken-op-jouw-webhostingpakket), [SSH-sleutels](https://helpdesk.hostnet.nl/hc/nl-nl/articles/5758439428369-SSH-keys-aanmaken). Schakel SSH/SFTP in, voeg alleen de public key toe en beperk waar mogelijk toegang tot je eigen publieke IP. De verouderde RSA-compatibiliteitsopties uit de handleiding zijn hier niet nodig en worden niet standaard ingeschakeld.

## Herhaalbare publicatie

```sh
python3 scripts/hostnet_deploy.py package
python3 scripts/hostnet_deploy.py check
python3 scripts/hostnet_deploy.py deploy
```

`package` kopieert uitsluitend getrackte openbare websitebestanden naar `.hostnet/site`, controleert lokale HTML/CSS-verwijzingen en bewaart een SHA-256-manifest buiten de website. Bronbestanden, tests, Git, configuratie en back-ups worden niet gepubliceerd. De bestaande HTML, JS, CSS, gegevens en afbeeldingen worden niet herschreven.

`check` controleert SSH, SFTP, de doelmap, de fysieke Hostnet-routekoppeling, `tar` en `rsync`. `deploy` vereist een schone Git-werkboom, maakt **altijd eerst** een volledige lokale back-up van de bestaande doelmap, controleert het archief en uploadt daarna met rsync over SSH. Bestanden worden per transfer via tijdelijke bestanden vervangen; HTML komt als laatste. Dit is geen atomaire omschakeling van de hele site. Er wordt niet gewist en oude assets blijven beschikbaar. Bestaande `.htaccess`, `.user.ini`, `index.php` of `web.config` blokkeren upload totdat ze apart zijn beoordeeld. Alleen een expliciet beoordeelde SHA-256 in `approvedServerConfig` laat het bestand onveranderd behouden. Hostnets standaard `.htaccess` bevat uitsluitend een DirectoryIndex-regel en blijft staan.

Bij de eerste verhuizing kan `upload` afzonderlijk worden gebruikt zolang DNS/HTTPS nog worden ingericht; dit meldt uitsluitend uploadsucces. Daarna blijft `verify` verplicht.

Na upload vergelijkt `verify` representatieve pagina's, directe entiteitsbestanden en de belangrijkste achtergronden via HTTPS met het lokale manifest. Controleer daarnaast in de browser: Reading Room → bibliotheek → detail; Crossroads → zoeken → detail → Connection Map; opgeslagen taal; mobiel; externe covers/posters en hun fallback. Externe beeldbronnen kunnen op een andere Referer reageren: geen omzeiling of stilzwijgende vervanging.

## Back-up en herstel

```sh
python3 scripts/hostnet_deploy.py backup
python3 scripts/hostnet_deploy.py verify
```

Back-ups staan uitsluitend lokaal onder `.hostnet/backups`, met afgeschermde rechten en een SHA-256-ontvangstbewijs. Ze worden nooit naar een webroot geüpload. Ze omvatten bestanden inclusief verborgen bestanden, geen afzonderlijke database-export. Herstel gebeurt bewust vanuit het juiste gevalideerde archief; verwijder of overschrijf andere sites niet. Laat GitHub Pages actief totdat Hostnet en de browserroutes aantoonbaar goed werken. DNS, HTTPS en GitHub Pages-instellingen worden door dit script niet aangepast.

Lokale publicatie is de eerste automatisering. Een GitHub Actions-deploy kan later met een aparte beperkte deploysleutel in GitHub Secrets en een vast toegestaan uitgaand IP; de persoonlijke privésleutel wordt niet naar GitHub gekopieerd.
