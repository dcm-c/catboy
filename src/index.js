// =========================================================
// SZERVER OLDAL (Cloudflare Worker - src/index.js)
//
// A /api/reddit végpont a galéria Reddit-képeit szolgálja ki.
//
// Adatforrások (ebben a sorrendben egyesítve, azonos id esetén az előbbi nyer):
//   1. Devvit által betolt posztok (KV)  -> POST /api/reddit/ingest   (lásd: docs/DEVVIT.md)
//   2. Helyi archívum: public/data/reddit_backup.json
//
// Amíg a Devvit-app nem készült el, a végpont egyszerűen a backup JSON-t adja.
// Az NSFW / spoileres / eltávolított posztok MINDEN forrásnál kiszűrődnek, a
// kézi tiltólista (public/data/hidden_posts.json) pedig bármit elrejthet.
//
// A Worker semmit nem kér le a Redditről: a Reddit 2026-ban a nyilvános lekéréseket
// blokkolja, ezért az adatot a Reddit saját platformján (Devvit) futó app küldi be.
// =========================================================

const ARCHIVE_KEY = 'devvit_archive_v1';
const ARCHIVE_LIMIT = 300;            // legfeljebb ennyi Devvit-poszt marad a KV-ben
const MAX_BODY_BYTES = 256 * 1024;
const MAX_POSTS_PER_INGEST = 100;
const MAX_IMAGES_PER_POST = 20;
const IMAGE_HOSTS = new Set(['preview.redd.it', 'i.redd.it', 'external-preview.redd.it', 'i.redditmedia.com']);

// ---------------------------------------------------------
// Segédfüggvények
// ---------------------------------------------------------

// Egy menetben dekódolja az HTML-entitásokat (az &amp;lt; így helyesen &lt;, nem <).
function decodeEntities(str) {
    if (!str) return '';
    return String(str).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, ent) => {
        if (ent[0] === '#') {
            const isHex = ent[1] === 'x' || ent[1] === 'X';
            const code = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        switch (ent.toLowerCase()) {
            case 'amp': return '&';
            case 'lt': return '<';
            case 'gt': return '>';
            case 'quot': return '"';
            case 'apos': return "'";
            case 'nbsp': return ' ';
            default: return match;
        }
    });
}

// A backup (nyers Reddit-JSON) címei HTML-entitásokkal kódoltak (decode = true), a Devvit viszont
// sima szöveget küld, azt nem szabad még egyszer dekódolni.
function cleanTitle(title, decode = false) {
    return (decode ? decodeEntities(title) : String(title == null ? '' : title)).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) || 'Reddit Poszt';
}

function cleanAuthor(author, decode = false) {
    return (decode ? decodeEntities(author) : String(author == null ? '' : author)).replace(/^\/?u\//i, '').trim().slice(0, 50) || 'Ismeretlen';
}

function normalizeId(raw) {
    const id = String(raw || '').replace(/^t3_/i, '').trim().toLowerCase();
    return /^[a-z0-9]{3,12}$/.test(id) ? id : '';
}

// Csak https-es, Reddit-képhosztos URL fogadható el.
function safeImageUrl(raw) {
    try {
        const url = new URL(decodeEntities(raw));
        return url.protocol === 'https:' && IMAGE_HOSTS.has(url.hostname) ? url.href : null;
    } catch {
        return null;
    }
}

function safeRedditUrl(raw, id) {
    try {
        const url = new URL(raw, 'https://www.reddit.com');
        if (url.protocol === 'https:' && /(^|\.)reddit\.com$/.test(url.hostname)) return url.href;
    } catch { /* az alapértelmezett link lesz */ }
    return `https://www.reddit.com/comments/${id}`;
}

function toImageList(images) {
    const list = [];
    for (const img of Array.isArray(images) ? images.slice(0, MAX_IMAGES_PER_POST) : []) {
        const thumb = safeImageUrl(typeof img === 'string' ? img : img && img.thumb);
        const full = safeImageUrl(typeof img === 'string' ? img : img && img.full);
        if (thumb || full) list.push({ thumb: thumb || full, full: full || thumb });
    }
    return list;
}

// ---------------------------------------------------------
// Backup (data/reddit_backup.json) feldolgozása
// ---------------------------------------------------------

// Minden jel, ami arra utal, hogy a posztot nem szabad a nyilvános galériában mutatni.
// Szándékosan szigorú: elég egyetlen jelzés (NSFW, spoiler, karantén, eltávolított, vagy
// NSFW-s keresztposzt, illetve a Reddit "nsfw" előnézeti változata / bélyegképe).
function isSensitiveListingPost(post) {
    if (post.removed_by_category || post.is_deleted || post.hidden) return true;
    if (post.over_18 || post.spoiler || post.quarantine || post.thumbnail === 'nsfw') return true;
    if (Array.isArray(post.crosspost_parent_list) && post.crosspost_parent_list.some((p) => p && p.over_18)) return true;
    const images = post.preview && Array.isArray(post.preview.images) ? post.preview.images : [];
    return images.some((img) => img && img.variants && img.variants.nsfw);
}

// A nyers Reddit-listázás ("kind": "Listing") alakítása egységes posztokká.
// Visszaadja a megjeleníthető posztokat és a TILTOTT (NSFW, spoileres, eltávolított) id-ket.
function parseListing(raw) {
    const posts = [];
    const hiddenIds = [];

    let children = [];
    if (raw && raw.kind === 'Listing' && raw.data && Array.isArray(raw.data.children)) {
        children = raw.data.children.map((child) => child.data);
    } else if (Array.isArray(raw)) {
        children = raw;
    }

    for (const post of children) {
        if (!post || typeof post !== 'object') continue;
        const id = normalizeId(post.id || post.name);
        if (!id) continue;

        if (isSensitiveListingPost(post)) {
            hiddenIds.push(id);
            continue;
        }

        const images = [];
        if (post.is_gallery && post.media_metadata) {
            for (const item of (post.gallery_data && post.gallery_data.items) || []) {
                const media = post.media_metadata[item.media_id];
                if (media && media.status === 'valid' && media.s && media.s.u) {
                    const full = media.s.u;
                    let thumb = full;
                    if (Array.isArray(media.p) && media.p.length) {
                        const mid = media.p[Math.min(3, media.p.length - 1)];
                        if (mid && mid.u) thumb = mid.u; // kb. 640 px
                    }
                    images.push({ thumb, full });
                }
            }
        } else if (post.preview && post.preview.images && post.preview.images.length) {
            const img = post.preview.images[0];
            const full = img.source && img.source.url;
            let thumb = full;
            if (Array.isArray(img.resolutions) && img.resolutions.length) {
                const mid = img.resolutions[Math.min(3, img.resolutions.length - 1)];
                if (mid && mid.url) thumb = mid.url;
            }
            if (full) images.push({ thumb, full });
        } else if (post.url && /\.(jpe?g|png|gif)$/i.test(post.url)) {
            images.push({ thumb: post.url, full: post.url });
        }

        const clean = toImageList(images);
        if (clean.length === 0) continue;
        posts.push({
            id,
            title: cleanTitle(post.title, true),
            author: cleanAuthor(post.author, true),
            url: safeRedditUrl(post.permalink || post.url, id),
            created: Math.floor(post.created_utc || 0),
            images: clean,
        });
    }
    return { posts, hiddenIds };
}

async function loadAssetJson(env, path) {
    try {
        const res = await env.ASSETS.fetch(new Request(`http://localhost${path}`));
        if (res.ok) return await res.json();
    } catch (e) {
        console.error(`❌ [Asset hiba] ${path}:`, e);
    }
    return null;
}

async function loadBlocklist(env) {
    const list = await loadAssetJson(env, '/data/hidden_posts.json');
    return new Set(Array.isArray(list) ? list.map(normalizeId).filter(Boolean) : []);
}

// ---------------------------------------------------------
// Devvit-archívum (KV)
// ---------------------------------------------------------

async function readArchive(env) {
    const empty = { v: 1, updatedAt: 0, posts: [], hidden: [] };
    if (!env.REDDIT_CACHE) return empty;
    try {
        const archive = await env.REDDIT_CACHE.get(ARCHIVE_KEY, 'json');
        if (archive && Array.isArray(archive.posts)) return { ...empty, ...archive };
    } catch (e) {
        console.error('❌ [KV olvasási hiba]', e);
    }
    return empty;
}

// Egy beérkező poszt ellenőrzése. Visszatérés: {post} (megjeleníthető) vagy {hide: id} (rejtendő).
function validateIncoming(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = normalizeId(raw.id || raw.name);
    if (!id) return null;

    // Fail-closed: a posztnak KIFEJEZETTEN "over_18: false"-t (vagy "nsfw: false"-t) kell hoznia.
    // Ha a jelölés hiányzik, nem tudhatjuk, hogy biztonságos-e, ezért nem fogadjuk el.
    const nsfw = raw.over_18 !== undefined ? raw.over_18 : raw.nsfw;
    if ((nsfw !== undefined && nsfw !== null && nsfw !== false) || raw.spoiler || raw.removed || raw.deleted) {
        return { hide: id };
    }
    if (nsfw !== false) return null;

    const images = toImageList(raw.images);
    if (images.length === 0) return null;

    const created = Number(raw.created ?? raw.created_utc) || 0;
    return {
        post: {
            id,
            title: cleanTitle(raw.title),
            author: cleanAuthor(raw.author),
            url: safeRedditUrl(raw.permalink || raw.url, id),
            // Devvit ms-ban is küldhet időt: az 1e11 feletti érték ezredmásodperc.
            created: Math.floor(created > 1e11 ? created / 1000 : created),
            images,
        },
    };
}

// ---------------------------------------------------------
// Kiszolgálás
// ---------------------------------------------------------

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
    });
}

async function handleGet(env) {
    const [backupRaw, blocked, archive] = await Promise.all([
        loadAssetJson(env, '/data/reddit_backup.json'),
        loadBlocklist(env),
        readArchive(env),
    ]);
    const backup = parseListing(backupRaw);

    // Az NSFW-jelölést kapott posztok mindenhonnan kiesnek, akkor is, ha a backupban még nem jelölt.
    const hidden = new Set([...blocked, ...backup.hiddenIds, ...archive.hidden]);
    const merged = new Map();
    for (const post of backup.posts) merged.set(post.id, post);
    for (const post of archive.posts) merged.set(post.id, post); // a Devvit friss adata felülír

    const posts = [...merged.values()]
        .filter((post) => !hidden.has(post.id) && post.images.length > 0)
        .sort((a, b) => b.created - a.created);

    return json(posts, 200, {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        'X-Reddit-Source': archive.posts.length ? 'devvit+backup' : 'backup',
    });
}

async function sha256(text) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

// Időzítés-biztos titokösszehasonlítás (mindkét oldalt lehashelve, így azonos hosszú).
async function secretsMatch(provided, expected) {
    const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

// POST /api/reddit/ingest  (Devvit -> Worker)
// Fejléc: Authorization: Bearer <DEVVIT_SECRET>
// Törzs:  { "posts": [ {id, title, author, permalink, created, over_18, images:[{thumb, full}]} ],
//           "remove": ["abc123", ...] }
async function handleIngest(request, env) {
    if (!env.DEVVIT_SECRET || !env.REDDIT_CACHE) {
        return json({ ok: false, error: 'A Devvit-fogadás nincs beállítva (DEVVIT_SECRET / REDDIT_CACHE hiányzik).' }, 503);
    }

    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || !(await secretsMatch(token, env.DEVVIT_SECRET))) {
        return json({ ok: false, error: 'Jogosulatlan.' }, 401);
    }

    const declared = Number(request.headers.get('Content-Length'));
    if (declared > MAX_BODY_BYTES) return json({ ok: false, error: 'Túl nagy kérés.' }, 413);
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: 'Túl nagy kérés.' }, 413);

    let body;
    try {
        body = JSON.parse(text);
    } catch {
        return json({ ok: false, error: 'Érvénytelen JSON.' }, 400);
    }
    const incoming = Array.isArray(body && body.posts) ? body.posts : [];
    const removals = Array.isArray(body && body.remove) ? body.remove : [];
    if (incoming.length > MAX_POSTS_PER_INGEST) return json({ ok: false, error: `Legfeljebb ${MAX_POSTS_PER_INGEST} poszt küldhető egyszerre.` }, 413);

    const archive = await readArchive(env);
    const map = new Map(archive.posts.map((post) => [post.id, post]));
    const hidden = new Set(archive.hidden);
    const result = { upserted: 0, hidden: 0, removed: 0, rejected: 0 };

    for (const raw of incoming) {
        const checked = validateIncoming(raw);
        if (!checked) { result.rejected++; continue; }
        if (checked.hide) {
            hidden.add(checked.hide);
            map.delete(checked.hide);
            result.hidden++;
        } else {
            hidden.delete(checked.post.id); // ha a jelölést levették, újra megjelenhet
            map.set(checked.post.id, checked.post);
            result.upserted++;
        }
    }
    for (const raw of removals) {
        const id = normalizeId(raw);
        if (!id) { result.rejected++; continue; }
        hidden.add(id); // a törölt poszt a backupból sem jöhet vissza
        map.delete(id);
        result.removed++;
    }

    const next = {
        v: 1,
        updatedAt: Date.now(),
        hidden: [...hidden].slice(-2000),
        posts: [...map.values()].sort((a, b) => b.created - a.created).slice(0, ARCHIVE_LIMIT),
    };
    await env.REDDIT_CACHE.put(ARCHIVE_KEY, JSON.stringify(next));
    return json({ ok: true, ...result, total: next.posts.length });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/reddit') {
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                return json({ error: 'Csak GET engedélyezett.' }, 405, { Allow: 'GET, HEAD' });
            }
            return handleGet(env);
        }
        if (url.pathname === '/api/reddit/ingest') {
            if (request.method !== 'POST') return json({ error: 'Csak POST engedélyezett.' }, 405, { Allow: 'POST' });
            return handleIngest(request, env);
        }

        return env.ASSETS.fetch(request);
    },
};
