#!/usr/bin/env python3
"""Monta folhas de lutador (4 col x 15 lin, 320x260) a partir de blocos redesenhados.

Cada bloco editado (work/v3/out/<id>-<n>.png) cobre as linhas [0-4) [4-8) [8-12) [12-15)
de uma folha-modelo. Para cada célula, o boneco redesenhado é recortado, escalado para a
altura do boneco-modelo e colado alinhado pelo pé e pelo centro, preservando o timing e
o posicionamento das animações existentes. Também gera face-<id>.png e portrait-<id>.png.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
import os
OUT = Path(os.environ.get('CHAR_OUT', '/home/ubuntu/work/v3/out'))
TPL_DIR = Path(os.environ.get('CHAR_TPL', '/home/ubuntu/work/v3/orig'))
CW, CH = 320, 260
CHUNKS = [(0, 4), (4, 8), (8, 12), (12, 15)]
CHUNKS2 = [(0, 8), (8, 15)]
# id final -> (modelo, escala de altura)
CHARS = {
    'du': ('du', 1.0), 'felipinho': ('felipinho', 1.0), 'bhm': ('felipinho', 1.0),
    'xeon': ('frontend', 1.0, 2), 'urbano': ('backend', 1.06, 2), 'qwen': ('frontend', 1.0, 2),
    'kotlin': ('qa', 0.86), 'hacker': ('fullstack', 1.0), 'java': ('backend', 1.04), 'merc': ('gitmaster', 1.0),
}


def bbox_alpha(a, thr=40):
    ys, xs = np.nonzero(a > thr)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def clean(cell):
    """Remove fragmentos pequenos (pedaços de células vizinhas)."""
    arr = np.array(cell)
    a = arr[..., 3]
    lab, n = ndimage.label(a > 40)
    if n == 0:
        return cell, None
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    big = sizes.max()
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= big * 0.06])
    # mantém semitransparências próximas aos componentes válidos
    keep = ndimage.binary_dilation(keep, iterations=2)
    arr[..., 3] = np.where(keep, a, 0)
    out = Image.fromarray(arr)
    return out, bbox_alpha(arr[..., 3])


def build(cid, tpl_id, k, nchunks=4):
    # o modelo é sempre lido da cópia original (folhas podem ser substituídas no processo)
    bak = TPL_DIR; bak.mkdir(exist_ok=True)
    if not (bak / f'{tpl_id}.png').exists():
        Image.open(ROOT / f'assets/sprites/{tpl_id}.png').save(bak / f'{tpl_id}.png')
    tpl = Image.open(bak / f'{tpl_id}.png').convert('RGBA')
    sheet = Image.new('RGBA', tpl.size, (0, 0, 0, 0))
    for n, (r0, r1) in enumerate(CHUNKS2 if nchunks == 2 else CHUNKS):
        rows = r1 - r0
        ed = Image.open(OUT / f'{cid}-{n}.png').convert('RGBA').resize((4 * CW, rows * CH), Image.LANCZOS)
        for r in range(rows):
            for c in range(4):
                tcell = tpl.crop((c * CW, (r0 + r) * CH, (c + 1) * CW, (r0 + r + 1) * CH))
                tb = bbox_alpha(np.array(tcell)[..., 3])
                if not tb:
                    continue
                ecell, eb = clean(ed.crop((c * CW, r * CH, (c + 1) * CW, (r + 1) * CH)))
                if not eb:
                    continue
                fig = ecell.crop(eb)
                th = (tb[3] - tb[1]) * k
                s = th / fig.height
                nw, nh = max(1, round(fig.width * s)), max(1, round(fig.height * s))
                fig = fig.resize((nw, nh), Image.LANCZOS)
                cx = (tb[0] + tb[2]) / 2
                x = round(cx - nw / 2)
                y = round(tb[3] - nh)
                x = max(0, min(CW - nw, x)) if nw <= CW else (CW - nw) // 2
                y = max(0, min(CH - nh, y)) if nh <= CH else CH - nh
                cell = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
                cell.alpha_composite(fig, (x, y)) if x >= 0 and y >= 0 else cell.paste(fig, (x, y), fig)
                # pixel art: alfa binária e paleta levemente reduzida
                arr = np.array(cell)
                arr[..., 3] = np.where(arr[..., 3] > 110, 255, 0)
                sheet.alpha_composite(Image.fromarray(arr), (c * CW, (r0 + r) * CH))
    sheet.save(ROOT / f'assets/sprites/{cid}.png', optimize=True)
    # retratos a partir do quadro parado
    idle = sheet.crop((0, 0, CW, CH))
    b = bbox_alpha(np.array(idle)[..., 3])
    fig = idle.crop(b)
    hh = int(fig.height * 0.36)
    head = fig.crop((0, 0, fig.width, hh))
    hb = bbox_alpha(np.array(head)[..., 3])
    hcx = (hb[0] + hb[2]) / 2
    side = int(hh * 1.05)
    face = fig.crop((int(hcx - side / 2), -int(side * 0.04), int(hcx + side / 2), side - int(side * 0.04)))
    face.resize((168, 168), Image.NEAREST).save(ROOT / f'assets/ui/face-{cid}.png')
    pw = round(fig.width * 96 / fig.height)
    fig.resize((pw, 96), Image.LANCZOS).save(ROOT / f'assets/ui/portrait-{cid}.png')
    print('ok', cid, sheet.size)


if __name__ == '__main__':
    ids = sys.argv[1:] or list(CHARS)
    for cid in ids:
        build(cid, *CHARS[cid])
