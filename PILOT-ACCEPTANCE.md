# The Kingverse 1.9 — Explorer pilot acceptance

Review date: 27 October 2026. Baseline: `1bf82bb232d9f8e0f4ad8dd08724883ffa9b3c76` (Batch 06).

Public route: [Connected Explorer pilot](https://ysfmyfpvwb-afk.github.io/the-kingverse/explorer/pilot/). The standard archive and original `/explorer/` remain separate, unchanged experiences. This report records local acceptance; the delivery message separately reports the exact release SHA, push, Pages deployment and live checks.

## Scope and acceptance decision

**Go for a separate English pilot; no approval to replace either existing experience.** All 546 canonical projected identities have a detail entry, across works, collections, editions, adaptations, people, characters, locations and series. Search includes 540 safe identities; six plot-only identities start behind an unnamed gate. All 94 native relationships retain their provenance: 66 default and 28 plot connections. These totals describe the current projection, not a complete bibliography or independently verified catalog.

The interface provides compact mobile headers, linked creators, recorded dates with honest precision, edition examples, collection memberships, a central “You are here” relationship map, type/certainty filters, incremental lists and a title/type/alternative-title search dialog. Whole relationship cards navigate; evidence disclosures remain separate keyboard controls. Repeated relationships are not rendered as a second textual graph. Canonical series membership supplies the direct trilogy rail. No hardcoded story identities or new canonical relationships are introduced.

Source-supported fields do not certify an entire record. Seven native relationships remain provisional. The 54 unresolved literary source candidates are a separate navigable hypothesis section, not extra confirmed edges. Missing metadata and incomplete introduction/edition histories are stated explicitly. Credits preserve contributor roles; Richard Bachman remains a pseudonym of the existing author identity.

## Executed acceptance cases

| Case | Outcome |
| --- | --- |
| The Talisman → Black House → Other Worlds Than These | Canonical IDs `wrk:000001`, `wrk:000002`, `wrk:000067`; direct sibling links, reverse navigation, creator roles and source disclosures preserved. |
| 1408 (`wrk:000161`) | One story identity; Everything’s Eventual and Stephen King Goes to the Movies remain distinct memberships, the latter visibly provisional. Collection placeholder, no invented standalone cover. |
| EN/NL editions | The Talisman’s English edition example and De talisman (POD) open independent edition details and return to the same work; unknown date/publisher/format are not inferred. |
| Firestarter | 1984 and 2022 films have distinct IDs/year labels; both navigate from the work and back. |
| Uncertain source | The Dark Tower (2017) has its confirmed series link and six separately qualified volume candidates. Reverse candidate links remain hypotheses. |
| Character/place/series | Jack Sawyer, The Territories and The Dark Tower show supported reverse work links. Series volume/interlude labels retain evidence and do not invent numbered positions. |
| Long lists | Stephen King’s 258 recorded credits and Nightmares & Dreamscapes’ 23 memberships load six rows per chunk; new cards receive keyboard focus. |
| Search | English titles, Zwart huis, Talisman edition filtering and type filtering work; Enter/search button share submission, live input updates; Escape closes and returns focus. Plot-only Father Callahan returns no result. |
| Spoilers | Direct sensitive ID initially unnamed in title/body; reveal is explicit; navigation, Back and refresh restore the gate. Delayed plot responses and BFCache restoration are covered by client tests. |
| Sources, filters and keyboard | Type/certainty combinations, zero-result state, Enter on cards and source disclosures, map pagination, focus on navigation and dialog dismissal checked. Native landmarks/labels and live status appear in the accessibility tree. |
| Responsive | Browser viewports 390×844, 768×1024 and 1440×1000 checked; single mobile map column, wider two-column layout and no observed horizontal document overflow. |
| Prior website/preview | Existing saved NL preference was respected; switching to EN, Talisman search/Enter and its modal worked. Original Explorer Talisman and Black House links worked. Existing image outages remain outside the pilot. |

This is a desktop in-app browser with resized viewports, not a physical iPhone, Safari, VoiceOver or NVDA session. Semantic accessibility-tree and keyboard checks passed in the tested flows; a full assistive-technology audit is still required before broader rollout. No throttled 4G, real-user telemetry, exhaustive browser matrix or worldwide bibliographic completeness is claimed.

## Payload and performance

The generator enforces **48 KiB per entity/list/plot payload**, with six list items per page. Source URLs are de-duplicated inside each payload. Content-hashed JS/CSS and a data version parameter support normal browser cache; successful requests are also reused in memory. Failed requests can retry. The whole diagnostic readiness projection is never fetched by the visitor runtime.

| Artifact | Raw bytes | Gzip estimate (offline) |
| --- | ---: | ---: |
| HTML shell | 3301 | — |
| JavaScript including shared helpers | 25155 | 8848 |
| CSS | 8543 | 2607 |
| Lazy search index | 89103 | 10370 |
| The Talisman default JSON | 22402 | 2519 |
| Largest default entity | 28700 | — |
| Median default entity | 4793 | — |
| Largest list chunk | 9118 | — |

Measured locally on the final UI build at 390 px: The Talisman content ready at **52 ms** from navigation start, entity render/fetch step **14 ms**; Black House client navigation **18 ms**. Default initial JSON was **22,402 bytes**, cumulative after Black House **43,539 bytes**. These are one local, cached development-browser samples, not network benchmarks or Core Web Vitals. Gzip values are calculated estimates, not claims about CDN transfer encoding.

At that viewport the title begins at y=169 px, the trilogy rail at y=377 px and the connections section at y=577 px. Both sequel links are visible without scrolling. No remote font/framework or third-party runtime service is needed.

## Data and media boundaries

Only the two existing original local SVG fallbacks are used. **Zero publisher covers or film posters are cleared for publication in the pilot.** Placeholder labels and alt text explicitly distinguish them from official artwork. No hotlink workaround, new download, paid service, API key or dependency was added. Actual image-load failure falls back once and then to readable text; the client test checks that it cannot loop.

Plot data is fetched only after a fresh explicit choice on that page. Search never expands to the six plot-only identities, even after reveal. Public JSON can be read directly and is **not protected storage**; spoiler controls are a reading preference. Source pages may themselves contain spoilers. No synopsis or source prose was copied into the new runtime.

## Reproduction and release gate

From a clean checkout with the existing development dependencies installed (`npm ci --ignore-scripts`):

```sh
python3 scripts/build_catalog.py
npm run migrate:shadow
npm run build:media
npm run build:readiness
npm run build:pilot
python3 scripts/report_quality.py
npm run report:migration
npm run validate:foundation
npm run validate:shadow
npm run validate:readiness
npm run validate:pilot
npm test
git diff --check
```

`data/pilot/report.json` inventories every generated payload and its measured bytes. `data/pilot/generated-files.json` permits removal of stale generated pilot files only inside that route. `data/pilot/baseline.json` protects 176 earlier tracked files, including old runtime code, canonical data, ID registers and Batch-06 outputs. Tests reject lost source metadata, wrong targets, broken pagination, spoiler leaks, changed certainty and invalid series navigation. Real client execution additionally covers lazy search, failed images, stale asynchronous responses and gate/reset behavior. The release gate also requires JavaScript/Python syntax, repeat-build byte equality, all four validators and the full automated suite. Actual command results are reported in delivery.

## Local release-check results

All **134 automated tests passed** (120 existing and 14 new; zero failures/skips). All four validators returned `valid: true` with no errors. Syntax checks passed for 43 JavaScript and 10 Python files. A repeated pilot/report build reproduced identical bytes across 1,162 generated files. `git diff --check` passed. The 176-file protection baseline passed; no canonical dataset, ID register, old runtime or original Explorer asset changed. Intermediate numbered build copies were preserved outside the repository and excluded from publication. The generator now leaves unchanged files in place; validation rejects unmanaged files in the public pilot directory. Deployment and live acceptance are verified separately after the commit.

## Remaining blockers and next safe step

Retain the separate pilot while collecting mobile reader feedback. Before replacing an existing experience: test physical iPhone/Safari and screen readers; review uncertain source pairs and open edition/publication/credit claims; prepare explicit legacy-route compatibility and language rollout; obtain and document image rights and reliable delivery. The current English edition titles and neutral copy are not full editorial book profiles. No new migration, translation or image-research batch starts here.

Rollback, if necessary, is a normal reviewed revert of this isolated release, without rewriting Git history. The original archive and Explorer assets remain byte-identical. Keep canonical IDs and earlier data; do not repair acceptance failures by deleting uncertainty or weakening spoiler/source checks.
