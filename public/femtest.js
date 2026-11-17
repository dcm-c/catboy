// =========================================================
// FEMBOY-TÍPUS TESZT - felület és eredménykép
// Az ertektest.js eszköztárára (window.MFSZErtek.kit) épül; a bevezető „Femboy-típus teszt” kártyája hívja a start()-ot.
// Saját fázisok: 'fem' (kitöltés) és 'femres' (eredmény). A megosztott link: #f=<kód> (lásd femtest-data.js).
// =========================================================
(function () {
    'use strict';

    var F = window.MFSZErtek.femdata;
    if (!F) return;
    var fs = { i: 0, ans: [], result: null, shared: false };

    function K() { return window.MFSZErtek.kit; }
    function shareUrl(r) { return fs.shared ? location.href : K().pageBase() + '#f=' + F.encode(r.answers); }
    function typeOf(id) { return F.find(F.TYPES, id); }

    // ---------- Kitöltés ----------
    function start() {
        fs = { i: 0, ans: F.ITEMS.map(function () { return undefined; }), result: null, shared: false };
        K().setPhase('fem');
    }

    function answer(v) {
        fs.ans[fs.i] = v;
        if (fs.i + 1 < F.ITEMS.length) { fs.i++; K().setPhase('fem'); return; }
        fs.result = F.evaluate(fs.ans.map(function (x) { return x === undefined ? null : x; }));
        fs.shared = false;
        K().setPhase('femres');
    }
    function back() {
        if (fs.i > 0) { fs.i--; K().setPhase('fem'); } else K().home();
    }

    function renderQuiz() {
        var k = K(), el = k.el, it = F.ITEMS[fs.i];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'pink');
        var body = el('div', 'card-body p-4');
        body.appendChild(k.progress(fs.i + 1, F.ITEMS.length, '🎀 Femboy-típus teszt'));
        if (fs.i === 0) {
            body.appendChild(el('p', 'et-partnote', 'Nincs jó vagy rossz válasz: azt mondd, mennyire igaz rád az állítás. Néhány állítás fordított, ez szándékos. Ha nem tudod, válaszd a középsőt vagy hagyd ki. Az egész egy vicc, a vége pedig egy típus, pár mérő és egy kép.'));
        }
        var q = el('p', 'et-statement', it.text);
        q.setAttribute('aria-live', 'polite');
        body.appendChild(q);
        body.appendChild(el('p', 'et-joke', it.joke));
        var grid = el('div', 'et-answers');
        grid.setAttribute('role', 'group');
        grid.setAttribute('aria-label', 'Válaszod');
        k.answers.forEach(function (a, idx) {
            var b = el('button', 'et-ans ' + a.cls);
            b.type = 'button';
            b.appendChild(el('span', 'et-key', String(idx + 1)));
            b.appendChild(el('span', 'et-ans-tx', a.short));
            b.title = a.label;
            b.setAttribute('aria-label', a.label + ' (billentyű: ' + (idx + 1) + ')');
            if (fs.ans[fs.i] === a.v) b.classList.add('on');
            b.addEventListener('click', function () { answer(a.v); });
            grid.appendChild(b);
        });
        body.appendChild(grid);
        var row = el('div', 'et-nav');
        row.appendChild(k.btn('btn btn-sm btn-outline-secondary', fs.i === 0 ? '← Menü' : '← Vissza', back));
        row.appendChild(k.btn('btn btn-sm btn-outline-secondary', 'Passz, kihagyom', function () { answer(null); }));
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: 1–5 a válaszhoz, Backspace a visszalépéshez.'));
        card.appendChild(body);
        k.stage.appendChild(card);
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var kit = K(), ui = window.MFSZErtek.ui;
        if (!kit || !ui || ui.state().phase !== 'fem') return;
        var tn = e.target && e.target.tagName;
        if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || tn === 'SUMMARY') return;
        if (e.key >= '1' && e.key <= '5') { e.preventDefault(); answer(kit.answers[Number(e.key) - 1].v); }
        else if (e.key === 'Backspace') { e.preventDefault(); back(); }
    });

    // ---------- Eredmény ----------
    function meterRow(m) {
        var k = K(), el = k.el;
        var row = el('div', 'et-hrow' + (m.value >= 67 ? ' top' : ''));
        var head = el('div', 'et-axis-head');
        var nm = el('b', '');
        nm.appendChild(el('span', 'et-ico sm', m.icon));
        nm.appendChild(document.createTextNode(m.name));
        head.appendChild(nm);
        head.appendChild(el('span', '', m.value + ' / 100'));
        row.appendChild(head);
        var track = el('div', 'et-htrack');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', m.name + ': ' + m.value + ' a 100-ból');
        var fill = el('i', 'et-hfill ' + (m.value >= 67 ? 'hot' : m.value <= 33 ? 'cool' : 'mild'));
        fill.style.width = m.value + '%';
        track.appendChild(fill);
        row.appendChild(track);
        row.appendChild(el('p', 'et-joke mb-0', m.text));
        return row;
    }

    function resultText(r) {
        var t = typeOf(r.type);
        return 'Femboy-típus teszt: ' + t.emoji + ' ' + t.title + ' (' + r.fit + '% illeszkedés). Te mit kapnál?';
    }

    function renderResult() {
        var k = K(), el = k.el, stage = k.stage, r = fs.result;
        if (!r) { k.home(); return; }
        var t = typeOf(r.type);

        if (fs.shared) {
            var note = el('div', 'et-sharednote');
            note.appendChild(el('span', '', '🔗 Valaki megosztotta veled a femboy-típusát (csak szórakozásból).'));
            note.appendChild(k.btn('btn btn-sm btn-primary-custom', 'Kitöltöm én is', function () {
                if (window.history && history.replaceState) history.replaceState(null, '', k.pageBase());
                start();
            }));
            stage.appendChild(note);
        }

        var hero = el('div', 'card shadow-sm border-0 et-card et-hero');
        hero.setAttribute('data-tone', 'pink');
        var hb = el('div', 'card-body p-4 p-md-5 text-center');
        hb.appendChild(el('div', 'et-emoji', t.emoji));
        hb.appendChild(el('div', 'et-kicker', 'A te femboy-típusod'));
        var h2 = el('h2', 'h2 fw-bold et-title', t.title);
        h2.id = 'fem-title';
        hb.appendChild(h2);
        hb.appendChild(el('div', 'et-fit', r.fit + '% illeszkedés'));
        hb.appendChild(el('p', 'mb-3 et-desc', t.desc));
        hb.appendChild(el('p', 'et-sunday', '👗 ' + t.outfit));
        var facts = el('ul', 'fem-facts');
        [['⚡ Szuperképesség', t.power], ['🫠 Gyenge pont', t.weak], ['💬 Jelmondat', t.motto]].forEach(function (f) {
            var li = el('li', '');
            li.appendChild(el('b', '', f[0] + ': '));
            li.appendChild(document.createTextNode(f[1]));
            facts.appendChild(li);
        });
        hb.appendChild(facts);
        var bd = typeOf(t.buddy);
        if (bd) hb.appendChild(el('p', 'et-second', '💞 Legjobb páros: ' + bd.emoji + ' ' + bd.title + '. ' + t.buddyWhy));
        if (r.margin < 0.05 && r.second !== t.buddy) {
            var s2 = typeOf(r.second);
            if (s2) hb.appendChild(el('p', 'et-second', 'Majdnem ugyanennyire illik rád: ' + s2.emoji + ' ' + s2.title + '.'));
        }
        hero.appendChild(hb);
        stage.appendChild(hero);

        var ax = k.card('blue', true);
        ax.appendChild(el('h3', 'h5 fw-bold mb-1', 'Tengelyek'));
        ax.appendChild(el('p', 'et-joke mb-3', 'Nyolc tengely, mindegyiken két pólus. A közép nem unalmas, csak diplomatikus.'));
        F.AXES.forEach(function (a) { ax.appendChild(k.axisRow(a, r.scores[a.id])); });

        var mt = k.card('pink', true);
        mt.appendChild(el('h3', 'h5 fw-bold mb-1', 'Vicces mérők'));
        mt.appendChild(el('p', 'et-joke mb-3', 'Tudományosan megalapozatlan, de szívből jövő műszerek.'));
        r.meters.forEach(function (m) { mt.appendChild(meterRow(m)); });

        var cn = k.card('trans', true);
        cn.appendChild(el('h3', 'h5 fw-bold mb-1', 'Következetesség: ' + r.cons.tier.name + ' (' + r.cons.index + '%)'));
        cn.appendChild(el('p', 'mb-1', r.cons.tier.text));
        if (r.cons.passzBajnok) cn.appendChild(el('p', 'et-joke mb-0', 'Sok „passz” vagy középső válasz született, ezért az eredmény kevésbé biztos: a típus inkább tipp.'));

        var sc = k.card('pink', true);
        sc.appendChild(el('h3', 'h5 fw-bold mb-1', '🖼 Kép és link a megosztáshoz'));
        sc.appendChild(el('p', 'text-muted mb-3', 'A kép és a link csak az eredményt tartalmazza, személyes adatot nem.'));
        var cv = null;
        try { cv = drawImage(r); } catch (e) { cv = null; }
        if (cv) {
            cv.className = 'et-img-cv fem-img';
            cv.setAttribute('role', 'img');
            cv.setAttribute('aria-label', 'Eredménykép: ' + t.title);
            var fig = el('figure', 'et-img fem-fig');
            fig.appendChild(cv);
            sc.appendChild(fig);
        }
        var btns = el('div', 'd-flex flex-wrap gap-2 mb-3');
        if (cv) {
            btns.appendChild(k.btn('btn btn-outline-primary', 'Kép letöltése', function () { k.download(cv, 'femboy-tipus-teszt.png'); }));
            btns.appendChild(k.btn('btn btn-primary-custom', 'Kép megosztása', function () { shareImage(cv, r); }));
        }
        var box = el('div', 'et-sharebox');
        var lab = el('label', 'et-hint d-block mb-1', 'A link a tiéd:');
        lab.setAttribute('for', 'fem-url');
        var wrap = el('div', 'd-flex gap-2');
        var inp = el('input', 'form-control');
        inp.id = 'fem-url'; inp.type = 'text'; inp.readOnly = true; inp.value = shareUrl(r);
        wrap.appendChild(inp);
        wrap.appendChild(k.btn('btn btn-outline-primary', 'Másolás', function () {
            k.copyText(inp.value, inp).then(function () { k.toast('Link másolva.'); }, function () { k.toast('Jelöld ki és másold ki a linket.'); });
        }));
        box.appendChild(lab); box.appendChild(wrap);
        sc.appendChild(btns);
        sc.appendChild(box);
        var more = el('div', 'd-flex flex-wrap gap-2 mt-3');
        more.appendChild(k.btn('btn btn-secondary-custom', 'Újra', start));
        more.appendChild(k.btn('btn btn-outline-secondary', 'Vissza a tesztekhez', function () { k.home(); }));
        sc.appendChild(more);

        stage.appendChild(el('p', 'et-hint text-center mt-4', 'Szórakoztató teszt, nem tudományos mérés: ha nem értesz egyet az eredménnyel, az a teszt hibája. 🎀'));
        stage.appendChild(el('p', 'et-ver text-center', 'Femboy-típus teszt · v' + F.VERSION + ' · ' + F.DATE));
    }

    function shareImage(cv, r) {
        var k = K(), link = shareUrl(r);
        cv.toBlob(function (blob) {
            if (!blob) { k.toast('A kép mentése nem sikerült.'); return; }
            var file = null;
            try { file = new File([blob], 'femboy-tipus-teszt.png', { type: 'image/png' }); } catch (e) { file = null; }
            if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
                navigator.share({ files: [file], title: 'Femboy-típus teszt', text: resultText(r) + ' ' + link }).catch(function () { /* mégse */ });
            } else {
                k.download(cv, 'femboy-tipus-teszt.png');
                k.copyText(link, null).then(function () { k.toast('A kép letöltődött, a megosztási link a vágólapon van.'); }, function () { k.toast('A kép letöltődött.'); });
            }
        }, 'image/png');
    }

    // ---------- Eredménykép (canvas, 1080 × 1350) ----------
    var W = 1080, H = 1350, PAD = 60;
    var FONT = '"Quicksand", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
    var EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    var INK = '#2a2540', SOFT = '#6b6486', BLUE = '#3fb4e8', PINK = '#f27aa3', TRACK = 'rgba(42,37,64,.10)';

    function rr(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }
    function fillRR(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
    function txt(ctx, s, x, y, px, weight, color, align) {
        ctx.font = (weight || 600) + ' ' + px + 'px ' + FONT; ctx.fillStyle = color || INK; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
    }
    function emo(ctx, s, x, y, px) { ctx.font = px + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK; ctx.fillText(s, x, y); }
    function wrapLines(ctx, s, maxW, px, weight, maxLines) {
        ctx.font = (weight || 600) + ' ' + px + 'px ' + FONT;
        var words = String(s).split(/\s+/), lines = [], cur = '';
        words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } });
        if (cur) lines.push(cur);
        if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*$/, '') + '…'; }
        return lines;
    }
    function para(ctx, s, x, y, maxW, px, weight, color, lh, maxLines, align) {
        var lines = wrapLines(ctx, s, maxW, px, weight, maxLines);
        lines.forEach(function (l, i) { txt(ctx, l, x, y + i * lh, px, weight, color, align); });
        return lines.length;
    }
    function pill(ctx, x, y, s, px, bg, fg) {
        ctx.font = '700 ' + px + 'px ' + FONT;
        var w = ctx.measureText(s).width + px * 1.4, h = px * 1.75;
        fillRR(ctx, x, y, w, h, h / 2, bg);
        txt(ctx, s, x + w / 2, y + h * 0.69, px, 700, fg || '#fff', 'center');
        return w;
    }

    // Szöveg keskenyítése, hogy elférjen a megadott szélességben (nem lóg ki, nem ütközik a szomszéddal)
    function fit(ctx, s, maxW, px, weight) {
        ctx.font = (weight || 600) + ' ' + px + 'px ' + FONT;
        if (ctx.measureText(s).width <= maxW) return s;
        while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
        return s.replace(/\s+$/, '') + '…';
    }

    function drawImage(r) {
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        if (!ctx) return null;
        var t = typeOf(r.type);
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#e2f5ff'); g.addColorStop(1, '#ffe9f1');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'].forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(0, i * 10, W, 10); });
        txt(ctx, 'FEMBOY-TÍPUS TESZT · MFSZ', PAD, 92, 24, 700, SOFT);
        txt(ctx, 'v' + F.VERSION, W - PAD, 92, 24, 700, SOFT, 'right');

        // Típus
        fillRR(ctx, PAD, 116, W - 2 * PAD, 300, 36, 'rgba(255,255,255,.9)');
        emo(ctx, t.emoji, W / 2, 214, 96);
        var n = para(ctx, t.title, W / 2, 282, W - 2 * PAD - 60, 50, 800, INK, 58, 2, 'center');
        var label = r.fit + '% illeszkedés';
        ctx.font = '700 28px ' + FONT;
        var pw = ctx.measureText(label).width + 40;
        pill(ctx, (W - pw) / 2, 282 + (n - 1) * 58 + 22, label, 28, PINK, '#fff');
        para(ctx, t.motto, W / 2, 462, W - 2 * PAD - 60, 27, 600, SOFT, 36, 2, 'center');

        // Tengelyek: két sor mindegyik (felirat és érték, alatta a teljes szélességű sáv), így semmi sem ütközik
        var y = 560;
        txt(ctx, 'TENGELYEK', PAD, y, 22, 800, BLUE);
        y += 14;
        var rowH = 56, barX = PAD, barW = W - 2 * PAD;
        F.AXES.forEach(function (a) {
            var sc = r.scores[a.id];
            emo(ctx, a.icon, PAD + 16, y + 28, 26);
            txt(ctx, a.name, PAD + 44, y + 27, 24, 700, INK);
            var lead = sc === 0 ? 'középen' : Math.abs(sc) + '% ' + (sc > 0 ? a.pos : a.neg).toLowerCase();
            txt(ctx, fit(ctx, lead, 430, 22, 700), W - PAD, y + 27, 22, 700, sc > 0 ? '#c0408f' : sc < 0 ? '#1f8fc4' : SOFT, 'right');
            var by = y + 36;
            fillRR(ctx, barX, by, barW, 12, 6, TRACK);
            var half = barW / 2, w = Math.abs(sc) / 100 * half;
            if (w > 0) fillRR(ctx, sc >= 0 ? barX + half : barX + half - w, by, Math.max(w, 8), 12, 6, sc > 0 ? '#c0408f' : BLUE);
            ctx.fillStyle = 'rgba(42,37,64,.35)'; ctx.fillRect(barX + half - 1, by - 3, 2, 18);
            y += rowH;
        });

        // Mérők: három oszlop, két sor
        y += 22;
        txt(ctx, 'VICCES MÉRŐK', PAD, y, 22, 800, BLUE);
        y += 16;
        var gap = 14, tw = (W - 2 * PAD - 2 * gap) / 3, th = 92;
        r.meters.forEach(function (m, i) {
            var cx = PAD + (i % 3) * (tw + gap), cy = y + Math.floor(i / 3) * (th + gap);
            fillRR(ctx, cx, cy, tw, th, 20, 'rgba(255,255,255,.9)');
            emo(ctx, m.icon, cx + 30, cy + 40, 28);
            txt(ctx, fit(ctx, m.name, tw - 56 - 56, 19, 700), cx + 54, cy + 36, 19, 700, INK);
            txt(ctx, String(m.value), cx + tw - 16, cy + 36, 24, 800, INK, 'right');
            fillRR(ctx, cx + 18, cy + 58, tw - 36, 14, 7, TRACK);
            fillRR(ctx, cx + 18, cy + 58, Math.max(10, (tw - 36) * m.value / 100), 14, 7, m.value >= 67 ? '#e0484f' : m.value <= 33 ? BLUE : '#f0a229');
        });

        txt(ctx, 'femboy.hu/ertektest  ·  szórakoztató teszt, nem tudományos mérés', W / 2, H - 28, 21, 600, SOFT, 'center');
        return cv;
    }

    // ---------- Csatlakozás az ertektest.js-hez ----------
    var lastBadHash = null;
    function openFromHash() {
        var m = /^#f=(.+)$/.exec(location.hash || '');
        if (!m) return false;
        var r = F.decode(m[1]);
        if (!r) {
            if (location.hash !== lastBadHash) { lastBadHash = location.hash; setTimeout(function () { K().toast('Ez a megosztott link nem olvasható (hibás, csonka vagy újabb tesztverzióból való).'); }, 150); }
            return false;
        }
        fs = { i: 0, ans: r.answers.slice(), result: r, shared: true };
        K().setPhase('femres');
        return true;
    }

    window.MFSZErtek.femUI = {
        start: start,
        mount: function () {
            K().register('fem', renderQuiz);
            K().register('femres', renderResult);
            window.addEventListener('hashchange', function () {
                if (openFromHash()) return;
                if (fs.shared && !/^#f=/.test(location.hash || '')) { fs.shared = false; fs.result = null; K().home(); }
            });
            openFromHash();
        },
        state: function () { return fs; },
        answerAll: function (v) { fs.ans = F.ITEMS.map(function (it, i) { return typeof v === 'function' ? v(it, i) : v; }); },
        finish: function () { fs.result = F.evaluate(fs.ans.map(function (x) { return x === undefined ? null : x; })); fs.shared = false; K().setPhase('femres'); }
    };
})();
