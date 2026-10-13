const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPlugin, createPlugin } = require('./helpers/load-plugin');

const jwl = loadPlugin();
const { DisplayType } = jwl;

test('a line with a Russian Watchtower reference and a scripture does not crash', () => {
  const plugin = createPlugin(jwl);
  const line = 'См. w25.01 28, абз. 11 и Рим 1:20';
  const refs = plugin._parseScriptureLinks(line, DisplayType.cite);
  // "абз. 11" is picked up as an (invalid) chapter-only reference and ignored; only Romans is valid
  const valid = refs.filter((r) => r.passages.every((p) => p.error === 'none'));
  assert.equal(valid.length, 1);
  assert.equal(valid[0].passages[0].displayFull, 'Римлянам 1:20');

  const { output, changed } = plugin._convertScriptureToJWLibrary(line, DisplayType.md);
  assert.ok(changed);
  assert.match(output, /w25\.01 28, абз\. 11/); // publication text left untouched
  assert.match(output, /\[Римлянам 1:20\]\(jwlibrary:\/\/\/finder\?bible=45001020&wtlocale=U\)/);
});

test('lowercase scripture abbreviations are not treated as publications', () => {
  for (const ref of ['rom 1:20', 'ps 23:1', 'jas 1:5', 'Rom 1:20']) {
    assert.equal(jwl.matchOtherPublication(ref), null, ref);
  }
});

test('ordinary text is not treated as a publication reference', () => {
  assert.equal(jwl.matchOtherPublication('We met on 5 June at 10 and read it 3 times in 2024'), null);
  assert.equal(jwl.matchOtherPublication('Read rom 1:20 on 5 June'), null);
});

test('real publication references are recognised', () => {
  assert.equal(jwl.matchOtherPublication('od 15 par. 3')[0].trim(), 'od 15 par. 3');
  assert.equal(jwl.matchOtherPublication('it-1 332')[0].trim(), 'it-1 332');
  assert.equal(jwl.matchOtherPublication('cl chap. 8 p. 77 par. 2')[1], 'cl');
  // unknown code is accepted when a paragraph/page marker is present
  assert.equal(jwl.matchOtherPublication('xyz 4 par. 2')[1], 'xyz');
});

test('English Watchtower month names are auto-formatted correctly', () => {
  // month without a day used to produce "01/undefined"
  assert.equal(jwl.autoFormatEnglishWatchtower('w10 January p. 3 par. 1'), 'w10 01/1 p. 3 par. 1');
  assert.equal(jwl.autoFormatEnglishWatchtower('w10 15 January p. 3 par. 1'), 'w10 01/15 p. 3 par. 1');
  // 2016+ issues are monthly: YY.MM format
  assert.equal(jwl.autoFormatEnglishWatchtower('w25 March p. 8 par. 2'), 'w25.03 p. 8 par. 2');
  assert.equal(jwl.autoFormatEnglishWatchtower('ws17 15 March p. 8 par. 2'), 'ws17.03 p. 8 par. 2');
});

test('Spanish and Russian Watchtower month names are auto-formatted correctly', () => {
  assert.equal(jwl.autoFormatSpanishWatchtower('w25 Marzo pág. 8 párr. 2'), 'w25.03 pág. 8 párr. 2');
  // Spanish pre-2016 uses day/month, like Russian (checked on wol.jw.org)
  assert.equal(jwl.autoFormatSpanishWatchtower('w10 15 Enero pág. 3 párr. 1'), 'w10 15/1 pág. 3 párr. 1');
  // Russian pre-2016 uses day/month
  assert.equal(jwl.autoFormatRussianWatchtower('w10 15 января с. 3 абз. 1'), 'w10 15/1 с. 3 абз. 1');
  assert.equal(jwl.autoFormatRussianWatchtower('w25 Март с. 8 абз. 2'), 'w25.03 8, абз. 2');
});

test('every auto-formatted Watchtower reference can be routed to a handler', () => {
  const C = jwl.Config;
  const routed = (s) => {
    if (jwl.isRussianPubReference(s)) return true;
    for (const re of [C.englishPubRegex, C.englishPubMonthNumberRegex]) {
      re.lastIndex = 0;
      if (re.test(s)) return true;
    }
    return false;
  };
  for (const input of [
    jwl.autoFormatEnglishWatchtower('w10 January p. 3 par. 1'),
    jwl.autoFormatEnglishWatchtower('w25 March p. 8 par. 2'),
    jwl.autoFormatSpanishWatchtower('w25 Marzo pág. 8 párr. 2'),
    jwl.autoFormatRussianWatchtower('w10 15 января с. 3 абз. 1'),
    jwl.autoFormatRussianWatchtower('w25 Март с. 8 абз. 2'),
  ]) {
    assert.ok(routed(input), input);
  }
});

test('Russian Watchtower references parse in all supported formats', () => {
  assert.deepEqual(jwl.parseRussianPubReference('w25.3 с. 8 абз. 2'), {
    isStudy: false, year: '25', monthNum: '3', day: null, page: '8', paragraph: '2',
  });
  assert.deepEqual(jwl.parseRussianPubReference('ws12.02 15 абз. 2'), {
    isStudy: true, year: '12', monthNum: '02', day: null, page: '15', paragraph: '2',
  });
  assert.deepEqual(jwl.parseRussianPubReference('w10 15/1 с. 3 абз. 1'), {
    isStudy: false, year: '10', monthNum: '1', day: '15', page: '3', paragraph: '1',
  });
  assert.equal(jwl.parseRussianPubReference('просто текст'), null);
});

test('Russian publication citations insert the paragraph text from the WOL lookup', async () => {
  const plugin = createPlugin(jwl, { pubTemplate: '{title}\n{text}', pubCalloutTemplate: '> [!cite] ПУБЛ. — {title}\n> {text}\n' });
  const urls = [];
  plugin._fetchDOM = async (url) => {
    urls.push(decodeURIComponent(url));
    return { querySelector: (sel) => (sel === '.resultItems' ? { textContent: '2 Иисус любил Иегову всем разумом.' } : null) };
  };
  const out = await plugin._fetchRussianPublicationCitation('w25.3 с. 8 абз. 2', null, 'citeVerseCallout');
  assert.doesNotMatch(out, /недопустимая/);
  assert.equal(urls[0], 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=w25.03 8, абз. 2');
  assert.match(out, /^> \[!cite\] ПУБЛ\. — \[Сторожевая башня 2025 Март с\. 8 абз\. 2\]\(https:\/\/wol\.jw\.org\/ru\//m);
  assert.match(out, /^> \*\*2\*\* Иисус любил Иегову всем разумом\.$/m);

  // pre-2016 day/month query, and a readable fallback when nothing is found
  urls.length = 0;
  plugin._fetchDOM = async (url) => { urls.push(decodeURIComponent(url)); return null; };
  const old = await plugin._fetchRussianPublicationCitation('w10 15/1 с. 3 абз. 1', null, 'citeVerse');
  assert.equal(urls[0], 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=w10 15/1 с. 3 абз. 1');
  assert.match(old, /Сторожевая башня 2010 15 января с\. 3 абз\. 1/);
  assert.match(old, /Текст не найден/);
});

test('wol.jw.org and jw.org finder links are parsed in any language', () => {
  const plugin = createPlugin(jwl);
  const [ru] = plugin._getLinksInText('https://wol.jw.org/ru/wol/d/r2/lp-u/2024560#h=5');
  assert.deepEqual([ru.docId, ru.parId, ru.wtlocale], ['2024560', '5', 'U']);

  const [es] = plugin._getLinksInText('https://wol.jw.org/es/wol/d/r4/lp-s/2024560#h=67-73:0');
  assert.deepEqual([es.docId, es.parId, es.wtlocale], ['2024560', '67', 'S']);

  const [finder] = plugin._getLinksInText('https://www.jw.org/finder?srcid=jwlshare&wtlocale=U&prefer=lang&docid=1965402&par=8');
  assert.deepEqual([finder.docId, finder.parId, finder.wtlocale], ['1965402', '8', 'U']);
  assert.equal(finder.url, 'https://wol.jw.org/ru/wol/d/r2/lp-u/1965402#h=8');

  const { output, changed } = plugin._convertWebToJWLibrary('[x](https://wol.jw.org/ru/wol/d/r2/lp-u/2024560#h=5)');
  assert.ok(changed);
  assert.equal(output, '[x](jwlibrary:///finder?wtlocale=U&docid=2024560&par=5)');
});

test('paragraph citation looks up consecutive paragraph ids (#p5, #p6)', async () => {
  const plugin = createPlugin(jwl, { pubTemplate: '{title}\n{text}' });
  const selectors = [];
  plugin._fetchDOM = async () => ({ querySelector: () => null });
  plugin._getElementAsText = (_dom, selector) => {
    selectors.push(selector);
    return 'text';
  };
  const url = 'https://wol.jw.org/en/wol/d/r1/lp-e/2024560#h=5';
  await plugin._fetchParagraphCitation(url, null, 0, 'citeParagraph', 2);
  assert.deepEqual(selectors.filter((s) => /^#p\d/.test(s)), ['#p5', '#p6']);
});

test('citing text without a scripture reports an invalid reference', async () => {
  const plugin = createPlugin(jwl);
  const out = await plugin._fetchBibleCitation('просто текст', null, undefined, 'citeVerse');
  assert.match(out, /^просто текст \| ⚠️/);
});

test('a failed verse lookup is reported instead of inserting an empty citation', async () => {
  const plugin = createPlugin(jwl, { verseTemplate: '{title} “{text}”' });
  plugin._fetchDOM = async () => null; // offline
  const out = await plugin._fetchBibleCitation('Rom 1:20', null, undefined, 'citeVerse');
  assert.match(out, /Rom 1:20\n.*\| ⚠️/);
});

test('history respects the historySize setting', () => {
  const view = Object.create(jwl.JWLLinkerView.prototype);
  view.settings = { historySize: 3 };
  view.history = [];
  view.app = { workspace: { requestSaveLayout() {} } };
  for (let i = 0; i < 10; i++) view.addToHistory(`url${i}`, `link${i}`, ['text']);
  assert.equal(view.history.length, 3);
  assert.equal(view.history[0].url, 'url9');
});

test('callout templates keep every line inside the callout without doubling ">"', () => {
  const tpl = '> [!cite] PUB. — {title}\n> {text}\n';
  assert.equal(
    jwl.fillCitationTemplate(tpl, 'T', '**7** first\n> second\n\nthird $1'),
    '> [!cite] PUB. — T\n> **7** first\n> second\n>\n> third $1\n',
  );
  // plain templates are left as they are
  assert.equal(jwl.fillCitationTemplate('{title}\n“*{text}*”', 'T', 'a\nb'), 'T\n“*a\nb*”');
});
