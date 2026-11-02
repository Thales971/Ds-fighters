#!/usr/bin/env python3
"""Browser regression: complete new sprites, Winx code, skins back and voice."""
import json, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('DS_WEB_BASE','http://localhost:8099/')
ROSTER_4X8={'kimi','deepseek','dandara-query','gemini','meta'}

def full_frame_scale(background_size, is_4x8=False):
    parts=background_size.split()
    expected_h=800 if is_4x8 else 1500
    return (len(parts)==2 and parts[0].endswith('%') and parts[1].endswith('%')
            and abs(float(parts[0][:-1])-492.3077)<0.01
            and abs(float(parts[1][:-1])-expected_h)<0.01)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'))
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.add_init_script("""(()=>{
      window.__spokenNames=[];
      class TestUtterance {constructor(text){this.text=String(text);this.lang='';this.rate=1;this.pitch=1;this.volume=1;}}
      Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:TestUtterance});
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
        getVoices:()=>[{lang:'pt-BR',name:'Português Brasil teste'}],
        speak(u){window.__spokenNames.push({text:u.text,lang:u.lang,volume:u.volume});if(u.onstart)u.onstart();setTimeout(()=>{if(u.onend)u.onend()},5)},
        cancel(){},pending:false,speaking:false,paused:false
      }});
    })();""")
    page.goto(BASE)
    page.wait_for_function("window.DSGame && typeof UI !== 'undefined' && !document.getElementById('loader')",timeout=30000)
    page.locator('#btn-start').click()
    page.locator('#scr-menu [data-go="skins"]').click()
    page.locator('#scr-skins [data-back]').click()
    back_ok=page.evaluate("UI.screen==='menu'")
    codes=page.evaluate("""(()=>{
      const batata=Profile.redeem('batata');
      const winxLockedAfterBatata=!Profile.isUnlocked('winx-exe');
      const winx=Profile.redeem('WINX.EXE');
      return {batataIds:batata.ids,winxLockedAfterBatata,winxOk:winx.ok,winxIds:winx.ids,winxUnlocked:Profile.isUnlocked('winx-exe')};
    })()""")
    modal=page.evaluate("""(()=>{
      Profile.data.unlocked=Profile.data.unlocked.filter(id=>id!=='winx-exe');
      Profile.save();
      UI.show('redeem');
      document.getElementById('redeem-input').value='WINX';
      UI.redeem();
      const faces=[...document.querySelectorAll('#redeem-faces .rf')];
      const sprite=faces[0]&&faces[0].querySelector('.vs-sprite');
      const style=sprite&&getComputedStyle(sprite);
      return {unlocked:Profile.isUnlocked('winx-exe'),faces:faces.length,spriteClass:sprite&&sprite.className,bg:sprite&&style.backgroundImage,bgSize:style&&style.backgroundSize};
    })()""")
    # Reopen the real character selection with the isolated code fixture already applied.
    page.evaluate("UI.show('menu'); UI.startFlow('versus')")
    ids=['urbano','stack','qwen','xeon','thl','dolynho','lobao','winx-exe','kimi','deepseek','dandara-query','nina-vector','gemini','meta']
    portraits=page.evaluate("ids=>ids.map(id=>{const i=FIGHTERS.findIndex(f=>f.id===id);const e=document.querySelector('.cell[data-i=\"'+i+'\"] .face');if(!e)return{id,found:false};const s=getComputedStyle(e);return{id,found:true,className:e.className,bg:s.backgroundImage,bgSize:s.backgroundSize,width:s.width,height:s.height}})",ids)
    nina=page.evaluate("(()=>{const f=FIGHTERS.find(f=>f.id==='nina-vector');return{exists:!!f,secret:!!(f&&f.secret),unlocked:Profile.isUnlocked('nina-vector'),idleFrames:SpriteGen.count('idle','nina-vector')}})()")
    preview=Path(__file__).resolve().parents[1]/'test-results/visual/v8-selection.png'
    preview.parent.mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(preview))
    expected_names=page.evaluate("ids=>ids.map(id=>FIGHTERS.find(f=>f.id===id).name)",['thl','lobao'])
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(120)
    mobile_portraits=page.evaluate("ids=>({mobile:document.body.classList.contains('mobile'),items:ids.map(id=>{const i=FIGHTERS.findIndex(f=>f.id===id);const e=document.querySelector('.cell[data-i=\\\"'+i+'\\\"] .face');const s=getComputedStyle(e);return {id,w:parseFloat(s.width),bg:s.backgroundSize}})})",ids)
    page.set_viewport_size({'width':1280,'height':720})
    page.wait_for_timeout(80)
    for fighter_id in ['thl','lobao']:
        idx=page.evaluate("id=>FIGHTERS.findIndex(f=>f.id===id)",fighter_id)
        page.locator(f'.cell[data-i="{idx}"]').click()
    spoken=page.evaluate('window.__spokenNames')
    checks={
      'skins_back_returns_to_menu':back_ok,
      'batata_keeps_legacy_secret_group':codes['batataIds']==['du','iales','felipinho','qwen'] and codes['winxLockedAfterBatata'],
      'winx_own_code_unlocks_only_winx':codes['winxOk'] and codes['winxIds']==['winx-exe'] and codes['winxUnlocked'],
      'short_code_unlocks_full_winx_sprite_in_modal':modal['unlocked'] and modal['faces']==1 and 'sprite-4x8' not in modal['spriteClass'] and 'expansion-v8' in modal['bg'] and modal['bgSize']=='1280px 3900px',
      'nina_is_normal_and_available':nina['exists'] and not nina['secret'] and nina['unlocked'] and nina['idleFrames']==4,
      'new_roster_thumbnails_fit_their_full_sheets':all(x['found'] and 'roster-sprite' in x['className'] and 'assets/sprites/' in x['bg'] and full_frame_scale(x['bgSize'],x['id'] in ROSTER_4X8) for x in portraits),
      'mobile_portraits_fit_without_cropping':mobile_portraits['mobile'] and all(x['w']>0 and full_frame_scale(x['bg'],x['id'] in ROSTER_4X8) for x in mobile_portraits['items']),
      'both_selected_names_spoken_in_portuguese':len(spoken)>=2 and [x['text'] for x in spoken[-2:]]==expected_names and all(x['lang']=='pt-BR' for x in spoken[-2:]),
      'no_javascript_errors':not errors,
    }
    print(json.dumps({'checks':checks,'codes':codes,'modal':modal,'nina':nina,'portraits':portraits,'mobilePortraits':mobile_portraits,'spoken':spoken,'errors':errors},ensure_ascii=False,indent=2))
    browser.close()
    assert all(checks.values()),'seleção/navegação/código/narração ainda falha'
