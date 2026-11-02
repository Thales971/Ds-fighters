#!/usr/bin/env python3
"""Browser regression for the V10 Gemini/Meta expansion."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results' / 'visual'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('DS_WEB_BASE', 'http://localhost:8099/')
errors = []
asset_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: asset_errors.append({'status': r.status, 'url': r.url}) if r.status >= 400 and any(k in r.url for k in ('gemini', 'meta')) else None)
    page.goto(BASE, wait_until='load')
    page.wait_for_function("window.DSGame && typeof UI !== 'undefined' && ['gemini','meta'].every(id => SpriteGen.images[id] && Art.ready('abil:' + id) && Art.ready('fx2:' + id))", timeout=30000)
    page.wait_for_function("['gemini','meta'].every(id => SpriteGen.images[id].complete && SpriteGen.images[id].naturalWidth === 1280)", timeout=30000)
    face_assets = page.evaluate("""async ids => Promise.all(ids.map(id => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({id, ok: true, dimensions: [img.naturalWidth, img.naturalHeight]});
      img.onerror = () => resolve({id, ok: false});
      img.src = SpriteGen.faceUrl(id);
    })))""", ['gemini', 'meta'])

    result = page.evaluate("""() => {
      const ids = ['gemini', 'meta'];
      const fighters = ids.map(id => {
        const f = FIGHTERS.find(x => x.id === id);
        return {id, exists: !!f, secret: !!(f && f.secret), idleFrames: SpriteGen.count('idle', id), stats: f && f.stats,
          sprite: SpriteGen.images[id] && [SpriteGen.images[id].naturalWidth, SpriteGen.images[id].naturalHeight]};
      });
      const art = ids.map(id => ({id, abil: Art.ready('abil:' + id), fx: Art.ready('fx2:' + id),
        abilitySize: [Art.images['abil:' + id].naturalWidth, Art.images['abil:' + id].naturalHeight],
        effectSize: [Art.images['fx2:' + id].naturalWidth, Art.images['fx2:' + id].naturalHeight]}));
      const weatherOptions = Array.from(document.querySelectorAll('#opt-weather option')).map(x => x.value);
      const faceRequests = ids.map(id => ({id, url: SpriteGen.faceUrl(id)}));
      UI.show('fight');
      document.getElementById('stage-wrap').classList.add('on');
      const g = DSGame;
      g.start({teams: [['gemini'], ['meta']], stage: 'pos-codigocalipse', cpu: [false, false], weather: 'aurora'});
      g.running = false; g.roundState = 'fight';
      const gemini = g.activeOf(0), meta = g.activeOf(1);
      gemini.x = 340; meta.x = 640;
      const bursts = [];
      for (let row = 0; row < 5; row++) {
        const x = 170 + row * 150;
        g.spawnAbilityImpact(gemini, POWERS.gemini.powers[row], x, 240);
        g.spawnAbilityImpact(meta, POWERS.meta.powers[row], x, 305);
      }
      const visualBursts = g.bursts.slice(-10).map(b => ({key: b.key, row: b.row}));
      const shot = POWERS.gemini.powers[0];
      gemini.fire(shot);
      gemini.update(EMPTY_INPUT);
      const projectile = g.projectiles[g.projectiles.length - 1];
      const veil = POWERS.meta.powers[3];
      meta.fire(veil);
      HUD.reset(g); HUD.update(g);
      const hudFaces = Array.from(document.querySelectorAll('#hud .side .face')).map(el => el.style.backgroundImage);
      const statusText = Array.from(document.querySelectorAll('#hud .side[data-team="1"] .statuses span')).map(x => x.textContent);
      const auraBurst = g.bursts.slice(-1)[0];
      g.weather.update(false);
      const weatherNames = [
        {kind: 'aurora', particles: g.weather.drops.length},
      ];
      g.weather.set('heatwave');
      g.weather.update(false);
      weatherNames.push({kind: g.weather.kind, particles: g.weather.drops.length});
      const counts = {fighters: FIGHTERS.length, stages: STAGE_LIST.length};
      return {fighters, art, weatherOptions, faceRequests, hudFaces, total: counts, visualBursts,
        projectile: projectile && {key: projectile.key, row: projectile.row},
        veilActive: meta.has('veil'), auraBurst: auraBurst && {key: auraBurst.key, row: auraBurst.row},
        statusText, climates: weatherNames, fileIds: Object.keys(SpriteGen.images)};
    }""")

    result['faceAssets'] = face_assets
    page.wait_for_function('DSGame.stage && DSGame.stage.ready', timeout=20000)
    page.evaluate("DSGame.weather.set('aurora'); DSGame.weather.update(false); DSGame.render(1)")
    page.screenshot(path=str(OUT / 'v10-gemini-meta-aurora.png'))
    page.evaluate("DSGame.weather.set('heatwave'); DSGame.weather.update(false); DSGame.render(1)")
    page.screenshot(path=str(OUT / 'v10-gemini-meta-heatwave.png'))
    print(json.dumps({'result': result, 'pageErrors': errors, 'assetErrors': asset_errors}, ensure_ascii=False, indent=2), flush=True)

    assert result['fighters'] == [
        {'id': 'gemini', 'exists': True, 'secret': False, 'idleFrames': 4, 'stats': result['fighters'][0]['stats'], 'sprite': [1280, 2080]},
        {'id': 'meta', 'exists': True, 'secret': False, 'idleFrames': 4, 'stats': result['fighters'][1]['stats'], 'sprite': [1280, 2080]},
    ], 'fighter data or custom sprite sheets are missing'
    assert all(x['ok'] and x['dimensions'] == [160, 160] for x in face_assets), 'new roster face assets did not load at 160x160'
    assert all(x['url'] == f"assets/ui/face-{x['id']}.png?v=expansion-v10" for x in result['faceRequests']), 'SpriteGen did not version V10 faces'
    assert all(any(f'face-{fighter}.png?v=expansion-v10' in face for face in result['hudFaces']) for fighter in ('gemini', 'meta')), 'HUD faces did not use the V10 cache-bust'
    stack_stats = page.evaluate("FIGHTERS.find(x => x.id === 'stack').stats")
    assert all(f['stats'] == stack_stats for f in result['fighters']), 'new fighters are not balanced at the ET 1155 level'
    assert all(x['abil'] and x['fx'] and x['abilitySize'] == [512, 640] and x['effectSize'] == [512, 640] for x in result['art']), 'unique HUD/combat atlases did not load at 4x5'
    assert all(x in result['weatherOptions'] for x in ('aurora', 'heatwave')), 'new climates are missing from the stage selector'
    assert len(result['visualBursts']) == 10 and all(b['key'] in ('fx2:gemini', 'fx2:meta') and b['row'] in range(5) for b in result['visualBursts']), 'ability effects shared a generic sheet or row'
    assert result['projectile'] == {'key': 'fx2:gemini', 'row': 0}, 'Gemini projectile did not use its custom atlas'
    assert result['veilActive'] and result['auraBurst'] == {'key': 'fx2:meta', 'row': 3}, 'Meta veil did not fire with its own VFX'
    assert result['climates'][0]['kind'] == 'aurora' and result['climates'][0]['particles'] > 0
    assert result['climates'][1]['kind'] == 'heatwave' and result['climates'][1]['particles'] > 0
    assert not errors, errors
    assert not asset_errors, asset_errors
    browser.close()
print('V10 Canvas: Gemini + Meta, HUD, ten exclusive effects, Véu and two climates — PASS')
