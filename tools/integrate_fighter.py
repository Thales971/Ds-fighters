#!/usr/bin/env python3
"""Integra lutadores novos a partir da arte enviada pelo dono
(bugs/Novos-personagens/). Generico: cada lutador tem uma config com a folha
de poses, o grid (detectado por projecao de alpha — NUNCA assumido), o
mapeamento de poses e a fonte do atlas de habilidades.

Gera, por lutador:
  - assets/sprites/<id>.png     1280x3900 (4x15, celula 320x260, pe y246)
  - assets/abilities/<id>.png   512x640  (4x5 de 128)
  - assets/ui/face-<id>.png     168x168
  - assets/ui/portrait-<id>.png 320x360

Uso: python3 tools/integrate_fighter.py hana cyber-psicopata
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'bugs/Novos-personagens'
CW, CH, BASE, AIR = 320, 260, 246, 220
POSES_ORDER = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch',
               'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']


def bands(profile, thr):
    out, inb = [], False
    for i, v in enumerate(profile):
        if v > thr and not inb:
            inb, s = True, i
        elif v <= thr and inb:
            inb = False
            out.append((s, i))
    if inb:
        out.append((s, len(profile)))
    return out


def load_sheet(path, min_sz=350, row_bands=None):
    """Detecta bg pelas bordas e o grid por projecao; extrai figuras."""
    im = Image.open(path).convert('RGB')
    a = np.array(im).astype(int)
    bg = np.median(np.concatenate([
        a[0:8, :].reshape(-1, 3), a[-8:, :].reshape(-1, 3),
        a[:, 0:8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]), axis=0)
    d = np.abs(a - bg).sum(axis=2)
    fg = ndimage.binary_closing(d > 120, structure=np.ones((3, 3)))
    rb = row_bands or [b for b in bands(fg.sum(axis=1), 30) if b[1] - b[0] > 40]
    cb = [b for b in bands(fg.sum(axis=0), 20) if b[1] - b[0] > 40]
    cells = {}
    for ri, (y0, y1) in enumerate(rb):
        for ci, (x0, x1) in enumerate(cb):
            sub = fg[y0:y1, x0:x1]
            lab, n = ndimage.label(sub)
            keep = np.zeros_like(sub)
            if n:
                sizes = [int(s) for s in ndimage.sum(sub, lab, range(1, n + 1))]
                for i in range(n):
                    if sizes[i] > min_sz:
                        keep |= lab == i + 1
            if not keep.any():
                continue
            yy, xx = np.where(keep)
            bx0, by0 = x0 + int(xx.min()), y0 + int(yy.min())
            bx1, by1 = x0 + int(xx.max()) + 1, y0 + int(yy.max()) + 1
            cells[(ci, ri)] = (im.crop((bx0, by0, bx1, by1)),
                               keep[(by0 - y0):(by1 - y0), (bx0 - x0):(bx1 - x0)],
                               bg)
    return cells


def figure_rgba(crop, mask, bg):
    """Croma-key com unmixing de cor e denoise (sem fringe do JPEG)."""
    a = np.array(crop).astype(float)
    d = np.abs(a - bg).sum(axis=2)
    alpha = np.clip((d - 130.0) / 60.0, 0.0, 1.0)
    alpha[~mask] = 0.0
    mag = (d < 260) & (alpha > 0.99)
    if mag.any():
        g = a[..., 1]
        a2 = a.copy()
        a2[mag, 0] = g[mag]
        a2[mag, 2] = g[mag]
        a = a2
    a3 = np.maximum(alpha[..., None], 1e-3)
    fg = (a - bg[None, None, :] * (1.0 - a3)) / a3
    fg = np.clip(fg, 0, 255)
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


def place(sheet, fig, target_h, foot_y, col, pose_i, dx=0, flip=False):
    w, h = fig.size
    if h <= 0:
        return
    s = target_h / h
    nw, nh = max(1, int(round(w * s))), max(1, int(round(h * s)))
    if nw > CW - 24:
        s = (CW - 24) / w
        nw, nh = max(1, int(round(w * s))), max(1, int(round(h * s)))
    fig2 = fig.resize((nw, nh), Image.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    if flip:
        fig2 = fig2.transpose(Image.FLIP_LEFT_RIGHT)
    arr = np.array(fig2)
    ys = np.where((arr[..., 3] > 8).any(axis=1))[0]
    if not len(ys):
        return
    bottom = int(ys.max())
    cell = np.zeros((CH, CW, 4), dtype=np.uint8)
    x0 = (CW - nw) // 2 + dx
    y0 = foot_y - bottom
    y0c = max(0, y0)
    src_y = y0c - y0
    h2 = min(nh - src_y, CH - y0c)
    if h2 > 0:
        cell[y0c:y0c + h2, max(0, x0):max(0, x0) + nw] = arr[src_y:src_y + h2]
    sheet.paste(Image.fromarray(cell, 'RGBA'), (col * CW, pose_i * CH))


# (ci, ri, flip) por frame — None repete o anterior
# Layout real da Hana (7 linhas x 4 cols, primeira banda da folha eram duas
# linhas grudadas): r0 idle/andar/pulo/garra | r1 agachar/block/tiro/hit
# r2 agachar/chute/andar/tiro | r3 andar/garra/hit/block | r4 garra/pulo/tiro/hit
# r5 chute/pulo/tiro/vitoria | r6 garra/andar/tiro/hit
HANA_POSES = {
    'idle':    ([(0, 0, False)] * 4, 195, BASE),
    'walk':    ([(1, 0, False), (2, 2, False), (1, 6, False), (1, 0, False)], 190, BASE),
    'jump':    ([(2, 0, False), (1, 4, False), (1, 5, False), (2, 0, False)], 165, AIR),
    'crouch':  ([(0, 1, False), (0, 2, False), (0, 1, False), (0, 2, False)], 125, BASE),
    'punch':   ([(3, 0, False), (1, 3, False), (0, 4, False), (0, 6, False)], 175, BASE),
    'kick':    ([(1, 2, False), (0, 5, False), (1, 2, False), (0, 5, False)], 165, BASE),
    'cpunch':  ([(0, 4, False)] * 4, 130, BASE),
    'ckick':   ([(0, 5, False)] * 4, 150, BASE),
    'jpunch':  ([(3, 0, False)] * 4, 170, AIR),
    'jkick':   ([(1, 5, False)] * 4, 160, AIR),
    'special': ([(2, 1, False), (3, 2, False), (2, 4, False), (2, 5, False)], 195, BASE),
    'hit':     ([(3, 1, False), (2, 3, False), (3, 4, False), (3, 6, False)], 185, BASE),
    'block':   ([(1, 1, False), (3, 3, False), (1, 1, False), (3, 3, False)], 190, BASE),
    'ko':      ([(3, 6, False)] * 4, 76, BASE),
    'win':     ([(3, 5, False)] * 4, 195, BASE),
}

CIBER_POSES = {
    'idle':    ([(0, 0, False), (0, 3, True), (0, 4, True), (0, 0, False)], 195, BASE),
    'walk':    ([(1, 0, False), (2, 3, True), (1, 4, True), (1, 0, False)], 190, BASE),
    'jump':    ([(2, 0, False)] * 4, 165, AIR),
    'crouch':  ([(3, 0, False)] * 4, 125, BASE),
    'punch':   ([(0, 1, False)] * 4, 175, BASE),
    'kick':    ([(1, 1, False)] * 4, 165, BASE),
    'cpunch':  ([(3, 0, False)] * 4, 130, BASE),
    'ckick':   ([(3, 0, False)] * 4, 150, BASE),
    'jpunch':  ([(0, 1, False)] * 4, 170, AIR),
    'jkick':   ([(1, 1, False)] * 4, 160, AIR),
    'special': ([(3, 2, False), (3, 4, True), (3, 2, False), (3, 4, True)], 195, BASE),
    'hit':     ([(0, 2, False)] * 4, 185, BASE),
    'block':   ([(1, 2, False)] * 4, 190, BASE),
    'ko':      ([(1, 3, False)] * 4, 76, BASE),
    'win':     ([(3, 3, False)] * 4, 195, BASE),
}

SHAKE_DEFAULT = [0, 3, 0, -3]

FIGHTERS = {
    'hana': {
        'sheet': 'Hana sprites.jpg',
        'abilities': 'hana abilidades.jpg',
        'poses': HANA_POSES,
        'ui_cell': (0, 0, False),
        # primeira banda da projecao (11-269) sao DUAS linhas grudadas: split em 135
        'row_bands': [(11, 135), (135, 269), (276, 388), (396, 507), (516, 627), (635, 750), (761, 879)],
    },
    'cyber-psicopata': {
        'sheet': 'ciber-psicopata sprites.jpg',
        'abilities': 'ciber-psicopata habilidades 2.jpg',
        'poses': CIBER_POSES,
        'ui_cell': (0, 0, False),
    },
}


def build_sheet(cells, pose_map):
    sheet = Image.new('RGBA', (1280, 3900), (0, 0, 0, 0))
    for pose_i, pose in enumerate(POSES_ORDER):
        keys, target_h, foot_y = pose_map[pose]
        for frame in range(4):
            ci, ri, flip = keys[frame]
            crop, mask, bg = cells[(ci, ri)]
            fig = figure_rgba(crop, mask, bg)
            shake = SHAKE_DEFAULT if len(set(map(tuple, keys))) == 1 else 0
            place(sheet, fig, target_h, foot_y, frame, pose_i,
                  dx=shake[frame] if shake else 0, flip=flip)
    return sheet


def build_abilities(path):
    cells = load_sheet(path, min_sz=80)
    # ordena por (linha, coluna) e agrupa em 5 linhas x 4 cols
    items = sorted(cells.items(), key=lambda kv: (kv[0][1], kv[0][0]))
    atlas = Image.new('RGBA', (512, 640), (0, 0, 0, 0))
    for k, (_, (crop, mask, bg)) in enumerate(items[:20]):
        fig = figure_rgba(crop, mask, bg)
        bbox = fig.split()[3].getbbox()
        if bbox:
            fig = fig.crop(bbox)
        fig = fig.resize((128, 128), Image.LANCZOS)
        atlas.paste(fig, ((k % 4) * 128, (k // 4) * 128))
    return atlas


def build_ui(cells, ui_cell):
    crop, mask, bg = cells[ui_cell[:2]]
    fig = figure_rgba(crop, mask, bg)
    port = Image.new('RGBA', (320, 360), (0, 0, 0, 0))
    f = fig.copy()
    f.thumbnail((300, 340), Image.LANCZOS)
    port.paste(f, ((320 - f.size[0]) // 2, 360 - f.size[1]))
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
    ids = sys.argv[1:] or list(FIGHTERS)
    for fid in ids:
        cfg = FIGHTERS[fid]
        cells = load_sheet(SRC / cfg['sheet'], row_bands=cfg.get('row_bands'))
        print(fid, '->', len(cells), 'figuras')
        sheet = build_sheet(cells, cfg['poses'])
        sheet.save(ROOT / f'assets/sprites/{fid}.png')
        atlas = build_abilities(SRC / cfg['abilities'])
        atlas.save(ROOT / f'assets/abilities/{fid}.png')
        face, port = build_ui(cells, cfg['ui_cell'])
        face.save(ROOT / f'assets/ui/face-{fid}.png')
        port.save(ROOT / f'assets/ui/portrait-{fid}.png')
        print('ok', fid)


if __name__ == '__main__':
    main()
