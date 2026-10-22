// UwU szövegátalakító: olvasható marad, nem rontja el a számokat, linkeket, rövidítéseket; determinisztikus.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { uwuify, uwuWord, sentenceEnds } = require(path.join(__dirname, '..', 'public', 'uwu.js'));

test('determinisztikus: ugyanabból a szövegből mindig ugyanaz lesz', () => {
    const t = 'Szia Cukorfalat! Üdv a Magyar Femboy Szakszervezetben! Ez a te biztonságos kis szigeted.';
    assert.equal(uwuify(t), uwuify(t));
});

test('számok, linkek, e-mail címek és rövidítések érintetlenek', () => {
    const out = uwuify('Évente legalább 4 alkalommal, pl. a https://femboy.hu/rules.html oldalon vagy az info@femboy.hu címen.');
    assert.ok(out.includes('https://femboy.hu/rules.html'));
    assert.ok(out.includes('info@femboy.hu'));
    assert.ok(/ 4 /.test(out));
    assert.ok(/\bpl\./.test(out), 'a "pl." rövidítés maradjon: ' + out);
});

test('ALL-CAPS rövidítések és márkanevek maradnak', () => {
    assert.equal(uwuWord('MFSZ', 1), 'MFSZ');
    assert.equal(uwuWord('NSFW', 1), 'NSFW');
    assert.equal(uwuWord('Discord', 1), 'Discord');
    assert.equal(uwuWord('Reddit', 1), 'Reddit');
});

test('az "ly" kettősbetű nem változik', () => {
    // minden szóra, függetlenül attól, hogy a hash melyik ágat adja
    for (let seed = 0; seed < 40; seed++) {
        const w = uwuWord('hely', seed);
        assert.ok(/ly/.test(w), 'hely -> ' + w);
    }
});

test('a r/l -> w csere a szavak nagy részében megtörténik, de nem mindegyikben (olvasható marad)', () => {
    const words = ['Magyar', 'szeretet', 'öröm', 'kerek', 'lila', 'barátok', 'közösség', 'rózsaszín', 'biztonságos', 'találkozó',
        'szabályzat', 'felhasználó', 'kérdések', 'válaszok', 'program', 'játékok', 'tiltólista', 'ölelés', 'barlang', 'szoknya'];
    const changed = words.filter(w => uwuWord(w, 7) !== w).length;
    assert.ok(changed >= 10 && changed < words.length, 'átalakult: ' + changed + '/' + words.length);
    assert.equal(uwuWord('r', 1), 'w');
    assert.ok(!/[^a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű-]/.test(uwuWord('szeretet', 1)), 'csak betű marad');
});

test('az emote csak mondatvégre kerül, számok és rövidítések utáni pontra nem', () => {
    const t = 'A 3. fejezet kb. húsz oldal. Ez egy hosszabb mondat, ami után lehet emote!';
    const out = uwuify(t);
    assert.ok(!/3\. (:3|UwU|OwO|nyau~|>w<|\^w\^|mrrp~)/.test(out), '3. után ne legyen: ' + out);
    assert.ok(!/kb\. (:3|UwU|OwO|nyau~|>w<|\^w\^|mrrp~)/.test(out), 'kb. után ne legyen: ' + out);
    assert.ok(/(:3|UwU|OwO|nyau~|>w<|\^w\^|mrrp~)$/.test(out), 'a végén legyen: ' + out);
    assert.equal(sentenceEnds('kb. 5. van! Igen.').length >= 1, true);
});

test('rövid szövegek (gombok, feliratok) nem kapnak emote-ot, az emoji és a szóköz marad', () => {
    assert.equal(uwuify('Küldés 🚀').includes('🚀'), true);
    assert.ok(!/(:3|UwU|OwO|nyau~|>w<|\^w\^|mrrp~)/.test(uwuify('Küldés 🚀')));
    assert.equal(uwuify('   '), '   ');
    assert.equal(uwuify(''), '');
});

test('nem lesz szétcsúszva: a hosszú szövegben legfeljebb 3 emote van, és a szöveg hossza ésszerű', () => {
    const long = Array(12).fill('Ez egy elég hosszú, teljesen átlagos mondat a közösségről.').join(' ');
    const out = uwuify(long);
    const emotes = (out.match(/ (:3|UwU|OwO|nyau~|>w<|\^w\^|mrrp~)/g) || []).length;
    assert.ok(emotes <= 3, 'emote-ok: ' + emotes);
    assert.ok(out.length < long.length * 1.35);
});
