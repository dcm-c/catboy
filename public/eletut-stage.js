// =========================================================
// PASZTELL ÉLETÚT - eseménykép-rendező
//
// Minden esemény egy "felvétel" (shot): helyszín + napszak + szereplők + tárgyak + fények + élő részletek + kamera.
// A rendező rétegekből rakja össze a képet:
//   háttér (helyszín) → hátsó tárgyak → színezés (napszak) → szereplők → előtér → fények → részecskék → buborékok → vignetta
// Tiszta SVG-szöveget ad vissza (Node-ban is fut), az animáció csak CSS-ből jön (eletut.css: .stg-*).
//
// Felvétel (shot) mezői:
//   set: helyszín-azonosító (M.stage.sets)        time: day|morning|golden|dusk|night|overcast|rain|lamp|dark|indoor
//   o:   helyszín-beállítások (pl. {bed:true})
//   cast: [{ who, x, y, s, mood, pose, flip }]      who: 'me' | 'guest' | 'p:lilla' | NPC-kulcs | {saját kinézet}
//   props: [{ k, x, y, s, z:'front', flip, a: animáció }]       k: tárgy-azonosító (M.stage.props)
//   fx: ['leaves', ['rain', {n: 40}], ...]          fx: M.stage.fx
//   bubble: { at: 'me'|'guest'|index|[x,y], icon, side }         beszéd-/hangulatbuborék
//   cam: { x, y, z }                                kamera-közép és nagyítás
//   glow: [{ x, y, r, c, o }]                       fényfoltok
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var A = M.art;
    var K = A.kit;
    var Stage = M.stage = { sets: {}, props: {}, fx: {}, npcs: {}, shots: {} };

    var W = 400, H = 240;
    var n1 = K.n1;

    // ---------- Napszakok ----------
    // top/bot: az ég színe, grade: az egész képre kerülő színezés (a szereplőkre ennek a harmada), lamp: bekapcsolt lámpák
    var TIMES = {
        day: { top: '#8fd0f5', bot: '#e4f5fb', sun: '#fff3c4', grade: '', g: 0, lamp: false },
        morning: { top: '#a9d8f4', bot: '#ffe9cf', sun: '#ffe2b0', grade: 'rgba(255,205,150,.12)', g: 0.12, lamp: false },
        golden: { top: '#f2a98f', bot: '#ffe0a8', sun: '#ffd08a', grade: 'rgba(255,160,80,.17)', g: 0.17, lamp: false },
        dusk: { top: '#5d4a9c', bot: '#f4a3b6', sun: '#ffd1b0', grade: 'rgba(110,60,150,.22)', g: 0.22, lamp: true },
        night: { top: '#15163f', bot: '#3d2f78', sun: '#dfe6ff', grade: 'rgba(16,14,64,.42)', g: 0.42, lamp: true, stars: true },
        overcast: { top: '#8f9dbf', bot: '#c4cbdd', sun: '#e8ecf6', grade: 'rgba(70,80,120,.14)', g: 0.14, lamp: false },
        rain: { top: '#7482aa', bot: '#a6afca', sun: '#d6dcee', grade: 'rgba(45,55,100,.22)', g: 0.22, lamp: true },
        indoor: { top: '#8fd0f5', bot: '#e4f5fb', sun: '#fff3c4', grade: '', g: 0, lamp: false },
        lamp: { top: '#5d4a9c', bot: '#f4a3b6', sun: '#ffd1b0', grade: 'rgba(255,170,90,.13)', g: 0.13, lamp: true },
        dark: { top: '#15163f', bot: '#3d2f78', sun: '#dfe6ff', grade: 'rgba(18,16,70,.38)', g: 0.38, lamp: true, stars: true }
    };
    Stage.TIMES = TIMES;

    // ---------- Segédek ----------
    function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function mkrnd(seed) {
        var a = hashStr(String(seed)) || 1;
        return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    Stage.mkrnd = mkrnd;
    function stops(list) {
        return list.map(function (s, i) { return '<stop offset="' + (s[0] * 100).toFixed(0) + '%" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('');
    }
    // színátmenetek: a rendező egy listába gyűjti, a végén egyetlen <defs> lesz
    function lin(c, name, x1, y1, x2, y2, list) { c.defs.push('<linearGradient id="' + c.uid + name + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stops(list) + '</linearGradient>'); return 'url(#' + c.uid + name + ')'; }
    function rad(c, name, list, cx, cy, r) { c.defs.push('<radialGradient id="' + c.uid + name + '" cx="' + (cx === undefined ? 0.5 : cx) + '" cy="' + (cy === undefined ? 0.5 : cy) + '" r="' + (r === undefined ? 0.5 : r) + '">' + stops(list) + '</radialGradient>'); return 'url(#' + c.uid + name + ')'; }
    Stage.lin = lin; Stage.rad = rad;
    // fényfolt (nincs körvonala, nem takarja a rajzot, csak világít)
    function glowSpot(c, name, x, y, r, col, op) {
        var f = rad(c, name, [[0, col, op === undefined ? 0.55 : op], [1, col, 0]]);
        return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" pointer-events="none"/>';
    }
    Stage.glowSpot = glowSpot;
    // égbolt-sáv + nap/hold + csillagok + felhők (kültéri helyszínekhez és ablakokhoz)
    Stage.sky = function (c, x, y, w, h, o) {
        o = o || {};
        var t = c.t, s = '';
        var g = lin(c, 'sk' + (o.id || x + '_' + y), 0, 0, 0, 1, [[0, o.top || t.top], [1, o.bot || t.bot]]);
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + g + '"/>';
        if (t.stars && !o.noStars) {
            var r = mkrnd(c.uid + 'st' + x + y);
            for (var i = 0; i < Math.max(6, Math.round(w * h / 1500)); i++) s += '<circle cx="' + n1(x + r() * w) + '" cy="' + n1(y + r() * h * 0.8) + '" r="' + (r() > 0.8 ? 1.5 : 1) + '" fill="#fffbe6" opacity=".85" class="twinkle" style="animation-delay:' + (r() * 3).toFixed(2) + 's"/>';
        }
        if (!o.noSun) {
            var night = !!t.stars;
            var sx = x + w * (o.sunX === undefined ? 0.78 : o.sunX), sy = y + h * (o.sunY === undefined ? (c.time === 'dusk' || c.time === 'lamp' ? 0.62 : c.time === 'golden' ? 0.45 : 0.3) : o.sunY), sr = Math.min(w, h) * (o.sunR || 0.14);
            if (night) s += glowSpot(c, 'mo' + x + y, sx, sy, sr * 2.6, '#cfd8ff', 0.4) + K.prop('moon', sx, sy + sr, sr * 2.2, { noShadow: true });
            else if (c.time !== 'rain' && c.time !== 'overcast') s += glowSpot(c, 'su' + x + y, sx, sy, sr * 3.2, t.sun, 0.55) + K.prop('sun', sx, sy + sr, sr * 2.2, { noShadow: true });
        }
        if (!o.noClouds && c.time !== 'night' && c.time !== 'dark') {
            var rc = mkrnd(c.uid + 'cl' + x + y), n = Math.max(1, Math.round(w / 140));
            var sunSide = (o.sunX === undefined ? 0.78 : o.sunX) > 0.5 ? 0 : 1;
            for (var k = 0; k < n; k++) { var cxp = x + w * (sunSide ? 0.45 + 0.55 * (k + 0.5) / n : 0.55 * (k + 0.5) / n) + (rc() - 0.5) * 20; s += '<g class="stg-drift" style="animation-delay:-' + (rc() * 8).toFixed(1) + 's">' + K.prop('cloud', cxp, y + h * (0.28 + rc() * 0.3), 26 + rc() * 18, { noShadow: true }) + '</g>'; }
        }
        return s;
    };

    // ---------- Szereplők ----------
    function personLook(id) { return D.find(D.PEOPLE, id); }
    function castFigure(c, m, i) {
        var v = c.v, who = m.who, x = m.x === undefined ? 200 : m.x, y = m.y === undefined ? 226 : m.y, sc = m.s || 0.8;
        var o, look;
        if (who === 'me') {
            o = { skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, eyes: v.eyeStyle, outfit: v.outfit, colors: v.colors, patterns: v.patterns, makeup: v.makeup, mood: m.mood || v.emood || v.mood, uid: 'scme', fx: false, pose: m.pose || 'idle' };
        } else {
            var pid = who === 'guest' ? v.guest : (typeof who === 'string' && who.indexOf('p:') === 0 ? who.slice(2) : null);
            var p = pid ? personLook(pid) : null;
            if (p) look = Object.assign({}, p.look, { uid: 'g' + p.id });
            else if (typeof who === 'object') look = Object.assign({}, who, { uid: 'x' + i + (who.id || '') });
            else if (Stage.npcs[who]) look = Object.assign({ uid: 'n' + who }, Stage.npcs[who]);
            else if (K.NPC[who]) look = Object.assign({ uid: 'n' + who }, K.NPC[who]);
            else return '';
            o = Object.assign({}, look, { mood: m.mood || look.mood || 'neutral', pose: m.pose || 'idle', fx: false });
            if (!o.makeup) o.makeup = {};
        }
        var fig = K.figure(x, y, o, sc);
        if (m.flip) fig = '<g transform="translate(' + x + ' 0) scale(-1 1) translate(' + (-x) + ' 0)">' + fig + '</g>';
        return fig;
    }

    // ---------- Buborékok ----------
    var BUB = {
        heart: function () { return '<path d="M0 5 C-8 -1 -5 -8 0 -3.6 C5 -8 8 -1 0 5Z" fill="#f58fae" stroke="#fff" stroke-width="1"/>'; },
        excl: function () { return '<path d="M-1.8 -7 H1.8 L1.2 1.6 H-1.2Z" fill="#e4577a"/><circle cx="0" cy="5.4" r="1.9" fill="#e4577a"/>'; },
        ques: function () { return '<path d="M-4 -3.6 C-4 -8 4 -8 4 -3.4 C4 -.4 0 -.8 0 2.4" fill="none" stroke="#7a62c8" stroke-width="2.2" stroke-linecap="round"/><circle cx="0" cy="6" r="1.8" fill="#7a62c8"/>'; },
        dots: function () { return '<circle cx="-5.5" cy="0" r="2" fill="#8a7aa8"/><circle cx="0" cy="0" r="2" fill="#8a7aa8"/><circle cx="5.5" cy="0" r="2" fill="#8a7aa8"/>'; },
        note: function () { return '<path d="M-2 -7 L5 -9 V3" fill="none" stroke="#7a62c8" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="-3.4" cy="4.4" rx="3.2" ry="2.4" fill="#7a62c8"/><ellipse cx="3.6" cy="3" rx="3.2" ry="2.4" fill="#7a62c8"/>'; },
        star: function () { return '<path d="M0 -8 L2.4 -2.6 L8 -2 L3.8 1.8 L5 7.6 L0 4.6 L-5 7.6 L-3.8 1.8 L-8 -2 L-2.4 -2.6Z" fill="#ffd36b" stroke="#fff" stroke-width="1"/>'; },
        drop: function () { return '<path d="M0 -7 C6 0 6 6 0 6.4 C-6 6 -6 0 0 -7Z" fill="#8fc3ea" stroke="#fff" stroke-width="1"/>'; },
        zzz: function () { return '<path d="M-6 -6 H0 L-6 -1 H0 M2 0 H7 L2 5 H7" fill="none" stroke="#7f9fe0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'; },
        phone: function () { return '<rect x="-4" y="-7.5" width="8" height="15" rx="2" fill="#4a4060"/><rect x="-2.8" y="-5.6" width="5.6" height="9" rx="1" fill="#bfe3f8"/><circle cx="6" cy="-7" r="2.6" fill="#e4577a"/>'; },
        gift: function () { return '<rect x="-6" y="-2" width="12" height="9" rx="1.5" fill="#f5a9b8" stroke="#c2607a" stroke-width="1"/><rect x="-1.2" y="-2" width="2.4" height="9" fill="#ffd36b"/><path d="M0 -2 C-5 -8 -7 -2 0 -2 C7 -2 5 -8 0 -2Z" fill="#ffd36b" stroke="#c9972f" stroke-width=".8"/>'; },
        money: function () { return '<circle cx="0" cy="0" r="6.4" fill="#ffd36b" stroke="#c9972f" stroke-width="1.2"/><path d="M-2.6 -2.2 C0 -4.6 3 -3 2 -.6 C1 1.4 -2 .8 -2.4 3 C-1.6 5 1.6 4.6 2.8 2.4" fill="none" stroke="#9a6a14" stroke-width="1.4" stroke-linecap="round"/>'; },
        angry: function () { return '<path d="M-6 -4 L-1.4 -1.4 L-5 2 M6 -4 L1.4 -1.4 L5 2" fill="none" stroke="#e4577a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; },
        sparkle: function () { return '<path d="M0 -8 L1.8 -1.8 L8 0 L1.8 1.8 L0 8 L-1.8 1.8 L-8 0 L-1.8 -1.8Z" fill="#ffd36b" stroke="#fff" stroke-width=".9"/><path d="M6 -6 L6.8 -4 L8.8 -3.2 L6.8 -2.4 L6 -.4 L5.2 -2.4 L3.2 -3.2 L5.2 -4Z" fill="#f58fae"/>'; },
        chat: function () { return '<rect x="-7" y="-5.4" width="10" height="7" rx="3" fill="#c3adee"/><rect x="-3" y="-0.6" width="10" height="7" rx="3" fill="#f5a9b8"/>'; },
        light: function () { return '<path d="M0 -8 C5 -8 7 -3 4 0 C3 1.4 3 2.6 3 3.4 H-3 C-3 2.6 -3 1.4 -4 0 C-7 -3 -5 -8 0 -8Z" fill="#ffe08a" stroke="#c9972f" stroke-width="1"/><rect x="-2.6" y="4.6" width="5.2" height="2.4" rx="1" fill="#9a8a6a"/>'; },
        music: function () { return BUB.note(); }
    };
    Stage.BUBBLES = Object.keys(BUB);
    function bubble(c, b, centers) {
        var at = b.at, hx, hy;
        if (Array.isArray(at)) { hx = at[0]; hy = at[1]; }
        else {
            var m = centers[typeof at === 'number' ? at : (at === 'guest' ? centers.guestIdx : centers.meIdx)];
            if (!m) return '';
            hx = m.x + 18 * m.s; hy = m.y - 172 * m.s;
        }
        var side = b.side === 'l' ? -1 : 1;
        var bx = hx + side * 20 + (b.dx || 0), by = hy + (b.dy === undefined ? -6 : b.dy);
        var wd = b.wide ? 40 : 28, hd = 24;
        var body = 'M' + n1(bx - wd / 2 + 6) + ' ' + n1(by - hd / 2) + ' H' + n1(bx + wd / 2 - 6) + ' Q' + n1(bx + wd / 2) + ' ' + n1(by - hd / 2) + ' ' + n1(bx + wd / 2) + ' ' + n1(by - hd / 2 + 6) + ' V' + n1(by + hd / 2 - 6) + ' Q' + n1(bx + wd / 2) + ' ' + n1(by + hd / 2) + ' ' + n1(bx + wd / 2 - 6) + ' ' + n1(by + hd / 2) +
            ' H' + n1(bx - side * 2) + ' L' + n1(bx - side * 14) + ' ' + n1(by + hd / 2 + 9) + ' L' + n1(bx - side * 10) + ' ' + n1(by + hd / 2) + ' H' + n1(bx - wd / 2 + 6) + ' Q' + n1(bx - wd / 2) + ' ' + n1(by + hd / 2) + ' ' + n1(bx - wd / 2) + ' ' + n1(by + hd / 2 - 6) + ' V' + n1(by - hd / 2 + 6) + ' Q' + n1(bx - wd / 2) + ' ' + n1(by - hd / 2) + ' ' + n1(bx - wd / 2 + 6) + ' ' + n1(by - hd / 2) + 'Z';
        var ic = BUB[b.icon] ? BUB[b.icon]() : BUB.dots();
        return '<g class="stg-pop"><path d="' + body + '" fill="#ffffff" stroke="#8a7aa8" stroke-width="1.3" stroke-linejoin="round"/><g transform="translate(' + n1(bx) + ' ' + n1(by) + ') scale(.95)">' + ic + '</g></g>';
    }

    // ---------- Fő rendező ----------
    Stage.render = function (spec, v) {
        v = v || {};
        var timeKey = spec.time || 'day';
        var c = { uid: 'sg' + (spec.key || 'x') + '_', defs: [], t: TIMES[timeKey] || TIMES.day, time: timeKey, v: v, spec: spec, K: K, W: W, H: H };
        c.rnd = mkrnd(c.uid);
        var setFn = Stage.sets[spec.set] || Stage.sets.bedroom;
        var S = setFn(c, spec.o || {}) || { bg: '', fg: '' };
        var out = '';
        out += S.bg || '';
        // hátsó tárgyak
        var props = spec.props || [];
        props.forEach(function (p) { if (p.z !== 'front') out += propSvg(c, p); });
        // napszak-színezés
        var gr = c.t.grade;
        if (gr) out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + gr + '" pointer-events="none"/>';
        // lámpa-fények a színezés fölött (így világítanak éjjel is)
        if (S.lights) out += S.lights;
        // szereplők: hátulról előre (y szerint)
        var cast = (spec.cast || []).map(function (m, i) { return Object.assign({ i: i, x: 200, y: 226, s: 0.8 }, m); });
        var meIdx = -1, guestIdx = -1;
        cast.forEach(function (m, i) { if (m.who === 'me' && meIdx < 0) meIdx = i; if ((m.who === 'guest' || (typeof m.who === 'string' && m.who.indexOf('p:') === 0)) && guestIdx < 0) guestIdx = i; });
        var order = cast.slice().sort(function (a, b) { return (a.z || a.y) - (b.z || b.y); });
        order.forEach(function (m) { out += castFigure(c, m, m.i); });
        if (gr && c.t.g) out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + gr + '" opacity=".35" pointer-events="none"/>';
        // előtér
        props.forEach(function (p) { if (p.z === 'front') out += propSvg(c, p); });
        if (S.fg) out += S.fg;
        // fényfoltok
        (spec.glow || []).forEach(function (g, i) { out += glowSpot(c, 'gl' + i, g.x, g.y, g.r, g.c || '#fff4d0', g.o); });
        // részecskék
        (spec.fx || []).forEach(function (f, i) {
            var name = Array.isArray(f) ? f[0] : f, opt = Array.isArray(f) ? f[1] : {};
            if (Stage.fx[name]) out += Stage.fx[name](c, opt || {}, i);
        });
        // buborék
        var bl = spec.bubbles || (spec.bubble ? [spec.bubble] : []);
        var cen = castCenters(cast, meIdx, guestIdx);
        bl.forEach(function (b) { out += bubble(c, b, cen); });
        // kamera + vignetta
        var cam = spec.cam || {}, z = cam.z || 1, w = W / z, h = H / z;
        var cx = cam.x === undefined ? W / 2 : cam.x, cy = cam.y === undefined ? H / 2 : cam.y;
        var vx = Math.max(0, Math.min(W - w, cx - w / 2)), vy = Math.max(0, Math.min(H - h, cy - h / 2));
        var vg = rad(c, 'vg', [[0.6, '#3a2550', 0], [1, '#3a2550', c.t.stars ? 0.42 : 0.26]], 0.5, 0.5, 0.75);
        var vign = '<rect x="' + n1(vx) + '" y="' + n1(vy) + '" width="' + n1(w) + '" height="' + n1(h) + '" fill="' + vg + '" pointer-events="none"/>';
        var defs = '<defs>' + c.defs.join('') + '</defs>';
        return '<svg class="eletut-svg stg-scene" viewBox="' + n1(vx) + ' ' + n1(vy) + ' ' + n1(w) + ' ' + n1(h) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illusztráció">' + A.propDefs() + defs + out + vign + '</svg>';
    };
    function castCenters(cast, meIdx, guestIdx) {
        var o = { meIdx: meIdx, guestIdx: guestIdx };
        cast.forEach(function (m, i) { o[i] = m; });
        return o;
    }
    function propSvg(c, p) {
        var f = Stage.props[p.k];
        if (!f) return '';
        var s = f(c, Object.assign({ x: 200, y: 200, s: 1 }, p));
        if (p.a) s = '<g class="stg-' + p.a + '"' + (p.delay ? ' style="animation-delay:' + p.delay + 's"' : '') + '>' + s + '</g>';
        if (p.flip) s = '<g transform="translate(' + p.x + ' 0) scale(-1 1) translate(' + (-p.x) + ' 0)">' + s + '</g>';
        return s;
    }

    // ---------- Részecskék és élő részletek ----------
    function scatter(c, n, f) {
        var r = mkrnd(c.uid + 'sc' + n), s = '';
        for (var i = 0; i < n; i++) s += f(r, i);
        return s;
    }
    Stage.fx.leaves = function (c, o) {
        var cols = o.cols || ['#f2a35a', '#e7c35a', '#d9788a', '#9fcf7a'];
        return '<g class="stg-layer" aria-hidden="true">' + scatter(c, o.n || 9, function (r, i) {
            return '<g transform="translate(' + n1(20 + r() * 360) + ' ' + n1(-6 + r() * 30) + ') rotate(' + n1(r() * 360) + ')"><path class="stg-fall" style="--dx:' + n1((r() - 0.3) * 40) + 'px;animation-duration:' + n1(6 + r() * 5) + 's;animation-delay:-' + n1(r() * 9) + 's" d="M0 0 q4 -3 8 0 q-4 5 -8 0Z" fill="' + cols[i % cols.length] + '" opacity=".9"/></g>';
        }) + '</g>';
    };
    Stage.fx.petals = function (c, o) { return Stage.fx.leaves(c, Object.assign({ cols: ['#f9c6d4', '#fbd9e3', '#fff0f4'], n: 11 }, o)); };
    Stage.fx.snow = function (c, o) {
        return '<g class="stg-layer" aria-hidden="true">' + scatter(c, o.n || 22, function (r) {
            return '<g transform="translate(' + n1(r() * 400) + ' -4)"><circle class="stg-fall" style="--dx:' + n1((r() - 0.5) * 18) + 'px;animation-duration:' + n1(5 + r() * 5) + 's;animation-delay:-' + n1(r() * 9) + 's" r="' + n1(1 + r() * 1.4) + '" fill="#fff" opacity=".9"/></g>';
        }) + '</g>';
    };
    Stage.fx.rain = function (c, o) {
        var n = o.n || 46, s = '';
        for (var i = 0; i < n; i++) s += '<path class="rainl" d="M' + (6 + (i * 37) % 392) + ' ' + (4 + (i * 53) % 220) + ' l-5 14" stroke="#e6efff" stroke-width="1.1" stroke-linecap="round" opacity=".7" style="animation-delay:-' + ((i % 7) * 0.12).toFixed(2) + 's"/>';
        return '<g aria-hidden="true">' + s + '</g>';
    };
    Stage.fx.fireflies = function (c, o) {
        return '<g aria-hidden="true">' + scatter(c, o.n || 10, function (r) {
            var x = n1(20 + r() * 360), y = n1(o.y0 || 60 + r() * 110);
            return '<g class="stg-fly" style="animation-delay:-' + n1(r() * 6) + 's;animation-duration:' + n1(4 + r() * 4) + 's"><circle cx="' + x + '" cy="' + y + '" r="5" fill="#fff6b0" opacity=".25"/><circle cx="' + x + '" cy="' + y + '" r="1.6" fill="#fff6b0"/></g>';
        }) + '</g>';
    };
    Stage.fx.sparkles = function (c, o) {
        var x0 = o.x === undefined ? 200 : o.x, y0 = o.y === undefined ? 100 : o.y, sp = o.spread || 90;
        return '<g aria-hidden="true">' + scatter(c, o.n || 8, function (r) {
            return '<g transform="translate(' + n1(x0 + (r() - 0.5) * 2 * sp) + ' ' + n1(y0 + (r() - 0.5) * sp) + ') scale(' + n1(0.5 + r() * 0.7) + ')"><path class="stg-twk" style="animation-delay:-' + n1(r() * 3) + 's" d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3Z" fill="#fff6c0" stroke="#ffd36b" stroke-width=".6"/></g>';
        }) + '</g>';
    };
    Stage.fx.confetti = function (c, o) {
        var cols = ['#f5a9b8', '#9fd6f5', '#ffe08a', '#c3adee', '#a8e6c4'];
        return '<g class="stg-layer" aria-hidden="true">' + scatter(c, o.n || 26, function (r, i) {
            return '<g transform="translate(' + n1(r() * 400) + ' -6) rotate(' + n1(r() * 90) + ')"><rect class="stg-fall" style="--dx:' + n1((r() - 0.5) * 50) + 'px;animation-duration:' + n1(4 + r() * 4) + 's;animation-delay:-' + n1(r() * 8) + 's" width="' + n1(3 + r() * 3) + '" height="' + n1(2 + r() * 3) + '" fill="' + cols[i % cols.length] + '"/></g>';
        }) + '</g>';
    };
    Stage.fx.steam = function (c, o) {
        var x = o.x === undefined ? 200 : o.x, y = o.y === undefined ? 150 : o.y;
        return '<g aria-hidden="true">' + [0, 1, 2].map(function (i) {
            return '<path class="stg-rise" style="animation-delay:-' + (i * 0.9).toFixed(1) + 's" d="M' + (x + (i - 1) * 5) + ' ' + y + ' q-3 -5 0 -9 t0 -9" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>';
        }).join('') + '</g>';
    };
    Stage.fx.hearts = function (c, o) {
        var x0 = o.x === undefined ? 200 : o.x, y0 = o.y === undefined ? 120 : o.y;
        return '<g aria-hidden="true">' + scatter(c, o.n || 5, function (r) {
            return '<g transform="translate(' + n1(x0 + (r() - 0.5) * 70) + ' ' + n1(y0 + r() * 20) + ') scale(' + n1(0.8 + r() * 0.7) + ')"><path class="stg-rise" style="--dx:' + n1((r() - 0.5) * 20) + 'px;animation-delay:-' + n1(r() * 4) + 's" d="M0 3 C-5 -1 -3 -5 0 -2.4 C3 -5 5 -1 0 3Z" fill="#f58fae" stroke="#fff" stroke-width=".6"/></g>';
        }) + '</g>';
    };
    Stage.fx.notes = function (c, o) {
        var x0 = o.x === undefined ? 200 : o.x, y0 = o.y === undefined ? 120 : o.y;
        return '<g aria-hidden="true">' + scatter(c, o.n || 4, function (r) {
            return '<g class="stg-rise" style="--dx:' + n1((r() - 0.5) * 24) + 'px;animation-delay:-' + n1(r() * 4) + 's"><path transform="translate(' + n1(x0 + (r() - 0.5) * 60) + ' ' + n1(y0 + r() * 16) + ')" d="M0 0 V-9 L5 -10 V-1 M0 0 m-2.6 0 a2.6 2 0 1 0 5.2 0 a2.6 2 0 1 0 -5.2 0" fill="none" stroke="#7a62c8" stroke-width="1.5" stroke-linecap="round"/></g>';
        }) + '</g>';
    };
    Stage.fx.dust = function (c, o) {
        return '<g aria-hidden="true">' + scatter(c, o.n || 14, function (r) {
            return '<g transform="translate(' + n1(r() * 400) + ' ' + n1(60 + r() * 150) + ')"><circle class="stg-rise" style="--dx:' + n1((r() - 0.5) * 14) + 'px;animation-duration:' + n1(7 + r() * 6) + 's;animation-delay:-' + n1(r() * 9) + 's" r="' + n1(0.8 + r() * 0.8) + '" fill="#fff6d8" opacity=".6"/></g>';
        }) + '</g>';
    };
    Stage.fx.flash = function (c, o) {
        return '<rect class="stg-flash" x="0" y="0" width="400" height="240" fill="#ffffff" opacity="0" pointer-events="none"/>';
    };
    Stage.fx.bokeh = function (c, o) {
        var cols = o.cols || ['#ffe08a', '#f7a8c4', '#9fd6f5', '#c3adee'];
        return '<g aria-hidden="true">' + scatter(c, o.n || 9, function (r, i) {
            var rr = 6 + r() * 12;
            return '<circle class="stg-bokeh" style="animation-delay:-' + n1(r() * 5) + 's" cx="' + n1(r() * 400) + '" cy="' + n1(r() * 80 + (o.y0 || 0)) + '" r="' + n1(rr) + '" fill="' + cols[i % cols.length] + '" opacity=".22"/>';
        }) + '</g>';
    };

    // ---------- Közös helyszín-építők ----------
    var h = Stage.h = {};
    var rect = K.rect, circ = K.circ, ell = K.ell, path = K.path, line = K.line, flat = K.flat, shade = K.shade;
    h.clip = function (c, id, x, y, w, hh, r) {
        c.defs.push('<clipPath id="' + c.uid + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '"' + (r ? ' rx="' + r + '"' : '') + '/></clipPath>');
        return 'url(#' + c.uid + id + ')';
    };
    // fal: finom függőleges színátmenet + szegélylécek
    h.wall = function (c, col, hz, o) {
        o = o || {};
        var gr = lin(c, 'wl', 0, 0, 0, 1, [[0, shade(col, -0.07)], [0.7, col], [1, shade(col, 0.06)]]);
        var s = '<rect x="0" y="0" width="400" height="' + hz + '" fill="' + gr + '"/>';
        if (o.stripes) for (var i = 0; i < 20; i++) s += '<rect x="' + (i * 20 + 10) + '" y="0" width="10" height="' + hz + '" fill="' + shade(col, -0.04) + '" opacity=".5"/>';
        if (o.dots) { var r = mkrnd(c.uid + 'wd'); for (var j = 0; j < 40; j++) s += '<circle cx="' + n1(r() * 400) + '" cy="' + n1(r() * (hz - 30)) + '" r="1.6" fill="' + shade(col, 0.2) + '" opacity=".6"/>'; }
        s += flat(0, hz - 7, 400, 7, shade(col, 0.28)) + flat(0, hz - 8, 400, 1.2, shade(col, -0.18), 'opacity=".5"');
        return s;
    };
    // padló: deszkák vagy csempe, a távolság felé sötétedő
    h.floor = function (c, col, hz, o) {
        o = o || {};
        var gr = lin(c, 'fl', 0, 0, 0, 1, [[0, shade(col, -0.12)], [1, shade(col, 0.06)]]);
        var s = '<rect x="0" y="' + hz + '" width="400" height="' + (240 - hz) + '" fill="' + gr + '"/>';
        var rows = o.rows || 5, y = hz, step = 6;
        for (var i = 0; i < rows; i++) {
            y += step; step *= 1.32;
            s += '<path d="M0 ' + n1(y) + ' H400" stroke="' + shade(col, -0.2) + '" stroke-width="1" opacity=".4"/>';
            if (o.tile) for (var x = (i % 2) * 20; x < 400; x += 40) s += '<path d="M' + x + ' ' + n1(y) + ' l' + n1((x - 200) * 0.05) + ' ' + n1(step) + '" stroke="' + shade(col, -0.2) + '" stroke-width="1" opacity=".3"/>';
        }
        return s;
    };
    // ablak: égbolt-kitekintés, osztóléc, párkány, üvegfény, opcionális függöny és fénycsík (lights)
    h.window = function (c, x, y, w, hh, o) {
        o = o || {};
        var id = 'w' + Math.round(x) + Math.round(y);
        var cl = h.clip(c, id, x + 3, y + 3, w - 6, hh - 6);
        var s = rect(x - 3, y - 3, w + 6, hh + 6, '#fdf6fa', 'rx="3"') + '<g clip-path="' + cl + '">';
        s += Stage.sky(c, x + 3, y + 3, w - 6, hh - 6, { id: id, sunX: o.sunX, sunY: o.sunY, sunR: o.sunR || 0.2 });
        if (o.view === 'city' || o.view === undefined) {
            var r = mkrnd(c.uid + id), bx = x;
            while (bx < x + w) { var bw = 10 + r() * 14, bh = 14 + r() * (hh * 0.5); s += '<rect x="' + n1(bx) + '" y="' + n1(y + hh - 3 - bh) + '" width="' + n1(bw) + '" height="' + n1(bh) + '" fill="' + (c.t.stars ? '#2a2150' : '#b9b0d6') + '" opacity=".85"/>'; if (c.t.stars) for (var q = 0; q < 3; q++) if (r() > 0.4) s += '<rect x="' + n1(bx + 2 + (q % 2) * 5) + '" y="' + n1(y + hh - 3 - bh + 3 + Math.floor(q / 2) * 6) + '" width="3" height="3" fill="#ffe08a"/>'; bx += bw + 1; }
        } else if (o.view === 'trees') {
            s += '<ellipse cx="' + (x + w * 0.3) + '" cy="' + (y + hh) + '" rx="' + w * 0.35 + '" ry="' + hh * 0.3 + '" fill="' + (c.t.stars ? '#1f3a40' : '#8fcf8a') + '"/><ellipse cx="' + (x + w * 0.75) + '" cy="' + (y + hh) + '" rx="' + w * 0.3 + '" ry="' + hh * 0.38 + '" fill="' + (c.t.stars ? '#244a46' : '#7fc17c') + '"/>';
        }
        s += '</g>';
        s += '<path d="M' + (x + 6) + ' ' + (y + hh - 6) + ' L' + (x + 22) + ' ' + (y + 5) + ' H' + (x + 32) + ' L' + (x + 16) + ' ' + (y + hh - 6) + 'Z" fill="#fff" opacity=".18"/>';
        if (!o.open) s += flat(x + w / 2 - 1.4, y, 2.8, hh, '#fdf6fa') + (o.bars === false ? '' : flat(x, y + hh / 2 - 1.4, w, 2.8, '#fdf6fa'));
        s += rect(x - 6, y + hh + 1, w + 12, 5, '#f0e6f4', 'rx="2"');
        if (o.curtain) {
            var cc = o.curtain === true ? '#f6b5c5' : o.curtain;
            s += path('M' + (x - 10) + ' ' + (y - 8) + ' H' + (x + 14) + ' Q' + (x + 6) + ' ' + (y + hh * 0.5) + ' ' + (x + 16) + ' ' + (y + hh + 4) + ' H' + (x - 10) + 'Z', cc, 'stroke="none"') + path('M' + (x + w + 10) + ' ' + (y - 8) + ' H' + (x + w - 14) + ' Q' + (x + w - 6) + ' ' + (y + hh * 0.5) + ' ' + (x + w - 16) + ' ' + (y + hh + 4) + ' H' + (x + w + 10) + 'Z', cc, 'stroke="none"') + flat(x - 12, y - 10, w + 24, 3, shade(cc, -0.3));
            s += '<g class="stg-curtain">' + line('M' + (x + 1) + ' ' + (y - 4) + ' Q' + (x - 2) + ' ' + (y + hh / 2) + ' ' + (x + 4) + ' ' + (y + hh), shade(cc, -0.2), 1, 'opacity=".5"') + '</g>';
        }
        return s;
    };
    // fénycsík az ablakból a padlóra (a színezés fölé kerül)
    h.shaft = function (c, x1, y1, x2, y2, dx, op) {
        if (c.t.stars) return '';
        var col = c.time === 'golden' ? '#ffc880' : (c.time === 'dusk' ? '#ffb0a0' : '#fff4d0');
        var f = lin(c, 'sh' + Math.round(x1), 0, 0, 0, 1, [[0, col, op === undefined ? 0.32 : op], [1, col, 0.03]]);
        return '<path class="stg-shaft" d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y1 + ' L' + (x2 + dx) + ' ' + y2 + ' L' + (x1 + dx - (x2 - x1) * 0.2) + ' ' + y2 + 'Z" fill="' + f + '" pointer-events="none"/>';
    };
    h.lampShade = function (c, x, y, s, col) {
        s = s || 1; col = col || '#ffd9a0';
        var out = line('M' + x + ' ' + y + ' V' + (y + 34 * s), '#6a5a78', 2.2) + ell(x, y + 34 * s, 9 * s, 2.4 * s, '#6a5a78') + path('M' + (x - 10 * s) + ' ' + y + ' L' + (x - 5 * s) + ' ' + (y - 14 * s) + ' H' + (x + 5 * s) + ' L' + (x + 10 * s) + ' ' + y + 'Z', c.t.lamp ? '#fff0c0' : col);
        return out;
    };
    h.skyline = function (c, y, col, o) {
        o = o || {};
        var r = mkrnd(c.uid + 'sl' + y), x = o.x0 || 0, s = '';
        while (x < (o.x1 || 400)) {
            var bw = 22 + r() * 26, bh = (o.minH || 24) + r() * (o.maxH || 60);
            s += '<rect x="' + n1(x) + '" y="' + n1(y - bh) + '" width="' + n1(bw) + '" height="' + n1(bh + 40) + '" fill="' + col + '"/>';
            if (c.t.stars || c.t.lamp) for (var wy = y - bh + 6; wy < y - 4; wy += 9) for (var wx = x + 4; wx < x + bw - 6; wx += 8) if (r() > 0.55) s += '<rect x="' + n1(wx) + '" y="' + n1(wy) + '" width="3.6" height="4.6" fill="#ffe08a" opacity=".9"/>';
            x += bw + (r() > 0.7 ? 4 : 0);
        }
        return s;
    };

    // ---------- Nem-játékos szereplők (egyedi kinézet) ----------
    Stage.npcs.nagyi = { skin: 's1', hairStyle: 'bob', hairColor: 'feher', outfit: { top: 'bluz', bottom: 'szoknya', neck: 'gyongy', shoes: 'maryjane' }, colors: { top: '#e8c9d6', bottom: '#8e8aa8' }, mood: 'happy' };
    Stage.npcs.haziur = { skin: 's2', hairStyle: 'rovid', hairColor: 'feher', outfit: { top: 'polo', bottom: 'jogger', shoes: 'platform' }, colors: { top: '#9aa6b8', bottom: '#5a5a66' } };
    Stage.npcs.kisfiu = { skin: 's2', hairStyle: 'rovid', hairColor: 'szoke', outfit: { top: 'polo', bottom: 'rovid' }, colors: { top: '#ffd36b', bottom: '#8aa6d8' }, mood: 'happy' };
    Stage.npcs.idegen1 = { skin: 's3', hairStyle: 'bob', hairColor: 'fekete', outfit: { top: 'pulcsi', bottom: 'jogger' }, colors: { top: '#7aa0d6', bottom: '#4a4056' } };
    Stage.npcs.idegen2 = { skin: 's1', hairStyle: 'hosszu', hairColor: 'szoke', outfit: { top: 'bluz', bottom: 'szoknya' }, colors: { top: '#f2a3b6', bottom: '#6d7a98' } };
    Stage.npcs.kalauz = { skin: 's4', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'kabat', bottom: 'jogger', shoes: 'platform' }, colors: { top: '#3d4a78', bottom: '#2f3550' } };
    Stage.npcs.fonok = { skin: 's2', hairStyle: 'rovid', hairColor: 'barna', outfit: { top: 'kabat', bottom: 'jogger', shoes: 'platform' }, colors: { top: '#6a6a88', bottom: '#40405a' } };
    Stage.npcs.tini = { skin: 's3', hairStyle: 'bob', hairColor: 'lila', outfit: { top: 'pulcsi', bottom: 'jogger' }, colors: { top: '#8aa6d8', bottom: '#4a4056' }, mood: 'shy' };
    Stage.npcs.holdfeny = { skin: 's1', hairStyle: 'bob', hairColor: 'kek', outfit: { top: 'pulcsi', bottom: 'tenisz', hair: 'macskaful' }, colors: { top: '#c3adee', bottom: '#4a4056' }, mood: 'happy' };
    Stage.npcs.szomszed = { skin: 's2', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'pulcsi', bottom: 'jogger' }, colors: { top: '#8a9a78', bottom: '#4a4a58' }, mood: 'worried' };
    Stage.npcs.szobatars = { skin: 's4', hairStyle: 'rovid', hairColor: 'barna', outfit: { top: 'polo', bottom: 'jogger' }, colors: { top: '#a8c4a0', bottom: '#4a4056' } };
    Stage.npcs.kollega2 = { skin: 's1', hairStyle: 'hosszu', hairColor: 'barna', outfit: { top: 'bluz', bottom: 'szoknya' }, colors: { top: '#c9d7ee', bottom: '#4a4056' } };

    if (typeof module !== 'undefined' && module.exports) module.exports = Stage;
})(typeof globalThis !== 'undefined' ? globalThis : this);
