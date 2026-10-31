/* ============================================================
   DS FIGHTERS — Bootstrap + loop principal.
   ============================================================ */

(function () {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);

  // ajusta o canvas mantendo proporção 16:9
  function fit() {
    const scale = Math.min(window.innerWidth / game.W, window.innerHeight / game.H);
    canvas.style.width = (game.W * scale) + 'px';
    canvas.style.height = (game.H * scale) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  Input.init();

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
