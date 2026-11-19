#!/usr/bin/env python3
"""Gera o sprite do gorro de natal (acessorio universal) em assets/acc/gorro-natal.png.
Pixel art 72x64 transparente: cone vermelho com faixa branca na base e pompom."""
from PIL import Image, ImageDraw
import os

W, H = 72, 64
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

RED = (214, 42, 42, 255)
RED_D = (160, 24, 24, 255)
RED_L = (240, 90, 80, 255)
WHITE = (248, 250, 255, 255)
SHADE = (210, 216, 235, 255)

# cone do gorro (base larga embaixo, ponta curvada pra direita em cima)
cone = [(12, 50), (60, 50), (58, 22), (48, 10), (38, 6)]
d.polygon(cone, fill=RED)
# contorno escuro do cone
for i in range(len(cone)):
    d.line([cone[i], cone[(i + 1) % len(cone)]], fill=RED_D, width=2)
# dobra da ponta pra direita
d.polygon([(48, 10), (38, 6), (30, 10), (34, 18), (44, 18)], fill=RED)
d.line([(48, 10), (30, 10)], fill=RED_D, width=2)
d.line([(30, 10), (34, 18)], fill=RED_D, width=2)
d.line([(34, 18), (44, 18)], fill=RED_D, width=2)
# brilho do cone
d.line([(18, 46), (40, 12)], fill=RED_L, width=3)

# pompom branco na ponta
d.ellipse([52, 2, 68, 18], fill=WHITE, outline=SHADE, width=2)
d.ellipse([57, 6, 62, 11], fill=SHADE)  # sombrazinha do pompom

# faixa branca da base (por cima do cone)
d.rounded_rectangle([6, 44, 66, 60], radius=7, fill=WHITE, outline=SHADE, width=2)
# fiapos da faixa
d.line([(10, 60), (10, 63)], fill=SHADE, width=2)
d.line([(36, 60), (36, 63)], fill=SHADE, width=2)
d.line([(60, 60), (60, 63)], fill=SHADE, width=2)
# sombra embaixo da faixa
d.line([(8, 58), (64, 58)], fill=SHADE, width=1)

os.makedirs('assets/acc', exist_ok=True)
img.save('assets/acc/gorro-natal.png')
print('assets/acc/gorro-natal.png', img.size)
