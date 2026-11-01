#!/usr/bin/env python3
"""Quatro arenas animadas 960x540, folha 6x4, sem silhuetas humanas."""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DW, DH = 960, 540
COLS, ROWS, N = 6, 4, 24

def rng(seed):
    return np.random.RandomState(seed)

def floor(buf, y0, a, b, grout):
    h, w, _ = buf.shape
    yy = np.arange(y0, h)[:, None]
    xx = np.arange(w)[None, :]
    t = (yy - y0) / max(1, h - y0)
    depth = np.power(t, 0.62)
    half = 8 + depth * w * 0.62
    u = (xx - (w - 1) / 2) / half
    inside = np.abs(u) < 1
    col = np.floor(u + 64).astype(np.int32)
    v = np.floor(depth * 14).astype(np.int32)
    grout_m = (np.abs(depth * 14 - v) < 0.12) | (np.abs(u - np.round(u)) < 0.05)
    shade = (0.55 + 0.55 * t)[..., None]
    aa = np.asarray(a, np.float32).reshape(1, 1, 3)
    bb = np.asarray(b, np.float32).reshape(1, 1, 3)
    gg = np.asarray(grout, np.float32).reshape(1, 1, 3)
    base = np.where(((v + col) & 1)[..., None] == 0, aa, bb)
    paint = np.where(grout_m[..., None], gg, base) * shade
    region = buf[y0:]
    ys, xs = np.where(inside)
    region[ys, xs, :3] = np.clip(paint[ys, xs], 0, 255)
    region[ys, xs, 3] = 255

def windows(buf, seed, color, blink, frame):
    rs = rng(seed)
    for _ in range(90):
        x, y = int(rs.randint(40, 900)), int(rs.randint(40, 250))
        ww, hh = int(rs.randint(18, 70)), int(rs.randint(28, 120))
        buf[y:y + hh, x:x + ww] = (8, 10, 22, 255)
        on = ((x * 3 + y + frame) % 5) != blink
        if on:
            buf[y + 4:y + hh - 4:8, x + 4:x + ww - 4:8] = (*color, 255)

def sky(buf, top, bot):
    h = buf.shape[0]
    t = np.linspace(0, 1, h)[:, None, None]
    col = top * (1 - t) + bot * t
    buf[:] = np.clip(col, 0, 255).astype(np.uint8)
    buf[:, :, 3] = 255

def stars(buf, seed, frame):
    rs = rng(seed)
    for i in range(80):
        x = int((rs.randint(0, DW) + frame * (1 + i % 3)) % DW)
        y = int(rs.randint(0, 180))
        if (i + frame) % 4:
            buf[y:y + 2, x:x + 2] = (230, 240, 255, 255)

def build(name, painter):
    sheet = np.zeros((DH * ROWS, DW * COLS, 4), np.uint8)
    for i in range(N):
        frame = painter(i)
        r, c = divmod(i, COLS)
        # painter returns frame index 0..23 in row-major matching ffmpeg order: col = i % 6, row = i // 6
        chunky = np.array(Image.fromarray(frame, 'RGBA').resize((384, 216), Image.BOX).resize((DW, DH), Image.NEAREST))
        sheet[r * DH:(r + 1) * DH, c * DW:(c + 1) * DW] = chunky
    path = os.path.join(ROOT, 'assets/stages', name + '.png')
    Image.fromarray(sheet, 'RGBA').save(path, optimize=True)
    print(name, os.path.getsize(path))

def oficina(i):
    buf = np.zeros((DH, DW, 4), np.uint8)
    sky(buf, np.array([18, 22, 34, 255]), np.array([48, 36, 28, 255]))
    # bancadas e gabinetes beges, sem gente
    for k, x in enumerate(range(30, 900, 120)):
        h = 90 + (k % 3) * 24
        buf[250 - h:250, x:x + 70] = (196, 184, 150, 255)
        buf[258 - h:270 - h, x + 10:x + 58] = (20, 24, 32, 255)
        if (k + i) % 3 == 0:
            buf[262 - h:266 - h, x + 14:x + 50] = (80, 220, 200, 255)
        buf[250:268, x - 10:x + 90] = (90, 70, 48, 255)
    # esteira de chips
    for k in range(8):
        x = int((k * 120 + i * 8) % DW)
        buf[300:318, x:x + 28] = (170, 186, 200, 255)
    floor(buf, 330, np.array([70, 54, 36]), np.array([90, 70, 46]), np.array([40, 30, 20]))
    return buf

def terminal(i):
    buf = np.zeros((DH, DW, 4), np.uint8)
    sky(buf, np.array([2, 10, 6, 255]), np.array([4, 28, 14, 255]))
    rs = rng(3)
    glyphs = list('01ABCDEF$#')
    for col in range(28):
        x = 20 + col * 34
        shift = (i * 18 + col * 13) % 220
        for row in range(14):
            y = (row * 22 + shift) % 300
            if y > 300:
                continue
            ch = glyphs[(col + row + i) % len(glyphs)]
            buf[y:y + 10, x:x + 8] = (40, 255, 120, 255) if (col + i) % 7 else (20, 140, 70, 255)
            buf[y + 10:y + 12, x:x + 14] = (8, 40, 18, 255)
            _ = ch
    floor(buf, 340, np.array([6, 28, 14]), np.array([10, 48, 22]), np.array([20, 90, 40]))
    return buf

def metro(i):
    buf = np.zeros((DH, DW, 4), np.uint8)
    sky(buf, np.array([8, 10, 18, 255]), np.array([18, 16, 28, 255]))
    # tunel
    buf[40:300, :] = (12, 14, 22, 255)
    for k in range(6):
        y = 70 + k * 28
        buf[y:y + 6, :] = (28, 30, 42, 255)
    # trem passando
    x = int((i * 70) % (DW + 400)) - 200
    buf[120:250, max(0, x):min(DW, x + 280)] = (36, 40, 58, 255)
    for w in range(4):
        wx = x + 20 + w * 66
        if 0 <= wx < DW - 40:
            lit = (w + i) % 2 == 0
            buf[140:190, wx:wx + 40] = ((255, 214, 120, 255) if lit else (40, 50, 70, 255))
    # trilhos
    buf[300:312, :] = (40, 42, 48, 255)
    floor(buf, 320, np.array([28, 30, 36]), np.array([42, 44, 52]), np.array([90, 90, 98]))
    return buf

def sql(i):
    buf = np.zeros((DH, DW, 4), np.uint8)
    sky(buf, np.array([16, 10, 28, 255]), np.array([36, 18, 48, 255]))
    stars(buf, 9, i)
    for k, x in enumerate(range(60, 900, 140)):
        h = 160 + (k % 3) * 30
        buf[40:40 + h, x:x + 36] = (70, 48, 110, 255)
        buf[40:40 + h, x + 14:x + 22] = (120, 90, 170, 255)
        if (k + i) % 4 == 0:
            buf[60:80, x - 8:x + 44] = (255, 210, 120, 255)
    # feixe de consulta
    beam = 200 + int(40 * np.sin(i / 3))
    buf[80:300, beam:beam + 10] = (255, 220, 140, 180)
    floor(buf, 336, np.array([48, 32, 64]), np.array([68, 46, 88]), np.array([180, 150, 90]))
    return buf

def main():
    os.makedirs(os.path.join(ROOT, 'assets/stages'), exist_ok=True)
    build('11-oficina-latas', oficina)
    build('12-terminal-fosforo', terminal)
    build('13-metro-pacotes', metro)
    build('14-catedral-sql', sql)

if __name__ == '__main__':
    main()
