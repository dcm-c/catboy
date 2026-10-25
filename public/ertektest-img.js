// =========================================================
// ÉRTÉKTEST - kategóriánkénti eredménykép (canvas, 1080 × 1350)
// Négy kép: Értékrend-térkép, Utált értékek, Előítélet-barométer, Megbízhatóság. Mindegyik letölthető és megosztható.
// A rajzoló függvények egy 2D rajzolási környezetet kapnak, így Node-ban egy tesztkörnyezettel is kipróbálhatók.
// =========================================================
(function (root) {
    'use strict';

    var data = (typeof module !== 'undefined' && module.exports) ? require('./ertektest-data.js') : root.MFSZErtek.data;
    var core = (typeof module !== 'undefined' && module.exports) ? require('./ertektest-core.js') : root.MFSZErtek.core;

    var W = 1080, H = 1350, PAD = 60;
    var FONT = '"Quicksand", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
    var EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    var C = {
        ink: '#2a2540', soft: '#6b6486', blue: '#3fb4e8', pink: '#f27aa3', track: 'rgba(42,37,64,.10)', white: '#ffffff',
        good: '#2fa66a', mid: '#f0a229', bad: '#e0484f', stripe: ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa']
    };

    function font(px, weight) { return (weight || 600) + ' ' + px + 'px ' + FONT; }

    function rrect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
    function fillRR(ctx, x, y, w, h, r, fill) { rrect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }

    function text(ctx, str, x, y, px, weight, color, align) {
        ctx.font = font(px, weight);
        ctx.fillStyle = color || C.ink;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(str, x, y);
    }
    function emoji(ctx, str, x, y, px, align) {
        ctx.font = px + 'px ' + EMOJI;
        ctx.textAlign = align || 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = C.ink;
        ctx.fillText(str, x, y);
    }
    // Sortörés: a sorokat visszaadja (legfeljebb maxLines, a végén kihagyással)
    function wrap(ctx, str, maxW, px, weight, maxLines) {
        ctx.font = font(px, weight);
        var words = String(str).split(/\s+/), lines = [], cur = '';
        words.forEach(function (w) {
            var t = cur ? cur + ' ' + w : w;
            if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
        });
        if (cur) lines.push(cur);
        if (maxLines && lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*$/, '') + '…';
        }
        return lines;
    }
    function paragraph(ctx, str, x, y, maxW, px, weight, color, lineH, maxLines, align) {
        var lines = wrap(ctx, str, maxW, px, weight, maxLines);
        lines.forEach(function (l, i) { text(ctx, l, x, y + i * lineH, px, weight, color, align); });
        return lines.length;
    }
    function pill(ctx, x, y, str, px, bg, fg, align) {
        ctx.font = font(px, 700);
        var w = ctx.measureText(str).width + px * 1.4, h = px * 1.75;
        var left = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
        fillRR(ctx, left, y, w, h, h / 2, bg);
        text(ctx, str, left + w / 2, y + h * 0.69, px, 700, fg || C.white, 'center');
        return { x: left, w: w, h: h };
    }

    function frame(ctx, kicker, version) {
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#e2f5ff'); g.addColorStop(1, '#ffe9f1');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        C.stripe.forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(0, i * 10, W, 10); });
        text(ctx, 'ÉRTÉKTEST · MFSZ', PAD, 92, 24, 700, C.soft);
        text(ctx, kicker, W - PAD, 92, 24, 700, C.soft, 'right');
        text(ctx, 'femboy.hu/ertektest.html  ·  v' + version + '  ·  szórakoztató teszt, nem tudományos mérés', W / 2, H - 32, 21, 600, C.soft, 'center');
    }

    function level(rel, a) { return rel && rel.axes && a in rel.axes ? rel.axes[a] : null; }
    var LEVEL_COLOR = [C.bad, C.mid, C.good];

    // ---------- 1. Értékrend-térkép ----------
    function drawValues(ctx, r, defs) {
        frame(ctx, 'ÉRTÉKREND-TÉRKÉP', r.ver || data.VERSION);
        var ar = core.find(defs.ARCHETYPES, r.a);
        fillRR(ctx, PAD, 120, W - 2 * PAD, 230, 36, 'rgba(255,255,255,.85)');
        emoji(ctx, ar ? ar.emoji : '🧭', PAD + 110, 255, 110);
        paragraph(ctx, ar ? ar.title : 'Értékrend', PAD + 220, 205, W - 2 * PAD - 250, 42, 800, C.ink, 50, 2);
        pill(ctx, PAD + 220, 270, r.fit + '% illeszkedés', 26, C.pink, C.white);
        if (r.rel) {
            var tier = core.relTier(r.rel.index);
            pill(ctx, PAD + 220 + 270, 270, 'Megbízhatóság: ' + tier.name.toLowerCase(), 24, LEVEL_COLOR[r.rel.index >= 80 ? 2 : r.rel.index >= 40 ? 1 : 0], C.white);
        }

        var y = 390, groups = [], gi = {};
        defs.AXES.forEach(function (a) {
            var g = a.group || 'Értékrend';
            if (!(g in gi)) { gi[g] = groups.length; groups.push({ name: g, axes: [] }); }
            groups[gi[g]].axes.push(a);
        });
        var barX = 330, barW = 540, rowH = groups.length > 1 ? 72 : 100;
        groups.forEach(function (g) {
            if (groups.length > 1) { text(ctx, g.name.toUpperCase(), PAD, y + 18, 22, 800, C.blue); y += 34; }
            g.axes.forEach(function (a) {
                var sc = r.s[a.id] || 0;
                emoji(ctx, a.icon, PAD + 22, y + 34, 34);
                text(ctx, a.name, PAD + 62, y + 33, 30, 700, C.ink);
                fillRR(ctx, barX, y + 14, barW, 22, 11, C.track);
                var half = barW / 2, w = Math.abs(sc) / 100 * half;
                var col = sc >= 0 ? C.pink : C.blue;
                if (w > 0) fillRR(ctx, sc >= 0 ? barX + half : barX + half - w, y + 14, Math.max(w, 6), 22, 11, col);
                ctx.fillStyle = C.ink; ctx.fillRect(barX + half - 1.5, y + 8, 3, 34);
                var lv = level(r.rel, a.id);
                if (lv !== null) { ctx.beginPath(); ctx.arc(barX + barW + 24, y + 25, 9, 0, Math.PI * 2); ctx.fillStyle = LEVEL_COLOR[lv]; ctx.fill(); }
                var label = sc === 0 ? '0%' : Math.abs(sc) + '%';
                ctx.font = font(22, 700);
                text(ctx, label, W - PAD, y + 34, 26, 800, sc >= 0 ? C.pink : C.blue, 'right');
                text(ctx, a.neg, barX, y + 62, 19, 600, C.soft, 'left');
                text(ctx, a.pos, barX + barW, y + 62, 19, 600, C.soft, 'right');
                y += rowH;
            });
            y += 6;
        });
        if (r.rel) {
            ctx.beginPath(); ctx.arc(PAD + 12, H - 80, 9, 0, Math.PI * 2); ctx.fillStyle = C.good; ctx.fill();
            text(ctx, 'biztos', PAD + 30, H - 73, 20, 600, C.soft);
            ctx.beginPath(); ctx.arc(PAD + 140, H - 80, 9, 0, Math.PI * 2); ctx.fillStyle = C.mid; ctx.fill();
            text(ctx, 'közepes', PAD + 158, H - 73, 20, 600, C.soft);
            ctx.beginPath(); ctx.arc(PAD + 290, H - 80, 9, 0, Math.PI * 2); ctx.fillStyle = C.bad; ctx.fill();
            text(ctx, 'bizonytalan tengely', PAD + 308, H - 73, 20, 600, C.soft);
        }
    }

    // ---------- 2. Utált értékek ----------
    function scaleRows(r, defs) {
        if (r.hs) return core.hatedRanking(r.hs, defs.HATED).map(function (x) { return { id: x.id, score: x.score }; });
        if (r.counts) {
            return defs.HATED.map(function (h, i) { return { id: h.id, score: Math.round((r.counts[h.id] || 0) / 2 * 100), i: i }; })
                .sort(function (a, b) { return b.score - a.score || a.i - b.i; });
        }
        return null;
    }
    function barRow(ctx, y, name, score, hot, icon) {
        if (icon) emoji(ctx, icon, PAD + 22, y + 36, 34);
        text(ctx, name, PAD + (icon ? 62 : 0), y + 36, 29, hot ? 800 : 600, C.ink);
        var x = 520, w = W - PAD - x - 120;
        fillRR(ctx, x, y + 14, w, 26, 13, C.track);
        var col = score >= 58 ? C.bad : score <= 42 ? C.blue : C.mid;
        fillRR(ctx, x, y + 14, Math.max(8, w * score / 100), 26, 13, col);
        ctx.fillStyle = C.ink; ctx.fillRect(x + w / 2 - 1.5, y + 8, 3, 38);
        text(ctx, score + '', W - PAD, y + 37, 28, 800, col, 'right');
    }
    // Széles változat: a felirat a sáv fölött áll (hosszú nevekhez)
    function barRowWide(ctx, y, name, score) {
        text(ctx, name, PAD, y + 22, 25, 600, C.ink);
        var x = PAD, w = W - 2 * PAD - 90;
        fillRR(ctx, x, y + 34, w, 24, 12, C.track);
        var col = score >= 58 ? C.bad : score <= 42 ? C.blue : C.mid;
        fillRR(ctx, x, y + 34, Math.max(8, w * score / 100), 24, 12, col);
        ctx.fillStyle = C.ink; ctx.fillRect(x + w / 2 - 1.5, y + 28, 3, 36);
        text(ctx, score + '', W - PAD, y + 56, 28, 800, col, 'right');
    }
    function drawHated(ctx, r, defs) {
        frame(ctx, 'UTÁLT ÉRTÉKEK', r.ver || data.VERSION);
        var rows = scaleRows(r, defs);
        var topIds = r.h && r.h.length ? r.h : (rows ? rows.filter(function (x) { return x.score >= 58; }).map(function (x) { return x.id; }) : []);
        var top = topIds.length ? core.find(defs.HATED, topIds[0]) : null;
        fillRR(ctx, PAD, 120, W - 2 * PAD, 300, 36, 'rgba(255,255,255,.85)');
        emoji(ctx, '🙅', PAD + 110, 250, 110);
        text(ctx, top ? 'Legjobban zavar' : 'Békés lélek', PAD + 220, 185, 24, 700, C.soft);
        paragraph(ctx, top ? top.name : 'Nincs kirívó utált érték', PAD + 220, 238, W - 2 * PAD - 250, 46, 800, C.ink, 54, 2);
        if (top) paragraph(ctx, top.roast, PAD + 220, 310, W - 2 * PAD - 250, 23, 600, C.soft, 31, 3);
        if (r.rel) {
            var tier = core.relTier(r.rel.index);
            pill(ctx, W - PAD - 30, 372, 'megbízhatóság: ' + tier.name.toLowerCase(), 20, LEVEL_COLOR[r.rel.index >= 80 ? 2 : r.rel.index >= 40 ? 1 : 0], C.white, 'right');
        }
        if (rows) {
            var y = 450;
            text(ctx, 'Minél hosszabb a sáv, annál jobban zavar. Középen (50) a semleges.', PAD, y, 22, 600, C.soft);
            y += 22;
            rows.forEach(function (x, i) {
                barRow(ctx, y, core.find(defs.HATED, x.id).name, x.score, i === 0 && x.score >= 58);
                y += 72;
            });
        } else {
            var y2 = 470;
            topIds.slice(0, 3).forEach(function (id, i) {
                var h = core.find(defs.HATED, id);
                fillRR(ctx, PAD, y2, W - 2 * PAD, 150, 28, 'rgba(255,255,255,.8)');
                text(ctx, (i + 1) + '. ' + h.name, PAD + 30, y2 + 62, 38, 800, C.ink);
                paragraph(ctx, h.blurb, PAD + 30, y2 + 106, W - 2 * PAD - 60, 24, 600, C.soft, 30, 2);
                y2 += 170;
            });
        }
    }

    // ---------- 3. Előítélet-barométer ----------
    function drawPrej(ctx, r, defs) {
        frame(ctx, 'ELŐÍTÉLET-BAROMÉTER', r.ver || data.VERSION);
        fillRR(ctx, PAD, 120, W - 2 * PAD, 190, 36, 'rgba(255,255,255,.85)');
        emoji(ctx, '📊', PAD + 110, 235, 100);
        text(ctx, r.pj ? 'Fenntartás témánként, két irányban' : 'Melyik oldal lenézése zavar jobban?', PAD + 220, 190, 26, 800, C.ink);
        paragraph(ctx, r.pj ? '50 a semleges, a magasabb érték nagyobb fenntartás. Játékos felmérés, nem minősít senkit.' : 'Jobbra: a kisebbségi oldal lenézése zavar jobban, balra: a többségié.', PAD + 220, 232, W - 2 * PAD - 250, 22, 600, C.soft, 29, 3);
        var y = 340;
        data.TOPICS.forEach(function (t) {
            emoji(ctx, t.icon, PAD + 26, y + 46, 40);
            text(ctx, t.name, PAD + 70, y + 44, 31, 800, C.ink);
            y += 62;
            if (r.pj) {
                barRowWide(ctx, y, t.up, r.pj[t.id + '_up']);
                barRowWide(ctx, y + 68, t.dn, r.pj[t.id + '_dn']);
                y += 150;
            } else if (r.m) {
                var sc = r.m[t.id] || 0, barX = 120, bw = W - 2 * barX, half = bw / 2, w = Math.abs(sc) / 100 * half;
                fillRR(ctx, barX, y + 8, bw, 26, 13, C.track);
                if (w > 0) fillRR(ctx, sc >= 0 ? barX + half : barX + half - w, y + 8, Math.max(w, 8), 26, 13, sc >= 0 ? C.pink : C.blue);
                ctx.fillStyle = C.ink; ctx.fillRect(barX + half - 1.5, y + 2, 3, 38);
                text(ctx, t.majSide, barX, y + 66, 20, 600, C.soft, 'left');
                text(ctx, t.minSide, barX + bw, y + 66, 20, 600, C.soft, 'right');
                y += 110;
            }
        });
        if (r.rel) {
            var tier = core.relTier(r.rel.index);
            pill(ctx, W - PAD, H - 120, 'megbízhatóság: ' + tier.name.toLowerCase(), 20, LEVEL_COLOR[r.rel.index >= 80 ? 2 : r.rel.index >= 40 ? 1 : 0], C.white, 'right');
        }
    }

    // ---------- 4. Megbízhatóság ----------
    function drawTrust(ctx, r) {
        frame(ctx, 'MEGBÍZHATÓSÁG', r.ver || data.VERSION);
        var index = r.rel ? r.rel.index : (r.honesty ? r.honesty.index : 0);
        var tier = r.rel ? core.relTier(index) : core.honestyTier(index);
        var col = LEVEL_COLOR[index >= 80 ? 2 : index >= 40 ? 1 : 0];
        // félkör mérő
        var cx = W / 2, cy = 470, rad = 230;
        ctx.lineCap = 'round';
        ctx.lineWidth = 46; ctx.strokeStyle = C.track;
        ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, Math.PI + Math.PI * index / 100); ctx.stroke();
        text(ctx, index + '%', cx, cy - 10, 120, 800, C.ink, 'center');
        text(ctx, tier.name, cx, cy + 62, 46, 800, col, 'center');
        paragraph(ctx, tier.text, cx, cy + 118, W - 2 * PAD - 80, 26, 600, C.soft, 34, 3, 'center');

        var y = 710;
        var flags = r.rel ? r.rel.flags.map(function (id) { return core.find(data.REL_FLAGS, id); }).filter(Boolean) : [];
        if (r.honesty && !r.rel) {
            if (r.honesty.straight) flags.push(core.find(data.REL_FLAGS, 'straight'));
            if (r.honesty.liesN) flags.push(core.find(data.REL_FLAGS, 'lies'));
            if (r.honesty.twinsN) flags.push(core.find(data.REL_FLAGS, 'twins'));
        }
        text(ctx, flags.length ? 'Ezek rontották' : 'Nem találtunk ellentmondást vagy gyanús mintát', PAD, y, 26, 800, C.ink);
        y += 14;
        flags.slice(0, 5).forEach(function (f) {
            var n = paragraph(ctx, f.text, PAD + 44, y + 42, W - 2 * PAD - 60, 25, 600, C.ink, 32, 2);
            ctx.beginPath(); ctx.arc(PAD + 14, y + 33, 9, 0, Math.PI * 2); ctx.fillStyle = C.mid; ctx.fill();
            y += 24 + n * 32;
        });
        if (r.honesty) {
            y = Math.max(y + 20, 1010);
            var parts = [];
            parts.push('Őszinteség: ' + core.honestyTier(r.honesty.index).name.toLowerCase() + ' (' + r.honesty.index + '%)');
            if (r.honesty.liesN) parts.push(r.honesty.liesN + ' lehetetlen állítás elfogadva');
            if (r.honesty.twinsN) parts.push(r.honesty.twinsN + ' ellentmondó pár');
            paragraph(ctx, parts.join(' · '), PAD, y, W - 2 * PAD, 24, 700, C.soft, 32, 2);
        }
        if (r.rel && r.rel.axes) {
            var defs = core.defsFor(r.ver || data.VERSION) || data;
            var gy = 1090;
            text(ctx, 'Tengelyek biztossága', PAD, gy, 24, 800, C.ink);
            var x = PAD, w = (W - 2 * PAD - 9 * 8) / 10;
            defs.AXES.forEach(function (a, i) {
                var lv = r.rel.axes[a.id];
                var xx = PAD + i * (w + 8);
                fillRR(ctx, xx, gy + 20, w, 92, 16, 'rgba(255,255,255,.85)');
                emoji(ctx, a.icon, xx + w / 2, gy + 62, 30);
                ctx.beginPath(); ctx.arc(xx + w / 2, gy + 90, 8, 0, Math.PI * 2); ctx.fillStyle = LEVEL_COLOR[lv === undefined ? 0 : lv]; ctx.fill();
            });
        }
    }

    var CATEGORIES = [
        { id: 'values', label: 'Értékrend-térkép', file: 'ertekrend', draw: drawValues, has: function (r) { return !!r.s; } },
        { id: 'hated', label: 'Utált értékek', file: 'utalt-ertekek', draw: drawHated, has: function (r) { return !!(r.hs || r.counts || (r.h && r.h.length)); } },
        { id: 'prej', label: 'Előítélet-barométer', file: 'eloitelet', draw: drawPrej, has: function (r) { return !!(r.pj || r.m); } },
        { id: 'trust', label: 'Megbízhatóság', file: 'megbizhatosag', draw: drawTrust, has: function (r) { return !!(r.rel || r.honesty); } }
    ];

    function available(r) { return CATEGORIES.filter(function (c) { return c.has(r); }); }
    function draw(ctx, cat, r) {
        var c = typeof cat === 'string' ? core.find(CATEGORIES, cat) : cat;
        if (!c) throw new Error('ismeretlen kép: ' + cat);
        var defs = core.defsFor(r.ver || data.VERSION) || data;
        c.draw(ctx, r, defs);
    }
    // Böngészőben: kész vászon
    function render(cat, r) {
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        draw(cv.getContext('2d'), cat, r);
        return cv;
    }

    var api = { WIDTH: W, HEIGHT: H, CATEGORIES: CATEGORIES, available: available, draw: draw, render: render, wrap: wrap };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.img = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
