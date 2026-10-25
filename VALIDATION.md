# Update 1.4 — validation

Checked locally on 25 October 2026, before publication.

- `node --check app.js`, `catalog.js`, `media.js`: passed.
- `node --test tests/catalog.test.cjs`: 9 passed, 0 failed. Covers import preservation, documented duplicate consolidation, language-specific edition selection, remake-safe posters, Carrie metadata and direct year links, search/filter/sort behavior, missing-image fallback, escaping, story/collection links and Tower links.
- All 38 mapped image URLs returned valid images. A contact sheet was visually checked for the expected title and language. This checks the selected artwork, not every possible edition or its full publication history.
- Browser: Dutch `Bezeten stad` and its Dutch cover change immediately to `'Salem's Lot` and the English cover. Search remains in place. Language persists after reload.
- Browser: Carrie book details link to the four distinct direct adaptations (1976, 2002, 2013, 2026). The 2026 link opens the correct series detail, poster, credits, release date, episode count and renewal. Closing returns to a consistent adaptation view. Escape closes the modal.
- Browser: the TV series filter narrows Carrie results from four to one and retains that selection after a language switch. An inherited bug that overwrote filter options during translation was found and fixed by scoping navigation selectors to `#tabs`.
- Browser: both mapped Carrie posters remain English in the Dutch interface and load successfully. Unmapped remakes have explicit placeholders. An unmatched search produces a translated empty state.
- Browser: iPhone 390 × 844 (two columns), iPad 768 × 1024 (three columns), desktop 1440 × 1000 (five columns); no page-wide horizontal overflow. iPad detail width 720 px within the viewport. Mobile tab navigation scrolls independently.
- Browser console: no JavaScript errors observed in the tested flows. Image-error behavior is additionally covered by the automated test; remote images can become unavailable later.
- Repository: `main` still matched the remote revision `271789cb816ec651542077d4225068f43a6c49cf` before committing. GitHub Pages configuration confirmed `main`, repository root, legacy build, existing publication status `built`.

Actual push, deployment status and live checks are reported in the delivery message after publication; this file does not claim those were completed before they happened.
