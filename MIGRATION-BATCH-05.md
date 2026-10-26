# The Kingverse 1.7 — Migration Batch 05

Date: 26 October 2026. Baseline: `e26c74638a72a58d1cce581a0ebd1337781dafdf` (Batch 04). This is a bounded shadow relationship migration. The standard website and two-work Explorer remain unchanged. Stop after Batch 05.

## Results and counting units

| Scope | Result |
|---|---:|
| Literary works / collections | 241 / 15, unchanged |
| Editions / publication observations | 154 / 239, unchanged |
| Screen identities | 96, unchanged |
| Collection memberships / maker credits | 155 / 291, unchanged |
| Native connection records | 94, including 68 new |
| Source-supported / provisional connections | 87 / 7, current assessment |
| Explicit / strongly implied / interpretive | 87 / 5 / 2 |
| Plot or ending connections | 28 |
| Explicitly derived shared-entity paths | 5 |
| Characters / locations / series | 8 / 2 / 2 |
| Sources / field claims | 482 / 7,322 |
| Invalid references / missing relationship sources | 0 / 0 |
| Mapped catalog leaves | 5,674 / 15,350 |
| Retained, not canonically mapped leaves | 9,676 |

Native connection counts exclude the separately typed memberships and credits. Claims are field evidence, not distinct works or independent bibliographic confirmations. Two prior native records have current review overlays; their historical records and claims are unchanged. Source-supported means evidence for the scoped assertion, not universal certainty or complete-record verification. The 66 newly source-reviewed connections include five derived paths; those derivations are not direct source assertions.

## All 17 inherited Tower rows

One outcome per original source row: **13 migrated, two merged into existing relationships, two provisionally retained, zero whole records rejected**. A row may support multiple connections. Rejected subclaims are recorded separately from the exclusive row outcome. The two interpretive rows create no identity equivalence. Existing relationships `rel:000007` and `rel:000008` are reused. The former needs precise-volume evidence beyond a general cosmology connection; the latter remains strongly implied and provisional.

The primary review used the [official connection index](https://stephenking.com/darktower/connections/) and [official series navigation](https://stephenking.com/darktower/book/). The inherited plural `/darktower/books/` returns 404; its preserved source pointer is not silently changed. New series claims cite the functioning official link. No creature or location identity is inferred from a similar name. A place mentioned in one novel is not represented as a setting of that novel. Numbered volumes and an interlude remain distinct.

The exact row decisions, evidence and derivations are in `data/migration/batch-05-review.json` and `batch-05-decisions.json`. **These technical files contain plot spoilers.** They are linked with warnings; the dashboard contains aggregate counts only.

## Exactly 78 inherited adaptation/source candidates

**24 confirmed, 11 provisional, 43 insufficient evidence, zero definitively rejected.** The denominator is 78 exact inherited adaptation/target pairs, not 78 productions or a worldwide filmography. Seventy-three unique candidate URLs were inspected; the acquisition ledger also includes Tower and supplemental primary references, 82 URLs in total. Acquisition success alone never promotes a candidate.

Official production descriptions, writer/source credits and reproduced production announcements support 20 precise source pairs. Four further pairs have targeted [AFI Catalog](https://catalog.afi.com/) literary-source or production-history evidence. [Sony's Stand by Me page](https://www.sonypictures.com/movies/standbyme) independently identifies its novella source. Remaining title matches, related-work links and plot summaries do not certify a source relationship. Insufficient evidence does not mean a candidate is false.

Six individual-volume candidates for one film remain provisional: the source establishes a series adaptation, not six individually proven adaptations. One separately typed series adaptation is added. Two explicit screen-to-screen remake relations are separately counted. Production status, release dates and poster permissions are not re-certified by this source-work review.

There are now **38 source-supported literary source connections: 37 direct adaptations plus one inspired-by relationship**, compared with 14 such source connections after Batch 04. The series adaptation is additional. Two earlier native literary source relations and one screen prequel remain provisional. The frozen `screen-views.json` and Batch-04 decisions retain their historical candidate categories; use the Batch-05 review as the current assessment layer.

## Talisman trilogy and bounded entities

The existing IDs `wrk:000001`, `wrk:000002`, `wrk:000067` form the three-volume sequence. Existing sequel links and all author, coauthor and illustrator roles are preserved. A publisher-confirmed returning protagonist and general Tower connection are separately scoped; no broad identity equivalence is inferred. The series has its own identity, not a duplicate literary work.

The [publisher page](https://www.simonandschuster.com/books/Other-Worlds-Than-These/Stephen-King/The-Talisman-Trilogy/9781668233092) was readable in full through the web reader (839 lines; heading and About the Book reviewed). The direct collector received HTTP 403, preserved in the acquisition record. These are different observation channels. No authentication, image workaround, proxy or rehosting was used. No source synopsis or book text is published as audit data.

Six bounded character identities, one location and two series are added. No general character encyclopedia, new literary works, editions, images, ratings or paid services are introduced.

## Reproduction and safety

Run, offline:

```sh
python3 scripts/build_catalog.py
node scripts/migrate_shadow.cjs
python3 scripts/report_quality.py
node scripts/report_migration.cjs
npm run validate:foundation
npm run validate:shadow
npm test
```

`batch-05-review.json` is reviewed input, with explicit frozen IDs in `batch-05-register.json`; builds never allocate identities automatically. The register freezes the review/inventory/acquisition hashes and every Batch-04 native record digest. Earlier batches are reproducible with `generateShadow(root, {batch: '04'})` and their earlier batch selectors. Only 17 further legacy leaves, the reviewed Tower certainty fields, gain a mapping. Original text and all remaining source fields stay preserved with hashes and dispositions. New canonical claims do not imply every legacy prose field is mapped.

The optional `series` extension does not change the frozen foundation files. Existing membership IDs provide the contains-story projection; predicate adapters preserve earlier conventions. Derived relations require separately sourced premises. Semantic duplicates, wrong endpoints, series-position conflicts and sequel cycles fail validation. Current assessment overrides must accompany historical relationship records in future consumers; generated safe/full graphs include them.

`universe-safe.json` filters plot/ending relations and sensitive entities before labels, descriptions or accessible names are built. `universe-plot.json` is an explicitly separate technical artifact. No aliases or source prose are automatically projected. The dashboard presents no new plot names or pairs. **Public JSON is not secret** and direct access to technical data can reveal spoilers. No full Explorer integration is performed.

The online research collector is deliberately separate:

```sh
python3 scripts/collect_relationship_evidence.py --cache /tmp/kingverse-evidence --checked YYYY-MM-DD
```

It fetches public HTML with two workers and records access problems; it does not certify claims. Source prose remains in the private temporary cache. A fresh online run changes evidence and requires editorial review and register-hash review; it is not an automatic dataset update. Normal builds and tests do not use the network.

## Verification and decision gate

Foundation and shadow validators pass. All 105 tests pass: the 94 existing tests plus 11 Batch-05 tests covering preservation, exact review denominators, claims, series navigation, taxonomy adapters, spoiler filtering, derivations, semantic duplicates, cycles and uncertainty. Required catalog and quality generators pass; all 28 JavaScript files checked parse successfully; `git diff --check` passes. Repeated generation is byte-identical. Browser checks at 390×844, 768×1024 and 1440×1000 verify the new dashboard and no document-wide horizontal overflow. The mobile count table keeps both labels and values visible. Keyboard table focus has a visible outline. DOM and accessibility checks find no new sensitive plot names in the dashboard.

Existing-app regression checks cover EN/NL switching, live search, the search button and Enter (one Talisman result), the collaboration filter (ten results), detail navigation and Escape focus return. The saved NL preference was restored after testing. Explorer checks cover a character filter, keyboard spoiler reveal, navigation to Black House and automatic spoiler reset. Existing image/fallback rendering remains in place; no external image rights or new delivery permission is inferred. These are targeted browser checks, alongside byte-preservation and automated regressions, not an exhaustive test of every legacy page.

**Not ready for a full Explorer switch.** Resolve the 11 provisional and 43 insufficient-evidence candidate pairs where appropriate; precise target scope and two interpretive Tower rows remain open. Five earlier secondary collection memberships and all contents orders remain unresolved. Publication/printing histories, incomplete edition metadata, contributor scope, image rights and legacy field mapping remain blockers. No new cover or poster rights are established. Worldwide bibliography or universe completeness is not claimed. A future phase needs an explicit scope, compatibility projection and complete visitor UI acceptance before activation.
