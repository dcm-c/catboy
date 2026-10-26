// =========================================================
// ÉRTÉKTEST - felület
// Módok:
//   short  Gyors: 50 értékállítás (10 tengely) + 1 rangsorolás + 2 ellenőrző kérdés. Opcionálisan: 10 „melyik zavar jobban?” pár + 8 tükörpár.
//   long   Részletes: 100 értékállítás + 3 rangsorolás + 5 ellenőrző kérdés. Opcionálisan: 54 állítás az utált értékekről és az előítéletekről.
//   xlong  Extra hosszú: 150 értékállítás + 5 rangsorolás + 7 ellenőrző kérdés. Opcionálisan: 72 állítás az utált értékekről és az előítéletekről.
//   hlong  Csak az utált értékek és az előítélet-barométer (54 állítás).
// Fontosnak jelölhető kérdések (csillag): gyors 1, részletes 2, extra hosszú 3; a jelölt állítás kétszeres súllyal számít.
// Az eredmény a link #r= részében utazik (tömör bináris kód), így megosztható, és nem mentünk semmit.
// Minden eredményhez megbízhatósági jelzés és kategóriánkénti, megosztható kép tartozik.
// Fejlesztői mód: kérdésenként megmutatja a súlyokat, az eredményben pedig azt, melyik válasz hány pontot adott hozzá.
// =========================================================
(function () {
    'use strict';

    var D = window.MFSZErtek.data, C = window.MFSZErtek.core, IMG = window.MFSZErtek.img;
    var stage = document.getElementById('et-stage');
    var PAIRS = D.HATED_PAIRS, MIRROR = D.MIRROR;

    var ANSWERS = [
        { v: -2, label: 'Egyáltalán nem értek egyet', short: 'Nem, soha', cls: 'no2' },
        { v: -1, label: 'Inkább nem értek egyet', short: 'Inkább nem', cls: 'no1' },
        { v: 0, label: 'Nem tudom / közepes', short: 'Passz-félék', cls: 'mid' },
        { v: 1, label: 'Inkább egyetértek', short: 'Inkább igen', cls: 'yes1' },
        { v: 2, label: 'Teljesen egyetértek', short: 'Igen, abszolút', cls: 'yes2' }
    ];
    // a: az értékrész tételei (A rész), b: az opcionális kiegészítő rész (utált értékek és előítéletek), rounds: a gyors teszt „párok” kiegészítése
    var MODES = {
        short: { a: D.A_LISTS.short, b: [], rounds: true },
        long: { a: D.A_LISTS.long, b: D.B_LISTS.long, rounds: false },
        xlong: { a: D.A_LISTS.xlong, b: D.B_LISTS.xlong, rounds: false },
        hlong: { a: [], b: D.B_LISTS.hlong, rounds: false }
    };
    // A fordulók: előbb a "melyik utált érték zavar jobban" párok, utána a tükörpárok
    var ROUNDS = PAIRS.map(function (p) { return { t: 'hate', ids: p }; }).concat(MIRROR.map(function (m) { return { t: 'mirror', m: m }; }));

    var st = { phase: 'intro', mode: 'short', part: 'a', list: [], i: 0, ans: {}, stars: {}, rk: {}, j: 0, picks: [], result: null, shared: false, dev: false, bDone: false };

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
    function sgn(n) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toString().replace('.', ','); }
    function minutes(n) { return Math.max(1, Math.round(n * 6.5 / 60)); }
    function btn(cls, label, fn) {
        var b = el('button', cls, label);
        b.type = 'button';
        b.addEventListener('click', fn);
        return b;
    }

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
        else if (st.phase === 'between') renderBetween();
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
        var M = MODES[mode];
        st.mode = mode; st.ans = {}; st.stars = {}; st.rk = {}; st.j = 0; st.picks = []; st.result = null; st.bDone = false; st.shared = false;
        st.part = M.a.length ? 'a' : 'b';
        st.list = M.a.length ? M.a : M.b;
        st.i = 0;
        setPhase('quiz');
    }

    function checksOf(list) { return list.filter(function (s) { return s.kind === 'l'; }).length; }
    function ranksOf(list) { return list.filter(function (s) { return s.kind === 'r'; }).length; }
    function valuesOf(list) { return list.filter(function (s) { return s.kind === 'v'; }).length; }

    function modeCard(cls, emoji, title, lines, label, mode) {
        var c = el('div', 'et-mode ' + cls);
        c.appendChild(el('div', 'et-mode-emoji', emoji));
        c.appendChild(el('b', 'et-mode-title', title));
        var ul = el('ul', 'et-mode-list');
        lines.forEach(function (l) { ul.appendChild(el('li', '', l)); });
        c.appendChild(ul);
        var go = btn('btn btn-primary-custom px-4', label, function () { startMode(mode); });
        go.id = 'et-start-' + mode;
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
        body.appendChild(el('p', 'lead mb-3', 'Tíz tengelyen, három hosszban: kávé melletti gyors kör, részletes vizsgálat vagy extra hosszú, ahol minden tengelyt alaposan körbejárunk.'));
        body.appendChild(el('p', 'text-muted mb-2', 'Minden eredmény mellé megbízhatósági jelzés is jár: a teszt szól, ha bizonytalan vagy ellentmondásos, nem megbízható eredmény született. Az utált értékek és az előítélet-barométer opcionális: az értékrész után eldöntheted, kéred-e.'));

        var A = MODES;
        body.appendChild(el('h3', 'et-sect', 'Értékrend-teszt, 10 tengely'));
        var modes = el('div', 'et-modes three');
        modes.appendChild(modeCard('quick', '☕', 'Gyors', [
            valuesOf(A.short.a) + ' állítás, mind a 10 tengelyen (tengelyenként 5)',
            D.twinsIn(A.short.a).length + ' ellentmondás-pár, ' + checksOf(A.short.a) + ' ellenőrző kérdés, ' + ranksOf(A.short.a) + ' rangsorolás',
            'Fontosnak jelölhetsz ' + D.STARS.short + ' kérdést (kétszeres súly)',
            'Opcionálisan: ' + PAIRS.length + ' „melyik zavar jobban?” kör + ' + MIRROR.length + ' tükörpár',
            'Kb. ' + minutes(A.short.a.length) + ' perc'
        ], 'Gyors teszt', 'short'));
        modes.appendChild(modeCard('deep', '🔬', 'Részletes', [
            valuesOf(A.long.a) + ' állítás (tengelyenként 10)',
            D.twinsIn(A.long.a).length + ' ellentmondás-pár, ' + checksOf(A.long.a) + ' ellenőrző kérdés, ' + ranksOf(A.long.a) + ' rangsorolás',
            'Fontosnak jelölhetsz ' + D.STARS.long + ' kérdést (kétszeres súly)',
            'Opcionálisan: ' + A.long.b.length + ' állítás az utált értékekről és előítéletekről',
            'Kb. ' + minutes(A.long.a.length) + ' perc'
        ], 'Részletes teszt', 'long'));
        modes.appendChild(modeCard('xdeep', '🧬', 'Extra hosszú', [
            valuesOf(A.xlong.a) + ' állítás (tengelyenként 15)',
            D.twinsIn(A.xlong.a).length + ' ellentmondás-pár, ' + checksOf(A.xlong.a) + ' ellenőrző kérdés, ' + ranksOf(A.xlong.a) + ' rangsorolás',
            'Fontosnak jelölhetsz ' + D.STARS.xlong + ' kérdést (kétszeres súly)',
            'Opcionálisan: ' + A.xlong.b.length + ' állítás az utált értékekről és előítéletekről',
            'Kb. ' + minutes(A.xlong.a.length) + ' perc'
        ], 'Extra hosszú teszt', 'xlong'));
        body.appendChild(modes);

        body.appendChild(el('h3', 'et-sect', 'Csak az utált értékek és az előítéletek'));
        var modes2 = el('div', 'et-modes');
        modes2.appendChild(modeCard('hdeep', '🧪', 'Utált értékek és előítélet-barométer', [
            A.hlong.b.length + ' állítás: 10 utált érték (közvetlen, fordított, összehasonlító és helyzetfüggő tételek) és 4 téma mindkét irányban',
            'Skálák 0–100 között, megbízhatósági jelzéssel',
            'Kb. ' + minutes(A.hlong.b.length) + ' perc'
        ], 'Csak utált és előítélet', 'hlong'));
        body.appendChild(modes2);

        if (st.dev) {
            body.appendChild(btn('et-devpill', '🛠 Fejlesztői mód be · kattints a kikapcsoláshoz', function () { setDev(false); })).id = 'et-devpill';
        }

        body.appendChild(el('p', 'text-muted mt-3 mb-0', 'Magyar ügyek, kávéházi hangulat, kakaóscsiga-nosztalgia. Nem pártot ajánl, nem ítélkezik, és semmit nem mentünk: az eredmény csak a megosztható linkben utazik.'));
        var vd = el('details', 'et-vers');
        vd.appendChild(el('summary', '', 'Teszt-verzió: ' + verLabel(D.VERSION)));
        var vl = el('ul', 'mb-0');
        D.VERSIONS.slice().reverse().forEach(function (x) { vl.appendChild(el('li', '', 'v' + x.v + ' (' + x.date + '): ' + x.note)); });
        vd.appendChild(vl);
        vd.appendChild(el('p', 'et-hint mb-0 mt-2', 'A megosztott linkek tartalmazzák a verziót, ezért a régi eredmények a régi tengelyekkel, típusokkal és utált értékekkel is helyesen jelennek meg.'));
        body.appendChild(vd);
        card.appendChild(body);
        stage.appendChild(card);
    }

    // Teszt-verziók: a megosztott eredmény a saját (régi) tengelyeivel, típusaival és utált-érték készletével jelenik meg
    function defsOf(r) { return C.defsFor((r && r.ver) || D.VERSION) || D; }
    function hdefs(r) { return defsOf(r).HATED; }
    function verInfo(v) {
        for (var i = 0; i < D.VERSIONS.length; i++) if (D.VERSIONS[i].v === v) return D.VERSIONS[i];
        return null;
    }
    function verLabel(v) { var i = verInfo(v); return 'v' + v + (i ? ' · ' + i.date : ''); }

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
        if (s.lie) add(s.expect === 'yes' ? 'ellenőrző kérdés: itt a „nem” válasz gyanús, az őszinteség csökken' : 'ellenőrző kérdés: itt az „igen” válasz gyanús, az őszinteség csökken', -1, 'lie');
        if (!box.firstChild) box.appendChild(el('span', 'et-devchip', 'Ez a kérdés nem mozgat tengelyt.'));
        return box;
    }
    function twinOf(id) {
        for (var i = 0; i < D.TWINS.length; i++) { if (D.TWINS[i][0] === id) return D.TWINS[i][1]; if (D.TWINS[i][1] === id) return D.TWINS[i][0]; }
        return null;
    }
    function devQuestion(s) {
        var box = el('div', 'et-dev');
        box.appendChild(el('div', 'et-dev-h', '🛠 Mit mozgat ez a kérdés? (azonosító: ' + s.id + ', szint: ' + (s.tier || (s.role ? 'B/' + s.role : '-')) + ')'));
        if (s.kind === 'r') {
            s.opts.forEach(function (o) { box.appendChild(el('p', 'et-dev-n', o.text)); box.appendChild(weightChips(o)); });
            box.appendChild(el('p', 'et-dev-n', 'A helyezésből válasz lesz: 1. hely +2, 2. +1, 3. 0, 4. −1, 5. −2; ezt szorozza a lehetőség súlya.'));
        } else box.appendChild(weightChips(s));
        if (st.stars[s.id]) box.appendChild(el('p', 'et-dev-n', '★ Fontosnak jelölve: a súlyai kétszeresen számítanak.'));
        var tw = twinOf(s.id);
        if (tw && C.find(st.list, tw)) box.appendChild(el('p', 'et-dev-n', 'Iker-kérdés: ' + tw + ' (ha mindkettővel egyetértesz, ellentmondás).'));
        box.appendChild(el('p', 'et-dev-n', 'Egyetértés → a + irány felé, nemleges válasz → a − irány felé. Értelmezés: az érték = Σ(válasz × súly) / Σ(2 × |súly|).'));
        if (st.part === 'a') {
            var sc = C.axisScores(st.ans, st.list.slice(0, st.i + 1), undefined, st.stars);
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
    function partInfo() {
        var s = st.list[st.i], M = MODES[st.mode];
        if (st.part === 'a') return { label: (M.b.length || M.rounds ? '1. rész · ' : '') + 'Értékrend', now: st.i + 1, total: st.list.length, tone: 'blue' };
        return { label: (M.a.length ? '2. rész · ' : '') + (s.kind === 'p' ? 'Előítélet-barométer' : 'Utált értékek'), now: st.i + 1, total: st.list.length, tone: 'red' };
    }

    function renderQuiz() {
        var L = st.list;
        var s = L[st.i];
        var pi = partInfo();
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', pi.tone);
        var body = el('div', 'card-body p-4');
        body.appendChild(progress(pi.now, pi.total, pi.label));
        if (st.part === 'a' && st.i === 0) {
            body.appendChild(el('p', 'et-partnote blue', 'Az „egyetértek” azt jelenti: ez az én véleményem. Vannak köztük fordított és ellentétes állítások is, ez szándékos: így nem lehet „kitalálni a jó választ”. Ha nem tudod, válaszd a középsőt vagy hagyd ki. Néhány kérdés rangsorolós, és ' + D.STARS[st.mode] + ' állítást ☆-gal fontosnak jelölhetsz: az kétszeres súllyal számít. Az ellenőrző kérdéseknél néha az „igen”, néha a „nem” az őszinte válasz.'));
        }
        if (st.part === 'b' && st.i === 0) {
            body.appendChild(el('p', 'et-partnote', 'Az „egyetértek” itt azt jelenti: ez engem zavar, vagy ez az én véleményem. Vannak fordított, összehasonlító és helyzetfüggő állítások is. Nem minősítünk senkit, csak a hozzáállásodat mérjük.'));
        }
        if (s.kind === 'p' && !L.slice(0, st.i).some(function (x) { return x.kind === 'p'; })) {
            body.appendChild(el('p', 'et-partnote', 'Ebben a szakaszban az előítélet-barométer állításai jönnek. Fordított állítások is vannak: ott az egyetértés a nyitottabb, elfogadóbb hozzáállást jelzi. Mindegyik a hozzáállásodat méri, senkit nem minősítünk.'));
        }
        var q = el('p', 'et-statement', s.text);
        q.setAttribute('aria-live', 'polite');
        body.appendChild(q);
        if (s.help) body.appendChild(el('p', 'et-help', 'ℹ️ ' + s.help));
        if (s.joke) body.appendChild(el('p', 'et-joke', s.joke));
        if (s.kind === 'r') { renderRank(body, s); card.appendChild(body); stage.appendChild(card); return; }
        if (canStar(s)) body.appendChild(starBox(s));
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
            if (st.ans[s.id] === a.v) b.classList.add('on');
            b.addEventListener('click', function () { answer(a.v); });
            grid.appendChild(b);
        });
        body.appendChild(grid);
        var row = el('div', 'et-nav');
        var back = btn('btn btn-sm btn-outline-secondary', '← Vissza', goBack);
        back.disabled = st.i === 0 && !(st.part === 'b' && MODES[st.mode].a.length);
        row.appendChild(back);
        row.appendChild(btn('btn btn-sm btn-outline-secondary', 'Passz, kihagyom', function () { answer(null); }));
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: 1–5 a válaszhoz' + (canStar(s) ? ', F a fontosnak jelöléshez' : '') + ', Backspace a visszalépéshez.'));
        if (st.dev) body.appendChild(devQuestion(s));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function advance() {
        if (st.i + 1 < st.list.length) { st.i++; render(); return; }
        endPart();
    }
    function answer(v) {
        st.ans[st.list[st.i].id] = v;
        advance();
    }

    // ---------- Fontos-jelölés (csillag): a jelölt állítás kétszeres súllyal számít ----------
    function starMax() { return D.STARS[st.mode] || 0; }
    function starCount() { return Object.keys(st.stars).length; }
    function canStar(s) { return st.part === 'a' && s.kind === 'v' && starMax() > 0; }
    function toggleStar(id) {
        if (st.stars[id]) delete st.stars[id];
        else if (starCount() >= starMax()) {
            toast('Legfeljebb ' + starMax() + ' kérdést jelölhetsz fontosnak. Vedd le valamelyik csillagot, ha másikat szeretnél.');
            return;
        } else st.stars[id] = true;
        render();
    }
    function starBox(s) {
        var box = el('div', 'et-starbar');
        var on = !!st.stars[s.id];
        var b = btn('et-star' + (on ? ' on' : ''), on ? '★ Fontos nekem' : '☆ Ez fontos nekem', function () { toggleStar(s.id); });
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.title = 'A fontosnak jelölt kérdés kétszeres súllyal számít az eredménybe (billentyű: F)';
        box.appendChild(b);
        box.appendChild(el('span', 'et-starcount', 'Fontos kérdések: ' + starCount() + ' / ' + starMax() + ' (kétszeres súllyal számítanak)'));
        return box;
    }

    // ---------- Rangsorolós feladat: koppintással sorba állítjuk a lehetőségeket ----------
    function rankOrder(s) {
        var o = st.rk[s.id];
        if (!o) {
            var done = s.opts.every(function (x) { return typeof st.ans[x.id] === 'number'; });
            o = done ? s.opts.slice().sort(function (a, b) { return st.ans[b.id] - st.ans[a.id]; }).map(function (x) { return x.id; }) : [];
            st.rk[s.id] = o;
        }
        return o;
    }
    function saveRank(s) {
        var o = st.rk[s.id];
        s.opts.forEach(function (x) { delete st.ans[x.id]; });
        if (o.length === s.opts.length) o.forEach(function (id, i) { st.ans[id] = D.RANK_VALUES[i]; });
    }
    function pickRank(s, id) {
        var o = rankOrder(s), at = o.indexOf(id);
        if (at >= 0) o.splice(at, 1);
        else {
            o.push(id);
            // az utolsó lehetőséget magunk kitöltjük
            if (o.length === s.opts.length - 1) s.opts.forEach(function (x) { if (o.indexOf(x.id) < 0) o.push(x.id); });
        }
        saveRank(s);
        render();
    }
    function clearRank(s) { st.rk[s.id] = []; saveRank(s); }
    function renderRank(body, s) {
        var o = rankOrder(s), full = o.length === s.opts.length;
        var list = el('div', 'et-rank');
        list.setAttribute('role', 'group');
        list.setAttribute('aria-label', 'Rangsor: koppints sorban a lehetőségekre');
        s.opts.forEach(function (x, idx) {
            var pos = o.indexOf(x.id);
            var b = el('button', 'et-rk' + (pos >= 0 ? ' on' : ''));
            b.type = 'button';
            b.appendChild(el('span', 'et-rk-n', pos >= 0 ? String(pos + 1) : '·'));
            b.appendChild(el('span', 'et-rk-t', x.text));
            b.appendChild(el('span', 'et-key', String(idx + 1)));
            b.setAttribute('aria-label', x.text + (pos >= 0 ? ' – ' + (pos + 1) + '. hely, koppints a levételhez' : ' – még nincs a sorban (billentyű: ' + (idx + 1) + ')'));
            b.addEventListener('click', function () { pickRank(s, x.id); });
            list.appendChild(b);
        });
        body.appendChild(list);
        body.appendChild(el('p', 'et-hint', full ? '✔ Kész a sorrend. Átrendezéshez koppints egy elemre a levételhez, aztán újra sorba.' : 'Még ' + (s.opts.length - o.length) + ' lehetőség hátra. Koppints elsőnek arra, ami a legfontosabb.'));
        var row = el('div', 'et-nav');
        var back = btn('btn btn-sm btn-outline-secondary', '← Vissza', goBack);
        back.disabled = st.i === 0 && !(st.part === 'b' && MODES[st.mode].a.length);
        row.appendChild(back);
        var mid = el('div', 'd-flex gap-2 flex-wrap');
        mid.appendChild(btn('btn btn-sm btn-outline-secondary', 'Újrakezdés', function () { clearRank(s); render(); }));
        mid.appendChild(btn('btn btn-sm btn-outline-secondary', 'Passz, kihagyom', function () { clearRank(s); advance(); }));
        row.appendChild(mid);
        var next = btn('btn btn-sm btn-primary-custom', 'Tovább →', function () { if (full) advance(); });
        next.id = 'et-rank-next';
        next.disabled = !full;
        row.appendChild(next);
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: 1–5 a lehetőség kiválasztásához, Backspace a visszalépéshez.'));
        if (st.dev) body.appendChild(devQuestion(s));
    }

    // A rész vége: ha van opcionális kiegészítő rész, megkérdezzük, kéri-e
    function endPart() {
        var M = MODES[st.mode];
        if (st.part === 'a' && (M.b.length || M.rounds)) { setPhase('between'); return; }
        if (st.part === 'b') st.bDone = true;
        finish();
    }

    function startB() {
        var M = MODES[st.mode];
        st.bDone = false;
        if (M.rounds) { st.j = 0; st.picks = []; setPhase('hated'); return; }
        st.part = 'b'; st.list = M.b; st.i = 0;
        setPhase('quiz');
    }

    function goBack() {
        if (st.phase === 'quiz') {
            if (st.i > 0) { st.i--; render(); return; }
            if (st.part === 'b' && MODES[st.mode].a.length) { st.part = 'a'; st.list = MODES[st.mode].a; st.i = st.list.length - 1; render(); }
        } else if (st.phase === 'hated') {
            if (st.j > 0) { st.j--; st.picks.pop(); render(); }
            else setPhase('between');
        }
    }

    function renderBetween() {
        var M = MODES[st.mode];
        var card = el('div', 'card shadow-sm border-0 et-card');
        card.setAttribute('data-tone', 'pink');
        var body = el('div', 'card-body p-4 p-md-5 text-center');
        body.appendChild(el('div', 'et-emoji', '🎉'));
        body.appendChild(el('h2', 'h3 fw-bold mb-3', 'Kész az értékrend-térképed!'));
        var n = M.rounds ? ROUNDS.length : M.b.length;
        body.appendChild(el('p', 'lead mb-2', M.rounds
            ? 'Szeretnél még ' + PAIRS.length + ' „melyik zavar jobban?” kört és ' + MIRROR.length + ' tükörpárt is? (kb. ' + minutes(n * 0.8) + ' perc)'
            : 'Szeretnéd folytatni az utált értékekkel és az előítélet-barométerrel? (' + n + ' állítás, kb. ' + minutes(n) + ' perc)'));
        body.appendChild(el('p', 'text-muted mb-4', 'Ez a rész teljesen opcionális: az értékrend-térképed már kész, ezen nem változtat. Ha kihagyod, később az eredményoldalról is megcsinálhatod.'));
        var row = el('div', 'd-flex flex-wrap gap-2 justify-content-center');
        var yes = btn('btn btn-primary-custom px-4', 'Igen, folytatom', startB);
        yes.id = 'et-b-yes';
        var no = btn('btn btn-secondary-custom px-4', 'Nem, mutasd az eredményt', function () { st.bDone = false; finish(); });
        no.id = 'et-b-no';
        row.appendChild(yes); row.appendChild(no);
        body.appendChild(row);
        var nav = el('div', 'et-nav mt-3 justify-content-center');
        nav.appendChild(btn('btn btn-sm btn-outline-secondary', '← Vissza az utolsó kérdéshez', function () { st.i = st.list.length - 1; setPhase('quiz'); }));
        body.appendChild(nav);
        card.appendChild(body);
        stage.appendChild(card);
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
        body.appendChild(progress(st.j + 1, ROUNDS.length, '2. rész · ' + (rd.t === 'hate' ? 'Utált értékek' : 'Tükörpár')));
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
        row.appendChild(btn('btn btn-sm btn-outline-secondary', '← Vissza', goBack));
        body.appendChild(row);
        body.appendChild(el('p', 'et-hint', 'Billentyűk: A vagy 1 az első, B vagy 2 a második.'));
        if (st.dev) body.appendChild(devRound(rd));
        card.appendChild(body);
        stage.appendChild(card);
    }

    function pickRound(val) {
        st.picks.push(val);
        if (st.j + 1 < ROUNDS.length) { st.j++; render(); return; }
        st.bDone = true;
        finish();
    }

    function finish() {
        var np = PAIRS.length;
        if (st.mode === 'hlong') st.result = C.summarizeHated(st.ans);
        else st.result = C.summarizeValues(st.mode, st.ans, { b: st.bDone, picks: st.picks.slice(0, np), mirror: st.picks.slice(np), stars: st.stars });
        st.shared = false;
        setPhase('result');
    }

    // ---------- Eredmény: közös elemek ----------
    function icoBadge(txt, cls) { return el('span', 'et-ico ' + (cls || ''), txt); }

    function axisRow(ax, score, lv) {
        var pole = score === 0 ? 'mid' : (score > 0 ? 'pos' : 'neg');
        var row = el('div', 'et-axis ' + pole);
        var head = el('div', 'et-axis-head');
        var nm = el('b', 'et-axis-name');
        if (ax.icon) nm.appendChild(icoBadge(ax.icon));
        nm.appendChild(document.createTextNode(ax.name));
        head.appendChild(nm);
        var side = score === 0 ? 'középen' : (Math.abs(score) + '% ' + (score > 0 ? ax.pos : ax.neg).toLowerCase());
        var right = el('span', 'et-axis-right');
        if (lv !== undefined && lv !== null) {
            var lvl = D.AXIS_LEVELS[lv];
            var cert = el('span', 'et-cert c' + lv, lvl.name);
            cert.title = 'Ezen a tengelyen a válaszaid: ' + lvl.text;
            right.appendChild(cert);
        }
        right.appendChild(el('span', 'et-chip', side));
        head.appendChild(right);
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
        var hated = r.h && r.h.length ? C.find(hdefs(r), r.h[0]).name.toLowerCase() : null;
        if (!r.s) {
            return 'Utált értékek teszt: ' + (hated ? 'legjobban a(z) ' + hated + ' zavar.' : 'nem találtam kirívóan zavaró értéket.') + ' Te mit kapnál?';
        }
        var ar = C.find(defsOf(r).ARCHETYPES, r.a);
        var rel = r.rel ? ' Megbízhatóság: ' + C.relTier(r.rel.index).name.toLowerCase() + '.' : (r.honesty && r.honesty.index !== undefined ? ' Őszinteség: ' + C.honestyTier(r.honesty.index).name + ' (' + r.honesty.index + '%).' : '');
        return 'Értékteszt: ' + ar.title + ' (' + r.fit + '% illeszkedés)' + (hated ? ', legjobban a(z) ' + hated + ' zavar.' : '.') + rel + ' Te mit kapnál?';
    }
    function shareUrl(r) { return st.shared ? location.href : pageBase() + '#r=' + C.encode(r); }

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

    function stText(id) { var s = C.find(D.ALL, id); return s ? s.text : id; }

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
        var HD = hdefs(r), rank = C.hatedRanking(r.hs, HD);
        var bd = card('red', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Utált értékek skálája'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Minél hosszabb a sáv, annál jobban zavar az adott érték. Középen (50) a semleges.'));
        var top = rank[0];
        if (top.score >= 58) {
            var h1 = C.find(HD, top.id);
            bd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            bd.appendChild(el('p', 'mb-3', h1.roast));
        } else bd.appendChild(el('p', 'mb-3', 'Egyik érték sem zavar kirívóan: vagy nagyon békés vagy, vagy mindenhol középen álltál.'));
        rank.forEach(function (x, i) { bd.appendChild(hateRow(C.find(HD, x.id).name, x.score, i)); });
        var calm = rank.filter(function (x) { return x.score <= 42; });
        if (calm.length) {
            var last = rank[rank.length - 1];
            bd.appendChild(el('p', 'text-muted mt-3 mb-0', 'A legkevésbé zavar: ' + C.find(HD, last.id).name.toLowerCase() + '. Ez a te komfortzónád.'));
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
        bd.appendChild(el('p', 'et-joke mb-3', 'Négy témában, mindkét irányban: mennyire zavar egy-egy hozzáállás. 50 a semleges, a magasabb érték nagyobb fenntartás. A kérdések közt fordított és ellentétes hatású állítás is volt, ezért nem lehet „csak bólogatva” magas értéket kapni. Játékos felmérés: nem minősítünk csoportokat, csak a hozzáállásodat.'));
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
        var HD = hdefs(r);
        var bd = card('red', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-3', 'A legkevésbé szimpatikus érték'));
        if (r.h.length) {
            var h1 = C.find(HD, r.h[0]);
            bd.appendChild(el('p', 'et-hated', '🙅 ' + h1.name));
            bd.appendChild(el('p', 'et-joke mb-2', 'Ez az, ' + h1.blurb + '.'));
            bd.appendChild(el('p', 'mb-2', h1.roast));
            if (r.h[1]) {
                var h2 = C.find(HD, r.h[1]);
                bd.appendChild(el('p', 'text-muted mb-0', 'Mellette még: ' + h2.name.toLowerCase() + '.'));
            }
        } else bd.appendChild(el('p', 'mb-0', 'Nem találtunk kifejezetten utált értéket: vagy nagyon békés vagy, vagy nagyon gyorsan kattintgattál.'));
        if (counts) {
            var tally = el('div', 'et-tally');
            HD.map(function (h, i) { return { h: h, c: counts[h.id] || 0, i: i }; })
                .sort(function (a, b) { return b.c - a.c || a.i - b.i; }).filter(function (x) { return x.c > 0; })
                .forEach(function (x) { tally.appendChild(el('span', 'et-tally-i', x.h.name + ' · ' + x.c + '×')); });
            if (tally.firstChild) bd.appendChild(tally);
        }
    }

    // ---------- Megbízhatóság ----------
    function meter(index, label) {
        var wrap = el('div', 'et-honest');
        var tr = el('div', 'et-htrack');
        tr.setAttribute('role', 'img');
        tr.setAttribute('aria-label', label + ': ' + index + ' a 100-ból');
        var hf = el('i', 'et-hfill honest t' + (index >= 80 ? 'good' : index >= 40 ? 'mid' : 'bad'));
        hf.style.width = index + '%';
        tr.appendChild(hf);
        wrap.appendChild(tr);
        return wrap;
    }

    // Csak a kitöltő saját eredményénél: melyik kérdéseket jelölte fontosnak (ez nem utazik a linkben)
    function renderStarred(r) {
        var bd = card('pink', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', '★ Fontosnak jelölt kérdéseid'));
        bd.appendChild(el('p', 'text-muted mb-2', 'Ezek kétszeres súllyal számítottak az értékrend-térképbe.'));
        var ul = el('ul', 'et-flags mb-0');
        r.starred.forEach(function (id) {
            var li = el('li');
            li.appendChild(el('span', '', '„' + stText(id) + '”'));
            li.appendChild(el('b', '', ' – ' + ansLabel(st.ans[id])));
            ul.appendChild(li);
        });
        bd.appendChild(ul);
    }

    function renderReliability(r) {
        var rel = r.rel, tier = C.relTier(rel.index);
        var bd = card(rel.index >= 80 ? 'blue' : 'pink', true);
        var hh = el('h3', 'h5 fw-bold mb-3');
        hh.appendChild(el('span', 'et-emo', '🧪'));
        hh.appendChild(document.createTextNode(' Megbízhatóság'));
        bd.appendChild(hh);
        bd.appendChild(meter(rel.index, 'Megbízhatóság'));
        bd.appendChild(el('p', 'et-hated mt-3 mb-1', tier.name + ' · ' + rel.index + '%'));
        bd.appendChild(el('p', 'mb-3', tier.text));

        if (rel.flags.length) {
            bd.appendChild(el('p', 'fw-bold mb-1', 'Ezek rontották'));
            var ul = el('ul', 'et-flags');
            rel.flags.forEach(function (id) { var f = C.find(D.REL_FLAGS, id); if (f) ul.appendChild(el('li', '', f.text)); });
            bd.appendChild(ul);
        } else bd.appendChild(el('p', 'mb-3', '✔ Nem találtunk ellentmondást vagy gyanús mintát: a válaszaid következetesek.'));

        if (rel.axes) {
            bd.appendChild(el('p', 'fw-bold mb-1', 'Tengelyenként'));
            var chips = el('div', 'et-axchips');
            defsOf(r).AXES.forEach(function (a) {
                var lv = rel.axes[a.id];
                var ch = el('span', 'et-axchip c' + lv);
                ch.title = a.name + ': ' + D.AXIS_LEVELS[lv].name + ' (' + D.AXIS_LEVELS[lv].text + ')';
                ch.appendChild(el('span', 'et-axchip-i', a.icon));
                ch.appendChild(document.createTextNode(' ' + a.name + ' · ' + D.AXIS_LEVELS[lv].name));
                chips.appendChild(ch);
            });
            bd.appendChild(chips);
        }

        var hn = r.honesty;
        if (hn && hn.lies) {
            if (hn.lies.length) {
                bd.appendChild(el('p', 'fw-bold mb-1 mt-3', 'Gyanús válaszok az ellenőrző kérdéseken (' + hn.lies.length + ')'));
                var ul2 = el('ul', 'et-flags');
                hn.lies.forEach(function (l) {
                    var li = el('li');
                    li.appendChild(el('span', '', '„' + stText(l.id) + '”'));
                    li.appendChild(el('b', '', l.expect === 'yes' ? ' – nem értettél egyet, pedig ez szinte mindenkivel megtörtént.' : ' – egyetértettél, pedig ez szinte senkire nem igaz.'));
                    var q = C.find(D.ALL, l.id);
                    if (q && q.joke) li.appendChild(el('em', '', ' ' + q.joke));
                    ul2.appendChild(li);
                });
                bd.appendChild(ul2);
            }
            if (hn.twins.length) {
                bd.appendChild(el('p', 'fw-bold mb-1 mt-3', 'Ellentmondások (' + hn.twins.length + ')'));
                var ul3 = el('ul', 'et-flags');
                hn.twins.forEach(function (t) {
                    ul3.appendChild(el('li', '', 'Egyszerre értettél egyet ezzel: „' + stText(t.a) + '” és ezzel: „' + stText(t.b) + '”.'));
                });
                bd.appendChild(ul3);
            }
        } else if (hn && (hn.liesN || hn.twinsN)) {
            var parts = [];
            if (hn.liesN) parts.push(hn.liesN + ' gyanús választ adott az ellenőrző kérdéseken');
            if (hn.twinsN) parts.push(hn.twinsN + ' ellentmondó állításpárt is megerősített');
            bd.appendChild(el('p', 'mb-2 mt-3', 'Ez a kitöltő ' + parts.join(', ') + '.'));
        }
        bd.appendChild(el('p', 'et-hint mb-0 mt-2', 'Játék, nem igazi hazugságvizsgálat. Figyeljük az ellenőrző kérdéseket (némelyiknél az „igen”, másiknál a „nem” a gyanús válasz), az ellentétes állításpárokat, a „mindenre ugyanazt” mintát, a kihagyott és közepes válaszokat, valamint azt, hogy egy tengelyen belül mennyire keverednek az egymásnak ellentmondó válaszok.'));
    }

    // A régi (v1/v2) hosszú eredmények Hazugságvizsgáló kártyája: nincs bennük összetett megbízhatósági jelzés
    function renderOldHonesty(r) {
        var hn = r.honesty, tier = C.honestyTier(hn.index);
        var hbd = card(hn.index >= 70 ? 'blue' : 'pink', true);
        var hh = el('h3', 'h5 fw-bold mb-3');
        hh.appendChild(el('span', 'et-emo', '🕵️'));
        hh.appendChild(document.createTextNode(' Hazugságvizsgáló'));
        hbd.appendChild(hh);
        hbd.appendChild(meter(hn.index, 'Őszinteség'));
        hbd.appendChild(el('p', 'et-hated mt-3 mb-1', tier.name + ' · ' + hn.index + '%'));
        hbd.appendChild(el('p', 'mb-3', tier.text));
        var parts = [];
        if (hn.liesN) parts.push(hn.liesN + ' lehetetlen állítást elfogadott');
        if (hn.twinsN) parts.push(hn.twinsN + ' ellentmondó állításpárt is megerősített');
        if (hn.straight) parts.push('szinte mindenre ugyanazt válaszolta');
        hbd.appendChild(el('p', 'mb-2', parts.length ? 'Ez a kitöltő ' + parts.join(', ') + '.' : '✔ Nem találtunk lehetetlen állítást és önellentmondást.'));
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
        var r = st.result;
        var bd = card('trans', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', '🛠 Fejlesztői mód: mi járult hozzá?'));
        bd.appendChild(el('p', 'et-joke mb-3', 'Minden sor: a kérdés, a válaszod, a kérdés súlya és az eredményhez adott pont (az eredmény sávján ennyit mozdított). Nyisd ki az egyes tengelyeket.'));
        var M = MODES[st.mode];
        var L = M.a.concat(st.bDone ? M.b : []);
        var bk = C.breakdown(st.ans, L, st.stars);
        if (r.s) {
            var sc = C.axisScores(st.ans, M.a, undefined, st.stars);
            D.AXES.forEach(function (a) {
                var rows = bk.axes[a.id].filter(function (x) { return x.rank || M.a.some(function (y) { return y.id === x.id; }); });
                if (rows.length) bd.appendChild(devGroup(a.icon + ' ' + a.name + ': ' + sc[a.id] + ' (−100 … +100)', rows, 'pont'));
            });
        }
        if (r.hs) {
            D.HATED.forEach(function (h) { if (bk.hated[h.id].length) bd.appendChild(devGroup('🙅 ' + h.name + ': ' + r.hs[h.id] + ' / 100', bk.hated[h.id], 'pont')); });
            D.PREJ.forEach(function (p) { if (bk.prej[p.id].length) bd.appendChild(devGroup('📊 ' + p.name + ': ' + r.pj[p.id] + ' / 100', bk.prej[p.id], 'pont')); });
        }
        if (st.picks.length) {
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
        if (r.rel) {
            var rl = r.rel;
            bd.appendChild(el('p', 'et-dev-n', 'Megbízhatóság: ' + rl.index + ' (' + (rl.flags.length ? rl.flags.join(', ') : 'nincs jelzés') + '). Az őszinteség-levonás: ' + (r.honesty ? (100 - r.honesty.index) : 0) + ' pont (lehetetlen állítás 12/6–12, ellentmondó iker-pár 10/6–10, mindenre ugyanaz 30), ennek 90%-a számít bele.'));
        }
    }

    // ---------- Képek ----------
    function shareTextFor(cat, r) {
        var defs = defsOf(r), t;
        if (cat.id === 'values') { var ar = C.find(defs.ARCHETYPES, r.a); t = 'Értékteszt: ' + ar.title + ' (' + r.fit + '% illeszkedés)'; }
        else if (cat.id === 'hated') { var h = r.h && r.h.length ? C.find(defs.HATED, r.h[0]).name.toLowerCase() : null; t = 'Utált értékeim: ' + (h ? 'legjobban a(z) ' + h + ' zavar' : 'nincs kirívó'); }
        else if (cat.id === 'prej') t = 'Előítélet-barométerem';
        else t = 'Értékteszt megbízhatóság: ' + (r.rel ? C.relTier(r.rel.index).name.toLowerCase() : 'őszinteség ' + r.honesty.index + '%');
        return t + '. Te mit kapnál?';
    }
    function download(cv, name) {
        cv.toBlob(function (blob) {
            if (!blob) { toast('A kép mentése nem sikerült.'); return; }
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        }, 'image/png');
    }
    function shareImage(cv, cat, r, name) {
        var link = shareUrl(r);
        cv.toBlob(function (blob) {
            if (!blob) { toast('A kép mentése nem sikerült.'); return; }
            var file = null;
            try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
            var text = shareTextFor(cat, r) + ' ' + link;
            if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
                navigator.share({ files: [file], title: 'Értékteszt', text: text }).catch(function () { /* mégse */ });
            } else {
                download(cv, name);
                copyText(link, null).then(function () { toast('A kép letöltődött, a megosztási link a vágólapon van.'); }, function () { toast('A kép letöltődött.'); });
            }
        }, 'image/png');
    }
    function renderImages(r) {
        if (!IMG) return;
        var cats = IMG.available(r);
        if (!cats.length) return;
        var bd = card('pink', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', '🖼 Képek a megosztáshoz'));
        bd.appendChild(el('p', 'text-muted mb-3', 'Minden kategóriához készül egy kép: letöltheted, vagy közvetlenül megoszthatod. A kép nem tartalmaz személyes adatot, csak az eredményt.'));
        var grid = el('div', 'et-imgs');
        cats.forEach(function (c) {
            var fig = el('figure', 'et-img');
            var cv;
            try { cv = IMG.render(c, r); } catch (e) { return; }
            cv.className = 'et-img-cv';
            cv.setAttribute('role', 'img');
            cv.setAttribute('aria-label', 'Eredménykép: ' + c.label);
            cv.setAttribute('data-cat', c.id);
            fig.appendChild(cv);
            var cap = el('figcaption', 'et-img-cap');
            cap.appendChild(el('b', '', c.label));
            var row = el('div', 'd-flex gap-2 flex-wrap');
            var name = 'ertekteszt-' + c.file + '.png';
            row.appendChild(btn('btn btn-sm btn-outline-primary', 'Letöltés', function () { download(cv, name); }));
            row.appendChild(btn('btn btn-sm btn-primary-custom', 'Megosztás', function () { shareImage(cv, c, r, name); }));
            cap.appendChild(row);
            fig.appendChild(cap);
            grid.appendChild(fig);
        });
        bd.appendChild(grid);
    }

    // ---------- Eredmény ----------
    function renderContinue(r) {
        var M = MODES[st.mode];
        var bd = card('red', true);
        bd.appendChild(el('h3', 'h5 fw-bold mb-1', 'Kiegészítő rész: ' + (M.rounds ? 'utált értékek gyorsan' : 'utált értékek és előítélet-barométer')));
        bd.appendChild(el('p', 'text-muted mb-3', M.rounds
            ? 'Ha kíváncsi vagy, melyik érték zavar legjobban, és melyik oldal lenézése bosszant jobban: ' + PAIRS.length + ' pár és ' + MIRROR.length + ' tükörpár (kb. ' + minutes(ROUNDS.length * 0.8) + ' perc). Az értékrend-térképed nem változik.'
            : 'Még nem csináltad meg az opcionális részt: ' + M.b.length + ' állítás (kb. ' + minutes(M.b.length) + ' perc). Az értékrend-térképed nem változik, de kiegészül az utált értékek skálájával és az előítélet-barométerrel.'));
        var b = btn('btn btn-primary-custom', 'Folytatom a kiegészítő résszel', startB);
        b.id = 'et-b-continue';
        bd.appendChild(b);
    }

    function renderResult() {
        var r = st.result;

        if (st.shared) {
            var note = el('div', 'et-sharednote');
            note.appendChild(el('span', '', '🔗 Valaki megosztotta veled az eredményét (csak szórakozásból).'));
            note.appendChild(btn('btn btn-sm btn-primary-custom', 'Kitöltöm én is', function () {
                if (window.history && history.replaceState) history.replaceState(null, '', pageBase());
                st.shared = false; st.result = null; setPhase('intro');
            }));
            stage.appendChild(note);
            if ((r.ver || D.VERSION) !== D.VERSION) {
                var old = el('div', 'et-oldnote');
                old.setAttribute('role', 'note');
                old.appendChild(el('b', '', '🕰 Régebbi tesztverzióból származik (' + verLabel(r.ver) + ')'));
                var vi = verInfo(r.ver);
                old.appendChild(el('span', '', ' Az eredményt a link készítésekor érvényes tengelyekkel, típusokkal és utált értékekkel mutatjuk, ezért más nevek szerepelhetnek, mint a mostani tesztben.' + (vi ? ' ' + vi.note : '') + ' A mostani teszt: ' + verLabel(D.VERSION) + '.'));
                stage.appendChild(old);
            }
        }

        var defs = defsOf(r);
        if (r.s) {
            var ar = C.find(defs.ARCHETYPES, r.a);
            var hero = el('div', 'card shadow-sm border-0 et-card et-hero');
            hero.setAttribute('data-tone', 'trans');
            var hb = el('div', 'card-body p-4 p-md-5 text-center');
            hb.appendChild(el('div', 'et-emoji', ar.emoji));
            hb.appendChild(el('div', 'et-kicker', 'A te típusod'));
            hb.appendChild(el('h2', 'h2 fw-bold et-title', ar.title));
            hb.appendChild(el('div', 'et-fit', r.fit + '% illeszkedés'));
            hb.appendChild(el('p', 'mb-3 et-desc', ar.desc));
            hb.appendChild(el('p', 'et-sunday', '🍲 ' + ar.sunday));
            if (r.rel && r.a2 && r.rel.flags.indexOf('mixed') >= 0) {
                var a2 = C.find(defs.ARCHETYPES, r.a2);
                if (a2) hb.appendChild(el('p', 'et-second', 'Majdnem ugyanennyire illik rád: ' + a2.emoji + ' ' + a2.title + '.'));
            }
            hero.appendChild(hb);
            stage.appendChild(hero);

            var ab = card('blue', true);
            ab.appendChild(el('h3', 'h5 fw-bold mb-1', 'Értékrend-térkép'));
            if (r.rel && r.rel.axes) ab.appendChild(el('p', 'et-joke mb-3', 'A tengelyek mellett látszik, mennyire biztos az adott érték (biztos, közepes, bizonytalan): a válaszaid következetessége és a megválaszolt tételek száma alapján.'));
            var lastGroup = null;
            defs.AXES.forEach(function (ax) {
                if (ax.group && ax.group !== lastGroup) { ab.appendChild(el('h4', 'et-group', ax.group)); lastGroup = ax.group; }
                ab.appendChild(axisRow(ax, r.s[ax.id], r.rel && r.rel.axes ? r.rel.axes[ax.id] : null));
            });
        } else {
            var head = el('div', 'card shadow-sm border-0 et-card et-hero');
            head.setAttribute('data-tone', 'red');
            var hd = el('div', 'card-body p-4 p-md-5 text-center');
            hd.appendChild(el('div', 'et-emoji', '🙅'));
            hd.appendChild(el('div', 'et-kicker', r.kind === 'hshort' ? 'Utált értékek: gyors' : 'Utált értékek és előítéletek'));
            var t1 = r.h.length ? C.find(hdefs(r), r.h[0]) : null;
            hd.appendChild(el('h2', 'h2 fw-bold et-title', t1 ? t1.name : 'Békés lélek'));
            hd.appendChild(el('p', 'mb-0 et-desc', t1 ? t1.roast : 'Nem találtunk kifejezetten utált értéket. Vagy nagyon békés vagy, vagy mindenhol középen álltál.'));
            head.appendChild(hd);
            stage.appendChild(head);
        }

        if (r.starred && r.starred.length && !st.shared) renderStarred(r);

        if (r.rel) renderReliability(r);
        else if (r.honesty) renderOldHonesty(r);

        if (r.hs) { renderHatedScales(r); if (r.pj) renderPrej(r); }
        else if (r.counts) { renderHatedTop(r, r.counts); if (r.m) renderMirror(r.m); }
        else if (r.s && r.h) { if (r.m || r.h.length || r.kind === 'short' || !r.kind) { renderHatedTop(r); if (r.m) renderMirror(r.m); } }

        if (!st.shared && r.s && !r.hs && !r.m && !(r.h && r.h.length && r.kind === 'short' && st.bDone) && MODES[st.mode] && (MODES[st.mode].b.length || MODES[st.mode].rounds) && !st.bDone) renderContinue(r);

        if (st.dev && !st.shared && st.result) renderDevResult();
        else if (st.dev && st.shared) {
            var dn = card('trans', true);
            dn.appendChild(el('p', 'et-dev-n mb-0', '🛠 Fejlesztői mód: megosztott eredménynél nincsenek válaszok, ezért nincs kérdésenkénti bontás. Töltsd ki a tesztet te is.'));
        }

        renderImages(r);

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
        stage.appendChild(el('p', 'et-ver text-center', 'Teszt-verzió: ' + verLabel(r.ver || D.VERSION)));
    }

    // ---------- Billentyűk ----------
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var tn = e.target && e.target.tagName;
        if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || tn === 'SUMMARY') return;
        if (st.phase === 'quiz') {
            var cur = st.list[st.i];
            if (cur && cur.kind === 'r') {
                if (e.key >= '1' && e.key <= String(cur.opts.length)) { e.preventDefault(); pickRank(cur, cur.opts[Number(e.key) - 1].id); }
                else if (e.key === 'Backspace') { e.preventDefault(); goBack(); }
            } else if (e.key >= '1' && e.key <= '5') { e.preventDefault(); answer(ANSWERS[Number(e.key) - 1].v); }
            else if ((e.key === 'f' || e.key === 'F') && cur && canStar(cur)) { e.preventDefault(); toggleStar(cur.id); }
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
    var lastBadHash = null;
    function openFromHash() {
        var m = /^#r=(.+)$/.exec(location.hash || '');
        if (!m) return false;
        var r = C.decode(m[1]);
        if (!r) {
            if (location.hash !== lastBadHash) { lastBadHash = location.hash; setTimeout(function () { toast('Ez a megosztott link nem olvasható (hibás, csonka vagy újabb tesztverzióból való).'); }, 150); }
            return false;
        }
        st.result = r; st.shared = true; st.bDone = !!(r.hs || r.m || r.counts);
        setPhase('result');
        return true;
    }
    window.addEventListener('hashchange', function () {
        if (!openFromHash() && /^#r=/.test(location.hash || '') && st.shared) { st.shared = false; st.result = null; setPhase('intro'); }
    });
    if (!openFromHash()) render();

    // Hibakereséshez és teszteléshez
    window.MFSZErtek.ui = {
        state: function () { return st; },
        answerAll: function (v) { st.list.forEach(function (s) { st.ans[s.id] = typeof v === 'function' ? v(s) : v; }); },
        finish: function () { if (st.phase === 'quiz') { var M = MODES[st.mode]; if (st.part === 'a' && (M.b.length || M.rounds)) { setPhase('between'); } else { st.bDone = st.part === 'b'; finish(); } } },
        skipB: function () { st.bDone = false; finish(); },
        startB: startB,
        modes: MODES
    };
})();
