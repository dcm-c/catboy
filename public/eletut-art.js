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
        trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
        game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v5M4.5 12.5h5"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18.6" cy="14" r="1" fill="currentColor"/>',
        code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
        leaf: '<path d="M5 19C5 10 10 5 20 5c0 10-5 15-14 15M5 19c4-5 7-8 11-10"/>',
        moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
        flag: '<path d="M5 21V4M5 4h13l-3 4 3 4H5"/>',
        buddy: '<circle cx="12" cy="10" r="5"/><circle cx="7.5" cy="5.5" r="2"/><circle cx="16.5" cy="5.5" r="2"/><path d="M6 21c0-4 3-6 6-6s6 2 6 6z"/>',
        hair: '<path d="M12 3C7 3 4 7 4 12v9M12 3c5 0 8 4 8 9v9M8 8c3 0 6-1 8-4"/>',
        top: '<path d="M8 3L3 6l2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
        bottom: '<path d="M8 4h8l5 16H3zM8 4v4M16 4v4"/>',
        legs: '<path d="M9 3h6v8l4 6a3 3 0 0 1-3 4H9a3 3 0 0 1-3-3z"/><path d="M9 7h6"/>',
        shoes: '<path d="M3 15l5-2 2-6h4v6l7 2v4H3z"/>',
        neck: '<path d="M5 4c0 8 3 12 7 12s7-4 7-12"/><circle cx="12" cy="19" r="2.5"/>',
        back: '<rect x="6" y="6" width="12" height="15" rx="4"/><path d="M9 6V4a3 3 0 0 1 6 0v2M9 14h6"/>',
        face: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 2 7 2 8 0M9 9.5h.01M15 9.5h.01"/>',
        gear: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
        drink: '<path d="M7 3h10l-1.5 18h-7z"/><path d="M7 9h10"/>',
        palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7.5" r="1" fill="currentColor"/>',
        chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
        lips: '<path d="M3 12c3-3 6-3 9-1 3-2 6-2 9 1-2 5-5 7-9 7s-7-2-9-7z"/><path d="M3 12c4 1 14 1 18 0"/>',
        blush: '<circle cx="12" cy="12" r="9"/><path d="M6 13l2-2M9 14l2-2M18 13l-2-2M15 14l-2-2"/>',
        lash: '<path d="M3 15c3-4 15-4 18 0"/><path d="M5 13l-2-3M9 11.5l-1-4M13 11V7M17 11.5l1-4M20 13l2-3"/>',
        pen: '<path d="M3 21l3-1L19 7l-2-2L4 18z"/><path d="M14 5l3 3"/>',
        nail: '<path d="M8 21V11a4 4 0 0 1 8 0v10z"/><path d="M8 14h8"/>',
        mask: '<path d="M3 8c3-2 6-3 9-3s6 1 9 3c0 6-3 11-9 11S3 14 3 8z"/><path d="M7 10.5c1-.8 2.4-.8 3.2 0M13.8 10.5c.8-.8 2.2-.8 3.2 0M9 15c2 1.2 4 1.2 6 0"/>'
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
    // A lapos alakzatok automatikusan kapnak a kitöltésüknél sötétebb körvonalat: így egységes a hatás a karakterrel.
    function mix(a, b, t) {
        var x = hex(a), y = hex(b);
        return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
    }
    function ol(c) { return mix(shade(c, -0.3), '#4a3562', 0.35); }
    function edge(fill, extra) {
        if (extra && /stroke=/.test(extra)) return '';
        if (!/^#[0-9a-fA-F]{6}$/.test(fill)) return '';
        return ' stroke="' + ol(fill) + '" stroke-width=".9" stroke-linejoin="round"';
    }
    function rect(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + edge(fill, extra) + (extra ? ' ' + extra : '') + '/>'; }
    function circ(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + edge(fill, extra) + (extra ? ' ' + extra : '') + '/>'; }
    function ell(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + edge(fill, extra) + (extra ? ' ' + extra : '') + '/>'; }
    function path(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + edge(fill, extra) + (extra ? ' ' + extra : '') + '/>'; }
    function line(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
    // sima, körvonal nélküli alakzat (háttér-síkok, árnyékok)
    function flat(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
    // talaj-árnyék: minden tárgy ezzel "áll" a földön
    function gshadow(cx, y, rx, op) { return '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + rx + '" ry="' + Math.max(1.6, rx * 0.16).toFixed(1) + '" fill="rgba(59,45,74,' + (op || 0.16) + ')"/>'; }

    // A kellékek (Fluent Emoji) szűrőt kapnak: a karakterével egyező, lilás körvonal és enyhén pasztellesített szín.
    // Minden SVG, ami kelléket használ, egyszer beilleszti ezt a definíciót (propDefs).
    function propDefs() {
        return '<defs><filter id="pf-ol" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">' +
            '<feMorphology in="SourceAlpha" operator="dilate" radius=".85" result="d"/><feFlood flood-color="#4a3562" flood-opacity=".5"/><feComposite in2="d" operator="in" result="o"/>' +
            '<feColorMatrix in="SourceGraphic" type="saturate" values=".9" result="s"/><feMerge><feMergeNode in="o"/><feMergeNode in="s"/></feMerge></filter></defs>';
    }
    A.propDefs = propDefs;
    // Kellékek: Fluent Emoji (Flat), 32x32. A tárgy alja (cx, by) pontra kerül, w szélességgel; árnyékkal.
    function prop(key, cx, by, w, o) {
        o = o || {};
        var a = M.assets && M.assets[key];
        if (!a) return '';
        var k = w / 32, tx = cx - w / 2, ty = by - w * 0.94;
        var s = o.noShadow ? '' : gshadow(cx, by, w * 0.4, o.shadow);
        var tr = 'translate(' + n1(tx) + ' ' + n1(ty) + ') scale(' + n1(k * 1000) / 1000 + ')';
        if (o.flip) tr = 'translate(' + n1(cx + w / 2) + ' ' + n1(ty) + ') scale(' + (-n1(k * 1000) / 1000) + ' ' + n1(k * 1000) / 1000 + ')';
        var inner = '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + ' transform="' + tr + '"><g filter="url(#pf-ol)">' + a + '</g></g>';
        // o.anim: finom mozgás (sway = lengő növény, breath = lélegző élőlény); külön burok, hogy a CSS-mozgás ne írja felül az elhelyezést
        if (o.anim) inner = '<g class="an an-' + o.anim + '"' + (o.delay ? ' style="animation-delay:' + o.delay + 's"' : '') + '>' + inner + '</g>';
        return s + inner;
    }
    function n1(v) { return Math.round(v * 10) / 10; }
    // díszpárna: lekerekített négyzet, kis gombbal és csíkkal (a hely bal felső sarka és a dőlésszög szerint)
    function cushion(x, y, w, h, c, rot) {
        return '<g transform="rotate(' + rot + ' ' + n1(x + w / 2) + ' ' + n1(y + h) + ')">' + rect(x, y, w, h, c, 'rx="5" stroke="#ffffff" stroke-width="1.4"') + path('M' + n1(x + 3) + ' ' + n1(y + 4) + ' q' + n1(w / 2 - 3) + ' -3 ' + n1(w - 6) + ' 0', 'none', 'stroke="#ffffff" stroke-width="1.2" opacity=".6" stroke-linecap="round"') + circ(x + w / 2, y + h / 2 + 1, 1.3, '#ffffff', 'opacity=".8" stroke="none"') + '</g>';
    }
    // Egy asset ikonként, 60x48-as miniatűrbe illesztve (középre)
    function iconProp(key, k) { var a = M.assets && M.assets[key]; return a ? '<g transform="translate(' + (30 - 16 * (k || 1.45)) + ' ' + (24 - 16 * (k || 1.45)) + ') scale(' + (k || 1.45) + ')"><g filter="url(#pf-ol)">' + a + '</g></g>' : ''; }

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
    var DAY = 96; // a nappal-éjszaka ciklus hossza másodpercben (CSS-animáció, az óra a fázist adja)
    function seasonOf(monthIdx) {
        var m = (D.START_CALENDAR_MONTH + monthIdx) % 12;
        if (m >= 2 && m <= 4) return 0;
        if (m >= 5 && m <= 7) return 1;
        if (m >= 8 && m <= 10) return 2;
        return 3;
    }

    // asztali monitor (a képernyő a "scr" osztályt kapja: a CSS ettől villan)
    function monitorShape(x, y, w, h, glow, tag) {
        var s = '';
        s += rect(x, y, w, h, '#4a4060', 'rx="4"');
        s += rect(x + 3, y + 3, w - 6, h - 6, glow, 'rx="2" class="scr" stroke="none"');
        s += rect(x + 8, y + 9, (w - 16) * 0.55, 4, 'rgba(255,255,255,.8)', 'rx="2" stroke="none"');
        s += rect(x + w - 8 - (w - 16) * 0.4, y + 17, (w - 16) * 0.4, 4, 'rgba(245,169,184,.95)', 'rx="2" stroke="none"');
        if (h > 30) s += rect(x + 8, y + 25, (w - 16) * 0.65, 4, 'rgba(255,255,255,.65)', 'rx="2" stroke="none"');
        s += rect(x + w / 2 - 3, y + h, 6, 7, '#5a4e72');
        s += rect(x + w / 2 - 11, y + h + 6, 22, 3.4, '#5a4e72', 'rx="1.7"');
        return '<g' + (tag ? ' class="' + tag + '"' : '') + '>' + s + '</g>';
    }

    // A gép szintjei: minden monitor talpa az asztal lapján (deskY) áll, és semmi sem lóg ki az asztalból.
    // Elrendezés (abszolút x): az asztal 8..160, a gép 12..150 között, a toronyé külön szakasz, hogy a kellékek ne takarják.
    var DESK_X0 = 8, DESK_X1 = 160, DESK_Y = 172;
    // tower: a gép tornya az asztalon [x0,x1] (vagy null); under: a torony az asztal alatt áll; micX: mikrofon-állvány
    var COMP_FOOT = [
        { tower: [114, 138] }, { tower: null }, { tower: [110, 132] }, { tower: [110, 136] },
        { tower: null }, { tower: null, mic: [126, 144] }, { tower: null, under: [108, 136] }
    ];
    function footOf(tier) { return COMP_FOOT[Math.max(0, Math.min(COMP_FOOT.length - 1, tier | 0))]; }
    function monAt(x0, w, h, deskY, glow, tag) { return monitorShape(x0, deskY - h - 9.4, w, h, glow, tag); }
    function computerArt(tier, deskY) {
        var s = '';
        var glow = '#7fc8f0', x = 14;
        if (tier === 0) {
            // régi bézs számítógép: monitor + torony
            s += rect(x + 14, deskY - 54, 58, 46, '#eadfca', 'rx="5"');
            s += rect(x + 19, deskY - 49, 48, 33, '#6d9ba8', 'rx="2.5" class="scr" stroke="none"');
            s += rect(x + 24, deskY - 42, 24, 3, 'rgba(255,255,255,.75)', 'rx="1.5" stroke="none"') + rect(x + 36, deskY - 34, 24, 3, 'rgba(255,255,255,.5)', 'rx="1.5" stroke="none"');
            s += rect(x + 34, deskY - 8, 26, 8, '#d8c9ac', 'rx="2"');
            s += rect(x + 100, deskY - 42, 24, 42, '#eadfca', 'rx="4"') + rect(x + 105, deskY - 35, 14, 3, '#b9a98d', 'stroke="none"') + circ(x + 112, deskY - 12, 2.2, '#6bd09a');
        } else if (tier === 1) {
            // laptop
            s += path('M' + (x + 14) + ' ' + (deskY - 38) + ' h58 l3 36 h-64z', '#4a4060');
            s += rect(x + 19, deskY - 34, 48, 26, glow, 'rx="1.5" class="scr" stroke="none"');
            s += rect(x + 24, deskY - 29, 24, 3, 'rgba(255,255,255,.8)', 'rx="1.5" stroke="none"') + rect(x + 38, deskY - 22, 24, 3, 'rgba(245,169,184,.95)', 'rx="1.5" stroke="none"');
            s += rect(x + 8, deskY - 5, 76, 5, '#c9c4d8', 'rx="2.5"');
        } else if (tier === 2) {
            s += monAt(24, 64, 44, deskY, glow);
            s += rect(110, deskY - 44, 22, 44, '#5a4e72', 'rx="4"') + circ(120, deskY - 35, 2.2, '#6bd09a');
        } else if (tier === 3) {
            s += monAt(20, 78, 52, deskY, '#8a6fe0', 'rgb');
            s += rect(110, deskY - 50, 26, 50, '#4a4060', 'rx="4"') + rect(115, deskY - 45, 16, 40, 'rgba(138,111,224,.35)', 'rx="2" class="rgb" stroke="none"');
        } else if (tier === 4) {
            s += monAt(14, 62, 44, deskY, '#7fc8f0');
            s += monAt(78, 62, 44, deskY, '#8a6fe0', 'rgb');
            // fejhallgató a jobb monitor tetején
            var hy = deskY - 53.4;
            s += path('M96 ' + (hy + 2) + ' a12 12 0 0 1 24 0', 'none', 'stroke="#4a4060" stroke-width="3" stroke-linecap="round"');
            s += rect(92.5, hy + 1, 7, 11, '#f5a9b8', 'rx="2.5"') + rect(116.5, hy + 1, 7, 11, '#f5a9b8', 'rx="2.5"');
        } else if (tier === 5) {
            s += monAt(12, 52, 44, deskY, '#7fc8f0');
            s += monAt(66, 52, 44, deskY, '#8a6fe0', 'rgb');
            // pop-szűrős mikrofon: az asztalra rögzített kar
            s += rect(128, deskY - 6, 16, 6, '#4a4060', 'rx="2"') + rect(134.5, deskY - 58, 3, 52, '#5a4e72') + circ(136, deskY - 66, 11, 'rgba(255,248,230,.92)', 'stroke="#f5d9a0" stroke-width="3"') + circ(136, deskY - 66, 4, '#4a4060');
        } else {
            s += monAt(12, 38, 34, deskY, '#7fc8f0');
            s += monAt(52, 48, 44, deskY, '#8a6fe0', 'rgb');
            s += monAt(102, 38, 34, deskY, '#f5a9b8');
            // a torony az asztal alatt áll a padlón
            s += rect(108, deskY + 10, 28, WB - deskY - 10, '#4a4060', 'rx="4"') + rect(112, deskY + 16, 20, WB - deskY - 24, 'rgba(95,225,235,.5)', 'rx="2" class="rgb" stroke="none"');
        }
        return s;
    }

    // Az asztallap elrendezése: a kellékek az elülső sorban (a monitorok talpa előtt) balról jobbra, egymást nem takarva.
    // Visszaadja a kellékek rajzát és a befoglaló dobozokat (a teszt ezekkel ellenőrzi az átfedést).
    function deskLayout(v, decor, deskY) {
        var f = footOf(v.comp || 0), pk = v.pack || {}, items = [], boxes = [];
        var zoneR = f.tower ? f.tower[0] - 3 : (f.mic ? f.mic[0] - 2 : 148);
        var zoneL = 16;
        // lehetséges kellékek: [kulcs, szélesség, rajzoló(cx)]
        if (v.studying) items.push({ id: 'books', w: 20, draw: function (cx) { return prop('books', cx, deskY + 1, 20, { shadow: 0.1 }); } });
        if (pk.gear === 'kbd') items.push({ id: 'kbd', w: 30, draw: function (cx) { return prop('keyboard', cx, deskY + 1, 30, { shadow: 0.1 }); } });
        else if (pk.gear === 'konzol') items.push({ id: 'konzol', w: 20, draw: function (cx) { return prop('gamepad', cx, deskY + 1, 20, { shadow: 0.1 }); } });
        else if (pk.gear === 'arch') items.push({ id: 'arch', w: 22, draw: function (cx) { return rect(cx - 11, deskY - 4, 14, 4, '#4a4056', 'rx="1.2"') + rect(cx + 3, deskY - 3.4, 4, 2.8, '#d9d2e8', 'rx=".6"') + rect(cx - 9, deskY - 3.2, 5, 1.4, '#5bcefa', 'stroke="none"'); } });
        if (v.working) items.push({ id: 'coffee', w: 16, draw: function (cx) { return prop('coffee', cx, deskY + 1, 16, { shadow: 0.1 }); } });
        if (pk.drink === 'monster') items.push({ id: 'monster', w: 9, draw: function (cx) { return rect(cx - 4.5, deskY - 16, 9, 16, '#fdf8fd', 'rx="2.4"') + rect(cx - 4, deskY - 11, 8, 4, '#6bd1c4', 'stroke="none"') + gshadow(cx, deskY, 5, 0.12); } });
        else if (pk.drink === 'matcha') items.push({ id: 'matcha', w: 14, draw: function (cx) { return prop('cupstraw', cx, deskY + 1, 14, { shadow: 0.1 }); } });
        var gap = 3, total = items.reduce(function (a, it) { return a + it.w; }, 0) + gap * Math.max(0, items.length - 1);
        var x = Math.max(zoneL, (zoneL + zoneR) / 2 - total / 2);
        var s = '';
        items.forEach(function (it) {
            var cx = x + it.w / 2;
            s += it.draw(cx);
            boxes.push({ id: it.id, group: 'deskfront', x0: x, x1: x + it.w, y0: deskY - 20, y1: deskY });
            x += it.w + gap;
        });
        if (decor.lava) {
            var lx = 152;
            s += path('M' + (lx - 5) + ' ' + deskY + ' h10 l-1.6 -27 h-6.8z', '#c8bcd8') + path('M' + (lx - 3.2) + ' ' + (deskY - 4) + ' h6.4 l-1 -20 h-4.4z', '#f6b5c5', 'class="lava" stroke="none"');
            s += circ(lx, deskY - 16, 2.2, '#ffd2e0', 'class="blob" stroke="none"') + circ(lx - .4, deskY - 8, 1.6, '#ffd2e0', 'class="blob b2" stroke="none"') + path('M' + (lx - 3.6) + ' ' + (deskY - 27) + ' q3.6 -5 7.2 0z', '#b8a8d0');
            boxes.push({ id: 'lava', group: 'desktop', x0: lx - 5, x1: lx + 5, y0: deskY - 31, y1: deskY });
        }
        // a gép saját alapterülete
        var cx0 = [28, 22, 24, 20, 14, 12, 12][Math.max(0, Math.min(6, v.comp | 0))];
        var cx1 = [138, 98, 132, 136, 140, 144, 140][Math.max(0, Math.min(6, v.comp | 0))];
        boxes.push({ id: 'computer', group: 'desktop', x0: cx0, x1: cx1, y0: deskY - 80, y1: deskY });
        if (f.tower) boxes.push({ id: 'tower', group: 'deskfront-block', x0: f.tower[0], x1: f.tower[1], y0: deskY - 50, y1: deskY });
        if (f.mic) boxes.push({ id: 'mic', group: 'deskfront-block', x0: f.mic[0], x1: f.mic[1], y0: deskY - 80, y1: deskY });
        return { svg: s, boxes: boxes };
    }

    // =========================================================
    // MINIATŰRÖK (a kártyákhoz): viselt tárgyaknál az avatár kivágott részlete, a többinél kellék-rajz
    // =========================================================
    var THUMB_VB = {
        hair: '-28 -166 56 68', face: '-28 -158 56 68', neck: '-24 -112 48 58', top: '-26 -104 52 64',
        bottom: '-26 -70 52 63', legs: '-24 -58 48 58', shoes: '-16 -34 32 39', back: '-30 -110 60 73', cosplay: '-36 -196 72 206'
    };
    var ICON_DRAW = {
        poszter: function () { return iconProp('picture', 1.5); },
        zaszlo: function () { return iconProp('transflag', 1.5); },
        ledfeny: function () { var o = line('M2 12 Q15 32 30 14 T58 14', '#9a86b8', 1.2); for (var i = 0; i < 6; i++) o += circ(6 + i * 10, 17 + Math.sin(i * 1.6) * 7, 3, ['#ffe08a', '#f7a8c4', '#9fd6f5'][i % 3]); return o; },
        agytakaro: function () { return iconProp('bed', 1.5); },
        novenyek: function () { return iconProp('plant', 1.5); },
        tukor: function () { return iconProp('mirror', 1.5); },
        polc: function () { return iconProp('books', 1.5); },
        lava: function () { return path('M22 46 h16 l-2.6 -36 h-10.8z', '#c8bcd8') + path('M24.4 40 h11.2 l-1.4 -26 h-8.4z', '#f6b5c5', 'stroke="none"') + circ(30, 29, 3.6, '#ffd2e0', 'stroke="none"') + circ(29, 21, 2.4, '#ffd2e0', 'stroke="none"') + path('M23 10 q7 -9 14 0z', '#b8a8d0'); },
        dobozok: function () { return iconProp('package', 1.5); },
        cica: function () { return iconProp('cat', 1.5); },
        kbd: function () { return iconProp('keyboard', 1.7); },
        konzol: function () { return iconProp('gamepad', 1.5); },
        arch: function () { return iconProp('disk', 1.4); },
        monster: function () { return rect(21, 6, 18, 38, '#fdf8fd', 'rx="5"') + rect(21, 18, 18, 10, '#6bd1c4', 'stroke="none"') + path('M26 12 l4 -4 l4 4', 'none', 'stroke="#b8a8c8" stroke-width="1.6" stroke-linecap="round"') + rect(25, 36, 10, 2, '#d8c6e8', 'stroke="none"'); },
        matcha: function () { return iconProp('cupstraw', 1.45); },
        sun: function () { return iconProp('hedgehog', 1.5); },
        blahaj: function () { return iconProp('shark', 1.5); },
        army: function () { return '<g filter="url(#pf-ol)"><g transform="translate(5 3) scale(.55)">' + M.assets.shark + '</g><g transform="translate(31 3) scale(.55)">' + M.assets.shark + '</g><g transform="translate(18 15) scale(.7)">' + M.assets.shark + '</g><g transform="translate(5 27) scale(.55)">' + M.assets.shark + '</g><g transform="translate(31 27) scale(.55)">' + M.assets.shark + '</g></g>'; }
    };
    // kind: slot azonosító vagy 'decor' / 'pet'; o: {id, color, skin, hairStyle, hairColor}
    A.thumb = function (slot, id, o) {
        o = o || {};
        var wearVb = THUMB_VB[slot];
        if (wearVb) {
            var out = {}, cols = {};
            out[slot] = id;
            if (slot === 'legs' || slot === 'shoes') out.bottom = 'tenisz'; // a farmer ne takarja el a zoknit és a cipőt
            if (o.color) cols[slot] = o.color;
            var pt = {};
            if (o.pat !== undefined) pt[slot] = o.pat; // null: egyszínű; objektum: {id, color}
            var body = A.avatar({ skin: o.skin || 's2', hairStyle: o.hairStyle || 'bob', hairColor: o.hairColor || 'rozsa', outfit: out, colors: cols, patterns: o.pat !== undefined ? pt : undefined, mood: 'neutral', pose: 'idle', uid: 'th' });
            return '<svg viewBox="' + wearVb + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Előnézet">' + body + '</svg>';
        }
        var f = ICON_DRAW[id];
        return '<svg viewBox="0 0 60 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Előnézet">' + propDefs() + (f ? f() : '') + '</svg>';
    };

    // Smink-termék miniatűrje: az arc (vagy a kéz) kivágása, csak az adott termékkel
    var LOOK_VB = {
        lips: '-13 -119 26 20', blush: '-22 -128 44 34', shadow: '-19 -134 38 24', liner: '-19 -134 38 24',
        lashes: '-19 -134 38 24', deco: '-22 -140 44 54', nails: '5 -63 26 32'
    };
    A.beautyThumb = function (slot, id, o) {
        o = o || {};
        var mk = {};
        mk[slot] = { style: id, color: o.color || null };
        var mood = slot === 'lips' || slot === 'deco' ? 'happy' : 'neutral';
        var body = A.avatar({ skin: o.skin || 's2', hairStyle: o.hairStyle || 'bob', hairColor: o.hairColor || 'rozsa', outfit: {}, makeup: mk, mood: mood, pose: slot === 'nails' ? 'idle' : 'idle', uid: 'bt' });
        return '<svg viewBox="' + (LOOK_VB[slot] || LOOK_VB.blush) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Előnézet">' + body + '</svg>';
    };
    // Barát portréja (fej és váll), a PEOPLE táblázat alapján
    A.personSvg = function (id) {
        var p = D.find(D.PEOPLE, id);
        if (!p) return '';
        var l = p.look;
        var body = A.avatar({ skin: l.skin, hairStyle: l.hairStyle, hairColor: l.hairColor, outfit: l.outfit, makeup: l.makeup, mood: l.mood || 'neutral', pose: 'idle', uid: 'pp' + id });
        return '<svg viewBox="-30 -164 60 74" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + p.name + '">' + body + '</svg>';
    };

    // v: { housing, comp, decor:{}, pets:{}, outfit:{}, colors:{}, pack:{}, skin, hairStyle, hairColor, mood, scale, month, studying, working, broken }
    // Elrendezés: a fal alja y=222, a padló y=222..300; a karakter talpa y=266. Minden bútor a padlóra áll, árnyékkal.
    var WB = 222;
    A.room = function (v) { return buildRoom(v).svg; };
    // a szoba elrendezési dobozai (a teszt ezekkel ellenőrzi, hogy semmi sem takar vagy lóg)
    A.roomBoxes = function (v) { return buildRoom(v).boxes; };
    function buildRoom(v) {
        var h = v.housing || 'szulo';
        var decor = v.decor || {};
        var out = [], boxes = [];
        function box(id, group, x0, y0, x1, y1) { boxes.push({ id: id, group: group, x0: x0, y0: y0, x1: x1, y1: y1 }); }
        var wall = WALLS[h] || WALLS.szulo, floor = FLOORS[h] || FLOORS.szulo;
        var sky = SEASON_SKY[seasonOf(v.month || 0)];
        var big = h === 'lakas';

        out.push('<defs><linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>');
        out.push(flat(0, 0, 400, WB, wall));
        out.push('<defs><linearGradient id="rm-ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3562" stop-opacity=".1"/><stop offset="1" stop-color="#4a3562" stop-opacity="0"/></linearGradient></defs>' + flat(0, 0, 400, 56, 'url(#rm-ao)'));
        out.push(flat(0, WB - 34, 400, 34, shade(wall, -0.035)));            // lambéria
        out.push(flat(0, WB - 35, 400, 2, shade(wall, -0.1)));
        out.push(flat(0, WB - 2, 400, 5, shade(wall, 0.35)) + flat(0, WB + 3, 400, 1.2, shade(wall, -0.25), 'opacity=".5"')); // szegélylista
        out.push(flat(0, WB + 3, 400, 80, floor));
        for (var p = 0; p < 6; p++) out.push(line('M0 ' + (WB + 14 + p * 13) + ' H400', shade(floor, -0.1), 1, 'opacity=".5"'));
        for (var q = 0; q < 9; q++) out.push(line('M' + (q * 52 + (q % 2) * 20) + ' ' + (WB + 14 + (q % 3) * 13) + ' v13', shade(floor, -0.1), 1, 'opacity=".4"'));

        // ablak
        var wx = big ? 240 : 258, wy = big ? 32 : 38, ww = big ? 120 : 88, wh = big ? 128 : 100;
        box('window', 'wall', wx - 8, wy - 5, wx + ww + 8, wy + wh + 8);
        out.push(rect(wx - 5, wy - 5, ww + 10, wh + 10, '#ffffff', 'rx="5" stroke="#c9b8d8" stroke-width=".9"'));
        out.push(rect(wx, wy, ww, wh, 'url(#rm-sky)', 'rx="2" stroke="#c9b8d8" stroke-width=".9"'));
        var si = seasonOf(v.month || 0);
        // kilátás: az égen felhők és nap, lent az évszaknak megfelelő domb és fa (az ablakba vágva)
        var hill = ['#bfe8b8', '#9fdc9a', '#e9b878', '#fbfbff'][si], hill2 = ['#a7dca4', '#86cc86', '#d9a060', '#e6eefa'][si];
        out.push('<clipPath id="rm-wclip"><rect x="' + wx + '" y="' + wy + '" width="' + ww + '" height="' + wh + '" rx="2"/></clipPath>');
        var view = '';
        var fx = !!v.fx, ph = fx ? (Number(v.clock) || 0) : 0;
        function adl(period, off) { return 'animation-delay:-' + (((ph + (off || 0)) % period + period) % period).toFixed(2) + 's'; }
        view += ell(wx + ww * 0.3, wy + wh * 0.38, 20, 8, 'rgba(255,255,255,.88)', 'stroke="none" class="cloud"') + ell(wx + ww * 0.45, wy + wh * 0.34, 15, 7, 'rgba(255,255,255,.88)', 'stroke="none" class="cloud cl2"');
        var sunC = circ(wx + ww * 0.8, wy + 22, 9, si === 3 ? '#f4f1ff' : '#ffe9a6', 'opacity=".95" stroke="none"');
        view += fx ? '<g class="sunmove" style="' + adl(DAY) + '">' + sunC + '</g>' : sunC;
        if (fx) {
            // alkony és éjszaka: sötétkék fátyol, csillagok és hold (a nappal-éjszaka ciklust a CSS vezérli, a fázist az óra adja)
            view += rect(wx, wy, ww, wh, '#f59a6a', 'class="dusk" opacity="0" stroke="none" style="' + adl(DAY) + '"');
            view += rect(wx, wy, ww, wh, '#1c2250', 'class="nightsky" opacity="0" stroke="none" style="' + adl(DAY) + '"');
            var stars = '';
            for (var sti = 0; sti < 12; sti++) {
                stars += circ(wx + 6 + ((sti * 41 + 13) % (ww - 12)), wy + 6 + ((sti * 29 + 7) % Math.round(wh * 0.56)), sti % 3 === 0 ? 1.3 : 0.9, '#fffbe6', 'class="twinkle" stroke="none" style="animation-delay:' + (sti * 0.37).toFixed(2) + 's"');
            }
            view += '<g class="stars" opacity="0" style="' + adl(DAY) + '">' + stars + '</g>';
            view += '<g class="moonmove" opacity="0" style="' + adl(DAY) + '">' + circ(wx + ww * 0.28, wy + 24, 8, '#f6f0d8', 'stroke="none"') + circ(wx + ww * 0.28 + 3.4, wy + 21.6, 7.2, '#1c2250', 'opacity=".9" stroke="none"') + '</g>';
        }
        view += path('M' + wx + ' ' + (wy + wh * 0.82) + ' Q' + (wx + ww * 0.3) + ' ' + (wy + wh * 0.66) + ' ' + (wx + ww * 0.62) + ' ' + (wy + wh * 0.8) + ' T' + (wx + ww) + ' ' + (wy + wh * 0.74) + ' V' + (wy + wh) + ' H' + wx + 'Z', hill2, 'stroke="none"');
        view += path('M' + wx + ' ' + (wy + wh * 0.9) + ' Q' + (wx + ww * 0.4) + ' ' + (wy + wh * 0.78) + ' ' + (wx + ww * 0.8) + ' ' + (wy + wh * 0.9) + ' T' + (wx + ww) + ' ' + (wy + wh * 0.88) + ' V' + (wy + wh) + ' H' + wx + 'Z', hill, 'stroke="none"');
        view += prop(si >= 2 ? 'pine' : 'tree', wx + ww * (big ? 0.3 : 0.22), wy + wh * 0.93, big ? 46 : 34, { noShadow: true });
        if (si === 2) view += prop('tree', wx + ww * 0.7, wy + wh * 0.97, big ? 34 : 26, { noShadow: true, flip: true });
        if (si === 3 && !fx) for (var sf = 0; sf < 9; sf++) view += circ(wx + 8 + ((sf * 37) % (ww - 14)), wy + 8 + ((sf * 23) % (wh * 0.62)), 1.4, '#ffffff', 'opacity=".9" stroke="none" class="twinkle" style="animation-delay:' + (sf * 0.3) + 's"');
        if (fx) {
            // évszaki részecskék: tavasszal szirmok, nyáron pollen, ősszel levelek, télen hó; a hullás ütemét a CSS adja
            var pn = si === 3 ? 16 : (si === 2 ? 8 : (si === 0 ? 8 : 7));
            for (var pi = 0; pi < pn; pi++) {
                var px0 = wx + 4 + ((pi * 53 + 11) % (ww - 8)), dur = (si === 3 ? 6 + (pi % 4) : (si === 1 ? 11 + (pi % 4) * 2 : 8 + (pi % 5))), dx = (pi % 2 ? 1 : -1) * (6 + (pi * 7) % 14);
                if (si === 1) dx = (pi % 2 ? 1 : -1) * (3 + (pi % 4));
                var pst = 'style="--dx:' + dx + 'px;--dur:' + dur + 's;animation-delay:-' + ((pi * 1.7 + ph) % dur).toFixed(2) + 's"';
                var cls = 'class="fall' + (si === 1 ? ' rise' : '') + '" ';
                if (si === 0) view += ell(px0, wy - 4, 2.1, 1.2, pi % 2 ? '#f7b8cc' : '#fde3ec', cls + pst + ' stroke="none"');
                else if (si === 1) view += circ(px0, wy + wh * 0.86, 1.1, '#fff3b0', cls + pst + ' stroke="none"');
                else if (si === 2) view += path('M' + px0 + ' ' + (wy - 4) + ' q2.4 -1.6 4.6 0 q-2.4 2.8 -4.6 0z', ['#e08a3c', '#c9602e', '#e9b84a'][pi % 3], cls + pst + ' stroke="none"');
                else view += circ(px0, wy - 4, pi % 3 === 0 ? 1.7 : 1.2, '#ffffff', cls + pst + ' stroke="none"');
            }
            // alkalmi madár: lassan átrepül az ablakon (a ciklus nagy részében rejtve)
            view += '<g class="bird" style="--bw:' + (ww + 24) + 'px;' + adl(34, 9) + '" opacity="0"><g transform="translate(' + (wx - 12) + ' ' + (wy + wh * 0.3).toFixed(1) + ')"><path class="wing" d="M-4 0 Q-2 -3.4 0 0 Q2 -3.4 4 0" fill="none" stroke="#5a4a72" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
        }
        out.push('<g clip-path="url(#rm-wclip)">' + view + '</g>');
        // az ablakon beeső fény: a padlóra vetülő, négy részre osztott világos folt (az évszak színében)
        var lc = ['#fffbe0', '#fff6c8', '#ffe2b8', '#eaf3ff'][si];
        var lx0 = wx - 6, lx1 = wx + ww + 6;
        [[0, 0.5], [0.5, 1]].forEach(function (r) {
            var a0 = lx0 + (lx1 - lx0) * r[0] + 3, a1 = lx0 + (lx1 - lx0) * r[1] - 3;
            out.push(path('M' + n1(a0) + ' ' + (WB + 3) + ' L' + n1(a1) + ' ' + (WB + 3) + ' L' + n1(a1 - 52) + ' ' + (WB + 80) + ' L' + n1(a0 - 52) + ' ' + (WB + 80) + 'Z', lc, 'opacity=".26" stroke="none"' + (fx ? ' class="shaft" style="' + adl(DAY) + '"' : '')));
        });
        out.push(rect(wx + ww / 2 - 1.5, wy, 3, wh, '#ffffff', 'stroke="#c9b8d8" stroke-width=".6"'));
        if (!big) out.push(rect(wx, wy + wh / 2 - 1.5, ww, 3, '#ffffff', 'stroke="#c9b8d8" stroke-width=".6"'));
        out.push(rect(wx - 8, wy + wh + 3, ww + 16, 5, '#ffffff', 'rx="2"'));                       // párkány
        out.push(path('M' + (wx - 8) + ' ' + (wy - 4) + ' h14 v' + (wh + 6) + ' q-7 -6 -14 0z', '#f6c9d6', 'class="curtain"'));
        out.push(path('M' + (wx + ww + 8) + ' ' + (wy - 4) + ' h-14 v' + (wh + 6) + ' q7 -6 14 0z', '#f6c9d6', 'class="curtain cr"'));

        // porszemek a napfényben (lassan felfelé sodródnak)
        [[0.1, 0.55, 0], [0.35, 0.78, 1.7], [0.6, 0.62, 3.1], [0.8, 0.85, 4.4], [0.5, 0.5, 5.6]].forEach(function (m) {
            out.push('<circle class="mote" cx="' + n1(wx - 40 + (ww + 40) * m[0]) + '" cy="' + n1(wy + wh * m[1] + 40) + '" r="1" fill="#ffffff" stroke="none" style="animation-delay:' + m[2] + 's"/>');
        });

        // lakás-specifikus fali/bútor-elemek: mind az ablaktól jobbra vagy a padlón, a dekorációtól távol
        if (h === 'szulo') {
            out.push(prop('picture', 382, 62, 22, { noShadow: true }) + prop('picture', 382, 96, 22, { noShadow: true }));
            box('keretek', 'wall', 371, 41, 393, 98);
        } else if (h === 'kolesz') {
            out.push(rect(366, 50, 30, 40, '#d1b184', 'rx="2"'));
            [0, 1, 2].forEach(function (i) { out.push(rect(369 + (i % 2) * 11, 55 + i * 11, 10, 8, ['#f6b5c5', '#fdf6fa', '#bfe3f8'][i], 'rx="1"')); out.push(circ(374 + (i % 2) * 11, 55 + i * 11, 1.2, '#e05a7a')); });
            box('parafaliujsag', 'wall', 366, 50, 396, 90);
        } else if (h === 'szoba') {
            out.push(prop('picture', 382, 96, 26, { noShadow: true }));
            box('kep', 'wall', 369, 71, 395, 96);
        } else if (h === 'garzon') {
            // falra szerelt polc (nem lóg a levegőben: két konzol tartja), rajta növény és csésze
            out.push(rect(358, 150, 40, 4, '#e8e2f2', 'rx="1.5" stroke="#bfb4d6" stroke-width=".8"') + path('M364 154 v8 l8 -8z M390 154 v8 l-8 -8z', '#d7cfe8'));
            out.push(prop('plant', 370, 150, 20, { noShadow: true }) + prop('teacup', 389, 150, 14, { noShadow: true }));
            box('falipolc', 'wall', 358, 128, 398, 162);
        } else if (big) {
            // állólámpa az ablaktól jobbra, szőnyeg a padlón
            out.push(rect(385, 112, 3, WB - 112, '#bfae98') + path('M373 112 h27 l-5 -22 h-17z', '#fff4d6'));
            box('lampa', 'wall', 373, 90, 400, WB);
        }
        if (big) out.push(ell(206, 268, 88, 15, '#f2cfdc', 'opacity=".7" stroke="none"') + ell(206, 268, 74, 10.5, '#fbe6ee', 'opacity=".8" stroke="none"'));

        // dekoráció
        if (decor.ledfeny) {
            // négy lehajló fűzér-ív (mindegyik 100 széles, a végein szögnél rögzítve); az égők az íven, kis foglalattal lógnak
            var sw = '';
            for (var si2 = 0; si2 < 4; si2++) sw += (si2 ? ' Q' : 'M0 8 Q') + (si2 * 100 + 50) + ' 24 ' + (si2 * 100 + 100) + ' 8';
            out.push(path(sw, 'none', 'stroke="#9a86b8" stroke-width="1.2" stroke-linecap="round"'));
            for (var nl = 0; nl <= 4; nl++) out.push(circ(nl * 100, 8, 1.6, '#b8a8d0', 'stroke="#9a86b8" stroke-width=".6"'));
            var bulbN = 0;
            for (var sg2 = 0; sg2 < 4; sg2++) [0.2, 0.5, 0.8].forEach(function (t) {
                var bxp = sg2 * 100 + 100 * t, byp = 8 + 32 * t * (1 - t);
                out.push(rect(bxp - 1, byp, 2, 2.6, '#7c6a98', 'stroke="none"') + circ(bxp, byp + 5.6, 3, ['#ffe08a', '#f7a8c4', '#9fd6f5'][bulbN % 3], 'class="twinkle" style="animation-delay:' + (bulbN * 0.2) + 's"'));
                bulbN++;
            });
            box('ledfeny', 'wall', 0, 0, 400, 22);
        }
        if (decor.poszter) {
            box('poszter', 'wall', 24, 26, 140, 78);
            out.push('<g transform="translate(0 4)">');
            out.push(rect(24, 24, 36, 48, '#f5a9b8', 'rx="2" stroke="#ffffff" stroke-width="3"') + path('M42 38 l4 8 9 1.2 -6.6 6.2 1.8 9 -8.2 -4.4 -8.2 4.4 1.8 -9 -6.6 -6.2 9 -1.2z', '#ffffff', 'stroke="none"'));
            out.push(rect(70, 30, 34, 44, '#9fd6f5', 'rx="2" stroke="#ffffff" stroke-width="3"') + circ(87, 48, 9, '#ffffff', 'stroke="none"') + path('M76 70 q11 -16 22 0z', '#ffffff', 'opacity=".85" stroke="none"'));
            out.push(rect(112, 22, 28, 38, '#c3adee', 'rx="2" stroke="#ffffff" stroke-width="3"') + path('M126 32 l5 9 h-10z M126 52 l5 -9 h-10z', '#ffffff', 'opacity=".9" stroke="none"'));
            out.push('</g>');
        }
        if (decor.zaszlo) { out.push(prop('transflag', 176, 65, 52, { noShadow: true })); box('zaszlo', 'wall', 150, 26, 202, 59); }
        if (decor.polc) {
            var shR = big ? 224 : 238;
            out.push(rect(150, 80, shR - 150, 5, '#d9b98c', 'rx="2"') + rect(158, 85, 4, 5, '#c49e6c') + rect(shR - 12, 85, 4, 5, '#c49e6c'));
            var shelf = [['books', 20], ['teddy', 18], ['crystal', 16], ['seedling', 14]], sx = 156;
            shelf.forEach(function (it) {
                if (sx + it[1] > shR - 2) return;
                out.push(prop(it[0], sx + it[1] / 2, 80, it[1], { noShadow: true, anim: it[0] === 'seedling' ? 'sway' : '' }));
                sx += it[1] + 4;
            });
            box('polc', 'wall', 150, 61, shR, 85);
        }

        // asztal és gép (a gép a lapra áll, az asztal a padlóra)
        var deskY = DESK_Y, dsk = footOf(v.comp || 0);
        out.push(gshadow(84, WB + 2, 82, 0.14));
        out.push(rect(14, deskY + 7, 5, WB - deskY - 7, '#c49e6c') + rect(149, deskY + 7, 5, WB - deskY - 7, '#c49e6c'));
        if (!dsk.under) out.push(rect(106, deskY + 7, 40, 32, '#cfab7a', 'rx="2"') + circ(126, deskY + 22, 2.4, '#8a6c46'));
        out.push(rect(DESK_X0, deskY, DESK_X1 - DESK_X0, 8, '#dcbd90', 'rx="2.5"'));
        if (v.broken) {
            out.push(rect(34, deskY - 54, 70, 46, '#4a4060', 'rx="4"'));
            out.push(path('M48 ' + (deskY - 42) + ' l40 24 M88 ' + (deskY - 42) + ' l-40 24', 'none', 'stroke="#f5a9b8" stroke-width="3" stroke-linecap="round"'));
        } else out.push(computerArt(v.comp || 0, deskY));
        var dl = deskLayout(v, decor, deskY);
        out.push(dl.svg);
        dl.boxes.forEach(function (b) { boxes.push(b); });
        box('asztal', 'floor', DESK_X0, deskY, DESK_X1, WB);
        // szék: a padlóra áll
        var chairX = 80, chairY = 250;
        out.push(gshadow(chairX, chairY + 3, 22, 0.16));
        out.push(rect(chairX - 3, deskY + 30, 6, chairY - deskY - 30, '#b8aac8') + rect(chairX - 20, chairY, 40, 4, '#b8aac8', 'rx="2"'));
        out.push(rect(chairX - 20, deskY + 24, 40, 8, '#f5a9b8', 'rx="4"'));
        box('szek', 'chair', chairX - 20, deskY + 24, chairX + 20, chairY + 4);
        if (decor.dobozok) {
            [[28, 222], [29.5, 214], [27.5, 206], [29, 198], [28, 190]].forEach(function (t, i) {
                out.push(rect(t[0], t[1] - 8, 13, 8, i % 2 ? '#fdf8fd' : '#7ad6c8', 'rx="1.8"') + rect(t[0] + 1.4, t[1] - 5.4, 10.2, 1.6, i % 2 ? '#7ad6c8' : '#fdf8fd', 'stroke="none"'));
            });
            box('dobozok', 'chair', 27, 182, 43, WB);
        }

        // ágy / kanapé: a felületen kijelölt helyek vannak (párna-sarok, ülő/fekvő kedvenc, macska), egymást nem takarják
        var bx = 268, by = 190, sofa = (h === 'garzon' || h === 'lakas');
        var sl = !!v.sleeping, pk = v.pack || {}, bb = pk.buddy;
        var buddyKey = bb === 'blahaj' ? ['shark', 34] : (bb === 'sun' ? ['hedgehog', 28] : (bb === 'army' ? ['shark', 28] : null));
        // pár ágy-/kanapé-szakasz: a párna (kb. bx+4..bx+44), majd a "kedvenc" és a macska helye
        var BUD = sofa ? [bx + 44, bx + 80] : [bx + 48, bx + 84], CAT = sofa ? [bx + 80, bx + 116] : [bx + 86, bx + 122];
        var itemY = sofa ? by + 6 : by + 5;
        if (sofa) {
            out.push(gshadow(bx + 62, WB + 6, 70, 0.14));
            out.push(rect(bx + 10, by + 34, 8, 6, '#8a74c6') + rect(bx + 108, by + 34, 8, 6, '#8a74c6'));
            out.push(rect(bx - 2, by - 18, 126, 52, '#c3adee', 'rx="12"'));
            out.push(rect(bx + 6, by - 2, 110, 36, '#d7c6f4', 'rx="9"'));
            out.push(rect(bx - 8, by - 8, 14, 42, '#b199e6', 'rx="7"') + rect(bx + 118, by - 8, 14, 42, '#b199e6', 'rx="7"'));
        } else {
            out.push(gshadow(bx + 64, WB + 6, 72, 0.14));
            out.push(rect(bx + 2, by + 24, 7, WB - by - 24, '#c49e6c') + rect(bx + 118, by + 24, 7, WB - by - 24, '#c49e6c'));
            out.push(rect(bx - 4, by + 14, 134, 14, '#d9b98c', 'rx="3"'));                 // keret
            out.push(rect(bx - 2, by - 2, 130, 18, '#fdf6fa', 'rx="7"'));                   // matrac
            if (decor.agytakaro) {
                // díszpárnák a fejvég támlája mellett, a párna mögött
                out.push(cushion(bx + 6, by - 27, 20, 15, '#f7a8c4', -6) + cushion(bx + 24, by - 29, 20, 15, '#9fd6f5', 5));
            }
            out.push(rect(bx + 4, by - 16, 40, 18, '#ffffff', 'rx="9"'));                  // párna
            out.push(rect(bx + 44, by - 8, 82, 24, '#f6b5c5', 'rx="6"'));                  // takaró
            out.push(path('M' + (bx + 44) + ' ' + (by + 2) + ' h82', 'none', 'stroke="#ffffff" stroke-width="3" opacity=".6"'));
        }
        if (decor.agytakaro) {
            if (sofa) out.push(cushion(bx + 8, by - 14, 20, 20, '#f7a8c4', -5) + cushion(bx + 25, by - 12, 18, 18, '#9fd6f5', 6));
            // lelógó pléd a lábvégnél / a kar fölött (a kellékek alatt, nem takar semmit)
            if (sofa) out.push(path('M' + (bx + 116) + ' ' + (by - 6) + ' h16 v34 h-16z', '#fdf6fa', 'stroke="#d9c6ee" stroke-width=".9"') + line('M' + (bx + 116) + ' ' + (by + 8) + ' h16 M' + (bx + 116) + ' ' + (by + 16) + ' h16', '#f7a8c4', 1.6, 'opacity=".7"'));
            else out.push(path('M' + (bx + 90) + ' ' + (by + 14) + ' h36 v15 q-18 4 -36 0z', '#fdf6fa', 'stroke="#d9c6ee" stroke-width=".9"') + line('M' + (bx + 90) + ' ' + (by + 20) + ' h36', '#f7a8c4', 1.6, 'opacity=".7"'));
        }
        if (decor.novenyek) { out.push(prop('plant', 248, WB + 8, 42, { anim: 'sway' })); box('noveny', 'floor', 227, WB - 30, 269, WB + 8); }
        if (decor.tukor) {
            out.push(gshadow(180, WB + 8, 22, 0.15));
            out.push(rect(162, 94, 36, WB + 6 - 94, '#d6cfe6', 'rx="8"'));
            out.push(rect(166.5, 99, 27, WB - 100, '#eaf5fb', 'rx="5" stroke="none"'));
            out.push(path('M169 112 l22 -9 v10 l-22 9z', 'rgba(255,255,255,.75)', 'stroke="none"') + path('M169 150 l22 -17 v8 l-22 17z', 'rgba(255,255,255,.5)', 'stroke="none"'));
            box('tukor', 'floor', 162, 94, 198, WB + 6);
        }
        // kedvencek és macska: alváskor nem az ágyon (a karakter foglalja), hanem a macska a padlón, a plüss az ölelésben
        if (!sl) {
            if (buddyKey) { out.push(prop(buddyKey[0], (BUD[0] + BUD[1]) / 2, itemY, buddyKey[1], { noShadow: true, anim: 'breath', delay: 0.8 })); box('buddy', 'bed', (BUD[0] + BUD[1]) / 2 - buddyKey[1] / 2, itemY - 0.9 * buddyKey[1], (BUD[0] + BUD[1]) / 2 + buddyKey[1] / 2, itemY); }
            if (v.pets && v.pets.cica) { out.push(prop('cat', (CAT[0] + CAT[1]) / 2, itemY + 1, 36, { noShadow: true, flip: true, anim: 'breath' })); box('cica', 'bed', CAT[0], itemY - 31, CAT[1], itemY + 1); }
        } else if (v.pets && v.pets.cica) {
            out.push(gshadow(238, 276, 13, 0.14) + prop('cat', 238, 276, 30, { noShadow: true, flip: true, anim: 'breath' })); box('cica', 'floor', 223, 248, 253, 276);
        }
        if (bb === 'army') {
            // a cápahadsereg többi tagja a padlón, az ágy előtt (a karakter lába mellett, nem rajta)
            [[296, 264, 22, true], [322, 270, 22, false], [348, 264, 20, true]].forEach(function (c, i) {
                out.push(prop('shark', c[0], c[1], c[2], { flip: c[3] }));
                box('capa' + i, 'floor', c[0] - c[2] / 2, c[1] - 0.9 * c[2], c[0] + c[2] / 2, c[1]);
            });
        }

        // esti hangulat: a szoba a nappal-éjszaka ciklussal együtt halványan elsötétül (a karakter és a kellékek felett nem, csak a szobán)
        if (fx) out.push('<rect class="veil" x="0" y="0" width="400" height="300" fill="#2a2766" opacity="0" pointer-events="none" style="' + adl(DAY) + '"/>');

        // karakter: alszik az ágyban, tanul ülve egy puffon, vagy áll a padlón (mindig árnyékkal)
        var sc = (v.scale || 1) * 0.86;
        var base = { skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, eyes: v.eyeStyle, outfit: v.outfit, colors: v.colors, patterns: v.patterns, makeup: v.makeup, mood: v.mood, pose: v.pose, uid: 'rm' };
        if (v.sleeping) {
            out.push('<g transform="translate(' + (bx + 128) + ' ' + (by - 4) + ') rotate(-90) scale(' + sc.toFixed(3) + ')">' + A.avatar(Object.assign({}, base, { mood: 'sleep', pose: 'idle' })) + '</g>');
            // takaró a testen: a fejnél kezdődik a hasa alatt, a lábnál ér véget
            out.push(path('M' + (bx + 54) + ' ' + (by + 6) + ' C' + (bx + 54) + ' ' + (by - 12) + ' ' + (bx + 80) + ' ' + (by - 19) + ' ' + (bx + 104) + ' ' + (by - 14) + ' C' + (bx + 120) + ' ' + (by - 11) + ' ' + (bx + 130) + ' ' + (by - 4) + ' ' + (bx + 130) + ' ' + (by + 6) + ' L' + (bx + 130) + ' ' + (by + 22) + ' L' + (bx + 54) + ' ' + (by + 22) + 'Z', '#f6b5c5'));
            out.push(path('M' + (bx + 54) + ' ' + (by + 6) + ' C' + (bx + 54) + ' ' + (by - 2) + ' ' + (bx + 58) + ' ' + (by - 8) + ' ' + (bx + 64) + ' ' + (by - 12) + ' L' + (bx + 64) + ' ' + (by + 22) + ' L' + (bx + 54) + ' ' + (by + 22) + 'Z', '#ffffff', 'opacity=".8"'));
            out.push(line('M' + (bx + 84) + ' ' + (by - 14) + ' V' + (by + 22) + ' M' + (bx + 108) + ' ' + (by - 12) + ' V' + (by + 22), '#ffffff', 2.4, 'opacity=".45"'));
            [[bx + 40, by - 40, 1], [bx + 54, by - 52, 1.3], [bx + 70, by - 66, 1.6]].forEach(function (z, i) {
                out.push('<g class="zzz" style="animation-delay:' + (i * 0.6) + 's" transform="translate(' + z[0] + ' ' + z[1] + ') scale(' + z[2] + ')">' + line('M-3 -3 L3 -3 L-3 3 L3 3', '#7f9fe0', 1.6) + '</g>');
            });
        } else if (v.pose === 'sit') {
            var px = 206, ground = 266;
            out.push(gshadow(px, ground + 1, 26, 0.18));
            out.push(rect(px - 21, ground - 24, 42, 25, '#f5a9b8', 'rx="11"') + path('M' + (px - 17) + ' ' + (ground - 17) + ' q17 6 34 0', 'none', 'stroke="#ffffff" stroke-width="1.6" opacity=".55" stroke-linecap="round"'));
            out.push('<g transform="translate(' + px + ' ' + (ground - 24 + 52 * sc).toFixed(1) + ') scale(' + sc.toFixed(3) + ')">' + A.avatar(base) + '</g>');
            if (v.studying) out.push(prop('books', px, ground - 17, 26, { noShadow: true }));
        } else {
            out.push('<g class="av-wrap" transform="translate(206 266) scale(' + sc.toFixed(3) + ')">' + A.avatar(base) + '</g>');
            if (v.fx) out.push(A.fx(base.mood, 206 + 24 * sc, 266 - 162 * sc, sc * 1.1));
        }
        return { svg: '<svg class="eletut-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A szobád és a karaktered">' + propDefs() + out.join('') + '</svg>', boxes: boxes };
    }

    // háttér a közelkép- és arckép-nézetekhez: lágy, lapos színfoltok
    function softBg(wall, tag) {
        var o = [];
        o.push(flat(0, 0, 400, 300, shade(wall, 0.3)));
        o.push(flat(0, 210, 400, 90, shade(wall, 0.12)));
        [[60, 70, 34], [340, 60, 26], [330, 200, 40], [50, 230, 28], [120, 30, 14], [280, 110, 12]].forEach(function (b, i) {
            o.push(circ(b[0], b[1], b[2], ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][i % 4], 'opacity=".22" stroke="none"'));
        });
        [[90, 120], [310, 140], [70, 40], [350, 250]].forEach(function (p) {
            o.push(path('M' + p[0] + ' ' + (p[1] - 7) + ' l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z', '#ffffff', 'opacity=".9" class="twinkle" stroke="none"'));
        });
        return o.join('');
    }
    // Arckép: fej és váll nagyban (a Smink fülhöz)
    A.facecam = function (v) {
        var wall = WALLS[v.housing] || WALLS.szulo;
        var out = [softBg(wall)];
        out.push('<g transform="translate(200 594) scale(3.5)">' + A.avatar({
            skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, eyes: v.eyeStyle, outfit: v.outfit, colors: v.colors, patterns: v.patterns, makeup: v.makeup, mood: v.mood === 'happy' ? 'neutral' : v.mood, pose: 'idle', uid: 'fc'
        }) + '</g>');
        return '<svg class="eletut-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arckép a sminkhez">' + out.join('') + '</svg>';
    };

    // Közelkép: a karakter derékig, a szoba színeivel a háttérben (a "Közelkép" gombhoz)
    A.closeup = function (v) {
        var wall = WALLS[v.housing] || WALLS.szulo;
        var out = [softBg(wall)];
        var sc = 2.25 * (0.94 + 0.06 * (v.scale || 1));
        out.push('<g transform="translate(200 452) scale(' + sc.toFixed(3) + ')">' + A.avatar({
            skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, eyes: v.eyeStyle, outfit: v.outfit, colors: v.colors, patterns: v.patterns, makeup: v.makeup, mood: v.mood, pose: v.pose === 'sit' ? 'idle' : v.pose, uid: 'cu'
        }) + '</g>');
        return '<svg class="eletut-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Közelkép a karakteredről">' + out.join('') + '</svg>';
    };

    // =========================================================
    // ESEMÉNY-JELENETEK (400 x 240)
    // A talaj (padló/járda/fű) mindig y=172 alatt kezdődik; a karakterek talpa y=222 körül van, árnyékkal.
    // =========================================================
    var HZ = 172; // horizont / fal alja
    // Lebegő hangulatjelek a fej fölött (csak az élő színtéren; a CSS animálja, csökkentett mozgásnál állnak)
    var FX = {
        happy: ['#f58fae', 'heart'], proud: ['#ffd36b', 'star'], shy: ['#f58fae', 'heart'],
        sad: ['#8fc3ea', 'drop'], surprised: ['#ffd36b', 'bang']
    };
    A.fx = function (mood, x, y, sc) {
        var f = FX[mood];
        if (!f) return '';
        var shape = f[1] === 'heart' ? '<path d="M0 3 C-5 -1 -3 -5 0 -2.4 C3 -5 5 -1 0 3Z" fill="' + f[0] + '" stroke="#fff" stroke-width=".7"/>'
            : f[1] === 'star' ? '<path d="M0 -4 L1.2 -1.2 L4 0 L1.2 1.2 L0 4 L-1.2 1.2 L-4 0 L-1.2 -1.2Z" fill="' + f[0] + '" stroke="#fff" stroke-width=".6"/>'
            : f[1] === 'drop' ? '<path d="M0 -3.4 C2.6 0 2.4 2.6 0 2.8 C-2.4 2.6 -2.6 0 0 -3.4Z" fill="' + f[0] + '" stroke="#fff" stroke-width=".6"/>'
            : '<path d="M-.9 -4 H.9 L.6 .8 H-.6Z M0 3.4 m-1 0 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0" fill="' + f[0] + '"/>';
        var g = '', k = sc || 1;
        for (var i = 0; i < 3; i++) g += '<g transform="translate(' + (x + (i - 1) * 15 * k).toFixed(1) + ' ' + (y - (i % 2) * 7 * k).toFixed(1) + ') scale(' + (k * (1.5 - i * 0.2)).toFixed(2) + ')"><g class="fx-bit" style="animation-delay:' + (i * 0.7) + 's">' + shape + '</g></g>';
        return '<g class="fx-float" aria-hidden="true">' + g + '</g>';
    };
    function figure(x, y, o, scale) {
        var sc = scale || 0.78;
        if (o && o.emood) o = Object.assign({}, o, { mood: o.emood });
        return gshadow(x, y + 0.5, 21 * sc, 0.18) + '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' + A.avatar(o) + '</g>' + (o && o.fx ? A.fx(o.mood, x + 22 * sc, y - 162 * sc, sc * 1.1) : '');
    }
    // háttér-szereplők: ugyanaz a karakterrajz, más haj/ruha (n: egyedi azonosító a rajz-azonosítókhoz)
    var NPC = {
        anya: { skin: 's2', hairStyle: 'hosszu', hairColor: 'barna', outfit: { top: 'bluz', bottom: 'szoknya', shoes: 'maryjane' }, colors: { top: '#f2c9a8', bottom: '#8aa6d8' } },
        apa: { skin: 's2', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'polo', bottom: 'jogger', shoes: 'platform' }, colors: { top: '#7aa0d6', bottom: '#6d7a98' } },
        osztaly1: { skin: 's3', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'pulcsi', bottom: 'jogger' }, colors: { top: '#a285dc', bottom: '#5a6180' } },
        osztaly2: { skin: 's1', hairStyle: 'bob', hairColor: 'barna', outfit: { top: 'polo', bottom: 'szoknya' }, colors: { top: '#d97a8a', bottom: '#4a4056' } },
        kolléga: { skin: 's4', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'polo', bottom: 'jogger' }, colors: { top: '#9fb5d8', bottom: '#4a4056' } },
        c1: { skin: 's1', hairStyle: 'hosszu', hairColor: 'kek', outfit: { top: 'crop', bottom: 'szoknya', legs: 'combzokni' } },
        c2: { skin: 's3', hairStyle: 'bob', hairColor: 'lila', outfit: { top: 'pulcsi', bottom: 'tenisz', hair: 'macskaful' } },
        c3: { skin: 's2', hairStyle: 'rovid', hairColor: 'szoke', outfit: { top: 'polo', bottom: 'kilt', legs: 'zokni' } },
        c4: { skin: 's4', hairStyle: 'hosszu', hairColor: 'rozsa', outfit: { top: 'bluz', bottom: 'rovid', neck: 'choker' } },
        c5: { skin: 's1', hairStyle: 'bob', hairColor: 'feher', outfit: { top: 'crop', bottom: 'jogger', hair: 'headset' } }
    };
    function npc(key, x, y, scale, uid, mood) {
        var n = NPC[key];
        return figure(x, y, Object.assign({}, n, { uid: 'n' + (uid || key), mood: mood || 'neutral', pose: 'idle' }), scale);
    }
    function guestFigure(o, x, y, scale, mood) {
        var p = o && o.guest ? D.find(D.PEOPLE, o.guest) : null;
        if (!p) return '';
        var l = p.look;
        return figure(x, y, { skin: l.skin, hairStyle: l.hairStyle, hairColor: l.hairColor, outfit: l.outfit, makeup: l.makeup, mood: mood || l.mood || 'neutral', pose: 'idle', uid: 'g' + p.id }, scale);
    }
    // fal + padló + szegélylista
    function stageSet(wall, floor, o) {
        o = o || {};
        var hz = o.hz || HZ, s = '';
        s += flat(0, 0, 400, hz, wall);
        s += flat(0, hz - 26, 400, 26, shade(wall, -0.035)) + flat(0, hz - 27, 400, 1.6, shade(wall, -0.1));
        s += flat(0, hz - 4, 400, 6, shade(wall, 0.3)) + flat(0, hz + 2, 400, 1.2, shade(wall, -0.25), 'opacity=".5"');
        s += flat(0, hz + 2, 400, 240 - hz, floor);
        for (var i = 0; i < 4; i++) s += line('M0 ' + (hz + 16 + i * 17) + ' H400', shade(floor, -0.1), 1, 'opacity=".45"');
        return s;
    }
    function outdoorSet(skyTop, skyBot, ground, o) {
        o = o || {};
        var hz = o.hz || HZ, s = '';
        s += flat(0, 0, 400, hz * 0.55, skyTop) + flat(0, hz * 0.55, 400, hz * 0.45 + 1, skyBot);
        s += flat(0, hz, 400, 240 - hz, ground);
        if (o.curb) s += flat(0, hz, 400, 5, shade(ground, 0.2)) + flat(0, hz + 5, 400, 1.2, shade(ground, -0.25), 'opacity=".5"');
        return s;
    }
    function deskSet(x, y, w, legsTo) {
        legsTo = legsTo || 222;
        var s = gshadow(x + w / 2, legsTo + 2, w * 0.52, 0.14);
        s += rect(x + 8, y + 8, 6, legsTo - y - 8, '#c49e6c') + rect(x + w - 14, y + 8, 6, legsTo - y - 8, '#c49e6c');
        s += rect(x, y, w, 9, '#dcbd90', 'rx="3"');
        return s;
    }
    function bunting(y, n) {
        var s = '', cols = ['#f5a9b8', '#9fd6f5', '#fdf6fa', '#c3adee', '#ffe08a'];
        s += line('M0 ' + y + ' Q200 ' + (y + 24) + ' 400 ' + y, '#8a7a9a', 1.4);
        for (var i = 0; i < n; i++) {
            var t = (i + 0.5) / n;
            var bx = t * 400;
            var by = y + 24 * 2 * t * (1 - t);
            s += path('M' + (bx - 9) + ' ' + by.toFixed(1) + ' h18 l-9 18z', cols[i % cols.length]);
        }
        return s;
    }

    var SCENES = {
        room: function (v) { return A.room(v).replace('viewBox="0 0 400 300"', 'viewBox="0 20 400 260"'); },

        phone: function (o) {
            var s = stageSet('#2c2745', '#241f3a');
            s += circ(150, 100, 80, 'rgba(120,90,220,.22)', 'stroke="none"');
            s += deskSet(40, 150, 220);
            s += rect(78, 70, 150, 80, '#4a4060', 'rx="6"') + rect(84, 76, 138, 62, '#f6eefb', 'rx="3" class="scr" stroke="none"');
            s += rect(124, 148, 36, 4, '#5a4e72');
            s += rect(92, 84, 72, 36, '#c3adee', 'rx="4" stroke="none"') + path('M118 91 l22 11 -22 11z', '#ffffff', 'stroke="none"');
            s += rect(172, 84, 42, 8, '#f5a9b8', 'rx="4" stroke="none"') + rect(172, 98, 34, 8, '#9fd6f5', 'rx="4" stroke="none"') + rect(172, 112, 38, 8, '#f5a9b8', 'rx="4" stroke="none"');
            s += rect(92, 124, 100, 6, '#d8c6e8', 'rx="3" stroke="none"') + rect(92, 124, 44, 6, '#f5a9b8', 'rx="3" stroke="none"');
            s += prop('phone', 232, 150, 26, { shadow: 0.2 });
            s += star8(330, 52);
            s += figure(318, 224, Object.assign({}, o, { mood: 'happy', pose: 'phone' }), 0.82);
            return s;
        },

        shop: function (o) {
            var s = stageSet('#fdeef2', '#e6cdb5');
            // ruhaállvány: rúd + két láb, a ruhák a rúdról lógnak
            s += gshadow(150, 218, 110, 0.14);
            s += rect(48, 62, 5, 160, '#b8aac8') + rect(248, 62, 5, 160, '#b8aac8') + rect(44, 62, 214, 5, '#9a8cb0', 'rx="2.5"');
            s += rect(36, 218, 32, 5, '#b8aac8', 'rx="2.5"') + rect(236, 218, 32, 5, '#b8aac8', 'rx="2.5"');
            [['tshirt', 82], ['dress', 120], ['tshirt', 158], ['dress', 196], ['tshirt', 232]].forEach(function (it, i) {
                s += line('M' + it[1] + ' 63 l0 5', '#9a8cb0', 1.4) + prop(it[0], it[1], 62 + 40 * 0.94 + 5, 40, { noShadow: true });
            });
            s += rect(268, 36, 114, 32, '#f5a9b8', 'rx="7"') + rect(278, 45, 94, 4, '#ffffff', 'stroke="none"') + rect(278, 54, 60, 4, 'rgba(255,255,255,.8)', 'stroke="none"');
            s += prop('shopping', 250, 224, 46) + prop('ballet', 98, 222, 30);
            s += figure(330, 224, o, 0.82);
            return s;
        },

        family: function (o) {
            var s = stageSet('#fbe9d9', '#d9b98c');
            [[36, 66], [66, 56], [96, 70]].forEach(function (p) { s += prop('picture', p[0] + 10, p[1] + 30, 30, { noShadow: true }); });
            s += prop('couch', 236, 206, 128);
            s += npc('anya', 80, 222, 0.78, 'a');
            s += npc('apa', 132, 222, 0.78, 'b');
            s += figure(344, 224, o, 0.8);
            return s;
        },

        work: function (o) {
            var s = outdoorSet('#9fd6f5', '#d8f0fc', '#f3dfb7', { curb: true });
            s += prop('sun', 350, 52, 40, { noShadow: true });
            s += prop('cloud', 70, 62, 44, { noShadow: true });
            // fagyizó pavilon: pult + csíkos napellenző, a pult a földön áll
            s += gshadow(122, 200, 92, 0.16);
            s += rect(34, 118, 176, 82, '#fdf6fa', 'rx="5"');
            s += rect(34, 170, 176, 30, '#f5a9b8', 'rx="3"');
            s += rect(48, 134, 36, 28, '#bfe3f8', 'rx="3"') + rect(98, 134, 36, 28, '#ffe0a0', 'rx="3"') + rect(148, 134, 36, 28, '#bfe3f8', 'rx="3"');
            for (var i = 0; i < 8; i++) s += path('M' + (22 + i * 25) + ' 110 h25 v10 q-12.5 10 -25 0z', i % 2 ? '#ffffff' : '#f5a9b8');
            s += path('M22 110 l24 -28 h128 l24 28z', '#f5a9b8');
            s += prop('icecream', 122, 86, 34, { noShadow: true });
            s += figure(310, 224, o, 0.82);
            return s;
        },

        school: function (o) {
            var s = stageSet('#e9eef7', '#cfd6c4');
            for (var i = 0; i < 9; i++) {
                var c = i % 2 ? '#9fd6f5' : '#f5a9b8';
                s += rect(8 + i * 43, 30, 39, 142, c, 'rx="2"') + rect(16 + i * 43, 54, 23, 4, 'rgba(255,255,255,.75)', 'stroke="none"') + rect(16 + i * 43, 62, 23, 4, 'rgba(255,255,255,.75)', 'stroke="none"') + circ(36 + i * 43, 112, 2.2, '#ffffff');
            }
            s += prop('backpack', 232, 218, 28);
            s += npc('osztaly1', 108, 222, 0.78, 'a') + npc('osztaly2', 158, 222, 0.78, 'b', 'happy');
            s += figure(300, 224, o, 0.82);
            return s;
        },

        discord: function (o) {
            var s = stageSet('#2d2a4a', '#25223d');
            s += circ(140, 100, 90, 'rgba(110,90,230,.2)', 'stroke="none"');
            s += deskSet(24, 152, 252);
            s += rect(40, 32, 220, 120, '#4a4060', 'rx="7"') + rect(46, 38, 208, 108, '#38355c', 'rx="4" class="scr" stroke="none"') + rect(46, 38, 40, 108, '#2a2748', 'rx="4" stroke="none"');
            [0, 1, 2, 3].forEach(function (i) { s += circ(66, 58 + i * 26, 9, ['#f5a9b8', '#9fd6f5', '#c3adee', '#ffe08a'][i], 'stroke="none"'); });
            [[96, 48, 100], [96, 76, 130], [96, 104, 80]].forEach(function (r, i) { s += circ(102, r[1] + 5, 6, ['#f5a9b8', '#9fd6f5', '#c3adee'][i], 'stroke="none"') + rect(114, r[1], r[2], 6, 'rgba(255,255,255,.75)', 'rx="3" stroke="none"') + rect(114, r[1] + 10, r[2] * 0.6, 5, 'rgba(255,255,255,.4)', 'rx="2.5" stroke="none"'); });
            s += rect(94, 126, 150, 12, '#2a2748', 'rx="6" stroke="none"');
            s += rect(140, 152, 40, 4, '#5a4e72');
            s += prop('heart', 292, 90, 30, { noShadow: true }) + star8(350, 56);
            s += figure(330, 224, Object.assign({}, o, { mood: 'happy', pose: 'phone' }), 0.82);
            return s;
        },

        con: function (o) {
            var s = stageSet('#f3e4f4', '#c9bfe3');
            s += bunting(8, 11);
            s += rect(110, 44, 180, 40, '#ffffff', 'rx="8" stroke="#f5a9b8" stroke-width="2.4"') + rect(130, 56, 140, 6, '#f5a9b8', 'rx="3" stroke="none"') + rect(150, 68, 100, 5, '#9fd6f5', 'rx="2.5" stroke="none"');
            // standok a hátsó sorban
            s += deskSet(14, 134, 96, 178) + prop('transflag', 38, 134, 34, { noShadow: true }) + prop('teddy', 78, 134, 26, { noShadow: true });
            s += deskSet(290, 134, 96, 178) + prop('rainbowflag', 316, 134, 34, { noShadow: true }) + prop('balloon', 360, 128, 34, { noShadow: true });
            // tömeg: kisebb, távolabbi alakok
            s += npc('c1', 70, 200, 0.5, '1') + npc('c3', 330, 200, 0.5, '3') + npc('c2', 130, 204, 0.56, '2') + npc('c5', 270, 204, 0.56, '5');
            s += figure(200, 228, Object.assign({}, o, { mood: 'happy', pose: 'wave' }), 0.86);
            return s;
        },

        casino: function (o) {
            var s = stageSet('#2a1740', '#3d2360');
            for (var i = 0; i < 8; i++) s += path('M' + (i * 56 - 10) + ' ' + (HZ + 44) + ' l28 -14 28 14 -28 14z', 'rgba(255,255,255,.04)', 'stroke="none"');
            [26, 112, 198].forEach(function (x, i) { s += prop('slot', x + 40, 206, 86) ; s += circ(x + 14, 170, 4, '#ffe08a', 'class="twinkle" style="animation-delay:' + (i * 0.3) + 's" stroke="none"'); });
            s += prop('die', 296, 214, 24, { shadow: 0.25 });
            s += figure(350, 226, Object.assign({}, o, { mood: 'worried' }), 0.82);
            return s;
        },

        moving: function (o) {
            var s = outdoorSet('#bfe3f8', '#eef7fc', '#c8c2d6', { curb: true });
            s += prop('house', 330, 178, 72, { noShadow: true }) + prop('tree', 218, 180, 64, { noShadow: true }) + prop('pine', 48, 180, 56, { noShadow: true });
            s += prop('truck', 120, 212, 140);
            s += prop('package', 236, 218, 34) + prop('package', 262, 218, 30) + prop('package', 249, 194, 28, { noShadow: true });
            s += figure(334, 226, o, 0.86);
            return s;
        },

        office: function (o) {
            var s = stageSet('#e9eef7', '#cdd3e0');
            s += rect(236, 22, 140, 108, '#ffffff', 'rx="6"') + prop('city', 306, 124, 100, { noShadow: true });
            s += deskSet(20, 142, 200, 214);
            s += prop('laptop', 70, 143, 46, { shadow: 0.1 }) + prop('plant', 150, 143, 34, { shadow: 0.1 }) + prop('coffee', 118, 143, 20, { shadow: 0.1 }) + prop('memo', 188, 143, 24, { shadow: 0.1 });
            s += npc('kolléga', 292, 222, 0.78, 'a');
            s += figure(110, 226, o, 0.82);
            return s;
        },

        stage: function (o) {
            var s = flat(0, 0, 400, 240, '#241a3a');
            s += path('M170 0 h60 l60 190 h-180z', 'rgba(255,244,201,.18)', 'stroke="none"');
            s += path('M0 0 h60 q-20 90 -10 190 h-50z M400 0 h-60 q20 90 10 190 h50z', '#c1476f');
            s += flat(0, 188, 400, 52, '#6b4a8a') + flat(0, 188, 400, 6, '#f5a9b8');
            for (var i = 0; i < 6; i++) s += line('M0 ' + (200 + i * 9) + ' H400', '#5a3c78', 1, 'opacity=".6"');
            s += prop('studiomic', 268, 214, 54);
            // közönség: sötét sziluettek az előtérben
            for (var k = 0; k < 11; k++) { var cx = 14 + k * 36 + (k % 2) * 8, cy = 236 + (k % 3) * 2; s += circ(cx, cy - 12, 12, '#3a2a58', 'stroke="none"') + ell(cx, cy + 6, 17, 14, '#3a2a58', 'stroke="none"'); }
            s += figure(204, 222, Object.assign({}, o, { mood: 'proud', pose: 'hips' }), 0.86);
            return s;
        },

        sunset: function (o) {
            var s = flat(0, 0, 400, 70, '#8a7ad8') + flat(0, 70, 400, 50, '#c796d0') + flat(0, 120, 400, 40, '#f5a9b8') + flat(0, 160, 400, 30, '#ffe0a8');
            s += circ(200, 150, 50, '#fff4d0', 'opacity=".95" stroke="none"');
            [[0, 104, 46], [46, 90, 40], [86, 110, 40], [126, 82, 50], [176, 118, 36], [212, 96, 44], [256, 112, 40], [296, 86, 46], [342, 108, 58]].forEach(function (b) { s += rect(b[0], b[1] + 30, b[2], 200 - b[1] - 30, '#5a4a7e', 'opacity=".95"'); });
            for (var i = 0; i < 14; i++) s += circ(20 + i * 28, 22 + (i * 37) % 60, 1.5, '#ffffff', 'opacity=".75" stroke="none"');
            // tetőterasz: itt áll a karakter
            s += flat(0, 196, 400, 44, '#3a2c58') + rect(60, 190, 280, 8, '#6a5a98', 'rx="2"');
            s += rect(66, 160, 4, 30, '#6a5a98') + rect(330, 160, 4, 30, '#6a5a98') + rect(64, 158, 272, 4, '#6a5a98', 'rx="2"');
            s += figure(200, 194, Object.assign({}, o, { mood: 'proud' }), 0.8);
            return s;
        },

        cafe: function (o) {
            var s = stageSet('#fbeee3', '#d9b98c');
            s += rect(26, 22, 130, 104, '#bfe3f8', 'rx="4" stroke="#ffffff" stroke-width="4"') + line('M91 22 v104 M26 74 h130', '#ffffff', 4);
            s += rect(20, 128, 142, 6, '#ffffff', 'rx="2"') + prop('plant', 130, 128, 26, { noShadow: true });
            // kis kerek asztal két székkel
            s += gshadow(246, 220, 52, 0.15);
            s += rect(243, 150, 6, 70, '#b8935e') + ell(246, 150, 46, 8, '#dcbd90') + rect(214, 216, 64, 5, '#b8935e', 'rx="2.5"');
            s += prop('coffee', 232, 152, 26, { noShadow: true }) + prop('cake', 262, 152, 24, { noShadow: true });
            s += prop('heart', 246, 118, 28, { noShadow: true });
            s += guestFigure(o, 110, 226, 0.82, 'happy');
            s += figure(346, 226, Object.assign({}, o, { mood: 'happy' }), 0.82);
            return s;
        },

        friends: function (o) {
            var s = outdoorSet('#bfe3f8', '#eaf6f0', '#b9dfae');
            s += prop('sun', 346, 46, 38, { noShadow: true }) + prop('cloud', 90, 50, 44, { noShadow: true }) + prop('cloud', 160, 70, 30, { noShadow: true });
            s += prop('tree', 40, 196, 96) + prop('tree', 366, 192, 92);
            // pad: háttámla + ülés, mindkettő a földre áll
            s += gshadow(200, 200, 100, 0.14);
            s += rect(112, 144, 176, 8, '#d9b98c', 'rx="3"') + rect(122, 152, 5, 26, '#b8935e') + rect(272, 152, 5, 26, '#b8935e');
            s += rect(110, 176, 180, 8, '#dcbd90', 'rx="3"') + rect(120, 184, 7, 16, '#b8935e') + rect(274, 184, 7, 16, '#b8935e');
            s += guestFigure(o, 150, 228, 0.82, 'happy');
            s += figure(252, 228, Object.assign({}, o, { mood: 'happy' }), 0.82);
            return s;
        },

        street: function (o) {
            var s = outdoorSet('#bfe3f8', '#f3eefc', '#b7b0c6', { curb: true });
            s += prop('house', 40, 178, 78, { noShadow: true }) + prop('dept', 130, 178, 112, { noShadow: true }) + prop('office', 236, 178, 96, { noShadow: true }) + prop('store', 330, 178, 84, { noShadow: true });
            s += flat(0, HZ + 6, 400, 22, '#c9c3d6');                                    // járda
            s += rect(300, 118, 5, 56, '#8a7a9a') + rect(282, 114, 42, 16, '#f5a9b8', 'rx="4"');
            for (var i = 0; i < 6; i++) s += rect(20 + i * 70, 224, 36, 4, 'rgba(255,255,255,.55)', 'rx="2" stroke="none"');
            s += figure(210, 214, Object.assign({}, o, { mood: 'happy' }), 0.82);
            return s;
        },

        bills: function (o) {
            var s = stageSet('#efe6f2', '#d6c4b0');
            s += deskSet(18, 146, 240, 216);
            s += prop('receipt', 58, 147, 36, { shadow: 0.08 }) + prop('memo', 106, 147, 34, { shadow: 0.08 }) + prop('banknote', 156, 147, 30, { shadow: 0.08 }) + prop('moneybag', 200, 147, 32, { shadow: 0.1 });
            s += rect(224, 106, 30, 42, '#4a4060', 'rx="4"') + rect(228, 110, 22, 10, '#9fd6f5', 'rx="1" stroke="none"') + [0, 1, 2].map(function (i) { return rect(228 + i * 8, 126, 6, 5, '#f5a9b8', 'rx="1" stroke="none"'); }).join('');
            s += figure(326, 226, Object.assign({}, o, { mood: 'worried' }), 0.82);
            return s;
        }
    };
    function star8(x, y) { return path('M' + x + ' ' + (y - 8) + ' l2.4 5.4 5.6 .8 -4 4 1 5.6 -5 -2.8 -5 2.8 1 -5.6 -4 -4 5.6 -.8z', '#ffe08a', 'opacity=".9"'); }
    A.SCENES = Object.keys(SCENES);

    // o: {skin, hairStyle, hairColor, outfit, mood, scale, ...}  v: teljes szoba-nézet (csak a "room" jelenethez)
    A.scene = function (id, v) {
        var fn = SCENES[id] || SCENES.room;
        var body = fn(id === 'room' ? v : { skin: v.skin, hairStyle: v.hairStyle, hairColor: v.hairColor, eyes: v.eyeStyle, outfit: v.outfit, colors: v.colors, patterns: v.patterns, makeup: v.makeup, mood: v.mood, emood: v.emood, fx: v.fx, uid: 'sc' + id, guest: v.guest });
        if (id === 'room') return body;
        return '<svg class="eletut-svg" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illusztráció">' + propDefs() + body + '</svg>';
    };

    // Az állapotból rajz-nézet
    A.viewOf = function (s) {
        var E = M.engine;
        var d = E.derive(s);
        var age = E.ageFloat(s);
        var mood = 'neutral';
        var sleeping = s.energy < 8, drowsy = s.energy < 25;
        if (sleeping) mood = 'sleep';
        else if (E.isSecret(s) && s.risk >= 70) mood = 'worried';
        else if (s.flags && s.flags._happy) mood = 'happy';
        else if (s.conf > 5000) mood = 'proud';
        else if (drowsy) mood = 'sleepy';
        return {
            housing: s.housing, comp: s.comp, decor: s.decor, pets: s.pets,
            outfit: (function () { var vis = {}; var list = E.visibleOutfit(s); D.SLOTS.forEach(function (sl) { if (sl.wear && list.indexOf(s.equipped[sl.id]) >= 0 && s.equipped[sl.id]) vis[sl.id] = s.equipped[sl.id]; }); return vis; })(),
            colors: (E.isSecret(s) && s.hiding) ? {} : E.outfitColors(s),
            patterns: (E.isSecret(s) && s.hiding) ? {} : E.outfitPats(s),
            makeup: E.lookOf(s),
            pack: (E.isSecret(s) && s.hiding) ? {} : { gear: s.equipped.gear, drink: s.equipped.drink, buddy: s.equipped.buddy },
            skin: s.skin, hairStyle: s.hairStyle, hairColor: s.hairColor, eyeStyle: s.eyeStyle,
            mood: mood, pose: sleeping ? 'idle' : (s.activeSkill && mood !== 'happy' ? 'sit' : (mood === 'happy' ? 'wave' : (mood === 'proud' ? 'hips' : 'idle'))), scale: 0.9 + 0.1 * Math.min(1, (age - 14) / 5), month: s.month,
            studying: !!s.activeSkill, working: !!s.job, broken: d.broken, sleeping: sleeping
        };
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof globalThis !== 'undefined' ? globalThis : this);
