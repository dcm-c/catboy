// =========================================================
// PASZTELL ÉLETÚT - a karakter rajza (SVG): tiszta, lapos, "matricás" stílus
//
// Külön fájl: itt él a rétegelt karakter (haj, arc, test, ruhák, kiegészítők, smink, hangulatok).
// A hátterek és jelenetek az eletut-art.js-ben vannak, azok ezt hívják.
//
// Stílus: egyenletes, a kitöltésnél sötétebb körvonal, sima színek, egyetlen árnyék-sáv, nagyobb fej és nagy,
// egyszerű szem. Semmi színátmenet a testen vagy a ruhán (csak a parókán és a szivárványon).
//
// Koordináták: a talpak közepe az origó (y felfelé negatív), a karakter ~160 egység magas (a haj teteje kb. -160).
//   arc: közép (0,-124), fej ~ ±24.5 széles; szem y=-121; áll y=-98.5; váll y=-90; derék y=-66; csípő y=-52.
// A végtagok "csövek" (vastag vonal két rétegben: körvonal + kitöltés), ezért a ruhaujjak a karral együtt mozognak.
// Minden függvény tiszta szöveget ad (SVG-markup), ezért Node-ban is tesztelhető.
//
// Opciók: { skin, hairStyle, hairColor, outfit:{slot:itemId}, colors:{slot:hex}, makeup:{hely:{style,color}},
//           mood:'neutral|happy|worried|proud', pose:'idle|wave|hips', uid }
// Rétegsorrend: hátsó tárgyak és haj, lábak, cipő, alsó ruha, nyak+törzs, felső, karok és ujjak, nyakdíszek, fej, smink,
//               elülső haj, kiegészítők.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var C = M.char = {};

    var INK = '#3b2d4a';

    // ---------- Színek ----------
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    function toHex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
    function shade(c, amt) {
        var a = hex(c);
        return toHex(a.map(function (v) { return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt; }));
    }
    function mix(a, b, t) {
        var x = hex(a), y = hex(b);
        return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
    }
    C.shade = shade;
    function tint(c, t) { return mix(c, '#ffffff', t); }
    // A körvonal a kitöltés sötétebb, kissé lilás változata (nem fekete): így lesz "rajzolt", nem "kivágott" hatású.
    function ol(c) { return mix(shade(c, -0.3), '#4a3562', 0.35); }
    var K = {};  // az aktuális avatár festhető színei (hely szerint); az avatar() állítja be
    var MK = {}; // az aktuális smink: {hely: {style, color}}; az avatar() állítja be
    function colorOf(list, id, fallback) {
        var f = D && D.find ? D.find(list, id) : null;
        return f ? f.color : fallback;
    }
    var EYES = { rozsa: '#9a5f78', kek: '#3f86b8', feher: '#6f8fbf', fekete: '#5a4638', lila: '#7a5cb0', barna: '#8a5530', szoke: '#4f8f6a' };

    // ---------- Rajzoló segédek ----------
    function n1(v) { return Math.round(v * 10) / 10; }
    function P(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function L(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
    function CI(x, y, r, fill, extra) { return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function EL(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function RC(x, y, w, h, fill, extra) { return '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function mirror(s) { return '<g transform="scale(-1 1)">' + s + '</g>'; }
    function G(s, tr) { return '<g transform="' + tr + '">' + s + '</g>'; }
    // kitöltött alakzat körvonallal
    function SH(d, fill, w) { return P(d, fill, 'stroke="' + ol(fill) + '" stroke-width="' + (w || 1.2) + '" stroke-linejoin="round" stroke-linecap="round"'); }
    function star(cx, cy, r, fill, extra) {
        var d = '';
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ' ' + n1(cy + Math.sin(a) * rr);
        }
        return P(d + 'Z', fill, extra);
    }
    function heart(cx, cy, s, fill, extra) {
        return P('M' + n1(cx) + ' ' + n1(cy + s * 0.9) + ' C' + n1(cx - s * 1.5) + ' ' + n1(cy - s * 0.2) + ' ' + n1(cx - s * 0.9) + ' ' + n1(cy - s * 1.1) + ' ' + n1(cx) + ' ' + n1(cy - s * 0.3) +
            ' C' + n1(cx + s * 0.9) + ' ' + n1(cy - s * 1.1) + ' ' + n1(cx + s * 1.5) + ' ' + n1(cy - s * 0.2) + ' ' + n1(cx) + ' ' + n1(cy + s * 0.9) + 'Z', fill, extra);
    }
    function sparkle(cx, cy, r, fill, extra) {
        return P('M' + n1(cx) + ' ' + n1(cy - r) + ' Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(cx + r) + ' ' + n1(cy) + ' Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(cx) + ' ' + n1(cy + r) +
            ' Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(cx - r) + ' ' + n1(cy) + ' Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(cx) + ' ' + n1(cy - r) + 'Z', fill, extra);
    }

    // ---------- Cső (végtag): körvonal-réteg + kitöltés-réteg ----------
    function qd(p) { return 'M' + p[0][0] + ' ' + p[0][1] + ' Q' + p[1][0] + ' ' + p[1][1] + ' ' + p[2][0] + ' ' + p[2][1]; }
    function lp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    function qsub(p, t) { var a = lp(p[0], p[1], t), b = lp(p[1], p[2], t); return [p[0], a, lp(a, b, t)]; }
    function qpt(p, t) { return lp(lp(p[0], p[1], t), lp(p[1], p[2], t), t); }
    function tubeOut(d, w, fill) { return L(d, ol(fill), w + 2.4); }
    function tubeFill(d, w, fill) { return L(d, fill, w); }
    function tube(d, w, fill) { return tubeOut(d, w, fill) + tubeFill(d, w, fill); }

    // ---------- Törzs-profil ----------
    var TW = [[-97, 4.8], [-94.4, 9], [-92.5, 12.6], [-90, 14.8], [-86, 14.9], [-80, 13.1], [-73, 11.3], [-66, 10], [-59, 10.9], [-52, 12.8], [-49, 12.6]];
    function hw(y) {
        for (var i = 1; i < TW.length; i++) {
            if (y <= TW[i][0]) { var a = TW[i - 1], b = TW[i], t = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; }
        }
        return TW[TW.length - 1][1];
    }
    // a törzs jobb oldali pontjai y0-tól y1-ig (pad: ennyivel szélesebb)
    function side(y0, y1, pad, step) {
        var pts = [], y;
        step = step || 1.6;
        for (y = y0; y < y1; y += step) pts.push([n1(hw(y) + pad), n1(y)]);
        pts.push([n1(hw(y1) + pad), y1]);
        return pts;
    }
    function pd(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(''); }
    function rev(pts) { return pts.slice().reverse().map(function (p) { return [-p[0], p[1]]; }); }
    // zárt törzs-alakzat: jobb oldal le, alul görbe (sag), bal oldal fel, fent nyakkivágás (neckW, neckDip)
    function torsoShape(y0, y1, pad, o) {
        o = o || {};
        var r = side(y0, y1, pad), l = rev(r);
        var sag = o.sag === undefined ? 0 : o.sag;
        var nw = o.neckW === undefined ? 6 : o.neckW, nd = o.neckDip === undefined ? 3 : o.neckDip;
        var d = 'M' + nw + ' ' + y0 + pd(r).replace(/^M/, 'L');
        d += ' Q0 ' + (y1 + sag * 2) + ' ' + l[0][0] + ' ' + l[0][1];
        d += pd(l).replace(/^M[^L]*/, '');
        d += ' L' + (-nw) + ' ' + y0 + ' Q0 ' + (y0 + nd * 2) + ' ' + nw + ' ' + y0 + 'Z';
        return d;
    }
    // jobb oldali árnyék-sáv a törzsön
    function edgeShade(y0, y1, pad, wd, col, op) {
        var o = side(y0, y1, pad), inn = side(y0, y1, pad - wd).reverse();
        return P(pd(o) + pd(inn).replace(/^M/, 'L') + 'Z', col, 'opacity="' + (op || 0.2) + '"');
    }

    // ---------- Pózok (jobb oldali kar, a másik tükrözve vagy üresjáratban) ----------
    var ARMS = {
        idle: [[14.2, -88], [19.8, -70], [18.4, -52.5]],
        wave: [[14.2, -88], [32.5, -83], [31.8, -107]],
        hips: [[14.2, -88], [28.5, -71], [14.6, -57]]
    };
    var HAND_AT = { idle: [18.1, -49.4, 0], wave: [31.8, -110.4, 180], hips: [13, -56, -78] };
    var LEG_T = [[6.6, -53], [6.9, -28], [6.3, -7]]; // jobb láb középvonala: csípő, térd, boka

    // =========================================================
    // DEFS (minták, színátmenetek)
    // =========================================================
    function defs(u, c, kind) {
        var d = '<defs>';
        d += '<pattern id="' + u + '-plaid" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#a9cdee"/><rect width="8" height="2.8" fill="#6f9fd6" opacity=".7"/><rect width="2.8" height="8" fill="#f5a9b8" opacity=".75"/><rect x="5" width=".7" height="8" fill="#fff" opacity=".6"/><rect y="5" width="8" height=".7" fill="#fff" opacity=".6"/></pattern>';
        d += '<pattern id="' + u + '-lace" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 1.6 L1.6 0 L3.2 1.6 L1.6 3.2z" fill="none" stroke="#fff" stroke-width=".5" opacity=".85"/></pattern>';
        d += '<linearGradient id="' + u + '-wig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b4c6"/><stop offset=".55" stop-color="#f4a3b8"/><stop offset="1" stop-color="#9fd2f3"/></linearGradient>';
        d += '<linearGradient id="' + u + '-lipom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + tint(lipColor(), 0.55) + '"/><stop offset="1" stop-color="' + lipColor() + '"/></linearGradient>';
        d += '</defs>';
        return d;
    }

    // =========================================================
    // SMINK-SEGÉDEK
    // =========================================================
    function mk(slot) { return MK[slot] || null; }
    function mkColor(slot, fallback) { var m = MK[slot]; return m && m.color ? m.color : fallback; }
    function lipColor() { var m = MK.lips; return m && m.color ? m.color : (m ? '#f08aa0' : '#e48a98'); }

    // =========================================================
    // LÁB, LÁBBELI
    // =========================================================
    function legsBase(c) {
        var s = '', f = c.skin;
        [1, -1].forEach(function (sg) {
            var th = [[sg * LEG_T[0][0], LEG_T[0][1]], [sg * 6.8, -40], [sg * 6.8, -28]];
            var sh = [[sg * 6.8, -29], [sg * 6.6, -17], [sg * 6.3, -7.5]];
            s += tubeOut(qd(th), 9.4, f) + tubeOut(qd(sh), 7.4, f);
        });
        [1, -1].forEach(function (sg) {
            var th = [[sg * LEG_T[0][0], LEG_T[0][1]], [sg * 6.8, -40], [sg * 6.8, -28]];
            var sh = [[sg * 6.8, -29], [sg * 6.6, -17], [sg * 6.3, -7.5]];
            s += tubeFill(qd(th), 9.4, f) + tubeFill(qd(sh), 7.4, f);
        });
        return s;
    }
    // lábszár-viselet (zokni, combzokni, harisnya)
    function legWear(u, kind, c) {
        if (!kind) return '';
        var col = K.legs || '#fdf6fa', s = '';
        var spec = { zokni: [-31, -7], combzokni: [-50, -7], harisnya: [-52, -7] }[kind];
        if (!spec) return '';
        [1, -1].forEach(function (sg) {
            var th = [[sg * 6.7, -53], [sg * 6.8, -40], [sg * 6.8, -28]];
            var sh = [[sg * 6.8, -29], [sg * 6.6, -17], [sg * 6.3, -7.5]];
            var seg = [];
            if (spec[0] <= -31) seg.push({ q: sh, t0: kind === 'zokni' ? 0.1 : 0, t1: 1, w: 7.6 });
            if (spec[0] < -31) seg.push({ q: th, t0: kind === 'combzokni' ? 0.18 : 0, t1: 1, w: 9.6 });
            var out = '', fill = '';
            seg.forEach(function (g) {
                var q = g.t0 > 0 ? qrangeSafe(g.q, g.t0, g.t1) : g.q;
                out += tubeOut(qd(q), g.w, col); fill += tubeFill(qd(q), g.w, col);
            });
            s += out + fill;
            if (kind === 'harisnya') {
                seg.forEach(function (g) { s += L(qd(g.q), 'url(#' + u + '-lace)', g.w - 0.4); });
                s += tubeOut('', 0, col) ? '' : '';
            }
            // felső szegély
            var top = kind === 'zokni' ? qpt(sh, 0.1) : (kind === 'combzokni' ? qpt(th, 0.18) : [sg * 6.7, -52]);
            var tw = kind === 'zokni' ? 7.9 : 9.9;
            s += RC(sg * top[0] > 0 ? top[0] - tw / 2 : top[0] - tw / 2, top[1] - 1.2, tw, 2.4, tint(col, 0.45), 'rx="1.1" stroke="' + ol(col) + '" stroke-width=".8"');
            if (kind === 'zokni') s += L('M' + n1(sg * 6.7 - 3) + ' -25 L' + n1(sg * 6.7 + 3) + ' -25', tint(col, 0.8), 0.7, 'opacity=".0"');
        });
        return s;
    }
    function qrangeSafe(q, t0, t1) {
        // a q görbe t0..1 szakasza (t1 mindig 1)
        var r = [q[2], q[1], q[0]];
        var sub = qsub(r, 1 - t0);
        return [sub[2], sub[1], sub[0]];
    }
    function sole(col, x, y, w, h, o) { return EL(x, y, w, h, col, o || ''); }

    // cipők (elölnézet, kissé kifelé fordulva)
    function shoes(u, kind) {
        var s = '';
        [1, -1].forEach(function (sg) {
            var x = sg * 7.6, rot = sg * 9, inner = '';
            if (kind === 'csizma') {
                var cb = K.shoes || '#4a4056';
                s += tube('M' + n1(sg * 6.5) + ' -28 L' + n1(sg * 6.4) + ' -9', 9.8, cb);
                s += RC(sg * 6.5 - 5.5, -30, 11, 2.8, tint(cb, 0.2), 'rx="1.2" stroke="' + ol(cb) + '" stroke-width=".8"');
                inner = SH('M-6.8 -3.4 C-6.8 -8.8 -2 -10.4 1.4 -10 C5.4 -9.6 7 -6.8 7 -3.4 C7 -.4 4.6 .8 0 .8 C-4.6 .8 -6.8 -.6 -6.8 -3.4Z', cb) +
                    P('M-5.8 -.4 C-3 .9 3 .9 5.8 -.4 L5.8 -1.6 C3 -.4 -3 -.4 -5.8 -1.6Z', tint(cb, 0.28), 'opacity=".95"');
            } else if (kind === 'maryjane') {
                var cm = K.shoes || '#4a4056';
                inner = SH('M-6.6 -3 C-6.6 -7.4 -3 -8.8 .4 -8.6 C4.6 -8.4 6.8 -6.2 6.8 -3.2 C6.8 -.4 4.4 .8 0 .8 C-4.4 .8 -6.6 -.4 -6.6 -3Z', cm) +
                    P('M-5.6 -.4 C-3 .9 3 .9 5.8 -.4 L5.8 -1.4 C3 -.2 -3 -.2 -5.6 -1.4Z', tint(cm, 0.22)) +
                    L('M-5.8 -5.4 Q0 -3.2 6 -5.4', tint(cm, 0.35), 1.5) + CI(0, -4.3, 1, '#f5d78a', 'stroke="' + ol('#f5d78a') + '" stroke-width=".5"');
            } else {
                var cp = K.shoes || '#fdf8fd';
                inner = SH('M-6.8 -4.6 C-6.8 -9.4 -2.6 -10.6 .6 -10.2 C4.8 -9.8 7 -7.4 7 -4.4 C7 -2.4 5.6 -1.8 0 -1.8 C-5.6 -1.8 -6.8 -2.6 -6.8 -4.6Z', cp) +
                    SH('M-7.2 -2.6 C-7.2 -2.6 -6.6 .9 0 .9 C6.6 .9 7.4 -2.6 7.4 -2.6 C5 -1.6 -5 -1.6 -7.2 -2.6Z', tint(cp, 0.1)) +
                    L('M-2.6 -8.2 L2.4 -6.8 M-2.8 -6.2 L2.6 -4.8', shade(cp, -0.2), 0.8) +
                    P('M-6.4 -3.6 C-4 -2.8 4 -2.8 6.6 -3.6', 'none', 'stroke="' + shade(cp, -0.1) + '" stroke-width=".5"');
            }
            s += G(inner, 'translate(' + n1(x) + ' 0) rotate(' + rot + ' 0 -4)');
        });
        return s;
    }

    // =========================================================
    // ALSÓ RUHÁK
    // =========================================================
    function pleats(xTop, xBot, yTop, yBot, n, col, op) {
        var s = '';
        for (var i = 1; i < n; i++) {
            var t = i / n;
            s += L('M' + n1(-xTop + 2 * xTop * t) + ' ' + yTop + ' L' + n1(-xBot + 2 * xBot * t) + ' ' + yBot, col, 0.7, 'opacity="' + op + '"');
        }
        return s;
    }
    function skirt(u, kind) {
        var col = K.bottom || '#f4a3b8', s = '';
        if (kind === 'estelyi') {
            col = K.bottom || '#b89fe8';
            var d = 'M-10.4 -64 L10.4 -64 C13 -48 20 -26 26.5 -5 C16 -1.6 -16 -1.6 -26.5 -5 C-20 -26 -13 -48 -10.4 -64Z';
            s += SH(d, col) + pleats(10.4, 26.5, -64, -3, 7, shade(col, -0.2), 0.45);
            s += P('M10.4 -64 C13 -48 20 -26 26.5 -5 C24.4 -4.6 22 -4.2 19.5 -3.9 C16 -24 12 -44 6.6 -64Z', shade(col, -0.2), 'opacity=".2"');
            s += RC(-11, -66, 22, 4.4, tint(col, 0.3), 'rx="1.6" stroke="' + ol(col) + '" stroke-width="1"');
            s += star(-9, -30, 1.7, '#fff', 'opacity=".95"') + star(10, -42, 1.4, '#fff', 'opacity=".9"') + star(-17, -14, 1.5, '#fff', 'opacity=".9"') + star(15, -18, 1.8, '#fff', 'opacity=".9"') + star(2, -22, 1.2, '#fff', 'opacity=".85"') + star(-3, -48, 1.1, '#fff', 'opacity=".8"');
            return s;
        }
        if (kind === 'szoknya') {
            var ds = 'M-10.4 -63 L10.4 -63 C13 -55 17.6 -45 20 -35.6 C13 -33.4 -13 -33.4 -20 -35.6 C-17.6 -45 -13 -55 -10.4 -63Z';
            s += SH(ds, col) + pleats(10.4, 20, -63, -34.6, 8, shade(col, -0.22), 0.5);
            s += P('M10.4 -63 C13 -55 17.6 -45 20 -35.6 C18 -35.2 16 -34.9 14 -34.7 C13 -45 11.6 -55 7 -63Z', shade(col, -0.22), 'opacity=".2"');
            s += RC(-11, -66, 22, 4.2, shade(col, -0.08), 'rx="1.6" stroke="' + ol(col) + '" stroke-width="1"');
            return s;
        }
        if (kind === 'tenisz') {
            col = K.bottom || '#fdf6fa';
            var dt = 'M-10.4 -63 L10.4 -63 C12.4 -57 16 -50 18 -43.6 C12 -41.6 -12 -41.6 -18 -43.6 C-16 -50 -12.4 -57 -10.4 -63Z';
            s += SH(dt, col) + pleats(10.4, 18, -63, -42, 6, shade(col, -0.2), 0.5);
            s += P('M-17.6 -45.6 C-12 -43.6 12 -43.6 17.6 -45.6 L18 -43.6 C12 -41.6 -12 -41.6 -18 -43.6Z', '#8fd3f4');
            s += RC(-11, -66, 22, 4.2, '#8fd3f4', 'rx="1.6" stroke="' + ol('#8fd3f4') + '" stroke-width="1"');
            return s;
        }
        if (kind === 'kilt') {
            var dk = 'M-10.4 -63 L10.4 -63 C13 -53 18 -43 21 -33 C14 -30.4 -14 -30.4 -21 -33 C-18 -43 -13 -53 -10.4 -63Z';
            s += P(dk, 'url(#' + u + '-plaid)', 'stroke="' + ol('#6f9fd6') + '" stroke-width="1.2" stroke-linejoin="round"') + pleats(10.4, 21, -63, -31.6, 7, '#3b4a78', 0.28);
            s += P('M10.4 -63 C13 -53 18 -43 21 -33 C18.6 -32.4 16 -31.9 13.6 -31.6 C13.4 -43 11.4 -53 7 -63Z', '#3b2d4a', 'opacity=".14"');
            s += RC(-11, -66, 22, 4.2, '#5a6fa8', 'rx="1.6" stroke="' + ol('#5a6fa8') + '" stroke-width="1"');
            s += RC(-1.6, -65.6, 3.2, 3.4, '#f5d78a', 'rx=".8" stroke="' + ol('#f5d78a') + '" stroke-width=".6"');
            return s;
        }
        return '';
    }
    function pantsLegs(kind, c) {
        var col = K.bottom || (kind === 'rovid' ? '#a9cdee' : (kind === 'jeans' ? '#7ea8d8' : '#c7b0f0')), s = '', out = '', fill = '';
        [1, -1].forEach(function (sg) {
            var seg = kind === 'rovid'
                ? { q: [[sg * 6.7, -57], [sg * 7, -49], [sg * 6.9, -40.5]], w: 11.4 }
                : { q: [[sg * 6.7, -57], [sg * 7.1, -33], [sg * 6.4, -9]], w: 10.8 };
            out += tubeOut(qd(seg.q), seg.w, col); fill += tubeFill(qd(seg.q), seg.w, col);
        });
        s += out + fill;
        [1, -1].forEach(function (sg) {
            if (kind === 'jogger' || kind === 'jeans') {
                s += RC(sg * 6.4 - 5.6, -13, 11.2, 4.2, tint(col, 0.2), 'rx="1.6" stroke="' + ol(col) + '" stroke-width=".9"');
                s += L('M' + n1(sg * 6.2 + 3.4) + ' -52 L' + n1(sg * 6.5 + 3.4) + ' -14', shade(col, -0.2), 0.7, 'opacity=".4"');
            } else {
                s += RC(sg * 6.9 - 6, -42.6, 12, 3.2, shade(col, -0.1), 'rx="1.2" stroke="' + ol(col) + '" stroke-width=".8"');
            }
        });
        // csípő-rész
        var hip = 'M-11.2 -62 L11.2 -62 C13.4 -58 13.6 -53 13 -50 C8 -47.6 -8 -47.6 -13 -50 C-13.6 -53 -13.4 -58 -11.2 -62Z';
        s += SH(hip, col);
        s += RC(-11.4, -66, 22.8, 4.4, shade(col, -0.08), 'rx="1.6" stroke="' + ol(col) + '" stroke-width="1"');
        s += L('M-3.2 -61.4 L-3.2 -64.6 M3.2 -61.4 L3.2 -64.6', tint(col, 0.6), 0.9);
        s += P('M9 -62 C12.8 -58 13.2 -53 12.6 -50.4 C11 -49.8 10 -49.5 9 -49.4Z', shade(col, -0.2), 'opacity=".18"');
        return s;
    }
    function bottomWear(u, kind) {
        if (!kind) return '';
        if (kind === 'rovid' || kind === 'jogger' || kind === 'jeans') return pantsLegs(kind);
        return skirt(u, kind);
    }
    function defaultUnder(c) { // alsó ruha nélkül: egyszerű fehérnemű-szerű rövidnadrág, hogy ne legyen "meztelen"
        var col = '#e9e2f2';
        var hip = 'M-11.4 -61 L11.4 -61 C13.4 -57 13.6 -52 13 -49 C8 -46.2 4 -45.4 0 -46 C-4 -45.4 -8 -46.2 -13 -49 C-13.6 -52 -13.4 -57 -11.4 -61Z';
        return SH(hip, col) + L('M0 -46 L0 -54', shade(col, -0.2), 0.6, 'opacity=".5"');
    }

    // =========================================================
    // FELSŐK, KAROK, KEZEK
    // =========================================================
    var TOPDEF = {
        tee: { y1: -57, pad: 1.0, sleeve: 0.40, sw: 8.6 },
        polo: { y1: -58, pad: 1.0, sleeve: 0.40, sw: 8.6 },
        pulcsi: { y1: -47.5, pad: 3.2, sleeve: 1, sw: 9.6 },
        crop: { y1: -75, pad: 0.8, sleeve: 0.36, sw: 8.6 },
        bluz: { y1: -56, pad: 1.8, sleeve: 0.62, sw: 10.6 },
        kabat: { y1: -42, pad: 3.0, sleeve: 1, sw: 9.2 }
    };
    function topFill(kind) { return K.top || ({ tee: '#b9c0da', polo: '#f6b5c5', pulcsi: '#8fd3f4', crop: '#ffc2d1', bluz: '#fdf8fd', kabat: '#cdb7f0' }[kind] || '#f6b5c5'); }

    function topBase(u, kind) {
        if (!kind) return '';
        var d = TOPDEF[kind], col = topFill(kind), s = '';
        if (!d) return '';
        var nd = kind === 'polo' ? 2 : (kind === 'kabat' ? 0.5 : 2.6);
        if (kind === 'pulcsi') {
            // kapucni a nyak körül (hátul)
            s += SH('M-9.6 -96.6 C-12 -91 -14 -90 -14 -90 L14 -90 C14 -90 12 -91 9.6 -96.6 C5 -98.8 -5 -98.8 -9.6 -96.6Z', shade(col, -0.06));
        }
        var flare = kind === 'kabat' ? 3 : (kind === 'pulcsi' ? 0.5 : 0);
        s += SH(torsoShape(-94.2, d.y1, d.pad, { sag: kind === 'bluz' ? 1.6 : 0.6, neckW: kind === 'pulcsi' ? 7.4 : 6.4, neckDip: nd }), col);
        s += edgeShade(-90, d.y1, d.pad, 3.6, shade(col, -0.35), 0.2);
        // alsó szegély-sáv
        var hemW = hw(d.y1) + d.pad;
        if (kind === 'pulcsi') s += RC(-hemW, d.y1 - 3.8, hemW * 2, 3.8, shade(col, -0.1), 'stroke="' + ol(col) + '" stroke-width="1" rx="1.4"') + L('M-5 ' + (d.y1 - 3.4) + ' L-5 ' + d.y1 + ' M0 ' + (d.y1 - 3.4) + ' L0 ' + d.y1 + ' M5 ' + (d.y1 - 3.4) + ' L5 ' + d.y1, shade(col, -0.25), 0.6, 'opacity=".5"');
        if (kind === 'crop') s += RC(-hemW, d.y1 - 3, hemW * 2, 3, tint(col, 0.55), 'stroke="' + ol(col) + '" stroke-width=".9" rx="1.2"');
        if (kind === 'polo') s += RC(-hemW, d.y1 - 2.6, hemW * 2, 2.6, shade(col, -0.06), 'stroke="' + ol(col) + '" stroke-width=".9" rx="1.2"');
        return s;
    }
    function topDetails(u, kind) {
        if (!kind) return '';
        var col = topFill(kind), s = '';
        if (kind === 'polo') {
            // gallér + gombok
            s += SH('M-6.6 -94.2 L-1 -90 L-6.2 -87.2 L-10.4 -92Z', tint(col, 0.55), 1) + SH('M6.6 -94.2 L1 -90 L6.2 -87.2 L10.4 -92Z', tint(col, 0.55), 1);
            s += L('M0 -89.5 L0 -77', shade(col, -0.25), 0.8) + CI(0, -86, 0.9, '#fff', 'stroke="' + ol(col) + '" stroke-width=".5"') + CI(0, -81.6, 0.9, '#fff', 'stroke="' + ol(col) + '" stroke-width=".5"');
        } else if (kind === 'pulcsi') {
            s += SH('M-7.4 -94.4 C-5 -90 5 -90 7.4 -94.4 C5.4 -92.2 -5.4 -92.2 -7.4 -94.4Z', shade(col, -0.18), 1);
            // zsebe
            s += SH('M-9 -70 L9 -70 L11.4 -58.6 L-11.4 -58.6Z', shade(col, -0.08), 1);
            s += L('M-6 -69.6 L-7.6 -59.4 M6 -69.6 L7.6 -59.4', shade(col, -0.3), 0.6, 'opacity=".4"');
            // zsinórok
            s += L('M-3.4 -92 L-4.2 -79', tint(col, 0.75), 1.3) + L('M3.4 -92 L4.2 -79', tint(col, 0.75), 1.3) + CI(-4.2, -78.2, 1.2, tint(col, 0.9), 'stroke="' + ol(col) + '" stroke-width=".5"') + CI(4.2, -78.2, 1.2, tint(col, 0.9), 'stroke="' + ol(col) + '" stroke-width=".5"');
        } else if (kind === 'crop') {
            s += P('M-6.4 -94.2 Q0 -89.4 6.4 -94.2', 'none', 'stroke="' + ol(col) + '" stroke-width="1.2"');
            s += P('M0 -84.4 L2.2 -81.4 L0 -78.4 L-2.2 -81.4Z', '#fff', 'opacity=".95"');
        } else if (kind === 'bluz') {
            s += SH('M-7 -94.4 C-4 -91.4 4 -91.4 7 -94.4 L7 -92 C4 -89 -4 -89 -7 -92Z', tint(col, 0.1), 1);
            s += L('M0 -88 L0 -60', shade(col, -0.18), 0.7, 'opacity=".5"');
            [-84, -77, -70, -63].forEach(function (y) { s += CI(0, y, 0.85, '#f4a3b8', 'stroke="' + ol('#f4a3b8') + '" stroke-width=".4"'); });
            // masni
            s += SH('M0 -90.4 C-3 -95 -9 -94.4 -9.6 -91.2 C-9.8 -88.4 -4 -88.6 0 -90.4Z', '#f4a3b8') + SH('M0 -90.4 C3 -95 9 -94.4 9.6 -91.2 C9.8 -88.4 4 -88.6 0 -90.4Z', '#f4a3b8');
            s += SH('M-1.4 -92.2 L1.4 -92.2 L1.2 -88.6 L-1.2 -88.6Z', shade('#f4a3b8', -0.08), 0.8);
            s += SH('M-1 -88.8 L-3.6 -82.6 L-1 -83.6 L0 -88.4Z', '#f4a3b8', 0.9) + SH('M1 -88.8 L3.6 -82.6 L1 -83.6 L0 -88.4Z', '#f4a3b8', 0.9);
        } else if (kind === 'kabat') {
            var lap = tint(col, 0.55);
            s += SH('M-6.6 -94.4 L-1.2 -76 L-12.6 -83 L-12 -91.6Z', lap, 1.1) + SH('M6.6 -94.4 L1.2 -76 L12.6 -83 L12 -91.6Z', lap, 1.1);
            s += L('M0 -76 L0 -43', shade(col, -0.25), 0.9, 'opacity=".6"');
            s += CI(0, -72, 1.1, '#f5d78a', 'stroke="' + ol('#f5d78a') + '" stroke-width=".5"') + CI(0, -62, 1.1, '#f5d78a', 'stroke="' + ol('#f5d78a') + '" stroke-width=".5"');
            s += SH('M-12.4 -67.6 L12.4 -67.6 L12.8 -63 L-12.8 -63Z', shade(col, -0.16), 1) + RC(-2, -68, 4, 5.4, '#f5d78a', 'rx=".8" stroke="' + ol('#f5d78a') + '" stroke-width=".6"');
            s += SH('M-15.4 -90 C-14 -94 -9 -95 -6.6 -94 L-8 -90Z', shade(col, -0.05), 0.9) + SH('M15.4 -90 C14 -94 9 -95 6.6 -94 L8 -90Z', shade(col, -0.05), 0.9);
        }
        return s;
    }

    // kar: bőr + ruhaujj + kéz
    function handShape(x, y, rot, c, pose, side) {
        // elölnézeti, egyszerű kéz: lekerekített tenyér + hüvelykujj (befelé). Az (x,y) a csukló vége, lefelé nyúlik.
        var f = c.skin, g = '';
        g += SH('M-3.7 -1.4 C-4.7 2.8 -3.9 7.6 0 7.8 C3.9 7.6 4.7 2.8 3.7 -1.4Z', f);
        g += SH('M-3.2 .4 C-5.8 1.2 -6.8 4 -5.5 5.4 C-4.4 6.2 -3.3 4.6 -2.7 3Z', f);
        if (pose === 'wave') g += L('M-1.3 6 L-1.3 7.4 M1.3 6 L1.3 7.4', shade(f, -0.3), 0.6, 'opacity=".7"');
        g += nailsLayer();
        return G(g, 'translate(' + x + ' ' + y + ') rotate(' + rot + ')' + (side < 0 ? ' scale(-1 1)' : ''));
    }
    function nailsLayer() {
        var m = mk('nails');
        if (!m) return '';
        var col = mkColor('nails', '#f4a3b8'), st = m.style, s = '';
        var big = st === 'ko_hosszu';
        [[-2.3, 6.5], [0, 7.2], [2.3, 6.5]].forEach(function (t) {
            var y = t[1] + (big ? 0.7 : 0);
            if (st === 'ko_francia') {
                s += EL(t[0], y, 1, 1.1, '#fdf2f4') + EL(t[0], y - 0.3, 0.72, 0.6, col, 'opacity=".9"');
            } else {
                s += EL(t[0], y, big ? 0.85 : 1, big ? 1.8 : 1.05, col);
                if (big) s += P('M' + n1(t[0] - 0.85) + ' ' + n1(y + 0.6) + ' Q' + n1(t[0]) + ' ' + n1(y + 3) + ' ' + n1(t[0] + 0.85) + ' ' + n1(y + 0.6) + 'Z', col);
                if (st === 'ko_csillam') s += CI(t[0] - 0.25, y - 0.3, 0.3, '#fff', 'opacity=".95"');
                if (st === 'ko_fenyes') s += CI(t[0] - 0.25, y - 0.3, 0.26, '#fff', 'opacity=".7"');
            }
        });
        return s;
    }
    function sleeveShape(u, kind, q, sleeveT, sw, col) {
        var sub = sleeveT >= 1 ? q : qsub(q, sleeveT);
        var o = '', f = '';
        o += tubeOut(qd(sub), sw, col); f += tubeFill(qd(sub), sw, col);
        var s = o + f;
        // csík-árnyék a ruhaujj külső oldalán
        s += L(qd(sub), shade(col, -0.35), 1.6, 'opacity=".0"');
        // mandzsetta
        var end = sub[2], cuffCol = shade(col, -0.1);
        var dx = sub[2][0] - sub[1][0], dy = sub[2][1] - sub[1][1], len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ang = Math.atan2(dy, dx) * 180 / Math.PI;
        if (kind === 'pulcsi' || kind === 'kabat') {
            s += G(RC(-1.6, -(sw / 2 + 0.6), 3.4, sw + 1.2, cuffCol, 'rx="1.1" stroke="' + ol(col) + '" stroke-width=".9"'), 'translate(' + n1(end[0] - dx / len * 1.2) + ' ' + n1(end[1] - dy / len * 1.2) + ') rotate(' + n1(ang) + ')');
        } else if (kind === 'bluz') {
            s += G(RC(-1.4, -(sw / 2 - 1.8), 3.2, sw - 3.6, tint(col, 0.35), 'rx="1.2" stroke="' + ol(col) + '" stroke-width=".9"'), 'translate(' + n1(end[0] - dx / len * 1.2) + ' ' + n1(end[1] - dy / len * 1.2) + ') rotate(' + n1(ang) + ')');
        } else {
            s += G(RC(-1.2, -(sw / 2 + 0.2), 2.6, sw + 0.4, tint(col, 0.5), 'rx="1" stroke="' + ol(col) + '" stroke-width=".8"'), 'translate(' + n1(end[0] - dx / len * 0.8) + ' ' + n1(end[1] - dy / len * 0.8) + ') rotate(' + n1(ang) + ')');
        }
        return s;
    }
    function arm(u, q, sg, pose, topKind, c, isMain) {
        var s = '';
        var tw = 6.2;
        var q2 = q;
        // bőr-kar (hosszabb: a ruhaujj csak részben takarja)
        s += tube(qd(q2), tw, c.skin);
        // kéz
        var h = isMain ? HAND_AT[pose] : HAND_AT.idle;
        s += handShape(h[0], h[1], h[2], c, isMain ? pose : 'idle', 1);
        if (topKind && TOPDEF[topKind]) {
            var d = TOPDEF[topKind];
            s += sleeveShape(u, topKind, q2, d.sleeve, d.sw, topFill(topKind));
        }
        return s;
    }
    function armsLayer(u, pose, topKind, c) {
        var mainQ = ARMS[pose] || ARMS.idle;
        var idleQ = ARMS.idle;
        var leftIdle = idleQ.map(function (p) { return [-p[0], p[1]]; });
        // bal kar: üres járat (hand mirrored)
        var s = mirror(arm(u, idleQ, 1, 'idle', topKind, c, false));
        s += arm(u, mainQ, 1, pose, topKind, c, true);
        if (pose === 'wave') s += L('M39.4 -120 Q42.6 -114.6 39.4 -109', INK, 1, 'opacity=".55"') + L('M43.4 -123 Q47.4 -114.6 43.4 -106', INK, 1, 'opacity=".35"');
        return s;
    }

    // =========================================================
    // HAJ
    // =========================================================
    function hairFillOf(u, wig, hair) { return wig ? 'url(#' + u + '-wig)' : hair; }
    function hairBack(u, style, fill, edge) {
        var d;
        if (style === 'hosszu') d = 'M-28 -124 C-30 -150 -16 -160 0 -160 C16 -160 30 -150 28 -124 C30.4 -108 31.6 -92 30 -74 C28.4 -69 22 -67.4 15 -69 L-15 -69 C-22 -67.4 -28.4 -69 -30 -74 C-31.6 -92 -30.4 -108 -28 -124Z';
        else if (style === 'rovid') d = 'M-26.6 -124 C-28.4 -149 -14 -159 0 -159 C14 -159 28.4 -149 26.6 -124 C27 -116 25 -110 22.6 -107 C14 -106 -14 -106 -22.6 -107 C-25 -110 -27 -116 -26.6 -124Z';
        else d = 'M-28 -124 C-30 -150 -16 -160 0 -160 C16 -160 30 -150 28 -124 C29.6 -112 28.6 -102 24.4 -96.6 C14 -94 -14 -94 -24.4 -96.6 C-28.6 -102 -29.6 -112 -28 -124Z';
        return P(d, fill, 'stroke="' + edge + '" stroke-width="1.2" stroke-linejoin="round"');
    }
    function hairFront(u, style, fill, edge, c) {
        var s = '';
        var bangs, locksL, locksR;
        if (style === 'rovid') {
            // rövid, fésületlen frufru; a fül szabadon marad
            var d = 'M-26.4 -139 C-26.8 -151.5 -14 -157.4 0 -157.4 C14 -157.4 26.8 -151.5 26.4 -139 C27.2 -135 26.4 -132 25.4 -126 C24.4 -128 23.6 -131 23.4 -133 C21.4 -128.4 18 -132 15.6 -136.6 C13.4 -131.4 9.6 -134 7.2 -138.6 C4.6 -132.6 .6 -134.4 -2 -139 C-4.6 -133.6 -8.6 -135 -11 -139.4 C-13.4 -134 -17.8 -135.4 -20 -139 C-22.4 -134 -24.6 -131 -25.4 -126 C-26.4 -132 -27.2 -136 -26.4 -139Z';
            s += P(d, fill);
            s += L('M25.4 -126 C24.4 -128 23.6 -131 23.4 -133 C21.4 -128.4 18 -132 15.6 -136.6 C13.4 -131.4 9.6 -134 7.2 -138.6 C4.6 -132.6 .6 -134.4 -2 -139 C-4.6 -133.6 -8.6 -135 -11 -139.4 C-13.4 -134 -17.8 -135.4 -20 -139 C-22.4 -134 -24.6 -131 -25.4 -126', edge, 1.2);
        } else {
            var len = style === 'hosszu' ? 1 : 0;
            var yEnd = style === 'hosszu' ? -80 : -106;
            var wd = style === 'hosszu' ? 5.4 : 4.2;
            // frufru + oldalsó tincsek (összefüggő alakzat)
            var dd = 'M-26.6 -139 C-27 -151.5 -14 -157.4 0 -157.4 C14 -157.4 27 -151.5 26.6 -139 L27 -118 L' + n1(26.6) + ' ' + yEnd + ' C' + n1(26.6 - wd * 0.2) + ' ' + (yEnd + 1.6) + ' ' + n1(24.4) + ' ' + (yEnd + 1) + ' ' + n1(24.4 - wd * 0.2) + ' ' + (yEnd - 2) +
                ' C23 -114 23.8 -121 22 -125 C19 -130 14 -135.6 8 -136 C3.6 -136.4 1.4 -132.6 -1.4 -131.4 C-4 -133 -8.4 -133.6 -12.6 -131.6 C-17 -130 -20.6 -127.4 -22.4 -122 C-23.4 -116 -23 ' + (yEnd - 4) + ' -24.2 ' + (yEnd - 2) +
                ' C-24.2 ' + (yEnd + 1) + ' -26.4 ' + (yEnd + 1.6) + ' -26.8 ' + yEnd + ' L-27 -118Z';
            s += P(dd, fill);
            var edgeD = 'M24.4 ' + n1(yEnd - 2 + 0) + ' C23.8 -114 23.8 -121 22 -125 C19 -130 14 -135.6 8 -136 C3.6 -136.4 1.4 -132.6 -1.4 -131.4 C-4 -133 -8.4 -133.6 -12.6 -131.6 C-17 -130 -20.6 -127.4 -22.4 -122 C-23.4 -116 -23.4 ' + (yEnd - 4) + ' -24.2 ' + (yEnd - 2);
            s += L(edgeD, edge, 1.2);
            // oldalsó tincsek külső széle + vége
            s += L('M26.6 ' + yEnd + ' C24.6 ' + (yEnd + 1.2) + ' 24.6 ' + (yEnd + 0.6) + ' 24.4 ' + (yEnd - 2), edge, 1.2) + L('M-26.8 ' + yEnd + ' C-24.8 ' + (yEnd + 1.2) + ' -24.4 ' + (yEnd + 0.6) + ' -24.2 ' + (yEnd - 2), edge, 1.2);
            // tincs-vonalak
            var sc = shade(fill.charAt(0) === '#' ? fill : '#f4a3b8', -0.16);
            s += L('M6 -150 C9 -143 11 -139 12.4 -135', sc, 0.8, 'opacity=".5"') + L('M-8 -151 C-11 -145 -14.6 -139.6 -17 -134', sc, 0.8, 'opacity=".5"') + L('M-1.4 -152 C-1 -145 -1.2 -138 -1.4 -132', sc, 0.8, 'opacity=".4"');
        }
        // fény-sáv a feje tetején
        s += P('M-17 -149 C-9 -154 6 -154.4 14 -150 C6 -150.6 -8 -150.4 -17 -149Z', '#fff', 'opacity=".38"');
        return s;
    }
    function earSkin(c, style) {
        var s = '';
        [1, -1].forEach(function (sg) {
            s += SH('M' + (sg * 23) + ' -125 C' + (sg * 29) + ' -126 ' + (sg * 29.4) + ' -116 ' + (sg * 24) + ' -114.5Z', c.skin, 1) + P('M' + (sg * 25) + ' -122 C' + (sg * 27.2) + ' -122 ' + (sg * 27.4) + ' -118 ' + (sg * 25) + ' -117.2Z', shade(c.skin, -0.12), 'opacity=".6"');
        });
        return s;
    }

    // hajtartozékok
    function hairAccessory(u, kind, hair, hairD) {
        if (!kind) return '';
        var col = K.hair || '#f4a3b8', s = '';
        if (kind === 'hajgumi') {
            // oldalsó copf
            s += SH('M24.6 -139 C32 -142 36 -134 34 -124 C33 -118 31.6 -114 29.4 -111 C28 -117 29 -124 26 -130Z', hair);
            s += L('M31 -133 C32 -127 31 -121 29.8 -116', shade(hair, -0.2), 0.7, 'opacity=".6"');
            s += SH('M22.6 -142 L29 -138.4 L26.4 -131.2 L21 -136Z', col, 1) + L('M23.6 -139.4 L27 -135.4', tint(col, 0.5), 0.7);
        } else if (kind === 'masni') {
            var bc = col;
            s += SH('M-17 -147 C-23 -156 -31 -151 -29 -145 C-27 -140 -20 -143 -17 -147Z', bc) + SH('M-17 -147 C-13 -157 -4.6 -154 -6 -147.6 C-7.6 -142 -14 -143 -17 -147Z', bc);
            s += SH('M-18.8 -149 L-15.2 -149 L-15.4 -144.6 L-18.6 -144.6Z', shade(bc, -0.08), 0.9);
            s += SH('M-17.4 -144.4 L-21 -136 L-17.6 -137.6 L-16 -144Z', bc, 0.9) + SH('M-16.4 -144.4 L-13.6 -136.4 L-16.4 -138 L-17.6 -144Z', bc, 0.9);
        } else if (kind === 'macskaful' || kind === 'headset') {
            var hc = kind === 'headset' ? '#3b2d4a' : '#6a5a7a';
            s += L('M-24.6 -134 C-22 -158 22 -158 24.6 -134', hc, 3.2) + L('M-24.6 -134 C-22 -158 22 -158 24.6 -134', tint(hc, 0.2), 1.6);
            [1, -1].forEach(function (sg) {
                s += SH('M' + (sg * 8) + ' -153 L' + (sg * 10.4) + ' -168 L' + (sg * 20.4) + ' -148.4Z', kind === 'headset' ? '#f4a3b8' : tint(hc, 0.1), 1.2) + P('M' + (sg * 11.6) + ' -152.6 L' + (sg * 12.6) + ' -162 L' + (sg * 18.4) + ' -150Z', '#ffc2d1');
            });
            if (kind === 'headset') {
                [1, -1].forEach(function (sg) { s += SH('M' + (sg * 25) + ' -129 C' + (sg * 31) + ' -131 ' + (sg * 31) + ' -113 ' + (sg * 25) + ' -114Z', '#3b2d4a', 1) + P('M' + (sg * 26.4) + ' -126 C' + (sg * 29) + ' -126 ' + (sg * 29) + ' -118 ' + (sg * 26.4) + ' -117.4Z', '#f4a3b8'); });
                s += L('M-27.6 -112 C-27 -102 -20 -100 -12 -101.4', '#3b2d4a', 1.4) + CI(-11.4, -101.4, 1.8, '#f4a3b8', 'stroke="#3b2d4a" stroke-width=".8"');
            }
        } else if (kind === 'virag') {
            var cols = ['#f4a3b8', '#9fd6f5', '#fdf6a8', '#fdf8fd', '#c7b0f0'];
            var leaf = '#7cc78e';
            for (var i = 0; i < 9; i++) {
                var t = i / 8, a = Math.PI * (1.08 - t * 1.16);
                var x = Math.cos(a) * 27.4, y = -130 - Math.sin(a) * 25;
                s += EL(x + (i % 2 ? 2 : -2), y + 1.6, 2.6, 1.3, leaf, 'transform="rotate(' + n1((i % 2 ? 1 : -1) * 35) + ' ' + n1(x) + ' ' + n1(y) + ')"');
            }
            for (var j = 0; j < 7; j++) {
                var tt = j / 6, aa = Math.PI * (1.06 - tt * 1.12);
                var fx = Math.cos(aa) * 27.4, fy = -130 - Math.sin(aa) * 25, fc = cols[j % 5];
                for (var k = 0; k < 5; k++) { var ak = k * 72 * Math.PI / 180; s += CI(fx + Math.cos(ak) * 2.1, fy + Math.sin(ak) * 2.1, 1.7, fc, 'stroke="' + ol(fc) + '" stroke-width=".5"'); }
                s += CI(fx, fy, 1.3, '#f5c64a', 'stroke="' + ol('#f5c64a') + '" stroke-width=".4"');
            }
        } else if (kind === 'hajcsat') {
            var cc = ['#9fd6f5', '#f4a3b8', '#fdf6a8'];
            [[-18.6, -140, -30], [-14.4, -137.4, -30], [17, -139.6, 30]].forEach(function (p, i) {
                s += G(RC(-3.6, -1, 7.2, 2, cc[i], 'rx="1" stroke="' + ol(cc[i]) + '" stroke-width=".7"') + CI(-2.4, 0, .5, '#fff', 'opacity=".9"'), 'translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')');
            });
        }
        return s;
    }

    // =========================================================
    // NYAKDÍSZEK, HÁTI TÁRGYAK, ARCDÍSZEK
    // =========================================================
    function neckWear(u, kind) {
        if (!kind) return '';
        var col = K.neck || '#3a2f45', s = '';
        if (kind === 'choker') {
            s += P('M-5.8 -95.8 C-3 -93.4 3 -93.4 5.8 -95.8', 'none', 'stroke="' + ol(col) + '" stroke-width="3.6" stroke-linecap="round"') + P('M-5.8 -95.8 C-3 -93.4 3 -93.4 5.8 -95.8', 'none', 'stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"');
            s += heart(0, -93.2, 1.1, '#f4a3b8', 'stroke="' + ol('#f4a3b8') + '" stroke-width=".5"');
        } else if (kind === 'nyakmasni') {
            s += SH('M0 -93.6 C-3 -97 -8.6 -96.6 -8.6 -93.4 C-8.6 -90.4 -3 -90.4 0 -93.6Z', col) + SH('M0 -93.6 C3 -97 8.6 -96.6 8.6 -93.4 C8.6 -90.4 3 -90.4 0 -93.6Z', col);
            s += SH('M-1.8 -95 L1.8 -95 L1.6 -91.8 L-1.6 -91.8Z', shade(col, -0.1), 0.9);
        } else if (kind === 'medal') {
            s += L('M-5.4 -95.4 L0 -80.4 L5.4 -95.4', '#c7b0f0', 1.2);
            s += star(0, -79.4, 3.6, '#f7d26a', 'stroke="' + ol('#f7d26a') + '" stroke-width=".9" stroke-linejoin="round"') + CI(-.6, -80, .6, '#fff', 'opacity=".9"');
        } else if (kind === 'gyongy') {
            for (var i = 0; i <= 8; i++) {
                var t = i / 8, x = -6.6 + 13.2 * t, y = -95 + Math.sin(Math.PI * t) * 7.4;
                s += CI(x, y, 1.45, '#fffaf5', 'stroke="' + ol('#e9dccf') + '" stroke-width=".5"');
            }
        } else if (kind === 'sal') {
            var cols = ['#f4a3b8', '#fdf6a8', '#9fd6f5', '#c7b0f0'];
            s += SH('M-7 -97 C-4 -92 4 -92 7 -97 L8 -92 C4 -88 -4 -88 -8 -92Z', cols[0], 1);
            for (var j = 0; j < 4; j++) s += L('M' + n1(-7.4 + j * 1.5) + ' ' + n1(-96 + j * 1.5) + ' C-4 ' + (-91.4 + j * 1.2) + ' 4 ' + (-91.4 + j * 1.2) + ' ' + n1(7.4 - j * 1.5 * 0.2) + ' ' + n1(-96 + j * 1.5), cols[(j + 1) % 4], 1.1, 'opacity="0"');
            s += SH('M2 -91 L8 -90 L10.4 -70 L4.6 -69Z', cols[2], 1);
            [0, 1, 2, 3].forEach(function (j) { s += P('M' + n1(3.4 + j * 1.5 - 0.2 * j) + ' ' + n1(-90.6 + j * 0.3) + ' L' + n1(9 + j * 0.02) + ' ' + n1(-89.6) + ' L' + n1(11.2) + ' ' + n1(-70) + ' L' + n1(5.4) + ' ' + n1(-69.4) + 'Z', 'none'); });
            s += P('M2.6 -86 L9 -85 L9.6 -80 L3.4 -81Z', cols[1], 'opacity=".95"') + P('M3.6 -77 L9.8 -76.2 L10.2 -71.6 L4.2 -72.4Z', cols[0], 'opacity=".95"');
        }
        return s;
    }
    function backBehind(u, kind) {
        if (!kind) return '';
        var s = '';
        if (kind === 'kopeny') {
            var st = ['#e8607a', '#f5a04a', '#f7e06a', '#7cc78e', '#6fb0e8', '#a285dc'];
            var d = 'M-14 -91 L14 -91 C20 -70 26 -50 28 -28 C14 -24 -14 -24 -28 -28 C-26 -50 -20 -70 -14 -91Z';
            s += P(d, '#f4a3b8', 'stroke="' + ol('#e8607a') + '" stroke-width="1.2" stroke-linejoin="round"');
            for (var i = 0; i < 6; i++) {
                var y0 = -91 + i * 11.2, y1 = y0 + 11.2;
                var xa = 14 + (y0 + 91) * 0.2, xb = 14 + (y1 + 91) * 0.2;
                s += P('M' + n1(-xa) + ' ' + n1(y0) + ' L' + n1(xa) + ' ' + n1(y0) + ' L' + n1(xb) + ' ' + n1(y1) + ' L' + n1(-xb) + ' ' + n1(y1) + 'Z', st[i], 'opacity=".95"');
            }
            s += P(d, 'none', 'stroke="' + ol('#e8607a') + '" stroke-width="1.2" stroke-linejoin="round"');
        } else if (kind === 'cicahatizsak') {
            var col = K.back || '#f4a3b8';
            s += SH('M-14.2 -96 L-17.6 -108.4 L-8.6 -99Z', col, 1) + SH('M14.2 -96 L17.6 -108.4 L8.6 -99Z', col, 1);
            s += SH('M-18.4 -92 C-18.4 -97 -14 -98 0 -98 C14 -98 18.4 -97 18.4 -92 L18.4 -62 C18.4 -57 15 -55 0 -55 C-15 -55 -18.4 -57 -18.4 -62Z', col);
            s += RC(-9, -78, 18, 11, shade(col, -0.08), 'rx="2.4" stroke="' + ol(col) + '" stroke-width="1"') + L('M-6 -72.6 L6 -72.6', shade(col, -0.3), 0.8, 'opacity=".5"');
        }
        return s;
    }
    function backFront(u, kind) {
        if (kind !== 'cicahatizsak') return '';
        var col = K.back || '#f4a3b8';
        var s = '';
        [1, -1].forEach(function (sg) {
            s += P('M' + (sg * 6.4) + ' -93 C' + (sg * 8) + ' -84 ' + (sg * 10.6) + ' -74 ' + (sg * 11.4) + ' -63 L' + (sg * 8.6) + ' -63 C' + (sg * 8) + ' -73 ' + (sg * 5.6) + ' -83 ' + (sg * 4.2) + ' -92.6Z', shade(col, -0.12), 'stroke="' + ol(col) + '" stroke-width="1" stroke-linejoin="round"');
        });
        return s;
    }

    // szemüveg és fülbevaló (az arc fölött)
    function faceWear(u, kind) {
        if (!kind) return '';
        var s = '';
        if (kind === 'szemuveg') {
            var fr = '#4a3a5a';
            [1, -1].forEach(function (sg) { s += CI(sg * 10.4, -121, 8.4, '#cfeaf7', 'fill-opacity=".28" stroke="' + fr + '" stroke-width="1.5"') + P('M' + (sg * 5) + ' -126.6 C' + (sg * 7.4) + ' -128.6 ' + (sg * 11.6) + ' -128.6 ' + (sg * 14.6) + ' -127.4', 'none', 'stroke="#fff" stroke-width=".8" opacity=".7" stroke-linecap="round"'); });
            s += L('M-2.2 -122 Q0 -123.8 2.2 -122', fr, 1.3) + L('M18.6 -122.6 L24.4 -123.6 M-18.6 -122.6 L-24.4 -123.6', fr, 1.2);
        } else if (kind === 'napszemuveg') {
            var col = K.face || '#f4a3b8';
            [1, -1].forEach(function (sg) {
                s += heart(sg * 10.4, -121.4, 6.6, shade(col, -0.45), 'fill-opacity=".92" stroke="' + col + '" stroke-width="1.6" stroke-linejoin="round"');
                s += P('M' + n1(sg * 7) + ' -125.6 C' + n1(sg * 8.6) + ' -127 ' + n1(sg * 10.4) + ' -126.6 ' + n1(sg * 11) + ' -125.2', 'none', 'stroke="#fff" stroke-width="1" opacity=".75" stroke-linecap="round"');
            });
            s += L('M-3.4 -125 Q0 -127 3.4 -125', col, 1.4) + L('M19 -125.6 L24.6 -125.6 M-19 -125.6 L-24.6 -125.6', col, 1.3);
        }
        return s;
    }
    function earrings(u, kind) {
        if (kind !== 'fulbevalo') return '';
        var col = K.face || '#f7d26a', s = '';
        [1, -1].forEach(function (sg) {
            s += L('M' + (sg * 25.4) + ' -114.6 L' + (sg * 25.4) + ' -111.6', col, 0.8) + star(sg * 25.4, -108.4, 3.4, col, 'stroke="' + ol(col) + '" stroke-width=".8" stroke-linejoin="round"') + CI(sg * 25, -108.8, .5, '#fff', 'opacity=".9"');
        });
        return s;
    }

    // =========================================================
    // ARC: szem, száj, pír, smink
    // =========================================================
    function eyeOpen(c, mood) {
        var s = '', ec = c.eye;
        s += EL(0, 0, 5.9, 6.7, '#ffffff');
        s += EL(0, 0.4, 5.1, 6.3, ec);
        s += P('M-5.1 .4 A5.1 6.3 0 0 1 5.1 .4 Q0 -2.2 -5.1 .4Z', shade(ec, -0.45), 'opacity=".5"');
        s += P('M-4 3.6 A5.1 6.3 0 0 0 4 3.6 Q0 1.8 -4 3.6Z', tint(ec, 0.5), 'opacity=".55"');
        s += EL(0, 1.2, 2.4, 3.6, '#2b2133');
        s += CI(-1.8, -2.5, 1.9, '#fff') + CI(2, 3, .9, '#fff', 'opacity=".9"');
        return s;
    }
    function shadowLayer(c) {
        var m = mk('shadow');
        if (!m) return '';
        var col = mkColor('shadow', '#f4a3b8'), st = m.style, s = '';
        // jobb szemhez rajzolva (külső szög = +x), a szem koordinátarendszerében
        var lid = 'M-6.6 -2 C-6.4 -9.4 -1 -12.4 3.6 -11.6 C7 -10.8 9 -7.6 9.4 -3.6 C6.2 -6.6 2 -7.4 -1.4 -6.8 C-3.8 -6.4 -5.6 -4.6 -6.6 -2Z';
        if (st === 'sz_finom') {
            s += P(lid, col, 'opacity=".72"');
        } else if (st === 'sz_atmenet') {
            s += P(lid, tint(col, 0.3), 'opacity=".75"') + P('M1 -7.2 C4 -9.4 7 -8 8.6 -3.8 C6 -6.6 3.6 -7.2 1 -7Z', shade(col, -0.15), 'opacity=".9"');
        } else if (st === 'sz_csillogo') {
            s += P(lid, col, 'opacity=".78"') + sparkle(-1.4, -8, 1.1, '#fff', 'opacity=".95"') + CI(3, -8.8, .5, '#fff') + CI(5.8, -7, .4, '#fff', 'opacity=".9"') + CI(-3.6, -6.4, .35, '#fff', 'opacity=".9"');
        } else if (st === 'sz_grafikus') {
            s += P('M-6.4 -2.4 C-6 -9 -1 -11.6 3.6 -10.8 C7.4 -10 9 -7.2 9.4 -4.2 L8 -4 C4 -8.2 -3 -9 -6.4 -2.4Z', col, 'opacity=".85"') + L('M-5.6 -6.6 C-2 -10.8 5 -11 8.8 -7', shade(col, -0.35), 0.7, 'opacity=".7"');
        }
        return s;
    }
    function linerLayer(c, mood) {
        var m = mk('liner');
        var col = m ? mkColor('liner', INK) : INK;
        var st = m ? m.style : null, s = '';
        var base = 'M-6.2 -1.8 C-5.8 -5.8 -2.8 -7.4 .6 -7.3 C3.8 -7.2 6 -5.6 7.2 -3.4';
        var wing = '';
        if (st === 'ki_szarny') wing = 'M7.2 -3.4 C8.6 -4.2 10.2 -5.6 11.4 -7.4';
        else if (st === 'ki_macska') wing = 'M7.2 -3.4 C9 -4 11.2 -5.4 13 -8.2';
        else wing = 'M7.2 -3.4 L8.6 -4.8';
        s += L(base, col, st === 'ki_macska' ? 2.2 : 1.9) + L(wing, col, st === 'ki_macska' ? 1.7 : 1.5);
        if (st === 'ki_szines') s += L('M-4.4 5 C-2 7.2 3.6 7.2 5.8 4.4', col, 0.9, 'opacity=".9"');
        if (st === 'ki_macska') s += L('M-6.2 -1.8 C-7 -1.2 -7.6 -.6 -8.2 .2', col, 1.4);
        if (!m) s += L('M-5.6 -3.6 C-5.8 -2 -5.8 -.6 -5.6 .6', INK, 0.0);
        return s;
    }
    function lashLayer(c, mood) {
        var m = mk('lashes');
        var base = '';
        // alap: egyetlen kis pillavég a külső sarokban (mindig van)
        var s = '';
        var st = m ? m.style : null;
        if (st) {
            var n = st === 'pl_dramai' ? 5 : (st === 'pl_hosszu' ? 4 : 3), len = st === 'pl_dramai' ? 3.4 : (st === 'pl_hosszu' ? 2.8 : 1.8);
            for (var i = 0; i < n; i++) {
                var t = (i + 1) / (n + 1);
                var x = -3 + t * 10.4, y = -7 + Math.pow(t - 0.35, 2) * 6;
                var a = (-90 + 20 + t * 52) * Math.PI / 180;
                s += L('M' + n1(x) + ' ' + n1(y) + ' L' + n1(x + Math.cos(a) * len) + ' ' + n1(y + Math.sin(a) * len), INK, st === 'pl_dramai' ? 1 : 0.9);
            }
        }
        if (st === 'pl_also') {
            for (var j = 0; j < 4; j++) {
                var tx = -3.6 + j * 2.6, ty = 5.8 - Math.pow((j - 1.5) * 0.4, 2) * 0.8;
                s += L('M' + n1(tx) + ' ' + n1(ty) + ' L' + n1(tx - 0.5) + ' ' + n1(ty + 1.9), INK, 0.7);
            }
        }
        return s;
    }
    // egy szem (jobb oldali koordinátákkal; a bal oldal tükrözve)
    function eye(side, mood, c) {
        var s = '';
        if (mood === 'happy') {
            s += L('M-5.8 1.6 C-4.2 -5 4.6 -5.4 6.4 1.4', INK, 2) + L('M6.4 1.4 L7.8 .2', INK, 1.6);
            var sm = mk('shadow');
            if (sm) s += shadowLayer(c);
            if (mk('liner')) s += L('M-5.8 1.6 C-4.2 -5 4.6 -5.4 6.4 1.4', mkColor('liner', INK), 1.7) + (mk('liner').style === 'ki_szarny' || mk('liner').style === 'ki_macska' ? L('M6.4 1.4 C8 .4 9.6 -1.4 11 -3.4', mkColor('liner', INK), 1.5) : '');
            if (mk('lashes')) s += lashLayer(c, mood).replace(/0/g, function (m) { return m; });
            return G(s, 'translate(' + (side * 10.4) + ' -121)' + (side < 0 ? ' scale(-1 1)' : ''));
        }
        s += eyeOpen(c, mood);
        s += shadowLayer(c);
        s += linerLayer(c, mood);
        s += lashLayer(c, mood);
        return G(s, 'translate(' + (side * 10.4) + ' -121)' + (side < 0 ? ' scale(-1 1)' : ''));
    }
    function brows(mood, hairD) {
        var s = '';
        var y = -132.4;
        if (mood === 'worried') {
            s += L('M5.4 -131 C8.4 -132.8 12.4 -134.4 14.6 -135.8', hairD, 1.4) + L('M-5.4 -131 C-8.4 -132.8 -12.4 -134.4 -14.6 -135.8', hairD, 1.4);
        } else if (mood === 'proud') {
            s += L('M5.6 -132 C8.4 -134.4 12 -134.8 14.6 -133.4', hairD, 1.4) + L('M-5.6 -131 C-8.4 -132.2 -12 -132.4 -14.6 -131.2', hairD, 1.4);
        } else {
            s += L('M5.6 -132 C8.4 -133.8 12 -133.8 14.6 -132.4', hairD, 1.4) + L('M-5.6 -132 C-8.4 -133.8 -12 -133.8 -14.6 -132.4', hairD, 1.4);
        }
        return s;
    }
    function mouth(mood, c) {
        var m = mk('lips');
        var lc = lipColor(), st = m ? m.style : null;
        var s = '', y = -108;
        var dark = '#9a3f52';
        if (mood === 'happy') {
            s += P('M-4.6 -.8 C-3.2 5.6 3.2 5.6 4.6 -.8 C2.4 -1.6 -2.4 -1.6 -4.6 -.8Z', dark, 'stroke="' + INK + '" stroke-width=".9" stroke-linejoin="round"');
            s += P('M-2.4 3.2 C-1 1.8 1 1.8 2.4 3.2 C1.2 4.6 -1.2 4.6 -2.4 3.2Z', '#f48a9a');
            s += P('M-3.6 -.6 C-1.6 -1.2 1.6 -1.2 3.6 -.6 L3.2 .8 C1.6 .4 -1.6 .4 -3.2 .8Z', '#fff');
            if (m) s += P('M-4.6 -.8 C-2.4 -1.6 2.4 -1.6 4.6 -.8', 'none', 'stroke="' + lc + '" stroke-width="1.6" stroke-linecap="round"');
        } else {
            var d, sm = 'M-3 0 Q0 1.8 3 0';
            if (mood === 'worried') sm = 'M-3 1.4 Q-1.4 -.6 0 .8 Q1.4 2 3 .2';
            else if (mood === 'proud') sm = 'M-3.2 .4 Q0 2.2 3.4 -.8';
            if (m) {
                var big = mood === 'proud' ? 'M-5 0 Q-2.5 -2.6 0 -1 Q2.5 -2.6 5 0 Q0 5 -5 0Z' : 'M-4.8 0 Q-2.4 -2.4 0 -.8 Q2.4 -2.4 4.8 0 Q0 4.6 -4.8 0Z';
                s += P(big, st === 'aj_ombre' ? 'url(#' + 'LIPOM' + ')' : lc, 'stroke="' + ol(lc) + '" stroke-width=".6" stroke-linejoin="round"');
                s += L('M-3.4 0 Q0 .9 3.4 0', shade(lc, -0.3), 0.5, 'opacity=".7"');
                if (st === 'aj_fenyes' || st === 'aj_balzsam' || st === 'aj_csillam') s += EL(-1.6, 1.7, 1.5, .6, '#fff', 'opacity=".8"');
                if (st === 'aj_csillam') s += sparkle(2.6, 1.2, 1, '#fff', 'opacity=".95"') + CI(-3, 1.6, .4, '#fff') + CI(0.4, 2.4, .35, '#fff', 'opacity=".9"');
            } else {
                s += L(sm, '#b4566a', 1.2);
                s += L('M-3 0 L-3.6 -.6', '#b4566a', 0.0);
            }
        }
        return G(s, 'translate(0 ' + y + ')');
    }
    function blushLayer(u, c) {
        var m = mk('blush');
        var col = m ? mkColor('blush', '#ff8aa8') : '#ff8aa8';
        var st = m ? m.style : null, s = '';
        var o = m ? 0.55 : 0.28;
        [1, -1].forEach(function (sg) {
            var x = sg * 15.2, y = -111;
            if (st === 'pi_anime') {
                s += EL(x, y, 4.6, 2.6, col, 'opacity=".6"');
                for (var i = 0; i < 3; i++) s += L('M' + n1(x - 2.4 + i * 2.3) + ' ' + n1(y + 1.6) + ' L' + n1(x - 1.2 + i * 2.3) + ' ' + n1(y - 1.6), tint(col, 0.5), 0.8, 'opacity=".9"');
            } else if (st === 'pi_orca') {
                s += EL(sg * 6.2, -113.4, 3.6, 2.4, col, 'opacity=".5"') + EL(x, y, 3.2, 1.9, col, 'opacity=".28"');
            } else if (st === 'pi_csillam') {
                s += EL(x, y, 4.4, 2.5, col, 'opacity="' + o + '"') + sparkle(x - 1.4, y - 1, 1, '#fff', 'opacity=".95"') + CI(x + 1.8, y + .8, .4, '#fff') + CI(x + .6, y - 1.4, .3, '#fff', 'opacity=".9"');
            } else {
                s += EL(x, y, 4.4, 2.5, col, 'opacity="' + o + '"');
            }
        });
        return s;
    }
    function decoLayer(c) {
        var m = mk('deco');
        if (!m) return '';
        var st = m.style, s = '';
        if (st === 'di_anyajegy') s += CI(-9.4, -106.4, .85, '#5a3a3a');
        else if (st === 'di_szeplo') {
            [[-14, -113], [-11.4, -111.4], [-12.6, -114.6], [-16, -111.6], [14, -113], [11.4, -111.4], [12.6, -114.6], [16, -111.6], [-3, -113.8], [3, -113.8]].forEach(function (p) { s += CI(p[0], p[1], .5, '#b5755a', 'opacity=".85"'); });
        } else if (st === 'di_szivmatrica') s += heart(-17.4, -115.4, 2.2, '#f4577a', 'stroke="#fff" stroke-width=".7"');
        else if (st === 'di_csillag') s += star(-17.8, -115.6, 2.8, '#ffd84a', 'stroke="#fff" stroke-width=".7" stroke-linejoin="round"');
        else if (st === 'di_sebtapasz') {
            s += G(RC(-5, -1.8, 10, 3.6, '#f1c9a6', 'rx="1.8" stroke="' + ol('#f1c9a6') + '" stroke-width=".7"') + RC(-2, -1.8, 4, 3.6, '#e9b78e') + CI(-3.4, 0, .3, '#c99970') + CI(3.4, 0, .3, '#c99970'), 'translate(-13.4 -112) rotate(-20)');
        } else if (st === 'di_csillamszem') {
            [[-1, -1], [1, 1]].forEach(function () {});
            [[-15.4, -114.6, 0], [-12.8, -112.4, 1], [15.4, -114.6, 0], [12.8, -112.4, 1]].forEach(function (p) { s += sparkle(p[0], p[1], p[2] ? 0.9 : 1.3, p[2] ? '#c7e8ff' : '#fff', 'opacity=".95"'); });
        }
        return s;
    }
    function faceLayer(u, c, mood) {
        var s = '';
        var face = 'M-24.5 -124 C-24.5 -141 -13.5 -149 0 -149 C13.5 -149 24.5 -141 24.5 -124 C24.5 -109.5 13.5 -98.5 0 -98.5 C-13.5 -98.5 -24.5 -109.5 -24.5 -124Z';
        s += SH(face, c.skin, 1.3);
        // áll-árnyék, orr
        s += P('M-17 -105 C-12 -100 12 -100 17 -105 C12 -98.6 -12 -98.6 -17 -105Z', c.skinD, 'opacity=".28"');
        s += L('M-1 -113.2 Q0 -112 1.2 -113.2', c.skinDD, 0.8, 'opacity=".75"');
        s += blushLayer(u, c);
        s += decoLayer(c);
        s += eye(1, mood, c) + eye(-1, mood, c);
        s += brows(mood, c.hairD);
        s += mouth(mood, c);
        if (mood === 'worried') s += P('M22 -138 C20.4 -134.6 19.6 -132.6 21.6 -131.4 C23.6 -132.6 23.4 -134.8 22 -138Z', '#bfe6fb', 'stroke="#78bde6" stroke-width=".7" stroke-linejoin="round"');
        return s;
    }

    // =========================================================
    // ÖSSZEÁLLÍTÁS
    // =========================================================
    C.avatar = function (o) {
        o = o || {};
        var u = o.uid || 'av';
        var eq = o.outfit || {};
        var mood = o.mood || 'neutral';
        var pose = o.pose || (mood === 'happy' ? 'wave' : 'idle');
        var skin = colorOf(D.SKINS, o.skin, '#efc09d');
        var hairId = o.hairColor;
        var hairC = colorOf(D.HAIR_COLORS, hairId, '#f4a3b8');
        var style = o.hairStyle || 'bob';
        var wig = eq.hair === 'parokni';
        if (wig) { style = 'hosszu'; hairC = '#f4a3b8'; }
        var col = {
            skin: skin, skinD: shade(skin, -0.12), skinDD: shade(skin, -0.34),
            hair: hairC, hairD: shade(hairC, -0.38),
            eye: EYES[hairId] || '#7a6a9a'
        };
        K = {};
        D.SLOTS.forEach(function (sl) {
            var id = eq[sl.id];
            if (!id) return;
            var itd = D.find(D.ITEMS, id);
            var pc = (o.colors && /^#[0-9a-fA-F]{6}$/.test(o.colors[sl.id] || '')) ? o.colors[sl.id] : (itd && itd.paint);
            if (pc) K[sl.id] = pc;
        });
        MK = {};
        if (o.makeup && typeof o.makeup === 'object') {
            Object.keys(o.makeup).forEach(function (slot) {
                var m = o.makeup[slot], b = m && D.find(D.BEAUTY, m.style);
                if (!b || b.slot !== slot) return;
                MK[slot] = { style: b.id, color: (m.color && /^#[0-9a-fA-F]{6}$/.test(m.color)) ? m.color : null };
            });
        }
        var hairFill = wig ? 'url(#' + u + '-wig)' : hairC;
        var edge = wig ? '#9a6fb4' : ol(hairC);
        var top = eq.top || 'tee';
        var out = [];

        out.push(defs(u, col).replace(/LIPOM/g, u + '-lipom'));
        out.push(EL(0, 0.4, 23, 3.2, 'rgba(59,45,74,.16)'));
        out.push(backBehind(u, eq.back));
        out.push(hairBack(u, style, hairFill, edge));

        // lábak, lábszár-viselet, cipő
        out.push(legsBase(col));
        out.push(legWear(u, eq.legs, col));
        out.push(shoes(u, eq.shoes || ''));

        // nyak + törzs (bőr), alsó ruha
        out.push(SH('M-4.8 -101 L4.8 -101 L4.8 -94 L-4.8 -94Z', col.skin, 1.2));
        out.push(SH(torsoShape(-94.6, -50, 0, { neckW: 5, neckDip: 1.4, sag: 0.8 }), col.skin, 1.2));
        out.push(P('M-4.8 -99 C-3 -95.4 3 -95.4 4.8 -99 L4.8 -94 L-4.8 -94Z', col.skinDD, 'opacity=".22"'));
        out.push(bottomWear(u, eq.bottom || 'jeans'));
        out.push(P('M-1.4 -78 Q0 -77 1.4 -78', 'none', 'stroke="' + col.skinDD + '" stroke-width=".7" stroke-linecap="round" opacity=".6"'));

        // felső
        out.push(topBase(u, top));
        out.push(topDetails(u, top));
        out.push(eq.back === 'cicahatizsak' ? backFront(u, eq.back) : '');

        // karok (a ruhaujjakkal és kezekkel)
        out.push(armsLayer(u, pose, top, col));
        out.push(neckWear(u, eq.neck));

        // fej: fül, arc, smink, haj, kiegészítők
        out.push(earSkin(col, style));
        out.push(faceLayer(u, col, mood));
        out.push(faceWear(u, eq.face));
        out.push(hairFront(u, style, hairFill, edge, col));
        out.push(hairAccessory(u, eq.hair, hairC, col.hairD));
        out.push(earrings(u, eq.face));

        return '<g class="av-body">' + out.join('') + '</g>';
    };

    C.portrait = function (o, vb) {
        var uid = 'pt' + (o && o.uid ? o.uid : '');
        return '<svg viewBox="' + (vb || '-52 -176 104 184') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Karakter">' + C.avatar(Object.assign({}, o, { uid: uid })) + '</svg>';
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof globalThis !== 'undefined' ? globalThis : this);
