# femboy.hu

Ezen a repón található a femboy.hu weboldal teljes forráskódja (Cloudflare Worker + statikus oldalak).

## Felépítés

| Hely | Mi van benne |
|---|---|
| `public/` | A statikus oldal (HTML, CSS, JS, képek, adatfájlok) |
| `src/index.js` | A Worker: `/api/reddit` (galéria-adat) és `/api/reddit/ingest` (Devvit-fogadás) |
| `devvit/` | A Reddit-on futó Devvit-app: posztok → Worker, új posztok → Discord-kártya (lásd `devvit/README.md`) |
| `public/theme.js`, `themes.css` | Téma: világos / sötét / **buzi mód** (szivárvány + UwU szövegmód) |
| `public/eletut*` | A Pasztell Életút kattintgatós életjáték (adat, események, motor, grafika, felület) |
| `public/data/reddit_backup.json` | A galéria Reddit-archívuma (NSFW posztok automatikusan kiszűrve) |
| `public/data/hidden_posts.json` | Kézi tiltólista: ide írt poszt-azonosítók sosem jelennek meg |
| `docs/DEVVIT.md` | A Devvit-app és a Worker közti szerződés |

## Fejlesztés

```bash
npx wrangler dev      # helyi futtatás
npx wrangler deploy   # éles feltöltés
node --test "test/eletut-*.test.js"   # a Pasztell Életút tesztjei (szabályok, kaszinó, grafika, teljes játékmenetek)
```

## Témák

A jobb felső menüben a 🌙 gombbal váltható: világos → sötét → buzi mód. A választás a böngészőben marad meg
(`localStorage`), első látogatáskor a rendszer beállítását követi. A lábléc „UwU" gombja a buzi módot kapcsolja.
