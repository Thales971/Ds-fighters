#!/usr/bin/env python3
"""Verify that Kimi, DeepSeek and Dandara own every ability visual row."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results/visual'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/?v=exclusive-fx-v9')
IDS = ['kimi', 'deepseek', 'dandara-query']

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1920, 'height': 700})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until='load')
    page.wait_for_function("typeof Game !== 'undefined' && Art.ready('abil:kimi') && Art.ready('abil:deepseek') && Art.ready('abil:dandara-query')", timeout=30000)
    page.wait_for_function("['kimi','deepseek','dandara-query'].every(id => !ART_SHEETS['fx2:'+id] || Art.ready('fx2:'+id))", timeout=30000)
    report = page.evaluate("""ids => {
      const characters = ids.map(id => {
        const kit = POWERS[id];
        const fighter = FIGHTERS.find(f => f.id === id);
        const abilities = kit && kit.powers || [];
        const signature = SIGNATURES[id] || {};
        const bursts = [];
        const mock = Object.assign(Object.create(Game.prototype),
          {bursts, netFx:[], netRole:'host', reduced:true, sparks:[], rnd:()=>0.5});
        const owner = {dir:1, kitOwnerId:()=>id, elementOf:()=>kit.element};
        abilities.forEach(p => Game.prototype.spawnAbilityImpact.call(mock, owner, p, 320, 260));
        const guest = Object.assign(Object.create(Game.prototype), {bursts:[]});
        mock.netFx.filter(fx=>fx[0]==='b').forEach(fx=>guest.applyNetworkFx(fx));
        const hud = ART_SHEETS['abil:'+id];
        const fx = ART_SHEETS['fx2:'+id];
        return {
          id, element:kit && kit.element,
          hudSrc:hud && hud.src, fxSrc:fx && fx.src,
          hudReady:Art.ready('abil:'+id), fxReady:Art.ready('fx2:'+id),
          hudDimensions:Art.images['abil:'+id] && [Art.images['abil:'+id].naturalWidth,Art.images['abil:'+id].naturalHeight],
          fxDimensions:Art.images['fx2:'+id] && [Art.images['fx2:'+id].naturalWidth,Art.images['fx2:'+id].naturalHeight],
          rows:abilities.map(p=>p.visualRow),
          sheets:abilities.map(p=>p.visualSheet),
          impacts:abilities.map(p=>p.impactSheets || null),
          burstKeys:bursts.map(b=>b.key), burstRows:bursts.map(b=>b.row),
          networkBursts:mock.netFx.map(fx=>({key:fx[1],row:fx[2]})),
          guestBursts:guest.bursts.map(b=>({key:b.key,row:b.row})),
          stats:fighter && fighter.stats,
          special:fighter && fighter.special,
          super:fighter && fighter.super,
          shockDurations:abilities.map(p=>p.fx && p.fx.shock || 0),
          signatureShock:{basic:(signature.basic || {}).shock || 0,ability:(signature.ability || {}).shock || 0},
          controlFlags:abilities.map(p=>['lock','trap','freeze','glitch'].filter(k=>p.fx && p.fx[k] > 0)),
          elementFx:kit && ELEMENT_FX[kit.element],
        };
      });
      const c = document.createElement('canvas'); c.id='exclusive-fx-preview';
      c.width=1920; c.height=128; c.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;width:1920px;height:128px;';
      const x=c.getContext('2d'); x.fillStyle='#111827'; x.fillRect(0,0,c.width,c.height);
      ids.forEach((id,i)=>{ for(let r=0;r<5;r++) Art.ability(x,id,r,0,i*640+r*128+64,64,{scale:1}); });
      document.body.appendChild(c);
      return {characters, errors:[]};
    }""", IDS)
    report['errors'] = errors
    page.locator('#exclusive-fx-preview').screenshot(path=str(OUT / 'exclusive-ability-atlases.png'))
    combat = page.evaluate("""ids => {
      document.getElementById('exclusive-fx-preview')?.remove();
      const g=DSGame;
      UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
      g.start({teams:[['kimi'],['deepseek']],stage:'dojo-noite',cpu:[false,false],weather:'clear'});
      g.running=false; g.roundState='fight'; g.activeOf(0).x=320; g.activeOf(1).x=660;
      HUD.reset(g); HUD.update(g);
      const hudIcons=[0,1].map(t=>document.querySelector(`#skills-${t} .skill .ico`)?.style.backgroundImage || '');
      const attacker=g.activeOf(0), target=g.activeOf(1);
      target.applyEffects({ability:true,power:POWERS.kimi.powers[0]},attacker,9,1);
      const shockDuration=target.left('shock');
      target.now+=shockDuration+1;
      const shockRecovered=!target.has('shock');
      const firstBurst=g.bursts.length;
      ids.forEach((id,i)=>{
        const owner={dir:1,kitOwnerId:()=>id,elementOf:()=>POWERS[id].element};
        POWERS[id].powers.forEach((power,row)=>g.spawnAbilityImpact(owner,power,120+(i*5+row)*46,-150));
      });
      const bursts=g.bursts.slice(firstBurst).map(b=>({key:b.key,row:b.row}));
      const cssAtlases=ids.map(id=>({id,css:Art.css('abil:'+id,0,1,54)}));
      document.getElementById('banner').classList.remove('on');
      document.getElementById('cutin').classList.remove('on');
      document.getElementById('toast').classList.remove('on');
      document.querySelectorAll('.speech').forEach(e=>e.classList.remove('on'));
      g.render(1);
      return {fighters:[g.activeOf(0).def.id,g.activeOf(1).def.id],hudIcons,cssAtlases,bursts,burstCount:bursts.length,roundState:g.roundState,shockDuration,shockRecovered};
    }""", IDS)
    page.wait_for_function('DSGame.stage && DSGame.stage.ready', timeout=15000)
    page.evaluate('DSGame.render(1)')
    combat['stageReady'] = page.evaluate('!!(DSGame.stage && DSGame.stage.ready)')
    report['errors'] = errors
    page.screenshot(path=str(OUT / 'v9-three-atlas-match.png'))
    print(json.dumps({'atlases':report,'combat':combat}, ensure_ascii=False), flush=True)
    by_id = {c['id']: c for c in report['characters']}
    for fid in IDS:
        c = by_id[fid]
        assert c['hudSrc'] == f'assets/abilities/{fid}.png', f'{fid}: HUD ainda usa arte genérica'
        assert c['fxSrc'] == f'assets/abilities/{fid}.png', f'{fid}: impactos ainda usam FX genérico'
        assert c['hudReady'] and c['fxReady'], f'{fid}: atlas não carregou'
        assert c['hudDimensions'] == [512, 640] and c['fxDimensions'] == [512, 640], f'{fid}: atlas precisa ser 4×5 células de 128 px'
        assert c['rows'] == list(range(5)), f'{fid}: cinco habilidades não têm linhas visuais distintas'
        assert c['sheets'] == [fid] * 5, f'{fid}: habilidade ainda aponta para sheet compartilhado'
        assert c['impacts'] == [[]] * 5, f'{fid}: habilidade ainda empilha efeito genérico'
        assert c['burstKeys'] == [f'fx2:{fid}'] * 5, f'{fid}: impactos reais não usam o atlas próprio'
        assert c['burstRows'] == list(range(5)), f'{fid}: linha de impacto não corresponde à habilidade'
        assert c['networkBursts'] == [{'key': f'fx2:{fid}', 'row': row} for row in range(5)], f'{fid}: efeitos próprios não chegam ao payload do online'
        assert c['guestBursts'] == [{'key': f'fx2:{fid}', 'row': row} for row in range(5)], f'{fid}: cliente remoto não reidrata o atlas próprio'
    kimi = by_id['kimi']
    assert kimi['element'] == 'electric', 'Kimi precisa ter tema elétrico no kit'
    assert kimi['elementFx']['sheet'] == 'kimi', 'o mapeamento elétrico deve apontar para o atlas da Kimi'
    assert len([n for n in kimi['shockDurations'] if n > 0]) >= 4, 'os ataques diretos da Kimi devem aplicar choque breve'
    assert max(kimi['shockDurations']) <= 46, 'choque da Kimi deve permanecer curto'
    assert kimi['signatureShock'] == {'basic': 0, 'ability': 0}, 'combos básicos não podem renovar choque sem limite'
    assert not any(kimi['controlFlags']), 'Kimi não deve prender o adversário nem distorcer seus comandos'
    assert kimi['special']['proj']['shape'] == 'bolt' and kimi['super']['visualSheet'] == 'kimi', 'special/super da Kimi precisam de raio e atlas próprio'
    assert combat['fighters'] == ['kimi', 'deepseek'] and combat['stageReady'], 'a luta real de Canvas não iniciou'
    assert 'assets/abilities/kimi.png' in combat['hudIcons'][0] and 'assets/abilities/deepseek.png' in combat['hudIcons'][1], 'HUD da luta ainda não mostra os atlas próprios'
    assert all(f'assets/abilities/{fid}.png' in entry['css'] for fid, entry in zip(IDS, combat['cssAtlases'])), 'Art.css da HUD não aponta para cada atlas'
    assert combat['bursts'] == [{'key':f'fx2:{fid}','row':row} for fid in IDS for row in range(5)], 'a luta real não renderizou os 15 efeitos exclusivos'
    assert combat['shockDuration'] == 16 and combat['shockRecovered'], 'o choque da Kimi não expira com controles recuperados'
    assert combat['roundState'] == 'fight', 'a partida deve permanecer jogável após os efeitos'
    assert not report['errors'], report['errors']
    browser.close()
print('unique ability atlases: 15 ataques, efeitos reais próprios e Kimi elétrica — PASS')
