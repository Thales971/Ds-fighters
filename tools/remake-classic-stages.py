#!/usr/bin/env python3
"""Recria os 10 cenarios classicos animados (assets/stages/01..10) no nivel
visual dos mapas novos (ilustracao digital rica), mantendo o layout do jogo:
folha 6x4 = 24 quadros de 960x540, 10 fps, fundo RGBA.

Entrada: artes base geradas por IA em .vibe/gen/<id>.jpg (1152x896).
Saida: assets/stages/<id>.png (5760x2160) — mesmo formato dos atuais.

Animacao procedural por tema, loop perfeito em 24 quadros:
  - pulso em areas luminosas (LEDs, neon, telas) com fase por regiao
  - chuva de codigo / particulas caindo (02, 10)
  - vapor subindo (03, 06), pluie fina (04), estrelas/particulas (09)
  - faixa inferior (y >= 428) e' sempre piso limpo escuro com linhas sutis,
    para os lutadores nao brigarem com a arte.

Uso: python3 tools/remake-classic-stages.py [id...]
"""
import math
import sys
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / '.vibe/gen'
OUT = ROOT / 'assets/stages'

FW, FH, COLS, ROWS, N = 960, 540, 6, 4, 24
FLOOR_Y = 428  # abaixo disso o jogo cobre com gradiente escuro; mantemos piso limpo

IDS = [
    '01-centro-de-dados', '02-chuva-de-codigo', '03-laboratorio-95',
    '04-neon-city-exe', '05-fight-exe', '06-fabrica-de-bugs',
    '07-placa-mae', '08-startup-3am', '09-deploy-nas-nuvens', '10-arena-git',
]

# animacao por tema: glow=intensidade do pulso nas luzes, drops=particulas caindo,
# rise=vapor subindo, flicker=luzes piscando, drift=deslocamento horizontal lento
CFG = {
    '01-centro-de-dados': dict(glow=0.5, flicker=0.35, tint=(60, 160, 255)),
    '02-chuva-de-codigo': dict(glow=0.35, drops='code', tint=(60, 255, 120)),
    '03-laboratorio-95': dict(glow=0.4, rise=0.5, flicker=0.2, tint=(90, 255, 170)),
    '04-neon-city-exe': dict(glow=0.55, flicker=0.25, rain=True, tint=(255, 79, 216)),
    '05-fight-exe': dict(glow=0.6, flicker=0.4, drift=2.0, tint=(255, 59, 92)),
    '06-fabrica-de-bugs': dict(glow=0.5, rise=0.7, flicker=0.45, tint=(255, 176, 59)),
    '07-placa-mae': dict(glow=0.5, flicker=0.5, drift=1.0, tint=(57, 255, 176)),
    '08-startup-3am': dict(glow=0.45, flicker=0.2, rise=0.35, tint=(255, 195, 107)),
    '09-deploy-nas-nuvens': dict(glow=0.3, drift=1.5, sparks=True, tint=(168, 228, 255)),
    '10-arena-git': dict(glow=0.45, drops='nodes', drift=1.0, tint=(255, 138, 59)),
}


def load_base(mid):
    im = Image.open(GEN / f'{mid}.jpg').convert('RGB')
    w, h = im.size
    nh = int(w * 9 / 16)
    top = max(0, (h - nh) // 2)
    im = im.crop((0, top, w, top + nh)).resize((FW, FH), Image.LANCZOS)
    return im


def smooth_noise(seed, w, h, cell=28):
    rng = np.random.default_rng(seed)
    g = rng.random((h // cell + 2, w // cell + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0


def light_mask(arr):
    hsv = np.asarray(Image.fromarray(arr.astype(np.uint8)).convert('HSV'), dtype=np.float32) / 255.0
    m = ((hsv[..., 2] > 0.62) & (hsv[..., 1] > 0.28)).astype(np.uint8) * 255
    return np.asarray(Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3)), dtype=np.float32) / 255.0


def clean_floor(arr, tint):
    """Forca a faixa de combate a ser piso escuro limpo com linhas de perspectiva."""
    h, w, _ = arr.shape
    ys = np.arange(h, dtype=np.float32)[:, None]
    xs = np.arange(w, dtype=np.float32)[None, :]
    floor = np.clip((ys - FLOOR_Y) / max(1, h - FLOOR_Y), 0, 1)
    base = np.array([16, 14, 26], dtype=np.float32)
    # gradiente do piso: um pouco mais claro perto da linha do chao, escurece embaixo
    shade = 1.0 - 0.55 * floor
    floor_rgb = np.broadcast_to(base[None, None, :] * shade[..., None], (h, w, 3)).copy()
    # linhas de perspectiva convergindo ao centro, bem sutis
    cx = w / 2
    ang = np.arctan2(ys - FLOOR_Y, xs - cx + 1e-6)
    lines = (np.abs(np.sin(ang * 7.0)) > 0.985).astype(np.float32) * floor
    floor_rgb += lines[..., None] * np.array(tint, dtype=np.float32)[None, None, :] * 0.10
    # vinheta horizontal suave no piso
    edge = (np.abs(xs - cx) / (w / 2)) ** 2
    floor_rgb *= (1.0 - 0.35 * edge)[..., None]
    ramp = np.clip((ys - (FLOOR_Y - 26)) / 26.0, 0, 1)[..., None]
    out = arr * (1 - ramp) + floor_rgb * ramp
    return out


def make_particles(mid, n_drops, kind):
    rng = np.random.default_rng(zlib.crc32(mid.encode()) ^ 0x5eed)
    if kind == 'code':
        cols = [(60, 255, 120), (140, 255, 190), (30, 200, 90)]
    elif kind == 'nodes':
        cols = [(255, 200, 80), (120, 255, 160), (255, 120, 120)]
    else:
        cols = [(255, 255, 255)]
    drops = []
    for _ in range(n_drops):
        drops.append(dict(
            x=float(rng.random() * FW), y=float(rng.random() * FH),
            v=float(1.2 + rng.random() * 2.6),
            ln=float(6 + rng.random() * 22) if kind != 'spark' else 4,
            w=1 + int(rng.random() * 2),
            c=cols[int(rng.random() * len(cols))],
            ph=float(rng.random() * N),
        ))
    return drops


def build(mid):
    cfg = CFG[mid]
    base = load_base(mid)
    arr0 = np.asarray(base, dtype=np.float32)
    arr0 = clean_floor(arr0, cfg['tint'])
    mask = light_mask(arr0)
    phase = smooth_noise(zlib.crc32(mid.encode()), FW, FH, cell=34) * 2 * math.pi
    phase2 = smooth_noise(zlib.crc32(mid.encode()) ^ 99, FW, FH, cell=18) * 2 * math.pi
    drift = cfg.get('drift', 0.0)
    drops = make_particles(mid, 90, cfg.get('drops') or ('spark' if cfg.get('sparks') else 'dot')) if (cfg.get('drops') or cfg.get('sparks')) else []
    rain = cfg.get('rain')
    rise_n = int(26 * cfg.get('rise', 0) + 6) if cfg.get('rise') else 0
    rng = np.random.default_rng(11)
    wisps = [dict(x=float(rng.random() * FW), y=float(FLOOR_Y + rng.random() * 60), v=0.3 + rng.random() * 0.7, r=6 + rng.random() * 22, ph=float(rng.random() * N)) for _ in range(rise_n)]
    rain_cols = [np.array([170, 200, 255], dtype=np.float32), np.array([200, 220, 255], dtype=np.float32)]
    raindrops = [dict(x=float(rng.random() * (FW + 80)) - 40, y=float(rng.random() * FH), v=7 + rng.random() * 5, c=rain_cols[int(rng.random() * 2)]) for _ in range(70)] if rain else []

    sheet = Image.new('RGBA', (FW * COLS, FH * ROWS))
    for f in range(N):
        t = f / N
        a = arr0.copy()
        # pulso nas luzes: brightening senoidal com fase espacial (loop perfeito)
        g = cfg['glow'] * (0.5 + 0.5 * np.sin(2 * math.pi * (t * 2 + phase)))
        a += (mask[..., None] * 70.0 * g[..., None])
        if cfg.get('flicker'):
            fl = np.sin(2 * math.pi * (t * 5 + phase2)) * cfg['flicker']
            a += (mask[..., None] * 60.0 * np.clip(fl, -1, 1)[..., None])
        # leve drift horizontal do fundo (ceu/luzes distantes): desloca a mascara de luz
        if drift:
            shift = int(math.sin(2 * math.pi * t) * drift)
            if shift:
                mask = np.roll(mask, shift, axis=1)
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(img)
        # particulas caindo (chuva de codigo / nos / fagulhas)
        for p in drops:
            y = (p['y'] + p['v'] * f * (FH / 24) * 0.6) % (FH + 30) - 15
            x = p['x'] + math.sin(2 * math.pi * (t + p['ph'] / N)) * 3
            alpha = 120 + 80 * math.sin(2 * math.pi * (t * 3 + p['ph']))
            d.line([(x, y), (x, y - p['ln'])], fill=(*p['c'], int(max(40, min(255, alpha)))), width=p['w'])
        # chuva fina (04)
        for p in raindrops:
            y = (p['y'] + p['v'] * f) % (FH + 20) - 10
            d.line([(p['x'], y), (p['x'] - 2, y + 12)], fill=(*p['c'].astype(int), 90), width=1)
        # vapor subindo
        for p in wisps:
            y = FLOOR_Y + 20 - ((p['y'] - FLOOR_Y + p['v'] * f * 2.2) % 120)
            x = p['x'] + math.sin(2 * math.pi * (t + p['ph'] / N)) * 8
            r = p['r'] * (1 + 0.3 * math.sin(2 * math.pi * t + p['ph']))
            d.ellipse([x - r, y - r * 0.5, x + r, y + r * 0.5], fill=(235, 240, 255, 14))
        # brilho ambiente pulsante bem sutil
        arr = np.asarray(img, dtype=np.float32)
        arr += np.array(cfg['tint'], dtype=np.float32)[None, None, :] * (0.02 + 0.02 * math.sin(2 * math.pi * t))
        frame = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
        sheet.paste(frame, ((f % COLS) * FW, (f // COLS) * FH))
    return sheet


def main():
    only = [a for a in sys.argv[1:] if a in IDS]
    todo = only or IDS
    for mid in todo:
        sheet = build(mid)
        out = OUT / f'{mid}.png'
        sheet.save(out, optimize=True)
        print(f'{out.name}: {sheet.size} {out.stat().st_size // 1024} KiB')


if __name__ == '__main__':
    main()
