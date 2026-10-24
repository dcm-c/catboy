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

    // "Utált értékek": párokban kell dönteni, melyik zavar jobban. A pontszám = hányszor választottad.
    var HATED = [
        { id: 'penz', name: 'Pénzhajhászás', blurb: 'amikor mindent az üzlet dönt el', roast: 'Szerinted nem minden áru: a barátság, a naplemente és a Balaton sem.' },
        { id: 'egyenlo', name: 'Kényszerű egyenlősdi', blurb: 'amikor mindenki ugyanannyit kap, akármit tett', roast: 'Szerinted az igazságosság nem egyforma szelet tortát jelent.' },
        { id: 'parancs', name: 'Parancsuralom', blurb: 'amikor az az érv, hogy „mert én mondtam”', roast: 'Nálad az érvelés nem hangerő kérdése.' },
        { id: 'szabados', name: 'Felelőtlen szabadosság', blurb: 'amikor mindenki azt csinál, amit akar, és másokra marad a rendetlenség', roast: 'Szerinted a szabadság addig szép, amíg valaki nem a te kapudba parkol.' },
        { id: 'patosz', name: 'Nemzeti pátosz', blurb: 'amikor a hazafiasságot hangerővel mérik', roast: 'Neked a szeretet a falunapi hurrázásnál csendesebb is lehet.' },
        { id: 'sznob', name: 'Világpolgár-sznobéria', blurb: 'amikor mindent lenéznek, ami nem külföldi', roast: 'Szerinted a „nálunk ez nem divat” és a „Párizsban ez másképp van” ugyanaz a mondat.' },
        { id: 'hagyomany', name: 'Erőltetett hagyománytisztelet', blurb: 'amikor az az érv, hogy „mindig is így volt”', roast: 'A mindig is így volt a legrégebbi kifogás: ráadásul ritkán igaz.' },
        { id: 'ujitas', name: 'Megújítási láz', blurb: 'amikor mindent újra kell gondolni, csak azért is', roast: 'Szerinted nem minden rossz, ami régi, és nem minden jó, ami új.' },
        { id: 'cinizmus', name: 'Cinizmus', blurb: 'amikor „úgysem számít semmi”', roast: 'Utálod az „úgyis mindegy” hangulatot: pedig néha tényleg szórakoztató.' },
        { id: 'naivitas', name: 'Gyanútlan naivitás', blurb: 'amikor mindenki azt hiszi, hogy majd minden megoldódik magától', roast: 'Te legalább számolod a következményeket, még ha ezzel a vacsora hangulatát is elviszed.' }
    ];

    // Minden érték pontosan kétszer szerepel, így mindenkinek ugyanannyi esélye van.
    var HATED_PAIRS = [
        ['penz', 'egyenlo'], ['parancs', 'szabados'], ['patosz', 'sznob'], ['hagyomany', 'ujitas'], ['cinizmus', 'naivitas'],
        ['penz', 'parancs'], ['egyenlo', 'patosz'], ['szabados', 'hagyomany'], ['sznob', 'cinizmus'], ['ujitas', 'naivitas']
    ];

    // =========================================================
    // HOSSZÚ TESZT (96 kérdés: 60 értékrész + 36 utált-érték rész)
    //  - 40 értékállítás: a rövid teszt 32 állítása + 7 ellentétes "iker" + 1 új. Sok értékállítás a zavar-skálákra is hat (h).
    //  - 24 "zavar-állítás": az utált értékek skáláit mérik (h), és sok közülük a tengelyeket is mozgatja (w).
    //  - 6 hazugság-próba: olyan "soha"-állítások, amik gyakorlatilag senkire sem igazak.
    // Az őszinteséget háromféleképp vizsgáljuk: lehetetlen állítások, ellentmondó ikerpárok, "mindenre ugyanazt nyomtad".
    // A h súly pozitív: aki egyetért, annál jobban zavar az adott érték; negatív: kevésbé zavar.
    // =========================================================
    var LONG_DROP = { civil: 1, nyelv2: 1, projekt: 1, strand: 1, kamera: 1, sajat: 1, hirek: 1, termek: 1 };

    var H_BOTH = {
        sorkaton: { szabados: 0.5 }, palinka: { parancs: 0.5 }, piac: { egyenlo: 0.7 }, tanar: { penz: 0.5 }, privat: { egyenlo: 0.4 },
        hazassag: { hagyomany: 0.5 }, csalad: { ujitas: 0.5 }, unnep: { sznob: 0.5 }, euro: { patosz: 0.5 },
        politikus: { naivitas: 0.5, cinizmus: -0.5 }, szavazat: { cinizmus: 0.7 }, hivatal: { cinizmus: 0.5 }, haver: { naivitas: 0.5 },
        kakaos: { ujitas: 0.5 }, fegyelem: { szabados: 0.5 }, allam: { parancs: 0.5 }, albi: { penz: 0.5 }, nyugdij: { egyenlo: 0.4 },
        vallalkozo: { egyenlo: 0.5 }, masodik: { parancs: 0.4 }, smink: { hagyomany: 0.5 }, ai: { hagyomany: 0.3 }, vallas: { ujitas: 0.3 }
    };

    // Ellentétes párok az érték-részben: ha mindkettővel egyetértesz, ellentmondtál magadnak.
    var NEW_V = [
        { id: 'sorkaton2', text: 'A katonai szolgálat legyen kizárólag önkéntes: senkit ne lehessen belekényszeríteni.', w: { l: -1 }, h: { parancs: 0.5 } },
        { id: 'euro2', text: 'A forint a nemzeti önállóságunk része: nem szabad lecserélni az euróra.', w: { n: 1 }, h: { patosz: -0.5 } },
        { id: 'szavazat2', text: 'Egy szavazaton úgysem múlik semmi, felesleges elmenni a választásra.', w: { c: 1 }, h: { cinizmus: -0.7 } },
        { id: 'palinka2', text: 'A házi párlat készítését szigorúan engedélyhez és ellenőrzéshez kellene kötni.', w: { l: 1 }, h: { parancs: -0.4 } },
        { id: 'bkk2', text: 'A tömegközlekedés legyen fizetős: aki használja, az fizessen érte.', w: { e: -1 }, h: { penz: -0.4 } },
        { id: 'adoemel', text: 'A nagyvállalatok adóját jelentősen emelni kellene, hogy jusson a közösre.', w: { e: 1 }, h: { penz: 0.5 } },
        { id: 'kemeny', text: 'Aki hibázik, viselje a következményeit: második esély nélkül.', joke: 'A „hiba nélküli ember” még nem született meg.', w: { l: 1 }, h: { parancs: -0.4 } },
        { id: 'kozmeghall', text: 'A közmeghallgatásokra el kellene járni: ha nem megyünk, nincs jogunk panaszkodni.', joke: 'A kávé és a pogácsa nem biztos, hogy van.', w: { c: -1, l: 0.3 }, h: { cinizmus: 0.5 } }
    ];
    // [id, id]: egyszerre egyetérteni mindkettővel ellentmondás
    var TWINS = [
        ['sorkaton', 'sorkaton2'], ['euro', 'euro2'], ['szavazat', 'szavazat2'], ['palinka', 'palinka2'],
        ['bkk', 'bkk2'], ['vallalkozo', 'adoemel'], ['masodik', 'kemeny']
    ];

    // Zavar-állítások: az egyetértés itt azt jelenti, hogy az adott érték zavar.
    var HATED_ST = [
        { id: 'z_penz1', text: 'Zavar, ha mindent az határoz meg, mennyibe kerül.', h: { penz: 1 }, w: { e: 0.3 } },
        { id: 'z_penz2', text: 'Idegesít, ha valamit csak azért tartanak értékesnek, mert drága.', h: { penz: 1 } },
        { id: 'z_penz3', text: 'Bosszant, ha a közös dolgoknál (kórház, iskola) is előbb a haszon, utána az ember számít.', h: { penz: 1 }, w: { e: 1 } },
        { id: 'z_egy1', text: 'Idegesít, ha mindenkit egyformán kezelnek, akármit tett le az asztalra.', h: { egyenlo: 1 }, w: { e: -0.5 } },
        { id: 'z_egy2', text: 'Zavar, ha az erőfeszítés semmit nem számít, mert úgyis mindenki ugyanannyit kap.', h: { egyenlo: 1 }, w: { e: -1 } },
        { id: 'z_egy3', text: 'Bosszant, ha tilos észrevenni a különbségeket ember és ember között.', h: { egyenlo: 1 } },
        { id: 'z_par1', text: 'Idegesít, ha valaki azzal zárja le a vitát, hogy „mert én mondtam”.', h: { parancs: 1 }, w: { l: -0.5 } },
        { id: 'z_par2', text: 'Zavar a felesleges szabály, amit senki nem tud megindokolni.', h: { parancs: 1 }, w: { l: -1 } },
        { id: 'z_par3', text: 'Kínosan érzem magam, ha olyan embert kell tisztelni, aki semmit nem tett le az asztalra.', h: { parancs: 1 }, w: { c: 0.3 } },
        { id: 'z_sza1', text: 'Idegesít, ha valaki a közösben szemetel, mert „szabad ország”.', h: { szabados: 1 }, w: { l: 1 } },
        { id: 'z_sza2', text: 'Zavar, ha az emberek felelősség nélkül osztogatják a véleményüket és a veszélyeket.', h: { szabados: 1 } },
        { id: 'z_sza3', text: 'Bosszant, ha a szabályok betartása mindig csak a többiek dolga.', h: { szabados: 1 }, w: { l: 0.5 } },
        { id: 'z_pat1', text: 'Idegesít a hangos, zászlólengető hazafiaskodás.', h: { patosz: 1 }, w: { n: -1 } },
        { id: 'z_pat2', text: 'Zavar, ha valakit azzal támadnak, hogy „nem elég magyar”.', h: { patosz: 1 }, w: { n: -0.5 } },
        { id: 'z_szn1', text: 'Idegesít, ha valaki lenézi, ami magyar, csak mert külföldön másképp csinálják.', h: { sznob: 1 }, w: { n: 1 } },
        { id: 'z_szn2', text: 'Zavar, ha mindent az dönt el, mi a divat Párizsban vagy New Yorkban.', h: { sznob: 1 } },
        { id: 'z_hag1', text: 'Idegesít a „mindig is így volt” érv.', h: { hagyomany: 1 }, w: { t: -1 } },
        { id: 'z_hag2', text: 'Zavar, ha valamit csak azért kell megtenni, mert a nagyszülők is megtették.', h: { hagyomany: 1 }, w: { t: -0.7 } },
        { id: 'z_uj1', text: 'Idegesít, ha mindent újra akarnak gondolni, ami addig tökéletesen működött.', h: { ujitas: 1 }, w: { t: 1 } },
        { id: 'z_uj2', text: 'Zavar, ha a „modern” szó önmagában érvnek számít.', h: { ujitas: 1 }, w: { t: 0.5 } },
        { id: 'z_cin1', text: 'Idegesít, ha valaki mindenre azt mondja: „úgysem számít semmi”.', h: { cinizmus: 1 }, w: { c: -1 } },
        { id: 'z_cin2', text: 'Zavar, ha a cinizmust okosságnak, a lelkesedést butaságnak tartják.', h: { cinizmus: 1 }, w: { c: -0.5 } },
        { id: 'z_nai1', text: 'Idegesít, ha valaki gondolkodás nélkül elhisz mindent, amit mondanak neki.', h: { naivitas: 1 }, w: { c: 1 } },
        { id: 'z_nai2', text: 'Zavar, ha a nehéz problémára annyi a válasz: „majd megoldódik”.', h: { naivitas: 1 }, w: { c: 0.5 } }
    ];

    // Hazugság-próba: "soha / mindig" állítások, amiket gyakorlatilag senki nem mondhat el magáról igazán.
    var LIES = [
        { id: 'l_keses', text: 'Életemben egyszer sem késtem el semmiről.', joke: 'A busz késése nem számít.' },
        { id: 'l_hazug', text: 'Életemben soha egyetlen hazugságot sem mondtam.', joke: 'Ez a mondat maga is próbálkozás.' },
        { id: 'l_eperc', text: 'Soha nem mondtam, hogy „öt perc, és ott vagyok”, miközben még el sem indultam.', joke: 'A cipő nem számít, az még a lépcsőházban van.' },
        { id: 'l_feltetel', text: 'Mindig elolvasom a felhasználási feltételeket, mielőtt az „Elfogadom” gombra kattintok.', joke: 'Mind a 94 oldalt.' },
        { id: 'l_harag', text: 'Soha életemben nem haragudtam meg egy közeli ismerősömre sem.', joke: 'A családi ebédek nem számítanak.' },
        { id: 'l_telefon', text: 'Sosem fordult elő velem, hogy „csak egy percre” megnéztem a telefonom, és eltelt egy óra.', joke: 'Ezt éppen a telefonodon olvasod.' }
    ];

    // A zavar-állítások egy része az értékrészben (A) marad, mert a tengelyeket is mozgatja; a többi az utált-érték részbe (B) kerül.
    var HATED_A = { z_penz3: 1, z_egy2: 1, z_par2: 1, z_sza1: 1, z_pat1: 1, z_szn1: 1, z_hag1: 1, z_hag2: 1, z_uj1: 1, z_uj2: 1, z_cin1: 1, z_cin2: 1, z_nai1: 1, z_nai2: 1 };

    // 10 további zavar-állítás: így mind a 10 utált értéket pontosan 2 tétel méri a B részben.
    var HATED_NEW = [
        { id: 'z_pat3', text: 'Zavar, ha a nemzeti ünnepen a pózolás fontosabb, mint az emlékezés.', h: { patosz: 1 } },
        { id: 'z_szn3', text: 'Idegesít, ha valami csak azért „jobb”, mert külföldi címke van rajta.', h: { sznob: 1 } },
        { id: 'z_hag3', text: 'Bosszant, ha valamit csak azért tartanak meg, hogy a szomszéd ne szóljon meg.', h: { hagyomany: 1 }, w: { t: -0.5 } },
        { id: 'z_hag4', text: 'Zavar, ha egy ünnepet vagy szokást megváltoztatni szentségtörésnek számít.', h: { hagyomany: 1 } },
        { id: 'z_uj3', text: 'Idegesít, ha az újdonság kedvéért eldobják azt, ami még tökéletesen jó volt.', h: { ujitas: 1 } },
        { id: 'z_uj4', text: 'Zavar, ha évente új szlogen, új rendszer és új név jön ugyanarra a dologra.', h: { ujitas: 1 }, w: { c: 0.3 } },
        { id: 'z_cin3', text: 'Idegesít, ha a lelkesedésre az az első válasz: „majd meglátod”.', h: { cinizmus: 1 } },
        { id: 'z_cin4', text: 'Zavar, ha mások jókedvét szarkazmussal kell elrontani.', h: { cinizmus: 1 } },
        { id: 'z_nai3', text: 'Idegesít, ha valaki a veszélyt is csak legyinti: „ugyan, nem lesz baj”.', h: { naivitas: 1 } },
        { id: 'z_nai4', text: 'Zavar, ha a jószándékot már a megoldásnak tartják.', h: { naivitas: 1 } }
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

    var PREJ_ST = [
        { id: 'p_nem1', text: 'A gyereknevelés és a háztartás alapvetően a nők dolga.', g: { nem_up: 1 }, w: { t: 0.6 } },
        { id: 'p_nem2', text: 'Vezetői állásokra a férfiak általában alkalmasabbak.', g: { nem_up: 1 }, w: { t: 0.4 } },
        { id: 'p_nem3', text: 'A férfiak többsége eleve elnyomó, még ha nem is tud róla.', g: { nem_dn: 1 }, w: { t: -0.4 } },
        { id: 'p_nem4', text: 'Egy férfi véleményét a nemek egyenjogúságáról nem érdemes komolyan venni.', g: { nem_dn: 1 } },
        { id: 'p_kulf1', text: 'Nem szívesen laknék olyan környéken, ahol sok a külföldi.', g: { kulf_up: 1 }, w: { n: 0.6 } },
        { id: 'p_kulf2', text: 'Aki nem itt született, az sosem lesz igazi magyar.', g: { kulf_up: 1 }, w: { n: 0.6 } },
        { id: 'p_kulf3', text: 'Aki büszke a magyarságára, az általában szűk látókörű.', g: { kulf_dn: 1 }, w: { n: -0.6 } },
        { id: 'p_kulf4', text: 'Aki ragaszkodik a magyar szokásokhoz, az haladásellenes.', g: { kulf_dn: 1 }, w: { n: -0.4, t: -0.4 } },
        { id: 'p_lgbt1', text: 'Zavar, ha két azonos nemű ember nyilvánosan csókolózik.', g: { lgbt_up: 1 }, w: { t: 0.6 } },
        { id: 'p_lgbt2', text: 'A Pride-felvonulás nem az utcára való.', g: { lgbt_up: 1 }, w: { t: 0.5 } },
        { id: 'p_lgbt3', text: 'Aki a hagyományos családmodellt védi, az eleve gyűlölködő.', g: { lgbt_dn: 1 }, w: { t: -0.5 } },
        { id: 'p_lgbt4', text: 'A hagyományos családban élők kiváltságosak, és ezt folyton illene elismerniük.', g: { lgbt_dn: 1 } },
        { id: 'p_vall1', text: 'Zavar, ha egy másik vallás szokásai láthatóvá válnak a környezetemben.', g: { vall_up: 1 }, w: { n: 0.3 } },
        { id: 'p_vall2', text: 'A kisebbségi vallások hívei nehezebben illeszkednek be, ezért kevésbé bízom bennük.', g: { vall_up: 1 } },
        { id: 'p_vall3', text: 'A vallásos emberek általában kevésbé gondolkodnak önállóan.', g: { vall_dn: 1 }, w: { t: -0.4 } },
        { id: 'p_vall4', text: 'Aki hisz Istenben, azzal nem érdemes komoly vitát folytatni.', g: { vall_dn: 1 } }
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

    function mk(kind, part, st) { var o = { kind: kind, part: part }; Object.keys(st).forEach(function (k) { o[k] = st[k]; }); return o; }

    var LONG_A = [], LONG_B = [];
    STATEMENTS.forEach(function (st) {
        if (LONG_DROP[st.id]) return;
        var o = mk('v', 'a', st);
        if (H_BOTH[st.id]) o.h = H_BOTH[st.id];
        LONG_A.push(o);
    });
    NEW_V.forEach(function (st) { LONG_A.push(mk('v', 'a', st)); });
    HATED_ST.forEach(function (st) { (HATED_A[st.id] ? LONG_A : LONG_B).push(mk('h', HATED_A[st.id] ? 'a' : 'b', st)); });
    LIES.forEach(function (st) { var o = mk('l', 'a', st); o.w = {}; o.lie = true; LONG_A.push(o); });
    HATED_NEW.forEach(function (st) { LONG_B.push(mk('h', 'b', st)); });
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
