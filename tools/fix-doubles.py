#!/usr/bin/env python3
"""Remove bonecos duplicados/pedaços de vizinhos em cada célula das folhas de lutador.

Em várias folhas geradas, uma célula contém dois corpos inteiros (ex.: o quadro do chute
com o do soco ao lado). Para cada célula: separa os componentes (após dilatação, para
manter efeitos colados ao corpo), descobre os "corpos" grandes e mantém só o mais
próximo do centro horizontal onde o boneco fica nos quadros de idle. Efeitos pequenos
encostados no corpo mantido são preservados.

Uso: python3 tools/fix-doubles.py [ids...]   (sem ids: todas as folhas do layout)
      --dry  só relata
"""
import re, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CW, CH = 320, 260


def anchor_x(a):
    xs = []
    for c in range(4):
        cell = a[0:CH, c * CW:(c + 1) * CW]
        ys, x = np.nonzero(cell > 40)
        if len(x):
            xs.append((x.min() + x.max()) / 2)
    return float(np.median(xs)) if xs else CW / 2


def fix_cell(cell, ax):
    a = cell[..., 3]
    solid = a > 40
    if not solid.any():
        return cell, 0
    grown = ndimage.binary_dilation(solid, iterations=3)
    lab, n = ndimage.label(grown)
    if n <= 1:
        return cell, 0
    idx = range(1, n + 1)
    sizes = np.array(ndimage.sum(solid, lab, idx))
    big = sizes.max()
    bodies = [i + 1 for i, s in enumerate(sizes) if s >= big * 0.35]
    if len(bodies) <= 1:
        # só pedaços pequenos soltos: remove migalhas muito pequenas longe do corpo
        keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= max(40, big * 0.02)]
        removed = n - len(keep_ids)
        if removed == 0:
            return cell, 0
        keep = np.isin(lab, keep_ids)
        out = cell.copy(); out[..., 3] = np.where(keep, a, 0)
        return out, 0
    # vários corpos: mantém o mais próximo do eixo do boneco
    # o quadro certo costuma ser o corpo de maior caixa (chute com perna esticada, KO deitado)
    best, bestd = None, -1
    for b in bodies:
        ys, xs = np.nonzero(lab == b)
        area = (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)
        if area > bestd:
            best, bestd = b, area
    keep = lab == best
    # mantém efeitos menores (não-corpos) que estejam mais perto do corpo mantido que dos outros
    ys, xs = np.nonzero(keep)
    kx = (xs.min() + xs.max()) / 2
    for i, s in enumerate(sizes):
        lid = i + 1
        if lid in bodies or s < 30:
            continue
        yy, xx = np.nonzero(lab == lid)
        cx = (xx.min() + xx.max()) / 2
        others = [((np.nonzero(lab == b)[1].min() + np.nonzero(lab == b)[1].max()) / 2) for b in bodies if b != best]
        if all(abs(cx - kx) <= abs(cx - o) for o in others):
            keep |= lab == lid
    out = cell.copy()
    out[..., 3] = np.where(keep, a, 0)
    return out, len(bodies) - 1


def process(fid, dry=False):
    p = ROOT / f'assets/sprites/{fid}.png'
    im = np.array(Image.open(p).convert('RGBA'))
    a = im[..., 3]
    ax = anchor_x(a)
    rows = im.shape[0] // CH
    fixed = []
    for r in range(rows):
        for c in range(4):
            cell = im[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW]
            out, k = fix_cell(cell, ax)
            if k:
                fixed.append((r, c))
            im[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = out
    if not dry and fixed:
        Image.fromarray(im).save(p, optimize=True)
    return fixed


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    dry = '--dry' in sys.argv
    ids = args or re.findall(r'"(\w+)": "assets/sprites/', (ROOT / 'assets/sprites/layout.js').read_text())
    if '--anchor' not in sys.argv:
        for fid in ids:
            f = process(fid, dry)
            print(fid, len(f), f[:12])


def anchor_sheet(fid, rows=range(1, 13), max_fwd=14, dry=False):
    """Alinha a borda de trás do boneco (lado oposto ao que ele olha) com a do idle, evitando
    'teletransporte' para frente nos golpes. Os bonecos olham para a direita."""
    p = ROOT / f'assets/sprites/{fid}.png'
    im = np.array(Image.open(p).convert('RGBA'))
    a = im[..., 3]
    lefts = []
    for c in range(4):
        ys, xs = np.nonzero(a[0:CH, c * CW:(c + 1) * CW] > 40)
        if len(xs):
            lefts.append(xs.min())
    base = int(np.median(lefts))
    moved = []
    for r in rows:
        for c in range(4):
            cell = im[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW].copy()
            ys, xs = np.nonzero(cell[..., 3] > 40)
            if not len(xs):
                continue
            d = xs.min() - base
            if d > max_fwd + 10:
                sh = d - max_fwd
                out = np.zeros_like(cell)
                out[:, :CW - sh] = cell[:, sh:]
                im[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = out
                moved.append((r, c, int(sh)))
    if moved and not dry:
        Image.fromarray(im).save(p, optimize=True)
    return moved


if __name__ == '__main__' and '--anchor' in sys.argv:
    for fid in (args or re.findall(r'"(\w+)": "assets/sprites/', (ROOT / 'assets/sprites/layout.js').read_text())):
        m = anchor_sheet(fid, dry=dry)
        print('anchor', fid, len(m), m[:6])
