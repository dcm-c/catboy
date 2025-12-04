document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBÁLIS VÁLTOZÓK A GALÉRIA LÉPTETÉSHEZ ---
    let visiblePhotoWrappers = []; // Az éppen látható (nem kiszűrt) képek listája
    let currentImageIndex = 0;     // Hol tartunk a listában

    // --- 1. KOMPONENSEK BETÖLTÉSE ---
    loadComponents().then(() => {
        document.body.classList.add('loaded');
        initModal(); // Modal inicializálása a betöltés után
    });
    initPremiumButton();

    // --- 2. OLDAL SPECIFIKUS LOGIKA ---
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
    // ==========================================
    // 1. PREMIUM BUTTON & RICKROLL LOGIKA (GOLYÓÁLLÓ VERZIÓ) 🎵
    // ==========================================
    function initPremiumButton() {

        // Globális kattintás figyelő (Ez kezeli a Menüt és az IGEN gombot is)
        document.body.addEventListener('click', function (e) {

            // --- A. Menü gomb (Premium) megnyitása ---
            // Megnézzük, hogy a kattintott elem (vagy a szülője) a prémium gomb-e
            if (e.target.id === 'btn-premium' || e.target.closest('#btn-premium')) {
                e.preventDefault();
                const modalEl = document.getElementById('premiumModal');
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }

            // --- B. "IGEN" Gomb kezelése (Rickroll) ---
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

                    // Stílus igazítás
                    modalContent.style.border = "none";
                    modalContent.style.background = "transparent";
                }
            }
        });
    }
    // ==========================================
    // 2. INTERAKTÍV MACSKA -> CÁPA EVOLÚCIÓ 🐱 -> 🦈
    // ==========================================
    function initCatInteraction() {
        const container = document.getElementById('corner-cat');
        const bubble = document.getElementById('cat-bubble');
        const icon = container.querySelector('i'); // Az ikon elem

        let clickCount = 0;
        let isShark = false;

        if (container && bubble) {
            container.addEventListener('click', () => {

                // Ha már cápa, akkor csak bugyborékol
                if (isShark) {
                    showBubble("Blub blub... 🫧");
                    return;
                }

                clickCount++;

                // Logika a kattintások számához
                if (clickCount === 3) {
                    showBubble("Nyau! 😽");
                }
                else if (clickCount === 6) {
                    showBubble("Miau! Ne piszkálj! 🙀");
                }
                else if (clickCount >= 9) {
                    // --- ÁTVÁLTOZÁS ---
                    isShark = true;

                    // 1. Ikon csere (halra, vagy ha van cápa ikonod)
                    icon.className = "fas fa-fish cat-icon";

                    // 2. Stílus hozzáadása (kék szín, dőlés)
                    container.classList.add('shark-mode');

                    // 3. Üzenet
                    showBubble("BLÅHAJ MÓD AKTIVÁLVA! 🦈🌊");
                }
            });
        }

        // Segédfüggvény a buborék megjelenítésére
        function showBubble(text) {
            bubble.textContent = text;
            bubble.classList.add('show');

            // 2.5 másodperc múlva eltűnik
            setTimeout(() => {
                bubble.classList.remove('show');
            }, 2500);
        }
    }
    // ==========================================
    // 3. KAMU ÉRTÉKELÉSEK GENERÁTOR (CAROUSEL) 💬
    // ==========================================
    function initFunnyReviews() {
        const track = document.getElementById('reviews-track');
        if (!track) return;
        const reviewsPool = [
            { name: "Cukorfalat99", stars: 5, title: "Végre hazaértem!", desc: "A Monster készlet sosem fogy ki, és mindenki nagyon kedves. A Blåhajom is talált barátokat.", date: "2023.10.12." },
            { name: "ProgramozoZokni", stars: 5, title: "Best Server EU", desc: "Itt tanultam meg C++-ban kódot írni combfixben. 10/10 élmény, ajánlom mindenkinek.", date: "2024.01.05." },
            { name: "AnonimUser", stars: 1, title: "Túl sok a rózsaszín", desc: "Beléptem és azonnal femboy lettem. Most nem tudom, hogyan magyarázzam el anyámnak a szoknyát.", date: "2023.12.24." },
            { name: "UwU_Master", stars: 5, title: "Nyau!", desc: ":3 :3 :3 UwU OwO rawr x3 (Fordítás: Nagyon tetszik a közösség)", date: "2024.02.14." },
            { name: "DiscordMod", stars: 4, title: "Korrekt", desc: "A szabályzat betartása megfelelő, de kevés a kitten. Fejlődni kell!", date: "2023.11.30." },
            { name: "MonsterEnergyFan", stars: 5, title: "Energia túltengés", desc: "A voice chat péntek este olyan, mint egy koffein-túladagolás hangformátumban. Imádom.", date: "2024.03.01." },
            { name: "NemVagyokFemboy", stars: 5, title: "Csak nézelődni jöttem...", desc: "...de maradtam az outfitek miatt. Eskü csak havernak kérdezem, hol veszitek a ruhákat?", date: "2023.09.15." },
            { name: "LinuxUser", stars: 3, title: "Bloatware", desc: "Túl sok az emoji, terminálból nehéz olvasni a chatet. De legalább kedvesek.", date: "2024.01.20." },
            { name: "CatEarHeadphones", stars: 5, title: "Cicafül", desc: "Mindenkinek van cicafüles fülese. Ez a mennyország? 🎧", date: "2023.12.01." },
            { name: "GymBro", stars: 5, title: "Meglepően kemény", desc: "Azt hittem puhányok, de láttam olyat guggolni, amit én nem tudok. Respect.", date: "2024.02.28." },
            { name: "Grandma64", stars: 2, title: "Ez nem a Facebook?", desc: "Hol van az unokám? Miért vannak itt fiúk lányruhában? De a süti recept jó volt.", date: "2023.08.10." },
            { name: "ShadowWizard", stars: 5, title: "Money Gang", desc: "We love casting spells. (És a szervert is).", date: "2024.03.10." },
            { name: "KoffeinKirály", stars: 5, title: "Vesekő Speedrun Any%", desc: "A napi 3 Monster után már látom a hangokat. A szerver segített kiválasztani a legjobb ízt.", date: "2024.03.15." },
            { name: "CsakHavernakKérdem", stars: 5, title: "Nem vagyok femboy, DE...", desc: "...a szoknya meglepően jól szellőzik nyáron. Csak praktikusságból hordom, eskü.", date: "2023.08.20." },
            { name: "LinuxFanboy", stars: 5, title: "I use Arch btw", desc: "Azt hittem ez egy Linux support csoport. Nem az, de a combfix segít a kernel fordításban.", date: "2024.01.11." },
            { name: "ValoDemon", stars: 5, title: "+20% Aim", desc: "Mióta leborotváltam a lábam, Radiantba jutottam Valorantban. Véletlen? Aligha.", date: "2024.02.01." },
            { name: "Nagyi_Marika", stars: 2, title: "Ez nem a horgoló szakkör?", desc: "Aranyos fiúk, de furcsa ruhákat hordanak. A sütemény receptet viszont köszönöm!", date: "2023.11.05." },
            { name: "MélyHangúCica", stars: 4, title: "Voice chat élmény", desc: "Mindenki 'UwU'-zott, amíg be nem szóltam a dörmögő bariton hangomon. A csend megfizethetetlen volt.", date: "2024.03.12." },
            { name: "SharkTank", stars: 5, title: "Cápa Invázió", desc: "Vettem egy Blåhajt az IKEA-ban, most már ő az adminisztrátor a szobámban.", date: "2023.09.30." },
            { name: "RustDeveloper", stars: 5, title: "Memória biztonság", desc: "A kódom biztonságos, a heteroságom már kevésbé. Kösz MFSZ.", date: "2024.02.28." },
            { name: "ApaKicsiFia", stars: 3, title: "Apu gyanakszik", desc: "Azt mondtam, hogy a 'programozó zokni' kell a vérkeringés javítására. Szerintem nem hitte el.", date: "2024.01.02." },
            { name: "StraightDave", stars: 5, title: "Csak ironikusan...", desc: "Csak viccből léptem be 2 éve. Most már szoknyában írom ezt az értékelést. Vigyázzatok, csapda!", date: "2023.07.15." },
            { name: "AmazonFutár", stars: 5, title: "Ti tartotok el", desc: "Nem tudom mik azok a csomagok, amik zörögnek vagy nagyon puhák, de mindig ide hozom őket.", date: "2023.12.10." },
            { name: "GymRat_Femboy", stars: 5, title: "Soha ne hagyd ki a lábnapot", desc: "Itt tanultam meg, hogy a guggolás a femboyok titkos fegyvere. Combok > Minden.", date: "2024.03.05." },
            { name: "SpinnySkirt", stars: 5, title: "Szoknya go brrr", desc: "Vettem egy pörgős szoknyát. Már 3 órája pörgök. Segítség, szédülök.", date: "2023.10.31." },
            { name: "SusImposter", stars: 1, title: "Téves hívás", desc: "Azt hittem ez a Magyar Fémipari Szakszervezet. Csalódtam, de a mémek jók.", date: "2023.06.20." },
            { name: "ThighHighLover", stars: 4, title: "Szorít", desc: "A combfix elszorítja a vérkeringést, de a drip megéri a zsibbadást.", date: "2024.02.19." },
            { name: "E-boy2004", stars: 5, title: "Discord Nitro", desc: "Itt mindenki Nitro-t használ? Azt hittem, ingyen adják a belépéshez.", date: "2023.11.15." },
            { name: "CatBoy_X", stars: 5, title: ":3", desc: "Mrrrp nyaaa meow mrrp :3 (Fordítás: Kiváló közösség, ajánlom.)", date: "2024.03.14." },
            { name: "PipelinePunch", stars: 5, title: "Rózsaszín minden", desc: "A Monster, a billentyűzetem, a lelkem. Minden passzol.", date: "2024.01.25." },
            { name: "HaveromnakKene", stars: 4, title: "Link?", desc: "Egy barátom kérdezi, honnan van a choker. Nem én, a barátom.", date: "2023.09.05." },
            { name: "AlvasHiany", stars: 5, title: "Hajnali 3", desc: "Miért aktívabb a chat hajnali 3-kor, mint délben? Ti nem alszotok??", date: "2024.02.08." }
        ];

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
    }
    // =========================================================
    // A. GALÉRIA OLDAL FUNKCIÓI
    // =========================================================
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