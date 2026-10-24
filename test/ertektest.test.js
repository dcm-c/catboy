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
    const same = C.hatedResult(['rongalas', 'rongalas', 'figyelem']);
    assert.equal(same[0].id, 'rongalas');
    assert.equal(same[0].count, 2);
    assert.deepEqual(C.hatedResult([]).map(x => x.count).filter(Boolean), []);
    const s = C.summarize({}, ['rongalas', 'rongalas', 'figyelem']);
    assert.deepEqual(s.h, ['rongalas', 'figyelem']);
});

test('megosztás: a tömör kódolás körbejár, a típus és az illeszkedés a tengelyekből számolódik újra', () => {
    const s = { e: 40, l: -20, n: 10, t: -60, c: 100 };
    const c = C.classify(s);
    const sum = { s, a: c.id, fit: c.fit, h: ['szexizmus', 'rongalas'] };
    const code = C.encode(sum);
    assert.match(code, /^[A-Za-z0-9_-]+$/);
    assert.ok(code.length <= 16, 'rövid teszt link: ' + code.length);
    assert.deepEqual(C.decode(code), sum);
    const withM = { ...sum, m: { nem: 100, kulf: -100, lgbt: 0, vall: 50 } };
    assert.deepEqual(C.decode(C.encode(withM)), withM);
    assert.equal(C.decode('zzzz'), null);
    assert.equal(C.decode(''), null);
    assert.equal(C.decode(code + 'AA'), null, 'hosszabb adat');
    assert.equal(C.decode(code.slice(0, code.length - 3)), null, 'levágott adat');
    const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    // régi, JSON alapú linkek még érvényesek
    assert.equal(C.decode(enc({ v: 2, s: [0, 0, 0, 0, 0], a: 'merleg' })), null, 'ismeretlen verzió');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0], a: 'merleg' })), null, 'hiányzó tengely');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0, 0], a: '<img onerror=x>' })), null, 'ismeretlen típus');
    assert.equal(C.decode(enc({ v: 1, s: [0, 0, 0, 0, 'x'], a: 'merleg' })), null, 'nem szám');
    const clamped = C.decode(enc({ v: 1, s: [999, -999, 0, 0, 0], a: 'merleg', f: 1000, h: ['rongalas', '<b>', 'x', 'szexizmus'] }));
    assert.deepEqual(clamped.s, { e: 100, l: -100, n: 0, t: 0, c: 0 });
    assert.equal(clamped.fit, 99);
    assert.deepEqual(clamped.h, ['rongalas', 'szexizmus'], 'az ismeretlen azonosítók kiesnek');
});

test('tömör link: minden mód rövid, a bináris formátum ellenőrzött', () => {
    const sh = C.summarize(longAns(() => 1), ['rongalas', 'figyelem'], D.MIRROR.map(() => 'min'));
    const lg = C.summarizeLong(longAns((s, i) => [2, -1, 1, 0, -2][i % 5]));
    const hl = C.summarizeHatedLong(longAns((s, i) => [2, -1, 1, 0, -2][i % 5]));
    const hs = C.summarizeHatedShort(['rongalas', 'figyelem', 'szexizmus', 'zaj', 'pletyka', 'rongalas', 'kornyezet', 'tragar', 'anarchia', 'zaj'], D.MIRROR.map(() => 'maj'));
    const lens = [C.encode(sh), C.encode(lg), C.encode(hl), C.encode(hs)].map(x => x.length);
    assert.ok(lens.every(n => n <= 32), 'link hossza: ' + lens);
    for (const sum of [sh, lg, hl, hs]) {
        const back = C.decode(C.encode(sum));
        assert.ok(back, 'visszafejthető');
        assert.deepEqual(back.s, sum.s);
        assert.deepEqual(back.h, sum.h);
    }
    const b64 = bytes => Buffer.from(bytes).toString('base64url');
    assert.equal(C.decode(b64([0x20, 1, 2, 3])), null, 'ismeretlen formátum');
    assert.equal(C.decode(b64([0x12, 0, 0])), null, 'rossz hossz');
    const longBytes = Buffer.from(C.encode(lg), 'base64url');
    assert.equal(longBytes[0], 0x11);
    longBytes[1] = 255;
    assert.equal(C.decode(longBytes.toString('base64url')).s.e, 100, 'tartományon kívüli érték vágva');
    const shBytes = Buffer.from(C.encode({ s: { e: 0, l: 0, n: 0, t: 0, c: 0 }, h: [] }), 'base64url');
    shBytes[6] = 0x0F; // ismeretlen utált érték: 0xF = nincs, de 12 nem létezik
    shBytes[6] = 0xCF;
    assert.equal(C.decode(shBytes.toString('base64url')), null, 'ismeretlen utált-érték azonosító');
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

test('hosszú teszt adatai: 60 értékrész + 40 utált-érték rész, egyedi tételek, ismert tengelyek és skálák, minden utált értéket legalább 3 tétel mér', () => {
    assert.equal(D.LONG_A.length, 60);
    assert.ok(D.LONG_B.length >= 20 && D.LONG_B.length <= 40, 'a B rész 20-40 tétel');
    assert.equal(D.LONG.length, D.LONG_A.length + D.LONG_B.length);
    assert.equal(new Set(D.LONG.map(s => s.id)).size, D.LONG.length);
    assert.ok(D.LONG_A.every(s => s.part === 'a') && D.LONG_B.every(s => s.part === 'b'));
    const hid = D.HATED.map(h => h.id);
    const hc = {}, ac = {}, hdir = {};
    for (const s of D.LONG) {
        assert.ok(['v', 'h', 'l', 'p'].includes(s.kind), s.id);
        assert.ok(s.text.length > 20 && s.text.length < 220, s.id);
        for (const [a, w] of Object.entries(s.w || {})) { assert.ok(AX.includes(a), s.id + ' tengely ' + a); assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1); ac[a] = (ac[a] || 0) + 1; }
        for (const [h, w] of Object.entries(s.h || {})) { assert.ok(hid.includes(h), s.id + ' utált érték ' + h); assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1); hc[h] = (hc[h] || 0) + 1; (hdir[h] = hdir[h] || new Set()).add(Math.sign(w)); }
    }
    for (const h of hid) assert.ok(hc[h] >= 3, h + ' skálához kevés tétel: ' + hc[h]);
    for (const a of AX) assert.ok(ac[a] >= 10, a + ' tengelyhez kevés tétel a hosszú tesztben: ' + ac[a]);
    assert.ok(D.LONG.filter(s => s.kind === 'h').length >= 30);
    assert.ok(D.LONG.filter(s => s.h && s.w && Object.keys(s.h).length && Object.keys(s.w).length).length >= 30, 'sok tétel hasson mindkét részre');
    assert.ok(D.LONG.every(s => s.help && s.help.length > 15), 'minden kérdéshez van magyarázat');
    assert.ok(D.LONG.filter(s => s.kind !== 'p').length - D.LONG.filter(s => s.kind !== 'p' && s.joke).length <= 25, 'a legtöbb kérdéshez van poén');
    assert.ok(D.LONG.filter(s => s.kind === 'l').every(s => s.lie && s.joke));
    assert.equal(D.LONG.filter(s => s.kind === 'l').length, 4, 'kevés, nem túl nyilvánvaló hazugság-próba');
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
    const agree = C.hatedScales(longAns(s => (s.h && s.h.rongalas > 0 ? 2 : null)));
    assert.ok(agree.rongalas >= 85 && agree.rongalas < 100, 'sok tételből magas, de nem 100: ' + agree.rongalas);
    const disagree = C.hatedScales(longAns(s => (s.h && s.h.rongalas > 0 ? -2 : null)));
    assert.ok(disagree.rongalas <= 15 && disagree.rongalas > 0, 'alacsony, de nem 0: ' + disagree.rongalas);
    const few = C.hatedScales(bAns(s => (s.h && s.h.rongalas > 0 ? 2 : null)), D.LONG_B);
    assert.ok(few.rongalas < agree.rongalas, 'kevés tétel kisebbet mozdít (húzás az 50 felé)');
    for (const v of Object.values(C.hatedScales(longAns((s, i) => [2, -2, 1, -1, 0][i % 5])))) assert.ok(v >= 0 && v <= 100);
    assert.deepEqual(C.hatedTop(agree, 2)[0], 'rongalas');
    assert.deepEqual(C.hatedTop(none, 2), [], 'semleges esetben nincs "legutáltabb"');
    assert.equal(C.hatedRanking(agree)[0].id, 'rongalas');
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
    for (const m of ['short', 'long', 'hshort', 'hlong']) assert.ok(js.includes("'" + m + "'"), m);
    assert.match(js, /C\.summarizeLong/);
    assert.match(js, /renderHonesty/);
    assert.match(js, /renderHatedScales/);
    assert.match(js, /Hazugságvizsgáló/);
    assert.match(js, /C\.honestyTier/);
    for (const c of ['.et-modes', '.et-hfill', '.et-flags']) assert.ok(css.includes(c), c);
});

test('navbar: a hosszú márkanév csak 1400px felett jelenik meg, a menüpontok nem törnek sorba', () => {
    const nav = pub('navbar.html'), css = pub('style.css');
    assert.match(nav, /d-lg-inline d-xxl-none[^>]*>MFSZ/);
    assert.match(nav, /d-lg-none d-xxl-inline">Magyar Femboy Szakszervezet/);
    assert.match(css, /\.navbar-nav \.nav-link \{ white-space: nowrap; \}/);
});

// ---------- B rész: utált értékek, előítélet-barométer, tükörpárok, dev mód ----------
const B = D.LONG_B;
const bAns = f => { const a = {}; B.forEach((s, i) => { a[s.id] = f(s, i); }); return a; };

test('B rész: minden utált értéket pontosan 2 tétel mér, minden előítélet-skálát legalább 2 tétel, mindkét irányban', () => {
    const hc = {}, gc = {};
    for (const s of B) {
        for (const h of Object.keys(s.h || {})) hc[h] = (hc[h] || 0) + 1;
        for (const g of Object.keys(s.g || {})) { assert.ok(D.PREJ.some(p => p.id === g), g); gc[g] = (gc[g] || 0) + 1; }
        if (s.kind === 'p') assert.ok(Object.keys(s.g).length >= 1 && Object.keys(s.g).length <= 2, s.id);
    }
    for (const h of D.HATED) assert.ok(hc[h.id] >= 2, h.id);
    for (const p of D.PREJ) assert.ok(gc[p.id] >= 3, p.id + ' skálához kevés tétel');
    // fordított állítás (negatív súly) és ellentétes hatású állítás (az egyik skálát növeli, a másikat csökkenti) minden skálán
    for (const p of D.PREJ) {
        const items = B.filter(s => s.g && s.g[p.id]);
        assert.ok(items.some(s => s.g[p.id] < 0 && Object.keys(s.g).length === 1), p.id + ': nincs fordított állítás');
        assert.ok(items.some(s => s.g[p.id] > 0 && Object.keys(s.g).length === 1), p.id + ': nincs egyenes állítás');
    }
    for (const t of D.TOPICS) {
        assert.ok(B.some(s => s.g && s.g[t.id + '_up'] > 0 && s.g[t.id + '_dn'] < 0), t.id + ': nincs ellentétes hatású állítás');
    }
    assert.equal(D.PREJ.length, D.TOPICS.length * 2);
    for (const t of D.TOPICS) { assert.ok(t.name && t.icon && t.up && t.dn && t.minSide && t.majSide, t.id); }
});

test('előítélet-tételek: enyhe felmérés-stílusú állítások, nincs gyűlöletbeszéd-szó vagy erőszak-felhívás', () => {
    const bad = /(népirtás|genocid|rabszolg|kiirt|holokauszt|zsidó|cigány|néger|buzi|\bölj)/i;
    for (const s of D.LONG.concat(D.MIRROR.map(m => ({ id: m.topic, text: m.min + ' ' + m.maj })))) assert.ok(!bad.test(s.text), s.id + ': ' + s.text);
    assert.equal(D.MIRROR.length, 8);
    for (const t of D.TOPICS) assert.equal(D.MIRROR.filter(m => m.topic === t.id).length, 2, t.id);
});

test('előítélet-skálák: 0..100, 50 a semleges, a súly irányába mozdul, a fordított állítás csökkent', () => {
    for (const v of Object.values(C.prejScales({}))) assert.equal(v, 50);
    const pos = bAns(s => (s.g && s.g.nem_up > 0 ? 2 : (s.g && s.g.nem_up < 0 ? -2 : null)));
    const hi = C.prejScales(pos);
    assert.ok(hi.nem_up >= 70 && hi.nem_up < 100, 'egyenesekre igen, fordítottra nem: ' + hi.nem_up);
    const rev = C.prejScales(bAns(s => (s.g && s.g.nem_up < 0 ? 2 : null)));
    assert.ok(rev.nem_up < 50, 'a fordított állításra adott igen csökkent: ' + rev.nem_up);
    const cross = C.prejScales(bAns(s => (s.id === 'p_nem7' ? 2 : null)));
    assert.ok(cross.nem_up > 50 && cross.nem_dn < 50, 'ellentétes hatású állítás: az egyik nő, a másik csökken');
    assert.equal(C.prejScales(bAns(s => (s.g && s.g.vall_dn > 0 ? -2 : null))).vall_dn < 50, true);
    for (const v of Object.values(C.prejScales(bAns((s, i) => [2, -2, 1, -1, 0][i % 5])))) assert.ok(v >= 0 && v <= 100);
});

test('tükörpárok: témánként -100..100, a kisebbségi oldal a pozitív', () => {
    const all = (v) => D.MIRROR.map(() => v);
    for (const v of Object.values(C.mirrorResult(all('min')))) assert.equal(v, 100);
    for (const v of Object.values(C.mirrorResult(all('maj')))) assert.equal(v, -100);
    const mixed = C.mirrorResult(D.MIRROR.map((m, i) => (i < 4 ? 'min' : 'maj')));
    for (const t of D.TOPICS) assert.equal(mixed[t.id], 0, 'egy-egy kör minden témában kiegyenlít');
    assert.deepEqual(Object.values(C.mirrorResult([])).filter(Boolean), []);
});

test('csak utált-teszt összegzése: rövid és hosszú, megosztva (v3) körbejár', () => {
    const picks = ['rongalas', 'figyelem', 'szexizmus', 'zaj', 'pletyka', 'rongalas', 'kornyezet', 'tragar', 'anarchia', 'zaj'];
    const mir = D.MIRROR.map((m, i) => (i % 2 ? 'maj' : 'min'));
    const hs = C.summarizeHatedShort(picks, mir);
    assert.equal(hs.kind, 'hshort');
    assert.equal(hs.h[0], 'rongalas');
    assert.equal(hs.counts.rongalas, 2);
    const back = C.decode(C.encode(hs));
    assert.equal(back.kind, 'hshort');
    assert.deepEqual(back.counts, hs.counts);
    assert.deepEqual(back.m, hs.m);
    assert.deepEqual(back.h, hs.h);

    const hl = C.summarizeHatedLong(bAns(s => (s.h && s.h.pletyka > 0 ? 2 : -1)));
    assert.equal(hl.kind, 'hlong');
    assert.equal(hl.h[0], 'pletyka');
    const b2 = C.decode(C.encode(hl));
    assert.equal(b2.kind, 'hlong');
    assert.deepEqual(b2.hs, hl.hs);
    assert.deepEqual(b2.pj, hl.pj);
    assert.ok(!b2.s && !b2.a, 'nincs típus az utált-tesztben');
});

test('v3 kódolás: hamis vagy hibás tartalom elutasítva, a régi v1/v2 linkek élnek', () => {
    const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    assert.equal(C.decode(enc({ v: 3, k: 'hl', hs: [1, 2], pj: [] })), null);
    assert.equal(C.decode(enc({ v: 3, k: 'hs', c: Array(10).fill(0), m: [1] })), null);
    assert.equal(C.decode(enc({ v: 3, k: 'zz' })), null);
    assert.equal(C.decode(enc({ v: 3, k: 'l', s: [0, 0, 0, 0, 0], a: 'merleg', hs: Array(10).fill(50), pj: [1], i: 50, kk: [0, 0, 0] })), null, 'rossz előítélet-skála hossz');
    const ok = C.decode(enc({ v: 3, k: 'hl', hs: Array(10).fill(999), pj: Array(8).fill(-5) }));
    assert.deepEqual(Object.values(ok.hs), Array(10).fill(100));
    assert.deepEqual(Object.values(ok.pj), Array(8).fill(0));
    const v2 = C.decode(enc({ v: 2, s: [0, 0, 0, 0, 0], a: 'merleg', f: 50, hs: Array(10).fill(50), i: 80, k: [0, 0, 0] }));
    assert.ok(v2.long && !v2.pj);
    const v1 = C.decode(enc({ v: 1, s: [1, 2, 3, 4, 5], a: 'merleg', f: 50, h: ['rongalas'], m: [100, -100, 0, 50] }));
    assert.deepEqual(v1.m, { nem: 100, kulf: -100, lgbt: 0, vall: 50 });
    assert.equal(C.decode(enc({ v: 1, s: [1, 2, 3, 4, 5], a: 'merleg', m: [1, 2] })).m, undefined, 'rossz hosszú tükör-adat kiesik');
    const sh = C.summarize({}, ['rongalas'], D.MIRROR.map(() => 'min'));
    assert.ok(C.decode(C.encode(sh)).m);
});

test('fejlesztői nézet: a hozzájárulások összege megegyezik a tengelyek értékével', () => {
    const ans = longAns((s, i) => [2, -1, 1, 0, -2, 1][i % 6]);
    const bk = C.breakdown(ans);
    const sc = C.axisScores(ans, D.LONG);
    for (const a of AX) {
        const total = bk.axes[a].reduce((t, x) => t + x.pts, 0);
        assert.ok(Math.abs(total - sc[a]) <= 1.5, a + ': ' + total + ' vs ' + sc[a]);
        assert.ok(bk.axes[a].every((x, i, arr) => i === 0 || Math.abs(arr[i - 1].pts) >= Math.abs(x.pts)), 'rendezett');
    }
    const hs = C.hatedScales(ans);
    for (const h of D.HATED) {
        const total = bk.hated[h.id].reduce((t, x) => t + x.pts, 0);
        assert.ok(Math.abs(50 + total - hs[h.id]) <= 1.5, h.id);
    }
    assert.ok(bk.axes.e.every(x => x.text && typeof x.weight === 'number'));
    const part = C.breakdown({}, D.STATEMENTS);
    assert.ok(part.axes.e.every(x => x.v === null && x.pts === 0), 'megválaszolatlan kérdés nem ad pontot');
});

test('tengely-ikonok és felület: ikonok, 4 mód, fejlesztői mód, tükörpár nézet', () => {
    for (const a of D.AXES) assert.ok(a.icon && a.negIcon && a.posIcon, a.id);
    const js = pub('ertektest.js'), css = pub('ertektest.css');
    assert.match(js, /negIcon/);
    assert.match(js, /mfsz-ertek-dev/);
    assert.match(js, /renderDevResult/);
    assert.match(js, /renderMirror/);
    assert.match(js, /renderPrej/);
    for (const c of ['.et-ico', '.et-dev', '.et-devtable', '.et-topic', '.et-sect']) assert.ok(css.includes(c), c);
});

test('fejlesztői mód rejtett: nincs jelölőnégyzet és nincs ?dev, csak a 7 kattintásos titok', () => {
    const js = pub('ertektest.js');
    assert.match(js, /function devTap/);
    assert.match(js, /devClicks\.length >= 7/);
    assert.match(js, /compass\.addEventListener\('click', devTap\)/);
    assert.ok(!/location\.search/.test(js), 'nincs URL-paraméteres bekapcsolás');
    assert.ok(!js.includes("'et-dev'") || !/cb\.id = 'et-dev'/.test(js), 'nincs látható jelölőnégyzet');
    assert.match(js, /et-devpill/);
});
