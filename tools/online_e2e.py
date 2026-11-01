"""Teste ponta a ponta do online com navegadores reais.
Uso: python3 tools/online_e2e.py [ws|p2p] [2|4]
  ws  = servidor dedicado (sobe online-server/ local na porta 8787)
  p2p = WebRTC direto entre navegadores (precisa de internet p/ o broker PeerJS)
  4   = sala 2x2 com 4 jogadores (troca + assist)
"""
import os, shutil, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/home/ubuntu/work/shots'
TRANSPORT = sys.argv[1] if len(sys.argv) > 1 else 'ws'
NP = int(sys.argv[2]) if len(sys.argv) > 2 else 2
os.makedirs(OUT, exist_ok=True)
web = subprocess.Popen([sys.executable, '-m', 'http.server', '8097'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
srv = None
if TRANSPORT == 'ws':
    srv = subprocess.Popen(['node', 'server.js'], cwd=os.path.join(ROOT, 'online-server'), env=dict(os.environ, PORT='8787'), stdout=subprocess.DEVNULL)
time.sleep(1.0)
errs = []
tag = f'{TRANSPORT}-{NP}p'
try:
    with sync_playwright() as p:
        executable = shutil.which('chromium') or shutil.which('google-chrome')
        b = p.chromium.launch(**({'executable_path': executable} if executable else {}))
        pages = []
        names = ['Host', 'Guest', 'Ana', 'Beto'][:NP]
        for name in names:
            pg = b.new_context(viewport={'width': 960, 'height': 540}).new_page()
            pg.on('pageerror', lambda e, n=name: errs.append(n + ': ' + str(e)))
            pg.goto('http://localhost:8097/index.html')
            pg.wait_for_function("typeof UI === 'object' && UI.screen", timeout=30000)
            pg.wait_for_timeout(800)
            pg.keyboard.press('Enter')
            pg.wait_for_timeout(300)
            pg.evaluate("UI.show('online')")
            pg.select_option('#net-transport', TRANSPORT)
            if TRANSPORT == 'ws':
                pg.fill('#net-url', 'ws://localhost:8787')
            pg.fill('#net-name', name)
            pages.append(pg)
        h = pages[0]
        h.select_option('#net-mode', '2x2-4' if NP == 4 else '1v1')
        h.click('#net-create')
        h.wait_for_function("Net.room && Net.room.code", timeout=20000)
        code = h.evaluate("Net.room.code")
        print(tag, 'sala', code, flush=True)
        for g in pages[1:]:
            g.fill('#net-code', code)
            g.click('#net-join')
            g.wait_for_function("Net.room && Net.room.code", timeout=20000)
        for pg in pages:
            pg.wait_for_function(f"Net.room && Net.room.players.length === {NP}", timeout=20000)
        slots = [pg.evaluate("Net.myPlayer().slot") for pg in pages]
        print(tag, 'slots', slots, flush=True)
        assert h.evaluate('Net.room.config.timer===180'), 'tempo padrão online não é 180s'
        h.select_option('#lobby-timer', '300')
        for pg in pages:
            pg.wait_for_function('Net.room.config.timer===300', timeout=10000)
        h.select_option('#lobby-stage', 'cyberpunk')
        for pg in pages:
            pg.wait_for_function("Net.room.stage==='cyberpunk'", timeout=10000)
        h.screenshot(path=f'{OUT}/20-lobby-{tag}.png')
        picks = ['thl', 'dolynho', 'kotlin', 'hacker']
        for pg, f in zip(pages, picks):
            pg.evaluate(f"Net.pickFighters(['{f}'])")
        for pg in pages:
            pg.wait_for_function("Net.room.players.every(p => p.picks.length)", timeout=10000)
        pages[1].fill('#chat-text', 'boa sorte!')
        pages[1].click('#chat-send')
        h.wait_for_function("document.getElementById('chat-log').textContent.includes('boa sorte')", timeout=5000)
        print(tag, 'chat ok', flush=True)
        for pg in pages:
            pg.click('#lobby-ready')
        h.wait_for_function("DSGame.running && DSGame.mode === 'online' && DSGame.roundState === 'fight'", timeout=20000)
        for g in pages[1:]:
            g.wait_for_function("DSGame.running && DSGame.netRole === 'guest'", timeout=20000)
        print(tag, 'roles', [pg.evaluate("DSGame.netRole") for pg in pages], flush=True)
        assert all(pg.evaluate('DSGame.cfg.timer===300') for pg in pages), 'tempo da sala não chegou aos motores'
        assert h.evaluate("DSGame.teams[0].members[0].def.id==='thl' && DSGame.teams[0].members[0].maxHp===280")
        ctrl = pages[slots.index(2)]
        x0 = h.evaluate("DSGame.activeOf(1).x")
        ctrl.keyboard.down('ArrowLeft'); ctrl.wait_for_timeout(700); ctrl.keyboard.up('ArrowLeft')
        x1 = h.evaluate("DSGame.activeOf(1).x")
        print(tag, 'convidado anda no anfitrião:', round(x0), '->', round(x1), flush=True)
        assert x1 < x0 - 20, 'entrada do convidado não moveu o lutador no anfitrião'
        for _ in range(5):
            ctrl.keyboard.press('KeyA'); ctrl.wait_for_timeout(110)
        if NP == 4:
            bench = pages[slots.index(3)]
            before = h.evaluate("DSGame.activeOf(1).def.id")
            ctrl.wait_for_timeout(700)
            for _ in range(3):
                bench.keyboard.press('KeyR'); bench.wait_for_timeout(200)
            h.wait_for_timeout(1200)
            after = h.evaluate("DSGame.activeOf(1).def.id")
            print(tag, 'troca pela reserva:', before, '->', after, flush=True)
            assert before != after, 'a reserva não conseguiu entrar'
            h.wait_for_timeout(600)
            x0 = h.evaluate("DSGame.activeOf(1).x")
            bench.keyboard.down('ArrowRight'); bench.wait_for_timeout(600); bench.keyboard.up('ArrowRight')
            x1 = h.evaluate("DSGame.activeOf(1).x")
            print(tag, 'nova titular anda:', round(x0), '->', round(x1), flush=True)
            assert abs(x1 - x0) > 15, 'o jogador que entrou não controla o lutador'
        ctrl.wait_for_timeout(500)
        hp_h = h.evaluate("[DSGame.activeOf(0).hp, DSGame.activeOf(1).hp].map(Math.round)")
        hp_g = pages[1].evaluate("[DSGame.activeOf(0).hp, DSGame.activeOf(1).hp].map(Math.round)")
        print(tag, 'hp anfitrião', hp_h, 'hp visão convidado', hp_g, 'ping', pages[1].evaluate("Net.ping"), flush=True)
        pages[1].screenshot(path=f'{OUT}/21-online-guest-{tag}.png')
        h.screenshot(path=f'{OUT}/22-online-host-{tag}.png')
        if TRANSPORT == 'ws':
            h.evaluate("""() => {
              DSGame.round=2; DSGame.teamWins=[1,0]; DSGame.activeOf(0).hp=77;
              window.__resumeFighter=DSGame.activeOf(0); window.__oldSocket=Net.socket;
              Net.socket.close();
            }""")
            h.wait_for_function("Net.socket && Net.socket!==__oldSocket && Net.status==='open' && !DSGame.paused", timeout=20000)
            assert h.evaluate("DSGame.round===2 && DSGame.teamWins[0]===1 && DSGame.activeOf(0)===__resumeFighter"), 'resume do host reiniciou a simulação'
            pages[1].wait_for_function('DSGame.round===2 && DSGame.teamWins[0]===1', timeout=10000)
            print(tag, 'reconexão do host preserva round/placar/instância', flush=True)
        h.evaluate("""(() => { const g = DSGame; for (let r = 0; r < 2; r++) {
            for (let k = 0; k < 900 && g.running && g.roundState !== 'fight'; k++) g.tick();
            for (let k = 0; k < 900 && g.running && g.roundState === 'fight'; k++) { g.teams[1].members.forEach((m) => { if (m.alive && !m.benched) { m.hp = 1; m.takeHit(50, { attacker: g.activeOf(0) }); } }); g.tick(); }
          } })()""")
        for g in pages[1:]:
            g.wait_for_function("document.body.dataset.screen === 'results' || !DSGame.running", timeout=30000)
        pages[1].wait_for_timeout(1200)
        print(tag, 'placar convidado', pages[1].evaluate("Net.score"), 'tela', pages[1].evaluate("document.body.dataset.screen"), flush=True)
        pages[1].screenshot(path=f'{OUT}/23-online-result-{tag}.png')
        b.close()
finally:
    if srv:
        srv.terminate()
    web.terminate()
print(tag, 'ERROS', errs[:10])
