// =========================================================
// ADATKEZELÉSI KAPU
//
// A kapcsolatfelvételi űrlap és az unban-kérelem csak akkor küldhető el, ha a látogató elolvasta az adatkezelési
// tájékoztatót: egy ablakban megnyílik a teljes szöveg, az "Elolvastam" gomb csak a végére görgetés után aktív,
// utána kell még külön bepipálni a megerősítést. A beküldéssel együtt az olvasás időpontja is megy (privacy_read).
//
// Használat: a <form> kapja a data-privacy-gate attribútumot. (Kliensoldali kapu: segít a figyelmes
// olvasásban, de nem biztonsági határ.)
// =========================================================
(function () {
    'use strict';

    var SRC = 'privacy.html';
    var KEY = 'mfsz-privacy-read';
    var readAt = null;
    var gates = [];
    var modal = null, modalEl = null, bodyEl = null, acceptBtn = null, hintEl = null, loaded = false;

    try { readAt = sessionStorage.getItem(KEY); } catch (e) { /* privát mód */ }

    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html !== undefined) n.innerHTML = html;
        return n;
    }

    // ---------- A megerősítő ablak ----------
    function ensureModal() {
        if (modalEl) return;
        modalEl = el('div', 'modal fade');
        modalEl.id = 'privacyReadModal';
        modalEl.tabIndex = -1;
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.setAttribute('data-no-uwu', '');
        modalEl.innerHTML =
            '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">' +
            '<div class="modal-content custom-card">' +
            '<div class="modal-header"><h2 class="modal-title h5 fw-bold">Adatkezelési tájékoztató 🛡️</h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Bezárás"></button></div>' +
            '<div class="modal-body privacy-modal-body" tabindex="0"><p class="text-muted">Betöltés…</p></div>' +
            '<div class="modal-footer justify-content-between">' +
            '<span class="privacy-scroll-hint text-muted">⬇️ Görgess a végére, utána aktív lesz a gomb.</span>' +
            '<button type="button" class="btn btn-primary-custom" disabled>Elolvastam, megértettem ✅</button>' +
            '</div></div></div>';
        document.body.appendChild(modalEl);
        bodyEl = modalEl.querySelector('.privacy-modal-body');
        acceptBtn = modalEl.querySelector('.modal-footer .btn');
        hintEl = modalEl.querySelector('.privacy-scroll-hint');
        if (window.bootstrap) modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        bodyEl.addEventListener('scroll', checkBottom, { passive: true });
        acceptBtn.addEventListener('click', accept);
        modalEl.addEventListener('shown.bs.modal', checkBottom);
    }

    function checkBottom() {
        if (!bodyEl || !loaded || !bodyEl.clientHeight) return; // amíg az ablak nem látszik, nincs mit mérni
        var atEnd = bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 12;
        if (atEnd) {
            acceptBtn.disabled = false;
            hintEl.textContent = '✔️ Végigolvastad, most már megerősítheted.';
        }
    }

    function loadPolicy() {
        if (loaded) return Promise.resolve();
        return fetch(SRC, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        }).then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var src = doc.querySelector('section .col-lg-8');
            if (!src) throw new Error('nincs szöveg');
            bodyEl.innerHTML = '';
            Array.prototype.forEach.call(src.children, function (c) { bodyEl.appendChild(document.importNode(c, true)); });
            loaded = true;
        }).catch(function () {
            bodyEl.innerHTML = '<p>A tájékoztató most nem töltődött be ide. <a href="' + SRC +
                '" target="_blank" rel="noopener">Nyisd meg külön lapon</a>, olvasd el, majd gyere vissza és erősítsd meg.</p>';
            loaded = true;
            acceptBtn.disabled = false;
            hintEl.textContent = 'Külön lapon olvasd el, utána erősítsd meg.';
        });
    }

    function openPolicy() {
        ensureModal();
        if (!modal) { // Bootstrap nélkül: külön lapon nyitjuk, a megerősítés a visszatérés után jön
            window.open(SRC, '_blank', 'noopener');
            setTimeout(accept, 6000);
            return;
        }
        modal.show();
        loadPolicy().then(function () { setTimeout(checkBottom, 60); });
    }

    function accept() {
        readAt = new Date().toISOString();
        try { sessionStorage.setItem(KEY, readAt); } catch (e) { /* nem baj */ }
        if (modal) modal.hide();
        gates.forEach(refresh);
    }

    // ---------- Az űrlapok kapuja ----------
    function refresh(g) {
        var read = !!readAt;
        g.box.classList.toggle('is-read', read);
        g.check.disabled = !read;
        if (!read) g.check.checked = false;
        g.status.textContent = read ? 'Elolvastad a tájékoztatót. Pipáld be, ha tudomásul vetted.' : 'A küldéshez előbb olvasd el a tájékoztatót.';
        g.readBtn.textContent = read ? 'Újraolvasom' : 'Tájékoztató elolvasása 📖';
        g.hidden.value = read ? readAt : '';
        g.submit.disabled = !(read && g.check.checked);
    }

    var seq = 0;
    function setup(form) {
        var submit = form.querySelector('[type="submit"]');
        if (!submit) return;
        var id = 'privacyOk' + (++seq);
        var box = el('div', 'privacy-gate');
        box.setAttribute('data-no-uwu', ''); // jogi szöveg: UwU-módban is egyértelmű marad
        box.innerHTML =
            '<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="' + id + '" disabled>' +
            '<label class="form-check-label fw-bold" for="' + id + '">Elolvastam és megértettem az adatkezelési tájékoztatót</label></div>' +
            '<div class="d-flex flex-wrap align-items-center gap-2"><button type="button" class="btn btn-sm btn-outline-primary btn-read-privacy"></button>' +
            '<small class="text-muted privacy-status"></small></div>';
        var hidden = el('input');
        hidden.type = 'hidden';
        hidden.name = 'privacy_read';
        var anchor = submit.closest('.text-center, .mb-3, .mb-4') && submit.closest('.text-center, .mb-3, .mb-4').parentNode === form ? submit.closest('.text-center, .mb-3, .mb-4') : submit;
        form.insertBefore(box, anchor);
        form.appendChild(hidden);
        var g = {
            form: form, box: box, submit: submit, hidden: hidden,
            check: box.querySelector('input'), readBtn: box.querySelector('.btn-read-privacy'), status: box.querySelector('.privacy-status')
        };
        gates.push(g);
        g.readBtn.addEventListener('click', openPolicy);
        g.check.addEventListener('change', function () { refresh(g); });
        form.addEventListener('submit', function (e) {
            if (!readAt || !g.check.checked) {
                e.preventDefault();
                if (!readAt) openPolicy();
            }
        });
        refresh(g);
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('form[data-privacy-gate]'), setup);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
