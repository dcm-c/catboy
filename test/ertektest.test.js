// Értékteszt (v3): adatok épsége, pontozás, besorolás, megbízhatóság, megosztható kódolás, képek, régi linkek
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../public/ertektest-data.js');
const C = require('../public/ertektest-core.js');
const IMG = require('../public/ertektest-img.js');
const pub = f => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const AX = D.AXES.map(a => a.id);
const MODES = ['short', 'long', 'xlong'];
const ansOf = (list, f) => { const a = {}; list.forEach((s, i) => { a[s.id] = f(s, i); }); return a; };
const cyc = [2, -1, 1, 0, -2];
// rögzített magú véletlen
function rng(seed) { let x = seed >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }

// ---------- Adatok ----------
test('adatok: legalább 10 tengely, mindegyiknek két pólusa, ikonja és csoportja', () => {
    assert.ok(D.AXES.length >= 10);
    assert.equal(new Set(AX).size, AX.length);
    for (const a of D.AXES) {
        for (const k of ['id', 'name', 'neg', 'pos', 'icon', 'group']) assert.ok(a[k], a.id + '.' + k);
    }
    assert.ok(new Set(D.AXES.map(a => a.group)).size >= 3, 'csoportosított megjelenítés');
});

test('adatok: egyedi azonosítók az összes tételre, ismert tengelyek, minden tételhez súgó (a hazugságpróbák kivételével)', () => {
    const ids = new Set();
    for (const s of D.ALL) {
        assert.ok(!ids.has(s.id), 'ismétlődő id: ' + s.id);
        ids.add(s.id);
        assert.ok(s.text.length > 15 && s.text.length < 260, s.id);
        assert.ok(s.tier >= 1 && s.tier <= 3, s.id + ' tier');
        if (!s.lie) assert.ok(s.help && s.help.length > 15, s.id + ' súgó');
        for (const [a, w] of Object.entries(s.w || {})) {
            assert.ok(AX.includes(a), s.id + ': ismeretlen tengely ' + a);
            assert.ok(Math.abs(w) > 0 && Math.abs(w) <= 1);
        }
    }
    assert.ok(D.VALUE.length >= 100, 'legalább 100 értékállítás');
});

test('adatok: tengelyenként 5/10/15 elsődleges tétel, mindkét irányból (nem lehet kitalálni a "jó" választ)', () => {
    const want = { 1: 5, 2: 10, 3: 15 };
    for (const a of AX) {
        const mine = D.VALUE.filter(s => Object.keys(s.w)[0] === a); // elsődleges tengely: az első súly
        for (const m of MODES) {
            const maxTier = { short: 1, long: 2, xlong: 3 }[m];
            const sel = mine.filter(s => s.tier <= maxTier);
            assert.ok(sel.length >= want[maxTier], a + ' ' + m + ': ' + sel.length);
            assert.equal(new Set(sel.map(s => Math.sign(s.w[a]))).size, 2, a + ' ' + m + ': mindkét irány kell');
        }
    }
});

test('módok: a listák mérete, a rövid ⊂ hosszú ⊂ extra, az ikerpárok és hazugságpróbák száma nő', () => {
    const n = m => D.A_LISTS[m].length;
    const nv = m => D.A_LISTS[m].filter(s => s.kind === 'v').length;
    assert.deepEqual(MODES.map(nv), [50, 100, 150], 'értékállítások');
    assert.ok(n('short') >= 50 && n('short') <= 58, 'gyors: ' + n('short'));
    assert.ok(n('long') >= 100 && n('long') <= 115, 'részletes: ' + n('long'));
    assert.ok(n('xlong') >= 150 && n('xlong') <= 170, 'extra: ' + n('xlong'));
    const shortIds = new Set(D.A_LISTS.short.map(s => s.id)), longIds = new Set(D.A_LISTS.long.map(s => s.id));
    for (const id of shortIds) assert.ok(longIds.has(id), 'a rövid tétele hiányzik a hosszúból: ' + id);
    for (const id of longIds) assert.ok(D.A_LISTS.xlong.some(s => s.id === id), id);
    const lies = m => D.A_LISTS[m].filter(s => s.kind === 'l').length;
    assert.deepEqual([lies('short'), lies('long'), lies('xlong')], [2, 5, 7]);
    assert.ok(lies('xlong') <= 7, 'a megosztott linkben 3 bit jut rájuk');
    const ranks = m => D.A_LISTS[m].filter(s => s.kind === 'r').length;
    assert.deepEqual([ranks('short'), ranks('long'), ranks('xlong')], [1, 3, 5]);
    assert.deepEqual(MODES.map(m => D.twinsIn(D.A_LISTS[m]).length), [4, 8, 12]);
    assert.ok(D.B_LISTS.long.length >= 54 && D.B_LISTS.xlong.length >= 72);
    assert.equal(D.B_LISTS.hlong, D.B_LISTS.long);
    assert.deepEqual(D.B_LISTS.short, [], 'a gyors mód B része a kör- és tükörpár-kérdés');
});

test('iker-párok: létező, ellentétes irányú tételek, a listában távol vannak egymástól', () => {
    const byId = Object.fromEntries(D.VALUE.map(s => [s.id, s]));
    assert.equal(D.TWINS.length, 12);
    for (const [x, y] of D.TWINS) {
        assert.ok(byId[x] && byId[y], x + '/' + y);
        const common = Object.keys(byId[x].w).filter(a => byId[y].w[a]);
        assert.ok(common.length, 'közös tengely kell');
        assert.ok(common.some(a => Math.sign(byId[x].w[a]) !== Math.sign(byId[y].w[a])), x + '/' + y + ' ellentétes');
    }
    for (const m of MODES) {
        const pos = {};
        D.A_LISTS[m].forEach((s, i) => { pos[s.id] = i; });
        for (const [x, y] of D.twinsIn(D.A_LISTS[m])) assert.ok(Math.abs(pos[x] - pos[y]) >= 8, m + ': ' + x + '/' + y + ' túl közel');
    }
});

test('típusok: 20 típus, minden tengelyen érték, egyedi azonosító; utált értékek és előítélet-témák rendben', () => {
    assert.equal(D.ARCHETYPES.length, 20);
    assert.equal(new Set(D.ARCHETYPES.map(a => a.id)).size, 20);
    for (const t of D.ARCHETYPES) {
        assert.ok(t.title && t.emoji && t.desc && t.sunday, t.id);
        for (const a of AX) assert.ok(typeof t.v[a] === 'number' && Math.abs(t.v[a]) <= 1, t.id + ' ' + a);
    }
    assert.equal(D.HATED.length, 18);
    assert.equal(new Set(D.HATED.map(h => h.id)).size, 18);
    for (const h of D.HATED) assert.ok(h.name && h.blurb && h.roast, h.id);
    for (const id of ['keses', 'sorban', 'okos', 'igeret', 'kutya', 'rendetlen', 'spoiler', 'henceg']) assert.ok(C.find(D.HATED, id), id + ' (v4 új utált érték)');
    assert.equal(D.TOPICS.length, 4);
    assert.equal(D.PREJ.length, 8);
    const cnt = {};
    D.HATED_PAIRS.forEach(p => p.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }));
    // a gyors mód körei a klasszikus tíz értékre szólnak (a link 4 bites indexe miatt is), mindegyik pontosan kétszer
    for (const h of D.HATED.slice(0, 10)) assert.equal(cnt[h.id], 2, h.id + ' pontosan kétszer szerepel a párokban');
    assert.deepEqual(Object.keys(cnt).sort(), D.HATED.slice(0, 10).map(h => h.id).sort());
});

test('B rész: minden utált értéket és előítélet-skálát elég tétel mér, a tételek tükrösek és helyzetfüggők is', () => {
    const per = {}, roles = new Set();
    for (const s of D.HATED_ITEMS) { for (const h of Object.keys(s.h)) per[h] = (per[h] || 0) + 1; roles.add(s.role); }
    for (const h of D.HATED) assert.ok(per[h.id] >= 3, h.id + ' kevés tétel: ' + per[h.id]);
    assert.ok(roles.has('R') && roles.has('S') && roles.has('X'), 'fordított, helyzetfüggő és összehasonlító is kell: ' + [...roles]);
    const pj = {};
    const pr = new Set();
    for (const s of D.PREJ_ITEMS) { for (const [g, w] of Object.entries(s.g)) { (pj[g] = pj[g] || new Set()).add(Math.sign(w)); } pr.add(s.role); }
    for (const p of D.PREJ) assert.ok(pj[p.id], p.id);
    assert.ok([...pr].some(r => /R$/.test(r)), 'fordított előítélet-tételek');
    assert.ok(D.HATED_ITEMS.length >= 40 && D.PREJ_ITEMS.length >= 32);
    const bad = /(gyilkol|vérengz|öld meg|pusztul|irtani|irtsd|ki kell irtani)/i;
    for (const s of D.PREJ_ITEMS) assert.ok(!bad.test(s.text), s.id);
});

// ---------- Pontozás, besorolás ----------
test('pontozás: szélsőséges válaszok a tengely végére viszik, a passz nem számít, a semleges nullára húz', () => {
    const list = D.A_LISTS.xlong;
    const max = ansOf(list, s => (s.w && Object.values(s.w)[0] > 0) ? 2 : -2);
    const sc = C.axisScores(max, list);
    assert.ok(Object.values(sc).some(v => v >= 60));
    const mid = C.axisScores(ansOf(list, () => 0), list);
    for (const a of AX) assert.equal(mid[a], 0);
    const none = C.axisScores({}, list);
    for (const a of AX) assert.equal(none[a], 0);
    for (const a of AX) assert.ok(Math.abs(sc[a]) <= 100 && Number.isInteger(sc[a]));
    const half = {};
    list.slice(0, 40).forEach(s => { half[s.id] = 2; });
    assert.doesNotThrow(() => C.axisScores(half, list));
});

test('besorolás: minden típus a saját középpontjához tér vissza, és az illeszkedés sávban marad', () => {
    for (const t of D.ARCHETYPES) {
        const sc = {}; AX.forEach(a => { sc[a] = Math.round(t.v[a] * 100); });
        const c = C.classify(sc);
        assert.equal(c.id, t.id, t.id);
        assert.ok(c.fit >= 5 && c.fit <= 99);
        assert.ok(c.second && c.second !== c.id);
    }
});

test('besorolás: valós eloszlás: egyik típus sem nyeli el a mezőnyt (rögzített magú véletlen, mindhárom mód)', () => {
    for (const m of MODES) {
        const R = rng(7 + m.length), list = D.A_LISTS[m], cnt = {};
        for (let i = 0; i < 500; i++) {
            // összefüggő, nem teljesen véletlen kitöltő: néhány tengely felé hajlik
            const bias = {}; AX.forEach(a => { bias[a] = R() * 2 - 1; });
            const ans = ansOf(list, s => {
                const w = Object.entries(s.w || {})[0];
                const tgt = w ? bias[w[0]] * Math.sign(w[1]) * 2 : 0;
                return Math.max(-2, Math.min(2, Math.round(tgt + (R() - .5) * 2)));
            });
            const r = C.summarizeValues(m, ans);
            cnt[r.a] = (cnt[r.a] || 0) + 1;
        }
        const top = Math.max(...Object.values(cnt));
        assert.ok(top / 500 < 0.22, m + ': egy típus a mezőny ' + Math.round(top / 5) + '%-a');
        assert.ok(Object.keys(cnt).length >= 14, m + ': csak ' + Object.keys(cnt).length + ' típus fordul elő');
    }
});

// ---------- Megbízhatóság ----------
test('megbízhatóság: következetes kitöltés megbízható, ellentmondásos és mindenre-igen kitöltés nem', () => {
    const list = D.A_LISTS.long;
    // következetes: a saját "profil" szerint válaszol, a hazugságpróbákra nemet mond
    const prof = {}; AX.forEach((a, i) => { prof[a] = [0.8, -0.7, 0.5, -0.9, 0.3, 0.9, -0.4, 0.6, -0.8, 0.2][i]; });
    const good = ansOf(list, s => {
        if (s.lie) return s.expect === 'yes' ? 2 : -2;
        if (s.kind === 'r') return 0;
        const w = Object.entries(s.w || {})[0];
        if (!w) return 0;
        const v = prof[w[0]] * Math.sign(w[1]);
        return v > .6 ? 2 : v > .15 ? 1 : v < -.6 ? -2 : v < -.15 ? -1 : 0;
    });
    const rg = C.summarizeValues('long', good);
    assert.ok(rg.rel.index >= 80, 'következetes: ' + rg.rel.index + ' ' + rg.rel.flags);
    assert.equal(C.relTier(rg.rel.index).name, 'Megbízható');
    assert.ok(Object.values(rg.rel.axes).every(l => l >= 1));

    const yes = C.summarizeValues('long', ansOf(list, () => 2));
    assert.ok(yes.rel.index < 40, 'mindenre igen: ' + yes.rel.index);
    assert.ok(yes.rel.flags.includes('straight') && yes.rel.flags.includes('lies'));
    assert.equal(C.relTier(yes.rel.index).name, 'Nem megbízható');

    const R = rng(99);
    const rnd = C.summarizeValues('long', ansOf(list, () => Math.floor(R() * 5) - 2));
    assert.ok(rnd.rel.index < rg.rel.index - 15, 'véletlen válaszok: ' + rnd.rel.index);

    const neutral = C.summarizeValues('long', ansOf(list, () => 0));
    assert.ok(neutral.rel.flags.includes('neutral'));
    assert.ok(neutral.rel.index < 60);
});

test('megbízhatóság: sok kihagyott válasz jelzett, rövid tesztnél figyelmeztet a kevés tételre', () => {
    const list = D.A_LISTS.xlong;
    const skip = C.summarizeValues('xlong', ansOf(list, (s, i) => i % 5 === 0 ? cyc[i % 5] : null));
    assert.ok(skip.rel.flags.includes('skips'), skip.rel.flags.join());
    const sh = C.summarizeValues('short', ansOf(D.A_LISTS.short, (s, i) => cyc[(i * 3) % 5]));
    assert.ok(sh.rel.flags.includes('few') || sh.rel.index < 100);
    const lv = [C.axisLevel(0), C.axisLevel(1), C.axisLevel(5)];
    assert.ok(lv.every(x => [0, 1, 2].includes(x)));
    assert.equal(D.AXIS_LEVELS.length, 3);
    assert.deepEqual(D.REL_TIERS.map(t => t.name).length, 4);
});

test('ellenőrző kérdések: van olyan, ahol az „igen”, és olyan, ahol a „nem” a jó válasz, minden módban', () => {
    for (const m of MODES) {
        const probes = D.A_LISTS[m].filter(s => s.kind === 'l');
        assert.ok(probes.some(s => s.expect === 'no') && probes.some(s => s.expect === 'yes'), m);
        for (const p of probes) { assert.ok(['yes', 'no'].includes(p.expect), p.id); assert.ok(p.help && p.joke, p.id); }
    }
    assert.ok(D.LIES.filter(s => s.expect === 'yes').length >= 3);
});

test('hazugságvizsgáló: lehetetlen állítások (igen gyanús), hétköznapi tények (nem gyanús), ellentmondó iker-párok, mindenre ugyanaz', () => {
    const list = D.A_LISTS.xlong;
    const nNo = list.filter(s => s.expect === 'no').length, nYes = list.filter(s => s.expect === 'yes').length;
    const yes = C.honesty(ansOf(list, () => 2), list);
    assert.ok(yes.straight && yes.twins.length === 12 && yes.index < 20);
    assert.equal(yes.lies.length, nNo, 'mindenre igen: csak a lehetetlen állítások gyanúsak');
    assert.ok(yes.lies.every(l => l.expect === 'no'));
    const no = C.honesty(ansOf(list, () => -2), list);
    assert.equal(no.lies.length, nYes, 'mindenre nem: csak a hétköznapi tények tagadása gyanús');
    assert.ok(no.lies.every(l => l.expect === 'yes') && no.straight);
    assert.ok(no.index < 70 && yes.index < no.index + 30);
    // a helyes válaszok: lehetetlenre nem, hétköznapira igen
    const R = rng(5);
    const prof = ansOf(list, s => s.lie ? (s.expect === 'yes' ? 2 : -2) : [1, 2, -1, -2, 0][Math.floor(R() * 5)]);
    const h1 = C.honesty(prof, list);
    assert.equal(h1.lies.length, 0);
    // enyhe tagadás is gyanús, de kisebb pontlevonással
    const soft = C.honesty(ansOf(list, s => s.lie ? (s.expect === 'yes' ? -1 : 1) : 0), list);
    assert.equal(soft.lies.length, list.filter(s => s.lie).length);
    const hardOne = C.honesty({ l_kulcs: -2 }, D.A_LISTS.short), softOne = C.honesty({ l_kulcs: -1 }, D.A_LISTS.short);
    assert.ok(hardOne.index < softOne.index);
    assert.equal(C.honesty({ l_kulcs: 0, l_hazug: 0 }, D.A_LISTS.short).lies.length, 0, 'a közepes válasz nem gyanús');
    for (let i = 0; i <= 100; i++) assert.ok(C.honestyTier(i).name, String(i));
    assert.ok(D.HONESTY_TIERS.length >= 3);
});

// ---------- Fontos-jelölés (csillag) és rangsorolás ----------
test('fontos-jelölés: módonként 1/2/3 kérdés, a jelölt állítás kétszeres súllyal számít, csak értékállításra és csak limitig', () => {
    assert.deepEqual(D.STARS, { short: 1, long: 2, xlong: 3 });
    assert.equal(D.STAR_MULT, 2);
    const items = D.VALUE.filter(s => s.w.e).slice(0, 3);
    const a = { [items[0].id]: 2 * Math.sign(items[0].w.e), [items[1].id]: -2 * Math.sign(items[1].w.e) };
    const plain = C.axisScores(a, items).e;
    const star0 = C.axisScores(a, items, undefined, { [items[0].id]: true }).e;
    const star1 = C.axisScores(a, items, undefined, { [items[1].id]: true }).e;
    assert.equal(plain, 0, 'két ellentétes válasz kioltja egymást');
    assert.ok(star0 > 0 && star1 < 0, 'a jelölt kérdés dönt: ' + star0 + ' / ' + star1);
    assert.ok(Math.abs(star0) > 20 && Math.abs(star0) < 50, 'kétszeres, nem korlátlan súly: ' + star0);
    // semleges válasz + jelölés nem mozdít
    assert.equal(C.axisScores({ [items[0].id]: 0 }, items, undefined, { [items[0].id]: true }).e, 0);
    // az eredményben a limitig és csak értékállításokat tartunk meg
    const L = D.A_LISTS.long, ans = ansOf(L, (s, i) => cyc[i % 5]);
    const many = {}; L.forEach(s => { many[s.id] = true; });
    const r = C.summarizeValues('long', ans, { stars: many });
    assert.equal(r.starred.length, 2);
    assert.ok(r.starred.every(id => D.VALUE.some(v => v.id === id)));
    assert.equal(C.summarizeValues('short', ansOf(D.A_LISTS.short, (s, i) => cyc[i % 5]), { stars: many }).starred.length, 1);
    assert.equal(C.summarizeValues('xlong', ansOf(D.A_LISTS.xlong, (s, i) => cyc[i % 5]), { stars: many }).starred.length, 3);
    assert.equal(C.summarizeValues('long', ans).starred, undefined);
    // a jelölés nem kerül a linkbe, a link ugyanúgy körbejár
    const d = C.decode(C.encode(r));
    assert.deepEqual(d.s, r.s);
    assert.equal(d.starred, undefined);
    // fejlesztői bontás: a jelölt tétel súlya duplázódik
    const bd = C.breakdown(a, items, { [items[0].id]: true });
    const row = bd.axes.e.find(x => x.id === items[0].id);
    assert.ok(row.star && Math.abs(row.weight) === Math.abs(items[0].w.e) * 2);
});

test('rangsorolás: 5 feladat, minden lehetőség más tengelyt mozgat, a helyezésből +2…−2 válasz lesz', () => {
    assert.equal(D.RANK_ITEMS.length, 5);
    assert.deepEqual(D.RANK_VALUES, [2, 1, 0, -1, -2]);
    const ids = new Set(D.ALL.map(x => x.id));
    for (const t of D.RANK_ITEMS) {
        assert.equal(t.opts.length, 5, t.id);
        assert.ok(t.text.length > 20 && t.help, t.id);
        const axes = new Set();
        for (const o of t.opts) {
            assert.ok(!ids.has(o.id), 'ütköző azonosító: ' + o.id); ids.add(o.id);
            const ks = Object.keys(o.w);
            assert.equal(ks.length, 1, o.id);
            assert.ok(AX.includes(ks[0]));
            axes.add(ks[0]);
        }
        assert.equal(axes.size, 5, t.id + ': mind az 5 lehetőség más tengely');
    }
    const t = D.RANK_ITEMS[0], ans = {};
    t.opts.forEach((o, i) => { ans[o.id] = D.RANK_VALUES[i]; });
    const sc = C.axisScores(ans, [t]);
    const [first, last] = [Object.keys(t.opts[0].w)[0], Object.keys(t.opts[4].w)[0]];
    assert.equal(sc[first], 100 * Math.sign(t.opts[0].w[first]));
    assert.equal(sc[last], -100 * Math.sign(t.opts[4].w[last]));
    assert.equal(sc[Object.keys(t.opts[2].w)[0]], 0, 'a középső helyezés nem mozdít');
    // a feladat önmagában nem számít a semleges/kihagyott statisztikába
    const L = D.A_LISTS.long;
    const base = ansOf(L.filter(s => s.kind !== 'r'), (s, i) => cyc[i % 5]);
    const r0 = C.summarizeValues('long', base);
    const r1 = C.summarizeValues('long', Object.assign({}, base, ...D.RANK_ITEMS.filter(x => L.includes(x)).map(x => Object.fromEntries(x.opts.map((o, i) => [o.id, D.RANK_VALUES[i]])))));
    assert.ok(!r0.rel.flags.includes('skips'), 'a kihagyott rangsor nem számít kihagyott kérdésnek');
    assert.notDeepEqual(r0.s, r1.s, 'a rangsor mozgatja a tengelyeket');
    assert.ok(Math.abs(r1.rel.index - r0.rel.index) <= 12);
});

// ---------- B rész pontozása ----------
test('utált-érték és előítélet-skálák: 0..100, az egyetértés a súly irányába mozdít, a fordított tétel csökkent', () => {
    const B = D.B_LISTS.xlong;
    const all = C.hatedScales(ansOf(B, () => 2), B), none = C.hatedScales(ansOf(B, () => -2), B), mid = C.hatedScales({}, B);
    for (const h of D.HATED) {
        assert.ok(all[h.id] >= 0 && all[h.id] <= 100 && none[h.id] >= 0 && none[h.id] <= 100);
        assert.equal(mid[h.id], 50);
    }
    assert.ok(D.HATED.some(h => all[h.id] > 55) && D.HATED.some(h => none[h.id] < 45));
    const pj = C.prejScales(ansOf(B, s => s.kind === 'p' ? 2 : 0), B);
    for (const p of D.PREJ) { assert.ok(pj[p.id] >= 0 && pj[p.id] <= 100); }
    const rev = D.PREJ_ITEMS.find(s => /R$/.test(s.role)), gid = Object.keys(rev.g)[0];
    const one = C.prejScales({ [rev.id]: 2 }, B);
    assert.ok(Math.sign(one[gid] - 50) === Math.sign(rev.g[gid]));
    const top = C.hatedTop(all, 3);
    assert.ok(top.length <= 3 && top.every(id => D.HATED.some(h => h.id === id)));
});

test('gyors mód B része: kör- és tükörpár: a legtöbbször választott nyer, tükörpár témánként -100..100', () => {
    const picks = D.HATED_PAIRS.map(p => p[0]);
    const hr = C.hatedResult(picks);
    assert.ok(hr[0].count >= hr[hr.length - 1].count);
    const mir = C.mirrorResult(D.MIRROR.map(() => 'min'));
    for (const t of D.TOPICS) assert.ok(mir[t.id] >= -100 && mir[t.id] <= 100);
    const mir2 = C.mirrorResult(D.MIRROR.map(() => 'maj'));
    for (const t of D.TOPICS) assert.equal(mir2[t.id], -mir[t.id]);
    const s = C.summarizeValues('short', ansOf(D.A_LISTS.short, (x, i) => cyc[i % 5]), { b: true, picks, mirror: D.MIRROR.map(() => 'min') });
    assert.ok(s.m && Array.isArray(s.h));
});

test('csak utált-teszt összegzése: skálák, megbízhatóság, nincs értékrend-tengely', () => {
    const B = D.B_LISTS.hlong;
    const r = C.summarizeHated(ansOf(B, (s, i) => cyc[i % 5]));
    assert.equal(r.kind, 'hlong');
    assert.ok(r.hs && r.pj && r.rel && !r.s);
    assert.ok(r.rel.index >= 0 && r.rel.index <= 100);
});

test('fejlesztői nézet: a tételek hozzájárulása a skálákhoz követhető', () => {
    const list = D.A_LISTS.long;
    const ans = ansOf(list, (s, i) => cyc[i % 5]);
    const bd = C.breakdown(ans, list);
    assert.ok(bd && typeof bd === 'object');
});

// ---------- Megosztás ----------
const sampleResults = () => {
    const out = {};
    for (const m of MODES) {
        const A = D.A_LISTS[m], B = m === 'short' ? [] : D.B_LISTS[m];
        const ans = ansOf(A.concat(B), (s, i) => cyc[(i * 3 + 1) % 5]);
        out[m + '_a'] = C.summarizeValues(m, ans);
        if (m === 'short') out.short_b = C.summarizeValues('short', ans, { b: true, picks: D.HATED_PAIRS.map(p => p[1]), mirror: D.MIRROR.map((x, i) => i % 3 ? 'min' : 'maj') });
        else out[m + '_b'] = C.summarizeValues(m, ans, { b: true });
    }
    out.hlong = C.summarizeHated(ansOf(D.B_LISTS.hlong, (s, i) => cyc[(i * 2) % 5]));
    return out;
};

test('megosztás (v3): minden mód körbejár, a típus és az illeszkedés a tengelyekből újraszámolódik', () => {
    for (const [k, r] of Object.entries(sampleResults())) {
        const code = C.encode(r);
        assert.match(code, /^[A-Za-z0-9_-]+$/);
        assert.ok(code.length <= (k === 'hlong' || /_b$/.test(k) ? 130 : 70), k + ' hossza: ' + code.length);
        const d = C.decode(code);
        assert.ok(d, k);
        assert.equal(d.ver, D.VERSION);
        assert.equal(d.kind, r.kind, k);
        if (r.s) {
            assert.deepEqual(d.s, r.s, k + ' tengelyek');
            assert.equal(d.a, r.a); assert.equal(d.fit, r.fit);
            assert.equal(d.rel.index, r.rel.index); assert.deepEqual(d.rel.flags, r.rel.flags);
            if (r.rel.axes) assert.deepEqual(d.rel.axes, r.rel.axes);
            assert.equal(d.honesty.index, r.honesty.index);
        }
        if (r.hs) assert.deepEqual(d.hs, r.hs, k + ' utált');
        if (r.pj) assert.deepEqual(d.pj, r.pj, k + ' előítélet');
        if (r.m) assert.deepEqual(d.m, r.m, k + ' tükör');
        if (r.h && r.h.length) assert.deepEqual(d.h, r.h, k + ' top');
    }
});

test('megosztás (v3): hibás, csonka, hamis és újabb verziójú tartalom elutasítva', () => {
    const good = C.encode(C.summarizeValues('long', ansOf(D.A_LISTS.long, (s, i) => cyc[i % 5])));
    for (const bad of ['', 'AAAA!!', good.slice(0, 5), 'x', '😀', null, undefined, 42]) assert.equal(C.decode(bad), null, String(bad));
    const bytes = Buffer.from(good, 'base64url');
    bytes[0] = ((D.VERSION + 1) << 4) | (bytes[0] & 0x0F);
    assert.equal(C.decode(bytes.toString('base64url')), null, 'újabb verzió');
    const fuzz = rng(3);
    for (let i = 0; i < 300; i++) {
        const b = Buffer.from(Array.from({ length: 1 + Math.floor(fuzz() * 40) }, () => Math.floor(fuzz() * 256)));
        b[0] = (D.VERSION << 4) | (b[0] & 0x0F);
        assert.doesNotThrow(() => C.decode(b.toString('base64url')));
        const d = C.decode(b.toString('base64url'));
        if (d && d.s) for (const a of AX) assert.ok(d.s[a] >= -100 && d.s[a] <= 100);
    }
    assert.throws(() => C.encode({ kind: 'valami' }));
});

// ---------- Verziók és régi linkek ----------
test('verziók: a jelenlegi verzió a változásnaplóban, minden régi verzió teljes készlettel (tengelyek, típusok, utált értékek)', () => {
    assert.ok(D.VERSION >= 3 && D.VERSION <= 15);
    assert.deepEqual(D.VERSIONS.map(x => x.v), Array.from({ length: D.VERSION }, (_, i) => i + 1));
    for (const x of D.VERSIONS) { assert.match(x.date, /^\d{4}-\d{2}-\d{2}$/); assert.ok(x.note.length > 20); }
    for (let v = 1; v < D.VERSION; v++) {
        const defs = D.defsFor(v);
        const [nA, nT] = v === 3 ? [10, 20] : [5, 15];
        assert.ok(defs && defs.AXES.length === nA && defs.ARCHETYPES.length === nT && defs.HATED.length === 10, 'v' + v);
        for (const h of defs.HATED) assert.ok(h.id && h.name && h.blurb && h.roast, h.id);
    }
    assert.equal(D.defsFor(D.VERSION).AXES.length, 10);
    assert.equal(D.defsFor(D.VERSION + 1), null);
    assert.equal(D.defsFor(0), null);
    assert.equal(C.hatedDefsFor(D.VERSION + 1), null);
});

test('régi bináris linkek (v1, v2): 5 tengellyel és a régi típusokkal olvashatók', () => {
    const b64 = a => Buffer.from(a).toString('base64url');
    // valós régi linkek: gyors teszt (v1 és v2), részletes teszt (v2)
    const shortCodes = { 1: 'EF1STlZd_w', 2: 'IF1STlZd_w' };
    for (const v of [1, 2]) {
        const d = C.decode(shortCodes[v]);
        assert.ok(d, 'v' + v);
        assert.equal(d.ver, v === 1 ? 1 : 2);
        assert.deepEqual(Object.keys(d.s), ['e', 'l', 'n', 't', 'c']);
        assert.equal(d.a, 'merleg');
        assert.equal(d.fit, 85);
        assert.ok(C.find(D.defsFor(d.ver).ARCHETYPES, d.a));
    }
    const long2 = C.decode('IXtoglhmWO3J920YOD7doYaGGhhoYsEA');
    assert.ok(long2 && long2.long && long2.hs && Object.keys(long2.hs).length === 10);
    assert.equal(long2.ver, 2);
    assert.ok(Object.keys(long2.hs).every(id => D.defsFor(long2.ver).HATED.some(h => h.id === id)));
    // az 1-es verzió utált készlete más, mint a 2-esé
    const long1 = C.decode('EXtoglhmWO3J920YOD7doYaGGhhoYsEA');
    assert.ok(long1 && long1.ver === 1 && 'penz' in long1.hs);
    assert.deepEqual(long1.s, long2.s);
    assert.equal(C.decode(b64([0x20, 1, 2])), null, 'csonka régi link');
});

test('régi JSON linkek: 5 tengely, 1-es verzióként olvashatók', () => {
    const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    const d = C.decode(enc({ v: 1, s: [-7, -18, -22, -14, -7], a: 'merleg', f: 85, h: [] }));
    assert.equal(d.ver, 1);
    assert.deepEqual(d.s, { e: -7, l: -18, n: -22, t: -14, c: -7 });
    const v2 = C.decode(enc({ v: 2, s: [0, 0, 0, 0, 0], a: 'merleg', f: 50, hs: Array(10).fill(50), i: 80, k: [0, 0, 0] }));
    assert.equal(v2.ver, 1);
    assert.deepEqual(Object.keys(v2.hs), D.defsFor(1).HATED.map(h => h.id));
    const v3 = C.decode(enc({ v: 3, k: 'hl', hs: Array(10).fill(70), pj: Array(8).fill(40) }));
    assert.equal(v3.ver, 1);
    assert.equal(C.decode(enc({ v: 9, s: [0, 0, 0, 0, 0] })), null);
});

test('régi v3 linkek (10 utált értékkel): a v4 olvasja őket, a régi skálákkal és típusokkal', () => {
    // valós v3 linkek a v3 kódolóval készítve (3. verziós fejléc, 10 utált érték)
    const L = {
        long_a: 'MWpkV0VUUUhoZoQWBMDLBNmQ',
        long_b: 'NWpkV0VUUUhoZoQEJMDLBNmTxizQsGSWYpZMmTg-yPuFgA',
        short_b: 'NFpabSg7Rn-EZKmHhAJVRZAEiyZDIyA',
        hlong: 'M16xk4kP7BZ2yZRXDI-ycP7YgAA',
        xlong_b: 'NmtnTmZdXlVGam8eJECAw0UCd4pZrHTVsmYr1yNSzer3AA'
    };
    const old10 = D.defsFor(3).HATED.map(h => h.id);
    assert.equal(old10.length, 10);
    assert.deepEqual(old10, D.HATED.slice(0, 10).map(h => h.id), 'a régi tíz az új lista eleje');
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const exp = { long_a: ['merleg', 76, 11], long_b: ['merleg', 76, 2], short_b: ['jos', 70, 67], xlong_b: ['merleg', 82, 15] };
    for (const [k, code] of Object.entries(L)) {
        const d = C.decode(code);
        assert.ok(d, k);
        assert.equal(d.ver, 3, k);
        if (exp[k]) { assert.equal(d.a, exp[k][0], k); assert.equal(d.fit, exp[k][1], k); assert.equal(d.rel.index, exp[k][2], k); assert.equal(Object.keys(d.s).length, 10); }
        if (d.hs) assert.deepEqual(Object.keys(d.hs), old10, k + ': csak a régi tíz skála');
        if (d.h) assert.ok(d.h.every(id => old10.includes(id)), k);
    }
    assert.equal(sum(C.decode(L.long_b).hs), 495);
    assert.equal(sum(C.decode(L.xlong_b).hs), 487);
    assert.equal(sum(C.decode(L.hlong).hs), 551);
    assert.deepEqual(C.decode(L.hlong).h, ['tolvaj', 'szexizmus', 'anarchia']);
    assert.deepEqual(C.decode(L.short_b).h, ['potyazo', 'kornyezet']);
    // a v3 fejléc a mostani (v4) hosszal nem olvasható, és fordítva: a hossz-ellenőrzés védi a kettőt
    const b = Buffer.from(L.hlong, 'base64url');
    b[0] = (4 << 4) | (b[0] & 0x0F);
    assert.equal(C.decode(b.toString('base64url')), null, 'v3 hosszú adat v4 fejléccel nem érvényes');
    const cur = Buffer.from(C.encode(C.summarizeHated(ansOf(D.B_LISTS.hlong, (s, i) => cyc[i % 5]))), 'base64url');
    cur[0] = (3 << 4) | (cur[0] & 0x0F);
    assert.equal(C.decode(cur.toString('base64url')), null, 'v4 hosszú adat v3 fejléccel nem érvényes');
});

test('v4: 18 skála, a B rész hosszabb (78 / 104), a hlong link 18 utált értéket visz, és az eredményben mind az új értékek ott vannak', () => {
    assert.equal(D.B_LISTS.long.length, 78);
    assert.equal(D.B_LISTS.xlong.length, 104);
    const r = C.summarizeHated(ansOf(D.B_LISTS.hlong, (s, i) => cyc[(i * 2) % 5]));
    assert.equal(Object.keys(r.hs).length, 18);
    const d = C.decode(C.encode(r));
    assert.equal(d.ver, 4);
    assert.deepEqual(d.hs, r.hs);
    for (const id of ['keses', 'sorban', 'okos', 'igeret', 'kutya', 'rendetlen', 'spoiler', 'henceg']) {
        assert.ok(id in d.hs, id);
        const own = D.HATED_ITEMS.filter(x => x.h[id]);
        assert.ok(own.length >= 4, id + ' tételei: ' + own.length);
        assert.ok(own.some(x => x.h[id] < 0), id + ': van fordított tétel');
        assert.ok(own.some(x => x.role === 'S') && own.some(x => x.role === 'X'), id);
        // aki mindenre igent mond az adott értékre, annál magas a skála; aki a fordítottra, annál alacsony
        const hi = C.hatedScales(ansOf(D.B_LISTS.xlong, s => s.h && s.h[id] ? 2 * Math.sign(s.h[id]) : 0), D.B_LISTS.xlong);
        assert.ok(hi[id] > 60, id + ': ' + hi[id]);
    }
    // a gyors mód 15-ös indexe továbbra is „nincs”, a körök a klasszikus tíz értékből jönnek
    const sh = C.decode(C.encode(C.summarizeValues('short', ansOf(D.A_LISTS.short, (s, i) => cyc[i % 5]), { b: true, picks: D.HATED_PAIRS.map(p => p[0]), mirror: D.MIRROR.map(() => 'min') })));
    assert.ok(sh.h.every(id => D.HATED.slice(0, 10).some(h => h.id === id)));
    const none = C.decode(C.encode({ kind: 'short', s: Object.fromEntries(AX.map(a => [a, 0])), rel: { index: 50, flags: [], axes: Object.fromEntries(AX.map(a => [a, 1])) }, honesty: { index: 100, liesN: 0, twinsN: 0 }, h: [], m: { nem: 0, kulf: 0, lgbt: 0, vall: 0 } }));
    assert.deepEqual(none.h, []);
});

// ---------- Képek ----------
function mockCtx() {
    const log = { text: [], fills: 0, bad: [] };
    const target = {
        measureText: t => ({ width: String(t).length * 11 }),
        createLinearGradient: () => ({ addColorStop() {} }),
        fillText: (t, x, y) => { log.text.push(String(t)); (log.ys = log.ys || {})[String(t)] = y; if (![x, y].every(Number.isFinite)) log.bad.push(t); },
        fill: () => { log.fills++; }, fillRect: () => { log.fills++; }
    };
    const ctx = new Proxy(target, { get: (t, k) => (k in t ? t[k] : (() => {})), set: (t, k, v) => { t[k] = v; return true; } });
    return { ctx, log };
}

test('képek: minden kategória lerajzolható, a méret fix, a kép a kitöltött résztől függ', () => {
    assert.equal(IMG.WIDTH, 1080); assert.equal(IMG.HEIGHT, 1350);
    assert.deepEqual(IMG.CATEGORIES.map(c => c.id), ['values', 'hated', 'prej', 'trust']);
    const S = sampleResults();
    assert.deepEqual(IMG.available(S.short_a).map(c => c.id), ['values', 'trust']);
    assert.deepEqual(IMG.available(S.long_b).map(c => c.id), ['values', 'hated', 'prej', 'trust']);
    assert.deepEqual(IMG.available(S.hlong).map(c => c.id), ['hated', 'prej', 'trust']);
    for (const [k, r] of Object.entries(S)) {
        for (const c of IMG.available(r)) {
            const { ctx, log } = mockCtx();
            assert.doesNotThrow(() => IMG.draw(ctx, c.id, r), k + '/' + c.id);
            assert.ok(log.text.length > 3, k + '/' + c.id);
            assert.deepEqual(log.bad, [], k + '/' + c.id + ' érvénytelen koordináta');
            assert.ok(log.text.some(t => /femboy\.hu/.test(t)), 'webcím a képen');
        }
    }
    const { ctx, log } = mockCtx();
    IMG.draw(ctx, 'values', S.xlong_b);
    assert.ok(log.text.some(t => t.includes(C.find(D.ARCHETYPES, S.xlong_b.a).title)));
    assert.ok(log.text.some(t => /Megbízhatóság/i.test(t)));
    assert.throws(() => IMG.draw(ctx, 'nincs', S.xlong_b));
    // 18 utált érték is elfér a képen
    const mh = mockCtx();
    IMG.draw(mh.ctx, 'hated', S.xlong_b);
    assert.ok(S.xlong_b.hs && Object.keys(S.xlong_b.hs).length === 18);
    for (const h of D.HATED) {
        assert.ok(mh.log.text.includes(h.name), h.name + ' szerepel a képen');
        assert.ok(mh.log.ys[h.name] < IMG.HEIGHT - 90, h.name + ' a lábléc fölött van: ' + mh.log.ys[h.name]);
    }
});

test('képek: régi (v1/v2) eredmény is lerajzolható a régi tengelyekkel és típusokkal', () => {
    const d = C.decode('IXtoglhmWO3J920YOD7doYaGGhhoYsEA');
    const { ctx, log } = mockCtx();
    assert.doesNotThrow(() => IMG.draw(ctx, 'values', d));
    assert.ok(log.text.some(t => t.includes(C.find(D.defsFor(2).ARCHETYPES, d.a).title)));
    assert.ok(IMG.available(d).some(c => c.id === 'hated'));
    assert.doesNotThrow(() => IMG.draw(mockCtx().ctx, 'hated', d));
});

test('képek: a sortörés nem veszít szöveget', () => {
    const { ctx } = mockCtx();
    const lines = IMG.wrap(ctx, 'Ez egy elég hosszú mondat, amit több sorba kell tördelni a képen.', 300);
    assert.ok(lines.length >= 2);
    assert.equal(lines.join(' ').replace(/\s+/g, ' '), 'Ez egy elég hosszú mondat, amit több sorba kell tördelni a képen.');
});

// ---------- Oldal és felület ----------
test('oldal: az értékteszt be van kötve (scriptek sorrendje, navbar, sitemap, AI-slop jelzés)', () => {
    const h = pub('ertektest.html');
    const order = ['ertektest-legacy.js', 'ertektest-items.js', 'ertektest-data.js', 'ertektest-core.js', 'ertektest-img.js', 'src="ertektest.js"'];
    let last = -1;
    for (const f of order) { const i = h.indexOf(f); assert.ok(i > last, f + ' sorrend'); last = i; }
    for (const f of ['ertektest.css', 'theme.js', 'uwu.js']) assert.ok(h.includes(f), f);
    assert.match(h, /AI-slop, vibe kódolt/);
    assert.match(h, /id="et-stage"[^>]*data-no-uwu/);
    assert.ok(!/96 kérdés/.test(h));
    assert.match(pub('navbar.html'), /href="ertektest\.html" data-page="ertektest\.html"/);
    assert.match(pub('sitemap.xml'), /femboy\.hu\/ertektest\.html/);
});

test('felület: 3 értékrend-mód + csak utált, opcionális B rész, megbízhatóság-kártya, képek, folytatás az eredményből', () => {
    const js = pub('ertektest.js'), css = pub('ertektest.css');
    for (const m of ['short', 'long', 'xlong', 'hlong']) assert.ok(js.includes("'" + m + "'"), m);
    assert.match(js, /function renderReliability/);
    assert.match(js, /function renderRank/); assert.match(js, /function pickRank/); assert.match(js, /function toggleStar/); assert.match(js, /function starBox/);
    assert.match(js, /stars: st\.stars/, 'a jelölések az összesítőbe kerülnek');
    assert.match(js, /e\.key === 'f'/, 'F billentyű a fontosnak jelöléshez');
    assert.match(js, /D\.RANK_VALUES/);
    assert.match(js, /l\.expect === 'yes'/, 'az ellenőrző kérdéseknél mindkét irány külön szöveget kap');
    assert.match(js, /function renderImages/);
    assert.match(js, /et-b-yes/); assert.match(js, /et-b-no/); assert.match(js, /et-b-continue/);
    assert.match(js, /navigator\.share/);
    assert.match(js, /canShare/);
    assert.match(js, /Teszt-verzió: /);
    assert.match(js, /et-oldnote/);
    assert.match(js, /nem olvasható/);
    assert.match(js, /function devTap/);
    assert.match(js, /devClicks\.length >= 7/);
    assert.ok(!/location\.search/.test(js), 'nincs URL-paraméteres fejlesztői mód');
    for (const c of ['.et-modes.three', '.et-star', '.et-rank', '.et-rk', '.et-cert', '.et-axchip', '.et-imgs', '.et-img-cv', '.et-oldnote', '.et-vers', '.et-group']) assert.ok(css.includes(c), c);
    assert.ok(!/C\.find\(D\.HATED, (top|x|last|r\.h)/.test(js), 'az eredménynézet nem használhatja a mostani készletet');
});

test('Életút: a megosztás linkje JSON-t visz az URL-ben, és megnyitáskor ellenőrzött', () => {
    const js = pub('eletut.js'), html = pub('eletut.html');
    assert.match(js, /'#r=' \+ b64uEnc\(JSON\.stringify\(sharePayload\(\)\)\)/);
    assert.match(js, /function parseShared/);
    assert.match(js, /D\.find\(D\.ITEMS, o\.o\[slot\]\)/, 'a ruhák azonosítóit ellenőrzi');
    for (const id of ['el-shared', 'el-sh-art', 'el-sh-play', 'el-share-box', 'el-share-url', 'el-share-copy']) assert.ok(html.includes('id="' + id + '"'), id);
});

test('navbar: a hosszú márkanév csak 1400px felett jelenik meg, a menüpontok nem törnek sorba', () => {
    const nav = pub('navbar.html'), css = pub('style.css');
    assert.match(nav, /d-lg-inline d-xxl-none[^>]*>MFSZ/);
    assert.match(nav, /d-lg-none d-xxl-inline">Magyar Femboy Szakszervezet/);
    assert.match(css, /\.navbar-nav \.nav-link \{ white-space: nowrap; \}/);
});

test('README: az értékteszt új szerkezete és a teszt-verzió dokumentálva', () => {
    const md = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    assert.match(md, /Teszt-verzió/);
    assert.match(md, /10 tengely/);
    assert.match(md, /ertektest-img\.js/);
});
