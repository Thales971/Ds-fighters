#!/usr/bin/env python3
"""Confere assets refinados e renderiza cenários reais em Chromium.
Uso: python3 tools/visual_refinement_check.py [--url http://localhost:8099]
"""
import argparse
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results/visual'
REFINED = ['urbano', 'stack', 'qwen']


def validate_assets():
    for cid in REFINED:
        im = Image.open(ROOT / f'assets/sprites/{cid}.png')
        assert im.mode == 'RGBA' and im.size == (1280, 3900), (cid, im.mode, im.size)
        for row in range(15):
            for col in range(4):
                cell = im.crop((col * 320, row * 260, (col + 1) * 320, (row + 1) * 260))
                box = cell.getbbox()
                assert box and box[3] <= 246, (cid, row, col, box)
                assert box[0] >= 0 and box[2] <= 320
                alpha = np.asarray(cell)[..., 3]
                assert not alpha[246:].any(), (cid, row, col, 'piso invadido')
        print(f'PASS {cid}: 60 quadros RGBA válidos, sem invasão da linha dos pés', flush=True)
    fx = Image.open(ROOT / 'assets/abilities/xeon.png')
    assert fx.mode == 'RGBA' and fx.size == (512, 640)
    print('PASS Xeon: folha de efeitos 4x5 com alpha', flush=True)
    for sid in ['kotlin', 'kali', 'java', 'chrome', 'sesi', 'sesi-patio']:
        sheet = Image.open(ROOT / f'assets/maps/anim/{sid}.png')
        assert sheet.size == (3840, 1440), (sid, sheet.size)
    print('PASS mapas novos: 6 folhas 6x4, 640x360 por quadro', flush=True)


def browser_check(url):
    OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        executable = shutil.which('chromium') or shutil.which('google-chrome')
        options = {'args': ['--no-sandbox']}
        if executable:
            options['executable_path'] = executable
        browser = p.chromium.launch(**options)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url, wait_until='load')
        page.wait_for_function("window.DSGame && typeof FIGHTERS !== 'undefined' && Object.keys(SpriteGen.images).length >= Object.keys(SPRITE_LAYOUT.files).length", timeout=60000)
        assert page.evaluate("['urbano','stack','qwen'].every(id => SpriteGen.count('special', id) === 4)")
        assert page.evaluate("FIGHTERS.every(f => !!SpriteGen.images[f.id])")
        page.evaluate("UI.show('rules')")
        page.select_option('#rules-rounds', '9')
        page.select_option('#rules-opponent', 'human')
        page.check('#rules-life')
        page.check('#rules-meter')
        page.click('#rules-start')
        assert page.evaluate("UI.screen==='select' && UI.flow.customRules.roundsToWin===9 && UI.flow.p2Human")
        page.evaluate("UI.flow.picks=[[3],[4]]; UI.flow.stage='sesi-patio'")
        cfg = page.evaluate('UI.matchConfig()')
        assert cfg['infiniteLife'] and cfg['infiniteMeter'] and cfg['roundsToWin'] == 9
        page.evaluate("""() => {
          const g=DSGame; UI.show('fight'); g.start(UI.matchConfig());
          for(let k=0;k<700&&g.roundState!=='fight';k++)g.tick();
          const [a,b]=g.activePair(); b.takeHit(99999,{attacker:a,height:'unblockable',noScale:true});
          g.step(); window.__customHealth=b.hp===b.maxHp&&b.alive&&a.ultimate===100;
          g.timeUp(); window.__customScore=g.teamWins[0]===1;
          g.round=5; g.endRound(); window.__longRound=g.running&&g.round===6;
          g.addCrack(400,-100); g.resetWorld(); window.__cleanCracks=g.cracks.length===0;
        }""")
        assert page.evaluate('__customHealth && __customScore && __longRound && __cleanCracks')
        print('PASS personalizado: UI/regras, vida/energia infinitas, vencedor por dano, sexto round e limpeza de rachaduras', flush=True)
        for a, b, sid, ability in [('urbano', 'stack', 'sesi-patio', 0), ('stack', 'qwen', 'chrome', 0), ('xeon', 'qwen', 'sesi', 0), ('qwen', 'urbano', 'kotlin', 4)]:
            info = page.evaluate("""([a,b,sid,ability]) => {
              const g = DSGame; UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
              g.start({mode:'versus',teams:[[a],[b]],stage:sid,cpu:[false,false],roundsToWin:3,timer:99,weather:'clear'});
              for(let k=0;k<700&&g.roundState!=='fight';k++)g.tick();
              const [f,o]=g.activePair(); f.x=380; o.x=510; f.dir=1; o.dir=-1;
              f.charge=[100,100]; f.ultimate=100; f.cd=Array(10).fill(0);
              const cast=f.tryCast(ability); for(let k=0;k<10;k++)g.tick(); g.render(1);
              return {cast,a,b,sid,hp:[f.hp,o.hp]};
            }""", [a, b, sid, ability])
            page.wait_for_function('DSGame.stage.ready', timeout=15000)
            page.evaluate('DSGame.render(1)')
            page.screenshot(path=str(OUT / f'{a}-{sid}.png'))
            print('PASS arena ' + json.dumps(info), flush=True)
            assert info['cast'], info
        reduced = page.evaluate("""() => { const s=DSGame.stage; s.reducedFlag=true; s.t=999; const a=s.frameRect(); s.t=1300; const b=s.frameRect(); return JSON.stringify(a)===JSON.stringify(b); }""")
        assert reduced, 'Fundo deveria congelar em redução de movimento'
        page.evaluate("""() => {
          const g=DSGame; g.start({mode:'versus',teams:[['urbano'],['stack']],stage:'sesi-patio',cpu:[false,false],roundsToWin:3,timer:99,weather:'clear'});
          for(let k=0;k<700&&g.roundState!=='fight';k++)g.tick();
          g.running=false; g.activeOf(0).x=300; g.activeOf(1).x=660;
          document.getElementById('banner').classList.remove('on');
          document.getElementById('cutin').classList.remove('on');
          document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on')); g.render(1);
        }""")
        page.wait_for_function('DSGame.stage.ready', timeout=15000)
        page.evaluate('DSGame.render(1)')
        page.screenshot(path=str(OUT / 'preview-sesi.png'))
        # Exercita o fallback de folha ausente usando imagem base existente.
        page.evaluate("window.__fallback = new StageRenderer({sheet:'assets/maps/ausente-teste.png',image:'assets/maps/sesi-patio.jpg'},960,540,450)")
        page.wait_for_function('__fallback.ready && !__fallback.usingSheet', timeout=15000)
        assert page.evaluate('__fallback.frameRect()[2]===960')
        print('PASS redução de movimento e fallback de cenário', flush=True)
        browser.close()
    assert not errors, errors
    print('PASS Chromium: nenhum erro JavaScript', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://localhost:8099')
    args = parser.parse_args()
    validate_assets()
    browser_check(args.url)
