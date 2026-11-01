#!/usr/bin/env python3
"""Normaliza blocos RGBA 4x8 + 4x7 no contrato 320x260 do DS Fighters.
Uso: python3 tools/refine-sprites.py /pasta/dos/blocos urbano stack qwen
Não remove fundos: os mestres precisam ter alpha nativo. Preserva fotos originais.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
FW, FH, BASE = 320, 260, 246
POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']
HEIGHTS = [202, 202, 193, 135, 202, 202, 134, 134, 193, 193, 202, 196, 200, 80, 202]


def subject(cell):
    arr = np.asarray(cell.convert('RGBA')).copy()
    mask = arr[..., 3] > 32
    labels, n = ndimage.label(ndimage.binary_dilation(mask, iterations=3))
    if not n:
        raise ValueError('Célula sem figura')
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    # Só o corpo principal: partes de poses vizinhas não são efeitos do lutador.
    keep = labels == int(np.argmax(sizes) + 1)
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    out = Image.fromarray(arr)
    box = out.getbbox()
    if box is None:
        raise ValueError('Figura sem alpha válido')
    return out.crop(box)


def figures(master, cid, block, expected_count=None):
    """O gerador deixa alturas variáveis: isola corpos completos antes de montar."""
    arr = np.asarray(master.convert('RGBA'))
    mask = arr[..., 3] > 32
    labels, n = ndimage.label(ndimage.binary_dilation(mask, iterations=4))
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    boxes = ndimage.find_objects(labels)
    expected = 28 if block == 1 or cid == 'urbano' else 32
    if cid in ('thl', 'dolynho') and block == 0 and int(np.count_nonzero(sizes >= 3000)) < 32:
        expected = 28
    if expected_count is not None:
        expected = expected_count
    ids = sorted(range(1, n + 1), key=lambda i: sizes[i - 1], reverse=True)[:expected]
    if len(ids) != expected or min(sizes[i - 1] for i in ids) < 3000:
        raise ValueError(f'{cid}-{block}: número de corpos completos inesperado')
    ids.sort(key=lambda i: (boxes[i - 1][0].start + boxes[i - 1][0].stop) / 2)
    rows = []
    for start in range(0, expected, 4):
        group = ids[start:start + 4]
        group.sort(key=lambda i: boxes[i - 1][1].start)
        cells = []
        for i in group:
            yy, xx = boxes[i - 1]
            crop = arr[yy, xx].copy()
            crop[..., 3] = np.where(labels[yy, xx] == i, crop[..., 3], 0)
            cells.append(subject(Image.fromarray(crop)))
        rows.append(cells)
    if cid == 'urbano' and block == 0:
        # O mestre tem 7 linhas: o quadro agachado da linha de soco já contém
        # a guarda correta. Reutiliza esta pose inteira, sem inventar pixels.
        rows.insert(3, [rows[3][0].copy() for _ in range(4)])
    return rows


def build(src, cid):
    sheet = Image.new('RGBA', (FW * 4, FH * 15))
    records = []
    for block, (start, rows) in enumerate([(0, 8), (8, 7)]):
        master = Image.open(src / f'{cid}-{block}.png')
        if master.mode != 'RGBA' or master.getextrema()[3][0] != 0:
            raise ValueError(f'{cid}-{block}: alpha nativo ausente')
        source_rows = figures(master, cid, block)
        if cid in ('thl', 'dolynho') and block == 0 and len(source_rows) == 7:
            # Ambos mestres omitiram cpunch: integra os quadros corretos gerados,
            # sem achatar uma pose em pé ou duplicar a guarda.
            extra = figures(Image.open(src / 'cpunch-extra.png'), 'cpunch-extra', 0, expected_count=8)
            source_rows.insert(6, extra[0 if cid == 'thl' else 1])
        if len(source_rows) != rows:
            raise ValueError(f'{cid}-{block}: faltam poses para o contrato')
        for local_row in range(rows):
            row = start + local_row
            for col in range(4):
                fig = source_rows[local_row][col]
                scale = min(HEIGHTS[row] / fig.height, (FW - 24) / fig.width)
                width, height = max(1, round(fig.width * scale)), max(1, round(fig.height * scale))
                fig = fig.resize((width, height), Image.Resampling.NEAREST)
                # O pé de apoio ancora o torso, em vez de recentralizar pelo punho.
                alpha = np.asarray(fig)[..., 3] > 80
                if row == 13:
                    pivot = width / 2
                else:
                    band = alpha[max(0, height - max(4, height // 14)):]
                    xs = np.where(band)[1]
                    pivot = float(np.median(xs)) if len(xs) else width / 2
                x = max(8, min(FW - width - 8, round(FW / 2 - pivot)))
                y = BASE - height
                sheet.alpha_composite(fig, (col * FW + x, row * FH + y))
                records.append({'pose': POSES[row], 'frame': col, 'bounds': [x, y, x + width, BASE]})
    target = ROOT / f'assets/sprites/{cid}.png'
    sheet.save(target, optimize=True)
    idle = sheet.crop((0, 0, FW, FH))
    box = idle.getbbox()
    head = idle.crop((max(0, box[0] - 5), box[1], min(FW, box[2] + 5), min(FH, box[1] + round((box[3] - box[1]) * .38))))
    side = max(head.size)
    face = Image.new('RGBA', (side, side))
    face.alpha_composite(head, ((side - head.width) // 2, (side - head.height) // 2))
    face.resize((168, 168), Image.Resampling.NEAREST).save(ROOT / f'assets/ui/face-{cid}.png')
    portrait = Image.new('RGBA', (320, 360))
    portrait.alpha_composite(idle.crop(box), ((320 - (box[2] - box[0])) // 2, 360 - (box[3] - box[1])))
    portrait.save(ROOT / f'assets/ui/portrait-{cid}.png')
    print(f'{cid}: 60 quadros, {target.stat().st_size} bytes')
    return records


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('fighters', nargs='+')
    args = parser.parse_args()
    result = {cid: build(args.source, cid) for cid in args.fighters}
    target = ROOT / 'assets/sprites/refined-frames.json'
    previous = json.loads(target.read_text()) if target.exists() else {'version': 1, 'baseline': BASE, 'frames': {}}
    previous['frames'].update(result)
    target.write_text(json.dumps(previous, indent=2) + '\n')
