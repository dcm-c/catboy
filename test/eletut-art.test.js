// Pasztell Életút - grafika: a karakter, a szobák és a jelenetek tiszta, érvényes SVG-t adnak.
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

global.MFSZ = global.MFSZ || {};
const pub = path.join(__dirname, '..', 'public');
const D = require(path.join(pub, 'eletut-data.js'));
require(path.join(pub, 'eletut-events.js'));
const E = require(path.join(pub, 'eletut-engine.js'));
const C = require(path.join(pub, 'eletut-char.js'));
const A = require(path.join(pub, 'eletut-art.js'));

// Egyszerű szerkezeti ellenőrzés: kiegyensúlyozott címkék, nincs ismétlődő azonosító, minden url(#..) létezik.
function check(svg, label) {
    assert.ok(!/NaN|undefined|\[object/.test(svg), label + ': NaN/undefined került a rajzba');
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, label + ': ismétlődő azonosító');
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), label + ': hiányzó hivatkozás: ' + m[1]);
    const stack = [];
    for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
        if (m[4] === '/') continue;
        if (m[1] === '/') assert.equal(stack.pop(), m[2], label + ': rosszul zárt címke: ' + m[2]);
        else stack.push(m[2]);
    }
    assert.equal(stack.length, 0, label + ': nem zárt címke: ' + stack.join(','));
    // egy elemen nem lehet kétszer ugyanaz az attribútum
    for (const m of svg.matchAll(/<[a-zA-Z][^>]*>/g)) {
        const names = [...m[0].matchAll(/\s([a-zA-Z:-]+)="/g)].map(x => x[1]);
        assert.equal(new Set(names).size, names.length, label + ': ismétlődő attribútum: ' + m[0].slice(0, 90));
    }
}

test('karakter: minden ruha, kiegészítő, haj és hangulat hibátlan', () => {
    let n = 0;
    for (const style of D.HAIR_STYLES) for (const mood of ['neutral', 'happy', 'worried', 'proud']) for (const pose of ['idle', 'wave', 'hips']) {
        const outfit = {};
        D.SLOTS.forEach((sl, i) => { const items = D.ITEMS.filter(x => x.slot === sl.id); outfit[sl.id] = items[(n + i) % items.length].id; });
        check(C.avatar({ skin: 's3', hairStyle: style.id, hairColor: D.HAIR_COLORS[n % 7].id, outfit, mood, pose, uid: 't' }), `${style.id}/${mood}/${pose}`);
        n++;
    }
    for (const it of D.ITEMS) check(C.avatar({ outfit: { [it.slot]: it.id }, mood: 'happy', uid: 'x' }), it.id);
    check(C.avatar({}), 'üres');
});

test('szoba, közelkép és minden jelenet hibátlan, a szobában a ház és a gép látszik', () => {
    const s = E.newState({ name: 'T' });
    s.decor = { poszter: true, zaszlo: true, ledfeny: true, agytakaro: true, novenyek: true, tukor: true, polc: true };
    for (const h of D.HOUSING) for (let comp = 0; comp < D.COMPUTERS.length; comp++) {
        s.housing = h.id; s.comp = comp; s.pets = comp % 2 ? { cica: true } : {};
        const v = A.viewOf(s);
        check(A.room(v), `szoba ${h.id}/${comp}`);
    }
    const v = A.viewOf(s);
    check(A.closeup(v), 'közelkép');
    assert.ok(A.SCENES.length >= 16);
    for (const id of A.SCENES) check(A.scene(id, v), 'jelenet ' + id);
    assert.ok(A.sprite().includes('i-heart'));
    for (const name of A.icons) assert.ok(A.sprite().includes('id="i-' + name + '"'));
});

test('a játékos neve sosem kerül a rajzba', () => {
    const s = E.newState({ name: 'Zsolt<script>' });
    const v = A.viewOf(s);
    const svg = A.room(v) + A.closeup(v) + A.portrait(v);
    assert.ok(!svg.includes('Zsolt') && !svg.includes('<script'));
});

test('a gép javítása pénzbe kerül, és csak elromlott gépen megy', () => {
    const s = E.newState();
    assert.equal(E.repairComputer(s).ok, false);
    s.brokenUntil = s.month + 3;
    s.money = 0;
    assert.equal(E.repairComputer(s).ok, false);
    s.money = 100000;
    const cost = E.repairCost(s);
    assert.equal(E.repairComputer(s).ok, true);
    assert.equal(s.money, 100000 - cost);
    assert.ok(s.brokenUntil < s.month);
});

test('mentésbetöltés: csak a valódi Discord-link marad meg az eseményben', () => {
    const s = E.newState();
    E.showEvent(s, global.MFSZ.events.find('e_discord'));
    s.event.link = { href: 'https://evil.example/', label: 'x' };
    s.event.result = 'ok';
    let back = E.deserialize(E.serialize(s));
    assert.equal(back.event.link, null);
    s.event.link = { href: D.DISCORD_URL, label: 'Megnyitom' };
    back = E.deserialize(E.serialize(s));
    assert.equal(back.event.link.href, D.DISCORD_URL);
});
