// =========================================================
// PASZTELL ÉLETÚT - grafika (SVG)
//
// Minden rajz kódból készül, kép nélkül: a karakter, a szoba, az események jelenetei és az ikonok.
// A függvények tiszta szöveget (SVG-markupot) adnak vissza, ezért Node-ban is futnak (képernyőképekhez).
// A karakter rétegekből áll: a viselt ruhák, kiegészítők és a hangulat mind látszanak rajta.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var A = M.art = {};

    var INK = '#3a2f45';
    var LINE = 'rgba(58,47,69,.38)';

    // ---------- Színek ----------
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    function toHex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
    // amt: -1 (fekete) ... 0 ... +1 (fehér)
    function shade(c, amt) {
        var a = hex(c);
        return toHex(a.map(function (v) { return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt; }));
    }
    A.shade = shade;
    function colorOf(list, id, fallback) {
        var f = D.find(list, id);
        return f ? f.color : fallback;
    }

    // ---------- Ikonok (24x24, vonalas) ----------
    var ICONS = {
        heart: '<path d="M12 21s-7-4.5-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6c-2.3 4.5-9.3 9-9.3 9z"/>',
        coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
        bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
        book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1z"/>',
        monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        shirt: '<path d="M8 3L3 6l2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
        house: '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
        briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
        users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 2 5 5"/>',
        star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
        lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        paw: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M7 17c0-3 3-5 5-5s5 2 5 5-2 3-5 3-5 0-5-3z"/>',
        dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
        trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M10 17h4"/>',
        calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
        play: '<path d="M7 4l13 8-13 8z"/>',
        pause: '<path d="M8 4v16M16 4v16"/>',
        ff: '<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z"/>',
        sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
        eyeoff: '<path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 8.5 4.5 9.5 6a16 16 0 0 1-3.2 3.7M6.2 7.7A16 16 0 0 0 2.5 12C3.5 13.5 7 18 12 18a9 9 0 0 0 3-.5"/>',
        eye: '<path d="M2.5 12C3.5 10.5 7 6 12 6s8.5 4.5 9.5 6c-1 1.5-4.5 6-9.5 6s-8.5-4.5-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
        tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3" fill="currentColor"/>',
        check: '<path d="M4 12l5 5 11-11"/>',
        x: '<path d="M5 5l14 14M19 5L5 19"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 14h18M12 9c-3 0-5-1-5-3s3-3 5 0c2-3 5-2 5 0s-2 3-5 3z"/>',
        save: '<path d="M5 3h12l4 4v14H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
        trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>'
    };
    A.icons = Object.keys(ICONS);
    A.sprite = function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
            Object.keys(ICONS).map(function (k) {
                return '<symbol id="i-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[k] + '</symbol>';
            }).join('') + '</defs></svg>';
    };
    A.icon = function (name, cls) {
        return '<svg class="ic ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
    };

    // ---------- Segédrajzolók ----------
    function rect(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function circ(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function ell(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function path(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    function line(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }

    // =========================================================
    // KARAKTER: külön fájlban él (eletut-char.js), itt csak a közös belépési pont
    // =========================================================
    A.avatar = function (o) { return M.char.avatar(o); };

    // Teljes figura egy külön SVG-ben (karakterkészítő, mini-portré)
    A.portrait = function (o, vb) { return M.char.portrait(o, vb); };

    // =========================================================
    // SZOBA
    // =========================================================
    var WALLS = { szulo: '#fde4ea', kolesz: '#e3e8f6', szoba: '#efe6f7', garzon: '#e3f2f0', lakas: '#fff1de' };
    var FLOORS = { szulo: '#e8c9a5', kolesz: '#d9c4a8', szoba: '#dcc3a4', garzon: '#cfd6c4', lakas: '#e6d2b4' };
    var SEASON_SKY = [
        ['#bfe3f8', '#e4f4fc'], // tavasz (március-május)
        ['#8fd0f5', '#d8f0fc'], // nyár
        ['#f7cfa6', '#fdecd8'], // ősz
        ['#cfd9ec', '#eef2fa']  // tél
    ];
    function seasonOf(monthIdx) {
        var m = (D.START_CALENDAR_MONTH + monthIdx) % 12;
        if (m >= 2 && m <= 4) return 0;
        if (m >= 5 && m <= 7) return 1;
        if (m >= 8 && m <= 10) return 2;
        return 3;
    }

    function monitorShape(x, y, w, h, glow, tag) {
        var s = '';
        s += rect(x, y, w, h, '#2b2538', 'rx="3"');
        s += rect(x + 3, y + 3, w - 6, h - 6, glow, 'rx="1.5" class="scr"');
        // képernyő tartalma: üzenetbuborékok
        s += rect(x + 7, y + 8, (w - 14) * 0.55, 4, 'rgba(255,255,255,.75)', 'rx="2"');
        s += rect(x + w - 7 - (w - 14) * 0.4, y + 16, (w - 14) * 0.4, 4, 'rgba(245,169,184,.95)', 'rx="2"');
        if (h > 30) s += rect(x + 7, y + 24, (w - 14) * 0.65, 4, 'rgba(255,255,255,.6)', 'rx="2"');
        s += rect(x + w / 2 - 3, y + h, 6, 8, '#3d3550');
        s += rect(x + w / 2 - 11, y + h + 7, 22, 3, '#3d3550', 'rx="1.5"');
        return '<g' + (tag ? ' class="' + tag + '"' : '') + '>' + s + '</g>';
    }

    function computerArt(tier, x, deskY) {
        var s = '';
        var glow = '#7fc8f0';
        var rgb = tier >= 3 ? ' class="rgb"' : '';
        if (tier === 0) {
            // régi bézs számítógép
            s += rect(x + 12, deskY - 52, 56, 46, '#e8dcc6', 'rx="4" stroke="#b9a98d" stroke-width="1.2"');
            s += rect(x + 17, deskY - 47, 46, 34, '#6d9ba8', 'rx="2" class="scr"');
            s += rect(x + 22, deskY - 40, 24, 3, 'rgba(255,255,255,.7)', 'rx="1.5"');
            s += rect(x + 33, deskY - 32, 24, 3, 'rgba(255,255,255,.5)', 'rx="1.5"');
            s += rect(x + 28, deskY - 8, 24, 4, '#c9b99a', 'rx="1"');
            s += rect(x + 4, deskY - 10, 44, 8, '#e8dcc6', 'rx="2" stroke="#b9a98d" stroke-width="1"');
            s += rect(x + 100, deskY - 40, 22, 38, '#e8dcc6', 'rx="3" stroke="#b9a98d" stroke-width="1.2"');
            s += rect(x + 104, deskY - 34, 14, 3, '#b9a98d');
            s += circ(x + 111, deskY - 12, 2, '#6bd09a');
        } else if (tier === 1) {
            s += path('M' + (x + 12) + ' ' + (deskY - 36) + ' h60 l4 36 h-68z', '#2b2538');
            s += rect(x + 17, deskY - 33, 50, 26, glow, 'rx="1.5" class="scr"');
            s += rect(x + 22, deskY - 28, 24, 3, 'rgba(255,255,255,.75)', 'rx="1.5"');
            s += rect(x + 36, deskY - 21, 24, 3, 'rgba(245,169,184,.95)', 'rx="1.5"');
            s += rect(x + 6, deskY - 4, 72, 4, '#b8b4c8', 'rx="2"');
        } else if (tier === 2) {
            s += monitorShape(x + 10, deskY - 62, 64, 44, glow);
            s += rect(x + 96, deskY - 42, 20, 40, '#3d3550', 'rx="3"');
            s += circ(x + 106, deskY - 34, 2, '#6bd09a');
            s += rect(x + 14, deskY - 7, 52, 5, '#d8d2e6', 'rx="2"');
        } else if (tier === 3) {
            s += monitorShape(x + 6, deskY - 70, 78, 50, '#8a6fe0', rgb ? 'rgb' : '');
            s += rect(x + 96, deskY - 48, 24, 46, '#2b2538', 'rx="3"');
            s += rect(x + 100, deskY - 44, 16, 38, 'rgba(138,111,224,.35)', 'rx="2" class="rgb"');
            s += rect(x + 12, deskY - 8, 60, 6, '#2b2538', 'rx="2"');
            s += rect(x + 12, deskY - 8, 60, 2, '#f5a9b8', 'rx="1" class="rgb"');
        } else if (tier === 4) {
            s += monitorShape(x + 0, deskY - 66, 62, 42, '#7fc8f0');
            s += monitorShape(x + 64, deskY - 66, 62, 42, '#8a6fe0', 'rgb');
            s += path('M' + (x + 52) + ' ' + (deskY - 10) + ' a16 16 0 0 1 32 0', 'none', 'stroke="#2b2538" stroke-width="3"');
            s += rect(x + 48, deskY - 12, 7, 11, '#f5a9b8', 'rx="2"');
            s += rect(x + 81, deskY - 12, 7, 11, '#f5a9b8', 'rx="2"');
        } else if (tier === 5) {
            s += monitorShape(x - 4, deskY - 66, 60, 42, '#7fc8f0');
            s += monitorShape(x + 58, deskY - 66, 60, 42, '#8a6fe0', 'rgb');
            s += circ(x + 134, deskY - 70, 14, 'rgba(255,248,230,.9)', 'stroke="#f5d9a0" stroke-width="4"');
            s += rect(x + 133, deskY - 56, 3, 56, '#3d3550');
            s += circ(x + 134, deskY - 70, 5, '#2b2538');
            s += rect(x + 118, deskY - 28, 3, 28, '#3d3550');
            s += rect(x + 114, deskY - 36, 11, 10, '#2b2538', 'rx="5"');
        } else {
            s += monitorShape(x - 12, deskY - 62, 52, 40, '#7fc8f0');
            s += monitorShape(x + 40, deskY - 76, 56, 50, '#8a6fe0', 'rgb');
            s += monitorShape(x + 98, deskY - 62, 52, 40, '#f5a9b8');
            s += rect(x + 156, deskY - 40, 18, 38, '#2b2538', 'rx="3"');
            s += rect(x + 159, deskY - 36, 12, 30, 'rgba(95,225,235,.5)', 'rx="2" class="rgb"');
            s += circ(x + 152, deskY - 12, 5, '#3d3550');
        }
        return s;
    }

    function catArt(x, y) {
        var s = '';
        s += path('M' + (x + 26) + ' ' + (y + 6) + ' q14 -2 10 -18', 'none', 'stroke="#e8a15c" stroke-width="5" stroke-linecap="round"');
        s += ell(x + 12, y, 17, 13, '#f0b673');
        s += circ(x - 2, y - 14, 10, '#f0b673');
        s += path('M' + (x - 10) + ' ' + (y - 21) + ' l3 -9 l6 6z', '#f0b673');
        s += path('M' + (x + 6) + ' ' + (y - 21) + ' l-3 -9 l-6 6z', '#f0b673');
        s += circ(x - 5, y - 15, 1.5, INK) + circ(x + 2, y - 15, 1.5, INK);
        s += path('M' + (x - 3) + ' ' + (y - 11) + ' h2 l-1 1.5z', '#e58aa3');
        s += line('M' + (x + 4) + ' ' + (y - 6) + ' v10M' + (x + 10) + ' ' + (y - 6) + ' v10M' + (x + 16) + ' ' + (y - 6) + ' v10', '#e8a15c', 1.6);
        return '<g class="cat">' + s + '</g>';
    }

    // v: { housing, comp, decor:{}, pets:{}, outfit:{}, skin, hairStyle, hairColor, mood, scale, month, studying, working, broken }
    A.room = function (v) {
        var h = v.housing || 'szulo';
        var decor = v.decor || {};
        var out = [];
        var wall = WALLS[h] || WALLS.szulo;
        var sky = SEASON_SKY[seasonOf(v.month || 0)];
        var big = h === 'lakas';

        out.push('<defs><linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient>');
        out.push('<linearGradient id="rm-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(wall, 0.25) + '"/><stop offset="1" stop-color="' + wall + '"/></linearGradient></defs>');
        out.push(rect(0, 0, 400, 232, 'url(#rm-wall)'));
        out.push(rect(0, 224, 400, 10, shade(wall, -0.1)));
        out.push(rect(0, 234, 400, 66, FLOORS[h] || FLOORS.szulo));
        for (var p = 0; p < 6; p++) out.push(line('M0 ' + (244 + p * 11) + ' H400', shade(FLOORS[h] || FLOORS.szulo, -0.1), 1, 'opacity=".55"'));
        out.push(rect(0, 234, 400, 6, 'rgba(0,0,0,.06)'));

        // ablak
        var wx = big ? 228 : 258, wy = big ? 26 : 38, ww = big ? 132 : 88, wh = big ? 128 : 100;
        out.push(rect(wx - 5, wy - 5, ww + 10, wh + 10, '#fff', 'rx="5"'));
        out.push(rect(wx, wy, ww, wh, 'url(#rm-sky)', 'rx="2"'));
        out.push(ell(wx + ww * 0.3, wy + wh * 0.55, 20, 9, 'rgba(255,255,255,.8)'));
        out.push(ell(wx + ww * 0.45, wy + wh * 0.5, 15, 8, 'rgba(255,255,255,.8)'));
        var si = seasonOf(v.month || 0);
        out.push(circ(wx + ww * 0.8, wy + 22, 9, si === 3 ? '#f4f1ff' : '#ffe9a6', 'opacity=".95"'));
        if (si === 2) out.push(path('M' + (wx + 10) + ' ' + (wy + wh) + ' q10 -26 22 -10 q8 -14 20 4 q12 -10 24 6 v' + 0 + 'z', '#e9a15a', 'opacity=".55"'));
        out.push(rect(wx + ww / 2 - 1.5, wy, 3, wh, '#fff'));
        if (!big) out.push(rect(wx, wy + wh / 2 - 1.5, ww, 3, '#fff'));
        out.push(path('M' + (wx - 8) + ' ' + (wy - 4) + ' h14 v' + (wh + 6) + ' q-7 -6 -14 0z', '#f6c9d6', 'opacity=".9"'));
        out.push(path('M' + (wx + ww + 8) + ' ' + (wy - 4) + ' h-14 v' + (wh + 6) + ' q7 -6 14 0z', '#f6c9d6', 'opacity=".9"'));

        // lakás-specifikus bútorok
        if (h === 'szulo') {
            // családi fotók
            [0, 1, 2].forEach(function (i) {
                out.push(rect(180 + i * 22, 60 + (i % 2) * 4, 16, 20, '#fff', 'stroke="#e0c9a8" stroke-width="2"'));
                out.push(circ(188 + i * 22, 68 + (i % 2) * 4, 4, '#f4c9a8'));
                out.push(path('M' + (182 + i * 22) + ' ' + (78 + (i % 2) * 4) + ' q6 -8 12 0z', '#a9cdee'));
            });
        } else if (h === 'kolesz') {
            out.push(rect(178, 52, 52, 38, '#c9a97c', 'rx="2"'));
            [0, 1, 2].forEach(function (i) { out.push(rect(184 + i * 15, 58 + (i % 2) * 8, 11, 14, ['#f6b5c5', '#fdf6fa', '#bfe3f8'][i], 'rx="1"')); out.push(circ(189.5 + i * 15, 58 + (i % 2) * 8, 1.4, '#e05a7a')); });
        } else if (h === 'szoba') {
            out.push(rect(362, 90, 36, 142, '#d6c4b0', 'rx="3"'));
            out.push(line('M380 92 V230', '#b8a58f', 1.4));
            out.push(circ(376, 160, 1.6, '#8a7560') + circ(384, 160, 1.6, '#8a7560'));
        } else if (h === 'garzon') {
            out.push(rect(350, 156, 50, 14, '#e8e2f2', 'rx="2"'));
            out.push(rect(350, 170, 50, 62, '#d7cfe8'));
            out.push(rect(356, 138, 14, 18, '#f5a9b8', 'rx="3"'));
            out.push(rect(372, 142, 14, 14, '#9fd6f5', 'rx="3"'));
        } else if (big) {
            out.push(rect(0, 176, 24, 56, '#d9c3a0', 'rx="2"'));
            [0, 1, 2].forEach(function (i) { out.push(rect(3, 182 + i * 16, 18, 12, ['#f6b5c5', '#bfe3f8', '#fdf6fa'][i], 'rx="1"')); });
            out.push(rect(364, 130, 3, 100, '#bfae98'));
            out.push(path('M352 130 h27 l-5 -22 h-17z', '#fff4d6', 'stroke="#ecd9a8" stroke-width="1.5"'));
        }

        // dekoráció
        if (decor.lights) {
            out.push(line('M0 10 Q50 34 100 10 T200 10 T300 10 T400 10', '#9a86b8', 1.2));
            for (var l = 0; l < 14; l++) {
                var lx = l * 30 + 8;
                var ly = 10 + Math.sin(l * 1.57) * 10 + 8;
                out.push(circ(lx, ly.toFixed(1), 3.2, ['#ffe08a', '#f7a8c4', '#9fd6f5'][l % 3], 'class="twinkle" style="animation-delay:' + (l * 0.2) + 's"'));
            }
        }
        if (decor.poszter) {
            out.push(rect(24, 24, 36, 48, '#f5a9b8', 'rx="2" stroke="#fff" stroke-width="3"') + path('M42 38 l4 8 9 1.2 -6.6 6.2 1.8 9 -8.2 -4.4 -8.2 4.4 1.8 -9 -6.6 -6.2 9 -1.2z', '#fff'));
            out.push(rect(70, 30, 34, 44, '#9fd6f5', 'rx="2" stroke="#fff" stroke-width="3"') + circ(87, 48, 9, '#fff') + path('M76 70 q11 -16 22 0z', '#fff', 'opacity=".8"'));
            out.push(rect(112, 22, 28, 38, '#c3adee', 'rx="2" stroke="#fff" stroke-width="3"') + path('M126 32 l5 9 h-10z M126 52 l5 -9 h-10z', '#fff', 'opacity=".9"'));
        }
        if (decor.zaszlo) {
            var fx = 150, fy = 18;
            var cols = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'];
            out.push('<g transform="rotate(-3 ' + fx + ' ' + fy + ')">');
            cols.forEach(function (c, i) { out.push(rect(fx, fy + i * 7, 56, 7, c)); });
            out.push(line('M' + fx + ' ' + (fy - 2) + ' V' + (fy + 40), '#8a7a60', 2));
            out.push('</g>');
        }
        if (decor.polc) {
            out.push(rect(150, 76, 88, 6, '#d9c3a0', 'rx="2"'));
            out.push(rect(158, 56, 10, 20, '#f5a9b8', 'rx="4"') + circ(163, 52, 7, '#fdf6fa'));
            out.push(rect(178, 62, 12, 14, '#9fd6f5', 'rx="3"') + circ(184, 58, 5, '#fdf6fa'));
            out.push(rect(200, 54, 9, 22, '#c3adee', 'rx="3"') + circ(204.5, 50, 6, '#f7d26a'));
            out.push(path('M218 76 q6 -20 12 0z', '#7cc78e'));
        }
        if (decor.tukor) {
            out.push(rect(150, 96, 36, 134, '#d6cfe6', 'rx="6"'));
            out.push(rect(154, 100, 28, 126, '#eaf5fb', 'rx="4"'));
            out.push(path('M156 112 l22 -8 v10 l-22 8z', 'rgba(255,255,255,.7)'));
            out.push(path('M156 150 l22 -16 v8 l-22 16z', 'rgba(255,255,255,.45)'));
        }

        // asztal és gép
        var deskY = 176;
        out.push(rect(8, deskY, 142, 8, '#d9b98c', 'rx="2"'));
        out.push(rect(14, deskY + 8, 6, 56, '#c49e6c'));
        out.push(rect(138, deskY + 8, 6, 56, '#c49e6c'));
        out.push(rect(100, deskY + 8, 38, 34, '#cfab7a', 'rx="2"') + circ(119, deskY + 26, 2.4, '#8a6c46'));
        if (v.broken) {
            out.push(rect(34, deskY - 52, 70, 46, '#2b2538', 'rx="3"'));
            out.push(path('M48 ' + (deskY - 40) + ' l40 24 M88 ' + (deskY - 40) + ' l-40 24', 'none', 'stroke="#f5a9b8" stroke-width="3" stroke-linecap="round"'));
        } else out.push(computerArt(v.comp || 0, 14, deskY));
        if (v.studying) {
            out.push(rect(124, deskY - 14, 22, 5, '#f5a9b8', 'rx="1.5"') + rect(126, deskY - 19, 20, 5, '#9fd6f5', 'rx="1.5"') + rect(124, deskY - 24, 22, 5, '#c3adee', 'rx="1.5"'));
        }
        if (v.working) {
            out.push(rect(112, deskY - 14, 10, 14, '#fdf6fa', 'rx="2" stroke="#d8c6e8" stroke-width="1"') + path('M122 ' + (deskY - 10) + ' q5 0 5 4 t-5 4', 'none', 'stroke="#d8c6e8" stroke-width="1.5"'));
            out.push(line('M116 ' + (deskY - 18) + ' q-2 -5 1 -8 M120 ' + (deskY - 18) + ' q-2 -5 1 -8', 'rgba(150,130,170,.5)', 1.2, 'class="steam"'));
        }
        // szék
        out.push(rect(60, deskY + 26, 38, 6, '#f5a9b8', 'rx="3"') + rect(78, deskY + 32, 3, 28, '#b8aac8') + ell(79.5, deskY + 62, 18, 3.5, '#b8aac8'));

        // ágy / kanapé
        var bx = 268, by = 188;
        if (h === 'garzon' || h === 'lakas') {
            out.push(rect(bx - 2, by - 18, 126, 48, '#c3adee', 'rx="10"'));
            out.push(rect(bx + 4, by - 2, 114, 36, '#d7c6f4', 'rx="8"'));
            out.push(rect(bx - 6, by - 6, 12, 40, '#b199e6', 'rx="6"') + rect(bx + 118, by - 6, 12, 40, '#b199e6', 'rx="6"'));
            out.push(rect(bx + 10, by + 34, 6, 10, '#8a74c6') + rect(bx + 110, by + 34, 6, 10, '#8a74c6'));
        } else {
            out.push(rect(bx, by, 126, 22, '#fdf6fa', 'rx="8"'));
            out.push(rect(bx + 6, by - 14, 38, 20, '#fff', 'rx="9" stroke="#e8dcf0" stroke-width="1.5"'));
            out.push(rect(bx + 40, by + 4, 86, 28, '#f6b5c5', 'rx="6"'));
            out.push(path('M' + (bx + 40) + ' ' + (by + 12) + ' h86', 'none', 'stroke="#fff" stroke-width="3" opacity=".6"'));
            out.push(rect(bx - 2, by + 26, 130, 12, '#d9b98c', 'rx="3"'));
            out.push(rect(bx, by + 38, 6, 8, '#c49e6c') + rect(bx + 120, by + 38, 6, 8, '#c49e6c'));
        }
        if (decor.agytakaro) {
            out.push(circ(bx + 18, by - 6, 11, '#f7a8c4', 'stroke="#fff" stroke-width="2"') + circ(bx + 46, by - 2, 10, '#9fd6f5', 'stroke="#fff" stroke-width="2"'));
            out.push(path('M' + (bx + 70) + ' ' + (by + 4) + ' q25 -12 50 4 v22 h-50z', '#fdf6fa', 'opacity=".95"'));
        }
        if (decor.novenyek) {
            out.push(rect(238, 208, 24, 24, '#e8b38a', 'rx="3"'));
            out.push(path('M250 210 q-16 -14 -16 -34 q12 10 16 34 M250 210 q16 -18 20 -38 q-16 12 -20 38 M250 210 q0 -26 -2 -44 q8 16 2 44', '#7cc78e'));
            out.push(path('M238 180 q8 -10 14 4', 'none', 'stroke="#6bb67e" stroke-width="2"'));
        }
        if (v.pets && v.pets.cica) out.push(catArt(bx + 88, by - 6));

        // karakter
        var sc = (v.scale || 1) * 1.14;
        out.push('<g class="av-wrap" transform="translate(204 270) scale(' + sc.toFixed(3) + ')">' + A.avatar({
            skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, outfit: v.outfit, mood: v.mood, pose: v.pose, uid: 'rm'
        }) + '</g>');
        // lábnyomok árnyék
        return '<svg class="eletut-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A szobád és a karaktered">' + out.join('') + '</svg>';
    };

    // Közelkép: a karakter derékig, a szoba színeivel a háttérben (a "Közelkép" gombhoz)
    A.closeup = function (v) {
        var wall = WALLS[v.housing] || WALLS.szulo;
        var out = [];
        out.push('<defs><linearGradient id="cu-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(wall, 0.3) + '"/><stop offset="1" stop-color="' + shade(wall, -0.06) + '"/></linearGradient>');
        out.push('<radialGradient id="cu-glow" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>');
        out.push(rect(0, 0, 400, 300, 'url(#cu-bg)'));
        out.push(rect(0, 0, 400, 300, 'url(#cu-glow)'));
        [[60, 70, 34], [340, 60, 26], [330, 200, 40], [50, 230, 28], [120, 30, 14], [280, 110, 12]].forEach(function (b, i) {
            out.push(circ(b[0], b[1], b[2], ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][i % 4], 'opacity=".22"'));
        });
        [[90, 120], [310, 140], [70, 40], [350, 250]].forEach(function (p) {
            out.push(path('M' + p[0] + ' ' + (p[1] - 7) + ' l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z', '#fff', 'opacity=".85" class="twinkle"'));
        });
        var sc = 1.95 * (0.9 + 0.1 * (v.scale || 1));
        out.push('<g transform="translate(200 ' + Math.round(425) + ') scale(' + sc.toFixed(3) + ')">' + A.avatar({
            skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, outfit: v.outfit, mood: v.mood, pose: v.pose, uid: 'cu'
        }) + '</g>');
        return '<svg class="eletut-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Közelkép a karakteredről">' + out.join('') + '</svg>';
    };

    // =========================================================
    // ESEMÉNY-JELENETEK (400 x 240)
    // =========================================================
    function figure(x, y, o, scale) {
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + (scale || 1) + ')">' + A.avatar(o) + '</g>';
    }
    function bunting(y, n) {
        var s = '', cols = ['#f5a9b8', '#9fd6f5', '#fdf6fa', '#c3adee', '#ffe08a'];
        s += line('M0 ' + y + ' Q200 ' + (y + 24) + ' 400 ' + y, '#8a7a9a', 1.4);
        for (var i = 0; i < n; i++) {
            var t = (i + 0.5) / n;
            var bx = t * 400;
            var by = y + 24 * 2 * t * (1 - t) * 1;
            s += path('M' + (bx - 9) + ' ' + by.toFixed(1) + ' h18 l-9 18z', cols[i % cols.length], 'stroke="rgba(58,47,69,.25)" stroke-width=".8"');
        }
        return s;
    }
    function crowd(y, seed) {
        var s = '', cols = ['#f4a3b8', '#5bcefa', '#f1eef8', '#a285dc', '#2e2736', '#e8c468', '#7b4e36'];
        for (var i = 0; i < 12; i++) {
            var x = 10 + i * 34 + ((i * seed) % 7);
            var c = cols[(i * 3 + seed) % cols.length];
            s += ell(x, y + 24, 16, 20, shade(c, -0.1), 'opacity=".85"');
            s += circ(x, y + 6, 12, '#efc09d', 'opacity=".95"');
            s += path('M' + (x - 13) + ' ' + (y + 6) + ' q0 -17 13 -17 q13 0 13 17 q-6 -9 -13 -9 q-7 0 -13 9z', c);
        }
        return s;
    }

    var SCENES = {
        room: function (v) { return A.room(v).replace('viewBox="0 0 400 300"', 'viewBox="0 20 400 260"'); },

        phone: function (o) {
            var s = rect(0, 0, 400, 240, '#1f1a33');
            s += rect(0, 0, 400, 240, 'url(#sc-glow)');
            s += '<defs><radialGradient id="sc-glow" cx=".7" cy=".4" r=".6"><stop offset="0" stop-color="#5a46a8" stop-opacity=".65"/><stop offset="1" stop-color="#1f1a33" stop-opacity="0"/></radialGradient></defs>';
            s += rect(236, 24, 108, 196, '#2b2538', 'rx="16" stroke="#6a5a98" stroke-width="3"');
            s += rect(244, 38, 92, 168, '#f6eefb', 'rx="8"');
            s += rect(252, 52, 60, 14, '#f5a9b8', 'rx="7"') + rect(268, 74, 60, 14, '#9fd6f5', 'rx="7"') + rect(252, 96, 44, 14, '#f5a9b8', 'rx="7"');
            s += rect(252, 124, 76, 54, '#c3adee', 'rx="6"') + path('M276 140 l24 14 -24 14z', '#fff');
            s += path('M290 190 l4 4 8 -8', 'none', 'stroke="#5bcefa" stroke-width="2"');
            s += path('M110 40 l3 7 7.5 1 -5.5 5 1.5 7.5 -6.5 -4 -6.5 4 1.5 -7.5 -5.5 -5 7.5 -1z', '#ffe08a', 'opacity=".8"');
            s += figure(130, 232, Object.assign({}, o, { mood: 'happy' }), 1.1);
            return s;
        },

        shop: function (o) {
            var s = rect(0, 0, 400, 240, '#fdeef2') + rect(0, 190, 400, 50, '#e6cdb5');
            s += rect(20, 28, 240, 150, '#fff', 'rx="6" stroke="#e0b7c4" stroke-width="3"');
            s += rect(20, 70, 240, 4, '#d9b98c') + rect(20, 126, 240, 4, '#d9b98c');
            var cols = ['#f6b5c5', '#bfe3f8', '#fdf6fa', '#c3adee', '#ffe0a0', '#f6b5c5'];
            for (var i = 0; i < 6; i++) { s += rect(34 + i * 38, 36, 26, 30, cols[i], 'rx="3"'); s += rect(34 + i * 38, 82, 26, 36, cols[(i + 2) % 6], 'rx="3"'); s += rect(34 + i * 38, 138, 26, 34, cols[(i + 4) % 6], 'rx="3"'); }
            s += rect(270, 36, 110, 30, '#f5a9b8', 'rx="6"') + rect(278, 44, 94, 4, '#fff') + rect(278, 52, 60, 4, 'rgba(255,255,255,.8)');
            s += figure(320, 236, o, 1.15);
            return s;
        },

        family: function (o) {
            var s = rect(0, 0, 400, 240, '#fbe9d9') + rect(0, 194, 400, 46, '#d9b98c');
            s += rect(20, 24, 70, 90, '#fff', 'stroke="#e0c9a8" stroke-width="3"') + circ(55, 60, 14, '#f4c9a8') + path('M32 110 q23 -34 46 0z', '#a9cdee');
            s += rect(110, 110, 150, 78, '#b9a2e0', 'rx="14"') + rect(98, 126, 22, 62, '#a58dd2', 'rx="10"') + rect(250, 126, 22, 62, '#a58dd2', 'rx="10"');
            s += circ(150, 98, 17, '#efc09d') + path('M133 98 q0 -22 17 -22 q17 0 17 22 q-8 -8 -17 -8 q-9 0 -17 8z', '#6a4a38') + rect(138, 112, 24, 40, '#7aa0d6', 'rx="8"');
            s += circ(215, 100, 16, '#efc09d') + path('M199 100 q0 -22 16 -22 q16 0 16 22 q-8 -9 -16 -9 q-8 0 -16 9z', '#c9926a') + rect(203, 114, 24, 40, '#f4a3b8', 'rx="8"');
            s += figure(325, 236, o, 1.2);
            s += rect(300, 34, 70, 6, '#fff4d6') + path('M296 34 q40 -26 80 0z', '#fff4d6', 'opacity=".8"');
            return s;
        },

        work: function (o) {
            var s = '<defs><linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f5"/><stop offset="1" stop-color="#e4f4fc"/></linearGradient></defs>' + rect(0, 0, 400, 240, 'url(#sc-sky)') + rect(0, 190, 400, 50, '#f3dfb7');
            s += circ(340, 44, 22, '#ffe9a6');
            s += rect(30, 100, 190, 100, '#fdf6fa', 'rx="6"') + path('M18 100 q112 -64 224 0z', '#f5a9b8') + path('M18 100 q28 -22 56 0 q28 -22 56 0 q28 -22 56 0 q28 -22 56 0 l0 8 h-224z', '#fdf6fa');
            s += rect(50, 130, 30, 40, '#bfe3f8', 'rx="3"') + rect(100, 130, 30, 40, '#f6b5c5', 'rx="3"') + rect(150, 130, 30, 40, '#ffe0a0', 'rx="3"');
            [60, 110, 160].forEach(function (x) { s += path('M' + (x + 6) + ' 112 l-8 -30 l16 0z', '#f3dfb7') + circ(x + 6, 80, 9, ['#f6b5c5', '#bfe3f8', '#ffe0a0'][(x / 50) % 3 | 0]); });
            s += figure(310, 236, o, 1.2);
            return s;
        },

        school: function (o) {
            var s = rect(0, 0, 400, 240, '#e9eef7') + rect(0, 190, 400, 50, '#cfd6c4');
            for (var i = 0; i < 9; i++) { s += rect(10 + i * 42, 34, 36, 130, i % 2 ? '#9fd6f5' : '#f5a9b8', 'rx="2" stroke="rgba(58,47,69,.25)" stroke-width="1"') + rect(20 + i * 42, 60, 16, 4, 'rgba(255,255,255,.7)') + circ(34 + i * 42, 110, 2, '#fff'); }
            s += ell(110, 206, 14, 24, '#7a6a9a') + circ(110, 168, 12, '#efc09d') + path('M98 168 q0 -16 12 -16 q12 0 12 16z', '#2e2736');
            s += ell(150, 206, 14, 24, '#d97a8a') + circ(150, 168, 12, '#c98f65') + path('M138 168 q0 -16 12 -16 q12 0 12 16z', '#7b4e36');
            s += figure(290, 238, o, 1.2);
            return s;
        },

        discord: function (o) {
            var s = rect(0, 0, 400, 240, '#2d2a4a');
            s += rect(20, 20, 360, 200, '#38355c', 'rx="12"') + rect(20, 20, 70, 200, '#2a2748', 'rx="12"');
            [0, 1, 2, 3].forEach(function (i) { s += circ(55, 50 + i * 40, 14, ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][i]); });
            var rows = [[104, 44, 150, '#f5a9b8'], [104, 82, 210, '#9fd6f5'], [104, 120, 120, '#c3adee'], [104, 158, 180, '#f5a9b8']];
            rows.forEach(function (r, i) { s += circ(112, r[1] + 8, 9, ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][i]) + rect(128, r[1], r[2], 8, 'rgba(255,255,255,.75)', 'rx="4"') + rect(128, r[1] + 13, r[2] * 0.6, 7, 'rgba(255,255,255,.4)', 'rx="3.5"'); });
            s += rect(104, 190, 250, 20, '#2a2748', 'rx="10"');
            s += path('M338 140 q10 -14 20 0 q10 14 -20 24 q-30 -10 -20 -24 q10 -14 20 0z', '#f5a9b8', 'opacity=".85" transform="translate(-6 -6) scale(.9)"');
            s += figure(350, 238, Object.assign({}, o, { mood: 'happy' }), 0.8);
            return s;
        },

        con: function (o) {
            var s = '<defs><linearGradient id="sc-con" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe4f0"/><stop offset="1" stop-color="#e7e2fb"/></linearGradient></defs>' + rect(0, 0, 400, 240, 'url(#sc-con)') + rect(0, 190, 400, 50, '#c9bfe3');
            s += bunting(8, 11);
            s += rect(110, 54, 180, 40, '#fff', 'rx="8" stroke="#f5a9b8" stroke-width="3"') + rect(130, 66, 140, 6, '#f5a9b8', 'rx="3"') + rect(150, 78, 100, 5, '#9fd6f5', 'rx="2.5"');
            s += crowd(166, 3);
            s += figure(200, 236, Object.assign({}, o, { mood: 'happy' }), 1.25);
            s += path('M60 120 l3 7 7.5 1 -5.5 5 1.5 7.5 -6.5 -4 -6.5 4 1.5 -7.5 -5.5 -5 7.5 -1z M340 110 l3 7 7.5 1 -5.5 5 1.5 7.5 -6.5 -4 -6.5 4 1.5 -7.5 -5.5 -5 7.5 -1z', '#ffe08a');
            return s;
        },

        casino: function (o) {
            var s = rect(0, 0, 400, 240, '#2a1740') + rect(0, 196, 400, 44, '#3d2360');
            for (var i = 0; i < 3; i++) {
                var x = 28 + i * 108;
                s += rect(x, 40, 84, 156, '#d9558a', 'rx="10" stroke="#ffd5a0" stroke-width="3"');
                s += rect(x + 10, 56, 64, 44, '#1b102c', 'rx="4"');
                s += rect(x + 14, 62, 16, 32, '#fff', 'rx="2"') + rect(x + 34, 62, 16, 32, '#fff', 'rx="2"') + rect(x + 54, 62, 16, 32, '#fff', 'rx="2"');
                s += circ(x + 22, 78, 5, '#f5a9b8') + circ(x + 42, 78, 5, '#ffe08a') + circ(x + 62, 78, 5, '#9fd6f5');
                s += rect(x + 16, 112, 52, 10, '#ffd5a0', 'rx="5"');
                s += circ(x + 14, 140, 4, '#ffe08a', 'class="twinkle" style="animation-delay:' + (i * 0.3) + 's"') + circ(x + 70, 140, 4, '#9fd6f5', 'class="twinkle"');
            }
            s += figure(350, 238, Object.assign({}, o, { mood: 'worried' }), 0.9);
            return s;
        },

        moving: function (o) {
            var s = '<defs><linearGradient id="sc-mv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#eef7fc"/></linearGradient></defs>' + rect(0, 0, 400, 240, 'url(#sc-mv)') + rect(0, 196, 400, 44, '#c8c2d6');
            s += rect(30, 110, 160, 86, '#f5a9b8', 'rx="8"') + rect(170, 126, 44, 70, '#f5a9b8', 'rx="8"') + rect(176, 132, 30, 24, '#bfe3f8', 'rx="3"');
            s += circ(70, 198, 14, '#3d3550') + circ(70, 198, 6, '#d8d2e6') + circ(176, 198, 14, '#3d3550') + circ(176, 198, 6, '#d8d2e6');
            s += rect(224, 156, 50, 40, '#d9b98c', 'rx="2"') + rect(236, 128, 44, 30, '#cfab7a', 'rx="2"') + rect(230, 156, 38, 5, '#b8935e');
            s += line('M226 176 h46M236 144 h34', '#b8935e', 2);
            s += figure(330, 236, o, 1.15);
            s += rect(300, 128, 42, 32, '#d9b98c', 'rx="2" transform="rotate(-6 321 144)"');
            return s;
        },

        office: function (o) {
            var s = rect(0, 0, 400, 240, '#e9eef7') + rect(0, 190, 400, 50, '#cdd3e0');
            s += rect(240, 24, 140, 100, '#bfe3f8', 'rx="4" stroke="#fff" stroke-width="4"');
            [0, 1, 2, 3].forEach(function (i) { s += rect(250 + i * 30, 70 - (i % 3) * 12, 20, 54 + (i % 3) * 12, '#9fb5d8'); });
            s += rect(20, 140, 200, 12, '#d9b98c', 'rx="3"') + rect(30, 152, 8, 44, '#c49e6c') + rect(200, 152, 8, 44, '#c49e6c');
            s += monitorShape(60, 80, 70, 46, '#7fc8f0') + rect(150, 124, 18, 16, '#fdf6fa', 'rx="2" stroke="#d8c6e8"');
            s += rect(180, 100, 28, 40, '#e8b38a', 'rx="3"') + path('M194 102 q-14 -16 -14 -34 q10 10 14 34 M194 102 q14 -18 18 -36 q-14 12 -18 36z', '#7cc78e');
            s += ell(300, 206, 16, 26, '#7a6a9a') + circ(300, 166, 13, '#efc09d') + path('M287 166 q0 -17 13 -17 q13 0 13 17z', '#2e2736');
            s += figure(110, 238, o, 0.95);
            return s;
        },

        stage: function (o) {
            var s = rect(0, 0, 400, 240, '#241a3a');
            s += '<defs><radialGradient id="sc-spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff4c9" stop-opacity=".9"/><stop offset="1" stop-color="#fff4c9" stop-opacity="0"/></radialGradient></defs>';
            s += path('M170 0 h60 l60 190 h-180z', 'url(#sc-spot)', 'opacity=".55"');
            s += path('M0 0 h60 q-20 90 -10 190 h-50z M400 0 h-60 q20 90 10 190 h50z', '#c1476f');
            s += rect(0, 186, 400, 54, '#6b4a8a') + rect(0, 186, 400, 6, '#f5a9b8');
            s += rect(260, 130, 3, 58, '#c8c2d6') + rect(252, 126, 19, 12, '#2b2538', 'rx="5"');
            s += crowd(206, 5).replace(/opacity="\.85"/g, 'opacity=".55"');
            s += figure(210, 200, Object.assign({}, o, { mood: 'proud' }), 1.2);
            return s;
        },

        sunset: function (o) {
            var s = '<defs><linearGradient id="sc-ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7ad8"/><stop offset=".5" stop-color="#f5a9b8"/><stop offset="1" stop-color="#ffe0a8"/></linearGradient></defs>' + rect(0, 0, 400, 240, 'url(#sc-ss)');
            s += circ(200, 150, 56, '#fff4d0', 'opacity=".9"');
            s += path('M0 190 v-50 h30 v-20 h28 v30 h24 v-40 h30 v30 h26 v-24 h30 v44 h28 v-28 h30 v38 h24 v-34 h28 v50 h26 v-34 h24 v40z', '#4a3a6a', 'opacity=".9"');
            s += rect(0, 190, 400, 50, '#3a2c58');
            s += figure(200, 206, Object.assign({}, o, { mood: 'proud' }), 1.05);
            for (var i = 0; i < 14; i++) s += circ(20 + i * 28, 24 + (i * 37) % 80, 1.6, '#fff', 'opacity=".7"');
            return s;
        },

        cafe: function (o) {
            var s = rect(0, 0, 400, 240, '#fbeee3') + rect(0, 196, 400, 44, '#d9b98c');
            s += rect(30, 24, 120, 100, '#bfe3f8', 'rx="4" stroke="#fff" stroke-width="5"') + line('M90 24 v100M30 74 h120', '#fff', 4);
            s += ell(240, 196, 70, 10, 'rgba(0,0,0,.1)') + rect(200, 150, 80, 8, '#d9b98c', 'rx="3"') + rect(236, 158, 8, 38, '#b8935e');
            s += rect(210, 130, 22, 20, '#fdf6fa', 'rx="4" stroke="#d8c6e8" stroke-width="1.5"') + rect(248, 130, 22, 20, '#fdf6fa', 'rx="4" stroke="#d8c6e8" stroke-width="1.5"');
            s += path('M232 138 q8 0 8 6 t-8 6', 'none', 'stroke="#d8c6e8" stroke-width="1.5"');
            s += path('M240 92 q10 -14 20 0 q10 16 -20 28 q-30 -12 -20 -28 q10 -14 20 0z', '#f5a9b8', 'opacity=".85" transform="translate(0 -10) scale(.8) translate(60 20)"');
            s += figure(330, 238, Object.assign({}, o, { mood: 'happy' }), 1.1);
            return s;
        },

        street: function (o) {
            var s = '<defs><linearGradient id="sc-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#f3eefc"/></linearGradient></defs>' + rect(0, 0, 400, 240, 'url(#sc-st)') + rect(0, 190, 400, 50, '#b7b0c6') + rect(0, 190, 400, 6, '#d8d2e6');
            [[10, 80, 64, '#f6c9d6'], [84, 50, 80, '#c3adee'], [174, 96, 70, '#fde3a8'], [254, 60, 76, '#a9d6f0'], [340, 100, 60, '#f6c9d6']].forEach(function (b) {
                s += rect(b[0], b[1], b[2], 190 - b[1], b[3], 'stroke="rgba(58,47,69,.2)" stroke-width="1"');
                for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) s += rect(b[0] + 8 + c * 20, b[1] + 10 + r * 24, 12, 14, 'rgba(255,255,255,.7)', 'rx="1.5"');
            });
            s += rect(140, 120, 5, 70, '#8a7a9a') + rect(120, 116, 46, 18, '#f5a9b8', 'rx="4"');
            s += figure(210, 238, Object.assign({}, o, { mood: 'happy' }), 1.2);
            return s;
        },

        bills: function (o) {
            var s = rect(0, 0, 400, 240, '#efe6f2') + rect(0, 194, 400, 46, '#d6c4b0');
            s += rect(20, 140, 230, 10, '#d9b98c', 'rx="3"') + rect(30, 150, 8, 44, '#c49e6c') + rect(232, 150, 8, 44, '#c49e6c');
            s += rect(40, 112, 52, 30, '#fff', 'transform="rotate(-6 66 127)" stroke="#e0d4ea" stroke-width="1.5"') + rect(100, 104, 52, 36, '#fff', 'transform="rotate(4 126 122)" stroke="#e0d4ea" stroke-width="1.5"') + rect(160, 116, 46, 26, '#fff4d6', 'stroke="#ecd9a8" stroke-width="1.5"');
            [0, 1, 2].forEach(function (i) { s += rect(50 + i * 54, 124 + i * 2, 30, 3, '#d97a8a') + rect(50 + i * 54, 132, 24, 3, '#c9bfd9'); });
            s += rect(212, 100, 32, 40, '#2b2538', 'rx="4"') + rect(216, 104, 24, 10, '#9fd6f5', 'rx="1"') + [0, 1, 2].map(function (i) { return rect(216 + i * 8, 120, 6, 5, '#f5a9b8', 'rx="1"'); }).join('');
            s += figure(320, 236, Object.assign({}, o, { mood: 'worried' }), 1.15);
            return s;
        }
    };
    A.SCENES = Object.keys(SCENES);

    // o: {skin, hairStyle, hairColor, outfit, mood, scale, ...}  v: teljes szoba-nézet (csak a "room" jelenethez)
    A.scene = function (id, v) {
        var fn = SCENES[id] || SCENES.room;
        var body = fn(id === 'room' ? v : { skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, outfit: v.outfit, mood: v.mood, uid: 'sc' + id });
        if (id === 'room') return body;
        return '<svg class="eletut-svg" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illusztráció">' + body + '</svg>';
    };

    // Az állapotból rajz-nézet
    A.viewOf = function (s) {
        var E = M.engine;
        var d = E.derive(s);
        var age = E.ageFloat(s);
        var mood = 'neutral';
        if (E.isSecret(s) && s.risk >= 70) mood = 'worried';
        else if (s.flags && s.flags._happy) mood = 'happy';
        else if (s.conf > 5000) mood = 'proud';
        return {
            housing: s.housing, comp: s.comp, decor: s.decor, pets: s.pets,
            outfit: (function () { var vis = {}; var list = E.visibleOutfit(s); D.SLOTS.forEach(function (sl) { if (list.indexOf(s.equipped[sl.id]) >= 0 && s.equipped[sl.id]) vis[sl.id] = s.equipped[sl.id]; }); return vis; })(),
            skin: s.skin, hairStyle: s.hairStyle, hairColor: s.hairColor,
            mood: mood, pose: mood === 'happy' ? 'wave' : (mood === 'proud' ? 'hips' : 'idle'), scale: 0.84 + 0.16 * Math.min(1, (age - 14) / 5), month: s.month,
            studying: !!s.activeSkill, working: !!s.job, broken: d.broken
        };
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof globalThis !== 'undefined' ? globalThis : this);
