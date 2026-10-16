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
    var draft = { name: '', hairStyle: 'bob', hairColor: 'rozsa', skin: 's2' };

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
                if (f.type === 'skill') {
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
        var hs = $('el-hs'), hc = $('el-hc'), sk = $('el-sk');
        clear(hs); clear(hc); clear(sk);
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
        $('el-preview').innerHTML = A.portrait({ skin: draft.skin, hairStyle: draft.hairStyle, hairColor: draft.hairColor, outfit: {}, mood: 'happy', uid: 'cr' });
    }

    function showIntro() {
        stopLoop();
        closeModal();
        show('el-game', false); show('el-end', false); show('el-intro', true);
        var saved = load();
        var r = $('el-resume');
        if (saved) {
            r.hidden = false;
            r.textContent = 'Folytatom: ' + saved.name + ', ' + E.ageYears(saved) + ' évesen';
        } else r.hidden = true;
        buildCreator();
    }

    function startNew() {
        draft.name = $('el-name').value;
        S = E.newState(draft);
        S.paused = false;
        E.showEvent(S, Ev.find('ch1'));
        lastMonth = -1; lastSceneSig = ''; panelNote = null; tab = 'szekreny'; casinoView = null; freezeMoney = null; casinoBusy = false;
        save();
        enterGame();
    }

    function resume() {
        var saved = load();
        if (!saved) { showIntro(); return; }
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
        [['pause', 0, 'Szünet'], ['1', 1, '1× sebesség'], ['2', 2, '2× sebesség'], ['4', 4, '4× sebesség']].forEach(function (d) {
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
        var sv = $('el-menu-save'), nw = $('el-menu-new');
        clear(sv); clear(nw);
        sv.appendChild(icon('save')); nw.appendChild(icon('trash'));
        if (!sv.dataset.bound) {
            sv.dataset.bound = '1';
            sv.addEventListener('click', function () { save(); toast('Elmentve.', 'good'); });
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
        setText(c.energy.v, Math.floor(S.energy) + '/100', c.energy.last, 'v');
        c.energy.fill.style.width = S.energy.toFixed(1) + '%';
        setText(c.energy.sub, '+' + f1(d.regen) + '/mp', c.energy.last, 's');
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
        $('el-scene').innerHTML = stageView === 'close' ? A.closeup(v) : A.room(v);
        var vb = $('el-view');
        clear(vb);
        vb.appendChild(icon(stageView === 'close' ? 'house' : 'eye'));
        vb.appendChild(el('span', '', stageView === 'close' ? 'Szoba' : 'Közelkép'));
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

    // ---------- Fülek ----------
    var tabsHasCasino = false;
    var TABS = [
        ['szekreny', 'shirt', 'Szekrény'], ['szoba', 'sparkle', 'Szoba'], ['gep', 'monitor', 'Gép'], ['tanulas', 'book', 'Tanulás'],
        ['munka', 'briefcase', 'Munka'], ['lakas', 'house', 'Lakás'], ['lepesek', 'star', 'Merész lépések'], ['elmenyek', 'gift', 'Élmények'],
        ['kaszino', 'dice', 'Kaszinó'], ['naplo', 'calendar', 'Napló'], ['eredmenyek', 'trophy', 'Eredmények']
    ];
    function buildTabs() {
        var host = $('el-tabs');
        clear(host);
        tabsHasCasino = E.ageFloat(S) >= D.CASINO_MIN_AGE;
        TABS.forEach(function (t) {
            if (t[0] === 'kaszino' && !tabsHasCasino) return;
            var b = el('button', 'el-tab');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', String(tab === t[0]));
            b.appendChild(icon(t[1]));
            b.appendChild(el('span', '', t[2]));
            b.addEventListener('click', function () { tab = t[0]; panelNote = null; casinoView = null; buildTabs(); renderPanel(); });
            host.appendChild(b);
        });
        if (tab === 'kaszino' && !tabsHasCasino) tab = 'szekreny';
    }

    function renderAll() {
        updateHud();
        renderScene(true);
        renderPanel();
    }

    // ---------- Panel építők ----------
    function chip(text, cls) { return el('span', 'el-chip' + (cls ? ' ' + cls : ''), text); }
    function itemCard(opts) {
        var c = el('div', 'el-item' + (opts.owned ? ' owned' : '') + (opts.worn ? ' worn' : ''));
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
        var fn = { szekreny: pWardrobe, szoba: pRoom, gep: pComputer, tanulas: pStudy, munka: pJobs, lakas: pHousing, lepesek: pSteps, elmenyek: pExp, kaszino: pCasino, naplo: pLog, eredmenyek: pAch }[tab];
        if (fn) fn(p);
        p.scrollTop = scroll;
        refreshAfford();
    }

    // --- Szekrény ---
    function pWardrobe(p) {
        var secret = E.isSecret(S);
        if (secret) {
            var box = el('div', 'el-item');
            box.appendChild(el('h4', '', 'Titkolózás'));
            box.appendChild(el('p', '', 'Amíg a szüleidnél laksz, a ruháid kockázatot jelentenek (Titok mérő). Ha elrejted őket, nincs kockázat, de a hatásuk csak 40%.'));
            box.appendChild(actionBtn(S.hiding ? 'Rejtőzködés: BE · előveszem őket' : 'Rejtőzködés: KI · elrejtem őket', act(function () { E.toggleHiding(S); }), { cls: S.hiding ? '' : 'alt' }));
            p.appendChild(box);
            p.appendChild(sectionTitle('Rejtekhelyek'));
            var g = el('div', 'el-grid');
            D.HIDEOUT.forEach(function (h) {
                var owned = !!S.hideout[h.id];
                g.appendChild(itemCard({
                    title: h.name, desc: h.desc, owned: owned, chips: [['Titok −' + h.decay + '/hó', 'plus']],
                    btn: owned ? el('div', 'el-note', 'Megvan ✓') : actionBtn('Megcsinálom · ' + fF(h.cost), act(function () { reportResult(E.buyHideout(S, h.id)); }), { cost: h.cost })
                }));
            });
            p.appendChild(g);
        }
        D.SLOTS.forEach(function (slot) {
            p.appendChild(sectionTitle(slot.label));
            var g2 = el('div', 'el-grid');
            D.ITEMS.filter(function (i) { return i.slot === slot.id; }).forEach(function (it) {
                var owned = !!S.items[it.id];
                var worn = S.equipped[slot.id] === it.id;
                var chips = [];
                if (it.click) chips.push(['+' + f1(it.click) + ' kattintás', 'plus']);
                if (it.passive) chips.push(['+' + f1(it.passive) + '/mp', 'plus']);
                if (secret && it.risk) chips.push(['Titok +' + it.risk, 'minus']);
                var price = E.price(S, it.cost);
                var btn;
                if (!owned) btn = actionBtn('Megveszem · ' + fF(price), act(function () {
                    var r = E.buyItem(S, it.id);
                    if (reportResult(r) && it.notes && it.notes.length) { var n = pick(it.notes); toast(n.text, n.tone === 'bad' ? 'bad' : n.tone === 'funny' ? 'funny' : 'good'); }
                }), { cost: price });
                else btn = actionBtn(worn ? 'Viselem ✓ (levesz)' : 'Felveszem', act(function () { E.equip(S, slot.id, worn ? null : it.id); }), { cls: worn ? 'alt' : 'blue' });
                g2.appendChild(itemCard({ title: it.name, desc: it.desc, owned: owned, worn: worn, chips: chips, btn: btn }));
            });
            p.appendChild(g2);
        });
    }

    // --- Szoba ---
    function pRoom(p) {
        p.appendChild(sectionTitle('Dekoráció'));
        var g = el('div', 'el-grid');
        D.DECOR.forEach(function (d) {
            var owned = !!S.decor[d.id];
            var chips = [];
            if (d.click) chips.push(['+' + f1(d.click) + ' kattintás', 'plus']);
            if (d.passive) chips.push(['+' + f1(d.passive) + '/mp', 'plus']);
            if (d.regen) chips.push(['energia +' + f1(d.regen) + '/mp', 'plus']);
            var price = E.price(S, d.cost);
            g.appendChild(itemCard({
                title: d.name, desc: d.desc, owned: owned, chips: chips,
                btn: owned ? el('div', 'el-note', 'A szobádban van ✓') : actionBtn('Megveszem · ' + fF(price), act(function () { reportResult(E.buyDecor(S, d.id)); }), { cost: price })
            }));
        });
        p.appendChild(g);
        p.appendChild(sectionTitle('Társ'));
        var g2 = el('div', 'el-grid');
        D.PETS.forEach(function (pt) {
            var owned = !!S.pets[pt.id];
            var homeOk = pt.needsHome.indexOf(S.housing) >= 0;
            g2.appendChild(itemCard({
                title: pt.name, desc: pt.desc, owned: owned, chips: [['+' + f1(pt.passive) + '/mp', 'plus'], ['energia +' + f1(pt.regen) + '/mp', 'plus']],
                note: homeOk || owned ? '' : 'Ehhez saját albérlet vagy lakás kell.',
                btn: owned ? el('div', 'el-note', 'A tiéd ✓') : actionBtn('Örökbe fogadom · ' + fF(pt.cost), act(function () { reportResult(E.buyPet(S, pt.id)); }), { cost: pt.cost })
            }));
        });
        p.appendChild(g2);
    }

    // --- Gép ---
    function pComputer(p) {
        var d = E.derive(S);
        var c = D.COMPUTERS[S.comp];
        var cur = el('div', 'el-item owned');
        cur.appendChild(el('h4', '', 'A géped: ' + c.name));
        cur.appendChild(el('p', '', c.desc));
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
            if (j.minAge) need.push(j.minAge + '+ év');
            if (need.length) chips.push(['Kell: ' + need.join(', '), '']);
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
        art.innerHTML = A.scene(v.art, Object.assign(currentView(), { uid: 'ev' }));
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
                if (!c.enabled) { b.disabled = true; b.appendChild(el('small', '', c.reqText || 'Ez most nem elérhető.')); }
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
        $('el-view').addEventListener('click', function () { stageView = stageView === 'close' ? 'room' : 'close'; renderScene(true); });
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
