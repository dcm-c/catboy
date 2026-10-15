import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyPost, sourcesOf } from '../src/server/lib/post.ts';

const base = { id: 't3_abc123', title: 'Szia', authorName: 'valaki', permalink: '/r/x/comments/abc123/szia/', createdAt: new Date('2026-10-14T10:00:00Z') };

test('egyképes poszt: i.redd.it url', () => {
  const c = classifyPost(sourcesOf({ ...base, nsfw: false, url: 'https://i.redd.it/a.jpeg' }));
  assert.equal(c.kind, 'ok');
  if (c.kind !== 'ok') return;
  assert.equal(c.post.id, 'abc123');
  assert.equal(c.post.created, 1791972000);
  assert.deepEqual(c.post.images, [{ thumb: 'https://i.redd.it/a.jpeg', full: 'https://i.redd.it/a.jpeg' }]);
  assert.equal(c.post.over_18, false);
  assert.equal(c.expectsImages, true);
});

test('galéria: media_metadata + gallery_data sorrend, &amp; dekódolás, 640px előnézet', () => {
  const raw = {
    ...base, isNsfw: false, url: 'https://www.reddit.com/gallery/abc123',
    gallery_data: { items: [{ media_id: 'b' }, { media_id: 'a' }] },
    media_metadata: {
      a: { status: 'valid', s: { u: 'https://preview.redd.it/a.jpg?width=3000&amp;s=1' }, p: [{ x: 320, u: 'https://preview.redd.it/a.jpg?width=320&amp;s=2' }, { x: 640, u: 'https://preview.redd.it/a.jpg?width=640&amp;s=3' }] },
      b: { status: 'valid', s: { u: 'https://preview.redd.it/b.jpg?s=4' }, p: [] },
      c: { status: 'failed', s: { u: 'https://preview.redd.it/c.jpg?s=5' } },
    },
  };
  const c = classifyPost(sourcesOf(raw));
  assert.equal(c.kind, 'ok');
  if (c.kind !== 'ok') return;
  assert.deepEqual(c.post.images.map((i) => i.full), ['https://preview.redd.it/b.jpg?s=4', 'https://preview.redd.it/a.jpg?width=3000&s=1']);
  assert.equal(c.post.images[1].thumb, 'https://preview.redd.it/a.jpg?width=640&s=3');
});

test('galéria tömbként (Devvit-stílus), idegen host elhagyva', () => {
  const c = classifyPost(sourcesOf({ ...base, nsfw: false, gallery: [{ url: 'https://i.redd.it/1.png' }, 'https://i.redd.it/2.png', { url: 'https://evil.example/3.png' }, { url: 'http://i.redd.it/4.png' }] }));
  assert.equal(c.kind, 'ok');
  if (c.kind !== 'ok') return;
  assert.deepEqual(c.post.images.map((i) => i.full), ['https://i.redd.it/1.png', 'https://i.redd.it/2.png']);
});

test('preview.images fallback', () => {
  const c = classifyPost(sourcesOf({ ...base, over_18: false, preview: { images: [{ source: { url: 'https://external-preview.redd.it/x.jpg?s=1' }, resolutions: [{ width: 320, url: 'https://external-preview.redd.it/x.jpg?w=320' }, { width: 640, url: 'https://external-preview.redd.it/x.jpg?w=640' }] }] } }));
  assert.equal(c.kind, 'ok');
  if (c.kind !== 'ok') return;
  assert.equal(c.post.images[0].thumb, 'https://external-preview.redd.it/x.jpg?w=640');
});

test('NSFW bármelyik forrásban -> hide (fail-closed)', () => {
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: true, url: 'https://i.redd.it/a.jpeg' })).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false }, { id: 'abc123', isNsfw: true })).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false }), { isNsfw: true }).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: 'yes' as unknown as boolean })).kind, 'hide');
});

test('spoiler / eltávolított / törölt -> hide', () => {
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false, spoiler: true })).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false, isSpoiler: false }), { isSpoiler: true }).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false, removedByCategory: 'moderator' })).kind, 'hide');
  assert.equal(classifyPost(sourcesOf({ ...base, nsfw: false, authorName: '[deleted]' })).kind, 'hide');
});

test('ismeretlen NSFW-állapot -> skip, nem küldünk semmit', () => {
  const c = classifyPost(sourcesOf({ ...base, url: 'https://i.redd.it/a.jpeg' }));
  assert.equal(c.kind, 'skip');
});

test('hibás id -> skip', () => {
  assert.equal(classifyPost(sourcesOf({ nsfw: false, id: '../x' })).kind, 'skip');
  assert.equal(classifyPost([]).kind, 'skip');
});

test('toJSON() eredménye is forrás (Devvit-osztály)', () => {
  class FakePost { get id() { return 't3_abc123'; } toJSON() { return { nsfw: false, title: 'T', url: 'https://i.redd.it/z.jpg', authorName: 'u_ser' }; } }
  const c = classifyPost(sourcesOf(new FakePost()));
  assert.equal(c.kind, 'ok');
  if (c.kind === 'ok') assert.equal(c.post.title, 'T');
});

test('képre váró poszt: expectsImages igaz, images üres', () => {
  const c = classifyPost(sourcesOf({ ...base, nsfw: false, isGallery: true }));
  assert.equal(c.kind, 'ok');
  if (c.kind !== 'ok') return;
  assert.equal(c.expectsImages, true);
  assert.equal(c.post.images.length, 0);
});

test('szöveges poszt nem vár képre', () => {
  const c = classifyPost(sourcesOf({ ...base, nsfw: false, url: 'https://www.reddit.com/r/x/comments/abc123/szia/' }));
  assert.equal(c.kind, 'ok');
  if (c.kind === 'ok') assert.equal(c.expectsImages, false);
});

test('legfeljebb 20 kép', () => {
  const gallery = Array.from({ length: 30 }, (_, i) => `https://i.redd.it/${i}.png`);
  const c = classifyPost(sourcesOf({ ...base, nsfw: false, gallery }));
  assert.equal(c.kind, 'ok');
  if (c.kind === 'ok') assert.equal(c.post.images.length, 20);
});
