// Smink és társas élet: termékek, színek, mentés/betöltés, kötelékek, interakciók.
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
function fresh() { const s = E.newState({ name: 'T' }); s.money = 5e6; s.energy = 100; return s; }

test('smink: adatok épek (egyedi azonosító, ismert hely és szín, stat)', () => {
    const ids = new Set();
    D.BEAUTY.forEach((b) => {
        assert.ok(!ids.has(b.id), 'dupla azonosító: ' + b.id); ids.add(b.id);
        assert.ok(D.LOOK_SLOTS.find((s) => s.id === b.slot), b.id + ' ismeretlen hely');
        assert.ok(b.st && Object.keys(b.st).length, b.id + ' nincs stat');
        if (b.tone) assert.ok((D.LOOK_COLORS[b.slot] || []).length >= 4, b.id + ': nincs szín-paletta');
    });
    D.LOOK_SLOTS.forEach((sl) => assert.ok(D.BEAUTY.some((b) => b.slot === sl.id), sl.id + ' üres'));
    Object.keys(D.LOOK_COLORS).forEach((k) => D.LOOK_COLORS[k].forEach((c) => assert.match(c.color, /^#[0-9a-f]{6}$/i)));
});

test('smink: vásárlás, képességkapu, felhordás, szín, statok, rejtőzködés', () => {
    const s = fresh();
    assert.equal(E.buyBeauty(s, 'aj_ombre').ok, false, '1. szint kell');
    assert.match(E.buyBeauty(s, 'aj_ombre').reason, /szint/);
    assert.ok(E.buyBeauty(s, 'aj_matt').ok);
    assert.equal(s.look.lips.id, 'aj_matt', 'üres helyre automatikusan felkerül');
    assert.equal(E.buyBeauty(s, 'aj_matt').ok, false, 'dupla vásárlás');
    assert.ok(E.setLookColor(s, 'lips', 'bordo').ok);
    assert.equal(E.lookOf(s).lips.color, '#8e2a49');
    assert.equal(E.setLookColor(s, 'lashes', 'rozsa').ok, false, 'a pillának nincs színe');
    assert.ok(E.buyBeauty(s, 'pl_termeszetes').ok);
    assert.equal(E.stats(s).base.cute, 6 + 5);
    s.skills.smink = 3;
    assert.ok(E.beautyPrice(s, 10000) < 10000, 'a képesség csökkenti az árat');
    // rejtőzködés alatt a smink sem látszik, és nem ad statot
    s.out = false; s.housing = 'szulo'; s.hiding = true;
    assert.deepEqual(E.lookOf(s), {});
    assert.equal(E.stats(s).base.cute, 0);
    assert.equal(E.lookText(s), '');
    s.hiding = false;
    assert.match(E.lookText(s), /bordó matt rúzs/);
    // levétel és idegen termék
    assert.ok(E.applyBeauty(s, 'lips', null).ok);
    assert.equal(E.lookCount(s), 1);
    assert.equal(E.applyBeauty(s, 'lips', 'pi_anime').ok, false);
});

test('smink: teljes arc bónusz, kombó, kattintás-hatás, mentés és régi mentés átalakítása', () => {
    const s = fresh();
    s.skills.smink = 5;
    D.BEAUTY.forEach((b) => E.buyBeauty(s, b.id));
    ['aj_fenyes', 'pi_anime', 'sz_finom', 'ki_szarny', 'pl_also'].forEach((id) => E.applyBeauty(s, D.BEAUTY.find((b) => b.id === id).slot, id));
    s.out = true;
    const st = E.stats(s);
    assert.ok(st.fullLook, 'teljes arc');
    assert.ok(st.combos.find((c) => c.combo.id === 'animearc').active, 'anime arc kombó');
    const before = E.derive(s).clickConf;
    E.applyBeauty(s, 'lips', null);
    assert.ok(E.derive(s).clickConf < before, 'a smink növeli a kattintás-önbizalmat');
    // mentés
    const back = E.deserialize(E.serialize(s));
    assert.deepEqual(back.look, s.look);
    assert.deepEqual(back.beauty, s.beauty);
    // régi mentés: pir / smink tárgyak
    const old = JSON.parse(E.serialize(E.newState({ name: 'R' })));
    old.items = { pir: true, smink: true, polo: true }; old.equipped = { face: 'smink', top: 'polo' };
    const mig = E.deserialize(JSON.stringify(old));
    assert.ok(!mig.items.pir && !mig.items.smink && mig.items.polo);
    assert.equal(mig.equipped.face, undefined);
    assert.ok(mig.look.blush && mig.look.lips && mig.beauty.aj_fenyes);
});

test('barátok: megjelenés, kopás, perk csak a megszerzett kötelékből', () => {
    const s = fresh();
    const vis = () => E.people(s).filter((p) => p.unlocked).map((p) => p.person.id);
    assert.deepEqual(vis().sort(), ['csalad', 'lilla']);
    s.flags.discord = true; s.stats.cons = 1; s.job = 'fagyi';
    assert.deepEqual(vis().sort(), ['bence', 'csalad', 'kata', 'lilla', 'nori']);
    assert.equal(E.perks(s).passive, 0, 'alapkötelék nem ad perket');
    s.social.bond.lilla = 62;
    assert.ok(Math.abs(E.perks(s).passive - 0.08 * 50) < 1e-9);
    // Zsombor perkje csak párkapcsolatban
    s.month = 30; s.comm = 10;
    s.social.bond.zsombor = 60;
    const p0 = E.perks(s).passive;
    s.flags.partner = true;
    assert.ok(E.perks(s).passive > p0);
    // kopás: 4 hónap kapcsolat nélkül
    const t = fresh(); t.flags.discord = true;
    t.social.known = { lilla: true }; t.social.last.lilla = 0; t.social.bond.lilla = 40;
    t.month = 3; E.endMonth(t); assert.equal(t.social.bond.lilla, 40, 'még nem kopik');
    t.month = 4; E.endMonth(t); assert.equal(t.social.bond.lilla, 39);
    // az ismeretség megmarad, ha elveszíted az állást
    const u = fresh(); u.job = 'fagyi'; E.endMonth(u); u.job = null;
    assert.ok(E.personUnlocked(u, 'kata'));
});

test('interakciók: feltételek, költség, várakozás, hatások', () => {
    E.setRng(mulberry32(7));
    const s = fresh();
    assert.equal(E.canSocial(s, 'b_voice').ok, false, 'Bence még nincs');
    const r = E.doSocial(s, 'l_meet');
    assert.ok(r.ok && r.text && !/undefined|NaN/.test(r.text));
    assert.equal(s.money, 5e6 - 1500);
    assert.equal(s.energy, 86);
    assert.ok(E.bond(s, 'lilla') > 12);
    assert.match(E.canSocial(s, 'l_meet').reason, /hónapig/);
    s.month += 2;
    assert.ok(E.canSocial(s, 'l_meet').ok, 'a várakozás után újra elérhető');
    s.energy = 3;
    assert.match(E.canSocial(s, 'l_meet').reason, /energi/);
    // feltételek
    const t = fresh();
    assert.match(E.canSocial(t, 'l_makeup').reason, /smink/i);
    E.buyBeauty(t, 'aj_matt');
    assert.ok(E.canSocial(t, 'l_makeup').ok);
    assert.match(E.canSocial(t, 'l_secret').reason, /Kötelék/);
    t.social.bond.lilla = 30;
    assert.ok(E.canSocial(t, 'l_secret').ok, 'titkolózás alatt elérhető');
    t.risk = 50; E.doSocial(t, 'l_secret');
    assert.ok(t.risk < 50 && t.flags.lillaKnows);
    t.out = true; t.parents = 'tense'; t.month += 9; t.social.bond.lilla = 30;
    assert.match(E.canSocial(t, 'l_secret').reason, /titkolózás/);
    // szülők: őszinte beszélgetés
    t.social.bond.csalad = 50; t.energy = 100;
    assert.ok(E.canSocial(t, 'f_honest').ok);
    let n = 0;
    while (t.parents !== 'accepting' && n++ < 20) { E.doSocial(t, 'f_honest'); t.month += 7; t.energy = 100; }
    assert.equal(t.parents, 'accepting');
});

test('randi: a siker valószínűsége a kötelékkel és a külsővel nő, a párkapcsolat jelző beáll', () => {
    const rate = (bond, look) => {
        let ok = 0;
        for (let i = 0; i < 400; i++) {
            E.setRng(mulberry32(1000 + i));
            const s = fresh(); s.stats.cons = 0; s.comm = 10; s.month = 40;
            s.social.known = { zsombor: true }; s.social.bond.zsombor = bond;
            if (look) { s.skills.smink = 5; ['aj_matt', 'pi_anime', 'sz_finom', 'ki_finom', 'pl_termeszetes'].forEach((id) => E.buyBeauty(s, id)); }
            assert.ok(E.canSocial(s, 'z_date').ok, E.canSocial(s, 'z_date').reason);
            const r = E.doSocial(s, 'z_date');
            if (r.special === 'partner') { assert.ok(s.flags.partner); ok++; } else assert.equal(r.special, 'rejected');
        }
        return ok / 400;
    };
    const lo = rate(40, false), hi = rate(90, true);
    assert.ok(hi > lo + 0.2, 'magasabb kötelék + smink jobb esély: ' + lo + ' → ' + hi);
    // már együtt vagytok: nincs második randira hívás, de van közös este
    const s = fresh(); s.flags.partner = true; s.social.known = { zsombor: true }; s.social.bond.zsombor = 60;
    assert.match(E.canSocial(s, 'z_date').reason, /megtörtént/);
    assert.ok(E.canSocial(s, 'z_evening').ok);
});

test('társas adatok épek: minden interakció ismert személyhez tartozik, szövegek hiánytalanok', () => {
    const ids = new Set();
    D.SOCIAL.forEach((a) => {
        assert.ok(!ids.has(a.id), 'dupla: ' + a.id); ids.add(a.id);
        assert.ok(D.PEOPLE.find((p) => p.id === a.who), a.id + ' ismeretlen személy');
        assert.ok(a.text && a.great && a.text.length > 20 && a.great.length > 20, a.id + ' szöveg');
        assert.ok(a.cd >= 1 && a.energy > 0 && a.bond > 0, a.id + ' számok');
        if (a.skillPts) Object.keys(a.skillPts).forEach((k) => assert.ok(k === '_active' || D.SKILLS.find((x) => x.id === k), a.id + ' képesség'));
    });
    D.PEOPLE.forEach((p) => {
        assert.ok(D.SOCIAL.filter((a) => a.who === p.id).length >= 3, p.id + ' kevés interakció');
        assert.ok(p.meh.length >= 3 && p.perkText && p.role, p.id);
        Object.keys(p.look.outfit || {}).forEach((sl) => assert.ok(D.find(D.ITEMS, p.look.outfit[sl]), p.id + ' ruha: ' + p.look.outfit[sl]));
        Object.keys(p.look.makeup || {}).forEach((sl) => assert.ok(D.find(D.BEAUTY, p.look.makeup[sl].style), p.id + ' smink'));
    });
});

test('véletlen botok: a társas rendszer nem hoz NaN-t vagy kivételt', () => {
    for (let seed = 1; seed <= 6; seed++) {
        const rnd = mulberry32(seed * 77);
        E.setRng(mulberry32(seed));
        const s = fresh(); s.money = 200000; s.flags.discord = true;
        for (let m = 0; m < 130 && !s.ending; m++) {
            if (s.event) { E.choose(s, Math.max(0, E.eventView(s).choices.findIndex((c) => c.enabled))); E.closeEvent(s); }
            if (m % 7 === 0) s.job = s.job || (E.ageYears(s) >= 16 ? 'fagyi' : null);
            D.SOCIAL.forEach((a) => { if (rnd() < 0.4 && E.canSocial(s, a.id).ok) E.doSocial(s, a.id); });
            D.BEAUTY.forEach((b) => { if (rnd() < 0.05) { E.buyBeauty(s, b.id); if (rnd() < 0.5) E.applyBeauty(s, b.slot, b.id); } });
            s.energy = 100; s.money += 30000;
            E.endMonth(s);
            ['conf', 'money', 'comm', 'risk', 'energy'].forEach((k) => assert.ok(Number.isFinite(s[k]), k + ' NaN'));
            D.PEOPLE.forEach((p) => { const b = E.bond(s, p.id); assert.ok(b >= 0 && b <= 100, p.id + ' kötelék ' + b); });
        }
    }
});

test('társas események: minden döntés fut, a kötelék a határokon belül marad', () => {
    const evs = Ev.EVENTS.filter((e) => /^s_/.test(e.id));
    assert.equal(evs.length, 6);
    evs.forEach((ev) => {
        ev.choices.forEach((ch, i) => {
            E.setRng(mulberry32(5 + i));
            const s = fresh();
            s.month = 90; s.flags.discord = true; s.flags.partner = true; s.parents = 'accepting'; s.stats.cons = 2;
            ['lilla', 'bence', 'nori', 'csalad', 'zsombor', 'kata'].forEach((id) => { s.social.bond[id] = 98; });
            s.event = { id: ev.id, result: null };
            assert.equal(E.choose(s, i), true, ev.id + ' / ' + i);
            assert.ok(s.event.result.length > 20, ev.id + ' eredményszöveg');
            ['conf', 'money', 'comm', 'risk', 'energy'].forEach((k) => assert.ok(Number.isFinite(s[k]), ev.id + ' ' + k));
            assert.ok(E.bond(s, 'lilla') <= 100 && E.bond(s, 'zsombor') <= 100);
        });
    });
});

test('társas események: csak a feltételeik teljesülésekor jöhetnek', () => {
    const s = fresh(); s.month = 130;
    const c = E.ctx(s);
    const el = (id) => E.eligible(s, Ev.find(id), c);
    assert.ok(!el('s_partner_anniv'));
    assert.ok(!el('s_bence_mod'));
    s.flags.partner = true; s.social.bond.zsombor = 40;
    assert.ok(E.eligible(s, Ev.find('s_partner_anniv'), E.ctx(s)));
    s.flags.discord = true; s.social.bond.bence = 40;
    assert.ok(E.eligible(s, Ev.find('s_bence_mod'), E.ctx(s)));
    assert.ok(!E.eligible(s, Ev.find('e_date'), E.ctx(s)), 'van pár: nincs újabb randi-esemény');
});

test('eredmények: barátok, smink és pár', () => {
    const s = fresh();
    const ok = (id) => Ev.ACHIEVEMENTS.find((a) => a.id === id).check(s);
    assert.ok(!ok('sminkes') && !ok('baratok') && !ok('parom') && !ok('teljesarc'));
    s.social.bond.lilla = 60; assert.ok(ok('baratok'));
    s.flags.partner = true; assert.ok(ok('parom'));
    D.FULL_LOOK_SLOTS.forEach((sl) => {
        const b = D.BEAUTY.find((x) => x.slot === sl && !x.skill);
        E.buyBeauty(s, b.id); E.applyBeauty(s, sl, b.id);
    });
    assert.ok(ok('sminkes') && ok('teljesarc'));
    const n = D.BEAUTY.find((x) => x.slot === 'nails' && !x.skill);
    E.buyBeauty(s, n.id); E.applyBeauty(s, 'nails', n.id); assert.ok(ok('manikur'));
    s.skills.smink = 3; assert.ok(ok('kozmetikus'));
    const ids = Ev.ACHIEVEMENTS.map((a) => a.id); assert.equal(new Set(ids).size, ids.length);
});
