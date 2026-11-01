"""Captura cenas de luta para revisão visual.

Uso: python3 tools/shot.py a:b:stage[:habilidade[:ticks]] ...
  habilidade = 0..4 (H1..ULT) ou 'x' para nenhuma. Prints em /home/ubuntu/work/shots/shot-*.png
"""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/home/ubuntu/work/shots'
os.makedirs(OUT, exist_ok=True)
port = 8100 + (os.getpid() % 300)
web = subprocess.Popen([sys.executable, '-m', 'http.server', str(port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errs = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://localhost:{port}/index.html')
        pg.wait_for_function("typeof UI === 'object' && UI.screen", timeout=40000)
        pg.wait_for_timeout(1200)
        for spec in sys.argv[1:]:
            parts = spec.split(':') + ['x', '24']
            a, bb, st, ab, ticks = parts[0], parts[1], parts[2], parts[3], int(parts[4] if len(parts) > 4 and parts[4] != 'x' else 24)
            pg.evaluate("""([a, b, st, ab, ticks]) => { const g = DSGame; UI.show('fight'); document.getElementById('stage-wrap').classList.add('on');
              if (window.Profile && Profile.unlockAll) Profile.unlockAll();
              g.start({ mode: 'versus', teams: [[a], [b]], stage: st, cpu: [false, false], roundsToWin: 2, timer: 99, weather: 'clear' });
              for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();
              const [f, o] = g.activePair(); f.x = 420; o.x = 760; f.charge = [100, 100]; f.ultimate = 100; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.afo = 6;
              if (ab !== 'x') f.tryCast(+ab);
              for (let k = 0; k < ticks; k++) g.tick(); }""", [a, bb, st, ab, ticks])
            pg.wait_for_timeout(250)
            name = f"{OUT}/shot-{a}-{bb}-{st}-{ab}.png"
            pg.screenshot(path=name)
            print('ok', name, flush=True)
        b.close()
finally:
    web.terminate()
print('ERROS', errs[:10])
