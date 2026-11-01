/* ============================================================
   DS FIGHTERS — Cliente online (WebSocket).
   Autoridade: o navegador do ANFITRIÃO (quem criou a sala) simula
   combate, pickups, clima, placar do round e vitória. O convidado
   envia só as entradas e desenha os snapshots (30/s).
   O servidor (online-server/) valida protocolo, membros, escolhas,
   limites e guarda o placar da sala. Sem servidor configurado, o modo
   online mostra "indisponível" — nunca simula uma sala falsa.
   ============================================================ */
const NET_PROTOCOL = 1;
const INPUT_BITS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'a0', 'a1', 'a2', 'a3', 'a4', 'tag'];
const EDGE_ACTIONS = ['punch', 'kick', 'a0', 'a1', 'a2', 'a3', 'a4', 'tag'];

const Net = {
  ws: null,
  status: 'off',
  room: null,
  me: null,
  token: null,
  url: '',
  score: [0, 0],
  remote: Object.assign({}, EMPTY_INPUT),
  retries: 0,
  wantRoom: false,
  bound: false,
  lastSent: -1,
  defaultUrl() {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return 'ws://localhost:8787';
    return '';
  },
  $(id) { return document.getElementById(id); },
  setStatus(text, kind = 'info') {
    this.statusText = text;
    const el = this.$('net-status');
    if (el) { el.textContent = text; el.className = 'net-status ' + kind; }
  },
  bindUi() {
    if (!this.bound) {
      this.bound = true;
      this.$('net-create').addEventListener('click', () => this.create());
      this.$('net-join').addEventListener('click', () => this.join());
      this.$('lobby-ready').addEventListener('click', () => this.toggleReady());
      this.$('lobby-leave').addEventListener('click', () => this.leave());
      this.$('lobby-pick').addEventListener('click', () => this.openPicker());
      this.$('lobby-copy').addEventListener('click', () => {
        const code = this.room ? this.room.code : '';
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => UI.toast('Código ' + code + ' copiado!')).catch(() => UI.toast('Código: ' + code));
        else UI.toast('Código: ' + code);
      });
      this.$('lobby-stage').addEventListener('change', (e) => this.send('stage', { id: e.target.value }));
      this.$('net-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
      const sel = this.$('lobby-stage');
      sel.innerHTML = `<option value="random">Aleatória</option>` + STAGE_LIST.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
    }
    if (!this.room) {
      const url = this.$('net-url').value.trim();
      if (!url) this.setStatus('ONLINE INDISPONÍVEL: nenhum servidor configurado. Hospede a pasta online-server/ e cole o endereço wss:// aqui (veja HOSPEDAGEM.md).', 'warn');
      else if (this.status !== 'open') this.setStatus('Pronto para conectar em ' + url, 'info');
    }
  },
  connect() {
    const url = (this.$('net-url').value || '').trim();
    const name = (this.$('net-name').value || 'Jogador').trim().slice(0, 16) || 'Jogador';
    Profile.data.name = name;
    Profile.setting('serverUrl', url);
    if (!/^wss?:\/\//.test(url)) {
      this.setStatus('ONLINE INDISPONÍVEL: informe um endereço ws:// ou wss:// de um servidor DS Fighters.', 'warn');
      return Promise.reject(new Error('sem servidor'));
    }
    if (this.ws && this.status === 'open' && this.url === url) return Promise.resolve();
    this.url = url;
    this.name = name;
    return new Promise((resolve, reject) => {
      this.setStatus('Conectando a ' + url + '…', 'info');
      let ws;
      try { ws = new WebSocket(url); } catch (e) { this.setStatus('Endereço inválido.', 'err'); reject(e); return; }
      this.ws = ws;
      this.status = 'connecting';
      const to = setTimeout(() => { if (this.status === 'connecting') { ws.close(); this.setStatus('Servidor não respondeu. Confira o endereço e se ele está no ar.', 'err'); reject(new Error('timeout')); } }, 7000);
      ws.onopen = () => {
        clearTimeout(to);
        this.status = 'open';
        this.retries = 0;
        const resume = this.room && this.token ? { code: this.room.code, token: this.token } : this.savedResume();
        ws.send(JSON.stringify({ t: 'hello', v: NET_PROTOCOL, name, resume }));
        resolve();
      };
      ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } this.onMessage(m); };
      ws.onerror = () => {};
      ws.onclose = () => {
        clearTimeout(to);
        const was = this.status;
        this.status = 'closed';
        if (was === 'connecting') { this.setStatus('Não foi possível conectar. O servidor está offline ou o endereço está errado.', 'err'); reject(new Error('closed')); return; }
        if (this.wantRoom && this.room) this.reconnect();
        else this.setStatus('Desconectado.', 'warn');
      };
    });
  },
  savedResume() {
    try { const r = JSON.parse(sessionStorage.getItem('dsf.resume') || 'null'); return r && r.code && r.token ? r : null; } catch (e) { return null; }
  },
  reconnect() {
    if (this.retries > 14) {
      this.setStatus('Conexão perdida de vez. A sala foi encerrada.', 'err');
      this.dropRoom();
      return;
    }
    this.retries++;
    this.setStatus(`Conexão perdida — tentando voltar (${this.retries}/15)…`, 'warn');
    if (UI.game.mode === 'online' && UI.game.running) UI.banner('RECONECTANDO…', '#ffb03b', 'Aguarde');
    setTimeout(() => this.connect().catch(() => this.reconnect()), 2000);
  },
  send(t, data) {
    if (!this.ws || this.status !== 'open') return false;
    this.ws.send(JSON.stringify(Object.assign({ t }, data || {})));
    return true;
  },
  async create() {
    AudioSys.select();
    try { await this.connect(); } catch (e) { return; }
    this.wantRoom = true;
    this.send('create', { mode: this.$('net-mode').value, stagePool: STAGE_LIST.map((s) => s.id) });
  },
  async join() {
    AudioSys.select();
    const code = this.$('net-code').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) { this.setStatus('O código da sala tem 6 letras/números.', 'warn'); return; }
    try { await this.connect(); } catch (e) { return; }
    this.wantRoom = true;
    this.send('join', { code });
  },
  myPlayer() { return this.room ? this.room.players.find((p) => p.id === this.me) : null; },
  isHost() { return this.room && this.room.hostId === this.me; },
  openPicker() {
    if (!this.room) return;
    UI.startFlow('online', { need: this.room.mode === '2x2' ? 2 : 1 });
  },
  pickFighters(ids) {
    this.send('pick', { fighters: ids, pet: Profile.data.pets[0] });
  },
  toggleReady() {
    const p = this.myPlayer();
    if (!p) return;
    if (!p.picks || !p.picks.length) { UI.toast('Escolha seu lutador primeiro.'); this.openPicker(); return; }
    this.send('ready', { on: !p.ready });
  },
  requestRematch() { this.send('rematch', {}); },
  leave(silent) {
    if (this.room) this.send('leave', {});
    this.dropRoom();
    if (!silent) this.setStatus('Você saiu da sala.', 'info');
  },
  dropRoom() {
    this.wantRoom = false;
    this.room = null;
    this.token = null;
    try { sessionStorage.removeItem('dsf.resume'); } catch (e) { /* */ }
    if (UI.game && UI.game.mode === 'online' && UI.game.running) { UI.game.stop(); UI.toMenu(); }
    this.renderLobby();
  },
  renderLobby() {
    const lobby = this.$('net-lobby');
    const conn = this.$('net-connect');
    if (!lobby) return;
    const r = this.room;
    lobby.classList.toggle('hidden', !r);
    conn.classList.toggle('hidden', !!r);
    if (!r) return;
    this.$('lobby-code').textContent = r.code;
    const sel = this.$('lobby-stage');
    sel.value = r.stage || 'random';
    sel.disabled = !this.isHost();
    const slots = [0, 1].map((team) => r.players.find((p) => p.team === team));
    this.$('lobby-players').innerHTML = slots.map((p, team) => {
      if (!p) return `<div class="lp empty"><b>${team === 0 ? 'ANFITRIÃO' : 'CONVIDADO'}</b><span>Aguardando jogador… envie o código <b>${r.code}</b></span></div>`;
      const faces = (p.picks || []).map((id) => `<i style="background-image:url(assets/ui/face-${id}.png)"></i>`).join('');
      return `<div class="lp ${p.ready ? 'ready' : ''} ${p.connected ? '' : 'off'} ${p.id === this.me ? 'me' : ''}">
        <b>${team === 0 ? 'ANFITRIÃO' : 'CONVIDADO'}${p.id === this.me ? ' (você)' : ''}</b>
        <span class="pn">${escapeHtml(p.name)}</span>
        <span class="faces">${faces || '<em>sem lutador</em>'}</span>
        <span class="st">${!p.connected ? 'DESCONECTADO' : p.ready ? 'PRONTO' : 'ESCOLHENDO'}</span></div>`;
    }).join('');
    const me = this.myPlayer();
    this.$('lobby-ready').textContent = me && me.ready ? 'CANCELAR PRONTO' : 'PRONTO';
    const modeName = r.mode === '2x2' ? '2 × 2 duplas' : '1 × 1';
    this.setStatus(`Sala ${r.code} · ${modeName} · placar ${r.score[0]} × ${r.score[1]}` + (slots[1] ? (slots.every((p) => p && p.ready) ? ' · iniciando…' : ' · os dois precisam ficar PRONTOS') : ' · aguardando convidado'), 'ok');
  },
  onMessage(m) {
    switch (m.t) {
      case 'welcome':
        this.me = m.id;
        break;
      case 'joined':
        this.token = m.token;
        this.me = m.id;
        try { sessionStorage.setItem('dsf.resume', JSON.stringify({ code: m.code, token: m.token })); } catch (e) { /* */ }
        break;
      case 'room':
        this.room = m.room;
        this.score = m.room.score;
        this.renderLobby();
        if (UI.screen === 'menu' || UI.screen === 'title') UI.show('online');
        break;
      case 'start':
        this.startMatch(m);
        break;
      case 'input':
        this.mergeRemote(m.i);
        break;
      case 'snap':
        if (UI.game.netRole === 'guest' && UI.game.running) UI.game.applySnapshot(m.s);
        break;
      case 'end':
        this.score = m.score;
        if (UI.game.netRole === 'guest' && UI.game.running) {
          UI.game.running = false;
          UI.game.stop();
          UI.onMatchEnd(m.result, UI.game);
        }
        break;
      case 'peer': {
        const g = UI.game;
        if (m.ev === 'left') {
          UI.banner('ADVERSÁRIO CAIU', '#ffb03b', 'Aguardando reconexão (até 30 s)…');
          if (g.netRole === 'host' && g.running) g.paused = true;
        } else if (m.ev === 'back') {
          UI.banner('ADVERSÁRIO VOLTOU', '#7dff5e', 'Continuando');
          if (g.netRole === 'host' && g.running) g.paused = false;
        }
        break;
      }
      case 'abort':
        UI.toast(m.msg || 'Partida cancelada.', 3500);
        if (UI.game.mode === 'online' && UI.game.running) { UI.game.stop(); HUD.hide(); UI.$('stage-wrap').classList.remove('on'); }
        UI.show('online');
        break;
      case 'closed':
        UI.toast(m.msg || 'A sala foi encerrada.', 3500);
        this.dropRoom();
        UI.show('online');
        this.setStatus(m.msg || 'A sala foi encerrada.', 'warn');
        break;
      case 'error':
        this.setStatus('Servidor: ' + (m.msg || 'erro'), 'err');
        UI.toast(m.msg || 'Erro do servidor');
        if (m.code === 'resume_failed') { this.room = null; this.token = null; try { sessionStorage.removeItem('dsf.resume'); } catch (e) { /* */ } this.renderLobby(); }
        break;
      default: break;
    }
  },
  startMatch(m) {
    const r = m.room || this.room;
    this.room = r;
    const me = this.myPlayer();
    if (!me) return;
    const host = r.hostId === this.me;
    const teams = [0, 1].map((t) => (r.players.find((p) => p.team === t) || { picks: ['stack'] }).picks);
    const pets = [0, 1].map((t) => { const p = r.players.find((x) => x.team === t); return PETS.find((x) => x.id === (p && p.pet)) || PETS[0]; });
    const cfg = {
      mode: 'online', netRole: host ? 'host' : 'guest', localTeam: me.team, tag: r.mode === '2x2',
      teams, pets, stage: m.stage, weather: 'random', roundsToWin: 2, timer: 99, cpu: [false, false],
    };
    this.remote = Object.assign({}, EMPTY_INPUT);
    UI.game.onNetEnd = (result) => this.send('end', { result: { winner: result.winner, wins: result.wins, teams: result.teams } });
    UI.flow = { mode: 'online', picks: [[], []], need: 1 };
    UI.launch(cfg);
  },
  /* --- entradas --- */
  encode(inp) { let b = 0; INPUT_BITS.forEach((k, i) => { if (inp[k]) b |= 1 << i; }); return b; },
  decode(b) { const o = {}; INPUT_BITS.forEach((k, i) => { o[k] = !!(b & (1 << i)); }); return o; },
  mergeRemote(bits) {
    const d = this.decode(bits | 0);
    const r = this.remote;
    ['left', 'right', 'up', 'down'].forEach((k) => { r[k] = d[k]; });
    EDGE_ACTIONS.forEach((k) => { r[k] = r[k] || d[k]; });
  },
  takeRemote() {
    const out = Object.assign({}, this.remote);
    EDGE_ACTIONS.forEach((k) => { this.remote[k] = false; });
    return out;
  },
  /* chamado a cada quadro pelo loop principal */
  frame(game) {
    if (game.mode !== 'online' || !game.running || game.paused || this.status !== 'open') return;
    if (game.netRole === 'guest') {
      const bits = this.encode(Input.read(0));
      const edges = bits & ~0b1111;
      if (bits !== this.lastSent || edges || game.time % 10 === 0) { this.send('input', { i: bits }); this.lastSent = bits; }
    } else if (game.netRole === 'host' && game.time % 2 === 0) {
      this.send('snap', { s: game.snapshot() });
    }
  },
};
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
