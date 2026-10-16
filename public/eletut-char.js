// =========================================================
// PASZTELL ÉLETÚT - a karakter rajza (SVG)
//
// Külön fájl: itt él a rétegelt, részletes karakter (haj, arc, test, ruhák, kiegészítők, hangulatok).
// A hátterek és jelenetek az eletut-art.js-ben vannak, azok ezt hívják.
//
// Koordináták: a talpak közepe az origó, a karakter ~155 egység magas (a feje teteje kb. -160).
// Minden függvény tiszta szöveget ad (SVG-markup), ezért Node-ban is tesztelhető.
//
// Opciók: { skin, hairStyle, hairColor, outfit:{slot:itemId}, mood:'neutral|happy|worried|proud', pose:'idle|wave|hips', uid }
// A rétegek sorrendje: hátsó haj, lábak, cipő, alsó ruha, törzs és felső, karok és ujjak, nyak, fej, arc, elülső haj, kiegészítők.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var C = M.char = {};

    var INK = '#3a2f45';
    var LINE = 'rgba(58,47,69,.42)';
    var SOFT = 'rgba(58,47,69,.18)';

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
    var EYES = { rozsa: '#c2488c', kek: '#2f8fd6', feher: '#7d8fe0', fekete: '#6a4fd0', lila: '#7a4fc9', barna: '#b06a3a', szoke: '#3f9a7a' };

    // ---------- Rajzoló segédek ----------
    function P(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function L(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1.2) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
    function CI(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function EL(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function RC(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function LB(d, stroke, w) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="butt"/>'; }
    function mirror(s) { return '<g transform="scale(-1 1)">' + s + '</g>'; }
    function n1(v) { return Math.round(v * 10) / 10; }
    var OUT = 'stroke="' + LINE + '" stroke-width=".9" stroke-linejoin="round"';

    // ---------- Közös definíciók ----------
    function defs(u, c) {
        var d = '<defs>';
        d += '<linearGradient id="' + u + '-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c.skinD + '"/><stop offset=".32" stop-color="' + c.skin + '"/><stop offset=".6" stop-color="' + c.skinL + '"/><stop offset="1" stop-color="' + c.skin + '"/></linearGradient>';
        d += '<radialGradient id="' + u + '-face" cx=".46" cy=".36" r=".75"><stop offset="0" stop-color="' + c.skinL + '"/><stop offset=".65" stop-color="' + c.skin + '"/><stop offset="1" stop-color="' + c.skinD + '"/></radialGradient>';
        d += '<linearGradient id="' + u + '-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hairL + '"/><stop offset=".38" stop-color="' + c.hair + '"/><stop offset="1" stop-color="' + c.hairD + '"/></linearGradient>';
        d += '<linearGradient id="' + u + '-wig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbc4d4"/><stop offset=".5" stop-color="#f4a3b8"/><stop offset="1" stop-color="#8fcdf2"/></linearGradient>';
        d += '<linearGradient id="' + u + '-iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(c.eye, -0.45) + '"/><stop offset=".55" stop-color="' + c.eye + '"/><stop offset="1" stop-color="' + shade(c.eye, 0.45) + '"/></linearGradient>';
        d += '<linearGradient id="' + u + '-gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>';
        d += '<linearGradient id="' + u + '-gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>';
        d += '<radialGradient id="' + u + '-bl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6f98" stop-opacity=".75"/><stop offset="1" stop-color="#ff6f98" stop-opacity="0"/></radialGradient>';
        d += '<pattern id="' + u + '-plaid" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#a9cdee"/><rect width="9" height="3.2" fill="#6f9fd6" opacity=".75"/><rect width="3.2" height="9" fill="#f5a9b8" opacity=".8"/><rect x="5" width=".8" height="9" fill="#fff" opacity=".55"/><rect y="5" width="9" height=".8" fill="#fff" opacity=".55"/></pattern>';
        d += '<pattern id="' + u + '-lace" width="4.6" height="4.6" patternUnits="userSpaceOnUse"><path d="M0 2.3 L2.3 0 L4.6 2.3 L2.3 4.6z" fill="none" stroke="#fff" stroke-width=".7" opacity=".75"/></pattern>';
        d += '<clipPath id="' + u + '-low"><rect x="-40" y="-56" width="80" height="60"/></clipPath>';
        d += '</defs>';
        return d;
    }

    // Ruhadarab: alap + fény/árnyék-átfedés + (opcionális) körvonal
    function garment(u, d, fill, extra) {
        return P(d, fill, OUT + (extra ? ' ' + extra : '')) + P(d, 'url(#' + u + '-gs)') + P(d, 'url(#' + u + '-gv)');
    }

    // =========================================================
    // LÁBAK ÉS CIPŐ
    // =========================================================
    var LEG = 'M-15.6 -65 C-17.2 -53 -14.6 -45 -13.7 -36 C-12.8 -27 -11.6 -17 -11 -8 L-4.1 -8 C-4.3 -17 -3.5 -27 -2.7 -36 C-2 -46 -1.1 -55 -1.4 -65z';

    function legSkin(u) {
        return P(LEG, 'url(#' + u + '-limb)', OUT) +
            EL(-9.2, -37, 3.4, 2.2, 'rgba(0,0,0,.07)') + // térd
            L('M-11.4 -36 q2.6 1.8 5.2 0', 'rgba(150,90,80,.18)', .8) +
            P('M-5.4 -20 C-5 -28 -4.4 -40 -3.4 -50', 'none', 'stroke="#fff" stroke-width="1.2" opacity=".25" stroke-linecap="round"');
    }

    function legItem(u, legs) {
        var s = '';
        if (legs === 'zokni') {
            s += P('M-12.9 -29 C-12.5 -21 -11.7 -14 -11.1 -7.6 L-4.2 -7.6 C-4.4 -14 -4.3 -21 -4.5 -29z', '#fdf6fa', OUT);
            s += P('M-12.9 -29 L-4.5 -29 L-4.5 -26 L-12.8 -26z', '#f5a9b8');
            s += P('M-12.6 -22.4 L-4.4 -22.4 L-4.4 -20.6 L-12.4 -20.6z', '#9fd6f5');
            s += P('M-12.2 -17.2 L-4.3 -17.2 L-4.3 -15.4 L-12 -15.4z', '#f5a9b8');
            s += P('M-12.9 -29 C-12.5 -21 -11.7 -14 -11.1 -7.6 L-4.2 -7.6 C-4.4 -14 -4.3 -21 -4.5 -29z', 'url(#' + u + '-gs)');
        } else if (legs === 'combzokni') {
            var d = 'M-15.4 -56 C-16.4 -50 -14.5 -44 -13.7 -36 C-12.8 -27 -11.6 -17 -11 -8 L-4.1 -8 C-4.3 -17 -3.5 -27 -2.7 -36 C-2 -45 -1.2 -51 -1.5 -56z';
            s += '<g clip-path="url(#' + u + '-low)">' + P(LEG, '#f4a3b8') + '</g>';
            s += P(d, 'none', 'stroke="' + LINE + '" stroke-width=".8"');
            s += P('M-15.9 -56 Q-8.5 -53.6 -1.1 -56 L-1.1 -51.6 Q-8.5 -49.4 -15.7 -51.6z', '#fdf6fa', OUT);
            s += L('M-15.7 -54.8 q1.2 .9 2.4 0 q1.2 .9 2.4 0 q1.2 .9 2.4 0 q1.2 .9 2.4 0 q1.2 .9 2.4 0', '#e6d6ee', .7);
            s += P('M-13.7 -39 L-2.7 -39 L-2.8 -36.8 L-13.6 -36.8z', '#fdf6fa', 'opacity=".9"');
            s += P('M-12.9 -33 L-2.9 -33 L-3 -31.4 L-12.8 -31.4z', '#fdf6fa', 'opacity=".7"');
            s += CI(-8.4, -52, 2, '#e58aa3', 'stroke="#fff" stroke-width=".6"');
            s += '<g clip-path="url(#' + u + '-low)">' + P(LEG, 'url(#' + u + '-gs)') + '</g>';
        } else if (legs === 'harisnya') {
            s += P(LEG, '#3a2f45', 'opacity=".36"');
            s += P(LEG, 'url(#' + u + '-lace)', 'opacity=".9"');
            s += P(LEG, 'url(#' + u + '-gs)');
        }
        return s;
    }

    function shoeShape(u) {
        var s = '';
        s += P('M-18.2 -9.5 C-18 -14 -9.8 -15.2 -6 -12.2 C-4 -10.4 -1.4 -8.6 0.6 -5.8 C1.3 -4 1.2 -1.6 .6 0 L-19.4 0 C-20.2 -3.2 -19.4 -6.8 -18.2 -9.5z', '#fbf7ff', OUT);
        s += P('M-18.2 -9.5 C-18 -14 -9.8 -15.2 -6 -12.2 L-8.4 -9.4 C-12 -10.8 -15.4 -10.6 -18.2 -9.5z', '#efe6f8');
        s += P('M-19.8 -1.9 L.9 -1.9 L.7 1 L-19.7 1z', '#f5a9b8', 'stroke="' + LINE + '" stroke-width=".7"');
        s += P('M-1.5 -5.2 C-.4 -3.6 0 -2.6 .1 -1.9 L-4.8 -1.9 C-4.2 -3.2 -3 -4.4 -1.5 -5.2z', '#e6d9f2');
        s += L('M-12.8 -12.4 l5.2 3.4 M-9.8 -13 l4.8 3.6 M-15.6 -11.6 l5.6 3.2', '#f5a9b8', 1);
        s += P('M-17.8 -9.2 C-16.4 -10.2 -14 -10.8 -12 -10.6', 'none', 'stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"');
        s += P('M-19.2 -5 C-14 -6.2 -7 -6 -2 -3.4', 'none', 'stroke="#d6c8e4" stroke-width=".7"');
        s += P('M-18.4 -9 C-18.2 -12 -15 -13.4 -12 -13.2', 'none', 'stroke="#fff" stroke-width=".8" opacity=".7"');
        return s + P('M-18.2 -9.5 C-18 -14 -9.8 -15.2 -6 -12.2 C-4 -10.4 -1.4 -8.6 .6 -5.8 C1.3 -4 1.2 -1.6 .6 0 L-19.4 0 C-20.2 -3.2 -19.4 -6.8 -18.2 -9.5z', 'url(#' + u + '-gv)');
    }

    // =========================================================
    // ALSÓ RUHÁK
    // =========================================================
    function pleats(n, topY, botY, topW, botW, color, op) {
        var s = '';
        for (var i = 1; i < n; i++) {
            var t = i / n - 0.5;
            s += L('M' + n1(t * 2 * topW) + ' ' + topY + ' L' + n1(t * 2 * botW) + ' ' + botY, color, .8, 'opacity="' + (op || 0.5) + '"');
        }
        return s;
    }

    function bottomWear(u, kind) {
        var s = '', i;
        if (!kind) {
            // alap capri farmer
            var leg = 'M-17.4 -68 L-1 -68 C-1 -58 -1.4 -44 -2 -29 L-13.2 -29 C-13.8 -44 -16.2 -58 -17.4 -68z';
            s += garment(u, leg, '#7aa0d6') + mirror(garment(u, leg, '#7aa0d6'));
            s += RC(-17.8, -70, 35.6, 5.6, '#6a8fc7', OUT + ' rx="1.6"');
            s += CI(0, -67.2, 1.6, '#e0c37a', 'stroke="#a98a3c" stroke-width=".5"');
            s += L('M0 -64.4 V-56 M-1 -56 Q0 -54 1 -56', shade('#7aa0d6', -0.28), .9);
            s += L('M-14 -64 L-14 -61 M14 -64 L14 -61 M-8 -64.4 L-8 -62 M8 -64.4 L8 -62', shade('#7aa0d6', -0.25), 1.1);
            s += L('M-14.4 -31 H-2.4 M2.4 -31 H14.4', '#e8c47a', .8, 'stroke-dasharray="1.4 1.2"');
            s += RC(-13.4, -30.6, 11.4, 1.8, '#6a8fc7') + RC(2, -30.6, 11.4, 1.8, '#6a8fc7');
            s += L('M-9 -60 q-2 6 -2.2 14 M9 -60 q2 6 2.2 14', 'rgba(255,255,255,.35)', 1);
        } else if (kind === 'rovid') {
            var sh = 'M-17.6 -68 L-.8 -68 L-1.3 -46 L-15 -46z';
            s += garment(u, sh, '#a9cdee') + mirror(garment(u, sh, '#a9cdee'));
            s += RC(-17.8, -70, 35.6, 5.4, '#8fb8e0', OUT + ' rx="1.6"');
            s += L('M-14.6 -48 H-1.6 M1.6 -48 H14.6', '#fff', 1, 'opacity=".65" stroke-dasharray="1.4 1.2"');
            s += P('M-13 -64 L-6 -64 L-6 -57 L-13 -57z', 'none', 'stroke="#7ba5d2" stroke-width=".8"');
            s += CI(0, -67.2, 1.5, '#fff', 'stroke="#7ba5d2" stroke-width=".5"');
        } else if (kind === 'szoknya') {
            var sk = 'M-17.6 -68 L17.6 -68 L27 -37 Q20 -33.4 13.5 -36.2 Q6.8 -32.4 0 -35.8 Q-6.8 -32.4 -13.5 -36.2 Q-20 -33.4 -27 -37z';
            s += garment(u, sk, '#f4a3b8');
            s += pleats(9, -66, -35, 16, 26, shade('#f4a3b8', -0.22), .6);
            s += pleats(9, -66, -35, 16, 26, '#fff', .12);
            s += RC(-17.9, -70, 35.8, 5, '#e58aa3', OUT + ' rx="1.4"');
            s += L('M-24 -37.6 Q-12 -34.6 0 -36.8 Q12 -34.6 24 -37.6', '#fff', 1, 'opacity=".5"');
            s += CI(0, -67.5, 1.4, '#fff');
        } else if (kind === 'tenisz') {
            var tn = 'M-17.6 -68 L17.6 -68 L24 -45 Q12 -41 0 -43.6 Q-12 -41 -24 -45z';
            s += garment(u, tn, '#fdf6fa');
            s += pleats(8, -66, -43, 16, 23, '#cdbfdc', .65);
            s += RC(-17.9, -70, 35.8, 5, '#f4a3b8', OUT + ' rx="1.4"');
            s += P('M-23.4 -48.4 Q-12 -45 0 -47.2 Q12 -45 23.4 -48.4 L24 -45 Q12 -41 0 -43.6 Q-12 -41 -24 -45z', '#9fd6f5');
            s += P('M-22.8 -51.4 Q-12 -48 0 -50 Q12 -48 22.8 -51.4 L23.4 -48.4 Q12 -45 0 -47.2 Q-12 -45 -23.4 -48.4z', '#f4a3b8', 'opacity=".9"');
        } else if (kind === 'kilt') {
            var kl = 'M-17.6 -68 L17.6 -68 L26 -38 Q13 -35 0 -37.4 Q-13 -35 -26 -38z';
            s += P(kl, 'url(#' + u + '-plaid)', OUT) + P(kl, 'url(#' + u + '-gs)') + P(kl, 'url(#' + u + '-gv)');
            s += pleats(8, -66, -37, 16, 25, 'rgba(58,47,69,.5)', .55);
            s += RC(-17.9, -70, 35.8, 4.6, '#6f9fd6', OUT + ' rx="1.4"');
            s += L('M-12 -66 V-60 M12 -66 V-60', '#f5a9b8', 1.4);
            s += P('M-9.4 -52 L-3.8 -52 L-3.8 -45 L-9.4 -45z', '#d9d2e8', 'stroke="#8a7aa0" stroke-width=".6"');
            s += P('M-8 -52 L-8 -62 L-5.4 -62 L-5.4 -52z', '#cfc8de', 'stroke="#8a7aa0" stroke-width=".5"');
            s += L('M-26 -38.6 Q-13 -36 0 -38.4 Q13 -36 26 -38.6', 'rgba(255,255,255,.55)', 1);
        } else if (kind === 'estelyi') {
            var gw = 'M-17.6 -68 L17.6 -68 C19 -52 25 -28 32 -6 Q26 -2 20 -4 Q13 1 6.6 -3 Q0 1.5 -6.6 -3 Q-13 1 -20 -4 Q-26 -2 -32 -6 C-25 -28 -19 -52 -17.6 -68z';
            s += '<defs><linearGradient id="' + u + '-gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4c2f4"/><stop offset=".6" stop-color="#bfa8ec"/><stop offset="1" stop-color="#a48ee0"/></linearGradient></defs>';
            s += garment(u, gw, 'url(#' + u + '-gown)');
            s += L('M-7 -62 C-10 -44 -16 -26 -22 -8 M7 -62 C10 -44 16 -26 22 -8 M0 -62 V-4 M-14 -60 C-17 -42 -24 -24 -29 -8 M14 -60 C17 -42 24 -24 29 -8', 'rgba(255,255,255,.35)', 1.2);
            s += P('M-30 -9 Q-22 -6 -20 -4 Q-13 1 -6.6 -3 Q0 1.5 6.6 -3 Q13 1 20 -4 Q22 -6 30 -9 L32 -6 Q26 -2 20 -4 Q13 1 6.6 -3 Q0 1.5 -6.6 -3 Q-13 1 -20 -4 Q-26 -2 -32 -6z', '#e4d6fa', 'opacity=".85"');
            [[-14, -30], [10, -40], [-4, -18], [18, -16], [-22, -14], [4, -52], [-9, -48], [24, -26]].forEach(function (p, k) {
                s += P('M' + p[0] + ' ' + (p[1] - 2.2) + ' l.7 1.5 1.5 .7 -1.5 .7 -.7 1.5 -.7 -1.5 -1.5 -.7 1.5 -.7z', '#fff', 'opacity="' + (k % 2 ? 0.95 : 0.7) + '"');
            });
            s += RC(-17.9, -70, 35.8, 5.2, '#9a82d8', OUT + ' rx="1.6"');
            s += P('M0 -67 L-6.6 -71 L-6 -62.6z M0 -67 L6.6 -71 L6 -62.6z', '#f4a3b8', OUT) + CI(0, -67, 1.9, '#e58aa3');
        }
        return s;
    }

    // =========================================================
    // FELSŐ RUHÁK + KAROK
    // =========================================================
    function torsoD(e, hem) {
        var l = -(17 + e), r = 17 + e;
        return 'M' + l + ' -105 Q0 -110.5 ' + r + ' -105 C' + (r + 0.4) + ' -98 ' + (13 + e) + ' -90 ' + (12.6 + e) + ' -80 C' + (12.6 + e) + ' -72 ' + (16 + e) + ' -67 ' + (16 + e) + ' ' + hem +
            ' L' + (-16 - e) + ' ' + hem + ' C' + (-16 - e) + ' -67 ' + (-12.6 - e) + ' -72 ' + (-12.6 - e) + ' -80 C' + (-13 - e) + ' -90 ' + (l - 0.4) + ' -98 ' + l + ' -105z';
    }

    // Karok: skin = bőr, sleeves = ujj-réteg a viselet szerint.
    var ARMS = {
        idle: {
            path: 'M-18 -102 C-25.4 -96 -26.6 -84 -25 -76 C-24.4 -71 -23.8 -68.5 -23.8 -65.5',
            short: 'M-18 -102 C-22.6 -98.4 -25 -93.6 -25.6 -88.6',
            hand: [-23.8, -61.5], thumb: [-27.6, -64.4], puff: [-23.6, -94.6], puffCuff: 'M-28.6 -86.6 Q-23.8 -84.6 -19 -86.6',
            cuffA: 'M-24.2 -71.5 L-23.8 -66.5'
        },
        wave: {
            path: 'M18 -102 C27 -99.6 33.6 -100.6 33.6 -110 C33.6 -116 32.6 -119.5 33 -123.5',
            short: 'M18 -102 C23 -100.6 27.2 -100.4 30.4 -102.6',
            hand: [33, -127.4], thumb: [29, -125], puff: [27.6, -101.6], puffCuff: 'M30 -95 Q32.6 -100 31.4 -107',
            cuffA: 'M33.4 -116 L33 -121'
        },
        hips: {
            path: 'M18 -102 C28 -96 31 -86 27 -80 C24 -76 20 -74 17.4 -72.4',
            short: 'M18 -102 C23 -98.6 26.4 -94 28 -89.6',
            hand: [16.4, -70], thumb: [14.6, -67], puff: [25.6, -95], puffCuff: 'M20.6 -91 Q26 -86.6 31 -90',
            cuffA: 'M21 -76 L18.6 -73.4'
        }
    };

    function armSkin(u, a, side, skin) {
        // side: -1 bal, +1 jobb; a: ARMS elem (a bal oldali alakban van megadva, ha side=-1, különben tükrözve)
        var s = '';
        s += L(a.path, LINE, 10.2);
        s += L(a.path, 'url(#' + u + '-limb)', 8.4);
        s += L(a.path, skin, 7, 'opacity=".25"');
        // könyök-árnyék
        return s;
    }
    function handShape(u, a, skin, skinD, open) {
        var h = a.hand, t = a.thumb, s = '';
        s += EL(t[0], t[1], 1.9, 3.1, skin, 'stroke="' + LINE + '" stroke-width=".7" transform="rotate(' + (t[0] < h[0] ? -26 : 26) + ' ' + t[0] + ' ' + t[1] + ')"');
        s += EL(h[0], h[1], 4.4, 5.3, skin, 'stroke="' + LINE + '" stroke-width=".8"');
        s += L('M' + (h[0] - 1.8) + ' ' + (h[1] + 2) + ' v2.2 M' + h[0] + ' ' + (h[1] + 2.4) + ' v2.4 M' + (h[0] + 1.8) + ' ' + (h[1] + 2) + ' v2.2', skinD, .6, 'opacity=".7"');
        if (open) s += EL(h[0] + 1, h[1] - 1.8, 1.6, 1, 'rgba(255,255,255,.35)');
        return s;
    }

    // Felső ruhák (törzs-réteg) és ujjak. Visszaadja: {body, sleevesFn(armObj,side)}
    var TOPS = {
        '': { sleeve: 'short', col: '#b9c2da' },
        polo: { sleeve: 'short', col: '#f6b5c5' },
        pulcsi: { sleeve: 'long', col: '#8fd3f4', cuff: '#76bde0' },
        crop: { sleeve: 'puff', col: '#ffc2d1' },
        bluz: { sleeve: 'puff', col: '#fdf8fd', cuff: '#f4a3b8' },
        kabat: { sleeve: 'long', col: '#cdb7f0', cuff: '#fdf6fa' }
    };

    function topBody(u, kind, skin, skinD) {
        var s = '';
        if (!kind) {
            var tee = '#b9c2da';
            s += garment(u, torsoD(1.2, -58), tee);
            s += P('M-6.6 -106.6 Q0 -100.8 6.6 -106.6 Q0 -103.2 -6.6 -106.6z', shade(tee, -0.2), 'opacity=".9"');
            s += L('M-7.6 -106.4 Q0 -99.4 7.6 -106.4', shade(tee, -0.3), 1.2);
            s += L('M-9 -88 q3 2 7 1 M7 -76 q3 1.4 6 .4 M-12 -72 q4 1.4 8 .2', shade(tee, -0.22), .9, 'opacity=".7"');
            s += L('M-15 -60 H15', shade(tee, -0.25), .8);
        } else if (kind === 'polo') {
            var po = '#f6b5c5';
            s += garment(u, torsoD(1.2, -58), po);
            s += P('M-6.8 -107.4 L-2.4 -101 L0 -104 L2.4 -101 L6.8 -107.4 L3.2 -108.4 L0 -105 L-3.2 -108.4z', '#fff2f6', OUT);
            s += L('M0 -104 V-86', shade(po, -0.22), .8);
            s += P('M-2.4 -100 L2.4 -100 L2.4 -87 L-2.4 -87z', 'none', 'stroke="' + shade(po, -0.18) + '" stroke-width=".7"');
            s += CI(0, -97.5, .9, '#fff') + CI(0, -91.5, .9, '#fff');
            s += L('M-15 -60 H15', shade(po, -0.22), .8);
            s += L('M-9 -88 q3 2 7 1 M8 -77 q3 1.4 6 .4', shade(po, -0.18), .8, 'opacity=".7"');
        } else if (kind === 'pulcsi') {
            var hd = '#8fd3f4';
            // kapucni-gyűrű a nyak mögött
            s += EL(0, -106, 12.6, 5.2, shade(hd, -0.12), OUT);
            s += garment(u, torsoD(2.6, -55), hd);
            s += P('M-12 -107 Q0 -97.6 12 -107 Q0 -103.5 -12 -107z', shade(hd, -0.14), 'opacity=".95"');
            s += L('M-12 -107 Q0 -97.6 12 -107', shade(hd, -0.3), 1);
            s += L('M-4.6 -102 L-5.4 -88 M4.6 -102 L5.4 -88', '#fdf6fa', 1);
            s += CI(-5.4, -87.4, 1.4, '#fdf6fa') + CI(5.4, -87.4, 1.4, '#fdf6fa');
            s += P('M-11 -78 L11 -78 L14 -63 L-14 -63z', shade(hd, -0.1), 'stroke="' + shade(hd, -0.3) + '" stroke-width=".8" opacity=".9"');
            s += L('M-8.6 -77.4 L-11.4 -63.6 M8.6 -77.4 L11.4 -63.6', shade(hd, -0.28), .7);
            s += RC(-19.6, -58.4, 39.2, 3.6, shade(hd, -0.14), 'rx="1.4" ' + 'stroke="' + shade(hd, -0.3) + '" stroke-width=".6"');
            for (var i = -17; i < 18; i += 2.6) s += L('M' + i + ' -58.2 V-55.2', shade(hd, -0.3), .4, 'opacity=".5"');
            s += P('M-3.6 -92.4 l1.6 3 -1.6 1.6 -1.6 -1.6z M3.6 -92.4 l1.6 3 -1.6 1.6 -1.6 -1.6z', 'none', 'opacity="0"');
            s += L('M-10 -94 q-1 4 .5 8 M10 -92 q1 4 -.4 8', shade(hd, -0.22), .9, 'opacity=".7"');
        } else if (kind === 'crop') {
            var cr = '#ffc2d1';
            // hasi bőr: köldök, árnyék
            s += P(torsoD(0, -58), 'url(#' + u + '-limb)', OUT);
            s += EL(0, -69.4, 1, .7, shade(skin, -0.34), 'opacity=".75"');
            var ct = 'M-17.6 -105 Q0 -110.6 17.6 -105 C17.8 -98 14.6 -92 14 -84 L-14 -84 C-14.6 -92 -17.8 -98 -17.6 -105z';
            s += garment(u, ct, cr);
            s += RC(-14.6, -85.6, 29.2, 3.8, '#fdf6fa', OUT + ' rx="1.6"');
            s += P('M-6.8 -107 Q0 -99.8 6.8 -107 Q0 -103.6 -6.8 -107z', shade(cr, -0.2), 'opacity=".9"');
            s += P('M-3 -95 L0 -92 L3 -95 L0 -98z', '#fff', 'opacity=".9"');
            s += L('M-9 -93 q2 3 1.4 6 M9 -93 q-2 3 -1.4 6', shade(cr, -0.2), .8, 'opacity=".7"');
        } else if (kind === 'bluz') {
            var bl = '#fdf8fd';
            s += garment(u, torsoD(1.4, -59), bl);
            s += RC(-1.1, -102, 2.2, 42, '#f1e6f4', 'opacity=".9"');
            for (var b = 0; b < 4; b++) s += CI(0, -97 + b * 10, 1, '#f4a3b8', 'stroke="#e58aa3" stroke-width=".4"');
            s += P('M-7.4 -107.6 Q-4 -100.4 0 -104 Q4 -100.4 7.4 -107.6 Q3 -110 0 -108 Q-3 -110 -7.4 -107.6z', '#fff', OUT);
            s += L('M-6 -106.4 q1.6 2.6 3 .6 M6 -106.4 q-1.6 2.6 -3 .6', '#eadcf0', .8);
            s += L('M-9 -90 q3 2 7 1 M8 -78 q3 1.4 6 .4', '#eadcf0', .9, 'opacity=".9"');
            s += L('M-15 -61 H15', '#eadcf0', .8);
        } else if (kind === 'kabat') {
            var ct2 = '#cdb7f0';
            var coat = 'M-18.8 -105 Q0 -111 18.8 -105 C19.6 -96 15.6 -90 14 -80 C16 -68 20 -56 23 -42 Q0 -37 -23 -42 C-20 -56 -16 -68 -14 -80 C-15.6 -90 -19.6 -96 -18.8 -105z';
            s += garment(u, coat, ct2);
            s += P('M0 -108 L-9.6 -83 L0 -50 L9.6 -83z', '#fdf6fa', 'opacity=".92" stroke="' + LINE + '" stroke-width=".7"');
            s += P('M-18.8 -105 Q-12 -102 -7 -92 L0 -60 L-6 -90z', shade(ct2, -0.14), 'opacity=".9"');
            s += P('M18.8 -105 Q12 -102 7 -92 L0 -60 L6 -90z', shade(ct2, -0.14), 'opacity=".9"');
            s += P('M-9.6 -107.4 Q0 -100 9.6 -107.4 L8.4 -102 Q0 -96.4 -8.4 -102z', '#fff', OUT);
            for (var k = 0; k < 3; k++) s += CI(-4.4, -80 + k * 11, 1.5, '#fff', 'stroke="' + shade(ct2, -0.3) + '" stroke-width=".6"');
            s += RC(-15, -73.4, 30, 3.4, '#a98fe0', 'rx="1.4"') + RC(-2.6, -74.2, 5.2, 5, '#e0d2fa', 'rx="1" stroke="#8a74c6" stroke-width=".6"');
            s += P('M-18 -62 L-9 -62 L-9 -52 L-18 -52z M18 -62 L9 -62 L9 -52 L18 -52z', shade(ct2, -0.1), 'stroke="' + shade(ct2, -0.3) + '" stroke-width=".7"');
            s += L('M-22 -46 Q0 -41 22 -46', 'rgba(255,255,255,.6)', 1);
        }
        return s;
    }

    function sleeves(u, kind, arms, sideDefs) {
        var t = TOPS[kind || ''];
        var s = '';
        sideDefs.forEach(function (sd) {
            var a = sd.arm;
            var g = '';
            if (t.sleeve === 'short') {
                g += L(a.short, LINE, 12.4);
                g += L(a.short, t.col, 11);
                g += L(a.short, 'url(#' + u + '-gs)', 11);
            } else if (t.sleeve === 'long') {
                g += L(a.path, LINE, 11.8);
                g += L(a.path, t.col, 10.4);
                g += L(a.path, 'url(#' + u + '-gs)', 10.4);
                g += LB(a.cuffA, t.cuff, 10.8);
            } else if (t.sleeve === 'puff') {
                var pf = a.puff;
                g += EL(pf[0], pf[1], 7.4, 8.4, t.col, OUT);
                g += EL(pf[0], pf[1], 7.4, 8.4, 'url(#' + u + '-gs)');
                g += L(a.puffCuff, kind === 'bluz' ? t.cuff : shade(t.col, -0.2), 2.4);
            }
            s += sd.mir ? mirror(g) : g;
        });
        return s;
    }

    // =========================================================
    // HAJ
    // =========================================================
    function strand(d, col, op, w) { return L(d, col, w || .8, 'opacity="' + (op || 0.5) + '"'); }

    function hairBack(u, style, fill, hairD) {
        var s = '';
        if (style === 'bob') {
            s += P('M-30 -128 C-31 -154 -16 -163 0 -163 C16 -163 31 -154 30 -128 L30.4 -102 C30 -97 26 -94.6 21 -95.6 L15 -97 L-15 -97 L-21 -95.6 C-26 -94.6 -30 -97 -30.4 -102z', fill, OUT);
            s += strand('M-24 -126 C-25 -116 -25.4 -108 -24 -99 M24 -126 C25 -116 25.4 -108 24 -99 M-17 -120 C-18 -112 -18 -104 -17 -98 M17 -120 C18 -112 18 -104 17 -98', hairD, .55, .9);
        } else if (style === 'hosszu') {
            s += P('M-31 -126 C-32 -154 -17 -164 0 -164 C17 -164 32 -154 31 -126 L32.6 -92 C33 -82 36 -74 33 -64 C31 -58 27 -56 24 -60 C22 -56 17 -55 14 -59 L-14 -59 C-17 -55 -22 -56 -24 -60 C-27 -56 -31 -58 -33 -64 C-36 -74 -33 -82 -32.6 -92z', fill, OUT);
            s += strand('M-26 -124 C-28 -108 -29 -90 -27 -68 M26 -124 C28 -108 29 -90 27 -68 M-19 -118 C-21 -102 -21 -84 -19 -64 M19 -118 C21 -102 21 -84 19 -64 M-12 -116 C-13 -100 -13 -82 -12 -62 M12 -116 C13 -100 13 -82 12 -62', hairD, .5, .9);
        } else if (style === 'rovid') {
            s += P('M-27.6 -130 C-29 -153 -15 -162 0 -162 C15 -162 29 -153 27.6 -130 L26 -118 C20 -122 -20 -122 -26 -118z', fill, OUT);
        }
        return s;
    }

    function hairFront(u, style, fill, hairD, hairL) {
        var s = '';
        // oldalfürtök (az arc két oldalán)
        if (style === 'bob') {
            s += P('M-26.6 -132 C-29 -122 -29.6 -108 -27 -99 C-24 -98 -21.4 -100 -20.4 -104 C-22 -112 -23 -120 -23.6 -130z', fill, OUT);
            s += P('M26.6 -132 C29 -122 29.6 -108 27 -99 C24 -98 21.4 -100 20.4 -104 C22 -112 23 -120 23.6 -130z', fill, OUT);
        } else if (style === 'hosszu') {
            s += P('M-26.8 -132 C-30 -118 -31 -100 -29.6 -80 C-28.6 -70 -26 -66 -23.4 -70 C-22 -84 -22 -100 -22 -112 C-22.4 -120 -23.2 -126 -23.8 -131z', fill, OUT);
            s += P('M26.8 -132 C30 -118 31 -100 29.6 -80 C28.6 -70 26 -66 23.4 -70 C22 -84 22 -100 22 -112 C22.4 -120 23.2 -126 23.8 -131z', fill, OUT);
            s += strand('M-27 -124 C-28.6 -108 -28 -92 -26.4 -76 M27 -124 C28.6 -108 28 -92 26.4 -76', hairD, .5, .8);
        } else {
            s += P('M-26.4 -132 C-27.6 -126 -27 -121 -25 -117 L-22.6 -121 L-23.4 -130z', fill, OUT);
            s += P('M26.4 -132 C27.6 -126 27 -121 25 -117 L22.6 -121 L23.4 -130z', fill, OUT);
        }
        // frufru
        var bang;
        if (style === 'rovid') {
            bang = 'M-26.8 -130 C-27.6 -152 -14 -160 0 -160 C14 -160 27.6 -152 26.8 -130 C25 -134 22.6 -138 19 -141 C19.4 -136 18 -132 15.6 -128 C13 -133 10.6 -137 6 -139 C6 -134 4 -130 1 -127 C-1 -132 -4 -136 -8 -138 C-9 -133 -11 -129 -14 -126 C-17 -128 -19 -131 -21 -135 C-23 -133 -25 -131.6 -26.8 -130z';
        } else {
            bang = 'M-26.6 -130 C-27.6 -153 -14 -161.6 0 -161.6 C14 -161.6 27.6 -153 26.6 -130 C24.4 -136 22 -140 17.6 -143 C18 -137 16.6 -131 13 -126.6 C11 -132 8.6 -138 4 -141 C3.6 -135 1.6 -129 -2 -125.4 C-3.4 -131 -6.4 -137 -11 -140 C-11.4 -134 -13.6 -128 -17.6 -124 C-20 -127 -22.6 -131 -25 -134 C-25.6 -132.6 -26 -131.4 -26.6 -130z';
        }
        s += P(bang, fill, OUT);
        // tincs-vonalak és fény
        s += strand('M-19 -151 C-21 -144 -22 -138 -23.6 -133 M-8 -156 C-12 -150 -14 -144 -16 -138 M4 -158 C0 -152 -2 -146 -4 -139 M14 -155 C13 -149 12 -143 10.4 -138 M22 -148 C21 -143 20 -139 19 -136', hairD, .55, .8);
        s += P('M-17 -153.6 C-11 -158.4 -1 -159 6 -157.6 C-1 -156 -9 -155.2 -17 -153.6z', '#fff', 'opacity=".42"');
        s += P('M9 -157 C15 -156 21 -152.4 24 -146 C20 -150.6 15 -153.6 9 -157z', '#fff', 'opacity=".28"');
        // ahoge: egy kis dacos tincs
        s += P('M-1.6 -160.4 C-4.8 -166.6 -1.2 -172 4.6 -170.2 C1.2 -169.6 -.2 -166 .8 -160.2z', fill, OUT);
        s += L('M-.6 -162 C-2.2 -165.4 -.8 -168.4 2 -169', 'rgba(255,255,255,.45)', .7);
        return s;
    }

    // =========================================================
    // KIEGÉSZÍTŐK
    // =========================================================
    function hairAccessory(u, kind, hair, hairD, style) {
        var s = '', i;
        if (kind === 'hajgumi') {
            // oldalfarok + hajgumi
            s += P('M21 -148 C32 -150 38 -138 36 -122 C35 -114 31 -108 27 -108 C27 -116 28 -124 24 -132 C22 -136 20.6 -142 21 -148z', 'url(#' + u + '-hair)', OUT);
            s += strand('M26 -144 C32 -140 33 -128 31 -114', hairD, .5, .8);
            s += EL(21.8, -146, 4.8, 4.2, '#f4a3b8', OUT);
            s += P('M17.6 -147.6 q2 -2.6 4 0 q2 -2.6 4.4 .4 q1.4 2 -.4 3.6 q-2 2.2 -4 .4 q-2 2.2 -4 0 q-2 -.8 0 -4.4z', '#f9c0d1', 'opacity=".95"');
            s += L('M19 -146 q3 -1.8 5 .6', '#fff', .8, 'opacity=".8"');
        } else if (kind === 'masni') {
            s += P('M-17.6 -152 C-23 -158.6 -30.6 -160 -31.4 -154.4 C-32 -148 -25 -146.6 -17.6 -150.6z', '#f4a3b8', OUT);
            s += P('M-17.6 -152 C-12 -158.6 -4.4 -160 -3.6 -154.4 C-3 -148 -10 -146.6 -17.6 -150.6z', '#f4a3b8', OUT);
            s += L('M-27 -154 C-24 -152 -22 -151.4 -19 -151 M-8 -154 C-11 -152 -13 -151.4 -16 -151', '#e58aa3', .8);
            s += P('M-17.6 -151 L-22 -143.6 L-19.6 -143 L-17.6 -147 L-15.6 -143 L-13.2 -143.6z', '#e58aa3', OUT);
            s += P('M-20.6 -153.8 Q-17.6 -156 -14.6 -153.8 Q-13.6 -150.6 -14.6 -148.6 Q-17.6 -146.8 -20.6 -148.6 Q-21.6 -150.6 -20.6 -153.8z', '#e58aa3', OUT);
            s += L('M-19.4 -153 q1.6 -1 3 0', '#fff', .8, 'opacity=".8"');
        } else if (kind === 'macskaful') {
            var band = shade(hair, -0.32);
            s += L('M-25 -141 C-17 -158 17 -158 25 -141', band, 3.4);
            s += L('M-25 -141 C-17 -158 17 -158 25 -141', 'rgba(255,255,255,.25)', 1);
            s += P('M-24.6 -146 L-21 -170 C-16 -168 -11 -163 -8.4 -156z', band, OUT);
            s += P('M24.6 -146 L21 -170 C16 -168 11 -163 8.4 -156z', band, OUT);
            s += P('M-21.8 -150 L-19.6 -164 C-16.6 -162.6 -13.4 -159 -11.6 -154z', '#f7b5c8');
            s += P('M21.8 -150 L19.6 -164 C16.6 -162.6 13.4 -159 11.6 -154z', '#f7b5c8');
            s += L('M-19.4 -158 l1 -3 M-16.4 -156 l1.4 -3 M19.4 -158 l-1 -3 M16.4 -156 l-1.4 -3', '#fff', .6, 'opacity=".7"');
        } else if (kind === 'virag') {
            var fc = ['#f4a3b8', '#fdf6fa', '#9fd6f5', '#f4a3b8', '#fdf6fa', '#9fd6f5', '#f4a3b8', '#fdf6fa'];
            s += L('M-26 -135 C-20 -157 20 -157 26 -135', '#6fbe84', 2.2);
            for (i = 0; i < 8; i++) {
                var a = Math.PI * (1.08 + i * 0.11);
                var fx = n1(Math.cos(a) * 26.6), fy = n1(-140 + Math.sin(a) * 20.6);
                if (i % 2) s += P('M' + fx + ' ' + fy + ' q-5 -3 -7 1 q3 4 7 -1z', '#7cc78e', 'opacity=".95"');
                for (var pt = 0; pt < 5; pt++) {
                    var pa = pt * 1.2566 + i;
                    s += EL(n1(fx + Math.cos(pa) * 3.1), n1(fy + Math.sin(pa) * 3.1), 2.2, 1.7, fc[i], 'stroke="' + LINE + '" stroke-width=".35" transform="rotate(' + Math.round(pa * 57.3) + ' ' + n1(fx + Math.cos(pa) * 3.1) + ' ' + n1(fy + Math.sin(pa) * 3.1) + ')"');
                }
                s += CI(fx, fy, 1.5, '#f7d26a', 'stroke="#c9a53c" stroke-width=".3"');
            }
        }
        void style;
        return s;
    }

    function neckWear(u, kind) {
        var s = '';
        if (kind === 'choker') {
            s += P('M-6.8 -109.4 Q0 -106.4 6.8 -109.4 L6.8 -105.8 Q0 -102.8 -6.8 -105.8z', '#3a2f45', OUT);
            s += L('M-6.4 -108.4 Q0 -105.6 6.4 -108.4', '#f4a3b8', .9);
            s += P('M0 -102.6 C-3 -105 -4 -102 -1.6 -100 L0 -98.8 L1.6 -100 C4 -102 3 -105 0 -102.6z', '#f4a3b8', 'stroke="#c96d86" stroke-width=".5"');
            s += CI(-3.4, -103.8, .5, '#fff', 'opacity=".9"');
        } else if (kind === 'nyakmasni') {
            s += P('M0 -104 L-9.6 -109.6 C-11 -106 -11 -101 -9.6 -98.2z', '#8fd3f4', OUT);
            s += P('M0 -104 L9.6 -109.6 C11 -106 11 -101 9.6 -98.2z', '#8fd3f4', OUT);
            s += L('M-8 -106.4 L-3 -104.4 M-8 -102 L-3 -103.6 M8 -106.4 L3 -104.4 M8 -102 L3 -103.6', '#5fb0dc', .6);
            s += P('M-2.8 -107 Q0 -108.6 2.8 -107 L3.2 -101.4 Q0 -100 -3.2 -101.4z', '#6cb9e0', OUT);
            s += L('M-1.4 -106.4 V-102', '#fff', .6, 'opacity=".6"');
        } else if (kind === 'medal') {
            s += L('M-6.4 -108.6 L-.8 -88 M6.4 -108.6 L.8 -88', '#c3adee', 1.8);
            s += L('M-6.4 -108.6 L-.8 -88 M6.4 -108.6 L.8 -88', 'rgba(255,255,255,.4)', .6);
            s += CI(0, -85.6, 4.8, '#f7d26a', 'stroke="#b8902c" stroke-width=".8"');
            s += CI(0, -85.6, 3.4, 'none', 'stroke="#d9a93a" stroke-width=".6"');
            s += P('M0 -88.8 l.9 2 2.1 .3 -1.6 1.5 .4 2.1 -1.8 -1 -1.8 1 .4 -2.1 -1.6 -1.5 2.1 -.3z', '#fff3b8');
        } else if (kind === 'gyongy') {
            for (var g = 0; g < 11; g++) {
                var t = g / 10;
                var gx = n1(-9.4 + t * 18.8);
                var gy = n1(-108 + Math.sin(t * Math.PI) * 8.6);
                s += CI(gx, gy, 1.9, '#fffaf6', 'stroke="#cdbfd2" stroke-width=".5"');
                s += CI(n1(gx - .5), n1(gy - .6), .55, '#fff');
            }
            s += CI(0, -99, 2.6, '#fffaf6', 'stroke="#cdbfd2" stroke-width=".5"') + CI(-.7, -99.8, .8, '#fff');
        }
        return s;
    }

    // =========================================================
    // ARC
    // =========================================================
    function eye(u, ex, side, mood, c, makeup) {
        // side: -1 bal szem, +1 jobb szem; ex: a szem közepe
        var s = '<g transform="translate(' + ex + ' -126.4)">';
        var inner = -side; // az orr felé
        if (mood === 'happy') {
            s += L('M-5.8 .6 Q0 -5.2 5.8 .6', INK, 1.9);
            s += L('M' + (side * 5.4) + ' -.4 l' + (side * 1.8) + ' -1.2', INK, 1.3);
            s += L('M-4 -2 q-.6 -1 -1.6 -1.2 M4 -2 q.6 -1 1.6 -1.2', INK, .5, 'opacity="0"');
            if (makeup) s += L('M-6 -3.4 Q0 -8 6 -3.4', '#f7a8c4', 1.2, 'opacity=".7"');
        } else {
            var open = mood === 'proud' ? 0.62 : 1;
            s += '<g class="av-eye">';
            s += EL(0, 0, 5.5, 6.3 * open, '#fff', 'stroke="' + LINE + '" stroke-width=".5"');
            s += '<clipPath id="' + u + '-ec' + (side > 0 ? 'r' : 'l') + '"><ellipse cx="0" cy="0" rx="5.5" ry="' + n1(6.3 * open) + '"/></clipPath>';
            s += '<g clip-path="url(#' + u + '-ec' + (side > 0 ? 'r' : 'l') + ')">';
            s += EL(0, .4, 4.1, 5.5, 'url(#' + u + '-iris)');
            s += EL(0, .7, 4.1, 5.5, 'none', 'stroke="' + shade(c.eye, -0.55) + '" stroke-width=".8"');
            s += EL(0, .8, 1.9, 3.1, '#2a2236');
            s += EL(0, 4.2, 3.2, 1.6, 'rgba(255,255,255,.28)');
            s += CI(1.4, -2.6, 1.6, '#fff');
            s += CI(-1.6, 2.8, .8, '#fff', 'opacity=".85"');
            s += EL(0, -4.6, 5.6, 2.8, 'rgba(40,20,60,.28)');
            s += '</g>';
            s += '</g>';
            if (mood === 'proud') s += P('M-6.2 -3.4 Q0 -6.8 6.2 -3.4 L6.2 -1.4 Q0 -4.6 -6.2 -1.4z', c.skin, 'opacity="0"');
            // felső szemhéj-vonal és pillák
            s += L('M-6.3 ' + (open < 1 ? -1.6 : -1.4) + ' C-5.4 ' + (open < 1 ? -5.6 : -7.2) + ' 5.4 ' + (open < 1 ? -5.6 : -7.4) + ' 6.4 ' + (open < 1 ? -1.8 : -1.6), INK, 1.9);
            s += L('M' + (side * 5.9) + ' ' + (open < 1 ? -2.6 : -3.2) + ' l' + (side * 2.2) + ' -1.4', INK, 1.3);
            if (makeup) {
                s += L('M' + (side * 6) + ' -3.6 l' + (side * 3.4) + ' -2.4', INK, 1.1);
                s += L('M' + (side * 4.4) + ' -5.6 l' + (side * 1.8) + ' -2.4 M' + (side * 1.6) + ' -6.6 l' + (side * .8) + ' -2.4', INK, .8);
                s += EL(0, -8, 6.4, 2.6, '#f7a8c4', 'opacity=".42"');
            }
            s += L('M-4.6 5.8 Q0 7.2 4.6 5.8', 'rgba(58,47,69,.3)', .6);
        }
        s += '</g>';
        void inner;
        return s;
    }

    function brows(mood, hairD) {
        var s = '';
        if (mood === 'worried') {
            s += P('M-15 -134.6 Q-11 -135.4 -5.4 -139 L-5.8 -137.4 Q-11 -134.2 -15 -133z M15 -134.6 Q11 -135.4 5.4 -139 L5.8 -137.4 Q11 -134.2 15 -133z', hairD, 'opacity=".95"');
        } else if (mood === 'proud') {
            s += P('M-14.6 -137 Q-10 -140.2 -5 -137.6 L-5.2 -136 Q-10 -138 -14.6 -135.6z', hairD);
            s += P('M14.6 -139 Q10 -142 5 -139 L5.2 -137.4 Q10 -139.6 14.6 -137.2z', hairD);
        } else {
            s += P('M-14.6 -135.4 Q-10 -138.8 -5 -137 L-5.2 -135.4 Q-10 -136.6 -14.6 -133.8z M14.6 -135.4 Q10 -138.8 5 -137 L5.2 -135.4 Q10 -136.6 14.6 -133.8z', hairD, 'opacity=".95"');
        }
        return s;
    }

    function mouth(mood, face) {
        var lip = face === 'smink' ? '#e0557c' : '#cf6a80';
        var s = '';
        if (mood === 'happy') {
            s += P('M-5.4 -114.8 Q0 -110 5.4 -114.8 Q4 -108.4 0 -108.2 Q-4 -108.4 -5.4 -114.8z', '#7a2f4a', 'stroke="' + shade(lip, -0.3) + '" stroke-width=".7" stroke-linejoin="round"');
            s += P('M-4.2 -114.2 Q0 -112.6 4.2 -114.2 L3.8 -112.6 Q0 -111.4 -3.8 -112.6z', '#fff');
            s += P('M-2.6 -109.4 Q0 -111.6 2.6 -109.4 Q0 -108.2 -2.6 -109.4z', '#f27a94');
        } else if (mood === 'worried') {
            s += L('M-3.8 -111.6 Q-1.8 -113.6 0 -112 Q1.8 -110.6 3.8 -112.6', lip, 1.5);
        } else if (mood === 'proud') {
            s += L('M-4.8 -113.4 Q-.5 -110 5 -114.8', lip, 1.7);
            s += L('M5 -114.8 l.9 -.9', lip, 1.1);
        } else {
            s += P('M-4 -113.4 Q-1.8 -114.8 0 -113.6 Q1.8 -114.8 4 -113.4 Q0 -110.6 -4 -113.4z', lip, 'stroke="' + shade(lip, -0.25) + '" stroke-width=".5"');
            s += L('M-3 -112.6 Q0 -111.4 3 -112.6', 'rgba(255,255,255,.4)', .6);
        }
        if (face === 'smink' && mood !== 'happy') s += EL(0, -112.2, 2.2, .8, 'rgba(255,255,255,.5)');
        return s;
    }

    function faceLayer(u, c, mood, face) {
        var s = '';
        // fül
        s += EL(-23.6, -126.4, 3.5, 5.4, 'url(#' + u + '-face)', OUT);
        s += EL(23.6, -126.4, 3.5, 5.4, 'url(#' + u + '-face)', OUT);
        s += EL(-23.4, -126, 1.6, 3.2, c.skinD, 'opacity=".35"') + EL(23.4, -126, 1.6, 3.2, c.skinD, 'opacity=".35"');
        // arc
        var fd = 'M-23.6 -131 C-24 -145.4 -14 -153.6 0 -153.6 C14 -153.6 24 -145.4 23.6 -131 C23.2 -121 17.6 -110.6 7.8 -106.6 C3.6 -105 -3.6 -105 -7.8 -106.6 C-17.6 -110.6 -23.2 -121 -23.6 -131z';
        s += P(fd, 'url(#' + u + '-face)', OUT);
        // áll-árnyék és orr
        s += P('M-9 -108 Q0 -104 9 -108 Q0 -106.4 -9 -108z', c.skinD, 'opacity=".3"');
        s += L('M-1 -121.2 Q0 -119.4 1.2 -120.6', c.skinDD, 1);
        s += EL(-.6, -122.6, .9, .6, 'rgba(255,255,255,.55)');
        // pír
        var strong = face === 'pir' || face === 'smink' || mood === 'happy';
        s += EL(-14.2, -117.4, 6.2, 3.6, 'url(#' + u + '-bl)', 'opacity="' + (strong ? 1 : 0.55) + '"');
        s += EL(14.2, -117.4, 6.2, 3.6, 'url(#' + u + '-bl)', 'opacity="' + (strong ? 1 : 0.55) + '"');
        if (face === 'pir') {
            s += L('M-17.4 -118.6 l1.8 -2 M-14.6 -118.2 l1.8 -2 M-11.8 -117.8 l1.8 -2', '#ff5c88', .8, 'opacity=".75"');
            s += L('M17.4 -118.6 l-1.8 -2 M14.6 -118.2 l-1.8 -2 M11.8 -117.8 l-1.8 -2', '#ff5c88', .8, 'opacity=".75"');
        }
        var mk = face === 'smink';
        s += eye(u, -9.2, -1, mood, c, mk) + eye(u, 9.2, 1, mood, c, mk);
        s += brows(mood, c.hairD);
        s += mouth(mood, face);
        if (mood === 'worried') s += P('M25 -141 C22.6 -136.4 22.4 -133.8 24.6 -132 C27 -133.4 27 -136.6 25 -141z', '#a9e0fa', 'stroke="#6cb9e0" stroke-width=".5"') + CI(24.4, -134, .7, '#fff');
        if (mood === 'proud') s += P('M-27 -141 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z', '#fff3b8', 'opacity=".95"');
        if (face === 'szemuveg') {
            s += CI(-9.2, -126.4, 8.4, 'rgba(255,255,255,.14)', 'stroke="#3a2f45" stroke-width="1.5"');
            s += CI(9.2, -126.4, 8.4, 'rgba(255,255,255,.14)', 'stroke="#3a2f45" stroke-width="1.5"');
            s += L('M-.8 -127.6 Q0 -128.8 .8 -127.6 M-17.6 -127.6 L-24 -128.6 M17.6 -127.6 L24 -128.6', '#3a2f45', 1.3);
            s += L('M-14.6 -130.6 Q-12 -133 -8.6 -132.6 M3.8 -130.6 Q6.4 -133 9.8 -132.6', '#fff', 1.1, 'opacity=".8"');
            s += L('M-5 -121.2 q-1.4 1.4 -4 1.4', '#fff', .6, 'opacity=".5"');
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
            skin: skin, skinL: shade(skin, 0.2), skinD: shade(skin, -0.13), skinDD: shade(skin, -0.3),
            hair: hair, hairD: shade(hair, -0.26), hairL: shade(hair, 0.32),
            eye: EYES[hairId] || '#7a63d9'
        };
        var hairFill = wig ? 'url(#' + u + '-wig)' : 'url(#' + u + '-hair)';
        var top = eq.top || '';
        var out = [];

        out.push(defs(u, col));
        out.push(EL(0, 0.4, 27, 3.4, 'rgba(58,47,69,.2)'));

        // hátsó haj
        out.push(hairBack(u, style, hairFill, wig ? '#b98ccc' : col.hairD));

        // lábak és cipő
        out.push(legSkin(u) + mirror(legSkin(u)));
        out.push(legItem(u, eq.legs) + mirror(legItem(u, eq.legs)));
        out.push(shoeShape(u) + mirror(shoeShape(u)));

        // alsó ruha
        out.push(bottomWear(u, eq.bottom));

        // törzs + felső
        if (top !== 'crop') out.push(P(torsoD(0, -58), 'url(#' + u + '-limb)', OUT));
        out.push(topBody(u, top, skin, col.skinD));

        // karok
        var idle = ARMS.idle;
        var right = pose === 'wave' ? ARMS.wave : (pose === 'hips' ? ARMS.hips : null);
        var armsDraw = '';
        armsDraw += armSkin(u, idle, -1, skin);
        armsDraw += handShape(u, idle, skin, col.skinD, false);
        if (right) { armsDraw += armSkin(u, right, 1, skin) + handShape(u, right, skin, col.skinD, true); }
        else armsDraw += mirror(armSkin(u, idle, 1, skin) + handShape(u, idle, skin, col.skinD, false));
        out.push(armsDraw);
        out.push(sleeves(u, top, ARMS, [{ arm: idle, side: -1, mir: false }, right ? { arm: right, side: 1, mir: false } : { arm: idle, side: 1, mir: true }]));

        // nyak
        out.push(P('M-5.8 -114 L5.8 -114 C6 -108 6.6 -105 7.4 -103 Q0 -99.4 -7.4 -103 C-6.6 -105 -6 -108 -5.8 -114z', 'url(#' + u + '-limb)', OUT));
        out.push(EL(0, -108.6, 6, 3.4, col.skinDD, 'opacity=".22"'));
        out.push(neckWear(u, eq.neck));

        // fej
        out.push(faceLayer(u, col, mood, eq.face));

        // elülső haj + kiegészítők
        out.push(hairFront(u, style, hairFill, wig ? '#b98ccc' : col.hairD, col.hairL));
        out.push(hairAccessory(u, eq.hair, hair, col.hairD, style));

        return '<g class="av-body">' + out.join('') + '</g>';
    };

    C.portrait = function (o, vb) {
        var uid = 'pt' + (o && o.uid ? o.uid : '');
        return '<svg viewBox="' + (vb || '-54 -176 108 186') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Karakter">' + C.avatar(Object.assign({}, o, { uid: uid })) + '</svg>';
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof globalThis !== 'undefined' ? globalThis : this);
