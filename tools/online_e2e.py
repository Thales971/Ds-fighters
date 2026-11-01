"""Teste ponta a ponta do online: servidor real + 2 navegadores.
Uso: python3 tools/online_e2e.py
"""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/home/ubuntu/work/shots'
web = subprocess.Popen([sys.executable, '-m', 'http.server', '8097'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
srv = subprocess.Popen(['node', 'server.js'], cwd=os.path.join(ROOT, 'online-server'), env=dict(os.environ, PORT='8787'), stdout=subprocess.DEVNULL)
time.sleep(1.0)
errs = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pages = []
        for name in ['Host', 'Guest']:
            pg = b.new_context(viewport={'width': 960, 'height': 540}).new_page()
            pg.on('pageerror', lambda e, n=name: errs.append(n + ': ' + str(e)))
            pg.goto('http://localhost:8097/index.html')
            pg.wait_for_timeout(1200)
            pg.keyboard.press('Enter')
            pg.wait_for_timeout(400)
            pg.evaluate("UI.show('online')")
            pg.fill('#net-name', name)
            pages.append(pg)
        h, g = pages
        h.click('#net-create')
        h.wait_for_function("Net.room && Net.room.code")
        code = h.evaluate("Net.room.code")
        print('sala', code)
        g.fill('#net-code', code)
        g.click('#net-join')
        g.wait_for_function("Net.room && Net.room.players.length === 2")
        h.wait_for_function("Net.room && Net.room.players.length === 2")
        h.screenshot(path=f'{OUT}/20-lobby.png')
        h.evaluate("Net.pickFighters(['stack'])")
        g.evaluate("Net.pickFighters(['qa'])")
        h.wait_for_function("Net.room.players.every(p => p.picks.length)")
        g.wait_for_function("Net.room.players.every(p => p.picks.length)")
        h.click('#lobby-ready'); g.click('#lobby-ready')
        h.wait_for_function("DSGame.running && DSGame.mode === 'online' && DSGame.roundState === 'fight'", timeout=15000)
        g.wait_for_function("DSGame.running && DSGame.netRole === 'guest'", timeout=15000)
        print('roles', h.evaluate("DSGame.netRole"), g.evaluate("DSGame.netRole"))
        # guest anda para a esquerda: posição no anfitrião deve mudar
        x0 = h.evaluate("DSGame.activeOf(1).x")
        g.keyboard.down('ArrowLeft'); g.wait_for_timeout(700); g.keyboard.up('ArrowLeft')
        x1 = h.evaluate("DSGame.activeOf(1).x")
        gx = g.evaluate("DSGame.activeOf(1).x")
        print('guest walk on host:', round(x0), '->', round(x1), '| guest view x', round(gx))
        assert x1 < x0 - 20, 'entrada do convidado não moveu o lutador no anfitrião'
        # guest dá golpes
        for _ in range(6):
            g.keyboard.press('KeyA'); g.wait_for_timeout(120)
        h.keyboard.down('ArrowRight'); h.wait_for_timeout(500); h.keyboard.up('ArrowRight')
        g.wait_for_timeout(500)
        hp_h = h.evaluate("[DSGame.activeOf(0).hp, DSGame.activeOf(1).hp]")
        hp_g = g.evaluate("[DSGame.activeOf(0).hp, DSGame.activeOf(1).hp]")
        print('hp host', hp_h, 'hp guest view', hp_g)
        g.screenshot(path=f'{OUT}/21-online-guest.png')
        h.screenshot(path=f'{OUT}/22-online-host.png')
        # anfitrião força KO para encerrar
        h.evaluate("(() => { const g = DSGame; for (let r = 0; r < 2; r++) { g.activeOf(1).hp = 1; g.activeOf(1).takeHit(50, { attacker: g.activeOf(0) }); for (let k = 0; k < 600 && g.running && g.roundState !== 'fight'; k++) g.tick(); for (let k = 0; k < 400 && g.running && g.roundState !== 'intro'; k++) g.tick(); for (let k=0;k<200 && g.running && g.roundState!=='fight';k++) g.tick(); } })()")
        g.wait_for_function("document.body.dataset.screen === 'results' || !DSGame.running", timeout=20000)
        g.wait_for_timeout(1500)
        print('placar guest', g.evaluate("Net.score"), 'tela', g.evaluate("document.body.dataset.screen"))
        g.screenshot(path=f'{OUT}/23-online-result.png')
        b.close()
finally:
    srv.terminate(); web.terminate()
print('ERROS', errs[:10])
