document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBÁLIS VÁLTOZÓK A GALÉRIA LÉPTETÉSHEZ ---
    let visiblePhotoWrappers = [];
    let currentImageIndex = 0;

    loadComponents().then(() => {
        document.body.classList.add('loaded');
        initModal();
    });
    initPremiumButton();

    const galleryGrid = document.getElementById('gallery-grid');
    const homeRedditBox = document.getElementById('reddit-content');
    if (galleryGrid) {
        initGalleryPage(galleryGrid);
    }
    if (homeRedditBox) {
        initHomePage(homeRedditBox);
        initFunnyReviews();
    }
    initCatInteraction();
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
                    </div>
                `;
                    modalContent.style.border = "none";
                    modalContent.style.background = "transparent";
                }
            }
        });
    }

    function initCatInteraction() {
        const container = document.getElementById('corner-cat');
        const bubble = document.getElementById('cat-bubble');
        const icon = container.querySelector('i');

        let clickCount = 0;
        let isShark = false;

        if (container && bubble) {
            container.addEventListener('click', () => {
                if (isShark) {
                    showBubble("Blub blub... 🫧");
                    return;
                }
                clickCount++;
                if (clickCount === 3) {
                    showBubble("Nyau! 😽");
                }
                else if (clickCount === 6) {
                    showBubble("Miau! Ne piszkálj! 🙀");
                }
                else if (clickCount >= 9) {
                    isShark = true;
                    icon.className = "fas fa-fish cat-icon";
                    container.classList.add('shark-mode');
                    showBubble("BLÅHAJ MÓD AKTIVÁLVA! 🦈🌊");
                    document.body.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" style=\"font-size:24px\"><text y=\"24\">🦈</text></svg>'), auto";
                }
            });
        }
        function showBubble(text) {
            bubble.textContent = text;
            bubble.classList.add('show');
            setTimeout(() => {
                bubble.classList.remove('show');
            }, 3500);
        }
    }

    async function initFunnyReviews() {
        const track = document.getElementById('reviews-track');
        if (!track) return;
        try {


            // Sorsolunk egyet a tömbből (0, 1 vagy 2 index)
            const selectedFile = 'data/reviews' + [Math.floor(Math.random() * 3)] + ".json";

            // Debug: Kiírjuk a konzolra, melyiket töltötte be (F12 -> Console)
            console.log(`Értékelések forrása: ${selectedFile}`);

            // 2. A KIVÁLASZTOTT FÁJL LETÖLTÉSE
            const response = await fetch(selectedFile);

            if (!response.ok) throw new Error(`Hiba a fájl betöltésekor: ${response.statusText}`);

            // 3. ADATOK ÁTVÉTELE
            // Most nem fűzünk össze semmit, ez lesz a teljes készlet
            const reviewsPool = await response.json();

            // 1. Véletlenszerű keverés
            const shuffled = reviewsPool.sort(() => 0.5 - Math.random());

            // 2. Kilenc elem kiválasztása (3 dia x 3 értékelés)
            const selectedReviews = shuffled.slice(0, 9);

            // 3. Csoportosítás 3-asával
            const chunkSize = 3;

            for (let i = 0; i < selectedReviews.length; i += chunkSize) {
                const chunk = selectedReviews.slice(i, i + chunkSize);

                const slideDiv = document.createElement('div');
                slideDiv.className = `carousel-item ${i === 0 ? 'active' : ''}`;

                let rowHtml = '<div class="row g-4 justify-content-center">';

                // --- ITT A VÁLTOZÁS: Figyeljük az indexet ---
                chunk.forEach((review, index) => {
                    // Csillag generálás
                    let starHtml = '';
                    for (let k = 0; k < 5; k++) {
                        starHtml += k < review.stars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                    }

                    // MOBIL REJTÉS LOGIKA:
                    // Ha ez a 3. elem (index === 2), akkor adjunk hozzá egy osztályt, 
                    // ami mobilon elrejti (d-none), de asztalin megjeleníti (d-lg-block).
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
                </div>
            `;
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
    function initGalleryPage(gridElement) {
        const filterBtns = document.querySelectorAll('.btn-filter');
        const loaderTrigger = document.getElementById('reddit-loader-trigger');
        const spinner = document.getElementById('reddit-spinner');
        const statusText = document.getElementById('reddit-status-text');
        let redditLoaded = false;

        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filterValue = btn.getAttribute('data-filter');
                    if (filterValue === 'reddit' && !redditLoaded) {
                        loadRedditImages(gridElement, spinner, statusText, () => {
                            redditLoaded = true;
                            applyFilter(gridElement, filterValue);
                        });
                    } else {
                        applyFilter(gridElement, filterValue);
                    }
                });
            });
        }

        if (loaderTrigger) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !redditLoaded) {
                        loadRedditImages(gridElement, spinner, statusText, () => {
                            redditLoaded = true;
                            const activeFilter = document.querySelector('.btn-filter.active').getAttribute('data-filter');
                            if (activeFilter === 'all' || activeFilter === 'reddit') {
                                applyFilter(gridElement, activeFilter);
                            }
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(loaderTrigger);
        }
    }

    function applyFilter(gridElement, filterValue) {
        const cols = gridElement.querySelectorAll('.gallery-col');
        cols.forEach(col => {
            col.classList.add('d-none');
            col.classList.remove('animate-in');

            if (filterValue === 'all' || col.classList.contains(filterValue)) {
                col.classList.remove('d-none');
                setTimeout(() => col.classList.add('animate-in'), 10);
            }
        });
    }

    function loadRedditImages(gridElement, spinner, statusText, callback) {
        if (spinner) spinner.style.display = 'inline-block';
        if (statusText) statusText.style.display = 'block';

        // ÚJ: A saját Cloudflare Worker API-nkat hívjuk!
        fetch('/api/reddit')
            .then(res => res.json())
            .then(posts => {
                let addedCount = 0;
                const maxPosts = 15;

                posts.forEach(post => {
                    if (addedCount >= maxPosts) return;

                    const colDiv = document.createElement('div');
                    colDiv.className = 'col-12 col-sm-6 col-lg-4 gallery-col reddit all';

                    const imagesJson = JSON.stringify(post.images).replace(/"/g, '&quot;');
                    const firstImg = post.images[0];
                    const imageCount = post.images.length;
                    let imagesHtml = '';

                    // HTML felépítése attól függően, hány kép van (max 3-at mutatunk a kártyán)
                    if (imageCount === 1) {
                        imagesHtml = `<img src="${firstImg}" class="main-photo" alt="${post.title}" loading="lazy">`;
                    } else {
                        const gridClass = imageCount === 2 ? 'grid-2' : 'grid-3';
                        const maxDisplay = Math.min(imageCount, 3);
                        imagesHtml = `<div class="multi-photo-grid ${gridClass}">`;
                        for (let i = 0; i < maxDisplay; i++) {
                            imagesHtml += `<img src="${post.images[i]}" alt="Gallery Image ${i + 1}" loading="lazy">`;
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
                        <div class="blur-bg" style="background-image: url('${firstImg}');"></div>
                        ${imagesHtml}
                        <div class="photo-overlay">
                            <i class="fab fa-reddit fa-2x mb-2"></i>
                            <h5 class="text-truncate px-2">${post.title}</h5>
                        </div>
                    </div>
                `;

                    gridElement.appendChild(colDiv);
                    setTimeout(() => colDiv.classList.add('animate-in'), 100 + (addedCount * 50));
                    addedCount++;
                });

                if (spinner) spinner.style.display = 'none';
                if (statusText) statusText.style.display = 'none';
                if (callback) callback();
            })
            .catch(err => {
                console.error('Reddit API hiba:', err);
                if (statusText) statusText.innerText = 'Nem sikerült betölteni a képeket.';
                if (spinner) spinner.style.display = 'none';
            });
    }

    function initHomePage(container) {
        fetch('/api/reddit')
            .then(res => res.json())
            .then(posts => {
                if (posts.length > 0) {
                    const selectedPost = posts[0]; // A legújabb poszt, aminek van képe
                    const firstImgUrl = selectedPost.images[0];
                    const imageCount = selectedPost.images.length;

                    let badgeHtml = imageCount > 1 ? `<div class="image-count-badge" style="position:absolute; top:10px; right:10px;"><i class="far fa-images"></i> +${imageCount}</div>` : '';

                    const imageHtml = `
                    <div class="reddit-image-wrapper" style="position:relative;">
                        <div class="blur-bg" style="background-image: url('${firstImgUrl}');"></div>
                        <img src="${firstImgUrl}" class="main-photo" alt="Reddit Post">
                        ${badgeHtml}
                    </div>
                `;

                    container.innerHTML = `
                    ${imageHtml}
                    <h5 class="fw-bold text-truncate mt-2"><a href="${selectedPost.url}" target="_blank" class="text-dark text-decoration-none">${selectedPost.title}</a></h5>
                    <div class="d-flex justify-content-between text-muted small mt-2">
                        <span>👤 u/${selectedPost.author}</span>
                        <span><i class="fab fa-reddit text-danger"></i> Új poszt</span>
                    </div>
                `;
                } else {
                    container.innerHTML = '<p class="text-center text-muted small mt-3">Jelenleg nincs képpel rendelkező poszt.</p>';
                }
            })
            .catch(err => {
                console.error('Reddit Főoldal hiba:', err);
                container.innerHTML = '<p class="text-center text-muted small mt-3">Nem sikerült elérni az adatokat.</p>';
            });
    }

    // =========================================================
    // C. MODAL (LÉPTETÉS ÉS LINK) FUNKCIÓK (ÚJ)
    // =========================================================
    function initModal() {
        const imageModal = document.getElementById('imageModal');
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');

        if (imageModal) {
            imageModal.addEventListener('show.bs.modal', function (event) {
                flatGalleryList = [];
                const visibleCols = document.querySelectorAll('.gallery-col:not(.d-none) .photo-wrapper');
                let clickedWrapper = event.relatedTarget;
                let startIndex = 0;

                // Végigmegyünk az összes látható kártyán és "kiterítjük" a képeket egy listába
                visibleCols.forEach(wrapper => {
                    const title = wrapper.getAttribute('data-title');
                    const author = wrapper.getAttribute('data-author');
                    const postUrl = wrapper.getAttribute('data-post-url');
                    const instaUrl = wrapper.getAttribute('data-insta-url');

                    let imgs = [];
                    const dataImagesStr = wrapper.getAttribute('data-images');
                    if (dataImagesStr) {
                        imgs = JSON.parse(dataImagesStr); // Reddit poszt több képpel
                    } else {
                        imgs = [wrapper.getAttribute('data-img-src')]; // Hardcoded képek
                    }

                    // Ha erre a wrapperre kattintottak, elmentjük a kezdő indexet
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
    }

    function updateModalContent(dataObj) {
        if (!dataObj) return;

        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalRedditLink = document.getElementById('modalRedditLink');
        const modalInstaLink = document.getElementById('modalInstaLink');

        if (modalImage) modalImage.src = dataObj.imgSrc;
        if (modalTitle) modalTitle.textContent = `${dataObj.title || ""} ${dataObj.counterText}`;
        if (modalDesc) modalDesc.textContent = dataObj.author || "";

        if (modalRedditLink) {
            if (dataObj.postUrl && dataObj.postUrl !== "null") {
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
    // =========================================================
    // D. BETÖLTŐ FÜGGVÉNY (Navbar/Footer)
    // =========================================================
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
    let isUwUified = false;
    let originalTexts = new Map();

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

        // Csak a szöveges csomópontokat járjuk be, hogy a HTML tag-ek ne sérüljenek
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let node;

        while (node = walker.nextNode()) {
            // Kihagyjuk a script, style, iframe és kód blokkokat
            const parentTag = node.parentElement.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'noscript', 'textarea', 'input'].includes(parentTag)) continue;
            if (node.parentElement.id === 'btn-uwu-mode' || node.parentElement.closest('#btn-uwu-mode')) continue;

            let text = node.nodeValue;
            if (text.trim().length === 0) continue;

            // Szöveg átalakítása
            text = text.replace(/[rl]/g, 'w').replace(/[RL]/g, 'W');

            // Random cukiság beszúrása a mondatvégekre
            text = text.replace(/([.!?])/g, (match) => {
                return match + emojis[Math.floor(Math.random() * emojis.length)];
            });

            node.nodeValue = text;
        }
    }
    let secretBuffer = "";
    document.addEventListener('keydown', (e) => {
        secretBuffer += e.key.toLowerCase();

        if (secretBuffer.length > 10) {
            secretBuffer = secretBuffer.substring(1);
        }

        if (secretBuffer.includes("faxom")) {
            document.body.style.transition = "all 1s";
            document.body.style.filter = "invert(100%) hue-rotate(180deg)";
            setTimeout(() => {
                window.location.href = "faxom.html";
            }, 1000);
        }

        if (secretBuffer.includes("fovi") || secretBuffer.includes("cirkusz")) {
            window.location.href = "fovi.html";
        }
    });
    let labelClicks = 0;
    document.body.addEventListener('click', function (e) {
        if (e.target && e.target.textContent.includes('Beceneved ✨')) {
            labelClicks++;
            if (labelClicks === 5) {
                document.body.style.filter = "contrast(150%) saturate(200%)";
                document.body.classList.add('theme-win11'); // A faxstyle.css-ben lévő transzformáció
                alert("import happiness... ERROR: Túl sok Monster Energy! ⚡ Látod a hangokat?");
                setTimeout(() => {
                    document.body.style.filter = "none";
                    document.body.classList.remove('theme-win11');
                    labelClicks = 0;
                }, 4000);
            }
        }
    });
    // --- KONAMI KÓD: CÁPA ESŐ ---
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
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

    function triggerSharkApocalypse() {
        alert("⚠️ VESZÉLY: KRITIKUS BLÅHAJ TÚLTENGÉS ÉSZLELVE! 🦈");
        document.body.style.animation = "wobble 0.2s infinite alternate"; // faxstyle.css mintára

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

                // Animáció indítása
                setTimeout(() => {
                    shark.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
                }, 50);

                // Eltávolítás
                setTimeout(() => shark.remove(), 3100);
            }, i * 150);
        }

        // Remegés leállítása
        setTimeout(() => { document.body.style.animation = "none"; }, 5000);
    }
    console.log(
        "%c🎀 Hahó! Felvetted már a programozó zoknidat? 🎀\n",
        "color: #f5a9b8; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 2px #000;"
    );
    console.log(
        "%cTudtad, hogy vannak rejtett oldalak? Próbáld meg beírni a billentyűzeten, hogy 'faxom' vagy 'fovi'...",
        "color: #5bcefa; font-size: 14px; font-style: italic;"
    );
});