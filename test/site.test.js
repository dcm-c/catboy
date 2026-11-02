// Az oldal szerkezeti ellenőrzései: űrlapkapu, GYIK, vélemények, lábléc, témakapcsoló, egységes könyvtár-verziók.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pub = path.join(__dirname, '..', 'public');
const read = f => fs.readFileSync(path.join(pub, f), 'utf8');
const PAGES = ['index', 'events', 'fogalom', 'gallery', 'rules', 'privacy', 'eletut'];

test('minden Formspree-űrlap az adatkezelési kapun megy át', () => {
    for (const f of fs.readdirSync(pub).filter(x => x.endsWith('.html'))) {
        const html = read(f);
        for (const m of html.matchAll(/<form\b[^>]*formspree[^>]*>/g)) {
            assert.ok(/data-privacy-gate/.test(m[0]), f + ': kapu nélküli űrlap: ' + m[0]);
        }
    }
    assert.ok(/data-privacy-gate/.test(read('index.html')) && /privacy-gate\.js/.test(read('index.html')));
    assert.ok(/data-privacy-gate/.test(read('rules.html')) && /privacy-gate\.js/.test(read('rules.html')));
});

test('az uwu.js a theme.js előtt töltődik, minden oldalon', () => {
    for (const p of PAGES) {
        const h = read(p + '.html');
        const a = h.indexOf('src="uwu.js"'), b = h.indexOf('src="theme.js"');
        assert.ok(a > 0 && b > a, p + ': uwu.js a theme.js előtt kell');
    }
});

test('a lábléc UwU gombja kerek és színes szegélyű, és ott az AI-slop felirat', () => {
    const f = read('footer.html');
    assert.ok(/id="btn-uwu-mode"[^>]*btn-uwu/.test(f.replace(/\s+/g, ' ')));
    assert.ok(!/border-image/.test(f), 'a border-image eltüntetné a lekerekítést');
    assert.ok(/AI slop és vibe kódolt/.test(f));
    const css = read('style.css');
    assert.ok(/#btn-uwu-mode\.btn-uwu\s*\{[^}]*border-radius:\s*999px/.test(css));
});

test('a buzi módot csak a lábléc kapcsolja be: a navigációs gomb csak világos és sötét között vált', () => {
    const t = read('theme.js');
    assert.ok(/function nextTheme\(\)/.test(t));
    assert.ok(/return current === 'light' \? 'dark' : 'light'/.test(t));
    assert.ok(!/THEMES\.length\)\]\.id, true\)/.test(t), 'a ciklus ne járja be a buzi módot');
    assert.ok(/#btn-uwu-mode/.test(t));
});

test('az Életút oldal tetején nagy AI-slop figyelmeztetés áll', () => {
    const h = read('eletut.html');
    const banner = h.indexOf('slop-banner');
    assert.ok(banner > 0 && banner < h.indexOf('<h1'), 'a banner a cím előtt legyen');
    assert.ok(/AI slop, vibe kódolt játék/.test(h));
});

test('GYIK: a látható kérdések és a JSON-LD egyezik, a kérdések UwU-mentesek', () => {
    const h = read('index.html');
    const items = [...h.matchAll(/class="accordion-item[^"]*faq-item"/g)].length;
    const ld = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const faq = ld['@graph'].find(x => x['@type'] === 'FAQPage').mainEntity;
    assert.equal(items, faq.length);
    assert.ok(items >= 6 && items <= 10, 'a GYIK legyen tömör: ' + items + ' kérdés');
    assert.ok(!/id="faq-search"/.test(h), 'nincs külön kereső a rövid listához');
    assert.equal([...h.matchAll(/class="accordion-button[^"]*faq-question"[^>]*data-no-uwu/g)].length, items);
    for (const q of faq) assert.ok(h.includes(q.name.replace(/&/g, '&amp;')) || h.includes(q.name), 'hiányzó kérdés: ' + q.name);
});

test('vélemények: 5 fájl, mind érvényes, mezőik rendben', () => {
    for (let i = 0; i < 5; i++) {
        const d = JSON.parse(read('data/reviews' + i + '.json'));
        assert.ok(d.length >= 9, 'reviews' + i);
        for (const r of d) {
            assert.ok(r.name && r.title && r.desc && /^\d{4}\.\d{2}\.\d{2}\.$/.test(r.date), JSON.stringify(r));
            assert.ok(r.stars >= 1 && r.stars <= 5);
        }
    }
    assert.ok(/Math\.random\(\) \* 5\)\}\.json/.test(read('script.js')));
});

test('a Programok oldalon van 444-es hivatkozás, és a discord gaming esték ki vannak húzva', () => {
    const h = read('events.html');
    assert.ok(/https:\/\/444\.hu\/2026\/03\/15\//.test(h));
    assert.ok(/class="lie-stamp">Ez aljas hazugság/.test(h));
    assert.ok(/class="struck"/.test(h));
});

test('a tüntetés híre csak a Programok oldalon van, a galériában nincs sajtó', () => {
    const h = read('gallery.html');
    assert.ok(!/data-filter="press"/.test(h) && !/gallery-col press/.test(h) && !/444\.hu/.test(h));
    assert.ok(/class="btn-444"/.test(read('events.html')));
});

test('a lábléc lapos sáv (nem kártya), benne az UwU gomb és az AI-slop felirat', () => {
    const f = read('footer.html');
    assert.ok(/class="site-footer/.test(f) && !/custom-card/.test(f));
    assert.ok(/class="slop-footer/.test(f));
});

test('a kártyák nem mind azonos kinézetűek: van színátmenetes, egyszínű, szaggatott és oldalsávos változat', () => {
    const css = read('style.css');
    assert.ok(/border: 3px solid #5bcefa/.test(css));
    assert.ok(/border: 3px dashed #f5a9b8/.test(css));
    assert.ok(/border-left: 10px solid #c9a7ff/.test(css));
    assert.ok(/var\(--card-edge\) border-box/.test(css));
});

test('egységes könyvtár-verziók minden oldalon', () => {
    const versions = new Set(), fa = new Set();
    for (const p of PAGES) {
        const h = read(p + '.html');
        for (const m of h.matchAll(/bootstrap@([\d.]+)/g)) versions.add(m[1]);
        for (const m of h.matchAll(/font-awesome\/([\d.]+)/g)) fa.add(m[1]);
    }
    assert.equal(versions.size, 1, 'bootstrap verziók: ' + [...versions]);
    assert.equal(fa.size, 1, 'font-awesome verziók: ' + [...fa]);
});

test('az adatkezelési tájékoztató említi az unban-kérelmet és az olvasás igazolását', () => {
    const h = read('privacy.html');
    assert.ok(/Unban-kérelem/.test(h) && /sessionStorage/.test(h));
});

test('a femboy fogalom oldal befogadó szöveget tartalmaz és nem "NEM ..." címkékkel tagadja a közösségeket', () => {
    const h = read('fogalom.html');
    assert.ok(/Ki lehet femboy/.test(h));
    assert.ok(!/NEM Transzneműség|NEM Sissy|NEM Crossdresser/.test(h));
    assert.ok(/nem bináris/i.test(h));
});

test('Programok és Fogalom: minden kártya a tartalmához illő (data-tone) keretet kap, a tónusok definiáltak', () => {
    const css = read('style.css');
    for (const f of ['events.html', 'fogalom.html']) {
        const h = read(f);
        const cards = [...h.matchAll(/<div class="(?:card h-100|highlight-box)[^"]*"([^>]*)>/g)];
        assert.ok(cards.length >= 4, f);
        for (const c of cards) assert.match(c[1], /data-tone="(blue|red|green|cyan|slate|pink|purple|trans)"/, f + ': tónus nélküli kártya');
        for (const t of new Set([...h.matchAll(/data-tone="(\w+)"/g)].map(m => m[1]))) {
            assert.ok(css.includes('[data-tone="' + t + '"]'), 'nincs CSS a tónushoz: ' + t);
        }
    }
});

// ---------- SEO ----------
const SEO_PAGES = ['index', 'rules', 'events', 'gallery', 'eletut', 'ertektest', 'privacy', 'fogalom'];
const urlOf = p => 'https://femboy.hu' + (p === 'index' ? '/' : '/' + p);

test('seo: minden indexelhető oldalnak egyedi címe, leírása, canonical-ja és közösségi-megosztási adata van', () => {
    const titles = new Set(), descs = new Set();
    for (const p of SEO_PAGES) {
        const h = read(p + '.html');
        const title = (h.match(/<title>(.*?)<\/title>/s) || [])[1];
        const desc = (h.match(/<meta name="description"\s+content="(.*?)"/s) || [])[1];
        assert.ok(title && title.length >= 20 && title.length <= 80, p + ': a cím hossza');
        assert.ok(desc && desc.replace(/\s+/g, ' ').length >= 70 && desc.length <= 300, p + ': a leírás hossza');
        assert.ok(!titles.has(title) && !descs.has(desc), p + ': a cím/leírás nem egyedi');
        titles.add(title); descs.add(desc);
        assert.ok(h.includes('<link rel="canonical" href="' + urlOf(p) + '">'), p + ': canonical');
        assert.ok(h.includes('<meta property="og:url" content="' + urlOf(p) + '">'), p + ': og:url');
        assert.ok(/og:image" content="https:\/\/femboy\.hu\/imgs\/og-mfsz\.jpg"/.test(h), p + ': og:image');
        assert.ok(/name="twitter:card"/.test(h) && /rel="icon"/.test(h), p + ': twitter/favicon');
        assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, p + ': pontosan egy h1');
        assert.ok(!/noindex/.test(h), p + ': nem lehet noindex');
    }
});

test('seo: a sitemap az átirányítás nélküli címeket sorolja, és minden indexelhető oldal benne van', () => {
    const sm = read('sitemap.xml');
    const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    assert.deepEqual(new Set(locs), new Set(SEO_PAGES.map(urlOf)));
    assert.ok(!locs.some(l => /\.html$/.test(l)), 'a .html-es cím átirányít');
    const robots = read('robots.txt');
    assert.ok(/Sitemap: https:\/\/femboy\.hu\/sitemap\.xml/.test(robots));
    assert.ok(!/Disallow: \/api/.test(robots), 'a galéria az /api/reddit-ből tölt, a keresőnek is elérhetőnek kell lennie');
});

test('seo: a strukturált adatok a valódi domainre mutatnak, és érvényes JSON-ok', () => {
    for (const p of SEO_PAGES) {
        const h = read(p + '.html');
        const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        assert.ok(blocks.length >= 1, p + ': nincs strukturált adat');
        for (const b of blocks) JSON.parse(b[1]);
        assert.ok(!/magyarfemboy\.hu/.test(h), p + ': rossz domain');
    }
});

test('seo: a menü JS nélkül is bejárható (noscript), a belső linkek nem .html-re mutatnak', () => {
    for (const p of SEO_PAGES) {
        const h = read(p + '.html');
        assert.ok(/<noscript><nav aria-label="Főmenü"[\s\S]*?href="\/fogalom"[\s\S]*?<\/noscript>/.test(h), p + ': noscript menü');
        assert.ok(!/href="[a-z0-9-]+\.html[#"]/.test(h), p + ': .html-s belső link');
    }
    assert.ok(!/href="[a-z0-9-]+\.html/.test(read('navbar.html') + read('footer.html')));
});

test('seo: a 404-oldal noindex, a statikus fejlécek és az OG-kép megvannak', () => {
    assert.ok(/noindex/.test(read('404.html')));
    assert.ok(/"not_found_handling":\s*"404-page"/.test(fs.readFileSync(path.join(pub, '..', 'wrangler.jsonc'), 'utf8')));
    assert.ok(/Cache-Control/.test(read('_headers')));
    assert.ok(fs.statSync(path.join(pub, 'imgs', 'og-mfsz.jpg')).size > 10000);
});
