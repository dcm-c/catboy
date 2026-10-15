import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDiscordPayload, escapeMarkdown, isValidWebhookUrl, sendDiscord, type FetchLike } from '../src/server/lib/discord.ts';
import type { IngestPost } from '../src/server/lib/post.ts';

const img = (n: number) => ({ thumb: `https://i.redd.it/${n}.jpg`, full: `https://i.redd.it/${n}.jpg` });
const post = (n: number, extra: Partial<IngestPost> = {}): IngestPost => ({
  id: 'abc123', title: 'Cím *dőlt* @everyone', author: 'valaki', permalink: '/r/x/comments/abc123/cim/', created: 1791972000, over_18: false, spoiler: false, images: Array.from({ length: n }, (_, i) => img(i + 1)), ...extra,
});
const HOOK = 'https://discord.com/api/webhooks/123456789/abc_DEF-ghi';

test('webhook URL validáció', () => {
  assert.ok(isValidWebhookUrl(HOOK));
  assert.ok(isValidWebhookUrl(HOOK + '?thread_id=1'));
  for (const bad of ['http://discord.com/api/webhooks/1/a', 'https://evil.example/api/webhooks/1/a', 'https://discord.com.evil.example/api/webhooks/1/a', 'https://u:p@discord.com/api/webhooks/1/a', 'https://discord.com/api/webhooks/x/a', 'https://discord.com/api/other', '', null, 5]) {
    assert.equal(isValidWebhookUrl(bad), false, String(bad));
  }
});

test('galéria: azonos url-lel, első embed hordozza a szöveget, max 4 kép', () => {
  const p = buildDiscordPayload(post(7));
  assert.equal(p.embeds.length, 4);
  const link = 'https://www.reddit.com/r/x/comments/abc123/cim/';
  assert.ok(p.embeds.every((e) => e.url === link));
  assert.ok(p.embeds.every((e, i) => e.image?.url === `https://i.redd.it/${i + 1}.jpg`));
  assert.ok(p.embeds[0].title && p.embeds[0].author && p.embeds[0].footer);
  assert.equal(p.embeds[1].title, undefined);
  assert.match(p.embeds[0].description!, /7 kép/);
  assert.match(p.embeds[0].description!, /\+3 további/);
  assert.equal(p.embeds[0].timestamp, '2026-10-14T10:00:00.000Z');
});

test('egyképes kártya és szöveges poszt', () => {
  assert.equal(buildDiscordPayload(post(1)).embeds.length, 1);
  assert.equal(buildDiscordPayload(post(1)).embeds[0].description, undefined);
  const text = buildDiscordPayload(post(0));
  assert.equal(text.embeds.length, 1);
  assert.equal(text.embeds[0].image, undefined);
});

test('nincs pingelés, markdown és @ escape-elve, hosszú cím vágva', () => {
  const p = buildDiscordPayload(post(1, { title: 'x'.repeat(400) }));
  assert.deepEqual(p.allowed_mentions, { parse: [] });
  assert.ok(Array.from(p.embeds[0].title!).length <= 256);
  assert.equal(escapeMarkdown('*a* _b_ @everyone'), '\\*a\\* \\_b\\_ @​everyone');
});

test('érvénytelen szerzőnév nem lesz link', () => {
  const p = buildDiscordPayload(post(1, { author: 'Ismeretlen szerző' }));
  assert.equal(p.embeds[0].author!.url, undefined);
});

test('sendDiscord: siker, 429 újrapróba, érvénytelen URL', async () => {
  const calls: string[] = [];
  const ok: FetchLike = async (url) => { calls.push(url); return { ok: true, status: 204, text: async () => '' }; };
  assert.deepEqual(await sendDiscord(ok, HOOK, buildDiscordPayload(post(1))), { ok: true, status: 204, retried: false });

  let n = 0;
  const limited: FetchLike = async () => (++n === 1 ? { ok: false, status: 429, text: async () => '{"retry_after":0.5}' } : { ok: true, status: 204, text: async () => '' });
  const slept: number[] = [];
  const r = await sendDiscord(limited, HOOK, buildDiscordPayload(post(1)), { sleep: async (ms) => { slept.push(ms); } });
  assert.deepEqual(r, { ok: true, status: 204, retried: true });
  assert.deepEqual(slept, [500]);

  const long: FetchLike = async () => ({ ok: false, status: 429, text: async () => '{"retry_after":60}' });
  assert.equal((await sendDiscord(long, HOOK, buildDiscordPayload(post(1)), { sleep: async () => {} })).ok, false);

  const before = calls.length;
  assert.equal((await sendDiscord(ok, 'https://evil.example/x', buildDiscordPayload(post(1)))).status, 0);
  assert.equal(calls.length, before, 'érvénytelen URL-re nem megy kérés');
});
