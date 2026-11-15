#!/usr/bin/env python3
"""Gera só as skins do menu. Os fundos dos eventos são arte própria em assets/maps/events."""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'maps' / 'v21'
OUT = ROOT / 'assets' / 'maps' / 'events'

MAPS = {
    'natal-praca': ('parque-lago', 'natal'),
    'natal-salao': ('biblioteca-noturna', 'natal'),
    'natal-telhado': ('telhado-escola', 'natal'),
    'halloween-rua': ('rua-centro-noite', 'halloween'),
    'halloween-cemiterio': ('parque-lago', 'halloween'),
    'halloween-mansao': ('biblioteca-noturna', 'halloween'),
}


def read_png(path):
    data = path.read_bytes()
    pos = 8
    w = h = color = None
    raw = b''
    while pos < len(data):
        n, typ = struct.unpack('>I4s', data[pos:pos + 8])
        pos += 8
        chunk = data[pos:pos + n]
        pos += n + 4
        if typ == b'IHDR':
            w, h, bit, color = struct.unpack('>IIBB', chunk[:10])
        elif typ == b'IDAT':
            raw += chunk
        elif typ == b'IEND':
            break
    pix = zlib.decompress(raw)
    bpp = 4 if color == 6 else 3
    rows = []
    i = 0
    prev = bytearray(w * bpp)
    for _y in range(h):
        f = pix[i]
        i += 1
        row = bytearray(pix[i:i + w * bpp])
        i += w * bpp
        if f == 1:
            for x in range(w * bpp):
                left = row[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + left) & 255
        elif f == 2:
            for x in range(w * bpp):
                row[x] = (row[x] + prev[x]) & 255
        elif f == 3:
            for x in range(w * bpp):
                left = row[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + ((left + prev[x]) // 2)) & 255
        elif f == 4:
            def paeth(a, b, c):
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                return a if pa <= pb and pa <= pc else (b if pb <= pc else c)
            for x in range(w * bpp):
                a = row[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + paeth(a, b, c)) & 255
        prev = row
        rows.append(row)
    return w, h, bpp, rows


def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    comp = zlib.compress(raw, 6)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b''))


def clamp(v):
    return 0 if v < 0 else 255 if v > 255 else int(v)


def grade_row(row, w, name):
    out = bytearray(len(row))
    bpp = 4
    for x in range(w):
        i = x * bpp
        r, g, b, a = row[i], row[i + 1], row[i + 2], row[i + 3]
        if a < 8:
            out[i:i + 4] = bytes((r, g, b, a))
            continue
        if name == 'halloween-cemiterio':
            r, g, b = clamp(r * 0.30 + 8), clamp(g * 0.22 + 6), clamp(b * 0.34 + 18)
        elif name.startswith('halloween'):
            r, g, b = clamp(r * 0.52 + 18), clamp(g * 0.42 + 8), clamp(b * 0.58 + 26)
        elif name == 'natal-salao':
            r, g, b = clamp(r * 0.94 + 4), clamp(g * 0.92 + 6), clamp(b * 1.02 + 10)
        elif name == 'natal-telhado':
            r, g, b = clamp(r * 0.80 + 8), clamp(g * 0.76 + 14), clamp(b * 1.08 + 26)
        else:
            r, g, b = clamp(r * 0.70 + 12), clamp(g * 0.78 + 16), clamp(b * 1.10 + 30)
        out[i:i + 4] = bytes((r, g, b, a))
    return out


def blank(w, h):
    return [bytearray(w * 4) for _ in range(h)]


def put(rows, x, y, rgba):
    h = len(rows)
    w = len(rows[0]) // 4
    if not (0 <= x < w and 0 <= y < h):
        return
    i = x * 4
    a = rgba[3]
    if a >= 250:
        rows[y][i:i + 4] = bytes(rgba)
        return
    dr, dg, db, da = rows[y][i:i + 4]
    if da == 0:
        rows[y][i:i + 4] = bytes(rgba)
        return
    t = a / 255
    rows[y][i] = clamp(rgba[0] * t + dr * (1 - t))
    rows[y][i + 1] = clamp(rgba[1] * t + dg * (1 - t))
    rows[y][i + 2] = clamp(rgba[2] * t + db * (1 - t))
    rows[y][i + 3] = max(da, a)


def triangle(rows, cx, top, half, height, color):
    if height <= 0 or half <= 0:
        return
    for dy in range(height):
        span = max(1, int(half * (dy + 1) / height))
        yy = top + dy
        for dx in range(-span, span + 1):
            put(rows, cx + dx, yy, color)


def disc(rows, cx, cy, r, fill, shade=None, edge=None):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            d2 = dx * dx + dy * dy
            if d2 > r * r:
                continue
            if edge and d2 >= (r - 1) * (r - 1):
                put(rows, cx + dx, cy + dy, edge)
            elif shade and dx > r // 3:
                put(rows, cx + dx, cy + dy, shade)
            else:
                put(rows, cx + dx, cy + dy, fill)


def tree(rows, cx, base, height=132):
    dark = (10, 42, 20, 255)
    mid = (22, 104, 44, 255)
    lite = (86, 176, 82, 255)
    snow = (242, 248, 255, 255)
    snow2 = (176, 204, 228, 255)
    trunk = (104, 64, 32, 255)
    trunk_d = (62, 36, 16, 255)
    tiers = 4
    th = height // 5
    top = base - height
    for t in range(tiers):
        half = 14 + t * 13
        h = th + 8
        y_bot = top + 18 + t * (th + 2)
        triangle(rows, cx, y_bot - h, half + 2, h + 2, dark)
        triangle(rows, cx, y_bot - h + 2, half - 1, h - 3, mid)
        for dy in range(3, h - 5):
            span = max(1, int((half - 1) * (dy + 1) / max(1, h - 3)))
            for dx in range(-span, -span // 2):
                if (dx + dy) % 2 == 0:
                    put(rows, cx + dx, y_bot - h + 2 + dy, lite)
        for dy in range(0, 4):
            span = max(1, int((half - 1) * (dy + 2) / max(1, h - 3)))
            col = snow if dy < 2 else snow2
            for dx in range(-span, span + 1):
                put(rows, cx + dx, y_bot - h + 2 + dy, col)
    for k in range(18):
        put(rows, cx - 2, base - 18 + k, trunk_d)
        put(rows, cx - 1, base - 18 + k, trunk)
        put(rows, cx, base - 18 + k, trunk)
        put(rows, cx + 1, base - 18 + k, trunk)
        put(rows, cx + 2, base - 18 + k, trunk_d)
    star(rows, cx, top + 6)
    for ox, oy, col in ((-10, 36, (210, 40, 42, 255)), (12, 52, (240, 196, 48, 255)), (-16, 70, (70, 170, 230, 255)), (8, 88, (210, 40, 42, 255)), (-6, 108, (240, 196, 48, 255))):
        bauble(rows, cx + ox, top + oy, col)
    gift(rows, cx - 28, base, (176, 32, 40, 255), (244, 214, 90, 255))
    gift(rows, cx + 16, base, (32, 78, 160, 255), (220, 48, 52, 255))


def star(rows, cx, cy):
    gold = (255, 214, 70, 255)
    edge = (150, 90, 16, 255)
    for d in range(-4, 5):
        put(rows, cx + d, cy, gold if abs(d) < 4 else edge)
        put(rows, cx, cy + d, gold if abs(d) < 4 else edge)
    for d in (-2, -1, 1, 2):
        put(rows, cx + d, cy + d, gold)
        put(rows, cx + d, cy - d, gold)
    put(rows, cx, cy, (255, 250, 210, 255))


def bauble(rows, cx, cy, col):
    edge = (20, 12, 16, 255)
    disc(rows, cx, cy, 3, col, edge=edge)
    put(rows, cx - 1, cy - 1, (255, 255, 240, 255))
    put(rows, cx, cy - 4, (180, 150, 60, 255))


def gift(rows, x, base, paper, ribbon):
    top = base - 12
    for dy in range(12):
        for dx in range(14):
            edge = dx in (0, 13) or dy in (0, 11)
            put(rows, x + dx, top + dy, (30, 16, 16, 255) if edge else paper)
    for dy in range(12):
        put(rows, x + 6, top + dy, ribbon)
        put(rows, x + 7, top + dy, ribbon)
    for dx in range(14):
        put(rows, x + dx, top + 5, ribbon)
    put(rows, x + 5, top - 2, ribbon)
    put(rows, x + 8, top - 2, ribbon)
    put(rows, x + 6, top - 3, ribbon)
    put(rows, x + 7, top - 3, ribbon)


def snowman(rows, cx, base):
    white = (244, 248, 255, 255)
    shade = (176, 196, 216, 255)
    edge = (90, 110, 130, 255)
    disc(rows, cx, base - 11, 12, white, shade, edge)
    disc(rows, cx, base - 30, 8, white, shade, edge)
    disc(rows, cx, base - 44, 6, white, shade, edge)
    for dx in range(-8, 9):
        put(rows, cx + dx, base - 50, (30, 30, 36, 255))
        put(rows, cx + dx, base - 49, (46, 46, 54, 255))
    for dy in range(8):
        for dx in range(-4, 5):
            put(rows, cx + dx, base - 62 + dy, (24, 24, 30, 255))
    put(rows, cx + 3, base - 63, (220, 40, 40, 255))
    put(rows, cx - 2, base - 44, (20, 16, 20, 255))
    put(rows, cx + 2, base - 44, (20, 16, 20, 255))
    for i in range(6):
        put(rows, cx + 3 + i, base - 42 + i // 3, (240, 120, 30, 255))
    for dy, col in ((-28, (200, 30, 36, 255)), (-18, (200, 30, 36, 255)), (-8, (200, 30, 36, 255))):
        put(rows, cx, base + dy, col)
    for i in range(10):
        put(rows, cx - 8 - i, base - 30 - i // 3, (92, 58, 28, 255))
        put(rows, cx + 8 + i, base - 30 + i // 4, (92, 58, 28, 255))
    for dx in range(-10, 11):
        put(rows, cx + dx, base - 36, (186, 28, 36, 255))


def pumpkin(rows, cx, base, scale=1):
    body = (232, 112, 22, 255)
    lite = (255, 168, 64, 255)
    ridge = (168, 64, 12, 255)
    edge = (70, 28, 8, 255)
    h = 22 * scale
    half = 14 * scale
    top = base - h
    for dy in range(h):
        bulge = 1 - abs(dy - h // 2) / (h / 2)
        span = max(2, int(half * (0.55 + 0.45 * bulge)))
        for dx in range(-span, span + 1):
            col = edge if abs(dx) >= span - 1 or dy in (0, h - 1) else body
            if col is body and abs(dx) % (5 * scale) < scale:
                col = ridge
            if col is body and dx < -span // 2 and dy < h // 2:
                col = lite
            put(rows, cx + dx, top + dy, col)
    stem = (34, 110, 36, 255)
    for k in range(5 * scale):
        put(rows, cx, top - k, stem)
        put(rows, cx + 1, top - k, (20, 72, 22, 255))
    put(rows, cx + 2, top - 3 * scale, stem)
    put(rows, cx + 3, top - 2 * scale, stem)
    cut = (16, 8, 6, 255)
    glow = (255, 196, 40, 255)
    eye = 4 * scale
    for ex in (-6 * scale, 5 * scale):
        for dy in range(eye):
            span = dy
            for dx in range(-span, span + 1):
                put(rows, cx + ex + dx, top + 6 * scale + dy, glow if dy > 0 else cut)
    mouth_y = top + 14 * scale
    for dx in range(-6 * scale, 6 * scale + 1):
        wave = 1 if (dx // scale) % 2 == 0 else 0
        put(rows, cx + dx, mouth_y + wave, cut)
        put(rows, cx + dx, mouth_y + wave + 1, glow)


def grave(rows, cx, base, h=40):
    stone = (168, 168, 176, 255)
    lite = (214, 214, 220, 255)
    shade = (96, 96, 108, 255)
    edge = (48, 48, 58, 255)
    top = base - h
    rad = 8
    for dy in range(h):
        inset = rad - int((rad * rad - min(rad, dy) ** 2) ** 0.5) if dy < rad else 0
        for dx in range(-9 + inset, 10 - inset):
            col = edge if dx in (-9 + inset, 9 - inset) or dy == h - 1 else stone
            if col is stone and dx < -3:
                col = lite
            if col is stone and dx > 5:
                col = shade
            put(rows, cx + dx, top + dy, col)
    for dy in range(10):
        put(rows, cx, top + 8 + dy, shade)
    for dx in range(-4, 5):
        put(rows, cx + dx, top + 12, shade)


def web(rows, x, y, reach=72, fx=1, fy=1):
    silk = (236, 236, 242, 210)
    for i in range(reach):
        put(rows, x + fx * i, y, silk)
        put(rows, x, y + fy * i, silk)
        put(rows, x + fx * i, y + fy * (i // 2), silk)
        put(rows, x + fx * (i // 2), y + fy * i, silk)
    for r in (16, 32, 48, 64):
        if r >= reach:
            continue
        for i in range(r):
            put(rows, x + fx * i, y + fy * (r - i // 2), silk)
            put(rows, x + fx * (r - i // 2), y + fy * i, silk)


def witch(rows, x, y):
    cloth = (28, 16, 40, 255)
    skin = (214, 164, 130, 255)
    brim = (16, 10, 22, 255)
    for dy in range(16):
        span = 10 - dy // 2
        for dx in range(-span, span + 1):
            put(rows, x + dx, y + dy, cloth)
    for dx in range(-14, 15):
        put(rows, x + dx, y + 16, brim)
        put(rows, x + dx, y + 17, cloth)
    disc(rows, x + 2, y + 22, 4, skin, edge=cloth)
    for dx in range(22):
        put(rows, x + 8 + dx, y + 26, (92, 58, 28, 255))
    for dy in range(8):
        for dx in range(6):
            put(rows, x + 28 + dx, y + 22 + dy, (120, 78, 36, 255))
    put(rows, x - 1, y + 21, (20, 12, 16, 255))
    put(rows, x + 3, y + 21, (20, 12, 16, 255))


def bat(rows, x, y):
    body = (18, 12, 24, 255)
    for dx in range(-8, 9):
        put(rows, x + dx, y, body)
        if abs(dx) > 2:
            put(rows, x + dx, y - 1 - abs(dx) // 4, body)
    put(rows, x, y + 1, body)
    put(rows, x, y + 2, body)


def moon(rows, cx, cy, r=18):
    light = (255, 236, 170, 255)
    mid = (232, 196, 110, 255)
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r:
                continue
            if (dx - 7) * (dx - 7) + dy * dy <= (r - 5) * (r - 5):
                continue
            put(rows, cx + dx, cy + dy, light if dx < 0 else mid)


def lights(rows, y, theme, x0=16, x1=None):
    w = len(rows[0]) // 4
    if x1 is None:
        x1 = w - 16
    cols = ((210, 36, 40, 255), (36, 150, 64, 255), (240, 196, 48, 255)) if theme == 'natal' else ((255, 120, 24, 255), (150, 70, 220, 255), (255, 210, 60, 255))
    wire = (36, 28, 32, 255)
    for x in range(x0, x1, 2):
        sag = 2 if (x // 18) % 2 else 0
        put(rows, x, y + sag, wire)
        if x % 18 == 0:
            c = cols[(x // 18) % 3]
            for dx in range(-1, 2):
                put(rows, x + dx, y + sag + 4, c)
                put(rows, x + dx, y + sag + 5, c)
            put(rows, x, y + sag + 3, (255, 255, 230, 230))


def flake_at(rows, x, y):
    white = (248, 252, 255, 235)
    put(rows, x, y, white)
    put(rows, x - 1, y, white)
    put(rows, x + 1, y, white)
    put(rows, x, y - 1, white)
    put(rows, x, y + 1, white)


def flakes(rows, n=70, y_max=None):
    w = len(rows[0]) // 4
    h = len(rows)
    limit = y_max or (h - 80)
    for i in range(n):
        flake_at(rows, (i * 97 + 13) % w, (i * 53 + 7) % max(1, limit))


def edge_snow(rows, y0, y1, drop=90):
    h = len(rows)
    w = len(rows[0]) // 4
    white = (236, 244, 255, 245)
    shade = (186, 206, 224, 230)
    y0 = max(1, y0)
    y1 = min(h - 1, y1)
    for y in range(y0, y1):
        for x in range(w):
            i = x * 4
            r, g, b, a = rows[y][i:i + 4]
            if a < 200 or r + g + b > 640:
                continue
            ar, ag, ab, aa = rows[y - 1][i:i + 4]
            if aa > 200 and (ar + ag + ab) < (r + g + b) + drop:
                continue
            put(rows, x, y, white)
            if y + 1 < h and (x + y) % 2 == 0:
                put(rows, x, y + 1, shade)


def dust(rows, y0, y1, step=9):
    h = len(rows)
    w = len(rows[0]) // 4
    snow = (232, 240, 250, 150)
    for y in range(max(0, y0), min(h, y1)):
        for x in range(w):
            if (x * 3 + y * 5) % step:
                continue
            i = x * 4
            if rows[y][i + 3] < 200:
                continue
            put(rows, x, y, snow)


def window_snow(rows):
    h = len(rows)
    w = len(rows[0]) // 4

    def sky(x, y):
        if not (0 <= x < w and 0 <= y < h):
            return False
        r, g, b, a = rows[y][x * 4:x * 4 + 4]
        return a > 200 and b > r + 16 and b > 36 and b >= g
    for y in range(40, 340):
        for x in range(w):
            if not sky(x, y):
                continue
            if (x * 13 + y * 7) % 29 == 0:
                flake_at(rows, x, y)
            if not sky(x, y + 1):
                put(rows, x, y, (236, 244, 255, 230))
                put(rows, x, y - 1, (236, 244, 255, 180))


def frost_opaque(rows):
    h = len(rows)
    w = len(rows[0]) // 4
    for y in range(h):
        for x in range(w):
            i = x * 4
            r, g, b, a = rows[y][i:i + 4]
            if a < 40:
                continue
            above = rows[y - 1][i + 3] if y else 0
            if g > r + 8 and (above < 40 or (x + y) % 3 == 0):
                put(rows, x, y, (236, 244, 255, 180 if above < 40 else 90))


def icicles(rows, y=0, x0=0, x1=None):
    w = len(rows[0]) // 4
    if x1 is None:
        x1 = w
    ice = (232, 244, 255, 235)
    shade = (150, 186, 214, 220)
    for x in range(x0, x1, 18):
        length = 10 + (x * 3) % 14
        for k in range(length):
            put(rows, x, y + k, ice if k < 2 else shade)
            if k < length - 3:
                put(rows, x + 1, y + k, ice)


def menu_natal():
    rows = blank(960, 540)
    icicles(rows, 0)
    for x in range(960):
        put(rows, x, 0, (220, 236, 255, 220))
        put(rows, x, 539, (220, 236, 255, 180))
    for y in range(540):
        put(rows, 0, y, (220, 236, 255, 180))
        put(rows, 959, y, (220, 236, 255, 180))
    lights(rows, 108, 'natal', 24, 936)
    tree(rows, 520, 508, 250)
    snowman(rows, 390, 508)
    for i in range(48):
        flake_at(rows, (i * 83 + 20) % 960, 30 + (i * 47) % 470)
    for x in range(960):
        top = 512 + (x * 5) % 10
        for y in range(top, 540):
            put(rows, x, y, (244, 248, 255, 230) if y < top + 3 else (186, 208, 226, 210))
    return rows


def menu_halloween():
    rows = blank(960, 540)
    web(rows, 0, 0, 110, 1, 1)
    web(rows, 959, 0, 110, -1, 1)
    web(rows, 0, 539, 80, 1, -1)
    web(rows, 959, 539, 80, -1, -1)
    moon(rows, 630, 78, 26)
    witch(rows, 470, 70)
    for bx, by in ((400, 120), (700, 150), (560, 40), (360, 180)):
        bat(rows, bx, by)
    pumpkin(rows, 430, 500, 2)
    pumpkin(rows, 530, 508, 2)
    pumpkin(rows, 640, 496, 2)
    return rows


def decorate(rows, name, layer):
    if layer == 'near':
        if name.startswith('natal'):
            frost_opaque(rows)
        return
    if name == 'natal-praca':
        if layer == 'far':
            flakes(rows, 90, 400)
            edge_snow(rows, 40, 430)
        else:
            edge_snow(rows, 40, 430)
            lights(rows, 64, 'natal')
            tree(rows, 248, 428, 128)
            tree(rows, 720, 428, 128)
            dust(rows, 436, 458, 8)
            flakes(rows, 40, 360)
    elif name == 'natal-salao':
        if layer == 'mid':
            lights(rows, 58, 'natal', 80, 880)
            window_snow(rows)
            tree(rows, 78, 486, 150)
            tree(rows, 888, 486, 120)
    elif name == 'natal-telhado':
        if layer == 'far':
            flakes(rows, 80, 340)
            edge_snow(rows, 20, 360)
        else:
            edge_snow(rows, 20, 372)
            lights(rows, 338, 'natal', 40, 920)
            dust(rows, 378, 470, 7)
            tree(rows, 150, 458, 110)
            snowman(rows, 820, 456)
            flakes(rows, 36, 340)
    elif name == 'halloween-rua':
        if layer == 'far':
            moon(rows, 760, 70, 20)
            witch(rows, 180, 48)
            for bx, by in ((120, 120), (420, 80), (640, 130)):
                bat(rows, bx, by)
        else:
            web(rows, 4, 4, 90, 1, 1)
            web(rows, 955, 4, 80, -1, 1)
            pumpkin(rows, 86, 468, 2)
            pumpkin(rows, 210, 460, 1)
            pumpkin(rows, 860, 466, 2)
    elif name == 'halloween-cemiterio':
        if layer == 'far':
            moon(rows, 700, 78, 22)
            witch(rows, 140, 60)
            for bx, by in ((300, 90), (520, 50), (860, 110)):
                bat(rows, bx, by)
        else:
            web(rows, 6, 6, 70, 1, 1)
            web(rows, 954, 6, 70, -1, 1)
            for x, h in ((130, 36), (230, 48), (330, 32), (640, 44), (750, 30), (850, 40)):
                grave(rows, x, 422, h)
            pumpkin(rows, 70, 430, 1)
            pumpkin(rows, 900, 428, 1)
    elif name == 'halloween-mansao':
        if layer == 'mid':
            web(rows, 8, 8, 86, 1, 1)
            web(rows, 952, 8, 86, -1, 1)
            web(rows, 250, 36, 48, 1, 1)
            pumpkin(rows, 86, 484, 2)
            pumpkin(rows, 874, 484, 2)


def main():
    """Só as skins do menu. Os fundos dos palcos são arte própria, não recolor."""
    ui = ROOT / 'assets' / 'ui'
    ui.mkdir(parents=True, exist_ok=True)
    write_png(ui / 'skin-natal.png', 960, 540, menu_natal())
    write_png(ui / 'skin-halloween.png', 960, 540, menu_halloween())
    print('skins', (ui / 'skin-natal.png').stat().st_size, (ui / 'skin-halloween.png').stat().st_size)


if __name__ == '__main__':
    main()
