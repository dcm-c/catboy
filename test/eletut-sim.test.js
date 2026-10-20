// Pasztell Életút - szimulációs tesztek: a teljes játék lejátszása botokkal,
// a kaszinó matematikája, mentés/betöltés, az események elérhetősége.
// Futtatás:  node --test test/
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

global.MFSZ = {};
const pub = path.join(__dirname, '..', 'public');
const D = require(path.join(pub, 'eletut-data.js'));
const Ev = require(path.join(pub, 'eletut-events.js'));
const E = require(path.join(pub, 'eletut-engine.js'));
const { runBot, POLICIES } = require('./eletut-bot.js');

function checkSane(s) {
    for (const k of ['conf', 'money', 'energy', 'risk', 'comm', 'sec']) assert.ok(Number.isFinite(s[k]), k + ' nem szám');
    assert.ok(s.conf >= 0, 'negatív önbizalom');
    assert.ok(s.energy >= 0 && s.energy <= E.maxEnergy(s) + 1e-6, "az energia a változó felső határon belül van");
    assert.ok(s.risk >= 0 && s.risk <= 100);
}

// ---------------------------------------------------------
const results = {};

for (const name of Object.keys(POLICIES)) {
    test('teljes játék: ' + name, () => {
        const { s, log, iterations } = runBot(POLICIES[name], 1234);
        results[name] = { ending: s.ending && s.ending.id, money: Math.round(s.money), comm: Math.round(s.comm), conf: Math.round(s.conf), comp: s.comp, housing: s.housing, job: s.job, skills: JSON.stringify(s.skills), events: log.length, ach: Object.keys(s.ach).length, parents: s.parents, gamble: Math.round(s.gamble.paid - s.gamble.wagered), iterations };
        assert.ok(s.ending, 'a játék nem ért véget');
        assert.equal(s.month, D.MONTHS);
        checkSane(s);
        // mentés/betöltés körút
        const copy = E.deserialize(E.serialize(s));
        assert.ok(copy);
        assert.equal(copy.ending.id, s.ending.id);
        assert.equal(Math.round(copy.money), Math.round(s.money));
        // a befejezés megjeleníthető
        const view = Ev.endingView(s, E.ctx(s), E.derive(s));
        assert.ok(view.text.length > 100 && view.epilogue.length >= 3);
    });
}

test('az események láncai: a történeti események mind megjelennek egy aktív játékban', () => {
    const { s } = runBot(POLICIES.social, 99);
    const story = Ev.EVENTS.filter((e) => e.prio === 1 && !['e_discord2', 'e_dinner', 'e_dinner2', 'e_grad', 'e_nudge', 'e_stage'].includes(e.id));
    const missing = story.filter((e) => !s.seen[e.id]).map((e) => e.id);
    assert.deepEqual(missing, [], 'hiányzó történeti események: ' + missing.join(', '));
});

test('többféle befejezés elérhető', () => {
    const ends = new Set(Object.values(results).map((r) => r.ending));
    console.log('\nBefejezések:', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.ending])));
    assert.ok(ends.size >= 3, 'túl kevés különböző befejezés: ' + [...ends]);
});

test('összegző kimenet (hangolás)', () => {
    console.log('\n' + JSON.stringify(results, null, 1));
});
