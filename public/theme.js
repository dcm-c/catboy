// =========================================================
// TÉMAVÁLTÓ: Világos / Sötét / Buzi mód
//
// Ezt a fájlt a <head>-ben, szinkron kell betölteni, hogy a megfelelő téma már
// az első kirajzolás előtt beálljon (különben látszana a világos villanás).
// A téma a <html data-theme="..."> attribútumban él, a Bootstrap saját
// színmódját a data-bs-theme kapcsolja (a buzi mód sötét alapra épül).
// =========================================================
(function () {
    'use strict';

    // A megjelenő neveket itt lehet átírni, a kódban sehol máshol nem szerepelnek.
    var THEMES = [
        { id: 'light', label: 'Világos', icon: '☀️', color: '#f5a9b8' },
        { id: 'dark', label: 'Sötét', icon: '🌙', color: '#15111f' },
        { id: 'buzi', label: 'Buzi mód', icon: '🏳️‍🌈', color: '#1a0f2e' }
    ];
    var STORAGE_KEY = 'mfsz-theme';
    var root = document.documentElement;
    var current = null;
    var userChose = false;

    function find(id) {
        for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
        return null;
    }

    function readStored() {
        try {
            var value = localStorage.getItem(STORAGE_KEY);
            return find(value) ? value : null;
        } catch (e) { return null; }
    }

    function store(id) {
        try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* privát mód: nem baj */ }
    }

    function systemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // --- Megjelenés frissítése ---
    function updateMetaColor(theme) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta && document.head) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        if (meta) meta.setAttribute('content', theme.color);
    }

    // A Discord-widget témája az URL-ben van, ezért az iframe a HTML-ben csak data-discord-src-t kap,
    // a tényleges src-t innen állítjuk be (így nem töltődik be előbb a rossz témájú változat).
    function updateDiscordWidget(id) {
        var frames = document.querySelectorAll('iframe[data-discord-src]');
        var wanted = id === 'light' ? 'light' : 'dark';
        for (var i = 0; i < frames.length; i++) {
            var next = frames[i].getAttribute('data-discord-src').replace(/theme=(light|dark)/, 'theme=' + wanted);
            if (frames[i].getAttribute('src') !== next) frames[i].setAttribute('src', next);
        }
    }

    function syncToggles() {
        var theme = find(current);
        if (!theme) return;
        var next = find(nextTheme());
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var icon = btn.querySelector('.theme-toggle-icon');
            var label = btn.querySelector('.theme-toggle-label');
            if (icon) icon.textContent = theme.icon;
            if (label) label.textContent = theme.label;
            btn.setAttribute('aria-label', 'Téma váltása (most: ' + theme.label + ', következő: ' + next.label + ')');
            btn.setAttribute('title', 'Téma: ' + theme.label + ' → ' + next.label);
        }
        var uwuBtn = document.getElementById('btn-uwu-mode');
        if (uwuBtn) uwuBtn.setAttribute('aria-pressed', current === 'buzi' ? 'true' : 'false');
    }

    function apply(id) {
        var theme = find(id) || find('light');
        current = theme.id;
        root.setAttribute('data-theme', theme.id);
        root.setAttribute('data-bs-theme', theme.id === 'light' ? 'light' : 'dark');
        updateMetaColor(theme);
        updateDiscordWidget(theme.id);
        syncToggles();
        setEffects(theme.id === 'buzi');
        setUwu(theme.id === 'buzi');
        try {
            document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme.id } }));
        } catch (e) { /* régi böngésző */ }
    }

    function set(id, persist) {
        // Rövid, sima átmenet a váltás idejére (csak kézi váltásnál, betöltéskor nem).
        if (persist) {
            root.classList.add('theme-transition');
            setTimeout(function () { root.classList.remove('theme-transition'); }, 450);
        }
        apply(id);
        if (persist) { userChose = true; store(current); }
    }

    // A navigációs gomb csak a világos és a sötét téma között vált. A buzi módot kizárólag a lábléc UwU gombja
    // kapcsolja be; a navigációs gombbal csak kilépni lehet belőle.
    var beforeBuzi = null; // az UwU gombbal kilépéskor ide térünk vissza
    function nextTheme() {
        if (current === 'buzi') return beforeBuzi && beforeBuzi !== 'buzi' ? beforeBuzi : systemTheme();
        return current === 'light' ? 'dark' : 'light';
    }

    function cycle() {
        set(nextTheme(), true);
    }

    // --- UwU szövegmód: a Buzi mód része. Visszafordítható (az eredeti szövegek megmaradnak),
    //     és az utólag beillesztett tartalmat (navbar, galéria) is átírja. ---
    // Az átalakítás logikája az uwu.js-ben van (tiszta, tesztelt függvények); ha az nem töltődött be, a szöveg marad.
    var UWU_SKIP = 'script, style, noscript, iframe, textarea, input, select, option, code, pre, time, [data-no-uwu]';
    var uwuOn = false;
    var uwuOriginals = new Map(); // szövegcsomópont -> eredeti szöveg
    var uwuObserver = null;

    function uwuify(text) {
        return window.MFSZUwu ? window.MFSZUwu.uwuify(text) : text;
    }

    function uwuNode(node) {
        if (uwuOriginals.has(node) || !node.nodeValue || !node.nodeValue.trim()) return;
        var parent = node.parentElement;
        if (!parent || parent.closest(UWU_SKIP)) return;
        uwuOriginals.set(node, node.nodeValue);
        node.nodeValue = uwuify(node.nodeValue);
    }

    function uwuTree(root) {
        if (root.nodeType === 3) { uwuNode(root); return; }
        if (root.nodeType !== 1) return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) uwuNode(node);
    }

    function setUwu(on) {
        if (!document.body || on === uwuOn) return; // a body még nincs meg: a DOMContentLoaded újrahívja
        uwuOn = on;
        if (on) {
            uwuTree(document.body);
            uwuObserver = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) uwuTree(added[j]);
                }
            });
            uwuObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            if (uwuObserver) { uwuObserver.disconnect(); uwuObserver = null; }
            uwuOriginals.forEach(function (original, node) {
                if (node.isConnected) node.nodeValue = original;
            });
            uwuOriginals.clear();
        }
    }

    // --- Buzi mód extrák: csillámos egérnyom és konfetti kattintásra ---
    var effectsOn = false;
    var lastSpark = 0;
    var liveParticles = 0;
    var MAX_PARTICLES = 40;
    var SPARKS = ['✨', '💖', '🩷', '💙', '⭐', '🌈', '💜'];

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function particle(x, y, opts) {
        if (liveParticles >= MAX_PARTICLES || !document.body) return;
        var el = document.createElement('span');
        el.className = 'buzi-particle';
        el.setAttribute('aria-hidden', 'true');
        el.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.fontSize = opts.size + 'px';
        el.style.setProperty('--dx', opts.dx + 'px');
        el.style.setProperty('--dy', opts.dy + 'px');
        el.style.setProperty('--rot', opts.rot + 'deg');
        el.style.animationDuration = opts.ms + 'ms';
        liveParticles++;
        var done = function () { if (el.parentNode) el.parentNode.removeChild(el); liveParticles--; };
        el.addEventListener('animationend', done);
        setTimeout(function () { if (el.parentNode) done(); }, opts.ms + 300); // biztonsági takarítás
        document.body.appendChild(el);
    }

    function onPointerMove(e) {
        if (e.pointerType !== 'mouse') return;
        var now = Date.now();
        if (now - lastSpark < 45) return;
        lastSpark = now;
        particle(e.clientX, e.clientY, {
            size: 10 + Math.random() * 10,
            dx: (Math.random() - 0.5) * 40,
            dy: 20 + Math.random() * 30,
            rot: (Math.random() - 0.5) * 120,
            ms: 700 + Math.random() * 400
        });
    }

    function onPointerDown(e) {
        for (var i = 0; i < 10; i++) {
            var angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
            var dist = 50 + Math.random() * 60;
            particle(e.clientX, e.clientY, {
                size: 14 + Math.random() * 12,
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist,
                rot: (Math.random() - 0.5) * 360,
                ms: 600 + Math.random() * 500
            });
        }
    }

    function setEffects(on) {
        on = on && !prefersReducedMotion();
        if (on === effectsOn) return;
        effectsOn = on;
        if (on) {
            document.addEventListener('pointermove', onPointerMove, { passive: true });
            document.addEventListener('pointerdown', onPointerDown, { passive: true });
        } else {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerdown', onPointerDown);
        }
    }

    // --- Indulás ---
    var stored = readStored();
    userChose = stored !== null;
    apply(stored || systemTheme());

    // A kapcsoló a navbarban él, amit később töltünk be, ezért eseménydelegálás kell.
    document.addEventListener('click', function (e) {
        if (!e.target.closest) return;
        if (e.target.closest('[data-theme-toggle]')) {
            e.preventDefault();
            cycle();
        } else if (e.target.closest('#btn-uwu-mode')) {
            if (current === 'buzi') {
                set(beforeBuzi && beforeBuzi !== 'buzi' ? beforeBuzi : systemTheme(), true);
            } else {
                beforeBuzi = current;
                set('buzi', true);
            }
        }
    });

    // Ha a látogató még nem választott, kövessük a rendszer témáját.
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onSystemChange = function () { if (!userChose) apply(systemTheme()); };
        if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
        else if (mq.addListener) mq.addListener(onSystemChange);
    }

    // A lapon a Discord-widget és a kapcsolók a DOM felépülése után kerülnek elő.
    document.addEventListener('DOMContentLoaded', function () {
        updateDiscordWidget(current);
        syncToggles();
        setUwu(current === 'buzi');
    });

    window.MFSZTheme = {
        themes: THEMES,
        get: function () { return current; },
        set: function (id) { set(id, true); },
        sync: syncToggles // a navbar beszúrása után hívjuk
    };
})();
