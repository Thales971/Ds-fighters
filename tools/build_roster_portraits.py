#!/usr/bin/env python3
"""Retratos do grid de seleção, recortados da folha real de cada lutador.

Cada retrato é um busto quadrado no MESMO tamanho de origem (mesma escala),
ancorado no topo da cabeça. Não desenha pixel art: só recorta o idle da
spritesheet e reduz com vizinho mais próximo.

Saída:
  assets/ui/roster-portraits.png
  js/data/roster-portraits.js   (ordem, cortes e o caminho do atlas)

Uso: python3 tools/build_roster_portraits.py
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / 'assets/sprites'
ATLAS = ROOT / 'assets/ui/roster-portraits.png'
DATA = ROOT / 'js/data/roster-portraits.js'
ROSTER = Path('/tmp/roster.json')

# Janela única, em pixels da célula 320x260. Igual para todos = mesma escala.
SIDE = 136
PAD_TOP = 10
ALPHA = 36
CELL = 96
COLS = 7

# Ajustes finos depois de olhar o contact sheet. dx/dy deslocam a janela.
OVERRIDES = {
    # Nina é piloto+mecha: a caixa larga puxava o centro para a armadura.
    'nina-vector': {'dx': 8, 'side': 150},
    # Ponteiro carrega o cubo ao lado; sobe um pouco para a máscara entrar.
    'ponteiro': {'dy': -6, 'side': 150},
    # Dolynho é baixo e redondo: a janela padrão cortava o topo do capuz.
    'dolynho': {'dy': -4, 'side': 150},
    # Kotlin desenha a cabeça mais baixa na célula.
    'kotlin': {'dy': -4},
}


def fighter_order():
    if ROSTER.exists():
        data = json.loads(ROSTER.read_text(encoding='utf-8'))
        return [f['id'] for f in data['fighters'] if f['id'] != 'boneco-treino']
    text = (ROOT / 'js/data/fighters.js').read_text(encoding='utf-8')
    return [m for m in re.findall(r"id:\s*'([a-z0-9-]+)'", text) if m != 'boneco-treino']


def sprite_path(fid):
    layout = (SPRITES / 'layout.js').read_text(encoding='utf-8')
    m = re.search(rf'"{re.escape(fid)}":\s*"(assets/sprites/[^"]+)"', layout)
    return ROOT / (m.group(1) if m else f'assets/sprites/{fid}.png')


def idle_frame(im):
    w, h = im.size
    cell_w = w // 4
    cell_h = 260 if h % 260 == 0 else h // 15
    return im.convert('RGBA').crop((0, 0, cell_w, cell_h)), cell_w, cell_h


def crop_box(frame, fid):
    opt = OVERRIDES.get(fid, {})
    side = int(opt.get('side', SIDE))
    arr = np.asarray(frame)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > ALPHA)
    fw, fh = frame.size
    if len(xs) == 0:
        return  (fw - side) // 2, 40, side
    top = int(ys.min())
    body_top = top
    head_limit = top + 78
    head = ys <= head_limit
    cx = int(np.median(xs[head])) if head.any() else int(np.median(xs))
    y0 = body_top - PAD_TOP + int(opt.get('dy', 0))
    x0 = cx - side // 2 + int(opt.get('dx', 0))
    x0 = max(0, min(x0, fw - side))
    y0 = max(0, min(y0, fh - side))
    return x0, y0, side


def portrait(frame, box):
    x0, y0, side = box
    crop = frame.crop((x0, y0, x0 + side, y0 + side))
    return crop.resize((CELL, CELL), Image.Resampling.NEAREST)


def main():
    order = fighter_order()
    rows = (len(order) + COLS - 1) // COLS
    atlas = Image.new('RGBA', (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    crops = {}
    missing = []
    for i, fid in enumerate(order):
        path = sprite_path(fid)
        if not path.exists():
            missing.append(fid)
            continue
        frame, _, _ = idle_frame(Image.open(path))
        box = crop_box(frame, fid)
        img = portrait(frame, box)
        col, row = i % COLS, i // COLS
        atlas.paste(img, (col * CELL, row * CELL))
        crops[fid] = {
            'x': box[0], 'y': box[1], 'side': box[2],
            'source': str(path.relative_to(ROOT)),
            'frame': 'idle-0',
        }
    ATLAS.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS)
    payload = {
        'cell': CELL,
        'cols': COLS,
        'file': 'assets/ui/roster-portraits.png',
        'version': 'v36-portraits1',
        'order': order,
        'crops': crops,
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    DATA.write_text(
        '/* Gerado por tools/build_roster_portraits.py — bustos do idle real.\n'
        '   Não edite os cortes à mão; ajuste OVERRIDES no script e rode de novo. */\n'
        'const ROSTER_PORTRAITS = ' + body + ';\n',
        encoding='utf-8',
    )
    # Folha de revisão com o nome embaixo, para checar enquadramento.
    label_h = 16
    sheet = Image.new('RGBA', (COLS * CELL, rows * (CELL + label_h)), (18, 10, 36, 255))
    draw = ImageDraw.Draw(sheet)
    for i, fid in enumerate(order):
        col, row = i % COLS, i // COLS
        piece = atlas.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
        y = row * (CELL + label_h)
        sheet.paste(piece, (col * CELL, y), piece)
        draw.text((col * CELL + 2, y + CELL + 2), fid[:12], fill=(255, 220, 140, 255))
    contact = Path('/tmp/portraits-contact.png')
    sheet.save(contact)
    print(f'atlas {atlas.size} fighters {len(order)} missing {missing}')
    print(contact)


if __name__ == '__main__':
    main()
