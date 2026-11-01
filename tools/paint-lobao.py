#!/usr/bin/env python3
"""Lobacao — lutador de wrestling tema lobo, inspirado nas fotos em inspiracao/.
Gera no padrao do jogo (igual thl/dolynho):
  assets/sprites/lobao.png   1280x3900 RGBA (4 col x 15 lin de 320x260, 4 frames por pose)
  assets/ui/face-lobao.png  168x168 RGBA
  assets/ui/portrait-lobao.png 320x360 RGBA
  assets/abilities/lobao.png 512x640 RGBA (4 col x 5 lin de 128)
Uso: python3 tools/paint-lobao.py
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paint_chibi as pc

ROOT = pc.ROOT
FW, FH = pc.FW, pc.FH
BASE = 246
P, C, mix = pc.P, pc.C, pc.mix

ORDER = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick',
         'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']


def tri(p, x1, y1, x2, y2, x3, y3, col, shade=True):
    minx, maxx = int(min(x1, x2, x3)) - 1, int(max(x1, x2, x3)) + 2
    miny, maxy = int(min(y1, y2, y3)) - 1, int(max(y1, y2, y3)) + 2
    for y in range(miny, maxy):
        for x in range(minx, maxx):
            d1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2)
            d2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3)
            d3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1)
            neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
            pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
            if not (neg and pos):
                if shade and y > (y1 + y2 + y3) / 3 + 2:
                    col = mix(col, (0, 0, 0), 0.3)
                p.put(x, y, col)


SPEC = dict(
    # pele morena media, cabelo preto curto com volume no topo (fotos 01/02)
    skin=C('8d6248'), hair=C('0e0a08'),
    # roupa verde e branco (estilo camisa de time)
    shirt=C('1e7a34'), sleeve=C('155c28'), pants=C('eef0e8'), shoe=C('f4f6ef'),
    accent=C('1e7a34'),
    eye=C('5a3418'), brow=C('0a0705'),
    hair_style='wolf', wolf=True, gloves=C('eef0e8'), logo_wolf=True,
)


def face_wolf(p, head, spec, expr):
    hx, hy = head
    skin = spec['skin']
    p.ellipse(hx, hy, 30, 32, skin)
    # orelhas de lobo
    tri(p, hx - 26, hy - 18, hx - 34, hy - 46, hx - 10, hy - 30, spec['hair'])
    tri(p, hx + 26, hy - 18, hx + 34, hy - 46, hx + 10, hy - 30, spec['hair'])
    tri(p, hx - 24, hy - 22, hx - 29, hy - 39, hx - 15, hy - 29, mix(skin, (200, 60, 60), 0.5), shade=False)
    tri(p, hx + 24, hy - 22, hx + 29, hy - 39, hx + 15, hy - 29, mix(skin, (200, 60, 60), 0.5), shade=False)
    # cabelo preto curto com volume no topo e franja curta na testa (foto real)
    tri(p, hx - 30, hy - 14, hx - 44, hy - 30, hx - 18, hy - 26, spec['hair'])
    tri(p, hx + 30, hy - 14, hx + 44, hy - 30, hx + 18, hy - 26, spec['hair'])
    tri(p, hx - 14, hy - 30, hx, hy - 44, hx + 14, hy - 30, spec['hair'])
    p.ellipse(hx, hy - 16, 30, 14, spec['hair'])
    # franja curta na testa, bem marcada
    for dx in range(-26, 27, 5):
        tri(p, hx + dx, hy - 10, hx + dx + 5, hy - 10, hx + dx + 2, hy - 2, spec['hair'], shade=False)
    p.ellipse(hx, hy - 8, 28, 8, spec['hair'])
    # olhos castanhos amendoados; pupila vira âmbar quando bravo (estilo lobo)
    eye = spec.get('eye', C('5a3418'))
    if expr == 'shut':
        p.box(hx - 16, hy - 2, 12, 3, mix(skin, (0, 0, 0), 0.5), False)
        p.box(hx + 6, hy - 2, 12, 3, mix(skin, (0, 0, 0), 0.5), False)
    else:
        for sx in (-10, 10):
            p.ellipse(hx + sx, hy - 1, 7, 8, eye, False)
            if expr == 'mad' or expr == 'wide':
                p.box(hx + sx - 1.4, hy - 5, 3, 11, C('ffb020'), False)
            else:
                p.ellipse(hx + sx + 1, hy, 3.4, 4.2, (24, 14, 10), False)
            p.ellipse(hx + sx - 3, hy - 4, 2, 2, (255, 255, 255), False)
        if expr == 'wide':
            p.ellipse(hx - 10, hy - 1, 8.5, 9.5, eye, False)
            p.ellipse(hx + 11, hy - 1, 8.5, 9.5, eye, False)
    # sobrancelhas grossas e pretas (como nas fotos), inclinadas quando bravo
    brow = spec.get('brow', mix(spec['hair'], (0, 0, 0), 0.3))
    if expr == 'mad':
        tri(p, hx - 19, hy - 17, hx - 5, hy - 11, hx - 19, hy - 9, brow, shade=False)
        tri(p, hx + 19, hy - 17, hx + 5, hy - 11, hx + 19, hy - 9, brow, shade=False)
    else:
        p.box(hx - 20, hy - 14, 14, 5, brow, False)
        p.box(hx + 6, hy - 14, 14, 5, brow, False)
    # nariz de lobo preto, largo
    p.ellipse(hx, hy + 8, 8, 5.5, (16, 12, 10), False)
    p.ellipse(hx - 2, hy + 7, 2.5, 2, (60, 50, 44), False)
    # focinho claro abaixo do nariz
    p.ellipse(hx, hy + 13, 9, 5, mix(skin, (240, 225, 205), 0.45), False)
    p.box(hx, hy + 10, 2, 4, (16, 12, 10), False)
    # boca com presas
    if expr == 'mad' or expr == 'wide':
        p.ellipse(hx, hy + 15, 9, 6, (60, 18, 20), False)
        tri(p, hx - 6, hy + 12, hx - 3, hy + 12, hx - 4.5, hy + 19, (245, 245, 240), shade=False)
        tri(p, hx + 6, hy + 12, hx + 3, hy + 12, hx + 4.5, hy + 19, (245, 245, 240), shade=False)
    elif expr == 'hurt':
        p.ellipse(hx, hy + 14, 5, 4, (90, 30, 30), False)
    else:
        p.box(hx - 5, hy + 13, 10, 2, mix(skin, (0, 0, 0), 0.45), False)
        tri(p, hx - 4, hy + 15, hx - 1.5, hy + 15, hx - 2.7, hy + 19, (245, 245, 240), shade=False)
        tri(p, hx + 4, hy + 15, hx + 1.5, hy + 15, hx + 2.7, hy + 19, (245, 245, 240), shade=False)
    # listras de lobo na bochecha
    stripe = mix(skin, (0, 0, 0), 0.55)
    for i, dx in enumerate((-24, -20, -16)):
        p.box(hx + dx - 1, hy + 4 + i * 3, 2, 6, stripe, False)


FUR = (238, 240, 232)      # pelo branco da jaqueta
FUR_SH = (196, 200, 190)   # sombra do pelo
JAQUET = C('155c28')       # verde escuro da jaqueta


def fur_band(p, x0, y0, x1, y1, along='h', thick=3):
    """Faixa densa de pelo ao longo de uma linha (gola, punho, borda)."""
    import math as _m
    steps = max(2, int(_m.hypot(x1 - x0, y1 - y0) / 3))
    for i in range(steps + 1):
        t = i / steps
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        for k in range(thick):
            if along == 'h':
                p.ellipse(x + (k - 1) * 2.4, y - 1 - k * 2.2, 3.2, 4.0, FUR if k % 2 == 0 else FUR_SH, False)
            else:
                p.ellipse(x - 1 - k * 2.2, y + (k - 1) * 2.4, 4.0, 3.2, FUR if k % 2 == 0 else FUR_SH, False)


def paint_wolf(spec, pose):
    p = P(FW, FH)
    hip, chest, head, foot_y = pc.skel(pose)
    pants, shoe, shirt = spec['pants'], spec['shoe'], spec['shirt']
    fx, fy = pose['legB']
    pc.leg(p, (hip[0] - 10, hip[1]), (hip[0] - 10 + fx, foot_y + fy), pants, shoe, 9)
    pc.arm(p, (chest[0] - 16, chest[1] - 4), spec, pose['armB'], spec.get('sleeve', shirt), 7)
    # torso: camiseta verde embaixo, jaqueta verde escura aberta por cima
    p.ellipse(chest[0], chest[1] + 18, 28, 30, shirt)
    p.box(chest[0] - 24, chest[1] + 8, 48, 36, shirt)
    p.ellipse(chest[0], hip[1] - 4, 24, 10, pants)
    # jaqueta: dois painéis laterais verde escuro sobre o torso, V bem aberto
    p.ellipse(chest[0] - 21, chest[1] + 14, 13, 28, JAQUET)
    p.box(chest[0] - 32, chest[1] + 4, 15, 38, JAQUET)
    p.ellipse(chest[0] + 21, chest[1] + 14, 13, 28, JAQUET)
    p.box(chest[0] + 17, chest[1] + 4, 15, 38, JAQUET)
    # gola de pelo branca, bem funda no V do peito
    fur_band(p, chest[0] - 22, chest[1] - 4, chest[0] - 6, chest[1] + 14, 'v', 4)
    fur_band(p, chest[0] + 22, chest[1] - 4, chest[0] + 6, chest[1] + 14, 'v', 4)
    # pelo branco ao redor do pescoço atrás da cabeça
    fur_band(p, chest[0] - 18, chest[1] - 10, chest[0] + 18, chest[1] - 10, 'h', 3)
    # borda inferior da jaqueta com faixa densa de pelo
    fur_band(p, chest[0] - 28, hip[1] - 2, chest[0] + 28, hip[1] - 2, 'h', 4)
    # logo de lobo branco GRANDE no peito (cabeça estilizada com orelhas e presas)
    if spec.get('logo_wolf'):
        lx, ly = chest[0], chest[1] + 22
        wht = (245, 247, 240)
        p.ellipse(lx, ly + 3, 14, 11, wht, False)                      # focinho/cabeça
        tri(p, lx - 11, ly - 4, lx - 14, ly - 15, lx - 4, ly - 8, wht, shade=False)   # orelha esq
        tri(p, lx + 11, ly - 4, lx + 14, ly - 15, lx + 4, ly - 8, wht, shade=False)   # orelha dir
        p.box(lx - 7, ly - 2, 3, 3, (12, 34, 18), False)                 # olho esq
        p.box(lx + 4, ly - 2, 3, 3, (12, 34, 18), False)                 # olho dir
        p.ellipse(lx, ly + 4, 3.5, 2.5, (12, 34, 18), False)            # nariz
        tri(p, lx - 5, ly + 9, lx - 2, ly + 9, lx - 3.5, ly + 14, wht, shade=False)   # presa esq
        tri(p, lx + 5, ly + 9, lx + 2, ly + 9, lx + 3.5, ly + 14, wht, shade=False)   # presa dir
    # garras de lobo brancas no ombro esquerdo da jaqueta
    for i in range(3):
        tri(p, chest[0] - 32 + i * 6, chest[1] + 0, chest[0] - 27 + i * 6, chest[1] + 0, chest[0] - 30 + i * 6, chest[1] + 13, FUR, shade=False)
    # faixa de campeao verde no braco + detalhe branco
    p.box(chest[0] + 12, chest[1] + 2, 6, 16, spec['accent'], False)
    p.box(chest[0] + 12, chest[1] + 8, 6, 3, (240, 242, 236), False)
    fx, fy = pose['legF']
    pc.leg(p, (hip[0] + 8, hip[1]), (hip[0] + 8 + fx, foot_y + fy), pants, shoe, 9.5)
    expr = pose.get('face', 'idle')
    face_wolf(p, head, spec, expr)
    hand = pc.arm(p, (chest[0] + 16, chest[1] - 2), spec, pose['armF'], JAQUET, 7.4)
    # punho da jaqueta com faixa de pelo no cotovelo do braço da frente
    ex = chest[0] + 16 + pose['armF'][0]
    ey = chest[1] - 2 + pose['armF'][1]
    fur_band(p, ex - 5, ey, ex + 5, ey, 'h', 3)
    glove = spec.get('gloves')
    p.ellipse(hand[0], hand[1], 8, 8, glove if glove else spec['skin'])
    if glove:
        # luva branca com detalhe verde
        p.box(hand[0] - 4, hand[1] - 2, 8, 3, spec['accent'], False)
        p.ellipse(hand[0] - 2, hand[1] - 5, 3, 2, mix(glove, (255, 255, 255), 0.4), False)
    p.outline(1)
    return p.d


def expand_poses():
    out = {}
    for name, frames in pc.POSES.items():
        fr = [dict(f) for f in frames]
        while len(fr) < 4:
            base = dict(fr[len(fr) % len(frames)])
            base['bob'] = (base.get('bob', 0) - 2) if len(fr) % 2 else base.get('bob', 0)
            fr.append(base)
        out[name] = fr[:4]
    return out


POSES4 = expand_poses()


def render(pose_name, frame):
    pose = dict(POSES4[pose_name][frame])
    pose.pop('prop', None)
    if pose_name == 'special':
        pose['face'] = 'mad'
    return paint_wolf(SPEC, pose)


def fix_baseline(cell):
    """Coloca o pixel mais baixo do boneco exatamente na linha BASE-1 (245),
    deixando a linha 246 livre para a sombra (mesmo padrao do v5_check)."""
    a = cell[:, :, 3] > 20
    ys = np.where(a.any(axis=1))[0]
    if len(ys) == 0:
        return cell
    shift = (BASE - 1) - ys.max()
    if shift == 0:
        return cell
    out = np.zeros_like(cell)
    if shift > 0:
        out[shift:, :] = cell[:cell.shape[0] - shift, :]
    else:
        out[:cell.shape[0] + shift, :] = cell[-shift:, :]
    return out


def sheet():
    canvas = np.zeros((len(ORDER) * FH, 4 * FW, 4), np.uint8)
    for r, name in enumerate(ORDER):
        for c in range(4):
            cell = render(name, c)
            canvas[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = fix_baseline(cell)
    return canvas


def ability_sheet():
    S = 128
    canvas = np.zeros((5 * S, 4 * S, 4), np.uint8)
    amber, dark, green, white = (255, 176, 32), (20, 34, 24), (30, 122, 52), (240, 242, 236)

    def draw(r, c, fn):
        p = P(S, S)
        fn(p, c)
        p.outline(2)
        canvas[r * S:(r + 1) * S, c * S:(c + 1) * S] = p.d

    chair = (196, 202, 212)   # cadeira de plastico cinza
    chair_sh = (120, 128, 140)

    def chairshot(p, c):  # H1: cadeira lancada (longe, fraca)
        x = 24 + c * 20
        p.box(x - 10, 30, 20, 6, chair, False)          # encosto
        p.box(x - 10, 30, 6, 26, chair, False)
        p.box(x + 4, 30, 6, 26, chair, False)
        p.box(x - 12, 56 + c * 2, 26, 20, chair_sh)      # assento
        for i in range(4):
            p.box(x - 10 + i * 6, 76 + c * 2, 3, 14, chair_sh, False)  # pernas

    def bodyslam(p, c):  # H2: agarrao/body slam de perto
        p.ellipse(64, 40 - c * 6, 26 - c * 2, 16, (60, 40, 26), False)   # rival erguido
        tri(p, 30, 96, 44, 84 - c * 4, 38, 70, green)                   # braco do lobao
        p.ellipse(84, 92, 18, 12, dark, False)                          # cabeca do lobao
        tri(p, 78, 80, 74, 68, 84, 76, dark, shade=False)
        p.ellipse(64, 100, 40 - c * 4, 8, (255, 210, 80), False)        # impacto no chao

    def suplex(p, c):  # H3: suplex invertido (corpo a corpo)
        p.ellipse(64, 24 + c * 8, 22, 12, (60, 40, 26), False)          # rival subindo
        p.ellipse(64, 92 - c * 10, 24, 14, dark, False)                 # lobao curvado
        for i in range(3):
            tri(p, 30 + i * 22, 60 + c * 6, 38 + i * 22, 52 + c * 6, 34 + i * 22, 44, green, shade=False)
        p.ellipse(64, 108, 34 - c * 5, 6, (255, 120, 40), False)

    def chairrain(p, c):  # H4: chuva de cadeiras caindo
        for i in range(3):
            x = 24 + i * 30
            y = (20 + i * 34 + c * 22) % 100
            p.box(x - 6, y, 12, 4, chair, False)
            p.box(x - 6, y, 4, 14, chair, False)
            p.box(x + 2, y, 4, 14, chair, False)
            p.box(x - 7, y + 14, 16, 8, chair_sh)

    def selvagem(p, c):  # ULT: escudo verde/branco (modo selvagem) + presas
        R = 26 + c * 5
        p.ellipse(64, 64, R + 8, R + 10, white, False)                  # borda branca
        p.ellipse(64, 64, R, R + 2, green, False)                        # escudo verde
        p.ellipse(64, 64, R * 0.55, (R + 2) * 0.55, white, False)        # miolo branco
        # cabeca de lobo estilizada no centro
        lx, ly = 64, 66
        p.ellipse(lx, ly, 9, 7, green, False)
        tri(p, lx - 7, ly - 4, lx - 9, ly - 12, lx - 3, ly - 7, green, shade=False)
        tri(p, lx + 7, ly - 4, lx + 9, ly - 12, lx + 3, ly - 7, green, shade=False)
        p.box(lx - 4, ly - 2, 2, 2, (10, 20, 12), False)
        p.box(lx + 2, ly - 2, 2, 2, (10, 20, 12), False)
        tri(p, lx - 3, ly + 5, lx - 1, ly + 5, lx - 2, ly + 9, white, shade=False)
        tri(p, lx + 3, ly + 5, lx + 1, ly + 5, lx + 2, ly + 9, white, shade=False)

    for c in range(4):
        draw(0, c, chairshot)
        draw(1, c, bodyslam)
        draw(2, c, suplex)
        draw(3, c, chairrain)
        draw(4, c, selvagem)
    return canvas


def main():
    im = Image.fromarray(sheet(), 'RGBA')
    im.save(os.path.join(ROOT, 'assets/sprites/lobao.png'), optimize=True)
    print('sprites/lobao.png', im.size)
    cell = np.array(im.crop((0, 0, FW, FH)))
    a = cell[:, :, 3] > 20
    ys, xs = np.where(a)
    # rosto: do topo do cabelo ate o queixo (aprox. 60% da altura do boneco)
    fh = int((ys.max() - ys.min()) * 0.62)
    face = cell[ys.min():ys.min() + fh, xs.min():xs.max() + 1]
    side = min(face.shape[0], face.shape[1])
    Image.fromarray(face, 'RGBA').resize((168, 168), Image.NEAREST).save(os.path.join(ROOT, 'assets/ui/face-lobao.png'))
    # portrait 320x360: boneco inteiro proporcional, centralizado
    fig = im.crop((0, 0, FW, FH))
    b = np.array(fig)
    aa = b[:, :, 3] > 20
    yy, xx = np.where(aa)
    fig = fig.crop((xx.min(), yy.min(), xx.max() + 1, yy.max() + 1))
    h = 360
    w = max(1, round(fig.width * h / fig.height))
    fig = fig.resize((w, h), Image.LANCZOS)
    port = Image.new('RGBA', (320, 360), (0, 0, 0, 0))
    port.paste(fig, ((320 - w) // 2, 0), fig)
    port.save(os.path.join(ROOT, 'assets/ui/portrait-lobao.png'))
    print('ui/face-lobao.png 168x168, ui/portrait-lobao.png', port.size)
    ab = Image.fromarray(ability_sheet(), 'RGBA')
    ab.save(os.path.join(ROOT, 'assets/abilities/lobao.png'), optimize=True)
    print('abilities/lobao.png', ab.size)


if __name__ == '__main__':
    main()
