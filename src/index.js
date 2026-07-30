export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === '/api/reddit') {
            const cachedData = await env.REDDIT_CACHE.get("latest_posts");
            return new Response(cachedData || "[]", {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        return env.ASSETS.fetch(request);
    },

    async scheduled(event, env, ctx) {
        const subreddit = 'MagyarFemboyCommunity';
        const headers = {
            'User-Agent': 'CatboyGallerySync/1.0 (Cloudflare Worker; +https://magyarfemboy.hu)'
        };

        try {
            const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=30`, { headers });
            if (!res.ok) throw new Error("Reddit API error");

            const data = await res.json();
            const posts = data.data.children.map(child => child.data);

            const validPosts = [];

            for (const post of posts) {
                if (post.removed_by_category || post.is_deleted || post.hidden) continue;

                let images = [];

                if (post.is_gallery && post.media_metadata) {
                    const galleryItems = post.gallery_data?.items || [];
                    for (const item of galleryItems) {
                        const media = post.media_metadata[item.media_id];
                        if (media && media.status === 'valid' && media.s && media.s.u) {
                            images.push(media.s.u.replace(/&amp;/g, '&'));
                        }
                    }
                }
                else if (post.url && post.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    images.push(post.url);
                }
                else if (post.preview && post.preview.images && post.preview.images.length > 0) {
                    images.push(post.preview.images[0].source.url.replace(/&amp;/g, '&'));
                }

                if (images.length > 0) {
                    validPosts.push({
                        title: post.title,
                        author: post.author,
                        url: `https://www.reddit.com${post.permalink}`,
                        images: images
                    });
                }
            }

            await env.REDDIT_CACHE.put("latest_posts", JSON.stringify(validPosts));

        } catch (error) {
            console.error("Hiba a Reddit frissítésekor:", error);
        }
    }
};