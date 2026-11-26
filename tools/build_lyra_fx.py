#!/usr/bin/env python3
"""Atlas de habilidades da LYRA, a Maga do JavaScript (arte do dono, nov/2026).

Fontes (arte-fonte/personagens/, fundo magenta):
  'Maga JS habilidades 1.jpg': raio de fogo | setas roxas | 3 raios em V | tabua
      de pedra / tornado | X roxo | circulo no chao | circulo de runas
  'Maga JS habilidades 2.jpg': cometa => | circulo {} | raio azul | hexagono {} /
      orbe escuro | estouro | vortice com ampulhetas | coluna de luz

Saidas:
  assets/abilities/lyra.png        4x5 de 128 (1 linha por poder, 4 quadros)
  assets/abilities/lyra-extra.png  4x2 de 128: linha 0 = circulo de runas da
      ult (zona no chao), linha 1 = estouro de impacto dos poderes
Uso: python3 tools/build_lyra_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, biggest_blob, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'

B1 = {
    'beam': (0, 120, 325, 285), 'arrows': (330, 60, 585, 300), 'vbeams': (590, 15, 890, 385), 'tablet': (890, 35, 1184, 385),
    'tornado': (0, 445, 295, 785), 'xslash': (300, 455, 592, 805), 'ground': (580, 555, 892, 785), 'runes': (893, 445, 1184, 805),
}
B2 = {
    'comet': (0, 85, 300, 295), 'circle': (305, 55, 592, 345), 'bolt': (592, 0, 885, 365), 'hexa': (888, 55, 1172, 365),
    'orb': (0, 555, 285, 785), 'burst': (292, 465, 592, 795), 'vortex': (595, 465, 885, 825), 'pillar': (925, 435, 1155, 855),
}


def load():
    sp = {}
    for fname, boxes in (('Maga JS habilidades 1.jpg', B1), ('Maga JS habilidades 2.jpg', B2)):
        im = Image.open(SRC / fname).convert('RGB')
        for name, box in boxes.items():
            sp[name] = key_out(im.crop(box))
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
            cy = spec[3] if len(spec) > 3 else S / 2
            place(cell, fit(src, S - 6, sc), cy=cy, alpha=al)
        img.alpha_composite(cell, (c * S, r * S))

    # 0 ARROW FUNCTION: cometa "=>" com rastro de codigo, pulsando
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.94, 1.2), (1.0, 1.08), (0.96, 1.3)]):
        put(atlas, 0, c, [(bright(sp['comet'], br), sc)])
    # 1 PROMISE.ALL: cada projetil e uma seta roxa (icone = as 3 juntas)
    arrow = biggest_blob(sp['arrows'])
    put(atlas, 1, 0, [(sp['arrows'], 1.0)])
    for c, br in enumerate([1.0, 1.25, 1.1], start=1):
        put(atlas, 1, c, [(bright(arrow, br), 0.7)])
    # 2 EVENT LOOP: vortice com ampulhetas girando
    vx = sp['vortex']
    for c, ang in enumerate([0, 30, 60, 90]):
        put(atlas, 2, c, [(vx.rotate(-ang, resample=Image.BICUBIC, expand=False), 1.0)])
    # 3 TRY { } CATCH: escudo hexagonal {} pulsando
    hx = sp['hexa']
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.95, 1.2), (1.0, 1.1), (0.97, 1.3)]):
        put(atlas, 3, c, [(bright(hx, br), sc)])
    # 4 STACK OVERFLOW (ult): raio caindo -> coluna de luz -> estouro
    bolt, pil, burst = sp['bolt'], sp['pillar'], sp['burst']
    put(atlas, 4, 0, [(sp['circle'], 1.0), (bolt, 0.9, 0.9)])
    put(atlas, 4, 1, [(bolt, 1.0)])
    put(atlas, 4, 2, [(pil, 1.0), (bolt, 0.9, 0.7)])
    put(atlas, 4, 3, [(burst, 1.0), (pil, 0.9, 0.6)])

    # EXTRA linha 0: circulo de runas da ult no chao (a zona usa quadros 1-3)
    rn, ci, gr = sp['runes'], sp['circle'], sp['ground']
    put(extra, 0, 0, [(gr, 1.0)])
    for c, ang in enumerate([0, 20, 40], start=1):
        put(extra, 0, c, [(rn.rotate(-ang, resample=Image.BICUBIC), 1.0), (ci.rotate(ang, resample=Image.BICUBIC), 0.62, 0.8)])
    # EXTRA linha 1: estouro de impacto (X roxo + estrela)
    for c, layers in enumerate([[(burst, 0.5)], [(sp['xslash'], 0.8), (burst, 0.6, 0.8)], [(burst, 1.0), (sp['xslash'], 0.9, 0.5)], [(burst, 1.0, 0.45)]]):
        put(extra, 1, c, layers)

    atlas.save(ROOT / 'assets/abilities/lyra.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/lyra-extra.png', optimize=True)
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
