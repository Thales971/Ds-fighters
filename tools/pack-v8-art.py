#!/usr/bin/env python3
"""Pack V8 transparent 4x8 sprite blocks into the engine's complete 4x15 sheets."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/ubuntu/ds-art/v8/generated')
CELL_W, CELL_H, BASELINE = 320, 260, 246
OUT_W, OUT_H = CELL_W * 4, CELL_H * 15
RESAMPLE = Image.Resampling.NEAREST

CHARACTERS = {
    'winx-exe': ('winx-exe-block-a.png', 'winx-exe-block-b.png', (26, 0, 292, 174)),
    'nina-vector': ('nina-vector-block-a.png', 'nina-vector-block-b.png', (8, 0, 218, 170)),
}
ATLASES = {
    'winx-exe': 'winx-exe-effects-4x5.png',
    'nina-vector': 'nina-vector-effects-4x5.png',
}


def alpha_box(cell, label):
    alpha = cell.getchannel('A')
    mask = alpha.point(lambda x: 255 if x > 8 else 0)
    box = mask.getbbox()
    if not box:
        raise ValueError(f'célula sem arte visível: {label}')
    return box


def source_grid(path, cols, rows):
    image = Image.open(path).convert('RGBA')
    if image.width % cols or image.height % rows:
        raise ValueError(f'{path} não divide exatamente em {cols}x{rows}: {image.size}')
    alpha_min, alpha_max = image.getchannel('A').getextrema()
    if alpha_min != 0 or alpha_max == 0:
        raise ValueError(f'{path} não tem transparência alfa real: {(alpha_min, alpha_max)}')
    cw, ch = image.width // cols, image.height // rows
    return image, cw, ch


def fit_art(cell, box, max_w, max_h, target_w, target_h, baseline=None):
    art = cell.crop(box)
    scale = min(max_w / art.width, max_h / art.height)
    size = (max(1, round(art.width * scale)), max(1, round(art.height * scale)))
    art = art.resize(size, RESAMPLE)
    result = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    x = (target_w - art.width) // 2
    y = ((baseline - art.height) if baseline is not None else (target_h - art.height) // 2)
    result.alpha_composite(art, (x, y))
    return result


def sprite_cell(image, cw, ch, row, col, label):
    cell = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
    box = alpha_box(cell, label)
    return fit_art(cell, box, CELL_W - 28, BASELINE - 16, CELL_W, CELL_H, BASELINE)


def pack_character(fid, block_a, block_b, face_crop):
    a, aw, ah = source_grid(SOURCE / block_a, 4, 8)
    b, bw, bh = source_grid(SOURCE / block_b, 4, 8)
    if (aw, ah) != (bw, bh):
        raise ValueError(f'blocos de {fid} têm células diferentes: {(aw, ah)} vs {(bw, bh)}')
    sheet = Image.new('RGBA', (OUT_W, OUT_H), (0, 0, 0, 0))
    boxes = []
    rows = [(a, row, f'A{row}') for row in range(8)] + [(b, row, f'B{row}') for row in range(7)]
    for out_row, (src, src_row, label) in enumerate(rows):
        for col in range(4):
            cell = src.crop((col * aw, src_row * ah, (col + 1) * aw, (src_row + 1) * ah))
            box = alpha_box(cell, f'{fid}/{label}/{col}')
            frame = fit_art(cell, box, CELL_W - 28, BASELINE - 16, CELL_W, CELL_H, BASELINE)
            sheet.alpha_composite(frame, (col * CELL_W, out_row * CELL_H))
            boxes.append((out_row, col, box))
    dst = ROOT / 'assets/sprites' / f'{fid}.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dst, optimize=True)

    idle = sheet.crop((0, 0, CELL_W, CELL_H))
    fx0, fy0, fx1, fy1 = face_crop
    face_src = idle.crop((fx0, fy0, fx1, fy1))
    fbox = alpha_box(face_src, f'{fid}/face')
    face = fit_art(face_src, fbox, 148, 148, 160, 160)
    ui_dir = ROOT / 'assets/ui'
    ui_dir.mkdir(parents=True, exist_ok=True)
    face.save(ui_dir / f'face-{fid}.png', optimize=True)
    portrait = fit_art(idle, alpha_box(idle, f'{fid}/portrait'), 240, 240, 256, 256)
    portrait.save(ui_dir / f'portrait-{fid}.png', optimize=True)
    return {'id': fid, 'sheet': str(dst.relative_to(ROOT)), 'dimensions': list(sheet.size),
            'distinctPoseRows': len(rows), 'framesPerPose': 4, 'sourceCell': [aw, ah],
            'face': f'assets/ui/face-{fid}.png', 'portrait': f'assets/ui/portrait-{fid}.png'}


def pack_atlas(fid, filename):
    image, cw, ch = source_grid(SOURCE / filename, 4, 5)
    atlas = Image.new('RGBA', (128 * 4, 128 * 5), (0, 0, 0, 0))
    for row in range(5):
        for col in range(4):
            cell = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            box = alpha_box(cell, f'{fid}/effect/{row}/{col}')
            sprite = fit_art(cell, box, 116, 116, 128, 128)
            atlas.alpha_composite(sprite, (col * 128, row * 128))
    dst = ROOT / 'assets/abilities' / f'{fid}.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(dst, optimize=True)
    return {'id': fid, 'atlas': str(dst.relative_to(ROOT)), 'dimensions': list(atlas.size),
            'rows': 5, 'framesPerMove': 4, 'sourceCell': [cw, ch]}


report = {'fighters': [], 'abilityAtlases': []}
for fid, (a, b, crop) in CHARACTERS.items():
    report['fighters'].append(pack_character(fid, a, b, crop))
for fid, filename in ATLASES.items():
    report['abilityAtlases'].append(pack_atlas(fid, filename))
report_path = ROOT / 'test-results' / 'v8-art-pack-report.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(report, indent=2, ensure_ascii=False))
