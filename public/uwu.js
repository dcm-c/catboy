// =========================================================
// UwU szövegátalakító (a buzi mód része) - magyarra szabva
//
// Tiszta függvények, DOM nélkül (Node-ban is tesztelhető: test/uwu.test.js).
// Alapelvek:
//  - Determinisztikus: ugyanabból a szövegből mindig ugyanaz lesz (nincs véletlen, így nem "ugrál" a szöveg,
//    és a ki-be kapcsolás után is ugyanaz látszik).
//  - Szavakat alakít, nem karakterhalmazt: a számok, linkek, e-mail címek, ALL-CAPS rövidítések, márkanevek
//    és az "ly" kettősbetű érintetlen marad.
//  - Az emote-ok csak mondatvégre kerülnek, a rövidítések (pl., kb., stb.) és a számok utáni pont után nem,
//    és nem minden mondat után, különben olvashatatlan lenne.
// =========================================================
(function (root) {
    'use strict';

    var EMOTES = [' :3', ' UwU', ' OwO', ' nyau~', ' >w<', ' ^w^', ' mrrp~'];

    // Ezeket a szavakat békén hagyjuk (márkák, játékok, amiket félreértene az olvasó)
    var KEEP = /^(discord|reddit|formspree|minecraft|among|goose|duck|gartic|valorant|mondocon|bl[aå]haj|ikea|instagram|bootstrap|google|youtube|tiktok|windows|linux|monster|energy|nitro|hungary|femboy|femboyok|blue|pink|pl|kb|stb|ill|db|dr|ld|vö|max|min|kft|zrt|tel|info|html|www)$/i;

    // Rövidítések, amik után a pont nem mondatvég
    var ABBR = /(^|[\s(])(pl|kb|stb|ill|ún|db|ld|kb|vö|ti|dr|ált|max|min|évf|sz|kft|zrt|nr|tel|ford|kül|hrsz|u\.i|ui|ua)$/i;

    function hash(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }

    var VOWELS = 'aáeéiíoóöőuúüű';
    function isVowel(ch) { return !!ch && VOWELS.indexOf(ch.toLowerCase()) >= 0; }
    function isLetter(ch) { return !!ch && ch.toLowerCase() !== ch.toUpperCase(); }

    // Egy szó átalakítása. A szó betűk (és kötőjel) sorozata.
    function uwuWord(w, seed) {
        if (w.length < 2 && !/[rlRL]/.test(w)) return w;
        if (KEEP.test(w)) return w;
        if (w.length > 1 && w === w.toUpperCase() && /[A-ZÁÉÍÓÖŐÚÜŰ]{2,}/.test(w)) return w; // MFSZ, DCM, NSFW

        // Szavanként dől el (a szó hash-éből), mi történik vele: így a szöveg olvasható marad, mégis "uwus".
        // r/l -> w a szavak ~70%-ában, na/no/nu -> nya/nyo/nyu a ~60%-ában, dadogás a ~1/9-ében.
        var hw = hash(w.toLowerCase() + seed);
        var doW = (hw % 10) < 7, doNy = ((hw >>> 4) % 10) < 6, stutter = ((hw >>> 8) % 9) === 0;
        if (w.length <= 3) { doW = true; stutter = false; }
        var out = '';
        for (var i = 0; i < w.length; i++) {
            var c = w[i], n = w[i + 1], p = w[i - 1];
            var lc = c.toLowerCase();
            if (doW && lc === 'r') { out += c === 'R' ? 'W' : 'w'; continue; }
            if (doW && lc === 'l') {
                if (n && n.toLowerCase() === 'y') { out += c; continue; }          // "ly" (j-hang) marad
                out += c === 'L' ? 'W' : 'w'; continue;
            }
            // na/no/nu -> nya/nyo/nyu (az "ny" kettősbetű és a "nn" maradjon)
            if (doNy && lc === 'n' && n && 'aouáóú'.indexOf(n.toLowerCase()) >= 0 && (!p || p.toLowerCase() !== 'n')) {
                out += c + 'y'; continue;
            }
            out += c;
        }
        // dadogás: csak 4+ betűs, mássalhangzóval kezdődő szónál, a kimenet első betűjével ("w-wövid")
        if (stutter && w.length >= 4 && isLetter(out[0]) && !isVowel(out[0]) && !/^(sz|zs|cs|gy|ny|ty|dz|ly)/i.test(w)) {
            out = out[0] + '-' + out;
        }
        return out;
    }

    // Mondatvégi emote helye: a ./!/? után, ha nem rövidítés/szám és nem egy pontos felsorolás.
    function sentenceEnds(text) {
        var ends = [], re = /([.!?…]+)(?=\s|$)/g, m;
        while ((m = re.exec(text))) {
            var before = text.slice(0, m.index);
            var tail = before.slice(-6);
            if (m[1] === '.' && (/\d$/.test(before) || ABBR.test(tail) || /(^|\s)\S$/.test(before))) continue; // 3. fejezet, pl., "A."
            ends.push(m.index + m[1].length);
        }
        return ends;
    }

    function uwuify(text) {
        if (!text || !text.trim()) return text;
        var src = text;
        // emote-jelölők (\u0001) a mondatvégekre - a pontok még az eredeti szövegen dőlnek el (rövidítések, számok)
        if (text.trim().length >= 28) {
            var ends = sentenceEnds(text), picks = [];
            for (var i = 0; i < ends.length; i++) if (i === ends.length - 1 || i % 2 === 1) picks.push(ends[i]);
            if (picks.length > 3) picks = picks.slice(-3);
            for (var k = picks.length - 1; k >= 0; k--) src = src.slice(0, picks[k]) + '\u0001' + src.slice(picks[k]);
        }
        var seed = text.length, n = 0;
        // tokenek: URL / e-mail / számot tartalmazó szó érintetlen; a többi szavanként
        var out = src.replace(/(https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+|[^\s\u0001]*\d[^\s\u0001]*)|([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüűåÅ][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüűåÅ'’-]*)/g,
            function (m, keep, word) { return keep ? keep : uwuWord(word, seed); });
        return out.replace(/\u0001/g, function () { return EMOTES[hash(text + (n++)) % EMOTES.length]; });
    }

    var api = { uwuify: uwuify, uwuWord: uwuWord, sentenceEnds: sentenceEnds, EMOTES: EMOTES };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MFSZUwu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
