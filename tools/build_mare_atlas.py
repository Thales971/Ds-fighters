#!/usr/bin/env python3
"""Atlas das ondas da MARÉ ALTA a partir dos sprites do dono.

Le os JPGs em Pitoco-pet/mare-alta-nova-sprites-recortar/ (fundo magenta
chroma-key), recorta as 4 faixas de onda horizontais (largura cheia 1184px)
e empacota em:

  assets/fx/mare.png — 1184 x 640, 4 linhas de 160px, onda ancorada na base

Linhas: 0/1 = "Mare alta nova sprite.jpg", 2/3 = "mare alta nova 2 sprite.jpg".

Uso: python3 tools/build_mare_atlas.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/fx/mare.png'
W = 1184
ROW_H = 160

SOURCES = [
    ('Pitoco-pet/mare-alta-nova-sprites-recortar/Mare alta nova sprite.jpg', [(220, 295), (678, 749)]),
    ('Pitoco-pet/mare-alta-nova-sprites-recortar/mare alta nova 2 sprite.jpg', [(234, 373), (664, 786)]),
]


def key_magenta(rgb):
    """alpha a partir de uma mascara de magenta (matiz), com 1px de borda suave.
    Azul da onda (r~1, b~108) e espuma branca nao sao magenta; blends de borda
    pinkish tambem caem na mascara (r alto, g baixo, b alto) e viram transparentes."""
    from scipy import ndimage
    a = rgb.astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mag = (r > 140) & (b > 100) & (g < 0.75 * r) & (r - b > -60)
    d = ndimage.distance_transform_edt(~mag)  # distancia ate o magenta
    return (d > 1.5).astype(np.uint8) * 255


def main():
    strips = []
    for name, bands in SOURCES:
        img = Image.open(ROOT / name).convert('RGB')
        arr = np.asarray(img)
        alpha = key_magenta(arr)
        rgba = np.dstack([arr.astype(np.uint8), alpha])
        for (y0, y1) in bands:
            strip = rgba[y0 - 4:y1 + 4, :, :]  # respiro pra includir a crista
            strips.append(strip)
    atlas = Image.new('RGBA', (W, ROW_H * len(strips)), (0, 0, 0, 0))
    for i, strip in enumerate(strips):
        h = min(ROW_H, strip.shape[0])
        img = Image.fromarray(strip[:h])
        atlas.alpha_composite(img, (0, i * ROW_H + (ROW_H - h)))  # base da onda embaixo
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT)
    a = np.asarray(atlas)
    al = a[:, :, 3] > 40
    for i in range(len(strips)):
        row = al[i * ROW_H:(i + 1) * ROW_H]
        print(f'linha {i}: {int(row.sum())} px opacos, altura usada ate y={int(np.where(row.any(axis=1))[0].max()) if row.any() else 0}')
    # vazamento de magenta?
    leak = int((((np.abs(a[:, :, :3].astype(int) - np.array([243, 24, 144])).sum(axis=2) < 40) & (a[:, :, 3] > 200))).sum())
    print(f'vazamento magenta opaco: {leak} px')
    print(f'atlas {atlas.size} -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
