// =========================================================
// PASZTELL ÉLETÚT - felület
//
// A játék szabályait az eletut-engine.js adja, a tartalmat az eletut-data.js / eletut-events.js,
// a rajzokat az eletut-art.js. Ez a fájl a megjelenítés és a bemenetek kezelése.
//
// Biztonság / teljesítmény:
//   - A játékos neve és minden szöveg csak textContent-tel kerül az oldalra (innerHTML csak a saját,
//     kódból épített SVG-hez, ami a nevet nem tartalmazza).
//   - A számláló-kijelzők állandó elemek: tickenként csak a szövegük változik (a buzi mód UwU-megfigyelője
//     így nem kap új csomópontokat).
//   - A mentés a localStorage-ben él (try/catch), betöltéskor a játék szünetel.
// =========================================================
(function () {
    'use strict';

    var M = window.MFSZ;
    var D = M.data, Ev = M.events, E = M.engine, A = M.art;
    var S = null;                // a játék állapota
    var tab = 'szekreny';
    var panelNote = null;        // egy művelet eredménye a panel tetején
    var lastMonth = -1;
    var lastSceneSig = '';
    var stageView = 'room';
    var happyUntil = 0;
    var autoPaused = false;
    var freezeMoney = null;      // a kaszinó animáció alatt a pénz kijelzője ne áruljon el semmit
    var casinoBusy = false;
    var casinoGame = 'scratch';
    var casinoView = null;       // az utolsó játék megjelenítendő eredménye
    var timers = [];
    var loopId = null, saveId = null;
    var lastTs = 0;
    var draft = { name: '', hairStyle: 'bob', hairColor: 'rozsa', skin: 's2', eyeStyle: 'kerek' };

    // ---------- Segédek ----------
    function $(id) { return document.getElementById(id); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = text;
        return n;
    }
    function icon(name, cls) {
        var s = el('span', 'ico');
        s.style.display = 'inline-flex';
        s.innerHTML = A.icon(name, cls);
        return s;
    }
    function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function grp(n) { return String(Math.floor(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function fN(n) { return (n < 0 ? '−' : '') + grp(n); }
    function fF(n) { return fN(n) + ' Ft'; }
    function f1(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }
    function fS(n) { return (n >= 0 ? '+' : '−') + grp(n); }
    function when(m) { return D.MONTH_NAMES[(D.START_CALENDAR_MONTH + m) % 12] + ' · ' + (D.START_AGE + Math.floor(m / 12)) + ' év'; }
    function ageStr() { return E.ageYears(S) + ' év'; }
    function later(fn, ms) { var id = setTimeout(function () { timers = timers.filter(function (t) { return t !== id; }); fn(); }, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function show(id, on) { var n = $(id); if (n) n.hidden = !on; }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    // ---------- Mentés ----------
    function save() {
        if (!S) return;
        try { localStorage.setItem(D.SAVE_KEY, E.serialize(S)); } catch (e) { /* privát mód: nem baj */ }
    }
    function load() {
        try {
            var t = localStorage.getItem(D.SAVE_KEY);
            return t ? E.deserialize(t) : null;
        } catch (e) { return null; }
    }
    function wipe() { try { localStorage.removeItem(D.SAVE_KEY); } catch (e) { /* */ } }

    // ---------- Mentés fájlba / fájlból ----------
    function exportSave() {
        if (!S) return;
        var pkg = { app: 'pasztell-eletut', v: 1, name: S.name, age: E.ageYears(S), exported: new Date().toISOString(), data: E.serialize(S) };
        try {
            var blob = new Blob([JSON.stringify(pkg)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'pasztell-eletut-' + String(S.name).replace(/[^\w\-]+/g, '_') + '-' + E.ageYears(S) + 'ev.json';
            document.body.appendChild(a); a.click();
            later(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
            toast('Letöltve: a mentésed fájlba került. Később betöltheted ugyanitt (nyíl fel gomb).', 'good');
        } catch (e) { toast('A letöltés nem sikerült ebben a böngészőben.', 'bad'); }
    }
    function importSave(file) {
        if (!file) return;
        var r = new FileReader();
        r.onerror = function () { toast('A fájlt nem lehetett beolvasni.', 'bad'); };
        r.onload = function () {
            var pkg = null;
            try { pkg = JSON.parse(String(r.result)); } catch (e) { /* */ }
            var text = pkg && pkg.app === 'pasztell-eletut' && typeof pkg.data === 'string' ? pkg.data : null;
            var st = text ? E.deserialize(text) : null;
            if (!st) { toast('Ez nem Pasztell Életút mentés.', 'bad'); return; }
            if (st.cheat) { caught('import'); return; }
            if (S && !window.confirm('A fájlban ' + st.name + ' (' + E.ageYears(st) + ' éves) története van. Betöltöd? A mostani állás elvész.')) return;
            S = st; S.paused = true; E.seal(S); save();
            lastMonth = -1; lastSceneSig = ''; panelNote = null; tab = 'szekreny'; casinoView = null; freezeMoney = null; casinoBusy = false;
            enterGame();
            toast('Betöltve: ' + st.name + ' (szünetel, indítsd el, ha kész vagy).', 'good');
        };
        r.readAsText(file);
    }

    // ---------- Csalás-felismerés ----------
    var CHEAT_LINES = [
        ['A Pasztell Pénzügyi Felügyelet értesítése', 'A számládon hirtelen megjelent egy összeg, aminek nincs fedezete, nincs számlája és nincs szégyenérzete. A karaktered mostantól nem szerepel a nyilvántartásban.'],
        ['Blahaj nyomozó jelentése', 'A plüss cápa-hadsereg szimatolt egyet, és egyetlen pillantásból látta, hogy átírtad a mentést. A mentésed a cápák gyomrába került. Nem vagyunk büszkék rá, de ez a szabály.'],
        ['Discord moderátori döntés', 'A karaktered kitiltásra került a szerverről csalásért. A fellebbezést elutasítottuk. Küldünk viszont egy matcha latte-t vigaszul.'],
        ['Hivatalos közlemény az Univerzumtól', 'Az önbizalmat nem lehet beírni, csak kiérdemelni. A rendszer gyanús mozgást észlelt, ezért az életutadat visszavonták. Kezdheted elölről, ezúttal fair módon.'],
        ['Szülői értesítés', 'Anya megtalálta a böngészőelőzményed, és a fejlesztői konzolt is. Az egész életutat visszavonták. „Kisfiam, ez nem így megy.”'],
        ['Rendszerüzenet: 418', 'Teáskanna vagyok, és a számok nem csaphatók be. A karaktered törölve. Kérsz egy kamilla-teát?']
    ];
    function caught(why) {
        stopLoop();
        var line = CHEAT_LINES[Math.floor(Math.random() * CHEAT_LINES.length)];
        var host = $('el-modal-host');
        clear(host);
        var ov = el('div', 'el-overlay');
        var m = el('div', 'el-modal el-cheat');
        m.setAttribute('role', 'alertdialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'el-cheat-title');
        var body = el('div', 'el-modal-body');
        var h = el('h2', '', 'Csalást észleltünk!'); h.id = 'el-cheat-title';
        body.appendChild(h);
        body.appendChild(el('p', 'el-note', why === 'import' ? 'A betöltött fájl tartalmát valaki átírta.' : 'A játékállás számai olyan módon változtak meg, ahogy a játékban nem szoktak.'));
        body.appendChild(el('h3', '', line[0]));
        body.appendChild(el('p', '', line[1]));
        var b = el('button', 'el-btn', 'Értem, kezdem elölről'); b.type = 'button';
        b.addEventListener('click', function () { clear(host); wipe(); S = null; showIntro(); });
        body.appendChild(b);
        m.appendChild(body); ov.appendChild(m); host.appendChild(ov);
        wipe(); // már most törlődik, a lap újratöltése sem menti meg
        b.focus({ preventScroll: true });
    }
    // A játék saját műveletei (kattintás, billentyű, érintés) után 12 másodpercig nem vizsgálunk: időzített
    // animációk (kaszinó, értesítések) is módosíthatják a számokat. Tévedésből soha ne töröljünk valódi játékot.
    var uiDirtyUntil = 0;
    function markDirty() { uiDirtyUntil = performance.now() + 12000; }
    ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, markDirty, true); });

    // ---------- Értesítések ----------
    function toast(text, tone) {
        var host = $('el-toasts');
        var t = el('div', 'el-toast' + (tone ? ' ' + tone : ''), text);
        host.appendChild(t);
        while (host.children.length > 3) host.removeChild(host.firstChild);
        later(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4200);
    }
    function reportResult(r, okText) {
        if (r && r.ok) { if (okText) toast(okText, 'good'); return true; }
        toast((r && r.reason) || 'Ez most nem megy.', 'bad');
        return false;
    }
    function drainEvents() {
        if (S.flagsNew && S.flagsNew.length) {
            S.flagsNew.forEach(function (f) {
                if (f.type === 'person') {
                    var pe = D.find(D.PEOPLE, f.id);
                    toast('Új ismerős: ' + (pe ? pe.name : '') + ' (Barátok fül)', 'good');
                } else if (f.type === 'miss') {
                    var pm = D.find(D.PEOPLE, f.id);
                    toast('Rég beszéltél ' + (pm ? pm.name : 'valakivel') + ' (' + f.months + ' hónapja). Keresd meg a Barátok fülön!', 'funny');
                } else if (f.type === 'skill') {
                    var sk = D.find(D.SKILLS, f.id);
                    toast((sk ? sk.name : 'Képesség') + ': ' + f.level + '. szint!', 'good');
                }
            });
            S.flagsNew = [];
        }
    }
    function toastAchievements(list) {
        (list || []).forEach(function (a) { toast('Eredmény: ' + a.name, 'funny'); });
    }

    // =========================================================
    // KARAKTERKÉSZÍTŐ
    // =========================================================
    function buildCreator() {
        var hs = $('el-hs'), hc = $('el-hc'), sk = $('el-sk'), es = $('el-es');
        clear(hs); clear(hc); clear(sk); clear(es);
        D.EYE_STYLES.forEach(function (h) {
            var b = el('button', 'el-choice', h.label);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(draft.eyeStyle === h.id));
            b.addEventListener('click', function () { draft.eyeStyle = h.id; buildCreator(); });
            es.appendChild(b);
        });
        D.HAIR_STYLES.forEach(function (h) {
            var b = el('button', 'el-choice', h.label);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(draft.hairStyle === h.id));
            b.addEventListener('click', function () { draft.hairStyle = h.id; buildCreator(); });
            hs.appendChild(b);
        });
        D.HAIR_COLORS.forEach(function (h) {
            var b = el('button', 'el-swatch');
            b.type = 'button';
            b.style.background = h.color;
            b.title = h.label;
            b.setAttribute('aria-label', h.label);
            b.setAttribute('aria-pressed', String(draft.hairColor === h.id));
            b.addEventListener('click', function () { draft.hairColor = h.id; buildCreator(); });
            hc.appendChild(b);
        });
        D.SKINS.forEach(function (h) {
            var b = el('button', 'el-swatch');
            b.type = 'button';
            b.style.background = h.color;
            b.title = h.label;
            b.setAttribute('aria-label', h.label);
            b.setAttribute('aria-pressed', String(draft.skin === h.id));
            b.addEventListener('click', function () { draft.skin = h.id; buildCreator(); });
            sk.appendChild(b);
        });
        $('el-preview').innerHTML = A.portrait({ skin: draft.skin, hairStyle: draft.hairStyle, hairColor: draft.hairColor, eyes: draft.eyeStyle, outfit: {}, mood: 'neutral', uid: 'cr' });
    }

    function showIntro() {
        stopLoop();
        closeModal();
        show('el-game', false); show('el-end', false); show('el-intro', true);
        var saved = load();
        var r = $('el-resume');
        if (saved && saved.cheat) { r.hidden = true; buildCreator(); caught('save'); return; }
        if (saved) {
            r.hidden = false;
            r.textContent = 'Folytatom: ' + saved.name + ', ' + E.ageYears(saved) + ' évesen';
        } else r.hidden = true;
        buildCreator();
    }

    function startNew() {
        draft.name = $('el-name').value;
        S = E.newState(draft);
        E.seal(S);
        S.paused = false;
        E.showEvent(S, Ev.find('ch1'));
        lastMonth = -1; lastSceneSig = ''; panelNote = null; tab = 'szekreny'; casinoView = null; freezeMoney = null; casinoBusy = false;
        save();
        enterGame();
    }

    function resume() {
        var saved = load();
        if (!saved) { showIntro(); return; }
        if (saved.cheat) { S = null; caught('save'); return; }
        S = saved;
        lastMonth = -1; lastSceneSig = ''; panelNote = null; tab = 'szekreny'; casinoView = null; freezeMoney = null; casinoBusy = false;
        enterGame();
    }

    // =========================================================
    // JÁTÉK
    // =========================================================
    function enterGame() {
        clearTimers();
        show('el-intro', false); show('el-end', false); show('el-game', true);
        buildHud();
        buildStats();
        buildTabs();
        lastMonth = S.month;
        renderAll();
        if (S.ending) { showEnding(); return; }
        if (S.event) openModal();
        startLoop();
        window.scrollTo({ top: 0 });
    }

    // ---------- HUD ----------
    var speedBtns = [];
    function buildHud() {
        var sp = $('el-speed');
        clear(sp);
        speedBtns = [];
        [['pause', 0, 'Szünet'], ['0,5', 0.5, '0,5× sebesség (lassú)'], ['1', 1, '1× sebesség'], ['2', 2, '2× sebesség'], ['4', 4, '4× sebesség']].forEach(function (d) {
            var b = el('button');
            b.type = 'button';
            b.setAttribute('aria-label', d[2]);
            b.title = d[2];
            if (d[0] === 'pause') b.appendChild(icon('pause')); else b.textContent = d[0] + '×';
            b.addEventListener('click', function () {
                autoPaused = false;
                if (d[1] === 0) S.paused = true; else { S.paused = false; S.speed = d[1]; }
                updateSpeed(); save();
            });
            sp.appendChild(b);
            speedBtns.push({ b: b, v: d[1] });
        });
        var sv = $('el-menu-save'), nw = $('el-menu-new'), ex = $('el-menu-export'), im = $('el-menu-import');
        clear(sv); clear(nw); clear(ex); clear(im);
        sv.appendChild(icon('save')); nw.appendChild(icon('trash')); ex.appendChild(icon('download')); im.appendChild(icon('upload'));
        if (!sv.dataset.bound) {
            sv.dataset.bound = '1';
            sv.addEventListener('click', function () { save(); toast('Elmentve a böngészőbe.', 'good'); });
            ex.addEventListener('click', exportSave);
            im.addEventListener('click', function () { $('el-import-file').click(); });
            $('el-import-file').addEventListener('change', function (e) { importSave(e.target.files && e.target.files[0]); e.target.value = ''; });
            nw.addEventListener('click', function () {
                if (window.confirm('Biztosan új életútba kezdesz? A mostani mentés elvész.')) { wipe(); S = null; showIntro(); }
            });
        }
        updateSpeed();
    }
    function updateSpeed() {
        speedBtns.forEach(function (x) {
            var on = x.v === 0 ? S.paused : (!S.paused && S.speed === x.v);
            x.b.setAttribute('aria-pressed', String(on));
        });
    }

    var statEls = {};
    function buildStats() {
        var host = $('el-stats');
        clear(host);
        statEls = {};
        [['conf', 'heart', 'Önbizalom', ''], ['money', 'coin', 'Pénz', ''], ['energy', 'bolt', 'Energia', 'energy'], ['comm', 'users', 'Közösség', ''], ['risk', 'lock', 'Titok', 'risk']].forEach(function (d) {
            var box = el('div', 'el-stat');
            var row = el('div', 'el-stat-row');
            var l = el('span', 'l');
            l.appendChild(icon(d[1]));
            l.appendChild(el('span', '', d[2]));
            var v = el('span', 'v', '');
            row.appendChild(l); row.appendChild(v);
            box.appendChild(row);
            var sub = el('small', 'el-soft', '');
            box.appendChild(sub);
            var bar = null, fill = null;
            if (d[0] === 'energy' || d[0] === 'risk') {
                bar = el('div', 'el-bar ' + d[3]);
                fill = el('i');
                bar.appendChild(fill);
                box.appendChild(bar);
            }
            host.appendChild(box);
            statEls[d[0]] = { box: box, v: v, sub: sub, fill: fill, last: {} };
        });
    }
    // Energia-módosítók: lenyitható lista (állandó és ideiglenes tételek, a hátralévő hónapokkal)
    function energyDetails(d) {
        var box = statEls.energy.box, key = JSON.stringify(d.energyParts) + '|' + d.energyMax + '|' + f1(d.regen);
        if (statEls.energy.last.det === key) return;
        statEls.energy.last.det = key;
        var det = box.querySelector('details');
        var wasOpen = det && det.open;
        if (det) det.remove();
        det = el('details', 'el-en-det');
        if (wasOpen) det.open = true;
        var perm = d.energyParts.filter(function (x) { return !x.temp; }), temp = d.energyParts.filter(function (x) { return x.temp; });
        det.appendChild(el('summary', '', 'Energia-határ: ' + d.energyMax + (temp.length ? ' · ' + temp.length + ' ideiglenes' : '')));
        function row(x) {
            var r = el('div', 'el-en-row' + (x.en < 0 || x.regen < 0 ? ' neg' : ''));
            var bits = [];
            if (x.en) bits.push((x.en > 0 ? '+' : '−') + Math.abs(x.en));
            if (x.regen) bits.push((x.regen > 0 ? '+' : '−') + f1(Math.abs(x.regen)) + '/mp');
            r.appendChild(el('span', '', x.label + (x.temp ? ' (' + x.left + ' hó)' : '')));
            r.appendChild(el('b', '', bits.join(' · ') || ' '));
            return r;
        }
        det.appendChild(el('div', 'el-en-cap', 'Állandó'));
        perm.forEach(function (x) { det.appendChild(row(x)); });
        if (temp.length) { det.appendChild(el('div', 'el-en-cap', 'Ideiglenes')); temp.forEach(function (x) { det.appendChild(row(x)); }); }
        box.appendChild(det);
    }
    function setText(node, text, cache, key) {
        if (cache[key] !== text) { cache[key] = text; node.textContent = text; }
    }

    function updateHud() {
        var d = E.derive(S);
        var age = E.ageFloat(S);
        setText($('el-age'), ageStr(), statEls.conf.last, 'age');
        setText($('el-month'), E.monthLabel(S), statEls.conf.last, 'month');
        var st = E.stage(S);
        setText($('el-chapter'), st.kicker + ' · ' + st.title, statEls.conf.last, 'chap');
        var pct = Math.min(100, ((S.month + S.sec / D.MONTH_SECONDS) / D.MONTHS) * 100);
        $('el-timeline-fill').style.width = pct.toFixed(2) + '%';
        $('el-timeline').setAttribute('aria-valuenow', String(Math.round(pct)));

        var c = statEls;
        setText(c.conf.v, grp(S.conf), c.conf.last, 'v');
        setText(c.conf.sub, '+' + f1(d.passiveConf) + '/mp', c.conf.last, 's');
        var money = freezeMoney !== null ? freezeMoney : S.money;
        setText(c.money.v, fF(money), c.money.last, 'v');
        c.money.v.style.color = money < 0 ? 'var(--el-minus)' : '';
        setText(c.money.sub, 'havi ' + fS(d.net) + ' Ft', c.money.last, 's');
        setText(c.energy.v, Math.floor(S.energy) + '/' + d.energyMax, c.energy.last, 'v');
        c.energy.fill.style.width = Math.min(100, S.energy / d.energyMax * 100).toFixed(1) + '%';
        setText(c.energy.sub, '+' + f1(d.regen) + '/mp', c.energy.last, 's');
        energyDetails(d);
        setText(c.comm.v, grp(S.comm), c.comm.last, 'v');
        setText(c.comm.sub, S.flags.discord ? 'Discord tag' : 'még nem vagy a Discordon', c.comm.last, 's');
        c.risk.box.hidden = !d.secret;
        if (d.secret) {
            setText(c.risk.v, Math.floor(S.risk) + '%', c.risk.last, 'v');
            c.risk.fill.style.width = S.risk.toFixed(1) + '%';
            setText(c.risk.sub, S.hiding ? 'rejtőzködsz' : 'a ruháid látszanak', c.risk.last, 's');
        }

        var ml = $('el-monthline');
        var net = d.net;
        var parts = 'Havi bevétel ' + fF(d.income.total) + ', kiadás ' + fF(d.costs.total) + ', ';
        var key = parts + net;
        if (ml.dataset.k !== key) {
            ml.dataset.k = key;
            clear(ml);
            ml.appendChild(document.createTextNode(parts + 'egyenleg: '));
            ml.appendChild(el('b', net >= 0 ? 'plus' : 'minus', fS(net) + ' Ft'));
        }

        // akciógombok
        setActBtn('el-act-mirror', 'heart', 'Tükör', '+' + f1(d.clickConf) + ' önbizalom', false);
        setActBtn('el-act-work', 'briefcase', d.workLabel, '+' + grp(d.workClick) + ' Ft · ' + E.WORK_ENERGY + ' energia', S.energy < E.WORK_ENERGY);
        if (S.activeSkill) {
            var sk = D.find(D.SKILLS, S.activeSkill);
            setActBtn('el-act-study', 'book', 'Tanulás: ' + sk.name, '+' + f1(d.studyClick) + ' pont · ' + E.STUDY_ENERGY + ' energia', S.energy < E.STUDY_ENERGY);
        } else setActBtn('el-act-study', 'book', 'Tanulás', 'válassz képességet', false);

        // jelzések
        var alert = $('el-alert');
        var msg = '';
        if (S.money < 0) msg = 'Adósság: ' + fF(S.money);
        else if (d.secret && S.risk >= 70) msg = 'Lebukás közel!';
        else if (d.broken) msg = 'A gép elromlott';
        alert.hidden = !msg;
        if (msg && alert.textContent !== msg) alert.textContent = msg;

        // leíró felirat a színpadon
        setText($('el-tag'), S.name + ' · ' + d.housing.name, statEls.conf.last, 'tag');

        // fülek: a kaszinó 18 évesen jelenik meg
        var needCasino = age >= D.CASINO_MIN_AGE;
        if (needCasino !== !!tabsHasCasino) buildTabs();
        updateTabBadges();
        refreshAfford();
        refreshLive();
        void age;
    }

    function setActBtn(id, ico, title, sub, cant) {
        var b = $(id);
        var key = ico + '|' + title + '|' + sub;
        if (b.dataset.k !== key) {
            b.dataset.k = key;
            clear(b);
            b.appendChild(icon(ico));
            b.appendChild(el('span', '', title));
            b.appendChild(el('small', '', sub));
        }
        b.classList.toggle('cant', !!cant);
    }

    // ---------- Színpad ----------
    function currentView() {
        var v = A.viewOf(S);
        if (performance.now() < happyUntil && v.mood === 'neutral') v.mood = 'happy';
        v.scale = Math.round(v.scale * 100) / 100;
        return v;
    }
    function renderScene(force) {
        var v = currentView();
        var sig = stageView + JSON.stringify(v);
        if (!force && sig === lastSceneSig) return;
        lastSceneSig = sig;
        $('el-scene').innerHTML = stageView === 'face' ? A.facecam(v) : (stageView === 'close' ? A.closeup(v) : A.room(Object.assign({ fx: true, clock: Date.now() / 1000 }, v)));
        var vb = $('el-view');
        clear(vb);
        vb.appendChild(icon(stageView === 'room' ? 'eye' : (stageView === 'close' ? 'face' : 'house')));
        vb.appendChild(el('span', '', stageView === 'room' ? 'Közelkép' : (stageView === 'close' ? 'Arckép' : 'Szoba')));
    }

    function floatText(text, cls) {
        var host = $('el-floats');
        if (host.children.length > 14) return;
        var f = el('span', 'el-float ' + cls, text);
        f.style.left = (28 + Math.random() * 40).toFixed(0) + '%';
        f.style.top = (38 + Math.random() * 22).toFixed(0) + '%';
        host.appendChild(f);
        later(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1050);
    }

    // ---------- Menü (csoportosított oldalsáv) ----------
    var tabsHasCasino = false;
    var NAV = [
        { label: 'Stílus', tabs: [['szekreny', 'shirt', 'Szekrény'], ['smink', 'lips', 'Smink'], ['szoba', 'sparkle', 'Szoba']] },
        { label: 'Fejlődés', tabs: [['gep', 'monitor', 'Gép'], ['tanulas', 'book', 'Tanulás'], ['munka', 'briefcase', 'Munka']] },
        { label: 'Élet', tabs: [['baratok', 'users', 'Barátok'], ['lakas', 'house', 'Lakás'], ['lepesek', 'star', 'Merész lépések'], ['elmenyek', 'gift', 'Élmények'], ['kaszino', 'dice', 'Kaszinó']] },
        { label: 'Napló', tabs: [['naplo', 'calendar', 'Napló'], ['eredmenyek', 'trophy', 'Eredmények']] }
    ];
    function selectTab(id) {
        var wasBeauty = tab === 'smink';
        tab = id; panelNote = null; casinoView = null; socialNote = null; giftFor = null; giftPick = null;
        if (id === 'smink' && stageView !== 'face') { prevStage = stageView; stageView = 'face'; renderScene(true); }
        else if (wasBeauty && id !== 'smink' && stageView === 'face') { stageView = prevStage || 'room'; renderScene(true); }
        buildTabs(); renderPanel();
    }
    var prevStage = 'room';
    var socialNote = null;
    var giftFor = null, giftPick = null;
    function buildTabs() {
        var host = $('el-tabs');
        clear(host);
        tabsHasCasino = E.ageFloat(S) >= D.CASINO_MIN_AGE;
        if (tab === 'kaszino' && !tabsHasCasino) tab = 'szekreny';
        NAV.forEach(function (g) {
            var box = el('div', 'el-nav-group');
            box.appendChild(el('div', 'el-nav-label', g.label));
            var row = el('div', 'el-nav-row');
            g.tabs.forEach(function (t) {
                if (t[0] === 'kaszino' && !tabsHasCasino) return;
                var b = el('button', 'el-tab');
                b.type = 'button';
                b.setAttribute('role', 'tab');
                b.setAttribute('aria-selected', String(tab === t[0]));
                b.appendChild(icon(t[1]));
                b.appendChild(el('span', '', t[2]));
                b.dataset.tab = t[0];
                b.addEventListener('click', function () { selectTab(t[0]); var pn = $('el-panel'); if (pn && window.matchMedia && window.matchMedia('(max-width: 767.98px)').matches) pn.scrollIntoView({ block: 'nearest' }); });
                row.appendChild(b);
            });
            box.appendChild(row);
            host.appendChild(box);
        });
    }

    // Piros pont a Barátok fülön, ha valakivel rég nem beszéltél
    function updateTabBadges() {
        var host = $('el-tabs');
        if (!host) return;
        var n = E.neglected(S).length;
        var b = host.querySelector('.el-tab[data-tab="baratok"]');
        if (!b) return;
        var d = b.querySelector('.dot');
        if (n && !d) { d = el('i', 'dot'); d.setAttribute('aria-hidden', 'true'); b.appendChild(d); b.title = 'Rég nem beszéltél valakivel'; }
        else if (!n && d) { b.removeChild(d); b.removeAttribute('title'); }
    }

    function renderAll() {
        updateHud();
        renderScene(true);
        renderPanel();
    }

    // ---------- Panel építők ----------
    function chip(text, cls) { return el('span', 'el-chip' + (cls ? ' ' + cls : ''), text); }
    function itemCard(opts) {
        var c = el('div', 'el-item' + (opts.owned ? ' owned' : '') + (opts.worn ? ' worn' : '') + (opts.thumb ? ' has-thumb' : ''));
        if (opts.thumb) { var tw = el('div', 'el-thumbbox' + (opts.thumbTall ? ' tall' : '')); tw.appendChild(opts.thumb); c.appendChild(tw); }
        c.appendChild(el('h4', '', opts.title));
        if (opts.desc) c.appendChild(el('p', '', opts.desc));
        if (opts.chips && opts.chips.length) {
            var cs = el('div', 'el-chips');
            opts.chips.forEach(function (x) { cs.appendChild(chip(x[0], x[1])); });
            c.appendChild(cs);
        }
        if (opts.extra) c.appendChild(opts.extra);
        if (opts.note) c.appendChild(el('div', 'el-note', opts.note));
        if (opts.btn) c.appendChild(opts.btn);
        return c;
    }
    function actionBtn(label, onClick, o) {
        o = o || {};
        var b = el('button', 'el-btn' + (o.cls ? ' ' + o.cls : ''), label);
        b.type = 'button';
        if (o.cost !== undefined) { b.dataset.cost = String(o.cost); b.dataset.cur = o.cur || 'money'; }
        b.addEventListener('click', onClick);
        return b;
    }
    function act(fn) {
        return function () {
            if (casinoBusy) return;
            var res = fn();
            afterAction();
            return res;
        };
    }
    function afterAction() {
        E.seal(S);
        drainEvents();
        toastAchievements(E.checkAchievements(S));
        save();
        renderScene(false);
        updateHud();
        renderPanel();
    }

    function sectionTitle(t) { return el('div', 'el-section-title', t); }

    function addNote(panel) {
        if (!panelNote) return;
        var b = el('div', 'el-result-box', panelNote);
        panel.appendChild(b);
    }

    function renderPanel() {
        var p = $('el-panel');
        var scroll = p.scrollTop;
        clear(p);
        p.setAttribute('role', 'tabpanel');
        addNote(p);
        var fn = { szekreny: pWardrobe, smink: pBeauty, baratok: pFriends, szoba: pRoom, gep: pComputer, tanulas: pStudy, munka: pJobs, lakas: pHousing, lepesek: pSteps, elmenyek: pExp, kaszino: pCasino, naplo: pLog, eredmenyek: pAch }[tab];
        if (fn) fn(p);
        p.scrollTop = scroll;
        refreshAfford();
    }

    // --- Miniatűrök ---
    var thumbCache = {};
    function thumbEl(slot, id, color, pat) {
        var key = [slot, id, color || '', pat === undefined ? '' : (pat ? pat.id + (pat.color || '') : 'plain'), S.skin, S.hairStyle, S.hairColor].join('|');
        var url = thumbCache[key];
        if (!url) {
            var svg = A.thumb(slot, id, { color: color, pat: pat, skin: S.skin, hairStyle: S.hairStyle, hairColor: S.hairColor });
            try { url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); }
            catch (e) { url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
            thumbCache[key] = url;
        }
        var img = el('img', 'el-thumb');
        img.src = url;
        img.alt = '';
        img.decoding = 'async';
        return img;
    }
    var STAT_TONE = { cute: 'pink', gamer: 'blue', code: 'violet', chaos: 'amber', chill: 'green' };
    function statChips(st) {
        var out = [];
        D.STATS.forEach(function (x) {
            var v = st && st[x.id];
            if (v) out.push([x.label + ' ' + (v > 0 ? '+' : '−') + Math.abs(v), 'stat ' + STAT_TONE[x.id]]);
        });
        return out;
    }
    function statBars(box, tot, base) {
        D.STATS.forEach(function (x) {
            var row = el('div', 'el-sb');
            var top = el('div', 'el-sb-top');
            var l = el('span', 'l');
            l.appendChild(icon(x.icon));
            l.appendChild(document.createTextNode(' ' + x.label));
            top.appendChild(l);
            var bonus = base ? Math.max(0, tot[x.id] - base[x.id]) : 0;
            top.appendChild(el('b', '', String(tot[x.id])));
            row.appendChild(top);
            var bar = el('div', 'el-bar stat ' + STAT_TONE[x.id]);
            var fill = el('i');
            fill.style.width = Math.min(100, tot[x.id] / D.STAT_MAX * 100) + '%';
            bar.appendChild(fill);
            row.appendChild(bar);
            row.title = x.label + ': ' + x.effect + (bonus ? ' (ebből kombó: +' + bonus + ')' : '');
            box.appendChild(row);
        });
    }
    function slotChoices(slot) { return D.ITEMS.filter(function (i) { return i.slot === slot; }); }

    // --- Szekrény ---
    var wardSlot = 'hair';
    function pWardrobe(p) {
        var secret = E.isSecret(S);
        var st = E.stats(S);

        // kompakt statsáv
        var sum = el('div', 'el-item el-sum');
        var head = el('div', 'el-sum-head');
        head.appendChild(el('h4', '', st.rank.title));
        head.appendChild(chip(st.score + ' stílus-pont', 'hot'));
        sum.appendChild(head);
        var bars = el('div', 'el-sbs compact');
        statBars(bars, st.total, st.base);
        sum.appendChild(bars);
        p.appendChild(sum);

        // hely-választó
        var chipsRow = el('div', 'el-slotbar');
        chipsRow.setAttribute('role', 'tablist');
        chipsRow.setAttribute('aria-label', 'Tárgytípus');
        D.SLOTS.forEach(function (slot) {
            var items = slotChoices(slot.id);
            var have = items.filter(function (i) { return S.items[i.id]; }).length;
            var b = el('button', 'el-slot' + (wardSlot === slot.id ? ' on' : ''));
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', String(wardSlot === slot.id));
            b.appendChild(icon(slot.icon));
            b.appendChild(el('span', '', slot.label));
            b.appendChild(el('small', '', have + '/' + items.length));
            if (S.equipped[slot.id]) b.classList.add('filled');
            b.addEventListener('click', function () { wardSlot = slot.id; renderPanel(); });
            chipsRow.appendChild(b);
        });
        p.appendChild(chipsRow);

        var slot2 = D.find(D.SLOTS, wardSlot) || D.SLOTS[0];
        if (!slot2.wear) p.appendChild(el('div', 'el-note', 'Ez a tárgy a szobádban látszik, és csak egy lehet belőle kéznél. A statpontjai a viselt tárgyakéval együtt számítanak.'));
        var g2 = el('div', 'el-grid');
        slotChoices(slot2.id).forEach(function (it) {
            var owned = !!S.items[it.id];
            var worn = S.equipped[slot2.id] === it.id;
            var chips = [];
            if (it.click) chips.push(['+' + f1(it.click) + ' kattintás', 'plus']);
            if (it.passive) chips.push(['+' + f1(it.passive) + '/mp', 'plus']);
            if (secret && it.risk) chips.push(['Titok +' + it.risk, 'minus']);
            statChips(it.st).forEach(function (c) { chips.push(c); });
            var price = E.price(S, it.cost);
            var btn;
            var custom = !!(it.paint || D.patternsFor(it).length);
            if (!owned && custom) btn = actionBtn('Kiválasztom és megveszem · ' + fF(price), function () { openBuyDialog(it); }, { cost: price });
            else if (!owned) btn = actionBtn('Megveszem · ' + fF(price), act(function () { buyWithNote(it, undefined); }), { cost: price });
            else btn = actionBtn(worn ? (slot2.wear ? 'Viselem ✓ (levesz)' : 'Kéznél van ✓ (félreteszem)') : (slot2.wear ? 'Felveszem' : 'Kéznél tartom'), act(function () { E.equip(S, slot2.id, worn ? null : it.id); }), { cls: worn ? 'alt' : 'blue' });
            var extra = null;
            var canPat = D.patternsFor(it).length > 0;
            if (owned && (it.paint || canPat)) extra = variantBox(it, price);
            else if (!owned && (it.paint || canPat)) extra = el('div', 'el-note', 'A szín' + (canPat ? ' és a minta' : '') + ' vásárláskor választható, utána már nem módosítható.');
            g2.appendChild(itemCard({ title: it.name, desc: it.desc, owned: owned, worn: worn, chips: chips, btn: btn, extra: extra, thumb: thumbEl(slot2.id, it.id, owned ? E.paintOf(S, it.id) : null, owned && canPat ? E.patOf(S, it.id) : undefined), thumbTall: slot2.id === 'cosplay' }));
        });
        p.appendChild(g2);

        // kombók (lenyitható)
        var combos = el('details', 'el-combos');
        var active = st.combos.filter(function (c) { return c.active; });
        combos.appendChild(el('summary', '', 'Kombók: ' + active.length + ' / ' + st.combos.length + ' aktív' + (st.full ? ' · teljes szett +4 mindenből' : '')));
        var cl = el('div', 'el-combo-list');
        cl.appendChild(el('div', 'el-note', 'Cukiság: kattintásonként +0,6% önbizalom · Gamer: +0,05 önbizalom/mp · Kód: +0,4% bér és freelance · Káosz: +0,02 önbizalom/kattintás, de nő a lebukási kockázat · Nyugi: gyorsabb energia, lassabban nő a játékvágy (pontonként). Ha mind a ' + D.SLOTS.length + ' helyen van tárgy, mindenből +4 jár.'));
        st.combos.slice().sort(function (x, y) { return (y.active ? 1 : 0) - (x.active ? 1 : 0); }).forEach(function (c) {
            var row = el('div', 'el-combo' + (c.active ? ' on' : ''));
            row.appendChild(icon(c.combo.icon));
            var tx = el('div', 'el-combo-tx');
            tx.appendChild(el('b', '', c.combo.name + (c.active ? ' ✓' : '')));
            var names = c.combo.need.map(function (n) {
                var ids = Array.isArray(n) ? n : [n];
                return ids.map(function (id) { var it = D.find(D.ITEMS, id) || D.find(D.DECOR, id) || D.find(D.PETS, id) || D.find(D.BEAUTY, id); return it ? it.name : id; }).join(' / ');
            });
            tx.appendChild(el('span', 'el-note', names.join(' + ')));
            var bonus = D.STATS.filter(function (x) { return c.combo.bonus[x.id]; }).map(function (x) { return x.label + ' +' + c.combo.bonus[x.id]; }).join(', ');
            tx.appendChild(el('span', 'el-note', (c.active ? c.combo.text + ' · ' : '') + bonus));
            row.appendChild(tx);
            cl.appendChild(row);
        });
        combos.appendChild(cl);
        if (combosOpen) combos.open = true;
        combos.addEventListener('toggle', function () { combosOpen = combos.open; });
        p.appendChild(combos);
        lookBonusPanel(p);

        if (secret) {
            var hid = el('details', 'el-combos');
            hid.appendChild(el('summary', '', 'Titkolózás és rejtekhelyek' + (S.hiding ? ' · most elrejted a ruháid' : '')));
            var inner = el('div', 'el-combo-list');
            inner.appendChild(el('p', 'el-note', 'Amíg a szüleidnél laksz, a ruháid kockázatot jelentenek (Titok mérő). Ha elrejted őket, nincs kockázat, de a hatásuk csak 40%, és a viselt tárgyak statpontjai sem számítanak.'));
            inner.appendChild(actionBtn(S.hiding ? 'Rejtőzködés: BE · előveszem őket' : 'Rejtőzködés: KI · elrejtem őket', act(function () { E.toggleHiding(S); }), { cls: S.hiding ? '' : 'alt' }));
            var g = el('div', 'el-grid');
            D.HIDEOUT.forEach(function (h) {
                var owned = !!S.hideout[h.id];
                g.appendChild(itemCard({
                    title: h.name, desc: h.desc, owned: owned, chips: [['Titok −' + h.decay + '/hó', 'plus']],
                    btn: owned ? el('div', 'el-note', 'Megvan ✓') : actionBtn('Megcsinálom · ' + fF(h.cost), act(function () { reportResult(E.buyHideout(S, h.id)); }), { cost: h.cost })
                }));
            });
            inner.appendChild(g);
            hid.appendChild(inner);
            if (hideOpen) hid.open = true;
            hid.addEventListener('toggle', function () { hideOpen = hid.open; });
            p.appendChild(hid);
        }
    }
    var hideOpen = false;
    var combosOpen = false;

    // ---------- Vásárláskor választott kinézet (utólag nem módosítható) ----------
    function statText(st) {
        return D.STATS.filter(function (x) { return st && st[x.id]; }).map(function (x) { return x.label + ' +' + st[x.id]; }).join(', ');
    }
    function colorLabel(id) { var c = D.find(D.PALETTE, id); return c ? c.label : ''; }
    function buyWithNote(it, opts) {
        var r = E.buyItem(S, it.id, opts);
        if (reportResult(r) && it.notes && it.notes.length) { var n = pick(it.notes); toast(n.text, n.tone === 'bad' ? 'bad' : n.tone === 'funny' ? 'funny' : 'good'); }
        return r;
    }
    function varLabel(it, v) {
        var parts = [];
        if (it.paint) {
            var cid = v.c;
            if (!cid) D.PALETTE.forEach(function (q) { if (q.color.toLowerCase() === String(it.paint).toLowerCase()) cid = q.id; });
            parts.push(cid ? colorLabel(cid) : 'alap');
        }
        if (D.patternsFor(it).length) parts.push(v.p ? D.find(D.PATTERNS, v.p).label : 'egyszínű');
        return parts.join(' · ');
    }
    function varHex(it, v) { var c = v.c && D.find(D.PALETTE, v.c); return c ? c.color : it.paint; }
    // A megvett kinézet(ek): a viselt változat zárolt kinézete + váltás a megvettek között + új változat vásárlása
    function variantBox(it, price) {
        var box = el('div', 'el-vbox');
        box.appendChild(lookNote(it));
        var list = E.variantsOf(S, it.id), cur = E.currentVariant(S, it.id);
        if (list.length > 1) {
            var cap = el('div', 'el-paint-cap'); cap.appendChild(icon('palette')); cap.appendChild(document.createTextNode(' Megvett változatok (' + list.length + ')'));
            box.appendChild(cap);
            var row = el('div', 'el-vars');
            list.forEach(function (v, i) {
                var b = el('button', 'el-var');
                b.type = 'button';
                b.setAttribute('aria-pressed', String(i === cur));
                var dot = el('i', 'el-var-dot'); dot.style.background = varHex(it, v) || '#ddd'; b.appendChild(dot);
                b.appendChild(el('span', '', varLabel(it, v)));
                b.addEventListener('click', act(function () { reportResult(E.wearVariant(S, it.id, i)); }));
                row.appendChild(b);
            });
            box.appendChild(row);
        }
        var nb = actionBtn('Új változat vásárlása · ' + fF(price), function () { openBuyDialog(it); }, { cls: 'alt', cost: price });
        box.appendChild(nb);
        return box;
    }
    // A megvett ruha zárolt kinézete + az abból járó bónusz
    function lookNote(it) {
        var box = el('div', 'el-lockedlook');
        var parts = [];
        var cid = E.colorIdOf(S, it.id);
        if (it.paint) parts.push('Szín: ' + (S.colors && S.colors[it.id] ? colorLabel(S.colors[it.id]) : (cid ? colorLabel(cid) : 'alap')));
        var pat = D.patternsFor(it).length ? E.patOf(S, it.id) : null;
        if (D.patternsFor(it).length) parts.push('Minta: ' + (pat ? D.find(D.PATTERNS, pat.id).label : 'egyszínű'));
        var line = el('div', 'el-note');
        line.appendChild(icon('lock'));
        line.appendChild(document.createTextNode(' Vásárláskor választva · ' + parts.join(' · ')));
        box.appendChild(line);
        var bon = [];
        if (cid && D.COLOR_STAT[cid]) bon.push(['Szín: ' + statText(D.COLOR_STAT[cid]), 'stat pink']);
        if (pat && D.PATTERN_STAT[pat.id]) bon.push(['Minta: ' + statText(D.PATTERN_STAT[pat.id]), 'stat violet']);
        if (bon.length) { var cs = el('div', 'el-chips'); bon.forEach(function (x) { cs.appendChild(chip(x[0], x[1])); }); box.appendChild(cs); }
        return box;
    }
    // A vásárlási ablak: szín- és mintaválasztás előnézettel és a várható bónusszal
    var buyDlg = null;
    function closeBuyDialog(restore) {
        if (!buyDlg) return;
        var d = buyDlg; buyDlg = null;
        clear($('el-modal-host'));
        if (restore && S) { S.paused = d.wasPaused; updateSpeed(); }
        if (d.prevFocus && d.prevFocus.focus) { try { d.prevFocus.focus(); } catch (e) { /* */ } }
    }
    function openBuyDialog(it) {
        var host = $('el-modal-host');
        if (buyDlg || host.firstChild || S.event) return;
        var allowed = D.patternsFor(it);
        var choice = { color: null, pat: it.pat && allowed.some(function (p) { return p.id === it.pat; }) ? it.pat : null, patColor: null };
        buyDlg = { wasPaused: S.paused, prevFocus: document.activeElement };
        S.paused = true; updateSpeed();
        var price = E.price(S, it.cost);

        var ov = el('div', 'el-overlay');
        var m = el('div', 'el-modal el-buy');
        m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'el-buy-title');
        var body = el('div', 'el-modal-body');
        var isNew = !!S.items[it.id];
        var h = el('h2', '', (isNew ? 'Új változat · ' : 'Milyen legyen? · ') + it.name); h.id = 'el-buy-title';
        body.appendChild(h);
        body.appendChild(el('p', 'el-note', isNew ? 'Új változatot csak új vásárlással szerezhetsz: ugyanabból a ruhából többféle szín, minta és felirat is lehet a szekrényedben, és közöttük váltogathatsz. A megvett változat kinézete nem módosítható.' : 'A szín és a minta csak most választható: a megvett ruha kinézete utólag nem módosítható. A választás bónuszt is ad, ha viseled. Később új változatot is vehetsz belőle.'));
        var grid = el('div', 'el-buy-grid');
        var prevBox = el('div', 'el-buy-prev');
        var ctrl = el('div', 'el-buy-ctrl');
        var sum = el('div', 'el-buy-sum');
        grid.appendChild(prevBox); grid.appendChild(ctrl);
        body.appendChild(grid); body.appendChild(sum);
        var btns = el('div', 'el-buy-btns');
        var cancel = el('button', 'el-btn alt', 'Mégse'); cancel.type = 'button';
        cancel.addEventListener('click', function () { closeBuyDialog(true); });
        var ok = el('button', 'el-btn', 'Megveszem · ' + fF(price)); ok.type = 'button';
        if (S.money < price) { ok.disabled = true; ok.textContent = 'Nincs elég pénzed · ' + fF(price); }
        ok.addEventListener('click', function () {
            var c = { color: choice.color }; if (allowed.length) { c.pat = choice.pat; if (choice.patColor) c.patColor = choice.patColor; }
            closeBuyDialog(true);
            act(function () { buyWithNote(it, c); })();
        });
        btns.appendChild(cancel); btns.appendChild(ok);
        body.appendChild(btns);
        m.appendChild(body); ov.appendChild(m); host.appendChild(ov);

        function hexOf() { return choice.color ? D.find(D.PALETTE, choice.color).color : null; }
        function patObj() {
            if (!allowed.length) return undefined;
            if (!choice.pat) return null;
            var ac = choice.patColor ? D.find(D.PALETTE, choice.patColor) : null;
            return { id: choice.pat, color: ac ? ac.color : (it.pat2 || null) };
        }
        function preview() {
            clear(prevBox);
            var tb = el('div', 'el-thumbbox' + (it.slot === 'cosplay' ? ' tall' : ''));
            tb.appendChild(thumbEl(it.slot, it.id, hexOf(), patObj()));
            prevBox.appendChild(tb);
        }
        function dupCheck() {
            var dup = E.hasVariant(S, it.id, { color: choice.color, pat: allowed.length ? choice.pat : undefined, patColor: choice.patColor || undefined });
            var broke = S.money < price;
            ok.disabled = dup || broke;
            ok.textContent = dup ? 'Ez a változat már megvan' : (broke ? 'Nincs elég pénzed · ' + fF(price) : (isNew ? 'Megveszem az új változatot · ' : 'Megveszem · ') + fF(price));
        }
        function summary() {
            dupCheck();
            clear(sum);
            // szimuláció: mi változik, ha ezt a kinézetet megveszed és fel is veszed
            var sim = E.deserialize(E.serialize(S));
            var look = E.lookChoice(sim, it.id, { color: choice.color, pat: allowed.length ? choice.pat : undefined, patColor: choice.patColor || undefined });
            sim.items[it.id] = true;
            if (look.ok) { if (look.color) sim.colors[it.id] = look.color; if (allowed.length) sim.pats[it.id] = { p: look.pat, a: look.patColor }; }
            if (it.slot && D.find(D.SLOTS, it.slot) && D.find(D.SLOTS, it.slot).wear) sim.equipped[it.slot] = it.id;
            var before = E.lookBonuses(S), after = E.lookBonuses(sim);
            var delta = {};
            D.STATS.forEach(function (x) { var d = (after.total[x.id] || 0) - (before.total[x.id] || 0); if (d) delta[x.id] = d; });
            var cs = el('div', 'el-chips');
            var have = false;
            D.STATS.forEach(function (x) { if (delta[x.id]) { have = true; cs.appendChild(chip(x.label + ' ' + (delta[x.id] > 0 ? '+' : '−') + Math.abs(delta[x.id]), 'stat ' + STAT_TONE[x.id])); } });
            sum.appendChild(el('div', 'el-note', have ? 'Szín- és mintabónusz, ha viseled (a jelenlegi öltözékedhez képest):' : 'Ez a kinézet nem ad szín- vagy mintabónuszt.'));
            if (have) sum.appendChild(cs);
            var gained = after.synergies.filter(function (x, i) { return x.active && !before.synergies[i].active; });
            gained.forEach(function (x) { sum.appendChild(el('div', 'el-note good', '★ Új párosítás: ' + x.syn.name + ' (' + statText(x.syn.bonus) + ')')); });
            if (E.isSecret(S) && after.risk > before.risk) sum.appendChild(el('div', 'el-note bad', 'Titkolózás közben feltűnő: lebukási kockázat +' + (after.risk - before.risk) + '.'));
        }
        function controls() {
            clear(ctrl);
            if (it.paint) {
                var cap = el('div', 'el-paint-cap'); cap.appendChild(icon('palette')); cap.appendChild(document.createTextNode(' Szín'));
                ctrl.appendChild(cap);
                var row = el('div', 'el-swatches');
                [{ id: null, label: 'Alap', color: it.paint }].concat(D.PALETTE).forEach(function (c) {
                    var b = el('button', 'el-sw' + (c.id === null ? ' base' : ''));
                    b.type = 'button'; b.style.background = c.color;
                    var st = c.id ? D.COLOR_STAT[c.id] : (E.colorIdOf(S, it.id) ? null : null);
                    var tip = c.label + (c.id && st ? ' · ' + statText(st) : '');
                    if (c.id === null) { var bid = null; D.PALETTE.forEach(function (q) { if (q.color.toLowerCase() === String(it.paint).toLowerCase()) bid = q.id; }); if (bid) tip += ' · ' + statText(D.COLOR_STAT[bid]); }
                    b.title = tip; b.setAttribute('aria-label', 'Szín: ' + tip);
                    b.setAttribute('aria-pressed', String(choice.color === c.id));
                    b.addEventListener('click', function () { choice.color = c.id; controls(); preview(); summary(); });
                    row.appendChild(b);
                });
                ctrl.appendChild(row);
            }
            if (allowed.length) {
                var cap2 = el('div', 'el-paint-cap'); cap2.appendChild(icon('sparkle')); cap2.appendChild(document.createTextNode(' Minta / felirat'));
                ctrl.appendChild(cap2);
                var sel = el('select', 'el-select'); sel.setAttribute('aria-label', it.name + ' mintája');
                var o0 = el('option', '', 'Egyszínű'); o0.value = ''; sel.appendChild(o0);
                allowed.forEach(function (p) {
                    var o = el('option', '', p.label + (D.PATTERN_STAT[p.id] ? ' · ' + statText(D.PATTERN_STAT[p.id]) : '')); o.value = p.id;
                    if (choice.pat === p.id) o.selected = true;
                    sel.appendChild(o);
                });
                sel.addEventListener('change', function () { choice.pat = sel.value || null; choice.patColor = null; controls(); preview(); summary(); });
                ctrl.appendChild(sel);
                var spec = choice.pat && D.find(D.PATTERNS, choice.pat);
                if (spec && !spec.fixed) {
                    var cap3 = el('div', 'el-paint-cap'); cap3.appendChild(icon('palette')); cap3.appendChild(document.createTextNode(spec.kind === 'text' ? ' Felirat színe' : ' Minta színe'));
                    ctrl.appendChild(cap3);
                    var row2 = el('div', 'el-swatches');
                    [{ id: null, label: 'Alap', color: it.pat2 || '#f4a3b8' }].concat(D.PALETTE).forEach(function (c) {
                        var b = el('button', 'el-sw' + (c.id === null ? ' base' : ''));
                        b.type = 'button'; b.style.background = c.color; b.title = c.label;
                        b.setAttribute('aria-label', 'Mintaszín: ' + c.label);
                        b.setAttribute('aria-pressed', String(choice.patColor === c.id));
                        b.addEventListener('click', function () { choice.patColor = c.id; controls(); preview(); summary(); });
                        row2.appendChild(b);
                    });
                    ctrl.appendChild(row2);
                }
            }
        }
        controls(); preview(); summary();
        ov.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeBuyDialog(true); return; }
            if (e.key !== 'Tab') return;
            var f = Array.prototype.filter.call(m.querySelectorAll('button:not(:disabled), select'), function (n) { return n.offsetParent !== null; });
            if (!f.length) return;
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        });
        ov.addEventListener('click', function (e) { if (e.target === ov) closeBuyDialog(true); });
        var firstSw = m.querySelector('.el-sw[aria-pressed="true"]') || ok;
        firstSw.focus({ preventScroll: true });
    }

    // Szín- és mintabónuszok áttekintése a szekrényben
    function lookBonusPanel(p) {
        var lb = E.lookBonuses(S);
        var tot = 0; D.STATS.forEach(function (x) { tot += lb.total[x.id] || 0; });
        var det = el('details', 'el-combos');
        det.appendChild(el('summary', '', 'Szín- és mintabónuszok: +' + tot + ' pont · ' + lb.synergies.filter(function (x) { return x.active; }).length + ' / ' + lb.synergies.length + ' párosítás'));
        var cl = el('div', 'el-combo-list');
        cl.appendChild(el('div', 'el-note', 'A viselt ruhák színe, mintája és felirata külön statot ad, a megfelelő párosítások pedig többet. A kinézet vásárláskor dől el, utólag nem módosítható.'));
        if (!lb.parts.length) cl.appendChild(el('div', 'el-note', 'Most nincs viselt ruhád szín- vagy mintabónusszal.'));
        lb.parts.forEach(function (pt) {
            var row = el('div', 'el-combo on');
            row.appendChild(icon('palette'));
            var tx = el('div', 'el-combo-tx');
            tx.appendChild(el('b', '', pt.name));
            var bits = [];
            if (pt.color) bits.push('Szín (' + colorLabel(pt.color.id) + '): ' + statText(pt.color.stat));
            if (pt.pat) bits.push('Minta (' + D.find(D.PATTERNS, pt.pat.id).label + '): ' + statText(pt.pat.stat));
            tx.appendChild(el('span', 'el-note', bits.join(' · ')));
            row.appendChild(tx); cl.appendChild(row);
        });
        lb.synergies.slice().sort(function (x, y) { return (y.active ? 1 : 0) - (x.active ? 1 : 0); }).forEach(function (x) {
            var row = el('div', 'el-combo' + (x.active ? ' on' : ''));
            row.appendChild(icon('sparkle'));
            var tx = el('div', 'el-combo-tx');
            tx.appendChild(el('b', '', x.syn.name + (x.active ? ' ✓' : '')));
            tx.appendChild(el('span', 'el-note', x.syn.hint));
            tx.appendChild(el('span', 'el-note', (x.active ? x.syn.text + ' · ' : '') + statText(x.syn.bonus)));
            row.appendChild(tx); cl.appendChild(row);
        });
        det.appendChild(cl);
        if (lookOpen) det.open = true;
        det.addEventListener('toggle', function () { lookOpen = det.open; });
        p.appendChild(det);
    }
    var lookOpen = false;


    // --- Smink ---
    var lookSlot = 'lips';
    function blobUrl(svg) {
        try { return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); }
        catch (e) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
    }
    function imgFromSvg(key, makeSvg, cls) {
        var url = thumbCache[key];
        if (!url) { url = blobUrl(makeSvg()); thumbCache[key] = url; }
        var img = el('img', cls || 'el-thumb');
        img.src = url; img.alt = ''; img.decoding = 'async';
        return img;
    }
    function beautyThumbEl(b, colorHex) {
        var key = ['bt', b.id, colorHex || '', S.skin, S.hairStyle, S.hairColor].join('|');
        return imgFromSvg(key, function () { return A.beautyThumb(b.slot, b.id, { color: colorHex, skin: S.skin, hairStyle: S.hairStyle, hairColor: S.hairColor }); });
    }
    function lookColorHex(slot, colorId) {
        var list = D.LOOK_COLORS[slot] || [];
        var c = D.find(list, colorId) || list[0];
        return c ? c.color : null;
    }
    // A megvett színek (váltani köztük lehet); új színt csak vásárlással lehet szerezni
    function lookSwatches(b) {
        var wrap = el('div', 'el-paint');
        var cap = el('span', 'el-paint-cap');
        cap.appendChild(icon('palette'));
        var own = E.beautyColorsOf(S, b.id);
        cap.appendChild(document.createTextNode(' Megvett színek (' + own.length + ')'));
        wrap.appendChild(cap);
        var row = el('div', 'el-swatches');
        var cur = S.look[b.slot] && S.look[b.slot].id === b.id ? S.look[b.slot].color : null;
        own.forEach(function (cid) {
            var c = D.find(D.LOOK_COLORS[b.slot] || [], cid);
            if (!c) return;
            var sw = el('button', 'el-sw');
            sw.type = 'button';
            sw.style.background = c.color;
            sw.setAttribute('aria-label', b.name + ' színe: ' + c.label);
            sw.title = c.label;
            sw.setAttribute('aria-pressed', String(cur === c.id));
            sw.addEventListener('click', act(function () {
                E.applyBeauty(S, b.slot, b.id, c.id);
            }));
            row.appendChild(sw);
        });
        wrap.appendChild(row);
        var price = E.beautyPrice(S, b.cost);
        var all = (D.LOOK_COLORS[b.slot] || []).length;
        if (own.length < all) wrap.appendChild(actionBtn('Új szín vásárlása · ' + fF(price), function () { openBeautyDialog(b); }, { cls: 'alt', cost: price }));
        return wrap;
    }
    // Smink-vásárlási ablak: a szín itt dől el (utólag csak a megvett színek között lehet váltani)
    function openBeautyDialog(b) {
        var host = $('el-modal-host');
        if (buyDlg || host.firstChild || S.event) return;
        var list = D.LOOK_COLORS[b.slot] || [];
        var own = E.beautyColorsOf(S, b.id);
        var free = list.filter(function (c) { return own.indexOf(c.id) < 0; });
        var choice = { color: (free[0] || list[0]).id };
        var isNew = !!S.beauty[b.id];
        buyDlg = { wasPaused: S.paused, prevFocus: document.activeElement };
        S.paused = true; updateSpeed();
        var price = E.beautyPrice(S, b.cost);
        var ov = el('div', 'el-overlay');
        var m = el('div', 'el-modal el-buy');
        m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'el-buy-title');
        var body = el('div', 'el-modal-body');
        var h = el('h2', '', (isNew ? 'Új szín · ' : 'Milyen színű legyen? · ') + b.name); h.id = 'el-buy-title';
        body.appendChild(h);
        body.appendChild(el('p', 'el-note', 'A szín vásárláskor dől el: a megvett színek között utólag váltogathatsz, de újat csak új vásárlással szerezhetsz.' + (isNew ? ' Már megvan: ' + own.map(function (c) { var x = D.find(list, c); return x ? x.label : ''; }).join(', ') + '.' : '')));
        var grid = el('div', 'el-buy-grid');
        var prevBox = el('div', 'el-buy-prev'), ctrl = el('div', 'el-buy-ctrl');
        grid.appendChild(prevBox); grid.appendChild(ctrl);
        body.appendChild(grid);
        var btns = el('div', 'el-buy-btns');
        var cancel = el('button', 'el-btn alt', 'Mégse'); cancel.type = 'button';
        cancel.addEventListener('click', function () { closeBuyDialog(true); });
        var ok = el('button', 'el-btn', ''); ok.type = 'button';
        ok.addEventListener('click', function () {
            var c = choice.color;
            closeBuyDialog(true);
            act(function () { reportResult(E.buyBeauty(S, b.id, { color: c }), null); })();
        });
        btns.appendChild(cancel); btns.appendChild(ok);
        body.appendChild(btns);
        m.appendChild(body); ov.appendChild(m); host.appendChild(ov);
        function render() {
            clear(prevBox); clear(ctrl);
            var tb = el('div', 'el-thumbbox');
            tb.appendChild(beautyThumbEl(b, lookColorHex(b.slot, choice.color)));
            prevBox.appendChild(tb);
            var cap = el('div', 'el-paint-cap'); cap.appendChild(icon('palette')); cap.appendChild(document.createTextNode(' Szín: ' + (D.find(list, choice.color) || {}).label));
            ctrl.appendChild(cap);
            var row = el('div', 'el-swatches');
            list.forEach(function (c) {
                var sw = el('button', 'el-sw' + (own.indexOf(c.id) >= 0 ? ' owned' : ''));
                sw.type = 'button'; sw.style.background = c.color;
                var have = own.indexOf(c.id) >= 0;
                sw.title = c.label + (have ? ' · már megvan' : '');
                sw.setAttribute('aria-label', 'Szín: ' + sw.title);
                sw.setAttribute('aria-pressed', String(choice.color === c.id));
                sw.addEventListener('click', function () { choice.color = c.id; render(); });
                row.appendChild(sw);
            });
            ctrl.appendChild(row);
            var have2 = own.indexOf(choice.color) >= 0, broke = S.money < price;
            ok.disabled = have2 || broke;
            ok.textContent = have2 ? 'Ez a szín már megvan' : (broke ? 'Nincs elég pénzed · ' + fF(price) : 'Megveszem · ' + fF(price));
        }
        render();
        ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBuyDialog(true); });
        ov.addEventListener('click', function (e) { if (e.target === ov) closeBuyDialog(true); });
        (m.querySelector('.el-sw[aria-pressed="true"]') || ok).focus({ preventScroll: true });
    }
    function pBeauty(p) {
        var secret = E.isSecret(S);
        var st = E.stats(S);
        var lvl = E.lvl(S, 'smink');
        var cnt = E.lookCount(S);

        var sum = el('div', 'el-item el-sum');
        var head = el('div', 'el-sum-head');
        head.appendChild(el('h4', '', 'Sminkasztal'));
        head.appendChild(chip(cnt + ' / ' + D.LOOK_SLOTS.length + ' hely sminkelve', cnt === D.LOOK_SLOTS.length ? 'hot' : ''));
        sum.appendChild(head);
        sum.appendChild(el('div', 'el-note', 'Smink és stílus: ' + lvl + '. szint. A haladó termékekhez magasabb szint kell (Tanulás fül), és minden szint 4%-kal csökkenti az árakat.' + (st.fullLook ? ' Teljes arc: +' + Object.keys(D.FULL_LOOK_BONUS).map(function (k) { return D.FULL_LOOK_BONUS[k] + ' ' + D.find(D.STATS, k).label.toLowerCase(); }).join(', +') + '.' : ' Ha az ajak, a pír, a szemhéj, a szemkihúzó és a pillák is ki van töltve, teljes arc bónusz jár.')));
        if (secret && S.hiding) sum.appendChild(el('div', 'el-note', 'Most rejtőzködsz: a smink nem látszik, és statot sem ad.'));
        p.appendChild(sum);

        var bar = el('div', 'el-slotbar');
        bar.setAttribute('role', 'tablist');
        bar.setAttribute('aria-label', 'Smink-hely');
        D.LOOK_SLOTS.forEach(function (sl) {
            var items = D.BEAUTY.filter(function (b) { return b.slot === sl.id; });
            var have = items.filter(function (b) { return S.beauty[b.id]; }).length;
            var b2 = el('button', 'el-slot' + (lookSlot === sl.id ? ' on' : ''));
            b2.type = 'button';
            b2.setAttribute('role', 'tab');
            b2.setAttribute('aria-selected', String(lookSlot === sl.id));
            b2.appendChild(icon(sl.icon));
            b2.appendChild(el('span', '', sl.label));
            b2.appendChild(el('small', '', have + '/' + items.length));
            if (S.look[sl.id]) b2.classList.add('filled');
            b2.addEventListener('click', function () { lookSlot = sl.id; renderPanel(); });
            bar.appendChild(b2);
        });
        p.appendChild(bar);

        var tools = el('div', 'el-tools');
        tools.appendChild(actionBtn('Lemosom az egészet', act(function () { D.LOOK_SLOTS.forEach(function (sl) { E.applyBeauty(S, sl.id, null); }); }), { cls: 'alt' }));
        p.appendChild(tools);

        var g = el('div', 'el-grid');
        D.BEAUTY.filter(function (b) { return b.slot === lookSlot; }).forEach(function (b) {
            var owned = !!S.beauty[b.id];
            var cur = S.look[b.slot];
            var on = !!(cur && cur.id === b.id);
            var locked = b.skill && lvl < b.skill;
            var colorHex = b.tone ? lookColorHex(b.slot, on ? cur.color : (owned ? E.beautyColorsOf(S, b.id)[0] : null)) : null;
            var chips = [];
            if (b.click) chips.push(['+' + f1(b.click) + ' kattintás', 'plus']);
            if (secret && b.risk) chips.push(['Titok +' + b.risk, 'minus']);
            statChips(b.st).forEach(function (c) { chips.push(c); });
            if (b.skill) chips.push(['Smink ' + b.skill + '. szint', locked ? 'minus' : 'plus']);
            var price = E.beautyPrice(S, b.cost);
            var btn;
            if (!owned) {
                if (locked) btn = el('div', 'el-note', 'Zárolva: Smink és stílus ' + b.skill + '. szint kell hozzá (Tanulás fül).');
                else if (b.tone) btn = actionBtn('Kiválasztom a színt és megveszem · ' + fF(price), function () { openBeautyDialog(b); }, { cost: price });
                else btn = actionBtn('Megveszem · ' + fF(price), act(function () { reportResult(E.buyBeauty(S, b.id)); }), { cost: price });
            } else btn = actionBtn(on ? 'Fent van ✓ (lemosom)' : 'Felhordom', act(function () { E.applyBeauty(S, b.slot, on ? null : b.id); }), { cls: on ? 'alt' : 'blue' });
            g.appendChild(itemCard({ title: b.name, desc: b.desc, owned: owned, worn: on, chips: chips, btn: btn, note: !owned && b.tone && !locked ? 'A szín vásárláskor választható; utólag csak a megvett színek között válthatsz.' : null, extra: owned && b.tone ? lookSwatches(b) : null, thumb: beautyThumbEl(b, colorHex) }));
        });
        p.appendChild(g);
    }

    // --- Barátok ---
    var SOCIAL_SCENE = { lilla: 'friends', bence: 'discord', nori: 'con', kata: 'office', csalad: 'family', zsombor: 'cafe' };
    function personThumb(id) {
        return imgFromSvg('pp|' + id, function () { return A.personSvg(id); }, 'el-portrait');
    }
    function monthsAgo(s, id) {
        var l = s.social.last[id];
        if (l === undefined) return null;
        return s.month - l;
    }
    function perkLine(person, perks) {
        var parts = [];
        var eff = Math.max(0, E.bond(S, person.id) - person.start);
        for (var k in person.perk) {
            var v = person.perk[k] * eff;
            if (!v) continue;
            if (k === 'passive') parts.push('+' + f1(v) + ' önbizalom/mp');
            else if (k === 'click') parts.push('+' + f1(v) + ' kattintás');
            else if (k === 'regen') parts.push('+' + f1(v) + ' energia/mp');
            else if (k === 'comm') parts.push('+' + f1(v) + ' közösség/hó');
            else if (k === 'risk') parts.push('−' + f1(v) + ' titok/hó');
            else if (k === 'pay') parts.push('+' + f1(v * 100) + '% fizetés');
        }
        return parts.join(' · ');
    }
    function socialResultBox(r) {
        var box = el('div', 'el-social-result ' + r.tone);
        var host = el('div', 'el-social-art');
        var v = currentView();
        v.guest = r.who;
        v.mood = 'happy';
        host.innerHTML = A.scene(SOCIAL_SCENE[r.who] || 'friends', v);
        box.appendChild(host);
        var tx = el('div', 'el-social-tx');
        tx.appendChild(el('p', '', r.text));
        var meta = [];
        meta.push((r.bond >= 0 ? '+' : '−') + f1(Math.abs(r.bond)) + ' kötelék');
        if (r.conf) meta.push('+' + grp(r.conf) + ' önbizalom');
        if (r.bonus) meta.push('+' + fF(r.bonus));
        var chips = el('div', 'el-chips');
        meta.forEach(function (m) { chips.appendChild(chip(m, 'plus')); });
        tx.appendChild(chips);
        box.appendChild(tx);
        return box;
    }
    function pFriends(p) {
        var list = E.people(S);
        var perks = E.perks(S);
        var sum = el('div', 'el-item el-sum');
        var head = el('div', 'el-sum-head');
        head.appendChild(el('h4', '', 'Barátok és kapcsolatok'));
        var known = list.filter(function (x) { return x.unlocked; }).length;
        head.appendChild(chip(known + ' / ' + list.length + ' ismerős', ''));
        sum.appendChild(head);
        var tot = [];
        if (perks.passive) tot.push('+' + f1(perks.passive) + ' önbizalom/mp');
        if (perks.click) tot.push('+' + f1(perks.click) + ' kattintás');
        if (perks.regen) tot.push('+' + f1(perks.regen) + ' energia/mp');
        if (perks.comm) tot.push('+' + f1(perks.comm) + ' közösség/hó');
        if (perks.risk) tot.push('−' + f1(perks.risk) + ' titok/hó');
        if (perks.pay) tot.push('+' + f1(perks.pay * 100) + '% fizetés');
        sum.appendChild(el('div', 'el-note', tot.length ? 'Most a barátaid ennyit adnak: ' + tot.join(' · ') + '.' : 'Minden kapcsolat hasznos: a kötelék növelésével tartós bónuszokat kapsz. Ha ' + D.SOCIAL_DECAY_AFTER + ' hónapig nem találkoztok, lassan kopik.'));
        p.appendChild(sum);

        if (socialNote) p.appendChild(socialResultBox(socialNote));

        list.forEach(function (x) {
            var pe = x.person;
            var card = el('div', 'el-item el-person' + (x.unlocked ? '' : ' locked'));
            var top = el('div', 'el-person-top');
            var pw = el('div', 'el-portrait-box');
            if (x.unlocked) pw.appendChild(personThumb(pe.id)); else pw.appendChild(icon('lock'));
            top.appendChild(pw);
            var meta = el('div', 'el-person-meta');
            meta.appendChild(el('h4', '', x.unlocked ? pe.name : 'Ismeretlen'));
            meta.appendChild(el('div', 'el-note', x.unlocked ? pe.role : unlockHint(pe)));
            if (x.unlocked) {
                var bar = el('div', 'el-bar bond');
                var fill = el('i');
                fill.style.width = Math.min(100, x.bond) + '%';
                bar.appendChild(fill);
                bar.setAttribute('role', 'img');
                bar.setAttribute('aria-label', 'Kötelék: ' + Math.floor(x.bond) + ' / 100');
                var brow = el('div', 'el-bond-row');
                brow.appendChild(el('span', '', 'Kötelék'));
                brow.appendChild(el('b', '', Math.floor(x.bond) + ' / 100'));
                meta.appendChild(brow);
                meta.appendChild(bar);
                var ago = monthsAgo(S, pe.id);
                var note = perkLine(pe, perks);
                meta.appendChild(el('div', 'el-note', 'Hatás: ' + (note || pe.perkText) + (pe.perkReq === 'partner' && !S.flags.partner ? ' (ha összejöttök)' : '')));
                if (ago !== null && ago >= D.SOCIAL_DECAY_AFTER - 1) meta.appendChild(el('div', 'el-note warn', 'Rég beszéltetek: a kötelék hamarosan kopni kezd.'));
            }
            top.appendChild(meta);
            card.appendChild(top);
            if (x.unlocked) {
                var acts = el('div', 'el-social-acts');
                D.SOCIAL.filter(function (a) { return a.who === pe.id; }).forEach(function (a) {
                    var can = E.canSocial(S, a.id);
                    var row = el('div', 'el-social-row' + (can.ok ? '' : ' off'));
                    var b = el('button', 'el-btn' + (can.ok ? ' blue' : ' alt'));
                    b.type = 'button';
                    b.textContent = a.name;
                    b.disabled = !can.ok;
                    if (can.ok) { b.dataset.cost = String(a.cost); b.dataset.cur = 'money'; }
                    b.addEventListener('click', act(function () {
                        var r = E.doSocial(S, a.id);
                        if (!r.ok) { reportResult(r); return; }
                        socialNote = r;
                        happyUntil = performance.now() + 2600;
                        if (r.special === 'partner') toast('Összejöttél Zsomborral!', 'good');
                        else if (r.special === 'rejected') toast('Zsombor most még barátként gondol rád.', 'bad');
                        else if (r.special === 'parents') toast('A szüleid elfogadtak!', 'good');
                        else toast(pe.name + ': ' + (r.tone === 'great' ? 'nagyszerű volt!' : r.tone === 'ok' ? 'jó volt.' : 'kicsit döcögős volt.'), r.tone === 'meh' ? '' : 'good');
                    }));
                    row.appendChild(b);
                    var info = el('div', 'el-social-info');
                    info.appendChild(el('span', 'el-note', a.desc));
                    var cs = el('div', 'el-chips');
                    if (a.cost) cs.appendChild(chip(fF(a.cost), 'minus'));
                    cs.appendChild(chip('Energia −' + a.energy, ''));
                    if (a.minBond) cs.appendChild(chip('Kötelék ' + a.minBond + '+', ''));
                    info.appendChild(cs);
                    if (!can.ok) info.appendChild(el('span', 'el-note warn', can.reason));
                    row.appendChild(info);
                    acts.appendChild(row);
                });
                card.appendChild(acts);
                card.appendChild(giftBox(pe));
            }
            p.appendChild(card);
        });
    }
    // Ajándékozás: a saját tárgyad odaadod; mindenki mást szeret
    function giftBox(pe) {
        var wrap = el('div', 'el-gift');
        var tz = D.GIFT_TASTE[pe.id];
        if (!tz) return wrap;
        var owned = Object.keys(S.items).filter(function (id) { return D.find(D.ITEMS, id); });
        var open = giftFor === pe.id;
        var head = el('div', 'el-social-row');
        var b = el('button', 'el-btn' + (open ? '' : ' alt'));
        b.type = 'button';
        b.textContent = open ? 'Mégse' : 'Ajándékot adok';
        b.addEventListener('click', function () { giftFor = open ? null : pe.id; giftPick = null; renderPanel(); });
        head.appendChild(b);
        var info = el('div', 'el-social-info');
        info.appendChild(el('span', 'el-note', pe.name + ' szereti: ' + tz.likes + '.'));
        var at = S.social.giftAt && S.social.giftAt[pe.id];
        if (at !== undefined && S.month - at < D.GIFT_CD) info.appendChild(el('span', 'el-note warn', 'Nemrég ajándékoztál (még ' + (D.GIFT_CD - (S.month - at)) + ' hónapig).'));
        head.appendChild(info);
        wrap.appendChild(head);
        if (!open) return wrap;
        if (!owned.length) { wrap.appendChild(el('div', 'el-note warn', 'Még nincs egyetlen tárgyad sem, amit odaadhatnál. Vásárolj a Szekrény fülön.')); return wrap; }
        var grid = el('div', 'el-gift-list');
        owned.forEach(function (id) {
            var it = D.find(D.ITEMS, id);
            var gb = el('button', 'el-choice');
            gb.type = 'button';
            gb.textContent = it.name;
            gb.setAttribute('aria-pressed', String(giftPick === id));
            gb.addEventListener('click', function () { giftPick = id; renderPanel(); });
            grid.appendChild(gb);
        });
        wrap.appendChild(grid);
        if (giftPick && S.items[giftPick]) {
            var it2 = D.find(D.ITEMS, giftPick);
            var can = E.canGift(S, pe.id, giftPick);
            var ok = el('button', 'el-btn' + (can.ok ? ' blue' : ' alt'));
            ok.type = 'button';
            ok.textContent = 'Odaadom: ' + it2.name;
            ok.disabled = !can.ok;
            ok.addEventListener('click', act(function () {
                var r = E.giveGift(S, pe.id, giftPick);
                if (!r.ok) { reportResult(r); return; }
                socialNote = { who: pe.id, tone: r.tone, text: r.text, bond: r.bond, conf: 0 };
                giftFor = null; giftPick = null;
                happyUntil = performance.now() + 2600;
                toast(pe.name + ': ' + (r.tone === 'great' ? 'imádja az ajándékot!' : r.tone === 'ok' ? 'örül az ajándéknak.' : 'megköszöni az ajándékot.'), r.tone === 'meh' ? '' : 'good');
            }));
            wrap.appendChild(ok);
            wrap.appendChild(el('div', 'el-note', 'A tárgy végleg az övé lesz, nálad megszűnik. Ha viselted, lekerül rólad.'));
            if (!can.ok) wrap.appendChild(el('div', 'el-note warn', can.reason));
        }
        return wrap;
    }
    function unlockHint(pe) {
        var u = pe.unlock || {};
        if (u.flag === 'discord') return 'Csatlakozz a Discord-szerverhez, és megismerkedtek.';
        if (u.cons) return 'Menj el egy conra: ott találkoztok.';
        if (u.job) return 'Vállalj állást: a munkahelyen találkoztok.';
        if (u.anyOf) return 'Legyél legalább ' + (u.minAge || 16) + ' éves, és bízd rá valakire a titkod, vagy gyarapítsd a közösséged.';
        return 'Még nem ismered.';
    }

    // --- Szoba ---
    function pRoom(p) {
        var sum = el('div', 'el-item el-sum');
        sum.appendChild(el('h4', '', 'A szobád hangulata'));
        sum.appendChild(el('div', 'el-note', 'A szobadíszek és a társ statpontokat adnak, ugyanúgy, mint a ruhák. A kombók a Szekrény fülön láthatók.'));
        p.appendChild(sum);
        p.appendChild(sectionTitle('Dekoráció'));
        var g = el('div', 'el-grid');
        D.DECOR.forEach(function (d) {
            var owned = !!S.decor[d.id];
            var chips = [];
            if (d.click) chips.push(['+' + f1(d.click) + ' kattintás', 'plus']);
            if (d.passive) chips.push(['+' + f1(d.passive) + '/mp', 'plus']);
            if (d.regen) chips.push(['energia +' + f1(d.regen) + '/mp', 'plus']);
            statChips(d.st).forEach(function (c) { chips.push(c); });
            var price = E.price(S, d.cost);
            g.appendChild(itemCard({
                title: d.name, desc: d.desc, owned: owned, chips: chips, thumb: thumbEl('decor', d.id),
                btn: owned ? el('div', 'el-note', 'A szobádban van ✓') : actionBtn('Megveszem · ' + fF(price), act(function () { reportResult(E.buyDecor(S, d.id)); }), { cost: price })
            }));
        });
        p.appendChild(g);
        p.appendChild(sectionTitle('Társ'));
        var g2 = el('div', 'el-grid');
        D.PETS.forEach(function (pt) {
            var owned = !!S.pets[pt.id];
            var homeOk = pt.needsHome.indexOf(S.housing) >= 0;
            var chips = [['+' + f1(pt.passive) + '/mp', 'plus'], ['energia +' + f1(pt.regen) + '/mp', 'plus']];
            statChips(pt.st).forEach(function (c) { chips.push(c); });
            g2.appendChild(itemCard({
                title: pt.name, desc: pt.desc, owned: owned, chips: chips, thumb: thumbEl('pet', pt.id),
                note: homeOk || owned ? '' : 'Ehhez saját albérlet vagy lakás kell.',
                btn: owned ? el('div', 'el-note', 'A tiéd ✓') : actionBtn('Örökbe fogadom · ' + fF(pt.cost), act(function () { reportResult(E.buyPet(S, pt.id)); }), { cost: pt.cost })
            }));
        });
        p.appendChild(g2);
    }

    // --- Gép ---
    // --- Játékok (Gép fül) ---
    function gamesSection(p, d) {
        p.appendChild(sectionTitle('Játékok'));
        p.appendChild(el('div', 'el-note', 'Néhány játék ingyenes, a többit meg kell venni, és erősebb gép kell hozzájuk. Havonta egyszer játszhatsz egy-egy játékkal: energiába kerül, de ideiglenes bónuszt ad (stat, energia-határ), a rendszeres játékkal pedig jártasságot szerzel, ami állandó statot jelent.'));
        var g = el('div', 'el-grid');
        D.GAMES.forEach(function (gm) {
            var owned = E.gameOwned(S, gm.id), plays = E.gamePlays(S, gm.id), lv = E.gameLevel(S, gm.id);
            var chips = [[gm.cost === 0 ? 'Ingyenes' : 'Megvásárolható', gm.cost === 0 ? 'plus' : ''], ['−' + E.gameCost(S, gm) + ' energia', 'minus']];
            chips.push(['Minimum: ' + D.COMPUTERS[gm.minComp].name, S.comp >= gm.minComp ? 'plus' : 'minus']);
            if (gm.rec > gm.minComp) chips.push(['Ajánlott: ' + D.COMPUTERS[gm.rec].name, S.comp >= gm.rec ? 'plus' : 'minus']);
            if (gm.needsDiscord) chips.push(['Discord kell', S.flags.discord ? 'plus' : 'minus']);
            var perLevel = statChips(gm.st).map(function (c) { return [c[0] + ' / szint', c[1]]; });
            perLevel.forEach(function (c) { chips.push(c); });
            var card = itemCard({ title: gm.name, desc: gm.desc, owned: owned, chips: chips });
            var tmp = [];
            if (gm.temp) {
                var bits = [];
                if (gm.temp.en) bits.push('energia-határ ' + (gm.temp.en > 0 ? '+' : '−') + Math.abs(gm.temp.en));
                if (gm.temp.regen) bits.push('regeneráció +' + f1(gm.temp.regen) + '/mp');
                var sc = statText(gm.temp.st); if (sc) bits.push(sc);
                tmp.push('Játék után ' + gm.temp.months + ' hónapig: ' + gm.temp.label + (bits.length ? ' (' + bits.join(', ') + ')' : ''));
            }
            card.appendChild(el('div', 'el-note', tmp.join(' ')));
            if (owned) {
                var nextAt = D.GAME_LEVELS[lv];
                var prog = el('div', 'el-note');
                prog.appendChild(icon('star'));
                prog.appendChild(document.createTextNode(' Jártasság: ' + lv + '/' + D.GAME_LEVELS.length + ' · ' + plays + ' játék' + (nextAt ? ' (következő szint: ' + nextAt + ')' : ' (maximum)')));
                card.appendChild(prog);
            }
            var price = E.price(S, gm.cost);
            if (!owned) {
                var b0 = actionBtn('Megveszem · ' + fF(price), act(function () { reportResult(E.buyGame(S, gm.id), 'Megvetted: ' + gm.name + '.'); }), { cost: price });
                if (S.comp < gm.minComp) { b0.disabled = true; b0.title = 'Jobb gép kell hozzá'; }
                card.appendChild(b0);
            } else {
                var can = E.canPlay(S, gm.id);
                var lagging = E.gameLag(S, gm);
                if (lagging) card.appendChild(el('div', 'el-note bad', 'Az ajánlott gép (' + D.COMPUTERS[gm.rec].name + ') alatt akadozik: +40% energia, kevesebb önbizalom.'));
                var b1 = actionBtn('Játszom · −' + E.gameCost(S, gm) + ' energia', act(function () {
                    var r = E.playGame(S, gm.id);
                    if (reportResult(r)) {
                        toast(r.text + ' (+' + grp(r.conf) + ' önbizalom)', 'good');
                        if (r.levelUp) toast(gm.name + ': ' + r.level + '. szintű jártasság! Állandó stat-bónusz.', 'funny');
                        happyUntil = performance.now() + 4000;
                    }
                }));
                if (!can.ok) { b1.disabled = true; card.appendChild(b1); card.appendChild(el('div', 'el-note', can.reason + '.')); }
                else card.appendChild(b1);
            }
            g.appendChild(card);
        });
        p.appendChild(g);
    }
    function pComputer(p) {
        var d = E.derive(S);
        var c = D.COMPUTERS[S.comp];
        var cur = el('div', 'el-item owned');
        cur.appendChild(el('h4', '', 'A géped: ' + c.name));
        cur.appendChild(el('p', '', c.desc));
        if (c.spec) cur.appendChild(el('div', 'el-note', 'Specifikáció: ' + c.spec));
        var cs = el('div', 'el-chips');
        cs.appendChild(chip('tanulás +' + f1(c.study), 'plus'));
        cs.appendChild(chip('online önbizalom +' + f1(c.online * (S.flags.discord ? 1 : 0.4)) + '/mp', 'plus'));
        if (c.upkeep && S.housing !== 'szulo') cs.appendChild(chip('üzemeltetés ' + fF(c.upkeep) + '/hó', 'minus'));
        cur.appendChild(cs);
        if (!S.flags.discord) cur.appendChild(el('div', 'el-note', 'Az online bónusz csak 40%, amíg nem csatlakozol a közösségi Discordhoz (egy esemény során megteheted).'));
        if (d.broken) {
            cur.appendChild(el('div', 'el-note', 'A gép elromlott: nincs tanulási és online bónusz, amíg meg nem javítod (vagy ki nem várod).'));
            var cost = E.repairCost(S);
            cur.appendChild(actionBtn('Megjavíttatom · ' + fF(cost), act(function () { reportResult(E.repairComputer(S), 'Újra megy a gép.'); }), { cost: cost }));
        }
        p.appendChild(cur);
        var next = E.nextComputer(S);
        if (next) {
            var n = el('div', 'el-item');
            n.appendChild(el('h4', '', 'Következő: ' + next.name));
            n.appendChild(el('p', '', next.desc));
            var ncs = el('div', 'el-chips');
            ncs.appendChild(chip('tanulás +' + f1(next.study), 'plus'));
            ncs.appendChild(chip('online +' + f1(next.online) + '/mp', 'plus'));
            if (next.upkeep) ncs.appendChild(chip('üzemeltetés ' + fF(next.upkeep) + '/hó', 'minus'));
            n.appendChild(ncs);
            n.appendChild(actionBtn('Megveszem · ' + fF(next.cost), act(function () { reportResult(E.buyComputer(S), 'Új gép: ' + next.name + '!'); }), { cost: next.cost }));
            p.appendChild(n);
        } else p.appendChild(el('div', 'el-note', 'Ennél jobb gép már nincs. Ez a csúcs.'));
        gamesSection(p, d);
        p.appendChild(sectionTitle('Fejlődési út'));
        var list = el('div', 'el-chips');
        D.COMPUTERS.forEach(function (x, i) { list.appendChild(chip((i <= S.comp ? '✓ ' : '') + x.name, i <= S.comp ? 'plus' : '')); });
        p.appendChild(list);
    }

    // --- Tanulás ---
    function pStudy(p) {
        var d = E.derive(S);
        var info = el('div', 'el-note', 'Válassz egy képességet: ez fejlődik magától is (' + f1(d.studyRate) + ' pont/mp), a Tanulás gombbal gyorsíthatod.' + (S.student ? ' Hallgatóként gyorsabban haladsz.' : ''));
        p.appendChild(info);
        var g = el('div', 'el-grid');
        D.SKILLS.forEach(function (sk) {
            var lv = S.skills[sk.id] || 0;
            var can = E.canStudy(S, sk.id);
            var active = S.activeSkill === sk.id;
            var lvls = el('div', 'el-skill-levels');
            for (var i = 0; i < D.SKILL_MAX; i++) lvls.appendChild(el('i', i < lv ? 'on' : ''));
            var extra = el('div', 'el-progress');
            extra.appendChild(lvls);
            if (lv < D.SKILL_MAX) {
                var bar = el('div', 'el-bar');
                var fill = el('i');
                fill.dataset.skillBar = sk.id;
                bar.appendChild(fill);
                extra.appendChild(bar);
            }
            var btn = can.ok || active ? actionBtn(active ? 'Aktív ✓ (leállít)' : 'Ezt tanulom', act(function () { reportResult(E.setActiveSkill(S, sk.id)); }), { cls: active ? 'alt' : 'blue' }) : null;
            g.appendChild(itemCard({
                title: sk.name + ' · ' + lv + '. szint', desc: sk.desc, owned: lv > 0, worn: active, chips: [[sk.perLevel, '']], extra: extra,
                note: can.ok ? '' : can.reason, btn: btn
            }));
        });
        p.appendChild(g);
    }

    // --- Munka ---
    function pJobs(p) {
        var d = E.derive(S);
        var top = el('div', 'el-item owned');
        top.appendChild(el('h4', '', S.job ? 'Állásod: ' + d.job.name : 'Most nincs állásod'));
        top.appendChild(el('p', '', S.job ? d.job.desc : 'Alkalmi munka: ' + d.workLabel + ' (+' + grp(d.workClick) + ' Ft kattintásonként).'));
        if (S.job) {
            var cs = el('div', 'el-chips');
            cs.appendChild(chip(fF(d.job.pay) + '/hó', 'plus'));
            cs.appendChild(chip('+' + grp(d.job.click) + ' Ft/kattintás', 'plus'));
            cs.appendChild(chip(d.job.hours === 'full' ? 'teljes munkaidő' : 'részmunkaidő', ''));
            cs.appendChild(chip(S.jobMonths + ' hónapja', ''));
            top.appendChild(cs);
            if (d.jobBonus && d.jobBonus.parts.length) top.appendChild(el('div', 'el-note', 'Stat-bónusz a bérre és a műszakra: +' + d.jobBonus.pct + '% (' + d.jobBonus.parts.map(function (x) { return D.find(D.STATS, x.stat).label + ' ' + x.value + ' → +' + f1(x.pct) + '%'; }).join(', ') + ').'));
            top.appendChild(actionBtn('Felmondok', act(function () { if (window.confirm('Biztosan felmondasz?')) reportResult(E.quit(S)); }), { cls: 'alt' }));
        }
        p.appendChild(top);
        p.appendChild(sectionTitle('Állások'));
        var g = el('div', 'el-grid');
        D.JOBS.forEach(function (j) {
            var can = E.canHire(S, j.id);
            var chips = [[fF(j.pay) + '/hó', 'plus'], ['+' + grp(j.click) + ' Ft/kattintás', 'plus'], [j.hours === 'full' ? 'teljes munkaidő' : 'részmunkaidő', '']];
            var need = [];
            Object.keys(j.needs || {}).forEach(function (k) { need.push(D.find(D.SKILLS, k).name + ' ' + j.needs[k] + '.'); });
            if (j.comp) need.push(D.COMPUTERS[j.comp].name);
            if (j.comm) need.push('Közösség ' + j.comm);
            Object.keys(j.needsStat || {}).forEach(function (k) { need.push(D.find(D.STATS, k).label + ' stat ' + j.needsStat[k]); });
            if (j.minAge) need.push(j.minAge + '+ év');
            if (need.length) chips.push(['Kell: ' + need.join(', '), '']);
            var jb = E.jobBonus(S, j);
            Object.keys(j.sw || {}).forEach(function (k) { chips.push([D.find(D.STATS, k).label + ' +' + f1(j.sw[k] * 100) + '%/pont', 'stat ' + STAT_TONE[k]]); });
            if (jb.pct) chips.push(['most: +' + jb.pct + '% bér', 'plus']);
            var cur = S.job === j.id;
            g.appendChild(itemCard({
                title: j.name, desc: j.desc, owned: cur, worn: cur, chips: chips, note: can.ok || cur ? '' : can.reason,
                btn: cur ? el('div', 'el-note', 'Itt dolgozol ✓') : actionBtn('Jelentkezem', act(function () { reportResult(E.hire(S, j.id), 'Felvettek: ' + j.name + '!'); }), { cls: can.ok ? 'blue' : 'alt' })
            }));
        });
        p.appendChild(g);
    }

    // --- Lakás ---
    function pHousing(p) {
        var g = el('div', 'el-grid');
        D.HOUSING.forEach(function (h) {
            var can = E.canMove(S, h.id);
            var here = S.housing === h.id;
            var chips = [];
            if (h.id !== 'szulo') {
                chips.push(['lakbér ' + fF(h.rent) + '/hó', 'minus']);
                chips.push(['rezsi és élet ' + fF(h.living) + '/hó', 'minus']);
                chips.push(['kaució ' + fF(h.deposit), '']);
            } else chips.push(['nincs lakbér', 'plus'], ['zsebpénz jár (fiatalon)', 'plus'], ['titkolózni kell', 'minus']);
            chips.push(['komfort ' + h.comfort + '/4', '']);
            g.appendChild(itemCard({
                title: h.name, desc: h.desc, owned: here, worn: here, chips: chips, note: here || can.ok ? '' : can.reason,
                btn: here ? el('div', 'el-note', 'Itt laksz ✓') : actionBtn(h.id === 'szulo' ? 'Visszaköltözöm' : 'Beköltözöm', act(function () {
                    if (h.id === 'szulo' && !window.confirm('Biztosan visszaköltözöl a szüleidhez?')) return;
                    reportResult(E.move(S, h.id), 'Új otthon: ' + h.name + '.');
                }), { cls: can.ok ? 'blue' : 'alt', cost: h.id === 'szulo' ? 0 : h.deposit })
            }));
        });
        p.appendChild(g);
        p.appendChild(el('div', 'el-note', 'Figyelj rá: a lakbér és a rezsi minden hónap végén levonódik. Ha három hónapig mínuszban vagy, baj lesz.'));
    }

    // --- Merész lépések ---
    function pSteps(p) {
        p.appendChild(el('div', 'el-note', 'Ezeket önbizalomból fizeted: bátor dolgok, amik tartósan növelik a kattintásod értékét.'));
        var secret = E.isSecret(S);
        var todo = D.STEPS.filter(function (s2) { return !S.steps[s2.id]; });
        var done = D.STEPS.filter(function (s2) { return S.steps[s2.id]; });
        var g = el('div', 'el-grid');
        todo.forEach(function (st) {
            var can = E.ageYears(S) >= st.minAge;
            var chips = [];
            if (st.click) chips.push(['+' + f1(st.click) + ' kattintás', 'plus']);
            if (st.passive) chips.push(['+' + f1(st.passive) + '/mp', 'plus']);
            if (st.comm) chips.push(['közösség +' + st.comm, 'plus']);
            if (secret && st.risk) chips.push(['Titok +' + st.risk, 'minus']);
            g.appendChild(itemCard({
                title: st.name, desc: st.text, chips: chips, note: can ? '' : st.minAge + ' éves kortól',
                btn: actionBtn('Megteszem · ' + grp(st.cost) + ' önbizalom', act(function () { reportResult(E.buyStep(S, st.id), 'Megtetted!'); }), { cost: st.cost, cur: 'conf', cls: can ? '' : 'alt' })
            }));
        });
        p.appendChild(g);
        if (done.length) {
            p.appendChild(sectionTitle('Már megtetted (' + done.length + ')'));
            var l = el('ul', 'el-log');
            done.forEach(function (st) { l.appendChild(el('li', '', '✓ ' + st.name)); });
            p.appendChild(l);
        }
    }

    // --- Élmények ---
    function pExp(p) {
        p.appendChild(el('div', 'el-note', 'Pénzért vehető, újrajátszható élmények. Mindegyik után egy ideig pihen.'));
        var g = el('div', 'el-grid');
        D.EXPERIENCES.forEach(function (x) {
            var can = E.canExperience(S, x.id);
            var chips = [];
            if (x.conf) chips.push(['+' + x.conf + ' önbizalom', 'plus']);
            if (x.comm) chips.push(['közösség +' + x.comm, 'plus']);
            if (x.energy) chips.push(['energia feltöltődik', 'plus']);
            if (x.skillPts) chips.push(['+' + x.skillPts + ' tanulási pont', 'plus']);
            chips.push(['szünet ' + x.cd + ' hónap', '']);
            g.appendChild(itemCard({
                title: x.name, desc: x.desc, chips: chips, note: can.ok ? '' : can.reason,
                btn: actionBtn('Megyek · ' + fF(x.cost), act(function () {
                    var r = E.doExperience(S, x.id);
                    if (reportResult(r)) panelNote = r.text;
                }), { cost: x.cost, cls: can.ok ? '' : 'alt' })
            }));
        });
        p.appendChild(g);
    }

    // --- Napló / Eredmények ---
    function pLog(p) {
        var l = el('ul', 'el-log');
        l.style.maxHeight = 'none';
        if (!S.log.length) l.appendChild(el('li', '', 'Még nincs bejegyzés.'));
        S.log.slice().reverse().forEach(function (e) {
            var li = el('li');
            li.appendChild(el('time', '', when(e.m)));
            li.appendChild(document.createTextNode(e.text));
            l.appendChild(li);
        });
        p.appendChild(l);
    }
    function pAch(p) {
        var n = Object.keys(S.ach).length;
        p.appendChild(el('div', 'el-note', n + '/' + Ev.ACHIEVEMENTS.length + ' eredmény'));
        var g = el('div', 'el-ach');
        Ev.ACHIEVEMENTS.forEach(function (a) {
            var got = S.ach[a.id] !== undefined;
            var c = el('div', got ? '' : 'locked');
            var b = el('b');
            b.appendChild(icon(got ? 'trophy' : 'lock'));
            b.appendChild(el('span', '', a.name));
            c.appendChild(b);
            c.appendChild(el('small', 'el-soft', a.desc));
            g.appendChild(c);
        });
        p.appendChild(g);
    }

    // =========================================================
    // KASZINÓ
    // =========================================================
    function rtpScratch() { return D.SCRATCH.outcomes.reduce(function (a, o) { return a + o.p * o.mult; }, 0); }
    function rtpSlot() {
        var syms = D.SLOT.symbols, tw = syms.reduce(function (a, s2) { return a + s2.weight; }, 0), ev = 0, i, j, k;
        for (i = 0; i < syms.length; i++) for (j = 0; j < syms.length; j++) for (k = 0; k < syms.length; k++) {
            var pr = (syms[i].weight / tw) * (syms[j].weight / tw) * (syms[k].weight / tw);
            var m = 0;
            if (i === j && j === k) m = syms[i].triple; else if (i === j || j === k || i === k) m = D.SLOT.pair;
            ev += pr * m;
        }
        return ev;
    }
    function pct(x) { return (x * 100).toFixed(1).replace('.', ',') + '%'; }

    var SYM = { 'szív': ['heart', '#d9567a'], 'csillag': ['star', '#e0a420'], 'cica': ['paw', '#c07a3a'], 'pulcsi': ['shirt', '#3a8fd0'], 'hetes': [null, '#c0364a'] };
    function symEl(id) {
        var w = el('span');
        w.style.color = SYM[id] ? SYM[id][1] : '#c0364a';
        w.style.display = 'inline-flex';
        if (id === 'hetes') w.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="19" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor" font-family="sans-serif">7</text></svg>';
        else w.innerHTML = A.icon(SYM[id][0]);
        w.setAttribute('role', 'img');
        w.setAttribute('aria-label', id);
        return w;
    }

    function pCasino(p) {
        var cs = E.casinoState(S);
        var g = S.gamble;
        var box = el('div', 'el-casino');
        var ban = el('div', 'el-casino-banner');
        ban.appendChild(el('b', '', 'Pasztell Kaszinó · csak játékpénz'));
        ban.appendChild(el('br'));
        ban.appendChild(el('small', '', 'Játékban érvényes 18+ szórakozás. Hosszú távon mindig a ház nyer: kaparós ' + pct(rtpScratch()) + ', nyerőgép ' + pct(rtpSlot()) + ', érmefeldobás ' + pct(D.COIN.winP * D.COIN.mult) + ' visszatérítéssel.'));
        box.appendChild(ban);

        if (!cs.open) {
            box.appendChild(el('div', 'el-result-box', cs.reason + '.'));
            p.appendChild(box);
            return;
        }

        // Keret és vágy
        var ctrl = el('div', 'el-item');
        var lab = el('label', '', 'Havi keret');
        lab.style.fontWeight = '700';
        lab.htmlFor = 'el-limit';
        var sel = el('select', 'el-select');
        sel.id = 'el-limit';
        D.GAMBLE_LIMITS.forEach(function (l) {
            var o = el('option', '', l.label);
            o.value = String(l.id);
            if (g.limit === l.id) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener('change', function () { reportResult(E.setGambleLimit(S, parseInt(sel.value, 10)), 'Keret beállítva.'); save(); renderPanel(); });
        ctrl.appendChild(lab); ctrl.appendChild(sel);
        ctrl.appendChild(el('div', 'el-note', 'Ebben a hónapban eddig: ' + fF(g.monthSpent) + (g.limit > 0 ? ' / ' + fF(g.limit) : '')));
        var urge = el('div', 'el-progress');
        urge.appendChild(el('div', 'el-note', 'Játékvágy: ' + Math.round(g.urge) + '%'));
        var ub = el('div', 'el-bar urge'); var uf = el('i'); uf.style.width = g.urge + '%'; ub.appendChild(uf); urge.appendChild(ub);
        ctrl.appendChild(urge);
        if (g.urge >= 60) ctrl.appendChild(el('div', 'el-note', 'Ha úgy érzed, folytatnod kell, az pont a játék trükkje. Tarts szünetet, vagy kérj önkizárást.'));
        ctrl.appendChild(actionBtn('Önkizárás ' + D.SELF_EXCLUDE_MONTHS + ' hónapra', act(function () {
            if (window.confirm(D.SELF_EXCLUDE_MONTHS + ' hónapig nem léphetsz be a kaszinóba. Biztos?')) { E.selfExclude(S); toast('Önkizárás aktív. Jó döntés.', 'good'); }
        }), { cls: 'alt' }));
        box.appendChild(ctrl);

        // Játék választó
        var sw = el('div', 'el-choices');
        [['scratch', 'Kaparós'], ['slot', 'Nyerőgép'], ['coin', 'Érmefeldobás']].forEach(function (x) {
            var b = el('button', 'el-choice', x[1]);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(casinoGame === x[0]));
            b.addEventListener('click', function () { if (casinoBusy) return; casinoGame = x[0]; casinoView = null; renderPanel(); });
            sw.appendChild(b);
        });
        box.appendChild(sw);

        var stage = el('div', 'el-item');
        stage.id = 'el-casino-stage';
        box.appendChild(stage);
        buildCasinoStage(stage);

        var tally = el('div', 'el-help');
        var netv = g.paid - g.wagered;
        tally.appendChild(document.createTextNode('Eddigi játékok: ' + g.plays + ' · tét összesen: ' + fF(g.wagered) + ' · nyeremény: ' + fF(g.paid) + ' · nettó: '));
        tally.appendChild(el('b', netv >= 0 ? 'plus' : 'minus', (netv >= 0 ? '+' : '−') + fF(Math.abs(netv))));
        box.appendChild(tally);
        var help = el('div', 'el-help', 'Ha a játék már nem öröm, segítséget kérhetsz: Magyarországon a Lelki Elsősegély Telefonszolgálat (116-123) mindig hívható.');
        box.appendChild(help);
        p.appendChild(box);
    }

    function betRow(stage, bets, handler) {
        var row = el('div', 'el-choices');
        row.style.justifyContent = 'center';
        bets.forEach(function (b) {
            var btn = actionBtn('Tét: ' + fF(b), function () { handler(b); }, { cost: b });
            row.appendChild(btn);
        });
        stage.appendChild(row);
    }

    function buildCasinoStage(stage) {
        clear(stage);
        var v = casinoView;
        if (casinoGame === 'scratch') {
            stage.appendChild(el('h4', '', 'Kaparós sorsjegy'));
            stage.appendChild(el('p', '', 'Három egyforma összeg = nyeremény. A mezők: ' + D.SCRATCH.outcomes.filter(function (o) { return o.mult > 0; }).map(function (o) { return o.mult + '×'; }).join(', ') + ' a tét.'));
            var grid = el('div', 'el-scratch');
            for (var i = 0; i < 6; i++) {
                var c = el('div', 'el-cell cover', '?');
                c.dataset.i = String(i);
                if (v && v.game === 'scratch') { c.className = 'el-cell' + (v.cells[i] === v.payout && v.payout > 0 ? ' win' : ''); c.textContent = grp(v.cells[i]); }
                grid.appendChild(c);
            }
            stage.appendChild(grid);
            stage.appendChild(resultLine(v));
            betRow(stage, D.SCRATCH.bets, playScratch);
        } else if (casinoGame === 'slot') {
            stage.appendChild(el('h4', '', 'Nyerőgép'));
            stage.appendChild(el('p', '', 'Három egyforma szimbólum nagy nyeremény, két egyforma ' + String(D.SLOT.pair).replace('.', ',') + '× a tét.'));
            var reels = el('div', 'el-reels');
            for (var r = 0; r < 3; r++) {
                var rl = el('div', 'el-reel');
                rl.dataset.r = String(r);
                rl.appendChild(symEl(v && v.game === 'slot' ? v.reels[r] : D.SLOT.symbols[r].id));
                reels.appendChild(rl);
            }
            stage.appendChild(reels);
            stage.appendChild(resultLine(v));
            var pay = el('div', 'el-chips');
            pay.style.justifyContent = 'center';
            D.SLOT.symbols.forEach(function (s2) { var ch = chip('3× ' + s2.id + ': ' + s2.triple + '×', ''); pay.appendChild(ch); });
            stage.appendChild(pay);
            betRow(stage, D.SLOT.bets, playSlot);
        } else {
            stage.appendChild(el('h4', '', 'Érmefeldobás'));
            stage.appendChild(el('p', '', 'Tippelj: ha eltalálod, duplázol. (' + pct(D.COIN.winP) + ' esély)'));
            var coin = el('div', 'el-coin', v && v.game === 'coin' ? v.face : '?');
            coin.id = 'el-coin';
            stage.appendChild(coin);
            stage.appendChild(resultLine(v));
            var pickRow = el('div', 'el-choices');
            pickRow.style.justifyContent = 'center';
            [['Fej', 'Fej'], ['Írás', 'Írás']].forEach(function (x) {
                var b = el('button', 'el-choice', 'Tippem: ' + x[0]);
                b.type = 'button';
                b.setAttribute('aria-pressed', String(coinPick === x[1]));
                b.addEventListener('click', function () { coinPick = x[1]; renderPanel(); });
                pickRow.appendChild(b);
            });
            stage.appendChild(pickRow);
            betRow(stage, D.COIN.bets, playCoin);
        }
    }
    var coinPick = 'Fej';

    function resultLine(v) {
        var r = el('div', 'el-result', '');
        r.id = 'el-result';
        if (v) {
            if (v.payout > v.bet) { r.className = 'el-result win'; r.textContent = 'Nyertél ' + fF(v.payout - v.bet) + '!'; }
            else if (v.payout === v.bet && v.bet > 0) { r.textContent = 'A tétet visszakaptad.'; }
            else if (v.payout > 0) { r.className = 'el-result lose'; r.textContent = 'Kaptál ' + fF(v.payout) + ' vissza, de összességében vesztettél.'; }
            else { r.className = 'el-result lose'; r.textContent = 'Most nem nyertél (' + fF(v.bet) + ').'; }
        }
        return r;
    }

    function startBet(bet, fn) {
        if (casinoBusy) return null;
        var pre = S.money;
        var r = fn();
        if (!r.ok) { toast(r.reason, 'bad'); return null; }
        casinoBusy = true;
        freezeMoney = pre - bet;
        return r;
    }
    function endBet(r) {
        freezeMoney = null;
        casinoBusy = false;
        casinoView = r;
        drainEvents();
        toastAchievements(E.checkAchievements(S));
        save();
        updateHud();
        renderPanel();
    }
    function setBusyUI() {
        var st = $('el-casino-stage');
        if (!st) return;
        Array.prototype.forEach.call(st.querySelectorAll('button'), function (b) { b.disabled = true; });
    }

    function playScratch(bet) {
        var r = startBet(bet, function () { return E.playScratch(S, bet); });
        if (!r) return;
        casinoView = null;
        var cells = document.querySelectorAll('#el-casino-stage .el-cell');
        setBusyUI();
        Array.prototype.forEach.call(cells, function (c) { c.className = 'el-cell cover'; c.textContent = '?'; });
        r.cells.forEach(function (val, i) {
            later(function () {
                var c = cells[i];
                if (!c) return;
                c.className = 'el-cell';
                c.textContent = grp(val);
            }, 250 + i * 220);
        });
        later(function () { endBet(r); }, 250 + 6 * 220 + 200);
    }

    function playSlot(bet) {
        var r = startBet(bet, function () { return E.playSlot(S, bet); });
        if (!r) return;
        casinoView = null;
        setBusyUI();
        var reels = document.querySelectorAll('#el-casino-stage .el-reel');
        var ids = D.SLOT.symbols.map(function (s2) { return s2.id; });
        var spin = setInterval(function () {
            Array.prototype.forEach.call(reels, function (rl) {
                if (rl.dataset.done) return;
                clear(rl);
                rl.classList.add('spin');
                rl.appendChild(symEl(pick(ids)));
            });
        }, 90);
        timers.push(spin);
        [0, 1, 2].forEach(function (i) {
            later(function () {
                var rl = reels[i];
                if (!rl) return;
                rl.dataset.done = '1';
                rl.classList.remove('spin');
                clear(rl);
                rl.appendChild(symEl(r.reels[i]));
            }, 600 + i * 350);
        });
        later(function () { clearInterval(spin); endBet(r); }, 600 + 3 * 350 + 150);
    }

    function playCoin(bet) {
        var r = startBet(bet, function () { return E.playCoin(S, bet); });
        if (!r) return;
        casinoView = null;
        setBusyUI();
        var coin = $('el-coin');
        coin.textContent = '?';
        coin.classList.add('flip');
        r.face = r.win ? coinPick : (coinPick === 'Fej' ? 'Írás' : 'Fej');
        later(function () { coin.classList.remove('flip'); coin.textContent = r.face; }, 600);
        later(function () { endBet(r); }, 1000);
    }

    // ---------- Élő frissítés (újraépítés nélkül) ----------
    function refreshAfford() {
        var nodes = document.querySelectorAll('#el-panel [data-cost]');
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            var have = n.dataset.cur === 'conf' ? S.conf : S.money;
            var cant = have < Number(n.dataset.cost);
            if (n.classList.contains('cant') !== cant) n.classList.toggle('cant', cant);
        }
    }
    function refreshLive() {
        var bars = document.querySelectorAll('#el-panel [data-skill-bar]');
        for (var i = 0; i < bars.length; i++) {
            var id = bars[i].dataset.skillBar;
            var lv = S.skills[id] || 0;
            var need = D.SKILL_COST[lv] || 1;
            bars[i].style.width = Math.min(100, ((S.skillProg[id] || 0) / need) * 100).toFixed(1) + '%';
        }
    }

    // =========================================================
    // ESEMÉNY-ABLAK
    // =========================================================
    var modalPrevFocus = null;
    function closeModal() { var h = $('el-modal-host'); clear(h); if (modalPrevFocus && modalPrevFocus.focus) { try { modalPrevFocus.focus(); } catch (e) { /* */ } } modalPrevFocus = null; }

    function openModal() {
        var v = E.eventView(S);
        if (!v) { S.event = null; return; }
        var host = $('el-modal-host');
        if (!modalPrevFocus) modalPrevFocus = document.activeElement;
        clear(host);
        var ov = el('div', 'el-overlay');
        var m = el('div', 'el-modal');
        m.setAttribute('role', 'dialog');
        m.setAttribute('aria-modal', 'true');
        m.setAttribute('aria-labelledby', 'el-modal-title');
        var art = el('div', 'el-modal-art');
        art.innerHTML = A.scene(v.art, Object.assign(currentView(), { uid: 'ev', fx: true, emood: v.mood || undefined, guest: v.guest || undefined, prop: v.prop || undefined }));
        m.appendChild(art);
        var body = el('div', 'el-modal-body');
        if (v.kicker) body.appendChild(el('div', 'el-kicker', v.kicker));
        var h = el('h2', '', v.title); h.id = 'el-modal-title';
        body.appendChild(h);
        String(v.text).split('\n').filter(Boolean).forEach(function (t) { body.appendChild(el('p', '', t)); });
        var first = null;
        if (v.result === null) {
            var opts = el('div', 'el-opts');
            v.choices.forEach(function (c) {
                var b = el('button', 'el-opt');
                b.type = 'button';
                b.appendChild(el('b', '', c.label));
                if (c.tip) b.appendChild(el('small', '', c.tip));
                if (c.check) {
                    var ck = el('small', 'el-check ' + (c.check.ok ? 'ok' : 'warn'), (c.check.ok ? '✓ Megvan hozzá az önbizalmad' : '⚠ Kevés az önbizalmad, valószínűleg nem sikerül') + ' (' + c.check.have + ' / ' + c.check.need + ')');
                    b.appendChild(ck);
                }
                if (!c.enabled) { b.disabled = true; b.classList.add('locked'); b.appendChild(el('small', 'el-lock', '🔒 ' + (c.reqText || 'Ez most nem elérhető.'))); }
                else if (!first) first = b;
                b.addEventListener('click', function () {
                    if (E.choose(S, c.index)) { drainEvents(); if (S.event.result === '' && !S.event.link) { finishEvent(); return; } save(); renderScene(false); updateHud(); openModal(); }
                });
                opts.appendChild(b);
            });
            body.appendChild(opts);
        } else {
            String(v.result).split('\n').filter(Boolean).forEach(function (t, i) {
                var b = el('div', 'el-result-box', t);
                if (i === 0) b.id = 'el-modal-result';
                body.appendChild(b);
            });
            if (v.link && v.link.href === D.DISCORD_URL) {
                var a = el('a', 'el-btn blue', v.link.label || 'Megnyitom a Discordot');
                a.href = D.DISCORD_URL;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.textDecoration = 'none';
                a.style.textAlign = 'center';
                body.appendChild(a);
            }
            var go = el('button', 'el-btn', 'Tovább');
            go.type = 'button';
            go.addEventListener('click', finishEvent);
            body.appendChild(go);
            first = go;
        }
        m.appendChild(body);
        ov.appendChild(m);
        host.appendChild(ov);
        m.addEventListener('keydown', trapTab);
        if (first) first.focus({ preventScroll: true });
        ov.scrollTop = 0;
    }
    function trapTab(e) {
        if (e.key === 'Escape' && $('el-modal-result')) { finishEvent(); return; }
        if (e.key !== 'Tab') return;
        var f = Array.prototype.filter.call(e.currentTarget.querySelectorAll('button:not(:disabled), a[href]'), function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var firstN = f[0], lastN = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstN) { e.preventDefault(); lastN.focus(); }
        else if (!e.shiftKey && document.activeElement === lastN) { e.preventDefault(); firstN.focus(); }
    }

    function finishEvent() {
        var fresh = E.closeEvent(S);
        closeModal();
        toastAchievements(fresh);
        drainEvents();
        save();
        if (S.ending) { showEnding(); return; }
        renderAll();
        updateSpeed();
    }

    // =========================================================
    // BEFEJEZÉS
    // =========================================================
    function showEnding() {
        stopLoop();
        closeModal();
        var d = E.derive(S);
        var v = Ev.endingView(S, E.ctx(S), d);
        show('el-game', false); show('el-intro', false); show('el-end', true);
        $('el-end-art').innerHTML = A.scene(v.art, Object.assign(currentView(), { mood: 'proud', scale: 1, uid: 'en' }));
        $('el-end-title').textContent = v.title;
        $('el-end-text').textContent = v.text;
        var epi = $('el-end-epi');
        clear(epi);
        v.epilogue.forEach(function (t) { epi.appendChild(el('li', '', t)); });
        var st = $('el-end-stats');
        clear(st);
        v.stats.forEach(function (x) {
            var box = el('div');
            box.appendChild(el('span', '', x[0]));
            box.appendChild(el('b', '', String(x[1])));
            st.appendChild(box);
        });
        var a = $('el-end-discord');
        a.href = D.DISCORD_URL;
        save();
        window.scrollTo({ top: 0 });
    }

    function shareText() {
        var v = Ev.endingView(S, E.ctx(S), E.derive(S));
        return 'Pasztell Életút: ' + S.name + ' története a(z) „' + v.title + '” véggel zárult 25 évesen. Próbáld ki te is: ' + location.origin + '/eletut.html';
    }

    // =========================================================
    // HUROK ÉS BEMENET
    // =========================================================
    function startLoop() {
        stopLoop();
        lastTs = performance.now();
        loopId = setInterval(frame, 200);
        saveId = setInterval(save, 8000);
    }
    function stopLoop() {
        if (loopId) clearInterval(loopId);
        if (saveId) clearInterval(saveId);
        loopId = saveId = null;
    }

    function frame() {
        if (!S) return;
        var now = performance.now();
        if (now > uiDirtyUntil && !E.sealOk(S)) { caught('console'); return; }
        frameBody();
        if (S) E.seal(S); // a keret végén: az eredmények, események is bekerülnek a pecsétbe
    }
    function frameBody() {
        var now = performance.now();
        var dt = (now - lastTs) / 1000;
        lastTs = now;
        E.tick(S, dt);
        drainEvents();
        if (S.ending) { toastAchievements(E.checkAchievements(S)); showEnding(); return; }
        if (S.event && !$('el-modal-host').firstChild) { openModal(); }
        if (S.month !== lastMonth) {
            lastMonth = S.month;
            toastAchievements(E.checkAchievements(S));
            panelNote = null;
            renderScene(false);
            if (!casinoBusy) renderPanel();
            save();
        }
        updateHud();
        renderScene(false);
    }

    function bindActions() {
        $('el-act-mirror').addEventListener('click', function () {
            if (!S || S.event || S.ending) return;
            var n = E.clickMirror(S);
            if (n > 0) { floatText('+' + f1(n), 'conf'); happyUntil = performance.now() + 900; }
            updateHud();
        });
        $('el-act-work').addEventListener('click', function () {
            if (!S || S.event || S.ending) return;
            var n = E.clickWork(S);
            if (n > 0) floatText('+' + grp(n) + ' Ft', 'money');
            else if (n === -1) floatText('Elfáradtál', 'bad');
            updateHud();
        });
        $('el-act-study').addEventListener('click', function () {
            if (!S || S.event || S.ending) return;
            var n = E.clickStudy(S);
            if (n > 0) { floatText('+' + f1(n), 'study'); drainEvents(); }
            else if (n === -2) { tab = 'tanulas'; buildTabs(); renderPanel(); toast('Először válassz egy képességet.', ''); }
            else if (n === -1) floatText('Elfáradtál', 'bad');
            updateHud();
        });
        $('el-end-again').addEventListener('click', function () { wipe(); S = null; showIntro(); });
        $('el-end-share').addEventListener('click', function () {
            var text = shareText();
            if (navigator.share) { navigator.share({ text: text }).catch(function () { /* mégse */ }); return; }
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Vágólapra másolva.', 'good'); }, function () { toast(text); });
            else toast(text);
        });
        $('el-view').addEventListener('click', function () { stageView = stageView === 'room' ? 'close' : (stageView === 'close' ? 'face' : 'room'); renderScene(true); });
        $('el-start').addEventListener('click', startNew);
        $('el-resume').addEventListener('click', resume);
        $('el-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') startNew(); });
        $('el-name').addEventListener('input', function () { draft.name = this.value; });
        document.addEventListener('visibilitychange', function () {
            if (!S) return;
            if (document.hidden) {
                if (!S.paused && !S.ending) { S.paused = true; autoPaused = true; }
                save();
            } else if (autoPaused) {
                autoPaused = false;
                S.paused = false;
                lastTs = performance.now();
                if (!$('el-game').hidden) updateSpeed();
            }
        });
        window.addEventListener('pagehide', save);
    }

    // ---------- Indulás ----------
    function boot() {
        document.body.insertAdjacentHTML('afterbegin', A.sprite());
        bindActions();
        showIntro();
    }

    // Hibakereséshez és teszteléshez
    window.MFSZ.ui = {
        state: function () { return S; },
        refresh: function () { if (S) { renderAll(); } },
        showEnding: function () { if (S) showEnding(); },
        setTab: function (t) { tab = t; buildTabs(); renderPanel(); }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
