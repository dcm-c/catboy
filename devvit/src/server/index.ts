// =========================================================
// Devvit-szerver (a Reddit platformján fut, NEM Cloudflare-en)
//
// Feladata: a subreddit posztjait a femboy.hu Workernek (POST /api/reddit/ingest) küldi,
// és az új posztokról Discord-kártyát küld. A logika a lib/ mappában van (tesztelhető),
// ez a fájl csak a Devvit-specifikus ragasztó: triggerek, menü, ütemező, Redis, titkok.
//
// Az API-hívások (reddit, redis, settings) Devvit Web-szerint a @devvit/web/server csomagból jönnek.
// Ha egy típus/metódusnév a Devvit új verziójában eltér, a javítás ebben az egy fájlban van.
// =========================================================

import { serve } from '@hono/node-server';
import { context, createServer, getServerPort, reddit, redis, settings } from '@devvit/web/server';
import { Hono } from 'hono';
import { createSync, type Pending, type Store } from './lib/sync.ts';
import type { FetchLike } from './lib/discord.ts';

const PENDING_KEY = 'mfsz:pending';

// --- Redis-alapú tároló (dedupe + újrapróbálási lista) ---
const store: Store = {
  async claim(key, ttlSeconds) {
    const result = await redis.set(key, '1', { nx: true, expiration: new Date(Date.now() + ttlSeconds * 1000) });
    return Boolean(result);
  },
  async release(key) {
    await redis.del(key);
  },
  async pendingPut(id, entry) {
    await redis.hSet(PENDING_KEY, { [id]: JSON.stringify(entry) });
  },
  async pendingAll() {
    const raw = (await redis.hGetAll(PENDING_KEY)) ?? {};
    const out: Record<string, Pending> = {};
    for (const [id, json] of Object.entries(raw)) {
      try {
        const parsed = JSON.parse(json) as Partial<Pending>;
        out[id] = { attempts: Number(parsed.attempts) || 0, announce: Boolean(parsed.announce) };
      } catch {
        await redis.hDel(PENDING_KEY, [id]);
      }
    }
    return out;
  },
  async pendingDel(id) {
    await redis.hDel(PENDING_KEY, [id]);
  },
};

const sync = createSync({
  fetch: fetch as unknown as FetchLike,
  async secrets() {
    const [ingestSecret, discordWebhookUrl] = await Promise.all([settings.get<string>('ingestSecret'), settings.get<string>('discordWebhookUrl')]);
    return { ingestSecret: ingestSecret || undefined, discordWebhookUrl: discordWebhookUrl || undefined };
  },
  async getPost(id) {
    return (await reddit.getPostById(id as `t3_${string}`)) as unknown;
  },
  async listNewPosts(limit) {
    const listing = reddit.getNewPosts({ subredditName: context.subredditName, limit, pageSize: limit });
    return (await listing.all()) as unknown[];
  },
  store,
  subreddit: context.subredditName ?? 'MagyarFemboyCommunity',
  log(level, message) {
    const line = `[mfsz] ${message}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  },
});

const app = new Hono();
const ok = { status: 'ok' };

type TriggerBody = { post?: unknown; postId?: unknown; isNsfw?: unknown; isSpoiler?: unknown };

async function body(c: { req: { json<T>(): Promise<T> } }): Promise<TriggerBody> {
  try {
    return await c.req.json<TriggerBody>();
  } catch {
    return {};
  }
}

// Új poszt: ingest + Discord-kártya (egyszer).
app.post('/internal/triggers/post-submit', async (c) => {
  await sync.handleUpsert(await body(c), true);
  return c.json(ok);
});

// Módosítások (szerkesztés, NSFW/spoiler jelölés): csak ingest, Discord nélkül.
for (const path of ['post-update', 'post-nsfw-update', 'post-spoiler-update', 'post-flair-update']) {
  app.post(`/internal/triggers/${path}`, async (c) => {
    await sync.handleUpsert(await body(c), false);
    return c.json(ok);
  });
}

// Törölt poszt.
app.post('/internal/triggers/post-delete', async (c) => {
  const b = await body(c);
  await sync.handleRemove(b.postId ?? (b.post as { id?: unknown } | undefined)?.id);
  return c.json(ok);
});

// Moderátori eltávolítás (onModAction). A mezőnevek verziófüggők, ezért védekezően olvassuk.
app.post('/internal/triggers/mod-action', async (c) => {
  const b = (await c.req.json<Record<string, unknown>>().catch(() => ({}))) as Record<string, any>;
  const action = String(b.action ?? '');
  const targetPost = b.targetPost as { id?: unknown } | undefined;
  if ((action === 'removelink' || action === 'spamlink') && targetPost?.id) {
    await sync.handleRemove(targetPost.id);
  }
  return c.json(ok);
});

// Ütemező: a függőben lévők (képre vagy hálózatra váró posztok) újrapróbálása.
app.post('/internal/scheduler/retry-pending', async (c) => {
  const result = await sync.retryPending();
  console.log(`[mfsz] retry-pending: ${result.tried} próbált, ${result.done} kész`);
  return c.json(ok);
});

// Moderátori menü: az utolsó posztok szinkronja (Discord nélkül).
app.post('/internal/menu/backfill', async (c) => {
  try {
    const r = await sync.backfill(50);
    return c.json({ showToast: `Szinkron: ${r.sent} poszt elküldve, ${r.hidden} elrejtve, ${r.skipped} kihagyva (${r.status}).` });
  } catch (err) {
    console.error(`[mfsz] backfill hiba: ${String(err)}`);
    return c.json({ showToast: 'A szinkron nem sikerült, nézd meg a naplót.' });
  }
});

serve({ fetch: app.fetch, createServer, port: getServerPort() });
