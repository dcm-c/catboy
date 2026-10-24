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
    //  - 4 hazugság-próba: olyan "soha"-állítások, amik gyakorlatilag senkire sem igazak.
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
        { id: 'szemet', text: 'Aki a közterületen szemetel, azt pénzbírsággal kellene sújtani.', joke: 'A kukától három méterre eldobott csikk is számít.', w: { l: 1 }, h: { szabados: 0.5 } },
        { id: 'moderal', text: 'A közösségi oldalakon a károsnak ítélt tartalmat gyorsan le kell venni, még ha néha tévedésből is.', w: { l: 1, c: 0.3 }, h: { szabados: 0.4 } },
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

    // Hazugság-próba: négy "soha / mindig" állítás, amit gyakorlatilag senki nem mondhat el magáról igazán (kevés, hogy ne legyen unalmas).
    var LIES = [
        { id: 'l_hazug', text: 'Életemben soha egyetlen hazugságot sem mondtam.', joke: 'Ez a mondat maga is próbálkozás.' },
        { id: 'l_eperc', text: 'Soha nem mondtam, hogy „öt perc, és ott vagyok”, miközben még el sem indultam.', joke: 'A cipő nem számít, az még a lépcsőházban van.' },
        { id: 'l_feltetel', text: 'Mindig elolvasom a felhasználási feltételeket, mielőtt az „Elfogadom” gombra kattintok.', joke: 'Mind a 94 oldalt.' },
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
        // zavar-állítások (agree = ez engem zavar)
        z_penz1: 'Egyetértés = zavar, ha mindent a pénz mérce dönt el.',
        z_penz2: 'Egyetértés = zavar, ha a magas ár önmagában már érték.',
        z_penz3: 'Egyetértés = zavar, ha a kórház és az iskola is nyereségre dolgozik.',
        z_egy1: 'Egyetértés = zavar, ha mindenkire ugyanazok a szabályok vonatkoznak, akármit tett.',
        z_egy2: 'Egyetértés = zavar, ha a kitartás és a lazaság ugyanazt hozza.',
        z_egy3: 'Egyetértés = zavar, ha nem szabad különbséget tenni az emberek között.',
        z_par1: 'Egyetértés = zavar, ha az érv helyett a rang dönt.',
        z_par2: 'Egyetértés = zavar az indokolatlan szabály.',
        z_par3: 'Egyetértés = zavar, ha csak a pozíciója miatt kell valakit tisztelni.',
        z_sza1: 'Egyetértés = zavar, ha valaki a szabadságra hivatkozva másokra hagyja a rendetlenséget.',
        z_sza2: 'Egyetértés = zavar, ha valaki következmények nélkül oszt véleményt és tanácsot.',
        z_sza3: 'Egyetértés = zavar, ha a szabály csak másoknak szól.',
        z_pat1: 'Egyetértés = zavar a hangos, látványos hazafiaskodás.',
        z_pat2: 'Egyetértés = zavar, ha valakit „nem elég magyarnak” bélyegeznek.',
        z_pat3: 'Egyetértés = zavar, ha az ünnepi póz többet számít, mint az emlékezés.',
        z_szn1: 'Egyetértés = zavar, ha valaki minden hazait lenéz, mert máshol másképp csinálják.',
        z_szn2: 'Egyetértés = zavar, ha a külföldi divat dönti el, mi „menő”.',
        z_szn3: 'Egyetértés = zavar, ha valami csak a külföldi címke miatt számít jobbnak.',
        z_hag1: 'Egyetértés = zavar, ha a múlt érv helyett érv-pótlék.',
        z_hag2: 'Egyetértés = zavar a kényszeres hagyománykövetés.',
        z_hag3: 'Egyetértés = zavar, ha csak a környezet elvárása tart meg valamit.',
        z_hag4: 'Egyetértés = zavar, ha a változtatás tabu.',
        z_uj1: 'Egyetértés = zavar a felesleges átszervezés.',
        z_uj2: 'Egyetértés = zavar, ha az újdonság már önmagában érv.',
        z_uj3: 'Egyetértés = zavar, ha a jót is lecserélik, csak mert új van.',
        z_uj4: 'Egyetértés = zavar az újracsomagolt régi dolog.',
        z_cin1: 'Egyetértés = zavar az „úgysem számít” hozzáállás.',
        z_cin2: 'Egyetértés = zavar, ha a cinizmus okosnak, a lelkesedés butának számít.',
        z_cin3: 'Egyetértés = zavar, ha a lelkesedést rögtön lehűtik.',
        z_cin4: 'Egyetértés = zavar, ha valaki a mások jókedvét gúnnyal rontja el.',
        z_nai1: 'Egyetértés = zavar a kritikátlan hiszékenység.',
        z_nai2: 'Egyetértés = zavar a „majd megoldódik” hozzáállás.',
        z_nai3: 'Egyetértés = zavar, ha valaki a veszélyt is elbagatellizálja.',
        z_nai4: 'Egyetértés = zavar, ha a jó szándék helyettesíti a megoldást.',
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
        // zavar-állítások
        z_penz2: 'A drága lekvár is csak lekvár.',
        z_penz3: 'A beteg is „ügyfél” lesz.',
        z_egy1: 'A sorban állás nem válogat. Vagy mégis?',
        z_egy3: 'A ruhatári cédula is megkülönböztet.',
        z_par1: 'A „mert én mondtam” hatalmas érv az óvodában.',
        z_par2: 'A „TILOS” felirat mögött ritkán áll indoklás.',
        z_par3: 'A rang legnagyobb előnye a parkolóhely.',
        z_sza1: 'A szabad ország szemeteskuka nélkül nem sokat ér.',
        z_pat1: 'A zászló nem kiabál. Csak a tulajdonosa.',
        z_pat3: 'A szelfi nem emlékezés.',
        z_szn1: 'A „nálunk ez nem megy” a legtartósabb magyar hobbi.',
        z_szn2: 'Párizsban is csak egy sima kávét kérnek.',
        z_szn3: 'A címke a legolcsóbb minőség-garancia.',
        z_hag1: 'A „mindig is így volt” az első magyar kifogás.',
        z_hag3: 'A szomszéd mindent lát.',
        z_uj1: 'A működő dolgot sosem szabad megjavítani.',
        z_uj3: 'A régi tűzhely rendszerint tovább él, mint a modern.',
        z_uj4: 'Az új név, a régi probléma.',
        z_cin1: 'Az „úgysem számít” szavazótábor óriási.',
        z_cin3: 'A „majd meglátod” a lelkesedés legnagyobb ellensége.',
        z_cin4: 'A szarkazmus a magyar kultúra nemzeti sportja.',
        z_nai1: 'A „minden igaz, amit az interneten olvasok” kategória.',
        z_nai2: 'A „majd megoldódik” a legnagyobb magyar remény.',
        z_nai3: 'Az „ugyan már” a veszélyjelzés legnagyobb ellensége.',
        z_nai4: 'A jó szándék vezet a pokolba. Vagy legalább a bürokráciába.'
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
    [STATEMENTS, NEW_V, HATED_ST, HATED_NEW, PREJ_ST, LIES].forEach(enrich);

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
