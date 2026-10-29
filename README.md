# femboy.hu

Ezen a repón található a femboy.hu weboldal teljes forráskódja (Cloudflare Worker + statikus oldalak).

## Felépítés

| Hely | Mi van benne |
|---|---|
| `public/` | A statikus oldal (HTML, CSS, JS, képek, adatfájlok) |
| `src/index.js` | A Worker: `/api/reddit` (galéria-adat) és `/api/reddit/ingest` (Devvit-fogadás) |
| `devvit/` | A Reddit-on futó Devvit-app: posztok → Worker, új posztok → Discord-kártya (lásd `devvit/README.md`) |
| `public/theme.js`, `themes.css`, `uwu.js` | Téma: világos / sötét / **buzi mód** (szivárvány + UwU szövegmód; a buzi módot csak a lábléc UwU gombja kapcsolja). Az UwU-átalakítás (`uwu.js`) tiszta, tesztelt függvény |
| `public/privacy-gate.js`, `faq.js` | Űrlapkapu (a küldés előtt el kell olvasni az adatkezelési tájékoztatót) és a GYIK-hivatkozások kinyitása |
| `public/eletut*` | A Pasztell Életút kattintgatós életjáték (adat, események, motor, grafika, felület). A befejezés megosztási linkje az eredményt JSON-ként a `#r=` részben viszi |
| `public/ertektest*` | Humoros értékrend-teszt magyar ügyekkel, **10 tengelyen** (gazdaság, társadalom, hatalom, haza, biztonság, környezet, értékek, kötelék, bizalom, világlátás) és 20 tréfás típussal. Fájlok: `-items.js` (a kérdések), `-data.js` (tengelyek, típusok, listák módonként, ikerpárok, megbízhatósági sávok), `-core.js` (tiszta, tesztelt pontozás, megbízhatóság és kódolás), `ertektest-img.js` (kategóriánkénti megosztható kép, canvas), `-legacy.js` (a régi 5 tengelyes verziók definíciói: **nem módosítható**, a régi linkek ettől függnek), `.js`/`.css` (felület). Módok: gyors (50 értékállítás), részletes (100), extra hosszú (150): a hosszabb mód a rövidebb tételeit is tartalmazza (tengelyenként 5/10/15 elsődleges tétel, ellentmondás-próba párokkal). Mindegyikben vannak **rangsorolós feladatok** (1/3/5; 5 lehetőséget kell sorba állítani, a helyezésből +2…−2 válasz lesz), **fontosnak jelölhető kérdések** (csillag: gyors 1, részletes 2, extra hosszú 3; a jelölt állítás kétszeres súllyal számít, a jelölés nem kerül a linkbe) és **ellenőrző kérdések** (2/5/7), amelyek közt van olyan, ahol az „igen” a gyanús (lehetetlen „soha/mindig” állítás), és olyan, ahol a „nem” (szinte mindenkivel megtörtént hétköznapi tény: `expect: 'yes'`). Az **utált értékek és az előítélet-barométer opcionális B rész** (18 utált érték és 4 előítélet-téma; részletesben 78, extra hosszúban 104 állítás, fordított, összehasonlító és helyzetfüggő tételekkel; a gyors módban 10 kör a klasszikus tíz értékből + 8 tükörpár), önállóan is kitölthető, és az eredményoldalról is folytatható. Minden eredményhez **megbízhatósági mutató** tartozik (0–100, sávok: megbízható / többnyire megbízható / bizonytalan / nem megbízható; jelzi az ellentmondó párokat, a lehetetlen állításokat, a sok semleges vagy kihagyott választ, az egyöntetű kitöltést, a kevésbé biztos tengelyeket és a két típus közti döntetlent). Kategóriánként (értékrend-térkép, utált értékek, előítélet-barométer, megbízhatóság) 1080×1350-es kép készül, letölthető és Web Share API-val megosztható. A bevezető iránytűjére gyorsan 7-et kattintva rejtett fejlesztői mód kapcsol be (kérdésenkénti hatás). Az eredmény a `#r=` linkrészben utazik tömör bináris formátumban, nem mentünk semmit. **Téma-réteg:** az `ertektest-items.js` `THEME` objektuma (id → `text` / `help` / `joke`) adja a femboyosabb szövegeket és a poénokat; az `ertektest-data.js` az összeállítás végén írja rá a tételekre (az azonosítók, szintek és súlyok nem változnak, így a pontozás és a linkek sem; az ikerpárok szövege marad). Minden értékkérdéshez, rangsorfeladathoz és utált-érték tételhez tartozik poén (tesztelt). **Teszt-verzió:** az `ertektest-data.js` `VERSION` értéke (és a `VERSIONS` változásnapló) a link fejlécének felső 4 bitjében utazik (jelenleg 4). Ha a tengelyek, típusok vagy utált értékek változnak, a régi készletet a `ertektest-legacy.js`-be kell menteni, és a `VERSION`-t növelni kell, hogy a korábban megosztott (v1/v2, 5 tengelyes) linkek a régi nevekkel, „régebbi tesztverzió” jelzéssel jelenjenek meg. A v3 linkek (10 utált érték) a `LEGACY[3]` készlettel olvashatók (a link hossza a verzió szerinti skálaszámból ellenőrzött), a régi JSON linkek 1-es verziónak számítanak. |
| `public/data/reddit_backup.json` | A galéria Reddit-archívuma (NSFW posztok automatikusan kiszűrve) |
| `public/data/hidden_posts.json` | Kézi tiltólista: ide írt poszt-azonosítók sosem jelennek meg |
| `docs/DEVVIT.md` | A Devvit-app és a Worker közti szerződés |

## Fejlesztés

```bash
npx wrangler dev      # helyi futtatás
npx wrangler deploy   # éles feltöltés
node --test "test/*.test.js"          # minden teszt: Életút (szabályok, kaszinó, grafika, események képei, játékmenetek), UwU-átalakító, oldalszerkezet
```

## Témák

A jobb felső menüben a 🌙 gombbal váltható: világos → sötét → buzi mód. A választás a böngészőben marad meg
(`localStorage`), első látogatáskor a rendszer beállítását követi. A lábléc „UwU" gombja a buzi módot kapcsolja.
