#!/usr/bin/env python3
"""Recorta as folhas de FX (magenta) de Lia, Nexo e Maximilian.

Cada folha vira 20 células em assets/fx/new/<lutador>/NN.png.
As linhas de poder (4 quadros de 128px) vão para assets/fx/<id>.png
e os ícones da HUD para assets/abilities/<id>.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = {
    'lia': Path('/home/ubuntu/.cursor/projects/agent-repos-Ds-fighters/uploads/fx-lia_3948.jpg'),
    'nexo': Path('/home/ubuntu/.cursor/projects/agent-repos-Ds-fighters/uploads/fx-nexo_73b6.jpg'),
    'maximilian': Path('/home/ubuntu/.cursor/projects/agent-repos-Ds-fighters/uploads/fx-maximilian_04dc.jpg'),
}

# Quadros (1-based, linha a linha). Células 1 e 9 da Lia ficam de fora.
POWERS = {
    'lia': [
        ('ollie', [2, 7, 8], 2),
        ('manual', [3, 6], 3),
        ('grind', [4, 12], 12),  # 12 é o shape em chamas; 14 é o trilho da ult
        ('kickflip', [19, 15, 10], 20),
        ('linha-do-trem', [13, 14, 11, 20], 14),
    ],
    'nexo': [
        ('ping', [1, 7, 19], 1),
        ('pacote', [2, 3, 8], 2),
        ('firewall', [4, 17], 4),
        ('handshake', [9, 10, 14], 9),
        ('antena-cheia', [6, 15, 11, 20], 6),
    ],
    'maximilian': [
        ('relogio', [1, 2], 1),
        ('engrenagem', [3, 4], 4),
        ('portal', [5, 6, 15], 6),
        ('estilhaco', [7, 8, 16], 8),
        ('meia-noite', [10, 12, 20, 11], 10),
    ],
}
SPARKS = {
    'lia': [5, 10, 18],
    'nexo': [18, 20],
    'maximilian': [17, 18],
}
FRAMES = [(0.86, -7, 0.92), (1.0, 2, 1.0), (1.08, 9, 1.0), (0.92, -4, 0.86)]


def line_centers(frac, thr=0.45):
    idx = np.where(frac > thr)[0]
    if len(idx) == 0:
        return []
    groups = []
    start = prev = int(idx[0])
    for x in idx[1:]:
        x = int(x)
        if x > prev + 4:
            groups.append((start + prev) // 2)
            start = x
        prev = x
    groups.append((start + prev) // 2)
    return groups


def splits(length, lines, parts):
    interior = [x for x in lines if 12 < x < length - 12]
    if len(interior) != parts - 1:
        step = length / parts
        interior = [int(round(step * (i + 1))) for i in range(parts - 1)]
    bounds = [0] + interior + [length]
    cells = []
    for i in range(parts):
        a, b = bounds[i] + 3, bounds[i + 1] - 3
        cells.append((max(0, a), min(length, max(a + 8, b))))
    return cells


def key_magenta(rgb):
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    diff = np.minimum(r, b) - g
    hard = ((diff > 148) & (g < 55) & (r > 115) & (b > 125)) | ((g <= 14) & (r > 135) & (b > 145))
    soft = (diff > 108) & (diff <= 148) & (g < 90) & (r > 90) & (b > 100) & ~hard
    alpha = np.full(r.shape, 255, np.float32)
    alpha[hard] = 0
    if soft.any():
        t = (diff[soft].astype(np.float32) - 108) / 40
        alpha[soft] = (1 - t) * 255
    edge = (alpha > 0) & (alpha < 250)
    cut = np.clip(diff, 0, None).astype(np.float32)
    rf = r.astype(np.float32)
    bf = b.astype(np.float32)
    rf[edge] -= cut[edge] * 0.8
    bf[edge] -= cut[edge] * 0.92
    out = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    out[:, :, 0] = np.clip(rf, 0, 255).astype(np.uint8)
    out[:, :, 1] = np.clip(g, 0, 255).astype(np.uint8)
    out[:, :, 2] = np.clip(bf, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    out[out[:, :, 3] == 0, :3] = 0
    return out


def trim(im, pad=2):
    a = np.array(im)
    ys, xs = np.where(a[:, :, 3] > 16)
    if len(xs) == 0:
        return Image.new('RGBA', (8, 8), (0, 0, 0, 0))
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + 1 + pad)
    return im.crop((x0, y0, x1, y1))


def extract(path):
    rgb = np.asarray(Image.open(path).convert('RGB'))
    h, w = rgb.shape[:2]
    r, g, b = rgb[:, :, 0].astype(np.int16), rgb[:, :, 1].astype(np.int16), rgb[:, :, 2].astype(np.int16)
    line = (r > 200) & (b > 200) & (g < 40) & ((r + b) // 2 - g > 150)
    cols = splits(w, line_centers(line.mean(axis=0)), 5)
    rows = splits(h, line_centers(line.mean(axis=1)), 4)
    keyed = key_magenta(rgb)
    cells = []
    for y0, y1 in rows:
        for x0, x1 in cols:
            cells.append(trim(Image.fromarray(keyed[y0:y1, x0:x1], 'RGBA')))
    return cells


def fit_frame(im, scale, rot, alpha, size=128):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    if im.width < 2 or im.height < 2:
        return canvas
    work = im
    if abs(rot) > 0.4:
        work = im.rotate(rot, resample=Image.Resampling.BICUBIC, expand=True)
    m = max(work.width, work.height)
    side = max(8, int(size * 0.90 * scale))
    s = side / m
    nw, nh = max(1, int(work.width * s)), max(1, int(work.height * s))
    if nw > size or nh > size:
        s *= min(size / nw, size / nh)
        nw, nh = max(1, int(work.width * s)), max(1, int(work.height * s))
    resized = work.resize((nw, nh), Image.Resampling.LANCZOS)
    if alpha < 0.999:
        bands = list(resized.split())
        bands[3] = bands[3].point(lambda p: int(p * alpha))
        resized = Image.merge('RGBA', bands)
    canvas.alpha_composite(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas


def sheet_from(rows):
    out = Image.new('RGBA', (512, 640), (0, 0, 0, 0))
    for r, frames in enumerate(rows):
        for c, frame in enumerate(frames):
            out.alpha_composite(frame, (c * 128, r * 128))
    return out


def main():
    preview = Image.new('RGBA', (5 * 140, 3 * 4 * 140), (20, 16, 28, 255))
    py = 0
    for fid, src in UPLOADS.items():
        cells = extract(src)
        if len(cells) != 20:
            raise SystemExit(f'{fid}: {len(cells)} células')
        out_dir = ROOT / 'assets' / 'fx' / 'new' / fid
        out_dir.mkdir(parents=True, exist_ok=True)
        for i, cell in enumerate(cells, start=1):
            cell.save(out_dir / f'{i:02d}.png')
            thumb = fit_frame(cell, 1, 0, 1, 128)
            preview.paste(thumb, ((i - 1) % 5 * 140 + 6, py + (i - 1) // 5 * 140 + 6), thumb)
        py += 4 * 140
        fx_rows = []
        icon_rows = []
        sparks = [cells[n - 1] for n in SPARKS[fid]]
        for _name, nums, icon in POWERS[fid]:
            sources = [cells[n - 1] for n in nums]
            frames = []
            for i, (scale, rot, alpha) in enumerate(FRAMES):
                base = fit_frame(sources[i % len(sources)], scale, rot, alpha)
                if i == 3 and sparks:
                    base.alpha_composite(fit_frame(sparks[i % len(sparks)], 0.62, 0, 0.55))
                frames.append(base)
            fx_rows.append(frames)
            icon_src = cells[icon - 1]
            icon_rows.append([
                fit_frame(icon_src, 0.92, -6, 1),
                fit_frame(icon_src, 1.0, 0, 1),
                fit_frame(icon_src, 1.05, 6, 1),
                fit_frame(icon_src, 0.96, -2, 0.95),
            ])
        sheet_from(fx_rows).save(ROOT / 'assets' / 'fx' / f'{fid}.png')
        sheet_from(icon_rows).save(ROOT / 'assets' / 'abilities' / f'{fid}.png')
        print(fid, 'ok', [c.size for c in cells[:3]])
    preview.convert('RGB').save('/tmp/fx-cells-preview.jpg', quality=85)
    print('preview /tmp/fx-cells-preview.jpg')


if __name__ == '__main__':
    main()
