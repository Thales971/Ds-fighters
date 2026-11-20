/* ============================================================
   DS FIGHTERS — Interface (HTML/CSS). Telas, navegação por
   teclado/controle/toque, seleção de lutadores e arenas,
   resultados, mascotes, resgate, opções, lista de golpes e lobby.
   ============================================================ */
const SLOT_NAMES = { simple: 'SIMPLES', charge: 'CARGA', ultimate: 'ULTIMATE' };
const KIND_NAMES = { shot: 'Projétil', pillar: 'Coluna', dash: 'Investida', aura: 'Aura', beam: 'Raio', blast: 'Explosão', rush: 'Sequência', rain: 'Chuva', pull: 'Puxão', steal: 'Roubo', wall: 'Muralha', zone: 'Zona', barrage: 'Rajada', shadowport: 'Portal' };
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
  const cell = px || 48;
  const src = `${book.file}?v=${book.version || 'v36-portraits1'}`;
  return `background-image:url(${src});background-size:${cols * cell}px ${rows * cell}px;background-position:${-col * cell}px ${-row * cell}px;background-repeat:no-repeat`;
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
    this.$('btn-photo-zin').addEventListener('click', () => this.photoZoom(0.15));
    this.$('btn-photo-zout').addEventListener('click', () => this.photoZoom(-0.15));
    /* zoom com a rodinha do mouse no modo foto */
    if (this.game && this.game.canvas) this.game.canvas.addEventListener('wheel', (e) => {
      if (!this.photoMode) return;
      e.preventDefault();
      this.photoZoom(e.deltaY < 0 ? 0.12 : -0.12);
    }, { passive: false });
    this.$('btn-again').addEventListener('click', () => this.rematch());
    this.$('btn-next').addEventListener('click', () => (this.flow && this.flow.mode === 'survival' ? this.survivalNext() : this.arcadeNext()));
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
  show(name, push) {
    if (name === 'conquistas' && typeof ACHIEVEMENTS !== 'undefined') this.renderConquistas();
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
    if (['acc', 'custom', 'rules', 'redeem', 'options', 'moves', 'online', 'skins', 'conquistas', 'events'].includes(this.screen)) return this.toMenu();
    if (this.screen === 'stage') return this.show('select');
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
  toMenu() {
    /* vindo do titulo a demo ja esta rodando: continua a mesma luta no fundo */
    const demoOn = this.game.running && this.game.mode === 'demo';
    if (this.game.running && !demoOn) this.game.stop();
    HUD.hide();
    Net.leave(true);
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
    c.querySelector('.ci-face').style.backgroundImage = `url(${SpriteGen.faceUrl(f.def.id)})`;
    c.querySelector('.ci-name').textContent = f.def.name;
    c.querySelector('.ci-move').textContent = p.name || '';
    c.style.setProperty('--accent', f.def.colors.accent || '#ffd27d');
    c.classList.toggle('right', f.team === 1);
    c.classList.remove('on');
    void c.offsetWidth;
    c.classList.add('on');
    clearTimeout(this._cutT);
    this._cutT = setTimeout(() => c.classList.remove('on'), 900);
  },

  /* ---------- menu ---------- */
  buildMenuSide() {
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
    if (meta) meta.setAttribute('content', `DS Fighters: jogo de luta arcade retrô 2D com ${r.selectable} lutadores selecionáveis, 5 habilidades cada (IALES até 10), ${r.arenas} arenas, 2x2 e online.`);
    return r;
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
    this.tutorial = {
      step: 0,
      moved: 0, lastX: null, jumps: 0, crouches: 0, punches: 0, kicks: 0,
      chains: 0, casts: 0, ults: 0, blocks: 0, jumpCancels: 0, doubleJumps: 0, dashes: 0,
      steps: [
        { title: 'ANDE', sub: 'A / D (ou setas) para mover', done: () => T.tutorial.moved > 260 },
        { title: 'PULE', sub: 'W para pular', done: () => T.tutorial.jumps > 0 },
        { title: 'AGACHE', sub: 'S para agachar', done: () => T.tutorial.crouches > 20 },
        { title: 'SOCOS', sub: 'Botao esquerdo do mouse (ou J) — de 3 socos', done: () => T.tutorial.punches >= 3 },
        { title: 'CHUTES', sub: 'Botao direito do mouse (ou K) — de 3 chutes', done: () => T.tutorial.kicks >= 3 },
        { title: 'COMBO', sub: 'No acerto, encadeie soco-soco-chute (combo-alvo)', done: () => T.tutorial.chains >= 2 },
        { title: 'HABILIDADE', sub: 'Teclas 1 e 2 — solte duas habilidades', done: () => T.tutorial.casts >= 2 },
        { title: 'ULTIMATE', sub: 'Tecla 5 — solte a ultimate', done: () => T.tutorial.ults >= 1 },
        { title: 'BLOQUEIO', sub: 'Segure para tras perto do boneco para bloquear', done: () => T.tutorial.blocks > 30 },
        { title: 'JUMP-CANCEL', sub: 'Acerte um soco e aperte W na hora do hit', done: () => T.tutorial.jumpCancels >= 1 },
        { title: 'DOUBLE JUMP', sub: 'No ar, aperte W de novo — pulo extra pra todos', done: () => T.tutorial.doubleJumps >= 1 },
        { title: 'DASH', sub: 'Toque duas vezes A ou D para o dash', done: () => T.tutorial.dashes >= 1 },
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
      const lock = f.mode === 'training' ? false : !Profile.isUnlocked(d.id);
      /* Foto SO aparece para lutadores desbloqueados — travado e silhueta de
         interrogacao, sem vazar nem a cara nem o sprite (pedido do dono).
         O busto vem do atlas gerado a partir do idle real, na mesma escala. */
      const thumb = lock ? '' : rosterPortraitStyle(d.id);
      return `<button class="cell ${lock ? 'locked' : ''} ${d.secret ? 'secret' : ''}" data-i="${i}" aria-label="${lock ? 'Bloqueado — use um código' : d.name}">
        <span class="face${lock ? ' q' : ''}${thumb ? ' roster-portrait' : ''}" ${thumb ? `style="${thumb}"` : ''} aria-hidden="true">${lock ? '?' : ''}</span>
        <span class="nm">${lock ? '???' : d.name.split(' ')[0]}</span>
        ${lock ? '<span class="lk">&#128274;<small>CÓDIGO</small></span>' : d.secret ? '<span class="sx">SECRETO</span>' : ''}${!lock && typeof Balance !== 'undefined' && Balance.buffFor(d) ? '<span class="sx buff">BUFF</span>' : ''}
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
      c.classList.toggle('p2', f.cursor[1] === slot && (f.p2Human || f.done[0]) && !f.done[1] && f.mode !== 'arcade' && f.mode !== 'online');
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
    const solo = f.mode === 'arcade' || f.mode === 'online';
    if (ti === 1 && solo) {
      if (f.mode === 'arcade') {
        const nBuff = FIGHTERS.filter((d) => d.id !== 'boneco-treino' && Balance.buffFor(d)).length;
        el.innerHTML = `<div class="card-empty"><b>TORNEIO ATÉ O CHEFE</b><p>6 rivais fortes e insuportáveis em ordem crescente + chefe final.</p><p>${Profile.isUnlocked('iales') ? 'Chefe: IALES (com trilha AMV)' : 'Chefe: ???'}</p><p><b>${nBuff} lutadores fracos têm BUFF permanente</b> (+HP/+força, badge BUFF) — no torneio e em qualquer modo!</p></div>`;
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
    const lock = d && !Profile.isUnlocked(d.id);
    const isRandom = idx >= FIGHTERS.length;
    const kit = d ? POWERS[d.id] : null;
    const st = d ? d.stats : null;
    const bar = (label, v, max) => `<div class="sb"><span>${label}</span><i style="--v:${Math.min(1, v / max)}"></i></div>`;
    const keyFor = ti === 1 && f.p2Human ? 1 : 0;
    el.innerHTML = `
      <div class="who">${ti === 0 ? 'P1' : f.p2Human ? 'P2' : f.mode === 'training' ? 'BONECO' : 'CPU'}${f.need > 1 ? ` · ${f.picks[ti].length}/${f.need}` : ''}</div>
      <div class="picked-row">${pickedIds.map((id) => `<span style="background-image:url(${SpriteGen.faceUrl(id)})"></span>`).join('')}</div>
      ${isRandom ? `<div class="big-sprite q">?</div><h3>ALEATÓRIO</h3><p class="bio">Deixe o destino escolher.</p>` : lock ? `<div class="big-sprite locked"></div><h3>???</h3><p class="bio">Lutador secreto. Resgate um código no menu para liberar.</p>` : `
      <div class="big-sprite" style="background-image:url(${SpriteGen.url(d.id)})"></div>
      <h3 style="--c:${d.colors.accent}">${d.name}</h3>
      <div class="ttl">${d.title}</div>
      ${SIGNATURES[d.id] ? `<div class="trait" title="${SIGNATURES[d.id].desc}"><b>${SIGNATURES[d.id].trait}</b><small>${SIGNATURES[d.id].desc}</small></div>` : ''}
      <p class="bio">${d.bio}</p>
      ${d.quotes && d.quotes.intro && d.quotes.intro.length ? `<div class="quotes">“${d.quotes.intro[0]}”</div>` : ''}
      <div class="statbars">${bar('FORÇA', st.power, 1.7)}${bar('VELOC.', st.speed, 1.5)}${bar('ALCANCE', (d.moves && d.moves.kick && d.moves.kick.range) || 64, 96)}</div>
      <div class="theme">${kit ? kit.theme : ''}${kit && kit.autoAim ? ' · <b>AUTO AIM</b>' : ''}</div>
      <ul class="kit">${(kit ? kit.powers : []).slice(0, d.id === 'iales' ? 10 : 5).map((p, i) => `
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
      const pool = FIGHTERS.map((d, k) => k).filter((k) => FIGHTERS[k].id !== 'boneco-treino' && (f.mode === 'training' || Profile.isUnlocked(FIGHTERS[k].id)) && !f.picks[who].includes(k));
      i = pool[(Math.random() * pool.length) | 0];
    }
    const d = FIGHTERS[i];
    if (f.mode !== 'training' && !Profile.isUnlocked(d.id)) { AudioSys.back(); this.toast('Lutador secreto — resgate um código no menu!'); return; }
    if (f.picks[who].includes(i)) { AudioSys.back(); return; }
    f.picks[who].push(i);
    AudioSys.select();
    AudioSys.play('whoosh', { vol: 0.5 });
    AudioSys.sayCharacter(d.name);
    if (f.picks[who].length >= f.need) f.done[who] = true;
    if (f.mode === 'arcade' || f.mode === 'online') {
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
    if (f.mode === 'arcade') { this.buildArcade(); return this.launchArcade(); }
    if (f.mode === 'survival') { return this.launchSurvival(); }
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
    this.$('events-hero').innerHTML = now ? `<div class="ev-hero" style="${stage ? `background-image:url(${stage.image})` : ''}">
      <div class="ev-hero-copy"><span>${now.ev.icon} ${now.active ? 'NO AR' : 'PRÓXIMO'}</span><h3>${now.ev.name}</h3><p>${when} · ${Events.fmt(now.window.start)} – ${Events.fmt(now.window.end)}</p></div>
    </div>` : '';
    this.$('events-upcoming').innerHTML = rows.map((r) => {
      const tag = r.active ? (r.live ? (r.daysLeft <= 0 ? 'hoje' : 'agora') : 'teste') : r.live ? 'hoje' : `em ${dias(r.daysUntil)}`;
      return `<article class="ev-card${r.active ? ' on' : ''}"><b>${r.ev.icon} ${r.ev.name}</b><small>${Events.fmt(r.window.start)} – ${Events.fmt(r.window.end)}</small><em>${tag}</em></article>`;
    }).join('');
    const activeId = now && now.active ? now.ev.id : '';
    const maps = STAGE_LIST.filter((s) => s.event);
    maps.sort((a, b) => (a.event === activeId ? 0 : 1) - (b.event === activeId ? 0 : 1));
    this.$('events-maps').innerHTML = maps.map((s) => `<button class="nav ev-map" data-id="${s.id}"><span class="th" style="background-image:url(${s.image})"></span><b>${s.name}</b><small>${s.blurb || ''}</small></button>`).join('');
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
      this.game.start(cfg);
      if (this.flow && this.flow.tutorial) this.tutorialBegin();
      if (cfg && cfg.mode === 'online' && typeof Net !== 'undefined' && Net.room && window.TournamentUI && typeof window.TournamentUI.matchStarted === 'function') {
        window.TournamentUI.matchStarted(Net.room.code).catch(() => {});
      }
    });
  },
  showVs(cfg, then) {
    const side = (ti) => cfg.teams[ti].map((id) => {
      const d = FIGHTERS.find((x) => x.id === id);
      const sheetClass = ROSTER_4X8_SPRITES.has(id) ? ' sprite-4x8' : '';
      return `<div class="vs-f"><div class="vs-sprite${sheetClass}" style="background-image:url(${SpriteGen.url(id)})"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${d.title}</small></div>`;
    }).join('');
    this.$('vs-0').innerHTML = side(0);
    this.$('vs-1').innerHTML = side(1);
    const s = STAGE_LIST.find((x) => x.id === cfg.stage);
    this.$('vs-stage').textContent = s ? s.name : 'ARENA ALEATÓRIA';
    this.show('vs');
    AudioSys.play('hazard', { vol: 0.7 });
    setTimeout(then, Profile.reducedMotion() ? 900 : 2200);
  },
  enter_fight() {},

  /* ---------- arcade ---------- */
  buildArcade() {
    const f = this.flow;
    const me = FIGHTERS[f.picks[0][0]].id;
    /* TORNEIO RAPIDO ate o chefe: os 6 mais FORTES e INSUPORTAVEIS
       (projetil/zoner/spam de longe, alcance absurdo, stats altos),
       em ordem crescente de dificuldade, e o chefe IALES no fim. */
    const score = (d) => {
      const s = d.stats || {};
      let sc = (s.power || 1) * 2 + (s.speed || 1) + (s.meterRate || 1) + (s.hp || 100) / 200;
      const sp = (d.special && d.special.type) || '';
      if (/projectile|cycle|multi|beam|summon|aoe/i.test(sp)) sc += 1.1; /* atira de longe: insuportavel */
      if (/rush|buff|transform/i.test(sp)) sc += 0.5;
      const kick = (d.moves && d.moves.kick) || {};
      if ((kick.range || 0) >= 70) sc += 0.4; /* alcance absurdo */
      return sc;
    };
    const rivais = FIGHTERS.filter((d) => d.id !== me && !d.secret)
      .map((d) => ({ id: d.id, sc: score(d) }))
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 6)
      .map((r) => r.id)
      .reverse(); /* mais fraco primeiro, mais forte por ultimo */
    const boss = me !== 'iales' && Profile.isUnlocked('iales') ? 'iales' : me !== 'fullstack' ? 'fullstack' : 'stack';
    const semBoss = rivais.filter((id) => id !== boss);
    f.ladder = [...semBoss, boss];
    f.arcadeStep = 0;
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
    const opp = f.ladder[f.arcadeStep];
    const st = STAGE_LIST[(Math.random() * STAGE_LIST.length) | 0];
    const isBoss = f.arcadeStep >= f.ladder.length - 1; /* ultima luta = chefe */
    this.launch({
      mode: 'arcade', teams: [[me], [opp]], stage: st.id, weather: 'random',
      difficulty: isBoss ? 3 : Math.min(3, AI.level(f.difficulty == null ? 1 : f.difficulty) + (f.arcadeStep >= 5 ? 1 : 0)),
      cpu: [false, true], pets: [Profile.petFor(0), PETS[0]],
      roundsToWin: isBoss ? 2 : 1, timer: isBoss ? 180 : 99, /* torneio rapido; chefe vale 2 rounds */
      music: isBoss ? 'boss' : 'battle', /* chefe entra com as faixas AMV (Skillet Monster etc.) */
    });
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
        <img class="acc-img" src="${a.src}?v=v47-maresprites" alt="" aria-hidden="true" />
        <div class="acc-info"><b>${a.icon} ${a.name}</b><small>${a.desc}</small></div>
        <button type="button" class="nav btn tiny acc-toggle" data-acc="${a.id}">${accOn(a.id) ? 'LIGADO ✓' : 'DESLIGADO'}</button>
      </div>`).join('') || '<p class="sub">Nenhum acessorio disponivel ainda.</p>';
    el.querySelectorAll('.acc-toggle').forEach((b) => b.addEventListener('click', () => { this.toggleAcc(b.dataset.acc); this.enter_acc(); }));
    const on = this.$('acc-all-on'), off = this.$('acc-all-off');
    if (on) on.onclick = () => { ACC_LIST.forEach((a) => this.setAcc(a.id, true)); this.enter_acc(); };
    if (off) off.onclick = () => { ACC_LIST.forEach((a) => this.setAcc(a.id, false)); this.enter_acc(); };
  },
  setAcc(id, v) {
    const s = Object.assign({}, Profile.setting('acc') || {});
    s[id] = !!v;
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
    g.photo = { x: 0, y: 0, z: 1, hideF: false };
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
    const f = this.flow || {};
    const human = game.mode === 'online' ? game.cfg.localTeam : 0;
    const vsHuman = game.mode === 'versus' && !game.cfg.cpu[1];
    let title = res.winner < 0 ? 'EMPATE' : vsHuman ? `JOGADOR ${res.winner + 1} VENCE!` : res.winner === human ? 'VITÓRIA!' : 'DERROTA';
    const next = this.$('btn-next');
    next.hidden = true;
    if (game.mode === 'arcade') {
      if (res.winner === 0) {
        if (f.arcadeStep >= 3) Profile.grantAchievement('arcade-3');
        if (f.arcadeStep >= 6) { title = 'CAMPEÃO DO ARCADE!'; Profile.record('bestArcade', 7); Profile.grantAchievement('arcade-campeao'); }
        else { Profile.record('bestArcade', f.arcadeStep + 1); next.hidden = false; }
      }
      this.$('btn-again').textContent = res.winner === 0 ? 'REVANCHE' : 'CONTINUAR';
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
      <p class="score">Placar: ${res.wins[0]} × ${res.wins[1]}${game.mode === 'arcade' ? ` · Luta ${f.arcadeStep + 1}/7` : ''}${game.mode === 'online' && Net.score ? ` · Placar da sala ${Net.score[0]} × ${Net.score[1]}` : ''}</p>`;
    this.$('stage-wrap').classList.remove('on');
    this.buildMenuSide();
    setTimeout(() => this.show('results'), 900);
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
      const spr = locked
        ? `<span class="pet-spr sil" title="???">?</span>`
        : `<span class="pet-spr ${p.row < 0 ? 'none' : ''}" style="${p.id === 'pitoco' ? 'background-image:url(assets/pets/pitoco.png?v=v47-maresprites)' : p.row >= 0 ? `background-image:url(assets/pets/pets.png?v=stable-loop-mistral-v1);--row:${p.row}` : ''}"></span>`;
      const name = locked ? '???' : p.name;
      const desc = locked ? 'Um mascote secreto... resgaste o código PITOCO ou digite P-I-T-O-C-O nesta tela.' : p.buff;
      return `
      <button class="nav pet ${locked ? 'locked' : ''} ${p.id === cur ? 'on' : ''}" data-id="${p.id}">
        ${spr}
        <b>${name}</b><small>${desc}</small>${p.id === cur ? '<em>EQUIPADO</em>' : ''}
      </button>`;
    }).join('');
    grid.querySelectorAll('.pet').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('locked')) {
        AudioSys.play('deny');
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
      if (el.type === 'checkbox') el.checked = k === 'shake' || k === 'smooth' ? v !== false : !!v;
      else if (k === 'reducedMotion') el.value = v === true ? 'on' : v === false ? 'off' : 'auto';
      else el.value = v == null ? '' : v;
      el.addEventListener('input', () => {
        let val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
        if (k === 'reducedMotion') val = el.value === 'on' ? true : el.value === 'off' ? false : null;
        Profile.setting(k, val);
        AudioSys.applyVolumes();
        if (k === 'touch') this.updateTouch();
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
    const key = fighter.def.id + ':' + kit.map((p) => p.id).join(',') + (fighter.has('trans') ? ':trans' : '');
    if (key === this._touchKitKey) return;
    this._touchKitKey = key;
    this.$('touch-controls').querySelectorAll('[data-power]').forEach((button) => {
      const index = +button.dataset.power;
      const power = kit[index];
      button.hidden = !power;
      button.setAttribute('aria-label', power ? `${index + 1}: ${power.name}` : 'Habilidade indisponível');
      button.classList.toggle('ult', !!power && power.slot === 'ultimate');
      button.innerHTML = `<span class="touch-key">${index === 9 ? '0' : index + 1}</span>`;
      button.style.cssText = power ? Art.css('abil:' + (fighter.powerSheetId ? fighter.powerSheetId(power) : fighter.kitOwnerId(power)), power.row, 0, 44) : '';
    });
    if (typeof AppViewport !== 'undefined' && AppViewport.ready) AppViewport.fit();
  },

  /* ---------- lista de golpes ---------- */
  enter_moves() {
    const K = (s, a) => `<kbd>${Input.label(s, a)}</kbd>`;
    this.$('moves-keys').innerHTML = `
      <table><thead><tr><th></th><th>Jogador 1</th><th>Jogador 2</th><th>Controle</th></tr></thead><tbody>
      <tr><td>Mover / pular / agachar</td><td><kbd>A D W S</kbd></td><td><kbd>← → ↑ ↓</kbd></td><td>Analógico / D-pad</td></tr>
      <tr><td>Soco · Chute</td><td>mouse esq. · dir.</td><td>${K(1, 'punch')} ${K(1, 'kick')}</td><td>□ ✕</td></tr>
      <tr><td>Poderes 1 a 5</td><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd></td><td><kbd>N1</kbd>…<kbd>N5</kbd></td><td>○ △ L1 R1 R2</td></tr>
      <tr><td>Poderes 6 a 10 (IALES)</td><td><kbd>6</kbd> <kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> <kbd>0</kbd></td><td><kbd>N6</kbd>…<kbd>N0</kbd></td><td>L3 R3 Tpad</td></tr>
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
      return `<button class="nav mp${lk ? ' locked' : ''}" data-id="${d.id}" ${portrait ? `style="${portrait}"` : ''} aria-label="${lk ? 'Bloqueado' : d.name}">${lk ? '?' : ''}</button>`;
    }).join('');
    const show = (id) => {
      const d = FIGHTERS.find((x) => x.id === id);
      const kit = POWERS[id];
      const lock = !Profile.isUnlocked(id);
      pick.querySelectorAll('.mp').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      this.$('moves-list').innerHTML = lock ? `<h3>???</h3><p>Lutador secreto. Resgate um código para ver as habilidades.</p>` : `
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
          AudioSys.confirm();
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
