// =========================================================
// MAGYAR FEMBOY SZAKSZERVEZET - KÖZPONTI SCRIPT
// (a témaváltó külön fájlban él: theme.js)
// =========================================================

// --- 1. GLOBÁLIS VÁLTOZÓK ---
let flatGalleryList = [];
let currentImageIndex = 0;

// LAPOZÁSI (PAGINÁCIÓ) VÁLTOZÓK
let loadedPostCount = 0;        // Hány poszt van eddig betöltve a galériába
let isFetchingReddit = false;   // Ne töltsön be duplán, ha nagyon gyorsan görgetsz
let redditExhausted = false;    // Minden poszt megjelent
let redditPostsPromise = null;  // A poszt-lista egyszer töltődik be, a főoldal és a galéria is ezt használja

const REDDIT_API_URL = '/api/reddit';
const REDDIT_BACKUP_URL = 'data/reddit_backup.json';
const REDDIT_BLOCKLIST_URL = 'data/hidden_posts.json';
const SUBREDDIT_URL = 'https://www.reddit.com/r/MagyarFemboyCommunity/';


// --- 2. INICIALIZÁLÁS ---
document.addEventListener('DOMContentLoaded', () => {
    loadComponents().then(() => {
        document.body.classList.add('loaded');
        initModal();
    });

    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) initGalleryPage(galleryGrid);

    const homeRedditBox = document.getElementById('reddit-content');
    if (homeRedditBox) {
        initHomePage(homeRedditBox);
        initFunnyReviews();
    }

    initPremiumButton();
    initCatInteraction();
    initEasterEggs();
});


// --- 3. SEGÉDFÜGGVÉNYEK ---

// Csak http(s) URL mehet tovább (a javascript: és hasonló sémák kiszűrése). Normalizált href-et ad vissza.
function safeHttpUrl(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
        const url = new URL(value, window.location.href);
        return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch (e) {
        return null;
    }
}

// A Reddit JSON a címeket HTML-entitásokkal kódolva adja (pl. "&gt;:3"). A textarea-trükk
// biztonságosan dekódolja őket, mert a textarea tartalma sosem fut le.
function decodeHtmlEntities(text) {
    const str = String(text == null ? '' : text);
    if (str.indexOf('&') === -1) return str;
    const box = document.createElement('textarea');
    box.innerHTML = str;
    return box.value;
}

function makeIcon(classes) {
    const icon = document.createElement('i');
    icon.className = classes;
    return icon;
}


// --- 4. REDDIT ADATOK BETÖLTÉSE ---
//
// Sorrend: 1. /api/reddit (a Worker: backup JSON + a Devvit-app által beküldött posztok, NSFW nélkül)
//          2. data/reddit_backup.json (ha a lap Worker nélkül fut, pl. helyi statikus szerveren)
function getParsedRedditData() {
    if (!redditPostsPromise) redditPostsPromise = loadRedditPosts();
    return redditPostsPromise;
}

async function loadRedditPosts() {
    try {
        const res = await fetch(REDDIT_API_URL, { headers: { 'Accept': 'application/json' } });
        if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
            const data = await res.json();
            if (Array.isArray(data)) {
                // A Worker már dekódolta az entitásokat, itt csak ellenőrizzük az alakot.
                const posts = data.map((post) => normalizeRedditPost(post, false)).filter(Boolean);
                if (posts.length > 0) return posts;
            }
        }
    } catch (error) {
        console.warn('⚠️ A /api/reddit nem elérhető, váltás a helyi backupra:', error);
    }

    return loadBackupPosts();
}

// Egy poszt ellenőrzése és egységes alakra hozása: {id, title, author, url, created, images:[{thumb, full}]}
function normalizeRedditPost(raw, decodeEntities) {
    if (!raw || typeof raw !== 'object') return null;

    const images = (Array.isArray(raw.images) ? raw.images : []).map((img) => {
        const thumb = safeHttpUrl(typeof img === 'string' ? img : img && img.thumb);
        const full = safeHttpUrl(typeof img === 'string' ? img : img && img.full);
        return thumb || full ? { thumb: thumb || full, full: full || thumb } : null;
    }).filter(Boolean);
    if (images.length === 0) return null;

    const text = (value, fallback) => {
        const str = String(value == null || value === '' ? fallback : value);
        return decodeEntities ? decodeHtmlEntities(str) : str;
    };
    return {
        id: String(raw.id || ''),
        title: text(raw.title, 'Reddit Poszt'),
        author: text(raw.author, 'Ismeretlen'),
        url: safeHttpUrl(raw.url) || SUBREDDIT_URL,
        created: Number(raw.created) || 0,
        images
    };
}

// Tartalék: a nyers Reddit-listázást (data/reddit_backup.json) dolgozza fel ugyanarra az alakra.
async function loadBackupPosts() {
    try {
        const res = await fetch(REDDIT_BACKUP_URL);
        if (!res.ok) throw new Error('Nem található a backup JSON fájl!');
        const rawData = await res.json();

        let blocked = new Set();
        try {
            const blockRes = await fetch(REDDIT_BLOCKLIST_URL);
            if (blockRes.ok) blocked = new Set((await blockRes.json()).map(String));
        } catch (e) { /* a tiltólista nem kötelező */ }

        let postsArray = [];
        if (rawData && rawData.kind === 'Listing' && rawData.data && rawData.data.children) {
            postsArray = rawData.data.children.map((child) => child.data);
        } else if (Array.isArray(rawData)) {
            postsArray = rawData;
        }

        const parsed = [];
        for (const post of postsArray) {
            if (!post) continue;
            // Eltávolított, rejtett, NSFW és spoileres posztok nem kerülnek a nyilvános galériába.
            if (post.removed_by_category || post.is_deleted || post.hidden || post.over_18 || post.spoiler) continue;
            if (blocked.has(String(post.id))) continue;

            const images = [];
            if (post.is_gallery && post.media_metadata) {
                for (const item of (post.gallery_data && post.gallery_data.items) || []) {
                    const media = post.media_metadata[item.media_id];
                    if (media && media.status === 'valid' && media.s && media.s.u) {
                        const full = decodeHtmlEntities(media.s.u);
                        let thumb = full;
                        // Kiskép kinyerése (kb. 640px felbontás)
                        if (media.p && media.p.length > 0) {
                            const mid = media.p[Math.min(3, media.p.length - 1)];
                            if (mid && mid.u) thumb = decodeHtmlEntities(mid.u);
                        }
                        images.push({ thumb, full });
                    }
                }
            } else if (post.preview && post.preview.images && post.preview.images.length > 0) {
                const imgData = post.preview.images[0];
                const full = decodeHtmlEntities(imgData.source.url);
                let thumb = full;
                if (imgData.resolutions && imgData.resolutions.length > 0) {
                    const mid = imgData.resolutions[Math.min(3, imgData.resolutions.length - 1)];
                    if (mid && mid.url) thumb = decodeHtmlEntities(mid.url);
                }
                images.push({ thumb, full });
            } else if (post.url && /\.(jpe?g|png|gif)$/i.test(post.url)) {
                images.push({ thumb: post.url, full: post.url });
            }

            const normalized = normalizeRedditPost({
                id: post.id,
                title: post.title,
                author: post.author,
                url: post.permalink ? `https://www.reddit.com${post.permalink}` : post.url,
                created: post.created_utc,
                images
            }, true);
            if (normalized) parsed.push(normalized);
        }
        return parsed;
    } catch (error) {
        console.error('❌ Hiba a Reddit adatok feldolgozásakor:', error);
        return [];
    }
}


// --- 5. GALÉRIA RÁCS LÉTREHOZÁSA ÉS VÉGTELEN GÖRGETÉS ---
function getActiveFilter() {
    const active = document.querySelector('.btn-filter.active');
    return active ? active.getAttribute('data-filter') : 'all';
}

// Reddit-posztok csak az "Összes" és a "Reddit" szűrőnél látszanak, más szűrőnél felesleges betölteni őket.
function redditLoadingAllowed() {
    const filter = getActiveFilter();
    return filter === 'all' || filter === 'reddit';
}

function initGalleryPage(gridElement) {
    const filterBtns = document.querySelectorAll('.btn-filter');
    const loaderTrigger = document.getElementById('reddit-loader-trigger');
    const spinner = document.getElementById('reddit-spinner');
    const statusText = document.getElementById('reddit-status-text');

    // Szűrő gombok logikája
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(gridElement, btn.getAttribute('data-filter'));

            // Ha rányom a Reddit gombra és még semmi nincs betöltve
            if (redditLoadingAllowed() && loadedPostCount === 0) {
                loadRedditImages(gridElement, spinner, statusText);
            }
        });
    });

    // Intersection Observer: automatikus betöltés görgetéskor
    if (loaderTrigger && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting);
            if (!visible || isFetchingReddit || redditExhausted || !redditLoadingAllowed()) return;

            loadRedditImages(gridElement, spinner, statusText).then(() => {
                // Ha egy adag után a betöltő még mindig látszik (nagy képernyő), az observer nem
                // tüzelne újra magától, ezért újrafigyeltetjük: így a következő adag is jön.
                if (!redditExhausted) {
                    observer.unobserve(loaderTrigger);
                    observer.observe(loaderTrigger);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(loaderTrigger);
    }

    updateEmptyState(gridElement);
}

function applyFilter(gridElement, filterValue) {
    const cols = gridElement.querySelectorAll('.gallery-col');
    cols.forEach(col => {
        if (filterValue === 'all' || col.classList.contains(filterValue)) {
            col.classList.remove('d-none');
            setTimeout(() => col.classList.add('animate-in'), 10);
        } else {
            col.classList.add('d-none');
            col.classList.remove('animate-in');
        }
    });
    updateEmptyState(gridElement);
}

// Üres kategória esetén (pl. Outfitek, Art) üzenet jelenik meg a néma, üres rács helyett.
function updateEmptyState(gridElement) {
    let empty = document.getElementById('gallery-empty');
    if (!empty) {
        empty = document.createElement('div');
        empty.id = 'gallery-empty';
        empty.className = 'col-12 text-center gallery-empty py-5 d-none';

        const emoji = document.createElement('div');
        emoji.className = 'display-5 mb-2';
        emoji.textContent = '🫥';
        const text = document.createElement('p');
        text.className = 'mb-0';
        text.append('Ebben a kategóriában még nincs kép. ');
        const link = document.createElement('a');
        link.href = SUBREDDIT_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Küldj be egyet a subredditre!';
        text.append(link, ' 🧡');
        empty.append(emoji, text);
        gridElement.appendChild(empty);
    }

    const visibleCount = gridElement.querySelectorAll('.gallery-col:not(.d-none)').length;
    const nothingMoreComing = redditExhausted || !redditLoadingAllowed();
    empty.classList.toggle('d-none', !(visibleCount === 0 && !isFetchingReddit && nothingMoreComing));
    // Az üres-állapot elemet mindig a rács végén tartjuk
    if (empty !== gridElement.lastElementChild) gridElement.appendChild(empty);
}

// Egy Reddit-poszt kártyája. Minden szöveg textContent-tel kerül be, így a poszt címe sem
// törheti meg az oldalt (és nem lehet belőle HTML-injektálás).
function createRedditCard(post) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4 gallery-col reddit all';

    const wrapper = document.createElement('div');
    wrapper.className = 'photo-wrapper';
    wrapper.setAttribute('data-bs-toggle', 'modal');
    wrapper.setAttribute('data-bs-target', '#imageModal');
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('aria-label', `${post.title} – megnyitás nagyban`);
    wrapper.tabIndex = 0;
    wrapper.dataset.images = JSON.stringify(post.images.map((img) => img.full)); // a modálba a nagy képek mennek
    wrapper.dataset.title = post.title;
    wrapper.dataset.author = `Feltöltötte: u/${post.author}`;
    wrapper.dataset.postUrl = post.url;
    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            wrapper.click();
        }
    });

    const blur = document.createElement('div');
    blur.className = 'blur-bg';
    blur.style.backgroundImage = `url("${post.images[0].thumb}")`;
    wrapper.appendChild(blur);

    // A kártyán a kisképek látszanak (max. 3), a nagyok csak a modálban töltődnek be.
    const makeImg = (src, className, alt) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        if (className) img.className = className;
        return img;
    };

    const count = post.images.length;
    const imgs = [];
    if (count === 1) {
        const img = makeImg(post.images[0].thumb, 'main-photo', post.title);
        imgs.push(img);
        wrapper.appendChild(img);
    } else {
        const grid = document.createElement('div');
        grid.className = `multi-photo-grid ${count === 2 ? 'grid-2' : 'grid-3'}`;
        for (let i = 0; i < Math.min(count, 3); i++) {
            const img = makeImg(post.images[i].thumb, '', `${post.title} (${i + 1}. kép)`);
            imgs.push(img);
            grid.appendChild(img);
        }
        wrapper.appendChild(grid);

        const badge = document.createElement('div');
        badge.className = 'image-count-badge';
        badge.append(makeIcon('far fa-images'), ` ${count}`);
        wrapper.appendChild(badge);
    }

    // Ha egy kép már nem tölthető be (törölt/lejárt), nem hagyunk törött csempét a rácsban.
    imgs.forEach((img) => {
        img.addEventListener('error', () => {
            img.remove();
            if (!wrapper.querySelector('img')) {
                col.remove();
                const grid = document.getElementById('gallery-grid');
                if (grid) updateEmptyState(grid);
            }
        });
    });

    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    const title = document.createElement('h5');
    title.className = 'text-truncate px-2';
    title.textContent = post.title;
    overlay.append(makeIcon('fab fa-reddit fa-2x mb-2'), title);
    wrapper.appendChild(overlay);

    col.appendChild(wrapper);
    return col;
}

async function loadRedditImages(gridElement, spinner, statusText, callback) {
    if (isFetchingReddit || redditExhausted) {
        if (callback) callback();
        return;
    }
    isFetchingReddit = true; // Zárjuk, hogy ne tudjon egyszerre többször lefutni

    if (spinner) spinner.style.display = 'inline-block';
    if (statusText) {
        statusText.style.display = 'block';
        statusText.textContent = 'Reddit képek betöltése...';
    }

    const posts = await getParsedRedditData();

    // 8 DARAB POSZT BETÖLTÉSE (PAGINÁCIÓ)
    const batchSize = 8;
    const start = loadedPostCount;
    const end = Math.min(start + batchSize, posts.length);
    const filterAtLoad = getActiveFilter();

    posts.slice(start, end).forEach((post, index) => {
        const col = createRedditCard(post);
        // Ha közben más szűrő lett aktív, az új kártya ne jelenjen meg a nem odaillő kategóriában.
        if (filterAtLoad !== 'all' && filterAtLoad !== 'reddit') col.classList.add('d-none');
        gridElement.appendChild(col);
        setTimeout(() => col.classList.add('animate-in'), 50 + (index * 50));
    });
    loadedPostCount = end;

    if (loadedPostCount >= posts.length) {
        redditExhausted = true;
        const loaderTrigger = document.getElementById('reddit-loader-trigger');
        if (posts.length === 0) {
            if (statusText) statusText.textContent = 'A Reddit-képek épp nem elérhetők, nézz vissza később! 😴';
        } else if (statusText) {
            statusText.textContent = 'Minden poszt betöltve! 🎀';
        }
        if (spinner) spinner.style.display = 'none';
        if (loaderTrigger && posts.length > 0) loaderTrigger.classList.remove('py-5');
    } else {
        if (statusText) statusText.textContent = 'További posztok betöltése görgetéskor...';
        if (spinner) spinner.style.display = 'none';
    }

    isFetchingReddit = false;
    updateEmptyState(gridElement);
    if (callback) callback();
}


// --- 6. FŐOLDALI KÁRTYA ---
async function initHomePage(container) {
    const posts = await getParsedRedditData();
    container.textContent = '';

    if (posts.length === 0) {
        const note = document.createElement('p');
        note.className = 'text-center text-muted small mt-3';
        note.textContent = 'Jelenleg nincs képpel rendelkező poszt.';
        container.appendChild(note);
        return;
    }

    const post = posts[0]; // a legfrissebb képes poszt
    const imageCount = post.images.length;

    const imageLink = document.createElement('a');
    imageLink.href = post.url;
    imageLink.target = '_blank';
    imageLink.rel = 'noopener noreferrer';
    imageLink.className = 'reddit-image-wrapper d-block';
    imageLink.setAttribute('aria-label', `${post.title} – megnyitás a Redditen`);

    const blur = document.createElement('div');
    blur.className = 'blur-bg';
    blur.style.backgroundImage = `url("${post.images[0].thumb}")`;

    const img = document.createElement('img');
    img.src = post.images[0].thumb;
    img.className = 'main-photo';
    img.alt = post.title;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
        container.textContent = '';
        const note = document.createElement('p');
        note.className = 'text-center text-muted small mt-3';
        note.textContent = 'A kiemelt kép épp nem tölthető be. 😴';
        container.appendChild(note);
    });

    imageLink.append(blur, img);
    if (imageCount > 1) {
        const badge = document.createElement('div');
        badge.className = 'image-count-badge';
        badge.append(makeIcon('far fa-images'), ` ${imageCount}`);
        imageLink.appendChild(badge);
    }

    const heading = document.createElement('h5');
    heading.className = 'fw-bold text-truncate mt-2';
    const link = document.createElement('a');
    link.href = post.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'reddit-post-link';
    link.textContent = post.title;
    heading.appendChild(link);

    const meta = document.createElement('div');
    meta.className = 'd-flex justify-content-between text-muted small mt-2';
    const author = document.createElement('span');
    author.textContent = `👤 u/${post.author}`;
    const badgeText = document.createElement('span');
    badgeText.append(makeIcon('fab fa-reddit text-danger'), ' Kiemelt poszt');
    meta.append(author, badgeText);

    container.append(imageLink, heading, meta);
}


// --- 7. MODÁL ÉS KÉP LAPOZÁSI LOGIKA (Eredeti nagy felbontással) ---
function initModal() {
    const imageModal = document.getElementById('imageModal');
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');

    if (!imageModal) return;

    const modalImage = document.getElementById('modalImage');
    if (modalImage) modalImage.referrerPolicy = 'no-referrer';

    imageModal.addEventListener('show.bs.modal', function (event) {
        flatGalleryList = [];
        const visibleCols = document.querySelectorAll('.gallery-col:not(.d-none) .photo-wrapper');
        const clickedWrapper = event.relatedTarget;
        let startIndex = 0;

        visibleCols.forEach(wrapper => {
            const title = wrapper.getAttribute('data-title');
            const author = wrapper.getAttribute('data-author');
            const postUrl = wrapper.getAttribute('data-post-url');
            const instaUrl = wrapper.getAttribute('data-insta-url');
            const dataImagesStr = wrapper.getAttribute('data-images');

            let imgs = [];
            if (dataImagesStr) {
                try {
                    imgs = JSON.parse(dataImagesStr); // a nagyfelbontású linkek
                } catch (e) {
                    imgs = [];
                }
            } else {
                const imgSrc = wrapper.getAttribute('data-img-src');
                if (imgSrc) imgs = [imgSrc];
            }

            if (wrapper === clickedWrapper) {
                startIndex = flatGalleryList.length;
            }

            imgs.forEach((imgUrl, subIndex) => {
                flatGalleryList.push({
                    imgSrc: imgUrl,
                    title: title,
                    author: author,
                    postUrl: postUrl,
                    instaUrl: instaUrl,
                    counterText: imgs.length > 1 ? `(${subIndex + 1}/${imgs.length})` : ''
                });
            });
        });

        currentImageIndex = startIndex;
        updateModalContent(flatGalleryList[currentImageIndex]);
    });

    if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
    if (nextBtn) nextBtn.addEventListener('click', showNextImage);

    document.addEventListener('keydown', function (e) {
        if (imageModal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') showPreviousImage();
            if (e.key === 'ArrowRight') showNextImage();
        }
    });
}

function updateModalContent(dataObj) {
    if (!dataObj) return;

    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalRedditLink = document.getElementById('modalRedditLink');
    const modalInstaLink = document.getElementById('modalInstaLink');

    // Itt töltődik be a NAGY kép
    if (modalImage) modalImage.src = dataObj.imgSrc;
    if (modalTitle) modalTitle.textContent = `${dataObj.title || ""} ${dataObj.counterText}`;
    if (modalDesc) modalDesc.textContent = dataObj.author || "";

    if (modalRedditLink) {
        const redditHref = safeHttpUrl(dataObj.postUrl);
        if (redditHref && dataObj.postUrl !== "#") {
            modalRedditLink.href = redditHref;
            modalRedditLink.classList.remove('d-none');
        } else {
            modalRedditLink.classList.add('d-none');
        }
    }

    if (modalInstaLink) {
        const instaHref = safeHttpUrl(dataObj.instaUrl);
        if (instaHref) {
            modalInstaLink.href = instaHref;
            modalInstaLink.classList.remove('d-none');
        } else {
            modalInstaLink.classList.add('d-none');
        }
    }
}

function showPreviousImage() {
    if (flatGalleryList.length === 0) return;
    currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : flatGalleryList.length - 1;
    updateModalContent(flatGalleryList[currentImageIndex]);
}

function showNextImage() {
    if (flatGalleryList.length === 0) return;
    currentImageIndex = (currentImageIndex < flatGalleryList.length - 1) ? currentImageIndex + 1 : 0;
    updateModalContent(flatGalleryList[currentImageIndex]);
}


// --- 8. EGYÉB KOMPONENSEK ÉS VICCES FUNKCIÓK (Easter Eggek) ---
// A menü és a lábléc egyszerre (párhuzamosan) töltődik. A legutóbb kapott változatot a munkamenet-tárhely őrzi,
// így a következő oldalon a menü azonnal ott van (nincs bevillanás), a háttérben érkező friss példány pedig
// csak akkor írja át, ha tényleg változott.
const COMPONENT_CACHE_PREFIX = 'mfsz-comp:';

function readComponentCache(file) {
    try { return sessionStorage.getItem(COMPONENT_CACHE_PREFIX + file); } catch (e) { return null; }
}

function writeComponentCache(file, html) {
    try { sessionStorage.setItem(COMPONENT_CACHE_PREFIX + file, html); } catch (e) { /* privát mód: nem baj */ }
}

async function loadComponent(placeholderId, file, afterInject) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;
    let current = readComponentCache(file);
    if (current !== null) {
        placeholder.innerHTML = current;
        afterInject();
    }
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const fresh = await response.text();
        if (fresh !== current) {
            placeholder.innerHTML = fresh;
            writeComponentCache(file, fresh);
            afterInject();
        }
    } catch (error) { console.error(`${file} betöltési hiba:`, error); }
}

async function loadComponents() {
    await Promise.all([
        loadComponent('navbar-placeholder', 'navbar.html', () => {
            setActiveLink();
            // A témaváltó gomb a navbarral érkezik, a felirata most frissíthető
            if (window.MFSZTheme) window.MFSZTheme.sync();
        }),
        loadComponent('footer-placeholder', 'footer.html', () => {
            if (window.MFSZTheme) window.MFSZTheme.sync();
        })
    ]);
}

// Az útvonal és a menü hivatkozásának összevetése ".html" és záró perjel nélkül, mert a
// Cloudflare a /gallery.html-t átirányítja /gallery-re, és az eredeti egyezés ilyenkor elbukott.
function normalizePageName(name) {
    const cleaned = String(name || '').split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').pop().replace(/\.html$/i, '');
    return cleaned === '' ? 'index' : cleaned;
}

function setActiveLink() {
    const currentPage = normalizePageName(window.location.pathname);
    const links = document.querySelectorAll('.nav-link[data-page]');
    links.forEach(link => {
        if (normalizePageName(link.getAttribute('data-page')) === currentPage) {
            link.classList.add('active-page');
            link.setAttribute('aria-current', 'page');
        }
    });
}

async function initFunnyReviews() {
    const track = document.getElementById('reviews-track');
    if (!track) return;
    try {
        const selectedFile = `data/reviews${Math.floor(Math.random() * 5)}.json`;
        const response = await fetch(selectedFile);
        if (!response.ok) throw new Error(`Hiba: ${response.statusText}`);
        const reviewsPool = await response.json();
        const shuffled = reviewsPool.sort(() => 0.5 - Math.random());
        const selectedReviews = shuffled.slice(0, 9);
        const chunkSize = 3;

        for (let i = 0; i < selectedReviews.length; i += chunkSize) {
            const chunk = selectedReviews.slice(i, i + chunkSize);
            const slideDiv = document.createElement('div');
            slideDiv.className = `carousel-item ${i === 0 ? 'active' : ''}`;
            let rowHtml = '<div class="row g-4 justify-content-center">';

            chunk.forEach((review, index) => {
                let starHtml = '';
                for (let k = 0; k < 5; k++) {
                    starHtml += k < review.stars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                }
                const hideClass = (index === 2) ? 'd-none d-lg-block' : '';
                rowHtml += `
                <div class="col-lg-4 col-md-6 col-12 ${hideClass}">
                    <div class="review-card h-100">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold text-pink">${review.name}</span>
                            <small class="text-muted">${review.date}</small>
                        </div>
                        <div class="stars mb-2">${starHtml}</div>
                        <h5 class="fw-bold">${review.title}</h5>
                        <p class="text-muted mb-0">"${review.desc}"</p>
                    </div>
                </div>`;
            });
            rowHtml += '</div>';
            slideDiv.innerHTML = rowHtml;
            track.appendChild(slideDiv);
        }
    } catch (error) {
        console.error("Nem sikerült betölteni az értékeléseket:", error);
        track.innerHTML = `<div class="text-center p-5 text-muted">Az értékelések épp alszanak... 😴 (Hiba történt)</div>`;
    }
}

function initPremiumButton() {
    let originalContent = null; // a prémium ablak eredeti tartalma, hogy zárás után visszaálljon

    document.body.addEventListener('click', function (e) {
        if (e.target.closest('#btn-premium')) {
            e.preventDefault();
            const modalEl = document.getElementById('premiumModal');
            if (!modalEl || typeof bootstrap === 'undefined') return;
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
        if (e.target.closest('#btn-age-yes')) {
            const modalContent = document.querySelector('#premiumModal .modal-content');
            if (modalContent) {
                if (originalContent === null) originalContent = modalContent.innerHTML;
                modalContent.innerHTML = `
                <div class="ratio ratio-16x9">
                    <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1" title="Rick Roll" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div class="text-center p-3" style="background: #fff; color: #212529;">
                    <h3 class="fw-bold text-danger">XD CRINGE</h3>
                    <p class="mb-0">....</p>
                    <button class="btn btn-secondary mt-3" data-bs-dismiss="modal">Bezárás</button>
                </div>`;
                modalContent.style.border = "none";
                modalContent.style.background = "transparent";
            }
        }
    });

    // Bezáráskor visszaállítjuk az ablakot: eddig a videó a háttérben tovább szólt, és újranyitáskor
    // már a kérdés nélkül ugyanaz a videó fogadta a látogatót.
    document.addEventListener('hidden.bs.modal', function (e) {
        if (e.target.id !== 'premiumModal' || originalContent === null) return;
        const modalContent = e.target.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = originalContent;
            modalContent.style.border = '';      // csak a videós állapotban beállított
            modalContent.style.background = '';  // inline értékeket töröljük, az arany keret a CSS-ből jön
        }
        originalContent = null;
    });
}

function initCatInteraction() {
    const container = document.getElementById('corner-cat');
    const bubble = document.getElementById('cat-bubble');
    if (!container || !bubble) return;

    const icon = container.querySelector('i');
    let clickCount = 0;
    let isShark = false;
    let bubbleTimer = null;

    container.addEventListener('click', () => {
        if (isShark) {
            showBubble("Blub blub... 🫧");
            return;
        }
        clickCount++;
        if (clickCount === 3) showBubble("Nyau! 😽");
        else if (clickCount === 6) showBubble("Miau! Ne piszkálj! 🙀");
        else if (clickCount >= 9) {
            isShark = true;
            icon.className = "fas fa-fish cat-icon";
            container.classList.add('shark-mode');
            showBubble("BLÅHAJ MÓD AKTIVÁLVA! 🦈🌊");
            document.body.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" style=\"font-size:24px\"><text y=\"24\">🦈</text></svg>'), auto";
        }
    });

    function showBubble(text) {
        bubble.textContent = text;
        bubble.classList.add('show');
        clearTimeout(bubbleTimer); // az előző elrejtés ne vágjon bele az újabb buborékba
        bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 3500);
    }
}

function initEasterEggs() {
    // A titkos kódok csak akkor működnek, ha épp nem írsz be valamit: korábban a kapcsolatfelvételi
    // űrlapban pl. a "cirkusz" szó begépelése elnavigált az oldalról, és elveszett a megírt üzenet.
    function isTypingTarget(target) {
        return Boolean(target && target.closest && target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
    }

    let secretBuffer = "";
    let konamiIndex = 0;
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    document.addEventListener('keydown', (e) => {
        if (isTypingTarget(e.target)) {
            secretBuffer = "";
            konamiIndex = 0;
            return;
        }

        if (e.key.length === 1) {
            secretBuffer = (secretBuffer + e.key.toLowerCase()).slice(-12);
            if (secretBuffer.includes("faxom")) {
                secretBuffer = "";
                document.body.style.transition = "all 1s";
                document.body.style.filter = "invert(100%) hue-rotate(180deg)";
                setTimeout(() => window.location.href = "faxom.html", 1000);
            } else if (secretBuffer.includes("fovi") || secretBuffer.includes("cirkusz")) {
                secretBuffer = "";
                window.location.href = "fovi.html";
            }
        }

        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; // Caps Lock mellett is működjön
        if (key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerSharkApocalypse();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = key === konamiCode[0] ? 1 : 0;
        }
    });

    // Ötször rákattintva a "Beceneved" feliratra jön a Monster-roham. Korábban bármelyik elem
    // számított, aminek a szövegében szerepelt a felirat (pl. a szekció vagy a törzs üres felülete is),
    // így véletlenül is kiugrott az alert.
    let labelClicks = 0;
    document.body.addEventListener('click', function (e) {
        const label = e.target.closest ? e.target.closest('label') : null;
        if (label && label.textContent.includes('Beceneved')) {
            labelClicks++;
            if (labelClicks === 5) {
                document.body.style.filter = "contrast(150%) saturate(200%)";
                document.body.classList.add('theme-win11');
                alert("import happiness... ERROR: Túl sok Monster Energy! ⚡ Látod a hangokat?");
                setTimeout(() => {
                    document.body.style.filter = "none";
                    document.body.classList.remove('theme-win11');
                    labelClicks = 0;
                }, 4000);
            }
        }
    });

    function triggerSharkApocalypse() {
        alert("⚠️ VESZÉLY: KRITIKUS BLÅHAJ TÚLTENGÉS ÉSZLELVE! 🦈");
        document.body.style.animation = "wobble 0.2s infinite alternate";
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const shark = document.createElement('div');
                shark.textContent = "🦈";
                shark.style.position = "fixed";
                shark.style.top = "-50px";
                shark.style.left = Math.random() * window.innerWidth + "px";
                shark.style.fontSize = Math.random() * (40 - 20) + 20 + "px";
                shark.style.zIndex = "20000";
                shark.style.transition = "transform 3s linear";
                shark.style.pointerEvents = "none";
                document.body.appendChild(shark);
                setTimeout(() => {
                    shark.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
                }, 50);
                setTimeout(() => shark.remove(), 3100);
            }, i * 150);
        }
        setTimeout(() => document.body.style.animation = "none", 5000);
    }
}
