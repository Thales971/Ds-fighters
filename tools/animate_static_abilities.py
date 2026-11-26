#!/usr/bin/env python3
"""Anima atlas de habilidades que tinham os 4 quadros IGUAIS (efeito parado).

Kira, Milena e Dev Virado vieram de folhas com um unico icone por poder: o
integrate_fighter repetia o icone 4x e o efeito nao mexia em luta. Aqui cada
linha ganha 4 quadros de verdade a partir do icone original, com um estilo de
movimento escolhido pelo tipo do efeito:

  burst  explosao/estrela: nasce pequeno, cresce, gira um pouco e some brilhando
  spin   vortice/runa: gira (90 graus no ciclo) com pulso leve
  pulse  icone/personagem: pulsa e o brilho acende e apaga
  fall   coisas caindo: desce e volta (loop), com rastro
  dash   corrida/rastro: desliza pra frente com fantasmas atras

Fonte: arte-fonte/habilidades-base/<id>.png (o atlas parado original, guardado)
Saida: assets/abilities/<id>.png (4 colunas x 5 linhas de 128 px)

Uso: python3 tools/animate_static_abilities.py [ids...] [--preview dir]
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
S = 128

STYLES = {
    # Dev Virado: as celulas sao ele mesmo dentro do efeito -> pulso/rastro
    'dev-virado': ['dash', 'pulse', 'pulse', 'pulse', 'burst'],
    # Kira: raio, runa, vortice, explosao laranja, burst roxo
    'kira': ['burst', 'spin', 'spin', 'burst', 'burst'],
    # Milena: janela de erro, chicote de luz, fantasma correndo, chuva de janelas, pilha de janelas
    'milena': ['pulse', 'pulse', 'dash', 'fall', 'burst'],
}


def glow(im, radius, amount):
    """halo: borra uma copia, clareia e poe por baixo."""
    blur = im.filter(ImageFilter.GaussianBlur(radius))
    a = np.asarray(blur).astype(float)
    a[..., 3] = np.clip(a[..., 3] * amount, 0, 255)
    a[..., :3] = np.clip(a[..., :3] * 1.25 + 30, 0, 255)
    out = Image.fromarray(a.astype(np.uint8), 'RGBA')
    out.alpha_composite(im)
    return out


def xform(cell, scale=1.0, rot=0.0, dx=0, dy=0, alpha=1.0, bright=1.0):
    w = max(1, int(S * scale))
    im = cell.resize((w, w), Image.LANCZOS)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=False)
    if bright != 1.0:
        rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(bright)
        rgb.putalpha(im.getchannel('A'))
        im = rgb
    if alpha < 1.0:
        a = np.asarray(im).copy()
        a[..., 3] = (a[..., 3] * alpha).astype(np.uint8)
        im = Image.fromarray(a, 'RGBA')
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(im, (int((S - w) / 2 + dx), int((S - w) / 2 + dy)))
    return out


def sparkles(img, f, seed):
    """faiscas em anel que se afastam do centro (burst)."""
    rnd = np.random.default_rng(seed)
    a = np.asarray(img).copy()
    n = 10
    for k in range(n):
        ang = k / n * 2 * math.pi + rnd.uniform(-0.2, 0.2)
        r = 26 + f * 11 + rnd.uniform(-4, 4)
        x, y = int(64 + math.cos(ang) * r), int(64 + math.sin(ang) * r)
        al = max(0, 255 - f * 55)
        for ox, oy in ((0, 0), (1, 0), (0, 1), (-1, 0), (0, -1)):
            if 0 <= x + ox < S and 0 <= y + oy < S:
                a[y + oy, x + ox] = (255, 250, 220, al if (ox, oy) == (0, 0) else al // 2)
    return Image.fromarray(a, 'RGBA')


def frames(cell, style, seed):
    out = []
    for f in range(4):
        if style == 'burst':
            sc = [0.66, 0.86, 0.96, 1.0][f]
            im = xform(cell, sc, rot=[0, 6, 12, 18][f], alpha=[0.95, 1, 1, 0.62][f], bright=[1.0, 1.15, 1.25, 1.1][f])
            im = glow(im, 5, [0.6, 1.0, 1.3, 0.9][f])
            if f >= 1:
                im = sparkles(im, f, seed)
        elif style == 'spin':
            im = xform(cell, [0.96, 1.0, 1.04, 1.0][f], rot=-f * 22.5, bright=[1.0, 1.1, 1.2, 1.1][f])
            im = glow(im, 4, [0.6, 0.9, 1.1, 0.9][f])
        elif style == 'fall':
            im = xform(cell, 0.98, dx=[-3, 0, 3, 0][f], dy=[-9, -3, 3, 9][f])
            ghost = xform(cell, 0.98, dx=[-3, 0, 3, 0][f], dy=[-9, -3, 3, 9][f] - 10, alpha=0.3)
            ghost.alpha_composite(im)
            im = glow(ghost, 3, 0.6)
        elif style == 'dash':
            dx = [-8, -2, 4, 9][f]
            base = Image.new('RGBA', (S, S), (0, 0, 0, 0))
            for g, al in ((-22, 0.18), (-12, 0.32)):
                base.alpha_composite(xform(cell, 1.0, dx=dx + g, alpha=al, bright=1.3))
            base.alpha_composite(xform(cell, 1.0, dx=dx, bright=[1.0, 1.1, 1.2, 1.1][f]))
            im = glow(base, 3, [0.5, 0.8, 1.0, 0.8][f])
        else:  # pulse
            im = xform(cell, [0.94, 1.0, 1.06, 1.0][f], bright=[0.95, 1.1, 1.3, 1.1][f])
            im = glow(im, 5, [0.4, 0.8, 1.2, 0.8][f])
        out.append(im)
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    pv = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    if pv in args:
        args.remove(pv)
    ids = args or list(STYLES)
    for fid in ids:
        src = Image.open(ROOT / f'arte-fonte/habilidades-base/{fid}.png').convert('RGBA')
        rows = src.height // S
        atlas = Image.new('RGBA', (S * 4, S * rows), (0, 0, 0, 0))
        for r in range(rows):
            cell = src.crop((0, r * S, S, (r + 1) * S))
            st = STYLES[fid][r] if r < len(STYLES[fid]) else 'pulse'
            for c, im in enumerate(frames(cell, st, seed=r * 7 + 1)):
                atlas.alpha_composite(im, (c * S, r * S))
        atlas.save(ROOT / f'assets/abilities/{fid}.png', optimize=True)
        print('ok', fid)
        if pv:
            bg = Image.new('RGBA', atlas.size, (40, 40, 52, 255))
            bg.alpha_composite(atlas)
            bg.save(Path(pv) / f'anim_{fid}.png')


if __name__ == '__main__':
    main()
