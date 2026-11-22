/* ============================================================
   DS FIGHTERS — Inicialização e loop principal (60 Hz fixo).
   ============================================================ */
/* Pré-carrega as folhas principais com progresso real antes de liberar o título. */
/* Lista COMPLETA do que precisa estar em cache antes de liberar o jogo:
   sprites dos lutadores, atlas de habilidades/fx/fauna/pets, mapas e camadas
   de TODAS as arenas, torcida e sprites de clima. Antes eles carregavam
   na hora da luta (mapa/personagem faltando ao entrar) — agora o loader segura
   ate 100% para o jogo entrar pronto. */
function buildPreloadUrls() {
  const urls = new Set();
  Object.values(ART_SHEETS).forEach((s) => urls.add(Art.url(s.src, s.v)));
  Object.keys((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {}).forEach((id) => urls.add(SpriteGen.url(id)));
  /* mapas (jpg ou spritesheet) + camadas parallax de todas as arenas */
  (typeof STAGE_LIST !== 'undefined' ? STAGE_LIST : []).forEach((s) => {
    if (s.image) urls.add(s.image);
    if (s.sheet) urls.add(s.sheet);
    (s.layers || []).forEach((l) => urls.add(String(l.src) + (String(l.src).indexOf('?') >= 0 ? '' : '?v=v36-amb1')));
  });
  urls.add('assets/fx/rain-streaks.png?v=v36-amb1');
  urls.add('assets/fx/mare.png?v=v55-revisao');
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
  if (!g || g.mode !== 'online' || !N || !N.room) {
    /* fora do online nao tem rede: mostra que a partida e local + o fps real */
    const fpsEl = document.getElementById('fps');
    const fps = fpsEl && fpsEl.textContent ? ' · ' + fpsEl.textContent : '';
    return '🎮 partida local (sem rede)' + fps;
  }
  const p = typeof N.displayPing === 'function' ? N.displayPing() : (N.ping > 0 ? N.ping : null);
  const ping = p == null ? 'medindo…' : (p < 1 ? '<1' : Math.round(p)) + ' ms';
  const q = p == null ? '' : p < 60 ? ' 🟢' : p < 130 ? ' 🟡' : ' 🔴';
  const code = (N.room && N.room.code) || '—';
  const role = (typeof N.isHost === 'function' && N.isHost()) ? 'anfitrião' : 'convidado';
  const tr = N.transport === 'ws' ? 'WS' : 'P2P';
  const pl = (N.room.players && N.room.players.length) || (N.room.config && N.room.config.players) || 1;
  return '🌐 ping ' + ping + q + ' · sala ' + code + ' · ' + tr + ' · ' + role + ' · ' + pl + ' jog.';
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
    /* selecao com palco ao vivo: o demo fica 100% coberto atras da tela
       (z 20 > canvas), entao nem ticka nem renderiza ele — sobra GPU pro jogo */
    const selBgOn = (typeof UI !== 'undefined' && UI.screen === 'select' && !!UI._selBg);
    /* CELULAR: a luta de demonstracao fica escondida fora da tela de titulo
       (css: body.demo-hidden). Escondida, nem calcula nem desenha: bateria e fps. */
    const demoHidden = document.body.classList.contains('mobile') && game.mode === 'demo' && typeof UI !== 'undefined' && UI.screen !== 'title';
    if (demoHidden !== document.body.classList.contains('demo-hidden')) document.body.classList.toggle('demo-hidden', demoHidden);
    const skipGame = selBgOn || demoHidden;
    while (acc >= STEP && steps < 5) {
      Input.pollPads();
      UI.tick();
      if (!skipGame) { game.capturePrev(); game.tick(); Net.frame(game); }
      Input.endFrame();
      acc -= STEP;
      steps++;
    }
    if (steps >= 5) acc = 0;
    const cap = Number(Profile.data.settings.fpsCap) || 0;
    if (!cap || now - lastDraw >= 1000 / cap - 1) {
      lastDraw = now;
      if (game.stage && !skipGame) game.render(Math.max(0, Math.min(1, acc / STEP)));
      fpsFrames++;
    }
    if (now - fpsT >= 500) {
      const fpsNow = Math.round((fpsFrames * 1000) / (now - fpsT));
      if (fpsEl) {
        fpsEl.textContent = fpsNow + ' FPS';
        fpsEl.hidden = !Profile.data.settings.showFps;
      }
      /* HUD de ping/rede na luta (opcao showNet) */
      const netEl = document.getElementById('net-hud');
      if (netEl) {
        const show = !!(Profile.data && Profile.data.settings && Profile.data.settings.showNet) && UI.screen === 'fight';
        netEl.hidden = !show;
        if (show) netEl.textContent = netHudText();
      }
      /* watchdog de performance automatica: fps < 38 por ~2s desce o nivel
         (game.applyPerf); fps > 55 por ~5s e nivel > 0 sobe de volta.
         Qualidade "Baixo" nas opcoes tranca direto no nivel 2. */
      try {
        const q = (Profile.data.settings && Profile.data.settings.quality) || 'medium';
        /* celular comeca no nivel 1 (leve) em vez de esperar o fps cair; quem
           escolheu qualidade "alta" nas opcoes comeca no 0 */
        const mob = document.body.classList.contains('mobile');
        if (!window.__perf) window.__perf = { level: q === 'low' ? 2 : (mob && q !== 'high') ? 1 : 0, bad: 0, good: 0, quiet: mob };
        const P = window.__perf;
        if (q === 'low') P.level = 2;
        else {
          if (fpsNow < 38) { P.bad++; P.good = 0; } else { P.bad = 0; if (fpsNow > 55) P.good++; else P.good = 0; }
          if (P.bad >= 4 && P.level < 2) P.level++;
          else if (P.good >= 10 && P.level > 0) P.level--;
        }
        if (game.applyPerf) game.applyPerf(P.level);
      } catch (e) {}
      fpsFrames = 0;
      fpsT = now;
    }
  }
  requestAnimationFrame(frame);
})();

/* APP INSTALAVEL (PWA): service worker (abre sem internet; codigo sempre da rede
   quando online) + botao INSTALAR APP na tela inicial quando o navegador oferece.
   iPhone/iPad nao tem o evento: o botao explica "Compartilhar > Adicionar a Tela". */
(function pwa() {
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) || navigator.standalone === true;
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
  const btn = document.getElementById('btn-install');
  if (!btn || standalone) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    if (e.preventDefault) e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || '') && !window.MSStream;
  if (ios) btn.hidden = false;
  btn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (deferred) {
      const d = deferred; deferred = null;
      try { await d.prompt(); const r = await d.userChoice; if (r && r.outcome === 'accepted') btn.hidden = true; } catch (e) { /* usuario fechou */ }
    } else if (ios && typeof UI !== 'undefined' && UI.toast) {
      UI.toast('No Safari: toque em Compartilhar e depois em "Adicionar à Tela de Início"', 5000);
    }
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
})();

/* PARALLAX DO TITULO: logo e fundo da tela inicial seguem o mouse de leve
   (camadas em profundidades diferentes). Desliga com movimento reduzido. */
(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  let raf = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    if (document.body.classList.contains('reduced') || document.body.classList.contains('mobile')) return;
    mx = (e.clientX / Math.max(1, window.innerWidth)) - 0.5;
    my = (e.clientY / Math.max(1, window.innerHeight)) - 0.5;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const root = document.getElementById('app') || document.body;
      root.style.setProperty('--px', mx.toFixed(3));
      root.style.setProperty('--py', my.toFixed(3));
    });
  }, { passive: true });
})();
