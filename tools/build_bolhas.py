#!/usr/bin/env python3
"""Clima BOLHAS DE SABAO: atlas assets/weather/bubbles.png (4x2 de 96px).

Fonte: bugs/Novos-climas/'Bolhas de sabao.jpg' (arte do dono, fundo magenta):
  linha 0: bolha pequena | media | arco-iris | cacho de 3
  linha 1: estouro 1 (rasgando) | 2 (meia lua) | 3 (anel) | 4 (gotinhas)
As bolhas sao TRANSLUCIDAS: a chave tira o magenta por 'unmix' (cor =
(pixel - fundo*(1-alpha))/alpha), entao o miolo fica azulado e transparente
em vez de roxo chapado.

Uso: python3 tools/build_bolhas.py [--preview arq.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import fit, place, trim  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'bugs/Novos-climas/Bolhas de sabao.jpg'
OUT = ROOT / 'assets/weather/bubbles.png'
C = 96

BOXES = [
    (60, 130, 230, 300), (310, 90, 550, 330), (595, 75, 875, 350), (915, 100, 1140, 330),
    (5, 490, 285, 780), (300, 480, 590, 780), (595, 500, 865, 820), (870, 450, 1184, 820),
]


def key_bubble(crop, glass=False):
    a = np.array(crop.convert('RGB')).astype(float)
    edge = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    # bolha: ate o miolo azul-lilas (perto do fundo) vira vidro semitransparente
    alpha = np.clip((d - 28) / 120.0, 0, 1)
    al3 = np.maximum(alpha[..., None], 1e-3)
    fg = np.clip((a - bg * (1 - al3)) / al3, 0, 255)
    # o que sobrou de magenta no vidro puxa pro azul-ciano
    r, g, b = fg[..., 0], fg[..., 1], fg[..., 2]
    spill = np.clip(np.minimum(r, b) - g, 0, None)
    fg[..., 0] = np.clip(r - spill * 0.55, 0, 255)
    alpha = np.where(d < 34, 0, alpha)
    if glass:
        # VIDRO: corpo azul fica ~35% opaco; brilho branco, borda clara e o
        # arco-iris (cor fora do azul) continuam fortes; buraco escuro some
        lum = 0.299 * fg[..., 0] + 0.587 * fg[..., 1] + 0.114 * fg[..., 2]
        mx = fg.max(axis=2); mn = fg.min(axis=2)
        sat = (mx - mn) / np.maximum(mx, 1)
        bluish = (fg[..., 2] > fg[..., 0] + 25) & (fg[..., 2] > fg[..., 1] + 5)
        keep = np.clip((lum - 165) / 60.0, 0, 1)
        k = np.where(bluish, 0.45 + 0.55 * keep, 0.55 + 0.45 * np.clip(sat * 1.5, 0, 1))
        alpha = alpha * k
        alpha = np.where(lum < 55, 0, alpha)
    out = np.dstack([fg, alpha * 255]).astype(np.uint8)
    return trim(Image.fromarray(out, 'RGBA'))


def build():
    im = Image.open(SRC).convert('RGB')
    atlas = Image.new('RGBA', (C * 4, C * 2))
    for k, box in enumerate(BOXES):
        sp = key_bubble(im.crop(box), glass=k in (0, 1, 2, 3, 4, 5))
        cell = Image.new('RGBA', (C, C))
        place(cell, fit(sp, C - 4), cx=C / 2, cy=C / 2)
        atlas.alpha_composite(cell, ((k % 4) * C, (k // 4) * C))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT, optimize=True)
    return atlas


if __name__ == '__main__':
    atlas = build()
    print('ok', OUT, atlas.size)
    if '--preview' in sys.argv:
        dst = sys.argv[sys.argv.index('--preview') + 1]
        bg = Image.new('RGBA', atlas.size, (60, 70, 50, 255))
        for y in range(0, atlas.height, 16):
            for x in range(0, atlas.width, 16):
                if (x // 16 + y // 16) % 2:
                    bg.paste((90, 110, 140, 255), (x, y, x + 16, y + 16))
        bg.alpha_composite(atlas)
        bg.convert('RGB').resize((atlas.width * 2, atlas.height * 2), Image.NEAREST).save(dst)
