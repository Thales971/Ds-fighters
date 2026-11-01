#!/usr/bin/env python3
"""Recorta faixas magenta geradas e monta folhas 320x260 no layout do jogo."""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/opt/cursor/artifacts/assets'
FW, FH, BASE = 320, 260, 246
POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']

def key_magenta(im):
    arr = np.array(im.convert('RGB'))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    mag = (r > 170) & (b > 90) & (g < 150) & ((r + b) > (g * 3 + 80))
    # franja rosada grudada no contorno
    pink = (r > 150) & (b > 80) & (g < 140) & (r > g + 50) & (b > g + 20)
    bg = mag | pink
    # expande o fundo 1px só onde o pixel ainda é rosado
    pad = np.pad(bg, 1)
    near = np.zeros_like(bg)
    h, w = bg.shape
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near |= pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
    bg = bg | (near & pink)
    rgba = np.dstack([arr, np.where(bg, 0, 255).astype(np.uint8)])
    return rgba

def column_regions(alpha, thresh=36):
    col = (alpha > 40).sum(axis=0)
    regs = []
    s = None
    for x, v in enumerate(col):
        if v >= thresh and s is None:
            s = x
        if v < thresh and s is not None:
            if x - s > 28:
                regs.append([s, x])
            s = None
    if s is not None and len(col) - s > 28:
        regs.append([s, len(col)])
    return regs

def crop(rgba, x0, x1):
    sl = rgba[:, x0:x1]
    a = sl[:, :, 3] > 40
    if a.sum() < 80:
        return None
    ys, xs = np.where(a)
    return sl[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()

def split_wide(sp):
    """Separa dois lutadores colados lado a lado."""
    if sp.shape[1] < 260:
        return [sp]
    a = sp[:, :, 3] > 40
    col = a.sum(axis=0)
    w = len(col)
    lo, hi = int(w * 0.28), int(w * 0.72)
    if hi - lo < 8:
        return [sp]
    cut = lo + int(np.argmin(col[lo:hi]))
    if col[cut] > max(60, col.max() * 0.35):
        return [sp]
    parts = []
    for sl in (sp[:, :cut], sp[:, cut:]):
        aa = sl[:, :, 3] > 40
        if aa.sum() < 80:
            continue
        ys, xs = np.where(aa)
        parts.append(sl[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy())
    if len(parts) < 2:
        return [sp]
    out = []
    for p in parts:
        out.extend(split_wide(p))
    return out

def vsplit(sp):
    a = sp[:, :, 3] > 40
    rows = a.sum(axis=1)
    gaps = []
    s = None
    for y, v in enumerate(rows):
        if v < 6 and s is None:
            s = y
        if v >= 6 and s is not None:
            if y - s > 10 and s > 20 and y < len(rows) - 10:
                gaps.append((s, y))
            s = None
    if not gaps:
        return [sp]
    # maior vão
    g = max(gaps, key=lambda t: t[1] - t[0])
    top, bot = sp[:g[0]], sp[g[1]:]
    out = []
    for part in (top, bot):
        aa = part[:, :, 3] > 40
        if aa.sum() < 80:
            continue
        ys, xs = np.where(aa)
        out.append(part[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy())
    return out or [sp]

def take(path, n=6):
    im = Image.open(path)
    rgba = key_magenta(im)
    regs = column_regions(rgba[:, :, 3])
    sprites = []
    for a, b in regs:
        sp = crop(rgba, a, b)
        if sp is None:
            continue
        sprites.extend(vsplit(sp))
    # descarta farelos
    sprites = [s for s in sprites if s.shape[0] > 40 and s.shape[1] > 20]
    sprites.sort(key=lambda s: s.shape[0] * s.shape[1], reverse=True)
    # mantém os n maiores se sobrou prop, mas preserva ordem da esquerda
    # refaz em ordem de x: já vieram da esquerda. se > n, remove o menor que não é o último par
    ordered = []
    for a, b in regs:
        sp = crop(rgba, a, b)
        if sp is None:
            continue
        ordered.extend(vsplit(sp))
    split = []
    for s in ordered:
        split.extend(split_wide(s))
    ordered = [s for s in split if s.shape[0] > 40 and s.shape[1] > 20]
    print(f'  {os.path.basename(path)} sprites {len(ordered)} sizes', [f'{s.shape[1]}x{s.shape[0]}' for s in ordered])
    if len(ordered) > n:
        # remove os menores extras, preservando ordem
        while len(ordered) > n:
            i = min(range(len(ordered)), key=lambda k: ordered[k].shape[0] * ordered[k].shape[1])
            ordered.pop(i)
    while len(ordered) < n:
        ordered.append(ordered[-1])
    return ordered[:n]

def scale_to(sp, scale):
    h, w = sp.shape[:2]
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    im = Image.fromarray(sp, 'RGBA').resize((nw, nh), Image.NEAREST)
    return np.array(im)

def foot_x(sp):
    h, w = sp.shape[:2]
    y0 = int(h * 0.82)
    a = sp[y0:, :, 3] > 40
    xs = np.where(a.any(axis=0))[0]
    if len(xs) == 0:
        return w / 2
    return (xs[0] + xs[-1]) / 2

def stamp(sp):
    cell = np.zeros((FH, FW, 4), np.uint8)
    h, w = sp.shape[:2]
    dx = int(round(FW / 2 - foot_x(sp)))
    dy = BASE - h
    x0, y0 = max(0, dx), max(0, dy)
    sx0, sy0 = max(0, -dx), max(0, -dy)
    x1, y1 = min(FW, dx + w), min(FH, dy + h)
    if x1 <= x0 or y1 <= y0:
        return cell
    cell[y0:y1, x0:x1] = sp[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)]
    return cell

def sheet_for(fid, move_p, atk_p, react_p):
    M, A, R = take(move_p), take(atk_p), take(react_p)
    idle_h = M[0].shape[0]
    scale = 198 / idle_h
    # se algum golpe ficar alto demais, reduz
    tall = max(s.shape[0] for s in M + A + R)
    if tall * scale > 242:
        scale = 242 / tall
    M, A, R = [scale_to(s, scale) for s in M], [scale_to(s, scale) for s in A], [scale_to(s, scale) for s in R]
    seq = {
        'idle': [M[0], M[1], M[0], M[1]],
        'walk': [M[2], M[3], M[4], M[3]],
        'jump': [M[5], M[5]],
        'crouch': [A[3], A[3]],
        'punch': [A[0], A[1], A[1], A[0]],
        'kick': [A[2], A[5], A[2], A[5]],
        'cpunch': [A[4], A[4]],
        'ckick': [A[3], A[5], A[5]],
        'jpunch': [A[0], A[1], A[1]],
        'jkick': [A[2], A[5], A[5]],
        'special': [R[3], R[3]],
        'hit': [R[1], R[1]],
        'block': [R[0], R[0]],
        'ko': [R[4] if len(R) > 4 else R[-1], R[5] if len(R) > 5 else R[-1]],
        'win': [R[2], R[2]],
    }
    canvas = np.zeros((len(POSES) * FH, 4 * FW, 4), np.uint8)
    for r, name in enumerate(POSES):
        for c, sp in enumerate(seq[name]):
            canvas[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = stamp(sp)
    Image.fromarray(canvas, 'RGBA').save(os.path.join(ROOT, 'assets/sprites', fid + '.png'), optimize=True)
    idle = canvas[0:FH, 0:FW]
    a = idle[:, :, 3] > 20
    ys, xs = np.where(a)
    # retrato: cabeça
    top = ys.min()
    bot = min(ys.max(), top + int((ys.max() - top) * 0.42))
    face = idle[top:bot, xs.min():xs.max() + 1]
    Image.fromarray(face, 'RGBA').resize((168, 168), Image.NEAREST).save(os.path.join(ROOT, 'assets/ui', f'face-{fid}.png'))
    Image.fromarray(face, 'RGBA').resize((96, 96), Image.NEAREST).save(os.path.join(ROOT, 'assets/ui', f'portrait-{fid}.png'))
    print(fid, 'scale', round(scale, 3), 'idle', M[0].shape[1], 'x', M[0].shape[0])

def main():
    mapping = {
        'stack': 'et',
        'hacker': 'root',
        'zoya': 'zoya',
        'rin': 'rin',
        'noir': 'noir',
    }
    for fid, key in mapping.items():
        print('==', fid)
        sheet_for(
            fid,
            f'{SRC}/{key}-move.jpg',
            f'{SRC}/{key}-atk.jpg',
            f'{SRC}/{key}-react.jpg',
        )

if __name__ == '__main__':
    main()
