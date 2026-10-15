import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FetchLike } from '../src/server/lib/discord.ts';
import { createSync, INGEST_URL, MAX_ATTEMPTS, type Pending, type Store } from '../src/server/lib/sync.ts';

const HOOK = 'https://discord.com/api/webhooks/123456789/token';

function setup(opts: { ingestStatus?: number; discordStatus?: number; secrets?: { ingestSecret?: string; discordWebhookUrl?: string }; posts?: Record<string, unknown>; list?: unknown[] } = {}) {
  const claims = new Set<string>();
  const pending = new Map<string, Pending>();
  const requests: { url: string; body: any; auth?: string }[] = [];
  const logs: string[] = [];
  const state = { ingestStatus: opts.ingestStatus ?? 200, discordStatus: opts.discordStatus ?? 204 };
  const posts = opts.posts ?? {};
  const store: Store = {
    async claim(key) { if (claims.has(key)) return false; claims.add(key); return true; },
    async release(key) { claims.delete(key); },
    async pendingPut(id, e) { pending.set(id, e); },
    async pendingAll() { return Object.fromEntries(pending); },
    async pendingDel(id) { pending.delete(id); },
  };
  const fetch: FetchLike = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    const status = url === INGEST_URL ? state.ingestStatus : state.discordStatus;
    return { ok: status >= 200 && status < 300, status, text: async () => '' };
  };
  const sync = createSync({
    fetch,
    secrets: async () => opts.secrets ?? { ingestSecret: 's3cret', discordWebhookUrl: HOOK },
    getPost: async (id) => (id in posts ? posts[id] : null),
    listNewPosts: async () => opts.list ?? [],
    store, subreddit: 'MagyarFemboyCommunity',
    log: (l, m) => logs.push(`${l}: ${m}`),
    sleep: async () => {},
  });
  return { sync, claims, pending, requests, logs, state, posts };
}

const ingests = (r: { url: string }[]) => r.filter((x) => x.url === INGEST_URL);
const discords = (r: { url: string }[]) => r.filter((x) => x.url === HOOK);
const sfw = (extra: object = {}) => ({ id: 't3_abc123', title: 'Cím', authorName: 'valaki', permalink: '/r/x/comments/abc123/c/', createdAt: 1791972000000, nsfw: false, url: 'https://i.redd.it/a.jpeg', ...extra });

test('új SFW poszt: ingest + Discord, Bearer titokkal', async () => {
  const t = setup({ posts: { t3_abc123: sfw() } });
  const out = await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(out.done, true);
  assert.equal(ingests(t.requests).length, 1);
  assert.equal(ingests(t.requests)[0].auth, 'Bearer s3cret');
  assert.equal(ingests(t.requests)[0].body.posts[0].id, 'abc123');
  assert.equal(discords(t.requests).length, 1);
  assert.equal(t.pending.size, 0);
});

test('ismételt trigger: ingest újra, Discord csak egyszer', async () => {
  const t = setup({ posts: { t3_abc123: sfw() } });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(ingests(t.requests).length, 2);
  assert.equal(discords(t.requests).length, 1);
});

test('szerkesztés (announce=false): nincs Discord', async () => {
  const t = setup({ posts: { t3_abc123: sfw() } });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, false);
  assert.equal(discords(t.requests).length, 0);
  assert.equal(ingests(t.requests).length, 1);
});

test('NSFW poszt: nincs Discord, a Worker elrejtést kap', async () => {
  const t = setup({ posts: { t3_abc123: sfw({ nsfw: true }) } });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(discords(t.requests).length, 0);
  assert.deepEqual(ingests(t.requests)[0].body.posts, [{ id: 'abc123', over_18: true, spoiler: false }]);
});

test('az eseménytöltet NSFW jelölője akkor is elrejt, ha a friss lekérés még SFW-t mutat', async () => {
  const t = setup({ posts: { t3_abc123: sfw() } });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' }, isNsfw: true }, true);
  assert.equal(discords(t.requests).length, 0);
  assert.equal(ingests(t.requests)[0].body.posts[0].over_18, true);
});

test('ismeretlen NSFW-állapot: semmi nem megy ki', async () => {
  const { nsfw: _drop, ...unknown } = sfw();
  const t = setup({ posts: { t3_abc123: unknown } });
  const out = await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(out.done, true);
  assert.equal(t.requests.length, 0);
});

test('getPost hiba: az eseménytöltet alapján dolgozik tovább', async () => {
  const t = setup({ posts: {} });
  await t.sync.handleUpsert({ post: sfw() }, true);
  assert.equal(ingests(t.requests).length, 1);
  assert.equal(discords(t.requests).length, 1);
});

test('képre váró galéria: pending, később kész, a Discord utána megy', async () => {
  const t = setup({ posts: { t3_abc123: sfw({ url: 'https://www.reddit.com/gallery/abc123', isGallery: true }) } });
  const first = await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(first.done, false);
  assert.equal(t.requests.length, 0);
  assert.deepEqual(t.pending.get('abc123'), { attempts: 1, announce: true });

  t.posts.t3_abc123 = sfw({ url: 'https://www.reddit.com/gallery/abc123', isGallery: true, gallery: [{ url: 'https://i.redd.it/1.png' }, { url: 'https://i.redd.it/2.png' }] });
  const r = await t.sync.retryPending();
  assert.deepEqual(r, { tried: 1, done: 1 });
  assert.equal(t.pending.size, 0);
  assert.equal(discords(t.requests).length, 1);
  assert.equal(discords(t.requests)[0].body.embeds.length, 2);
});

test('végül kép nélkül is kimegy a Discord-kártya, majd feladja', async () => {
  const t = setup({ posts: { t3_abc123: sfw({ url: 'https://www.reddit.com/gallery/abc123', isGallery: true }) } });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  for (let i = 0; i < MAX_ATTEMPTS; i++) await t.sync.retryPending();
  assert.equal(t.pending.size, 0);
  assert.equal(discords(t.requests).length, 1);
  assert.equal(discords(t.requests)[0].body.embeds[0].image, undefined);
});

test('Discord hiba: a claim felszabadul, az újrapróba újra küld', async () => {
  const t = setup({ posts: { t3_abc123: sfw() }, discordStatus: 500 });
  const out = await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(out.done, false);
  assert.equal(t.claims.size, 0);
  assert.ok(t.pending.has('abc123'));
  t.state.discordStatus = 204;
  await t.sync.retryPending();
  assert.equal(t.pending.size, 0);
  assert.equal(discords(t.requests).length, 2);
  assert.equal(t.claims.size, 1);
});

test('Worker hiba: pending, újrapróba után kész; Discord nem duplázódik', async () => {
  const t = setup({ posts: { t3_abc123: sfw() }, ingestStatus: 503 });
  await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.ok(t.pending.has('abc123'));
  assert.equal(discords(t.requests).length, 1);
  t.state.ingestStatus = 200;
  await t.sync.retryPending();
  assert.equal(t.pending.size, 0);
  assert.equal(discords(t.requests).length, 1);
});

test('titkok nélkül: nincs kimenő kérés, nincs végtelen újrapróba', async () => {
  const t = setup({ posts: { t3_abc123: sfw() }, secrets: {} });
  const out = await t.sync.handleUpsert({ post: { id: 't3_abc123' } }, true);
  assert.equal(out.done, true);
  assert.equal(t.requests.length, 0);
});

test('törlés: remove lista + pending takarítás', async () => {
  const t = setup();
  t.pending.set('abc123', { attempts: 2, announce: true });
  await t.sync.handleRemove('t3_abc123');
  assert.deepEqual(ingests(t.requests)[0].body, { posts: [], remove: ['abc123'] });
  assert.equal(t.pending.size, 0);
  assert.equal((await t.sync.handleRemove('???')).note, 'skip: nincs id');
});

test('backfill: Discord nélkül, NSFW elrejtve, szöveges poszt kihagyva, egy kéréssel', async () => {
  const list = [sfw(), sfw({ id: 't3_def456', nsfw: true }), sfw({ id: 't3_ghi789', url: 'https://www.reddit.com/r/x/comments/ghi789/' })];
  const t = setup({ list });
  const r = await t.sync.backfill();
  assert.deepEqual(r, { sent: 1, hidden: 1, skipped: 1, status: 'ok' });
  assert.equal(discords(t.requests).length, 0);
  assert.equal(ingests(t.requests).length, 1);
  assert.equal(ingests(t.requests)[0].body.posts.length, 2);
});

test('backfill: hiányzó képadat esetén egyenként friss lekérés', async () => {
  const bare = sfw({ url: 'https://www.reddit.com/gallery/abc123', isGallery: true });
  const t = setup({ list: [bare], posts: { t3_abc123: sfw({ url: 'https://www.reddit.com/gallery/abc123', isGallery: true, gallery: ['https://i.redd.it/1.png'] }) } });
  const r = await t.sync.backfill();
  assert.equal(r.sent, 1);
});
