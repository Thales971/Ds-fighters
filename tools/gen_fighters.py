#!/usr/bin/env python3
"""Sprites arcade dos lutadores novos e do ET 1155, mais folhas de efeito.
Roda: python3 tools/gen_fighters.py
"""
import os
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FW, FH, BASE = 320, 260, 246
POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']
FRAMES = {'idle': 4, 'walk': 4, 'jump': 2, 'crouch': 2, 'punch': 4, 'kick': 4, 'cpunch': 2, 'ckick': 3, 'jpunch': 3, 'jkick': 3, 'special': 2, 'hit': 2, 'block': 2, 'ko': 2, 'win': 2}

def clamp(v):
    return 0 if v < 0 else 255 if v > 255 else int(v)

def sh(c, f):
    return (clamp(c[0] * f), clamp(c[1] * f), clamp(c[2] * f), 255)

class Pix:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.d = np.zeros((h, w, 4), np.uint8)

    def set(self, x, y, col):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and col is not None:
            self.d[y, x] = col

    def disk(self, cx, cy, rx, ry, col, light=True):
        if rx <= 0 or ry <= 0:
            return
        x0, x1 = int(cx - rx - 1), int(cx + rx + 2)
        y0, y1 = int(cy - ry - 1), int(cy + ry + 2)
        for y in range(y0, y1):
            for x in range(x0, x1):
                nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if nx * nx + ny * ny > 1:
                    continue
                f = 1
                if light:
                    f = 1.18 if (-nx * 0.7 - ny * 0.7) > 0.25 else (0.72 if (-nx * 0.6 - ny * 0.6) < -0.35 else 1)
                self.set(x, y, sh(col, f) if light else (*col, 255))

    def capsule(self, x1, y1, x2, y2, r, col):
        dx, dy = x2 - x1, y2 - y1
        n = max(1, int(max(abs(dx), abs(dy))))
        for i in range(n + 1):
            t = i / n
            self.disk(x1 + dx * t, y1 + dy * t, r, r * 0.92, col)

    def rect(self, x, y, w, h, col):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.set(xx, yy, (*col, 255))

    def outline(self):
        a = self.d[:, :, 3] > 20
        h, w = a.shape
        pad = np.pad(a, 1)
        edge = np.zeros_like(a)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                edge |= pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
        mark = edge & ~a
        self.d[mark] = (8, 6, 14, 255)

def pose_for(name, frame):
    f = frame
    p = dict(y=0, squat=0, lean=0, hx=0, bob=0, armF=(22, 4), armB=(-20, 8),
             footF=(14, 0), footB=(-16, 0), air=False, eye='open', tool=None, hurt=0, win=0)
    if name == 'idle':
        p['bob'] = [0, -1, 0, -2][f % 4]
        p['armF'] = (16, 6 + (f % 2))
        p['armB'] = (-14, 8)
    elif name == 'walk':
        step = [0, 1, 2, 1][f % 4]
        p['bob'] = -step
        p['footF'] = (14 if step else 4, -8 if step == 2 else 0)
        p['footB'] = (-16 if step == 2 else -6, 0)
        p['armF'] = (20 if step else 8, -6 if step == 2 else 8)
        p['armB'] = (-8 if step else -18, 4)
        p['lean'] = 3
    elif name == 'jump':
        p['air'] = True
        p['y'] = -28 if f == 0 else -8
        p['footF'] = (16, 18)
        p['footB'] = (-14, 16)
        p['armF'] = (22, -16)
        p['armB'] = (-18, -12)
    elif name == 'crouch':
        p['squat'] = 28
        p['armF'] = (20, 16)
        p['armB'] = (-10, 14)
    elif name == 'punch':
        ext = [10, 34, 64, 22][f % 4]
        p['lean'] = 8 if f == 2 else 3
        p['armF'] = (ext, -8 if f else 4)
        p['armB'] = (-18, 6)
        p['tool'] = 'driver' if f in (1, 2) else None
    elif name == 'kick':
        ext = [10, 36, 78, 28][f % 4]
        lift = [0, -28, -62, -16][f % 4]
        p['lean'] = -8
        p['footF'] = (ext, lift)
        p['footB'] = (-14, 0)
        p['armF'] = (-6, -18)
        p['armB'] = (-22, -8)
    elif name == 'cpunch':
        p['squat'] = 30
        p['armF'] = (36 if f else 16, 20)
        p['tool'] = 'driver' if f else None
    elif name == 'ckick':
        p['squat'] = 22
        p['footF'] = (28 + f * 14, 8)
        p['armF'] = (12, 4)
    elif name == 'jpunch':
        p['air'] = True
        p['y'] = -22
        p['armF'] = (16 + f * 14, -6)
        p['footF'] = (12, 14)
        p['footB'] = (-10, 12)
    elif name == 'jkick':
        p['air'] = True
        p['y'] = -18
        p['footF'] = (16 + f * 16, -8)
        p['armF'] = (8, -14)
        p['armB'] = (-14, -8)
    elif name == 'special':
        p['lean'] = 4
        p['armF'] = (28, -20)
        p['tool'] = 'chip' if f == 0 else 'tower'
        p['eye'] = 'wide'
    elif name == 'hit':
        p['lean'] = -10
        p['hurt'] = 1
        p['eye'] = 'shut'
        p['armF'] = (6, 4)
        p['armB'] = (-6, 2)
    elif name == 'block':
        p['lean'] = -6
        p['armF'] = (8, -14)
        p['armB'] = (4, -8)
    elif name == 'ko':
        p['y'] = 18 if f else 4
        p['squat'] = 70
        p['hurt'] = 1
        p['eye'] = 'shut'
        p['footF'] = (36, 6)
        p['footB'] = (-20, 4)
        p['armF'] = (30, 20)
        p['armB'] = (-24, 16)
    elif name == 'win':
        p['bob'] = -4 if f else 0
        p['armF'] = (8, -36)
        p['armB'] = (-8, -10)
        p['tool'] = 'tower'
        p['eye'] = 'wide'
        p['win'] = 1
    return p

def draw_fighter(spec, pose):
    pix = Pix(FW, FH)
    skin, hair, shirt, pants, shoe, accent = (spec[k] for k in ('skin', 'hair', 'shirt', 'pants', 'shoe', 'accent'))
    pant2 = spec.get('pants2', pants)
    squat = pose['squat']
    y = BASE + pose['y'] + pose['bob']
    hip_y = y - 86 + squat * 0.72
    hip_x = 160 + pose['lean']
    sh_y = hip_y - 52 + squat * 0.15
    sh_x = hip_x + pose['lean'] * 0.4
    hx = sh_x + pose['hx']
    hy = sh_y - 28
    # perna de trás
    fx, fy = pose['footB']
    pix.capsule(hip_x - 10, hip_y, hip_x - 10 + fx, y - 10 + fy * 0.15, 9, pants)
    pix.disk(hip_x - 10 + fx, y - 6 + fy * 0.1, 14, 6, shoe)
    # braço de trás
    ax, ay = pose['armB']
    pix.capsule(sh_x - 14, sh_y, sh_x - 14 + ax, sh_y + 30 + ay, 7, shirt)
    pix.disk(sh_x - 14 + ax, sh_y + 30 + ay, 6, 6, skin)
    # torso
    pix.disk(hip_x, (sh_y + hip_y) / 2, 26, 32 - squat * 0.12, shirt)
    if spec.get('coat'):
        pix.capsule(hip_x - 16, sh_y + 4, hip_x - 22, hip_y + 8, 6, spec['coat'])
        pix.capsule(hip_x + 16, sh_y + 4, hip_x + 22, hip_y + 10, 6, spec['coat'])
        pix.rect(hip_x - 8, sh_y + 8, 4, 28, spec.get('lining', accent))
    # circuito no peito
    if spec.get('circuit'):
        pix.rect(hip_x - 8, sh_y + 6, 18, 2, accent)
        pix.rect(hip_x - 2, sh_y + 6, 2, 16, accent)
        pix.rect(hip_x + 4, sh_y + 14, 10, 2, accent)
    if spec.get('badge'):
        pix.disk(hip_x + 2, sh_y + 14, 9, 7, (186, 198, 210))
        pix.rect(hip_x - 2, sh_y + 12, 8, 2, (40, 70, 90))
    # perna da frente
    fx, fy = pose['footF']
    knee_x = hip_x + 6 + fx * 0.45
    knee_y = hip_y + 28 - max(0, -fy) * 0.35
    pix.capsule(hip_x + 8, hip_y, knee_x, knee_y, 10, pants)
    pix.capsule(knee_x, knee_y, hip_x + 8 + fx, y - 8 + min(0, fy) * 0.2, 8, pant2)
    pix.disk(hip_x + 8 + fx, y - 6, 15, 6, shoe)
    # braço da frente
    ax, ay = pose['armF']
    hand = (sh_x + 8 + ax, sh_y + 18 + ay)
    pix.capsule(sh_x + 12, sh_y + 2, hand[0], hand[1], 8, shirt)
    pix.disk(*hand, 7, 7, skin)
    tool = pose.get('tool')
    if tool == 'driver' or spec.get('always_driver') and pose['win'] == 0 and tool != 'chip':
        pix.capsule(hand[0], hand[1], hand[0] + 26, hand[1] - 4, 2.2, (210, 214, 220))
        pix.disk(hand[0] + 28, hand[1] - 5, 3.5, 3.5, (40, 40, 46))
    if tool == 'chip':
        pix.rect(hand[0] + 4, hand[1] - 16, 18, 14, (170, 186, 198))
        pix.rect(hand[0] + 6, hand[1] - 12, 14, 2, accent)
        for i in range(4):
            pix.rect(hand[0] + 6 + i * 4, hand[1] - 2, 2, 4, (176, 112, 64))
    if tool == 'tower':
        pix.rect(hip_x + 28, hip_y - 10, 22, 36, (214, 206, 186))
        pix.rect(hip_x + 32, hip_y - 4, 14, 8, (20, 24, 32))
        pix.rect(hip_x + 46, hip_y + 6, 3, 10, accent)
    # cabeça
    pix.disk(hx, hy, spec.get('head', 26), spec.get('heady', 28), skin)
    if spec.get('alien'):
        pix.disk(hx - 8, hy + 1, 8, 10, (12, 16, 22))
        pix.disk(hx + 9, hy + 1, 8, 10, (12, 16, 22))
        pix.disk(hx - 6, hy - 1, 2.2, 3, (180, 255, 230))
        pix.disk(hx + 11, hy - 1, 2.2, 3, (180, 255, 230))
        pix.capsule(hx - 6, hy - 20, hx - 14, hy - 38, 2.2, skin)
        pix.capsule(hx + 8, hy - 20, hx + 16, hy - 40, 2.2, skin)
        pix.disk(hx - 14, hy - 40, 3, 3, accent)
        pix.disk(hx + 16, hy - 42, 3, 3, accent)
    else:
        if pose['eye'] == 'shut':
            pix.rect(hx - 12, hy, 8, 2, (30, 20, 16))
            pix.rect(hx + 4, hy, 8, 2, (30, 20, 16))
        else:
            pix.disk(hx - 7, hy, 3.2, 3.4, (20, 16, 16))
            pix.disk(hx + 8, hy, 3.2, 3.4, (20, 16, 16))
            pix.disk(hx - 6, hy - 1, 1.2, 1.2, (255, 255, 255))
            pix.disk(hx + 9, hy - 1, 1.2, 1.2, (255, 255, 255))
        if spec.get('visor') and not spec.get('hood'):
            pix.capsule(hx - 16, hy - 2, hx + 16, hy - 2, 3.2, accent)
        # cabelo
        hs = spec.get('hair_style', 'short')
        if hs == 'short':
            pix.disk(hx, hy - 10, 22, 14, hair)
        elif hs == 'long':
            pix.disk(hx, hy - 12, 23, 16, hair)
            pix.capsule(hx - 16, hy, hx - 20, hy + 46, 6, hair)
            pix.capsule(hx + 16, hy, hx + 22, hy + 52, 7, spec.get('streak', hair))
        elif hs == 'braid':
            pix.disk(hx, hy - 12, 22, 14, hair)
            pix.capsule(hx + 8, hy + 6, hx + 14, hy + 48, 5, hair)
        elif hs == 'silver':
            pix.disk(hx, hy - 14, 24, 16, hair)
            pix.capsule(hx - 4, hy - 8, hx + 6, hy + 22, 5, hair)
        elif hs == 'cap':
            pix.disk(hx, hy - 8, 22, 12, hair)
            pix.disk(hx, hy - 16, 24, 8, spec.get('cap', accent))
    if spec.get('alien') and spec.get('cap'):
        pix.disk(hx, hy - 18, 20, 7, spec['cap'])
    if spec.get('hood'):
        pix.disk(hx, hy - 8, 30, 26, (6, 10, 8))
        pix.disk(hx, hy + 2, 16, 14, skin)
        pix.capsule(hx - 18, hy, hx + 18, hy + 2, 3, accent)
        pix.disk(hx - 6, hy + 1, 2, 2, (220, 255, 220))
        pix.disk(hx + 7, hy + 1, 2, 2, (220, 255, 220))
        pix.capsule(hx - 22, sh_y, hx - 28, hip_y + 16, 8, (6, 10, 8))
        pix.capsule(hx + 22, sh_y, hx + 30, hip_y + 20, 8, (6, 10, 8))
    if pose['hurt']:
        pix.rect(hx - 4, hy + 10, 8, 2, (90, 30, 30))
    pix.outline()
    return pix.d

SPECS = {
    'stack': dict(skin=(146, 214, 176), hair=(36, 48, 64), shirt=(18, 74, 148), pants=(22, 28, 40),
                  pants2=(22, 28, 40), shoe=(184, 116, 62), accent=(64, 230, 210), alien=True,
                  circuit=True, badge=True, cap=(24, 32, 48), head=23, heady=26),
    'zoya': dict(skin=(236, 206, 186), hair=(92, 28, 36), shirt=(48, 52, 64), pants=(32, 34, 44),
                 shoe=(28, 26, 32), accent=(196, 48, 58), coat=(36, 38, 48), lining=(168, 36, 48),
                 hair_style='braid', head=20, heady=23),
    'daon': dict(skin=(228, 186, 156), hair=(18, 16, 22), streak=(40, 220, 230), shirt=(24, 26, 36),
                 pants=(30, 32, 48), shoe=(230, 230, 236), accent=(40, 220, 230), visor=True,
                 hair_style='long', head=20, heady=22),
    'noir': dict(skin=(214, 176, 150), hair=(198, 206, 214), shirt=(28, 30, 40), pants=(18, 18, 26),
                 shoe=(16, 16, 20), accent=(150, 170, 255), coat=(22, 24, 34), lining=(90, 80, 140),
                 hair_style='silver', head=24, heady=28),
    'hacker': dict(skin=(168, 136, 112), hair=(12, 14, 16), shirt=(16, 22, 18), pants=(14, 16, 20),
                   shoe=(10, 12, 14), accent=(40, 255, 90), coat=(8, 12, 10), lining=(0, 180, 70),
                   hair_style='short', hood=True, visor=True, head=24, heady=26),
}

def sheet_for(fid):
    spec = SPECS[fid]
    cols = 4
    rows = len(POSES)
    canvas = np.zeros((rows * FH, cols * FW, 4), np.uint8)
    for r, name in enumerate(POSES):
        n = FRAMES[name]
        for c in range(n):
            cell = draw_fighter(spec, pose_for(name, c))
            canvas[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = cell
    im = Image.fromarray(canvas, 'RGBA')
    im.save(os.path.join(ROOT, 'assets/sprites', fid + '.png'), optimize=True)
    # rosto e retrato a partir do idle
    idle = canvas[0:FH, 0:FW]
    a = idle[:, :, 3] > 20
    ys, xs = np.where(a)
    if len(ys):
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), min(ys.min() + 78, ys.max())
        face = idle[y0:y1, x0:x1]
        Image.fromarray(face, 'RGBA').resize((168, 168), Image.NEAREST).save(
            os.path.join(ROOT, 'assets/ui', f'face-{fid}.png'))
        Image.fromarray(face, 'RGBA').resize((96, 96), Image.NEAREST).save(
            os.path.join(ROOT, 'assets/ui', f'portrait-{fid}.png'))
    print('sprite', fid, im.size)

def ability_sheet(fid, rows_draw):
    """rows_draw: list of 5 callables (pix, frame)."""
    S = 128
    canvas = np.zeros((5 * S, 4 * S, 4), np.uint8)
    for r, fn in enumerate(rows_draw):
        for c in range(4):
            p = Pix(S, S)
            fn(p, c)
            p.outline()
            canvas[r * S:(r + 1) * S, c * S:(c + 1) * S] = p.d
    Image.fromarray(canvas, 'RGBA').save(os.path.join(ROOT, 'assets/abilities', fid + '.png'), optimize=True)
    print('ability', fid)

def fx_sheet(name, painter):
    FW96, COLS, ROWS = 96, 8, 5
    canvas = np.zeros((ROWS * FW96, COLS * FW96, 4), np.uint8)
    for r in range(ROWS):
        for c in range(COLS):
            p = Pix(FW96, FW96)
            painter(p, r, c)
            canvas[r * FW96:(r + 1) * FW96, c * FW96:(c + 1) * FW96] = p.d
    Image.fromarray(canvas, 'RGBA').save(os.path.join(ROOT, 'assets/fx', name + '.png'), optimize=True)
    print('fx', name)

def chip(p, f, cx=64, cy=70):
    wob = f * 2
    p.rect(cx - 16, cy - 12 + wob, 32, 24, (176, 190, 204))
    p.rect(cx - 10, cy - 4 + wob, 20, 4, (40, 160, 170))
    for i in range(5):
        p.rect(cx - 14 + i * 6, cy + 12 + wob, 3, 6, (180, 120, 70))
        p.rect(cx - 14 + i * 6, cy - 18 + wob, 3, 6, (180, 120, 70))

def portal_painter(p, r, c):
    col = (20, 8, 32) if r < 2 else (8, 4, 16)
    mid = (90, 40, 160)
    core = (180, 140, 255)
    grow = 8 + (c % 8) * 3
    p.disk(48, 70, grow, max(4, grow * 0.35), col, light=False)
    p.disk(48, 68, grow * 0.72, max(3, grow * 0.22), mid, light=False)
    if c % 2 == 0:
        p.disk(48, 66, 6, 3, core, light=False)
    for i in range(6):
        p.disk(20 + ((c * 13 + i * 11) % 56), 30 + (i * 9 + c * 5) % 40, 2, 3, (40, 20, 60), light=False)

def rastro_painter(p, r, c):
    a = 180 - c * 12
    p.disk(48, 56, 16 - c, 28 - c, (0, 220, 230) if r % 2 == 0 else (20, 20, 40), light=False)
    p.disk(48, 40, 8, 10, (200, 255, 255), light=False)

def lata_painter(p, r, c):
    if r == 0:
        chip(p, c, 48, 48)
    elif r == 1:
        p.capsule(20, 60, 70, 30 - c * 4, 3, (220, 224, 230))
        p.disk(74, 26 - c * 4, 5, 5, (50, 50, 58))
    elif r == 2:
        p.disk(48, 48, 20 + c, 20 + c, (255, 120, 40), light=False)
        p.disk(48, 48, 10, 10, (255, 220, 120), light=False)
    elif r == 3:
        p.disk(48, 70, 28, 8, (40, 180, 90), light=False)
        p.disk(40 + c * 2, 66, 6, 4, (180, 255, 140), light=False)
    else:
        p.rect(30, 28, 36, 44, (220, 210, 186))
        p.rect(36, 36, 16, 10, (20, 24, 32))
        p.disk(48, 20, 8 + c * 2, 6, (255, 180, 60), light=False)

def et_rows():
    def r0(p, f):
        chip(p, f)
    def r1(p, f):
        p.capsule(24, 80, 40 + f * 16, 40, 4, (220, 224, 230))
        p.disk(46 + f * 16, 36, 6, 6, (40, 44, 52))
        p.disk(70, 78, 10, 4, (255, 140, 60), light=False)
    def r2(p, f):
        p.disk(64, 64, 28 + f * 4, 28 + f * 4, (255, 90, 30), light=False)
        p.disk(64, 64, 12, 12, (255, 230, 140), light=False)
    def r3(p, f):
        p.disk(64, 90, 40, 12, (30, 160, 80), light=False)
        p.disk(40 + f * 8, 84, 8, 5, (160, 255, 140), light=False)
    def r4(p, f):
        p.rect(40, 36, 48, 58, (214, 206, 184))
        p.rect(50, 48, 22, 14, (16, 20, 28))
        p.disk(64, 24, 16 + f * 6, 10, (80, 220, 255), light=False)
        chip(p, f, 64, 100)
    return [r0, r1, r2, r3, r4]

def zoya_rows():
    def shot(p, f):
        p.disk(40 + f * 8, 64, 16, 10, (120, 40, 160))
        p.rect(30 + f * 8, 58, 18, 4, (255, 220, 120))
    def lag(p, f):
        p.disk(64, 64, 26, 26, (40, 20, 70), light=False)
        p.capsule(64, 64, 64 + 16, 40 + f * 4, 3, (255, 80, 100))
    def wall(p, f):
        p.rect(28, 20, 18, 90, (90, 40, 120))
        p.rect(78, 20, 18, 90, (90, 40, 120))
    def pull(p, f):
        p.capsule(20, 64, 100 - f * 8, 64, 3, (200, 80, 220))
    def ult(p, f):
        for i in range(5):
            p.disk(20 + i * 18, 30 + (i + f) % 3 * 16, 8, 6, (180, 60, 220))
    return [shot, lag, wall, pull, ult]

def daon_rows():
    def slash(p, f):
        p.capsule(20, 90, 40 + f * 18, 30, 4, (40, 230, 240))
    def rain(p, f):
        for i in range(6):
            p.disk(16 + i * 16, 20 + (i * 9 + f * 8) % 80, 5, 7, (80, 240, 255))
    def aura(p, f):
        p.disk(64, 64, 20 + f * 6, 30, (20, 40, 80), light=False)
        p.disk(64, 64, 8, 12, (180, 255, 255))
    def shield(p, f):
        p.disk(64, 64, 28, 34, (40, 200, 220), light=False)
        p.disk(64, 64, 16, 20, (10, 20, 40), light=False)
    def ult(p, f):
        p.rect(10, 20 + f * 4, 108, 8, (40, 220, 230))
        p.rect(10, 50, 108, 8, (255, 80, 180))
        p.rect(10, 80 - f * 2, 108, 8, (180, 120, 255))
    return [slash, rain, aura, shield, ult]

def hacker_rows():
    def stealth(p, f):
        p.disk(64, 64, 26, 36, (8, 20, 12), light=False)
        p.disk(64, 48, 10, 8, (40, 255, 120), light=False)
        p.capsule(40, 80, 88, 70 - f * 4, 2, (0, 200, 80))
    def door(p, f):
        p.disk(64, 78, 22 + f * 3, 10, (0, 40, 20), light=False)
        p.disk(64, 70, 8, 14, (40, 255, 100), light=False)
    def mal(p, f):
        p.disk(40 + f * 8, 64, 14, 10, (20, 80, 30))
        p.disk(48 + f * 8, 60, 4, 4, (180, 255, 80))
        p.rect(30 + f * 6, 78, 28, 3, (0, 255, 70))
    def priv(p, f):
        p.disk(64, 64, 20 + f * 4, 24, (0, 90, 40), light=False)
        p.rect(60, 30, 8, 28, (80, 255, 120))
    def panic(p, f):
        p.rect(8, 16, 112, 96, (10, 30, 140))
        p.rect(16, 28, 40, 6, (220, 240, 255))
        p.disk(40, 70, 8, 8, (255, 255, 255), light=False)
        p.rect(20 + f * 10, 48, 70, 4, (0, 255, 120))
    return [stealth, door, mal, priv, panic]

def noir_rows():
    def shot(p, f):
        p.disk(36 + f * 10, 64, 12, 12, (40, 40, 70))
        p.disk(36 + f * 10, 64, 5, 5, (190, 200, 255))
    def dash(p, f):
        p.capsule(16, 70, 50 + f * 16, 50, 4, (160, 170, 255))
    def aura(p, f):
        p.disk(64, 64, 24 + f * 3, 24 + f * 3, (80, 70, 160), light=False)
    def zone(p, f):
        p.disk(64, 80, 36, 10, (20, 16, 40), light=False)
        p.disk(50 + f * 4, 76, 4, 4, (180, 180, 255), light=False)
    def ult(p, f):
        p.disk(64, 64, 16 + f * 8, 16 + f * 8, (8, 6, 20), light=False)
        p.disk(64, 64, 6, 6, (220, 220, 255))
    return [shot, dash, aura, zone, ult]

def fix_double_bodies():
    """Remove o corpo extra (mais baixo) quando dois lutadores cabem no mesmo quadro."""
    targets = ['backend', 'bughunter']
    for fid in targets:
        path = os.path.join(ROOT, 'assets/sprites', fid + '.png')
        im = Image.open(path).convert('RGBA')
        arr = np.array(im)
        changed = 0
        for r in range(15):
            for c in range(4):
                cell = arr[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW]
                a = cell[:, :, 3] > 40
                col = a.sum(axis=0)
                segs, s = [], None
                for x, v in enumerate(col):
                    on = v > 12
                    if on and s is None:
                        s = x
                    if (not on or x == FW - 1) and s is not None:
                        e = x if not on else FW
                        if e - s > 36:
                            sl = a[:, s:e]
                            rows = np.where(sl.any(axis=1))[0]
                            if len(rows) > 80:
                                segs.append((s, e, int(rows[0]), int(rows[-1])))
                        s = None
                if len(segs) < 2:
                    continue
                segs.sort(key=lambda g: g[3] - g[2])
                # apaga o mais baixo (sobra do empacotamento)
                s0, e0, _, _ = segs[0]
                cell[:, s0:e0, 3] = 0
                cell[:, s0:e0, :3] = 0
                changed += 1
        Image.fromarray(arr, 'RGBA').save(path, optimize=True)
        print('fixed doubles', fid, changed)

def kernel_painter(p, r, c):
    p.rect(4, 8, 88, 80, (12, 28, 120))
    p.rect(12, 18, 40, 5, (230, 240, 255))
    p.rect(8 + (c * 7) % 40, 36 + r * 4, 50, 4, (0, 255, 110))
    p.disk(30, 62, 6, 6, (255, 255, 255), light=False)

def main():
    os.makedirs(os.path.join(ROOT, 'assets/sprites'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets/fx'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets/abilities'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets/ui'), exist_ok=True)
    for fid in SPECS:
        sheet_for(fid)
    ability_sheet('stack', et_rows())
    ability_sheet('zoya', zoya_rows())
    ability_sheet('daon', daon_rows())
    ability_sheet('noir', noir_rows())
    ability_sheet('hacker', hacker_rows())
    fx_sheet('portal', portal_painter)
    fx_sheet('rastro', rastro_painter)
    fx_sheet('lata', lata_painter)
    fx_sheet('kernel', kernel_painter)
    fx_sheet('hack', kernel_painter)
    fix_double_bodies()
    print('ok')

if __name__ == '__main__':
    main()
