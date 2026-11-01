/* ============================================================
   DS FIGHTERS — Inicialização e loop principal (60 Hz fixo).
   ============================================================ */
/* Pré-carrega as folhas principais com progresso real antes de liberar o título. */
function preloadAll() {
  const urls = new Set(Object.values(ART_SHEETS).map((s) => Art.url(s.src)));
  Object.keys((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {}).forEach((id) => urls.add(SpriteGen.url(id)));
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

  // Desktop permanece escalado; mobile usa menus e controles em pixels de tela.
  AppViewport.init();

  /* Simulação fixa a 60 passos/s (determinística, igual ao online) e
     renderização na taxa do monitor (120/144/240 Hz) com interpolação. */
  const STEP = 1000 / 60;
  let last = performance.now();
  let acc = 0;
  let lastDraw = 0;
  const fpsEl = document.getElementById('fps');
  let fpsFrames = 0;
  let fpsT = last;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min(100, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      Input.pollPads();
      UI.tick();
      game.capturePrev();
      game.tick();
      Net.frame(game);
      Input.endFrame();
      acc -= STEP;
      steps++;
    }
    if (steps >= 5) acc = 0;
    const cap = Number(Profile.data.settings.fpsCap) || 0;
    if (!cap || now - lastDraw >= 1000 / cap - 1) {
      lastDraw = now;
      if (game.stage) game.render(Math.max(0, Math.min(1, acc / STEP)));
      fpsFrames++;
    }
    if (now - fpsT >= 500) {
      if (fpsEl) {
        fpsEl.textContent = Math.round((fpsFrames * 1000) / (now - fpsT)) + ' FPS';
        fpsEl.hidden = !Profile.data.settings.showFps;
      }
      fpsFrames = 0;
      fpsT = now;
    }
  }
  requestAnimationFrame(frame);
})();
