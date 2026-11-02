#!/usr/bin/env python3
"""Browser smoke for a real Canvas round with V7 fighters and stages."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/visual'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('DS_WEB_BASE','http://localhost:8099/')
FIGHTERS=['winx-exe','kimi','deepseek','dandara-query']
STAGES=['area-de-trabalho','abismo-das-baleias','vale-do-cache']
LEGACY_STAGES=['dojo-noite','circo','pizzaria']
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium')
    page=browser.new_page(viewport={'width':1280,'height':720})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='load')
    page.wait_for_function("window.DSGame && typeof UI !== 'undefined' && Object.keys(SpriteGen.images).length===Object.keys(SPRITE_LAYOUT.files).length",timeout=30000)
    page.wait_for_function("['winx-exe','kimi','deepseek','dandara-query'].every(id=>Art.ready('abil:'+id))",timeout=30000)
    assert page.evaluate("ids=>ids.every(id=>FIGHTERS.some(f=>f.id===id)&&SpriteGen.images[id]&&SpriteGen.count('idle',id)===4)",FIGHTERS)
    assert page.evaluate("ids=>ids.every(id=>STAGE_LIST.some(s=>s.id===id))",STAGES)
    for sid in STAGES+LEGACY_STAGES:
        page.evaluate("""sid=>{
          const g=DSGame;
          UI.show('fight');
          document.getElementById('stage-wrap').classList.add('on');
          g.start({teams:[['winx-exe'],['kimi']],stage:sid,cpu:[false,false],weather:'clear'});
          g.running=false;
          g.roundState='fight';
          g.activeOf(0).x=310;
          g.activeOf(1).x=650;
          g.activeOf(1).addStatus('glitch',120,g.activeOf(0));
          document.getElementById('banner').classList.remove('on');
          document.getElementById('cutin').classList.remove('on');
          document.getElementById('toast').classList.remove('on');
          document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on'));
          HUD.reset(g);
        }""",sid)
        page.wait_for_function('DSGame.stage && DSGame.stage.ready',timeout=15000)
        page.evaluate('DSGame.render(1)')
        result=page.evaluate("""()=>{
          const s=DSGame.stage;
          const r=s.frameRect();
          return {stage:DSGame.cfg.stage,usingSheet:s.usingSheet,width:s.img.naturalWidth,height:s.img.naturalHeight,
            frames:s.def.frames,rect:r,glitch:DSGame.activeOf(1).has('glitch')};
        }""")
        assert result['stage']==sid and result['usingSheet'],f'folha animada não ativa: {result}'
        assert result['frames']==24 and result['width']>0 and result['height']>0,f'manifest de mapa inválido: {result}'
        assert result['glitch'],f'status não aplicado: {sid}'
        page.screenshot(path=str(OUT/f'v7-match-{sid}.png'))
        print(f"PASS {sid}: sheet {result['width']}×{result['height']}, {result['frames']} frames, status glitch ativo",flush=True)
    assert not errors,errors
    browser.close()
print(f'V7 browser smoke: {len(FIGHTERS)} personagens, {len(STAGES)} mapas novos e {len(LEGACY_STAGES)} clássicos preservados — PASS')
