#!/usr/bin/env python3
"""Pets novos (nov/2026) a partir de arte-fonte/pets/*.jpg (arte do dono).

Cada pet vira assets/pets/pet-<id>.png, 4x3 celulas de 96 px:
  linha 0  parado/andando (loop do lado do dono)
  linha 1  susto (dono apanhou): dano, dano 2, machucado, tonto
  linha 2  comemora (dono venceu / pet usou a habilidade)
Folha 1 = movimento (4x2; o elefante vem 2x4), folha 2 = reacoes (4x2):
  (0,0) dano  (1,0) dano 2  (2,0) voando  (3,0) K.O.
  (0,1) machucado  (1,1) tonto  (2,1) guarda  (3,1) vitoria
Uso: python3 tools/build_pets_v2.py
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import integrate_fighter as I  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/pets'
S = 96
# id: (folha movimento, folha reacoes, mapa da folha 1 (idle, andar1, idle2, andar2, pulo))
PETS = {
    'postgres': ('Elefante.jpg', 'elefante 2.jpg', [(0, 0), (1, 0), (0, 0), (0, 1), (0, 2)]),
    'npm': ('unicornio 1.jpg', 'unicornio 2.jpg', [(0, 0), (1, 0), (3, 1), (2, 0), (0, 1)]),
    'mysql': ('golfinho 1.jpg', 'golfinho 2.jpg', [(0, 0), (1, 0), (3, 1), (2, 0), (0, 1)]),
    'stackoverflow': ('Coruja 1.jpg', 'coruja 2.jpg', [(0, 0), (1, 0), (3, 1), (2, 0), (0, 1)]),
    'gopher': ('castor 1.jpg', 'castor 2.jpg', [(0, 0), (1, 0), (3, 1), (2, 0), (0, 1)]),
    'pato': ('pato 1.jpg', 'pato 2.jpg', [(0, 0), (1, 0), (3, 1), (2, 0), (0, 1)]),
}


def figs(name):
    I.load_sheet._strict_mag = False
    I.load_sheet._holes = True
    cells = I.load_sheet(SRC / name, min_sz=800)
    return {k: I.figure_rgba(*v) for k, v in cells.items()}


def put(atlas, fig, col, row, scale):
    f = fig.resize((max(1, int(fig.width * scale)), max(1, int(fig.height * scale))), Image.LANCZOS)
    if f.width > S - 4:
        r = (S - 4) / f.width
        f = f.resize((S - 4, max(1, int(f.height * r))), Image.LANCZOS)
    atlas.alpha_composite(f, (col * S + (S - f.width) // 2, row * S + S - 3 - f.height))


def build(pid):
    a, b, m = PETS[pid]
    A, B = figs(a), figs(b)
    sa = 82 / max(A[k].height for k in m)
    reac = [(0, 0), (1, 0), (0, 1), (1, 1), (3, 1)]
    sb = 84 / max(B[k].height for k in reac)
    atlas = Image.new('RGBA', (S * 4, S * 3))
    for c, k in enumerate(m[:4]):
        put(atlas, A[k], c, 0, sa)
    for c, k in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
        put(atlas, B[k], c, 1, sb)
    for c, (src, k) in enumerate([(B, (3, 1)), (A, m[4]), (B, (3, 1)), (A, m[4])]):
        put(atlas, src[k], c, 2, sb if src is B else sa)
    out = ROOT / f'assets/pets/pet-{pid}.png'
    atlas.save(out, optimize=True)
    I.kill_magenta(out)
    return atlas


if __name__ == '__main__':
    prev = Image.new('RGBA', (S * 4 * 2, S * 3 * 3), (40, 60, 40, 255))
    for i, pid in enumerate(PETS):
        at = build(pid)
        prev.alpha_composite(at, ((i % 2) * S * 4, (i // 2) * S * 3))
        print('ok', pid)
    if '--preview' in sys.argv:
        prev.convert('RGB').save(sys.argv[sys.argv.index('--preview') + 1])
