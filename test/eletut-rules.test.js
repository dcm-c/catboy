// Pasztell Életút - szabályok: kaszinó, vásárlások, befejezések, mentés.
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

global.MFSZ = global.MFSZ || {};
const pub = path.join(__dirname, '..', 'public');
const D = require(path.join(pub, 'eletut-data.js'));
const Ev = require(path.join(pub, 'eletut-events.js'));
const E = require(path.join(pub, 'eletut-engine.js'));
const { mulberry32 } = require('./eletut-bot.js');

function adult() {
    const s = E.newState({ name: 'T' });
    s.month = 4 * 12 + 2; // 18 éves
    s.money = 1e12;
    s.gamble.limit = 0;
    return s;
}

// ---------- kaszinó ----------
test('kaszinó: 18 év alatt zárva', () => {
    const s = E.newState();
    s.money = 100000;
    assert.equal(E.casinoState(s).open, false);
    assert.equal(E.playSlot(s, 1000).ok, false);
    assert.equal(s.money, 100000, 'nem vonódhat le pénz');
});

test('kaszinó: a három játék várható megtérülése a ház javára dől, és a számolt érték egyezik a szimulációval', () => {
    const N = 300000;
    const stat = { scratch: 0, slot: 0, coin: 0 };
    E.setRng(mulberry32(42));
    const s = adult();
    for (let i = 0; i < N; i++) {
        stat.scratch += E.playScratch(s, 1000).payout / 1000;
        stat.slot += E.playSlot(s, 1000).payout / 1000;
        stat.coin += E.playCoin(s, 1000).payout / 1000;
    }
    const rtp = (k) => stat[k] / N;
    const exactSlot = (() => {
        const W = D.SLOT.symbols.reduce((a, x) => a + x.weight, 0);
        let ev = 0;
        D.SLOT.symbols.forEach((x) => { const p = x.weight / W; ev += p ** 3 * x.triple + 3 * p * p * (1 - p) * D.SLOT.pair; });
        return ev;
    })();
    const exactScratch = D.SCRATCH.outcomes.reduce((a, o) => a + o.p * o.mult, 0);
    const exactCoin = D.COIN.winP * D.COIN.mult;
    console.log('\nRTP: kaparós', rtp('scratch').toFixed(3), '/', exactScratch.toFixed(3), ' gép', rtp('slot').toFixed(3), '/', exactSlot.toFixed(3), ' érme', rtp('coin').toFixed(3), '/', exactCoin.toFixed(3));
    for (const v of [exactSlot, exactScratch, exactCoin]) assert.ok(v < 1 && v > 0.8, 'a megtérülésnek 0,8 és 1 között kell lennie: ' + v);
    assert.ok(Math.abs(rtp('scratch') - exactScratch) < 0.04);
    assert.ok(Math.abs(rtp('slot') - exactSlot) < 0.04);
    assert.ok(Math.abs(rtp('coin') - exactCoin) < 0.01);
});

test('kaparós: a nyerő sorsjegyen pontosan három azonos összeg van, a vesztesen nincs', () => {
    E.setRng(mulberry32(7));
    const s = adult();
    let wins = 0;
    for (let i = 0; i < 5000; i++) {
        const r = E.playScratch(s, 1000);
        const counts = {};
        r.cells.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
        const triples = Object.keys(counts).filter((k) => counts[k] >= 3);
        assert.equal(r.cells.length, 6);
        if (r.payout > 0) { wins++; assert.deepEqual(triples, [String(r.payout)]); assert.equal(counts[r.payout], 3); }
        else assert.deepEqual(triples, []);
    }
    assert.ok(wins > 800 && wins < 1700);
});

test('kaszinó: havi keret, önkizárás, pénzhiány', () => {
    E.setRng(mulberry32(3));
    const s = adult();
    s.money = 100000;
    E.setGambleLimit(s, 10000);
    assert.equal(E.playSlot(s, 5000).ok, true);
    assert.equal(E.playSlot(s, 5000).ok, true);
    const r = E.playSlot(s, 1000);
    assert.equal(r.ok, false);
    assert.match(r.reason, /keret/);
    assert.equal(E.setGambleLimit(s, 12345).ok, false);
    E.selfExclude(s);
    s.gamble.limit = 0;
    assert.equal(E.playCoin(s, 1000).ok, false);
    assert.equal(E.casinoState(s).locked, true);
    s.month += D.SELF_EXCLUDE_MONTHS + 1;
    assert.equal(E.casinoState(s).open, true);
    s.money = 500;
    assert.equal(E.playCoin(s, 1000).ok, false);
});

test('kaszinó: a vágy (urge) nő a veszteséggel, és a barát-esemény kiváltódik', () => {
    E.setRng(() => 0.99); // az érme mindig a vesztes oldalra esik
    const s = adult();
    s.money = 5e6;
    for (let i = 0; i < 12; i++) E.playCoin(s, 5000);
    assert.ok(s.gamble.urge >= 55, 'urge: ' + s.gamble.urge);
    const c = E.ctx(s);
    const ev = Ev.find('g_friend');
    assert.ok(c.netLoss >= 60000 && ev.trigger(s, c));
    E.setRng(null);
});

// ---------- vásárlások ----------
test('vásárlás: ruha, felvétel, kedvezmény, varrás-engedmény', () => {
    const s = E.newState();
    s.money = 100000;
    assert.equal(E.buyItem(s, 'polo').ok, true);
    assert.equal(s.equipped.top, 'polo');
    assert.equal(E.buyItem(s, 'polo').ok, false);
    const full = E.price(s, 10000);
    s.skills.varras = 4;
    assert.equal(E.price(s, 10000), 8000);
    s.saleUntil = s.month;
    assert.equal(E.price(s, 10000), 6400);
    assert.ok(full === 10000);
    assert.equal(E.equip(s, 'top', 'bluz').ok, false, 'nem birtokolt tárgy nem vehető fel');
    s.items.pulcsi = true;
    assert.equal(E.equip(s, 'top', 'pulcsi').ok, true);
    assert.equal(E.equip(s, 'hair', 'pulcsi').ok, false, 'rossz helyre nem vehető fel');
});

test('rejtőzés: csak titkolózás alatt, a bónusz csökken, a kockázat nem nő', () => {
    const s = E.newState();
    s.money = 1e6;
    E.buyItem(s, 'crop'); E.buyItem(s, 'szoknya');
    const open = E.derive(s);
    E.toggleHiding(s);
    const hid = E.derive(s);
    assert.ok(hid.clickConf < open.clickConf);
    assert.deepEqual(E.visibleOutfit(s), []);
    const r0 = s.risk;
    E.endMonth(s);
    assert.ok(s.risk <= r0, 'rejtőzés közben nem nőhet a kockázat');
    s.out = true;
    assert.equal(E.toggleHiding(s).ok, false);
});

test('kockázat: a rejtekhely csökkenti, a kitett ruhák növelik', () => {
    const a = E.newState(); a.money = 1e6; E.buyItem(a, 'crop'); E.buyItem(a, 'szoknya');
    const b = E.newState(); b.money = 1e6; E.buyItem(b, 'crop'); E.buyItem(b, 'szoknya'); E.buyHideout(b, 'fiok'); E.buyHideout(b, 'doboz');
    a.risk = b.risk = 30;
    E.setRng(() => 0.99);
    for (let i = 0; i < 4; i++) { E.endMonth(a); E.endMonth(b); a.event = b.event = null; }
    assert.ok(b.risk < a.risk);
    E.setRng(null);
});

test('munka, tanulás, költözés', () => {
    const s = adult();
    assert.equal(E.hire(s, 'web').ok, false, 'feltételek nélkül nem megy');
    s.skills.angol = 2;
    assert.equal(E.hire(s, 'ugyfel').ok, true);
    assert.equal(E.derive(s).income.job, D.find(D.JOBS, 'ugyfel').pay);
    s.student = true;
    assert.equal(E.hire(s, 'iroda').ok, false, 'hallgatóként nincs teljes állás');
    assert.equal(E.setActiveSkill(s, 'stream').ok, false, 'gép kell hozzá');
    assert.equal(E.setActiveSkill(s, 'varras').ok, true);
    const before = s.skillProg.varras || 0;
    E.tick(s, 1);
    assert.ok((s.skillProg.varras || 0) > before);
    s.money = 1e9; s.student = true;
    assert.equal(E.move(s, 'kolesz').ok, true);
    assert.equal(E.isSecret(s), false);
    assert.equal(E.move(s, 'szoba').ok, true);
    const d = E.derive(s);
    assert.equal(d.costs.rent, 60000);
    s.student = false;
    assert.equal(E.canMove(s, 'kolesz').ok, false, 'csak hallgatóknak');
});

test('élmények: költség, hatás, várakozás', () => {
    const s = adult();
    s.conf = 0;
    const r = E.doExperience(s, 'koncert');
    assert.equal(r.ok, true);
    assert.ok(s.conf >= 200);
    assert.equal(E.doExperience(s, 'koncert').ok, false, 'várakozási idő');
    assert.equal(E.canExperience(s, 'utazas').ok, false, 'angol 2 kell');
});

test('lakás: a cica nem fér be minden lakásba', () => {
    const s = adult();
    s.student = true;
    E.move(s, 'szoba');
    assert.equal(E.buyPet(s, 'cica').ok, true);
    s.student = true;
    E.move(s, 'kolesz');
    assert.equal(!!s.pets.cica, false);
});

// ---------- befejezések ----------
function endingFor(patch) {
    const s = adult();
    s.month = D.MONTHS;
    patch(s);
    E.finish(s);
    return s.ending.id;
}
test('befejezések: mindegyik elérhető és a feltétel szerint választódik', () => {
    assert.equal(endingFor((s) => { s.comm = 300; }), 'legenda');
    assert.equal(endingFor((s) => { s.job = 'senior'; s.skills = { prog: 5, angol: 3 }; s.comp = 3; }), 'karrier');
    assert.equal(endingFor((s) => { s.skills = { rajz: 5, varras: 4, stream: 0 }; }), 'alkoto');
    assert.equal(endingFor((s) => { s.flags.partner = true; s.housing = 'lakas'; s.parents = 'accepting'; }), 'otthon');
    assert.equal(endingFor((s) => { s.housing = 'szulo'; s.parents = 'accepting'; }), 'gyokerek');
    assert.equal(endingFor((s) => { s.housing = 'szoba'; }), 'csendes');
});

test('befejezés-nézet: az epilógus a viselt ruhákra, a gépre, a kaszinóra reagál', () => {
    const s = adult();
    s.month = D.MONTHS;
    s.items.macskaful = true; s.equipped.hair = 'macskaful';
    s.out = true;
    s.gamble.plays = 10; s.gamble.wagered = 100000; s.gamble.paid = 20000; s.flags.selfExcluded = true;
    E.finish(s);
    const v = Ev.endingView(s, E.ctx(s), E.derive(s));
    const all = v.epilogue.join(' ');
    assert.match(all, /macskafüles fejpánt/);
    assert.match(all, /családi gép/);
    assert.match(all, /kaszinóban/);
    assert.match(all, /Időben megálltál/);
});

// ---------- események ----------
test('események: szövegek az aktuális cuccokra reagálnak', () => {
    const s = E.newState();
    s.money = 1e6; s.out = true; // már nem titok
    E.buyItem(s, 'macskaful'); E.buyItem(s, 'szoknya');
    s.comp = 3;
    const c = E.ctx(s);
    assert.match(c.outfitText, /macskafüles fejpánt és plisszírozott szoknya/);
    assert.ok(Ev.find('r_catears').when(s, c), 'a cicafül-esemény elérhető');
    assert.ok(Ev.find('r_note_good').when(s, c));
    assert.ok(Ev.find('r_note_bad').when(s, c), 'a szoknya negatív megjegyzése is jöhet');
    const t = Ev.find('e_classmate').text(s, c);
    assert.match(t, /macskafüles fejpánt/);
    // titokban a "nyilvános" megjegyzések nem jöhetnek
    s.out = false;
    assert.equal(!!Ev.find('r_note_good').when(s, E.ctx(s)), false);
    assert.ok(Ev.find('e_hidden_find').when(s, E.ctx(s)), 'a titkos ruhák megtalálhatók');
});

test('események: minden esemény szövege és minden választása hibátlanul lefut', () => {
    E.setRng(mulberry32(11));
    for (const ev of Ev.EVENTS) {
        for (let variant = 0; variant < 3; variant++) {
            const s = adult();
            s.items.polo = true; s.equipped.top = 'polo';
            s.items.macskaful = true; s.equipped.hair = 'macskaful';
            if (variant === 1) { s.out = true; s.housing = 'szoba'; s.comp = 3; s.job = 'iroda'; s.flags.discord = true; s.skills = { varras: 2, stream: 1, rajz: 2 }; s.pets.cica = true; s.comm = 200; s.conf = 500; }
            if (variant === 2) { s.housing = 'lakas'; s.comp = 5; s.job = 'web'; s.flags.discord = true; s.comm = 50; s.conf = 20; s.money = 100; s.student = true; s.steps.utca = true; }
            const c = E.ctx(s);
            if (ev.when && !ev.when(s, c)) continue; // csak az elérhető változatokat vizsgáljuk
            const title = typeof ev.title === 'function' ? ev.title(s, c) : ev.title;
            const text = typeof ev.text === 'function' ? ev.text(s, c) : ev.text;
            assert.ok(title && text && !/undefined|NaN|\[object/.test(title + text), ev.id + ': ' + title + ' / ' + text);
            ev.choices.forEach((ch, i) => {
                const s2 = JSON.parse(JSON.stringify(s));
                s2.event = { id: ev.id, title, text, art: ev.art || 'room', result: null, link: null, picked: -1 };
                const ok = !ch.req || ch.req(s2, E.ctx(s2));
                if (!ok) return;
                assert.ok(E.choose(s2, i), ev.id + ' / ' + i);
                assert.ok(typeof s2.event.result === 'string' && !/undefined|NaN/.test(s2.event.result), ev.id + ' eredmény');
                ['conf', 'money', 'energy', 'risk', 'comm'].forEach((k) => assert.ok(Number.isFinite(s2[k]), ev.id + ' ' + k));
                E.closeEvent(s2);
            });
        }
    }
});

test('minden esemény art-azonosítója ismert jelenet', () => {
    const known = new Set(['room', 'phone', 'shop', 'family', 'work', 'school', 'discord', 'con', 'casino', 'moving', 'office', 'stage', 'sunset', 'cafe', 'friends', 'street', 'bills']);
    const bad = Ev.EVENTS.filter((e) => !known.has(e.art)).map((e) => e.id + ':' + e.art);
    assert.deepEqual(bad, []);
    Ev.ENDINGS.forEach((en) => assert.ok(known.has(en.art), en.id));
});

// ---------- mentés ----------
test('mentés: hibás vagy rosszindulatú bemenet nem töri meg a játékot', () => {
    assert.equal(E.deserialize('nem json'), null);
    assert.equal(E.deserialize('{"v":2}'), null);
    assert.equal(E.deserialize('null'), null);
    const evil = E.deserialize(JSON.stringify({ v: 1, name: '<img src=x onerror=alert(1)>', month: 'x', money: 'sok', conf: Infinity, comp: 99, housing: 'nincs', job: '../x', speed: 100, parents: 'h', hairColor: 'pink', event: { id: 'nincs' }, ending: { id: 'x' }, gamble: { limit: 5 } }));
    assert.ok(evil);
    assert.ok(!/[<>]/.test(evil.name));
    assert.equal(evil.month, 0);
    assert.equal(evil.comp, D.COMPUTERS.length - 1);
    assert.equal(evil.housing, 'szulo');
    assert.equal(evil.job, null);
    assert.equal(evil.speed, 1);
    assert.equal(evil.parents, 'unknown');
    assert.equal(evil.hairColor, 'rozsa');
    assert.equal(evil.event, null);
    assert.equal(evil.ending, null);
    assert.ok(Number.isFinite(evil.conf) && Number.isFinite(evil.money));
});

test('az energia felső határa változó: állandó és ideiglenes módosítók, lejárat, mentés', () => {
    const s = E.newState({ name: 'En' });
    assert.equal(E.maxEnergy(s), D.ENERGY_BASE, 'alapérték');
    s.decor.agytakaro = true;
    assert.ok(E.maxEnergy(s) >= D.ENERGY_BASE + D.find(D.DECOR, 'agytakaro').en, 'a kellék állandó bónusza');
    assert.ok(E.energyInfo(s).parts.some((p) => p.perm && p.en === D.find(D.DECOR, 'agytakaro').en));
    const base = E.maxEnergy(s);
    E.addMod(s, { id: 't1', label: 'Teszt', en: 20, months: 2 });
    assert.equal(E.maxEnergy(s), base + 20, 'ideiglenes bónusz');
    assert.ok(E.derive(s).energyMax === base + 20 && E.derive(s).energyParts.some((p) => p.temp && p.left === 2));
    // a tick a megnövelt határig tölt
    s.energy = base; s.paused = false; E.tick(s, 1);
    assert.ok(s.energy > base - 0.01);
    s.energy = base + 20;
    // hónapváltáskor a lejárt módosító eltűnik, az energia a határra csökken
    E.endMonth(s); assert.equal(E.maxEnergy(s), base + 20, '1 hónap még hátra');
    E.endMonth(s);
    assert.equal(E.maxEnergy(s), base, 'lejárt');
    assert.ok(s.energy <= base, 'az energia a határhoz igazodik');
    // ugyanazzal az azonosítóval a módosító frissül, nem halmozódik
    E.addMod(s, { id: 't2', label: 'A', en: 5 }); E.addMod(s, { id: 't2', label: 'A', en: 5 });
    assert.equal(E.maxEnergy(s), base + 5);
    // negatív módosító sem viheti a határt a minimum alá
    E.addMod(s, { id: 't3', label: 'B', en: -500 });
    assert.equal(E.maxEnergy(s), D.ENERGY_MIN);
    // a felső határ fölé nem lehet tölteni
    const q = E.newState({ name: 'Q' }); q.energy = 100;
    E.api(q).energy(50); assert.equal(q.energy, E.maxEnergy(q));
    // mentés
    const back = E.deserialize(E.serialize(s));
    assert.equal(E.maxEnergy(back), E.maxEnergy(s));
    assert.ok(back.mods.some((m) => m.id === 't2'));
});

test('számítógépes játékok: ingyenes és fizetős, energia, havi korlát, jártasság és ideiglenes stat', () => {
    const s = E.newState({ name: 'J' }); s.money = 1e6;
    const free = D.GAMES.filter((g) => g.cost === 0), paid = D.GAMES.filter((g) => g.cost > 0);
    assert.ok(free.length >= 3 && paid.length >= 4);
    assert.equal(E.buyGame(s, free[0].id).ok, false, 'az ingyenes már a tiéd');
    assert.equal(E.buyGame(s, 'retroplat').ok, false, 'laptop kell hozzá');
    s.comp = 1;
    const m0 = s.money;
    assert.ok(E.buyGame(s, 'retroplat').ok); assert.ok(s.money < m0);
    assert.equal(E.buyGame(s, 'retroplat').ok, false, 'dupla vásárlás');
    // játék: energia, önbizalom, ideiglenes módosító
    const e0 = s.energy, c0 = s.conf;
    const r = E.playGame(s, 'retroplat');
    assert.ok(r.ok && s.energy < e0 && s.conf > c0);
    assert.ok(E.activeMods(s).some((m) => m.id === 'g_retroplat'), 'ideiglenes hatás');
    assert.ok(E.stats(s).bonus.gamer >= 4, 'az ideiglenes stat bónuszként számít');
    assert.equal(E.playGame(s, 'retroplat').ok, false, 'havonta egyszer');
    // jártasság: 3 játék után 1. szint, állandó stat
    for (let i = 0; i < 3; i++) { s.month++; s.energy = E.maxEnergy(s); E.playGame(s, 'retroplat'); }
    assert.equal(E.gameLevel(s, 'retroplat'), 1);
    assert.ok(E.gameStats(s).gamer >= 2);
    assert.ok(E.stats(s).base.gamer >= 2, 'a jártasság az alap statba kerül');
    // energia nélkül nem megy
    s.month++; s.energy = 0; assert.equal(E.canPlay(s, 'retroplat').ok, false);
    // az ingyenes játék azonnal játszható
    const f = E.newState({ name: 'F' });
    assert.ok(E.playGame(f, 'pixelkert').ok);
    assert.ok(E.activeMods(f).some((m) => m.en > 0), 'a kikapcsolódás ideiglenesen növeli az energia-határt');
    // Discord-függő játék
    const d = E.newState({ name: 'D' }); d.comp = 3; d.money = 1e6; E.buyGame(d, 'arena');
    assert.equal(E.canPlay(d, 'arena').ok, false); d.flags.discord = true; assert.ok(E.canPlay(d, 'arena').ok);
    // mentés
    const back = E.deserialize(E.serialize(s));
    assert.equal(E.gameLevel(back, 'retroplat'), E.gameLevel(s, 'retroplat'));
});
