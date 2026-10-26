// =========================================================
// ÉRTÉKTEST - az új (v3) kérdések
//   VALUE:   az értékrész új állításai (a régi 50 az ertektest-data.js-ben marad). tier: 1 = gyors, 2 = + részletes, 3 = + extra hosszú.
//            w = tengely-súlyok (a + irány: lásd AXES), h = az utált értékek skáláira gyakorolt hatás.
//   RANK:    rangsorolós feladatok (5 lehetőség, tengelyenként más): a helyezésből +2 … −2 válasz lesz.
//   HATED_B: az utált értékek tételei (szerep: D közvetlen, R fordított, X összehasonlító, S helyzetfüggő). 4 tétel értékenként.
//   PREJ_B:  az előítélet-barométer tételei (témánként 8: két irány × közvetlen / helyzetfüggő / fordított + két ellentétes hatású).
// A szöveg szándékosan mindkét irányból érkezik: fordított és ellentétes állítások is vannak, hogy ne lehessen „csak bólogatni”.
// =========================================================
(function (root) {
    'use strict';

    var VALUE = [
        // ---- Környezet (g): − növekedéspárti ... + természetóvó ----
        { id: 'g_auto', tier: 1, text: 'A belvárosba be kellene tiltani a benzines autókat, akkor is, ha ez kényelmetlen.', w: { g: 1 }, h: { kornyezet: 0.3 }, help: 'A tiszta levegő és a kényelem közti választás: a tiltás mellett vagy ellene vagy.', joke: 'A dugó legalább mindenkit egyformán bosszant.' },
        { id: 'g_novekedes', tier: 1, text: 'A gazdasági növekedés fontosabb annál, hogy minden erdő és mező érintetlen maradjon.', w: { g: -1 }, h: { kornyezet: -0.3 }, help: 'Munkahely és építkezés kontra természet: melyik nyer, ha ütközik.' },
        { id: 'g_fogyaszt', tier: 1, text: 'Kevesebbet kellene vásárolnunk: kevesebb ruhát, kevesebb műszaki cikket, kevesebb csomagolást.', w: { g: 1 }, help: 'A mértékletes fogyasztás szükségességéről kérdezünk, nem egy konkrét termékről.', joke: 'A szekrény alján úgyis ott lapul az az egy kabát.' },
        { id: 'g_tech', tier: 1, text: 'A technológia majd megoldja a klímaproblémát, nem kell hozzá lemondanunk semmiről.', w: { g: -1 }, help: 'Hiszel-e abban, hogy az újítások életmódváltás nélkül is elegendők.', joke: 'A jövő autója úgyis repül. Vagy legalább elektromos.' },
        { id: 'g_szelektiv', tier: 1, text: 'A szelektív hulladékgyűjtés legyen mindenkinek kötelező, mulasztás esetén bírsággal.', w: { g: 1 }, h: { kornyezet: 0.4 }, help: 'Kötelező szétválogatás: ráhagyás helyett szabály és bírság.', joke: 'A sárga kuka nem dekoráció.' },
        { id: 'g_hus', tier: 2, text: 'A húsfogyasztást csökkenteni kellene a környezet érdekében.', w: { g: 1 }, help: 'Étkezési szokások és klíma: helyes-e, ha mérsékeljük a húst.', joke: 'A vasárnapi rántott hús persze hungarikum, azt senki sem bántja.' },
        { id: 'g_klima', tier: 2, text: 'A klímaváltozás miatti aggodalom jórészt eltúlzott.', w: { g: -1 }, help: 'A klímaaggodalom mértékéről kérdezünk: reális-e, vagy felfújt.' },
        { id: 'g_erdo', tier: 2, text: 'Az erdőt és a patakpartot akkor is meg kell védeni, ha ott lehetne építeni.', w: { g: 1 }, h: { kornyezet: 0.3 }, help: 'Építési érdek kontra természeti terület: kinek van elsőbbsége.' },
        { id: 'g_muanyag', tier: 2, text: 'Az eldobható műanyag poharakat és zacskókat be kellene tiltani.', w: { g: 1 }, h: { kornyezet: 0.3 }, help: 'Tiltás igen vagy nem. (A következő iker-kérdés az ellenkezőjét kérdezi.)' },
        { id: 'g_muanyag2', tier: 2, text: 'Az eldobható műanyag tilalma felesleges: a vásárló döntse el, mit használ.', w: { g: -1 }, help: 'Az előző kérdés ellentéte: a tilalom helyett az egyéni döntés.' },
        { id: 'g_repulo', tier: 3, text: 'A nyaralás és a repülés a szabadság része: nem a szén-dioxid dönti el, hová utazhatok.', w: { g: -1, l: -0.3 }, help: 'Utazási szabadság kontra klímaszempont.', joke: 'A bőrönd súlyát legalább mindenki ismeri.' },
        { id: 'g_arkep', tier: 3, text: 'A zöld termék csak akkor jó, ha nem kerül többe, mint a hagyományos.', w: { g: -1 }, help: 'Ár és fenntarthatóság: mennyit ér a „zöld” jelző a pénztárnál.' },
        { id: 'g_fizet', tier: 3, text: 'Szívesen fizetek többet a fenntarthatóbb, helyi termékért.', w: { g: 1 }, help: 'Hajlandóság arra, hogy a környezetbarát változat többe kerüljön.' },
        { id: 'g_foldek', tier: 3, text: 'A termőföldet szabadon át lehetne minősíteni építési telekké, ha van rá igény.', w: { g: -1, e: -0.3 }, h: { kornyezet: -0.3 }, help: 'Földhasználat: a mezőgazdasági terület védelme vagy az építési igény.' },
        { id: 'g_lombfuvo', tier: 3, text: 'A zajos és szennyező kerti gépeket (lombfúvó, benzines fűnyíró) korlátozni kellene.', w: { g: 1 }, h: { zaj: 0.4 }, help: 'Kerti gépek szabályozása: zaj és kipufogó kontra kényelem.', joke: 'A szombat délelőtti csend a legritkább magyar hungarikum.' },

        // ---- Biztonság (m): − békepárti ... + erőpárti ----
        { id: 'm_hadsereg', tier: 1, text: 'Az országnak erős hadseregre van szüksége, még ha ez sokba kerül is.', w: { m: 1 }, help: 'Védelmi kiadások kontra más kiadások: mennyire tartod fontosnak az erőt.', joke: 'A hadsereg is csak annyira erős, amennyire a szakaszvezető jókedvű.' },
        { id: 'm_diplomacia', tier: 1, text: 'A konfliktusokat mindig tárgyalással kell rendezni, nem fenyegetéssel.', w: { m: -1 }, help: 'Diplomácia kontra nyomásgyakorlás.' },
        { id: 'm_vedelem', tier: 1, text: 'Aki megtámad egy országot, azzal szemben a világnak erővel is fel kell lépnie.', w: { m: 1 }, help: 'Háborús helyzet: az erőteljes válaszról kérdezünk, nem egy konkrét országról.' },
        { id: 'm_fegyver', tier: 1, text: 'Háborús területre fegyvert szállítani inkább olaj a tűzre, mint segítség.', w: { m: -1 }, help: 'Fegyverszállítás konfliktusban: segítség vagy a konfliktus fokozása.' },
        { id: 'm_bekeero', tier: 1, text: 'A békét az tartja fenn, aki kész megvédeni magát.', w: { m: 1 }, help: 'Az elrettentés elve: a béke az erőn is múlik-e.', joke: 'A házőrző kutya is azért van, hogy ne kelljen harapnia.' },
        { id: 'm_semleges', tier: 2, text: 'Semleges államként jobban járna az ország, mint katonai szövetségben.', w: { m: -1, n: 0.2 }, help: 'Semlegesség kontra szövetség: melyik ad nagyobb biztonságot.' },
        { id: 'm_hadiipar', tier: 2, text: 'Egy erős hazai hadiipar a nemzeti önállóság egyik záloga.', w: { m: 1, n: 0.3 }, help: 'Fegyvergyártás és önállóság: kell-e saját hadiipar.' },
        { id: 'm_kiadas', tier: 2, text: 'A világ biztonságosabb lenne, ha minden ország kevesebbet költene fegyverekre.', w: { m: -1 }, help: 'Leszerelés: kevesebb fegyver kevesebb háborút jelent-e.' },
        { id: 'm_kemeny', tier: 2, text: 'A nemzetközi vitákban a határozott, kemény hang többet ér az udvarias tárgyalásnál.', w: { m: 1 }, help: 'Nemzetközi hangnem: erő vagy udvariasság.' },
        { id: 'm_diplomata', tier: 2, text: 'A jó diplomata hosszú távon többet ér egy hadosztálynál.', w: { m: -1 }, help: 'Diplomácia vagy fegyverek: melyik ér többet hosszú távon.', joke: 'A diplomata fegyvere a kávészünet.' },
        { id: 'm_haboru', tier: 3, text: 'Nincs olyan helyzet, amiért egy háborút igazolni lehet.', w: { m: -1 }, help: 'Elvi kérdés: megengedhető-e valaha a háború. (A következő iker-kérdés az ellenkezőjét kérdezi.)' },
        { id: 'm_haboru2', tier: 3, text: 'Vannak helyzetek, amikor a háború az egyetlen igazságos válasz.', w: { m: 1 }, help: 'Az előző kérdés ellentéte: van-e igazságos háború.' },
        { id: 'm_diszszemle', tier: 3, text: 'A katonai díszszemle és a haditechnikai bemutató jó ünnepi program.', w: { m: 1, t: 0.3 }, help: 'A katonai hagyományok és ünnepségek megítélése.', joke: 'A gyerekek legalább a tankokat szeretik.' },
        { id: 'm_polgari', tier: 3, text: 'A katonai szolgálat helyett inkább polgári szolgálatot (mentő, tűzoltó, szociális munka) kellene választhatóvá tenni.', w: { m: -1, l: -0.3 }, help: 'Katonai vagy polgári szolgálat: melyiknek van nagyobb értéke.' },
        { id: 'm_nato', tier: 3, text: 'A katonai szövetségben (például a NATO-ban) való tagság elengedhetetlen az ország biztonságához.', w: { m: 1 }, help: 'Szövetségi tagság: nélkülözhetetlen-e a biztonsághoz.' },

        // ---- Hatalom (d): − szakértői ... + népi ----
        { id: 'd_nepszavazas', tier: 1, text: 'A nagy országos kérdésekben mindig népszavazást kellene tartani.', w: { d: 1 }, help: 'Közvetlen demokrácia: a nagy kérdéseket a választók döntsék el.', joke: 'A „kérem, szavazzon” üzenet ritkán érkezik meg időben.' },
        { id: 'd_szakerto', tier: 1, text: 'A bonyolult kérdésekben a szakértők döntsenek, nem a szavazók.', w: { d: -1 }, help: 'Szakértelem kontra többségi akarat.' },
        { id: 'd_kisember', tier: 1, text: 'A „kisember” józan esze gyakran többet ér a szakértők tanulmányainál.', w: { d: 1 }, help: 'A mindennapi tapasztalat és a szakértelem összevetése.', joke: 'A sarki kocsmában mindent előre megmondtak.' },
        { id: 'd_techno', tier: 1, text: 'Egy képzett szakértői kormány jobban vezetné az országot, mint a választott politikusok.', w: { d: -1 }, help: 'Szakértői (technokrata) kormány: jobb-e, mint a választott politikusoké.' },
        { id: 'd_visszahiv', tier: 1, text: 'A képviselőket a választók a ciklus közben is visszahívhatnák.', w: { d: 1 }, help: 'Visszahívás: a választó közvetlen ellenőrzési joga a négy év alatt.' },
        { id: 'd_pilota', tier: 2, text: 'A kormányzás olyan, mint a repülés: a szakmai tudás nem szavazás kérdése.', w: { d: -1 }, help: 'Szakmai döntések és a demokrácia viszonya.', joke: 'A pilótafülkében senki nem kérdezi meg az utasokat, merre menjen a gép.' },
        { id: 'd_helyi', tier: 2, text: 'A helyi nagy beruházások előtt a lakókat szavazással kellene megkérdezni.', w: { d: 1 }, help: 'Helyi döntések: a lakók szavazata kötelező legyen-e.' },
        { id: 'd_nepakarat', tier: 2, text: 'A népakarat felülírhatja a szakmai szempontokat is.', w: { d: 1 }, help: 'Ha a szakértők és a többség ütközik, ki dönt. (A következő iker-kérdés az ellenkezőjét kérdezi.)' },
        { id: 'd_nepakarat2', tier: 2, text: 'A szakmai szempontok akkor is előbbre valók, ha a közvélemény mást szeretne.', w: { d: -1 }, help: 'Az előző kérdés ellentéte: a szakmai szempont erősebb a közvéleménynél.' },
        { id: 'd_tapasztalat', tier: 2, text: 'Az egyszerű emberek tapasztalata fontosabb az elméleti modelleknél.', w: { d: 1 }, help: 'Tapasztalat kontra elmélet a közéleti döntésekben.' },
        { id: 'd_tudas', tier: 3, text: 'A közéleti és gazdasági alapismeretek oktatása nélkül a szavazás fele annyit sem ér.', w: { d: -1 }, help: 'Tájékozottság és szavazás: mennyit számít az előzetes tudás.' },
        { id: 'd_kozvetlen', tier: 3, text: 'A fontos törvények tervezetét az interneten a polgárok is megszavazhatnák.', w: { d: 1 }, help: 'Online közvetlen szavazás a törvényekről.' },
        { id: 'd_bizottsag', tier: 3, text: 'Egy szakértői testület (például a jegybank) függetlensége fontosabb, mint hogy a politikusok beleszóljanak.', w: { d: -1 }, help: 'Független intézmények: a szakmai függetlenség védelme.' },
        { id: 'd_valaszto', tier: 3, text: 'A politikusoknak a választóik akaratát kell követniük, akkor is, ha ők jobban tudnák.', w: { d: 1 }, help: 'A képviselő feladata: követni a választókat vagy a saját ítélete szerint dönteni.' },
        { id: 'd_komm', tier: 3, text: 'Egy hosszú egyeztetés a szakértőkkel jobb törvényt ad, mint egy gyors népszavazás.', w: { d: -1 }, help: 'Gyorsaság és alaposság: egyeztetés kontra szavazás.', joke: 'A „még egyeztetünk” szó a hosszú távú tervezés alapja.' },

        // ---- Kötelék (k): − egyéni út ... + közösségi, családi kötelék ----
        { id: 'k_csalad', tier: 1, text: 'A család mindig előbb való, mint a karrier.', w: { k: 1, t: 0.3 }, help: 'Család és munka ütközése: melyik nyer.' },
        { id: 'k_ut', tier: 1, text: 'Mindenkinek a saját útját kell járnia: a család és a barátok támogassanak, de ne irányítsanak.', w: { k: -1 }, help: 'Önálló életút kontra családi elvárások.' },
        { id: 'k_szulok', tier: 1, text: 'A felnőtt gyerek dolga, hogy gondoskodjon az idős szüleiről.', w: { k: 1 }, help: 'Generációk közti kötelesség: az idős szülők ellátása.' },
        { id: 'k_koltozes', tier: 1, text: 'Jobb korán önállósodni: minél előbb ki kell költözni a szülőktől.', w: { k: -1 }, help: 'Korai önállóság kontra a családi fészek közelsége.' },
        { id: 'k_szomszed', tier: 1, text: 'A szomszédokkal jóban kell lenni: a közösség a legjobb védőháló.', w: { k: 1 }, h: { zaj: 0.2 }, help: 'A szomszédi közösség szerepe a mindennapokban.', joke: 'A sütemény a szomszédi diplomácia alapeszköze.' },
        { id: 'k_ismeretlen', tier: 2, text: 'A szomszédaimat alig ismerem, és ez így van jól.', w: { k: -1 }, help: 'A szomszédokkal való kapcsolat mértéke: távolság vagy közelség.' },
        { id: 'k_unnep', tier: 2, text: 'Az ünnepeket (karácsony, húsvét) a nagycsaláddal együtt kell tölteni.', w: { k: 1, t: 0.3 }, help: 'Családi ünnepek: kötelező közös program vagy szabad döntés.' },
        { id: 'k_gyerek', tier: 2, text: 'Szabad dönteni arról, hogy valaki nem szeretne családot vagy gyereket.', w: { k: -1, t: -0.3 }, help: 'Egyéni életút: a családalapítás szabad választás.' },
        { id: 'k_szulofalu', tier: 2, text: 'Hűnek kell maradni a szülőfaluhoz, a szülővároshoz.', w: { k: 1, n: 0.3 }, help: 'A szülőföldhöz való kötődés: erkölcsi kötelesség-e.' },
        { id: 'k_boldog', tier: 2, text: 'A saját boldogságom fontosabb mások elvárásainál.', w: { k: -1 }, help: 'Az egyéni boldogság és a közösségi elvárások viszonya.' },
        { id: 'k_aldozat', tier: 3, text: 'A közösségért hozott áldozat többet ér az egyéni sikernél.', w: { k: 1 }, help: 'Áldozat és siker: melyik az értékesebb. (A következő iker-kérdés az ellenkezőjét kérdezi.)' },
        { id: 'k_siker', tier: 3, text: 'Az egyéni siker többet ér annál, amit a közösségért feladhatnék.', w: { k: -1 }, help: 'Az előző kérdés ellentéte: az egyéni siker fontosabb-e az áldozatnál.' },
        { id: 'k_segit', tier: 3, text: 'Aki tehet, annak segítenie kell a környezetében élőket.', w: { k: 1, e: 0.2 }, help: 'Kötelesség-e segíteni a környezetünkben élőknek.' },
        { id: 'k_vasarnap', tier: 3, text: 'A vasárnapi ebéd a család kötelező közös programja.', w: { k: 1, t: 0.4 }, help: 'A közös családi étkezés hagyománya: kötelező vagy választható.', joke: 'A rántott hús nem hiányozhat, és a hozzászólás sem.' },
        { id: 'k_csapat', tier: 3, text: 'A munkahelyi csapatépítő inkább kötelező szenvedés, mint közösségi élmény.', w: { k: -1 }, help: 'Kötelező közös programok: élmény vagy teher.', joke: 'A közös kötéllabirintus mindig a legfurcsább főnököt hozza ki az emberből.' },

        // ---- Világlátás (s): − tudomány, mérhető ... + megérzés, hit, ösztön ----
        { id: 's_bizonyitek', tier: 1, text: 'Csak azt hiszem el, amit tudományos bizonyíték támaszt alá.', w: { s: -1 }, help: 'A hit és a bizonyíték viszonya: mennyire fogadsz el valamit bizonyíték nélkül.' },
        { id: 's_megerzes', tier: 1, text: 'A megérzéseimre többször hallgatok, mint a statisztikákra.', w: { s: 1 }, help: 'Megérzés kontra adat a mindennapi döntésekben.' },
        { id: 's_horoszkop', tier: 1, text: 'A horoszkóp szórakoztató, de nincs benne semmi igazság.', w: { s: -1 }, help: 'A horoszkóp megítélése: tréfa vagy valódi útmutatás.', joke: 'A Rák szerint ma jó napom lesz. Egyelőre egyik napom sem volt rák.' },
        { id: 's_nagyi', tier: 1, text: 'A nagyi házi praktikái (méz, hagymás tea, meleg borogatás) sokszor beválnak.', w: { s: 1, t: 0.3 }, help: 'A hagyományos házi praktikákba vetett hit.', joke: 'A „fújjuk el, hogy ne fájjon” ma is a legjobb fájdalomcsillapító.' },
        { id: 's_adat', tier: 1, text: 'Egy vitát az dönt el, akinek jobb adatai vannak.', w: { s: -1 }, help: 'Vitában mi dönt: adat vagy meggyőződés.' },
        { id: 's_jel', tier: 2, text: 'Van olyan, amit nem lehet megmagyarázni, és nem is kell.', w: { s: 1 }, help: 'Az észszerűen megmagyarázhatatlan dolgokhoz való viszony.' },
        { id: 's_babona', tier: 2, text: 'A babonáknak nincs valós alapja: a péntek 13. is csak egy nap.', w: { s: -1 }, help: 'Babonák megítélése: hiszel-e bennük.' },
        { id: 's_szerencse', tier: 2, text: 'A szerencsehozó tárgyaknak (patkó, lóhere, szerencsepénz) tényleg van hatásuk.', w: { s: 1 }, help: 'Szerencsehozó tárgyakba vetett hit.' },
        { id: 's_konszenzus', tier: 2, text: 'A tudományos konszenzus meggyőzőbb, mint a saját tapasztalatom.', w: { s: -1 }, help: 'Ha a tudomány és a saját tapasztalat ütközik, melyiket hiszed.' },
        { id: 's_elso', tier: 2, text: 'Az első benyomás általában pontos.', w: { s: 1 }, help: 'Az első benyomásba és a megérzésbe vetett bizalom.' },
        { id: 's_dont_esz', tier: 3, text: 'Fontos döntéseket mindig az észérvek, nem az érzéseim alapján hozok.', w: { s: -1 }, help: 'Döntéshozatal: ész vagy érzés. (A következő iker-kérdés az ellenkezőjét kérdezi.)' },
        { id: 's_dont_erzes', tier: 3, text: 'A legfontosabb döntéseket végül mindig a megérzésem dönti el.', w: { s: 1 }, help: 'Az előző kérdés ellentéte: a megérzés a végső döntőbíró.' },
        { id: 's_sors', tier: 3, text: 'A sors vagy valamilyen „jel” szerepet játszik az életemben.', w: { s: 1 }, help: 'Sors, jelek és véletlenek: a hit mértéke.' },
        { id: 's_term', tier: 3, text: 'Az iskolában több természettudományi órát kellene tartani.', w: { s: -1, t: -0.3 }, help: 'Oktatás: a természettudományok súlya.' },
        { id: 's_nephagyo', tier: 3, text: 'A néphagyományok (népmesék, szokások, népi mondák) megőrzése fontosabb, mint hogy igaz-e bennük bármi.', w: { s: 1, t: 0.4 }, help: 'Hagyomány kontra igazságtartalom.' },

        // ---- Új tételek a régi tengelyekhez ----
        // Gazdaság (e), csak extra
        { id: 'e_min', tier: 3, text: 'A minimálbérnek lehetővé kellene tennie, hogy egy ember egy fizetésből is megéljen.', w: { e: 1 }, help: 'Minimálbér: elég-e a megélhetéshez, vagy a piac döntsön.' },
        { id: 'e_egyenado', tier: 3, text: 'Mindenki ugyanannyi százalékot fizessen adóba, a gazdagok se többet.', w: { e: -1 }, help: 'Adórendszer: egykulcsos adó kontra progresszív.' },
        { id: 'e_szakszerv', tier: 3, text: 'Az erős szakszervezetek jót tesznek a munkavállalóknak, és az országnak is.', w: { e: 1 }, help: 'A szakszervezetek szerepe a munkavilágban.' },
        { id: 'e_verseny', tier: 3, text: 'A verseny mindig jobb, mint az állami szabályozás: a piac előbb-utóbb rendet tesz.', w: { e: -1 }, help: 'Szabad verseny vagy szabályozás: ki hoz jobb eredményt.' },
        { id: 'e_alapjov', tier: 3, text: 'Az államnak az alapvető szükségletekre (étel, lakás, ellátás) mindenkinek garanciát kell adnia.', w: { e: 1, c: -0.2 }, help: 'Az állam alapvető felelőssége a megélhetésért.' },
        // Társadalom (l), csak extra
        { id: 'l_szabadido', tier: 3, text: 'Az állam nem dönthet arról, hogy egy felnőtt hogyan tölti a szabadidejét, amíg másnak nem árt.', w: { l: -1 }, help: 'Személyes szabadság: meddig szólhat bele az állam a magánéletbe.' },
        { id: 'l_titok', tier: 3, text: 'A levelezésemet és a telefonom tartalmát az állam csak bírói engedéllyel nézhesse meg, kivétel nélkül.', w: { l: -1, c: 0.2 }, help: 'Magánélet kontra biztonság: a megfigyelés korlátai.' },
        // Haza (n)
        { id: 'n_vilag', tier: 2, text: 'A nagy problémákat (járvány, klíma, migráció) csak nemzetek feletti összefogással lehet megoldani.', w: { n: -1 }, help: 'Nemzetközi összefogás kontra nemzeti megoldások.' },
        { id: 'n_kulfold', tier: 2, text: 'Minden fiatalnak érdemes lenne egy-két évet külföldön tanulnia vagy dolgoznia.', w: { n: -1 }, help: 'A külföldi tapasztalat értéke.', joke: 'A hazai kenyér hiányát hamar megérzi az ember.' },
        { id: 'n_nyitott', tier: 3, text: 'Egy ország akkor erős, ha nyitott a külföldi ötletekre és a külföldi tőkére.', w: { n: -1, e: -0.2 }, help: 'Nyitottság kontra önellátás.' },
        { id: 'n_hatarok', tier: 3, text: 'A határok a modern világban egyre kevésbé számítanak.', w: { n: -1 }, help: 'Határok szerepe: elavulóban van-e a gondolat.' },
        { id: 'n_nyelv3', tier: 3, text: 'Nem baj, ha a mindennapi nyelvünkbe angol szavak kerülnek: a nyelv változik.', w: { n: -1, t: -0.3 }, help: 'Nyelvi változás: természetes vagy óvandó.' },
        // Értékek (t)
        { id: 't_tradicio', tier: 2, text: 'A régi szokások (disznóvágás, bál, falunap) megőrzése a közösség alapja.', w: { t: 1, k: 0.3 }, help: 'A hagyományos közösségi szokások szerepe.', joke: 'A falunapi sorsolás nyereménye mindig ugyanaz a szalmakalap.' },
        { id: 't_uj', tier: 2, text: 'A 21. században a régi szabályok sokszor akadályt jelentenek, nem értéket.', w: { t: -1 }, help: 'A régi szabályok és szokások megítélése a mai világban.' },
        { id: 't_neptanc', tier: 3, text: 'Az iskolákban kötelező lenne a néptánc és a hagyományőrzés.', w: { t: 1, n: 0.3 }, help: 'Hagyományőrzés az oktatásban.' },
        { id: 't_tisztelet', tier: 3, text: 'A fiataloknak jobban kellene tisztelniük az idősebbeket.', w: { t: 1 }, help: 'Tisztelet és generációk: elvárható-e az idősek előtti tisztelet.' },
        { id: 't_kiserlet', tier: 3, text: 'Szabad kísérletezni új családformákkal és életstílusokkal.', w: { t: -1 }, help: 'Új életformák elfogadása.' },
        { id: 't_divat', tier: 3, text: 'A ruházat, a frizura és az életmód mindenkinek magánügye, akármilyen szokatlan.', w: { t: -1, l: -0.3 }, help: 'Egyéni stílus és a társadalmi elvárások viszonya.' },
        { id: 't_kozerkolcs', tier: 3, text: 'A közerkölcs védelme a társadalom feladata is, nem csak a magánügyé.', w: { t: 1, l: 0.3 }, help: 'Erkölcs és közösség: a társadalom szerepe.' },
        // Bizalom (c)
        { id: 'c_ceg', tier: 2, text: 'A nagy cégek és a nagy pártok a háttérben végül úgyis összejátszanak.', w: { c: 1 }, help: 'Bizalom a hatalmi szereplők közti verseny valódiságában.' },
        { id: 'c_ig', tier: 3, text: 'Aki sokat ígér, az keveset tart be.', w: { c: 1 }, help: 'Ígéretek és teljesítés: a szavak hitele.', joke: 'A kampányplakáton minden mosolyogva ígér.' },
        { id: 'c_titok', tier: 3, text: 'A fontos ügyekről a nyilvánosság ritkán tud meg valódi tényeket.', w: { c: 1 }, help: 'Átláthatóság: mennyit tudhat meg a közönség.' },
        { id: 'c_jo', tier: 3, text: 'Az emberek többsége alapvetően jó szándékú.', w: { c: -1 }, help: 'Általános bizalom az emberekben.' },
        { id: 'c_penztarca', tier: 3, text: 'Ha elhagyom a pénztárcámat, nagy eséllyel visszakapom.', w: { c: -1 }, help: 'Mennyire bízol idegenek tisztességében.', joke: 'A benne lévő bonuszkártyákat úgyis csak én becsülöm.' },
        { id: 'c_segit', tier: 3, text: 'Ha bajba kerülnék az utcán, valaki biztosan segítene.', w: { c: -1 }, help: 'Bizalom a segítőkészségben.' }
    ];

    // Az utált értékek (B rész). Szerep: D közvetlen, R fordított, X összehasonlító (két érték között), S helyzetfüggő.
    // Az X tételek az utált értékek körében haladnak (a HATED_PAIRS sorrendjében): az első érték +0,5-öt, a második −0,5-öt kap.
    var HATED_B = [
        // Rongálás
        { id: 'z_ron1', role: 'D', tier: 1, text: 'Idegesít, ha valaki összefirkálja vagy megrongálja a közös dolgokat: a padot, a buszmegállót, a lépcsőházat.', h: { rongalas: 1 }, joke: 'A filctoll nem művészeti eszköz, ha nem a sajátodon használod.' },
        { id: 'z_ron_r', role: 'R', tier: 1, text: 'A falfirka sokszor inkább színt visz a városba, mint kárt okoz.', h: { rongalas: -1 }, joke: 'Néha a szürke fal is hálás a figyelemért.' },
        { id: 'z_ron_s', role: 'S', tier: 2, text: 'A rongálás akkor is zavar, ha az elkövető dühös vagy fiatal: a kárt ettől még másnak kell kifizetnie.', h: { rongalas: 1 } },
        // Környezetszennyezés
        { id: 'z_kor1', role: 'D', tier: 1, text: 'Idegesít, ha valaki az erdőben, a parkban vagy az út mentén hagyja a szemetét.', h: { kornyezet: 1 }, joke: 'A csokipapír nem lebomló, csak „kicsit” lebomló.' },
        { id: 'z_kor_r', role: 'R', tier: 1, text: 'Egy elhajított csikk vagy papír nem akkora tragédia, nem érdemes belőle ügyet csinálni.', h: { kornyezet: -1 }, joke: 'A szemétgyűjtő kutya úgyis megoldja.' },
        { id: 'z_kor_s', role: 'S', tier: 2, text: 'A szemetelés akkor is zavar, ha a kuka tele van: a bokor ettől még nem hulladékgyűjtő.', h: { kornyezet: 1 } },
        // Figyelmetlenség
        { id: 'z_fig1', role: 'D', tier: 1, text: 'Idegesít, ha beszélgetés közben a másik a telefonját nézi.', h: { figyelem: 1 }, joke: 'A „folytasd, hallgatlak” mondat a legnagyobb hazugság, ha közben görgetnek.' },
        { id: 'z_fig_r', role: 'R', tier: 1, text: 'Nem zavar, ha a társaságban mindenki a telefonját nyomkodja: ez már a mai világ.', h: { figyelem: -1 }, joke: 'A legjobb beszélgetések gyakran a Wi-Fi-jelszó körül indulnak.' },
        { id: 'z_fig_s', role: 'S', tier: 2, text: 'Akkor is zavar a telefonozás, ha valaki „csak egy percre” néz rá, miközben fontosat mondok neki.', h: { figyelem: 1 } },
        // Trágárság
        { id: 'z_tra2', role: 'D', tier: 1, text: 'Zavar, ha a vita érvek helyett sértésekbe és csúnya szavakba megy át.', h: { tragar: 1 }, joke: 'Aki először káromkodik, az már vesztett. Vagy legalább kifogyott az érvekből.' },
        { id: 'z_tra_r', role: 'R', tier: 1, text: 'A jó káromkodás néha őszintébb és kifejezőbb, mint a kimért udvariasság.', h: { tragar: -1 }, joke: 'Egy jól időzített káromkodás a szókincs rendkívüli esete.' },
        { id: 'z_tra_s', role: 'S', tier: 2, text: 'A trágárság akkor is zavar, ha „csak vicc”, és mindenki más nevet rajta.', h: { tragar: 1 } },
        // Szexizmus
        { id: 'z_szx1', role: 'D', tier: 1, text: 'Idegesít, ha valakit a neme miatt néznek le vagy kezelnek másképp.', h: { szexizmus: 1 }, joke: 'A „ez férfi dolog” mondat általában ott hangzik el, ahol a mosogatás kezdődik.' },
        { id: 'z_szx_r', role: 'R', tier: 1, text: 'Egy kis nemi alapú tréfa ártalmatlan, nem kell belőle ügyet csinálni.', h: { szexizmus: -1 } },
        { id: 'z_szx_s', role: 'S', tier: 2, text: 'Az is zavar, ha a vitát azzal zárják le, hogy „a férfiak (vagy a nők) úgyis ilyenek”, mintha mindenki egyformán gondolkodna.', h: { szexizmus: 1 } },
        // Szabálytalan zűrzavar
        { id: 'z_ana1', role: 'D', tier: 1, text: 'Idegesít, ha valaki a szabályokat (piros lámpa, házirend) csak ajánlásnak tekinti.', h: { anarchia: 1 }, joke: 'A zebrán a gyalogos mindig „csak most” siet.' },
        { id: 'z_ana_r', role: 'R', tier: 1, text: 'Néha a szabályszegés a jobb döntés: nem minden szabály ésszerű.', h: { anarchia: -1 }, joke: 'A tilosban parkolás legalább közösségi élmény: mindenki ott áll.' },
        { id: 'z_ana_s', role: 'S', tier: 2, text: 'A „szabad ország” érve nem mentség arra, hogy valaki mások nyugalmát vagy biztonságát felborítsa.', h: { anarchia: 1 } },
        // Lopás és csalás
        { id: 'z_tol1', role: 'D', tier: 1, text: 'Idegesít, ha valaki a közös hűtőből viszi el más ebédjét.', h: { tolvaj: 1 }, joke: 'A lopott joghurt nem „maradék”, hanem bizonyíték.' },
        { id: 'z_tol_r', role: 'R', tier: 1, text: 'A „mindenki csal egy kicsit” miatt a kisebb csalást nem érdemes komolyan venni.', h: { tolvaj: -1 } },
        { id: 'z_tol_s', role: 'S', tier: 2, text: 'A kisebb lopás vagy csalás akkor is zavar, ha a kár kicsi, és az elkövető „csak kipróbálta”.', h: { tolvaj: 1 } },
        // Hangoskodás
        { id: 'z_zaj1', role: 'D', tier: 1, text: 'Idegesít, ha a szomszéd éjjel fúr, zenél vagy ordít.', h: { zaj: 1 }, joke: 'A „csak egy kis zene” este tízkor már házibuli.' },
        { id: 'z_zaj_r', role: 'R', tier: 1, text: 'A zaj az élet része: aki városban lakik, számítson rá, és ne panaszkodjon.', h: { zaj: -1 } },
        { id: 'z_zaj_s', role: 'S', tier: 2, text: 'Az éjszakai hangoskodás akkor is zavar, ha ünnep van: a szomszéd ettől még aludni szeretne.', h: { zaj: 1 } },
        // Pletyka és hátbatámadás
        { id: 'z_ple1', role: 'D', tier: 1, text: 'Idegesít, ha valaki a háttérben pletykál, szemben meg mosolyog.', h: { pletyka: 1 }, joke: 'A „nem mondom el senkinek” a legnagyobb magyar hazugság.' },
        { id: 'z_ple_r', role: 'R', tier: 1, text: 'A pletyka a közösség velejárója, és legtöbbször ártalmatlan.', h: { pletyka: -1 }, joke: 'A lépcsőházi hírügynökség néha gyorsabb, mint a hírek.' },
        { id: 'z_ple_s', role: 'S', tier: 2, text: 'A pletykát akkor is rossz néven veszem, ha „csak jó szándékból” mondják tovább.', h: { pletyka: 1 } },
        // Lógás és potyázás
        { id: 'z_pot1', role: 'D', tier: 1, text: 'Idegesít, ha a csoportmunkában valaki semmit nem csinál, de a jegyet elfogadja.', h: { potyazo: 1 }, joke: 'A „én is ott voltam” nem munka.' },
        { id: 'z_pot_r', role: 'R', tier: 1, text: 'Nem baj, ha valaki néha lazít, míg a többiek dolgoznak: a közösség ezt elbírja.', h: { potyazo: -1 } },
        { id: 'z_pot_s', role: 'S', tier: 2, text: 'A lógás akkor is zavar, ha az illető kedves ember: a munkát ettől még más végzi el.', h: { potyazo: 1 } },
        // X: összehasonlítások a körben (az első érték +0,5, a második −0,5)
        { id: 'x_ron_kor', role: 'X', tier: 1, text: 'Egy lerombolt pad rosszabb, mint egy szemétdombbá vált patakpart.', h: { rongalas: 0.5, kornyezet: -0.5 } },
        { id: 'x_kor_fig', role: 'X', tier: 1, text: 'Az erdőben hagyott szemét jobban zavar, mint ha valaki a telefonját nézi, miközben hozzá beszélek.', h: { kornyezet: 0.5, figyelem: -0.5 } },
        { id: 'x_fig_tra', role: 'X', tier: 1, text: 'A telefonozás beszélgetés közben rosszabb, mint a csúnya beszéd.', h: { figyelem: 0.5, tragar: -0.5 } },
        { id: 'x_tra_szx', role: 'X', tier: 1, text: 'A durva káromkodás jobban zavar, mint egy sértő megjegyzés a nemről.', h: { tragar: 0.5, szexizmus: -0.5 } },
        { id: 'x_szx_ana', role: 'X', tier: 1, text: 'A nemi alapú lenézés rosszabb, mint a szabályok semmibevétele.', h: { szexizmus: 0.5, anarchia: -0.5 } },
        { id: 'x_ana_ple', role: 'X', tier: 1, text: 'A szabályok semmibevétele rosszabb, mint a háttérben terjesztett pletyka.', h: { anarchia: 0.5, pletyka: -0.5 } },
        { id: 'x_ple_pot', role: 'X', tier: 1, text: 'A hátam mögötti pletyka jobban zavar, mint ha valaki kihasznál a munkában.', h: { pletyka: 0.5, potyazo: -0.5 } },
        { id: 'x_pot_zaj', role: 'X', tier: 1, text: 'A lógás és a potyázás rosszabb, mint a szomszéd éjszakai zaja.', h: { potyazo: 0.5, zaj: -0.5 } },
        { id: 'x_zaj_tol', role: 'X', tier: 1, text: 'Az éjszakai hangoskodás jobban zavar, mint egy eltűnt joghurt a közös hűtőből.', h: { zaj: 0.5, tolvaj: -0.5 }, joke: 'A joghurt legalább nem dübörög.' },
        { id: 'x_tol_ron', role: 'X', tier: 1, text: 'A lopás rosszabb, mint a rongálás: legalább ott nem visznek el semmit.', h: { tolvaj: 0.5, rongalas: -0.5 } }
    ];

    // Az előítélet-barométer tételei. Téma × 8: U1 (fenntartás felfelé), U2 (felfelé, helyzetben), UR (fordított),
    // D1 (lefelé), D2 (lefelé, helyzetben), DR (fordított), X1 és X2 (ellentétes hatású: az egyik skálát növeli, a másikat csökkenti).
    // Szándékosan enyhe, felmérés-stílusú állítások: azt mérjük, mennyire zavar egy hozzáállás, nem csoportokat minősítünk.
    var PREJ_B = [
        // Nemek
        { id: 'p_nem1', role: 'U1', tier: 1, text: 'A gyereknevelés és a háztartás alapvetően a nők dolga.', g: { nem_up: 1 }, help: 'Azt kérdezzük, szerinted a gyereknevelés és a háztartás eleve a nők feladata-e. Az egyetértés a hagyományos szerepek felé visz.' },
        { id: 'p_nem_u2', role: 'U2', tier: 1, text: 'Egy vezetői állásra azonos képességek mellett inkább férfit választanék.', g: { nem_up: 1 }, help: 'Azonos képességű jelentkezők közül nemek szerinti választás. Az egyetértés a nőkkel szembeni fenntartást növeli.' },
        { id: 'p_nem5', role: 'UR', tier: 1, text: 'A gyereknevelés és a háztartás mindkét szülő közös dolga, nemtől függetlenül.', g: { nem_up: -1 }, help: 'Fordított állítás: az egyetértés itt a nyitottabb, egyenlőbb hozzáállást jelzi.' },
        { id: 'p_nem3', role: 'D1', tier: 1, text: 'A férfiak többsége eleve elnyomó, még ha nem is tud róla.', g: { nem_dn: 1 }, help: 'Azt kérdezzük, gyanakszol-e a férfiakra csak azért, mert férfiak. Az egyetértés a férfiakkal szembeni fenntartást növeli.' },
        { id: 'p_nem_d2', role: 'D2', tier: 1, text: 'Azonos hiba esetén egy férfit szigorúbban ítélek meg, mint egy nőt.', g: { nem_dn: 1 }, help: 'Azonos hiba, eltérő megítélés: az egyetértés a férfiakkal szembeni fenntartást növeli.' },
        { id: 'p_nem6', role: 'DR', tier: 1, text: 'A férfiak többsége tisztességesen áll a nemek egyenjogúságához.', g: { nem_dn: -1 }, help: 'Fordított állítás: az egyetértés itt a férfiakkal szembeni fenntartást csökkenti.' },
        { id: 'p_nem7', role: 'X1', tier: 2, text: 'A nők sérelmei eltúlzottak, miközben a férfiak gondjaira alig figyel valaki.', g: { nem_up: 0.7, nem_dn: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a nők ügyével szembeni fenntartást növeli, a férfiakkal szembenit csökkenti.' },
        { id: 'p_nem_x2', role: 'X2', tier: 2, text: 'A férfiak sérelmei eltúlzottak, miközben a nők hátrányaira alig figyel valaki.', g: { nem_dn: 0.7, nem_up: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a férfiakkal szembeni fenntartást növeli, a nőkkel szembenit csökkenti.' },

        // Külföldiek és hazafiak
        { id: 'p_kulf1', role: 'U1', tier: 1, text: 'Nem szívesen laknék olyan környéken, ahol sok a külföldi.', g: { kulf_up: 1 }, help: 'Azt kérdezzük, zavarna-e, ha a környéken sok külföldi élne. Az egyetértés a külföldiekkel szembeni fenntartást növeli.' },
        { id: 'p_kulf_u2', role: 'U2', tier: 1, text: 'Egy azonos képességű külföldi jelentkező helyett inkább magyart vennék fel.', g: { kulf_up: 1 }, help: 'Azonos képességű jelentkezők közül származás szerinti választás. Az egyetértés a külföldiekkel szembeni fenntartást növeli.' },
        { id: 'p_kulf5', role: 'UR', tier: 1, text: 'Aki beilleszkedik és megtanul magyarul, az ugyanolyan magyar, mint én.', g: { kulf_up: -1 }, help: 'Fordított állítás: az egyetértés itt a nyitottabb, befogadóbb hozzáállást jelzi.' },
        { id: 'p_kulf3', role: 'D1', tier: 1, text: 'Aki büszke a magyarságára, az általában szűk látókörű.', g: { kulf_dn: 1 }, help: 'Azt kérdezzük, gyanúsnak tartod-e azt, aki büszke a magyarságára. Az egyetértés a hazafiakkal szembeni fenntartást növeli.' },
        { id: 'p_kulf_d2', role: 'D2', tier: 1, text: 'Aki kitűzi a nemzeti színeket, abban eleve kevésbé bízom.', g: { kulf_dn: 1 }, help: 'Szimbólumok és bizalom: az egyetértés a hazafiakkal szembeni fenntartást növeli.' },
        { id: 'p_kulf6', role: 'DR', tier: 1, text: 'A magyarságára büszke ember is lehet nyitott és világlátott.', g: { kulf_dn: -1 }, help: 'Fordított állítás: az egyetértés itt a hazafiakkal szembeni fenntartást csökkenti.' },
        { id: 'p_kulf7', role: 'X1', tier: 2, text: 'A saját hazánk dolgai előbbre valók, mint a külföldiek bajai.', g: { kulf_up: 0.7, kulf_dn: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a külföldiekkel szembeni fenntartást növeli, a hazafiakkal szembenit csökkenti.' },
        { id: 'p_kulf_x2', role: 'X2', tier: 2, text: 'A hazafiaskodás ma már többet árt, mint a külföldiek érkezése.', g: { kulf_dn: 0.7, kulf_up: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a hazafiakkal szembeni fenntartást növeli, a külföldiekkel szembenit csökkenti.' },

        // Szerelem és család
        { id: 'p_lgbt1', role: 'U1', tier: 1, text: 'Zavar, ha két azonos nemű ember nyilvánosan csókolózik.', g: { lgbt_up: 1 }, help: 'Azt kérdezzük, zavar-e a közterületi, azonos neműek közötti gyengédség. Az egyetértés az LMBTQ+ emberekkel szembeni fenntartást növeli.' },
        { id: 'p_lgbt_u2', role: 'U2', tier: 1, text: 'Zavar, ha a reklámokban és a műsorokban azonos nemű párok szerepelnek.', g: { lgbt_up: 1 }, help: 'Az azonos nemű párok médiabeli megjelenése. Az egyetértés az LMBTQ+ emberekkel szembeni fenntartást növeli.' },
        { id: 'p_lgbt5', role: 'UR', tier: 1, text: 'Két ember szerelme magánügy: mindegy, hogy azonos nemű vagy sem.', g: { lgbt_up: -1 }, help: 'Fordított állítás: az egyetértés itt a nyitottabb hozzáállást jelzi.' },
        { id: 'p_lgbt3', role: 'D1', tier: 1, text: 'Aki a hagyományos családmodellt védi, az eleve gyűlölködő.', g: { lgbt_dn: 1 }, help: 'Azt kérdezzük, gyűlölködőnek tartod-e a hagyományos családmodell védőit. Az egyetértés a hagyományvédőkkel szembeni fenntartást növeli.' },
        { id: 'p_lgbt_d2', role: 'D2', tier: 1, text: 'Aki a hagyományos családot tartja fontosnak, azt nehezen tudom komolyan venni.', g: { lgbt_dn: 1 }, help: 'A hagyományos család védőinek megítélése. Az egyetértés a hagyományvédőkkel szembeni fenntartást növeli.' },
        { id: 'p_lgbt6', role: 'DR', tier: 1, text: 'Aki a hagyományos családot választja, attól még lehet elfogadó másokkal.', g: { lgbt_dn: -1 }, help: 'Fordított állítás: az egyetértés itt a hagyományvédőkkel szembeni fenntartást csökkenti.' },
        { id: 'p_lgbt7', role: 'X1', tier: 2, text: 'Ma már inkább a hagyományos családban élőket éri hátrány, mint a szivárványos közösséget.', g: { lgbt_up: 0.7, lgbt_dn: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés az LMBTQ+ emberekkel szembeni fenntartást növeli, a hagyományvédőkkel szembenit csökkenti.' },
        { id: 'p_lgbt_x2', role: 'X2', tier: 2, text: 'A hagyományos családmodell védői ma túl nagy teret kapnak, a többi életforma háttérbe szorul.', g: { lgbt_dn: 0.7, lgbt_up: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a hagyományvédőkkel szembeni fenntartást növeli, az LMBTQ+ emberekkel szembenit csökkenti.' },

        // Hit és hitetlenség
        { id: 'p_vall1', role: 'U1', tier: 1, text: 'Zavar, ha egy másik vallás szokásai láthatóvá válnak a környezetemben.', g: { vall_up: 1 }, help: 'Azt kérdezzük, zavar-e egy másik vallás látható jelenléte (öltözet, ünnep). Az egyetértés a más hitűekkel szembeni fenntartást növeli.' },
        { id: 'p_vall_u2', role: 'U2', tier: 1, text: 'Zavar, ha egy más vallású ember a munkahelyen külön szokásokat kér (étkezés, ünnepnap).', g: { vall_up: 1 }, help: 'Vallási szokások a munkahelyen: az egyetértés a más hitűekkel szembeni fenntartást növeli.' },
        { id: 'p_vall5', role: 'UR', tier: 1, text: 'Egy másik hitű szomszéd ugyanolyan jó szomszéd lehet, mint bárki más.', g: { vall_up: -1 }, help: 'Fordított állítás: az egyetértés itt a más hitűekkel szembeni nyitottságot jelzi.' },
        { id: 'p_vall3', role: 'D1', tier: 1, text: 'A vallásos emberek általában kevésbé gondolkodnak önállóan.', g: { vall_dn: 1 }, help: 'Azt kérdezzük, gondolkodnak-e kevésbé a hívők. Az egyetértés a vallásosakkal szembeni fenntartást növeli.' },
        { id: 'p_vall_d2', role: 'D2', tier: 1, text: 'Aki vallásos, annak a véleményét eleve fenntartással kezelem.', g: { vall_dn: 1 }, help: 'A vallásos emberek véleményének megítélése. Az egyetértés a vallásosakkal szembeni fenntartást növeli.' },
        { id: 'p_vall6', role: 'DR', tier: 1, text: 'A hívők között is sok az önálló, gondolkodó ember.', g: { vall_dn: -1 }, help: 'Fordított állítás: az egyetértés itt a vallásosakkal szembeni fenntartást csökkenti.' },
        { id: 'p_vall7', role: 'X1', tier: 2, text: 'A saját hitünk és hagyományunk védelme fontosabb, mint a más vallások szokásainak hangsúlyozása.', g: { vall_up: 0.7, vall_dn: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a más hitűekkel szembeni fenntartást növeli, a vallásosakkal szembenit csökkenti.' },
        { id: 'p_vall_x2', role: 'X2', tier: 2, text: 'A vallásos emberek véleménye ma túl nagy súlyt kap, a más hitűek és a hitetlenek rovására.', g: { vall_dn: 0.7, vall_up: -0.4 }, help: 'Ellentétes hatású állítás: az egyetértés a vallásosakkal szembeni fenntartást növeli, a más hitűekkel szembenit csökkenti.' }
    ];

    // Rangsorolós feladatok: 5 lehetőség, a válaszadó sorba állítja őket (a legfontosabbtól a legkevésbé fontosig).
    // A helyezésből tételenkénti válasz lesz: 1. hely = +2, 2. = +1, 3. = 0, 4. = −1, 5. = −2 (lásd RANK_VALUES az ertektest-data.js-ben).
    // Minden lehetőség más tengelyt mozgat, így a sorrend tengelyek közti fontossági sorrendet is jelent.
    var RANK = [
        { id: 'r_koltseg', tier: 1, text: 'Rangsorold, mire költene legszívesebben az állam a következő költségvetésből: elsőnek arra, ami neked a legfontosabb, utoljára arra, ami a legkevésbé.',
          help: 'Koppints sorban a lehetőségekre: az első a legfontosabb, az ötödik a legkevésbé fontos. Az utolsót magunk kitöltjük.',
          opts: [
              { id: 'r_koltseg_a', text: 'Egészségügy és szociális ellátás', w: { e: 0.9 } },
              { id: 'r_koltseg_b', text: 'Hadsereg és határvédelem', w: { m: 0.9 } },
              { id: 'r_koltseg_c', text: 'Kutatás, egyetemek, innováció', w: { s: -0.9 } },
              { id: 'r_koltseg_d', text: 'Zöld átállás és természetvédelem', w: { g: 0.9 } },
              { id: 'r_koltseg_e', text: 'Rendőrség és közbiztonság', w: { l: 0.9 } }
          ] },
        { id: 'r_ero', tier: 2, text: 'Rangsorold, mitől lesz erős egy ország: elsőnek az, ami szerinted a legfontosabb.',
          help: 'Koppints sorban a lehetőségekre: az első a legfontosabb, az ötödik a legkevésbé fontos. Az utolsót magunk kitöltjük.',
          opts: [
              { id: 'r_ero_a', text: 'Erős közösségek: családok, falvak, civil körök', w: { k: 0.9 } },
              { id: 'r_ero_b', text: 'Szabad piac és vállalkozói kedv', w: { e: -0.9 } },
              { id: 'r_ero_c', text: 'Hagyományok és közös ünnepek', w: { t: 0.9 } },
              { id: 'r_ero_d', text: 'Nyitottság a világra: egyetemek, utazás, külföldi ötletek', w: { n: -0.9 } },
              { id: 'r_ero_e', text: 'Szakértők által vezetett, hatékony államapparátus', w: { d: -0.9 } }
          ] },
        { id: 'r_polgarmester', tier: 2, text: 'Rangsorold, mire költenél először, ha egy kisváros polgármestere lennél.',
          help: 'Koppints sorban a lehetőségekre: az első a legfontosabb, az ötödik a legkevésbé fontos. Az utolsót magunk kitöltjük.',
          opts: [
              { id: 'r_polgarmester_a', text: 'Közös programok: fesztivál, kultúrház, falunap', w: { k: 0.9 } },
              { id: 'r_polgarmester_b', text: 'Parkok, fásítás, zöld területek', w: { g: 0.9 } },
              { id: 'r_polgarmester_c', text: 'Kamerák és közterület-felügyelet', w: { l: 0.9 } },
              { id: 'r_polgarmester_d', text: 'Népszavazás a nagy helyi kérdésekről', w: { d: 0.9 } },
              { id: 'r_polgarmester_e', text: 'Adókedvezmény a helyi vállalkozóknak', w: { e: -0.9 } }
          ] },
        { id: 'r_veszely', tier: 3, text: 'Rangsorold, mi a legnagyobb veszély a mai világban: elsőnek az, ami szerinted a legsúlyosabb.',
          help: 'Koppints sorban a lehetőségekre: az első a legsúlyosabb, az ötödik a legkevésbé súlyos. Az utolsót magunk kitöltjük.',
          opts: [
              { id: 'r_veszely_a', text: 'Háborúk és hatalmi konfliktusok, amelyekre erős védelem kell', w: { m: 0.9 } },
              { id: 'r_veszely_b', text: 'A klímaváltozás és a természet pusztulása', w: { g: 0.9 } },
              { id: 'r_veszely_c', text: 'A hagyományos családi és közösségi értékek eltűnése', w: { t: 0.9 } },
              { id: 'r_veszely_d', text: 'A nemzeti önállóság és kultúra elvesztése', w: { n: 0.9 } },
              { id: 'r_veszely_e', text: 'Hogy az emberek már semmiben és senkiben nem bíznak', w: { c: -0.9 } }
          ] },
        { id: 'r_atad', tier: 3, text: 'Rangsorold, mit adnál át legszívesebben a gyerekeidnek vagy a fiatalabbaknak: elsőnek azt, ami neked a legfontosabb.',
          help: 'Koppints sorban a lehetőségekre: az első a legfontosabb, az ötödik a legkevésbé fontos. Az utolsót magunk kitöltjük.',
          opts: [
              { id: 'r_atad_a', text: 'Kíváncsiságot és tudományos gondolkodást', w: { s: -0.9 } },
              { id: 'r_atad_b', text: 'Hagyományokat, ünnepeket, családi történeteket', w: { t: 0.9 } },
              { id: 'r_atad_c', text: 'Önállóságot: járja a saját útját', w: { k: -0.9 } },
              { id: 'r_atad_d', text: 'Bizalmat az emberekben', w: { c: -0.9 } },
              { id: 'r_atad_e', text: 'Szabadságszeretetet: ne hagyja magát irányítani', w: { l: -0.9 } }
          ] }
    ];

    var api = { VALUE: VALUE, RANK: RANK, HATED_B: HATED_B, PREJ_B: PREJ_B };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZErtek = root.MFSZErtek || {};
    root.MFSZErtek.items = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
