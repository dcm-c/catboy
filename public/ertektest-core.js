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

    function summarize(answers, picks, mirrorPicks) {
        var s = axisScores(answers);
        var c = classify(s);
        var h = hatedResult(picks).filter(function (x) { return x.count > 0; }).slice(0, 2).map(function (x) { return x.id; });
        var r = { s: s, a: c.id, fit: c.fit, h: h };
        if (mirrorPicks && mirrorPicks.length) r.m = mirrorResult(mirrorPicks);
        return r;
    }

    // Csak az utált-érték teszt rövid változata: a párok és a tükörpárok
    function summarizeHatedShort(picks, mirrorPicks) {
        var list = hatedResult(picks);
        var counts = {};
        list.forEach(function (x) { counts[x.id] = x.count; });
        return { kind: 'hshort', counts: counts, h: list.filter(function (x) { return x.count > 0; }).slice(0, 3).map(function (x) { return x.id; }), m: mirrorResult(mirrorPicks) };
    }


    // ---------- HOSSZÚ TESZT: utált-érték skálák + őszinteség-vizsgáló ----------
    // Skála 0..100: 50 = semleges. A statement.h súlya pozitív, ha az egyetértés azt jelenti, hogy az érték jobban zavar.
    var SHRINK = 2;
    function scaleScores(answers, list, defs, key) {
        var sum = {}, max = {};
        defs.forEach(function (h) { sum[h.id] = 0; max[h.id] = 0; });
        (list || data.LONG).forEach(function (st) {
            var v = answers ? answers[st.id] : null;
            if (typeof v !== 'number' || isNaN(v)) return;
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
    function hatedScales(answers, list) { return scaleScores(answers, list, data.HATED, 'h'); }
    // Előítélet-barométer (csak a hosszú teszt B részében): 8 skála, 50 = semleges
    function prejScales(answers, list) { return scaleScores(answers, list, data.PREJ, 'g'); }

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
        // "Mindenre ugyanazt": vagy szinte minden válasz azonos, vagy szinte minden egyetértő (vagy elutasító) oldalon van.
        var straight = false, top = 0, agreeN = (counts[1] || 0) + (counts[2] || 0), disN = (counts[-1] || 0) + (counts[-2] || 0);
        Object.keys(counts).forEach(function (k) { top = Math.max(top, counts[k]); });
        if (answered >= 40 && Math.max(top, agreeN, disN) / answered >= 0.85) { straight = true; total += STRAIGHT_PENALTY; }
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
        return { kind: 'long', s: s, a: c.id, fit: c.fit, hs: hs, pj: prejScales(answers), h: hatedTop(hs, 2), honesty: honesty(answers), long: true };
    }

    // Csak az utált-érték teszt hosszú változata (a B rész): nincs tengely és típus
    function summarizeHatedLong(answers) {
        var hs = hatedScales(answers, data.LONG_B);
        return { kind: 'hlong', hs: hs, pj: prejScales(answers, data.LONG_B), h: hatedTop(hs, 3) };
    }

    // Fejlesztői nézet: melyik kérdés hány ponttal járult hozzá az egyes tengelyekhez / skálákhoz.
    // pts = a végső (−100..100 vagy 0..100) érték változása pontban, ahogy az eredmény sávjain látszik.
    function breakdown(answers, list) {
        list = list || data.LONG;
        function collect(defs, key, mult, extra) {
            var max = {}, items = {};
            defs.forEach(function (d) { max[d.id] = 0; items[d.id] = []; });
            list.forEach(function (st) {
                Object.keys(st[key] || {}).forEach(function (id) {
                    if (id in max) max[id] += 2 * Math.abs(st[key][id]);
                });
            });
            list.forEach(function (st) {
                var v = answers ? answers[st.id] : null;
                var has = typeof v === 'number' && !isNaN(v);
                Object.keys(st[key] || {}).forEach(function (id) {
                    if (!(id in max)) return;
                    var vv = has ? clamp(v, -2, 2) : 0;
                    items[id].push({ id: st.id, text: st.text, v: has ? vv : null, weight: st[key][id], pts: max[id] ? Math.round(mult * vv * st[key][id] / (max[id] + extra) * 10) / 10 : 0 });
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
    // Tömör bináris formátum: az eredmény bitekre csomagolva, base64url-ben (kb. 16-32 karakter).
    // A típus és az illeszkedés nem utazik a linkben, az érkező a tengelyekből újraszámolja.
    // Az első bájt: 0x10 | mód (0 rövid, 1 hosszú, 2 csak-utált rövid, 3 csak-utált hosszú) | 0x04 ha a rövid eredményben van tükörpár.
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
    // a hátralévő üres bitek legfeljebb 7 darab, mind nulla lehet
    BitReader.prototype.tidy = function (bitsUsed) { return this.pos - this.b.length * 8 <= 0 && (this.b.length * 8 - this.pos) < 8; };

    var TOP_IDS = function () { return data.TOPICS.map(function (t) { return t.id; }); };
    function ax8(v) { return clamp(Math.round(v), -100, 100) + 100; }

    function encode(sum) {
        var kind = sum.kind || (sum.long ? 'long' : 'short');
        var w = new BitWriter(), head;
        function putScales(sc, defs) { defs.forEach(function (d) { w.put(clamp(Math.round(sc[d.id]), 0, 100), 7); }); }
        if (kind === 'long') {
            head = 0x11;
            AX.forEach(function (a) { w.put(ax8(sum.s[a]), 8); });
            putScales(sum.hs, data.HATED); putScales(sum.pj, data.PREJ);
            var hn = sum.honesty || {};
            w.put(clamp(Math.round(hn.index), 0, 100), 7);
            w.put(clamp((hn.lies || []).length, 0, 7), 3);
            w.put(clamp((hn.twins || []).length, 0, 7), 3);
            w.put(hn.straight ? 1 : 0, 1);
        } else if (kind === 'hlong') {
            head = 0x13;
            putScales(sum.hs, data.HATED); putScales(sum.pj, data.PREJ);
        } else if (kind === 'hshort') {
            head = 0x12;
            data.HATED.forEach(function (h) { w.put(clamp(sum.counts[h.id] || 0, 0, 7), 3); });
            TOP_IDS().forEach(function (t) { w.put(ax8(sum.m ? sum.m[t] : 0), 8); });
        } else {
            head = 0x10 | (sum.m ? 0x04 : 0);
            AX.forEach(function (a) { w.put(ax8(sum.s[a]), 8); });
            var ids = data.HATED.map(function (h) { return h.id; });
            for (var i = 0; i < 2; i++) { var ix = sum.h && sum.h[i] ? ids.indexOf(sum.h[i]) : -1; w.put(ix < 0 ? 15 : ix, 4); }
            if (sum.m) TOP_IDS().forEach(function (t) { w.put(ax8(sum.m[t]), 8); });
        }
        return b64uEncBytes([head].concat(w.bytes()));
    }

    function decodeBinary(bytes) {
        var head = bytes[0];
        if ((head & 0xF0) !== 0x10) return null;
        var kind = head & 0x03, hasM = (head & 0x04) !== 0;
        if (kind !== 0 && hasM) return null;
        var hIds = data.HATED.map(function (h) { return h.id; }), pIds = data.PREJ.map(function (p) { return p.id; });
        var bitsNeeded;
        if (kind === 0) bitsNeeded = 40 + 8 + (hasM ? 32 : 0);
        else if (kind === 1) bitsNeeded = 40 + 70 + 56 + 17;
        else if (kind === 2) bitsNeeded = 30 + 32;
        else bitsNeeded = 70 + 56;
        if (bytes.length !== 1 + Math.ceil(bitsNeeded / 8)) return null;
        var rd = new BitReader(bytes, 1);
        function scales(ids) { var o = {}; ids.forEach(function (id) { o[id] = clamp(rd.get(7), 0, 100); }); return o; }
        function axes() { var o = {}; AX.forEach(function (a) { o[a] = clamp(rd.get(8) - 100, -100, 100); }); return o; }
        function mirror() { var o = {}; TOP_IDS().forEach(function (t) { o[t] = clamp(rd.get(8) - 100, -100, 100); }); return o; }
        var out;
        if (kind === 0) {
            var s = axes(), c = classify(s);
            var h = [];
            for (var i = 0; i < 2; i++) { var ix = rd.get(4); if (ix < hIds.length) h.push(hIds[ix]); else if (ix !== 15) return null; }
            out = { s: s, a: c.id, fit: c.fit, h: h };
            if (hasM) out.m = mirror();
        } else if (kind === 1) {
            var s1 = axes(), c1 = classify(s1);
            var hs = scales(hIds), pj = scales(pIds);
            var idx = clamp(rd.get(7), 0, 100), liesN = rd.get(3), twinsN = rd.get(3), straight = rd.get(1) === 1;
            out = { kind: 'long', long: true, s: s1, a: c1.id, fit: c1.fit, hs: hs, pj: pj, h: hatedTop(hs, 2), honesty: { index: idx, liesN: Math.min(liesN, 6), twinsN: Math.min(twinsN, 7), straight: straight } };
        } else if (kind === 2) {
            var counts = {};
            hIds.forEach(function (id) { counts[id] = rd.get(3); });
            var top = data.HATED.map(function (hh, i) { return { id: hh.id, c: counts[hh.id], i: i }; }).filter(function (x) { return x.c > 0; });
            top.sort(function (a, b) { return b.c - a.c || a.i - b.i; });
            out = { kind: 'hshort', counts: counts, h: top.slice(0, 3).map(function (x) { return x.id; }), m: mirror() };
        } else {
            var hs3 = scales(hIds);
            out = { kind: 'hlong', hs: hs3, pj: scales(pIds), h: hatedTop(hs3, 3) };
        }
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
            var hIds = data.HATED.map(function (h) { return h.id; }), pIds = data.PREJ.map(function (p) { return p.id; });
            if (o.v === 3 && (o.k === 'hl' || o.k === 'hs')) {
                if (o.k === 'hl') {
                    var hv = numArr(o.hs, hIds.length, 0, 100), pv = numArr(o.pj, pIds.length, 0, 100);
                    if (!hv || !pv) return null;
                    var hs0 = toObj(hIds, hv);
                    return { kind: 'hlong', hs: hs0, pj: toObj(pIds, pv), h: hatedTop(hs0, 3) };
                }
                var cv = numArr(o.c, hIds.length, 0, 6), mv = numArr(o.m, data.TOPICS.length, -100, 100);
                if (!cv || !mv) return null;
                var counts = toObj(hIds, cv);
                var top = data.HATED.map(function (h, i) { return { id: h.id, c: counts[h.id], i: i }; }).filter(function (x) { return x.c > 0; });
                top.sort(function (a, b) { return b.c - a.c || a.i - b.i; });
                return { kind: 'hshort', counts: counts, h: top.slice(0, 3).map(function (x) { return x.id; }), m: toObj(TOP_IDS(), mv) };
            }
            if (!(o.v === 1 || o.v === 2 || (o.v === 3 && o.k === 'l')) || !Array.isArray(o.s) || o.s.length !== AX.length) return null;
            var s = {};
            for (var i = 0; i < AX.length; i++) {
                var n = o.s[i];
                if (typeof n !== 'number' || !isFinite(n)) return null;
                s[AX[i]] = Math.round(clamp(n, -100, 100));
            }
            if (!data.ARCHETYPES.some(function (a) { return a.id === o.a; })) return null;
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
                    kind: 'long', long: true, s: s, a: o.a, fit: fit, hs: hs, h: hatedTop(hs, 2),
                    honesty: { index: Math.round(clamp(o.i, 0, 100)), liesN: clamp(kk[0], 0, 6), twinsN: clamp(kk[1], 0, 7), straight: kk[2] === 1 }
                };
                if (pj) r.pj = pj;
                return r;
            }
            var known = {};
            data.HATED.forEach(function (h) { known[h.id] = true; });
            var h = (Array.isArray(o.h) ? o.h : []).filter(function (id) { return known[id]; }).slice(0, 2);
            var out = { s: s, a: o.a, fit: fit, h: h };
            if (Array.isArray(o.m)) { var m = numArr(o.m, data.TOPICS.length, -100, 100); if (m) out.m = toObj(TOP_IDS(), m); }
            return out;
        } catch (e) { return null; }
    }


    function decode(code) {
        try {
            var bytes = b64uDecBytes(code);
            if (!bytes.length) return null;
            if (bytes[0] === 0x7B) return decodeLegacy(new TextDecoder().decode(new Uint8Array(bytes)));
            return decodeBinary(bytes);
        } catch (e) { return null; }
    }

    function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    var api = { prejScales: prejScales, mirrorResult: mirrorResult, summarizeHatedShort: summarizeHatedShort, summarizeHatedLong: summarizeHatedLong, breakdown: breakdown, hatedScales: hatedScales, hatedRanking: hatedRanking, hatedTop: hatedTop, honesty: honesty, honestyTier: honestyTier, summarizeLong: summarizeLong, axisScores: axisScores, classify: classify, hatedResult: hatedResult, summarize: summarize, encode: encode, decode: decode, find: find, distance: distance };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
