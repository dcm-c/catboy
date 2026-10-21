// Pasztell Életút - események képei: minden eseménynek van saját, hibátlan felvétele.
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

global.MFSZ = global.MFSZ || {};
const pub = path.join(__dirname, '..', 'public');
const D = require(path.join(pub, 'eletut-data.js'));
const Ev = require(path.join(pub, 'eletut-events.js'));
const E = require(path.join(pub, 'eletut-engine.js'));
require(path.join(pub, 'eletut-assets.js'));
require(path.join(pub, 'eletut-char.js'));
const A = require(path.join(pub, 'eletut-art.js'));
['stage', 'props', 'sets-home', 'sets-places', 'sets-outdoor', 'shots'].forEach(f => require(path.join(pub, 'eletut-' + f + '.js')));
const St = MFSZ.stage;

function check(svg, label) {
    assert.ok(!/NaN|undefined|\[object/.test(svg), label + ': NaN/undefined került a rajzba');
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, label + ': ismétlődő azonosító');
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), label + ': hiányzó hivatkozás: ' + m[1]);
    for (const m of svg.matchAll(/ d="([^"]*)"/g)) assert.ok(/^\s*[Mm]/.test(m[1]) || !m[1].trim(), label + ': hibás útvonal: ' + m[1].slice(0, 40));
    const stack = [];
    for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
        if (m[4] === '/') continue;
        if (m[1] === '/') assert.equal(stack.pop(), m[2], label + ': rosszul zárt címke: ' + m[2]);
        else stack.push(m[2]);
    }
    assert.equal(stack.length, 0, label + ': nem zárt címke');
}

const VIEW = { skin: 's2', hairStyle: 'bob', hairColor: 'rozsa', outfit: { top: 'polo', bottom: 'jogger' }, colors: {}, patterns: {}, makeup: {}, mood: 'happy' };
const POSES = ['idle', 'wave', 'hips', 'sit', 'phone', 'cheer', 'think', 'hold', 'point', 'shrug'];

function resolve(id) {
    let sp = St.shots[id];
    if (typeof sp === 'function') {
        const s = E.newState({ name: 'T' });
        sp = sp(s, E.ctx(s));
    }
    return sp;
}

test('minden eseménynek van saját felvétele, és nincs árva felvétel', () => {
    const ids = Ev.EVENTS.map(e => e.id);
    assert.deepEqual(ids.filter(i => !St.shots[i]), []);
    assert.deepEqual(Object.keys(St.shots).filter(k => !ids.includes(k)), []);
});

test('a felvételek csak létező helyszínt, tárgyat, effektet és pózt használnak', () => {
    for (const id of Object.keys(St.shots)) {
        const sp = resolve(id);
        assert.ok(St.sets[sp.set], id + ': ismeretlen helyszín: ' + sp.set);
        assert.ok(St.TIMES[sp.time || 'day'], id + ': ismeretlen napszak: ' + sp.time);
        (sp.props || []).forEach(p => assert.ok(St.props[p.k], id + ': ismeretlen tárgy: ' + p.k));
        (sp.fx || []).forEach(f => assert.ok(St.fx[Array.isArray(f) ? f[0] : f], id + ': ismeretlen effekt: ' + f));
        (sp.cast || []).forEach(c => { if (c.pose) assert.ok(POSES.includes(c.pose), id + ': ismeretlen póz: ' + c.pose); });
        assert.ok((sp.cast || []).length >= 1, id + ': nincs szereplő');
    }
});

test('minden felvétel hibátlan SVG-t ad, és a rajz determinisztikus', () => {
    for (const ev of Ev.EVENTS) {
        const sp = Object.assign({ key: ev.id }, resolve(ev.id));
        const view = Object.assign({}, VIEW, { guest: ev.reach || (typeof ev.guest === 'string' ? ev.guest : 'lilla'), shot: sp, uid: 'ev' });
        const a = A.scene(ev.art, view), b = A.scene(ev.art, view);
        check(a, ev.id);
        assert.equal(a, b, ev.id + ': nem determinisztikus');
        assert.ok(a.length > 4000, ev.id + ': gyanúsan üres kép');
    }
});

test('a felvételek valóban különböznek egymástól', () => {
    const seen = new Map();
    for (const ev of Ev.EVENTS) {
        const sp = resolve(ev.id);
        const sig = JSON.stringify([sp.set, sp.time, (sp.cast || []).map(c => [c.who, c.pose, c.mood]), (sp.props || []).map(p => p.k)]);
        if (seen.has(sig)) assert.fail(ev.id + ' és ' + seen.get(sig) + ' felvétele azonos');
        seen.set(sig, ev.id);
    }
});

test('eventView átadja a felvételt, felvétel nélkül is működik', () => {
    const s = E.newState({ name: 'T' });
    s.event = { id: 'e_video', title: 't', text: 'x', art: 'room', result: null };
    const v = E.eventView(s);
    assert.ok(v.shot && v.shot.key === 'e_video' && v.shot.set);
});
