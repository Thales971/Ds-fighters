/* ============================================================
   DS FIGHTERS — Inicialização e loop principal (60 Hz fixo).
   ============================================================ */
(function boot() {
  const canvas = document.getElementById('game');
  SpriteGen.load();
  Art.load();
  if (typeof Fx !== 'undefined' && Fx.load) Fx.load();
  Input.init();
  const game = new Game(canvas);
  window.DSGame = game;
  UI.init(game);

  // áudio só começa depois de um gesto do jogador
  const unlock = () => { AudioSys.ensure(); };
  window.addEventListener('pointerdown', unlock, { once: false, passive: true });
  window.addEventListener('keydown', unlock, { once: false });

  // escala da arena: ocupa a janela mantendo 16:9 e pixels nítidos
  const fit = () => {
    const app = document.getElementById('app');
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    app.style.setProperty('--scale', s.toFixed(4));
  };
  window.addEventListener('resize', fit);
  fit();

  const STEP = 1000 / 60;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      Input.pollPads();
      UI.tick();
      game.tick();
      Net.frame(game);
      Input.endFrame();
      acc -= STEP;
      steps++;
    }
    if (steps >= 4) acc = 0;
    if (game.stage) game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
