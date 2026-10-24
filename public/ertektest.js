// =========================================================
// ÉRTÉKTEST - felület
// Négy mód:
//   short  Gyors: 40 állítás -> 10 "melyik zavar jobban" pár + 8 tükörpár -> eredmény
//   long   Részletes: 60 értékállítás (A rész) + 36 utált-érték állítás (B rész) -> eredmény + hazugságvizsgáló
//   hshort Csak az utált értékek, gyors: 10 pár + 8 tükörpár
//   hlong  Csak az utált értékek, részletes: a 36 állításos B rész
// Az eredmény a link #r= részében utazik (base64url JSON), így megosztható, és nem mentünk semmit.
// Fejlesztői mód: kérdésenként megmutatja a súlyokat, az eredményben pedig azt, melyik válasz hány pontot adott hozzá.
// =========================================================
(function () {
    'use strict';

    var D = window.MFSZErtek.data, C = window.MFSZErtek.core;
    var stage = document.getElementById('et-stage');
    var ST = D.STATEMENTS, PAIRS = D.HATED_PAIRS, LONG = D.LONG, LONG_A = D.LONG_A, LONG_B = D.LONG_B, MIRROR = D.MIRROR;

    var ANSWERS = [
        { v: -2, label: 'Egyáltalán nem értek egyet', short: 'Nem, soha', cls: 'no2' },
        { v: -1, label: 'Inkább nem értek egyet', short: 'Inkább nem', cls: 'no1' },
        { v: 0, label: 'Nem tudom / közepes', short: 'Passz-félék', cls: 'mid' },
        { v: 1, label: 'Inkább egyetértek', short: 'Inkább igen', cls: 'yes1' },
        { v: 2, label: 'Teljesen egyetértek', short: 'Igen, abszolút', cls: 'yes2' }
    ];
    var MODES = {
        short: { quiz: ST, rounds: true, axes: true },
        long: { quiz: LONG, rounds: false, axes: true },
        hshort: { quiz: [], rounds: true, axes: false },
        hlong: { quiz: LONG_B, rounds: false, axes: false }
    };
    // A fordulók: előbb a "melyik utált érték zavar jobban" párok, utána a tükörpárok
    var ROUNDS = PAIRS.map(function (p) { return { t: 'hate', ids: p }; }).concat(MIRROR.map(function (m) { return { t: 'mirror', m: m }; }));

    var st = { phase: 'intro', mode: 'short', i: 0, answers: [], j: 0, picks: [], result: null, shared: false, dev: false, ansById: null };

    // A fejlesztői mód szándékosan rejtett: a bevezető iránytűjére kell gyorsan 7-et kattintani.
    // A beállítás ebben a böngészőben megmarad; bekapcsolva a bevezetőn egy kis jelzés mutatja, és arra kattintva kikapcsolható.
    try { st.dev = localStorage.getItem('mfsz-ertek-dev') === '1'; } catch (e) { st.dev = false; }
    function setDev(on) {
        st.dev = !!on;
        try { localStorage.setItem('mfsz-ertek-dev', on ? '1' : '0'); } catch (e) { /* nem baj */ }
        toast(on ? '🛠 Fejlesztői mód bekapcsolva' : 'Fejlesztői mód kikapcsolva');
        render();
    }
    var devClicks = [];
    function devTap() {
        var now = Date.now();
        devClicks = devClicks.filter(function (t) { return now - t < 4000; });
        devClicks.push(now);
        if (devClicks.length >= 7) { devClicks = []; setDev(!st.dev); }
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function pageBase() { return location.href.split('#')[0]; }
    function list() { return MODES[st.mode].quiz; }
    function kindOf(r) { return r.kind || (r.long ? 'long' : 'short'); }
    function sgn(n) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toString().replace('.', ','); }

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
        else if (st.phase === 'hated') renderRound();
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

    // ---------- Bevezető ----------
    function startMode(mode) {
        st.mode = mode; st.i = 0; st.answers = []; st.j = 0; st.picks = []; st.result = null; st.ansById = null;
        setPhase(list().length ? 'quiz' : 'hated');
    }

    function modeCard(cls, emoji, title, lines, label, mode) {
        var c = el('div', 'et-mode ' + cls);
        c.appendChild(el('div', 'et-mode-emoji', emoji));
        c.appendChild(el('b', 'et-mode-title', title));
        var ul = el('ul', 'et-mode-list');
        lines.forEach(function (l) { ul.appendChild(el('li', '', l)); });
        c.appendChild(ul);
        var go = el('button', 'btn btn-primary-custom px-4', label);
        go.type = 'button';
        go.id = 'et-start-' + mode;
        go.addEventListener('click', function () { startMode(mode); });
        c.appendChild(go);
        return c;
    }

    function renderIntro() {
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'trans');
        var body = el('div', 'card-body p-4 p-md-5 text-center');
        var compass = el('div', 'et-emoji', '🧭');
        compass.addEventListener('click', devTap);
        body.appendChild(compass);
        body.appendChild(el('h2', 'h3 fw-bold mb-3', 'Hol állsz a nagy magyar értékvitában?'));
        body.appendChild(el('p', 'lead mb-3', 'Válassz hosszt: gyors kör kávé mellé, vagy részletes vizsgálat, ahol a hazugságot is lemérjük.'));

        body.appendChild(el('h3', 'et-sect', 'Teljes teszt: értékrend + utált értékek'));
        var modes = el('div', 'et-modes');
        modes.appendChild(modeCard('quick', '☕', 'Gyors teszt', [
            ST.length + ' állítás, ' + PAIRS.length + ' „melyik zavar jobban?” kör és ' + MIRROR.length + ' tükörpár',
            'Egy tréfás típus és a legutáltabb értéked',
            'Kb. 6 perc'
        ], 'Gyors kör', 'short'));
        modes.appendChild(modeCard('deep', '🔬', 'Részletes teszt', [
            LONG_A.length + ' értékállítás + ' + LONG_B.length + ' állítás az utált értékekről',
            'Mind a 10 utált érték és 8 előítélet-skála 0–100 között',
            'Őszinteség-vizsgáló: lehetetlen állítások és ellentmondások',
            'Kb. 15 perc'
        ], 'Részletes teszt', 'long'));
        body.appendChild(modes);

        body.appendChild(el('h3', 'et-sect', 'Csak az utált értékek'));
        var modes2 = el('div', 'et-modes');
        modes2.appendChild(modeCard('hquick', '🙅', 'Utált értékek: gyors', [
            PAIRS.length + ' „melyik zavar jobban?” kör + ' + MIRROR.length + ' tükörpár',
            'Mi zavar jobban, és melyik oldalról',
            'Kb. 3 perc'
        ], 'Csak utált, gyors', 'hshort'));
        modes2.appendChild(modeCard('hdeep', '🧪', 'Utált értékek: részletes', [
            LONG_B.length + ' állítás: 10 utált érték (2–2 tétel) és 4 téma mindkét irányban',
            'Skálák 0–100 között, tükörpárokkal',
            'Kb. 7 perc'
        ], 'Csak utált, részletes', 'hlong'));
        body.appendChild(modes2);

        if (st.dev) {
            var pill = el('button', 'et-devpill', '🛠 Fejlesztői mód be · kattints a kikapcsoláshoz');
            pill.type = 'button';
            pill.id = 'et-devpill';
            pill.addEventListener('click', function () { setDev(false); });
            body.appendChild(pill);
        }

        body.appendChild(el('p', 'text-muted mt-3 mb-0', 'Magyar ügyek, kávéházi hangulat, kakaóscsiga-nosztalgia. Nem pártot ajánl, nem ítélkezik, és semmit nem mentünk: az eredmény csak a megosztható linkben utazik.'));
        card.appendChild(body);
        stage.appendChild(card);
    }

    // ---------- Fejlesztői mód: súlyok ----------
    function axisName(id) { var a = C.find(D.AXES, id); return a ? (a.icon + ' ' + a.name) : id; }
    function weightChips(s) {
        var box = el('div', 'et-devchips');
        function add(label, val, cls) { var c = el('span', 'et-devchip ' + cls); c.appendChild(el('b', '', sgn(val))); c.appendChild(document.createTextNode(' ' + label)); box.appendChild(c); }
        Object.keys(s.w || {}).forEach(function (k) {
            var a = C.find(D.AXES, k);
            add(axisName(k) + ' (' + (s.w[k] > 0 ? a.pos : a.neg).toLowerCase() + ' felé)', s.w[k], 'ax');
        });
        Object.keys(s.h || {}).forEach(function (k) { add('utált: ' + C.find(D.HATED, k).name + (s.h[k] < 0 ? ' (kevésbé zavar)' : ''), s.h[k], 'ht'); });
        Object.keys(s.g || {}).forEach(function (k) { add('előítélet: ' + C.find(D.PREJ, k).name, s.g[k], 'pj'); });
        if (s.lie) add('hazugság-próba: ha igent mondasz, az őszinteség csökken', -1, 'lie');
        if (!box.firstChild) box.appendChild(el('span', 'et-devchip', 'Ez a kérdés nem mozgat tengelyt.'));
        return box;
    }
    function twinOf(id) {
        for (var i = 0; i < D.TWINS.length; i++) { if (D.TWINS[i][0] === id) return D.TWINS[i][1]; if (D.TWINS[i][1] === id) return D.TWINS[i][0]; }
        return null;
    }
    function devQuestion(s) {
        var box = el('div', 'et-dev');
        box.appendChild(el('div', 'et-dev-h', '🛠 Mit mozgat ez a kérdés? (azonosító: ' + s.id + ')'));
        box.appendChild(weightChips(s));
        var tw = twinOf(s.id);
        if (tw && C.find(LONG, tw)) box.appendChild(el('p', 'et-dev-n', 'Iker-kérdés: ' + tw + ' (ha mindkettővel egyetértesz, ellentmondás).'));
        box.appendChild(el('p', 'et-dev-n', 'Egyetértés → a + irány felé, nemleges válasz → a − irány felé. Értelmezés: az érték = Σ(válasz × súly) / Σ(2 × |súly|).'));
        var lst = list();
        var cur = answersById(lst.slice(0, st.i + 1));
        var sc = MODES[st.mode].axes ? C.axisScores(cur, lst) : null;
        if (sc) {
            var line = el('div', 'et-devchips');
            D.AXES.forEach(function (a) { var c = el('span', 'et-devchip now'); c.appendChild(el('b', '', String(sc[a.id]))); c.appendChild(document.createTextNode(' ' + a.icon + ' ' + a.name)); line.appendChild(c); });
            box.appendChild(el('div', 'et-dev-h', 'Eddigi állás (−100 … +100)'));
            box.appendChild(line);
        }
        return box;
    }
    function devRound(rd) {
        var box = el('div', 'et-dev');
        box.appendChild(el('div', 'et-dev-h', '🛠 Mit ad ez a kör?'));
        if (rd.t === 'hate') {
            box.appendChild(el('p', 'et-dev-n', 'Amelyiket választod, arra +1 pont jár az utált értékek közt (a sorrend az összpontszámból lesz).'));
        } else {
            var t = C.find(D.TOPICS, rd.m.topic);
            box.appendChild(el('p', 'et-dev-n', 'Téma: ' + t.icon + ' ' + t.name + '. A: ' + t.minSide + ' (+1 a kisebbségi oldalra), B: ' + t.majSide + ' (−1). Az eredmény a téma két körének átlaga.'));
        }
        return box;
    }

    // ---------- Állítások ----------
    function partLabel() {
        if (st.mode === 'long') {
            if (st.i < LONG_A.length) return { label: '1. rész · Értékek', now: st.i + 1, total: LONG_A.length, part: 'a' };
            return { label: '2. rész · Utált értékek', now: st.i - LONG_A.length + 1, total: LONG_B.length, part: 'b' };
        }
        if (st.mode === 'hlong') return { label: 'Utált értékek', now: st.i + 1, total: LONG_B.length, part: 'b' };
        return { label: 'Állítás', now: st.i + 1, total: ST.length, part: 'a' };
    }

    function renderQuiz() {
        var L = list();
        var s = L[st.i];
        var pl = partLabel();
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', pl.part === 'b' ? 'red' : 'blue');
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(pl.now, pl.total, pl.label));
        if (st.mode === 'long' && st.i === LONG_A.length) {
            body.appendChild(el('p', 'et-partnote', '2. rész: itt már azt kérdezzük, mi zavar. Az „egyetértek” azt jelenti: ez engem bosszant vagy nekem ez a nézetem.'));
        }
        if (st.mode === 'hlong' && st.i === 0) {
            body.appendChild(el('p', 'et-partnote', 'Az „egyetértek” itt azt jelenti: ez engem zavar, vagy ez az én véleményem. Nem minősítünk senkit, csak a hozzáállásodat mérjük.'));
        }
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
        if (st.dev) body.appendChild(devQuestion(s));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function answersById(L) {
        var answers = {};
        L.forEach(function (s, i) { answers[s.id] = typeof st.answers[i] === 'number' ? st.answers[i] : null; });
        return answers;
    }

    function answer(v) {
        st.answers[st.i] = v;
        if (st.i + 1 < list().length) { st.i++; render(); return; }
        if (MODES[st.mode].rounds) { st.j = 0; st.picks = []; setPhase('hated'); return; }
        finish();
    }

    function goBack() {
        if (st.phase === 'quiz' && st.i > 0) { st.i--; render(); }
        else if (st.phase === 'hated') {
            if (st.j > 0) { st.j--; st.picks.pop(); render(); }
            else if (list().length) { st.i = list().length - 1; setPhase('quiz'); }
            else setPhase('intro');
        }
    }

    // ---------- Fordulók: párok és tükörpárok ----------
    function roundOptions(rd) {
        if (rd.t === 'hate') {
            return rd.ids.map(function (id) { var h = C.find(D.HATED, id); return { val: id, title: h.name, text: h.blurb }; });
        }
        return [{ val: 'min', title: 'A', text: rd.m.min }, { val: 'maj', title: 'B', text: rd.m.maj }];
    }

    function renderRound() {
        var rd = ROUNDS[st.j];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', rd.t === 'hate' ? 'pink' : 'trans');
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(st.j + 1, ROUNDS.length, rd.t === 'hate' ? 'Utált értékek' : 'Tükörpár'));
        body.appendChild(el('p', 'et-statement', rd.t === 'hate' ? 'Melyik zavar jobban?' : 'Melyik hozzáállás zavar jobban?'));
        body.appendChild(el('p', 'et-joke', rd.t === 'hate' ? 'Mindkettő rossz, de az egyiket jobban utálod. Dönts!' : 'Mindkét oldal elítélendő lehet: melyik bosszant jobban? Dönts!'));
        var grid = el('div', 'et-pair');
        roundOptions(rd).forEach(function (o, idx) {
            var b = el('button', 'et-hate h' + idx);
            b.type = 'button';
            b.appendChild(el('span', 'et-key', idx === 0 ? 'A' : 'B'));
            if (rd.t === 'hate') b.appendChild(el('b', '', o.title));
            b.appendChild(el('span', '', o.text));
            b.addEventListener('click', function () { pickRound(o.val); });
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
        if (st.dev) body.appendChild(devRound(rd));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function pickRound(val) {
        st.picks.push(val);
        if (st.j + 1 < ROUNDS.length) { st.j++; render(); return; }
        finish();
    }

    function finish() {
        var np = PAIRS.length;
        if (st.mode === 'short') {
            st.ansById = answersById(ST);
            st.result = C.summarize(st.ansById, st.picks.slice(0, np), st.picks.slice(np));
        } else if (st.mode === 'long') {
            st.ansById = answersById(LONG);
            st.result = C.summarizeLong(st.ansById);
        } else if (st.mode === 'hlong') {
            st.ansById = answersById(LONG_B);
            st.result = C.summarizeHatedLong(st.ansById);
        } else {
            st.ansById = null;
            st.result = C.summarizeHatedShort(st.picks.slice(0, np), st.picks.slice(np));
        }
        st.shared = false;
        setPhase('result');
    }

    // ---------- Eredmény: közös elemek ----------
    function icoBadge(txt, cls) { return el('span', 'et-ico ' + (cls || ''), txt); }

    function axisRow(ax, score) {
        var pole = score === 0 ? 'mid' : (score > 0 ? 'pos' : 'neg');
        var row = el('div', 'et-axis ' + pole);
        var head = el('div', 'et-axis-head');
        var nm = el('b', 'et-axis-name');
        if (ax.icon) nm.appendChild(icoBadge(ax.icon));
        nm.appendChild(document.createTextNode(ax.name));
        head.appendChild(nm);
        var side = score === 0 ? 'középen' : (Math.abs(score) + '% ' + (score > 0 ? ax.pos : ax.neg).toLowerCase());
        head.appendChild(el('span', 'et-chip', side));
        row.appendChild(head);
        var track = el('div', 'et-track');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', ax.name + ': ' + side);
        var w = Math.abs(score) / 2;
        var fill = el('i', 'et-fill ' + pole);
        fill.style.width = w + '%';
        fill.style.left = score >= 0 ? '50%' : (50 - w) + '%';
        track.appendChild(fill);
        [25, 50, 75].forEach(function (p) { var t = el('s', 'et-tick' + (p === 50 ? ' mid' : '')); t.style.left = p + '%'; track.appendChild(t); });
        var thumb = el('u', 'et-thumb ' + pole);
        thumb.style.left = ((score + 100) / 2) + '%';
        track.appendChild(thumb);
        row.appendChild(track);
        var ends = el('div', 'et-ends');
        ends.appendChild(el('span', score < 0 ? 'lead' : '', (ax.negIcon ? ax.negIcon + ' ' : '') + ax.neg));
        ends.appendChild(el('span', score > 0 ? 'lead' : '', ax.pos + (ax.posIcon ? ' ' + ax.posIcon : '')));
        row.appendChild(ends);
        return row;
    }

    function resultText(r) {
        var k = kindOf(r);
        var hated = r.h && r.h.length ? C.find(D.HATED, r.h[0]).name.toLowerCase() : null;
        if (k === 'hshort' || k === 'hlong') {
            return 'Utált értékek teszt: ' + (hated ? 'legjobban a(z) ' + hated + ' zavar.' : 'nem találtam kirívóan zavaró értéket.') + ' Te mit kapnál?';
        }
        var ar = C.find(D.ARCHETYPES, r.a);
        var hon = r.long ? ' Őszinteség: ' + C.honestyTier(r.honesty.index).name + ' (' + r.honesty.index + '%).' : '';
        return 'Értékteszt: ' + ar.title + ' (' + r.fit + '% illeszkedés)' + (hated ? ', legjobban a(z) ' + hated + ' zavar.' : '.') + hon + ' Te mit kapnál?';
    }
    function shareUrl(r) { return pageBase() + '#r=' + C.encode(r); }

    function copyText(text, input) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
        return new Promise(function (ok, no) {
            try { input.focus(); input.select(); document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); }
        });
    }

    function hateRow(name, score, rank, icon) {
        var row = el('div', 'et-hrow' + (rank === 0 ? ' top' : ''));
        var head = el('div', 'et-axis-head');
        var nm = el('b', '');
        if (icon) nm.appendChild(icoBadge(icon, 'sm'));
        nm.appendChild(document.createTextNode(name));
        head.appendChild(nm);
        head.appendChild(el('span', '', score + ' / 100'));
        row.appendChild(head);
        var track = el('div', 'et-htrack');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', name + ': ' + score + ' a 100-ból');
        var fill = el('i', 'et-hfill ' + (score >= 58 ? 'hot' : score <= 42 ? 'cool' : 'mild'));
        fill.style.width = score + '%';
        track.appendChild(fill);
        row.appendChild(track);
        return row;
    }

    function stText(id) { var s = C.find(LONG, id); return s ? s.text : id; }

    function card(tone, mt) {
        var c = el('div', 'card shadow-sm border-0 et-card' + (mt ? ' mt-4' : ''));
        c.setAttribute('data-tone', tone);
        var b = el('div', 'card-body p-4');
        c.appendChild(b);
        stage.appendChild(c);
        return b;
    }

    // Utált értékek: 10 skála, 0–100
    function renderHatedScales(r) {
        var rank = C.hatedRanking(r.hs);
        var bd = card('red', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Utált értékek skálája'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Minél hosszabb a sáv, annál jobban zavar az adott érték. Középen (50) a semleges.'));
        var top = rank[0];
        if (top.score >= 58) {
            var h1 = C.find(D.HATED, top.id);
            bd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            bd.appendChild(el('p', 'mb-3', h1.roast));
        } else bd.appendChild(el('p', 'mb-3', 'Egyik érték sem zavar kirívóan: vagy nagyon békés vagy, vagy mindenhol középen álltál.'));
        rank.forEach(function (x, i) { bd.appendChild(hateRow(C.find(D.HATED, x.id).name, x.score, i)); });
        var calm = rank.filter(function (x) { return x.score <= 42; });
        if (calm.length) {
            var last = rank[rank.length - 1];
            bd.appendChild(el('p', 'text-muted mt-3 mb-0', 'A legkevésbé zavar: ' + C.find(D.HATED, last.id).name.toLowerCase() + '. Ez a te komfortzónád.'));
        }
    }

    function topicVerdict(up, dn) {
        if (up >= 58 && dn >= 58) return 'Mindkét oldaltól ideges vagy: kávéházi vitaszellem.';
        if (up >= 58 && dn < 50) return 'A kisebbségi oldallal szemben fenntartásosabb vagy.';
        if (dn >= 58 && up < 50) return 'A többségi, hagyományos oldallal szemben fenntartásosabb vagy.';
        if (up < 45 && dn < 45) return 'Mindkét oldalon nyugodt vagy: türelmes hozzáállás.';
        return 'Középen állsz: nincs kirívó fenntartásod.';
    }

    // Előítélet-barométer: témánként két sáv (felfelé / lefelé)
    function renderPrej(r) {
        var bd = card('pink', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Előítélet-barométer'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Négy témában, mindkét irányban: mennyire zavar egy-egy hozzáállás. 50 a semleges, a magasabb érték nagyobb fenntartás. Játékos felmérés: nem minősítünk csoportokat, csak a hozzáállásodat.'));
        D.TOPICS.forEach(function (t) {
            var up = r.pj[t.id + '_up'], dn = r.pj[t.id + '_dn'];
            var box = el('div', 'et-topic');
            var h = el('div', 'et-topic-h');
            h.appendChild(icoBadge(t.icon));
            h.appendChild(el('b', '', t.name));
            box.appendChild(h);
            box.appendChild(hateRow(t.up, up, -1));
            box.appendChild(hateRow(t.dn, dn, -1));
            box.appendChild(el('p', 'et-topic-v', topicVerdict(up, dn)));
            bd.appendChild(box);
        });
    }

    // Tükörpárok eredménye: témánként egy kétoldalú sáv
    function renderMirror(m) {
        var bd = card('trans', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Tükörpárok: melyik oldal lenézése zavar jobban?'));
        bd.appendChild(el('p', 'et-joke mb-3', 'A jelölő jobbra: a kisebbségi oldal lenézése zavar jobban. Balra: a többségié. Középen: mindkettő egyformán.'));
        D.TOPICS.forEach(function (t) {
            bd.appendChild(axisRow({ name: t.name, icon: t.icon, neg: t.majSide, pos: t.minSide }, m[t.id]));
        });
    }

    function renderHatedTop(r, counts) {
        var bd = card('red', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-3', 'A legkevésbé szimpatikus érték'));
        if (r.h.length) {
            var h1 = C.find(D.HATED, r.h[0]);
            bd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            bd.appendChild(el('p', 'et-joke mb-2', 'Ez az, ' + h1.blurb + '.'));
            bd.appendChild(el('p', 'mb-2', h1.roast));
            if (r.h[1]) {
                var h2 = C.find(D.HATED, r.h[1]);
                bd.appendChild(el('p', 'text-muted mb-0', 'Mellette még: ' + h2.name.toLowerCase() + '.'));
            }
        } else bd.appendChild(el('p', 'mb-0', 'Nem találtunk kifejezetten utált értéket: vagy nagyon békés vagy, vagy nagyon gyorsan kattintgattál.'));
        if (counts) {
            var tally = el('div', 'et-tally');
            D.HATED.map(function (h, i) { return { h: h, c: counts[h.id] || 0, i: i }; })
                .sort(function (a, b) { return b.c - a.c || a.i - b.i; }).filter(function (x) { return x.c > 0; })
                .forEach(function (x) { tally.appendChild(el('span', 'et-tally-i', x.h.name + ' · ' + x.c + '×')); });
            if (tally.firstChild) bd.appendChild(tally);
        }
    }

    function renderHonesty(r) {
        var hn = r.honesty, tier = C.honestyTier(hn.index);
        var hbd = card(hn.index >= 70 ? 'blue' : 'pink', true);
        var hh = el('h3', 'h5 fw-bold mb-3');
        hh.appendChild(el('span', 'et-emo', '🕵️'));
        hh.appendChild(document.createTextNode(' Hazugságvizsgáló'));
        hbd.appendChild(hh);
        var meter = el('div', 'et-honest');
        var tr = el('div', 'et-htrack');
        tr.setAttribute('role', 'img');
        tr.setAttribute('aria-label', 'Őszinteség: ' + hn.index + ' a 100-ból');
        var hf = el('i', 'et-hfill honest t' + (hn.index >= 70 ? 'good' : hn.index >= 45 ? 'mid' : 'bad'));
        hf.style.width = hn.index + '%';
        tr.appendChild(hf);
        meter.appendChild(tr);
        hbd.appendChild(meter);
        hbd.appendChild(el('p', 'et-hated mt-3 mb-1', tier.name + ' · ' + hn.index + '%'));
        hbd.appendChild(el('p', 'mb-3', tier.text));

        var lies = hn.lies, twins = hn.twins;
        if (lies) {
            if (lies.length) {
                hbd.appendChild(el('p', 'fw-bold mb-1', 'Gyanús bólintások (' + lies.length + ')'));
                var ul = el('ul', 'et-flags');
                lies.forEach(function (l) {
                    var li = el('li');
                    li.appendChild(el('span', '', '„' + stText(l.id) + '”'));
                    var q = C.find(LONG, l.id);
                    if (q && q.joke) li.appendChild(el('em', '', ' ' + q.joke));
                    ul.appendChild(li);
                });
                hbd.appendChild(ul);
            }
            if (twins.length) {
                hbd.appendChild(el('p', 'fw-bold mb-1', 'Ellentmondások (' + twins.length + ')'));
                var ul2 = el('ul', 'et-flags');
                twins.forEach(function (t) {
                    var li = el('li');
                    li.appendChild(el('span', '', 'Egyszerre értettél egyet ezzel: „' + stText(t.a) + '” és ezzel: „' + stText(t.b) + '”.'));
                    ul2.appendChild(li);
                });
                hbd.appendChild(ul2);
            }
            if (hn.straight) hbd.appendChild(el('p', 'mb-2', '🔁 Szinte mindenre ugyanazt a választ nyomtad: ez a teszt szerint inkább gyors kattintgatás, mint vélemény.'));
            if (!lies.length && !twins.length && !hn.straight) hbd.appendChild(el('p', 'mb-2', '✔ Nem találtunk lehetetlen állítást és önellentmondást.'));
        } else {
            var parts = [];
            if (hn.liesN) parts.push(hn.liesN + ' lehetetlen állítást elfogadott');
            if (hn.twinsN) parts.push(hn.twinsN + ' ellentmondó állításpárt is megerősített');
            if (hn.straight) parts.push('szinte mindenre ugyanazt válaszolta');
            hbd.appendChild(el('p', 'mb-2', parts.length ? 'Ez a kitöltő ' + parts.join(', ') + '.' : '✔ Nem találtunk lehetetlen állítást és önellentmondást.'));
        }
        hbd.appendChild(el('p', 'et-hint mb-0 mt-2', 'Játék, nem igazi hazugságvizsgálat: a „soha” és „mindig” állításokat, az ellentétes állításpárokat és az „mindenre ugyanaz” mintát figyeljük.'));
    }

    // ---------- Fejlesztői nézet az eredményben: hozzájárulások ----------
    function ansLabel(v) {
        if (typeof v !== 'number') return 'passz';
        for (var i = 0; i < ANSWERS.length; i++) if (ANSWERS[i].v === v) return ANSWERS[i].short + ' (' + sgn(v) + ')';
        return String(v);
    }
    function devGroup(title, rows, unit) {
        var det = el('details', 'et-devgroup');
        var sum = el('summary', '');
        sum.appendChild(el('b', '', title));
        var tot = 0;
        rows.forEach(function (x) { tot += x.pts; });
        sum.appendChild(el('span', 'et-devsum', ' · ' + rows.length + ' kérdés · összesen ' + sgn(Math.round(tot * 10) / 10) + ' ' + unit));
        det.appendChild(sum);
        var tbl = el('table', 'et-devtable');
        var thead = el('tr');
        ['Kérdés', 'Válaszod', 'Súly', 'Pont'].forEach(function (t) { thead.appendChild(el('th', '', t)); });
        tbl.appendChild(thead);
        rows.forEach(function (x) {
            var tr = el('tr', x.pts === 0 ? 'zero' : (x.pts > 0 ? 'up' : 'dn'));
            tr.appendChild(el('td', 'q', x.text));
            tr.appendChild(el('td', '', ansLabel(x.v)));
            tr.appendChild(el('td', '', sgn(x.weight)));
            tr.appendChild(el('td', 'p', sgn(x.pts)));
            tbl.appendChild(tr);
        });
        det.appendChild(tbl);
        return det;
    }
    function renderDevResult() {
        var bd = card('trans', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', '🛠 Fejlesztői mód: mi járult hozzá?'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Minden sor: a kérdés, a válaszod, a kérdés súlya és az eredményhez adott pont (az eredmény sávján ennyit mozdított). Nyisd ki az egyes tengelyeket.'));
        var mode = st.mode;
        if (mode === 'hshort') {
            bd.appendChild(el('p', 'mb-1 fw-bold', 'Választott párok'));
            var ul = el('ul', 'et-flags');
            st.picks.forEach(function (p, i) {
                var rd = ROUNDS[i], li = el('li');
                if (rd.t === 'hate') li.textContent = rd.ids.map(function (id) { return C.find(D.HATED, id).name; }).join(' vs ') + ' → ' + C.find(D.HATED, p).name + ' zavar jobban (+1).';
                else li.textContent = C.find(D.TOPICS, rd.m.topic).name + ': ' + (p === 'min' ? 'a kisebbségi oldal lenézése zavar jobban (+1)' : 'a többségi oldal lenézése zavar jobban (−1)') + '.';
                ul.appendChild(li);
            });
            bd.appendChild(ul);
            return;
        }
        var L = mode === 'short' ? ST : (mode === 'hlong' ? LONG_B : LONG);
        var bk = C.breakdown(st.ansById, L);
        if (MODES[mode].axes) {
            D.AXES.forEach(function (a) {
                var rows = bk.axes[a.id];
                if (rows.length) bd.appendChild(devGroup(a.icon + ' ' + a.name + ': ' + (C.axisScores(st.ansById, L)[a.id]) + ' (−100 … +100)', rows, 'pont'));
            });
        }
        if (mode !== 'short') {
            D.HATED.forEach(function (h) { if (bk.hated[h.id].length) bd.appendChild(devGroup('🙅 ' + h.name + ': ' + st.result.hs[h.id] + ' / 100', bk.hated[h.id], 'pont')); });
            D.PREJ.forEach(function (p) { if (bk.prej[p.id].length) bd.appendChild(devGroup('📊 ' + p.name + ': ' + st.result.pj[p.id] + ' / 100', bk.prej[p.id], 'pont')); });
        } else {
            bd.appendChild(el('p', 'mb-1 mt-2 fw-bold', 'Választott párok és tükörpárok'));
            var ul2 = el('ul', 'et-flags');
            st.picks.forEach(function (p, i) {
                var rd = ROUNDS[i], li = el('li');
                if (rd.t === 'hate') li.textContent = rd.ids.map(function (id) { return C.find(D.HATED, id).name; }).join(' vs ') + ' → ' + C.find(D.HATED, p).name + ' (+1).';
                else li.textContent = C.find(D.TOPICS, rd.m.topic).name + ': ' + (p === 'min' ? 'kisebbségi oldal (+1)' : 'többségi oldal (−1)') + '.';
                ul2.appendChild(li);
            });
            bd.appendChild(ul2);
        }
        if (mode === 'long') {
            var hn = st.result.honesty;
            bd.appendChild(el('p', 'et-dev-n', 'Őszinteség: 100 − ' + (100 - hn.index) + ' levonás (lehetetlen állítás: 12/6–12 pont, ellentmondó iker-pár: 10/6–10, mindenre ugyanaz: 30).'));
        }
    }

    // ---------- Eredmény ----------
    function renderResult() {
        var r = st.result;
        var kind = kindOf(r);

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

        if (kind === 'short' || kind === 'long') {
            var ar = C.find(D.ARCHETYPES, r.a);
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

            var ab = card('blue', true);
            ab.appendChild(el('h3', 'h5 fw-bold mb-3', 'Értékrend-térkép'));
            D.AXES.forEach(function (ax) { ab.appendChild(axisRow(ax, r.s[ax.id])); });
        } else {
            var head = el('div', 'card shadow-sm border-0 et-card et-hero');
            head.setAttribute('data-tone', 'red');
            var hd = el('div', 'card-body p-4 p-md-5 text-center');
            hd.appendChild(el('div', 'et-emoji', '🙅'));
            hd.appendChild(el('div', 'et-kicker', kind === 'hlong' ? 'Utált értékek: részletes' : 'Utált értékek: gyors'));
            var t1 = r.h.length ? C.find(D.HATED, r.h[0]) : null;
            hd.appendChild(el('h2', 'h2 fw-bold et-title', t1 ? t1.name : 'Békés lélek'));
            hd.appendChild(el('p', 'mb-0 et-desc', t1 ? t1.roast : 'Nem találtunk kifejezetten utált értéket. Vagy nagyon békés vagy, vagy mindenhol középen álltál.'));
            head.appendChild(hd);
            stage.appendChild(head);
        }

        if (kind === 'short') {
            renderHatedTop(r);
            if (r.m) renderMirror(r.m);
        } else if (kind === 'long') {
            renderHatedScales(r);
            if (r.pj) renderPrej(r);
            renderHonesty(r);
        } else if (kind === 'hlong') {
            renderHatedScales(r);
            renderPrej(r);
        } else {
            renderHatedTop(r, r.counts);
            renderMirror(r.m);
        }

        if (st.dev && !st.shared && (st.ansById || st.mode === 'hshort')) renderDevResult();
        else if (st.dev && st.shared) {
            var dn = card('trans', true);
            dn.appendChild(el('p', 'et-dev-n mb-0', '🛠 Fejlesztői mód: megosztott eredménynél nincsenek válaszok, ezért nincs kérdésenkénti bontás. Töltsd ki a tesztet te is.'));
        }

        if (!st.shared) {
            var sb = card('pink', true);
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
        }

        stage.appendChild(el('p', 'et-hint text-center mt-4', 'Szórakoztató teszt, nem tudományos mérés: sem pártot, sem világnézetet nem ajánl. Ha nem értesz egyet az eredménnyel, az a teszt hibája. 🧭'));
    }

    // ---------- Billentyűk ----------
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var tn = e.target && e.target.tagName;
        if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || tn === 'SUMMARY') return;
        if (st.phase === 'quiz') {
            if (e.key >= '1' && e.key <= '5') { e.preventDefault(); answer(ANSWERS[Number(e.key) - 1].v); }
            else if (e.key === 'Backspace') { e.preventDefault(); goBack(); }
        } else if (st.phase === 'hated') {
            var k = e.key.toLowerCase();
            var opts = roundOptions(ROUNDS[st.j]);
            if (k === 'a' || k === '1') { e.preventDefault(); pickRound(opts[0].val); }
            else if (k === 'b' || k === '2') { e.preventDefault(); pickRound(opts[1].val); }
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
    window.MFSZErtek.ui = {
        state: function () { return st; },
        answerAll: function (v) { list().forEach(function (_, i) { st.answers[i] = v; }); },
        setDev: setDev
    };
})();
