#!/usr/bin/env python3
"""Atlas de habilidades do RAFAEL (fixer cyberpunk), desenhado por codigo.

O atlas antigo (recortado das folhas de habilidade) tinha os 4 quadros de
cada linha IGUAIS (o efeito nao animava) e a linha da ultimate era uma mancha
verde/vermelha com ruido. Aqui cada efeito e desenhado com brilho aditivo e
os 4 quadros animam de verdade.

Saida: assets/abilities/rafael.png — 4 colunas x 5 linhas de 128 px
  linha 0  Monofio            fio vermelho incandescente ondulando + faiscas
                              (o beam repete a celula na horizontal: o fio
                              cruza a celula de ponta a ponta na altura 64)
  linha 1  Soco de Chassi     onda de choque amarela + raios eletricos
  linha 2  Dash de Overclock  rastro Sandevistan (fantasmas ciano/magenta)
  linha 3  Chuva de Estilhacos  caco de metal em brasa caindo com rastro
  linha 4  Quebra-ICE (ult)   grade hexagonal de ICE estilhacando + raios

Uso: python3 tools/build_rafael_fx.py [--preview arq.png]
"""
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
S = 128
SS = 4  # supersampling: desenha a 512 e reduz (bordas lisas)


def canvas():
    return Image.new('RGBA', (S * SS, S * SS), (0, 0, 0, 0))


def glow(img, radius, strength=1.0):
    """brilho: borra uma copia e soma por baixo (luz em volta do traco)."""
    blur = img.filter(ImageFilter.GaussianBlur(radius * SS))
    a = np.array(blur).astype(float)
    a[..., 3] = np.clip(a[..., 3] * strength, 0, 255)
    base = Image.fromarray(a.astype(np.uint8), 'RGBA')
    base.alpha_composite(img)
    return base


def finish(img):
    return img.resize((S, S), Image.LANCZOS)


def P(x, y):
    return (x * SS, y * SS)


def lightning(d, x0, y0, x1, y1, color, width, rnd, jag=10, steps=7):
    pts = [P(x0, y0)]
    for k in range(1, steps):
        t = k / steps
        x = x0 + (x1 - x0) * t + rnd.uniform(-jag, jag)
        y = y0 + (y1 - y0) * t + rnd.uniform(-jag, jag)
        pts.append(P(x, y))
    pts.append(P(x1, y1))
    d.line(pts, fill=color, width=width * SS, joint='curve')


# ---------- linha 0: MONOFIO ----------
def monofio(f):
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(10 + f)
    ph = f * math.pi / 2
    pts = [P(x, 64 + math.sin(x / 128 * 2 * math.pi + ph) * 9) for x in range(0, 129, 4)]
    d.line(pts, fill=(255, 40, 30, 255), width=7 * SS, joint='curve')
    d.line(pts, fill=(255, 200, 160, 255), width=2 * SS, joint='curve')
    for _ in range(9):  # faiscas soltando do fio
        x = rnd.uniform(4, 124)
        y = 64 + math.sin(x / 128 * 2 * math.pi + ph) * 9
        ang = rnd.uniform(0, 2 * math.pi)
        ln = rnd.uniform(5, 14)
        d.line([P(x, y), P(x + math.cos(ang) * ln, y + math.sin(ang) * ln)], fill=(255, 190, 90, 230), width=2 * SS)
    return finish(glow(im, 5, 1.6))


# ---------- linha 1: SOCO DE CHASSI ----------
def chassi(f):
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(20 + f)
    r = 18 + f * 14
    for k, (col, w) in enumerate([((255, 170, 30, 255), 9), ((255, 240, 150, 255), 3)]):
        d.ellipse([P(64 - r, 64 - r * 0.55), P(64 + r, 64 + r * 0.55)], outline=col, width=w * SS)
    d.ellipse([P(64 - r * 0.45, 64 - r * 0.3), P(64 + r * 0.45, 64 + r * 0.3)], fill=(255, 250, 210, 200 - f * 40))
    for _ in range(6):  # raios eletricos saindo do impacto
        ang = rnd.uniform(0, 2 * math.pi)
        lightning(d, 64, 64, 64 + math.cos(ang) * (r + 18), 64 + math.sin(ang) * (r * 0.55 + 18), (140, 220, 255, 255), 2, rnd, jag=6, steps=5)
    return finish(glow(im, 6, 1.5))


# ---------- linha 2: DASH DE OVERCLOCK (Sandevistan) ----------
def dash(f):
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(30 + f)
    shift = f * 8
    for i, (col, dy) in enumerate([((0, 240, 255, 220), -5), ((255, 40, 200, 170), 5), ((230, 255, 255, 255), 0)]):
        for k in range(6):  # tracos de velocidade
            y = 30 + k * 14 + dy * 0.6
            x0 = (rnd.uniform(-20, 40) + shift) % 128 - 20
            ln = rnd.uniform(40, 90)
            d.line([P(x0, y), P(x0 + ln, y)], fill=col, width=(3 if i < 2 else 1) * SS)
    # cabeca do rastro: cunha de luz ciano com borda magenta (aberracao cromatica)
    hx = 96 + (f % 2) * 6
    d.polygon([P(hx - 50, 50), P(hx + 14, 64), P(hx - 50, 78)], fill=(0, 240, 255, 120))
    d.polygon([P(hx - 44, 56), P(hx + 10, 64), P(hx - 44, 72)], fill=(230, 255, 255, 230))
    d.line([P(hx - 54, 48), P(hx + 16, 62)], fill=(255, 40, 200, 200), width=2 * SS)
    return finish(glow(im, 4, 1.7))


# ---------- linha 3: CHUVA DE ESTILHACOS ----------
def caco(f):
    im = canvas()
    d = ImageDraw.Draw(im)
    rot = f * 0.5
    cx, cy = 64, 54 + f * 6
    pts = [(-10, -26), (12, -14), (8, 22), (-8, 28), (-14, 4)]
    def tr(px, py):
        return P(cx + px * math.cos(rot) - py * math.sin(rot), cy + px * math.sin(rot) + py * math.cos(rot))
    # rastro de brasa acima do caco
    for k in range(5):
        a = 180 - k * 34
        d.ellipse([P(cx - 6 + k, cy - 34 - k * 9), P(cx + 6 - k, cy - 22 - k * 9)], fill=(255, 120, 30, max(a, 0)))
    d.polygon([tr(px, py) for px, py in pts], fill=(70, 70, 82, 255), outline=(255, 150, 60, 255))
    d.line([tr(-10, -26), tr(8, 22)], fill=(255, 220, 160, 255), width=2 * SS)
    d.line([tr(px, py) for px, py in pts] + [tr(*pts[0])], fill=(255, 120, 40, 255), width=2 * SS)
    return finish(glow(im, 5, 1.5))


# ---------- linha 4: QUEBRA-ICE (ult) ----------
def quebra_ice(f):
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(50 + f)
    spread = f * 9
    hexr = 13
    for gy in range(-3, 4):
        for gx in range(-3, 4):
            cx = 64 + gx * hexr * 1.75 + (hexr * 0.87 if gy % 2 else 0)
            cy = 64 + gy * hexr * 1.5
            dist = math.hypot(cx - 64, cy - 64)
            if dist > 50:
                continue
            push = spread * (dist / 60)
            ang = math.atan2(cy - 64, cx - 64)
            cx += math.cos(ang) * push
            cy += math.sin(ang) * push
            pts = [P(cx + hexr * 0.8 * math.cos(math.pi / 3 * k + math.pi / 6), cy + hexr * 0.8 * math.sin(math.pi / 3 * k + math.pi / 6)) for k in range(6)]
            a = int(250 - f * 40 - dist * 1.6)
            if a <= 10:
                continue
            d.polygon(pts, fill=(255, 30, 60, max(20, a // 3)))
            d.line(pts + [pts[0]], fill=(0, 230, 255, a), width=2 * SS)
    for _ in range(5):  # raios cortando o ICE
        ang = rnd.uniform(0, 2 * math.pi)
        lightning(d, 64, 64, 64 + math.cos(ang) * 60, 64 + math.sin(ang) * 60, (255, 255, 255, 255), 2, rnd, jag=7)
    d.ellipse([P(52 - f * 2, 52 - f * 2), P(76 + f * 2, 76 + f * 2)], fill=(255, 60, 80, 230 - f * 40))
    return finish(glow(im, 6, 1.6))


ROWS = [monofio, chassi, dash, caco, quebra_ice]


def main():
    atlas = Image.new('RGBA', (S * 4, S * len(ROWS)), (0, 0, 0, 0))
    for r, fn in enumerate(ROWS):
        for f in range(4):
            atlas.alpha_composite(fn(f), (f * S, r * S))
    out = ROOT / 'assets/abilities/rafael.png'
    atlas.save(out, optimize=True)
    print('ok', out, atlas.size)
    if '--preview' in sys.argv:
        pv = Image.new('RGBA', atlas.size, (24, 20, 34, 255))
        pv.alpha_composite(atlas)
        pv.save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
