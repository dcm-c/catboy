// =========================================================
// ÉRTÉKTEST - adatok (v3)
//
// Szórakoztató, nem tudományos teszt. Tíz tengelyen mér, mindegyik -100 és +100 közötti érték:
//   e  Gazdaság:   - szabadpiac      ... + elosztó állam
//   l  Társadalom: - szabadság       ... + rend
//   n  Haza:       - világpolgár     ... + nemzeti
//   t  Értékek:    - haladó          ... + hagyománytisztelő
//   c  Bizalom:    - bizakodó        ... + cinikus
//   g  Környezet:  - növekedéspárti  ... + természetóvó
//   m  Biztonság:  - békepárti       ... + erőpárti
//   d  Hatalom:    - szakértői       ... + népi
//   k  Kötelék:    - egyéni út       ... + közösségi, családi kötelék
//   s  Világlátás: - tudományos      ... + megérzés- és hitvezérelt
//
// A tengelyek a hasonló tesztek mintájára (8values, 9axes, Political Compass, Big Five) külön, egymástól függetlenül mérnek:
// nincs benne egyetlen "jobb-bal" skála. Az állítások súlya tengelyenként +1 / -1 körüli, és szándékosan mindkét irányból
// érkeznek (fordított és ellentétes állítás is), hogy ne lehessen "kitalálni a jó választ" vagy csak bólogatni.
// Három hossz: gyors (50 érték-állítás), részletes (100) és extra hosszú (150), ezek egymásra épülnek (tier 1, 2, 3).
// A hosszabb változatokban ellentmondás-párok és hazugság-próbák is vannak, és minden eredményhez megbízhatósági jelzés tartozik.
// Az utált értékek és az előítélet-barométer opcionális kiegészítő rész (B rész).
// Nem pártot ajánl, nem valós politikust nevez meg: a végén egy tréfás típust kapsz, nem ítéletet.
// =========================================================
(function (root) {
    'use strict';

    var isNode = typeof module !== 'undefined' && module.exports;
    var ITEMS = isNode ? require('./ertektest-items.js') : root.MFSZErtek.items;
    var LEGACY_DATA = isNode ? require('./ertektest-legacy.js') : root.MFSZErtek.legacy;

    var AXES = [
        { id: 'e', name: 'Gazdaság', icon: '💶', negIcon: '🛍️', posIcon: '🏥', neg: 'Szabadpiac', pos: 'Elosztó állam', group: 'Állam és gazdaság' },
        { id: 'l', name: 'Társadalom', icon: '⚖️', negIcon: '🕊️', posIcon: '🛂', neg: 'Szabadság', pos: 'Rend', group: 'Állam és gazdaság' },
        { id: 'd', name: 'Hatalom', icon: '🗳️', negIcon: '🎓', posIcon: '📣', neg: 'Szakértői', pos: 'Népi', group: 'Állam és gazdaság' },
        { id: 'n', name: 'Haza', icon: '🗺️', negIcon: '✈️', posIcon: '🏡', neg: 'Világpolgár', pos: 'Nemzeti', group: 'Haza és világ' },
        { id: 'm', name: 'Biztonság', icon: '🛡️', negIcon: '☮️', posIcon: '⚔️', neg: 'Békepárti', pos: 'Erőpárti', group: 'Haza és világ' },
        { id: 'g', name: 'Környezet', icon: '🌍', negIcon: '🏭', posIcon: '🌿', neg: 'Növekedéspárti', pos: 'Természetóvó', group: 'Haza és világ' },
        { id: 't', name: 'Értékek', icon: '⏳', negIcon: '🚀', posIcon: '🏺', neg: 'Haladó', pos: 'Hagyománytisztelő', group: 'Ember és közösség' },
        { id: 'k', name: 'Kötelék', icon: '👨‍👩‍👧', negIcon: '🧍', posIcon: '🫂', neg: 'Egyéni út', pos: 'Közösségi kötelék', group: 'Ember és közösség' },
        { id: 'c', name: 'Bizalom', icon: '🤝', negIcon: '🌞', posIcon: '🧐', neg: 'Bizakodó', pos: 'Cinikus', group: 'Ember és közösség' },
        { id: 's', name: 'Világlátás', icon: '🔮', negIcon: '🔬', posIcon: '✨', neg: 'Tudományos', pos: 'Megérzésvezérelt', group: 'Ember és közösség' }
    ];

    // Az eredeti 40 állítás (a v1/v2 tesztből). A sorrend szándékosan kevert, hogy ne tengelyenként jöjjenek a kérdések.
    var OLD_ST = [
        { id: 'bkk', text: 'A BKK-bérlet legyen ingyenes mindenkinek, akkor is, ha ezért emelkedik az adó.', joke: 'A kalauz hiányát úgyis csak a nagyik érzik.', w: { e: 1 } },
        { id: 'palinka', text: 'A házipálinka-főzést teljesen szabaddá kellene tenni.', joke: 'Pista bácsi kazánja nem bűncselekmény, hanem örökség.', w: { l: -1 } },
        { id: 'hatar', text: 'A határon túli magyarok szavazati joga természetes.', w: { n: 1 } },
        { id: 'csalad', text: 'A hagyományos családmodell (anya, apa, gyerek) a társadalom alapja.', w: { t: 1 , k: 0.5} },
        { id: 'politikus', text: 'A politikusok többsége elsősorban a saját zsebét nézi.', joke: 'Az enyémet ugyan senki.', w: { c: 1 } },
        { id: 'piac', text: 'A piac a legjobb döntéshozó: ami nem éri meg, az szűnjön meg, ne támogassuk.', w: { e: -1 } },
        { id: 'sorkaton', text: 'Legyen újra kötelező a sorkatonaság: ennyi fiatal, és senki sem tud rendesen ágyat húzni.', w: { l: 1, t: 0.5 , m: 0.4} },
        { id: 'euro', text: 'Jó lenne bevezetni az eurót, és végre elbúcsúzni a forintszámolgatástól.', joke: 'A nyaralás előtti átváltás is kevesebb fejtörés lenne.', w: { n: -1 } },
        { id: 'hazassag', text: 'Az azonos neműek házassága legyen ugyanúgy elismert, mint bárki másé.', w: { t: -1 } },
        { id: 'szavazat', text: 'A választáson egy szavazat is számít: érdemes elmenni.', w: { c: -1 } },
        { id: 'tanar', text: 'A tanárok és az ápolók fizetése legyen az első, amit emelünk: minden más várhat.', w: { e: 1 } },
        { id: 'kamera', text: 'Az a társadalom biztonságosabb, ahol több a kamera és az ellenőrzés.', w: { l: 1 } },
        { id: 'nyelv', text: 'A magyar nyelvet óvni kell az angol szavak áradatától (jó fej, vagy inkább „cool”?).', w: { n: 1, t: 0.5 } },
        { id: 'smink', text: 'Egy fiú szabadon hordhat szoknyát vagy sminket, ha attól jól érzi magát.', w: { t: -1 } },
        { id: 'haver', text: 'Az igazi ügyek mindig a háttérben, haverok között dőlnek el.', joke: 'A „Majd szólok egy ismerősnek” is ide tartozik.', w: { c: 1 } },
        { id: 'privat', text: 'A nagy állami cégeket (pl. MÁV, posta) jobb lenne magáncégeknek eladni.', w: { e: -1 } },
        { id: 'tuntetes', text: 'A tüntetés joga szent: akkor is, ha torlódik tőle a Nagykörút.', w: { l: -1 , d: 0.3} },
        { id: 'eu', text: 'Magyarország legyen az EU erős, aktív tagja, ne a kakukk a fészekben.', w: { n: -1 } },
        { id: 'vallas', text: 'A vallásnak fontos szerepe lehet a közösségek életében.', w: { t: 1 , s: 0.4} },
        { id: 'hivatal', text: 'A hivatalok ma már tényleg ügyfélbarátok. Tényleg.', joke: 'Ezt a mondatot legalább háromszor el kell olvasni.', w: { c: -1 } },
        { id: 'strand', text: 'A Balaton partján mindenkinek legyen szabad bejárása, strandbelépő nélkül.', w: { e: 1 , g: 0.3} },
        { id: 'halal', text: 'A legsúlyosabb bűnökért vissza kellene állítani a halálbüntetést.', w: { l: 1 } },
        { id: 'termek', text: 'A boltokban a magyar termékeket kellene előnyben részesíteni, még ha drágábbak is.', w: { n: 1, e: 0.5 , g: 0.3} },
        { id: 'ai', text: 'A rutinfeladatokat bátran rá lehetne bízni a mesterséges intelligenciára és az automatizálásra.', w: { t: -1 , s: -0.3} },
        { id: 'hirek', text: 'A híreket mindig fenntartással olvasom: mindenkinek van valami érdeke.', w: { c: 1 } },
        { id: 'vallalkozo', text: 'A vállalkozókat inkább békén kellene hagyni: kevesebb adó, kevesebb papír, több lendület.', w: { e: -1 } },
        { id: 'allam', text: 'Az állam ne szóljon bele, mit eszem, iszom vagy mit csinálok a négy fal között.', w: { l: -1 } },
        { id: 'unnep', text: 'A nemzeti ünnepek hangulatát (kokárda, himnusz) meg kell őrizni, nem csak a hosszú hétvégét.', w: { n: 1, t: 0.7 } },
        { id: 'kakaos', text: 'Régen minden jobb volt: a kakaós csiga is nagyobb volt.', joke: 'A nosztalgia a legerősebb magyar hungarikum.', w: { t: 1, c: 0.5 } },
        { id: 'civil', text: 'A civil szervezetek és az önkéntesek többet tesznek a közért, mint a pártok.', w: { c: 0.5, e: 0.3, k: 0.4} },
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
        { id: 'vitorlazo', emoji: '⛵', title: 'A Hétvégi Vitorlázó Liberális', v: { e: -0.7, l: -0.6, n: -0.5, t: -0.6, c: 0.1, g: 0, m: -0.3, d: -0.2, k: -0.7, s: -0.4 },
          desc: 'Szerinted az állam akkor jó, ha nem látszik. A Balatonon a saját vitorlásodat részesíted előnyben, a kormányzást pedig a szezonális szél mintájára képzeled el: ha fúj, jó, ha nem, nem avatkozunk bele.',
          sunday: 'Vasárnapi ebéden te vagy, aki azt mondja: „De mi lenne, ha kevesebb szabály lenne?”, majd elhal a beszélgetés.' },
        { id: 'kavehaz', emoji: '☕', title: 'A Kávéházi Világjavító', v: { e: 0.5, l: -0.7, n: -0.6, t: -0.7, c: 0.2, g: 0.5, m: -0.6, d: -0.1, k: -0.1, s: -0.3 },
          desc: 'Minden problémára van egy kávé, egy tanulmány és egy hosszú Facebook-hozzászólás. A világot jobbá teszed, de előbb még elmondod, hogy az előző kávéház jobb volt.',
          sunday: 'Ebéden az első húsleves után már a harmadik reformot vázolod egy szalvétán.' },
        { id: 'nagyapa', emoji: '🌻', title: 'A Kiskerti Nagypapa', v: { e: 0.1, l: 0.6, n: 0.7, t: 0.8, c: 0.3, g: 0.4, m: 0.4, d: 0.5, k: 0.6, s: 0.5 },
          desc: 'Tudod, hogyan kell paradicsomot nevelni, és azt is, hogy mi romlott el a világban. Szerinted a rend, a hagyomány és a jó hazai szilva a három pillér, a többi csak divat.',
          sunday: 'Vasárnap te vagy, aki a kertből hoz fel egy szatyor zöldséget, és közben kikér egy véleményt a hírekről.' },
        { id: 'palinka', emoji: '🍑', title: 'A Szabad Pálinkafőző', v: { e: -0.5, l: -0.8, n: 0.5, t: 0.5, c: 0.4, g: -0.1, m: 0.1, d: 0.6, k: 0.2, s: 0.4 },
          desc: 'Büszke vagy a magyar hagyományokra, de utálod, ha valaki megmondja, hogyan kell csinálni. A kazán a tiéd, a recept a tiéd, a hatóság pedig maradjon a hivatalban.',
          sunday: 'Ebéden megkínálsz mindenkit, és közben kifejted az államtalanítás elméletét.' },
        { id: 'szakszi', emoji: '🛠️', title: 'A Szakszervezeti Veterán', v: { e: 0.8, l: 0.2, n: 0.3, t: 0.4, c: 0.1, g: 0, m: 0.1, d: 0.4, k: 0.7, s: -0.1 },
          desc: 'Szerinted a munkának tisztelete van, a bérnek minimuma, az ebédszünetnek pedig szent hossza. Minden vitából a kollektív szerződés felé tereled a témát.',
          sunday: 'Ebédnél felállsz, és megkérdezed, ki fizeti a túlórát. Senki sem válaszol.' },
        { id: 'hazmester', emoji: '🔑', title: 'A Határozott Házmester', v: { e: 0.1, l: 0.9, n: 0.5, t: 0.6, c: 0.1, g: 0.2, m: 0.5, d: 0.2, k: 0.4, s: -0.2 },
          desc: 'A lépcsőház tiszta, a kapukód titkos, a szabály az szabály. Szerinted a világ azért bonyolult, mert túl kevés benne a házirend.',
          sunday: 'Vasárnap te vagy, aki a tányért is rendben visszaviszi, és megjegyzi, ki hagyta nyitva az ajtót.' },
        { id: 'nomad', emoji: '💻', title: 'A Digitális Nomád Kakaóscsiga-Hiányban', v: { e: -0.6, l: -0.4, n: -0.8, t: -0.8, c: 0.3, g: 0.2, m: -0.6, d: -0.4, k: -0.8, s: -0.2 },
          desc: 'Ma Lisszabon, holnap valahol laptoppal. A hazádat szereted, csak éppen a wifi jobb máshol. Szerinted a határok rossz ötletek, a távmunka pedig emberi jog.',
          sunday: 'Ebéden felhívod a családot videón, mert épp nem vagy otthon. Sosem vagy.' },
        { id: 'cinikus', emoji: '🙄', title: 'Az Örök Cinikus (Mindenki Lop)', v: { e: 0, l: 0, n: 0, t: 0, c: 0.95, g: 0, m: 0, d: 0.5, k: -0.3, s: 0.1 },
          desc: 'Nem hiszel senkinek, semmiben, de legalább elég szórakoztatóan. Szerinted minden ígéret kampányszöveg, minden kampányszöveg ígéret, és a kettő között nincs különbség.',
          sunday: 'Ebédnél csak mosolyogsz: „Hát persze. Majd pont ezek.”' },
        { id: 'bekes', emoji: '🕊️', title: 'A Békés Kompromisszum-Barát', v: { e: 0.1, l: -0.1, n: -0.1, t: -0.1, c: -0.7, g: 0.3, m: -0.8, d: -0.2, k: 0.3, s: 0 },
          desc: 'Hiszel a párbeszédben, a jó szándékban és abban, hogy a vitából valami jó is kisülhet. Néha túl naiv vagy, de legalább te nem veszel részt a kommentháborúkban.',
          sunday: 'Ebéden te vagy az, aki közli: „Mindenkinek igaza van egy kicsit”, majd elosztja a sütit.' },
        { id: 'hazafias', emoji: '🚩', title: 'A Hazafias Újító', v: { e: 0.2, l: 0.0, n: 0.7, t: -0.5, c: -0.2, g: 0.1, m: 0.6, d: 0.3, k: 0.4, s: 0.2 },
          desc: 'Szereted az országod, és éppen ezért akarod megújítani. Zászló, közösség, de modern: a himnuszra is lehet remix, ha a szívből jön.',
          sunday: 'Ebéden elmeséled, hogy a falunapot ezúttal digitalizálnátok, és senki sem tudja eldönteni, hogy ez jó ötlet-e.' },
        { id: 'piacos', emoji: '🥕', title: 'A Falusi Piacos Realista', v: { e: -0.3, l: 0.3, n: 0.6, t: 0.5, c: 0.0, g: 0.3, m: 0.2, d: 0.4, k: 0.4, s: 0.3 },
          desc: 'Alaposan megnézed az árat, a termelőt és az időjárást. Szerinted a józan ész a legjobb közgazdaságtan, a magyar termék pedig mindig frissebb.',
          sunday: 'Ebéden megmondod, mennyibe került a krumpli, és hogy a tavalyi ennél olcsóbb volt.' },
        { id: 'szabadelvu', emoji: '📜', title: 'A Szabadelvű Hagyományőrző', v: { e: -0.7, l: -0.3, n: 0.4, t: 0.6, c: 0.1, g: -0.3, m: 0.3, d: -0.2, k: -0.2, s: 0 },
          desc: 'Tisztelettel nézed a múltat, de nem szereted, ha az állam bármit előír. Szerinted a hagyomány a család és a közösség dolga, nem a hivataloké.',
          sunday: 'Ebéden felsorolod a családfát, aztán az adókulcsot, és mindkét téma ugyanúgy végződik: „kevesebb beleszólás”.' },
        { id: 'merleg', bias: 1.25, emoji: '⚖️', title: 'A Mérsékelt Mérleg', v: { e: 0, l: 0, n: 0, t: 0, c: 0, g: 0, m: 0, d: 0, k: 0, s: 0 },
          desc: 'Mindenhol középen állsz, mintha a kiegyensúlyozottság hungarikum lenne. Meghallgatsz minden érvet, és valahogy mindegyikben van igazság. Ez néha bölcsesség, néha csak nem vettél részt a vitában.',
          sunday: 'Ebéden megkérdezed: „Mindkét oldalnak vannak jó pontjai”, mire három ember egyszerre sóhajt.' },
        { id: 'technokrata', emoji: '📊', title: 'A Táblázatkezelő Technokrata', v: { e: 0.3, l: 0.5, n: -0.3, t: -0.7, c: -0.3, g: 0.2, m: 0.1, d: -0.9, k: -0.1, s: -0.9 },
          desc: 'Minden problémára van egy Excel-tábla, és minden Excel-tábla megoldás is. Szerinted a politika annyira működik, amennyire mérni lehet, és ahol nem mérhető, ott még dolgozni kell.',
          sunday: 'Ebédnél diagramon mutatod meg, hogy a rántott hús és a pörkölt valójában ugyanolyan hatékony.' },
        { id: 'civil', emoji: '🧤', title: 'A Civil Önkéntes', v: { e: 0.7, l: -0.5, n: -0.2, t: -0.5, c: -0.4, g: 0.6, m: -0.4, d: 0.2, k: 0.6, s: -0.1 },
          desc: 'Ha baj van, nem vársz: összeszeded a szomszédokat, és megoldjátok. Hiszel a közösségben, a segítségben és abban, hogy a jó ügyekért érdemes időt áldozni.',
          sunday: 'Ebéden te vagy, aki bejelenti, hogy jövő szombaton szemétszedés lesz, és már mindenkit beírt.' },
        
        { id: 'zold', emoji: '🚲', title: 'A Biciklis Természetbarát', v: { e: 0.4, l: -0.3, n: -0.5, t: -0.5, c: -0.1, g: 0.95, m: -0.5, d: 0, k: 0.3, s: -0.2 },
          desc: 'A kerékpár nálad nem eszköz, hanem világnézet. Szerinted a bolygó nem a következő kormány ügye, hanem a tiéd, és ezt ki is mondod, lehetőleg a dugóban álló autósoknak, tisztelettel.',
          sunday: 'Ebéden megkérdezed, honnan származik a hús, és ki szállította. Senki nem tudja, ezért mindenki a krumplit eszi.' },
        { id: 'orszem', emoji: '🛡️', title: 'Az Éber Őrszem', v: { e: 0.1, l: 0.6, n: 0.6, t: 0.4, c: 0.2, g: 0, m: 0.9, d: 0.2, k: 0.3, s: -0.1 },
          desc: 'Szerinted a béke nem ajándék, hanem szolgálat. Mindig van valaki, akinek résen kell lennie, és te szívesen vagy az. A zárat kétszer ellenőrzöd, a térképet háromszor.',
          sunday: 'Ebédnél te állsz a leghátul, látod az ajtót, és tudod, hol van a tartalék sütemény.' },
        { id: 'kocsma', emoji: '🍺', title: 'A Kocsmaasztali Népbölcs', v: { e: 0.2, l: -0.2, n: 0.4, t: 0.3, c: 0.5, g: -0.1, m: 0.2, d: 0.9, k: 0.3, s: 0.5 },
          desc: 'Nem járt egyetemre, de az élet iskoláját kitűnőre végezte. Szerinted a szakértők a térképet ismerik, te viszont a terepet. Egy korsó mellett az egész világ megoldható, legalábbis a következő körig.',
          sunday: 'Ebéden te vagy, aki kijelenti: „Nem kell ahhoz tanulmány, hogy ezt lássa az ember.” Mindenki bólint, mert megkapta a levest.' },
        { id: 'jos', emoji: '🔮', title: 'A Csillagjós Intuíció-Mester', v: { e: 0, l: -0.4, n: -0.2, t: 0.2, c: -0.2, g: 0.4, m: -0.5, d: 0.2, k: 0.2, s: 0.95 },
          desc: 'A horoszkópod szerint ma jó napod lesz, és te hiszel is neki. Az érzéseid többet számítanak, mint a táblázatok, a jelek pedig mindenhol ott vannak: a lift szintjében, a buszszámban, a kávé habjában.',
          sunday: 'Ebéden megkérdezed mindenki csillagjegyét, majd az asztalnál ülők helyét átrendezed a „rezgések” miatt.' },
        { id: 'remete', emoji: '🏔️', title: 'A Független Remete', v: { e: -0.4, l: -0.6, n: -0.2, t: -0.2, c: 0.3, g: 0.2, m: -0.2, d: -0.1, k: -0.95, s: 0 },
          desc: 'A legjobb társaság a saját társaságod, a legjobb találkozó pedig az, amelyik elmarad. Szerinted mindenki járja a maga útját, és ha lehet, ne ugyanazon a szűk ösvényen.',
          sunday: 'Vasárnap „megnézed” az ebédet, vagyis küldesz egy képet a tányérodról, és már indulsz is vissza a csendbe.' }
    
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
        { id: 'potyazo', name: 'Lógás és potyázás', blurb: 'amikor más dolgozik, ő meg kihasználja', roast: 'Nálad a „majd a másik megcsinálja” a legnagyobb bűn. A közös munkából nem lehet lógni, a közös kasszából meg nem lehet ingyen élni.' },
        { id: 'keses', name: 'Késés és megbízhatatlanság', blurb: 'amikor valaki rendszeresen elkésik, vagy az utolsó pillanatban mond le', roast: 'Neked a megbeszélt időpont nem ajánlás, hanem ígéret. A „már úton vagyok” nálad akkor érvényes, ha tényleg úton van, nem az előszobában. Az idő mindenkié, csak a késők nem hajlandók ezt tudomásul venni.' },
        { id: 'sorban', name: 'Sorbaállás és előzés', blurb: 'amikor valaki a sorban vagy a forgalomban mindenki elé akar kerülni', roast: 'Nálad a sor szent: aki előretolakszik, az nem siet, hanem csal. A „csak egy kérdésem lenne” a pénztárnál vészjelzés, a türelmes várakozás pedig a civilizáció egyik utolsó fényes pontja.' },
        { id: 'okos', name: 'Fölényeskedés és közbevágás', blurb: 'amikor valaki mindent jobban tud, és még be sem fejezted a mondatot', roast: 'Te végighallgatod a másikat, mielőtt kijavítod. A „ezt én is tudom” és a közbevágás nálad nem lendület, hanem rossz szokás. A jó beszélgetésben mindenki befejezheti a mondatát, legalább az elsőt.' },
        { id: 'igeret', name: 'Üres ígéret', blurb: 'amikor valaki megígér valamit, és eszében sincs megtartani', roast: 'Nálad az „ott leszek” és a „megcsinálom” fogadalom, nem hangulatjelentés. Az „írok még” szerinted nem udvariassági forma, hanem tartozás. Ezért nehéz veled: komolyan veszed, amit mondanak.' },
        { id: 'kutya', name: 'Gazdátlan kutyapiszok', blurb: 'amikor a kutyás nem szedi fel, amit a kutyája otthagyott', roast: 'Szerinted a séta végén a zacskó nem opció, hanem a kutyatartás záradéka. A járdán a szabad szemmel is látható „meglepetések” nálad nem helyi színek, hanem bűnjelek, amelyekbe ráadásul belelép az ember.' },
        { id: 'rendetlen', name: 'Rendetlenség a közös térben', blurb: 'amikor mások után kell elmosogatni, felmosni vagy összeszedni', roast: 'A közös konyha nálad nem szabad préri, hanem közös felelősség. A mosogatóban álló halom edényt múzeumnak látod, amelynek nincs nyitvatartása, de van felelőse.' },
        { id: 'spoiler', name: 'Spoilerezés', blurb: 'amikor valaki elmondja a sorozat végét, mielőtt megnézted', roast: 'Nálad a „nem szólok, csak annyit, hogy a végén...” kezdetű mondat bűncselekmény gyanúja. A csavar titkát szerinted úgy kell őrizni, mint a nagymama receptjét: csak a családnak, és csak szükség esetén.' },
        { id: 'henceg', name: 'Hencegés és fényezés', blurb: 'amikor valaki folyton azzal dicsekszik, mije van, vagy mit ért el', roast: 'Te örülsz mások sikerének, de a harmadik „én a múltkor éppen...” kezdetű mondatnál már a poharadat vizsgálod. Szerinted a tényleg jó dolgok magukért beszélnek; ami nem, azt úgyis a hencegő mondja el.' }
    ];

    // Minden érték pontosan kétszer szerepel, így mindenkinek ugyanannyi esélye van.
    var HATED_PAIRS = [
        ['rongalas', 'kornyezet'], ['figyelem', 'tragar'], ['szexizmus', 'anarchia'], ['tolvaj', 'zaj'], ['pletyka', 'potyazo'],
        ['rongalas', 'tolvaj'], ['kornyezet', 'figyelem'], ['tragar', 'szexizmus'], ['anarchia', 'pletyka'], ['zaj', 'potyazo']
    ];

    // =========================================================
    // ÉRTÉK-ÁLLÍTÁSOK (A rész): gyors 50 (tier 1), részletes 100 (tier 1+2), extra hosszú 150 (tier 1+2+3), mindegyik mellett hazugság-próbák.
    // Sok állítás a "zavar-skálákra" is hat (h), így a két rész kölcsönösen erősíti egymást, ha a B részt is kitöltöd.
    // =========================================================
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
    // [id, id]: egyszerre egyetérteni mindkettővel ellentmondás (csak akkor számít, ha a mód mindkettőt kérdezi)
    var TWINS = [
        ['sorkaton', 'sorkaton2'], ['euro', 'euro2'], ['szavazat', 'szavazat2'], ['palinka', 'palinka2'],
        ['bkk', 'bkk2'], ['vallalkozo', 'adoemel'], ['masodik', 'kemeny'],
        ['g_muanyag', 'g_muanyag2'], ['d_nepakarat', 'd_nepakarat2'], ['m_haboru', 'm_haboru2'], ['k_aldozat', 'k_siker'], ['s_dont_esz', 's_dont_erzes']
    ];

    // Ellenőrző kérdések. Kétféle van, hogy ne lehessen „mindenre igent / nemet” mondva átmenni:
    //   expect 'no':  „soha / mindig” állítás, amit gyakorlatilag senki nem mondhat el magáról igazán: a bólintás gyanús.
    //   expect 'yes': szinte mindenkivel megtörtént, hétköznapi tény: a tagadás gyanús.
    var LIES = [
        { id: 'l_hazug', text: 'Életemben soha egyetlen hazugságot sem mondtam.', joke: 'Ez a mondat maga is próbálkozás.' },
        { id: 'l_eperc', text: 'Soha nem mondtam, hogy „öt perc, és ott vagyok”, miközben még el sem indultam.', joke: 'A cipő nem számít, az még a lépcsőházban van.' },
        { id: 'l_feltetel', text: 'Mindig elolvasom a felhasználási feltételeket, mielőtt az „Elfogadom” gombra kattintok.', joke: 'Mind a 94 oldalt.' },
        { id: 'l_telefon', text: 'Sosem fordult elő velem, hogy „csak egy percre” megnéztem a telefonom, és eltelt egy óra.', joke: 'Ezt éppen a telefonodon olvasod.' },
        { id: 'l_kulcs', expect: 'yes', text: 'Életemben legalább egyszer elfelejtettem, hová tettem a kulcsomat, a telefonomat vagy a szemüvegemet.', joke: 'Gyanús, hogy most is a kezedben van.' },
        { id: 'l_bolint', expect: 'yes', text: 'Előfordult már, hogy bólogattam valamire, pedig nem értettem teljesen.', joke: 'A bólogatás a legrégebbi beleegyezés-szimulátor.' },
        { id: 'l_nev', expect: 'yes', text: 'Legalább egyszer megfeledkeztem valaki nevéről, miközben beszélgettem vele.', joke: 'A „na, te” teljesen jogos megszólítás.' }
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
        l_telefon: 'A „csak egy percre” pillantás és az elröpült idő: soha egyetlen alkalommal sem.',
        l_kulcs: 'Ellenőrző kérdés: ez szinte mindenkivel megtörtént, ezért itt az „egyetértek” az őszinte válasz.',
        l_bolint: 'Ellenőrző kérdés: szinte mindenki bólintott már úgy, hogy nem értett mindent, ezért itt az „egyetértek” az őszinte válasz.',
        l_nev: 'Ellenőrző kérdés: ez gyakorlatilag mindenkivel előfordult, ezért itt az „egyetértek” az őszinte válasz.'
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
    function enrich(list) {
        list.forEach(function (st) {
            if (HELP[st.id]) st.help = HELP[st.id];
            if (!st.joke && JOKE[st.id]) st.joke = JOKE[st.id];
        });
    }
    [OLD_ST, NEW_V, LIES].forEach(enrich);

    // ---------- A tételek összeállítása ----------
    // Az eredeti állítások szintje (gyors / részletes / extra). Mindegyik tengelyen szintenként 5-5 állítás van.
    var TIER_OLD = {
        bkk: 1, bkk2: 1, tanar: 1, piac: 1, albi: 1,
        sorkaton: 1, sorkaton2: 1, tuntetes: 1, kamera: 1, allam: 1,
        euro: 1, euro2: 1, hatar: 1, eu: 1, nyelv: 1,
        csalad: 1, hazassag: 1, vallas: 1, smink: 1, kakaos: 1,
        szavazat: 1, szavazat2: 1, politikus: 1, hivatal: 1, hirek: 1,
        privat: 2, strand: 2, vallalkozo: 2, adoemel: 2, nyugdij: 2,
        palinka: 2, palinka2: 2, halal: 2, fegyelem: 2, masodik: 2,
        unnep: 2, nyelv2: 2, bevandor: 2,
        ai: 2, kisbolt: 2, projekt: 2,
        haver: 2, panasz: 2, civil: 2, kozmeghall: 2,
        kemeny: 3, szemet: 3, moderal: 3, termek: 3, sajat: 3
    };
    var LIE_TIER = { l_hazug: 1, l_kulcs: 1, l_telefon: 2, l_eperc: 2, l_bolint: 2, l_feltetel: 3, l_nev: 3 };

    function mk(kind, part, st) { var o = { kind: kind, part: part }; Object.keys(st).forEach(function (k) { o[k] = st[k]; }); return o; }

    var VALUE_ALL = [];
    OLD_ST.forEach(function (st) {
        var o = mk('v', 'a', st);
        o.tier = TIER_OLD[st.id];
        if (H_BOTH[st.id]) o.h = H_BOTH[st.id];
        VALUE_ALL.push(o);
    });
    NEW_V.forEach(function (st) { var o = mk('v', 'a', st); o.tier = TIER_OLD[st.id]; VALUE_ALL.push(o); });
    ITEMS.VALUE.forEach(function (st) { VALUE_ALL.push(mk('v', 'a', st)); });
    var LIE_ALL = LIES.map(function (st) { var o = mk('l', 'a', st); o.w = {}; o.lie = true; o.expect = st.expect || 'no'; o.tier = LIE_TIER[st.id]; return o; });
    // Rangsorolós feladatok: a feladat egy lista-elem, a lehetőségei a válaszok kulcsai (lásd core.flat)
    var RANK_ALL = ITEMS.RANK.map(function (t) { return mk('r', 'a', t); });

    var HATED_NAME = {};
    HATED.forEach(function (h) { HATED_NAME[h.id] = h.name.toLowerCase(); });
    var ROLE_HELP = {
        R: 'Fordított állítás: az egyetértés itt azt jelzi, hogy ez kevésbé zavar.',
        X: 'Összehasonlítás: az egyetértés az elsőnek említett dolgot teszi zavaróbbá, a másodikat kevésbé zavaróvá.',
        S: 'Helyzetfüggő állítás: egyetértés = ez akkor is zavar, ha van mentség.'
    };
    var HATED_ALL = ITEMS.HATED_B.map(function (st) {
        var o = mk('h', 'b', st);
        if (!o.help) {
            if (o.role === 'D') {
                var main = Object.keys(o.h).sort(function (a, b) { return Math.abs(o.h[b]) - Math.abs(o.h[a]); })[0];
                o.help = 'Egyetértés = ez engem zavar. (Téma: ' + HATED_NAME[main] + ')';
            } else o.help = ROLE_HELP[o.role];
        }
        return o;
    });
    var PREJ_ALL = ITEMS.PREJ_B.map(function (st) { return mk('p', 'b', st); });
    var ALL = VALUE_ALL.concat(LIE_ALL, RANK_ALL, HATED_ALL, PREJ_ALL);

    // Téma-réteg: femboyosabb szövegek és poénok (csak text / help / joke íródik felül, a pontozás és a linkek nem változnak).
    var THEME_UNKNOWN = [];
    (function applyTheme() {
        var T = ITEMS.THEME || {};
        var groups = { VALUE: VALUE_ALL, RANK: RANK_ALL, HATED: HATED_ALL };
        Object.keys(groups).forEach(function (g) {
            var byId = {};
            groups[g].forEach(function (it) { byId[it.id] = it; });
            Object.keys(T[g] || {}).forEach(function (id) {
                var it = byId[id], o = T[g][id];
                if (!it) { THEME_UNKNOWN.push(g + ':' + id); return; }
                ['text', 'help', 'joke'].forEach(function (f) { if (o[f]) it[f] = o[f]; });
            });
        });
    })();

    // Kevert, de egyenletes sorrend: tengelyenként (témánként) véletlenszerű, a csoportok egyenletesen elosztva, az ikrek egymástól távol.
    // A magot rögzítettük, így mindenki ugyanazt a sorrendet kapja, és a teszt tesztelhető.
    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function groupOf(it) {
        if (it.kind === 'l') return 'lie';
        if (it.kind === 'r') return 'rank';
        var o = it.kind === 'v' ? it.w : it.kind === 'h' ? it.h : it.g;
        var best = null;
        Object.keys(o || {}).forEach(function (k) { if (best === null || Math.abs(o[k]) > Math.abs(o[best])) best = k; });
        return it.kind === 'p' ? best.split('_')[0] : best;
    }
    function spread(items, seed) {
        var rnd = rng(seed), groups = {};
        items.forEach(function (it) { var g = groupOf(it); (groups[g] = groups[g] || []).push(it); });
        var keyed = [];
        Object.keys(groups).sort().forEach(function (g) {
            var arr = groups[g];
            for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
            arr.forEach(function (it, i) { keyed.push({ it: it, k: (i + 0.15 + rnd() * 0.7) / arr.length }); });
        });
        keyed.sort(function (a, b) { return a.k - b.k; });
        return keyed.map(function (x) { return x.it; });
    }
    var MIN_GAP = 10;
    function separateTwins(list) {
        var pos = {};
        for (var round = 0; round < 8; round++) {
            var moved = false;
            list.forEach(function (it, i) { pos[it.id] = i; });
            TWINS.forEach(function (p) {
                var a = pos[p[0]], b = pos[p[1]];
                if (a === undefined || b === undefined || Math.abs(a - b) >= MIN_GAP) return;
                var hi = Math.max(a, b), lo = Math.min(a, b);
                var to = hi + MIN_GAP + 4 < list.length ? hi + MIN_GAP + 4 : Math.max(0, lo - MIN_GAP - 4);
                var tmp = list[hi]; list[hi] = list[to]; list[to] = tmp;
                list.forEach(function (it, i) { pos[it.id] = i; });
                moved = true;
            });
            if (!moved) break;
        }
        return list;
    }
    function tierOf(list, max) { return list.filter(function (it) { return it.tier <= max; }); }

    // Az A rész listái módonként (az állítások és a hazugság-próbák együtt)
    var A_LISTS = {
        short: separateTwins(spread(tierOf(VALUE_ALL.concat(LIE_ALL, RANK_ALL), 1), 101)),
        long: separateTwins(spread(tierOf(VALUE_ALL.concat(LIE_ALL, RANK_ALL), 2), 202)),
        xlong: separateTwins(spread(tierOf(VALUE_ALL.concat(LIE_ALL, RANK_ALL), 3), 303))
    };
    // A B rész: előbb az utált értékek, utána az előítélet-barométer tételei
    function bList(max, seed) { return spread(tierOf(HATED_ALL, max), seed).concat(spread(tierOf(PREJ_ALL, max), seed + 1)); }
    var B_LISTS = { short: [], long: bList(1, 404), xlong: bList(2, 505) };
    B_LISTS.hlong = B_LISTS.long;
    // Az ikerpárok csak azokban a módokban számítanak, ahol mindkét tagot megkérdezzük
    function twinsIn(list) {
        var ids = {};
        list.forEach(function (it) { ids[it.id] = true; });
        return TWINS.filter(function (p) { return ids[p[0]] && ids[p[1]]; });
    }

    // Az őszinteség-mérő sávjai (alsó határ szerint, csökkenő sorrendben)
    var HONESTY_TIERS = [
        { min: 90, name: 'Kristálytiszta', text: 'Alig akadt fogás rajtad: vagy őszinte vagy, vagy nagyon jól hazudsz.' },
        { min: 70, name: 'Többnyire őszinte', text: 'Néhol szépítettél egy kicsit, de ez teljesen emberi.' },
        { min: 45, name: 'Kicsit szépítettél', text: 'Pár válaszod nem fér össze egymással, vagy az ellenőrző kérdéseken gyanúsan válaszoltál.' },
        { min: 20, name: 'Meseszerű', text: 'Ha ez egy mese, akkor ez a mese elég szórakoztató, de a teszt nem hiszi el.' },
        { min: 0, name: 'Pinokkió-szint', text: 'A teszt orra is megnőtt, miközben értékelt. Az eredményt csak fenntartással érdemes olvasni.' }
    ];

    // Megbízhatóság: figyelmeztető jelzések (a sorszám a megosztott linkben a bitmaszk helye), sávok és a tengelyek biztosságának szintjei
    var REL_FLAGS = [
        { id: 'straight', text: 'Szinte mindenre ugyanazt válaszoltad, ezért a válaszok nem rajzolnak ki valódi képet.' },
        { id: 'lies', text: 'Az ellenőrző kérdéseken gyanúsan válaszoltál: lehetetlen állításnak bólintottál, vagy egy mindenkivel megtörtént dolgot tagadtál.' },
        { id: 'twins', text: 'Egymásnak ellentmondó állításokkal is egyetértettél.' },
        { id: 'neutral', text: 'Sok válaszod közepes vagy „passz-féle” volt, ezért kevés a támpont.' },
        { id: 'skips', text: 'Sok kérdést kihagytál, ezért kevesebb adatból számoltunk.' },
        { id: 'axes', text: 'Több tengelyen ellentmondó válaszaid voltak, vagy kevés volt a támpont.' },
        { id: 'mixed', text: 'A típusod nem egyértelmű: két típus majdnem egyformán illik rád.' },
        { id: 'lowfit', text: 'Egyik tréfás típus sem illik igazán rád, ez egy ritka, vegyes profil.' },
        { id: 'scales', text: 'Néhány utált-érték vagy előítélet-skálán ellentmondtál magadnak.' },
        { id: 'flat', text: 'Nincs kirívó utált értéked: a válaszaid nem mutatnak erős preferenciát.' },
        { id: 'few', text: 'Rövid teszt: tengelyenként csak öt állításból dolgozik, ezért tágabb a hibahatár.' },
        { id: 'mirror', text: 'A tükörpárokban többször ellentétes irányba döntöttél, ezért a téma eredménye középre húzódik.' }
    ];
    var REL_TIERS = [
        { min: 80, id: 'high', name: 'Megbízható', text: 'Következetes válaszok: az eredmény jó eséllyel tükrözi a valódi nézeteidet.' },
        { min: 60, id: 'good', name: 'Többnyire megbízható', text: 'Néhány kisebb ellentmondás vagy bizonytalanság volt, de a kép összességében stabil.' },
        { min: 40, id: 'unsure', name: 'Bizonytalan', text: 'Több válaszod ellentmond egymásnak, vagy sok volt a közepes válasz: az eredményt fenntartással olvasd.' },
        { min: 0, id: 'low', name: 'Nem megbízható', text: 'Az ellentmondások miatt ez az eredmény inkább játék, mint tükör. Próbáld meg újra, lassabban és következetesebben.' }
    ];
    var AXIS_LEVELS = [
        { id: 0, name: 'bizonytalan', text: 'ellentmondó vagy kevés válasz' },
        { id: 1, name: 'közepes', text: 'kisebb ellentmondás' },
        { id: 2, name: 'biztos', text: 'következetes válaszok' }
    ];

    // =========================================================
    // TESZT-VERZIÓ
    // A megosztott link tartalmazza, melyik verzióval készült az eredmény (a bináris link első bájtjának felső fele,
    // a régi JSON linkek mind az 1-es verzió). Ha egy kérdés vagy skála jelentése változik, a VERSION nő, és a régi
    // jelentést a LEGACY őrzi (az ertektest-legacy.js-ben), hogy a korábban megosztott eredmények továbbra is helyesen jelenjenek meg.
    // =========================================================
    var VERSION = 4;
    var VERSIONS = [
        { v: 1, date: '2026-10-24', note: 'Az első kiadás: öt tengely, az utált értékek politikai-ideológiai dolgok voltak (pénzhajhászás, parancsuralom, pátosz és társaik).' },
        { v: 2, date: '2026-10-25', note: 'Az utált értékek társadalmi bosszantó dolgok lettek (rongálás, környezetszennyezés, figyelmetlenség, trágárság, szexizmus és társaik); még mindig öt tengely.' },
        { v: 3, date: '2026-10-25', note: 'Tíz tengelyes értékrend (gyors 50, részletes 100, extra hosszú 150 állítással), megbízhatósági jelzés minden eredményhez, az utált értékek és az előítélet-barométer opcionális, bonyolultabb és tükrösebb kérdésekkel, kategóriánkénti megosztható képek.' },
        { v: 4, date: '2026-10-27', note: 'Nyolc új utált érték (késés, sorbaállás és előzés, fölényeskedés, üres ígéret, kutyapiszok, rendetlenség, spoilerezés, hencegés): összesen 18 skála az utált értékek és előítéletek részben, hosszabb B résszel. A gyors mód körei a klasszikus tíz értékkel maradtak.' }
    ];
    // A v3 tengelyei és típusai változatlanok, csak az utált értékek (az első tíz) voltak kevesebben
    var LEGACY = Object.assign({}, LEGACY_DATA);
    LEGACY[3] = { AXES: AXES, ARCHETYPES: ARCHETYPES, HATED: HATED.slice(0, 10) };

    // Egy tesztverzió tengelyei, típusai és utált értékei (a régi linkek ezekkel jelennek meg), ismeretlen verzióra null
    function defsFor(ver) {
        if (ver === VERSION) return { AXES: AXES, ARCHETYPES: ARCHETYPES, HATED: HATED };
        return LEGACY[ver] || null;
    }

    var api = {
        VERSION: VERSION, VERSIONS: VERSIONS, LEGACY: LEGACY, defsFor: defsFor,
        AXES: AXES, ARCHETYPES: ARCHETYPES, HATED: HATED, HATED_PAIRS: HATED_PAIRS, TOPICS: TOPICS, PREJ: PREJ, MIRROR: MIRROR,
        VALUE: VALUE_ALL, LIES: LIE_ALL, RANK_ITEMS: RANK_ALL, RANK_VALUES: [2, 1, 0, -1, -2], STARS: { short: 1, long: 2, xlong: 3 }, STAR_MULT: 2, HATED_ITEMS: HATED_ALL, PREJ_ITEMS: PREJ_ALL, ALL: ALL,
        A_LISTS: A_LISTS, B_LISTS: B_LISTS, TWINS: TWINS, twinsIn: twinsIn,
        THEME_UNKNOWN: THEME_UNKNOWN,
        HONESTY_TIERS: HONESTY_TIERS, REL_FLAGS: REL_FLAGS, REL_TIERS: REL_TIERS, AXIS_LEVELS: AXIS_LEVELS
    };
    if (isNode) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.data = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
