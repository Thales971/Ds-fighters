#!/usr/bin/env python3
"""Atlas de habilidades do JESTER (bobo da corte) — arte do dono, nov/2026.

Fontes (arte-fonte/personagens/, fundo magenta/roxo):
  'Jester habilidades 1.jpg': polaroide | barra azul | sino | torta /
      bola ✓ | bola ✗ | bastao listrado | confete
  'Jester habilidades 2.jpg' (grade 4x2): clone | ✗ explodindo | bexigas | torta /
      anel de ✓ | sino com notas | explosoes em fila | marreta gigante
  'Jester habilidades 3.jpg': ✓ | ✗ | moldura com flash | raio azul /
      torta girando | bastao | estrela de impacto | chafariz de confete

Saidas:
  assets/abilities/jester.png        4x5 de 128 (1 linha por poder, 4 quadros)
  assets/abilities/jester-extra.png  4x2: linha 0 = anel de ✓ (escudo/aura),
      linha 1 = impacto (confete + estrela)
Uso: python3 tools/build_jester_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'
B1 = {
    'polaroid': (15, 75, 295, 355), 'bar': (315, 185, 585, 305), 'bell': (615, 95, 875, 355), 'pie': (885, 85, 1184, 325),
    'check': (20, 515, 275, 775), 'x': (320, 515, 575, 775), 'pole': (625, 495, 835, 775), 'confetti': (890, 520, 1175, 765),
}
G2 = [(c * 296 + 8, r * 448 + 8, c * 296 + 288, r * 448 + 440) for r in range(2) for c in range(4)]
N2 = ['clone', 'xboom', 'balloons', 'pie2', 'ring', 'bell2', 'chain', 'hammer']
B3 = {
    'check2': (20, 75, 285, 335), 'x2': (315, 75, 585, 335), 'frame': (585, 55, 865, 365), 'beam': (855, 125, 1184, 285),
    'pie3': (0, 475, 305, 765), 'pole2': (315, 475, 565, 795), 'star': (580, 465, 875, 795), 'confetti2': (895, 445, 1184, 795),
}


def load():
    sp = {}
    im = Image.open(SRC / 'Jester habilidades 1.jpg').convert('RGB')
    for k, b in B1.items():
        sp[k] = key_out(im.crop(b))
    im = Image.open(SRC / 'Jester habilidades 2.jpg').convert('RGB')
    for k, b in zip(N2, G2):
        sp[k] = key_out(im.crop(b))
    im = Image.open(SRC / 'Jester habilidades 3.jpg').convert('RGB')
    for k, b in B3.items():
        sp[k] = key_out(im.crop(b))
    return sp


def build():
    sp = load()
    atlas = Image.new('RGBA', (S * 4, S * 5))
    extra = Image.new('RGBA', (S * 4, S * 2))

    def put(img, r, c, layers):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            src, sc = spec[0], spec[1]
            al = spec[2] if len(spec) > 2 else 1.0
            place(cell, fit(src, S - 6, sc), alpha=al)
        img.alpha_composite(cell, (c * S, r * S))

    # 0 TORTA NA CARA: torta girando no ar
    for c, ang in enumerate([0, -12, -24, -12]):
        put(atlas, 0, c, [(sp['pie3'].rotate(ang, resample=Image.BICUBIC, expand=True), 0.92)])
    # 1 SINO DO BOBO: sino com as ondas de som pulsando
    put(atlas, 1, 0, [(sp['bell'], 1.0)])
    put(atlas, 1, 1, [(sp['bell2'], 1.0)])
    put(atlas, 1, 2, [(bright(sp['bell'], 1.2), 0.94)])
    put(atlas, 1, 3, [(bright(sp['bell2'], 1.25), 1.0)])
    # 2 PIRULITO HIPNOTICO: bastao listrado girando (bumerangue)
    put(atlas, 2, 0, [(sp['pole'], 1.0)])
    put(atlas, 2, 1, [(sp['pole2'], 1.0)])
    put(atlas, 2, 2, [(sp['pole'].rotate(-45, resample=Image.BICUBIC, expand=True), 1.0)])
    put(atlas, 2, 3, [(sp['pole2'].rotate(45, resample=Image.BICUBIC, expand=True), 1.0)])
    # 3 CODE REVIEW: bola ✗ vermelha pulsando (cada uma trava os poderes)
    for c, (src, sc, br) in enumerate([('x2', 0.8, 1.0), ('x', 0.75, 1.15), ('x2', 0.82, 1.25), ('x', 0.76, 1.1)]):
        put(atlas, 3, c, [(bright(sp[src], br), sc)])
    # 4 GRANDE FINAL (ult): estrela -> ✗ explodindo -> explosoes -> confete
    put(atlas, 4, 0, [(sp['star'], 1.0)])
    put(atlas, 4, 1, [(sp['xboom'], 1.0)])
    put(atlas, 4, 2, [(sp['chain'], 1.0), (sp['xboom'], 0.6, 0.6)])
    put(atlas, 4, 3, [(sp['confetti2'], 1.0)])

    # EXTRA 0: anel de ✓ girando
    for c, ang in enumerate([0, 22, 45, 67]):
        put(extra, 0, c, [(sp['ring'].rotate(-ang, resample=Image.BICUBIC, expand=True), 1.0)])
    # EXTRA 1: impacto — estrela + confete
    for c, layers in enumerate([[(sp['star'], 0.5)], [(sp['star'], 0.8), (sp['confetti'], 0.7, 0.7)], [(sp['confetti'], 1.0), (sp['star'], 0.5, 0.6)], [(sp['confetti'], 1.0, 0.5)]]):
        put(extra, 1, c, layers)

    atlas.save(ROOT / 'assets/abilities/jester.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/jester-extra.png', optimize=True)
    return atlas, extra


if __name__ == '__main__':
    atlas, extra = build()
    print('ok', atlas.size, extra.size)
    if '--preview' in sys.argv:
        dst = sys.argv[sys.argv.index('--preview') + 1]
        full = Image.new('RGBA', (S * 4, S * 7), (28, 30, 44, 255))
        full.alpha_composite(atlas)
        full.alpha_composite(extra, (0, S * 5))
        full.convert('RGB').resize((S * 8, S * 14), Image.NEAREST).save(dst)
