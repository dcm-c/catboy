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
    D.SLOTS = [
        { id: 'hair', label: 'Haj' },
        { id: 'top', label: 'Felső' },
        { id: 'bottom', label: 'Alsó' },
        { id: 'legs', label: 'Lábszár' },
        { id: 'neck', label: 'Nyak' },
        { id: 'face', label: 'Arc' }
    ];

    D.ITEMS = [
        { id: 'hajgumi', slot: 'hair', name: 'Pasztell hajgumi', cost: 1500, click: 0.2, passive: 0, risk: 3, desc: 'Apróság, de a tiéd.', notes: [{ tone: 'good', text: 'Valaki a buszon megdicséri a hajgumidat: „Ez nagyon aranyos színű.”' }] },
        { id: 'masni', slot: 'hair', name: 'Selyem hajmasni', cost: 4500, click: 0.5, passive: 0, risk: 5, desc: 'Egy masni, ami mindent megváltoztat.', notes: [{ tone: 'good', text: 'A pénztáros mosolyogva megjegyzi, hogy milyen szép a masnid.' }] },
        { id: 'macskaful', slot: 'hair', name: 'Macskafüles fejpánt', cost: 9000, click: 1, passive: 0.3, risk: 9, desc: 'A klasszikus. Nyau.', notes: [{ tone: 'good', text: 'A villamoson egy kislány odasúgja az anyukájának: „Nézd, cicafüle!”' }, { tone: 'funny', text: 'Egy idegen megkérdezi, hogy a füled mozog-e. Tudományos kíváncsiság.' }] },
        { id: 'virag', slot: 'hair', name: 'Virágkoszorú', cost: 22000, click: 2, passive: 0.5, risk: 5, desc: 'Mintha egy tündérmesében járnál.', notes: [{ tone: 'good', text: 'A parkban egy fotós megkér, hogy lefényképezhet-e a virágkoszorúddal.' }] },
        { id: 'parokni', slot: 'hair', name: 'Profi paróka', cost: 120000, click: 6, passive: 1, risk: 8, desc: 'Hosszú, pasztell, és olyan természetes, hogy te is meglepődsz.', notes: [{ tone: 'good', text: 'Egy fodrász megáll melletted: „Ez nem is paróka? Hihetetlenül jól áll.”' }] },

        { id: 'polo', slot: 'top', name: 'Pasztell póló', cost: 3500, click: 0.3, passive: 0, risk: 4, desc: 'Puha, rózsaszín, és pont jó rád.', notes: [{ tone: 'good', text: 'Az osztályból valaki megkérdezi, hol vetted a pólót. Tetszik neki.' }] },
        { id: 'pulcsi', slot: 'top', name: 'Oversize pulcsi', cost: 8000, click: 0.8, passive: 0, risk: 3, desc: 'Három számmal nagyobb, tízszer kényelmesebb.', notes: [{ tone: 'funny', text: 'Valaki szerint „ebben elfér még egy cica is”. Nem is tévedett nagyot.' }] },
        { id: 'crop', slot: 'top', name: 'Crop top', cost: 15000, click: 1.5, passive: 0, risk: 10, desc: 'Magabiztos darab, nem kispályás.', notes: [{ tone: 'bad', text: 'Egy idegen félhangosan megjegyzi a crop topod miatt, hogy „ez meg mi akar lenni”.' }] },
        { id: 'bluz', slot: 'top', name: 'Masnis selyemblúz', cost: 38000, click: 3, passive: 0.5, risk: 6, desc: 'Elegáns, puha, és olyan, mint egy mese.', notes: [{ tone: 'good', text: 'Valaki a kávézóban megáll az asztalodnál: „Ez a blúz csodálatos, hol találtad?”' }] },
        { id: 'kabat', slot: 'top', name: 'Pasztell dizájner kabát', cost: 160000, click: 7, passive: 1, risk: 7, desc: 'Kézzel varrt, egyedi darab. Mindenki megfordul utánad.', notes: [{ tone: 'good', text: 'Az utcán valaki megkérdezi, hogy melyik divatházé a kabátod. „Egy barátomé” — mondod büszkén.' }] },

        { id: 'rovid', slot: 'bottom', name: 'Magas derekú rövidnadrág', cost: 6000, click: 0.5, passive: 0, risk: 5, desc: 'Nyárias és bátor.', notes: [] },
        { id: 'szoknya', slot: 'bottom', name: 'Plisszírozott szoknya', cost: 13000, click: 1.5, passive: 0, risk: 12, desc: 'Egy pörgés, és mindenki tudja, ki vagy.', notes: [{ tone: 'funny', text: 'Szeles nap van, a szoknyád úgy viselkedik, mint egy vitorla. A hajad is. Minden.' }, { tone: 'bad', text: 'Két srác nevetgél a szoknyád láttán, de egyikük utána odaszól: „Jó cucc, tényleg.”' }] },
        { id: 'tenisz', slot: 'bottom', name: 'Tenisz szoknya', cost: 24000, click: 2.5, passive: 0, risk: 11, desc: 'Sportos és aranyos egyszerre.', notes: [{ tone: 'good', text: 'A parkban valaki megkérdezi, hogy teniszezel-e. „Most már igen” — vágod rá.' }] },
        { id: 'kilt', slot: 'bottom', name: 'Kockás kilt', cost: 30000, click: 3.2, passive: 0, risk: 9, desc: 'Skót hagyomány, femboy lelkület.', notes: [{ tone: 'funny', text: 'Egy idős úr szerint „a kilt a férfiruhák királya”. Egyetértesz.' }] },
        { id: 'estelyi', slot: 'bottom', name: 'Selyem estélyi szoknya', cost: 140000, click: 6, passive: 0.5, risk: 8, desc: 'Földig érő, selymes, és minden mozdulatnál hullámzik.', notes: [{ tone: 'funny', text: 'A szoknyád akkora, hogy a villamoson két embernek kell odébb lépnie. Te nevetsz a legjobban.' }] },

        { id: 'zokni', slot: 'legs', name: 'Pasztell térdzokni', cost: 3200, click: 0.4, passive: 0, risk: 4, desc: 'Az első lépés a megfelelő irányba.', notes: [] },
        { id: 'combzokni', slot: 'legs', name: 'Combzokni', cost: 7500, click: 1.2, passive: 0, risk: 9, desc: 'Egyszerűen kell. Nem kell magyarázni.', notes: [{ tone: 'good', text: 'Egy lány az utcán megáll: „Hol van ilyen combzokni? Muszáj tudnom.”' }] },
        { id: 'harisnya', slot: 'legs', name: 'Csipke harisnya', cost: 19000, click: 2.5, passive: 0, risk: 8, desc: 'Finom, törékeny, és rád van szabva.', notes: [] },

        { id: 'choker', slot: 'neck', name: 'Bársony choker', cost: 5200, click: 0.8, passive: 0, risk: 7, desc: 'Egy kis csengővel, ami minden lépésnél csilingel.', notes: [{ tone: 'good', text: 'A kollégád odaszól: „Szép a chokered, úgy csilingel, mint egy kis macska.”' }] },
        { id: 'nyakmasni', slot: 'neck', name: 'Nyakmasni', cost: 9500, click: 1.2, passive: 0, risk: 4, desc: 'Egyszerre iskolás és elegáns.', notes: [] },
        { id: 'medal', slot: 'neck', name: 'Csillagos medál', cost: 16000, click: 1.5, passive: 0.2, risk: 3, desc: 'Egy apró csillag a szíved fölött.', notes: [] },
        { id: 'gyongy', slot: 'neck', name: 'Gyöngysor', cost: 110000, click: 4, passive: 1, risk: 3, desc: 'Finom, régimódi és tökéletesen klassz.', notes: [{ tone: 'good', text: 'Egy idős hölgy odaszól: „Ritka, hogy valaki ilyen szépen viseli a gyöngyöt.”' }] },

        { id: 'pir', slot: 'face', name: 'Pír (blush)', cost: 2600, click: 0.4, passive: 0, risk: 6, desc: 'Egy kis szín az arcodra.', notes: [] },
        { id: 'szemuveg', slot: 'face', name: 'Kerek szemüveg', cost: 12000, click: 1, passive: 0.2, risk: 2, desc: 'Okos és aranyos. Mindkettő igaz.', notes: [{ tone: 'good', text: 'Valaki a könyvtárban szerint a kerek szemüvegedtől olyan vagy, mint egy mesehős.' }] },
        { id: 'smink', slot: 'face', name: 'Teljes smink-szett', cost: 21000, click: 3, passive: 0, risk: 12, desc: 'Szempillaspirál, szájfény, pír. A teljes csomag.', notes: [{ tone: 'good', text: 'Egy sminkes lány megáll melletted: „Ki csinálta a sminkedet? Nagyon profi.”' }] }
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
        { id: 'poszter', name: 'Posztererek a falon', cost: 4000, passive: 0.1, desc: 'Kedvenc animék és zenekarok.' },
        { id: 'zaszlo', name: 'Pasztell zászló', cost: 6000, passive: 0.15, desc: 'Egy kis büszkeség a falon.' },
        { id: 'ledfeny', name: 'LED fényfüzér', cost: 9000, passive: 0.3, desc: 'Hangulatos esték.' },
        { id: 'agytakaro', name: 'Puha plédek és párnák', cost: 11000, passive: 0.2, regen: 0.2, desc: 'A legjobb pihenőfészek.' },
        { id: 'novenyek', name: 'Szobanövények', cost: 15000, passive: 0.3, desc: 'Élő zöld a szobában.' },
        { id: 'tukor', name: 'Teljes alakos tükör', cost: 18000, click: 1, desc: 'Végre látod magad tetőtől talpig.' },
        { id: 'polc', name: 'Gyűjtői polc (figurák)', cost: 26000, passive: 0.5, desc: 'Kis figurák, nagy szeretet.' }
    ];
    D.PETS = [
        { id: 'cica', name: 'Cica', cost: 25000, passive: 0.6, regen: 0.3, desc: 'Örökbefogadott cica. A billentyűzeten alszik.', needsHome: ['szoba', 'garzon', 'lakas'] }
    ];


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
        { id: 'smink', name: 'Smink és stílus', comp: 0, desc: 'Biztosabb kéz, szebb eredmény.', perLevel: 'Szintenként +0,5 önbizalom/kattintás' },
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
