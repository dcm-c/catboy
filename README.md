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
| `public/ertektest*` | Humoros értékrend-teszt magyar ügyekkel (`-data.js`: állítások, típusok; `-core.js`: tiszta, tesztelt pontozás és kódolás; `.js`/`.css`: felület). Négy mód: gyors (40 állítás + 10 pár + 8 tükörpár), részletes (60 értékállítás + 36 utált-érték állítás: 10 utált érték, 8 előítélet-skála, őszinteség-vizsgáló) és csak az utált értékek rövid/hosszú változata; `?dev` vagy a bevezető jelölőnégyzete fejlesztői módot ad (kérdésenkénti hatás). Az eredmény a `#r=` linkrészben utazik (v1/v2), nem mentünk semmit |
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
