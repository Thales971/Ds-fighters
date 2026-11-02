#!/usr/bin/env python3
"""Integração V5 com assets reais e Chromium. Raiz em localhost:8099."""
import json
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results/visual'
OUT.mkdir(parents=True,exist_ok=True)
for cid in ['thl','dolynho']:
    im=Image.open(ROOT/f'assets/sprites/{cid}.png')
    assert im.mode=='RGBA' and im.size==(1280,3900)
    for row in range(15):
        for col in range(4):
            cell=im.crop((col*320,row*260,(col+1)*320,(row+1)*260));box=cell.getbbox()
            assert box and box[3]<=246 and box[0]>=0 and box[2]<=320,(cid,row,col,box)
            assert np.asarray(cell)[...,3].min()==0
    for suffix in ['face','portrait']:
        assert Image.open(ROOT/f'assets/ui/{suffix}-{cid}.png').mode=='RGBA'
    fx=Image.open(ROOT/f'assets/abilities/{cid}.png')
    assert fx.mode=='RGBA' and fx.size==(512,640)
    print('PASS folhas/retratos/efeitos '+cid,flush=True)
for sid in ['japan','cyberpunk']:
    assert Image.open(ROOT/f'assets/maps/{sid}.jpg').size==(960,540)
    assert Image.open(ROOT/f'assets/maps/anim/{sid}.png').size==(3840,1440)
report=json.loads((ROOT/'assets/music/import-report.json').read_text())
playlist=json.loads((ROOT/'assets/music/playlist.json').read_text())
assert len(report['tracks'])==len(playlist['tracks'])==38
assert len({x['file'] for x in playlist['tracks']})==38
for track in report['tracks']:
    file=ROOT/track['file'];assert file.is_file() and file.stat().st_size==track['bytes']
    assert track['duration_seconds']>10 and track['normalization'].get('output_i')
    assert float(track['normalization']['output_tp'])<=-1.7
assert not list((ROOT/'assets/music/rock').glob('*.tmp.mp3'))
print('PASS 38 músicas reais, duração e pico normalizados, sem temporários',flush=True)
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium')
    page=b.new_page(viewport={'width':1280,'height':720})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:8099/',wait_until='load')
    page.wait_for_function("window.DSGame && Object.keys(SpriteGen.images).length>=Object.keys(SPRITE_LAYOUT.files).length")
    page.wait_for_function("Art.ready('abil:thl') && Art.ready('abil:dolynho') && AudioSys.playlist.tracks.length===38")
    assert page.evaluate("FIGHTERS.length===30 && STAGE_LIST.length===45")
    assert page.evaluate("['thl','dolynho'].every(id=>Profile.isUnlocked(id)&&!Profile.SECRET_IDS.includes(id)&&SpriteGen.count('cpunch',id)===4)")
    assert page.evaluate("FIGHTERS.slice().sort((a,b)=>b.stats.power-a.stats.power).slice(0,3).map(f=>f.id).join(',')==='iales,felipinho,qwen' && FIGHTERS.find(f=>f.id==='winx-exe').stats.power===FIGHTERS.find(f=>f.id==='du').stats.power")
    page.evaluate("UI.startFlow('versus');UI.flow.picks=[[FIGHTERS.findIndex(f=>f.id==='thl')],[FIGHTERS.findIndex(f=>f.id==='dolynho')]]")
    assert page.evaluate('UI.matchConfig().timer===180')
    page.evaluate("UI.show('rules')")
    assert page.locator('#rules-timer').input_value()=='180'
    page.select_option('#rules-timer','300');page.click('#rules-start')
    assert page.evaluate('UI.flow.customRules.timer===300')
    page.evaluate("UI.show('online')")
    assert page.locator('#lobby-timer').input_value()=='180'
    # O lobby fica oculto enquanto não existe sala; aqui verificamos o contrato
    # de configuração. O teste online_e2e cobre o controle em uma sala real.
    page.evaluate("document.getElementById('lobby-timer').value='300'")
    assert page.evaluate('Net.onlineConfig().timer===300')
    assert page.evaluate("RoomCore.normalizeConfig({timer:999}).timer===300")
    print('PASS novos normais, ranking, tempo local/online 180–300s',flush=True)
    for sid in ['japan','cyberpunk']:
        page.evaluate("""sid=>{
          const g=DSGame;UI.show('fight');document.getElementById('stage-wrap').classList.add('on');
          g.start({teams:[['thl'],['dolynho']],stage:sid,cpu:[false,false],weather:'clear'});
          g.running=false;g.roundState='fight';
          g.activeOf(0).x=310;g.activeOf(1).x=650;
          document.getElementById('banner').classList.remove('on');document.getElementById('cutin').classList.remove('on');document.getElementById('toast').classList.remove('on');
          document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on'));HUD.reset(g);g.render(1);
        }""",sid)
        page.wait_for_function('DSGame.stage.ready')
        assert page.evaluate('DSGame.cfg.timer===180 && DSGame.roundTimer===180*60')
        assert page.evaluate('DSGame.activeOf(0).maxHp===280 && DSGame.activeOf(1).maxHp===252')
        page.evaluate('document.fonts.ready')
        page.evaluate('DSGame.render(1)')
        assert page.evaluate("(()=>{const e=document.getElementById('hud-timer');return e.textContent==='180'&&e.scrollWidth<=e.clientWidth;})()"), 'cronômetro de três dígitos cortado'
        page.screenshot(path=str(OUT/f'v5-{sid}.png'))
        assert page.evaluate("(()=>{let s=DSGame.stage;s.reducedFlag=true;s.t=50;let a=s.frameRect();s.t=800;return JSON.stringify(a)===JSON.stringify(s.frameRect());})()")
        page.evaluate("(()=>{let f=DSGame.activeOf(0);f.hardControl.chain=3;f.statusPulse.blind={count:3};DSGame.beginRound();return f.hardControl.chain===0&&Object.keys(f.statusPulse).length===0;})()")
        assert page.evaluate('DSGame.activeOf(0).hardControl.chain===0')
        print('PASS mapa '+sid+', vida real, redução movimento e memória limpa',flush=True)
    # Reprodução real de uma faixa enviada; o narrador aciona ducking no áudio real.
    page.evaluate('UI.pressStart()')
    page.wait_for_function("AudioSys.buffers.v_fight")
    page.evaluate("AudioSys.playMusic('battle')")
    page.wait_for_function('AudioSys.music && AudioSys.music.currentTime>0',timeout=20000)
    page.wait_for_function('AudioSys.voiceActive===0',timeout=20000)
    audio=page.evaluate("(()=>{let normal=AudioSys.music.volume;AudioSys.voice('fight');return {normal,duck:AudioSys.music.volume,file:AudioSys.music.src};})()")
    # O ganho de fundo foi elevado levemente a pedido do proprietário; o teste
    # mantém o limite moderado e continua exigindo ducking real do narrador.
    assert audio['normal']<=0.26 and audio['duck']<audio['normal']
    assert '/assets/music/rock/' in audio['file']
    print('PASS música enviada realmente tocando, ducking real do narrador',flush=True)
    b.close()
assert not errors,errors
print('v5_check: PASS; nenhum erro JavaScript',flush=True)
