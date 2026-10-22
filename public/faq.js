// =========================================================
// GYIK: keresés a kérdések és válaszok között + közvetlen hivatkozás (#faq-unban nyitja ki a kérdést)
// =========================================================
(function () {
    'use strict';

    function norm(s) {
        return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function init() {
        var acc = document.getElementById('faqAccordion');
        if (!acc) return;
        var items = Array.prototype.slice.call(acc.querySelectorAll('.faq-item'));
        var input = document.getElementById('faq-search');
        var empty = document.getElementById('faq-empty');

        // A kereshető szöveg a data-search attribútumból jön: az UwU-mód átírja a látható szöveget,
        // a keresésnek viszont az eredetire kell illeszkednie.
        var index = items.map(function (it) {
            return norm(it.getAttribute('data-search') || (it.querySelector('.faq-question').textContent + ' ' + it.querySelector('.accordion-body').textContent));
        });

        function filter() {
            var q = norm(input.value).trim();
            var words = q ? q.split(/\s+/) : [];
            var shown = 0;
            items.forEach(function (it, i) {
                var ok = words.every(function (w) { return index[i].indexOf(w) >= 0; });
                it.classList.toggle('d-none', !ok);
                if (ok) shown++;
            });
            if (empty) empty.classList.toggle('d-none', shown > 0);
        }
        if (input) input.addEventListener('input', filter);

        function openFromHash() {
            var id = (location.hash || '').slice(1);
            if (!id) return;
            var target = document.getElementById(id);
            if (!target || !target.classList.contains('faq-item')) return;
            var panel = target.querySelector('.accordion-collapse');
            if (window.bootstrap && panel) window.bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false }).show();
            target.scrollIntoView({ block: 'center' });
        }
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
