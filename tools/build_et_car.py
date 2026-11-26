#!/usr/bin/env python3
"""Carro do ET 1155 (ultimate "Debloat Total"), desenhado por codigo.

Sedan quadradao antigo, BRANCO (o carro do ET e branco) com pontos de ferrugem, o ET de bone preto no volante,
farol aceso, rodas girando e fumaca no escapamento. Pixel art em 128x48,
ampliada 2x sem suavizar.

Saida: assets/fx/et-car.png — 4 colunas x 1 linha de celulas 256x256.
Na celula o carro olha pra DIREITA e o fundo das rodas fica em y=154
(o projetil de chao desenha o centro da celula em y=-34, entao a roda
encosta no chao com escala 1.3: (154-128)*1.3 = 34).

Uso: python3 tools/build_et_car.py [--preview arq.png]
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
W, H = 128, 48
CELL = 256
WHEEL_BOTTOM = 154

BODY = (232, 234, 238, 255)
BODY_HI = (255, 255, 255, 255)
BODY_LO = (150, 156, 168, 255)
RUST = (176, 140, 96, 255)
GLASS = (150, 210, 255, 255)
GLASS_HI = (225, 245, 255, 255)
FRAME = (30, 16, 14, 255)
ARCH = (40, 42, 50, 255)
OUTLINE = (36, 38, 48, 255)
CHROME = (205, 205, 215, 255)
TIRE = (24, 24, 30, 255)
RIM = (160, 160, 172, 255)
SKIN = (200, 138, 94, 255)
CAP = (16, 16, 20, 255)
BEARD = (40, 26, 20, 255)


def wheel(d, cx, cy, f):
    d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=TIRE)
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=RIM)
    for k in range(3):  # raios girando
        a = f * math.pi / 6 + k * math.pi / 3
        d.line([(cx - math.cos(a) * 5, cy - math.sin(a) * 5), (cx + math.cos(a) * 5, cy + math.sin(a) * 5)], fill=(90, 90, 100, 255), width=1)
    d.ellipse([cx - 1, cy - 1, cx + 1, cy + 1], fill=(60, 60, 70, 255))


def frame(f):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bob = 1 if f % 2 else 0  # suspensao quicando
    y0 = 2 + bob
    # linhas de velocidade atras
    for k, (yy, ln) in enumerate([(14, 18), (24, 26), (33, 14)]):
        x = (f * 5 + k * 7) % 10
        d.line([(x, yy + y0), (x + ln - 12, yy + y0)], fill=(255, 255, 255, 120), width=1)
    # carroceria baixa
    d.rectangle([8, 20 + y0, 122, 35 + y0], fill=BODY)
    d.line([(8, 21 + y0), (122, 21 + y0)], fill=BODY_HI)
    d.rectangle([8, 33 + y0, 122, 35 + y0], fill=BODY_LO)
    # capo um pouco mais baixo na frente
    d.polygon([(92, 20 + y0), (122, 22 + y0), (122, 24 + y0), (92, 22 + y0)], fill=BODY_HI)
    # cabine
    d.polygon([(30, 20 + y0), (40, 6 + y0), (80, 6 + y0), (94, 20 + y0)], fill=BODY)
    d.line([(40, 6 + y0), (80, 6 + y0)], fill=BODY_HI)
    # vidros
    d.polygon([(34, 19 + y0), (42, 8 + y0), (58, 8 + y0), (58, 19 + y0)], fill=GLASS)
    d.polygon([(62, 19 + y0), (62, 8 + y0), (78, 8 + y0), (89, 19 + y0)], fill=GLASS)
    d.line([(44, 9 + y0), (40, 15 + y0)], fill=GLASS_HI)
    d.line([(80, 9 + y0), (85, 15 + y0)], fill=GLASS_HI)
    d.line([(60, 7 + y0), (60, 19 + y0)], fill=FRAME, width=2)
    # o ET no volante: bone preto, oculos, barba
    d.ellipse([66, 10 + y0, 75, 19 + y0], fill=SKIN)
    d.rectangle([65, 9 + y0, 76, 12 + y0], fill=CAP)
    d.rectangle([74, 11 + y0, 78, 12 + y0], fill=CAP)  # aba
    d.rectangle([71, 13 + y0, 75, 14 + y0], fill=(20, 20, 20, 255))  # oculos
    d.rectangle([67, 16 + y0, 74, 19 + y0], fill=BEARD)
    # portas, maçaneta e ferrugem
    d.line([(60, 21 + y0), (60, 33 + y0)], fill=BODY_LO)
    d.line([(92, 21 + y0), (92, 33 + y0)], fill=BODY_LO)
    d.rectangle([64, 24 + y0, 67, 25 + y0], fill=CHROME)
    for rx, ry in [(16, 30), (19, 31), (101, 30), (46, 32)]:
        d.rectangle([rx, ry + y0, rx + 2, ry + 1 + y0], fill=RUST)
    # para-choques cromados, farol e lanterna
    d.rectangle([120, 29 + y0, 125, 33 + y0], fill=CHROME)
    d.rectangle([4, 29 + y0, 9, 33 + y0], fill=CHROME)
    d.rectangle([119, 23 + y0, 123, 26 + y0], fill=(255, 236, 140, 255))
    d.rectangle([7, 23 + y0, 9, 26 + y0], fill=(230, 40, 40, 255))
    # caixas de roda
    d.ellipse([16, 26 + y0, 42, 46 + y0], fill=ARCH)
    d.ellipse([84, 26 + y0, 110, 46 + y0], fill=ARCH)
    wheel(d, 29, 37, f)
    wheel(d, 97, 37, f)
    # fumaca do escapamento
    for k in range(3):
        r = 2 + k + (f % 2)
        x = 4 - k * 4 - f
        d.ellipse([x - r, 32 + y0 - k * 2 - r, x + r, 32 + y0 - k * 2 + r], fill=(170, 170, 170, 150 - k * 40))
    # contorno escuro de 1px: carro branco nao some em mapa claro
    a = im.split()[3]
    solid = a.point(lambda v: 255 if v > 200 else 0)
    grow = solid.filter(ImageFilter.MaxFilter(3))
    edge = Image.new('RGBA', im.size, OUTLINE)
    edge.putalpha(grow)
    edge.alpha_composite(im)
    return edge


def main():
    sheet = Image.new('RGBA', (CELL * 4, CELL), (0, 0, 0, 0))
    for f in range(4):
        big = frame(f).resize((W * 2, H * 2), Image.NEAREST)
        # roda (centro y=37, raio 9) termina em y=46 do pixel art -> 92 ampliado
        sheet.alpha_composite(big, (f * CELL, WHEEL_BOTTOM - 2 * 46))
    out = ROOT / 'assets/fx/et-car.png'
    sheet.save(out, optimize=True)
    print('ok', out, sheet.size)
    if '--preview' in sys.argv:
        pv = Image.new('RGBA', sheet.size, (60, 60, 72, 255))
        pv.alpha_composite(sheet)
        pv.save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
