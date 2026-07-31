// --- SZERVER OLDAL (Backend - src/index.js) ---

// Segédfüggvény a helyi backup JSON szabályos beolvasásához
async function getBackupPosts(env) {
    try {
        const backupRes = await env.ASSETS.fetch(new Request("http://localhost/data/reddit_backup.json"));
        if (backupRes.ok) {
            console.log("📦 [Backup] Helyi reddit_backup.json sikeresen beolvasva.");
            const data = await backupRes.json();
            return Array.isArray(data) ? data : []; // Biztosítjuk, hogy tömb legyen
        }
    } catch (e) {
        console.error("❌ [Backup Hiba] Nem sikerült beolvasni a helyi backup JSON fájlt:", e);
    }
    return [];
}

async function fetchAndCacheReddit(env) {
    const subreddit = 'MagyarFemboyCommunity';
    const rssUrl = encodeURIComponent(`https://www.reddit.com/r/${subreddit}/new/.rss`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Proxy hiba: ${res.status}`);

        const data = await res.json();
        if (data.status !== 'ok') throw new Error('RSS feldolgozási hiba');

        const validPosts = [];
        for (const post of data.items) {
            let images = [];
            const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);

            if (imgMatch && imgMatch[1]) {
                images.push(imgMatch[1]);
            } else if (post.thumbnail && !post.thumbnail.includes('self') && !post.thumbnail.includes('default')) {
                images.push(post.thumbnail);
            }

            if (images.length > 0) {
                let authorName = post.author.replace('/u/', '');
                validPosts.push({
                    title: post.title,
                    author: authorName,
                    url: post.link,
                    images: images
                });
            }
        }

        if (validPosts.length > 0) {
            await env.REDDIT_CACHE.put("latest_posts", JSON.stringify(validPosts));
            return validPosts;
        }

        throw new Error("Nem találtunk képes posztot az élő lekérésben.");

    } catch (e) {
        console.warn(`⚠️ Élő lekérés sikertelen (${e.message}) -> Váltás a helyi backupra...`);
        return await getBackupPosts(env); // Itt már a tiszta tömb tér vissza
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === '/api/reddit') {
            let cachedData = await env.REDDIT_CACHE.get("latest_posts");

            if (!cachedData) {
                console.log("⚠️ [KV Cache üres vagy törlődött] -> Élő lekérés vagy backup indítása...");
                const freshData = await fetchAndCacheReddit(env);
                return new Response(JSON.stringify(freshData || []), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            return new Response(cachedData, {
                headers: { "Content-Type": "application/json" }
            });
        }

        return env.ASSETS.fetch(request);
    },

    async scheduled(event, env, ctx) {
        await fetchAndCacheReddit(env);
    }
};