/* DS Fighters — resultado de luta ANONIMO pro balanceamento com dados reais.
   Manda pro Supabase do jogo (tabela ds_fighters_match_results, criada pelo
   supabase/sql/ds_fighters_match_results.sql): modo, mapa, lutadores, quem e
   CPU, dificuldade, rounds e vencedor. Nada de nome, e-mail ou id.
   Sem tabela/sem internet: falha em silencio, o jogo nao sente. Desligavel
   nas opcoes (Profile setting 'shareStats' = false). */
const MatchStats = {
  record(game, res) {
    try {
      if (!game || !game.cfg || !res) return;
      if (['demo', 'training', 'online', 'shadow'].includes(game.mode)) return;
      if (game.cfg.shadowFight) return; /* espelho com regras proprias: nao entra no balanceamento */
      if (typeof Profile !== 'undefined' && Profile.setting && Profile.setting('shareStats') === false) return;
      const conf = window.DS_SUPABASE_CONFIG;
      if (!conf || !conf.url || !conf.publishableKey || typeof fetch !== 'function') return;
      const a = game.activeOf(0), b = game.activeOf(1);
      if (!a || !b) return;
      const cpu = game.cfg.cpu || [];
      const row = {
        mode: String(game.mode).slice(0, 20),
        stage: String((game.stageDef && game.stageDef.id) || '').slice(0, 60),
        p1: a.def.id, p2: b.def.id,
        p1_cpu: !!cpu[0], p2_cpu: !!cpu[1],
        difficulty: Math.max(0, Math.min(3, Number(game.cfg.cpuDifficulty != null ? game.cfg.cpuDifficulty : game.cfg.difficulty) || 0)),
        rounds_p1: Math.min(9, game.teamWins[0] | 0), rounds_p2: Math.min(9, game.teamWins[1] | 0),
        winner: res.winner === 0 || res.winner === 1 ? res.winner : -1,
        seconds: Math.min(3600, Math.round((game.fightFrames || 0) / 60)),
        build: String((document.getElementById('build') || {}).textContent || '').slice(0, 40),
      };
      fetch(conf.url.replace(/\/+$/, '') + '/rest/v1/ds_fighters_match_results', {
        method: 'POST',
        headers: { apikey: conf.publishableKey, Authorization: 'Bearer ' + conf.publishableKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* nunca atrapalha o jogo */ }
  },
};
