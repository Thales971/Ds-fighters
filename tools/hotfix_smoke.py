#!/usr/bin/env python3
"""Hotfix smoke: controles, roubos, pets, skins adiadas e todos os poderes."""
import argparse,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--probe',action='store_true')
parser.add_argument('--url',default='http://localhost:8099')
parser.add_argument('--preview',type=Path)
args=parser.parse_args()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'))
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(args.url)
    page.wait_for_function("window.DSGame && !document.getElementById('loader') && SpriteGen.images.lobao && Art.images.pets && Art.images['abil:iales']")
    page.locator('#btn-start').click()
    page.locator('[data-go="skins"]').click()
    assert 'EM BREVE' in page.locator('#scr-skins h2').inner_text()
    assert page.locator('#skin-fighter, #btn-skin-save').count()==0
    result=page.evaluate("""()=>{
      const g=DSGame,results=[];
      const run=(name,fn)=>{try{results.push({name,ok:true,value:fn()})}catch(e){results.push({name,ok:false,error:e.message})}finally{g.running=false}};
      const start=(mode='versus',pets=[PETS[1],PETS[PETS.length-1]])=>{g.start({teams:[['iales'],['lobao']],pets,stage:'japan',cpu:[false,false],mode,timer:180});UI.show('fight');g.roundState='fight'};
      const setup=(block=false)=>{start('training');g.rec=null;g.cfg.dummy=block?'block':'stand';const f=g.activeOf(0),t=g.activeOf(1);f.x=400;t.x=650;t.status={};for(let i=0;i<2;i++)g.tick();return [f,t]};
      run('skins-desativadas',()=>{Profile.data.skins.lobao=120;if(Profile.skinFor('lobao')!==0||Profile.setSkin('lobao',210)!==false||Profile.data.skins.lobao!==120)throw Error('skin aplicada ou preferência apagada');start();if(g.activeOf(1).skinHue!==0)throw Error('skin em combate');return 'EM BREVE, visual original, dados preservados'});
      run('partida-local',()=>{start();for(let i=0;i<180;i++)g.tick();g.render(1);if(g.time<180)throw Error('tempo parado');return g.time});
      run('saida-do-replay',()=>{g.replayFrames=[[]];g.replaySeed=17;start();if(g.replayFrames)throw Error('partida nova continua presa aos inputs do replay');return 'controles locais restaurados'});
      run('replay-reinicia-relogio',()=>{g.time=1234;g.replayFrames=[[]];g.replaySeed=17;g.start({teams:[['iales'],['lobao']],mode:'replay',cpu:[true,true],stage:'japan'});if(g.time!==0)throw Error('replay começa depois dos quadros gravados');return g.time});
      run('roubo-remoto-acerta',()=>{const[f,t]=setup();f.fire(POWERS.iales.powers.find(p=>p.id==='remotesteal'));for(let i=0;i<55;i++)g.tick();if(!f.stolen||f.stolen.powers.length!==5)throw Error('roubo remoto não copia cinco poderes');return f.stolen.from});
      run('roubo-remoto-bloqueio',()=>{const[f,t]=setup(true);f.fire(POWERS.iales.powers.find(p=>p.id==='remotesteal'));for(let i=0;i<55;i++)g.tick();if(f.stolen)throw Error('roubou através de bloqueio');return 'bloqueio impede cópia'});
      run('roubo-remoto-alcance',()=>{const[f,t]=setup();f.fire(POWERS.iales.powers.find(p=>p.id==='remotesteal'));t.x=900;for(let i=0;i<55;i++)g.tick();if(f.stolen)throw Error('roubou fora do alcance');return 'sair do alcance impede cópia'});
      run('agarrão-IALES',()=>{const[f,t]=setup();t.x=470;f.fire(POWERS.iales.powers.find(p=>p.kind==='grabsteal'));for(let i=0;i<120;i++)g.tick();if(f.state==='rush'||!f.stolen)throw Error('agarrão não finaliza com cópia');return f.stolen.from});
      run('agarrão-bloqueado',()=>{const[f,t]=setup();t.x=470;g.inputFor=(ti)=>ti===1?Object.assign({},EMPTY_INPUT,{right:true}):EMPTY_INPUT;for(let i=0;i<2;i++)g.tick();f.fire(POWERS.iales.powers.find(p=>p.kind==='grabsteal'));for(let i=0;i<60;i++)g.tick();delete g.inputFor;if(f.stolen||f.state==='rush')throw Error('agarrão roubou apesar de defesa');return 'defesa impede agarrão'});
      run('agarrão-evitado',()=>{const[f,t]=setup();f.x=100;t.x=900;f.fire(POWERS.iales.powers.find(p=>p.kind==='grabsteal'));for(let i=0;i<120;i++)g.tick();if(f.state==='rush'||f.stolen)throw Error('investida infinita ou roubo global');return 'investida termina sem prender jogador'});
      run('segunda-ultimate-IALES',()=>{start();g.rec=null;const f=g.activeOf(0);f.afo=4;f.fire(POWERS.iales.powers.find(p=>p.id==='afo2'));for(let i=0;i<60;i++)g.tick();g.render(1);if(POWERS.iales.powers.find(p=>p.id==='afo2').row!==7||Art.images['abil:iales'].naturalHeight!==1024)throw Error('ícone de ultimate compartilhado');return g.time});
      run('pets',()=>{for(const pet of PETS){start('training',[pet,pet]);g.rec=null;for(let i=0;i<8;i++)g.tick();g.render(1)}if(Art.images.pets.naturalHeight!==1248)throw Error('atlas de pets incompleto');return PETS.length});
      run('todos-os-poderes',()=>{let n=0;for(const def of FIGHTERS){g.start({teams:[[def.id],['lobao']],pets:[PETS[PETS.length-3],PETS[PETS.length-2]],stage:'japan',mode:'training',cpu:[false,false],infiniteLife:true});g.rec=null;g.roundState='fight';const f=g.activeOf(0);for(const p of POWERS[def.id].powers){f.afo=5;f.state='idle';f.fire(p);for(let i=0;i<55;i++)g.tick();g.render(1);n++}}return n});
      return results;
    }""")
    if args.preview and all(case['ok'] for case in result):
        args.preview.parent.mkdir(parents=True,exist_ok=True)
        page.evaluate("""()=>{const g=DSGame;g.start({teams:[['lobao'],['iales']],pets:[PETS[9],PETS[10]],stage:'japan',mode:'training',cpu:[false,false],timer:180});UI.show('fight');g.rec=null;g.roundState='fight';g.roundStateTime=1;g.paused=false;g.running=true;g.bannerT=0;g.activeOf(0).x=330;g.activeOf(1).x=650;g.activeOf(0).status={};g.activeOf(1).status={};g.render(1);HUD.reset(g)}""")
        page.wait_for_timeout(400)
        page.locator('#game').screenshot(path=str(args.preview),type='jpeg',quality=92)
    print(json.dumps({'cases':result,'jsErrors':errors},ensure_ascii=False,indent=2))
    browser.close()
    if not args.probe:
        assert all(case['ok'] for case in result) and not errors,'hotfix ainda falha'
