// =========================================================
// PASZTELL ÉLETÚT - helyszínek: szabadtér (utca, park, tető, tengerpart, naplemente)
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var K = M.art.kit;
    var Stage = M.stage, S = Stage.sets, h = Stage.h, P = Stage.props;
    var rect = K.rect, circ = K.circ, ell = K.ell, path = K.path, line = K.line, flat = K.flat, shade = K.shade, n1 = K.n1;
    var mkrnd = Stage.mkrnd;

    function hills(c, y, col, amp, seed) {
        var r = mkrnd(c.uid + 'h' + seed), d = 'M0 ' + y, x = 0;
        while (x < 400) { var w = 60 + r() * 60; d += ' Q' + n1(x + w / 2) + ' ' + n1(y - amp * (0.5 + r() * 0.7)) + ' ' + n1(x + w) + ' ' + y; x += w; }
        return '<path d="' + d + ' V' + (y + 60) + ' H0Z" fill="' + col + '"/>';
    }
    function groundCol(c, day, night) { return c.t.stars ? night : day; }

    S.street = function (c, o) {
        o = o || {};
        var hz = 150, s = '';
        s += Stage.sky(c, 0, 0, 400, hz + 4, { sunX: 0.8, sunY: 0.34 });
        s += h.skyline(c, hz + 4, c.t.stars ? '#2a2150' : '#c9bfe0', { minH: 28, maxH: 46 });
        // pasztell épületek
        var cols = o.cols || ['#fbd5de', '#d6ecf8', '#f7e6b0', '#dcd0f2', '#d3efdc'], x = -6, i = 0, r = mkrnd(c.uid + 'bd');
        while (x < 400) {
            var bw = 70 + r() * 30, bh = 62 + r() * 24, col = cols[i % cols.length];
            s += rect(x, hz - bh + 20, bw, bh, col, 'rx="1"') + rect(x - 2, hz - bh + 16, bw + 4, 6, shade(col, -0.12), 'rx="1.5"');
            for (var wy = 0; wy < 2; wy++) for (var wx = 0; wx < 3; wx++) s += rect(x + 8 + wx * (bw - 16) / 3, hz - bh + 30 + wy * 22, (bw - 22) / 3, 14, c.t.lamp ? '#ffe9a8' : '#bfe3f8', 'rx="1.5"');
            // üzlet-bejárat + napellenző
            s += rect(x + bw * 0.3, hz - 18 + 20, bw * 0.4, 28, shade(col, -0.18), 'rx="1.5"') + path('M' + (x + bw * 0.26) + ' ' + (hz + 4) + ' H' + (x + bw * 0.74) + ' L' + (x + bw * 0.7) + ' ' + (hz - 6) + ' H' + (x + bw * 0.3) + 'Z', ['#f5a9b8', '#9fd6f5', '#c3adee'][i % 3]);
            x += bw + 2; i++;
        }
        // járda és út
        s += flat(0, hz + 22, 400, 10, groundCol(c, '#8f8aa6', '#3a3358')) + flat(0, hz + 22, 400, 2, groundCol(c, '#b9b3cf', '#5a5380')) + dashRoad(c, hz + 22);
        s += flat(0, hz + 32, 400, 240 - hz - 32, groundCol(c, '#d8d0e4', '#4a4270'));
        for (var k = 0; k < 6; k++) s += '<path d="M' + (k * 80 - 20) + ' ' + (hz + 32) + ' L' + (k * 80 - 60) + ' 240" stroke="' + groundCol(c, '#c2b9d4', '#3c3560') + '" stroke-width="1.2" opacity=".6"/>';
        s += P.lamppost(c, { x: 60, y: hz + 40, s: 1.15 }) + P.lamppost(c, { x: 340, y: hz + 40, s: 1.15 });
        s += K.prop('tree', 20, hz + 34, 60, {}) + K.prop('tree', 382, hz + 36, 56, {});
        if (o.tram) s += rect(60, hz - 2, 120, 32, '#f5a9b8', 'rx="6"') + [0, 1, 2].map(function (q) { return rect(70 + q * 36, hz + 4, 28, 14, '#bfe3f8', 'rx="3" stroke="none"'); }).join('');
        return { bg: s, fg: '', lights: '' };
    };
    function dashRoad(c, y) { return ''; }

    S.park = function (c, o) {
        o = o || {};
        var hz = 150, s = '';
        s += Stage.sky(c, 0, 0, 400, hz + 6, { sunX: 0.2, sunY: 0.28 });
        s += hills(c, hz, groundCol(c, '#b7dfa8', '#2a4a48'), 22, 1) + hills(c, hz + 12, groundCol(c, '#a2d596', '#244240'), 16, 2);
        s += K.prop('tree', 300, hz + 8, 52, { noShadow: true }) + K.prop('tree', 340, hz + 12, 44, { noShadow: true });
        s += flat(0, hz + 12, 400, 240 - hz - 12, groundCol(c, '#a9d99f', '#2f5550'));
        // ösvény
        s += '<path d="M120 240 Q170 200 220 186 Q300 168 400 176 V190 Q310 184 240 204 Q190 224 190 240Z" fill="' + groundCol(c, '#e8dcc4', '#5a5470') + '"/>';
        // tó
        s += ell(310, 214, 54, 12, groundCol(c, '#9fd6f5', '#3a5a9a')) + ell(306, 212, 38, 6, 'rgba(255,255,255,.5)', 'stroke="none"');
        s += P.bench(c, { x: 80, y: 196, s: 0.9 }) + K.prop('tree', 22, 206, 96, {}) + K.prop('tree', 378, 204, 92, {});
        s += K.prop('tulip', 150, 220, 22, { noShadow: true }) + K.prop('tulip', 166, 224, 18, { noShadow: true }) + K.prop('tulip', 340, 190, 16, { noShadow: true });
        return { bg: s, fg: '', lights: '' };
    };

    S.rooftop = function (c, o) {
        o = o || {};
        var s = '';
        s += Stage.sky(c, 0, 0, 400, 150, { sunX: 0.8, sunY: 0.3 });
        if (c.t.stars) s += Stage.glowSpot(c, 'rt', 320, 60, 100, '#8f8fff', 0.25);
        s += h.skyline(c, 168, c.t.stars ? '#241c4c' : (c.time === 'golden' ? '#8a5a78' : '#5a4a7e'), { minH: 30, maxH: 74 });
        s += h.skyline(c, 184, c.t.stars ? '#1a1440' : (c.time === 'golden' ? '#6a4268' : '#4a3a6e'), { minH: 10, maxH: 40, x0: 20 });
        s += flat(0, 196, 400, 44, groundCol(c, '#5a4a7e', '#2f2650')) + rect(30, 188, 340, 8, groundCol(c, '#8a7aa8', '#5a4a88'), 'rx="2"');
        s += P.stringlights(c, { x: 30, y: 150, x2: 370, y2: 150, sag: 10, n: 9 });
        s += rect(34, 150, 4, 40, '#6a5a98') + rect(362, 150, 4, 40, '#6a5a98');
        if (o.blanket) s += P.picnic(c, { x: 300, y: 224, s: 0.9 });
        if (o.telescope) s += P.telescope(c, { x: 80, y: 212, s: 1 });
        return { bg: s, fg: '', lights: '' };
    };
    S.sunset = function (c, o) { return S.rooftop(c, Object.assign({}, o)); };

    S.beach = function (c, o) {
        o = o || {};
        var hz = 120, s = '';
        s += Stage.sky(c, 0, 0, 400, hz, { sunX: 0.82, sunY: 0.3 });
        var sea = Stage.lin(c, 'sea', 0, 0, 0, 1, [[0, groundCol(c, '#5fb3e6', '#1f3a80')], [1, groundCol(c, '#9fd6f5', '#3a5ab0')]]);
        s += '<rect x="0" y="' + hz + '" width="400" height="60" fill="' + sea + '"/>';
        for (var i = 0; i < 5; i++) s += '<path class="stg-wave" style="animation-delay:-' + (i * 0.7) + 's" d="M' + (-20 + i * 70) + ' ' + (hz + 14 + (i % 3) * 10) + ' q10 -6 20 0 t20 0 t20 0" stroke="rgba(255,255,255,.7)" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
        s += '<path d="M0 ' + (hz + 52) + ' Q100 ' + (hz + 40) + ' 200 ' + (hz + 52) + ' T400 ' + (hz + 50) + ' V240 H0Z" fill="' + groundCol(c, '#f2e2b4', '#8a7a68') + '"/>';
        s += '<path d="M0 ' + (hz + 54) + ' Q100 ' + (hz + 42) + ' 200 ' + (hz + 54) + ' T400 ' + (hz + 52) + '" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>';
        s += '<ellipse cx="340" cy="214" rx="40" ry="6" fill="rgba(80,60,40,.12)"/>' + K.prop('rainbow', 0, 0, 0.1, { noShadow: true }) + '';
        s += rect(338, 150, 3, 66, '#a9743e') + path('M300 152 Q340 112 380 152 Q360 146 340 148 Q320 146 300 152Z', '#f5a9b8', 'stroke="#fff" stroke-width="1.4"');
        s += K.prop('icecream', 60, 226, 22, { noShadow: true }) + ell(40, 232, 8, 3, '#e8d49a', 'stroke="none"');
        return { bg: s, fg: '', lights: '' };
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
