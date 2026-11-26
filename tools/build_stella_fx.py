#!/usr/bin/env python3
"""Atlas de habilidades da STELLA (Maga do Front-end) — arte do dono, nov/2026.
Fontes (arte-fonte/personagens/, grade 4x2, fundo magenta):
  'Maga Front habilidades 1.jpg': silhueta se desfazendo | portal quadrado | punho no chao |
      vazio quadrado / grade de luz | parede de grade | rastro de cubos | dragao
  'Maga Front habilidades 2.jpg': meia-lua | bomba de fumaca | moldura | palma /
      cruzes de cura | vortice | kunais | estrela
Saidas: assets/abilities/stella.png (4x5) e kuno-extra.png (4x2: linha 0 =
  fumaca no chao, linha 1 = impacto). Uso: python3 tools/build_kuno_fx.py
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'
G = [(c * 296 + 6, r * 448 + 6, c * 296 + 290, r * 448 + 442) for r in range(2) for c in range(4)]
N1 = ['zodiac', 'rings', 'galaxy', 'spirit', 'burst', 'moonwave', 'starrain', 'boom']
N2 = ['crescent', 'twinkle', 'hexa', 'trail', 'hearts', 'crescent2', 'confetti', 'star']


def build():
    sp = {}
    for fname, names in (('Maga Front habilidades 1.jpg', N1), ('Maga Front habilidades 2.jpg', N2)):
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

    # 0 LUA DO CSS: meia-lua girando
    for c, ang in enumerate([0, 15, 30, 45]):
        put(atlas, 0, c, [(bright(sp['crescent'].rotate(-ang, resample=Image.BICUBIC, expand=True), 1 + 0.08 * c), 0.85)])
    # 1 CHUVA DE ESTRELAS: cada estrela cai do ceu
    for c, br in enumerate([1.0, 1.2, 1.1, 1.3]):
        put(atlas, 1, c, [(bright(sp['starrain'], br), 1.0)])
    # 2 CORACOES DE CRISTAL (aura de cura)
    for c, sc in enumerate([0.8, 0.95, 1.0, 0.9]):
        put(atlas, 2, c, [(bright(sp['hearts'], 1 + 0.08 * c), sc)])
    # 3 ANEL HIPNOTICO (puxa o rival)
    put(atlas, 3, 0, [(sp['rings'], 1.0)])
    put(atlas, 3, 1, [(bright(sp['rings'], 1.2), 1.0)])
    put(atlas, 3, 2, [(sp['rings'], 0.9), (sp['hexa'], 0.5, 0.6)])
    put(atlas, 3, 3, [(bright(sp['rings'], 1.3), 1.0)])
    # 4 HOT RELOAD (ult): circulo zodiacal -> galaxia -> estrela -> explosao
    put(atlas, 4, 0, [(sp['zodiac'], 1.0)])
    put(atlas, 4, 1, [(sp['galaxy'], 1.0)])
    put(atlas, 4, 2, [(sp['star'], 1.0), (sp['galaxy'], 0.7, 0.5)])
    put(atlas, 4, 3, [(sp['boom'], 1.0)])
    # EXTRA 0: lua no mar (zona/aura no chao); EXTRA 1: impacto (brilho + confete)
    for c, br in enumerate([1.0, 1.15, 1.25, 1.1]):
        put(extra, 0, c, [(bright(sp['moonwave'], br), 1.0)])
    for c, layers in enumerate([[(sp['twinkle'], 0.5)], [(sp['twinkle'], 0.9), (sp['confetti'], 0.6, 0.6)], [(sp['confetti'], 1.0), (sp['twinkle'], 0.5, 0.6)], [(sp['confetti'], 1.0, 0.45)]]):
        put(extra, 1, c, layers)
    atlas.save(ROOT / 'assets/abilities/stella.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/stella-extra.png', optimize=True)
    if '--preview' in sys.argv:
        full = Image.new('RGBA', (S * 4, S * 7), (28, 30, 44, 255))
        full.alpha_composite(atlas); full.alpha_composite(extra, (0, S * 5))
        full.convert('RGB').save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    build()
    print('ok')
