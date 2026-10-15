# Reddit-képek a galériában: a Devvit-fogadás

## Miért Devvit?

2026-ban a Reddit a nyilvános lekéréseket (`.json`, szerverről érkező RSS) blokkolja, új API-kulcsot pedig
nem ad önkiszolgálóan. Ezért az oldal **nem kérdezi le a Redditet**. Helyette a subredditen futó
**Devvit-app** *küldi be* a posztokat a Workernek.

A Devvit-app kódja a [`devvit/`](../devvit/README.md) mappában van (telepítés, titkok, Discord: ott). Amíg nincs
feltöltve és telepítve, a galéria a `public/data/reddit_backup.json` archívumot használja.

> **Fontos:** a Devvit-app a **Reddit platformján** fut, nem Cloudflare-en (a Devvit nem hosztolható máshol).
> A Cloudflare-oldal a Worker, ami fogadja és kiszolgálja az adatot. Ez a kettő együtt adja a megoldást.

## Adatfolyam

```
Reddit (r/MagyarFemboyCommunity)
   └─ Devvit-app (triggerek: új poszt, szerkesztés, törlés, moderátori művelet)
        └─ HTTPS POST  →  https://femboy.hu/api/reddit/ingest   (Bearer titok)
             └─ Worker (src/index.js) → KV (devvit_archive_v1)
                  └─ GET /api/reddit  →  backup JSON + KV egyesítve, NSFW kiszűrve
                       └─ galéria (script.js)
```

A `GET /api/reddit` a backup JSON és a Devvit által beküldött posztok **egyesítése** (azonos `id` esetén a Devvit
adata nyer), legújabb elöl. Így a régi képek is megmaradnak.

## Beállítás (egyszer)

1. Titok megadása a Workernek (a titkot a Devvit-app beállításai közé is be kell írni):

   ```bash
   npx wrangler secret put DEVVIT_SECRET
   ```

   Helyi fejlesztéshez: `.dev.vars` fájl `DEVVIT_SECRET=valami-hosszu-veletlen-szoveg` sorral (a fájl gitignore-ban van).

2. A KV-névtér (`REDDIT_CACHE`) már a `wrangler.jsonc`-ben van.
3. A Devvit-appban a `femboy.hu` domaint engedélyezni kell kimenő HTTP-hez (Devvit `http` / fetch domain allowlist).

Ha a `DEVVIT_SECRET` nincs beállítva, az ingest végpont `503`-at ad, a galéria pedig simán a backupból működik.

## A végpont: `POST /api/reddit/ingest`

Fejlécek:

```
Authorization: Bearer <DEVVIT_SECRET>
Content-Type: application/json
```

Törzs (legfeljebb 256 KB, legfeljebb 100 poszt hívásonként):

```json
{
  "posts": [
    {
      "id": "1x52by8",
      "title": "Boom egy femboy 🐕",
      "author": "valaki",
      "permalink": "/r/MagyarFemboyCommunity/comments/1x52by8/boom_egy_femboy/",
      "created": 1791911135,
      "over_18": false,
      "spoiler": false,
      "images": [
        { "thumb": "https://preview.redd.it/abc.jpeg?width=640&auto=webp&s=...", "full": "https://i.redd.it/abc.jpeg" }
      ]
    }
  ],
  "remove": ["abc123"]
}
```

| Mező | Kötelező | Megjegyzés |
|---|---|---|
| `id` | igen | Reddit-poszt azonosító (`t3_` előtaggal vagy anélkül) |
| `title`, `author` | nem | Sima szövegként küldd (nem HTML-kódoltan); a Worker változtatás nélkül tárolja, a lap `textContent`-tel írja ki |
| `permalink` / `url` | nem | Csak `reddit.com` link fogadható el, egyébként az alapértelmezett poszt-link lesz |
| `created` | nem | Unix idő másodpercben (ezredmásodperc is jó, automatikusan felismerjük) |
| `over_18` | **igen** | Kötelezően kifejezett `false` (vagy `nsfw: false`). Ha hiányzik, a poszt **elutasítva** (`rejected`), mert nem tudhatjuk, hogy biztonságos-e. Bármi más, mint `false` → a poszt elrejtődik |
| `spoiler`, `removed`, `deleted` | nem | Ha bármelyik igaz, a poszt **elrejtődik** (lásd lent) |
| `images` | igen | `{thumb, full}` párok vagy egyszerű URL-ek. Csak `https`, és csak ezekről a hostokról: `preview.redd.it`, `i.redd.it`, `external-preview.redd.it`, `i.redditmedia.com` |
| `remove` | nem | Törlendő poszt-azonosítók |

Galériás posztnál az összes kép kerüljön az `images` tömbbe (legfeljebb 20). A `thumb` kb. 640 px széles kép legyen
(ez látszik a kártyán), a `full` a nagyfelbontású (ez nyílik meg a nagyításnál).

### NSFW és törlések

- `over_18` / `spoiler` / `removed` / `deleted` jelölésű poszt **nem jelenik meg**, és ha már benne volt az archívumban,
  onnan is törlődik.
- Az elrejtett `id` a **backup JSON-ból sem jöhet vissza** (a Worker megjegyzi az elrejtett azonosítókat).
- Ha egy posztról később levesznek az NSFW-jelölést, egy újabb `posts` beküldéssel (`over_18: false`) újra megjelenik.
- A `remove` lista törölt posztokhoz való: az `id` végleg rejtett lesz.

Ajánlott Devvit-triggerek: új poszt, poszt-szerkesztés (flair/NSFW változás), poszt-törlés, moderátori eltávolítás.
Az indulási szinkronhoz az app az utolsó ~50 posztot egyben is beküldheti.

### Válaszok

| Státusz | Jelentés |
|---|---|
| `200` | `{"ok":true,"upserted":n,"hidden":n,"removed":n,"rejected":n,"total":n}` |
| `400` | Érvénytelen JSON |
| `401` | Hibás vagy hiányzó titok |
| `405` | Nem `POST` |
| `413` | Túl nagy kérés / túl sok poszt |
| `503` | A Worker-oldal nincs beállítva (nincs `DEVVIT_SECRET`) |

A `rejected` azon elemek száma, amelyeket a Worker eldobott (ismeretlen kép-host, hiányzó `id`, nincs kép).

## Kézi tiltólista

Bármelyik poszt azonnal elrejthető a `public/data/hidden_posts.json` fájlba írt azonosítóval, deploy után
(a Devvit-appra nincs szükség):

```json
["1x52by8", "1u03mu7"]
```

## Kipróbálás

```bash
curl -X POST https://femboy.hu/api/reddit/ingest \
  -H "Authorization: Bearer $DEVVIT_SECRET" -H "Content-Type: application/json" \
  -d '{"posts":[{"id":"abc123","title":"Teszt","author":"me","created":1791911135,
       "images":["https://i.redd.it/teszt.jpeg"]}]}'
curl -s https://femboy.hu/api/reddit | head -c 300     # a poszt megjelenik
```

A `X-Reddit-Source` válaszfejléc megmutatja, honnan jön az adat: `backup` vagy `devvit+backup`.

## A backup JSON frissítése

A `public/data/reddit_backup.json` a Reddit nyers `Listing` formátuma (`kind: "Listing"`). Cseréje után a Worker
automatikusan kiszűri belőle az `over_18`, `spoiler`, `hidden` és eltávolított posztokat, a böngészős tartalék
útvonal (`script.js`) pedig ugyanezt teszi.
