/* ============================================================
   DS FIGHTERS — Inicialização e loop principal (60 Hz fixo).
   ============================================================ */
/* Pré-carrega as folhas principais com progresso real antes de liberar o título. */
function preloadAll() {
  const urls = new Set(Object.values(ART_SHEETS).map((s) => s.src));
  Object.values((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {}).forEach((u) => urls.add(u));
  const list = [...urls];
  const fill = document.getElementById('ld-fill');
  const text = document.getElementById('ld-text');
  const retry = document.getElementById('ld-retry');
  const box = document.getElementById('loader');
  let done = 0; const failed = [];
  const step = () => {
    const pct = Math.round((done / list.length) * 100);
    fill.style.width = pct + '%';
    text.textContent = 'Carregando sprites… ' + pct + '%';
    if (done < list.length) return;
    if (failed.length) {
      text.textContent = 'Falha ao carregar ' + failed.length + ' arquivo(s). Verifique a conexão.';
      retry.hidden = false;
      retry.onclick = () => location.reload();
    } else {
      box.classList.add('done');
      setTimeout(() => box.remove(), 400);
    }
  };
  list.forEach((u) => { const i = new Image(); i.onload = () => { done++; step(); }; i.onerror = () => { done++; failed.push(u); step(); }; i.src = u; });
  step();
}

(function boot() {
  preloadAll();
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
