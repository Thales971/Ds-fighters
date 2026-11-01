#!/usr/bin/env python3
"""Refina os dez mapas clássicos usando somente os masters existentes.

Cada master JPG é preservado integralmente dentro de um frame 16:9 por
contenção (sem crop); as laterais são preenchidas repetindo apenas as colunas
externas do próprio master. A única animação é um pulso de brilho suave,
loopável e limitado acima da linha de piso de cada mapa. Nenhum objeto é
pintado e os mapas 11+ não são tocados.

Uso:
    python3 tools/refine-classic-maps.py
    python3 tools/refine-classic-maps.py 01-centro-de-dados 05-fight-exe
"""
from __future__ import annotations

import argparse
import json
import math
import re
import zlib
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "stages" / "source"
OUTPUT = ROOT / "assets" / "stages"
SHEETS = OUTPUT / "sheets.js"

# 768x432 retains substantially more master detail than the 384x216 GIF while
# using 36% less pixels than the previous 960x540 frames.  RGB (not RGBA) is
# enough for an opaque background and keeps browser memory lower.
FRAME_W, FRAME_H = 768, 432
COLS, ROWS, FRAMES = 6, 4, 24
FPS = 10

CLASSIC_IDS = [
    "01-centro-de-dados",
    "02-chuva-de-codigo",
    "03-laboratorio-95",
    "04-neon-city-exe",
    "05-fight-exe",
    "06-fabrica-de-bugs",
    "07-placa-mae",
    "08-startup-3am",
    "09-deploy-nas-nuvens",
    "10-arena-git",
]

# Ground placement is inherited from the existing classic layout. It is only
# a lock mask for animation; it does not draw or replace the floor.
FLOOR_RATIOS = {
    "01-centro-de-dados": 162 / 216,
    "02-chuva-de-codigo": 178 / 216,
    "03-laboratorio-95": 148 / 216,
    "04-neon-city-exe": 156 / 216,
    "05-fight-exe": 162 / 216,
    "06-fabrica-de-bugs": 150 / 216,
    "07-placa-mae": 172 / 216,
    "08-startup-3am": 150 / 216,
    "09-deploy-nas-nuvens": 154 / 216,
    "10-arena-git": 160 / 216,
}


def master_path(stage_id: str) -> Path:
    return SOURCE / f"{stage_id}.jpg"


def contain_with_edge_padding(master: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Fit the complete master, using its edge columns for non-content bars."""
    master = master.convert("RGB")
    scale = min(FRAME_W / master.width, FRAME_H / master.height)
    fitted_size = (
        max(1, round(master.width * scale)),
        max(1, round(master.height * scale)),
    )
    fitted = master.resize(fitted_size, Image.Resampling.LANCZOS)
    left = (FRAME_W - fitted.width) // 2
    top = (FRAME_H - fitted.height) // 2
    right = left + fitted.width
    bottom = top + fitted.height

    # The source is 4:3-ish (1152x896), while the game is 16:9. These bars
    # contain no new shapes: each is only the corresponding edge column
    # expanded horizontally, so every master pixel remains uncropped.
    canvas = Image.new("RGB", (FRAME_W, FRAME_H))
    if left:
        edge = fitted.crop((0, 0, 1, fitted.height)).resize(
            (left, fitted.height), Image.Resampling.BILINEAR
        )
        canvas.paste(edge, (0, top))
    if FRAME_W - right:
        edge = fitted.crop((fitted.width - 1, 0, fitted.width, fitted.height)).resize(
            (FRAME_W - right, fitted.height), Image.Resampling.BILINEAR
        )
        canvas.paste(edge, (right, top))
    canvas.paste(fitted, (left, top))

    # A restrained common pass makes master detail survive the final browser
    # scale without changing composition or adding visual content.
    canvas = ImageEnhance.Contrast(canvas).enhance(1.025)
    canvas = ImageEnhance.Sharpness(canvas).enhance(1.04)
    return canvas, (left, top, right, bottom)


def animation_mask(floor_ratio: float) -> Image.Image:
    """Return a vertical mask that fades to zero before the combat floor."""
    floor_y = int(round(FRAME_H * floor_ratio))
    fade_start = max(0, floor_y - int(round(FRAME_H * 0.09)))
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    px = mask.load()
    # Keep the lower band byte-for-byte stable; only the upper scene breathes.
    for y in range(FRAME_H):
        if y < fade_start:
            value = 255
        elif y < floor_y:
            value = round(255 * (floor_y - y) / max(1, floor_y - fade_start))
        else:
            value = 0
        for x in range(FRAME_W):
            px[x, y] = value
    return mask


def build_sheet(stage_id: str) -> tuple[Image.Image, tuple[int, int, int, int]]:
    path = master_path(stage_id)
    if not path.exists():
        raise FileNotFoundError(f"master ausente: {path}")
    with Image.open(path) as source:
        if source.width < FRAME_W or source.height < FRAME_H:
            raise ValueError(f"master menor que o frame alvo: {path} {source.size}")
        base, content_box = contain_with_edge_padding(source)

    mask = animation_mask(FLOOR_RATIOS[stage_id])
    sheet = Image.new("RGB", (FRAME_W * COLS, FRAME_H * ROWS))
    phase = (zlib.crc32(stage_id.encode("utf-8")) % 360) * math.pi / 180
    for frame_index in range(FRAMES):
        wave = math.sin((2 * math.pi * frame_index / FRAMES) + phase)
        # Small, smooth pulse: no motion, no new objects, no floor animation.
        lit = ImageEnhance.Brightness(base).enhance(1.0 + 0.028 * wave)
        frame = Image.composite(lit, base, mask)
        sheet.paste(frame, ((frame_index % COLS) * FRAME_W, (frame_index // COLS) * FRAME_H))
    return sheet, content_box


def read_manifest() -> list[dict]:
    text = SHEETS.read_text(encoding="utf-8")
    marker = "const STAGE_SHEETS ="
    start = text.index(marker) + len(marker)
    data, _ = json.JSONDecoder().raw_decode(text[start:].lstrip())
    if not isinstance(data, list):
        raise ValueError("STAGE_SHEETS não é uma lista")
    return data


def write_manifest(entries: list[dict]) -> None:
    # Keep the generated-file convention while touching only the ten classic
    # entries. Entries 11+ remain semantically unchanged.
    SHEETS.write_text(
        "/* Gerado por tools/refine-classic-maps.py */\n"
        "const STAGE_SHEETS = "
        + json.dumps(entries, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="*", help="IDs clássicos; vazio processa os dez")
    args = parser.parse_args()
    unknown = [stage_id for stage_id in args.ids if stage_id not in CLASSIC_IDS]
    if unknown:
        parser.error("IDs fora do escopo clássico: " + ", ".join(unknown))
    todo = args.ids or CLASSIC_IDS

    entries = read_manifest()
    by_id = {entry.get("id"): entry for entry in entries}
    for stage_id in todo:
        if stage_id not in by_id:
            raise ValueError(f"ID não encontrado em STAGE_SHEETS: {stage_id}")
        sheet, box = build_sheet(stage_id)
        out = OUTPUT / f"{stage_id}.png"
        sheet.save(out, format="PNG", optimize=True)
        entry = by_id[stage_id]
        entry.update({
            "sheet": f"assets/stages/{stage_id}.png",
            "image": f"assets/stages/source/{stage_id}.jpg",
            "cols": COLS,
            "rows": ROWS,
            "frames": FRAMES,
            "fps": FPS,
            "frameW": FRAME_W,
            "frameH": FRAME_H,
        })
        print(
            f"{stage_id}: master={master_path(stage_id).stat().st_size} bytes "
            f"content={box} sheet={sheet.size} output={out.stat().st_size} bytes"
        )
    write_manifest(entries)


if __name__ == "__main__":
    main()
