#!/usr/bin/env python3
"""Gera os 3 mapas novos (dojo-noite, circo, pizzaria) no padrao dos bons:

- base = JPG de alta qualidade em .vibe/gen5/<id>.jpg (arte densa, 1152x896)
  -> crop 16:9 -> 960x540, salvo tambem como assets/maps/<id>.jpg (fallback)
- animacao leve igual animate-maps.py: so pulso nas luzes ja existentes na
  arte (mascara de pixels luminosos com fase por regiao) + particulas do tema
  (brasas no forno, poeira no circo, vapor na pizzaria). Chao preservado.
- saida: assets/maps/anim/<id>.png folha 6x4 de 480x270 (formato MAP_ANIM) +
  registro em assets/maps/anim.js + entrada em js/data/stages.js.

Uso: python3 tools/make-new-stages.py
"""
import math
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / '.vibe/gen5'
OUT_ANIM = ROOT / 'assets/maps/anim'
OUT_MAPS = ROOT / 'assets/maps'

FW, FH, COLS, ROWS, N = 480, 270, 6, 4, 24

STAGES = {
    'dojo-noite': dict(name='Dojo à Noite', mech='gong', tint='#ff9a5c', glow=0.5, flicker=0.3, sparks=40, spark_col=[(255, 190, 90), (255, 220, 150)]),
    'circo': dict(name='Circo Abandonado', mech='spotlight', tint='#ffb03b', glow=0.45, flicker=0.4, sparks=60, spark_col=[(255, 230, 160), (255, 255, 255)]),
    'pizzaria': dict(name='Pizzaria à Noite', mech='coffee', tint='#ff6a2a', glow=0.55, flicker=0.35, sparks=50, spark_col=[(255, 120, 40), (255, 200, 90)]),
}


def load_base(mid):
    im = Image.open(GEN / f'{mid}.jpg').convert('RGB')
    w, h = im.size
    nh = int(w * 9 / 16)
    top = max(0, (h - nh) // 2)
    return im.crop((0, top, w, top + nh)).resize((FW, FH), Image.LANCZOS)


def smooth_noise(seed, w, h, cell=24):
    rng = np.random.default_rng(seed)
    g = rng.random((h // cell + 2, w // cell + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0


def light_mask(arr):
    hsv = np.asarray(Image.fromarray(arr.astype(np.uint8)).convert('HSV'), dtype=np.float32) / 255.0
    m = ((hsv[..., 2] > 0.62) & (hsv[..., 1] > 0.28)).astype(np.uint8) * 255
    return np.asarray(Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255.0


def build(mid):
    cfg = STAGES[mid]
    base = np.asarray(load_base(mid), dtype=np.float32)
    mask = light_mask(base)
    phase = smooth_noise(zlib.crc32(mid.encode()), FW, FH, cell=26) * 2 * math.pi
    phase2 = smooth_noise(zlib.crc32(mid.encode()) ^ 31, FW, FH, cell=13) * 2 * math.pi
    rng = np.random.default_rng(zlib.crc32(mid.encode()) ^ 0x5eed)
    sparks = [dict(x=float(rng.random() * FW), y=float(FH * 0.3 + rng.random() * FH * 0.6),
                   v=float(0.3 + rng.random() * 1.2), ln=float(3 + rng.random() * 9),
                   w=1, c=cfg['spark_col'][int(rng.random() * len(cfg['spark_col']))], ph=float(rng.random() * N))
              for _ in range(cfg['sparks'])]
    sheet = Image.new('RGB', (FW * COLS, FH * ROWS))
    base_img = Image.fromarray(base.astype(np.uint8))
    for f in range(N):
        t = f / N
        a = base.copy()
        g = cfg['glow'] * (0.5 + 0.5 * np.sin(2 * math.pi * (t * 2 + phase)))
        a += mask[..., None] * 55.0 * g[..., None]
        fl = np.sin(2 * math.pi * (t * 5 + phase2)) * cfg['flicker']
        a += mask[..., None] * 50.0 * np.clip(fl, -1, 1)[..., None]
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(img)
        for p in sparks:
            y = (p['y'] - p['v'] * f * 0.8) % (FH + 16) - 8
            x = p['x'] + math.sin(2 * math.pi * (t + p['ph'] / N)) * 3
            alpha = 120 + 90 * math.sin(2 * math.pi * (t * 3 + p['ph']))
            d.line([(x, y), (x, y + p['ln'])], fill=(*p['c'], int(max(50, min(255, alpha)))), width=p['w'])
        arr = np.asarray(img, dtype=np.float32)
        arr += np.array([int(cfg['tint'][i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32)[None, None, :] * (0.012 + 0.018 * math.sin(2 * math.pi * t))
        sheet.paste(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), ((f % COLS) * FW, (f // COLS) * FH))
    return sheet, base_img


def main():
    anim_js = "/* Gerado por tools/make-new-stages.py — mapas novos animados (24 quadros). */\nconst MAP_ANIM = {\n"
    entries = []
    for mid, cfg in STAGES.items():
        sheet, base_img = build(mid)
        sheet.save(OUT_ANIM / f'{mid}.png', optimize=True)
        base_img.resize((960, 540), Image.LANCZOS).save(OUT_MAPS / f'{mid}.jpg', quality=92)
        entries.append((mid, cfg))
        anim_js += f' "{mid}": {{\n  "sheet": "assets/maps/anim/{mid}.png",\n  "cols": {COLS},\n  "rows": {ROWS},\n  "frames": {N},\n  "fps": 10,\n  "frameW": {FW},\n  "frameH": {FH}\n }},\n'
        print(mid, 'ok', sheet.size)
    # preserva entradas antigas do anim.js
    old = (ROOT / 'assets/maps/anim.js').read_text(encoding='utf-8')
    if 'MAP_ANIM' in old:
        body = old[old.find('{', old.find('MAP_ANIM')) + 1: old.rfind('};')]
        anim_js = anim_js + body
    anim_js = anim_js.rstrip().rstrip(',') + '\n};\n'
    (ROOT / 'assets/maps/anim.js').write_text(anim_js, encoding='utf-8')
    print('anim.js atualizado')
    # stages.js: adiciona entradas novas antes do fechamento
    sp = ROOT / 'js/data/stages.js'
    s = sp.read_text(encoding='utf-8')
    add = ''
    for mid, cfg in entries:
        weather = "['clear', 'wind']" if mid == 'circo' else "['clear', 'rain']"
        add += f"  {{ id: '{mid}', name: '{cfg['name']}', image: 'assets/maps/{mid}.jpg', group: 'Novos V6', weather: {weather}, fauna: [], mech: '{cfg['mech']}', tint: '{cfg['tint']}' }},\n"
    marker = '];\n\n/* Compatibilidade com código antigo. */'
    assert marker in s
    s = s.replace(marker, add + marker)
    sp.write_text(s, encoding='utf-8')
    print('stages.js atualizado')


if __name__ == '__main__':
    main()
