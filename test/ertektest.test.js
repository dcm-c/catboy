// Értékteszt: adatok épsége, pontozás, besorolás, megosztható kódolás
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../public/ertektest-data.js');
const C = require('../public/ertektest-core.js');
const pub = f => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const AX = D.AXES.map(a => a.id);

test('adatok: egyedi azonosítók, ismert tengelyek, minden tengelyhez elég állítás mindkét irányból', () => {
    const ids = new Set();
    const per = {}, dir = {};
    for (const s of D.STATEMENTS) {
        assert.ok(!ids.has(s.id), 'ismétlődő id: ' + s.id);
        ids.add(s.id);
        assert.ok(s.text.length > 20 && s.text.length < 200, s.id);
        for (const [a, w] of Object.entries(s.w)) {
            assert.ok(AX.includes(a), 'ismeretlen tengely: ' + a);
            assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1);
            per[a] = (per[a] || 0) + 1;
            (dir[a] = dir[a] || new Set()).add(Math.sign(w));
        }
    }
    assert.ok(D.STATEMENTS.length >= 36);
    for (const a of AX) {
        assert.ok(per[a] >= 7, a + ' tengelyhez kevés állítás: ' + per[a]);
        assert.equal(dir[a].size, 2, a + ': mindkét irányból kellenek állítások, hogy ne lehessen kitalálni a "jó" választ');
    }
});

test('adatok: típusok és utált értékek rendben vannak, a párok mindenkit pontosan kétszer szerepeltetnek', () => {
    const ids = new Set();
    for (const a of D.ARCHETYPES) {
        assert.ok(!ids.has(a.id)); ids.add(a.id);
        assert.ok(a.title && a.emoji && a.desc.length > 60 && a.sunday.length > 20, a.id);
        for (const k of AX) assert.ok(typeof a.v[k] === 'number' && Math.abs(a.v[k]) <= 1, a.id + ' ' + k);
    }
    assert.ok(D.ARCHETYPES.length >= 12);
    const hid = new Set(D.HATED.map(h => h.id));
    assert.equal(hid.size, D.HATED.length);
    const seen = {};
    for (const p of D.HATED_PAIRS) {
        assert.equal(p.length, 2);
        for (const id of p) { assert.ok(hid.has(id), id); seen[id] = (seen[id] || 0) + 1; }
        assert.notEqual(p[0], p[1]);
    }
    for (const id of hid) assert.equal(seen[id], 2, id + ' pontosan kétszer szerepeljen');
});

test('pontozás: szélsőséges válaszok a tengely végére visznek, a passz nem számít, a semleges nullára húz', () => {
    const all = v => Object.fromEntries(D.STATEMENTS.map(s => [s.id, v]));
    // mindenre igen: a súlyok előjele szerint kiegyenlített állításoknál nem lehet minden tengely a végén
    const yes = C.axisScores(all(2)), no = C.axisScores(all(-2));
    for (const a of AX) assert.equal(yes[a], -no[a]);
    const zero = C.axisScores(all(0));
    for (const a of AX) assert.equal(zero[a], 0);
    // egyetlen tengely tiszta végletig: csak a hozzá tartozó állításokra igen/nem a súly előjele szerint
    const e = {};
    for (const s of D.STATEMENTS) e[s.id] = s.w.e ? 2 * Math.sign(s.w.e) : null;
    assert.equal(C.axisScores(e).e, 100);
    const skipped = C.axisScores({});
    for (const a of AX) assert.equal(skipped[a], 0);
});

test('besorolás: minden típus a saját középpontjához tér vissza, és az illeszkedés sávban marad', () => {
    for (const a of D.ARCHETYPES) {
        const sc = Object.fromEntries(AX.map(k => [k, Math.round(a.v[k] * 100)]));
        const r = C.classify(sc);
        assert.equal(r.id, a.id);
        assert.ok(r.fit >= 90 && r.fit <= 99, a.id + ' ' + r.fit);
    }
    const far = C.classify({ e: 100, l: -100, n: 100, t: -100, c: 100 });
    assert.ok(far.fit >= 5 && far.fit <= 99);
});

test('besorolás: valós eloszlás: egyik típus sem nyeli el a mezőnyt, mindegyik előfordul (rögzített magú véletlen)', () => {
    let seed = 12345;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const dist = {};
    const N = 6000;
    for (let i = 0; i < N; i++) {
        const t = Object.fromEntries(AX.map(a => [a, rnd() * 2 - 1]));
        const ans = {};
        for (const s of D.STATEMENTS) {
            const ks = Object.keys(s.w);
            let x = 0; for (const k of ks) x += t[k] * Math.sign(s.w[k]);
            x = x / ks.length * 2 + (rnd() - .5) * 1.5;
            ans[s.id] = Math.max(-2, Math.min(2, Math.round(x)));
        }
        const id = C.classify(C.axisScores(ans)).id;
        dist[id] = (dist[id] || 0) + 1;
    }
    for (const a of D.ARCHETYPES) assert.ok(dist[a.id] > N * 0.005, a.id + ' szinte sosem jön ki');
    assert.ok(Math.max(...Object.values(dist)) < N * 0.2, 'egy típus túl gyakori');
});

test('utált értékek: a legtöbbször választott nyer, döntetlennél a lista sorrendje', () => {
    const picks = D.HATED_PAIRS.map(p => p[0]);
    const r = C.hatedResult(picks);
    assert.equal(r.reduce((s, x) => s + x.count, 0), D.HATED_PAIRS.length);
    assert.ok(r[0].count >= r[1].count);
    const same = C.hatedResult(['penz', 'penz', 'parancs']);
    assert.equal(same[0].id, 'penz');
    assert.equal(same[0].count, 2);
    assert.deepEqual(C.hatedResult([]).map(x => x.count).filter(Boolean), []);
    const s = C.summarize({}, ['penz', 'penz', 'parancs']);
    assert.deepEqual(s.h, ['penz', 'parancs']);
});

test('megosztás: a kódolás körbejár, a hibás vagy hamis tartalom elutasítva', () => {
    const sum = { s: { e: 40, l: -20, n: 10, t: -60, c: 100 }, a: 'vitorlazo', fit: 83, h: ['patosz', 'penz'] };
    const code = C.encode(sum);
    assert.match(code, /^[A-Za-z0-9_-]+$/);
    assert.ok(code.length < 400);
    const back = C.decode(code);
    assert.deepEqual(back, sum);
    assert.equal(C.decode('zzzz'), null);
    assert.equal(C.decode(''), null);
    const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    assert.equal(C.decode(enc({ v: 2, s: [0, 0, 0, 0, 0], a: 'merleg' })), null, 'ismeretlen verzió');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0], a: 'merleg' })), null, 'hiányzó tengely');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0, 0], a: '<img onerror=x>' })), null, 'ismeretlen típus');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0, 'x'], a: 'merleg' })), null, 'nem szám');
    const clamped = C.decode(enc({ v: 1, s: [999, -999, 0, 0, 0], a: 'merleg', f: 1000, h: ['penz', '<b>', 'x', 'patosz'] }));
    assert.deepEqual(clamped.s, { e: 100, l: -100, n: 0, t: 0, c: 0 });
    assert.equal(clamped.fit, 99);
    assert.deepEqual(clamped.h, ['penz', 'patosz'], 'az ismeretlen azonosítók kiesnek');
});

test('oldal: az értékteszt be van kötve (navbar, sitemap, scriptek, AI-slop és szórakoztató jelzés)', () => {
    const h = pub('ertektest.html');
    for (const f of ['ertektest-data.js', 'ertektest-core.js', 'ertektest.js', 'ertektest.css', 'theme.js', 'uwu.js']) assert.ok(h.includes(f), f);
    assert.ok(h.indexOf('ertektest-data.js') < h.indexOf('ertektest-core.js') && h.indexOf('ertektest-core.js') < h.indexOf('src="ertektest.js"'));
    assert.match(h, /AI-slop, vibe kódolt/);
    assert.match(h, /id="et-stage"[^>]*data-no-uwu/);
    assert.match(pub('navbar.html'), /href="ertektest\.html" data-page="ertektest\.html"/);
    assert.match(pub('sitemap.xml'), /femboy\.hu\/ertektest\.html/);
});

test('Életút: a megosztás linkje JSON-t visz az URL-ben, és megnyitáskor ellenőrzött', () => {
    const js = pub('eletut.js'), html = pub('eletut.html');
    assert.match(js, /'#r=' \+ b64uEnc\(JSON\.stringify\(sharePayload\(\)\)\)/);
    assert.match(js, /function parseShared/);
    assert.match(js, /D\.find\(D\.ITEMS, o\.o\[slot\]\)/, 'a ruhák azonosítóit ellenőrzi');
    for (const id of ['el-shared', 'el-sh-art', 'el-sh-play', 'el-share-box', 'el-share-url', 'el-share-copy']) assert.ok(html.includes('id="' + id + '"'), id);
});
