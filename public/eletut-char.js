// =========================================================
// PASZTELL ÉLETÚT - a karakter rajza (SVG), realisztikus arányokkal
//
// Külön fájl: itt él a rétegelt karakter (haj, arc, test, ruhák, kiegészítők, hangulatok).
// A hátterek és jelenetek az eletut-art.js-ben vannak, azok ezt hívják.
//
// Koordináták: a talpak közepe az origó, a karakter ~162 egység magas (a haj teteje kb. -170).
// A test körvonalát profilgörbék írják le (törzs: félszélesség a magasság függvényében, végtagok: középvonal
// + vastagság), a ruhák ezekből számolódnak, ezért mindig pontosan illeszkednek a testre.
// Minden függvény tiszta szöveget ad (SVG-markup), ezért Node-ban is tesztelhető.
//
// Opciók: { skin, hairStyle, hairColor, outfit:{slot:itemId}, mood:'neutral|happy|worried|proud', pose:'idle|wave|hips', uid }
// Rétegsorrend: hátsó haj, lábak, cipő, alsó ruha, nyak+törzs, felső, karok és ujjak, gallérok, fej és arc, elülső haj, kiegészítők.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var C = M.char = {};

    var INK = '#3a2f45';
    var LINE = 'rgba(58,47,69,.4)';

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
    function colorOf(list, id, fallback) {
        var f = D && D.find ? D.find(list, id) : null;
        return f ? f.color : fallback;
    }
    // természetes szemszínek (a haj színe felé hajlítva)
    var EYES = { rozsa: '#8a5a62', kek: '#3f7fa6', feher: '#6f86a6', fekete: '#4a3a30', lila: '#6a5090', barna: '#7a4a2a', szoke: '#4f7f62' };

    // ---------- Rajzoló segédek ----------
    function n1(v) { return Math.round(v * 10) / 10; }
    function P(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function L(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
    function CI(x, y, r, fill, extra) { return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function EL(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function RC(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function mirror(s) { return '<g transform="scale(-1 1)">' + s + '</g>'; }
    var OUT = 'stroke="' + LINE + '" stroke-width=".7" stroke-linejoin="round"';

    // ---------- Görbék ----------
    function crPt(p0, p1, p2, p3, t) {
        var t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    }
    // Profil: [[y, érték], ...] növekvő y szerint, simított
    function profile(keys) {
        return function (y) {
            var n = keys.length;
            if (y <= keys[0][0]) return keys[0][1];
            if (y >= keys[n - 1][0]) return keys[n - 1][1];
            var i = 0;
            while (i < n - 2 && y > keys[i + 1][0]) i++;
            var a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(n - 1, i + 2)];
            var t = (y - b[0]) / (c[0] - b[0]);
            var m1 = (c[1] - a[1]) / ((c[0] - a[0]) || 1) * (c[0] - b[0]);
            var m2 = (d[1] - b[1]) / ((d[0] - b[0]) || 1) * (c[0] - b[0]);
            var t2 = t * t, t3 = t2 * t;
            return (2 * t3 - 3 * t2 + 1) * b[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * c[1] + (t3 - t2) * m2;
        };
    }
    // Végtag: pontok [{x,y,w}] -> minták (középvonal, vastagság, normális)
    function limb(pts, N) {
        N = N || 24;
        var out = [], n = pts.length;
        for (var k = 0; k <= N; k++) {
            var u = (k / N) * (n - 1), i = Math.min(n - 2, Math.floor(u)), t = u - i;
            var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
            out.push({ x: crPt(p0.x, p1.x, p2.x, p3.x, t), y: crPt(p0.y, p1.y, p2.y, p3.y, t), w: crPt(p0.w, p1.w, p2.w, p3.w, t) });
        }
        for (var j = 0; j < out.length; j++) {
            var a = out[Math.max(0, j - 1)], b = out[Math.min(out.length - 1, j + 1)];
            var dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
            out[j].tx = dx / l; out[j].ty = dy / l; out[j].nx = -dy / l; out[j].ny = dx / l;
        }
        return out;
    }
    function easeAt(ease, s) { return typeof ease === 'function' ? ease(s) : (ease || 0); }
    // Végtag-szakasz körvonala (s0..s1 a 0..1 tartományban), ease: szám vagy függvény(s)
    function limbPath(S, s0, s1, ease, cap) {
        var N = S.length - 1, i0 = Math.round(s0 * N), i1 = Math.round(s1 * N), A = [], B = [], i;
        for (i = i0; i <= i1; i++) {
            var s = S[i], h = s.w / 2 + easeAt(ease, i / N);
            A.push(n1(s.x + s.nx * h) + ' ' + n1(s.y + s.ny * h));
            B.push(n1(s.x - s.nx * h) + ' ' + n1(s.y - s.ny * h));
        }
        var close = 'z';
        if (cap) {
            var h0 = S[i0].w / 2 + easeAt(ease, i0 / N);
            close = ' A' + n1(h0) + ' ' + n1(h0) + ' 0 0 0 ' + A[0] + 'z';
        }
        return 'M' + A.join(' L') + ' L' + B.reverse().join(' L') + close;
    }
    function limbAt(S, s) { return S[Math.max(0, Math.min(S.length - 1, Math.round(s * (S.length - 1))))]; }
    // Keresztvonal egy végtag adott helyén (hajtás, varrás)
    function limbCross(S, s, ease) {
        var p = limbAt(S, s), h = p.w / 2 + (ease || 0);
        return 'M' + n1(p.x + p.nx * h) + ' ' + n1(p.y + p.ny * h) + ' L' + n1(p.x - p.nx * h) + ' ' + n1(p.y - p.ny * h);
    }
    function limbEdgeLine(S, s0, s1, side, ease) {
        var N = S.length - 1, i0 = Math.round(s0 * N), i1 = Math.round(s1 * N), A = [];
        for (var i = i0; i <= i1; i++) {
            var p = S[i], h = p.w / 2 + easeAt(ease, i / N);
            A.push(n1(p.x + side * p.nx * h) + ' ' + n1(p.y + side * p.ny * h));
        }
        return 'M' + A.join(' L');
    }

    // ---------- A test ----------
    // Törzs félszélessége y függvényében (y felfelé negatív)
    var W = profile([[-122, 5.2], [-120, 8.2], [-117.4, 13.4], [-114.5, 15.6], [-110, 15.4], [-104, 14.2], [-96, 12.8], [-88, 11.2], [-82, 10.8], [-76, 12.4], [-70, 13.9], [-66, 14.2]]);

    function torsoPts(y0, y1, easeFn, step) {
        var left = [], right = [];
        step = step || 2;
        for (var y = y0; y <= y1 + 0.001; y += step) {
            var w = W(y) + easeAt(easeFn, y);
            left.push(n1(-w) + ' ' + n1(y));
            right.push(n1(w) + ' ' + n1(y));
        }
        return { left: left, right: right };
    }
    function torsoBand(y0, y1, ease, fill, extra) {
        var p = torsoPts(y0, y1, ease, 1);
        return P('M' + p.left.join(' L') + ' L' + p.right.slice().reverse().join(' L') + 'z', fill, extra || OUT);
    }
    // Törzsruha körvonala: nyakkivágással felül, vízszintes hem-vonallal alul
    function torsoPoly(o) {
        var yS = -121.4;
        var p = torsoPts(yS, o.y1, o.ease, 2);
        var nw = o.neckW || 6.2;
        var d = 'M' + n1(-nw) + ' ' + yS + ' L' + p.left.join(' L') + ' L' + p.right.slice().reverse().join(' L') + ' L' + n1(nw) + ' ' + yS;
        var dip = o.neckDip === undefined ? 3.4 : o.neckDip;
        d += ' Q0 ' + n1(yS + dip * 2) + ' ' + n1(-nw) + ' ' + yS + 'z';
        return d;
    }

    // Lábak (bal oldali; a jobbot tükrözzük)
    var LEG = limb([
        { x: -6.8, y: -71, w: 13.4 }, { x: -6.6, y: -54, w: 11.8 }, { x: -6.1, y: -38, w: 9.0 },
        { x: -5.9, y: -26, w: 9.2 }, { x: -5.5, y: -12, w: 5.8 }, { x: -5.4, y: -5, w: 5.2 }
    ], 28);
    // Karok: lógó (bal oldali), a pózok a jobb karhoz
    var ARM_IDLE = limb([
        { x: -14.0, y: -114.6, w: 8.2 }, { x: -17.8, y: -101, w: 7.4 }, { x: -19.4, y: -91, w: 6.4 },
        { x: -20.2, y: -80, w: 5.6 }, { x: -20.6, y: -70, w: 4.8 }
    ], 24);
    var ARM_WAVE = limb([
        { x: 14.0, y: -114.6, w: 8.2 }, { x: 21.4, y: -106, w: 7.2 }, { x: 25.6, y: -99, w: 6.2 },
        { x: 27.6, y: -110, w: 5.4 }, { x: 28.2, y: -121, w: 4.8 }
    ], 24);
    var ARM_HIPS = limb([
        { x: 14.0, y: -114.6, w: 8.2 }, { x: 21.4, y: -101, w: 7.2 }, { x: 24.4, y: -92, w: 6.2 },
        { x: 20.8, y: -83, w: 5.4 }, { x: 15.6, y: -77, w: 4.8 }
    ], 24);

    // ---------- Közös definíciók ----------
    function defs(u, c) {
        var d = '<defs>';
        d += '<linearGradient id="' + u + '-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c.skinD + '"/><stop offset=".3" stop-color="' + c.skin + '"/><stop offset=".62" stop-color="' + c.skinL + '"/><stop offset="1" stop-color="' + c.skin + '"/></linearGradient>';
        d += '<radialGradient id="' + u + '-face" cx=".47" cy=".4" r=".7"><stop offset="0" stop-color="' + c.skinL + '"/><stop offset=".6" stop-color="' + c.skin + '"/><stop offset="1" stop-color="' + shade(c.skin, -0.1) + '"/></radialGradient>';
        d += '<linearGradient id="' + u + '-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hairL + '"/><stop offset=".35" stop-color="' + c.hair + '"/><stop offset="1" stop-color="' + c.hairD + '"/></linearGradient>';
        d += '<linearGradient id="' + u + '-wig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbc4d4"/><stop offset=".5" stop-color="#f4a3b8"/><stop offset="1" stop-color="#8fcdf2"/></linearGradient>';
        d += '<linearGradient id="' + u + '-iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(c.eye, -0.5) + '"/><stop offset=".6" stop-color="' + c.eye + '"/><stop offset="1" stop-color="' + shade(c.eye, 0.4) + '"/></linearGradient>';
        d += '<linearGradient id="' + u + '-gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>';
        d += '<linearGradient id="' + u + '-gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>';
        d += '<radialGradient id="' + u + '-bl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7a9c" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a9c" stop-opacity="0"/></radialGradient>';
        d += '<pattern id="' + u + '-plaid" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#a9cdee"/><rect width="9" height="3.2" fill="#6f9fd6" opacity=".75"/><rect width="3.2" height="9" fill="#f5a9b8" opacity=".8"/><rect x="5" width=".8" height="9" fill="#fff" opacity=".55"/><rect y="5" width="9" height=".8" fill="#fff" opacity=".55"/></pattern>';
        d += '<pattern id="' + u + '-lace" width="3.6" height="3.6" patternUnits="userSpaceOnUse"><path d="M0 1.8 L1.8 0 L3.6 1.8 L1.8 3.6z" fill="none" stroke="#fff" stroke-width=".55" opacity=".8"/></pattern>';
        d += '<linearGradient id="' + u + '-gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdbaf2"/><stop offset=".6" stop-color="#b89fe8"/><stop offset="1" stop-color="#9e86dc"/></linearGradient>';
        d += '<linearGradient id="' + u + '-tulle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d9fb" stop-opacity=".9"/><stop offset="1" stop-color="#cdb8f4" stop-opacity=".75"/></linearGradient>';
        d += '</defs>';
        return d;
    }

    // Ruhadarab: alap + fény/árnyék + körvonal
    function garment(u, d, fill, extra) {
        return P(d, fill, OUT + (extra ? ' ' + extra : '')) + P(d, 'url(#' + u + '-gs)') + P(d, 'url(#' + u + '-gv)');
    }
    function fold(d, col, op, w) { return L(d, col, w || .7, 'opacity="' + (op || 0.35) + '"'); }

    // =========================================================
    // LÁBAK, LÁBSZÁR-VISELETEK, CIPŐ
    // =========================================================
    function legSkin(u, c) {
        var s = P(limbPath(LEG, 0, 1, 0), 'url(#' + u + '-limb)', OUT);
        var kn = limbAt(LEG, 0.5);
        s += EL(kn.x, kn.y, 3.2, 2.2, c.skinD, 'opacity=".16"');
        s += L('M' + n1(kn.x - 2.6) + ' ' + n1(kn.y + 3) + ' q2.6 1.2 5.2 0', c.skinDD, .5, 'opacity=".25"');
        var cf = limbAt(LEG, 0.72);
        s += L('M' + n1(cf.x + 1.6) + ' ' + n1(cf.y - 6) + ' C' + n1(cf.x + 2.6) + ' ' + n1(cf.y - 2) + ' ' + n1(cf.x + 2) + ' ' + n1(cf.y + 3) + ' ' + n1(cf.x + 1.2) + ' ' + n1(cf.y + 7), '#fff', 1.1, 'opacity=".2"');
        return s;
    }

    function legItem(u, kind) {
        var s = '';
        if (kind === 'zokni') {
            var d = limbPath(LEG, 0.72, 0.96, 0.5);
            s += P(d, '#fdf6fa', OUT);
            s += P(limbPath(LEG, 0.72, 0.77, 0.55), '#f5a9b8');
            s += P(limbPath(LEG, 0.82, 0.845, 0.52), '#9fd6f5');
            s += P(limbPath(LEG, 0.88, 0.905, 0.5), '#f5a9b8');
            s += P(d, 'url(#' + u + '-gs)');
        } else if (kind === 'combzokni') {
            var t = limbPath(LEG, 0.1, 0.97, 0.45);
            s += P(t, '#f4a3b8', OUT);
            s += P(t, 'url(#' + u + '-gs)');
            s += P(limbPath(LEG, 0.1, 0.19, 0.55), '#fdf6fa', OUT);
            s += L(limbCross(LEG, 0.185, 0.55), '#e8d6ee', .5);
            s += P(limbPath(LEG, 0.43, 0.46, 0.5), '#fdf6fa', 'opacity=".85"');
            s += P(limbPath(LEG, 0.52, 0.535, 0.5), '#fdf6fa', 'opacity=".6"');
        } else if (kind === 'harisnya') {
            var h = limbPath(LEG, 0.04, 0.97, 0.35);
            s += P(h, '#3a2f45', 'opacity=".34"');
            s += P(h, 'url(#' + u + '-lace)', 'opacity=".9"');
            s += P(h, 'url(#' + u + '-gs)');
            s += P(limbPath(LEG, 0.04, 0.075, 0.4), '#3a2f45', 'opacity=".4"');
        }
        return s;
    }

    function shoe(x) {
        // bal cipő, helyi koordináták (a bokától lefelé)
        var s = '<g transform="translate(' + n1(x) + ' 0) rotate(-5)">';
        s += P('M-5 -11.4 C-5.6 -8 -6.6 -5.6 -6.6 -2.6 C-6.6 -.8 -5.6 .1 -3.6 .1 L4.2 .1 C6.2 .1 7.2 -.8 7.2 -2.6 C7.2 -5.4 6 -8 5.2 -11.4z', '#fbf7ff', OUT);
        s += P('M-6.4 -3.4 C-4 -4.6 4 -4.6 7 -3.4 C7.3 -2 6.8 -.4 5.2 0 L-4.6 0 C-6 -.4 -6.7 -1.8 -6.4 -3.4z', '#eadff3');
        s += P('M-6.8 -1.5 L7.4 -1.5 L7.2 1 C7 1.4 6.6 1.6 6 1.6 L-5.8 1.6 C-6.6 1.6 -7 1.2 -7 .6z', '#f5a9b8', 'stroke="' + LINE + '" stroke-width=".5"');
        s += L('M-3.6 -8.6 L3.6 -7.6 M-3.8 -6.2 L3.8 -5.2', '#f5a9b8', .9);
        s += P('M-4.4 -11.4 C-3 -12.4 3 -12.4 4.4 -11.4 L4.6 -9.6 C2 -10.4 -2 -10.4 -4.6 -9.6z', '#d9cce6', 'opacity=".9"');
        s += L('M-4.8 -9.4 C-6 -7 -6.2 -4.8 -6 -3', '#fff', .7, 'opacity=".8"');
        s += L('M-2 -2.8 C0 -3.4 3 -3.4 5.4 -2.8', '#cdbfdc', .5);
        s += '</g>';
        return s;
    }

    // =========================================================
    // ALSÓ RUHÁK (a test profiljából)
    // =========================================================
    function legGarment(u, s0, s1, ease, fill) {
        var d = limbPath(LEG, s0, s1, ease);
        return P(d, fill, OUT) + P(d, 'url(#' + u + '-gs)') + P(d, 'url(#' + u + '-gv)');
    }
    // A-vonalú szoknya a derékvonaltól a hemig
    function skirtPath(yTop, yHem, hemHalf, wave, sway) {
        var wt = W(yTop) + 0.8, k, steps = 6, hemPts = [];
        for (k = 0; k <= steps; k++) {
            var t = k / steps, x = -hemHalf + t * 2 * hemHalf;
            var y = yHem + Math.sin(t * Math.PI * wave) * (sway || 1.2) * (k === 0 || k === steps ? 0.5 : 1);
            hemPts.push(n1(x) + ' ' + n1(y));
        }
        var d = 'M' + n1(-wt) + ' ' + yTop + ' C' + n1(-wt - 1) + ' ' + n1(yTop + (yHem - yTop) * 0.35) + ' ' + n1(-hemHalf + 1.5) + ' ' + n1(yHem - (yHem - yTop) * 0.25) + ' ' + hemPts[0];
        for (k = 1; k <= steps; k++) d += ' L' + hemPts[k];
        d += ' C' + n1(hemHalf - 1.5) + ' ' + n1(yHem - (yHem - yTop) * 0.25) + ' ' + n1(wt + 1) + ' ' + n1(yTop + (yHem - yTop) * 0.35) + ' ' + n1(wt) + ' ' + yTop + 'z';
        return d;
    }
    function skirtPleats(yTop, yHem, hemHalf, n, col, op) {
        var s = '', wt = W(yTop) + 0.8;
        for (var i = 1; i < n; i++) {
            var t = i / n - 0.5;
            s += L('M' + n1(t * 2 * wt * 0.9) + ' ' + n1(yTop + 1) + ' C' + n1(t * 2 * wt * 1.05) + ' ' + n1(yTop + (yHem - yTop) * 0.4) + ' ' + n1(t * 2 * hemHalf * 0.92) + ' ' + n1(yHem - (yHem - yTop) * 0.3) + ' ' + n1(t * 2 * hemHalf) + ' ' + n1(yHem - 1), col, .7, 'opacity="' + (op || 0.5) + '"');
        }
        return s;
    }

    function bottomWear(u, kind) {
        var s = '';
        if (!kind) {
            // capri farmer
            var den = '#6f98cf', dd = shade(den, -0.28);
            var legD = limbPath(LEG, 0, 0.7, 1.4);
            var jean = P(legD, den, OUT) + P(legD, 'url(#' + u + '-gs)') + P(legD, 'url(#' + u + '-gv)') +
                P(limbPath(LEG, 0.66, 0.7, 1.4), '#5f88bf', 'opacity=".85"') +
                L(limbEdgeLine(LEG, 0.04, 0.64, -1, 0.9), '#e8c47a', .45, 'stroke-dasharray="1.2 .9"') +
                fold('M-9 -58 q1.4 6 .6 12', '#fff', .3, 1) + fold('M-6 -54 q-.6 4 -2 6', dd, .5, .6) +
                fold('M-13 -68 q4 0 5.6 3.6', dd, .6, .5);
            s += jean + mirror(jean);
            s += torsoBand(-74, -70.4, 1.6, '#5f88bf');
            s += RC(-1.6, -74, 3.2, 3.4, '#e0c37a', 'rx=".6"');
            s += L('M0 -70.4 V-61 M0 -61 q2 3 .8 5', dd, .6, 'opacity=".7"');
            s += L('M-12.6 -74.4 v3.4 M12.6 -74.4 v3.4 M-7 -74.4 v3 M7 -74.4 v3', dd, .9);
        } else if (kind === 'rovid') {
            var sh = '#a9cdee';
            var sd = limbPath(LEG, 0, 0.46, 1.8);
            var shorts = P(sd, sh, OUT) + P(sd, 'url(#' + u + '-gs)') + P(sd, 'url(#' + u + '-gv)') + P(limbPath(LEG, 0.42, 0.46, 1.8), '#8fb8e0', 'opacity=".9"') + fold('M-11 -68 q-1 5 .4 9', shade(sh, -0.3), .5, .6);
            s += shorts + mirror(shorts);
            s += torsoBand(-74, -70.4, 1.4, '#8fb8e0');
            s += CI(0, -72.2, 1.1, '#fff', 'stroke="#7ba5d2" stroke-width=".4"');
            s += L('M0 -70.4 V-63', shade(sh, -0.25), .5);
        } else if (kind === 'szoknya') {
            var pk = '#f4a3b8', yT = -74, yH = -44, hh = 21;
            s += garment(u, skirtPath(yT, yH, hh, 6, 1.2), pk);
            s += skirtPleats(yT, yH, hh, 10, shade(pk, -0.25), .6) + skirtPleats(yT, yH, hh, 10, '#fff', .16);
            s += torsoBand(-75.4, -72, 1.0, '#e58aa3');
            s += L('M-20 ' + (yH + 0.4) + ' Q-10 ' + (yH + 2.4) + ' 0 ' + (yH + 0.6) + ' Q10 ' + (yH + 2.4) + ' 20 ' + (yH + 0.4), '#fff', .7, 'opacity=".5"');
        } else if (kind === 'tenisz') {
            var yT2 = -74, yH2 = -52, hh2 = 17.5;
            s += garment(u, skirtPath(yT2, yH2, hh2, 6, 1), '#fdf6fa');
            s += skirtPleats(yT2, yH2, hh2, 9, '#cdbfdc', .7);
            s += torsoBand(-75.4, -72, 1.0, '#f4a3b8');
            s += P('M' + n1(-hh2 + 0.6) + ' ' + n1(yH2 - 4) + ' L' + n1(hh2 - 0.6) + ' ' + n1(yH2 - 4) + ' L' + n1(hh2) + ' ' + n1(yH2 - 0.6) + ' L' + n1(-hh2) + ' ' + n1(yH2 - 0.6) + 'z', '#9fd6f5', 'opacity=".9"');
            s += P('M' + n1(-hh2 + 0.5) + ' ' + n1(yH2 - 6.6) + ' L' + n1(hh2 - 0.5) + ' ' + n1(yH2 - 6.6) + ' L' + n1(hh2 - 0.6) + ' ' + n1(yH2 - 4) + ' L' + n1(-hh2 + 0.6) + ' ' + n1(yH2 - 4) + 'z', '#f4a3b8', 'opacity=".9"');
        } else if (kind === 'kilt') {
            var yT3 = -74, yH3 = -46, hh3 = 20;
            var d3 = skirtPath(yT3, yH3, hh3, 4, 0.8);
            s += P(d3, 'url(#' + u + '-plaid)', OUT) + P(d3, 'url(#' + u + '-gs)') + P(d3, 'url(#' + u + '-gv)');
            s += skirtPleats(yT3, yH3, hh3, 11, 'rgba(58,47,69,.6)', .5);
            s += torsoBand(-75.4, -72, 1.0, '#6f9fd6');
            s += L('M-4 -72 L-6 ' + yH3, 'rgba(58,47,69,.5)', .7);
            s += P('M-8 -66 L-3 -66 L-3 -59 L-8 -59z', '#d9d2e8', 'stroke="#8a7aa0" stroke-width=".5"');
            s += L('M-5.5 -66 V-73', '#cfc8de', 1.4);
        } else if (kind === 'estelyi') {
            var yT4 = -74, yH4 = -3, hh4 = 31;
            s += garment(u, skirtPath(yT4, yH4, hh4, 6, 1.6), 'url(#' + u + '-gown)');
            s += skirtPleats(yT4, yH4, hh4, 12, 'rgba(255,255,255,.4)', .55) + skirtPleats(yT4, yH4, hh4, 12, shade('#9e86dc', -0.2), .25);
            s += P(skirtPath(yT4 + 4, yH4 + 1, hh4 + 3, 6, 2.4), 'url(#' + u + '-tulle)', 'opacity=".45"');
            [[-14, -30], [10, -42], [-4, -18], [18, -18], [-22, -12], [4, -58], [-9, -52], [24, -26], [-17, -52], [12, -8]].forEach(function (p, k) {
                s += P('M' + p[0] + ' ' + n1(p[1] - 2.4) + ' l.7 1.6 1.6 .8 -1.6 .8 -.7 1.6 -.7 -1.6 -1.6 -.8 1.6 -.8z', '#fff', 'opacity="' + (k % 2 ? 0.95 : 0.7) + '"');
            });
            s += torsoBand(-76, -72, 1.1, '#9a82d8');
            s += P('M0 -74 L-6.4 -78 L-5.6 -69.6z M0 -74 L6.4 -78 L5.6 -69.6z', '#f4a3b8', OUT) + CI(0, -74, 1.8, '#e58aa3');
            s += L('M0 -72 q-3 7 -4 14 M0 -72 q3 7 4 14', '#f4a3b8', 1.2);
        }
        return s;
    }

    // =========================================================
    // FELSŐ RUHÁK
    // =========================================================
    var HEM = -66;
    var SLEEVES = {
        '': { to: 0.42, col: '#b9c2da', ease: 1.0 },
        polo: { to: 0.44, col: '#f6b5c5', ease: 1.0, band: '#fff2f6' },
        pulcsi: { to: 0.97, col: '#8fd3f4', ease: 1.8, cuff: '#6fbde4' },
        crop: { to: 0.36, col: '#ffc2d1', ease: 0.7 },
        bluz: { to: 0.78, col: '#fdf8fd', ease: 1.2, flare: 1.6, cuff: '#f4a3b8' },
        kabat: { to: 0.97, col: '#cdb7f0', ease: 1.8, cuff: '#fdf6fa' }
    };

    function topBack(u, kind) {
        if (kind !== 'pulcsi') return '';
        return P('M-10.4 -121.6 C-12 -128 -9 -133 -4 -134.4 C0 -135.2 4 -134.4 8 -133 C12 -130 12 -125 10.4 -121.6 Q0 -117 -10.4 -121.6z', shade('#8fd3f4', -0.16), OUT);
    }

    function topBody(u, kind) {
        var s = '', i;
        if (!kind) {
            var tee = '#b9c2da';
            s += garment(u, torsoPoly({ y1: HEM, ease: function (y) { return 1.4 + Math.max(0, (y + 88)) * 0.04; }, neckW: 6.6, neckDip: 3 }), tee);
            s += fold('M-9 -98 q3 3 7 2 M7 -90 q3 2 6 1 M-12 -80 q4 2 8 0', shade(tee, -0.25), .5, .7);
            s += fold('M-12 -70 q6 3 12 1 q6 -2 12 -1', shade(tee, -0.3), .5, .7);
            s += fold('M-11.6 -108 q-2.4 8 -1.8 16', '#fff', .35, 1);
            s += L('M-12.8 -66.6 H12.8', shade(tee, -0.3), .6, 'opacity=".6"');
        } else if (kind === 'polo') {
            var po = '#f6b5c5';
            s += garment(u, torsoPoly({ y1: HEM, ease: 1.5, neckW: 6.4, neckDip: 1.6 }), po);
            s += L('M0 -119.4 V-102', shade(po, -0.25), .6);
            s += P('M-1.6 -120 L1.6 -120 L1.6 -102 L-1.6 -102z', 'none', 'stroke="' + shade(po, -0.2) + '" stroke-width=".5"');
            s += CI(0, -114, .9, '#fff', 'stroke="' + shade(po, -0.25) + '" stroke-width=".3"') + CI(0, -108, .9, '#fff', 'stroke="' + shade(po, -0.25) + '" stroke-width=".3"');
            s += fold('M-9 -96 q3 2 7 1 M7 -88 q3 2 6 1', shade(po, -0.25), .5, .7);
            s += fold('M-12 -70 q6 3 12 1 q6 -2 12 -1', shade(po, -0.3), .5, .7);
        } else if (kind === 'pulcsi') {
            var hd = '#8fd3f4';
            var ez = function (y) { return 2.4 + Math.max(0, (y + 90)) * 0.03; };
            s += garment(u, torsoPoly({ y1: -63, ease: ez, neckW: 7.2, neckDip: 2.4 }), hd);
            s += torsoBand(-67, -63, ez, shade(hd, -0.12));
            for (i = -12; i <= 12; i += 2) s += L('M' + i + ' -67 V-63', shade(hd, -0.3), .4, 'opacity=".5"');
            s += P('M-10.4 -88 L10.4 -88 L12.6 -72 L-12.6 -72z', shade(hd, -0.1), 'stroke="' + shade(hd, -0.3) + '" stroke-width=".6"');
            s += L('M-9 -87.4 L-11.2 -73 M9 -87.4 L11.2 -73', shade(hd, -0.3), .5);
            s += fold('M-8 -103 q-1 6 .6 11 M9 -104 q1 6 -.6 10', shade(hd, -0.25), .5, .8);
            s += fold('M-12 -82 q-1 5 1 10 M12 -82 q1 5 -1 10', '#fff', .25, 1);
        } else if (kind === 'crop') {
            var cr = '#ffc2d1';
            s += garment(u, torsoPoly({ y1: -91, ease: 0.7, neckW: 6.6, neckDip: 4.4 }), cr);
            s += torsoBand(-93.4, -91, 0.7, '#fdf6fa');
            s += fold('M-8 -108 q-1 5 1.4 9 M8 -108 q1 5 -1.4 9', shade(cr, -0.28), .5, .8);
            s += P('M-2.4 -112 L0 -108.4 L2.4 -112 L0 -114.6z', '#fff', 'opacity=".85"');
        } else if (kind === 'bluz') {
            var bl = '#fdf8fd';
            s += garment(u, torsoPoly({ y1: -69, ease: function (y) { return 1.2 + Math.max(0, (y + 96)) * 0.03; }, neckW: 6.6, neckDip: 2.6 }), bl);
            s += L('M0 -119 V-69', '#e8dcf0', .6);
            for (i = 0; i < 5; i++) s += CI(0, -113 + i * 9.6, .85, '#f4a3b8', 'stroke="#e58aa3" stroke-width=".3"');
            s += fold('M-8 -102 q3 2 7 1 M8 -96 q2 2 5 1', '#d8c8e4', .7, .6);
            s += fold('M-12 -80 q-1 5 .4 9 M12 -80 q1 5 -.4 9', '#d8c8e4', .7, .6);
            s += fold('M-11 -76 q4 4 9 3 M11 -76 q-4 4 -9 3', '#d8c8e4', .6, .6);
            s += L('M-13 -69 q6 2 13 1 q7 1 13 -1', '#e0d2ea', .6);
        } else if (kind === 'kabat') {
            var ct = '#cdb7f0', yb = -34;
            var hemW = function (y) { return 1.8 + Math.max(0, y + 78) * 0.12; };
            var pL = torsoPts(-121.4, yb, hemW, 2);
            var d6 = 'M-7 -121.4 L' + pL.left.join(' L') + ' Q0 ' + (yb + 3) + ' ' + pL.right[pL.right.length - 1] + ' L' + pL.right.slice().reverse().join(' L') + ' L7 -121.4 Q0 -111 -7 -121.4z';
            s += garment(u, d6, ct);
            s += L('M0 -112 V' + (yb + 1), shade(ct, -0.3), .7);
            s += P('M-7.4 -121 L-1.2 -102 L-5.6 -97 L-12.4 -115z', shade(ct, -0.13), OUT);
            s += P('M7.4 -121 L1.2 -102 L5.6 -97 L12.4 -115z', shade(ct, -0.13), OUT);
            for (i = 0; i < 3; i++) s += CI(-2.4, -86 + i * 13, 1.3, '#fff', 'stroke="' + shade(ct, -0.35) + '" stroke-width=".5"');
            s += torsoBand(-83.6, -79.4, hemW, '#a98fe0');
            s += RC(-2.6, -84, 5.2, 5, '#e0d2fa', 'rx=".8" stroke="#8a74c6" stroke-width=".5"');
            s += L('M-13 -66 l-1 9 M13 -66 l1 9', shade(ct, -0.3), .6);
            s += fold('M-10 -100 q-1 6 .6 10 M10 -100 q1 6 -.6 10', shade(ct, -0.3), .5, .8);
            s += fold('M-14 -60 q-2 14 -3 24 M14 -60 q2 14 3 24', shade(ct, -0.3), .45, .8);
            s += L('M-15 ' + (yb + 0.6) + ' Q0 ' + (yb + 4) + ' 15 ' + (yb + 0.6), 'rgba(255,255,255,.5)', .7);
        }
        return s;
    }

    function collar(u, kind) {
        var s = '';
        if (kind === 'polo') {
            s += P('M-6.8 -121.6 L-1.8 -117 L0 -120 L1.8 -117 L6.8 -121.6 L4.4 -124 L0 -121 L-4.4 -124z', '#fdeaf0', OUT);
            s += L('M-4.4 -124 L-1.2 -118.6 M4.4 -124 L1.2 -118.6', '#e8cdd7', .5);
        } else if (kind === 'pulcsi') {
            var hd = '#8fd3f4';
            s += P('M-8 -121.4 C-6 -116.6 6 -116.6 8 -121.4 C9 -124 7 -126 5 -125.4 C2 -121.6 -2 -121.6 -5 -125.4 C-7 -126 -9 -124 -8 -121.4z', shade(hd, -0.12), OUT);
            s += L('M-3.4 -118 L-4.2 -105 M3.4 -118 L4.2 -105', '#fdf6fa', .9);
            s += CI(-4.2, -104.4, 1.1, '#fdf6fa') + CI(4.2, -104.4, 1.1, '#fdf6fa');
        } else if (kind === 'bluz') {
            s += P('M0 -119.4 L-6.6 -125.8 C-9 -123 -9.4 -118.6 -8 -115.6 L-1 -116.6z', '#fff', OUT);
            s += P('M0 -119.4 L6.6 -125.8 C9 -123 9.4 -118.6 8 -115.6 L1 -116.6z', '#fff', OUT);
            s += L('M-6 -123.8 q-1.6 3.4 -.4 6 M6 -123.8 q1.6 3.4 .4 6', '#e8dcf0', .5);
        } else if (kind === 'kabat') {
            s += P('M-9.4 -122 C-11.8 -118 -10 -113 -6 -111.6 L0 -113 L6 -111.6 C10 -113 11.8 -118 9.4 -122 C5 -126.6 -5 -126.6 -9.4 -122z', '#fbf5fb', OUT);
            for (var i = -3; i <= 3; i++) s += L('M' + (i * 2.8) + ' -124 q.8 4 -.2 8', '#e6d9ec', .5, 'opacity=".8"');
        }
        return s;
    }

    function sleevesOf(u, kind, S) {
        var t = SLEEVES[kind || ''];
        var s = '';
        var ease = function (sv) { return t.ease + (t.flare ? t.flare * Math.max(0, (sv - 0.3) / 0.5) : 0); };
        var d = limbPath(S, 0.0, t.to, ease, true);
        s += P(d, t.col, OUT) + P(d, 'url(#' + u + '-gs)') + P(d, 'url(#' + u + '-gv)');
        var mid = limbAt(S, t.to * 0.5);
        s += fold('M' + n1(mid.x - mid.nx * 2) + ' ' + n1(mid.y - mid.ny * 2) + ' q1.4 1.2 .4 3', shade(t.col, -0.3), .45, .6);
        if (t.cuff) {
            var e0 = Math.max(0, t.to - 0.07);
            s += P(limbPath(S, e0, t.to, ease(t.to) + 0.35), t.cuff, OUT);
            if (kind === 'pulcsi') for (var k = 0; k < 3; k++) s += fold(limbCross(S, e0 + 0.02 + k * 0.02, 2), shade(t.cuff, -0.3), .6, .4);
            if (kind === 'bluz') { var en = limbAt(S, t.to - 0.03); s += CI(en.x, en.y, .7, '#fff'); }
        } else {
            s += P(limbPath(S, Math.max(0, t.to - 0.04), t.to, ease(t.to) + 0.15), shade(t.col, -0.1), 'opacity=".9"');
            if (t.band) s += P(limbPath(S, t.to - 0.04, t.to, ease(t.to) + 0.3), t.band, OUT);
        }
        return s;
    }

    // =========================================================
    // KEZEK, KAROK
    // =========================================================
    function hand(x, y, angle, thumbDir, skin, skinD, open) {
        // x,y: csukló; a kéz lefelé mutat (angle=0), a hüvelyk thumbDir oldalán
        var s = '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(angle) + ')">';
        var fl = open ? [10.6, 12, 11, 8.6] : [9.4, 10.4, 9.6, 7.6];
        var xs = [-2.1, -0.7, 0.7, 2.1];
        if (thumbDir < 0) { xs = xs.slice().reverse(); fl = fl.slice().reverse(); }
        s += P('M-2.6 -1 C-3.1 2 -3.3 4.4 -3 6.6 L3 6.6 C3.3 4.4 3.1 2 2.6 -1z', skin, OUT);
        xs.forEach(function (fx, i) { s += L('M' + fx + ' 6 L' + n1(fx + (open ? (i - 1.5) * 0.9 : 0)) + ' ' + fl[i], LINE, 2.3); });
        xs.forEach(function (fx, i) { s += L('M' + fx + ' 6 L' + n1(fx + (open ? (i - 1.5) * 0.9 : 0)) + ' ' + fl[i], skin, 1.7); });
        var tx = thumbDir * 2.9;
        var te = 'M' + n1(tx * 0.8) + ' 1.4 L' + n1(thumbDir * (open ? 5.6 : 4.2)) + ' ' + (open ? 5.6 : 6.4);
        s += L(te, LINE, 2.6) + L(te, skin, 2);
        s += L('M-1.4 6 L1.4 6', skinD, .5, 'opacity=".5"');
        s += '</g>';
        return s;
    }
    function handAngle(S) {
        var e = S[S.length - 1], p = S[S.length - 3];
        return Math.atan2(-(e.x - p.x), e.y - p.y) * 57.2958;
    }

    function armGroup(u, S, thumbDir, kind, c, open) {
        var s = P(limbPath(S, 0, 1, 0, true), 'url(#' + u + '-limb)', OUT);
        var el = limbAt(S, 0.5);
        s += L('M' + n1(el.x - 1.6) + ' ' + n1(el.y + 1.6) + ' q1.6 1 3.2 0', c.skinDD, .5, 'opacity=".3"');
        var e = S[S.length - 1];
        s += hand(e.x, e.y - 1, handAngle(S), thumbDir, c.skin, c.skinD, open);
        s += sleevesOf(u, kind, S);
        return s;
    }

    // =========================================================
    // HAJ
    // =========================================================
    function strand(d, col, op, w) { return L(d, col, w || .6, 'opacity="' + (op || 0.5) + '"'); }

    function hairBack(u, style, fill, hairD) {
        var s = '';
        if (style === 'bob') {
            s += P('M-14.6 -150 C-15.4 -165 -7.4 -170 0 -170 C7.4 -170 15.4 -165 14.6 -150 L15 -126 C15.2 -121 12.6 -118.4 8.6 -118.8 L-8.6 -118.8 C-12.6 -118.4 -15.2 -121 -15 -126z', fill, OUT);
            s += strand('M-11 -150 C-11.6 -142 -11.8 -132 -11 -123 M11 -150 C11.6 -142 11.8 -132 11 -123 M-6 -140 C-6.4 -134 -6.4 -128 -6 -122 M6 -140 C6.4 -134 6.4 -128 6 -122', hairD, .5, .6);
        } else if (style === 'hosszu') {
            s += P('M-15 -150 C-16 -166 -7.6 -171 0 -171 C7.6 -171 16 -166 15 -150 L16.6 -118 C17 -104 19.6 -94 17.4 -80 C16.6 -74 13.6 -72 11 -75.6 C9 -72 5 -71 2 -74.6 L-2 -74.6 C-5 -71 -9 -72 -11 -75.6 C-13.6 -72 -16.6 -74 -17.4 -80 C-19.6 -94 -17 -104 -16.6 -118z', fill, OUT);
            s += strand('M-12 -148 C-13.6 -132 -14.4 -112 -13 -86 M12 -148 C13.6 -132 14.4 -112 13 -86 M-7 -144 C-8 -126 -8 -108 -7 -80 M7 -144 C8 -126 8 -108 7 -80', hairD, .5, .6);
        } else if (style === 'rovid') {
            s += P('M-13.6 -149 C-14.6 -164 -7 -169 0 -169 C7 -169 14.6 -164 13.6 -149 L12.6 -138 C8 -141 -8 -141 -12.6 -138z', fill, OUT);
        }
        return s;
    }

    function hairFront(u, style, fill, hairD) {
        var s = '', side, sd;
        if (style === 'bob') {
            side = 'M-10.6 -156 C-13.4 -148 -13.6 -134 -12.6 -124 C-11.6 -120 -8.8 -119.6 -8.2 -122.4 C-9 -130 -9.6 -138 -9.4 -146z';
            s += P(side, fill, OUT) + mirror(P(side, fill, OUT));
        } else if (style === 'hosszu') {
            side = 'M-10.8 -156 C-14 -146 -15.4 -128 -15.2 -108 C-15 -96 -14 -88 -12 -84 C-10 -85 -9.4 -90 -9.6 -98 C-10 -112 -9.6 -130 -9.2 -146z';
            sd = strand('M-12.4 -150 C-14 -132 -14 -110 -12.6 -90', hairD, .5, .6);
            s += P(side, fill, OUT) + mirror(P(side, fill, OUT)) + sd + mirror(sd);
        } else {
            side = 'M-10.6 -155 C-11.6 -150 -11.2 -146 -9.8 -143.4 L-9 -147 L-9.4 -153z';
            s += P(side, fill, OUT) + mirror(P(side, fill, OUT));
        }
        if (style === 'rovid') {
            s += P('M-11.4 -151 C-12.6 -164 -5 -170 3 -169.4 C10.4 -168.8 13 -162 11.6 -151.6 C10.4 -154.6 8.6 -156.6 5.4 -157.4 C3 -152.4 -2.4 -150.2 -7 -150.6 C-9 -150.8 -10.4 -150.6 -11.4 -151z', fill, OUT);
            s += P('M-11.6 -150.6 C-10.4 -147 -10.6 -144.6 -9.6 -142.6 L-8.6 -148z', fill, OUT);
            s += strand('M-8 -162 C-6 -158 -4 -155 -2 -152 M-2 -166 C0 -162 2 -158 3 -154 M4 -166 C6 -163 8 -160 9.4 -156', hairD, .55, .6);
            s += P('M-6 -165.4 C-1 -168.4 6 -167.6 9 -163.6 C4 -165 -1 -165 -6 -165.4z', '#fff', 'opacity=".38"');
        } else {
            var bang = 'M0.4 -169.6 C-8 -170 -13.4 -165 -13 -156 C-12.6 -149 -11 -145.4 -9.6 -143.6 C-9.2 -148.6 -6.4 -154.4 0.4 -158z';
            var bs = strand('M-3 -166 C-8 -163 -10.6 -157 -10.4 -150 M-6 -168 C-10.4 -164 -12 -158 -11.6 -152', hairD, .55, .6);
            s += P(bang, fill, OUT) + mirror(P(bang, fill, OUT)) + bs + mirror(bs);
            s += P('M-9 -166 C-5 -169 0 -169.4 3 -168.6 C-2 -168 -6 -166.8 -9 -166z', '#fff', 'opacity=".4"');
            s += P('M5 -167.6 C9 -166 12 -162 12.6 -157 C10 -161 7.6 -164.6 5 -167.6z', '#fff', 'opacity=".25"');
        }
        return s;
    }

    // =========================================================
    // KIEGÉSZÍTŐK
    // =========================================================
    function hairAccessory(u, kind, hair, hairD) {
        var s = '', i;
        if (kind === 'hajgumi') {
            s += P('M12.6 -158 C21 -158 25 -148 23.6 -134 C22.8 -126 20 -120 17.6 -118 C17.8 -126 18.6 -134 15.6 -141 C14 -145 12.4 -150 12.6 -158z', 'url(#' + u + '-hair)', OUT);
            s += strand('M17 -154 C21 -148 22 -138 20.4 -126', hairD, .5, .6);
            s += EL(12.6, -156.4, 3.6, 3.2, '#f4a3b8', OUT);
            s += P('M9.4 -157.6 q1.6 -2 3.2 0 q1.6 -2 3.4 .4 q1 1.6 -.3 2.8 q-1.6 1.6 -3.1 .3 q-1.6 1.6 -3.1 0 q-1.4 -.8 -.1 -3.5z', '#f9c0d1');
            s += L('M10.6 -156.6 q2.4 -1.4 4 .4', '#fff', .6, 'opacity=".8"');
        } else if (kind === 'masni') {
            s += P('M-13 -163 C-17 -168 -22.6 -169 -23.4 -164.6 C-24 -160 -18.6 -158.8 -13 -161.6z', '#f4a3b8', OUT);
            s += P('M-13 -163 C-9 -168 -3.6 -169 -2.8 -164.6 C-2.2 -160 -7.6 -158.8 -13 -161.6z', '#f4a3b8', OUT);
            s += L('M-20 -164.4 C-18 -163 -16 -162.4 -14 -162 M-6 -164.4 C-8 -163 -10 -162.4 -12 -162', '#e58aa3', .6);
            s += P('M-13 -162 L-16.6 -156.4 L-14.8 -156 L-13 -159 L-11.2 -156 L-9.4 -156.4z', '#e58aa3', OUT);
            s += P('M-15.4 -164.6 Q-13 -166.4 -10.6 -164.6 Q-9.8 -162 -10.6 -160.4 Q-13 -159 -15.4 -160.4 Q-16.2 -162 -15.4 -164.6z', '#e58aa3', OUT);
        } else if (kind === 'macskaful') {
            var band = shade(hair, -0.34);
            s += L('M-14.4 -152 C-8 -168 8 -168 14.4 -152', band, 2.6);
            s += L('M-14.4 -152 C-8 -168 8 -168 14.4 -152', 'rgba(255,255,255,.22)', .7);
            s += P('M-14.6 -156 L-12.4 -176 C-9 -175 -5.6 -171.6 -3.6 -167z', band, OUT);
            s += P('M14.6 -156 L12.4 -176 C9 -175 5.6 -171.6 3.6 -167z', band, OUT);
            s += P('M-12.8 -159 L-11.4 -171 C-9.4 -170 -7.4 -168 -6 -165z', '#f7b5c8');
            s += P('M12.8 -159 L11.4 -171 C9.4 -170 7.4 -168 6 -165z', '#f7b5c8');
            s += L('M-11 -168 l.6 -2.4 M-8.6 -166 l1 -2.4 M11 -168 l-.6 -2.4 M8.6 -166 l-1 -2.4', '#fff', .5, 'opacity=".7"');
        } else if (kind === 'virag') {
            var fc = ['#f4a3b8', '#fdf6fa', '#9fd6f5', '#f4a3b8', '#fdf6fa', '#9fd6f5', '#f4a3b8', '#fdf6fa', '#9fd6f5'];
            s += L('M-14.6 -150 C-10 -166 10 -166 14.6 -150', '#6fbe84', 1.8);
            for (i = 0; i < 9; i++) {
                var a = Math.PI * (1.08 + i * 0.105);
                var fx = n1(Math.cos(a) * 15.4), fy = n1(-153 + Math.sin(a) * 14.6);
                if (i % 2) s += P('M' + fx + ' ' + fy + ' q-3.6 -2.2 -5 .8 q2.2 2.8 5 -.8z', '#7cc78e');
                for (var pt = 0; pt < 5; pt++) {
                    var pa = pt * 1.2566 + i;
                    var px = n1(fx + Math.cos(pa) * 2.3), py = n1(fy + Math.sin(pa) * 2.3);
                    s += EL(px, py, 1.7, 1.3, fc[i], 'stroke="' + LINE + '" stroke-width=".3" transform="rotate(' + Math.round(pa * 57.3) + ' ' + px + ' ' + py + ')"');
                }
                s += CI(fx, fy, 1.1, '#f7d26a', 'stroke="#c9a53c" stroke-width=".25"');
            }
        }
        return s;
    }

    function neckWear(u, kind) {
        var s = '';
        if (kind === 'choker') {
            s += P('M-4.9 -128.4 Q0 -126 4.9 -128.4 L5 -125.4 Q0 -123 -5 -125.4z', '#3a2f45', OUT);
            s += L('M-4.6 -127.6 Q0 -125.4 4.6 -127.6', '#f4a3b8', .6);
            s += P('M0 -123 C-2.2 -125 -3 -122.4 -1.2 -120.8 L0 -119.8 L1.2 -120.8 C3 -122.4 2.2 -125 0 -123z', '#f4a3b8', 'stroke="#c96d86" stroke-width=".4"');
            s += CI(-2.4, -123.2, .4, '#fff');
        } else if (kind === 'nyakmasni') {
            s += P('M0 -122 L-7.4 -126.4 C-8.6 -123.4 -8.6 -119.4 -7.4 -116.8z', '#8fd3f4', OUT);
            s += P('M0 -122 L7.4 -126.4 C8.6 -123.4 8.6 -119.4 7.4 -116.8z', '#8fd3f4', OUT);
            s += L('M-6 -124.4 L-2.4 -122.6 M-6 -120.4 L-2.4 -121.6 M6 -124.4 L2.4 -122.6 M6 -120.4 L2.4 -121.6', '#5fb0dc', .5);
            s += P('M-2.2 -124.6 Q0 -125.8 2.2 -124.6 L2.6 -119.8 Q0 -118.6 -2.6 -119.8z', '#6cb9e0', OUT);
        } else if (kind === 'medal') {
            s += L('M-4.8 -126.4 L-.8 -108 M4.8 -126.4 L.8 -108', '#c3adee', 1.4);
            s += CI(0, -105.4, 3.8, '#f7d26a', 'stroke="#b8902c" stroke-width=".6"');
            s += CI(0, -105.4, 2.7, 'none', 'stroke="#d9a93a" stroke-width=".4"');
            s += P('M0 -108 l.7 1.6 1.7 .2 -1.3 1.2 .3 1.7 -1.4 -.8 -1.4 .8 .3 -1.7 -1.3 -1.2 1.7 -.2z', '#fff3b8');
        } else if (kind === 'gyongy') {
            for (var g = 0; g < 13; g++) {
                var t = g / 12;
                var gx = n1(-7.4 + t * 14.8), gy = n1(-126 + Math.sin(t * Math.PI) * 9.4);
                s += CI(gx, gy, 1.5, '#fffaf6', 'stroke="#cdbfd2" stroke-width=".4"');
                s += CI(gx - .4, gy - .5, .45, '#fff');
            }
            s += CI(0, -116, 2.1, '#fffaf6', 'stroke="#cdbfd2" stroke-width=".4"') + CI(-.5, -116.6, .6, '#fff');
        }
        return s;
    }

    // =========================================================
    // ARC
    // =========================================================
    function eye(u, side, mood, c, makeup) {
        var ox = side * 3.3, ix = -side * 3.1;
        var s = '<g transform="translate(' + n1(side * 5.2) + ' -146.2)">';
        var up = 'M' + n1(ix) + ' .5 C' + n1(-side * 1.7) + ' -2.7 ' + n1(side * 1.5) + ' -3 ' + n1(ox) + ' -.6';
        if (mood === 'happy') {
            s += L('M' + n1(ix) + ' .8 C' + n1(-side * 1.4) + ' -3 ' + n1(side * 1.4) + ' -3.2 ' + n1(ox) + ' -.2', INK, 1.3);
            s += L('M' + n1(side * 3.2) + ' -.6 l' + n1(side * 1.2) + ' -.7', INK, .9);
            if (makeup) s += L('M' + n1(ix) + ' -1.6 C' + n1(-side * 1.4) + ' -4.6 ' + n1(side * 1.4) + ' -4.8 ' + n1(ox) + ' -2', '#f7a8c4', 1.6, 'opacity=".55"');
            s += L('M' + n1(-side * 2.4) + ' 1.6 C' + n1(-side * .6) + ' 2.6 ' + n1(side * .8) + ' 2.4 ' + n1(side * 2) + ' 1.4', c.skinDD, .6, 'opacity=".35"');
        } else {
            var open = mood === 'proud' ? 0.7 : 1;
            var sclera = 'M' + n1(ix) + ' .5 C' + n1(-side * 1.7) + ' ' + n1(-2.7 * open) + ' ' + n1(side * 1.5) + ' ' + n1(-3 * open) + ' ' + n1(ox) + ' -.6 C' + n1(side * 1.6) + ' 1.9 ' + n1(-side * 1.4) + ' 2.3 ' + n1(ix) + ' .5z';
            var cid = u + '-ec' + (side > 0 ? 'r' : 'l');
            s += '<clipPath id="' + cid + '"><path d="' + sclera + '"/></clipPath>';
            s += P(sclera, '#fbf7f8', 'stroke="' + LINE + '" stroke-width=".3"');
            s += '<g clip-path="url(#' + cid + ')">';
            s += CI(0, -.3, 2.3, 'url(#' + u + '-iris)');
            s += CI(0, -.3, 2.3, 'none', 'stroke="' + shade(c.eye, -0.6) + '" stroke-width=".4"');
            s += CI(0, -.3, 1, '#231c2c');
            s += CI(.8, -1.2, .65, '#fff') + CI(-.7, .7, .3, '#fff', 'opacity=".7"');
            s += P('M-3.4 -.6 C-2 -4 2 -4 3.4 -.6 L3.4 -3.6 L-3.4 -3.6z', 'rgba(40,20,50,.3)');
            s += '</g>';
            s += L(up, INK, 1.2);
            s += L('M' + n1(ox) + ' -.6 l' + n1(side * 1.1) + ' -.5', INK, .9);
            s += L('M' + n1(side * 2.2) + ' -2.4 l' + n1(side * .7) + ' -.9 M' + n1(side * .8) + ' -2.9 l' + n1(side * .3) + ' -1', INK, .45);
            s += L('M' + n1(-side * 2.6) + ' 2.5 C' + n1(-side * .8) + ' 3.2 ' + n1(side * 1.2) + ' 3 ' + n1(side * 2.6) + ' 1.8', c.skinDD, .5, 'opacity=".3"');
            if (makeup) {
                s += P('M' + n1(ix) + ' -1 C' + n1(-side * 1.7) + ' -4.4 ' + n1(side * 1.6) + ' -4.8 ' + n1(ox) + ' -1.4 C' + n1(side * 1.6) + ' -3 ' + n1(-side * 1.7) + ' -2.7 ' + n1(ix) + ' -1z', '#e58aa3', 'opacity=".4"');
                s += L('M' + n1(ox) + ' -.6 l' + n1(side * 2.2) + ' -1.6', INK, 1);
                s += L('M' + n1(side * 2.6) + ' -2.4 l' + n1(side * .8) + ' -1.6 M' + n1(side) + ' -3 l' + n1(side * .4) + ' -1.6', INK, .5);
            }
        }
        s += L('M' + n1(-side * 3) + ' -3.4 C' + n1(-side * 1.2) + ' -4.8 ' + n1(side * 1.6) + ' -5 ' + n1(side * 3.4) + ' -3', c.skinDD, .5, 'opacity=".35"');
        s += '</g>';
        return s;
    }

    function brows(mood, hairD) {
        var tone = mix(hairD, '#4a3a34', 0.4);
        var shape;
        if (mood === 'worried') shape = 'M-9.4 -149.6 C-7.6 -151 -5 -152.6 -2.2 -154 L-2 -152.8 C-4.8 -151.6 -7.2 -150.4 -9.4 -148.6z';
        else if (mood === 'proud') shape = 'M-9.4 -151 C-7.6 -153.2 -5 -153.6 -2.6 -152 L-2.8 -150.8 C-5 -151.8 -7.4 -151.8 -9.4 -149.8z';
        else shape = 'M-9.4 -150.8 C-7.8 -153 -5 -153.2 -2.4 -151.6 L-2.6 -150.4 C-5 -151.6 -7.6 -151.6 -9.4 -149.6z';
        var s = P(shape, tone, 'opacity=".92"');
        if (mood === 'proud') s += P('M9.4 -153 C7.6 -155.4 5 -155.4 2.6 -153.6 L2.8 -152.2 C5 -153.4 7.4 -153.4 9.4 -151.6z', tone, 'opacity=".92"');
        else s += mirror(P(shape, tone, 'opacity=".92"'));
        return s;
    }

    function mouth(mood, face, c) {
        var lip = face === 'smink' ? '#d9446f' : mix(c.skin, '#c4506a', 0.55);
        var lipD = shade(lip, -0.25);
        var s = '';
        if (mood === 'happy') {
            s += P('M-4.4 -137.4 C-2.8 -136.6 2.8 -136.6 4.4 -137.4 C3.8 -134 1.6 -132.2 0 -132.2 C-1.6 -132.2 -3.8 -134 -4.4 -137.4z', '#6e2a40', 'stroke="' + lipD + '" stroke-width=".5" stroke-linejoin="round"');
            s += P('M-3.6 -137 C-1.8 -136.4 1.8 -136.4 3.6 -137 L3.4 -135.4 C1.6 -134.8 -1.6 -134.8 -3.4 -135.4z', '#fff');
            s += P('M-2.2 -133.2 C-.8 -134.4 .8 -134.4 2.2 -133.2 C1 -132.4 -1 -132.4 -2.2 -133.2z', '#e86a86');
            s += L('M-4.8 -138 q-1 .8 -1 2 M4.8 -138 q1 .8 1 2', c.skinDD, .5, 'opacity=".5"');
        } else if (mood === 'worried') {
            s += P('M-3.8 -135.4 C-2.4 -136.6 -1 -136.8 0 -136.2 C1 -136.8 2.4 -136.6 3.8 -135.4 C2 -134.4 -2 -134.4 -3.8 -135.4z', lip, 'stroke="' + lipD + '" stroke-width=".4"');
            s += L('M-3.4 -134.6 Q0 -133.4 3.4 -134.6', '#fff', .4, 'opacity=".4"');
        } else if (mood === 'proud') {
            s += P('M-4.2 -136.6 C-2.4 -137.6 -.8 -137.6 0 -137 C1 -137.6 3 -137.8 4.6 -138.8 C4 -136.2 2 -134.6 0 -134.6 C-2 -134.6 -3.6 -135.2 -4.2 -136.6z', lip, 'stroke="' + lipD + '" stroke-width=".4"');
            s += L('M4.6 -138.8 l.8 -.8', lipD, .5);
        } else {
            s += P('M-4 -136 C-2.6 -137.2 -1 -137.4 0 -136.8 C1 -137.4 2.6 -137.2 4 -136 C2.4 -135.4 -2.4 -135.4 -4 -136z', lipD, 'opacity=".95"');
            s += P('M-3.8 -135.8 C-2 -135.2 2 -135.2 3.8 -135.8 C2.6 -133.8 -2.6 -133.8 -3.8 -135.8z', lip);
            s += EL(0, -134.9, 1.8, .5, 'rgba(255,255,255,.4)');
        }
        if (face === 'smink' && mood !== 'happy') s += EL(0.4, -134.8, 1.6, .5, 'rgba(255,255,255,.55)');
        return s;
    }

    function faceLayer(u, c, mood, face) {
        var s = '';
        s += EL(-10.8, -144.6, 2.2, 3.6, 'url(#' + u + '-face)', OUT) + EL(10.8, -144.6, 2.2, 3.6, 'url(#' + u + '-face)', OUT);
        s += EL(-10.8, -144.4, 1, 2.1, c.skinD, 'opacity=".3"') + EL(10.8, -144.4, 1, 2.1, c.skinD, 'opacity=".3"');
        var fd = 'M0 -159.2 C6.2 -159.2 10.6 -154.6 10.8 -148 C11 -143.6 10.3 -140 8.8 -137 C7 -133.6 3.6 -131.4 0 -131.4 C-3.6 -131.4 -7 -133.6 -8.8 -137 C-10.3 -140 -11 -143.6 -10.8 -148 C-10.6 -154.6 -6.2 -159.2 0 -159.2z';
        s += P(fd, 'url(#' + u + '-face)', OUT);
        var jaw = P('M-8.8 -140 C-8.4 -136 -5.4 -132.4 -2.6 -131.8 C-5.6 -133.8 -7.8 -136.6 -8.8 -140z', c.skinD, 'opacity=".22"');
        s += jaw + mirror(jaw);
        s += EL(0, -132.8, 3.4, 1, '#fff', 'opacity=".15"');
        var strong = face === 'pir' || face === 'smink' || mood === 'happy';
        s += EL(-6.8, -139.6, 4.2, 2.6, 'url(#' + u + '-bl)', 'opacity="' + (strong ? 1 : 0.6) + '"') + EL(6.8, -139.6, 4.2, 2.6, 'url(#' + u + '-bl)', 'opacity="' + (strong ? 1 : 0.6) + '"');
        if (face === 'pir') {
            s += L('M-9 -140.2 l1.1 -1.6 M-7.2 -140 l1.1 -1.6 M-5.4 -139.8 l1.1 -1.6', '#ff5c88', .5, 'opacity=".75"');
            s += L('M9 -140.2 l-1.1 -1.6 M7.2 -140 l-1.1 -1.6 M5.4 -139.8 l-1.1 -1.6', '#ff5c88', .5, 'opacity=".75"');
        }
        // orr
        s += L('M-.5 -145.6 C-.9 -143.4 -1.4 -142 -1.8 -141', c.skinDD, .5, 'opacity=".3"');
        s += P('M-2.5 -140.6 C-1.8 -139.2 -.6 -138.8 0 -138.8 C.6 -138.8 1.8 -139.2 2.5 -140.6 C1.4 -140 .6 -140.4 0 -140.2 C-.6 -140.4 -1.4 -140 -2.5 -140.6z', c.skinDD, 'opacity=".42"');
        s += EL(-1.2, -139.4, .5, .35, c.skinDD, 'opacity=".5"') + EL(1.2, -139.4, .5, .35, c.skinDD, 'opacity=".5"');
        s += EL(0.1, -142.8, .5, 1.6, '#fff', 'opacity=".35"');
        var mk = face === 'smink';
        s += eye(u, -1, mood, c, mk) + eye(u, 1, mood, c, mk);
        s += brows(mood, c.hairD);
        s += mouth(mood, face, c);
        if (mood === 'worried') s += P('M13.4 -156 C11.6 -152.6 11.4 -150.6 13 -149.4 C14.8 -150.6 14.8 -153 13.4 -156z', '#a9e0fa', 'stroke="#6cb9e0" stroke-width=".35"') + CI(12.8, -150.6, .5, '#fff');
        if (mood === 'proud') s += P('M-14.6 -158 l.7 1.6 1.6 .7 -1.6 .7 -.7 1.6 -.7 -1.6 -1.6 -.7 1.6 -.7z', '#fff3b8');
        if (face === 'szemuveg') {
            s += '<g fill="rgba(210,235,250,.18)" stroke="#2f2638" stroke-width="1"><rect x="-9.6" y="-150" width="8.2" height="7.6" rx="2.6"/><rect x="1.4" y="-150" width="8.2" height="7.6" rx="2.6"/></g>';
            s += L('M-1.4 -147.6 Q0 -148.4 1.4 -147.6', '#2f2638', .9);
            s += L('M-9.6 -147.6 L-11 -147.2 M9.6 -147.6 L11 -147.2', '#2f2638', .8);
            s += L('M-8 -149 Q-5.6 -149.6 -3.6 -148.6 M3.4 -149 Q5.8 -149.6 7.8 -148.6', '#fff', .6, 'opacity=".75"');
        }
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
        var hair = colorOf(D.HAIR_COLORS, hairId, '#f4a3b8');
        var style = o.hairStyle || 'bob';
        var wig = eq.hair === 'parokni';
        if (wig) { style = 'hosszu'; hair = '#f4a3b8'; }
        var col = {
            skin: skin, skinL: shade(skin, 0.2), skinD: shade(skin, -0.12), skinDD: shade(skin, -0.34),
            hair: hair, hairD: shade(hair, -0.28), hairL: shade(hair, 0.3),
            eye: EYES[hairId] || '#6a5a7a'
        };
        var hairFill = wig ? 'url(#' + u + '-wig)' : 'url(#' + u + '-hair)';
        var top = eq.top || '';
        var hd = wig ? '#b98ccc' : col.hairD;
        var out = [];

        out.push(defs(u, col));
        out.push(EL(0, 0.6, 22, 3, 'rgba(58,47,69,.2)'));
        out.push(hairBack(u, style, hairFill, hd));

        // lábak, lábszár-viselet, cipő
        out.push(legSkin(u, col) + mirror(legSkin(u, col)));
        out.push(legItem(u, eq.legs) + mirror(legItem(u, eq.legs)));
        var sx = LEG[LEG.length - 1].x - 1.4;
        out.push(shoe(sx) + mirror(shoe(sx)));

        // alsó ruha
        out.push(bottomWear(u, eq.bottom));

        // nyak + törzs (bőr)
        out.push(topBack(u, top));
        out.push(P('M-4.6 -134 L4.6 -134 C4.8 -128.4 5 -124.6 5.6 -121.6 L-5.6 -121.6 C-5 -124.6 -4.8 -128.4 -4.6 -134z', 'url(#' + u + '-limb)', OUT));
        out.push(P(torsoPoly({ y1: -66, ease: 0, neckW: 5.4, neckDip: 0 }), 'url(#' + u + '-limb)', OUT));
        out.push(P('M-4.6 -134 Q0 -127.6 4.6 -134 L4.6 -130.6 Q0 -125.4 -4.6 -130.6z', col.skinDD, 'opacity=".28"'));
        out.push(L('M-1.4 -119.6 C-5 -118.8 -9 -118.4 -12.4 -119.6 M1.4 -119.6 C5 -118.8 9 -118.4 12.4 -119.6', col.skinDD, .6, 'opacity=".4"'));
        out.push(L('M-9 -104 C-5 -102 -1.4 -102.4 -.4 -103 M9 -104 C5 -102 1.4 -102.4 .4 -103', col.skinDD, .6, 'opacity=".22"'));
        out.push(EL(0, -77.6, .8, .5, col.skinDD, 'opacity=".55"'));
        out.push(L('M-8 -90 C-8.6 -84 -7.6 -80 -6.4 -76 M8 -90 C8.6 -84 7.6 -80 6.4 -76', col.skinDD, .5, 'opacity=".16"'));

        // felső
        out.push(topBody(u, top));

        // karok
        var right = pose === 'wave' ? ARM_WAVE : (pose === 'hips' ? ARM_HIPS : null);
        out.push(armGroup(u, ARM_IDLE, 1, top, col, false));
        out.push(right ? armGroup(u, right, -1, top, col, pose === 'wave') : mirror(armGroup(u, ARM_IDLE, 1, top, col, false)));

        // gallér, nyakék
        out.push(collar(u, top));
        out.push(neckWear(u, eq.neck));

        // fej
        out.push(faceLayer(u, col, mood, eq.face));

        // elülső haj + kiegészítők
        out.push(hairFront(u, style, hairFill, hd));
        out.push(hairAccessory(u, eq.hair, hair, col.hairD));

        return '<g class="av-body">' + out.join('') + '</g>';
    };

    C.portrait = function (o, vb) {
        var uid = 'pt' + (o && o.uid ? o.uid : '');
        return '<svg viewBox="' + (vb || '-52 -180 104 190') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Karakter">' + C.avatar(Object.assign({}, o, { uid: uid })) + '</svg>';
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof globalThis !== 'undefined' ? globalThis : this);
