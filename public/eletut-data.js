// =========================================================
// PASZTELL ÉLETÚT - játéktartalom (adatok)
//
// Csak táblázatok: tárgyak, képességek, munkák, lakások, kaszinó. Az események és a
// befejezések az eletut-events.js-ben vannak. Egy új tárgy felvétele ide, egy sor.
// A fájl böngészőben és Node-ban (tesztekhez) is betöltődik.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};

    var D = M.data = {};

    D.START_AGE = 14;
    D.END_AGE = 25;
    D.MONTHS = (D.END_AGE - D.START_AGE) * 12; // 132 hónap
    D.MONTH_SECONDS = 15;                      // 1x sebességnél ennyi másodperc egy játékhónap
    D.START_CALENDAR_MONTH = 8;                // szeptember
    D.MONTH_NAMES = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    D.DISCORD_URL = 'https://discord.gg/ArqcMnGnsu';
    D.SAVE_KEY = 'mfsz-eletut-v1';

    // ---------- Karakterkészítő ----------
    D.HAIR_STYLES = [
        { id: 'rovid', label: 'Rövid' },
        { id: 'bob', label: 'Bob' },
        { id: 'hosszu', label: 'Hosszú' }
    ];
    D.HAIR_COLORS = [
        { id: 'rozsa', label: 'Rózsaszín', color: '#f4a3b8' },
        { id: 'kek', label: 'Égkék', color: '#5bcefa' },
        { id: 'feher', label: 'Hófehér', color: '#f1eef8' },
        { id: 'fekete', label: 'Fekete', color: '#2e2736' },
        { id: 'lila', label: 'Orgona', color: '#a285dc' },
        { id: 'barna', label: 'Barna', color: '#7b4e36' },
        { id: 'szoke', label: 'Szőke', color: '#e8c468' }
    ];
    D.SKINS = [
        { id: 's1', label: 'Világos', color: '#fbdcc8' },
        { id: 's2', label: 'Meleg', color: '#efc09d' },
        { id: 's3', label: 'Barnás', color: '#c98f65' },
        { id: 's4', label: 'Mély', color: '#8a5a3c' }
    ];

    // ---------- Szekrény ----------
    // click: +Önbizalom egy tükörkattintásra, passive: +Önbizalom/mp, risk: lebukási kockázat (csak titkolózás alatt).
    // notes: mások megjegyzései (a véletlen "észrevették rajtad" esemény ezekből dolgozik).
    // wear: az avatáron látszik (és a "mi van rajtad" szövegekben szerepel); a többi a szobában / a táskádban van.
    D.SLOTS = [
        { id: 'hair', label: 'Haj', icon: 'hair', wear: true },
        { id: 'top', label: 'Felső', icon: 'top', wear: true },
        { id: 'bottom', label: 'Alsó', icon: 'bottom', wear: true },
        { id: 'legs', label: 'Lábszár', icon: 'legs', wear: true },
        { id: 'shoes', label: 'Cipő', icon: 'shoes', wear: true },
        { id: 'neck', label: 'Nyak', icon: 'neck', wear: true },
        { id: 'back', label: 'Hátul', icon: 'back', wear: true },
        { id: 'face', label: 'Arc', icon: 'face', wear: true },
        { id: 'cosplay', label: 'Jelmez', icon: 'mask', wear: true },
        { id: 'gear', label: 'Cucc', icon: 'gear', wear: false },
        { id: 'drink', label: 'Üzemanyag', icon: 'drink', wear: false },
        { id: 'buddy', label: 'Plüss', icon: 'buddy', wear: false }
    ];

    // ---------- Statisztikák (a régi Starter Pack mintájára) ----------
    // Minden tárgy ad pontokat; a pontok játékhatást is adnak (lásd STAT_EFFECTS), a kombók pedig plusz pontokat.
    D.STATS = [
        { id: 'cute', label: 'Cukiság', icon: 'heart', effect: 'Kattintásonként +0,6% önbizalom pontonként' },
        { id: 'gamer', label: 'Gamer', icon: 'game', effect: '+0,05 önbizalom/mp és lassú közösségi növekedés pontonként' },
        { id: 'code', label: 'Kód', icon: 'code', effect: '+0,4% munka- és freelance-bevétel pontonként' },
        { id: 'chaos', label: 'Káosz', icon: 'bolt', effect: '+0,02 önbizalom/kattintás pontonként, de nő a lebukási kockázat' },
        { id: 'chill', label: 'Nyugi', icon: 'leaf', effect: 'Gyorsabb energia-regeneráció, lassabban nő a játékvágy' }
    ];
    D.STAT_MAX = 100; // a sáv teljes kitöltéséhez

    // Színválasztó: a "paint" mezővel rendelkező tárgyak színe átállítható
    D.PALETTE = [
        { id: 'rozsa', label: 'Rózsa', color: '#f4a3b8' },
        { id: 'barack', label: 'Barack', color: '#ffc9a6' },
        { id: 'citrom', label: 'Citrom', color: '#fbe59a' },
        { id: 'menta', label: 'Menta', color: '#a8e6c4' },
        { id: 'ego', label: 'Égkék', color: '#8fd3f4' },
        { id: 'indigo', label: 'Kék', color: '#7f9fe0' },
        { id: 'levendula', label: 'Levendula', color: '#c7b0f0' },
        { id: 'feher', label: 'Fehér', color: '#fdf8fd' },
        { id: 'piros', label: 'Piros', color: '#e8607a' },
        { id: 'fekete', label: 'Fekete', color: '#4a4056' }
    ];

    // ---------- Minták és feliratok ----------
    // slots: ezeken a helyeken választható; kind 'print' (nyomtatott grafika) és 'text' (felirat) csak a "prints" ruhákon.
    D.PATTERNS = [
        { id: 'stripe', label: 'Csíkos', slots: ['top', 'bottom', 'legs'] },
        { id: 'dots', label: 'Pöttyös', slots: ['top', 'bottom', 'legs'] },
        { id: 'plaid', label: 'Kockás', slots: ['top', 'bottom', 'legs'] },
        { id: 'hearts', label: 'Szíves', slots: ['top', 'bottom', 'legs'] },
        { id: 'stars', label: 'Csillagos', slots: ['top', 'bottom', 'legs'] },
        { id: 'checker', label: 'Sakktábla', slots: ['top', 'bottom', 'legs'] },
        { id: 'trans', label: 'Zászló-csíkok', slots: ['top', 'legs'], fixed: true },
        { id: 'rainbow', label: 'Szivárvány-csíkok', slots: ['top', 'bottom', 'legs'], fixed: true },
        { id: 'g_heart', label: 'Nagy szív', slots: ['top'], kind: 'print' },
        { id: 'g_cat', label: 'Cica-arc', slots: ['top'], kind: 'print' },
        { id: 'g_star', label: 'Nagy csillag', slots: ['top'], kind: 'print' },
        { id: 'g_rainbow', label: 'Szivárvány-ív', slots: ['top'], kind: 'print', fixed: true },
        { id: 'g_bolt', label: 'Villám', slots: ['top'], kind: 'print' },
        { id: 'sl_nyau', label: 'Felirat: NYAU', slots: ['top'], kind: 'text', text: 'NYAU' },
        { id: 'sl_uwu', label: 'Felirat: UwU', slots: ['top'], kind: 'text', text: 'UwU' },
        { id: 'sl_cutie', label: 'Felirat: CUTIE', slots: ['top'], kind: 'text', text: 'CUTIE' },
        { id: 'sl_femboy', label: 'Felirat: FEMBOY', slots: ['top'], kind: 'text', text: 'FEMBOY' },
        { id: 'sl_arch', label: 'Felirat: ARCH BTW', slots: ['top'], kind: 'text', text: 'ARCH BTW' },
        { id: 'sl_404', label: 'Felirat: 404 BOY', slots: ['top'], kind: 'text', text: '404 BOY' },
        { id: 'sl_puha', label: 'Felirat: PUHA', slots: ['top'], kind: 'text', text: 'PUHA' }
    ];
    // Mely mintákat kaphatja ez a tárgy (üres tömb: nem mintázható)
    D.patternsFor = function (item) {
        if (!item || item.nopat) return [];
        return D.PATTERNS.filter(function (p) {
            if (p.slots.indexOf(item.slot) < 0) return false;
            if (p.kind && !item.prints) return false;
            return true;
        });
    };

    D.ITEMS = [
        { id: 'hajgumi', slot: 'hair', name: 'Pasztell hajgumi', cost: 1500, click: 0.2, passive: 0, risk: 3, st: { cute: 5, chill: 2 }, paint: '#f4a3b8', desc: 'Apróság, de a tiéd.', notes: [{ tone: 'good', text: 'Valaki a buszon megdicséri a hajgumidat: „Ez nagyon aranyos színű.”' }] },
        { id: 'masni', slot: 'hair', name: 'Selyem hajmasni', cost: 4500, click: 0.5, passive: 0, risk: 5, st: { cute: 8 }, paint: '#f4a3b8', desc: 'Egy masni, ami mindent megváltoztat.', notes: [{ tone: 'good', text: 'A pénztáros mosolyogva megjegyzi, hogy milyen szép a masnid.' }] },
        { id: 'macskaful', slot: 'hair', name: 'Macskafüles fejpánt', cost: 9000, click: 1, passive: 0.3, risk: 9, st: { cute: 14, gamer: 6, chaos: 2 }, desc: 'A klasszikus. Nyau.', notes: [{ tone: 'good', text: 'A villamoson egy kislány odasúgja az anyukájának: „Nézd, cicafüle!”' }, { tone: 'funny', text: 'Egy idegen megkérdezi, hogy a füled mozog-e. Tudományos kíváncsiság.' }] },
        { id: 'virag', slot: 'hair', name: 'Virágkoszorú', cost: 22000, click: 2, passive: 0.5, risk: 5, st: { cute: 14, chill: 8 }, desc: 'Mintha egy tündérmesében járnál.', notes: [{ tone: 'good', text: 'A parkban egy fotós megkér, hogy lefényképezhet-e a virágkoszorúddal.' }] },
        { id: 'parokni', slot: 'hair', name: 'Profi paróka', cost: 120000, click: 6, passive: 1, risk: 8, st: { cute: 20, chill: 6 }, desc: 'Hosszú, pasztell, és olyan természetes, hogy te is meglepődsz.', notes: [{ tone: 'good', text: 'Egy fodrász megáll melletted: „Ez nem is paróka? Hihetetlenül jól áll.”' }] },

        { id: 'polo', slot: 'top', name: 'Pasztell póló', cost: 3500, click: 0.3, passive: 0, risk: 4, st: { cute: 4, chill: 4 }, paint: '#f6b5c5', desc: 'Puha, rózsaszín, és pont jó rád.', notes: [{ tone: 'good', text: 'Az osztályból valaki megkérdezi, hol vetted a pólót. Tetszik neki.' }] },
        { id: 'pulcsi', slot: 'top', name: 'Oversize pulcsi', cost: 8000, click: 0.8, passive: 0, risk: 3, st: { cute: 8, chill: 14, code: 2 }, paint: '#8fd3f4', desc: 'Három számmal nagyobb, tízszer kényelmesebb.', notes: [{ tone: 'funny', text: 'Valaki szerint „ebben elfér még egy cica is”. Nem is tévedett nagyot.' }] },
        { id: 'crop', slot: 'top', name: 'Crop top', cost: 15000, click: 1.5, passive: 0, risk: 10, st: { cute: 12, chaos: 6 }, paint: '#ffc2d1', desc: 'Magabiztos darab, nem kispályás.', notes: [{ tone: 'bad', text: 'Egy idegen félhangosan megjegyzi a crop topod miatt, hogy „ez meg mi akar lenni”.' }] },
        { id: 'bluz', slot: 'top', name: 'Masnis selyemblúz', cost: 38000, click: 3, passive: 0.5, risk: 6, st: { cute: 14, chill: 6 }, paint: '#fdf8fd', desc: 'Elegáns, puha, és olyan, mint egy mese.', notes: [{ tone: 'good', text: 'Valaki a kávézóban megáll az asztalodnál: „Ez a blúz csodálatos, hol találtad?”' }] },
        { id: 'kabat', slot: 'top', name: 'Pasztell dizájner kabát', cost: 160000, click: 7, passive: 1, risk: 7, st: { cute: 18, chaos: 4, chill: 6 }, paint: '#cdb7f0', desc: 'Kézzel varrt, egyedi darab. Mindenki megfordul utánad.', notes: [{ tone: 'good', text: 'Az utcán valaki megkérdezi, hogy melyik divatházé a kabátod. „Egy barátomé” — mondod büszkén.' }] },

        { id: 'rovid', slot: 'bottom', name: 'Magas derekú rövidnadrág', cost: 6000, click: 0.5, passive: 0, risk: 5, st: { cute: 6, chill: 4 }, paint: '#a9cdee', desc: 'Nyárias és bátor.', notes: [] },
        { id: 'szoknya', slot: 'bottom', name: 'Plisszírozott szoknya', cost: 13000, click: 1.5, passive: 0, risk: 12, st: { cute: 14, chaos: 6, chill: 4 }, paint: '#f4a3b8', desc: 'Egy pörgés, és mindenki tudja, ki vagy.', notes: [{ tone: 'funny', text: 'Szeles nap van, a szoknyád úgy viselkedik, mint egy vitorla. A hajad is. Minden.' }, { tone: 'bad', text: 'Két srác nevetgél a szoknyád láttán, de egyikük utána odaszól: „Jó cucc, tényleg.”' }] },
        { id: 'tenisz', slot: 'bottom', name: 'Tenisz szoknya', cost: 24000, click: 2.5, passive: 0, risk: 11, st: { cute: 12, chaos: 2 }, paint: '#fdf6fa', desc: 'Sportos és aranyos egyszerre.', notes: [{ tone: 'good', text: 'A parkban valaki megkérdezi, hogy teniszezel-e. „Most már igen” — vágod rá.' }] },
        { id: 'kilt', slot: 'bottom', nopat: true, name: 'Kockás kilt', cost: 30000, click: 3.2, passive: 0, risk: 9, st: { cute: 12, chaos: 6, code: 2 }, desc: 'Skót hagyomány, femboy lelkület.', notes: [{ tone: 'funny', text: 'Egy idős úr szerint „a kilt a férfiruhák királya”. Egyetértesz.' }] },
        { id: 'estelyi', slot: 'bottom', nopat: true, name: 'Selyem estélyi szoknya', cost: 140000, click: 6, passive: 0.5, risk: 8, st: { cute: 20, chill: 8 }, paint: '#b89fe8', desc: 'Földig érő, selymes, és minden mozdulatnál hullámzik.', notes: [{ tone: 'funny', text: 'A szoknyád akkora, hogy a villamoson két embernek kell odébb lépnie. Te nevetsz a legjobban.' }] },

        { id: 'zokni', slot: 'legs', name: 'Pasztell térdzokni', cost: 3200, click: 0.4, passive: 0, risk: 4, st: { cute: 6, code: 8 }, paint: '#fdf6fa', desc: 'Az első lépés a megfelelő irányba.', notes: [] },
        { id: 'combzokni', slot: 'legs', name: 'Combzokni', cost: 7500, click: 1.2, passive: 0, risk: 9, st: { cute: 10, code: 6, chaos: 2 }, paint: '#f4a3b8', desc: 'Egyszerűen kell. Nem kell magyarázni.', notes: [{ tone: 'good', text: 'Egy lány az utcán megáll: „Hol van ilyen combzokni? Muszáj tudnom.”' }] },
        { id: 'harisnya', slot: 'legs', nopat: true, name: 'Csipke harisnya', cost: 19000, click: 2.5, passive: 0, risk: 8, st: { cute: 12, chaos: 4 }, desc: 'Finom, törékeny, és rád van szabva.', notes: [] },

        { id: 'choker', slot: 'neck', name: 'Bársony choker', cost: 5200, click: 0.8, passive: 0, risk: 7, st: { cute: 10, chill: 4, gamer: 2 }, paint: '#3a2f45', desc: 'Egy kis csengővel, ami minden lépésnél csilingel.', notes: [{ tone: 'good', text: 'A kollégád odaszól: „Szép a chokered, úgy csilingel, mint egy kis macska.”' }] },
        { id: 'nyakmasni', slot: 'neck', name: 'Nyakmasni', cost: 9500, click: 1.2, passive: 0, risk: 4, st: { cute: 8, code: 4 }, paint: '#8fd3f4', desc: 'Egyszerre iskolás és elegáns.', notes: [] },
        { id: 'medal', slot: 'neck', name: 'Csillagos medál', cost: 16000, click: 1.5, passive: 0.2, risk: 3, st: { cute: 6, chill: 4 }, desc: 'Egy apró csillag a szíved fölött.', notes: [] },
        { id: 'gyongy', slot: 'neck', name: 'Gyöngysor', cost: 110000, click: 4, passive: 1, risk: 3, st: { cute: 12, chill: 8 }, desc: 'Finom, régimódi és tökéletesen klassz.', notes: [{ tone: 'good', text: 'Egy idős hölgy odaszól: „Ritka, hogy valaki ilyen szépen viseli a gyöngyöt.”' }] },

        { id: 'napszemuveg', slot: 'face', name: 'Szív alakú napszemüveg', cost: 7000, click: 0.8, passive: 0, risk: 7, st: { cute: 10, chaos: 4 }, paint: '#f4a3b8', desc: 'Nyáron elengedhetetlen, télen is hordod.', notes: [{ tone: 'funny', text: 'Valaki a villamoson megkérdezi, hogy a napszemüveged látszik-e a sötétben is. Nem látszik, de nem is baj.' }] },
        { id: 'fulbevalo', slot: 'face', name: 'Csillag fülbevaló', cost: 5500, click: 0.6, passive: 0.1, risk: 5, st: { cute: 8, chill: 4 }, paint: '#f7d26a', desc: 'Apró csillagok, amik minden fejmozdulatnál megcsillannak.', notes: [{ tone: 'good', text: 'Egy osztálytársad megdicséri a fülbevalódat, és megkérdezi, hol találtad.' }] },
        { id: 'szemuveg', slot: 'face', name: 'Kerek szemüveg', cost: 12000, click: 1, passive: 0.2, risk: 2, st: { cute: 6, code: 8 }, desc: 'Okos és aranyos. Mindkettő igaz.', notes: [{ tone: 'good', text: 'Valaki a könyvtárban szerint a kerek szemüvegedtől olyan vagy, mint egy mesehős.' }] },

        { id: 'headset', slot: 'hair', name: 'Cicafüles headset', cost: 12000, click: 1.2, passive: 0.5, risk: 8, st: { cute: 8, gamer: 14, chaos: 2 }, paint: '#f4a3b8', desc: 'RGB világítással. Aktiválja a belső gamer démont.', notes: [{ tone: 'funny', text: 'A voice chaten valaki megkérdezi, hogy a macskafül is mikrofon-e. Majdnem.' }] },
        { id: 'hajcsat', slot: 'hair', name: 'Pasztell hajcsat-kollekció', cost: 2000, click: 0.3, passive: 0, risk: 3, st: { cute: 12, chill: 6 }, paint: '#9fd6f5', desc: 'Tizenkét darab, a frufru végre nem a szemedben van.', notes: [] },
        { id: 'sal', slot: 'neck', name: 'Szivárványsál', cost: 4000, click: 0.6, passive: 0, risk: 5, st: { cute: 6, chill: 10 }, desc: 'Hosszabb, mint a határidőid.', notes: [{ tone: 'good', text: 'Egy néni a megállóban megdicséri a sálad színeit, és megkérdezi, hogy te kötötted-e.' }] },
        { id: 'jogger', slot: 'bottom', name: 'Pasztell jogger', cost: 6500, click: 0.4, passive: 0, risk: 2, st: { chill: 12, code: 4 }, paint: '#c7b0f0', desc: 'Gumis derék, zsebek, nulla kompromisszum.', notes: [] },
        { id: 'kopeny', slot: 'back', name: 'Zászló-köpeny', cost: 17000, click: 2, passive: 0, risk: 11, st: { cute: 8, chaos: 8, chill: 4 }, desc: 'Lobog. Hatásos. A bejárati ajtón be sem férsz tőle.', notes: [{ tone: 'funny', text: 'A köpeny szélben úgy lobog mögötted, mint egy hősnek a filmekben. Aztán ráfordulsz egy lámpaoszlopra.' }] },
        { id: 'cicahatizsak', slot: 'back', name: 'Cicafüles hátizsák', cost: 6000, click: 0.5, passive: 0, risk: 3, st: { cute: 8, code: 3, chill: 3 }, paint: '#f4a3b8', desc: 'Két kis füllel a tetején. Elfér benne a laptop is.', notes: [] },
        { id: 'platform', slot: 'shoes', name: 'Platform tornacipő', cost: 9000, click: 0.8, passive: 0, risk: 6, st: { cute: 8, chaos: 6 }, paint: '#fdf8fd', desc: 'Öt centivel magasabb, tízszer magabiztosabb.', notes: [] },
        { id: 'maryjane', slot: 'shoes', name: 'Mary Jane cipő', cost: 14000, click: 1.2, passive: 0, risk: 6, st: { cute: 12, chill: 4 }, paint: '#4a4056', desc: 'Pántos, kerek orrú, tökéletes a fehér zokni mellé.', notes: [{ tone: 'good', text: 'Valaki a lépcsőházban megjegyzi, hogy a cipőd mennyire hangulatos, és megkérdezi, honnan van.' }] },
        { id: 'csizma', slot: 'shoes', name: 'Térdcsizma', cost: 26000, click: 2, passive: 0, risk: 7, st: { cute: 10, chaos: 8 }, paint: '#4a4056', desc: 'Magas szárú, határozott léptekhez.', notes: [] },
        { id: 'kbd', slot: 'gear', name: 'Rózsaszín mechanikus billentyűzet', cost: 25000, click: 0.5, passive: 0.4, risk: 3, st: { code: 12, gamer: 10, cute: 6, chaos: 6 }, desc: 'Kék switchek, hallható a szomszéd szobában is.', notes: [] },
        { id: 'konzol', slot: 'gear', name: 'Retro kézikonzol', cost: 15000, click: 0, passive: 0.3, risk: 1, st: { gamer: 16, chill: 8 }, desc: 'Zsebben hordható nosztalgia. A pixelek megnyugtatnak.', notes: [] },
        { id: 'arch', slot: 'gear', name: 'Arch Linux pendrive', cost: 2000, click: 0, passive: 0.2, risk: 1, st: { code: 18, chaos: 10 }, desc: '„I use Arch btw.” A terminálból konfigurálod a stílusodat is.', notes: [] },
        { id: 'matcha', slot: 'drink', name: 'Matcha latte', cost: 1500, click: 0, passive: 0.1, risk: 0, st: { chill: 14, cute: 6, chaos: -4 }, desc: 'Zöld, habos, tiszteletreméltó.', notes: [] },
        { id: 'monster', slot: 'drink', name: 'Ultra White Monster', cost: 600, click: 0.3, passive: 0, risk: 1, st: { gamer: 8, code: 6, chaos: 14, chill: -8 }, desc: 'A szent elixír. A hajnali 3-as voice chat alapértelmezett üzemanyaga.', notes: [] },
        { id: 'sun', slot: 'buddy', name: 'Cica-sün plüss', cost: 5000, click: 0, passive: 0.2, risk: 0, st: { cute: 12, chill: 8 }, desc: 'Nem cica, nem sün, mégis mindkettő.', notes: [] },
        { id: 'blahaj', slot: 'buddy', name: 'Plüss cápa', cost: 13000, click: 0, passive: 0.4, risk: 0, st: { cute: 10, chill: 18 }, desc: 'A szoba főadminisztrátora. Mindig kéznél van, ha ölelés kell.', notes: [] },
        { id: 'army', slot: 'buddy', name: 'Plüss cápa-hadsereg', cost: 45000, click: 0, passive: 1, risk: 0, st: { cute: 16, chill: 30, chaos: 10 }, desc: 'Öt cápa, egy cél: távol tartani a külvilág toxicitását.', notes: [] },
        // Új ruhák: a "look" mondja meg, melyik rajzot használják; a "pat"/"pat2" az alapminta és a minta színe; a "prints" azt jelenti, hogy feliratot és nyomtatott mintát is kaphat.
        { id: 'feliratos', slot: 'top', look: 'tee', prints: true, pat: 'sl_nyau', pat2: '#f4a3b8', name: 'Feliratos póló', cost: 2800, click: 0.3, passive: 0, risk: 5, st: { cute: 6, chaos: 3, code: 2 }, paint: '#fdf8fd', desc: 'Egy mondat a mellkasodon. A minta és a felirat átállítható.', notes: [{ tone: 'funny', text: 'Valaki hangosan felolvassa a pólód feliratát a buszon. Megköszönöd.' }] },
        { id: 'tengeresz', slot: 'top', look: 'tee', pat: 'stripe', pat2: '#7f9fe0', name: 'Csíkos tengerész-póló', cost: 4200, click: 0.4, passive: 0, risk: 3, st: { cute: 7, chill: 5 }, paint: '#fdf8fd', desc: 'Klasszikus csík, tengerparti hangulat. Egyszínűre és mintásra is átállítható.', notes: [] },
        { id: 'csikoscomb', slot: 'legs', look: 'combzokni', pat: 'stripe', pat2: '#f4a3b8', name: 'Csíkos combzokni', cost: 9800, click: 1.4, passive: 0, risk: 9, st: { cute: 12, code: 6, chaos: 3 }, paint: '#fdf6fa', desc: 'Az ikonikus csíkos darab. A csík és az alapszín külön állítható.', notes: [{ tone: 'good', text: 'Egy lány az utcán odaszól: „Az a csíkos combzokni mennyire jó!”' }] },
        { id: 'szivarvanyzokni', slot: 'legs', look: 'zokni', pat: 'rainbow', name: 'Szivárvány térdzokni', cost: 5200, click: 0.6, passive: 0, risk: 6, st: { cute: 8, chill: 4, chaos: 2 }, paint: '#fdf6fa', desc: 'Hat szín, nulla kompromisszum.', notes: [] },
        { id: 'bakancs', slot: 'shoes', name: 'Fűzős bakancs', cost: 19000, click: 1.5, passive: 0, risk: 8, st: { cute: 6, chaos: 8, chill: 2 }, paint: '#4a4056', desc: 'Vastag talp, dupla fűzés. Határozott, mégis cuki.', notes: [] },
        { id: 'magasszaru', slot: 'shoes', name: 'Magas szárú tornacipő', cost: 11000, click: 0.9, passive: 0, risk: 4, st: { cute: 6, gamer: 4, chill: 4 }, paint: '#fdf8fd', desc: 'Bokáig érő, fűzős, gumi orrvéddel. Működik hétköznap és con-on is.', notes: [] },
        // Jelmezek (Cosplay): az egész felsőtest-, alsó- és lábszár-megjelenést felülírják, a felsőt/alsót elfedik. Kiegészítők (nyak, arc) maradnak.
        { id: 'maid', slot: 'cosplay', name: 'Szobalány-jelmez', cost: 42000, click: 3, passive: 0.4, risk: 12, st: { cute: 18, chaos: 4, chill: 4 }, desc: 'Fekete ruha, fodros kötény, fejpánt. Con-ra és kávézóba is megfelel.', notes: [{ tone: 'good', text: 'A conon valaki megkér, hogy lefényképezhet-e. „Persze, uwu.”' }] },
        { id: 'sailor', slot: 'cosplay', name: 'Matróz-egyenruha', cost: 36000, click: 2.5, passive: 0.3, risk: 9, st: { cute: 14, chill: 6, code: 2 }, desc: 'Kék matrózgallér, piros masni, plisszírozott szoknya. Iskolai klasszikus.', notes: [{ tone: 'good', text: 'A parkban valaki megkérdezi, melyik animéből van a jelmezed. „Mindegyikből egy kicsit.”' }] },
        { id: 'magical', slot: 'cosplay', name: 'Varázslólány-szett', cost: 78000, click: 4.5, passive: 0.7, risk: 11, st: { cute: 24, chaos: 6, chill: 4 }, desc: 'Fodros ruha csillag-brossal, nagy masni, csillag hajcsatok. Átváltozás közben ne nézz oda.', notes: [{ tone: 'funny', text: 'Egy kisfiú izgatottan kérdezi: „Te vagy a varázslólány?” Büszkén bólintasz.' }] },
        { id: 'witch', slot: 'cosplay', name: 'Boszorkány-jelmez', cost: 64000, click: 3.8, passive: 0.5, risk: 9, st: { cute: 14, chaos: 12, chill: 2 }, desc: 'Csúcsos kalap, lila ruha, csíkos harisnya. A seprű külön.', notes: [{ tone: 'funny', text: 'Valaki megkérdezi, hogy a kalap kényelmes-e. Nem, de megéri.' }] },
        { id: 'onesie', slot: 'cosplay', name: 'Nyuszi onesie', cost: 24000, click: 1.8, passive: 0.6, risk: 4, st: { cute: 20, chill: 18, chaos: -2 }, desc: 'Pasztell, bolyhos, füles kapucnival és bojt-farokkal. Összecsukhatatlanul puha.', notes: [{ tone: 'good', text: 'A postás megáll az ajtóban: „Szép onesie.” Nem tudod, mit válaszolj, de mosolyogsz.' }] }
    ];

    // Rejtekhely: csak titkolózás alatt hasznos (a kockázat havi csökkenését növeli)
    D.HIDEOUT = [
        { id: 'doboz', name: 'Cipősdoboz az ágy alatt', cost: 1500, decay: 0.6, desc: 'Régi klasszikus. Anya sosem néz ide.' },
        { id: 'jelszo', name: 'Jelszó a telefonra és a gépre', cost: 2500, decay: 0.6, desc: 'Minden zárolva, minden jelszóval védett.' },
        { id: 'hatizsak', name: 'Hátizsák titkos zsebbel', cost: 4000, decay: 0.8, desc: 'Az iskolatáskában is van hely a dolgoknak.' },
        { id: 'fiok', name: 'Zárható fiók', cost: 5000, decay: 1, desc: 'A kulcs a tiéd. Egyetlen példány.' }
    ];

    // ---------- Szoba: dekoráció és háziállat ----------
    D.DECOR = [
        { id: 'poszter', name: 'Posztererek a falon', cost: 4000, passive: 0.1, st: { cute: 4, gamer: 2 }, desc: 'Kedvenc animék és zenekarok.' },
        { id: 'zaszlo', name: 'Pasztell zászló', cost: 6000, passive: 0.15, st: { cute: 4, chaos: 2 }, desc: 'Egy kis büszkeség a falon.' },
        { id: 'ledfeny', name: 'LED fényfüzér', cost: 9000, passive: 0.3, st: { cute: 10, chill: 8 }, desc: 'Hangulatos esték.' },
        { id: 'agytakaro', name: 'Puha plédek és párnák', cost: 11000, passive: 0.2, regen: 0.2, st: { chill: 12, cute: 4 }, desc: 'A legjobb pihenőfészek.' },
        { id: 'novenyek', name: 'Szobanövények', cost: 15000, passive: 0.3, st: { chill: 10, cute: 4 }, desc: 'Élő zöld a szobában.' },
        { id: 'tukor', name: 'Teljes alakos tükör', cost: 18000, click: 1, st: { cute: 8 }, desc: 'Végre látod magad tetőtől talpig.' },
        { id: 'polc', name: 'Gyűjtői polc (figurák)', cost: 26000, passive: 0.5, st: { cute: 6, gamer: 6 }, desc: 'Kis figurák, nagy szeretet.' },
        { id: 'lava', name: 'Lávalámpa', cost: 4500, passive: 0.2, st: { chill: 14, cute: 6 }, desc: 'Buborékol és nem kér semmit. A legjobb szobatárs.' },
        { id: 'dobozok', name: 'Doboz-torony', cost: 3000, passive: 0, st: { chaos: 16, gamer: 4, chill: -4 }, desc: 'Üres energiaitalos dobozok instabil piramisa a sarokban.' }
    ];
    D.PETS = [
        { id: 'cica', name: 'Cica', cost: 25000, passive: 0.6, regen: 0.3, st: { cute: 12, chill: 8 }, desc: 'Örökbefogadott cica. A billentyűzeten alszik.', needsHome: ['szoba', 'garzon', 'lakas'] }
    ];

    // ---------- Kombók ----------
    // need: tárgyazonosítók (viselt tárgy / szobadísz / társ); egy elem tömb is lehet ("ezek bármelyike").
    // A kombó extra statpontokat ad, és megjelenik a Szekrény fülön.
    D.COMBOS = [
        { id: 'archbtw', icon: 'code', name: 'I use Arch, btw', need: ['arch', ['zokni', 'combzokni']], bonus: { code: 10, cute: 6 }, text: 'A sztereotípia teljes.' },
        { id: 'devops', icon: 'moon', name: 'Hajnali 3-as DevOps', need: ['monster', ['blahaj', 'army'], 'kbd'], bonus: { code: 8, chaos: 8 }, text: 'A cápa őrzi a szervert.' },
        { id: 'streamer', icon: 'game', name: 'Cicafüles streamer', need: ['headset', 'choker'], bonus: { cute: 10, gamer: 8 }, text: 'A chat szerint „vágd be a nyávogást”.' },
        { id: 'pasztell', icon: 'heart', name: 'Teljes pasztell', need: ['hajcsat', 'pulcsi', 'jogger'], bonus: { cute: 10, chill: 10 }, text: 'Mint egy szivárvány, csak puhább.' },
        { id: 'kaosz', icon: 'bolt', name: 'Káosz-tanya', need: ['dobozok', 'monster'], bonus: { chaos: 14 }, text: 'A piramis már a plafont súrolja.' },
        { id: 'skot', icon: 'flag', name: 'Skót büszkeség', need: ['kilt', 'kopeny'], bonus: { cute: 12, chaos: 4 }, text: 'Lobog a kockás, lobog a zászló.' },
        { id: 'gyujto', icon: 'buddy', name: 'Cápa-gyűjtő', need: ['army', ['lava', 'ledfeny']], bonus: { chill: 12, cute: 6 }, text: 'A szoba tényleg az óceán.' },
        { id: 'gamercica', icon: 'game', name: 'Gamer cica', need: [['konzol', 'kbd'], ['headset', 'macskaful']], bonus: { gamer: 10 }, text: 'Headset a fülön, mancs a billentyűn.' },
        { id: 'zen', icon: 'leaf', name: 'Zen mester', need: ['matcha', 'lava', ['pulcsi', 'jogger']], bonus: { chill: 16 }, text: 'A Discord-értesítések nem érnek el hozzád.' },
        { id: 'iskolas', icon: 'book', name: 'Iskolás szett', need: [['polo', 'bluz'], ['kilt', 'tenisz', 'szoknya'], ['zokni', 'combzokni'], 'maryjane'], bonus: { cute: 14, chill: 4 }, text: 'Egyenruha, de a saját szabályaid szerint.' },
        { id: 'cicakoszon', icon: 'heart', name: 'Cicaszülő', need: ['macskaful', 'cica'], bonus: { cute: 12, chill: 6 }, text: 'Ki a gazdi és ki a cica? Mindketten tudjátok.' },
        { id: 'esteli', icon: 'star', name: 'Estélyi díva', need: ['estelyi', 'gyongy', 'parokni'], bonus: { cute: 20, chill: 8 }, text: 'A szőnyeg te vagy, a vörös is.' },
        { id: 'okos', icon: 'code', name: 'Okos cica', need: ['szemuveg', 'kbd'], bonus: { code: 10, cute: 4 }, text: 'A kerek szemüveg mögött gyors a gondolkodás.' },
        { id: 'animearc', icon: 'sparkle', name: 'Anime arc', need: ['pi_anime', 'pl_also', 'ki_szarny'], bonus: { cute: 12 }, text: 'A szemeid mintha egy rajzfilmből léptek volna elő.' },
        { id: 'glam', icon: 'star', name: 'Csillogó glam', need: ['sz_csillogo', 'aj_csillam', 'pl_dramai'], bonus: { cute: 14, chaos: 4 }, text: 'Egyetlen pillantás, és a terem elcsendesedik.' },
        { id: 'nomake', icon: 'leaf', name: 'Smink, ami nem látszik', need: ['aj_balzsam', 'pi_termeszetes', 'pl_termeszetes'], bonus: { chill: 10, cute: 6 }, text: 'Mindenki csak annyit lát, hogy frissnek tűnsz.' },
        { id: 'cicaszem', icon: 'heart', name: 'Cicaszem', need: ['ki_macska', 'di_szeplo', ['macskaful', 'headset']], bonus: { cute: 10, chaos: 2 }, text: 'A szemed, a füled és a szeplőid: nyau.' },
        { id: 'kawaii', icon: 'sparkle', name: 'Kawaii-lökés', need: ['di_szivmatrica', 'hajcsat', 'pi_anime'], bonus: { cute: 14 }, text: 'Matricák, csatok, pír: a cukiság hármas fogata.' },
        { id: 'manikur', icon: 'star', name: 'Manikűr és gyöngy', need: [['ko_francia', 'ko_csillam', 'ko_hosszu'], 'gyongy'], bonus: { cute: 8, chill: 6 }, text: 'A kezed és a nyakláncod egyaránt ragyog.' },
        { id: 'punk', icon: 'bolt', name: 'Pasztell punk', need: ['ki_szines', 'sz_grafikus', 'csizma'], bonus: { chaos: 12, cute: 6 }, text: 'Rózsaszín tüskék, éles vonalak, kemény léptek.' },
        { id: 'sebeshos', icon: 'bolt', name: 'Sebhelyes hős', need: ['di_sebtapasz', 'kopeny'], bonus: { chaos: 10, cute: 4 }, text: 'A köpeny lobog, a tapasz tartja magát.' },
        { id: 'platformos', icon: 'bolt', name: 'Platformos pörgés', need: ['platform', ['combzokni', 'harisnya'], ['szoknya', 'tenisz']], bonus: { cute: 10, chaos: 6 }, text: 'Pár centivel feljebb, sokkal magabiztosabban.' }
    ];
    D.FULL_SET_BONUS = { cute: 4, gamer: 4, code: 4, chaos: 4, chill: 4 }; // ha mind a 11 hely ki van töltve

    // Stílus-rangok a pontösszeg alapján
    D.RANKS = [
        { min: 0, title: 'Még csak nézelődsz' },
        { min: 30, title: 'Gyanútlan érdeklődő' },
        { min: 80, title: 'Kezdő stílusikon' },
        { min: 150, title: 'Haladó cuki tisztségviselő' },
        { min: 240, title: 'Pasztell főcica' },
        { min: 340, title: 'Legendás stílus-admin' }
    ];


    // ---------- Smink (Smink fül): termékek + színek ----------
    // Egy hely = egy aktív termék. A "tone" termékek színe a LOOK_COLORS palettából állítható.
    // skill: a "Smink és stílus" képesség minimális szintje. st / click / risk ugyanúgy működik, mint a ruháknál.
    D.LOOK_SLOTS = [
        { id: 'lips', label: 'Ajak', icon: 'lips' },
        { id: 'blush', label: 'Pír', icon: 'blush' },
        { id: 'shadow', label: 'Szemhéj', icon: 'eye' },
        { id: 'liner', label: 'Szemkihúzó', icon: 'pen' },
        { id: 'lashes', label: 'Pillák', icon: 'lash' },
        { id: 'nails', label: 'Köröm', icon: 'nail' },
        { id: 'deco', label: 'Arcdísz', icon: 'sparkle' }
    ];
    D.LOOK_COLORS = {
        lips: [
            { id: 'rozsa', label: 'Rózsa', color: '#f0839f' }, { id: 'nude', label: 'Nude', color: '#d9928c' },
            { id: 'korall', label: 'Korall', color: '#f5826b' }, { id: 'piros', label: 'Piros', color: '#d6304e' },
            { id: 'bordo', label: 'Bordó', color: '#8e2a49' }, { id: 'lila', label: 'Lila', color: '#a566c9' },
            { id: 'kek', label: 'Kék', color: '#5f8fe0' }, { id: 'fekete', label: 'Fekete', color: '#3a2a42' }
        ],
        blush: [
            { id: 'rozsa', label: 'Rózsa', color: '#ff8aa8' }, { id: 'barack', label: 'Barack', color: '#ffa07a' },
            { id: 'korall', label: 'Korall', color: '#f5826b' }, { id: 'piros', label: 'Piros', color: '#f0607a' },
            { id: 'lila', label: 'Lila', color: '#c58ae0' }, { id: 'kek', label: 'Jég', color: '#8fc4f0' }
        ],
        shadow: [
            { id: 'rozsa', label: 'Rózsa', color: '#f3a6c0' }, { id: 'lila', label: 'Lila', color: '#a98be0' },
            { id: 'kek', label: 'Kék', color: '#78b6ec' }, { id: 'menta', label: 'Menta', color: '#8fdcb9' },
            { id: 'barack', label: 'Barack', color: '#f7b58a' }, { id: 'arany', label: 'Arany', color: '#e8c468' },
            { id: 'bordo', label: 'Bordó', color: '#a8465f' }, { id: 'fekete', label: 'Füst', color: '#4a3a54' }
        ],
        liner: [
            { id: 'fekete', label: 'Fekete', color: '#2a2230' }, { id: 'barna', label: 'Barna', color: '#5a3b30' },
            { id: 'kek', label: 'Kék', color: '#3b7bd6' }, { id: 'lila', label: 'Lila', color: '#8a4fd0' },
            { id: 'rozsa', label: 'Rózsa', color: '#e8609a' }, { id: 'zold', label: 'Zöld', color: '#2fa07a' },
            { id: 'piros', label: 'Piros', color: '#d6304e' }
        ],
        nails: [
            { id: 'rozsa', label: 'Rózsa', color: '#f4a3b8' }, { id: 'feher', label: 'Fehér', color: '#fdf8fd' },
            { id: 'fekete', label: 'Fekete', color: '#3a2f45' }, { id: 'levendula', label: 'Levendula', color: '#c7b0f0' },
            { id: 'menta', label: 'Menta', color: '#a8e6c4' }, { id: 'ego', label: 'Égkék', color: '#8fd3f4' },
            { id: 'piros', label: 'Piros', color: '#e8607a' }, { id: 'arany', label: 'Arany', color: '#e8c468' }
        ]
    };
    D.BEAUTY = [
        { id: 'aj_balzsam', slot: 'lips', name: 'Ápoló szájfény', cost: 700, skill: 0, st: { cute: 3, chill: 2 }, click: 0.1, risk: 1, desc: 'Szinte észrevehetetlen, mégis ettől ragyog a mosolyod.' },
        { id: 'aj_matt', slot: 'lips', name: 'Matt rúzs', cost: 2200, skill: 0, tone: true, st: { cute: 6 }, click: 0.3, risk: 4, desc: 'Tiszta, éles szín. Egy mozdulat, és más ember néz vissza a tükörből.' },
        { id: 'aj_fenyes', slot: 'lips', name: 'Fényes ajakfény', cost: 3200, skill: 0, tone: true, st: { cute: 8 }, click: 0.4, risk: 5, desc: 'Üvegesen csillog, és soha nem szárad le.' },
        { id: 'aj_ombre', slot: 'lips', name: 'Ombre ajak', cost: 6500, skill: 1, tone: true, st: { cute: 12 }, click: 0.8, risk: 6, desc: 'Belül sötétebb, kifelé elhalványuló szín. A koreai stílus kedvence.' },
        { id: 'aj_csillam', slot: 'lips', name: 'Csillámos ajakfény', cost: 9000, skill: 2, tone: true, st: { cute: 14, chaos: 2 }, click: 1.1, risk: 7, desc: 'Minden szavad megcsillan vele.' },

        { id: 'pi_termeszetes', slot: 'blush', name: 'Természetes pír', cost: 1500, skill: 0, tone: true, st: { cute: 5 }, click: 0.2, risk: 3, desc: 'Egy kis szín az arcodra, mintha épp most jöttél volna a szabadból.' },
        { id: 'pi_anime', slot: 'blush', name: 'Anime pír', cost: 3000, skill: 0, tone: true, st: { cute: 9 }, click: 0.5, risk: 6, desc: 'Kerek, ferde vonalakkal. Egy pillanat alatt rajzfilmszereplő leszel.' },
        { id: 'pi_orca', slot: 'blush', name: 'Orrnyereg-pír', cost: 5200, skill: 1, tone: true, st: { cute: 11 }, click: 0.7, risk: 6, desc: 'Az arcodtól az orrod hátáig húzódó pír. Mintha épp sírtál volna, csak szebben.' },
        { id: 'pi_csillam', slot: 'blush', name: 'Csillámos pír', cost: 7500, skill: 2, tone: true, st: { cute: 13, chaos: 2 }, click: 1, risk: 7, desc: 'Kis csillagok az arcodon, ahogy a fény ráesik.' },

        { id: 'sz_finom', slot: 'shadow', name: 'Finom szemhéjpúder', cost: 2500, skill: 0, tone: true, st: { cute: 5 }, click: 0.3, risk: 3, desc: 'Egy puha réteg, ami kiemeli a szemed színét.' },
        { id: 'sz_atmenet', slot: 'shadow', name: 'Átmenetes szemhéjfesték', cost: 5000, skill: 1, tone: true, st: { cute: 9 }, click: 0.6, risk: 5, desc: 'Két árnyalat lágy átmenettel. Türelmet kér, de megéri.' },
        { id: 'sz_csillogo', slot: 'shadow', name: 'Csillogó szemhéj', cost: 7500, skill: 2, tone: true, st: { cute: 11, chaos: 3 }, click: 1, risk: 7, desc: 'Gyöngyházfényű csillámok a szemhéjon, ünnepi alkalmakra és hétköznapokra is.' },
        { id: 'sz_grafikus', slot: 'shadow', name: 'Grafikus szemhéj', cost: 12000, skill: 3, tone: true, st: { cute: 12, chaos: 6 }, click: 1.4, risk: 9, desc: 'Éles, szín-blokkos forma, a szem fölött a halánték felé húzva.' },

        { id: 'ki_finom', slot: 'liner', name: 'Finom szemkihúzó', cost: 1800, skill: 0, tone: true, st: { cute: 4 }, click: 0.2, risk: 3, desc: 'Egy vékony vonal a pillák mentén.' },
        { id: 'ki_szarny', slot: 'liner', name: 'Szárnyas szemkihúzó', cost: 3500, skill: 1, tone: true, st: { cute: 8 }, click: 0.5, risk: 6, desc: 'A szem szélén felfelé futó szárny. Elsőre remeg a kéz, tizedszerre már tökéletes.' },
        { id: 'ki_szines', slot: 'liner', name: 'Színes szemkihúzó', cost: 7000, skill: 2, tone: true, st: { cute: 10, chaos: 4 }, click: 0.9, risk: 7, desc: 'Kék, lila, rózsa: ahogy a hangulatod kívánja.' },
        { id: 'ki_macska', slot: 'liner', name: 'Macskaszem-kihúzó', cost: 11000, skill: 3, tone: true, st: { cute: 12, chaos: 5 }, click: 1.3, risk: 9, desc: 'Hosszú, drámai szárny. A tekinteted egy macskáé.' },

        { id: 'pl_termeszetes', slot: 'lashes', name: 'Szempillaspirál', cost: 1500, skill: 0, st: { cute: 5 }, click: 0.2, risk: 3, desc: 'Kicsit hosszabb, kicsit sötétebb.' },
        { id: 'pl_hosszu', slot: 'lashes', name: 'Hosszító spirál', cost: 3800, skill: 0, st: { cute: 8 }, click: 0.4, risk: 4, desc: 'Csillagszemű pillák, tincsenként elválasztva.' },
        { id: 'pl_also', slot: 'lashes', name: 'Alsó pillák', cost: 5500, skill: 1, st: { cute: 9 }, click: 0.6, risk: 5, desc: 'Kis vonalkák a szem alatt, az animék örök kedvence.' },
        { id: 'pl_dramai', slot: 'lashes', name: 'Műszempilla', cost: 8000, skill: 2, st: { cute: 12, chaos: 2 }, click: 1, risk: 7, desc: 'Teltebb és hosszabb. Minden pislogás mozdulatművészet.' },

        { id: 'ko_fenyes', slot: 'nails', name: 'Körömlakk', cost: 1200, skill: 0, tone: true, st: { cute: 4 }, click: 0.1, risk: 2, desc: 'Egyszínű lakk, a keze mindig kéznél van.' },
        { id: 'ko_francia', slot: 'nails', name: 'Francia manikűr', cost: 3000, skill: 0, tone: true, st: { cute: 6, chill: 2 }, click: 0.3, risk: 2, desc: 'Halvány alap, színes hegy. Időtlen klasszikus.' },
        { id: 'ko_csillam', slot: 'nails', name: 'Csillámos köröm', cost: 4500, skill: 1, tone: true, st: { cute: 9 }, click: 0.5, risk: 3, desc: 'Minden mozdulatnál megcsillan, ahogy a billentyűket nyomkodod.' },
        { id: 'ko_hosszu', slot: 'nails', name: 'Hosszú mandula köröm', cost: 7500, skill: 2, tone: true, st: { cute: 12, chaos: 2 }, click: 0.8, risk: 5, desc: 'Hosszú, hegyes és csinos. Gépelni nehéz vele, de nem érdekel.' },

        { id: 'di_anyajegy', slot: 'deco', name: 'Rajzolt anyajegy', cost: 600, skill: 0, st: { cute: 3 }, click: 0.1, risk: 1, desc: 'Egy kis pötty az ajak mellett.' },
        { id: 'di_szeplo', slot: 'deco', name: 'Szeplők', cost: 1500, skill: 0, st: { cute: 6, chill: 2 }, click: 0.3, risk: 2, desc: 'Barna pöttyök az orrod hátán és az arcodon.' },
        { id: 'di_szivmatrica', slot: 'deco', name: 'Szív matrica', cost: 1200, skill: 0, st: { cute: 7 }, click: 0.3, risk: 4, desc: 'Egy apró szív a szemed alatt.' },
        { id: 'di_csillag', slot: 'deco', name: 'Csillag matrica', cost: 1200, skill: 0, st: { cute: 7 }, click: 0.3, risk: 4, desc: 'Egy arany csillag az arcodon.' },
        { id: 'di_sebtapasz', slot: 'deco', name: 'Sebtapasz az arcon', cost: 800, skill: 0, st: { cute: 4, chaos: 4 }, click: 0.2, risk: 3, desc: 'Nem sérülés, hanem stílus.' },
        { id: 'di_csillamszem', slot: 'deco', name: 'Csillámkönnyek', cost: 6000, skill: 2, st: { cute: 12, chaos: 3 }, click: 0.9, risk: 7, desc: 'Apró csillagok a szem alatt, mintha a szemed csillogna.' }
    ];
    // Ha mind az 5 arc-hely (ajak, pír, szemhéj, szemkihúzó, pillák) ki van töltve
    D.FULL_LOOK_BONUS = { cute: 6, chill: 2 };
    D.FULL_LOOK_SLOTS = ['lips', 'blush', 'shadow', 'liner', 'lashes'];

    // ---------- Barátok és társas élet ----------
    // Minden személyhez kötelék (0-100) tartozik. A kötelék idővel kopik, ha nem tartod a kapcsolatot.
    // unlock: feltétel(ek) a megjelenéshez. perk: a kötelék pontonkénti játékhatása (a motor számolja).
    // look: az avatar-portré beállításai (a Barátok fülön látszik).
    D.PEOPLE = [
        { id: 'lilla', name: 'Lilla', role: 'Osztálytárs, legjobb barát', start: 12, unlock: {},
          look: { skin: 's1', hairStyle: 'hosszu', hairColor: 'lila', outfit: { top: 'polo', bottom: 'szoknya', shoes: 'maryjane', hair: 'hajcsat' }, makeup: { lips: { style: 'aj_fenyes', color: 'rozsa' }, blush: { style: 'pi_termeszetes', color: 'rozsa' }, lashes: { style: 'pl_hosszu' } }, mood: 'happy' },
          perk: { passive: 0.08, risk: 0.03 }, perkText: 'Passzív önbizalom, és eltereli a gyanút (lassabban nő a lebukási kockázat)',
          meh: ['Lilla épp elfoglalt, csak egy szívecskét küld vissza. Az is valami.', 'Valamiért nem találjátok a hangot, de a végén azért nevettek.', 'Lilla fáradt, ma rövid a beszélgetés. Majd legközelebb.'] },
        { id: 'bence', name: 'Bence', role: 'Discord-barát', start: 10, unlock: { flag: 'discord' },
          look: { skin: 's3', hairStyle: 'rovid', hairColor: 'fekete', outfit: { top: 'pulcsi', hair: 'headset', bottom: 'jogger', face: 'szemuveg' }, makeup: {}, mood: 'neutral' },
          perk: { passive: 0.05, comm: 0.02 }, perkText: 'Passzív önbizalom, és havonta nő a közösség',
          meh: ['Bence lagol, a hangod meg szakadozik. Inkább elköszöntök.', 'A szerveren épp nagy a hangzavar, alig jut szó kettőtökre.', 'Bence már félig alszik, csak mormog valamit.'] },
        { id: 'nori', name: 'Nóri', role: 'A con-os csapat', start: 10, unlock: { cons: 1 },
          look: { skin: 's2', hairStyle: 'bob', hairColor: 'kek', outfit: { top: 'crop', bottom: 'tenisz', legs: 'combzokni', shoes: 'platform', hair: 'macskaful' }, makeup: { shadow: { style: 'sz_csillogo', color: 'kek' }, liner: { style: 'ki_szarny', color: 'kek' }, lips: { style: 'aj_matt', color: 'lila' }, lashes: { style: 'pl_dramai' } }, mood: 'happy' },
          perk: { click: 0.012 }, perkText: 'Több önbizalom kattintásonként: a közös ötletek mindig jönnek',
          meh: ['Nóri mással van elfoglalva, rövidre fogjátok.', 'A terv elakad, mert nem tudtok megegyezni a színeken.', 'Nem sül el jól a mai nap, de nem haragudtok egymásra.'] },
        { id: 'kata', name: 'Kata', role: 'Munkatárs', start: 8, unlock: { job: true },
          look: { skin: 's2', hairStyle: 'bob', hairColor: 'barna', outfit: { top: 'bluz', bottom: 'szoknya', neck: 'gyongy', shoes: 'maryjane' }, makeup: { lips: { style: 'aj_matt', color: 'bordo' }, shadow: { style: 'sz_finom', color: 'barack' } }, mood: 'neutral' },
          perk: { pay: 0.001 }, perkText: 'Magasabb fizetés: Kata jó szót szól érted',
          meh: ['Kata sietve elköszön, tele a naptára.', 'A határidő mindent felülír, alig jut idő egymásra.', 'Kata ma csak bólint, de este küld egy kedves üzenetet.'] },
        { id: 'csalad', name: 'Anya és apa', role: 'Család', start: 25, unlock: {},
          look: { skin: 's2', hairStyle: 'bob', hairColor: 'barna', outfit: { top: 'polo', bottom: 'rovid' }, makeup: {}, mood: 'neutral' },
          perk: { regen: 0.004 }, perkText: 'Gyorsabban töltődik az energiád: otthon mindig jó',
          meh: ['A beszélgetés kínosan csendes, de mindketten próbálkoztok.', 'Anya épp telefonál, apa a híreket nézi. Nem baj, máskor.', 'A téma elakad, de legalább együtt voltatok.'] },
        { id: 'zsombor', name: 'Zsombor', role: 'Valaki különleges', start: 5, unlock: { minAge: 16, anyOf: [{ step: 'barat' }, { minComm: 4 }] },
          look: { skin: 's2', hairStyle: 'rovid', hairColor: 'barna', outfit: { top: 'pulcsi', bottom: 'jogger' }, makeup: {}, mood: 'happy' },
          perkReq: 'partner', perk: { passive: 0.15, regen: 0.006 }, perkText: 'Sok passzív önbizalom és több energia: a legjobb érzés',
          meh: ['Zsombor kedves, de ma valahogy elbeszéltek egymás mellett.', 'Mindketten zavarban vagytok, és a végén csak nevettek rajta.', 'Zsombor jó fej, de ma nem találjátok a közös hangot.'] }
    ];

    // Interakciók. conf: tükörkattintás-egyenérték (a jelenlegi kattintás-önbizalommal szorozva).
    // needs: items (legalább ennyi saját ruha), look (legalább ennyi aktív smink-hely), comp, skill {id:szint},
    // job, out, secret, partner (true: kell, false: még nem lehet), housing (nem szülői ház)
    // special: riskDown | con | bonus | parents | date | allowance
    D.SOCIAL = [
        { id: 'l_chat', who: 'lilla', name: 'Üzenetváltás', desc: 'Pár perc chat a kedvenc dolgaitokról.', cost: 0, energy: 4, cd: 1, bond: 3, conf: 6,
          text: 'Pár üzenet a házi feladatról, a hétvégéről és egy közös emlékről. Jó érzés, hogy van kivel beszélni.', great: 'Lilla képet küld a kutyájáról, aztán egymást húzzátok egy órán át. Nevetve alszol el.' },
        { id: 'l_meet', who: 'lilla', name: 'Délutáni találkozó', desc: 'Fagyi a téren, kb. három órányi beszélgetés.', cost: 1500, energy: 14, cd: 2, bond: 7, conf: 14,
          text: 'A tér padján ülve megbeszélitek az egész hetet. Hazafelé úgy érzed, hogy sok minden könnyebb.', great: 'Három órát beszéltek, mintha csak öt perc lenne. Lilla megkérdezi, hogy mi újság veled, és tényleg érdekli.' },
        { id: 'l_shop', who: 'lilla', name: 'Közös ruhanézés', desc: 'Lilla választ neked egy színt, te neki egyet.', cost: 3000, energy: 16, cd: 3, bond: 6, conf: 22, needs: { items: 1 }, skillPts: { varras: 6 },
          text: 'Ruhák között bóklásztok, és mindketten felpróbálgattok pár dolgot. Lilla szerint a színekhez remek a szemed.', great: 'Lilla talál neked egy színt, amit még nem is próbáltál, és pontosan jó. Hazamész egy új ötlettel.' },
        { id: 'l_makeup', who: 'lilla', name: 'Sminkes délután', desc: 'Egymást sminkelitek, tanuljátok a fogásokat.', cost: 2000, energy: 14, cd: 3, bond: 8, conf: 18, needs: { look: 1 }, skillPts: { smink: 12 }, look: true,
          text: 'Egymás arcán gyakoroltok. Lilla megmutat egy fogást a szempillákkal, te egy trükköt a szemkihúzóval.', great: 'Lilla tökéletes szárnyat húz neked, te pedig az ő szemhéját csillogtatod ki. A tükörben mindketten ragyogtok.' },
        { id: 'l_secret', who: 'lilla', name: 'Elmondod neki a titkod', desc: 'Lilla az első, akinek igazán őszinte vagy.', cost: 0, energy: 10, cd: 8, bond: 10, conf: 40, minBond: 25, needs: { secret: true }, special: 'riskDown',
          text: 'Lilla meghallgat, majd csak annyit mond: „Tudtam, de örülök, hogy elmondtad. Én nem szólok senkinek.”', great: 'Lilla megölel, és együtt sírtok-nevettek. „Ez a legnormálisabb dolog, amit valaha hallottam rólad.”' },
        { id: 'l_sleepover', who: 'lilla', name: 'Pizsamabuli', desc: 'Filmek, pop-corn és hajnalig tartó beszélgetés.', cost: 2500, energy: 18, cd: 4, bond: 10, conf: 30, minBond: 40,
          text: 'Hajnali háromig nevettek egy ostoba filmen. Lilla elalszik a vállad mellett, te mosolyogva nézed a plafont.', great: 'Hajnalig mesélitek a legnagyobb félelmeiteket és a legőrültebb álmaitokat. Soha nem éreztél ennyire hazaérkezettnek magad.' },

        { id: 'b_voice', who: 'bence', name: 'Voice chat', desc: 'Esti beszélgetés a szerveren.', cost: 0, energy: 8, cd: 1, bond: 4, conf: 8, comm: 0.5,
          text: 'Egy óra a voice channelen: játék, vicc, félig komoly viták. Mindig jó hangulatban teltek az estéid.', great: 'Bence új viccet mesél a macskafülekről, és a fél szerver rajtad nevet. Szeretettel.' },
        { id: 'b_game', who: 'bence', name: 'Közös játék', desc: 'Egy teljes este egymás mellett (online).', cost: 0, energy: 14, cd: 2, bond: 6, conf: 14, comm: 1, needs: { comp: 2 },
          text: 'Közösen nyerni valamit, aztán közösen veszíteni. Bence szerint te vagy a legjobb csapattárs.', great: 'Egy lehetetlennek tűnő kör végén nyertek. A voice chat percekig üvölt, aztán mindenki nevet.' },
        { id: 'b_code', who: 'bence', name: 'Közös kódolás', desc: 'Bence segít a bonyolult részekben.', cost: 0, energy: 14, cd: 3, bond: 6, conf: 10, needs: { comp: 1 }, skillPts: { prog: 12 },
          text: 'Egy késő esti hibakeresés során Bence rámutat a hibára. Te meg a következőt találod meg.', great: 'Együtt oldotok meg egy gondot, amin napok óta vergődtél. Bence azt mondja: „Ez jó volt, nekem is tanultam belőle.”' },
        { id: 'b_mod', who: 'bence', name: 'Szerver-moderálás', desc: 'Közösen rendet tesztek a szerveren.', cost: 0, energy: 16, cd: 3, bond: 5, conf: 12, comm: 3, minBond: 20, skillPts: { angol: 8 },
          text: 'Vitát simítotok el, szabályokat írtok, és új tagokat fogadtok. Eszedbe jut, hogy ez a hely valóban a közösségé.', great: 'Egy új tag megköszöni, hogy segítettetek neki. Bence bólint: „Ezért csináljuk.”' },

        { id: 'n_sew', who: 'nori', name: 'Közös varrás', desc: 'Jelmez-tervezés varrógép mellett.', cost: 3500, energy: 16, cd: 3, bond: 7, conf: 18, skillPts: { varras: 14 },
          text: 'Egész délután szabtok, tűztök és nevettek. A jelmez alakul, és a közös varrógép teljesen belefeszül.', great: 'Nóri megmutat egy csodás szabást, te pedig egy trükköt a varrásról. Estére majdnem kész a közös projekt.' },
        { id: 'n_photo', who: 'nori', name: 'Mini fotózás', desc: 'Pózoltok a parkban a legjobb ruhákban.', cost: 4000, energy: 14, cd: 4, bond: 6, conf: 30, comm: 2, needs: { items: 1 }, look: true,
          text: 'A parkban sorban pózoltok. Nóri szerint a fotókra büszke lehetsz, és egy nap valóban az leszel.', great: 'A fények, a ruhák és a smink tökéletesen illenek egymáshoz. A fotókat a közösség is megosztja.' },
        { id: 'n_plan', who: 'nori', name: 'Con-tervezés', desc: 'Programok, jelmezek és szobafoglalás.', cost: 0, energy: 10, cd: 4, bond: 6, conf: 12, comm: 3, minBond: 25,
          text: 'A jegyek, a szállás és a jelmezek mind a helyükre kerülnek. A con már most nagyszerűnek ígérkezik.', great: 'Nóri minden egyes részletet tudja, és te is ötleteket hozol. Alig várjátok a conokat.' },
        { id: 'n_trip', who: 'nori', name: 'Közös con-út', desc: 'Együtt mentek egy fesztiválra.', cost: 25000, energy: 25, cd: 8, bond: 12, conf: 80, comm: 8, minBond: 50, minAge: 16, special: 'con',
          text: 'Egy egész hétvége nevetés, fotók és új ismerősök. A hazaúton Nóri vállán alszol el.', great: 'Az egyik panel után egy idegen odajön, és azt mondja, hogy inspirálóak vagytok. Életed egyik legszebb hétvégéje.' },

        { id: 'k_lunch', who: 'kata', name: 'Közös ebéd', desc: 'Egy kis szünet a munka közepén.', cost: 2500, energy: 8, cd: 1, bond: 5, conf: 12, needs: { job: true },
          text: 'Egy gyors ebéd és sok pletyka. Visszafelé jó hangulatban mentek vissza az irodába.', great: 'Kata elmeséli, hogyan kezdte a pályáját, te pedig az első munkahelyi napodról mesélsz. Mindketten nevettek.' },
        { id: 'k_help', who: 'kata', name: 'Segítesz egy projektben', desc: 'Lelkesen beszállsz Kata nehéz feladatába.', cost: 0, energy: 18, cd: 2, bond: 6, conf: 20, needs: { job: true }, special: 'bonus',
          text: 'Kata nagyon hálás, és a főnök is észreveszi a segítséget. Kapsz egy kis jutalmat.', great: 'A projekt időre elkészül, és a főnök név szerint köszöni meg a munkátokat. A jutalom sem marad el.' },
        { id: 'k_after', who: 'kata', name: 'Munka utáni limonádé', desc: 'Egy kellemes este a teraszon.', cost: 3500, energy: 12, cd: 3, bond: 7, conf: 24, minBond: 20, needs: { job: true },
          text: 'Esti fények, limonádé és őszinte beszélgetés. Kata megjegyzi, hogy mennyire szívesen dolgozik veled.', great: 'Kata elmondja, hogy neked köszönheti, hogy újra szereti a munkáját. Hazafelé végig mosolyogsz.' },
        { id: 'k_mentor', who: 'kata', name: 'Tanácsot kérsz', desc: 'Kata tapasztalt, és szívesen tanít.', cost: 0, energy: 14, cd: 4, bond: 5, conf: 10, minBond: 35, needs: { job: true }, skillPts: { _active: 20 },
          text: 'Kata türelmesen elmagyarázza a titkait, te pedig szorgalmasan jegyzetelsz. Az aktív képességed gyorsabban fejlődik.', great: 'Egy tanács, amit hónapok óta kerestél. Kata mosolyogva legyint: „Én is így tanultam.”' },

        { id: 'f_talk', who: 'csalad', name: 'Beszélgetés', desc: 'Egy csésze tea és egy kis nyugalom.', cost: 0, energy: 6, cd: 1, bond: 3, conf: 5,
          text: 'Anyával és apával megbeszélitek a hetet. Nem mondtok sokat, de jó együtt lenni.', great: 'Apa mesél egy régi történetet a gyerekkorodról, te pedig hosszan nevetsz. Anya mosolyogva tölt még teát.' },
        { id: 'f_dinner', who: 'csalad', name: 'Családi vacsora', desc: 'A régi, jól ismert ízek.', cost: 0, energy: 10, cd: 2, bond: 6, conf: 10,
          text: 'A vacsora meleg, az asztal körül mindenki jókedvű. Hazafelé (vagy a szobádban) még mindig érzed az ízt.', great: 'Anya a kedvenc ételedet főzte, és apa tréfásan megkérdezi, hogy mikor jössz haza. Mindenki nevet.' },
        { id: 'f_help', who: 'csalad', name: 'Segítesz otthon', desc: 'Pár kisebb házimunka.', cost: 0, energy: 14, cd: 2, bond: 6, conf: 8, special: 'allowance',
          text: 'Kitakarítasz, bevásárolsz és segítesz a főzésben. A szüleid észrevehetően jókedvűek lesznek.', great: 'Anya mosolyogva megjegyzi, hogy milyen jó kezekben van a ház. Apa pedig megölel.' },
        { id: 'f_visit', who: 'csalad', name: 'Hazalátogatás', desc: 'Vonatjegy, és egy nap otthon.', cost: 4000, energy: 14, cd: 3, bond: 8, conf: 20, needs: { moved: true },
          text: 'Egy nap otthon: anya főz, apa kérdezgeti a munkádat. A szobád pont úgy van, ahogy hagytad.', great: 'Anya meghatódik, apa pedig sokáig nézi az új ruháidat. „Jól áll” – mondja végül.' },
        { id: 'f_honest', who: 'csalad', name: 'Őszinte beszélgetés', desc: 'Végre kimondjátok, ami eddig kimondatlan volt.', cost: 0, energy: 18, cd: 6, bond: 12, conf: 60, minBond: 45, needs: { out: true, parentsTense: true }, special: 'parents',
          text: 'Hosszan beszélgettek, és a végén a szüleid megígérik, hogy igyekeznek megérteni.', great: 'Anya sír, apa csendesen megkérdezi, hogy miben segíthet. Valami végleg a helyére kerül.' },

        { id: 'z_msg', who: 'zsombor', name: 'Üzenet', desc: 'Egy apró üzenet és egy hosszú nap.', cost: 0, energy: 6, cd: 1, bond: 4, conf: 10,
          text: 'Egy-két üzenet, egy cica-matrica. A szíved kicsit gyorsabban ver a szokásosnál.', great: 'Zsombor egy hosszú üzenetet küld, tele kedves apróságokkal. Percekig bámulod a telefonodat és mosolyogsz.' },
        { id: 'z_coffee', who: 'zsombor', name: 'Kávé', desc: 'Egy óra a kávézóban.', cost: 3000, energy: 12, cd: 2, bond: 7, conf: 22, minBond: 10, look: true,
          text: 'Egy kávé és egy óra beszélgetés. Zsombor ugyanolyan jól nevet, mint amilyennek elképzelted.', great: 'Észre sem veszitek, hogy a kávézó bezár. Zsombor szerint „még soha nem volt ennyire gyors egy óra”.' },
        { id: 'z_walk', who: 'zsombor', name: 'Esti séta', desc: 'A város fényei és a lassú lépések.', cost: 0, energy: 14, cd: 2, bond: 8, conf: 26, minBond: 25,
          text: 'A parton sétáltok, és nem is kell semmit mondani. Zsombor keze véletlenül a tiédhez ér.', great: 'Egy lámpaoszlop alatt megálltok, és Zsombor halkan azt mondja: „Jó, hogy itt vagy.”' },
        { id: 'z_date', who: 'zsombor', name: 'Randira hívod', desc: 'A nagy kérdés. Ha összejön, minden megváltozik.', cost: 8000, energy: 20, cd: 3, bond: 12, conf: 120, minBond: 40, needs: { partner: false }, special: 'date', look: true,
          text: 'Zsombor mosolyogva igent mond. Hazafelé úgy érzed, hogy mosolyogsz anélkül, hogy észrevennéd.', great: 'Zsombor meghívott, mielőtt még kimondtad volna. Az este végén megfogja a kezed.' },
        { id: 'z_evening', who: 'zsombor', name: 'Közös este', desc: 'Vacsora, film és a megszokott nevetés.', cost: 6000, energy: 16, cd: 2, bond: 6, conf: 60, needs: { partner: true }, look: true,
          text: 'Közös vacsora, kedvenc film, pár csendes pillanat. Ezt akár minden este megismételnéd.', great: 'Zsombor egy kis ajándékkal lep meg, rajta egy macskafüles matrica. Nevetve ragasztod a laptopodra.' },
        { id: 'z_gift', who: 'zsombor', name: 'Meglepetés-ajándék', desc: 'Egy apróság, amit magad választottál.', cost: 12000, energy: 8, cd: 6, bond: 10, conf: 40, minBond: 50, needs: { partner: true },
          text: 'Zsombor meghatódik az ajándéktól, és te is, amikor meglátod az arcát.', great: 'Zsombor percekig nem találja a szavakat, csak megölel. „Ez a legjobb ajándék, amit kaptam.”' }
    ];
    D.SOCIAL_DECAY_AFTER = 4;     // ennyi hónap kapcsolat nélkül kezd kopni a kötelék
    D.SOCIAL_DECAY = 1;           // havi kopás

    // ---------- Élmények (ismételhető pénznyelők, tartós hatás nélkül) ----------
    D.EXPERIENCES = [
        { id: 'koncert', name: 'Koncert és kirándulás', cost: 35000, cd: 4, minAge: 16, conf: 200, comm: 2, desc: 'Egy jó este a kedvenc zenekarral.', text: 'A koncert alatt egyszerre éneklitek ugyanazt a dalt. Hazafelé még órákig dúdolsz.' },
        { id: 'wellness', name: 'Hétvégi wellness', cost: 45000, cd: 6, minAge: 18, conf: 150, energy: true, desc: 'Teljes pihenés: az energiád feltöltődik.', text: 'Két nap csend, gőz és tea. Teljesen megújulva térsz haza.' },
        { id: 'fotozas', name: 'Profi fotózás', cost: 60000, cd: 8, minAge: 16, conf: 300, comm: 4, desc: 'Egy fotós megörökíti a legjobb stílusodat.', text: 'A fotós azt mondja: „Úgy mozogsz, mintha egész életedben ezt csináltad volna.” A képek hetekig a profilképeid lesznek.' },
        { id: 'konferencia', name: 'Szakmai konferencia', cost: 120000, cd: 10, minAge: 20, comm: 10, skillPts: 60, needsJob: true, desc: 'Tanulás és kapcsolatépítés. Az aktív képességed fejlődik.', text: 'Három nap, száz előadás, ezer új ismerős. Az egyik workshop után rájössz, mi hiányzott eddig.' },
        { id: 'adomany', name: 'Adomány a közösségnek', cost: 100000, cd: 12, minAge: 20, conf: 800, comm: 20, minComm: 20, desc: 'Támogatod a szervereket, conokat és a segítőket.', text: 'A neved felkerül a támogatók falára. A visszajelzések rendkívül kedvesek.' },
        { id: 'utazas', name: 'Külföldi utazás', cost: 380000, cd: 12, minAge: 20, conf: 2500, comm: 15, minSkill: { angol: 2 }, desc: 'Egy másik ország, egy másik nyelv, ugyanaz a stílus.', text: 'Egy idegen városban sétálsz, és senki nem ismer. Azt tapasztalod, hogy a stílusod mindenhol ugyanolyan jól áll.' }
    ];

    // ---------- Számítógépek ----------
    D.COMPUTERS = [
        { id: 'csaladi', name: 'Családi gép a nappaliban', cost: 0, study: 0, online: 0, upkeep: 0, desc: 'Mindenki látja, mit csinálsz rajta.' },
        { id: 'laptop', name: 'Használt laptop', cost: 60000, study: 0.5, online: 0.3, upkeep: 0, desc: 'Lassú, de a tiéd. Végre privát.' },
        { id: 'pc', name: 'Irodai PC', cost: 150000, study: 1, online: 0.8, upkeep: 3000, desc: 'Stabil munkaeszköz, mindenre jó.' },
        { id: 'gamer', name: 'Gamer PC', cost: 320000, study: 1.8, online: 2, upkeep: 4000, desc: 'RGB, gyors, és a játékok is futnak rajta.' },
        { id: 'dual', name: 'Dupla monitor + headset', cost: 520000, study: 2.8, online: 4, upkeep: 5000, desc: 'Tanulás az egyik, chat a másik képernyőn.' },
        { id: 'studio', name: 'Stream-stúdió', cost: 850000, study: 4, online: 8, upkeep: 6000, desc: 'Kamera, mikrofon, gyűrűs lámpa.' },
        { id: 'workstation', name: 'Workstation', cost: 1400000, study: 6, online: 14, upkeep: 8000, desc: 'A csúcs. Minden gyorsan megy.' }
    ];

    // ---------- Képességek (0-5 szint) ----------
    D.SKILL_MAX = 5;
    D.SKILL_COST = [40, 90, 200, 440, 970]; // az n. szintre lépéshez szükséges tanulási pont
    D.SKILLS = [
        { id: 'rajz', name: 'Digitális rajz', comp: 1, desc: 'Megrendelések (havi bevétel) és kreativitás.', perLevel: 'Szintenként +8 000 Ft/hó freelance, +0,3 önbizalom/mp' },
        { id: 'prog', name: 'Programozás', comp: 1, desc: 'Informatikai állások és freelance munka.', perLevel: 'A 2. szinttől +6 000 Ft/hó freelance szintenként' },
        { id: 'varras', name: 'Varrás és cosplay', comp: 0, desc: 'Olcsóbb ruhák és saját jelmezek.', perLevel: 'Szintenként −5% ruhaár, +0,3 önbizalom/kattintás' },
        { id: 'smink', name: 'Smink és stílus', comp: 0, desc: 'Biztosabb kéz, szebb eredmény. A haladó kozmetikumok szintet kérnek.', perLevel: 'Szintenként +0,5 önbizalom/kattintás, új sminkek a Smink fülön' },
        { id: 'angol', name: 'Angol nyelv', comp: 1, desc: 'Nemzetközi közösség, jobb állások.', perLevel: 'Szintenként +0,2 önbizalom/mp' },
        { id: 'stream', name: 'Streamelés', comp: 3, desc: 'Élő adás: közönség és bevétel (stúdió kell hozzá).', perLevel: 'Szintenként havi bevétel a közösség méretéből (Dupla monitor felett)' }
    ];

    // ---------- Munkák ----------
    // pay: havi nettó bér, click: bevétel egy "Műszak" kattintásra, hours: part (fél állás) / full (teljes)
    D.JOBS = [
        { id: 'fagyi', name: 'Hétvégi fagylaltos', minAge: 16, hours: 'part', pay: 18000, click: 300, needs: {}, desc: 'Strand, nyár, hűtőpult.', notes: ['A strandon egy kisfiú háromszor kér ugyanazt az ízt, és minden alkalommal újra meggondolja magát.', 'Forró nap, hosszú sor. Estére a lábad lángol, de a borravaló tele van a bögrében.'] },
        { id: 'bolt', name: 'Boltos eladó', minAge: 17, hours: 'part', pay: 35000, click: 450, needs: {}, desc: 'Délutáni műszakok a sarki boltban.', notes: ['Egy visszatérő vásárló mindig megkérdezi, hogy vagy. Kezdesz hozzászokni.', 'A főnök megdicsér, mert a polcokat úgy rendezted el, ahogy még senki.'] },
        { id: 'iroda', name: 'Irodai asszisztens', minAge: 18, hours: 'full', pay: 150000, click: 700, needs: { angol: 1 }, desc: 'Levelek, naptárak, kávé.', notes: ['A reggeli megbeszélésen a főnök téged kér meg, hogy foglald össze a heti teendőket.', 'A nyomtató ma megint megpuhult. Te javítod meg, mert tudod, melyik gombot kell nyomni.'] },
        { id: 'ugyfel', name: 'Ügyfélszolgálatos', minAge: 18, hours: 'full', pay: 165000, click: 750, needs: { angol: 2 }, desc: 'Telefon, chat, türelem.', notes: ['Egy ügyfél a végén azt mondja: „Maga a legkedvesebb, akivel ma beszéltem.”', 'Nehéz hívás, de megoldod. A csapat tapsol.'] },
        { id: 'webjr', name: 'Junior webfejlesztő', minAge: 19, hours: 'full', pay: 260000, click: 1000, needs: { prog: 2 }, comp: 2, desc: 'Az első igazi kódolós állásod.', notes: ['A kódod elsőre lefut. Gyanús. Aztán kiderül, hogy tényleg jó.', 'A senior kolléga megdicsér a code review-n. Egész nap mosolyogsz.'] },
        { id: 'grafikus', name: 'Grafikus', minAge: 20, hours: 'full', pay: 240000, click: 950, needs: { rajz: 3 }, comp: 2, desc: 'Plakátok, logók, arculatok.', notes: ['Az ügyfél a harmadik körben is a „kicsit pasztellebb, kicsit bátrabb” színt kéri. Pontosan érted, mire gondol.', 'A logód felkerül egy helyi cég homlokzatára. Fotót küldesz haza.'] },
        { id: 'jelmez', name: 'Jelmezkészítő műhely', minAge: 20, hours: 'full', pay: 210000, click: 850, needs: { varras: 4 }, desc: 'Színház, con, fotózás. Neked varrnak, te varrsz.', notes: ['Egy színház megrendel tőled hat jelmezt. A méretvételnél mindenki kedves és türelmes.', 'A kedvenc varrógéped megint kiakadt, de te tudod, hol kell megütni.'] },
        { id: 'web', name: 'Webfejlesztő', minAge: 21, hours: 'full', pay: 420000, click: 1500, needs: { prog: 3, angol: 2 }, comp: 2, desc: 'Önálló projektek, saját döntések.', notes: ['Egy ügyfél a kész oldalra azt mondja: „Ennél szebbet nem is kérhettem volna.”', 'A csapat új tagja téged kér meg, hogy mentoráld.'] },
        { id: 'streamer', name: 'Főállású streamer', minAge: 22, hours: 'full', pay: 220000, click: 900, needs: { stream: 4 }, comp: 5, comm: 300, desc: 'Élő adás a közösségeddel. Mellé szponzorok.', notes: ['Az élő adás alatt a chat tele van szívekkel. Valaki donate-ot küld egy ölelés-emojival.', 'A szponzor szerződést ajánl. Remeg a kezed, amikor aláírod.'] },
        { id: 'artdir', name: 'Art director', minAge: 23, hours: 'full', pay: 540000, click: 1900, needs: { rajz: 5, angol: 2 }, comp: 3, desc: 'Te mondod meg, hogyan nézzen ki a végeredmény.', notes: ['A nagy kampány bemutatóján te állsz ki a színpadra. A csapat tapsol.', 'Egy fiatal kolléga megkérdezi, hogyan lett belőled art director. Nevetsz, aztán elmeséled.'] },
        { id: 'senior', name: 'Senior fejlesztő', minAge: 23, hours: 'full', pay: 620000, click: 2200, needs: { prog: 5, angol: 3 }, comp: 3, desc: 'A csapat gerince. A kód a te nyelved.', notes: ['Egy kritikus hibát te találsz meg hajnali háromkor, és reggelre kész a javítás. A csapat tortával vár.', 'A cég vezetője megkérdezi, hogy mit tudnak tenni, hogy maradj. Jó érzés.'] }
    ];
    // Alkalmi munka (nincs állás): a Műszak gomb ennyit hoz
    D.CASUAL = [
        { maxAge: 16, name: 'Kutyasétáltatás', click: 250 },
        { maxAge: 99, name: 'Alkalmi munka', click: 500 }
    ];
    D.ALLOWANCE = [{ maxAge: 15, pay: 6000 }, { maxAge: 16, pay: 8000 }, { maxAge: 17, pay: 10000 }, { maxAge: 18, pay: 12000 }];
    D.SCHOLARSHIP = 25000;
    D.FREELANCE_RAJZ = 8000;
    D.FREELANCE_PROG = 6000;
D.STREAM_BASE = 4000;      // streamelés: szint * (STREAM_BASE + közösség * STREAM_PER_COMM)
D.STREAM_PER_COMM = 20;

    // ---------- Lakások ----------
    D.HOUSING = [
        { id: 'szulo', name: 'Szülői ház', rent: 0, living: 0, deposit: 0, minAge: 0, comfort: 0, desc: 'Otthon. Biztonságos, de mindenki mindent lát.' },
        { id: 'kolesz', name: 'Kollégium', rent: 18000, living: 25000, deposit: 20000, minAge: 18, comfort: 1, needsStudent: true, desc: 'Szűk szoba, jó társaság.' },
        { id: 'szoba', name: 'Albérleti szoba', rent: 60000, living: 30000, deposit: 120000, minAge: 18, comfort: 2, desc: 'Egy saját szoba egy közös lakásban.' },
        { id: 'garzon', name: 'Garzon', rent: 110000, living: 35000, deposit: 220000, minAge: 20, comfort: 3, desc: 'Teljesen a tiéd. Csak a falak vékonyak.' },
        { id: 'lakas', name: 'Saját lakás', rent: 190000, living: 45000, deposit: 700000, minAge: 22, comfort: 4, desc: 'Erkély, napfény, és végre a saját helyed.' }
    ];

    // ---------- Merész lépések (önbizalomból vásárolható, tartós bónuszok) ----------
    D.STEPS = [
        { id: 'tukor1', name: 'Zárt ajtó mögött felpróbálsz valamit', cost: 20, click: 0.5, minAge: 0, text: 'Zárt ajtó mögött felpróbálsz valamit, és jól érzed magad benne.' },
        { id: 'alnev', name: 'Álneves fiókot nyitsz', cost: 60, passive: 0.1, minAge: 15, text: 'Létrehozol egy álneves fiókot. Elsőként követsz pár hasonló embert.' },
        { id: 'barat', name: 'Elmondod egy jó barátodnak', cost: 150, passive: 0.3, comm: 2, minAge: 16, text: 'Elmondod egy jó barátodnak. Csak annyit mond: „Ennyi? Tudtam.”' },
        { id: 'kirakat', name: 'Beállsz egy ruhabolt kirakata elé', cost: 350, click: 1, minAge: 16, text: 'Egy ruhabolt kirakata előtt megállsz, és hosszan nézed, mit vennél. Nem fordulsz el.' },
        { id: 'foto', name: 'Feltöltesz egy fotót (arc nélkül)', cost: 800, passive: 1, minAge: 16, text: 'Feltöltöd az első fotódat arc nélkül. Kedvelések gyűlnek, a szíved ugrál.' },
        { id: 'utca', name: 'Kimész úgy az utcára', cost: 1800, click: 2, minAge: 17, risk: 4, text: 'Kimész az utcára úgy, ahogy valójában szeretnél. Senki nem szól semmit.' },
        { id: 'nev', name: 'Felvállalod a neved az interneten', cost: 4000, passive: 4, minAge: 17, text: 'A saját neveddel jelentkezel be. A visszajelzések kedvesek.' },
        { id: 'jelmez', name: 'Jelmezben mész egy találkozóra', cost: 9000, click: 5, minAge: 18, text: 'Jelmezben érkezel egy találkozóra. Mindenki tapsol, ahogy belépsz.' },
        { id: 'szinpad', name: 'Kiállsz egy színpadra', cost: 20000, passive: 12, minAge: 20, text: 'Kiállsz egy kis színpadra, és elmondod, ki vagy. A közönség tapsol.' },
        { id: 'munka', name: 'Nyíltan vállalod a munkahelyen', cost: 45000, passive: 25, minAge: 20, text: 'A munkahelyeden is önmagad vagy. A csapat elfogad.' },
        { id: 'mentor', name: 'Másoknak segítesz', cost: 100000, passive: 60, minAge: 21, text: 'Egy kezdőnek tanácsot adsz. Észreveszed, mennyit fejlődtél.' },
        { id: 'ongam', name: 'Teljesen önmagad vagy', cost: 220000, click: 20, passive: 120, minAge: 22, text: 'Nem játszol szerepet. Nem rejtegetsz semmit. Egyszerűen te vagy.' }
    ];

    // ---------- Kaszinó (csak 18 éves kortól, játékpénzzel) ----------
    // Minden játék kicsit a ház javára dől (az RTP < 1). A tesztek pontosan kiszámolják.
    D.CASINO_MIN_AGE = 18;
    D.GAMBLE_LIMITS = [
        { id: 10000, label: '10 000 Ft / hó' },
        { id: 50000, label: '50 000 Ft / hó' },
        { id: 250000, label: '250 000 Ft / hó' },
        { id: 0, label: 'Nincs keret' }
    ];
    D.GAMBLE_DEFAULT_LIMIT = 10000;
    D.SELF_EXCLUDE_MONTHS = 6;

    // Kaparós sorsjegy: a nyeremény a tét szorzója
    D.SCRATCH = {
        bets: [500, 1000, 2000],
        outcomes: [ // {mult, p}; a várható megtérülés (RTP) kb. 0,88
            { mult: 0, p: 0.748 },
            { mult: 1, p: 0.12 },
            { mult: 2, p: 0.08 },
            { mult: 5, p: 0.04 },
            { mult: 20, p: 0.01 },
            { mult: 100, p: 0.002 }
        ]
    };
    // Nyerőgép: 3 henger, súlyozott szimbólumok
    D.SLOT = {
        bets: [1000, 5000, 20000],
        symbols: [
            { id: 'szív', weight: 6, triple: 6 },
            { id: 'csillag', weight: 5, triple: 8 },
            { id: 'cica', weight: 4, triple: 12 },
            { id: 'pulcsi', weight: 3, triple: 25 },
            { id: 'hetes', weight: 2, triple: 60 }
        ],
        pair: 0.8 // pontosan két egyforma szimbólum: a tét 80%-a (még így is veszteség)
    };
    // Duplázás: pénzfeldobás
    D.COIN = { bets: [1000, 5000, 20000], winP: 0.47, mult: 2 };

    // ---------- Ellenőrzött egyszerű segédek (a motor használja) ----------
    D.find = function (list, id) {
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof globalThis !== 'undefined' ? globalThis : this);
