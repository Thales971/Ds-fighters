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
  /* assetUrl vem de js/asset-hashes.js (1o script); sem ele, caminho cru */
  const assetUrl = typeof window !== 'undefined' && typeof window.assetUrl === 'function' ? window.assetUrl
    : (typeof globalThis.assetUrl === 'function' ? globalThis.assetUrl : (u) => u);
  const urls = new Set();
  Object.values(ART_SHEETS).forEach((s) => urls.add(Art.url(s.src, s.v)));
  Object.keys((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {}).forEach((id) => urls.add(SpriteGen.url(id)));
  /* mapas (jpg ou spritesheet) + camadas parallax de todas as arenas */
  (typeof STAGE_LIST !== 'undefined' ? STAGE_LIST : []).forEach((s) => {
    if (s.image) urls.add(assetUrl(s.image));
    if (s.sheet) urls.add(assetUrl(s.sheet));
    (s.layers || []).forEach((l) => urls.add(assetUrl(String(l.src))));
  });
  urls.add(assetUrl('assets/fx/rain-streaks.png'));
  urls.add(assetUrl('assets/fx/mare.png'));
  urls.add(assetUrl('assets/fauna/torcida.png'));
  urls.add(assetUrl('assets/weather/petals.png'));
  urls.add(assetUrl('assets/weather/neon.png'));
  urls.add(assetUrl('assets/weather/snowflakes.png'));
  urls.add(assetUrl('assets/weather/leaf.png'));
  urls.add(assetUrl('assets/weather/spark.png'));
  urls.add(assetUrl('assets/pets/pitoco.png'));
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
      /* assets prontos: a musica do menu (Helena primeiro) ja toca na tela de
         START. Sem autoplay, fica pendente ate o 1o toque e o START continua
         a mesma faixa no menu. */
      if (typeof AudioSys !== 'undefined' && AudioSys.titleMusic && typeof UI !== 'undefined' && UI.screen === 'title') AudioSys.titleMusic();
    }
  };
  list.forEach((u) => { const i = new Image(); i.onload = () => { done++; step(); }; i.onerror = () => { done++; failed.push(u); step(); }; i.src = u; });
  step();
}

function buildToken() {
  /* BUILD_ID vem de js/asset-hashes.js (tools/stamp.cjs): hash de todo o
     codigo + arte. Muda sozinho a cada versao publicada. */
  if (typeof BUILD_ID === 'string' && BUILD_ID) return BUILD_ID;
  let best = null, bestN = -1;
  for (const sc of document.querySelectorAll('script[src]')) {
    const m = /[?&]v=(v(\d+)[\w-]*)/.exec(sc.getAttribute('src') || '');
    if (m && +m[2] > bestN) { bestN = +m[2]; best = m[1]; }
  }
  return best || '?';
}

(function boot() {
  preloadAll();
  const canvas = document.getElementById('game');
  SpriteGen.load();
  Art.load();
  if (typeof Fx !== 'undefined' && Fx.load) Fx.load();
  // Selo de build: BUILD_ID (hash do codigo + arte, gerado por tools/stamp.cjs).
  // Antes mostrava a versao da folha do Du (v47), que nao mudava, e parecia
  // que o jogo nao atualizava. Versao nova = codigo novo aqui na hora.
  const buildEl = document.getElementById('build');
  if (buildEl) buildEl.textContent = 'build ' + buildToken();
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
  let coverX = null, coverDrawn = -1e9;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min(100, now - last);
    last = now;
    let steps = 0;
    /* selecao com palco ao vivo: o demo fica 100% coberto atras da tela
       (z 20 > canvas), entao nem ticka nem renderiza ele — sobra GPU pro jogo */
    const selBgOn = (typeof UI !== 'undefined' && UI.screen === 'select' && !!UI._selBg);
    /* CELULAR: a luta de demonstracao aparece atras do titulo e do MENU (o
       fundo vivo do jogo). Nas outras telas (selecao, chave, bonus...) ela
       ficava por baixo dos paineis parecendo "sprite duplo": la fica escondida
       (css: body.demo-hidden) e nem calcula nem desenha — bateria e fps. */
    const demoHidden = document.body.classList.contains('mobile') && game.mode === 'demo' && typeof UI !== 'undefined' && UI.screen !== 'title' && UI.screen !== 'menu';
    if (demoHidden !== document.body.classList.contains('demo-hidden')) document.body.classList.toggle('demo-hidden', demoHidden);
    const skipGame = selBgOn || demoHidden;
    const demoBg = game.mode === 'demo' && !demoHidden;
    if (demoBg !== document.body.classList.contains('demo-bg')) document.body.classList.toggle('demo-bg', demoBg);
    /* celular em pe: o recorte "cover" do fundo segue o meio da luta */
    if (!demoHidden && game.mode === 'demo' && document.body.classList.contains('mobile') && !document.body.classList.contains('landscape') && typeof AppViewport !== 'undefined' && AppViewport.cover) {
      const cv = AppViewport.cover;
      const pair = game.activePair ? game.activePair() : [];
      const mid = pair[0] && pair[1] ? (pair[0].x + pair[1].x) / 2 : 480;
      const target = Math.max(cv.width - 960 * cv.scale, Math.min(0, cv.width / 2 - mid * cv.scale));
      coverX = coverX == null ? target : coverX + (target - coverX) * 0.06;
      if (Math.abs(coverX - coverDrawn) > 0.5) { coverDrawn = coverX; document.getElementById('app').style.setProperty('--cover-left', coverX.toFixed(1) + 'px'); }
    }
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
    /* VERSAO NOVA PUBLICADA: o sw.js muda a cada build (cache 'dsf-<BUILD_ID>'),
       o navegador instala o novo e ele assume a pagina. Recarrega sozinho na
       proxima vez que o jogador estiver no titulo/menu (nunca no meio da luta),
       pra pegar a pagina nova sem precisar limpar cache. */
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || window.__dsReloading) return; /* primeira instalacao: nada a recarregar */
      const safe = () => typeof UI === 'undefined' || ['title', 'menu'].includes(UI.screen);
      const go = () => { if (window.__dsReloading) return; window.__dsReloading = true; location.reload(); };
      if (safe()) return go();
      const iv = setInterval(() => { if (safe()) { clearInterval(iv); go(); } }, 1500);
    });
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
