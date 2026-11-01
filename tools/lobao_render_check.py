#!/usr/bin/env python3
"""Checagem focada; não executa torneios nem escreve no Supabase."""
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
import subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/visual';OUT.mkdir(parents=True,exist_ok=True)
im=Image.open(ROOT/'assets/sprites/lobao.png')
assert im.mode=='RGBA' and im.size==(1280,3900)
for row in range(15):
    for col in range(4):
        cell=im.crop((col*320,row*260,(col+1)*320,(row+1)*260))
        box=cell.getbbox();assert box and box[3]<=246,(row,col,box)
        alpha=cell.getchannel('A').getextrema();assert alpha[0]==0 and alpha[1]>=240,(row,col,alpha)
subprocess.run(['git','diff','--exit-code','b01f0ac','--','js/data/fighters.js','js/data/powers-turbo.js','assets/sprites/bhm.png'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium')
    page=b.new_page(viewport={'width':1280,'height':720})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:8099/')
    page.wait_for_function("window.DSGame && !document.getElementById('loader') && SpriteGen.images.lobao")
    page.locator('#btn-start').click()
    assert page.evaluate("FIGHTERS.slice().sort((a,b)=>b.stats.power-a.stats.power)[2].id==='qwen'")
    assert page.evaluate("!!ART_SHEETS['abil:lobao']"),'folha de habilidades desconectada'
    assert page.evaluate("!FIGHTERS.find(f=>f.id==='lobao').traits.wolfEars")
    assert page.evaluate("SpriteGen.count('punch','lobao')===4 && SpriteGen.count('special','lobao')===4")
    page.evaluate("DSGame.start({teams:[['lobao'],['bhm']],stage:'japan',cpu:[false,false],mode:'versus',timer:180});UI.show('fight');DSGame.roundState='fight';HUD.reset(DSGame);")
    assert page.evaluate('DSGame.activeOf(0).maxHp>250 && DSGame.activeOf(1).maxHp===272')
    for pose in ['idle','walk','crouch','punch','kick','special','hit','block','ko','win']:
        page.evaluate("s=>SpriteGen.blit(document.getElementById('game').getContext('2d'),'lobao',s,2,1,260,500)",pose)
    page.evaluate("DSGame.render(0);HUD.update(DSGame)")
    page.wait_for_timeout(900)
    assert page.evaluate("document.getElementById('game').getContext('2d').getImageData(0,0,960,540).data.some((v,i)=>i%4!==3&&v>30)"),'arena vazia'
    page.locator('#game').screenshot(path=str(OUT/'lobao-corrigido.png'))
    b.close()
assert not errors,errors
print('PASS Lobão: 60 células, poses no motor, rosto humano, vida, Qwen terceira, BHM original e nenhum erro JS')
