/* ============================================================
   DS FIGHTERS — Servidor de salas online (Node.js + ws).
   Uso: npm install && npm start   (PORT=8787 por padrão)
   Responsabilidades:
   - protocolo versionado (hello v=1), validação de todas as mensagens
   - salas isoladas com código de convite de 6 caracteres
   - 2 jogadores por sala (1x1 ou 2x2 em duplas com troca)
   - escolhas validadas (lutadores, mascote, arena), confirmação "pronto"
   - retransmissão: entradas convidado→anfitrião, snapshots anfitrião→convidado
   - reconexão com token por 30 s; partida pausa enquanto alguém está fora
   - placar da sala aceito só do anfitrião, ao fim de cada partida
   - limites de taxa, tamanho de mensagem, número de salas e conexões
   Autoridade da luta: navegador do anfitrião (veja HOSPEDAGEM.md).
   ============================================================ */
'use strict';
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PROTOCOL = 1;
const PORT = parseInt(process.env.PORT || '8787', 10);
const MAX_ROOMS = parseInt(process.env.MAX_ROOMS || '500', 10);
const MAX_CONN = parseInt(process.env.MAX_CONN || '2000', 10);
const MAX_MSG = 96 * 1024;
const GRACE_MS = parseInt(process.env.GRACE_MS || '30000', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const FIGHTER_IDS = new Set(['du', 'iales', 'felipinho', 'stack', 'gitmaster', 'bughunter', 'frontend', 'backend', 'devops', 'qa', 'scrum', 'fullstack']);
const PET_IDS = new Set(['none', 'tux', 'whale', 'crab', 'snake', 'elephant', 'gopher', 'leaf', 'octo']);
const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RATE = { input: 140, snap: 80, default: 25 }; // mensagens por segundo

const rooms = new Map();
let connCount = 0;
let seq = 0;

function newCode() {
  for (let k = 0; k < 50; k++) {
    let c = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) c += CODE_ALPHA[bytes[i] % CODE_ALPHA.length];
    if (!rooms.has(c)) return c;
  }
  return null;
}
const cleanName = (s) => String(s || 'Jogador').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 16) || 'Jogador';
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

function publicRoom(r) {
  return {
    code: r.code, mode: r.mode, hostId: r.hostId, stage: r.stage, state: r.state, score: r.score,
    players: r.players.map((p) => ({ id: p.id, name: p.name, team: p.team, ready: p.ready, picks: p.picks, pet: p.pet, connected: !!p.ws })),
  };
}
function broadcast(r, msg, exceptId) { for (const p of r.players) if (p.id !== exceptId) send(p.ws, msg); }
function pushRoom(r) { broadcast(r, { t: 'room', room: publicRoom(r) }); }

function closeRoom(r, msg) {
  broadcast(r, { t: 'closed', msg });
  for (const p of r.players) { if (p.timer) clearTimeout(p.timer); if (p.ws) p.ws.room = null; }
  rooms.delete(r.code);
}
function removePlayer(r, p, reason) {
  r.players = r.players.filter((x) => x !== p);
  if (p.timer) clearTimeout(p.timer);
  if (p.id === r.hostId) { closeRoom(r, reason || 'O anfitrião saiu. A sala foi encerrada.'); return; }
  if (r.state === 'match') { r.state = 'lobby'; broadcast(r, { t: 'abort', msg: 'O adversário saiu. Partida cancelada.' }); }
  r.players.forEach((x) => { x.ready = false; });
  if (!r.players.length) rooms.delete(r.code); else pushRoom(r);
}
function tryStart(r) {
  if (r.state !== 'lobby' || r.players.length !== 2) return;
  const need = r.mode === '2x2' ? 2 : 1;
  if (!r.players.every((p) => p.ready && p.ws && Array.isArray(p.picks) && p.picks.length === need)) return;
  let stage = r.stage;
  if (stage === 'random' || !r.stagePool.includes(stage)) stage = r.stagePool[crypto.randomInt(r.stagePool.length)];
  r.state = 'match';
  r.lastStage = stage;
  r.matchId = ++seq;
  r.players.forEach((p) => { p.ready = false; p.rematch = false; });
  broadcast(r, { t: 'start', stage, matchId: r.matchId, room: publicRoom(r) });
  pushRoom(r);
}

function validPicks(r, arr) {
  const need = r.mode === '2x2' ? 2 : 1;
  if (!Array.isArray(arr) || arr.length !== need) return null;
  const out = arr.map(String);
  if (!out.every((id) => FIGHTER_IDS.has(id))) return null;
  if (new Set(out).size !== out.length) return null;
  return out;
}

function rateOk(ws, t) {
  const now = Date.now();
  const key = RATE[t] ? t : 'default';
  const b = ws.buckets[key] || (ws.buckets[key] = { n: 0, at: now });
  if (now - b.at >= 1000) { b.n = 0; b.at = now; }
  b.n++;
  return b.n <= RATE[key];
}

function onMessage(ws, raw) {
  if (raw.length > MAX_MSG) { send(ws, { t: 'error', msg: 'Mensagem grande demais.' }); return; }
  let m;
  try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m.t !== 'string') return;
  if (!rateOk(ws, m.t)) { ws.strikes = (ws.strikes || 0) + 1; if (ws.strikes > 200) ws.terminate(); return; }

  if (m.t === 'hello') {
    if (m.v !== PROTOCOL) { send(ws, { t: 'error', code: 'protocol', msg: `Versão do jogo incompatível (servidor v${PROTOCOL}). Atualize a página.` }); ws.close(); return; }
    ws.hello = true;
    ws.name = cleanName(m.name);
    send(ws, { t: 'welcome', id: ws.id, v: PROTOCOL });
    if (m.resume && typeof m.resume.code === 'string' && typeof m.resume.token === 'string') {
      const r = rooms.get(m.resume.code.toUpperCase());
      const p = r && r.players.find((x) => x.token === m.resume.token);
      if (!p) { send(ws, { t: 'error', code: 'resume_failed', msg: 'Não foi possível voltar à sala (expirou).' }); return; }
      if (p.ws && p.ws !== ws) { p.ws.room = null; try { p.ws.close(); } catch (e) { /* */ } }
      if (p.timer) { clearTimeout(p.timer); p.timer = null; }
      p.ws = ws;
      ws.id = p.id;
      ws.room = r;
      send(ws, { t: 'joined', id: p.id, token: p.token, code: r.code });
      pushRoom(r);
      broadcast(r, { t: 'peer', ev: 'back', id: p.id }, p.id);
      if (r.state === 'match') send(ws, { t: 'start', stage: r.lastStage, matchId: r.matchId, room: publicRoom(r), resume: true });
    }
    return;
  }
  if (!ws.hello) { send(ws, { t: 'error', msg: 'Envie hello primeiro.' }); return; }
  const r = ws.room;
  const me = r ? r.players.find((p) => p.ws === ws) : null;

  switch (m.t) {
    case 'create': {
      if (r) { send(ws, { t: 'error', msg: 'Você já está numa sala.' }); return; }
      if (rooms.size >= MAX_ROOMS) { send(ws, { t: 'error', msg: 'Servidor lotado. Tente mais tarde.' }); return; }
      const mode = m.mode === '2x2' ? '2x2' : '1v1';
      const pool = Array.isArray(m.stagePool) ? m.stagePool.filter((s) => typeof s === 'string' && /^[a-z0-9\-]{1,40}$/.test(s)).slice(0, 64) : [];
      if (!pool.length) { send(ws, { t: 'error', msg: 'Lista de arenas inválida.' }); return; }
      const code = newCode();
      if (!code) { send(ws, { t: 'error', msg: 'Não foi possível gerar um código.' }); return; }
      const p = { id: ws.id, token: crypto.randomBytes(16).toString('hex'), name: ws.name, team: 0, ready: false, picks: [], pet: 'none', ws };
      const room = { code, mode, hostId: ws.id, stage: 'random', stagePool: pool, state: 'lobby', score: [0, 0], players: [p], created: Date.now(), matchId: 0 };
      rooms.set(code, room);
      ws.room = room;
      send(ws, { t: 'joined', id: p.id, token: p.token, code });
      pushRoom(room);
      return;
    }
    case 'join': {
      if (r) { send(ws, { t: 'error', msg: 'Você já está numa sala.' }); return; }
      const code = String(m.code || '').toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code)) { send(ws, { t: 'error', msg: 'Código inválido.' }); return; }
      const room = rooms.get(code);
      if (!room) { send(ws, { t: 'error', msg: 'Sala não encontrada.' }); return; }
      if (room.players.length >= 2) { send(ws, { t: 'error', msg: 'Sala cheia.' }); return; }
      if (room.state !== 'lobby') { send(ws, { t: 'error', msg: 'A partida já começou.' }); return; }
      const p = { id: ws.id, token: crypto.randomBytes(16).toString('hex'), name: ws.name, team: 1, ready: false, picks: [], pet: 'none', ws };
      room.players.push(p);
      ws.room = room;
      send(ws, { t: 'joined', id: p.id, token: p.token, code });
      pushRoom(room);
      return;
    }
    case 'leave': {
      if (r && me) { ws.room = null; removePlayer(r, me, 'O anfitrião saiu. A sala foi encerrada.'); }
      return;
    }
    case 'pick': {
      if (!r || !me || r.state !== 'lobby') return;
      const picks = validPicks(r, m.fighters);
      if (!picks) { send(ws, { t: 'error', msg: 'Escolha de lutador inválida.' }); return; }
      me.picks = picks;
      me.pet = PET_IDS.has(String(m.pet)) ? String(m.pet) : 'none';
      me.ready = false;
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
      if (!me.picks.length) { send(ws, { t: 'error', msg: 'Escolha um lutador antes.' }); return; }
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
    case 'input': {
      if (!r || !me || r.state !== 'match' || me.id === r.hostId) return;
      const i = m.i | 0;
      if (i < 0 || i > 0xfff) return;
      const host = r.players.find((p) => p.id === r.hostId);
      send(host && host.ws, { t: 'input', i });
      return;
    }
    case 'snap': {
      if (!r || !me || r.state !== 'match' || me.id !== r.hostId || typeof m.s !== 'object' || !m.s) return;
      if (m.s.teams && Array.isArray(m.s.teams) && m.s.teams.length !== 2) return;
      broadcast(r, { t: 'snap', s: m.s }, me.id);
      return;
    }
    case 'end': {
      if (!r || !me || r.state !== 'match' || me.id !== r.hostId) return;
      const res = m.result || {};
      const w = res.winner;
      if (![-1, 0, 1].includes(w)) return;
      if (w >= 0) r.score[w]++;
      r.state = 'lobby';
      const result = { winner: w, wins: Array.isArray(res.wins) ? res.wins.slice(0, 2).map((x) => x | 0) : [0, 0], teams: Array.isArray(res.teams) ? res.teams.slice(0, 2) : [[], []], mode: 'online' };
      broadcast(r, { t: 'end', result, score: r.score }, me.id);
      send(ws, { t: 'end', result, score: r.score, self: true });
      pushRoom(r);
      return;
    }
    case 'ping': send(ws, { t: 'pong', at: m.at }); return;
    default: send(ws, { t: 'error', msg: 'Mensagem desconhecida.' });
  }
}

function onClose(ws) {
  connCount--;
  const r = ws.room;
  if (!r) return;
  const p = r.players.find((x) => x.ws === ws);
  if (!p) return;
  p.ws = null;
  p.ready = false;
  broadcast(r, { t: 'peer', ev: 'left', id: p.id }, p.id);
  pushRoom(r);
  p.timer = setTimeout(() => { if (rooms.get(r.code) === r && !p.ws) removePlayer(r, p, 'O anfitrião não voltou. A sala foi encerrada.'); }, GRACE_MS);
}

function createServer(port = PORT) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ ok: true, game: 'ds-fighters', protocol: PROTOCOL, rooms: rooms.size, connections: connCount }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const wss = new WebSocketServer({ server, maxPayload: MAX_MSG });
  wss.on('connection', (ws, req) => {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) { ws.close(1008, 'origem não permitida'); return; }
    if (connCount >= MAX_CONN) { ws.close(1013, 'lotado'); return; }
    connCount++;
    ws.id = 'p' + (++seq) + crypto.randomBytes(3).toString('hex');
    ws.buckets = {};
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (data) => onMessage(ws, data.toString()));
    ws.on('close', () => onClose(ws));
    ws.on('error', () => {});
  });
  const hb = setInterval(() => {
    wss.clients.forEach((ws) => { if (!ws.alive) { ws.terminate(); return; } ws.alive = false; ws.ping(); });
  }, 15000);
  wss.on('close', () => clearInterval(hb));
  server.listen(port, () => console.log(`[ds-fighters] servidor de salas v${PROTOCOL} na porta ${port}`));
  return { server, wss, rooms };
}

if (require.main === module) createServer();
module.exports = { createServer, PROTOCOL };
