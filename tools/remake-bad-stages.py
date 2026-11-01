#!/usr/bin/env python3
"""Refaz os piores classicos animados (06, 08, 09) no padrao dos mapas bons:

- base = JPG de alta qualidade em assets/stages/source/<id>.jpg (arte densa,
  gerada por IA, 1152x896 -> crop 16:9 -> 960x540)
- animacao SOMENTE em cima da arte: pulso em pixels ja luminosos (luzes/neon/
  telas), vapor subindo, faiscas, nuvens mexendo leve — igual animate-maps.py.
  O chao e a arte permanecem intactos (nao reconstrui nada).
- saida: assets/stages/<id>.png folha 6x4 de 960x540, 24 frames, loop perfeito.

Uso: python3 tools/remake-bad-stages.py [id...]
"""
import math
import sys
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/stages/source'
OUT = ROOT / 'assets/stages'
FW, FH, COLS, ROWS, N = 960, 540, 6, 4, 24

IDS = ['06-fabrica-de-bugs', '08-startup-3am', '09-deploy-nas-nuvens']

CFG = {
    '06-fabrica-de-bugs': dict(glow=0.55, flicker=0.5, rise=0.8, sparks=60, tint=(255, 176, 59)),
    '08-startup-3am': dict(glow=0.4, flicker=0.25, rise=0.45, sparks=0, tint=(255, 195, 107)),
    '09-deploy-nas-nuvens': dict(glow=0.3, flicker=0.15, drift=2.0, sparks=26, tint=(255, 210, 140)),
}


def load_base(mid):
    im = Image.open(SRC / f'{mid}.jpg').convert('RGB')
    w, h = im.size
    nh = int(w * 9 / 16)
    top = max(0, (h - nh) // 2)
    return im.crop((0, top, w, top + nh)).resize((FW, FH), Image.LANCZOS)


def smooth_noise(seed, w, h, cell=30):
    rng = np.random.default_rng(seed)
    g = rng.random((h // cell + 2, w // cell + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0


def light_mask(arr):
    """Pixels ja luminosos e saturados da arte (luzes, neon, telas, fogo)."""
    hsv = np.asarray(Image.fromarray(arr.astype(np.uint8)).convert('HSV'), dtype=np.float32) / 255.0
    m = ((hsv[..., 2] > 0.6) & (hsv[..., 1] > 0.25)).astype(np.uint8) * 255
    return np.asarray(Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3)), dtype=np.float32) / 255.0


def build(mid):
    cfg = CFG[mid]
    base = np.asarray(load_base(mid), dtype=np.float32)
    mask = light_mask(base)
    phase = smooth_noise(zlib.crc32(mid.encode()), FW, FH, cell=36) * 2 * math.pi
    phase2 = smooth_noise(zlib.crc32(mid.encode()) ^ 77, FW, FH, cell=16) * 2 * math.pi
    rng = np.random.default_rng(zlib.crc32(mid.encode()) ^ 0xbeef)
    # vapor subindo (fabrica/escritorio) ou faiscas (fogo/ceu)
    wisps = []
    if cfg.get('rise'):
        for _ in range(int(30 * cfg['rise'])):
            wisps.append(dict(x=float(rng.random() * FW), y=float(FH * 0.45 + rng.random() * FH * 0.5),
                              v=0.35 + rng.random() * 0.8, r=7 + rng.random() * 24, ph=float(rng.random() * N)))
    sparks = []
    if cfg.get('sparks'):
        cols = [(255, 190, 90), (255, 230, 160), (255, 140, 50)] if mid != '09-deploy-nas-nuvens' else [(255, 255, 255), (255, 220, 160)]
        for _ in range(cfg['sparks']):
            sparks.append(dict(x=float(rng.random() * FW), y=float(rng.random() * FH),
                               v=float(0.8 + rng.random() * 2.2), ln=float(4 + rng.random() * 14),
                               w=1 + int(rng.random() * 2), c=cols[int(rng.random() * len(cols))], ph=float(rng.random() * N)))
    drift = cfg.get('drift', 0.0)

    sheet = Image.new('RGBA', (FW * COLS, FH * ROWS))
    for f in range(N):
        t = f / N
        a = base.copy()
        # pulso nas luzes da propria arte (fase espacial -> cada luz pisca em hora diferente)
        g = cfg['glow'] * (0.5 + 0.5 * np.sin(2 * math.pi * (t * 2 + phase)))
        a += mask[..., None] * 62.0 * g[..., None]
        if cfg.get('flicker'):
            fl = np.sin(2 * math.pi * (t * 5 + phase2)) * cfg['flicker']
            a += mask[..., None] * 55.0 * np.clip(fl, -1, 1)[..., None]
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        for p in sparks:
            y = (p['y'] + p['v'] * f * 0.9) % (FH + 24) - 12 if mid != '09-deploy-nas-nuvens' else (p['y'] - p['v'] * f * 0.5) % (FH + 24) - 12
            x = p['x'] + math.sin(2 * math.pi * (t + p['ph'] / N)) * 4 + (drift * math.sin(2 * math.pi * t) if drift else 0)
            alpha = 130 + 90 * math.sin(2 * math.pi * (t * 3 + p['ph']))
            d.line([(x, y), (x, y - p['ln'])], fill=(*p['c'], int(max(50, min(255, alpha)))), width=p['w'])
        for p in wisps:
            y = FH + 10 - ((p['y'] + p['v'] * f * 2.0) % 200)
            x = p['x'] + math.sin(2 * math.pi * (t + p['ph'] / N)) * 9
            r = p['r'] * (1 + 0.25 * math.sin(2 * math.pi * t + p['ph']))
            d.ellipse([x - r, y - r * 0.5, x + r, y + r * 0.5], fill=(235, 238, 245, 12))
        # leve "respiracao" de luz ambiente na cor do tema
        arr = np.asarray(img, dtype=np.float32)
        arr += np.array(cfg['tint'], dtype=np.float32)[None, None, :] * (0.015 + 0.02 * math.sin(2 * math.pi * t))
        frame = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
        sheet.paste(frame, ((f % COLS) * FW, (f // COLS) * FH))
    return sheet


def main():
    todo = [a for a in sys.argv[1:] if a in IDS] or IDS
    for mid in todo:
        sheet = build(mid)
        out = OUT / f'{mid}.png'
        sheet.save(out, optimize=True)
        print(f'{out.name}: {sheet.size} {out.stat().st_size // 1024} KiB')


if __name__ == '__main__':
    main()
