/* ============================================================
   DS FIGHTERS — Interface (HTML/CSS). Telas, navegação por
   teclado/controle/toque, seleção de lutadores e arenas,
   resultados, mascotes, resgate, opções, lista de golpes e lobby.
   ============================================================ */
const SLOT_NAMES = { simple: 'SIMPLES', charge: 'CARGA', ultimate: 'ULTIMATE' };
const KIND_NAMES = { shot: 'Projétil', pillar: 'Coluna', dash: 'Investida', aura: 'Aura', beam: 'Raio', blast: 'Explosão', rush: 'Sequência', rain: 'Chuva', pull: 'Puxão', steal: 'Roubo', wall: 'Muralha', zone: 'Zona', barrage: 'Rajada', shadowport: 'Portal', kspikes: 'Espinhos', kradial: 'Leque', kblackhole: 'Buraco negro', hotreload: 'Recarga' };
const ROSTER_4X8_SPRITES = new Set([]); // todas as folhas migradas pra 4x15 — nenhuma usa mais o size 800%

/* ===== BUSCA/FILTRO NA GRADE DE SELECAO ===== */
/* normaliza acentos: "crianca" acha "Crianças", "cafe" acha "Café" */
function normSelText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
/* Slots exibidos na grade dado texto/filtro/favoritos. O slot ALEATORIA
   (list.length) fica SEMPRE no fim. */
function selFilterSlots(list, query, filter, favs, isUnlocked) {
  const q = normSelText(query);
  const fav = new Set(favs || []);
  const fl = filter || 'all';
  const slots = [];
  list.forEach((d, i) => {
    if (!d || d.id === 'boneco-treino') return;
    if (fl === 'unlocked' && !isUnlocked(d.id)) return;
    if (fl === 'secret' && !d.secret) return;
    if (fl === 'fav' && !fav.has(d.id)) return;
    if (q && normSelText(d.name + ' ' + d.id + ' ' + (d.title || '')).indexOf(q) < 0) return;
    slots.push(i);
  });
  slots.push(list.length);
  return slots;
}

/* Busto do atlas gerado (tools/build_roster_portraits.py). A célula da
   seleção tem 48px; cada retrato no atlas tem 96px. */
function rosterPortraitStyle(id, px) {
  const book = typeof ROSTER_PORTRAITS !== 'undefined' ? ROSTER_PORTRAITS : null;
  const order = book && Array.isArray(book.order) ? book.order : null;
  const idx = order ? order.indexOf(id) : -1;
  if (!book || idx < 0) return '';
  const cols = book.cols || 7;
  const rows = Math.ceil(order.length / cols);
  const col = idx % cols;
  const row = (idx / cols) | 0;
  const src = `${book.file}?v=${book.version || 'v36-portraits1'}`;
  /* Uma célula só, no tamanho do cartão. Tamanho fixo em px cortava o vizinho
     quando o cartão ficava maior que 48px. */
  return `--pcols:${cols};--prows:${rows};--pcol:${col};--prow:${row};background-image:url(${src})`;
}
/* ---------- DECORACAO DOS EVENTOS (aba Eventos) ----------
   Cada evento ganha moldura + enfeites animados no cartao do calendario, nos
   botoes de mapa e no destaque: Natal (festao de vinha, bolinhas, gelo e neve),
   Halloween (morcegos, bruxa, aboboras e teia), Carnaval (confete, serpentina,
   mascaras), Pascoa (ovos pintados, coelho, flores), Junina (bandeirinhas,
   fogueira, milho), Criancas (baloes, pipa, pirulito) e Ano Novo (fogos,
   brilhos, tacas). So CSS + emoji: nada de imagem nova pra baixar. */
const EV_DECOR = {
  natal: { top: 'garland', items: [['❄', 'fall', 12, 6], ['❄', 'fall', 38, 2], ['❄', 'fall', 64, 9], ['❄', 'fall', 86, 4]], corner: [['🎁', 'br'], ['⛄', 'bl']], balls: true, bottom: 'snowbank' },
  halloween: { items: [['🦇', 'bat', 8, 18], ['🦇', 'bat2', 58, 30], ['🧙‍♀️', 'witch', 0, 12]], corner: [['🎃', 'br', 'glow'], ['🕸️', 'tl'], ['🎃', 'bl', 'glow']], bottom: 'fog' },
  carnaval: { top: 'serpentina', items: [['🎊', 'spin', 80, 30], ['🪶', 'sway', 6, 40]], corner: [['🎭', 'br', 'sway'], ['🥁', 'bl']], confetti: true },
  pascoa: { items: [['🦋', 'flutter', 20, 20], ['🌷', 'still', 70, 70]], corner: [['🐰', 'br', 'hop'], ['🌼', 'bl']], eggs: true },
  junina: { top: 'flags', items: [['✨', 'twinkle', 30, 40], ['✨', 'twinkle', 70, 52]], corner: [['🔥', 'br', 'flicker'], ['🌽', 'bl']] },
  criancas: { top: 'rainbow', items: [['🎈', 'rise', 10, 0], ['🎈', 'rise2', 82, 0], ['🪁', 'sway', 60, 18]], corner: [['🍭', 'br', 'spin-slow'], ['🧸', 'bl']] },
  anonovo: { items: [['✨', 'twinkle', 14, 18], ['✨', 'twinkle2', 46, 10], ['✨', 'twinkle', 78, 24], ['🎆', 'pop', 64, 8]], corner: [['🥂', 'br'], ['🎉', 'bl', 'sway']], top: 'gold' },
};
function evDecor(id, kind) {
  const d = EV_DECOR[id];
  if (!d) return '';
  const small = kind === 'card';
  const out = [];
  if (d.top) out.push(`<i class="evd-top evd-${d.top}"></i>`);
  if (d.balls) {
    const short = small || kind === 'btn'; /* no cartao e no botao do menu o fio e curto: nao cobre o texto */
    const n = small ? 3 : kind === 'hero' ? 9 : 5;
    for (let k = 0; k < n; k++) out.push(`<i class="evd-ball c${k % 4}" style="left:${Math.round((k + 0.5) * 100 / n)}%;--d:${(k % 3) * 0.4}s;--len:${short ? 3 + (k % 2) * 3 : 8 + (k % 3) * 6}px"></i>`);
    out.push('<i class="evd-ice"></i>');
  }
  if (d.confetti) out.push('<i class="evd-confetti"></i>');
  if (d.eggs) {
    const n = small ? 2 : kind === 'hero' ? 5 : 3;
    for (let k = 0; k < n; k++) out.push(`<i class="evd-egg e${k % 4}" style="right:${(small ? 20 : 28) + k * (small ? 14 : 20)}px"></i>`);
  }
  if (d.bottom) out.push(`<i class="evd-bottom evd-${d.bottom}"></i>`);
  const items = small ? d.items.slice(0, 2) : d.items;
  items.forEach(([e, anim, x, y], k) => out.push(`<i class="evd-it a-${anim}" style="left:${x}%;top:${y}%;--d:${k * 0.7}s">${e}</i>`));
  (small ? d.corner.slice(0, 1) : d.corner).forEach(([e, pos, anim]) => out.push(`<i class="evd-c p-${pos}${anim ? ' a-' + anim : ''}">${e}</i>`));
  return `<span class="evd" aria-hidden="true">${out.join('')}</span>`;
}

const UI = {
  hud: HUD,
  screen: null,
  stack: [],
  flow: null,
  game: null,
  $(id) { return document.getElementById(id); },

  init(game) {
    this.game = game;
    // botões genéricos
    document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => this.back()));
    document.querySelectorAll('#scr-menu [data-go]').forEach((b) => b.addEventListener('click', () => this.menuGo(b.dataset.go)));
    this.$('btn-start').addEventListener('click', () => this.pressStart());
    this.$('btn-fight').addEventListener('click', () => this.confirmStage());
    this.$('btn-mobile-account').addEventListener('click', () => this.$('account-box').scrollIntoView({ block: 'start', behavior: Profile.reducedMotion() ? 'auto' : 'smooth' }));
    this.$('btn-fullscreen').addEventListener('click', () => AppViewport.fullscreen());
    this.$('rules-start').addEventListener('click', () => this.startFlow('versus', {
      customRules: { roundsToWin: Number(this.$('rules-rounds').value), timer: Number(this.$('rules-timer').value), infiniteLife: this.$('rules-life').checked, infiniteMeter: this.$('rules-meter').checked },
      p2Human: this.$('rules-opponent').value === 'human',
    }));
    this.$('rules-online').addEventListener('click', () => this.show('online'));
    this.$('btn-resume').addEventListener('click', () => this.resume());
    this.$('btn-quit').addEventListener('click', () => this.quitFight());
    this.$('btn-pause-moves').addEventListener('click', () => this.show('moves', true));
    this.$('btn-pause-opts').addEventListener('click', () => this.show('options', true));
    this.$('btn-photo').addEventListener('click', () => this.enterPhoto());
    this.$('btn-photo-save').addEventListener('click', () => this.savePhoto());
    this.$('btn-photo-exit').addEventListener('click', () => this.exitPhoto());
    this.$('btn-photo-fighters').addEventListener('click', () => this.togglePhotoFighters());
    const pf = this.$('btn-photo-filter');
    if (pf) pf.addEventListener('click', () => this.cyclePhotoFilter());
    this.$('btn-photo-zin').addEventListener('click', () => this.photoZoom(0.15));
    this.$('btn-photo-zout').addEventListener('click', () => this.photoZoom(-0.15));
    /* zoom com a rodinha do mouse no modo foto */
    if (this.game && this.game.canvas) this.game.canvas.addEventListener('wheel', (e) => {
      if (!this.photoMode) return;
      e.preventDefault();
      this.photoZoom(e.deltaY < 0 ? 0.12 : -0.12);
    }, { passive: false });
    this.$('btn-again').addEventListener('click', () => this.rematch());
    this.$('btn-next').addEventListener('click', () => {
      if (this.flow && this.flow.mode === 'survival') return this.survivalNext();
      if (this.flow && this.flow.mode === 'arcade') return this.showLadder();
      this.arcadeNext();
    });
    this.$('btn-res-select').addEventListener('click', () => (this.flow && this.flow.mode === 'online' ? (Net.room ? Net.openPicker() : this.show('online')) : this.startFlow(this.flow ? this.flow.mode : 'versus')));
    this.$('btn-res-menu').addEventListener('click', () => this.toMenu());
    this.$('redeem-form').addEventListener('submit', (e) => { e.preventDefault(); this.redeem(); });
    document.querySelectorAll('.pet-tabs .tab').forEach((t) => t.addEventListener('click', () => { this.petSlot = +t.dataset.slot; this.renderPets(); }));
    this.bindOptions();
    document.addEventListener('mouseover', (e) => { const n = e.target.closest && e.target.closest('.nav'); if (n && this.screenEl && this.screenEl.contains(n) && document.activeElement !== n) n.focus({ preventScroll: true }); });
    document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('nav')) AudioSys.cursor(); });
    this.buildMenuSide();
    this.show('title');
    /* tela inicial VIVA: luta de demonstracao roda atras do titulo (a musica
       so comeca depois do 1o toque/tecla — o AudioSys guarda como pendente) */
    this.startDemo();
    /* TREINO GUIADO so aparece pra quem e novo no jogo. */
    const isNew = !Profile.setting('tutorialDone');
    const bt = this.$('btn-tutorial');
    if (bt) bt.hidden = !isNew;
    if (/sala=/i.test(location.hash)) setTimeout(() => { Net.bindUi(); Net.checkInvite(); }, 50);
    this.updateTouch();
  },

  /* ---------- telas ---------- */
  /* PITOCO: o codigo do sangue — na tela de pet, digite P-I-T-O-C-O */
  pitocoSeq: [],
  pitocoKey(k) {
    const seq = ['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO'];
    const t = this.pitocoSeq;
    t.push(k);
    if (t.length > seq.length) t.shift();
    if (t.join(',') === seq.join(',')) {
      t.length = 0;
      if (typeof Profile !== 'undefined' && Profile.unlockPitoco && Profile.unlockPitoco()) {
        UI.toast('\u{1F415} PITOCO DESBLOQUEADO!', 4200);
        AudioSys.voice('unlocked');
        try { if (this.screen === 'custom') this.renderPets(); } catch (e) {}
      } else if (Profile.hasPitoco && Profile.hasPitoco()) {
        UI.toast('O cachorro ja te conhece.', 2200);
      }
    }
  },
  /* MENU VIVO: desfile de lutadores liberados andando no rodape (anim de
     andar da propria folha), sorteados a cada entrada no menu. */
  buildParade() {
    const box = document.getElementById('menu-parade');
    if (!box || typeof SpriteGen === 'undefined' || typeof FIGHTERS === 'undefined') return;
    if (document.body.classList.contains('reduced') || document.body.classList.contains('perf-xlow')) { box.innerHTML = ''; return; }
    const pool = FIGHTERS.filter((f) => f.id !== 'boneco-treino' && Profile.isUnlocked(f.id));
    const pick = [];
    while (pick.length < Math.min(5, pool.length)) {
      const f = pool[(Math.random() * pool.length) | 0];
      if (!pick.includes(f)) pick.push(f);
    }
    const rowOf = (id) => { try { return SpriteGen.rowOf('walk', id); } catch (e) { return 1; } };
    box.innerHTML = pick.map((f, k) => {
      const dur = 22 + (k % 3) * 5;
      return `<span class="pz" style="--d:${-(k * dur) / pick.length}s;--t:${dur}s;--row:${rowOf(f.id)};background-image:url(${SpriteGen.url(f.id)})"></span>`;
    }).join('');
  },
  show(name, push) {
    if (name === 'conquistas' && typeof ACHIEVEMENTS !== 'undefined') this.renderConquistas();
    if (name === 'menu' && this.screen !== 'menu') { try { this.buildParade(); } catch (e) { /* enfeite */ } }
    if (this.screen !== name) Input.releaseAll();
    if (push && this.screen) this.stack.push(this.screen);
    else if (!push) this.stack = [];
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === name));
    this.screen = name;
    if (name !== 'fight' && this.photoMode) this.exitPhoto(false);
    if (name !== 'select') this.stopSelectBg();
    this.screenEl = document.querySelector(`.screen[data-screen="${name}"]`);
    document.body.dataset.screen = name;
    if (typeof Events !== 'undefined') this.applyEventSkin();
    if (name !== 'fight') { this.$('banner').classList.remove('on'); this.$('cutin').classList.remove('on'); }
    const enter = this['enter_' + name];
    if (enter) enter.call(this);
    setTimeout(() => {
      if (!this.screenEl) return;
      const first = this.screenEl.querySelector('.nav.default') || this.screenEl.querySelector('.nav:not([hidden])');
      if (first && name !== 'select') first.focus({ preventScroll: true });
    }, 30);
    this.updateTouch();
  },
  back() {
    AudioSys.back();
    if (this.stack.length) { const prev = this.stack.pop(); this.show(prev, false); this.stack = this.stack; return; }
    if (this.screen === 'select') {
      if (this.flow && this.flow.mode === 'online') { this.show('online'); return; }
      return this.toMenu();
    }
    if (['acc', 'custom', 'rules', 'redeem', 'options', 'moves', 'online', 'skins', 'conquistas', 'ranking', 'events', 'ladder', 'buffs', 'vs'].includes(this.screen)) return this.toMenu();
    if (this.screen === 'stage') return this.show('select');
  },
  /* ---------- RANKING (contas por email) ---------- */
  _rankKind: 'wins',
  enter_ranking() {
    const tabs = document.querySelectorAll('#scr-ranking .rank-tabs .tab');
    tabs.forEach((t) => {
      if (t._rk) return;
      t._rk = true;
      t.addEventListener('click', () => { AudioSys.select(); this.renderRanking(t.dataset.rank); });
    });
    this.renderRanking(this._rankKind || 'wins');
  },
  async renderRanking(kind) {
    this._rankKind = kind === 'tourney' ? 'tourney' : 'wins';
    document.querySelectorAll('#scr-ranking .rank-tabs .tab').forEach((t) => t.classList.toggle('on', t.dataset.rank === this._rankKind));
    const me = this.$('rank-me');
    const list = this.$('rank-list');
    if (!me || !list) return;
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
    const st = (Profile.data && Profile.data.stats) || {};
    if (Profile.loggedIn()) {
      me.innerHTML = `<label for="rank-nick">Seu apelido no ranking</label>
        <span class="rank-nick-row"><input id="rank-nick" maxlength="16" value="${esc(Ranking.nickname())}" /><button class="nav btn" id="rank-nick-save" type="button">SALVAR</button></span>
        <small>Você: <b>${st.wins || 0}</b> vitórias · melhor torneio <b>${st.bestTourneySecs ? Ranking.fmtTime(st.bestTourneySecs) : '—'}</b></small>`;
      const save = this.$('rank-nick-save');
      if (save) save.addEventListener('click', async () => {
        const v = String(this.$('rank-nick').value || '').replace(/[<>]/g, '').trim().slice(0, 16);
        if (!v) { this.toast('Digite um apelido.'); return; }
        Profile.data.name = v;
        Profile.save();
        const ok = await Ranking.submit(true);
        this.toast(ok ? 'Apelido salvo no ranking!' : 'Não consegui falar com o ranking agora. Tente de novo.', 2600);
        this.renderRanking(this._rankKind);
      });
      void Ranking.submit(true);
    } else {
      me.innerHTML = `<p>Você ainda não está no ranking. <b>FAÇA LOGIN</b> com email pra aparecer aqui (e ganhar o CAPTCHA GUARD e a RAPOSA DO FIREFOX).</p><button class="nav btn primary" id="rank-login" type="button">FAZER LOGIN</button>`;
      const b = this.$('rank-login');
      if (b) b.addEventListener('click', () => this.goLogin());
    }
    list.innerHTML = '<li class="rank-empty">Carregando…</li>';
    const kindNow = this._rankKind;
    const r = await Ranking.top(kindNow, 20);
    if (this._rankKind !== kindNow || this.screen !== 'ranking') return;
    if (!r.ok) {
      list.innerHTML = `<li class="rank-empty">${r.error === 'missing' ? 'O ranking ainda não foi criado no Supabase (falta rodar supabase/sql/ds_fighters_ranking.sql).' : 'Sem conexão com o ranking agora. O jogo continua normal.'}</li>`;
      return;
    }
    if (!r.rows.length) {
      list.innerHTML = `<li class="rank-empty">${kindNow === 'tourney' ? 'Ninguém fechou o torneio com conta ainda. Seja o primeiro!' : 'Ninguém venceu com conta ainda. Seja o primeiro!'}</li>`;
      return;
    }
    const myUid = Ranking._uid();
    list.innerHTML = r.rows.map((row, i) => `<li class="${row.uid === myUid ? 'me' : ''}${i < 3 ? ' top' + (i + 1) : ''}"><span class="pos">${i + 1}º</span><span class="nm">${esc(row.name)}</span><span class="val">${kindNow === 'tourney' ? Ranking.fmtTime(row.best_tourney_secs) : row.wins + ' vit.'}</span></li>`).join('');
  },
  /* Vai pro menu e abre o formulario de conta (email) */
  goLogin() {
    this.closeLoginNudge();
    this.toMenu();
    setTimeout(() => {
      if (typeof Account !== 'undefined' && Account.openSignup) Account.openSignup();
    }, 80);
  },
  /* ---------- AVISO DE LOGIN (Lyra no balao) ---------- */
  _nudgeShown: 0,
  closeLoginNudge() {
    const el = document.getElementById('login-nudge');
    if (el) el.remove();
  },
  loginNudge(force) {
    if (typeof Profile === 'undefined' || Profile.loggedIn()) return false;
    if (typeof Cloud !== 'undefined' && Cloud.isConfigured && !Cloud.isConfigured()) return false;
    if (!force && this._nudgeShown >= 2) return false; /* no maximo 2x por sessao sozinho */
    if (document.getElementById('login-nudge')) return false;
    this._nudgeShown += 1;
    const cg = FIGHTERS.find((x) => x.id === 'captcha-guard');
    const el = document.createElement('div');
    el.id = 'login-nudge';
    el.className = 'login-nudge';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'ln-title');
    el.innerHTML = `
      <div class="ln-card">
        <div class="ln-talk">
          <div class="ln-lyra" aria-hidden="true"></div>
          <div class="ln-bubble"><b>LYRA:</b> Ei, dev! Se você limpar o navegador, todo o seu progresso vira <code>undefined</code>... Cria uma conta rapidinho que eu guardo tudo na nuvem pra você. E ainda te apresento dois amigos novos!</div>
        </div>
        <h2 id="ln-title">FAÇA LOGIN PARA SALVAR O SEU PROGRESSO E MUITO MAIS</h2>
        <div class="ln-rewards">
          <figure><span class="ln-fig ln-cg" style="--c:${cg ? cg.colors.accent : '#3FB8FF'}"></span><figcaption><b>CAPTCHA GUARD</b><small>lutador exclusivo</small></figcaption></figure>
          <figure><span class="ln-fig ln-fox"></span><figcaption><b>RAPOSA DO FIREFOX</b><small>mascote exclusivo</small></figcaption></figure>
        </div>
        <p class="ln-small">Só email e senha. Seu progresso fica salvo em qualquer aparelho e você entra no RANKING.</p>
        <div class="ln-actions">
          <button class="nav btn primary" id="ln-go" type="button">FAZER LOGIN</button>
          <button class="nav btn" id="ln-later" type="button">AGORA NÃO</button>
        </div>
      </div>`;
    (document.getElementById('app') || document.body).appendChild(el);
    el.querySelector('#ln-go').addEventListener('click', () => { AudioSys.select(); this.goLogin(); });
    el.querySelector('#ln-later').addEventListener('click', () => { AudioSys.back(); this.closeLoginNudge(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.closeLoginNudge(); } });
    el.addEventListener('click', (e) => { if (e.target === el) this.closeLoginNudge(); });
    setTimeout(() => { const b = el.querySelector('#ln-go'); if (b) b.focus(); }, 40);
    if (typeof AudioSys !== 'undefined' && AudioSys.play) AudioSys.play('pickup');
    return true;
  },

  /* CONQUISTAS & RECORDES: medalhas do perfil + melhores marcas */
  renderConquistas() {
    const got = (Profile.data && Profile.data.achievements) || [];
    const st = (Profile.data && Profile.data.stats) || {};
    const winBy = (Profile.data && Profile.data.winBy) || {};
    const survivalBy = st.survivalBy || {};
    const list = (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []);
    const total = list.length;
    const pct = total ? Math.round((got.length / total) * 100) : 0;
    const medals = list.map((a) => {
      const on = got.includes(a.id);
      return `<div class="medal ${on ? 'on' : ''}"><span class="mi">${on ? '\u{1F3C6}' : '\u{1F512}'}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`;
    }).join('');
    const nome = (id) => ((typeof FIGHTERS !== 'undefined' ? FIGHTERS.find((f) => f.id === id) : null) || { name: id }).name;
    const topSurvival = Object.entries(survivalBy).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([id, w]) => `<li><b>${nome(id)}</b> ${w} vit\u00f3rias</li>`).join('');
    const topWinners = Object.entries(winBy).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([id, w]) => `<li><b>${nome(id)}</b> ${w} vit\u00f3rias</li>`).join('');
    this.$('conquistas-list').innerHTML = `
      <div class="cq-head">
        <h3>MEDALHAS</h3>
        <div class="cq-bar"><i style="width:${pct}%"></i></div>
        <span class="cq-pct">${got.length}/${total} \u00b7 ${pct}%</span>
      </div>
      <div class="medals">${medals}</div>
      <div class="cq-rec">
        <h3>RECORDES</h3>
        <p class="rec">Melhor arcade: <b>${st.bestArcade || 0}/7</b> \u00b7 Melhor survival: <b>${st.bestSurvival || 0}</b> \u00b7 Combo m\u00e1ximo: <b>${st.maxCombo || 0}</b></p>
        <p class="rec">Lutas: <b>${st.fights || 0}</b> \u00b7 Vit\u00f3rias: <b>${st.wins || 0}</b></p>
        ${topSurvival ? `<h4>SURVIVAL POR LUTADOR</h4><ul class="tops">${topSurvival}</ul>` : ''}
        ${topWinners ? `<h4>MAIS VITORIOSOS</h4><ul class="tops">${topWinners}</ul>` : ''}
      </div>`;
  },
  /* Cancela a carta VS e a tela de resultado. Sem isso o MENU voltava ao
     menu e, um segundo depois, a luta começava por cima e travava a tela. */
  cancelFlowTimers() {
    this._launchGen = (this._launchGen || 0) + 1;
    clearTimeout(this._vsTimer);
    clearTimeout(this._endTimer);
    this._vsTimer = 0;
    this._endTimer = 0;
  },
  toMenu() {
    this.cancelFlowTimers();
    if (this.flow) this.flow._buffLock = false;
    this.photoMode = false;
    if (this.game) {
      this.game.paused = false;
      this.game.photo = null;
    }
    if (typeof Input !== 'undefined' && Input.releaseAll) Input.releaseAll();
    /* vindo do titulo a demo ja esta rodando: continua a mesma luta no fundo */
    const demoOn = this.game.running && this.game.mode === 'demo';
    if (this.game.running && !demoOn) this.game.stop();
    HUD.hide();
    if (this.game.shadowHudOff) this.game.shadowHudOff();
    const shBtn = this.$('btn-shadow-mode');
    if (shBtn) shBtn.hidden = !Profile.hasAchievement('eu-mesmo'); /* VOCÊ MESMO aparece assim que for vencido */
    try { Net.leave(true); } catch (e) { /* sala nenhuma não pode prender o menu */ }
    if (typeof AudioSys.stopLoops === 'function') AudioSys.stopLoops();
    if (!demoOn) this.$('stage-wrap').classList.remove('on');
    this.show('menu');
    if (!demoOn) this.startDemo();
    AudioSys.playMusic('menu');
  },
  pressStart() {
    AudioSys.ensure();
    AudioSys.select();
    AudioSys.voice('title');
    this.toMenu();
  },
  toast(text, ms = 2200) {
    const t = this.$('toast');
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('on'), ms);
    const np = this.$('now-playing');
    if (np && text.startsWith('♪')) np.textContent = text.slice(2);
  },
  banner(text, color, sub) {
    if (this.game && this.game.mode === 'demo') return;
    const b = this.$('banner');
    b.querySelector('.b-main').textContent = text;
    b.querySelector('.b-main').style.setProperty('--c', color || '#ffd27d');
    b.querySelector('.b-sub').textContent = sub || '';
    b.classList.remove('on');
    void b.offsetWidth;
    b.classList.add('on');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => b.classList.remove('on'), 1500);
  },
  cutIn(f, p) {
    if (this.game && this.game.mode === 'demo') return;
    const c = this.$('cutin');
    const faceEl = c.querySelector('.ci-face');
    faceEl.style.backgroundImage = `url(${SpriteGen.faceUrl(f.def.id)})`;
    faceEl.classList.remove('portrait');
    /* RETRATO GRANDE no corte da ult (corpo inteiro); sem retrato, fica o rosto */
    const pid = f.def.id;
    const pimg = new Image();
    pimg.onload = () => { if (c.dataset.fid === pid) { faceEl.style.backgroundImage = `url(${pimg.src})`; faceEl.classList.add('portrait'); } };
    c.dataset.fid = pid;
    pimg.src = `assets/ui/portrait-${pid}.png?v=` + (((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.ver) || {})[pid] || 'v1');
    c.querySelector('.ci-name').textContent = f.def.name;
    c.querySelector('.ci-move').textContent = p.name || '';
    c.style.setProperty('--accent', f.def.colors.accent || '#ffd27d');
    c.classList.toggle('right', f.team === 1);
    c.classList.remove('on');
    void c.offsetWidth;
    c.classList.add('on');
    clearTimeout(this._cutT);
    this._cutT = setTimeout(() => c.classList.remove('on'), 1100);
  },

  /* ---------- menu ---------- */
  /* Botao EVENTOS do menu com a cara do evento (no ar ou o proximo). */
  decorateEventsButton() {
    const btn = document.querySelector('#scr-menu .mm[data-go="events"]');
    if (!btn || typeof Events === 'undefined') return;
    const rows = Events.upcoming();
    const now = rows.find((r) => r.active) || rows.filter((r) => !r.live).sort((a, b) => a.daysUntil - b.daysUntil)[0];
    if (!now) return;
    if (btn.dataset.ev === now.ev.id && btn.querySelector('.evd')) return;
    btn.classList.add('ev-btn');
    btn.dataset.ev = now.ev.id;
    const old = btn.querySelector('.evd');
    if (old) old.remove();
    btn.insertAdjacentHTML('afterbegin', evDecor(now.ev.id, 'btn'));
    const small = btn.querySelector('small');
    const dias = (n) => (n === 1 ? '1 dia' : `${n} dias`);
    if (small) small.textContent = now.active ? `${now.ev.icon} ${now.ev.name.toUpperCase()} NO AR!` : `${now.ev.icon} ${now.ev.name} em ${dias(now.daysUntil)} · mapas de festa`;
  },
  buildMenuSide() {
    try { this.decorateEventsButton(); } catch (e) { /* enfeite nao trava o menu */ }
    const shBtn = this.$('btn-shadow-mode');
    if (shBtn) shBtn.hidden = !Profile.hasAchievement('eu-mesmo');
    const s = Profile.data.stats;
    this.$('stats-card').innerHTML = `
      <h3>PERFIL</h3>
      <div><span>Lutas</span><b>${s.fights}</b></div>
      <div><span>Vitórias</span><b>${s.wins}</b></div>
      <div><span>Maior combo</span><b>${s.maxCombo}</b></div>
      <div><span>Arcade (melhor)</span><b>${s.bestArcade}/7</b></div>
      <div><span>Secretos</span><b>${Profile.data.unlocked.length}/${Profile.SECRET_IDS.length}</b></div>
      <div><span>Medalhas</span><b>${(Profile.data.achievements || []).length}/${typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : 0}</b></div>
      <div><span>Mascote P1</span><b>${Profile.petFor(0).name}</b></div>`;
    this.applyRelease();
    if (typeof Events !== 'undefined') this.applyEventSkin();
  },
  /* Edição = maior fighters-vN carregado. Contagens vêm dos dados. */
  releaseStamp() {
    let edition = 0;
    let balance = 0;
    document.querySelectorAll('script[src]').forEach((node) => {
      const src = node.getAttribute('src') || '';
      const fighter = src.match(/fighters-v(\d+)\.js/);
      const bal = src.match(/powers-balance-v(\d+)\.js/);
      if (fighter) edition = Math.max(edition, Number(fighter[1]));
      if (bal) balance = Math.max(balance, Number(bal[1]));
    });
    const list = typeof FIGHTERS !== 'undefined' ? FIGHTERS : [];
    const selectable = list.filter((f) => f && f.id !== 'boneco-treino').length;
    const arenas = typeof STAGE_LIST !== 'undefined' && STAGE_LIST ? STAGE_LIST.length : 0;
    return { edition, balance, selectable, arenas, total: list.length };
  },
  applyRelease() {
    const r = this.releaseStamp();
    const edition = r.edition ? `V${r.edition}` : 'V20';
    const tagline = document.querySelector('.tagline');
    if (tagline) tagline.textContent = `EDIÇÃO ${edition} · ${r.selectable} LUTADORES · ${r.arenas} ARENAS`;
    document.title = `DS Fighters — Edição ${edition}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `DS Fighters: jogo de luta arcade retrô 2D com ${r.selectable} lutadores. O torneio termina no chefe KERNOR. ${r.arenas} arenas, 2x2 e online.`);
    return r;
  },
  /* Lutadores fora do online (lista no RoomCore, a mesma que o servidor usa). */
  onlineBanned(id) {
    const list = (typeof RoomCore !== 'undefined' && RoomCore.ONLINE_BANNED) || ['iales', 'kernor'];
    return list.includes(id);
  },
  /* Lutador proibido no modo: online (lista do RoomCore), o IALES só no
     Versus, e todo personagem de código fora do torneio — mesmo liberado.
     O Kernor continua só como chefe da chave, não como lutador do jogador. */
  modeBanned(id, mode) {
    if (mode === 'online') return this.onlineBanned(id);
    if (id === 'iales' && mode !== 'versus') return true;
    if (mode === 'arcade' && typeof Profile !== 'undefined' && Profile.SECRET_IDS.includes(id)) return true;
    return false;
  },
  startDemo() {
    const ids = FIGHTERS.filter((f) => Profile.isUnlocked(f.id)).map((f) => f.id);
    const a = ids[(Math.random() * ids.length) | 0];
    let b = ids[(Math.random() * ids.length) | 0];
    if (b === a) b = ids[(ids.indexOf(a) + 1) % ids.length];
    this.$('stage-wrap').classList.add('on', 'demo');
    this.game.start({ mode: 'demo', teams: [[a], [b]], stage: 'random', timer: 180, roundsToWin: 9 });
    AudioSys.stopMusic();
    AudioSys.playMusic('menu');
    HUD.hide();
  },
  menuGo(go) {
    AudioSys.select();
    if (go === 'tutorial') return this.startTutorial();
    if (go === 'events') { this.applyEventSkin(); return this.show('events'); }
    if (go === 'shadow') {
      /* VOCÊ MESMO: so depois de vencer a si mesmo uma vez no torneio */
      if (!Profile.hasAchievement('eu-mesmo')) { AudioSys.back(); this.toast('Vença a si mesmo no torneio para liberar.'); return; }
      return this.startFlow('shadow');
    }
    if (['arcade', 'versus', 'tag', 'training', 'survival'].includes(go)) return this.startFlow(go);
    this.show(go, false);
  },

  /* ---------- TREINO GUIADO (so para jogadores novos) ---------- */
  startTutorial() {
    AudioSys.select();
    if (this.game.running) this.game.stop();
    HUD.hide();
    this.flow = Object.assign({
      mode: 'training',
      need: 1,
      picks: [[], []],
      cursor: [0, 1],
      done: [false, false],
      p2Human: false,
      picking: 0,
      stage: 'treino-dojo',
      arcadeStep: 0,
      tutorial: true,
    }, {});
    this.$('stage-wrap').classList.remove('on');
    this.show('select');
    AudioSys.voice('choose');
  },
  tutorial: null,
  tutorialBegin() {
    /* Passos guiados: cada um tem objetivo + detector. Concluiu tudo = jogador
       deixa de ser novo (Profile tutorialDone) e o botao some do menu. */
    const T = this;
    /* texto do passo conforme o aparelho: teclado/mouse no PC, joystick/botoes no celular */
    const mob = typeof document !== 'undefined' && document.body && document.body.classList.contains('mobile');
    const K = (pc, touch) => (mob ? touch : pc);
    this.tutorial = {
      step: 0,
      moved: 0, lastX: null, jumps: 0, crouches: 0, punches: 0, kicks: 0,
      chains: 0, casts: 0, ults: 0, blocks: 0, jumpCancels: 0, doubleJumps: 0, dashes: 0,
      steps: [
        { title: 'ANDE', sub: K('A / D (ou setas) para mover', 'Arraste o joystick para os lados'), done: () => T.tutorial.moved > 260 },
        { title: 'PULE', sub: K('W para pular', 'Joystick para CIMA para pular'), done: () => T.tutorial.jumps > 0 },
        { title: 'AGACHE', sub: K('S para agachar', 'Joystick para BAIXO para agachar'), done: () => T.tutorial.crouches > 20 },
        { title: 'SOCOS', sub: K('Botao esquerdo do mouse (ou J) — de 3 socos', 'Toque em SOCO 3 vezes'), done: () => T.tutorial.punches >= 3 },
        { title: 'CHUTES', sub: K('Botao direito do mouse (ou K) — de 3 chutes', 'Toque em CHUTE 3 vezes'), done: () => T.tutorial.kicks >= 3 },
        { title: 'COMBO', sub: K('No acerto, encadeie soco-soco-chute (combo-alvo)', 'Acertou? Emende SOCO, SOCO, CHUTE'), done: () => T.tutorial.chains >= 2 },
        { title: 'HABILIDADE', sub: K('Teclas 1 e 2 — solte duas habilidades', 'Toque nos botões 1 e 2 (habilidades)'), done: () => T.tutorial.casts >= 2 },
        { title: 'ULTIMATE', sub: K('Tecla 5 — solte a ultimate', 'Toque no botão 5 (ultimate)'), done: () => T.tutorial.ults >= 1 },
        { title: 'BLOQUEIO', sub: K('Segure para tras perto do boneco para bloquear', 'Segure o joystick para TRÁS perto do boneco'), done: () => T.tutorial.blocks > 30 },
        { title: 'JUMP-CANCEL', sub: K('Acerte um soco e aperte W na hora do hit', 'Acerte um SOCO e jogue o joystick pra cima na hora'), done: () => T.tutorial.jumpCancels >= 1 },
        { title: 'DOUBLE JUMP', sub: K('No ar, aperte W de novo — pulo extra pra todos', 'No ar, joystick pra cima de novo'), done: () => T.tutorial.doubleJumps >= 1 },
        { title: 'DASH', sub: K('Toque duas vezes A ou D para o dash', 'Toque o joystick 2 vezes rápido pro lado'), done: () => T.tutorial.dashes >= 1 },
      ],
    };
    this.tutorialBanner();
  },
  tutorialBanner() {
    const t = this.tutorial;
    if (!t) return;
    const st = t.steps[t.step];
    if (!st) { this.tutorialFinish(); return; }
    UI.banner('TREINO ' + (t.step + 1) + '/' + t.steps.length + ': ' + st.title, '#7dff9a', st.sub);
  },
  tutorialFinish() {
    Profile.grantAchievement('dojo');
    this.tutorial = null;
    Profile.setting('tutorialDone', true);
    const bt = this.$('btn-tutorial');
    if (bt) bt.hidden = true;
    UI.banner('TREINO CONCLUÍDO!', '#ffd27d', 'Voce ja sabe jogar — boa sorte nas lutas!');
    AudioSys.voice('win');
    /* do treino direto pra PRIMEIRA LUTA (CPU facil, mesmo lutador) — o novato
       nao se perde no monte de modos do menu */
    setTimeout(() => this.offerFirstFight(), 2600);
  },
  offerFirstFight() {
    if (typeof document === 'undefined' || document.getElementById('first-fight')) return;
    const g = this.game;
    const me = g && g.activeOf && g.activeOf(0) ? g.activeOf(0).def.id : 'jess';
    const box = document.createElement('div');
    box.id = 'first-fight';
    box.className = 'panel first-fight';
    box.innerHTML = '<h2>PRONTO PRA LUTAR?</h2><p class="sub">Uma luta de verdade contra a CPU no fácil, com o seu lutador.</p>'
      + '<div class="row"><button class="nav btn primary" id="ff-go" type="button">PRIMEIRA LUTA</button>'
      + '<button class="nav btn" id="ff-stay" type="button">CONTINUAR TREINANDO</button></div>';
    (document.getElementById('app') || document.body).appendChild(box);
    const close = () => box.remove();
    box.querySelector('#ff-stay').onclick = () => { AudioSys.back(); close(); };
    box.querySelector('#ff-go').onclick = () => {
      AudioSys.select(); close();
      const rival = (FIGHTERS.find((d) => !d.secret && d.id !== me && d.id !== 'boneco-treino') || { id: 'larper' }).id;
      this.launch({ mode: 'versus', teams: [[me], [rival]], stage: 'random', cpu: [false, true], difficulty: 0, roundsToWin: 2, timer: 99, pets: [Profile.petFor(0), PETS[0]] });
    };
    setTimeout(() => { const b = box.querySelector('#ff-go'); if (b) b.focus(); }, 30);
  },
  tutorialTick() {
    const t = this.tutorial;
    const g = this.game;
    if (!t || !g || !g.running || g.mode !== 'training' || this.screen !== 'fight') return;
    const f = g.activeOf(0);
    if (!f) return;
    // detectores
    if (t.lastX != null) t.moved += Math.abs(f.x - t.lastX);
    t.lastX = f.x;
    if (!f.onGround && f.vy < -6) t.jumps++;
    if (f._doubleJumped && !t._dj) { t.doubleJumps++; t._dj = true; }
    if (!f._doubleJumped) t._dj = false;
    if ((f.state === 'dash' || f.state === 'backdash') && !t._dash) { t.dashes++; t._dash = true; }
    if (f.state !== 'dash' && f.state !== 'backdash') t._dash = false;
    if (f.crouching || f.state === 'crouch') t.crouches++;
    /* Conta cada golpe no INICIO dele (transicao de kind) — robusto contra
       golpes sobrepostos e hitstop. */
    if (f.attack) {
      const k = f.attack.kind;
      if (k !== t._lastAtk) {
        t._lastAtk = k;
        if (k === 'punch' || k === 'cpunch' || k === 'jpunch') t.punches++;
        if (k === 'kick' || k === 'ckick' || k === 'jkick') t.kicks++;
      }
    } else t._lastAtk = null;
    if (f.chain > t._lastChain) t.chains = Math.max(t.chains, f.chain);
    t._lastChain = f.chain;
    const ev = g.events;
    if (ev.length > (t._evLen || 0)) {
      for (let i = t._evLen || 0; i < ev.length; i++) {
        const e = ev[i];
        if (e.t === 'cast') { t.casts++; if (e.who === 0 && g.activeOf(0).currentKit()[4] && e.name === g.activeOf(0).currentKit()[4].name) t.ults++; }
      }
    }
    t._evLen = ev.length;
    if (f.blocking) t.blocks++;
    if (!f.onGround && t._wasAttacking) t.jumpCancels++;
    t._wasAttacking = !!(f.attack && f.hasHit);
    // avanca o passo
    const st = t.steps[t.step];
    if (st && st.done()) { t.step++; AudioSys.select(); this.tutorialBanner(); }
  },

  /* ---------- fluxo de seleção ---------- */
  startFlow(mode, extra) {
    if (typeof SpriteGen !== 'undefined' && SpriteGen.preloadAll) SpriteGen.preloadAll(); /* aquece os 46 sprites */
    if (this.game.running) this.game.stop();
    HUD.hide();
    this.flow = Object.assign({
      mode,
      need: mode === 'tag' ? 2 : 1,
      picks: [[], []],
      cursor: [0, 1],
      done: [false, false],
      p2Human: false,
      picking: 0,
      stage: mode === 'training' ? 'treino-dojo' : 'random',
      arcadeStep: 0,
    }, extra || {});
    this.$('stage-wrap').classList.remove('on');
    this.show('select');
    AudioSys.voice('choose');
  },
  enter_select() {
    const f = this.flow;
    this._selFilter = this._selFilter || 'all';
    this._selQuery = '';
    this.buildSelGrid();
    this.bindSelTools();
    this.renderSelect();
    this.startSelectBg();
  },
  /* Monta a grade de lutadores ja aplicando busca/filtro/favoritos. */
  buildSelGrid() {
    const f = this.flow;
    const grid = this.$('sel-grid');
    if (!grid) return;
    const slots = this.selectSlots();
    const favs = new Set(Profile.setting('favFighters') || []);
    grid.innerHTML = slots.map((i) => {
      if (i >= FIGHTERS.length) {
        return `<button class="cell random" data-i="-1" aria-label="Aleatório"><span class="face q">?</span><span class="nm">ALEATÓRIO</span><span class="cur c1"></span><span class="cur c2"></span></button>`;
      }
      const d = FIGHTERS[i];
      const offline = UI.modeBanned(d.id, f.mode);
      const tourneyCode = f.mode === 'arcade' && typeof Profile !== 'undefined' && Profile.SECRET_IDS.includes(d.id);
      const lock = f.mode === 'training' ? false : (offline || !Profile.isUnlocked(d.id));
      /* Foto SO aparece para lutadores desbloqueados — travado e silhueta de
         interrogacao, sem vazar nem a cara nem o sprite (pedido do dono).
         O busto vem do atlas gerado a partir do idle real, na mesma escala. */
      /* recompensa de login: a foto aparece (isca), com cadeado LOGIN */
      const loginLock = lock && !offline && Profile.isLoginLocked(d.id);
      const thumb = lock && !loginLock ? '' : rosterPortraitStyle(d.id);
      const showFace = thumb && (!lock || loginLock);
      const lockLabel = loginLock ? 'Faça login para liberar' : tourneyCode ? 'Não entra no torneio' : 'Bloqueado — use um código';
      return `<button class="cell ${lock ? 'locked' : ''}${loginLock ? ' login-lock' : ''} ${d.secret ? 'secret' : ''}" data-i="${i}" aria-label="${lock ? lockLabel : d.name}">
        <span class="face${lock && !loginLock ? ' q' : ''}${showFace ? ' roster-portrait' : ''}" ${showFace ? `style="${thumb}"` : ''} aria-hidden="true">${lock && !loginLock ? '?' : ''}</span>
        <span class="nm">${lock && !loginLock ? (tourneyCode && Profile.isUnlocked(d.id) ? d.name.split(' ')[0] : '???') : d.name.split(' ')[0]}</span>
        ${lock ? `<span class="lk">&#128274;<small>${loginLock ? 'LOGIN' : tourneyCode ? 'FORA' : 'CÓDIGO'}</small></span>` : d.secret ? '<span class="sx">SECRETO</span>' : d.loginReward ? '<span class="sx">CONTA</span>' : ''}${!lock && typeof Balance !== 'undefined' && Balance.buffFor(d) ? '<span class="sx buff">BUFF</span>' : ''}
        <span class="favbtn${favs.has(d.id) ? ' on' : ''}" role="button" tabindex="-1" data-fav="${d.id}" title="Favoritar (tecla F)" aria-label="Favoritar ${d.id}">★</span>
        <span class="cur c1"></span><span class="cur c2"></span>
      </button>`;
    }).join('');
    const empty = this.$('sel-empty');
    if (empty) empty.hidden = slots.length > 1;
    grid.querySelectorAll('.cell').forEach((c) => {
      c.addEventListener('click', () => {
        const i = +c.dataset.i;
        const who = this.selWho();
        f.cursor[who] = i < 0 ? FIGHTERS.length : i;
        this.selConfirm(who);
      });
      c.addEventListener('mouseenter', () => { const who = this.selWho(); f.cursor[who] = +c.dataset.i < 0 ? FIGHTERS.length : +c.dataset.i; this.renderSelect(); });
    });
    grid.querySelectorAll('.favbtn').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); this.toggleFav(b.dataset.fav); this.refreshSelGrid(); });
    });
  },
  /* Barra de busca + chips de filtro (todos/liberados/secretos/favoritos). */
  bindSelTools() {
    const search = this.$('sel-search');
    if (search) {
      search.value = this._selQuery || '';
      search.addEventListener('input', () => { this._selQuery = search.value; this.refreshSelGrid(); });
    }
    const chips = this.$('sel-chips');
    if (chips) {
      chips.querySelectorAll('.chip').forEach((ch) => {
        ch.classList.toggle('on', ch.dataset.f === (this._selFilter || 'all'));
        ch.addEventListener('click', () => {
          this._selFilter = ch.dataset.f;
          chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === ch));
          AudioSys.cursor();
          this.refreshSelGrid();
        });
      });
    }
  },
  /* Reaplica busca/filtro e garante que o cursor aponte pra uma celula visivel. */
  refreshSelGrid() {
    const f = this.flow;
    if (!f) return;
    const slots = this.selectSlots();
    [0, 1].forEach((who) => { if (!slots.includes(f.cursor[who])) f.cursor[who] = slots[0]; });
    this.buildSelGrid();
    this.renderSelect();
  },
  toggleFav(id) {
    const set = new Set(Profile.setting('favFighters') || []);
    const adding = !set.has(id);
    if (adding) set.add(id); else set.delete(id);
    Profile.setting('favFighters', [...set]);
    if (adding && set.size >= 5 && typeof Profile !== 'undefined') Profile.grantAchievement('favoritos-5');
    AudioSys.select();
    const d = FIGHTERS.find((x) => x.id === id);
    this.toast((adding ? '★ ' : '☆ ') + (d ? d.name : id) + (adding ? ' entrou nos favoritos' : ' saiu dos favoritos'));
  },
  /* Palco real animado atras da selecao: StageRenderer + Weather num canvas
     proprio com rAF proprio (o loop principal so renderiza durante a luta). */
  startSelectBg() {
    this.stopSelectBg();
    const cv = this.$('select-live');
    if (!cv || !cv.getContext || typeof StageRenderer === 'undefined' || typeof Weather === 'undefined' || typeof STAGE_LIST === 'undefined' || !STAGE_LIST.length) return;
    /* meia resolucao + metade da taxa: o fundo fica atras de um veu escuro,
       entao 480x270 a 30fps sobra — nao gasta GPU dupla com o demo atras */
    const W = 480, H = 270;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const f = this.flow;
    /* Palco ao vivo atras da selecao: se o fluxo ja tem arena FIXA (voltou da
       tela de arenas, ou modo treino), mostra ela direto; se for "random",
       cicla entre os palcos a cada ~9s para mostrar o jogo inteiro. */
    const fixed = (f && f.stage && f.stage !== 'random') ? STAGE_LIST.find((s) => s.id === f.stage) : null;
    let def = fixed || STAGE_LIST[(Math.random() * STAGE_LIST.length) | 0];
    let stage = null, weather = null;
    const reduced = Profile.reducedMotion();
    const q = (typeof Profile !== 'undefined' && Profile.setting('quality')) || 'medium';
    const tag = this.$('sel-stage-tag');
    const build = () => {
      stage = new StageRenderer(def, W, H, Math.round(H * 0.85));
      const stub = {
        W, H, rnd: Math.random, reduced, stageDef: def,
        audio: { loop() {}, play() {}, voice() {} },
        announce() {}, splash() {}, floatText() {},
        fighters: () => [], strikes: [], onWeather: null,
      };
      stage.game = stub;
      weather = new Weather(stub, def);
      stub.weather = weather; /* o palco desenha o ceu do clima (aurora) atras de tudo */
      stub.stage = stage;
      weather.roll();
      this._selBgStage = def.id;
      if (tag) {
        const wi = (typeof WEATHER_INFO !== 'undefined' && WEATHER_INFO[weather.kind]) || null;
        tag.textContent = '▶ AO VIVO · ' + def.name + (wi ? ' · ' + wi.icon + ' ' + wi.name : '');
      }
    };
    build();
    let t = 0;
    const paint = () => {
      t++;
      if (!fixed && q !== 'low' && t % 540 === 0) {
        /* arena aleatoria: troca de palco a cada ~9s */
        def = STAGE_LIST[(Math.random() * STAGE_LIST.length) | 0];
        build();
      }
      try {
        weather.update(false);
        stage.update(weather);
        ctx.clearRect(0, 0, W, H);
        const camX = reduced ? 0 : Math.sin(t * 0.005) * 0.6;
        stage.drawBack(ctx, camX, 0);
        ctx.save();
        ctx.translate(0, stage.groundY);
        weather.draw(ctx);
        ctx.restore();
        if (stage.drawForeground && q !== 'low') stage.drawForeground(ctx, camX);
        stage.drawAmbient(ctx);
        stage.drawVignette(ctx);
      } catch (e) { /* fundo do menu nunca pode quebrar a selecao */ }
    };
    let skip = 0;
    const draw = () => {
      if (!this._selBg || this.screen !== 'select') return;
      this._selBgRaf = requestAnimationFrame(draw);
      if ((skip++ % 2) === 0) paint(); /* 30fps no fundo ao vivo */
    };
    this._selBg = true;
    if (q === 'low' || reduced) paint(); /* qualidade baixa/reduzido: 1 frame estatico, sem gastar rAF */
    else this._selBgRaf = requestAnimationFrame(draw);
  },
  stopSelectBg() {
    if (this._selBgRaf) cancelAnimationFrame(this._selBgRaf);
    this._selBgRaf = 0;
    this._selBg = null;
  },
  selWho() {
    const f = this.flow;
    if (f.p2Human) return f.done[0] && !f.done[1] ? 1 : 0;
    return f.done[0] ? 1 : 0;
  },
  selTitle() {
    const f = this.flow;
    const who = this.selWho();
    if (f.mode === 'online') return 'ESCOLHA SEU LUTADOR';
    if (f.mode === 'arcade') return 'ESCOLHA SEU LUTADOR';
    if (f.mode === 'shadow') return 'QUEM VOCÊ VAI ENFRENTAR?';
    if (who === 1 && !f.p2Human) return f.mode === 'training' ? 'ESCOLHA O BONECO DE TREINO' : 'ESCOLHA O ADVERSÁRIO (CPU)';
    return who === 0 ? 'JOGADOR 1, ESCOLHA' : 'JOGADOR 2, ESCOLHA';
  },
  renderSelect() {
    const f = this.flow;
    this.$('sel-title').textContent = this.selTitle();
    const cells = this.$('sel-grid').querySelectorAll('.cell');
    cells.forEach((c) => {
      const slot = this.cellSlot(c);
      c.classList.toggle('p1', f.cursor[0] === slot && !f.done[0]);
      c.classList.toggle('p2', f.cursor[1] === slot && (f.p2Human || f.done[0]) && !f.done[1] && f.mode !== 'arcade' && f.mode !== 'online' && f.mode !== 'shadow');
      const picked = f.picks[0].includes(slot) || f.picks[1].includes(slot);
      c.classList.toggle('picked', picked);
    });
    this.scrollSelectCursor(this.selWho());
    [0, 1].forEach((ti) => this.renderCard(ti));
    const keys = f.p2Human ? 'P1: WASD + Enter confirma, Backspace volta · P2: setas + J confirma, K volta' : 'WASD ou controle movem · Enter confirma · Backspace volta · <b>/</b> busca · <b>F</b> favorito';
    this.$('sel-help').innerHTML = keys + (f.mode === 'versus' || f.mode === 'tag' ? (f.p2Human ? '' : ' · <b>Jogador 2: aperte J para entrar</b>') : '') + ' · <b>Esc</b> menu';
    if (document.body.classList.contains('mobile')) this.$('sel-help').textContent = 'Toque no lutador para escolher. A próxima escolha será o adversário ou parceiro, conforme o modo.';
  },
  renderCard(ti) {
    const f = this.flow;
    const el = this.$('card-' + ti);
    const solo = f.mode === 'arcade' || f.mode === 'online' || f.mode === 'shadow';
    if (ti === 1 && solo) {
      if (f.mode === 'shadow') {
        el.innerHTML = `<div class="card-empty shadow-card"><b>VOCÊ MESMO</b><p>A sombra do lutador que você escolher. Ela lê tudo e pune cada erro.</p><p>Pegue os fragmentos de memória ou deixe-os cair para paralisá-la por 10 s. 3 vidas, 10 minutos.</p></div>`;
      } else if (f.mode === 'arcade') {
        const nBuff = FIGHTERS.filter((d) => d.id !== 'boneco-treino' && Balance.buffFor(d)).length;
        el.innerHTML = `<div class="card-empty"><b>TORNEIO ATÉ O CHEFE</b><p>Larper e Cyber Psicopata (médio), Rafael e Dev Senior (difícil), Lyra e Nimbo (extremo), depois o chefe.</p><p>6 mapas exclusivos · Chefe: ${Profile.isUnlocked('kernor') ? 'KERNOR' : '???'} na Fortaleza, IA extrema. Vencer libera o Kernor.</p><p><b>${nBuff} lutadores fracos têm BUFF permanente</b> (+HP/+força, badge BUFF) — no torneio e em qualquer modo!</p></div>`;
      } else el.innerHTML = `<div class="card-empty"><b>ONLINE</b><p>O adversário escolhe no computador dele.</p></div>`;
      return;
    }
    const idx = f.cursor[ti];
    const hasCursor = ti === 0 || f.p2Human || f.done[0];
    const pickedIds = f.picks[ti].map((k) => FIGHTERS[k] && FIGHTERS[k].id);
    if (!hasCursor && !f.picks[ti].length) {
      el.innerHTML = `<div class="card-empty"><b>${ti === 0 ? 'JOGADOR 1' : 'CPU / JOGADOR 2'}</b><p>Aguardando…</p></div>`;
      return;
    }
    const d = FIGHTERS[idx] || null;
    const tourneyCode = !!(d && f.mode === 'arcade' && Profile.SECRET_IDS.includes(d.id));
    const lock = d && (tourneyCode || !Profile.isUnlocked(d.id));
    const isRandom = idx >= FIGHTERS.length;
    const kit = d ? POWERS[d.id] : null;
    const st = d ? d.stats : null;
    const bar = (label, v, max) => `<div class="sb"><span>${label}</span><i style="--v:${Math.min(1, v / max)}"></i></div>`;
    const keyFor = ti === 1 && f.p2Human ? 1 : 0;
    el.innerHTML = `
      <div class="who">${ti === 0 ? 'P1' : f.p2Human ? 'P2' : f.mode === 'training' ? 'BONECO' : 'CPU'}${f.need > 1 ? ` · ${f.picks[ti].length}/${f.need}` : ''}</div>
      <div class="picked-row">${pickedIds.map((id) => `<span style="background-image:url(${SpriteGen.faceUrl(id)})"></span>`).join('')}</div>
      ${isRandom ? `<div class="big-sprite q">?</div><h3>ALEATÓRIO</h3><p class="bio">Deixe o destino escolher.</p>` : lock && Profile.isLoginLocked(d.id) ? `<div class="big-sprite login-lock" style="background-image:url(${SpriteGen.url(d.id)})"></div><h3 style="--c:${d.colors.accent}">${d.name}</h3><p class="bio"><b>🔒 FAÇA LOGIN PARA LIBERAR.</b> Crie sua conta com email no menu principal e ele é seu (junto com a Raposa do Firefox).</p>` : lock ? `<div class="big-sprite locked"></div><h3>${tourneyCode && Profile.isUnlocked(d.id) ? d.name : '???'}</h3><p class="bio">${tourneyCode ? 'Personagem de código. Não pode ser escolhido no torneio. O Kernor continua só como chefe final.' : 'Lutador secreto. Resgate um código no menu para liberar.'}</p>` : `
      <div class="big-sprite" style="background-image:url(${SpriteGen.url(d.id)})"></div>
      <h3 style="--c:${d.colors.accent}">${d.name}</h3>
      <div class="ttl">${d.title}</div>
      ${SIGNATURES[d.id] ? `<div class="trait" title="${String(SIGNATURES[d.id].desc).replace(/"/g, '&quot;')}"><b>${SIGNATURES[d.id].trait}</b><small>${SIGNATURES[d.id].desc}</small></div>` : ''}
      <p class="bio">${d.bio}</p>
      ${d.quotes && d.quotes.intro && d.quotes.intro.length ? `<div class="quotes">“${d.quotes.intro[0]}”</div>` : ''}
      <div class="statbars">${bar('FORÇA', st.power, 1.7)}${bar('VELOC.', st.speed, 1.5)}${bar('ALCANCE', (d.moves && d.moves.kick && d.moves.kick.range) || 64, 96)}</div>
      <div class="theme">${kit ? kit.theme : ''}${kit && kit.autoAim ? ' · <b>AUTO AIM</b>' : ''}</div>
      <ul class="kit">${(kit ? kit.powers : []).slice(0, (d.id === 'iales' || d.id === 'kernor') ? 10 : 5).map((p, i) => `
        <li class="${p.slot}"><span class="ico" style="${Art.css('abil:' + d.id, p.row, 1, 34)}"></span>
          <span class="tx"><b>${p.name}</b><small>${SLOT_NAMES[p.slot] || p.slot} · ${KIND_NAMES[p.kind] || ''}</small><em>${p.desc || ''}</em></span>
          <kbd>${Input.label(keyFor, 'a' + i)}</kbd></li>`).join('')}</ul>`}`;
    const spr = el.querySelector('.big-sprite:not(.q):not(.locked)');
    if (spr) spr.classList.toggle('ready', f.done[ti]);
  },
  /* Índice gravado no cursor e em picks: posição em FIGHTERS, ou
     FIGHTERS.length para a célula ALEATÓRIO. A grade esconde o boneco,
     então o índice visual (0, 1, 2…) não é o índice do elenco. */
  cellSlot(cell) {
    const i = +cell.dataset.i;
    return i < 0 ? FIGHTERS.length : i;
  },
  selectSlots() {
    return selFilterSlots(FIGHTERS, this._selQuery || '', this._selFilter || 'all', Profile.setting('favFighters') || [], (id) => Profile.isUnlocked(id));
  },
  selectCols() {
    const grid = this.$('sel-grid');
    if (!grid) return 7;
    const parts = getComputedStyle(grid).gridTemplateColumns.split(' ').filter((part) => part && part !== 'none');
    return parts.length || 7;
  },
  scrollSelectCursor(who) {
    const grid = this.$('sel-grid');
    const wrap = grid && grid.parentElement;
    const f = this.flow;
    if (!grid || !wrap || !f) return;
    const want = f.cursor[who];
    const cell = [...grid.querySelectorAll('.cell')].find((c) => this.cellSlot(c) === want);
    if (!cell) return;
    const cr = cell.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    if (wr.height < 8) return;
    if (cr.top < wr.top + 2) wrap.scrollTop -= wr.top - cr.top + 6;
    else if (cr.bottom > wr.bottom - 2) wrap.scrollTop += cr.bottom - wr.bottom + 6;
  },
  selMove(who, dx, dy) {
    const f = this.flow;
    const slots = this.selectSlots();
    const cols = this.selectCols();
    let pos = slots.indexOf(f.cursor[who]);
    if (pos < 0) pos = 0;
    const rows = Math.max(1, Math.ceil(slots.length / cols));
    let col = pos % cols;
    let row = Math.floor(pos / cols);
    if (dx) {
      col += dx;
      if (col < 0) { col = cols - 1; row -= 1; }
      else if (col >= cols) { col = 0; row += 1; }
    }
    if (dy) row += dy;
    if (row < 0) row = rows - 1;
    if (row >= rows) row = 0;
    let next = row * cols + Math.min(col, cols - 1);
    if (next >= slots.length) next = slots.length - 1;
    if (next < 0) next = 0;
    f.cursor[who] = slots[next];
    AudioSys.cursor();
    this.renderSelect();
  },
  selConfirm(who) {
    const f = this.flow;
    if (f.done[who]) return;
    let i = f.cursor[who];
    if (i >= FIGHTERS.length) {
      const pool = FIGHTERS.map((d, k) => k).filter((k) => FIGHTERS[k].id !== 'boneco-treino' && !this.modeBanned(FIGHTERS[k].id, f.mode) && (f.mode === 'training' || Profile.isUnlocked(FIGHTERS[k].id)) && !f.picks[who].includes(k));
      i = pool[(Math.random() * pool.length) | 0];
    }
    const d = FIGHTERS[i];
    if (this.modeBanned(d.id, f.mode)) {
      AudioSys.back();
      const msg = f.mode === 'arcade' && Profile.SECRET_IDS.includes(d.id)
        ? 'Personagem de código não entra no torneio. O Kernor segue como chefe.'
        : d.name + (f.mode === 'online' ? ' não pode ser usado no online.' : ' só pode ser usado no modo Versus.');
      this.toast(msg);
      return;
    }
    if (f.mode !== 'training' && Profile.isLoginLocked(d.id)) { AudioSys.back(); this.loginNudge(true); return; }
    if (f.mode !== 'training' && !Profile.isUnlocked(d.id)) { AudioSys.back(); this.toast('Lutador secreto — resgate um código no menu!'); return; }
    if (f.picks[who].includes(i)) { AudioSys.back(); return; }
    f.picks[who].push(i);
    AudioSys.select();
    AudioSys.play('whoosh', { vol: 0.5 });
    AudioSys.sayCharacter(d.name);
    if (f.picks[who].length >= f.need) f.done[who] = true;
    if (f.mode === 'arcade' || f.mode === 'online' || f.mode === 'shadow') {
      if (f.done[0]) return this.afterSelect();
    } else if (f.mode === 'training') {
      if (f.p2Human) { if (f.done[0] && f.done[1]) return this.afterSelect(); }
      else { this.autoDummy(); if (f.done[0]) return this.afterSelect(); }
    } else if (f.done[0] && f.done[1]) return this.afterSelect();
    if (!f.p2Human && f.done[0] && who === 0) {
      const slots = this.selectSlots().filter((slot) => slot < FIGHTERS.length);
      const at = Math.max(0, slots.indexOf(i));
      f.cursor[1] = slots[(at + 3) % slots.length];
    }
    this.renderSelect();
  },
  autoDummy() {
    // Treino: o boneco de madeira entra automaticamente como P2 — parado
    // no campo, so reage quando recebe golpes.
    const f = this.flow;
    if (f.mode !== 'training' || f.done[1]) return;
    const idx = FIGHTERS.findIndex((d) => d.id === 'boneco-treino');
    f.picks[1] = [idx];
    f.done[1] = true;
  },
  selBack(who) {
    const f = this.flow;
    if (f.picks[who].length) { f.picks[who].pop(); f.done[who] = false; AudioSys.back(); this.renderSelect(); return; }
    if (!f.p2Human && who === 1 && f.picks[0].length) { f.picks[0].pop(); f.done[0] = false; AudioSys.back(); this.renderSelect(); return; }
    if (f.mode === 'online') { this.show('online'); return; }
    this.toMenu();
  },
  selectKeys(m) {
    const f = this.flow;
    /* digitando na busca: so o Esc tira o foco (WASD nao move o cursor) */
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) {
      if (Input.hit(['Escape'])) ae.blur();
      return;
    }
    if (Input.hit(['Slash'])) { const si = this.$('sel-search'); if (si) { si.focus(); si.select(); } return; }
    if (Input.hit(['KeyF'])) {
      const i = f.cursor[this.selWho()];
      if (i < FIGHTERS.length && FIGHTERS[i] && FIGHTERS[i].id !== 'boneco-treino') { this.toggleFav(FIGHTERS[i].id); this.refreshSelGrid(); }
      return;
    }
    const P = Input.p2;
    const p0 = Input.pad(0);
    const p1 = Input.pad(1);
    const twoPads = Input.padCount > 1;
    // jogador 2 entra
    if ((f.mode === 'versus' || f.mode === 'tag') && !f.p2Human && (Input.hit(P.punch) || p1.confirmHit)) {
      f.p2Human = true;
      this.toast('JOGADOR 2 ENTROU!');
      AudioSys.select();
      this.renderSelect();
      return;
    }
    const w0 = this.selWho();
    // P1 (setas + A / Enter / pad 0)
    const p1Who = f.p2Human ? 0 : w0;
    if (!f.done[p1Who] || !f.p2Human) {
      if (Input.hit(['KeyA', 'ArrowLeft']) || p0.leftHit) this.selMove(p1Who, -1, 0);
      if (Input.hit(['KeyD', 'ArrowRight']) || p0.rightHit) this.selMove(p1Who, 1, 0);
      if (Input.hit(['KeyW', 'ArrowUp']) || p0.upHit) this.selMove(p1Who, 0, -1);
      if (Input.hit(['KeyS', 'ArrowDown']) || p0.downHit) this.selMove(p1Who, 0, 1);
      if (Input.hit(['Enter', 'Space']) || p0.kickHit || p0.startHit) this.selConfirm(p1Who);
      else if (Input.hit(['Backspace']) || p0.a0Hit) this.selBack(p1Who);
    }
    if (f.p2Human && this.flow === f) {
      if (Input.hit(P.left) || (twoPads && p1.leftHit)) this.selMove(1, -1, 0);
      if (Input.hit(P.right) || (twoPads && p1.rightHit)) this.selMove(1, 1, 0);
      if (Input.hit(P.up) || (twoPads && p1.upHit)) this.selMove(1, 0, -1);
      if (Input.hit(P.down) || (twoPads && p1.downHit)) this.selMove(1, 0, 1);
      if (Input.hit(P.punch) || (twoPads && p1.kickHit)) this.selConfirm(1);
      else if (Input.hit(P.kick) || (twoPads && p1.a0Hit)) this.selBack(1);
    }
    if (Input.hit(['Escape'])) this.back();
  },
  afterSelect() {
    const f = this.flow;
    if (f.mode === 'online') { Net.pickFighters(f.picks[0].map((k) => FIGHTERS[k].id)); this.show('online'); return; }
    if (f.mode === 'arcade') { this.buildArcade(); return this.showLadder(); }
    if (f.mode === 'survival') { return this.launchSurvival(); }
    if (f.mode === 'shadow') { return this.launchShadow(); }
    setTimeout(() => this.show('stage'), 250);
  },

  /* ---------- arenas ---------- */
  enter_stage() {
    const f = this.flow;
    const grid = this.$('stage-grid');
    let lastGroup = '';
    grid.innerHTML = `<button class="nav st-cell random" data-id="random"><span class="th q">?</span><span class="nm">ALEATÓRIA</span></button>` + STAGE_LIST.map((s) => {
      const thumb = s.image ? s.image : null;
      const head = s.group !== lastGroup ? ((lastGroup = s.group), `<div class="st-group">${s.group}</div>`) : '';
      return head + `<button class="nav st-cell" data-id="${s.id}"><span class="th" style="${thumb ? `background-image:url(${thumb})` : `background-image:url(${s.sheet});background-size:600% 400%;background-position:0 0`}"></span><span class="nm">${s.name}</span></button>`;
    }).join('');
    grid.querySelectorAll('.st-cell').forEach((b) => {
      const pick = () => { f.stage = b.dataset.id; this.renderStagePreview(); grid.querySelectorAll('.st-cell').forEach((x) => x.classList.toggle('on', x === b)); };
      b.addEventListener('focus', pick);
      b.addEventListener('mouseenter', pick);
      b.addEventListener('click', () => { pick(); this.$('btn-fight').focus(); });
    });
    { const dv = Profile.setting('difficulty'); this.$('opt-diff').value = String(dv == null ? 1 : AI.level(dv)); }
    this.$('lbl-diff').classList.toggle('hidden', !(f.mode !== 'training' && !f.p2Human) && f.mode !== 'training');
    this.$('lbl-dummy').classList.toggle('hidden', f.mode !== 'training');
    this.$('lbl-inf').classList.toggle('hidden', f.mode !== 'training');
    this.$('lbl-autoheal').classList.toggle('hidden', f.mode !== 'training');
    this.$('lbl-ally').classList.toggle('hidden', f.mode !== 'training');
    const cur = grid.querySelector(`[data-id="${f.stage}"]`) || grid.querySelector('.st-cell');
    setTimeout(() => cur.focus(), 40);
    this.renderStagePreview();
  },
  renderStagePreview() {
    const f = this.flow;
    const s = STAGE_LIST.find((x) => x.id === f.stage);
    const el = this.$('stage-preview');
    if (!s) { el.innerHTML = `<div class="sp-img q">?</div><h3>ARENA ALEATÓRIA</h3><p>Uma das ${STAGE_LIST.length} arenas, com clima sorteado.</p>`; return; }
    const img = s.image ? `background-image:url(${s.image})` : `background-image:url(${s.sheet});background-size:600% 400%;background-position:0 0`;
    const fauna = {
      bee: 'abelhas', bird: 'pássaros', birds: 'pássaros', butterfly: 'borboletas', butterflies: 'borboletas',
      bat: 'morcegos', fish: 'peixes', pigeons: 'pombos', cat: 'gato', dog: 'cachorro',
      dragonfly: 'libélulas', fireflies: 'vagalumes', squirrel: 'esquilo', seagull: 'gaivotas', frog: 'sapo',
    };
    const fz = [...new Set(typeof stageFauna === 'function' ? stageFauna(s) : (s.fauna || []))].map((k) => fauna[k]).filter(Boolean).join(', ');
    el.innerHTML = `<div class="sp-img ${s.sheet ? 'anim' : ''}" style="${img}"></div>
      <h3>${s.name}</h3>
      <p class="mech">${s.mech ? MECH_INFO[s.mech] || '' : 'Arena clássica.'}</p>
      <p class="wx">Clima possível: ${(s.weather || ['clear']).map((w) => WEATHER_INFO[w].icon + ' ' + WEATHER_INFO[w].name).join(' · ')}</p>
      ${fz ? `<p class="fz">Fauna: ${fz}</p>` : ''}
      ${s.blurb ? `<p class="fz">${s.blurb}</p>` : ''}
      ${s.gravity ? `<p class="fz">Gravidade ${Math.round(s.gravity * 100)}%</p>` : ''}`;
  },
  applyEventSkin() {
    const ev = typeof Events !== 'undefined' ? Events.active() : null;
    document.body.dataset.event = ev && ev.skin ? ev.skin : '';
  },
  enter_events() {
    const rows = Events.upcoming();
    const now = rows.find((r) => r.active) || rows.filter((r) => !r.live).sort((a, b) => a.daysUntil - b.daysUntil)[0];
    this.$('events-year').textContent = String(Events.today().getFullYear());
    const dias = (n) => (n === 1 ? '1 dia' : `${n} dias`);
    const stage = now && (STAGE_LIST.find((s) => s.id === now.ev.hero) || STAGE_LIST.find((s) => s.event === now.ev.id));
    const when = !now ? '' : now.live ? (now.daysLeft <= 0 ? 'Termina hoje' : `Termina em ${dias(now.daysLeft)}`) : now.active ? 'Modo teste' : `Começa em ${dias(now.daysUntil)}`;
    this.$('events-hero').innerHTML = now ? `<div class="ev-hero" data-ev="${now.ev.id}" style="${stage ? `background-image:url(${stage.image})` : ''}">${evDecor(now.ev.id, 'hero')}
      <div class="ev-hero-copy"><span>${now.ev.icon} ${now.active ? 'NO AR' : 'PRÓXIMO'}</span><h3>${now.ev.name}</h3><p>${when} · ${Events.fmt(now.window.start)} – ${Events.fmt(now.window.end)}</p></div>
    </div>` : '';
    this.$('events-upcoming').innerHTML = rows.map((r) => {
      const tag = r.active ? (r.live ? (r.daysLeft <= 0 ? 'hoje' : 'agora') : 'teste') : r.live ? 'hoje' : `em ${dias(r.daysUntil)}`;
      return `<article class="ev-card${r.active ? ' on' : ''}" data-ev="${r.ev.id}">${evDecor(r.ev.id, 'card')}<b>${r.ev.icon} ${r.ev.name}</b><small>${Events.fmt(r.window.start)} – ${Events.fmt(r.window.end)}</small><em>${tag}</em></article>`;
    }).join('');
    const activeId = now && now.active ? now.ev.id : '';
    const maps = STAGE_LIST.filter((s) => s.event);
    maps.sort((a, b) => (a.event === activeId ? 0 : 1) - (b.event === activeId ? 0 : 1));
    this.$('events-maps').innerHTML = maps.map((s) => `<button class="nav ev-map" data-id="${s.id}" data-ev="${s.event}">${evDecor(s.event, 'map')}<span class="th" style="background-image:url(${s.image})"></span><b>${s.name}</b><small>${s.blurb || ''}</small></button>`).join('');
    this.$('events-maps').querySelectorAll('.ev-map').forEach((b) => {
      b.addEventListener('click', () => {
        this.startFlow('versus', { stage: b.dataset.id });
      });
    });
  },
  confirmStage() {
    const f = this.flow;
    AudioSys.select();
    f.weather = this.$('opt-weather').value;
    f.difficulty = parseInt(this.$('opt-diff').value, 10);
    Profile.setting('difficulty', f.difficulty);
    f.dummy = this.$('opt-dummy').value;
    f.infinite = this.$('opt-inf').checked;
    f.autoHeal = this.$('opt-autoheal').checked;
    if (this.$('opt-ally').checked && f.mode === 'training') f.p2Human = true;
    this.launch();
  },
  matchConfig() {
    const f = this.flow;
    const ids = (ti) => f.picks[ti].map((k) => FIGHTERS[k].id);
    return {
      mode: f.mode,
      teams: [ids(0), ids(1)],
      stage: f.stage,
      weather: f.weather || 'random',
      difficulty: f.difficulty || 1,
      cpu: [false, !f.p2Human],
      pets: [Profile.petFor(0), f.p2Human ? Profile.petFor(1) : PETS[0]],
      dummy: f.dummy,
      autoHeal: f.mode === 'training' ? f.autoHeal !== false : false,
      infiniteLife: !!(f.customRules && f.customRules.infiniteLife),
      infiniteMeter: f.customRules ? f.customRules.infiniteMeter : f.infinite,
      roundsToWin: f.mode === 'training' ? 99 : f.customRules ? f.customRules.roundsToWin : 2,
      timer: f.customRules ? f.customRules.timer : 180,
    };
  },
  launch(cfgOverride) {
    const cfg = cfgOverride || this.matchConfig();
    this.lastCfg = cfg;
    this.showVs(cfg, () => {
      this.$('stage-wrap').classList.remove('demo');
      this.$('stage-wrap').classList.add('on');
      this.show('fight');
      if (typeof Input !== 'undefined') Input.touchUsed = false; /* cada luta comeca sem toque marcado */
      this.game.start(cfg);
      if (this.flow && this.flow.tutorial) this.tutorialBegin();
      if (cfg && cfg.mode === 'online' && typeof Net !== 'undefined' && Net.room && window.TournamentUI && typeof window.TournamentUI.matchStarted === 'function') {
        window.TournamentUI.matchStarted(Net.room.code).catch(() => {});
      }
    });
  },
  showVs(cfg, then) {
    const side = (ti) => cfg.teams[ti].map((id) => {
      const d = FIGHTERS.find((x) => x.id === id) || FIGHTERS[3]; /* id estranho nunca quebra a tela VS */
      const sheetClass = ROSTER_4X8_SPRITES.has(id) ? ' sprite-4x8' : '';
      return `<div class="vs-f"><div class="vs-sprite${sheetClass}" style="background-image:url(${SpriteGen.url(id)})"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${d.title}</small></div>`;
    }).join('');
    this.$('vs-0').innerHTML = side(0);
    this.$('vs-1').innerHTML = side(1);
    const vs1 = this.$('vs-1');
    if (vs1 && vs1.classList) vs1.classList.toggle('vs-shadow', !!cfg.shadowFight);
    if (cfg.shadowFight && vs1) {
      const id = cfg.teams[1][0];
      vs1.innerHTML = `<div class="vs-f"><div class="vs-sprite${ROSTER_4X8_SPRITES.has(id) ? ' sprite-4x8' : ''}" style="background-image:url(${SpriteGen.url(id)})"></div><b style="--c:#b98cff">VOCÊ MESMO</b><small>O seu maior inimigo</small></div>`;
    }
    const s = STAGE_LIST.find((x) => x.id === cfg.stage);
    this.$('vs-stage').textContent = s ? s.name : 'ARENA ALEATÓRIA';
    const lineEl = this.$('vs-line');
    if (lineEl) lineEl.textContent = cfg.rivalLine || '';
    this.show('vs');
    AudioSys.play('hazard', { vol: 0.7 });
    const gen = this._launchGen || 0;
    clearTimeout(this._vsTimer);
    this._vsTimer = setTimeout(() => {
      if (gen !== (this._launchGen || 0) || this.screen !== 'vs') return;
      if (typeof Input !== 'undefined' && Input.releaseAll) Input.releaseAll();
      then();
    }, Profile.reducedMotion() ? 900 : 2200);
  },
  enter_fight() {},

  /* ---------- arcade ---------- */
  buildArcade() {
    const f = this.flow;
    const me = FIGHTERS[f.picks[0][0]].id;
    f.ladder = typeof torneioLadderFor === 'function' ? torneioLadderFor(me) : [];
    f.arcadeStep = 0;
    f.tourneySecs = 0; /* RANKING: soma dos segundos de luta (vitorias e derrotas) */
    f.afterWin = false;
    f.tourneyBuffs = [];
    f.tourneyScore = 0;
    f.ranks = [];
  },
  showLadder() {
    const f = this.flow;
    const el = this.$('ladder-list');
    if (!el || !f.ladder) return;
    const done = f.afterWin ? f.arcadeStep + 1 : f.arcadeStep;
    const me = FIGHTERS[f.picks[0][0]];
    el.innerHTML = f.ladder.map((row, i) => {
      const d = row.shadow ? { name: 'VOCÊ MESMO', colors: { accent: '#b98cff' } } : (FIGHTERS.find((x) => x.id === row.id) || { name: row.id, colors: { accent: '#fff' } });
      const st = i < done ? 'done' : i === done ? 'now' : 'wait';
      const face = rosterPortraitStyle(row.id, 36);
      return `<div class="lad-row ${st}${row.boss ? ' boss' : ''}${row.shadow ? ' shadow' : ''}">
        <span class="lad-n">${row.shadow ? '?' : i + 1}</span>
        <i class="lad-face" style="${face}"></i>
        <b style="--c:${d.colors.accent}">${d.name}</b>
        <small>${row.diffName}${row.boss ? ' · CHEFE' : ''}${row.shadow ? ' · O SEU MAIOR INIMIGO' : ''}</small>
        <em>${st === 'done' ? (f.ranks[i] ? f.ranks[i].letter : 'OK') : st === 'now' ? 'AGORA' : ''}</em>
      </div>`;
    }).join('');
    const you = this.$('ladder-you');
    if (you) you.textContent = me ? me.name : '';
    const menu = this.$('btn-ladder-menu');
    if (menu) menu.onclick = () => this.toMenu();
    const vsMenu = this.$('btn-vs-menu');
    if (vsMenu) vsMenu.onclick = () => this.toMenu();
    const go = this.$('btn-ladder-go');
    const last = f.afterWin && f.arcadeStep >= f.ladder.length - 1;
    /* a luta contra si mesmo vem direto, sem bonus: e so voce */
    const nextShadow = f.afterWin && f.ladder[f.arcadeStep + 1] && f.ladder[f.arcadeStep + 1].shadow;
    if (go) {
      go.hidden = !!last;
      go.textContent = nextShadow ? 'ENFRENTAR A SI MESMO' : f.afterWin ? 'ESCOLHER BÔNUS' : 'LUTAR';
      go.onclick = () => {
        if (nextShadow) { f.arcadeStep++; f.afterWin = false; return this.launchArcade(); }
        if (f.afterWin) this.showBuffs(); else this.launchArcade();
      };
    }
    this.show('ladder');
  },
  showBuffs() {
    const f = this.flow;
    f._buffLock = false;
    const pick = typeof torneioBuffChoices === 'function' ? torneioBuffChoices(f.tourneyBuffs) : [];
    const el = this.$('buff-list');
    if (el) {
      el.innerHTML = pick.length
        ? pick.map((b) => `<button type="button" class="buff-card" data-buff="${b.id}"><span class="buff-ico">${b.ico || '+'}</span><b>${b.name}</b><small>${b.desc}</small></button>`).join('')
        : '<button type="button" class="buff-card" data-buff=""><span class="buff-ico">OK</span><b>SEGUIR</b><small>Sem bônus novo. A próxima luta começa agora.</small></button>';
      el.querySelectorAll('.buff-card').forEach((btn) => btn.addEventListener('click', () => {
        if (f._buffLock) return;
        f._buffLock = true;
        if (btn.dataset.buff) f.tourneyBuffs = (f.tourneyBuffs || []).concat(btn.dataset.buff);
        f.arcadeStep++;
        f.afterWin = false;
        if (typeof Input !== 'undefined' && Input.releaseAll) Input.releaseAll();
        this.launchArcade();
      }));
    }
    const menu = this.$('btn-buff-menu');
    if (menu) menu.onclick = () => this.toMenu();
    this.show('buffs');
  },
  launchSurvival() {
    const f = this.flow;
    const me = FIGHTERS[f.picks[0][0]].id;
    f.survivalWins = 0;
    const pool = FIGHTERS.filter((d) => d.id !== me && !d.secret).map((d) => d.id);
    f.survivalLadder = pool.sort(() => Math.random() - 0.5);
    f.survivalStep = 0;
    this.launch({
      mode: 'survival', teams: [[me], [f.survivalLadder[0]]], stage: 'random', weather: 'random',
      difficulty: Math.min(3, AI.level(f.difficulty == null ? 1 : f.difficulty)),
      cpu: [false, true], pets: [Profile.petFor(0), PETS[0]], roundsToWin: 1, timer: 99,
    });
  },
  survivalNext() {
    const f = this.flow;
    f.survivalStep++;
    if (f.survivalStep >= f.survivalLadder.length) { this.$('res-title').textContent = 'SURVIVAL COMPLETO!'; return; }
    this.launch({
      mode: 'survival', teams: [[FIGHTERS[f.picks[0][0]].id], [f.survivalLadder[f.survivalStep]]], stage: 'random', weather: 'random',
      difficulty: Math.min(3, 1 + Math.floor(f.survivalStep / 7)),
      cpu: [false, true], pets: [Profile.petFor(0), PETS[0]], roundsToWin: 1, timer: 99,
    });
  },
  launchArcade() {
    const f = this.flow;
    const me = FIGHTERS[f.picks[0][0]].id;
    const myBuff = typeof Balance !== 'undefined' ? Balance.buffFor(FIGHTERS.find((d) => d.id === me)) : null;
    if (myBuff) this.toast(`BUFF PERMANENTE: +${Math.round((myBuff.hp - 1) * 100)}% HP / +${Math.round((myBuff.power - 1) * 100)}% força — lutador fraco, vale em TODOS os modos!`, 4200);
    const row = f.ladder[f.arcadeStep] || { id: 'kernor', diff: 3, map: 5, boss: true, line: '' };
    const opp = row.id;
    const isBoss = !!row.boss;
    const tor = (typeof TORNEIO !== 'undefined' && TORNEIO.stages.length) ? TORNEIO.stages : null;
    const stageId = tor ? tor[Math.min(tor.length - 1, row.map == null ? f.arcadeStep : row.map)] : STAGE_LIST[0].id;
    let tourneyPet = Profile.petFor(0);
    if (tourneyPet && tourneyPet.id === 'pitoco') { tourneyPet = PETS[0]; this.toast('O PITOCO é proibido no torneio. Você entra sem mascote.', 3000); }
    if (row.shadow) return this.launch(this.shadowConfig('arcade', me, tourneyPet, f.tourneyBuffs, row.line));
    this.launch({
      mode: 'arcade', teams: [[me], [opp]], stage: stageId, weather: 'random',
      bossFight: isBoss,
      tourneyBuffs: (f.tourneyBuffs || []).slice(),
      rivalLine: row.line || '',
      /* A dificuldade do menu NÃO entra aqui. Cada degrau da chave tem a sua. */
      cpuDifficulty: row.diff == null ? 1 : row.diff,
      difficulty: row.diff == null ? 1 : row.diff,
      /* PITOCO e "proibido em torneio" (15 HP/s + 50% de esquiva): entra sem mascote */
      cpu: [false, true], pets: [tourneyPet, PETS[0]],
      roundsToWin: isBoss ? 2 : 1, timer: isBoss ? 180 : 99,
      music: isBoss ? 'boss' : 'battle',
    });
  },
  /* O SEU MAIOR INIMIGO: espelho sombrio, 10 min, 3 vidas, mapa aleatorio.
     'arcade' = ultima luta do torneio; 'shadow' = revanche pelo menu. */
  shadowConfig(mode, me, pet, buffs, line) {
    return {
      mode, teams: [[me], [me]], stage: 'random', weather: 'darkfog',
      shadowFight: true, bossFight: false,
      tourneyBuffs: (buffs || []).slice(),
      rivalLine: line || 'Você não pode fugir de si mesmo.',
      cpuDifficulty: 3, difficulty: 3,
      cpu: [false, true], pets: [pet || PETS[0], PETS[0]],
      roundsToWin: 1, timer: 600,
      music: 'shadow',
    };
  },
  launchShadow() {
    const f = this.flow;
    const me = FIGHTERS[f.picks[0][0]].id;
    let pet = Profile.petFor(0);
    if (pet && pet.id === 'pitoco') { pet = PETS[0]; this.toast('O PITOCO não entra nessa luta. Você vai sozinho.', 3000); }
    this.launch(this.shadowConfig('shadow', me, pet, [], 'De novo? Eu lembro de tudo da última vez.'));
  },
  arcadeNext() {
    const f = this.flow;
    f.arcadeStep++;
    this.launchArcade();
  },

  /* ---------- ACESSORIOS universais (gorro de natal etc.) ---------- */
  enter_acc() {
    const el = this.$('acc-list');
    if (!el || typeof ACC_LIST === 'undefined') return;
    el.innerHTML = ACC_LIST.map((a) => `
      <div class="acc-row${accOn(a.id) ? ' on' : ''}">
        <img class="acc-img" src="${a.src}?v=v57-acessorios" alt="" aria-hidden="true" />
        <div class="acc-info"><b>${a.icon} ${a.name}</b><small>${a.desc}</small></div>
        <button type="button" class="nav btn tiny acc-toggle" data-acc="${a.id}">${accOn(a.id) ? 'LIGADO ✓' : 'DESLIGADO'}</button>
      </div>`).join('') || '<p class="sub">Nenhum acessorio disponivel ainda.</p>';
    el.querySelectorAll('.acc-toggle').forEach((b) => b.addEventListener('click', () => { this.toggleAcc(b.dataset.acc); this.enter_acc(); }));
    const on = this.$('acc-all-on'), off = this.$('acc-all-off');
    /* "ligar todos" = 1 por lugar (o 1o de cada: gorro, oculos, faixa, fone) */
    if (on) on.onclick = () => { const seen = new Set(); ACC_LIST.forEach((a) => { if (!seen.has(a.slot)) { seen.add(a.slot); this.setAcc(a.id, true); } }); this.enter_acc(); };
    if (off) off.onclick = () => { ACC_LIST.forEach((a) => this.setAcc(a.id, false)); this.enter_acc(); };
  },
  setAcc(id, v) {
    /* 1 por lugar: ligar o bone desliga o gorro/coroa; oculos/faixa/fone convivem */
    const s = (typeof accToggle === 'function') ? accToggle(Profile.setting('acc') || {}, id, v) : Object.assign({}, Profile.setting('acc') || {}, { [id]: !!v });
    Profile.setting('acc', s);
    if (v && typeof Profile !== 'undefined') Profile.grantAchievement('acessorio-1');
    AudioSys.select();
  },
  toggleAcc(id) { this.setAcc(id, !accOn(id)); },

  /* ---------- MODO FOTO (na pausa): camera livre + salvar PNG ---------- */
  enterPhoto() {
    const g = this.game;
    if (!g || !g.running) return;
    this.photoMode = true;
    g.photo = { x: 0, y: 0, z: 1, hideF: false, filter: '', filterName: 'NORMAL' };
    const filterBtn = this.$('btn-photo-filter');
    if (filterBtn) filterBtn.textContent = 'FILTRO: NORMAL';
    if (typeof HUD !== 'undefined') HUD.hide();
    document.body.classList.add('photo');
    const bar = this.$('photo-bar');
    if (bar) bar.hidden = false;
    this.syncPhotoBar();
    this.show('fight', false);
    AudioSys.select();
  },
  exitPhoto(toPause = true) {
    const g = this.game;
    this.photoMode = false;
    if (g) g.photo = null;
    document.body.classList.remove('photo');
    const bar = this.$('photo-bar');
    if (bar) bar.hidden = true;
    if (typeof HUD !== 'undefined') HUD.show();
    if (toPause && this.screen === 'fight') this.show('pause');
  },
  savePhoto() {
    try {
      const a = document.createElement('a');
      a.href = this.game.canvas.toDataURL('image/png');
      a.download = 'ds-fighters-foto-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.toast('\ud83d\udcf7 Foto salva!');
      if (typeof Profile !== 'undefined') Profile.grantAchievement('foto-1');
      AudioSys.select();
    } catch (e) { this.toast('Nao consegui salvar a foto'); }
  },
  cyclePhotoFilter() {
    const g = this.game;
    if (!g || !g.photo) return;
    const filters = [
      { name: 'NORMAL', filter: '' },
      { name: 'SÉPIA', filter: 'sepia(0.8) contrast(1.05)' },
      { name: 'FRIO', filter: 'saturate(1.35) hue-rotate(190deg)' },
      { name: 'P&B', filter: 'grayscale(1) contrast(1.12)' },
    ];
    const i = filters.findIndex((f) => f.name === g.photo.filterName);
    const next = filters[(i + 1) % filters.length];
    g.photo.filter = next.filter;
    g.photo.filterName = next.name;
    const b = this.$('btn-photo-filter');
    if (b) b.textContent = 'FILTRO: ' + next.name;
    AudioSys.cursor();
  },
  photoZoom(d) {
    const g = this.game;
    if (!g || !g.photo) return;
    g.photo.z += d;
    g.photoClamp();
    this.syncPhotoBar();
  },
  togglePhotoFighters() {
    const g = this.game;
    if (!g || !g.photo) return;
    g.photo.hideF = !g.photo.hideF;
    AudioSys.cursor();
    this.syncPhotoBar();
  },
  syncPhotoBar() {
    const g = this.game;
    const b = this.$('btn-photo-fighters');
    if (b && g && g.photo) b.textContent = g.photo.hideF ? '\ud83d\udc41 LUTADORES: OFF' : '\ud83d\udc41 LUTADORES: ON';
    const z = this.$('photo-zoom-lbl');
    if (z && g && g.photo) z.textContent = Math.round(g.photo.z * 100) + '%';
  },
  photoKeys(m) {
    const g = this.game;
    if (!g || !g.photo) return;
    const p = g.photo;
    const sp = 7 / p.z;
    if (m.left) p.x -= sp;
    if (m.right) p.x += sp;
    if (m.up) p.y -= sp;
    if (m.down) p.y += sp;
    if (Input.hit(['Equal', 'NumpadAdd'])) p.z += 0.12;
    if (Input.hit(['Minus', 'NumpadSubtract'])) p.z -= 0.12;
    if (Input.hit(['Digit0'])) { p.x = 0; p.y = 0; p.z = 1; }
    if (Input.hit(['KeyF'])) this.togglePhotoFighters();
    if (Input.hit(['Enter', 'Space'])) this.savePhoto();
    if (Input.hit(['Escape', 'KeyP'])) this.exitPhoto();
    g.photoClamp();
    this.syncPhotoBar();
  },

  /* ---------- pausa / fim ---------- */
  pause() {
    const g = this.game;
    if (!g.running || g.mode === 'demo') return;
    if (g.mode === 'online') { this.toast('No online a luta não pausa. Use o menu para sair.'); this.show('pause', false); return; }
    g.paused = true;
    AudioSys.back();
    this.show('pause');
  },
  resume() {
    this.game.paused = false;
    AudioSys.select();
    this.show('fight');
  },
  quitFight() {
    if (this.game.mode === 'online') Net.leave();
    this.game.stop();
    this.toMenu();
  },
  rematch() {
    if (this.game.mode === 'online') { Net.requestRematch(); this.toast('Revanche pedida — aguardando o adversário…'); return; }
    if (this.lastCfg) this.launch(this.lastCfg);
  },
  onMatchEnd(res, game) {
    HUD.hide();
    if (game && game.shadowHudOff) game.shadowHudOff();
    if (typeof MatchStats !== 'undefined') MatchStats.record(game, res); /* resultado anonimo pro balanceamento */
    const f = this.flow || {};
    const human = game.mode === 'online' ? game.cfg.localTeam : 0;
    const vsHuman = game.mode === 'versus' && !game.cfg.cpu[1];
    let title = res.winner < 0 ? 'EMPATE' : vsHuman ? `JOGADOR ${res.winner + 1} VENCE!` : res.winner === human ? 'VITÓRIA!' : 'DERROTA';
    const next = this.$('btn-next');
    next.hidden = true;
    let rankHtml = '';
    if (game.mode === 'arcade') {
      f.tourneySecs = (f.tourneySecs || 0) + (Number(res.seconds) || 0);
      if (res.winner === 0) {
        const p0 = game.teams[0].members[0];
        const row = (f.ladder || [])[f.arcadeStep] || {};
        if (row.shadow) {
          /* venceu a si mesmo: fim de verdade do torneio */
          title = 'VOCÊ VENCEU A SI MESMO!';
          Profile.grantAchievement('eu-mesmo');
          const S = game.shadow || {};
          const lives = p0.shadowLives || 0;
          rankHtml = `<p class="tourney-rank shadow-end">A sombra se desfez em fragmentos. <small>vidas restantes ${lives}/3 · memórias coletadas ${S.collected || 0} · paralisias ${S.fallen || 0}</small></p>`;
          f.ranks = f.ranks || [];
          f.ranks[f.arcadeStep] = { letter: lives >= 3 ? 'S' : lives === 2 ? 'A' : 'B', pts: 0 };
          f.afterWin = false;
          this.$('btn-again').textContent = 'REVANCHE';
          this.$('res-title').textContent = title;
        }
        const ranked = row.shadow ? f.ranks[f.arcadeStep] : typeof torneioRank === 'function'
          ? torneioRank(p0.hp / p0.maxHp, res.seconds, (res.teams[0][0] && res.teams[0][0].combo) || 0, !!row.boss, !!(typeof Input !== 'undefined' && Input.touchUsed))
          : { letter: 'B', pts: 0 };
        f.ranks = f.ranks || [];
        f.ranks[f.arcadeStep] = ranked;
        f.tourneyScore = (f.ranks || []).reduce((s, r) => s + (typeof torneioRankPoints === 'function' ? torneioRankPoints(r.letter) : 0), 0);
        if (row.shadow) { /* ja montado acima */ } else {
        rankHtml = `<p class="tourney-rank">NOTA${ranked.touch ? ' DO TOQUE' : ''} <b class="rk-${ranked.letter}">${ranked.letter}</b> <small>vida ${Math.round(p0.hp / p0.maxHp * 100)}% · ${res.seconds}s · combo ${res.teams[0][0].combo} · pts ${f.tourneyScore}</small></p>`;
        if (f.arcadeStep >= 3) Profile.grantAchievement('arcade-3');
        const cleared = !!row.boss || f.arcadeStep >= (f.ladder || []).length - 1;
        if (cleared) {
          title = 'CAMPEÃO DO TORNEIO!';
          if (typeof Profile.recordTourneyTime === 'function' && Profile.recordTourneyTime(f.tourneySecs)) {
            rankHtml += `<p class="tourney-rank">Novo recorde: torneio em <b>${typeof Ranking !== 'undefined' ? Ranking.fmtTime(f.tourneySecs) : f.tourneySecs + 's'}</b> de luta${Profile.loggedIn() ? ' — já está no RANKING!' : '. Faça login pra entrar no RANKING.'}</p>`;
          }
          const alreadyKernor = Profile.isUnlocked('kernor');
          const persisted = typeof Profile.grantTournamentClear === 'function' ? Profile.grantTournamentClear() : false;
          rankHtml += (persisted || alreadyKernor)
            ? '<p class="tourney-rank">Troféu do Núcleo. KERNOR liberado na seleção.</p>'
            : '<p class="tourney-rank">Troféu do Núcleo. Não consegui gravar o desbloqueio neste navegador.</p>';
          f.afterWin = false;
          /* NOTA A ou S no chefe final: abre a ultima luta — contra voce mesmo */
          if (row.boss && (ranked.letter === 'A' || ranked.letter === 'S') && !(f.ladder || []).some((r) => r.shadow)) {
            f.ladder.push({ id: p0.def.id, shadow: true, diff: 3, diffName: '???', line: 'Você não pode fugir de si mesmo.' });
            rankHtml += '<p class="tourney-rank shadow-open">Algo se mexe no escuro… <b>O SEU MAIOR INIMIGO</b> espera na última luta.</p>';
            f.afterWin = true;
            next.hidden = false;
            next.textContent = 'VER CHAVE';
          }
        } else {
          Profile.record('bestArcade', f.arcadeStep + 1);
          f.afterWin = true;
          next.hidden = false;
          next.textContent = 'VER CHAVE';
        }
        }
      } else f.afterWin = false;
      this.$('btn-again').textContent = res.winner === 0 ? 'REVANCHE' : 'CONTINUAR';
    } else if (game.mode === 'shadow') {
      /* revanche contra si mesmo (menu VOCÊ MESMO) */
      const p0 = game.teams[0].members[0];
      const S = game.shadow || {};
      const lives = p0 ? (p0.shadowLives || 0) : 0;
      if (res.winner === 0) {
        title = 'VOCÊ VENCEU A SI MESMO!';
        const prevBest = Number(Profile.setting('shadowBest')) || 0;
        if (!prevBest || (Number(res.seconds) || 0) < prevBest) { Profile.setting('shadowBest', Number(res.seconds) || 0); }
        rankHtml = `<p class="tourney-rank shadow-end">A sombra se desfez de novo. <small>vidas restantes ${lives}/3 · memórias coletadas ${S.collected || 0} · paralisias ${S.fallen || 0}${prevBest ? ' · melhor tempo ' + prevBest + 's' : ''}</small></p>`;
      } else {
        title = 'A SOMBRA VENCEU';
        rankHtml = `<p class="tourney-rank shadow-end">Ela ainda lembra de tudo. <small>memória restante ${Math.max(0, Math.ceil(S.mem || 0))}/1000 · memórias coletadas ${S.collected || 0} · paralisias ${S.fallen || 0}</small></p>`;
      }
      this.$('btn-again').textContent = 'REVANCHE';
    } else if (game.mode === 'survival') {
      if (res.winner === 0) {
        f.survivalWins = (f.survivalWins || 0) + 1;
        Profile.record('bestSurvival', f.survivalWins);
        if (f.survivalWins >= 5) Profile.grantAchievement('survival-5');
        if (f.survivalWins >= 10) Profile.grantAchievement('survival-10');
        const p0 = game && game.teams && game.teams[0] && game.teams[0].members[0];
        if (p0 && p0.def) Profile.recordSurvivalBy(p0.def.id, f.survivalWins);
        title = `SOBREVIVEU! ${f.survivalWins} vitória${f.survivalWins > 1 ? 's' : ''} seguidas`;
        next.hidden = false;
      } else {
        title = `CAIU! Placar: ${f.survivalWins || 0} vitórias`;
      }
      this.$('btn-again').textContent = 'REVANCHE';
    } else this.$('btn-again').textContent = 'REVANCHE';
    this.$('res-title').textContent = title;
    const wt = res.winner < 0 ? 0 : res.winner;
    const winIds = res.teams[wt].map((m) => m.id);
    const d = FIGHTERS.find((x) => x.id === winIds[0]);
    const q = d && d.quotes.win ? d.quotes.win[(Math.random() * d.quotes.win.length) | 0] : '';
    const clock = res.seconds != null ? res.seconds + 's' : '—';
    this.$('res-body').innerHTML = `
      <div class="res-win">${winIds.map((id) => `<div class="win-sprite" style="background-image:url(${SpriteGen.url(id)})"></div>`).join('')}<div class="res-quote"><b>${d ? d.name : ''}</b><blockquote>“${q}”</blockquote><small>Tempo da luta ${clock}</small></div></div>
      <table class="res-table"><thead><tr><th>Time</th><th>Lutador</th><th>Dano</th><th>Acertos</th><th>Combo</th><th>ULTs</th></tr></thead><tbody>
      ${res.teams.map((t, ti) => t.map((m) => `<tr class="${ti === res.winner ? 'w' : ''}"><td>${ti === 0 ? 'P1' : 'P2'}</td><td>${m.name}</td><td>${m.dmg}</td><td>${m.hits}</td><td>${m.combo}</td><td>${m.ults || 0}</td></tr>`).join('')).join('')}
      </tbody></table>
      ${rankHtml}
      <p class="score">Placar: ${res.wins[0]} × ${res.wins[1]}${game.mode === 'arcade' ? ` · Luta ${f.arcadeStep + 1}/${(f.ladder && f.ladder.length) || 7}` : ''}${game.mode === 'online' && Net.score ? ` · Placar da sala ${Net.score[0]} × ${Net.score[1]}` : ''}</p>`;
    this.$('stage-wrap').classList.remove('on');
    this.buildMenuSide();
    const gen = this._launchGen || 0;
    clearTimeout(this._endTimer);
    this._endTimer = setTimeout(() => {
      if (gen !== (this._launchGen || 0)) return;
      if (this.screen === 'menu' || this.screen === 'title') return;
      this.show('results');
      /* AVISO DE LOGIN: depois da 2a luta (e de novo la pela 8a) pra quem nao tem conta */
      if (game.mode !== 'online' && (this._fightsThisSession === 2 || this._fightsThisSession === 8)) {
        setTimeout(() => { if (this.screen === 'results') this.loginNudge(false); }, 700);
      }
    }, 900);
    if (game.mode !== 'demo') this._fightsThisSession = (this._fightsThisSession || 0) + 1;
    if (typeof Ranking !== 'undefined' && Profile.loggedIn()) setTimeout(() => { void Ranking.submit(game.mode === 'arcade'); }, 1500);
    AudioSys.playMusic('menu');
  },

  /* ---------- mascotes ---------- */
  petSlot: 0,
  enter_custom() { this.renderPets(); },
  renderPets() {
    const slot = this.petSlot;
    document.querySelectorAll('.pet-tabs .tab').forEach((t) => t.classList.toggle('on', +t.dataset.slot === slot));
    const cur = Profile.data.pets[slot];
    const grid = this.$('pet-grid');
    const hasPit = typeof Profile !== 'undefined' && Profile.hasPitoco && Profile.hasPitoco();
    grid.innerHTML = PETS.map((p) => {
      const locked = !!p.secret && !hasPit; /* segredo travado mostra SILHUETA, nao some */
      /* recompensa de login: mostra o bicho (isca) com cadeado e o aviso */
      const loginLocked = !!p.login && !Profile.loggedIn();
      const spr = locked
        ? `<span class="pet-spr sil" title="???">?</span>`
        : `<span class="pet-spr ${p.row < 0 && !p.img ? 'none' : ''}${loginLocked ? ' login-lock' : ''}" style="${p.id === 'pitoco' ? 'background-image:url(assets/pets/pitoco.png?v=v47-maresprites)' : p.img ? `background-image:url(${p.img})` : p.row >= 0 ? `background-image:url(assets/pets/pets.png?v=stable-loop-mistral-v1);--row:${p.row}` : ''}"></span>`;
      const name = locked ? '???' : p.name;
      const desc = locked ? 'Um mascote secreto... resgaste o código PITOCO ou digite P-I-T-O-C-O nesta tela.' : loginLocked ? '🔒 FAÇA LOGIN para liberar. ' + p.buff : p.buff;
      return `
      <button class="nav pet ${locked || loginLocked ? 'locked' : ''}${loginLocked ? ' login' : ''} ${p.id === cur ? 'on' : ''}" data-id="${p.id}">
        ${spr}
        <b>${name}</b><small>${desc}</small>${p.id === cur ? '<em>EQUIPADO</em>' : ''}
      </button>`;
    }).join('');
    grid.querySelectorAll('.pet').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('locked')) {
        AudioSys.play('deny');
        if (b.classList.contains('login')) { this.loginNudge(true); return; }
        UI.toast('🔒 Mascote secreto — resgaste o código PITOCO.', 2600);
        return;
      }
      Profile.setPet(slot, b.dataset.id);
      if (b.dataset.id !== 'none' && typeof Profile !== 'undefined') Profile.grantAchievement('pet-1');
      AudioSys.play('pickup');
      this.renderPets();
      this.buildMenuSide();
      const nb = grid.querySelector(`[data-id="${b.dataset.id}"]`);
      if (nb) nb.focus();
    }));
  },

  /* ---------- resgate ---------- */
  SKIN_HUES: [
    ['Original', 0], ['Vermelha', 330], ['Laranja', 25], ['Amarela', 55], ['Verde', 110],
    ['Ciano', 175], ['Azul', 210], ['Roxa', 265], ['Rosa', 300], ['P&B', -1],
  ],
  enter_skins() {
    // Recurso adiado: esta tela contém apenas o aviso e o botão VOLTAR.
  },
  renderSkinPreview(fid, hue) {
    const el = this.$('skin-preview');
    if (!el) return;
    const d = FIGHTERS.find((f) => f.id === fid);
    if (!d) return;
    const filter = hue === -1 ? 'grayscale(1)' : hue ? `hue-rotate(${hue}deg)` : '';
    const label = hue === -1 ? 'P&B' : hue ? 'hue ' + hue + '°' : 'paleta original';
    el.innerHTML = `<div class="skin-sprite" style="background-image:url(${SpriteGen.url(fid)});${filter ? `filter:${filter}` : ''}"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${label}</small>`;
  },
  enter_redeem() {
    this.$('redeem-msg').textContent = '';
    this.$('redeem-faces').innerHTML = '';
    setTimeout(() => this.$('redeem-input').focus(), 60);
  },
  redeem() {
    const input = this.$('redeem-input');
    const r = Profile.redeem(input.value);
    const msg = this.$('redeem-msg');
    msg.textContent = r.msg;
    msg.className = 'redeem-msg ' + (r.ok ? 'ok' : 'err');
    if (r.ok) {
      const ids = r.ids || [];
      const petFace = r.pet
        ? `<div class="rf" style="--d:0s"><div class="vs-sprite" style="background-image:url(assets/pets/pitoco.png?v=v47-maresprites);background-size:384px auto"></div><b style="--c:#f0c24b">Pitoco</b><small>mascote secreto</small></div>`
        : '';
      this.$('redeem-faces').innerHTML = petFace + ids.map((id, k) => {
        const d = FIGHTERS.find((x) => x.id === id);
        const sheetClass = ROSTER_4X8_SPRITES.has(id) ? ' sprite-4x8' : '';
        return `<div class="rf" style="--d:${(k + (r.pet ? 1 : 0)) * 0.25}s"><div class="vs-sprite${sheetClass}" style="background-image:url(${SpriteGen.url(id)})"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${d.title}</small></div>`;
      }).join('');
      if (!r.already) { AudioSys.play('unlock'); AudioSys.voice('unlocked'); }
      input.value = '';
      this.buildMenuSide();
    } else AudioSys.back();
  },

  /* ---------- opções ---------- */
  bindOptions() {
    document.querySelectorAll('[data-set]').forEach((el) => {
      const k = el.dataset.set;
      const v = Profile.setting(k);
      if (el.type === 'checkbox') el.checked = (k === 'shake' || k === 'smooth' || k === 'haptic' || k === 'touchFloat' || k === 'touchAuto') ? v !== false : !!v;
      else if (el.type === 'range' && (v == null || v === '')) el.value = el.getAttribute('value') || el.min;
      else if (k === 'reducedMotion') el.value = v === true ? 'on' : v === false ? 'off' : 'auto';
      else el.value = v == null ? '' : v;
      el.addEventListener('input', () => {
        let val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
        if (k === 'reducedMotion') val = el.value === 'on' ? true : el.value === 'off' ? false : null;
        Profile.setting(k, val);
        AudioSys.applyVolumes();
        if (k === 'touch' || k === 'touchScale' || k === 'touchOpacity' || k === 'touchDpad') this.updateTouch();
        if (k === 'quality' && this.game && this.game.applyQuality) this.game.applyQuality(); /* aplica na hora */
        if (k === 'serverUrl') this.$('net-url').value = val;
        document.body.classList.toggle('reduced', Profile.reducedMotion());
      });
    });
    document.body.classList.toggle('reduced', Profile.reducedMotion());
  },
  updateTouch() {
    const t = Profile.setting('touch');
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const on = (t === 'on' || (t === 'auto' && (coarse || navigator.maxTouchPoints > 0))) && this.screen === 'fight';
    const controls = this.$('touch-controls');
    if (!on && !controls.classList.contains('hidden')) Input.releaseAll();
    const scale = Number(Profile.setting('touchScale'));
    const opacity = Number(Profile.setting('touchOpacity'));
    controls.style.setProperty('--touch-scale', String(Number.isFinite(scale) && scale > 0 ? scale : 1));
    controls.style.setProperty('--touch-opacity', String(Number.isFinite(opacity) ? opacity : 0.72));
    const dpad = controls.querySelector('.dpad');
    if (dpad) dpad.hidden = Profile.setting('touchDpad') !== true;
    controls.classList.toggle('hidden', !on);
    controls.setAttribute('aria-hidden', String(!on));
    if (on) this.updateTouchPowers();
    if (typeof AppViewport !== 'undefined' && AppViewport.ready) AppViewport.fit();
  },
  updateTouchPowers() {
    if (!this.game || this.$('touch-controls').classList.contains('hidden')) return;
    const team = this.game.mode === 'online' ? this.game.cfg.localTeam || 0 : 0;
    const fighter = this.game.activeOf(team);
    if (!fighter) return;
    const kit = fighter.currentKit();
    const tagMode = this.game.mode === 'tag' || !!(this.game.teams && this.game.teams[team] && this.game.teams[team].members.length > 1);
    const key = fighter.def.id + ':' + kit.map((p) => p.id).join(',') + (fighter.has('trans') ? ':trans' : '') + (tagMode ? ':tag' : '');
    if (key === this._touchKitKey) return;
    this._touchKitKey = key;
    /* TROCA so existe no 2x2: no 1x1 era um botao morto no meio dos golpes */
    const tagBtn = this.$('touch-controls').querySelector('.t-tag');
    if (tagBtn) tagBtn.hidden = !tagMode;
    this.$('touch-controls').classList.toggle('many-powers', kit.length > 5);
    this.$('touch-controls').querySelectorAll('[data-power]').forEach((button) => {
      const index = +button.dataset.power;
      const power = kit[index];
      button.hidden = !power;
      button.setAttribute('aria-label', power ? `${index + 1}: ${power.name}` : 'Habilidade indisponível');
      button.classList.toggle('ult', !!power && power.slot === 'ultimate');
      button.innerHTML = `<span class="touch-key">${index === 9 ? '0' : index + 1}</span>`;
      const size = power && power.slot === 'ultimate' ? 58 : 50;
      button.style.cssText = power ? Art.css('abil:' + (fighter.powerSheetId ? fighter.powerSheetId(power) : fighter.kitOwnerId(power)), power.row, 0, size) : '';
      button._cd = null;
    });
    if (typeof AppViewport !== 'undefined' && AppViewport.ready) AppViewport.fit();
  },

  /* RECARGA nos botoes de toque: o poder escurece e "enche" enquanto recarrega
     (--cd = fracao que falta) e brilha quando fica pronto. */
  touchCooldowns() {
    const tc = this.$('touch-controls');
    if (!this.game || !tc || tc.classList.contains('hidden')) return;
    const team = this.game.mode === 'online' ? this.game.cfg.localTeam || 0 : 0;
    const f = this.game.activeOf(team);
    if (!f || !f.powerState) return;
    if (!this._touchPowerBtns) this._touchPowerBtns = [...tc.querySelectorAll('[data-power]')];
    for (const b of this._touchPowerBtns) {
      if (b.hidden) continue;
      let st;
      try { st = f.powerState(+b.dataset.power); } catch (e) { st = null; }
      if (!st) continue;
      const left = st.ready ? 0 : Math.max(0, Math.min(1, 1 - (st.pct || 0)));
      const q = Math.round(left * 20) / 20;
      const ready = !!st.ready && !st.locked;
      if (b._cd === q && b._ready === ready) continue;
      b._cd = q; b._ready = ready;
      b.style.setProperty('--cd', String(q));
      b.classList.toggle('ready', ready);
      b.classList.toggle('locked', !!st.locked);
    }
  },

  /* ---------- lista de golpes ---------- */
  enter_moves() {
    const K = (s, a) => `<kbd>${Input.label(s, a)}</kbd>`;
    this.$('moves-keys').innerHTML = `
      <table><thead><tr><th></th><th>Jogador 1</th><th>Jogador 2</th><th>Controle</th></tr></thead><tbody>
      <tr><td>Mover / pular / agachar</td><td><kbd>A D W S</kbd></td><td><kbd>← → ↑ ↓</kbd></td><td>Analógico / D-pad</td></tr>
      <tr><td>Soco · Chute</td><td>mouse esq. · dir.</td><td>${K(1, 'punch')} ${K(1, 'kick')}</td><td>□ ✕</td></tr>
      <tr><td>Poderes 1 a 5</td><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd></td><td><kbd>N1</kbd>…<kbd>N5</kbd></td><td>○ △ L1 R1 R2</td></tr>
      <tr><td>Poderes 6 a 10 (IALES e KERNOR)</td><td><kbd>6</kbd> <kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> <kbd>0</kbd></td><td><kbd>N6</kbd>…<kbd>N0</kbd></td><td>L3 R3 Tpad</td></tr>
      <tr><td>Troca (2x2)</td><td>${K(0, 'tag')}</td><td>${K(1, 'tag')}</td><td>L2</td></tr>
      <tr><td>Defender</td><td colspan="3">Segure para trás (em pé = alto, agachado = baixo)</td></tr>
      <tr><td>Dash / recuo</td><td colspan="3">Toque duas vezes para frente / para trás</td></tr>
      <tr><td>Agarrão</td><td colspan="3">Perto do rival: frente ou trás + soco</td></tr>
      <tr><td>Cancelamento</td><td colspan="3">Acerte um golpe básico e solte uma habilidade na hora</td></tr>
      <tr><td>Pausa</td><td colspan="3"><kbd>Esc</kbd> / <kbd>P</kbd> / Start</td></tr>
      </tbody></table>
      <p class="sub small">Carga A e B enchem batendo e apanhando; a ULT enche mais devagar. Defender demais enche a barra de tontura do rival… e a sua.</p>`;
    const pick = this.$('moves-pick');
    pick.innerHTML = FIGHTERS.map((d) => {
      const lk = !Profile.isUnlocked(d.id);
      const portrait = lk ? '' : rosterPortraitStyle(d.id, 48);
      return `<button class="nav mp${lk ? ' locked' : ' roster-portrait'}" data-id="${d.id}" ${portrait ? `style="${portrait}"` : ''} aria-label="${lk ? 'Bloqueado' : d.name}">${lk ? '?' : ''}</button>`;
    }).join('');
    const show = (id) => {
      const d = FIGHTERS.find((x) => x.id === id);
      const kit = POWERS[id];
      const lock = !Profile.isUnlocked(id);
      pick.querySelectorAll('.mp').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      this.$('moves-list').innerHTML = lock ? (Profile.isLoginLocked(id) ? `<h3>${d.name}</h3><p>🔒 Faça login (conta por email) para liberar este lutador e ver as habilidades.</p>` : `<h3>???</h3><p>Lutador secreto. Resgate um código para ver as habilidades.</p>`) : `
        <div class="moves-hero" style="background-image:url(${SpriteGen.url(d.id)})"></div>
        <h3 style="--c:${d.colors.accent}">${d.name} <small>${d.title}</small></h3><p class="sub small">${kit.theme}${kit.autoAim ? ' · Todos os ataques com AUTO AIM' : ''}</p>
        <ul class="kit big">${kit.powers.map((p, i) => `<li class="${p.slot}"><span class="ico anim" style="${Art.css('abil:' + id, p.row, 0, 64)};--row:${p.row}"></span>
          <span class="tx"><b>${p.name}</b><small>${SLOT_NAMES[p.slot]} · ${KIND_NAMES[p.kind] || ''}${p.dmg ? ' · dano ' + p.dmg : ''}</small><em>${p.desc || ''}</em></span><kbd>${Input.label(0, 'a' + i)}</kbd></li>`).join('')}</ul>`;
    };
    pick.querySelectorAll('.mp').forEach((b) => { b.addEventListener('click', () => show(b.dataset.id)); b.addEventListener('focus', () => show(b.dataset.id)); });
    show(FIGHTERS.find((d) => Profile.isUnlocked(d.id)).id);
  },

  /* ---------- online ---------- */
  enter_online() {
    const tuto = this.$('net-tuto');
    if (tuto && !Profile.data.seenOnlineTuto) {
      tuto.classList.remove('hidden');
      const ok = this.$('net-tuto-ok');
      if (ok && !ok.dataset.bound) {
        ok.dataset.bound = '1';
        ok.addEventListener('click', () => {
          tuto.classList.add('hidden');
          Profile.data.seenOnlineTuto = true;
          Profile.save();
          AudioSys.select();
        });
      }
    }
    const url = Profile.setting('serverUrl') || Net.defaultUrl();
    this.$('net-url').value = url;
    this.$('net-name').value = Profile.data.name || 'Jogador';
    Net.bindUi();
    Net.renderLobby();
  },

  /* ---------- navegação espacial ---------- */
  navMove(dx, dy) {
    if (!this.screenEl) return;
    const items = [...this.screenEl.querySelectorAll('.nav, input:not([type=hidden]), select')].filter((e) => e.offsetParent !== null && !e.disabled && !e.hidden);
    if (!items.length) return;
    const cur = document.activeElement && items.includes(document.activeElement) ? document.activeElement : null;
    if (!cur) { items[0].focus(); return; }
    const r = cur.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let best = null;
    let bestD = Infinity;
    for (const e of items) {
      if (e === cur) continue;
      const q = e.getBoundingClientRect();
      const ex = q.left + q.width / 2;
      const ey = q.top + q.height / 2;
      const ddx = ex - cx;
      const ddy = ey - cy;
      if (dx && Math.sign(ddx) !== dx) continue;
      if (dy && Math.sign(ddy) !== dy) continue;
      if (dx && Math.abs(ddx) < 4) continue;
      if (dy && Math.abs(ddy) < 4) continue;
      const d = dx ? Math.abs(ddx) + Math.abs(ddy) * 2.5 : Math.abs(ddy) + Math.abs(ddx) * 2.5;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) { best.focus(); best.scrollIntoView && best.scrollIntoView({ block: 'nearest' }); }
  },
  tick() {
    const m = Input.menu();
    if (this.photoMode) { this.photoKeys(m); return; }
    const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (this.screen === 'title') {
      if (Input.hit(['Enter', 'Space']) || m.confirm || m.start) this.pressStart();
      return;
    }
    if (this.screen === 'select') { this.selectKeys(m); return; }
    if (this.screen === 'fight') {
      if (m.start) this.pause();
      if ((this._touchTick = (this._touchTick || 0) + 1) % 15 === 0) this.updateTouchPowers();
      if (this._touchTick % 3 === 0) this.touchCooldowns();
      if (this.tutorial) this.tutorialTick();
      return;
    }
    if (this.screen === 'vs') return;
    if (this.screen === 'pause' && m.start) { if (this.game.mode === 'online') this.show('fight'); else this.resume(); return; }
    if (typing) { if (Input.hit(['Escape'])) document.activeElement.blur(); return; }
    if (m.up) this.navMove(0, -1);
    if (m.down) this.navMove(0, 1);
    if (m.left) this.navMove(-1, 0);
    if (m.right) this.navMove(1, 0);
    if (m.confirm && document.activeElement && document.activeElement.click) document.activeElement.click();
    if ((m.back || Input.hit(['Escape', 'Backspace'])) && this.screen !== 'menu') {
      if (this.screen === 'pause') return this.game.mode === 'online' ? this.show('fight') : this.resume();
      if (this.screen === 'results') return;
      this.back();
    }
  },
};
