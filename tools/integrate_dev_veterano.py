#!/usr/bin/env python3
"""Integra o Dev Veterano: recorta a arte enviada pelo dono
(bugs/Novos-personagens/) e gera os assets no contrato do motor:

  - assets/sprites/dev-veterano.png     1280x3900 (4x15, célula 320x260, pé y246)
  - assets/abilities/dev-veterano.png   512x640  (4x5, célula 128)
  - assets/ui/face-dev-veterano.png     168x168
  - assets/ui/portrait-dev-veterano.png 320x360

Fonte:
  - 'Dev veterano.jpg': 5 colunas x 8 linhas de poses em fundo magenta.
  - 'habilidades-dev-veterano.png': 8 colunas x 6 linhas de ícones em fundo cinza.

Mapeamento de poses (linha da folha fonte -> pose do motor):
  r0 idle | r1 walk | r2 punch | r3 crouch | r4 kick | r5 ko (deitado)
  r6 jump | r7 special/win
  cpunch=r3c4, ckick=r4c4, jpunch=r2c4 (no ar), jkick=r6c4 (no ar),
  hit=r1c4, block=r0c4, win=r7c4.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC_SPR = ROOT / 'bugs/Novos-personagens/dev veterano reformulado.jpg'
SRC_AB = ROOT / 'bugs/Novos-personagens/habilidades-dev-veterano.png'
CW, CH, BASE = 320, 260, 246
AIR_BASE = 220

ROWS = [0, 105, 200, 303, 402, 490, 556, 693, 896]
COLS = [(5, 196), (306, 467), (581, 718), (794, 955), (1010, 1170)]
MAGENTA = np.array([240, 3, 212])

# pose -> (lista de índices de célula [col,row], altura alvo da arte, pé)
POSES = [
    ('idle',    [(0, 0), (1, 0), (2, 0), (3, 0)], 195, BASE),
    ('walk',    [(0, 1), (1, 1), (2, 1), (4, 1)], 185, BASE),
    ('jump',    [(0, 6), (1, 6), (4, 6), (1, 6)], 165, AIR_BASE),
    ('crouch',  [(0, 3), (1, 3), (2, 3), (0, 3)], 125, BASE),
    ('punch',   [(0, 2), (1, 2), (2, 2), (4, 2)], 175, BASE),
    ('kick',    [(0, 4), (1, 4), (2, 4), (4, 4)], 165, BASE),
    ('cpunch',  [(4, 3), (4, 3), (4, 3), (4, 3)], 130, BASE),
    ('ckick',   [(3, 4), (3, 4), (3, 4), (3, 4)], 150, BASE),
    ('jpunch',  [(4, 2), (4, 2), (4, 2), (4, 2)], 170, AIR_BASE),
    ('jkick',   [(4, 4), (4, 4), (4, 4), (4, 4)], 160, AIR_BASE),
    ('special', [(0, 7), (1, 7), (2, 7), (3, 7)], 195, BASE),
    ('hit',     [(4, 1), (4, 1), (4, 1), (4, 1)], 185, BASE),
    ('block',   [(4, 0), (4, 0), (4, 0), (4, 0)], 190, BASE),
    ('ko',      [(2, 6), (2, 6), (2, 6), (2, 6)], 76, BASE),
    ('win',     [(4, 7), (4, 7), (4, 7), (4, 7)], 195, BASE),
]

# deslocamento sintetico por frame para as poses com uma unica celula:
# evita "sprite congelado" (4 frames identicos) sem inventar pose nova.
SHAKE = {
    'cpunch': [0, 3, 0, -3],
    'ckick': [0, -4, 0, 4],
    'jpunch': [0, 3, -3, 0],
    'jkick': [0, -3, 3, 0],
    'hit': [0, 5, -5, 2],
    'block': [0, -2, 0, 2],
    'win': [0, 2, 0, -2],
    'ko': [0, 4, -4, 0],
}


def cut_cells():
    im = Image.open(SRC_SPR).convert('RGB')
    a = np.array(im).astype(int)
    d = np.abs(a - MAGENTA).sum(axis=2)
    fg = ndimage.binary_closing(d > 110, structure=np.ones((3, 3)))
    cells = {}
    for ci, (cx0, cx1) in enumerate(COLS):
        for ri in range(8):
            y0, y1 = ROWS[ri], ROWS[ri + 1]
            sub = fg[y0:y1, cx0:cx1]
            lab, n = ndimage.label(sub)
            if not n:
                continue
            sizes = [int(s) for s in ndimage.sum(sub, lab, range(1, n + 1))]
            keep = np.zeros_like(sub)
            for i in range(n):
                if sizes[i] > 350:
                    keep |= lab == i + 1
            if not keep.any():
                continue
            yy, xx = np.where(keep)
            box = (cx0 + int(xx.min()), y0 + int(yy.min()),
                   cx0 + int(xx.max()) + 1, y0 + int(yy.max()) + 1)
            cells[(ci, ri)] = (im.crop(box), keep[(box[1] - y0):(box[3] - y0), (box[0] - cx0):(box[2] - cx0)])
    return cells


def figure_rgba(crop, mask):
    """Croma-key comdescontaminação de cor (unmixing do magenta) e denoise."""
    a = np.array(crop).astype(float)
    d = np.abs(a - MAGENTA).sum(axis=2)
    # corte duro: o sangramento magenta do JPEG nao vira fringe.
    # 130 = com certeza fundo; 190 = com certeza figura; sem feather longo.
    alpha = np.clip((d - 130.0) / 60.0, 0.0, 1.0)
    alpha[~mask] = 0.0
    # pixels opacos que ainda parecem magenta (bleed do JPEG): desatura pro
    # cinza medio da vizinhanca em vez de deixar halo rosa.
    mag = (d < 260) & (alpha > 0.99)
    if mag.any():
        g = a[..., 1]
        a2 = a.copy()
        a2[mag, 0] = g[mag]
        a2[mag, 2] = g[mag]
        a = a2
    # unmixing: c = fg*a + bg*(1-a)  =>  fg = (c - bg*(1-a))/a
    a3 = alpha[..., None]
    a3 = np.maximum(a3, 1e-3)
    fg = (a - MAGENTA[None, None, :] * (1.0 - a3)) / a3
    fg = np.clip(fg, 0, 255)
    # denoise: remove pontinhos isolados do JPEG
    al = ndimage.binary_opening(alpha > 0.55, structure=np.ones((2, 2)))
    lab, n = ndimage.label(alpha > 0.55)
    if n:
        sizes = np.array(ndimage.sum(alpha > 0.55, lab, range(1, n + 1)))
        for i in range(n):
            if sizes[i] < 40:
                al &= ~(lab == i + 1)
    alpha = np.where(al, alpha, 0.0)
    out = np.dstack([fg.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA')


def build_sheet(cells):
    sheet = Image.new('RGBA', (1280, 3900), (0, 0, 0, 0))
    for pose_i, (pose, keys, target_h, foot_y) in enumerate(POSES):
        shake = SHAKE.get(pose, [0, 0, 0, 0])
        for frame, (ci, ri) in enumerate(keys):
            crop, mask = cells[(ci, ri)]
            fig = figure_rgba(crop, mask)
            place_paste(sheet, fig, target_h, foot_y, frame, pose_i, shake[frame])
    return sheet


def place_paste(sheet, fig, target_h, foot_y, col, pose_i, dx=0):
    w, h = fig.size
    if h <= 0:
        return
    s = target_h / h
    nw, nh = max(1, int(round(w * s))), max(1, int(round(h * s)))
    if nw > CW - 24:
        s = (CW - 24) / w
        nw, nh = max(1, int(round(w * s))), max(1, int(round(h * s)))
    fig2 = fig.resize((nw, nh), Image.LANCZOS)
    fig2 = fig2.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    arr = np.array(fig2)
    ys = np.where((arr[..., 3] > 8).any(axis=1))[0]
    if not len(ys):
        return
    bottom = int(ys.max())
    x0 = (CW - nw) // 2 + dx
    y0 = foot_y - bottom
    cell = np.zeros((CH, CW, 4), dtype=np.uint8)
    y0c = max(0, y0)
    src_y = y0c - y0
    h2 = min(nh - src_y, CH - y0c)
    if h2 > 0:
        cell[y0c:y0c + h2, x0:x0 + nw] = arr[src_y:src_y + h2]
    sheet.paste(Image.fromarray(cell, 'RGBA'), (col * CW, pose_i * CH))


def build_abilities():
    im = Image.open(SRC_AB).convert('RGB')
    a = np.array(im).astype(int)
    bg = np.array([138, 138, 140])
    d = np.abs(a - bg).sum(axis=2)
    cw, ch = im.size[0] // 8, im.size[1] // 6
    atlas = Image.new('RGBA', (512, 640), (0, 0, 0, 0))
    for row in range(5):
        for col in range(4):
            cell = Image.fromarray(a[row * ch:(row + 1) * ch, col * cw:(col + 1) * cw].astype(np.uint8), 'RGB')
            dd = d[row * ch:(row + 1) * ch, col * cw:(col + 1) * cw]
            alpha = np.clip((dd - 40.0) / 50.0, 0.0, 1.0)
            rgba = np.dstack([np.array(cell), (alpha * 255).astype(np.uint8)])
            fig = Image.fromarray(rgba, 'RGBA')
            bbox = fig.split()[3].getbbox()
            if bbox:
                fig = fig.crop(bbox)
            fig = fig.resize((128, 128), Image.LANCZOS)
            atlas.paste(fig, (col * 128, row * 128))
    return atlas


def build_ui(cells):
    crop, mask = cells[(1, 7)]
    fig = figure_rgba(crop, mask)
    # retrato: figura inteira em 320x360
    port = Image.new('RGBA', (320, 360), (0, 0, 0, 0))
    f = fig.copy()
    f.thumbnail((300, 340), Image.LANCZOS)
    port.paste(f, ((320 - f.size[0]) // 2, 360 - f.size[1]))
    # face: cabeça (topo ~45% da figura) em 168x168
    w, h = fig.size
    head = fig.crop((0, 0, w, int(h * 0.42)))
    bbox = head.split()[3].getbbox()
    if bbox:
        head = head.crop(bbox)
    face = Image.new('RGBA', (168, 168), (0, 0, 0, 0))
    head.thumbnail((160, 160), Image.LANCZOS)
    face.paste(head, ((168 - head.size[0]) // 2, (168 - head.size[1]) // 2))
    return face, port


def main():
    cells = cut_cells()
    print('células recortadas:', len(cells))
    sheet = build_sheet(cells)
    out = ROOT / 'assets/sprites/dev-veterano.png'
    sheet.save(out)
    print('ok', out)
    atlas = build_abilities()
    out = ROOT / 'assets/abilities/dev-veterano.png'
    atlas.save(out)
    print('ok', out)
    face, port = build_ui(cells)
    face.save(ROOT / 'assets/ui/face-dev-veterano.png')
    port.save(ROOT / 'assets/ui/portrait-dev-veterano.png')
    print('ok ui')


if __name__ == '__main__':
    main()
