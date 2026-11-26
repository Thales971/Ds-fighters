#!/usr/bin/env python3
"""Atlas de habilidades do CRACKER (assets/abilities/cracker.png, 4x5 de 128px).

Fonte: arte do dono em arte-fonte/pitoco-pet/mare-alta-nova-sprites-recortar/Craker-personagem/
  'Cracker efeitos 1.jpg' e 'Cracker efeitos 2.jpg' (8 sprites cada, fundo magenta).
Cada sprite e recortado, o magenta vira transparencia (com despill na borda)
e os 4 quadros de cada linha sao montados a partir deles.

Linhas (uma por poder, ver js/data/fighters-cracker.js):
  0 Pacote Suspeito  caveira-virus (projetil, rastro de pixels pra tras)
  1 Roubo de Dados   mira travando -> pixels sugados -> corte de dados
  2 Blink            silhueta dupla -> vortice -> faixas de glitch
  3 Quarentena       jaula de codigo (zona no chao, quadros 1-3 piscam)
  4 DDoS Massivo     cubos de dados (cada pacote da rajada)
Coluna 0 de cada linha e o icone do poder (HUD/menu).

Uso: python3 tools/build_cracker_fx.py [--preview arquivo.png]
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'arte-fonte/pitoco-pet/mare-alta-nova-sprites-recortar/Craker-personagem'
OUT = ROOT / 'assets/abilities/cracker.png'
S = 128


def key_out(img, bg):
    """Fundo magenta -> alpha (distancia de cor), com despill da borda."""
    img = img.convert('RGB')
    w, h = img.size
    src = img.load()
    out = Image.new('RGBA', (w, h))
    dst = out.load()
    br, bgc, bb = bg
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            d = ((r - br) ** 2 + (g - bgc) ** 2 + (b - bb) ** 2) ** 0.5
            # magenta puro tem G ~ 0 e R ~ B: reforca a deteccao por "magentice"
            mag = min(r, b) - g - abs(r - b) * 0.8
            a = (d - 45) / 75.0
            if mag > 90 and d < 90:
                a = min(a, (d - 45) / 120.0)
            a = max(0.0, min(1.0, a))
            if a <= 0.02:
                dst[x, y] = (0, 0, 0, 0)
                continue
            if a < 1:
                r = (r - (1 - a) * br) / a
                g = (g - (1 - a) * bgc) / a
                b = (b - (1 - a) * bb) / a
            # despill: tira o resto de magenta da borda
            spill = min(r, b) - g
            if spill > 0 and a < 1:
                r -= spill * 0.6
                b -= spill * 0.6
            dst[x, y] = (int(max(0, min(255, r))), int(max(0, min(255, g))), int(max(0, min(255, b))), int(a * 255))
    return out


def trim(im, pad=2):
    bbox = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def sheet_sprites(path, boxes):
    im = Image.open(path).convert('RGB')
    bg = im.getpixel((5, 5))
    return {name: trim(key_out(im.crop(box), bg)) for name, box in boxes.items()}


# caixas (x0, y0, x1, y1) de cada sprite nas imagens 1184x896
B1 = {
    'code': (40, 10, 270, 430), 'skull': (300, 40, 600, 400), 'cubes': (590, 40, 900, 420), 'laser': (895, 140, 1180, 360),
    'bolt': (15, 460, 290, 860), 'bomb': (305, 500, 600, 800), 'cage': (610, 470, 870, 860), 'vortex': (870, 480, 1180, 860),
}
B2 = {
    'bars': (6, 120, 290, 300), 'cloud': (300, 50, 588, 420), 'pile': (596, 50, 884, 400), 'ghost': (892, 50, 1180, 420),
    'target': (6, 500, 290, 750), 'slash': (300, 470, 588, 880), 'bug': (596, 540, 884, 780), 'stripes': (892, 460, 1180, 880),
}


def biggest_blob(im, thr=150):
    """Maior bloco opaco conectado (um cubo da rajada, sem os vizinhos/rastros)."""
    # erode antes: os rastros finos que ligam um cubo ao outro somem
    a = im.getchannel('A').filter(ImageFilter.MinFilter(7)).load()
    w, h = im.size
    seen = bytearray(w * h)
    best = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or a[x0, y0] < thr:
                continue
            stack, comp = [(x0, y0)], []
            seen[y0 * w + x0] = 1
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] >= thr:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    mask = Image.new('L', im.size, 0)
    mp = mask.load()
    for x, y in best:
        mp[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(9))
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel('A'), mask))
    return trim(out)


def fit(im, box=S - 8, scale=1.0):
    k = min(box / im.width, box / im.height) * scale
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def place(cell, im, cx=S / 2, cy=S / 2, alpha=1.0):
    if alpha < 1:
        a = im.getchannel('A').point(lambda v: int(v * alpha))
        im = im.copy()
        im.putalpha(a)
    cell.alpha_composite(im, (int(round(cx - im.width / 2)), int(round(cy - im.height / 2))))


def glow(im, color, radius=6, strength=0.8):
    """Halo colorido atras do sprite (o motor ja soma brilho; aqui so contorno)."""
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(min(255, v * strength)))
    g = Image.new('RGBA', im.size, color + (0,))
    g.putalpha(a)
    pad = radius * 2
    base = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2))
    big = Image.new('RGBA', base.size)
    big.paste(g, (pad, pad))
    base.alpha_composite(big.filter(ImageFilter.GaussianBlur(radius / 2)))
    base.alpha_composite(im, (pad, pad))
    return base


def shift_rows(im, amp, seed):
    """Glitch: desloca faixas horizontais."""
    out = Image.new('RGBA', im.size)
    h = im.height
    y = 0
    k = seed
    while y < h:
        bh = 3 + (k * 7) % 9
        dx = ((k * 13) % (2 * amp + 1)) - amp
        out.paste(im.crop((0, y, im.width, min(h, y + bh))), (dx, y))
        y += bh
        k += 1
    return out


def brighten(im, f):
    rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(f).convert('RGBA')
    rgb.putalpha(im.getchannel('A'))
    return rgb


def build():
    sp = {}
    sp.update(sheet_sprites(SRC / 'Cracker efeitos 1.jpg', B1))
    sp.update(sheet_sprites(SRC / 'Cracker efeitos 2.jpg', B2))
    atlas = Image.new('RGBA', (S * 4, S * 5))

    def cell(r, c):
        im = Image.new('RGBA', (S, S))
        return im, (c * S, r * S)

    def put(r, c, im):
        atlas.alpha_composite(im, (c * S, r * S))

    GREEN = (57, 255, 106)

    # 0 PACOTE SUSPEITO: caveira-virus. O original solta pixels pra DIREITA;
    # espelhado, o rastro fica atras quando o projetil vai pra direita.
    skull = sp['skull'].transpose(Image.FLIP_LEFT_RIGHT)
    for c, (sc, dx, br) in enumerate([(1.0, 0, 1.0), (0.94, 2, 1.15), (0.98, -1, 1.05), (0.92, 1, 1.2)]):
        im, _ = cell(0, c)
        s = fit(skull, 116, sc)
        if c:
            s = brighten(s, br)
        place(im, s, S / 2 + dx, S / 2)
        put(0, c, im)

    # 1 ROUBO DE DADOS: mira trava no alvo -> nuvem de dados -> pixels sugados
    tgt, cloud, pile = sp['target'], sp['cloud'], sp['pile']
    frames1 = [
        [(tgt, 1.0, 1.0)],
        [(cloud, 0.8, 0.55), (tgt, 0.82, 1.0)],
        [(cloud, 1.0, 0.95), (tgt, 0.62, 0.7)],
        [(pile, 1.0, 1.0), (tgt, 0.5, 0.45)],
    ]
    for c, layers in enumerate(frames1):
        im, _ = cell(1, c)
        for src, sc, al in layers:
            place(im, fit(src, 120, sc), alpha=al)
        put(1, c, im)

    # 2 BLINK: silhueta dupla (icone) -> vortice -> vortice + glitch -> fantasma sumindo
    ghost, vortex, bars = sp['ghost'], sp['vortex'], sp['stripes']
    im, _ = cell(2, 0); place(im, fit(ghost, 120)); put(2, 0, im)
    im, _ = cell(2, 1); place(im, fit(vortex, 120, 0.8)); place(im, fit(ghost, 120, 0.7), alpha=0.55); put(2, 1, im)
    im, _ = cell(2, 2); place(im, fit(vortex.rotate(40, resample=Image.BICUBIC, expand=True), 120, 1.0)); place(im, fit(sp['bars'], 120, 0.9), alpha=0.8); put(2, 2, im)
    im, _ = cell(2, 3); place(im, shift_rows(fit(ghost, 120, 0.95), 10, 3), alpha=0.7); place(im, fit(vortex.rotate(80, resample=Image.BICUBIC, expand=True), 120, 0.55), alpha=0.8); put(2, 3, im)

    # 3 QUARENTENA: jaula de codigo. A zona desenha os quadros 1-3 achatados
    # (sy 0.6), entao a jaula ocupa a celula toda e a chuva de codigo pisca dentro.
    cage, code = sp['cage'], sp['code']
    im, _ = cell(3, 0); place(im, fit(cage, 120)); put(3, 0, im)
    for c, (br, cy, al) in enumerate([(1.0, 70, 0.55), (1.3, 58, 0.8), (1.12, 64, 0.65)], start=1):
        im, _ = cell(3, c)
        place(im, fit(code, 124, 0.9), cy=cy, alpha=al)
        place(im, brighten(fit(cage, 126), br))
        put(3, c, im)

    # 4 DDoS: cada pacote e um cubo de dados girando; icone = a rajada inteira
    cubes = sp['cubes']
    # cubo isolado (o maior da rajada, sem os vizinhos)
    one = biggest_blob(cubes)
    # quadro 0 (icone e tambem quadro do projetil): cubo + 2 pacotes menores atras
    im, _ = cell(4, 0)
    place(im, fit(one, 34).rotate(15, resample=Image.BICUBIC, expand=True), 30, 34, alpha=0.75)
    place(im, fit(one, 44).rotate(-20, resample=Image.BICUBIC, expand=True), 44, 92, alpha=0.85)
    place(im, glow(fit(one, 66), GREEN, 5, 0.6), 78, 60)
    put(4, 0, im)
    for c, ang in enumerate([0, 30, 60], start=1):
        im, _ = cell(4, c)
        cube = fit(one, 66).rotate(ang, resample=Image.BICUBIC, expand=True)
        place(im, glow(cube, GREEN, 5, 0.6))
        put(4, c, im)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT, optimize=True)
    return atlas, sp


if __name__ == '__main__':
    atlas, sp = build()
    print('ok', OUT, atlas.size)
    if '--preview' in sys.argv:
        dst = sys.argv[sys.argv.index('--preview') + 1]
        bgim = Image.new('RGBA', atlas.size, (28, 30, 44, 255))
        bgim.alpha_composite(atlas)
        bgim.convert('RGB').resize((atlas.width * 2, atlas.height * 2), Image.NEAREST).save(dst)
