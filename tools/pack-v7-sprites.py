#!/usr/bin/env python3
"""Normalize generated 4x8 transparent V7 sheets to the game's 320x260 cells."""
from pathlib import Path
import argparse
from PIL import Image

SPECS = {
    'winx-exe': ('winx-4x8.png', 'WINX.EXE'),
    'kimi': ('kimi-4x8.png', 'KIMI'),
    'deepseek': ('deepseek-4x8.png', 'DEEP SEEK'),
    'dandara-query': ('mila-query-4x8.png', 'DANDARA QUERY'),
}
FW, FH, BASELINE = 320, 260, 246
MAX_W, MAX_H = 292, 202


def rgba_bbox(image):
    alpha = image.getchannel('A')
    return alpha.getbbox()


def normalize_frame(frame):
    box = rgba_bbox(frame)
    if not box:
        raise ValueError('empty animation cell')
    art = frame.crop(box)
    scale = min(MAX_W / art.width, MAX_H / art.height)
    size = (max(1, round(art.width * scale)), max(1, round(art.height * scale)))
    art = art.resize(size, Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    x = (FW - size[0]) // 2
    y = BASELINE - size[1]
    out.alpha_composite(art, (x, y))
    return out


def portrait(sheet):
    idle = sheet.crop((0, 0, FW, FH))
    box = rgba_bbox(idle)
    if not box:
        raise ValueError('idle frame is empty')
    l, t, r, b = box
    h = max(1, round((b - t) * 0.43))
    # Upper body/head with spare side margins; profile card uses center-crop.
    side = max(1, round((r - l) * 0.78))
    cx = (l + r) // 2
    crop = idle.crop((max(0, cx - side // 2), t, min(FW, cx + side // 2), min(FH, t + h)))
    crop.thumbnail((160, 160), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    out.alpha_composite(crop, ((160 - crop.width) // 2, (160 - crop.height) // 2))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source_dir', type=Path, help='Directory containing the four generated *-4x8.png masters')
    ap.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = ap.parse_args()
    spr = args.root / 'assets' / 'sprites'
    ui = args.root / 'assets' / 'ui'
    spr.mkdir(parents=True, exist_ok=True)
    ui.mkdir(parents=True, exist_ok=True)
    for fid, (filename, _) in SPECS.items():
        source = Image.open(args.source_dir / filename).convert('RGBA')
        if source.width % 4 or source.height % 8:
            raise ValueError(f'{filename}: sheet dimensions must divide exactly into 4x8 cells, got {source.size}')
        cw, ch = source.width // 4, source.height // 8
        result = Image.new('RGBA', (FW * 4, FH * 8), (0, 0, 0, 0))
        for row in range(8):
            for col in range(4):
                cell = source.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
                normalized = normalize_frame(cell)
                result.alpha_composite(normalized, (col * FW, row * FH))
        out = spr / f'{fid}.png'
        result.save(out, optimize=True, compress_level=9)
        portrait(result).save(ui / f'face-{fid}.png', optimize=True, compress_level=9)
        print(f'{fid}: {result.size[0]}x{result.size[1]} RGBA; {out.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
