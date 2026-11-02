#!/usr/bin/env python3
"""Pack V11 transparent 4x8 fighter sheets and 4x5 ability atlases."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/ubuntu/ds-art/v11/generated')
EFFECTS = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('/home/ubuntu/ds-art/v11/effects')
CELL_W, CELL_H, BASELINE = 320, 260, 246
RESAMPLE = Image.Resampling.NEAREST

FIGHTERS = {
    'mis': 'mis-fighter-4x8.png',
    'grika': 'grika-fighter-4x8.png',
    'dev-senior': 'dev-senior-fighter-4x8.png',
    'dev-senior-nano': 'dev-senior-nano-4x8.png',
}
ATLASES = {
    'mis': 'mis-effects-4x5.png',
    'grika': 'grika-effects-4x5.png',
    'dev-senior': 'dev-senior-effects-4x5.png',
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


def pack_fighter(fid, filename, make_portrait=True):
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
    result = {
        'id': fid, 'sheet': str(sprite_path.relative_to(ROOT)), 'dimensions': list(sheet.size),
        'sourceCell': [cw, ch], 'framesPerRow': 4, 'sourceRows': 8,
    }
    if make_portrait:
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
        result.update({'face': str(face_path.relative_to(ROOT)), 'portrait': str(portrait_path.relative_to(ROOT))})
    return result


def pack_atlas(fid, filename):
    image, cw, ch = source_grid(EFFECTS / filename, 4, 5)
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


def make_red_electric_atlas():
    """Small original red-lightning loop used only by Dev Senior's nano aura."""
    frames = [
        ([(7, 68), (19, 51), (31, 63), (44, 37), (57, 59), (69, 45), (82, 70), (94, 48), (108, 62), (121, 39)],
         [[(31, 63), (31, 88), (43, 101)], [(69, 45), (74, 22), (89, 13)], [(94, 48), (103, 28), (117, 20)]]),
        ([(6, 42), (19, 59), (32, 43), (43, 73), (55, 51), (67, 64), (80, 35), (93, 60), (106, 46), (122, 78)],
         [[(43, 73), (37, 94), (25, 106)], [(80, 35), (83, 15), (99, 9)], [(93, 60), (102, 83), (116, 96)]]),
        ([(11, 62), (27, 54), (39, 72), (52, 48), (65, 66), (78, 43), (91, 67), (104, 52), (118, 64)],
         [[(52, 48), (50, 25), (37, 14)], [(78, 43), (82, 22), (97, 16)], [(65, 66), (65, 91), (78, 106)], [(91, 67), (101, 88), (115, 97)]]),
        ([(12, 77), (26, 58), (40, 69), (53, 45), (66, 61), (79, 51), (94, 72), (108, 54), (120, 66)],
         [[(40, 69), (34, 91), (22, 99)], [(79, 51), (74, 29), (63, 19)], [(94, 72), (106, 92), (118, 101)]]),
    ]
    atlas = Image.new('RGBA', (128 * 4, 128), (0, 0, 0, 0))
    for col, (main, branches) in enumerate(frames):
        cell = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
        draw = ImageDraw.Draw(cell, 'RGBA')
        for points in [main, *branches]:
            draw.line(points, fill=(107, 0, 22, 115), width=13, joint='curve')
            draw.line(points, fill=(224, 12, 46, 255), width=7, joint='curve')
            draw.line(points, fill=(255, 83, 112, 255), width=4, joint='curve')
            draw.line(points, fill=(255, 228, 238, 255), width=1, joint='curve')
        for x, y in main[1::2]:
            draw.rectangle((x - 2, y - 2, x + 2, y + 2), fill=(255, 63, 91, 255))
        atlas.alpha_composite(cell, (col * 128, 0))
    dst = ROOT / 'assets/abilities/dev-senior-electric.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(dst, optimize=True)
    return {'atlas': str(dst.relative_to(ROOT)), 'dimensions': list(atlas.size), 'rows': 1, 'frames': 4, 'style': 'pixel-art red nano-lightning'}


report = {
    'fighters': [pack_fighter(fid, filename, make_portrait=fid != 'dev-senior-nano') for fid, filename in FIGHTERS.items()],
    'abilityAtlases': [pack_atlas(fid, filename) for fid, filename in ATLASES.items()],
    'devSeniorElectric': make_red_electric_atlas(),
}
report_path = ROOT / 'test-results' / 'v11-art-pack-report.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(report, indent=2, ensure_ascii=False))
