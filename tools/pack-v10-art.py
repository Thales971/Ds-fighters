#!/usr/bin/env python3
"""Pack V10 transparent 4x8 fighter sheets and 4x5 ability atlases."""
from pathlib import Path
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/ubuntu/ds-art/v10/generated')
CELL_W, CELL_H, BASELINE = 320, 260, 246
RESAMPLE = Image.Resampling.NEAREST

FIGHTERS = {
    'gemini': 'gemini-fighter-4x8.png',
    'meta': 'meta-fighter-4x8.png',
}
ATLASES = {
    'gemini': 'gemini-effects-4x5.png',
    'meta': 'meta-effects-4x5.png',
}


def source_grid(path, cols, rows):
    image = Image.open(path).convert('RGBA')
    if image.width % cols or image.height % rows:
        raise ValueError(f'{path} não divide exatamente em {cols}x{rows}: {image.size}')
    alpha_min, alpha_max = image.getchannel('A').getextrema()
    if alpha_min != 0 or alpha_max == 0:
        raise ValueError(f'{path} precisa de transparência alfa real: {(alpha_min, alpha_max)}')
    return image, image.width // cols, image.height // rows


def alpha_box(cell, label):
    box = cell.getchannel('A').point(lambda value: 255 if value > 8 else 0).getbbox()
    if not box:
        raise ValueError(f'célula sem arte visível: {label}')
    return box


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


def pack_fighter(fid, filename):
    image, cw, ch = source_grid(SOURCE / filename, 4, 8)
    sheet = Image.new('RGBA', (CELL_W * 4, CELL_H * 8), (0, 0, 0, 0))
    for row in range(8):
        for col in range(4):
            cell = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            frame = fit_art(cell, alpha_box(cell, f'{fid}/{row}/{col}'), CELL_W - 28, BASELINE - 16, CELL_W, CELL_H, BASELINE)
            sheet.alpha_composite(frame, (col * CELL_W, row * CELL_H))
    sprite_path = ROOT / 'assets/sprites' / f'{fid}.png'
    sprite_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(sprite_path, optimize=True)

    idle = sheet.crop((0, 0, CELL_W, CELL_H))
    bx0, by0, bx1, by1 = alpha_box(idle, f'{fid}/idle')
    body_h = by1 - by0
    face_h = max(44, min(body_h, round(body_h * 0.48)))
    face_w = min(bx1 - bx0, round(face_h * 1.05))
    cx = (bx0 + bx1) / 2
    face_box = (max(0, round(cx - face_w / 2)), by0, min(CELL_W, round(cx + face_w / 2)), min(by1, by0 + face_h))
    face = fit_art(idle, face_box, 148, 148, 160, 160)
    portrait = fit_art(idle, (bx0, by0, bx1, by1), 240, 240, 256, 256)
    ui_dir = ROOT / 'assets/ui'
    ui_dir.mkdir(parents=True, exist_ok=True)
    face_path = ui_dir / f'face-{fid}.png'
    portrait_path = ui_dir / f'portrait-{fid}.png'
    face.save(face_path, optimize=True)
    portrait.save(portrait_path, optimize=True)
    return {
        'id': fid, 'sheet': str(sprite_path.relative_to(ROOT)), 'dimensions': list(sheet.size),
        'sourceCell': [cw, ch], 'framesPerRow': 4, 'sourceRows': 8,
        'face': str(face_path.relative_to(ROOT)), 'portrait': str(portrait_path.relative_to(ROOT)),
    }


def pack_atlas(fid, filename):
    image, cw, ch = source_grid(SOURCE / filename, 4, 5)
    atlas = Image.new('RGBA', (128 * 4, 128 * 5), (0, 0, 0, 0))
    for row in range(5):
        for col in range(4):
            cell = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            effect = fit_art(cell, alpha_box(cell, f'{fid}/effect/{row}/{col}'), 116, 116, 128, 128)
            atlas.alpha_composite(effect, (col * 128, row * 128))
    dst = ROOT / 'assets/abilities' / f'{fid}.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(dst, optimize=True)
    return {'id': fid, 'atlas': str(dst.relative_to(ROOT)), 'dimensions': list(atlas.size), 'rows': 5, 'framesPerSkill': 4, 'sourceCell': [cw, ch]}


report = {
    'fighters': [pack_fighter(fid, filename) for fid, filename in FIGHTERS.items()],
    'abilityAtlases': [pack_atlas(fid, filename) for fid, filename in ATLASES.items()],
}
report_path = ROOT / 'test-results' / 'v10-art-pack-report.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(report, indent=2, ensure_ascii=False))
