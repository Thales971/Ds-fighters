#!/usr/bin/env python3
"""Refaz o atlas de habilidades do DEV VETERANO (assets/abilities/dev-veterano.png,
4x5 celulas de 128) a partir da folha do dono (arte-fonte/personagens/
habilidades-dev-veterano.png, fundo cinza). O atlas antigo cortava os objetos
no meio (punho pela metade, correntes cortadas, besouro com borda quadrada).
Aqui cada objeto e detectado inteiro (componente conexo, faiscas juntas) e
centralizado na celula, com margem. Linhas: 0 tiro anti-bug, 1 soco 1TB,
2 correntes, 3 saraivada de besouros, 4 turbina de socos (ult)."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens/habilidades-dev-veterano.png'
OUT = ROOT / 'assets/abilities/dev-veterano.png'
S = 128

im = Image.open(SRC).convert('RGBA')
a = np.array(im).astype(np.int16)
H, W = a.shape[:2]
corners = np.concatenate([a[:8, :8, :3].reshape(-1, 3), a[:8, -8:, :3].reshape(-1, 3), a[-8:, :8, :3].reshape(-1, 3), a[-8:, -8:, :3].reshape(-1, 3)])
bg = np.median(corners, axis=0)
dist = np.sqrt(((a[..., :3] - bg) ** 2).sum(-1))
sat = a[..., :3].max(-1) - a[..., :3].min(-1)
alpha = np.clip((np.maximum(dist - 18, 0) * 5 + np.maximum(sat - 20, 0) * 3), 0, 255).astype(np.uint8)
mask = alpha > 40

# faixas das 5 linhas pela projecao horizontal
rows = mask.any(axis=1)
bands, y, inb = [], 0, False
for yy in range(H):
    if rows[yy] and not inb: start, inb = yy, True
    if not rows[yy] and inb:
        if yy - start > 40: bands.append((start, yy))
        inb = False
if inb: bands.append((start, H))
bands = sorted(bands, key=lambda b: b[1] - b[0], reverse=True)[:5]
bands.sort()
assert len(bands) == 5, bands

rgba = np.array(im)
rgba[..., 3] = alpha
atlas = Image.new('RGBA', (S * 4, S * 5), (0, 0, 0, 0))
for r, (y0, y1) in enumerate(bands):
    m = mask[y0:y1]
    # a ult tem os grupos de punhos muito juntos: junta menos pra nao virar um bloco so
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3 if r == 4 else 10))
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        area = int((lab[sl] == i).sum())
        if area < (6000 if r == 4 else 2500): continue
        objs.append((sl[1].start, sl, area))
    if r == 4:
        # ult: as faiscas ligam os 5 grupos de punhos; a folha os espaca por igual,
        # entao a faixa vira 5 fatias iguais e a animacao usa 0,1,2,4 (voando ->
        # punhos -> explosao -> explosao final)
        xs = np.where(m.any(axis=0))[0]
        x0a, x1a = int(xs.min()), int(xs.max()) + 1
        step = (x1a - x0a) / 5
        objs = []
        for k in (0, 1, 2, 4):
            xa, xb = int(x0a + k * step), int(x0a + (k + 1) * step)
            sub = m[:, xa:xb]
            ys = np.where(sub.any(axis=1))[0]
            cs = np.where(sub.any(axis=0))[0]
            objs.append((xa, (slice(ys.min(), ys.max() + 1), slice(xa + cs.min(), xa + cs.max() + 1)), 10 ** 9 - k))
    objs.sort(key=lambda o: o[2], reverse=True)
    pick = sorted(objs[:4], key=lambda o: o[0])
    while len(pick) < 4: pick.append(pick[-1])
    for c, (_, sl, _) in enumerate(pick):
        crop = Image.fromarray(rgba[y0:y1][sl])
        crop.thumbnail((S - 8, S - 8), Image.LANCZOS)
        atlas.alpha_composite(crop, (c * S + (S - crop.width) // 2, r * S + (S - crop.height) // 2))
atlas.save(OUT)
print('ok', OUT, atlas.size, [b for b in bands])
