// =========================================================
// ÉRTÉKTEST - pontozás, besorolás, megbízhatóság, megosztható kódolás (tiszta függvények, Node-ban tesztelhető)
// =========================================================
(function (root) {
    'use strict';

    var data = (typeof module !== 'undefined' && module.exports) ? require('./ertektest-data.js') : root.MFSZErtek.data;
    var AX = data.AXES.map(function (a) { return a.id; });

    function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
    function isNum(v) { return typeof v === 'number' && !isNaN(v); }

    // Egy tesztverzió tengelyei, típusai és utált értékei (a jelenlegi vagy a régi), ismeretlen verzióra null
    function defsFor(ver) { return data.defsFor(ver); }
    function hatedDefsFor(ver) { var d = defsFor(ver); return d ? d.HATED : null; }
    function axIds(defs) { return (defs || data).AXES.map(function (a) { return a.id; }); }

    // ---------- Tengelyek és típusok ----------
    // answers: { állításId: -2..2 | null }. A null (passz) nem számít bele, a 0 ("nem tudom / közepes") igen.
    // Tengelyenként a súlyozott átlag, -100..100 között: Σ(válasz × súly) / Σ(2 × |súly|).
    // A rangsorolós feladat a listában egy elem (kind 'r'), a lehetőségei külön „tételek” (kind 'ro'), a helyezésből adódó válasszal.
    // flat: a feladatokat kibontja a lehetőségeikre, így a pontozás egyformán kezeli őket.
    function flat(list) {
        var out = [];
        list.forEach(function (it) {
            if (it.kind === 'r') it.opts.forEach(function (o) { out.push({ kind: 'ro', id: o.id, text: o.text, w: o.w, parent: it.id }); });
            else out.push(it);
        });
        return out;
    }
    // Fontosnak jelölt kérdés (csak az értékrész állításai): kétszeres súllyal számít
    function mult(it, stars) { return stars && stars[it.id] && it.kind === 'v' ? data.STAR_MULT : 1; }

    function axisScores(answers, list, defs, stars) {
        var ids = axIds(defs), sum = {}, max = {};
        ids.forEach(function (a) { sum[a] = 0; max[a] = 0; });
        flat(list || data.A_LISTS.xlong).forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (!isNum(v)) return;
            v = clamp(v, -2, 2);
            var m = mult(st, stars);
            Object.keys(st.w || {}).forEach(function (a) {
                if (!(a in sum)) return;
                sum[a] += v * st.w[a] * m;
                max[a] += 2 * Math.abs(st.w[a]) * m;
            });
        });
        var out = {};
        ids.forEach(function (a) { out[a] = max[a] ? (Math.round(clamp(sum[a] / max[a], -1, 1) * 100) || 0) : 0; });
        return out;
    }

    function distance(scores, v, defs) {
        var d = 0;
        axIds(defs).forEach(function (a) { var diff = scores[a] / 100 - (v[a] || 0); d += diff * diff; });
        return Math.sqrt(d);
    }

    // A legközelebbi tréfás típus + az illeszkedés százaléka. Több tengelynél a távolság nagyobb, ezért skálázzuk (5 tengelynél 2,2).
    function classify(scores, defs) {
        defs = defs || data;
        var scale = 2.2 * Math.sqrt(defs.AXES.length / 5);
        var ranking = [];
        // A bias > 1: az „átlagos” típust (mindenhol középen) kicsit nehezebb elérni, különben mindenki oda csúszna.
        defs.ARCHETYPES.forEach(function (ar) { ranking.push({ id: ar.id, d: distance(scores, ar.v, defs) * (ar.bias || 1) }); });
        ranking.sort(function (a, b) { return a.d - b.d; });
        return {
            id: ranking[0].id, fit: clamp(Math.round(100 * (1 - ranking[0].d / scale)), 5, 99), ranking: ranking,
            second: ranking[1].id, margin: (ranking[1].d - ranking[0].d) / scale
        };
    }

    // ---------- Utált értékek, tükörpárok ----------
    // picks: a pároknál választott (leginkább utált) érték azonosítója, a HATED_PAIRS sorrendjében
    function hatedResult(picks) {
        var count = {};
        data.HATED.forEach(function (h) { count[h.id] = 0; });
        (picks || []).forEach(function (id) { if (id in count) count[id]++; });
        var list = data.HATED.map(function (h, i) { return { id: h.id, count: count[h.id], i: i }; });
        list.sort(function (a, b) { return b.count - a.count || a.i - b.i; });
        return list;
    }

    // Tükörpárok: picks[i] = 'min' (a kisebbségi oldal lenézése zavart jobban) vagy 'maj' (a többségié).
    // Témánként -100..100: pozitív = a kisebbség lenézése zavar jobban, negatív = a többségé.
    function mirrorResult(picks) {
        var cnt = {}, tot = {};
        data.TOPICS.forEach(function (t) { cnt[t.id] = 0; tot[t.id] = 0; });
        data.MIRROR.forEach(function (m, i) {
            var p = picks ? picks[i] : null;
            if (p !== 'min' && p !== 'maj') return;
            tot[m.topic]++;
            cnt[m.topic] += p === 'min' ? 1 : -1;
        });
        var out = {};
        data.TOPICS.forEach(function (t) { out[t.id] = tot[t.id] ? Math.round(cnt[t.id] / tot[t.id] * 100) : 0; });
        return out;
    }

    // ---------- Skálák: utált értékek és előítélet-barométer ----------
    // Skála 0..100: 50 = semleges. A tétel h (vagy g) súlya pozitív, ha az egyetértés azt jelenti, hogy az érték jobban zavar.
    var SHRINK = 2;
    function scaleScores(answers, list, defs, key) {
        var sum = {}, max = {};
        defs.forEach(function (h) { sum[h.id] = 0; max[h.id] = 0; });
        (list || data.ALL).forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (!isNum(v)) return;
            v = clamp(v, -2, 2);
            Object.keys(st[key] || {}).forEach(function (id) {
                if (!(id in sum)) return;
                sum[id] += v * st[key][id];
                max[id] += 2 * Math.abs(st[key][id]);
            });
        });
        var out = {};
        // A skálák kevés tételből épülnek, ezért az érték az 50 felé "húzódik": két tételből nem lehet 100 vagy 0.
        // pont = 50 + 50 × Σ(válasz × súly) / (Σ 2|súly| + SHRINK)
        defs.forEach(function (h) { out[h.id] = max[h.id] ? Math.round(50 + 50 * clamp(sum[h.id] / (max[h.id] + SHRINK), -1, 1)) : 50; });
        return out;
    }
    function hatedScales(answers, list, defs) { return scaleScores(answers, list, defs || data.HATED, 'h'); }
    function prejScales(answers, list) { return scaleScores(answers, list, data.PREJ, 'g'); }

    // Csökkenő sorrend, azonos értéknél az eredeti sorrend marad
    function hatedRanking(scales, defs) {
        var list = (defs || data.HATED).map(function (h, i) { return { id: h.id, score: scales[h.id], i: i }; });
        list.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
        return list;
    }

    // A legzavaróbb értékek: csak ami tényleg a semleges fölött van
    function hatedTop(scales, n, defs) {
        return hatedRanking(scales, defs).filter(function (x) { return x.score >= 58; }).slice(0, n || 2).map(function (x) { return x.id; });
    }

    // ---------- Őszinteség ----------
    // a) lehetetlen "soha/mindig" állítások, b) ellentmondó ikerpárok, c) mindenre ugyanazt nyomta.
    // Szórakoztató ellenőrzés, nem igazi hazugságvizsgálat.
    var LIE_PENALTY = 12, TWIN_PENALTY = 10, STRAIGHT_PENALTY = 30, STRAIGHT_MIN = 30;

    function honesty(answers, list, twins) {
        list = list || data.A_LISTS.xlong;
        twins = twins || data.twinsIn(list);
        var lies = [], contra = [], total = 0, answered = 0, counts = {};
        list.forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (!isNum(v)) return;
            v = clamp(Math.round(v), -2, 2);
            answered++; counts[v] = (counts[v] || 0) + 1;
            if (st.lie) {
                // expect 'no' (alapértelmezett): lehetetlen állítás, az egyetértés gyanús; expect 'yes': mindenkivel megtörtént dolog, a tagadás gyanús
                var yes = st.expect === 'yes', bad = yes ? v <= -1 : v >= 1;
                if (bad) {
                    var p = Math.abs(v) === 2 ? 1 : 0.6;
                    lies.push({ id: st.id, v: v, expect: yes ? 'yes' : 'no' });
                    total += LIE_PENALTY * p;
                }
            }
        });
        twins.forEach(function (pair) {
            var a = answers ? answers[pair[0]] : null, b = answers ? answers[pair[1]] : null;
            if (!isNum(a) || !isNum(b)) return;
            if (a >= 1 && b >= 1) {
                var p = Math.min(a, b) === 2 ? 1 : 0.6;
                contra.push({ a: pair[0], b: pair[1], va: a, vb: b });
                total += TWIN_PENALTY * p;
            }
        });
        // "Mindenre ugyanazt": vagy szinte minden válasz azonos, vagy szinte minden egyetértő (vagy elutasító) oldalon van.
        var straight = false, top = 0, agreeN = (counts[1] || 0) + (counts[2] || 0), disN = (counts[-1] || 0) + (counts[-2] || 0);
        Object.keys(counts).forEach(function (k) { top = Math.max(top, counts[k]); });
        if (answered >= STRAIGHT_MIN && Math.max(top, agreeN, disN) / answered >= 0.85) { straight = true; total += STRAIGHT_PENALTY; }
        var index = Math.round(clamp(100 - total, 0, 100));
        return { index: index, lies: lies, twins: contra, liesN: lies.length, twinsN: contra.length, straight: straight, answered: answered };
    }

    function honestyTier(index) {
        var tiers = data.HONESTY_TIERS;
        for (var i = 0; i < tiers.length; i++) if (index >= tiers[i].min) return tiers[i];
        return tiers[tiers.length - 1];
    }

    // ---------- Megbízhatóság ----------
    // Az eredmény mellé jelzést adunk, ha bizonytalan vagy ellentmondásos. Az indexet több dolog rontja:
    //   - őszinteség-próbák (lehetetlen állítások, ellentmondó ikrek, "mindenre ugyanazt"),
    //   - kihagyott és "közepes" válaszok, amik miatt kevés a támpont,
    //   - tengelyenként: kevés tétel, vagy a + és − irányú válaszok erősen keverednek (ellentmondás),
    //   - a típus nem egyértelmű (két típus majdnem egyforma, vagy gyenge az illeszkedés),
    //   - a skálákon: a közvetlen és a fordított állításra is igent mondott.
    function axisStats(answers, list, ids, stars) {
        var st = {};
        ids.forEach(function (a) { st[a] = { n: 0, pos: 0, neg: 0, max: 0 }; });
        flat(list).forEach(function (it) {
            var v = answers ? answers[it.id] : null;
            if (!isNum(v)) return;
            v = clamp(v, -2, 2);
            var m = mult(it, stars);
            Object.keys(it.w || {}).forEach(function (a) {
                if (!st[a]) return;
                var w = it.w[a], c = v * w * m;
                if (Math.abs(w) >= 0.5) st[a].n++;
                if (c > 0) st[a].pos += c; else st[a].neg -= c;
                st[a].max += 2 * Math.abs(w) * m;
            });
        });
        return st;
    }
    // 0 = bizonytalan (kevés tétel, semleges vagy ellentmondó válaszok), 1 = közepes, 2 = biztos
    function axisLevel(x) {
        var eff = x.pos + x.neg, conflict = eff > 0 ? Math.min(x.pos, x.neg) / eff : 0, engage = x.max > 0 ? eff / x.max : 0;
        if (x.n < 3 || engage < 0.2) return 0;
        if (conflict >= 0.42 && engage >= 0.25) return 0;
        if (conflict >= 0.28 || x.n < 4) return 1;
        return 2;
    }

    // A skálákon ellentmondás: a közvetlen és a fordított állításra is egyetértett (a gyenge, összehasonlító tételeket nem nézzük)
    function scaleConflicts(answers, list, defs, key) {
        var st = {};
        defs.forEach(function (d) { st[d.id] = { pos: 0, neg: 0 }; });
        list.forEach(function (it) {
            var v = answers ? answers[it.id] : null;
            if (!isNum(v)) return;
            v = clamp(v, -2, 2);
            Object.keys(it[key] || {}).forEach(function (id) {
                if (!st[id] || Math.abs(it[key][id]) < 0.9) return;
                var c = v * it[key][id];
                if (c > 0) st[id].pos += c; else st[id].neg -= c;
            });
        });
        var n = 0;
        defs.forEach(function (d) {
            var e = st[d.id].pos + st[d.id].neg;
            if (e >= 1.5 && Math.min(st[d.id].pos, st[d.id].neg) / e >= 0.4) n++;
        });
        return n;
    }

    var REL_BIT = {};
    data.REL_FLAGS.forEach(function (f, i) { REL_BIT[f.id] = i; });

    function relTier(index) {
        var t = data.REL_TIERS;
        for (var i = 0; i < t.length; i++) if (index >= t[i].min) return t[i];
        return t[t.length - 1];
    }

    // ctx: { answers, list (az összes megválaszolt tétel), values (az A lista), mode, s, cls, hon, hasB, scales: {hs, pj}, rounds: {flat, mirrorSplit} }
    function reliability(ctx) {
        var answers = ctx.answers, list = ctx.list, flags = {}, pen = 0;
        var answered = 0, neutral = 0, nonLie = 0;
        list.forEach(function (it) {
            if (it.kind === 'l' || it.kind === 'r') return;
            nonLie++;
            var v = answers ? answers[it.id] : null;
            if (isNum(v)) { answered++; if (Math.round(v) === 0) neutral++; }
        });
        var skipShare = nonLie ? 1 - answered / nonLie : 0;
        var neutralShare = answered ? neutral / answered : 0;
        var hon = ctx.hon;
        if (hon) {
            pen += (100 - hon.index) * 0.9;
            if (hon.straight) flags.straight = true;
            if (hon.liesN) flags.lies = true;
            if (hon.twinsN) flags.twins = true;
        }
        if (skipShare > 0) pen += Math.min(15, skipShare * 60);
        if (skipShare > 0.15) flags.skips = true;
        if (neutralShare > 0.3) pen += Math.min(20, (neutralShare - 0.3) * 70);
        if (neutralShare > 0.4) flags.neutral = true;

        var axes = null;
        if (ctx.s) {
            var st = axisStats(answers, ctx.values, AX, ctx.stars);
            axes = {};
            var weak = 0, mid = 0;
            AX.forEach(function (a) {
                var lv = axisLevel(st[a]);
                axes[a] = lv;
                if (lv === 0) { weak++; pen += 3.5; } else if (lv === 1) { mid++; pen += 1; }
            });
            // Összesített következetesség: a tengelyeken belül mennyire keverednek a + és − irányú válaszok. Következetes válaszoknál ez
            // 0,2 alatt marad, véletlenszerű kattintgatásnál 0,25-0,4 körül van.
            var cs = 0, cn = 0;
            AX.forEach(function (a) { var e = st[a].pos + st[a].neg; if (e > 0) { cs += Math.min(st[a].pos, st[a].neg) / e; cn++; } });
            var incoh = cn ? cs / cn : 0;
            if (incoh > 0.14) pen += Math.min(40, (incoh - 0.14) * 130);
            if (weak >= 3 || weak + mid * 0.5 >= 4.5 || incoh >= 0.22) flags.axes = true;
            if (ctx.cls) {
                if (ctx.cls.margin < 0.06) { flags.mixed = true; pen += 5; }
                if (ctx.cls.fit < 50) { flags.lowfit = true; pen += 6; }
            }
            if (ctx.mode === 'short') { flags.few = true; pen += 4; }
        }
        if (ctx.scales) {
            var sc = scaleConflicts(answers, list, data.HATED, 'h') + scaleConflicts(answers, list, data.PREJ, 'g');
            if (sc >= 2) { flags.scales = true; pen += Math.min(9, sc * 3); } else pen += sc * 1.5;
        }
        if (ctx.rounds) {
            if (ctx.rounds.flat) { flags.flat = true; pen += 3; }
            if (ctx.rounds.mirrorSplit) { flags.mirror = true; pen += 3; }
        }
        var index = Math.round(clamp(100 - pen, 0, 100));
        var out = { index: index, flags: data.REL_FLAGS.map(function (f) { return f.id; }).filter(function (id) { return flags[id]; }) };
        if (axes) out.axes = axes;
        return out;
    }

    // ---------- Összesítők ----------
    // mode: 'short' | 'long' | 'xlong'. answers: id szerint (az A és a B rész tételei is), opts: { b: kész van-e a B rész, picks, mirror }
    // A gyors teszt B része a "melyik zavar jobban" pár és a tükörpár (opts.picks, opts.mirror), a többié a B lista tételei.
    function summarizeValues(mode, answers, opts) {
        opts = opts || {};
        var A = data.A_LISTS[mode], B = data.B_LISTS[mode];
        var stars = cleanStars(opts.stars, mode, A);
        var s = axisScores(answers, A, undefined, stars);
        var cls = classify(s);
        var hon = honesty(answers, A);
        var r = { kind: mode, ver: data.VERSION, s: s, a: cls.id, a2: cls.second, fit: cls.fit, honesty: hon };
        if (Object.keys(stars).length) r.starred = Object.keys(stars);
        var list = A.slice(), rounds = null, hasScales = false;
        if (opts.b) {
            if (mode === 'short') {
                var picks = opts.picks || [], mir = opts.mirror || [];
                var hr = hatedResult(picks), cnt = {};
                hr.forEach(function (x) { cnt[x.id] = x.count; });
                r.h = hr.filter(function (x) { return x.count > 0; }).slice(0, 2).map(function (x) { return x.id; });
                r.m = mirrorResult(mir);
                var split = data.TOPICS.filter(function (t) { return r.m[t.id] === 0; }).length;
                rounds = { flat: hr.length > 0 && hr[0].count < 2, mirrorSplit: mir.length > 0 && split >= 3 };
            } else {
                list = A.concat(B);
                r.hs = hatedScales(answers, list);
                r.pj = prejScales(answers, list);
                r.h = hatedTop(r.hs, 2);
                hasScales = true;
            }
        }
        r.rel = reliability({ answers: answers, list: list, values: A, stars: stars, mode: mode, s: s, cls: cls, hon: hon, scales: hasScales, rounds: rounds });
        return r;
    }

    // A fontosnak jelölt kérdések: csak az A lista értékállításai, módonként legfeljebb data.STARS[mode] darab
    function cleanStars(stars, mode, A) {
        var out = {}, max = data.STARS[mode] || 0, n = 0;
        if (!stars) return out;
        A.forEach(function (it) { if (it.kind === 'v' && stars[it.id] && n < max) { out[it.id] = true; n++; } });
        return out;
    }

    // Csak az utált értékek és az előítélet-barométer (a B rész önállóan)
    function summarizeHated(answers) {
        var B = data.B_LISTS.hlong;
        var hs = hatedScales(answers, B), pj = prejScales(answers, B);
        var hon = honesty(answers, B, []);
        return { kind: 'hlong', ver: data.VERSION, hs: hs, pj: pj, h: hatedTop(hs, 3), rel: reliability({ answers: answers, list: B, hon: hon, scales: true }), honesty: null };
    }

    // Fejlesztői nézet: melyik kérdés hány ponttal járult hozzá az egyes tengelyekhez / skálákhoz.
    // pts = a végső (−100..100 vagy 0..100) érték változása pontban, ahogy az eredmény sávjain látszik.
    function breakdown(answers, list, stars) {
        list = flat(list || data.ALL);
        function collect(defs, key, scale, extra) {
            function mm(it) { return key === 'w' ? mult(it, stars) : 1; }
            var max = {}, items = {};
            defs.forEach(function (d) { max[d.id] = 0; items[d.id] = []; });
            list.forEach(function (st) {
                Object.keys(st[key] || {}).forEach(function (id) {
                    if (id in max) max[id] += 2 * Math.abs(st[key][id]) * mm(st);
                });
            });
            list.forEach(function (st) {
                var v = answers ? answers[st.id] : null;
                var has = isNum(v);
                Object.keys(st[key] || {}).forEach(function (id) {
                    if (!(id in max)) return;
                    var vv = has ? clamp(v, -2, 2) : 0;
                    items[id].push({ id: st.id, text: st.text, v: has ? vv : null, weight: st[key][id] * mm(st), star: mm(st) > 1, rank: st.kind === 'ro', pts: max[id] ? Math.round(scale * vv * st[key][id] * mm(st) / (max[id] + extra) * 10) / 10 : 0 });
                });
            });
            defs.forEach(function (d) { items[d.id].sort(function (a, b) { return Math.abs(b.pts) - Math.abs(a.pts) || Math.abs(b.weight) - Math.abs(a.weight); }); });
            return items;
        }
        return {
            axes: collect(data.AXES, 'w', 100, 0),
            hated: collect(data.HATED, 'h', 50, SHRINK),
            prej: collect(data.PREJ, 'g', 50, SHRINK)
        };
    }

    // ---------- Megosztható kódolás ----------
    // Tömör bináris formátum: az eredmény bitekre csomagolva, base64url-ben.
    // A típus és az illeszkedés nem utazik a linkben, az érkező a tengelyekből újraszámolja.
    // Az első bájt: (teszt-verzió << 4) | alsó négy bit.
    //   v3: 0-1. bit = mód (0 gyors, 1 részletes, 2 extra hosszú, 3 csak az utált értékek), 2. bit = a B rész is kész, 3. bit = 0.
    //   v1, v2: 0-1. bit = mód (0 rövid, 1 hosszú, 2 csak-utált rövid, 3 csak-utált hosszú), 2. bit = a rövid eredményben van tükörpár.
    // (A régi, JSON alapú linkek 0x7B-vel kezdődnek, azokat a decode továbbra is érti.)
    function b64uEncBytes(bytes) {
        var bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function b64uDecBytes(t) {
        t = String(t).replace(/-/g, '+').replace(/_/g, '/');
        while (t.length % 4) t += '=';
        var bin = atob(t), bytes = [];
        for (var i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
        return bytes;
    }
    function BitWriter() { this.bits = []; }
    BitWriter.prototype.put = function (val, n) { for (var i = n - 1; i >= 0; i--) this.bits.push((val >> i) & 1); };
    BitWriter.prototype.bytes = function () {
        var out = [], b = this.bits;
        for (var i = 0; i < b.length; i += 8) { var v = 0; for (var j = 0; j < 8; j++) v = (v << 1) | (b[i + j] || 0); out.push(v); }
        return out;
    };
    function BitReader(bytes, from) { this.b = bytes; this.pos = from * 8; this.end = bytes.length * 8; }
    BitReader.prototype.get = function (n) {
        var v = 0;
        for (var i = 0; i < n; i++) { var p = this.pos++; v = (v << 1) | ((this.b[p >> 3] >> (7 - (p & 7))) & 1); }
        return v;
    };

    var TOP_IDS = function () { return data.TOPICS.map(function (t) { return t.id; }); };
    function ax8(v) { return clamp(Math.round(v), -100, 100) + 100; }
    var MODE_BITS = { short: 0, long: 1, xlong: 2, hlong: 3 };
    var MODE_OF = ['short', 'long', 'xlong', 'hlong'];
    var FLAG_N = data.REL_FLAGS.length;

    function putRel(w, rel) {
        w.put(clamp(Math.round(rel.index), 0, 100), 7);
        var mask = 0;
        (rel.flags || []).forEach(function (id) { if (id in REL_BIT) mask |= (1 << REL_BIT[id]); });
        w.put(mask, FLAG_N);
        if (rel.axes) AX.forEach(function (a) { w.put(clamp(rel.axes[a] || 0, 0, 2), 2); });
    }
    function getRel(rd, withAxes) {
        var rel = { index: clamp(rd.get(7), 0, 100), flags: [] };
        var mask = rd.get(FLAG_N);
        data.REL_FLAGS.forEach(function (f, i) { if (mask & (1 << i)) rel.flags.push(f.id); });
        if (withAxes) { rel.axes = {}; AX.forEach(function (a) { rel.axes[a] = Math.min(2, rd.get(2)); }); }
        return rel;
    }

    function encode(sum) {
        var kind = sum.kind || 'short';
        if (!(kind in MODE_BITS)) throw new Error('ismeretlen mód: ' + kind);
        var w = new BitWriter(), hasB = kind === 'hlong' ? false : !!(sum.hs || sum.m || (sum.h && sum.h.length) || sum.pj);
        function putScales(sc, defs) { defs.forEach(function (d) { w.put(clamp(Math.round(sc[d.id]), 0, 100), 7); }); }
        var head = (data.VERSION << 4) | MODE_BITS[kind] | (hasB ? 0x04 : 0);
        if (kind === 'hlong') {
            putScales(sum.hs, data.HATED); putScales(sum.pj, data.PREJ);
            putRel(w, sum.rel);
        } else {
            AX.forEach(function (a) { w.put(ax8(sum.s[a]), 8); });
            putRel(w, sum.rel);
            var hn = sum.honesty || {};
            w.put(clamp(Math.round(hn.index === undefined ? 100 : hn.index), 0, 100), 7);
            w.put(clamp(hn.liesN !== undefined ? hn.liesN : (hn.lies || []).length, 0, 7), 3);
            w.put(clamp(hn.twinsN !== undefined ? hn.twinsN : (hn.twins || []).length, 0, 15), 4);
            if (hasB) {
                if (kind === 'short') {
                    var ids = data.HATED.map(function (h) { return h.id; });
                    for (var i = 0; i < 2; i++) { var ix = sum.h && sum.h[i] ? ids.indexOf(sum.h[i]) : -1; w.put(ix < 0 ? 15 : ix, 4); }
                    TOP_IDS().forEach(function (t) { w.put(ax8(sum.m ? sum.m[t] : 0), 8); });
                } else {
                    putScales(sum.hs, data.HATED); putScales(sum.pj, data.PREJ);
                }
            }
        }
        return b64uEncBytes([head].concat(w.bytes()));
    }

    function decodeV3(bytes) {
        var head = bytes[0];
        if (head & 0x08) return null;
        var kind = MODE_OF[head & 0x03], hasB = (head & 0x04) !== 0;
        if (kind === 'hlong' && hasB) return null;
        var hIds = data.HATED.map(function (h) { return h.id; }), pIds = data.PREJ.map(function (p) { return p.id; });
        var bits;
        if (kind === 'hlong') bits = 70 + 56 + 7 + FLAG_N;
        else {
            bits = AX.length * 8 + 7 + FLAG_N + AX.length * 2 + 14;
            if (hasB) bits += kind === 'short' ? 8 + 32 : 70 + 56;
        }
        if (bytes.length !== 1 + Math.ceil(bits / 8)) return null;
        var rd = new BitReader(bytes, 1);
        function scales(ids) { var o = {}; ids.forEach(function (id) { o[id] = clamp(rd.get(7), 0, 100); }); return o; }
        var out;
        if (kind === 'hlong') {
            var hs = scales(hIds), pj = scales(pIds);
            out = { kind: 'hlong', hs: hs, pj: pj, h: hatedTop(hs, 3), rel: getRel(rd, false) };
        } else {
            var s = {};
            AX.forEach(function (a) { s[a] = clamp(rd.get(8) - 100, -100, 100); });
            var cls = classify(s);
            var rel = getRel(rd, true);
            var idx = clamp(rd.get(7), 0, 100), liesN = rd.get(3), twinsN = rd.get(4);
            out = { kind: kind, s: s, a: cls.id, a2: cls.second, fit: cls.fit, rel: rel, honesty: { index: idx, liesN: Math.min(liesN, 7), twinsN: Math.min(twinsN, 12), straight: rel.flags.indexOf('straight') >= 0 } };
            if (hasB) {
                if (kind === 'short') {
                    var h = [];
                    for (var i = 0; i < 2; i++) { var ix = rd.get(4); if (ix < hIds.length) h.push(hIds[ix]); else if (ix !== 15) return null; }
                    out.h = h;
                    out.m = {};
                    TOP_IDS().forEach(function (t) { out.m[t] = clamp(rd.get(8) - 100, -100, 100); });
                } else {
                    out.hs = scales(hIds); out.pj = scales(pIds); out.h = hatedTop(out.hs, 2);
                }
            }
        }
        out.ver = data.VERSION;
        return out;
    }

    // v1 és v2 bináris linkek: öt tengely, régi típusok, a verzió szerinti utált értékek
    function decodeBinaryOld(bytes, ver) {
        var head = bytes[0];
        var defs = defsFor(ver);
        if (!defs) return null;
        var ids5 = axIds(defs);
        var kind = head & 0x03, hasM = (head & 0x04) !== 0;
        if (kind !== 0 && hasM) return null;
        var hIds = defs.HATED.map(function (h) { return h.id; }), pIds = data.PREJ.map(function (p) { return p.id; });
        var bitsNeeded;
        if (kind === 0) bitsNeeded = 40 + 8 + (hasM ? 32 : 0);
        else if (kind === 1) bitsNeeded = 40 + 70 + 56 + 17;
        else if (kind === 2) bitsNeeded = 30 + 32;
        else bitsNeeded = 70 + 56;
        if (bytes.length !== 1 + Math.ceil(bitsNeeded / 8)) return null;
        var rd = new BitReader(bytes, 1);
        function scales(ids) { var o = {}; ids.forEach(function (id) { o[id] = clamp(rd.get(7), 0, 100); }); return o; }
        function axes() { var o = {}; ids5.forEach(function (a) { o[a] = clamp(rd.get(8) - 100, -100, 100); }); return o; }
        function mirror() { var o = {}; TOP_IDS().forEach(function (t) { o[t] = clamp(rd.get(8) - 100, -100, 100); }); return o; }
        var out;
        if (kind === 0) {
            var s = axes(), c = classify(s, defs);
            var h = [];
            for (var i = 0; i < 2; i++) { var ix = rd.get(4); if (ix < hIds.length) h.push(hIds[ix]); else if (ix !== 15) return null; }
            out = { s: s, a: c.id, fit: c.fit, h: h };
            if (hasM) out.m = mirror();
        } else if (kind === 1) {
            var s1 = axes(), c1 = classify(s1, defs);
            var hs = scales(hIds), pj = scales(pIds);
            var idx = clamp(rd.get(7), 0, 100), liesN = rd.get(3), twinsN = rd.get(3), straight = rd.get(1) === 1;
            out = { kind: 'long', long: true, s: s1, a: c1.id, fit: c1.fit, hs: hs, pj: pj, h: hatedTop(hs, 2, defs.HATED), honesty: { index: idx, liesN: Math.min(liesN, 6), twinsN: Math.min(twinsN, 7), straight: straight } };
        } else if (kind === 2) {
            var counts = {};
            hIds.forEach(function (id) { counts[id] = rd.get(3); });
            var top = defs.HATED.map(function (hh, i) { return { id: hh.id, c: counts[hh.id], i: i }; }).filter(function (x) { return x.c > 0; });
            top.sort(function (a, b) { return b.c - a.c || a.i - b.i; });
            out = { kind: 'hshort', counts: counts, h: top.slice(0, 3).map(function (x) { return x.id; }), m: mirror() };
        } else {
            var hs3 = scales(hIds);
            out = { kind: 'hlong', hs: hs3, pj: scales(pIds), h: hatedTop(hs3, 3, defs.HATED) };
        }
        out.ver = ver;
        return out;
    }

    function numArr(arr, len, lo, hi) {
        if (!Array.isArray(arr) || arr.length !== len) return null;
        var out = [];
        for (var i = 0; i < len; i++) {
            var n = arr[i];
            if (typeof n !== 'number' || !isFinite(n)) return null;
            out.push(Math.round(clamp(n, lo, hi)));
        }
        return out;
    }
    function toObj(ids, vals) { var o = {}; ids.forEach(function (id, i) { o[id] = vals[i]; }); return o; }

    // Idegen kéz is írhatta a linket: csak ismert azonosítókat és tartományon belüli számokat fogadunk el
    function decodeLegacy(text) {
        try {
            var o = JSON.parse(text);
            if (!o || typeof o !== 'object') return null;
            var defs = defsFor(1);
            if (!defs) return null;
            var ids5 = axIds(defs);
            var hIds = defs.HATED.map(function (h) { return h.id; }), pIds = data.PREJ.map(function (p) { return p.id; });
            if (o.v === 3 && (o.k === 'hl' || o.k === 'hs')) {
                if (o.k === 'hl') {
                    var hv = numArr(o.hs, hIds.length, 0, 100), pv = numArr(o.pj, pIds.length, 0, 100);
                    if (!hv || !pv) return null;
                    var hs0 = toObj(hIds, hv);
                    return { kind: 'hlong', hs: hs0, pj: toObj(pIds, pv), h: hatedTop(hs0, 3, defs.HATED), ver: 1 };
                }
                var cv = numArr(o.c, hIds.length, 0, 6), mv = numArr(o.m, data.TOPICS.length, -100, 100);
                if (!cv || !mv) return null;
                var counts = toObj(hIds, cv);
                var top = defs.HATED.map(function (h, i) { return { id: h.id, c: counts[h.id], i: i }; }).filter(function (x) { return x.c > 0; });
                top.sort(function (a, b) { return b.c - a.c || a.i - b.i; });
                return { kind: 'hshort', counts: counts, h: top.slice(0, 3).map(function (x) { return x.id; }), m: toObj(TOP_IDS(), mv), ver: 1 };
            }
            if (!(o.v === 1 || o.v === 2 || (o.v === 3 && o.k === 'l')) || !Array.isArray(o.s) || o.s.length !== ids5.length) return null;
            var s = {};
            for (var i = 0; i < ids5.length; i++) {
                var n = o.s[i];
                if (typeof n !== 'number' || !isFinite(n)) return null;
                s[ids5[i]] = Math.round(clamp(n, -100, 100));
            }
            if (!defs.ARCHETYPES.some(function (a) { return a.id === o.a; })) return null;
            var fit = typeof o.f === 'number' && isFinite(o.f) ? Math.round(clamp(o.f, 5, 99)) : 50;
            if (o.v === 2 || o.v === 3) {
                var hv2 = numArr(o.hs, hIds.length, 0, 100);
                if (!hv2) return null;
                var kRaw = o.v === 3 ? o.kk : o.k;
                if (!Array.isArray(kRaw) || kRaw.length !== 3) return null;
                if (typeof o.i !== 'number' || !isFinite(o.i)) return null;
                var kk = kRaw.map(function (n) { return typeof n === 'number' && isFinite(n) ? Math.round(n) : NaN; });
                if (kk.some(isNaN)) return null;
                var hs = toObj(hIds, hv2), pj = null;
                if (o.v === 3) {
                    var pv3 = numArr(o.pj, pIds.length, 0, 100);
                    if (!pv3) return null;
                    pj = toObj(pIds, pv3);
                }
                var r = {
                    kind: 'long', long: true, s: s, a: o.a, fit: fit, hs: hs, h: hatedTop(hs, 2, defs.HATED), ver: 1,
                    honesty: { index: Math.round(clamp(o.i, 0, 100)), liesN: clamp(kk[0], 0, 6), twinsN: clamp(kk[1], 0, 7), straight: kk[2] === 1 }
                };
                if (pj) r.pj = pj;
                return r;
            }
            var known = {};
            defs.HATED.forEach(function (h) { known[h.id] = true; });
            var h = (Array.isArray(o.h) ? o.h : []).filter(function (id) { return known[id]; }).slice(0, 2);
            var out = { s: s, a: o.a, fit: fit, h: h, ver: 1 };
            if (Array.isArray(o.m)) { var m = numArr(o.m, data.TOPICS.length, -100, 100); if (m) out.m = toObj(TOP_IDS(), m); }
            return out;
        } catch (e) { return null; }
    }

    function decode(code) {
        try {
            var bytes = b64uDecBytes(code);
            if (!bytes.length) return null;
            if (bytes[0] === 0x7B) return decodeLegacy(new TextDecoder().decode(new Uint8Array(bytes)));
            var ver = bytes[0] >> 4;
            if (ver === data.VERSION) return decodeV3(bytes);
            if (ver === 1 || ver === 2) return decodeBinaryOld(bytes, ver);
            return null;
        } catch (e) { return null; }
    }

    function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    var api = {
        defsFor: defsFor, hatedDefsFor: hatedDefsFor, axisScores: axisScores, flat: flat, classify: classify, distance: distance,
        hatedResult: hatedResult, mirrorResult: mirrorResult, hatedScales: hatedScales, prejScales: prejScales, hatedRanking: hatedRanking, hatedTop: hatedTop,
        honesty: honesty, honestyTier: honestyTier, reliability: reliability, relTier: relTier, axisStats: axisStats, axisLevel: axisLevel, scaleConflicts: scaleConflicts,
        summarizeValues: summarizeValues, summarizeHated: summarizeHated, breakdown: breakdown, encode: encode, decode: decode, find: find
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
