// =========================================================
// ÉRTÉKTEST - felület
// Fázisok: bevezető (gyors / részletes mód) -> állítások (1-5 gombbal / billentyűvel) -> (gyors módban) "melyik zavar jobban" körök -> eredmény.
// A részletes mód 70 állítása az értékeket, az utált értékek skáláit és az őszinteség-vizsgálót is táplálja.
// Az eredmény a link #r= részében utazik (base64url JSON), így megosztható, és nem mentünk semmit.
// =========================================================
(function () {
    'use strict';

    var D = window.MFSZErtek.data, C = window.MFSZErtek.core;
    var stage = document.getElementById('et-stage');
    var ST = D.STATEMENTS, PAIRS = D.HATED_PAIRS, LONG = D.LONG;

    var ANSWERS = [
        { v: -2, label: 'Egyáltalán nem értek egyet', short: 'Nem, soha', cls: 'no2' },
        { v: -1, label: 'Inkább nem értek egyet', short: 'Inkább nem', cls: 'no1' },
        { v: 0, label: 'Nem tudom / közepes', short: 'Passz-félék', cls: 'mid' },
        { v: 1, label: 'Inkább egyetértek', short: 'Inkább igen', cls: 'yes1' },
        { v: 2, label: 'Teljesen egyetértek', short: 'Igen, abszolút', cls: 'yes2' }
    ];

    var st = { phase: 'intro', mode: 'short', i: 0, answers: [], j: 0, picks: [], result: null, shared: false };
    function list() { return st.mode === 'long' ? LONG : ST; }

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

    function startMode(mode) {
        st.mode = mode; st.i = 0; st.answers = []; st.j = 0; st.picks = [];
        setPhase('quiz');
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
        body.appendChild(el('div', 'et-emoji', '🧭'));
        body.appendChild(el('h2', 'h3 fw-bold mb-3', 'Hol állsz a nagy magyar értékvitában?'));
        body.appendChild(el('p', 'lead mb-3', 'Válassz hosszt: gyors kör kávé mellé, vagy részletes vizsgálat, ahol a hazugságot is lemérjük.'));
        var modes = el('div', 'et-modes');
        modes.appendChild(modeCard('quick', '☕', 'Gyors teszt', [
            ST.length + ' állítás, ' + PAIRS.length + ' „melyik zavar jobban?” kör',
            'Egy tréfás típus és a legutáltabb értéked',
            'Kb. 5 perc'
        ], 'Gyors kör', 'short'));
        modes.appendChild(modeCard('deep', '🔬', 'Részletes teszt', [
            LONG.length + ' állítás, mind az értékrendre és az utált értékekre is hat',
            'Mind a 10 utált érték külön 0–100 skálán',
            'Őszinteség-vizsgáló: lehetetlen állítások és ellentmondások',
            'Kb. 12 perc'
        ], 'Részletes teszt', 'long'));
        body.appendChild(modes);
        body.appendChild(el('p', 'text-muted mt-4 mb-0', 'Magyar ügyek, kávéházi hangulat, kakaóscsiga-nosztalgia. Nem pártot ajánl, nem ítélkezik, és semmit nem mentünk: az eredmény csak a megosztható linkben utazik.'));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function renderQuiz() {
        var L = list();
        var s = L[st.i];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'blue');
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(st.i + 1, L.length, st.mode === 'long' ? 'Részletes teszt' : 'Állítás'));
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
        if (st.i + 1 < list().length) { st.i++; render(); }
        else if (st.mode === 'long') finishLong();
        else { st.j = 0; st.picks = []; setPhase('hated'); }
    }
    function answersById(L) {
        var answers = {};
        L.forEach(function (s, i) { answers[s.id] = typeof st.answers[i] === 'number' ? st.answers[i] : null; });
        return answers;
    }
    function finishLong() {
        st.result = C.summarizeLong(answersById(LONG));
        st.shared = false;
        setPhase('result');
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
        st.result = C.summarize(answersById(ST), st.picks);
        st.shared = false;
        setPhase('result');
    }

    // ---------- Eredmény ----------
    function axisRow(ax, score) {
        var pole = score === 0 ? 'mid' : (score > 0 ? 'pos' : 'neg');
        var row = el('div', 'et-axis ' + pole);
        var head = el('div', 'et-axis-head');
        head.appendChild(el('b', '', ax.name));
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
        ends.appendChild(el('span', score < 0 ? 'lead' : '', ax.neg));
        ends.appendChild(el('span', score > 0 ? 'lead' : '', ax.pos));
        row.appendChild(ends);
        return row;
    }

    function resultText(r) {
        var ar = C.find(D.ARCHETYPES, r.a);
        var hated = r.h.length ? C.find(D.HATED, r.h[0]).name.toLowerCase() : null;
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

    // ---------- Részletes teszt: utált-érték skálák és őszinteség-vizsgáló ----------
    function hateRow(h, score, rank) {
        var row = el('div', 'et-hrow' + (rank === 0 ? ' top' : ''));
        var head = el('div', 'et-axis-head');
        head.appendChild(el('b', '', h.name));
        head.appendChild(el('span', '', score + ' / 100'));
        row.appendChild(head);
        var track = el('div', 'et-htrack');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', h.name + ': ' + score + ' a 100-ból');
        var fill = el('i', 'et-hfill ' + (score >= 58 ? 'hot' : score <= 42 ? 'cool' : 'mild'));
        fill.style.width = score + '%';
        track.appendChild(fill);
        row.appendChild(track);
        return row;
    }

    function stText(id) { var s = C.find(LONG, id); return s ? s.text : id; }

    function renderLongExtras(r) {
        var rank = C.hatedRanking(r.hs);
        var box = el('div', 'card shadow-sm border-0 et-card mt-4');
        box.setAttribute('data-tone', 'red');
        var bd = el('div', 'card-body p-4');
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Utált értékek skálája'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Minél hosszabb a sáv, annál jobban zavar az adott érték. Középen (50) a semleges.'));
        var top = rank[0];
        if (top.score >= 58) {
            var h1 = C.find(D.HATED, top.id);
            bd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            bd.appendChild(el('p', 'mb-3', h1.roast));
        } else bd.appendChild(el('p', 'mb-3', 'Egyik érték sem zavar kirívóan: vagy nagyon békés vagy, vagy mindenhol középen álltál.'));
        rank.forEach(function (x, i) { bd.appendChild(hateRow(C.find(D.HATED, x.id), x.score, i)); });
        var calm = rank.filter(function (x) { return x.score <= 42; });
        if (calm.length) {
            var last = rank[rank.length - 1];
            bd.appendChild(el('p', 'text-muted mt-3 mb-0', 'A legkevésbé zavar: ' + C.find(D.HATED, last.id).name.toLowerCase() + '. Ez a te komfortzónád.'));
        }
        box.appendChild(bd);
        stage.appendChild(box);

        var hn = r.honesty, tier = C.honestyTier(hn.index);
        var hb = el('div', 'card shadow-sm border-0 et-card mt-4');
        hb.setAttribute('data-tone', hn.index >= 70 ? 'blue' : 'pink');
        var hbd = el('div', 'card-body p-4');
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
        hb.appendChild(hbd);
        stage.appendChild(hb);
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

        if (r.long) { renderLongExtras(r); } else {
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
        }

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
    window.MFSZErtek.ui = { state: function () { return st; }, answerAll: function (v) { list().forEach(function (_, i) { st.answers[i] = v; }); } };
})();
