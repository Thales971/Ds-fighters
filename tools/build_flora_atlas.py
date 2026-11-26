#!/usr/bin/env python3
"""Atlas de flora real a partir das artes-fonte da pasta arte-fonte/flora/.

Le arte-fonte/flora/flores.png (fundo rosa 255,198,215, grade 5x4) e arte-fonte/flora/grama.png
(fundo verde escuro 11,45,30, grade 6x4), recorta cada figura por chroma-key,
classifica por cor dominante e empacota variantes em:

  assets/fauna/flora.png  — 4 colunas x 5 linhas de 128px, base no rodape

Linhas do atlas (mapeadas em stage.js FLORA_SPR_ROW):
  0 grass         1 grass_tall     2 flower_red     3 flower_yellow     4 clover

Uso: python3 tools/build_flora_atlas.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/fauna/flora.png'
CELL = 128
COLS = 4
ROWS = 5  # grass, grass_tall, flower_red, flower_yellow, clover

SOURCES = [
    ('arte-fonte/flora/flores.png', (255, 198, 215), 5, 4),
    ('arte-fonte/flora/grama.png', (11, 45, 30), 6, 4),
]

# (linha do atlas, chave) -> lista de (arquivo, linha, coluna) na fonte, em ordem de preferencia
PICKS = {
    0: [('grama', 1, 5), ('grama', 2, 2), ('grama', 1, 1), ('grama', 3, 1)],      # grama (tufo verde)
    1: [('flores', 1, 3), ('flores', 1, 2), ('flores', 1, 4), ('flores', 1, 1)],    # grama alta (arbusto)
    2: [('grama', 3, 2), ('grama', 0, 3), ('grama', 1, 3), ('grama', 2, 0)],        # flor rosa/vermelha
    3: [('grama', 0, 1), ('grama', 2, 1), ('flores', 3, 3), ('flores', 3, 4)],      # flor amarela/laranja
    4: [('flores', 2, 2), ('flores', 2, 4), ('flores', 2, 0), ('flores', 2, 1)],    # trevo/folhagem
}


def load_cells():
    """Retorna {'flores': {(r,c): np RGBA}, 'grama': ...} com alpha por chroma-key."""
    sheets = {}
    for name, bg, cols, rows in SOURCES:
        key = name.split('/')[-1].split('.')[0]
        img = Image.open(ROOT / name).convert('RGB')
        a = np.asarray(img).astype(np.int16)
        W, H = img.size
        cw, ch = W / cols, H / rows
        dist = np.abs(a - np.array(bg, dtype=np.int16)).sum(axis=2)
        alpha = np.clip((dist - 45) / 45.0, 0, 1) * 255  # borda suave de 45
        cells = {}
        for r in range(rows):
            for c in range(cols):
                y0, y1 = int(r * ch) + 2, int((r + 1) * ch) - 2
                x0, x1 = int(c * cw) + 2, int((c + 1) * cw) - 2
                rgb = a[y0:y1, x0:x1].astype(np.uint8)
                al = alpha[y0:y1, x0:x1].astype(np.uint8)
                cells[(r, c)] = np.dstack([rgb, al])
        sheets[key] = cells
    return sheets


def fit_into(cell_rgba, size=CELL, pad=4):
    """Recorta o bbox opaco e escala para caber em (size-pad), ancorado na base."""
    al = cell_rgba[:, :, 3]
    ys, xs = np.where(al > 30)
    if len(xs) == 0:
        return Image.new('RGBA', (size, size), (0, 0, 0, 0))
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    fig = Image.fromarray(cell_rgba[y0:y1, x0:x1])
    maxside = size - pad
    sc = min(maxside / fig.width, maxside / fig.height)
    nw, nh = max(1, round(fig.width * sc)), max(1, round(fig.height * sc))
    fig = fig.resize((nw, nh), Image.Resampling.NEAREST)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.alpha_composite(fig, ((size - nw) // 2, size - nh))
    return out


def main():
    sheets = load_cells()
    atlas = Image.new('RGBA', (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    for row, picks in PICKS.items():
        for col, (key, r, c) in enumerate(picks):
            fig = fit_into(sheets[key][(r, c)])
            atlas.alpha_composite(fig, (col * CELL, row * CELL))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT)
    # relatorio: conteudo por celula + vazamento de cor de fundo
    a = np.asarray(atlas)
    al = a[:, :, 3] > 40
    for row in range(ROWS):
        counts = [int(al[row * CELL:(row + 1) * CELL, col * CELL:(col + 1) * CELL].sum()) for col in range(COLS)]
        print(f'row {row}: px por coluna {counts}')
    for bg in [(255, 198, 215), (11, 45, 30)]:
        leak = int(((np.abs(a[:, :, :3].astype(int) - np.array(bg)).sum(axis=2) < 30) & (a[:, :, 3] > 200)).sum())
        print(f'vazamento fundo {bg}: {leak} px')
    print(f'atlas {atlas.size} -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
