// Események ellenőrzése: nincs zsákutca, nincs "undefined"/NaN a szövegekben, a küszöbök egyeznek a tippekkel,
// és a szövegek csak olyan dolgot állítanak a játékosról, ami tényleg igaz rá.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
global.MFSZ = global.MFSZ || {};
const pub = path.join(__dirname, '..', 'public');
const D = require(path.join(pub, 'eletut-data.js'));
const Ev = require(path.join(pub, 'eletut-events.js'));
const E = require(path.join(pub, 'eletut-engine.js'));

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const clone = (s) => JSON.parse(JSON.stringify(s));
const BAD = /undefined|NaN|\[object|null/;

function randomState(rnd) {
    const s = E.newState({ name: 'Teszt' });
    s.month = Math.floor(rnd() * 130);
    s.money = Math.floor(rnd() * 400000);
    s.conf = Math.floor(rnd() * rnd() * 3000);
    s.comm = Math.floor(rnd() * 150);
    s.risk = Math.floor(rnd() * 100);
    s.comp = Math.floor(rnd() * D.COMPUTERS.length);
    const age = E.ageYears(s);
    if (age >= 18 && rnd() < 0.7) { s.housing = ['kolesz', 'szoba', 'garzon', 'lakas'][Math.floor(rnd() * 4)]; if (s.housing === 'kolesz') s.student = true; }
    if (s.housing === 'szulo') { s.out = rnd() < 0.4; s.hiding = rnd() < 0.3; } else s.out = true;
    if (age >= 17 && rnd() < 0.6) s.flags.discord = true;
    if (age >= 16 && rnd() < 0.5) s.job = D.JOBS.filter((j) => age >= j.minAge && !Object.keys(j.needs || {}).length)[0].id;
    D.ITEMS.forEach((it) => { if (rnd() < 0.35) { s.items[it.id] = true; if (rnd() < 0.7) s.equipped[it.slot] = it.id; } });
    D.DECOR.forEach((d) => { if (rnd() < 0.3) s.decor[d.id] = true; });
    if (s.housing !== 'szulo' && rnd() < 0.3) s.pets.cica = true;
    D.SKILLS.forEach((k) => { if (rnd() < 0.3) s.skills[k.id] = Math.floor(rnd() * 4); });
    return s;
}

test('események: szövegek, választások, hatások épek véletlen állapotokon', () => {
    const rnd = mulberry32(1234);
    E.setRng(mulberry32(99));
    let shown = 0;
    for (let n = 0; n < 400; n++) {
        const s = randomState(rnd);
        const c = E.ctx(s);
        Ev.EVENTS.forEach((ev) => {
            if (!E.eligible(Object.assign(clone(s), { seen: {}, lastSeen: {} }), ev, c, true)) return;
            const t = clone(s);
            E.showEvent(t, ev);
            shown++;
            assert.ok(t.event.text && !BAD.test(t.event.text), ev.id + ' szöveg: ' + t.event.text);
            assert.ok(!BAD.test(t.event.title), ev.id + ' cím');
            const view = E.eventView(t);
            assert.ok(view.choices.some((x) => x.enabled), ev.id + ': nincs választható opció');
            view.choices.forEach((ch) => {
                if (!ch.enabled) { assert.ok(ch.reqText, ev.id + ': tiltott opciónak nincs oka: ' + ch.label); return; }
                const u = clone(t);
                assert.ok(E.choose(u, ch.index), ev.id + ' választás elbukott');
                assert.ok(!BAD.test(u.event.result), ev.id + ' eredmény: ' + u.event.result);
                ['money', 'conf', 'energy', 'risk', 'comm'].forEach((k) => assert.ok(Number.isFinite(u[k]), ev.id + ': ' + k + ' nem szám'));
            });
        });
    }
    assert.ok(shown > 500, 'túl kevés esemény ellenőrizve: ' + shown);
});

test('a "mi van rajtad" szövegekben csak viselhető tárgy szerepel, a szobában tartott nem', () => {
    const s = E.newState({ name: 'T' });
    D.ITEMS.forEach((it) => { s.items[it.id] = true; s.equipped[it.slot] = it.id; });
    s.out = true;
    const c = E.ctx(s);
    const pack = D.ITEMS.filter((i) => !D.SLOTS.find((sl) => sl.id === i.slot).wear);
    assert.ok(pack.length >= 6);
    pack.forEach((it) => assert.ok(!c.outfit.some((o) => o.id === it.id), it.id + ' nem lehet a viselet része'));
    assert.ok(c.outfit.length === D.SLOTS.filter((sl) => sl.wear).length);
});

test('a tippben ígért önbizalom-küszöb tényleg ott fordul át', () => {
    E.setRng(mulberry32(5));
    let checked = 0;
    Ev.EVENTS.forEach((ev) => ev.choices.forEach((ch, idx) => {
        const need = E.confNeed(ch);
        if (!need || ch.req) return;
        const run = (conf) => {
            const s = E.newState({ name: 'T' });
            s.conf = conf; s.money = 500000; s.comm = 50; s.out = false;
            ['crop', 'macskaful', 'smink', 'szoknya'].forEach((id) => { const it = D.find(D.ITEMS, id); s.items[id] = true; s.equipped[it.slot] = id; });
            E.setRng(mulberry32(7));
            E.showEvent(s, ev);
            E.choose(s, idx);
            return s.event.result + '|' + Math.round(s.conf - conf) + '|' + s.risk + '|' + s.out + '|' + s.parents;
        };
        const lo = run(need - 1), hi = run(need);
        assert.notEqual(lo, hi, ev.id + ': a ' + need + ' önbizalom-küszöb nem változtat az eredményen');
        checked++;
    }));
    assert.ok(checked >= 6);
});

test('minden tárgynak van statja, a kombók létező tárgyakra hivatkoznak', () => {
    const known = {};
    D.ITEMS.concat(D.DECOR, D.PETS).forEach((x) => { known[x.id] = true; assert.ok(x.st && Object.keys(x.st).length, x.id + ' nincs stat'); });
    D.ITEMS.forEach((it) => { assert.ok(D.SLOTS.find((sl) => sl.id === it.slot), it.id + ' ismeretlen hely'); if (it.paint) assert.match(it.paint, /^#[0-9a-f]{6}$/i); });
    D.COMBOS.forEach((c) => {
        c.need.forEach((n) => (Array.isArray(n) ? n : [n]).forEach((id) => assert.ok(known[id], c.id + ': ismeretlen tárgy ' + id)));
        Object.keys(c.bonus).forEach((k) => assert.ok(D.STATS.find((x) => x.id === k), c.id + ': ismeretlen stat ' + k));
    });
    D.SLOTS.forEach((sl) => assert.ok(D.ITEMS.some((i) => i.slot === sl.id), sl.id + ' hely üres'));
});

test('kombók és statok: viselés, rejtőzködés, színválasztás', () => {
    const s = E.newState({ name: 'T' });
    s.out = true;
    D.ITEMS.forEach((it) => { s.items[it.id] = true; });
    assert.equal(E.stats(s).score, 0, 'viselet nélkül nincs stat');
    s.equipped.neck = 'choker'; s.equipped.hair = 'headset';
    let st = E.stats(s);
    assert.ok(st.combos.find((c) => c.combo.id === 'streamer').active, 'streamer kombó');
    assert.equal(st.total.gamer, 2 + 14 + 8, 'gamer: choker 2 + headset 14 + kombó 8');
    // kombó nélkül kevesebb
    s.equipped.neck = 'medal';
    assert.ok(!E.stats(s).combos.find((c) => c.combo.id === 'streamer').active);
    // titkolózás + rejtőzés: viselt tárgyak nem számítanak, a szobában tartott igen
    const h = E.newState({ name: 'H' });
    h.items.choker = true; h.items.kbd = true; h.equipped.neck = 'choker'; h.equipped.gear = 'kbd';
    const open = E.stats(h).score;
    h.hiding = true;
    const hidden = E.stats(h).score;
    assert.ok(hidden < open && hidden > 0, 'rejtőzéskor csak a viselt rész esik ki');
    // színek
    s.items.polo = true;
    assert.equal(E.paintOf(s, 'polo'), D.find(D.ITEMS, 'polo').paint);
    assert.ok(E.setColor(s, 'polo', 'menta').ok);
    assert.equal(E.paintOf(s, 'polo'), D.find(D.PALETTE, 'menta').color);
    assert.ok(!E.setColor(s, 'polo', 'nincsilyen').ok);
    assert.ok(!E.setColor(s, 'szemuveg', 'menta').ok, 'nem festhető tárgy');
    assert.ok(E.setColor(s, 'polo', null).ok);
    assert.equal(E.paintOf(s, 'polo'), D.find(D.ITEMS, 'polo').paint);
    // mentés/betöltés megőrzi a színt
    E.setColor(s, 'polo', 'rozsa');
    const back = E.deserialize(E.serialize(s));
    assert.equal(back.colors.polo, 'rozsa');
});
