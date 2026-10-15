// =========================================================
// Discord webhook: "kártya" (embed) új posztokhoz, galériatámogatással
//
// Galéria: a Discord az ugyanazzal az `url`-lel rendelkező embedeket egyetlen kártyává
// vonja össze, a képeket rácsban mutatja (legfeljebb 4-et). Az első embed hordozza a
// szöveget, a többi csak a képet. Ezért az első 4 képet küldjük, a többit a leírásban jelezzük.
//
// Biztonság: csak discord.com webhook-URL fogadható el (a Devvit amúgy is csak engedélyezett
// domainekre engedi a fetch-et), és a Discord semmilyen említést (@everyone, role) nem pingelhet.
// =========================================================

import type { IngestPost } from './post.ts';

export const EMBED_COLOR = 0xf5a9b8; // az oldal rózsaszínje
export const MAX_GALLERY_IMAGES = 4;
const REDDIT = 'https://www.reddit.com';

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export type DiscordEmbed = {
  title?: string;
  url: string;
  description?: string;
  color?: number;
  timestamp?: string;
  author?: { name: string; url?: string };
  footer?: { text: string };
  image?: { url: string };
};

export type DiscordPayload = {
  username: string;
  allowed_mentions: { parse: [] };
  embeds: DiscordEmbed[];
};

/** https://discord.com/api/webhooks/<id>/<token>  (opcionálisan ?thread_id=...) */
export function isValidWebhookUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw.trim());
    return (
      url.protocol === 'https:' &&
      url.hostname === 'discord.com' &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/** A Discord-markdown vezérlőkarakterei elé backslash kerül, így a cím nem formázódik és nem linkesedik. */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\*_~`|>[\]]/g, '\\$&').replace(/@/g, '@\u200b');
}

function clip(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : chars.slice(0, max - 1).join('') + '…';
}

export function buildDiscordPayload(post: IngestPost, opts: { subreddit?: string } = {}): DiscordPayload {
  const subreddit = (opts.subreddit || 'MagyarFemboyCommunity').replace(/^\/?r\//i, '');
  const link = REDDIT + post.permalink;
  const images = post.images.slice(0, MAX_GALLERY_IMAGES);
  const more = post.images.length - images.length;
  const validAuthor = /^[A-Za-z0-9_-]{3,20}$/.test(post.author);

  const lines: string[] = [];
  if (post.images.length > 1) lines.push(`🖼️ Galéria · ${post.images.length} kép`);
  if (more > 0) lines.push(`+${more} további kép a Redditen`);

  const first: DiscordEmbed = {
    title: clip(escapeMarkdown(post.title), 256),
    url: link,
    color: EMBED_COLOR,
    author: validAuthor ? { name: `u/${post.author}`, url: `${REDDIT}/user/${post.author}` } : { name: clip(escapeMarkdown(post.author), 256) },
    footer: { text: `r/${subreddit} · új poszt` },
  };
  if (lines.length) first.description = lines.join('\n');
  if (post.created > 0) first.timestamp = new Date(post.created * 1000).toISOString();
  if (images[0]) first.image = { url: images[0].full };

  // A további képek csak az azonos url + image párost kapják: a Discord ezekből rácsot rajzol.
  const rest: DiscordEmbed[] = images.slice(1).map((img) => ({ url: link, image: { url: img.full } }));

  return { username: 'MFSZ · Reddit', allowed_mentions: { parse: [] }, embeds: [first, ...rest] };
}

export type SendResult = { ok: boolean; status: number; retried: boolean };

/** Elküldi a payloadot; 429 esetén (rövid várakozás után) egyszer újrapróbálja. */
export async function sendDiscord(
  fetchFn: FetchLike,
  webhookUrl: string,
  payload: DiscordPayload,
  opts: { sleep?: (ms: number) => Promise<void> } = {},
): Promise<SendResult> {
  if (!isValidWebhookUrl(webhookUrl)) return { ok: false, status: 0, retried: false };
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const body = JSON.stringify(payload);

  const attempt = async () => {
    const signal = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(10_000) : undefined;
    return fetchFn(webhookUrl.trim(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal });
  };

  let res = await attempt();
  if (res.status !== 429) return { ok: res.ok, status: res.status, retried: false };

  let waitMs = 1000;
  try {
    const parsed = JSON.parse(await res.text()) as { retry_after?: number };
    if (typeof parsed.retry_after === 'number') waitMs = Math.ceil(parsed.retry_after * 1000);
  } catch {
    /* alapértelmezett várakozás */
  }
  if (waitMs > 5000) return { ok: false, status: 429, retried: false };
  await sleep(waitMs);
  res = await attempt();
  return { ok: res.ok, status: res.status, retried: true };
}
