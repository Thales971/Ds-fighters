#!/usr/bin/env python3
"""Atlas de habilidades da LARPER (veneno) — arte do dono, nov/2026.

Fontes (bugs/Novos-personagens/, fundo magenta):
  'Larper habilidades 1.jpg': coluna de acido | granada de gas | frasco quebrando |
      cratera toxica / anel de gas | nuvem caveira | jato de gas | nuvem no chao
  'Larper habilidades 2.jpg': bola toxica | respingo | seta dupla | poca borbulhando /
      vortice | 3 garras | nuvem | cacho de bolhas

Saidas:
  assets/abilities/larper.png        4x5 de 128 (1 linha por poder, 4 quadros)
  assets/abilities/larper-extra.png  4x2: linha 0 = nuvem de gas no chao (zona da
      granada e da ult), linha 1 = impacto (frasco quebra -> respingo -> bolhas)
Uso: python3 tools/build_larper_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'bugs/Novos-personagens'
B1 = {
    'pillar': (40, 55, 265, 405), 'grenade': (325, 65, 525, 385), 'flask': (575, 80, 845, 385), 'crater': (848, 115, 1184, 405),
    'ring': (0, 535, 305, 785), 'skull': (310, 510, 565, 795), 'spray': (582, 475, 852, 795), 'mound': (828, 585, 1184, 775),
}
B2 = {
    'orb': (8, 170, 280, 325), 'splash': (285, 75, 580, 385), 'arrows': (598, 90, 855, 385), 'puddle': (880, 105, 1155, 400),
    'vortex': (8, 475, 290, 775), 'claws': (298, 500, 575, 765), 'cloud': (562, 565, 893, 735), 'bubbles': (915, 495, 1135, 785),
}


def load():
    sp = {}
    for fname, boxes in (('Larper habilidades 1.jpg', B1), ('Larper habilidades 2.jpg', B2)):
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

    # 0 BOLA TOXICA: orbe verde com rastro, pulsando
    for c, (sc, br) in enumerate([(0.9, 1.0), (0.85, 1.2), (0.9, 1.08), (0.86, 1.3)]):
        put(atlas, 0, c, [(bright(sp['orb'], br), sc)])
    # 1 GRANADA DE GAS: a granada girando (estoura em nuvem — folha extra)
    for c, ang in enumerate([0, 35, 70, 105]):
        put(atlas, 1, c, [(sp['grenade'].rotate(-ang, resample=Image.BICUBIC, expand=True), 0.85)])
    # 2 GARRAS ACIDAS: 3 garras -> respingo
    cl, spl = sp['claws'], sp['splash']
    put(atlas, 2, 0, [(cl, 1.0)])
    put(atlas, 2, 1, [(bright(cl, 1.2), 1.0)])
    put(atlas, 2, 2, [(cl, 0.9, 0.7), (spl, 0.7)])
    put(atlas, 2, 3, [(spl, 1.0)])
    # 3 POCA CORROSIVA: poca borbulhando (a zona usa os quadros 1-3)
    pu = sp['puddle']
    for c, br in enumerate([1.0, 1.1, 1.25, 1.12]):
        put(atlas, 3, c, [(bright(pu, br), 1.0)])
    # 4 NUVEM DA MORTE (ult): anel de gas -> caveira -> coluna de acido -> nuvem
    put(atlas, 4, 0, [(sp['ring'], 1.0)])
    put(atlas, 4, 1, [(sp['skull'], 1.0)])
    put(atlas, 4, 2, [(sp['pillar'], 1.0), (sp['skull'], 0.75, 0.75)])
    put(atlas, 4, 3, [(sp['mound'], 1.0, 1.0, S / 2 + 20), (sp['skull'], 0.6, 0.5)])

    # EXTRA 0: nuvem de gas no chao (zona)
    mo, cd = sp['mound'], sp['cloud']
    put(extra, 0, 0, [(mo, 1.0)])
    put(extra, 0, 1, [(mo, 1.0)])
    put(extra, 0, 2, [(bright(cd, 1.15), 1.0)])
    put(extra, 0, 3, [(bright(mo, 1.2), 0.97)])
    # EXTRA 1: impacto — frasco quebra -> respingo -> bolhas -> some
    for c, layers in enumerate([[(sp['flask'], 0.8)], [(spl, 0.9), (sp['flask'], 0.6, 0.5)], [(sp['bubbles'], 1.0), (spl, 0.8, 0.6)], [(sp['bubbles'], 1.0, 0.5)]]):
        put(extra, 1, c, layers)

    atlas.save(ROOT / 'assets/abilities/larper.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/larper-extra.png', optimize=True)
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
