# The Kingverse 1.9.1 — experience refinement

Review date: 27 October 2026. Starting commit: `2bfcf90c997c3181626049254404bbe001afcf81` (1.9). Public route: [Connected Explorer pilot](https://ysfmyfpvwb-afk.github.io/the-kingverse/explorer/pilot/).

## Result and scope

The isolated pilot keeps all 546 canonical entities, eight types, 66 default relationships and 28 opt-in plot relationships. No canonical record, stable ID, native connection, previous claim, standard website file or original Explorer file is changed. The existing 176-file protection baseline remains enforced. No migration, new dependency, paid API or third-party image publication is introduced.

The black/dark-green/gold identity remains. Search is now a 44×44 px mobile icon in the main header, and technical version information is in the footer. The root page has no empty navigation toolbar. The title receives programmatic focus without looking like a gold-bordered input; interactive keyboard controls retain visible focus. The small local placeholder supports the title, creators and recorded year. The main work page carries discovery, memberships and candidate relationships. Additional bibliography lives in a compact native details dialog, in the same palette and runtime, with a sticky Close control and independent scrolling.

The trilogy rail is an inline sequence, including a marked current volume, rather than duplicate boxed destination cards. A relationship map groups native edges **by target ID after filtering**, preserving every individual relationship, certainty, assessment and source. Revealing The Talisman’s plot layer yields seven connections across six destinations; Black House remains one destination with two individually inspectable relationships. This is UI grouping, not canonical merging. A map source drawer distinguishes the explicit sequel from the provisional, strongly implied shared-world claim. Type icons and explicit Tower-source labels provide visual orientation without relying only on color. Interpretation, derived paths and plot sensitivity stay visible.

Search retains its 540 safe records, alternative titles and on-demand architecture. Empty states suggest another title/name/type. No plot-only name enters search, including after explicit reveal. The six sensitive entity entrances remain unnamed before choice.

## The two book presentations

The large real-cover view is the **legacy archive’s modal**, defined by `index.html`, `app.js` (`detailContent`/`artwork`) and `styles.css` (`.sheet`/`.artwork-large`). It reads the active `DB`/`MEDIA` catalog. It is not a second v2 detail component. The old two-book Explorer is a third, preserved historical preview using `data/v2/`.

The integration pilot uses the broader canonical projection and the rights-aware media registry. It does not automatically navigate readers into the legacy modal. Its new “Book details & sources” dialog uses the same canonical work/edition identities as the main pilot page. Title, creators and recorded year remain in the hero; edition examples, contributor roles, publication observations and field-scoped evidence are supplementary. Selecting an edition from the dialog opens its canonical page. Back returns to the prior work, rather than reopening an unrelated legacy panel.

Opening a pilot dialog adds a local history entry: browser Back closes it, Close/Escape return focus, and selecting an entity replaces the overlay entry. Background scroll is locked while the native dialog is open. Route navigation, Back/refresh and BFCache restoration continue to reset plot visibility. A stale asynchronous response cannot open or reveal a previous entity.

**Isolation boundary:** the legacy archive modal, including its large-cover layout, is intentionally unchanged. The refined mobile details flow is inside the pilot. A global legacy-modal redesign or replacement of the original Explorer is not included. The explicit Archive link still opens that preserved experience. No claim is made that all legacy presentation or cover issues have been fixed.

## Why the real cover differs

The legacy English Talisman record in `media.js` refers to `https://stephenking.com/images/books/talisman/hardcover_prop_embed.jpg`, credited to StephenKing.com / the publisher, with an unconfirmed ISBN. It is an external image, not a local approved asset. The old renderer emits `referrerpolicy="no-referrer"` for its images. This existing behavior was inspected, not copied into the pilot.

A **HEAD-only** comparison on 27 October 2026 returned HTTP **403** with the public Explorer-pilot Referer and HTTP **200**, `image/jpeg`, without a Referer. No image body was downloaded, mirrored or added to the site. This explains the different request behavior; a successful response does not grant republication rights. The earlier visual match confirms the registered title/language, not a licence or fully identified printing. [Official bibliographic page](https://stephenking.com/works/novel/talisman.html).

The media permission registry still records zero cleared publisher covers/posters for new display. The pilot therefore uses only the two existing project-authored local SVG fallbacks. It does not suppress Referer, proxy a denied image, switch to an unreviewed edition or infer permission from the owner’s screenshot. Future approved artwork must still identify its edition and pass the existing rights/delivery gate. Other external legacy images can encounter the same Referer restriction; they were not all probed again.

## Descriptions and evidence

The original short English editorial descriptions for The Talisman and Black House already existed in the canonical dataset, with verified premise-only claims `clm:000114` and `clm:000115`. `data/pilot/premise-review.json` records their existing IDs, editorial scope and value digests. The compiler refuses changed or unverified text. It reuses those descriptions and their field-level source claims, without copying flap text, source prose or a new synopsis. All other records receive concise bibliographic descriptions derived from their existing metadata; missing histories remain in the details/quality layer. The underlying readiness projection is unchanged and not mutated in memory.

## Payload and performance comparison

The full readiness projection is never fetched by the visitor. Search loads on intent. Book-detail code and each entity’s `details.json` also load only on intent; long lists remain six items per chunk. The new split moves bibliography rather than duplicating it in the default entity payload. All public payloads stay below the existing 48-KiB ceiling.

| Measure | 1.9 | 1.9.1 |
| --- | ---: | ---: |
| Initial Talisman HTML + JS + CSS + entity, raw bytes | 59401 | 55862 |
| Same files, offline gzip estimate | 15541 | 15513 |
| Talisman default entity JSON bytes | 22402 | 16989 |
| Largest default entity JSON | 28700 | 22588 |
| Median default entity JSON | 4793 | 3119 |
| Largest six-item chunk | 9118 | 9118 |
| Lazy search raw / gzip estimate | 89103 / 10370 | 89103 / 10370 |
| Additional details renderer, loaded on intent | — | 1281 raw / 702 gzip |

`data/pilot/refinement-baseline.json` records the 1.9 comparison and report digest. A test rejects growth of the initial Talisman files in both raw bytes and gzip estimate. Gzip is an offline estimate, not a claim about CDN encoding. Network time varies with caching and device; viewport samples are not an iPhone benchmark or Core Web Vitals measurement.

## Verification and remaining limits

Local browser checks cover 320×740, 390×844, 768×1024 and 1440×1000 viewports, compact header/touch targets, the full Talisman chain, overlay Back/Escape/focus restoration, native focus containment, edition navigation in both languages, multi-collection 1408, distinct Firestarter remakes, provisional Dark Tower candidates, source drawers, filters, creator pagination and sensitive deep-link/refresh behavior. No horizontal document overflow was observed in those cases. On the 320-px viewport, the root title starts around y=91 px; in 1.9 the 390-px title was at y=169 px. The map is a single column on mobile and two columns on desktop.

The full suite passed **140 tests**, with zero failures or skips. The automated suite includes source/identity preservation, no projection mutation, destination grouping without edge loss, every type’s description, strict premise reuse, deferred details code/data, overlay history and background unlock, asynchronous spoiler reset, image failure and initial transfer budgets. Static contrast checks cover the primary text/accent/muted colors on both dark surfaces (at least 4.5:1) and control boundaries (at least 3:1). They are not a full WCAG audit. All four validators passed locally. Syntax checks passed for 46 JavaScript and 10 Python files. A repeated build reproduced identical bytes across 1,515 generated files. Deployment SHA and live checks are reported separately in delivery.

**No physical iPhone/Safari, VoiceOver or NVDA test was available in this run.** The user’s 1.9 iPhone review is input, not a 1.9.1 device-test result. The in-app browser’s accessibility tree and keyboard operation were checked; this does not replace a real screen reader. Safari-specific scroll, history and assistive-technology behavior still needs owner/device confirmation. No complete global bibliography, complete editorial profiles, universal image availability or catalogue-wide independent verification is claimed.

## Next step

Keep 1.9.1 as the separate pilot. Ask readers to repeat the iPhone Safari review, especially native dialog Close/Back, background scroll and VoiceOver. Obtain explicit image rights before replacing placeholders. Review open bibliographic and relationship claims in a separate content phase. Do not switch the standard archive or original Explorer in this release.

Local 390-px sample: title y=91 px, connection section y=495 px; initial JSON 16,989 bytes, local content ready at 36 ms and entity step 7 ms. These are single cached development-browser observations, not mobile-network or physical-device guarantees.
