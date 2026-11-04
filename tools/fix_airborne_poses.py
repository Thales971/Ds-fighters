#!/usr/bin/env python3
"""Corrige a pose de pulo das folhas 4x15 refinadas (mis, nina-vector, gemini,
meta, deepseek, kimi): nelas a arte do pulo tinha os pes plantados no fundo da
celula (y=245), igual a uma pose de chao — no jogo o personagem parecia
"meio que no chao" mesmo no ar. O padrao do elenco (ex.: du) e deixar ~26px de
ar sob os pes na linha jump. Este script sobe o conteudo das 4 celulas da
linha jump para que o pe mais baixo fique em y=220.

Uso: python3 tools/fix_airborne_poses.py            (os 6 suspeitos)
     python3 tools/fix_airborne_poses.py <id> ...     (folhas especificas)
Idempotente: se o pe ja esta em y<=222, nao mexe.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / 'assets/sprites'
CW, CH, BASE, TARGET = 320, 260, 246, 220
SUSPECTS = ['mis', 'nina-vector', 'gemini', 'meta', 'deepseek', 'kimi']
JUMP_ROW = 2


def lowest_foot(cell: np.ndarray) -> int:
    a = cell[..., 3] > 32
    ys = np.where(a.any(axis=1))[0]
    return int(ys.max()) if len(ys) else -1


def fix_sheet(fid: str) -> bool:
    path = SPR / f'{fid}.png'
    im = np.asarray(Image.open(path).convert('RGBA')).copy()
    changed = False
    for c in range(4):
        cell = im[JUMP_ROW * CH:(JUMP_ROW + 1) * CH, c * CW:(c + 1) * CW]
        foot = lowest_foot(cell)
        if foot < 0 or foot <= TARGET + 2:
            continue
        shift = foot - TARGET
        moved = np.zeros_like(cell)
        moved[:-shift or None, :, :] = cell[shift:, :, :]
        im[JUMP_ROW * CH:(JUMP_ROW + 1) * CH, c * CW:(c + 1) * CW] = moved
        changed = True
        print(f'{fid}: jump f{c} pe y={foot} -> y={foot - shift} (sobe {shift}px)')
    if changed:
        Image.fromarray(im).save(path)
    else:
        print(f'{fid}: jump ja ok')
    return changed


def main() -> None:
    ids = sys.argv[1:] or SUSPECTS
    for fid in ids:
        fix_sheet(fid)


if __name__ == '__main__':
    main()
