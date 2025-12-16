# JWL Linker EN-RU-ES — разбор кода (`main.js`)

Этот файл объясняет, как работает плагин **JWL Linker EN-RU-ES** для Obsidian и за что отвечают основные функции/методы в `main.js`.

## 1) Общая архитектура

Плагин — это один основной файл `main.js`, внутри которого находятся:

- **Глобальные константы/конфиги**
  - `DEFAULT_SETTINGS` — настройки по умолчанию (шаблоны цитат, языки, dual mode, история и т.д.)
  - `InterfaceStrings` + `Lang` — строки интерфейса (RU/EN/ES)
  - `Config` — регулярные выражения и URL-шаблоны для WOL/JW/Finder/JW Library
  - справочники месяцев/книг и др.

- **Глобальные функции-хелперы**
  - детект языка, автоформатирование ссылок, построение URL и т.п.

- **Классы**
  - `JWLLinkerPlugin extends Plugin` — основной класс плагина: команды, обработка текста, запросы, форматирование, dual-mode.
  - `JWLLinkerView extends ItemView` — боковая панель истории (кэш цитат) и UI.
  - `ScripturePostProcessor extends MarkdownRenderChild` — пост-обработка Reading View: заменяет ссылки/тексты на `jwlibrary://` ссылки.
  - `JWLLinkerSettingTab extends PluginSettingTab` — настройки плагина.

## 2) Потоки работы (data flow)

### 2.1 Editing View (редактор)

1. Пользователь запускает команду (через контекстное меню или Command Palette).
2. Команда получает:
   - `selection` (если выделено) или текущую строку/каретку.
3. Плагин определяет тип ввода:
   - ссылка WOL/JW.org/Finder,
   - библейская ссылка,
   - публикация (Watchtower/Study, книги и др.),
   - произвольный текст (lookup на WOL).
4. Для цитирования:
   - формируются URL на `wol.jw.org` или `jw.org/finder`/`jwlibrary://`;
   - при необходимости загружается HTML (`requestUrl`) и вытаскивается текст абзаца/стиха.
5. Результат форматируется шаблоном:
   - обычный текст (`pubTemplate`, `verseTemplate`),
   - callout (`pubCalloutTemplate`, `verseCalloutTemplate`),
   - специальный callout для выделенного текста (`citeSelectedText`).
6. Результат вставляется/заменяет текст в редакторе.

### 2.2 Reading View (просмотр)

1. Obsidian вызывает зарегистрированный `MarkdownPostProcessor`.
2. `ScripturePostProcessor` берет HTML блока, ищет библейские ссылки/референсы.
3. Подменяет найденные элементы на `jwlibrary://` ссылки.

### 2.3 История/кэш

- Все успешные цитаты добавляются в историю боковой панели (`JWLLinkerView.addToHistory`).
- История хранится в `workspace.json` (через `ItemView.getState`).
- Повторные запросы для того же URL берутся из кэша (`getFromHistory`) и не требуют сетевого запроса.

## 3) Шаблоны форматирования

Ключевые настройки:

- `verseTemplate` / `pubTemplate` — формат без callout
- `verseCalloutTemplate` / `pubCalloutTemplate` — формат callout

Подстановки:

- `{title}` — заголовок/ссылка
- `{text}` — текст цитаты

### Важно про callout (`[!cite]`)

Obsidian callout требует `>` перед `[`:

```md
> [!cite] ...
> text
```

В коде добавлена защита: если шаблон содержит `[!cite]`, но не начинается с `>`, плагин автоматически префиксует шаблон `> ` и приводит текст к виду «каждая строка начинается с `> `».

## 4) Глобальные функции (вне классов)

Ниже — функции, которые используются многими частями плагина.

### 4.1 Доступность публикаций

- `checkPublicationAvailability(pubCode, lang = 'EN', year = null)`
  - Проверяет, доступна ли публикация онлайн.
  - Особенно важно для Watchtower по годам (RU: с 1986, EN/ES: с 1950).
  - Возвращает `{ isOffline, message }`.

### 4.2 Язык и URL

- `isRussianText(text)`
  - Быстрая проверка наличия кириллицы.

- `detectLanguage(text)`
  - Определяет язык ввода (RU/ES/EN) по символам/ключевым словам.
  - Используется при `settings.lang === 'Auto'`.

- `getConfigForLanguage(lang = 'EN')`
  - Возвращает объект с URL-базами и локалями для выбранного языка.

- `getFinderUrl(lang)`
  - Возвращает базовый `jw.org/finder` URL для языка.

- `getJWLibraryLocale(lang)`
  - Возвращает `&wtlocale=...` для JW Library.

### 4.3 Авто-форматирование ссылок Watchtower

Эти функции пытаются превратить «человеческий» формат (например, `w25 March p. 8 par. 2`) в формат, который лучше парсится и стабильно ищется.

- `autoFormatRussianWatchtower(input)`
- `autoFormatEnglishWatchtower(input)`
- `autoFormatSpanishWatchtower(input)`

### 4.4 Переключение языка интерфейса

- `updateInterfaceLanguage(interfaceLang)`
  - Переключает глобальную переменную `Lang` на нужный раздел `InterfaceStrings`.

### 4.5 Debug/тест функции (при `settings.debug`)

- `testRussianPubRegex(input)`
- `testEnglishPubRegex(input)`
- `testScriptureRegex(input)`

Они печатают в консоль подробный разбор совпадений regex.

## 5) `JWLLinkerPlugin` (основной класс)

Это «сердце» плагина: обработка команд, получение выделения, разбор ссылок, сетевые запросы, форматирование и вставка.

### 5.1 Жизненный цикл

- `constructor()`
  - Инициализирует настройки и меню.

- `onload()`
  - Загружает настройки (`loadSettings`).
  - Регистрирует команды.
  - Регистрирует правый клик меню.
  - Регистрирует View (`JWLLinkerView`).
  - Регистрирует `MarkdownPostProcessor` для Reading View.
  - Подключает SettingTab.

- `onunload()`
  - Точка выгрузки (в текущем коде пустая).

- `loadSettings()` / `saveSettings()`
  - Чтение/запись настроек.

- `activateView()`
  - Открывает боковую панель истории.

### 5.2 Dual mode (двуязычный вывод)

- `_resolveAutoLanguage()`
  - Преобразует `Auto` в реальный код языка (`en|ru|es`) на основе языка интерфейса/локали.

- `_getDualLanguages()`
  - Возвращает `{ firstLang, secondLang }`.
  - Гарантирует, что языки не совпадают.

- `_getLanguageLabel(langCode)`
  - Делает строку вида `**English:**` / `**Russian:**`.

- `_fetchDualBibleCitation(input, view, caret, command)`
  - Получает библейский текст в двух языках.

- `_fetchDualPublicationCitation(input, view, command)`
  - Получает цитату публикации в двух языках.
  - Парсит разные форматы (месяц/номер, месяц/день, другие публикации).
  - Для `wYY.MM ...` поддерживает опциональные `с.`/`p.`/`pág.`.

- `_fetchCitationByLanguage(input, langCode, view, command, paragraph, wolUrl)`
  - Унифицированная маршрутизация: по коду языка вызывает нужный `_fetch*` метод.

### 5.3 Команды уровня UI (что вызывает пользователь)

- `showMenu(editor)` / `buildMenu(menu)`
  - Отрисовка и построение контекстного меню.

- `confirmEditor(editor)`
  - Проверяет наличие активного редактора.

- `_getEditorSelection(editor, useSelection = true)`
  - Возвращает выделение/строку/позицию каретки.

- `linkToJWLibrary(editor, command)`
  - Конвертер ссылок в `jwlibrary://` (для Editing/Preview).

- `citeSelectedText(editor)`
  - Оборачивает выделенный текст в callout `[!cite]`.

- `batchConvertAllLinks(editor)`
  - Находит все ссылки/референсы в документе и добавляет цитаты ниже каждой строки.

### 5.4 Парсинг, форматирование и генерация ссылок

(В коде много методов; ниже — ключевые группы.)

#### 5.4.1 Библия

- `_parseScriptureLinks(...)`
  - Находит библейские референсы regex-ом и превращает в структурированные ссылки.

- `_convertScriptureToJWLibrary(input, displayType, ...)`
  - Генерирует `jwlibrary://` ссылки и/или HTML для Reading View.

- `_fetchBibleCitation(input, view, caret, command)`
  - Основной вход для «получить текст стихов/отрезка».

- `_fetchBibleVerseByLanguage(passage, langCode, langToWol, view, command)`
  - Получает текст стихов для конкретного языка.

#### 5.4.2 Публикации

- `_fetchPublicationCitation(input, view, command)`
  - Главный «router» для публикаций.
  - Проверяет regex’ы разных форматов и вызывает нужный метод.

- `_fetchRussianPublicationCitation(input, view, command)`
  - Публикации RU (обычный формат).

- `_fetchRussianPublicationCitationCallout(input, view, command)`
  - Публикации RU (callout).

- `_fetchEnglishPublicationCitation(input, view, command)`
  - Публикации EN в формате `w65 6/1 p. ...`.

- `_fetchEnglishMonthNumberPublicationCitation(input, view, command)`
  - EN формат `w23.12 ... par. ...`.

- `_fetchEnglishMonthPublicationCitation(input, view, command)`
  - EN формат с названием месяца `w20 August p. ...`.

- `_fetchSpanishMonthPublicationCitation(input, view, command)`
  - ES формат с названием месяца `w20 Agosto pág. ...`.

- `_fetchOtherPublicationCitation(input, view, command)`
  - Другие публикации (`od`, `it-1`, `cl`, `si`, ...), с попыткой вытащить текст/или дать поисковые ссылки.

- `_fetchOtherPublicationCitationForLang(input, langCode, view, command)`
  - То же самое, но явным языком (используется в dual mode).

#### 5.4.3 Цитирование по URL (WOL/JW/Finder)

- `_fetchParagraphCitation(input, view, caret, command, pars)`
  - Для URL вида `wol.jw.org/...#pNN` вытаскивает один/несколько абзацев.

- `_fetchLookupCitation(input, view)`
  - Делает «publication reference lookup» через WOL search.

### 5.5 Работа с HTML и извлечением текста

- `_fetchDOM(url)`
  - Загружает страницу через `requestUrl` и парсит DOM.

- `_getElementAsText(dom, selector, type, follows = false)`
  - Извлекает текст по CSS-селектору и чистит HTML.

- `_boldInitialNumber(text)`
  - Делает начальный номер (стиха/абзаца) жирным (`**N**`).

### 5.6 Прочие утилиты

В `main.js` есть дополнительные «малые» методы (проверка callout, вычисление номера строки, поиск ссылки у каретки и т.п.). Они используются в `batchConvertAllLinks`, конвертере ссылок и обработчиках URL.

## 6) `JWLLinkerView` — боковая панель истории

`JWLLinkerView` хранит историю цитат и позволяет быстро копировать их.

- `getState()`
  - Возвращает состояние view, включая `history` (для сохранения).

- `onOpen()` / `onClose()`
  - Хуки открытия/закрытия.

- `renderView()`
  - Рисует UI панели, включая help-секцию и обработчики кликов.

### История

- `showHistory()`
  - Перерисовывает список истории.

- `addToHistory(url, link, content, pars = null)`
  - Добавляет элемент в историю (с дедупликацией) и ограничивает размер.

- `getFromHistory(url, pars = null)`
  - Достает кэш по ключу.

- `clearHistory()`
  - Очищает историю.

## 7) `ScripturePostProcessor` — Reading View

- `constructor(containerEl, plugin)`
  - Сохраняет ссылку на `plugin`.

- `onload()`
  - Берет HTML, прогоняет `_convertScriptureToJWLibrary(...)` и заменяет HTML при изменениях.

## 8) `JWLLinkerSettingTab` — настройки

- `display()`
  - Рисует UI настроек Obsidian.
  - Настраивает:
    - шаблоны,
    - язык интерфейса,
    - язык цитат,
    - dual mode,
    - историю,
    - debug.

- `_resolveAutoLanguage()`
  - Аналог логики в `JWLLinkerPlugin`, но для настроек.

## 9) Где смотреть конкретную реализацию

Если тебе нужно «прямо построчно» разобраться, лучше идти сверху вниз по блокам:

- **Config / Regex / URL**: начало файла
- **JWLLinkerPlugin**: начинается с `class JWLLinkerPlugin extends Plugin`
- **Fetch-методы**: ищи `_fetch` (все сетевые/парсинг функции)
- **View/History**: `class JWLLinkerView extends ItemView`
- **Reading View**: `ScripturePostProcessor`
- **Settings**: `JWLLinkerSettingTab`


