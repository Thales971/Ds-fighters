#!/usr/bin/env python3
"""Atlas de habilidades do KERNOR (chefe final do torneio) — arte do dono.
Fontes: arte-fonte/kernor-chefe-torneio/'Kernelor habilidades {1,2,4,6}.jpg' (grade 4x2;
a 3 e copia da 2 e a 5 tem fundos escuros — a 6 tem as mesmas pecas limpas).
Saidas: assets/abilities/kernor.png (4x10: 1 linha por poder) e
kernor-extra.png (4x2: linha 0 = campo de espinhos/buraco no chao, linha 1 = impacto).
Uso: python3 tools/build_kernor_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ciber_fx import S, bright, fit, key_out, place  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/kernor-chefe-torneio'
G = [(c * 296 + 6, r * 448 + 6, c * 296 + 290, r * 448 + 442) for r in range(2) for c in range(4)]
SHEETS = {
    'Kernelor habilidades 1.jpg': ['saw', 'rockburst', 'fists', 'pillar', 'starburst', 'wheel', 'eye', 'hole'],
    'Kernelor habilidades 2.jpg': ['wheelcrash', 'blades', 'xred', 'orb', 'servers', 'fistsred', 'reticle', 'sawring'],
    'Kernelor habilidades 4.jpg': ['turret', 'spikeorb', 'disc', 'whip', 'redball', 'spikes', 'bolt', 'cage'],
    'Kernelor habilidades 6.jpg': ['groundfist', 'meteor', 'xred2', 'twinwheels', 'eyes3', 'vortex', 'dots', 'glitch'],
}


def build():
    sp = {}
    for fname, names in SHEETS.items():
        im = Image.open(SRC / fname).convert('RGB')
        for k, b in zip(names, G):
            sp[k] = key_out(im.crop(b))
    atlas = Image.new('RGBA', (S * 4, S * 10))
    extra = Image.new('RGBA', (S * 4, S * 2))

    def put(img, r, c, layers):
        cell = Image.new('RGBA', (S, S))
        for spec in layers:
            place(cell, fit(spec[0], S - 6, spec[1]), alpha=spec[2] if len(spec) > 2 else 1.0)
        img.alpha_composite(cell, (c * S, r * S))

    pulse = lambda r, k, sc=1.0: [put(atlas, r, c, [(bright(sp[k], b), sc * s2)]) for c, (b, s2) in enumerate([(1.0, 1.0), (1.2, 0.95), (1.1, 1.0), (1.3, 0.96)])]
    spin = lambda r, k, sc=1.0: [put(atlas, r, c, [(sp[k].rotate(-a, resample=Image.BICUBIC, expand=True), sc)]) for c, a in enumerate([0, 30, 60, 90])]
    # 0 OLHO DO KERNEL (laser)
    pulse(0, 'eye')
    # 1 DISCO SERRA (bumerangue)
    spin(1, 'saw', 0.85)
    # 2 PUNHO DA TERRA
    put(atlas, 2, 0, [(sp['groundfist'], 0.7)]); put(atlas, 2, 1, [(sp['groundfist'], 1.0)])
    put(atlas, 2, 2, [(bright(sp['groundfist'], 1.2), 1.0), (sp['rockburst'], 0.6, 0.6)]); put(atlas, 2, 3, [(sp['rockburst'], 1.0)])
    # 3 MURALHA DE SERVIDORES
    pulse(3, 'servers')
    # 4 KERNEL PANIC ABSOLUTO (ult): mira -> X vermelho -> pilar -> estrela
    put(atlas, 4, 0, [(sp['reticle'], 1.0)]); put(atlas, 4, 1, [(sp['xred'], 1.0)])
    put(atlas, 4, 2, [(sp['pillar'], 1.0), (sp['xred'], 0.6, 0.5)]); put(atlas, 4, 3, [(sp['starburst'], 1.0)])
    # 5 CHUVA DE METEOROS
    pulse(5, 'meteor')
    # 6 ORBES PERSEGUIDORES
    spin(6, 'spikeorb', 0.8)
    # 7 ESPINHOS DO CHAO (cada espinho do campo)
    put(atlas, 7, 0, [(sp['spikes'], 0.5)]); put(atlas, 7, 1, [(sp['spikes'], 0.85)])
    put(atlas, 7, 2, [(bright(sp['spikes'], 1.2), 1.0)]); put(atlas, 7, 3, [(sp['spikes'], 1.0, 0.6)])
    # 8 RAIO DE BUG (mira travada -> raio)
    put(atlas, 8, 0, [(sp['cage'], 1.0)]); put(atlas, 8, 1, [(sp['bolt'], 1.0)])
    put(atlas, 8, 2, [(bright(sp['bolt'], 1.3), 1.0), (sp['cage'], 0.7, 0.5)]); put(atlas, 8, 3, [(sp['bolt'], 1.0, 0.6)])
    # 9 BURACO NEGRO (ult 2)
    put(atlas, 9, 0, [(sp['hole'], 1.0)])
    for c, a in enumerate([0, 40, 80], start=1):
        put(atlas, 9, c, [(sp['vortex'].rotate(-a, resample=Image.BICUBIC), 1.0), (sp['orb'], 0.45, 0.9)])
    # EXTRA 0: buraco negro/portal no chao girando; EXTRA 1: impacto
    for c, a in enumerate([0, 30, 60, 90]):
        put(extra, 0, c, [(sp['hole'], 1.0, 0.9), (sp['vortex'].rotate(a, resample=Image.BICUBIC), 0.5, 0.7)])
    for c, layers in enumerate([[(sp['dots'], 0.5)], [(sp['dots'], 0.9), (sp['xred2'], 0.6, 0.6)], [(sp['twinwheels'], 0.9), (sp['dots'], 0.7, 0.6)], [(sp['dots'], 1.0, 0.45)]]):
        put(extra, 1, c, layers)
    atlas.save(ROOT / 'assets/abilities/kernor.png', optimize=True)
    extra.save(ROOT / 'assets/abilities/kernor-extra.png', optimize=True)
    if '--preview' in sys.argv:
        full = Image.new('RGBA', (S * 4, S * 12), (28, 30, 44, 255))
        full.alpha_composite(atlas); full.alpha_composite(extra, (0, S * 10))
        full.convert('RGB').resize((S * 3, S * 9)).save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    build()
    print('ok')
