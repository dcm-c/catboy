// =========================================================
// FEMBOY STARTER PACK - KARAKTÉRÉPÍTŐ JÁTÉK
//
// Szabályok: minden felszerelés-helyre (slot) egy tárgy mehet, a zsebpénz véges.
// A tárgyak statisztikákat adnak, bizonyos párosításokból kombó-bónusz lesz,
// a küldetések pedig különleges építéseket jutalmaznak. A kész karakter linkként megosztható.
// Az összes tartalom (tárgyak, kombók, küldetések) az alábbi adattáblákban szerkeszthető.
// =========================================================
(function () {
    'use strict';

    var BUDGET = 60000;          // Zsebpénz (Ft)
    var BAR_MAX = 60;            // ekkora érték tölti ki teljesen a sávot
    var STORAGE_KEY = 'mfsz-starterpack';

    // --- ADATOK -------------------------------------------------------------

    var STATS = [
        { id: 'cute', label: 'Cukiság', icon: '🎀' },
        { id: 'gamer', label: 'Gamer', icon: '🎮' },
        { id: 'code', label: 'Kód', icon: '💻' },
        { id: 'chaos', label: 'Káosz', icon: '⚡' },
        { id: 'chill', label: 'Nyugi', icon: '🫧' }
    ];

    var SLOTS = [
        { id: 'head', label: 'Fej', icon: '🎧' },
        { id: 'neck', label: 'Nyak', icon: '🎀' },
        { id: 'top', label: 'Felső', icon: '👕' },
        { id: 'bottom', label: 'Alsó', icon: '👗' },
        { id: 'feet', label: 'Láb', icon: '🧦' },
        { id: 'gear', label: 'Cucc', icon: '💻' },
        { id: 'fuel', label: 'Üzemanyag', icon: '⚡' },
        { id: 'buddy', label: 'Társ', icon: '🦈' },
        { id: 'room', label: 'Szoba', icon: '🏠' }
    ];

    // price: Ft | st: statisztikák | joke: az eredeti oldal poénja | tag: becenév-alkotáshoz
    var ITEMS = [
        { id: 'cicafules', slot: 'head', icon: '🎧', name: 'Cicafüles Fejhallgató', price: 8990, tag: 'Cicafüles',
          desc: 'Kizárólag RGB világítással szerelt változat. Aktiválja a belső gamer démont.',
          joke: 'Valorant Aim +20%', st: { cute: 8, gamer: 14, chaos: 2 } },
        { id: 'hajcsat', slot: 'head', icon: '🌸', name: 'Pasztell Hajcsat-kollekció', price: 1990, tag: 'Hajcsatos',
          desc: 'Tizenkét darab, mind más árnyalat. A frufru végre nem a szemedben van.',
          joke: 'Látótér +100%', st: { cute: 12, chill: 6 } },

        { id: 'choker', slot: 'neck', icon: '🎀', name: 'Taktikai Choker', price: 2490, tag: 'Chokeres',
          desc: 'Cuki bársony nyakörv csengővel. 2 oktávval megemeli a hangszínedet a hajnali Discord voice chatekben.',
          joke: 'Hangstabilitás +35%', st: { cute: 10, chill: 4 } },
        { id: 'sal', slot: 'neck', icon: '🧣', name: 'Szivárványsál', price: 3990, tag: 'Szivárványsálas',
          desc: 'Hosszabb, mint a határidőid. Nyáron is hordható, ha elég elszánt vagy.',
          joke: 'Büszkeség +50%', st: { cute: 6, chill: 10 } },

        { id: 'hoodie', slot: 'top', icon: '🧥', name: 'Oversized Pasztell Pulcsi', price: 9990, tag: 'Pulcsis',
          desc: 'Három mérettel nagyobb, a kézfejed sosem látja meg a napfényt.',
          joke: 'Kényelem +300%', st: { cute: 10, chill: 14 } },
        { id: 'kopeny', slot: 'top', icon: '🏳️‍🌈', name: 'Zászló-köpeny', price: 6990, tag: 'Zászlós',
          desc: 'Lobog. Hatásos. A bejárati ajtón be sem férsz tőle, de legalább látványos.',
          joke: 'Büszkeség +100%', st: { cute: 8, chaos: 8, chill: 4 } },

        { id: 'szoknya', slot: 'bottom', icon: '👗', name: 'Skót kockás szoknya', price: 7990, tag: 'Szoknyás',
          desc: 'A tökéletes aerodinamika és kényelem biztosítása érdekében, szigorúan SFW pörgésekhez.',
          joke: 'Flexibilitás +80%', st: { cute: 14, chaos: 6, chill: 4 } },
        { id: 'jogger', slot: 'bottom', icon: '👖', name: 'Pasztell Jogger', price: 5990, tag: 'Joggeres',
          desc: 'Gumis derék, zsebek, nulla kompromisszum. A home office hivatalos egyenruhája.',
          joke: 'Fotelből-kikelés -40%', st: { chill: 12, code: 4 } },

        { id: 'zokni', slot: 'feet', icon: '🧦', name: 'Programozó Zokni', price: 3490, tag: 'Zoknis',
          desc: 'Csíkos, combközépig érő verzió. Elengedhetetlen a memóriabiztonság megértéséhez.',
          joke: 'C++ kódolási sebesség +15%', st: { cute: 8, code: 14 } },
        { id: 'papucs', slot: 'feet', icon: '🐾', name: 'Cica-mancs Papucs', price: 4990, tag: 'Mancsos',
          desc: 'Minden lépésnél halk nyávogás. A szomszédok szerint a macskádat hallják.',
          joke: 'Lopakodás -100%', st: { cute: 10, chill: 8 } },

        { id: 'arch', slot: 'gear', icon: '🐧', name: 'Arch Linux OS', price: 0, tag: 'Arch-os',
          desc: '"I use Arch btw." Mert egy igazi szakszervezeti tag terminálból konfigurálja a drip-et.',
          joke: 'Heteroszexualitás -40%', st: { code: 18, chaos: 10 } },
        { id: 'kbd', slot: 'gear', icon: '⌨️', name: 'Rózsaszín Mechanikus Billentyűzet', price: 24990, tag: 'Kattogós',
          desc: 'Kék switchek, hallható a szomszéd szobában is. A kódod gyorsabb, a barátaid kevesebben lesznek.',
          joke: 'Szomszéd-idegesítés +100%', st: { code: 12, gamer: 10, cute: 6, chaos: 6 } },
        { id: 'gameboy', slot: 'gear', icon: '🎮', name: 'Retro Kézikonzol', price: 14990, tag: 'Retro',
          desc: 'Zsebben hordható nosztalgia. A pixelek ugyanúgy megnyugtatnak, mint tizenöt éve.',
          joke: 'Nosztalgia +9000', st: { gamer: 16, chill: 8 } },

        { id: 'monster', slot: 'fuel', icon: '⚡', name: 'Ultra White Monster', price: 590, tag: 'Monsteres',
          desc: 'A szent elixír. Hajnali 3-as voice chat és kódolás mellé alapértelmezett üzemanyag.',
          joke: 'Vesekő Speedrun +50%', st: { gamer: 8, code: 6, chaos: 14, chill: -8 } },
        { id: 'matcha', slot: 'fuel', icon: '🍵', name: 'Matcha Latte', price: 1490, tag: 'Matchás',
          desc: 'Zöld, habos, tiszteletreméltó. Aki ezt issza, az nem fog hajnalban doboztornyot építeni.',
          joke: 'Belső béke +25%', st: { chill: 14, cute: 6, chaos: -4 } },

        { id: 'blahaj', slot: 'buddy', icon: '🦈', name: 'IKEA Blåhaj', price: 12990, tag: 'Cápás',
          desc: 'A plüss cápa, aki valójában a szoba és az egész infrastruktúra főadminisztrátora.',
          joke: 'Szoba Uptime 99.9%', st: { cute: 10, chill: 18 } },
        { id: 'army', slot: 'buddy', icon: '🦈🦈🦈', name: 'Blåhaj Hadsereg', price: 44990, tag: 'Cápahadsereges',
          desc: 'Mert egyetlen plüsscápa nem képes elhárítani a külvilág teljes toxicitását. Öt darab felett teljes körű szobai adminisztrátornak számítasz.',
          joke: 'Mentális Pajzs +200%', st: { cute: 16, chill: 30, chaos: 10 } },
        { id: 'sun', slot: 'buddy', icon: '🦔', name: 'Cica-sün Plüss', price: 4990, tag: 'Sünis',
          desc: 'Nem cica, nem sün, mégis mindkettő. Ezt senki sem kérdezi meg tőled kétszer.',
          joke: 'Ölelhetőség +70%', st: { cute: 12, chill: 8 } },

        { id: 'dobozok', slot: 'room', icon: '🥫', name: 'Monsteres Doboz-Torony', price: 0, tag: 'Dobozos',
          desc: 'A szoba sarkában instabilan tornyosuló üres fémdobozok. Minél magasabb és veszélyesebb a piramis, annál tisztábban látod a hangokat.',
          joke: 'IT Diplomaközelség +50%', st: { chaos: 16, gamer: 4, chill: -4 } },
        { id: 'lava', slot: 'room', icon: '🔮', name: 'Lávalámpa', price: 4490, tag: 'Lámpás',
          desc: 'Buborékol és nem kér semmit. A legjobb szobatárs, akit vehetsz.',
          joke: 'Hangulat +80%', st: { chill: 14, cute: 6 } },
        { id: 'led', slot: 'room', icon: '✨', name: 'Fényfüzér (LED)', price: 2990, tag: 'Ragyogó',
          desc: 'A szoba egyik fele hirtelen "esztétikus". A másik fele a ruhakupac.',
          joke: 'Esztétika +40%', st: { cute: 10, chill: 8 } }
    ];

    // need: tárgyazonosítók; egy elem tömb is lehet ("ezek bármelyike")
    var COMBOS = [
        { id: 'archbtw', icon: '🐧', name: 'I use Arch, btw', need: ['arch', 'zokni'], bonus: { code: 10, cute: 6 }, text: 'A sztereotípia teljes.' },
        { id: 'devops', icon: '🌙', name: 'Hajnali 3-as DevOps', need: ['monster', ['blahaj', 'army'], 'kbd'], bonus: { code: 8, chaos: 8 }, text: 'A cápa őrzi a szervert.' },
        { id: 'streamer', icon: '📺', name: 'Cicafüles Streamer', need: ['cicafules', 'choker'], bonus: { cute: 10, gamer: 8 }, text: 'A chat szerint „vágd be a nyávogást".' },
        { id: 'pasztell', icon: '🌸', name: 'Teljes Pasztell', need: ['hajcsat', 'hoodie', 'jogger'], bonus: { cute: 10, chill: 10 }, text: 'Mint egy szivárvány, csak puhább.' },
        { id: 'kaosz', icon: '🥫', name: 'Káosz-tanya', need: ['dobozok', 'monster'], bonus: { chaos: 14 }, text: 'A piramis már a plafont súrolja.' },
        { id: 'skot', icon: '🏴', name: 'Skót Büszkeség', need: ['szoknya', 'kopeny'], bonus: { cute: 12, chaos: 4 }, text: 'Lobog a kockás, lobog a zászló.' },
        { id: 'gyujto', icon: '🦈', name: 'Cápa-Gyűjtő', need: ['army', ['lava', 'led']], bonus: { chill: 12, cute: 6 }, text: 'A szoba tényleg az óceán.' },
        { id: 'gamercica', icon: '🕹️', name: 'Gamer Cica', need: [['gameboy', 'kbd'], 'cicafules'], bonus: { gamer: 10 }, text: 'Headset a fülön, mancs a billentyűn.' },
        { id: 'zen', icon: '🧘', name: 'Zen Mester', need: ['matcha', 'lava', ['hoodie', 'jogger']], bonus: { chill: 16 }, text: 'A Discord értesítések nem érnek el hozzád.' }
    ];
    var FULL_SET_BONUS = { cute: 4, gamer: 4, code: 4, chaos: 4, chill: 4 };

    var QUESTS = [
        { id: 'sporolos', icon: '🐖', name: 'Spórolós Cica', text: 'Érj el legalább 100 OwO-t legfeljebb 20 000 Ft-ból.',
          test: function (c) { return c.score >= 100 && c.cost <= 20000; } },
        { id: 'teljes', icon: '🎒', name: 'Teljes Felszerelés', text: 'Töltsd ki mind a 9 helyet.',
          test: function (c) { return c.filled === SLOTS.length; } },
        { id: 'kaoszmagus', icon: '🌪️', name: 'Káosz-mágus', text: 'Káosz legalább 35, miközben a Nyugi legfeljebb 10.',
          test: function (c) { return c.stats.chaos >= 35 && c.stats.chill <= 10; } },
        { id: 'zenquest', icon: '🧘', name: 'Belső Béke', text: 'Érj el 60 Nyugit.',
          test: function (c) { return c.stats.chill >= 60; } },
        { id: 'kombovadasz', icon: '🔗', name: 'Kombó-vadász', text: 'Oldj fel 3 kombót egyetlen építésben.',
          test: function (c) { return c.combos.length >= 3; } },
        { id: 'legenda', icon: '🏆', name: 'Szakszervezeti Legenda', text: 'Érd el a legmagasabb rangot.',
          test: function (c) { return c.rankIndex === RANKS.length - 1; } }
    ];

    var RANKS = [
        { min: 0, title: 'Civilek szintje (Válassz felszerelést!)', color: '' },
        { min: 1, title: 'Gyanútlan Érdeklődő 🧐', color: 'gray' },
        { min: 50, title: 'Kezdő IT Hallgató / Junior Femboy 💻', color: 'var(--blue)' },
        { min: 110, title: 'Haladó Cuki Tisztségviselő 🏳️‍🌈🎀', color: 'var(--pink)' },
        { min: 170, title: 'Szakszervezeti Főcica 🐈', color: '#c77dff' },
        { min: 230, title: '🏆 LEGENDÁS ELIT SZAKSZERVEZETI ADMIN (100% Uptime) 🦈', color: 'gold' }
    ];

    var CLASSES = { cute: 'Cukiságbomba', gamer: 'Gamer Cica', code: 'Kód-Boszorkány', chaos: 'Káosz-Kobold', chill: 'Zen Cápapásztor' };
    var FACES = { none: '🐱', cute: '😽', gamer: '😼', code: '🐱‍💻', chaos: '🙀', chill: '😸' };

    // --- ÁLLAPOT ------------------------------------------------------------

    var itemById = {};
    ITEMS.forEach(function (item) { itemById[item.id] = item; });
    var slotById = {};
    SLOTS.forEach(function (slot) { slotById[slot.id] = slot; });

    var sel = {};                 // slotId -> itemId
    var progress = { done: [], best: 0 };
    var lastComboIds = [];
    var busy = false;             // a "meglepetés csomag" animációja alatt zárolt
    var $ = {};                   // gyakran használt elemek

    // --- SEGÉDEK ------------------------------------------------------------

    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; }
    function signed(n) { return (n > 0 ? '+' : '') + n; }
    function byId(id) { return document.getElementById(id); }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function loadProgress() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (saved && Array.isArray(saved.done)) {
                progress.done = saved.done.filter(function (id) { return QUESTS.some(function (q) { return q.id === id; }); });
                progress.best = Number(saved.best) || 0;
                return saved.build;
            }
        } catch (e) { /* nincs mentett állapot */ }
        return null;
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: progress.done, best: progress.best, build: buildIds() }));
        } catch (e) { /* privát mód: nem baj */ }
    }

    function buildIds() {
        return SLOTS.map(function (s) { return sel[s.id]; }).filter(Boolean);
    }

    function applyBuild(ids) {
        sel = {};
        (ids || []).forEach(function (id) {
            var item = itemById[id];
            if (item && !sel[item.slot]) sel[item.slot] = id;
        });
        // A hivatkozásban érkező építés se lépje túl a zsebpénzt
        while (costOf(sel) > BUDGET) {
            var priciest = null;
            Object.keys(sel).forEach(function (slotId) {
                if (!priciest || itemById[sel[slotId]].price > itemById[sel[priciest]].price) priciest = slotId;
            });
            delete sel[priciest];
        }
    }

    // --- SZÁMOLÁS -----------------------------------------------------------

    function costOf(s) {
        return Object.keys(s).reduce(function (sum, slotId) { return sum + itemById[s[slotId]].price; }, 0);
    }

    function activeCombos(s) {
        var chosen = {};
        Object.keys(s).forEach(function (slotId) { chosen[s[slotId]] = true; });
        return COMBOS.filter(function (combo) {
            return combo.need.every(function (req) {
                return Array.isArray(req) ? req.some(function (id) { return chosen[id]; }) : chosen[req];
            });
        });
    }

    function evaluate(s) {
        var stats = {};
        STATS.forEach(function (stat) { stats[stat.id] = 0; });
        Object.keys(s).forEach(function (slotId) {
            var st = itemById[s[slotId]].st;
            Object.keys(st).forEach(function (k) { stats[k] += st[k]; });
        });
        var combos = activeCombos(s);
        combos.forEach(function (combo) {
            Object.keys(combo.bonus).forEach(function (k) { stats[k] += combo.bonus[k]; });
        });
        var filled = Object.keys(s).length;
        if (filled === SLOTS.length) {
            Object.keys(FULL_SET_BONUS).forEach(function (k) { stats[k] += FULL_SET_BONUS[k]; });
        }

        var score = STATS.reduce(function (sum, stat) { return sum + Math.max(0, stats[stat.id]); }, 0);
        var rankIndex = 0;
        RANKS.forEach(function (rank, i) { if (score >= rank.min && (i > 0 || score === 0)) rankIndex = i; });
        if (score === 0) rankIndex = 0;

        // Karakterosztály: a legerősebb statisztika; ha minden érték magas és kiegyensúlyozott, külön osztály
        var top = null;
        STATS.forEach(function (stat) { if (top === null || stats[stat.id] > stats[top]) top = stat.id; });
        var minStat = Math.min.apply(null, STATS.map(function (stat) { return stats[stat.id]; }));
        var cls = score === 0 ? 'Civil' : (minStat >= 18 ? 'Kiegyensúlyozott Mindentudó' : CLASSES[top]);
        var face = score === 0 ? FACES.none : (minStat >= 18 ? '😻' : FACES[top]);

        // Becenév: a két legerősebb tárgy jelzője + osztály
        var tags = Object.keys(s).map(function (slotId) { return itemById[s[slotId]]; })
            .sort(function (a, b) {
                var pa = Object.keys(a.st).reduce(function (n, k) { return n + Math.max(0, a.st[k]); }, 0);
                var pb = Object.keys(b.st).reduce(function (n, k) { return n + Math.max(0, b.st[k]); }, 0);
                return pb - pa;
            })
            .slice(0, 2).map(function (item) { return item.tag; });
        var title = (tags.length ? tags.join(' ') + ' ' : '') + cls;

        return { stats: stats, combos: combos, filled: filled, cost: costOf(s), score: score, rankIndex: rankIndex, cls: cls, face: face, title: title };
    }

    // --- FELÉPÍTÉS ----------------------------------------------------------

    function buildShop() {
        var shop = byId('sp-shop');
        shop.textContent = '';
        SLOTS.forEach(function (slot) {
            var section = el('section', 'sp-slot mb-4');
            section.id = 'slot-' + slot.id;
            var h = el('h3', 'sp-slot-title');
            h.append(el('span', 'sp-slot-icon', slot.icon), document.createTextNode(' ' + slot.label + ' '), el('small', 'text-muted fw-normal', '– válassz egyet'));
            section.appendChild(h);

            var grid = el('div', 'row g-3');
            ITEMS.filter(function (item) { return item.slot === slot.id; }).forEach(function (item) {
                var col = el('div', 'col-12 col-sm-6 col-xl-' + (ITEMS.filter(function (i) { return i.slot === slot.id; }).length === 3 ? '4' : '6'));
                var btn = el('button', 'sp-item');
                btn.type = 'button';
                btn.dataset.item = item.id;
                btn.setAttribute('aria-pressed', 'false');

                var head = el('div', 'sp-item-head');
                head.append(el('span', 'sp-item-icon', item.icon), el('span', 'sp-item-name', item.name));
                var price = el('span', 'sp-price', item.price === 0 ? 'Ingyen' : fmt(item.price));
                var desc = el('p', 'sp-item-desc', item.desc);
                var joke = el('p', 'sp-item-joke', '„' + item.joke + '"');
                var chips = el('div', 'sp-chips');
                STATS.forEach(function (stat) {
                    var v = item.st[stat.id];
                    if (v) {
                        var chip = el('span', 'sp-chip ' + (v > 0 ? 'plus' : 'minus'), stat.icon + ' ' + signed(v));
                        chip.title = stat.label;
                        chips.appendChild(chip);
                    }
                });
                btn.append(head, price, desc, joke, chips);
                col.appendChild(btn);
                grid.appendChild(col);
            });
            section.appendChild(grid);
            shop.appendChild(section);
        });

        shop.addEventListener('click', function (e) {
            var btn = e.target.closest('.sp-item');
            if (btn && !busy) toggleItem(btn.dataset.item, btn);
        });
    }

    function buildSheetStatic() {
        var bars = byId('sp-bars');
        bars.textContent = '';
        STATS.forEach(function (stat) {
            var row = el('div', 'sp-bar-row');
            row.dataset.stat = stat.id;
            var label = el('span', 'sp-bar-label', stat.icon + ' ' + stat.label);
            var track = el('div', 'sp-bar-track');
            var fill = el('div', 'sp-bar-fill');
            track.appendChild(fill);
            var val = el('span', 'sp-bar-val', '0');
            row.append(label, track, val);
            bars.appendChild(row);
        });

        var slots = byId('sp-equip');
        slots.textContent = '';
        SLOTS.forEach(function (slot) {
            var cell = el('div', 'sp-equip-cell');
            cell.dataset.slot = slot.id;
            cell.title = slot.label;
            cell.append(el('span', 'sp-equip-emoji', slot.icon), el('small', 'sp-equip-label', slot.label));
            slots.appendChild(cell);
        });

        var quests = byId('sp-quests');
        quests.textContent = '';
        QUESTS.forEach(function (quest) {
            var li = el('li', 'sp-quest');
            li.dataset.quest = quest.id;
            var box = el('span', 'sp-quest-box', quest.icon);
            var body = el('span', 'sp-quest-body');
            body.append(el('strong', '', quest.name), el('small', 'd-block text-muted', quest.text));
            li.append(box, body);
            quests.appendChild(li);
        });
    }

    // --- MEGJELENÍTÉS -------------------------------------------------------

    function render(announce) {
        var result = evaluate(sel);
        var rank = RANKS[result.rankIndex];

        // Tárgykártyák
        var remaining = BUDGET - result.cost;
        document.querySelectorAll('.sp-item').forEach(function (btn) {
            var item = itemById[btn.dataset.item];
            var on = sel[item.slot] === item.id;
            var current = sel[item.slot] ? itemById[sel[item.slot]].price : 0;
            var afford = on || item.price - current <= remaining;
            btn.classList.toggle('selected', on);
            btn.classList.toggle('cant', !afford);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.title = afford ? '' : 'Nem fér bele a zsebpénzedbe';
        });

        // Pontszám, rang, név
        $.score.textContent = result.score + ' OwO';
        $.rank.textContent = rank.title;
        $.rank.style.color = rank.color || '';
        $.title.textContent = result.title;
        $.face.textContent = result.face;
        $.mobileScore.textContent = result.score + ' OwO';
        $.mobileMoney.textContent = fmt(remaining);

        // Zsebpénz
        $.money.textContent = fmt(remaining);
        $.moneyFill.style.width = Math.max(0, Math.min(100, remaining / BUDGET * 100)) + '%';
        $.moneyFill.parentNode.classList.toggle('low', remaining < BUDGET * 0.15);

        // Statisztikák
        STATS.forEach(function (stat) {
            var row = document.querySelector('.sp-bar-row[data-stat="' + stat.id + '"]');
            var v = result.stats[stat.id];
            row.querySelector('.sp-bar-fill').style.width = Math.max(0, Math.min(100, v / BAR_MAX * 100)) + '%';
            var val = row.querySelector('.sp-bar-val');
            val.textContent = v;
            val.classList.toggle('neg', v < 0);
        });

        // Felszerelés-helyek
        SLOTS.forEach(function (slot) {
            var cell = document.querySelector('.sp-equip-cell[data-slot="' + slot.id + '"]');
            var item = sel[slot.id] ? itemById[sel[slot.id]] : null;
            var emoji = cell.querySelector('.sp-equip-emoji');
            var next = item ? item.icon : slot.icon;
            if (emoji.textContent !== next) {
                emoji.textContent = next;
                if (item) { cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop'); }
            }
            cell.classList.toggle('filled', Boolean(item));
            cell.title = item ? slot.label + ': ' + item.name : slot.label;
        });
        $.avatar.classList.toggle('full', result.filled === SLOTS.length);

        // Kombók
        $.combos.textContent = '';
        if (result.combos.length === 0) {
            $.combos.appendChild(el('li', 'text-muted small', 'Még nincs kombó. Próbálj összepasszoló tárgyakat választani!'));
        }
        result.combos.forEach(function (combo) {
            var li = el('li', 'sp-combo');
            var bonus = Object.keys(combo.bonus).map(function (k) {
                return STATS.filter(function (st) { return st.id === k; })[0].icon + signed(combo.bonus[k]);
            }).join(' ');
            li.append(el('span', 'sp-combo-icon', combo.icon));
            var body = el('span', '');
            body.append(el('strong', '', combo.name + ' '), el('span', 'sp-chip plus', bonus), el('small', 'd-block text-muted', combo.text));
            li.appendChild(body);
            $.combos.appendChild(li);
        });
        if (result.filled === SLOTS.length) {
            var full = el('li', 'sp-combo');
            full.append(el('span', 'sp-combo-icon', '🎒'));
            var fullBody = el('span', '');
            fullBody.append(el('strong', '', 'Teljes Felszerelés '), el('span', 'sp-chip plus', 'mind +4'), el('small', 'd-block text-muted', 'Minden hely tele: minden statisztika nő.'));
            full.appendChild(fullBody);
            $.combos.appendChild(full);
        }

        // Új kombó? (csak akkor ünnepeljük, ha tényleg most oldódott fel)
        var ids = result.combos.map(function (c) { return c.id; });
        var fresh = result.combos.filter(function (c) { return lastComboIds.indexOf(c.id) === -1; });
        lastComboIds = ids;
        if (announce && fresh.length) {
            toast('🔗 Kombó feloldva: ' + fresh[0].name + '!');
            burst($.avatar, 8);
        }

        // Küldetések
        checkQuests(result, announce);
        QUESTS.forEach(function (quest) {
            var li = document.querySelector('.sp-quest[data-quest="' + quest.id + '"]');
            var done = progress.done.indexOf(quest.id) !== -1;
            li.classList.toggle('done', done);
            li.querySelector('.sp-quest-box').textContent = done ? '✅' : quest.icon;
        });
        $.questCount.textContent = progress.done.length + '/' + QUESTS.length;

        // Rekord
        if (result.score > progress.best) {
            var firstRecord = progress.best > 0;
            progress.best = result.score;
            if (announce && firstRecord && result.score >= 50) toast('🥇 Új egyéni rekord: ' + result.score + ' OwO!');
        }
        $.best.textContent = progress.best + ' OwO';

        updateHash();
        saveProgress();
        return result;
    }

    function checkQuests(result, announce) {
        var ctx = { stats: result.stats, cost: result.cost, score: result.score, filled: result.filled, combos: result.combos, rankIndex: result.rankIndex };
        QUESTS.forEach(function (quest) {
            if (progress.done.indexOf(quest.id) === -1 && result.filled > 0 && quest.test(ctx)) {
                progress.done.push(quest.id);
                if (announce) {
                    toast('🏅 Küldetés teljesítve: ' + quest.name + '!');
                    burst($.avatar, 14);
                }
            }
        });
    }

    function updateHash() {
        var ids = buildIds();
        try {
            history.replaceState(null, '', ids.length ? '#b=' + ids.join(',') : location.pathname + location.search);
        } catch (e) { /* file:// vagy sandbox */ }
    }

    // --- INTERAKCIÓ ---------------------------------------------------------

    function toggleItem(itemId, btn) {
        var item = itemById[itemId];
        if (!item) return;
        if (sel[item.slot] === itemId) {
            delete sel[item.slot];
        } else {
            var current = sel[item.slot] ? itemById[sel[item.slot]].price : 0;
            if (costOf(sel) - current + item.price > BUDGET) {
                if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); }
                toast('💸 Ez már nem fér bele a zsebpénzedbe!', true);
                return;
            }
            sel[item.slot] = itemId;
        }
        render(true);
    }

    function reset() {
        if (busy) return;
        sel = {};
        lastComboIds = [];
        render(false);
        toast('🧹 Tiszta lap! Kezdheted elölről.', true);
    }

    // Meglepetés csomag: véletlen építés, tárgyanként animálva
    function surprise() {
        if (busy) return;
        busy = true;
        $.root.classList.add('busy');
        sel = {};
        lastComboIds = [];
        render(false);

        var order = SLOTS.slice().sort(function () { return Math.random() - 0.5; });
        var step = 0;
        (function next() {
            if (step >= order.length) {
                busy = false;
                $.root.classList.remove('busy');
                var result = render(true);
                toast('🎲 Meglepetés csomag: ' + result.title + '!');
                return;
            }
            var slot = order[step++];
            var remaining = BUDGET - costOf(sel);
            var options = ITEMS.filter(function (item) { return item.slot === slot.id && item.price <= remaining; });
            if (options.length && Math.random() > 0.12) {
                sel[slot.id] = options[Math.floor(Math.random() * options.length)].id;
            }
            render(false);
            setTimeout(next, 130);
        })();
    }

    function shareText() {
        var result = evaluate(sel);
        return 'Az én Femboy Starter Packem: ' + result.title + ' – ' + result.score + ' OwO (' + fmt(result.cost) + ')\n' + location.href;
    }

    function share() {
        if (buildIds().length === 0) { toast('🛍️ Előbb válassz ki néhány tárgyat!', true); return; }
        var text = shareText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
                function () { toast('📋 Link és eredmény a vágólapra másolva!', true); },
                function () { window.prompt('Másold ki az eredményed:', text); }
            );
        } else {
            window.prompt('Másold ki az eredményed:', text);
        }
    }

    // --- ÉRTESÍTÉS ÉS KONFETTI ----------------------------------------------

    // Értesítések: egyszerre egy látszik. A sürgős (pl. "nem fér bele") azonnal megjelenik és törli a sort,
    // a többi (kombó, küldetés, rekord) sorban követi egymást, így egyik sem nyeli el a másikat.
    var toastQueue = [];
    var toastTimer = null;
    var toastShowing = false;
    var TOAST_MS = 2300;

    function showNextToast() {
        if (toastQueue.length === 0) {
            toastShowing = false;
            $.toast.classList.remove('show');
            return;
        }
        toastShowing = true;
        $.toast.textContent = toastQueue.shift();
        $.toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(showNextToast, TOAST_MS);
    }

    function toast(message, urgent) {
        if (urgent) toastQueue = [];
        toastQueue.push(message);
        if (urgent || !toastShowing) showNextToast();
    }

    // A konfetti a témamotor .buzi-particle animációját használja
    function burst(anchor, count) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var rect = anchor.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var symbols = ['✨', '💖', '🩷', '💙', '⭐', '🦈', '🎀'];
        for (var i = 0; i < count; i++) {
            var p = el('span', 'buzi-particle', symbols[Math.floor(Math.random() * symbols.length)]);
            var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            var dist = 50 + Math.random() * 70;
            p.setAttribute('aria-hidden', 'true');
            p.style.left = cx + 'px';
            p.style.top = cy + 'px';
            p.style.fontSize = (16 + Math.random() * 14) + 'px';
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            p.style.setProperty('--rot', (Math.random() - 0.5) * 360 + 'deg');
            p.style.animationDuration = (700 + Math.random() * 500) + 'ms';
            p.addEventListener('animationend', function (ev) { ev.target.remove(); });
            document.body.appendChild(p);
        }
    }

    // --- INDULÁS ------------------------------------------------------------

    function init() {
        $.root = byId('sp-root');
        if (!$.root) return;
        ['score', 'rank', 'title', 'face', 'money', 'best', 'toast', 'avatar', 'combos'].forEach(function (id) { $[id] = byId('sp-' + id); });
        $.moneyFill = byId('sp-money-fill');
        $.questCount = byId('sp-quest-count');
        $.mobileScore = byId('sp-mobile-score');
        $.mobileMoney = byId('sp-mobile-money');

        buildShop();
        buildSheetStatic();

        var saved = loadProgress();
        var fromHash = /[#&]b=([a-z0-9,]*)/.exec(location.hash);
        var shared = Boolean(fromHash && fromHash[1]);
        applyBuild(shared ? fromHash[1].split(',') : saved);
        lastComboIds = activeCombos(sel).map(function (c) { return c.id; }); // betöltéskor ne ünnepeljünk
        render(false);
        if (shared) toast('🔗 Megosztott karakter betöltve!');

        byId('sp-surprise').addEventListener('click', surprise);
        byId('sp-reset').addEventListener('click', reset);
        byId('sp-share').addEventListener('click', share);
        byId('sp-mobile-bar').addEventListener('click', function () { byId('sp-sheet').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

        // Egy másik lapról érkező hash-váltás (visszagomb, kézzel átírt link) is frissítse a karaktert
        window.addEventListener('hashchange', function () {
            var m = /[#&]b=([a-z0-9,]*)/.exec(location.hash);
            if (m && m[1] !== buildIds().join(',')) {
                applyBuild(m[1].split(','));
                lastComboIds = activeCombos(sel).map(function (c) { return c.id; });
                render(false);
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Tesztekhez és a konzolból való kísérletezéshez
    window.StarterPack = { ITEMS: ITEMS, SLOTS: SLOTS, STATS: STATS, COMBOS: COMBOS, QUESTS: QUESTS, RANKS: RANKS, BUDGET: BUDGET, evaluate: evaluate };
})();
