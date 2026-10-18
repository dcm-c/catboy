#!/usr/bin/env python3
"""Az Életút kellékeihez használt Fluent Emoji (Flat) rajzokat egyetlen JS fájlba gyűjti.

Forrás: https://github.com/microsoft/fluentui-emoji  (MIT licenc, Copyright (c) Microsoft Corporation)
Használat: python3 tools/build-eletut-assets.py <fluentui-emoji klón> public/eletut-assets.js
A rajzok 32x32-es koordinátarendszerűek; a szám-pontosságot egy tizedesre vágjuk, hogy kisebb legyen a fájl.
"""
import os, re, sys

ASSETS = {
    'window': 'Window', 'bed': 'Bed', 'couch': 'Couch and lamp', 'mirror': 'Mirror', 'door': 'Door',
    'pc': 'Desktop computer', 'laptop': 'Laptop', 'keyboard': 'Keyboard', 'joystick': 'Joystick', 'gamepad': 'Video game',
    'disk': 'Computer disk', 'cat': 'Cat', 'blackcat': 'Black cat', 'hedgehog': 'Hedgehog', 'shark': 'Shark',
    'coffee': 'Hot beverage', 'teacup': 'Teacup without handle', 'boba': 'Bubble tea', 'books': 'Books', 'plant': 'Potted plant',
    'picture': 'Framed picture', 'candle': 'Candle', 'bulb': 'Light bulb', 'teddy': 'Teddy bear', 'rainbowflag': 'Rainbow flag',
    'transflag': 'Transgender flag', 'sparkles': 'Sparkles', 'heart': 'Heart decoration', 'balloon': 'Balloon', 'cake': 'Birthday cake',
    'shopping': 'Shopping bags', 'tshirt': 'T-shirt', 'dress': 'Dress', 'ballet': 'Ballet shoes', 'backpack': 'Backpack',
    'briefcase': 'Briefcase', 'package': 'Package', 'truck': 'Delivery truck', 'house': 'House', 'dept': 'Department store',
    'office': 'Office building', 'city': 'Cityscape', 'dusk': 'Cityscape at dusk', 'studiomic': 'Studio microphone', 'mic': 'Microphone',
    'speech': 'Speech balloon', 'slot': 'Slot machine', 'die': 'Game die', 'moneybag': 'Money bag', 'receipt': 'Receipt',
    'banknote': 'Dollar banknote', 'phone': 'Mobile phone', 'envelope': 'Envelope', 'camera': 'Camera', 'icecream': 'Ice cream',
    'tree': 'Deciduous tree', 'pine': 'Evergreen tree', 'chair': 'Chair', 'lipstick': 'Lipstick', 'nailpolish': 'Nail polish',
    'gift': 'Wrapped gift', 'cloud': 'Cloud', 'sun': 'Sun', 'moon': 'Crescent moon', 'headphone': 'Headphone', 'battery': 'Battery',
    'memo': 'Memo', 'clipboard': 'Clipboard', 'newspaper': 'Newspaper', 'pencil': 'Pencil', 'palette': 'Artist palette',
    'scissors': 'Scissors', 'yarn': 'Yarn', 'glasses': 'Glasses', 'crystal': 'Crystal ball', 'candy': 'Candy', 'cookie': 'Cookie',
    'cupstraw': 'Cup with straw', 'beveragebox': 'Beverage box', 'canned': 'Canned food', 'alarm': 'Alarm clock', 'bell': 'Bell',
    'megaphone': 'Megaphone', 'key': 'Key', 'bank': 'Bank', 'school': 'School', 'store': 'Convenience store', 'circus': 'Circus tent',
    'cactus': 'Cactus', 'seedling': 'Seedling', 'tulip': 'Tulip', 'cherry': 'Cherry blossom', 'bouquet': 'Bouquet', 'clover': 'Four leaf clover',
    'star': 'Glowing star', 'crown': 'Crown', 'ribbon': 'Ribbon', 'lollipop': 'Lollipop', 'cupcake': 'Cupcake', 'magicwand': 'Magic wand',
    'calendar': 'Spiral calendar', 'page': 'Page facing up', 'nightstars': 'Night with stars', 'rainbow': 'Rainbow', 'labcoat': 'Lab coat',
    'sparkler': 'Sparkler', 'pizza': 'Pizza', 'film': 'Clapper board', 'speaker': 'Loudspeaker', 'trophy': 'Trophy', 'medal': '1st place medal',
}

def short(m):
    v = float(m.group(0))
    s = ('%.1f' % v).rstrip('0').rstrip('.')
    return s if s not in ('-0', '') else '0'

def main(src, out):
    items = {}
    for key, name in ASSETS.items():
        d = os.path.join(src, 'assets', name, 'Flat')
        if not os.path.isdir(d):
            print('hiányzik:', name); continue
        f = [x for x in os.listdir(d) if x.endswith('.svg')][0]
        t = open(os.path.join(d, f), encoding='utf-8').read()
        assert 'url(#' not in t and ' id=' not in t, name
        inner = re.sub(r'^\s*<svg[^>]*>', '', t.strip())
        inner = re.sub(r'</svg>\s*$', '', inner)
        inner = re.sub(r'\s+', ' ', inner.replace('\n', ' '))
        inner = re.sub(r'(?<=[\d.])\s+(?=[-\d])', ' ', inner)
        inner = re.sub(r'-?\d+\.\d{2,}', short, inner)
        inner = inner.replace('> <', '><').strip()
        items[key] = inner
    lines = [
        '// =========================================================',
        '// PASZTELL ÉLETÚT - kellékek (Fluent Emoji, Flat változat)',
        '//',
        '// Forrás: https://github.com/microsoft/fluentui-emoji - MIT licenc, Copyright (c) Microsoft Corporation.',
        '// Generálva: tools/build-eletut-assets.py (ne kézzel szerkeszd). Minden rajz 32x32-es koordinátarendszerű.',
        '// =========================================================',
        '(function (root) {',
        "    'use strict';",
        '    var M = root.MFSZ = root.MFSZ || {};',
        '    M.assets = {',
    ]
    ks = sorted(items)
    for i, k in enumerate(ks):
        lines.append("        %s: %s%s" % (k, repr(items[k]).replace('\\\\', '\\\\'), ',' if i < len(ks) - 1 else ''))
    lines += ['    };', "    if (typeof module !== 'undefined' && module.exports) module.exports = M.assets;", "})(typeof globalThis !== 'undefined' ? globalThis : this);", '']
    open(out, 'w', encoding='utf-8').write('\n'.join(lines))
    print(len(items), 'rajz,', os.path.getsize(out) // 1024, 'KB')

main(sys.argv[1], sys.argv[2])
