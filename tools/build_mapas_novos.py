#!/usr/bin/env python3
"""Mapas novos do dono (bugs/Novos-mapas/*.jpg, 1184x896) -> assets/maps/*.jpg
960x540. Corta em 16:9 com o chao onde os lutadores pisam (y 458 de 540).
Uso: python3 tools/build_mapas_novos.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'bugs/Novos-mapas'
# (arquivo, saida, y do chao na arte original onde o pe do lutador fica)
MAPS = [
    ('Metropole dia e noite.jpg', 'metropole-dia-noite.jpg', 760),
    ('Churrasco na laje.jpg', 'churrasco-laje.jpg', 740),
    ('Data center abandonado.jpg', 'datacenter-abandonado.jpg', 770),
]
for src, out, foot in MAPS:
    im = Image.open(SRC / src).convert('RGB')
    w, h = im.size
    ch = round(w * 9 / 16)
    y0 = max(0, min(h - ch, round(foot - ch * 458 / 540)))
    im.crop((0, y0, w, y0 + ch)).resize((960, 540), Image.LANCZOS).save(ROOT / 'assets/maps' / out, quality=88, optimize=True)
    print(out, 'y0', y0)
