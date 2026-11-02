#!/usr/bin/env python3
"""Browser smoke for the V8 fighters, unique attack atlases, and new arena."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/visual'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('DS_WEB_BASE','http://localhost:8099/')
IDS=['winx-exe','nina-vector']
STAGE='pos-codigocalipse'
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium')
    page=browser.new_page(viewport={'width':1280,'height':720})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='load')
    page.wait_for_function("window.DSGame && typeof UI !== 'undefined' && Object.keys(SpriteGen.images).length===Object.keys(SPRITE_LAYOUT.files).length",timeout=30000)
    page.wait_for_function("['winx-exe','nina-vector'].every(id=>Art.ready('abil:'+id)&&Art.ready('fx2:'+id))",timeout=30000)
    result=page.evaluate("""ids=>{
      const fighterData=ids.map(id=>{const f=FIGHTERS.find(x=>x.id===id);return{id,exists:!!f,secret:!!(f&&f.secret),idleFrames:SpriteGen.count('idle',id)}});
      const stage=STAGE_LIST.find(s=>s.id==='pos-codigocalipse');
      const g=DSGame;
      UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
      g.start({teams:[['winx-exe'],['nina-vector']],stage:'pos-codigocalipse',cpu:[false,false],weather:'clear'});
      g.running=false; g.roundState='fight'; g.activeOf(0).x=320; g.activeOf(1).x=660;
      g.activeOf(1).addStatus('glitch',120,g.activeOf(0));
      const winx=POWERS['winx-exe'].powers[0], nina=POWERS['nina-vector'].powers[0];
      const before=g.bursts.length;
      g.spawnAbilityImpact(g.activeOf(0),winx,400,-160);
      g.spawnAbilityImpact(g.activeOf(1),nina,580,-160);
      const attackBursts=g.bursts.slice(before).map(b=>({key:b.key,row:b.row}));
      HUD.reset(g); document.getElementById('banner').classList.remove('on');
      document.getElementById('cutin').classList.remove('on');
      document.getElementById('toast').classList.remove('on');
      document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on'));
      return {fighterData,stageExists:!!stage,stageFrames:stage&&stage.frames,stageSheet:stage&&stage.sheet,
        totalFighters:FIGHTERS.length,totalStages:STAGE_LIST.length,attackBursts,
        abilitiesReady:ids.every(id=>Art.ready('abil:'+id)&&Art.ready('fx2:'+id)),
        glitch:g.activeOf(1).has('glitch')};
    }""",IDS)
    page.wait_for_function('DSGame.stage && DSGame.stage.ready',timeout=15000)
    page.evaluate('DSGame.render(1)')
    result['stageWidth']=page.evaluate('DSGame.stage.img.naturalWidth')
    result['stageHeight']=page.evaluate('DSGame.stage.img.naturalHeight')
    page.screenshot(path=str(OUT/'v8-match-pos-codigocalipse.png'))
    print(json.dumps({'result':result,'errors':errors},ensure_ascii=False,indent=2),flush=True)
    assert result['fighterData']==[
        {'id':'winx-exe','exists':True,'secret':True,'idleFrames':4},
        {'id':'nina-vector','exists':True,'secret':False,'idleFrames':4},
    ],'dados ou sprites de Winx/Nina inválidos'
    assert result['totalFighters']==33 and result['totalStages']==46,'contagem atual do roster/arenas não carregou'
    assert result['stageExists'] and result['stageFrames']==24 and result['stageWidth']==3840 and result['stageHeight']==1440,'mapa Pós-Codigocalipse não está animado'
    assert result['attackBursts']==[{'key':'fx2:winx-exe','row':0},{'key':'fx2:nina-vector','row':0}],'ataques ainda compartilham o FX genérico'
    assert result['abilitiesReady'] and result['glitch'],'atlas ou status não foi aplicado'
    assert not errors,errors
    browser.close()
print('V8 Canvas: Winx + Nina, efeitos próprios e Pós-Codigocalipse — PASS')
