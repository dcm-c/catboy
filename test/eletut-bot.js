// Játékbot a szimulációs tesztekhez és a hangoláshoz.
'use strict';
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

// ---------- Bot ----------
const SKILL_ORDER = {
    social: ['smink', 'varras', 'angol'],
    career: ['angol', 'prog'],
    creator: ['rajz', 'varras', 'stream', 'angol'],
    idle: [],
    gambler: ['angol'],
    homebody: ['angol'],
    cosy: ['angol', 'rajz']
};

function chooseEvent(s, policy, log) {
    const view = E.eventView(s);
    if (view.result === null) {
        let idx = view.choices.findIndex((c) => c.enabled);
        const pref = (policy.prefer || {})[view.id];
        if (pref) {
            const i = view.choices.findIndex((c) => c.enabled && c.label.indexOf(pref) >= 0);
            if (i >= 0) idx = i;
        }
        if (view.id.startsWith('g_') && policy.gamble) {
            const i = view.choices.findIndex((c) => c.enabled && /Visszaforgatod|Elütöd|Kipróbálod|Egyedül/.test(c.label));
            if (i >= 0) idx = i;
        }
        assert.ok(idx >= 0, 'nincs választható opció: ' + view.id);
        assert.ok(E.choose(s, idx), 'a választás elbukott: ' + view.id);
        log.push(view.id);
    }
    E.closeEvent(s);
}

function shop(s, policy) {
    const d = E.derive(s);
    const reserve = (d.costs.total * 3) + (policy.gamble ? 20000 : 0);
    // lépések
    D.STEPS.forEach((st) => { if (policy.steps !== false) E.buyStep(s, st.id); });
    if (E.isSecret(s) && policy.hide) D.HIDEOUT.forEach((h) => { if (s.money > h.cost + 3000) E.buyHideout(s, h.id); });
    // gép
    const next = E.nextComputer(s);
    const compCap = policy.compCap === undefined ? 6 : policy.compCap;
    if (next && s.comp < compCap && s.money > next.cost + reserve) E.buyComputer(s);
    // ruhák: a legjobb "click/ár" arányú darabok
    if (policy.wardrobe !== false) {
        D.ITEMS.slice().sort((a, b) => a.cost - b.cost).forEach((it) => {
            if (!s.items[it.id] && s.money > E.price(s, it.cost) + reserve) {
                E.buyItem(s, it.id);
                const cur = s.equipped[it.slot] && D.find(D.ITEMS, s.equipped[it.slot]);
                if (!cur || it.click > cur.click) E.equip(s, it.slot, it.id);
            }
        });
        D.DECOR.forEach((x) => { if (!s.decor[x.id] && s.money > E.price(s, x.cost) + reserve) E.buyDecor(s, x.id); });
        if (!s.pets.cica && policy.pet && s.money > 40000 + reserve) E.buyPet(s, 'cica');
    }
    // rejtőzés
    if (E.isSecret(s) && policy.hide) {
        if (s.risk > 60 && !s.hiding) E.toggleHiding(s);
        else if (s.risk < 20 && s.hiding) E.toggleHiding(s);
    }
    // képességek
    const order = SKILL_ORDER[policy.name] || [];
    if (!s.activeSkill || E.canStudy(s, s.activeSkill).ok === false) {
        s.activeSkill = null;
        for (const id of order) { if (E.canStudy(s, id).ok) { s.activeSkill = id; break; } }
    }
    // állás
    if (policy.work !== false) {
        let best = null;
        D.JOBS.forEach((j) => { if (E.canHire(s, j.id).ok && (!best || j.pay > best.pay)) best = j; });
        const cur = s.job && D.find(D.JOBS, s.job);
        if (best && (!cur || best.pay > cur.pay) && best.id !== s.job) E.hire(s, best.id);
    }
    // költözés
    if (policy.move) {
        const order2 = D.HOUSING.slice().sort((a, b) => b.comfort - a.comfort);
        for (const h of order2) {
            if (h.id === 'szulo' || h.id === s.housing) continue;
            if (D.find(D.HOUSING, s.housing).comfort >= h.comfort) continue;
            if (!E.canMove(s, h.id).ok) continue;
            const dd = E.derive(s);
            const after = dd.income.total - (h.rent + h.living + D.COMPUTERS[s.comp].upkeep);
            if (after > 20000 && s.money >= h.deposit + (h.rent + h.living) * 3) { E.move(s, h.id); break; }
        }
    }
    // kaszinó
    if (policy.gamble && E.casinoState(s).open) {
        E.setGambleLimit(s, 0);
        for (let i = 0; i < 3; i++) { if (s.money > 30000) E.playSlot(s, 5000); }
    }
}

function runBot(policy, seed, opts) {
    opts = opts || {};
    E.setRng(mulberry32(seed));
    const s = E.newState({ name: 'Bot' });
    const log = [];
    E.showEvent(s, Ev.find('ch1'));
    let it = 0, acc = 0;
    const dt = 0.5;
    while (!s.ending && it++ < 20000) {
        if (s.event) { chooseEvent(s, policy, log); continue; }
        if (policy.clicks) {
            acc += policy.clicks;
            while (acc >= 1) { E.clickMirror(s); acc--; }
            if (policy.work !== false) { while (s.energy > 30) E.clickWork(s); }
            if (s.activeSkill && s.energy >= 3) E.clickStudy(s);
        }
        if (it % 6 === 0) shop(s, policy);
        E.tick(s, dt);
        if (opts.onTick) opts.onTick(s);
    }
    return { s, log, iterations: it };
}

const POLICIES = {
    social: { name: 'social', clicks: 2, hide: true, move: true, pet: true, prefer: { e_adult: 'Munkát' }, compCap: 3 },
    career: { name: 'career', clicks: 2, hide: true, move: true, prefer: { e_adult: 'Munkát' }, compCap: 3 },
    creator: { name: 'creator', clicks: 2, hide: true, move: true, pet: true, prefer: { e_adult: 'Egyetemre' }, compCap: 5 },
    idle: { name: 'idle', clicks: 0, steps: false, wardrobe: false, work: false },
    gambler: { name: 'gambler', clicks: 2, gamble: true, move: true, hide: true, compCap: 2 },
    homebody: { name: 'homebody', clicks: 2, hide: false, move: false, prefer: { e_adult: 'Egyetemre', e_dinner: 'Elmondod', e_dinner2: 'Elmondod' }, compCap: 2 },
    cosy: { name: 'cosy', clicks: 2, hide: true, move: true, pet: true, prefer: { e_adult: 'Munkát' }, compCap: 3 }
};


module.exports = { runBot, POLICIES, mulberry32, SKILL_ORDER };
