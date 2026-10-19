// =========================================================
// PASZTELL ÉLETÚT - fejezetek, események, eredmények, befejezések
//
// Az események a játékos aktuális helyzetéhez igazodnak: a viselt ruhákra, a gépre, a lakásra,
// a munkára, a szülők hozzáállására és a kaszinós szokásokra is reagálnak (c = E.ctx(s)).
//
// Esemény mezői:
//   id, art (illusztráció), title, text      cím és szöveg (lehet függvény: (s, c) => szöveg)
//   minAge / maxAge                         kor (évben, pl. 16.4)
//   prio: 1                                 történeti esemény: sorban, egyszer, hónapról hónapra
//   trigger(s, c)                           kényszerített esemény, ha igaz (kortól függetlenül)
//   when(s, c)                              feltétel
//   once: false + cooldown                  ismételhető esemény (hány hónap szünettel)
//   weight                                  a véletlen események súlya
//   choices: [{label, tip, req(s,c), reqText, link, do(s, A, c) -> eredményszöveg}]
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var D = M.data;
    var Ev = M.events = {};

    function fmt(n) {
        return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft';
    }
    Ev.fmt = fmt;
    function lvl(s, id) { return s.skills[id] || 0; }
    function pick(list, A) { return list[Math.floor(A.rand() * list.length)]; }
    function engine() { return M.engine; }

    // ---------------------------------------------------------
    // Fejezetek
    // ---------------------------------------------------------
    Ev.CHAPTERS = [
        { id: 'ch1', age: 14, title: 'A kíváncsiság', kicker: '1. fejezet · 14–15 év' },
        { id: 'ch2', age: 16, title: 'A titok', kicker: '2. fejezet · 16–17 év' },
        { id: 'ch3', age: 18, title: 'Kibontakozás', kicker: '3. fejezet · 18–19 év' },
        { id: 'ch4', age: 20, title: 'Önálló élet', kicker: '4. fejezet · 20–22 év' },
        { id: 'ch5', age: 23, title: 'A saját út', kicker: '5. fejezet · 23–25 év' }
    ];

    function chapter(id, age, art, text) {
        var ch = Ev.CHAPTERS.filter(function (c) { return c.id === id; })[0];
        return {
            id: id, art: art, prio: 1, chapter: true, minAge: age,
            title: ch.title, kicker: ch.kicker, text: text,
            choices: [{ label: 'Tovább', do: function () { return ''; } }]
        };
    }

    // Közös válasz a szülőknek való elmondásra
    function tellParents(s, A, c) {
        if (s.conf >= 250) {
            A.setOut(true); A.parents('accepting'); A.conf(80); A.flag('toldParents');
            A.log('Elmondtad a szüleidnek. Anya megölelt, apa hosszan hallgatott, majd annyit mondott: „Mi mindig melletted állunk.”');
            return 'Remeg a hangod, de végigmondod. Anya megölel, apa pedig hosszan hallgat, majd csendesen annyit mond: „Mi mindig melletted állunk.” Hirtelen könnyebb lesz minden.';
        }
        A.setOut(true); A.parents('tense'); A.cutAllowance(2); A.conf(-10); A.flag('toldParents');
        A.log('Elmondtad a szüleidnek. Nehéz beszélgetés volt, de kimondtad.');
        return 'Nehezen találod a szavakat, és a beszélgetés kínos hallgatásba fullad. Nem lesz belőle veszekedés, de a hangulat feszült marad. Legalább már nem kell titkolóznod.';
    }

    // Con-választások (az első és az évenkénti con is ezt használja)
    function conChoices(price, big) {
        var lab = fmt(price);
        return [
            {
                label: 'Hétköznapi ruhában mész', tip: 'Jegy: ' + lab,
                req: function (s) { return s.money >= price; }, reqText: 'Kell hozzá ' + lab,
                do: function (s, A) {
                    A.money(-price); A.con(); A.conf(big ? 90 : 60); A.comm(big ? 18 : 12);
                    A.log('Elmentél egy conra.');
                    return 'Beállsz a sorba, és körülnézel. Mindenki a saját stílusát hozta, és senki nem néz furcsán. Egyszer csak valaki megkér, hogy üljél hozzájuk ebédelni.';
                }
            },
            {
                label: 'A saját ruháidban mész', tip: 'Jegy: ' + lab + ' · legalább 2 darab ruha kell',
                req: function (s) { return s.money >= price && Object.keys(s.items).length >= 2; }, reqText: 'Kell hozzá ' + lab + ' és legalább 2 darab ruha',
                do: function (s, A, c) {
                    A.money(-price); A.con(); A.conf(big ? 170 : 130); A.comm(big ? 28 : 20); A.risk(8);
                    A.log('A saját ruháidban mentél a conra.');
                    return 'Felveszed, amit a szekrényedben őrzöl: ' + (c.ownedText || 'a legjobb ruháidat') + '. A bejáratnál valaki felkiált: „Ez nagyon jó!” A nap további része felhőtlen mosoly.';
                }
            },
            {
                label: 'Cosplayben mész', tip: 'Jegy + anyag: ' + fmt(price + 8000) + ' · Varrás 1. szint kell',
                req: function (s) { return s.money >= price + 8000 && lvl(s, 'varras') >= 1; }, reqText: 'Kell hozzá Varrás 1. szint és ' + fmt(price + 8000),
                do: function (s, A) {
                    A.money(-(price + 8000)); A.con(); A.conf(big ? 260 : 200); A.comm(big ? 40 : 30); A.risk(8);
                    A.skill('varras', 30);
                    A.log('Saját varrású jelmezben mentél a conra.');
                    return 'A jelmezt hetekig varrtad, és minden öltés megérte. A fotósok sorban állnak, valaki megkérdezi, hogy mennyiért árulnád. Életed egyik legszebb napja.';
                }
            },
            { label: 'Kihagyod', do: function (s, A) { A.conf(-5); return 'Otthon maradsz. Jövőre biztosan elmész, ígéred magadnak.'; } }
        ];
    }

    // ---------------------------------------------------------
    // Események
    // ---------------------------------------------------------
    Ev.EVENTS = [

        // ===== 1. fejezet: A kíváncsiság (14-15) =====
        chapter('ch1', 14, 'room',
            'Tizennégy éves vagy. A szoba a családé, a gondolataid viszont már csak a tieid. Valami új kezd bontakozni benned, és még nem tudod pontosan, mi az. Egy dolgot viszont biztosan tudsz: ezt egyelőre magadban tartod.'),

        {
            id: 'e_video', mood: 'surprised', art: 'phone', prio: 1, minAge: 14.08,
            title: 'Az a videó',
            text: 'Késő este görgetsz a telefonodon, amikor feljön egy videó: egy srác pasztell pulcsiban, macskafülekkel, olyan nyugodtan, mintha ez lenne a világ legtermészetesebb dolga. Nem tudod, miért, de nem tudsz elszakadni tőle.',
            choices: [
                { label: 'Megnézed még egyszer', do: function (s, A) { A.conf(12); A.log('Egy videó mindent megváltoztatott.'); return 'Másodszorra már nem is a videót nézed, hanem azt az érzést, amit kivált belőled. Valami megmozdult.'; } },
                { label: 'Továbbgörgetsz', do: function (s, A) { A.conf(3); A.flag('denial'); return 'Továbbgörgetsz, de a kép nem megy ki a fejedből. Másnap este újra megkeresed.'; } }
            ]
        },
        {
            id: 'e_search', mood: 'shy', art: 'phone', prio: 1, minAge: 14.3,
            title: 'Titkos keresés',
            text: function (s, c) {
                return 'Éjszaka van, és te ' + (s.comp === 0 ? 'a nappali családi gépe' : c.az(c.pc)) + ' előtt ülsz. Beírod a keresőbe: „mi az a femboy”. Kiderül, hogy nem vagy egyedül, és hogy sokan vannak, akik pontosan így éreznek.';
            },
            choices: [
                { label: 'Böngészel tovább', tip: 'Titokban, de nyomot hagyhat', do: function (s, A) { A.conf(15); A.risk(s.comp === 0 ? 6 : 3); return s.comp === 0 ? 'Órákig olvasol. Reggel eszedbe jut, hogy a családi gép előzményeiben ott maradt minden.' : 'Órákig olvasol. A saját géped legalább nem árul el semmit.'; } },
                { label: 'Törlöd az előzményeket, és alszol rá egyet', do: function (s, A) { A.conf(5); A.risk(-2); return 'Törlöd a nyomokat, és lefekszel. De hosszan nem jön álom a szemedre.'; } }
            ]
        },
        {
            id: 'e_thrift', art: 'shop', prio: 1, minAge: 14.8,
            title: 'A turkáló',
            text: 'A turkálóban egy pasztellrózsaszín póló lóg a polc végén. 1 500 Ft. Nem emlékszel, mikor kívántál utoljára ennyire valamit.',
            choices: [
                { label: 'Megveszed', tip: '1 500 Ft', req: function (s) { return s.money >= 1500; }, reqText: 'Kell hozzá 1 500 Ft', do: function (s, A) { A.money(-1500); A.give('polo'); A.risk(2); A.conf(10); A.log('Az első pasztell pólód a turkálóból.'); return 'Hazaviszed a pólót, és a tükör előtt felpróbálod. Ez az első alkalom, hogy nem érzed idegennek magad.'; } },
                { label: 'Visszateszed a polcra', do: function (s, A) { A.conf(2); A.flag('coward'); return 'Visszateszed, de útközben háromszor is visszanézel rá.'; } }
            ]
        },
        {
            id: 'e_mom_door', mood: 'surprised', art: 'family', prio: 1, minAge: 15.2,
            when: function (s, c) { return c.d.secret; },
            title: 'Anya benyit',
            text: function (s, c) {
                return c.outfit.length
                    ? 'Éppen ez van rajtad: ' + c.outfitText + ', amikor anya kopogás nélkül benyit.'
                    : 'Anya kopogás nélkül benyit, miközben a gépen éppen egy videó fut, amit nem szívesen mutatnál meg.';
            },
            choices: [
                { label: 'Gyorsan elrejtesz mindent', do: function (s, A) { A.risk(4); A.conf(-3); return 'A szíved a torkodban dobog. Anya furcsán néz rád, de nem kérdez semmit.'; } },
                { label: 'Magabiztosan rávágod: „Iskolai projekt!”', tip: 'Legalább 60 önbizalom kell a sikerhez', do: function (s, A) { if (s.conf >= 60) { A.risk(-4); A.conf(12); return 'Annyira természetesen mondod, hogy anya el is hiszi. Magadat is meglepted.'; } A.risk(12); A.conf(-10); return 'A hangod remeg, és anya gyanakodva néz rád. Egész este érzed a tekintetét.'; } }
            ]
        },
        {
            id: 'e_alias', mood: 'shy', art: 'phone', prio: 1, minAge: 15.5,
            title: 'Egy új név',
            text: 'Az interneten úgy érzed, hogy más lehetnél. Nyithatsz egy álneves fiókot, amit senki nem kapcsol hozzád, és ahol a kedvenc stílusokat követheted.',
            choices: [
                { label: 'Létrehozod a fiókot', do: function (s, A) { A.flag('alias'); A.conf(10); A.risk(-1); A.log('Megnyitottad az első álneves fiókodat.'); return 'Kitalálsz egy álnevet, ami semmit nem árul el rólad, és követsz pár hasonló embert. Az első visszakövetés megmosolyogtat.'; } },
                { label: 'Még nem merészkedsz ennyire', do: function (s, A) { A.conf(1); return 'Még nem. Nem sietsz.'; } }
            ]
        },

        // ===== 2. fejezet: A titok (16-17) =====
        chapter('ch2', 16, 'room',
            'Tizenhat éves vagy. A titkod megvan, a szekrényed mélyén a dolgaid is. Közben tanulsz, dolgozol, és próbálsz észrevétlen maradni. De ez a kettős élet egyre nehezebb.'),
        {
            id: 'e_summer', art: 'work', prio: 1, minAge: 16.1,
            title: 'Az első nyári munka',
            text: 'A szomszéd néni lánya a strandon fagylaltozót vezet, és kisegítőt keres. Az első saját pénzed lehetne, és még a nyár is jobb lenne vele.',
            choices: [
                { label: 'Elvállalod', tip: 'Fagylaltos: 55 000 Ft/hó (fél állás)', do: function (s, A) { A.job('fagyi'); A.conf(20); A.log('Elkezdtél dolgozni a strandon.'); return 'Az első napon háromszor elrontod a gombócot, de a főnök mosolyogva azt mondja, hogy mindenki így kezdi. A munka a „Munka” fülön módosítható.'; } },
                { label: 'Inkább pihensz', do: function (s, A) { A.energy(100); A.conf(5); return 'Pihensz. Néha az is szükséges.'; } }
            ]
        },
        {
            id: 'e_classmate', mood: 'shy', art: 'school', prio: 1, minAge: 16.4,
            title: 'Megjegyzés a folyosón',
            text: function (s, c) {
                return 'A folyosón egy osztálytársad végigmér, és hangosan megjegyzi: „Ez meg mi?”' + (c.outfit.length ? ' (Rajtad ma: ' + c.outfitText + '.)' : '');
            },
            choices: [
                { label: 'Visszaszólsz egy poénnal', tip: 'Legalább 150 önbizalom kell a sikerhez', do: function (s, A) { if (s.conf >= 150) { A.conf(40); A.comm(1); return 'Úgy válaszolsz, hogy a folyosó kitör a nevetésből, és az osztálytársad is vigyorog. Tőle sosem kaptál ilyen tiszteletet.'; } A.conf(-20); return 'A poénod nem sül el jól. Kínosan elmosolyodsz, és gyorsan elsietsz.'; } },
                { label: 'Nem reagálsz', do: function (s, A) { A.conf(5); return 'Nem válaszolsz. Hosszan hallgatsz, aztán továbbsétálsz. Büszke vagy, hogy nem engedted, hogy kizökkentsen.'; } },
                { label: 'Elsétálsz', do: function (s, A) { A.conf(-8); return 'Gyorsan elmész. Egész nap ez jár a fejedben.'; } }
            ]
        },
        {
            id: 'e_discord', art: 'discord', prio: 1, minAge: 16.8,
            title: 'Egy hely, ahol van helyed',
            text: 'Egy ismeretlen fórumbejegyzés alján találsz egy meghívót a magyar femboy közösség Discord-szerverére. Hónapok óta egy ilyen helyet keresel: ahol nem kell magyarázkodnod, és ahol senki nem néz furcsán.',
            choices: [
                { label: 'Csatlakozol', link: { href: D.DISCORD_URL, label: 'Megnyitom a valódi szervert' }, do: function (s, A) { A.flag('discord'); A.comm(10); A.conf(30); A.log('Csatlakoztál a magyar femboy Discord-szerverhez.'); return 'Beléptél. Az első üzenet, amit látsz: „Szia, üdv a családban!” A szíved hevesebben ver, és észreveszed, hogy mosolyogsz.'; } },
                { label: 'Később', do: function (s, A) { A.flag('discordLater'); return 'Elmented a linket, de még nem lépsz be.'; } }
            ]
        },
        {
            id: 'e_chat', art: 'discord', prio: 1, minAge: 17.0,
            when: function (s) { return s.flags.discord; },
            title: 'Az első beszélgetés',
            text: function (s, c) {
                return 'Valaki a szerveren megkérdezi, hogy milyen cuccaid vannak. ' + (c.ownedText ? 'Neked eddig: ' + c.ownedText + '.' : 'Neked még semmid, de tervezgetsz.') + ' Hirtelen úgy érzed, hogy ezeket el is mondhatod valakinek.';
            },
            choices: [
                { label: 'Mesélsz magadról', do: function (s, A) { A.conf(30); A.comm(5); return 'Hosszan írsz, és közben rájössz, hogy első alkalommal beszélsz valakivel őszintén. A válasz: „Nagyon jól hangzik, én is így indultam.”'; } },
                { label: 'Csak olvasod', do: function (s, A) { A.conf(10); A.comm(1); return 'Csendben olvasol, és közben egyre bátrabb leszel.'; } }
            ]
        },
        {
            id: 'e_discord2', art: 'discord', prio: 1, minAge: 17.3, maxAge: 19,
            when: function (s) { return s.flags.discordLater && !s.flags.discord; },
            title: 'Még mindig ott a link',
            text: 'A böngésző könyvjelzői között még mindig ott van a Discord-meghívó. Egyre többet gondolsz rá. Mi történhet?',
            choices: [
                { label: 'Végre belépsz', link: { href: D.DISCORD_URL, label: 'Megnyitom a valódi szervert' }, do: function (s, A) { A.flag('discord'); A.comm(10); A.conf(40); A.log('Csatlakoztál a magyar femboy Discord-szerverhez.'); return 'Beléptél. Rengeteg ember, rengeteg kedves üzenet, és senki nem kérdezi, hogy miért vártál.'; } },
                { label: 'Még nem', do: function (s, A) { A.conf(-3); return 'Még mindig nem. De a link ott marad.'; } }
            ]
        },
        {
            id: 'e_caught', mood: 'sad', art: 'family', trigger: function (s) { return s.risk >= 100 && !s.out; }, once: false, cooldown: 12,
            title: 'Lebuktál',
            text: function (s, c) {
                return 'Anya takarítás közben megtalálja a titkos dolgaidat' + (c.ownedText ? ' (' + c.ownedText + ')' : '') + '. Amikor hazaérsz, mindent az asztalra rakott. Nem kiabál, csak vár.';
            },
            choices: [
                { label: 'Őszintén elmondod', tip: 'Legalább 150 önbizalom kell', do: function (s, A) { A.flag('caught'); if (s.conf >= 150) { A.setOut(true); A.parents('accepting'); A.conf(60); A.log('Őszintén beszéltél a szüleiddel, és elfogadtak.'); return 'Végigmondod, amit eddig titkoltál. Anya sír, apa a válladra teszi a kezét. „Ezek szerint ezért voltál ilyen hallgatag mostanában.” Nem lesz tökéletes, de ők melletted állnak.'; } A.setOut(true); A.parents('tense'); A.conf(-15); A.cutAllowance(3); return 'Szeretnél őszinte lenni, de a szavak elakadnak. A beszélgetés feszült lesz, a zsebpénzedet is megvonják pár hónapra. De legalább már mindent tudnak.'; } },
                { label: 'Letagadod', do: function (s, A) { A.flag('caught'); A.flag('denied'); A.setRisk(40); A.conf(-30); return 'Azt mondod, hogy ezek egy barátodéi, és csak megőrizted őket. Anya nem hisz neked, de nem erőlteti. A titkod tovább él, csak sokkal nagyobb a súlya.'; } },
                { label: 'Elrohansz a szobádba', do: function (s, A) { A.flag('caught'); A.setOut(true); A.parents('tense'); A.conf(-40); A.cutAllowance(3); return 'Becsapod az ajtót. Órákig nem mész ki. Éjjel anya csendesen bekopog, és letesz egy tányér vacsorát az ajtód elé. Ennyi most elég.'; } }
            ]
        },
        {
            id: 'e_exam', mood: 'sad', art: 'school', prio: 1, minAge: 17.8,
            title: 'Érettségi',
            text: function (s, c) { return 'Az érettségi hetében ' + (s.comp === 0 ? 'a családi gépen' : c.az(c.pc) + ' előtt') + ' tanulsz éjszakánként. A fejed tele van tételekkel, és közben a jövőd is ott lebeg a háttérben.'; },
            choices: [
                { label: 'Éjjel-nappal tanulsz', tip: '−60 energia', do: function (s, A) { A.energy(-60); A.skill('angol', 40); A.conf(20); return 'Kimerült vagy, de jól sikerül. A nagyi még egy kis zsebpénzt is küld jutalmul.'; } },
                { label: 'Lazán veszed', do: function (s, A) { A.conf(10); A.energy(30); return 'Annyira nem aggódsz, és minden jól alakul. Kicsit szerencse, kicsit rutin.'; } }
            ]
        },
        {
            id: 'e_hidden_find', mood: 'surprised', art: 'family', weight: 2, once: false, cooldown: 14, minAge: 15,
            when: function (s, c) { return c.d.secret && c.ownedWardrobe.length >= 1; },
            title: 'Anya a mosásnál',
            text: function (s, c) { return 'Anya a szennyest rendezgeti, és a kezében megáll egy ruha. Felemeli és rád néz. A szekrényed rejtett fele: ' + c.ownedText + '.'; },
            choices: [
                { label: 'Azt mondod, hogy egy barátodé', tip: 'Legalább 80 önbizalom kell', do: function (s, A) { if (s.conf >= 80) { A.conf(5); A.risk(-2); return 'Olyan nyugodtan mondod, hogy anya elhiszi. Visszateszi a ruhát, és lemegy a mosókonyhába.'; } A.risk(15); A.conf(-8); return 'A hangod bizonytalan, anya nem is válaszol, csak elgondolkodva néz. Gyanús lett neki.'; } },
                { label: 'Elvörösödsz és kikapod a kezéből', do: function (s, A) { A.risk(8); A.conf(-6); return 'Elpirulsz, és a ruhát gyorsan eltűntetem. Anya hallgat, de megjegyzi.'; } },
                { label: 'Szó nélkül elveszed', do: function (s, A) { A.risk(3); return 'Szó nélkül elveszed a ruhát, és kimész. Anya utánad néz.'; } }
            ]
        },
        {
            id: 'e_family_pc', art: 'phone', weight: 2, once: false, cooldown: 12, minAge: 14,
            when: function (s, c) { return s.comp === 0 && c.d.secret; },
            title: 'A böngészőelőzmények',
            text: 'A nappali gépén valaki megnyitja az előzményeket, és hosszan görget. A te kereséseid között ott vannak a ruhák, a cikkek és a közösségek is.',
            choices: [
                { label: 'Gyorsan törlöd az előzményeket', do: function (s, A) { A.risk(-3); A.conf(-2); return 'Hamar észreveszed, és az összes keresést törlöd. A szív a torkodban dobog.'; } },
                { label: 'Inkognitó módra váltasz', do: function (s, A) { A.risk(-1); A.conf(3); return 'Mostantól mindig inkognitó módban böngészel. Ügyes vagy.'; } }
            ]
        },

        // ===== Barátok és smink: ismétlődő események =====
        {
            id: 's_lilla_sleepover', art: 'friends', weight: 2, once: false, cooldown: 10, minAge: 15,
            when: function (s, c) { return engine().bond(s, 'lilla') >= 25 && s.housing === 'szulo'; },
            title: 'Lilla átjön éjszakára',
            text: function (s, c) { return 'Lilla azt írja, hogy átjönne filmezni, és hozna rágcsát is. ' + (c.d.secret ? 'A szobád rejtett fele viszont éppen kint van.' : 'A szobád pont olyan, amilyennek lennie kell.') + (c.look ? ' A tükör előtt még gyorsan megigazítod a sminkedet: ' + c.look + '.' : ''); },
            choices: [
                { label: 'Beengeded, a cuccaiddal együtt', tip: 'Kockázat, de őszinte este', do: function (s, A, c) { A.bond('lilla', 6); A.conf(30); A.comm(3); A.risk(c.d.secret ? 10 : 0); A.log('Lilla nálad aludt.'); return 'Lilla végignézi a polcokat, és csak ennyit mond: „Ez nagyon te vagy.” A film közben végig nevettek, és a végén a vállad mellett alszik el.'; } },
                { label: 'Elrejtesz mindent', tip: 'Biztonságos, de kicsit szomorú', do: function (s, A) { A.bond('lilla', 2); A.risk(-2); A.conf(3); return 'Gyorsan eltűntetsz minden árulkodó dolgot. Jó este, de közben végig figyeled az ajtót.'; } },
                { label: 'Inkább lemondod', do: function (s, A) { A.bond('lilla', -2); A.conf(-4); return 'Kitalálsz valami kifogást. Lilla nem sértődik meg, de a hangján hallod, hogy észrevette.'; } }
            ]
        },
        {
            id: 's_makeup_compliment', mood: 'shy', art: 'friends', weight: 3, once: false, cooldown: 8, minAge: 15,
            when: function (s, c) { return c.lookCount >= 2 && !c.d.secret; },
            title: 'Valaki észreveszi a sminkedet',
            text: function (s, c) { return 'Útközben valaki megáll, és rád mosolyog: „Ez a ' + c.look + ' nagyon jól áll neked. Hol vetted?” Egy pillanatra megáll az idő.'; },
            choices: [
                { label: 'Elmeséled a trükköt', do: function (s, A) { A.conf(45); A.comm(4); A.skill('smink', 20); A.log('Valaki megdicsérte a sminkedet.'); return 'Szívesen elmondod, mit hogyan raktál fel. A végén még a számát is megkapod, hogy küldj róla képet.'; } },
                { label: 'Elpirulsz és megköszönöd', do: function (s, A) { A.conf(25); A.comm(1); return 'Alig tudsz kinyögni egy „köszönöm”-et, de egész nap mosolyogsz.'; } },
                { label: 'Továbbmész', do: function (s, A) { A.conf(5); return 'Gyorsan továbbsétálsz. A szíved még sokáig dobog.'; } }
            ]
        },
        {
            id: 's_nori_con_invite', art: 'con', weight: 2, once: false, cooldown: 12, minAge: 18,
            when: function (s) { return s.stats.cons >= 1 && engine().bond(s, 'nori') >= 20 && s.money >= 6000; },
            title: 'Nori meghív egy kisebb találkozóra',
            text: 'Nori egy pici, házi hangulatú találkozót szervez a con-ismerősöknek: társasjáték, sütemény, közös rajzolás. Azt írja, hogy téged mindenképp látni szeretne.',
            choices: [
                { label: 'Elmész és viszel valamit', tip: '6 000 Ft', req: function (s) { return s.money >= 6000; }, reqText: 'Kell hozzá 6 000 Ft', do: function (s, A, c) { A.money(-6000); A.bond('nori', 6); A.conf(50); A.comm(8); A.skill('rajz', 12); return 'A nap egyik legjobb pillanata, amikor kinyitod a dobozt, és mindenki a ' + (c.look ? c.look : 'kedvenc sütiket') + ' dicséri. Késő estig rajzoltok.'; } },
                { label: 'Csak beszélgetni mész', do: function (s, A) { A.bond('nori', 3); A.conf(20); A.comm(3); return 'Egy sarokban ülsz, és hallgatod a többieket. Nori időnként odanyomja a kezedbe a rajzfüzetét.'; } },
                { label: 'Kihagyod', do: function (s, A) { A.bond('nori', -2); A.conf(-3); return 'Megírod, hogy nem tudsz menni. Nori küld egy matricát, de érződik, hogy sajnálja.'; } }
            ]
        },
        {
            id: 's_bence_mod', art: 'discord', weight: 2, once: false, cooldown: 14, minAge: 17.5,
            when: function (s) { return s.flags.discord && engine().bond(s, 'bence') >= 25; },
            title: 'Bence moderátort keres',
            text: 'Bence privátban ír: a szervernek szüksége lenne egy új moderátorra, aki türelmes és kedves az újakkal. Szerinte te pont ilyen vagy.',
            choices: [
                { label: 'Vállalod', tip: 'Fáradságos, de sokat ad a közösségnek', do: function (s, A) { A.bond('bence', 6); A.conf(40); A.comm(14); A.energy(-15); A.log('Moderátor lettél a szerveren.'); return 'Az első héten három újat köszöntesz, egyet megvigasztalsz, és egy vitát is lecsendesítesz. Fáradtan, de büszkén zárod le a gépet.'; } },
                { label: 'Besegítesz alkalmanként', do: function (s, A) { A.bond('bence', 3); A.conf(15); A.comm(5); return 'Nem lesz belőled hivatalos moderátor, de néha beugrasz. Bence így is hálás.'; } },
                { label: 'Nemet mondasz', do: function (s, A) { A.conf(-2); return 'Megköszönöd a bizalmat, de most nem. Bence megérti.'; } }
            ]
        },
        {
            id: 's_partner_anniv', art: 'cafe', weight: 3, once: false, cooldown: 12, minAge: 23.5,
            when: function (s) { return !!s.flags.partner && engine().bond(s, 'zsombor') >= 20; },
            title: 'Évforduló',
            text: function (s, c) { return 'Rájössz, hogy ma van az első kávétok évfordulója. ' + (c.look ? 'A ' + c.look + ' mellé ' : '') + 'Zsombor még nem szólt semmit, de a naptárában ott a bejegyzés.'; },
            choices: [
                { label: 'Meglepetés vacsora', tip: '15 000 Ft', req: function (s) { return s.money >= 15000; }, reqText: 'Kell hozzá 15 000 Ft', do: function (s, A) { A.money(-15000); A.bond('zsombor', 8); A.conf(70); A.log('Évfordulós vacsora.'); return 'Gyertyák, tészta és egy kézzel írt kártya. Zsombor szó nélkül átölel, aztán sokáig nem engedi el.'; } },
                { label: 'Egy kézzel rajzolt képeslap', tip: 'Ingyen', do: function (s, A) { A.bond('zsombor', 5); A.conf(40); A.skill('rajz', 8); return 'Az asztalnál rajzolod, mielőtt megjön. Zsombor kitűzi a hűtőre, és el sem engedi a mosolyát.'; } },
                { label: 'Majdnem elfelejted', do: function (s, A) { A.bond('zsombor', -3); A.conf(-10); return 'Zsombor mosolyog, de egy kicsit elhallgat. Legközelebb jobban figyelsz.'; } }
            ]
        },
        {
            id: 's_family_dinner', art: 'family', weight: 2, once: false, cooldown: 10, minAge: 16,
            when: function (s) { return s.parents === 'accepting' && engine().bond(s, 'csalad') >= 30; },
            title: 'Vasárnapi ebéd',
            text: function (s, c) { return 'Anya átküld egy üzenetet: vasárnap a nagymama is jön. ' + (c.look ? 'Apa még viccelődik is: „Az a ' + c.look + ' nagyon jól áll neked.”' : 'A hangulat ritkán volt ilyen jó.'); },
            choices: [
                { label: 'Elmész és segítesz főzni', do: function (s, A) { A.bond('csalad', 6); A.conf(35); A.energy(-8); return 'Együtt vágjátok a zöldséget, és apa elmeséli, hogyan ismerkedett meg anyával. Csendes, meleg délután.'; } },
                { label: 'Csak a desszertre érsz oda', do: function (s, A) { A.bond('csalad', 2); A.conf(10); return 'Épp időben érsz oda. Senki nem szól semmit, csak jut neked a legnagyobb darab.'; } },
                { label: 'Lemondod', do: function (s, A) { A.bond('csalad', -3); A.conf(-5); return 'Anya azt mondja, hogy semmi baj, de a hangján érződik a csalódottság.'; } }
            ]
        },

        // ===== 3. fejezet: Kibontakozás (18-19) =====
        chapter('ch3', 18, 'school',
            'Tizennyolc éves vagy. Nagykorú. A világ hirtelen nagyobb lett, és te is: az, hogy mit kezdesz vele, ezután már rajtad múlik.'),
        {
            id: 'e_adult', mood: 'happy', art: 'school', prio: 1, minAge: 18.05,
            title: 'Nagykorú vagy',
            text: 'Túl vagy az érettségin. A szüleid és az osztálytársaid is azt kérdezik: „Mi lesz most?” Te csak azt tudod, hogy szabadabb vagy, mint bármikor.',
            choices: [
                { label: 'Egyetemre mész', tip: 'Ösztöndíj + kollégium, csak részmunka', do: function (s, A) { A.student(true); A.conf(30); A.log('Felvettek az egyetemre.'); return 'Felvettek! Az ösztöndíj szerény, de a kollégium és a sok új ismerős mind megéri. Hallgatóként gyorsabban tanulsz.'; } },
                { label: 'Munkát vállalsz', tip: 'Teljes állás is vállalható', do: function (s, A) { A.flag('workPath'); A.conf(40); return 'Úgy döntesz, hogy a saját lábadra állsz. A teljes állás sokat hoz, de a tanulásra kevesebb időd marad.'; } },
                { label: 'Szünetet tartasz', do: function (s, A) { A.conf(80); A.comm(3); A.energy(100); return 'Egy évig csak magaddal foglalkozol. Utazol, olvasol, és tanulsz arról, hogy ki vagy.'; } }
            ]
        },
        {
            id: 'e_con', mood: 'happy', art: 'con', prio: 1, minAge: 18.2,
            when: function (s) { return s.flags.discord; },
            title: 'Con-meghívó',
            text: function (s, c) {
                return 'A szerveren megszervezik a Pasztell Con közös utazását. A jegy 6 000 Ft, plusz az útiköltség. ' + (c.ownedText ? 'A szekrényedben jelenleg: ' + c.ownedText + '.' : 'A szekrényed még üres.');
            },
            choices: conChoices(6000, false)
        },
        {
            id: 'g_invite', art: 'casino', prio: 1, minAge: 18.5,
            when: function (s) { return engine().casinoState(s).open; },
            title: 'Szerencsepróba',
            text: function (s, c) {
                var money = c.job ? 'A havi béred jut eszedbe (' + c.job + '), amit épp csak megkerestél.' : 'A zsebpénzed jut eszedbe, amit most gyűjtögetsz.';
                return 'Egy ismerősöd megmutatja a kaszinó oldalát a telefonján. „Egy kör nem kerül sokba” — mondja. ' + money + ' (A játék csak játékpénzzel megy, de a döntés hasonló. A Kaszinó fülön havi keretet is beállíthatsz.)';
            },
            choices: [
                { label: 'Kipróbálod', tip: '+1 000 Ft üdvözlő bónusz', do: function (s, A) { A.money(1000); A.flag('gambled'); A.log('Kipróbáltad a kaszinót.'); return 'Kapsz egy kis üdvözlő bónuszt. A felület csupa fény és hang. Észreveszed, mennyire hívogató. Érdemes figyelni a havi keretre.'; } },
                { label: 'Kihagyod', do: function (s, A) { A.conf(15); A.flag('noGamble'); return 'Nem érdekel. Inkább mész és veszel valami szépet magadnak.'; } }
            ]
        },
        {
            id: 'e_dinner', mood: 'sad', art: 'family', prio: 1, minAge: 18.6,
            when: function (s) { return !s.out && s.housing === 'szulo'; },
            title: 'Vasárnapi ebéd',
            text: 'Vasárnapi ebéd, az egész család az asztalnál. Apa a hírekről beszél, anya megkérdezi, hogy mi van veled mostanában. A válasz a nyelved hegyén van.',
            choices: [
                { label: 'Elmondod most', tip: '250+ önbizalom esetén jobban fogadják', do: function (s, A, c) { return tellParents(s, A, c); } },
                { label: 'Még nem', do: function (s, A) { A.conf(-5); A.flag('dinnerDelay'); return 'Elnyeled a szavakat, és a levest kavargatod. Talán legközelebb.'; } }
            ]
        },
        {
            id: 'e_nudge', art: 'moving', prio: 1, minAge: 19.3,
            when: function (s) { return s.housing === 'szulo'; },
            title: 'Saját hely',
            text: function (s, c) {
                return c.d.secret
                    ? 'Elég volt a titkolózásból és a szűk szobából. ' + c.az(c.pc) + ' és a ruháid számára is kell egy hely, ahol senki nem néz át a válladon. Lakásoldalakat nézegetsz.'
                    : 'Szeretsz otthon lenni, de egyre jobban vágysz a saját helyre. Lakásoldalakat nézegetsz éjszakánként.';
            },
            choices: [
                { label: 'Megnézed a lakásokat', tip: 'A Lakás fülön költözhetsz', do: function (s, A) { A.conf(10); A.flag('looking'); return 'Kinézel pár lehetőséget. Kollégium, albérleti szoba, esetleg egy garzon. A kaució elég tetemes, de a vágy erős.'; } },
                { label: 'Még maradsz', do: function (s, A) { A.conf(2); return 'Még maradsz. Spórolnod kell.'; } }
            ]
        },
        {
            id: 'e_dinner2', art: 'family', prio: 1, minAge: 19.8,
            when: function (s) { return !s.out && s.housing === 'szulo'; },
            title: 'Nem bújhatsz örökké',
            text: 'Anya a konyhában megáll mellettem. „Tudom, hogy van valami, amit nem mondasz el. Nem kell sietned, de szeretném, ha tudnád, hogy szeretlek.”',
            choices: [
                { label: 'Elmondod', tip: '250+ önbizalom esetén jobban fogadják', do: function (s, A, c) { return tellParents(s, A, c); } },
                { label: 'Előbb elköltözöl, és csak utána mondod el', do: function (s, A) { A.conf(10); A.flag('planMove'); return 'Megölelitek egymást. Nem kérdez többet. Neked pedig megvan a terved: előbb saját hely, utána őszinteség.'; } }
            ]
        },

        // ===== 4. fejezet: Önálló élet (20-22) =====
        chapter('ch4', 20, 'moving',
            'Húszéves vagy. A saját pénzed, a saját döntéseid, a saját lakásod, legalábbis ha minden jól megy. A szabadság ára a lakbér, a számlák és a felelősség.'),
        {
            id: 'e_cowork', art: 'office', prio: 1, minAge: 20.5,
            when: function (s) { return !!s.job && !s.flags.outAtWork; },
            title: 'Egy kolléga kérdez',
            text: function (s, c) {
                return c.outfit.length
                    ? 'A munkahelyen (' + c.job + ') egy kolléga észreveszi rajtad: ' + c.outfitText + '. Kíváncsian megkérdezi, hogy ez tudatos stílus-e.'
                    : 'A munkahelyen (' + c.job + ') egy kolléga megkérdezi, hogy miért nem mesélsz soha a hétvégi programjaidról. Barátságosan kíváncsi.';
            },
            choices: [
                { label: 'Őszintén válaszolsz', do: function (s, A) { A.flag('outAtWork'); A.conf(40); A.comm(3); A.log('A munkahelyeden is őszinte voltál.'); return 'Elmondod, hogy igen, ez a stílusod. A kolléga rád mosolyog: „Nekem is tetszik. Büszke lehetsz.”'; } },
                { label: 'Témát váltasz', do: function (s, A) { A.conf(-6); return 'Gyorsan másról kezdesz beszélni. A kolléga bólint, de látod rajta, hogy észrevette.'; } }
            ]
        },
        {
            id: 'e_stage', art: 'stage', prio: 1, minAge: 21.5, maxAge: 24.8,
            when: function (s) { return s.comm >= 120; },
            title: 'Con-panel',
            text: function (s, c) { return 'A Pasztell Con szervezői előadónak hívnak egy panelbeszélgetésre: „Hogyan kezdd el? Egy femboy első évei.” ' + (c.outfit.length ? 'A színpadra úgy mennél fel, hogy rajtad lesz: ' + c.outfitText + '.' : ''); },
            choices: [
                { label: 'Vállalod', do: function (s, A) { A.flag('stage'); A.conf(150); A.comm(40); A.money(30000); A.log('Előadtál egy con-panelen.'); return 'A kezed remeg, de amikor megszólalsz, elcsendesül a terem. A végén hosszan tapsolnak. Valaki odajön, és annyit mond: „Te segítettél nekem.”'; } },
                { label: 'Nem mered', do: function (s, A) { A.conf(-20); return 'Lemondod. Utána napokig bánod.'; } }
            ]
        },
        {
            id: 'e_grad', mood: 'happy', art: 'school', prio: 1, minAge: 22.0,
            when: function (s) { return s.student; },
            title: 'A diploma',
            text: 'Három év kemény munka után kezedben a diploma. A hallgatói lét véget ér, az ösztöndíj és a kedvezmények is. Cserébe teljes állást is vállalhatsz.',
            choices: [{ label: 'Átveszed', do: function (s, A) { A.student(false); A.conf(60); A.money(20000); A.log('Megszerezted a diplomádat.'); return 'A családod ott áll a tömegben. Anya kendővel törölgeti a szemét. Hazaúton mindenki hallgat, aztán nevetni kezdtek.'; } }]
        },
        {
            id: 'e_moved', mood: 'happy', art: 'moving', trigger: function (s) { return s.flags.moved && !s.seen.e_moved; },
            title: 'Az első saját otthon',
            text: function (s, c) { return 'Beköltözöl ide: ' + c.home + '. Az első, amit felállítasz, ' + c.az(c.pc) + (c.ownedWardrobe.length ? ', a második a ruháid kipakolása' : '') + '. Az ajtó mögött egyszerre nyugalom és izgalom.'; },
            choices: [
                { label: 'Először a szobát rendezed be', do: function (s, A) { A.conf(30); return 'A szobád lassan a te helyed lesz. Minden polc, minden kép a tiéd.'; } },
                { label: 'Először a gépet kötöd be', do: function (s, A) { if (s.activeSkill) A.skill(s.activeSkill, 20); A.conf(15); return 'Pár órán belül már tanulsz is. A hálózat is működik, és az első üzenet is megérkezik a szerveren.'; } },
                { label: 'Felhívod a szüleidet', do: function (s, A) { A.conf(s.parents === 'accepting' ? 40 : 10); return s.parents === 'accepting' ? 'Anya a telefonban sír és nevet egyszerre. „Már hiányzol, de büszke vagyok rád.”' : 'Rövid, udvarias beszélgetés. De legalább felhívtad őket.'; } }
            ]
        },
        {
            id: 'e_broke', mood: 'sad', art: 'bills', trigger: function (s) { return s.debtMonths >= 2; }, once: false, cooldown: 12,
            title: 'Kifutottál a pénzből',
            text: function (s, c) { return 'Két hónapja nem fizeted rendesen a lakbért és a számlákat (' + c.home + '). A tulajdonos komoly hangon ír. Valamit tenned kell.'; },
            choices: [
                { label: 'Hazaköltözöl', tip: 'A tartozást a szüleid rendezik', do: function (s, A) { if (s.money < 0) A.money(-s.money); A.moveHome(); A.conf(-30); A.log('Kénytelen voltál hazaköltözni.'); return 'Összepakolsz, és hazamész. Anya egy szót sem szól, csak megfőzi a kedvenc ételedet. Nem győzelem, de nem is katasztrófa.'; } },
                { label: 'Segítséget kérsz a barátaidtól', tip: 'Legalább 20 közösségi pont kell', req: function (s) { return s.comm >= 20; }, reqText: 'Legalább 20 közösségi pont kell', do: function (s, A) { A.money(Math.max(120000, -s.money + 40000)); A.conf(-10); A.comm(2); return 'A szerveren megírod az igazat. Csak pár órába telik, és már gyűlik is a pénz. „Majd egyszer te is segítesz valakinek.”'; } },
                { label: 'Éjszakai munkát vállalsz', tip: '+60 000 Ft, de kimerítő', do: function (s, A) { A.money(60000); A.energy(-80); A.conf(-10); return 'Három hétig éjjel dolgozol. Kimerült vagy, de a tartozás csökken.'; } }
            ]
        },

        // ===== 5. fejezet: A saját út (23-25) =====
        chapter('ch5', 23, 'sunset',
            'Huszonhárom éves vagy. Már tudod, ki vagy. A kérdés inkább az, mivé szeretnél válni. Közeledik a híres huszonötödik, amiről a közösségben annyit viccelődnek.'),
        {
            id: 'e_date', mood: 'shy', art: 'cafe', prio: 1, minAge: 23.0,
            when: function (s) { return s.flags.discord && !s.flags.partner; },
            title: 'Egy üzenet',
            text: function (s, c) { return 'Valaki, akivel a szerveren és a conon is sokat beszéltél, azt írja: „Van kedved egy kávéra? Nem a chatben.” ' + (c.outfit.length ? 'Gondolkodsz, hogy mit vennél fel: ' + c.outfitText + '?' : ''); },
            choices: [
                { label: 'Elmész', tip: '8 000 Ft', req: function (s) { return s.money >= 8000; }, reqText: 'Kell hozzá 8 000 Ft', do: function (s, A) { A.money(-8000); A.flag('partner'); A.conf(100); A.comm(3); A.log('Egy kávéval kezdődött valami új.'); return 'Három óra telik el, mintha csak percek lennének. Hazafelé úgy érzed, hogy mosolyogsz anélkül, hogy észrevennéd.'; } },
                { label: 'Még nem állsz készen', do: function (s, A) { A.conf(10); return 'Megköszönöd, és megígéred, hogy később még visszatérsz rá. Jó érzés, hogy van, akinek számítasz.'; } }
            ]
        },
        {
            id: 'e_parents_visit', art: 'family', prio: 1, minAge: 23.4,
            when: function (s) { return s.housing !== 'szulo'; },
            title: 'A szülők látogatása',
            text: function (s, c) {
                var intro = 'Anyáék meglátogatnak. Körülnéznek a lakásban (' + c.home + '), és anya megjegyzi, hogy szép a rend.';
                if (s.parents === 'accepting') return intro + ' Apa megnézi ' + c.az(c.pc) + ' is, és lelkes.';
                if (s.parents === 'tense') return intro + ' A hangulat visszafogott. A régi beszélgetés ott lebeg a levegőben.';
                return intro + ' Közben azon gondolkodsz, hogy ők valójában mennyit sejtenek.';
            },
            choices: [
                { label: 'Őszintén beszélsz velük', tip: '400+ önbizalom esetén sikerül elfogadtatni', do: function (s, A, c) {
                    if (s.parents === 'accepting') { A.conf(120); return 'Hosszan beszélgettek. Anya azt mondja, hogy mindig is tudta, és apa elégedetten bólint. Lehet, hogy a dolgok a legjobban alakulnak.'; }
                    A.setOut(true);
                    if (s.conf >= 400) { A.parents('accepting'); A.conf(150); A.flag('toldParents'); return 'Elmondod, ki vagy, és mit jelent neked. Hosszú csend, majd anya megfogja a kezedet. „Köszönöm, hogy elmondtad.”'; }
                    A.parents(s.parents === 'unknown' ? 'tense' : s.parents); A.conf(40); A.flag('toldParents'); return 'Nem könnyű beszélgetés, de legalább kimondtad. Nem oldódik meg minden egyszerre, de elindult valami.';
                } },
                { label: 'Meghívod őket vacsorára', tip: '6 000 Ft', req: function (s) { return s.money >= 6000; }, reqText: 'Kell hozzá 6 000 Ft', do: function (s, A) { A.money(-6000); A.conf(s.parents === 'accepting' ? 100 : 40); return 'Jó vacsora, jó hangulat. Mindenki úgy távozik, hogy kicsit közelebb kerültetek egymáshoz.'; } },
                { label: 'Rövid kávéra hívod', do: function (s, A) { A.conf(30); return 'Egy gyors kávé, pár mosoly. Nem több, de nem is kevesebb.'; } }
            ]
        },
        {
            id: 'e_mentor', art: 'discord', prio: 1, minAge: 24.0,
            when: function (s) { return s.flags.discord; },
            title: 'Egy tini ír neked',
            text: 'Egy fiatal ír a szerveren, magánban: „Szia, láttam, hogy te már sok mindenen túl vagy. Mit tegyek, ha még titkolom?” Egy pillanatra visszarepülsz tizennégy évesen.',
            choices: [
                { label: 'Hosszan válaszolsz', do: function (s, A) { A.flag('mentor'); A.conf(200); A.comm(30); A.log('Segítettél egy fiatalnak, aki éppen úgy kezdte, mint te.'); return 'Mesélsz a turkálóról, a titkokról, az első bátor lépésekről. A válasz: „Köszönöm, ezt most nagyon kellett hallanom.” Már értem, mit éreznek azok, akik segítettek neked.'; } },
                { label: 'Röviden válaszolsz', do: function (s, A) { A.conf(40); A.comm(3); return 'Írsz néhány kedves mondatot, és megígéred, hogy bármikor írhat.'; } }
            ]
        },
        {
            id: 'e_omen', art: 'sunset', prio: 1, minAge: 24.6,
            title: 'A híres huszonötödik',
            text: function (s, c) {
                return 'A szerveren valaki poénból kiírja: „Mindjárt huszonöt leszel, jön a femboy death!” Mindenki röhög. Te ' + c.az(c.pc) + ' előtt ülsz, és közben végiggondolod az elmúlt éveket: a turkálót, a titkokat, az első conos napot, mindent.';
            },
            choices: [
                { label: 'Nevetsz rajta', do: function (s, A) { A.conf(60); A.comm(5); return 'Visszaírsz: „Ha jön, majd nyitok neki ajtót.” A chat tele lesz nevető emojikkal.'; } },
                { label: 'Elgondolkozol', do: function (s, A) { A.flag('omen'); A.conf(100); return 'Rájössz, hogy a stílus nem a koron múlik. A femboy-lét nem egy életszakasz, hanem az, ahogy a világot nézed.'; } }
            ]
        },

        // ===== Véletlen események: a kerete a játékos helyzete =====
        {
            id: 'r_note_good', mood: 'happy', art: 'street', weight: 3, once: false, cooldown: 6, minAge: 15,
            when: function (s, c) { return !c.d.secret && c.outfit.some(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'good'; }); }); },
            title: 'Valaki észrevesz',
            text: function (s, c) {
                var items = c.outfit.filter(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'good'; }); });
                var it = items[Math.floor(engine().rand() * items.length)];
                var notes = it.notes.filter(function (n) { return n.tone === 'good'; });
                return notes[Math.floor(engine().rand() * notes.length)].text;
            },
            choices: [
                { label: 'Megköszönöd', do: function (s, A) { A.conf(30); A.comm(1); return 'Mosolyogsz, megköszönöd, és egész nap ez a pillanat kísér.'; } },
                { label: 'Zavarba jössz', do: function (s, A) { A.conf(15); return 'Elpirulsz, és nem tudsz mit mondani, de belül ugrálsz.'; } }
            ]
        },
        {
            id: 'r_note_funny', art: 'street', weight: 2, once: false, cooldown: 6, minAge: 15,
            when: function (s, c) { return !c.d.secret && c.outfit.some(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'funny'; }); }); },
            title: 'Vicces pillanat',
            text: function (s, c) {
                var items = c.outfit.filter(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'funny'; }); });
                var it = items[Math.floor(engine().rand() * items.length)];
                var notes = it.notes.filter(function (n) { return n.tone === 'funny'; });
                return notes[Math.floor(engine().rand() * notes.length)].text;
            },
            choices: [
                { label: 'Együtt nevetsz', do: function (s, A) { A.conf(22); A.comm(1); return 'Jót nevettek rajta. Ennél jobb reggeli nincs is.'; } },
                { label: 'Elpirulsz', do: function (s, A) { A.conf(10); return 'Elpirulsz, de nem megy el a kedved.'; } }
            ]
        },
        {
            id: 'r_note_bad', mood: 'sad', art: 'street', weight: 2, once: false, cooldown: 8, minAge: 15,
            when: function (s, c) { return !c.d.secret && c.outfit.some(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'bad'; }); }); },
            title: 'Egy megjegyzés',
            text: function (s, c) {
                var items = c.outfit.filter(function (i) { return i.notes && i.notes.some(function (n) { return n.tone === 'bad'; }); });
                var it = items[Math.floor(engine().rand() * items.length)];
                var notes = it.notes.filter(function (n) { return n.tone === 'bad'; });
                return notes[Math.floor(engine().rand() * notes.length)].text;
            },
            choices: [
                { label: 'Visszaszólsz', tip: '120+ önbizalom kell a sikerhez', do: function (s, A) { if (s.conf >= 120) { A.conf(35); return 'Nyugodtan, mosolyogva válaszolsz. A másik elhallgat, majd zavartan elköszön.'; } A.conf(-15); return 'A válaszod nem úgy sül el, ahogy akartad. Elsietsz.'; } },
                { label: 'Nem reagálsz', do: function (s, A) { A.conf(4); return 'Nem foglalkozol vele. Tovább mész.'; } },
                { label: 'Elfordulsz', do: function (s, A) { A.conf(-8); return 'Elfordítod a fejed, és gyorsabban lépkedsz. Egész nap forog a fejedben.'; } }
            ]
        },
        {
            id: 'r_catears', art: 'street', weight: 2, once: false, cooldown: 12, minAge: 15,
            when: function (s, c) { return !c.d.secret && c.has('macskaful'); },
            title: 'Cicafül a villamoson',
            text: 'A villamoson egy kisfiú rád mutat: „Anya, ez cica!” Az anyukája zavartan mosolyog. A macskafülek ma különösen jól állnak.',
            choices: [
                { label: 'Miauzol egyet', do: function (s, A) { A.conf(35); A.comm(1); return 'A kisfiú felnevet, az anyukája is. A villamos fele ránk néz, és mosolyognak. Ez a nap rendben van.'; } },
                { label: 'Visszamosolyogsz', do: function (s, A) { A.conf(15); return 'Csendes mosoly, aztán a kisfiú integet. Elég ennyi.'; } }
            ]
        },
        {
            id: 'r_sew', art: 'room', weight: 2, once: false, cooldown: 14, minAge: 16,
            when: function (s) { return lvl(s, 'varras') >= 2; },
            title: 'Saját készítésű darab',
            text: 'A varrógéped mellett kiszabsz egy plisszírozott szoknyát. Estére kész, és pontosan úgy áll rajtad, ahogy elképzelted. A szerveren páran megkérdezik, árulnád-e.',
            choices: [
                { label: 'Eladod', tip: '+25 000 Ft', do: function (s, A) { A.money(25000); A.skill('varras', 20); A.comm(1); return 'Az első rendelésed a szerverről érkezik. Egy hét múlva nyugtát kapsz a postán: öt csillag.'; } },
                { label: 'Megtartod magadnak', do: function (s, A) { A.conf(40); return 'A saját szoknyád a legkedvesebb ruhád lesz. Minden öltésben benne vagy.'; } }
            ]
        },
        {
            id: 'r_gamenight', art: 'discord', weight: 2, once: false, cooldown: 10, minAge: 16,
            when: function (s) { return s.flags.discord && s.comp >= 3 && s.energy >= 30; },
            title: 'Közös játékest',
            text: function (s, c) { return 'A szerveren közös játékestet szerveznek. ' + c.az(c.pc) + ' gond nélkül futtatja, és egész este nevettek. Hajnalban jössz rá, hogy nem is vetted észre az időt.'; },
            choices: [
                { label: 'Végigjátszod az éjszakát', tip: '−30 energia', do: function (s, A) { A.energy(-30); A.comm(6); A.conf(30); return 'Fáradtan, de boldogan fekszel le. Ezek az esték különleges emlékek.'; } },
                { label: 'Fél órát maradsz', do: function (s, A) { A.comm(2); A.conf(10); return 'Fél óra játék, aztán lefekszel. A többiek holnap is itt lesznek.'; } }
            ]
        },
        {
            id: 'r_firststream', mood: 'shy', art: 'stage', weight: 4, minAge: 18,
            when: function (s) { return s.comp >= 4 && lvl(s, 'stream') >= 1; },
            title: 'Az első élő adás',
            text: function (s, c) { return 'Életedben először élőben streamelsz. ' + (c.outfit.length ? 'Rajtad: ' + c.outfitText + '.' : '') + ' A chatben tizenhat ember van, és mind kedves. A kezed remeg, a hangod mégis nyugodt.'; },
            choices: [
                { label: 'Végigviszed az adást', do: function (s, A) { A.flag('streamed'); A.comm(15); A.conf(80); A.money(10000); A.log('Az első élő adásod.'); return 'Két óra elteltével leállítod az adást. Valaki egy kis támogatást is küld: „Köszönöm, hogy itt vagy.”'; } },
                { label: 'Hamar abbahagyod', do: function (s, A) { A.conf(10); return 'Rövid adás, de kezdetnek jó. Legközelebb tovább bírod.'; } }
            ]
        },
        {
            id: 'r_cat', art: 'room', weight: 2, once: false, cooldown: 8, minAge: 18,
            when: function (s) { return !!s.pets.cica; },
            title: 'A cica a billentyűzeten',
            text: function (s, c) { return 'A cicád megint ' + c.az(c.pc) + ' billentyűzetén alszik. Közben kinyílik valami, amit nem akartál, és a levelezésed tele van ’wwwwww’-vel.'; },
            choices: [
                { label: 'Hagyod, hogy aludjon', do: function (s, A) { A.conf(15); A.energy(10); return 'Megsimogatod, és egy másik helyen dolgozol. A cica boldogan dorombol.'; } },
                { label: 'Odébb teszed', do: function (s, A) { A.energy(5); return 'Óvatosan odébb teszed. Gyorsan visszamászik.'; } }
            ]
        },
        {
            id: 'r_landlord', art: 'bills', weight: 2, once: false, cooldown: 14, minAge: 18,
            when: function (s) { return s.housing === 'szoba'; },
            title: 'A háziúr',
            text: function (s, c) { return 'A háziúr bejelentés nélkül jön a csapszerelés miatt. Az asztalodon éppen ' + c.az(c.pc) + ' fut, és a fogason a ruháid lógnak.'; },
            choices: [
                { label: 'Barátságosan beszélsz vele', do: function (s, A) { A.conf(10); return 'Bemutatod a lakást, és megiszol vele egy kávét. Kiderül, hogy a háziúr nagyon rendes ember.'; } },
                { label: 'Kérsz, hogy előre jelezzen', do: function (s, A) { A.conf(15); return 'Udvariasan, de határozottan szólsz. Megérti, és legközelebb telefonál.'; } }
            ]
        },
        {
            id: 'r_roommate', art: 'room', weight: 2, once: false, cooldown: 14, minAge: 18,
            when: function (s) { return s.housing === 'kolesz'; },
            title: 'A szobatárs',
            text: 'A szobatársad megkérdezi, hogy mit csinálsz esténként a gépnél, mert hallja a nevetésedet. Barátságos kíváncsi.',
            choices: [
                { label: 'Elmondod, mi a helyzet', do: function (s, A) { A.conf(30); A.comm(2); return 'Vállat von: „Szerintem nagyon jó. Mutatod a ruháidat is?” A kollégium hirtelen sokkal otthonosabb.'; } },
                { label: 'Csak a headsetet felteszed', do: function (s, A) { A.conf(3); return 'Egyelőre nem. A szobatárs értelmes ember, nem erőlteti.'; } }
            ]
        },
        {
            id: 'r_neighbor', art: 'bills', weight: 2, once: false, cooldown: 14, minAge: 20,
            when: function (s) { return s.housing === 'garzon' && s.comp >= 3; },
            title: 'A vékony falak',
            text: function (s, c) { return 'A szomszéd éjszaka kopog: tíz után túl hangos ' + c.az(c.pc) + ' és a headset. Nem rossz szándékú, csak fáradt.'; },
            choices: [
                { label: 'Süteménnyel kérsz bocsánatot', tip: '3 000 Ft', req: function (s) { return s.money >= 3000; }, reqText: 'Kell hozzá 3 000 Ft', do: function (s, A) { A.money(-3000); A.comm(1); A.conf(10); return 'A szomszéd mosolyog: „Nem is volt baj, csak kérni akartam, hogy halkabban.”'; } },
                { label: 'Halkítasz', do: function (s, A) { A.conf(3); return 'Halkabban csinálsz mindent. A szomszéd is békében alszik.'; } }
            ]
        },
        {
            id: 'r_housewarming', art: 'room', weight: 3, minAge: 22,
            when: function (s) { return s.housing === 'lakas'; },
            title: 'Lakásavató',
            text: 'A saját lakásodban végre rendezhetsz egy bulit. A szerveren páran már jeleztek, hogy szívesen eljönnének.',
            choices: [
                { label: 'Meghívod a szerver tagjait', tip: '20 000 Ft', req: function (s) { return s.money >= 20000 && s.flags.discord; }, reqText: 'Kell hozzá 20 000 Ft és Discord-tagság', do: function (s, A) { A.money(-20000); A.comm(12); A.conf(60); return 'Tizenöten zsúfolódtok össze, és hajnalig nevettek. Valaki hozott egy tortát, a tetején kis macskafülekkel.'; } },
                { label: 'Csak a legjobb barátaid', tip: '5 000 Ft', req: function (s) { return s.money >= 5000; }, reqText: 'Kell hozzá 5 000 Ft', do: function (s, A) { A.money(-5000); A.conf(30); A.comm(2); return 'Egy intim este pár baráttal. Mindenki marad, és hajnalig beszélgettek.'; } },
                { label: 'Csak egy csendes tea az új otthonban', tip: 'ingyen', do: function (s, A) { A.conf(12); return 'Nincs buli, nincs tömeg, csak te, egy bögre tea és az első saját estéd. Pont ennyi kellett.'; } }
            ]
        },
        {
            id: 'r_jobday', art: 'office', weight: 2, once: false, cooldown: 6, minAge: 16,
            when: function (s) { return !!s.job; },
            title: function (s, c) { return 'Egy átlagos nap: ' + c.job; },
            text: function (s, c) { var notes = c.jobObj.notes; return notes[Math.floor(engine().rand() * notes.length)]; },
            choices: [{ label: 'Büszke vagy magadra', do: function (s, A) { A.conf(15); if (s.jobMonths >= 3 && s.jobMonths % 3 === 0) { A.money(Math.round(s.job ? D.find(D.JOBS, s.job).pay * 0.1 : 0)); return 'A hónap végén egy kis jutalmat is kapsz.'; } return 'Jó érzés, hogy van tétje annak, amit csinálsz.'; } }]
        },
        {
            id: 'r_laptop_dies', mood: 'surprised', art: 'room', weight: 3, minAge: 17,
            when: function (s) { return s.comp >= 1; },
            title: 'Meghalt a gép',
            text: function (s, c) { return 'Egyik este ' + c.az(c.pc) + ' hirtelen elsötétedik és nem indul újra. A szíved nagyot ugrik: ott van rajta minden, amin dolgozol.'; },
            choices: [
                { label: 'Megjavíttatod', tip: 'A javítás ára a gép árától függ', req: function (s) { return s.money >= engine().repairCost(s); }, reqText: 'Kell hozzá a javítás ára', do: function (s, A) { A.money(-engine().repairCost(s)); A.fixComputer(); return 'A szerelő elmosolyodik: „A tápegység volt.” Két nap múlva a gép újra úgy működik, mint régen.'; } },
                { label: 'Kivárod, amíg összegyűlik a pénz', tip: '3 hónapig tanulás és online bónusz nélkül', do: function (s, A) { A.broken(3); A.conf(-10); return 'Három hónapon át a telefonnal próbálkozol. Nem könnyű, de kitartasz.'; } }
            ]
        },
        {
            id: 'r_kind', art: 'discord', weight: 2, once: false, cooldown: 8, minAge: 16,
            when: function (s) { return s.flags.discord; },
            title: 'Kedves komment',
            text: 'Valaki az egyik posztod alá azt írja, hogy a stílusod az egyik legjobb, amit az utóbbi időben látott. Nem is ismered.',
            choices: [{ label: 'Elmosolyodsz', do: function (s, A) { A.conf(30 + Math.floor(A.rand() * 30)); A.comm(1); return 'Százszor is elolvasod, és egész nap ezen jár az eszed.'; } }]
        },
        {
            id: 'r_coffee', art: 'room', weight: 1, once: false, cooldown: 12, minAge: 17,
            when: function (s) { return s.comp >= 1; },
            title: 'A kávé és a billentyűzet',
            text: function (s, c) { return 'A kávé ráömlik ' + c.az(c.pc) + ' billentyűzetére. Ijedten törölgeted, és a végén az egész asztalt újra kell rendezned.'; },
            choices: [
                { label: 'Tisztítószert veszel', tip: '3 000 Ft', req: function (s) { return s.money >= 3000; }, reqText: 'Kell hozzá 3 000 Ft', do: function (s, A) { A.money(-3000); return 'A tisztítószer segít. A billentyűzet megmenekült.'; } },
                { label: 'Átvészeled úgy', do: function (s, A) { A.energy(-15); A.conf(-3); return 'Pár billentyű ragad. Később mindenki az ujjának ragadó betűit kiszúrja a chatben.'; } }
            ]
        },
        {
            id: 'r_sale', mood: 'happy', art: 'shop', weight: 2, once: false, cooldown: 12, minAge: 14,
            title: 'Akció a webshopban',
            text: 'A kedvenc ruhaboltod egy hétre 20% kedvezményt hirdet mindenre. Pont most jó alkalom lenne bevásárolni.',
            choices: [{ label: 'Kihasználod', tip: 'A következő hónapban 20% kedvezmény', do: function (s, A) { A.sale(1); return 'A következő hónapban minden ruha és dekoráció 20%-kal olcsóbb.'; } }]
        },
        {
            id: 'r_flu', mood: 'sleepy', art: 'room', weight: 1, once: false, cooldown: 14, minAge: 14,
            title: 'Megfáztál',
            text: 'Reggel torokfájással ébredsz. Egész nap takaró alatt fekszel, és a laptopon sorozatot nézel.',
            choices: [{ label: 'Pihensz', do: function (s, A) { A.energy(-50); A.conf(-3); return 'Két napig nem megy semmi. Utána újra rendben leszel.'; } }]
        },
        {
            id: 'r_cringe', mood: 'shy', art: 'phone', weight: 1, once: false, cooldown: 12, minAge: 15,
            title: 'Cringe emlék',
            text: 'Éjjel eszedbe jut egy régi, kínos pillanat. Az agyad elhatározza, hogy most van itt az ideje, hogy mindent újra átélj.',
            choices: [
                { label: 'Röhögsz rajta', do: function (s, A) { A.conf(5); return 'Hangosan felnevetsz, és az emlék mindjárt kevésbé fáj.'; } },
                { label: 'Befordulsz a falnak', do: function (s, A) { A.conf(-8); return 'Hajnalig forgolódsz, és csak reggelre jön el az álom.'; } }
            ]
        },
        {
            id: 'r_bonus', art: 'office', weight: 2, once: false, cooldown: 12, minAge: 18,
            when: function (s) { return !!s.job; },
            title: 'Meglepetés-bónusz',
            text: function (s, c) { return 'A cég (' + c.job + ') váratlan bónuszt fizet a csapatnak. A főnök hozzáteszi, hogy ez különösen a te munkád miatt volt.'; },
            choices: [{ label: 'Elteszed', do: function (s, A) { A.money(Math.round(D.find(D.JOBS, s.job).pay * 0.25)); A.conf(20); return 'Életed egyik legjobb mondata: „Jó munkát végeztél.”'; } }]
        },
        {
            id: 'r_rent', art: 'bills', weight: 1, once: false, cooldown: 24, minAge: 18,
            when: function (s) { return s.housing !== 'szulo' && s.rentBump < 0.3; },
            title: 'Rezsiemelés',
            text: 'A szolgáltató levelet küld: a rezsi 5%-kal emelkedik. Nem sok, de a költségvetésen tisztán érezni.',
            choices: [{ label: 'Tudomásul veszed', do: function (s, A) { A.rentBump(0.05); return 'Újraszámolod a költségvetést. Marad a takarékosság.'; } }]
        },
        {
            id: 'r_friend', art: 'discord', weight: 2, once: false, cooldown: 8, minAge: 17,
            when: function (s) { return s.flags.discord; },
            title: 'Online barát',
            text: 'Egy online barátod meghív egy közös programra: filmnézés a szerveren, popcorn, nevetés. Nincs miért elmaradni.',
            choices: [{ label: 'Elmész', do: function (s, A) { A.comm(3); A.conf(15); return 'Fantasztikus este. A film közepén már mindenki a saját poénjait nevette.'; } }]
        },
        {
            id: 'r_street', art: 'street', weight: 2, once: false, cooldown: 12, minAge: 17,
            when: function (s) { return !!s.steps.utca; },
            title: 'Idegen dicséret',
            text: 'Az utcán egy idegen megáll melletted: „Elnézést, csak szeretném mondani, hogy nagyon jól nézel ki.” Mielőtt válaszolnál, már tovább is megy.',
            choices: [{ label: 'Elmosolyodsz', do: function (s, A) { A.conf(40); return 'Percekig ott állsz és mosolyogsz. Az egész utca egy kicsit szebb lett.'; } }]
        },
        {
            id: 'r_bday', art: 'room', weight: 2, once: false, cooldown: 12, minAge: 14, maxAge: 18,
            title: 'Szülinapi pénz',
            text: 'A nagyszüleid szülinapi borítékot küldenek. Valamennyi pénz, egy bájos kártya és egy üzenet: „Vigyázz magadra, kedvesem.”',
            choices: [{ label: 'Megköszönöd', do: function (s, A) { A.money(10000 + Math.floor(A.rand() * 10000)); A.conf(10); return 'Boldogan megköszönöd. A pénzt biztos helyre teszed.'; } }]
        },

        // ===== Kaszinó-események =====
        {
            id: 'g_bigwin', art: 'casino', trigger: function (s) { return s.gamble.bigWin; },
            title: 'Nagy nyeremény',
            text: function (s) { return 'A gép felvillan, és kiírja: ' + fmt(s.gamble.lastPayout) + '. Egy pillanatra nem hiszel a szemednek. A fejed tele van tervekkel, de közben csendesen megszólal egy hang: „Ugye tudod, hogy ez a ház nyereménye volt, nem a kézé?”'; },
            choices: [
                { label: 'Elteszed a nyereményt', do: function (s, A) { A.flag('sensible'); A.conf(30); A.urge(-5); s.gamble.bigWin = false; return 'Zsebre vágod a nyereményt, és kilépsz. Ritkán sikerül ilyet megtenni.'; } },
                { label: 'Visszaforgatod', do: function (s, A) { A.flag('chaser'); A.conf(5); A.urge(12); s.gamble.bigWin = false; return 'A következő kör mindig csábít. Érdemes figyelni a keretre.'; } }
            ]
        },
        {
            id: 'g_friend', art: 'discord', trigger: function (s, c) { return s.gamble.urge >= 55 && c.netLoss >= 60000; }, once: false, cooldown: 24,
            title: 'Egy barát aggódik',
            text: function (s, c) { return 'Egy barátod óvatosan megkérdezi: „Észrevettem, hogy mostanában sokat játszol. Eddig összesen ' + fmt(c.netLoss) + ' ment el. Minden rendben?” A szavai a kelleténél jobban fájnak, mert igaza van.'; },
            choices: [
                { label: 'Meghallgatod', do: function (s, A) { A.urge(-25); A.conf(20); A.comm(1); return 'Őszintén beszélgettek. Megígéred, hogy visszafogod magad, és ő megígéri, hogy rákérdez majd.'; } },
                { label: 'Elütöd a témát', do: function (s, A) { A.urge(4); A.conf(-10); return 'Nevetve legyintesz, de este ott marad a gyomrodban a szorítás.'; } },
                { label: 'Önkizárást kérsz fél évre', tip: 'A kaszinó 6 hónapra zárva', do: function (s) { engine().selfExclude(s); return 'Beírod a kérelmet. Elsőre furcsa, aztán megkönnyebbülsz. Büszke vagy arra, hogy megálltál.'; } }
            ]
        },
        {
            id: 'g_ruin', art: 'bills', trigger: function (s, c) { return c.netLoss >= 300000 && s.gamble.plays >= 10; }, once: false, cooldown: 36,
            title: 'Mélypont',
            text: function (s, c) { return 'Összeadod, mennyit hagytál a kaszinóban: ' + fmt(c.netLoss) + '. Ez több, mint amit gondoltál, és ennyiből ' + (c.d.housing.rent > 0 ? 'hónapokig kifizetnéd a lakbért.' : 'sokat vehettél volna magadnak.') + ' Ideje megállni.'; },
            choices: [
                { label: 'Segítséget kérsz a közösségtől', tip: 'Legalább 25 közösségi pont kell', req: function (s) { return s.comm >= 25; }, reqText: 'Legalább 25 közösségi pont kell', do: function (s, A) { A.money(80000); A.urge(-40); A.conf(10); A.comm(2); engine().selfExclude(s); return 'A barátaid nem ítélkeznek, hanem összedobnak, és megegyeztek, hogy jövőre rendesen megvitatjátok a költségvetést. Közben önkizárást is kérsz.'; } },
                { label: 'Önkizárást kérsz és spórolsz', do: function (s, A) { A.conf(-10); engine().selfExclude(s); return 'Egy hétig nem alszol jól, aztán kicsit megkönnyebbülsz. A kaszinó zárva marad fél évre.'; } },
                { label: 'Egyedül oldod meg', do: function (s, A) { A.conf(-30); A.urge(-15); return 'A büszkeséged megakadályoz, hogy kérj. Tovább mész, és elhatározod, hogy sosem jársz így.'; } }
            ]
        },
        {
            id: 'g_return', art: 'casino', trigger: function (s) { return s.flags.selfExcluded && s.gamble.lockUntil >= 0 && s.gamble.lockUntil < s.month; },
            title: 'Letelt a fél év',
            text: 'Az önkizárás lejárt. A kaszinó újra elérhető, és egy kósza hirdetés is üzenetet küld: „Hiányoztál!” Tudod, hogy most már te döntesz.',
            choices: [
                { label: 'Büszke vagy magadra', do: function (s, A) { A.flag('proud'); A.conf(40); A.urge(-10); return 'Úgy döntesz, hogy nem lépsz be. A mai nap még egy győzelem.'; } },
                { label: 'Újra kipróbálnád', do: function (s, A) { A.urge(10); return 'Belépsz, de óvatosabban. A keretet előre beállítottad.'; } }
            ]
        }
    ];

    Ev.find = function (id) {
        for (var i = 0; i < Ev.EVENTS.length; i++) if (Ev.EVENTS[i].id === id) return Ev.EVENTS[i];
        return null;
    };

    // ---------------------------------------------------------
    // Eredmények
    // ---------------------------------------------------------
    function maxSkill(s) { var m = 0; for (var k in s.skills) m = Math.max(m, s.skills[k]); return m; }
    Ev.ACHIEVEMENTS = [
        { id: 'tukor100', name: 'Tükör-barát', desc: '100 tükörkattintás', check: function (s) { return s.stats.clicks >= 100; } },
        { id: 'tukor1000', name: 'Tükör-függő', desc: '1000 tükörkattintás', check: function (s) { return s.stats.clicks >= 1000; } },
        { id: 'elso_ruha', name: 'Az első darab', desc: 'Veszel egy ruhadarabot', check: function (s) { return Object.keys(s.items).length >= 1; } },
        { id: 'kombo3', name: 'Kombó-vadász', desc: '3 kombó egyszerre aktív', check: function (s) { return engine().stats(s).combos.filter(function (c) { return c.active; }).length >= 3; } },
        { id: 'stilusrang', name: 'Pasztell főcica', desc: 'Stílus-rang: Pasztell főcica vagy magasabb', check: function (s) { return engine().stats(s).rankIndex >= 4; } },
        { id: 'sajatszin', name: 'Saját szín', desc: 'Átfested egy ruhadarabot', check: function (s) { return Object.keys(s.colors || {}).length >= 1; } },
        { id: 'teljes', name: 'Teljes szett', desc: 'Mind a ' + D.SLOTS.length + ' helyen van tárgy', check: function (s) { return D.SLOTS.every(function (sl) { return s.equipped[sl.id]; }); } },
        { id: 'discord', name: 'Hazataláltál', desc: 'Csatlakozol a Discord-szerverhez', check: function (s) { return !!s.flags.discord; } },
        { id: 'con', name: 'Első con', desc: 'Eljutsz egy conra', check: function (s) { return s.stats.cons >= 1; } },
        { id: 'con5', name: 'Con-veterán', desc: '5 con', check: function (s) { return s.stats.cons >= 5; } },
        { id: 'koltozes', name: 'Saját kulcs', desc: 'Elköltözöl otthonról', check: function (s) { return !!s.flags.moved; } },
        { id: 'fizetes', name: 'Első fizetés', desc: 'Egy hónapot dolgozol egy állásban', check: function (s) { return !!s.job && s.jobMonths >= 1; } },
        { id: 'szorgalmas', name: 'Szorgalmas', desc: 'Egy képesség 3. szint', check: function (s) { return maxSkill(s) >= 3; } },
        { id: 'mester', name: 'Mester', desc: 'Egy képesség 5. szint', check: function (s) { return maxSkill(s) >= 5; } },
        { id: 'gamer', name: 'Gamer', desc: 'Gamer PC vagy jobb', check: function (s) { return s.comp >= 3; } },
        { id: 'studio', name: 'Stúdió', desc: 'Stream-stúdió vagy jobb', check: function (s) { return s.comp >= 5; } },
        { id: 'milliomos', name: 'Milliomos', desc: '1 000 000 Ft egyszerre', check: function (s) { return s.money >= 1000000; } },
        { id: 'rejtozkodo', name: 'Rejtőzködő profi', desc: '18 évesen is lebukás nélkül', check: function (s) { return s.month >= 48 && !s.flags.caught; } },
        { id: 'aldas', name: 'Szülői áldás', desc: 'A szüleid elfogadnak', check: function (s) { return s.parents === 'accepting'; } },
        { id: 'mentor', name: 'Mentor', desc: 'Segítesz egy fiatalnak', check: function (s) { return !!s.flags.mentor; } },
        { id: 'sztar', name: 'Színpadi pillanat', desc: 'Előadsz egy con-panelen', check: function (s) { return !!s.flags.stage; } },
        { id: 'szerencse', name: 'Szerencse-csillag', desc: 'Nagy nyeremény a kaszinóban', check: function (s) { return !!s.flags.sensible || !!s.flags.chaser; } },
        { id: 'megallj', name: 'Megállj-t mondtál', desc: 'Önkizárást kérsz a kaszinóból', check: function (s) { return !!s.flags.selfExcluded; } },
        { id: 'tiszta', name: 'Tiszta lap', desc: 'A végéig nem játszol a kaszinóban', check: function (s) { return !!s.ending && s.gamble.plays === 0; } },
        { id: 'baratok', name: 'Barátok', desc: 'Egy barátnál 50 kötelék', check: function (s) { return D.PEOPLE.some(function (p) { return engine().bond(s, p.id) >= 50; }); } },
        { id: 'kor', name: 'Mindenkit ismersz', desc: 'Mind a 6 ismerőst megismered', check: function (s) { return D.PEOPLE.every(function (p) { return s.social.known && s.social.known[p.id]; }); } },
        { id: 'sminkes', name: 'Sminkes', desc: 'Felteszel egy sminkelemet', check: function (s) { return engine().lookCount(s) >= 1; } },
        { id: 'teljesarc', name: 'Teljes arc', desc: 'Minden arcsmink-helyen van termék', check: function (s) { return D.FULL_LOOK_SLOTS.every(function (sl) { return engine().lookApplied(s)[sl]; }); } },
        { id: 'manikur', name: 'Manikűr', desc: 'Körömlakk vagy körömdísz van rajtad', check: function (s) { return !!engine().lookApplied(s).nails; } },
        { id: 'kozmetikus', name: 'Kozmetikus', desc: 'Smink képesség 3. szint', check: function (s) { return lvl(s, 'smink') >= 3; } },
        { id: 'parom', name: 'Pár', desc: 'Együtt vagy valakivel', check: function (s) { return !!s.flags.partner; } },
        { id: 'halal', name: 'Femboy Death', desc: 'Eléred a huszonötödik születésnapot', check: function (s) { return !!s.ending; } }
    ];

    // ---------------------------------------------------------
    // Befejezések
    // ---------------------------------------------------------
    var TEXT_COMMON = function (s, c) {
        return 'A huszonötödik születésnapodon felébredsz. A közösségben mindenki azt ígérte, hogy ma jön a híres femboy death. Egy kis feszültséggel tekintesz a tükörbe, de ugyanaz a ' + c.name + ' néz vissza rád, csak sokkal nyugodtabban. Kiderül, hogy a femboy death nem halál, hanem az az időpont, amikor már semmit nem kell bizonygatnod.';
    };

    Ev.ENDINGS = [
        {
            id: 'legenda', title: 'A Legenda', art: 'stage',
            score: function (s) { return s.comm / 200; },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' A szerveren a születésnapodra külön csatornát nyitnak, a témája: „F a femboy-korszaknak”. Százak írnak üzenetet, és mindegyikben ugyanaz van: hogy mennyit segítettél. A ruháid, a gépeid, a lakásod mind csak díszletek. A valódi hagyatékod a közösség, amit építettél.'; }
        },
        {
            id: 'karrier', title: 'A Pasztell Karrierista', art: 'office',
            score: function (s, d) { return d.income.total / 600000; },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' A munkahelyeden mindenki tudja, ki vagy, és senki nem zavartatja magát miatta. A havi fizetésed lassan eléri az álmodat, és a lakásod is a tiéd. A kollégák ajándékot adnak, rajta egy macskafüles bögre. Így is lehet karriert csinálni: nyíltan, nyugodtan és pasztellben.'; }
        },
        {
            id: 'alkoto', title: 'Az Alkotó', art: 'room',
            score: function (s) { return (lvl(s, 'rajz') + lvl(s, 'varras') + lvl(s, 'stream')) / 9; },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' A rajzaidat ismerik, a jelmezeidet idézik, és a streamedre vannak, akik minden este becsengetnek. Már nem azt kérdezik, hogy „mi ez?”, hanem azt, hogy „mikor jön a következő?”. Az asztalodon egy félig kész jelmez, mellette egy új vázlat. A femboy death nálad egyszerűen a következő projekt kezdete.'; }
        },
        {
            id: 'otthon', title: 'A Csendes Otthon', art: 'cafe',
            score: function (s, d) { return (s.flags.partner ? 0.55 : 0) + (d.housing.comfort / 4) * 0.5 + (s.parents === 'accepting' ? 0.1 : 0); },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' A születésnapodra nem nagy buli készül, hanem egy közös vacsora, amit valaki neked főzött. A lakás (' + c.home + ') meleg, a falon közös fotók lógnak. Valaki a vállad mellett halkan azt mondja: „Boldog születésnapot.” Kiderül, hogy a legjobb befejezés néha a legcsendesebb.'; }
        },
        {
            id: 'gyokerek', title: 'Hazatérés', art: 'family',
            score: function (s) { return s.housing === 'szulo' && s.parents === 'accepting' ? 1.2 : 0; },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' A szüleid asztalánál ülsz, és anya tortát hoz, rajta gyertyákkal. Apa megkérdezi, hogy melyik pulcsit viszed legközelebb a nagymamához. Az otthon, ahol elkezdődött, ma már nem titok: ez az a hely, ahol a legszabadabb vagy.'; }
        },
        {
            id: 'csendes', title: 'A Nyugodt Út', art: 'sunset', fallback: true,
            score: function () { return 1; },
            text: function (s, c) { return TEXT_COMMON(s, c) + ' Nem lettél híres, nem lettél gazdag, de olyan vagy, amilyen lenni szerettél. A kis rituálék, a lakás (' + c.home + '), a ruhák és a pár jó barát elég. Az élet nem mindig nagy dolgokról szól: néha csak arról, hogy egy kedves reggelen tükörbe nézel, és mosolyogsz.'; }
        }
    ];
    Ev.findEnding = function (id) { for (var i = 0; i < Ev.ENDINGS.length; i++) if (Ev.ENDINGS[i].id === id) return Ev.ENDINGS[i]; return null; };

    // A végső képernyő adatai: cím, szöveg, epilógus (a helyzethez igazodó sorok), statisztikák
    Ev.endingView = function (s, c, d) {
        var en = Ev.findEnding(s.ending.id);
        var ep = [];
        if (c.outfit.length) ep.push('A ruhatárad csúcsdarabjai: ' + c.outfitText + '.');
        else if (c.ownedText) ep.push('A szekrényed tele van emlékekkel: ' + c.ownedText + '.');
        ep.push('A munkaeszközöd: ' + c.pc + '.');
        ep.push('Otthon: ' + c.home + '.');
        if (c.job) ep.push('Állás: ' + c.job + '.');
        if (s.flags.partner) ep.push('Valaki mindig ott van mellettetek, aki egy kávéval kezdte.');
        if (s.flags.mentor) ep.push('Egy fiatal minden alkalommal megköszöni, hogy segítettél neki.');
        if (s.parents === 'accepting') ep.push('A szüleid elfogadnak, és büszkék rád.');
        else if (s.parents === 'tense') ep.push('A szüleiddel a kapcsolat még formálódik, de elkezdődött a beszélgetés.');
        if (s.stats.cons > 0) ep.push(s.stats.cons + ' con áll mögötted.');
        if (s.gamble.plays > 0) {
            var net = s.gamble.paid - s.gamble.wagered;
            ep.push('A kaszinóban ' + fmt(s.gamble.wagered) + ' ment át a kezeden, a mérleg: ' + (net >= 0 ? '+' : '−') + fmt(Math.abs(net)) + '.' + (s.flags.selfExcluded ? ' Időben megálltál.' : '') + (net < -300000 ? ' Ebből sokat tanultál.' : ''));
        } else ep.push('A kaszinóba be sem léptél, és a pénzed ott maradt, ahol a helye van.');
        return {
            id: en.id, title: en.title, art: en.art, text: en.text(s, c), epilogue: ep,
            stats: [
                ['Önbizalom', Math.floor(s.conf)],
                ['Közösség', Math.floor(s.comm)],
                ['Pénz', fmt(s.money)],
                ['Havi bevétel', fmt(d.income.total)],
                ['Legjobb képesség', maxSkill(s) + '. szint'],
                ['Eredmények', Object.keys(s.ach).length + '/' + Ev.ACHIEVEMENTS.length]
            ]
        };
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = Ev;
})(typeof globalThis !== 'undefined' ? globalThis : this);
