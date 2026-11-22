/* DS Fighters — RANKING das contas (tabela ds_fighters_ranking, criada por
   supabase/sql/ds_fighters_ranking.sql). Duas listas: MAIS VITORIAS e TORNEIO
   MAIS RAPIDO. So quem esta logado (conta por email) entra; cada conta so
   escreve a propria linha (RLS). Apelido = nome do perfil (nunca o email).
   Sem tabela/sem internet: falha em silencio, o jogo nao sente. */
const Ranking = {
  TABLE: 'ds_fighters_ranking',
  _last: 0,
  _client() {
    const c = typeof Cloud !== 'undefined' ? Cloud : null;
    return c && c.user && c._supabaseClient && typeof c._supabaseClient.from === 'function' ? c._supabaseClient : null;
  },
  /* uid real do Supabase (o Profile.accountUid tem prefixo de namespace) */
  _uid() {
    const c = typeof Cloud !== 'undefined' ? Cloud : null;
    const u = c && c.user;
    return u ? String(u.uid || u.id || '') : '';
  },
  nickname() {
    const n = typeof Profile !== 'undefined' && Profile.data ? String(Profile.data.name || '').trim() : '';
    return (n || 'Jogador').replace(/[<>]/g, '').slice(0, 24);
  },
  row() {
    const st = (typeof Profile !== 'undefined' && Profile.data && Profile.data.stats) || {};
    const best = Math.round(Number(st.bestTourneySecs) || 0);
    return {
      uid: this._uid(),
      name: this.nickname(),
      wins: Math.max(0, Math.min(1000000, Math.round(Number(st.wins) || 0))),
      fights: Math.max(0, Math.min(2000000, Math.round(Number(st.fights) || 0))),
      best_tourney_secs: best >= 30 ? Math.min(100000, best) : null,
      updated_at: new Date().toISOString(),
    };
  },
  /* Manda a linha da conta. force=false: no maximo 1 envio a cada 20s. */
  async submit(force) {
    try {
      const db = this._client();
      if (!db || !this._uid()) return false;
      const now = Date.now();
      if (!force && now - this._last < 20000) return false;
      this._last = now;
      const res = await db.from(this.TABLE).upsert(this.row(), { onConflict: 'uid' });
      return !(res && res.error);
    } catch (e) { return false; }
  },
  /* kind: 'wins' | 'tourney'. Devolve { ok, rows, error } */
  async top(kind, limit = 20) {
    try {
      const c = typeof Cloud !== 'undefined' ? Cloud : null;
      if (c && typeof c.init === 'function' && !c._supabaseClient) await c.init();
      const db = c && c._supabaseClient;
      if (!db || typeof db.from !== 'function') return { ok: false, rows: [], error: 'offline' };
      let q = db.from(this.TABLE).select('uid,name,wins,fights,best_tourney_secs');
      q = kind === 'tourney'
        ? q.not('best_tourney_secs', 'is', null).order('best_tourney_secs', { ascending: true })
        : q.gt('wins', 0).order('wins', { ascending: false });
      const res = await q.limit(limit);
      if (res && res.error) return { ok: false, rows: [], error: res.error.code === '42P01' || /does not exist|schema cache/i.test(res.error.message || '') ? 'missing' : 'error' };
      return { ok: true, rows: (res && res.data) || [] };
    } catch (e) { return { ok: false, rows: [], error: 'offline' }; }
  },
  fmtTime(secs) {
    const s = Math.max(0, Math.round(Number(secs) || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  },
};
if (typeof window !== 'undefined') window.Ranking = Ranking;
