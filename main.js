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
} = require('obsidian');

const DEFAULT_SETTINGS = {
  verseTemplate: '{title}\u2002“*{text}*”', // non-breaking space
  verseCalloutTemplate: '> [!verse] BIBLE — {title}\n> {text}\n',
  pubTemplate: '{title}\n“*{text}*”',
  pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n',
  historySize: 20,
  boldInitialNum: true,
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

// Supported languages for dual mode
const DualModeLanguages = {
  Auto: 'Auto',
  ru: 'ru',
  en: 'en',
  es: 'es',
};

// Multilingual interface strings
const InterfaceStrings = {
  Russian: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Это недопустимая ссылка на стих.',
    invalidUrl: '⚠️ Это недопустимая ссылка wol.jw.org.',
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
      'es': 'Испанский'
    },
    settingsReset: 'Сброс',
    settingsResetDesc: 'Это действие нельзя отменить.',
    settingsOpenSidebarOnStartup: 'Открывать боковую панель при запуске',
    settingsOpenSidebarOnStartupDesc: 'Если включено, боковая панель JWL Linker будет открываться автоматически при запуске Obsidian.',
    settingsDebug: 'Режим отладки',
    settingsDebugDesc: 'Если включено, будут доступны отладочные функции в консоли (window.test*).',
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
    menuBatchConvert: 'Цитировать все ссылки в документе',
    batchProcessing: 'Загрузка цитат...',
    batchComplete: 'Добавлено цитат: {count}',
    batchNoLinks: 'Ссылки не найдены в документе',
    menuParaCount: 'Количество абзацев для цитирования?',
    menuCitationLink: 'Ссылка на цитируемые стихи?',
  },
  English: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ This is not a valid scripture reference.',
    invalidUrl: '⚠️ This is not a valid wol.jw.org url.',
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
    settingsInterfaceLang: 'Interface Language',
    settingsInterfaceLangDesc: 'Choose the interface language for the plugin.',
    settingsCitationLang: 'Citation Language',
    settingsCitationLangDesc: 'Choose language for citations or use auto-detection.',
    settingsHistorySize: 'No. of history items',
    settingsHistorySizeDesc: 'How many history items to show in the sidebar.',
    settingsBoldNumbers: 'Initial numbers in bold',
    settingsBoldNumbersDesc: 'Apply bold markup to initial numbers in verses or paragraphs in the cited text.',
    settingsCitationLink: 'Link cited scripture',
    settingsCitationLinkDesc: 'Link scripture reference to JW Library when citing verses.',
    settingsDualMode: 'Dual publication mode',
    settingsDualModeDesc: 'Show publications in both English and Russian simultaneously.',
    // Dual language mode settings
    settingsDualModeSection: 'Dual Language Mode',
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
      'es': 'Spanish'
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
    settingsDebugDesc: 'If enabled, debug helpers will be exposed in the console (window.test*).',
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
    menuBatchConvert: 'Cite all references in document',
    batchProcessing: 'Loading citations...',
    batchComplete: 'Citations added: {count}',
    batchNoLinks: 'No references found in document',
    menuParaCount: 'No. of paragraphs to cite?',
    menuCitationLink: 'Link cited scripture?',
  },
  Spanish: {
    name: 'JWL Linker',
    invalidScripture: '⚠️ Esta no es una referencia bíblica válida.',
    invalidUrl: '⚠️ Esta no es una URL válida de wol.jw.org.',
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
      'es': 'Español'
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
    settingsDebugDesc: 'Si se activa, se expondrán funciones de depuración en la consola (window.test*).',
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
    menuBatchConvert: 'Citar todas las referencias del documento',
    batchProcessing: 'Cargando citas...',
    batchComplete: 'Citas añadidas: {count}',
    batchNoLinks: 'No se encontraron referencias en el documento',
    menuParaCount: '¿Número de párrafos a citar?',
    menuCitationLink: '¿Enlazar escritura citada?',
  }
};

// Dynamic Lang object based on interface language setting
let Lang = InterfaceStrings.Russian;

// Publications not available online by language
const OfflinePublications = {
  Russian: {
    'ep': 'Евангелизаторы',
    'po': 'Пособие для проповедников',
    'sg': 'Руководство для школы служения',
    'yb': 'Ежегодник Свидетелей Иеговы'
  },
  English: {
    'ep': 'Evangelizers',
    'po': 'Preaching Handbook',
    'sg': 'School Guidebook',
    'yb': 'Yearbook of Jehovah\'s Witnesses'
  },
  Spanish: {
    'ep': 'Evangelizadores',
    'po': 'Manual para predicadores',
    'sg': 'Guía para la escuela de servicio',
    'yb': 'Anuario de los testigos de Jehová'
  }
};

/**
 * Check if publication is available online
 * @param {string} pubCode - Publication code (e.g., 'ep', 'be')
 * @param {string} lang - Language code ('RU', 'EN')
 * @param {number} year - Publication year (optional, for Watchtower filtering)
 * @returns {Object} - {isOffline: boolean, message: string}
 */
function checkPublicationAvailability(pubCode, lang = 'EN', year = null) {
  const offlineList = OfflinePublications[lang === 'RU' ? 'Russian' : lang === 'ES' ? 'Spanish' : 'English'];

  // Check Watchtower year availability
  if (pubCode === 'w' && year !== null) {
    const minYear = (lang === 'RU') ? 1986 : 1950; // Same for Spanish and English
    if (year < minYear) {
      let message;
      if (lang === 'RU') {
        message = `📅 Сторожевая башня ${year} года недоступна онлайн. Доступны выпуски с ${minYear} года`;
      } else if (lang === 'ES') {
        message = `📅 La Atalaya ${year} no está disponible en línea. Disponible desde ${minYear} en adelante`;
      } else {
        message = `📅 The Watchtower ${year} is not available online. Available from ${minYear} onwards`;
      }

      return {
        isOffline: true,
        message: message
      };
    }
  }

  if (offlineList[pubCode]) {
    let message;
    if (lang === 'RU') {
      message = `📖 "${offlineList[pubCode]}" доступна только в печатном варианте`;
    } else if (lang === 'ES') {
      message = `📖 "${offlineList[pubCode]}" está disponible solo en formato impreso`;
    } else {
      message = `📖 "${offlineList[pubCode]}" is available only in print format`;
    }

    return {
      isOffline: true,
      message: message
    };
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
  Russian: 'RU',
  Spanish: 'ES',
};

// Function to detect if text contains Russian characters
function isRussianText(text) {
  return /[а-яёА-ЯЁ]/.test(text);
}

// Function to get appropriate URLs based on language
function getConfigForLanguage(lang = 'EN') {
  if (lang === 'RU') {
    return {
      jwlLocale: '&wtlocale=U',  // Russian uses 'U' in JW Library
      wolRoot: 'https://wol.jw.org/ru/wol/d/',
      wolPublications: 'https://wol.jw.org/ru/wol/d/r2/lp-u/',
      wolLookup: 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=',
      webFinder: 'https://www.jw.org/finder?wtlocale=U&'  // Web finder also uses U for Russian
    };
  } else if (lang === 'ES') {
    return {
      jwlLocale: '&wtlocale=S',  // Spanish uses 'S' in JW Library
      wolRoot: 'https://wol.jw.org/es/wol/d/',
      wolPublications: 'https://wol.jw.org/es/wol/d/r4/lp-s/',
      wolLookup: 'https://wol.jw.org/es/wol/l/r4/lp-s?q=',
      webFinder: 'https://www.jw.org/finder?wtlocale=S&'  // Web finder uses S for Spanish
    };
  } else {
    return {
      jwlLocale: '&wtlocale=E',
      wolRoot: 'https://wol.jw.org/en/wol/d/',
      wolPublications: 'https://wol.jw.org/en/wol/d/r1/lp-e/',
      wolLookup: 'https://wol.jw.org/en/wol/l/r1/lp-e?q=',
      webFinder: 'https://www.jw.org/finder?wtlocale=E&'
    };
  }
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
  scriptureRegex:
    /(('?)((?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.\u0410-\u044F\u0401\u0451]{2,}|song of solomon|песня саломона))((?: ?(?:\d{1,3})[:\u003A\u0437](?:\d{1,3})(?:[-,\u2013\u2014] ?\d{1,3})*;?)+))(\]|<\/a>)?/gimu,
  scriptureNoChpRegex: /(('?)(obadiah|ob|phm|philemon|(?:2|3)(?: )?jo(?:hn)?|jud(?:e)?)(?: ?)(\d{1,2}))(\]|<\/a>)?/gim,
  scriptureNoVerseRegex: /(('?)((?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.]{2,}|song of solomon))((?: ?(?:\d{1,3})(?![\d:]);?)+))(\]|<\/a>)?/gimu,
  wolLinkRegex: /(\[([^\[\]]*)\]\()?(https\:\/\/wol\.jw\.org[^\s\)]{2,})(\))?/gim,
  jworgLinkRegex: /(\[([^\[\]]*)\]\()?(https[^\s\)]+jw\.org[^\s\)]{2,})(\))?/gim,
  // Russian publication reference regex (only Russian format with абз.)
  // Russian: w25.01 28, абз. 11 OR w25.3 с. 8 абз. 2 OR ws12.02 15 абз. 2
  russianPubRegex: /w[s]?(\d{2})\.(\d{1,2})\s+(?:с\.\s*)?(\d+),?\s*абз\.\s*(\d+)/g,
  // Russian publication with month names regex (w25 Март с. 8 абз. 2, ws12 Февраль с. 15 абз. 2)
  russianPubMonthRegex: /w(s)?(\d{2})\s+(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+с\.\s*(\d+)\s+абз\.\s*(\d+)/gi,
  // Russian publication with day and month names regex (w10 15 Января с. 3 абз. 1, ws10 15 Января с. 3 абз. 1)
  russianPubDayMonthRegex: /w(s)?(\d{2})\s+(1|15)\s+(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+с\.\s*(\d+)\s+абз\.\s*(\d+)/gi,
  // English publication reference regex (formats like w65 6/1 p. 329 par. 6, ws12 2/15 15 par. 2)
  // English: w65 6/1 p. 329 par. 6, w24 1/15 p. 12 par. 3, ws12 2/15 15 par. 2
  englishPubRegex: /w[s]?(\d{2})\s+(\d{1,2}\/\d{1,2})\s+(?:p\.\s*)?(\d+)\s+par\.\s*(\d+)/gi,
  // English publication with month number format (w23.12 20 par. 7, ws23.12 p. 20 par. 7)
  // Used to support post-2016 style month-only references (YY.MM) in English.
  englishPubMonthNumberRegex: /w[s]?(\d{2})\.(\d{1,2})\s+(?:p\.\s*)?(\d+)\s+par\.\s*(\d+)/gi,
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
  otherPubRegex: /\b([a-z]{1,3}(?:-\d)?)\s+(?:(?:chap\.|глава|cap\.)\s*)?(\d+(?:\/\d+)?)\s*(?:(?:pp?\.|сс?\.|págs?\.)\s*(\d+(?:-\d+)?)\s+)?(?:(?:par\.|абз\.|párr\.)\s*(\d+))?/g,
  initialNumRegex: /^([\n\s]?)(\d{1,3}) /gim,
  delay: 3000,
};

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
  console.log('detectLanguage called with:', text);
  if (!text) {
    console.log('detectLanguage returning: EN (no text)');
    return 'EN';
  }

  // Check for Cyrillic characters (Russian)
  if (/[\u0400-\u04FF]/.test(text)) {
    console.log('detectLanguage returning: RU (Cyrillic detected)');
    return 'RU';
  }

  // Check for Spanish terms and patterns (check before other languages)
  if (/párr\.|cap\.|pág\.|págs\.|Apocalipsis|Romanos|Corintios|Gálatas|Efesios|Filipenses|Colosenses|Tesalonicenses|Timoteo|Hebreos|Pedro|^(1|2|3)\s*(Samuel|Reyes|Crónicas)/.test(text)) {
    console.log('detectLanguage returning: ES (Spanish terms detected)');
    return 'ES';
  }

  // Check for common German book patterns
  if (/^(1|2|3)\s*(Mose|Samuel|Könige|Chronik)|Offenbarung|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Hebräer|Petrus/.test(text)) {
    return 'DE';
  }

  // Check for French patterns
  if (/^(1|2|3)\s*(Samuel|Rois|Chroniques)|Apocalypse|Romains|Corinthiens|Galates|Éphésiens|Philippiens|Colossiens|Thessaloniciens|Timothée|Hébreux|Pierre/.test(text)) {
    return 'FR';
  }

  // Check for Dutch patterns
  if (/^(1|2|3)\s*(Samuel|Koningen|Kronieken)|Openbaring|Romeinen|Korintiërs|Galaten|Efeziërs|Filippenzen|Kolossenzen|Tessalonicenzen|Timotheüs|Hebreeën|Petrus/.test(text)) {
    return 'NL';
  }

  // Default to English
  console.log('detectLanguage returning: EN (default)');
  return 'EN';
}

/**
 * Get appropriate finder URL based on language
 * @param {string} lang - Language code (EN, RU, etc.)
 * @returns {string} - Finder URL
 */
function getFinderUrl(lang) {
  const urls = {
    'RU': 'https://www.jw.org/finder?wtlocale=U&',  // Russian uses 'U' for both JW Library and web finder
    'EN': 'https://www.jw.org/finder?wtlocale=E&',
    'DE': 'https://www.jw.org/finder?wtlocale=X&',
    'FR': 'https://www.jw.org/finder?wtlocale=F&',
    'NL': 'https://www.jw.org/finder?wtlocale=O&',
    'ES': 'https://www.jw.org/finder?wtlocale=S&'   // Spanish uses 'S'
  };
  return urls[lang] || urls['EN'];
}

/**
 * Get appropriate JW Library locale based on language
 * @param {string} lang - Language code (EN, RU, etc.)
 * @returns {string} - Locale string
 */
function getJWLibraryLocale(lang) {
  const locales = {
    'RU': '&wtlocale=U',  // Russian uses 'U' in JW Library
    'EN': '&wtlocale=E',
    'DE': '&wtlocale=X',
    'FR': '&wtlocale=F',
    'NL': '&wtlocale=O',
    'ES': '&wtlocale=S'   // Spanish uses 'S'
  };
  return locales[lang] || locales['EN'];
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
      const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

      if (publicationYear < 2016) {
        // Pre-2016: Use day/month format (w10 15/1 с. 3 абз. 1)
        const formatted = `${pubCode}${year} ${monthNumber}/${day} с. ${page} абз. ${paragraph}`;
        console.log('Auto-formatted Russian Watchtower (pre-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      } else {
        // Post-2016: Use .month format (w16.01 3, абз. 1)
        const formatted = `${pubCode}${year}.${monthNumber} ${page}, абз. ${paragraph}`;
        console.log('Auto-formatted Russian Watchtower (post-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      }
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
      console.log('Auto-formatted Russian Watchtower (month-only):', input, '→', formatted);
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
  s = s.replace(/\b(par\.)\s*(\d)/gi, '$1 $2');
  s = s.replace(/(абз\.|párr\.)\s*(\d)/gi, '$1 $2');
  // Chapter markers — same: глава and cap. don't use \b
  s = s.replace(/\b(chap\.)\s*(\d)/gi, '$1 $2');
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
  // First check for day + month format (w10 15 January p. 3 par. 1, ws10 15 January p. 3 par. 1)
  const dayMonthRegex = Config.englishPubDayMonthRegex;
  dayMonthRegex.lastIndex = 0;
  const dayMonthMatch = dayMonthRegex.exec(input);

  if (dayMonthMatch) {
    const [fullMatch, isStudy, year, day, monthName, page, paragraph] = dayMonthMatch;
    const monthNumber = EnglishMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

      if (publicationYear < 2016) {
        // Pre-2016: Use month/day format (w10 1/15 p. 3 par. 1)
        const formatted = `${pubCode}${year} ${monthNumber}/${day} p. ${page} par. ${paragraph}`;
        console.log('Auto-formatted English Watchtower (pre-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      } else {
        // Post-2016: Use month/day format but with current logic
        const defaultDay = monthNumber === '01' || monthNumber === '03' || monthNumber === '05' ||
          monthNumber === '07' || monthNumber === '08' || monthNumber === '10' ||
          monthNumber === '12' ? '1' : '15';
        const formatted = `${pubCode}${year} ${monthNumber}/${defaultDay} p. ${page} par. ${paragraph}`;
        console.log('Auto-formatted English Watchtower (post-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      }
    }
  }

  // Then check for month-only format (w25 March p. 8 par. 2, ws25 March p. 8 par. 2)
  const monthRegex = Config.englishPubMonthRegex;
  monthRegex.lastIndex = 0;
  const monthMatch = monthRegex.exec(input);

  if (monthMatch) {
    const [fullMatch, isStudy, year, monthName, page, paragraph] = monthMatch;
    const monthNumber = EnglishMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      const day = monthNumber === '01' || monthNumber === '03' || monthNumber === '05' ||
        monthNumber === '07' || monthNumber === '08' || monthNumber === '10' ||
        monthNumber === '12' ? '1' : '15'; // Simplified: 1st for odd months, 15th for even
      const formatted = `${pubCode}${year} ${monthNumber}/${day} p. ${page} par. ${paragraph}`;
      console.log('Auto-formatted English Watchtower (month-only):', input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  return input;
}

/**
 * Auto-format Spanish Watchtower publications with month names
 * @param {string} input - Input text to check and format
 * @returns {string} - Formatted text or original if no match
 */
function autoFormatSpanishWatchtower(input) {
  // First check for day + month format (w10 15 Enero pág. 3 párr. 1, ws10 15 Enero pág. 3 párr. 1)
  const dayMonthRegex = Config.spanishPubDayMonthRegex;
  dayMonthRegex.lastIndex = 0;
  const dayMonthMatch = dayMonthRegex.exec(input);

  if (dayMonthMatch) {
    const [fullMatch, isStudy, year, day, monthName, page, paragraph] = dayMonthMatch;
    const monthNumber = SpanishMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

      if (publicationYear < 2016) {
        // Pre-2016: Use month/day format (w10 1/15 pág. 3 párr. 1)
        const formatted = `${pubCode}${year} ${monthNumber}/${day} pág. ${page} párr. ${paragraph}`;
        console.log('Auto-formatted Spanish Watchtower (pre-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      } else {
        // Post-2016: Use month/day format but with current logic
        const defaultDay = monthNumber === '01' || monthNumber === '03' || monthNumber === '05' ||
          monthNumber === '07' || monthNumber === '08' || monthNumber === '10' ||
          monthNumber === '12' ? '1' : '15';
        const formatted = `${pubCode}${year} ${monthNumber}/${defaultDay} pág. ${page} párr. ${paragraph}`;
        console.log('Auto-formatted Spanish Watchtower (post-2016):', input, '→', formatted);
        return input.replace(fullMatch, formatted);
      }
    }
  }

  // Then check for month-only format (w25 Marzo pág. 8 párr. 2, ws25 Marzo pág. 8 párr. 2)
  const monthRegex = Config.spanishPubMonthRegex;
  monthRegex.lastIndex = 0;
  const monthMatch = monthRegex.exec(input);

  if (monthMatch) {
    const [fullMatch, isStudy, year, monthName, page, paragraph] = monthMatch;
    const monthNumber = SpanishMonths[monthName.toLowerCase()];
    const pubCode = isStudy ? 'ws' : 'w';

    if (monthNumber) {
      const day = monthNumber === '01' || monthNumber === '03' || monthNumber === '05' ||
        monthNumber === '07' || monthNumber === '08' || monthNumber === '10' ||
        monthNumber === '12' ? '1' : '15'; // Simplified: 1st for odd months, 15th for even
      const formatted = `${pubCode}${year} ${monthNumber}/${day} pág. ${page} párr. ${paragraph}`;
      console.log('Auto-formatted Spanish Watchtower (month-only):', input, '→', formatted);
      return input.replace(fullMatch, formatted);
    }
  }

  return input;
}

/**
 * Update interface language
 * @param {string} interfaceLang - Interface language (Russian, English, Spanish)
 */
function updateInterfaceLanguage(interfaceLang) {
  Lang = InterfaceStrings[interfaceLang] || InterfaceStrings.Russian;
}

/**
 * Test function for Russian publication regex
 * @param {string} input - Test input
 */
function testRussianPubRegex(input) {
  console.log('=== Testing Russian Publication Regex ===');
  console.log('Input:', JSON.stringify(input));
  console.log('Input length:', input.length);
  console.log('Input chars:', input.split('').map(c => `${c} (${c.charCodeAt(0)})`));

  // Test the regex directly
  const regex = /w(\d{2})\.(\d{1,2})\s+(\d+),?\s*абз\.\s*(\d+)/g;
  regex.lastIndex = 0;
  const match = regex.exec(input);

  console.log('Regex pattern:', regex.source);
  console.log('Match result:', match);

  if (match) {
    const [fullMatch, year, month, page, paragraph] = match;
    console.log('Parsed components:', { fullMatch, year, month, page, paragraph });

    // Test month lookup
    if (month) {
      const monthLower = month.toLowerCase();
      console.log('Month (lowercase):', monthLower);
      console.log('Month found in mapping:', RussianMonths[monthLower]);
    }

    // Test function - no URL generation needed
  } else {
    console.log('No match found');
    // Try simpler patterns
    console.log('Testing simpler patterns:');
    console.log('w24 match:', /w24/.test(input));
    console.log('Cyrillic match:', /[а-яёА-ЯЁ]/.test(input));
    console.log('с. match:', /с\./.test(input));
    console.log('Numbers match:', /\d+/.test(input));
  }

  return match;
}

/**
 * Test function for English publication regex
 * @param {string} input - Test input
 */
function testEnglishPubRegex(input) {
  console.log('=== Testing English Publication Regex ===');
  console.log('Input:', JSON.stringify(input));
  console.log('Input length:', input.length);
  console.log('Input chars:', input.split('').map(c => `${c} (${c.charCodeAt(0)})`));

  // Test the regex directly
  const regex = /w(\d{2})\s+(\d{1,2}\/\d{1,2})\s+p\.\s*(\d+)\s+par\.\s*(\d+)/g;
  regex.lastIndex = 0;
  const match = regex.exec(input);

  console.log('Regex pattern:', regex.source);
  console.log('Match result:', match);

  if (match) {
    const [fullMatch, year, monthDay, page, paragraph] = match;
    console.log('Parsed components:', { fullMatch, year, monthDay, page, paragraph });

    // Test month/day parsing
    if (monthDay) {
      const [month, day] = monthDay.split('/').map(n => parseInt(n));
      console.log('Parsed month/day:', { month, day });

      // Test month lookup
      const englishMonths = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const englishMonth = englishMonths[month];
      console.log('English month:', englishMonth);
    }
  } else {
    console.log('No match found');
    // Try simpler patterns
    console.log('Testing simpler patterns:');
    console.log('w65 match:', /w65/.test(input));
    console.log('p. match:', /p\./.test(input));
    console.log('par. match:', /par\./.test(input));
    console.log('Numbers match:', /\d+/.test(input));
  }

  return match;
}

function testScriptureRegex(input) {
  console.log('=== Testing Scripture Regex ===');
  console.log('Input:', JSON.stringify(input));

  const regex = /(('?)((?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.\u0410-\u044F\u0401\u0451]{2,}|song of solomon|песня саломона))((?: ?(?:\d{1,3})[:\u003A\u0437](?:\d{1,3})(?:[-,\u2013\u2014] ?\d{1,3})*;?)+))(\]|<\/a>)?/gimu;
  regex.lastIndex = 0;
  const match = regex.exec(input);

  console.log('Scripture regex match:', match);

  if (match) {
    const [fullMatch, , , bookName, chapterVerse] = match;
    console.log('Parsed scripture:', { fullMatch, bookName, chapterVerse });
  } else {
    console.log('No scripture match found');
    // Test individual parts
    console.log('Book name test:', /(?:[123][\u0020\u00A0]?)?(?:[\p{L}\p{M}\.\u0410-\u044F\u0401\u0451]{2,}|song of solomon|песня саломона)/giu.exec(input));
    console.log('Numbers test:', /\d{1,3}[:\u003A\u0437]\d{1,3}/g.exec(input));
  }

  return match;
}

class JWLLinkerPlugin extends Plugin {
  constructor() {
    //// biome-ignore lint/style/noArguments:
    super(...arguments);
    /** @type {Object} */
    this.settings = {};
    /** @type {Menu} */
    this.menu = new Menu();
    this.menuClass = 'jwl-linker-plugin-menu-container';
  }

  /**
   * Resolve 'Auto' language setting to actual language code
   * Based on user's locale or interface language setting
   * @returns {string} Language code: 'ru', 'en', or 'es'
   */
  _resolveAutoLanguage() {
    // Try to detect from interface language setting
    const interfaceLang = this.settings.interfaceLang;
    if (interfaceLang === 'Russian') return 'ru';
    if (interfaceLang === 'Spanish') return 'es';
    if (interfaceLang === 'English') return 'en';

    // Try to detect from browser/system locale
    const locale = navigator.language || navigator.userLanguage || 'en';
    const langCode = locale.split('-')[0].toLowerCase();

    // Map to supported languages
    if (langCode === 'ru') return 'ru';
    if (langCode === 'es') return 'es';

    // Default to English if not in supported list
    return 'en';
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
      const alternatives = ['en', 'ru', 'es'].filter(l => l !== firstLang);
      return { firstLang, secondLang: alternatives[0] };
    }

    return { firstLang, secondLang };
  }

  /**
   * Get language label for display
   * @param {string} langCode - Language code: 'ru', 'en', 'es'
   * @returns {string} Formatted label like '**Russian:**'
   */
  _getLanguageLabel(langCode) {
    const labels = {
      'ru': Lang.dualLangOptions?.ru || 'Russian',
      'en': Lang.dualLangOptions?.en || 'English',
      'es': Lang.dualLangOptions?.es || 'Spanish'
    };
    return `**${labels[langCode]}:**`;
  }

  async onload() {
    await this.loadSettings();

    /** @namespace */
    this.api = {
      getAllScriptureLinks: this._parseScriptureLinks,
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

    // Cache the populated menu
    this.menu = null;

    // Add the global Open JWL Menu command (for Mobile toolbar)
    this.addCommand({
      id: this.MenuName.id,
      name: this.MenuName.text,
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
          this.buildMenu(submenu);
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

    // biome-ignore lint: ⚠️
    console.log(
      `%c${this.manifest.name} ${this.manifest.version} loaded`,
      'background-color: purple; padding:4px; border-radius:4px',
    );

    if (this.settings.debug) {
      window.testRussianPubRegex = testRussianPubRegex;
      window.testEnglishPubRegex = testEnglishPubRegex;
      window.testLanguageDetection = (input) => {
        console.log('=== Testing Language Detection ===');
        console.log('Input:', input);
        const detected = detectLanguage(input);
        console.log('Detected language:', detected);
        return detected;
      };
      window.testAutoFormatting = (input) => {
        console.log('=== Testing Auto-formatting ===');
        console.log('Original:', input);
        let formatted = autoFormatRussianWatchtower(input);
        if (formatted !== input) {
          console.log('Russian formatted:', formatted);
          return formatted;
        }
        formatted = autoFormatEnglishWatchtower(input);
        if (formatted !== input) {
          console.log('English formatted:', formatted);
          return formatted;
        }
        formatted = autoFormatSpanishWatchtower(input);
        if (formatted !== input) {
          console.log('Spanish formatted:', formatted);
          return formatted;
        }
        console.log('No formatting applied');
        return input;
      };
    }
  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Update interface language based on settings
    updateInterfaceLanguage(this.settings.interfaceLang);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(JWL_LINKER_VIEW).first();
    if (!leaf) {
      leaf = workspace.getRightLeaf(false); // false => no split
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
      window.open(Config.wolLookup + selection);
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
      let citationHeader, successMessage;
      if (this.settings.interfaceLang === 'Russian') {
        citationHeader = '> [!cite] ЦИТАТА';
        successMessage = 'Текст оформлен как цитата';
      } else if (this.settings.interfaceLang === 'Spanish') {
        citationHeader = '> [!cite] CITA';
        successMessage = 'Texto formateado como cita';
      } else {
        citationHeader = '> [!cite] QUOTE';
        successMessage = 'Text formatted as citation';
      }

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
    const citations = [];

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

      // 2. Find Russian publication references (w25.01 28, абз. 11)
      const ruPubRegex = new RegExp(Config.russianPubRegex.source, 'gi');
      while ((match = ruPubRegex.exec(content)) !== null) {
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

      // 3. Find English publication references (w65 6/1 p. 329 par. 6)
      const enPubRegex = new RegExp(Config.englishPubRegex.source, 'gi');
      while ((match = enPubRegex.exec(content)) !== null) {
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

      // 3b. Find English publication references with month number (w23.12 20 par. 7)
      const enPubMonthNumberRegex = new RegExp(Config.englishPubMonthNumberRegex.source, 'gi');
      while ((match = enPubMonthNumberRegex.exec(content)) !== null) {
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
      const otherPubRegex = new RegExp(Config.otherPubRegex.source, 'gi');
      while ((match = otherPubRegex.exec(content)) !== null) {
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

    // If user provided a specific paragraph, prefer callout format even in single-mode
    // so the extracted text is grouped under a [!cite] block.
    if (command === Cmd.citePublicationLookup) {
      const hasParagraph = /(?:\bpar\.\s*\d+|\bабз\.\s*\d+|\bpárr\.\s*\d+)/i.test(input);
      if (hasParagraph) {
        command = Cmd.citeVerseCallout;
      }
    }

    // Check if it's a Russian publication reference first (only абз. format)
    Config.russianPubRegex.lastIndex = 0;
    if (Config.russianPubRegex.test(input)) {
      return await this._fetchRussianPublicationCitation(input, view, command);
    }

    // Check if it's an English publication reference
    Config.englishPubRegex.lastIndex = 0;
    if (Config.englishPubRegex.test(input)) {
      return await this._fetchEnglishPublicationCitation(input, view, command);
    }

    // Check if it's an English publication reference with month number (w23.12 20 par. 7)
    Config.englishPubMonthNumberRegex.lastIndex = 0;
    if (Config.englishPubMonthNumberRegex.test(input)) {
      return await this._fetchEnglishMonthNumberPublicationCitation(input, view, command);
    }

    // Check if it's another JW publication reference (od, it-1, it-2, si, etc.)
    Config.otherPubRegex.lastIndex = 0;
    if (Config.otherPubRegex.test(input)) {
      return await this._fetchOtherPublicationCitation(input, view, command);
    }

    // Fallback to lookup citation
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

      if (selection !== originalSelection) {
        console.log('Auto-formatted Watchtower publication:', originalSelection, '→', selection);
        // Update the editor with the formatted text
        activeEditor.replaceSelection(selection);
        // Update the selection for further processing
        const newSelection = this._getEditorSelection(activeEditor);
        selection = newSelection.selection.trim();
      }

      loadingNotice = new Notice(`${Lang.loadingCitation} ${selection}`); // remain open until we complete
      const view = await this.getView();
      switch (command) {
        case Cmd.citeVerse:
        case Cmd.citeVerseCallout:
          // Check if it's a Russian publication reference first
          Config.russianPubRegex.lastIndex = 0; // Reset regex
          if (Config.russianPubRegex.test(selection)) {
            this._fetchRussianPublicationCitation(selection, view, command).then(replaceEditorSelection);
          } else {
            // Check if it's an English publication reference
            Config.englishPubRegex.lastIndex = 0; // Reset regex
            Config.englishPubMonthNumberRegex.lastIndex = 0;
            if (Config.englishPubRegex.test(selection)) {
              this._fetchEnglishPublicationCitation(selection, view, command).then(replaceEditorSelection);
            } else if (Config.englishPubMonthNumberRegex.test(selection)) {
              this._fetchEnglishMonthNumberPublicationCitation(selection, view, command).then(replaceEditorSelection);
            } else {
              // Check if it's another JW publication reference (od, it-1, it-2, si, etc.)
              Config.otherPubRegex.lastIndex = 0; // Reset regex
              if (Config.otherPubRegex.test(selection)) {
                this._fetchOtherPublicationCitation(selection, view, command).then(replaceEditorSelection);
              } else {
                // Convert Scripture reference into bible verse citation (+ JW Library MD URL*)
                if (this.settings.dualModeVerses) {
                  // Dual mode: show Bible verses in two configured languages
                  this._fetchDualBibleCitation(selection, view, caret, command).then(replaceEditorSelection);
                } else {
                  this._fetchBibleCitation(selection, view, caret, command).then(replaceEditorSelection);
                }
              }
            }
          }
          break;
        case Cmd.citeParagraph:
        case Cmd.citeParagraphCallout:
        case Cmd.addLinkTitle:
          // Convert JW.Org Finder-type URL to a paragraph citation (+ JW Library MD URL*)
          this._fetchParagraphCitation(selection, view, caret, command, pars).then(replaceEditorSelection);
          break;
        case Cmd.citePublicationLookup:
          if (this.settings.dualModePublications) {
            // Dual mode: show publications in two configured languages
            this._fetchDualPublicationCitation(selection, view, command).then(replaceEditorSelection);
          } else {
            // Single mode: check if it's a Russian publication reference first (only абз. format)
            Config.russianPubRegex.lastIndex = 0;
            if (Config.russianPubRegex.test(selection)) {
              this._fetchRussianPublicationCitation(selection, view, command).then(replaceEditorSelection);
            } else {
              // Check if it's an English publication reference
              Config.englishPubRegex.lastIndex = 0; // Reset regex
              Config.englishPubMonthNumberRegex.lastIndex = 0;
              if (Config.englishPubRegex.test(selection)) {
                this._fetchEnglishPublicationCitation(selection, view, command).then(replaceEditorSelection);
              } else if (Config.englishPubMonthNumberRegex.test(selection)) {
                this._fetchEnglishMonthNumberPublicationCitation(selection, view, command).then(replaceEditorSelection);
              } else {
                // Check if it's another JW publication reference (od, it-1, it-2, si, etc.)
                Config.otherPubRegex.lastIndex = 0; // Reset regex
                if (Config.otherPubRegex.test(selection)) {
                  this._fetchOtherPublicationCitation(selection, view, command).then(replaceEditorSelection);
                } else {
                  // Convert Publication lookup into a article citation (original behavior)
                  this._fetchLookupCitation(selection, view).then(replaceEditorSelection);
                }
              }
            }
          }
          break;
      }
    } else {
      new Notice(Lang.noSelection, Config.delay);
    }

    function replaceEditorSelection(output) {
      // Any errors will be part of the result
      activeEditor.replaceSelection(output);
      // try to select the original reference, first line (helps user delete it quickly if needed)
      const last = activeEditor.getLine(line).length;
      activeEditor.setSelection({ line: line, ch: 0 }, { line: line, ch: last });
      loadingNotice.hide();
    }
  }

  /**
   * Check if there is an active editor, and attempt to return it
   * @param {Editor} editor
   * @returns {Editor}
   */
  confirmEditor(editor) {
    let activeEditor = editor;
    if (!activeEditor?.hasFocus()) {
      const view = this.app.workspace.getMostRecentLeaf().view;
      if (view) {
        activeEditor = view.editor;
      }
    }
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
    if (document.querySelector(`.menu${this.menuClass}`)) return;

    if (!this.menu) {
      this.menu = this.buildMenu();
    }

    if (!editor || !editor.hasFocus()) {
      new Notice(Lang.noEditor, Config.delay);
      return;
    }
    const cursor = editor.getCursor('from');
    const offset = editor.posToOffset(cursor);
    const coords = editor.cm.coordsAtPos(offset);
    this.menu.showAtPosition({
      x: coords.right,
      y: coords.top + 20,
    });
  }

  /**
   * Prepare the dropdown menu. Each menu item calls its command counterpart
   * @param {*} submenu submenu instance of a parent menu; if empty create new menu
   * @returns New menu ready to use
   */
  buildMenu(submenu = undefined) {
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
        item.onClick(() => this.app.commands.executeCommandById(`${this.manifest.id}:${cmd.id}`));
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
        fn: (editor) => this.insertCitation(editor, Cmd.citeParagraph, 1),
      },
      {
        id: `${Cmd.citeParagraphCallout}`,
        text: Lang.menuCiteJworgCallout,
        icon: 'lucide-panel-top-open',
        fn: (editor) => this.insertCitation(editor, Cmd.citeParagraphCallout, 1),
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
      const mdLink = `[${link.title}](${Config.jwlFinder}&docid=${link.docId}&par=${link.parId})`;
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
    if (references) {
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
          const citation = calloutBlock.template
            .replace('{title}', calloutBlock.title)
            .replace('{text}', combinedText);
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
          if (verses) {
            view?.addToHistory?.(passage.link.jwlib, title, verses);
            view?.showHistory?.();
            const text = verses.join('');
            let template = '';
            if (command === Cmd.citeVerse) {
              template = this.settings.verseTemplate;
              const citation = template.replace('{title}', title).replace('{text}', text);
              output.push(citation);
            } else if (command === Cmd.citeVerseCallout) {
              template = this.settings.verseCalloutTemplate;

              // Make Bible callout header dynamic based on detected language
              let lang = this.settings?.lang || 'Auto';
              if (lang === 'Auto') {
                lang = detectLanguage(input);
              } else {
                lang = Languages[lang] || 'EN';
              }

              // Replace the Bible header based on detected language
              if (lang === 'RU') {
                template = template.replace(/BIBLE|BIBLIA/g, 'БИБЛИЯ');
              } else if (lang === 'ES') {
                template = template.replace(/BIBLE|БИБЛИЯ/g, 'BIBLIA');
              } else {
                template = template.replace(/БИБЛИЯ|BIBLIA/g, 'BIBLE');
              }

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
    return `${passage.displayFull} | ${Lang[OutputError.invalidScripture]}`;
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
    console.log('Fetching dual Bible citation for:', input);

    // Get configured languages
    const { firstLang, secondLang } = this._getDualLanguages();
    console.log('Dual mode languages for Bible:', { firstLang, secondLang });

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
    const langMap = {
      'en': 'EN',
      'ru': 'RU',
      'es': 'ES'
    };
    const upperLang = langMap[langCode] || 'EN';

    // Build verse ID from parIds
    const bookChapId = passage.link.parIds[0]?.substring(0, 5) || '';
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

    console.log(`Fetching Bible verse for ${langCode}:`, jworgUrl);

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
      let title = passage.displayFull;
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

        // Make Bible callout header dynamic based on language
        if (langCode === 'ru') {
          template = template.replace(/BIBLE|BIBLIA/g, 'БИБЛИЯ');
        } else if (langCode === 'es') {
          template = template.replace(/BIBLE|БИБЛИЯ/g, 'BIBLIA');
        } else {
          template = template.replace(/БИБЛИЯ|BIBLIA/g, 'BIBLE');
        }
      }

      return template.replace('{title}', title).replace('{text}', text);
    } catch (error) {
      console.error(`Error fetching Bible verse for ${langCode}:`, error);
      return `[${langCode}] ${Lang[OutputError.onlineLookupFailed]}`;
    }
  }

  /**
   * Fetch Russian publication citation (e.g., w25.01 28, абз. 11)
   * @param {string} input - Russian publication reference
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchRussianPublicationCitation(input, view, command) {
    console.log('Trying to parse Russian publication:', input);

    // Use exec for proper group extraction - Russian format only
    // Supports both w (Watchtower) and ws (Watchtower Study)
    const regex = /w(s)?(\d{2})\.(\d{1,2})\s+(\d+),?\s*абз\.\s*(\d+)/g;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    console.log('Match found:', match);
    const [fullMatch, isStudy, year, monthNum, page, paragraph] = match;
    console.log('Parsed:', { fullMatch, year, monthNum, page, paragraph });

    // Check if Watchtower year is available online
    const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    const availability = checkPublicationAvailability('w', 'RU', publicationYear);
    if (availability.isOffline) {
      console.log('Russian Watchtower not available for year:', publicationYear);
      return `${input}\n${availability.message}`;
    }

    // Create WOL search URL directly
    const englishMonths = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const englishMonth = englishMonths[parseInt(monthNum)];
    const searchQuery = `w${year} ${englishMonth}`;
    const wolUrl = `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(searchQuery)}`;
    console.log('Generated WOL URL:', wolUrl);

    // Convert month number to Russian month name for display
    const monthNames = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const monthName = monthNames[parseInt(monthNum)];
    // Calculate full year correctly (90 = 1990, 25 = 2025)
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    const pubName = isStudy ? 'Сторожевая башня (выпуск для изучения)' : 'Сторожевая башня';
    const pubCode = isStudy ? 'ws' : 'w';
    const title = `${pubName} ${fullYear} ${monthName} с. ${page} абз. ${paragraph}`;

    // Create JW Library search URL for Russian
    const jwlibUrl = `jwlibrary:///finder?wtlocale=RU&q=${encodeURIComponent(`${pubCode}${year}.${monthNum}`)}`;

    const output = [];
    output.push(input); // keep original input on first line

    // Create multiple search links for Russian publications
    const paddedMonth = monthNum.padStart(2, '0');

    const altSearch1 = `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(`w${year}/${paddedMonth}`)}`;
    const altSearch2 = `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(`"Сторожевая башня" ${fullYear} ${monthName}`)}`;

    const searchLinks = [
      `[WOL: w${year}.${monthNum}](${wolUrl})`,
      `[WOL: w${year}/${paddedMonth}](${altSearch1})`,
      `[WOL: "${fullYear} ${monthName}"](${altSearch2})`
    ];

    const webLink = searchLinks.join(' • ');

    // For Russian publications, just create a link without trying to extract content
    // since WOL search pages don't have extractable content
    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${jwlibUrl})`;
    }

    // Add to history
    view?.addToHistory?.(jwlibUrl, title, [`Варианты поиска: ${webLink}`]);
    view?.showHistory?.();

    // Format citation - show multiple search options
    let template = '';
    if (command === Cmd.citeVerse || command === Cmd.citePublicationLookup) {
      template = command === Cmd.citePublicationLookup
        ? this.settings.pubCalloutTemplate
        : this.settings.pubTemplate;
    } else if (command === Cmd.citeVerseCallout) {
      template = this.settings.pubCalloutTemplate;
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', webLink);
    output.push(citation);

    return output.join('\n');
  }

  /**
   * Fetch Russian publication citation in callout format (for dual mode)
   * @param {string} input - Russian publication reference
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation in callout format
   */
  async _fetchRussianPublicationCitationCallout(input, view, command) {
    console.log('Trying to parse Russian publication for callout:', input);

    // Use exec for proper group extraction - Russian format only
    // Supports both w (Watchtower) and ws (Watchtower Study)
    const regex = /w(s)?(\d{2})\.(\d{1,2})\s+(\d+),?\s*абз\.\s*(\d+)/g;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for Russian callout:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    const [fullMatch, isStudy, year, monthNum, page, paragraph] = match;
    console.log('Russian callout parsed:', { fullMatch, isStudy, year, monthNum, page, paragraph });

    // Convert month number to Russian month name for display
    const monthNames = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const monthName = monthNames[parseInt(monthNum)];
    // Calculate full year correctly (90 = 1990, 25 = 2025)
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    const pubName = isStudy ? 'Сторожевая башня (выпуск для изучения)' : 'Сторожевая башня';
    const pubCode = isStudy ? 'ws' : 'w';
    const title = `${pubName} ${fullYear} ${monthName} с. ${page} абз. ${paragraph}`;

    // Use Russian WOL search (same approach as English but with Russian locale)
    const russianInput = `${pubCode}${year}.${monthNum} ${page} абз. ${paragraph}`;
    const russianLookupUrl = `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(russianInput)}`;

    // Create JW Library search URL for Russian
    const jwlibUrl = `jwlibrary:///finder?wtlocale=RU&q=${encodeURIComponent(`${pubCode}${year}.${monthNum}`)}`;

    // Create link title with WOL search link (like English version)
    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${russianLookupUrl})`;
    }

    // Try to fetch real content from Russian WOL search
    let content = [];
    let text = '';
    const cache = view?.getFromHistory?.(russianLookupUrl); // try the cache first
    if (cache) {
      content = cache.content;
    } else {
      const dom = await this._fetchDOM(russianLookupUrl);
      if (dom) {
        // Try to extract content from Russian WOL search results (same selectors as English)
        text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
        if (!text) {
          // Try alternative selectors
          text = this._getElementAsText(dom, '.searchResult', TargetType.jwonline);
        }
        if (!text) {
          // Try more selectors for Russian WOL
          const altSelectors = [
            '.cardLine1',
            '.cardLine2',
            '.cardTitleBlock',
            '.result'
          ];

          for (const selector of altSelectors) {
            text = this._getElementAsText(dom, selector, TargetType.jwonline);
            if (text) break;
          }
        }

        if (!text) {
          text = `**${paragraph}** Русский текст не найден. Попробуйте поиск: [${russianInput}](${russianLookupUrl})`;
        }
        content.push(text);
      } else {
        content.push(`**${paragraph}** Не удалось загрузить WOL. Попробуйте: [${russianInput}](${russianLookupUrl})`);
      }
    }

    if (content.length > 0) {
      view?.addToHistory?.(russianLookupUrl, citationTitle, content);
      view?.showHistory?.();
      text = content.join('');
      text = this._boldInitialNumber(text);

      // Check if paragraph content was actually found
      if (!text || text.includes('Русский текст не найден') || text.includes('Не удалось загрузить WOL')) {
        text = `На странице нет нумерации абзацев. Попробуйте поиск: [${russianInput}](${russianLookupUrl}). ${text}`;
      }
    } else {
      text = `На странице нет нумерации абзацев. **${paragraph}** Содержимое не найдено. Попробуйте поиск: [${russianInput}](${russianLookupUrl})`;
    }

    // Use callout template like English version
    let template = this.settings.pubCalloutTemplate;
    // Keep "ПУБЛ." for Russian
    // Check if template is actually a callout (user editable):
    // If so all lines need to be part of the callout syntax
    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      const trimmed = template.trimStart();
      const leadingWs = template.slice(0, template.length - trimmed.length);
      template = `${leadingWs}> ${trimmed}`;
    }

    if (template.includes('[!cite]')) {
      text = text.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>');
    } else if (template[0] === '>') {
      text = text.replace(/^./gm, '>$&').substring(1);
    }
    const citation = template.replace('{title}', citationTitle).replace('{text}', text);

    const output = `${input}\n${citation}`;
    return output;
  }

  /**
   * Fetch English publication citation (e.g., w65 6/1 p. 329 par. 6)
   * @param {string} input - English publication reference
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchEnglishPublicationCitation(input, view, command) {
    console.log('Trying to parse English publication:', input);

    // Use exec for proper group extraction - English format (paragraph optional)
    // Supports both w (Watchtower) and ws (Watchtower Study)
    const regex = /w(s)?(\d{2})\s+(\d{1,2}\/\d{1,2})\s+(?:p\.\s*)?(\d+)(?:\s+par\.\s*(\d+))?/gi;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for English publication:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    console.log('English publication match found:', match);
    const [fullMatch, isStudy, year, monthDay, page, paragraph] = match;
    console.log('Parsed:', { fullMatch, year, monthDay, page, paragraph });

    // Check if Watchtower year is available online
    const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    const availability = checkPublicationAvailability('w', 'EN', publicationYear);
    if (availability.isOffline) {
      console.log('English Watchtower not available for year:', publicationYear);
      return `${input}\n${availability.message}`;
    }

    // Parse month/day format (e.g., "6/1" -> month=6, day=1)
    const [month, day] = monthDay.split('/').map(n => parseInt(n));

    // Create English month names
    const englishMonths = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const englishMonth = englishMonths[month];

    // Create title for display - handle year conversion properly
    // For years like 65, it should be 1965; for years like 24, it could be 1924 or 2024
    // Since w65 is clearly 1965, we'll assume years < 50 are 20xx, >= 50 are 19xx
    const displayYear = parseInt(year) >= 50 ? `19${year}` : `20${year}`;
    const pubName = isStudy ? 'The Watchtower (Study Edition)' : 'The Watchtower';
    const title = `${pubName} ${displayYear} ${englishMonth} ${day} p. ${page}${paragraph ? ` par. ${paragraph}` : ''}`;

    // Create better search URLs for English publications
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');

    // Detect language and get appropriate config first
    let lang = this.settings?.lang || 'Auto';
    if (lang === 'Auto') {
      lang = detectLanguage(input);
    } else {
      lang = Languages[lang] || 'EN';
    }

    const isRussian = lang === 'RU';
    const langConfig = getConfigForLanguage(lang);

    console.log('Detected language for English publication:', lang, 'isRussian:', isRussian);

    // For old publications, try different search strategies and direct links
    // Try direct WOL publication links for old magazines
    const pubCode = isStudy ? 'ws' : 'w';
    const directWolUrl = `${langConfig.wolPublications}${displayYear}/${paddedMonth}/${paddedDay}`;

    // Fallback search URLs - include paragraph number for better content matching
    const searchQuery1 = `${pubCode}${year} ${month}/${day} p. ${page} par. ${paragraph}`;
    const searchQuery2 = `${pubCode}${year} ${month}/${day}`;
    const searchQuery3 = `"${pubName}" ${displayYear} ${englishMonth} ${day}`;

    const wolUrl1 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery1)}`;
    const wolUrl2 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery2)}`;
    const wolUrl3 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery3)}`;

    console.log('Generated English WOL URLs:', { directWolUrl, wolUrl1, wolUrl2, wolUrl3 });

    // For old publications (pre-2000), use JW.org finder format with docid
    const isOldPublication = parseInt(displayYear) < 2000;

    let jwlibUrl;
    if (isOldPublication) {
      // For old publications, use JW.org finder format like JW Library generates
      // Format: https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&docid=1965402&par=8
      // Calculate docid automatically based on year, month, and day
      // Paragraph adjustment varies by year: w50 uses +1, w65 uses +2
      // TEMPORARILY DISABLED - testing without adjustment
      let adjustedParagraph = parseInt(paragraph); // No adjustment for testing
      // if (parseInt(displayYear) <= 1955) {
      //   adjustedParagraph = parseInt(paragraph) + 1; // w50 1/1 par 3 → par 4
      // } else {
      //   adjustedParagraph = parseInt(paragraph) + 2; // w65 6/1 par 6 → par 8
      // }

      // Calculate issue number for docid based on known examples:
      // w50 1/1 → docid=1950003 (January 1st = issue 003)
      // w50 12/15 → docid=1950925 (December 15th = issue 925)
      // w65 6/1 → docid=1965402 (June 1st = issue 402)
      // w90 1/1 → docid=1990004 (January 1st = issue 004)
      // Pattern: seems to be sequential numbering within each year

      let issueNumber;

      // Create a lookup table for known values and interpolate
      const knownIssues = {
        1950: {
          1: { 1: 3 },      // w50 1/1 = issue 3
          12: { 15: 925 }   // w50 12/15 = issue 925
        },
        1965: { 6: { 1: 402 } },  // w65 6/1 = issue 402
        1990: { 1: { 1: 4 } }     // w90 1/1 = issue 4
      };

      // Check if we have exact match
      if (knownIssues[parseInt(displayYear)] &&
        knownIssues[parseInt(displayYear)][month] &&
        knownIssues[parseInt(displayYear)][month][day]) {
        issueNumber = knownIssues[parseInt(displayYear)][month][day];
      } else {
        // Estimate based on bi-weekly pattern (24 issues per year)
        // January 1st is typically issue 1-3, so we'll use a simple formula
        const issueInYear = (month - 1) * 2 + (day === 15 ? 2 : 1);

        // Adjust based on year - this is a rough estimate
        if (parseInt(displayYear) >= 1960) {
          issueNumber = issueInYear + 390; // Based on w65 pattern
        } else {
          issueNumber = issueInYear; // Based on w50 pattern
        }
      }

      const docid = `${displayYear}${issueNumber}`;
      jwlibUrl = `https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&docid=${docid}&par=${adjustedParagraph}`;
      console.log('Old publication - calculated docid:', docid, 'for', `w${year} ${month}/${day}`);
    } else {
      // For newer publications, try direct link
      jwlibUrl = `jwlibrary:///publication/w/${displayYear}/${paddedMonth}/${paddedDay}`;
      console.log('Modern publication - using direct JW Library link:', jwlibUrl);
    }

    const output = [];
    output.push(input); // keep original input on first line

    // Create different search links for old vs new publications
    let searchLinks;
    if (isOldPublication) {
      // For old publications, provide note about manual search + WOL search options
      searchLinks = [
        `📚 *Old publication - JW Library link may need manual docid adjustment*`,
        `[WOL Search: w${year} ${month}/${day}](${wolUrl1})`,
        `[WOL Search: "${displayYear} ${englishMonth} ${day}"](${wolUrl2})`,
        `[WOL Search: w${displayYear}](${wolUrl3})`
      ];
    } else {
      searchLinks = [
        `[WOL Direct: ${displayYear}/${paddedMonth}/${paddedDay}](${directWolUrl})`,
        `[WOL Search: w${year} ${month}/${day}](${wolUrl1})`,
        `[WOL Search: "${displayYear} ${englishMonth} ${day}"](${wolUrl2})`,
        `[WOL Search: w${displayYear}](${wolUrl3})`
      ];
    }

    const webLink = searchLinks.join(' • ');

    // Create citation title with optional link
    let citationTitle = title;
    if (this.settings.citationLink) {
      // For old publications, use WOL search link instead of JW Library finder
      const linkUrl = isOldPublication ? wolUrl1 : jwlibUrl;
      citationTitle = `[${title}](${linkUrl})`;
    }

    // Try to fetch actual content from WOL for both old and modern publications
    let actualText = '';

    // Use search URL like modern publications do, not direct links
    const contentUrl = wolUrl1; // Use search URL: w90 1/1

    const cache = view?.getFromHistory?.(contentUrl);
    if (cache) {
      actualText = cache.content.join('');
    } else {
      try {
        const dom = await this._fetchDOM(contentUrl);
        if (dom) {
          // Try to extract content from direct WOL page (same selectors as modern publications)
          let text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
          if (!text) {
            // Try selectors for direct publication pages
            const directSelectors = ['.docSubContent', '.bodyTxt', '.sb', '.so', '.sc', '.si', '.se'];
            for (const selector of directSelectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (!text) {
            // Fallback to search result selectors
            const searchSelectors = ['.searchResult', '.cardLine1', '.cardLine2', '.result', '.pub-content'];
            for (const selector of searchSelectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (text) {
            actualText = this._boldInitialNumber(text);
            // Cache the result
            view?.addToHistory?.(contentUrl, `WOL Direct: ${displayYear}/${paddedMonth}/${paddedDay}`, [actualText]);
          }
        }
      } catch (error) {
        console.log('Failed to fetch content from WOL:', error);
      }
    }

    // Add to history
    const historyContent = actualText ? [actualText, `Search options: ${webLink}`] : [`Search options: ${webLink}`];
    view?.addToHistory?.(jwlibUrl, title, historyContent);
    view?.showHistory?.();

    // Format citation - show multiple search options
    let template = '';
    if (command === Cmd.citeVerse || command === Cmd.citePublicationLookup) {
      // For old publications, always use callout format but don't extract text
      // since WOL doesn't have reliable paragraph-level content for old publications
      if (isOldPublication) {
        template = this.settings.pubCalloutTemplate;
      } else {
        template = (command === Cmd.citePublicationLookup && paragraph)
          ? this.settings.pubCalloutTemplate
          : this.settings.pubTemplate;
      }
    } else if (command === Cmd.citeVerseCallout) {
      template = this.settings.pubCalloutTemplate;
    }

    // For English publications, use "PUB." instead of "ПУБЛ."
    template = template.replace('ПУБЛ.', 'PUB.');

    // Fix template to not break markdown links - remove quotes and italics around {text}
    if (template.includes('"*{text}*"')) {
      template = template.replace('"*{text}*"', '{text}');
    } else if (template.includes('*{text}*') || template.includes('"{text}"')) {
      // Handle case where there might be newlines or other characters
      // Remove both quotes and italics around {text}
      template = template.replace(/"?\*?\{text\}\*?"?/g, '{text}');
    }

    // Use actual text if available for both old and modern publications
    // If no text found, fall back to search links
    let textToUse = actualText || webLink;

    // Check if paragraph was specified but no content found, or if no paragraph was specified
    if (paragraph && !actualText) {
      textToUse = `No paragraph numbering found on the page. Try search: [${searchQuery1}](${wolUrl1}). ` + textToUse;
    } else if (!paragraph) {
      textToUse = `No paragraph numbering found on the page. Specify paragraph number to get content. Try search: [${searchQuery2}](${wolUrl2}). ` + textToUse;
    }

    // If using callout template, format text properly for callout
    if (template.includes('> [!cite]')) {
      // Format text for callout - each line should start with '>' but avoid double '>'
      // First remove any existing '>' at the start, then add single '>'
      textToUse = textToUse.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>');
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', textToUse);
    output.push(citation);

    return output.join('\n');
  }

  /**
   * Fetch English publication citation with month number format (w23.12 20 par. 7)
   * @param {string} input - English publication reference with month number
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchEnglishMonthNumberPublicationCitation(input, view, command) {
    console.log('Trying to parse English month-number publication:', input);

    const regex = /w(s)?(\d{2})\.(\d{1,2})\s+(?:p\.\s*)?(\d+)\s+par\.\s*(\d+)/gi;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for English month-number publication:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    const [, isStudy, year, monthNum, page, paragraph] = match;
    const publicationYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    const availability = checkPublicationAvailability('w', 'EN', publicationYear);
    if (availability.isOffline) {
      console.log('English Watchtower not available for year:', publicationYear);
      return `${input}\n${availability.message}`;
    }

    const month = parseInt(monthNum);
    const englishMonths = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const englishMonth = englishMonths[month] || monthNum;

    const displayYear = publicationYear.toString();
    const pubName = isStudy ? 'The Watchtower (Study Edition)' : 'The Watchtower';
    const title = `${pubName} ${displayYear} ${englishMonth} p. ${page} par. ${paragraph}`;

    // Detect language and get appropriate config
    let lang = this.settings?.lang || 'Auto';
    if (lang === 'Auto') {
      lang = detectLanguage(input);
    } else {
      lang = Languages[lang] || 'EN';
    }

    const langConfig = getConfigForLanguage(lang);
    const pubCode = isStudy ? 'ws' : 'w';

    // Use WOL lookup/search URL (monthly issues don't have a stable /YYYY/MM/DD path)
    const query = `${pubCode}${year}.${month} p. ${page} par. ${paragraph}`;
    const wolUrl = `${langConfig.wolLookup}${encodeURIComponent(query)}`;

    const output = [];
    output.push(input);

    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${wolUrl})`;
    }

    // Try to fetch content
    let actualText = '';
    const cache = view?.getFromHistory?.(wolUrl);
    if (cache) {
      actualText = cache.content.join('');
    } else {
      try {
        const dom = await this._fetchDOM(wolUrl);
        if (dom) {
          let text = this._getElementAsText(dom, `#p${paragraph}`, TargetType.jwonline);
          if (text) {
            text = this._boldInitialNumber(text);
          }
          if (!text) {
            const selectors = ['.resultItems', '.docSubContent', '.bodyTxt', '.searchResult', '.cardLine2', '.result', '.pub-content'];
            for (const selector of selectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (text) {
            actualText = text;
            view?.addToHistory?.(wolUrl, title, [text]);
          }
        }
      } catch (error) {
        console.error('Error fetching English month-number publication:', error);
      }
    }

    let template = '';
    if (command === Cmd.citeVerse || command === Cmd.citePublicationLookup) {
      template = command === Cmd.citePublicationLookup
        ? this.settings.pubCalloutTemplate
        : this.settings.pubTemplate;
    } else if (command === Cmd.citeVerseCallout) {
      template = this.settings.pubCalloutTemplate;
    }
    template = template.replace('ПУБЛ.', 'PUB.');

    let textToUse = actualText || `*Content not available. Try search:* [${query}](${wolUrl})`;
    if (actualText) {
      textToUse = this._boldInitialNumber(textToUse);
    }

    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      const trimmed = template.trimStart();
      const leadingWs = template.slice(0, template.length - trimmed.length);
      template = `${leadingWs}> ${trimmed}`;
    }

    if (template.includes('[!cite]')) {
      textToUse = textToUse.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>');
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', textToUse);
    output.push(citation);
    return output.join('\n');
  }

  /**
   * Fetch English publication citation with month name format (w25 March p. 8 par. 2)
   * @param {string} input - English publication reference with month name
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchEnglishMonthPublicationCitation(input, view, command) {
    console.log('Trying to parse English month publication:', input);

    // Parse month name format: w25 March p. 8 par. 2
    const regex = /w(\d{2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+p\.\s*(\d+)\s+par\.\s*(\d+)/gi;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for English month publication:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    const [fullMatch, year, monthName, page, paragraph] = match;
    console.log('English month publication parsed:', { fullMatch, year, monthName, page, paragraph });

    // Calculate full year
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

    // Create title
    const title = `The Watchtower ${fullYear} ${monthName} p. ${page} par. ${paragraph}`;

    // Create WOL search URL
    const wolUrl = `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(input)}`;

    const output = [];
    output.push(input);

    // Create citation title with link
    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${wolUrl})`;
    }

    // Try to fetch content from WOL
    let actualText = '';
    const cache = view?.getFromHistory?.(wolUrl);
    if (cache) {
      actualText = cache.content.join('');
    } else {
      try {
        const dom = await this._fetchDOM(wolUrl);
        if (dom) {
          let text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
          if (!text) {
            const selectors = ['.searchResult', '.cardLine1', '.cardLine2', '.result', '.pub-content', '.docSubContent', '.bodyTxt'];
            for (const selector of selectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (text) {
            actualText = text;
            view?.addToHistory?.(wolUrl, title, [text]);
          }
        }
      } catch (error) {
        console.error('Error fetching English month publication:', error);
      }
    }

    // Format output
    let template = this.settings.pubCalloutTemplate;
    template = template.replace(/ПУБЛ\./g, 'PUB.');

    let textToUse = actualText || `*Content not available. Try search:* [${input}](${wolUrl})`;
    if (actualText) {
      textToUse = this._boldInitialNumber(textToUse);
    }

    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      const trimmed = template.trimStart();
      const leadingWs = template.slice(0, template.length - trimmed.length);
      template = `${leadingWs}> ${trimmed}`;
    }

    if (template.includes('[!cite]')) {
      textToUse = textToUse.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>');
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', textToUse);
    output.push(citation);

    return output.join('\n');
  }

  /**
   * Fetch Spanish publication citation with month name format (w25 Marzo pág. 8 párr. 2)
   * @param {string} input - Spanish publication reference with month name
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchSpanishMonthPublicationCitation(input, view, command) {
    console.log('Trying to parse Spanish month publication:', input);

    // Parse month name format: w25 Marzo pág. 8 párr. 2, ws12 Febrero pág. 15 párr. 2
    // Supports both w (Watchtower) and ws (Watchtower Study)
    const regex = /w(s)?(\d{2})\s+(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Setiembre|Octubre|Noviembre|Diciembre)\s+pág\.\s*(\d+)\s+párr\.\s*(\d+)/gi;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for Spanish month publication:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    const [fullMatch, isStudy, year, monthName, page, paragraph] = match;
    console.log('Spanish month publication parsed:', { fullMatch, isStudy, year, monthName, page, paragraph });

    // Calculate full year
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

    // Create title
    const pubName = isStudy ? 'La Atalaya (edición de estudio)' : 'La Atalaya';
    const title = `${pubName} ${fullYear} ${monthName} pág. ${page} párr. ${paragraph}`;

    // Create WOL search URL
    const wolUrl = `https://wol.jw.org/es/wol/l/r4/lp-s?q=${encodeURIComponent(input)}`;

    const output = [];
    output.push(input);

    // Create citation title with link
    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${wolUrl})`;
    }

    // Try to fetch content from WOL
    let actualText = '';
    const cache = view?.getFromHistory?.(wolUrl);
    if (cache) {
      actualText = cache.content.join('');
    } else {
      try {
        const dom = await this._fetchDOM(wolUrl);
        if (dom) {
          let text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
          if (!text) {
            const selectors = ['.searchResult', '.cardLine1', '.cardLine2', '.result', '.pub-content', '.docSubContent', '.bodyTxt'];
            for (const selector of selectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (text) {
            actualText = text;
            view?.addToHistory?.(wolUrl, title, [text]);
          }
        }
      } catch (error) {
        console.error('Error fetching Spanish month publication:', error);
      }
    }

    // Format output
    let template = this.settings.pubCalloutTemplate;
    template = template.replace(/ПУБЛ\./g, 'PUBL.');

    let textToUse = actualText || `*Contenido no disponible. Pruebe la búsqueda:* [${input}](${wolUrl})`;
    if (actualText) {
      textToUse = this._boldInitialNumber(textToUse);
    }

    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      const trimmed = template.trimStart();
      const leadingWs = template.slice(0, template.length - trimmed.length);
      template = `${leadingWs}> ${trimmed}`;
    }

    if (template.includes('[!cite]')) {
      textToUse = textToUse.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>');
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', textToUse);
    output.push(citation);

    return output.join('\n');
  }

  /**
   * Fetch other JW publication citation (od, it-1, it-2, si, etc.)
   * @param {string} input - Other publication reference (e.g., "od 15 par. 3")
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted citation
   */
  async _fetchOtherPublicationCitation(input, view, command) {
    console.log('Trying to parse other publication:', input);

    // Use exec for proper group extraction
    const regex = /([a-z]{1,3}(?:-\d)?)\s+(?:(?:chap\.|глава|cap\.)\s*)?(\d+(?:\/\d+)?)\s*(?:(?:pp?\.|сс?\.|págs?\.)\s*(\d+(?:-\d+)?)\s+)?(?:(?:par\.|абз\.|párr\.)\s*(\d+))?/g;
    regex.lastIndex = 0;
    const match = regex.exec(input);

    if (!match) {
      console.log('No match found for other publication:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    console.log('Other publication match found:', match);
    const [fullMatch, pubCode, issueOrPage, page, paragraph] = match;
    console.log('Parsed:', { fullMatch, pubCode, issueOrPage, page, paragraph });

    // Check if publication is available online
    let lang = this.settings?.lang || 'Auto';
    if (lang === 'Auto') {
      lang = detectLanguage(input);
    } else {
      lang = Languages[lang] || 'EN';
    }

    const availability = checkPublicationAvailability(pubCode, lang);
    if (availability.isOffline) {
      console.log('Publication not available online:', pubCode);
      return `${input}\n${availability.message}`;
    }

    // Auto-format certain publications to use chapter format
    let formattedInput = input;
    const hasChapter = input.includes('chap.') || input.includes('глава') || input.includes('cap.');

    // Detect language-specific terms in input
    const isRussianInput = /абз\.|глава/.test(input);
    const isSpanishInput = /párr\.|cap\./.test(input);

    // For "od" and "cl" publications, automatically add chapter format if not present
    if ((pubCode === 'od' || pubCode === 'cl') && !hasChapter && paragraph) {
      if (isRussianInput) {
        // Russian format: od 15 абз. 3 → od глава 15 абз. 3
        formattedInput = input.replace(/^(od|cl)\s+(\d+)\s+(абз\.\s*\d+)/, `$1 глава $2 $3`);
      } else if (isSpanishInput) {
        // Spanish format: od 15 párr. 3 → od cap. 15 párr. 3
        formattedInput = input.replace(/^(od|cl)\s+(\d+)\s+(párr\.\s*\d+)/, `$1 cap. $2 $3`);
      } else {
        // English format: od 15 par. 3 → od chap. 15 par. 3
        formattedInput = `${pubCode} chap. ${issueOrPage} par. ${paragraph}`;
      }
      console.log('Auto-formatted reference:', input, '→', formattedInput);
    }

    // Use already detected language from availability check above
    const isRussian = lang === 'RU';
    const isSpanish = lang === 'ES';

    let publicationTitles;
    if (isRussian) {
      publicationTitles = {
        'od': 'Организованы исполнять волю Иеговы',
        'it-1': 'Понимание Писания, том 1',
        'it-2': 'Понимание Писания, том 2',
        'si': 'Все Писание вдохновлено Богом и полезно',
        'g': 'Пробудитесь!',
        'w': 'Сторожевая башня',
        'km': 'Наше царственное служение',
        'mwb': 'Наша христианская жизнь и служение',
        'lff': 'Слушай Бога и живи вечно',
        'rr': 'Рассуждение на основании Писаний',
        'rs': 'Рассуждение на основании Писаний',
        'cl': 'Приближайтесь к Иегове',
        'jv': 'Свидетели Иеговы — возвещатели Царства Бога',
        'dp': 'Обратите внимание на пророчество Даниила!',
        'ip-1': 'Пророчество Исаии — свет для всего человечества I',
        'ip-2': 'Пророчество Исаии — свет для всего человечества II',
        'be': 'Учимся в Школе теократического служения',
        'th': 'Развивай навыки чтения и способность'
      };
    } else if (isSpanish) {
      publicationTitles = {
        'od': 'Organizados para hacer la voluntad de Jehová',
        'it-1': 'Perspicacia para comprender las Escrituras, Volumen 1',
        'it-2': 'Perspicacia para comprender las Escrituras, Volumen 2',
        'si': 'Toda Escritura es inspirada de Dios y provechosa',
        'g': '¡Despertad!',
        'w': 'La Atalaya',
        'km': 'Nuestro Ministerio del Reino',
        'mwb': 'Nuestra Vida Cristiana y Ministerio—Cuaderno de reunión',
        'lff': 'Escucha a Dios y vivirás para siempre',
        'rr': 'Razonamiento a partir de las Escrituras',
        'rs': 'Razonamiento a partir de las Escrituras',
        'cl': 'Acerquémonos a Jehová',
        'jv': 'Los testigos de Jehová, proclamadores del Reino de Dios',
        'dp': '¡Presta atención a la profecía de Daniel!',
        'ip-1': 'La profecía de Isaías: luz para toda la humanidad I',
        'ip-2': 'La profecía de Isaías: luz para toda la humanidad II',
        'be': 'Benefíciese de la Escuela del Ministerio Teocrático',
        'th': 'Aplícate a la lectura y la enseñanza'
      };
    } else {
      publicationTitles = {
        'od': 'Organized to Do Jehovah\'s Will',
        'it-1': 'Insight on the Scriptures, Volume 1',
        'it-2': 'Insight on the Scriptures, Volume 2',
        'si': 'All Scripture Is Inspired of God and Beneficial',
        'g': 'Awake!',
        'w': 'The Watchtower',
        'km': 'Our Kingdom Ministry',
        'mwb': 'Our Christian Life and Ministry—Meeting Workbook',
        'lff': 'Listen to God and Live Forever',
        'rr': 'Reasoning From the Scriptures',
        'rs': 'Reasoning From the Scriptures',
        'cl': 'Draw Close to Jehovah',
        'jv': 'Jehovah\'s Witnesses—Proclaimers of God\'s Kingdom',
        'dp': 'Pay Attention to Daniel\'s Prophecy!',
        'ip-1': 'Isaiah\'s Prophecy—Light for All Mankind I',
        'ip-2': 'Isaiah\'s Prophecy—Light for All Mankind II',
        'be': 'Learn From the Theocratic Ministry School',
        'th': 'Apply Yourself to Reading and Teaching'
      };
    }

    const publicationTitle = publicationTitles[pubCode] || `Publication ${pubCode.toUpperCase()}`;

    // Create title for display (use language-specific terms)
    let title;
    let chapterTerm, parTerm, pagePrefix;

    if (isRussian) {
      chapterTerm = 'глава';
      parTerm = 'абз.';
      pagePrefix = page && page.includes('-') ? 'сс.' : 'с.';
    } else if (isSpanish) {
      chapterTerm = 'cap.';
      parTerm = 'párr.';
      pagePrefix = page && page.includes('-') ? 'págs.' : 'pág.';
    } else {
      chapterTerm = 'chap.';
      parTerm = 'par.';
      pagePrefix = page && page.includes('-') ? 'pp.' : 'p.';
    }

    if (hasChapter && page && paragraph) {
      // Format: cl chap. 8 p. 77 par. 2 / cl глава 8 с. 77 абз. 2
      title = `${publicationTitle} ${chapterTerm} ${issueOrPage} ${pagePrefix} ${page} ${parTerm} ${paragraph}`;
    } else if (hasChapter && paragraph) {
      // Format: od chap. 15 par. 1 / od глава 15 абз. 1
      title = `${publicationTitle} ${chapterTerm} ${issueOrPage} ${parTerm} ${paragraph}`;
    } else if (hasChapter) {
      // Format: od chap. 15 / od глава 15
      title = `${publicationTitle} ${chapterTerm} ${issueOrPage}`;
    } else if (page && paragraph) {
      // Format: si pp. 300-301 par. 11 / si págs. 300-301 párr. 11 / si сс. 300-301 абз. 11
      title = `${publicationTitle} ${pagePrefix} ${page} ${parTerm} ${paragraph}`;
    } else if (paragraph) {
      // Format: od 15 par. 3 / od 15 абз. 3
      title = `${publicationTitle} ${issueOrPage} ${parTerm} ${paragraph}`;
    } else if (page) {
      // Format: it-1 332 / si pp. 300-301 / si págs. 300-301
      title = `${publicationTitle} ${pagePrefix} ${page}`;
    } else {
      // Format: it-1 332, od 15, g 24/01
      title = `${publicationTitle} ${issueOrPage}`;
    }

    const langConfig = getConfigForLanguage(lang);

    console.log('Detected language for other publication:', lang, 'isRussian:', isRussian);

    // Create search URLs with appropriate language
    const searchQuery1 = formattedInput; // Use formatted input for better search results
    const searchQuery2 = `"${publicationTitle}" ${paragraph ? `paragraph ${paragraph}` : ''}`;
    const searchQuery3 = `${pubCode} ${issueOrPage}`;

    const wolUrl1 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery1)}`;
    const wolUrl2 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery2)}`;
    const wolUrl3 = `${langConfig.wolLookup}${encodeURIComponent(searchQuery3)}`;

    console.log('Generated other publication WOL URLs:', { wolUrl1, wolUrl2, wolUrl3 });

    const output = [];
    output.push(input); // keep original input on first line

    // Create search links
    const searchLinks = [
      `[WOL Search: ${formattedInput}](${wolUrl1})`,
      `[WOL Search: "${publicationTitle}"](${wolUrl2})`,
      `[WOL Search: ${pubCode} ${issueOrPage}](${wolUrl3})`
    ];

    const webLink = searchLinks.join(' • ');

    // Create citation title with optional link
    let citationTitle = title;
    if (this.settings.citationLink) {
      citationTitle = `[${title}](${wolUrl1})`;
    }

    // Try to fetch actual content from WOL
    let actualText = '';
    const contentUrl = wolUrl1;

    const cache = view?.getFromHistory?.(contentUrl);
    if (cache) {
      actualText = cache.content.join('');
    } else {
      try {
        const dom = await this._fetchDOM(contentUrl);
        if (dom) {
          // Try to extract content using same selectors as other publications
          let text = this._getElementAsText(dom, '.resultItems', TargetType.jwonline);
          if (!text) {
            // Try alternative selectors for search results
            const searchSelectors = ['.searchResult', '.cardLine1', '.cardLine2', '.result', '.pub-content'];
            for (const selector of searchSelectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (!text) {
            // Try selectors for direct publication content
            const contentSelectors = ['.docSubContent', '.bodyTxt', '.sb', '.so', '.sc', '.si', '.se', 'p'];
            for (const selector of contentSelectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
          if (text) {
            actualText = this._boldInitialNumber(text);
            console.log('Successfully extracted text for other publication:', text.substring(0, 100) + '...');
            // Cache the result
            view?.addToHistory?.(contentUrl, `WOL Search: ${input}`, [actualText]);
          } else {
            console.log('No text found for other publication:', input, 'URL:', contentUrl);
          }
        }
      } catch (error) {
        console.log('Failed to fetch content from WOL:', error);
      }
    }

    // Add to history
    const historyContent = actualText ? [actualText, `Search options: ${webLink}`] : [`Search options: ${webLink}`];
    view?.addToHistory?.(wolUrl1, title, historyContent);
    view?.showHistory?.();

    // Format citation
    let template = '';
    if (command === Cmd.citeVerse || command === Cmd.citePublicationLookup) {
      template = this.settings.pubCalloutTemplate;
    } else if (command === Cmd.citeVerseCallout) {
      template = this.settings.pubCalloutTemplate;
    }

    // Use appropriate language prefix based on detected language
    if (isRussian) {
      // Keep "ПУБЛ." for Russian
      template = template.replace('PUB.', 'ПУБЛ.');
    } else if (isSpanish) {
      // Use "PUBL." for Spanish
      template = template.replace('PUB.', 'PUBL.');
      template = template.replace('ПУБЛ.', 'PUBL.');
    } else {
      // Use "PUB." for English
      template = template.replace('ПУБЛ.', 'PUB.');
      template = template.replace('PUBL.', 'PUB.');
    }

    // Fix template to not break markdown links
    if (template.includes('"*{text}*"')) {
      template = template.replace('"*{text}*"', '{text}');
    } else if (template.includes('*{text}*') || template.includes('"{text}"')) {
      template = template.replace(/"?\*?\{text\}\*?"?/g, '{text}');
    }

    // Use actual text if available, otherwise fall back to search links
    let textToUse = actualText || webLink;

    // Check if paragraph was specified but no content found
    if (paragraph && !actualText) {
      let noParMessage;
      if (isRussian) {
        noParMessage = `На странице нет нумерации абзацев. Попробуйте поиск: [${formattedInput}](${wolUrl1}). `;
      } else if (isSpanish) {
        noParMessage = `En la página no hay numeración de párrafos. Pruebe la búsqueda: [${formattedInput}](${wolUrl1}). `;
      } else {
        noParMessage = `No paragraph numbering found on the page. Try search: [${formattedInput}](${wolUrl1}). `;
      }
      textToUse = noParMessage + textToUse;
    }

    // If using callout template, format text properly for callout
    if (template.includes('[!cite]') && !template.trimStart().startsWith('>')) {
      const trimmed = template.trimStart();
      const leadingWs = template.slice(0, template.length - trimmed.length);
      template = `${leadingWs}> ${trimmed}`;
    }

    if (template.includes('[!cite]')) {
      // Format text for callout - each line should start with '>' but avoid double '>'
      // First remove any existing '>' at the start, then add single '>'
      textToUse = textToUse.replace(/^>\s*/gm, '').replace(/^/gm, '> ').replace(/^> $/gm, '>').replace(/^> > /gm, '> ');
    }

    const citation = template.replace('{title}', citationTitle).replace('{text}', textToUse);
    output.push(citation);

    return output.join('\n');
  }

  /**
   * Fetch publication citation in dual mode using configured languages
   * @param {string} input - Publication reference (e.g., "w24.01 14 par. 18")
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Formatted dual citation
   */
  async _fetchDualPublicationCitation(input, view, command) {
    input = normalizeInput(input);
    console.log('Trying dual mode for publication:', input);

    const citationCommand = command === Cmd.citePublicationLookup ? Cmd.citeVerseCallout : command;

    // Get configured languages
    const { firstLang, secondLang } = this._getDualLanguages();
    console.log('Dual mode languages:', { firstLang, secondLang });

    // Parse the input to extract components - support multiple publication types
    let regex, match;

    // Try Watchtower format first: w23.12 20, абз. 8, 9 OR w25.3 с. 8 абз. 2
    regex = /w(\d{2})\.(\d{1,2})\s+(?:(?:с\.|p\.|pág\.)\s*)?(\d+)(?:[,\s]*(?:par\.|абз\.|párr\.)\s*(\d+)(?:[,\s]*\d+)*)?/g;
    regex.lastIndex = 0;
    match = regex.exec(input);

    if (!match) {
      // Try month/day format: w03 7/15 22 [par. N] (supports English par., Russian абз., Spanish párr.)
      regex = /w(\d{2})\s+(\d{1,2})\/(\d{1,2})\s+(\d+)(?:\s+(?:par\.|абз\.|párr\.)\s*(\d+))?/g;
      regex.lastIndex = 0;
      match = regex.exec(input);

      if (match) {
        const [fullMatch, year, month, day, page, paragraph] = match;
        console.log('Month/day format detected:', { fullMatch, year, month, day, page, paragraph });

        // Convert to standard format for processing
        const paddedMonth = month.padStart(2, '0');

        // Create input formats for each language
        const langInputs = {
          en: `w${year} ${month}/${day} p. ${page}${paragraph ? ` par. ${paragraph}` : ''}`,
          ru: `w${year}.${paddedMonth} ${page}${paragraph ? `, абз. ${paragraph}` : ''}`,
          es: `w${year} ${month}/${day} pág. ${page}${paragraph ? ` párr. ${paragraph}` : ''}`
        };

        // Create WOL search URLs for each language
        const wolUrls = {
          en: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(langInputs.en)}`,
          ru: `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(langInputs.ru)}`,
          es: `https://wol.jw.org/es/wol/l/r4/lp-s?q=${encodeURIComponent(langInputs.es)}`
        };

        const output = [];
        output.push(input); // keep original input on first line

        try {
          // Fetch citation for first language
          const firstCitation = await this._fetchCitationByLanguage(langInputs[firstLang], firstLang, view, citationCommand, paragraph, wolUrls[firstLang]);

          // Fetch citation for second language
          const secondCitation = await this._fetchCitationByLanguage(langInputs[secondLang], secondLang, view, citationCommand, paragraph, wolUrls[secondLang]);

          // Format dual output with configured language order
          output.push(this._getLanguageLabel(firstLang));
          output.push(firstCitation.split('\n').slice(1).join('\n'));

          if (secondCitation) {
            output.push('');
            output.push(this._getLanguageLabel(secondLang));
            output.push(secondCitation.split('\n').slice(1).join('\n'));
          }

          return output.join('\n');
        } catch (error) {
          console.error('Error in dual mode month/day format:', error);
          return `${input} | ${Lang.onlineLookupFailed}`;
        }
      }
    }

    if (!match) {
      // Try English publication format: w65 6/1 p. 329 par. 6
      Config.englishPubRegex.lastIndex = 0;
      match = Config.englishPubRegex.exec(input);

      if (match) {
        console.log('English publication format detected:', input);
        const englishCitation = await this._fetchEnglishPublicationCitation(input, view, command);
        const output = [];
        output.push(input);
        output.push(this._getLanguageLabel('en'));
        output.push(englishCitation.split('\n').slice(1).join('\n'));
        return output.join('\n');
      }

      // Try English publication month-number format: w23.12 20 par. 7
      Config.englishPubMonthNumberRegex.lastIndex = 0;
      match = Config.englishPubMonthNumberRegex.exec(input);

      if (match) {
        console.log('English month-number publication format detected:', input);
        const englishCitation = await this._fetchEnglishMonthNumberPublicationCitation(input, view, command);
        const output = [];
        output.push(input);
        output.push(this._getLanguageLabel('en'));
        output.push(englishCitation.split('\n').slice(1).join('\n'));
        return output.join('\n');
      }

      // Try other publication formats: od 15 par. 3, it-1 332 par. 5, si 28 par. 12
      Config.otherPubRegex.lastIndex = 0;
      match = Config.otherPubRegex.exec(input);

      if (match) {
        // For other JW publications, fetch in both configured languages
        console.log('Other JW publication detected in dual mode:', input);

        // Parse the input to extract components
        const otherPubMatch = input.match(/^([a-z]{1,3}(?:-\d)?)\s+(\d+)(?:\s+(?:par\.|абз\.|párr\.)\s*(\d+))?/i);
        if (otherPubMatch) {
          const [, pubCode, issueOrPage, paragraph] = otherPubMatch;

          // Create input formats for each language
          const langInputs = {
            en: `${pubCode} ${issueOrPage}${paragraph ? ` par. ${paragraph}` : ''}`,
            ru: `${pubCode} ${issueOrPage}${paragraph ? ` абз. ${paragraph}` : ''}`,
            es: `${pubCode} ${issueOrPage}${paragraph ? ` párr. ${paragraph}` : ''}`
          };

          const output = [];
          output.push(input); // keep original input on first line

          try {
            // Fetch citation for first language
            console.log(`Fetching ${firstLang} citation for other pub:`, langInputs[firstLang]);
            const firstCitation = await this._fetchOtherPublicationCitationForLang(langInputs[firstLang], firstLang, view, command);

            // Fetch citation for second language
            console.log(`Fetching ${secondLang} citation for other pub:`, langInputs[secondLang]);
            const secondCitation = await this._fetchOtherPublicationCitationForLang(langInputs[secondLang], secondLang, view, command);

            // Format dual output with configured language order
            output.push(this._getLanguageLabel(firstLang));
            output.push(firstCitation.split('\n').slice(1).join('\n'));

            if (secondCitation) {
              output.push('');
              output.push(this._getLanguageLabel(secondLang));
              output.push(secondCitation.split('\n').slice(1).join('\n'));
            }

            return output.join('\n');
          } catch (error) {
            console.error('Error in dual mode for other publication:', error);
            return `${input} | ${Lang.onlineLookupFailed}`;
          }
        }

        // Fallback to single language if parsing failed
        const citation = await this._fetchOtherPublicationCitation(input, view, command);
        const output = [];
        output.push(input);
        output.push(this._getLanguageLabel(firstLang));
        output.push(citation.split('\n').slice(1).join('\n'));
        return output.join('\n');
      }
    }

    if (!match) {
      console.log('No match found for dual mode:', input);
      return `${input} | ${Lang.invalidScripture}`;
    }

    const [fullMatch, year, monthNum, page, paragraph] = match;
    console.log('Dual mode parsed:', { fullMatch, year, monthNum, page, paragraph });

    // Month names for each language
    const monthNames = {
      en: ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
      ru: ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      es: ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };

    const monthInt = parseInt(monthNum);

    // Create input formats for each language - use month names for modern publications
    const langInputs = {
      en: `w${year} ${monthNames.en[monthInt]} p. ${page}${paragraph ? ` par. ${paragraph}` : ''}`,
      ru: `w${year}.${monthNum} ${page}${paragraph ? ` абз. ${paragraph}` : ''}`,
      es: `w${year} ${monthNames.es[monthInt]} pág. ${page}${paragraph ? ` párr. ${paragraph}` : ''}`
    };

    // Create WOL search URLs for each language
    const wolUrls = {
      en: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(langInputs.en)}`,
      ru: `https://wol.jw.org/ru/wol/l/r2/lp-u?q=${encodeURIComponent(langInputs.ru)}`,
      es: `https://wol.jw.org/es/wol/l/r4/lp-s?q=${encodeURIComponent(langInputs.es)}`
    };

    const output = [];
    output.push(input); // keep original input on first line

    try {
      // Fetch citation for first language
      const firstCitation = await this._fetchCitationByLanguage(langInputs[firstLang], firstLang, view, citationCommand, paragraph, wolUrls[firstLang]);

      // Fetch citation for second language
      const secondCitation = await this._fetchCitationByLanguage(langInputs[secondLang], secondLang, view, citationCommand, paragraph, wolUrls[secondLang]);

      // Format dual output with configured language order
      output.push(this._getLanguageLabel(firstLang));
      output.push(firstCitation.split('\n').slice(1).join('\n'));

      if (secondCitation) {
        output.push('');
        output.push(this._getLanguageLabel(secondLang));
        output.push(secondCitation.split('\n').slice(1).join('\n'));
      }

      return output.join('\n');
    } catch (error) {
      console.error('Error in dual mode:', error);
      return `${input} | ${Lang.onlineLookupFailed}`;
    }
  }

  /**
   * Fetch citation for a specific language
   * @param {string} input - Formatted input for the language
   * @param {string} langCode - Language code: 'en', 'ru', 'es'
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @param {string} paragraph - Paragraph number (optional)
   * @param {string} wolUrl - WOL search URL for fallback
   * @returns {string} - Citation text
   */
  async _fetchCitationByLanguage(input, langCode, view, command, paragraph, wolUrl) {
    console.log(`Fetching ${langCode} citation for:`, input);

    if (langCode === 'en') {
      // Check if input matches month name format (w25 March p. 8 par. 2)
      Config.englishPubMonthRegex.lastIndex = 0;
      if (Config.englishPubMonthRegex.test(input)) {
        return await this._fetchEnglishMonthPublicationCitation(input, view, command);
      }
      // Otherwise use standard English format
      return await this._fetchEnglishPublicationCitation(input, view, command);
    } else if (langCode === 'ru') {
      if (paragraph) {
        return await this._fetchRussianPublicationCitationCallout(input, view, command);
      } else {
        return `${input}\nНа странице нет нумерации абзацев. Укажите номер абзаца для получения содержимого. Попробуйте поиск: [${input}](${wolUrl})`;
      }
    } else if (langCode === 'es') {
      // Check if input matches Spanish month name format (w25 Marzo pág. 8 párr. 2)
      Config.spanishPubMonthRegex.lastIndex = 0;
      if (Config.spanishPubMonthRegex.test(input)) {
        return await this._fetchSpanishMonthPublicationCitation(input, view, command);
      }
      if (paragraph) {
        return await this._fetchSpanishMonthPublicationCitation(input, view, command);
      } else {
        return `${input}\nEn la página no hay numeración de párrafos. Especifique el número de párrafo para obtener el contenido. Pruebe la búsqueda: [${input}](${wolUrl})`;
      }
    }

    // Fallback to generic fetch
    return await this._fetchLookupCitation(input, view);
  }

  /**
   * Fetch other publication citation for a specific language (od, it-1, si, etc.)
   * @param {string} input - Formatted input for the language
   * @param {string} langCode - Language code: 'en', 'ru', 'es'
   * @param {View} view - View for history
   * @param {Cmd} command - Command type
   * @returns {string} - Citation text
   */
  async _fetchOtherPublicationCitationForLang(input, langCode, view, command) {
    console.log(`Fetching other publication for ${langCode}:`, input);

    // Language configurations with direct document URLs
    const langConfigs = {
      'en': {
        wolBase: 'https://wol.jw.org/en/wol/d/r1/lp-e/',
        wolLookup: 'https://wol.jw.org/en/wol/l/r1/lp-e?q='
      },
      'ru': {
        wolBase: 'https://wol.jw.org/ru/wol/d/r2/lp-u/',
        wolLookup: 'https://wol.jw.org/ru/wol/l/r2/lp-u?q='
      },
      'es': {
        wolBase: 'https://wol.jw.org/es/wol/d/r4/lp-s/',
        wolLookup: 'https://wol.jw.org/es/wol/l/r4/lp-s?q='
      }
    };

    const config = langConfigs[langCode];
    if (!config) {
      return `${input}\n[${langCode}] ${Lang.onlineLookupFailed}`;
    }

    // Parse the input
    const match = input.match(/^([a-z]{1,3}(?:-\d)?)\s+(\d+)(?:\s+(?:par\.|абз\.|párr\.)\s*(\d+))?/i);
    if (!match) {
      return `${input}\n[${langCode}] ${Lang.invalidScripture}`;
    }

    const [, pubCode, issueOrPage, paragraph] = match;
    const issueOrPageNum = parseInt(issueOrPage);

    // Document IDs for publications (same IDs work for all languages)
    const publicationDocIds = {
      'od': {
        1: 1102014931, 2: 1102014932, 3: 1102014933, 4: 1102014934, 5: 1102014935,
        6: 1102014936, 7: 1102014937, 8: 1102014938, 9: 1102014939, 10: 1102014940,
        11: 1102014941, 12: 1102014942, 13: 1102014943, 14: 1102014944, 15: 1102014945,
        16: 1102014946, 17: 1102014947
      },
      'cl': {
        1: 1102002061, 2: 1102002062, 3: 1102002063, 4: 1102002064, 5: 1102002065,
        6: 1102002066, 7: 1102002067, 8: 1102002068, 9: 1102002069, 10: 1102002070,
        11: 1102002071, 12: 1102002072, 13: 1102002073, 14: 1102002074, 15: 1102002075,
        16: 1102002076, 17: 1102002077, 18: 1102002078, 19: 1102002079, 20: 1102002080,
        21: 1102002081, 22: 1102002082, 23: 1102002083, 24: 1102002084, 25: 1102002085,
        26: 1102002086, 27: 1102002087, 28: 1102002088, 29: 1102002089, 30: 1102002090,
        31: 1102002091
      }
    };

    // Publication titles by language
    const publicationTitles = {
      'en': {
        'od': 'Organized to Do Jehovah\'s Will',
        'it-1': 'Insight on the Scriptures, Volume 1',
        'it-2': 'Insight on the Scriptures, Volume 2',
        'cl': 'Draw Close to Jehovah',
        'si': 'All Scripture Is Inspired of God and Beneficial'
      },
      'ru': {
        'od': 'Организованы исполнять волю Иеговы',
        'it-1': 'Понимание Писания, том 1',
        'it-2': 'Понимание Писания, том 2',
        'cl': 'Приближайтесь к Иегове',
        'si': '«Всё Писание вдохновлено Богом и полезно»'
      },
      'es': {
        'od': 'Organizados para hacer la voluntad de Jehová',
        'it-1': 'Perspicacia para comprender las Escrituras, Volumen 1',
        'it-2': 'Perspicacia para comprender las Escrituras, Volumen 2',
        'cl': 'Acerquémonos a Jehová',
        'si': 'Toda Escritura es inspirada por Dios y provechosa'
      }
    };

    const pubTitle = publicationTitles[langCode]?.[pubCode.toLowerCase()] || `Publication ${pubCode.toUpperCase()}`;

    // Build terms based on language
    const isPageBased = pubCode.toLowerCase() === 'si' || pubCode.toLowerCase().startsWith('it-');
    const terms = {
      'en': isPageBased ? { unit: 'p.', par: 'par.' } : { unit: 'chap.', par: 'par.' },
      'ru': isPageBased ? { unit: 'с.', par: 'абз.' } : { unit: 'глава', par: 'абз.' },
      'es': isPageBased ? { unit: 'pág.', par: 'párr.' } : { unit: 'cap.', par: 'párr.' }
    };
    const term = terms[langCode];

    // Build title
    const title = paragraph
      ? `${pubTitle} ${term.unit} ${issueOrPage} ${term.par} ${paragraph}`
      : `${pubTitle} ${term.unit} ${issueOrPage}`;

    // Get direct document URL if available
    const pubDocIds = publicationDocIds[pubCode.toLowerCase()];
    let directUrl = '';
    let wolUrl = '';

    if (pubDocIds && pubDocIds[issueOrPageNum]) {
      const docId = pubDocIds[issueOrPageNum];
      directUrl = `${config.wolBase}${docId}`;
      wolUrl = paragraph ? `${directUrl}#p${paragraph}` : directUrl;
    } else {
      // Fallback to search URL
      wolUrl = `${config.wolLookup}${encodeURIComponent(input)}`;
    }

    console.log(`Direct URL for ${langCode}:`, directUrl || wolUrl);

    try {
      let text = '';

      if (directUrl) {
        // Fetch from direct document URL
        const dom = await this._fetchDOM(directUrl);
        if (dom && paragraph) {
          // Extract specific paragraph by ID
          text = this._getElementAsText(dom, `#p${paragraph}`, TargetType.jwonline);
          if (text) {
            text = this._boldInitialNumber(text);
          }
        }
      }

      if (!text) {
        const dom = await this._fetchDOM(wolUrl);
        if (dom) {
          if (paragraph) {
            text = this._getElementAsText(dom, `#p${paragraph}`, TargetType.jwonline);
            if (text) {
              text = this._boldInitialNumber(text);
            }
          }

          if (!text) {
            const selectors = ['.resultItems', '.docSubContent', '.bodyTxt', '.searchResult', '.cardLine2', '.result', '.pub-content'];
            for (const selector of selectors) {
              text = this._getElementAsText(dom, selector, TargetType.jwonline);
              if (text) break;
            }
          }
        }
      }

      if (!text) {
        const notAvailableMsg = {
          'en': `*Content not available. Try search:* [${input}](${wolUrl})`,
          'ru': `*Содержимое недоступно. Попробуйте поиск:* [${input}](${wolUrl})`,
          'es': `*Contenido no disponible. Pruebe la búsqueda:* [${input}](${wolUrl})`
        };
        text = notAvailableMsg[langCode] || notAvailableMsg['en'];
      }

      // Create citation title with link
      let citationTitle = title;
      if (this.settings.citationLink) {
        citationTitle = `[${title}](${wolUrl})`;
      }

      // Format output - adjust template header based on language
      let template = this.settings.pubCalloutTemplate;

      // Replace publication header based on language
      if (langCode === 'en') {
        template = template.replace(/ПУБЛ\.|PUB\.|PUBL\./g, 'PUB.');
      } else if (langCode === 'es') {
        template = template.replace(/ПУБЛ\.|PUB\.|PUBL\./g, 'PUBL.');
      } else {
        template = template.replace(/PUB\.|PUBL\./g, 'ПУБЛ.');
      }

      const citation = template.replace('{title}', citationTitle).replace('{text}', text);

      const output = [];
      output.push(input);
      output.push(citation);

      return output.join('\n');
    } catch (error) {
      console.error(`Error fetching other publication for ${langCode}:`, error);
      return `${input}\n[${langCode}] ${Lang.onlineLookupFailed}`;
    }
  }

  /**
   * Inserts a sanitized, formatted paragraph citation below a valid wol.jw.org or finder url
   * @param {string} input text containing a jw.org/finder or wol.jw.org URL
   * @param {View} view
   * @param {number} caret position of the caret in the input
   * @param {Cmd} command full paragraph, inline or title only
   * @param {number} pars number of paragraphs to extract (1-3 right now)
   * @returns {string}
   */
  async _fetchParagraphCitation(input, view, caret, command, pars) {
    const match = this._getLinkAtCaret(input, caret);
    if (!match || !URL.canParse(match.url)) {
      return `${input} | ${Lang[OutputError.invalidUrl]}`;
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
            let par = this._getElementAsText(dom, `#p${match.parId}${i}`, TargetType.jwonline);
            if (par.trim() === '') {
              par = Lang.emptyPara;
            }
            content.push(par);
          }
        }
      }
    }
    if (link) {
      view?.addToHistory?.(match.url, link, content);
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
        const citation = template.replace('{title}', link).replace('{text}', text);
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
    const lookupUrl = Config.wolLookup + encodeURIComponent(input).replace(/%20/g, '+');
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
      // For English publications, use "PUB." instead of "ПУБЛ."
      template = template.replace('ПУБЛ.', 'PUB.');
      // Check if template is actually a callout (user editable):
      // If so all lines need to be part of the callout syntax
      if (template[0] === '>') {
        text = text.replace(/^./gm, '>$&').substring(1);
      }
      const citation = template.replace('{title}', link).replace('{text}', text);
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
      console.log(error);
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
      console.log('Invalid DOM passed to _getElementAsText:', dom);
      return '';
    }
    const elem = dom.querySelector(selector) ?? null;
    if (elem) {
      if (type === TargetType.scripture) {
        // Check if this is a Russian JW.org Bible page (different structure)
        const isRussianBible = dom.querySelector('.bibleText') || dom.querySelector('.verse');

        if (isRussianBible) {
          // Russian JW.org Bible pages use different structure
          // Try multiple selectors for Russian pages
          const russianSelectors = [
            selector, // original selector
            selector.replace('#v', '.verse[data-verse="') + '"]',
            selector.replace('#v', '[data-verse="') + '"]',
            selector.replace('#v', '.v') // sometimes class instead of id
          ];

          let foundElem = null;
          for (const sel of russianSelectors) {
            foundElem = dom.querySelector(sel);
            if (foundElem) break;
          }

          if (foundElem) {
            text = foundElem.textContent.trim();
          } else {
            // Fallback: try to find verse by number in the URL fragment
            const verseNum = selector.match(/\d+$/);
            if (verseNum) {
              const verseElements = dom.querySelectorAll('.verse, .v, [class*="verse"]');
              for (const ve of verseElements) {
                if (ve.textContent.includes(verseNum[0])) {
                  text = ve.textContent.trim();
                  break;
                }
              }
            }
          }
        } else {
          // Original logic for English/other finder pages
          let html = elem.innerHTML;
          const blocks = ['<span class="newblock"></span>', '<span class="parabreak"></span>'].map(
            (el) => new RegExp(el, 'gm'),
          );
          for (const el of blocks) {
            html = html.replace(el, '\n');
          }
          // Now remove html tags
          text = new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
          // Check for initial chapter numbers (always first element) and replace with 1
          if (elem.querySelector('.chapterNum')) {
            text = text.replace(Config.initialNumRegex, '1 ');
            // Is it block or inline verse styling for following verses?
            // Do we need to prepend a space/newline?
          } else if (follows) {
            const prependLF = elem.firstChild.hasClass('style-l') || elem.firstChild.hasClass('newblock');
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
      links.push(this._extractLinkParts(match));
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
        break;
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

    // Check for Russian publication references first (e.g., w24 Август с. 14—15 5)
    const russianPubMatches = input.matchAll(Config.russianPubRegex);
    for (const match of russianPubMatches) {
      const [fullMatch, year, month, page, paragraph] = match;
      const wolUrl = convertRussianPubToWOL(fullMatch);

      if (wolUrl && displayType === DisplayType.cite) {
        /** @type {TReference} */
        const pubReference = {
          original: fullMatch,
          book: `Сторожевая башня ${year} ${month}`,
          passages: [{
            original: `с. ${page} ${paragraph}`,
            chapter: page,
            verses: [paragraph],
            error: OutputError.none,
            noChapter: false,
            noVerse: false,
          }],
          isPlainText: false,
          isLinkAlready: false,
          link: {
            jwlib: wolUrl.replace('wol.jw.org', 'jwlibrary:///finder?bible='),
            jworg: wolUrl,
            parIds: [`${year}${RussianMonths[month.toLowerCase()]}${page.padStart(2, '0')}${paragraph.padStart(2, '0')}`]
          }
        };
        references.push(pubReference);
      }
    }

    // Normal book chapter verse references
    const matchesNormal = input.matchAll(Config.scriptureRegex);
    // Small books with no chapter, e.g. phm, 2jo, 3jo, jude
    const matchesNoChp = input.matchAll(Config.scriptureNoChpRegex);
    // Chapter only references, e.g. John 3; Ex 16
    // Convert to array so that we can change value in-place
    const matchesNoVerse = input.matchAll(Config.scriptureNoVerseRegex).toArray();
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
      console.log('validateReference - initial lang setting:', lang);
      console.log('validateReference - reference.book:', reference.book);
      if (lang === 'Auto') {
        lang = detectLanguage(reference.book);
        console.log('validateReference - detected lang:', lang);
      } else {
        // Convert setting name to language code
        lang = Languages[lang] || Languages[DEFAULT_SETTINGS.fallbackLang];
        console.log('validateReference - converted lang:', lang);
      }
      console.log('validateReference - final lang:', lang);

      // First question: is this a valid bible book?
      // *********************************
      // The abbreviation list has no spaces: e.g. 1kings 1ki matthew matt mt
      // so we remove all spaces from the reference
      // Also use (^| ) to avoid matching inside book names, e.g. eph in zepheniah
      let bookNum = 0;

      // Check if Bible data exists for this language, fallback to English if not
      const bibleData = Bible[lang] || Bible['EN'];
      console.log('validateReference - using Bible data for:', lang, 'exists:', !!Bible[lang]);

      const bookRgx = new RegExp(`(^| )${reference.book.replace(/[\s\u00A0.]/g, '').toLowerCase()}`, 'm'); // no spaces, &nbsp; or .
      const bookMatch = bibleData.Abbreviation.findIndex((elem) => elem.search(bookRgx) !== -1);
      if (bookMatch !== -1) {
        reference.book = bibleData.Book[bookMatch].replaceAll(' ', '\u00A0'); // avoid page breaks in book name
        bookNum = bookMatch + 1;
      }

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
        const bcLookup = `${bookNum} ${passage.chapter}`;
        if (bcLookup in BibleDimensions && first <= BibleDimensions[bcLookup] && last <= BibleDimensions[bcLookup]) {
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
              console.log(`Created jworg link for ${lang}:`, link.jworg);
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
    if (url.startsWith(Config.wolRoot)) {
      const id = url.split('/').slice(-1)[0];
      if (id?.includes('#h')) {
        [docId, parId] = id.split('#h=', 2);
      } else {
        docId = id ?? '';
      }
    } else if (url.startsWith(Config.webFinder)) {
      const params = new URLSearchParams(url);
      docId = params.get('docid') ?? '';
      parId = params.get('par') ?? '';
      if (docId) {
        // switch the link style from finder to wol
        // so that we can scrape the paragraph content later if needed
        url = `${Config.wolPublications}${docId}#h=${parId}`;
      } else {
        return null;
      }
    } else {
      return null;
    }
    return {
      whole: match[0],
      title: match[1] ? match[2] : Lang.noTitle,
      url: url,
      docId: docId,
      parId: parId,
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

    const detailsEl = createEl('details');
    detailsEl.createEl('summary', { text: Lang.help });
    detailsEl.createEl('p', { text: Lang.helpIntro });
    const detailEl = detailsEl.createEl('ul');
    detailEl.createEl('li', { text: Lang.helpCopy });
    const wipeEl = detailEl.createEl('li', {
      text: Lang.helpClear,
      cls: 'clear-history',
    });
    this.contentEl.append(detailsEl);

    this.showHistory;

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
    this.historyEl.empty();
    if (this.history.length > 0) {
      const parent = new MarkdownRenderChild(this.containerEl);
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
    if (this.history.length > this.settings.maxHistory) {
      this.history = this.history.slice(0, this.settings.maxHistory);
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
    const rawHtml = this.containerEl.innerHTML;
    if (!/\d/.test(rawHtml) && !/wol\.jw\.org|jw\.org\/finder|jwlibrary:\/\//i.test(rawHtml)) return;
    const html = rawHtml.replaceAll('&nbsp;', '\u00A0');
    const { output, changed } = this.plugin._convertScriptureToJWLibrary(html, DisplayType.href);
    if (changed) {
      this.containerEl.innerHTML = output;
    }
  }
}

class JWLLinkerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Resolve 'Auto' language setting to actual language code
   * Based on user's locale or interface language setting
   * @returns {string} Language code: 'ru', 'en', or 'es'
   */
  _resolveAutoLanguage() {
    // Try to detect from interface language setting
    const interfaceLang = this.plugin.settings.interfaceLang;
    if (interfaceLang === 'Russian') return 'ru';
    if (interfaceLang === 'Spanish') return 'es';
    if (interfaceLang === 'English') return 'en';

    // Try to detect from browser/system locale
    const locale = navigator.language || navigator.userLanguage || 'en';
    const langCode = locale.split('-')[0].toLowerCase();

    // Map to supported languages
    if (langCode === 'ru') return 'ru';
    if (langCode === 'es') return 'es';

    // Default to English if not in supported list
    return 'en';
  }

  display() {
    const { containerEl } = this;
    const defaultTemplate = '{title}\n{text}\n';

    containerEl.empty();
    containerEl.addClass('jwl-settings');

    new Setting(containerEl)
      .setName(Lang.settingsDisplay)
      .setDesc(Lang.settingsDisplayDesc)
      .setHeading();

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
          await this.plugin.saveSettings();
        });
      });

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
          'Spanish': 'Español'
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
        let languageOptions;
        if (Lang.settingsInterfaceLang === 'Язык интерфейса') {
          // Russian interface
          languageOptions = {
            'Auto': 'Автоопределение',
            'Russian': 'Русский',
            'English': 'English',
            'Spanish': 'Español',
            'German': 'Deutsch',
            'French': 'Français',
            'Dutch': 'Nederlands'
          };
        } else if (Lang.settingsInterfaceLang === 'Idioma de la interfaz') {
          // Spanish interface
          languageOptions = {
            'Auto': 'Detección automática',
            'Russian': 'Ruso',
            'English': 'Inglés',
            'Spanish': 'Español',
            'German': 'Alemán',
            'French': 'Francés',
            'Dutch': 'Holandés'
          };
        } else {
          // English interface
          languageOptions = {
            'Auto': 'Auto-detection',
            'Russian': 'Russian',
            'English': 'English',
            'Spanish': 'Spanish',
            'German': 'German',
            'French': 'French',
            'Dutch': 'Dutch'
          };
        }
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
    Abbreviation: [
      'genèse gen ge',
      'exode exo ex',
      'lévitique lev le',
      'nombres nom',
      'deutéronome de deu deut',
      'josué jos',
      'juges jug',
      'ruth ru',
      '1samuel 1sam 1sa',
      '2samuel 1sam 2sa',
      '1rois 1ro',
      '2rois 2ro',
      '1chroniques 1chr 1ch',
      '2chroniques 2chr 2ch',
      'esdras esd',
      'néhémie neh',
      'esther est',
      'job',
      'psaumes psa ps',
      'proverbes pr pro prov',
      'ecclésiaste ec ecc eccl',
      'chant de salomon chant',
      'isaïe isa is',
      'jérémie jer',
      'lamentations lam la',
      'ézéchiel eze ez',
      'daniel dan da',
      'osée os',
      'joël',
      'amos',
      'abdias abd ab',
      'jonas',
      'michée mic',
      'nahum',
      'habacuc hab',
      'sophonie sph sop',
      'aggée agg ag',
      'zacharie zac',
      'malachie mal',
      'matthieu mt mat matt',
      'marc',
      'luc',
      'jean',
      'actes ac',
      'romains rom ro',
      '1corinthiens 1cor 1co',
      '2corinthiens 2cor 2co',
      'galates gal ga',
      'éphésiens eph',
      'philippiens phil',
      'colossiens col',
      '1thessaloniciens 1th',
      '2thessaloniciens 2th',
      '1timothée 1tim 1ti',
      '2timothée 2tim 2ti',
      'tite',
      'philémon phm',
      'hébreux heb he',
      'jacques jac',
      '1pierre 1pi',
      '2pierre 2pi',
      '1jean 1je',
      '2jean 2je',
      '3jean 3 je',
      'jude',
      'révélation rev re',
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

// Reconstruct the flat lookup used by _parseScriptureLinks
const BibleDimensions = Object.fromEntries(
  _BibleVerses.flatMap((chapters, b) =>
    chapters ? chapters.map((v, i) => [`${b} ${i + 1}`, v]) : []
  )
);

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