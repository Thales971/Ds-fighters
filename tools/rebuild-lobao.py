#!/usr/bin/env python3
"""Rebuild do Lobao: troca as celulas das poses principais (idle, walk, punch,
kick, special, win) da folha 1280x3900 pelos frames gerados por IA em
.vibe/gen3 (4 frames de 128 em cada tira 1152x896, fundo magenta keyeado).

Alinha cada sprite novo pelo PE na linha baseline 246 e pelo centro X,
escalando para a altura do boneco original da mesma pose (igual rebuild-chars).
As demais poses (jump, crouch, cpunch, ckick, jpunch, jkick, hit, block, ko)
ficam as do Manus. Tambem regera face/portrait a partir do idle novo.

Uso: python3 tools/rebuild-lobao.py
"""
import numpy as np
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / '.vibe/gen3'
CW, CH, BASE = 320, 260, 246
S = 128  # celula de entrada das tiras geradas

# pose -> (arquivo gerado, linha na folha)
POSES = {
    'idle': ('lobao-idle.jpg', 0),
    'walk': ('lobao-walk.jpg', 1),
    'punch': ('lobao-punch.jpg', 4),
    'kick': ('lobao-kick.jpg', 5),
    'special': ('lobao-special.jpg', 10),
    'win': ('lobao-win.jpg', 14),
}


def key_magenta(rgb, tol=200):
    a = np.asarray(rgb).astype(np.int16)
    d1 = np.abs(a - np.array([255, 0, 255])).sum(axis=2)
    d2 = np.abs(a - np.array([234, 53, 243])).sum(axis=2)
    alpha = np.where((d1 < tol) | (d2 < tol), 0, 255).astype(np.uint8)
    return np.dstack([np.asarray(rgb), alpha])


def extract_frames(jpg):
    """Corta 4 celulas 128-equivalentes da tira 1152x896 e devolve RGBA 128x128."""
    im = Image.open(GEN / jpg).convert('RGB')
    W, H = im.size
    # a tira pode ser 1152x896 com 4 frames horizontais -> cada frame ~288x896;
    # conteudo central de cada frame
    frames = []
    fw = W // 4
    for c in range(4):
        cell = im.crop((c * fw, 0, (c + 1) * fw, H))
        keyed = key_magenta(cell)
        alpha = keyed[..., 3]
        ys, xs = np.where(alpha > 0)
        img = Image.fromarray(keyed, 'RGBA')
        if len(xs) == 0:
            frames.append(img.resize((S, S), Image.LANCZOS))
            continue
        b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        content = img.crop(b)
        side = max(content.size)
        canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        canvas.paste(content, ((side - content.width) // 2, side - content.height), content)
        frames.append(canvas.resize((S, S), Image.LANCZOS))
    return frames


def bbox_alpha(a, thr=40):
    ys, xs = np.nonzero(a > thr)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    sheet = Image.open(ROOT / 'assets/sprites/lobao.png').convert('RGBA')
    assert sheet.size == (1280, 3900)
    for pose, (jpg, row) in POSES.items():
        frames = extract_frames(jpg)
        # altura de referencia: boneco original do frame 0 da pose
        ref = np.array(sheet.crop((0, row * CH, CW, (row + 1) * CH)))
        rb = bbox_alpha(ref[..., 3])
        ref_h = rb[3] - rb[1]
        ref_cx = (rb[0] + rb[2]) / 2
        for c, fr in enumerate(frames):
            a = np.array(fr)
            b = bbox_alpha(a[..., 3])
            if not b:
                continue
            fig = fr.crop(b)
            k = ref_h / fig.height
            nw, nh = max(1, round(fig.width * k)), max(1, round(fig.height * k))
            fig = fig.resize((nw, nh), Image.LANCZOS)
            cell = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
            x = round(ref_cx - nw / 2)
            y = BASE - nh
            x = max(0, min(CW - nw, x)) if nw <= CW else (CW - nw) // 2
            y = max(0, min(CH - nh, y))
            cell.paste(fig, (x, y), fig)
            arr = np.array(cell)
            arr[..., 3] = np.where(arr[..., 3] > 110, 255, 0)
            sheet.paste(Image.fromarray(arr, 'RGBA'), (c * CW, row * CH))
        print('pose', pose, 'refeita')
    sheet.save(ROOT / 'assets/sprites/lobao.png', optimize=True)
    # face/portrait a partir do idle novo
    idle = sheet.crop((0, 0, CW, CH))
    b = bbox_alpha(np.array(idle)[..., 3])
    fig = idle.crop(b)
    hh = int(fig.height * 0.36)
    head = fig.crop((0, 0, fig.width, hh))
    hb = bbox_alpha(np.array(head)[..., 3])
    hcx = (hb[0] + hb[2]) / 2
    side = int(hh * 1.05)
    face = fig.crop((int(hcx - side / 2), 0, int(hcx + side / 2), side))
    face.resize((168, 168), Image.NEAREST).save(ROOT / 'assets/ui/face-lobao.png')
    h = 360
    w = max(1, round(fig.width * h / fig.height))
    port = fig.resize((w, h), Image.LANCZOS)
    canvas = Image.new('RGBA', (320, 360), (0, 0, 0, 0))
    canvas.paste(port, ((320 - w) // 2, 0), port)
    canvas.save(ROOT / 'assets/ui/portrait-lobao.png')
    print('folha nova salva; face/portrait regenerados')


if __name__ == '__main__':
    main()
