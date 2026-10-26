# JWL Linker — Code Walkthrough (`main.js`)

This document explains how the **JWL Linker** Obsidian plugin works and where to find each part of it in `main.js`. It describes version 0.10.0. A Russian version is in [PLUGIN_CODE_GUIDE.md](PLUGIN_CODE_GUIDE.md).

## 1) Architecture

The whole plugin is one hand-written file, `main.js`, with no build step. Tests in `tests/` load it with a stub of the `obsidian` module (`tests/helpers/load-plugin.js`).

Top to bottom, the file contains:

| Part | What it is |
|---|---|
| `DEFAULT_SETTINGS` | Default settings: templates, languages, dual mode, history, toggles |
| `InterfaceStrings`, `Lang` | Interface strings for Russian, English, Spanish, Portuguese, French and German; `Lang` is the active set |
| Language tables | `Languages`, `LanguageInfo`, `WtLocales`, `LangByWtlocale`, `OfflinePublications`, `OfflineMessages` (section 3) |
| `Config` | Regexes for scriptures, publications and links; base URLs |
| Publication helpers | Month tables, Watchtower auto-formatting, `PubLangs`, `PublicationTitles`, parsing and query building (section 5) |
| Editor helpers | Verse preview, Live Preview link ranges, suggestions (section 2) |
| `JWLLinkerPlugin` | Main class: commands, parsing, fetching, formatting |
| `JWLLinkerView` | History sidebar |
| `ScripturePostProcessor` | Reading View: turns references into JW Library links |
| `JWLLinkerSettingTab` | Settings screen |
| `Bible`, `_BibleVerses` | Book names and abbreviations per language; verse counts per chapter |

## 2) Where each feature starts

### 2.1 Commands in the editor

1. A command from the context menu (`buildMenu`) or the Command Palette calls `insertCitation(editor, command, pars)`, `linkToJWLibrary`, `openInJWLibrary`, `openSelectedInWOL`, `citeSelectedText` or `batchConvertAllLinks`.
2. `_getEditorSelection` returns the selection, or the current line and caret.
3. `insertCitation` normalises the text (`normalizeInput`), converts Watchtower month names (`autoFormat*Watchtower`) and routes by command and content:
   - a publication reference → `_fetchPublicationCitation` (or `_fetchDualPublicationCitation` in dual mode);
   - a scripture → `_fetchBibleCitation` (or `_fetchDualBibleCitation`);
   - a wol.jw.org / jw.org link → `_fetchParagraphCitation`.
4. The result is inserted below the line, or replaces the selection.

`batchConvertAllLinks` finds every scripture and publication in the note (skipping callouts) and inserts callout citations under each line.

### 2.2 Reading View

`onload` registers a Markdown post-processor that creates a `ScripturePostProcessor` for each rendered block. It skips headings and callouts, walks the plain text nodes (not links, code or math) and replaces each reference with an `<a>` element through `linkScripturesInTextNode`. Only the DOM API is used; the note text is not changed.

### 2.3 Live Preview links

`_registerLivePreviewLinks` adds a CodeMirror `ViewPlugin`. On every document change, viewport change or mode switch it rebuilds the decorations for the visible lines:

- `scriptureLinkRanges(plugin, text)` returns the character ranges of the passages in a line and their JW Library links. Results are cached per line text (`LivePreviewCacheSize` lines), so typing only re-parses the line that changed. The cache restarts when the citation language or punctuation spacing changes.
- `computeScriptureLinkRanges` does the uncached work; `passageSegments` splits a reference like `Ps 23:1-3, 5; 24:1` into one range per passage.
- Code, links, front matter and other syntax nodes are skipped. Cmd/Ctrl+click opens the link.

### 2.4 Verse preview (desktop)

`_registerVersePreview` listens for the mouse resting on a JW Library link for `VersePreviewDelayMs`. `_fetchVersePreview` turns the link into a jw.org page (`parseJwlBibleHref`), loads up to `VersePreviewMaxVerses` verses and caches successful results. `createVersePopover` / `fillVersePopover` draw the popup.

### 2.5 Suggestions while typing

`ReferenceSuggest` (an `EditorSuggest`) opens after the trigger (default `@`) at the start of a word. `suggestionsFor(query, preferredLang)` lists Bible books (preferred language first, then the others) and publication codes from `PublicationTitles`.

### 2.6 History

Successful citations are added to the sidebar (`JWLLinkerView.addToHistory`) and kept in the workspace layout (`getState`). `getFromHistory` serves a repeated lookup without a new request.

## 3) Languages

Language keys are `EN`, `RU`, `ES`, `PT` (Portuguese, Brazil), `FR` and `DE`. Dutch (`NL`) only has a JW Library locale for links.

| Table / function | Purpose |
|---|---|
| `Languages` | Setting value (`'Portuguese'`) → language key (`'PT'`) |
| `LanguageInfo` | Per language: JW Library / finder code (`wtlocale`), WOL site and library (`r5/lp-t`), callout word for BIBLE |
| `WtLocales`, `LangByWtlocale` | Language key ↔ `wtlocale` letter (`T`, `F`, `X`, …) |
| `getConfigForLanguage(lang)` | WOL article, publication and search URLs and the finder URL for a language |
| `getFinderUrl`, `getJWLibraryLocale` | jw.org finder base URL and `&wtlocale=` for links |
| `Bible[lang]` | `Book`: names as displayed; `Abbreviation`: for each book, one string of lower-case names without spaces or dots — full name, WOL long and short abbreviation, spellings without diacritics |
| `BibleSearchOrder` | Order in which languages are searched for a book name |
| `PubLangs[lang]` | Publication conventions: chapter / page / paragraph markers, date order, Watchtower names, month and issue formatting |
| `PublicationTitles[lang]` | Publication titles by code (`od`, `it-1`, `lff`, …) |
| `OfflinePublications`, `OfflineMessages` | Print-only publications and the messages shown for them |
| `InterfaceStrings[name]` | Interface text; every language has exactly the keys of English (checked by a test) |
| `InterfaceLangCodes`, `DualLangCodes` | Interface language → dual-mode code (`pt`); languages offered in dual mode |

### 3.1 Detecting the language

With the citation language set to *Auto*:

- **Scriptures**: `detectBookLanguage(bookKey)` decides from the book name. English, Spanish and Russian claim every key that starts one of their names (this keeps their earlier behaviour: `fil`, `apo` stay Spanish). Portuguese, French and German only claim their exact names and abbreviations (`joão`, `jean`, `1mo`). If no language matches, `detectLanguage(text)` is used.
- **Other text** (WOL search): `detectLanguage(text)` — Cyrillic is Russian, then `LanguagePatterns` (words and markers only one language uses; built on first use).
- **Publications**: the paragraph marker decides (`абз.` RU, `párr.` ES, `§` FR, `Abs.` DE). `p.` / `par.` are shared by English and Portuguese, so they map to `LatinFormatLang`: Portuguese when the interface is Portuguese, otherwise English (`updatePublicationFormatLanguage`).

With a fixed citation language, that language is searched first and the reference is converted to it.

### 3.2 Finding a book

`findBibleBook(bookKey, preferredLang)` searches the preferred language, then `BibleSearchOrder`. Within each language an exact name or abbreviation wins over a longer name that starts with the key (Portuguese `jo` is João, not Josué). Results are cached (`BookLookupCache`).

## 4) Bible references

- **Regexes** (`Config`): `scriptureRegex` (book chapter:verse), `scriptureNoChpRegex` (one-chapter books: Obadiah, Philemon, 2 and 3 John, Jude — the number is the verse) and `scriptureNoVerseRegex` (chapter only). They also accept German `1. Mose` and multi-word names (`Song of Solomon`, `Hohes Lied`, `Chant de Salomon`, `Cântico de Salomão`).
- **`_parseScriptureLinks(input, displayType, …)`** runs the regexes and builds references with passages. Inside, `validateReference` resolves the language and book, checks the chapter and verses against `maxVerse` (`_BibleVerses`) and builds the links.
- **Link id**: book, chapter and verse as `BBCCCVVV` (`43003016` = John 3:16; a range is `first-last`). JW Library: `jwlibrary:///finder?bible=<id>&wtlocale=<code>`; verse text comes from `https://www.jw.org/finder?wtlocale=<code>&bible=<id>`.
- **`_convertScriptureToJWLibrary`** writes Markdown links (*Convert scriptures to JW Library*).
- **`_fetchBibleCitation`** loads the verses (`#v<id>` elements), fills `verseTemplate` / `verseCalloutTemplate` and translates the callout word BIBLE into the reference language (`translateBibleLabel`). Verses of one chapter go into one callout.
- **Dual mode**: `_fetchDualBibleCitation` → `_fetchBibleVerseByLanguage` for each language; `localizeBookName` shows the book name in that language.

## 5) Publications

All publication citations follow the same three steps:

1. **Parse** the reference in whatever language format it was typed:
   - Watchtower: `parseWatchtowerReference` (`WatchtowerRegex`) → year, month, day (before 2016), page, paragraphs, source language. German writes the issue as `15. 1.`; a date like `15/1` in the English format is read as day/month.
   - Other publications: `parseOtherPublicationReference` (`Config.otherPubRegex`, `matchOtherPublication`, `isLikelyPublication`, `KnownPubCodes`) → code, chapter or number, page, paragraphs, source language.
2. **Build the WOL query and title in the citation language**: `formatWatchtowerQuery` / `formatWatchtowerTitle`, `formatOtherPublicationQuery` / `formatOtherPublicationTitle`, using `PubLangs`. `paragraphQueries` makes one query per paragraph (up to `MaxCitedParagraphs`), because WOL resolves single paragraphs reliably.
3. **Fetch and format**: `_citeFromWol` loads each WOL search page, takes the paragraph from `.resultItems`, fills `pubTemplate` / `pubCalloutTemplate` and replaces the label `PUB.` with the language's label.

Entry point: `_fetchPublicationCitation` → `_fetchWatchtowerCitation`, `_fetchOtherPublicationCitation` or, for anything else, `_fetchLookupCitation` (plain WOL search). `_publicationLanguage(detected)` chooses the citation language (fixed setting or the detected one). `checkPublicationAvailability` stops early for print-only publications and Watchtower years that are not online.

Month names typed by hand are converted first: `autoFormatRussianWatchtower`, `autoFormatEnglishWatchtower`, `autoFormatSpanishWatchtower` and `autoFormatOtherWatchtower` (Portuguese, French, German; `MonthNameWatchtowerFormats`), all built on `autoFormatLatinWatchtower` except Russian.

Query formats per language (checked on WOL):

| Language | Watchtower 2016+ | Before 2016 | Other publications |
|---|---|---|---|
| English | `w23.12 p. 20 par. 7` | `w10 1/15 p. 3 par. 1` | `od chap. 15 par. 3` |
| Russian | `w23.12 20, абз. 7` | `w10 15/1 с. 3 абз. 1` | `od глава 15 абз. 3` |
| Spanish | `w23.12 pág. 20 párr. 7` | `w10 15/1 pág. 3 párr. 1` | `od cap. 15 párr. 3` |
| Portuguese | `w23.12 p. 20 par. 7` | `w10 15/1 p. 3 par. 1` | `od cap. 15 par. 3` |
| French | `w23.12 p. 20 § 7` | `w10 15/1 p. 3 § 1` | `od chap. 15 § 3` |
| German | `w23.12 S. 20 Abs. 7` | `w10 15. 1. S. 3 Abs. 1` | `od Kap. 15 Abs. 3` |

## 6) Links to jw.org and WOL

- `_getLinksInText`, `_getLinkAtCaret`, `_extractLinkParts` find a wol.jw.org or jw.org link and its document and paragraph ids (`#h=5-7`, `par=5-7`).
- `_fetchParagraphCitation` cites the paragraph(s) behind a link, with the page title as the link text (*Cite jw.org url*, *Add title to jw.org url*).
- `_convertWebToJWLibrary` turns a jw.org link into a JW Library link.

## 7) Fetching and cleaning text

- `_fetchDOM(url)` — `requestUrl` plus `DOMParser`; returns `null` on failure.
- `_getElementAsText(dom, selector, type, follows)` — text of a verse, paragraph or title, cleaned of footnote markers and extra spaces.
- `_boldInitialNumber(text)` — `**4**` for the verse or paragraph number (setting *Initial numbers in bold*).
- `fillCitationTemplate(template, title, text)` — fills `{title}` and `{text}`. In a callout template every line of a multi-line text stays inside the callout, without doubling `>`.

## 8) Templates

Settings `verseTemplate`, `verseCalloutTemplate`, `pubTemplate`, `pubCalloutTemplate` with the placeholders `{title}` (title or link) and `{text}` (cited text). Obsidian callouts need `>` before `[!cite]`:

```md
> [!cite] PUB. — {title}
> {text}
```

## 9) Sidebar and settings

- `JWLLinkerView`: `renderView`, `showHistory`, `addToHistory(url, link, content, pars)`, `getFromHistory`, `clearHistory`, `getState` / `setState`.
- `JWLLinkerSettingTab.display()` builds the settings screen. Lists of languages come from `Lang.citationLangOptions` and `Lang.dualLangOptions`; the dual-mode language choices appear only when a dual mode is on.
- `loadSettings` / `saveSettings` also update the interface language (`updateInterfaceLanguage`) and `LatinFormatLang`.

## 10) Performance

- Startup is about 7 ms: about 5 ms is the engine compiling `main.js`, the rest is the top-level tables and `onload`. Nothing heavy is built at load time: `maxVerse` reads the compact `_BibleVerses` table directly, and `LanguagePatterns` is built on first use.
- Typing in Live Preview costs about 0.04 ms per keystroke thanks to the per-line cache.
- Caches: `BookLookupCache` and `BookLanguageCache` (book lookups), the per-line cache in `scriptureLinkRanges`, `VersePreviewCacheSize` verse previews, and the history sidebar for citations.

## 11) Adding a language

1. `LanguageInfo` and `WtLocales` / `LangByWtlocale`: JW code and WOL library. Find them on wol.jw.org (the library path in a WOL address, e.g. `/pt/wol/l/r5/lp-t`).
2. `Bible.<KEY>`: 66 `Book` names and `Abbreviation` strings from the WOL Bible index of that language (`https://wol.jw.org/<site>/wol/binav/<rsconf>/<lib>`). Add the key to `BibleSearchOrder` and to the language list in `suggestionsFor`; decide in `detectBookLanguage` whether the language may claim prefixes or only exact names.
3. Book names with a space or a dot that the generic regex cannot match (like `1. Mose`, `Hohes Lied`) go into `scriptureRegex` / `scriptureNoVerseRegex`; one-chapter books into `scriptureNoChpRegex`. A new script (Greek, Japanese, …) needs its letters in the regexes.
4. `PubLangs`, `PublicationTitles`, `OfflinePublications`, `OfflineMessages`, month names and an entry in `MonthNameWatchtowerFormats`. Check every query format on WOL before relying on it.
5. Publication markers in `WatchtowerRegex`, `Config.otherPubRegex`, `isLikelyPublication`, `parseOtherPublicationReference` and `normalizeInput`; distinctive words in `LanguagePatterns`.
6. `Languages`, `InterfaceStrings` (all keys, including `citationLangOptions` and `dualLangOptions` in every language), `InterfaceLangCodes`, `DualLangCodes`, the interface options in `JWLLinkerSettingTab.display`, and the word for BIBLE in `BibleLabelRegex`.
7. Tests in `tests/parsing.test.js`, and the README.

## 12) Tests

`npm test` runs `tests/parsing.test.js` with Node's built-in test runner; `npm run check` checks the syntax of `main.js`. `tests/helpers/load-plugin.js` loads `main.js` with a stubbed `obsidian` module and exports the internal functions listed in `EXPORTS`, so new functions that tests need must be added there.
