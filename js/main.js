/* ============================================================
   DS FIGHTERS — Inicialização e loop principal (60 Hz fixo).
   ============================================================ */
/* Pré-carrega as folhas principais com progresso real antes de liberar o título. */
/* Lista COMPLETA do que precisa estar em cache antes de liberar o jogo:
   sprites dos lutadores, atlas de habilidades/fx/fauna/pets, mapas e camadas
   de TODAS as arenas, props, torcida e sprites de clima. Antes eles carregavam
   na hora da luta (mapa/personagem faltando ao entrar) — agora o loader segura
   ate 100% para o jogo entrar pronto. */
function buildPreloadUrls() {
  const urls = new Set();
  Object.values(ART_SHEETS).forEach((s) => urls.add(Art.url(s.src)));
  Object.keys((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {}).forEach((id) => urls.add(SpriteGen.url(id)));
  /* mapas (jpg ou spritesheet) + camadas parallax de todas as arenas */
  (typeof STAGE_LIST !== 'undefined' ? STAGE_LIST : []).forEach((s) => {
    if (s.image) urls.add(s.image);
    if (s.sheet) urls.add(s.sheet);
    (s.layers || []).forEach((l) => urls.add(String(l.src) + (String(l.src).indexOf('?') >= 0 ? '' : '?v=v36-amb1')));
  });
  urls.add('assets/fx/stage-props.png?v=v36-amb1');
  urls.add('assets/fx/rain-streaks.png?v=v36-amb1');
  urls.add('assets/fx/mare.png?v=v47-maresprites');
  urls.add('assets/fauna/torcida.png?v=v47-maresprites');
  urls.add('assets/weather/petals.png?v=v36-balance13');
  urls.add('assets/weather/neon.png?v=v36-balance13');
  urls.add('assets/weather/snowflakes.png?v=v33-weather');
  urls.add('assets/weather/leaf.png?v=v33-weather');
  urls.add('assets/weather/spark.png?v=v33-weather');
  urls.add('assets/pets/pitoco.png?v=v47-maresprites');
  return [...urls];
}

/* Texto do HUD de rede na luta (opcao "Mostrar ping e rede na luta"). */
function netHudText() {
  const N = typeof Net !== 'undefined' ? Net : null;
  const g = window.DSGame;
  if (!g || g.mode !== 'online' || !N || !N.room) return '🌐 offline · partida local';
  const ping = N.ping > 0 ? Math.round(N.ping) + ' ms' : 'medindo…';
  const code = (N.room && N.room.code) || '—';
  const role = (typeof N.isHost === 'function' && N.isHost()) ? 'anfitrião' : 'convidado';
  const tr = N.transport === 'ws' ? 'WS' : 'P2P';
  const pl = (N.room.players && N.room.players.length) || (N.room.config && N.room.config.players) || 1;
  return '🌐 ' + ping + ' · sala ' + code + ' · ' + tr + ' · ' + role + ' · ' + pl + ' jog.';
}

/* Pré-carrega TUDO com progresso real antes de liberar o título. Se algum
   arquivo falhar, mostra retry — o jogo NAO entra com asset faltando. */
function preloadAll() {
  const list = buildPreloadUrls();
  const fill = document.getElementById('ld-fill');
  const text = document.getElementById('ld-text');
  const retry = document.getElementById('ld-retry');
  const box = document.getElementById('loader');
  let done = 0; const failed = [];
  const step = () => {
    const pct = Math.round((done / list.length) * 100);
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = 'Carregando ' + done + '/' + list.length + ' assets (' + pct + '%)';
    if (done < list.length) return;
    if (failed.length) {
      if (text) text.textContent = 'Falha ao carregar ' + failed.length + ' arquivo(s) — ' + String(failed[0]).split('?')[0] + '. Verifique a conexão.';
      if (retry) { retry.hidden = false; retry.onclick = () => location.reload(); }
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
  // Selo de build: mostra o MESMO token que o motor usa pra pedir as folhas.
  // Se o aparelho estiver com arquivo velho em cache, o selo entrega na hora.
  const buildEl = document.getElementById('build');
  if (buildEl) {
    const token = (SpriteGen.url('du').split('?v=')[1] || '?');
    buildEl.textContent = 'build ' + token;
  }
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
      /* HUD de ping/rede na luta (opcao showNet) */
      const netEl = document.getElementById('net-hud');
      if (netEl) {
        const show = !!(Profile.data && Profile.data.settings && Profile.data.settings.showNet) && UI.screen === 'fight';
        netEl.hidden = !show;
        if (show) netEl.textContent = netHudText();
      }
      fpsFrames = 0;
      fpsT = now;
    }
  }
  requestAnimationFrame(frame);
})();
