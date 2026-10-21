// =========================================================
// PASZTELL ÉLETÚT - az események felvételei
//
// Minden eseménynek saját képe van: helyszín, napszak, szereplők, tárgyak, fények, élő részletek, kamera.
// Egy felvétel lehet objektum vagy függvény: (s, c) → objektum (a játék állapota szerint változhat).
// A mezők leírása: eletut-stage.js fejléce.
// =========================================================
(function (root) {
    'use strict';
    var M = root.MFSZ = root.MFSZ || {};
    var Stage = M.stage;
    var SH = Stage.shots;

    // rövidítések
    function me(x, mood, pose, o) { return Object.assign({ who: 'me', x: x, y: 226, mood: mood || 'neutral', pose: pose || 'idle' }, o || {}); }
    function pe(who, x, mood, pose, o) { return Object.assign({ who: who, x: x, y: 226, mood: mood || 'neutral', pose: pose || 'idle' }, o || {}); }
    function pr(k, x, y, s, o) { return Object.assign({ k: k, x: x, y: y, s: s === undefined ? 1 : s }, o || {}); }
    function close(x, y, z) { return { x: x, y: y === undefined ? 138 : y, z: z || 1.32 }; }

    // ===== Fejezetek =====
    SH.ch1 = { set: 'bedroom', time: 'golden', cast: [me(150, 'neutral', 'think')], bubble: { at: 'me', icon: 'ques' }, fx: ['dust'], cam: close(190, 135, 1.2) };
    SH.ch2 = { set: 'bedroom', time: 'dusk', o: { messy: false }, cast: [me(190, 'worried')], props: [pr('box', 330, 218, 0.8, { l: true })], bubble: { at: 'me', icon: 'dots' }, fx: ['dust'] };
    SH.ch3 = { set: 'park', time: 'morning', cast: [me(200, 'happy', 'cheer', { s: 0.9 })], fx: ['petals', ['sparkles', { x: 200, y: 90, n: 6 }]] };
    SH.ch4 = { set: 'moving', time: 'day', o: { key: false }, cast: [me(200, 'proud', 'hips')], bubble: { at: 'me', icon: 'light' }, fx: ['dust'] };
    SH.ch5 = { set: 'sunset', time: 'golden', cast: [me(200, 'proud', 'hips', { y: 196 })], fx: [['sparkles', { x: 200, y: 70, n: 7 }]] };

    // ===== 1. fejezet =====
    SH.e_video = { set: 'bedroom', time: 'dark', o: { noLaptop: true }, cast: [me(280, 'surprised', 'phone')], props: [pr('phoneBig', 96, 156, 1.5, { v: 'video', z: 'front', a: 'bob' })], bubble: { at: 'me', icon: 'excl', side: 'l' }, glow: [{ x: 280, y: 120, r: 70, c: '#9fb8ff', o: 0.3 }] };
    SH.e_search = { set: 'desk', time: 'dark', o: { screen: 'chat', wall: '#3a3256' }, cast: [me(300, 'shy', 'think')], props: [pr('chatwin', 70, 120, 1.1, { v: 'dark', seed: 2, z: 'front' })], bubble: { at: 'me', icon: 'ques', side: 'l' } };
    SH.e_thrift = { set: 'thrift', time: 'indoor', cast: [me(200, 'happy', 'hold')], props: [pr('tshirt', 200, 170, 0.95, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'heart' }, fx: [['sparkles', { x: 200, y: 110, n: 6, spread: 50 }]] };
    SH.e_mom_door = { set: 'bedroom', time: 'lamp', o: { door: true }, cast: [me(150, 'surprised'), pe('anya', 354, 'neutral', 'idle', { flip: true })], bubble: { at: 'me', icon: 'excl' }, glow: [{ x: 360, y: 100, r: 70, c: '#fff0c0', o: 0.5 }] };
    SH.e_alias = { set: 'desk', time: 'dark', o: { screen: 'art', dual: true, screen2: 'chat' }, cast: [me(200, 'shy', 'phone')], bubble: { at: 'me', icon: 'sparkle' }, fx: [['sparkles', { x: 120, y: 90, n: 5, spread: 60 }]] };

    // ===== 2. fejezet =====
    SH.e_summer = { set: 'beach', time: 'day', cast: [pe('kisfiu', 330, 'happy', 'point', { s: 0.6 }), me(210, 'happy', 'hold')], props: [pr('icecream', 210, 168, 0.9, { z: 'front', noShadow: true }), pr('signpost', 100, 226, 1.1, { c: '#ffe08a' }), pr('icecream', 100, 150, 0.8, { noShadow: true })], bubble: { at: 1, icon: 'heart', side: 'l' }, fx: [['sparkles', { x: 210, y: 110, n: 5, spread: 50 }]] };
    SH.e_classmate = { set: 'school', o: { v: 'hall' }, time: 'day', cast: [me(150, 'shy'), pe('osztaly1', 290, 'neutral', 'point', { flip: true })], bubbles: [{ at: 'me', icon: 'dots', side: 'l' }, { at: 1, icon: 'ques', side: 'r' }] };
    SH.e_discord = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'game' }, cast: [me(200, 'happy', 'cheer')], bubble: { at: 'me', icon: 'heart' }, fx: [['hearts', { x: 200, y: 100, n: 6 }]], glow: [{ x: 200, y: 120, r: 130, c: '#c9b8ff', o: 0.18 }] };
    SH.e_chat = { set: 'desk', time: 'dark', o: { screen: 'chat' }, cast: [me(300, 'happy', 'hold')], props: [pr('chatwin', 90, 122, 1.2, { seed: 1, z: 'front' })], bubble: { at: 'me', icon: 'chat', side: 'l' } };
    SH.e_discord2 = { set: 'desk', time: 'dark', o: { screen: 'video' }, cast: [me(300, 'neutral', 'think')], props: [pr('chatwin', 70, 120, 1.1, { seed: 3, z: 'front' })], bubble: { at: 'me', icon: 'ques', side: 'l' } };
    SH.e_caught = { set: 'living', time: 'lamp', o: { table: true }, cast: [me(98, 'sad'), pe('anya', 300, 'worried')], props: [pr('tshirt', 178, 198, 0.9, { z: 'front', noShadow: true }), pr('dress', 218, 198, 0.9, { z: 'front', noShadow: true }), pr('lipstick', 240, 196, 0.5, { z: 'front', noShadow: true })], bubble: { at: 1, icon: 'dots', side: 'l' }, cam: close(200, 140, 1.15) };
    SH.e_exam = { set: 'desk', time: 'dark', o: { screen: 'code' }, cast: [me(300, 'sleepy', 'think')], props: [pr('books', 110, 226, 1.1, { z: 'front' }), pr('coffee', 78, 150, 0.8, { noShadow: true, z: 'front' }), pr('calendar', 60, 90, 1.2, { z: 'front', noShadow: true })], fx: [['steam', { x: 78, y: 134 }]], bubble: { at: 'me', icon: 'zzz', side: 'l' } };
    SH.e_hidden_find = { set: 'living', time: 'morning', o: { noTv: false }, cast: [me(130, 'surprised'), pe('anya', 280, 'neutral', 'point')], props: [pr('laundry', 210, 226, 1.1), pr('dress', 284, 150, 0.9, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'excl' } };
    SH.e_family_pc = { set: 'desk', time: 'lamp', o: { screen: 'chat', wall: '#4a4268' }, cast: [pe('apa', 160, 'neutral', 'think'), me(320, 'worried')], bubbles: [{ at: 0, icon: 'ques', side: 'r' }, { at: 'me', icon: 'dots', side: 'l' }] };
    SH.s_lilla_sleepover = { set: 'bedroom', time: 'dark', o: { noBed: false }, cast: [me(170, 'happy', 'wave'), pe('p:lilla', 250, 'happy', 'cheer')], props: [pr('popcorn', 210, 232, 1.1, { z: 'front' }), pr('pillow', 120, 232, 1, { z: 'front' })], bubble: { at: 1, icon: 'heart' }, fx: ['hearts'], glow: [{ x: 210, y: 150, r: 90, c: '#c9b8ff', o: 0.22 }] };
    SH.s_makeup_compliment = { set: 'street', time: 'golden', cast: [me(160, 'shy'), pe('idegen2', 290, 'happy', 'wave', { flip: true })], bubble: { at: 1, icon: 'heart', side: 'l' }, fx: [['sparkles', { x: 160, y: 100, n: 5, spread: 40 }]] };
    SH.s_nori_con_invite = { set: 'living', time: 'golden', o: { table: true }, cast: [me(130, 'happy'), pe('p:nori', 270, 'happy', 'cheer')], props: [pr('cookies', 200, 198, 1.1, { z: 'front' }), pr('balloon', 340, 150, 0.9, { noShadow: true, a: 'bob' })], bubble: { at: 1, icon: 'star' }, fx: ['confetti'] };
    SH.s_bence_mod = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'chat' }, cast: [me(200, 'proud', 'hips')], props: [pr('chatwin', 62, 130, 1, { v: 'alert', seed: 2, z: 'front' })], bubble: { at: 'me', icon: 'star' } };
    SH.s_partner_anniv = { set: 'cafe', time: 'golden', cast: [me(240, 'shy', 'hold'), pe('p:zsombor', 330, 'happy')], props: [pr('candle', 188, 190, 0.9, { z: 'front', noShadow: true }), pr('cakeSlice', 130, 190, 1, { z: 'front' })], bubble: { at: 1, icon: 'heart', side: 'l' }, fx: ['hearts'] };
    SH.s_family_dinner = { set: 'living', time: 'golden', o: { table: true }, cast: [pe('nagyi', 130, 'happy', 'idle', { y: 222, s: 0.74 }), me(200, 'happy', 'idle', { y: 222, s: 0.74 }), pe('anya', 270, 'happy', 'wave', { y: 222, s: 0.74 }), pe('apa', 340, 'neutral', 'idle', { y: 222, s: 0.74 })], props: [pr('pizza', 200, 200, 1.1, { z: 'front', noShadow: true })], bubble: { at: 0, icon: 'heart' } };

    // ===== 3. fejezet =====
    SH.e_adult = { set: 'park', time: 'morning', cast: [pe('osztaly1', 120, 'happy', 'cheer'), me(210, 'happy', 'cheer'), pe('osztaly2', 300, 'happy', 'wave')], fx: ['confetti', 'petals'], bubble: { at: 'me', icon: 'star' } };
    SH.e_con = { set: 'con', time: 'indoor', cast: [pe('p:nori', 110, 'happy', 'wave'), me(210, 'happy', 'cheer', { s: 0.9 })], props: [pr('envelope', 290, 226, 1.1, { z: 'front' })], bubble: { at: 'me', icon: 'star' }, fx: [['confetti', { n: 14 }]] };
    SH.g_invite = { set: 'street', time: 'night', cast: [me(160, 'worried', 'think'), pe('idegen1', 280, 'happy', 'point', { flip: true })], props: [pr('slot', 330, 226, 1.1, { z: 'front', noShadow: true })], bubbles: [{ at: 1, icon: 'money', side: 'r' }, { at: 'me', icon: 'ques', side: 'l' }] };
    SH.e_dinner = { set: 'living', time: 'dusk', o: { table: true }, cast: [me(100, 'worried'), pe('apa', 290, 'neutral', 'idle'), pe('anya', 345, 'neutral')], bubble: { at: 'me', icon: 'dots', side: 'r' }, cam: close(200, 140, 1.12) };
    SH.e_nudge = { set: 'moving', time: 'golden', cast: [me(200, 'neutral', 'think')], props: [pr('key', 290, 226, 1.2, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'light' }, fx: ['dust'] };
    SH.e_dinner2 = { set: 'kitchen', time: 'lamp', cast: [me(150, 'sad'), pe('anya', 250, 'happy', 'hold')], bubble: { at: 1, icon: 'heart', side: 'l' }, cam: close(200, 140, 1.2) };

    // ===== 4. fejezet =====
    SH.e_cowork = { set: 'office', time: 'day', cast: [me(150, 'shy'), pe('kolléga', 270, 'happy')], bubbles: [{ at: 1, icon: 'ques', side: 'l' }] };
    SH.e_stage = { set: 'stage', time: 'dark', cast: [me(200, 'proud', 'wave', { y: 196 })], bubble: { at: 'me', icon: 'star', side: 'r' }, fx: [['sparkles', { x: 200, y: 70, n: 8, spread: 100 }]] };
    SH.e_grad = { set: 'stage', time: 'indoor', o: { audience: true, mic: false }, cast: [pe('osztaly1', 90, 'happy', 'cheer', { y: 196 }), me(200, 'happy', 'cheer', { y: 196 }), pe('osztaly2', 310, 'happy', 'wave', { y: 196 })], props: [pr('page', 200, 130, 1.4, { z: 'front', noShadow: true })], fx: ['confetti'] };
    SH.e_moved = { set: 'moving', time: 'golden', o: { key: true }, cast: [me(200, 'happy', 'cheer')], fx: [['sparkles', { x: 200, y: 90, n: 8 }], 'dust'] };
    SH.e_broke = { set: 'bills', time: 'rain', cast: [me(100, 'worried', 'shrug')], bubble: { at: 'me', icon: 'money', side: 'r' }, fx: [['rain', { n: 14 }]] };

    // ===== 5. fejezet =====
    SH.e_date = { set: 'cafe', time: 'golden', cast: [me(240, 'shy'), pe('p:zsombor', 330, 'happy')], props: [pr('teacup', 110, 188, 1, { z: 'front', noShadow: true })], bubble: { at: 1, icon: 'heart', side: 'l' }, fx: [['hearts', { x: 290, y: 90, n: 4 }]] };
    SH.e_parents_visit = { set: 'living', time: 'day', cast: [me(120, 'happy', 'hold'), pe('anya', 240, 'happy', 'point'), pe('apa', 310, 'neutral')], bubble: { at: 1, icon: 'heart', side: 'l' } };
    SH.e_mentor = { set: 'desk', time: 'dark', o: { screen: 'chat' }, cast: [me(300, 'proud', 'think')], props: [pr('chatwin', 80, 124, 1.2, { v: 'alert', seed: 1, z: 'front' })], bubble: { at: 'me', icon: 'chat', side: 'l' }, fx: [['sparkles', { x: 200, y: 90, n: 4 }]] };
    SH.e_omen = { set: 'sunset', time: 'dusk', cast: [me(200, 'neutral', 'think', { y: 196 })], bubble: { at: 'me', icon: 'dots' }, fx: [['sparkles', { x: 200, y: 60, n: 6, spread: 120 }]] };

    // ===== Véletlen események =====
    SH.r_note_good = { set: 'street', time: 'golden', cast: [me(150, 'happy'), pe('idegen1', 300, 'happy', 'wave', { flip: true })], bubble: { at: 1, icon: 'heart', side: 'l' }, fx: [['sparkles', { x: 150, y: 100, n: 5, spread: 40 }]] };
    SH.r_note_funny = { set: 'street', time: 'day', cast: [me(190, 'surprised', 'shrug'), pe('idegen1', 300, 'happy', 'point', { flip: true })], bubble: { at: 1, icon: 'note', side: 'l' } };
    SH.r_note_bad = { set: 'street', time: 'overcast', cast: [pe('idegen1', 70, 'neutral', 'idle', { y: 206, s: 0.55 }), pe('idegen2', 330, 'neutral', 'idle', { y: 206, s: 0.55 }), me(200, 'sad')], bubble: { at: 'me', icon: 'drop', side: 'r' } };
    SH.r_catears = { set: 'street', time: 'day', o: { tram: true }, cast: [me(210, 'happy', 'wave'), pe('kisfiu', 310, 'happy', 'point', { s: 0.6, flip: true }), pe('idegen2', 345, 'shy', 'idle', { s: 0.8 })], bubble: { at: 1, icon: 'heart', side: 'l' } };
    SH.r_sew = { set: 'bedroom', time: 'lamp', o: { noLaptop: true }, cast: [me(210, 'proud', 'hold')], props: [pr('sewing', 90, 150, 1.1), pr('dress', 210, 168, 0.95, { z: 'front', noShadow: true }), pr('yarn', 150, 230, 0.9, { z: 'front', noShadow: true })], fx: [['sparkles', { x: 210, y: 110, n: 6, spread: 50 }]], bubble: { at: 'me', icon: 'sparkle' } };
    SH.r_gamenight = { set: 'desk', time: 'dark', o: { screen: 'game', dual: true, screen2: 'chat' }, cast: [me(200, 'happy', 'cheer')], props: [pr('chatwin', 350, 128, 0.9, { v: 'call', z: 'front' })], fx: [['notes', { x: 200, y: 100 }]], bubble: { at: 'me', icon: 'star' } };
    SH.r_firststream = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'game' }, cast: [me(200, 'shy', 'hold')], props: [pr('studiomic', 240, 168, 1.1, { z: 'front', noShadow: true }), pr('chatwin', 350, 134, 0.9, { seed: 2, z: 'front' })], fx: [['hearts', { x: 200, y: 100, n: 5 }]], bubble: { at: 'me', icon: 'heart', side: 'l' } };
    SH.r_cat = { set: 'desk', time: 'lamp', o: { screen: 'code' }, cast: [me(130, 'surprised', 'shrug')], bubble: { at: 'me', icon: 'excl', side: 'r' }, props: [pr('cat', 330, 152, 1.5, { noShadow: true, a: 'breath' })] };
    SH.r_landlord = { set: 'living', time: 'day', o: { door: true }, cast: [me(140, 'worried'), pe('haziur', 330, 'neutral', 'hold')], bubble: { at: 1, icon: 'ques', side: 'l' }, props: [pr('hangers', 215, 120, 1.2, { z: 'front' })] };
    SH.r_roommate = { set: 'living', time: 'golden', cast: [me(150, 'shy'), pe('szobatars', 290, 'happy', 'think')], props: [pr('laptop', 210, 226, 1.1, { z: 'front' })], bubble: { at: 1, icon: 'ques', side: 'l' } };
    SH.r_neighbor = { set: 'living', time: 'dark', o: { door: true }, cast: [me(150, 'sleepy', 'shrug'), pe('szomszed', 340, 'worried', 'point', { flip: true })], bubbles: [{ at: 1, icon: 'angry', side: 'l' }, { at: 'me', icon: 'dots', side: 'r', dx: -12 }], glow: [{ x: 360, y: 110, r: 60, c: '#fff0c0', o: 0.4 }] };
    SH.r_housewarming = { set: 'living', time: 'golden', o: { table: true }, cast: [pe('c1', 90, 'happy', 'cheer', { s: 0.74 }), me(200, 'happy', 'cheer', { y: 226 }), pe('c2', 310, 'happy', 'wave', { s: 0.74 }), pe('c5', 360, 'happy', 'idle', { s: 0.7 })], props: [pr('giftBox', 150, 228, 1.1, { z: 'front' }), pr('cakeBig', 250, 200, 0.7, { z: 'front', noShadow: true }), pr('stringlights', 20, 24, 1, { x2: 380, y2: 24, sag: 12, n: 9 })], fx: ['confetti'] };
    SH.r_jobday = { set: 'office', time: 'day', cast: [me(220, 'neutral', 'hold')], props: [pr('clipboard', 220, 166, 1, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'light' } };
    SH.r_laptop_dies = { set: 'desk', time: 'dark', o: { screen: 'crash' }, cast: [me(300, 'surprised', 'shrug')], bubble: { at: 'me', icon: 'excl', side: 'l' }, glow: [{ x: 200, y: 110, r: 150, c: '#6fa0ff', o: 0.25 }] };
    SH.r_kind = { set: 'desk', time: 'dark', o: { screen: 'chat' }, cast: [me(300, 'shy', 'hold')], props: [pr('chatwin', 80, 126, 1.2, { seed: 3, z: 'front' })], bubble: { at: 'me', icon: 'heart', side: 'l' }, fx: [['hearts', { x: 300, y: 100, n: 5 }]] };
    SH.r_coffee = { set: 'desk', time: 'lamp', o: { screen: 'code' }, cast: [me(260, 'surprised', 'shrug')], props: [pr('coffee', 150, 150, 1, { noShadow: true, z: 'front' })], fx: [['steam', { x: 150, y: 132 }]], bubble: { at: 'me', icon: 'drop', side: 'l' } };
    SH.r_sale = { set: 'thrift', time: 'indoor', cast: [me(200, 'happy', 'cheer')], props: [pr('signpost', 330, 226, 1.1, { c: '#e4577a' })], bubble: { at: 'me', icon: 'money', side: 'r' }, fx: [['sparkles', { x: 200, y: 100, n: 7 }]] };
    SH.r_flu = { set: 'bedroom', time: 'lamp', cast: [me(190, 'sleepy', 'idle', { x: 190 })], props: [pr('teacup', 130, 150, 1, { z: 'front', noShadow: true }), pr('pillow', 300, 226, 1.1, { z: 'front' })], fx: [['steam', { x: 130, y: 134 }]], bubble: { at: 'me', icon: 'zzz', side: 'r' } };
    SH.r_cringe = { set: 'bedroom', time: 'dark', o: { noLaptop: true }, cast: [me(200, 'shy', 'shrug')], bubbles: [{ at: 'me', icon: 'dots', side: 'l' }], cam: close(200, 140, 1.4), glow: [{ x: 200, y: 110, r: 80, c: '#9fb8ff', o: 0.15 }] };
    SH.r_bonus = { set: 'office', time: 'day', cast: [me(160, 'happy', 'cheer'), pe('fonok', 290, 'happy', 'point', { flip: true })], props: [pr('envelope', 230, 226, 1.1, { z: 'front' })], fx: ['confetti'], bubble: { at: 'me', icon: 'money', side: 'r' } };
    SH.r_rent = { set: 'bills', time: 'dark', cast: [me(100, 'worried', 'shrug')], props: [pr('envelope', 250, 200, 1.4, { z: 'front', a: 'bob' })], bubble: { at: 'me', icon: 'excl', side: 'r' } };
    SH.r_friend = { set: 'desk', time: 'dark', o: { screen: 'video', dual: true, screen2: 'chat' }, cast: [me(200, 'happy', 'cheer')], props: [pr('popcorn', 330, 228, 1.2, { z: 'front' })], bubble: { at: 'me', icon: 'chat', side: 'r' }, fx: [['hearts', { x: 200, y: 100, n: 4 }]] };
    SH.r_street = { set: 'street', time: 'golden', cast: [me(160, 'surprised'), pe('idegen2', 300, 'happy', 'wave', { flip: true })], bubble: { at: 'me', icon: 'heart', side: 'r' }, fx: [['sparkles', { x: 160, y: 100, n: 5, spread: 40 }]] };
    SH.r_bday = { set: 'bedroom', time: 'day', cast: [me(200, 'happy', 'hold')], props: [pr('giftBox', 150, 228, 1.1, { z: 'front' }), pr('envelope', 200, 168, 1, { z: 'front', noShadow: true }), pr('balloon', 340, 128, 1.1, { noShadow: true, a: 'bob' }), pr('balloon', 360, 140, 1, { noShadow: true, a: 'bob', delay: 0.6 })], fx: ['confetti'], bubble: { at: 'me', icon: 'gift', side: 'r' } };
    SH.g_bigwin = { set: 'casino', time: 'dark', cast: [me(200, 'surprised', 'cheer')], fx: ['confetti', ['sparkles', { x: 200, y: 100, n: 10, spread: 110 }], 'flash'], bubble: { at: 'me', icon: 'money', side: 'r' } };
    SH.g_friend = { set: 'desk', time: 'dark', o: { screen: 'chat' }, cast: [me(300, 'worried', 'think')], props: [pr('chatwin', 80, 126, 1.2, { seed: 2, z: 'front' })], bubble: { at: 'me', icon: 'dots', side: 'l' } };
    SH.g_ruin = { set: 'bills', time: 'rain', cast: [me(100, 'sad')], props: [pr('moneybag', 270, 226, 1.2, { z: 'front' }), pr('banknote', 330, 226, 1.1, { z: 'front' })], bubble: { at: 'me', icon: 'drop', side: 'r' }, fx: [['rain', { n: 14 }]] };
    SH.g_return = { set: 'casino', time: 'dark', cast: [me(200, 'neutral', 'think')], bubble: { at: 'me', icon: 'ques' } };

    // ===== Barát-kezdeményezések =====
    SH.f_lilla = { set: 'park', time: 'day', cast: [pe('guest', 160, 'happy', 'hold'), me(250, 'happy', 'wave')], props: [pr('icecream', 160, 168, 0.9, { z: 'front', noShadow: true })], bubble: { at: 0, icon: 'heart', side: 'l' }, fx: ['petals'] };
    SH.f_bence = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'video' }, cast: [me(200, 'shy', 'wave')], props: [pr('chatwin', 340, 128, 1, { v: 'call', z: 'front' })], bubble: { at: 'me', icon: 'chat', side: 'l' }, fx: [['hearts', { x: 200, y: 100, n: 4 }]] };
    SH.f_nori = { set: 'kitchen', time: 'day', o: { mess: true }, cast: [pe('guest', 120, 'happy', 'cheer'), me(280, 'happy', 'hold')], props: [pr('sewing', 200, 148, 0.9, { noShadow: true }), pr('yarn', 160, 148, 0.8, { noShadow: true }), pr('scissors', 240, 148, 0.8, { noShadow: true })], bubble: { at: 0, icon: 'sparkle' }, fx: [['sparkles', { x: 200, y: 110, n: 6 }]] };
    SH.f_kata = { set: 'office', time: 'day', cast: [me(150, 'happy'), pe('guest', 260, 'happy', 'wave')], props: [pr('cookie', 205, 200, 1, { z: 'front', noShadow: true }), pr('coffee', 340, 150, 1, { noShadow: true })], bubble: { at: 1, icon: 'heart', side: 'r' } };
    SH.f_csalad = { set: 'living', time: 'golden', o: { table: true }, cast: [pe('anya', 110, 'happy', 'wave', { s: 0.78 }), pe('apa', 160, 'happy', 'idle', { s: 0.78 }), me(300, 'happy', 'wave')], props: [pr('cake', 200, 200, 1.1, { z: 'front', noShadow: true }), pr('phone', 130, 170, 0.8, { z: 'front', noShadow: true })], bubble: { at: 0, icon: 'heart', side: 'l' } };
    SH.f_zsombor = { set: 'rooftop', time: 'night', o: { telescope: true }, cast: [pe('guest', 150, 'shy', 'idle', { y: 196 }), me(246, 'happy', 'idle', { y: 196 })], bubble: { at: 0, icon: 'heart' }, fx: [['fireflies', { n: 8 }]] };

    // ===== Történetívek =====
    SH.a_hold1 = { set: 'desk', time: 'dark', o: { screen: 'art' }, cast: [me(300, 'surprised', 'phone')], props: [pr('phoneBig', 78, 156, 1.5, { v: 'art', z: 'front', a: 'bob' })], bubble: { at: 'me', icon: 'sparkle', side: 'l' }, fx: [['sparkles', { x: 130, y: 90, n: 6, spread: 50 }]] };
    SH.a_hold2 = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'art' }, cast: [me(200, 'shy', 'hold')], bubble: { at: 'me', icon: 'star' }, fx: [['sparkles', { x: 280, y: 90, n: 5, spread: 50 }]] };
    SH.a_hold3 = { set: 'con', time: 'indoor', cast: [pe('holdfeny', 120, 'happy', 'wave'), me(215, 'happy', 'cheer', { s: 0.9 })], props: [pr('zine', 64, 150, 1.4), pr('zine', 92, 150, 1.4), pr('zine', 336, 150, 1.4)], bubble: { at: 0, icon: 'heart', side: 'l' }, fx: ['confetti'] };
    SH.a_hold4 = { set: 'desk', time: 'dark', o: { screen: 'art' }, cast: [me(300, 'proud', 'hold')], props: [pr('tablet', 110, 228, 1.2, { z: 'front' }), pr('chatwin', 70, 120, 1, { v: 'alert', seed: 1, z: 'front' })], bubble: { at: 'me', icon: 'sparkle', side: 'l' } };
    SH.a_lilla1 = { set: 'park', time: 'golden', cast: [pe('p:lilla', 160, 'worried', 'think'), me(250, 'shy')], bubbles: [{ at: 0, icon: 'ques', side: 'l' }, { at: 'me', icon: 'dots', side: 'r' }], fx: ['leaves'] };
    SH.a_lilla2 = function (s) {
        return { set: 'street', time: 'rain', cast: [pe('p:lilla', 168, 'sad', 'idle', { s: 0.8 }), me(256, 'worried')], props: [pr('umbrella', 212, 226, 1.15, { c: '#f5a9b8' })], bubble: { at: 1, icon: 'heart', side: 'r' }, fx: [['rain', { n: 50 }]] };
    };
    SH.a_lilla3 = { set: 'beach', time: 'golden', cast: [pe('p:lilla', 150, 'happy', 'cheer'), me(250, 'happy', 'cheer')], props: [pr('balloon', 340, 160, 1, { a: 'bob' })], bubble: { at: 0, icon: 'heart', side: 'l' }, fx: [['sparkles', { x: 200, y: 90, n: 8, spread: 120 }]] };
    SH.a_bence1 = { set: 'desk', time: 'dark', o: { screen: 'chat', dual: true, screen2: 'chat' }, cast: [me(200, 'surprised')], props: [pr('chatwin', 60, 132, 1, { v: 'alert', seed: 1, z: 'front' }), pr('chatwin', 340, 126, 1, { v: 'alert', seed: 2, z: 'front' })], bubble: { at: 'me', icon: 'excl' }, glow: [{ x: 200, y: 110, r: 150, c: '#ff6a8a', o: 0.16 }] };
    SH.a_bence2 = { set: 'train', time: 'day', o: { v: 'stop' }, cast: [pe('p:bence', 130, 'happy', 'wave'), me(250, 'happy', 'wave')], props: [pr('suitcase', 70, 226, 1.1, { c: '#9fd6f5' })], bubble: { at: 0, icon: 'star', side: 'l' } };
    SH.a_fam1 = { set: 'living', time: 'day', cast: [me(130, 'surprised'), pe('anya', 235, 'worried'), pe('nagyi', 305, 'neutral', 'hold')], props: [pr('dress', 305, 168, 0.9, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'excl', side: 'r' } };
    SH.a_fam2 = { set: 'kitchen', time: 'golden', cast: [me(200, 'proud', 'hold')], props: [pr('package', 200, 168, 1, { z: 'front', noShadow: true }), pr('sewing', 330, 148, 0.9, { noShadow: true })], bubble: { at: 'me', icon: 'heart' }, fx: [['sparkles', { x: 200, y: 110, n: 6 }]] };

    // ===== Con-ív =====
    SH.c_budget = { set: 'bedroom', time: 'lamp', cast: [me(210, 'neutral', 'think')], props: [pr('moneybag', 150, 232, 1.1, { z: 'front' }), pr('calendar', 280, 232, 1, { z: 'front' }), pr('banknote', 245, 232, 1, { z: 'front' })], bubble: { at: 'me', icon: 'money' } };
    SH.c_pick = { set: 'bedroom', time: 'day', cast: [me(190, 'happy', 'hold')], props: [pr('suitcase', 280, 226, 1.1, { c: '#f5a9b8' }), pr('tshirt', 190, 168, 0.95, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'phone', side: 'r' } };
    SH.c_day = { set: 'con', time: 'indoor', cast: [pe('p:nori', 110, 'happy', 'wave'), me(210, 'happy', 'cheer', { s: 0.92 })], bubble: { at: 'me', icon: 'star', side: 'r' }, fx: [['confetti', { n: 16 }]] };
    SH.c_after = function (s) {
        var won = s && s.flags && s.flags.con_won;
        return { set: 'sunset', time: 'dusk', cast: [pe('p:nori', 150, 'happy', 'idle', { y: 196 }), me(246, 'happy', 'wave', { y: 196 })], props: won ? [pr('trophy', 200, 220, 1.4, { z: 'front' })] : [], bubble: { at: 0, icon: 'heart', side: 'l' }, fx: [['sparkles', { x: 200, y: 70, n: 6, spread: 110 }]] };
    };
    SH.c_year = { set: 'con', time: 'indoor', cast: [me(200, 'happy', 'cheer', { s: 0.9 })], props: [pr('balloon', 70, 148, 1.2, { a: 'bob' }), pr('balloon', 335, 150, 1.2, { a: 'bob', delay: 0.8 })], fx: ['confetti'], bubble: { at: 'me', icon: 'star' } };
    SH.c_year_extra = { set: 'stage', time: 'dark', o: { audience: true, mic: false }, cast: [me(150, 'proud', 'hold', { y: 196 })], props: [pr('easel', 270, 196, 1.2), pr('trophy', 330, 188, 1.1)], bubble: { at: 'me', icon: 'sparkle', side: 'r' }, fx: [['sparkles', { x: 220, y: 80, n: 6 }]] };

    // ===== Új véletlen események =====
    SH.r_park_dog = { set: 'park', time: 'day', cast: [me(160, 'surprised', 'hold')], props: [pr('dog', 300, 228, 1.4, { z: 'front' }), pr('cookie', 160, 168, 0.9, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'heart', side: 'r' } };
    SH.r_library_book = { set: 'library', time: 'day', cast: [me(170, 'shy', 'hold')], props: [pr('books', 170, 170, 1.1, { z: 'front', noShadow: true })], bubble: { at: 'me', icon: 'light', side: 'r' }, fx: ['dust'] };
    SH.r_train_lost = { set: 'train', time: 'day', cast: [me(240, 'surprised', 'point')], props: [pr('wallet', 330, 168, 1.4, { noShadow: true })], bubble: { at: 'me', icon: 'excl', side: 'r' } };
    SH.r_roof_night = { set: 'rooftop', time: 'night', o: { telescope: true, blanket: true }, cast: [me(200, 'happy', 'point', { y: 196 })], bubble: { at: 'me', icon: 'star' }, fx: [['fireflies', { n: 8 }], ['sparkles', { x: 250, y: 50, n: 4, spread: 80 }]] };
    SH.r_beach_day = { set: 'beach', time: 'day', cast: [me(200, 'happy', 'cheer')], props: [pr('balloon', 100, 200, 1, { a: 'bob' })], bubble: { at: 'me', icon: 'sparkle', side: 'r' }, fx: [['sparkles', { x: 200, y: 90, n: 6, spread: 100 }]] };
    SH.r_kitchen_fail = { set: 'kitchen', time: 'morning', o: { mess: true }, cast: [me(250, 'surprised', 'shrug')], props: [pr('cake', 150, 148, 1.2, { noShadow: true }), pr('pan', 90, 150, 1.1, { noShadow: true })], fx: [['steam', { x: 90, y: 138 }]], bubble: { at: 'me', icon: 'excl', side: 'l' } };
    SH.r_rain_umbrella = { set: 'street', time: 'rain', cast: [pe('idegen1', 290, 'neutral', 'idle'), me(160, 'sad')], props: [pr('umbrella', 290, 226, 1.15, { c: '#9fd6f5' })], bubble: { at: 'me', icon: 'ques', side: 'r' }, fx: [['rain', { n: 50 }]] };
    SH.r_contest_draw = { set: 'desk', time: 'dark', o: { screen: 'art' }, cast: [me(300, 'proud', 'hold')], props: [pr('tablet', 110, 228, 1.2, { z: 'front' }), pr('trophy', 340, 150, 0.9, { noShadow: true })], bubble: { at: 'me', icon: 'star', side: 'l' }, fx: [['sparkles', { x: 200, y: 90, n: 5, spread: 80 }]] };
})(typeof globalThis !== 'undefined' ? globalThis : this);
