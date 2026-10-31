/* ============================================================
   DS FIGHTERS — Bootstrap + loop principal.
   ============================================================ */

(function () {
  window.__dsErrors = [];
  window.addEventListener('error', (e) => { window.__dsErrors.push(String(e.message || e.error || 'erro')); });
  window.addEventListener('unhandledrejection', (e) => { window.__dsErrors.push(String(e.reason || 'promise')); });

  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  window.__ds = game;

  // ajusta o canvas mantendo proporção 16:9
  function fit() {
    const scale = Math.min(window.innerWidth / game.W, window.innerHeight / game.H);
    canvas.style.width = (game.W * scale) + 'px';
    canvas.style.height = (game.H * scale) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  Input.init();
  bootFromHash(game);

  function bootFromHash(game) {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const [route, query] = raw.split('?');
    const q = new URLSearchParams(query || '');
    const num = (key, fallback, max) => {
      const n = parseInt(q.get(key) ?? '', 10);
      if (Number.isNaN(n)) return fallback;
      return Math.max(0, Math.min(max, n));
    };
    if (route === 'select') {
      game.screen = 'select';
      game.mode = 'versus';
      game.selIdx = [0, 1];
      game.selConfirmed = [false, false];
      return;
    }
    if (route === 'demo' || route === 'luta') {
      game.mode = q.get('vs') === '1' ? 'versus' : 'demo';
      game.selIdx = [num('p1', 0, FIGHTERS.length - 1), num('p2', 7, FIGHTERS.length - 1)];
      if (game.selIdx[0] === game.selIdx[1]) game.selIdx[1] = (game.selIdx[0] + 1) % FIGHTERS.length;
      game.stageIdx = num('stage', 5, STAGES.length - 1);
      game.difficulty = Math.max(0.6, parseFloat(q.get('diff') || '1.2') || 1.2);
      game.startFight();
      if (q.get('vscreen') !== '1') {
        game.screen = 'fight';
        game.roundState = 'fight';
        game.roundStateTime = 40;
        game.message = null;
      }
    }
  }

  // desbloqueia áudio no primeiro gesto do usuário
  const unlock = () => { game.audio.ensure(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    // passo fixo de 60fps: acumula tempo e roda updates por frame lógico
    acc += dt;
    while (acc >= 1000 / 60) {
      game.update();
      Input.endFrame();
      acc -= 1000 / 60;
    }
    game.draw();
    requestAnimationFrame(loop);
  }
  let acc = 0;
  requestAnimationFrame(loop);
})();
