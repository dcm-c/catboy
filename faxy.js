/* ==========================================================================
   2HB FOXCOMM 10.0 - OVERLOAD EDITION
   ========================================================================== */
let audioContext = null;

// --- 1. HANG MOTOR ---
function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
}

function playFakeXPSound() {
    initAudio();
    const now = audioContext.currentTime;
    const notes = [{ f: 311, t: 0, d: 2 }, { f: 466, t: 0.4, d: 2 }, { f: 622, t: 0.8, d: 2 }, { f: 830, t: 1.2, d: 3 }, { f: 932, t: 1.6, d: 4 }];
    const mg = audioContext.createGain(); mg.gain.setValueAtTime(0.5, now); mg.connect(audioContext.destination);
    notes.forEach(n => {
        const o = audioContext.createOscillator(); const g = audioContext.createGain();
        o.type = 'triangle'; o.frequency.value = n.f;
        g.gain.setValueAtTime(0, now + n.t); g.gain.linearRampToValueAtTime(0.3, now + n.t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        o.connect(g); g.connect(mg); o.start(now + n.t); o.stop(now + n.t + n.d);
    });
}

function playSystemBeep(type) {
    initAudio();
    const o = audioContext.createOscillator(); const g = audioContext.createGain();
    g.connect(audioContext.destination);
    if (type === 'error') {
        o.type = 'sawtooth'; o.frequency.value = 100; g.gain.setValueAtTime(0.3, audioContext.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    } else {
        o.type = 'square'; o.frequency.value = 1200; g.gain.setValueAtTime(0.1, audioContext.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    }
    o.start(); o.stop(audioContext.currentTime + 0.3);
}
function generateRandomLoader() {
    const l = document.getElementById('loader'), t = Math.floor(Math.random() * 2);
    const btn = `<button id="startSystemBtn" style="display:none;margin-top:20px;padding:10px;background:red;color:yellow;font-weight:bold;border:3px outset white;cursor:pointer;z-index:999;">>>> RENDSZER INDÍTÁSA <<<</button>`;
    if (t === 0) {
        l.innerHTML = `<div class="fox-spinner">🦊</div><div class="loader-text">OPTIMALIZÁLÁS...<br><span class="fake-gif-new">V10</span></div>${btn}`;
        randomizeLoaderAnim();
    } else {
        l.innerHTML = `<div class="bios-loader">FoxBIOS (C) 2003<br>Checking NVRAM.. UPDATE OK<br>Keyboard error or no keyboard present<br>${btn}</div>`;
    }
}
function randomizeLoaderAnim() { const s = document.querySelector('.fox-spinner'); if (s) s.className = 'fox-spinner ' + ['spin', 'spin-3d', 'spin-wobble'][Math.floor(Math.random() * 3)]; }
// --- 1. ÚJ FUNKCIÓ: TELJES KÉPERNYŐS OVERLAYEK ---
function triggerFullOverlay(type) {
    playSystemBeep('click');
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    document.body.appendChild(overlay);

    if (type === 'DEFRAG') {
        let blocksHTML = '';
        for (let i = 0; i < 400; i++) blocksHTML += `<div class="defrag-block" id="blk-${i}"></div>`;
        overlay.innerHTML = `
            <h2>LEMEZ TÖREDEZETTSÉGMENTESÍTÉS</h2>
            <div>C: MEGHAJTÓ - SEKTOR 7G</div>
            <div class="defrag-grid">${blocksHTML}</div>
            <div style="margin-top:20px;">Kérlek várj... <span id="defrag-percent">0</span>%</div>
            <button onclick="this.parentElement.remove()" style="margin-top:20px;">MÉGSE (Nem működik)</button>
        `;

        // Animáció
        let i = 0;
        const int = setInterval(() => {
            const blk = document.getElementById(`blk-${i}`);
            if (blk) {
                // Random szín: zöld (jó), piros (hiba), sárga (feldolgozás)
                const rnd = Math.random();
                if (rnd > 0.9) blk.className = 'defrag-block block-bad';
                else if (rnd > 0.6) blk.className = 'defrag-block block-processing';
                else blk.className = 'defrag-block block-done';
            }
            playSystemBeep('click'); // Zajos legyen
            document.getElementById('defrag-percent').innerText = Math.floor((i / 400) * 100);
            i++;
            if (i >= 400) {
                clearInterval(int);
                overlay.innerHTML = `<h1>KÉSZ</h1><div>A lemez most 120%-kal töredezettebb.</div><button onclick="this.parentElement.remove()">KÖSZ</button>`;
                playFakeXPSound();
            }
        }, 20); // Gyors pörgés
    }

    else if (type === 'HACKING') {
        overlay.style.background = 'black';
        overlay.style.color = '#0f0';
        overlay.style.fontFamily = 'monospace';
        overlay.style.alignItems = 'flex-start';
        overlay.style.padding = '20px';
        overlay.innerHTML = `<div id="hack-log">CONNECTING TO PENTAGON...</div>`;

        const logs = [
            "BYPASSING FIREWALL...", "ACCESS GRANTED", "DOWNLOADING 'ALIEN_PHOTOS.ZIP'...",
            "ENCRYPTING LOCAL DRIVE...", "SENDING GPS DATA...", "INSTALLING KEYLOGGER...",
            "UPLOADING BROWSER HISTORY TO PARENTS...", "ERROR: TOO MUCH RAM DOWNLOADED"
        ];

        let i = 0;
        const int = setInterval(() => {
            const logDiv = document.getElementById('hack-log');
            logDiv.innerHTML += `<br>> ${logs[i] || "..."}`;
            playSystemBeep('error');
            i++;
            if (i > 15) {
                clearInterval(int);
                setTimeout(() => overlay.remove(), 2000);
            }
        }, 600);
    }
}

// --- 2. ÚJ FUNKCIÓ: GHOST SWITCH (RANDOM KAPCSOLÓ) ---
function spawnGhostSwitch() {
    const swContainer = document.createElement('div');
    swContainer.className = 'ghost-switch-container';
    // Random pozíció
    swContainer.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    swContainer.style.top = Math.random() * (window.innerHeight - 50) + 'px';

    const label = Math.random() > 0.5 ? "DONT CLICK" : "FREE RAM";
    swContainer.innerHTML = `<span style="color:magenta; font-weight:bold;">${label}</span> <span class="toggle-switch">OFF ⭘</span>`;

    document.body.appendChild(swContainer);

    // Esemény
    const toggle = swContainer.querySelector('.toggle-switch');
    toggle.onclick = () => {
        playSystemBeep('error');
        toggle.innerHTML = "ON ⏻";
        toggle.style.background = "lime";

        // Káosz effekt
        document.body.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
        spawnFloatEmoji();

        setTimeout(() => swContainer.remove(), 500);
    };

    // Eltűnik magától 3mp után ha nem nyomod meg
    setTimeout(() => { if (swContainer.parentElement) swContainer.remove(); }, 3000);
}

// --- 3. RANDOM LEBEGŐ EMOJIK ---
function spawnFloatEmoji() {
    const emojis = ['💸', '🦠', '🔞', '🚨', '💩', '💣', '💊'];
    const el = document.createElement('div');
    el.className = 'float-emoji';
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * window.innerWidth + 'px';
    el.style.top = (window.innerHeight - 50) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// --- INIT ÉS EVENT LISTENER BEKÖTÉS ---
document.addEventListener('DOMContentLoaded', () => {
    generateRandomLoader();
    setTimeout(() => { document.getElementById('startSystemBtn').style.display = 'block'; }, 2000);

    // Indítás gomb
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'startSystemBtn') {
            initAudio(); playFakeXPSound();
            const l = document.getElementById('loader'); l.style.opacity = '0';
            setTimeout(() => { l.style.display = 'none'; document.getElementById('content').style.display = 'block'; startChaosEngine(); }, 500);
            const bg = document.getElementById('chiptune-bg'); if (bg) bg.play().catch(() => { });
        }
    });
    initListeners();
});

function startChaosEngine() {
    setInterval(() => {
        if (Math.random() > 0.6) spawnGhostSwitch();
    }, 5000);

    // Random Emoji
    setInterval(() => {
        if (Math.random() > 0.8) spawnFloatEmoji();
    }, 2000);
}

function initListeners() {
    initToggles();
    // OVERLAY GOMBOK BEKÖTÉSE
    const btnDefrag = document.getElementById('btnDefrag');
    if (btnDefrag) btnDefrag.addEventListener('click', () => triggerFullOverlay('DEFRAG'));

    const btnHacking = document.getElementById('btnHacking');
    if (btnHacking) btnHacking.addEventListener('click', () => triggerFullOverlay('HACKING'));
    // Formázás
    const btnFormat = document.getElementById('btnFormat');
    if (btnFormat) btnFormat.addEventListener('click', () => {
        const win = createFakeWindow(200, 200, "Format C:", "Törlés...", true);
        let w = 0; const bar = win.querySelector('.progress-blocks');
        const int = setInterval(() => {
            w++; if (bar) bar.style.width = w + '%';
            if (w >= 100) { clearInterval(int); win.querySelector('.window-content-area').innerHTML = 'FORMAT COMPLETE.<br><button onclick="this.closest(\'.retro-window\').remove()">PÁNIK</button>'; playFakeXPSound(); }
        }, 30);
    });
    // Régi gombok
    const btnCascade = document.getElementById('btnCascade');
    if (btnCascade) btnCascade.addEventListener('click', () => {
        let i = 0; const int = setInterval(() => { createFakeWindow(100 + i * 20, 100 + i * 20, "HIBA", "Fatal Error"); playSystemBeep('error'); if (++i > 10) clearInterval(int); }, 100);
    });
    const cpurs = document.getElementById('cursorSelect').addEventListener('change', function () {
        document.body
            .style.cursor = this.value;
    });
}
// Pánik gomb
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") { document.querySelectorAll('.retro-window, .fullscreen-overlay, .ghost-switch-container').forEach(w => w.remove()); document.body.style.filter = 'none'; }
});


// Globális téma (ha a HTML-ben inline van)
window.setGlitchTheme = (t) => {
    playSystemBeep('click'); document.body.className = '';
    setTimeout(() => document.body.classList.add('theme-' + t), 100);
};
function createFakeWindow(x, y, title, content, isProgress) {
    const w = document.createElement('div'); w.className = 'retro-window';
    w.style.left = x + 'px'; w.style.top = y + 'px'; w.style.zIndex = 10000 + Math.floor(Math.random() * 100);
    w.innerHTML = `<div class="retro-header"><span>${title}</span><div class="retro-close-btn">X</div></div><div class="retro-body"><div class="retro-icon">${isProgress ? '⏳' : '❌'}</div><div style="width:100%" class="window-content-area">${content}${isProgress ? '<div class="progress-container"><div class="progress-blocks" style="width:0%"></div></div>' : ''}</div></div>`;
    w.querySelector('.retro-close-btn').onclick = () => w.remove();
    w.onmousedown = () => w.style.zIndex = parseInt(w.style.zIndex) + 100;
    document.body.appendChild(w);
    return w;
}
function initToggles() {
    const toggles = document.querySelectorAll('.toggle-switch');
    setInterval(() => {
        if (toggles.length === 0) return;
        const idx = Math.floor(Math.random() * toggles.length);
        const el = toggles[idx];
        playSystemBeep('click');

        if (el.classList.contains('off')) {
            el.classList.remove('off'); el.innerHTML = "ON ⏻";
        } else {
            el.classList.add('off'); el.innerHTML = "OFF ⭘";
        }
    }, 2000);
}
