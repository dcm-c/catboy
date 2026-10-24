// =========================================================
// ÉRTÉKTEST - pontozás, besorolás, megosztható kódolás (tiszta függvények, Node-ban tesztelhető)
// =========================================================
(function (root) {
    'use strict';

    var data = (typeof module !== 'undefined' && module.exports) ? require('./ertektest-data.js') : root.MFSZErtek.data;
    var AX = data.AXES.map(function (a) { return a.id; });

    function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

    // answers: { állításId: -2..2 | null }. A null (passz) nem számít bele, a 0 ("nem tudom / közepes") igen.
    // Tengelyenként a súlyozott átlag, -100..100 között.
    function axisScores(answers, list) {
        var sum = {}, max = {};
        AX.forEach(function (a) { sum[a] = 0; max[a] = 0; });
        (list || data.STATEMENTS).forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (typeof v !== 'number' || isNaN(v)) return;
            v = clamp(v, -2, 2);
            Object.keys(st.w || {}).forEach(function (a) {
                if (!(a in sum)) return;
                sum[a] += v * st.w[a];
                max[a] += 2 * Math.abs(st.w[a]);
            });
        });
        var out = {};
        AX.forEach(function (a) { out[a] = max[a] ? Math.round(clamp(sum[a] / max[a], -1, 1) * 100) : 0; });
        return out;
    }

    function distance(scores, v) {
        var d = 0;
        AX.forEach(function (a) { var diff = scores[a] / 100 - (v[a] || 0); d += diff * diff; });
        return Math.sqrt(d);
    }

    // A legközelebbi tréfás típus + az illeszkedés százaléka
    function classify(scores) {
        var best = null, bestD = Infinity, ranking = [];
        data.ARCHETYPES.forEach(function (ar) {
            var d = distance(scores, ar.v);
            ranking.push({ id: ar.id, d: d });
            if (d < bestD) { bestD = d; best = ar; }
        });
        ranking.sort(function (a, b) { return a.d - b.d; });
        return { id: best.id, fit: clamp(Math.round(100 * (1 - bestD / 2.2)), 5, 99), ranking: ranking };
    }

    // picks: a pároknál választott (leginkább utált) érték azonosítója, a HATED_PAIRS sorrendjében
    function hatedResult(picks) {
        var count = {};
        data.HATED.forEach(function (h) { count[h.id] = 0; });
        (picks || []).forEach(function (id) { if (id in count) count[id]++; });
        var list = data.HATED.map(function (h, i) { return { id: h.id, count: count[h.id], i: i }; });
        list.sort(function (a, b) { return b.count - a.count || a.i - b.i; });
        return list;
    }

    function summarize(answers, picks) {
        var s = axisScores(answers);
        var c = classify(s);
        var h = hatedResult(picks).filter(function (x) { return x.count > 0; }).slice(0, 2).map(function (x) { return x.id; });
        return { s: s, a: c.id, fit: c.fit, h: h };
    }


    // ---------- HOSSZÚ TESZT: utált-érték skálák + őszinteség-vizsgáló ----------
    // Skála 0..100: 50 = semleges. A statement.h súlya pozitív, ha az egyetértés azt jelenti, hogy az érték jobban zavar.
    function hatedScales(answers, list) {
        var sum = {}, max = {};
        data.HATED.forEach(function (h) { sum[h.id] = 0; max[h.id] = 0; });
        (list || data.LONG).forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (typeof v !== 'number' || isNaN(v)) return;
            v = clamp(v, -2, 2);
            Object.keys(st.h || {}).forEach(function (id) {
                if (!(id in sum)) return;
                sum[id] += v * st.h[id];
                max[id] += 2 * Math.abs(st.h[id]);
            });
        });
        var out = {};
        data.HATED.forEach(function (h) { out[h.id] = max[h.id] ? Math.round((clamp(sum[h.id] / max[h.id], -1, 1) + 1) * 50) : 50; });
        return out;
    }

    // Csökkenő sorrend, azonos értéknél az eredeti sorrend marad
    function hatedRanking(scales) {
        var list = data.HATED.map(function (h, i) { return { id: h.id, score: scales[h.id], i: i }; });
        list.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
        return list;
    }

    // A legzavaróbb értékek: csak ami tényleg a semleges fölött van
    function hatedTop(scales, n) {
        return hatedRanking(scales).filter(function (x) { return x.score >= 58; }).slice(0, n || 2).map(function (x) { return x.id; });
    }

    // Őszinteség: a) lehetetlen "soha/mindig" állítások, b) ellentmondó ikerpárok, c) mindenre ugyanazt nyomta.
    // Szórakoztató ellenőrzés, nem igazi hazugságvizsgálat.
    var LIE_PENALTY = 12, TWIN_PENALTY = 10, STRAIGHT_PENALTY = 30;

    function honesty(answers, list, twins) {
        list = list || data.LONG; twins = twins || data.TWINS;
        var lies = [], contra = [], total = 0, answered = 0, counts = {};
        list.forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (typeof v !== 'number' || isNaN(v)) return;
            v = clamp(Math.round(v), -2, 2);
            answered++; counts[v] = (counts[v] || 0) + 1;
            if (st.lie && v >= 1) {
                var p = v === 2 ? 1 : 0.6;
                lies.push({ id: st.id, v: v });
                total += LIE_PENALTY * p;
            }
        });
        twins.forEach(function (pair) {
            var a = answers ? answers[pair[0]] : null, b = answers ? answers[pair[1]] : null;
            if (typeof a !== 'number' || typeof b !== 'number' || isNaN(a) || isNaN(b)) return;
            if (a >= 1 && b >= 1) {
                var p = Math.min(a, b) === 2 ? 1 : 0.6;
                contra.push({ a: pair[0], b: pair[1], va: a, vb: b });
                total += TWIN_PENALTY * p;
            }
        });
        var straight = false, top = 0;
        Object.keys(counts).forEach(function (k) { top = Math.max(top, counts[k]); });
        if (answered >= 40 && top / answered >= 0.85) { straight = true; total += STRAIGHT_PENALTY; }
        var index = Math.round(clamp(100 - total, 0, 100));
        return { index: index, lies: lies, twins: contra, liesN: lies.length, twinsN: contra.length, straight: straight, answered: answered };
    }

    function honestyTier(index) {
        var tiers = data.HONESTY_TIERS;
        for (var i = 0; i < tiers.length; i++) if (index >= tiers[i].min) return tiers[i];
        return tiers[tiers.length - 1];
    }

    function summarizeLong(answers) {
        var s = axisScores(answers, data.LONG);
        var c = classify(s);
        var hs = hatedScales(answers);
        return { s: s, a: c.id, fit: c.fit, hs: hs, h: hatedTop(hs, 2), honesty: honesty(answers), long: true };
    }

    // ---------- Megosztható kódolás: {v:1, s:[e,l,n,t,c], a:típus, f:illeszkedés, h:[érték,érték]} base64url-ben ----------
    function b64uEnc(str) {
        var bytes = new TextEncoder().encode(str), bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function b64uDec(t) {
        t = String(t).replace(/-/g, '+').replace(/_/g, '/');
        while (t.length % 4) t += '=';
        var bin = atob(t), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    function encode(sum) {
        if (sum.long) {
            var hn = sum.honesty || {};
            return b64uEnc(JSON.stringify({
                v: 2, s: AX.map(function (a) { return sum.s[a]; }), a: sum.a, f: sum.fit,
                hs: data.HATED.map(function (h) { return sum.hs[h.id]; }),
                i: hn.index, k: [(hn.lies || []).length, (hn.twins || []).length, hn.straight ? 1 : 0]
            }));
        }
        return b64uEnc(JSON.stringify({ v: 1, s: AX.map(function (a) { return sum.s[a]; }), a: sum.a, f: sum.fit, h: sum.h }));
    }

    // Idegen kéz is írhatta a linket: csak ismert azonosítókat és tartományon belüli számokat fogadunk el
    function decode(code) {
        try {
            var o = JSON.parse(b64uDec(code));
            if (!o || (o.v !== 1 && o.v !== 2) || !Array.isArray(o.s) || o.s.length !== AX.length) return null;
            var s = {};
            for (var i = 0; i < AX.length; i++) {
                var n = o.s[i];
                if (typeof n !== 'number' || !isFinite(n)) return null;
                s[AX[i]] = Math.round(clamp(n, -100, 100));
            }
            if (!data.ARCHETYPES.some(function (a) { return a.id === o.a; })) return null;
            var known = {};
            data.HATED.forEach(function (h) { known[h.id] = true; });
            if (o.v === 2) {
                if (!Array.isArray(o.hs) || o.hs.length !== data.HATED.length || !Array.isArray(o.k) || o.k.length !== 3) return null;
                var hs = {};
                for (var j = 0; j < data.HATED.length; j++) {
                    var x = o.hs[j];
                    if (typeof x !== 'number' || !isFinite(x)) return null;
                    hs[data.HATED[j].id] = Math.round(clamp(x, 0, 100));
                }
                if (typeof o.i !== 'number' || !isFinite(o.i)) return null;
                var kk = o.k.map(function (n) { return typeof n === 'number' && isFinite(n) ? Math.round(n) : NaN; });
                if (kk.some(isNaN)) return null;
                var fit2 = typeof o.f === 'number' && isFinite(o.f) ? Math.round(clamp(o.f, 5, 99)) : 50;
                var index = Math.round(clamp(o.i, 0, 100));
                return {
                    long: true, s: s, a: o.a, fit: fit2, hs: hs, h: hatedTop(hs, 2),
                    honesty: { index: index, liesN: clamp(kk[0], 0, 6), twinsN: clamp(kk[1], 0, 7), straight: kk[2] === 1 }
                };
            }
            var h = (Array.isArray(o.h) ? o.h : []).filter(function (id) { return known[id]; }).slice(0, 2);
            var fit = typeof o.f === 'number' && isFinite(o.f) ? Math.round(clamp(o.f, 5, 99)) : 50;
            return { s: s, a: o.a, fit: fit, h: h };
        } catch (e) { return null; }
    }

    function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    var api = { hatedScales: hatedScales, hatedRanking: hatedRanking, hatedTop: hatedTop, honesty: honesty, honestyTier: honestyTier, summarizeLong: summarizeLong, axisScores: axisScores, classify: classify, hatedResult: hatedResult, summarize: summarize, encode: encode, decode: decode, find: find, distance: distance };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
