// =========================================================
// PASZTELL ÉLETÚT - eseménykép-tárgyak
//
// Az eseményképek kellékei. Minden tárgy: function (c, p) → SVG, ahol p = { x, y (alja, közepe), s (méret-szorzó), ... }.
// Két fajta van: a Fluent Emoji készlet (assets) átméretezve, és kézzel rajzolt, részletesebb darabok.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var K = M.art.kit;
    var Stage = M.stage;
    var P = Stage.props;
    var rect = K.rect, circ = K.circ, ell = K.ell, path = K.path, line = K.line, flat = K.flat, gs = K.gshadow, shade = K.shade, n1 = K.n1;

    // Emoji-kellékek: [kulcs, szélesség, árnyék-erősség]
    [['cake', 30], ['gift', 24], ['icecream', 22], ['coffee', 18], ['teacup', 20], ['pizza', 24], ['cupcake', 20], ['boba', 20],
        ['books', 30], ['bouquet', 28], ['camera', 24], ['trophy', 26], ['medal', 20], ['balloon', 24], ['mic', 22], ['studiomic', 24],
        ['laptop', 32], ['pc', 36], ['phone', 18], ['headphone', 24], ['gamepad', 26], ['joystick', 24], ['keyboard', 34], ['scissors', 22],
        ['yarn', 22], ['pencil', 20], ['palette', 26], ['backpack', 28], ['envelope', 22], ['receipt', 22], ['memo', 22], ['moneybag', 26],
        ['banknote', 24], ['key', 18], ['clipboard', 24], ['calendar', 24], ['bulb', 20], ['plant', 30], ['cactus', 24], ['tulip', 20],
        ['cat', 34], ['blackcat', 30], ['teddy', 26], ['tshirt', 26], ['dress', 28], ['crown', 22], ['bell', 20], ['megaphone', 26],
        ['cherry', 18], ['cookie', 18], ['candy', 16], ['lollipop', 18], ['rainbow', 40], ['shark', 34], ['hedgehog', 24], ['package', 28],
        ['mirror', 30], ['picture', 30], ['newspaper', 26], ['glasses', 22], ['candle', 18], ['alarm', 22], ['die', 18], ['slot', 34],
        ['sparkles', 22], ['speech', 26], ['star', 22], ['heart', 20], ['tree', 70], ['pine', 70], ['crystal', 24], ['bank', 40], ['school', 50],
        ['house', 50], ['store', 46], ['dept', 56], ['truck', 50], ['cloud', 40], ['moon', 30], ['sun', 30], ['flag', 20], ['rainbowflag', 28],
        ['transflag', 28], ['battery', 18], ['door', 40], ['bed', 70], ['couch', 90], ['chair', 36], ['window', 50], ['page', 22], ['film', 22], ['lipstick', 20]].forEach(function (a) {
        P[a[0]] = function (c, p) { return K.prop(a[0], p.x, p.y, a[1] * p.s, { shadow: p.sh === undefined ? 0.14 : p.sh, noShadow: p.noShadow, flip: false }); };
    });

    function g(s, tr) { return '<g transform="' + tr + '">' + s + '</g>'; }
    // a tárgy helyi (0,0) = alsó közép; s méretezéssel
    function at(p, inner) { return g(inner, 'translate(' + p.x + ' ' + p.y + ') scale(' + p.s + ')'); }

    // ---------- Kézzel rajzolt tárgyak ----------
    P.cakeBig = function (c, p) {
        var s = gs(0, 0, 26, 0.16);
        s += rect(-24, -22, 48, 22, '#f5c9a0', 'rx="4"') + rect(-24, -22, 48, 8, '#fdf6fa', 'rx="4"') + rect(-22, -34, 44, 14, '#f5a9b8', 'rx="5"');
        s += path('M-22 -22 q4 8 8 0 q4 8 8 0 q4 8 8 0 q4 8 8 0 q4 8 8 0 q4 8 6 0', '#fdf6fa', 'stroke="none"');
        [-14, 0, 14].forEach(function (x, i) { s += rect(x - 1.6, -46, 3.2, 12, ['#9fd6f5', '#ffe08a', '#c3adee'][i], 'rx="1"') + '<path class="stg-flame" style="animation-delay:-' + (i * 0.4) + 's" d="M' + x + ' -54 q4 5 0 9 q-4 -4 0 -9Z" fill="#ffb347" stroke="#ff7a3c" stroke-width=".6"/>'; });
        return at(p, s);
    };
    P.giftBox = function (c, p) {
        var col = p.c || '#f5a9b8';
        var s = gs(0, 0, 18, 0.15) + rect(-16, -20, 32, 20, col, 'rx="2"') + rect(-18, -26, 36, 8, shade(col, 0.15), 'rx="2"') + rect(-3, -26, 6, 26, '#ffe08a', 'stroke="none"') +
            path('M0 -26 C-12 -40 -16 -26 0 -26 C16 -26 12 -40 0 -26Z', '#ffe08a');
        return at(p, s);
    };
    P.sewing = function (c, p) {
        var s = gs(0, 0, 30, 0.16);
        s += rect(-28, -8, 56, 8, '#a98fc9', 'rx="3"') + path('M-24 -8 V-30 Q-24 -42 -10 -42 H20 Q28 -42 28 -34 V-24 H18 V-30 H-10 V-8Z', '#d8c6ee');
        s += rect(15, -34, 6, 12, '#8a7aa8', 'rx="1.5"') + line('M18 -22 V-10', '#6a5a88', 1.4) + circ(-16, -33, 5, '#f5a9b8') + circ(-16, -33, 1.6, '#ffe0e8', 'stroke="none"');
        s += path('M-34 -9 L40 -9 L36 -3 L-30 -3Z', '#9fd6f5') + line('M-30 -6 H30', '#fff', 1, 'stroke-dasharray="3 3" opacity=".8"');
        return at(p, s);
    };
    P.tablet = function (c, p) {
        var s = gs(0, 0, 22, 0.14) + rect(-24, -30, 48, 30, '#4a4060', 'rx="4"') + rect(-21, -27, 42, 24, '#fdf6fa', 'rx="2" stroke="none"');
        s += path('M-18 -8 Q-8 -24 0 -12 T18 -10 V-5 H-18Z', '#c3adee', 'stroke="none"') + circ(8, -20, 4, '#ffe08a', 'stroke="none"') + path('M-18 -5 Q-6 -14 4 -6 T18 -5 V-4 H-18Z', '#f5a9b8', 'stroke="none"');
        s += line('M30 -4 L40 -22', '#6a5a88', 2.4) + circ(40.6, -23, 1.5, '#f5a9b8');
        return at(p, s);
    };
    P.easel = function (c, p) {
        var s = gs(0, 0, 24, 0.14) + line('M-18 0 L-4 -62 M18 0 L4 -62 M0 -4 V-64', '#a9743e', 3);
        s += rect(-22, -56, 44, 36, '#fdf6fa', 'rx="2"') + path('M-18 -28 Q-6 -46 2 -34 T18 -36 V-24 H-18Z', '#9fd6f5', 'stroke="none"') + circ(10, -48, 4, '#ffe08a', 'stroke="none"') + path('M-18 -24 Q-4 -34 8 -24 V-22 H-18Z', '#f5a9b8', 'stroke="none"');
        return at(p, s);
    };
    P.umbrella = function (c, p) {
        // p.y = a nyél alja; a kupola felette
        var col = p.c || '#f5a9b8';
        var s = line('M0 0 V-62', '#6a5a98', 2.4) + path('M-44 -60 Q0 -102 44 -60 Q22 -68 0 -62 Q-22 -68 -44 -60Z', col, 'stroke="#ffffff" stroke-width="1.6"') +
            line('M0 -84 V-62 M-22 -76 L-8 -63 M22 -76 L8 -63', '#fff', 1, 'opacity=".5"') + path('M-4 0 q0 5 5 5', 'none', 'stroke="#6a5a98" stroke-width="2.4" stroke-linecap="round"');
        return at(p, s);
    };
    P.dog = function (c, p) {
        var s = gs(0, 0, 22, 0.14);
        s += '<g class="stg-wag">' + path('M17 -18 q13 -6 8 -22', 'none', 'stroke="#c28f55" stroke-width="5" stroke-linecap="round"') + '</g>';
        s += ell(0, -14, 20, 11, '#d9a86c') + rect(-14, -9, 6, 9, '#c28f55', 'rx="2"') + rect(8, -9, 6, 9, '#c28f55', 'rx="2"');
        s += circ(-20, -26, 10, '#d9a86c') + path('M-27 -33 q-7 7 -3 15 q6 -2 7 -9Z', '#a9743e') + ell(-28, -22, 5.5, 4, '#f1d5a8') + circ(-31, -23, 1.7, '#4a3562', 'stroke="none"') + circ(-22, -28, 1.5, '#4a3562', 'stroke="none"');
        s += path('M-26 -17 q4 3 8 0', 'none', 'stroke="#d9546e" stroke-width="2.6" stroke-linecap="round"');
        return at(p, s);
    };
    P.wallet = function (c, p) {
        var s = gs(0, 0, 18, 0.14) + rect(-17, -22, 34, 22, '#8a5a4a', 'rx="4"') + rect(-17, -22, 34, 7, '#a9745f', 'rx="3" stroke="none"') + circ(11, -10, 2.4, '#ffe08a', 'stroke="none"');
        s += '<g transform="translate(-2 -22) rotate(-8)">' + rect(-8, -8, 18, 10, '#8fd0a4', 'rx="1.5"') + circ(1, -3, 2.6, '#e8f6ec', 'stroke="none"') + '</g>';
        return at(p, s);
    };
    P.box = function (c, p) {
        var s = gs(0, 0, 26, 0.16) + rect(-22, -26, 44, 26, '#d9ad78', 'rx="2"') + rect(-22, -26, 44, 6, '#c8975f', 'rx="2"') + rect(-5, -26, 10, 26, '#e8c99a', 'stroke="none"', '') + line('M-22 -14 H22', '#b88a56', 1);
        if (p.l) s += rect(-14, -18, 14, 8, '#fdf6fa', 'rx="1" stroke="none"') + line('M-12 -14 H-4', '#b8a8c8', 1);
        return at(p, s);
    };
    P.boxes = function (c, p) {
        return P.box(c, { x: p.x - 18 * p.s, y: p.y, s: p.s }) + P.box(c, { x: p.x + 20 * p.s, y: p.y, s: p.s * 0.9, l: true }) + P.box(c, { x: p.x + 1 * p.s, y: p.y - 24 * p.s, s: p.s * 0.8, l: true });
    };
    P.suitcase = function (c, p) {
        var col = p.c || '#9fd6f5';
        var s = gs(0, 0, 20, 0.15) + rect(-16, -34, 32, 34, col, 'rx="5"') + rect(-8, -40, 16, 7, 'none', 'rx="3" stroke="#6a5a88" stroke-width="2"') + line('M-6 -34 V0 M6 -34 V0', shade(col, -0.15), 1.6) + circ(-9, 1, 2, '#6a5a88', 'stroke="none"') + circ(9, 1, 2, '#6a5a88', 'stroke="none"');
        return at(p, s);
    };
    P.bench = function (c, p) {
        var s = gs(0, 0, 36, 0.14) + rect(-34, -32, 68, 5, '#b98b5a', 'rx="2"') + rect(-34, -24, 68, 5, '#c8975f', 'rx="2"') + rect(-34, -14, 68, 6, '#d9ad78', 'rx="2"') + rect(-30, -8, 5, 8, '#6a5a78') + rect(25, -8, 5, 8, '#6a5a78') + rect(-30, -32, 5, 18, '#6a5a78') + rect(25, -32, 5, 18, '#6a5a78');
        return at(p, s);
    };
    P.lamppost = function (c, p) {
        var s = gs(0, 0, 8, 0.14) + rect(-2, -70, 4, 70, '#5a4e72', 'rx="1.5"') + rect(-7, -78, 14, 10, '#3a2f55', 'rx="3"');
        s += rect(-5, -76, 10, 6, c.t.lamp ? '#ffe9a8' : '#cfc2e8', 'rx="2" stroke="none"');
        var out = at(p, s);
        if (c.t.lamp) out = Stage.glowSpot(c, 'lp' + Math.round(p.x), p.x, p.y - 70 * p.s, 46 * p.s, '#ffe9a8', 0.5) + out;
        return out;
    };
    P.signpost = function (c, p) {
        var s = gs(0, 0, 10, 0.14) + rect(-2, -54, 4, 54, '#8a6a4a') + rect(-20, -58, 40, 16, p.c || '#f5a9b8', 'rx="3"') + rect(-14, -53, 28, 3, '#fff', 'rx="1.5" stroke="none"') + rect(-10, -47, 20, 3, '#fff', 'rx="1.5" stroke="none" opacity=".7"');
        return at(p, s);
    };
    P.banner = function (c, p) {
        // p.x,p.y = a felső közép; p.w szélesség
        var w = (p.w || 100) * p.s, x0 = p.x - w / 2;
        var s = rect(x0, p.y, w, 22 * p.s, p.c || '#ffffff', 'rx="6" stroke="#f5a9b8" stroke-width="2.4"') + rect(x0 + 12, p.y + 7 * p.s, w * 0.55, 6 * p.s, '#f5a9b8', 'rx="3" stroke="none"') + rect(x0 + 12, p.y + 15 * p.s, w * 0.35, 3.4 * p.s, '#9fd6f5', 'rx="2" stroke="none"');
        return s + line('M' + (x0 + 10) + ' ' + p.y + ' V' + (p.y - 14), '#8a7a9a', 1.2) + line('M' + (x0 + w - 10) + ' ' + p.y + ' V' + (p.y - 14), '#8a7a9a', 1.2);
    };
    P.blanket = function (c, p) {
        var s = '<ellipse cx="0" cy="-4" rx="52" ry="12" fill="#f5a9b8" stroke="#c2607a" stroke-width=".9"/>';
        for (var i = -3; i <= 3; i++) s += line('M' + (i * 14) + ' -15 L' + (i * 12) + ' 6', 'rgba(255,255,255,.7)', 3);
        for (var j = -1; j <= 1; j++) s += line('M-48 ' + (-4 + j * 5) + ' H48', 'rgba(255,255,255,.55)', 2.2);
        return at(p, s);
    };
    P.picnic = function (c, p) { return P.blanket(c, p) + P.cupcake(c, { x: p.x - 18 * p.s, y: p.y - 6 * p.s, s: p.s * 0.8, noShadow: true }) + K.prop('cherry', p.x + 22 * p.s, p.y - 2 * p.s, 16 * p.s, { noShadow: true }) + K.prop('boba', p.x + 4 * p.s, p.y - 4 * p.s, 18 * p.s, { noShadow: true }); };
    P.telescope = function (c, p) {
        var s = gs(0, 0, 16, 0.14) + line('M0 0 L-12 -22 M0 0 L12 -22 M0 0 V-24', '#6a5a78', 2.4) + '<g transform="translate(0 -26) rotate(-32)">' + rect(-6, -34, 12, 34, '#c3adee', 'rx="3"') + rect(-7, -38, 14, 8, '#a98fc9', 'rx="2"') + rect(-4, -4, 8, 6, '#8a7aa8', 'rx="2"') + '</g>';
        return at(p, s);
    };
    P.stringlights = function (c, p) {
        // p.x,p.y: bal vég; p.x2,p.y2: jobb vég; belóg
        var x1 = p.x, y1 = p.y, x2 = p.x2 || 360, y2 = p.y2 || p.y, sag = p.sag || 14, s = '';
        s += line('M' + x1 + ' ' + y1 + ' Q' + (x1 + x2) / 2 + ' ' + ((y1 + y2) / 2 + sag * 2) + ' ' + x2 + ' ' + y2, '#cfc2e8', 1.3);
        var cols = ['#ffe08a', '#f7a8c4', '#9fd6f5'];
        for (var i = 0; i < (p.n || 7); i++) {
            var u = (i + 0.5) / (p.n || 7), x = x1 + (x2 - x1) * u, y = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * ((y1 + y2) / 2 + sag * 2) + u * u * y2;
            s += glowDot(c, x, y + 3, cols[i % 3], i);
        }
        return s;
    };
    function glowDot(c, x, y, col, i) {
        return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="7" fill="' + col + '" opacity=".22" class="led" style="animation-delay:-' + (i * 0.5) + 's"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="2.8" fill="' + col + '" stroke="#8a7a9a" stroke-width=".6" class="led" style="animation-delay:-' + (i * 0.5) + 's"/>';
    }
    // lebegő csevegőablak: p.v = 'chat' | 'alert' | 'call'
    P.chatwin = function (c, p) {
        var w = 74, h = 54, s = rect(-w / 2, -h, w, h, '#2f2a4d', 'rx="6" stroke="#8a7aa8" stroke-width="1.6"') + rect(-w / 2, -h, w, 9, '#403a68', 'rx="6" stroke="none"') + circ(-w / 2 + 6, -h + 4.5, 1.7, '#f58fae', 'stroke="none"') + circ(-w / 2 + 12, -h + 4.5, 1.7, '#ffd36b', 'stroke="none"') + circ(-w / 2 + 18, -h + 4.5, 1.7, '#a8e6c4', 'stroke="none"');
        var cols = ['#f5a9b8', '#9fd6f5', '#c3adee'];
        for (var i = 0; i < 3; i++) {
            s += circ(-w / 2 + 9, -h + 20 + i * 12, 4, cols[(i + (p.seed || 0)) % 3], 'stroke="none"') + rect(-w / 2 + 17, -h + 16 + i * 12, 24 + (i * 13 + (p.seed || 0) * 7) % 24, 4, '#d8d0ee', 'rx="2" stroke="none"') + rect(-w / 2 + 17, -h + 22.5 + i * 12, 16 + (i * 9) % 22, 3, '#8a7aa8', 'rx="1.5" stroke="none"');
        }
        if (p.v === 'alert') s += circ(w / 2 - 2, -h + 2, 7, '#e4577a', 'stroke="#fff" stroke-width="1.4"') + path('M' + (w / 2 - 3.4) + ' ' + (-h - 2) + ' h2.8 l-.5 5 h-1.8z', '#fff', 'stroke="none"') + circ(w / 2 - 2, -h + 6.4, 1, '#fff', 'stroke="none"');
        if (p.v === 'call') s += circ(w / 2 - 12, -10, 8, '#6fcf97', 'stroke="#fff" stroke-width="1.2"') + path('M' + (w / 2 - 15) + ' -12 q3 -3 6 0 l-1 3 q-1 1 -2 0 z', '#fff', 'stroke="none"');
        return at(p, s);
    };
    P.phoneBig = function (c, p) {
        var s = gs(0, 0, 18, 0.14) + rect(-14, -50, 28, 50, '#3a3358', 'rx="5"') + rect(-11.6, -46, 23.2, 40, p.v === 'dark' ? '#2a2548' : '#f6eefb', 'rx="2" stroke="none"');
        if (p.v === 'video') s += path('M-3 -32 l9 6 -9 6z', '#c3adee', 'stroke="none"') + rect(-9, -12, 18, 3, '#f5a9b8', 'rx="1.5" stroke="none"');
        else if (p.v === 'art') s += path('M-9 -12 Q-2 -34 4 -20 T9 -16 V-8 H-9Z', '#c3adee', 'stroke="none"') + circ(4, -36, 3, '#ffe08a', 'stroke="none"');
        else s += rect(-8, -40, 16, 4, '#9fd6f5', 'rx="2" stroke="none"') + rect(-8, -33, 12, 4, '#f5a9b8', 'rx="2" stroke="none"') + rect(-8, -26, 14, 4, '#c3adee', 'rx="2" stroke="none"');
        return at(p, s);
    };
    P.cupSteam = function (c, p) { return K.prop('coffee', p.x, p.y, 18 * p.s, { shadow: 0.12 }) + Stage.fx.steam(c, { x: p.x, y: p.y - 18 * p.s }); };
    P.cakeSlice = function (c, p) { return at(p, gs(0, 0, 14, 0.12) + path('M-12 0 V-12 L12 -16 V0Z', '#fdf6fa') + path('M-12 -12 L12 -16 L12 -22 L-12 -18Z', '#f5a9b8') + circ(6, -24, 3, '#e4577a')); };
    P.plate = function (c, p) { return at(p, gs(0, 0, 18, 0.12) + ell(0, -2, 17, 4.4, '#ffffff') + ell(0, -3, 11, 2.6, '#f3ecf8', 'stroke="none"')); };
    P.rack = function (c, p) {
        var cols = p.cols || ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a', '#a8e6c4', '#fdf6fa'];
        var w = (p.w || 100), s = gs(0, 0, w / 2, 0.14) + line('M-' + w / 2 + ' -62 H' + w / 2, '#8a7a9a', 2.6) + rect(-w / 2 - 2, -64, 4, 64, '#8a7a9a') + rect(w / 2 - 2, -64, 4, 64, '#8a7a9a');
        for (var i = 0; i < Math.floor(w / 14); i++) {
            var x = -w / 2 + 10 + i * 14, col = cols[i % cols.length];
            s += line('M' + x + ' -62 l0 -4', '#8a7a9a', 1.2) + path('M' + (x - 6) + ' -56 L' + x + ' -62 L' + (x + 6) + ' -56 V-30 Q' + x + ' -26 ' + (x - 6) + ' -30Z', col);
        }
        return at(p, s);
    };
    P.mannequin = function (c, p) {
        var s = gs(0, 0, 14, 0.14) + rect(-1.4, -50, 2.8, 50, '#8a7a9a') + ell(0, -2, 12, 3, '#8a7a9a') + path('M-12 -92 Q0 -98 12 -92 L10 -58 Q0 -52 -10 -58Z', p.c || '#f5a9b8') + circ(0, -102, 6, '#e8dcc4');
        return at(p, s);
    };
    P.laundry = function (c, p) {
        var s = gs(0, 0, 22, 0.14) + path('M-22 -24 L-18 0 H18 L22 -24Z', '#e8c99a') + line('M-20 -16 H20 M-19 -8 H19', '#c8975f', 1.2);
        s += path('M-16 -24 q4 -10 10 -4 q6 -8 12 0 q6 -6 10 4Z', '#f5a9b8') + path('M-4 -26 q6 -8 14 -2 q-2 6 -14 4Z', '#9fd6f5');
        return at(p, s);
    };
    P.spotCone = function (c, p) {
        var f = Stage.lin(c, 'sc' + Math.round(p.x), 0, 0, 0, 1, [[0, '#fff0c8', 0.55], [1, '#fff0c8', 0.04]]);
        return '<path d="M' + (p.x - 8) + ' ' + (p.y0 || 0) + ' L' + (p.x - (p.w || 50)) + ' ' + p.y + ' L' + (p.x + (p.w || 50)) + ' ' + p.y + ' L' + (p.x + 8) + ' ' + (p.y0 || 0) + 'Z" fill="' + f + '" pointer-events="none"/>';
    };
    P.curtains = function (c, p) {
        var col = p.c || '#b8456a';
        return path('M0 0 H78 Q46 120 0 176Z', col, 'stroke="none"') + path('M400 0 H322 Q354 120 400 176Z', col, 'stroke="none"') +
            line('M22 0 Q30 90 8 150 M46 0 Q50 90 28 160', shade(col, -0.2), 1.4, 'opacity=".5"') + line('M378 0 Q370 90 392 150 M354 0 Q350 90 372 160', shade(col, -0.2), 1.4, 'opacity=".5"') + rect(0, 0, 400, 8, shade(col, -0.25), 'stroke="none"');
    };
    P.micstand = function (c, p) { return at(p, gs(0, 0, 12, 0.14) + line('M0 0 V-54', '#5a4e72', 2.4) + ell(0, -1, 10, 2.4, '#5a4e72') + rect(-3.4, -66, 6.8, 14, '#8a7aa8', 'rx="3.4"') + line('M-3.4 -60 H3.4', '#5a4e72', .8)); };
    P.lockers = function (c, p) {
        var s = '', cols = ['#9fd6f5', '#c3adee', '#f5a9b8'];
        for (var i = 0; i < (p.n || 5); i++) { var x = p.x + i * 26 * p.s; s += rect(x, p.y - 96 * p.s, 24 * p.s, 96 * p.s, cols[i % 3], 'rx="2"') + line('M' + (x + 12 * p.s) + ' ' + (p.y - 90 * p.s) + ' V' + (p.y - 8 * p.s), shade(cols[i % 3], -0.2), 1) + rect(x + 16 * p.s, p.y - 52 * p.s, 3 * p.s, 8 * p.s, '#6a5a78', 'rx="1"'); }
        return s;
    };
    P.board = function (c, p) {
        // tábla (osztály): p.x,p.y bal-felső; w,h
        var w = p.w || 120, h = p.h || 60;
        return rect(p.x, p.y, w, h, '#3f6b5a', 'rx="3" stroke="#a9743e" stroke-width="3"') + line('M' + (p.x + 10) + ' ' + (p.y + 16) + ' H' + (p.x + w * 0.6) + ' M' + (p.x + 10) + ' ' + (p.y + 30) + ' H' + (p.x + w * 0.4) + ' M' + (p.x + 10) + ' ' + (p.y + 44) + ' H' + (p.x + w * 0.72), '#e8f0e8', 2, 'opacity=".8"');
    };
    P.deskSchool = function (c, p) { return at(p, gs(0, 0, 24, 0.12) + rect(-22, -30, 44, 5, '#d9ad78', 'rx="2"') + rect(-18, -25, 3, 25, '#8a7a9a') + rect(15, -25, 3, 25, '#8a7a9a')); };
    P.hangers = function (c, p) { return at(p, line('M-20 -6 H20', '#8a7a9a', 2) + [-14, 0, 14].map(function (x, i) { return path('M' + (x - 6) + ' -4 L' + x + ' -10 L' + (x + 6) + ' -4 V16 H' + (x - 6) + 'Z', ['#f5a9b8', '#9fd6f5', '#c3adee'][i]); }).join('')); };
    P.cookies = function (c, p) { return at(p, gs(0, 0, 20, 0.12) + ell(0, -3, 20, 5, '#e8c99a') + circ(-8, -8, 5, '#c8975f') + circ(4, -9, 5, '#c8975f') + circ(12, -6, 4.4, '#c8975f') + circ(-9, -9, 1, '#6a4a2a', 'stroke="none"') + circ(5, -10, 1, '#6a4a2a', 'stroke="none"')); };
    P.zine = function (c, p) { return at(p, gs(0, 0, 14, 0.12) + rect(-12, -22, 24, 30, '#fdf6fa', 'rx="2" transform="rotate(-6)"') + path('M-8 -16 Q0 -26 6 -14 T10 -10 V-4 H-8Z', '#c3adee', 'stroke="none" transform="rotate(-6)"') + circ(5, -20, 2.6, '#ffe08a', 'stroke="none"')); };
    P.photo = function (c, p) { return at(p, '<g transform="rotate(' + (p.rot || -6) + ')">' + rect(-12, -26, 24, 28, '#fdf6fa', 'rx="1.5"') + rect(-9.6, -23.6, 19.2, 19.2, p.c || '#9fd6f5', 'rx="1" stroke="none"') + circ(-2, -17, 3, '#ffe08a', 'stroke="none"') + path('M-9 -5 L-3 -12 L2 -7 L6 -10 L9 -5Z', '#8fd0a4', 'stroke="none"') + '</g>'); };
    P.tray = function (c, p) { return P.cookies(c, p); };
    P.pan = function (c, p) { return at(p, gs(0, 0, 22, 0.12) + ell(0, -3, 16, 4.4, '#6a6078') + rect(14, -6, 22, 4, '#4a4058', 'rx="2"') + ell(0, -5, 13, 3, '#8a7aa8', 'stroke="none"')) + Stage.fx.steam(c, { x: p.x, y: p.y - 8 * p.s }); };
    P.stove = function (c, p) { return at(p, gs(0, 0, 36, 0.14) + rect(-36, -40, 72, 40, '#e0d6ea', 'rx="3"') + rect(-30, -34, 60, 18, '#c3b8d6', 'rx="2" stroke="none"') + circ(-16, -44, 4, '#6a6078') + circ(16, -44, 4, '#6a6078') + circ(-16, -10, 2, '#8a7aa8', 'stroke="none"') + circ(16, -10, 2, '#8a7aa8', 'stroke="none"')); };
    P.pillow = function (c, p) { return at(p, ell(0, -8, 20, 9, p.c || '#fdf6fa') + line('M-12 -8 H12', 'rgba(0,0,0,.08)', 1)); };
    P.popcorn = function (c, p) { return at(p, gs(0, 0, 14, 0.12) + path('M-12 0 L-9 -22 H9 L12 0Z', '#e4577a') + line('M-4 0 L-3 -22 M4 0 L3 -22', '#fff', 2.4) + [-8, -2, 4, 9, -5, 5].map(function (x, i) { return circ(x, -26 - (i % 2) * 4, 4.4, '#fff3c4'); }).join('')); };
    P.notebook = function (c, p) { return at(p, gs(0, 0, 16, 0.12) + rect(-14, -6, 28, 6, '#c3adee', 'rx="2"') + rect(-12, -9, 24, 4, '#fdf6fa', 'rx="1.5"')); };
    P.headset = function (c, p) { return at(p, '<path d="M-14 -16 Q-14 -34 0 -34 Q14 -34 14 -16" fill="none" stroke="#6a5a88" stroke-width="3.4" stroke-linecap="round"/>' + rect(-18, -20, 8, 14, '#c3adee', 'rx="3"') + rect(10, -20, 8, 14, '#c3adee', 'rx="3"') + line('M-14 -6 Q-12 2 -2 2', '#6a5a88', 1.6)); };

    // Lámpa-fény: éjszakai szobákhoz (p.r sugár)
    P.lampGlow = function (c, p) { return Stage.glowSpot(c, 'lg' + Math.round(p.x) + Math.round(p.y), p.x, p.y, (p.r || 60) * p.s, p.c || '#ffe3a0', p.o === undefined ? 0.5 : p.o); };

    if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof globalThis !== 'undefined' ? globalThis : this);
