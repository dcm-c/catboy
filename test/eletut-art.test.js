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
require(path.join(pub, 'eletut-assets.js'));
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

test('minták és feliratok: minden minta minden megengedett helyen hibátlan, a jelmezek felülírják a ruhát', () => {
    for (const p of D.PATTERNS) for (const slot of p.slots) {
        const out = { top: 'feliratos', bottom: 'szoknya', legs: 'combzokni' };
        const svg = C.avatar({ outfit: out, patterns: { [slot]: { id: p.id, color: '#3b2d4a' } }, uid: 'p' });
        check(svg, `minta ${p.id}/${slot}`);
        if (!p.kind) assert.ok(svg.includes('-pt-' + slot), `${p.id}: a ${slot} helyen nincs minta`);
    }
    // a felirat szövege a rajzban van, és biztonságosan kerül bele
    const t = C.avatar({ outfit: { top: 'feliratos' }, patterns: { top: { id: 'sl_arch', color: null } }, uid: 'q' });
    assert.ok(t.includes('>ARCH BTW</text>'));
    // alapértelmezett minta (patterns nélkül): a csíkos combzokni csíkos
    assert.ok(C.avatar({ outfit: { legs: 'csikoscomb' }, uid: 'r' }).includes('-pt-legs'));
    // a "patterns: {}" kifejezetten egyszínű
    assert.ok(!C.avatar({ outfit: { legs: 'csikoscomb' }, patterns: {}, uid: 'r' }).includes('-pt-legs'));
    // érvénytelen minta vagy hely nem kerül a rajzba
    assert.ok(!C.avatar({ outfit: { top: 'polo' }, patterns: { top: { id: 'nincs', color: 'x' } }, uid: 's' }).includes('-pt-'));
    assert.ok(!C.avatar({ outfit: { shoes: 'platform' }, patterns: { shoes: { id: 'stripe', color: null } }, uid: 's' }).includes('-pt-'));
    // nyomtatott grafika csak a felirat-pólón (tee) jelenik meg
    assert.ok(!C.avatar({ outfit: { top: 'polo' }, patterns: { top: { id: 'g_cat', color: null } }, uid: 's' }).includes('NaN'));
    // jelmezek
    for (const it of D.ITEMS.filter(x => x.slot === 'cosplay')) {
        const a = C.avatar({ outfit: { cosplay: it.id, top: 'pulcsi', bottom: 'jogger', legs: 'zokni', shoes: 'csizma' }, mood: 'happy', uid: 'c' });
        check(a, 'jelmez ' + it.id);
        assert.equal(a, C.avatar({ outfit: { cosplay: it.id }, mood: 'happy', uid: 'c' }), it.id + ': a viselt ruha nem takarhat a jelmezen');
        check(C.avatar({ outfit: { cosplay: it.id, hair: 'parokni' }, uid: 'w' }), 'jelmez + paróka ' + it.id);
        check(A.thumb('cosplay', it.id, { skin: 's2' }), 'jelmez-miniatűr ' + it.id);
    }
});

test('minta-választás vásárláskor: csak a megengedett, tárolódik, utólag nem módosítható', () => {
    const s = E.newState({ name: 'T' }); s.money = 1e7;
    assert.equal(E.buyItem(s, 'polo', { pat: 'sl_uwu' }).ok, false, 'felirat csak a feliratos pólón');
    assert.equal(E.buyItem(s, 'platform', { pat: 'stripe' }).ok, false, 'cipő nem mintázható');
    assert.equal(E.buyItem(s, 'csikoscomb', { pat: 'g_cat' }).ok, false, 'combzokni nem kaphat nyomtatott grafikát');
    assert.equal(E.buyItem(s, 'csikoscomb', { pat: 'dots', patColor: 'nincsilyen' }).ok, false);
    assert.equal(E.buyItem(s, 'feliratos', { pat: 'rainbow', patColor: 'piros' }).ok, false, 'rögzített színű minta színe nem választható');
    assert.equal(s.money, 1e7, 'hibás választásnál nem von le pénzt');
    assert.ok(!s.items.feliratos && !s.items.csikoscomb);
    // alapminta választás nélkül
    const d = E.newState({ name: 'D' }); d.money = 1e7;
    assert.ok(E.buyItem(d, 'feliratos').ok);
    assert.equal(E.patOf(d, 'feliratos').id, 'sl_nyau', 'alapminta');
    // választott minta
    assert.ok(E.buyItem(s, 'feliratos', { pat: 'sl_uwu' }).ok);
    assert.equal(E.patOf(s, 'feliratos').id, 'sl_uwu');
    assert.ok(E.buyItem(s, 'csikoscomb', { pat: null }).ok);
    assert.equal(E.patOf(s, 'csikoscomb'), null, 'kifejezetten egyszínű');
    assert.ok(E.buyItem(s, 'szivarvanyzokni', { pat: 'dots', patColor: 'piros' }).ok);
    assert.equal(E.patOf(s, 'szivarvanyzokni').id, 'dots');
    assert.equal(E.patOf(s, 'szivarvanyzokni').color, '#e8607a');
    s.equipped.top = 'feliratos'; s.equipped.legs = 'szivarvanyzokni';
    const pats = E.outfitPats(s);
    assert.equal(pats.top.id, 'sl_uwu'); assert.equal(pats.legs.id, 'dots');
    const r = E.deserialize(E.serialize(s));
    assert.equal(E.patOf(r, 'szivarvanyzokni').id, 'dots');
    assert.equal(E.patOf(r, 'feliratos').id, 'sl_uwu');
    // rongyolt mentés nem dönti el
    const bad = JSON.parse(E.serialize(s)); bad.pats = { feliratos: 'x', csikoscomb: { p: 5, a: {} } };
    const rb = E.deserialize(JSON.stringify(bad));
    assert.ok(rb && E.patOf(rb, 'feliratos') !== undefined);
});

test('szín-, minta- és felirat-bónuszok a viselt ruhákból', () => {
    const base = E.newState({ name: 'B' }); base.money = 1e7;
    const none = E.stats(base).total;
    // szín: a rózsa +2 cukiság viselve, de csak ha fel is van véve
    const a = E.newState({ name: 'A' }); a.money = 1e7;
    assert.ok(E.buyItem(a, 'polo', { color: 'rozsa' }).ok);
    const ids = E.stats(a);
    assert.equal(ids.looks.parts.length >= 1, true);
    a.equipped = {};
    assert.equal(E.lookBonuses(a).total.cute || 0, 0, 'nem viselt darab nem számít');
    a.equipped.top = 'polo';
    assert.ok((E.lookBonuses(a).total.cute || 0) >= 2);
    // különböző színválasztás különböző bónusz
    const b = E.newState({ name: 'B2' }); b.money = 1e7;
    E.buyItem(b, 'polo', { color: 'piros' }); b.equipped.top = 'polo';
    assert.ok((E.lookBonuses(b).total.chaos || 0) >= 2 && !(E.lookBonuses(b).total.cute));
    // felirat-párosítás: ARCH BTW + Arch gép
    const c = E.newState({ name: 'C' }); c.money = 1e7;
    E.buyItem(c, 'feliratos', { pat: 'sl_arch' }); c.equipped.top = 'feliratos';
    const code0 = E.lookBonuses(c).total.code || 0;
    E.buyItem(c, 'arch'); c.equipped.gear = 'arch';
    const lb = E.lookBonuses(c);
    assert.ok(lb.synergies.find(x => x.syn.id === 'f_arch').active, 'felirat + Arch gép párosítás');
    assert.ok((lb.total.code || 0) >= code0 + 6);
    // monokróm szett: 3 azonos színű darab
    const m = E.newState({ name: 'M' }); m.money = 1e7;
    E.buyItem(m, 'polo', { color: 'menta' }); E.buyItem(m, 'jogger', { color: 'menta' }); E.buyItem(m, 'zokni', { color: 'menta' });
    m.equipped.top = 'polo'; m.equipped.bottom = 'jogger'; m.equipped.legs = 'zokni';
    assert.ok(E.lookBonuses(m).synergies.find(x => x.syn.id === 'monokrom').active, 'monokróm');
    // titkolózás: a feltűnő felirat kockázatot jelent, rejtőzéskor nem látszik
    const t = E.newState({ name: 'T' }); t.money = 1e7;
    E.buyItem(t, 'feliratos', { pat: 'sl_femboy' }); t.equipped.top = 'feliratos';
    assert.ok(E.lookBonuses(t).risk >= 4);
    t.hiding = true;
    if (E.isSecret(t)) { assert.equal(E.lookBonuses(t).risk, 0, 'elrejtve nincs kockázat'); }
    assert.ok(none.cute === 0);
});

// ---- hangulatok, pózok, szemformák, szoba-állapotok ----
const BASE = { skin: 's2', hairStyle: 'bob', hairColor: 'rozsa' };
const MOODS = ['neutral', 'happy', 'proud', 'worried', 'sad', 'shy', 'surprised', 'sleepy', 'sleep'];
const POSES = ['idle', 'wave', 'hips', 'sit', 'phone'];

test('minden hangulat, póz és szemforma érvényes rajzot ad, és látszik a különbség', () => {
    const seen = new Set();
    MOODS.forEach((m, i) => { const svg = C.avatar(Object.assign({ mood: m, uid: 'm' + i }, BASE)); check('<svg>' + svg + '</svg>', 'hangulat ' + m); seen.add(svg.replace(/m\d+/g, '')); });
    assert.equal(seen.size, MOODS.length, 'minden hangulat más rajz');
    const poses = new Set();
    POSES.forEach((p, i) => { const svg = C.avatar(Object.assign({ pose: p, uid: 'p' + i }, BASE)); check('<svg>' + svg + '</svg>', 'póz ' + p); poses.add(svg.replace(/p\d+/g, '')); });
    assert.equal(poses.size, POSES.length, 'minden póz más rajz');
    const eyes = new Set();
    D.EYE_STYLES.forEach((e, i) => { const svg = C.avatar(Object.assign({ eyes: e.id, mood: 'neutral', uid: 'e' + i }, BASE)); check('<svg>' + svg + '</svg>', 'szem ' + e.id); eyes.add(svg.replace(/e\d+/g, '')); });
    assert.equal(eyes.size, D.EYE_STYLES.length, 'minden szemforma más rajz');
    // ismeretlen póz / szemforma nem dönt el semmit
    check('<svg>' + C.avatar(Object.assign({ pose: 'nincsilyen', eyes: 'x', uid: 'z' }, BASE)) + '</svg>', 'ismeretlen');
});

test('a szoba alvó, ülő, álmos és évszakos állapotai érvényesek', () => {
    const states = [{ sleeping: true }, { pose: 'sit', studying: true }, { mood: 'sleepy' }, { mood: 'happy', fx: true }, { mood: 'sad', fx: true }];
    for (const h of ['szoba', 'garzon', 'lakas']) for (let month = 0; month < 12; month += 3) for (const st of states) {
        const svg = A.room(Object.assign({}, BASE, { outfit: {}, housing: h, month, decor: {}, pets: {}, scale: 1, uid: 'r' }, st));
        check(svg, 'szoba ' + h + ' ' + month + ' ' + JSON.stringify(st));
        assert.ok(!/(width|height)="-/.test(svg), 'negatív méret: ' + h + ' ' + month);
    }
});

test('az esemény-hangulat bekerül a nézetbe, a mentés megőrzi a szemformát', () => {
    const s = E.newState({ eyeStyle: 'macska' });
    assert.equal(s.eyeStyle, 'macska');
    assert.equal(E.newState({ eyeStyle: 'nincs' }).eyeStyle, 'kerek');
    assert.equal(E.deserialize(E.serialize(s)).eyeStyle, 'macska');
    assert.equal(A.viewOf(s).eyeStyle, 'macska');
    assert.ok(global.MFSZ.events.EVENTS.filter(e => e.mood).length >= 10, 'az események hangulatot kapnak');
    const withMood = global.MFSZ.events.EVENTS.filter(e => e.mood);
    withMood.forEach(e => assert.ok(MOODS.includes(e.mood), e.id + ': ismeretlen hangulat'));
});

// ---- pillanatkép (hash) regresszió: a rajzok véletlen megváltozását jelzi ----
// Szándékos rajzmódosítás után: UPDATE_SNAPSHOTS=1 node test/eletut-art.test.js
test('a rajzok pillanatkép-hash-e nem változott', () => {
    const crypto = require('node:crypto'), fs = require('node:fs');
    const h = (svg) => crypto.createHash('sha1').update(svg).digest('hex').slice(0, 12);
    const snap = {};
    MOODS.forEach(m => { snap['mood:' + m] = h(C.avatar(Object.assign({ mood: m, uid: 's' }, BASE))); });
    POSES.forEach(p => { snap['pose:' + p] = h(C.avatar(Object.assign({ pose: p, uid: 's' }, BASE))); });
    D.EYE_STYLES.forEach(e => { snap['eyes:' + e.id] = h(C.avatar(Object.assign({ eyes: e.id, uid: 's' }, BASE))); });
    D.HAIR_STYLES.forEach(x => { snap['hair:' + x.id] = h(C.avatar(Object.assign({}, BASE, { hairStyle: x.id, uid: 's' }))); });
    D.ITEMS.forEach(it => { snap['item:' + it.id] = h(A.thumb(it.slot, it.id, {})); });
    D.BEAUTY.forEach(b => { snap['beauty:' + b.id] = h(A.beautyThumb(b.slot, b.id, {})); });
    A.SCENES.forEach(id => { snap['scene:' + id] = h(A.scene(id, Object.assign({}, BASE, { outfit: {}, mood: 'neutral', uid: 's' }))); });
    [{ month: 2 }, { month: 8, housing: 'garzon' }, { month: 11, housing: 'lakas', sleeping: true }, { month: 5, pose: 'sit', studying: true }].forEach((v, i) => {
        snap['room:' + i] = h(A.room(Object.assign({}, BASE, { outfit: {}, housing: 'szoba', decor: {}, pets: {}, scale: 1, uid: 's' }, v)));
    });
    const file = path.join(__dirname, 'eletut-art.snapshot.json');
    if (process.env.UPDATE_SNAPSHOTS || !fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(snap, null, 1) + '\n'); return; }
    const old = JSON.parse(fs.readFileSync(file, 'utf8'));
    const diff = Object.keys(Object.assign({}, old, snap)).filter(k => old[k] !== snap[k]);
    assert.deepEqual(diff, [], 'megváltozott rajzok: ' + diff.slice(0, 12).join(', ') + (diff.length > 12 ? ' … (+' + (diff.length - 12) + ')' : '') + ' – ha szándékos: UPDATE_SNAPSHOTS=1');
});

test('az energiát igénylő választás (pl. közös játékest) energia nélkül nem érhető el', () => {
    const ev = global.MFSZ.events.find('r_gamenight');
    const s = E.newState({}); s.flags.discord = true; s.comp = 3; s.month = 40;
    s.energy = 10;
    assert.equal(ev.when(s), false, 'kevés energiával fel sem ajánlja');
    s.energy = 60;
    assert.equal(ev.when(s), true);
    s.event = { id: 'r_gamenight', title: 't', text: 'x', art: 'discord', result: null };
    s.energy = 20;
    const v = E.eventView(s);
    assert.equal(v.choices[0].enabled, false);
    assert.match(v.choices[0].reqText, /30 energia/);
    assert.equal(E.choose(s, 0), false, 'a motor sem engedi');
    assert.equal(s.energy, 20);
    s.energy = 30;
    assert.equal(E.eventView(s).choices[0].enabled, true);
    assert.equal(E.choose(s, 0), true);
});

// ---- szoba-elrendezés: semmi sem lóg, semmi sem fedi egymást ----
test('a szoba tárgyai minden lakásban és felszereltséggel külön helyen állnak (nincs átfedés)', () => {
    const hits = [];
    const housings = ['szulo', 'kolesz', 'szoba', 'garzon', 'lakas'];
    const allDecor = { poszter: 1, zaszlo: 1, ledfeny: 1, agytakaro: 1, novenyek: 1, tukor: 1, polc: 1, lava: 1, dobozok: 1 };
    const packs = [{}, { gear: 'kbd', drink: 'matcha', buddy: 'blahaj' }, { gear: 'konzol', drink: 'monster', buddy: 'army' }, { gear: 'arch', drink: 'monster', buddy: 'sun' }];
    const hit = (a, b) => a.x0 < b.x1 - 0.01 && b.x0 < a.x1 - 0.01 && a.y0 < b.y1 - 0.01 && b.y0 < a.y1 - 0.01;
    for (const h of housings) for (let comp = 0; comp <= 6; comp++) for (const pack of packs) for (const flags of [{}, { studying: true, working: true }, { sleeping: true }]) {
        const v = Object.assign({}, BASE, { housing: h, comp, decor: allDecor, pack, pets: { cica: true }, outfit: {}, scale: 1 }, flags);
        const boxes = A.roomBoxes(v);
        const groups = {};
        boxes.forEach(b => { (groups[b.group] = groups[b.group] || []).push(b); });
        // csoportonként páronként: nem érhetnek egymásba
        for (const g of ['wall', 'floor', 'bed', 'chair']) for (let i = 0; i < (groups[g] || []).length; i++) for (let j = i + 1; j < groups[g].length; j++) {
            const a = groups[g][i], b = groups[g][j];
            if (g === 'floor' && (a.id === 'asztal' || b.id === 'asztal') && ['tukor'].includes(a.id === 'asztal' ? b.id : a.id)) { if (!hit(a, b)) continue; }
            if (hit(a, b)) hits.push(h + '/c' + comp + ' ' + g + ': ' + a.id + ' × ' + b.id);
        }
        // asztallap: a kellékek sora nem érhet a toronyhoz/mikrofonhoz és a lávalámpához, és az elemek nem érhetnek egymásba
        const front = (groups.deskfront || []), blocks = (groups['deskfront-block'] || []).concat((groups.desktop || []).filter(b => b.id === 'lava'));
        for (let i = 0; i < front.length; i++) {
            blocks.forEach(b => { if (hit(front[i], b)) hits.push(h + '/c' + comp + ' asztal: ' + front[i].id + ' × ' + b.id); });
            for (let j = i + 1; j < front.length; j++) if (hit(front[i], front[j])) hits.push(h + '/c' + comp + ' asztal: ' + front[i].id + ' × ' + front[j].id);
            if (front[i].x0 < 8 || front[i].x1 > 160) hits.push(h + '/c' + comp + ' asztal: ' + front[i].id + ' lelóg az asztalról');
        }
        // a gép és a lámpa az asztallapon belül van
        (groups.desktop || []).forEach(b => { if (b.x0 < 8 - 0.01 || b.x1 > 160 + 0.01) hits.push(h + '/c' + comp + ' asztal: ' + b.id + ' kilóg az asztalból'); });
        const lava = (groups.desktop || []).find(b => b.id === 'lava'), comp0 = (groups.desktop || []).find(b => b.id === 'computer');
        if (lava && comp0 && hit(lava, comp0)) hits.push(h + '/c' + comp + ' asztal: lava × gép');
    }
    assert.deepEqual([...new Set(hits)].slice(0, 20), [], 'átfedő tárgyak');
});

test('katonai ruhák: terepminta, taktikai mellény, cargo, barett, dögcédula és a terepruha-bónusz', () => {
    const a = C.avatar({ outfit: { top: 'taktikai', bottom: 'cargo', hair: 'barett', neck: 'dogtag', shoes: 'bakancs' }, patterns: { bottom: { id: 'camo', color: null } }, uid: 'm' });
    assert.ok(!a.includes('NaN') && !a.includes('undefined'));
    assert.ok(a.includes('-pt-bottom'), 'a cargo terepmintás');
    for (const id of ['taktikai', 'terepolo', 'cargo', 'barett', 'dogtag']) assert.ok(D.find(D.ITEMS, id), id + ' létezik');
    // ülve is jó (a cargo a rövidülő nadrágok közé tartozik)
    assert.ok(!C.avatar({ outfit: { bottom: 'cargo' }, pose: 'sit', uid: 'm' }).includes('NaN'));
    // két terepmintás darab: terepruha-bónusz
    const s = E.newState({ name: 'T' }); s.money = 1e7;
    for (const id of ['terepolo', 'cargo']) { assert.ok(E.buyItem(s, id).ok, id); E.equip(s, D.find(D.ITEMS, id).slot, id); }
    const syn = E.lookBonuses(s).synergies.find(x => x.syn.id === 'terep');
    assert.ok(syn && syn.active, 'terepruha aktív');
    // szett-kombó: mellény + cargo + barett
    const t = E.newState({ name: 'U' }); t.money = 1e7;
    for (const id of ['taktikai', 'cargo', 'barett']) { assert.ok(E.buyItem(t, id).ok, id); E.equip(t, D.find(D.ITEMS, id).slot, id); }
    assert.ok(E.comboActive(D.find(D.COMBOS, 'taktszett'), E.activeIds(t)), 'taktikai szett aktív');
});

test('az ablak nappal-éjszaka ciklusa csak az élő (fx) nézetben van, a statikus rajz változatlan', () => {
    const base = { housing: 'lakas', decor: {}, month: 3 };
    const still = A.room(base), live = A.room(Object.assign({ fx: true, clock: 50 }, base));
    assert.ok(!still.includes('nightsky') && !still.includes('class="fall'));
    for (const c of ['nightsky', 'moonmove', 'sunmove', 'veil', 'fall', 'bird']) assert.ok(live.includes('class="' + c) || live.includes(c + '"'), c);
    assert.ok(!live.includes('NaN'));
    // ugyanaz az óra ugyanazt a fázist adja
    assert.equal(A.room(Object.assign({ fx: true, clock: 50 }, base)), live);
});
