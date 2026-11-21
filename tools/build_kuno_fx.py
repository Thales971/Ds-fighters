#!/usr/bin/env python3
"""Atlas de habilidades da KUNO (kunoichi) — arte do dono, nov/2026.
Fontes (bugs/Novos-personagens/, grade 4x2, fundo magenta):
  'Kuno habilidades 1.jpg': silhueta se desfazendo | portal quadrado | punho no chao |
      vazio quadrado / grade de luz | parede de grade | rastro de cubos | dragao
  'Kuno habilidades 2.jpg': meia-lua | bomba de fumaca | moldura | palma /
      cruzes de cura | vortice | kunais | estrela
Saidas: assets/abilities/kuno.png (4x5) e kuno-extra.png (4x2: linha 0 =
  fumaca no chao, linha 1 = impacto). Uso: python3 tools/build_kuno_fx.py
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'bugs/Novos-personagens'
G = [(c * 296 + 6, r * 448 + 6, c * 296 + 290, r * 448 + 442) for r in range(2) for c in range(4)]
N1 = ['fade', 'portal', 'fist', 'void', 'grid', 'wall', 'cubes', 'dragon']
N2 = ['crescent', 'smoke', 'frame', 'palm', 'heal', 'vortex', 'kunai', 'star']


def build():
    sp = {}
    for fname, names in (('Kuno habilidades 1.jpg', N1), ('Kuno habilidades 2.jpg', N2)):
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

    # 0 CHUVA DE KUNAI
    for c, br in enumerate([1.0, 1.15, 1.05, 1.25]):
        put(atlas, 0, c, [(bright(sp['kunai'], br), 0.9)])
    # 1 LAMINA LUNAR (meia-lua girando)
    for c, ang in enumerate([0, 20, 40, 60]):
        put(atlas, 1, c, [(sp['crescent'].rotate(-ang, resample=Image.BICUBIC, expand=True), 0.9)])
    # 2 PASSO DAS SOMBRAS: silhueta some -> vazio -> portal
    put(atlas, 2, 0, [(sp['fade'], 1.0)])
    put(atlas, 2, 1, [(sp['void'], 1.0)])
    put(atlas, 2, 2, [(sp['portal'], 1.0)])
    put(atlas, 2, 3, [(sp['fade'], 0.9, 0.5), (sp['portal'], 0.7)])
    # 3 BOMBA DE FUMACA
    for c, sc in enumerate([0.6, 0.85, 1.0, 1.0]):
        put(atlas, 3, c, [(sp['smoke'], sc, 1.0 if c < 3 else 0.6)])
    # 4 DRAGAO DAS MIL LAMINAS (ult): dragao -> cubos -> punho no chao -> estrela
    put(atlas, 4, 0, [(sp['dragon'], 1.0)])
    put(atlas, 4, 1, [(sp['dragon'], 1.0), (sp['cubes'], 0.6, 0.6)])
    put(atlas, 4, 2, [(sp['fist'], 1.0)])
    put(atlas, 4, 3, [(sp['star'], 1.0), (sp['fist'], 0.6, 0.5)])
    # EXTRA 0: fumaca roxa no chao; EXTRA 1: impacto
    for c, ang in enumerate([0, 30, 60, 90]):
        put(extra, 0, c, [(sp['vortex'].rotate(ang, resample=Image.BICUBIC), 0.9), (sp['smoke'], 0.8, 0.6)])
    for c, layers in enumerate([[(sp['star'], 0.5)], [(sp['star'], 0.9), (sp['palm'], 0.6, 0.6)], [(sp['frame'], 1.0), (sp['star'], 0.5, 0.6)], [(sp['frame'], 1.0, 0.45)]]):
        put(extra, 1, c, layers)
    atlas.save(ROOT / 'assets/abilities/kuno.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/kuno-extra.png', optimize=True)
    if '--preview' in sys.argv:
        full = Image.new('RGBA', (S * 4, S * 7), (28, 30, 44, 255))
        full.alpha_composite(atlas); full.alpha_composite(extra, (0, S * 5))
        full.convert('RGB').save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    build()
    print('ok')
