"""Transforma mapas estáticos em folhas animadas 6x4 (24 quadros, loop perfeito).
Efeitos procedurais por mapa: luzes pulsando (fase própria por região), ondulação
em faixas de água, balanço de folhagem/aurora e brilhos. Saída 640x360 por quadro
com paleta estável de 256 cores e brilho moderado, mantendo o piso firme.
Uso: python3 tools/animate-maps.py [ids...]
Gera assets/maps/anim/<id>.png e assets/maps/anim.js (registro MAP_ANIM).
"""
import json
import math
import sys
import zlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/maps/anim'
FW, FH, N = 640, 360, 24
# faixas em fração da altura: water=(y0,y1,amp), sway=(y0,y1,amp), glow=intensidade
CFG = {
    '11-oficina-latas': dict(src='stage', glow=0.35, sway=None),
    '12-terminal-fosforo': dict(src='stage', glow=0.45, rain=(0.0, 0.62)),
    '13-metro-pacotes': dict(src='stage', glow=0.4),
    '14-catedral-sql': dict(src='stage', glow=0.45, rays=True),
    'spring': dict(glow=0.25, water=(0.64, 0.80, 1.6), sway=(0.0, 0.45, 1.4)),
    'hive': dict(glow=0.4, sway=(0.0, 0.3, 1.0)),
    'docker': dict(glow=0.3, water=(0.50, 0.72, 2.0)),
    'kernel': dict(glow=0.3, water=(0.55, 0.72, 1.4), sway=(0.0, 0.35, 2.0)),
    'rust': dict(glow=0.55),
    'python': dict(glow=0.3, water=(0.56, 0.74, 1.6), sway=(0.0, 0.4, 1.2)),
    'kotlin': dict(glow=0.25, water=(0.52, 0.74, 2.0), sway=(0.0, 0.3, 1.0)),
    'kali': dict(glow=0.5),
    'java': dict(glow=0.45),
    'chrome': dict(glow=0.5, water=(0.70, 0.80, 0.7)),
    'sesi': dict(glow=0.2, rays=True, sway=(0.0, 0.0, 0)),
    'sesi-patio': dict(glow=0.12, rays=True),
    'senai-valinhos': dict(glow=0.15, rays=True),
    'japan': dict(glow=0.12, water=(0.63, 0.74, 0.8), sway=(0.0, 0.23, 0.7)),
    'cyberpunk': dict(glow=0.35),
    '01-neon-rooftop': dict(glow=0.5),
    '02-volcanic-forge': dict(glow=0.55),
    '03-underwater-lab': dict(glow=0.35, water=(0.0, 0.70, 1.2)),
    '04-storm-temple': dict(glow=0.4, sway=(0.0, 0.3, 1.0)),
    '05-chaos-citadel': dict(glow=0.5),
    '06-sakura-dojo': dict(glow=0.25, sway=(0.0, 0.5, 1.4)),
    '07-sky-islands': dict(glow=0.25, sway=(0.0, 0.55, 1.6)),
    '08-crystal-cavern': dict(glow=0.55),
    '09-orbital-core': dict(glow=0.5),
    '10-digital-forest': dict(glow=0.4, sway=(0.0, 0.5, 1.2)),
}


def load_base(mid, cfg):
    if cfg.get('src') == 'stage':
        im = Image.open(ROOT / f'assets/stages/{mid}.png').convert('RGB')
        im = im.crop((0, 0, im.width // 6, im.height // 4))
    else:
        im = Image.open(ROOT / f'assets/maps/{mid}.jpg').convert('RGB')
    return im.resize((FW, FH), Image.LANCZOS)


def smooth_noise(seed, w, h, cell=24):
    rng = np.random.default_rng(seed)
    g = rng.random((h // cell + 2, w // cell + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0


def build(mid):
    cfg = CFG[mid]
    base = load_base(mid, cfg)
    arr = np.asarray(base, dtype=np.float32)
    hsv = np.asarray(base.convert('HSV'), dtype=np.float32) / 255.0
    # máscara de luzes: claro e saturado (neon, lava, telas, lanternas)
    m = ((hsv[..., 2] > 0.72) & (hsv[..., 1] > 0.3)).astype(np.uint8) * 255
    mask = np.asarray(Image.fromarray(m).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255.0
    phase = smooth_noise(zlib.crc32(mid.encode()), FW, FH) * 2 * math.pi
    ys = np.arange(FH)
    rng = np.random.default_rng(7)
    sparks = []
    if cfg.get('water'):
        y0, y1, _ = cfg['water']
        for _ in range(26):
            sparks.append((int(rng.integers(0, FW)), int(rng.integers(int(y0 * FH), max(int(y0 * FH) + 1, int(y1 * FH)))), rng.random() * 2 * math.pi))
    stars = [(int(rng.integers(0, FW)), int(rng.integers(0, int(FH * 0.4))), rng.random() * 2 * math.pi) for _ in range(18)]
    frames = []
    for k in range(N):
        t = 2 * math.pi * k / N
        f = arr.copy()
        g = cfg.get('glow', 0.3)
        if g:
            puls = 1 + g * 0.18 * np.sin(t + phase)
            f = f * (1 + (puls[..., None] - 1) * mask[..., None])
        if cfg.get('sway') and cfg['sway'][2]:
            y0, y1, amp = cfg['sway']
            r0, r1 = int(y0 * FH), int(y1 * FH)
            for y in range(r0, r1):
                w = 1 - (y - r0) / max(1, r1 - r0)
                dx = int(round(amp * w * math.sin(t + y * 0.05)))
                if dx:
                    f[y] = np.roll(f[y], dx, axis=0)
        if cfg.get('water'):
            y0, y1, amp = cfg['water']
            for y in range(int(y0 * FH), min(FH, int(y1 * FH))):
                dx = int(round(amp * math.sin(t * 2 + y * 0.45)))
                if dx:
                    f[y] = np.roll(f[y], dx, axis=0)
            for (x, y, ph) in sparks:
                a = max(0.0, math.sin(t * 2 + ph))
                if a > 0.6:
                    f[y, max(0, x - 1):x + 2] = f[y, max(0, x - 1):x + 2] * (1 - a * 0.7) + 255 * a * 0.7
        if cfg.get('rain'):
            y0, y1 = cfg['rain']
            gm = (hsv[..., 0] > 0.22) & (hsv[..., 0] < 0.45) & (hsv[..., 2] > 0.45)
            shift = int(k * (FH * (y1 - y0)) / N)
            band = slice(int(y0 * FH), int(y1 * FH))
            gl = np.roll(gm[band], shift, axis=0)
            f[band] = np.where(gl[..., None], f[band] * 0.6 + np.array([90, 255, 140]) * 0.4, f[band] * 0.9)
        if cfg.get('rays'):
            xs = np.arange(FW)[None, :]
            ray = np.clip(np.sin((xs + ys[:, None] * 0.6) * 0.035 + t) * 0.5 + 0.5, 0, 1) ** 6
            fade = np.clip(1 - ys / (FH * 0.75), 0, 1)[:, None]
            f = f + (ray * fade * 10)[..., None]
        for (x, y, ph) in ([] if mid in ('sesi', 'sesi-patio', 'senai-valinhos', 'java', 'kali') else stars):
            a = max(0.0, math.sin(t + ph))
            if a > 0.85 and hsv[y, x, 2] < 0.35:
                f[y, x] = 255
        frames.append(np.clip(f, 0, 255).astype(np.uint8))
    sheet = Image.new('RGB', (FW * 6, FH * 4))
    for k, fr in enumerate(frames):
        sheet.paste(Image.fromarray(fr), ((k % 6) * FW, (k // 6) * FH))
    pal = base.quantize(256, method=Image.Quantize.MEDIANCUT)
    sheet = sheet.quantize(palette=pal, dither=Image.Dither.NONE)
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / f'{mid}.png', optimize=True)
    return {'sheet': f'assets/maps/anim/{mid}.png', 'cols': 6, 'rows': 4, 'frames': N, 'fps': 10, 'frameW': FW, 'frameH': FH}


if __name__ == '__main__':
    ids = sys.argv[1:] or list(CFG)
    reg_p = ROOT / 'assets/maps/anim.js'
    reg = {}
    if reg_p.exists():
        txt = reg_p.read_text()
        reg = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    for mid in ids:
        reg[mid] = build(mid)
        print('ok', mid, round((OUT / f'{mid}.png').stat().st_size / 1e6, 2), 'MB')
    reg_p.write_text('/* Gerado por tools/animate-maps.py — mapas estáticos animados (24 quadros). */\nconst MAP_ANIM = ' + json.dumps(reg, indent=1) + ';\n')
