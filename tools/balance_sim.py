"""Torneio CPU x CPU dos lutadores normais. Uso: python3 tools/balance_sim.py saida.json [jogos]"""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8133
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/balance.json'
GAMES = int(sys.argv[2]) if len(sys.argv) > 2 else 2
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 960, 'height': 540})
        pg.goto(f'http://localhost:{PORT}/index.html', wait_until='domcontentloaded')
        pg.wait_for_function('() => window.DSGame && typeof FIGHTERS !== "undefined"', timeout=60000)
        ids = pg.evaluate("""() => FIGHTERS.filter(f => !f.secret).map(f => f.id)""")
        names = pg.evaluate("""() => Object.fromEntries(FIGHTERS.map(f => [f.id, f.name]))""")
        print('roster', ids, flush=True)
        wins = {i: {j: 0 for j in ids} for i in ids}
        games = {i: {j: 0 for j in ids} for i in ids}
        n = 0
        for a in ids:
            for c in ids:
                if a == c:
                    continue
                for g in range(GAMES):
                    r = pg.evaluate("""([a, c]) => {
                      const g = DSGame;
                      const none = PETS.find(p => p.id === 'none') || PETS[0];
                      UI.show('fight');
                      document.getElementById('stage-wrap').classList.add('on');
                      g.start({ mode: 'versus', teams: [[a], [c]], stage: '03-laboratorio-95', cpu: [true, true], difficulty: 1, roundsToWin: 1, timer: 35, weather: 'clear', pets: [none, none] });
                      g.roundState = 'fight';
                      g.roundTimer = 35 * 60;
                      if (g.mech) g.mech.m = {};
                      if (g.weather) { g.weather.kind = 'clear'; g.weather.wind = 0; g.weather.windTarget = 0; }
                      let guard = 0;
                      while (g.running && guard < 4000) { g.tick(); guard++; }
                      const w = g.teamWins[0] === g.teamWins[1] ? -1 : (g.teamWins[0] > g.teamWins[1] ? 0 : 1);
                      const [f1, f2] = g.activePair();
                      return { w, hp: [Math.round(f1.hp), Math.round(f2.hp)], t: guard };
                    }""", [a, c])
                    games[a][c] += 1
                    if r['w'] == 0:
                        wins[a][c] += 1
                    elif r['w'] == 1:
                        wins[c][a] += 1
                    n += 1
                    if n % 10 == 0:
                        print(f'{n} {a} vs {c} -> {r}', flush=True)
        rate = {}
        for i in ids:
            played = sum(games[i][j] + games[j][i] for j in ids if j != i)
            # each ordered game is stored once in games[a][c]; wins[i][j] counts i beating j
            beat = sum(wins[i][j] for j in ids if j != i)
            faced = sum(games[i][j] + games[j][i] for j in ids if j != i)
            rate[i] = round(100 * beat / faced, 1) if faced else 0
        payload = {'names': names, 'ids': ids, 'wins': wins, 'games': games, 'rate': rate, 'gamesEachWay': GAMES}
        json.dump(payload, open(OUT, 'w'), indent=2)
        print('RATES', json.dumps(rate, ensure_ascii=False), flush=True)
        b.close()
finally:
    srv.terminate()
