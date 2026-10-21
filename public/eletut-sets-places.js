// =========================================================
// PASZTELL ÉLETÚT - helyszínek: közösségi terek (iskola, turkáló, kávézó, iroda, kaszinó, con, színpad, könyvtár, vonat)
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var K = M.art.kit;
    var Stage = M.stage, S = Stage.sets, h = Stage.h, P = Stage.props;
    var rect = K.rect, circ = K.circ, ell = K.ell, path = K.path, line = K.line, flat = K.flat, shade = K.shade, n1 = K.n1;
    var mkrnd = Stage.mkrnd;

    function crowd(c, y, n, seed, sc, tint) {
        // háttér-sziluettek: fejek és vállak (a tömeg), nem teljes figurák
        var r = mkrnd(c.uid + seed), s = '';
        for (var i = 0; i < n; i++) {
            var x = 10 + (i + r() * 0.6) * (380 / n), hh = (18 + r() * 8) * sc;
            var col = tint || ['#5a4a78', '#6a5a88', '#4a3f68', '#7a6a98'][i % 4];
            s += '<path d="M' + n1(x - 12 * sc) + ' ' + y + ' Q' + n1(x - 12 * sc) + ' ' + n1(y - hh * 0.55) + ' ' + n1(x) + ' ' + n1(y - hh * 0.6) + ' Q' + n1(x + 12 * sc) + ' ' + n1(y - hh * 0.55) + ' ' + n1(x + 12 * sc) + ' ' + y + 'Z" fill="' + col + '"/>' + '<circle cx="' + n1(x) + '" cy="' + n1(y - hh * 0.8) + '" r="' + n1(7 * sc) + '" fill="' + shade(col, 0.1) + '"/>';
            if (r() > 0.6) s += '<path d="M' + n1(x - 7 * sc) + ' ' + n1(y - hh * 0.9) + ' l-3 -6 l6 2 l3 -3 l3 4Z" fill="' + shade(col, -0.1) + '"/>';
        }
        return s;
    }
    Stage.crowd = crowd;

    // iskola: o.v = 'class' | 'hall'
    S.school = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        if (o.v === 'hall') {
            s += h.wall(c, '#e9eef7', hz) + h.floor(c, '#c9c4d8', hz, { tile: true });
            s += P.lockers(c, { x: 14, y: 168, s: 1, n: 6 }) + P.lockers(c, { x: 246, y: 168, s: 1, n: 5 });
            s += h.window(c, 170, 50, 62, 80, { view: 'trees', curtain: false });
            s += rect(172, 10, 60, 18, '#f5a9b8', 'rx="3"') + rect(180, 16, 44, 4, '#fff', 'rx="2" stroke="none"');
            s += ell(200, 214, 150, 10, 'rgba(255,255,255,.18)', 'stroke="none"');
        } else {
            s += h.wall(c, '#f4efdc', hz) + h.floor(c, '#c9a878', hz);
            s += P.board(c, { x: 120, y: 30, w: 170, h: 78 });
            s += h.window(c, 310, 38, 66, 62, { view: 'trees', curtain: false });
            s += K.prop('calendar', 60, 90, 26, { noShadow: true }) + K.prop('alarm', 100, 70, 20, { noShadow: true });
            for (var i = 0; i < 3; i++) s += P.deskSchool(c, { x: 70 + i * 100, y: 214, s: 1.1 });
            s += rect(130, 108, 150, 4, '#a9743e', 'rx="1"');
            s += K.prop('books', 180, 106, 20, { noShadow: true });
        }
        return { bg: s, fg: '', lights: h.shaft(c, 316, 100, 372, 210, -50, 0.2) };
    };

    S.thrift = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        s += h.wall(c, '#fdeef2', hz, { stripes: true }) + h.floor(c, '#d6b28c', hz);
        // polc-sor a falon
        s += rect(14, 66, 120, 5, '#c49e6c', 'rx="2"') + rect(14, 100, 120, 5, '#c49e6c', 'rx="2"');
        ['tshirt', 'dress', 'teddy', 'crown', 'books', 'cactus'].forEach(function (k, i) { s += K.prop(k, 30 + i * 20, i < 3 ? 66 : 100, 22, { noShadow: true }); });
        ['plant', 'mirror', 'picture'].forEach(function (k, i) { s += K.prop(k, 38 + i * 38, i === 0 ? 100 : 66, 24, { noShadow: true }); });
        s += P.rack(c, { x: 270, y: 208, s: 1.05, w: 110, cols: o.cols });
        s += P.rack(c, { x: 150, y: 190, s: 0.85, w: 70, cols: ['#ffe08a', '#f5a9b8', '#9fd6f5', '#c3adee'] });
        s += rect(176, 18, 90, 18, '#fff', 'rx="4" stroke="#f5a9b8" stroke-width="2"') + rect(184, 24, 50, 5, '#f5a9b8', 'rx="2.5" stroke="none"') + K.prop('heart', 252, 33, 14, { noShadow: true });
        s += K.prop('mirror', 350, 130, 34, { noShadow: true });
        for (var i = 0; i < 5; i++) s += line('M' + (180 + i * 14) + ' 36 V46', '#c9b8d8', 1);
        return { bg: s, fg: '', lights: Stage.glowSpot(c, 'th', 200, 60, 140, '#fff0d0', 0.3) };
    };

    S.cafe = function (c, o) {
        o = o || {};
        var hz = 168, s = '';
        s += h.wall(c, '#f2e3d3', hz) + h.floor(c, '#c9a070', hz);
        s += h.window(c, 36, 30, 150, 96, { view: 'city', curtain: false, sunX: 0.8 });
        s += rect(190, 138, 200, 30, '#b98b5a', 'rx="2"') + rect(190, 134, 200, 6, '#dcbd90', 'rx="2"');
        // pult mögötti polc + gép
        s += rect(220, 50, 150, 4, '#a9743e') + ['coffee', 'teacup', 'cake', 'cupcake', 'cookie'].map(function (k, i) { return K.prop(k, 236 + i * 30, 50, 20, { noShadow: true }); }).join('');
        s += rect(300, 106, 40, 28, '#8a7aa8', 'rx="3"') + rect(306, 112, 12, 12, '#d8d0ee', 'rx="2" stroke="none"') + circ(328, 118, 3, '#f5a9b8', 'stroke="none"');
        s += K.prop('cake', 252, 134, 26, { noShadow: true }) + K.prop('cupcake', 280, 134, 18, { noShadow: true });
        // függőlámpák
        [90, 200, 310].forEach(function (x, i) { s += line('M' + x + ' 0 V' + (18 + (i % 2) * 6), '#6a5a78', 1.2) + path('M' + (x - 9) + ' ' + (28 + (i % 2) * 6) + ' L' + (x - 4) + ' ' + (16 + (i % 2) * 6) + ' H' + (x + 4) + ' L' + (x + 9) + ' ' + (28 + (i % 2) * 6) + 'Z', '#ffe9a8') + Stage.glowSpot(c, 'cf' + i, x, 38 + (i % 2) * 6, 34, '#ffe3a0', 0.5); });
        // kis kerek asztal két székkel
        s += K.gshadow(110, 220, 40, 0.14) + ell(110, 188, 36, 7, '#fdf6fa') + rect(107, 188, 6, 30, '#8a7a9a') + ell(110, 219, 16, 3, '#8a7a9a');
        s += K.prop('teacup', 98, 188, 16, { noShadow: true }) + K.prop('cake', 122, 188, 20, { noShadow: true });
        return { bg: s, fg: '', lights: h.shaft(c, 40, 126, 180, 220, 70, 0.25) };
    };

    S.office = function (c, o) {
        o = o || {};
        var hz = 168, s = '';
        s += h.wall(c, '#e9eef7', hz) + h.floor(c, '#b8b2cc', hz, { tile: true });
        s += h.window(c, 24, 28, 200, 100, { view: 'city', curtain: false, sunX: 0.8, bars: false });
        s += flat(124, 28, 2.8, 100, '#fdf6fa') + flat(74, 28, 2.8, 100, '#fdf6fa') + flat(174, 28, 2.8, 100, '#fdf6fa');
        // íróasztalok monitorral
        [[250, 0], [330, 1]].forEach(function (d) {
            s += rect(d[0] - 40, 150, 76, 6, '#d6b784', 'rx="2"') + rect(d[0] - 36, 156, 4, 52, '#a98a5e') + rect(d[0] + 28, 156, 4, 52, '#a98a5e') + rect(d[0] - 24, 118, 44, 30, '#4a4060', 'rx="3"') + rect(d[0] - 21, 121, 38, 22, d[1] ? '#c3adee' : '#9fd6f5', 'rx="2" class="scr" stroke="none"') + rect(d[0] - 4, 148, 8, 4, '#5a4e72');
        });
        s += K.prop('plant', 40, 208, 40, { noShadow: true }) + K.prop('plant', 372, 208, 34, { noShadow: true });
        s += rect(188, 142, 22, 66, '#9fd6f5', 'rx="6"') + rect(192, 132, 14, 12, '#d9f0fa', 'rx="3"') + circ(199, 138, 3, '#9fd6f5', 'stroke="none"');
        return { bg: s, fg: '', lights: h.shaft(c, 28, 128, 220, 214, 40, 0.22) };
    };

    S.casino = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        s += h.wall(c, '#2a1640', hz) + h.floor(c, '#4a1d4a', hz);
        for (var i = 0; i < 7; i++) s += '<path d="M' + (i * 60 - 10) + ' ' + hz + ' l' + (i * 60 - 190) * 0.12 + ' 70" stroke="#6a2a62" stroke-width="2" opacity=".5"/>';
        // játékgépek
        [[40, '#e4577a'], [130, '#7a62c8'], [250, '#ffb347'], [340, '#4fb3c9']].forEach(function (m, i) {
            s += rect(m[0] - 28, 60, 56, 110, '#3a2455', 'rx="6"') + rect(m[0] - 22, 70, 44, 40, '#15122a', 'rx="3"') + rect(m[0] - 22, 114, 44, 12, m[1], 'rx="3"');
            for (var k = 0; k < 3; k++) s += rect(m[0] - 20 + k * 14, 76, 12, 28, '#fdf6fa', 'rx="2" class="scr" stroke="none"') + K.prop('cherry', m[0] - 14 + k * 14, 98, 12, { noShadow: true });
            for (var q = 0; q < 6; q++) s += circ(m[0] - 24 + q * 9.6, 134, 2.2, ['#ffe08a', '#f58fae', '#9fd6f5'][(q + i) % 3], 'class="led" style="animation-delay:-' + (q * 0.4) + 's" stroke="none"');
            s += Stage.glowSpot(c, 'cs' + i, m[0], 92, 48, m[1], 0.32);
        });
        return { bg: s, fg: '', lights: '' };
    };

    // con: o.v = 'hall' (standok) | 'queue' | 'photo'
    S.con = function (c, o) {
        o = o || {};
        var hz = 168, s = '';
        s += h.wall(c, '#f3e6f4', hz) + h.floor(c, '#c9bde4', hz);
        s += K.bunting(10, 11);
        s += P.banner(c, { x: 200, y: 40, w: 150, s: 1.1 });
        // nézők a háttérben
        s += crowd(c, 160, 12, 'cr', 0.8);
        // standok: asztal + áru
        [[64, 0], [336, 1]].forEach(function (st) {
            s += rect(st[0] - 46, 150, 92, 6, '#d6b784', 'rx="2"') + rect(st[0] - 42, 156, 4, 52, '#a98a5e') + rect(st[0] + 38, 156, 4, 52, '#a98a5e');
            s += path('M' + (st[0] - 50) + ' 98 H' + (st[0] + 50) + ' L' + (st[0] + 44) + ' 118 H' + (st[0] - 44) + 'Z', st[1] ? '#9fd6f5' : '#f5a9b8') + K.prop(st[1] ? 'rainbowflag' : 'transflag', st[0], 98, 26, { noShadow: true });
            [-30, -8, 14, 34].forEach(function (dx, i) { s += K.prop(['teddy', 'tshirt', 'books', 'balloon'][(i + st[1] * 2) % 4], st[0] + dx, 150, 20, { noShadow: true }); });
        });
        s += rect(150, 120, 100, 2, '#8a7a9a') + ['tshirt', 'dress', 'tshirt'].map(function (k, i) { return K.prop(k, 170 + i * 30, 146, 24, { noShadow: true }); }).join('');
        s += P.stringlights(c, { x: 0, y: 60, x2: 400, y2: 60, sag: 6, n: 12 });
        return { bg: s, fg: '', lights: Stage.glowSpot(c, 'cn', 200, 40, 160, '#fff0d8', 0.3) };
    };

    // színpad: nézők a sötétben elöl, reflektor, függöny
    S.stage = function (c, o) {
        o = o || {};
        var hz = 176, s = '';
        s += flat(0, 0, 400, hz, '#2a1740') + flat(0, hz, 400, 64, '#3d2360');
        s += flat(0, hz - 6, 400, 6, '#5a3a8a') + rect(20, 188, 360, 10, '#6a4a98', 'rx="3"');
        s += P.curtains(c, { c: o.curtain || '#b8456a' });
        s += K.bunting(8, 9);
        s += P.banner(c, { x: 200, y: 34, w: 150, s: 1 });
        s += P.spotCone(c, { x: 130, y0: 0, y: 200, w: 56 }) + P.spotCone(c, { x: 270, y0: 0, y: 200, w: 56 });
        if (o.mic !== false) s += P.micstand(c, { x: 200, y: 196, s: 1 });
        var fg = '';
        if (o.audience !== false) fg += crowd(c, 252, 9, 'au', 1.2, '#1e1030');
        return { bg: s, fg: fg, lights: '' };
    };

    S.library = function (c, o) {
        o = o || {};
        var hz = 170, s = '';
        s += h.wall(c, '#f1e6d6', hz) + h.floor(c, '#b98e66', hz);
        var cols = ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a', '#a8e6c4', '#ffc9a6'];
        [[10, 24], [146, 24]].forEach(function (sh, k) {
            s += rect(sh[0], sh[1], 126, 126, '#c9a272', 'rx="3"');
            [0, 1, 2].forEach(function (r) {
                s += rect(sh[0] + 5, sh[1] + 6 + r * 40, 116, 34, '#a98258', 'stroke="none"');
                for (var i = 0; i < 10; i++) s += rect(sh[0] + 8 + i * 11, sh[1] + 10 + r * 40 + (i % 3), 8, 30 - (i % 3), cols[(i + r * 2 + k) % 6], 'rx="1"');
            });
        });
        s += h.window(c, 294, 30, 84, 66, { view: 'trees', curtain: false });
        s += K.deskSet(244, 152, 140, 222) + K.prop('books', 276, 152, 28, { noShadow: true }) + K.prop('laptop', 330, 152, 32, { noShadow: true }) + h.lampShade(c, 366, 106, 0.9, '#9fd6a0');
        s += rect(10, 150, 262, 6, '#8a6a4a');
        return { bg: s, fg: '', lights: h.shaft(c, 298, 98, 372, 210, -40, 0.24) + (c.t.lamp ? Stage.glowSpot(c, 'lb', 366, 130, 60, '#ffe3a0', 0.45) : '') };
    };

    // vonat: ablakokon át suhanó táj (o.v = 'stop' → áll)
    S.train = function (c, o) {
        o = o || {};
        var hz = 172, s = '';
        s += h.wall(c, '#e7edf7', hz) + h.floor(c, '#8e8aa8', hz);
        [30, 150, 270].forEach(function (x, i) {
            var id = 'tw' + i, cl = h.clip(c, id, x, 30, 100, 90, 6);
            s += rect(x - 3, 27, 106, 96, '#fdf6fa', 'rx="8"') + '<g clip-path="' + cl + '">' + Stage.sky(c, x, 30, 100, 90, { id: id, sunX: 0.7 });
            s += '<g class="' + (o.v === 'stop' ? '' : 'stg-scroll') + '">' + [0, 1, 2, 3].map(function (k) { return '<path d="M' + (x - 40 + k * 70) + ' 120 Q' + (x - 15 + k * 70) + ' 82 ' + (x + 20 + k * 70) + ' 120Z" fill="' + (c.t.stars ? '#1f3a40' : '#8fcf8a') + '"/>' + K.prop('tree', x - 20 + k * 70, 118, 22, { noShadow: true }); }).join('') + '</g></g>';
            s += rect(x - 3, 27, 106, 96, 'none', 'rx="8" stroke="#fdf6fa" stroke-width="5"') + path('M' + (x + 12) + ' 112 L' + (x + 28) + ' 34 H' + (x + 38) + ' L' + (x + 22) + ' 112Z', '#fff', 'stroke="none" opacity=".16"');
        });
        s += line('M0 22 H400', '#d9d2e6', 4) + [60, 160, 260, 360].map(function (x) { return line('M' + x + ' 22 v24 M' + (x - 7) + ' 46 h14', '#c9c0dc', 2.4); }).join('');
        s += rect(0, 128, 400, 6, '#9a8cb0', 'stroke="none"') + rect(14, 140, 100, 30, '#c3adee', 'rx="8"') + rect(286, 140, 100, 30, '#c3adee', 'rx="8"') + rect(14, 164, 100, 6, '#a98fc9', 'stroke="none"') + rect(286, 164, 100, 6, '#a98fc9', 'stroke="none"');
        return { bg: s, fg: '', lights: '' };
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
