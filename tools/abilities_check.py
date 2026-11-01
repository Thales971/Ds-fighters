"""Captura habilidades dos 5 lutadores novos + efeitos de tela (cegueira/choque)."""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/home/ubuntu/work/shots'
web = subprocess.Popen([sys.executable, '-m', 'http.server', '8098'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errs = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 960, 'height': 540})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8098/index.html')
        pg.wait_for_function("typeof UI === 'object' && UI.screen", timeout=30000)
        pg.wait_for_timeout(1500)
        pairs = [('kotlin', 'hacker', 'kotlin'), ('java', 'merc', 'java'), ('bhm', 'du', 'chrome'), ('hacker', 'felipinho', 'kali'), ('merc', 'iales', 'spring')]
        for a, bb, st in pairs:
            for i in range(5):
                pg.evaluate("""([a, b, st, i]) => { const g = DSGame; UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
                  g.start({ mode: 'versus', teams: [[a], [b]], stage: st, cpu: [false, false], roundsToWin: 2, timer: 99, weather: 'clear' });
                  for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();
                  const [f, o] = g.activePair(); f.x = 330; o.x = 620; f.charge = [100, 100]; f.ultimate = 100; f.cd = [0,0,0,0,0];
                  window.__c = f.tryCast(i); for (let k = 0; k < 22; k++) g.tick(); }""", [a, bb, st, i])
                pg.wait_for_timeout(120)
                ok = pg.evaluate("window.__c")
                ents = pg.evaluate("DSGame.projectiles.length + DSGame.strikes.length + DSGame.zones.length")
                if i in (2, 4):
                    pg.screenshot(path=f'{OUT}/30-{a}-{i}.png')
                pg.evaluate("for (let k = 0; k < 60; k++) DSGame.tick()")
                st_o = pg.evaluate("Object.keys(DSGame.activeOf(1).status || {}).filter(k => DSGame.activeOf(1).left(k) > 0).join(',')")
                print(a, 'H' + str(i + 1), 'cast', ok, 'ents', ents, 'status rival:', st_o, 'hp rival', round(pg.evaluate('DSGame.activeOf(1).hp')), flush=True)
        # efeitos de tela no jogador local (P1): cegueira e choque
        pg.evaluate("""() => { const g = DSGame; g.start({ mode: 'versus', teams: [['stack'], ['hacker']], stage: 'kali', cpu: [false, true], roundsToWin: 2, timer: 99, weather: 'clear' });
           for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick(); g.activeOf(0).addStatus('blind', 300); g.activeOf(0).addStatus('shock', 300); for (let k = 0; k < 10; k++) g.tick(); g.render && g.render(1); }""")
        pg.wait_for_timeout(500)
        print('blinded', pg.evaluate("document.getElementById('game').classList.contains('blinded')"), 'shocked', pg.evaluate("document.body.classList.contains('shocked')"))
        pg.screenshot(path=f'{OUT}/31-blind-shock.png')
        b.close()
finally:
    web.terminate()
print('ERROS', errs[:10])
