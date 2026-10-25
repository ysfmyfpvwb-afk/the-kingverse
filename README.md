# The Kingverse

A bilingual, buildless Stephen King bibliography, published on GitHub Pages.

## Run locally

```sh
python3 -m http.server 8765
```

Open http://localhost:8765. No dependency install, backend, API key or build is required.

## Check

```sh
node --check app.js
node --check catalog.js
node --check media.js
node --test tests/catalog.test.cjs
```

`catalog.js` retains the imported working bibliography. `media.js` contains explicit edition/language and adaptation/year artwork mappings, with sources and verification dates. `app.js` retains navigation, search, filters and bilingual details; it consolidates two documented duplicates in the displayed view. Language is saved locally when browser storage is available. `styles.css` retains the original visual identity with responsive cover/poster cards.

See [DATA-QUALITY.md](DATA-QUALITY.md) for verified scope and outstanding records. To add artwork, first verify its title, language and edition (or adaptation year), then record the exact source, image URL, credit and check date. Do not use search-result images or work-level cover guesses. Keep Dutch placeholders when a known Dutch translation lacks a verified cover. Use the browser's normal image cache and lazy loading; failed image URLs are cached in memory for the current visit and replaced with a stable placeholder.

Publish by pushing tested changes to `main`. GitHub Pages must use the repository root. Do not force-push.
