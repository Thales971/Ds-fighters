#!/usr/bin/env python3
"""Regressão SENAI/SESI e ranking Qwen. Raiz servida em localhost:8099."""
import hashlib
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results/visual'
SESI_HASHES = {
    'assets/maps/sesi.jpg': '00742ddce5cff371ddefb4756ccf0c2052f428b3ad615f8529a0468afb0bfcac',
    'assets/maps/sesi-patio.jpg': 'ad866ac203cc66c4d68a44923ab8433319f0e588537c05cfe49ee260a1f428c9',
    'assets/maps/anim/sesi.png': '72f8be16d631ae5154c3e73651efbc8ae113c570b34b469e0bb02d473547099e',
    'assets/maps/anim/sesi-patio.png': '7081f0a01767e090fe97f536cb5fba75b109716fc3d22f85e8a8bcd7c87b3949',
}
for file, expected in SESI_HASHES.items():
    assert hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == expected, file
assert Image.open(ROOT / 'assets/maps/senai-valinhos.jpg').size == (960, 540)
assert Image.open(ROOT / 'assets/maps/anim/senai-valinhos.png').size == (3840, 1440)
print('PASS arte: SENAI base/24 quadros; quatro artes SESI preservadas byte a byte', flush=True)

errors = []
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://localhost:8099', wait_until='load')
    page.wait_for_function("window.DSGame && Object.keys(SpriteGen.images).length >= Object.keys(SPRITE_LAYOUT.files).length", timeout=60000)
    assert page.evaluate("['sesi','sesi-patio','senai-valinhos'].every(id=>STAGE_LIST.some(s=>s.id===id))")
    order = page.evaluate('FIGHTERS.slice().sort((a,b)=>b.stats.power-a.stats.power).slice(0,5).map(f=>({id:f.id,power:f.stats.power}))')
    assert order[2]['id'] == 'qwen', order
    assert order[1]['power'] > order[2]['power'] > order[3]['power'], order
    assert page.evaluate("Profile.SECRET_IDS.includes('qwen') && POWERS.qwen.powers.length===5 && POWERS.qwen.powers[4].transform==='astra'")
    print('PASS ranking permanente:', order, flush=True)
    page.evaluate("UI.startFlow('versus'); UI.flow.picks=[[FIGHTERS.findIndex(f=>f.id==='qwen')],[3]]; UI.show('stage')")
    page.wait_for_timeout(200)
    page.locator('.st-cell[data-id="senai-valinhos"]').click()
    assert page.evaluate("UI.flow.stage==='senai-valinhos'")
    print('PASS SENAI selecionável; ambos mapas SESI permanecem no catálogo', flush=True)
    page.evaluate("""() => {
      const g=DSGame; UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
      g.start({mode:'versus',teams:[['qwen'],['stack']],stage:'senai-valinhos',cpu:[false,false],roundsToWin:3,timer:99,weather:'clear'});
      for(let k=0;k<700 && g.roundState!=='fight';k++)g.tick();
      window.__senaiPulse=g.mech;
      g.running=false; g.activeOf(0).x=300;g.activeOf(1).x=660;
      document.getElementById('banner').classList.remove('on');
      document.getElementById('cutin').classList.remove('on');
      document.getElementById('toast').classList.remove('on');
      document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on'));
    }""")
    page.wait_for_function('DSGame.stage.ready', timeout=15000)
    assert page.evaluate("DSGame.stageDef.id==='senai-valinhos' && DSGame.stageDef.frames===24 && DSGame.stageDef.mech==='pulse'")
    page.evaluate('DSGame.render(1)')
    page.screenshot(path=str(OUT / 'senai-qwen.png'))
    page.evaluate("""() => { const g=DSGame; for(let i=0;i<480;i++)g.mech.tick(true); }""")
    assert page.evaluate('DSGame.strikes.length>=6'), 'mecânica elétrica não disparou'
    print('PASS render SENAI e pulso elétrico com aviso', flush=True)
    browser.close()
assert not errors, errors
print('senai_check: PASS, nenhum erro JavaScript', flush=True)
