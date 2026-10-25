// =========================================================
// ÉRTÉKTEST - a korábbi tesztverziók adatai (a régi megosztott linkek helyes megjelenítéséhez)
//   v1: 5 tengely, 15 típus, politikai-ideológiai utált értékek
//   v2: 5 tengely, 15 típus, társadalmi utált értékek (ez a készlet a v3-ban is megmaradt)
// Ezt nem szabad módosítani: a régi linkek a bennük tárolt számokat ezekkel a nevekkel és típusokkal olvassák vissza.
// =========================================================
(function (root) {
    'use strict';

    var AXES_5 = [
        {
            "id": "e",
            "name": "Gazdaság",
            "icon": "💶",
            "negIcon": "🛍️",
            "posIcon": "🏥",
            "neg": "Szabadpiac",
            "pos": "Elosztó állam"
        },
        {
            "id": "l",
            "name": "Társadalom",
            "icon": "⚖️",
            "negIcon": "🕊️",
            "posIcon": "🛂",
            "neg": "Szabadság",
            "pos": "Rend"
        },
        {
            "id": "n",
            "name": "Közösség",
            "icon": "🗺️",
            "negIcon": "✈️",
            "posIcon": "🏡",
            "neg": "Világpolgár",
            "pos": "Nemzeti"
        },
        {
            "id": "t",
            "name": "Értékek",
            "icon": "⏳",
            "negIcon": "🚀",
            "posIcon": "🏺",
            "neg": "Haladó",
            "pos": "Hagyománytisztelő"
        },
        {
            "id": "c",
            "name": "Bizalom",
            "icon": "🤝",
            "negIcon": "🌞",
            "posIcon": "🧐",
            "neg": "Bizakodó",
            "pos": "Cinikus"
        }
    ];

    var ARCHETYPES_15 = [
        {
            "id": "vitorlazo",
            "emoji": "⛵",
            "title": "A Hétvégi Vitorlázó Liberális",
            "v": {
                "e": -0.7,
                "l": -0.6,
                "n": -0.5,
                "t": -0.6,
                "c": 0.1
            },
            "desc": "Szerinted az állam akkor jó, ha nem látszik. A Balatonon a saját vitorlásodat részesíted előnyben, a kormányzást pedig a szezonális szél mintájára képzeled el: ha fúj, jó, ha nem, nem avatkozunk bele.",
            "sunday": "Vasárnapi ebéden te vagy, aki azt mondja: „De mi lenne, ha kevesebb szabály lenne?”, majd elhal a beszélgetés."
        },
        {
            "id": "kavehaz",
            "emoji": "☕",
            "title": "A Kávéházi Világjavító",
            "v": {
                "e": 0.5,
                "l": -0.7,
                "n": -0.6,
                "t": -0.7,
                "c": 0.2
            },
            "desc": "Minden problémára van egy kávé, egy tanulmány és egy hosszú Facebook-hozzászólás. A világot jobbá teszed, de előbb még elmondod, hogy az előző kávéház jobb volt.",
            "sunday": "Ebéden az első húsleves után már a harmadik reformot vázolod egy szalvétán."
        },
        {
            "id": "nagyapa",
            "emoji": "🌻",
            "title": "A Kiskerti Nagypapa",
            "v": {
                "e": 0.1,
                "l": 0.6,
                "n": 0.7,
                "t": 0.8,
                "c": 0.3
            },
            "desc": "Tudod, hogyan kell paradicsomot nevelni, és azt is, hogy mi romlott el a világban. Szerinted a rend, a hagyomány és a jó hazai szilva a három pillér, a többi csak divat.",
            "sunday": "Vasárnap te vagy, aki a kertből hoz fel egy szatyor zöldséget, és közben kikér egy véleményt a hírekről."
        },
        {
            "id": "palinka",
            "emoji": "🍑",
            "title": "A Szabad Pálinkafőző",
            "v": {
                "e": -0.5,
                "l": -0.8,
                "n": 0.5,
                "t": 0.5,
                "c": 0.4
            },
            "desc": "Büszke vagy a magyar hagyományokra, de utálod, ha valaki megmondja, hogyan kell csinálni. A kazán a tiéd, a recept a tiéd, a hatóság pedig maradjon a hivatalban.",
            "sunday": "Ebéden megkínálsz mindenkit, és közben kifejted az államtalanítás elméletét."
        },
        {
            "id": "szakszi",
            "emoji": "🛠️",
            "title": "A Szakszervezeti Veterán",
            "v": {
                "e": 0.8,
                "l": 0.2,
                "n": 0.3,
                "t": 0.4,
                "c": 0.1
            },
            "desc": "Szerinted a munkának tisztelete van, a bérnek minimuma, az ebédszünetnek pedig szent hossza. Minden vitából a kollektív szerződés felé tereled a témát.",
            "sunday": "Ebédnél felállsz, és megkérdezed, ki fizeti a túlórát. Senki sem válaszol."
        },
        {
            "id": "hazmester",
            "emoji": "🔑",
            "title": "A Határozott Házmester",
            "v": {
                "e": 0.1,
                "l": 0.9,
                "n": 0.5,
                "t": 0.6,
                "c": 0.1
            },
            "desc": "A lépcsőház tiszta, a kapukód titkos, a szabály az szabály. Szerinted a világ azért bonyolult, mert túl kevés benne a házirend.",
            "sunday": "Vasárnap te vagy, aki a tányért is rendben visszaviszi, és megjegyzi, ki hagyta nyitva az ajtót."
        },
        {
            "id": "nomad",
            "emoji": "💻",
            "title": "A Digitális Nomád Kakaóscsiga-Hiányban",
            "v": {
                "e": -0.6,
                "l": -0.4,
                "n": -0.8,
                "t": -0.8,
                "c": 0.3
            },
            "desc": "Ma Lisszabon, holnap valahol laptoppal. A hazádat szereted, csak éppen a wifi jobb máshol. Szerinted a határok rossz ötletek, a távmunka pedig emberi jog.",
            "sunday": "Ebéden felhívod a családot videón, mert épp nem vagy otthon. Sosem vagy."
        },
        {
            "id": "cinikus",
            "emoji": "🙄",
            "title": "Az Örök Cinikus (Mindenki Lop)",
            "v": {
                "e": 0,
                "l": 0,
                "n": 0,
                "t": 0,
                "c": 0.95
            },
            "desc": "Nem hiszel senkinek, semmiben, de legalább elég szórakoztatóan. Szerinted minden ígéret kampányszöveg, minden kampányszöveg ígéret, és a kettő között nincs különbség.",
            "sunday": "Ebédnél csak mosolyogsz: „Hát persze. Majd pont ezek.”"
        },
        {
            "id": "bekes",
            "emoji": "🕊️",
            "title": "A Békés Kompromisszum-Barát",
            "v": {
                "e": 0.1,
                "l": -0.1,
                "n": -0.1,
                "t": -0.1,
                "c": -0.7
            },
            "desc": "Hiszel a párbeszédben, a jó szándékban és abban, hogy a vitából valami jó is kisülhet. Néha túl naiv vagy, de legalább te nem veszel részt a kommentháborúkban.",
            "sunday": "Ebéden te vagy az, aki közli: „Mindenkinek igaza van egy kicsit”, majd elosztja a sütit."
        },
        {
            "id": "hazafias",
            "emoji": "🚩",
            "title": "A Hazafias Újító",
            "v": {
                "e": 0.2,
                "l": 0,
                "n": 0.7,
                "t": -0.5,
                "c": -0.2
            },
            "desc": "Szereted az országod, és éppen ezért akarod megújítani. Zászló, közösség, de modern: a himnuszra is lehet remix, ha a szívből jön.",
            "sunday": "Ebéden elmeséled, hogy a falunapot ezúttal digitalizálnátok, és senki sem tudja eldönteni, hogy ez jó ötlet-e."
        },
        {
            "id": "piacos",
            "emoji": "🥕",
            "title": "A Falusi Piacos Realista",
            "v": {
                "e": -0.3,
                "l": 0.3,
                "n": 0.6,
                "t": 0.5,
                "c": 0
            },
            "desc": "Alaposan megnézed az árat, a termelőt és az időjárást. Szerinted a józan ész a legjobb közgazdaságtan, a magyar termék pedig mindig frissebb.",
            "sunday": "Ebéden megmondod, mennyibe került a krumpli, és hogy a tavalyi ennél olcsóbb volt."
        },
        {
            "id": "szabadelvu",
            "emoji": "📜",
            "title": "A Szabadelvű Hagyományőrző",
            "v": {
                "e": -0.7,
                "l": -0.3,
                "n": 0.4,
                "t": 0.6,
                "c": 0.1
            },
            "desc": "Tisztelettel nézed a múltat, de nem szereted, ha az állam bármit előír. Szerinted a hagyomány a család és a közösség dolga, nem a hivataloké.",
            "sunday": "Ebéden felsorolod a családfát, aztán az adókulcsot, és mindkét téma ugyanúgy végződik: „kevesebb beleszólás”."
        },
        {
            "id": "merleg",
            "emoji": "⚖️",
            "title": "A Mérsékelt Mérleg",
            "v": {
                "e": 0,
                "l": 0,
                "n": 0,
                "t": 0,
                "c": 0
            },
            "desc": "Mindenhol középen állsz, mintha a kiegyensúlyozottság hungarikum lenne. Meghallgatsz minden érvet, és valahogy mindegyikben van igazság. Ez néha bölcsesség, néha csak nem vettél részt a vitában.",
            "sunday": "Ebéden megkérdezed: „Mindkét oldalnak vannak jó pontjai”, mire három ember egyszerre sóhajt."
        },
        {
            "id": "technokrata",
            "emoji": "📊",
            "title": "A Táblázatkezelő Technokrata",
            "v": {
                "e": 0.3,
                "l": 0.5,
                "n": -0.3,
                "t": -0.7,
                "c": -0.3
            },
            "desc": "Minden problémára van egy Excel-tábla, és minden Excel-tábla megoldás is. Szerinted a politika annyira működik, amennyire mérni lehet, és ahol nem mérhető, ott még dolgozni kell.",
            "sunday": "Ebédnél diagramon mutatod meg, hogy a rántott hús és a pörkölt valójában ugyanolyan hatékony."
        },
        {
            "id": "civil",
            "emoji": "🧤",
            "title": "A Civil Önkéntes",
            "v": {
                "e": 0.7,
                "l": -0.5,
                "n": -0.2,
                "t": -0.5,
                "c": -0.4
            },
            "desc": "Ha baj van, nem vársz: összeszeded a szomszédokat, és megoldjátok. Hiszel a közösségben, a segítségben és abban, hogy a jó ügyekért érdemes időt áldozni.",
            "sunday": "Ebéden te vagy, aki bejelenti, hogy jövő szombaton szemétszedés lesz, és már mindenkit beírt."
        }
    ];

    var HATED_V1 = [
        {
            "id": "penz",
            "name": "Pénzhajhászás",
            "blurb": "amikor mindent az üzlet dönt el",
            "roast": "Szerinted nem minden áru: a barátság, a naplemente és a Balaton sem."
        },
        {
            "id": "egyenlo",
            "name": "Kényszerű egyenlősdi",
            "blurb": "amikor mindenki ugyanannyit kap, akármit tett",
            "roast": "Szerinted az igazságosság nem egyforma szelet tortát jelent."
        },
        {
            "id": "parancs",
            "name": "Parancsuralom",
            "blurb": "amikor az az érv, hogy „mert én mondtam”",
            "roast": "Nálad az érvelés nem hangerő kérdése."
        },
        {
            "id": "szabados",
            "name": "Felelőtlen szabadosság",
            "blurb": "amikor mindenki azt csinál, amit akar, és másokra marad a rendetlenség",
            "roast": "Szerinted a szabadság addig szép, amíg valaki nem a te kapudba parkol."
        },
        {
            "id": "patosz",
            "name": "Nemzeti pátosz",
            "blurb": "amikor a hazafiasságot hangerővel mérik",
            "roast": "Neked a szeretet a falunapi hurrázásnál csendesebb is lehet."
        },
        {
            "id": "sznob",
            "name": "Világpolgár-sznobéria",
            "blurb": "amikor mindent lenéznek, ami nem külföldi",
            "roast": "Szerinted a „nálunk ez nem divat” és a „Párizsban ez másképp van” ugyanaz a mondat."
        },
        {
            "id": "hagyomany",
            "name": "Erőltetett hagyománytisztelet",
            "blurb": "amikor az az érv, hogy „mindig is így volt”",
            "roast": "A mindig is így volt a legrégebbi kifogás: ráadásul ritkán igaz."
        },
        {
            "id": "ujitas",
            "name": "Megújítási láz",
            "blurb": "amikor mindent újra kell gondolni, csak azért is",
            "roast": "Szerinted nem minden rossz, ami régi, és nem minden jó, ami új."
        },
        {
            "id": "cinizmus",
            "name": "Cinizmus",
            "blurb": "amikor „úgysem számít semmi”",
            "roast": "Utálod az „úgyis mindegy” hangulatot: pedig néha tényleg szórakoztató."
        },
        {
            "id": "naivitas",
            "name": "Gyanútlan naivitás",
            "blurb": "amikor mindenki azt hiszi, hogy majd minden megoldódik magától",
            "roast": "Te legalább számolod a következményeket, még ha ezzel a vacsora hangulatát is elviszed."
        }
    ];

    var HATED_V2 = [
        {
            "id": "rongalas",
            "name": "Rongálás",
            "blurb": "amikor a közös dolgot összefirkálják, eltörik, leszerelik",
            "roast": "Szerinted a pad nem a „senkié”, hanem mindenkié. A filctollas „művész” nálad nem festő, hanem tettes, a törött hinta pedig nem ártatlan baleset."
        },
        {
            "id": "kornyezet",
            "name": "Környezetszennyezés",
            "blurb": "amikor a természetet vagy a közteret kukának nézik",
            "roast": "Nálad a szemét nem a kuka mellett kezdődik, hanem a gondolkodásban. Az erdő nem szeméttelep, és a „majd valaki összeszedi” nem hatástanulmány."
        },
        {
            "id": "figyelem",
            "name": "Figyelmetlenség",
            "blurb": "amikor valaki hozzád szól, de közben a telefonját nézi",
            "roast": "Te még meghallod, ha beszélnek hozzád. A „mondj még egyszer, nem hallottam” és a fél füllel hallgatás nálad udvariatlanság, nem divat."
        },
        {
            "id": "tragar",
            "name": "Trágárság",
            "blurb": "amikor minden második szó káromkodás",
            "roast": "Szerinted a káromkodás nem erő, hanem szókincs-hiány. Nálad a jó vita érvekből áll, nem sértésekből, és a gyerekek jelenlétében kétszer is."
        },
        {
            "id": "szexizmus",
            "name": "Szexizmus",
            "blurb": "amikor valakit a neme miatt néznek le vagy kezelnek másképp",
            "roast": "Nálad a nem nem képesség. A „férfi dolog” és a „női dolog” kifejezések gyanúsan hasonlítanak a „mert mindig is így volt” érvre."
        },
        {
            "id": "anarchia",
            "name": "Szabálytalan zűrzavar",
            "blurb": "amikor senki nem tartja be a szabályt, és nincs, aki számon kérje",
            "roast": "Neked a piros lámpa nem javaslat. A „szabad ország” még nem azt jelenti, hogy a lépcsőház a tiéd, és a rend nálad nem elnyomás, hanem a közös élet alapja."
        },
        {
            "id": "tolvaj",
            "name": "Lopás és csalás",
            "blurb": "amikor valaki más pénzét, munkáját vagy ötletét viszi",
            "roast": "Szerinted a „mindenki lop” nem mentség, és a „csak egy kicsit” sem. A közös hűtőből eltűnt joghurt nálad nem apróság, hanem jellemvizsga."
        },
        {
            "id": "zaj",
            "name": "Hangoskodás",
            "blurb": "amikor a csendet és a nyugalmat nem tiszteli senki",
            "roast": "Neked az éjszakai csend nem javaslat, hanem házirend. A vasárnap reggeli fűnyíró és a hajnali fúrógép szerinted a modern kor tűrhetetlen hozadéka."
        },
        {
            "id": "pletyka",
            "name": "Pletyka és hátbatámadás",
            "blurb": "amikor a hátad mögött beszélnek rólad, szemben meg mosolyognak",
            "roast": "Nálad az őszinte szembeszólás többet ér a háttérbeszélgetésnél. A „csak mondom” és a „én nem mondtam semmit” után te már tudod, mi következik."
        },
        {
            "id": "potyazo",
            "name": "Lógás és potyázás",
            "blurb": "amikor más dolgozik, ő meg kihasználja",
            "roast": "Nálad a „majd a másik megcsinálja” a legnagyobb bűn. A közös munkából nem lehet lógni, a közös kasszából meg nem lehet ingyen élni."
        }
    ];

    var api = {
        1: { AXES: AXES_5, ARCHETYPES: ARCHETYPES_15, HATED: HATED_V1 },
        2: { AXES: AXES_5, ARCHETYPES: ARCHETYPES_15, HATED: HATED_V2 }
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.legacy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
