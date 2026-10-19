/* Életút grafikai galéria: minden rajz egy oldalon. A rajzokat a játék saját (tiszta) SVG-generátorai állítják elő. */
(function (root) {
    'use strict';
    var M = root.MFSZ, D = M.data, A = M.art, C = M.char;
    var out = document.getElementById('out'), nav = document.getElementById('nav');
    var BASE = { skin: 's2', hairStyle: 'bob', hairColor: 'rozsa' };

    function section(title, w) {
        var h = document.createElement('h2');
        h.id = 's' + nav.children.length;
        h.textContent = title;
        var g = document.createElement('div');
        g.className = 'grid';
        g.style.setProperty('--w', (w || 120) + 'px');
        out.appendChild(h); out.appendChild(g);
        var a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = title;
        nav.appendChild(a);
        return g;
    }
    function cell(g, svg, label) {
        var c = document.createElement('div');
        c.className = 'cell';
        c.innerHTML = svg; // a játék saját, ellenőrzött SVG-kimenete
        var sp = document.createElement('span');
        sp.textContent = label;
        c.appendChild(sp);
        g.appendChild(c);
    }

    var g = section('Hangulatok', 110);
    ['neutral', 'happy', 'proud', 'worried', 'sad', 'shy', 'surprised', 'sleepy', 'sleep'].forEach(function (m, i) {
        cell(g, C.portrait(Object.assign({ mood: m, uid: 'gm' + i }, BASE)), m);
    });

    g = section('Szemformák', 110);
    D.EYE_STYLES.forEach(function (e, i) {
        cell(g, C.portrait(Object.assign({ eyes: e.id, mood: 'neutral', uid: 'ge' + i }, BASE), '-30 -156 60 62'), e.label);
    });

    g = section('Pózok', 110);
    ['idle', 'wave', 'hips', 'sit', 'phone'].forEach(function (p, i) {
        cell(g, C.portrait(Object.assign({ pose: p, uid: 'gp' + i, outfit: { top: 'tee', bottom: 'jeans' } }, BASE)), p);
    });

    g = section('Hajformák', 110);
    D.HAIR_STYLES.forEach(function (h, i) {
        cell(g, C.portrait(Object.assign({}, BASE, { hairStyle: h.id, uid: 'gh' + i })), h.label);
    });

    D.SLOTS.forEach(function (sl) {
        var items = D.ITEMS.filter(function (it) { return it.slot === sl.id; });
        if (!items.length) return;
        var gg = section('Tárgyak: ' + (sl.label || sl.id), 96);
        items.forEach(function (it) {
            var svg;
            try { svg = A.thumb(sl.id, it.id, {}); } catch (e) { svg = ''; }
            cell(gg, svg, it.id);
        });
    });

    g = section('Dekor és háziállatok', 96);
    D.DECOR.forEach(function (d) { cell(g, A.thumb('decor', d.id, {}), d.id); });
    D.PETS.forEach(function (d) { cell(g, A.thumb('pet', d.id, {}), d.id); });

    g = section('Sminkek', 96);
    D.BEAUTY.forEach(function (b) { cell(g, A.beautyThumb(b.slot, b.id, {}), b.id); });

    g = section('Minták (póló)', 96);
    D.PATTERNS.forEach(function (p, i) {
        var pats = { top: { id: p.id, color: '#f4a3b8' } };
        cell(g, C.portrait({ skin: 's2', hairStyle: 'bob', hairColor: 'rozsa', outfit: { top: 'tee', bottom: 'jeans' }, patterns: pats, uid: 'gt' + i }, '-36 -110 72 62'), p.id);
    });

    g = section('Szoba: évszakok és állapotok', 300);
    [
        { month: 2 }, { month: 5, mood: 'happy' }, { month: 8, mood: 'sad' }, { month: 11, housing: 'lakas' },
        { month: 2, sleeping: true }, { month: 5, pose: 'sit', studying: true }, { month: 8, housing: 'garzon', mood: 'sleepy' }, { month: 11, housing: 'lakas', sleeping: true }
    ].forEach(function (v, i) {
        cell(g, A.room(Object.assign({}, BASE, { outfit: { top: 'tee', bottom: 'jeans' }, comp: 2, decor: {}, pets: {}, scale: 1, uid: 'gr' + i }, v)), JSON.stringify(v));
    });

    g = section('Esemény-jelenetek', 260);
    A.SCENES.forEach(function (id, i) {
        cell(g, A.scene(id, Object.assign({}, BASE, { outfit: { top: 'tee', bottom: 'jeans' }, mood: 'neutral', uid: 'gs' + i })), id);
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
