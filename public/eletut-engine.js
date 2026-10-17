// =========================================================
// PASZTELL ÉLETÚT - játékmotor
//
// Tiszta logika, DOM nélkül: a böngészőben az eletut.js hívja, Node-ban a tesztek.
// Az állapot (s) sima JSON-objektum, ezért közvetlenül menthető.
// Betöltési sorrend: eletut-data.js, eletut-events.js, eletut-engine.js
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var E = M.engine = {};

    var rng = Math.random;
    E.setRng = function (fn) { rng = fn || Math.random; };
    E.rand = function () { return rng(); };

    var WORK_ENERGY = 4;
    var STUDY_ENERGY = 3;
    var LOG_LIMIT = 150;
    var RANDOM_EVENT_CHANCE = 0.4;

    function clamp(n, a, b) { return n < a ? a : n > b ? b : n; }
    function find(list, id) { return D.find(list, id); }
    function num(v, def) { return typeof v === 'number' && isFinite(v) ? v : def; }
    function lcFirst(str) { return str ? str.charAt(0).toLowerCase() + str.slice(1) : str; }
    function az(str) { return /^[aeiouáéíóöőúüű]/i.test(str) ? 'az ' + str : 'a ' + str; }
    function joinList(list) {
        if (list.length <= 1) return list.join('');
        return list.slice(0, -1).join(', ') + ' és ' + list[list.length - 1];
    }
    E.az = az;
    E.joinList = joinList;
    E.lcFirst = lcFirst;

    // ---------------------------------------------------------
    // Állapot
    // ---------------------------------------------------------
    E.newState = function (opts) {
        opts = opts || {};
        var name = String(opts.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Nyau';
        return {
            v: 1,
            name: name,
            hairStyle: find(D.HAIR_STYLES, opts.hairStyle) ? opts.hairStyle : 'bob',
            hairColor: find(D.HAIR_COLORS, opts.hairColor) ? opts.hairColor : 'rozsa',
            skin: find(D.SKINS, opts.skin) ? opts.skin : 's2',

            month: 0, sec: 0,
            conf: 0, money: 3000, energy: 100,
            risk: 0, comm: 0,
            out: false, hiding: false, parents: 'unknown',
            student: false,

            steps: {}, items: {}, equipped: {}, colors: {}, hideout: {}, decor: {}, pets: {},
            beauty: {}, look: {}, social: { bond: {}, last: {}, cd: {} },
            comp: 0, skills: {}, skillProg: {}, activeSkill: null,
            housing: 'szulo', job: null, jobMonths: 0,
            debtMonths: 0, allowanceCut: 0, saleUntil: -1, brokenUntil: -1, rentBump: 0,
            lastCon: -99, expCd: {},

            gamble: { plays: 0, wagered: 0, paid: 0, urge: 0, monthSpent: 0, limit: D.GAMBLE_DEFAULT_LIMIT, lastBet: 0, lastPayout: 0, bigWin: false, lockUntil: -1, streak: 0 },

            flags: {}, seen: {}, lastSeen: {}, ach: {},
            event: null, ending: null,
            log: [],
            stats: { clicks: 0, workClicks: 0, studyClicks: 0, earned: 0, spent: 0, cons: 0 },
            speed: 1, paused: false
        };
    };

    E.ageFloat = function (s) { return D.START_AGE + (s.month + s.sec / D.MONTH_SECONDS) / 12; };
    E.ageYears = function (s) { return D.START_AGE + Math.floor(s.month / 12); };
    E.monthLabel = function (s) { return D.MONTH_NAMES[(D.START_CALENDAR_MONTH + s.month) % 12]; };
    E.isSecret = function (s) { return s.housing === 'szulo' && !s.out; };
    E.lvl = function (s, id) { return s.skills[id] || 0; };
    E.log = function (s, text) {
        s.log.push({ m: s.month, text: String(text) });
        if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
    };

    // ---------------------------------------------------------
    // Származtatott értékek
    // ---------------------------------------------------------
    E.price = function (s, cost) {
        var f = 1 - 0.05 * E.lvl(s, 'varras');
        if (s.saleUntil >= s.month) f *= 0.8;
        return Math.max(10, Math.round(cost * f / 10) * 10);
    };


    // ---------------------------------------------------------
    // Smink
    // ---------------------------------------------------------
    function hidden(s) { return E.isSecret(s) && s.hiding; }
    E.beautyPrice = function (s, cost) {
        var f = 1 - 0.04 * E.lvl(s, 'smink');
        if (s.saleUntil >= s.month) f *= 0.8;
        return Math.max(10, Math.round(cost * f / 10) * 10);
    };
    E.lookColors = function (slot) { return D.LOOK_COLORS[slot] || null; };
    // Az aktív termékek azonosítói (hely szerint), a rejtőzködés alatt üres
    E.lookApplied = function (s) {
        var out = {};
        if (hidden(s)) return out;
        D.LOOK_SLOTS.forEach(function (sl) { var a = s.look[sl.id]; if (a && s.beauty[a.id]) out[sl.id] = a.id; });
        return out;
    };
    E.lookCount = function (s) { return Object.keys(E.lookApplied(s)).length; };
    // Az avatárnak átadandó smink: {hely: {style, color}}
    E.lookOf = function (s) {
        var out = {}, ap = E.lookApplied(s);
        Object.keys(ap).forEach(function (slot) {
            var b = find(D.BEAUTY, ap[slot]), a = s.look[slot], col = null;
            if (b && b.tone) {
                var list = D.LOOK_COLORS[slot] || [];
                var c = find(list, a.color) || list[0];
                col = c ? c.color : null;
            }
            out[slot] = { style: ap[slot], color: col };
        });
        return out;
    };
    E.lookText = function (s) {
        var ap = E.lookApplied(s), parts = [];
        D.LOOK_SLOTS.forEach(function (sl) {
            var id = ap[sl.id], b = id && find(D.BEAUTY, id);
            if (!b) return;
            var nm = lcFirst(b.name);
            if (b.tone) { var c = find(D.LOOK_COLORS[sl.id] || [], s.look[sl.id].color) || (D.LOOK_COLORS[sl.id] || [])[0]; if (c) nm = lcFirst(c.label) + ' ' + nm; }
            parts.push(nm);
        });
        return parts.length ? joinList(parts.slice(0, 3)) : '';
    };
    E.buyBeauty = function (s, id) {
        var b = find(D.BEAUTY, id);
        if (!b) return { ok: false, reason: 'Ismeretlen termék' };
        if (s.beauty[id]) return { ok: false, reason: 'Ez már a tiéd' };
        if (b.skill && E.lvl(s, 'smink') < b.skill) return { ok: false, reason: 'Smink és stílus ' + b.skill + '. szint kell hozzá' };
        var cost = E.beautyPrice(s, b.cost);
        if (s.money < cost) return { ok: false, reason: 'Nincs elég pénzed' };
        s.money -= cost; s.stats.spent += cost;
        s.beauty[id] = true;
        if (!s.look[b.slot]) s.look[b.slot] = { id: id, color: null };
        if (E.isSecret(s)) s.risk = clamp(s.risk + b.risk * 0.5, 0, 100);
        E.log(s, 'Megvetted: ' + b.name + '.');
        return { ok: true };
    };
    E.applyBeauty = function (s, slot, id) {
        if (!find(D.LOOK_SLOTS, slot)) return { ok: false, reason: 'Ismeretlen hely' };
        if (id === null || id === undefined) { delete s.look[slot]; return { ok: true }; }
        var b = find(D.BEAUTY, id);
        if (!b || b.slot !== slot || !s.beauty[id]) return { ok: false, reason: 'Ez nem érhető el' };
        var prev = s.look[slot];
        s.look[slot] = { id: id, color: prev && prev.color && b.tone ? prev.color : null };
        return { ok: true };
    };
    E.setLookColor = function (s, slot, colorId) {
        var a = s.look[slot], b = a && find(D.BEAUTY, a.id);
        if (!b || !b.tone) return { ok: false, reason: 'Ennek nincs színe' };
        if (!find(D.LOOK_COLORS[slot] || [], colorId)) return { ok: false, reason: 'Ismeretlen szín' };
        a.color = colorId;
        return { ok: true };
    };

    // ---------------------------------------------------------
    // Barátok és társas élet
    // ---------------------------------------------------------
    function unlockOk(s, u) {
        if (!u) return true;
        if (u.flag && !s.flags[u.flag]) return false;
        if (u.cons && s.stats.cons < u.cons) return false;
        if (u.job && !s.job) return false;
        if (u.minAge && E.ageYears(s) < u.minAge) return false;
        if (u.minComm && s.comm < u.minComm) return false;
        if (u.step && !s.steps[u.step]) return false;
        if (u.anyOf) return u.anyOf.some(function (x) { return unlockOk(s, x); });
        return true;
    }
    E.personUnlocked = function (s, id) {
        var p = find(D.PEOPLE, id);
        if (!p) return false;
        if (s.social.known && s.social.known[id]) return true; // egyszer megismert barát nem tűnik el (pl. ha felmondasz)
        return unlockOk(s, p.unlock);
    };
    E.bond = function (s, id) {
        var p = find(D.PEOPLE, id);
        if (!p) return 0;
        var b = s.social && s.social.bond ? s.social.bond[id] : undefined;
        return typeof b === 'number' ? b : p.start;
    };
    E.people = function (s) {
        return D.PEOPLE.map(function (p) {
            var un = E.personUnlocked(s, p.id);
            return { person: p, unlocked: un, bond: E.bond(s, p.id), last: s.social.last[p.id] };
        });
    };
    // Személyek hatása (a kötelék pontonkénti hatása)
    E.perks = function (s) {
        var out = { passive: 0, click: 0, regen: 0, comm: 0, risk: 0, pay: 0 };
        D.PEOPLE.forEach(function (p) {
            if (!E.personUnlocked(s, p.id)) return;
            if (p.perkReq === 'partner' && !s.flags.partner) return;
            var b = E.bond(s, p.id);
            var eff = Math.max(0, b - p.start); // csak a megszerzett kötelék számít
            for (var k in p.perk) out[k] += p.perk[k] * eff;
        });
        return out;
    };
    E.canSocial = function (s, id) {
        var a = find(D.SOCIAL, id);
        if (!a) return fail('Ismeretlen');
        var p = find(D.PEOPLE, a.who);
        if (!E.personUnlocked(s, a.who)) return fail('Még nem ismered');
        if (a.minAge && E.ageYears(s) < a.minAge) return fail(a.minAge + ' éves kortól');
        var n = a.needs || {};
        if (a.minBond && E.bond(s, a.who) < a.minBond) return fail('Kötelék: ' + a.minBond + ' kell (most ' + Math.floor(E.bond(s, a.who)) + ')');
        if (n.items && Object.keys(s.items).length < n.items) return fail('Legalább ' + n.items + ' darab saját ruha kell');
        if (n.look && E.lookCount(s) < n.look) return fail('Legalább ' + n.look + ' sminkelt hely kell (Smink fül)');
        if (n.comp && s.comp < n.comp) return fail('Jobb gép kell: ' + D.COMPUTERS[n.comp].name);
        if (n.job && !s.job) return fail('Állás kell hozzá');
        if (n.out && !s.out) return fail('Először el kell mondanod a szüleidnek');
        if (n.secret && !E.isSecret(s)) return fail('Csak titkolózás alatt van értelme');
        if (n.moved && s.housing === 'szulo') return fail('Csak akkor, ha már elköltöztél');
        if (n.parentsTense && s.parents !== 'tense') return fail('Erre most nincs szükség');
        if (n.partner === true && !s.flags.partner) return fail('Csak ha már együtt vagytok');
        if (n.partner === false && s.flags.partner) return fail('Ez már megtörtént');
        if (n.skill) for (var k in n.skill) if ((s.skills[k] || 0) < n.skill[k]) return fail(find(D.SKILLS, k).name + ' ' + n.skill[k] + '. szint');
        if ((s.social.cd[id] || -1) >= s.month) return fail('Még ' + (s.social.cd[id] - s.month + 1) + ' hónapig nem érhető el');
        if (s.money < a.cost) return fail('Nincs elég pénzed');
        if (s.energy < a.energy) return fail('Kevés az energiád (' + a.energy + ' kell)');
        return ok();
    };
    E.doSocial = function (s, id) {
        var r = E.canSocial(s, id);
        if (!r.ok) return r;
        var a = find(D.SOCIAL, id), p = find(D.PEOPLE, a.who);
        var st = E.stats(s).total, bond0 = E.bond(s, a.who);
        var look = a.look ? E.lookCount(s) : 0;
        var q = rng() + bond0 * 0.004 + st.cute * 0.003 + look * 0.04;
        var tone = q >= 0.85 ? 'great' : (q >= 0.25 ? 'ok' : 'meh');
        var mult = tone === 'great' ? 1.6 : (tone === 'ok' ? 1 : 0.4);
        var d = E.derive(s);
        spend(s, a.cost);
        s.energy = clamp(s.energy - a.energy, 0, 100);
        var gain = Math.round(a.bond * mult * 10) / 10;
        var conf = Math.round(a.conf * mult * d.clickConf);
        s.social.bond[a.who] = clamp(bond0 + gain, 0, 100);
        s.social.last[a.who] = s.month;
        s.social.known = s.social.known || {};
        s.social.known[a.who] = true;
        s.social.cd[id] = s.month + a.cd - 1;
        s.conf += conf;
        if (a.comm) s.comm += a.comm * mult;
        if (a.skillPts) for (var k in a.skillPts) {
            var sid = k === '_active' ? s.activeSkill : k;
            if (sid) addSkillProgress(s, sid, a.skillPts[k] * mult);
        }
        var text = tone === 'great' ? a.great : (tone === 'ok' ? a.text : p.meh[Math.floor(rng() * p.meh.length)]);
        var res = { ok: true, tone: tone, text: text, bond: gain, conf: conf, who: a.who, special: null };
        if (a.special === 'riskDown') {
            if (E.isSecret(s)) s.risk = clamp(s.risk - (tone === 'great' ? 14 : tone === 'ok' ? 10 : 5), 0, 100);
            s.flags.lillaKnows = true;
        } else if (a.special === 'con') {
            s.stats.cons++; s.lastCon = s.month;
        } else if (a.special === 'bonus' && s.job) {
            var bonus = Math.round(find(D.JOBS, s.job).pay * 0.03 * mult / 100) * 100;
            s.money += bonus; s.stats.earned += bonus;
            res.bonus = bonus;
        } else if (a.special === 'parents') {
            if (tone !== 'meh') { s.parents = 'accepting'; res.special = 'parents'; E.log(s, 'Őszintén beszéltél a szüleiddel, és elfogadtak.'); }
            else s.social.cd[id] = s.month + 1;
        } else if (a.special === 'allowance') {
            if (s.housing === 'szulo' && s.allowanceCut > 0 && tone !== 'meh') s.allowanceCut = Math.max(0, s.allowanceCut - 1);
        } else if (a.special === 'date') {
            var pr = clamp(0.3 + s.social.bond[a.who] * 0.006 + st.cute * 0.004 + look * 0.03, 0.1, 0.92);
            if (tone === 'meh') pr *= 0.6;
            if (rng() < pr) {
                s.flags.partner = true; s.flags.dated = true; res.special = 'partner';
                E.log(s, 'Összejöttél Zsomborral.');
            } else {
                res.special = 'rejected';
                res.text = 'Zsombor kedvesen nemet mond: „Nagyon fontos vagy nekem, de most még barátként.” Fáj, de őszinte volt, és ez is számít.';
                s.social.bond[a.who] = clamp(s.social.bond[a.who] - 4, 0, 100);
                res.bond = Math.round((s.social.bond[a.who] - bond0) * 10) / 10;
            }
        }
        E.log(s, p.name + ': ' + lcFirst(a.name) + '.');
        return res;
    };

    E.visibleOutfit = function (s) {
        if (E.isSecret(s) && s.hiding) return [];
        var out = [];
        D.SLOTS.forEach(function (slot) { if (slot.wear && s.equipped[slot.id]) out.push(s.equipped[slot.id]); });
        return out;
    };

    // Egy tárgy színe (hex): a játékos választása vagy az alapszín; null, ha nem festhető
    E.paintOf = function (s, id) {
        var it = find(D.ITEMS, id);
        if (!it || !it.paint) return null;
        var c = find(D.PALETTE, s.colors && s.colors[id]);
        return c ? c.color : it.paint;
    };
    E.setColor = function (s, id, paletteId) {
        var it = find(D.ITEMS, id);
        if (!it || !it.paint) return { ok: false, reason: 'Ez a tárgy nem festhető' };
        if (!s.items[id]) return { ok: false, reason: 'Ez még nem a tiéd' };
        if (paletteId === null || paletteId === undefined) { delete s.colors[id]; return { ok: true }; }
        if (!find(D.PALETTE, paletteId)) return { ok: false, reason: 'Ismeretlen szín' };
        s.colors[id] = paletteId;
        return { ok: true };
    };
    // Az avatárnak átadandó színek (hely szerint), csak a viselt festhető tárgyakra
    E.outfitColors = function (s) {
        var out = {};
        D.SLOTS.forEach(function (slot) {
            var id = s.equipped[slot.id];
            if (id && slot.wear) { var c = E.paintOf(s, id); if (c) out[slot.id] = c; }
        });
        return out;
    };

    // Statpontok: viselt / kéznél lévő tárgyak + szobadíszek + társ + kombók
    E.activeIds = function (s) {
        var ids = {}, hide = E.isSecret(s) && s.hiding;
        D.SLOTS.forEach(function (slot) {
            var id = s.equipped[slot.id];
            if (id && (!slot.wear || !hide)) ids[id] = true;
        });
        Object.keys(s.decor).forEach(function (k) { if (s.decor[k]) ids[k] = true; });
        Object.keys(s.pets).forEach(function (k) { if (s.pets[k]) ids[k] = true; });
        var lk = E.lookApplied(s);
        Object.keys(lk).forEach(function (k) { ids[lk[k]] = true; });
        return ids;
    };
    E.comboActive = function (combo, ids) {
        return combo.need.every(function (n) {
            return Array.isArray(n) ? n.some(function (x) { return ids[x]; }) : !!ids[n];
        });
    };
    E.stats = function (s) {
        var ids = E.activeIds(s), base = {}, bonus = {}, total = {};
        D.STATS.forEach(function (st) { base[st.id] = 0; bonus[st.id] = 0; });
        function addTo(map, st) { if (st) for (var k in st) if (k in map) map[k] += st[k]; }
        D.ITEMS.forEach(function (it) { if (ids[it.id]) addTo(base, it.st); });
        D.DECOR.forEach(function (d) { if (ids[d.id]) addTo(base, d.st); });
        D.PETS.forEach(function (p) { if (ids[p.id]) addTo(base, p.st); });
        D.BEAUTY.forEach(function (b) { if (ids[b.id]) addTo(base, b.st); });
        var combos = D.COMBOS.map(function (c) { return { combo: c, active: E.comboActive(c, ids) }; });
        combos.forEach(function (c) { if (c.active) addTo(bonus, c.combo.bonus); });
        var filled = D.SLOTS.filter(function (sl) { return s.equipped[sl.id]; }).length;
        var full = filled === D.SLOTS.length;
        if (full) addTo(bonus, D.FULL_SET_BONUS);
        var lkAp = E.lookApplied(s);
        var fullLook = D.FULL_LOOK_SLOTS.every(function (sl) { return !!lkAp[sl]; });
        if (fullLook) addTo(bonus, D.FULL_LOOK_BONUS);
        var score = 0;
        D.STATS.forEach(function (st) { total[st.id] = Math.max(0, base[st.id] + bonus[st.id]); score += total[st.id]; });
        var rank = D.RANKS[0], rankIndex = 0;
        D.RANKS.forEach(function (r, i) { if (score >= r.min) { rank = r; rankIndex = i; } });
        return { base: base, bonus: bonus, total: total, combos: combos, filled: filled, full: full, fullLook: fullLook, score: score, rank: rank, rankIndex: rankIndex };
    };

    E.derive = function (s) {
        var comp = D.COMPUTERS[s.comp];
        var broken = s.brokenUntil >= s.month;
        var secret = E.isSecret(s);
        var w = secret && s.hiding ? 0.4 : 1;
        var housing = find(D.HOUSING, s.housing);
        var age = E.ageYears(s);
        var lvl = function (id) { return s.skills[id] || 0; };

        var eqClick = 0, eqPassive = 0, eqRisk = 0;
        D.SLOTS.forEach(function (slot) {
            var it = s.equipped[slot.id] && find(D.ITEMS, s.equipped[slot.id]);
            if (!it) return;
            eqClick += it.click; eqPassive += it.passive; eqRisk += it.risk;
        });
        var lkAp = E.lookApplied(s);
        Object.keys(lkAp).forEach(function (k) { var b = find(D.BEAUTY, lkAp[k]); if (b) { eqClick += b.click; eqRisk += b.risk; } });
        var st = E.stats(s).total;
        var perks = E.perks(s);
        var stepClick = 0, stepPassive = 0;
        D.STEPS.forEach(function (st) { if (s.steps[st.id]) { stepClick += st.click || 0; stepPassive += st.passive || 0; } });
        var decClick = 0, decPassive = 0, regen = 1.5 + housing.comfort * 0.15 + perks.regen;
        D.DECOR.forEach(function (d) { if (s.decor[d.id]) { decClick += d.click || 0; decPassive += d.passive || 0; regen += d.regen || 0; } });
        D.PETS.forEach(function (p) { if (s.pets[p.id]) { decPassive += p.passive || 0; regen += p.regen || 0; } });

        var online = broken ? 0 : comp.online * (s.flags.discord ? 1 : 0.4);
        var job = s.job ? find(D.JOBS, s.job) : null;

        var d = {
            secret: secret, w: w, housing: housing, comp: comp, broken: broken, job: job,
            eqRisk: eqRisk + st.chaos * 0.1,
            stat: st, perks: perks,
            clickConf: (1 + stepClick + perks.click + eqClick * w + lvl('smink') * 0.5 + lvl('varras') * 0.3 + decClick) * (1 + st.cute * 0.006) + st.chaos * 0.02,
            passiveConf: stepPassive + eqPassive * w + online + decPassive + lvl('rajz') * 0.3 + lvl('angol') * 0.2 + s.comm * 0.02 + st.gamer * 0.05 + perks.passive,
            regen: regen + st.chill * 0.012,
            energyMax: 100,
            hideoutDecay: 0
        };
        D.HIDEOUT.forEach(function (h) { if (s.hideout[h.id]) d.hideoutDecay += h.decay; });

        // Műszak (pénzkereső kattintás)
        if (job) { d.workLabel = job.name; d.workClick = job.click; }
        else {
            var casual = D.CASUAL[0];
            for (var i = 0; i < D.CASUAL.length; i++) if (age <= D.CASUAL[i].maxAge) { casual = D.CASUAL[i]; break; }
            d.workLabel = casual.name; d.workClick = casual.click;
        }

        // Tanulás
        d.studyRate = (0.6 + (broken ? 0 : comp.study)) * (job && job.hours === 'full' ? 0.5 : 1) * (s.student ? 1.3 : 1);
        d.studyClick = 2 + d.studyRate * 2;

        // Havi bevétel / költség
        var inc = { allowance: 0, job: 0, scholarship: 0, freelance: 0, stream: 0 };
        if (s.housing === 'szulo' && s.allowanceCut <= 0) {
            for (var a = 0; a < D.ALLOWANCE.length; a++) if (age <= D.ALLOWANCE[a].maxAge) { inc.allowance = D.ALLOWANCE[a].pay; break; }
        }
        if (job) inc.job = job.pay;
        if (s.student) inc.scholarship = D.SCHOLARSHIP;
        if (!broken && s.comp >= 1) {
            if (lvl('rajz') >= 1) inc.freelance += lvl('rajz') * D.FREELANCE_RAJZ * (s.comp >= 3 ? 1.5 : 1);
            if (lvl('prog') >= 2) inc.freelance += (lvl('prog') - 1) * D.FREELANCE_PROG;
        }
        if (!broken && s.comp >= 4 && lvl('stream') >= 1) inc.stream = lvl('stream') * (D.STREAM_BASE + s.comm * D.STREAM_PER_COMM);
        var codeMul = 1 + d.stat.code * 0.004;
        inc.job = Math.round(inc.job * codeMul * (1 + perks.pay));
        inc.freelance = Math.round(inc.freelance * codeMul);
        inc.total = inc.allowance + inc.job + inc.scholarship + inc.freelance + inc.stream;

        var cost = { rent: 0, living: 0, upkeep: 0 };
        if (s.housing !== 'szulo') {
            var bump = 1 + s.rentBump;
            cost.rent = Math.round(housing.rent * bump);
            cost.living = Math.round(housing.living * bump);
            cost.upkeep = comp.upkeep;
        }
        cost.total = cost.rent + cost.living + cost.upkeep;

        d.income = inc;
        d.costs = cost;
        d.net = inc.total - cost.total;
        return d;
    };

    // Szöveges környezet az eseményekhez: mit viselsz, milyen gépen ülsz, hol laksz...
    E.ctx = function (s) {
        var d = E.derive(s);
        var visible = E.visibleOutfit(s).map(function (id) { return find(D.ITEMS, id); });
        var ownedWardrobe = Object.keys(s.items).map(function (id) { return find(D.ITEMS, id); }).filter(Boolean);
        var c = {
            name: s.name,
            age: E.ageYears(s),
            d: d,
            pc: lcFirst(d.comp.name),
            pcTier: s.comp,
            home: lcFirst(d.housing.name),
            job: d.job ? lcFirst(d.job.name) : null,
            jobObj: d.job,
            outfit: visible,
            outfitText: visible.length ? joinList(visible.map(function (i) { return lcFirst(i.name); })) : 'hétköznapi ruha',
            ownedWardrobe: ownedWardrobe,
            ownedText: ownedWardrobe.length ? joinList(ownedWardrobe.map(function (i) { return lcFirst(i.name); })) : '',
            pet: s.pets.cica ? 'cica' : null,
            look: E.lookText(s),
            lookCount: E.lookCount(s),
            hasLook: function (id) { return E.lookApplied(s)[(find(D.BEAUTY, id) || {}).slot] === id; },
            netLoss: s.gamble.wagered - s.gamble.paid,
            has: function (id) { return visible.some(function (i) { return i.id === id; }); },
            owns: function (id) { return !!(s.items[id] || s.decor[id] || s.pets[id]); },
            az: az, joinList: joinList,
            m: s.month
        };
        return c;
    };

    // ---------------------------------------------------------
    // Hatások az eseményekhez
    // ---------------------------------------------------------
    E.api = function (s) {
        var A = {
            conf: function (n) { s.conf = Math.max(0, s.conf + n); },
            money: function (n) { s.money += n; if (n > 0) s.stats.earned += n; else s.stats.spent -= n; },
            risk: function (n) { if (E.isSecret(s)) s.risk = clamp(s.risk + n, 0, 100); },
            setRisk: function (n) { s.risk = clamp(n, 0, 100); },
            comm: function (n) { s.comm = Math.max(0, s.comm + n); },
            energy: function (n) { s.energy = clamp(s.energy + n, 0, 100); },
            flag: function (k, v) { s.flags[k] = v === undefined ? true : v; },
            skill: function (id, pts) { addSkillProgress(s, id, pts); },
            give: function (id) { if (!s.items[id]) { s.items[id] = true; var it = find(D.ITEMS, id); if (it && !s.equipped[it.slot]) s.equipped[it.slot] = id; } },
            log: function (t) { E.log(s, t); },
            parents: function (v) { s.parents = v; },
            setOut: function (v) { s.out = v; if (v) s.risk = 0; },
            student: function (v) { s.student = v; if (v && s.job) { var j = find(D.JOBS, s.job); if (j && j.hours === 'full') s.job = null; } },
            job: function (id) { s.job = id; s.jobMonths = 0; },
            cutAllowance: function (n) { s.allowanceCut = Math.max(s.allowanceCut, n); },
            sale: function (months) { s.saleUntil = s.month + months; },
            broken: function (months) { s.brokenUntil = s.month + months; },
            fixComputer: function () { s.brokenUntil = -1; },
            lockCasino: function (months) { s.gamble.lockUntil = s.month + months; },
            urge: function (n) { s.gamble.urge = clamp(s.gamble.urge + n, 0, 100); },
            rentBump: function (f) { s.rentBump = Math.min(0.3, s.rentBump + f); },
            moveHome: function () { s.housing = 'szulo'; s.flags.movedBack = true; },
            con: function () { s.stats.cons++; s.lastCon = s.month; },
            bond: function (who, n) {
                if (!find(D.PEOPLE, who)) return;
                s.social.bond[who] = clamp(E.bond(s, who) + n, 0, 100);
                s.social.last[who] = s.month;
            },
            rand: function () { return rng(); }
        };
        return A;
    };

    // ---------------------------------------------------------
    // Képességek
    // ---------------------------------------------------------
    function addSkillProgress(s, id, pts) {
        var sk = find(D.SKILLS, id);
        if (!sk) return;
        var level = s.skills[id] || 0;
        if (level >= D.SKILL_MAX) return;
        s.skillProg[id] = (s.skillProg[id] || 0) + pts;
        while (level < D.SKILL_MAX && s.skillProg[id] >= D.SKILL_COST[level]) {
            s.skillProg[id] -= D.SKILL_COST[level];
            level++;
            s.skills[id] = level;
            E.log(s, sk.name + ': ' + level + '. szint.');
            s.flags['lvl_' + id] = level;
            s.flagsNew = (s.flagsNew || []).concat([{ type: 'skill', id: id, level: level }]);
        }
        if (level >= D.SKILL_MAX) s.skillProg[id] = 0;
    }
    E.addSkillProgress = addSkillProgress;

    E.canStudy = function (s, id) {
        var sk = find(D.SKILLS, id);
        if (!sk) return { ok: false, reason: 'Ismeretlen képesség' };
        if ((s.skills[id] || 0) >= D.SKILL_MAX) return { ok: false, reason: 'Elérted a legmagasabb szintet' };
        if (s.comp < sk.comp) return { ok: false, reason: 'Jobb számítógép kell hozzá: ' + D.COMPUTERS[sk.comp].name };
        return { ok: true };
    };
    E.setActiveSkill = function (s, id) {
        if (id === null || id === s.activeSkill) { s.activeSkill = null; return { ok: true }; }
        var r = E.canStudy(s, id);
        if (r.ok) s.activeSkill = id;
        return r;
    };

    // ---------------------------------------------------------
    // Kattintások
    // ---------------------------------------------------------
    E.clickMirror = function (s) {
        if (s.ending || s.event) return 0;
        var d = E.derive(s);
        s.conf += d.clickConf;
        s.stats.clicks++;
        return d.clickConf;
    };
    E.clickWork = function (s) {
        if (s.ending || s.event) return 0;
        if (s.energy < WORK_ENERGY) return -1;
        var d = E.derive(s);
        s.energy -= WORK_ENERGY;
        s.money += d.workClick;
        s.stats.earned += d.workClick;
        s.stats.workClicks++;
        return d.workClick;
    };
    E.clickStudy = function (s) {
        if (s.ending || s.event) return 0;
        if (!s.activeSkill) return -2;
        if (s.energy < STUDY_ENERGY) return -1;
        var d = E.derive(s);
        s.energy -= STUDY_ENERGY;
        addSkillProgress(s, s.activeSkill, d.studyClick);
        s.stats.studyClicks++;
        return d.studyClick;
    };
    E.WORK_ENERGY = WORK_ENERGY;
    E.STUDY_ENERGY = STUDY_ENERGY;

    // ---------------------------------------------------------
    // Vásárlások
    // ---------------------------------------------------------
    function spend(s, cost) { s.money -= cost; s.stats.spent += cost; }
    function fail(reason) { return { ok: false, reason: reason }; }
    function ok() { return { ok: true }; }

    E.buyItem = function (s, id) {
        var it = find(D.ITEMS, id);
        if (!it) return fail('Ismeretlen tárgy');
        if (s.items[id]) return fail('Ez már a tiéd');
        var cost = E.price(s, it.cost);
        if (s.money < cost) return fail('Nincs elég pénzed');
        spend(s, cost);
        s.items[id] = true;
        if (!s.equipped[it.slot]) s.equipped[it.slot] = id;
        if (E.isSecret(s)) s.risk = clamp(s.risk + it.risk * 0.5, 0, 100);
        E.log(s, 'Megvetted: ' + it.name + '.');
        return ok();
    };
    E.equip = function (s, slot, id) {
        if (!find(D.SLOTS, slot)) return fail('Ismeretlen hely');
        if (id === null) { delete s.equipped[slot]; return ok(); }
        var it = find(D.ITEMS, id);
        if (!it || it.slot !== slot || !s.items[id]) return fail('Ez nem érhető el');
        s.equipped[slot] = id;
        return ok();
    };
    E.toggleHiding = function (s) {
        if (!E.isSecret(s)) return fail('Nincs miért rejtőzködnöd');
        s.hiding = !s.hiding;
        return ok();
    };
    E.buyHideout = function (s, id) {
        var h = find(D.HIDEOUT, id);
        if (!h) return fail('Ismeretlen');
        if (s.hideout[id]) return fail('Már megvan');
        if (s.money < h.cost) return fail('Nincs elég pénzed');
        spend(s, h.cost);
        s.hideout[id] = true;
        E.log(s, 'Rejtekhely: ' + h.name + '.');
        return ok();
    };
    E.buyDecor = function (s, id) {
        var d = find(D.DECOR, id);
        if (!d) return fail('Ismeretlen');
        if (s.decor[id]) return fail('Már megvan');
        var cost = E.price(s, d.cost);
        if (s.money < cost) return fail('Nincs elég pénzed');
        spend(s, cost);
        s.decor[id] = true;
        E.log(s, 'A szobádba került: ' + d.name + '.');
        return ok();
    };
    E.buyPet = function (s, id) {
        var p = find(D.PETS, id);
        if (!p) return fail('Ismeretlen');
        if (s.pets[id]) return fail('Már megvan');
        if (p.needsHome.indexOf(s.housing) < 0) return fail('Ehhez saját albérlet vagy lakás kell');
        if (s.money < p.cost) return fail('Nincs elég pénzed');
        spend(s, p.cost);
        s.pets[id] = true;
        E.log(s, 'Örökbe fogadtál egy cicát.');
        return ok();
    };
    E.nextComputer = function (s) { return D.COMPUTERS[s.comp + 1] || null; };
    E.buyComputer = function (s) {
        var next = E.nextComputer(s);
        if (!next) return fail('Ez a csúcs');
        if (s.money < next.cost) return fail('Nincs elég pénzed');
        if (s.housing === 'szulo' && !s.out && s.comp === 0 && !s.flags.alias) { /* titokban is lehet gépet venni */ }
        spend(s, next.cost);
        s.comp++;
        s.brokenUntil = -1;
        E.log(s, 'Új gép: ' + next.name + '.');
        return ok();
    };
    E.repairCost = function (s) { return Math.max(30000, Math.round(D.COMPUTERS[s.comp].cost * 0.1 / 1000) * 1000); };
    E.repairComputer = function (s) {
        if (s.brokenUntil < s.month) return fail('A gép nem romlott el');
        var cost = E.repairCost(s);
        if (s.money < cost) return fail('Nincs elég pénzed');
        spend(s, cost);
        s.brokenUntil = -1;
        E.log(s, 'Megjavíttattad a gépet.');
        return ok();
    };

    E.buyStep = function (s, id) {
        var st = find(D.STEPS, id);
        if (!st) return fail('Ismeretlen');
        if (s.steps[id]) return fail('Már megtetted');
        if (E.ageYears(s) < st.minAge) return fail(st.minAge + ' éves kortól');
        if (s.conf < st.cost) return fail('Nincs elég önbizalmad');
        s.conf -= st.cost;
        s.steps[id] = true;
        if (st.comm) s.comm += st.comm;
        if (st.risk && E.isSecret(s)) s.risk = clamp(s.risk + st.risk, 0, 100);
        E.log(s, st.text);
        return ok();
    };


    // ---------------------------------------------------------
    // Élmények
    // ---------------------------------------------------------
    E.canExperience = function (s, id) {
        var x = find(D.EXPERIENCES, id);
        if (!x) return fail('Ismeretlen');
        if (E.ageYears(s) < x.minAge) return fail(x.minAge + ' éves kortól');
        if (x.needsJob && !s.job) return fail('Állás kell hozzá');
        if (x.minComm && s.comm < x.minComm) return fail('Közösség: ' + x.minComm);
        if (x.minSkill) for (var k in x.minSkill) if ((s.skills[k] || 0) < x.minSkill[k]) return fail(find(D.SKILLS, k).name + ' ' + x.minSkill[k] + '. szint');
        if ((s.expCd[id] || -1) >= s.month) return fail('Még ' + (s.expCd[id] - s.month + 1) + ' hónapig nem érhető el');
        if (s.money < x.cost) return fail('Nincs elég pénzed');
        return ok();
    };
    E.doExperience = function (s, id) {
        var r = E.canExperience(s, id);
        if (!r.ok) return r;
        var x = find(D.EXPERIENCES, id);
        spend(s, x.cost);
        if (x.conf) s.conf += x.conf;
        if (x.comm) s.comm += x.comm;
        if (x.energy) s.energy = 100;
        if (x.skillPts && s.activeSkill) addSkillProgress(s, s.activeSkill, x.skillPts);
        s.expCd[id] = s.month + x.cd;
        E.log(s, x.name + '.');
        return { ok: true, text: x.text };
    };

    // ---------------------------------------------------------
    // Munka, lakás
    // ---------------------------------------------------------
    E.canHire = function (s, id) {
        var j = find(D.JOBS, id);
        if (!j) return fail('Ismeretlen állás');
        if (s.job === id) return fail('Itt dolgozol');
        if (E.ageYears(s) < j.minAge) return fail(j.minAge + ' éves kortól');
        if (s.student && j.hours === 'full') return fail('Hallgatóként csak részmunkaidő');
        if (j.comp && s.comp < j.comp) return fail('Gép: ' + D.COMPUTERS[j.comp].name);
        if (j.comm && s.comm < j.comm) return fail('Közösség: ' + j.comm);
        var needs = j.needs || {};
        for (var k in needs) {
            if ((s.skills[k] || 0) < needs[k]) return fail(find(D.SKILLS, k).name + ' ' + needs[k] + '. szint');
        }
        return ok();
    };
    E.hire = function (s, id) {
        var r = E.canHire(s, id);
        if (!r.ok) return r;
        var j = find(D.JOBS, id);
        s.job = id; s.jobMonths = 0;
        E.log(s, 'Új állás: ' + j.name + '.');
        return ok();
    };
    E.quit = function (s) {
        if (!s.job) return fail('Nincs állásod');
        var j = find(D.JOBS, s.job);
        s.job = null;
        E.log(s, 'Felmondtál: ' + j.name + '.');
        return ok();
    };
    E.canMove = function (s, id) {
        var h = find(D.HOUSING, id);
        if (!h) return fail('Ismeretlen');
        if (s.housing === id) return fail('Itt laksz');
        if (id === 'szulo') return ok();
        if (E.ageYears(s) < h.minAge) return fail(h.minAge + ' éves kortól');
        if (h.needsStudent && !s.student) return fail('Csak hallgatóknak');
        if (s.money < h.deposit) return fail('Kell hozzá a kaució: ' + h.deposit);
        return ok();
    };
    E.move = function (s, id) {
        var r = E.canMove(s, id);
        if (!r.ok) return r;
        var h = find(D.HOUSING, id);
        if (id !== 'szulo') spend(s, h.deposit);
        s.housing = id;
        s.debtMonths = 0;
        if (id !== 'szulo') {
            s.flags.moved = true;
            if (s.pets.cica && h.needsHome !== undefined) { /* a cica veled költözik */ }
        }
        if (id !== 'szulo' && D.PETS.some(function (p) { return s.pets[p.id] && p.needsHome.indexOf(id) < 0; })) {
            D.PETS.forEach(function (p) { if (s.pets[p.id] && p.needsHome.indexOf(id) < 0) delete s.pets[p.id]; });
            E.log(s, 'A cicát vissza kellett adnod a gazdinak, mert ebbe a lakásba nem fér be.');
        }
        E.log(s, 'Új otthon: ' + h.name + '.');
        return ok();
    };

    // ---------------------------------------------------------
    // Kaszinó (csak játékpénz, 18 éves kortól)
    // ---------------------------------------------------------
    E.casinoState = function (s) {
        var g = s.gamble;
        if (E.ageYears(s) < D.CASINO_MIN_AGE) return { open: false, reason: D.CASINO_MIN_AGE + ' éves kortól' };
        if (g.lockUntil >= s.month) return { open: false, reason: 'Önkizárás: még ' + (g.lockUntil - s.month + 1) + ' hónapig', locked: true };
        return { open: true };
    };
    E.canBet = function (s, bet) {
        var cs = E.casinoState(s);
        if (!cs.open) return fail(cs.reason);
        if (s.ending || s.event) return fail('Most nem lehet');
        if (s.money < bet) return fail('Nincs elég pénzed');
        var g = s.gamble;
        if (g.limit > 0 && g.monthSpent + bet > g.limit) return fail('Elérted a havi keretet');
        return ok();
    };
    E.setGambleLimit = function (s, limit) {
        if (!D.GAMBLE_LIMITS.some(function (l) { return l.id === limit; })) return fail('Érvénytelen keret');
        s.gamble.limit = limit;
        return ok();
    };
    E.selfExclude = function (s) {
        s.gamble.lockUntil = s.month + D.SELF_EXCLUDE_MONTHS;
        s.gamble.urge = Math.max(0, s.gamble.urge - 40);
        s.flags.selfExcluded = true;
        s.conf += 40;
        E.log(s, 'Önkizárást kértél a kaszinóból ' + D.SELF_EXCLUDE_MONTHS + ' hónapra.');
        return ok();
    };

    function settleBet(s, bet, payout) {
        var g = s.gamble;
        spend(s, bet);
        s.money += payout;
        if (payout > 0) s.stats.earned += payout;
        g.plays++;
        g.wagered += bet;
        g.paid += payout;
        g.monthSpent += bet;
        g.lastBet = bet;
        g.lastPayout = payout;
        if (payout > bet) {
            g.streak = 0;
            if (payout >= bet * 20 && payout >= 50000) g.bigWin = true;
            g.urge = clamp(g.urge + 1, 0, 100);
        } else {
            g.streak++;
            g.urge = clamp(g.urge + (g.streak >= 3 ? 5 : 3), 0, 100);
        }
    }

    function pickWeighted(list, weightOf) {
        var total = 0, i;
        for (i = 0; i < list.length; i++) total += weightOf(list[i]);
        var r = rng() * total;
        for (i = 0; i < list.length; i++) {
            r -= weightOf(list[i]);
            if (r < 0) return list[i];
        }
        return list[list.length - 1];
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(rng() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    // Kaparós: 6 mező; három azonos összeg = nyeremény
    E.playScratch = function (s, bet) {
        var r = E.canBet(s, bet);
        if (!r.ok) return r;
        var o = pickWeighted(D.SCRATCH.outcomes, function (x) { return x.p; });
        var prizes = D.SCRATCH.outcomes.filter(function (x) { return x.mult > 0; }).map(function (x) { return x.mult; });
        var cells = [];
        var counts = {};
        var add = function (m) { cells.push(m); counts[m] = (counts[m] || 0) + 1; };
        if (o.mult > 0) { add(o.mult); add(o.mult); add(o.mult); }
        while (cells.length < 6) {
            var m = prizes[Math.floor(rng() * prizes.length)];
            if ((counts[m] || 0) >= 2 || m === o.mult) continue;
            add(m);
        }
        shuffle(cells);
        var payout = bet * o.mult;
        settleBet(s, bet, payout);
        return { ok: true, game: 'scratch', bet: bet, cells: cells.map(function (m) { return m * bet; }), mult: o.mult, payout: payout };
    };

    E.playSlot = function (s, bet) {
        var r = E.canBet(s, bet);
        if (!r.ok) return r;
        var syms = D.SLOT.symbols;
        var reels = [0, 1, 2].map(function () { return pickWeighted(syms, function (x) { return x.weight; }); });
        var mult = 0;
        if (reels[0] === reels[1] && reels[1] === reels[2]) mult = reels[0].triple;
        else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) mult = D.SLOT.pair;
        var payout = Math.round(bet * mult);
        settleBet(s, bet, payout);
        return { ok: true, game: 'slot', bet: bet, reels: reels.map(function (x) { return x.id; }), mult: mult, payout: payout, triple: reels[0] === reels[1] && reels[1] === reels[2] };
    };

    E.playCoin = function (s, bet) {
        var r = E.canBet(s, bet);
        if (!r.ok) return r;
        var win = rng() < D.COIN.winP;
        var payout = win ? bet * D.COIN.mult : 0;
        settleBet(s, bet, payout);
        return { ok: true, game: 'coin', bet: bet, win: win, payout: payout };
    };

    // ---------------------------------------------------------
    // Idő és események
    // ---------------------------------------------------------
    E.eligible = function (s, ev, c, ignoreAge) {
        if (ev.once !== false) { if (s.seen[ev.id]) return false; }
        else {
            var last = s.lastSeen[ev.id];
            if (last !== undefined && s.month - last < (ev.cooldown || 10)) return false;
        }
        if (!ignoreAge) {
            var age = E.ageFloat(s);
            if (ev.minAge && age < ev.minAge) return false;
            if (ev.maxAge && age >= ev.maxAge) return false;
        }
        if (ev.when && !ev.when(s, c)) return false;
        return true;
    };

    E.pickEvent = function (s) {
        var EVS = M.events.EVENTS;
        var c = E.ctx(s);
        var i, ev;
        for (i = 0; i < EVS.length; i++) {
            ev = EVS[i];
            if (ev.trigger && E.eligible(s, ev, c, true) && ev.trigger(s, c)) return ev;
        }
        for (i = 0; i < EVS.length; i++) {
            ev = EVS[i];
            if (ev.prio === 1 && !ev.trigger && E.eligible(s, ev, c)) return ev;
        }
        if (rng() < RANDOM_EVENT_CHANCE) {
            var pool = EVS.filter(function (e) { return !e.prio && !e.trigger && E.eligible(s, e, c); });
            if (pool.length) return pickWeighted(pool, function (e) { return e.weight || 1; });
        }
        return null;
    };

    E.showEvent = function (s, ev) {
        var c = E.ctx(s);
        var txt = typeof ev.text === 'function' ? ev.text(s, c) : ev.text;
        var title = typeof ev.title === 'function' ? ev.title(s, c) : ev.title;
        s.event = { id: ev.id, title: title, text: txt, art: ev.art || 'room', result: null, link: null, picked: -1 };
    };

    E.eventView = function (s) {
        if (!s.event) return null;
        var ev = M.events.find(s.event.id);
        if (!ev) return null;
        var c = E.ctx(s);
        return {
            id: ev.id, title: s.event.title, text: s.event.text, art: s.event.art,
            result: s.event.result, link: s.event.link, chapter: !!ev.chapter, kicker: ev.kicker || '',
            choices: ev.choices.map(function (ch, i) {
                var okReq = !ch.req || ch.req(s, c);
                var out = { index: i, label: typeof ch.label === 'function' ? ch.label(s, c) : ch.label, tip: ch.tip || '', enabled: okReq, reqText: okReq ? '' : (ch.reqText || ''), check: null };
                var need = E.confNeed(ch);
                if (need && !ch.req) out.check = { need: need, have: Math.floor(s.conf), ok: s.conf >= need };
                return out;
            })
        };
    };

    // A választás tippjéből kiolvasott önbizalom-küszöb ("Legalább 150 önbizalom kell", "250+ önbizalom esetén ...")
    E.confNeed = function (ch) {
        if (ch.need !== undefined) return ch.need;
        var m = /(\d+)\+?\s*önbizalom/.exec(ch.tip || '');
        return m ? parseInt(m[1], 10) : 0;
    };

    E.choose = function (s, idx) {
        if (!s.event || s.event.result !== null) return false;
        var ev = M.events.find(s.event.id);
        var ch = ev && ev.choices[idx];
        if (!ch) return false;
        var c = E.ctx(s);
        if (ch.req && !ch.req(s, c)) return false;
        var res = ch.do(s, E.api(s), c);
        s.event.result = String(res || '');
        s.event.link = ch.link || null;
        s.event.picked = idx;
        s.seen[ev.id] = true;
        s.lastSeen[ev.id] = s.month;
        return true;
    };

    // Bezárás után a megvalósult eredmény: új eredmények listája
    E.closeEvent = function (s) {
        s.event = null;
        if (s.month >= D.MONTHS && !s.ending) E.finish(s);
        return E.checkAchievements(s);
    };

    E.checkAchievements = function (s) {
        var list = M.events.ACHIEVEMENTS, fresh = [];
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (s.ach[a.id] === undefined && a.check(s, E.derive(s))) {
                s.ach[a.id] = s.month;
                E.log(s, 'Eredmény: ' + a.name + '.');
                fresh.push(a);
            }
        }
        return fresh;
    };

    // Havi elszámolás
    E.endMonth = function (s) {
        var d = E.derive(s);
        var delta = d.income.total - d.costs.total;
        s.money += delta;
        if (d.income.total > 0) s.stats.earned += d.income.total;
        if (d.costs.total > 0) s.stats.spent += d.costs.total;
        s.debtMonths = s.money < 0 ? s.debtMonths + 1 : 0;
        s.lastNet = delta;

        if (s.flags.discord && !d.broken) s.comm += 0.15 * s.comp + d.stat.gamer * 0.01;
        s.comm += d.perks.comm * (1 + 0);
        if (d.secret) {
            if (!s.hiding) s.risk = clamp(s.risk + d.eqRisk * 0.12, 0, 100);
            s.risk = clamp(s.risk - (1 + d.hideoutDecay + d.perks.risk), 0, 100);
        } else s.risk = 0;

        // Barátok: új ismerősök, kopó kötelék
        s.social.known = s.social.known || {};
        D.PEOPLE.forEach(function (p) {
            if (!s.social.known[p.id] && E.personUnlocked(s, p.id)) {
                s.social.known[p.id] = true;
                s.social.last[p.id] = s.month;
                s.flagsNew = (s.flagsNew || []).concat([{ type: 'person', id: p.id }]);
                E.log(s, 'Új ismerős: ' + p.name + ' (' + p.role.toLowerCase() + ').');
            }
            if (!s.social.known[p.id]) return;
            var last = s.social.last[p.id];
            if (last === undefined) { s.social.last[p.id] = s.month; return; }
            if (s.month - last >= D.SOCIAL_DECAY_AFTER) {
                var b = E.bond(s, p.id);
                var floor = p.id === 'csalad' ? 10 : 0;
                s.social.bond[p.id] = Math.max(floor, b - D.SOCIAL_DECAY * (p.id === 'zsombor' && s.flags.partner ? 0.5 : 1));
            }
        });

        if (s.allowanceCut > 0) s.allowanceCut--;
        if (s.job) s.jobMonths++;
        var g = s.gamble;
        g.urge = clamp(g.urge - (g.monthSpent === 0 ? 4 : 1) - d.stat.chill * 0.03, 0, 100);
        g.monthSpent = 0;

        s.month++;
        s.sec = 0;
        if (s.month >= D.MONTHS) { E.closeOrFinish(s); return; }
        var ev = E.pickEvent(s);
        if (ev) E.showEvent(s, ev);
    };
    E.closeOrFinish = function (s) {
        // a 25. születésnapon: az utolsó esemény után a befejezés
        E.finish(s);
    };

    E.tick = function (s, dtRaw) {
        if (s.ending || s.event || s.paused) return;
        var dt = Math.min(dtRaw, 1) * s.speed;
        var d = E.derive(s);
        s.conf += d.passiveConf * dt;
        s.energy = clamp(s.energy + d.regen * dt, 0, d.energyMax);
        if (s.activeSkill) {
            var r = E.canStudy(s, s.activeSkill);
            if (r.ok) addSkillProgress(s, s.activeSkill, d.studyRate * dt);
            else if ((s.skills[s.activeSkill] || 0) >= D.SKILL_MAX) s.activeSkill = null;
        }
        s.sec += dt;
        var guard = 0;
        while (s.sec >= D.MONTH_SECONDS && !s.ending && !s.event && guard++ < 50) {
            s.sec -= D.MONTH_SECONDS;
            E.endMonth(s);
        }
    };

    // ---------------------------------------------------------
    // Befejezés
    // ---------------------------------------------------------
    E.finish = function (s) {
        var d = E.derive(s);
        var best = null, bestScore = -1;
        M.events.ENDINGS.forEach(function (en) {
            if (en.fallback) return;
            var sc = en.score(s, d);
            if (sc > bestScore) { best = en; bestScore = sc; }
        });
        if (!best || bestScore < 1) best = M.events.ENDINGS.filter(function (e) { return e.fallback; })[0];
        s.ending = { id: best.id, score: bestScore, at: s.month };
        s.event = null;
        E.checkAchievements(s);
    };

    E.stage = function (s) {
        var age = E.ageFloat(s), ch = M.events.CHAPTERS, cur = ch[0];
        for (var i = 0; i < ch.length; i++) if (age >= ch[i].age) cur = ch[i];
        return cur;
    };

    // ---------------------------------------------------------
    // Mentés / betöltés
    // ---------------------------------------------------------
    E.serialize = function (s) {
        var copy = {};
        for (var k in s) if (k !== 'flagsNew') copy[k] = s[k];
        return JSON.stringify(copy);
    };

    E.deserialize = function (text) {
        var raw;
        try { raw = JSON.parse(text); } catch (e) { return null; }
        if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
        var s = E.newState({ name: raw.name, hairStyle: raw.hairStyle, hairColor: raw.hairColor, skin: raw.skin });
        var numeric = ['month', 'sec', 'conf', 'money', 'energy', 'risk', 'comm', 'comp', 'jobMonths', 'debtMonths', 'allowanceCut', 'saleUntil', 'brokenUntil', 'rentBump', 'lastCon', 'speed'];
        numeric.forEach(function (k) { s[k] = num(raw[k], s[k]); });
        ['out', 'hiding', 'student', 'paused'].forEach(function (k) { s[k] = !!raw[k]; });
        ['steps', 'items', 'equipped', 'colors', 'hideout', 'decor', 'pets', 'beauty', 'look', 'skills', 'skillProg', 'flags', 'seen', 'lastSeen', 'ach', 'stats', 'expCd'].forEach(function (k) {
            if (raw[k] && typeof raw[k] === 'object' && !Array.isArray(raw[k])) s[k] = Object.assign(s[k] && typeof s[k] === 'object' ? s[k] : {}, raw[k]);
        });
        if (raw.gamble && typeof raw.gamble === 'object') s.gamble = Object.assign(s.gamble, raw.gamble);
        if (raw.social && typeof raw.social === 'object') {
            ['bond', 'last', 'cd', 'known'].forEach(function (k) {
                if (raw.social[k] && typeof raw.social[k] === 'object' && !Array.isArray(raw.social[k])) s.social[k] = Object.assign({}, raw.social[k]);
            });
        }
        // Régi mentések: a "Pír" és a "Teljes smink-szett" ruhatárgyak a Smink fülre költöztek
        if (s.items.pir) { s.beauty.pi_termeszetes = true; if (!s.look.blush) s.look.blush = { id: 'pi_termeszetes', color: null }; }
        if (s.items.smink) {
            ['aj_fenyes', 'pl_hosszu', 'sz_finom', 'ki_finom'].forEach(function (id) { s.beauty[id] = true; var b = find(D.BEAUTY, id); if (!s.look[b.slot]) s.look[b.slot] = { id: id, color: null }; });
        }
        Object.keys(s.items).forEach(function (k) { if (!find(D.ITEMS, k)) delete s.items[k]; });
        Object.keys(s.equipped).forEach(function (slot) { var it = find(D.ITEMS, s.equipped[slot]); if (!it || it.slot !== slot) delete s.equipped[slot]; });
        Object.keys(s.beauty).forEach(function (k) { if (!find(D.BEAUTY, k)) delete s.beauty[k]; });
        Object.keys(s.look).forEach(function (slot) {
            var a = s.look[slot], b = a && find(D.BEAUTY, a.id);
            if (!a || !b || b.slot !== slot || !s.beauty[a.id] || !find(D.LOOK_SLOTS, slot)) { delete s.look[slot]; return; }
            if (a.color && !find(D.LOOK_COLORS[slot] || [], a.color)) a.color = null;
        });
        s.month = clamp(Math.floor(s.month), 0, D.MONTHS);
        s.comp = clamp(Math.floor(s.comp), 0, D.COMPUTERS.length - 1);
        s.speed = [1, 2, 4].indexOf(s.speed) >= 0 ? s.speed : 1;
        s.parents = ['unknown', 'accepting', 'tense'].indexOf(raw.parents) >= 0 ? raw.parents : 'unknown';
        s.housing = find(D.HOUSING, raw.housing) ? raw.housing : 'szulo';
        s.job = find(D.JOBS, raw.job) ? raw.job : null;
        s.activeSkill = find(D.SKILLS, raw.activeSkill) ? raw.activeSkill : null;
        if (Array.isArray(raw.log)) s.log = raw.log.filter(function (l) { return l && typeof l.text === 'string'; }).slice(-LOG_LIMIT).map(function (l) { return { m: num(l.m, 0), text: String(l.text).slice(0, 300) }; });
        if (raw.event && typeof raw.event === 'object' && M.events.find(raw.event.id)) {
            s.event = { id: raw.event.id, title: String(raw.event.title || ''), text: String(raw.event.text || ''), art: String(raw.event.art || 'room'), result: raw.event.result === null || raw.event.result === undefined ? null : String(raw.event.result), link: (raw.event.link && raw.event.link.href === D.DISCORD_URL) ? { href: D.DISCORD_URL, label: String(raw.event.link.label || '').slice(0, 60) } : null, picked: num(raw.event.picked, -1) };
        }
        if (raw.ending && typeof raw.ending === 'object' && M.events.ENDINGS.some(function (e) { return e.id === raw.ending.id; })) s.ending = { id: raw.ending.id, score: num(raw.ending.score, 0), at: num(raw.ending.at, D.MONTHS) };
        s.paused = true; // betöltéskor szünetel, hogy ne érjen meglepetés
        return s;
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof globalThis !== 'undefined' ? globalThis : this);
