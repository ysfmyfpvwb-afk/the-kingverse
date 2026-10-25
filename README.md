# The Kingverse

Bilingual, static Stephen King encyclopedia on GitHub Pages. No build step, backend, secret or dependency install is required for normal use.

English is the default for new visitors. Existing saved language preferences are respected. Further Dutch development and new image research are deferred until a later user-directed phase.

## Pages

- `index.html#books`: library, editions, collaborations and publication history.
- `index.html#stories`: unique stories/contributions with clickable collection memberships and edition-backed collection covers.
- `index.html#films`: adaptation identities, source works and credits.
- `index.html#tower`: sourced, confidence-labelled Dark Tower connections.
- `about.html`: bilingual Sources & Method page.

Details use shareable `#books?item=books%3Acarrie` style URLs. Search/filter/sort state is encoded in the hash; the language preference stays in local storage when available.

## Preview

```sh
python3 -m http.server 8765
```

## Rebuild the data and reports offline

```sh
python3 scripts/build_catalog.py
python3 scripts/report_quality.py
```

The committed factual snapshots in `data/reference/`, editorial mappings, contributor roles and image review ledger are inputs. `catalog.js`, `media.js`, `data/audit.json`, `data/quality-summary.json`, `DATA-QUALITY.md` and `about.html` are generated. The original raw 1.4 import remains in `data/import-v1.4.json`; its view data remains in `data/legacy-v1.4.json`.

`works` represent unique literary identities; `books` and `stories` are views, `collectionIds` are memberships, `publications` describe serial parts/variants, `editions` describe language/ISBN/publication examples, and `covers` reference those editions. A collection date is not automatically a story’s first publication. A credited photographer or anthology contributor is not a co-author of every text.

## Validate

```sh
node --check app.js
node --check about.js
node --check catalog.js
node --check media.js
node --test tests/*.test.cjs
```

See `VALIDATION.md` for performed browser checks and `DATA-QUALITY.md` for source definitions, open fields and limits. Read `AGENTS.md` before future work.

## Refresh sources (separate from ordinary development)

`python3 scripts/collect_reference.py` and `python3 scripts/collect-dutch.py` collect factual fields with two workers and cache them under `/tmp/kingverse-reference`. No synopsis text is stored in the committed snapshots. `scripts/parse_bibliography.py` parses the companion bibliography cached by the official collector. `scripts/collect_categories.py` and `scripts/collect_collaborations.py` refresh the separate category/collaboration comparisons. Access failures remain explicit; do not bypass restrictions.

Image research is a separate later phase at the user’s request. `scripts/check_images.py` checks availability and makes temporary contact sheets; it never automatically approves a candidate. Only records explicitly approved in `data/image-review.json` enter the public artwork mappings. Do not create own covers for collected stories or use story illustrations as edition evidence.

Publish tested, reviewed changes to `origin/main` without force push. GitHub Pages serves the repository root. Verify the deployment commit and the actual live files separately.

## 1.6 foundation (shadow dataset)

The live site continues to use the unchanged 1.5.1 `catalog.js` / `media.js`. Only The Talisman and Black House have been represented in the separate v2 proof of concept; this is not a complete catalog migration or a new Explorer page.

```sh
npm ci --ignore-scripts
npm run validate:foundation
npm test
```

Node.js 20 or later and npm are needed for these developer commands. Ajv is a pinned development dependency, never a browser dependency. After installation the validator and tests run offline. `npm run validate:foundation` is read-only and exits nonzero on schema, reference, provenance, role, membership, date/ISBN, cover, ID/route or legacy-compatibility errors. It also checks the hashes of the unchanged live runtime files.

`schemas/foundation.schema.json` defines the entities. `data/v2/` contains their separate tables, a permanent opaque ID/legacy-alias registry and the baseline manifest. `scripts/foundation_compat.cjs` resolves legacy references and produces a shadow projection of migrated view facts; it does not replace the active runtime router. Existing source snapshots remain the migration evidence.

No paid IMDb API or other paid service is planned or activated. Actual legacy IMDb acquisition and unresolved reuse permissions are recorded in `data/reviews/screen-data-rights.json`; no OMDb integration was found. TMDb was only researched as a conditional free alternative, not connected. See `FOUNDATION-DELIVERY.md`, `ARCHITECTURE.md`, `ROADMAP.md` and the generated `DATA-QUALITY.md`.
