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

test('every auto-formatted Watchtower reference can be parsed', () => {
  for (const input of [
    jwl.autoFormatEnglishWatchtower('w10 January p. 3 par. 1'),
    jwl.autoFormatEnglishWatchtower('w25 March p. 8 par. 2'),
    jwl.autoFormatSpanishWatchtower('w25 Marzo pág. 8 párr. 2'),
    jwl.autoFormatSpanishWatchtower('w10 15 Enero pág. 3 párr. 1'),
    jwl.autoFormatRussianWatchtower('w10 15 января с. 3 абз. 1'),
    jwl.autoFormatRussianWatchtower('w25 Март с. 8 абз. 2'),
  ]) {
    assert.ok(jwl.parseWatchtowerReference(input), input);
  }
});

test('Watchtower references parse in every supported format', () => {
  const pick = (r) => r && [r.isStudy, r.year, r.month, r.day, r.page, r.paragraph, r.sourceLang];
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w25.3 с. 8 абз. 2')), [false, '25', 3, null, '8', '2', 'RU']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w25.01 28, абз. 11')), [false, '25', 1, null, '28', '11', 'RU']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w10 15/1 с. 3 абз. 1')), [false, '10', 1, 15, '3', '1', 'RU']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w65 6/1 p. 329 par. 6')), [false, '65', 6, 1, '329', '6', 'EN']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('ws12 2/15 15 par. 2')), [true, '12', 2, 15, '15', '2', 'EN']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w23.12 p. 20 par. 7')), [false, '23', 12, null, '20', '7', 'EN']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w23.12 pág. 20 párr. 7')), [false, '23', 12, null, '20', '7', 'ES']);
  assert.deepEqual(pick(jwl.parseWatchtowerReference('w10 15/1 pág. 3 párr. 1')), [false, '10', 1, 15, '3', '1', 'ES']);
  assert.equal(jwl.parseWatchtowerReference('w23.13 p. 20 par. 7'), null); // no month 13
  assert.equal(jwl.parseWatchtowerReference('w23.12 p. 20'), null); // paragraph required
  assert.equal(jwl.parseWatchtowerReference('просто текст'), null);
});

test('Watchtower queries and titles are built in the citation language', () => {
  // these query formats were checked against wol.jw.org and return the requested paragraph
  const modern = jwl.parseWatchtowerReference('w23.12 p. 20 par. 7');
  assert.equal(jwl.formatWatchtowerQuery(modern, 'EN'), 'w23.12 p. 20 par. 7');
  assert.equal(jwl.formatWatchtowerQuery(modern, 'RU'), 'w23.12 20, абз. 7');
  assert.equal(jwl.formatWatchtowerQuery(modern, 'ES'), 'w23.12 pág. 20 párr. 7');
  const old = jwl.parseWatchtowerReference('w10 15/1 с. 3 абз. 1');
  assert.equal(jwl.formatWatchtowerQuery(old, 'EN'), 'w10 1/15 p. 3 par. 1');
  assert.equal(jwl.formatWatchtowerQuery(old, 'RU'), 'w10 15/1 с. 3 абз. 1');
  assert.equal(jwl.formatWatchtowerQuery(old, 'ES'), 'w10 15/1 pág. 3 párr. 1');

  assert.equal(jwl.formatWatchtowerTitle(modern, 'EN'), 'The Watchtower 2023 December p. 20 par. 7');
  assert.equal(jwl.formatWatchtowerTitle(modern, 'RU'), 'Сторожевая башня 2023 Декабрь с. 20 абз. 7');
  assert.equal(jwl.formatWatchtowerTitle(old, 'EN'), 'The Watchtower 2010 January 15 p. 3 par. 1');
  assert.equal(jwl.formatWatchtowerTitle(old, 'RU'), 'Сторожевая башня 2010 15 января с. 3 абз. 1');
  assert.equal(jwl.formatWatchtowerTitle(old, 'ES'), 'La Atalaya 2010 15 de enero pág. 3 párr. 1');
});

test('other publication queries and titles are built in the citation language', () => {
  const od = jwl.parseOtherPublicationReference('od 15 par. 3');
  assert.equal(od.sourceLang, 'EN');
  // WOL needs the chapter marker for od/cl paragraphs
  assert.equal(jwl.formatOtherPublicationQuery(od, 'EN'), 'od chap. 15 par. 3');
  assert.equal(jwl.formatOtherPublicationQuery(od, 'RU'), 'od глава 15 абз. 3');
  assert.equal(jwl.formatOtherPublicationQuery(od, 'ES'), 'od cap. 15 párr. 3');
  assert.equal(jwl.formatOtherPublicationTitle(od, 'RU'), 'Организованы исполнять волю Иеговы глава 15 абз. 3');

  const cl = jwl.parseOtherPublicationReference('cl глава 8 с. 77 абз. 2');
  assert.equal(cl.sourceLang, 'RU');
  assert.equal(jwl.formatOtherPublicationQuery(cl, 'EN'), 'cl chap. 8 p. 77 par. 2');
  assert.equal(jwl.formatOtherPublicationQuery(cl, 'ES'), 'cl cap. 8 pág. 77 párr. 2');

  const it = jwl.parseOtherPublicationReference('it-1 332');
  assert.equal(jwl.formatOtherPublicationQuery(it, 'ES'), 'it-1 332');
  assert.equal(jwl.parseOtherPublicationReference('od cap. 15 párr. 3').sourceLang, 'ES');
});

test('publication citations insert the paragraph text from the WOL lookup', async () => {
  const plugin = createPlugin(jwl, { pubTemplate: '{title}\n“*{text}*”', pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n' });
  const urls = [];
  plugin._fetchDOM = async (url) => {
    urls.push(decodeURIComponent(url));
    return { querySelector: (sel) => (sel === '.resultItems' ? { textContent: '2 Иисус любил Иегову всем разумом.' } : null) };
  };
  const out = await plugin._fetchPublicationCitation('w25.3 с. 8 абз. 2', null, 'citeVerseCallout');
  assert.equal(urls[0], 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=w25.03 8, абз. 2');
  assert.match(out, /^> \[!cite\] ПУБЛ\. — \[Сторожевая башня 2025 Март с\. 8 абз\. 2\]\(https:\/\/wol\.jw\.org\/ru\//m);
  assert.match(out, /^> \*\*2\*\* Иисус любил Иегову всем разумом\.$/m);

  // plain template, other publication, readable fallback when nothing is found
  urls.length = 0;
  plugin._fetchDOM = async (url) => { urls.push(decodeURIComponent(url)); return null; };
  const od = await plugin._fetchPublicationCitation('od 15 par. 3', null, 'citeVerse');
  assert.equal(urls[0], 'https://wol.jw.org/en/wol/l/r1/lp-e?q=od chap. 15 par. 3');
  assert.match(od, /^\[Organized to Do Jehovah's Will chap\. 15 par\. 3\]/m);
  assert.match(od, /Text not found/);
});

test('a fixed citation language converts the reference to that language', async () => {
  const plugin = createPlugin(jwl, { lang: 'Russian', pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n' });
  const urls = [];
  plugin._fetchDOM = async (url) => { urls.push(decodeURIComponent(url)); return null; };
  const out = await plugin._fetchPublicationCitation('w23.12 p. 20 par. 7', null, 'citeVerseCallout');
  assert.equal(urls[0], 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=w23.12 20, абз. 7');
  assert.match(out, /ПУБЛ\. — \[Сторожевая башня 2023 Декабрь/);
});

test('dual mode cites a publication in both configured languages', async () => {
  const plugin = createPlugin(jwl, { dualLangFirst: 'ru', dualLangSecond: 'es', pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n' });
  const urls = [];
  plugin._fetchDOM = async (url) => {
    urls.push(decodeURIComponent(url));
    return { querySelector: (sel) => (sel === '.resultItems' ? { textContent: '3 text' } : null) };
  };
  const out = await plugin._fetchDualPublicationCitation('od 15 par. 3', null, 'citePublicationLookup');
  assert.deepEqual(urls, [
    'https://wol.jw.org/ru/wol/l/r2/lp-u?q=od глава 15 абз. 3',
    'https://wol.jw.org/es/wol/l/r4/lp-s?q=od cap. 15 párr. 3',
  ]);
  assert.match(out, /ПУБЛ\. — \[Организованы исполнять волю Иеговы глава 15 абз\. 3\]/);
  assert.match(out, /PUBL\. — \[Organizados para hacer la voluntad de Jehová cap\. 15 párr\. 3\]/);
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

test('JW Library Bible links are parsed for the verse preview', () => {
  const ru = jwl.parseJwlBibleHref('jwlibrary:///finder?bible=45001020-45001022&wtlocale=U');
  assert.deepEqual(ru.ids, ['45001020', '45001021', '45001022']);
  assert.equal(ru.lang, 'RU');
  assert.equal(ru.url, 'https://www.jw.org/finder?wtlocale=U&bible=45001020-45001022');
  assert.deepEqual(jwl.parseJwlBibleHref('jwlibrary:///finder?bible=1001001&wtlocale=E').ids, ['1001001']); // Genesis
  assert.equal(jwl.parseJwlBibleHref('jwlibrary:///finder?wtlocale=E&docid=2024560&par=5'), null); // publication link
  assert.equal(jwl.parseJwlBibleHref('https://www.jw.org/finder?bible=45001020'), null);
  assert.equal(jwl.parseJwlBibleHref(null), null);
});

test('verse preview shows at most 5 verses, caches results and retries failures', async () => {
  const plugin = createPlugin(jwl);
  let fetches = 0;
  plugin._fetchDOM = async () => { fetches++; return {}; };
  plugin._getElementAsText = (_dom, selector) => `${Number(selector.slice(-3))} verse text`;
  const href = 'jwlibrary:///finder?bible=19119001-19119040&wtlocale=E'; // Ps 119:1-40
  const first = await plugin._fetchVersePreview(href);
  assert.equal(first.verses.length, 5);
  assert.equal(first.verses[0], '1 verse text');
  assert.equal(first.more, 35);
  await plugin._fetchVersePreview(href);
  assert.equal(fetches, 1); // second hover served from the cache

  plugin._fetchDOM = async () => { fetches++; return null; }; // offline
  const offline = 'jwlibrary:///finder?bible=43003016&wtlocale=E';
  assert.equal((await plugin._fetchVersePreview(offline)).failed, true);
  await plugin._fetchVersePreview(offline);
  assert.equal(fetches, 3); // failures are not cached
  assert.equal(await plugin._fetchVersePreview('jwlibrary:///finder?docid=1'), null);
});

test('Spanish book names are recognised even when auto-detection guesses English', () => {
  const plugin = createPlugin(jwl);
  const link = (text) => plugin._parseScriptureLinks(text, DisplayType.md)[0]?.passages[0]?.link?.jwlib;
  assert.equal(link('Juan 3:16'), 'jwlibrary:///finder?bible=43003016&wtlocale=S');
  assert.equal(link('Mateo 24:14'), 'jwlibrary:///finder?bible=40024014&wtlocale=S');
  assert.equal(link('Salmo 89:18'), 'jwlibrary:///finder?bible=19089018&wtlocale=S');
  assert.equal(link('John 3:16'), 'jwlibrary:///finder?bible=43003016&wtlocale=E'); // English stays English
  // a fixed citation language keeps its own locale and book name
  const ru = createPlugin(jwl, { lang: 'Russian' })._parseScriptureLinks('Juan 3:16', DisplayType.md)[0].passages[0];
  assert.equal(ru.displayFull, 'Иоанна 3:16');
  assert.equal(ru.link.jwlib, 'jwlibrary:///finder?bible=43003016&wtlocale=U');
});

test('paragraph lists and ranges are cited one WOL request per paragraph', async () => {
  const plugin = createPlugin(jwl, { pubCalloutTemplate: '> [!cite] PUB. — {title}\n> {text}\n' });
  const queries = [];
  plugin._fetchDOM = async (url) => {
    queries.push(decodeURIComponent(url).replace(/^.*\?q=/, ''));
    const n = queries.length;
    return { querySelector: (sel) => (sel === '.resultItems' ? { textContent: `${n} paragraph ${n}` } : null) };
  };
  const out = await plugin._fetchPublicationCitation('w23.12 p. 20 pars. 7-9', null, 'citeVerseCallout');
  assert.deepEqual(queries, ['w23.12 p. 20 par. 7', 'w23.12 p. 20 par. 8', 'w23.12 p. 20 par. 9']);
  assert.match(out, /The Watchtower 2023 December p\. 20 par\. 7-9\]/);
  assert.match(out, /^> \*\*1\*\* paragraph 1\n> \*\*2\*\* paragraph 2\n> \*\*3\*\* paragraph 3$/m);

  queries.length = 0;
  await plugin._fetchPublicationCitation('w25.01 28, абз. 11, 12', null, 'citeVerseCallout');
  assert.deepEqual(queries, ['w25.01 28, абз. 11', 'w25.01 28, абз. 12']);

  queries.length = 0;
  await plugin._fetchPublicationCitation('od cap. 15 párr. 3—4', null, 'citeVerseCallout');
  assert.deepEqual(queries, ['od cap. 15 párr. 3', 'od cap. 15 párr. 4']);

  // long ranges are limited to 10 paragraphs, and the title says so
  assert.equal(jwl.parseWatchtowerReference('w23.12 p. 20 par. 1-30').paragraph, '1-10');
});

test('links to a paragraph range cite the whole range', async () => {
  const plugin = createPlugin(jwl, { pubTemplate: '{title}\n{text}' });
  const [wol] = plugin._getLinksInText('https://wol.jw.org/ru/wol/d/r2/lp-u/2024560#h=5-7');
  assert.deepEqual([wol.parId, wol.parEnd], ['5', '7']);
  const [finder] = plugin._getLinksInText('https://www.jw.org/finder?wtlocale=E&docid=1965402&par=8-9');
  assert.equal(finder.url, 'https://wol.jw.org/en/wol/d/r1/lp-e/1965402#h=8-9');

  const selectors = [];
  plugin._fetchDOM = async () => ({});
  plugin._getElementAsText = (_dom, selector) => { selectors.push(selector); return 'text'; };
  await plugin._fetchParagraphCitation('https://wol.jw.org/en/wol/d/r1/lp-e/2024560#h=5-7', null, 0, 'citeParagraph', 1);
  assert.deepEqual(selectors.filter((s) => /^#p\d/.test(s)), ['#p5', '#p6', '#p7']);
});

test('Live Preview links cover each passage as typed, without changing the text', () => {
  const plugin = createPlugin(jwl);
  const ranges = (text) =>
    jwl.scriptureLinkRanges(plugin, text).map((r) => [text.slice(r.from, r.to), r.href.replace(/^.*bible=/, '')]);
  assert.deepEqual(ranges('Read Ps 23:1-3, 5; 24:1 today'), [
    ['Ps 23:1-3', '19023001-19023003&wtlocale=E'],
    ['5', '19023005&wtlocale=E'],
    ['24:1', '19024001&wtlocale=E'],
  ]);
  assert.deepEqual(ranges('John 3:16, 17 and Jude 3'), [
    ['John 3:16, 17', '43003016-43003017&wtlocale=E'], // consecutive verses are one passage
    ['Jude 3', '65001003&wtlocale=E'],
  ]);
  assert.deepEqual(ranges('См. w25.01 28, абз. 11 и Рим 1:20'), [['Рим 1:20', '45001020&wtlocale=U']]);
  assert.deepEqual(ranges('[Rom 1:20](x) and Rom 8:28'), [['Rom 8:28', '45008028&wtlocale=E']]); // existing link skipped
  assert.deepEqual(ranges("'Rom 1:20 is skipped"), []);
  assert.deepEqual(ranges('no references here'), []);
});

test('suggestions list Bible books and publication codes after the trigger', () => {
  const books = (q, lang) => jwl.suggestionsFor(q, lang).filter((s) => s.kind === 'book').map((s) => `${s.label} ${s.lang}`);
  assert.deepEqual(books('рим', 'RU'), ['Римлянам RU']);
  assert.deepEqual(books('rom', 'EN'), ['Romans EN', 'Romanos ES']); // preferred language first
  assert.deepEqual(books('1 co', 'EN'), ['1 Corinthians EN', '1 Corintios ES']);
  assert.deepEqual(books('juan', 'RU'), ['Juan ES']);
  const od = jwl.suggestionsFor('od', 'RU').find((s) => s.kind === 'publication');
  assert.equal(od.insert, 'od ');
  assert.equal(od.detail, 'Организованы исполнять волю Иеговы');
  assert.deepEqual(jwl.suggestionsFor('', 'EN'), []);

  // trigger detection
  const plugin = createPlugin(jwl, { suggestions: true, suggestTrigger: '@' });
  const suggest = new jwl.ReferenceSuggest({}, plugin);
  const trigger = (line) => suggest.onTrigger({ line: 0, ch: line.length }, { getLine: () => line });
  assert.deepEqual(trigger('see @rom'), { start: { line: 0, ch: 4 }, end: { line: 0, ch: 8 }, query: 'rom' });
  assert.equal(trigger('@1 co').query, '1 co');
  assert.equal(trigger('mail me at a@rom'), null); // not at the start of a word
  assert.equal(trigger('see @'), null); // nothing typed yet
  plugin.settings.suggestions = false;
  assert.equal(trigger('see @rom'), null);
});

test('Live Preview link ranges are cached per line and follow setting changes', () => {
  const plugin = createPlugin(jwl, { lang: 'Auto' });
  const text = 'Read Rom 1:20 today';
  const first = jwl.scriptureLinkRanges(plugin, text);
  assert.equal(jwl.scriptureLinkRanges(plugin, text), first); // same line => cached result
  assert.match(first[0].href, /wtlocale=E$/);

  plugin.settings.lang = 'Russian'; // a setting that changes the links clears the cache
  const russian = jwl.scriptureLinkRanges(plugin, text);
  assert.notEqual(russian, first);
  assert.match(russian[0].href, /wtlocale=U$/);
});
