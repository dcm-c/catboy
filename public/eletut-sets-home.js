// =========================================================
// PASZTELL ÉLETÚT - helyszínek: otthon (szoba, gépasztal, nappali, konyha, költözés, számlák)
// Minden helyszín: function (c, o) → { bg, fg, lights }. A szereplők a bg és az fg között állnak.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var K = M.art.kit;
    var Stage = M.stage, S = Stage.sets, h = Stage.h, P = Stage.props;
    var rect = K.rect, circ = K.circ, ell = K.ell, path = K.path, line = K.line, flat = K.flat, shade = K.shade, n1 = K.n1;

    function lampLight(c, x, y, r, col) { return c.t.lamp ? Stage.glowSpot(c, 'll' + Math.round(x), x, y, r, col || '#ffd9a0', 0.55) : ''; }
    function bedDraw(c, x, y, o) {
        // y = padló-vonal (az ágy alja); az ágy x-től jobbra
        o = o || {};
        var w = o.w || 140, s = '';
        s += K.gshadow(x + w / 2, y + 2, w * 0.5, 0.14);
        s += rect(x, y - 34, 8, 36, '#c49e6c', 'rx="2"') + rect(x + w - 8, y - 22, 8, 24, '#c49e6c', 'rx="2"');
        s += rect(x + 4, y - 24, w - 8, 16, o.base || '#e8d3f2', 'rx="4"');
        s += path('M' + (x + 4) + ' ' + (y - 22) + ' H' + (x + w - 4) + ' V' + (y - 10) + ' H' + (x + 4) + 'Z', o.blanket || '#f5a9b8');
        s += path('M' + (x + 4) + ' ' + (y - 22) + ' q12 6 24 0 t24 0 t24 0 t24 0 t24 0 V' + (y - 24) + ' H' + (x + 4) + 'Z', shade(o.blanket || '#f5a9b8', 0.35), 'stroke="none"');
        s += ell(x + 24, y - 30, 17, 8, '#fdf6fa') + ell(x + 52, y - 29, 13, 7, '#c3adee');
        if (o.cat) s += K.prop('cat', x + w - 42, y - 20, 28, { noShadow: true, anim: 'breath' });
        return s;
    }

    S.bedroom = function (c, o) {
        o = o || {};
        var hz = 170, wallc = o.wall || '#f8e1ea', s = '';
        s += h.wall(c, wallc, hz, { dots: true }) + h.floor(c, o.floor || '#d9b98c', hz);
        s += h.window(c, 46, 38, 86, 72, { curtain: o.curtain || true, view: o.view || 'city', sunX: 0.7 });
        s += K.prop('picture', 176, 98, 32, { noShadow: true }) + K.prop('picture', 214, 84, 26, { noShadow: true }) + K.prop('star', 192, 124, 14, { noShadow: true });
        s += ell(200, 214, 78, 14, o.rug || '#f6c9d6', 'stroke="none"') + ell(200, 214, 58, 9, shade(o.rug || '#f6c9d6', 0.2), 'stroke="none"');
        // íróasztal az ablak alatt
        s += K.deskSet(36, 150, 112, 218) + (o.noLaptop ? '' : K.prop('laptop', 82, 150, 36, { noShadow: true })) + K.prop('plant', 130, 150, 22, { noShadow: true }) + K.prop('books', 56, 150, 18, { noShadow: true });
        s += rect(70, 178, 40, 5, '#b58a5a', 'rx="2"') + rect(86, 183, 5, 30, '#8a6a4a');
        if (!o.noBed) s += bedDraw(c, 252, 196, { cat: o.cat, blanket: o.blanket });
        if (o.door) s += rect(332, 52, 52, 116, '#c49e6c', 'rx="2"') + rect(338, 58, 40, 104, '#d9b88a', 'rx="2" stroke="none"') + circ(372, 112, 2.4, '#ffe08a', 'stroke="none"');
        var lights = h.shaft(c, 50, 112, 128, 210, 40, o.shaft) + lampLight(c, 128, 130, 70);
        if (c.t.lamp && !o.noLamp) s += h.lampShade(c, 140, 104, 1);
        if (o.messy) s += P.laundry(c, { x: 175, y: 226, s: 0.9 }) + K.prop('tshirt', 150, 232, 20, { noShadow: true });
        return { bg: s, fg: '', lights: lights };
    };

    // Gépasztal: monitor(ok), led-szalag, headset; o.screen: chat|video|art|code|game|dark|crash; o.dual
    S.desk = function (c, o) {
        o = o || {};
        var hz = 172, s = '';
        var dark = !!c.t.lamp || o.dark !== false;
        s += h.wall(c, o.wall || '#2c2745', hz) + h.floor(c, o.floor || '#241f3a', hz);
        // led-szalag a fal tetején
        s += flat(0, 22, 400, 3, '#2a2548');
        for (var i = 0; i < 22; i++) s += '<circle class="led" style="animation-delay:-' + (i * 0.3).toFixed(1) + 's" cx="' + (10 + i * 18) + '" cy="23.5" r="2.2" fill="#f7a8c4"/>';
        s += Stage.glowSpot(c, 'dg', 200, 90, 130, 'rgba(120,90,220,1)', 0.28);
        // poszterek
        s += rect(16, 48, 40, 56, '#f5a9b8', 'rx="3"') + K.prop('star', 36, 86, 26, { noShadow: true }) + rect(332, 44, 48, 36, '#3f3a68', 'rx="3"') + K.prop('moon', 356, 72, 22, { noShadow: true });
        // asztal
        s += rect(20, 148, 360, 9, '#d6b784', 'rx="3"') + rect(32, 157, 6, 66, '#a98a5e') + rect(362, 157, 6, 66, '#a98a5e') + K.gshadow(200, 224, 170, 0.14);
        // monitor(ok)
        var scr = o.screen || 'chat';
        function monitor(x, w, hh, kind) {
            var m = rect(x, 148 - hh - 12, w, hh, '#4a4060', 'rx="6"') + rect(x + 6, 148 - hh - 6, w - 12, hh - 12, kind === 'dark' ? '#15122a' : '#f6eefb', 'rx="3" class="scr" stroke="none"');
            var ix = x + 10, iy = 148 - hh, iw = w - 20, ih = hh - 20;
            if (kind === 'chat') {
                m += rect(x + 6, 148 - hh - 6, 30, hh - 12, '#403a68', 'rx="3" stroke="none"');
                for (var k = 0; k < 4; k++) m += circ(x + 14, 148 - hh + 6 + k * 14, 4.4, ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][k], 'stroke="none"');
                for (var q = 0; q < 4; q++) m += rect(x + 42, 148 - hh + 3 + q * 14, 24 + (q * 17) % 36, 4, q % 2 ? '#8a7aa8' : '#c3adee', 'rx="2" stroke="none"') + rect(x + 42, 148 - hh + 9 + q * 14, 14 + (q * 11) % 30, 3, '#d8d0ee', 'rx="1.5" stroke="none"');
            } else if (kind === 'video') {
                m += rect(ix, iy, iw, ih - 14, '#c3adee', 'rx="3" stroke="none"') + path('M' + (ix + iw / 2 - 7) + ' ' + (iy + 10) + ' l16 9 -16 9z', '#fff', 'stroke="none"') + rect(ix, iy + ih - 8, iw, 4, '#d8c6e8', 'rx="2" stroke="none"') + rect(ix, iy + ih - 8, iw * 0.4, 4, '#f5a9b8', 'rx="2" stroke="none"');
            } else if (kind === 'art') {
                m += path('M' + ix + ' ' + (iy + ih) + ' Q' + (ix + iw * 0.3) + ' ' + iy + ' ' + (ix + iw * 0.55) + ' ' + (iy + ih * 0.55) + ' T' + (ix + iw) + ' ' + (iy + ih * 0.4) + ' V' + (iy + ih) + 'Z', '#c3adee', 'stroke="none"') + circ(ix + iw * 0.78, iy + 12, 7, '#ffe08a', 'stroke="none"') + path('M' + ix + ' ' + (iy + ih) + ' Q' + (ix + iw * 0.4) + ' ' + (iy + ih * 0.6) + ' ' + (ix + iw) + ' ' + (iy + ih) + 'Z', '#f5a9b8', 'stroke="none"');
            } else if (kind === 'code') {
                m += rect(x + 6, 148 - hh - 6, w - 12, hh - 12, '#1f1c3a', 'rx="3" stroke="none"');
                for (var l = 0; l < 6; l++) m += rect(ix + (l % 3) * 6, iy + 2 + l * 8, 20 + (l * 23) % 50, 3, ['#9fd6f5', '#f5a9b8', '#ffe08a', '#a8e6c4'][l % 4], 'rx="1.5" stroke="none" class="ty" style="animation-delay:-' + l * 0.4 + 's"');
            } else if (kind === 'game') {
                m += rect(x + 6, 148 - hh - 6, w - 12, hh - 12, '#2a2548', 'rx="3" stroke="none"') + circ(x + w / 2, 148 - hh / 2 - 8, 12, '#f5a9b8') + rect(x + w / 2 - 22, 148 - 20 - 8, 44, 6, '#9fd6f5', 'rx="3" stroke="none"') + K.prop('star', x + 22, 148 - hh + 12, 12, { noShadow: true });
            } else if (kind === 'crash') {
                m += rect(x + 6, 148 - hh - 6, w - 12, hh - 12, '#2a4bb0', 'rx="3" stroke="none"') + rect(ix, iy + 6, iw * 0.6, 3, '#fff', 'rx="1" stroke="none"') + rect(ix, iy + 14, iw * 0.8, 3, '#cfe0ff', 'rx="1" stroke="none"') + rect(ix, iy + 22, iw * 0.5, 3, '#cfe0ff', 'rx="1" stroke="none"');
            }
            return m + rect(x + w / 2 - 14, 148 - 12, 28, 4, '#5a4e72') + rect(x + w / 2 - 5, 148 - 12, 10, 12, '#5a4e72');
        }
        if (o.dual) s += monitor(40, 150, 92, scr) + monitor(208, 150, 92, o.screen2 || 'video');
        else s += monitor(100, 200, 102, scr);
        if (!o.noGlow) s += Stage.glowSpot(c, 'mg', o.dual ? 200 : 200, 108, 160, scr === 'crash' ? '#6fa0ff' : '#c9b8ff', 0.22);
        s += K.prop('keyboard', 200, 150, 40, { noShadow: true }) + P.headset(c, { x: 340, y: 150, s: 0.9 }) + K.prop('coffee', 62, 150, 16, { noShadow: true });
        if (o.cat) s += K.prop('cat', 320, 150, 32, { noShadow: true, anim: 'breath' });
        // szék
        s += rect(168, 178, 64, 8, '#6a5a98', 'rx="4"') + rect(196, 186, 8, 28, '#5a4e72') + ell(200, 218, 28, 4, '#5a4e72');
        return { bg: s, fg: '', lights: '' };
    };

    S.living = function (c, o) {
        o = o || {};
        var hz = 168, s = '';
        s += h.wall(c, o.wall || '#fbe9d9', hz) + h.floor(c, o.floor || '#d9b98c', hz);
        s += h.window(c, 36, 40, 88, 70, { curtain: '#e8c9a8', view: 'trees', sunX: 0.7 });
        [[168, 66, 28], [200, 56, 22], [230, 70, 26]].forEach(function (p) { s += K.prop('picture', p[0], p[1] + 26, p[2] + 6, { noShadow: true }); });
        // kanapé
        var cx = o.sofaX || 262;
        s += K.gshadow(cx, 204, 70, 0.16) + rect(cx - 66, 150, 132, 36, o.sofa || '#7a8fd8', 'rx="10"') + rect(cx - 72, 168, 144, 30, shade(o.sofa || '#7a8fd8', -0.08), 'rx="10"') + rect(cx - 72, 164, 16, 38, shade(o.sofa || '#7a8fd8', -0.18), 'rx="7"') + rect(cx + 56, 164, 16, 38, shade(o.sofa || '#7a8fd8', -0.18), 'rx="7"');
        s += line('M' + (cx) + ' 186 V198', shade(o.sofa || '#7a8fd8', -0.3), 1.2) + ell(cx - 38, 168, 14, 10, '#f5a9b8') + ell(cx + 36, 168, 14, 10, '#ffe08a');
        s += rect(cx - 60, 198, 6, 10, '#6a5a78') + rect(cx + 54, 198, 6, 10, '#6a5a78');
        // TV szekrény + TV
        if (!o.noTv) s += rect(24, 146, 82, 8, '#c49e6c', 'rx="2"') + rect(24, 154, 82, 44, '#d9b88a', 'rx="2"') + rect(40, 106, 56, 38, '#2a2548', 'rx="3"') + rect(43, 109, 50, 30, c.t.lamp ? '#9fd6f5' : '#6a6290', 'rx="2" class="scr" stroke="none"');
        // állólámpa + növény
        s += h.lampShade(c, 346, 90, 1.2, '#ffe0a8') + K.prop('plant', 372, 190, 40, { noShadow: true });
        s += ell(180, 218, 60, 10, o.rug || '#c9d7ee', 'stroke="none"');
        if (o.door) s += rect(318, 46, 54, 124, '#b98b5a', 'rx="2"') + rect(324, 52, 42, 112, '#d1a874', 'rx="2" stroke="none"') + circ(358, 112, 2.4, '#ffe08a', 'stroke="none"');
        if (o.table) {
            s += K.gshadow(200, 220, 70, 0.16) + ell(200, 198, 70, 14, '#e8c99a') + rect(194, 198, 12, 22, '#b98b5a') + P.plate(c, { x: 160, y: 198, s: 0.9 }) + P.plate(c, { x: 240, y: 198, s: 0.9 }) + K.prop('teacup', 200, 196, 16, { noShadow: true });
        }
        var lights = h.shaft(c, 40, 112, 120, 214, 60) + lampLight(c, 346, 110, 80);
        return { bg: s, fg: '', lights: lights };
    };

    S.kitchen = function (c, o) {
        o = o || {};
        var hz = 168, s = '';
        s += h.wall(c, o.wall || '#fdf0dc', hz) + h.floor(c, o.floor || '#e6d2ae', hz, { tile: true });
        // csempe a pult fölött
        for (var i = 0; i < 12; i++) for (var j = 0; j < 3; j++) s += rect(20 + i * 30, 92 + j * 17, 30, 17, ((i + j) % 2) ? '#fff' : '#e8f4fa', 'stroke="#d9e6ee" stroke-width=".8"');
        // felső szekrények
        for (var k = 0; k < 5; k++) s += rect(18 + k * 56, 26, 54, 52, k % 2 ? '#f6e1c4' : '#f0d4b0', 'rx="3"') + rect(24 + k * 56, 32, 42, 40, shade(k % 2 ? '#f6e1c4' : '#f0d4b0', 0.1), 'rx="2" stroke="none"') + circ(60 + k * 56, 54, 2.2, '#8a6a4a', 'stroke="none"');
        s += h.window(c, 300, 42, 64, 44, { view: 'trees', sunX: 0.5, curtain: false });
        // pult
        s += rect(0, 150, 400, 54, '#f0d4b0') + rect(0, 146, 400, 8, '#fdf6fa', 'rx="2"');
        for (var m = 0; m < 8; m++) s += line('M' + (m * 50 + 25) + ' 156 V202', '#d9b88a', 1.2);
        s += P.stove(c, { x: 90, y: 150, s: 1 }) + K.prop('coffee', 192, 148, 16, { noShadow: true }) + P.cookies(c, { x: 260, y: 148, s: 0.9 }) + K.prop('plant', 372, 148, 24, { noShadow: true }) + K.prop('cake', 330, 148, 24, { noShadow: true });
        if (o.mess) s += K.prop('cupcake', 220, 148, 14, { noShadow: true }) + circ(150, 142, 4, '#fff', 'stroke="none"') + ell(168, 146, 6, 3, '#fff', 'stroke="none"');
        var lights = h.shaft(c, 304, 88, 360, 200, 36, 0.24);
        return { bg: s, fg: '', lights: lights };
    };

    // költözés/üres lakás: dobozok, kulcs, nagy ablak
    S.moving = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        s += h.wall(c, o.wall || '#f3ecf6', hz) + h.floor(c, '#d7bf9a', hz);
        s += h.window(c, 120, 34, 150, 92, { view: 'city', curtain: false, sunX: 0.7, sunR: 0.18 });
        s += P.boxes(c, { x: 70, y: 208, s: 1.05 }) + P.box(c, { x: 330, y: 214, s: 1, l: true }) + P.box(c, { x: 360, y: 204, s: 0.8 });
        if (o.key) s += K.prop('key', 210, 216, 22, { shadow: 0.12 });
        if (o.sofa) s += rect(250, 168, 100, 30, '#7a8fd8', 'rx="8"');
        return { bg: s, fg: '', lights: h.shaft(c, 130, 130, 260, 216, 70) };
    };

    // számlák, lakbér: sötét asztal, papírok, kis lámpa, eső az ablaknál
    S.bills = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        s += h.wall(c, '#d9d2e4', hz) + h.floor(c, '#b8a58c', hz);
        s += h.window(c, 36, 36, 84, 66, { view: 'city', curtain: false });
        if (c.time === 'rain') s += Stage.fx.rain(c, { n: 12 }).replace('<g aria-hidden="true">', '<g aria-hidden="true" clip-path="' + h.clip(c, 'bw', 39, 39, 78, 60) + '">');
        s += rect(150, 144, 220, 9, '#dcbd90', 'rx="3"') + rect(158, 152, 6, 66, '#c49e6c') + rect(356, 152, 6, 66, '#c49e6c');
        s += K.prop('receipt', 190, 144, 30, { noShadow: true }) + K.prop('memo', 238, 144, 28, { noShadow: true }) + K.prop('banknote', 286, 144, 26, { noShadow: true }) + K.prop('moneybag', 330, 144, 30, { noShadow: true });
        s += rect(200, 130, 22, 14, '#4a4060', 'rx="3"') + rect(203, 132, 16, 5, '#9fd6f5', 'rx="1" stroke="none"');
        s += h.lampShade(c, 352, 92, 1);
        return { bg: s, fg: '', lights: lampLight(c, 352, 120, 80) + h.shaft(c, 40, 104, 116, 200, 30, 0.18) };
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
