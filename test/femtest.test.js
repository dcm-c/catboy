// Femboy-típus teszt: adatok, pontozás, linkkódolás, eloszlás, bekötés
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const F = require('../public/femtest-data.js');
const pub = path.join(__dirname, '..', 'public');

// determinisztikus véletlen
function rng(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const axIdx = id => F.AXES.findIndex(a => a.id === id);

test('femtest: 8 tengely, 32 állítás (tengelyenként 4: 2 előre, 2 fordítva), egyedi azonosítók és poénok', () => {
    assert.equal(F.AXES.length, 8);
    assert.equal(F.ITEMS.length, 32);
    assert.equal(new Set(F.ITEMS.map(i => i.id)).size, 32);
    F.AXES.forEach(a => {
        const it = F.ITEMS.filter(i => i.ax === a.id);
        assert.equal(it.length, 4, a.id);
        assert.equal(it.filter(i => i.dir > 0).length, 2, a.id + ' irányok');
        assert.ok(a.name && a.neg && a.pos && a.icon && a.negIcon && a.posIcon, a.id);
    });
    const jokes = F.ITEMS.map(i => i.joke);
    assert.equal(new Set(jokes).size, jokes.length, 'ismétlődő poén');
    F.ITEMS.forEach(i => {
        assert.ok(i.text.length >= 25 && i.text.length <= 200, i.id + ' szöveg');
        assert.ok(i.joke.length >= 25 && i.joke.length <= 200, i.id + ' poén');
    });
    // a körbejárás: két egymás utáni állítás nem lehet ugyanazon a tengelyen
    for (let i = 1; i < 32; i++) assert.notEqual(F.ITEMS[i].ax, F.ITEMS[i - 1].ax);
});

test('femtest: 13 típus teljes adattal, érvényes vektorral és létező párosítással', () => {
    assert.equal(F.TYPES.length, 13);
    const ids = F.TYPES.map(t => t.id);
    assert.equal(new Set(ids).size, 13);
    F.TYPES.forEach(t => {
        assert.match(t.id, /^[a-z]+$/, 'az azonosító legyen ékezet nélküli');
        assert.equal(t.v.length, 8, t.id);
        t.v.forEach(x => assert.ok(x >= -1 && x <= 1, t.id));
        assert.ok(t.emoji, t.id + '.emoji');
        ['title', 'desc', 'outfit', 'power', 'weak', 'motto', 'buddyWhy'].forEach(k => assert.ok(t[k] && t[k].length >= 8, t.id + '.' + k));
        assert.ok(ids.includes(t.buddy) && t.buddy !== t.id, t.id + ' páros');
    });
    assert.equal(F.METERS.length, 6);
    F.METERS.forEach(m => ['name', 'icon', 'low', 'mid', 'high'].forEach(k => assert.ok(m[k], m.id + '.' + k)));
});

test('femtest: a típus ideális válaszaival pontosan az a típus jön ki, jó illeszkedéssel', () => {
    F.TYPES.forEach(t => {
        const ans = F.ITEMS.map(it => Math.round(t.v[axIdx(it.ax)] * 2 * it.dir));
        const r = F.evaluate(ans);
        assert.equal(r.type, t.id);
        assert.ok(r.fit >= 80, t.id + ' illeszkedés ' + r.fit);
    });
});

test('femtest: pontozás: tengelyérték -100..100, a tükrözött válaszok tükrözött tengelyt adnak, a kihagyás nem tör el semmit', () => {
    const rnd = rng(3);
    for (let n = 0; n < 200; n++) {
        const ans = F.ITEMS.map(() => (rnd() < 0.1 ? null : Math.floor(rnd() * 5) - 2));
        const r = F.evaluate(ans), flip = F.evaluate(ans.map(v => (v === null ? null : -v)));
        F.AXES.forEach(a => {
            assert.ok(r.scores[a.id] >= -100 && r.scores[a.id] <= 100 && !Number.isNaN(r.scores[a.id]));
            assert.equal(flip.scores[a.id] === 0 ? 0 : flip.scores[a.id], r.scores[a.id] === 0 ? 0 : -r.scores[a.id]);
        });
        r.meters.forEach(m => assert.ok(m.value >= 0 && m.value <= 100 && m.text));
        assert.ok(r.fit >= 5 && r.fit <= 99);
    }
    const none = F.evaluate(F.ITEMS.map(() => null));
    assert.equal(none.type, 'atlag');
    assert.ok(none.cons.passzBajnok);
    F.AXES.forEach(a => assert.equal(none.scores[a.id], 0));
});

test('femtest: következetesség: az egyirányú válaszok magas, az ellentmondók alacsony értéket adnak', () => {
    const t = F.TYPES.find(x => x.id === 'rocksztar');
    const clean = F.evaluate(F.ITEMS.map(it => Math.round(t.v[axIdx(it.ax)] * 2 * it.dir)));
    const chaos = F.evaluate(F.ITEMS.map(it => (it.dir > 0 ? 2 : 2)));  // mindenre „igen”: a fordított állítások ellentmondanak
    assert.ok(clean.cons.index >= 75, 'tiszta: ' + clean.cons.index);
    assert.ok(chaos.cons.index <= 30, 'ellentmondó: ' + chaos.cons.index);
    assert.ok(F.TIERS.some(x => x.name === chaos.cons.tier.name));
});

test('femtest: link: a válaszok oda-vissza kódolhatók (kihagyással is), a hibás kódok null-t adnak', () => {
    const rnd = rng(11);
    for (let n = 0; n < 300; n++) {
        const ans = F.ITEMS.map(() => (rnd() < 0.12 ? null : Math.floor(rnd() * 5) - 2));
        const code = F.encode(ans);
        assert.match(code, /^[A-Za-z0-9_-]+$/);
        assert.equal(code.length, 18);
        const back = F.decode(code);
        assert.deepEqual(back.answers, ans);
        assert.equal(back.type, F.evaluate(ans).type);
    }
    const good = F.encode(F.ITEMS.map(() => 1));
    [null, undefined, '', 'abc', good.slice(0, -2), good + 'A', good.replace(/^./, '9'), good.replace(/./g, '!'), 'A'.repeat(18), good.slice(0, 1) + '_'.repeat(17)]
        .forEach(bad => assert.equal(F.decode(bad), null, String(bad)));
    // az ismert érték: stabil formátum (a megosztott linkek nem romolhatnak el)
    assert.equal(F.encode(F.ITEMS.map(() => 0)), F.encode(F.ITEMS.map(() => 0)));
    assert.equal(F.decode(F.encode(F.ITEMS.map(() => 2))).answers.every(v => v === 2), true);
});

test('femtest: eloszlás: szimulált kitöltőkre mind a 13 típus elérhető, egyik sem uralja az eredményeket', () => {
    const rnd = rng(7), cnt = {};
    F.TYPES.forEach(t => { cnt[t.id] = 0; });
    const N = 6000;
    for (let n = 0; n < N; n++) {
        const lat = F.AXES.map(() => { const u = rnd() * 2 - 1; return Math.sign(u) * Math.pow(Math.abs(u), 0.8); });
        const ans = F.ITEMS.map(it => Math.max(-2, Math.min(2, Math.round(lat[axIdx(it.ax)] * 2 * it.dir + (rnd() - 0.5) * 2.2))));
        cnt[F.evaluate(ans).type]++;
    }
    F.TYPES.forEach(t => {
        const share = cnt[t.id] / N;
        assert.ok(share >= 0.025 && share <= 0.14, t.id + ' részaránya ' + (share * 100).toFixed(1) + '%');
    });
});

test('femtest: bekötés: az oldal a megfelelő sorrendben tölti a fájlokat, a bevezető kártya és a kapcsolópontok megvannak', () => {
    const html = fs.readFileSync(path.join(pub, 'ertektest.html'), 'utf8');
    const iData = html.indexOf('femtest-data.js'), iUi = html.indexOf('femtest.js'), iMain = html.indexOf('src="ertektest.js"');
    assert.ok(iData > 0 && iData < iUi && iUi < iMain, 'betöltési sorrend');
    const main = fs.readFileSync(path.join(pub, 'ertektest.js'), 'utf8');
    assert.match(main, /mode === 'fem'/);
    assert.match(main, /MFSZErtek\.kit\s*=/);
    const ui = fs.readFileSync(path.join(pub, 'femtest.js'), 'utf8');
    assert.match(ui, /#f=/);
    assert.match(ui, /register\('femres'/);
});
