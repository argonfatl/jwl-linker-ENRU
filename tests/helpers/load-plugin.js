// Loads main.js outside Obsidian for unit tests.
// The `obsidian` module is replaced by minimal stubs, and the plugin's internal
// classes/functions are exported so the parsing logic can be tested directly.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const vm = require('node:vm');

class Base {}
const obsidianStub = {
  Plugin: class {},
  Editor: Base,
  ItemView: class {
    constructor(leaf) {
      this.leaf = leaf;
    }
  },
  Menu: class {},
  Notice: class {
    hide() {}
  },
  MarkdownRenderChild: class {
    constructor(containerEl) {
      this.containerEl = containerEl;
    }
    load() {}
    unload() {}
  },
  MarkdownRenderer: { render() {} },
  requestUrl: async () => ({ status: 0, text: '' }),
  PluginSettingTab: Base,
  Setting: Base,
  Platform: { isMobile: false },
  editorLivePreviewField: {},
};

const EXPORTS = [
  'JWLLinkerPlugin',
  'JWLLinkerView',
  'Config',
  'DisplayType',
  'normalizeInput',
  'autoFormatEnglishWatchtower',
  'autoFormatRussianWatchtower',
  'autoFormatSpanishWatchtower',
  'detectLanguage',
  'parseWatchtowerReference',
  'parseOtherPublicationReference',
  'formatWatchtowerQuery',
  'formatWatchtowerTitle',
  'formatOtherPublicationQuery',
  'formatOtherPublicationTitle',
  'isPublicationReference',
  'matchOtherPublication',
  'isLikelyPublication',
  'fillCitationTemplate',
  'parseJwlBibleHref',
  'scriptureLinkRanges',
];

function loadPlugin() {
  const file = path.join(__dirname, '..', '..', 'main.js');
  const source = `${fs.readFileSync(file, 'utf8')}\n;module.exports = { ${EXPORTS.join(', ')} };`;
  const mod = { exports: {} };
  const localRequire = (id) => (id === 'obsidian' ? obsidianStub : require(id));
  const wrapper = vm.runInThisContext(Module.wrap(source), { filename: file });
  wrapper(mod.exports, localRequire, mod, file, path.dirname(file));
  return mod.exports;
}

/** A plugin instance with default settings, ready for parsing tests */
function createPlugin(exports, settings = {}) {
  const plugin = new exports.JWLLinkerPlugin();
  plugin.settings = { lang: 'Auto', spaceAfterPunct: true, citationLink: true, boldInitialNum: true, ...settings };
  return plugin;
}

module.exports = { loadPlugin, createPlugin };
