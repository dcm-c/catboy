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
    function axisScores(answers) {
        var sum = {}, max = {};
        AX.forEach(function (a) { sum[a] = 0; max[a] = 0; });
        data.STATEMENTS.forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (typeof v !== 'number' || isNaN(v)) return;
            v = clamp(v, -2, 2);
            Object.keys(st.w).forEach(function (a) {
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
        return b64uEnc(JSON.stringify({ v: 1, s: AX.map(function (a) { return sum.s[a]; }), a: sum.a, f: sum.fit, h: sum.h }));
    }

    // Idegen kéz is írhatta a linket: csak ismert azonosítókat és tartományon belüli számokat fogadunk el
    function decode(code) {
        try {
            var o = JSON.parse(b64uDec(code));
            if (!o || o.v !== 1 || !Array.isArray(o.s) || o.s.length !== AX.length) return null;
            var s = {};
            for (var i = 0; i < AX.length; i++) {
                var n = o.s[i];
                if (typeof n !== 'number' || !isFinite(n)) return null;
                s[AX[i]] = Math.round(clamp(n, -100, 100));
            }
            if (!data.ARCHETYPES.some(function (a) { return a.id === o.a; })) return null;
            var known = {};
            data.HATED.forEach(function (h) { known[h.id] = true; });
            var h = (Array.isArray(o.h) ? o.h : []).filter(function (id) { return known[id]; }).slice(0, 2);
            var fit = typeof o.f === 'number' && isFinite(o.f) ? Math.round(clamp(o.f, 5, 99)) : 50;
            return { s: s, a: o.a, fit: fit, h: h };
        } catch (e) { return null; }
    }

    function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    var api = { axisScores: axisScores, classify: classify, hatedResult: hatedResult, summarize: summarize, encode: encode, decode: decode, find: find, distance: distance };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
