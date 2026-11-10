#!/usr/bin/env python3
"""Corta os masters gerados em três camadas de parallax e grava o som de cada palco."""
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/opt/cursor/artifacts/assets')
OUT = ROOT / 'assets/maps/v21'
SFX = ROOT / 'assets/audio/sfx'
W, H = 960, 540

# id, nome, grupo, clima, tint, frequência do laço
STAGES = [
    ('estacao-valinhos', 'Estação Valinhos', 'Valinhos', ['clear', 'wind'], '#e7b078', 90, 'station'),
    ('feira-valinhos', 'Feira de Valinhos', 'Valinhos', ['clear'], '#ffb15a', 140, 'market'),
    ('represa', 'Represa', 'Valinhos', ['clear', 'rain', 'wind'], '#7ec8e0', 220, 'lake'),
    ('rua-centro-noite', 'Rua do Centro à Noite', 'Valinhos', ['clear', 'rain'], '#9aa0ff', 70, 'night'),
    ('quadra-areia', 'Quadra de Areia', 'Valinhos', ['clear', 'wind'], '#f0d090', 180, 'sand'),
    ('arquibancada', 'Arquibancada do Ginásio', 'Valinhos', ['clear'], '#e8e8f0', 200, 'stands'),
    ('oficina-senai', 'Oficina SENAI', 'Valinhos', ['clear'], '#c6dbeb', 80, 'workshop'),
    ('terminal-onibus', 'Terminal de Ônibus', 'Valinhos', ['clear', 'rain', 'wind'], '#b9c6d4', 100, 'bus'),
    ('cafe-madrugada', 'Café da Madrugada', 'Valinhos', ['clear', 'rain'], '#ffb07a', 210, 'cafe'),
    ('corredor-datacenter', 'Corredor do Datacenter', 'Código', ['clear'], '#7de0ff', 55, 'racks'),
    ('sala-deploy', 'Sala de Deploy', 'Código', ['clear'], '#9ad0ff', 64, 'studio'),
    ('hackerspace', 'Hackerspace', 'Código', ['clear', 'rain'], '#c080ff', 48, 'night'),
    ('telhado-escola', 'Telhado da Escola', 'Valinhos', ['clear', 'wind'], '#ffd0a0', 160, 'roof'),
    ('ponte-rio', 'Ponte do Rio', 'Valinhos', ['rain', 'storm', 'wind'], '#8fb4c8', 130, 'bridge'),
    ('parque-lago', 'Parque do Lago', 'Valinhos', ['clear', 'wind'], '#b7e39a', 240, 'park'),
    ('mercado-municipal', 'Mercado Municipal', 'Valinhos', ['clear'], '#ffd29a', 150, 'market'),
    ('estudio-pixel', 'Estúdio de Pixel', 'Código', ['clear'], '#ff9ad5', 190, 'studio'),
    ('antena-morro', 'Antena no Morro', 'Valinhos', ['wind', 'storm', 'clear'], '#9ecfff', 60, 'antenna'),
    ('biblioteca-noturna', 'Biblioteca Noturna', 'Código', ['clear'], '#f0d8a8', 110, 'library'),
    ('pista-skate', 'Pista de Skate', 'Valinhos', ['clear', 'wind'], '#ffb080', 170, 'skate'),
]


def fit(im):
    im = im.convert('RGB')
    # encaixa 16:9 cortando o excesso do centro
    w, h = im.size
    target = W / H
    if w / h > target:
        nw = int(h * target)
        x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / target)
        y = (h - nh) // 2
        im = im.crop((0, y, w, y + nh))
    return im.resize((W, H), Image.Resampling.LANCZOS)


def split(master):
    base = fit(master)
    far = base.filter(ImageFilter.GaussianBlur(1.2)).convert('RGBA')
    # o céu fica na camada lenta; embaixo fica transparente para o meio aparecer
    pix = far.load()
    for y in range(H):
        fade = 1 if y < int(H * 0.42) else max(0, 1 - (y - H * 0.42) / (H * 0.18))
        if fade <= 0:
            for x in range(W):
                r, g, b, a = pix[x, y]
                pix[x, y] = (r, g, b, 0)
        elif fade < 1:
            for x in range(W):
                r, g, b, a = pix[x, y]
                pix[x, y] = (r, g, b, int(255 * fade))
    mid = base.convert('RGBA')
    near = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    band = base.crop((0, int(H * 0.78), W, H))
    mask = Image.new('L', band.size, 0)
    mp = mask.load()
    for y in range(band.size[1]):
        a = int(180 * (y / band.size[1]))
        for x in range(0, 90):
            mp[x, y] = a
        for x in range(W - 90, W):
            mp[x, y] = a
    near.paste(band, (0, int(H * 0.78)), mask)
    return far, mid, near


def ambient(name, freq):
    dest = SFX / f'amb_{name}.mp3'
    if dest.exists() and dest.stat().st_size > 1000:
        return
    subprocess.check_call([
        'ffmpeg', '-y', '-f', 'lavfi', '-i', f'anoisesrc=color=pink:duration=6:sample_rate=22050',
        '-f', 'lavfi', '-i', f'sine=frequency={freq}:duration=6:sample_rate=22050',
        '-filter_complex',
        f'[0:a]lowpass=f={400 + freq},volume=0.35[n];[1:a]volume=0.05[s];[n][s]amix=inputs=2:duration=longest',
        '-b:a', '64k', str(dest), '-loglevel', 'error',
    ])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ready = []
    missing = []
    for spec in STAGES:
        sid = spec[0]
        src = SRC / f'{sid}.jpg'
        if not src.exists():
            src = SRC / f'{sid}.png'
        if not src.exists():
            missing.append(sid)
            continue
        far, mid, near = split(Image.open(src))
        far.save(OUT / f'{sid}-far.png')
        mid.save(OUT / f'{sid}-mid.png')
        near.save(OUT / f'{sid}-near.png')
        ambient(sid, spec[5])
        ready.append(spec)
    lines = ['/* Palcos V21. Cada um tem parallax, clima, luz, som e o drama do motor. */', 'STAGE_LIST.push(']
    body = []
    flags = {
        'workshop': 'sparks: true',
        'lake': 'fireflies: true',
        'park': 'fireflies: true',
        'racks': 'neon: true',
        'studio': 'neon: true',
        'night': 'neon: true',
    }
    for sid, name, group, weather, tint, freq, kind in ready:
        extra = flags.get(kind)
        extra_s = f', {extra}' if extra else ''
        body.append(
            '  {\n'
            f"    id: '{sid}', name: '{name}', group: '{group}', pixel: true,\n"
            f"    image: 'assets/maps/v21/{sid}-mid.png',\n"
            f"    weather: {weather!r}, tint: '{tint}', ambient: 'amb_{sid}',\n"
            '    layers: [\n'
            f"      {{ src: 'assets/maps/v21/{sid}-far.png', speed: 0.16 }},\n"
            f"      {{ src: 'assets/maps/v21/{sid}-mid.png', speed: 0.42 }},\n"
            f"      {{ src: 'assets/maps/v21/{sid}-near.png', speed: 0.78 }}\n"
            '    ],\n'
            '    props: [\n'
            '      { cell: 0, x: 48, y: 250, flash: true },\n'
            '      { cell: 4, x: 910, y: 150, flash: true },\n'
            '      { cell: 2, x: 96, y: 360 },\n'
            '      { cell: 2, x: 860, y: 360 },\n'
            '      { cell: 5, x: 70, y: 300, fall: true }\n'
            f'    ]{extra_s}\n'
            '  }'
        )
    lines.append(',\n'.join(body))
    lines.append(');\n')
    (ROOT / 'js/data/stages-v21.js').write_text('\n'.join(lines), encoding='utf-8')
    names = ' '.join(f"'amb_{s[0]}'" for s in ready)
    print('ready', len(ready), 'missing', missing)
    print('SFX', names)


if __name__ == '__main__':
    main()
