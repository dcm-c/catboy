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
        { id: 'e', name: 'Gazdaság', neg: 'Szabadpiac', pos: 'Elosztó állam' },
        { id: 'l', name: 'Társadalom', neg: 'Szabadság', pos: 'Rend' },
        { id: 'n', name: 'Közösség', neg: 'Világpolgár', pos: 'Nemzeti' },
        { id: 't', name: 'Értékek', neg: 'Haladó', pos: 'Hagyománytisztelő' },
        { id: 'c', name: 'Bizalom', neg: 'Bizakodó', pos: 'Cinikus' }
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

    var api = { AXES: AXES, STATEMENTS: STATEMENTS, ARCHETYPES: ARCHETYPES, HATED: HATED, HATED_PAIRS: HATED_PAIRS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.data = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
