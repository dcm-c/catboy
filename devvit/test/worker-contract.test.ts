// Szerződésteszt: a Devvit-oldali kód kimenetét a VALÓDI Worker (../src/index.js) fogadja el,
// memóriabeli KV-vel. Ez bizonyítja, hogy a két fél ugyanazt a formátumot beszéli.
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-ignore: a Worker sima JS
import worker from '../../src/index.js';
import type { FetchLike } from '../src/server/lib/discord.ts';
import { createSync, INGEST_URL, type Pending, type Store } from '../src/server/lib/sync.ts';

function setup(posts: Record<string, unknown>) {
  const kv = new Map<string, string>();
  const env = {
    DEVVIT_SECRET: 's3cret',
    ASSETS: { fetch: async () => new Response('{"data":{"children":[]}}') },
    REDDIT_CACHE: { async get(k: string, t?: string) { const v = kv.get(k); return v === undefined ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k: string, v: string) { kv.set(k, v); } },
  };
  const claims = new Set<string>();
  const pending = new Map<string, Pending>();
  const store: Store = {
    async claim(k) { if (claims.has(k)) return false; claims.add(k); return true; },
    async release(k) { claims.delete(k); },
    async pendingPut(id, e) { pending.set(id, e); },
    async pendingAll() { return Object.fromEntries(pending); },
    async pendingDel(id) { pending.delete(id); },
  };
  const fetch: FetchLike = async (url, init) => {
    if (url !== INGEST_URL) return { ok: true, status: 204, text: async () => '' };
    const res: Response = await worker.fetch(new Request('https://femboy.hu/api/reddit/ingest', { method: 'POST', headers: init.headers, body: init.body }), env, {});
    return { ok: res.ok, status: res.status, text: () => res.text() };
  };
  const sync = createSync({
    fetch, secrets: async () => ({ ingestSecret: 's3cret' }), getPost: async (id) => posts[id] ?? null, listNewPosts: async () => [],
    store, subreddit: 'x', log: () => {},
  });
  const gallery = async () => (await worker.fetch(new Request('https://femboy.hu/api/reddit'), env, {})).json() as Promise<{ id: string; title: string; images: unknown[] }[]>;
  return { sync, gallery };
}

const sfw = (id: string, extra: object = {}) => ({ id: `t3_${id}`, title: 'Cím <b>', authorName: 'valaki', permalink: `/r/x/comments/${id}/c/`, createdAt: new Date(), nsfw: false, ...extra });

test('Devvit -> Worker: galéria megjelenik, NSFW átállítás elrejti, törlés végleg elrejti', async () => {
  const posts: Record<string, unknown> = {
    t3_aaa111: sfw('aaa111', { gallery: ['https://i.redd.it/1.png', 'https://i.redd.it/2.png'], isGallery: true }),
    t3_bbb222: sfw('bbb222', { url: 'https://i.redd.it/b.jpg' }),
  };
  const { sync, gallery } = setup(posts);
  await sync.handleUpsert({ post: { id: 't3_aaa111' } }, true);
  await sync.handleUpsert({ post: { id: 't3_bbb222' } }, true);
  let list = await gallery();
  assert.deepEqual(list.map((p) => p.id).sort(), ['aaa111', 'bbb222']);
  assert.equal(list.find((p) => p.id === 'aaa111')!.images.length, 2);
  assert.equal(list.find((p) => p.id === 'aaa111')!.title, 'Cím <b>', 'a sima szöveg változatlanul megy át');

  posts.t3_aaa111 = sfw('aaa111', { nsfw: true, gallery: ['https://i.redd.it/1.png'] });
  await sync.handleUpsert({ post: { id: 't3_aaa111' }, isNsfw: true }, false);
  list = await gallery();
  assert.deepEqual(list.map((p) => p.id), ['bbb222']);

  await sync.handleRemove('t3_bbb222');
  assert.deepEqual(await gallery(), []);

  // a törölt poszt már nem kérhető le: egy elkésett módosítás-esemény nem hozza vissza
  delete posts.t3_bbb222;
  await sync.handleUpsert({ postId: 't3_bbb222' }, false);
  assert.deepEqual(await gallery(), []);
});
