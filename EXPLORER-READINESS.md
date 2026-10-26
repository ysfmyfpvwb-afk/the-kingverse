# The Kingverse 1.8 — Batch 06: Explorer Readiness & Media Library

Baseline: `12f14beb0abb201afc40943e98658647323cb8db` (Batch 05). Reviewed on 26 October 2026. This batch prepares an isolated integration contract; it does not activate or replace the public Explorer. The canonical dataset and existing visitor files remain unchanged.

## Decision

**GO for isolated integration tests. CONDITIONAL GO for a separately authorized, bounded English bibliographic phase. NO-GO for activating the full Explorer in this batch.**

A first phase can use canonical titles, roles, editions, source links, explicitly qualified relationships and clearly labelled placeholders. It does not need every uncertain source candidate to become a confirmed fact or every historical legacy leaf to become a visitor field. The current two-book renderer cannot consume this expanded contract without adaptation. Visitor acceptance, payload selection and rollback checks are mandatory before a production integration.

## Technical coverage

| Navigable entity | Count |
|---|---:|
| Literary works | 241 |
| Collections | 15 |
| Editions, including translations | 154 |
| Screen productions | 96 |
| People / creators | 28 |
| Characters | 8 |
| Locations | 2 |
| Series | 2 |
| Total | 546 |

The default projection contains **540 entities and 66 native connections**. A separate explicit opt-in delta contains **six sensitive entities and 28 plot connections**. Together they preserve all **94** canonical connections, with original IDs, direction, certainty, spoiler scope and field-scoped evidence. Two external-reference wrappers resolve to existing canonical works, with the original endpoints retained for audit. Current Batch-05 assessment overrides are applied; old verified claims do not silently override a current target-scope question.

The contract also preserves 155 collection memberships, 291 scoped creator credits and 239 publication observations. These are different record types and are not added to the native connection count. Fifty-four unconfirmed adaptation/source candidates remain separate observations: 11 provisional and 43 insufficient evidence. They are navigable with explicit qualification and are never promoted to established adaptation edges. Adaptation labels include release year/format to distinguish remakes, while the original English title stays in the data. Release observations, season status, announced units and unknown dates remain distinct; a released production is not a claim that every season has been released or that a series is complete.

Sources retain URL, publisher, access state, observation date and type. Projected claims retain ID, subject, field path, source IDs, verification status, selected state and independent-confirmation flag. Raw claim values/locators, source notes, canonical synopsis, continuity prose and content aliases are deliberately not copied into default visitor text. Their immutable canonical records remain the audit reference; stable legacy-ID/route aliases are retained separately. Neutral English introductions avoid inventing missing synopses. This is a selected visitor contract, not a lossless replacement of the entire legacy DB/MEDIA export.

## Isolated integration

`npm run build:readiness-fixture` generates the test environment outside the repository. The source HTML is a template, not a newly activated public Explorer route. The static fixture exercises typed routes, reverse navigation, editions, memberships, creator roles, sources, uncertainty and a local media selector. Every visitor string is assigned using `textContent`; external media requests are prohibited by its content security policy.

Test cases:

| Case | Canonical scope | What is checked |
|---|---|---|
| Complete Talisman trilogy | `wrk:000001`, `wrk:000002`, `wrk:000067` | Sequel/series navigation and preserved author/coauthor/illustrator roles |
| Multiple editions | `wrk:000001` | Separate EN/NL edition identities, unknown edition dates and work/edition navigation |
| Multiple collections | `wrk:000161` (1408) | Two preserved memberships; one remains provisional; collection media reference |
| Multiple adaptations | `wrk:000010` (Firestarter) | Distinct 1984/2022 production IDs and labels |
| Uncertain adaptation source | `adp:000013` | Six unconfirmed volume candidates kept separate from the confirmed series relationship |
| Tower connection | `wrk:000007` | Additional sensitive relationships appear only with explicit opt-in |

All 355 inherited book/story/screen legacy routes resolve to the same identities in automated compatibility checks; search, sort and language state are retained by the adapter. No legacy URL is rewritten or redirected by this batch. Zero invalid references or lost source/certainty metadata were detected by the validators. This does not claim manual browsing of every projected entity or external source URL.

## Spoiler boundary

Default labels, descriptions, accessible text and navigation are built after sensitive entities/edges have been excluded. Sensitive aliases and unclassified prose are not rendered in metadata or hidden HTML. The fixture fetches `plot.json` only after an explicit action. Navigation resets the choice. A plot-only entity route first shows a generic unnamed gate; a fresh explicit reveal opens the entity, so hidden identities remain navigable without exposing their labels by default. A regression test delays the response until after navigation and verifies that it cannot reveal spoilers on the new page.

Public JSON is not secret. A person can deliberately open canonical or plot audit files directly. The control is a reading preference and payload separation, not access control. Future consumers must preserve this boundary and the current assessment overlay rather than loading raw canonical prose into their initial DOM.

## Media inventory and local library

All **152 registered covers and 82 posters** have an artwork-ID/edition-or-production-bound media record. The two existing provenance-policy files remain unchanged. The inventory distinguishes bibliographic registration from permission and technical delivery:

| Media status | Count |
|---|---:|
| Known cover references | 152 |
| Known poster references | 82 |
| Established local publication permission for those artworks | 0 |
| Locally publishable real covers/posters | 0 |
| Artwork records requiring permission/review | 234 |
| Editions with no registered cover | 2 |
| Productions with no registered poster | 14 |
| Original project-authored local placeholders | 2 |

No local image files existed in the repository before this batch (tracked/untracked/hidden inventory, excluding Git metadata and dependencies). Historical visual approvals, source-image hashes and fetch metadata do not establish republication permission. No external artwork was downloaded into the new library, mirrored, resized or converted. WebP/AVIF variants are therefore not applicable to a cleared bitmap in this batch; adding an optimizer dependency would not resolve missing permission.

The [official Talisman page](https://stephenking.com/works/novel/talisman.html) reserves rights in its footer; this does not identify the owner or licence of each specific image. The attempted terms URL was unavailable through the web reader and the publisher home page timed out. No permission was inferred from either failure, and no restrictions were bypassed. This is a review of the available repository evidence and bounded source checks, not a comprehensive legal opinion or an assertion that every possible use is forbidden. Rights holders remain unknown where not established.

`data/media/library.json` records source/original URL, canonical owner, language, rights holder if known, permission status, evidence, licence/conditions, technical state, actual technical observation date, metadata-review date, local path, variants and integrity. `data/media/permissions.json` is the reviewed input for any future artwork-specific authorization; it currently has no decisions. No licence is inferred from a publisher domain. See [the library guide](assets/media/README.md) for exact paths and approval requirements.

Two original geometric SVG placeholders, 719 and 785 bytes, are generated locally and labelled “not official artwork.” They preserve a 2:3 aspect ratio with a responsive viewBox. Hash/byte checks and real browser loads pass. A loopback HTTP probe returned 200 in about 29 ms and 1 ms respectively; these are local observations, not production latency guarantees. A separate temporary fixture with a genuinely missing SVG produced a clear text fallback without a broken-image loop. No failure was introduced into the repository or public site.

For a collection-only story, the selector follows a registered source-supported membership and the edition in the requested language, retaining a link to the collection. Unknown contents order is not invented. A provisional-only collection reference is labelled and gets no asserted collection cover. Stories without a registered standalone edition are not counted as missing their own cover. NL can have an explicitly marked EN fallback; EN never silently substitutes a Dutch image. A direct NL edition page can still describe its own edition.

## Necessary fields versus deferred migration

The required visitor contract is already present: typed stable identity, original title/name, language and edition owner, scoped maker role, dated publication/release observation with its precision, relationship endpoints/type/direction, certainty, verification and source IDs, spoiler scope, legacy aliases and the media permission decision. Optional ISBN, publisher, date, format, country or translation fields remain explicitly unknown when absent. Their absence does not break a route.

The canonical leaf ledger is unchanged: **5,674 mapped, 9,676 retained, 15,350 total**. Retained leaves by legacy group are books 2,163; stories 3,946; films 2,010; Tower 237; work index 1,320. These overlapping legacy representations are not counts of unique facts. None of these leaves is required to complete this isolated typed projection. That does not make all of them unnecessary for richer future features.

Critical before public activation:

1. Separate owner authorization for the public phase; Batch 06 expressly stops before activation.
2. A consumer adapted to the expanded contract, current uncertainty overlays, lazy spoiler loading and media permission gate. The existing public renderer remains restricted to its original fixture.
3. Page-specific payload selection and production performance measurement. The complete diagnostic JSON is roughly 3.4 MB uncompressed plus a separate 104 KB plot delta; it must not be treated as a finished mobile runtime.
4. Visitor UI acceptance, route checks and a tested rollback against the existing public experience.

Not blockers for an honestly labelled first bibliographic phase using fallbacks:

- Unconfirmed source pairs can remain labelled or excluded; seven native relationships remain provisional.
- Five secondary memberships and all contents orders remain uncertain.
- Missing first-publication, printing, translation and complete contributor histories can remain visible gaps.
- Image permission blocks publishing the affected artwork, not displaying a neutral placeholder.
- Verified literary introductions and expanded field migration can follow in scoped editorial work; no copied synopsis is needed to fill the gap.

A complete catalogue switch, worldwide bibliographic completeness and a definitive universe graph are not certified here.

## Reproduce and verify

Normal builds/tests work offline with the existing locked Ajv development dependency. No new dependencies, accounts, APIs, keys or paid services were added.

```sh
python3 scripts/build_catalog.py
node scripts/migrate_shadow.cjs
npm run build:media
npm run build:readiness
python3 scripts/report_quality.py
npm run report:migration
npm run validate:foundation
npm run validate:shadow
npm run validate:readiness
npm test
```

To run the isolated integration fixture, without publishing it:

```sh
npm run build:readiness-fixture -- --out /tmp/kingverse-b06-integration
python3 -m http.server 8767 --bind 127.0.0.1 --directory /tmp/kingverse-b06-integration
```

Open `http://127.0.0.1:8767/the-kingverse/readiness/`. The build refuses to write the fixture inside the repository or into an unrelated nonempty directory. The `the-kingverse` prefix deliberately tests GitHub Pages subpaths. No generated integration HTML belongs in the public Explorer directory.

All 120 automatic tests pass (105 existing and 15 new); foundation, shadow and readiness validators pass. Syntax checks pass for 36 JavaScript files and all Python scripts. The Batch-06 baseline protects 69 existing canonical, provenance, legacy and visitor files by SHA-256. Media schema/integrity/ownership/path checks, projection checks, negative cases, delayed-fetch spoiler tests and all earlier regressions are part of the suite. Browser verification covers 390×844, 768×1024 and 1440×1000; trilogy navigation, multilingual edition records, multiple memberships/adaptations, uncertainty, keyboard controls, source disclosures, spoiler reset and real image failure. The existing app was checked for EN/NL switching, live/button/Enter search, details/Escape and preference restoration; the two-book Explorer retains its original navigation, character filter and spoiler reset.

The machine-readable report and projection checksums are in `data/readiness/report.json` and `manifest.json`; the live quality section is `migration-quality.html#explorer-readiness`. Push, Pages build and live byte verification are reported separately at delivery. **Stop after Batch 06.**
