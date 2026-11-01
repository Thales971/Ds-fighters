#!/usr/bin/env python3
"""Regression for late arena/pickup events missed by short combat tests."""
import argparse,json,shutil
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',default='http://localhost:8099');p.add_argument('--probe',action='store_true');a=p.parse_args()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'));pg=b.new_page();pg.goto(a.url);pg.wait_for_function("window.DSGame && !document.getElementById('loader')")
 result=pg.evaluate("""()=>{const g=DSGame,out=[];const run=(name,fn)=>{try{out.push({name,ok:true,value:fn()})}catch(e){out.push({name,ok:false,error:e.stack})}finally{g.running=false}};
 const start=(stage)=>{g.start({teams:[['lobao'],['iales']],cpu:[false,false],mode:'training',stage,weather:'clear',infiniteLife:true});g.rnd=()=>0.1;g.roundState='fight'};
 run('powerup-criação-coleta',()=>{start('01-centro-de-dados');g.spawnPickup();const p=g.pickups[0],f=g.activeOf(0);p.y=-54;f.x=p.x;p.update(g);if(!p.dead||!g.events.some(e=>e.t==='pickup'))throw Error('powerup não foi coletado');return p.def.id});
 for(const s of STAGE_LIST)run(s.id,()=>{start(s.id);g.mech.pickT=1;for(let i=0;i<1000;i++)g.mech.tick(true);g.render(1);return {mechanic:s.mech,pickups:g.pickups.length}});
 return out}""");b.close()
print(json.dumps(result,ensure_ascii=False,indent=2))
if not a.probe:assert all(r['ok'] for r in result),'evento tardio de mapa falhou'
