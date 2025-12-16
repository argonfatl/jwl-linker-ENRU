# JWL Linker EN-RU-ES — Code Walkthrough (`main.js`)

This document explains how the **JWL Linker EN-RU-ES** Obsidian plugin works and what the main functions/methods in `main.js` are responsible for.

## 1) High-level architecture

The plugin is primarily implemented in a single file, `main.js`, containing:

- **Global constants / config**
  - `DEFAULT_SETTINGS` — default settings (citation templates, language options, dual mode toggles, history, etc.)
  - `InterfaceStrings` + `Lang` — UI strings for RU/EN/ES
  - `Config` — regex patterns and URL templates for WOL / JW.org / Finder / JW Library
  - month/book mappings and other lookup tables

- **Global helper functions**
  - language detection, Watchtower auto-formatting, URL builders, and small utilities

- **Classes**
  - `JWLLinkerPlugin extends Plugin` — main plugin class: commands, parsing, network fetching, formatting, dual-mode output.
  - `JWLLinkerView extends ItemView` — sidebar history (citation cache) + UI.
  - `ScripturePostProcessor extends MarkdownRenderChild` — Reading View post-processor: turns scripture references into `jwlibrary://` links.
  - `JWLLinkerSettingTab extends PluginSettingTab` — settings UI.

## 2) Execution flows (data flow)

### 2.1 Editing View (editor)

1. You run a command (context menu or Command Palette).
2. The command reads:
   - `selection` (if text is selected) or the current line/caret position.
3. The plugin determines the input type:
   - a WOL / JW.org / Finder URL,
   - a Bible reference,
   - a publication reference (Watchtower / Study Edition / books, etc.),
   - arbitrary text (lookup on WOL).
4. For citations:
   - it builds a target URL (`wol.jw.org`, `jw.org/finder`, or `jwlibrary://`);
   - if needed it downloads HTML (`requestUrl`) and extracts the paragraph/verse text.
5. It formats the result using templates:
   - plain text (`pubTemplate`, `verseTemplate`),
   - callout (`pubCalloutTemplate`, `verseCalloutTemplate`),
   - special callout for selected text (`citeSelectedText`).
6. The result is inserted into or replaces text in the editor.

### 2.2 Reading View

1. Obsidian calls the registered `MarkdownPostProcessor`.
2. `ScripturePostProcessor` reads the rendered HTML, finds scripture references.
3. It replaces them with `jwlibrary://` links.

### 2.3 History / cache

- Successful citations are added to the sidebar history (`JWLLinkerView.addToHistory`).
- The history is persisted in `workspace.json` (via `ItemView.getState`).
- Repeated lookups for the same URL can be served from cache (`getFromHistory`) without a new network request.

## 3) Formatting templates

Key settings:

- `verseTemplate` / `pubTemplate` — non-callout output
- `verseCalloutTemplate` / `pubCalloutTemplate` — callout output

Placeholders:

- `{title}` — title / link
- `{text}` — citation text

### Important note about callouts (`[!cite]`)

Obsidian callouts require a blockquote marker `>` before the bracket:

```md
> [!cite] ...
> text
```

The code contains a safeguard: if the template includes `[!cite]` but does not start with `>`, the plugin auto-prefixes the template with `> ` and normalizes the body so that each line starts with `> `.

## 4) Global functions (outside classes)

These functions are used by multiple parts of the plugin.

### 4.1 Publication availability

- `checkPublicationAvailability(pubCode, lang = 'EN', year = null)`
  - Checks whether a publication is available online.
  - Especially relevant for Watchtower year gating (RU: from 1986, EN/ES: from 1950).
  - Returns `{ isOffline, message }`.

### 4.2 Language and URLs

- `isRussianText(text)`
  - Quick check for Cyrillic characters.

- `detectLanguage(text)`
  - Detects input language (RU/ES/EN) using characters/keywords.
  - Used when `settings.lang === 'Auto'`.

- `getConfigForLanguage(lang = 'EN')`
  - Returns per-language URL bases and locale values.

- `getFinderUrl(lang)`
  - Returns the base `jw.org/finder` URL for a language.

- `getJWLibraryLocale(lang)`
  - Returns `&wtlocale=...` for JW Library links.

### 4.3 Watchtower auto-formatting

These attempt to convert “human input” (e.g. `w25 March p. 8 par. 2`) into a canonical form that is easier to parse and search.

- `autoFormatRussianWatchtower(input)`
- `autoFormatEnglishWatchtower(input)`
- `autoFormatSpanishWatchtower(input)`

### 4.4 Switching UI language

- `updateInterfaceLanguage(interfaceLang)`
  - Sets the global `Lang` mapping from `InterfaceStrings`.

### 4.5 Debug/test helpers (when `settings.debug`)

- `testRussianPubRegex(input)`
- `testEnglishPubRegex(input)`
- `testScriptureRegex(input)`

They print detailed regex match diagnostics to the console.

## 5) `JWLLinkerPlugin` (main class)

This is the “core” of the plugin: command handling, selection reading, parsing, network fetching, formatting, and editor insertion.

### 5.1 Lifecycle

- `constructor()`
  - Initializes settings and the menu.

- `onload()`
  - Loads settings (`loadSettings`).
  - Registers commands.
  - Registers editor context-menu integration.
  - Registers the view (`JWLLinkerView`).
  - Registers the Reading View post processor (`MarkdownPostProcessor`).
  - Attaches the settings tab.

- `onunload()`
  - Plugin unload hook (currently empty).

- `loadSettings()` / `saveSettings()`
  - Reads/writes plugin settings.

- `activateView()`
  - Opens the history sidebar view.

### 5.2 Dual mode (two-language output)

- `_resolveAutoLanguage()`
  - Converts `Auto` into an actual language code (`en|ru|es`) based on interface language / system locale.

- `_getDualLanguages()`
  - Returns `{ firstLang, secondLang }`.
  - Ensures the two languages are different.

- `_getLanguageLabel(langCode)`
  - Returns display labels like `**English:**` / `**Russian:**`.

- `_fetchDualBibleCitation(input, view, caret, command)`
  - Fetches Bible text in two languages.

- `_fetchDualPublicationCitation(input, view, command)`
  - Fetches publication citations in two languages.
  - Parses multiple formats (month/number, month/day, other publications).
  - For `wYY.MM ...` it accepts optional unit markers `с.` / `p.` / `pág.`.

- `_fetchCitationByLanguage(input, langCode, view, command, paragraph, wolUrl)`
  - Unified language routing: for a given language code it calls the correct `_fetch*` method.

### 5.3 UI-level commands (what the user invokes)

- `showMenu(editor)` / `buildMenu(menu)`
  - Builds and shows the context menu.

- `confirmEditor(editor)`
  - Ensures there is an active editor.

- `_getEditorSelection(editor, useSelection = true)`
  - Returns selection/current line/caret.

- `linkToJWLibrary(editor, command)`
  - Converts references/URLs into JW Library links (Editing/Preview).

- `citeSelectedText(editor)`
  - Wraps selected text into a `[!cite]` callout.

- `batchConvertAllLinks(editor)`
  - Finds all references in a note and inserts citations under each matching line.

### 5.4 Parsing, formatting and link generation

(There are many methods; below are the key groups.)

#### 5.4.1 Bible

- `_parseScriptureLinks(...)`
  - Finds Bible references using regex and returns structured references.

- `_convertScriptureToJWLibrary(input, displayType, ...)`
  - Generates `jwlibrary://` links and/or HTML output for Reading View.

- `_fetchBibleCitation(input, view, caret, command)`
  - Main entry point for “fetch verse text / range”.

- `_fetchBibleVerseByLanguage(passage, langCode, langToWol, view, command)`
  - Fetches Bible verses for a specific language.

#### 5.4.2 Publications

- `_fetchPublicationCitation(input, view, command)`
  - Main router for publication references.
  - Tries different regex formats and dispatches to the correct fetch function.

- `_fetchRussianPublicationCitation(input, view, command)`
  - RU publications (plain output).

- `_fetchRussianPublicationCitationCallout(input, view, command)`
  - RU publications (callout output).

- `_fetchEnglishPublicationCitation(input, view, command)`
  - EN format like `w65 6/1 p. ...`.

- `_fetchEnglishMonthNumberPublicationCitation(input, view, command)`
  - EN format like `w23.12 ... par. ...`.

- `_fetchEnglishMonthPublicationCitation(input, view, command)`
  - EN format with month name like `w20 August p. ...`.

- `_fetchSpanishMonthPublicationCitation(input, view, command)`
  - ES format with month name like `w20 Agosto pág. ...`.

- `_fetchOtherPublicationCitation(input, view, command)`
  - Other publications (`od`, `it-1`, `cl`, `si`, ...). Attempts to extract text, otherwise falls back to search links.

- `_fetchOtherPublicationCitationForLang(input, langCode, view, command)`
  - Same as above but forced language (used by dual mode).

#### 5.4.3 URL-based citation (WOL/JW/Finder)

- `_fetchParagraphCitation(input, view, caret, command, pars)`
  - For URLs like `wol.jw.org/...#pNN` it extracts one/multiple paragraphs.

- `_fetchLookupCitation(input, view)`
  - Publication reference lookup via WOL search.

### 5.5 HTML fetching and text extraction

- `_fetchDOM(url)`
  - Downloads a page via `requestUrl` and parses it into a DOM.

- `_getElementAsText(dom, selector, type, follows = false)`
  - Extracts text via CSS selectors and cleans it based on target type.

- `_boldInitialNumber(text)`
  - Makes the initial verse/paragraph number bold (`**N**`).

### 5.6 Misc utilities

`main.js` also contains smaller helper methods (callout detection, line-number calculations, caret link extraction, etc.) used by batch conversion, link conversion, and URL handlers.

## 6) `JWLLinkerView` — history sidebar

`JWLLinkerView` stores citation history and allows quick copy.

- `getState()`
  - Returns the view state including `history` for persistence.

- `onOpen()` / `onClose()`
  - Open/close hooks.

- `renderView()`
  - Builds the panel UI and click handlers.

### History methods

- `showHistory()`
  - Re-renders the history list.

- `addToHistory(url, link, content, pars = null)`
  - Adds an item (dedupes by key) and enforces max size.

- `getFromHistory(url, pars = null)`
  - Returns cached entries.

- `clearHistory()`
  - Clears history.

## 7) `ScripturePostProcessor` — Reading View

- `constructor(containerEl, plugin)`
  - Stores a reference to the plugin.

- `onload()`
  - Reads HTML, runs `_convertScriptureToJWLibrary(...)`, replaces HTML if changed.

## 8) `JWLLinkerSettingTab` — settings

- `display()`
  - Renders the settings UI.
  - Exposes:
    - templates,
    - interface language,
    - citation language,
    - dual mode,
    - history,
    - debug.

- `_resolveAutoLanguage()`
  - Similar logic to `JWLLinkerPlugin`, but used inside the settings tab.

## 9) Where to look for specific implementations

If you need to follow the code “top to bottom”, these are the main entry points:

- **Config / Regex / URL**: near the top of the file
- **`JWLLinkerPlugin`**: starts at `class JWLLinkerPlugin extends Plugin`
- **Fetch methods**: search for `_fetch` (network/parsing/formatting)
- **View/History**: `class JWLLinkerView extends ItemView`
- **Reading View**: `ScripturePostProcessor`
- **Settings**: `JWLLinkerSettingTab`

---

If you want, I can generate an extended version:

- a table: “method → inputs → outputs → side effects (network/editor/history)”
- or a 1:1 reference for every `JWLLinkerPlugin` method in file order (very long).
