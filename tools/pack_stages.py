#!/usr/bin/env python3
"""Monta folhas 6x4 de 960x540 a partir de um fundo denso, com luzes piscando."""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/opt/cursor/artifacts/assets'
DW, DH, COLS, ROWS, N = 960, 540, 6, 4, 24

def load(name):
    im = Image.open(f'{SRC}/{name}.jpg').convert('RGB').resize((DW, DH), Image.BOX)
    return np.array(im)

def lights(base, pred, frame, period, dim=0.45, boost=1.35):
    out = base.copy()
    ys, xs = np.where(pred)
    if len(ys) == 0:
        return out
    sel = ((xs * 3 + ys * 5 + frame * 17) % period) == 0
    yy, xx = ys[sel], xs[sel]
    pix = out[yy, xx].astype(np.float32)
    if frame % 2 == 0:
        pix *= dim
    else:
        pix *= boost
    out[yy, xx] = np.clip(pix, 0, 255).astype(np.uint8)
    return out

def rain(out, frame, color, n=70, speed=14):
    h, w, _ = out.shape
    for i in range(n):
        x = (i * 37 + frame * 3) % w
        y = (i * 53 + frame * speed) % (h // 2)
        out[y:y + 6, x:x + 2] = color
    return out

def build(name, base, kind):
    sheet = np.zeros((DH * ROWS, DW * COLS, 3), np.uint8)
    r, g, b = base[:, :, 0], base[:, :, 1], base[:, :, 2]
    for i in range(N):
        frame = base.copy()
        if kind == 'oficina':
            mon = (g.astype(int) > r.astype(int) + 25) & (g > 70) & (b < 140)
            frame = lights(frame, mon, i, 5)
            led = (r > 160) & (g < 80) & (b < 80)
            frame = lights(frame, led, i, 3, dim=0.2, boost=1.6)
        elif kind == 'terminal':
            gly = (g.astype(int) > 90) & (g.astype(int) > r.astype(int) + 30)
            frame = lights(frame, gly, i, 4, dim=0.35, boost=1.5)
            frame = rain(frame, i, (40, 220, 90), n=90, speed=18)
        elif kind == 'metro':
            lamp = (r > 180) & (g > 170) & (b > 120)
            frame = lights(frame, lamp, i, 6, dim=0.55, boost=1.25)
            win = (r > 140) & (g > 90) & (b < 120) & (r > b + 30)
            frame = lights(frame, win, i, 4, dim=0.4, boost=1.4)
        elif kind == 'sql':
            glass = (b.astype(int) > 80) & ((r.astype(int) + b.astype(int)) > g.astype(int) + 40)
            frame = lights(frame, glass, i, 5, dim=0.7, boost=1.25)
            lamp = (r > 180) & (g > 120) & (b < 100)
            frame = lights(frame, lamp, i, 7, dim=0.6, boost=1.3)
        rr, cc = divmod(i, COLS)
        sheet[rr * DH:(rr + 1) * DH, cc * DW:(cc + 1) * DW] = frame
    path = os.path.join(ROOT, 'assets/stages', name + '.png')
    Image.fromarray(sheet, 'RGB').save(path, optimize=True)
    print(name, os.path.getsize(path))

def main():
    build('11-oficina-latas', load('stage-oficina'), 'oficina')
    build('12-terminal-fosforo', load('stage-terminal'), 'terminal')
    build('13-metro-pacotes', load('stage-metro'), 'metro')
    build('14-catedral-sql', load('stage-sql'), 'sql')

if __name__ == '__main__':
    main()
