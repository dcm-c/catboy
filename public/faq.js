// =========================================================
// GYIK: közvetlen hivatkozás (pl. rules.html -> index.html#faq-unban kinyitja a kérdést)
// =========================================================
(function () {
    'use strict';

    function openFromHash() {
        var id = (location.hash || '').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target || !target.classList.contains('faq-item')) return;
        var panel = target.querySelector('.accordion-collapse');
        if (window.bootstrap && panel) window.bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false }).show();
        target.scrollIntoView({ block: 'center' });
    }

    function init() {
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
