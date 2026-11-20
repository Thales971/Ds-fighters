#!/usr/bin/env python3
"""Atlas da MARÉ ALTA a partir dos sprites do dono — QUADRO A QUADRO.

As duas imagens em Pitoco-pet/mare-alta-nova-sprites-recortar/ (fundo magenta)
são grades de quadros de animação de UMA onda (cresce -> quebra -> some), com
linhas divisórias entre os painéis. A versão antiga cortava a linha inteira
(1184px) como se fosse uma faixa contínua, e as divisórias viravam riscos
verticais na tela. Aqui cada painel é recortado por dentro (sem divisória),
recebe chroma-key, é escalado para a água ficar com WATER_H px de espessura e
alinhado pela linha da superfície.

Saída:
  assets/fx/mare.png — linha 0: faixa de água calma tileável (CALM_W x WATER_H,
                       bordas casadas); linhas 1..: quadros da onda, SÓ a crista
                       (FW x fh, superfície em y = fh - WATER_H; fh cabe a maior
                       crista inteira). A água é sempre a faixa calma.
  Imprime o layout (MARE_ATLAS) que js/engine/mechanics.js usa.

Uso: python3 tools/build_mare_atlas.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'Pitoco-pet/mare-alta-nova-sprites-recortar'
OUT = ROOT / 'assets/fx/mare.png'

WATER_H = 40      # espessura da água na tela (px)
FW = 176          # largura de cada quadro da onda
CALM_W = 192      # largura do tile de água calma
INSET = 8         # margem pra dentro do painel (some a divisória e a borda clara)

# painéis (x0, x1, y0, y1) medidos nas divisórias de cada imagem
SHEETS = [
    ('Mare alta nova sprite.jpg',
     [(0, 293), (295, 590), (592, 888), (890, 1184)], [(0, 447), (449, 896)]),
    ('mare alta nova 2 sprite.jpg',
     [(0, 238), (241, 471), (474, 705), (709, 940), (943, 1184)], [(0, 449), (453, 896)]),
]
# sequência da onda passando: (folha, linha, coluna). Só a folha 0: os 7 quadros
# dela formam uma onda coerente (cresce, crista, quebra, espuma, some); a folha 1
# tem outra paleta/espessura de água e destoava quando misturada.
WAVE_SEQ = [(0, 0, 0), (0, 0, 1), (0, 0, 2), (0, 0, 3), (0, 1, 0), (0, 1, 1), (0, 1, 2)]
CALM_FROM = (0, 1, 3)  # painel só com água calma


def key_magenta(rgb):
    """alpha: tudo que é magenta (e a franja rosada da borda) fica transparente."""
    from scipy import ndimage
    a = rgb.astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mag = (r > 140) & (b > 70) & (g < 0.6 * r) & (r - b > -60)
    d = ndimage.distance_transform_edt(~mag)
    return (d > 1.5).astype(np.uint8) * 255


def load_panel(sheet, row, col):
    name, cols, rows = SHEETS[sheet]
    img = np.asarray(Image.open(SRC / name).convert('RGB'))
    x0, x1 = cols[col]
    y0, y1 = rows[row]
    crop = img[y0 + INSET:y1 - INSET, x0 + INSET:x1 - INSET]
    alpha = key_magenta(crop)
    return np.dstack([crop, alpha])


def water_band(rgba):
    """superfície = 1a linha onde >=92% da largura é opaca; fundo = última."""
    full = (rgba[:, :, 3] > 0).mean(axis=1) >= 0.92
    ys = np.where(full)[0]
    return int(ys.min()), int(ys.max()) + 1


def scaled(rgba, s):
    im = Image.fromarray(rgba, 'RGBA')
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.BOX)


def main():
    # 1a passada: escala cada quadro pra água ficar com WATER_H e mede a crista
    scaled_frames = []
    for (sh, row, col) in WAVE_SEQ:
        p = load_panel(sh, row, col)
        top, bot = water_band(p)
        im = scaled(p[:bot], WATER_H / (bot - top))  # corta abaixo do fundo da água
        surf = im.height - WATER_H
        alpha = np.asarray(im)[:, :, 3] > 0
        crest = surf - int(np.where(alpha.any(axis=1))[0].min())
        scaled_frames.append((im, surf, crest))
    # altura do quadro: a maior crista inteira + a faixa de água (nada cortado reto)
    fh = max(c for _, _, c in scaled_frames) + 2 + WATER_H
    frames = []
    for im, surf, _ in scaled_frames:
        a = np.asarray(im).copy()
        # SÓ a crista: a água do quadro (outro painel, outro tom) sumia em cima da
        # faixa calma e virava um "bloco" mais escuro andando. Some abaixo da
        # superfície com rampa de 3px pra crista assentar na água.
        for k in range(3):
            if surf + k < a.shape[0]:
                a[surf + k, :, 3] = (a[surf + k, :, 3] * (1 - (k + 1) / 4)).astype(np.uint8)
        a[surf + 3:, :, 3] = 0
        im = Image.fromarray(a, 'RGBA')
        canvas = Image.new('RGBA', (FW, fh), (0, 0, 0, 0))
        x_src = max(0, (im.width - FW) // 2)
        canvas.alpha_composite(im.crop((x_src, 0, x_src + min(FW, im.width), im.height)),
                               (max(0, (FW - im.width) // 2), (fh - WATER_H) - surf))
        frames.append(canvas)

    # água calma tileável
    p = load_panel(*CALM_FROM)
    top, bot = water_band(p)
    band = scaled(p[top:bot], WATER_H / (bot - top)).resize((CALM_W + 24, WATER_H), Image.BOX)
    a = np.asarray(band).astype(np.float32)
    main_part = a[:, :CALM_W].copy()
    tail = a[:, CALM_W:CALM_W + 24]
    for i in range(24):  # crossfade: o começo do tile recebe o "depois" do fim
        w = 1 - i / 24
        main_part[:, i] = main_part[:, i] * (1 - w) + tail[:, i] * w
    main_part[:, :, 3] = 255
    calm = Image.fromarray(main_part.clip(0, 255).astype(np.uint8), 'RGBA')

    per_row = 5
    rows = (len(frames) + per_row - 1) // per_row
    W = max(CALM_W, per_row * FW)
    atlas = Image.new('RGBA', (W, WATER_H + rows * fh), (0, 0, 0, 0))
    atlas.alpha_composite(calm, (0, 0))
    pos = []
    for i, f in enumerate(frames):
        x, y = (i % per_row) * FW, WATER_H + (i // per_row) * fh
        atlas.alpha_composite(f, (x, y))
        pos.append([x, y])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT, optimize=True)

    layout = {'fw': FW, 'fh': fh, 'waterH': WATER_H, 'calm': [0, 0, CALM_W, WATER_H], 'waveFrames': pos}
    a = np.asarray(atlas)
    leak = int((((np.abs(a[:, :, :3].astype(int) - np.array([249, 28, 140])).sum(axis=2) < 60) & (a[:, :, 3] > 200))).sum())
    print(f'atlas {atlas.size} -> {OUT.relative_to(ROOT)}  vazamento magenta: {leak} px')
    print('MARE_ATLAS =', json.dumps(layout, separators=(', ', ': ')))


if __name__ == '__main__':
    main()
