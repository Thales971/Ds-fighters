#!/usr/bin/env python3
"""Browser regression for V11 characters, custom VFX and limited combat states."""
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results' / 'visual'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/')
errors = []
asset_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: asset_errors.append({'status': r.status, 'url': r.url}) if r.status >= 400 and any(k in r.url for k in ('mis', 'grika', 'dev-senior')) else None)
    page.goto(BASE, wait_until='load')
    page.wait_for_function("window.DSGame && typeof UI !== 'undefined' && ['mis','grika','dev-senior'].every(id => SpriteGen.images[id] && Art.ready('abil:' + id) && Art.ready('fx2:' + id))", timeout=30000)
    page.wait_for_function("['mis','grika','dev-senior','dev-senior-nano'].every(id => SpriteGen.images[id] && SpriteGen.images[id].complete && SpriteGen.images[id].naturalWidth === 1280)", timeout=30000)
    face_assets = page.evaluate("""async ids => Promise.all(ids.map(id => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({id, ok: true, dimensions: [img.naturalWidth, img.naturalHeight]});
      img.onerror = () => resolve({id, ok: false});
      img.src = SpriteGen.faceUrl(id);
    })))""", ['mis', 'grika', 'dev-senior'])

    result = page.evaluate("""() => {
      const ids = ['mis', 'grika', 'dev-senior'];
      const art = ids.map(id => ({id,
        ability: [Art.images['abil:' + id].naturalWidth, Art.images['abil:' + id].naturalHeight],
        fx: [Art.images['fx2:' + id].naturalWidth, Art.images['fx2:' + id].naturalHeight],
        rows: ART_SHEETS['fx2:' + id].rows,
      }));
      const fighters = ids.map(id => {
        const f = FIGHTERS.find(x => x.id === id);
        return {id, exists: !!f, secret: !!(f && f.secret), stats: f && f.stats,
          sheet: [SpriteGen.images[id].naturalWidth, SpriteGen.images[id].naturalHeight],
          idleFrames: SpriteGen.count('idle', id), face: SpriteGen.faceUrl(id)};
      });
      const bursts = [];
      ids.forEach((id, team) => POWERS[id].powers.forEach((power, row) => {
        const fighter = new Fighter(FIGHTERS.find(f => f.id === id), 240 + team * 100, team ? -1 : 1, {
          W: 960, H: 540, time: 0, round: 1, weather: {kind:'clear',wind:0}, combo: {owner:null,count:0,until:0}, cfg:{},
          fighters(){return []}, opponentsOf(){return []}, enemyOf(){return null}, spawnBurst(){}, spawnImgFx(){}, spawnAbilityImpact(){},
          addCrack(){}, shake(){}, floatText(){}, registerHit(){}, splash(){}, announce(){}, say(){}, superFreeze(){},
          audio:{sfx(){},play(){},voice(){},loop(){},hit(){},block(){},ko(){},dash(){}}
        }, {team, pet:PETS[0]});
        const fake = { spawnBurst(key, r, x, y, dir, scale) { bursts.push({key,row:r}); } };
        fake.spawnAbilityImpact = (owner, p, x, y) => bursts.push({key:'fx2:' + p.visualSheet,row:p.visualRow});
        fake.spawnBurst('impact', row, 0, 0, 1, 1);
        fake.spawnAbilityImpact(fighter, power, 0, 0);
      }));

      const g = DSGame;
      UI.show('fight');
      document.getElementById('stage-wrap').classList.add('on');
      g.start({mode:'online',netRole:'guest',localTeam:1,teams:[['mis'],['grika']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false;
      g.roundState = 'fight';
      const mis = g.activeOf(0), grika = g.activeOf(1);
      mis.x = 350; grika.x = 610;
      for (const id of ids) {
        const owner = id === 'mis' ? mis : id === 'grika' ? grika : new Fighter(FIGHTERS.find(f=>f.id==='dev-senior'), 780, 1, g, {team:0,pet:PETS[0]});
        POWERS[id].powers.forEach((power, row) => g.spawnAbilityImpact(owner, power, 120 + row * 150, 250));
      }
      const exclusiveBursts = g.bursts.slice(-15).map(b => ({key:b.key,row:b.row}));

      const misUlt = POWERS.mis.powers[4];
      grika.takeHit(4,{attacker:mis,ability:true,power:misUlt,height:'unblockable'});
      const misStatuses = {blind:grika.has('blind'),burn:grika.has('burn'),vertigo:grika.has('vertigo')};
      grika.frame = 19; g.time = 1;
      const hpBeforeBurnTick = grika.hp;
      grika.update(EMPTY_INPUT);
      const burnTicks = grika.hp < hpBeforeBurnTick;

      g.cfg.localTeam = 1;
      g.reduced = false;
      g.render(1);
      const localFlip = document.getElementById('game').classList.contains('vertigo');
      const canvasTransform = getComputedStyle(document.getElementById('game')).transform;
      const hudTransform = getComputedStyle(document.getElementById('hud')).transform;
      g.cfg.localTeam = 0;
      g.render(1);
      const remoteNotFlipped = !document.getElementById('game').classList.contains('vertigo');
      g.cfg.localTeam = 1; g.reduced = true; g.render(1);
      const reducedMotionNotFlipped = !document.getElementById('game').classList.contains('vertigo') && grika.has('vertigo');
      g.reduced = false;

      g.start({mode:'tag',teams:[['mis','grika'],['stack','dev-senior']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight';
      const taggedTeam = g.teams[0], paralyzedActive = g.activeOf(0);
      paralyzedActive.addStatus('paralyze', 60);
      const paralyzeBlocksActions = !paralyzedActive.canAct();
      g.tryTag(0);
      const tagBlocked = taggedTeam.active === 0;
      g.tryAssist(0);
      const assistBlocked = !(taggedTeam.assistCd > 0) && !taggedTeam.members[1].assistT;

      g.start({mode:'online',netRole:'guest',localTeam:0,mySlot:1,fourP:true,teams:[['mis','grika'],['stack','dev-senior']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight'; g.reduced = false;
      const slotActive = g.activeOf(0);
      slotActive.addStatus('vertigo', 90);
      g.render(1);
      const reserveSlotNotFlipped = !document.getElementById('game').classList.contains('vertigo');
      g.cfg.mySlot = 0; g.render(1);
      const activeSlotFlipped = document.getElementById('game').classList.contains('vertigo');

      g.start({mode:'online',netRole:'guest',localTeam:0,teams:[['grika'],['stack']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight';
      const grikaF = g.activeOf(0), stackF = g.activeOf(1);
      grikaF.x = 350; stackF.x = 555;
      const blackHole = POWERS.grika.powers[4];
      grikaF.fire(blackHole);
      const zone = g.zones[g.zones.length - 1];
      zone.x = stackF.x; zone.age = 11;
      const hpBeforeHole = stackF.hp;
      zone.update(g);
      const blackHoleActive = stackF.has('paralyze') && stackF.hp < hpBeforeHole && zone.key === 'fx2:grika' && zone.row === 4;
      stackF.addStatus('paralyze', 96, grikaF);
      const paralysisCap = stackF.left('paralyze') <= 72;

      g.start({mode:'online',netRole:'guest',localTeam:0,teams:[['dev-senior'],['stack']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight';
      const dev = g.activeOf(0), nanoTarget = g.activeOf(1);
      const nano = POWERS['dev-senior'].powers[4];
      dev.fire(nano);
      const nanoState = {active:dev.has('nanomachines'),armor:dev.has('armor'),sprite:dev.spriteKey(),power:dev.dmgMult(nano),defense:dev.defMult()};
      nanoTarget.x = dev.x + 120; dev.frame = 36; g.netRole = 'host';
      const electricHp = nanoTarget.hp, netFxStart = g.netFx.length;
      const electricTriggered = dev.nanoElectricPulse();
      const electricBurst = g.bursts[g.bursts.length - 1];
      const electricNetMessage = g.netFx.slice(netFxStart).find(fx=>fx[0]==='b'&&fx[1]==='fx2:dev-senior-electric');
      const guestFxProbe = new Game(document.createElement('canvas'));
      if (electricNetMessage) guestFxProbe.applyNetworkFx(electricNetMessage);
      const redElectricPulse = {triggered:electricTriggered,damaged:nanoTarget.hp<electricHp,shortShock:nanoTarget.has('shock')&&nanoTarget.left('shock')<=8,
        ownAtlas:electricBurst&&electricBurst.key==='fx2:dev-senior-electric'&&electricBurst.row===0,
        hostSynced:!!electricNetMessage,
        guestReceived:guestFxProbe.bursts.some(b=>b.key==='fx2:dev-senior-electric'&&b.row===0)};
      nanoTarget.x = dev.x + 151; dev.frame = 72;
      const farHp = nanoTarget.hp;
      redElectricPulse.staysInRange = dev.nanoElectricPulse()===false && nanoTarget.hp===farHp;
      dev.now = nano.time + 1;
      const nanoExpires = !dev.has('nanomachines') && dev.spriteKey() === 'dev-senior';

      g.start({mode:'versus',teams:[['dev-senior'],['stack']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight';
      const roundDev = g.activeOf(0), roundUlt = POWERS['dev-senior'].powers[4];
      roundDev.now = 100; roundDev.fire(roundUlt);
      roundDev.now = 250; g.round = 2; g.beginRound(); roundDev.fire(roundUlt);
      const nanoWindowResetsBetweenRounds = roundDev.left('nanomachines') === roundUlt.time;

      g.start({mode:'versus',teams:[['dev-senior'],['stack']],stage:'pos-codigocalipse',cpu:[false,false]});
      g.running = false; g.roundState = 'fight';
      const captureDev = g.activeOf(0), captureTarget = g.activeOf(1);
      captureDev.fire(roundUlt); captureTarget.x = captureDev.x + 120; captureDev.frame = 36;
      captureDev.nanoElectricPulse();

      const totals = {fighters:FIGHTERS.length,stages:STAGE_LIST.length};
      return {fighters,art,faceRequests:ids.map(id=>({id,url:SpriteGen.faceUrl(id)})),faceHud:document.querySelectorAll('#hud .side .face').length,
        exclusiveBursts,misStatuses,burnTicks,localFlip,remoteNotFlipped,reducedMotionNotFlipped,canvasTransform,hudTransform,blackHoleActive,paralysisCap,
        paralyzeBlocksActions,tagBlocked,assistBlocked,reserveSlotNotFlipped,activeSlotFlipped,nanoState,redElectricPulse,nanoExpires,nanoWindowResetsBetweenRounds,totals,
        onlineIds:ids.map(id=>RoomCore.FIGHTER_IDS.includes(id))};
    }""")
    result['faceAssets'] = face_assets
    page.wait_for_function('DSGame.stage && DSGame.stage.ready', timeout=20000)
    page.evaluate("DSGame.render(1)")
    page.screenshot(path=str(OUT / 'v11-mis-grika-dev-senior.png'))
    print(json.dumps({'result': result, 'pageErrors': errors, 'assetErrors': asset_errors}, ensure_ascii=False, indent=2), flush=True)

    assert result['fighters'] == [
        {'id':'mis','exists':True,'secret':False,'stats':result['fighters'][0]['stats'],'sheet':[1280,2080],'idleFrames':4,'face':'assets/ui/face-mis.png?v=expansion-v11'},
        {'id':'grika','exists':True,'secret':False,'stats':result['fighters'][1]['stats'],'sheet':[1280,2080],'idleFrames':4,'face':'assets/ui/face-grika.png?v=expansion-v11'},
        {'id':'dev-senior','exists':True,'secret':False,'stats':result['fighters'][2]['stats'],'sheet':[1280,2080],'idleFrames':4,'face':'assets/ui/face-dev-senior.png?v=expansion-v11'},
    ], 'fighter definitions or sprite sheets are incomplete'
    assert all(f['ok'] and f['dimensions'] == [160,160] for f in face_assets), 'V11 roster faces did not load at 160x160'
    assert all(x['ability']==[512,640] and x['fx']==[512,640] and x['rows']==5 for x in result['art']), 'V11 atlases are not 4x5 for both HUD and combat'
    assert len(result['exclusiveBursts']) == 15 and all(b['key'] in ('fx2:mis','fx2:grika','fx2:dev-senior') and b['row'] in range(5) for b in result['exclusiveBursts']), 'one or more attacks uses generic effects'
    assert result['misStatuses']=={'blind':True,'burn':True,'vertigo':True} and result['burnTicks'], 'Mis ultimate is missing its limited screen effect or continuous fire damage'
    assert result['localFlip'] and result['remoteNotFlipped'] and result['reducedMotionNotFlipped'] and result['canvasTransform'] != 'none' and result['hudTransform']=='none', 'screen inversion must apply only to the local affected viewport, respect reduced motion, and never rotate HUD/controls'
    assert result['blackHoleActive'] and result['paralysisCap'], 'Grika black hole does not damage/paralyze or paralysis is renewable'
    assert result['paralyzeBlocksActions'] and result['tagBlocked'] and result['assistBlocked'], 'paralyze must stop attacks, tag and assists until control returns'
    assert result['reserveSlotNotFlipped'] and result['activeSlotFlipped'], 'V4P vertigo should only affect the slot that currently controls the active fighter'
    assert result['nanoState']['active'] and result['nanoState']['armor'] and result['nanoState']['sprite']=='dev-senior-nano' and result['nanoState']['power']>=1.38 and result['nanoState']['defense']<0.85 and result['nanoExpires'], 'Dev Senior nano form/buffs did not activate and expire together'
    assert all(result['redElectricPulse'].values()), 'Nano Overdrive red electricity must hit only nearby opponents, use its own FX and sync from host'
    assert result['nanoWindowResetsBetweenRounds'], 'status caps should reset between rounds so the nano ultimate keeps its full duration'
    assert result['onlineIds']==[True,True,True], 'new fighters are missing from the browser online allowlist'
    assert not errors, errors
    assert not asset_errors, asset_errors
    browser.close()
print('V11 Canvas: 3 fighters, 15 private VFX, Mis vertigo/DoT, Grika black hole, Dev Senior nano/red-electric field — PASS')
