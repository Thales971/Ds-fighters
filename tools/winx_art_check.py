#!/usr/bin/env python3
"""Focused browser regression for Winx's duplicated poses and generic attacks."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results/visual'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/?v=winx-art-v8-red')
POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win']

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1600, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until='load')
    page.wait_for_function("SpriteGen.images['winx-exe'] && SpriteGen.images['winx-exe'].naturalWidth", timeout=30000)
    report = page.evaluate("""poses => {
      const rows = poses.map(p => SpriteGen.rowOf(p, 'winx-exe'));
      const winx = SpriteGen.images['winx-exe'];
      const ability = ART_SHEETS['abil:winx-exe'];
      const customFx = ART_SHEETS['fx2:winx-exe'];
      const c = document.createElement('canvas'); c.width=1600; c.height=780; c.id='winx-15-pose-grid';
      c.style.setProperty('position','fixed','important'); c.style.setProperty('left','0','important');
      c.style.setProperty('top','0','important'); c.style.setProperty('z-index','2147483647','important');
      c.style.setProperty('display','block','important'); c.style.setProperty('pointer-events','none','important');
      c.style.setProperty('width','1600px','important'); c.style.setProperty('height','780px','important');
      const x = c.getContext('2d'); x.fillStyle='#111827'; x.fillRect(0,0,c.width,c.height);
      poses.forEach((pose,i)=>SpriteGen.blit(x,'winx-exe',pose,0,1,(i%5)*320+160,Math.floor(i/5)*260+246, false,1));
      document.body.appendChild(c);
      const attackGame = {bursts:[], netFx:[], netRole:'local', reduced:true,
        spawnBurst(key,row){this.bursts.push({key,row});}, spark(){}};
      const owner = {kitOwnerId:()=> 'winx-exe', elementOf:()=> 'winx', dir:1};
      POWERS['winx-exe'].powers.forEach(power=>Game.prototype.spawnAbilityImpact.call(attackGame,owner,power,400,250));
      return {rows, uniqueRows:[...new Set(rows)].length, dimensions:[winx.naturalWidth,winx.naturalHeight],
        abilitySrc:ability&&ability.src, abilityReady:Art.ready('abil:winx-exe'),
        customFxSrc:customFx&&customFx.src, customFxReady:Art.ready('fx2:winx-exe'),
        attackBursts:attackGame.bursts, winxPower: FIGHTERS.find(f=>f.id==='winx-exe')?.stats.power};
    }""", POSES)
    page.locator('#winx-15-pose-grid').screenshot(path=str(OUT / 'winx-v8-15-poses.png'))
    print(json.dumps(report, ensure_ascii=False), flush=True)
    assert report['uniqueRows'] == 15, 'Winx reutiliza linhas entre poses de combate'
    assert report['dimensions'] == [1280, 3900], 'Winx não usa spritesheet 4x15 completo'
    assert report['abilitySrc'] == 'assets/abilities/winx-exe.png', 'HUD da Winx ainda usa arte genérica'
    assert report['abilityReady'], 'Atlas de habilidades Winx não carregou'
    assert report['customFxSrc'] == 'assets/abilities/winx-exe.png', 'Impacto real ainda usa FX compartilhado'
    assert report['customFxReady'], 'Atlas de efeitos Winx não carregou'
    assert [b['key'] for b in report['attackBursts']] == ['fx2:winx-exe'] * 5, 'Nem todos os cinco golpes usam o atlas exclusivo em combate'
    assert [b['row'] for b in report['attackBursts']] == list(range(5)), 'Os cinco golpes não estão ligados a cinco linhas visuais próprias'
    assert report['winxPower'] == 1.38, 'O reparo visual alterou o nível de força da Winx'
    assert not errors, errors
    browser.close()
print('Winx art regression: 15 estados próprios + atlas exclusivo da HUD e dos ataques — PASS')
