#!/usr/bin/env python3
"""Real RAF/VS/CPU tests; denied iframe gamepad, touch viewport and one-frame recovery."""
import argparse,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',default='http://localhost:8099/');p.add_argument('--probe',action='store_true');p.add_argument('--seconds',type=int,default=10)
p.add_argument('--scenarios',nargs='+',default=['janela-normal','iframe-sem-gamepad','mobile','falha-isolada'],choices=['janela-normal','iframe-sem-gamepad','mobile','falha-isolada'])
a=p.parse_args();results=[]
host=Path(__file__).resolve().parents[1]/'test-results/loop-host.html';host.parent.mkdir(exist_ok=True);host.write_text('<!doctype html><html><body></body></html>\n')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'))
 for scenario in a.scenarios:
  mobile=scenario=='mobile';embedded=scenario=='iframe-sem-gamepad'
  ctx=b.new_context(viewport={'width':390,'height':844} if mobile else {'width':1280,'height':720},is_mobile=mobile,has_touch=mobile)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)+'\n'+(e.stack or '')));item={'scenario':scenario}
  try:
   if embedded:
    page.goto('http://localhost:8099/test-results/loop-host.html')
    page.set_content('<iframe title="jogo" allow="gamepad \'none\'" src="'+a.url+'" style="width:1240px;height:700px;border:0"></iframe>')
    scope=page.frame_locator('iframe');target=next(f for f in page.frames if f.parent_frame)
   else:page.goto(a.url);target=page;scope=page
   target.wait_for_function("window.DSGame && !document.getElementById('loader')",timeout=45000)
   scope.locator('#btn-start').click()
   item['gamepad']=target.evaluate("()=>{try{navigator.getGamepads();return 'permitido'}catch(e){return e.name}}")
   target.evaluate("()=>UI.launch({mode:'versus',teams:[['lobao'],['iales']],stage:'01-centro-de-dados',cpu:[false,true],difficulty:3,timer:180,pets:[PETS[9],PETS[0]],roundsToWin:2})")
   target.wait_for_function("DSGame.running && UI.screen==='fight'",timeout=10000)
   if scenario=='falha-isolada':target.evaluate("()=>{const old=DSGame.tick;DSGame.tick=function(){this.tick=old;throw Error('loop-recovery-probe')}}")
   t1=target.evaluate('DSGame.time');page.wait_for_timeout(a.seconds*1000)
   state=target.evaluate("()=>({time:DSGame.time,roundState:DSGame.roundState,running:DSGame.running,matchOver:DSGame.matchOver,hp:DSGame.fighters().map(f=>f.hp),paused:DSGame.paused,noReplay:typeof UI.playReplay==='undefined' && !('rec' in DSGame) && !document.querySelector('[data-go=replays]')})")
   if state['running']:
    target.evaluate('UI.pause()');before=target.evaluate('DSGame.time');page.wait_for_timeout(200);assert target.evaluate('DSGame.time')==before
    scope.locator('#btn-resume').click();page.wait_for_timeout(300);assert target.evaluate('DSGame.time')>before;item['pauseResume']=True
   unexpected=[e for e in errors if 'loop-recovery-probe' not in e]
   item.update(state);item['advance']=state['time']-t1;item['errors']=unexpected
   if scenario=='falha-isolada':item['expectedProbeErrors']=len(errors)-len(unexpected);assert item['expectedProbeErrors']==1
   item['ok']=(item['advance']>=a.seconds*20 or state['matchOver']) and not unexpected and state['noReplay']
  except Exception as e:item.update(ok=False,error=str(e),errors=errors)
  results.append(item);ctx.close()
 b.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if not a.probe:assert all(r['ok'] for r in results),'loop real travado'
