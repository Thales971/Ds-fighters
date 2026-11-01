#!/usr/bin/env python3
"""Pixel art no mesmo padrão dos lutadores atuais (chibi arcade, contorno preto, cel shading).
Prévia: python3 tools/paint_chibi.py preview
Folhas: python3 tools/paint_chibi.py full
"""
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FW, FH = 320, 260

def C(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def tone(base, light):
    # brilho só no topo, sombra só na borda de baixo — sem faixa diagonal no meio
    if light > 0.78:
        return mix(base, (255, 255, 255), 0.48)
    if light < -0.62:
        return mix(base, (0, 0, 0), 0.38)
    return base

class P:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.d = np.zeros((h, w, 4), np.uint8)

    def put(self, x, y, rgb, a=255):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and a:
            self.d[y, x, 0:3] = rgb
            self.d[y, x, 3] = a

    def ellipse(self, cx, cy, rx, ry, base, shade=True):
        if rx < 0.6 or ry < 0.6:
            return
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                nx = (x + 0.5 - cx) / rx
                ny = (y + 0.5 - cy) / ry
                if nx * nx + ny * ny > 1:
                    continue
                if shade:
                    edge = nx * nx + ny * ny
                    if edge > 0.82 and ny > 0.05:
                        rgb = mix(base, (0, 0, 0), 0.34)
                    elif edge < 0.22 and nx < -0.05 and ny < -0.05:
                        rgb = mix(base, (255, 255, 255), 0.42)
                    else:
                        rgb = base
                    self.put(x, y, rgb)
                else:
                    self.put(x, y, base)

    def capsule(self, x1, y1, x2, y2, r, base):
        dx, dy = x2 - x1, y2 - y1
        steps = max(1, int(max(abs(dx), abs(dy)) * 1.2))
        for i in range(steps + 1):
            t = i / steps
            self.ellipse(x1 + dx * t, y1 + dy * t, r, r * 0.96, base)

    def box(self, x, y, w, h, base, shade=True):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                if shade:
                    L = 0.35 - (yy - y) / max(1, h) * 0.7 + (0.2 if xx - x < w * 0.3 else 0)
                    self.put(xx, yy, tone(base, L - 0.2))
                else:
                    self.put(xx, yy, base)

    def outline(self, thick=1):
        a = self.d[:, :, 3] > 40
        src = a.copy()
        h, w = a.shape
        mark = np.zeros_like(a)
        for _ in range(thick):
            pad = np.pad(src, 1)
            edge = np.zeros_like(src)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == dy == 0:
                        continue
                    edge |= pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
            mark |= edge & ~src
            src = src | edge
        self.d[mark] = (12, 8, 16, 255)

# fonte 3x5
GLYPH = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '5': ['111', '100', '111', '001', '111'],
    'A': ['010', '101', '111', '101', '101'],
    'E': ['111', '100', '110', '100', '111'],
    'T': ['111', '010', '010', '010', '010'],
    'K': ['101', '110', '100', '110', '101'],
}

def text(p, s, x, y, col, sc=2):
    cx = x
    for ch in s:
        g = GLYPH.get(ch)
        if not g:
            cx += 4 * sc
            continue
        for row, line in enumerate(g):
            for col_i, bit in enumerate(line):
                if bit == '1':
                    p.box(cx + col_i * sc, y + row * sc, sc, sc, col, shade=False)
        cx += 4 * sc


def skel(pose):
    bob = pose.get('bob', 0)
    squat = pose.get('squat', 0)
    lean = pose.get('lean', 0)
    foot_y = 244 + pose.get('dy', 0)
    hip = [158 + lean, foot_y - 78 + squat * 0.85 + bob]
    chest = [hip[0] + lean * 0.35, hip[1] - 36 + squat * 0.15]
    head = [chest[0] + pose.get('hx', 0), chest[1] - 40 + pose.get('hy', 0)]
    return hip, chest, head, foot_y


def arm(p, shoulder, spec, pose_arm, color, r=7.2):
    # pose_arm: (ex, ey, hx, hy) relativos ao ombro
    ex, ey, hx, hy = pose_arm
    elbow = (shoulder[0] + ex, shoulder[1] + ey)
    hand = (elbow[0] + hx, elbow[1] + hy)
    p.capsule(shoulder[0], shoulder[1], elbow[0], elbow[1], r, color)
    p.capsule(elbow[0], elbow[1], hand[0], hand[1], r * 0.82, color)
    return hand


def leg(p, hip, foot, pants, shoe, r=8.5):
    # joelho no meio, dobrado para fora
    mx = (hip[0] + foot[0]) / 2 + (8 if foot[0] >= hip[0] else -8)
    my = (hip[1] + foot[1]) / 2 - max(0, hip[1] - foot[1]) * 0.05
    # se o pé sobe, joelho sobe junto
    if foot[1] < hip[1] + 20:
        my = min(foot[1], hip[1]) + 16
        mx = (hip[0] + foot[0]) / 2
    p.capsule(hip[0], hip[1], mx, my, r, pants)
    p.capsule(mx, my, foot[0], foot[1] - 4, r * 0.82, pants)
    p.ellipse(foot[0], foot[1] + 2, 15, 6, mix(shoe, (0, 0, 0), 0.45))
    p.ellipse(foot[0], foot[1] - 1, 13, 6, shoe)
    p.ellipse(foot[0] - 3, foot[1] - 3, 5, 2.4, mix(shoe, (255, 255, 255), 0.4))


def face_human(p, head, spec, expr):
    hx, hy = head
    skin = spec['skin']
    p.ellipse(hx, hy, spec.get('hr', 30), spec.get('hry', 32), skin)
    hair(p, (hx, hy), spec)
    # orelhas
    p.ellipse(hx - 28, hy + 2, 5, 7, skin)
    p.ellipse(hx + 28, hy + 2, 5, 7, skin)
    eye = spec.get('eye', (40, 28, 24))
    if expr == 'shut':
        p.box(hx - 16, hy - 2, 12, 3, mix(skin, (0, 0, 0), 0.45), False)
        p.box(hx + 6, hy - 2, 12, 3, mix(skin, (0, 0, 0), 0.45), False)
    else:
        for sx in (-10, 10):
            p.ellipse(hx + sx, hy - 1, 7, 8, (255, 255, 255), False)
            p.ellipse(hx + sx + 1, hy, 3.4, 4.2, eye, False)
            p.ellipse(hx + sx - 1, hy - 3, 2, 2, (255, 255, 255), False)
        if expr == 'wide':
            p.ellipse(hx - 10, hy - 1, 8, 9, (255, 255, 255), False)
            p.ellipse(hx + 11, hy - 1, 8, 9, (255, 255, 255), False)
    # sobrancelha
    brow = spec.get('brow', mix(spec['hair'], (0, 0, 0), 0.3))
    p.box(hx - 18, hy - 12, 12, 3, brow, False)
    p.box(hx + 6, hy - 12, 12, 3, brow, False)
    # boca
    if expr == 'happy':
        p.box(hx - 5, hy + 12, 10, 3, (160, 70, 70), False)
    elif expr == 'hurt':
        p.ellipse(hx, hy + 14, 5, 4, (90, 30, 30), False)
    else:
        p.box(hx - 4, hy + 13, 9, 2, mix(skin, (0, 0, 0), 0.4), False)
    # blush
    if spec.get('blush', True) and expr != 'hurt':
        p.ellipse(hx - 16, hy + 8, 5, 3, mix(skin, (220, 80, 90), 0.45), False)
        p.ellipse(hx + 16, hy + 8, 5, 3, mix(skin, (220, 80, 90), 0.45), False)


def face_alien(p, head, spec, expr):
    hx, hy = head
    skin = spec['skin']
    p.ellipse(hx, hy, 32, 34, skin)
    # olhos grandes
    if expr == 'shut':
        p.box(hx - 20, hy, 14, 3, (20, 30, 28), False)
        p.box(hx + 6, hy, 14, 3, (20, 30, 28), False)
    else:
        p.ellipse(hx - 12, hy + 1, 11, 13, (16, 20, 28), False)
        p.ellipse(hx + 13, hy + 1, 11, 13, (16, 20, 28), False)
        p.ellipse(hx - 15, hy - 3, 3, 4, (190, 255, 230), False)
        p.ellipse(hx + 10, hy - 3, 3, 4, (190, 255, 230), False)
    p.box(hx - 4, hy + 16, 8, 2, mix(skin, (0, 0, 0), 0.35), False)
    # antenas
    p.capsule(hx - 8, hy - 28, hx - 20, hy - 52, 2.4, skin)
    p.capsule(hx + 10, hy - 28, hx + 22, hy - 54, 2.4, skin)
    p.ellipse(hx - 20, hy - 56, 4.5, 4.5, spec['accent'], False)
    p.ellipse(hx + 22, hy - 58, 4.5, 4.5, spec['accent'], False)


def hair(p, head, spec):
    hx, hy = head
    col = spec['hair']
    style = spec.get('hair_style', 'short')
    if style == 'short':
        p.ellipse(hx, hy - 18, 30, 16, col)
        p.ellipse(hx - 22, hy - 10, 8, 10, col)
        p.ellipse(hx + 22, hy - 10, 8, 10, col)
    elif style == 'long':
        p.ellipse(hx, hy - 20, 32, 16, col)
        p.capsule(hx - 26, hy + 6, hx - 30, hy + 64, 7, col)
        p.capsule(hx + 24, hy + 8, hx + 32, hy + 72, 8, spec.get('streak', col))
    elif style == 'braid':
        p.ellipse(hx, hy - 18, 30, 16, col)
        p.capsule(hx + 18, hy + 10, hx + 22, hy + 68, 5.5, col)
        p.ellipse(hx + 22, hy + 72, 5, 5, spec.get('tie', spec['accent']))
    elif style == 'silver':
        p.ellipse(hx, hy - 20, 32, 16, col)
        p.ellipse(hx - 16, hy - 8, 10, 8, col)
        p.ellipse(hx + 18, hy - 6, 9, 8, col)
    elif style == 'curly':
        p.ellipse(hx, hy - 20, 34, 16, col)
        for dx, dy in ((-26, -12), (26, -12), (-20, -2), (22, -2), (0, -26)):
            p.ellipse(hx + dx, hy + dy, 9, 9, col)


def paint(spec, pose):
    p = P(FW, FH)
    hip, chest, head, foot_y = skel(pose)
    pants, shoe, shirt = spec['pants'], spec['shoe'], spec['shirt']
    # perna de trás
    fx, fy = pose['legB']
    leg(p, (hip[0] - 10, hip[1]), (hip[0] - 10 + fx, foot_y + fy), pants, shoe, 9)
    # braço de trás
    arm(p, (chest[0] - 16, chest[1] - 4), spec, pose['armB'], spec.get('sleeve', shirt), 7)
    # casaco atrás
    if spec.get('coat'):
        p.capsule(chest[0] - 18, chest[1], chest[0] - 26, hip[1] + 18, 8, spec['coat'])
        p.capsule(chest[0] + 18, chest[1], chest[0] + 28, hip[1] + 22, 8, spec['coat'])
    # torso em bloco (camiseta), não uma bola
    torso_col = spec.get('coat', shirt)
    p.ellipse(chest[0], chest[1] + 18, 26, 30, torso_col)
    p.box(chest[0] - 22, chest[1] + 8, 44, 36, torso_col)
    p.ellipse(chest[0], hip[1] - 4, 24, 10, spec.get('pants', pants))
    if spec.get('coat'):
        p.box(chest[0] - 6, chest[1] + 4, 5, 34, spec.get('lining', spec['accent']), False)
    if spec.get('circuit'):
        p.box(chest[0] - 10, chest[1] + 6, 22, 3, spec['accent'], False)
        p.box(chest[0] - 2, chest[1] + 6, 3, 18, spec['accent'], False)
    if spec.get('badge'):
        p.ellipse(chest[0] + 2, chest[1] + 16, 13, 10, (198, 206, 214))
        text(p, '1155', chest[0] - 12, chest[1] + 12, (30, 50, 70), 1)
    if spec.get('logo_dragon'):
        p.ellipse(chest[0] + 2, chest[1] + 14, 10, 12, (40, 140, 255), False)
        p.box(chest[0] - 2, chest[1] + 8, 3, 16, (180, 240, 255), False)
    if spec.get('sleeve_text'):
        p.box(chest[0] - 24, chest[1] + 8, 4, 18, spec['accent'], False)
    # perna da frente
    fx, fy = pose['legF']
    leg(p, (hip[0] + 8, hip[1]), (hip[0] + 8 + fx, foot_y + fy), pants, shoe, 9.5)
    expr = pose.get('face', 'idle')
    if spec.get('alien'):
        face_alien(p, head, spec, expr)
    else:
        face_human(p, head, spec, expr)
        if spec.get('beard'):
            p.ellipse(head[0], head[1] + 18, 12, 8, spec['beard'])
        if spec.get('glasses'):
            p.ellipse(head[0] - 10, head[1] - 1, 10, 8, (20, 20, 24), False)
            p.ellipse(head[0] + 11, head[1] - 1, 10, 8, (20, 20, 24), False)
            p.ellipse(head[0] - 10, head[1] - 1, 6, 5, (255, 255, 255), False)
            p.ellipse(head[0] + 11, head[1] - 1, 6, 5, (255, 255, 255), False)
            p.box(head[0] - 1, head[1] - 2, 4, 2, (20, 20, 24), False)
        if spec.get('phones'):
            p.capsule(head[0] - 26, head[1] - 18, head[0] + 26, head[1] - 18, 3, (20, 22, 24))
            p.ellipse(head[0] - 30, head[1], 8, 8, (20, 22, 24))
            p.ellipse(head[0] + 30, head[1], 8, 8, (20, 22, 24))
            p.ellipse(head[0] - 30, head[1], 4, 4, spec['accent'], False)
            p.ellipse(head[0] + 30, head[1], 4, 4, spec['accent'], False)
    if spec.get('hood'):
        p.ellipse(head[0], head[1] - 6, 36, 30, spec.get('hood', (8, 12, 10)))
        p.ellipse(head[0], head[1] + 2, 20, 18, spec['skin'])
        p.capsule(head[0] - 22, head[1], head[0] + 22, head[1], 3.2, spec['accent'])
        p.ellipse(head[0] - 8, head[1], 3, 3, (230, 255, 230), False)
        p.ellipse(head[0] + 8, head[1], 3, 3, (230, 255, 230), False)
    # braço da frente
    hand = arm(p, (chest[0] + 16, chest[1] - 2), spec, pose['armF'], spec.get('sleeve', shirt), 7.4)
    p.ellipse(hand[0], hand[1], 7, 7, spec['skin'])
    prop = pose.get('prop')
    if prop == 'driver':
        p.capsule(hand[0], hand[1], hand[0] + 34, hand[1] - 8, 2.6, (220, 224, 230))
        p.ellipse(hand[0] + 36, hand[1] - 10, 5, 5, (40, 42, 48), False)
    elif prop == 'chip':
        p.box(hand[0] + 2, hand[1] - 22, 26, 18, (186, 198, 210))
        text(p, '1155', hand[0] + 4, hand[1] - 16, (40, 60, 80), 1)
        for i in range(5):
            p.box(hand[0] + 4 + i * 5, hand[1] - 4, 3, 6, (180, 120, 64), False)
    elif prop == 'tower':
        p.box(hip[0] + 36, hip[1] - 20, 28, 48, (214, 206, 180))
        p.box(hip[0] + 42, hip[1] - 10, 16, 12, (16, 20, 28), False)
        p.box(hip[0] + 60, hip[1] + 4, 4, 12, spec['accent'], False)
    p.outline(1)
    return p.d


# poses relativas: leg = (dx, dy) do pé em relação ao quadril; dy 0 = no chão, negativo = sobe
IDLE_A = dict(legF=(16, 0), legB=(-18, 0), armF=(6, 16, 8, 18), armB=(-6, 16, -8, 16), face='idle')
IDLE_B = dict(legF=(16, 0), legB=(-18, 0), armF=(6, 14, 8, 16), armB=(-6, 14, -8, 14), bob=-2, face='idle')

def cycle(frames):
    return frames

POSES = {
    'idle': [dict(IDLE_A, bob=b) for b in (0, -2, 0, -3)],
    'walk': [
        dict(legF=(22, -10), legB=(-8, 0), armF=(10, 8, 14, 6), armB=(-14, 20, -10, 16), lean=4),
        dict(legF=(8, 0), legB=(-20, -6), armF=(4, 18, 6, 16), armB=(-4, 10, -8, 8), lean=3, bob=-2),
        dict(legF=(6, 0), legB=(-24, -12), armF=(-2, 18, -4, 14), armB=(8, 8, 12, 6), lean=4),
        dict(legF=(18, -6), legB=(-10, 0), armF=(8, 12, 10, 10), armB=(-8, 16, -6, 12), lean=3, bob=-2),
    ],
    'jump': [
        dict(legF=(18, -28), legB=(-16, -24), armF=(8, -8, 16, -16), armB=(-10, -6, -14, -14), dy=-36, face='wide'),
        dict(legF=(14, -8), legB=(-12, -6), armF=(10, 4, 12, 8), armB=(-8, 6, -10, 8), dy=-12),
    ],
    'crouch': [
        dict(squat=26, legF=(20, 0), legB=(-16, 0), armF=(10, 14, 16, 12), armB=(-8, 14, -6, 12)),
        dict(squat=32, legF=(22, 0), legB=(-14, 0), armF=(12, 16, 18, 10), armB=(-6, 16, -4, 12), bob=1),
    ],
    'punch': [
        dict(legF=(14, 0), legB=(-16, 0), armF=(8, 12, 10, 10), armB=(-8, 14, -6, 12), lean=2),
        dict(legF=(18, 0), legB=(-12, 0), armF=(18, 4, 22, 2), armB=(-14, 16, -8, 10), lean=6, prop='driver'),
        dict(legF=(20, 0), legB=(-10, 0), armF=(28, -2, 36, -4), armB=(-16, 18, -6, 8), lean=10, prop='driver', face='mad'),
        dict(legF=(16, 0), legB=(-14, 0), armF=(14, 8, 16, 6), armB=(-10, 14, -8, 10), lean=4),
    ],
    'kick': [
        dict(legF=(16, 0), legB=(-14, 0), armF=(6, 10, 8, 8), armB=(-8, 8, -10, 4), lean=-2),
        dict(legF=(28, -36), legB=(-12, 0), armF=(-4, -6, -2, -10), armB=(-12, -4, -8, -8), lean=-6),
        dict(legF=(62, -58), legB=(-8, 0), armF=(-8, -14, -4, -12), armB=(-16, -8, -10, -10), lean=-10, face='mad'),
        dict(legF=(24, -16), legB=(-12, 0), armF=(2, -2, 4, 2), armB=(-10, 4, -8, 4), lean=-4),
    ],
    'cpunch': [
        dict(squat=28, legF=(18, 0), legB=(-12, 0), armF=(12, 10, 14, 6), armB=(-6, 12, -4, 8)),
        dict(squat=30, legF=(16, 0), legB=(-10, 0), armF=(26, 6, 30, 2), armB=(-10, 14, -4, 8), lean=6, prop='driver'),
    ],
    'ckick': [
        dict(squat=18, legF=(24, 4), legB=(-10, 0), armF=(4, 8, 6, 6), armB=(-8, 10, -6, 6)),
        dict(squat=16, legF=(48, 6), legB=(-8, 0), armF=(-2, -4, 0, -6), armB=(-10, 4, -6, 2), lean=-4),
        dict(squat=20, legF=(30, 2), legB=(-12, 0), armF=(2, 4, 4, 4), armB=(-8, 8, -4, 4)),
    ],
    'jpunch': [
        dict(dy=-20, legF=(12, -16), legB=(-12, -14), armF=(10, 6, 14, 4), armB=(-8, 4, -6, 6)),
        dict(dy=-24, legF=(14, -18), legB=(-10, -16), armF=(22, -2, 28, -6), armB=(-12, 8, -6, 6), lean=6, prop='driver'),
        dict(dy=-16, legF=(10, -10), legB=(-10, -8), armF=(16, 4, 18, 2), armB=(-8, 8, -6, 6)),
    ],
    'jkick': [
        dict(dy=-18, legF=(20, -20), legB=(-12, -16), armF=(4, -6, 6, -8), armB=(-8, -4, -6, -6)),
        dict(dy=-22, legF=(48, -28), legB=(-8, -14), armF=(-4, -12, -2, -10), armB=(-12, -6, -8, -8), lean=-6, face='mad'),
        dict(dy=-12, legF=(22, -8), legB=(-10, -8), armF=(2, -2, 4, 0), armB=(-8, 2, -6, 2)),
    ],
    'special': [
        dict(legF=(14, 0), legB=(-14, 0), armF=(14, -8, 18, -16), armB=(-8, 10, -6, 8), prop='chip', face='wide'),
        dict(legF=(12, 0), legB=(-16, 0), armF=(8, -20, 6, -8), armB=(4, -16, 2, -6), prop='tower', face='happy', bob=-3),
    ],
    'hit': [
        dict(lean=-12, legF=(8, 0), legB=(-20, 0), armF=(-2, 8, 2, 10), armB=(2, 6, 4, 8), face='hurt', hx=-4),
        dict(lean=-8, legF=(10, 0), legB=(-16, 0), armF=(2, 10, 4, 12), armB=(-2, 8, 0, 10), face='shut'),
    ],
    'block': [
        dict(lean=-6, legF=(12, 0), legB=(-14, 0), armF=(2, -10, 6, -4), armB=(4, -6, 8, 2)),
        dict(lean=-8, legF=(10, 0), legB=(-12, 0), armF=(0, -12, 4, -6), armB=(2, -8, 6, 0), bob=-1),
    ],
    'ko': [
        dict(squat=36, dy=6, legF=(30, 8), legB=(-24, 6), armF=(20, 16, 16, 10), armB=(-18, 14, -10, 8), face='hurt'),
        dict(squat=62, dy=16, legF=(46, 10), legB=(-30, 8), armF=(28, 18, 10, 8), armB=(-22, 16, -8, 6), face='shut'),
    ],
    'win': [
        dict(legF=(14, 0), legB=(-14, 0), armF=(4, -16, 2, -22), armB=(-6, 8, -4, 10), prop='tower', face='happy', bob=-4),
        dict(legF=(16, 0), legB=(-12, 0), armF=(6, -20, 2, -18), armB=(-4, 6, -2, 8), prop='tower', face='happy', bob=-1),
    ],
}

SPECS = {
    'stack': dict(
        skin=C('8fd9a8'), hair=C('243040'), shirt=C('1a4e9a'), sleeve=C('163f7a'),
        pants=C('1c2230'), shoe=C('c47a3e'), accent=C('3ef0d8'),
        alien=True, circuit=True, badge=True, hair_style='short',
    ),
    'hacker': dict(
        skin=C('a87858'), hair=C('1a120e'), beard=C('140e0c'), brow=C('100c0a'),
        shirt=C('14181c'), sleeve=C('101418'), pants=C('2a3140'), shoe=C('111111'),
        accent=C('39ff6a'), hair_style='curly', phones=True, beard_on=True,
        logo_dragon=True, sleeve_text=True, eye=C('3a2418'),
    ),
    'zoya': dict(
        skin=C('f0d0c0'), hair=C('6a2430'), shirt=C('2c3140'), sleeve=C('3a2430'),
        pants=C('23262f'), shoe=C('1a1c22'), accent=C('d03040'),
        coat=C('2a2e38'), lining=C('c02838'), hair_style='braid', tie=C('d03040'),
        eye=C('3a4a6a'),
    ),
    'rin': dict(
        skin=C('f0c8a8'), hair=C('1a120f'), streak=C('e23b3b'), shirt=C('243e86'),
        sleeve=C('1a3068'), pants=C('1c1c22'), shoe=C('f2f2f4'), accent=C('e23b3b'),
        hair_style='long', hair_back=False, eye=C('2a241c'),
    ),
    'noir': dict(
        skin=C('d4b094'), hair=C('d5dbe4'), shirt=C('22242e'), sleeve=C('1a1c24'),
        pants=C('14141c'), shoe=C('101014'), accent=C('9aa6ff'),
        coat=C('1a1c28'), lining=C('6a5aaa'), hair_style='silver', eye=C('3a4030'),
    ),
}
# hacker usa barba
SPECS['hacker']['beard'] = C('140e0c')

def render_one(fid, pose_name, frame):
    pose = dict(POSES[pose_name][frame])
    # hacker: soco sem chave de fenda (é do ET). troca prop driver por nada
    if fid == 'hacker' and pose.get('prop') == 'driver':
        pose['prop'] = None
    if fid != 'stack' and pose.get('prop') in ('chip', 'tower', 'driver'):
        if fid == 'hacker' and pose_name == 'special':
            pose['prop'] = None
            pose['face'] = 'wide'
        elif fid != 'stack':
            pose['prop'] = None
    return paint(SPECS[fid], pose)

def sheet(fid):
    order = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']
    canvas = np.zeros((len(order) * FH, 4 * FW, 4), np.uint8)
    for r, name in enumerate(order):
        for c, pose in enumerate(POSES[name]):
            canvas[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = render_one(fid, name, c)
    return canvas

def save_sheet(fid):
    im = Image.fromarray(sheet(fid), 'RGBA')
    im.save(os.path.join(ROOT, 'assets/sprites', fid + '.png'), optimize=True)
    cell = np.array(im.crop((0, 0, FW, FH)))
    a = cell[:, :, 3] > 20
    ys, xs = np.where(a)
    face = cell[ys.min():ys.min() + 86, xs.min():xs.max() + 1]
    Image.fromarray(face, 'RGBA').resize((168, 168), Image.NEAREST).save(os.path.join(ROOT, 'assets/ui', f'face-{fid}.png'))
    Image.fromarray(face, 'RGBA').resize((96, 96), Image.NEAREST).save(os.path.join(ROOT, 'assets/ui', f'portrait-{fid}.png'))
    print(fid, 'px', int(a.sum()))

def preview():
    os.makedirs('/tmp/preview', exist_ok=True)
    for fid in ('stack', 'hacker', 'zoya', 'rin', 'noir'):
        row = []
        for name, fr in (('idle', 0), ('walk', 0), ('punch', 2), ('kick', 2), ('win', 0)):
            cell = render_one(fid, name, fr)
            a = cell[:, :, 3] > 10
            ys, xs = np.where(a)
            crop = cell[max(0, ys.min() - 2):ys.max() + 3, max(0, xs.min() - 2):xs.max() + 3]
            row.append(Image.fromarray(crop, 'RGBA'))
        w = sum(im.width + 8 for im in row)
        h = max(im.height for im in row)
        out = Image.new('RGBA', (w, h), (20, 16, 28, 255))
        x = 0
        for im in row:
            out.paste(im, (x, 0), im)
            x += im.width + 8
        out.save(f'/tmp/preview/{fid}.png')
        print('preview', fid, out.size)

def ability_icons():
    """Ícones 128px no mesmo idioma visual das habilidades atuais: forma chapada, contorno, brilho."""
    S = 128

    def icon(draw):
        canvas = np.zeros((5 * S, 4 * S, 4), np.uint8)
        for r in range(5):
            for c in range(4):
                p = P(S, S)
                draw(p, r, c)
                p.outline(2)
                canvas[r * S:(r + 1) * S, c * S:(c + 1) * S] = p.d
        return canvas

    def et(p, r, c):
        bob = (c % 4) * 3
        if r == 0:
            p.box(40, 44 + bob, 48, 34, (186, 198, 214))
            text(p, '1155', 46, 54 + bob, (30, 50, 70), 2)
            for i in range(6):
                p.box(42 + i * 8, 78 + bob, 4, 8, (180, 120, 64), False)
        elif r == 1:
            p.capsule(28, 86, 96, 36 - c * 4, 5, (230, 232, 236))
            p.ellipse(100, 30 - c * 4, 8, 8, (40, 42, 48), False)
        elif r == 2:
            p.ellipse(64, 64, 28 + c * 4, 28 + c * 4, (255, 120, 40), False)
            p.ellipse(64, 64, 12, 12, (255, 230, 150), False)
        elif r == 3:
            p.ellipse(64, 92, 46, 14, (40, 170, 80), False)
            p.ellipse(48 + c * 6, 84, 8, 5, (180, 255, 140), False)
        else:
            p.box(36, 28, 56, 70, (220, 210, 180))
            p.box(48, 42, 28, 16, (16, 20, 28), False)
            p.ellipse(64, 18, 16 + c * 3, 8, (80, 220, 255), False)

    def hack(p, r, c):
        if r == 0:
            p.ellipse(64, 64, 22, 32, (10, 24, 16), False)
            p.ellipse(64, 52, 8, 6, (60, 255, 120), False)
        elif r == 1:
            p.ellipse(64, 86, 26 + c * 4, 12, (0, 50, 24), False)
            p.ellipse(64, 70, 8, 16, (50, 255, 110), False)
        elif r == 2:
            p.ellipse(40 + c * 10, 64, 16, 12, (20, 90, 40))
            p.box(28, 80, 40, 4, (0, 255, 80), False)
        elif r == 3:
            p.ellipse(64, 64, 24 + c * 3, 28, (0, 100, 40), False)
            p.box(58, 28, 12, 30, (140, 255, 160), False)
        else:
            p.box(10, 18, 108, 92, (16, 36, 140), False)
            p.box(18, 30, 48, 8, (230, 240, 255), False)
            p.ellipse(36, 70, 8, 8, (255, 255, 255), False)
            p.box(16 + c * 12, 52, 60, 4, (0, 255, 120), False)

    def zoya(p, r, c):
        col = (150, 50, 170)
        if r == 0:
            p.ellipse(48 + c * 6, 64, 18, 12, col)
        elif r == 1:
            p.ellipse(64, 64, 30, 30, (50, 20, 70), False)
        elif r == 2:
            p.box(24, 20, 20, 88, col)
            p.box(84, 20, 20, 88, col)
        elif r == 3:
            p.capsule(18, 64, 110 - c * 6, 64, 4, (220, 80, 200))
        else:
            for i in range(5):
                p.ellipse(18 + i * 20, 40 + ((i + c) % 3) * 16, 8, 6, col, False)

    def rin(p, r, c):
        col = (40, 220, 230)
        if r == 0:
            p.capsule(20, 96, 40 + c * 16, 28, 5, col)
        elif r == 1:
            for i in range(5):
                p.ellipse(20 + i * 18, 24 + (i * 10 + c * 8) % 80, 6, 8, col, False)
        elif r == 2:
            p.ellipse(64, 64, 22 + c * 4, 30, (20, 40, 80), False)
        elif r == 3:
            p.ellipse(64, 64, 32, 38, col, False)
            p.ellipse(64, 64, 16, 20, (10, 16, 32), False)
        else:
            for i, y in enumerate((28, 58, 88)):
                p.box(12, y + (c if i == 1 else 0), 104, 8, col if i != 1 else (255, 80, 180), False)

    def noir(p, r, c):
        if r == 0:
            p.ellipse(40 + c * 8, 64, 14, 14, (50, 50, 90))
            p.ellipse(40 + c * 8, 64, 5, 5, (220, 220, 255), False)
        elif r == 1:
            p.capsule(16, 72, 50 + c * 14, 48, 5, (170, 180, 255))
        elif r == 2:
            p.ellipse(64, 64, 26 + c * 3, 26 + c * 3, (90, 80, 170), False)
        elif r == 3:
            p.ellipse(64, 90, 40, 12, (20, 16, 40), False)
        else:
            p.ellipse(64, 64, 18 + c * 8, 18 + c * 8, (8, 6, 20), False)
            p.ellipse(64, 64, 6, 6, (230, 230, 255), False)

    out = {
        'stack': et, 'hacker': hack, 'zoya': zoya, 'rin': rin, 'noir': noir,
    }
    for fid, fn in out.items():
        im = Image.fromarray(icon(fn), 'RGBA')
        im.save(os.path.join(ROOT, 'assets/abilities', fid + '.png'), optimize=True)
        print('ability', fid)

def fx_icons():
    S, COLS, ROWS = 96, 8, 5

    def sheet(fn, name):
        canvas = np.zeros((ROWS * S, COLS * S, 4), np.uint8)
        for r in range(ROWS):
            for c in range(COLS):
                p = P(S, S)
                fn(p, r, c)
                p.outline(1)
                canvas[r * S:(r + 1) * S, c * S:(c + 1) * S] = p.d
        Image.fromarray(canvas, 'RGBA').save(os.path.join(ROOT, 'assets/fx', name + '.png'), optimize=True)

    def portal(p, r, c):
        g = 10 + (c % 8) * 3
        p.ellipse(48, 68, g, max(5, g * 0.38), (16, 6, 28), False)
        p.ellipse(48, 64, g * 0.62, max(3, g * 0.2), (120, 60, 190), False)
        if c % 2 == 0:
            p.ellipse(48, 62, 5, 3, (220, 200, 255), False)

    def rastro(p, r, c):
        p.ellipse(48, 52, 18 - c, 26 - c, (0, 210, 220) if r % 2 == 0 else (30, 20, 50), False)

    def lata(p, r, c):
        if r == 0:
            p.box(28, 34, 40, 28, (190, 200, 214))
            text(p, '1155', 32, 42, (40, 60, 80), 1)
        elif r == 1:
            p.capsule(16, 64, 78, 28, 4, (230, 232, 236))
        elif r == 2:
            p.ellipse(48, 48, 16 + c, 16 + c, (255, 110, 40), False)
            p.ellipse(48, 48, 7, 7, (255, 220, 140), False)
        elif r == 3:
            p.ellipse(48, 64, 30, 10, (40, 170, 80), False)
        else:
            p.box(30, 22, 36, 48, (220, 210, 180))
            p.box(38, 32, 16, 12, (16, 20, 28), False)

    def kernel(p, r, c):
        p.box(6, 10, 84, 76, (14, 32, 130), False)
        p.box(14, 20, 36, 6, (230, 240, 255), False)
        p.box(10 + (c * 9) % 30, 40, 46, 5, (0, 255, 120), False)
        p.ellipse(28, 62, 6, 6, (255, 255, 255), False)

    sheet(portal, 'portal')
    sheet(rastro, 'rastro')
    sheet(lata, 'lata')
    sheet(kernel, 'kernel')
    sheet(kernel, 'hackfx')
    print('fx ok')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'full':
        for fid in SPECS:
            save_sheet(fid)
        ability_icons()
        fx_icons()
    else:
        preview()
