/* ============================================================
   DS FIGHTERS — Interface (HTML/CSS). Telas, navegação por
   teclado/controle/toque, seleção de lutadores e arenas,
   resultados, mascotes, resgate, opções, lista de golpes e lobby.
   ============================================================ */
const SLOT_NAMES = { simple: 'SIMPLES', charge: 'CARGA', ultimate: 'ULTIMATE' };
const KIND_NAMES = { shot: 'Projétil', pillar: 'Coluna', dash: 'Investida', aura: 'Aura', beam: 'Raio', blast: 'Explosão', rush: 'Sequência', rain: 'Chuva', pull: 'Puxão', steal: 'Roubo', wall: 'Muralha', zone: 'Zona', barrage: 'Rajada', shadowport: 'Portal' };

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
    this.$('btn-again').addEventListener('click', () => this.rematch());
    this.$('btn-next').addEventListener('click', () => (this.flow && this.flow.mode === 'survival' ? this.survivalNext() : this.arcadeNext()));
    this.$('btn-res-select').addEventListener('click', () => (this.flow && this.flow.mode === 'online' ? (Net.room ? Net.openPicker() : this.show('online')) : this.startFlow(this.flow ? this.flow.mode : 'versus')));
    this.$('btn-res-menu').addEventListener('click', () => this.toMenu());
    this.$('redeem-form').addEventListener('submit', (e) => { e.preventDefault(); this.redeem(); });
    this.$('btn-replays-back').addEventListener('click', () => this.toMenu());
    document.querySelectorAll('.pet-tabs .tab').forEach((t) => t.addEventListener('click', () => { this.petSlot = +t.dataset.slot; this.renderPets(); }));
    this.bindOptions();
    document.addEventListener('mouseover', (e) => { const n = e.target.closest && e.target.closest('.nav'); if (n && this.screenEl && this.screenEl.contains(n) && document.activeElement !== n) n.focus({ preventScroll: true }); });
    document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('nav')) AudioSys.cursor(); });
    this.buildMenuSide();
    this.show('title');
    if (/sala=/i.test(location.hash)) setTimeout(() => { Net.bindUi(); Net.checkInvite(); }, 50);
    this.updateTouch();
  },

  /* ---------- telas ---------- */
  show(name, push) {
    if (this.screen !== name) Input.releaseAll();
    if (push && this.screen) this.stack.push(this.screen);
    else if (!push) this.stack = [];
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === name));
    this.screen = name;
    this.screenEl = document.querySelector(`.screen[data-screen="${name}"]`);
    document.body.dataset.screen = name;
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
    if (['select', 'custom', 'skins', 'replays', 'rules', 'redeem', 'options', 'moves', 'online'].includes(this.screen)) return this.toMenu();
    if (this.screen === 'stage') return this.show('select');
  },
  toMenu() {
    if (this.game.running) this.game.stop();
    HUD.hide();
    Net.leave(true);
    this.$('stage-wrap').classList.remove('on');
    this.show('menu');
    this.startDemo();
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
    c.querySelector('.ci-face').style.backgroundImage = `url(assets/ui/face-${f.def.id}.png)`;
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
      <div><span>Mascote P1</span><b>${Profile.petFor(0).name}</b></div>`;
    const tagline = document.querySelector('.tagline');
    if (tagline) tagline.textContent = `EDIÇÃO V5 · ${FIGHTERS.length} LUTADORES · ${STAGE_LIST.length} ARENAS · ONLINE ATÉ 4 JOGADORES`;
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
    if (['arcade', 'versus', 'tag', 'training', 'survival'].includes(go)) return this.startFlow(go);
    this.show(go, false);
  },

  /* ---------- fluxo de seleção ---------- */
  startFlow(mode, extra) {
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
      stage: 'random',
      arcadeStep: 0,
    }, extra || {});
    this.$('stage-wrap').classList.remove('on');
    this.show('select');
    AudioSys.voice('choose');
  },
  enter_select() {
    const f = this.flow;
    const grid = this.$('sel-grid');
    const modeNames = { arcade: 'ARCADE', versus: 'VERSUS', tag: '2 × 2 EQUIPES', training: 'TREINO', online: 'ONLINE', survival: 'SURVIVAL' };
    this.$('sel-mode').textContent = (f.customRules ? 'PERSONALIZADO' : modeNames[f.mode]) + (f.mode === 'tag' ? ' · escolha 2 lutadores' : '');
    grid.innerHTML = FIGHTERS.map((d, i) => {
      const lock = !Profile.isUnlocked(d.id);
      return `<button class="cell ${lock ? 'locked' : ''} ${d.secret ? 'secret' : ''}" data-i="${i}" aria-label="${lock ? 'Bloqueado — use um código' : d.name}">
        <span class="face" style="background-image:url(assets/ui/face-${d.id}.png)"></span>
        <span class="nm">${lock ? '???' : d.name.split(' ')[0]}</span>
        ${lock ? '<span class="lk">🔒<small>CÓDIGO</small></span>' : d.secret ? '<span class="sx">SECRETO</span>' : ''}
        <span class="cur c1"></span><span class="cur c2"></span>
      </button>`;
    }).join('') + `<button class="cell random" data-i="-1" aria-label="Aleatório"><span class="face q">?</span><span class="nm">ALEATÓRIO</span><span class="cur c1"></span><span class="cur c2"></span></button>`;
    grid.querySelectorAll('.cell').forEach((c) => {
      c.addEventListener('click', () => {
        const i = +c.dataset.i;
        const who = this.selWho();
        f.cursor[who] = i < 0 ? FIGHTERS.length : i;
        this.selConfirm(who);
      });
      c.addEventListener('mouseenter', () => { const who = this.selWho(); f.cursor[who] = +c.dataset.i < 0 ? FIGHTERS.length : +c.dataset.i; this.renderSelect(); });
    });
    this.renderSelect();
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
    cells.forEach((c, k) => {
      c.classList.toggle('p1', f.cursor[0] === k && !f.done[0]);
      c.classList.toggle('p2', f.cursor[1] === k && (f.p2Human || f.done[0]) && !f.done[1] && f.mode !== 'arcade' && f.mode !== 'online');
      const picked = f.picks[0].includes(k) || f.picks[1].includes(k);
      c.classList.toggle('picked', picked);
    });
    [0, 1].forEach((ti) => this.renderCard(ti));
    const keys = f.p2Human ? 'P1: WASD + Enter confirma, Backspace volta · P2: setas + J confirma, K volta' : 'WASD ou controle movem · Enter, Espaço ou ✕ confirma · Backspace ou ○ volta';
    this.$('sel-help').innerHTML = keys + (f.mode === 'versus' || f.mode === 'tag' ? (f.p2Human ? '' : ' · <b>Jogador 2: aperte J para entrar</b>') : '') + ' · <b>Esc</b> menu';
    if (document.body.classList.contains('mobile')) this.$('sel-help').textContent = 'Toque no lutador para escolher. A próxima escolha será o adversário ou parceiro, conforme o modo.';
  },
  renderCard(ti) {
    const f = this.flow;
    const el = this.$('card-' + ti);
    const solo = f.mode === 'arcade' || f.mode === 'online';
    if (ti === 1 && solo) {
      el.innerHTML = f.mode === 'arcade' ? `<div class="card-empty"><b>ESCADA ARCADE</b><p>7 lutas, dificuldade crescente e um chefe final.</p><p>${Profile.isUnlocked('iales') ? 'Chefe: IALES' : 'Chefe: ???'}</p></div>` : `<div class="card-empty"><b>ONLINE</b><p>O adversário escolhe no computador dele.</p></div>`;
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
      <div class="picked-row">${pickedIds.map((id) => `<span style="background-image:url(assets/ui/face-${id}.png)"></span>`).join('')}</div>
      ${isRandom ? `<div class="big-sprite q">?</div><h3>ALEATÓRIO</h3><p class="bio">Deixe o destino escolher.</p>` : lock ? `<div class="big-sprite locked"></div><h3>???</h3><p class="bio">Lutador secreto. Resgate um código no menu para liberar.</p>` : `
      <div class="big-sprite" style="background-image:url(assets/sprites/${d.id}.png)"></div>
      <h3 style="--c:${d.colors.accent}">${d.name}</h3>
      <div class="ttl">${d.title}</div>
      ${SIGNATURES[d.id] ? `<div class="trait" title="${SIGNATURES[d.id].desc}"><b>${SIGNATURES[d.id].trait}</b><small>${SIGNATURES[d.id].desc}</small></div>` : ''}
      <p class="bio">${d.bio}</p>
      ${d.quotes && d.quotes.intro && d.quotes.intro.length ? `<div class="quotes">“${d.quotes.intro[0]}”</div>` : ''}
      <div class="statbars">${bar('PODER', st.power, 1.6)}${bar('VELOC.', st.speed, 1.45)}${bar('PESO', st.weight, 1.3)}${bar('VIDA', st.hp || 100, 150)}</div>
      <div class="theme">${kit ? kit.theme : ''}${kit && kit.autoAim ? ' · <b>AUTO AIM</b>' : ''}</div>
      <ul class="kit">${(kit ? kit.powers : []).map((p, i) => `
        <li class="${p.slot}"><span class="ico" style="${Art.css('abil:' + d.id, p.row, 1, 34)}"></span>
          <span class="tx"><b>${p.name}</b><small>${SLOT_NAMES[p.slot]} · ${KIND_NAMES[p.kind] || ''}</small></span>
          <kbd>${Input.label(keyFor, 'a' + i)}</kbd></li>`).join('')}</ul>`}`;
    const spr = el.querySelector('.big-sprite:not(.q):not(.locked)');
    if (spr) spr.classList.toggle('ready', f.done[ti]);
  },
  selMove(who, dx, dy) {
    const f = this.flow;
    const n = FIGHTERS.length + 1;
    const cols = 7;
    let i = f.cursor[who];
    if (dx) i = (i + dx + n) % n;
    if (dy) { i += dy * cols; if (i < 0) i += Math.ceil(n / cols) * cols; if (i >= n) i = i % cols; if (i >= n) i = n - 1; }
    f.cursor[who] = i;
    AudioSys.cursor();
    this.renderSelect();
  },
  selConfirm(who) {
    const f = this.flow;
    if (f.done[who]) return;
    let i = f.cursor[who];
    if (i >= FIGHTERS.length) {
      const pool = FIGHTERS.map((d, k) => k).filter((k) => Profile.isUnlocked(FIGHTERS[k].id) && !f.picks[who].includes(k));
      i = pool[(Math.random() * pool.length) | 0];
    }
    const d = FIGHTERS[i];
    if (!Profile.isUnlocked(d.id)) { AudioSys.back(); this.toast('Lutador secreto — resgate um código no menu!'); return; }
    if (f.picks[who].includes(i)) { AudioSys.back(); return; }
    f.picks[who].push(i);
    AudioSys.select();
    AudioSys.play('whoosh', { vol: 0.5 });
    if (f.picks[who].length >= f.need) f.done[who] = true;
    if (f.mode === 'arcade' || f.mode === 'online') {
      if (f.done[0]) return this.afterSelect();
    } else if (f.done[0] && f.done[1]) return this.afterSelect();
    if (!f.p2Human && f.done[0] && who === 0) f.cursor[1] = (i + 3) % FIGHTERS.length;
    this.renderSelect();
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
    if (Input.hit(['Escape'])) this.toMenu();
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
    const fauna = { bee: 'abelhas', bird: 'pássaros', butterfly: 'borboletas', bat: 'morcegos', fish: 'peixes' };
    const fz = [...new Set(s.fauna || [])].map((k) => fauna[k]).join(', ');
    el.innerHTML = `<div class="sp-img ${s.sheet ? 'anim' : ''}" style="${img}"></div>
      <h3>${s.name}</h3>
      <p class="mech">${s.mech ? MECH_INFO[s.mech] || '' : 'Arena clássica.'}</p>
      <p class="wx">Clima possível: ${(s.weather || ['clear']).map((w) => WEATHER_INFO[w].icon + ' ' + WEATHER_INFO[w].name).join(' · ')}</p>
      ${fz ? `<p class="fz">Fauna: ${fz}</p>` : ''}
      ${s.gravity ? `<p class="fz">Gravidade ${Math.round(s.gravity * 100)}%</p>` : ''}`;
  },
  confirmStage() {
    const f = this.flow;
    AudioSys.select();
    f.weather = this.$('opt-weather').value;
    f.difficulty = parseInt(this.$('opt-diff').value, 10);
    Profile.setting('difficulty', f.difficulty);
    f.dummy = this.$('opt-dummy').value;
    f.infinite = this.$('opt-inf').checked;
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
    });
  },
  showVs(cfg, then) {
    const side = (ti) => cfg.teams[ti].map((id) => {
      const d = FIGHTERS.find((x) => x.id === id);
      return `<div class="vs-f"><div class="vs-sprite" style="background-image:url(assets/sprites/${id}.png)"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${d.title}</small></div>`;
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
    const pool = FIGHTERS.filter((d) => d.id !== me && !d.secret).map((d) => d.id).sort(() => Math.random() - 0.5).slice(0, 6);
    const boss = me !== 'iales' && Profile.isUnlocked('iales') ? 'iales' : me !== 'fullstack' ? 'fullstack' : 'stack';
    if (pool.includes(boss)) pool.splice(pool.indexOf(boss), 1, FIGHTERS.find((d) => !d.secret && d.id !== me && !pool.includes(d.id) && d.id !== boss).id);
    f.ladder = [...pool, boss];
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
    const opp = f.ladder[f.arcadeStep];
    const st = STAGE_LIST[(Math.random() * STAGE_LIST.length) | 0];
    this.launch({
      mode: 'arcade', teams: [[me], [opp]], stage: st.id, weather: 'random', difficulty: Math.min(3, AI.level(f.difficulty == null ? 1 : f.difficulty) + (f.arcadeStep >= 5 ? 1 : 0)),
      cpu: [false, true], pets: [Profile.petFor(0), PETS[0]], roundsToWin: 2, timer: 180,
    });
  },
  listReplays() {
    const box = this.$('replay-list');
    if (!box) return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('dsfighters.replay.')).sort().reverse();
    if (!keys.length) { box.innerHTML = '<p class="sub">Nenhum replay ainda — termine uma luta local (versus/arcade/survival/treino) e ela fica salva aqui.</p>'; return; }
    box.innerHTML = keys.map((k) => {
      const r = JSON.parse(localStorage.getItem(k));
      const names = (r.cfg.teams || []).map((t) => (FIGHTERS.find((f) => f.id === t[0]) || {}).name || '?').join(' vs ');
      const secs = Math.floor((r.frames || []).length / 60);
      const d = new Date(+k.split('.').pop());
      return `<div class="replay-row"><button class="nav btn replay-play" data-k="${k}">▶ ASSISTIR</button><div><b>${names}</b><br><small>${r.cfg.mode} · ${secs}s · ${d.toLocaleString()}</small></div><button class="nav btn tiny danger replay-del" data-k="${k}">APAGAR</button></div>`;
    }).join('');
    box.querySelectorAll('.replay-play').forEach((b) => b.addEventListener('click', () => this.playReplay(b.dataset.k)));
    box.querySelectorAll('.replay-del').forEach((b) => b.addEventListener('click', () => { localStorage.removeItem(b.dataset.k); this.listReplays(); }));
  },
  playReplay(key) {
    const r = JSON.parse(localStorage.getItem(key));
    if (!r || !r.frames) return;
    this.game.stop();
    this.game.replaySeed = r.seed >>> 0;
    this.game.replayFrames = r.frames;
    const cfg = Object.assign({}, r.cfg, { cpu: [true, true], mode: 'replay' });
    this.lastCfg = null;
    this.showVs(cfg, () => {
      this.$('stage-wrap').classList.remove('demo');
      this.$('stage-wrap').classList.add('on');
      this.show('fight');
      this.game.start(cfg);
    });
  },
  arcadeNext() {
    const f = this.flow;
    f.arcadeStep++;
    this.launchArcade();
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
        if (f.arcadeStep >= 6) { title = 'CAMPEÃO DO ARCADE!'; Profile.record('bestArcade', 7); }
        else { Profile.record('bestArcade', f.arcadeStep + 1); next.hidden = false; }
      }
      this.$('btn-again').textContent = res.winner === 0 ? 'REVANCHE' : 'CONTINUAR';
    } else if (game.mode === 'survival') {
      if (res.winner === 0) {
        f.survivalWins = (f.survivalWins || 0) + 1;
        Profile.record('bestSurvival', f.survivalWins);
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
    this.$('res-body').innerHTML = `
      <div class="res-win">${winIds.map((id) => `<div class="win-sprite" style="background-image:url(assets/sprites/${id}.png)"></div>`).join('')}<blockquote>“${q}”</blockquote></div>
      <table class="res-table"><thead><tr><th>Time</th><th>Lutador</th><th>Dano</th><th>Acertos</th><th>Maior combo</th></tr></thead><tbody>
      ${res.teams.map((t, ti) => t.map((m) => `<tr class="${ti === res.winner ? 'w' : ''}"><td>${ti === 0 ? 'P1' : 'P2'}</td><td>${m.name}</td><td>${m.dmg}</td><td>${m.hits}</td><td>${m.combo}</td></tr>`).join('')).join('')}
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
    grid.innerHTML = PETS.map((p) => `
      <button class="nav pet ${p.id === cur ? 'on' : ''}" data-id="${p.id}">
        <span class="pet-spr ${p.row < 0 ? 'none' : ''}" style="${p.row >= 0 ? `background-image:url(assets/pets/pets.png);--row:${p.row}` : ''}"></span>
        <b>${p.name}</b><small>${p.buff}</small>${p.id === cur ? '<em>EQUIPADO</em>' : ''}
      </button>`).join('');
    grid.querySelectorAll('.pet').forEach((b) => b.addEventListener('click', () => {
      Profile.setPet(slot, b.dataset.id);
      AudioSys.play('pickup');
      this.renderPets();
      this.buildMenuSide();
      const nb = grid.querySelector(`[data-id="${b.dataset.id}"]`);
      if (nb) nb.focus();
    }));
  },

  /* ---------- resgate ---------- */
  enter_replays() { this.listReplays(); },
  SKIN_HUES: [
    ['Original', 0], ['Vermelha', 330], ['Laranja', 25], ['Amarela', 55], ['Verde', 110],
    ['Ciano', 175], ['Azul', 210], ['Roxa', 265], ['Rosa', 300], ['P&B', 0],
  ],
  enter_skins() {
    const sel = this.$('skin-fighter');
    sel.innerHTML = FIGHTERS.filter((f) => !f.secret || Profile.isUnlocked(f.id)).map((f) => `<option value="${f.id}">${f.name}</option>`).join('');
    const hs = this.$('skin-hue');
    hs.innerHTML = this.SKIN_HUES.map(([n, h]) => `<option value="${h}">${n}</option>`).join('');
    const upd = () => {
      const fid = sel.value;
      if (document.activeElement !== hs) hs.value = String(Profile.skinFor(fid) || 0);
      this.renderSkinPreview(fid, +hs.value);
    };
    sel.onchange = upd; hs.onchange = upd;
    upd();
    this.$('btn-skin-save').onclick = () => {
      Profile.setSkin(sel.value, +hs.value);
      AudioSys.select();
      this.toast('Skin salva no perfil!');
    };
  },
  renderSkinPreview(fid, hue) {
    const el = this.$('skin-preview');
    if (!el) return;
    const d = FIGHTERS.find((f) => f.id === fid);
    const filt = hue === -1 ? 'grayscale(1)' : (hue ? `hue-rotate(${hue}deg)` : '');
    el.innerHTML = `<div class="skin-sprite" style="background-image:url(assets/sprites/${fid}.png);${filt ? `filter:${filt};` : ''}"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${hue === -1 ? 'preto e branco' : hue ? 'hue ' + hue + '°' : 'paleta original'}</small>`;
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
      const ids = r.already ? Profile.SECRET_IDS : r.ids;
      this.$('redeem-faces').innerHTML = ids.map((id, k) => {
        const d = FIGHTERS.find((x) => x.id === id);
        return `<div class="rf" style="--d:${k * 0.25}s"><div class="vs-sprite" style="background-image:url(assets/sprites/${id}.png)"></div><b style="--c:${d.colors.accent}">${d.name}</b><small>${d.title}</small></div>`;
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
    const key = fighter.def.id + ':' + kit.map((p) => p.id).join(',');
    if (key === this._touchKitKey) return;
    this._touchKitKey = key;
    this.$('touch-controls').querySelectorAll('[data-power]').forEach((button) => {
      const index = +button.dataset.power;
      const power = kit[index];
      button.hidden = !power;
      button.setAttribute('aria-label', power ? `${index + 1}: ${power.name}` : 'Habilidade indisponível');
      button.classList.toggle('ult', !!power && power.slot === 'ultimate');
      button.innerHTML = `<span class="touch-key">${index === 9 ? '0' : index + 1}</span>`;
      button.style.cssText = power ? Art.css('abil:' + fighter.kitOwnerId(power), power.row, 0, 44) : '';
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
    pick.innerHTML = FIGHTERS.map((d) => `<button class="nav mp" data-id="${d.id}" style="background-image:url(assets/ui/face-${d.id}.png)" aria-label="${d.name}"></button>`).join('');
    const show = (id) => {
      const d = FIGHTERS.find((x) => x.id === id);
      const kit = POWERS[id];
      const lock = !Profile.isUnlocked(id);
      pick.querySelectorAll('.mp').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      this.$('moves-list').innerHTML = lock ? `<h3>???</h3><p>Lutador secreto. Resgate um código para ver as habilidades.</p>` : `
        <h3 style="--c:${d.colors.accent}">${d.name} <small>${d.title}</small></h3><p class="sub small">${kit.theme}${kit.autoAim ? ' · Todos os ataques com AUTO AIM' : ''}</p>
        <ul class="kit big">${kit.powers.map((p, i) => `<li class="${p.slot}"><span class="ico anim" style="${Art.css('abil:' + id, p.row, 0, 64)};--row:${p.row}"></span>
          <span class="tx"><b>${p.name}</b><small>${SLOT_NAMES[p.slot]} · ${KIND_NAMES[p.kind] || ''}${p.dmg ? ' · dano ' + p.dmg : ''}</small><em>${p.desc || ''}</em></span><kbd>${Input.label(0, 'a' + i)}</kbd></li>`).join('')}</ul>`;
    };
    pick.querySelectorAll('.mp').forEach((b) => { b.addEventListener('click', () => show(b.dataset.id)); b.addEventListener('focus', () => show(b.dataset.id)); });
    show(FIGHTERS.find((d) => Profile.isUnlocked(d.id)).id);
  },

  /* ---------- online ---------- */
  enter_online() {
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
    const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (this.screen === 'title') {
      if (Input.hit(['Enter', 'Space']) || m.confirm || m.start) this.pressStart();
      return;
    }
    if (this.screen === 'select') { this.selectKeys(m); return; }
    if (this.screen === 'fight') {
      if (m.start) this.pause();
      if ((this._touchTick = (this._touchTick || 0) + 1) % 15 === 0) this.updateTouchPowers();
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
