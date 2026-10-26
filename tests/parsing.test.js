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
  assert.deepEqual(books('rom', 'EN'), ['Romans EN', 'Romanos ES', 'Romanos PT', 'Romains FR', 'Römer DE']); // preferred language first
  assert.deepEqual(books('1 co', 'EN'), ['1 Corinthians EN', '1 Corintios ES', '1 Coríntios PT', '1 Corinthiens FR']);
  assert.deepEqual(books('joh', 'DE'), ['Johannes DE', 'John EN']);
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

test('Portuguese, French and German references link to the right book and language', () => {
  const plugin = createPlugin(jwl, { lang: 'Auto' });
  const link = (text) => jwl.scriptureLinkRanges(plugin, text).map((r) => `${text.slice(r.from, r.to)} ${r.href.replace(/^.*bible=/, '')}`);
  const cases = {
    'João 3:16': '43003016&wtlocale=T',
    'Jó 1:1': '18001001&wtlocale=T',
    'Atos 2:4': '44002004&wtlocale=T',
    'Apocalipse 21:4': '66021004&wtlocale=T',
    '1 Coríntios 13:4': '46013004&wtlocale=T',
    'Cântico de Salomão 2:1': '22002001&wtlocale=T',
    'Tg 1:5': '59001005&wtlocale=T',
    'Jean 3:16': '43003016&wtlocale=F',
    'Ré 21:4': '66021004&wtlocale=F',
    'Lc 1:1': '42001001&wtlocale=F',
    'Chant de Salomon 2:1': '22002001&wtlocale=F',
    'Psaumes 83:18': '19083018&wtlocale=F',
    'Johannes 3:16': '43003016&wtlocale=X',
    '1. Mose 3:15': '01003015&wtlocale=X',
    '1Mo 3:15': '01003015&wtlocale=X',
    'Hohes Lied 2:1': '22002001&wtlocale=X',
    'Römer 8:28': '45008028&wtlocale=X',
    'Apg 2:4': '44002004&wtlocale=X',
    'Offenbarung 21:4': '66021004&wtlocale=X',
  };
  for (const [text, href] of Object.entries(cases)) {
    assert.deepEqual(link(text), [`${text} ${href.replace(/^0/, '')}`], text);
  }
  // books with one chapter: the number is the verse
  assert.deepEqual(link('Filêmon 10'), ['Filêmon 10 57001010&wtlocale=T']);
  assert.deepEqual(link('Abdias 3'), ['Abdias 3 31001003&wtlocale=F']);
  assert.deepEqual(link('2. Johannes 5'), ['2. Johannes 5 63001005&wtlocale=X']);
  // a numbered list item is not part of the book name
  assert.deepEqual(link('1. Rom 8:28'), ['Rom 8:28 45008028&wtlocale=E']);
});

test('English, Spanish and Russian book names keep their language', () => {
  const plugin = createPlugin(jwl, { lang: 'Auto' });
  const href = (text) => jwl.scriptureLinkRanges(plugin, text)[0]?.href.replace(/^.*bible=/, '');
  assert.equal(href('John 3:16'), '43003016&wtlocale=E');
  assert.equal(href('1 Samuel 1:1'), '9001001&wtlocale=E'); // was taken for Spanish before
  assert.equal(href('Juan 3:16'), '43003016&wtlocale=S');
  assert.equal(href('Romanos 8:28'), '45008028&wtlocale=S'); // shared with Portuguese
  assert.equal(href('Fil 4:13'), '50004013&wtlocale=S'); // short Spanish form, also Portuguese
  assert.equal(href('Apo 21:4'), '66021004&wtlocale=S');
  assert.equal(href('Ис 41:10'), '23041010&wtlocale=U'); // Isaiah (Исх is Exodus)
  assert.equal(jwl.detectBookLanguage('jean'), 'FR');
  assert.equal(jwl.detectBookLanguage('jud'), 'EN'); // an English name starts with it
});

test('a fixed citation language reads its own abbreviations first', () => {
  const href = (lang, text) => jwl.scriptureLinkRanges(createPlugin(jwl, { lang }), text)[0]?.href.replace(/^.*bible=/, '');
  assert.equal(href('Portuguese', 'Jo 3:16'), '43003016&wtlocale=T'); // João, not Josué
  assert.equal(href('Portuguese', 'John 3:16'), '43003016&wtlocale=T');
  assert.equal(href('German', 'Off 21:4'), '66021004&wtlocale=X');
  assert.equal(href('French', 'Jean 3:16'), '43003016&wtlocale=F');
});

test('Portuguese, French and German publication references build the WOL queries', () => {
  const wt = (text) => {
    const ref = jwl.parseWatchtowerReference(jwl.normalizeInput(text));
    return [ref.sourceLang, jwl.formatWatchtowerQuery(ref, ref.sourceLang), jwl.formatWatchtowerTitle(ref, ref.sourceLang)];
  };
  assert.deepEqual(wt('w23.12 p. 20 § 7'), ['FR', 'w23.12 p. 20 § 7', 'La Tour de Garde 2023 Décembre p. 20 § 7']);
  assert.deepEqual(wt('w10 15/1 p. 3 §1'), ['FR', 'w10 15/1 p. 3 § 1', 'La Tour de Garde 2010 15 janvier p. 3 § 1']);
  assert.deepEqual(wt('w23.12 S. 20 Abs. 7'), ['DE', 'w23.12 S. 20 Abs. 7', 'Der Wachtturm 2023 Dezember S. 20 Abs. 7']);
  assert.deepEqual(wt('w10 15. 1. S. 3 Abs. 1'), ['DE', 'w10 15. 1. S. 3 Abs. 1', 'Der Wachtturm 2010 15. Januar S. 3 Abs. 1']);
  // "p. … par." is English unless the interface is Portuguese
  assert.deepEqual(wt('w10 15/1 p. 3 par. 1').slice(0, 2), ['EN', 'w10 1/15 p. 3 par. 1']); // 15/1 can only be day/month
  jwl.updatePublicationFormatLanguage({ interfaceLang: 'Portuguese' });
  try {
    assert.deepEqual(wt('w23.12 p. 20 par. 7'), ['PT', 'w23.12 p. 20 par. 7', 'A Sentinela 2023 Dezembro p. 20 par. 7']);
    assert.deepEqual(wt('w10 15/1 p. 3 par. 1'), ['PT', 'w10 15/1 p. 3 par. 1', 'A Sentinela 2010 15 de janeiro p. 3 par. 1']);
  } finally {
    jwl.updatePublicationFormatLanguage({ interfaceLang: 'Russian' });
  }

  const other = (text) => {
    const ref = jwl.parseOtherPublicationReference(jwl.normalizeInput(text));
    return [ref.sourceLang, jwl.formatOtherPublicationQuery(ref, ref.sourceLang), jwl.formatOtherPublicationTitle(ref, ref.sourceLang)];
  };
  assert.deepEqual(other('od cap. 15 par. 3'), ['PT', 'od cap. 15 par. 3', 'Organizados para Fazer a Vontade de Jeová cap. 15 par. 3']);
  assert.deepEqual(other('od chap. 15 § 3'), ['FR', 'od chap. 15 § 3', 'Organisés pour faire la volonté de Jéhovah chap. 15 § 3']);
  assert.deepEqual(other('od Kap. 15 Abs. 3'), ['DE', 'od Kap. 15 Abs. 3', 'Organisiert, Jehovas Willen zu tun Kap. 15 Abs. 3']);
  assert.equal(other('od cap. 15 párr. 3')[0], 'ES');

  // a reference typed in one language is cited in another
  const ref = jwl.parseWatchtowerReference('w23.12 p. 20 par. 7');
  assert.equal(jwl.formatWatchtowerQuery(ref, 'DE'), 'w23.12 S. 20 Abs. 7');
  assert.equal(jwl.formatWatchtowerQuery(ref, 'FR'), 'w23.12 p. 20 § 7');
  assert.equal(jwl.formatWatchtowerQuery({ ...ref, month: 1, day: 15, year: '10' }, 'DE'), 'w10 15. 1. S. 20 Abs. 7');
});

test('Watchtower references with month names are formatted in Portuguese, French and German', () => {
  const f = jwl.autoFormatOtherWatchtower;
  assert.equal(f('w25 março p. 8 par. 2'), 'w25.03 p. 8 par. 2');
  assert.equal(f('w10 15 de janeiro p. 3 par. 1'), 'w10 15/1 p. 3 par. 1');
  assert.equal(f('w25 mars p. 8 § 2'), 'w25.03 p. 8 § 2');
  assert.equal(f('w10 15 janvier p. 3 § 1'), 'w10 15/1 p. 3 § 1');
  assert.equal(f('w25 März S. 8 Abs. 2'), 'w25.03 S. 8 Abs. 2');
  assert.equal(f('w10 15. Januar S. 3 Abs. 1'), 'w10 15. 1. S. 3 Abs. 1');
  assert.equal(f('Rom 8:28'), 'Rom 8:28');
});

test('every language has WOL addresses, offline messages and a complete interface', () => {
  assert.deepEqual(jwl.getConfigForLanguage('RU'), {
    jwlLocale: '&wtlocale=U',
    wolRoot: 'https://wol.jw.org/ru/wol/d/',
    wolPublications: 'https://wol.jw.org/ru/wol/d/r2/lp-u/',
    wolLookup: 'https://wol.jw.org/ru/wol/l/r2/lp-u?q=',
    webFinder: 'https://www.jw.org/finder?wtlocale=U&',
  });
  assert.equal(jwl.getConfigForLanguage('PT').wolLookup, 'https://wol.jw.org/pt/wol/l/r5/lp-t?q=');
  assert.equal(jwl.getConfigForLanguage('FR').wolLookup, 'https://wol.jw.org/fr/wol/l/r30/lp-f?q=');
  assert.equal(jwl.getConfigForLanguage('DE').wolLookup, 'https://wol.jw.org/de/wol/l/r10/lp-x?q=');
  assert.equal(jwl.getConfigForLanguage('NL').wolLookup, 'https://wol.jw.org/en/wol/l/r1/lp-e?q='); // no Dutch library yet

  assert.match(jwl.checkPublicationAvailability('w', 'DE', 1940).message, /Der Wachtturm 1940/);
  assert.match(jwl.checkPublicationAvailability('yb', 'PT').message, /Anuário/);
  assert.equal(jwl.checkPublicationAvailability('od', 'FR').isOffline, false);

  assert.equal(jwl.translateBibleLabel('> [!verse] BIBLE — {title}', 'PT'), '> [!verse] BÍBLIA — {title}');
  assert.equal(jwl.translateBibleLabel('> [!verse] БИБЛИЯ — {title}', 'DE'), '> [!verse] BIBEL — {title}');
  assert.equal(jwl.localizeBookName('John\u00A03:16', 43, 'PT'), 'João\u00A03:16');
  assert.equal(jwl.localizeBookName('1.\u00A0Mose\u00A03:15', 1, 'FR'), 'Genèse\u00A03:15');

  const keys = Object.keys(jwl.InterfaceStrings.English).sort();
  for (const [lang, strings] of Object.entries(jwl.InterfaceStrings)) {
    assert.deepEqual(Object.keys(strings).sort(), keys, lang);
    assert.deepEqual(Object.keys(strings.dualLangOptions), ['Auto', 'ru', 'en', 'es', 'pt', 'fr', 'de'], lang);
  }
});
