// A játék felületének szerkezeti ellenőrzései: a JS által kért elemek léteznek, a színkészlet minden témában
// definiált, a mobil akciósáv és a görgethető menü stílusa megvan, a menücsoportoknak és az akcióknak van színe.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pub = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const html = pub('eletut.html');
const js = pub('eletut.js');
const css = pub('eletut.css');

test('a JS által $(...) -val kért azonosítók léteznek a HTML-ben', () => {
    const wanted = new Set();
    for (const m of js.matchAll(/\$\('([a-z0-9-]+)'\)/g)) wanted.add(m[1]);
    const missing = [...wanted].filter((id) => !new RegExp('id="' + id + '"').test(html) && !new RegExp("\\.id = '" + id + "'").test(js));
    assert.deepStrictEqual(missing, []);
});

test('a három akciógombnak és az értékeknek külön színe van', () => {
    for (const k of ['a-conf', 'a-work', 'a-study']) assert.ok(html.includes(k), k + ' a HTML-ben');
    for (const k of ['s-conf', 's-money', 's-energy', 's-comm', 's-risk']) assert.ok(css.includes('.el-stat.' + k), k + ' a CSS-ben');
    for (const g of ['g-grow', 'g-life', 'g-log']) assert.ok(css.includes('.el-nav-group.' + g), g + ' a CSS-ben');
});

test('a közös színkészlet világos, sötét és buzi témában is definiált', () => {
    for (const v of ['--c-pink', '--c-green', '--c-amber', '--c-blue', '--c-violet']) {
        const n = css.split(v + ':').length - 1;
        assert.ok(n >= 3, v + ' legalább 3 témában kell (' + n + ')');
    }
});

test('mobilon rögzített akciósáv és görgethető, tapadó menü van', () => {
    assert.match(css, /@media \(max-width: 991\.98px\)[\s\S]*\.el-actions\s*\{[^}]*position: fixed/);
    assert.match(css, /@media \(max-width: 767\.98px\)[\s\S]*\.el-nav\s*\{[^}]*overflow-x: auto/);
    assert.match(css, /\.el-toasts \{ bottom: 112px; \}/, 'az értesítés a dokk fölé kerül');
});

test('a menü és a segítősáv nincs UwU-szövegesítve, az idővonal-skála pozicionált', () => {
    assert.match(html, /id="el-tabs"[^>]*data-no-uwu/);
    assert.match(html, /id="el-hint"[^>]*data-no-uwu/);
    assert.match(html, /left:81\.82%">23</);
});

test('a súgó és a billentyűk elérhetők', () => {
    assert.match(html, /id="el-help"/);
    assert.match(js, /function openHelp/);
    assert.match(js, /k === '1' \|\| k === '2' \|\| k === '3'/);
});
