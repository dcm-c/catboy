// =========================================================
// ÉRTÉKTEST - adatok
//
// Szórakoztató, nem tudományos teszt. Öt tengelyen mér, mindegyik -100 és +100 közötti érték:
//   e  Gazdaság:  - szabadpiac      ... + elosztó állam
//   l  Társadalom: - szabadság      ... + rend
//   n  Közösség:  - világpolgár     ... + nemzeti
//   t  Értékek:   - haladó          ... + hagyománytisztelő
//   c  Bizalom:   - bizakodó        ... + cinikus
//
// Az állítások súlya tengelyenként +1 / -1 körüli (a + irányba vagy a - irányba húz). Magyar ügyek, humorral,
// és szándékosan mindkét irányból érkeznek, hogy ne lehessen "kitalálni a jó választ".
// Nem pártot ajánl, nem valós politikust nevez meg: a végén egy tréfás típust kapsz, nem ítéletet.
// =========================================================
(function (root) {
    'use strict';

    var AXES = [
        { id: 'e', name: 'Gazdaság', icon: '💶', negIcon: '🛍️', posIcon: '🏥', neg: 'Szabadpiac', pos: 'Elosztó állam' },
        { id: 'l', name: 'Társadalom', icon: '⚖️', negIcon: '🕊️', posIcon: '🛂', neg: 'Szabadság', pos: 'Rend' },
        { id: 'n', name: 'Közösség', icon: '🗺️', negIcon: '✈️', posIcon: '🏡', neg: 'Világpolgár', pos: 'Nemzeti' },
        { id: 't', name: 'Értékek', icon: '⏳', negIcon: '🚀', posIcon: '🏺', neg: 'Haladó', pos: 'Hagyománytisztelő' },
        { id: 'c', name: 'Bizalom', icon: '🤝', negIcon: '🌞', posIcon: '🧐', neg: 'Bizakodó', pos: 'Cinikus' }
    ];

    // A sorrend szándékosan kevert, hogy ne tengelyenként jöjjenek a kérdések.
    var STATEMENTS = [
        { id: 'bkk', text: 'A BKK-bérlet legyen ingyenes mindenkinek, akkor is, ha ezért emelkedik az adó.', joke: 'A kalauz hiányát úgyis csak a nagyik érzik.', w: { e: 1 } },
        { id: 'palinka', text: 'A házipálinka-főzést teljesen szabaddá kellene tenni.', joke: 'Pista bácsi kazánja nem bűncselekmény, hanem örökség.', w: { l: -1 } },
        { id: 'hatar', text: 'A határon túli magyarok szavazati joga természetes.', w: { n: 1 } },
        { id: 'csalad', text: 'A hagyományos családmodell (anya, apa, gyerek) a társadalom alapja.', w: { t: 1 } },
        { id: 'politikus', text: 'A politikusok többsége elsősorban a saját zsebét nézi.', joke: 'Az enyémet ugyan senki.', w: { c: 1 } },
        { id: 'piac', text: 'A piac a legjobb döntéshozó: ami nem éri meg, az szűnjön meg, ne támogassuk.', w: { e: -1 } },
        { id: 'sorkaton', text: 'Legyen újra kötelező a sorkatonaság: ennyi fiatal, és senki sem tud rendesen ágyat húzni.', w: { l: 1, t: 0.5 } },
        { id: 'euro', text: 'Jó lenne bevezetni az eurót, és végre elbúcsúzni a forintszámolgatástól.', joke: 'A nyaralás előtti átváltás is kevesebb fejtörés lenne.', w: { n: -1 } },
        { id: 'hazassag', text: 'Az azonos neműek házassága legyen ugyanúgy elismert, mint bárki másé.', w: { t: -1 } },
        { id: 'szavazat', text: 'A választáson egy szavazat is számít: érdemes elmenni.', w: { c: -1 } },
        { id: 'tanar', text: 'A tanárok és az ápolók fizetése legyen az első, amit emelünk: minden más várhat.', w: { e: 1 } },
        { id: 'kamera', text: 'Az a társadalom biztonságosabb, ahol több a kamera és az ellenőrzés.', w: { l: 1 } },
        { id: 'nyelv', text: 'A magyar nyelvet óvni kell az angol szavak áradatától (jó fej, vagy inkább „cool”?).', w: { n: 1, t: 0.5 } },
        { id: 'smink', text: 'Egy fiú szabadon hordhat szoknyát vagy sminket, ha attól jól érzi magát.', w: { t: -1 } },
        { id: 'haver', text: 'Az igazi ügyek mindig a háttérben, haverok között dőlnek el.', joke: 'A „Majd szólok egy ismerősnek” is ide tartozik.', w: { c: 1 } },
        { id: 'privat', text: 'A nagy állami cégeket (pl. MÁV, posta) jobb lenne magáncégeknek eladni.', w: { e: -1 } },
        { id: 'tuntetes', text: 'A tüntetés joga szent: akkor is, ha torlódik tőle a Nagykörút.', w: { l: -1 } },
        { id: 'eu', text: 'Magyarország legyen az EU erős, aktív tagja, ne a kakukk a fészekben.', w: { n: -1 } },
        { id: 'vallas', text: 'A vallásnak fontos szerepe lehet a közösségek életében.', w: { t: 1 } },
        { id: 'hivatal', text: 'A hivatalok ma már tényleg ügyfélbarátok. Tényleg.', joke: 'Ezt a mondatot legalább háromszor el kell olvasni.', w: { c: -1 } },
        { id: 'strand', text: 'A Balaton partján mindenkinek legyen szabad bejárása, strandbelépő nélkül.', w: { e: 1 } },
        { id: 'halal', text: 'A legsúlyosabb bűnökért vissza kellene állítani a halálbüntetést.', w: { l: 1 } },
        { id: 'termek', text: 'A boltokban a magyar termékeket kellene előnyben részesíteni, még ha drágábbak is.', w: { n: 1, e: 0.5 } },
        { id: 'ai', text: 'A rutinfeladatokat bátran rá lehetne bízni a mesterséges intelligenciára és az automatizálásra.', w: { t: -1 } },
        { id: 'hirek', text: 'A híreket mindig fenntartással olvasom: mindenkinek van valami érdeke.', w: { c: 1 } },
        { id: 'vallalkozo', text: 'A vállalkozókat inkább békén kellene hagyni: kevesebb adó, kevesebb papír, több lendület.', w: { e: -1 } },
        { id: 'allam', text: 'Az állam ne szóljon bele, mit eszem, iszom vagy mit csinálok a négy fal között.', w: { l: -1 } },
        { id: 'unnep', text: 'A nemzeti ünnepek hangulatát (kokárda, himnusz) meg kell őrizni, nem csak a hosszú hétvégét.', w: { n: 1, t: 0.7 } },
        { id: 'kakaos', text: 'Régen minden jobb volt: a kakaós csiga is nagyobb volt.', joke: 'A nosztalgia a legerősebb magyar hungarikum.', w: { t: 1, c: 0.5 } },
        { id: 'civil', text: 'A civil szervezetek és az önkéntesek többet tesznek a közért, mint a pártok.', w: { c: 0.5, e: 0.3 } },
        { id: 'albi', text: 'Az albérletárakat szabályozni kellene: a lakhatás nem luxus.', w: { e: 1 } },
        { id: 'fegyelem', text: 'Az iskolában legyen fegyelem és egyenruha, a rend a félsiker.', w: { l: 1, t: 0.5 } },
        { id: 'bevandor', text: 'Magyarországra csak szigorú feltételekkel érkezhessen letelepedni külföldi.', w: { n: 1, l: 0.5 } },
        { id: 'nyugdij', text: 'A nyugdíjra mindenki maga tegyen félre: ne az államra számítson.', w: { e: -1 } },
        { id: 'projekt', text: 'Az iskolában kevesebb magolás, több projektmunka kellene.', w: { t: -1 } },
        { id: 'masodik', text: 'Aki hibázik, annak érdemes második esélyt adni.', w: { l: -1, c: -0.5 } },
        { id: 'sajat', text: 'Előbb a saját országunk gondjait kellene megoldani, a világ bajai várhatnak.', w: { n: 1 } },
        { id: 'panasz', text: 'Egy jól megírt panaszlevélre a hivatal tényleg válaszol.', w: { c: -1 } },
        { id: 'nyelv2', text: 'Az iskolában az angol mellett legyen kötelező egy második idegen nyelv is.', w: { n: -1, t: -0.5 } },
        { id: 'kisbolt', text: 'A régi dolgokat (trafik, nagyi receptje, kerti kisvasút) megőrizni fontosabb, mint újítani.', w: { t: 1 } }
    ];

    // Tréfás típusok: a középpont az öt tengelyen -1..1 között van.
    var ARCHETYPES = [
        { id: 'vitorlazo', emoji: '⛵', title: 'A Hétvégi Vitorlázó Liberális', v: { e: -0.7, l: -0.6, n: -0.5, t: -0.6, c: 0.1 },
          desc: 'Szerinted az állam akkor jó, ha nem látszik. A Balatonon a saját vitorlásodat részesíted előnyben, a kormányzást pedig a szezonális szél mintájára képzeled el: ha fúj, jó, ha nem, nem avatkozunk bele.',
          sunday: 'Vasárnapi ebéden te vagy, aki azt mondja: „De mi lenne, ha kevesebb szabály lenne?”, majd elhal a beszélgetés.' },
        { id: 'kavehaz', emoji: '☕', title: 'A Kávéházi Világjavító', v: { e: 0.5, l: -0.7, n: -0.6, t: -0.7, c: 0.2 },
          desc: 'Minden problémára van egy kávé, egy tanulmány és egy hosszú Facebook-hozzászólás. A világot jobbá teszed, de előbb még elmondod, hogy az előző kávéház jobb volt.',
          sunday: 'Ebéden az első húsleves után már a harmadik reformot vázolod egy szalvétán.' },
        { id: 'nagyapa', emoji: '🌻', title: 'A Kiskerti Nagypapa', v: { e: 0.1, l: 0.6, n: 0.7, t: 0.8, c: 0.3 },
          desc: 'Tudod, hogyan kell paradicsomot nevelni, és azt is, hogy mi romlott el a világban. Szerinted a rend, a hagyomány és a jó hazai szilva a három pillér, a többi csak divat.',
          sunday: 'Vasárnap te vagy, aki a kertből hoz fel egy szatyor zöldséget, és közben kikér egy véleményt a hírekről.' },
        { id: 'palinka', emoji: '🍑', title: 'A Szabad Pálinkafőző', v: { e: -0.5, l: -0.8, n: 0.5, t: 0.5, c: 0.4 },
          desc: 'Büszke vagy a magyar hagyományokra, de utálod, ha valaki megmondja, hogyan kell csinálni. A kazán a tiéd, a recept a tiéd, a hatóság pedig maradjon a hivatalban.',
          sunday: 'Ebéden megkínálsz mindenkit, és közben kifejted az államtalanítás elméletét.' },
        { id: 'szakszi', emoji: '🛠️', title: 'A Szakszervezeti Veterán', v: { e: 0.8, l: 0.2, n: 0.3, t: 0.4, c: 0.1 },
          desc: 'Szerinted a munkának tisztelete van, a bérnek minimuma, az ebédszünetnek pedig szent hossza. Minden vitából a kollektív szerződés felé tereled a témát.',
          sunday: 'Ebédnél felállsz, és megkérdezed, ki fizeti a túlórát. Senki sem válaszol.' },
        { id: 'hazmester', emoji: '🔑', title: 'A Határozott Házmester', v: { e: 0.1, l: 0.9, n: 0.5, t: 0.6, c: 0.1 },
          desc: 'A lépcsőház tiszta, a kapukód titkos, a szabály az szabály. Szerinted a világ azért bonyolult, mert túl kevés benne a házirend.',
          sunday: 'Vasárnap te vagy, aki a tányért is rendben visszaviszi, és megjegyzi, ki hagyta nyitva az ajtót.' },
        { id: 'nomad', emoji: '💻', title: 'A Digitális Nomád Kakaóscsiga-Hiányban', v: { e: -0.6, l: -0.4, n: -0.8, t: -0.8, c: 0.3 },
          desc: 'Ma Lisszabon, holnap valahol laptoppal. A hazádat szereted, csak éppen a wifi jobb máshol. Szerinted a határok rossz ötletek, a távmunka pedig emberi jog.',
          sunday: 'Ebéden felhívod a családot videón, mert épp nem vagy otthon. Sosem vagy.' },
        { id: 'cinikus', emoji: '🙄', title: 'Az Örök Cinikus (Mindenki Lop)', v: { e: 0, l: 0, n: 0, t: 0, c: 0.95 },
          desc: 'Nem hiszel senkinek, semmiben, de legalább elég szórakoztatóan. Szerinted minden ígéret kampányszöveg, minden kampányszöveg ígéret, és a kettő között nincs különbség.',
          sunday: 'Ebédnél csak mosolyogsz: „Hát persze. Majd pont ezek.”' },
        { id: 'bekes', emoji: '🕊️', title: 'A Békés Kompromisszum-Barát', v: { e: 0.1, l: -0.1, n: -0.1, t: -0.1, c: -0.7 },
          desc: 'Hiszel a párbeszédben, a jó szándékban és abban, hogy a vitából valami jó is kisülhet. Néha túl naiv vagy, de legalább te nem veszel részt a kommentháborúkban.',
          sunday: 'Ebéden te vagy az, aki közli: „Mindenkinek igaza van egy kicsit”, majd elosztja a sütit.' },
        { id: 'hazafias', emoji: '🚩', title: 'A Hazafias Újító', v: { e: 0.2, l: 0.0, n: 0.7, t: -0.5, c: -0.2 },
          desc: 'Szereted az országod, és éppen ezért akarod megújítani. Zászló, közösség, de modern: a himnuszra is lehet remix, ha a szívből jön.',
          sunday: 'Ebéden elmeséled, hogy a falunapot ezúttal digitalizálnátok, és senki sem tudja eldönteni, hogy ez jó ötlet-e.' },
        { id: 'piacos', emoji: '🥕', title: 'A Falusi Piacos Realista', v: { e: -0.3, l: 0.3, n: 0.6, t: 0.5, c: 0.0 },
          desc: 'Alaposan megnézed az árat, a termelőt és az időjárást. Szerinted a józan ész a legjobb közgazdaságtan, a magyar termék pedig mindig frissebb.',
          sunday: 'Ebéden megmondod, mennyibe került a krumpli, és hogy a tavalyi ennél olcsóbb volt.' },
        { id: 'szabadelvu', emoji: '📜', title: 'A Szabadelvű Hagyományőrző', v: { e: -0.7, l: -0.3, n: 0.4, t: 0.6, c: 0.1 },
          desc: 'Tisztelettel nézed a múltat, de nem szereted, ha az állam bármit előír. Szerinted a hagyomány a család és a közösség dolga, nem a hivataloké.',
          sunday: 'Ebéden felsorolod a családfát, aztán az adókulcsot, és mindkét téma ugyanúgy végződik: „kevesebb beleszólás”.' },
        { id: 'merleg', emoji: '⚖️', title: 'A Mérsékelt Mérleg', v: { e: 0, l: 0, n: 0, t: 0, c: 0 },
          desc: 'Mindenhol középen állsz, mintha a kiegyensúlyozottság hungarikum lenne. Meghallgatsz minden érvet, és valahogy mindegyikben van igazság. Ez néha bölcsesség, néha csak nem vettél részt a vitában.',
          sunday: 'Ebéden megkérdezed: „Mindkét oldalnak vannak jó pontjai”, mire három ember egyszerre sóhajt.' },
        { id: 'technokrata', emoji: '📊', title: 'A Táblázatkezelő Technokrata', v: { e: 0.3, l: 0.5, n: -0.3, t: -0.7, c: -0.3 },
          desc: 'Minden problémára van egy Excel-tábla, és minden Excel-tábla megoldás is. Szerinted a politika annyira működik, amennyire mérni lehet, és ahol nem mérhető, ott még dolgozni kell.',
          sunday: 'Ebédnél diagramon mutatod meg, hogy a rántott hús és a pörkölt valójában ugyanolyan hatékony.' },
        { id: 'civil', emoji: '🧤', title: 'A Civil Önkéntes', v: { e: 0.7, l: -0.5, n: -0.2, t: -0.5, c: -0.4 },
          desc: 'Ha baj van, nem vársz: összeszeded a szomszédokat, és megoldjátok. Hiszel a közösségben, a segítségben és abban, hogy a jó ügyekért érdemes időt áldozni.',
          sunday: 'Ebéden te vagy, aki bejelenti, hogy jövő szombaton szemétszedés lesz, és már mindenkit beírt.' }
    ];

    // "Utált értékek": társadalmi bosszantó dolgok. Párokban kell dönteni, melyik zavar jobban. A pontszám = hányszor választottad.
    var HATED = [
        { id: 'rongalas', name: 'Rongálás', blurb: 'amikor a közös dolgot összefirkálják, eltörik, leszerelik', roast: 'Szerinted a pad nem a „senkié”, hanem mindenkié. A filctollas „művész” nálad nem festő, hanem tettes, a törött hinta pedig nem ártatlan baleset.' },
        { id: 'kornyezet', name: 'Környezetszennyezés', blurb: 'amikor a természetet vagy a közteret kukának nézik', roast: 'Nálad a szemét nem a kuka mellett kezdődik, hanem a gondolkodásban. Az erdő nem szeméttelep, és a „majd valaki összeszedi” nem hatástanulmány.' },
        { id: 'figyelem', name: 'Figyelmetlenség', blurb: 'amikor valaki hozzád szól, de közben a telefonját nézi', roast: 'Te még meghallod, ha beszélnek hozzád. A „mondj még egyszer, nem hallottam” és a fél füllel hallgatás nálad udvariatlanság, nem divat.' },
        { id: 'tragar', name: 'Trágárság', blurb: 'amikor minden második szó káromkodás', roast: 'Szerinted a káromkodás nem erő, hanem szókincs-hiány. Nálad a jó vita érvekből áll, nem sértésekből, és a gyerekek jelenlétében kétszer is.' },
        { id: 'szexizmus', name: 'Szexizmus', blurb: 'amikor valakit a neme miatt néznek le vagy kezelnek másképp', roast: 'Nálad a nem nem képesség. A „férfi dolog” és a „női dolog” kifejezések gyanúsan hasonlítanak a „mert mindig is így volt” érvre.' },
        { id: 'anarchia', name: 'Szabálytalan zűrzavar', blurb: 'amikor senki nem tartja be a szabályt, és nincs, aki számon kérje', roast: 'Neked a piros lámpa nem javaslat. A „szabad ország” még nem azt jelenti, hogy a lépcsőház a tiéd, és a rend nálad nem elnyomás, hanem a közös élet alapja.' },
        { id: 'tolvaj', name: 'Lopás és csalás', blurb: 'amikor valaki más pénzét, munkáját vagy ötletét viszi', roast: 'Szerinted a „mindenki lop” nem mentség, és a „csak egy kicsit” sem. A közös hűtőből eltűnt joghurt nálad nem apróság, hanem jellemvizsga.' },
        { id: 'zaj', name: 'Hangoskodás', blurb: 'amikor a csendet és a nyugalmat nem tiszteli senki', roast: 'Neked az éjszakai csend nem javaslat, hanem házirend. A vasárnap reggeli fűnyíró és a hajnali fúrógép szerinted a modern kor tűrhetetlen hozadéka.' },
        { id: 'pletyka', name: 'Pletyka és hátbatámadás', blurb: 'amikor a hátad mögött beszélnek rólad, szemben meg mosolyognak', roast: 'Nálad az őszinte szembeszólás többet ér a háttérbeszélgetésnél. A „csak mondom” és a „én nem mondtam semmit” után te már tudod, mi következik.' },
        { id: 'potyazo', name: 'Lógás és potyázás', blurb: 'amikor más dolgozik, ő meg kihasználja', roast: 'Nálad a „majd a másik megcsinálja” a legnagyobb bűn. A közös munkából nem lehet lógni, a közös kasszából meg nem lehet ingyen élni.' }
    ];

    // Minden érték pontosan kétszer szerepel, így mindenkinek ugyanannyi esélye van.
    var HATED_PAIRS = [
        ['rongalas', 'kornyezet'], ['figyelem', 'tragar'], ['szexizmus', 'anarchia'], ['tolvaj', 'zaj'], ['pletyka', 'potyazo'],
        ['rongalas', 'tolvaj'], ['kornyezet', 'figyelem'], ['tragar', 'szexizmus'], ['anarchia', 'pletyka'], ['zaj', 'potyazo']
    ];

    // =========================================================
    // HOSSZÚ TESZT (96 kérdés: 60 értékrész + 36 utált-érték rész)
    //  - 40 értékállítás: a rövid teszt 32 állítása + 7 ellentétes "iker" + 1 új. Sok értékállítás a zavar-skálákra is hat (h).
    //  - 24 "zavar-állítás": az utált értékek skáláit mérik (h), és sok közülük a tengelyeket is mozgatja (w).
    //  - 4 hazugság-próba: olyan "soha"-állítások, amik gyakorlatilag senkire sem igazak.
    // Az őszinteséget háromféleképp vizsgáljuk: lehetetlen állítások, ellentmondó ikerpárok, "mindenre ugyanazt nyomtad".
    // A h súly pozitív: aki egyetért, annál jobban zavar az adott érték; negatív: kevésbé zavar.
    // =========================================================
    var LONG_DROP = { civil: 1, nyelv2: 1, projekt: 1, strand: 1, kamera: 1, sajat: 1, hirek: 1, termek: 1 };

    var H_BOTH = {
        sorkaton: { anarchia: 0.4 }, palinka: { anarchia: -0.4 }, piac: { potyazo: 0.5 }, tanar: { figyelem: 0.3 }, privat: { potyazo: 0.4 },
        hazassag: { szexizmus: 0.4 }, csalad: { szexizmus: -0.3 }, unnep: { zaj: -0.3 }, tuntetes: { zaj: -0.3 },
        politikus: { tolvaj: 0.6 }, hivatal: { figyelem: 0.4 }, haver: { tolvaj: -0.3 }, panasz: { figyelem: 0.4 },
        fegyelem: { rongalas: 0.4, tragar: 0.5 }, allam: { anarchia: -0.4 }, nyugdij: { potyazo: 0.5 },
        vallalkozo: { potyazo: 0.3 }, smink: { szexizmus: 0.5 }, bkk: { potyazo: -0.4 }, szavazat: { figyelem: 0.2 }
    };

    // Ellentétes párok az érték-részben: ha mindkettővel egyetértesz, ellentmondtál magadnak.
    var NEW_V = [
        { id: 'sorkaton2', text: 'A katonai szolgálat legyen kizárólag önkéntes: senkit ne lehessen belekényszeríteni.', w: { l: -1 }, h: { anarchia: -0.3 } },
        { id: 'euro2', text: 'A forint a nemzeti önállóságunk része: nem szabad lecserélni az euróra.', w: { n: 1 } },
        { id: 'szavazat2', text: 'Egy szavazaton úgysem múlik semmi, felesleges elmenni a választásra.', w: { c: 1 }, h: { figyelem: -0.3 } },
        { id: 'palinka2', text: 'A házi párlat készítését szigorúan engedélyhez és ellenőrzéshez kellene kötni.', w: { l: 1 }, h: { anarchia: 0.4 } },
        { id: 'bkk2', text: 'A tömegközlekedés legyen fizetős: aki használja, az fizessen érte.', w: { e: -1 }, h: { potyazo: 0.4 } },
        { id: 'adoemel', text: 'A nagyvállalatok adóját jelentősen emelni kellene, hogy jusson a közösre.', w: { e: 1 }, h: { tolvaj: 0.3 } },
        { id: 'kemeny', text: 'Aki hibázik, viselje a következményeit: második esély nélkül.', joke: 'A „hiba nélküli ember” még nem született meg.', w: { l: 1 }, h: { tolvaj: 0.4, rongalas: 0.3 } },
        { id: 'szemet', text: 'Aki a közterületen szemetel, azt pénzbírsággal kellene sújtani.', joke: 'A kukától három méterre eldobott csikk is számít.', w: { l: 1 }, h: { kornyezet: 0.8 } },
        { id: 'moderal', text: 'A közösségi oldalakon a károsnak ítélt tartalmat gyorsan le kell venni, még ha néha tévedésből is.', w: { l: 1, c: 0.3 }, h: { tragar: 0.4 } },
        { id: 'kozmeghall', text: 'A közmeghallgatásokra el kellene járni: ha nem megyünk, nincs jogunk panaszkodni.', joke: 'A kávé és a pogácsa nem biztos, hogy van.', w: { c: -1, l: 0.3 }, h: { figyelem: 0.5 } }
    ];
    // [id, id]: egyszerre egyetérteni mindkettővel ellentmondás
    var TWINS = [
        ['sorkaton', 'sorkaton2'], ['euro', 'euro2'], ['szavazat', 'szavazat2'], ['palinka', 'palinka2'],
        ['bkk', 'bkk2'], ['vallalkozo', 'adoemel'], ['masodik', 'kemeny']
    ];

    // Hazugság-próba: négy "soha / mindig" állítás, amit gyakorlatilag senki nem mondhat el magáról igazán (kevés, hogy ne legyen unalmas).
    var LIES = [
        { id: 'l_hazug', text: 'Életemben soha egyetlen hazugságot sem mondtam.', joke: 'Ez a mondat maga is próbálkozás.' },
        { id: 'l_eperc', text: 'Soha nem mondtam, hogy „öt perc, és ott vagyok”, miközben még el sem indultam.', joke: 'A cipő nem számít, az még a lépcsőházban van.' },
        { id: 'l_feltetel', text: 'Mindig elolvasom a felhasználási feltételeket, mielőtt az „Elfogadom” gombra kattintok.', joke: 'Mind a 94 oldalt.' },
        { id: 'l_telefon', text: 'Sosem fordult elő velem, hogy „csak egy percre” megnéztem a telefonom, és eltelt egy óra.', joke: 'Ezt éppen a telefonodon olvasod.' }
    ];

    // Zavar-állítások (társadalmi bosszantó dolgok): az egyetértés azt jelenti, hogy ez engem zavar.
    // Az A részben 14 van (ezek a tengelyeket is mozgatják, ahol van w), a B részben 20: minden értéket pontosan 2.
    var HATED_A_ITEMS = [
        { id: 'z_ron1', text: 'Idegesít, ha valaki összefirkálja vagy megrongálja a közös dolgokat: a padot, a buszmegállót, a lépcsőházat.', joke: 'A filctoll nem művészeti eszköz, ha nem a sajátodon használod.', h: { rongalas: 1 }, w: { l: 0.5 } },
        { id: 'z_kor1', text: 'Idegesít, ha valaki az erdőben vagy a parkban hagyja a szemetét.', joke: 'A csokipapír nem lebomló, csak „kicsit” lebomló.', h: { kornyezet: 1 }, w: { l: 0.4 } },
        { id: 'z_kor2', text: 'Zavar, ha a gyár vagy a szomszéd mindent a levegőbe ereget, és senkit nem érdekel.', joke: 'A szomszéd „csak egy kis” avart éget, a fél utca köhög.', h: { kornyezet: 1 }, w: { e: 0.3 } },
        { id: 'z_fig1', text: 'Idegesít, ha beszélgetés közben a másik a telefonját nézi.', joke: 'A „folytasd, hallgatlak” mondat a legnagyobb hazugság, ha közben görgetnek.', h: { figyelem: 1 } },
        { id: 'z_tra1', text: 'Idegesít, ha valaki a gyerekek előtt is válogatás nélkül káromkodik.', joke: 'A gyerek mindent megjegyez, főleg a legrosszabbat.', h: { tragar: 1 }, w: { t: 0.3 } },
        { id: 'z_tra2', text: 'Zavar, ha a vita érvek helyett sértésekbe és csúnya szavakba megy át.', joke: 'Aki először káromkodik, az már vesztett. Vagy legalább kifogyott az érvekből.', h: { tragar: 1 } },
        { id: 'z_szx1', text: 'Idegesít, ha valakit a neme miatt néznek le vagy csúfolnak.', joke: 'A „ez férfi dolog” mondat általában ott hangzik el, ahol a mosogatás kezdődik.', h: { szexizmus: 1 }, w: { t: -0.4 } },
        { id: 'z_szx2', text: 'Zavar, ha egy állásinterjún a nőtől azt kérdezik, mikor szeretne gyereket.', h: { szexizmus: 1 }, w: { t: -0.3 } },
        { id: 'z_ana1', text: 'Idegesít, ha valaki a piros lámpán is átmegy, mert „úgysincs rendőr”.', joke: 'A zebrán a gyalogos mindig „csak most” siet.', h: { anarchia: 1 }, w: { l: 0.6 } },
        { id: 'z_tol1', text: 'Idegesít, ha valaki a közös hűtőből viszi el más ebédjét.', joke: 'A lopott joghurt nem „maradék”, hanem bizonyíték.', h: { tolvaj: 1 } },
        { id: 'z_tol2', text: 'Zavar, ha valaki más munkáját a sajátjaként adja el.', joke: 'Az ötlet, amit „együtt találtunk ki”, rendszerint az enyém volt.', h: { tolvaj: 1 }, w: { c: 0.2 } },
        { id: 'z_zaj1', text: 'Idegesít, ha a szomszéd éjjel fúr, zenél vagy ordít.', joke: 'A „csak egy kis zene” este tízkor már házibuli.', h: { zaj: 1 } },
        { id: 'z_ple1', text: 'Idegesít, ha valaki a háttérben pletykál, szemben meg mosolyog.', joke: 'A „nem mondom el senkinek” a legnagyobb magyar hazugság.', h: { pletyka: 1 } },
        { id: 'z_pot1', text: 'Idegesít, ha a csoportmunkában valaki semmit nem csinál, de a jegyet elfogadja.', joke: 'A „én is ott voltam” nem munka.', h: { potyazo: 1 }, w: { e: -0.3 } }
    ];
    var HATED_B_ITEMS = [
        { id: 'z_ron2', text: 'Bosszant, ha a nemrég felújított játszótéren egy hét múlva már törött a hinta.', joke: 'A felújítás ideje nálunk a rongálás előtti szünet.', h: { rongalas: 1 } },
        { id: 'z_ron3', text: 'Zavar, ha valaki szándékosan eltöri, ami másoké, csak szórakozásból.', joke: 'A „viccből” csak az nevet, aki nem fizeti a javítást.', h: { rongalas: 1 } },
        { id: 'z_kor3', text: 'Bosszant, ha valaki az ablakon dobja ki a csikket vagy az üres flakont.', joke: 'A gravitáció nem szemetesláda.', h: { kornyezet: 1 } },
        { id: 'z_kor4', text: 'Zavar, ha a házi szemetet a patakparton vagy az út szélén hagyják.', joke: 'A patak ettől még nem lesz szemétszállító.', h: { kornyezet: 1 } },
        { id: 'z_fig2', text: 'Zavar, ha valaki ötször elkérdezi ugyanazt, mert közben nem figyelt.', joke: 'A „mit mondtál?” a figyelemhiány másik neve.', h: { figyelem: 1 } },
        { id: 'z_fig3', text: 'Bosszant, ha a sorban az előttem álló csak a pénztárnál kezd el gondolkodni, mit akar.', joke: 'A pénztár nem a döntés helye.', h: { figyelem: 1 } },
        { id: 'z_tra3', text: 'Bosszant, ha a buszon valaki hangosan, csúnya szavakkal telefonál.', joke: 'A buszon mindenki hallgatózik, még a sofőr is.', h: { tragar: 1 } },
        { id: 'z_tra4', text: 'Zavar, ha az internetes hozzászólásokban a durva szó a normális hangnem.', joke: 'A klaviatúra mögött mindenki bátor, és kevés udvarias.', h: { tragar: 1 } },
        { id: 'z_szx3', text: 'Bosszant, ha a „férfiak úgyis ilyenek, a nők úgyis olyanok” mondattal zárják le a vitát.', joke: 'Az „úgyis” szó a közhelyek királynője.', h: { szexizmus: 1 } },
        { id: 'z_szx4', text: 'Zavar, ha a megjegyzés a nemről szól, nem a munkáról.', joke: 'A jó munkának nincs neme, csak határideje.', h: { szexizmus: 1 } },
        { id: 'z_ana2', text: 'Zavar, ha egy közösségben senki nem tartja be a megbeszélt szabályokat.', joke: 'A házirend nem dísz, de a falon ritkán ér célba.', h: { anarchia: 1 }, w: { l: 0.5 } },
        { id: 'z_ana3', text: 'Bosszant, ha a rendetlenségre azt mondják: „szabad ország”.', joke: 'A szabadság nem a mosatlanra szól.', h: { anarchia: 1 } },
        { id: 'z_tol3', text: 'Bosszant, ha valaki jegy nélkül utazik, és közben büszke rá.', joke: 'A „nem járt ellenőr” még nem érv.', h: { tolvaj: 1 } },
        { id: 'z_tol4', text: 'Zavar, ha valaki a másik kárára csal: a vizsgán, a játékban vagy az adóban.', joke: 'A csalás nem ügyesség, csak lebukásra váró helyzet.', h: { tolvaj: 1 } },
        { id: 'z_zaj2', text: 'Zavar, ha a vonaton valaki hangosan hallgat zenét a telefonjáról.', joke: 'A fülhallgató nem luxus, hanem szomszédi jószándék.', h: { zaj: 1 } },
        { id: 'z_zaj3', text: 'Bosszant, ha a moziban beszélgetnek, csomagolóznak vagy világít a telefon.', joke: 'A popcorn csomagolása a mozi legnagyobb horror-effektje.', h: { zaj: 1 } },
        { id: 'z_ple2', text: 'Zavar, ha tényként terjesztenek olyat, amit senki nem ellenőrzött.', joke: 'A „hallottam valakitől” a legmegbízhatóbb hamis forrás.', h: { pletyka: 1 } },
        { id: 'z_ple3', text: 'Bosszant, ha a „csak mondom” mögé bújva szúrnak oda valakinek.', joke: 'A „csak mondom” után mindig következik valami, ami nem „csak”.', h: { pletyka: 1 } },
        { id: 'z_pot2', text: 'Zavar, ha valaki mindig a másikra hagyja a mosogatást.', joke: 'A mosatlan nem tűnik el, csak halasztódik.', h: { potyazo: 1 } },
        { id: 'z_pot3', text: 'Bosszant, ha a társasház közös költségét mindenki fizeti, csak az egyik lakó nem.', joke: 'A lift is csak azoknak jár, akik kifizették.', h: { potyazo: 1 } }
    ];

    // =========================================================
    // ELŐÍTÉLET-BAROMÉTER (csak a B részben): négy téma, mindkét irányban.
    //   up = fenntartás a kisebbségi / kevésbé erős oldallal szemben, dn = fenntartás a többségi / hagyományos oldallal szemben.
    // Szándékosan enyhe, felmérés-stílusú állítások: azt mérjük, mennyire "zavar" egy hozzáállás, nem pedig csoportokat minősítünk.
    // Az 50 a semleges; a magasabb érték nagyobb fenntartást jelent. Szórakoztató teszt, nem pszichológiai mérés.
    // =========================================================
    var TOPICS = [
        { id: 'nem', name: 'Nemek', icon: '👫', up: 'Nőkkel szembeni fenntartás', dn: 'Férfiakkal szembeni fenntartás',
          minSide: 'A nők lenézése', majSide: 'A férfiak lenézése' },
        { id: 'kulf', name: 'Külföldiek és hazafiak', icon: '🌍', up: 'Külföldiekkel szembeni fenntartás', dn: 'Hazafiakkal szembeni fenntartás',
          minSide: 'A bevándorlók lenézése', majSide: 'A hazájukat szeretők lenézése' },
        { id: 'lgbt', name: 'Szerelem és család', icon: '🏳️‍🌈', up: 'LMBTQ+ emberekkel szembeni fenntartás', dn: 'Hagyományos családmodellt védőkkel szembeni fenntartás',
          minSide: 'A meleg és transz emberek lenézése', majSide: 'A hagyományos család védőinek lenézése' },
        { id: 'vall', name: 'Hit és hitetlenség', icon: '🕯️', up: 'Más hitűekkel szembeni fenntartás', dn: 'Vallásosokkal szembeni fenntartás',
          minSide: 'A kisebbségi vallások híveinek lenézése', majSide: 'A vallásosak lenézése' }
    ];
    var PREJ = [];
    TOPICS.forEach(function (t) {
        PREJ.push({ id: t.id + '_up', topic: t.id, side: 'up', name: t.up });
        PREJ.push({ id: t.id + '_dn', topic: t.id, side: 'dn', name: t.dn });
    });

    // Témánként 5 tétel: fenntartás felfelé (+), fenntartás lefelé (+), két fordított állítás (az egyetértés csökkenti a fenntartást),
    // és egy "ellentétes hatású" állítás, ami az egyik skálát növeli, a másikat csökkenti.
    var PREJ_ST = [
        { id: 'p_nem1', text: 'A gyereknevelés és a háztartás alapvetően a nők dolga.', g: { nem_up: 1 }, w: { t: 0.6 } },
        { id: 'p_nem3', text: 'A férfiak többsége eleve elnyomó, még ha nem is tud róla.', g: { nem_dn: 1 }, w: { t: -0.4 } },
        { id: 'p_nem5', text: 'A gyereknevelés és a háztartás mindkét szülő közös dolga, nemtől függetlenül.', g: { nem_up: -1 }, w: { t: -0.4 } },
        { id: 'p_nem6', text: 'A férfiak többsége tisztességesen áll a nemek egyenjogúságához.', g: { nem_dn: -1 } },
        { id: 'p_nem7', text: 'A nők sérelmei eltúlzottak, miközben a férfiak gondjaira alig figyel valaki.', g: { nem_up: 0.7, nem_dn: -0.4 }, w: { t: 0.3 } },

        { id: 'p_kulf1', text: 'Nem szívesen laknék olyan környéken, ahol sok a külföldi.', g: { kulf_up: 1 }, w: { n: 0.6 } },
        { id: 'p_kulf3', text: 'Aki büszke a magyarságára, az általában szűk látókörű.', g: { kulf_dn: 1 }, w: { n: -0.6 } },
        { id: 'p_kulf5', text: 'Aki beilleszkedik és megtanul magyarul, az ugyanolyan magyar, mint én.', g: { kulf_up: -1 }, w: { n: -0.4 } },
        { id: 'p_kulf6', text: 'A magyarságára büszke ember is lehet nyitott és világlátott.', g: { kulf_dn: -1 } },
        { id: 'p_kulf7', text: 'A saját hazánk dolgai előbbre valók, mint a külföldiek bajai.', g: { kulf_up: 0.7, kulf_dn: -0.4 }, w: { n: 0.5 } },

        { id: 'p_lgbt1', text: 'Zavar, ha két azonos nemű ember nyilvánosan csókolózik.', g: { lgbt_up: 1 }, w: { t: 0.6 } },
        { id: 'p_lgbt3', text: 'Aki a hagyományos családmodellt védi, az eleve gyűlölködő.', g: { lgbt_dn: 1 }, w: { t: -0.5 } },
        { id: 'p_lgbt5', text: 'Két ember szerelme magánügy: mindegy, hogy azonos nemű vagy sem.', g: { lgbt_up: -1 }, w: { t: -0.4 } },
        { id: 'p_lgbt6', text: 'Aki a hagyományos családot választja, attól még lehet elfogadó másokkal.', g: { lgbt_dn: -1 } },
        { id: 'p_lgbt7', text: 'Ma már inkább a hagyományos családban élőket éri hátrány, mint a szivárványos közösséget.', g: { lgbt_up: 0.7, lgbt_dn: -0.4 }, w: { t: 0.4 } },

        { id: 'p_vall1', text: 'Zavar, ha egy másik vallás szokásai láthatóvá válnak a környezetemben.', g: { vall_up: 1 }, w: { n: 0.3 } },
        { id: 'p_vall3', text: 'A vallásos emberek általában kevésbé gondolkodnak önállóan.', g: { vall_dn: 1 }, w: { t: -0.4 } },
        { id: 'p_vall5', text: 'Egy másik hitű szomszéd ugyanolyan jó szomszéd lehet, mint bárki más.', g: { vall_up: -1 } },
        { id: 'p_vall6', text: 'A hívők között is sok az önálló, gondolkodó ember.', g: { vall_dn: -1 }, w: { t: 0.2 } },
        { id: 'p_vall7', text: 'A saját hitünk és hagyományunk védelme fontosabb, mint a más vallások szokásainak hangsúlyozása.', g: { vall_up: 0.7, vall_dn: -0.4 }, w: { t: 0.4 } }
    ];

    // Tükörpárok (a rövid tesztben és az utált-tesztben): melyik hozzáállás zavar jobban? min = a kisebbségi oldal lenézése, maj = a többségi oldalé.
    var MIRROR = [
        { topic: 'nem', min: 'Aki lenézi a nőket, csak mert nők.', maj: 'Aki lenézi a férfiakat, csak mert férfiak.' },
        { topic: 'kulf', min: 'Aki lenézi a bevándorlókat.', maj: 'Aki lenézi a hazájukat szeretőket.' },
        { topic: 'lgbt', min: 'Aki szerint a meleg párok nem érdemelnek tiszteletet.', maj: 'Aki szerint a hagyományos család védői gyűlölködők.' },
        { topic: 'vall', min: 'Aki lenézi a kisebbségi vallások híveit.', maj: 'Aki lenézi a vallásosakat.' },
        { topic: 'nem', min: 'Aki szerint a nők nem lehetnek jó vezetők.', maj: 'Aki szerint a férfiak eleve elnyomók.' },
        { topic: 'kulf', min: 'Aki szerint a külföldiek csak bajt hoznak.', maj: 'Aki szerint a hazaszeretet szűklátókörűség.' },
        { topic: 'lgbt', min: 'Aki kiszól az utcán egy kézen fogva sétáló párnak.', maj: 'Aki gúnyolódik azon, aki a hagyományos értékeket tiszteli.' },
        { topic: 'vall', min: 'Aki szerint a más hitűek nem lehetnek megbízhatók.', maj: 'Aki szerint a hívők nem tudnak önállóan gondolkodni.' }
    ];


    // =========================================================
    // Segítség (mit kérdez pontosan) és további poénok. A help a kérdés alatt halványan jelenik meg.
    // =========================================================
    var HELP = {
        // értékállítások
        bkk: 'Arról szól, hogy a közösség fizesse a bérletet adóból, vagy az utas.',
        palinka: 'A saját célra, otthon főzött pálinkára gondolunk, nem az árusításra.',
        hatar: 'Azt kérdezzük, szerinted a határon túli magyar állampolgárok szavazhatnak-e a magyarországi választáson.',
        csalad: 'A kérdés: tekinted-e a klasszikus anya-apa-gyerek családot a társadalom alapjának.',
        politikus: 'Általánosságban: a politikusok többségére igaz-e, hogy elsősorban magukkal törődnek.',
        piac: 'Itt a piaci logika kerül szembe a támogatással: az éri meg, ami nyereséges.',
        sorkaton: 'Azt kérdezzük, jó ötlet-e visszahozni a sorkatonai szolgálatot.',
        euro: 'A forint lecserélése euróra: igen vagy nem. Nincs időpont, csak a szándék.',
        hazassag: 'Jogi egyenlőség: ugyanaz a házasság azonos nemű és különnemű pároknak.',
        szavazat: 'Szerinted számít-e egyetlen szavazat, és érdemes-e emiatt elmenni.',
        tanar: 'Ha egyetlen dologra jutna pénz, ez legyen az első, és minden más várhat.',
        nyelv: 'Védjük-e a magyar nyelvet az idegen szavaktól, vagy hagyjuk, hogy természetesen változzon.',
        smink: 'Egyéni szabadság kérdése: nem azt kérdezzük, mit gondolsz, hanem hogy szabad-e.',
        haver: 'Szerinted a fontos döntések valójában nem hivatalos úton, ismeretségek útján születnek-e.',
        privat: 'Az állami cégek (vasút, posta) magánkézbe adása: jó ötlet-e.',
        tuntetes: 'A gyülekezési jog akkor is erős-e, ha ezzel másokat zavarunk.',
        eu: 'Mekkora szerepet szánsz Magyarországnak az EU-ban: aktív tag vagy távolságtartó.',
        vallas: 'Nem a hitről kérdezünk, hanem arról, van-e hasznos szerepe a közösségekben.',
        hivatal: 'Személyes tapasztalatod: gyors, érthető és barátságos-e ma az ügyintézés. (Ez egy szándékosan csúsztatott kérdés.)',
        halal: 'A legsúlyosabb bűncselekményekre gondolunk, igen vagy nem.',
        ai: 'Ismétlődő, unalmas munkák: bízhatók-e gépre.',
        vallalkozo: 'Azt kérdezzük, jobb-e a vállalkozóknak kevesebb szabály és adó.',
        allam: 'Személyes szabadság: az állam ne avatkozzon bele a magánéletbe és az étkezésbe.',
        unnep: 'A nemzeti ünnep hangulata: számít-e a szertartás, vagy elég a szabadnap.',
        kakaos: 'Nosztalgia-kérdés. A válasz azt mutatja, mennyire hiszel a „régen jobb volt” érzésben.',
        albi: 'Szabályozzon-e az állam albérlet-árakat, vagy hagyjuk a piacra.',
        fegyelem: 'Iskolai rend: egyenruha, szigorú szabályok kontra szabadabb légkör.',
        bevandor: 'Szigorú feltételekhez kötött letelepedés: egyetértesz-e a szigorú irányvonallal.',
        nyugdij: 'Az idős kori ellátás: elsősorban saját felelősség vagy állami feladat.',
        masodik: 'Ha valaki hibázik, jár-e neki második esély. (A következő iker-kérdésnél az ellenkezőjét kérdezzük.)',
        panasz: 'Személyes tapasztalatod arról, mennyire reagálnak a hivatalok a panaszra.',
        kisbolt: 'A hagyományok megőrzése vagy az újítás számít-e nálad többet.',
        kamera: 'Biztonság és szabadság: szerinted a több kamera biztonságosabbá teszi-e a társadalmat.',
        strand: 'Közösségi tulajdon vagy magántulajdon: szabad-e a vízpart mindenkinek, ingyen.',
        termek: 'Hazai termékek előnyben részesítése, akkor is, ha az drágább.',
        hirek: 'Bizalom a médiában: mennyire hiszel el egy hírt első olvasásra.',
        civil: 'Összehasonlítás: az önkéntesek és civil szervezetek hatékonyabbak-e a pártoknál.',
        projekt: 'Oktatás: tanulni könnyebb projektekkel, mint bemagolással. Igen vagy nem.',
        sajat: 'Elsőbbség: előbb a belső gondok, vagy közben a világ bajai is számítanak.',
        nyelv2: 'Oktatás: kötelező legyen-e az angol mellé egy második idegen nyelv.',
        // új értékállítások és ikrek
        sorkaton2: 'Az előző iker-kérdés tükörképe: kényszer nélkül, csak önkéntes jelentkezéssel.',
        euro2: 'Az euróról szóló kérdés ellentéte: a forint megtartása nemzeti ügy-e.',
        szavazat2: 'Az előző szavazásos kérdés ellentéte: úgysem számít, ezért nem kell elmenni.',
        palinka2: 'A pálinkás kérdés ellentéte: engedélyhez és ellenőrzéshez kötött házi főzés.',
        bkk2: 'A bérletes kérdés ellentéte: ne az adófizetők állják a közlekedést, hanem az utas.',
        adoemel: 'A vállalkozói kérdés ellentéte: a nagy cégeket terhelje több adó.',
        kemeny: 'A második esélyes kérdés ellentéte: következmények, kíméletlenül.',
        szemet: 'Közterületi szemetelés: mennyire tartod szükségesnek a pénzbírságot.',
        moderal: 'Közösségi oldalakon a gyors tartalomszűrés: elfogadod-e, hogy néha tévedésből is töröl.',
        kozmeghall: 'Részvétel kérdése: számít-e, ha nem jelenünk meg, de utána elégedetlenkedünk.',
        // hazugság-próba
        l_hazug: 'Ez a „soha” szó komolyan veendő: nem „ritkán”, hanem egyszer sem.',
        l_eperc: 'Pontosan erre gondolunk: azt mondod, mindjárt ott vagy, de még indulni sem indultál.',
        l_feltetel: 'Teljes szöveg, sorról sorra, minden alkalommal. Nem a diagonális olvasás.',
        l_telefon: 'A „csak egy percre” pillantás és az elröpült idő: soha egyetlen alkalommal sem.'
    };
    var JOKE = {
        piac: 'A piac láthatatlan keze néha a zsebünkben is jár.',
        szavazat: 'A „majd a következőn” a legnépszerűbb pártprogram.',
        tanar: 'A hála szép dolog, de a rezsit nem fizeti.',
        nyelv: 'A „heló” már magyar köszönés, a „bocsi” meg szinte hungarikum.',
        smink: 'Szoknya vagy nadrág: a hőmérséklet dönt, nem a divatrendőrség.',
        tuntetes: 'A 4-es 6-os ilyenkor „rendkívüli” járat, vagyis nem jár.',
        halal: 'Erről úgyis lesz vita a vasárnapi ebédnél.',
        ai: 'A gép nem kér szabadságot, de a kávét sem issza meg.',
        vallalkozo: 'Fél nap várakozás egy pecsétre: nálunk ez a „start-up” fázis.',
        allam: 'A hűtő tartalma legyen államtitok. A nagyié különösen.',
        unnep: 'A kokárda minden évben megvan. A fiókban, legalul.',
        albi: 'Az albérlet ára az egyetlen dolog, ami a fizetésnél gyorsabban nő.',
        fegyelem: 'Az egyenruha előnye: reggel nem kell kitalálni, mit vegyen fel az ember.',
        bevandor: 'A bürokrácia ezt már így is szigorúan ellenőrzi.',
        nyugdij: 'A nagymama szerint a befőtt a legjobb nyugdíj-előtakarékosság.',
        masodik: 'A nagymama szerint mindenki megérdemli a második szeletet.',
        panasz: 'A „megvizsgáljuk” a magyar hivatal legszebb ígérete.',
        kisbolt: 'A nagyi receptjét még senki nem tudta felülmúlni, de megpróbálni lehet.',
        kamera: 'A kamera mindent lát, kivéve a tolvaj arcát.',
        strand: 'A Balaton hullámai szerencsére nem kérnek belépőt.',
        termek: 'A magyar paprika nem mindig magyar paprika, de legalább büszke.',
        hirek: 'Az „állítólag” szó a legnagyobb magyar hírforrás.',
        civil: 'A pogácsa itt is az igazi hatalom.',
        projekt: 'A projektmunka végén mindig ugyanaz csinálja meg az egészet.',
        sajat: 'Előbb a saját portánk előtt söpörjünk. A szomszédé is számít, persze.',
        nyelv2: 'A „köszönöm” minden nyelven ugyanolyan jól hangzik.',
        euro2: 'A forint legalább nem hagyja, hogy elfelejtsük a számolást.',
        palinka2: 'Pista bácsi szerint az engedély a kazán mellé tartozik, a pálinka mellé nem.',
        bkk2: 'Az ingyenes busz legnagyobb ellensége a pénztárgép.',
        adoemel: 'Az adóemelésnek általában az adózó örül a legkevésbé.',
        szemet: 'A kukától három méterre eldobott csikk is számít.',
    };
    // Az előítélet-barométer tételeihez nincs poén, csak magyarázat: a téma nem vicc, a hozzáállás mérése a lényeg.
    Object.assign(HELP, {
        p_nem1: 'Azt kérdezzük, szerinted a gyereknevelés és a háztartás eleve a nők feladata-e. Az egyetértés a hagyományos szerepek felé visz.',
        p_nem3: 'Azt kérdezzük, gyanakszol-e a férfiakra csak azért, mert férfiak. Az egyetértés a férfiakkal szembeni fenntartást növeli.',
        p_nem5: 'Fordított állítás: az egyetértés itt a nyitottabb, egyenlőbb hozzáállást jelzi.',
        p_nem6: 'Fordított állítás: az egyetértés itt a férfiakkal szembeni fenntartást csökkenti.',
        p_nem7: 'Ellentétes hatású állítás: az egyetértés a nők ügyével szembeni fenntartást növeli, a férfiakkal szembenit csökkenti.',
        p_kulf1: 'Azt kérdezzük, zavarna-e, ha a környéken sok külföldi élne. Az egyetértés a külföldiekkel szembeni fenntartást növeli.',
        p_kulf3: 'Azt kérdezzük, gyanúsnak tartod-e azt, aki büszke a magyarságára. Az egyetértés a hazafiakkal szembeni fenntartást növeli.',
        p_kulf5: 'Fordított állítás: az egyetértés itt a nyitottabb, befogadóbb hozzáállást jelzi.',
        p_kulf6: 'Fordított állítás: az egyetértés itt a hazafiakkal szembeni fenntartást csökkenti.',
        p_kulf7: 'Ellentétes hatású állítás: az egyetértés a külföldiekkel szembeni fenntartást növeli, a hazafiakkal szembenit csökkenti.',
        p_lgbt1: 'Azt kérdezzük, zavar-e a közterületi, azonos neműek közötti gyengédség. Az egyetértés az LMBTQ+ emberekkel szembeni fenntartást növeli.',
        p_lgbt3: 'Azt kérdezzük, gyűlölködőnek tartod-e a hagyományos családmodell védőit. Az egyetértés a hagyományvédőkkel szembeni fenntartást növeli.',
        p_lgbt5: 'Fordított állítás: az egyetértés itt a nyitottabb hozzáállást jelzi.',
        p_lgbt6: 'Fordított állítás: az egyetértés itt a hagyományvédőkkel szembeni fenntartást csökkenti.',
        p_lgbt7: 'Ellentétes hatású állítás: az egyetértés az LMBTQ+ emberekkel szembeni fenntartást növeli, a hagyományvédőkkel szembenit csökkenti.',
        p_vall1: 'Azt kérdezzük, zavar-e egy másik vallás látható jelenléte (öltözet, ünnep). Az egyetértés a más hitűekkel szembeni fenntartást növeli.',
        p_vall3: 'Azt kérdezzük, gondolkodnak-e kevésbé a hívők. Az egyetértés a vallásosakkal szembeni fenntartást növeli.',
        p_vall5: 'Fordított állítás: az egyetértés itt a más hitűekkel szembeni nyitottságot jelzi.',
        p_vall6: 'Fordított állítás: az egyetértés itt a vallásosakkal szembeni fenntartást csökkenti.',
        p_vall7: 'Ellentétes hatású állítás: az egyetértés a más hitűekkel szembeni fenntartást növeli, a vallásosakkal szembenit csökkenti.'
    });
    function enrich(list) {
        list.forEach(function (st) {
            if (HELP[st.id]) st.help = HELP[st.id];
            if (!st.joke && JOKE[st.id]) st.joke = JOKE[st.id];
        });
    }
    [STATEMENTS, NEW_V, HATED_A_ITEMS, HATED_B_ITEMS, PREJ_ST, LIES].forEach(enrich);
    // A zavar-állításoknál az automatikus magyarázat elég: az egyetértés azt jelenti, hogy ez engem zavar.
    [HATED_A_ITEMS, HATED_B_ITEMS].forEach(function (l) { l.forEach(function (st) { if (!st.help) st.help = 'Egyetértés = ez engem zavar. (Téma: ' + HATED.filter(function (h) { return st.h[h.id]; })[0].name.toLowerCase() + ')'; }); });

    function mk(kind, part, st) { var o = { kind: kind, part: part }; Object.keys(st).forEach(function (k) { o[k] = st[k]; }); return o; }

    var LONG_A = [], LONG_B = [];
    STATEMENTS.forEach(function (st) {
        if (LONG_DROP[st.id]) return;
        var o = mk('v', 'a', st);
        if (H_BOTH[st.id]) o.h = H_BOTH[st.id];
        LONG_A.push(o);
    });
    NEW_V.forEach(function (st) { LONG_A.push(mk('v', 'a', st)); });
    HATED_A_ITEMS.forEach(function (st) { LONG_A.push(mk('h', 'a', st)); });
    LIES.forEach(function (st) { var o = mk('l', 'a', st); o.w = {}; o.lie = true; LONG_A.push(o); });
    HATED_B_ITEMS.forEach(function (st) { LONG_B.push(mk('h', 'b', st)); });
    PREJ_ST.forEach(function (st) { LONG_B.push(mk('p', 'b', st)); });
    var LONG = LONG_A.concat(LONG_B);

    // Az őszinteség-mérő sávjai (alsó határ szerint, csökkenő sorrendben)
    var HONESTY_TIERS = [
        { min: 90, name: 'Kristálytiszta', text: 'Alig akadt fogás rajtad: vagy őszinte vagy, vagy nagyon jól hazudsz.' },
        { min: 70, name: 'Többnyire őszinte', text: 'Néhol szépítettél egy kicsit, de ez teljesen emberi.' },
        { min: 45, name: 'Kicsit szépítettél', text: 'Pár válaszod nem fér össze egymással, vagy a lehetetlen állításokra is bólintottál.' },
        { min: 20, name: 'Meseszerű', text: 'Ha ez egy mese, akkor ez a mese elég szórakoztató, de a teszt nem hiszi el.' },
        { min: 0, name: 'Pinokkió-szint', text: 'A teszt orra is megnőtt, miközben értékelt. Az eredményt csak fenntartással érdemes olvasni.' }
    ];

    var api = { AXES: AXES, STATEMENTS: STATEMENTS, ARCHETYPES: ARCHETYPES, HATED: HATED, HATED_PAIRS: HATED_PAIRS, LONG: LONG, LONG_A: LONG_A, LONG_B: LONG_B, TOPICS: TOPICS, PREJ: PREJ, MIRROR: MIRROR, TWINS: TWINS, HONESTY_TIERS: HONESTY_TIERS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.data = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
