# JWL Linker — разбор кода (`main.js`)

Этот документ объясняет, как устроен плагин **JWL Linker** для Obsidian и где в `main.js` находится каждая его часть. Описана версия 0.10.0. Английская версия — [PLUGIN_CODE_GUIDE_EN.md](PLUGIN_CODE_GUIDE_EN.md).

## 1) Архитектура

Весь плагин — один написанный вручную файл `main.js`, без сборки. Тесты в `tests/` загружают его с заглушкой модуля `obsidian` (`tests/helpers/load-plugin.js`).

Сверху вниз в файле находятся:

| Часть | Что это |
|---|---|
| `DEFAULT_SETTINGS` | Настройки по умолчанию: шаблоны, языки, двуязычный режим, история, переключатели |
| `InterfaceStrings`, `Lang` | Строки интерфейса на русском, английском, испанском, португальском, французском и немецком; `Lang` — текущий набор |
| Таблицы языков | `Languages`, `LanguageInfo`, `WtLocales`, `LangByWtlocale`, `OfflinePublications`, `OfflineMessages` (раздел 3) |
| `Config` | Регулярные выражения для стихов, публикаций и ссылок; базовые адреса |
| Функции для публикаций | Таблицы месяцев, автоформатирование «Сторожевой башни», `PubLangs`, `PublicationTitles`, разбор ссылок и построение запросов (раздел 5) |
| Функции для редактора | Предпросмотр стиха, ссылки в Live Preview, подсказки (раздел 2) |
| `JWLLinkerPlugin` | Главный класс: команды, разбор, загрузка, форматирование |
| `JWLLinkerView` | Боковая панель с историей |
| `ScripturePostProcessor` | Режим чтения: превращает ссылки на стихи в ссылки JW Library |
| `JWLLinkerSettingTab` | Экран настроек |
| `Bible`, `_BibleVerses` | Названия и сокращения книг на каждом языке; число стихов в каждой главе |

## 2) С чего начинается каждая функция плагина

### 2.1 Команды в редакторе

1. Команда из контекстного меню (`buildMenu`) или палитры команд вызывает `insertCitation(editor, command, pars)`, `linkToJWLibrary`, `openInJWLibrary`, `openSelectedInWOL`, `citeSelectedText` или `batchConvertAllLinks`.
2. `_getEditorSelection` возвращает выделение или текущую строку и позицию курсора.
3. `insertCitation` нормализует текст (`normalizeInput`), переводит названия месяцев «Сторожевой башни» в стандартный вид (`autoFormat*Watchtower`) и выбирает обработчик по команде и содержимому:
   - ссылка на публикацию → `_fetchPublicationCitation` (в двуязычном режиме `_fetchDualPublicationCitation`);
   - стих → `_fetchBibleCitation` (или `_fetchDualBibleCitation`);
   - ссылка на wol.jw.org / jw.org → `_fetchParagraphCitation`.
4. Результат вставляется под строкой или заменяет выделение.

`batchConvertAllLinks` находит в заметке все стихи и публикации (кроме тех, что уже внутри выносок) и вставляет цитаты-выноски под каждой строкой.

### 2.2 Режим чтения

`onload` регистрирует пост-процессор Markdown, который создаёт `ScripturePostProcessor` для каждого отрисованного блока. Он пропускает заголовки и выноски, проходит по обычным текстовым узлам (не ссылкам, не коду и не формулам) и заменяет каждую ссылку на стих элементом `<a>` через `linkScripturesInTextNode`. Используется только DOM API; текст заметки не меняется.

### 2.3 Ссылки в Live Preview

`_registerLivePreviewLinks` добавляет `ViewPlugin` CodeMirror. При каждом изменении документа, прокрутке или смене режима он заново строит подчёркивания для видимых строк:

- `scriptureLinkRanges(plugin, text)` возвращает позиции отрывков в строке и их ссылки JW Library. Результаты кэшируются по тексту строки (`LivePreviewCacheSize` строк), поэтому при наборе разбирается только изменённая строка. Кэш сбрасывается, если меняется язык цитирования или пробел после знаков препинания.
- `computeScriptureLinkRanges` выполняет работу без кэша; `passageSegments` делит ссылку вида `Пс 23:1-3, 5; 24:1` на отдельный диапазон для каждого отрывка.
- Код, ссылки, front matter и другие элементы синтаксиса пропускаются. Cmd/Ctrl+клик открывает ссылку.

### 2.4 Предпросмотр стиха (компьютер)

`_registerVersePreview` ждёт, пока курсор мыши задержится на ссылке JW Library дольше `VersePreviewDelayMs`. `_fetchVersePreview` превращает ссылку в адрес страницы jw.org (`parseJwlBibleHref`), загружает до `VersePreviewMaxVerses` стихов и кэширует удачные результаты. Окно рисуют `createVersePopover` и `fillVersePopover`.

### 2.5 Подсказки при наборе

`ReferenceSuggest` (`EditorSuggest`) открывается после символа-триггера (по умолчанию `@`) в начале слова. `suggestionsFor(query, preferredLang)` подбирает книги Библии (сначала на предпочитаемом языке, потом на остальных) и коды публикаций из `PublicationTitles`.

### 2.6 История

Удачные цитаты добавляются в боковую панель (`JWLLinkerView.addToHistory`) и сохраняются в раскладке рабочего пространства (`getState`). `getFromHistory` отдаёт повторный запрос без нового обращения к сайту.

## 3) Языки

Ключи языков: `EN`, `RU`, `ES`, `PT` (португальский, Бразилия), `FR` и `DE`. Для нидерландского (`NL`) есть только код JW Library для ссылок.

| Таблица / функция | Назначение |
|---|---|
| `Languages` | Значение настройки (`'Portuguese'`) → ключ языка (`'PT'`) |
| `LanguageInfo` | Для каждого языка: код JW Library и finder (`wtlocale`), сайт и библиотека WOL (`r5/lp-t`), слово BIBLE для заголовка выноски |
| `WtLocales`, `LangByWtlocale` | Ключ языка ↔ буква `wtlocale` (`T`, `F`, `X`, …) |
| `getConfigForLanguage(lang)` | Адреса статей, публикаций и поиска на WOL и адрес finder для языка |
| `getFinderUrl`, `getJWLibraryLocale` | Базовый адрес jw.org finder и `&wtlocale=` для ссылок |
| `Bible[lang]` | `Book` — названия для показа; `Abbreviation` — для каждой книги строка названий в нижнем регистре без пробелов и точек: полное название, длинное и короткое сокращение WOL, написания без диакритики |
| `BibleSearchOrder` | Порядок, в котором языки проверяются при поиске книги |
| `PubLangs[lang]` | Правила публикаций: обозначения главы, страницы и абзаца, порядок дня и месяца, названия «Сторожевой башни», формат месяца и выпуска |
| `PublicationTitles[lang]` | Названия публикаций по коду (`od`, `it-1`, `lff`, …) |
| `OfflinePublications`, `OfflineMessages` | Публикации, которых нет онлайн, и сообщения о них |
| `InterfaceStrings[name]` | Текст интерфейса; у каждого языка ровно те же ключи, что у английского (это проверяет тест) |
| `InterfaceLangCodes`, `DualLangCodes` | Язык интерфейса → код для двуязычного режима (`pt`); языки, доступные в двуязычном режиме |

### 3.1 Как определяется язык

Если язык цитирования — «Автоопределение»:

- **Стихи**: `detectBookLanguage(bookKey)` решает по названию книги. Английский, испанский и русский «забирают» любой ключ, с которого начинается одно из их названий (так сохраняется прежнее поведение: `fil` и `apo` остаются испанскими). Португальский, французский и немецкий забирают только свои точные названия и сокращения (`joão`, `jean`, `1mo`). Если ни один язык не подошёл, используется `detectLanguage(text)`.
- **Прочий текст** (поиск на WOL): `detectLanguage(text)` — кириллица означает русский, дальше проверяются `LanguagePatterns` (слова и обозначения, которые есть только в одном языке; строятся при первом использовании).
- **Публикации**: решает обозначение абзаца (`абз.` — RU, `párr.` — ES, `§` — FR, `Abs.` — DE). `p.` и `par.` общие у английского и португальского, поэтому они относятся к `LatinFormatLang`: португальский, если интерфейс на португальском, иначе английский (`updatePublicationFormatLanguage`).

Если язык цитирования выбран вручную, этот язык проверяется первым, и ссылка переводится на него.

### 3.2 Поиск книги

`findBibleBook(bookKey, preferredLang)` ищет сначала в предпочитаемом языке, потом в порядке `BibleSearchOrder`. Внутри каждого языка точное название или сокращение важнее более длинного названия, которое начинается с ключа (португальское `jo` — это João, а не Josué). Результаты кэшируются (`BookLookupCache`).

## 4) Ссылки на Библию

- **Регулярные выражения** (`Config`): `scriptureRegex` (книга глава:стих), `scriptureNoChpRegex` (книги из одной главы: Авдий, Филимону, 2 и 3 Иоанна, Иуды — число означает стих) и `scriptureNoVerseRegex` (только глава). Они также понимают немецкое `1. Mose` и названия из нескольких слов (`Song of Solomon`, `Hohes Lied`, `Chant de Salomon`, `Cântico de Salomão`).
- **`_parseScriptureLinks(input, displayType, …)`** применяет регулярки и строит ссылки с отрывками. Внутри `validateReference` определяет язык и книгу, проверяет главу и стихи по `maxVerse` (`_BibleVerses`) и строит ссылки.
- **Идентификатор**: книга, глава и стих в виде `BBCCCVVV` (`43003016` — Иоанна 3:16; диапазон — `первый-последний`). JW Library: `jwlibrary:///finder?bible=<id>&wtlocale=<код>`; текст стиха берётся с `https://www.jw.org/finder?wtlocale=<код>&bible=<id>`.
- **`_convertScriptureToJWLibrary`** пишет ссылки Markdown (команда «Преобразовать стихи в JW Library»).
- **`_fetchBibleCitation`** загружает стихи (элементы `#v<id>`), заполняет `verseTemplate` / `verseCalloutTemplate` и переводит слово BIBLE в заголовке выноски на язык ссылки (`translateBibleLabel`). Стихи одной главы попадают в одну выноску.
- **Двуязычный режим**: `_fetchDualBibleCitation` → `_fetchBibleVerseByLanguage` для каждого языка; `localizeBookName` показывает название книги на этом языке.

## 5) Публикации

Цитирование любой публикации проходит три шага:

1. **Разбор** ссылки в том формате, в котором её набрали:
   - «Сторожевая башня»: `parseWatchtowerReference` (`WatchtowerRegex`) → год, месяц, день (до 2016 года), страница, абзацы, исходный язык. Немецкий пишет выпуск как `15. 1.`; дата вида `15/1` в английском формате читается как день/месяц.
   - Другие публикации: `parseOtherPublicationReference` (`Config.otherPubRegex`, `matchOtherPublication`, `isLikelyPublication`, `KnownPubCodes`) → код, глава или номер, страница, абзацы, исходный язык.
2. **Запрос к WOL и заголовок на языке цитирования**: `formatWatchtowerQuery` / `formatWatchtowerTitle`, `formatOtherPublicationQuery` / `formatOtherPublicationTitle` по правилам `PubLangs`. `paragraphQueries` делает отдельный запрос на каждый абзац (до `MaxCitedParagraphs`), потому что одиночные абзацы WOL находит надёжно.
3. **Загрузка и оформление**: `_citeFromWol` загружает страницу поиска WOL, берёт абзац из `.resultItems`, заполняет `pubTemplate` / `pubCalloutTemplate` и заменяет метку `PUB.` на метку языка.

Точка входа: `_fetchPublicationCitation` → `_fetchWatchtowerCitation`, `_fetchOtherPublicationCitation` или, для остального, `_fetchLookupCitation` (обычный поиск на WOL). `_publicationLanguage(detected)` выбирает язык цитирования (из настройки или определённый). `checkPublicationAvailability` сразу останавливает цитирование для печатных публикаций и лет «Сторожевой башни», которых нет онлайн.

Названия месяцев, набранные вручную, сначала переводятся в стандартный вид: `autoFormatRussianWatchtower`, `autoFormatEnglishWatchtower`, `autoFormatSpanishWatchtower` и `autoFormatOtherWatchtower` (португальский, французский, немецкий; `MonthNameWatchtowerFormats`). Все, кроме русской, построены на `autoFormatLatinWatchtower`.

Форматы запросов по языкам (проверены на WOL):

| Язык | «Сторожевая башня» с 2016 | До 2016 | Другие публикации |
|---|---|---|---|
| Английский | `w23.12 p. 20 par. 7` | `w10 1/15 p. 3 par. 1` | `od chap. 15 par. 3` |
| Русский | `w23.12 20, абз. 7` | `w10 15/1 с. 3 абз. 1` | `od глава 15 абз. 3` |
| Испанский | `w23.12 pág. 20 párr. 7` | `w10 15/1 pág. 3 párr. 1` | `od cap. 15 párr. 3` |
| Португальский | `w23.12 p. 20 par. 7` | `w10 15/1 p. 3 par. 1` | `od cap. 15 par. 3` |
| Французский | `w23.12 p. 20 § 7` | `w10 15/1 p. 3 § 1` | `od chap. 15 § 3` |
| Немецкий | `w23.12 S. 20 Abs. 7` | `w10 15. 1. S. 3 Abs. 1` | `od Kap. 15 Abs. 3` |

## 6) Ссылки на jw.org и WOL

- `_getLinksInText`, `_getLinkAtCaret`, `_extractLinkParts` находят ссылку на wol.jw.org или jw.org и идентификаторы документа и абзацев (`#h=5-7`, `par=5-7`).
- `_fetchParagraphCitation` цитирует абзацы по ссылке, с заголовком страницы в качестве текста ссылки (команды «Цитировать ссылку jw.org», «Добавить заголовок к ссылке jw.org»).
- `_convertWebToJWLibrary` превращает ссылку jw.org в ссылку JW Library.

## 7) Загрузка и очистка текста

- `_fetchDOM(url)` — `requestUrl` и `DOMParser`; при ошибке возвращает `null`.
- `_getElementAsText(dom, selector, type, follows)` — текст стиха, абзаца или заголовка без значков сносок и лишних пробелов.
- `_boldInitialNumber(text)` — номер стиха или абзаца в виде `**4**` (настройка «Номера стихов жирным шрифтом»).
- `fillCitationTemplate(template, title, text)` — подставляет `{title}` и `{text}`. В шаблоне выноски каждая строка многострочного текста остаётся внутри выноски, без двойного `>`.

## 8) Шаблоны

Настройки `verseTemplate`, `verseCalloutTemplate`, `pubTemplate`, `pubCalloutTemplate` с подстановками `{title}` (заголовок или ссылка) и `{text}` (цитируемый текст). Выноскам Obsidian нужен `>` перед `[!cite]`:

```md
> [!cite] PUB. — {title}
> {text}
```

## 9) Боковая панель и настройки

- `JWLLinkerView`: `renderView`, `showHistory`, `addToHistory(url, link, content, pars)`, `getFromHistory`, `clearHistory`, `getState` / `setState`.
- `JWLLinkerSettingTab.display()` строит экран настроек. Списки языков берутся из `Lang.citationLangOptions` и `Lang.dualLangOptions`; выбор языков двуязычного режима появляется, только когда он включён.
- `loadSettings` / `saveSettings` заодно обновляют язык интерфейса (`updateInterfaceLanguage`) и `LatinFormatLang`.

## 10) Производительность

- Запуск занимает около 7 мс: около 5 мс движок компилирует `main.js`, остальное — таблицы верхнего уровня и `onload`. При загрузке ничего тяжёлого не строится: `maxVerse` читает компактную таблицу `_BibleVerses` напрямую, а `LanguagePatterns` строятся при первом использовании.
- Набор текста в Live Preview стоит около 0,04 мс на нажатие благодаря кэшу по строкам.
- Кэши: `BookLookupCache` и `BookLanguageCache` (поиск книг), кэш строк в `scriptureLinkRanges`, `VersePreviewCacheSize` предпросмотров стихов и боковая панель истории для цитат.

## 11) Как добавить язык

1. `LanguageInfo` и `WtLocales` / `LangByWtlocale`: код JW и библиотека WOL. Их видно в адресах wol.jw.org (путь библиотеки, например `/pt/wol/l/r5/lp-t`).
2. `Bible.<КЛЮЧ>`: 66 названий `Book` и строк `Abbreviation` из оглавления Библии на WOL на этом языке (`https://wol.jw.org/<site>/wol/binav/<rsconf>/<lib>`). Добавьте ключ в `BibleSearchOrder` и в список языков в `suggestionsFor`; решите в `detectBookLanguage`, может ли язык забирать начала названий или только точные названия.
3. Названия книг с пробелом или точкой, которые общая регулярка не находит (как `1. Mose`, `Hohes Lied`), добавляются в `scriptureRegex` / `scriptureNoVerseRegex`; книги из одной главы — в `scriptureNoChpRegex`. Новой письменности (греческая, японская, …) нужны её буквы в регулярках.
4. `PubLangs`, `PublicationTitles`, `OfflinePublications`, `OfflineMessages`, названия месяцев и запись в `MonthNameWatchtowerFormats`. Каждый формат запроса сначала проверьте на WOL.
5. Обозначения в публикациях: `WatchtowerRegex`, `Config.otherPubRegex`, `isLikelyPublication`, `parseOtherPublicationReference` и `normalizeInput`; характерные слова — в `LanguagePatterns`.
6. `Languages`, `InterfaceStrings` (все ключи, включая `citationLangOptions` и `dualLangOptions` в каждом языке), `InterfaceLangCodes`, `DualLangCodes`, варианты интерфейса в `JWLLinkerSettingTab.display` и слово BIBLE в `BibleLabelRegex`.
7. Тесты в `tests/parsing.test.js` и README.

## 12) Тесты

`npm test` запускает `tests/parsing.test.js` встроенным в Node тест-раннером; `npm run check` проверяет синтаксис `main.js`. `tests/helpers/load-plugin.js` загружает `main.js` с заглушкой модуля `obsidian` и экспортирует внутренние функции из списка `EXPORTS` — новые функции, нужные тестам, нужно добавить туда.
