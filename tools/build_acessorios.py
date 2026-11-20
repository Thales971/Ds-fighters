#!/usr/bin/env python3
"""Acessórios universais em pixel art (assets/acc/*.png).

Cada acessório é desenhado numa grade lógica pequena (1 caractere = 1 pixel)
e ampliado 3x sem suavizar, com contorno escuro — mesma cara dos sprites.
Olhando pra DIREITA (o jogo espelha quando o lutador vira).

Uso: python3 tools/build_acessorios.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/acc'
SCALE = 3

PAL = {
    '.': None,
    'k': (26, 16, 32, 255),     # contorno
    'r': (214, 40, 48, 255),    # vermelho
    'R': (150, 22, 36, 255),    # vermelho sombra
    'p': (255, 110, 110, 255),  # vermelho brilho
    'w': (245, 245, 240, 255),  # branco
    'W': (200, 200, 205, 255),  # branco sombra
    'y': (255, 206, 64, 255),   # ouro
    'Y': (196, 132, 26, 255),   # ouro sombra
    'o': (255, 244, 170, 255),  # ouro brilho
    'b': (52, 120, 255, 255),   # azul (gema)
    'g': (40, 200, 120, 255),   # verde (gema)
    'n': (22, 22, 30, 255),     # preto lente
    'c': (120, 230, 255, 255),  # reflexo ciano
    's': (70, 76, 92, 255),     # cinza escuro
    'S': (120, 128, 148, 255),  # cinza claro
    'm': (255, 79, 216, 255),   # magenta neon (LED)
}

ART = {
    # BONÉ: copa vermelha, aba pra frente (direita), botão branco no topo
    'bone': [
        '......kkkkkk..........',
        '....kkrrrwrrkk........',
        '...krrprrrrrrrk.......',
        '..krprrrrrrrrrrk......',
        '..krrrrwwwwrrrrk......',
        '.krrrrwrrrrwrrrrk.....',
        '.krrrrrwwwwrrrrrkkkk..',
        '.kRrrrrrrrrrrrrrRRRRk.',
        '.kRRRRRRRRRRRRRRRRRRRk',
        '..kkkkkkkkkkkkkkkkkkk.',
    ],
    # ÓCULOS ESCUROS: duas lentes com reflexo, ponte no meio
    'oculos': [
        'kkkkkkkkkkkkkkkkkkkkkkk',
        'knnnnnnnnkkkkknnnnnnnnk',
        'kncnnnnnnk...kncnnnnnnk',
        'knccnnnnnk...knccnnnnnk',
        'knnnnnnnnk...knnnnnnnnk',
        '.knnnnnnk.....knnnnnnk.',
        '..kkkkkk.......kkkkkk..',
    ],
    # COROA: ouro com 3 pontas e gemas
    'coroa': [
        '.k........k........k.',
        'kok......kok......kok',
        'kyk.....kyoyk.....kyk',
        'kyyk...kyyyyyk...kyyk',
        'kyyyk.kyyyyyyyk.kyyyk',
        'kyyyykyyyyyyyyykyyyyk',
        'kyyryyyyybyyyyyyyryyk',
        'kyrrryyybbbyyyyyrrryk',
        'kyyryyyyybyyyyyyyryyk',
        'kYYYYYYYYYYYYYYYYYYYk',
        '.kkkkkkkkkkkkkkkkkkk.',
    ],
    # FONE GAMER: arco por cima da cabeça + conchas dos lados com LED
    'fone': [
        '........kkkkkkkkk........',
        '......kkSSSSSSSSSkk......',
        '.....kSsskkkkkkkssSk.....',
        '....kSsk.........ksSk....',
        '...kSsk...........ksSk...',
        '...kSk.............kSk...',
        '..kSsk.............ksSk..',
        '..kSk...............kSk..',
        'kkkSkk.............kkSkkk',
        'ksssssk...........ksssssk',
        'ksmmssk...........kssmmsk',
        'ksmmssk...........kssmmsk',
        'ksssssk...........ksssssk',
        '.kkkkk.............kkkkk.',
    ],
    # FAIXA NINJA: faixa vermelha na testa + pontas amarradas voando pra trás
    'faixa': [
        'kk............................',
        'krk...........................',
        'kRrk..kkkkkkkkkkkkkkkkkkkkkkkk',
        '.kRrkkrrrrrrrrrrrrrrrrrrrrrrrk',
        '..kRrrpppppppprrrrrrrrrrrrrrrk',
        '.kRrkkrrrrrrrrrrrrrrrrrrrrrrrk',
        'kRrk..RRRRRRRRRRRRRRRRRRRRRRRk',
        'krk...kkkkkkkkkkkkkkkkkkkkkkkk',
        'kk............................',
    ],
}


def build(name, rows):
    w = max(len(r) for r in rows)
    img = Image.new('RGBA', (w, len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            c = PAL[ch]
            if c:
                img.putpixel((x, y), c)
    img = img.resize((w * SCALE, len(rows) * SCALE), Image.NEAREST)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{name}.png', optimize=True)
    return img.size


if __name__ == '__main__':
    for name, rows in ART.items():
        print(name, build(name, rows))
