/* ============================================================
   DS FIGHTERS — Cliente online.
   Dois transportes, mesmo protocolo (js/net/room-core.js):
   • P2P (padrão, grátis): WebRTC via PeerJS. O navegador de quem cria a
     sala roda o núcleo de salas e é o ANFITRIÃO. Os outros se conectam
     direto nele pelo código da sala. Só o "encontro" inicial usa o
     broker público do PeerJS; a luta trafega direto entre navegadores.
   • Servidor dedicado: WebSocket para a pasta online-server/.
   Autoridade da luta: anfitrião simula combate, pickups, clima, placar e
   vitória; os demais enviam só entradas e desenham snapshots (30/s).
   Sem conexão real a interface diz "indisponível" — nunca finge uma sala.
   ============================================================ */
const NET_PROTOCOL = RoomCore.PROTOCOL;
const INPUT_BITS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'tag'];
const EDGE_ACTIONS = ['punch', 'kick', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'tag'];
const PEER_PREFIX = 'dsfighters-v2-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const Net = {
  link: null, // { send(obj), close() }
  peer: null,
  core: null,
  status: 'off',
  transport: 'p2p',
  room: null,
  me: null,
  token: null,
  url: '',
  score: [0, 0],
  remotes: [0, 1, 2, 3].map(() => Object.assign({}, EMPTY_INPUT)),
  retries: 0,
  wantRoom: false,
  bound: false,
  lastSent: -1,
  inputSeq: 0,
  outbox: [],
  heartbeatTimer: null,
  reconnectTimer: null,
  socket: null,
  lastPongAt: 0,
  roomList: [],
  ping: 0,
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
  p2pAvailable() { return typeof Peer === 'function' && typeof RTCPeerConnection === 'function'; },
  ensureOnlineUi() {
    const connect = this.$('net-connect');
    const lobby = this.$('net-lobby');
    if (connect && !this.$('net-directory')) connect.insertAdjacentHTML('beforeend', `
      <section class="net-directory" id="net-directory" aria-labelledby="net-directory-title">
        <div class="net-directory-head"><b id="net-directory-title">SALAS PÚBLICAS</b><button class="nav btn tiny" id="net-rooms-refresh" type="button">ATUALIZAR</button></div>
        <p class="sub small" id="net-directory-hint">Disponível quando um servidor dedicado estiver conectado. P2P usa código ou link.</p>
        <div id="net-rooms" aria-live="polite"></div>
      </section>`);
    if (lobby && !this.$('lobby-config')) lobby.insertAdjacentHTML('afterbegin', `
      <div class="lobby-config" id="lobby-config">
        <b>REGRAS DA SALA</b>
        <label>Rounds para vencer <select id="lobby-rounds" aria-label="Rounds para vencer"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="7">7</option><option value="9">9</option></select></label>
        <label>Tempo por round <select id="lobby-timer" aria-label="Tempo por round"><option value="30">30 s</option><option value="60">60 s</option><option value="99">99 s</option><option value="120">120 s</option><option value="180" selected>180 s</option><option value="240">240 s</option><option value="300">300 s</option></select></label>
        <label class="chk"><input type="checkbox" id="lobby-infinite-life" /> Vida infinita</label>
        <label class="chk"><input type="checkbox" id="lobby-infinite-meter" /> Medidores infinitos</label>
      </div>`);
  },
  startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.link || this.status !== 'open') return;
      if (this.lastPongAt && performance.now() - this.lastPongAt > 7500) {
        try { this.link.close(); } catch (e) { /* conexão já fechada */ }
        return;
      }
      this.send('ping', { at: performance.now() });
    }, 2000);
  },
  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  },
  onlineConfig() {
    const r = this.room && this.room.config;
    const useControls = !this.room || this.isHost();
    const val = (id, fallback) => { const e = this.$(id); return e ? e.value : fallback; };
    const checked = (id) => !!(this.$(id) && this.$(id).checked);
    return RoomCore.normalizeConfig({
      roundsToWin: useControls ? +val('lobby-rounds', r && r.roundsToWin || 2) : +(r && r.roundsToWin || 2),
      timer: useControls ? +val('lobby-timer', r && r.timer || 180) : +(r && r.timer || 180),
      infiniteLife: useControls ? checked('lobby-infinite-life') : !!(r && r.infiniteLife),
      infiniteMeter: useControls ? checked('lobby-infinite-meter') : !!(r && r.infiniteMeter),
    });
  },
  syncConfigUi() {
    const c = this.onlineConfig();
    const host = this.isHost();
    [['lobby-rounds', c.roundsToWin], ['lobby-timer', c.timer]].forEach(([id, value]) => { const e = this.$(id); if (e) { e.value = String(value); e.disabled = !host; } });
    [['lobby-infinite-life', c.infiniteLife], ['lobby-infinite-meter', c.infiniteMeter]].forEach(([id, value]) => { const e = this.$(id); if (e) { e.checked = value; e.disabled = !host; } });
  },
  changeConfig() {
    if (!this.room || !this.isHost()) return;
    this.send('config', { config: this.onlineConfig() });
  },
  renderRooms(list) {
    this.roomList = Array.isArray(list) ? list.filter((r) => r && /^[A-Z0-9]{6}$/.test(String(r.code).toUpperCase()) && Number.isInteger(r.players) && Number.isInteger(r.cap)) : [];
    const box = this.$('net-directory');
    const out = this.$('net-rooms');
    if (!box || !out) return;
    const enabled = this.$('net-transport') && this.$('net-transport').value === 'ws';
    box.classList.toggle('hidden', !enabled);
    if (!enabled) { out.innerHTML = ''; return; }
    if (this.status !== 'open') { out.innerHTML = '<p class="sub small">Servidor dedicado não conectado; a lista ao vivo está indisponível.</p>'; return; }
    if (!this.roomList.length) { out.innerHTML = '<p class="sub small">Nenhuma sala pública aberta agora.</p>'; return; }
    out.innerHTML = this.roomList.map((r) => {
      const mode = r.mode === '2x2-4' ? '2 × 2 · 4 jogadores' : r.mode === '2x2' ? '2 × 2 · duplas' : '1 × 1';
      const code = String(r.code).toUpperCase();
      const full = r.players >= r.cap;
      return `<div class="net-room-row"><span><b>${escapeHtml(code)}</b><small>${mode} · ${r.players}/${r.cap}${r.stage && r.stage !== 'random' ? ' · ' + escapeHtml(r.stage) : ''}</small></span><button class="nav btn tiny" data-room-code="${escapeHtml(code)}" ${full ? 'disabled' : ''}>${full ? 'CHEIA' : 'ENTRAR'}</button></div>`;
    }).join('');
  },
  async joinListed(code) {
    const input = this.$('net-code');
    if (input) input.value = code;
    await this.join();
  },
  bindUi() {
    if (!this.bound) {
      this.bound = true;
      this.ensureOnlineUi();
      this.$('net-create').addEventListener('click', () => this.create());
      this.$('net-join').addEventListener('click', () => this.join());
      this.$('lobby-ready').addEventListener('click', () => this.toggleReady());
      this.$('lobby-leave').addEventListener('click', () => this.leave());
      this.$('lobby-pick').addEventListener('click', () => this.openPicker());
      this.$('lobby-team').addEventListener('click', () => { const me = this.myPlayer(); if (me) this.send('team', { team: 1 - me.team }); });
      this.$('lobby-copy').addEventListener('click', () => this.copy(this.room ? this.room.code : '', 'Código'));
      this.$('lobby-link').addEventListener('click', () => this.copy(this.inviteLink(), 'Link'));
      this.$('chat-send').addEventListener('click', () => this.sendChat());
      this.$('chat-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.sendChat(); } e.stopPropagation(); });
      this.$('lobby-stage').addEventListener('change', (e) => this.send('stage', { id: e.target.value }));
      ['lobby-rounds', 'lobby-timer', 'lobby-infinite-life', 'lobby-infinite-meter'].forEach((id) => this.$(id).addEventListener('change', () => this.changeConfig()));
      this.$('net-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
      const tr = this.$('net-transport');
      tr.value = Profile.setting('netTransport') || (this.defaultUrl() ? 'ws' : 'p2p');
      tr.addEventListener('change', () => {
        if (this.room) { tr.value = this.transport; this.refreshConnectUi(); return; }
        Profile.setting('netTransport', tr.value);
        if (tr.value !== 'ws' && this.transport === 'ws') this.closeWs();
        this.refreshConnectUi();
        if (tr.value === 'ws') this.openDirectory(); else this.renderRooms([]);
      });
      this.$('net-url').addEventListener('input', () => this.refreshConnectUi());
      const sel = this.$('lobby-stage');
      sel.innerHTML = `<option value="random">Aleatória</option>` + STAGE_LIST.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
      this.$('net-rooms-refresh').addEventListener('click', () => this.openDirectory(true));
      this.$('net-rooms').addEventListener('click', (e) => { const b = e.target.closest('[data-room-code]'); if (b && !b.disabled) this.joinListed(b.dataset.roomCode); });
      this.startHeartbeat();
    }
    if (!this.$('net-url').value) this.$('net-url').value = Profile.setting('serverUrl') || this.defaultUrl();
    if (!this.$('net-name').value) this.$('net-name').value = Profile.data.name || 'Jogador';
    this.refreshConnectUi();
    if (this.$('net-transport').value === 'ws' && !this.room) this.openDirectory();
  },
  refreshConnectUi() {
    const ws = this.$('net-transport').value === 'ws';
    this.$('net-url-row').classList.toggle('hidden', !ws);
    this.$('net-hint').textContent = ws
      ? 'Servidor dedicado: todos se conectam ao endereço wss:// do servidor online-server/ (veja HOSPEDAGEM.md).'
      : 'P2P grátis: o navegador de quem cria a sala vira o anfitrião. Mande o código ou o link para os amigos — funciona pela internet, sem servidor próprio.';
    if (this.room) return;
    if (ws) {
      const url = this.$('net-url').value.trim();
      if (!url) this.setStatus('SERVIDOR DEDICADO INDISPONÍVEL: nenhum endereço configurado. Use P2P ou hospede online-server/ (HOSPEDAGEM.md).', 'warn');
      else this.setStatus('Pronto para conectar em ' + url, 'info');
    } else if (!this.p2pAvailable()) {
      this.setStatus('P2P INDISPONÍVEL: este navegador não tem WebRTC ou a biblioteca não carregou. Use o servidor dedicado.', 'err');
    } else this.setStatus('P2P pronto: crie uma sala ou digite o código de um amigo.', 'ok');
    this.renderRooms(this.roomList);
  },
  copy(text, what) {
    if (!text) return;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => UI.toast(what + ' copiado!')).catch(() => UI.toast(what + ': ' + text, 5000));
    else UI.toast(what + ': ' + text, 5000);
  },
  inviteLink() {
    if (!this.room) return '';
    let h = '#sala=' + this.room.code;
    if (this.transport === 'ws') h += '&srv=' + encodeURIComponent(this.url);
    return location.origin + location.pathname + h;
  },
  /** Abre a tela online já com o código se a página veio de um link de convite. */
  checkInvite() {
    const m = /sala=([A-Z0-9]{6})/i.exec(location.hash || '');
    if (!m) return false;
    const srv = /srv=([^&]+)/.exec(location.hash);
    UI.show('online');
    this.$('net-code').value = m[1].toUpperCase();
    if (srv) { this.$('net-transport').value = 'ws'; this.$('net-url').value = decodeURIComponent(srv[1]); }
    else this.$('net-transport').value = 'p2p';
    this.refreshConnectUi();
    this.setStatus('Convite para a sala ' + m[1].toUpperCase() + ' — digite seu nome e clique em ENTRAR NA SALA.', 'ok');
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  },
  myName() {
    const name = (this.$('net-name').value || 'Jogador').trim().slice(0, 16) || 'Jogador';
    Profile.data.name = name;
    Profile.save && Profile.save();
    return name;
  },
  /* ---------------- transporte WebSocket ---------------- */
  connectWs(resume) {
    const url = (this.$('net-url').value || '').trim();
    Profile.setting('serverUrl', url);
    if (!/^wss?:\/\//.test(url)) {
      this.setStatus('SERVIDOR INDISPONÍVEL: informe um endereço ws:// ou wss:// de um servidor DS Fighters.', 'warn');
      return Promise.reject(new Error('sem servidor'));
    }
    if (this.link && this.status === 'open' && this.transport === 'ws' && this.url === url) return Promise.resolve();
    if (this.socket && this.status !== 'closed') { try { this.socket.close(); } catch (e) { /* conexão antiga */ } }
    this.transport = 'ws';
    this.url = url;
    const name = this.myName();
    const attempt = (this.socketAttempt || 0) + 1;
    this.socketAttempt = attempt;
    return new Promise((resolve, reject) => {
      this.setStatus('Conectando a ' + url + '…', 'info');
      let ws;
      try { ws = new WebSocket(url); } catch (e) { this.setStatus('Endereço inválido.', 'err'); reject(e); return; }
      this.socket = ws;
      this.status = 'connecting';
      const to = setTimeout(() => { if (this.socketAttempt === attempt && this.status === 'connecting') { ws.close(); this.setStatus('Servidor não respondeu. Confira o endereço e se ele está no ar.', 'err'); reject(new Error('timeout')); } }, 8000);
      ws.onopen = () => {
        if (this.socketAttempt !== attempt) return;
        clearTimeout(to);
        this.status = 'open';
        this.retries = 0;
        this.lastPongAt = performance.now();
        this.link = { send: (o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); }, close: () => ws.close() };
        this.link.send({ t: 'hello', v: NET_PROTOCOL, name, resume: resume || null });
        this.flushOutbox();
        resolve();
      };
      ws.onmessage = (ev) => { if (this.socketAttempt !== attempt) return; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } this.onMessage(m); };
      ws.onerror = () => {};
      ws.onclose = () => {
        if (this.socketAttempt !== attempt) return;
        clearTimeout(to);
        this.socket = null;
        const was = this.status;
        this.status = 'closed';
        this.link = null;
        this.renderRooms([]);
        if (was === 'connecting') { this.setStatus('Não foi possível conectar. O servidor está offline ou o endereço está errado.', 'err'); reject(new Error('closed')); return; }
        this.onDrop();
      };
    });
  },
  closeWs() {
    this.socketAttempt = (this.socketAttempt || 0) + 1;
    const ws = this.socket;
    this.socket = null;
    this.link = null;
    this.status = 'closed';
    if (ws) { try { ws.close(); } catch (e) { /* conexão já fechada */ } }
    this.renderRooms([]);
  },
  /* ---------------- transporte P2P (WebRTC / PeerJS) ---------------- */
  openPeer(id) {
    return new Promise((resolve, reject) => {
      if (!this.p2pAvailable()) { reject(Object.assign(new Error('sem webrtc'), { type: 'no-webrtc' })); return; }
      const peer = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
      const to = setTimeout(() => { reject(Object.assign(new Error('timeout'), { type: 'timeout' })); try { peer.destroy(); } catch (e) { /* */ } }, 12000);
      peer.on('open', () => { clearTimeout(to); resolve(peer); });
      peer.on('error', (err) => {
        if (peer.open) { this.onPeerError(err); return; }
        clearTimeout(to);
        try { peer.destroy(); } catch (e) { /* */ }
        reject(err);
      });
      peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch (e) { /* */ } }, 1500); });
    });
  },
  onPeerError(err) {
    if (err && err.type === 'peer-unavailable' && this.pendingJoin) {
      this.pendingJoin.reject(err);
      return;
    }
    if (err && (err.type === 'network' || err.type === 'server-error')) this.setStatus('Problema na rede P2P — tentando continuar…', 'warn');
  },
  openDirectory(force) {
    if (this.room || !this.$('net-transport') || this.$('net-transport').value !== 'ws') return;
    if (!force && this.status === 'connecting') return;
    this.connectWs().catch(() => { this.renderRooms([]); });
  },
  flushOutbox() {
    if (!this.link || this.status !== 'open') return;
    const queue = this.outbox.splice(0);
    queue.forEach((m) => this.link && this.link.send(m));
  },
  destroyPeer() {
    if (this.peer) { try { this.peer.destroy(); } catch (e) { /* */ } }
    this.peer = null;
    this.core = null;
  },
  async hostP2P(mode, config) {
    const name = this.myName();
    this.destroyPeer();
    this.setStatus('Criando sala P2P…', 'info');
    let code = null;
    for (let k = 0; k < 4 && !this.peer; k++) {
      code = Array.from({ length: 6 }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join('');
      try { this.peer = await this.openPeer(PEER_PREFIX + code); } catch (e) {
        if (e.type !== 'unavailable-id') { this.setStatus(this.p2pErrorText(e), 'err'); return false; }
      }
    }
    if (!this.peer) { this.setStatus('Não foi possível reservar um código de sala. Tente de novo.', 'err'); return false; }
    this.transport = 'p2p';
    this.core = RoomCore.createRooms({ single: true, code, maxRooms: 1 });
    const local = { id: 'host-' + code, send: (m) => queueMicrotask(() => this.onMessage(m)) };
    this.link = { send: (o) => this.core && this.core.onMessage(local, o), close: () => {} };
    this.status = 'open';
    let n = 0;
    this.peer.on('connection', (dc) => {
      const c = { id: 'p' + (++n) + Math.random().toString(36).slice(2, 6), send: (m) => { if (dc.open) dc.send(m); }, kill: () => { try { dc.close(); } catch (e) { /* */ } } };
      dc.on('data', (d) => { if (this.core) this.core.onMessage(c, d); });
      dc.on('close', () => { if (this.core) this.core.onClose(c); });
      dc.on('error', () => {});
    });
    this.link.send({ t: 'hello', v: NET_PROTOCOL, name });
    this.link.send({ t: 'create', mode, config, stagePool: STAGE_LIST.map((s) => s.id) });
    return true;
  },
  async joinP2P(code, resume) {
    const name = this.myName();
    if (!this.peer || this.peer.destroyed || this.core) {
      this.destroyPeer();
      try { this.peer = await this.openPeer(); } catch (e) { this.setStatus(this.p2pErrorText(e), 'err'); throw e; }
    }
    this.transport = 'p2p';
    this.status = 'connecting';
    this.setStatus('Procurando a sala ' + code + '…', 'info');
    const dc = this.peer.connect(PEER_PREFIX + code, { serialization: 'json', reliable: true });
    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(Object.assign(new Error('timeout'), { type: 'timeout' })), 12000);
      this.pendingJoin = { reject: (e) => { clearTimeout(to); reject(e); } };
      dc.on('open', () => { clearTimeout(to); resolve(); });
    }).catch((e) => {
      this.pendingJoin = null;
      this.status = 'closed';
      this.setStatus(e.type === 'peer-unavailable' ? 'Sala ' + code + ' não encontrada (o anfitrião fechou a página ou o código está errado).' : this.p2pErrorText(e), 'err');
      throw e;
    });
    this.pendingJoin = null;
    this.status = 'open';
    this.retries = 0;
    this.link = { send: (o) => { if (dc.open) dc.send(o); }, close: () => { try { dc.close(); } catch (e) { /* */ } } };
    dc.on('data', (m) => this.onMessage(m));
    dc.on('close', () => { if (this.link && this.link.dc === dc) { this.link = null; this.status = 'closed'; this.onDrop(); } });
    this.link.dc = dc;
    this.link.send({ t: 'hello', v: NET_PROTOCOL, name, resume: resume || null });
  },
  p2pErrorText(e) {
    const t = e && e.type;
    if (t === 'no-webrtc' || t === 'browser-incompatible') return 'P2P INDISPONÍVEL: navegador sem WebRTC. Use Chrome, Edge, Firefox ou Safari atualizados.';
    if (t === 'timeout' || t === 'network' || t === 'server-error' || t === 'socket-error') return 'P2P INDISPONÍVEL: não foi possível falar com o serviço de encontro (rede bloqueada ou offline). Tente outra rede ou o servidor dedicado.';
    return 'Erro P2P: ' + (t || (e && e.message) || 'desconhecido');
  },
  /* ---------------- comum ---------------- */
  onDrop() {
    if (this.wantRoom && this.room) this.reconnect();
    else { this.renderRooms([]); if (this.room == null) this.setStatus('Desconectado.', 'warn'); }
  },
  reconnect() {
    if (this.reconnectTimer) return;
    if (this.retries > 14) {
      this.setStatus('Conexão perdida de vez. A sala foi encerrada.', 'err');
      this.dropRoom();
      return;
    }
    this.retries++;
    this.setStatus(`Conexão perdida — tentando voltar (${this.retries}/15)…`, 'warn');
    if (UI.game && UI.game.mode === 'online' && UI.game.running) UI.banner('RECONECTANDO…', '#ffb03b', 'Aguarde');
    const resume = this.room && this.token ? { code: this.room.code, token: this.token } : null;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const p = this.transport === 'ws' ? this.connectWs(resume) : this.joinP2P(this.room ? this.room.code : '', resume);
      p.catch(() => this.reconnect());
    }, 2000);
  },
  send(t, data) {
    const msg = Object.assign({ t }, data || {});
    if (this.link && this.status === 'open') { this.link.send(msg); return true; }
    const queueable = ['create', 'join', 'config', 'pick', 'ready', 'team', 'stage', 'chat', 'leave', 'rematch'];
    if (this.status === 'connecting' && queueable.includes(t)) {
      if (t === 'create' || t === 'join' || t === 'config') this.outbox = this.outbox.filter((m) => m.t !== t);
      if (this.outbox.length < 12) this.outbox.push(msg);
    }
    return false;
  },
  async create() {
    AudioSys.select();
    const mode = this.$('net-mode').value;
    const config = this.onlineConfig();
    if (this.$('net-transport').value === 'ws') {
      try { await this.connectWs(); } catch (e) { return; }
      this.wantRoom = true;
      this.send('create', { mode, config, stagePool: STAGE_LIST.map((s) => s.id) });
    } else {
      this.wantRoom = true;
      if (!(await this.hostP2P(mode, config))) this.wantRoom = false;
    }
  },
  async join() {
    AudioSys.select();
    const code = this.$('net-code').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) { this.setStatus('O código da sala tem 6 letras/números.', 'warn'); return; }
    this.wantRoom = true;
    try {
      if (this.$('net-transport').value === 'ws') { await this.connectWs(); this.send('join', { code }); }
      else { await this.joinP2P(code); this.send('join', { code }); }
    } catch (e) { this.wantRoom = false; }
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
  sendChat() {
    const el = this.$('chat-text');
    const text = el.value.trim();
    if (!text) return;
    this.send('chat', { text });
    el.value = '';
  },
  addChat(from, text) {
    const log = this.$('chat-log');
    if (!log) return;
    const d = document.createElement('div');
    d.innerHTML = `<b>${escapeHtml(from)}:</b> ${escapeHtml(text)}`;
    log.appendChild(d);
    while (log.children.length > 40) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  },
  requestRematch() { this.send('rematch', {}); },
  leave(silent) {
    if (this.room) this.send('leave', {});
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.retries = 0;
    this.outbox = [];
    this.dropRoom();
    if (this.transport === 'p2p') setTimeout(() => this.destroyPeer(), 300);
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
    const four = r.mode === '2x2-4';
    this.$('lobby-team').classList.toggle('hidden', !four);
    const slots = four ? [0, 1, 2, 3] : [0, 2];
    const label = (slot) => (four ? `EQUIPE ${slot < 2 ? 'A' : 'B'} · ${slot % 2 === 0 ? 'TITULAR' : 'RESERVA'}` : slot === 0 ? 'JOGADOR 1' : 'JOGADOR 2');
    this.$('lobby-players').classList.toggle('four', four);
    this.$('lobby-players').innerHTML = slots.map((slot) => {
      const p = r.players.find((x) => x.slot === slot);
      if (!p) return `<div class="lp empty team${slot >> 1}"><b>${label(slot)}</b><span>Vaga livre — envie o código <b>${r.code}</b></span></div>`;
      const faces = (p.picks || []).map((id) => `<i style="background-image:url(assets/ui/face-${id}.png)"></i>`).join('');
      const host = p.id === r.hostId ? ' ★ ANFITRIÃO' : '';
      return `<div class="lp team${p.team} ${p.ready ? 'ready' : ''} ${p.connected ? '' : 'off'} ${p.id === this.me ? 'me' : ''}">
        <b>${label(slot)}${host}${p.id === this.me ? ' (você)' : ''}</b>
        <span class="pn">${escapeHtml(p.name)}</span>
        <span class="faces">${faces || '<em>sem lutador</em>'}</span>
        <span class="st">${!p.connected ? 'DESCONECTADO' : p.ready ? 'PRONTO' : 'ESCOLHENDO'}</span></div>`;
    }).join('');
    const me = this.myPlayer();
    this.syncConfigUi();
    this.$('lobby-ready').textContent = me && me.ready ? 'CANCELAR PRONTO' : 'PRONTO';
    const modeName = r.mode === '2x2-4' ? '2 × 2 · 4 jogadores' : r.mode === '2x2' ? '2 × 2 duplas' : '1 × 1';
    const cap = r.cap || (four ? 4 : 2);
    const full = r.players.length >= cap;
    const via = this.transport === 'p2p' ? 'P2P' : 'servidor';
    this.setStatus(`Sala ${r.code} (${via}) · ${modeName} · placar ${r.score[0]} × ${r.score[1]} · ${r.players.length}/${cap} jogadores` + (full ? (r.players.every((p) => p.ready) ? ' · iniciando…' : ' · todos precisam ficar PRONTOS') : ' · aguardando jogadores'), 'ok');
  },
  onMessage(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'welcome':
        this.me = m.id;
        break;
      case 'rooms':
        this.renderRooms(m.rooms);
        break;
      case 'joined':
        this.token = m.token;
        this.me = m.id;
        try { sessionStorage.setItem('dsf.resume', JSON.stringify({ code: m.code, token: m.token })); } catch (e) { /* */ }
        break;
      case 'room':
        if (!m.room || !/^[A-Z0-9]{6}$/.test(String(m.room.code || '').toUpperCase()) || !Array.isArray(m.room.players)) break;
        m.room.config = RoomCore.normalizeConfig(m.room.config || {});
        this.room = m.room;
        this.score = Array.isArray(m.room.score) ? m.room.score.slice(0, 2) : [0, 0];
        this.renderLobby();
        if (UI.screen === 'menu' || UI.screen === 'title') UI.show('online');
        break;
      case 'start':
        this.startMatch(m);
        break;
      case 'input':
        if (Number.isInteger(m.i) && m.i >= 0 && m.i <= 0x1ffff) this.mergeRemote(m.i, m.slot == null ? 2 : m.slot);
        break;
      case 'snap':
        if (UI.game && UI.game.netRole === 'guest' && UI.game.running && m.s && Number.isInteger(m.s.t)
          && Array.isArray(m.s.teams) && m.s.teams.length === 2
          && m.s.teams.every((t) => t && !Array.isArray(t) && Array.isArray(t.m))) UI.game.applySnapshot(m.s);
        break;
      case 'pong':
        this.lastPongAt = performance.now();
        this.ping = Math.max(0, Math.round(performance.now() - Number(m.at || performance.now())));
        if (this.$('lobby-ping')) this.$('lobby-ping').textContent = this.isHost() ? 'você é o anfitrião' : `ping ${this.ping} ms`;
        break;
      case 'chat':
        this.addChat(m.from, m.text);
        if (UI.game && UI.game.running && UI.game.mode === 'online') UI.toast(m.from + ': ' + m.text, 2500);
        break;
      case 'end':
        this.score = Array.isArray(m.score) ? m.score.slice(0, 2) : this.score;
        if (UI.game && UI.game.netRole === 'guest' && UI.game.running) {
          UI.game.running = false;
          UI.game.stop();
          UI.onMatchEnd(m.result, UI.game);
        }
        break;
      case 'peer': {
        const g = UI.game;
        if (!g) break;
        if (m.ev === 'left') {
          UI.banner((m.name || 'JOGADOR') + ' CAIU', '#ffb03b', 'Aguardando reconexão (até 30 s)…');
          if (g.netRole === 'host' && g.running) g.paused = true;
        } else if (m.ev === 'back') {
          UI.banner((m.name || 'JOGADOR') + ' VOLTOU', '#7dff5e', 'Continuando');
          if (g.netRole === 'host' && g.running) g.paused = false;
        }
        break;
      }
      case 'abort':
        UI.toast(m.msg || 'Partida cancelada.', 3500);
        if (UI.game && UI.game.mode === 'online' && UI.game.running) { UI.game.stop(); HUD.hide(); UI.$('stage-wrap').classList.remove('on'); }
        UI.show('online');
        break;
      case 'closed':
        UI.toast(m.msg || 'A sala foi encerrada.', 3500);
        this.dropRoom();
        UI.show('online');
        this.setStatus(m.msg || 'A sala foi encerrada.', 'warn');
        break;
      case 'error':
        this.setStatus((this.transport === 'p2p' ? 'Sala: ' : 'Servidor: ') + (m.msg || 'erro'), 'err');
        UI.toast(m.msg || 'Erro');
        if (m.code === 'resume_failed') { this.room = null; this.token = null; try { sessionStorage.removeItem('dsf.resume'); } catch (e) { /* */ } this.renderLobby(); }
        break;
      default: break;
    }
  },
  startMatch(m) {
    const r = m.room || this.room;
    if (!r || !Array.isArray(r.players)) return;
    this.room = r;
    const me = this.myPlayer();
    if (!me) return;
    const host = r.hostId === this.me;
    const game = UI.game;
    if (m.resume && game && game.running && game.mode === 'online' && this.activeMatchId === m.matchId && this.activeRoomCode === r.code) {
      // A queda do socket não destrói a simulação: não lançar outro Game.start.
      this.remotes = [0, 1, 2, 3].map(() => Object.assign({}, EMPTY_INPUT));
      this.lastSent = -1;
      game.paused = false;
      UI.show('fight');
      UI.banner('CONEXÃO RESTAURADA', '#7dff5e', 'Round e placar preservados');
      return;
    }
    if (m.resume && host) {
      // Um reload perde entidades/casts autoritativos; não fingir recuperação.
      this.send('leave');
      this.dropRoom();
      UI.show('online');
      UI.toast('A página do anfitrião foi reiniciada. Crie outra sala; a partida anterior não pode ser restaurada.', 6000);
      return;
    }
    this.activeMatchId = m.matchId;
    this.activeRoomCode = r.code;
    const four = r.mode === '2x2-4';
    const teams = [0, 1].map((t) => {
      if (four) return r.players.filter((p) => p.team === t).sort((a, b) => a.slot - b.slot).map((p) => p.picks[0]);
      return (r.players.find((p) => p.team === t) || { picks: ['stack'] }).picks;
    });
    const pets = [0, 1].map((t) => { const p = r.players.find((x) => x.slot === t * 2) || r.players.find((x) => x.team === t); return PETS.find((x) => x.id === (p && p.pet)) || PETS[0]; });
    const synced = RoomCore.normalizeConfig(m.config || r.config || {});
    const cfg = {
      mode: 'online', netRole: host ? 'host' : 'guest', localTeam: me.team, mySlot: me.slot, fourP: four, tag: r.mode !== '1v1',
      teams, pets, stage: m.stage, weather: 'random', roundsToWin: synced.roundsToWin, timer: synced.timer,
      infiniteLife: synced.infiniteLife, infiniteMeter: synced.infiniteMeter, cpu: [false, false],
    };
    r.config = synced;
    this.remotes = [0, 1, 2, 3].map(() => Object.assign({}, EMPTY_INPUT));
    this.inputSeq = 0;
    this.lastSent = -1;
    UI.game.onNetEnd = (result) => this.send('end', { result: { winner: result.winner, wins: result.wins, teams: result.teams } });
    UI.flow = { mode: 'online', picks: [[], []], need: 1 };
    UI.launch(cfg);
    if (four) UI.toast(me.slot % 2 === 0 ? 'Você começa lutando! Troca: tecla TROCA · Assist: BAIXO+TROCA' : 'Você começa na reserva: TROCA entra na luta · SOCO chama ASSIST', 4500);
  },
  /* --- entradas --- */
  encode(inp) { let b = 0; INPUT_BITS.forEach((k, i) => { if (inp[k]) b |= 1 << i; }); return b; },
  decode(b) { const o = {}; INPUT_BITS.forEach((k, i) => { o[k] = !!(b & (1 << i)); }); return o; },
  mergeRemote(bits, slot) {
    if (!Number.isInteger(bits) || bits < 0 || bits > 0x1ffff) return;
    const d = this.decode(bits | 0);
    const r = this.remotes[slot & 3];
    ['left', 'right', 'up', 'down'].forEach((k) => { r[k] = d[k]; });
    EDGE_ACTIONS.forEach((k) => { r[k] = r[k] || d[k]; });
  },
  takeRemote(slot = 2) {
    const r = this.remotes[slot & 3];
    const out = Object.assign({}, r);
    EDGE_ACTIONS.forEach((k) => { r[k] = false; });
    return out;
  },
  /* chamado a cada passo pelo loop principal */
  frame(game) {
    if (game.mode !== 'online' || !game.running || game.paused || this.status !== 'open') return;
    if (game.netRole === 'guest') {
      const local = Input.read(0);
      // O convidado é sempre o jogador local do seu navegador: aceite também
      // setas para não depender do layout WASD do anfitrião.
      ['left', 'right', 'up', 'down'].forEach((k) => { local[k] = local[k] || Input.down(['Arrow' + k[0].toUpperCase() + k.slice(1)]); });
      const bits = this.encode(local);
      const edges = bits & ~0b1111;
      if (bits !== this.lastSent || edges || game.time % 10 === 0) {
        this.send('input', { i: bits, seq: ++this.inputSeq });
        this.lastSent = bits;
      }
    } else if (game.netRole === 'host' && game.time % 2 === 0) {
      this.send('snap', { s: game.snapshot() });
    }
  },
};
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
