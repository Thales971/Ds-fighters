#!/usr/bin/env python3
"""Atlas de habilidades do CYBER-PSICOPATA v2 (arte nova do dono, nov/2026).

Fontes (arte-fonte/personagens/, fundo magenta):
  'Ciber v2 habilidades 1.jpg'  grade 4x2: tiro de canhao | bola de fogo |
      explosao | nuvem de poeira / erupcao | rastro azul | onda de choque | vapor
  'Ciber v2 habilidades 2.jpg'  solta: estrela | cratera | misseis | explosoes /
      laser | lanca-chamas | aura de fogo | glitch vermelho

Saidas:
  assets/abilities/cyber-psicopata.png      4x5 de 128 (1 linha por poder,
      4 quadros que ANIMAM; a coluna 0/1 e o icone da HUD/menu)
  assets/abilities/cyber-psicopata-hit.png  4x1 de 128: explosao de impacto

Uso: python3 tools/build_ciber_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens'
S = 128


def key_out(crop):
    """Magenta -> transparente. O fundo e estimado nas bordas do recorte;
    alpha pela distancia de cor e 'unmix' da borda (sem franja rosa)."""
    a = np.array(crop.convert('RGB')).astype(float)
    edge = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    R, G, B = edge[:, 0], edge[:, 1], edge[:, 2]
    pure = edge[(G < 60) & (R > 110) & (B > 110)]
    bg = np.median(pure if len(pure) else edge, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    magentice = np.minimum(r, b) - g - np.abs(r - b) * 0.8
    alpha = np.clip((d - 50) / 90.0, 0, 1)
    alpha = np.where((magentice > 80) & (d < 110), np.minimum(alpha, (d - 50) / 140.0), alpha)
    alpha = np.clip(alpha, 0, 1)
    al3 = np.maximum(alpha[..., None], 1e-3)
    fg = (a - bg * (1 - al3)) / al3
    spill = np.clip(np.minimum(fg[..., 0], fg[..., 2]) - fg[..., 1], 0, None) * (1 - alpha)
    fg[..., 0] -= spill * 0.7
    fg[..., 2] -= spill * 0.7
    # linhas de grade da folha (roxo escuro fino) e sujeira pequena somem
    solid = alpha > 0.35
    lab, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        small = np.zeros(n + 1, bool)
        small[1:] = sizes < 6
        alpha = np.where(small[lab], 0, alpha)
    out = np.dstack([np.clip(fg, 0, 255), alpha * 255]).astype(np.uint8)
    return trim(Image.fromarray(out, 'RGBA'))


def trim(im, pad=2):
    bbox = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def biggest_blob(im, erode=5, grow=11):
    a = np.array(im.getchannel('A')) > 150
    core = ndimage.binary_erosion(a, iterations=erode // 2)
    lab, n = ndimage.label(core)
    if not n:
        return im
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    keep = ndimage.binary_dilation(lab == (int(np.argmax(sizes)) + 1), iterations=grow // 2)
    arr = np.array(im)
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return trim(Image.fromarray(arr, 'RGBA'))


def fit(im, box=S - 6, scale=1.0):
    k = min(box / im.width, box / im.height) * scale
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def place(cell, im, cx=S / 2, cy=S / 2, alpha=1.0):
    if alpha < 1:
        im = im.copy()
        im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    cell.alpha_composite(im, (int(round(cx - im.width / 2)), int(round(cy - im.height / 2))))


def bright(im, f):
    out = ImageEnhance.Brightness(im.convert('RGB')).enhance(f).convert('RGBA')
    out.putalpha(im.getchannel('A'))
    return out


G1 = [(c * 296 + 8, r * 448 + 8, c * 296 + 288, r * 448 + 440) for r in range(2) for c in range(4)]
N1 = ['muzzle', 'fireball', 'explosion', 'dust', 'eruption', 'trail', 'shock', 'steam']
B2 = {
    'star': (0, 10, 295, 430), 'missiles': (590, 90, 875, 305), 'booms': (880, 20, 1184, 425),
    'laser': (0, 600, 295, 705), 'flame': (295, 470, 592, 800), 'aura': (592, 450, 885, 870), 'glitch': (885, 480, 1184, 850),
}


def load():
    sp = {}
    im1 = Image.open(SRC / 'Ciber v2 habilidades 1.jpg').convert('RGB')
    for name, box in zip(N1, G1):
        sp[name] = key_out(im1.crop(box))
    im2 = Image.open(SRC / 'Ciber v2 habilidades 2.jpg').convert('RGB')
    for name, box in B2.items():
        sp[name] = key_out(im2.crop(box))
    return sp


def build():
    sp = load()
    atlas = Image.new('RGBA', (S * 4, S * 5))

    def put(r, c, layers):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            src, sc = spec[0], spec[1]
            al = spec[2] if len(spec) > 2 else 1.0
            cy = spec[3] if len(spec) > 3 else S / 2
            place(cell, fit(src, S - 6, sc), cy=cy, alpha=al)
        atlas.alpha_composite(cell, (c * S, r * S))

    # 0 CANHAO DE PLASMA: bola de fogo (cauda pra tras), pulsando
    fb = sp['fireball']
    for c, (sc, br) in enumerate([(1.0, 1.0), (0.93, 1.18), (1.0, 1.05), (0.95, 1.25)]):
        put(0, c, [(bright(fb, br), sc)])

    # 1 BOMBARDEIO ANTI-HACKER: um missil por projetil; a chama do motor pisca
    m = biggest_blob(sp['missiles'])
    trio = sp['missiles']
    put(1, 0, [(trio, 1.0)])
    for c, br in enumerate([1.0, 1.25, 1.1], start=1):
        put(1, c, [(bright(m, br), 0.82)])

    # 2 CHUTE FOGUETE: rastro azul do impulso -> onda de choque no impacto
    tr, sh = sp['trail'], sp['shock']
    put(2, 0, [(tr, 0.85)])
    put(2, 1, [(tr, 1.0)])
    put(2, 2, [(tr, 1.0, 0.6), (sh, 0.6)])
    put(2, 3, [(sh, 1.0)])

    # 3 PISAO SISMICO: o chao estoura embaixo do rival (desenhado como coluna)
    er, du = sp['eruption'], sp['dust']
    put(3, 0, [(er, 0.75, 1.0, S / 2 + 14)])
    put(3, 1, [(er, 1.0)])
    put(3, 2, [(du, 0.9, 0.85, S / 2 + 24), (bright(er, 1.15), 0.95)])
    put(3, 3, [(du, 1.0)])

    # 4 CIBERNEUROSE: aura de fogo em volta do corpo (o motor desenha somando
    # luz, entao a silhueta preta some e so a chama fica) + glitch vermelho
    au, gl = sp['aura'], sp['glitch']
    put(4, 0, [(au, 1.0)])
    put(4, 1, [(bright(au.transpose(Image.FLIP_LEFT_RIGHT), 1.15), 0.97)])
    put(4, 2, [(au, 1.03), (gl, 0.8, 0.45)])
    put(4, 3, [(bright(au.transpose(Image.FLIP_LEFT_RIGHT), 1.3), 1.0)])

    # IMPACTO: explosao de fogo e fumaca crescendo e se desfazendo
    hit = Image.new('RGBA', (S * 4, S))
    ex = sp['explosion']
    star = sp['star']
    for c, layers in enumerate([[(star, 0.55)], [(ex, 0.7), (star, 0.5, 0.6)], [(ex, 1.0)], [(ex, 1.0, 0.55)]]):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            place(cell, fit(spec[0], S - 6, spec[1]), alpha=spec[2] if len(spec) > 2 else 1.0)
        hit.alpha_composite(cell, (c * S, 0))

    atlas.save(ROOT / 'assets/abilities/cyber-psicopata.png', optimize=True)
    hit.save(ROOT / 'assets/abilities/cyber-psicopata-hit.png', optimize=True)
    return atlas, hit


if __name__ == '__main__':
    atlas, hit = build()
    print('ok', atlas.size, hit.size)
    if '--preview' in sys.argv:
        dst = sys.argv[sys.argv.index('--preview') + 1]
        full = Image.new('RGBA', (S * 4, S * 6), (28, 30, 44, 255))
        full.alpha_composite(atlas)
        full.alpha_composite(hit, (0, S * 5))
        full.convert('RGB').resize((S * 8, S * 12), Image.NEAREST).save(dst)
