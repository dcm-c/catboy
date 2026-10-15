// =========================================================
// A szinkron logikája: poszt -> femboy.hu Worker (ingest) + Discord (új posztok)
//
// Minden külső függőség (fetch, Redis, Reddit-lekérés, titkok) be van injektálva, így a
// teljes folyamat Node-ban, a Devvit nélkül tesztelhető (lásd test/).
//
// Alapelvek:
//   - Az ingest idempotens (a Worker azonos id-nál felülír), ezért az ismételt trigger nem baj.
//   - A Discord-üzenet posztonként legfeljebb egyszer megy ki (Redis "claim" kulccsal).
//   - Ha valami átmenetileg nem sikerül (a képek még nem készültek el, Discord/Worker hiba),
//     a poszt a "pending" listába kerül, és a cron-feladat újrapróbálja (MAX_ATTEMPTS-ig).
//   - Visszamenőleges szinkronnál (backfill) Discord-üzenet SOHA nem megy.
// =========================================================

import { buildDiscordPayload, isValidWebhookUrl, sendDiscord, type FetchLike } from './discord.ts';
import { classifyPost, normalizeId, sourcesOf, type IngestPost } from './post.ts';

export const INGEST_URL = 'https://femboy.hu/api/reddit/ingest';
export const MAX_ATTEMPTS = 6; // 5 percenként -> ~30 perc
export const ANNOUNCE_TTL_SECONDS = 60 * 60 * 24 * 30;
const INGEST_BATCH = 50;

export type Secrets = { ingestSecret?: string; discordWebhookUrl?: string };

export type Store = {
  /** Igaz, ha most sikerült lefoglalni a kulcsot (még nem létezett). */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  release(key: string): Promise<void>;
  pendingPut(id: string, entry: Pending): Promise<void>;
  pendingAll(): Promise<Record<string, Pending>>;
  pendingDel(id: string): Promise<void>;
};

export type Pending = { attempts: number; announce: boolean };

export type Deps = {
  fetch: FetchLike;
  secrets(): Promise<Secrets>;
  /** Friss poszt lekérése az azonosítója alapján (null, ha nem érhető el). */
  getPost(id: string): Promise<unknown | null>;
  /** A legfrissebb posztok (backfillhez). */
  listNewPosts(limit: number): Promise<unknown[]>;
  store: Store;
  subreddit: string;
  log(level: 'info' | 'warn' | 'error', message: string): void;
  sleep?: (ms: number) => Promise<void>;
};

export type Outcome = { done: boolean; note: string };
export type ProcessOptions = { announce: boolean; final: boolean };

type IngestEntry = IngestPost | { id: string; over_18: true; spoiler: boolean };

export function createSync(deps: Deps) {
  const { store, log } = deps;

  async function ingest(posts: IngestEntry[], remove: string[] = []): Promise<'ok' | 'unconfigured' | 'failed'> {
    const { ingestSecret } = await deps.secrets();
    if (!ingestSecret) {
      log('warn', 'ingestSecret nincs beállítva: a Worker felé nem küldök semmit');
      return 'unconfigured';
    }
    try {
      const res = await deps.fetch(INGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ingestSecret}` },
        body: JSON.stringify({ posts, remove }),
      });
      if (res.ok) return 'ok';
      log('warn', `ingest HTTP ${res.status}`);
    } catch (err) {
      log('warn', `ingest hiba: ${String(err)}`);
    }
    return 'failed';
  }

  /** Discord-kártya, posztonként legfeljebb egyszer. Igaz, ha nincs több teendő. */
  async function announceOnce(post: IngestPost): Promise<boolean> {
    const { discordWebhookUrl } = await deps.secrets();
    if (!discordWebhookUrl) return true; // nincs bekapcsolva
    if (!isValidWebhookUrl(discordWebhookUrl)) {
      log('error', 'a discordWebhookUrl érvénytelen (https://discord.com/api/webhooks/<id>/<token> kell)');
      return true; // újrapróbálás nem segítene
    }
    const key = `mfsz:discord:${post.id}`;
    if (!(await store.claim(key, ANNOUNCE_TTL_SECONDS))) return true; // már elment
    try {
      const result = await sendDiscord(deps.fetch, discordWebhookUrl, buildDiscordPayload(post, { subreddit: deps.subreddit }), { sleep: deps.sleep });
      if (result.ok) return true;
      log('warn', `Discord HTTP ${result.status} (${post.id})`);
    } catch (err) {
      log('warn', `Discord hiba (${post.id}): ${String(err)}`);
    }
    await store.release(key); // hogy az újrapróbálás újra elküldhesse
    return false;
  }

  /** Egy poszt feldolgozása (friss adatokkal). `done=false` -> pending listára kerül. */
  async function process(id: string, raws: unknown[], extra: { isNsfw?: unknown; isSpoiler?: unknown }, opts: ProcessOptions): Promise<Outcome> {
    const classified = classifyPost(sourcesOf(...raws), extra);

    if (classified.kind === 'skip') {
      log('info', `kihagyva (${id}): ${classified.reason}`);
      return { done: true, note: `skip: ${classified.reason}` };
    }

    if (classified.kind === 'hide') {
      // A Worker az `over_18: true` bejegyzést elrejti és az archívumból is törli.
      const status = await ingest([{ id: classified.id, over_18: true, spoiler: classified.reason === 'spoiler' }]);
      return { done: status !== 'failed', note: `hide (${classified.reason}): ingest ${status}` };
    }

    const { post, expectsImages } = classified;
    let note = '';
    let done = true;

    if (post.images.length > 0) {
      const status = await ingest([post]);
      note += `ingest ${status}`;
      if (status === 'failed') done = false;
    } else {
      note += expectsImages ? 'nincs még kép' : 'nincs kép (szöveges poszt)';
    }

    if (opts.announce) {
      const waitingForImages = expectsImages && post.images.length === 0 && !opts.final;
      if (waitingForImages) {
        done = false;
        note += '; Discord vár a képekre';
      } else {
        const sent = await announceOnce(post);
        note += `; Discord ${sent ? 'ok' : 'hiba'}`;
        if (!sent) done = false;
      }
    }
    return { done, note };
  }

  async function fetchFresh(id: string): Promise<unknown | null> {
    try {
      return await deps.getPost(`t3_${id}`);
    } catch (err) {
      log('warn', `getPost sikertelen (${id}): ${String(err)}`);
      return null;
    }
  }

  async function track(id: string, outcome: Outcome, announce: boolean, attempts: number): Promise<void> {
    if (outcome.done) {
      await store.pendingDel(id);
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      log('error', `feladva ${MAX_ATTEMPTS} próbálkozás után (${id}): ${outcome.note}`);
      await store.pendingDel(id);
      return;
    }
    await store.pendingPut(id, { attempts, announce });
  }

  return {
    /**
     * Új vagy módosult poszt eseménye. `announce`: csak az új poszt (onPostSubmit) eseményénél igaz.
     * A kivétel sosem szivárog ki (a trigger ne hibázzon), a poszt inkább a pending listára kerül.
     */
    async handleUpsert(payload: { post?: unknown; postId?: unknown; isNsfw?: unknown; isSpoiler?: unknown }, announce: boolean): Promise<Outcome> {
      const rawPost = payload.post as { id?: unknown } | undefined;
      const id = normalizeId(rawPost?.id ?? payload.postId);
      if (!id) {
        log('warn', 'upsert: nincs poszt-azonosító az eseményben');
        return { done: true, note: 'skip: nincs id' };
      }
      try {
        const fresh = await fetchFresh(id);
        // A friss lekérés az elsődleges, az eseménytöltet kiegészíti (a jelölők közül bármelyik "igen" elrejt).
        const outcome = await process(id, [fresh, payload.post], { isNsfw: payload.isNsfw, isSpoiler: payload.isSpoiler }, { announce, final: false });
        log('info', `poszt ${id}: ${outcome.note}`);
        await track(id, outcome, announce, 1);
        return outcome;
      } catch (err) {
        log('error', `upsert hiba (${id}): ${String(err)}`);
        await store.pendingPut(id, { attempts: 1, announce });
        return { done: false, note: 'hiba' };
      }
    },

    /** Törölt poszt: végleg rejtett lesz a galériában. */
    async handleRemove(rawId: unknown): Promise<Outcome> {
      const id = normalizeId(rawId);
      if (!id) return { done: true, note: 'skip: nincs id' };
      await store.pendingDel(id);
      const status = await ingest([], [id]);
      if (status === 'failed') {
        // Egyszerű újrapróbálás: a pending-ben "remove" nem szerepel, ezért itt csak naplózunk.
        log('error', `a törlés (${id}) nem jutott el a Workerhez`);
      }
      return { done: status !== 'failed', note: `remove: ingest ${status}` };
    },

    /** Cron: a függőben lévő posztok újrapróbálása. */
    async retryPending(): Promise<{ tried: number; done: number }> {
      const all = await store.pendingAll();
      let done = 0;
      const ids = Object.keys(all);
      for (const id of ids) {
        const entry = all[id];
        const attempts = entry.attempts + 1;
        const final = attempts >= MAX_ATTEMPTS;
        try {
          const fresh = await fetchFresh(id);
          if (fresh === null) {
            await track(id, { done: false, note: 'a poszt nem érhető el' }, entry.announce, attempts);
            continue;
          }
          const outcome = await process(id, [fresh], {}, { announce: entry.announce, final });
          log('info', `újrapróba ${id} (#${attempts}): ${outcome.note}`);
          if (outcome.done) done++;
          await track(id, outcome, entry.announce, attempts);
        } catch (err) {
          log('error', `újrapróba hiba (${id}): ${String(err)}`);
          await track(id, { done: false, note: 'hiba' }, entry.announce, attempts);
        }
      }
      return { tried: ids.length, done };
    },

    /** Moderátori menü: az utolsó posztok szinkronja Discord-értesítés NÉLKÜL. */
    async backfill(limit = INGEST_BATCH): Promise<{ sent: number; hidden: number; skipped: number; status: string }> {
      const listed = await deps.listNewPosts(Math.min(limit, INGEST_BATCH));
      const entries: IngestEntry[] = [];
      let hidden = 0;
      let skipped = 0;
      for (const item of listed) {
        let classified = classifyPost(sourcesOf(item));
        // A listázott posztból néha hiányzik a képadat: ilyenkor egyenként lekérjük.
        if (classified.kind === 'ok' && classified.expectsImages && classified.post.images.length === 0) {
          const fresh = await fetchFresh(classified.post.id);
          if (fresh) classified = classifyPost(sourcesOf(fresh, item));
        }
        if (classified.kind === 'hide') {
          hidden++;
          entries.push({ id: classified.id, over_18: true, spoiler: classified.reason === 'spoiler' });
        } else if (classified.kind === 'ok' && classified.post.images.length > 0) {
          entries.push(classified.post);
        } else {
          skipped++;
        }
      }
      if (!entries.length) return { sent: 0, hidden, skipped, status: 'nothing' };
      const status = await ingest(entries);
      return { sent: entries.length - hidden, hidden, skipped, status };
    },
  };
}
