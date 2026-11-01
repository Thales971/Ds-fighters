"""Alonga a barba do DU e deixa grisalha (preta e branca) em todos os quadros da folha.
Uso: python3 tools/du-beard.py assets/sprites/du.png
"""
import sys, colorsys
from PIL import Image

FW, FH, COLS = 320, 260, 4
PAL = [(16, 16, 18), (52, 52, 56), (110, 110, 116), (186, 186, 190), (238, 238, 240)]
OUT = (10, 10, 12)


def is_beard(p):
    r, g, b, a = p
    if a < 200:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return 0.045 <= h <= 0.12 and s > 0.55 and 0.12 < v < 0.52 and g >= r * 0.28


def process(fr):
    px = fr.load()
    bb = fr.getbbox()
    if not bb:
        return fr
    x0, y0, x1, y1 = bb
    if (y1 - y0) < (x1 - x0) * 1.1:  # deitado (KO) — só recolore
        top_lim = y1
    else:
        top_lim = y0 + int((y1 - y0) * 0.30)
    mask = set()
    for y in range(y0, top_lim):
        for x in range(x0, x1):
            if is_beard(px[x, y]):
                mask.add((x, y))
    if len(mask) < 25:
        return fr
    # remove ruído isolado
    mask = {(x, y) for (x, y) in mask if sum(((x + dx, y + dy) in mask) for dx in (-1, 0, 1) for dy in (-1, 0, 1)) >= 4}
    if not mask:
        return fr
    # maior componente conectado
    comps=[]; seen=set()
    for m in mask:
        if m in seen: continue
        st=[m]; comp=[]; seen.add(m)
        while st:
            q=st.pop(); comp.append(q)
            for dx in (-1,0,1):
                for dy in (-1,0,1):
                    n=(q[0]+dx,q[1]+dy)
                    if n in mask and n not in seen:
                        seen.add(n); st.append(n)
        comps.append(comp)
    mask=set(max(comps,key=len))
    if len(mask) < 25:
        return fr
    xs = [m[0] for m in mask]
    ys = [m[1] for m in mask]
    bx0, bx1 = min(xs), max(xs)
    by0, by1 = min(ys), max(ys)
    bh = by1 - by0 + 1
    width = bx1 - bx0 + 1
    if width < 6:
        return fr
    cx = (bx0 + bx1) / 2

    def color(x, y, base_v):
        strand = ((x + (y // 7)) // 2) % 3
        if strand == 0:
            idx = 4 if base_v > 0.3 else 3
        elif strand == 1:
            idx = 2 if base_v > 0.3 else 1
        else:
            idx = 1 if base_v > 0.32 else 0
        return PAL[idx] + (255,)

    # recolore a barba existente
    for (x, y) in mask:
        r, g, b, a = px[x, y]
        v = max(r, g, b) / 255
        px[x, y] = color(x, y, v)
    # alonga: cada coluna desce em ponta
    ext = int(max(8, bh * 0.7))
    bottoms = {}
    for (x, y) in mask:
        bottoms[x] = max(bottoms.get(x, -1), y)
    new = set()
    for x, yb in bottoms.items():
        if yb < by1 - bh * 0.45:
            continue
        rel = abs(x - cx) / (width / 2)
        L = int(ext * max(0.0, 1 - rel ** 1.6))
        for k in range(1, L + 1):
            y = yb + k
            if y >= FH:
                break
            new.add((x, y))
    for (x, y) in new:
        px[x, y] = color(x, y, 0.4)
    allm = mask | new
    for (x, y) in new:
        for dx, dy in ((1, 0), (-1, 0), (0, 1)):
            q = (x + dx, y + dy)
            if q not in allm and 0 <= q[0] < FW and 0 <= q[1] < FH:
                px[q[0], q[1]] = OUT + (255,)
    return fr


def main(path):
    im = Image.open(path).convert('RGBA')
    W, H = im.size
    rows = H // FH
    for r in range(rows):
        for c in range(COLS):
            box = (c * FW, r * FH, (c + 1) * FW, (r + 1) * FH)
            fr = im.crop(box)
            im.paste(process(fr), box)
    im.save(path)


if __name__ == '__main__':
    main(sys.argv[1])
