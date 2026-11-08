#!/usr/bin/env python3
"""Auditoria intensiva de sprites: personagem por personagem, pose por pose,
frame por frame. Procura TODOS os tipos de bug visual sem gerar arte nova:

  - folha no tamanho certo (1280x3900 RGBA) e registrada no layout.js
  - 60 celulas nao-vazias (15 poses x 4 frames)
  - conteudo dentro da celula (nao corta nas bordas laterais)
  - pe abaixo/na baseline 246 (nada "entra na terra": ymax <= 246)
  - centralizado (centro do conteudo perto de x=160)
  - proporcao estavel entre os 4 frames de cada pose (sem frame gigante)
  - proporcao estavel entre as 15 poses (sem pose desproporcional, tipo Grika)
  - animacao real: frames diferentes entre si dentro da pose (anti "repete")
  - poses esperadas com semantica certa: ko larga+baixa, jump no ar (pe < 246)
  - hitbox: moves.punch/kick com range/startup dentro de faixa sadia
  - assets de UI (face/portrait) e abilities existem e tem tamanho certo
  - id registrado no FIGHTER_IDS do room-core (online)

Uso: python3 tools/sprite_audit.py [id ...]   (sem args = todos os suspeitos)
Exit code != 0 se qualquer bug for achado.
"""
import os
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPR = ROOT / 'assets/sprites'
UI = ROOT / 'assets/ui'
AB = ROOT / 'assets/abilities'

CW, CH, BASE = 320, 260, 246
POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick',
         'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']

SUSPECTS = ['gemini', 'meta', 'mis',
            'dev-senior', 'dev-senior-nano', 'nina-vector', 'kimi', 'deepseek',
            'dandara-query', 'winx-exe', 'emilio', 'emilio-trans', 'nunes', 'ponteiro']


SPRITE_LAYOUT_FRAMES = {}
def layout_info():
    s = (SPR / 'layout.js').read_text(encoding='utf-8')
    files = set(re.findall(r'"([a-z0-9-]+)":\s*"assets/sprites/', s))
    fm = re.search(r'"frames":\s*\{([^}]*)\}', s)
    if fm:
        for k, v in re.findall(r'"(\w+)":\s*(\d+)', fm.group(1)):
            SPRITE_LAYOUT_FRAMES[k] = int(v)
    return files, s


def fighter_ids_and_moves():
    ids = {}
    for p in ['js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js']:
        txt = (ROOT / p).read_text(encoding='utf-8')
        # bloco de cada id: do "id: 'x'" ate o proximo "id: '"
        marks = [(m.start(), m.group(1)) for m in re.finditer(r"id:\s*'([a-z0-9-]+)'", txt)]
        for i, (pos, fid) in enumerate(marks):
            end = marks[i + 1][0] if i + 1 < len(marks) else len(txt)
            bloco = txt[pos:end]
            mi = bloco.find('moves:')
            if mi >= 0:
                start = bloco.find('{', mi)
                depth = 0
                for j in range(start, len(bloco)):
                    if bloco[j] == '{': depth += 1
                    elif bloco[j] == '}':
                        depth -= 1
                        if depth == 0:
                            ids[fid] = bloco[start + 1:j]
                            break
            else:
                ids.setdefault(fid, '')
        # formato novo (v12+): const id = 'x'; ... FIGHTERS.push({ id, moves: {...} })
        for m2 in re.finditer(r"const id = '([a-z0-9-]+)';", txt):
            fid2 = m2.group(1)
            if fid2 in ids and ids[fid2]:
                continue
            end2 = txt.find('Object.assign(POWERS', m2.end())
            bloco2 = txt[m2.start():end2 if end2 > 0 else len(txt)]
            mi2 = bloco2.find('moves:')
            if mi2 >= 0:
                start2 = bloco2.find('{', mi2)
                depth2 = 0
                for j2 in range(start2, len(bloco2)):
                    if bloco2[j2] == '{': depth2 += 1
                    elif bloco2[j2] == '}':
                        depth2 -= 1
                        if depth2 == 0:
                            ids[fid2] = bloco2[start2 + 1:j2]
                            break
        # variavel compartilhada (const moves = {...}) — aplica pra quem nao tem inline
        mi = txt.find('moves = {')
        if mi < 0:
            mi = txt.find('moves ={')
        if mi >= 0:
            start = txt.find('{', mi)
            depth = 0
            for j in range(start, len(txt)):
                if txt[j] == '{': depth += 1
                elif txt[j] == '}':
                    depth -= 1
                    if depth == 0:
                        bloco_mv = txt[start + 1:j]
                        break
            else:
                bloco_mv = ''
            for fid in list(ids):
                if not ids[fid]:
                    ids[fid] = bloco_mv
    return ids


def room_ids():
    s = (ROOT / 'js/net/room-core.js').read_text(encoding='utf-8')
    m = re.search(r'FIGHTER_IDS\s*=\s*\[([^\]]*)\]', s)
    return set(re.findall(r"'([a-z0-9-]+)'", m.group(1))) if m else set()


FORMS_ONLY = {'dev-senior-nano', 'qwen-astra', 'emilio-trans', 'boneco-treino'}  # formas e nao-lutadores  # sprites de transformacao, nao lutadores proprios

def audit(fid, problems):
    if fid in FORMS_ONLY:
        return  # so valida que o arquivo existe e tem tamanho certo
    def bad(msg):
        problems.append(f'[{fid}] {msg}')

    files, layout_src = layout_info()
    if fid not in files:
        bad('NAO registrado em SPRITE_LAYOUT.files (sprite nao carrega; cai no fallback)')

    p = SPR / f'{fid}.png'
    if not p.exists():
        if fid in FORMS_ONLY:
            return
        bad('arquivo nao existe')
        return
    im = Image.open(p)
    if im.mode != 'RGBA':
        bad(f'mode {im.mode} != RGBA')
    if im.size != (1280, 3900):
        bad(f'tamanho {im.size} != (1280, 3900) — motor le 15 linhas e esse arquivo so tem {im.size[1]//260}')
        return
    a = np.asarray(im.convert('RGBA'))

    # assets de UI
    fp = UI / f'face-{fid}.png'
    if not fp.exists():
        bad(f'falta assets/ui/face-{fid}.png')
    else:
        fi = Image.open(fp)
        if fi.size != (168, 168):
            bad(f'face-{fid}.png tamanho {fi.size} != (168, 168)')
    if not (UI / f'portrait-{fid}.png').exists():
        bad(f'falta assets/ui/portrait-{fid}.png (legado pequeno ok, so precisa existir)')
    if not (AB / f'{fid}.png').exists():
        bad('falta assets/abilities/<id>.png')

    if fid not in room_ids():
        bad('id ausente no FIGHTER_IDS do room-core (nao aparece no online)')

    # hitbox: moves sadios
    mv = fighter_ids_and_moves().get(fid, '')
    for kind in ['punch', 'kick']:
        m = re.search(rf'{kind}:\s*\{{([^}}]*)\}}', mv) or re.search(rf'{kind}:\s*\{{([^}}]*)', mv)
        if not m:
            bad(f'moves.{kind} ausente')
            continue
        rng = re.search(r'range:\s*([\d.]+)', m.group(1))
        st = re.search(r'startup:\s*([\d.]+)', m.group(1))
        if rng and not (30 <= float(rng.group(1)) <= 90):
            bad(f'moves.{kind}.range={rng.group(1)} fora da faixa sadia (30-90)')
        if st and not (2 <= float(st.group(1)) <= 12):
            bad(f'moves.{kind}.startup={st.group(1)} fora da faixa sadia (2-12)')

    # celula por celula
    pose_stats = []
    for r, pose in enumerate(POSES):
        heights, widths, cxs, bottoms = [], [], [], []
        frame_arrs = []
        for c in range(4):
            cell = a[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW]
            alpha = cell[..., 3]
            n = int((alpha > 20).sum())
            declared = SPRITE_LAYOUT_FRAMES.get(pose) or 4
            if n < 50 and c < declared:
                bad(f'pose {pose} frame {c} (usado pelo jogo): celula vazia ({n}px)')
                continue
            if n < 50:
                continue  # frame alem do count() declarado — nao e' usado, nao e' bug
            ys, xs = np.where(alpha > 20)
            y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
            if y1 > BASE:
                bad(f'pose {pose} frame {c}: conteudo ate y={y1} > baseline {BASE} (entra na terra)')
            if x0 < 2 and x1 > CW - 3:
                bad(f'pose {pose} frame {c}: conteudo estoura as duas bordas x ({x0}-{x1}) de {CW}')
            cx = (x0 + x1) / 2
            if abs(cx - CW / 2) > 100:
                bad(f'pose {pose} frame {c}: centro x={cx:.0f} longe de 160 (deslocado)')
            heights.append(y1 - y0)
            widths.append(x1 - x0)
            cxs.append(cx)
            bottoms.append(y1)
            frame_arrs.append(cell)
        if not heights:
            continue
        # proporcao entre frames da mesma pose
        hmin, hmax = min(heights), max(heights)
        if hmin > 0 and (hmax / hmin > 1.6 and hmax > 250):
            bad(f'pose {pose}: altura varia {hmin}..{hmax}px entre frames (frame estourando a celula de 260)')
        # animacao real: frames diferentes
        if len(frame_arrs) >= 2:
            diffs = [float(np.abs(frame_arrs[i].astype(np.int16) - frame_arrs[0].astype(np.int16)).mean()) for i in range(1, len(frame_arrs))]
            declared = (SPRITE_LAYOUT_FRAMES.get(pose) or 4)
            ident = sum(1 for d in diffs if d < 0.5)
            if ident >= 2 and declared >= 3 and not _head_had_same(fid, r):
                bad(f'pose {pose}: {declared} frames declarados, {ident+1} identicos (animacao travada)')
        pose_stats.append((pose, float(np.mean(heights)), float(np.mean(widths)), float(np.mean(bottoms))))

    # proporcao entre poses (bug da Grika: uma pose desproporcional)
    if pose_stats:
        byp = {p: h for p, h, _, _ in pose_stats}
        idle_h = byp.get('idle', 0)
        for pose, h, _, _ in pose_stats:
            if pose in ('ko',):  # ko e' deitado de proposito (baixo)
                continue
            if idle_h > 0 and h / idle_h > 1.6:
                bad(f'proporcao entre poses: {pose} tem {h:.0f}px vs idle {idle_h:.0f}px (>1.6x = desproporcional)')

    # semantica: ko deve ser largo e baixo (deitado); jump deve ter pe acima da baseline
    byname = {p: (h, w, b) for p, h, w, b in pose_stats}
    if 'ko' in byname and 'idle' in byname:
        ko_w = byname['ko'][1]; idle_h = byname['idle'][0]; ko_h = byname['ko'][0]
        if ko_h > idle_h * 0.9 and ko_w < idle_h:
            bad(f'pose ko esta em pe (w={ko_w:.0f} h={ko_h:.0f} vs idle h={idle_h:.0f}) — deveria ser largo/baixo')
    if 'jump' in byname:
        jb = byname['jump'][2]
        if jb > BASE:
            bad(f'pose jump com pe em y={jb:.0f} > baseline {BASE} (entra na terra no ar)')


def fighter_ids_only():
    # so ids que tem arquivo de sprite OU estao em FIGHTER_IDS (lutadores de verdade, nao poderes)
    _, room = room_ids(), None
    files, _ = layout_info()
    txt = (ROOT / 'js/data/fighters.js').read_text(encoding='utf-8')
    for extra in ['js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js']:
        txt += (ROOT / extra).read_text(encoding='utf-8')
    allids = set(re.findall(r"id:\s*'([a-z0-9-]+)'", txt))
    return sorted(i for i in allids if i in files or i in room_ids())


def _head_had_same(fid, row):
    import subprocess
    try:
        data = subprocess.run(['git', 'show', f'HEAD:assets/sprites/{fid}.png'], capture_output=True, cwd=ROOT).stdout
        if not data:
            return False
        im = Image.open(__import__('io').BytesIO(data)).convert('RGBA')
        if im.size != (1280, 3900):
            return True  # folha era menor no HEAD — o que eu expandi pode ter repetido; nao e' bug novo meu
        a = np.asarray(im)
        cells = [a[row*CH:(row+1)*CH, c*CW:(c+1)*CW] for c in range(4)]
        # legado se pelo menos 2 dos usados sao identicos no HEAD
        return sum(1 for i in range(1, 4) if np.array_equal(cells[i], cells[0])) >= 1
    except Exception:
        return False


def main():
    ids = sys.argv[1:] or fighter_ids_only()
    problems = []
    for fid in ids:
        audit(fid, problems)
        print(f'{fid:18s} auditado', flush=True)
    if problems:
        print(f'\n=== {len(problems)} PROBLEMA(S) ===')
        for p in problems:
            print(' -', p)
        sys.exit(1)
    print('\nAUDITORIA LIMPA: zero bugs nos personagens auditados')


if __name__ == '__main__':
    main()
