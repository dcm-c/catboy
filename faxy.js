/* ==========================================================================
   2HB FOXCOMM 9.0 - CHAOS EDITION
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

// --- 2. ÚJ GENERÁLT TÖLTŐKÉPERNYŐK ---
function generateRandomLoader() {
    const loader = document.getElementById('loader');
    // 4 fajta loader: 0=Fox (eredeti), 1=BIOS, 2=BSOD, 3=Update
    const type = Math.floor(Math.random() * 4);

    // Alap gomb (amit majd beszúrunk mindenhova)
    const startBtnHTML = `<button id="startSystemBtn" style="display:none; margin-top: 20px; padding: 10px; background: red; color: yellow; font-weight: bold; border: 3px outset white; cursor: pointer; z-index:99999; position:relative;">>>> RENDSZER INDÍTÁSA <<<</button>`;

    if (type === 0) {
        // Eredeti Rókás
        loader.innerHTML = `<div class="fox-spinner">🦊</div><div class="loader-text">RENDSZER OPTIMALIZÁLÁSA...<br><span class="fake-gif-new">V 9.0</span></div>${startBtnHTML}`;
        const animals = ['🦊', '🐀', '🦖', '🪳', '🐷', '💀'];
        const spinner = loader.querySelector('.fox-spinner');
        spinner.innerHTML = animals[Math.floor(Math.random() * animals.length)];
        spinner.classList.add(['spin', 'spin-3d', 'spin-wobble'][Math.floor(Math.random() * 3)]);
    }
    else if (type === 1) {
        // BIOS Boot Screen
        loader.innerHTML = `
            <div class="bios-loader">
                <div class="bios-header"><span>FoxBIOS (C) 2003</span><span>Energy Star Ally</span></div>
                Main Processor : AMD Duron(tm) 800MHz<br>
                Memory Test : 64KB OK<br><br>
                Detecting Primary Master ... FoxComm HDD 20GB<br>
                Detecting Primary Slave  ... None<br>
                Detecting Secondary Master ... CD-ROM 52X<br><br>
                <b>CMOS Checksum Error - Defaults Loaded</b><br>
                Press F1 to continue, DEL to enter Setup<br><br>
                ${startBtnHTML}
            </div>
        `;
    }
    else if (type === 2) {
        // Kékhalál (BSOD)
        loader.innerHTML = `
            <div class="bsod-loader">
                <span class="bsod-large">Windows</span><br>
                A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36.<br>
                The current application will be terminated.<br><br>
                * Press any key to terminate the current application.<br>
                * Press CTRL+ALT+DEL to restart your computer. You will lose any unsaved information in all applications.<br><br>
                Press any key to continue<br><br>
                ${startBtnHTML}
            </div>
        `;
    }
    else {
        // Windows Update
        loader.innerHTML = `
            <div class="update-loader">
                <div class="update-spinner"></div>
                <div style="font-size: 20px;">A frissítések telepítése folyamatban...</div>
                <div style="margin-top: 10px;">Ne kapcsolja ki a számítógépet.</div>
                <div style="color: #ccc; margin-top: 5px;">99% kész</div>
                <br>
                ${startBtnHTML}
            </div>
        `;
    }
}

// --- 3. RANDOM CHAOS EVENTEK ---
function triggerChaos() {
    const events = [
        // 1. A Segéd megjelenése
        () => {
            let clippy = document.querySelector('.annoying-assistant');
            if (!clippy) {
                clippy = document.createElement('div');
                clippy.className = 'annoying-assistant';
                clippy.innerHTML = `<div class="assistant-eyes">👀</div><div>Úgy látom, próbálsz kattintani.<br>Segíthetek tönkretenni?</div>`;
                document.body.appendChild(clippy);
            }
            clippy.classList.add('assistant-visible');
            playSystemBeep('click');
            setTimeout(() => clippy.classList.remove('assistant-visible'), 5000);
        },
        // 2. Képernyő invertálás
        () => {
            document.body.classList.add('chaos-invert');
            setTimeout(() => document.body.classList.remove('chaos-invert'), 200);
        },
        // 3. Fejreállás
        () => {
            if (Math.random() > 0.7) {
                document.body.classList.add('chaos-tilt');
                setTimeout(() => document.body.classList.remove('chaos-tilt'), 3000);
            }
        },
        // 4. Random Alert
        () => {
            createFakeWindow(Math.random() * window.innerWidth / 2, Math.random() * window.innerHeight / 2, "Promóció", "Nyertél egy ingyen iPhone 4-et!");
        }
    ];

    // 10 másodpercenként 30% esély egy eseményre
    setInterval(() => {
        if (Math.random() > 0.7) {
            const ev = events[Math.floor(Math.random() * events.length)];
            ev();
        }
    }, 10000);
}


// --- 4. BETÖLTÉS ÉS INIT ---
document.addEventListener('DOMContentLoaded', () => {
    generateRandomLoader(); // Véletlen loader generálása

    // Start gomb késleltetve
    setTimeout(() => {
        const btn = document.getElementById('startSystemBtn');
        if (btn) btn.style.display = 'block';
    }, 2500);

    // Globális eseményfigyelő a dinamikusan generált gombhoz
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'startSystemBtn') {
            initAudio();
            playFakeXPSound();
            const loader = document.getElementById('loader');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.getElementById('content').style.display = 'block';
                triggerChaos(); // Káosz indítása
            }, 500);
            const bgAudio = document.getElementById('chiptune-bg');
            if (bgAudio) bgAudio.play().catch(() => { });
        }
    });

    initListeners();
    initMatrix();
});

// --- SEGÉDFÜGGVÉNYEK (Ablakok, Mátrix, stb) ---

function initListeners() {
    // Kaszkád
    const btnCascade = document.getElementById('btnCascade');
    if (btnCascade) btnCascade.addEventListener('click', () => {
        let i = 0; const int = setInterval(() => {
            createFakeWindow(100 + i * 20, 100 + i * 20, "HIBA", "Rendszerhiba #" + i);
            playSystemBeep('error');
            if (++i > 15) clearInterval(int);
        }, 150);
    });

    // Progress
    const btnProgress = document.getElementById('btnProgress');
    if (btnProgress) btnProgress.addEventListener('click', () => {
        const win = createFakeWindow(300, 300, "Telepítés", "Másolás...", true);
        let w = 0; const bar = win.querySelector('.progress-blocks');
        const int = setInterval(() => {
            w += 2; if (bar) bar.style.width = w + '%';
            if (w >= 100) { clearInterval(int); win.querySelector('.window-content-area').innerHTML = 'KÉSZ.<br><button onclick="this.closest(\'.retro-window\').remove()">OK</button>'; playFakeXPSound(); }
        }, 50);
    });

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

    // ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") document.querySelectorAll('.retro-window').forEach(w => w.remove());
    });

    // Téma gombok
    window.setGlitchTheme = function (t) {
        document.body.className = '';
        setTimeout(() => document.body.classList.add('theme-' + t), 100);
        playSystemBeep('click');
    };

    // Random Kapcsolók
    setInterval(() => {
        const t = document.querySelectorAll('.toggle-switch');
        if (t.length) {
            const el = t[Math.floor(Math.random() * t.length)];
            el.classList.toggle('off');
            el.innerHTML = el.classList.contains('off') ? "OFF ⭘" : "ON ⏻";
            playSystemBeep('click');
        }
    }, 2000);
}

function createFakeWindow(x, y, title, content, isProgress) {
    const w = document.createElement('div'); w.className = 'retro-window';
    w.style.left = x + 'px'; w.style.top = y + 'px'; w.style.zIndex = 10000 + Math.floor(Math.random() * 100);
    w.innerHTML = `<div class="retro-header"><span>${title}</span><div class="retro-close-btn">X</div></div><div class="retro-body"><div class="retro-icon">${isProgress ? '⏳' : '❌'}</div><div style="width:100%" class="window-content-area">${content}${isProgress ? '<div class="progress-container"><div class="progress-blocks" style="width:0%"></div></div>' : ''}</div></div>`;
    w.querySelector('.retro-close-btn').onclick = () => w.remove();
    w.onmousedown = () => w.style.zIndex = parseInt(w.style.zIndex) + 100;
    document.body.appendChild(w);
    return w;
}

function initMatrix() {
    const c = document.getElementById('matrixCanvas'); if (!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const chars = "01".split(""); const cols = c.width / 16; const drops = Array(Math.ceil(cols)).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#0F0"; ctx.font = "16px monospace";
        for (let i = 0; i < drops.length; i++) {
            ctx.fillText(chars[Math.floor(Math.random() * 2)], i * 16, drops[i] * 16);
            if (drops[i] * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(() => {
        if (Math.random() > 0.8) {
            document.body.classList.add('matrix-active');
            const i = setInterval(draw, 33);
            setTimeout(() => { clearInterval(i); document.body.classList.remove('matrix-active') }, 4000);
        }
    }, 15000);
}