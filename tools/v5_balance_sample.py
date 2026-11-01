#!/usr/bin/env python3
"""Amostra CPU de matchups espelhados; evidência limitada, não ranking universal.
Uso: python3 tools/v5_balance_sample.py --root /pasta --out /tmp/resultado.json
"""
import argparse
import json
from pathlib import Path
import socket
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--timer',type=int,default=60)
args = parser.parse_args()
with socket.socket() as s:
    s.bind(('127.0.0.1',0)); port=s.getsockname()[1]
server = subprocess.Popen([sys.executable,'-m','http.server',str(port)],cwd=args.root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    time.sleep(0.3)
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/chromium');page=b.new_page()
        page.goto(f'http://localhost:{port}',wait_until='domcontentloaded')
        page.wait_for_function("window.DSGame && typeof FIGHTERS!=='undefined'")
        ids=page.evaluate('FIGHTERS.filter(f=>!f.secret).map(f=>f.id)')
        # Cada normal enfrenta quatro referências de arquétipos, dos dois lados.
        anchors=['stack','urbano','xeon','bhm']
        pairs=set()
        for a in ids:
            for other in anchors:
                if a!=other:pairs.add(tuple(sorted((a,other))))
        scores={id:{'wins':0,'draws':0,'games':0,'damage':0,'hpLeft':0,'maxCombo':0} for id in ids}
        matches=[]
        for n,(a,c) in enumerate(sorted(pairs)):
            for side in range(2):
                x,y=(a,c) if side==0 else (c,a)
                result=page.evaluate("""([a,b,seconds,seed])=>{
                  const oldRandom=Math.random; let state=seed>>>0;
                  Math.random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
                  const g=DSGame, audio=AudioSys.enabled;AudioSys.enabled=false;
                  try{
                    UI.show('fight');g.start({mode:'versus',teams:[[a],[b]],stage:'senai-valinhos',cpu:[true,true],difficulty:1,roundsToWin:1,timer:seconds,weather:'clear',pets:[PETS.find(p=>p.id==='none'),PETS.find(p=>p.id==='none')]});
                    g.roundState='fight';g.roundTimer=seconds*60;
                    g.mech.tick=()=>{};g.spawnPickup=()=>{};
                    let frames=0;
                    while(g.running&&frames<seconds*60+1200){g.tick();frames++;}
                    const f=g.activePair();
                    return {a,b,w:g.teamWins[0]===g.teamWins[1]?-1:g.teamWins[0]>g.teamWins[1]?0:1,hp:f.map(x=>Math.round(x.hp)),maxHp:f.map(x=>x.maxHp),damage:f.map(x=>Math.round(x.stats.dmg)),combo:f.map(x=>x.stats.maxCombo),frames};
                  }finally{Math.random=oldRandom;AudioSys.enabled=audio;g.stop();}
                }""",[x,y,args.timer,7919+n*31+side])
                matches.append(result)
                for k,id in enumerate((x,y)):
                    s=scores[id];s['games']+=1;s['damage']+=result['damage'][k];s['hpLeft']+=result['hp'][k]/result['maxHp'][k];s['maxCombo']=max(s['maxCombo'],result['combo'][k])
                    if result['w']==k:s['wins']+=1
                    if result['w']==-1:s['draws']+=1
            if (n+1)%8==0:print(f'{(n+1)*2} partidas simuladas',flush=True)
        for s in scores.values():
            s['rate']=round(100*s['wins']/max(1,s['games']),1)
            s['meanHpFraction']=round(s['hpLeft']/max(1,s['games']),3)
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps({'normalFighters':ids,'anchors':anchors,'timer_seconds':args.timer,'mirrored':True,'matches':len(matches),'scores':scores,'results':matches,'limitations':'CPU nível normal, quatro referências, tempo curto, cenário sem mecânica, seeds distintas por lado; não é estimativa universal de winrate.'},ensure_ascii=False,indent=2)+'\n')
        print('AMOSTRA',json.dumps({id:s['rate'] for id,s in scores.items()}),flush=True);b.close()
finally:
    server.terminate();server.wait(timeout=4)
