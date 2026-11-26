#!/usr/bin/env python3
"""Atlas de habilidades da MIKO (sacerdotisa) — arte do dono, nov/2026.
Fontes (arte-fonte/personagens/, grade 4x2, fundo magenta):
  'Miko habilidades 1.jpg': pergaminho | torii em chamas | flecha | anel roxo /
      orbe azul | tornado de papel | sino | anel de pergaminhos
  'Miko habilidades 2.jpg': portal torii | muralha de ofudas | corte | vortice /
      chuva de ofudas | cupula | dragao de papel | kitsune
Saidas: assets/abilities/miko.png (4x5) e miko-extra.png (4x2: linha 0 =
  circulo/portal no chao, linha 1 = impacto).
Uso: python3 tools/build_miko_fx.py
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'
G = [(c * 296 + 6, r * 448 + 6, c * 296 + 290, r * 448 + 442) for r in range(2) for c in range(4)]
N1 = ['scroll', 'torii', 'arrow', 'ring', 'orb', 'tornado', 'bell', 'scrolls']
N2 = ['portal', 'wall', 'slash', 'vortex', 'rain', 'dome', 'dragon', 'kitsune']


def build():
    sp = {}
    for fname, names in (('Miko habilidades 1.jpg', N1), ('Miko habilidades 2.jpg', N2)):
        im = Image.open(SRC / fname).convert('RGB')
        for k, b in zip(names, G):
            sp[k] = key_out(im.crop(b))
    atlas = Image.new('RGBA', (S * 4, S * 5))
    extra = Image.new('RGBA', (S * 4, S * 2))

    def put(img, r, c, layers):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            place(cell, fit(spec[0], S - 6, spec[1]), alpha=spec[2] if len(spec) > 2 else 1.0)
        img.alpha_composite(cell, (c * S, r * S))

    # 0 OFUDA SELANTE: pergaminho girando de leve
    for c, ang in enumerate([0, 12, 0, -12]):
        put(atlas, 0, c, [(bright(sp['scroll'].rotate(ang, resample=Image.BICUBIC, expand=True), 1 + 0.1 * c), 0.8)])
    # 1 FLECHA SAGRADA (hamaya)
    for c, br in enumerate([1.0, 1.2, 1.1, 1.3]):
        put(atlas, 1, c, [(bright(sp['arrow'], br), 1.0)])
    # 2 KEKKAI (muralha): muralha de ofudas -> cupula
    put(atlas, 2, 0, [(sp['dome'], 1.0)])
    put(atlas, 2, 1, [(sp['wall'], 1.0)])
    put(atlas, 2, 2, [(bright(sp['wall'], 1.15), 1.0)])
    put(atlas, 2, 3, [(sp['wall'], 1.0), (sp['dome'], 0.7, 0.5)])
    # 3 PORTAL TORII (teleporte)
    put(atlas, 3, 0, [(sp['portal'], 1.0)])
    put(atlas, 3, 1, [(sp['torii'], 1.0)])
    put(atlas, 3, 2, [(sp['vortex'], 1.0)])
    put(atlas, 3, 3, [(bright(sp['portal'], 1.2), 1.0)])
    # 4 KITSUNE DE NOVE CAUDAS (ult): dragao de papel -> kitsune -> tornado
    put(atlas, 4, 0, [(sp['kitsune'], 1.0)])
    put(atlas, 4, 1, [(sp['dragon'], 1.0)])
    put(atlas, 4, 2, [(bright(sp['kitsune'], 1.2), 1.0)])
    put(atlas, 4, 3, [(sp['tornado'], 1.0), (sp['kitsune'], 0.6, 0.5)])
    # EXTRA 0: anel selante no chao (zona); EXTRA 1: impacto (chuva de ofudas + corte)
    for c, ang in enumerate([0, 25, 50, 75]):
        put(extra, 0, c, [(sp['ring'].rotate(ang, resample=Image.BICUBIC), 1.0)])
    for c, layers in enumerate([[(sp['slash'], 0.6)], [(sp['slash'], 0.9), (sp['rain'], 0.6, 0.6)], [(sp['rain'], 1.0)], [(sp['rain'], 1.0, 0.45)]]):
        put(extra, 1, c, layers)
    atlas.save(ROOT / 'assets/abilities/miko.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/miko-extra.png', optimize=True)
    if '--preview' in sys.argv:
        full = Image.new('RGBA', (S * 4, S * 7), (28, 30, 44, 255))
        full.alpha_composite(atlas); full.alpha_composite(extra, (0, S * 5))
        full.convert('RGB').resize((S * 4, S * 7)).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    build()
    print('ok')
