/* ============================================================
   DS FIGHTERS — Núcleo de salas (compartilhado).
   Usado por: online-server/server.js (Node + WebSocket) e pelo
   anfitrião P2P no navegador (js/net/p2p.js, WebRTC). Mesmo protocolo,
   mesmas validações, mesmos limites nos dois transportes.

   Modos de sala:
     '1v1'   2 jogadores, 1 lutador cada
     '2x2'   2 jogadores, cada um escolhe 2 lutadores (dupla com troca)
     '2x2-4' 4 jogadores em 2 equipes: cada um controla 1 lutador da dupla;
             quem está fora pode pedir TROCA ou chamar ASSIST.
   Slots de controle: slot = equipe * 2 + membro (0..3).

   Uma "conexão" (conn) é qualquer objeto { id, send(msg) } — o núcleo
   guarda nela: hello, name, room, buckets.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RoomCore = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const PROTOCOL = 2;
  const MAX_MSG = 96 * 1024;
  const FIGHTER_IDS = ['du', 'iales', 'felipinho', 'stack', 'gitmaster', 'bughunter', 'frontend', 'backend', 'devops', 'qa', 'scrum', 'fullstack', 'kotlin', 'hacker', 'java', 'merc', 'bhm', 'zoya', 'rin', 'noir', 'xeon', 'urbano', 'qwen', 'dolynho', 'thl', 'lobao'];
  const PET_IDS = ['none', 'tux', 'whale', 'crab', 'snake', 'elephant', 'gopher', 'leaf', 'octo'];
  const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const RATE = { input: 160, snap: 90, default: 30 };
  const DEFAULT_CONFIG = Object.freeze({ roundsToWin: 2, timer: 180, infiniteLife: false, infiniteMeter: false });

  function rand(n) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
    return Math.floor(Math.random() * n);
  }
  function token() { let s = ''; for (let i = 0; i < 32; i++) s += '0123456789abcdef'[rand(16)]; return s; }
  const cleanName = (s) => String(s || 'Jogador').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 16) || 'Jogador';
  const capacity = (mode) => (mode === '2x2-4' ? 4 : 2);
  const picksNeeded = (mode) => (mode === '2x2' ? 2 : 1);
  function normalizeConfig(raw = {}) {
    if (!raw || typeof raw !== 'object') raw = {};
    const rounds = Number(raw.roundsToWin);
    const timer = Number(raw.timer);
    return {
      roundsToWin: Number.isInteger(rounds) ? Math.max(1, Math.min(9, rounds)) : DEFAULT_CONFIG.roundsToWin,
      timer: Number.isInteger(timer) ? Math.max(30, Math.min(300, timer)) : DEFAULT_CONFIG.timer,
      infiniteLife: raw.infiniteLife === true,
      infiniteMeter: raw.infiniteMeter === true,
    };
  }
  function sameConfig(a, b) {
    return a && b && DEFAULT_CONFIG && Object.keys(DEFAULT_CONFIG).every((k) => a[k] === b[k]);
  }
  function validSnapshot(s) {
    return !!s && typeof s === 'object' && Number.isInteger(s.t) && s.t >= 0 && s.t <= 1000000000
      && Array.isArray(s.teams) && s.teams.length === 2
      && s.teams.every((t) => Array.isArray(t) ? t.length <= 4 : t && typeof t === 'object' && Array.isArray(t.m) && t.m.length <= 4);
  }
  function cleanResult(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    if (![-1, 0, 1].includes(r.winner)) return null;
    const wins = Array.isArray(r.wins) && r.wins.length === 2 && r.wins.every((n) => Number.isInteger(n) && n >= 0 && n <= 9)
      ? r.wins.slice() : [0, 0];
    const teams = Array.isArray(r.teams) ? r.teams.slice(0, 2).map((team) => Array.isArray(team) ? team.slice(0, 4).map((m) => ({
      id: FIGHTER_IDS.includes(String(m && m.id)) ? String(m.id) : 'stack',
      name: cleanName(m && m.name),
      dmg: Number.isFinite(Number(m && m.dmg)) ? Math.max(0, Math.min(999999, Math.round(Number(m.dmg)))) : 0,
      hits: Number.isFinite(Number(m && m.hits)) ? Math.max(0, Math.min(9999, Math.round(Number(m.hits)))) : 0,
      combo: Number.isFinite(Number(m && m.combo)) ? Math.max(0, Math.min(9999, Math.round(Number(m.combo)))) : 0,
    })) : []) : [[], []];
    while (teams.length < 2) teams.push([]);
    return { winner: r.winner, wins, teams, mode: 'online' };
  }

  /**
   * Cria um gerenciador de salas.
   * opts: { maxRooms, graceMs, single (true no P2P: só uma sala, código fixo), code, setTimeout, clearTimeout }
   */
  function createRooms(opts = {}) {
    const rooms = new Map();
    const connections = new Set();
    const maxRooms = opts.maxRooms || 500;
    const graceMs = opts.graceMs || 30000;
    const st = opts.setTimeout || setTimeout;
    const ct = opts.clearTimeout || clearTimeout;
    let seq = 0;

    const send = (c, msg) => { if (c) { try { c.send(msg); } catch (e) { /* conexão fechada */ } } };
    function newCode() {
      if (opts.single && opts.code) return rooms.has(opts.code) ? null : opts.code;
      for (let k = 0; k < 50; k++) {
        let c = '';
        for (let i = 0; i < 6; i++) c += CODE_ALPHA[rand(CODE_ALPHA.length)];
        if (!rooms.has(c)) return c;
      }
      return null;
    }
    function publicRoom(r) {
      return {
        code: r.code, mode: r.mode, hostId: r.hostId, stage: r.stage, state: r.state, score: r.score.slice(), config: Object.assign({}, r.config), cap: capacity(r.mode),
        players: r.players.map((p) => ({ id: p.id, name: p.name, team: p.team, slot: p.slot, ready: p.ready, picks: p.picks, pet: p.pet, connected: !!p.conn })),
      };
    }
    function directoryRoom(r) {
      return { code: r.code, mode: r.mode, stage: r.stage, state: r.state, players: r.players.length, cap: capacity(r.mode), open: r.state === 'lobby' && r.players.length < capacity(r.mode) };
    }
    function publicRooms() {
      return [...rooms.values()].filter((r) => r.state === 'lobby').map(directoryRoom);
    }
    function pushDirectory() {
      const list = publicRooms();
      for (const c of connections) if (c.hello) send(c, { t: 'rooms', rooms: list });
    }
    function broadcast(r, msg, exceptId) { for (const p of r.players) if (p.id !== exceptId) send(p.conn, msg); }
    function pushRoom(r) { broadcast(r, { t: 'room', room: publicRoom(r) }); pushDirectory(); }
    function closeRoom(r, msg) {
      broadcast(r, { t: 'closed', msg });
      for (const p of r.players) { if (p.timer) ct(p.timer); if (p.conn) p.conn.room = null; }
      rooms.delete(r.code);
      pushDirectory();
    }
    function freeSlot(r) {
      const used = new Set(r.players.map((p) => p.slot));
      const order = r.mode === '2x2-4' ? [0, 2, 1, 3] : [0, 2];
      return order.find((s) => !used.has(s));
    }
    function removePlayer(r, p, reason) {
      r.players = r.players.filter((x) => x !== p);
      if (p.timer) ct(p.timer);
      if (p.id === r.hostId) { closeRoom(r, reason || 'O anfitrião saiu. A sala foi encerrada.'); return; }
      if (r.state === 'match') { r.state = 'lobby'; broadcast(r, { t: 'abort', msg: p.name + ' saiu. Partida cancelada.' }); }
      r.players.forEach((x) => { x.ready = false; });
      if (!r.players.length) { rooms.delete(r.code); pushDirectory(); } else pushRoom(r);
    }
    function tryStart(r) {
      if (r.state !== 'lobby' || r.players.length !== capacity(r.mode)) return;
      const need = picksNeeded(r.mode);
      if (!r.players.every((p) => p.ready && p.conn && Array.isArray(p.picks) && p.picks.length === need)) return;
      let stage = r.stage;
      if (stage === 'random' || !r.stagePool.includes(stage)) stage = r.stagePool[rand(r.stagePool.length)];
      r.state = 'match';
      r.lastStage = stage;
      r.matchId = ++seq;
      r.players.forEach((p) => { p.ready = false; p.lastSnapshot = -1; p.inputSeq = -1; });
      broadcast(r, { t: 'start', stage, matchId: r.matchId, room: publicRoom(r) });
      pushRoom(r);
    }
    function validPicks(r, arr) {
      const need = picksNeeded(r.mode);
      if (!Array.isArray(arr) || arr.length !== need) return null;
      const out = arr.map(String);
      if (!out.every((id) => FIGHTER_IDS.includes(id))) return null;
      if (new Set(out).size !== out.length) return null;
      return out;
    }
    function rateOk(c, t) {
      const now = Date.now();
      const key = RATE[t] ? t : 'default';
      c.buckets = c.buckets || {};
      const b = c.buckets[key] || (c.buckets[key] = { n: 0, at: now });
      if (now - b.at >= 1000) { b.n = 0; b.at = now; }
      b.n++;
      return b.n <= RATE[key];
    }

    /** Mensagem recebida de uma conexão. `m` pode ser objeto ou texto JSON. */
    function onMessage(c, m) {
      if (typeof m === 'string') {
        if (m.length > MAX_MSG) { send(c, { t: 'error', msg: 'Mensagem grande demais.' }); return; }
        try { m = JSON.parse(m); } catch (e) { return; }
      }
      if (!m || typeof m.t !== 'string') return;
      let encoded;
      try { encoded = JSON.stringify(m); } catch (e) { return; }
      if (encoded.length > MAX_MSG) { send(c, { t: 'error', msg: 'Mensagem grande demais.' }); return; }
      if (!rateOk(c, m.t)) { c.strikes = (c.strikes || 0) + 1; if (c.strikes > 200 && c.kill) c.kill(); return; }
      if (m.t === 'hello') {
        if (m.v !== PROTOCOL) { send(c, { t: 'error', code: 'protocol', msg: `Versão do jogo incompatível (sala v${PROTOCOL}). Atualize a página (Ctrl+F5).` }); return; }
          c.hello = true;
          connections.add(c);
          c.name = cleanName(m.name);
          send(c, { t: 'welcome', id: c.id, v: PROTOCOL });
          send(c, { t: 'rooms', rooms: publicRooms() });
        if (m.resume && typeof m.resume.code === 'string' && typeof m.resume.token === 'string') {
          const r = rooms.get(m.resume.code.toUpperCase());
          const p = r && r.players.find((x) => x.token === m.resume.token);
          if (!p) { send(c, { t: 'error', code: 'resume_failed', msg: 'Não foi possível voltar à sala (expirou).' }); return; }
          if (p.conn && p.conn !== c) { p.conn.room = null; if (p.conn.kill) p.conn.kill(); }
          if (p.timer) { ct(p.timer); p.timer = null; }
          p.conn = c;
          p.lastSnapshot = -1;
          p.inputSeq = -1;
          c.id = p.id;
          c.room = r;
          send(c, { t: 'joined', id: p.id, token: p.token, code: r.code });
          pushRoom(r);
          broadcast(r, { t: 'peer', ev: 'back', id: p.id, name: p.name }, p.id);
          if (r.state === 'match') send(c, { t: 'start', stage: r.lastStage, matchId: r.matchId, room: publicRoom(r), resume: true });
        }
        return;
      }
      if (!c.hello) { send(c, { t: 'error', msg: 'Envie hello primeiro.' }); return; }
      const r = c.room;
      const me = r ? r.players.find((p) => p.conn === c) : null;
      switch (m.t) {
        case 'create': {
          if (r) { send(c, { t: 'error', msg: 'Você já está numa sala.' }); return; }
          if (rooms.size >= maxRooms) { send(c, { t: 'error', msg: 'Servidor lotado. Tente mais tarde.' }); return; }
          const mode = ['2x2', '2x2-4'].includes(m.mode) ? m.mode : '1v1';
          const pool = Array.isArray(m.stagePool) ? m.stagePool.filter((s) => typeof s === 'string' && /^[a-z0-9\-]{1,40}$/.test(s)).slice(0, 80) : [];
          if (!pool.length) { send(c, { t: 'error', msg: 'Lista de arenas inválida.' }); return; }
          const code = newCode();
          if (!code) { send(c, { t: 'error', msg: 'Não foi possível gerar um código.' }); return; }
          const p = { id: c.id, token: token(), name: c.name, team: 0, slot: 0, ready: false, picks: [], pet: 'none', conn: c };
          const room = { code, mode, hostId: c.id, stage: 'random', stagePool: pool, state: 'lobby', score: [0, 0], config: normalizeConfig(m.config), players: [p], created: Date.now(), matchId: 0 };
          rooms.set(code, room);
          c.room = room;
          send(c, { t: 'joined', id: p.id, token: p.token, code });
          pushRoom(room);
          return;
        }
        case 'join': {
          if (r) { send(c, { t: 'error', msg: 'Você já está numa sala.' }); return; }
          const code = String(m.code || '').toUpperCase();
          if (!/^[A-Z0-9]{6}$/.test(code)) { send(c, { t: 'error', msg: 'Código inválido.' }); return; }
          const room = rooms.get(code);
          if (!room) { send(c, { t: 'error', msg: 'Sala não encontrada.' }); return; }
          if (room.players.length >= capacity(room.mode)) { send(c, { t: 'error', msg: 'Sala cheia.' }); return; }
          if (room.state !== 'lobby') { send(c, { t: 'error', msg: 'A partida já começou.' }); return; }
          const slot = freeSlot(room);
          const p = { id: c.id, token: token(), name: c.name, team: slot >> 1, slot, ready: false, picks: [], pet: 'none', conn: c };
          room.players.push(p);
          c.room = room;
          send(c, { t: 'joined', id: p.id, token: p.token, code });
          pushRoom(room);
          return;
        }
        case 'leave': {
          if (r && me) { c.room = null; removePlayer(r, me, 'O anfitrião saiu. A sala foi encerrada.'); }
          return;
        }
        case 'pick': {
          if (!r || !me || r.state !== 'lobby') return;
          const picks = validPicks(r, m.fighters);
          if (!picks) { send(c, { t: 'error', msg: 'Escolha de lutador inválida.' }); return; }
          if (r.mode === '2x2-4') {
            const mate = r.players.find((p) => p !== me && p.team === me.team);
            if (mate && mate.picks && mate.picks[0] === picks[0]) { send(c, { t: 'error', msg: 'Seu parceiro já escolheu esse lutador.' }); return; }
          }
          me.picks = picks;
          me.pet = PET_IDS.includes(String(m.pet)) ? String(m.pet) : 'none';
          me.ready = false;
          pushRoom(r);
          return;
        }
        case 'team': {
          // 2x2-4: trocar de equipe se houver vaga
          if (!r || !me || r.state !== 'lobby' || r.mode !== '2x2-4') return;
          const want = m.team === 1 ? 1 : 0;
          if (want === me.team) return;
          const used = new Set(r.players.map((p) => p.slot));
          const slot = [want * 2, want * 2 + 1].find((s) => !used.has(s));
          if (slot === undefined) { send(c, { t: 'error', msg: 'Essa equipe está cheia.' }); return; }
          me.slot = slot;
          me.team = want;
          r.players.forEach((p) => { p.ready = false; });
          pushRoom(r);
          return;
        }
        case 'stage': {
          if (!r || !me || r.hostId !== me.id || r.state !== 'lobby') return;
          const id = String(m.id || '');
          if (id !== 'random' && !r.stagePool.includes(id)) return;
          r.stage = id;
          r.players.forEach((p) => { p.ready = false; });
          pushRoom(r);
          return;
        }
        case 'ready': {
          if (!r || !me || r.state !== 'lobby') return;
          if (!me.picks.length) { send(c, { t: 'error', msg: 'Escolha um lutador antes.' }); return; }
          me.ready = !!m.on;
          pushRoom(r);
          tryStart(r);
          return;
        }
        case 'rematch': {
          if (!r || !me || r.state !== 'lobby') return;
          me.ready = true;
          pushRoom(r);
          tryStart(r);
          return;
        }
        case 'chat': {
          if (!r || !me) return;
          const text = String(m.text || '').replace(/[<>]/g, '').trim().slice(0, 80);
          if (text) broadcast(r, { t: 'chat', from: me.name, text });
          return;
        }
        case 'input': {
          if (!r || !me || r.state !== 'match' || me.id === r.hostId) return;
          if (!Number.isInteger(m.i) || m.i < 0 || m.i > 0x1ffff) return;
          if (m.seq != null && (!Number.isInteger(m.seq) || m.seq < 0 || m.seq > 0x7fffffff || m.seq <= (me.inputSeq == null ? -1 : me.inputSeq))) return;
          if (m.seq != null) me.inputSeq = m.seq;
          const host = r.players.find((p) => p.id === r.hostId);
          send(host && host.conn, { t: 'input', i: m.i, seq: m.seq == null ? null : m.seq, slot: me.slot });
          return;
        }
        case 'snap': {
          if (!r || !me || r.state !== 'match' || me.id !== r.hostId || !validSnapshot(m.s)) return;
          if (m.s.t <= (me.lastSnapshot == null ? -1 : me.lastSnapshot)) return;
          me.lastSnapshot = m.s.t;
          broadcast(r, { t: 'snap', s: m.s }, me.id);
          return;
        }
        case 'end': {
          if (!r || !me || r.state !== 'match' || me.id !== r.hostId) return;
          const res = cleanResult(m.result);
          if (!res) return;
          const w = res.winner;
          if (w >= 0) r.score[w]++;
          r.state = 'lobby';
          const result = Object.assign({}, res);
          broadcast(r, { t: 'end', result, score: r.score.slice() }, me.id);
          send(c, { t: 'end', result, score: r.score.slice(), self: true });
          pushRoom(r);
          return;
        }
        case 'config': {
          if (!r || !me || r.state !== 'lobby' || me.id !== r.hostId || !m.config || typeof m.config !== 'object') return;
          const config = normalizeConfig(m.config);
          if (sameConfig(config, r.config)) return;
          r.config = config;
          r.players.forEach((p) => { p.ready = false; });
          pushRoom(r);
          return;
        }
        case 'ping': send(c, { t: 'pong', at: Number.isFinite(Number(m.at)) ? Number(m.at) : 0 }); return;
        default: send(c, { t: 'error', msg: 'Mensagem desconhecida.' });
      }
    }
    /** A conexão caiu: guarda a vaga por graceMs para reconexão. */
    function onClose(c) {
      connections.delete(c);
      const r = c.room;
      if (!r) { pushDirectory(); return; }
      const p = r.players.find((x) => x.conn === c);
      if (!p) return;
      p.conn = null;
      p.inputSeq = -1;
      p.ready = false;
      broadcast(r, { t: 'peer', ev: 'left', id: p.id, name: p.name }, p.id);
      pushRoom(r);
      p.timer = st(() => { if (rooms.get(r.code) === r && !p.conn) removePlayer(r, p, 'O anfitrião não voltou. A sala foi encerrada.'); }, graceMs);
    }
    return { rooms, onMessage, onClose, publicRoom, publicRooms };
  }

  return { PROTOCOL, MAX_MSG, FIGHTER_IDS, PET_IDS, DEFAULT_CONFIG, normalizeConfig, createRooms, capacity, picksNeeded };
}));
