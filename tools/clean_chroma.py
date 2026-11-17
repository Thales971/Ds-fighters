#!/usr/bin/env python3
"""Limpa vazamento de chroma-key magenta puro (#ff00ff) nos PNGs de assets.
No jogo, magenta puro = fundo transparente (chroma key). Pixel magenta puro
com alpha > 60 vira transparente; o resto fica intocado.
Uso: python3 tools/clean_chroma.py [--write] [arquivos/dirs...]
Sem --write faz só o dry-run (conta). Sem caminhos, varre assets/ inteiro.
"""
import os
import sys

from PIL import Image

MAGENTA = lambda r, g, b, a: a > 60 and r > 230 and g < 30 and b > 230


def clean(path, write):
    im = Image.open(path)
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if MAGENTA(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)
                n += 1
    if n and write:
        im.save(path)
    return n


def main():
    args = sys.argv[1:]
    write = '--write' in args
    args = [a for a in args if a != '--write']
    roots = args or ['assets']
    files = []
    for root in roots:
        if os.path.isfile(root):
            files.append(root)
        else:
            for dp, _, fns in os.walk(root):
                for fn in fns:
                    if fn.lower().endswith('.png'):
                        files.append(os.path.join(dp, fn))
    total = 0
    dirty = []
    for f in sorted(files):
        n = clean(f, write)
        if n:
            total += n
            dirty.append(f + ':' + str(n))
    print(('LIMPOU' if write else 'DRY-RUN') + f' {len(dirty)} arquivos, {total} px magenta')
    for d in dirty:
        print(' ', d)


if __name__ == '__main__':
    main()
