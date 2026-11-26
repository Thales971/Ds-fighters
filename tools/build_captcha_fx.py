#!/usr/bin/env python3
"""Atlas de habilidades do CAPTCHA GUARD (arte do dono, nov/2026).

Fontes (arte-fonte/pitoco-pet/Rafael-personagem/Captcha-guard-personagem/, fundo magenta):
  F1 1bb58d5d: estouro | orbe | projetil | capsula / estrela | fumaca | clarao | anel
  F2 3dbafe46: espiral | orbe eletrico | rastro | rastro de fogo / estouro | anel | nuvem | brilhos
  F3 4ca77a00: estrela | bolha | projetil | capsula / explosao | fumaca | dupla | anel
  F4 9ae7b08d: vortice | esfera eletrica | feixe | feixe / clarao | nuvem | portal | brilhos

Saidas:
  assets/abilities/captcha-guard.png        4x5 de 128 (1 linha por poder)
  assets/abilities/captcha-guard-extra.png  4x4 de 128 (linha 3 = estouro de impacto)
Uso: python3 tools/build_captcha_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/pitoco-pet/Rafael-personagem/Captcha-guard-personagem'
BOXES = {
    '1bb58d5d-260a-450a-b121-aac4a3e04b76.jpg': {
        'burst': (75, 15, 348, 275), 'orb': (500, 66, 690, 235), 'bullet': (842, 40, 1113, 268),
        'shell': (64, 309, 338, 536), 'star': (449, 283, 758, 564), 'smoke': (872, 326, 1104, 540),
        'flash': (3, 543, 401, 889), 'ring': (414, 558, 774, 880),
    },
    '3dbafe46-f0ff-4d50-90c7-d0041511660d.jpg': {
        'spiral': (58, 125, 240, 299), 'eorb': (305, 65, 585, 340), 'streak': (635, 117, 850, 323),
        'burst2': (19, 527, 274, 777), 'ring2': (336, 548, 551, 762), 'sparkles': (930, 550, 1140, 740),
    },
    '4ca77a00-1483-45fc-aed3-af7eb1a8c95a.jpg': {
        'star3': (29, 118, 286, 378), 'bubble': (366, 188, 533, 343), 'expl': (45, 536, 256, 737),
        'dbl': (556, 550, 898, 738), 'ring3': (902, 505, 1164, 757),
    },
    '9ae7b08d-6145-4487-9b05-077ffbc16ef2.jpg': {
        'vortex': (161, 0, 421, 242), 'esphere': (710, 0, 1044, 254), 'beam': (16, 272, 555, 406),
        'flash4': (117, 415, 476, 662), 'portal': (700, 422, 1037, 664), 'sparkles4': (700, 668, 1037, 892),
    },
}


def load():
    sp = {}
    for fname, boxes in BOXES.items():
        im = Image.open(SRC / fname).convert('RGB')
        for name, box in boxes.items():
            sp[name] = key_out(im.crop(box))
    return sp


def build():
    sp = load()
    atlas = Image.new('RGBA', (S * 4, S * 5))
    extra = Image.new('RGBA', (S * 4, S * 4))

    def put(img, r, c, layers):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            src, sc = spec[0], spec[1]
            al = spec[2] if len(spec) > 2 else 1.0
            cy = spec[3] if len(spec) > 3 else S / 2
            place(cell, fit(src, S - 6, sc), cy=cy, alpha=al)
        img.alpha_composite(cell, (c * S, r * S))

    # o projetil da folha vem inclinado (45 graus): endireita pra voar reto
    bullet = sp['bullet'].rotate(-38, resample=Image.BICUBIC, expand=True)
    # 0 TIRO DE VERIFICACAO: bala azul com brilho, pulsando
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.94, 1.25), (1.0, 1.1), (0.96, 1.35)]):
        put(atlas, 0, c, [(sp['star'], 0.55, 0.55), (bright(bullet, br), sc)])
    # 1 SELECIONE OS ONIBUS: orbe eletrico (cada projetil e um orbe)
    for c, (sc, br) in enumerate([(0.8, 1.0), (0.86, 1.2), (0.8, 1.1), (0.86, 1.3)]):
        put(atlas, 1, c, [(bright(sp['eorb'], br), sc)])
    # 2 RATE LIMIT: vortice azul girando por cima da esfera eletrica
    for c, ang in enumerate([0, 30, 60, 90]):
        put(atlas, 2, c, [(sp['esphere'], 0.8, 0.7), (sp['vortex'].rotate(-ang, resample=Image.BICUBIC), 1.0, 0.9)])
    # 3 FIREWALL HUMANO: portal/anel de escudo pulsando
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.94, 1.2), (1.0, 1.1), (0.96, 1.3)]):
        put(atlas, 3, c, [(bright(sp['portal'], br), sc), (sp['ring'], sc * 0.9, 0.6)])
    # 4 ACESSO NEGADO (ult): feixe — tiles do raio (o motor repete a linha ao longo do raio)
    beam = sp['beam']
    bw, bh = beam.size
    seg = lambda x0: beam.crop((int(x0), 0, int(x0) + bh, bh))  # noqa: E731
    head = beam.crop((bw - int(bh * 1.6), 0, bw, bh))
    put(atlas, 4, 0, [(seg(bw * 0.15), 1.0)])
    put(atlas, 4, 1, [(head, 1.0), (sp['flash4'], 0.55, 0.8)])
    put(atlas, 4, 2, [(bright(seg(bw * 0.45), 1.2), 1.0)])
    put(atlas, 4, 3, [(bright(head, 1.25), 1.0)])

    # EXTRA: estouro de impacto (linha 3 e a que o motor usa; 0-2 repetem variacoes)
    impact = [[(sp['star3'], 0.5)], [(sp['burst'], 0.8), (sp['sparkles'], 0.9, 0.7)],
              [(sp['burst2'], 1.0), (sp['ring2'], 0.9, 0.6)], [(sp['sparkles4'], 1.0, 0.7), (sp['ring3'], 0.7, 0.4)]]
    for r in range(4):
        for c, layers in enumerate(impact):
            put(extra, r, c, layers)

    atlas.save(ROOT / 'assets/abilities/captcha-guard.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/captcha-guard-extra.png', optimize=True)
    return atlas, extra


if __name__ == '__main__':
    atlas, extra = build()
    print('ok', atlas.size, extra.size)
    if '--preview' in sys.argv:
        dst = sys.argv[sys.argv.index('--preview') + 1]
        full = Image.new('RGBA', (S * 4, S * 6), (28, 30, 44, 255))
        full.alpha_composite(atlas)
        full.alpha_composite(extra.crop((0, S * 3, S * 4, S * 4)), (0, S * 5))
        full.convert('RGB').save(dst)
