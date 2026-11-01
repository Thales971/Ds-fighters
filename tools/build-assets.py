"""Empacota a arte gerada nos formatos que o jogo consome.

Entradas brutas (fora do repo): /home/ubuntu/work/gen/*.png
Saídas (no repo):
  assets/abilities/<lutador>.png   4 col x 5 lin, quadros 128x128 (linhas = 5 habilidades)
  assets/pets/pets.png             4 col x 8 lin, quadros 96x96  (8 mascotes)
  assets/pickups/pickups.png       4 col x 4 lin, quadros 64x64
  assets/fauna/fauna.png           4 col x 4 lin, quadros 48x48
  assets/maps/<id>.jpg             960x540 (mapas estáticos novos + pacote retrô)
  assets/fx2/<sheet>.png           cópias nativas do pacote retrô (64px)
Uso: python3 tools/build-assets.py
"""
import json
import os
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GEN = Path(os.environ.get('GEN_DIR', '/home/ubuntu/work/gen'))
FIGHTERS = ['du', 'iales', 'felipinho', 'stack', 'gitmaster', 'bughunter', 'frontend', 'backend', 'devops', 'qa', 'scrum', 'fullstack']


def quant_alpha(im):
    a = im.getchannel('A').point(lambda v: 0 if v < 40 else (150 if v < 150 else 255))
    im.putalpha(a)
    return im


def slice_grid(src, cols, rows, frame, pad=0.04):
    im = Image.open(src).convert('RGBA')
    W, H = im.size
    cw, ch = W / cols, H / rows
    out = Image.new('RGBA', (cols * frame, rows * frame), (0, 0, 0, 0))
    for r in range(rows):
        # escala comum por linha para manter proporção entre quadros da animação
        cells = []
        for c in range(cols):
            box = (round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))
            cell = im.crop(box)
            cells.append(cell)
        bbs = [cell.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox() for cell in cells]
        maxw = max([(b[2] - b[0]) for b in bbs if b] or [1])
        maxh = max([(b[3] - b[1]) for b in bbs if b] or [1])
        scale = min((frame * (1 - pad * 2)) / maxw, (frame * (1 - pad * 2)) / maxh, frame / cw)
        for c, cell in enumerate(cells):
            b = bbs[c]
            if not b:
                continue
            content = cell.crop(b)
            nw, nh = max(1, round(content.width * scale)), max(1, round(content.height * scale))
            content = content.resize((nw, nh), Image.BOX)
            content = quant_alpha(content)
            # mantém a posição relativa ao centro da célula (preserva deslocamentos de animação)
            cx = (b[0] + b[2]) / 2 - cell.width / 2
            cy = (b[1] + b[3]) / 2 - cell.height / 2
            ox = round(frame / 2 + cx * scale - nw / 2)
            oy = round(frame / 2 + cy * scale - nh / 2)
            ox = max(0, min(frame - nw, ox))
            oy = max(0, min(frame - nh, oy))
            out.alpha_composite(content, (c * frame + ox, r * frame + oy))
    return out


def save_png(im, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, optimize=True)


def stage(src, dst):
    im = Image.open(src).convert('RGB')
    im = im.resize((960, 540), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, quality=86, optimize=True, progressive=True)


def main():
    report = {}
    for f in FIGHTERS:
        src = GEN / f'abil-{f}.png'
        if src.exists():
            save_png(slice_grid(src, 4, 5, 128), ROOT / f'assets/abilities/{f}.png')
            report[f'abilities/{f}'] = 'ok'
        else:
            report[f'abilities/{f}'] = 'faltando'
    pets = []
    for name in ['mascots-a', 'mascots-b']:
        src = GEN / f'{name}.png'
        if src.exists():
            pets.append(slice_grid(src, 4, 4, 96, pad=0.06))
    if pets:
        sheet = Image.new('RGBA', (384, 96 * 4 * len(pets)), (0, 0, 0, 0))
        for i, p in enumerate(pets):
            sheet.alpha_composite(p, (0, i * 384))
        save_png(sheet, ROOT / 'assets/pets/pets.png')
        report['pets'] = len(pets) * 4
    for name, frame in [('pickups', 64), ('fauna', 48)]:
        src = GEN / f'{name}.png'
        if src.exists():
            save_png(slice_grid(src, 4, 4, frame, pad=0.06), ROOT / f'assets/{name}/{name}.png')
            report[name] = 'ok'
    for sid in ['spring', 'hive', 'docker', 'kernel', 'rust', 'python']:
        src = GEN / f'stage-{sid}.png'
        if src.exists():
            stage(src, ROOT / f'assets/maps/{sid}.jpg')
            report[f'map/{sid}'] = 'ok'
    pack = ROOT / 'assets/art-pack'
    for p in sorted((pack / 'maps').glob('*.png')):
        stage(p, ROOT / f'assets/maps/{p.stem}.jpg')
        report[f'map/{p.stem}'] = 'ok'
    for p in sorted((pack / 'retro-native/spritesheets').glob('*.png')):
        dst = ROOT / f'assets/fx2/{p.name}'
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(p, dst)
    print(json.dumps(report, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()
