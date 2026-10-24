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

// ---------- Hosszú (70 kérdéses) teszt ----------
const byId = Object.fromEntries(D.LONG.map(s => [s.id, s]));
const longAns = f => { const a = {}; D.LONG.forEach((s, i) => { a[s.id] = f(s, i); }); return a; };

test('hosszú teszt adatai: 70 egyedi tétel, ismert tengelyek és utált értékek, minden utált értéket legalább 3 tétel mér', () => {
    assert.equal(D.LONG.length, 70);
    assert.equal(new Set(D.LONG.map(s => s.id)).size, 70);
    const hid = D.HATED.map(h => h.id);
    const hc = {}, ac = {}, hdir = {};
    for (const s of D.LONG) {
        assert.ok(['v', 'h', 'l'].includes(s.kind), s.id);
        assert.ok(s.text.length > 20 && s.text.length < 220, s.id);
        for (const [a, w] of Object.entries(s.w || {})) { assert.ok(AX.includes(a), s.id + ' tengely ' + a); assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1); ac[a] = (ac[a] || 0) + 1; }
        for (const [h, w] of Object.entries(s.h || {})) { assert.ok(hid.includes(h), s.id + ' utált érték ' + h); assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1); hc[h] = (hc[h] || 0) + 1; (hdir[h] = hdir[h] || new Set()).add(Math.sign(w)); }
    }
    for (const h of hid) assert.ok(hc[h] >= 3, h + ' skálához kevés tétel: ' + hc[h]);
    for (const a of AX) assert.ok(ac[a] >= 10, a + ' tengelyhez kevés tétel a hosszú tesztben: ' + ac[a]);
    assert.ok(D.LONG.filter(s => s.kind === 'h').length >= 20);
    assert.ok(D.LONG.filter(s => s.h && s.w && Object.keys(s.h).length && Object.keys(s.w).length).length >= 30, 'sok tétel hasson mindkét részre');
    assert.ok(D.LONG.filter(s => s.kind === 'l').every(s => s.lie && s.joke));
    assert.ok(D.LONG.filter(s => s.kind === 'l').length >= 5);
});

test('iker-párok: létező, ellentétes irányú tételek', () => {
    assert.ok(D.TWINS.length >= 5);
    for (const [a, b] of D.TWINS) {
        assert.ok(byId[a] && byId[b], a + '/' + b);
        const shared = Object.keys(byId[a].w).filter(x => byId[b].w[x]);
        assert.ok(shared.length, a + '/' + b + ' közös tengely');
        assert.ok(shared.some(x => Math.sign(byId[a].w[x]) !== Math.sign(byId[b].w[x])), a + '/' + b + ' ugyanazt jelenti');
    }
});

test('hosszú pontozás: utált-érték skálák 0..100, az egyetértés a súly irányában mozdít', () => {
    const none = C.hatedScales({});
    for (const h of D.HATED) assert.equal(none[h.id], 50);
    const agree = C.hatedScales(longAns(s => (s.h && s.h.penz > 0 ? 2 : null)));
    assert.equal(agree.penz, 100);
    const disagree = C.hatedScales(longAns(s => (s.h && s.h.penz > 0 ? -2 : null)));
    assert.equal(disagree.penz, 0);
    for (const v of Object.values(C.hatedScales(longAns((s, i) => [2, -2, 1, -1, 0][i % 5])))) assert.ok(v >= 0 && v <= 100);
    assert.deepEqual(C.hatedTop(agree, 2)[0], 'penz');
    assert.deepEqual(C.hatedTop(none, 2), [], 'semleges esetben nincs "legutáltabb"');
    assert.equal(C.hatedRanking(agree)[0].id, 'penz');
});

test('hosszú pontozás: a hosszú lista pontozza a tengelyeket, hiányzó w nem dob hibát', () => {
    const s = C.summarizeLong(longAns(() => 0));
    for (const a of AX) assert.equal(s.s[a], 0);
    assert.ok(C.find(D.ARCHETYPES, s.a));
    const hi = C.axisScores(longAns(st => ((st.w || {}).e > 0 ? 2 : (st.w || {}).e < 0 ? -2 : null)), D.LONG);
    assert.ok(hi.e >= 90);
});

test('hazugságvizsgáló: lehetetlen állítások, ellentmondó iker-párok, mindenre ugyanaz', () => {
    const honest = C.honesty(longAns(s => (s.lie ? -2 : [1, -1, 0, 2, -2][s.id.length % 5])));
    assert.equal(honest.lies.length, 0);
    const lied = C.honesty(longAns(s => (s.lie ? 2 : 0)));
    assert.equal(lied.lies.length, D.LONG.filter(s => s.lie).length);
    assert.ok(lied.index < honest.index);
    assert.ok(lied.index <= 40, 'ha minden lehetetlent elfogad, nagyon rossz az őszinteség: ' + lied.index);
    const pair = D.TWINS[0];
    const contra = C.honesty({ [pair[0]]: 2, [pair[1]]: 2 });
    assert.equal(contra.twins.length, 1);
    assert.equal(contra.index, 90);
    assert.equal(C.honesty({ [pair[0]]: 2, [pair[1]]: -2 }).twins.length, 0, 'az ellentétes válasz nem hazugság');
    assert.equal(C.honesty({ [pair[0]]: 2, [pair[1]]: null }).twins.length, 0, 'passzolt tétel nem számít');
    const all = C.honesty(longAns(() => 1));
    assert.ok(all.straight, 'mindenre ugyanaz');
    assert.ok(!C.honesty(longAns((s, i) => [2, 1, -1, -2][i % 4])).straight);
    assert.ok(!C.honesty({ a: 1, b: 1 }).straight, 'kevés válasznál nem gyanakszunk');
    assert.equal(C.honesty({}).index, 100);
});

test('őszinteség-sávok: csökkenő, mindegyik index kap sávot', () => {
    const t = D.HONESTY_TIERS;
    for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].min > t[i].min);
    assert.equal(t[t.length - 1].min, 0);
    for (let i = 0; i <= 100; i++) assert.ok(C.honestyTier(i).name);
    assert.equal(C.honestyTier(100).name, t[0].name);
    assert.equal(C.honestyTier(0).name, t[t.length - 1].name);
});

test('hosszú megosztás (v2): körbejár, a hamis tartalom elutasítva', () => {
    const sum = C.summarizeLong(longAns((s, i) => [2, -1, 1, 0, -2][i % 5]));
    const code = C.encode(sum);
    assert.match(code, /^[A-Za-z0-9_-]+$/);
    assert.ok(code.length < 500);
    const back = C.decode(code);
    assert.ok(back.long);
    assert.deepEqual(back.s, sum.s);
    assert.deepEqual(back.hs, sum.hs);
    assert.equal(back.a, sum.a);
    assert.equal(back.honesty.index, sum.honesty.index);
    assert.equal(back.honesty.liesN, sum.honesty.lies.length);
    assert.equal(back.honesty.twinsN, sum.honesty.twins.length);
    const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    const ok = { v: 2, s: [0, 0, 0, 0, 0], a: 'merleg', f: 50, hs: Array(10).fill(50), i: 80, k: [0, 0, 0] };
    assert.ok(C.decode(enc(ok)));
    assert.equal(C.decode(enc({ ...ok, hs: [1, 2] })), null, 'rossz hosszúságú skála');
    assert.equal(C.decode(enc({ ...ok, hs: Array(10).fill('x') })), null);
    assert.equal(C.decode(enc({ ...ok, k: [0, 0] })), null);
    assert.equal(C.decode(enc({ ...ok, i: 'x' })), null);
    assert.equal(C.decode(enc({ ...ok, a: '<b>' })), null);
    const c = C.decode(enc({ ...ok, hs: Array(10).fill(999), i: -50, k: [99, 99, 5] }));
    assert.deepEqual(Object.values(c.hs), Array(10).fill(100));
    assert.equal(c.honesty.index, 0);
    assert.equal(c.honesty.liesN, 6);
    assert.equal(c.honesty.twinsN, 7);
});

test('hosszú teszt felülete: módválasztó, hosszú nézet, hazugságvizsgáló be van kötve', () => {
    const js = pub('ertektest.js'), css = pub('ertektest.css');
    assert.match(js, /startMode\(mode\)/);
    assert.match(js, /modeCard\('deep'[\s\S]*'long'\)/);
    assert.match(js, /C\.summarizeLong/);
    assert.match(js, /renderLongExtras/);
    assert.match(js, /Hazugságvizsgáló/);
    assert.match(js, /C\.honestyTier/);
    for (const c of ['.et-modes', '.et-hfill', '.et-flags']) assert.ok(css.includes(c), c);
});
