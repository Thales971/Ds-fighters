#!/usr/bin/env python3
"""Atlas de habilidades do DEV VETERANO v2 a partir da arte do dono.

Fonte: arte-fonte/personagens/dev-veterano-v2/
  habilidades-1-orbes-raios.jpg  grade 4x4: orbes | raio | raio diagonal | explosoes
  habilidades-2-correntes.jpg    grade 4x5: anel | corrente reta | arco | espiral | estouro
Saida: assets/abilities/dev-veterano.png (4 colunas x 5 linhas de 128 px),
10 linhas (5 poderes + 5 impactos), lista em ROWS abaixo.
Folhas: 1 orbes/raios, 2 correntes, 3 granada, 4 punho, 5 pistola.

Uso: python3 tools/build_devvet_fx.py [--preview arq.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/personagens/dev-veterano-v2'
S = 128

SHEETS = {
    1: (SRC / 'habilidades-1-orbes-raios.jpg', 4, 4, 7),
    2: (SRC / 'habilidades-2-correntes.jpg', 4, 5, 7),
    3: (SRC / 'habilidades-3-granada.jpg', 4, 5, 7),
    4: (SRC / 'habilidades-4-punho.jpg', 4, 5, 7),
    5: (SRC / 'habilidades-5-pistola.jpg', 4, 5, 14),  # celulas com moldura arredondada
}
L = lambda sid, r: [(sid, c, r) for c in range(4)]
# linha do atlas -> 4 quadros (folha, coluna, linha) — kit v2 (js/data/devvet-v2.js)
ROWS = [
    L(5, 1),                                   # 0 Tiro Anti-Bug: rajada da pistola
    [(4, 0, 1), (4, 2, 3), (4, 3, 3), (4, 2, 3)],  # 1 Punho de 1TB: punho voando
    L(2, 1),                                   # 2 Correntes de Aco: corrente reta
    L(3, 0),                                   # 3 Granada: granada caindo
    L(4, 1),                                   # 4 Turbina (ult): punho com rastro + onda
    L(3, 2),                                   # 5 impacto da granada: explosao
    [(3, 2, 3), (3, 3, 3), (3, 3, 4), (3, 3, 3)],  # 6 fumaca da granada (zona)
    L(4, 4),                                   # 7 impacto da ult: aneis
    L(5, 2),                                   # 8 impacto do tiro
    L(4, 2),                                   # 9 impacto do punho
    [(5, 2, 3), (5, 0, 2), (5, 1, 2), (5, 2, 3)],  # 10 clarao do tiro na mao (lancamento)
    L(4, 0),                                   # 11 punho energizado carregando (lancamento)
    L(2, 0),                                   # 12 anel de corrente prendendo (acerto)
    L(2, 2),                                   # 13 chicote de corrente em arco (lancamento)
    [(3, 0, 3), (3, 1, 3), (3, 0, 3), (3, 1, 3)],  # 14 estilhacos da granada (2o acerto)
    L(1, 0),                                   # 15 esfera de energia crescendo (lancamento da ult)
    L(2, 3),                                   # 16 espiral de corrente (2o acerto)
]

def key_out(cell):
    """fundo magenta -> transparente (alfa suave pela distancia da cor do fundo)."""
    a = np.asarray(cell.convert('RGB')).astype(float)
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    alpha = np.clip((dist - 38) / 55, 0, 1)
    # descontamina a cor (tira o magenta das bordas semitransparentes)
    rgb = a.copy()
    al = alpha[..., None]
    rgb = np.where(al > 0.02, (a - bg * (1 - al)) / np.maximum(al, 0.02), a)
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    # magenta puro que sobra (rastro rosa da granada) vira transparente: o jogo
    # trata magenta como chroma-key e o teste visual barra
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mag = (G < 110) & (R > 150) & (B > 140) & (np.abs(R - B) < 80)
    out[..., 3] = np.where(mag, 0, out[..., 3])
    im = Image.fromarray(out, 'RGBA')
    # tira ruido isolado do JPEG
    m = im.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    im.putalpha(Image.fromarray(np.minimum(np.asarray(m), np.asarray(im.getchannel('A')))))
    return im


def cells(sheet_id):
    path, cols, rows, inset = SHEETS[sheet_id]
    im = Image.open(path).convert('RGB')
    cw, ch = im.width / cols, im.height / rows
    out = {}
    for r in range(rows):
        for c in range(cols):
            box = (int(c * cw) + inset, int(r * ch) + inset, int((c + 1) * cw) - inset, int((r + 1) * ch) - inset)
            out[(c, r)] = key_out(im.crop(box))
    return out


def fit(im):
    """centra e encaixa em 128x128 mantendo a proporcao (mesma escala nos 4 quadros da linha)."""
    return im


def main():
    cache = {k: cells(k) for k in SHEETS}
    atlas = Image.new('RGBA', (S * 4, S * len(ROWS)), (0, 0, 0, 0))
    for r, spec in enumerate(ROWS):
        frames = [cache[sid][(c, sr)] for sid, c, sr in spec]
        # escala unica pra linha: o maior conteudo dos 4 quadros cabe em 124 px
        boxes = [f.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox() for f in frames]
        bw = max((b[2] - b[0]) for b in boxes if b)
        bh = max((b[3] - b[1]) for b in boxes if b)
        sc = min(124 / bw, 124 / bh)
        for c, (f, b) in enumerate(zip(frames, boxes)):
            if not b:
                continue
            # recorte centrado no centro da celula original (o efeito mexe de verdade entre os quadros)
            w, h = f.size
            cx, cy = w / 2, h / 2
            half_w, half_h = bw / 2 + 2, bh / 2 + 2
            ux0 = min(b[0], cx - half_w); ux1 = max(b[2], cx + half_w)
            uy0 = min(b[1], cy - half_h); uy1 = max(b[3], cy + half_h)
            crop = f.crop((int(ux0), int(uy0), int(ux1), int(uy1)))
            nw, nh = max(1, int(crop.width * sc)), max(1, int(crop.height * sc))
            crop = crop.resize((nw, nh), Image.LANCZOS)
            cell = Image.new('RGBA', (S, S), (0, 0, 0, 0))
            cell.alpha_composite(crop, ((S - nw) // 2, (S - nh) // 2))
            atlas.alpha_composite(cell, (c * S, r * S))
    out = ROOT / 'assets/abilities/dev-veterano.png'
    atlas.save(out, optimize=True)
    print('ok', out, atlas.size)
    if '--preview' in sys.argv:
        pv = Image.new('RGBA', atlas.size, (36, 36, 48, 255))
        pv.alpha_composite(atlas)
        pv.save(sys.argv[sys.argv.index('--preview') + 1])


if __name__ == '__main__':
    main()
