# femboy-hu-sync (Devvit-app)

A subredditen (r/MagyarFemboyCommunity) futó Devvit-app. Két dolgot csinál:

1. **Galéria:** az új és módosult posztokat elküldi a femboy.hu Workernek (`POST /api/reddit/ingest`,
   a protokoll: [docs/DEVVIT.md](../docs/DEVVIT.md)).
2. **Discord:** minden új, nem NSFW / nem spoileres posztról kártyát (embed) küld a webhookra.
   Galériás poszt esetén az első 4 kép rácsban látszik, a többit a leírás jelzi.

> A Devvit-app a Reddit saját platformján fut, nem Cloudflare-en. A Cloudflare Worker (`../src/index.js`)
> fogadja, tárolja (KV) és szolgálja ki az adatot.

## Biztonsági szabályok

- NSFW, spoiler, eltávolított vagy törölt poszt **sosem** kerül Discordra, a galériából pedig elrejtődik.
- Ha az NSFW-állapot nem állapítható meg egyértelműen, a poszt **kimarad** (fail-closed).
- A Discord-kártya posztonként legfeljebb egyszer megy ki (Redis-kulcs), az ismételt trigger nem duplázza.
- A webhook-URL-nek `https://discord.com/api/webhooks/...` alakúnak kell lennie, és a kártya nem pingelhet senkit.
- Visszamenőleges szinkronnál (moderátori menü) **nincs** Discord-üzenet.

## Hogyan működik

| Esemény | Teendő |
|---|---|
| `onPostSubmit` | friss lekérés → ingest + Discord-kártya |
| `onPostUpdate`, `onPostNsfwUpdate`, `onPostSpoilerUpdate`, `onPostFlairUpdate` | ingest (NSFW/spoiler → a Worker elrejti) |
| `onPostDelete`, `onModAction` (eltávolítás) | `remove` → végleg rejtett |
| ütemező, 5 percenként | a függő posztok újrapróbálása (a képek még nem készültek el / hálózati hiba), legfeljebb 6×, a végén kép nélkül is kimegy a Discord-kártya |
| moderátori menü: „femboy.hu galéria szinkron" | az utolsó 50 poszt ingestje (Discord nélkül) |

## Telepítés

Előfeltétel: Node 22+, Reddit-fiók, moderátori jog a subredditen.

```bash
cd devvit
npm install            # a "latest" verziókat érdemes a sikeres telepítés után rögzíteni
npm test               # 34 teszt, a Devvit nélkül fut (a valódi Workerrel is összevet)
npm run login          # devvit login
npx devvit init        # egyszer: app létrehozása/összekötése a developers.reddit.com-on (a név: devvit.json "name")
npm run upload         # build + feltöltés
npx devvit install r/MagyarFemboyCommunity
```

Titkok (egyszer, az első telepítés után; build és legalább egy telepítés kell hozzá):

```bash
npx devvit settings set ingestSecret        # ugyanaz az érték, mint:  npx wrangler secret put DEVVIT_SECRET
npx devvit settings set discordWebhookUrl   # Discord: Csatorna beállításai → Integrációk → Webhookok
```

Amelyik titok üres, az a funkció ki van kapcsolva (nincs titok → nincs ingest; nincs webhook → nincs Discord).

### Engedélyek, amiket a Redditnek jóvá kell hagynia

- `permissions.http.domains`: `femboy.hu`, `discord.com`. A `discord.com` előre jóváhagyott, a `femboy.hu`
  kérését a Reddit 1–2 munkanap alatt bírálja el. Addig a kimenő kérések elbuknak (a függő lista újrapróbálja).
- Kimenő HTTP-hez a Reddit **Terms & Privacy** oldalt kér: add meg az adatvédelmi nyilatkozat (https://femboy.hu/privacy.html) és a felhasználási feltételek linkjét.

## Tesztelés a Reddit nélkül

`npm test`: a poszt-leképezés (egyképes, galéria, preview, NSFW/spoiler/törölt, fail-closed), a Discord-kártya
(galéria, escape, 429), a teljes szinkron (dedupe, újrapróba, hibák) és egy szerződésteszt, ami a Devvit-oldal
kimenetét a valódi `src/index.js` Workerrel fogadtatja.

## Amit élesben még ellenőrizni kell

A fejlesztői környezetből a Reddit/Devvit nem érhető el, ezért **a Devvit-specifikus ragasztó
(`src/server/index.ts`, `devvit.json`) nincs futtatva**. Az első `npx devvit playtest` / feltöltés után nézd meg:

- A `devvit.json` `server` és `permissions` blokkja sémahibát adhat, ha a Devvit új verziója mást vár. Ilyenkor
  igazítsd a `npx devvit init` sablonjához (a mezők jelentése ugyanaz).
- A poszt mezőnevei (NSFW-jelölő, galéria, előnézet) verziónként változhatnak. A `lib/post.ts` több lehetséges
  nevet is olvas, és ha nem tud egyértelműen NSFW-állapotot megállapítani, **kihagyja** a posztot: ha minden poszt
  kimarad, a naplóban `az NSFW-állapot nem állapítható meg` sorokat látsz, és a `lib/post.ts` `flagState` neveit kell bővíteni.
- Naplók: `npx devvit logs r/MagyarFemboyCommunity`.
