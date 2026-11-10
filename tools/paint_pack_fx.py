#!/usr/bin/env python3
"""Ícones e projéteis em pixel art (128px) para Lia, Nexo e Maximilian."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
S = 64

def blank():
    return np.zeros((S, S, 4), np.uint8)

def put(a, x, y, c):
    if 0 <= x < S and 0 <= y < S:
        a[y, x] = c

def rect(a, x, y, w, h, c):
    a[max(0, y):min(S, y + h), max(0, x):min(S, x + w)] = c

def outline(a):
    rgb = a[..., 3] > 0
    edge = np.zeros_like(rgb)
    edge[1:] |= rgb[:-1]
    edge[:-1] |= rgb[1:]
    edge[:, 1:] |= rgb[:, :-1]
    edge[:, :-1] |= rgb[:, 1:]
    ring = edge & ~rgb
    a[ring] = (8, 6, 16, 255)

def glow(a, cx, cy, rad, c, step=2):
    col = (*c, 230)
    for i in range(8):
        ang = i * 0.785 + step
        x = int(cx + rad * np.cos(ang))
        y = int(cy + rad * np.sin(ang))
        put(a, x, y, col)
        put(a, x + 1, y, col)

def disc(a, cx, cy, r, c, hole=0):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if hole * hole < d <= r * r:
                put(a, x, y, c)

def up(a):
    im = Image.fromarray(a, 'RGBA')
    return im.resize((128, 128), Image.Resampling.NEAREST)

def sheet(rows):
    out = Image.new('RGBA', (512, 640), (0, 0, 0, 0))
    for r, fn in enumerate(rows):
        for c in range(4):
            cell = fn(c)
            outline(cell)
            out.paste(up(cell), (c * 128, r * 128), up(cell))
    return out

GOLD = (255, 196, 48, 255)
RED = (176, 32, 40, 255)
BLACK = (18, 14, 22, 255)
WHITE = (255, 248, 230, 255)
ORANGE = (255, 120, 32, 255)
CYAN = (80, 255, 210, 255)
TEAL = (20, 90, 80, 255)
WOOD = (168, 104, 48, 255)
WOOD2 = (112, 64, 28, 255)
TAPE = (230, 196, 72, 255)
ICE = (186, 236, 255, 255)
BURG = (120, 32, 56, 255)

def lia_board(f):
    a = blank()
    glow(a, 32, 32, 18, (255, 180, 40))
    rot = f % 4
    if rot in (0, 2):
        rect(a, 10, 28, 44, 8, GOLD)
        rect(a, 12, 26, 40, 3, WHITE)
        rect(a, 14, 36, 8, 8, RED)
        rect(a, 42, 36, 8, 8, RED)
        rect(a, 16, 38, 4, 4, BLACK)
        rect(a, 44, 38, 4, 4, BLACK)
    else:
        rect(a, 28, 10, 8, 44, GOLD)
        rect(a, 26, 12, 3, 40, WHITE)
        rect(a, 18, 14, 8, 8, RED)
        rect(a, 18, 42, 8, 8, RED)
    return a

def lia_dash(f):
    a = blank()
    glow(a, 20 + f * 4, 32, 14, (255, 160, 40))
    for i, col in enumerate((WHITE, GOLD, ORANGE)):
        rect(a, 6 + f * 3, 16 + i * 8, 36 - i * 6, 4, col)
    rect(a, 40, 28, 12, 6, GOLD)
    return a

def lia_spark(f):
    a = blank()
    glow(a, 32, 32, 20, (255, 140, 20))
    rect(a, 8, 40, 48, 4, (90, 90, 100, 255))
    for i, (x, y) in enumerate(((20, 18), (32, 10), (44, 20), (28, 28), (40, 30))):
        col = WHITE if (i + f) % 2 == 0 else ORANGE
        rect(a, x, y + (f % 2), 4, 4, col)
    return a

def lia_flip(f):
    a = blank()
    glow(a, 32, 32, 16, (255, 200, 60))
    angs = (0, 1, 2, 3)
    if angs[f] == 0:
        rect(a, 12, 30, 40, 6, GOLD)
    elif angs[f] == 1:
        rect(a, 29, 12, 6, 40, GOLD)
    elif angs[f] == 2:
        rect(a, 12, 26, 40, 6, GOLD)
    else:
        rect(a, 22, 16, 8, 32, GOLD)
    rect(a, 30, 30, 4, 4, WHITE)
    return a

def lia_rail(f):
    a = blank()
    glow(a, 32, 28, 22, (255, 210, 80))
    rect(a, 4, 46, 56, 5, GOLD)
    rect(a, 8 + f * 8, 16, 10, 28, WHITE)
    rect(a, 10 + f * 8, 12, 6, 8, GOLD)
    return a

def nexo_wave(f):
    a = blank()
    r = 8 + f * 4
    glow(a, 32, 32, r, (40, 255, 200))
    disc(a, 32, 32, r, CYAN, hole=r - 3)
    disc(a, 32, 32, 4, WHITE)
    rect(a, 30, 8, 4, 10, CYAN)
    return a

def nexo_crate(f):
    a = blank()
    glow(a, 32, 34, 18, (180, 120, 40))
    ox = (0, 3, 0, -3)[f]
    # side
    rect(a, 14 + ox, 18, 10, 22, WOOD2)
    # front
    rect(a, 22 + ox, 16, 26, 26, WOOD)
    rect(a, 22 + ox, 26, 26, 4, TAPE)
    rect(a, 32 + ox, 16, 4, 26, TAPE)
    rect(a, 24 + ox, 18, 3, 3, BLACK)
    rect(a, 42 + ox, 36, 3, 3, BLACK)
    # top
    rect(a, 18 + ox, 10, 26, 8, (196, 140, 70, 255))
    return a

def nexo_shield(f):
    a = blank()
    glow(a, 32, 30, 18, (80, 220, 255))
    for y, half in ((12, 10), (18, 16), (28, 16), (38, 12), (46, 6)):
        rect(a, 32 - half, y, half * 2, 6, (40, 90, 120, 255) if f % 2 else (20, 50, 80, 255))
        rect(a, 32 - half, y, 3, 6, CYAN)
        rect(a, 32 + half - 3, y, 3, 6, CYAN)
    rect(a, 30, 22, 4, 12, CYAN if f % 2 == 0 else WHITE)
    return a

def nexo_hand(f):
    a = blank()
    glow(a, 32, 32, 16, (80, 255, 200))
    rect(a, 6, 28, 18, 6, CYAN)
    rect(a, 40, 28, 18, 6, CYAN)
    rect(a, 24 + f, 24, 12, 12, WHITE)
    rect(a, 28, 28, 8, 4, CYAN)
    return a

def nexo_blast(f):
    a = blank()
    glow(a, 32, 32, 22, (40, 200, 255))
    rect(a, 28, 6, 8, 52, CYAN)
    rect(a, 6, 28, 52, 8, CYAN)
    rect(a, 16, 16, 8, 8, WHITE)
    rect(a, 40, 16, 8, 8, WHITE)
    rect(a, 16, 40, 8, 8, (40, 140, 255, 255))
    rect(a, 40, 40, 8, 8, (40, 140, 255, 255))
    if f % 2:
        rect(a, 30, 20, 4, 24, WHITE)
    return a

def max_clock(f):
    a = blank()
    glow(a, 32, 32, 20, (255, 190, 60))
    disc(a, 32, 32, 18, GOLD, hole=15)
    disc(a, 32, 32, 14, (255, 244, 220, 255))
    disc(a, 32, 32, 3, BURG)
    hands = [(32, 14, 2, 16), (32, 30, 14, 3), (32, 32, 2, 14), (18, 30, 14, 3)]
    x, y, w, h = hands[f]
    rect(a, x, y, w, h, BURG)
    for ang in ((32, 16), (46, 32), (32, 46), (16, 32)):
        rect(a, ang[0], ang[1], 3, 3, GOLD)
    return a

def max_gear(f):
    a = blank()
    glow(a, 32, 32, 18, (220, 160, 40))
    disc(a, 32, 32, 12, GOLD, hole=6)
    disc(a, 32, 32, 4, (40, 24, 16, 255))
    teeth = ((28, 8), (48, 28), (28, 48), (8, 28))
    for i in range(4):
        x, y = teeth[(i + f) % 4]
        rect(a, x, y, 8, 8, GOLD)
    return a

def max_portal(f):
    a = blank()
    c = CYAN if f % 2 == 0 else GOLD
    glow(a, 32, 32, 20, c[:3])
    disc(a, 32, 32, 18, c, hole=12)
    disc(a, 32, 32, 8, (20, 16, 40, 255))
    rect(a, 30, 8, 4, 6, WHITE)
    return a

def max_shard(f):
    a = blank()
    glow(a, 32, 32, 18, (160, 220, 255))
    bits = ((12, 10), (40, 12), (8, 36), (44, 40), (28, 24), (20, 44))
    for i, (x, y) in enumerate(bits):
        dx = f if i % 2 == 0 else -f
        rect(a, x + dx, y, 6, 10, ICE)
        rect(a, x + dx + 2, y + 2, 2, 4, WHITE)
    return a

def max_star(f):
    a = blank()
    glow(a, 32, 32, 22, (255, 220, 120))
    rect(a, 28, 4, 8, 56, GOLD)
    rect(a, 4, 28, 56, 8, GOLD)
    rect(a, 16, 16, 8, 8, WHITE)
    rect(a, 40, 16, 8, 8, WHITE)
    rect(a, 16, 40, 8, 8, WHITE)
    rect(a, 40, 40, 8, 8, WHITE)
    if f % 2 == 0:
        rect(a, 30, 12, 4, 8, WHITE)
    return a

def main():
    packs = {
        'lia': [lia_board, lia_dash, lia_spark, lia_flip, lia_rail],
        'nexo': [nexo_wave, nexo_crate, nexo_shield, nexo_hand, nexo_blast],
        'maximilian': [max_clock, max_gear, max_portal, max_shard, max_star],
    }
    for name, rows in packs.items():
        img = sheet(rows)
        img.save(ROOT / 'assets' / 'fx' / f'{name}.png')
        img.save(ROOT / 'assets' / 'abilities' / f'{name}.png')
        print(name, img.size)

if __name__ == '__main__':
    main()
