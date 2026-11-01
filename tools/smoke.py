"""Teste de fumaça do DS Fighters no Chromium headless.
Uso: python3 tools/smoke.py [porta]
- abre o jogo, passa pelo título/menu
- roda lutas CPU x CPU em todos os mapas
- força as 5 habilidades de cada lutador (incluindo roubo do IALES)
- tira screenshots em /home/ubuntu/work/shots
"""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/home/ubuntu/work/shots'
os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 960, 'height': 540})
        pg.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        pg.goto(f'http://localhost:{PORT}/index.html')
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}/01-title.png')
        pg.keyboard.press('Enter')
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}/02-menu.png')
        # desbloqueio
        pg.evaluate("Profile.redeem('Batata')")
        pg.evaluate("UI.startFlow('versus')")
        pg.wait_for_timeout(500)
        pg.keyboard.press('ArrowRight')
        pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/03-select.png')
        pg.keyboard.press('KeyA')
        pg.wait_for_timeout(300)
        pg.keyboard.press('ArrowRight')
        pg.keyboard.press('KeyA')
        pg.wait_for_timeout(800)
        pg.screenshot(path=f'{OUT}/04-stage.png')
        # lutas em todos os mapas com todos os poderes
        n = pg.evaluate("STAGE_LIST.length")
        for si in range(n):
            r = pg.evaluate("""(s) => {
          const g = window.DSGame;
          const ids = FIGHTERS.map(f => f.id);
          const step = (n) => { for (let k = 0; k < n; k++) { g.tick(); if (k % 5 === 0) g.render(); } };
          const a = ids[s % ids.length], b = ids[(s + 5) % ids.length];
          UI.show('fight');
          document.getElementById('stage-wrap').classList.add('on');
          g.start({ mode: 'versus', teams: [[a], [b]], stage: STAGE_LIST[s].id, cpu: [true, true], difficulty: 1.5, roundsToWin: 2, timer: 99, pets: [PETS[1], PETS[s % PETS.length]] });
          step(130);
          const [f1, f2] = g.activePair();
          for (let i = 0; i < 5; i++) {
            for (const f of [f1, f2]) { f.charge = [100, 100]; f.ultimate = 100; f.cd = [0,0,0,0,0]; if (f.canAct()) f.tryCast(i); }
            step(150);
            if (!g.running) break;
          }
          step(300);
          return STAGE_LIST[s].id + ' ' + a + ' x ' + b + ' hp ' + Math.round(f1.hp) + '/' + Math.round(f2.hp) + ' w=' + g.weather.kind + ' st=' + g.roundState + ' ents=' + (g.projectiles.length + g.strikes.length + g.zones.length);
        }""", si)
            print(r, flush=True)
        # tela de luta específica com IALES roubando
        pg.evaluate("""() => { const g = DSGame; UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
          g.start({ mode: 'versus', teams: [['iales'], ['du']], stage: 'spring', cpu: [true, true], roundsToWin: 2, timer: 99, pets: [PETS[1], PETS[0]] });
          for (let k = 0; k < 600 && g.roundState !== 'fight'; k++) g.tick();
          g.cfg.cpu = [false, false];
          for (let k = 0; k < 30; k++) g.tick();
          const [a, b] = g.activePair(); a.charge = [100, 100]; a.ultimate = 100; window.__cast = a.tryCast(2);
          for (let k = 0; k < 40; k++) g.tick(); }""")
        print('steal cast', pg.evaluate("window.__cast"))
        pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/05-steal.png')
        info = pg.evaluate("(() => { const [a,b] = DSGame.activePair(); return { stolen: !!a.stolen, from: a.stolen && a.stolen.from, locked: b.has('locked') }; })()")
        print('steal', info)
        pg.evaluate("""() => { const g = DSGame; const [a] = g.activePair(); a.ultimate = 100; a.stolen = null; a.tryCast(4); for (let k = 0; k < 30; k++) g.tick(); }""")
        pg.wait_for_timeout(200)
        pg.screenshot(path=f'{OUT}/06-ult.png')
        pg.evaluate("""() => { const g = DSGame; g.cfg.cpu=[true,true]; for (let k = 0; k < 200; k++) g.tick(); }""")
        pg.wait_for_timeout(200)
        pg.screenshot(path=f'{OUT}/07-fight.png')
        # 2x2 + troca
        pg.evaluate("""() => { const g = DSGame; g.start({ mode: 'tag', teams: [['felipinho','stack'], ['du','qa']], stage: 'kernel', cpu: [true, true], roundsToWin: 2, timer: 99, weather: 'snow' });
          for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick(); g.cfg.cpu = [false, false]; for (let k = 0; k < 40; k++) g.tick(); g.tryTag(0); for (let k = 0; k < 60; k++) g.tick(); }""")
        pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/08-tag.png')
        print('tag active', pg.evaluate("DSGame.activeOf(0).def.id"))
        pg.evaluate("""() => { const g = DSGame; g.start({ mode: 'versus', teams: [['devops'], ['scrum']], stage: '04-storm-temple', cpu: [true, true], roundsToWin: 2, timer: 99, weather: 'storm' }); for (let k = 0; k < 500; k++) g.tick(); }""")
        pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/09-storm.png')
        for scr in ['custom', 'redeem', 'moves', 'options', 'online']:
            pg.evaluate(f"DSGame.stop(); HUD.hide(); UI.show('{scr}')")
            pg.wait_for_timeout(500)
            pg.screenshot(path=f'{OUT}/10-{scr}.png')
        pg.evaluate("UI.flow = {mode:'arcade',picks:[[1],[]],need:1,arcadeStep:0}; UI.buildArcade(); UI.onMatchEnd({winner:0,wins:[2,1],teams:[[{id:'iales',name:'IALES',dmg:120,combo:7,hits:30}],[{id:'du',name:'DU',dmg:80,combo:4,hits:20}]],mode:'arcade'}, DSGame)")
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}/11-results.png')
        b.close()
finally:
    srv.terminate()
print('ERRORS', len(errors))
seen = set()
for e in errors:
    if e in seen: continue
    seen.add(e)
    print(e[:400])
