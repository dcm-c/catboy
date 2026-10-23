// =========================================================
// ÉRTÉKTEST - felület
// Fázisok: bevezető -> állítások (1-5 gombbal / billentyűvel) -> "melyik zavar jobban" körök -> eredmény.
// Az eredmény a link #r= részében utazik (base64url JSON), így megosztható, és nem mentünk semmit.
// =========================================================
(function () {
    'use strict';

    var D = window.MFSZErtek.data, C = window.MFSZErtek.core;
    var stage = document.getElementById('et-stage');
    var ST = D.STATEMENTS, PAIRS = D.HATED_PAIRS;

    var ANSWERS = [
        { v: -2, label: 'Egyáltalán nem értek egyet', short: 'Nem, soha', cls: 'no2' },
        { v: -1, label: 'Inkább nem értek egyet', short: 'Inkább nem', cls: 'no1' },
        { v: 0, label: 'Nem tudom / közepes', short: 'Passz-félék', cls: 'mid' },
        { v: 1, label: 'Inkább egyetértek', short: 'Inkább igen', cls: 'yes1' },
        { v: 2, label: 'Teljesen egyetértek', short: 'Igen, abszolút', cls: 'yes2' }
    ];

    var st = { phase: 'intro', i: 0, answers: [], j: 0, picks: [], result: null, shared: false };

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function pageBase() { return location.href.split('#')[0]; }

    var toastTimer = null;
    function toast(text) {
        var t = document.getElementById('et-toast');
        if (!t) return;
        t.textContent = text;
        t.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('on'); }, 3200);
    }

    function setPhase(p) {
        st.phase = p;
        render();
        var top = document.getElementById('et-top');
        if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
    }

    // ---------- Kirajzolás ----------
    function render() {
        clear(stage);
        if (st.phase === 'intro') renderIntro();
        else if (st.phase === 'quiz') renderQuiz();
        else if (st.phase === 'hated') renderHated();
        else renderResult();
    }

    function progress(now, total, label) {
        var box = el('div', 'et-progress');
        var top = el('div', 'et-progress-top');
        top.appendChild(el('span', '', label));
        top.appendChild(el('b', '', now + ' / ' + total));
        box.appendChild(top);
        var bar = el('div', 'et-bar');
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(total)); bar.setAttribute('aria-valuenow', String(now));
        var fill = el('i');
        fill.style.width = (now / total * 100).toFixed(1) + '%';
        bar.appendChild(fill);
        box.appendChild(bar);
        return box;
    }

    function renderIntro() {
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'trans');
        var body = el('div', 'card-body p-4 p-md-5 text-center');
        body.appendChild(el('div', 'et-emoji', '🧭'));
        body.appendChild(el('h2', 'h3 fw-bold mb-3', 'Hol állsz a nagy magyar értékvitában?'));
        body.appendChild(el('p', 'lead mb-3', ST.length + ' állítás, ' + PAIRS.length + ' „melyik zavar jobban?” kör, a végén egy tréfás típus és a legutáltabb értéked.'));
        body.appendChild(el('p', 'text-muted mb-4', 'Magyar ügyek, kávéházi hangulat, kakaóscsiga-nosztalgia. Nem pártot ajánl, nem ítélkezik, és semmit nem mentünk: az eredmény csak a megosztható linkben utazik.'));
        var go = el('button', 'btn btn-primary-custom btn-lg px-5', 'Kezdjük');
        go.type = 'button';
        go.addEventListener('click', function () { st.i = 0; st.answers = []; st.j = 0; st.picks = []; setPhase('quiz'); });
        body.appendChild(go);
        card.appendChild(body);
        stage.appendChild(card);
    }

    function renderQuiz() {
        var s = ST[st.i];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'blue');
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(st.i + 1, ST.length, 'Állítás'));
        var q = el('p', 'et-statement', s.text);
        q.setAttribute('aria-live', 'polite');
        body.appendChild(q);
        if (s.joke) body.appendChild(el('p', 'et-joke', s.joke));
        var grid = el('div', 'et-answers');
        grid.setAttribute('role', 'group');
        grid.setAttribute('aria-label', 'Válaszod');
        ANSWERS.forEach(function (a, idx) {
            var b = el('button', 'et-ans ' + a.cls);
            b.type = 'button';
            b.appendChild(el('span', 'et-key', String(idx + 1)));
            b.appendChild(el('span', 'et-ans-tx', a.short));
            b.title = a.label;
            b.setAttribute('aria-label', a.label + ' (billentyű: ' + (idx + 1) + ')');
            if (st.answers[st.i] === a.v) b.classList.add('on');
            b.addEventListener('click', function () { answer(a.v); });
            grid.appendChild(b);
        });
        body.appendChild(grid);
        var row = el('div', 'et-nav');
        var back = el('button', 'btn btn-sm btn-outline-secondary', '← Vissza');
        back.type = 'button';
        back.disabled = st.i === 0;
        back.addEventListener('click', goBack);
        var skip = el('button', 'btn btn-sm btn-outline-secondary', 'Passz, kihagyom');
        skip.type = 'button';
        skip.addEventListener('click', function () { answer(null); });
        row.appendChild(back); row.appendChild(skip);
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: 1–5 a válaszhoz, Backspace a visszalépéshez.'));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function answer(v) {
        st.answers[st.i] = v;
        if (st.i + 1 < ST.length) { st.i++; render(); }
        else { st.j = 0; st.picks = []; setPhase('hated'); }
    }
    function goBack() {
        if (st.phase === 'quiz' && st.i > 0) { st.i--; render(); }
        else if (st.phase === 'hated') {
            if (st.j > 0) { st.j--; st.picks.pop(); render(); }
            else { st.i = ST.length - 1; setPhase('quiz'); }
        }
    }

    function renderHated() {
        var pair = PAIRS[st.j];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'pink');
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(st.j + 1, PAIRS.length, 'Utált értékek'));
        body.appendChild(el('p', 'et-statement', 'Melyik zavar jobban?'));
        body.appendChild(el('p', 'et-joke', 'Mindkettő rossz, de az egyiket jobban utálod. Dönts!'));
        var grid = el('div', 'et-pair');
        pair.forEach(function (id, idx) {
            var h = C.find(D.HATED, id);
            var b = el('button', 'et-hate h' + idx);
            b.type = 'button';
            b.appendChild(el('span', 'et-key', idx === 0 ? 'A' : 'B'));
            b.appendChild(el('b', '', h.name));
            b.appendChild(el('span', '', h.blurb));
            b.addEventListener('click', function () { pickHated(id); });
            grid.appendChild(b);
        });
        body.appendChild(grid);
        var row = el('div', 'et-nav');
        var back = el('button', 'btn btn-sm btn-outline-secondary', '← Vissza');
        back.type = 'button';
        back.addEventListener('click', goBack);
        row.appendChild(back);
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: A vagy 1 az első, B vagy 2 a második.'));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function pickHated(id) {
        st.picks.push(id);
        if (st.j + 1 < PAIRS.length) { st.j++; render(); return; }
        var answers = {};
        ST.forEach(function (s, i) { answers[s.id] = typeof st.answers[i] === 'number' ? st.answers[i] : null; });
        st.result = C.summarize(answers, st.picks);
        st.shared = false;
        setPhase('result');
    }

    // ---------- Eredmény ----------
    function axisRow(ax, score) {
        var row = el('div', 'et-axis');
        var head = el('div', 'et-axis-head');
        head.appendChild(el('b', '', ax.name));
        var side = score === 0 ? 'középen' : (Math.abs(score) + '% ' + (score > 0 ? ax.pos : ax.neg).toLowerCase());
        head.appendChild(el('span', '', side));
        row.appendChild(head);
        var track = el('div', 'et-track');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', ax.name + ': ' + side);
        var fill = el('i', 'et-fill ' + (score >= 0 ? 'pos' : 'neg') + ' ax-' + ax.id);
        var w = Math.abs(score) / 2;
        fill.style.width = w + '%';
        if (score >= 0) fill.style.left = '50%'; else fill.style.left = (50 - w) + '%';
        track.appendChild(fill);
        track.appendChild(el('s', 'et-mid'));
        var thumb = el('u', 'et-thumb ax-' + ax.id);
        thumb.style.left = ((score + 100) / 2) + '%';
        track.appendChild(thumb);
        row.appendChild(track);
        var ends = el('div', 'et-ends');
        ends.appendChild(el('span', '', ax.neg));
        ends.appendChild(el('span', '', ax.pos));
        row.appendChild(ends);
        return row;
    }

    function resultText(r) {
        var ar = C.find(D.ARCHETYPES, r.a);
        var hated = r.h.length ? C.find(D.HATED, r.h[0]).name.toLowerCase() : null;
        return 'Értékteszt: ' + ar.title + ' (' + r.fit + '% illeszkedés)' + (hated ? ', legjobban a(z) ' + hated + ' zavar.' : '.') + ' Te mit kapnál?';
    }
    function shareUrl(r) { return pageBase() + '#r=' + C.encode(r); }

    function copyText(text, input) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
        return new Promise(function (ok, no) {
            try { input.focus(); input.select(); document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); }
        });
    }

    function renderResult() {
        var r = st.result;
        var ar = C.find(D.ARCHETYPES, r.a);

        if (st.shared) {
            var note = el('div', 'et-sharednote');
            note.appendChild(el('span', '', '🔗 Valaki megosztotta veled az eredményét (csak szórakozásból).'));
            var mine = el('button', 'btn btn-sm btn-primary-custom', 'Kitöltöm én is');
            mine.type = 'button';
            mine.addEventListener('click', function () {
                if (window.history && history.replaceState) history.replaceState(null, '', pageBase());
                st.shared = false; st.result = null; setPhase('intro');
            });
            note.appendChild(mine);
            stage.appendChild(note);
        }

        var hero = el('div', 'card shadow-sm border-0 et-card et-hero');
        hero.setAttribute('data-tone', 'trans');
        var hb = el('div', 'card-body p-4 p-md-5 text-center');
        hb.appendChild(el('div', 'et-emoji', ar.emoji));
        hb.appendChild(el('div', 'et-kicker', 'A te típusod'));
        hb.appendChild(el('h2', 'h2 fw-bold et-title', ar.title));
        hb.appendChild(el('div', 'et-fit', r.fit + '% illeszkedés'));
        hb.appendChild(el('p', 'mb-3 et-desc', ar.desc));
        hb.appendChild(el('p', 'et-sunday', '🍲 ' + ar.sunday));
        hero.appendChild(hb);
        stage.appendChild(hero);

        var axes = el('div', 'card shadow-sm border-0 et-card mt-4');
        axes.setAttribute('data-tone', 'blue');
        var ab = el('div', 'card-body p-4');
        ab.appendChild(el('h3', 'h5 fw-bold mb-3', 'Értékrend-térkép'));
        D.AXES.forEach(function (ax) { ab.appendChild(axisRow(ax, r.s[ax.id])); });
        axes.appendChild(ab);
        stage.appendChild(axes);

        var hatedBox = el('div', 'card shadow-sm border-0 et-card mt-4');
        hatedBox.setAttribute('data-tone', 'red');
        var hbd = el('div', 'card-body p-4');
        hbd.appendChild(el('h3', 'h5 fw-bold mb-3', 'A legkevésbé szimpatikus érték'));
        if (r.h.length) {
            var h1 = C.find(D.HATED, r.h[0]);
            hbd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            hbd.appendChild(el('p', 'et-joke mb-2', 'Ez az, ' + h1.blurb + '.'));
            hbd.appendChild(el('p', 'mb-2', h1.roast));
            if (r.h[1]) {
                var h2 = C.find(D.HATED, r.h[1]);
                hbd.appendChild(el('p', 'text-muted mb-0', 'Mellette még: ' + h2.name.toLowerCase() + '.'));
            }
        } else hbd.appendChild(el('p', 'mb-0', 'Nem találtunk kifejezetten utált értéket: vagy nagyon békés vagy, vagy nagyon gyorsan kattintgattál.'));
        hatedBox.appendChild(hbd);
        stage.appendChild(hatedBox);

        if (!st.shared) {
            var sh = el('div', 'card shadow-sm border-0 et-card mt-4');
            sh.setAttribute('data-tone', 'pink');
            var sb = el('div', 'card-body p-4');
            sb.appendChild(el('h3', 'h5 fw-bold mb-2', 'Küldd el a barátaidnak'));
            sb.appendChild(el('p', 'text-muted mb-3', 'A link tartalmazza az eredményedet: aki megnyitja, látja a térképedet, és kitöltheti a saját tesztjét.'));
            var btns = el('div', 'd-flex flex-wrap gap-2 mb-3');
            var share = el('button', 'btn btn-primary-custom', 'Megosztás');
            share.type = 'button';
            var again = el('button', 'btn btn-secondary-custom', 'Újra');
            again.type = 'button';
            btns.appendChild(share); btns.appendChild(again);
            sb.appendChild(btns);
            var box = el('div', 'et-sharebox');
            box.hidden = true;
            var lab = el('label', 'et-hint d-block mb-1', 'Ez a link a tiéd:');
            lab.setAttribute('for', 'et-url');
            var wrap = el('div', 'd-flex gap-2');
            var inp = el('input', 'form-control');
            inp.id = 'et-url'; inp.type = 'text'; inp.readOnly = true;
            var cp = el('button', 'btn btn-outline-primary', 'Másolás');
            cp.type = 'button';
            wrap.appendChild(inp); wrap.appendChild(cp);
            box.appendChild(lab); box.appendChild(wrap);
            sb.appendChild(box);
            share.addEventListener('click', function () {
                var url = shareUrl(r);
                box.hidden = false;
                inp.value = url;
                inp.focus(); inp.select();
                if (navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                    navigator.share({ title: 'Értékteszt', text: resultText(r), url: url }).catch(function () { /* mégse */ });
                    return;
                }
                copyText(url, inp).then(function () { toast('A megosztási link a vágólapra került.'); }, function () { toast('Másold ki a linket a mezőből.'); });
            });
            cp.addEventListener('click', function () {
                copyText(inp.value, inp).then(function () { toast('Link másolva.'); }, function () { toast('Jelöld ki és másold ki a linket.'); });
            });
            again.addEventListener('click', function () { st.result = null; setPhase('intro'); });
            sh.appendChild(sb);
            stage.appendChild(sh);
        }

        stage.appendChild(el('p', 'et-hint text-center mt-4', 'Szórakoztató teszt, nem tudományos mérés: sem pártot, sem világnézetet nem ajánl. Ha nem értesz egyet az eredménnyel, az a teszt hibája. 🧭'));
    }

    // ---------- Billentyűk ----------
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var tn = e.target && e.target.tagName;
        if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT') return;
        if (st.phase === 'quiz') {
            if (e.key >= '1' && e.key <= '5') { e.preventDefault(); answer(ANSWERS[Number(e.key) - 1].v); }
            else if (e.key === 'Backspace') { e.preventDefault(); goBack(); }
        } else if (st.phase === 'hated') {
            var k = e.key.toLowerCase();
            if (k === 'a' || k === '1') { e.preventDefault(); pickHated(PAIRS[st.j][0]); }
            else if (k === 'b' || k === '2') { e.preventDefault(); pickHated(PAIRS[st.j][1]); }
            else if (e.key === 'Backspace') { e.preventDefault(); goBack(); }
        }
    });

    // ---------- Megosztott link megnyitása ----------
    function openFromHash() {
        var m = /^#r=(.+)$/.exec(location.hash || '');
        if (!m) return false;
        var r = C.decode(m[1]);
        if (!r) return false;
        st.result = r; st.shared = true;
        setPhase('result');
        return true;
    }
    window.addEventListener('hashchange', function () { openFromHash(); });
    if (!openFromHash()) render();

    // Hibakereséshez és teszteléshez
    window.MFSZErtek.ui = { state: function () { return st; }, answerAll: function (v) { ST.forEach(function (_, i) { st.answers[i] = v; }); } };
})();
