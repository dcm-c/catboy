// =========================================================
// FEMBOY-TÍPUS TESZT - adatok és pontozás (tiszta, DOM nélküli, Node-ban tesztelhető: test/femtest.test.js)
//
// 8 tengely (mindegyiken két pólus), tengelyenként 4 állítás (2 előre, 2 fordítva), 32 állítás összesen.
// Minden állításhoz tartozik egy poén. Az eredmény: 13 vicces típus (a tengelyek értékéhez legközelebbi), 6 vicces mérő
// és egy következetességi jelző. A megosztott link csak a 32 választ tartalmazza (3 bit / válasz), az eredményt újraszámoljuk,
// így a szövegek javítása nem töri el a régi linkeket. Ha az állítások sorrendje, száma vagy iránya változik: VERSION++.
// =========================================================
(function (root) {
    'use strict';

    var VERSION = 1;
    var DATE = '2026-11-16';

    // Tengelyek: pozitív érték = a "pos" pólus. A sorrend a típusok `v` vektorának sorrendje is.
    var AXES = [
        { id: 'stilus', name: 'Stílus-világ', icon: '🎨', neg: 'Pasztell', pos: 'Sötét alt', negIcon: '🍬', posIcon: '🖤' },
        { id: 'latvany', name: 'Outfit-produkció', icon: '💅', neg: 'Hétköznapi laza', pos: 'Teljes show', negIcon: '🧦', posIcon: '✨' },
        { id: 'energia', name: 'Társasági energia', icon: '🔋', neg: 'Szobafemboy', pos: 'Társasági', negIcon: '🏠', posIcon: '🎉' },
        { id: 'hobbi', name: 'Terep', icon: '🗺️', neg: 'Net-lakó', pos: 'Kintlakó', negIcon: '🎮', posIcon: '🌳' },
        { id: 'bizalom', name: 'Önbizalom', icon: '🪞', neg: 'Szerény', pos: 'Színpadias', negIcon: '🙈', posIcon: '😎' },
        { id: 'humor', name: 'Humor', icon: '🎭', neg: 'Szelíd', pos: 'Szarkasztikus', negIcon: '🧸', posIcon: '🃏' },
        { id: 'rend', name: 'Életvitel', icon: '🗓️', neg: 'Tervező', pos: 'Káosz', negIcon: '📋', posIcon: '🌪️' },
        { id: 'szolid', name: 'Szakszervezeti szellem', icon: '✊', neg: 'Magányos macska', pos: 'Szolidáris', negIcon: '🐈‍⬛', posIcon: '🤝' }
    ];
    var AX = AXES.map(function (a) { return a.id; });

    // Az állítások sorrendje a kitöltés sorrendje is: a tengelyek körbejárnak, így nem jön egymás után két azonos témájú.
    // dir: +1 = az egyetértés a "pos" pólus felé visz, -1 = a "neg" felé.
    var ITEMS = [
        // 1. kör
        { id: 'f01', ax: 'stilus', dir: 1, text: 'A fekete hoodie, a láncos nadrág és az éjféli playlist közelebb áll hozzám, mint bármi, ami habos-babos.', joke: 'A fekete az egyetlen szín, amiről a mosógép sem tud rosszat mondani.' },
        { id: 'f02', ax: 'latvany', dir: 1, text: 'Egy jó outfitet előbb megtervezek, kipróbálok háromszor, és csak utána lépek ki vele az ajtón.', joke: 'A tükör előtt töltött tíz perc nem hiúság, hanem minőségellenőrzés.' },
        { id: 'f03', ax: 'energia', dir: 1, text: 'Szívesen megyek találkozóra, conra vagy buliba, ahol sok az ember, és szívesen megismerek újakat.', joke: 'A tömegben legalább mindenki közel van a sütiasztalhoz.' },
        { id: 'f04', ax: 'hobbi', dir: -1, text: 'A szabadidőm nagy része képernyő előtt telik: játék, anime, Discord.', joke: 'A kinti világ egy rosszul optimalizált játék: a grafika jó, a kezelőfelület borzalmas.' },
        { id: 'f05', ax: 'bizalom', dir: 1, text: 'Ha néznek vagy fotóznak, élvezem a figyelmet, és nem esem zavarba.', joke: 'A figyelem olyan, mint a fény: a jó outfit alatt még a pasztell is kivirul.' },
        { id: 'f06', ax: 'humor', dir: -1, text: 'Inkább kedves és szelíd vagyok: egy jó szó vagy egy ölelés többet ér, mint egy csípős poén.', joke: 'Az ölelés ingyen van, a csípős megjegyzés viszont általában a végén többe kerül.' },
        { id: 'f07', ax: 'rend', dir: -1, text: 'Van naptáram, listám vagy legalább emlékeztetőm, és tényleg használom is őket.', joke: 'A lista olyan, mint a mosogatószivacs: használat nélkül csak dísz.' },
        { id: 'f08', ax: 'szolid', dir: 1, text: 'Szívesen segítek a közösségnek: szervezek, sütit viszek, vagy beszállok a közös ügyekbe.', joke: 'A gyűlés fénypontja nem a napirend, hanem hogy kinek a sütije fogy el először.' },
        // 2. kör
        { id: 'f09', ax: 'stilus', dir: -1, text: 'A pasztellrózsaszín az alapszínem: ha egy ruha nem úgy néz ki, mintha vattacukorból lenne, rossz napom lesz.', joke: 'A vattacukor legalább nem kérdezi, miért vagyok már megint rózsaszín.' },
        { id: 'f10', ax: 'latvany', dir: -1, text: 'A legjobb outfit az, amiben két perc alatt elkészülök, és nem kell gondolkodnom rajta.', joke: 'A hoodie nem ruha, hanem rendszerszintű megoldás.' },
        { id: 'f11', ax: 'energia', dir: -1, text: 'A tökéletes szombat este: takaró, sorozat és egy tál rágcsálnivaló, emberek nélkül.', joke: 'Az emberek nélküli este a legjobb társaság: sosem kérdezi, miért nem megyek.' },
        { id: 'f12', ax: 'hobbi', dir: 1, text: 'Szívesebben megyek túrázni, biciklizni vagy csak sétálni, mint egész nap a képernyő előtt ülni.', joke: 'A természet az egyetlen tartalom, aminek nem kell betöltődnie.' },
        { id: 'f13', ax: 'bizalom', dir: -1, text: 'Az új, bátor outfitet inkább otthon próbálom ki, mert nem akarok feltűnni.', joke: 'A szoknya legjobb tesztje a lakásban sétálni: ott legalább a macska sem ítélkezik.' },
        { id: 'f14', ax: 'humor', dir: 1, text: 'A barátaim szerint a humorom szarkasztikus, és a meme a fő nyelvem.', joke: 'A szarkazmus a szeretet nyelve, csak tíz fokkal élesebb hanggal.' },
        { id: 'f15', ax: 'rend', dir: 1, text: 'A legjobb ötleteim hajnali kettőkor jönnek, és azonnal el is kezdem megvalósítani őket.', joke: 'A hajnali kettő a legjobb projektvezető: nem hagy időt gondolkodni.' },
        { id: 'f16', ax: 'szolid', dir: -1, text: 'A saját utamat járom, és nem szeretek csoportok ügyeibe belekeveredni.', joke: 'A magányos macska nem gyűlésre jár, hanem a saját párkányára.' },
        // 3. kör
        { id: 'f17', ax: 'stilus', dir: -1, text: 'A szekrényemben több az aranyos mintás darab (cica, csillag, felhő), mint a sima fekete.', joke: 'A cicamintás zokni nem divat, hanem életforma.' },
        { id: 'f18', ax: 'latvany', dir: 1, text: 'Ha lehet, a körmöm, a sminkem és a kiegészítőim is passzoljanak a ruhámhoz.', joke: 'A körömlakk nem kiegészítő, hanem az outfit utolsó mondata.' },
        { id: 'f19', ax: 'energia', dir: 1, text: 'Ha belépek egy terembe, jó eséllyel én kezdek beszélgetni az ismeretlenekkel.', joke: 'Te vagy az, aki még a liftben is megkérdezi, mi a kedvenc animéd.' },
        { id: 'f20', ax: 'hobbi', dir: -1, text: 'A legjobb barátaim az interneten vannak, és őket jobban ismerem, mint a szomszédaimat.', joke: 'A szomszédom neve ismeretlen, a Discord-becenevem viszont három szerveren is szerepel.' },
        { id: 'f21', ax: 'bizalom', dir: 1, text: 'Ha valaki furcsán néz rám az utcán, inkább visszamosolygok, vagy odamegyek beszélgetni.', joke: 'A bámulás nem sértés, hanem ingyenes közönségmérés.' },
        { id: 'f22', ax: 'humor', dir: 1, text: 'Ha valaki cringe dolgot csinál, először magamban kommentálom, és csak utána vagyok kedves.', joke: 'A belső kommentár az a podcast, amit senki sem kért, de mindenki hallgat.' },
        { id: 'f23', ax: 'rend', dir: -1, text: 'A ruháim, a töltőim és a dolgaim ott vannak, ahová tettem őket.', joke: 'A töltő is mindig ott van, ahol hagytad: általában a másik szobában.' },
        { id: 'f24', ax: 'szolid', dir: 1, text: 'Ha valaki bajba kerül a közösségben, én vagyok az első, aki ír neki, vagy kiáll mellette.', joke: 'A szolidaritás az, amikor valaki a „jól vagy?” üzenetet küldi, nem a matricát.' },
        // 4. kör
        { id: 'f25', ax: 'stilus', dir: 1, text: 'Ha a ruhám túl cuki, inkább teszek mellé egy láncot vagy bakancsot, hogy ne legyek túl édes.', joke: 'A bakancs olyan, mint a só a csokin: elveszi a cukorsokkot.' },
        { id: 'f26', ax: 'latvany', dir: -1, text: 'A smink és a kiegészítők nálam legfeljebb alkalmi dolgok: a hétköznap a kényelemről szól.', joke: 'A kényelem az egyetlen divat, ami soha nem megy ki a divatból.' },
        { id: 'f27', ax: 'energia', dir: -1, text: 'Egy hosszú nap után az első dolgom, hogy elbújok, és csendben vagyok.', joke: 'A szobám az én saját Discord-szerverem: csak én vagyok bent, és ez így tökéletes.' },
        { id: 'f28', ax: 'hobbi', dir: 1, text: 'Ha jó idő van, rosszul érzem magam, ha bent maradok.', joke: 'A napfény ellen nincs kapucni: legfeljebb sapka.' },
        { id: 'f29', ax: 'bizalom', dir: -1, text: 'Néha elgondolkodom, hogy érdemes-e megmutatni a stílusomat másoknak.', joke: 'A „mit szólnak majd” az a ruhadarab, amit nem kötelező felvenni.' },
        { id: 'f30', ax: 'humor', dir: -1, text: 'Ha valaki rosszul érzi magát, azonnal félreteszem a vicceket, és vigasztalni kezdem.', joke: 'Egy plüss néha többet ér, mint egy bölcs tanács.' },
        { id: 'f31', ax: 'rend', dir: 1, text: 'A szobámban van egy halom, amit „majd kitakarítok” néven emlegetek, és már régóta ott van.', joke: 'A halom ott van, ahol az ablakpárkány és a jó szándék találkozik.' },
        { id: 'f32', ax: 'szolid', dir: -1, text: 'A közösségi szabályok jók, de én inkább a magam módján csinálom, ha nem árt senkinek.', joke: 'A szabály olyan, mint a szoknya hossza: mindenki másképp értelmezi.' }
    ];

    // Típusok: v = a tengelyek (AXES sorrendjében) ideális értéke -1..1. bias > 1: az „átlagos” típust nehezebb elérni.
    var TYPES = [
        { id: 'plussmacko', emoji: '🧸', title: 'A Pasztell Plüssmackó', v: [-0.8, -0.2, -0.3, -0.5, -0.5, -0.8, -0.2, 0.5], bias: 1.02,
          desc: 'Te vagy a közösség ölelésautomatája: puha, pasztell és szinte soha nem ideges. A szekrényed fele vattacukor, a másik fele plüss, és ha valaki rosszul van, te már hozod is a takarót.',
          outfit: 'Ruhatár: pasztell hoodie, cicafüles fejpánt, térdzokni három árnyalatban.', power: 'Ölelés. Bármire, bárkire, bármikor.', weak: 'A „nem” szó: inkább elvállalod a harmadik szervezést is.', motto: '„Egy ölelés mindent megold, a mosogatást kivéve.”', buddy: 'titkar', buddyWhy: 'Ő megszervezi, te meg megölelsz mindenkit, aki jön.' },
        { id: 'discordlovag', emoji: '🛡️', title: 'A Discord-lovag', v: [0, -0.5, -0.7, -0.9, -0.2, 0.5, 0.4, 0.6], bias: 0.98,
          desc: 'A szerver a váradat, a hangcsatorna a lovagi terem. A valóságban ritkán látnak, de a #általános chaten legendák keringenek rólad: arról, hogy mindig te vagy ott éjjel háromkor, amikor valakinek segítség kell.',
          outfit: 'Ruhatár: hoodie, kényelmes nadrág és egy gamer szék, amely már a testedhez nőtt.', power: 'Bárkinek válaszol hajnalban, és még szépen is.', weak: 'A napfény és a „most azonnal menjünk ki” kezdetű mondatok.', motto: '„Nem ülök képernyő előtt, hanem szervert védek.”', buddy: 'hoodieremete', buddyWhy: 'Ketten együtt a legjobb csendes bulit rendezik: mindenki a saját szobájából.' },
        { id: 'szoknyas', emoji: '✊', title: 'A Szoknyás Forradalmár', v: [-0.2, 0.8, 0.8, 0.2, 0.9, 0.5, 0.4, 0.9], bias: 0.83,
          desc: 'Ha belépsz egy terembe, a szoknyád előbb ér oda, mint te, és a transzparensed is kész van. Úgy hiszel a közösségben, hogy közben az első sorban állsz, és szerinted a legjobb tüntetés az, amelyiknek van afterpartyja.',
          outfit: 'Ruhatár: ráncos szoknya, kontrasztos kiegészítők, és mindig egy szivárványos kitűző.', power: 'Bárkit meg tud győzni arról, hogy jöjjön el a gyűlésre.', weak: 'A „csak egy percig maradunk” mondat, amit három órával később is ismételsz.', motto: '„Aki nem szólal fel, annak a szoknyája szólal fel helyette.”', buddy: 'titkar', buddyWhy: 'Te lelkesíted, ő beírja a jegyzőkönyvbe, hogy mikor kell hazamenni.' },
        { id: 'altmacska', emoji: '🐈‍⬛', title: 'Az Éjféli Alt-Macska', v: [0.9, 0.3, -0.4, -0.3, 0.2, 0.8, 0.6, -0.5], bias: 0.97,
          desc: 'Fekete ruha, éles humor, éjszakai playlistek. Kívülről rejtélyes vagy, belülről pedig ugyanúgy szereted a plüss állatot, csak nem mondod el senkinek. Ha egyszer megbízol valakiben, az a legkedvesebb ember lesz az életedben.',
          outfit: 'Ruhatár: fekete hálós póló, láncok, bakancs és egy titokban rózsaszín zokni.', power: 'Az a félmondat, amitől mindenki röhög, és senki sem tudja, miért.', weak: 'A napfényes délelőttök és a „milyen aranyos vagy ma!” kezdetű mondatok.', motto: '„A sötét csak egy színvilág, nem személyiség. De azért jól áll.”', buddy: 'plussmacko', buddyWhy: 'Ő puhítja a hangulatot, te pedig a jó poénokat hozod hozzá.' },
        { id: 'hoodieremete', emoji: '🧥', title: 'A Hoodie-remete', v: [0.2, -0.9, -0.9, -0.7, -0.7, 0.2, 0.5, -0.7], bias: 0.93,
          desc: 'A kapucni a te csendes erődöd, a szoba a te szentélyed. Kevesen látnak, de akik ismernek, azt mondják, hogy te vagy a legőszintébb ember a társaságban, csak ritkán jössz elő.',
          outfit: 'Ruhatár: túlméretezett hoodie, melegítő, és a kedvenc pár zokni, amiből már csak az egyik van meg.', power: 'Nyugodtan, hangosan hallgat, és mégis mindig tud valamit.', weak: 'A „kérlek, mutatkozz be” kezdetű játékok.', motto: '„A legjobb társaság a saját szobám, kivéve, ha jön pizza.”', buddy: 'discordlovag', buddyWhy: 'Együtt a legcsendesebb, mégis legboldogabb szervert vezetik.' },
        { id: 'constar', emoji: '🌟', title: 'A Con-sztár', v: [-0.5, 0.9, 0.9, -0.2, 0.8, 0.2, 0.3, 0.4], bias: 0.87,
          desc: 'A con a te természetes élőhelyed: mindenki ismer, mindenkivel fotózol, és a ruhád olyan, mintha külön stábja lenne. Hat órát mosolyogsz, aztán három napig pihensz, de megérte.',
          outfit: 'Ruhatár: teljes cosplay vagy pasztell szettek, tartalék kiegészítők és egy hátizsák ragasztóval.', power: 'Bárhol azonnal barátot szerez, még a ruhatárban is.', weak: 'Az utolsó busz, amit rendszeresen lekésel a „még egy fotó” miatt.', motto: '„Nem késtem el, hanem a bevonulásom volt hosszabb.”', buddy: 'eszteta', buddyWhy: 'Ő a ruhát tervezi, te pedig viszed a színpadra.' },
        { id: 'titkar', emoji: '📋', title: 'A Szervező Titkár', v: [-0.2, -0.1, 0.5, 0, 0.2, -0.3, -0.9, 0.9], bias: 1.05,
          desc: 'Te vagy a közösség agya és jegyzőkönyve. Neked van táblázatod a sütikről, emlékeztetőd a találkozókra, és tudod, ki hozza a poharakat. Szerinted a kaotikus buli az, ahol nincs lista.',
          outfit: 'Ruhatár: kényelmes, de rendezett szett, zsebekkel a jegyzettömbhöz.', power: 'Képes megszervezni bármit, még a hangulatot is.', weak: 'Ha valaki azt mondja: „majd menet közben kitaláljuk.”', motto: '„A spontaneitás előre tervezhető. Csak be kell írni a naptárba.”', buddy: 'kaosz', buddyWhy: 'Ő hozza az ötletet, te pedig a táblázatot hozzá.' },
        { id: 'eszteta', emoji: '🧦', title: 'A Térdzokni-esztéta', v: [-0.5, 0.9, 0, -0.2, 0.3, 0, -0.7, 0], bias: 1.09,
          desc: 'Neked a stílus tudomány: a zokni színe, a szoknya hossza és a fejpánt formája mind egy tervezett harmónia része. Úgy öltözöl, mintha minden nap fotó készülne rólad, és szerinted ez teljesen természetes.',
          outfit: 'Ruhatár: térdzokni kategóriánként rendezve, szoknya, színre hangolt kiegészítők.', power: 'Pillanatok alatt összeállít egy tökéletes szettet bármiből.', weak: 'Egy sima, nem passzoló kiegészítő, ami „nem is látszik, ugyan.”', motto: '„A részletekben lakik a pasztell.”', buddy: 'constar', buddyWhy: 'Együtt egy egész divatbemutatót megtöltenek.' },
        { id: 'cserkesz', emoji: '🏕️', title: 'A Pasztell Cserkész', v: [-0.2, -0.4, 0.4, 0.9, 0.3, -0.3, 0.2, 0.5], bias: 1.09,
          desc: 'Szerinted a pasztell színek a természetben a legszebbek: a rét, a naplemente, a naposcsibe. Túrázol, biciklizel, és közben mindig van nálad egy plusz sütemény a többieknek.',
          outfit: 'Ruhatár: túrabakancs, pasztell esőkabát és egy kicsi plüss a hátizsákon.', power: 'A térkép nélküli tájékozódás és a mindig ott lévő szendvics.', weak: 'A „csak egy perc, és hazaérünk” mondat, ami három órát jelent.', motto: '„A legjobb Wi-Fi a hegycsúcson van: ott csak a madarak kapcsolódnak.”', buddy: 'plussmacko', buddyWhy: 'Ő hozza az ölelést, te pedig a túrát és a szendvicset.' },
        { id: 'kaosz', emoji: '🌪️', title: 'A Káosz-kiscica', v: [-0.4, 0.1, 0.6, 0.1, 0.4, 0.7, 0.9, 0.2], bias: 0.97,
          desc: 'Egy kisbolygó, amelyik rózsaszín csillogással söpör végig a társaságon. Nincs terved, de mindig van ötleted, és a szobád egy kreatív katasztrófa. Szerinted a rend a lusták találmánya, és ebben van is valami.',
          outfit: 'Ruhatár: ami épp a legfelső kupacból elérhető, de valahogy mindig működik.', power: 'Bármit képes spontán, tökéletes hangulatúvá tenni.', weak: 'A határidők, a kulcsok és a töltő: bármelyik, bármikor.', motto: '„A rendetlenség csak rendszer, amit még nem értettek meg.”', buddy: 'titkar', buddyWhy: 'Ő az, aki egyáltalán el tudja érni, hogy odaérj a találkozóra.' },
        { id: 'kolto', emoji: '🌙', title: 'Az Érzelmes Költő', v: [0.5, 0, -0.6, -0.4, -0.6, -0.7, 0.4, 0], bias: 1.1,
          desc: 'A lelked egy hosszú, lassú dal, és a naplód tele van olyan sorokkal, amiket soha senkinek nem mutatsz meg. Szelíd vagy, és mélyen érzel, csak éppen hajnali háromkor, mikor mindenki más alszik.',
          outfit: 'Ruhatár: sötét, puha pulóverek, hosszú sál és egy jegyzetfüzet mindig a zsebben.', power: 'Úgy hallgat, hogy a másik rájön, mi a baja.', weak: 'A sorban állás, mert közben két verset is megírna fejben.', motto: '„Nem érzékeny vagyok, hanem magas felbontású.”', buddy: 'plussmacko', buddyWhy: 'Ő megölel, te pedig vers lesz az ölelésből.' },
        { id: 'rocksztar', emoji: '🎸', title: 'A Magányos Rocksztár', v: [0.8, 0.7, 0.3, 0.2, 0.9, 0.8, 0.5, -0.8], bias: 0.88,
          desc: 'A színpad a tiéd, a közönség pedig csak vendég. Szerinted a stílus attitűd, a poén fegyver, a többiek pedig a háttérkórus. A legjobb dolgokat egyedül csinálod, és ezt mindenki tudja, mert elmondod.',
          outfit: 'Ruhatár: bőrdzseki, szoknya és bakancs, plusz egy kis szívecske-kitűző „véletlenül”.', power: 'Képes bármilyen szobát egyetlen mondattal elnémítani.', weak: 'A csoportmunka, ahol valaki más mondja meg, mikor van szünet.', motto: '„Nem vagyok egyedül, csak a közönség még nem érkezett meg.”', buddy: 'titkar', buddyWhy: 'Ő az egyetlen, aki képes egyeztetni a koncertdátumokat veled.' },
        { id: 'atlag', emoji: '🌈', title: 'A Kiegyensúlyozott Pasztell-polgár', v: [0, 0, 0, 0, 0, 0, 0, 0], bias: 1.18,
          desc: 'Mindenből egy kicsit, de egyikből sem túl sok: egy picit pasztell, egy picit sötét, egy picit társasági, egy picit remete. Ez nem unalmas, hanem ritka: te vagy az, aki bármelyik társaságban otthonos, mert mindegyikből ismersz egy darabot.',
          outfit: 'Ruhatár: egy kis pasztell, egy kis fekete, mindig valami, ami mindenhez passzol.', power: 'Bárhol beilleszkedik, anélkül, hogy bárkit zavarna.', weak: 'A „te mit választanál?” kérdés, mert mindent szeretsz egy kicsit.', motto: '„Nem középen állok, hanem mindenhol egyszerre.”', buddy: 'kaosz', buddyWhy: 'Ő hozza a váratlant, te pedig a békét.' }
    ];

    // Vicces mérők: 0-100, a tengelyek súlyozott átlagából. low/mid/high: a megjegyzés a 0-33 / 34-66 / 67-100 sávhoz.
    var METERS = [
        { id: 'pasztell', name: 'Pasztell-szint', icon: '🍬', w: { stilus: -1 },
          low: 'Fekete a kedvenc szín. A pasztell csak távolról szimpatikus.', mid: 'Pasztell, de csak módjával: egy kis rózsaszín mindig belefér.', high: 'A szemed is vattacukor-színű. Az orvos szerint ez is stílus.' },
        { id: 'terdzokni', name: 'Térdzokni-függőség', icon: '🧦', w: { latvany: 1, stilus: -0.5 },
          low: 'Egy pár zokni = egy pár zokni. Életed is így nyugodt.', mid: 'A fiókodban van egy ötös csomag, és ez jó érzéssel tölt el.', high: 'Ha a térdzokni adóalap lenne, már rég a legnagyobb adófizető lennél.' },
        { id: 'discord', name: 'Discord-lakosság', icon: '🎮', w: { hobbi: -1, energia: -0.5 },
          low: 'A Discord csak egy ikon a telefonodon. A napfény viszont jól ismer.', mid: 'Tudod, mikor van az esti beszélgetés a szerveren, és ritkán maradsz le róla.', high: 'A szerver neked nem alkalmazás, hanem lakcím.' },
        { id: 'kamera', name: 'Kamera-bátorság', icon: '📸', w: { bizalom: 1, latvany: 0.5 },
          low: 'A kamera előtt inkább a kapucni mögé bújsz, és ez rendben van.', mid: 'Egy-két fotó belefér, ha a háttér szép és a fény jó.', high: 'A telefon kamerája már előre feszít, ha belépsz.' },
        { id: 'oleles', name: 'Ölelés-adagoló', icon: '🤗', w: { humor: -1, szolid: 0.5 },
          low: 'A szeretetnyelved a szarkazmus: „kösz, nagyon vicces” = ölelés.', mid: 'Ölelsz, ha kérik, és néha akkor is, ha nem.', high: 'Mindig van nálad ölelés, még akkor is, ha valaki csak a sót kéri.' },
        { id: 'kaosz', name: 'Káosz-faktor', icon: '🌪️', w: { rend: 1 },
          low: 'A kulcsaid, a töltőid és az emlékeztetőid hibátlanul működnek.', mid: 'Néha elveszik valami, de a rend sosem szűnik meg teljesen.', high: 'A szobád olyan, mint a régészeti ásatás: mindig talál valami újat.' }
    ];

    var TIERS = [ // a következetességhez
        { min: 78, name: 'Hajszálpontos', text: 'A válaszaid úgy illeszkednek, mint a térdzokni a combra: pontosan, és sehol nem csúszik le.' },
        { min: 55, name: 'Többnyire egyben van', text: 'Néhány apró ellentmondás akad, de ez nem baj: az emberek így izgalmasak.' },
        { min: 30, name: 'Kicsit kaotikus', text: 'A válaszaid kicsit ide-oda csúsztak, mint a rosszul rögzített hajcsat. Az eredmény inkább iránymutatás.' },
        { min: 0, name: 'Ellentmondás-bajnok', text: 'A válaszaid szinte minden tengelyen szembementek önmagukkal. Vagy rendkívül összetett vagy, vagy véletlenszerűen kattintgattál.' }
    ];

    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    // answers: 32 elemű tömb, értékei -2..2 vagy null (kihagyva)
    function axisScores(answers) {
        var out = {};
        AXES.forEach(function (a) { out[a.id] = { sum: 0, n: 0 }; });
        ITEMS.forEach(function (it, i) {
            var v = answers[i];
            if (v === null || v === undefined) return;
            out[it.ax].sum += v * it.dir;
            out[it.ax].n++;
        });
        var s = {};
        AXES.forEach(function (a) { var o = out[a.id]; var x = o.n ? 100 * o.sum / (2 * o.n) : 0; s[a.id] = x < 0 ? -Math.round(-x) : Math.round(x); });
        return s;
    }

    var SCALE = 3.4;
    function classify(scores) {
        var ranking = TYPES.map(function (t) {
            var d = 0;
            AXES.forEach(function (a, i) { var diff = scores[a.id] / 100 - t.v[i]; d += diff * diff; });
            return { id: t.id, d: Math.sqrt(d) * (t.bias || 1) };
        });
        ranking.sort(function (a, b) { return a.d - b.d; });
        return {
            id: ranking[0].id, fit: clamp(Math.round(100 * (1 - ranking[0].d / SCALE)), 5, 99),
            second: ranking[1].id, margin: (ranking[1].d - ranking[0].d) / SCALE, ranking: ranking
        };
    }

    function meters(scores) {
        return METERS.map(function (m) {
            var num = 0, den = 0;
            Object.keys(m.w).forEach(function (k) { num += m.w[k] * scores[k]; den += Math.abs(m.w[k]); });
            var value = clamp(Math.round(50 + 0.5 * num / den), 0, 100);
            return { id: m.id, name: m.name, icon: m.icon, value: value, text: value <= 33 ? m.low : value <= 66 ? m.mid : m.high };
        });
    }

    // Következetesség: egy tengelyen belül a (irányhelyes) válaszok szórása. 100 = mind egy irányba mutat.
    function consistency(answers) {
        var spreads = [], skipped = 0;
        AXES.forEach(function (a) {
            var vals = [];
            ITEMS.forEach(function (it, i) { if (it.ax === a.id && answers[i] !== null && answers[i] !== undefined) vals.push(answers[i] * it.dir); });
            if (vals.length >= 2) spreads.push(Math.max.apply(null, vals) - Math.min.apply(null, vals));
        });
        answers.forEach(function (v) { if (v === null || v === undefined) skipped++; });
        var index = spreads.length ? Math.round(100 * (1 - spreads.reduce(function (x, y) { return x + y; }, 0) / (spreads.length * 4))) : 0;
        var neutral = answers.filter(function (v) { return v === 0; }).length;
        var tier = TIERS.filter(function (t) { return index >= t.min; })[0];
        return { index: index, tier: tier, skipped: skipped, neutral: neutral, passzBajnok: (neutral + skipped) >= 20 };
    }

    function evaluate(answers) {
        var scores = axisScores(answers), cl = classify(scores);
        return { v: VERSION, answers: answers.slice(), scores: scores, type: cl.id, fit: cl.fit, second: cl.second, margin: cl.margin, meters: meters(scores), cons: consistency(answers) };
    }

    // ---------- Link: 1 bájt fejléc (0xF0 | verzió) + 32 × 3 bit (érték + 2; 7 = kihagyva) ----------
    var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    function b64enc(bytes) {
        var out = '', i;
        for (i = 0; i + 2 < bytes.length; i += 3) {
            var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
            out += ALPHA[(n >> 18) & 63] + ALPHA[(n >> 12) & 63] + ALPHA[(n >> 6) & 63] + ALPHA[n & 63];
        }
        var rest = bytes.length - i;
        if (rest === 1) { var a = bytes[i] << 16; out += ALPHA[(a >> 18) & 63] + ALPHA[(a >> 12) & 63]; }
        else if (rest === 2) { var b = (bytes[i] << 16) | (bytes[i + 1] << 8); out += ALPHA[(b >> 18) & 63] + ALPHA[(b >> 12) & 63] + ALPHA[(b >> 6) & 63]; }
        return out;
    }
    function b64dec(str) {
        var vals = [];
        for (var i = 0; i < str.length; i++) { var k = ALPHA.indexOf(str[i]); if (k < 0) return null; vals.push(k); }
        if (vals.length % 4 === 1) return null;
        var bytes = [];
        for (var j = 0; j < vals.length; j += 4) {
            var c = vals.slice(j, j + 4), n = (c[0] << 18) | ((c[1] || 0) << 12) | ((c[2] || 0) << 6) | (c[3] || 0);
            bytes.push((n >> 16) & 255);
            if (c.length > 2) bytes.push((n >> 8) & 255);
            if (c.length > 3) bytes.push(n & 255);
        }
        return bytes;
    }
    var BYTES = 1 + Math.ceil(ITEMS.length * 3 / 8);
    function encode(answers) {
        var bytes = [0xF0 | VERSION], bits = 0, acc = 0;
        for (var i = 0; i < ITEMS.length; i++) {
            var v = answers[i];
            var code = (v === null || v === undefined) ? 7 : clamp(Math.round(v), -2, 2) + 2;
            acc = (acc << 3) | code; bits += 3;
            while (bits >= 8) { bytes.push((acc >> (bits - 8)) & 255); bits -= 8; acc &= (1 << bits) - 1; }
        }
        if (bits > 0) bytes.push((acc << (8 - bits)) & 255);
        return b64enc(bytes);
    }
    // Hibás, csonka vagy újabb verziójú kódra null
    function decode(str) {
        if (typeof str !== 'string' || !/^[A-Za-z0-9_-]+$/.test(str)) return null;
        var bytes = b64dec(str);
        if (!bytes || bytes.length !== BYTES) return null;
        if ((bytes[0] & 0xF0) !== 0xF0 || (bytes[0] & 15) !== VERSION) return null;
        var answers = [], bits = 0, acc = 0, idx = 1;
        for (var i = 0; i < ITEMS.length; i++) {
            while (bits < 3) { acc = (acc << 8) | bytes[idx++]; bits += 8; }
            var code = (acc >> (bits - 3)) & 7;
            bits -= 3; acc &= (1 << bits) - 1;
            if (code === 7) answers.push(null);
            else if (code > 4) return null;
            else answers.push(code - 2);
        }
        return evaluate(answers);
    }

    var api = { VERSION: VERSION, DATE: DATE, AXES: AXES, ITEMS: ITEMS, TYPES: TYPES, METERS: METERS, TIERS: TIERS, find: find, axisScores: axisScores, classify: classify, meters: meters, consistency: consistency, evaluate: evaluate, encode: encode, decode: decode };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.fem = root.MFSZErtek.fem || {};
    root.MFSZErtek.femdata = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
