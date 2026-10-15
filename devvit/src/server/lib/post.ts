// =========================================================
// Reddit-poszt  ->  femboy.hu ingest formátum
//
// Tiszta függvények, semmi platformfüggés (nincs Devvit-import), ezért Node-ban tesztelhető.
//
// A Devvit Post-objektum pontos mezőnevei verziónként változhatnak, ezért az olvasás
// VÉDEKEZŐ: több lehetséges mezőnevet is megnéz (camelCase és a Reddit nyers snake_case-e).
// A biztonsági szabály viszont szigorú és nem lazítható:
//   - NSFW / spoiler / eltávolított / törölt poszt  -> "hide" (a Worker elrejti)
//   - ha az NSFW-állapot nem állapítható meg egyértelműen -> "skip" (nem küldünk semmit)
// =========================================================

export type IngestImage = { thumb: string; full: string };

export type IngestPost = {
  id: string;
  title: string;
  author: string;
  permalink: string;
  created: number; // unix másodperc
  over_18: false;
  spoiler: false;
  images: IngestImage[];
};

export type Classified =
  | { kind: 'ok'; post: IngestPost; expectsImages: boolean }
  | { kind: 'hide'; id: string; reason: string }
  | { kind: 'skip'; reason: string };

// Ugyanaz a lista, mint a Worker src/index.js-ében (IMAGE_HOSTS): máshonnan érkező kép úgyis elutasításra kerülne.
export const IMAGE_HOSTS = new Set(['preview.redd.it', 'i.redd.it', 'external-preview.redd.it', 'i.redditmedia.com']);
export const MAX_IMAGES = 20;

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A nyers objektum + a toJSON() eredménye (a Devvit osztályai ezt kínálják), egy listában. */
export function sourcesOf(...raws: unknown[]): Rec[] {
  const out: Rec[] = [];
  for (const raw of raws) {
    if (!isRec(raw)) continue;
    out.push(raw);
    const toJSON = (raw as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') {
      try {
        const json = (toJSON as () => unknown).call(raw);
        if (isRec(json)) out.push(json);
      } catch {
        /* a nyers objektum így is megvan */
      }
    }
  }
  return out;
}

function first(sources: Rec[], keys: string[]): unknown {
  for (const s of sources) {
    for (const k of keys) {
      const v = s[k];
      if (v !== undefined && v !== null) return v;
    }
  }
  return undefined;
}

/**
 * Jelölő (NSFW / spoiler) állapota több forrásból.
 * Fail-closed: bármi, ami nem `false`/hiányzó, igaznak számít; csak ha legalább egy forrás
 * kifejezetten `false`-t mond és más nem ellentmond, akkor biztonságos.
 */
function flagState(sources: Rec[], names: string[], extra: unknown[]): boolean | undefined {
  let sawFalse = false;
  const values: unknown[] = [...extra];
  for (const s of sources) for (const n of names) values.push(s[n]);
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (v === false) sawFalse = true;
    else return true;
  }
  return sawFalse ? false : undefined;
}

function anyTruthy(sources: Rec[], names: string[]): boolean {
  return sources.some((s) => names.some((n) => Boolean(s[n])));
}

export function normalizeId(raw: unknown): string {
  const id = String(raw ?? '').replace(/^t3_/i, '').trim().toLowerCase();
  return /^[a-z0-9]{3,12}$/.test(id) ? id : '';
}

function toSeconds(v: unknown): number {
  let ms: number;
  if (v instanceof Date) ms = v.getTime();
  else if (typeof v === 'number') ms = v > 1e11 ? v : v * 1000;
  else if (typeof v === 'string' && v.trim() !== '') ms = /^\d+(\.\d+)?$/.test(v.trim()) ? toSeconds(Number(v)) * 1000 : Date.parse(v);
  else return 0;
  return Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
}

function decodeAmp(s: string): string {
  return s.replace(/&amp;/g, '&');
}

/** Csak https-es, engedélyezett Reddit-képhosztos URL. */
export function cleanImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(decodeAmp(raw.trim()));
    return url.protocol === 'https:' && IMAGE_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function urlOf(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (!isRec(v)) return undefined;
  for (const k of ['url', 'u', 'src', 'gif']) if (typeof v[k] === 'string') return v[k] as string;
  if (isRec(v.source)) return urlOf(v.source);
  return undefined;
}

function pushImage(list: IngestImage[], thumbRaw: unknown, fullRaw: unknown): void {
  const full = cleanImageUrl(fullRaw);
  if (!full || list.some((i) => i.full === full)) return;
  list.push({ thumb: cleanImageUrl(thumbRaw) ?? full, full });
}

// Reddit nyers formátuma: media_metadata {id: {s:{u}, p:[{u,x}]}} + gallery_data.items sorrend.
function fromMetadata(sources: Rec[]): IngestImage[] {
  const list: IngestImage[] = [];
  const meta = first(sources, ['media_metadata', 'mediaMetadata']);
  if (!isRec(meta)) return list;
  const galleryData = first(sources, ['gallery_data', 'galleryData']);
  const items = isRec(galleryData) && Array.isArray(galleryData.items) ? galleryData.items : [];
  const order = items.map((i) => (isRec(i) ? String(i.media_id ?? i.mediaId ?? '') : '')).filter(Boolean);
  const keys = order.length ? order.filter((k) => k in meta) : Object.keys(meta);
  for (const key of keys) {
    const m = meta[key];
    if (!isRec(m) || (m.status !== undefined && m.status !== 'valid')) continue;
    const s = isRec(m.s) ? m.s : {};
    const previews = Array.isArray(m.p) ? m.p.filter(isRec) : [];
    // a ~640 px körüli előnézet: az első, ami legalább 600 széles, különben a legnagyobb
    const thumb = previews.find((p) => Number(p.x) >= 600) ?? previews[previews.length - 1];
    pushImage(list, urlOf(thumb), urlOf(s));
    if (list.length >= MAX_IMAGES) break;
  }
  return list;
}

function fromGallery(sources: Rec[]): IngestImage[] {
  const list: IngestImage[] = [];
  const gallery = first(sources, ['gallery', 'galleryMedia', 'galleryImages']);
  if (!Array.isArray(gallery)) return list;
  for (const item of gallery) {
    pushImage(list, isRec(item) ? urlOf(item.thumbnail) ?? urlOf(item.preview) : undefined, urlOf(item));
    if (list.length >= MAX_IMAGES) break;
  }
  return list;
}

function fromPreview(sources: Rec[]): IngestImage[] {
  const list: IngestImage[] = [];
  const preview = first(sources, ['preview']);
  const images = isRec(preview) && Array.isArray(preview.images) ? preview.images : [];
  for (const img of images) {
    if (!isRec(img)) continue;
    const resolutions = Array.isArray(img.resolutions) ? img.resolutions.filter(isRec) : [];
    const thumb = resolutions.find((r) => Number(r.width) >= 600) ?? resolutions[resolutions.length - 1];
    pushImage(list, urlOf(thumb), urlOf(img.source));
    if (list.length >= MAX_IMAGES) break;
  }
  return list;
}

function fromUrl(sources: Rec[]): IngestImage[] {
  const list: IngestImage[] = [];
  const thumb = first(sources, ['thumbnail']);
  pushImage(list, urlOf(thumb), first(sources, ['url']));
  return list;
}

export function extractImages(sources: Rec[]): IngestImage[] {
  for (const fn of [fromMetadata, fromGallery, fromPreview, fromUrl]) {
    const list = fn(sources);
    if (list.length) return list.slice(0, MAX_IMAGES);
  }
  return [];
}

/** Képes / galériás posztnak tűnik-e (akkor is, ha a képadatok még nem készültek el). */
export function looksLikeImagePost(sources: Rec[]): boolean {
  if (anyTruthy(sources, ['isGallery', 'is_gallery', 'isImage'])) return true;
  if (['gallery_data', 'galleryData', 'media_metadata', 'mediaMetadata', 'gallery', 'galleryMedia'].some((k) => first(sources, [k]) !== undefined)) return true;
  const hint = first(sources, ['postHint', 'post_hint']);
  if (hint === 'image' || hint === 'gallery') return true;
  const url = first(sources, ['url']);
  if (typeof url === 'string') {
    if (/^(https?:\/\/)?(www\.|old\.)?reddit\.com\/gallery\//i.test(url)) return true;
    if (cleanImageUrl(url)) return true;
  }
  return false;
}

function toPermalink(raw: unknown, id: string): string {
  if (typeof raw === 'string' && raw) {
    if (raw.startsWith('/')) return raw;
    try {
      const url = new URL(raw);
      if (/(^|\.)reddit\.com$/.test(url.hostname)) return url.pathname;
    } catch {
      /* alapértelmezett */
    }
  }
  return `/comments/${id}`;
}

function toAuthor(sources: Rec[]): string {
  const raw = first(sources, ['authorName', 'author_name', 'author']);
  if (typeof raw === 'string') return raw.replace(/^\/?u\//i, '');
  if (isRec(raw) && typeof raw.name === 'string') return raw.name;
  if (isRec(raw) && typeof raw.username === 'string') return raw.username;
  return '';
}

/**
 * Egy poszt (vagy több forrása: eseménytöltet, friss lekérés) besorolása.
 * `extra` az eseménytöltet felső szintű jelölői (isNsfw / isSpoiler), ha vannak.
 */
export function classifyPost(sources: Rec[], extra: { isNsfw?: unknown; isSpoiler?: unknown } = {}): Classified {
  const id = normalizeId(first(sources, ['id', 'postId', 'name']));
  if (!id) return { kind: 'skip', reason: 'hiányzó vagy érvénytelen poszt-azonosító' };

  const nsfw = flagState(sources, ['nsfw', 'isNsfw', 'over18', 'over_18'], [extra.isNsfw]);
  const spoiler = flagState(sources, ['spoiler', 'isSpoiler'], [extra.isSpoiler]);
  const author = toAuthor(sources);

  if (nsfw === true) return { kind: 'hide', id, reason: 'NSFW' };
  if (spoiler === true) return { kind: 'hide', id, reason: 'spoiler' };
  if (anyTruthy(sources, ['removed', 'isRemoved', 'deleted', 'isDeleted', 'removedByCategory', 'removed_by_category'])) {
    return { kind: 'hide', id, reason: 'eltávolított / törölt' };
  }
  if (author === '[deleted]') return { kind: 'hide', id, reason: 'törölt szerző' };
  if (nsfw === undefined) return { kind: 'skip', reason: 'az NSFW-állapot nem állapítható meg (fail-closed)' };

  const titleRaw = first(sources, ['title']);
  return {
    kind: 'ok',
    expectsImages: looksLikeImagePost(sources),
    post: {
      id,
      title: typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw : 'Reddit Poszt',
      author: author || 'Ismeretlen',
      permalink: toPermalink(first(sources, ['permalink']), id),
      created: toSeconds(first(sources, ['createdAt', 'created_utc', 'created'])),
      over_18: false,
      spoiler: false,
      images: extractImages(sources),
    },
  };
}
