// =========================================================
// MAGYAR FEMBOY SZAKSZERVEZET - KÖZPONTI SCRIPT
// =========================================================

// --- 1. GLOBÁLIS VÁLTOZÓK ÉS CSS BEÁLLÍTÁSOK ---
let flatGalleryList = [];
let currentImageIndex = 0;

// LAPOZÁSI (PAGINÁCIÓ) VÁLTOZÓK
let allRedditPosts = []; // Ide mentjük be egyszer a JSON-t
let loadedPostCount = 0; // Hány poszt van eddig betöltve
let isFetchingReddit = false; // Ne töltsön be duplán, ha nagyon gyorsan görgetsz

// Dinamikus CSS a többképes rácsokhoz
const redditGridCss = `
.multi-photo-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; gap: 2px; z-index: 2; }
.multi-photo-grid img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.multi-photo-grid.grid-2 { grid-template-columns: 1fr 1fr; }
.multi-photo-grid.grid-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 60% 40%; }
.multi-photo-grid.grid-3 img:nth-child(1) { grid-column: 1 / 3; grid-row: 1 / 2; }
.multi-photo-grid.grid-3 img:nth-child(2) { grid-column: 1 / 2; grid-row: 2 / 3; }
.multi-photo-grid.grid-3 img:nth-child(3) { grid-column: 2 / 3; grid-row: 2 / 3; }
.image-count-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; z-index: 5; backdrop-filter: blur(5px); }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = redditGridCss;
document.head.appendChild(styleSheet);


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


// --- 3. PROFI REDDIT JSON ÉRTELMEZŐ (Kisképek és Nagyképek kivonása) ---
async function getParsedRedditData() {
    // Ha már beolvastuk a fájlt, nem olvassuk be újra!
    if (allRedditPosts.length > 0) return allRedditPosts;

    try {
        const res = await fetch('data/reddit_backup.json?v=' + Date.now());
        if (!res.ok) throw new Error('Nem található a backup JSON fájl!');

        const rawData = await res.json();
        let postsArray = [];

        if (rawData.kind === 'Listing' && rawData.data && rawData.data.children) {
            postsArray = rawData.data.children.map(child => child.data);
        } else if (Array.isArray(rawData)) {
            postsArray = rawData;
        } else {
            return [];
        }

        const parsedPosts = [];

        for (const post of postsArray) {
            if (post.removed_by_category || post.is_deleted || post.hidden) continue;

            let images = []; // Formátum: { thumb: "kiskép_url", full: "nagykép_url" }

            // 1. Galériák
            if (post.is_gallery && post.media_metadata) {
                const galleryItems = post.gallery_data?.items || [];
                for (const item of galleryItems) {
                    const media = post.media_metadata[item.media_id];
                    if (media && media.status === 'valid' && media.s && media.s.u) {
                        const full = media.s.u.replace(/&amp;/g, '&');
                        let thumb = full;
                        // Kiskép kinyerése (kb. 640px felbontás - index 3)
                        if (media.p && media.p.length > 0) {
                            const pImg = media.p[Math.min(3, media.p.length - 1)];
                            if (pImg) thumb = pImg.u.replace(/&amp;/g, '&');
                        }
                        images.push({ thumb, full });
                    }
                }
            }
            // 2. Sima egyképes posztok
            else if (post.preview && post.preview.images && post.preview.images.length > 0) {
                const imgData = post.preview.images[0];
                const full = imgData.source.url.replace(/&amp;/g, '&');
                let thumb = full;
                // Kiskép kinyerése
                if (imgData.resolutions && imgData.resolutions.length > 0) {
                    const pImg = imgData.resolutions[Math.min(3, imgData.resolutions.length - 1)];
                    if (pImg) thumb = pImg.url.replace(/&amp;/g, '&');
                }
                images.push({ thumb, full });
            }
            // 3. Biztonsági tartalék
            else if (post.url && post.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                images.push({ thumb: post.url, full: post.url });
            }

            if (images.length > 0) {
                parsedPosts.push({
                    title: post.title || 'Reddit Poszt',
                    author: post.author || 'Ismeretlen',
                    url: post.permalink ? `https://www.reddit.com${post.permalink}` : (post.url || '#'),
                    images: images
                });
            }
        }

        allRedditPosts = parsedPosts; // Eltároljuk a memóriában
        return parsedPosts;
    } catch (error) {
        console.error('❌ Hiba a Reddit adatok feldolgozásakor:', error);
        return [];
    }
}


// --- 4. GALÉRIA RÁCS LÉTREHOZÁSA ÉS VÉGTELEN GÖRGETÉS ---
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
            const filterValue = btn.getAttribute('data-filter');

            // Ha rányom a Reddit gombra és még semmi nincs betöltve
            if (filterValue === 'reddit' && loadedPostCount === 0) {
                loadRedditImages(gridElement, spinner, statusText, () => {
                    applyFilter(gridElement, filterValue);
                });
            } else {
                applyFilter(gridElement, filterValue);
            }
        });
    });

    // Intersection Observer: Automatikus betöltés görgetéskor!
    if (loaderTrigger) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Ha a lap aljára érünk és épp nem töltünk be adatot
                if (entry.isIntersecting && !isFetchingReddit) {
                    loadRedditImages(gridElement, spinner, statusText, () => {
                        const activeFilterBtn = document.querySelector('.btn-filter.active');
                        if (activeFilterBtn) {
                            applyFilter(gridElement, activeFilterBtn.getAttribute('data-filter'));
                        }
                    });
                }
            });
        }, { threshold: 0.1 });
        observer.observe(loaderTrigger);
    }
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
}

async function loadRedditImages(gridElement, spinner, statusText, callback) {
    if (isFetchingReddit) return;
    isFetchingReddit = true; // Zárjuk, hogy ne tudjon egyszerre többször lefutni

    if (spinner) spinner.style.display = 'inline-block';
    if (statusText) statusText.style.display = 'block';

    const posts = await getParsedRedditData();

    // Ha az összes poszt betöltött, rejtjük el végleg a betöltőt
    if (posts.length === 0 || loadedPostCount >= posts.length) {
        if (spinner) spinner.style.display = 'none';
        const loaderTrigger = document.getElementById('reddit-loader-trigger');
        if (loaderTrigger) loaderTrigger.style.display = 'none'; // Ezt is ki lehet kapcsolni, ha el akarod tüntetni a szöveget
        isFetchingReddit = false;
        if (callback) callback();
        return;
    }

    // 8 DARAB POSZT BETÖLTÉSE (PAGINÁCIÓ)
    const batchSize = 8;
    const start = loadedPostCount;
    const end = Math.min(start + batchSize, posts.length);
    const batch = posts.slice(start, end);

    let addedCount = 0;

    batch.forEach(post => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-12 col-sm-6 col-lg-4 gallery-col reddit all';

        // Kettéválasztjuk a minőségeket
        const fullImages = post.images.map(img => img.full); // Ez megy a modálba!
        const thumbImages = post.images.map(img => img.thumb); // Ez megy a kártyára!

        const imagesJson = JSON.stringify(fullImages).replace(/"/g, '&quot;');
        const firstThumb = thumbImages[0];
        const imageCount = thumbImages.length;

        let imagesHtml = '';

        if (imageCount === 1) {
            // Lazy load HTML paraméterrel
            imagesHtml = `<img src="${firstThumb}" class="main-photo" alt="${post.title}" loading="lazy">`;
        } else {
            const gridClass = imageCount === 2 ? 'grid-2' : 'grid-3';
            const maxDisplay = Math.min(imageCount, 3);
            imagesHtml = `<div class="multi-photo-grid ${gridClass}">`;
            for (let i = 0; i < maxDisplay; i++) {
                imagesHtml += `<img src="${thumbImages[i]}" alt="Gallery Image ${i + 1}" loading="lazy">`;
            }
            imagesHtml += `</div><div class="image-count-badge"><i class="far fa-images"></i> +${imageCount}</div>`;
        }

        colDiv.innerHTML = `
            <div class="photo-wrapper" 
                    data-bs-toggle="modal" 
                    data-bs-target="#imageModal"
                    data-images="${imagesJson}"
                    data-title="${post.title}" 
                    data-author="Feltöltötte: u/${post.author}"
                    data-post-url="${post.url}"> 
                <div class="blur-bg" style="background-image: url('${firstThumb}');"></div>
                ${imagesHtml}
                <div class="photo-overlay">
                    <i class="fab fa-reddit fa-2x mb-2"></i>
                    <h5 class="text-truncate px-2">${post.title}</h5>
                </div>
            </div>
        `;

        gridElement.appendChild(colDiv);
        setTimeout(() => colDiv.classList.add('animate-in'), 50 + (addedCount * 50));
        addedCount++;
    });

    loadedPostCount = end; // Frissítjük a számlálót

    if (loadedPostCount >= posts.length) {
        if (statusText) statusText.innerText = 'Minden poszt betöltve! 🎀';
    } else {
        if (statusText) statusText.innerText = 'További posztok betöltése görgetéskor...';
    }

    if (spinner) spinner.style.display = 'none';
    isFetchingReddit = false;
    if (callback) callback();
}


// --- 5. FŐOLDALI KÁRTYA ---
async function initHomePage(container) {
    const posts = await getParsedRedditData();

    if (posts.length === 0) {
        container.innerHTML = '<p class="text-center text-muted small mt-3">Jelenleg nincs képpel rendelkező poszt.</p>';
        return;
    }

    const selectedPost = posts[0];
    const firstThumbUrl = selectedPost.images[0].thumb;
    const imageCount = selectedPost.images.length;

    let badgeHtml = imageCount > 1 ? `<div class="image-count-badge" style="position:absolute; top:10px; right:10px;"><i class="far fa-images"></i> +${imageCount}</div>` : '';

    container.innerHTML = `
        <div class="reddit-image-wrapper" style="position:relative;">
            <div class="blur-bg" style="background-image: url('${firstThumbUrl}');"></div>
            <img src="${firstThumbUrl}" class="main-photo" alt="Reddit Post" loading="lazy">
            ${badgeHtml}
        </div>
        <h5 class="fw-bold text-truncate mt-2"><a href="${selectedPost.url}" target="_blank" class="text-dark text-decoration-none">${selectedPost.title}</a></h5>
        <div class="d-flex justify-content-between text-muted small mt-2">
            <span>👤 u/${selectedPost.author}</span>
            <span><i class="fab fa-reddit text-danger"></i> Kiemelt poszt</span>
        </div>
    `;
}


// --- 6. MODÁL ÉS KÉP LAPOZÁSI LOGIKA (Eredeti nagy felbontással) ---
function initModal() {
    const imageModal = document.getElementById('imageModal');
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');

    if (!imageModal) return;

    imageModal.addEventListener('show.bs.modal', function (event) {
        flatGalleryList = [];
        const visibleCols = document.querySelectorAll('.gallery-col:not(.d-none) .photo-wrapper');
        let clickedWrapper = event.relatedTarget;
        let startIndex = 0;

        visibleCols.forEach(wrapper => {
            const title = wrapper.getAttribute('data-title');
            const author = wrapper.getAttribute('data-author');
            const postUrl = wrapper.getAttribute('data-post-url');
            const instaUrl = wrapper.getAttribute('data-insta-url');
            const dataImagesStr = wrapper.getAttribute('data-images');

            let imgs = [];
            if (dataImagesStr) {
                // A JSON string itt már TISZTÁN a nagyfelbontású Full HD linkeket kapta meg!
                imgs = JSON.parse(dataImagesStr);
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

    // Itt történik a varázslat: a NAGY kép töltődik be
    if (modalImage) modalImage.src = dataObj.imgSrc;
    if (modalTitle) modalTitle.textContent = `${dataObj.title || ""} ${dataObj.counterText}`;
    if (modalDesc) modalDesc.textContent = dataObj.author || "";

    if (modalRedditLink) {
        if (dataObj.postUrl && dataObj.postUrl !== "null" && dataObj.postUrl !== "#") {
            modalRedditLink.href = dataObj.postUrl;
            modalRedditLink.classList.remove('d-none');
        } else {
            modalRedditLink.classList.add('d-none');
        }
    }

    if (modalInstaLink) {
        if (dataObj.instaUrl && dataObj.instaUrl !== "null" && dataObj.instaUrl !== "") {
            modalInstaLink.href = dataObj.instaUrl;
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


// --- 7. EGYÉB KOMPONENSEK ÉS VICCES FUNKCIÓK (Easter Eggek) ---
async function loadComponents() {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        try {
            const response = await fetch('navbar.html');
            navPlaceholder.innerHTML = await response.text();
            setActiveLink();
        } catch (error) { console.error('Menü hiba:', error); }
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const response = await fetch('footer.html');
            footerPlaceholder.innerHTML = await response.text();
        } catch (error) { console.error('Footer hiba:', error); }
    }
}

function setActiveLink() {
    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "") currentPage = "index.html";
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('active-page');
        }
    });
}

async function initFunnyReviews() {
    const track = document.getElementById('reviews-track');
    if (!track) return;
    try {
        const selectedFile = 'data/reviews' + [Math.floor(Math.random() * 3)] + ".json";
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
    document.body.addEventListener('click', function (e) {
        if (e.target.id === 'btn-premium' || e.target.closest('#btn-premium')) {
            e.preventDefault();
            const modalEl = document.getElementById('premiumModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
        if (e.target.id === 'btn-age-yes') {
            const modalContent = document.querySelector('#premiumModal .modal-content');
            if (modalContent) {
                modalContent.innerHTML = `
                <div class="ratio ratio-16x9">
                    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" title="Rick Roll" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div class="text-center p-3" style="background: #fff;">
                    <h3 class="fw-bold text-danger">XD CRINGE</h3>
                    <p class="mb-0">....</p>
                    <button class="btn btn-secondary mt-3" data-bs-dismiss="modal">Bezárás</button>
                </div>`;
                modalContent.style.border = "none";
                modalContent.style.background = "transparent";
            }
        }
    });
}

function initCatInteraction() {
    const container = document.getElementById('corner-cat');
    const bubble = document.getElementById('cat-bubble');
    if (!container || !bubble) return;

    const icon = container.querySelector('i');
    let clickCount = 0;
    let isShark = false;

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
        setTimeout(() => bubble.classList.remove('show'), 3500);
    }
}

function initEasterEggs() {
    let isUwUified = false;
    document.body.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'btn-uwu-mode') {
            const btn = e.target;
            if (!isUwUified) {
                btn.style.background = "var(--pink)";
                btn.style.color = "white";
                applyUwUJS(document.body);
                isUwUified = true;
            } else {
                window.location.reload();
            }
        }
    });

    function applyUwUJS(element) {
        const emojis = [' :3', ' UwU', ' OwO', ' nyau~', ' mrrrp*'];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const parentTag = node.parentElement.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'noscript', 'textarea', 'input'].includes(parentTag)) continue;
            if (node.parentElement.id === 'btn-uwu-mode' || node.parentElement.closest('#btn-uwu-mode')) continue;
            let text = node.nodeValue;
            if (text.trim().length === 0) continue;
            text = text.replace(/[rl]/g, 'w').replace(/[RL]/g, 'W');
            text = text.replace(/([.!?])/g, (match) => match + emojis[Math.floor(Math.random() * emojis.length)]);
            node.nodeValue = text;
        }
    }

    let secretBuffer = "";
    let konamiIndex = 0;
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    document.addEventListener('keydown', (e) => {
        secretBuffer += e.key.toLowerCase();
        if (secretBuffer.length > 10) secretBuffer = secretBuffer.substring(1);
        if (secretBuffer.includes("faxom")) {
            document.body.style.transition = "all 1s";
            document.body.style.filter = "invert(100%) hue-rotate(180deg)";
            setTimeout(() => window.location.href = "faxom.html", 1000);
        }
        if (secretBuffer.includes("fovi") || secretBuffer.includes("cirkusz")) {
            window.location.href = "fovi.html";
        }

        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerSharkApocalypse();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    let labelClicks = 0;
    document.body.addEventListener('click', function (e) {
        if (e.target && e.target.textContent.includes('Beceneved ✨')) {
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
                shark.innerHTML = "🦈";
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