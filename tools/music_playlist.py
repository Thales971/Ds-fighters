#!/usr/bin/env python3
"""Mantem assets/music/playlist.json em dia com as musicas da pasta.

1. Acha toda musica (mp3) em assets/music/rock que NAO esta na playlist
   (compara por conteudo: a mesma musica copiada em varias pastas conta 1x)
   e inclui em "tracks". Se alguma copia estiver dentro de rock/AMV/, tambem
   entra na lista "boss" (toca na luta final contra o chefe).
2. Mede o volume real (EBU R128, LUFS integrado) de cada faixa da playlist e
   grava "gain" (0..1): faixas muito altas (masterizacao moderna, -6 a -8 LUFS)
   sao abaixadas ate o alvo (-12 LUFS; as antigas, a -17, ficam em 1.0). Nao reescreve
   nenhum arquivo de audio (nunca apaga nem recodifica musica do dono).

Uso: python3 tools/music_playlist.py [--so-ganho]
Precisa de ffmpeg no PATH.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PL = ROOT / 'assets/music/playlist.json'
ROCK = 'assets/music/rock'
TARGET = -12.0  # -17 deixava as faixas novas (masterizadas a -6) baixas demais; as antigas (-17) ficam em 1.0

ALBUMS = {'Life Starts Now': 'Three Days Grace', 'One-X': 'Three Days Grace'}
KNOWN = {  # musica solta -> banda (so quando o nome do arquivo nao traz a banda)
    'Comatose': 'Skillet', 'Falling Inside the Black': 'Skillet', 'It Has Begun': 'Starset', 'Rise And Fall': 'Starset',
}


def md5(p):
    h = hashlib.md5()
    with open(ROOT / p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def title_for(paths):
    base = min(paths, key=len)
    name = Path(base).stem
    name = name.replace('\uff02', '"')
    name = re.sub(r'\s*[\(\[][^\)\]]*(official|video|audio|lyric|hq|music)[^\)\]]*[\)\]]', '', name, flags=re.I).strip()
    if ' - ' in name:
        band, song = name.split(' - ', 1)
        band = band.title() if band.isupper() else band
        return f'{band} — {song.strip()}'
    band = None
    for p in paths:
        parent = Path(p).parent.name
        if parent in ALBUMS:
            band = ALBUMS[parent]
    band = band or KNOWN.get(name)
    return f'{band} — {name}' if band else name


def lufs(path):
    try:
        out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(ROOT / path), '-af', 'ebur128', '-f', 'null', '-'],
                             capture_output=True, text=True, timeout=300).stderr
        m = re.findall(r'I:\s+(-?[\d.]+) LUFS', out)
        return float(m[-1]) if m else None
    except Exception:
        return None


def main():
    pl = json.loads(PL.read_text(encoding='utf-8'))
    lists = ('tracks', 'fallback', 'boss')
    if '--so-ganho' not in sys.argv:
        files = [str(Path(r, f).relative_to(ROOT)).replace(os.sep, '/') for r, _, fs in os.walk(ROOT / ROCK) for f in fs if f.lower().endswith('.mp3')]
        groups = {}
        for f in files:
            groups.setdefault(md5(f), []).append(f)
        listed = {t['file'] for k in lists for t in pl.get(k, [])}
        boss_listed = {t['file'] for t in pl.get('boss', [])}
        added_t = added_b = 0
        for paths in groups.values():
            canon = min((p for p in paths if '/AMV/' not in p), key=len, default=min(paths, key=len))
            entry = {'title': title_for(paths), 'file': canon}
            if not any(p in listed for p in paths):
                pl['tracks'].append(dict(entry))
                added_t += 1
            if any('/AMV/' in p for p in paths) and not any(p in boss_listed for p in paths):
                pl['boss'].append(dict(entry))
                added_b += 1
        print('novas em tracks:', added_t, '| novas no chefe:', added_b)
    todo = sorted({t['file'] for k in lists for t in pl.get(k, [])} | {pl['menu']['file']})
    with ThreadPoolExecutor(max_workers=8) as ex:
        res = dict(zip(todo, ex.map(lufs, todo)))
    for k in lists:
        for t in pl.get(k, []):
            v = res.get(t['file'])
            if v is None:
                continue
            t['lufs'] = round(v, 1)
            t['gain'] = round(min(1.0, 10 ** ((TARGET - v) / 20)), 3)
    m = pl['menu']
    v = res.get(m['file'])
    if v is not None:
        m['lufs'] = round(v, 1)
        m['gain'] = round(min(1.0, 10 ** ((TARGET - v) / 20)), 3)
    pl['_como_usar'] = ('Faixas do proprietario. Sorteio por luta, sem repeticao consecutiva; ducking durante o narrador. '
                        'A lista "boss" (pasta rock/AMV) toca na luta final contra o chefe no torneio. '
                        'Cada faixa tem "gain" (volume medido em LUFS, alvo -12): rode python3 tools/music_playlist.py '
                        'depois de colocar musica nova em assets/music/rock.')
    PL.write_text(json.dumps(pl, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    loud = sorted(((t.get('lufs') or 0), t['title']) for t in pl['tracks'])[-5:]
    print('faixas:', len(pl['tracks']), 'chefe:', len(pl['boss']), '| mais altas:', loud)


if __name__ == '__main__':
    main()
