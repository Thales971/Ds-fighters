"""Mede se os níveis de IA são realmente diferentes: CPU nível A x CPU nível B."""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
web = subprocess.Popen([sys.executable, '-m', 'http.server', '8099'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 960, 'height': 540})
        pg.goto('http://localhost:8099/index.html')
        pg.wait_for_function("typeof UI === 'object' && UI.screen", timeout=30000)
        pg.wait_for_timeout(1200)
        for la, lb in [(3, 0), (2, 1), (1, 0), (3, 2)]:
            res = pg.evaluate("""([la, lb]) => {
              const g = DSGame; const ids = ['stack', 'qa', 'backend', 'frontend', 'kotlin', 'java', 'devops', 'gitmaster'];
              let wa = 0, wb = 0, hits = [0, 0];
              for (let m = 0; m < 16; m++) {
                const a = ids[m % ids.length], b = ids[(m + 3) % ids.length];
                g.start({ mode: 'versus', teams: m % 2 ? [[b], [a]] : [[a], [b]], stage: '05-fight-exe', cpu: [true, true], roundsToWin: 1, timer: 60, weather: 'clear' });
                g.audio && (g.audio.muted = true);
                const sideA = m % 2 ? 1 : 0;
                g.inputFor = function (ti) { const f = this.activeOf(ti), o = this.activeOf(1 - ti); return AI.think(f, o, ti === sideA ? la : lb); };
                for (let k = 0; k < 60 * 75 && g.running && g.roundState !== 'over' && !g.matchOver; k++) g.tick();
                const fa = g.activeOf(sideA), fb = g.activeOf(1 - sideA);
                if (fa.hp > fb.hp) wa++; else if (fb.hp > fa.hp) wb++;
              }
              g.stop && g.stop();
              return [wa, wb];
            }""", [la, lb])
            print(f'nível {la} x nível {lb}: vitórias {res[0]} x {res[1]}', flush=True)
        b.close()
finally:
    web.terminate()
