#!/usr/bin/env python3
"""Atlas de habilidades do DOMADOR DE PGADMIN — arte do dono, nov/2026.

Fontes (arte-fonte/personagens/, fundo magenta, grade 4x2):
  'Domador habilidades 1.jpg': pisao do elefante | vortice | arvore (B-tree) | feixe /
      elefante correndo | cacos | chuva de dados | elefante invocado
  'Domador habilidades 2.jpg': chicotada | anel no chao | asas | cilindro (banco) /
      megafone | cubo | estouro | anel

Saidas:
  assets/abilities/domador.png        4x5 de 128 (1 linha por poder)
  assets/abilities/domador-extra.png  4x2: linha 0 = onda de choque no chao
      (zona da ult), linha 1 = impacto (estouro + cacos)
Uso: python3 tools/build_domador_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'
G = [(c * 296 + 6, r * 448 + 6, c * 296 + 290, r * 448 + 442) for r in range(2) for c in range(4)]
N1 = ['stomp', 'vortex', 'tree', 'beam', 'charge', 'shards', 'rain', 'summon']
TIGHT = {'shards': (335, 454, 586, 890), 'tree': (598, 6, 860, 442)}
N2 = ['whip', 'ground', 'wings', 'cylinder', 'horn', 'cube', 'burst', 'ring']


def load():
    sp = {}
    for fname, names in (('Domador habilidades 1.jpg', N1), ('Domador habilidades 2.jpg', N2)):
        im = Image.open(SRC / fname).convert('RGB')
        for k, b in zip(names, G):
            b = TIGHT.get(k, b)  # tira resto do vizinho que encosta na borda
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

    # 0 CHICOTADA: chicote estalando -> estouro
    put(atlas, 0, 0, [(sp['whip'], 1.0)])
    put(atlas, 0, 1, [(bright(sp['whip'], 1.2), 1.0)])
    put(atlas, 0, 2, [(sp['whip'], 0.9, 0.7), (sp['burst'], 0.6)])
    put(atlas, 0, 3, [(sp['burst'], 0.85)])
    # 1 QUERY ARREMESSADA: cilindro do banco voando, pulsando
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.95, 1.2), (1.0, 1.08), (0.96, 1.3)]):
        put(atlas, 1, c, [(bright(sp['cylinder'], br), sc)])
    # 2 ESTOURO DO ELEFANTE: elefante correndo com rastro de luz
    put(atlas, 2, 0, [(sp['charge'], 1.0)])
    put(atlas, 2, 1, [(sp['beam'], 1.0, 0.7), (sp['charge'], 0.9)])
    put(atlas, 2, 2, [(bright(sp['charge'], 1.2), 1.0)])
    put(atlas, 2, 3, [(sp['beam'], 1.0, 0.8), (bright(sp['charge'], 1.1), 0.92)])
    # 3 INDICE B-TREE: a arvore cresce do chao embaixo do rival
    for c, sc in enumerate([0.55, 0.8, 1.0, 1.0]):
        put(atlas, 3, c, [(bright(sp['tree'], 1.0 + 0.1 * c), sc)])
    # 4 PISAO DO ELEFANTE (ult): elefante invocado -> pata -> cacos -> onda
    put(atlas, 4, 0, [(sp['summon'], 1.0)])
    put(atlas, 4, 1, [(sp['stomp'], 1.0)])
    put(atlas, 4, 2, [(sp['stomp'], 0.9, 0.7), (sp['shards'], 0.9)])
    put(atlas, 4, 3, [(sp['ground'], 1.0), (sp['shards'], 0.7, 0.5)])

    # EXTRA 0: onda de choque no chao (zona)
    put(extra, 0, 0, [(sp['ground'], 0.8)])
    put(extra, 0, 1, [(sp['ground'], 1.0)])
    put(extra, 0, 2, [(bright(sp['ground'], 1.2), 1.0)])
    put(extra, 0, 3, [(sp['ring'], 0.9), (sp['ground'], 0.9, 0.7)])
    # EXTRA 1: impacto — estouro + cacos
    for c, layers in enumerate([[(sp['burst'], 0.5)], [(sp['burst'], 0.85), (sp['shards'], 0.6, 0.6)], [(sp['shards'], 1.0), (sp['burst'], 0.6, 0.6)], [(sp['shards'], 1.0, 0.45)]]):
        put(extra, 1, c, layers)

    atlas.save(ROOT / 'assets/abilities/domador.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/domador-extra.png', optimize=True)
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
