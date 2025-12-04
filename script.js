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
                        <h3 class="fw-bold text-danger">NA NEE! 🕺</h3>
                        <p class="mb-0">Sose add fel...</p>
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

        const subreddit = 'MagyarFemboyCommunity';

        fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=30`)
            .then(res => res.json())
            .then(data => {
                const posts = data.data.children;
                let addedCount = 0;
                const maxImages = 15;

                posts.forEach(postData => {
                    const post = postData.data;
                    if (addedCount >= maxImages) return;

                    const isImage = post.url.match(/\.(jpeg|jpg|gif|png)$/) != null || post.post_hint === 'image';

                    if (isImage) {
                        const colDiv = document.createElement('div');
                        colDiv.className = 'col-12 col-sm-6 col-lg-4 gallery-col reddit all';

                        // FONTOS: Itt mentjük el a Reddit permalinket!
                        const permalink = `https://www.reddit.com${post.permalink}`;

                        colDiv.innerHTML = `
                            <div class="photo-wrapper" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#imageModal"
                                    data-img-src="${post.url}"
                                    data-title="${post.title}" 
                                    data-author="Feltöltötte: u/${post.author}"
                                    data-post-url="${permalink}"> <div class="blur-bg" style="background-image: url('${post.url}');"></div>
                                <img src="${post.url}" class="main-photo" alt="${post.title}" loading="lazy">
                                
                                <div class="photo-overlay">
                                    <i class="fab fa-reddit fa-2x mb-2"></i>
                                    <h5 class="text-truncate px-2">${post.title}</h5>
                                </div>
                            </div>
                        `;

                        gridElement.appendChild(colDiv);
                        setTimeout(() => colDiv.classList.add('animate-in'), 100 + (addedCount * 50));
                        addedCount++;
                    }
                });

                if (spinner) spinner.style.display = 'none';
                if (statusText) statusText.style.display = 'none';
                if (callback) callback();
            })
            .catch(err => {
                console.error('Reddit hiba:', err);
                if (statusText) statusText.innerText = 'Hiba a betöltéskor.';
                if (spinner) spinner.style.display = 'none';
            });
    }

    // =========================================================
    // B. FŐOLDAL FUNKCIÓI
    // =========================================================
    function initHomePage(container) {
        const subreddit = 'MagyarFemboyCommunity';
        fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=1`)
            .then(res => res.json())
            .then(data => {
                const post = data.data.children[0].data;
                const permalink = `https://www.reddit.com${post.permalink}`;
                let imageHtml = '';

                if (post.url && post.url.match(/\.(jpeg|jpg|gif|png)$/)) {
                    imageHtml = `
                        <div class="reddit-image-wrapper">
                            <div class="blur-bg" style="background-image: url('${post.url}');"></div>
                            <img src="${post.url}" class="main-photo" alt="Reddit Post">
                        </div>
                    `;
                }

                container.innerHTML = `
                    ${imageHtml}
                    <h5 class="fw-bold text-truncate"><a href="${permalink}" target="_blank" class="text-dark text-decoration-none">${post.title}</a></h5>
                    <div class="d-flex justify-content-between text-muted small mt-2">
                        <span>👤 u/${post.author}</span>
                        <span>🔼 ${post.ups}</span>
                    </div>
                `;
            })
            .catch(err => {
                container.innerHTML = '<p class="text-center text-muted small">Nem sikerült betölteni.</p>';
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
            // Amikor a modal megnyílik
            imageModal.addEventListener('show.bs.modal', function (event) {
                // 1. Frissítjük a látható képek listáját (a szűrés miatt fontos!)
                // Csak azokat gyűjtjük ki, amelyeknek az oszlopa (.gallery-col) nem rejtett (.d-none)
                visiblePhotoWrappers = Array.from(document.querySelectorAll('.gallery-col:not(.d-none) .photo-wrapper'));

                const wrapper = event.relatedTarget; // Amire kattintottak

                // 2. Megkeressük, hanyadik kép ez a listában
                currentImageIndex = visiblePhotoWrappers.indexOf(wrapper);

                // 3. Frissítjük a modal tartalmát
                updateModalContent(wrapper);
            });

            // Gomb események
            if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
            if (nextBtn) nextBtn.addEventListener('click', showNextImage);

            // Billentyűzet esemény (bal/jobb nyíl)
            document.addEventListener('keydown', function (e) {
                // Csak akkor, ha a modal nyitva van (van rajta 'show' class)
                if (imageModal.classList.contains('show')) {
                    if (e.key === 'ArrowLeft') showPreviousImage();
                    if (e.key === 'ArrowRight') showNextImage();
                }
            });
        }
    }

    // Segédfüggvény: Modal tartalom frissítése
    function updateModalContent(wrapper) {
        if (!wrapper) return;

        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalRedditLink = document.getElementById('modalRedditLink');

        // Adatok kinyerése
        const imgSrc = wrapper.getAttribute('data-img-src');
        const title = wrapper.getAttribute('data-title');
        const author = wrapper.getAttribute('data-author');
        const postUrl = wrapper.getAttribute('data-post-url'); // Reddit link

        // Tartalom beállítása
        if (modalImage) modalImage.src = imgSrc;
        if (modalTitle) modalTitle.textContent = title || "";
        if (modalDesc) modalDesc.textContent = author || "";

        // Reddit link kezelése
        if (modalRedditLink) {
            if (postUrl && postUrl !== "null") {
                modalRedditLink.href = postUrl;
                modalRedditLink.classList.remove('d-none'); // Megjelenítjük
            } else {
                modalRedditLink.classList.add('d-none'); // Elrejtjük
            }
        }
    }

    // Léptető függvények
    function showPreviousImage() {
        if (visiblePhotoWrappers.length === 0) return;

        if (currentImageIndex > 0) {
            currentImageIndex--;
        } else {
            // Körkörös léptetés: az elejéről a végére ugrunk
            currentImageIndex = visiblePhotoWrappers.length - 1;
        }
        updateModalContent(visiblePhotoWrappers[currentImageIndex]);
    }

    function showNextImage() {
        if (visiblePhotoWrappers.length === 0) return;

        if (currentImageIndex < visiblePhotoWrappers.length - 1) {
            currentImageIndex++;
        } else {
            // Körkörös léptetés: a végéről az elejére ugrunk
            currentImageIndex = 0;
        }
        updateModalContent(visiblePhotoWrappers[currentImageIndex]);
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
});