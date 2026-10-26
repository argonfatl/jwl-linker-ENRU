const {
  Plugin,
  Editor,
  ItemView,
  Menu,
  Notice,
  MarkdownRenderChild,
  MarkdownRenderer,
  requestUrl,
  PluginSettingTab,
  Setting,
  Platform,
  editorLivePreviewField,
  EditorSuggest,
} = require('obsidian');

const DEFAULT_SETTINGS = {
  verseTemplate: '{title}\u2002“*{text}*”', // non-breaking space
  verseCalloutTemplate: '> [!verse] BIBLE — {title}\n> {text}\n',
  pubTemplate: '{title}\n“*{text}*”',
  pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n',
  historySize: 20,
  boldInitialNum: true,
  versePreview: true, // show the verse text in a popup when hovering a scripture link (desktop only)
  livePreviewLinks: true, // mark scripture references as links in Live Preview
  suggestions: true, // suggest Bible books and publication codes after the trigger
  suggestTrigger: '@', // typed at the start of a word to open the suggestions
  citationLink: true,
  spaceAfterPunct: true,
  paraCount: 1,
  openSidebarOnStartup: false,
  debug: false,
  lang: 'Auto', // Auto-detect language
  fallbackLang: 'Russian', // Fallback if detection fails
  interfaceLang: 'Russian', // Interface language
  dualMode: false, // Legacy - kept for compatibility
  // Dual language mode settings
  dualModeVerses: false, // Enable dual mode for Bible verses
  dualModePublications: false, // Enable dual mode for publications
  dualLangFirst: 'Auto', // First language: Auto, ru, en, es
  dualLangSecond: 'en', // Second language: ru, en, es
};

// Multilingual interface strings
const InterfaceStrings = {
  Russian: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Это недопустимая ссылка на стих.',
    invalidUrl: '⚠️ Это недопустимая ссылка wol.jw.org.',
    invalidPublication: '⚠️ Это недопустимая ссылка на публикацию.',
    onlineLookupFailed: '⚠️ Не удалось получить текст из интернета. Попробуйте ещё раз.',
    noEditor: '⚠️ Нет активного редактора.',
    noSelection: '⚠️ На текущей строке нет текста или выделения.',
    noHistoryYet: 'История пока пуста.',
    noTitle: 'Нет заголовка',
    loadingCitation: '⏳ Загрузка цитаты:',
    copiedHistoryMsg: 'Элемент истории скопирован в буфер обмена',
    helpIntro: 'В этой боковой панели отображаются все недавние стихи, абзацы и публикации, которые вы цитировали с помощью плагина.',
    helpCopy: 'Нажмите на любой элемент выше, чтобы скопировать его в буфер обмена.',
    helpClear: 'Нажмите здесь, чтобы очистить историю поиска.',
    hideTip: 'Нажмите, чтобы скрыть',
    help: 'Справка',
    emptyPara: '*⟪ Пустой абзац ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    // Settings strings
    settingsDisplay: 'Отображение',
    settingsDisplayDesc: 'В шаблонах можно использовать следующие подстановки: {title}, {text}',
    settingsVerseTemplate: 'Шаблон для цитаты стихов',
    settingsVerseTemplateDesc: 'Используйте этот шаблон при цитировании библейских стихов в обычном текстовом формате',
    settingsVerseCallout: 'Шаблон для цитаты стихов в выноске',
    settingsVerseCalloutDesc: 'Используйте этот шаблон при цитировании библейских стихов в формате выноски',
    settingsPubTemplate: 'Шаблон для цитаты публикации',
    settingsPubTemplateDesc: 'Используйте этот шаблон при цитировании публикаций в обычном текстовом формате (jw.org или поиск статьи)',
    settingsPubCallout: 'Шаблон для цитаты публикации в выноске',
    settingsPubCalloutDesc: 'Используйте этот шаблон при цитировании публикаций в формате выноски (jw.org или поиск статьи)',
    settingsInterfaceLang: 'Язык интерфейса',
    settingsInterfaceLangDesc: 'Выберите язык интерфейса плагина.',
    settingsCitationLang: 'Язык цитат',
    settingsCitationLangDesc: 'Выберите язык для цитат или используйте автоопределение.',
    settingsHistorySize: 'Количество элементов истории',
    settingsHistorySizeDesc: 'Сколько элементов истории показывать в боковой панели.',
    settingsBoldNumbers: 'Номера стихов жирным шрифтом',
    settingsBoldNumbersDesc: 'Применять жирное форматирование к номерам стихов или абзацев в цитируемом тексте.',
    settingsVersePreview: 'Текст стиха при наведении',
    settingsVersePreviewDesc: 'Показывать текст стиха во всплывающем окне при наведении на ссылку (только на компьютере).',
    settingsSuggestions: 'Подсказки при вводе',
    settingsSuggestionsDesc: 'Введите триггер в начале слова и начало названия книги или кода публикации (например, @рим или @od), чтобы выбрать из списка.',
    settingsSuggestTrigger: 'Триггер подсказок',
    settingsSuggestTriggerDesc: 'Символы, которые открывают подсказки. По умолчанию @.',
    suggestBible: 'Библия',
    suggestPublication: 'Публикация',
    settingsLivePreviewLinks: 'Ссылки на стихи в режиме редактирования',
    settingsLivePreviewLinksDesc: 'Подчёркивать ссылки на стихи в режиме Live Preview. Cmd/Ctrl+щелчок открывает стих в JW Library, текст заметки не меняется.',
    versePreviewLoading: 'Загрузка…',
    versePreviewMore: '… и ещё стихов: {count}',
    settingsCitationLink: 'Ссылка на цитируемые стихи',
    settingsCitationLinkDesc: 'Создавать ссылку на JW Library при цитировании стихов.',
    settingsDualMode: 'Двойной режим публикаций',
    settingsDualModeDesc: 'Показывать публикации на английском и русском языках одновременно.',
    // Dual language mode settings
    settingsDualModeSection: 'Двуязычный режим',
    settingsDualModeSectionDesc: 'Настройки отображения цитат на двух языках одновременно',
    settingsDualModeVerses: 'Двуязычный режим для библейских стихов',
    settingsDualModeVersesDesc: 'Включает отображение библейских текстов на двух языках одновременно',
    settingsDualModePublications: 'Двуязычный режим для публикаций',
    settingsDualModePublicationsDesc: 'Включает отображение публикаций на двух языках одновременно',
    settingsDualLangFirst: 'Первый язык',
    settingsDualLangFirstDesc: 'Определяет язык, который будет отображаться первым в двуязычном режиме',
    settingsDualLangSecond: 'Второй язык',
    settingsDualLangSecondDesc: 'Определяет язык, который будет отображаться вторым в двуязычном режиме',
    settingsDualLangSameError: 'Первый и второй языки не могут совпадать',
    dualLangOptions: {
      'Auto': 'Автоматически',
      'ru': 'Русский',
      'en': 'Английский',
      'es': 'Испанский',
      'pt': 'Португальский',
      'fr': 'Французский',
      'de': 'Немецкий'
    },
    settingsReset: 'Сброс',
    settingsResetDesc: 'Это действие нельзя отменить.',
    settingsOpenSidebarOnStartup: 'Открывать боковую панель при запуске',
    settingsOpenSidebarOnStartupDesc: 'Если включено, боковая панель JWL Linker будет открываться автоматически при запуске Obsidian.',
    settingsDebug: 'Режим отладки',
    settingsDebugDesc: 'Если включено, подробности работы плагина записываются в консоль разработчика.',
    settingsResetDefault: 'Сбросить к настройкам по умолчанию',
    settingsResetDefaultDesc: 'Вернуть все настройки к исходным значениям по умолчанию.',
    settingsClearHistory: 'Очистить историю',
    settingsClearHistoryDesc: 'Очистить список элементов в боковой панели истории.',
    // Menu commands
    menuCiteVerses: 'Цитировать стихи',
    menuCiteVersesCallout: 'Цитировать стихи как выноску',
    menuCiteJworgUrl: 'Цитировать ссылку jw.org',
    menuCiteJworgCallout: 'Цитировать ссылку jw.org как выноску',
    menuCitePublication: 'Цитировать поиск публикации',
    menuLookupWOL: 'Найти выделенный текст в WOL',
    menuCiteSelectedText: 'Цитировать выделенный текст',
    menuAddTitle: 'Добавить заголовок к ссылке jw.org',
    menuConvertScripture: 'Преобразовать стихи в JW Library',
    menuConvertJworg: 'Преобразовать ссылку jw.org в JW Library',
    menuOpenJWLibrary: 'Открыть стих в JW Library',
    menuOpenSidebar: 'Открыть боковую панель',
    menuOpenMenu: 'Открыть меню',
    menuBatchConvert: 'Цитировать все ссылки в документе',
    batchProcessing: 'Загрузка цитат...',
    batchComplete: 'Добавлено цитат: {count}',
    batchNoLinks: 'Ссылки не найдены в документе',
    menuParaCount: 'Количество абзацев для цитирования?',
    menuCitationLink: 'Ссылка на цитируемые стихи?',
    quoteHeader: '> [!cite] ЦИТАТА',
    quoteDone: 'Текст оформлен как цитата',
    citationLangOptions: { 'Auto': 'Автоопределение', 'Russian': 'Русский', 'English': 'English', 'Spanish': 'Español', 'Portuguese': 'Português', 'French': 'Français', 'German': 'Deutsch', 'Dutch': 'Nederlands' },
  },
  English: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ This is not a valid scripture reference.',
    invalidUrl: '⚠️ This is not a valid wol.jw.org url.',
    invalidPublication: '⚠️ This is not a valid publication reference.',
    onlineLookupFailed: '⚠️ Online scripture lookup failed. Try again.',
    noEditor: '⚠️ No active editor available.',
    noSelection: '⚠️ Nothing on cursor line or no selection.',
    noHistoryYet: 'No history to display.',
    noTitle: 'Title missing',
    loadingCitation: '⏳ Loading citation:',
    copiedHistoryMsg: 'History item copied to clipboard',
    helpIntro: 'This sidebar shows all the recent verses, paragraphs, and publications you have cited using the plugin.',
    helpCopy: 'Click any item above to copy it to the clipboard.',
    helpClear: 'Click here to clear the search history.',
    hideTip: 'Click to hide',
    help: 'Help',
    emptyPara: '*⟪ Empty paragraph ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    // Settings strings
    settingsDisplay: 'Display',
    settingsDisplayDesc: 'You can use the following substitutions in the templates: {title}, {text}',
    settingsVerseTemplate: 'Template for verse citation',
    settingsVerseTemplateDesc: 'Use this template when citing a span of Bible verses in normal text format',
    settingsVerseCallout: 'Template for verse citation in callout',
    settingsVerseCalloutDesc: 'Use this template when citing a span of Bible verses using the callout format',
    settingsPubTemplate: 'Template for publication citation',
    settingsPubTemplateDesc: 'Use this template when citing from a publication in normal text formatting (jw.org or article lookup)',
    settingsPubCallout: 'Template for publication citation in callout',
    settingsPubCalloutDesc: 'Use this template when citing from a publication using the callout format (jw.org or article lookup)',
    settingsInterfaceLang: 'Interface language',
    settingsInterfaceLangDesc: 'Choose the interface language for the plugin.',
    settingsCitationLang: 'Citation language',
    settingsCitationLangDesc: 'Choose language for citations or use auto-detection.',
    settingsHistorySize: 'No. of history items',
    settingsHistorySizeDesc: 'How many history items to show in the sidebar.',
    settingsBoldNumbers: 'Initial numbers in bold',
    settingsBoldNumbersDesc: 'Apply bold markup to initial numbers in verses or paragraphs in the cited text.',
    settingsVersePreview: 'Verse text on hover',
    settingsVersePreviewDesc: 'Show the verse text in a popup when you hover over a scripture link (desktop only).',
    settingsSuggestions: 'Suggestions while typing',
    settingsSuggestionsDesc: 'Type the trigger at the start of a word, then the start of a book name or publication code (for example @rom or @od), and pick from the list.',
    settingsSuggestTrigger: 'Suggestion trigger',
    settingsSuggestTriggerDesc: 'Characters that open the suggestions. Default: @.',
    suggestBible: 'Bible',
    suggestPublication: 'Publication',
    settingsLivePreviewLinks: 'Scripture links while editing',
    settingsLivePreviewLinksDesc: 'Underline scripture references in Live Preview. Cmd/Ctrl+click opens the verse in JW Library; the note text is not changed.',
    versePreviewLoading: 'Loading…',
    versePreviewMore: '… and {count} more verses',
    settingsCitationLink: 'Link cited scripture',
    settingsCitationLinkDesc: 'Link scripture reference to JW Library when citing verses.',
    settingsDualMode: 'Dual publication mode',
    settingsDualModeDesc: 'Show publications in both English and Russian simultaneously.',
    // Dual language mode settings
    settingsDualModeSection: 'Dual language mode',
    settingsDualModeSectionDesc: 'Settings for displaying citations in two languages simultaneously',
    settingsDualModeVerses: 'Dual mode for Bible verses',
    settingsDualModeVersesDesc: 'Enable displaying Bible texts in two languages simultaneously',
    settingsDualModePublications: 'Dual mode for publications',
    settingsDualModePublicationsDesc: 'Enable displaying publications in two languages simultaneously',
    settingsDualLangFirst: 'First language',
    settingsDualLangFirstDesc: 'Determines the language that will be displayed first in dual mode',
    settingsDualLangSecond: 'Second language',
    settingsDualLangSecondDesc: 'Determines the language that will be displayed second in dual mode',
    settingsDualLangSameError: 'First and second languages cannot be the same',
    dualLangOptions: {
      'Auto': 'Auto-detect',
      'ru': 'Russian',
      'en': 'English',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'fr': 'French',
      'de': 'German'
    },
    settingsReset: 'Reset',
    settingsResetDesc: 'This cannot be undone.',
    settingsResetDefault: 'Reset to default',
    settingsResetDefaultDesc: 'Return all settings to their original defaults.',
    settingsClearHistory: 'Clear history',
    settingsClearHistoryDesc: 'Clear the list of items in the history sidebar.',
    settingsOpenSidebarOnStartup: 'Open sidebar on startup',
    settingsOpenSidebarOnStartupDesc: 'If enabled, the JWL Linker sidebar will open automatically when Obsidian starts.',
    settingsDebug: 'Debug mode',
    settingsDebugDesc: 'If enabled, the plugin writes details of its work to the developer console.',
    // Menu commands
    menuCiteVerses: 'Cite verses',
    menuCiteVersesCallout: 'Cite verses as callout',
    menuCiteJworgUrl: 'Cite jw.org url',
    menuCiteJworgCallout: 'Cite jw.org url as callout',
    menuCitePublication: 'Cite publication lookup',
    menuLookupWOL: 'Lookup selected text on WOL',
    menuCiteSelectedText: 'Cite selected text',
    menuAddTitle: 'Add title to jw.org url',
    menuConvertScripture: 'Convert scriptures to JW Library',
    menuConvertJworg: 'Convert jw.org url to JW Library',
    menuOpenJWLibrary: 'Open scripture at caret in JW Library',
    menuOpenSidebar: 'Open sidebar',
    menuOpenMenu: 'Open menu',
    menuBatchConvert: 'Cite all references in document',
    batchProcessing: 'Loading citations...',
    batchComplete: 'Citations added: {count}',
    batchNoLinks: 'No references found in document',
    menuParaCount: 'No. of paragraphs to cite?',
    menuCitationLink: 'Link cited scripture?',
    quoteHeader: '> [!cite] QUOTE',
    quoteDone: 'Text formatted as citation',
    citationLangOptions: { 'Auto': 'Auto-detection', 'Russian': 'Russian', 'English': 'English', 'Spanish': 'Spanish', 'Portuguese': 'Portuguese', 'French': 'French', 'German': 'German', 'Dutch': 'Dutch' },
  },
  Spanish: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Esta no es una referencia bíblica válida.',
    invalidUrl: '⚠️ Esta no es una URL válida de wol.jw.org.',
    invalidPublication: '⚠️ Esta no es una referencia de publicación válida.',
    onlineLookupFailed: '⚠️ Falló la búsqueda bíblica en línea. Inténtalo de nuevo.',
    noEditor: '⚠️ No hay editor activo disponible.',
    noSelection: '⚠️ Nada en la línea del cursor o sin selección.',
    noHistoryYet: 'No hay historial para mostrar.',
    noTitle: 'Título faltante',
    loadingCitation: '⏳ Cargando cita:',
    copiedHistoryMsg: 'Elemento del historial copiado al portapapeles',
    helpIntro: 'Esta barra lateral muestra todos los versículos, párrafos y publicaciones recientes que has citado usando el plugin.',
    helpCopy: 'Haz clic en cualquier elemento arriba para copiarlo al portapapeles.',
    helpClear: 'Haz clic aquí para limpiar el historial de búsqueda.',
    hideTip: 'Haz clic para ocultar',
    help: 'Ayuda',
    emptyPara: '*⟪ Párrafo vacío ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    // Settings strings
    settingsDisplay: 'Visualización',
    settingsDisplayDesc: 'Puedes usar las siguientes sustituciones en las plantillas: {title}, {text}',
    settingsVerseTemplate: 'Plantilla para cita de versículos',
    settingsVerseTemplateDesc: 'Usa esta plantilla al citar versículos bíblicos en formato de texto normal',
    settingsVerseCallout: 'Plantilla para cita de versículos en destacado',
    settingsVerseCalloutDesc: 'Usa esta plantilla al citar versículos bíblicos usando el formato de destacado',
    settingsPubTemplate: 'Plantilla para cita de publicación',
    settingsPubTemplateDesc: 'Usa esta plantilla al citar publicaciones en formato de texto normal (jw.org o búsqueda de artículo)',
    settingsPubCallout: 'Plantilla para cita de publicación en destacado',
    settingsPubCalloutDesc: 'Usa esta plantilla al citar publicaciones usando el formato de destacado (jw.org o búsqueda de artículo)',
    settingsInterfaceLang: 'Idioma de la interfaz',
    settingsInterfaceLangDesc: 'Elige el idioma de la interfaz para el plugin.',
    settingsCitationLang: 'Idioma de las citas',
    settingsCitationLangDesc: 'Elige el idioma para las citas o usa detección automática.',
    settingsHistorySize: 'Número de elementos del historial',
    settingsHistorySizeDesc: 'Cuántos elementos del historial mostrar en la barra lateral.',
    settingsBoldNumbers: 'Números iniciales en negrita',
    settingsBoldNumbersDesc: 'Aplicar formato en negrita a los números iniciales en versículos o párrafos en el texto citado.',
    settingsVersePreview: 'Texto del versículo al pasar el cursor',
    settingsVersePreviewDesc: 'Muestra el texto del versículo en una ventana emergente al pasar el cursor sobre un enlace bíblico (solo escritorio).',
    settingsSuggestions: 'Sugerencias al escribir',
    settingsSuggestionsDesc: 'Escriba el activador al inicio de una palabra y el comienzo de un libro o código de publicación (por ejemplo @rom u @od) para elegir de la lista.',
    settingsSuggestTrigger: 'Activador de sugerencias',
    settingsSuggestTriggerDesc: 'Caracteres que abren las sugerencias. Predeterminado: @.',
    suggestBible: 'Biblia',
    suggestPublication: 'Publicación',
    settingsLivePreviewLinks: 'Enlaces bíblicos al editar',
    settingsLivePreviewLinksDesc: 'Subraya las referencias bíblicas en Vista previa en vivo. Cmd/Ctrl+clic abre el versículo en JW Library; el texto de la nota no cambia.',
    versePreviewLoading: 'Cargando…',
    versePreviewMore: '… y {count} versículos más',
    settingsCitationLink: 'Enlazar escritura citada',
    settingsCitationLinkDesc: 'Enlazar referencia bíblica a JW Library al citar versículos.',
    settingsDualMode: 'Modo dual de publicaciones',
    settingsDualModeDesc: 'Mostrar publicaciones en múltiples idiomas simultáneamente.',
    // Dual language mode settings
    settingsDualModeSection: 'Modo bilingüe',
    settingsDualModeSectionDesc: 'Configuración para mostrar citas en dos idiomas simultáneamente',
    settingsDualModeVerses: 'Modo bilingüe para versículos bíblicos',
    settingsDualModeVersesDesc: 'Habilita la visualización de textos bíblicos en dos idiomas simultáneamente',
    settingsDualModePublications: 'Modo bilingüe para publicaciones',
    settingsDualModePublicationsDesc: 'Habilita la visualización de publicaciones en dos idiomas simultáneamente',
    settingsDualLangFirst: 'Primer idioma',
    settingsDualLangFirstDesc: 'Determina el idioma que se mostrará primero en el modo bilingüe',
    settingsDualLangSecond: 'Segundo idioma',
    settingsDualLangSecondDesc: 'Determina el idioma que se mostrará segundo en el modo bilingüe',
    settingsDualLangSameError: 'El primer y segundo idioma no pueden ser iguales',
    dualLangOptions: {
      'Auto': 'Automático',
      'ru': 'Ruso',
      'en': 'Inglés',
      'es': 'Español',
      'pt': 'Portugués',
      'fr': 'Francés',
      'de': 'Alemán'
    },
    settingsReset: 'Restablecer',
    settingsResetDesc: 'Esto no se puede deshacer.',
    settingsResetDefault: 'Restablecer a predeterminado',
    settingsResetDefaultDesc: 'Devolver todas las configuraciones a sus valores predeterminados originales.',
    settingsClearHistory: 'Limpiar historial',
    settingsClearHistoryDesc: 'Limpiar la lista de elementos en la barra lateral del historial.',
    settingsOpenSidebarOnStartup: 'Abrir panel lateral al iniciar',
    settingsOpenSidebarOnStartupDesc: 'Si se activa, el panel lateral de JWL Linker se abrirá automáticamente al iniciar Obsidian.',
    settingsDebug: 'Modo de depuración',
    settingsDebugDesc: 'Si se activa, el plugin escribe detalles de su funcionamiento en la consola de desarrollo.',
    // Menu commands
    menuCiteVerses: 'Citar versículos',
    menuCiteVersesCallout: 'Citar versículos como destacado',
    menuCiteJworgUrl: 'Citar URL de jw.org',
    menuCiteJworgCallout: 'Citar URL de jw.org como destacado',
    menuCitePublication: 'Citar búsqueda de publicación',
    menuLookupWOL: 'Buscar texto seleccionado en WOL',
    menuCiteSelectedText: 'Citar texto seleccionado',
    menuAddTitle: 'Agregar título a URL de jw.org',
    menuConvertScripture: 'Convertir escrituras a JW Library',
    menuConvertJworg: 'Convertir URL de jw.org a JW Library',
    menuOpenJWLibrary: 'Abrir escritura en JW Library',
    menuOpenSidebar: 'Abrir barra lateral',
    menuOpenMenu: 'Abrir menú',
    menuBatchConvert: 'Citar todas las referencias del documento',
    batchProcessing: 'Cargando citas...',
    batchComplete: 'Citas añadidas: {count}',
    batchNoLinks: 'No se encontraron referencias en el documento',
    menuParaCount: '¿Número de párrafos a citar?',
    menuCitationLink: '¿Enlazar escritura citada?',
    quoteHeader: '> [!cite] CITA',
    quoteDone: 'Texto formateado como cita',
    citationLangOptions: { 'Auto': 'Detección automática', 'Russian': 'Ruso', 'English': 'Inglés', 'Spanish': 'Español', 'Portuguese': 'Portugués', 'French': 'Francés', 'German': 'Alemán', 'Dutch': 'Holandés' },
  },
  Portuguese: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Esta não é uma referência bíblica válida.',
    invalidUrl: '⚠️ Este não é um link válido do wol.jw.org.',
    invalidPublication: '⚠️ Esta não é uma referência de publicação válida.',
    onlineLookupFailed: '⚠️ Não foi possível obter o texto on-line. Tente novamente.',
    noEditor: '⚠️ Nenhum editor ativo.',
    noSelection: '⚠️ Não há texto na linha do cursor nem seleção.',
    noHistoryYet: 'Nenhum histórico para mostrar.',
    noTitle: 'Sem título',
    loadingCitation: '⏳ Carregando citação:',
    copiedHistoryMsg: 'Item do histórico copiado para a área de transferência',
    helpIntro: 'Esta barra lateral mostra os versículos, parágrafos e publicações que você citou recentemente com o plugin.',
    helpCopy: 'Clique em qualquer item acima para copiá-lo para a área de transferência.',
    helpClear: 'Clique aqui para limpar o histórico.',
    hideTip: 'Clique para ocultar',
    help: 'Ajuda',
    emptyPara: '*⟪ Parágrafo vazio ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    settingsDisplay: 'Exibição',
    settingsDisplayDesc: 'Você pode usar estas substituições nos modelos: {title}, {text}',
    settingsVerseTemplate: 'Modelo para citar versículos',
    settingsVerseTemplateDesc: 'Usado ao citar versículos bíblicos em texto normal',
    settingsVerseCallout: 'Modelo para citar versículos em destaque',
    settingsVerseCalloutDesc: 'Usado ao citar versículos bíblicos em formato de destaque (callout)',
    settingsPubTemplate: 'Modelo para citar publicações',
    settingsPubTemplateDesc: 'Usado ao citar uma publicação em texto normal (jw.org ou pesquisa de artigo)',
    settingsPubCallout: 'Modelo para citar publicações em destaque',
    settingsPubCalloutDesc: 'Usado ao citar uma publicação em formato de destaque (jw.org ou pesquisa de artigo)',
    settingsInterfaceLang: 'Idioma da interface',
    settingsInterfaceLangDesc: 'Escolha o idioma da interface do plugin.',
    settingsCitationLang: 'Idioma das citações',
    settingsCitationLangDesc: 'Escolha o idioma das citações ou use a detecção automática.',
    settingsHistorySize: 'Nº de itens no histórico',
    settingsHistorySizeDesc: 'Quantos itens do histórico mostrar na barra lateral.',
    settingsBoldNumbers: 'Números iniciais em negrito',
    settingsBoldNumbersDesc: 'Coloca em negrito os números no início dos versículos ou parágrafos citados.',
    settingsVersePreview: 'Texto do versículo ao passar o mouse',
    settingsVersePreviewDesc: 'Mostra o texto do versículo numa janela ao passar o mouse sobre um link bíblico (só no computador).',
    settingsSuggestions: 'Sugestões ao digitar',
    settingsSuggestionsDesc: 'Digite o gatilho no início de uma palavra e depois o começo do nome de um livro ou o código de uma publicação (por exemplo @rom ou @od) e escolha na lista.',
    settingsSuggestTrigger: 'Gatilho das sugestões',
    settingsSuggestTriggerDesc: 'Caracteres que abrem as sugestões. Padrão: @.',
    suggestBible: 'Bíblia',
    suggestPublication: 'Publicação',
    settingsLivePreviewLinks: 'Links bíblicos durante a edição',
    settingsLivePreviewLinksDesc: 'Sublinha as referências bíblicas no Live Preview. Cmd/Ctrl+clique abre o versículo no JW Library; o texto da nota não é alterado.',
    versePreviewLoading: 'Carregando…',
    versePreviewMore: '… e mais {count} versículos',
    settingsCitationLink: 'Link no texto citado',
    settingsCitationLinkDesc: 'Coloca na referência bíblica um link para o JW Library ao citar versículos.',
    settingsDualMode: 'Modo duplo de publicações',
    settingsDualModeDesc: 'Mostrar publicações em dois idiomas ao mesmo tempo.',
    settingsDualModeSection: 'Modo bilíngue',
    settingsDualModeSectionDesc: 'Configurações para mostrar citações em dois idiomas ao mesmo tempo',
    settingsDualModeVerses: 'Modo bilíngue para versículos bíblicos',
    settingsDualModeVersesDesc: 'Mostra os textos bíblicos em dois idiomas ao mesmo tempo',
    settingsDualModePublications: 'Modo bilíngue para publicações',
    settingsDualModePublicationsDesc: 'Mostra as publicações em dois idiomas ao mesmo tempo',
    settingsDualLangFirst: 'Primeiro idioma',
    settingsDualLangFirstDesc: 'Idioma mostrado primeiro no modo bilíngue',
    settingsDualLangSecond: 'Segundo idioma',
    settingsDualLangSecondDesc: 'Idioma mostrado em segundo lugar no modo bilíngue',
    settingsDualLangSameError: 'O primeiro e o segundo idioma não podem ser iguais',
    dualLangOptions: { 'Auto': 'Detecção automática', 'ru': 'Russo', 'en': 'Inglês', 'es': 'Espanhol', 'pt': 'Português', 'fr': 'Francês', 'de': 'Alemão' },
    settingsReset: 'Redefinir',
    settingsResetDesc: 'Isso não pode ser desfeito.',
    settingsResetDefault: 'Restaurar padrões',
    settingsResetDefaultDesc: 'Volta todas as configurações aos valores originais.',
    settingsClearHistory: 'Limpar histórico',
    settingsClearHistoryDesc: 'Limpa a lista de itens da barra lateral de histórico.',
    settingsOpenSidebarOnStartup: 'Abrir barra lateral ao iniciar',
    settingsOpenSidebarOnStartupDesc: 'Se ativado, a barra lateral do JWL Linker abre automaticamente quando o Obsidian inicia.',
    settingsDebug: 'Modo de depuração',
    settingsDebugDesc: 'Se ativado, o plugin registra detalhes do seu trabalho no console do desenvolvedor.',
    menuCiteVerses: 'Citar versículos',
    menuCiteVersesCallout: 'Citar versículos em destaque',
    menuCiteJworgUrl: 'Citar link do jw.org',
    menuCiteJworgCallout: 'Citar link do jw.org em destaque',
    menuCitePublication: 'Citar publicação',
    menuLookupWOL: 'Pesquisar texto selecionado no WOL',
    menuCiteSelectedText: 'Citar texto selecionado',
    menuAddTitle: 'Adicionar título ao link do jw.org',
    menuConvertScripture: 'Converter textos bíblicos em links do JW Library',
    menuConvertJworg: 'Converter link do jw.org em link do JW Library',
    menuOpenJWLibrary: 'Abrir no JW Library o texto no cursor',
    menuOpenSidebar: 'Abrir barra lateral',
    menuOpenMenu: 'Abrir menu',
    menuBatchConvert: 'Citar todas as referências do documento',
    batchProcessing: 'Carregando citações...',
    batchComplete: 'Citações adicionadas: {count}',
    batchNoLinks: 'Nenhuma referência encontrada no documento',
    menuParaCount: 'Nº de parágrafos para citar?',
    menuCitationLink: 'Link no texto citado?',
    quoteHeader: '> [!cite] CITAÇÃO',
    quoteDone: 'Texto formatado como citação',
    citationLangOptions: { 'Auto': 'Detecção automática', 'Russian': 'Russo', 'English': 'Inglês', 'Spanish': 'Espanhol', 'Portuguese': 'Português', 'French': 'Francês', 'German': 'Alemão', 'Dutch': 'Holandês' },
  },
  French: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Ce n’est pas une référence biblique valide.',
    invalidUrl: '⚠️ Ce n’est pas un lien wol.jw.org valide.',
    invalidPublication: '⚠️ Ce n’est pas une référence de publication valide.',
    onlineLookupFailed: '⚠️ Impossible de récupérer le texte en ligne. Réessayez.',
    noEditor: '⚠️ Aucun éditeur actif.',
    noSelection: '⚠️ Rien sur la ligne du curseur ou aucune sélection.',
    noHistoryYet: 'Aucun historique à afficher.',
    noTitle: 'Titre manquant',
    loadingCitation: '⏳ Chargement de la citation :',
    copiedHistoryMsg: 'Élément de l’historique copié dans le presse-papiers',
    helpIntro: 'Ce panneau latéral affiche les versets, paragraphes et publications que vous avez cités récemment avec le plugin.',
    helpCopy: 'Cliquez sur un élément ci-dessus pour le copier dans le presse-papiers.',
    helpClear: 'Cliquez ici pour effacer l’historique.',
    hideTip: 'Cliquez pour masquer',
    help: 'Aide',
    emptyPara: '*⟪ Paragraphe vide ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    settingsDisplay: 'Affichage',
    settingsDisplayDesc: 'Vous pouvez utiliser ces substitutions dans les modèles : {title}, {text}',
    settingsVerseTemplate: 'Modèle de citation de versets',
    settingsVerseTemplateDesc: 'Utilisé pour citer des versets bibliques en texte normal',
    settingsVerseCallout: 'Modèle de citation de versets en encadré',
    settingsVerseCalloutDesc: 'Utilisé pour citer des versets bibliques sous forme d’encadré (callout)',
    settingsPubTemplate: 'Modèle de citation de publication',
    settingsPubTemplateDesc: 'Utilisé pour citer une publication en texte normal (jw.org ou recherche d’article)',
    settingsPubCallout: 'Modèle de citation de publication en encadré',
    settingsPubCalloutDesc: 'Utilisé pour citer une publication sous forme d’encadré (jw.org ou recherche d’article)',
    settingsInterfaceLang: 'Langue de l’interface',
    settingsInterfaceLangDesc: 'Choisissez la langue de l’interface du plugin.',
    settingsCitationLang: 'Langue des citations',
    settingsCitationLangDesc: 'Choisissez la langue des citations ou utilisez la détection automatique.',
    settingsHistorySize: 'Nombre d’éléments dans l’historique',
    settingsHistorySizeDesc: 'Nombre d’éléments de l’historique affichés dans le panneau latéral.',
    settingsBoldNumbers: 'Numéros initiaux en gras',
    settingsBoldNumbersDesc: 'Met en gras les numéros au début des versets ou des paragraphes cités.',
    settingsVersePreview: 'Texte du verset au survol',
    settingsVersePreviewDesc: 'Affiche le texte du verset dans une fenêtre au survol d’un lien biblique (ordinateur uniquement).',
    settingsSuggestions: 'Suggestions pendant la saisie',
    settingsSuggestionsDesc: 'Tapez le déclencheur au début d’un mot, puis le début d’un nom de livre ou d’un code de publication (par exemple @rom ou @od), et choisissez dans la liste.',
    settingsSuggestTrigger: 'Déclencheur des suggestions',
    settingsSuggestTriggerDesc: 'Caractères qui ouvrent les suggestions. Par défaut : @.',
    suggestBible: 'Bible',
    suggestPublication: 'Publication',
    settingsLivePreviewLinks: 'Liens bibliques pendant l’édition',
    settingsLivePreviewLinksDesc: 'Souligne les références bibliques en Live Preview. Cmd/Ctrl+clic ouvre le verset dans JW Library ; le texte de la note n’est pas modifié.',
    versePreviewLoading: 'Chargement…',
    versePreviewMore: '… et {count} versets de plus',
    settingsCitationLink: 'Lien sur le texte cité',
    settingsCitationLinkDesc: 'Ajoute un lien vers JW Library à la référence biblique lors de la citation de versets.',
    settingsDualMode: 'Mode double pour les publications',
    settingsDualModeDesc: 'Afficher les publications dans deux langues en même temps.',
    settingsDualModeSection: 'Mode bilingue',
    settingsDualModeSectionDesc: 'Paramètres pour afficher les citations dans deux langues en même temps',
    settingsDualModeVerses: 'Mode bilingue pour les versets bibliques',
    settingsDualModeVersesDesc: 'Affiche les textes bibliques dans deux langues en même temps',
    settingsDualModePublications: 'Mode bilingue pour les publications',
    settingsDualModePublicationsDesc: 'Affiche les publications dans deux langues en même temps',
    settingsDualLangFirst: 'Première langue',
    settingsDualLangFirstDesc: 'Langue affichée en premier en mode bilingue',
    settingsDualLangSecond: 'Deuxième langue',
    settingsDualLangSecondDesc: 'Langue affichée en second en mode bilingue',
    settingsDualLangSameError: 'La première et la deuxième langue ne peuvent pas être identiques',
    dualLangOptions: { 'Auto': 'Détection automatique', 'ru': 'Russe', 'en': 'Anglais', 'es': 'Espagnol', 'pt': 'Portugais', 'fr': 'Français', 'de': 'Allemand' },
    settingsReset: 'Réinitialiser',
    settingsResetDesc: 'Cette action est irréversible.',
    settingsResetDefault: 'Valeurs par défaut',
    settingsResetDefaultDesc: 'Rétablit tous les paramètres à leurs valeurs d’origine.',
    settingsClearHistory: 'Effacer l’historique',
    settingsClearHistoryDesc: 'Efface la liste des éléments du panneau d’historique.',
    settingsOpenSidebarOnStartup: 'Ouvrir le panneau au démarrage',
    settingsOpenSidebarOnStartupDesc: 'Si activé, le panneau JWL Linker s’ouvre automatiquement au démarrage d’Obsidian.',
    settingsDebug: 'Mode débogage',
    settingsDebugDesc: 'Si activé, le plugin écrit des détails de son fonctionnement dans la console de développement.',
    menuCiteVerses: 'Citer les versets',
    menuCiteVersesCallout: 'Citer les versets en encadré',
    menuCiteJworgUrl: 'Citer le lien jw.org',
    menuCiteJworgCallout: 'Citer le lien jw.org en encadré',
    menuCitePublication: 'Citer une publication',
    menuLookupWOL: 'Rechercher la sélection sur WOL',
    menuCiteSelectedText: 'Citer le texte sélectionné',
    menuAddTitle: 'Ajouter un titre au lien jw.org',
    menuConvertScripture: 'Convertir les versets en liens JW Library',
    menuConvertJworg: 'Convertir le lien jw.org en lien JW Library',
    menuOpenJWLibrary: 'Ouvrir le verset du curseur dans JW Library',
    menuOpenSidebar: 'Ouvrir le panneau latéral',
    menuOpenMenu: 'Ouvrir le menu',
    menuBatchConvert: 'Citer toutes les références du document',
    batchProcessing: 'Chargement des citations...',
    batchComplete: 'Citations ajoutées : {count}',
    batchNoLinks: 'Aucune référence trouvée dans le document',
    menuParaCount: 'Nombre de paragraphes à citer ?',
    menuCitationLink: 'Lien sur le texte cité ?',
    quoteHeader: '> [!cite] CITATION',
    quoteDone: 'Texte mis en forme comme citation',
    citationLangOptions: { 'Auto': 'Détection automatique', 'Russian': 'Russe', 'English': 'Anglais', 'Spanish': 'Espagnol', 'Portuguese': 'Portugais', 'French': 'Français', 'German': 'Allemand', 'Dutch': 'Néerlandais' },
  },
  German: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Das ist keine gültige Bibelstellenangabe.',
    invalidUrl: '⚠️ Das ist kein gültiger wol.jw.org-Link.',
    invalidPublication: '⚠️ Das ist keine gültige Publikationsangabe.',
    onlineLookupFailed: '⚠️ Der Text konnte nicht online abgerufen werden. Bitte erneut versuchen.',
    noEditor: '⚠️ Kein aktiver Editor.',
    noSelection: '⚠️ Kein Text in der Zeile des Cursors und keine Auswahl.',
    noHistoryYet: 'Noch kein Verlauf vorhanden.',
    noTitle: 'Titel fehlt',
    loadingCitation: '⏳ Zitat wird geladen:',
    copiedHistoryMsg: 'Verlaufseintrag in die Zwischenablage kopiert',
    helpIntro: 'In dieser Seitenleiste stehen die Verse, Absätze und Publikationen, die du zuletzt mit dem Plugin zitiert hast.',
    helpCopy: 'Klicke oben auf einen Eintrag, um ihn in die Zwischenablage zu kopieren.',
    helpClear: 'Hier klicken, um den Verlauf zu löschen.',
    hideTip: 'Zum Ausblenden klicken',
    help: 'Hilfe',
    emptyPara: '*⟪ Leerer Absatz ⟫*',
    paragraphOptions: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
    historySize: { 0: '0', 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 75: 75, 100: 100 },
    settingsDisplay: 'Darstellung',
    settingsDisplayDesc: 'In den Vorlagen kannst du diese Platzhalter verwenden: {title}, {text}',
    settingsVerseTemplate: 'Vorlage für Bibelzitate',
    settingsVerseTemplateDesc: 'Wird verwendet, wenn Bibelverse als normaler Text zitiert werden',
    settingsVerseCallout: 'Vorlage für Bibelzitate als Callout',
    settingsVerseCalloutDesc: 'Wird verwendet, wenn Bibelverse als Callout zitiert werden',
    settingsPubTemplate: 'Vorlage für Publikationszitate',
    settingsPubTemplateDesc: 'Wird verwendet, wenn eine Publikation als normaler Text zitiert wird (jw.org oder Artikelsuche)',
    settingsPubCallout: 'Vorlage für Publikationszitate als Callout',
    settingsPubCalloutDesc: 'Wird verwendet, wenn eine Publikation als Callout zitiert wird (jw.org oder Artikelsuche)',
    settingsInterfaceLang: 'Sprache der Oberfläche',
    settingsInterfaceLangDesc: 'Wähle die Sprache der Plugin-Oberfläche.',
    settingsCitationLang: 'Sprache der Zitate',
    settingsCitationLangDesc: 'Wähle die Sprache der Zitate oder nutze die automatische Erkennung.',
    settingsHistorySize: 'Anzahl der Verlaufseinträge',
    settingsHistorySizeDesc: 'Wie viele Verlaufseinträge in der Seitenleiste angezeigt werden.',
    settingsBoldNumbers: 'Anfangsnummern fett',
    settingsBoldNumbersDesc: 'Die Nummern am Anfang zitierter Verse oder Absätze werden fett dargestellt.',
    settingsVersePreview: 'Verstext beim Darüberfahren',
    settingsVersePreviewDesc: 'Zeigt den Verstext in einem Fenster, wenn man mit der Maus über einen Bibellink fährt (nur am Computer).',
    settingsSuggestions: 'Vorschläge beim Tippen',
    settingsSuggestionsDesc: 'Gib das Auslösezeichen am Wortanfang ein, dann den Anfang eines Buchnamens oder Publikationskürzels (zum Beispiel @röm oder @od), und wähle aus der Liste.',
    settingsSuggestTrigger: 'Auslöser für Vorschläge',
    settingsSuggestTriggerDesc: 'Zeichen, die die Vorschläge öffnen. Standard: @.',
    suggestBible: 'Bibel',
    suggestPublication: 'Publikation',
    settingsLivePreviewLinks: 'Bibellinks beim Bearbeiten',
    settingsLivePreviewLinksDesc: 'Unterstreicht Bibelstellen im Live Preview. Cmd/Strg+Klick öffnet den Vers in JW Library; der Text der Notiz wird nicht geändert.',
    versePreviewLoading: 'Wird geladen…',
    versePreviewMore: '… und {count} weitere Verse',
    settingsCitationLink: 'Zitierte Bibelstelle verlinken',
    settingsCitationLinkDesc: 'Verlinkt die Bibelstelle beim Zitieren von Versen mit JW Library.',
    settingsDualMode: 'Zweisprachige Publikationen',
    settingsDualModeDesc: 'Publikationen gleichzeitig in zwei Sprachen anzeigen.',
    settingsDualModeSection: 'Zweisprachiger Modus',
    settingsDualModeSectionDesc: 'Einstellungen für Zitate in zwei Sprachen gleichzeitig',
    settingsDualModeVerses: 'Zweisprachiger Modus für Bibelverse',
    settingsDualModeVersesDesc: 'Bibeltexte gleichzeitig in zwei Sprachen anzeigen',
    settingsDualModePublications: 'Zweisprachiger Modus für Publikationen',
    settingsDualModePublicationsDesc: 'Publikationen gleichzeitig in zwei Sprachen anzeigen',
    settingsDualLangFirst: 'Erste Sprache',
    settingsDualLangFirstDesc: 'Sprache, die im zweisprachigen Modus zuerst angezeigt wird',
    settingsDualLangSecond: 'Zweite Sprache',
    settingsDualLangSecondDesc: 'Sprache, die im zweisprachigen Modus als zweite angezeigt wird',
    settingsDualLangSameError: 'Erste und zweite Sprache dürfen nicht gleich sein',
    dualLangOptions: { 'Auto': 'Automatisch erkennen', 'ru': 'Russisch', 'en': 'Englisch', 'es': 'Spanisch', 'pt': 'Portugiesisch', 'fr': 'Französisch', 'de': 'Deutsch' },
    settingsReset: 'Zurücksetzen',
    settingsResetDesc: 'Dies kann nicht rückgängig gemacht werden.',
    settingsResetDefault: 'Standardwerte wiederherstellen',
    settingsResetDefaultDesc: 'Setzt alle Einstellungen auf ihre ursprünglichen Werte zurück.',
    settingsClearHistory: 'Verlauf löschen',
    settingsClearHistoryDesc: 'Leert die Liste in der Verlaufs-Seitenleiste.',
    settingsOpenSidebarOnStartup: 'Seitenleiste beim Start öffnen',
    settingsOpenSidebarOnStartupDesc: 'Wenn aktiviert, öffnet sich die JWL-Linker-Seitenleiste automatisch beim Start von Obsidian.',
    settingsDebug: 'Debug-Modus',
    settingsDebugDesc: 'Wenn aktiviert, schreibt das Plugin Details zu seiner Arbeit in die Entwicklerkonsole.',
    menuCiteVerses: 'Verse zitieren',
    menuCiteVersesCallout: 'Verse als Callout zitieren',
    menuCiteJworgUrl: 'jw.org-Link zitieren',
    menuCiteJworgCallout: 'jw.org-Link als Callout zitieren',
    menuCitePublication: 'Publikation zitieren',
    menuLookupWOL: 'Markierten Text in WOL suchen',
    menuCiteSelectedText: 'Markierten Text zitieren',
    menuAddTitle: 'Titel zum jw.org-Link hinzufügen',
    menuConvertScripture: 'Bibelstellen in JW-Library-Links umwandeln',
    menuConvertJworg: 'jw.org-Link in JW-Library-Link umwandeln',
    menuOpenJWLibrary: 'Bibelstelle am Cursor in JW Library öffnen',
    menuOpenSidebar: 'Seitenleiste öffnen',
    menuOpenMenu: 'Menü öffnen',
    menuBatchConvert: 'Alle Angaben im Dokument zitieren',
    batchProcessing: 'Zitate werden geladen...',
    batchComplete: 'Hinzugefügte Zitate: {count}',
    batchNoLinks: 'Keine Angaben im Dokument gefunden',
    menuParaCount: 'Wie viele Absätze zitieren?',
    menuCitationLink: 'Zitierte Bibelstelle verlinken?',
    quoteHeader: '> [!cite] ZITAT',
    quoteDone: 'Text als Zitat formatiert',
    citationLangOptions: { 'Auto': 'Automatisch erkennen', 'Russian': 'Russisch', 'English': 'Englisch', 'Spanish': 'Spanisch', 'Portuguese': 'Portugiesisch', 'French': 'Französisch', 'German': 'Deutsch', 'Dutch': 'Niederländisch' },
  },
};

// Dynamic Lang object based on interface language setting
let Lang = InterfaceStrings.Russian;

// Verbose logging only when the "debug" setting is on (set in JWLLinkerPlugin.loadSettings)
let debugEnabled = false;
function debugLog(...args) {
  if (debugEnabled) console.log(...args);
}

// Publications not available online, by citation language
const OfflinePublications = {
  RU: {
    'ep': 'Евангелизаторы',
    'po': 'Пособие для проповедников',
    'sg': 'Руководство для школы служения',
    'yb': 'Ежегодник Свидетелей Иеговы'
  },
  EN: {
    'ep': 'Evangelizers',
    'po': 'Preaching Handbook',
    'sg': 'School Guidebook',
    'yb': 'Yearbook of Jehovah\'s Witnesses'
  },
  ES: {
    'ep': 'Evangelizadores',
    'po': 'Manual para predicadores',
    'sg': 'Guía para la escuela de servicio',
    'yb': 'Anuario de los testigos de Jehová'
  },
  PT: {
    'ep': 'Evangelizadores',
    'po': 'Manual para pregadores',
    'sg': 'Guia para a escola do ministério',
    'yb': 'Anuário das Testemunhas de Jeová'
  },
  FR: {
    'ep': 'Évangélisateurs',
    'po': 'Manuel du prédicateur',
    'sg': 'Guide pour l’école du ministère',
    'yb': 'Annuaire des Témoins de Jéhovah'
  },
  DE: {
    'ep': 'Evangeliumsverkündiger',
    'po': 'Handbuch für Prediger',
    'sg': 'Leitfaden für die Predigtdienstschule',
    'yb': 'Jahrbuch der Zeugen Jehovas'
  },
};

/** Messages for publications that cannot be cited online, by citation language */
const OfflineMessages = {
  RU: {
    watchtowerYear: (year, minYear) => `📅 Сторожевая башня ${year} года недоступна онлайн. Доступны выпуски с ${minYear} года`,
    printOnly: (title) => `📖 "${title}" доступна только в печатном варианте`,
  },
  EN: {
    watchtowerYear: (year, minYear) => `📅 The Watchtower ${year} is not available online. Available from ${minYear} onwards`,
    printOnly: (title) => `📖 "${title}" is available only in print format`,
  },
  ES: {
    watchtowerYear: (year, minYear) => `📅 La Atalaya ${year} no está disponible en línea. Disponible desde ${minYear} en adelante`,
    printOnly: (title) => `📖 "${title}" está disponible solo en formato impreso`,
  },
  PT: {
    watchtowerYear: (year, minYear) => `📅 A Sentinela de ${year} não está disponível online. Disponível a partir de ${minYear}`,
    printOnly: (title) => `📖 "${title}" está disponível apenas na versão impressa`,
  },
  FR: {
    watchtowerYear: (year, minYear) => `📅 La Tour de Garde ${year} n’est pas disponible en ligne. Disponible à partir de ${minYear}`,
    printOnly: (title) => `📖 « ${title} » est disponible uniquement en version imprimée`,
  },
  DE: {
    watchtowerYear: (year, minYear) => `📅 Der Wachtturm ${year} ist nicht online verfügbar. Verfügbar ab ${minYear}`,
    printOnly: (title) => `📖 „${title}“ ist nur gedruckt erhältlich`,
  },
};

/**
 * Check if publication is available online
 * @param {string} pubCode - Publication code (e.g., 'ep', 'be')
 * @param {string} lang - Language code ('RU', 'EN', 'ES', 'PT', 'FR', 'DE')
 * @param {number} year - Publication year (optional, for Watchtower filtering)
 * @returns {Object} - {isOffline: boolean, message: string}
 */
function checkPublicationAvailability(pubCode, lang = 'EN', year = null) {
  const key = OfflineMessages[lang] ? lang : 'EN';
  const offlineList = OfflinePublications[key];
  const messages = OfflineMessages[key];

  // Check Watchtower year availability
  if (pubCode === 'w' && year !== null) {
    const minYear = (lang === 'RU') ? 1986 : 1950;
    if (year < minYear) {
      return { isOffline: true, message: messages.watchtowerYear(year, minYear) };
    }
  }

  if (offlineList[pubCode]) {
    return { isOffline: true, message: messages.printOnly(offlineList[pubCode]) };
  }

  return {
    isOffline: false,
    message: ''
  };
}

const Languages = {
  Auto: 'AUTO',
  English: 'EN',
  German: 'DE',
  Dutch: 'NL',
  French: 'FR',
  Portuguese: 'PT',
  Russian: 'RU',
  Spanish: 'ES',
};

/**
 * Fully supported citation languages: JW language code (wtlocale), WOL library
 * (wol.jw.org/<site>/wol/…/<rsconf>/<lib>) and the word that replaces BIBLE in callout headers
 */
const LanguageInfo = {
  EN: { wtlocale: 'E', site: 'en', rsconf: 'r1', lib: 'lp-e', bibleLabel: 'BIBLE' },
  RU: { wtlocale: 'U', site: 'ru', rsconf: 'r2', lib: 'lp-u', bibleLabel: 'БИБЛИЯ' },
  ES: { wtlocale: 'S', site: 'es', rsconf: 'r4', lib: 'lp-s', bibleLabel: 'BIBLIA' },
  PT: { wtlocale: 'T', site: 'pt', rsconf: 'r5', lib: 'lp-t', bibleLabel: 'BÍBLIA' }, // Portuguese (Brazil)
  FR: { wtlocale: 'F', site: 'fr', rsconf: 'r30', lib: 'lp-f', bibleLabel: 'BIBLE' },
  DE: { wtlocale: 'X', site: 'de', rsconf: 'r10', lib: 'lp-x', bibleLabel: 'BIBEL' },
};

/** JW language codes for links (Dutch links work, but Dutch has no book names yet) */
const WtLocales = { EN: 'E', RU: 'U', ES: 'S', PT: 'T', FR: 'F', DE: 'X', NL: 'O' };
/** wtlocale → language key */
const LangByWtlocale = { E: 'EN', U: 'RU', S: 'ES', T: 'PT', F: 'FR', X: 'DE', O: 'NL' };

/** Callout header words for "BIBLE" in every language, so a template written in one language is translated */
const BibleLabelRegex = /BÍBLIA|BIBLIA|BIBLE|BIBEL|БИБЛИЯ/g;

/**
 * Replace the word BIBLE (in any supported language) in a callout template
 * @param {string} template
 * @param {string} lang - EN | RU | ES | PT | FR | DE
 * @returns {string}
 */
function translateBibleLabel(template, lang) {
  const label = (LanguageInfo[lang] ?? LanguageInfo.EN).bibleLabel;
  return template.replace(BibleLabelRegex, label);
}

// Function to get appropriate URLs based on language
function getConfigForLanguage(lang = 'EN') {
  const info = LanguageInfo[lang] ?? LanguageInfo.EN;
  const wol = `https://wol.jw.org/${info.site}/wol`;
  const library = `${info.rsconf}/${info.lib}`;
  return {
    jwlLocale: `&wtlocale=${info.wtlocale}`,
    wolRoot: `${wol}/d/`,
    wolPublications: `${wol}/d/${library}/`,
    wolLookup: `${wol}/l/${library}?q=`,
    webFinder: `https://www.jw.org/finder?wtlocale=${info.wtlocale}&`,
  };
}

const Config = {
  jwlFinder: 'jwlibrary:///finder?',
  // Default to English (for publications)
  jwlLocale: '&wtlocale=E',
  wolRoot: 'https://wol.jw.org/en/wol/d/',
  wolPublications: 'https://wol.jw.org/en/wol/d/r1/lp-e/',
  wolLookup: 'https://wol.jw.org/en/wol/l/r1/lp-e?q=',
  webFinder: 'https://www.jw.org/finder?wtlocale=E&',
  urlParam: 'bible=',
  // [1] whole scripture match [2] plain text [3] book name [4] chapter/verse passages [5] already link
  // Updated to support Russian book names and Cyrillic characters
  // German numbered books are written "1. Mose"; multi-word names are listed in full
  scriptureRegex:
    /(('?)((?:[123]\.[\u0020\u00A0](?:mose|samuel|könige|chronika|korinther|thessalonicher|timotheus|petrus|johannes))|(?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.\u0410-\u044F\u0401\u0451]{2,}|song of solomon|песня саломона|hohes lied|chant de salomon|cântico de salomão))((?: ?(?:\d{1,3})[:\u003A\u0437](?:\d{1,3})(?:[-,\u2013\u2014] ?\d{1,3})*;?)+))(\]|<\/a>)?/gimu,
  // Books with one chapter (Obadiah, Philemon, 2 and 3 John, Jude): the number is the verse
  scriptureNoChpRegex: /(('?)(obadiah|obadias|obadja|abdias|obd|abd|ob|philemon|philémon|filêmon|philem|philém|filêm|phm|flm|(?:2|3)\.?(?: )?(?:jo(?:hn|ão|ao|hannes|h)?|jean)|jude|judas|jud)(?: ?)(\d{1,2}))(\]|<\/a>)?/gim,
  scriptureNoVerseRegex: /(('?)((?:[123]\.[\u0020\u00A0](?:mose|samuel|könige|chronika|korinther|thessalonicher|timotheus|petrus|johannes))|(?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.]{2,}|song of solomon|hohes lied|chant de salomon|cântico de salomão))((?: ?(?:\d{1,3})(?![\d:]);?)+))(\]|<\/a>)?/gimu,
  wolLinkRegex: /(\[([^\[\]]*)\]\()?(https\:\/\/wol\.jw\.org[^\s\)]{2,})(\))?/gim,
  jworgLinkRegex: /(\[([^\[\]]*)\]\()?(https[^\s\)]+jw\.org[^\s\)]{2,})(\))?/gim,
  // Russian publication with month names regex (w25 Март с. 8 абз. 2, ws12 Февраль с. 15 абз. 2)
  russianPubMonthRegex: /w(s)?(\d{2})\s+(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+с\.\s*(\d+)\s+абз\.\s*(\d+)/gi,
  // Russian publication with day and month names regex (w10 15 Января с. 3 абз. 1, ws10 15 Января с. 3 абз. 1)
  russianPubDayMonthRegex: /w(s)?(\d{2})\s+(1|15)\s+(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+с\.\s*(\d+)\s+абз\.\s*(\d+)/gi,
  // English publication with month names regex (w25 March p. 8 par. 2, ws12 February p. 15 par. 2)
  englishPubMonthRegex: /w(s)?(\d{2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+p\.\s*(\d+)\s+par\.\s*(\d+)/gi,
  // English publication with day and month names regex (w10 15 January p. 3 par. 1, ws10 15 January p. 3 par. 1)
  // Supports day month format and month day format
  englishPubDayMonthRegex: /w(s)?(\d{2})\s+(?:(\d{1,2})\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+p\.\s*(\d+)\s+par\.\s*(\d+)/gi,
  // Spanish publication with month names regex (w25 Marzo pág. 8 párr. 2, ws12 Febrero pág. 15 párr. 2)
  spanishPubMonthRegex: /w(s)?(\d{2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+pág\.\s*(\d+)\s+párr\.\s*(\d+)/gi,
  // Spanish publication with day and month names regex (w10 15 Enero pág. 3 párr. 1, ws10 15 Enero pág. 3 párr. 1)
  spanishPubDayMonthRegex: /w(s)?(\d{2})\s+(1|15)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+pág\.\s*(\d+)\s+párr\.\s*(\d+)/gi,
  // Other JW publications regex (od, it-1, it-2, si, etc.)
  // Formats: od 15 par. 3, od 15 абз. 3, od 15 párr. 3, it-1 332, cl chap. 8 p. 77 par. 2, od глава 15 абз. 3, od cap. 15 párr. 3, si pp. 300-301 par. 11, si págs. 300-301 párr. 11
  // French: chap. … § 3, German: Kap. … S. 150 Abs. 3, Portuguese: cap. … p. 150 par. 3
  otherPubRegex: /\b([a-z]{1,3}(?:-\d)?)\s+(?:(?:chap\.|глава|cap\.|Kap\.)\s*)?(\d+(?:\/\d+)?)(?![\d:\/])\s*(?:(?:pp?\.|сс?\.|págs?\.|S\.)\s*(\d+(?:-\d+)?)\s+)?(?:(?:pars?\.|абз\.|párrs?\.|§|Abs\.)\s*(\d+(?:\s*[-–—]\s*\d+|(?:\s*,\s*\d+)+)?))?/g,
  initialNumRegex: /^([\n\s]?)(\d{1,3}) /gim,
  delay: 3000,
};

// Publication codes recognised without an explicit chapter/page/paragraph marker.
// Batch mode only accepts "<code> <number>" matches for these codes, otherwise
// ordinary text like "on 5" or "in 2024" would be treated as a publication.
const KnownPubCodes = new Set([
  'bh', 'be', 'bt', 'cf', 'cl', 'dp', 'ed', 'ep', 'fg', 'fy', 'g', 'hf', 'ia', 'ip-1', 'ip-2',
  'it-1', 'it-2', 'jl', 'jr', 'jv', 'jy', 'kr', 'km', 'lfb', 'lff', 'lr', 'lv', 'lvs', 'mwb',
  'od', 'po', 'rr', 'rs', 'scl', 'sg', 'si', 'sjj', 'th', 'w', 'wp', 'ws', 'yb',
]);

/**
 * Does an "other publication" regex match look like a real publication reference?
 * Accepts known codes, or any code followed by a chapter/page/paragraph marker.
 * @param {RegExpMatchArray} match - match of Config.otherPubRegex
 * @returns {boolean}
 */
function isLikelyPublication(match) {
  const [full, pubCode] = match;
  if (KnownPubCodes.has(pubCode.toLowerCase())) return true;
  return /(?:chap\.|глава|cap\.|kap\.|pp?\.|сс?\.|págs?\.|(?:^|\s)S\.|pars?\.|абз\.|párrs?\.|§|abs\.)/i.test(full);
}

/**
 * Find the first plausible "other publication" reference (od 15 par. 3, it-1 332, ...)
 * Ignores incidental matches such as "on 5" or "in 2024".
 * @param {string} input
 * @returns {RegExpMatchArray|null}
 */
function matchOtherPublication(input) {
  const regex = new RegExp(Config.otherPubRegex.source, 'g');
  for (const match of input.matchAll(regex)) {
    if (isLikelyPublication(match)) return match;
  }
  return null;
}

/**
 * URL validity check (URL.canParse is not available on older mobile webviews)
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// All the available commands provided by the plugin
const Cmd = {
  citeVerse: 'citeVerse',
  citeVerseCallout: 'citeVerseCallout',
  citeParagraph: 'citeParagraph',
  citeParagraphCallout: 'citeParagraphCallout',
  openSelectedinWOL: 'openSelectedInWOL',
  citePublicationLookup: 'citePublicationLookup',
  citeSelectedText: 'citeSelectedText',
  addLinkTitle: 'addLinkTitle',
  convertScriptureToJWLibrary: 'convertScriptureToJWLibrary',
  convertWebToJWLibrary: 'convertWebToJWLibrary',
  openScriptureInJWLibrary: 'openScriptureInJWLibrary',
  batchConvertAll: 'batchConvertAll',
};

const JWL_LINKER_VIEW = 'jwl-linker-view';

/**
 * Auto-detect language based on text content
 * @param {string} text - Text to analyze
 * @returns {string} - Language key (RU, EN, etc.)
 */
function detectLanguage(text) {
  debugLog('detectLanguage called with:', text);
  if (!text) return 'EN';
  // Cyrillic characters: Russian
  if (/[\u0400-\u04FF]/.test(text)) return 'RU';
  LanguagePatterns ??= buildLanguagePatterns();
  for (const [lang, pattern] of LanguagePatterns) {
    if (pattern.test(text)) {
      debugLog('detectLanguage returning:', lang);
      return lang;
    }
  }
  return 'EN';
}

/**
 * Words and publication markers that only one language uses, checked in this order
 * (Portuguese before Spanish: they share many book names, so only Portuguese-only words are listed).
 * Letters around a word are excluded with lookarounds, because \b does not work for "João".
 * Built on first use: compiling these Unicode regexes at startup costs ~0.6 ms.
 */
let LanguagePatterns = null;
const buildLanguagePatterns = () => [
  ['PT', /(?<!\p{L})(?:João|Atos|Apocalipse|Gênesis|Êxodo|Deuteronômio|Juízes|Crônicas|Neemias|Provérbios|Lamentações|Oseias|Miqueias|Malaquias|Mateus|Coríntios|Efésios|Colossenses|Tessalonicenses|Timóteo|Filêmon|Hebreus|Tiago|Sentinela|Despertai)(?!\p{L})|cap\.\s*\d+\s+par\./iu],
  ['ES', /párr\.|págs?\.|cap\.|(?<!\p{L})(?:Apocalipsis|Romanos|Corintios|Gálatas|Efesios|Filipenses|Colosenses|Tesalonicenses|Timoteo|Hebreos|Pedro|Reyes|Crónicas)(?!\p{L})/iu],
  ['FR', /§|(?<!\p{L})(?:Révélation|Apocalypse|Genèse|Lévitique|Deutéronome|Néhémie|Psaumes|Proverbes|Ecclésiaste|Isaïe|Jérémie|Ézéchiel|Matthieu|Actes|Romains|Corinthiens|Galates|Éphésiens|Philippiens|Colossiens|Thessaloniciens|Timothée|Hébreux|Jacques|Pierre|Jean|Rois|Chroniques|Tour de Garde|Réveillez-vous)(?!\p{L})/iu],
  ['DE', /Abs\.|Kap\.|(?<!\p{L})S\.\s*\d|(?<!\p{L})(?:Mose|Könige|Chronika|Offenbarung|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Hebräer|Petrus|Johannes|Matthäus|Apostelgeschichte|Psalmen|Sprüche|Wachtturm|Erwachet)(?!\p{L})/iu],
  ['NL', /(?<!\p{L})(?:Openbaring|Romeinen|Korintiërs|Galaten|Efeziërs|Filippenzen|Kolossenzen|Tessalonicenzen|Timotheüs|Hebreeën|Koningen|Kronieken)(?!\p{L})/iu],
];

/**
 * Get appropriate finder URL based on language
 * @param {string} lang - Language code (EN, RU, etc.)
 * @returns {string} - Finder URL
 */
function getFinderUrl(lang) {
  return `https://www.jw.org/finder?wtlocale=${WtLocales[lang] ?? 'E'}&`;
}

/**
 * Get appropriate JW Library locale based on language
 * @param {string} lang - Language code (EN, RU, etc.)
 * @returns {string} - Locale string
 */
function getJWLibraryLocale(lang) {
  return `&wtlocale=${WtLocales[lang] ?? 'E'}`;
}

/**
 * Russian month names mapping
 */
const RussianMonths = {
  'январь': '01', 'января': '01',
  'февраль': '02', 'февраля': '02',
  'март': '03', 'марта': '03',
  'апрель': '04', 'апреля': '04',
  'май': '05', 'мая': '05',
  'июнь': '06', 'июня': '06',
  'июль': '07', 'июля': '07',
  'август': '08', 'августа': '08',
  'сентябрь': '09', 'сентября': '09',
  'октябрь': '10', 'октября': '10',
  'ноябрь': '11', 'ноября': '11',
  'декабрь': '12', 'декабря': '12'
};

/**
 * English month names mapping
 */
const EnglishMonths = {
  'january': '01',
  'february': '02',
  'march': '03',
  'april': '04',
  'may': '05',
  'june': '06',
  'july': '07',
  'august': '08',
  'september': '09',
  'october': '10',
  'november': '11',
  'december': '12'
};

/**
 * Spanish month names mapping
 */
const SpanishMonths = {
  'enero': '01',
  'febrero': '02',
  'marzo': '03',
  'abril': '04',
  'mayo': '05',
  'junio': '06',
  'julio': '07',
  'agosto': '08',
  'septiembre': '09', 'setiembre': '09',
  'octubre': '10',
  'noviembre': '11',
  'diciembre': '12'
};

/**
 * Auto-format Russian Watchtower publications with month names
 * @param {string} input - Input text to check and format
 * @returns {string} - Formatted text or original if no match
 */
function autoFormatRussianWatchtower(input) {
  // First check for day + month format (w10 15 Января с. 3 абз. 1, ws10 15 Января с. 3 абз. 1)
  const dayMonthRegex = Config.russianPubDayMonthRegex;
  dayMonthRegex.lastIndex = 0;
  const dayMonthMatch = dayMonthRegex.exec(input);

  if (dayMonthMatch) {
    const [fullMatch, isStudy, year, day, monthName, page, paragraph] = dayMonthMatch;
    const monthNumber = RussianMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      if (toFullYear(year) < 2016) {
        // Pre-2016: Russian day/month format (w10 15/1 с. 3 абз. 1)
        const formatted = `${pubCode}${year} ${Number(day)}/${Number(monthNumber)} с. ${page} абз. ${paragraph}`;
        debugLog('Auto-formatted Russian Watchtower (pre-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      }
      // Post-2016: monthly issues use the .month format (w16.01 3, абз. 1)
      const formatted = `${pubCode}${year}.${monthNumber} ${page}, абз. ${paragraph}`;
      debugLog('Auto-formatted Russian Watchtower (post-2016):', input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  // Then check for month-only format (w25 Март с. 8 абз. 2, ws25 Март с. 8 абз. 2)
  const monthRegex = Config.russianPubMonthRegex;
  monthRegex.lastIndex = 0;
  const monthMatch = monthRegex.exec(input);

  if (monthMatch) {
    const [fullMatch, isStudy, year, monthName, page, paragraph] = monthMatch;
    const monthNumber = RussianMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      const formatted = `${pubCode}${year}.${monthNumber} ${page}, абз. ${paragraph}`;
      debugLog('Auto-formatted Russian Watchtower (month-only):', input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  return input;
}

/**
 * Convert a 2-digit Watchtower year to a full year (90 → 1990, 25 → 2025)
 * @param {string|number} year
 * @returns {number}
 */
function toFullYear(year) {
  const y = parseInt(year, 10);
  return y < 50 ? 2000 + y : 1900 + y;
}

/**
 * Pre-2016 month-only references have no day; guess the issue day
 * (kept from the original heuristic: 1st for some months, 15th for the others)
 * @param {string} monthNumber - '01'..'12'
 * @returns {string}
 */
function guessIssueDay(monthNumber) {
  return ['01', '03', '05', '07', '08', '10', '12'].includes(monthNumber) ? '1' : '15';
}

/**
 * Shared Watchtower auto-formatter for the English and Spanish month-name formats
 * Pre-2016 (semi-monthly issues): w10 1/15 p. 3 par. 1 (English, month/day) | w10 15/1 pág. 3 párr. 1 (Spanish, day/month)
 * 2016+ (monthly issues): w25.03 p. 8 par. 2 — parsed by WatchtowerRegex
 * @param {string} input
 * @param {{dayMonthRegex: RegExp, monthRegex: RegExp, months: Object, pageTerm: string, parTerm: string, dayFirst?: boolean, label: string}} opts
 * @returns {string}
 */
function autoFormatLatinWatchtower(input, opts) {
  const format = (isStudy, year, monthNumber, day, page, paragraph) => {
    const pubCode = isStudy ? 'ws' : 'w';
    if (toFullYear(year) >= 2016) {
      return `${pubCode}${year}.${monthNumber} ${opts.pageTerm} ${page} ${opts.parTerm} ${paragraph}`;
    }
    const issueDay = day ? Number(day) : guessIssueDay(monthNumber);
    if (opts.issue) {
      return `${pubCode}${year} ${opts.issue(issueDay, Number(monthNumber))} ${opts.pageTerm} ${page} ${opts.parTerm} ${paragraph}`;
    }
    if (opts.dayFirst) {
      return `${pubCode}${year} ${issueDay}/${Number(monthNumber)} ${opts.pageTerm} ${page} ${opts.parTerm} ${paragraph}`;
    }
    return `${pubCode}${year} ${monthNumber}/${issueDay} ${opts.pageTerm} ${page} ${opts.parTerm} ${paragraph}`;
  };

  // Day + month format (w10 15 January p. 3 par. 1); the day is optional in the English regex
  opts.dayMonthRegex.lastIndex = 0;
  const dayMonthMatch = opts.dayMonthRegex.exec(input);
  if (dayMonthMatch) {
    const [fullMatch, isStudy, year, day, monthName, page, paragraph] = dayMonthMatch;
    const monthNumber = opts.months[monthName.toLowerCase()];
    if (monthNumber) {
      const formatted = format(isStudy, year, monthNumber, day, page, paragraph);
      debugLog(`Auto-formatted ${opts.label} Watchtower:`, input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  // Month-only format (w25 March p. 8 par. 2)
  opts.monthRegex.lastIndex = 0;
  const monthMatch = opts.monthRegex.exec(input);
  if (monthMatch) {
    const [fullMatch, isStudy, year, monthName, page, paragraph] = monthMatch;
    const monthNumber = opts.months[monthName.toLowerCase()];
    if (monthNumber) {
      const formatted = format(isStudy, year, monthNumber, undefined, page, paragraph);
      debugLog(`Auto-formatted ${opts.label} Watchtower (month-only):`, input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  return input;
}

function normalizeInput(input) {
  if (typeof input !== 'string') return input;

  // Don't touch URLs / app links
  if (/\bhttps?:\/\//i.test(input) || /\bjwlibrary:\/\//i.test(input) || /\bjw\.org\//i.test(input) || /\bwol\.jw\.org\//i.test(input)) {
    return input;
  }

  // Normalize basic whitespace
  let s = input.replaceAll('\u00A0', ' ');
  s = s.replace(/[ \t]+/g, ' ').trim();

  // Normalize separators
  s = s.replace(/\s*([,;])\s*/g, '$1 ');
  s = s.replace(/\s*\/\s*/g, '/');

  // Normalize Watchtower shorthand like w20 .08 -> w20.08 and ws20 .08 -> ws20.08
  s = s.replace(/\b(ws?)\s*(\d{2})\s*\.\s*(\d{1,2})\b/gi, '$1$2.$3');

  // Normalize common unit markers with optional spaces (EN/RU/ES)
  // Pages: p., pp., с., сс., pág., págs.
  s = s.replace(/\b(págs?\.|pág\.|pp?\.|сс?\.)\s*(\d)/gi, '$1 $2');
  // Paragraph markers — \b only works for ASCII; абз. and párr. matched without it
  s = s.replace(/\b(pars?\.)\s*(\d)/gi, '$1 $2');
  s = s.replace(/(абз\.|párrs?\.|§|Abs\.)\s*(\d)/gi, '$1 $2');
  // German page marker (S. 20) — capital S only, "s." is not a page marker
  s = s.replace(/\b(S\.)\s*(\d)/g, '$1 $2');
  // Chapter markers — same: глава and cap. don't use \b
  s = s.replace(/\b(chap\.|Kap\.)\s*(\d)/gi, '$1 $2');
  s = s.replace(/(глава|cap\.)\s*(\d)/gi, '$1 $2');

  // Final cleanup for multiple spaces introduced by rules
  s = s.replace(/[ \t]+/g, ' ').trim();

  return s;
}

/**
 * Auto-format English Watchtower publications with month names
 * @param {string} input - Input text to check and format
 * @returns {string} - Formatted text or original if no match
 */
function autoFormatEnglishWatchtower(input) {
  return autoFormatLatinWatchtower(input, {
    dayMonthRegex: Config.englishPubDayMonthRegex,
    monthRegex: Config.englishPubMonthRegex,
    months: EnglishMonths,
    pageTerm: 'p.',
    parTerm: 'par.',
    label: 'English',
  });
}

/**
 * Auto-format Spanish Watchtower publications with month names
 * @param {string} input - Input text to check and format
 * @returns {string} - Formatted text or original if no match
 */
function autoFormatSpanishWatchtower(input) {
  return autoFormatLatinWatchtower(input, {
    dayMonthRegex: Config.spanishPubDayMonthRegex,
    monthRegex: Config.spanishPubMonthRegex,
    months: SpanishMonths,
    pageTerm: 'pág.',
    parTerm: 'párr.',
    dayFirst: true, // Spanish WOL uses day/month: w10 15/1
    label: 'Spanish',
  });
}

/**
 * Month-name Watchtower formats of the other languages, e.g.
 *   w25 março p. 8 par. 2 | w10 15 de janeiro p. 3 par. 1   (Portuguese)
 *   w25 mars p. 8 § 2 | w10 15 janvier p. 3 § 1             (French)
 *   w25 März S. 8 Abs. 2 | w10 15. Januar S. 3 Abs. 1       (German)
 */
const MonthNameWatchtowerFormats = [
  { label: 'Portuguese', months: () => PortugueseMonthNames, page: 'p', par: 'par\\.', pageTerm: 'p.', parTerm: 'par.', dayFirst: true },
  { label: 'French', months: () => FrenchMonthNames, page: 'p', par: '§', pageTerm: 'p.', parTerm: '§', dayFirst: true },
  {
    label: 'German', months: () => GermanMonthNames, page: 'S', par: 'Abs\\.', pageTerm: 'S.', parTerm: 'Abs.',
    issue: (day, month) => `${day}. ${month}.`,
  },
];

/**
 * Auto-format Portuguese, French and German Watchtower references with month names
 * @param {string} input
 * @returns {string} formatted text or the original
 */
function autoFormatOtherWatchtower(input) {
  for (const format of MonthNameWatchtowerFormats) {
    const names = format.months().slice(1);
    const months = Object.fromEntries(names.map((name, i) => [name.toLowerCase(), String(i + 1).padStart(2, '0')]));
    const monthAlt = names.join('|');
    const tail = `\\s+${format.page}\\.\\s*(\\d+)\\s+${format.par}\\s*(\\d+)`;
    const formatted = autoFormatLatinWatchtower(input, {
      dayMonthRegex: new RegExp(`w(s)?(\\d{2})\\s+(1|15)(?:er|\\.)?\\s+(?:de\\s+)?(${monthAlt})${tail}`, 'giu'),
      monthRegex: new RegExp(`w(s)?(\\d{2})\\s+(${monthAlt})${tail}`, 'giu'),
      months,
      pageTerm: format.pageTerm,
      parTerm: format.parTerm,
      dayFirst: format.dayFirst,
      issue: format.issue,
      label: format.label,
    });
    if (formatted !== input) return formatted;
  }
  return input;
}

const RussianMonthNames = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const RussianMonthNamesGenitive = ['', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/**
 * Fill a citation template ({title}, {text}).
 * For callout templates ("> [!cite] ...\n> {text}") every line of a multi-line text must
 * stay inside the callout, but the line the template already prefixes with "> " must not
 * get a second ">" (that renders as a nested quote).
 * Function replacers are used so "$" in fetched text is never treated as a pattern.
 * @param {string} template
 * @param {string} title
 * @param {string} text
 * @returns {string}
 */
function fillCitationTemplate(template, title, text) {
  let body = text ?? '';
  if (template.trimStart().startsWith('>')) {
    const lines = body.split('\n').map((line) => line.replace(/^>\s?/, ''));
    const firstLinePrefixed = /(^|\n)>[ \t]*\{text\}/.test(template);
    body = lines
      .map((line, i) => (i === 0 && firstLinePrefixed ? line : line.trim() ? `> ${line}` : '>'))
      .join('\n');
  }
  return template.replace('{title}', () => title).replace('{text}', () => body);
}

/* ---------------------------------------------------------------------------
 * Publication references (Watchtower and other publications)
 *
 * All publication citations go through the same three steps:
 *   1. parse the reference, whatever language format it was typed in
 *   2. build the WOL search query and the title in the citation language
 *   3. fetch the paragraph from the WOL lookup page (.resultItems)
 * WOL resolves exact references ("w23.12 p. 20 par. 7", "w25.03 8, абз. 2",
 * "od cap. 15 párr. 3") and returns the requested paragraph.
 * ------------------------------------------------------------------------- */

const SpanishMonthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const PortugueseMonthNames = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const FrenchMonthNames = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const GermanMonthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const EnglishMonthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Conventions of each citation language (keys match Languages: EN, RU, ES) */
const PubLangs = {
  EN: {
    label: 'PUB.', chapter: 'chap.', page: 'p.', pages: 'pp.', par: 'par.',
    dayFirst: false, // w10 1/15 = 15 January
    notFound: 'Text not found. Try search:',
    watchtower: 'The Watchtower', watchtowerStudy: 'The Watchtower (Study Edition)',
    month: (m) => EnglishMonthNames[m],
    issue: (day, m) => `${EnglishMonthNames[m]} ${day}`,
  },
  RU: {
    label: 'ПУБЛ.', chapter: 'глава', page: 'с.', pages: 'сс.', par: 'абз.',
    dayFirst: true, // w10 15/1 = 15 января
    notFound: 'Текст не найден. Попробуйте поиск:',
    watchtower: 'Сторожевая башня', watchtowerStudy: 'Сторожевая башня (выпуск для изучения)',
    month: (m) => RussianMonthNames[m],
    issue: (day, m) => `${day} ${RussianMonthNamesGenitive[m]}`,
  },
  ES: {
    label: 'PUBL.', chapter: 'cap.', page: 'pág.', pages: 'págs.', par: 'párr.',
    dayFirst: true, // w10 15/1 = 15 de enero
    notFound: 'Texto no encontrado. Pruebe la búsqueda:',
    watchtower: 'La Atalaya', watchtowerStudy: 'La Atalaya (edición de estudio)',
    month: (m) => SpanishMonthNames[m].charAt(0).toUpperCase() + SpanishMonthNames[m].slice(1),
    issue: (day, m) => `${day} de ${SpanishMonthNames[m]}`,
  },
  PT: {
    label: 'PUBL.', chapter: 'cap.', page: 'p.', pages: 'pp.', par: 'par.',
    dayFirst: true, // w10 15/1 = 15 de janeiro
    notFound: 'Texto não encontrado. Tente a pesquisa:',
    watchtower: 'A Sentinela', watchtowerStudy: 'A Sentinela (Edição de Estudo)',
    month: (m) => capitalize(PortugueseMonthNames[m]),
    issue: (day, m) => `${day} de ${PortugueseMonthNames[m]}`,
  },
  FR: {
    label: 'PUB.', chapter: 'chap.', page: 'p.', pages: 'p.', par: '§',
    dayFirst: true, // w10 15/1 = 15 janvier
    notFound: 'Texte introuvable. Essayez la recherche :',
    watchtower: 'La Tour de Garde', watchtowerStudy: 'La Tour de Garde (édition d’étude)',
    month: (m) => capitalize(FrenchMonthNames[m]),
    issue: (day, m) => `${day === 1 ? '1er' : day} ${FrenchMonthNames[m]}`,
  },
  DE: {
    label: 'PUBL.', chapter: 'Kap.', page: 'S.', pages: 'S.', par: 'Abs.',
    dayFirst: true, // w10 15. 1. = 15. Januar
    issueQuery: (day, m) => `${day}. ${m}.`, // German WOL writes the issue as "15. 1."
    notFound: 'Text nicht gefunden. Versuche die Suche:',
    watchtower: 'Der Wachtturm', watchtowerStudy: 'Der Wachtturm (Studienausgabe)',
    month: (m) => GermanMonthNames[m],
    issue: (day, m) => `${day}. ${GermanMonthNames[m]}`,
  },
};

/**
 * Citation language for publication references typed in the English format ("p. 20 par. 7"),
 * which Portuguese also uses: Portuguese when the interface is in Portuguese.
 * Updated from the settings (see updatePublicationFormatLanguage).
 */
let LatinFormatLang = 'EN';

/**
 * @param {Object} settings - plugin settings
 */
function updatePublicationFormatLanguage(settings) {
  LatinFormatLang = settings?.interfaceLang === 'Portuguese' ? 'PT' : 'EN';
}

/** Publication titles by citation language */
const PublicationTitles = {
  EN: {
    od: 'Organized to Do Jehovah\'s Will', 'it-1': 'Insight on the Scriptures, Volume 1',
    'it-2': 'Insight on the Scriptures, Volume 2', si: 'All Scripture Is Inspired of God and Beneficial',
    g: 'Awake!', w: 'The Watchtower', km: 'Our Kingdom Ministry',
    mwb: 'Our Christian Life and Ministry—Meeting Workbook', lff: 'Enjoy Life Forever!',
    rs: 'Reasoning From the Scriptures', cl: 'Draw Close to Jehovah',
    jv: 'Jehovah\'s Witnesses—Proclaimers of God\'s Kingdom', dp: 'Pay Attention to Daniel\'s Prophecy!',
    'ip-1': 'Isaiah\'s Prophecy—Light for All Mankind I', 'ip-2': 'Isaiah\'s Prophecy—Light for All Mankind II',
    be: 'Learn From the Theocratic Ministry School', th: 'Apply Yourself to Reading and Teaching',
  },
  RU: {
    od: 'Организованы исполнять волю Иеговы', 'it-1': 'Понимание Писания, том 1',
    'it-2': 'Понимание Писания, том 2', si: 'Все Писание вдохновлено Богом и полезно',
    g: 'Пробудитесь!', w: 'Сторожевая башня', km: 'Наше царственное служение',
    mwb: 'Наша христианская жизнь и служение', lff: 'Радуйтесь жизни сейчас и вечно!',
    rs: 'Рассуждение на основании Писаний', cl: 'Приближайтесь к Иегове',
    jv: 'Свидетели Иеговы — возвещатели Царства Бога', dp: 'Обратите внимание на пророчество Даниила!',
    'ip-1': 'Пророчество Исаии — свет для всего человечества I', 'ip-2': 'Пророчество Исаии — свет для всего человечества II',
    be: 'Учимся в Школе теократического служения', th: 'Развивай навыки чтения и способность',
  },
  ES: {
    od: 'Organizados para hacer la voluntad de Jehová', 'it-1': 'Perspicacia para comprender las Escrituras, Volumen 1',
    'it-2': 'Perspicacia para comprender las Escrituras, Volumen 2', si: 'Toda Escritura es inspirada de Dios y provechosa',
    g: '¡Despertad!', w: 'La Atalaya', km: 'Nuestro Ministerio del Reino',
    mwb: 'Nuestra Vida Cristiana y Ministerio—Cuaderno de reunión', lff: '¡Disfrute de la vida para siempre!',
    rs: 'Razonamiento a partir de las Escrituras', cl: 'Acerquémonos a Jehová',
    jv: 'Los testigos de Jehová, proclamadores del Reino de Dios', dp: '¡Presta atención a la profecía de Daniel!',
    'ip-1': 'La profecía de Isaías: luz para toda la humanidad I', 'ip-2': 'La profecía de Isaías: luz para toda la humanidad II',
    be: 'Benefíciese de la Escuela del Ministerio Teocrático', th: 'Aplícate a la lectura y la enseñanza',
  },
  PT: {
    od: 'Organizados para Fazer a Vontade de Jeová', 'it-1': 'Estudo Perspicaz das Escrituras, Volume 1',
    'it-2': 'Estudo Perspicaz das Escrituras, Volume 2', si: 'Toda a Escritura É Inspirada por Deus e Proveitosa',
    g: 'Despertai!', w: 'A Sentinela', km: 'Nosso Ministério do Reino',
    mwb: 'Nossa Vida e Ministério Cristão — Apostila do Mês', lff: 'Seja Feliz para Sempre!',
    rs: 'Raciocínios à Base das Escrituras', cl: 'Achegue-se a Jeová',
    jv: 'Testemunhas de Jeová — Proclamadores do Reino de Deus', dp: 'Preste Atenção à Profecia de Daniel!',
    'ip-1': 'Profecia de Isaías — Uma Luz para Toda a Humanidade I', 'ip-2': 'Profecia de Isaías — Uma Luz para Toda a Humanidade II',
    be: 'Beneficie-se da Escola do Ministério Teocrático', th: 'Melhore Sua Leitura e Seu Ensino',
  },
  FR: {
    od: 'Organisés pour faire la volonté de Jéhovah', 'it-1': 'Étude perspicace des Écritures, volume 1',
    'it-2': 'Étude perspicace des Écritures, volume 2', si: '« Toute Écriture est inspirée de Dieu et utile »',
    g: 'Réveillez-vous !', w: 'La Tour de Garde', km: 'Notre ministère du Royaume',
    mwb: 'Cahier pour la réunion Vie chrétienne et ministère', lff: 'Vivez pour toujours !',
    rs: 'Comment raisonner à partir des Écritures', cl: 'Approchez-vous de Jéhovah',
    jv: 'Les Témoins de Jéhovah, prédicateurs du Royaume de Dieu', dp: 'Prêtons attention à la prophétie de Daniel !',
    'ip-1': 'La prophétie d’Isaïe, lumière pour tous les humains I', 'ip-2': 'La prophétie d’Isaïe, lumière pour tous les humains II',
    be: 'Tirez profit de l’École du ministère théocratique', th: 'Applique-toi à la lecture et à l’enseignement',
  },
  DE: {
    od: 'Organisiert, Jehovas Willen zu tun', 'it-1': 'Einsichten über die Heilige Schrift, Band 1',
    'it-2': 'Einsichten über die Heilige Schrift, Band 2', si: '„Die ganze Schrift ist von Gott inspiriert und nützlich“',
    g: 'Erwachet!', w: 'Der Wachtturm', km: 'Unser Königreichsdienst',
    mwb: 'Unser Leben und Dienst als Christ — Arbeitsheft', lff: 'Glücklich – für immer',
    rs: 'Unterredungen anhand der Schriften', cl: 'Komm Jehova doch näher',
    jv: 'Jehovas Zeugen — Verkündiger des Königreiches Gottes', dp: 'Die Prophezeiung Daniels — Achte darauf!',
    'ip-1': 'Die Prophezeiung Jesajas — Licht für alle Menschen I', 'ip-2': 'Die Prophezeiung Jesajas — Licht für alle Menschen II',
    be: 'Nutze die Belehrung der Theokratischen Predigtdienstschule', th: 'Werde ein besserer Leser und Lehrer',
  },
};

/**
 * Watchtower reference in any supported format (the paragraph is required):
 *   w25.01 28, абз. 11 | w25.3 с. 8 абз. 2 | w10 15/1 с. 3 абз. 1   (Russian)
 *   w23.12 p. 20 par. 7 | w65 6/1 p. 329 par. 6 | ws12 2/15 15 par. 2 (English, month/day)
 *   w23.12 pág. 20 párr. 7 | w10 15/1 pág. 3 párr. 1                (Spanish, day/month)
 *   w23.12 p. 20 par. 7 | w10 15/1 p. 3 par. 1                      (Portuguese = English markers, day/month)
 *   w23.12 p. 20 § 7 | w10 15/1 p. 3 § 1                            (French, day/month)
 *   w23.12 S. 20 Abs. 7 | w10 15. 1. S. 3 Abs. 1                    (German, day. month.)
 * Groups: 1 study, 2 year, 3 month (YY.MM), 4/5 day-month or month-day,
 *         6 page marker, 7 page, 8 paragraph marker, 9 paragraph
 */
const WatchtowerRegex =
  /\bw(s)?(\d{2})(?:\.(\d{1,2})|\s+(\d{1,2})(?:\/|\.\s?)(\d{1,2})\.?)\s+(?:(pág|p|с|S)\.\s*)?(\d+),?\s*(абз\.|párrs?\.|pars?\.|§|Abs\.)\s*(\d+(?:\s*[-–—]\s*\d+|(?:\s*,\s*\d+)+)?)/i;

/**
 * Parse a Watchtower reference
 * @param {string} input
 * @returns {{whole: string, isStudy: boolean, year: string, month: number, day: number|null,
 *   page: string, paragraph: string, sourceLang: string}|null}
 */
function parseWatchtowerReference(input) {
  const m = WatchtowerRegex.exec(input ?? '');
  if (!m) return null;
  return watchtowerFromMatch(m);
}

/** @param {RegExpMatchArray} m match of WatchtowerRegex */
function watchtowerFromMatch(m) {
  const [whole, study, year, dotMonth, a, b, pageMarker, page, parMarker, paragraph] = m;
  const marker = parMarker.toLowerCase().replace('.', '');
  const sourceLang = { 'абз': 'RU', '§': 'FR', abs: 'DE' }[marker]
    ?? (marker.startsWith('párr') ? 'ES' : LatinFormatLang); // "par." is English or Portuguese
  let month;
  let day = null;
  if (dotMonth) {
    month = Number(dotMonth);
  } else if (PubLangs[sourceLang].dayFirst) {
    day = Number(a);
    month = Number(b);
  } else {
    month = Number(a);
    day = Number(b);
    // "15/1" can only be day/month (typed in the Portuguese order)
    if (month > 12 && day <= 12) [month, day] = [day, month];
  }
  if (month < 1 || month > 12 || (day !== null && (day < 1 || day > 31))) return null;
  return {
    whole, isStudy: Boolean(study), year, month, day, page, paragraph: limitParagraphSpec(normalizeParagraphSpec(paragraph)), sourceLang, pageMarker,
  };
}

/** Most paragraphs cited at once (one WOL request per paragraph) */
const MaxCitedParagraphs = 10;

/**
 * Paragraph list or range as typed ("8, 9", "8-10", "8—10") → normalised text ("8, 9" / "8-10")
 * @param {string} spec
 * @returns {string}
 */
function normalizeParagraphSpec(spec) {
  return String(spec).replace(/\s*[-–—]\s*/g, '-').replace(/\s*,\s*/g, ', ').trim();
}

/**
 * Paragraph numbers in a list or range: "8, 9" → [8, 9], "8-10" → [8, 9, 10]
 * At most MaxCitedParagraphs numbers; a reversed range is read as a single paragraph.
 * @param {string} spec
 * @returns {number[]}
 */
function expandParagraphSpec(spec) {
  const numbers = [];
  for (const part of String(spec ?? '').split(',')) {
    const [a, b] = part.split('-').map((n) => Number.parseInt(n, 10));
    if (!Number.isFinite(a)) continue;
    const last = Number.isFinite(b) && b >= a ? b : a;
    for (let n = a; n <= last && numbers.length < MaxCitedParagraphs; n++) {
      if (!numbers.includes(n)) numbers.push(n);
    }
  }
  return numbers;
}

/**
 * Keep a paragraph spec within MaxCitedParagraphs, so the title says what is cited:
 * "1-30" → "1-10"
 * @param {string} spec - normalised spec
 * @returns {string}
 */
function limitParagraphSpec(spec) {
  const all = [];
  for (const part of spec.split(',')) {
    const [a, b] = part.split('-').map((n) => Number.parseInt(n, 10));
    if (Number.isFinite(a)) all.push(Number.isFinite(b) && b >= a ? b - a + 1 : 1);
  }
  if (all.reduce((sum, n) => sum + n, 0) <= MaxCitedParagraphs) return spec;
  const cited = expandParagraphSpec(spec);
  const isRun = cited.every((n, i) => i === 0 || n === cited[i - 1] + 1);
  return isRun ? `${cited[0]}-${cited[cited.length - 1]}` : cited.join(', ');
}

/**
 * One WOL query per paragraph: WOL resolves single paragraphs reliably, while lists
 * ("par. 7, 8") often find nothing
 * @param {Object} ref - parsed reference with a .paragraph spec
 * @param {(ref: Object) => string} formatQuery
 * @returns {string[]}
 */
function paragraphQueries(ref, formatQuery) {
  const paragraphs = ref.paragraph ? expandParagraphSpec(ref.paragraph) : [];
  if (paragraphs.length <= 1) return [formatQuery(ref)];
  return paragraphs.map((n) => formatQuery({ ...ref, paragraph: String(n) }));
}

/** WOL search query for a Watchtower reference, in the citation language */
function formatWatchtowerQuery(ref, lang) {
  const L = PubLangs[lang];
  const code = ref.isStudy ? 'ws' : 'w';
  if (ref.day) {
    const issue = L.issueQuery?.(ref.day, ref.month) ?? (L.dayFirst ? `${ref.day}/${ref.month}` : `${ref.month}/${ref.day}`);
    return `${code}${ref.year} ${issue} ${L.page} ${ref.page} ${L.par} ${ref.paragraph}`;
  }
  const month = String(ref.month).padStart(2, '0');
  if (lang === 'RU') {
    return `${code}${ref.year}.${month} ${ref.page}, ${L.par} ${ref.paragraph}`;
  }
  return `${code}${ref.year}.${month} ${L.page} ${ref.page} ${L.par} ${ref.paragraph}`;
}

/** Display title for a Watchtower reference, in the citation language */
function formatWatchtowerTitle(ref, lang) {
  const L = PubLangs[lang];
  const name = ref.isStudy ? L.watchtowerStudy : L.watchtower;
  const issue = ref.day ? L.issue(ref.day, ref.month) : L.month(ref.month);
  return `${name} ${toFullYear(ref.year)} ${issue} ${L.page} ${ref.page} ${L.par} ${ref.paragraph}`;
}

/**
 * Parse another publication reference (od 15 par. 3, it-1 332, cl глава 8 с. 77 абз. 2, ...)
 * @param {string} input
 * @returns {{whole: string, pubCode: string, number: string, page: string|undefined,
 *   paragraph: string|undefined, hasChapter: boolean, sourceLang: string}|null}
 */
function parseOtherPublicationReference(input) {
  const m = matchOtherPublication(input ?? '');
  if (!m) return null;
  const [whole, pubCode, number, page, paragraph] = m;
  const text = whole.trim();
  let sourceLang = LatinFormatLang; // English markers (chap., p., par.) are also Portuguese page/paragraph markers
  if (/абз\.|глава|(?:^|\s)сс?\./i.test(text) || /[Ѐ-ӿ]/.test(input)) {
    sourceLang = 'RU';
  } else if (/párrs?\.|págs?\./i.test(text)) {
    sourceLang = 'ES';
  } else if (/§/.test(text)) {
    sourceLang = 'FR';
  } else if (/Kap\.|Abs\.|(?:^|\s)S\./.test(text)) {
    sourceLang = 'DE';
  } else if (/(?:^|\s)cap\./i.test(text)) {
    // cap. with par. is Portuguese; cap. alone is Spanish unless the interface is Portuguese
    sourceLang = /pars?\./i.test(text) ? 'PT' : (LatinFormatLang === 'PT' ? 'PT' : 'ES');
  }
  return {
    whole: text,
    pubCode: pubCode.toLowerCase(),
    number,
    page,
    paragraph: paragraph ? limitParagraphSpec(normalizeParagraphSpec(paragraph)) : undefined,
    hasChapter: /chap\.|глава|(?:^|\s)cap\.|kap\./i.test(text),
    sourceLang,
  };
}

/** WOL search query for another publication, in the citation language */
function formatOtherPublicationQuery(ref, lang) {
  return `${ref.pubCode} ${formatOtherPublicationLocation(ref, lang)}`;
}

/** "chap. 15 par. 3" / "глава 15 абз. 3" / "332" ... in the citation language */
function formatOtherPublicationLocation(ref, lang) {
  const L = PubLangs[lang];
  // WOL only resolves od/cl paragraphs with the chapter marker ("od 15 par. 3" finds nothing)
  const useChapter = ref.hasChapter || (['od', 'cl'].includes(ref.pubCode) && Boolean(ref.paragraph));
  let location = `${useChapter ? `${L.chapter} ` : ''}${ref.number}`;
  if (ref.page) location += ` ${ref.page.includes('-') ? L.pages : L.page} ${ref.page}`;
  if (ref.paragraph) location += ` ${L.par} ${ref.paragraph}`;
  return location;
}

/** Display title for another publication, in the citation language */
function formatOtherPublicationTitle(ref, lang) {
  const name = PublicationTitles[lang]?.[ref.pubCode] ?? ref.pubCode;
  return `${name} ${formatOtherPublicationLocation(ref, lang)}`;
}

/**
 * Is there a publication reference (Watchtower or other) in this text?
 * @param {string} input
 * @returns {boolean}
 */
function isPublicationReference(input) {
  return Boolean(parseWatchtowerReference(input) || matchOtherPublication(input));
}

/* ---------------------------------------------------------------------------
 * Verse preview on hover (desktop only)
 * ------------------------------------------------------------------------- */

/** Verses shown in the popup; longer ranges end with "… and N more verses" */
const VersePreviewMaxVerses = 5;
/** Hover time before the popup opens, so passing over a link loads nothing */
const VersePreviewDelayMs = 500;
/** Verse texts kept in memory between hovers */
const VersePreviewCacheSize = 200;

/**
 * Bible passage behind a JW Library link, e.g.
 * jwlibrary:///finder?bible=45001020-45001022&wtlocale=U
 * @param {string|null} href
 * @returns {{lang: string, ids: string[], url: string}|null} url = jw.org page with the verse text
 */
function parseJwlBibleHref(href) {
  const prefix = Config.jwlFinder; // jwlibrary:///finder?
  if (!href || !href.startsWith(prefix)) return null;
  const params = new URLSearchParams(href.slice(prefix.length));
  const bible = params.get('bible');
  const m = /^(\d{7,8})(?:-(\d{7,8}))?$/.exec(bible ?? '');
  if (!m) return null;
  const first = Number(m[1]);
  const last = m[2] ? Number(m[2]) : first;
  // a passage is always within one chapter: same book + chapter part (all but the last 3 digits)
  if (last < first || Math.floor(first / 1000) !== Math.floor(last / 1000)) return null;
  const wtlocale = params.get('wtlocale') ?? 'E';
  const lang = LangByWtlocale[wtlocale] ?? 'EN';
  const ids = [];
  for (let id = first; id <= last; id++) ids.push(String(id));
  return { lang, ids, url: `${getFinderUrl(lang)}${Config.urlParam}${bible}` };
}

/**
 * Find a Bible book by name or abbreviation (spaces and dots removed, lower case).
 * The preferred language is tried first, then the other supported languages,
 * so "Juan 3:16" is found even when auto-detection guessed English.
 * @param {string} bookKey - e.g. "rom", "1cor", "juan", "пс"
 * @param {string} preferredLang - EN | RU | ES | ...
 * @returns {{index: number, lang: string}|null} index = book number - 1
 */
function findBibleBook(bookKey, preferredLang) {
  if (!bookKey) return null;
  // Any word before a number ("week 42", "в 2020") is looked up, so remember the answers
  const cacheKey = `${preferredLang}|${bookKey}`;
  if (BookLookupCache.has(cacheKey)) return BookLookupCache.get(cacheKey);
  if (BookLookupCache.size >= BookLookupCacheSize) BookLookupCache.clear();
  const found = lookUpBibleBook(bookKey, preferredLang);
  BookLookupCache.set(cacheKey, found);
  return found;
}

/** Book lookups kept in memory (the Bible data never changes at runtime) */
const BookLookupCacheSize = 2000;
const BookLookupCache = new Map();

/** Uncached search behind findBibleBook */
function lookUpBibleBook(bookKey, preferredLang) {
  const escaped = bookKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // (^| ) avoids matching inside book names, e.g. "eph" in "zephaniah"
  const bookRgx = new RegExp(`(^| )${escaped}`, 'm');
  const langs = [preferredLang, ...BibleSearchOrder].filter((l, i, all) => Bible[l] && all.indexOf(l) === i);
  for (const lang of langs) {
    // An exact name or abbreviation wins over a longer name that starts with the key:
    // Portuguese "Jo" is João, not Josué
    let index = Bible[lang].Abbreviation.findIndex((elem) => elem.split(' ').includes(bookKey));
    if (index === -1) index = Bible[lang].Abbreviation.findIndex((elem) => bookRgx.test(elem));
    if (index !== -1) return { index, lang };
  }
  return null;
}

/** Languages searched for a book name, after the preferred one (existing languages first) */
const BibleSearchOrder = ['EN', 'ES', 'RU', 'PT', 'FR', 'DE'];

/**
 * Language of a book name as typed, for auto-detection: "juan" → ES, "jean" → FR, "1mo" → DE.
 * English, Spanish and Russian keep their earlier behaviour: they claim every key that starts
 * one of their names ("fil", "apo" stay Spanish). Portuguese, French and German only claim
 * their exact names and abbreviations, so they never take over a short form.
 * @param {string} bookKey - lower case, no spaces or dots
 * @returns {string|null} language key, or null if no language has this name
 */
function detectBookLanguage(bookKey) {
  if (!bookKey) return null;
  if (BookLanguageCache.has(bookKey)) return BookLanguageCache.get(bookKey);
  const startsName = (lang) => Bible[lang].Abbreviation.some((names) => ` ${names}`.includes(` ${bookKey}`));
  const isName = (lang) => Bible[lang].Abbreviation.some((names) => names.split(' ').includes(bookKey));
  const lang = ['EN', 'ES', 'RU'].find(startsName) ?? ['PT', 'FR', 'DE'].find(isName) ?? null;
  if (BookLanguageCache.size >= BookLookupCacheSize) BookLanguageCache.clear();
  BookLanguageCache.set(bookKey, lang);
  return lang;
}

/** Results of detectBookLanguage */
const BookLanguageCache = new Map();

/* ---------------------------------------------------------------------------
 * Scripture links in Live Preview
 * ------------------------------------------------------------------------- */

/** Lines longer than this are not scanned (performance) */
const LivePreviewMaxLineLength = 5000;

/** Distinct lines whose link ranges are kept in memory (the cache restarts when full) */
const LivePreviewCacheSize = 1000;

/**
 * Character ranges of the scripture passages in a line of text, with their JW Library links.
 * The text itself is not changed: each passage ("Ps 23:1-3", "5", "24:1" in "Ps 23:1-3, 5; 24:1")
 * gets its own range so the link and the hover preview match what is under the mouse.
 * @param {Plugin} plugin
 * @param {string} text - one line
 * @returns {Array<{from: number, to: number, href: string}>} sorted, non-overlapping
 */
function scriptureLinkRanges(plugin, text) {
  if (!text || text.length > LivePreviewMaxLineLength || !/\d/.test(text)) return [];
  // Live Preview rebuilds every visible line on each keystroke, but usually only one line
  // has changed: reuse the ranges of the others. They depend on the text and these settings.
  const signature = `${plugin.settings.lang}|${plugin.settings.spaceAfterPunct}`;
  let cache = plugin._linkRangeCache;
  if (!cache || cache.signature !== signature || cache.lines.size >= LivePreviewCacheSize) {
    cache = plugin._linkRangeCache = { signature, lines: new Map() };
  }
  let ranges = cache.lines.get(text);
  if (!ranges) {
    ranges = computeScriptureLinkRanges(plugin, text);
    cache.lines.set(text, ranges);
  }
  return ranges;
}

/** Uncached search behind scriptureLinkRanges */
function computeScriptureLinkRanges(plugin, text) {
  const references = plugin
    ._parseScriptureLinks(text, DisplayType.href, plugin.settings.spaceAfterPunct)
    .filter((ref) => !ref.isLinkAlready && !ref.isPlainText && ref.passages.some((p) => p.link))
    .sort((a, b) => a.index - b.index);

  const ranges = [];
  let lastEnd = -1;
  for (const ref of references) {
    if (ref.index < lastEnd) continue; // overlapping match
    const segments = passageSegments(ref.original, ref.bookLength);
    if (segments && segments.length === ref.passages.length) {
      ref.passages.forEach((passage, i) => {
        if (passage.link) {
          ranges.push({ from: ref.index + segments[i][0], to: ref.index + segments[i][1], href: passage.link.jwlib });
        }
      });
    } else {
      // could not split the reference into passages: link all of it to the first passage
      const first = ref.passages.find((p) => p.link);
      ranges.push({ from: ref.index, to: ref.index + ref.original.length, href: first.link.jwlib });
    }
    lastEnd = ref.index + ref.original.length;
  }
  return ranges;
}

/**
 * Split a scripture reference as typed into one [start, end) range per passage, in the same
 * order as _parseScriptureLinks creates passages: chapters are separated by ";", verses by ",",
 * and two consecutive verses ("1, 2") form one passage.
 * The first range includes the book name.
 * @param {string} original - e.g. "Ps 23:1-3, 5; 24:1"
 * @param {number} bookLength - length of the book name part (incl. a plain-text marker)
 * @returns {Array<[number, number]>|null}
 */
function passageSegments(original, bookLength) {
  if (!Number.isFinite(bookLength)) return null;
  const segments = [];
  let pos = bookLength;
  const parts = original.slice(bookLength).split(';');
  for (const [p, part] of parts.entries()) {
    const partStart = pos;
    pos += part.length + 1; // + ";"
    const colon = part.indexOf(':');
    if (colon === -1) {
      segments.push([p === 0 ? 0 : partStart + leadingSpaces(part), partStart + trimmedEnd(part)]);
      continue;
    }
    // verses after the colon, with their offsets in the part
    const verses = [];
    let vPos = colon + 1;
    for (const verse of part.slice(colon + 1).split(',')) {
      verses.push({ text: verse, start: vPos + leadingSpaces(verse), end: vPos + trimmedEnd(verse) });
      vPos += verse.length + 1; // + ","
    }
    for (let i = 0; i < verses.length; i++) {
      let end = verses[i].end;
      const current = Number(verses[i].text);
      const next = i < verses.length - 1 ? Number(verses[i + 1].text) : NaN;
      if (current === next - 1) {
        end = verses[i + 1].end; // two consecutive verses are one passage
      }
      const start = i === 0 ? (p === 0 ? 0 : leadingSpaces(part)) : verses[i].start;
      segments.push([partStart + (p === 0 && i === 0 ? -partStart : start), partStart + end]);
      if (current === next - 1) i++;
    }
  }
  return segments;

  function leadingSpaces(str) {
    return str.length - str.trimStart().length;
  }
  function trimmedEnd(str) {
    return str.trimEnd().length;
  }
}

/* ---------------------------------------------------------------------------
 * Suggestions while typing (Bible books and publication codes)
 * ------------------------------------------------------------------------- */

const MaxSuggestions = 12;

/**
 * Bible books and publication codes that start with the query
 * Books of the preferred language come first, then the other languages, then publications.
 * @param {string} query - typed after the trigger, e.g. "рим", "1 co", "juan", "od"
 * @param {string} preferredLang - EN | RU | ES
 * @returns {Array<{kind: 'book'|'publication', insert: string, label: string, detail: string, lang: string}>}
 */
function suggestionsFor(query, preferredLang) {
  const key = String(query ?? '').replace(/[\s .]/g, '').toLowerCase();
  if (!key) return [];
  const results = [];
  const langs = [preferredLang, 'EN', 'RU', 'ES', 'PT', 'FR', 'DE'].filter((l, i, all) => Bible[l] && all.indexOf(l) === i);

  for (const lang of langs) {
    Bible[lang].Abbreviation.forEach((abbr, index) => {
      const name = Bible[lang].Book[index];
      const names = [name.replace(/[\s.]/g, '').toLowerCase(), ...abbr.split(' ')];
      if (names.some((n) => n.startsWith(key))) {
        results.push({ kind: 'book', insert: `${name} `, label: name, detail: lang, lang });
      }
    });
  }

  for (const lang of langs.filter((l) => PublicationTitles[l])) {
    for (const [code, title] of Object.entries(PublicationTitles[lang])) {
      if (code.replace('-', '').startsWith(key.replace('-', '')) && !results.some((r) => r.kind === 'publication' && r.insert === `${code} `)) {
        results.push({ kind: 'publication', insert: `${code} `, label: code, detail: title, lang });
      }
    }
  }
  return results.slice(0, MaxSuggestions);
}

/**
 * Editor suggestions after the trigger (default "@" at the start of a word)
 */
class ReferenceSuggest extends EditorSuggest {
  /** @param {Plugin} plugin */
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onTrigger(cursor, editor) {
    const settings = this.plugin.settings;
    const trigger = settings.suggestTrigger || '@';
    if (!settings.suggestions) return null;
    const before = editor.getLine(cursor.line).slice(0, cursor.ch);
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // trigger at the start of a word, then up to 25 characters of a name ("1 co", "song of")
    const m = new RegExp(`(?:^|[\\s(\\[])${escaped}([\\p{L}\\d][\\p{L}\\d .-]{0,24})$`, 'u').exec(before);
    if (!m) return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[1].length - trigger.length },
      end: cursor,
      query: m[1],
    };
  }

  getSuggestions(context) {
    return suggestionsFor(context.query, this.plugin._suggestionLanguage());
  }

  renderSuggestion(item, el) {
    el.addClass('jwl-suggestion');
    el.createDiv({ cls: 'jwl-suggestion-title', text: item.label });
    const kind = item.kind === 'book' ? Lang.suggestBible : Lang.suggestPublication;
    el.createDiv({
      cls: 'jwl-suggestion-note',
      text: item.kind === 'book' ? `${kind} · ${item.lang}` : `${kind} · ${item.detail}`,
    });
  }

  selectSuggestion(item) {
    const context = this.context;
    if (!context) return;
    context.editor.replaceRange(item.insert, context.start, context.end);
    context.editor.setCursor({ line: context.start.line, ch: context.start.ch + item.insert.length });
  }
}

/**
 * Update interface language
 * @param {string} interfaceLang - Interface language (Russian, English, Spanish)
 */
function updateInterfaceLanguage(interfaceLang) {
  Lang = InterfaceStrings[interfaceLang] || InterfaceStrings.Russian;
}

/**
 * Replace the book name at the start of a displayed reference with its name in another language
 * @param {string} display - e.g. "John\u00A03:16"
 * @param {number} bookNum - 1..66
 * @param {string} lang - EN | RU | ES | PT | FR | DE
 * @returns {string}
 */
function localizeBookName(display, bookNum, lang) {
  const target = Bible[lang]?.Book[bookNum - 1];
  if (!target) return display;
  for (const books of Object.values(Bible)) {
    const name = books.Book[bookNum - 1].replaceAll(' ', '\u00A0');
    if (display.startsWith(name)) return target.replaceAll(' ', '\u00A0') + display.slice(name.length);
  }
  return display;
}

/** Interface language setting → dual-mode language code */
const InterfaceLangCodes = { Russian: 'ru', English: 'en', Spanish: 'es', Portuguese: 'pt', French: 'fr', German: 'de' };
/** Languages offered in dual mode */
const DualLangCodes = ['en', 'ru', 'es', 'pt', 'fr', 'de'];


class JWLLinkerPlugin extends Plugin {
  constructor() {
    //// biome-ignore lint/style/noArguments:
    super(...arguments);
    /** @type {Object} */
    this.settings = {};
    this.menuClass = 'jwl-linker-plugin-menu-container';
  }

  /**
   * Resolve 'Auto' language setting to actual language code
   * Based on user's locale or interface language setting
   * @returns {string} Language code: 'ru', 'en', 'es', 'pt', 'fr' or 'de'
   */
  _resolveAutoLanguage() {
    // Try to detect from interface language setting
    const fromInterface = InterfaceLangCodes[this.settings.interfaceLang];
    if (fromInterface) return fromInterface;

    // Try to detect from browser/system locale
    const locale = navigator.language || navigator.userLanguage || 'en';
    const langCode = locale.split('-')[0].toLowerCase();

    // Map to supported languages, default to English
    return DualLangCodes.includes(langCode) ? langCode : 'en';
  }

  /**
   * Get the resolved first and second languages for dual mode
   * @returns {{firstLang: string, secondLang: string}} Language codes
   */
  _getDualLanguages() {
    const firstLang = this.settings.dualLangFirst === 'Auto'
      ? this._resolveAutoLanguage()
      : this.settings.dualLangFirst;
    const secondLang = this.settings.dualLangSecond;

    // Ensure second language is different from first
    if (secondLang === firstLang) {
      // Pick a different language
      const alternatives = DualLangCodes.filter(l => l !== firstLang);
      return { firstLang, secondLang: alternatives[0] };
    }

    return { firstLang, secondLang };
  }

  /**
   * Verse text for the hover popup (first VersePreviewMaxVerses verses of the passage)
   * Successful results are cached; failures are not, so the next hover retries.
   * @param {string} href - JW Library link
   * @returns {Promise<{verses: string[], more: number, failed: boolean}|null>} null if not a Bible link
   */
  async _fetchVersePreview(href) {
    const ref = parseJwlBibleHref(href);
    if (!ref) return null;
    this.versePreviewCache ??= new Map();
    const cached = this.versePreviewCache.get(href);
    if (cached) return cached;

    const shown = ref.ids.slice(0, VersePreviewMaxVerses);
    const verses = [];
    const dom = await this._fetchDOM(ref.url);
    if (dom) {
      for (const [i, id] of shown.entries()) {
        const text = this._getElementAsText(dom, `#v${id}`, TargetType.scripture, i > 0).trim();
        if (text) verses.push(text);
      }
    }
    if (verses.length === 0) return { verses: [], more: 0, failed: true };

    const result = { verses, more: ref.ids.length - shown.length, failed: false };
    this.versePreviewCache.set(href, result);
    if (this.versePreviewCache.size > VersePreviewCacheSize) {
      this.versePreviewCache.delete(this.versePreviewCache.keys().next().value); // oldest
    }
    return result;
  }

  /**
   * Show the verse text in a popup when the mouse rests on a JW Library Bible link.
   * Desktop only: on phones and tablets a tap opens JW Library as before.
   */
  _registerVersePreview() {
    if (Platform.isMobile) return;
    let openTimer = 0;
    let closeTimer = 0;
    let current = null; // link the popup belongs to
    let popover = null;

    const close = () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
      popover?.remove();
      popover = null;
      current = null;
    };
    const closeSoon = () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(close, 300); // time to move the mouse onto the popup
    };
    this.register(close);

    this.registerDomEvent(document, 'mouseover', (evt) => {
      if (!this.settings.versePreview) return;
      const target = evt.target instanceof Element ? evt.target : null;
      if (popover?.contains(target)) {
        window.clearTimeout(closeTimer);
        return;
      }
      // <a href> in reading view, <span data-jwl-href> in Live Preview
      const link = target?.closest('a[href], [data-jwl-href]');
      const href = link?.getAttribute('data-jwl-href') ?? link?.getAttribute('href');
      if (!link || !parseJwlBibleHref(href)) {
        if (current) closeSoon();
        return;
      }
      if (link === current) {
        window.clearTimeout(closeTimer);
        return;
      }
      close();
      current = link;
      openTimer = window.setTimeout(async () => {
        if (current !== link) return;
        popover = createVersePopover(link);
        const data = await this._fetchVersePreview(href);
        if (current === link && popover) fillVersePopover(popover, data);
      }, VersePreviewDelayMs);
    });
    this.registerDomEvent(document, 'mousedown', (evt) => {
      if (!popover?.contains(evt.target)) close();
    });
    this.registerDomEvent(document, 'keydown', (evt) => {
      if (evt.key === 'Escape') close();
    });
    this.registerDomEvent(window, 'scroll', close, { capture: true });
  }

  /**
   * Live Preview: mark scripture passages as links (the note text is not changed).
   * Cmd/Ctrl+click opens JW Library; a plain click places the cursor as usual.
   * CodeMirror modules are provided by Obsidian at runtime.
   */
  _registerLivePreviewLinks() {
    let cm;
    try {
      cm = { ...require('@codemirror/view'), ...require('@codemirror/language') };
    } catch (error) {
      console.error('JWL Linker: Live Preview links are not available', error);
      return;
    }
    const { ViewPlugin, Decoration, EditorView, syntaxTree } = cm;
    const plugin = this;
    // Skip code, math, front matter, comments and existing links
    const skipNode = /code|math|frontmatter|comment|link|url|hashtag|formatting/i;

    const isSkipped = (state, pos) => {
      let node = syntaxTree(state).resolveInner(pos, 1);
      for (let depth = 0; node && depth < 4; depth++, node = node.parent) {
        if (skipNode.test(node.name)) return true;
      }
      return false;
    };

    const build = (view) => {
      const marks = [];
      if (!plugin.settings.livePreviewLinks || !view.state.field(editorLivePreviewField, false)) {
        return Decoration.none;
      }
      for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
          const line = view.state.doc.lineAt(pos);
          for (const range of scriptureLinkRanges(plugin, line.text)) {
            const start = line.from + range.from;
            if (isSkipped(view.state, start)) continue;
            marks.push(
              Decoration.mark({
                class: 'jwl-lp-link',
                attributes: { 'data-jwl-href': range.href },
              }).range(start, line.from + range.to),
            );
          }
          pos = line.to + 1;
        }
      }
      return Decoration.set(marks, true);
    };

    const linkPlugin = ViewPlugin.fromClass(
      class {
        constructor(view) {
          this.decorations = build(view);
        }
        update(update) {
          const modeChanged =
            update.startState.field(editorLivePreviewField, false) !== update.state.field(editorLivePreviewField, false);
          if (update.docChanged || update.viewportChanged || modeChanged || update.transactions.some((tr) => tr.reconfigured)) {
            this.decorations = build(update.view);
          }
        }
      },
      { decorations: (value) => value.decorations },
    );

    const clickHandler = EditorView.domEventHandlers({
      mousedown(event) {
        if (event.button !== 0 || !(event.metaKey || event.ctrlKey)) return false;
        const el = event.target instanceof Element ? event.target.closest('[data-jwl-href]') : null;
        if (!el) return false;
        event.preventDefault();
        window.open(el.getAttribute('data-jwl-href'));
        return true;
      },
    });

    this.registerEditorExtension([linkPlugin, clickHandler]);
  }

  /**
   * Language whose book names are suggested first: the fixed citation language,
   * otherwise the interface language
   * @returns {string} EN | RU | ES
   */
  _suggestionLanguage() {
    const fixed = Languages[this.settings?.lang];
    if (fixed && Bible[fixed] && fixed !== 'AUTO') return fixed;
    return InterfaceLangCodes[this.settings?.interfaceLang]?.toUpperCase() ?? 'EN';
  }

  /**
   * Language of a piece of text: the fixed language setting, or auto-detected
   * @param {string} text
   * @returns {string} Language key: 'EN', 'RU', 'ES', ...
   */
  _resolveTextLanguage(text) {
    const lang = this.settings?.lang || 'Auto';
    return lang === 'Auto' ? detectLanguage(text) : (Languages[lang] || 'EN');
  }

  /**
   * Get language label for display
   * @param {string} langCode - Language code: 'ru', 'en', 'es'
   * @returns {string} Formatted label like '**Russian:**'
   */
  _getLanguageLabel(langCode) {
    return `**${Lang.dualLangOptions?.[langCode] ?? langCode.toUpperCase()}:**`;
  }

  async onload() {
    await this.loadSettings();

    /** @namespace */
    this.api = {
      getAllScriptureLinks: this._parseScriptureLinks.bind(this),
      DisplayType: DisplayType,
    };

    // Load command palette
    for (const cmd of this.MenuCommands) {
      this.addCommand({
        id: cmd.id,
        name: cmd.text,
        icon: cmd.icon,
        editorCallback: cmd.fn,
      });
    }

    // Add the global Open JWL Menu command (for Mobile toolbar)
    this.addCommand({
      id: this.MenuName.id,
      name: Lang.menuOpenMenu,
      icon: this.MenuName.icon,
      editorCallback: (editor) => this.showMenu(editor),
    });

    this.addCommand({
      id: 'jwl-linker-open',
      name: Lang.menuOpenSidebar,
      callback: this.activateView.bind(this),
    });

    // Add right-click submenu item in Editor (for Desktop)
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addItem((item) => {
          item.setTitle(this.MenuName.text).setIcon(this.MenuName.icon);
          const submenu = item.setSubmenu();
          this.buildMenu(submenu, editor);
        });
      }),
    );

    this.registerView(JWL_LINKER_VIEW, (leaf) => new JWLLinkerView(leaf, this.settings));

    // KEY FEATURE
    // In READING Mode: Render scriptures as JWLibrary links
    this.registerMarkdownPostProcessor((element, context) => {
      context.addChild(new ScripturePostProcessor(element, this));
    });

    if (this.settings.openSidebarOnStartup) {
      this.app.workspace.onLayoutReady(this.activateView.bind(this));
    }

    this.addSettingTab(new JWLLinkerSettingTab(this.app, this));

    // Desktop: verse text in a popup when hovering a scripture link
    this._registerVersePreview();

    // Live Preview: scripture references are underlined; Cmd/Ctrl+click opens JW Library
    this._registerLivePreviewLinks();

    // Suggestions for Bible books and publication codes after the trigger ("@rom", "@od")
    this.registerEditorSuggest(new ReferenceSuggest(this.app, this));

    debugLog(`${this.manifest.name} ${this.manifest.version} loaded`);
  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    debugEnabled = Boolean(this.settings.debug);
    // Update interface language based on settings
    updateInterfaceLanguage(this.settings.interfaceLang);
    updatePublicationFormatLanguage(this.settings);
  }

  async saveSettings() {
    updatePublicationFormatLanguage(this.settings);
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(JWL_LINKER_VIEW).first();
    if (!leaf) {
      leaf = workspace.getRightLeaf(false); // false => no split
      if (!leaf) return;
      await leaf.setViewState({
        type: JWL_LINKER_VIEW,
        active: true,
      });
      await workspace.revealLeaf(leaf);
    }
  }

  /**
   * KEY FEATURE
   * Convert input to JW Library links,
   * Search entire input string for ...
   *   1. plain text scripture references
   *   2. jw.org Finder links | wol.jw.org links
   * Both are validated and return an error Notice on failure
   * Editing/Preview View only
   * @param {Editor} editor
   * @param {Cmd} command
   */
  linkToJWLibrary(editor, command) {
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;
    const { selection } = this._getEditorSelection(activeEditor);
    if (selection) {
      let output;
      let changed;
      if (command === Cmd.convertScriptureToJWLibrary) {
        ({ output, changed } = this._convertScriptureToJWLibrary(selection, DisplayType.md));
      } else if (command === Cmd.convertWebToJWLibrary) {
        ({ output, changed } = this._convertWebToJWLibrary(selection));
      }
      if (changed) {
        activeEditor.replaceSelection(output);
      }
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }
  }

  /**
   * Open the scripture under the caret in JWLibrary
   * Works only in Editing/Preview mode
   * @param {Editor} editor 
   */
  openInJWLibrary(editor) {
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;
    const { selection, caret } = this._getEditorSelection(activeEditor, false);
    if (selection) {
      const { output, changed } = this._convertScriptureToJWLibrary(selection, DisplayType.open, caret);
      if (changed) {
        window.open(output);
      }
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }
  }

  /**
   * Use the selected text, e.g. publication reference as a search in wol.jw.org
   */
  openSelectedInWOL(editor) {
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;
    const { selection } = this._getEditorSelection(activeEditor, false);
    if (selection) {
      const lang = this._resolveTextLanguage(selection);
      window.open(getConfigForLanguage(lang).wolLookup + encodeURIComponent(selection.trim()));
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }
  }

  /**
   * Cite selected text in callout format
   */
  citeSelectedText(editor) {
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;

    const { selection, line } = this._getEditorSelection(activeEditor, false);
    if (selection) {
      // Split text into lines and format each line with callout prefix
      const lines = selection.split('\n');
      const citationLines = lines.map(line => `> ${line}`);

      // Create citation callout with selected text
      const citationHeader = Lang.quoteHeader;
      const successMessage = Lang.quoteDone;

      const citation = `${citationHeader}\n${citationLines.join('\n')}`;

      // Replace selection with citation
      activeEditor.replaceSelection(citation);
      new Notice(successMessage, 2000);
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }
  }

  /**
   * Batch cite all scripture and publication references in the document
   * Adds callout citations with full text for each reference
   * @param {Editor} editor
   */
  async batchConvertAllLinks(editor) {
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;

    // Get the view for history
    const jwlView = await this.getView();
    const historyView = (jwlView && typeof jwlView.getFromHistory === 'function') ? jwlView : null;

    // Get entire document content
    const content = activeEditor.getValue();
    const lines = content.split('\n');
    let processedCount = 0;

    // Show processing notice
    const loadingNotice = new Notice(Lang.batchProcessing, 0);

    try {
      // Collect all references to process
      const allReferences = [];
      // We first collect scripture ranges so we can ignore any publication matches
      // that are actually just substrings inside a scripture reference.
      // Example: "1 Tim 1:2" can accidentally produce a publication match "Tim 1".
      const scriptureRanges = [];

      // 1. Find scripture references (e.g., "Rom 1:20", "Рим 1:20")
      const scriptureRegex = new RegExp(Config.scriptureRegex.source, 'gimu');
      let match;
      while ((match = scriptureRegex.exec(content)) !== null) {
        // Skip if already a link (has ] or </a> at the end) or inside callout
        if (!match[5] && !this._isInsideCallout(content, match.index)) {
          scriptureRanges.push({ start: match.index, end: match.index + match[0].length });
          allReferences.push({
            type: 'scripture',
            full: match[0],
            text: match[1],
            index: match.index,
            line: this._getLineNumber(content, match.index)
          });
        }
      }

      // Overlap test: [start,end) intersects any scripture range.
      const overlapsScripture = (start, end) => scriptureRanges.some((r) => start < r.end && end > r.start);

      // 2. Find Watchtower references in any supported format (see WatchtowerRegex)
      const watchtowerRegex = new RegExp(WatchtowerRegex.source, 'gi');
      while ((match = watchtowerRegex.exec(content)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (!this._isInsideCallout(content, match.index) && !overlapsScripture(start, end)) {
          allReferences.push({
            type: 'publication',
            full: match[0],
            text: match[0],
            index: match.index,
            line: this._getLineNumber(content, match.index)
          });
        }
      }

      // 4. Find other publication references (od 15 par. 3, it-1 332)
      const otherPubRegex = new RegExp(Config.otherPubRegex.source, 'g');
      while ((match = otherPubRegex.exec(content)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (!isLikelyPublication(match)) continue; // skip plain text like "on 5" or "in 2024"
        if (!this._isInsideCallout(content, match.index) && !overlapsScripture(start, end)) {
          allReferences.push({
            type: 'publication',
            full: match[0],
            text: match[0],
            index: match.index,
            line: this._getLineNumber(content, match.index)
          });
        }
      }

      // Sort by line number (process from end to beginning to preserve indices)
      allReferences.sort((a, b) => b.line - a.line);

      // Remove duplicates (same line)
      const uniqueRefs = [];
      const seenLines = new Set();
      for (const ref of allReferences) {
        const key = `${ref.line}-${ref.text}`;
        if (!seenLines.has(key)) {
          seenLines.add(key);
          uniqueRefs.push(ref);
        }
      }

      // Process each reference
      for (const ref of uniqueRefs) {
        try {
          let citation = '';

          if (ref.type === 'scripture') {
            // Cite verse as callout
            citation = await this._fetchBibleCitation(ref.text, historyView, 0, Cmd.citeVerseCallout);
          } else {
            // Cite publication lookup
            // Auto-format the reference first
            let formattedText = normalizeInput(ref.text);
            formattedText = autoFormatRussianWatchtower(formattedText);
            formattedText = autoFormatEnglishWatchtower(formattedText);
            formattedText = autoFormatSpanishWatchtower(formattedText);
            formattedText = autoFormatOtherWatchtower(formattedText);

            // In batch mode we always insert callout citations (both verses and publications)
            // so the output is consistent and easy to scan.
            citation = await this._fetchPublicationCitation(formattedText, historyView, Cmd.citeVerseCallout);
          }

          if (citation && citation !== ref.text) {
            // Remove the first line (original reference) from citation since it's already in the document
            const citationLines = citation.split('\n');
            if (citationLines.length > 1) {
              // Skip first line which is the original reference
              citation = citationLines.slice(1).join('\n');
            }

            // Insert citation after the line containing the reference
            const lineIndex = ref.line;
            if (lineIndex >= 0 && lineIndex < lines.length) {
              // Add citation after the current line
              lines[lineIndex] = lines[lineIndex] + '\n' + citation;
              processedCount++;
            }
          }
        } catch (err) {
          console.error(`Error processing reference "${ref.text}":`, err);
        }
      }

      loadingNotice.hide();

      // Apply changes if any
      if (processedCount > 0) {
        const newContent = lines.join('\n');
        const lastLine = activeEditor.lastLine();
        const lastLineLength = activeEditor.getLine(lastLine).length;
        activeEditor.replaceRange(
          newContent,
          { line: 0, ch: 0 },
          { line: lastLine, ch: lastLineLength }
        );
        new Notice(Lang.batchComplete.replace('{count}', processedCount), 3000);
      } else {
        new Notice(Lang.batchNoLinks, 3000);
      }

    } catch (error) {
      loadingNotice.hide();
      console.error('Batch convert error:', error);
      new Notice(`Error: ${error.message}`, 5000);
    }
  }

  /**
   * Check if position is inside a callout block
   * @param {string} content - Full document content
   * @param {number} index - Position to check
   * @returns {boolean}
   */
  _isInsideCallout(content, index) {
    // Find the start of the line containing this index
    let lineStart = content.lastIndexOf('\n', index - 1) + 1;
    let lineEnd = content.indexOf('\n', index);
    if (lineEnd === -1) lineEnd = content.length;

    const line = content.substring(lineStart, lineEnd);

    // Check if line starts with callout marker or is part of callout
    return line.trimStart().startsWith('>') || line.trimStart().startsWith('[!');
  }

  /**
   * Get line number for a given index in content
   * @param {string} content - Full document content
   * @param {number} index - Position in content
   * @returns {number} - Line number (0-indexed)
   */
  _getLineNumber(content, index) {
    const substring = content.substring(0, index);
    return (substring.match(/\n/g) || []).length;
  }

  /**
   * Fetch publication citation - unified method for batch processing
   * @param {string} input - Publication reference
   * @param {Object} view - View for history
   * @param {Cmd} command - Command type
   * @returns {Promise<string>} - Citation text
   */
  async _fetchPublicationCitation(input, view, command) {
    input = normalizeInput(input);
    if (parseWatchtowerReference(input)) {
      return await this._fetchWatchtowerCitation(input, view, command);
    }
    if (matchOtherPublication(input)) {
      return await this._fetchOtherPublicationCitation(input, view, command);
    }
    return await this._fetchLookupCitation(input, view);
  }


  /**
   * KEY FEATURE
   * Editing/Preview View only:
   * Cite publication lookup reference, returns all pages in the reference, below
   * Cite scripture reference in full below or just a snippet inline, adds a JWL link
   * Cite paragraph or snippet from JW.Org Finder or WOL url,
   *    with correct publication navigation title
   * Add title only: an MD link with correct navigation title + url
   * @param {Editor} editor
   * @param {Cmd} command
   * @param {number} [pars="0"] *Number of paragraphs to cite (Use 0 for link only)
   */
  async insertCitation(editor, command, pars = 0) {
    /** @type {Notice} */
    let loadingNotice;
    const activeEditor = this.confirmEditor(editor);
    if (!activeEditor) return;
    let { selection, caret, line } = this._getEditorSelection(activeEditor);
    if (selection) {
      selection = selection.trim();

      // Normalize common spacing/punctuation variants before any parsing/auto-formatting
      selection = normalizeInput(selection);

      // Auto-format Watchtower publications with month names
      const originalSelection = selection;
      selection = autoFormatRussianWatchtower(selection);
      selection = autoFormatEnglishWatchtower(selection);
      selection = autoFormatSpanishWatchtower(selection);
      selection = autoFormatOtherWatchtower(selection);

      if (selection !== originalSelection) {
        debugLog('Auto-formatted Watchtower publication:', originalSelection, '→', selection);
        // Update the editor with the formatted text
        activeEditor.replaceSelection(selection);
        // Update the selection for further processing
        const newSelection = this._getEditorSelection(activeEditor);
        selection = newSelection.selection.trim();
      }

      loadingNotice = new Notice(`${Lang.loadingCitation} ${selection}`); // remain open until we complete
      const view = await this.getView();
      let job;
      switch (command) {
        case Cmd.citeVerse:
        case Cmd.citeVerseCallout:
          if (isPublicationReference(selection)) {
            job = this._fetchPublicationCitation(selection, view, command);
          } else if (this.settings.dualModeVerses) {
            // Dual mode: Bible verses in the two configured languages
            job = this._fetchDualBibleCitation(selection, view, caret, command);
          } else {
            // Scripture reference → verse citation (+ JW Library link)
            job = this._fetchBibleCitation(selection, view, caret, command);
          }
          break;
        case Cmd.citeParagraph:
        case Cmd.citeParagraphCallout:
        case Cmd.addLinkTitle:
          // jw.org finder / wol.jw.org URL → paragraph citation
          job = this._fetchParagraphCitation(selection, view, caret, command, pars);
          break;
        case Cmd.citePublicationLookup:
          job = this.settings.dualModePublications
            ? this._fetchDualPublicationCitation(selection, view, command)
            : this._fetchPublicationCitation(selection, view, command);
          break;
      }
      job?.then(replaceEditorSelection, handleCitationError);
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }

    function replaceEditorSelection(output) {
      // Any errors will be part of the result
      if (typeof output !== 'string') {
        loadingNotice?.hide();
        return;
      }
      activeEditor.replaceSelection(output);
      // try to select the original reference, first line (helps user delete it quickly if needed)
      const last = activeEditor.getLine(line).length;
      activeEditor.setSelection({ line: line, ch: 0 }, { line: line, ch: last });
      loadingNotice.hide();
    }

    function handleCitationError(error) {
      console.error('JWL Linker: citation failed', error);
      loadingNotice?.hide();
      new Notice(Lang.onlineLookupFailed, Config.delay);
    }
  }

  /**
   * Check if there is an active editor, and attempt to return it
   * @param {Editor} editor
   * @returns {Editor}
   */
  confirmEditor(editor) {
    const activeEditor = editor ?? this.app.workspace.activeEditor?.editor;
    if (!activeEditor) {
      new Notice(Lang.noEditor, Config.delay);
    }
    return activeEditor;
  }


  /**
   * Get a valid view reference even if deferred, so that we can add to the history
   * Does not reveal the leaf as the user might be using a different one
   * @returns {View|null}
   */
  async getView() {
    const leaf = this.app.workspace.getLeavesOfType(JWL_LINKER_VIEW).first();
    if (leaf) {
      await leaf.loadIfDeferred(); // don't reveal in case user has another sidebar open
      if (leaf && leaf.view instanceof JWLLinkerView) {
        return leaf.view;
      }
    }
    return null;
  }

  /**
   * Show the dropdown menu just below the caret
   * @param {Editor} editor
   * @param {Menu} menu
   * @returns {void}
   */
  showMenu(editor) {
    // Is the menu already active?
    if (document.querySelector(`.menu.${this.menuClass}`)) return;

    if (!editor) {
      new Notice(Lang.noEditor, Config.delay);
      return;
    }
    // Rebuilt each time so check marks and the target editor are current
    const menu = this.buildMenu(undefined, editor);
    const cursor = editor.getCursor('from');
    const offset = editor.posToOffset(cursor);
    const coords = editor.cm.coordsAtPos(offset);
    menu.showAtPosition({
      x: coords.right,
      y: coords.top + 20,
    });
  }

  /**
   * Prepare the dropdown menu. Each menu item calls its command counterpart
   * @param {*} submenu submenu instance of a parent menu; if empty create new menu
   * @returns New menu ready to use
   */
  buildMenu(submenu = undefined, editor = undefined) {
    /** @type {Menu} */
    const menu = submenu ? submenu : new Menu();
    // this class is needed to identify if the menu is already open
    menu.dom.addClass(this.menuClass);
    // no title on submenus
    if (!submenu) {
      menu.addItem((item) => {
        item.setTitle(this.MenuName.title);
        item.setIcon(this.MenuName.icon);
        item.setIsLabel(true);
      });
      menu.addSeparator();
    }
    for (const cmd of this.MenuCommands) {
      menu.addItem((item) => {
        item.setTitle(cmd.text);
        item.setIcon(cmd.icon);
        item.onClick(() => cmd.fn(editor ?? this.app.workspace.activeEditor?.editor));
      });
      if (cmd.sep ?? null) menu.addSeparator();
    }
    // Select no. of paragraphs to cite
    menu.addItem((item) => {
      const titleEl = createDiv({ text: this.MenuParaCount.text });
      titleEl.createSpan({ text: this.settings.paraCount });
      item.setTitle(titleEl);
      item.setIcon(this.MenuParaCount.icon);
      const submenu = item.setSubmenu();
      for (const [key, value] of Object.entries(Lang.paragraphOptions)) {
        submenu.addItem((item) => {
          item.setTitle(value);
          item.setIcon('pilcrow');
          item.setChecked(Number(key) === this.settings.paraCount);
          item.onClick(() => {
            this.settings.paraCount = Number(value);
            this.saveSettings();
            // TODO keep menu open (complicated...)
          });
        });
      }
    });
    // Toggle citation link on/off
    menu.addItem((item) => {
      item.setTitle(this.MenuCitationLink.text);
      item.setIcon(this.MenuCitationLink.icon);
      item.setChecked(this.settings.citationLink);
      item.onClick(() => {
        this.settings.citationLink = !this.settings.citationLink;
        this.saveSettings();
      });
    });
    return menu;
  }

  MenuName = {
    id: 'openJWLLinkerMenu',
    text: 'JWL Linker',
    title: 'JWL Linker',
    icon: 'gem',
  };

  get MenuCommands() {
    return [
      {
        id: Cmd.citeVerse,
        text: Lang.menuCiteVerses,
        icon: 'whole-word',
        fn: (editor) => this.insertCitation(editor, Cmd.citeVerse),
      },
      {
        id: Cmd.citeVerseCallout,
        text: Lang.menuCiteVersesCallout,
        icon: 'book-open',
        fn: (editor) => this.insertCitation(editor, Cmd.citeVerseCallout),
        sep: true,
      },
      {
        id: Cmd.citeParagraph,
        text: Lang.menuCiteJworgUrl,
        icon: 'whole-word',
        fn: (editor) => this.insertCitation(editor, Cmd.citeParagraph, this.settings.paraCount || 1),
      },
      {
        id: `${Cmd.citeParagraphCallout}`,
        text: Lang.menuCiteJworgCallout,
        icon: 'lucide-panel-top-open',
        fn: (editor) => this.insertCitation(editor, Cmd.citeParagraphCallout, this.settings.paraCount || 1),
        sep: true,
      },
      {
        id: Cmd.citePublicationLookup,
        text: Lang.menuCitePublication,
        icon: 'reading-glasses',
        fn: (editor) => this.insertCitation(editor, Cmd.citePublicationLookup),
      },
      {
        id: Cmd.openSelectedinWOL,
        text: Lang.menuLookupWOL,
        icon: 'search',
        fn: (editor) => this.openSelectedInWOL(editor),
      },
      {
        id: Cmd.citeSelectedText,
        text: Lang.menuCiteSelectedText,
        icon: 'quote',
        fn: (editor) => this.citeSelectedText(editor),
        sep: true,
      },
      {
        id: Cmd.addLinkTitle,
        text: Lang.menuAddTitle,
        icon: 'link',
        fn: (editor) => this.insertCitation(editor, Cmd.addLinkTitle),
      },
      {
        id: Cmd.convertScriptureToJWLibrary,
        text: Lang.menuConvertScripture,
        icon: 'library',
        fn: (editor) => this.linkToJWLibrary(editor, Cmd.convertScriptureToJWLibrary),
      },
      {
        id: Cmd.convertWebToJWLibrary,
        text: Lang.menuConvertJworg,
        icon: 'library',
        fn: (editor) => this.linkToJWLibrary(editor, Cmd.convertWebToJWLibrary),
      },
      {
        id: Cmd.openScriptureInJWLibrary,
        text: Lang.menuOpenJWLibrary,
        icon: 'external-link',
        fn: (editor) => this.openInJWLibrary(editor),
        sep: true,
      },
      {
        id: Cmd.batchConvertAll,
        text: Lang.menuBatchConvert,
        icon: 'layers',
        fn: (editor) => this.batchConvertAllLinks(editor),
      },
    ];
  }

  get MenuParaCount() {
    return {
      text: Lang.menuParaCount,
      icon: 'pilcrow',
    };
  }

  get MenuCitationLink() {
    return {
      text: Lang.menuCitationLink,
      icon: 'links-going-out',
    };
  }

  /* 🛠️ INTERNAL FUNCTIONS */

  /**
   * In the active editor:
   * (1) the current selection if available, defaults to current line
   * (2) sets selection to current line and returns it
   * Assumes an editor is active!
   * @param {Editor} editor
   * @param {boolean} [setSelection=true] should we select the entire line in the editor?
   * @param {boolean} [entireLine=false] select and return entire line
   * @returns {{ string, number, number }} current selection, relative caret position, current line no.
   */
  _getEditorSelection(editor, setSelection = true, entireLine = false) {
    let selection;
    let caret;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    if (!entireLine && editor.somethingSelected()) {
      // either (1) current selection
      // No caret position when user has explicitly selected a section of text/verse
      // caret = cursor.ch + line.indexOf(selection);
      selection = editor.getSelection();
    } else {
      // or (2) current line (select entire line)
      const from = { line: cursor.line, ch: 0 };
      const to = { line: cursor.line, ch: line.length };
      selection = editor.getRange(from, to);
      if (setSelection) {
        editor.setSelection(from, to);
      }
      caret = cursor.ch;
    }
    return { selection, caret, line: cursor.line };
  }

  /**
   * Swaps all jw.org Finder-style and wol.jw.org urls in input text for JW Library app urls
   * @param {string} input
   * @return {{output: string, changed: boolean}} Updated text with swapped links, changed is true if at least one url changed
   */
  _convertWebToJWLibrary(input) {
    let output = input;
    let changed = false;
    const links = this._getLinksInText(input);
    for (const link of links) {
      const mdLink = `[${link.title}](${Config.jwlFinder}wtlocale=${link.wtlocale}&docid=${link.docId}&par=${link.parId})`;
      output = output.replace(link.whole, mdLink);
      changed = true;
    }
    return { output, changed };
  }

  /**
   * Replaces ALL valid scripture references in input text with links
   * Result depends on DisplayType:
   * 1. JW Library MD links []()
   * 2. Href links
   * 3. Plain url
   * @param {string} input
   * @param {DisplayType} displayType
   * @return {{output: string, changed: boolean}}
   */
  _convertScriptureToJWLibrary(input, displayType, caret = undefined) {
    let output = input;
    let changed = false; // true if at least one scripture reference was recognised

    // HACK 🚧 references in headings and callouts break formatting...
    // Only accept text elements for now
    const isTextElem = !(input.startsWith('<h') || input.startsWith('<div data'));

    if (isTextElem) {
      /** @type {TReference} */
      for (const reference of this._parseScriptureLinks(input, displayType, this.settings.spaceAfterPunct, caret)) {
        if (!reference.isLinkAlready) {
          let referenceMarkup = '';
          /** @type {TPassage} */
          for (const passage of reference.passages) {
            let markup = passage.display;
            if (passage.link) {
              if (displayType === DisplayType.md) {
                markup = `[${passage.display}](${passage.link.jwlib})`;
              } else if (displayType === DisplayType.href) {
                markup = `<a href="${passage.link.jwlib}" title="${passage.link.jwlib}">${passage.display}</a>`; // make the target URL visible on hover
              } else if (displayType === DisplayType.open) {
                markup = passage.link.jwlib;
              }
            }
            referenceMarkup += passage.delimiter + markup;
          }
          if (displayType === DisplayType.open) {
            output = referenceMarkup;
          } else {
            output = output.replace(reference.original, referenceMarkup);
          }
          changed = true;
        }
      }
    }
    return { output, changed };
  }

  /**
   * Provides a sanitized, formatted bible citation on the line below the scripture reference
   * from jw.org html page, could include a JW Library link (see settings.citationLink)
   * @param {string} input Text containing the scripture (current line | current selection)
   * @param {View} view
   * @param {number} caret Current caret position in the input if no selection
   * @param {Cmd} command
   * @returns {string}
   */
  async _fetchBibleCitation(input, view, caret, command) {
    /** @type {TReferences} */
    const references = this._parseScriptureLinks(input, DisplayType.cite, this.settings.spaceAfterPunct, caret);
    if (references && references.length > 0) {
      const output = [];
      output.push(input); // keep original input on first line
      for (const reference of references) {
        let dom = ''; // cache the dom if possible
        let prevChapter = '';
        // In callout mode we want to keep comma-separated verses from the same chapter
        // inside a single callout block (e.g. "Пс 143:5, 10"), instead of producing
        // multiple separate callouts.
        let calloutBlock = null;
        let calloutChapter = '';
        const flushCalloutBlock = () => {
          if (!calloutBlock) return;
          const combinedText = calloutBlock.texts.join('');
          const citation = fillCitationTemplate(calloutBlock.template, calloutBlock.title, combinedText);
          output.push(citation);
          calloutBlock = null;
          calloutChapter = '';
        };
        for (const passage of reference.passages) {
          if (passage.error === OutputError.invalidScripture) {
            flushCalloutBlock();
            output.push(`${passage.displayFull} | ${Lang[OutputError.invalidScripture]}`);
            continue;
          }

          // If we are in callout mode and chapter changes, flush previous block.
          if (command === Cmd.citeVerseCallout && calloutBlock && passage.chapter !== calloutChapter) {
            flushCalloutBlock();
          }

          let title = passage.displayFull; // default
          if (this.settings.citationLink) {
            title = `[${title}](${passage.link.jwlib})`;
          }
          let verses = [];
          const cache = view?.getFromHistory?.(passage.link.jwlib); // try the cache first
          if (cache) {
            verses = cache.content;
          } else {
            // reuse the previous dom if the chapter is the same
            if (passage.chapter !== prevChapter) {
              dom = await this._fetchDOM(passage.link.jworg);
              prevChapter = passage.chapter;
            }
            for (const id of passage.link.parIds) {
              const follows = verses.length > 0;
              let clean = this._getElementAsText(dom, `#v${id}`, TargetType.scripture, follows);
              clean = this._boldInitialNumber(clean);
              verses.push(clean);
            }
          }
          // Only a real result counts: an empty array or empty strings mean the lookup failed
          if (verses.some((verse) => verse.trim() !== '')) {
            view?.addToHistory?.(passage.link.jwlib, title, verses);
            view?.showHistory?.();
            const text = verses.join('');
            let template = '';
            if (command === Cmd.citeVerse) {
              template = this.settings.verseTemplate;
              const citation = fillCitationTemplate(template, title, text);
              output.push(citation);
            } else if (command === Cmd.citeVerseCallout) {
              template = this.settings.verseCalloutTemplate;

              // Callout header in the language of the reference ("BIBLE" → "BÍBLIA", "BIBEL", ...)
              template = translateBibleLabel(template, reference.lang);

              // Start or extend a combined callout for the same chapter
              if (!calloutBlock) {
                calloutChapter = passage.chapter;
                calloutBlock = { template, title, texts: [text] };
              } else {
                calloutBlock.texts.push(text);
              }
            }
          } else {
            flushCalloutBlock();
            output.push(`${passage.displayFull} | ${Lang[OutputError.onlineLookupFailed]}`);
          }
        }

        flushCalloutBlock();
      }
      return output.join('\n');
    }
    return `${input} | ${Lang[OutputError.invalidScripture]}`;
  }

  /**
   * Fetch Bible citation in dual mode using configured languages
   * @param {string} input Text containing the scripture (current line | current selection)
   * @param {View} view
   * @param {number} caret Current caret position in the input if no selection
   * @param {Cmd} command
   * @returns {string}
   */
  async _fetchDualBibleCitation(input, view, caret, command) {
    debugLog('Fetching dual Bible citation for:', input);

    // Get configured languages
    const { firstLang, secondLang } = this._getDualLanguages();
    debugLog('Dual mode languages for Bible:', { firstLang, secondLang });

    // Language code to WOL language mapping
    const langToWol = {
      'en': { code: 'EN', wolPath: 'en/wol/b/r1/lp-e/nwtsty' },
      'ru': { code: 'RU', wolPath: 'ru/wol/b/r2/lp-u/nwt' },
      'es': { code: 'ES', wolPath: 'es/wol/b/r4/lp-s/nwtsty' }
    };

    /** @type {TReferences} */
    const references = this._parseScriptureLinks(input, DisplayType.cite, this.settings.spaceAfterPunct, caret);
    if (!references) {
      return `${input} | ${Lang[OutputError.invalidScripture]}`;
    }

    const output = [];
    output.push(input); // keep original input on first line

    for (const reference of references) {
      for (const passage of reference.passages) {
        if (passage.error === OutputError.invalidScripture) {
          output.push(`${passage.displayFull} | ${Lang[OutputError.invalidScripture]}`);
          continue;
        }

        // Fetch verses for first language
        const firstLangResult = await this._fetchBibleVerseByLanguage(passage, firstLang, langToWol, view, command);

        // Fetch verses for second language
        const secondLangResult = await this._fetchBibleVerseByLanguage(passage, secondLang, langToWol, view, command);

        // Format dual output
        output.push(this._getLanguageLabel(firstLang));
        output.push(firstLangResult);

        output.push('');
        output.push(this._getLanguageLabel(secondLang));
        output.push(secondLangResult);
      }
    }
    return output.join('\n');
  }

  /**
   * Fetch Bible verse for a specific language
   * @param {Object} passage - Parsed passage object
   * @param {string} langCode - Language code: 'en', 'ru', 'es'
   * @param {Object} langToWol - Language to WOL mapping (unused, kept for compatibility)
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchBibleVerseByLanguage(passage, langCode, langToWol, view, command) {
    // Map langCode to uppercase language code used by getFinderUrl
    const upperLang = LanguageInfo[langCode.toUpperCase()] ? langCode.toUpperCase() : 'EN';

    // Build verse ID from parIds
    const first = passage.link.parIds[0];
    const last = passage.link.parIds[passage.link.parIds.length - 1];
    let id = first;
    if (last !== first) {
      id = `${first}-${last}`;
    }

    // Get finder URL for this language
    const finderUrl = getFinderUrl(upperLang);
    const jworgUrl = `${finderUrl}${Config.urlParam}${id}`;

    // Get JW Library link with correct locale
    const jwlLocale = getJWLibraryLocale(upperLang);
    const jwlibUrl = `${Config.jwlFinder}${Config.urlParam}${id}${jwlLocale}`;

    debugLog(`Fetching Bible verse for ${langCode}:`, jworgUrl);

    try {
      const dom = await this._fetchDOM(jworgUrl);
      if (!dom) {
        console.error(`Failed to fetch DOM for ${langCode}`);
        return `[${langCode}] ${Lang[OutputError.onlineLookupFailed]}`;
      }

      const verses = [];
      for (const parId of passage.link.parIds) {
        const follows = verses.length > 0;
        let clean = this._getElementAsText(dom, `#v${parId}`, TargetType.scripture, follows);
        if (clean) {
          clean = this._boldInitialNumber(clean);
          verses.push(clean);
        }
      }

      if (verses.length === 0) {
        console.error(`No verses found for ${langCode}`);
        return `[${langCode}] ${Lang[OutputError.onlineLookupFailed]}`;
      }

      // Create title with link - use language-specific JW Library link
      // and the book name in this language ("John 3:16" → "João 3:16")
      let title = localizeBookName(passage.displayFull, Math.floor(Number(first) / 1000000), upperLang);
      if (this.settings.citationLink) {
        title = `[${title}](${jwlibUrl})`;
      }

      // Add to history
      view?.addToHistory?.(`${jwlibUrl}_${langCode}`, title, verses);
      view?.showHistory?.();

      const text = verses.join('');
      let template = '';
      if (command === Cmd.citeVerse) {
        template = this.settings.verseTemplate;
      } else if (command === Cmd.citeVerseCallout) {
        template = this.settings.verseCalloutTemplate;

        // Callout header in this language ("BIBLE" → "BÍBLIA", "BIBEL", ...)
        template = translateBibleLabel(template, langCode.toUpperCase());
      }

      return fillCitationTemplate(template, title, text);
    } catch (error) {
      console.error(`Error fetching Bible verse for ${langCode}:`, error);
      return `[${langCode}] ${Lang[OutputError.onlineLookupFailed]}`;
    }
  }

  /**
   * Citation language for a publication reference: the fixed "Citation language" setting,
   * or the language the reference was typed in
   * @param {string} detected - language implied by the reference format (EN, RU, ES)
   * @returns {string} EN | RU | ES
   */
  _publicationLanguage(detected) {
    const fixed = Languages[this.settings?.lang];
    if (fixed && PubLangs[fixed]) return fixed;
    return PubLangs[detected] ? detected : 'EN';
  }

  /**
   * Fetch paragraphs from the WOL lookup page and format them with the citation template
   * @param {{lang: string, queries: string[], title: string, command: string, view: Object}} options
   *   queries: one WOL search per paragraph (see paragraphQueries)
   * @returns {Promise<string>} the formatted citation (without the original reference line)
   */
  async _citeFromWol({ lang, queries, title, command, view }) {
    const L = PubLangs[lang] ?? PubLangs.EN;
    const lookup = getConfigForLanguage(lang).wolLookup;
    const urls = queries.map((query) => `${lookup}${encodeURIComponent(query)}`);

    const texts = [];
    for (const url of urls) {
      let text = '';
      const cache = view?.getFromHistory?.(url);
      if (cache) {
        text = cache.content.join('');
      } else {
        const dom = await this._fetchDOM(url);
        if (dom) {
          text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
          if (text) text = this._boldInitialNumber(text);
        }
      }
      if (text) texts.push(text);
    }

    const linkedTitle = this.settings.citationLink ? `[${title}](${urls[0]})` : title;
    let text;
    if (texts.length > 0) {
      text = texts.join('\n');
      view?.addToHistory?.(urls.join(' '), linkedTitle, [text]);
      view?.showHistory?.();
    } else {
      text = `${L.notFound} [${queries[0]}](${urls[0]})`;
    }

    let template = command === Cmd.citeVerse ? this.settings.pubTemplate : this.settings.pubCalloutTemplate;
    template = template.replace(/ПУБЛ\.|PUBL\.|PUB\./, L.label);
    // A callout template needs every line inside the callout (see fillCitationTemplate)
    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      template = `> ${template.trimStart()}`;
    }
    if (!template.trimStart().startsWith('>')) {
      text = text.replace(/\s*\n\s*/g, ' ');
    }
    return fillCitationTemplate(template, linkedTitle, text);
  }

  /**
   * Cite a Watchtower reference (any supported format, see WatchtowerRegex)
   * @param {string} input - text containing the reference
   * @param {View} view - view for history
   * @param {Cmd} command
   * @returns {Promise<string>}
   */
  async _fetchWatchtowerCitation(input, view, command) {
    const ref = parseWatchtowerReference(input);
    if (!ref) return `${input} | ${Lang.invalidPublication}`;
    const lang = this._publicationLanguage(ref.sourceLang);
    const availability = checkPublicationAvailability('w', lang, toFullYear(ref.year));
    if (availability.isOffline) return `${input}\n${availability.message}`;
    const citation = await this._citeFromWol({
      lang,
      queries: paragraphQueries(ref, (r) => formatWatchtowerQuery(r, lang)),
      title: formatWatchtowerTitle(ref, lang),
      command,
      view,
    });
    return `${input}\n${citation}`;
  }

  /**
   * Cite another publication (od, it-1, cl, si, ...)
   * @param {string} input - text containing the reference
   * @param {View} view - view for history
   * @param {Cmd} command
   * @returns {Promise<string>}
   */
  async _fetchOtherPublicationCitation(input, view, command) {
    const ref = parseOtherPublicationReference(input);
    if (!ref) return `${input} | ${Lang.invalidPublication}`;
    const lang = this._publicationLanguage(ref.sourceLang);
    const availability = checkPublicationAvailability(ref.pubCode, lang);
    if (availability.isOffline) return `${input}\n${availability.message}`;
    const citation = await this._citeFromWol({
      lang,
      queries: paragraphQueries(ref, (r) => formatOtherPublicationQuery(r, lang)),
      title: formatOtherPublicationTitle(ref, lang),
      command,
      view,
    });
    return `${input}\n${citation}`;
  }

  /**
   * Cite a publication in the two configured dual-mode languages
   * @param {string} input - publication reference (any language format)
   * @param {View} view - view for history
   * @param {Cmd} command
   * @returns {Promise<string>}
   */
  async _fetchDualPublicationCitation(input, view, command) {
    input = normalizeInput(input);
    const citeCommand = command === Cmd.citeVerse ? Cmd.citeVerse : Cmd.citeVerseCallout;
    const watchtower = parseWatchtowerReference(input);
    const other = watchtower ? null : parseOtherPublicationReference(input);
    if (!watchtower && !other) return `${input} | ${Lang.invalidPublication}`;

    const { firstLang, secondLang } = this._getDualLanguages();
    const output = [input];
    for (const [i, langCode] of [firstLang, secondLang].entries()) {
      const lang = langCode.toUpperCase();
      if (i > 0) output.push('');
      output.push(this._getLanguageLabel(langCode));
      const availability = watchtower
        ? checkPublicationAvailability('w', lang, toFullYear(watchtower.year))
        : checkPublicationAvailability(other.pubCode, lang);
      if (availability.isOffline) {
        output.push(availability.message);
        continue;
      }
      output.push(await this._citeFromWol({
        lang,
        queries: watchtower
          ? paragraphQueries(watchtower, (r) => formatWatchtowerQuery(r, lang))
          : paragraphQueries(other, (r) => formatOtherPublicationQuery(r, lang)),
        title: watchtower ? formatWatchtowerTitle(watchtower, lang) : formatOtherPublicationTitle(other, lang),
        command: citeCommand,
        view,
      }));
    }
    return output.join('\n');
  }

  /**
   * Inserts a sanitized, formatted paragraph citation below a valid wol.jw.org or finder url
   * @param {string} input text containing a jw.org/finder or wol.jw.org URL
   * @param {View} view
   * @param {number} caret position of the caret in the input
   * @param {Cmd} command full paragraph, inline or title only
   * @param {number} pars number of paragraphs to extract (the "paragraph count" setting; a range link overrides it)
   * @returns {string}
   */
  async _fetchParagraphCitation(input, view, caret, command, pars) {
    const match = this._getLinkAtCaret(input, caret);
    if (!match || !isValidUrl(match.url)) {
      return `${input} | ${Lang[OutputError.invalidUrl]}`;
    }
    // A link to a paragraph range (#h=5-7, par=5-7) cites the whole range
    if (match.parEnd && Number(match.parEnd) > Number(match.parId)) {
      pars = Math.min(Number(match.parEnd) - Number(match.parId) + 1, MaxCitedParagraphs);
    }
    let link = '';
    let content = [];
    const cache = view?.getFromHistory?.(match.url, pars);
    if (cache) {
      link = cache.link;
      content = cache.content;
    } else {
      const dom = await this._fetchDOM(match.url);
      if (dom) {
        const pageTitle = this._getElementAsText(dom, 'title', TargetType.jwonline);
        const pageNav = this._getElementAsText(dom, '#publicationNavigation', TargetType.pubNav);
        const display = pageNav || pageTitle;
        link = `[${display}](${match.url})`;
        // Look for a wol/finder paragraph html #id
        // Title link only has no content
        if (command !== Cmd.addLinkTitle && match.parId) {
          for (let i = 0; i < pars; i++) {
            let par = this._getElementAsText(dom, `#p${Number(match.parId) + i}`, TargetType.jwonline);
            if (par.trim() === '') {
              par = Lang.emptyPara;
            }
            content.push(par);
          }
        }
      }
    }
    if (link) {
      view?.addToHistory?.(match.url, link, content, pars);
      view?.showHistory?.();
      let output = '';
      // replace the raw url to a full MD link
      if (command === Cmd.addLinkTitle) {
        output = input.replace(match.whole, link);
      } else {
        let template;
        let text = '';
        if (command === Cmd.citeParagraph) {
          template = this.settings.pubTemplate;
          text = content.join('');
        } else if (command === Cmd.citeParagraphCallout) {
          template = this.settings.pubCalloutTemplate;
          const glue = template[0] === '>' ? '\n>\n>' : '\n';
          text = content.join(glue);
          text = this._boldInitialNumber(text);
        }
        const citation = fillCitationTemplate(template, link, text);
        output = `${input}\n${citation}`;
      }
      return output;
    }
    return `${input} | ${Lang[OutputError.onlineLookupFailed]}`;
  }

  /**
   * Fetch wol.jw.org pub references (aka: 'publication reference lookup')
   * @param {string} input A valid WT style publication reference (copy of selection)
   * @param {View} view For history functions
   * @return {{string}, {boolean}, {OutputError}}
   */
  async _fetchLookupCitation(input, view) {
    // Convert WT pub lookup into WT search url syntax
    const lang = this._resolveTextLanguage(input);
    const lookupUrl = getConfigForLanguage(lang).wolLookup + encodeURIComponent(input).replace(/%20/g, '+');
    let link = '';
    let content = [];
    let text = '';
    const cache = view?.getFromHistory?.(lookupUrl); // try the cache first
    if (cache) {
      link = cache.link;
      content = cache.content;
    } else {
      const dom = await this._fetchDOM(lookupUrl);
      if (dom) {
        const query = this._getElementAsText(dom, '.searchText', TargetType.jwonline);
        const display = this._getElementAsText(dom, '.cardLine1', TargetType.jwonline);
        link = `[${query} | ${display}](${lookupUrl})`; // (hard coded formatting)
        text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
        content.push(text);
      }
    }
    if (link) {
      view?.addToHistory?.(lookupUrl, link, content);
      view?.showHistory?.();
      text = content.join('');
      text = this._boldInitialNumber(text);
      let template = this.settings.pubCalloutTemplate;
      // For non-Russian publications, use "PUB." instead of "ПУБЛ."
      if (lang !== 'RU') template = template.replace('ПУБЛ.', 'PUB.');
      // Check if template is actually a callout (user editable):
      // If so all lines need to be part of the callout syntax
      if (template[0] === '>') {
        text = text.replace(/^./gm, '>$&').substring(1);
      }
      const citation = fillCitationTemplate(template, link, text);
      // Insert the citation below the lookup query (hard coded formatting)
      const output = `${input}\n${citation}`;
      return output;
    }
    return Lang[OutputError.onlineLookupFailed];
  }

  /**
   * Fetch the entire DOM from a web page url
   * @param {string} url
   * @returns {Promise<Document|Null>}
   */
  async _fetchDOM(url) {
    try {
      const res = await requestUrl(url);
      if (res.status === 200) {
        return new DOMParser().parseFromString(res.text, 'text/html');
      }
    } catch (error) {
      //// biome-ignore lint/suspicious/noConsoleLog: ⚠️
      debugLog(error);
    }
    return null;
  }

  /**
   * Make paragraph number bold, e.g. **4**
   * @param {*} text Verse or paragraph from WT online
   * @returns {string}
   */
  _boldInitialNumber(text) {
    if (this.settings.boldInitialNum) {
      return text.replace(Config.initialNumRegex, '$1**$2** ');
    }
    return text;
  }

  /**
   * Extract a specific HTML element from the DOM based on the selector
   * Convert to plain text and remove markup and unneeded character depending on type
   * (Try to keep all this messy html cleanup in one place)
   * Target types:
   * 1. scripture: from /finder?, need to add line breaks, remove &nbsp;
   * 2. jwonline: paragraph or article, linebreaks? etc.
   * 3. pubNav: the navigation title for a specific page location
   * Returns plain text string
   * @param {Document} dom  Entire DOM for a webpage url
   * @param {string} selector Valid html selector
   * @param {TargetType} type How the text should be converted, scriptures are more complicated
   * @param {boolean} [follows] Does this element come after previous sibling?
   * @return {string} Empty string implies that the selector failed
   */
  _getElementAsText(dom, selector, type, follows = false) {
    let text = '';
    // Check if dom is valid before trying to use it
    if (!dom || typeof dom.querySelector !== 'function') {
      debugLog('Invalid DOM passed to _getElementAsText:', dom);
      return '';
    }
    const elem = dom.querySelector(selector) ?? null;
    if (elem) {
      if (type === TargetType.scripture) {
        {
          // All jw.org Bible pages (every language) have #v<id> verse elements: the structured
          // path keeps chapter numbers ("1" not "23") and poetry line breaks
          // Block and paragraph break markers become line breaks, then take the plain text
          const clone = elem.cloneNode(true);
          for (const marker of clone.querySelectorAll('span.newblock, span.parabreak')) {
            marker.replaceWith('\n');
          }
          text = clone.textContent.trim();
          // Check for initial chapter numbers (always first element) and replace with 1
          if (elem.querySelector('.chapterNum')) {
            text = text.replace(Config.initialNumRegex, '1 ');
            // Is it block or inline verse styling for following verses?
            // Do we need to prepend a space/newline?
          } else if (follows) {
            const first = elem.firstElementChild;
            const startsWithElement = first && elem.firstChild === first;
            const prependLF = Boolean(startsWithElement && (first.classList.contains('style-l') || first.classList.contains('newblock')));
            if (prependLF) {
              text = `\n${text}`;
            } else {
              text = ` ${text}`;
            }
          }
        }
      } else {
        text = elem.textContent.trim();
      }
      if (type === TargetType.scripture || type === TargetType.jwonline) {
        text = text
          .replace(/[\u00A0\u202F]/gm, ' ') // &nbsp; &nnbsp; WT use them after initial numbers
          .replace(/([,.;])(\w)/gm, '$1 $2') // punctuation without a space after
          .replace(/[\+\*\#]/gm, '') // remove symbols used for annotations
          .replace(/\r\n/gm, '\n') // LF only
          .replace(/\n{2,4}/gm, '\n'); // reduce to single linebreaks only
      } else if (type === TargetType.pubNav) {
        text = text
          .replace(/\t/gm, ' ') // tabs
          .replace(/[\n\r]/gm, ' '); // no linebreaks
      }
      text = text.replace(/ {2,}/gim, ' '); // reduce multiple spaces to single
      return text;
    }
    return text;
  }

  /**
   * Looks for all JW web links in the input text
   * Either wol.jw.org/... or jw.org/finder... style links are accepted
   * Return an array of matching links or empty array
   * @param {string} input
   * @param {number?} caret
   * @returns {Array<TJWLink>}
   */
  _getLinksInText(input) {
    const links = [];
    const matches = input.matchAll(Config.jworgLinkRegex);
    for (const match of matches) {
      const link = this._extractLinkParts(match);
      if (link) links.push(link);
    }
    return links;
  }

  /**
   * Looks for JW web links, returns the one nearest the caret
   * Either wol.jw.org/... or jw.org/finder... style links are accepted
   * Return the link nearest to the caret position, or null
   * @param {string} input
   * @param {number?} caret
   * @returns {TJWLink|null}
   */
  _getLinkAtCaret(input, caret) {
    let output = null;
    const matches = input.matchAll(Config.jworgLinkRegex);
    for (const match of matches) {
      const begin = match.index;
      const end = begin + match[0].length;
      if (caret >= begin && caret <= end) {
        output = this._extractLinkParts(match);
        if (output) break;
      }
    }
    return output;
  }

  /**
   * Try to match and return potential scripture references in the input string
   * If caret position is provided then match only the scripture nearest to the caret
   * Returns an array scripture references, one reference = passages within a bible book,
   *   each containing an array of passages, one passage = span of consecutive bible verses
   * @param {string} input                    Full input text
   * @param {DisplayType} displayType         How will this be displayed?
   * @param {boolean} spaceAfterPunct         Add a space after , or ; punctuation; for display purposes
   * @param {number|undefined} [caret]        Caret position 0+ (force single reference) | undefined (all references)
   * @returns {Array<TReference>|TReference}  Array list of references | reference (at caret)
   */
  _parseScriptureLinks(input, displayType, spaceAfterPunct = false, caret = undefined) {
    /** @type {array<TReference>} */
    const references = [];
    const spc = spaceAfterPunct ? ' ' : '';
    const ct = '|'; // used to indicate the caret location

    // NOTE: publication references (w25.01 28, абз. 11, ...) are handled by the
    // publication citation functions, not here.

    // Normal book chapter verse references
    const matchesNormal = input.matchAll(Config.scriptureRegex);
    // Small books with no chapter, e.g. phm, 2jo, 3jo, jude
    const matchesNoChp = input.matchAll(Config.scriptureNoChpRegex);
    // Chapter only references, e.g. John 3; Ex 16
    // Convert to array so that we can change value in-place
    const matchesNoVerseIter = input.matchAll(Config.scriptureNoVerseRegex);
    const matchesNoVerse = Array.from(matchesNoVerseIter);
    for (const match of matchesNoVerse) {
      // Add the dummy verse reference to chapter number (0 => link to verse 1, display no verse)
      match[4] = match[4].replace(/(\d{1,3})/, '$1:0');
    }
    const matches = [...matchesNormal, ...matchesNoChp, ...matchesNoVerse];

    let noChapter = false;
    // match[] => [1] whole scripture match [2] is plain text? [3] book name [4] chapter/verse passages [5] is already link?
    for (const match of matches) {
      let foundCaret = false;
      let original = match[1];
      let origPassages = match[4].toString();
      // Default to chapter 1
      if (!origPassages.includes(':')) {
        origPassages = `1:${origPassages}`;
        noChapter = true;
      }
      // remove the last semi-colon in a list of passages
      if (original.slice(-1) === ';') {
        original = original.slice(0, -1);
        origPassages = origPassages.slice(0, -1);
      }
      /** @type {TReference} */
      let reference = {
        original: original,
        index: match.index,
        bookLength: match[2].length + match[3].length, // plain text marker + book name as typed
        book: match[3],
        passages: [],
        isPlainText: Boolean(match[2]), // ' => skip this verse, no link
        isLinkAlready: Boolean(match[5]), // ] or </a> at end => this is already a Wiki/URL link | ' before the verse to skip auto-linking
      };
      // add a sentinel character as a caret locator in the *original* scripture passage
      // NOTE: we cannot simply add it to the original reference as it would disrupt the regex match
      // makes it easy to find the caret once the reference has been split up during parsing
      const refBegin = match.index;
      const refLength = match[1].length;
      const bookLength = match[2].length + match[3].length; // plain text marker and book name length
      if (caret) {
        const caretBook = caret - refBegin; // caret relative to this reference
        if (caretBook < bookLength) {
          foundCaret = true; // found the caret in book name
        } else if (caretBook >= bookLength && caretBook <= refLength) {
          const caretPassage = caretBook - bookLength;
          // insert sentinnel character
          origPassages = `${origPassages.substring(0, caretPassage)}${ct}${origPassages.substring(caretPassage)}`;
        }
      }
      const rawPassages = origPassages.split(';');
      let chapterCnt = 0;
      for (const rawPassage of rawPassages) {
        let [chapter, verses] = rawPassage.split(':');
        chapter = chapter.trim();
        let verseCnt = 0;
        for (let rawVerse of joinConsecutiveVerses(verses.split(','))) {
          // look for the caret locator first, remove if found!
          if (chapter.includes(ct)) {
            foundCaret = true; // found caret in chapter
            chapter = chapter.replace(ct, '');
          } else if (rawVerse.includes(ct)) {
            foundCaret = true; // found caret in verse
            rawVerse = rawVerse.replace(ct, '');
          }

          // try to convert the verse into a span: first => last (inclusive)
          const verse = {};
          for (const delim of ['-', ',']) {
            if (rawVerse.includes(delim)) {
              const ab = rawVerse.trim().split(delim);
              verse.first = Number(ab[0]);
              verse.last = Number(ab[1]);
              if (verse.last < verse.first) {
                verse.last = verse.first;
              }
              verse.separator = delim;
              break;
            }
          }
          // must be a single verse
          let noVerse = false;
          if (!verse.first) {
            // Handle special case of chapter only references
            if (rawVerse === '0') {
              verse.first = 1;
              noVerse = true;
            } else {
              verse.first = Number(rawVerse);
            }
            verse.last = verse.first;
            verse.separator = '';
          }
          if (displayType === DisplayType.find) {
            verse.last = verse.first;
          }

          let delimiter = '';
          if (chapterCnt > 0 && verseCnt === 0) {
            delimiter = `;${spc}`;
          } else if (verseCnt > 0) {
            delimiter = `,${spc}`;
          }

          /** @type {PrefixType} */
          let prefixType = PrefixType.showNone;
          if (caret && foundCaret) {
            prefixType = PrefixType.showBookChapter;
          } else {
            if (chapterCnt === 0) {
              prefixType = PrefixType.showBookChapter;
            } else if (verseCnt === 0) {
              prefixType = PrefixType.showChapter;
            }
          }

          const passage = {
            prefixType: prefixType, // whether to add the book/chapter prefix
            delimiter: delimiter, // , or ;
            display: reference.book, // fallback: original book as entered by user
            chapter: chapter,
            verse: verse, // first, last, separator
            link: null,
            error: OutputError.none,
            noChapter: noChapter,
            noVerse: noVerse,
          };

          // Special case: if caret is explicitly defined then we ignore other matches,
          // we simply look for the one at the caret
          if (caret) {
            if (foundCaret) {
              reference.passages.push(passage);
              reference = validateReference.call(this, reference, displayType);
              references.push(reference);
              return references; // return immediately, no need to process further
            }
          } else {
            reference.passages.push(passage);
            // if 'find' type then return the first match immediately (always a single verse reference)
            if (displayType === DisplayType.find) {
              reference = validateReference.call(this, reference, displayType);
              return reference;
            }
          }
          verseCnt++;
        }
        chapterCnt++;
      }
      // only collect references if there is no caret!
      if (!caret) {
        reference = validateReference.call(this, reference, displayType);
        references.push(reference);
      }
    }
    return references ? references : null;

    /**
     * INTERNAL
     * Process all chap/verse passages in a scripture reference and returns:
     * 1. The valid, canonical display version (ps 5:10 => Psalms 5:10)
     * 2. The correct jw scripture ID for the url args, in JWLib and wol.jw.org versions
     * 3. An array of scripture IDs (one for each verse in a range)
     *    needed to fetch the verse citations [optional]
     * @param {import('main').TReference} reference Scripture reference (same book, many chapter/verse passages)
     * @param {DisplayType} displayType plain, md, url, cite, find
     * @returns {TReference}
     */
    function validateReference(reference, displayType) {
      // Auto-detect language or use setting
      let lang = this.settings?.lang || DEFAULT_SETTINGS.lang;
      const autoLang = lang === 'Auto';
      const bookKey = reference.book.replace(/[\s\u00A0.]/g, '').toLowerCase(); // no spaces, &nbsp; or .
      debugLog('validateReference - initial lang setting:', lang);
      debugLog('validateReference - reference.book:', reference.book);
      if (lang === 'Auto') {
        lang = detectBookLanguage(bookKey) ?? detectLanguage(reference.book);
        debugLog('validateReference - detected lang:', lang);
      } else {
        // Convert setting name to language code
        lang = Languages[lang] || Languages[DEFAULT_SETTINGS.fallbackLang];
        debugLog('validateReference - converted lang:', lang);
      }
      debugLog('validateReference - final lang:', lang);

      // First question: is this a valid bible book?
      // *********************************
      // The abbreviation list has no spaces: e.g. 1kings 1ki matthew matt mt
      // so we remove all spaces from the reference
      // Also use (^| ) to avoid matching inside book names, e.g. eph in zepheniah
      let bookNum = 0;

      // Check if Bible data exists for this language, fallback to English if not
      if (!Bible[lang]) lang = 'EN';
      const found = findBibleBook(bookKey, lang);
      if (found) {
        bookNum = found.index + 1;
        // Auto-detection only looks at a few names (e.g. "Juan" is not recognised as Spanish):
        // when the book is only found in another language, use that language
        if (autoLang) lang = found.lang;
        reference.book = Bible[lang].Book[found.index].replaceAll(' ', '\u00A0'); // avoid page breaks in book name
      }
      reference.lang = lang;

      // Now handle each chapter:verse(s) passage
      /** @type {TPassage} */
      for (const passage of reference.passages) {
        const first = passage.verse.first;
        const last = passage.verse.last;

        // Build a canonical bible scripture reference
        // *******************************************
        // NOTE: passage.display default is the original book text from user
        const chapter = passage.noChapter ? '' : `${passage.chapter}`;
        const bookChapter = `${reference.book} ${chapter}`;
        if (passage.prefixType === PrefixType.showBookChapter) {
          passage.display = bookChapter;
        } else if (passage.prefixType === PrefixType.showChapter) {
          passage.display = chapter;
        }
        let verseSpan;
        if (passage.noVerse) {
          verseSpan = '';
        } else {
          verseSpan = first + (last > first ? passage.verse.separator + last : '');
          if (!passage.noChapter) {
            verseSpan = `:${verseSpan}`;
          }
        }
        passage.display += verseSpan;
        passage.displayFull = bookChapter + verseSpan;

        // Add the hyperlinks
        // ******************
        // Does this chapter and verse range exist in this bible book? If so, create the link
        let link = {};
        const verseMax = maxVerse(bookNum, passage.chapter);
        if (verseMax !== undefined && first <= verseMax && last <= verseMax) {
          /** @type {TLink} */
          link = {
            jwlib: '',
            jworg: '',
            parIds: [],
          };
          // Handle the verse link id
          // Format: e.g. Genesis 2:6
          // Book|Chapter|Verse
          //  01 |  002  | 006  = 01001006
          // Verse range = 01001006-01001010 e.g. Gen 2:6-10
          // 🔥IMPORTANT: with jw.org par ids the leading 0 is skipped!
          if (displayType !== DisplayType.plain || displayType !== DisplayType.find) {
            const bookChapId = bookNum.toString() + passage.chapter.toString().padStart(3, '0');
            let id = bookChapId + first.toString().padStart(3, '0');
            if (last > first) {
              id += `-${bookChapId}${last.toString().padStart(3, '0')}`;
            }
            // JW Library app link with dynamic locale based on detected language
            const jwlLocale = getJWLibraryLocale(lang);
            link.jwlib = `${Config.jwlFinder}${Config.urlParam}${id}${jwlLocale}`;

            // Finally, handle the (verse) par ids used to fetch the citation from jw.org
            if (displayType === DisplayType.cite) {
              // Use appropriate finder URL based on detected language for all languages
              const finderUrl = getFinderUrl(lang);
              link.jworg = `${finderUrl}${Config.urlParam}${id}`;
              debugLog(`Created jworg link for ${lang}:`, link.jworg);
              for (let i = first; i <= last; i++) {
                link.parIds.push(bookChapId + i.toString().padStart(3, '0'));
              }
            }
          }
        } else {
          passage.error = OutputError.invalidScripture;
          link = null;
        }
        passage.link = link;
      }
      return reference;
    }

    /**
     * Find consecutive verses and consolidate them into one item
     * E.g. ['1', ' 2'] => ['1, 2']
     * @param {Array<string>} verses
     * @returns {Array<string>}
     */
    function joinConsecutiveVerses(verses) {
      const joined = [];
      const len = verses.length;
      for (let i = 0; i < len; i++) {
        const current = Number(verses[i].replace(ct, ''));
        const next = i < len - 1 ? Number(verses[i + 1].replace(ct, '')) : '';
        if (current === next - 1) {
          joined.push(`${verses[i]},${verses[i + 1]}`);
          i++;
        } else {
          joined.push(verses[i]);
        }
      }
      return joined;
    }
  }

  /**
   * Extracts all the parts of a JW web url
   * Either /finder? style or wol.jw.org style
   * Only accepts publication links, not verses or home page meeting workbook links
   * @param {string} match Regex match of a JW web url (wol or finder style)
   * @returns {TJWLink|null}
   */
  _extractLinkParts(match) {
    let url = match[3];
    let docId = '';
    let parId = '';
    let wtlocale = 'E';
    // Any language: https://wol.jw.org/<lang>/wol/d/<r>/<lp>/<docid>#h=<par>
    let parEnd = '';
    const wolMatch = /^https:\/\/wol\.jw\.org\/([a-z-]+)\/wol\/d\/[^/]+\/[^/]+\/(\d+)(?:#h=(\d+)(?:-(\d+))?)?/i.exec(url);
    if (wolMatch) {
      wtlocale = { ru: 'U', es: 'S', en: 'E', de: 'X', fr: 'F', nl: 'O' }[wolMatch[1].toLowerCase()] ?? 'E';
      docId = wolMatch[2];
      parId = wolMatch[3] ?? '';
      parEnd = wolMatch[4] ?? '';
    } else if (/^https:\/\/www\.jw\.org\/finder\?/i.test(url)) {
      let params;
      try {
        params = new URL(url).searchParams;
      } catch {
        return null;
      }
      docId = params.get('docid') ?? '';
      // par may be a range ("5-7")
      const par = /^(\d+)(?:-(\d+))?/.exec(params.get('par') ?? '');
      parId = par?.[1] ?? '';
      parEnd = par?.[2] ?? '';
      wtlocale = params.get('wtlocale') ?? 'E';
      if (!docId) return null;
      // switch the link style from finder to wol
      // so that we can scrape the paragraph content later if needed
      const lang = LangByWtlocale[wtlocale] ?? 'EN';
      url = `${getConfigForLanguage(lang).wolPublications}${docId}${parId ? `#h=${parId}${parEnd ? `-${parEnd}` : ''}` : ''}`;
    } else {
      return null;
    }
    return {
      whole: match[0],
      title: match[1] ? match[2] : Lang.noTitle,
      url: url,
      docId: docId,
      parId: parId,
      parEnd: parEnd,
      wtlocale: wtlocale,
    };
  }

  /**
   * Returns the first X words from the sentence provided
   * @param {string} sentence
   * @param {number} count how many words; 0 = full verse
   * @returns {string} some or all words in sentence
   */
  _firstXWords(sentence, count) {
    if (count === 0) {
      return sentence;
    }
    const words = sentence.split(/\s/);
    if (words.length > count) {
      return `${words.slice(0, count).join(' ')} …`;
    }
    return sentence;
  }
}

class JWLLinkerView extends ItemView {
  constructor(leaf, settings) {
    super(leaf);
    this.settings = settings;
    this.historyEl;
    /** @type {Array<THistory>} */
    this.history = [];
    this.helpEl;
    this.expandHelpEl;
    this.helpExpanded = true;
  }

  getViewType() {
    return JWL_LINKER_VIEW;
  }

  getDisplayText() {
    return Lang.name;
  }

  getIcon() {
    return 'gem';
  }

  // Update View state from workspace.json
  async setState(state, result) {
    this.history = state.history ?? [];
    this.showHistory();
    await super.setState(state, result);
  }

  // Get current View state and save to workspace.json
  getState() {
    const state = super.getState();
    state.history = this.history; // update to the new state
    return state; // return the updated state, will be saved to workspace.json
  }

  async onOpen() {
    this.renderView();
  }

  async onClose() {
    this.unload();
  }

  renderView() {
    this.historyEl = this.contentEl.createDiv({ cls: 'jwl' });

    const detailsEl = createEl('details', { cls: 'jwl-help' });
    detailsEl.createEl('summary', { text: Lang.help });
    detailsEl.createEl('p', { text: Lang.helpIntro });
    const detailEl = detailsEl.createEl('ul');
    detailEl.createEl('li', { text: Lang.helpCopy });
    const wipeEl = detailEl.createEl('li', {
      text: Lang.helpClear,
      cls: 'clear-history',
    });
    this.contentEl.append(detailsEl);

    this.showHistory();

    this.historyEl.onclick = (event) => {
      if (event.target.tagName === 'P') {
        const item = this.history[event.target.parentElement.parentElement.id];
        if (item) {
          const md = `${item.link}\n${item.content}`;
          navigator.clipboard.writeText(md);
          new Notice(Lang.copiedHistoryMsg, 2000);
        }
      }
    };

    wipeEl.onclick = () => {
      this.clearHistory();
    };
  }

  /* 🕒 HISTORY FUNCTIONS */

  showHistory() {
    if (!this.historyEl) return; // view not rendered yet (setState can run before onOpen)
    this.historyEl.empty();
    // Unload the previous render so rendered markdown children don't leak
    if (this.renderParent) {
      this.renderParent.unload();
      this.renderParent = null;
    }
    if (this.history.length > 0) {
      const parent = new MarkdownRenderChild(this.containerEl);
      parent.load();
      this.renderParent = parent;
      this.history.forEach((item, index) => {
        const itemEl = this.historyEl.createDiv({
          cls: 'item',
          attr: { id: index },
        });
        const linkEl = itemEl.createEl('p');
        const pars = item.content.length > 1 ? `\u{2002}¶\u{2008}${item.content.length}` : '';
        MarkdownRenderer.render(this.app, item.link + pars, linkEl, '/', parent);
        const textEl = itemEl.createEl('p');
        MarkdownRenderer.render(this.app, item.content.join(''), textEl, '/', parent);
      });
    } else {
      this.historyEl.createDiv({ cls: 'pane-empty', text: Lang.noHistoryYet });
    }
  }

  /**
   * Add a new history item to the top of the list
   * Note: This is part of the View class, as history is stored in the View's state
   * @param {string} url Primary key
   * @param {string} link The MD link
   * @param {Array} content The text content (array of strings)
   * @param {number} pars Treat 1-3 paragraphs as separate history items; lookup and verses anyway unique urls
   */
  addToHistory(url, link, content, pars = null) {
    /** @type {THistory} */
    const newItem = { key: url + (pars ?? ''), url, link, content };
    this.history = this.history.filter((item) => item.key !== newItem.key); // no duplicates
    this.history = [newItem, ...this.history]; // add to the top
    const maxHistory = Number(this.settings.historySize ?? DEFAULT_SETTINGS.historySize);
    if (Number.isFinite(maxHistory) && this.history.length > maxHistory) {
      this.history = this.history.slice(0, maxHistory);
    }
    this.app.workspace.requestSaveLayout(); // causes a state save via getState
  }

  /**
   * Grab the cache version of a lookup
   * Return the right number of paragraphs if there are enough else undefined
   * @param {string} url
   * @param {number} pars Paragraph count
   * @returns {THistory|undefined}
   */
  getFromHistory(url, pars = null) {
    const key = url + (pars ?? '');
    const cache = this.history.find((item) => key === item.key);
    return cache;
  }

  clearHistory() {
    this.history = [];
    this.app.workspace.requestSaveLayout();
    this.showHistory();
  }
}

/**
 * Reading View only:
 * Render all Scripture references in this HTML element as a JW Library links instead
 */
class ScripturePostProcessor extends MarkdownRenderChild {
  /**
   * @param {HTMLElement} containerEl
   * @param {Plugin} plugin
   */
  constructor(containerEl, plugin) {
    super(containerEl);
    this.plugin = plugin;
  }

  onload() {
    const el = this.containerEl;
    // References in headings and callouts break their formatting, leave them as they are
    const first = el.firstElementChild;
    if (first && (/^H[1-6]$/.test(first.tagName) || first.hasAttribute('data-callout'))) return;
    if (!/\d/.test(el.textContent ?? '')) return;

    // Only plain text: skip existing links, code and math
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest('a, code, pre, .math') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      linkScripturesInTextNode(this.plugin, node);
    }
  }
}

/**
 * Replace the scripture references in a text node with JW Library links (DOM API only)
 * @param {Plugin} plugin
 * @param {Text} node
 * @returns {boolean} true if the node was replaced
 */
function linkScripturesInTextNode(plugin, node) {
  const text = node.nodeValue ?? '';
  if (!/\d/.test(text)) return false;
  const references = plugin
    ._parseScriptureLinks(text, DisplayType.href, plugin.settings.spaceAfterPunct)
    .filter((ref) => !ref.isLinkAlready && ref.passages.some((passage) => passage.link))
    .sort((a, b) => a.index - b.index);
  if (references.length === 0) return false;

  const doc = node.ownerDocument;
  const fragment = doc.createDocumentFragment();
  let pos = 0;
  for (const ref of references) {
    if (ref.index < pos) continue; // overlapping match
    fragment.append(text.slice(pos, ref.index));
    for (const passage of ref.passages) {
      if (passage.delimiter) fragment.append(passage.delimiter);
      if (passage.link) {
        const a = doc.createElement('a');
        a.textContent = passage.display;
        a.setAttribute('href', passage.link.jwlib);
        a.setAttribute('title', passage.link.jwlib); // make the target URL visible on hover
        fragment.append(a);
      } else {
        fragment.append(passage.display);
      }
    }
    pos = ref.index + ref.original.length;
  }
  fragment.append(text.slice(pos));
  node.replaceWith(fragment);
  return true;
}

/**
 * Create the (still empty) verse popup next to a link
 * @param {HTMLElement} link
 * @returns {HTMLElement}
 */
function createVersePopover(link) {
  const doc = link.ownerDocument;
  const popover = doc.body.createDiv({ cls: 'jwl-verse-popover' });
  popover.createDiv({ cls: 'jwl-verse-popover-title', text: link.textContent ?? '' });
  popover.createDiv({ cls: 'jwl-verse-popover-status', text: Lang.versePreviewLoading });

  // Below the link, or above it when the link is in the lower part of the window
  const rect = link.getBoundingClientRect();
  const win = doc.defaultView ?? window;
  const left = Math.max(8, Math.min(rect.left, win.innerWidth - 416));
  const above = rect.bottom > win.innerHeight * 0.6;
  popover.toggleClass('is-above', above);
  popover.setCssProps({
    '--jwl-popover-left': `${left}px`,
    '--jwl-popover-top': `${rect.bottom + 6}px`,
    '--jwl-popover-bottom': `${win.innerHeight - rect.top + 6}px`,
  });
  return popover;
}

/**
 * Put the fetched verses into the popup (DOM API only)
 * @param {HTMLElement} popover
 * @param {{verses: string[], more: number, failed: boolean}|null} data
 */
function fillVersePopover(popover, data) {
  popover.querySelector('.jwl-verse-popover-status')?.remove();
  if (!data || data.failed) {
    popover.createDiv({ cls: 'jwl-verse-popover-status', text: Lang.onlineLookupFailed });
    return;
  }
  const body = popover.createDiv({ cls: 'jwl-verse-popover-body' });
  for (const verse of data.verses) {
    const lines = verse.split('\n').filter((line) => line.trim() !== '');
    lines.forEach((line, i) => {
      const p = body.createEl('p');
      const num = i === 0 ? /^(\d{1,3})\s+(.*)$/s.exec(line.trim()) : null;
      if (num) {
        p.createEl('strong', { text: num[1] });
        p.appendText(` ${num[2]}`);
      } else {
        p.setText(line.trim());
        if (i > 0) p.addClass('jwl-verse-popover-cont');
      }
    });
  }
  if (data.more > 0) {
    popover.createDiv({ cls: 'jwl-verse-popover-more', text: Lang.versePreviewMore.replace('{count}', data.more) });
  }
}

class JWLLinkerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  _resolveAutoLanguage() {
    return this.plugin._resolveAutoLanguage();
  }

  display() {
    const { containerEl } = this;
    const defaultTemplate = '{title}\n{text}\n';

    containerEl.empty();
    containerEl.addClass('jwl-settings');

    new Setting(containerEl)
      .setName(Lang.settingsOpenSidebarOnStartup)
      .setDesc(Lang.settingsOpenSidebarOnStartupDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.openSidebarOnStartup).onChange(async (value) => {
          this.plugin.settings.openSidebarOnStartup = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(Lang.settingsDebug)
      .setDesc(Lang.settingsDebugDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.debug).onChange(async (value) => {
          this.plugin.settings.debug = value;
          debugEnabled = value;
          await this.plugin.saveSettings();
        });
      });

    // General settings stay at the top without a heading (Obsidian guidelines)
    new Setting(containerEl)
      .setName(Lang.settingsDisplay)
      .setDesc(Lang.settingsDisplayDesc)
      .setHeading();

    new Setting(containerEl)
      .setName(Lang.settingsVerseTemplate)
      .setDesc(Lang.settingsVerseTemplateDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(defaultTemplate)
          .setValue(this.plugin.settings.verseTemplate)
          .onChange(async (value) => {
            this.plugin.settings.verseTemplate = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsVerseCallout)
      .setDesc(Lang.settingsVerseCalloutDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(defaultTemplate)
          .setValue(this.plugin.settings.verseCalloutTemplate)
          .onChange(async (value) => {
            this.plugin.settings.verseCalloutTemplate = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsPubTemplate)
      .setDesc(Lang.settingsPubTemplateDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(defaultTemplate)
          .setValue(this.plugin.settings.pubTemplate)
          .onChange(async (value) => {
            this.plugin.settings.pubTemplate = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsPubCallout)
      .setDesc(Lang.settingsPubCalloutDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(defaultTemplate)
          .setValue(this.plugin.settings.pubCalloutTemplate)
          .onChange(async (value) => {
            this.plugin.settings.pubCalloutTemplate = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsInterfaceLang)
      .setDesc(Lang.settingsInterfaceLangDesc)
      .addDropdown((drop) => {
        const interfaceOptions = {
          'Russian': 'Русский',
          'English': 'English',
          'Spanish': 'Español',
          'Portuguese': 'Português',
          'French': 'Français',
          'German': 'Deutsch'
        };
        drop
          .addOptions(interfaceOptions)
          .setValue(this.plugin.settings.interfaceLang)
          .onChange(async (value) => {
            this.plugin.settings.interfaceLang = value;
            updateInterfaceLanguage(value);
            await this.plugin.saveSettings();
            // Refresh settings display
            this.display();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsCitationLang)
      .setDesc(Lang.settingsCitationLangDesc)
      .addDropdown((drop) => {
        const languageOptions = Lang.citationLangOptions;
        drop
          .addOptions(languageOptions)
          .setValue(this.plugin.settings.lang)
          .onChange(async (value) => {
            this.plugin.settings.lang = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsHistorySize)
      .setDesc(Lang.settingsHistorySizeDesc)
      .addDropdown((drop) => {
        drop
          .addOptions(Lang.historySize)
          .setValue(this.plugin.settings.historySize)
          .onChange(async (value) => {
            this.plugin.settings.historySize = Number(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsBoldNumbers)
      .setDesc(Lang.settingsBoldNumbersDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.boldInitialNum).onChange(async (value) => {
          this.plugin.settings.boldInitialNum = value;
          await this.plugin.saveSettings();
        });
      });

    if (!Platform.isMobile) {
      new Setting(containerEl)
        .setName(Lang.settingsVersePreview)
        .setDesc(Lang.settingsVersePreviewDesc)
        .addToggle((tog) => {
          tog.setValue(this.plugin.settings.versePreview).onChange(async (value) => {
            this.plugin.settings.versePreview = value;
            await this.plugin.saveSettings();
          });
        });
    }

    new Setting(containerEl)
      .setName(Lang.settingsLivePreviewLinks)
      .setDesc(Lang.settingsLivePreviewLinksDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.livePreviewLinks).onChange(async (value) => {
          this.plugin.settings.livePreviewLinks = value;
          await this.plugin.saveSettings();
          this.app.workspace.updateOptions(); // redraw open editors
        });
      });

    new Setting(containerEl)
      .setName(Lang.settingsSuggestions)
      .setDesc(Lang.settingsSuggestionsDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.suggestions).onChange(async (value) => {
          this.plugin.settings.suggestions = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(Lang.settingsSuggestTrigger)
      .setDesc(Lang.settingsSuggestTriggerDesc)
      .addText((text) => {
        text
          .setPlaceholder('@')
          .setValue(this.plugin.settings.suggestTrigger)
          .onChange(async (value) => {
            this.plugin.settings.suggestTrigger = value.trim() || '@';
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(Lang.settingsCitationLink)
      .setDesc(Lang.settingsCitationLinkDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.citationLink).onChange(async (value) => {
          this.plugin.settings.citationLink = value;
          await this.plugin.saveSettings();
        });
      });

    /* Dual Language Mode section */
    new Setting(containerEl)
      .setName(Lang.settingsDualModeSection)
      .setDesc(Lang.settingsDualModeSectionDesc)
      .setHeading();

    new Setting(containerEl)
      .setName(Lang.settingsDualModeVerses)
      .setDesc(Lang.settingsDualModeVersesDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.dualModeVerses).onChange(async (value) => {
          this.plugin.settings.dualModeVerses = value;
          // Also update legacy dualMode for compatibility
          this.plugin.settings.dualMode = value || this.plugin.settings.dualModePublications;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide language dropdowns
        });
      });

    new Setting(containerEl)
      .setName(Lang.settingsDualModePublications)
      .setDesc(Lang.settingsDualModePublicationsDesc)
      .addToggle((tog) => {
        tog.setValue(this.plugin.settings.dualModePublications).onChange(async (value) => {
          this.plugin.settings.dualModePublications = value;
          // Also update legacy dualMode for compatibility
          this.plugin.settings.dualMode = value || this.plugin.settings.dualModeVerses;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide language dropdowns
        });
      });

    // Show language selection only if at least one dual mode is enabled
    if (this.plugin.settings.dualModeVerses || this.plugin.settings.dualModePublications) {
      // First language dropdown
      new Setting(containerEl)
        .setName(Lang.settingsDualLangFirst)
        .setDesc(Lang.settingsDualLangFirstDesc)
        .addDropdown((drop) => {
          drop
            .addOptions(Lang.dualLangOptions)
            .setValue(this.plugin.settings.dualLangFirst)
            .onChange(async (value) => {
              // Validate: first and second language cannot be the same (unless Auto)
              if (value !== 'Auto' && value === this.plugin.settings.dualLangSecond) {
                new Notice(Lang.settingsDualLangSameError, 3000);
                drop.setValue(this.plugin.settings.dualLangFirst);
                return;
              }
              this.plugin.settings.dualLangFirst = value;
              await this.plugin.saveSettings();
              this.display(); // Refresh to update second language options
            });
        });

      // Second language dropdown - exclude Auto option and the selected first language
      new Setting(containerEl)
        .setName(Lang.settingsDualLangSecond)
        .setDesc(Lang.settingsDualLangSecondDesc)
        .addDropdown((drop) => {
          // Build options excluding Auto and the resolved first language
          const secondLangOptions = {};
          const firstLang = this.plugin.settings.dualLangFirst;
          const resolvedFirstLang = firstLang === 'Auto' ? this._resolveAutoLanguage() : firstLang;

          for (const [key, label] of Object.entries(Lang.dualLangOptions)) {
            // Exclude Auto option for second language
            if (key === 'Auto') continue;
            // Exclude the resolved first language
            if (key === resolvedFirstLang) continue;
            secondLangOptions[key] = label;
          }

          drop
            .addOptions(secondLangOptions)
            .setValue(this.plugin.settings.dualLangSecond)
            .onChange(async (value) => {
              this.plugin.settings.dualLangSecond = value;
              await this.plugin.saveSettings();
            });
        });
    }

    /* Reset section */

    new Setting(containerEl).setName(Lang.settingsReset).setDesc(Lang.settingsResetDesc).setHeading();

    new Setting(containerEl)
      .setName(Lang.settingsResetDefault)
      .setDesc(Lang.settingsResetDefaultDesc)
      .addButton((btn) => {
        btn.setIcon('reset');
        btn.onClick(async () => {
          Object.assign(this.plugin.settings, DEFAULT_SETTINGS);
          await this.plugin.saveSettings();
          this.display();
        });
      });

    new Setting(containerEl)
      .setName(Lang.settingsClearHistory)
      .setDesc(Lang.settingsClearHistoryDesc)
      .addButton((btn) => {
        btn.setIcon('reset');
        btn.onClick(async () => {
          this.plugin.view.clearHistory();
        });
      });
  }
}

const TargetType = {
  scripture: 'scripture',
  jwonline: 'jwonline',
  pubNav: 'pubNav',
};

const DisplayType = {
  href: 'href',   // HTML href link <a>...</a>
  md: 'md',       // Markdown link [](...)
  plain: 'plain', // Plain text: no link, proper case, expanded abbreviations
  cite: 'cite',   // Fetch and insert the full verse text
  find: 'find',   // For use in a search/find box, first result only
  open: 'open',   // Raw url path
};

const PrefixType = {
  showNone: 'showNone',
  showChapter: 'showChapter',
  showBookChapter: 'showBookChapter',
  showBookVerse: 'showBookVerse',
};

const OutputError = {
  none: 'none',
  invalidScripture: 'invalidScripture',
  invalidUrl: 'invalidUrl',
  onlineLookupFailed: 'onlineLookupFailed',
};

const Bible = {
  EN: {
    // Canonical bible book names, as displayed
    Book: [
      'Genesis',
      'Exodus',
      'Leviticus',
      'Numbers',
      'Deuteronomy',
      'Joshua',
      'Judges',
      'Ruth',
      '1 Samuel',
      '2 Samuel',
      '1 Kings',
      '2 Kings',
      '1 Chronicles',
      '2 Chronicles',
      'Ezra',
      'Nehemiah',
      'Esther',
      'Job',
      'Psalms',
      'Proverbs',
      'Ecclesiastes',
      'Song of Solomon',
      'Isaiah',
      'Jeremiah',
      'Lamentations',
      'Ezekiel',
      'Daniel',
      'Hosea',
      'Joel',
      'Amos',
      'Obadiah',
      'Jonah',
      'Micah',
      'Nahum',
      'Habakkuk',
      'Zephaniah',
      'Haggai',
      'Zechariah',
      'Malachi',
      'Matthew',
      'Mark',
      'Luke',
      'John',
      'Acts',
      'Romans',
      '1 Corinthians',
      '2 Corinthians',
      'Galatians',
      'Ephesians',
      'Philippians',
      'Colossians',
      '1 Thessalonians',
      '2 Thessalonians',
      '1 Timothy',
      '2 Timothy',
      'Titus',
      'Philemon',
      'Hebrews',
      'James',
      '1 Peter',
      '2 Peter',
      '1 John',
      '2 John',
      '3 John',
      'Jude',
      'Revelation',
    ],
    // abbr variations, no spaces allowed
    Abbreviation: [
      'genesis gen ge',
      'exodus ex',
      'leviticus lev le',
      'numbers num nu',
      'deuteronomy deut de',
      'joshua josh jos',
      'judges judg jg',
      'ruth ruth ru',
      '1samuel 1sam 1sa',
      '2samuel 2sam 2sa',
      '1kings 1ki',
      '2kings 2ki',
      '1chronicles 1chron 1ch',
      '2chronicles 2chron 2ch',
      'ezra ezra ezr',
      'nehemiah neh ne',
      'esther esther es',
      'job job',
      'psalms ps',
      'proverbs prov pr',
      'ecclesiastes eccl ec',
      'songofsolomon songofsol ca',
      'isaiah isa',
      'jeremiah jer',
      'lamentations lam la',
      'ezekiel ezek eze',
      'daniel dan da',
      'hosea hos ho',
      'joel joel joe',
      'amos amos am',
      'obadiah obad ob',
      'jonah jonah jon',
      'micah mic',
      'nahum nah na',
      'habakkuk hab',
      'zephaniah zeph zep',
      'haggai hag',
      'zechariah zech zec',
      'malachi mal',
      'matthew matt mt',
      'mark mark mr',
      'luke luke lu',
      'john john joh',
      'acts acts ac',
      'romans rom ro',
      '1corinthians 1cor 1co',
      '2corinthians 2cor 2co',
      'galatians gal ga',
      'ephesians eph',
      'philippians phil php',
      'colossians col',
      '1thessalonians 1thess 1th',
      '2thessalonians 2thess 2th',
      '1timothy 1tim 1ti',
      '2timothy 2tim 2ti',
      'titus titus tit',
      'philemon philem phm',
      'hebrews heb',
      'james jas',
      '1peter 1pet 1pe',
      '2peter 2pet 2pe',
      '1john 1john 1jo',
      '2john 2john 2jo',
      '3john 3john 3jo',
      'jude jude',
      'revelation rev re',
    ],
  },
  FR: {
    // Canonical bible book names, as displayed (French NWT)
    Book: [
      'Genèse',
      'Exode',
      'Lévitique',
      'Nombres',
      'Deutéronome',
      'Josué',
      'Juges',
      'Ruth',
      '1 Samuel',
      '2 Samuel',
      '1 Rois',
      '2 Rois',
      '1 Chroniques',
      '2 Chroniques',
      'Esdras',
      'Néhémie',
      'Esther',
      'Job',
      'Psaumes',
      'Proverbes',
      'Ecclésiaste',
      'Chant de Salomon',
      'Isaïe',
      'Jérémie',
      'Lamentations',
      'Ézéchiel',
      'Daniel',
      'Osée',
      'Joël',
      'Amos',
      'Abdias',
      'Jonas',
      'Michée',
      'Nahum',
      'Habacuc',
      'Sophonie',
      'Aggée',
      'Zacharie',
      'Malachie',
      'Matthieu',
      'Marc',
      'Luc',
      'Jean',
      'Actes',
      'Romains',
      '1 Corinthiens',
      '2 Corinthiens',
      'Galates',
      'Éphésiens',
      'Philippiens',
      'Colossiens',
      '1 Thessaloniciens',
      '2 Thessaloniciens',
      '1 Timothée',
      '2 Timothée',
      'Tite',
      'Philémon',
      'Hébreux',
      'Jacques',
      '1 Pierre',
      '2 Pierre',
      '1 Jean',
      '2 Jean',
      '3 Jean',
      'Jude',
      'Révélation',
    ],
    // All possible abbreviations for each bible book (French NWT): full name, WOL long and short
    Abbreviation: [
      'genèse gen gn genese',
      'exode ex',
      'lévitique lév lv levitique lev',
      'nombres nomb nb',
      'deutéronome deut dt deuteronome',
      'josué jos josue',
      'juges jg',
      'ruth ru',
      '1samuel 1sam 1s',
      '2samuel 2sam 2s',
      '1rois 1r',
      '2rois 2r',
      '1chroniques 1chron 1ch',
      '2chroniques 2chron 2ch',
      'esdras esd',
      'néhémie néh né nehemie neh',
      'esther est',
      'job jb',
      'psaumes ps',
      'proverbes prov pr',
      'ecclésiaste eccl ec ecclesiaste',
      'chantdesalomon chantdes ct chant salomon',
      'isaïe is isaie',
      'jérémie jér jr jeremie jer',
      'lamentations lam lm',
      'ézéchiel ézéch éz ezechiel ezech ez',
      'daniel dan dn',
      'osée os osee',
      'joël jl joel',
      'amos am',
      'abdias abd',
      'jonas jon',
      'michée mich mi michee',
      'nahum nah na',
      'habacuc hab',
      'sophonie soph sph',
      'aggée agg ag aggee',
      'zacharie zach za',
      'malachie mal ml',
      'matthieu mat mt',
      'marc mc',
      'luc lc',
      'jean',
      'actes ac',
      'romains rom rm',
      '1corinthiens 1cor 1co',
      '2corinthiens 2cor 2co',
      'galates gal ga',
      'éphésiens éph ephesiens eph',
      'philippiens phil php',
      'colossiens col',
      '1thessaloniciens 1thess 1th',
      '2thessaloniciens 2thess 2th',
      '1timothée 1tim 1tm 1timothee',
      '2timothée 2tim 2tm 2timothee',
      'tite tt',
      'philémon philém phm philemon',
      'hébreux héb hé hebreux heb',
      'jacques jacq jc',
      '1pierre 1p',
      '2pierre 2p',
      '1jean 1j',
      '2jean 2j',
      '3jean 3j',
      'jude',
      'révélation rév ré revelation rev',
    ],
  },
  RU: {
    // Canonical bible book names, as displayed (Russian NWT)
    Book: [
      'Бытие',
      'Исход',
      'Левит',
      'Числа',
      'Второзаконие',
      'Иисус Навин',
      'Судей',
      'Руфь',
      '1 Самуила',
      '2 Самуила',
      '1 Царей',
      '2 Царей',
      '1 Летопись',
      '2 Летопись',
      'Ездра',
      'Неемия',
      'Эсфирь',
      'Иов',
      'Псалмы',
      'Притчи',
      'Экклезиаст',
      'Песня Соломона',
      'Исайя',
      'Иеремия',
      'Плач Иеремии',
      'Иезекииль',
      'Даниил',
      'Осия',
      'Иоиль',
      'Амос',
      'Авдий',
      'Иона',
      'Михей',
      'Наум',
      'Аввакум',
      'Софония',
      'Аггей',
      'Захария',
      'Малахия',
      'Матфея',
      'Марка',
      'Луки',
      'Иоанна',
      'Деяния',
      'Римлянам',
      '1 Коринфянам',
      '2 Коринфянам',
      'Галатам',
      'Эфесянам',
      'Филиппийцам',
      'Колоссянам',
      '1 Фессалоникийцам',
      '2 Фессалоникийцам',
      '1 Тимофею',
      '2 Тимофею',
      'Титу',
      'Филимону',
      'Евреям',
      'Иакова',
      '1 Петра',
      '2 Петра',
      '1 Иоанна',
      '2 Иоанна',
      '3 Иоанна',
      'Иуды',
      'Откровение',
    ],
    // abbr variations, no spaces inside each token
    Abbreviation: [
      'бытие быт бт',
      'исход исх',
      'левит лев лв',
      'числа чис чс',
      'второзаконие втор вт',
      'иисуснавин иисн исн',
      'судей суд сд',
      'руфь руф рф',
      '1самуила 1сам 1см',
      '2самуила 2сам 2см',
      '1царей 1цар 1цр',
      '2царей 2цар 2цр',
      '1летопись 1лет 1лт',
      '2летопись 2лет 2лт',
      'ездра езд',
      'неемия неем не',
      'эсфирь эсф',
      'иов иов',
      'псалмы пс',
      'притчи прит пр',
      'экклезиаст эккл эк экл экк',
      'песнясоломона песня псн',
      'исайя ис иса',
      'иеремия иер',
      'плачиеремии плач пл',
      'иезекииль иез',
      'даниил дан',
      'осия ос',
      'иоиль иоил ил',
      'амос ам',
      'авдий авд',
      'иона ион',
      'михей мих мх',
      'наум на',
      'аввакум авв',
      'софония соф сф',
      'аггей агг аг',
      'захария зах зх',
      'малахия мал мл',
      'матфея матф мф',
      'марка мар мк',
      'луки лук лк',
      'иоанна иоан ин',
      'деяния деян де',
      'римлянам рим рм',
      '1коринфянам 1кор 1кр',
      '2коринфянам 2кор 2кр',
      'галатам гал гл',
      'эфесянам эф',
      'филиппийцам флп фп',
      'колоссянам кол кл',
      '1фессалоникийцам 1фес 1фс',
      '2фессалоникийцам 2фес 2фс',
      '1тимофею 1тим 1тм',
      '2тимофею 2тим 2тм',
      'титу тит',
      'филимону флм фм',
      'евреям евр',
      'иакова иак',
      '1петра 1пет 1пт',
      '2петра 2пет 2пт',
      '1иоанна 1иоан 1ин',
      '2иоанна 2иоан 2ин',
      '3иоанна 3иоан 3ин',
      'иуды иуды',
      'откровение отк',
    ],
  },
  ES: {
    // Canonical bible book names, as displayed (Spanish NWT)
    Book: [
      'Génesis',
      'Éxodo',
      'Levítico',
      'Números',
      'Deuteronomio',
      'Josué',
      'Jueces',
      'Rut',
      '1 Samuel',
      '2 Samuel',
      '1 Reyes',
      '2 Reyes',
      '1 Crónicas',
      '2 Crónicas',
      'Esdras',
      'Nehemías',
      'Ester',
      'Job',
      'Salmos',
      'Proverbios',
      'Eclesiastés',
      'El Cantar de los Cantares',
      'Isaías',
      'Jeremías',
      'Lamentaciones',
      'Ezequiel',
      'Daniel',
      'Oseas',
      'Joel',
      'Amós',
      'Abdías',
      'Jonás',
      'Miqueas',
      'Nahúm',
      'Habacuc',
      'Sofonías',
      'Ageo',
      'Zacarías',
      'Malaquías',
      'Mateo',
      'Marcos',
      'Lucas',
      'Juan',
      'Hechos',
      'Romanos',
      '1 Corintios',
      '2 Corintios',
      'Gálatas',
      'Efesios',
      'Filipenses',
      'Colosenses',
      '1 Tesalonicenses',
      '2 Tesalonicenses',
      '1 Timoteo',
      '2 Timoteo',
      'Tito',
      'Filemón',
      'Hebreos',
      'Santiago',
      '1 Pedro',
      '2 Pedro',
      '1 Juan',
      '2 Juan',
      '3 Juan',
      'Judas',
      'Apocalipsis',
    ],
    // All possible abbreviations for each bible book (Spanish)
    Abbreviation: [
      'génesis gén gé',
      'éxodo éx',
      'levítico lev le',
      'números núm nú',
      'deuteronomio deut dt',
      'josué jos',
      'jueces juec jue',
      'rut rut',
      '1samuel 1sam 1sa',
      '2samuel 2sam 2sa',
      '1reyes 1rey 1re',
      '2reyes 2rey 2re',
      '1crónicas 1cro 1cr',
      '2crónicas 2cro 2cr',
      'esdras esd',
      'nehemías neh ne',
      'ester est',
      'job job',
      'salmos sal sl',
      'proverbios prov pr',
      'eclesiastés ecl ec',
      'elcantardeloscantares cantardeloscantares cant can',
      'isaías is',
      'jeremías jer',
      'lamentaciones lam',
      'ezequiel ezeq eze',
      'daniel dan da',
      'oseas os',
      'joel joel joe',
      'amós am',
      'abdías abd',
      'jonás jon',
      'miqueas miq',
      'nahúm nah na',
      'habacuc hab',
      'sofonías sof',
      'ageo ag',
      'zacarías zac',
      'malaquías mal',
      'mateo mat mt',
      'marcos mar mr',
      'lucas luc lu',
      'juan jua jn',
      'hechos hech hch',
      'romanos rom ro',
      '1corintios 1cor 1co',
      '2corintios 2cor 2co',
      'gálatas gál',
      'efesios efes ef',
      'filipenses filip flp',
      'colosenses col',
      '1tesalonicenses 1tes 1te',
      '2tesalonicenses 2tes 2te',
      '1timoteo 1tim 1ti',
      '2timoteo 2tim 2ti',
      'tito tit',
      'filemón filem flm',
      'hebreos heb',
      'santiago sant snt',
      '1pedro 1ped 1pe',
      '2pedro 2ped 2pe',
      '1juan 1jua 1jn',
      '2juan 2jua 2jn',
      '3juan 3jua 3jn',
      'judas jud',
      'apocalipsis apoc ap',
    ],
  },
  PT: {
    // Canonical bible book names, as displayed (Portuguese (Brazil) NWT)
    Book: [
      'Gênesis',
      'Êxodo',
      'Levítico',
      'Números',
      'Deuteronômio',
      'Josué',
      'Juízes',
      'Rute',
      '1 Samuel',
      '2 Samuel',
      '1 Reis',
      '2 Reis',
      '1 Crônicas',
      '2 Crônicas',
      'Esdras',
      'Neemias',
      'Ester',
      'Jó',
      'Salmos',
      'Provérbios',
      'Eclesiastes',
      'Cântico de Salomão',
      'Isaías',
      'Jeremias',
      'Lamentações',
      'Ezequiel',
      'Daniel',
      'Oseias',
      'Joel',
      'Amós',
      'Obadias',
      'Jonas',
      'Miqueias',
      'Naum',
      'Habacuque',
      'Sofonias',
      'Ageu',
      'Zacarias',
      'Malaquias',
      'Mateus',
      'Marcos',
      'Lucas',
      'João',
      'Atos',
      'Romanos',
      '1 Coríntios',
      '2 Coríntios',
      'Gálatas',
      'Efésios',
      'Filipenses',
      'Colossenses',
      '1 Tessalonicenses',
      '2 Tessalonicenses',
      '1 Timóteo',
      '2 Timóteo',
      'Tito',
      'Filêmon',
      'Hebreus',
      'Tiago',
      '1 Pedro',
      '2 Pedro',
      '1 João',
      '2 João',
      '3 João',
      'Judas',
      'Apocalipse',
    ],
    // All possible abbreviations for each bible book (Portuguese (Brazil) NWT): full name, WOL long and short
    Abbreviation: [
      'gênesis gên genesis',
      'êxodo êxo êx exodo',
      'levítico lev le levitico',
      'números núm numeros num',
      'deuteronômio deut de deuteronomio',
      'josué jos josue',
      'juízes juí jz juizes',
      'rute ru',
      '1samuel 1sam 1sa',
      '2samuel 2sam 2sa',
      '1reis 1rs',
      '2reis 2rs',
      '1crônicas 1crô 1cr 1cronicas',
      '2crônicas 2crô 2cr 2cronicas',
      'esdras esd',
      'neemias nee ne',
      'ester est',
      'jó',
      'salmos sal',
      'provérbios pro pr proverbios',
      'eclesiastes ecl ec',
      'cânticodesalomão cân canticodesalomao cantico salomão salomao',
      'isaías isa is isaias',
      'jeremias jer je',
      'lamentações lam la lamentacoes',
      'ezequiel eze ez',
      'daniel dan da',
      'oseias ose os',
      'joel jl',
      'amós am amos',
      'obadias obd ob',
      'jonas jon',
      'miqueias miq',
      'naum na',
      'habacuque hab',
      'sofonias sof',
      'ageu ag',
      'zacarias zac za',
      'malaquias mal',
      'mateus mat mt',
      'marcos mar mr',
      'lucas luc lu',
      'joão jo joao',
      'atos at',
      'romanos rom ro',
      '1coríntios 1cor 1co 1corintios',
      '2coríntios 2cor 2co 2corintios',
      'gálatas gál galatas gal',
      'efésios efé ef efesios',
      'filipenses fil',
      'colossenses col',
      '1tessalonicenses 1tes 1te',
      '2tessalonicenses 2tes 2te',
      '1timóteo 1tim 1ti 1timoteo',
      '2timóteo 2tim 2ti 2timoteo',
      'tito tit',
      'filêmon filêm flm filemon',
      'hebreus heb he',
      'tiago tia tg',
      '1pedro 1ped 1pe',
      '2pedro 2ped 2pe',
      '1joão 1jo 1joao',
      '2joão 2jo 2joao',
      '3joão 3jo 3joao',
      'judas ju jud',
      'apocalipse apo ap',
    ],
  },
  DE: {
    // Canonical bible book names, as displayed (German NWT)
    Book: [
      '1. Mose',
      '2. Mose',
      '3. Mose',
      '4. Mose',
      '5. Mose',
      'Josua',
      'Richter',
      'Ruth',
      '1. Samuel',
      '2. Samuel',
      '1. Könige',
      '2. Könige',
      '1. Chronika',
      '2. Chronika',
      'Esra',
      'Nehemia',
      'Esther',
      'Hiob',
      'Psalmen',
      'Sprüche',
      'Prediger',
      'Hohes Lied',
      'Jesaja',
      'Jeremia',
      'Klagelieder',
      'Hesekiel',
      'Daniel',
      'Hosea',
      'Joel',
      'Amos',
      'Obadja',
      'Jona',
      'Micha',
      'Nahum',
      'Habakuk',
      'Zephanja',
      'Haggai',
      'Sacharja',
      'Maleachi',
      'Matthäus',
      'Markus',
      'Lukas',
      'Johannes',
      'Apostelgeschichte',
      'Römer',
      '1. Korinther',
      '2. Korinther',
      'Galater',
      'Epheser',
      'Philipper',
      'Kolosser',
      '1. Thessalonicher',
      '2. Thessalonicher',
      '1. Timotheus',
      '2. Timotheus',
      'Titus',
      'Philemon',
      'Hebräer',
      'Jakobus',
      '1. Petrus',
      '2. Petrus',
      '1. Johannes',
      '2. Johannes',
      '3. Johannes',
      'Judas',
      'Offenbarung',
    ],
    // All possible abbreviations for each bible book (German NWT): full name, WOL long and short
    Abbreviation: [
      '1mose 1mo',
      '2mose 2mo',
      '3mose 3mo',
      '4mose 4mo',
      '5mose 5mo',
      'josua jos',
      'richter ri',
      'ruth ru',
      '1samuel 1sam 1sa',
      '2samuel 2sam 2sa',
      '1könige 1kö 1koenige 1konige',
      '2könige 2kö 2koenige 2konige',
      '1chronika 1chr 1ch',
      '2chronika 2chr 2ch',
      'esra esr',
      'nehemia neh ne',
      'esther esth est',
      'hiob hi',
      'psalmen psalm ps',
      'sprüche spr sprueche spruche',
      'prediger pred pr',
      'hoheslied hoh lied',
      'jesaja jes',
      'jeremia jer',
      'klagelieder klag klg',
      'hesekiel hes',
      'daniel dan da',
      'hosea hos',
      'joel',
      'amos am',
      'obadja ob',
      'jona jon',
      'micha mi',
      'nahum nah',
      'habakuk hab',
      'zephanja zeph ze',
      'haggai hag',
      'sacharja sach',
      'maleachi mal',
      'matthäus mat matthaeus matthaus',
      'markus mar',
      'lukas luk',
      'johannes joh',
      'apostelgeschichte apg',
      'römer röm rö roemer romer',
      '1korinther 1kor 1ko',
      '2korinther 2kor 2ko',
      'galater gal',
      'epheser eph',
      'philipper phil php',
      'kolosser kol',
      '1thessalonicher 1thes 1th',
      '2thessalonicher 2thes 2th',
      '1timotheus 1tim 1ti',
      '2timotheus 2tim 2ti',
      'titus tit',
      'philemon philem phm',
      'hebräer heb hebraeer hebraer',
      'jakobus jak',
      '1petrus 1pet 1pe',
      '2petrus 2pet 2pe',
      '1johannes 1joh 1jo',
      '2johannes 2joh 2jo',
      '3johannes 3joh 3jo',
      'judas jud',
      'offenbarung offb off',
    ],
  },
};

// metadata for chapter and verse count per bible book
// Compact verse count table — _BibleVerses[book][chapter - 1] = max verse number
// Book numbers follow JW Library numbering (1 = Genesis … 66 = Revelation)
const _BibleVerses = [
  null, // index 0 unused — books start at 1
  [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26], // 1. Genesis
  [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38], // 2. Exodus
  [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34], // 3. Leviticus
  [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13], // 4. Numbers
  [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12], // 5. Deuteronomy
  [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33], // 6. Joshua
  [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25], // 7. Judges
  [22, 23, 18, 22], // 8. Ruth
  [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13], // 9. 1
  [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25], // 10. 2
  [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53], // 11. 1
  [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30], // 12. 2
  [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30], // 13. 1
  [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23], // 14. 2
  [11, 70, 13, 24, 17, 22, 28, 36, 15, 44], // 15. Ezra
  [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31], // 16. Nehemiah
  [22, 23, 15, 17, 14, 14, 10, 17, 32, 3], // 17. Esther
  [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17], // 18. Job
  [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6], // 19. Psalms
  [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31], // 20. Proverbs
  [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14], // 21. Ecclesiastes
  [17, 17, 11, 16, 16, 13, 13, 14], // 22. Song
  [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24], // 23. Isaiah
  [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34], // 24. Jeremiah
  [22, 22, 66, 22, 22], // 25. Lamentations
  [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35], // 26. Ezekiel
  [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13], // 27. Daniel
  [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9], // 28. Hosea
  [20, 32, 21], // 29. Joel
  [15, 16, 15, 13, 27, 14, 17, 14, 15], // 30. Amos
  [21], // 31. Obadiah
  [17, 10, 10, 11], // 32. Jonah
  [16, 13, 12, 13, 15, 16, 20], // 33. Micah
  [15, 13, 19], // 34. Nahum
  [17, 20, 19], // 35. Habakkuk
  [18, 15, 20], // 36. Zephaniah
  [15, 23], // 37. Haggai
  [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21], // 38. Zechariah
  [14, 17, 18, 6], // 39. Malachi
  [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 49, 58, 36, 39, 28, 26, 35, 30, 34, 46, 46, 38, 51, 46, 75, 66, 20], // 40. Matthew
  [45, 28, 35, 41, 43, 56, 36, 38, 48, 52, 32, 44, 37, 72, 46, 20], // 41. Mark
  [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 36, 43, 48, 47, 38, 71, 55, 53], // 42. Luke
  [51, 25, 36, 54, 46, 71, 52, 48, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25], // 43. John
  [26, 47, 26, 37, 42, 15, 60, 39, 43, 48, 30, 25, 52, 28, 40, 40, 34, 28, 41, 38, 40, 30, 35, 26, 27, 32, 44, 30], // 44. Acts
  [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 26], // 45. Romans
  [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24], // 46. 1
  [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14], // 47. 2
  [24, 21, 29, 31, 26, 18], // 48. Galatians
  [23, 22, 21, 32, 33, 24], // 49. Ephesians
  [30, 30, 21, 23], // 50. Philippians
  [29, 23, 25, 18], // 51. Colossians
  [10, 20, 13, 18, 28], // 52. 1
  [12, 17, 18], // 53. 2
  [20, 15, 16, 16, 25, 21], // 54. 1
  [18, 26, 17, 22], // 55. 2
  [16, 15, 15], // 56. Titus
  [25], // 57. Philemon
  [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25], // 58. Hebrews
  [27, 26, 18, 17, 20], // 59. James
  [25, 25, 22, 19, 14], // 60. 1
  [21, 22, 18], // 61. 2
  [10, 29, 24, 21, 21], // 62. 1
  [13], // 63. 2
  [15], // 64. 3
  [25], // 65. Jude
  [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21], // 66. Revelation
];

// Highest verse number of a chapter (undefined if the book or chapter does not exist).
// Reads _BibleVerses directly: building a flat lookup object at startup cost ~8 ms.
const maxVerse = (book, chapter) => _BibleVerses[book]?.[chapter - 1];

module.exports = {
  default: JWLLinkerPlugin,
};

/* ✏️ TYPES */

/**
 * An item in the history cache
 * @typedef {Object} THistory
 * @property {string} key
 * @property {string} url
 * @property {string} link
 * @property {Array<string>} content
 */

/**
 * @typedef {Array<TReference>} TReferences
 */

/**
 * Scripture reference match :      one or more verse passages within same bible book
 * @typedef {Object} TReference
 * @property {string} original      reference as matched, for replacement purposes
 * @property {string} book          book name (and ordinal is needed), no spaces
 * @property {Array<TPassage>} passages  all groups of book/chapter/verse references
 * @property {boolean} isPlainText  treat as plain text (no hyperlink)?
 * @property {boolean} isLinkAlready is already a wiki or MD link?
 */

/**
 * Passage : chapter + contiguous verse span, e.g. 8:1-4 or 9:4,5
 * @typedef {Object} TPassage
 * @property {PrefixType} prefixType  show the full book name [and chapter]?
 * @property {string} delimiter     punctuation symbol before the passage text , or ;
 * @property {string} displayFull   complete bible display name
 * @property {string} display       display name as per original source, could be missing book or chapter
 * @property {number} chapter       chapter number
 * @property {TVerse} verse         verse span (first, last)
 * @property {TLink} link           hyperlink info (null if invalid/plaintext)
 * @property {OutputError} error    possible parsing error
 * @property {boolean} noChapter    is book with no chapter (phm 2jo 3jo jude)
 * @property {boolean} noVerse      is book with chapter only, no verses
 */

/**
 * Verse span : first to last (inclusive)
 * @typedef {Object} TVerse
 * @property {number} first         first verse in span
 * @property {number} last          last verse in span
 * @property {string} separator     between the verse span - or ,
 */

/**
 * Hyperlink info for a bible passage
 * @typedef {Object} TLink
 * @property {string} jwlib         JWLibrary link for the hyperlink
 * @property {string} jworg         wol.jw.org link to lookup citation
 * @property {Array<string>} parIds list of par ids to lookup each verse content
 * @property {string} bookChapId    book and chapter portion of the par id
 */

/**
 * All the parts of a JW url
 * @typedef {Object} TJWLink
 * @property {string} whole
 * @property {string} title
 * @property {string} url
 * @property {string} docId
 * @property {string} parId
 */