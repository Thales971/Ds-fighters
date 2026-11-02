'use strict';

const crypto = require('crypto');

const PREFIX = 'dsfighters:tournament:';
const RATE_PREFIX = 'dsfighters:tournament:rate:';
const TTL_SECONDS = 7 * 24 * 60 * 60;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_CAS_RETRIES = 5;
const MAX_OPERATION_RECEIPTS = 1024;
const TERMINAL = new Set(['complete', 'bye', 'void']);

const CAS_SCRIPT = `-- dsf-cas-v1
local raw = redis.call('GET', KEYS[1])
if not raw then return -1 end
local ok, data = pcall(cjson.decode, raw)
if not ok then return -2 end
local version = tonumber(data.version or 0)
if version ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return 1`;

const CREATE_SCRIPT = `-- dsf-create-v1
local previous = redis.call('GET', KEYS[1])
if previous then return {'DUPLICATE', previous} end
if redis.call('EXISTS', KEYS[2]) == 1 then return {'COLLISION'} end
local stored = redis.call('SET', KEYS[2], ARGV[1], 'EX', tonumber(ARGV[3]), 'NX')
if not stored then return {'COLLISION'} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return {'CREATED', ARGV[2]}`;

const RATE_SCRIPT = `-- dsf-rate-v1
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return n`;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

async function redisCommand(command) {
  const config = redisConfig();
  if (!config) throw new HttpError(503, 'storage_not_configured', 'Torneios indisponíveis: conecte Upstash Redis pela Vercel Marketplace e faça redeploy.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  let payload;
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    if (!response.ok) throw new HttpError(503, 'storage_unavailable', 'Armazenamento do torneio temporariamente indisponível.');
    payload = await response.json();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, error && error.name === 'AbortError' ? 'storage_timeout' : 'storage_unreachable', 'Armazenamento do torneio temporariamente indisponível.');
  } finally { clearTimeout(timeout); }
  if (!payload || typeof payload !== 'object') throw new HttpError(503, 'storage_bad_response', 'Resposta inválida do armazenamento do torneio.');
  if (payload && payload.error) throw new HttpError(503, 'storage_command_failed', 'O armazenamento do torneio recusou a operação.');
  return payload && payload.result;
}

function randomCode(length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return out;
}

function newToken() { return crypto.randomBytes(32).toString('base64url'); }
function newPlayerId() { return crypto.randomBytes(12).toString('hex'); }
function tokenHash(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }
function requestIdentity(action, requestId, code = '') {
  const config = redisConfig();
  if (!config) fail(503, 'storage_not_configured', 'Torneios indisponíveis: conecte Upstash Redis pela Vercel Marketplace e faça redeploy.');
  const id = String(requestId || '');
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(id)) fail(400, 'invalid_request_id', 'Tente novamente com um identificador de operação válido.');
  const scope = `${action}:${code}:${id}`;
  const derive = (purpose) => crypto.createHmac('sha256', config.token).update(`${purpose}:${scope}`).digest();
  const requestKey = crypto.createHmac('sha256', config.token).update(`request:${scope}`).digest('hex');
  return { playerId: derive('player').subarray(0, 12).toString('hex'), token: derive('token').toString('base64url'), requestKey };
}
function operationFingerprint(body) {
  const canonical = {};
  Object.keys(body || {}).filter((key) => key !== 'token' && key !== 'requestId').sort().forEach((key) => { canonical[key] = body[key]; });
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || !/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function cleanName(value) {
  const name = String(value || 'Jogador').normalize('NFKC').replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 20);
  return name || 'Jogador';
}

function validCode(value) { return /^[A-Z0-9]{6}$/.test(String(value || '').toUpperCase()); }
function makeKey(code) { return PREFIX + code; }
function fail(status, code, message) { throw new HttpError(status, code, message); }

function clientIp(req) {
  const forwarded = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
  const raw = forwarded || String((req.headers && (req.headers['x-real-ip'] || req.headers['x-vercel-forwarded-for'])) || 'unknown');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 20);
}

async function enforceRate(req, group) {
  const policy = group === 'health' ? { limit: 300, window: 60 } : group === 'read' ? { limit: 900, window: 60 } : group === 'create' ? { limit: 4, window: 300 } : group === 'join' ? { limit: 64, window: 60 } : { limit: 120, window: 60 };
  const key = `${RATE_PREFIX}${group}:${clientIp(req)}`;
  const count = Number(await redisCommand(['EVAL', RATE_SCRIPT, '1', key, String(policy.window)]));
  if (count > policy.limit) fail(429, 'rate_limited', 'Muitas ações em pouco tempo; aguarde um minuto e tente de novo.');
}

function validStoredState(state, code) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || state.schema !== 1 || state.code !== code) return false;
  if (!Number.isInteger(state.version) || state.version < 0 || !Number.isInteger(state.capacity) || state.capacity < 2 || state.capacity > 32) return false;
  if (!['open', 'active', 'complete'].includes(state.status) || !Array.isArray(state.players) || state.players.length < 1 || state.players.length > state.capacity) return false;
  if (!Number.isFinite(state.createdAt) || !Number.isFinite(state.updatedAt) || !Array.isArray(state.rounds) || state.rounds.length > 5) return false;
  const ids = new Set();
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (!player || typeof player.id !== 'string' || !/^[a-f0-9]{24}$/i.test(player.id) || ids.has(player.id)) return false;
    if (typeof player.name !== 'string' || player.name.length < 1 || player.name.length > 20 || !Number.isInteger(player.seed) || player.seed < 1) return false;
    if (!/^[a-f0-9]{64}$/i.test(String(player.tokenHash || '')) || !Number.isFinite(player.joinedAt)) return false;
    ids.add(player.id);
  }
  if (state.operationReceipts !== undefined) {
    if (!Array.isArray(state.operationReceipts) || state.operationReceipts.length > MAX_OPERATION_RECEIPTS) return false;
    const receiptKeys = new Set();
    for (const receipt of state.operationReceipts) {
      if (!receipt || !ids.has(receipt.playerId) || !/^[A-Za-z0-9_-]{22,64}$/.test(String(receipt.requestId || '')) || !/^[a-f0-9]{64}$/i.test(String(receipt.fingerprint || '')) || !Number.isFinite(receipt.at)) return false;
      const receiptKey = `${receipt.playerId}:${receipt.requestId}`;
      if (receiptKeys.has(receiptKey)) return false;
      receiptKeys.add(receiptKey);
    }
  }
  if (!ids.has(state.ownerId) || state.players.some((player) => player.seed > state.capacity)) return false;
  if (state.winnerId != null && !ids.has(state.winnerId)) return false;
  const matchStatuses = new Set(['ready', 'joining', 'connected', 'playing', 'reported', 'disputed', 'complete', 'bye', 'void', 'waiting']);
  for (let r = 0; r < state.rounds.length; r++) {
    const round = state.rounds[r];
    if (!Array.isArray(round) || round.length < 1 || round.length > 16) return false;
    for (const match of round) {
      if (!match || typeof match.id !== 'string' || !Number.isInteger(match.round) || !Number.isInteger(match.index) || !matchStatuses.has(match.status)) return false;
      if (!Array.isArray(match.playerIds) || match.playerIds.length !== 2 || match.playerIds.some((id) => id != null && !ids.has(id))) return false;
      if (match.playerIds[0] && match.playerIds[0] === match.playerIds[1]) return false;
      if (match.winnerId != null && !match.playerIds.includes(match.winnerId)) return false;
      if (match.hostPlayerId != null && !match.playerIds.includes(match.hostPlayerId)) return false;
      if (match.roomCode != null && !validCode(match.roomCode)) return false;
      if (!Array.isArray(match.startedBy) || match.startedBy.some((id) => !match.playerIds.includes(id))) return false;
      if (new Set(match.startedBy).size !== match.startedBy.length) return false;
      if (match.connectedPlayerId != null && !match.playerIds.includes(match.connectedPlayerId)) return false;
      if (['joining', 'connected', 'playing', 'reported', 'disputed'].includes(match.status) && !match.roomCode) return false;
      if (['connected', 'playing', 'reported', 'disputed'].includes(match.status) && !match.connectedPlayerId) return false;
      if (['playing', 'reported', 'disputed'].includes(match.status) && !match.playerIds.filter(Boolean).every((id) => match.startedBy.includes(id))) return false;
      if (match.status === 'reported' && (!match.claim || !match.playerIds.includes(match.claim.winnerId) || !match.playerIds.includes(match.claim.byPlayerId))) return false;
      if (match.status === 'disputed' && (!match.dispute || !match.playerIds.includes(match.dispute.firstWinnerId) || !match.playerIds.includes(match.dispute.secondWinnerId))) return false;
      if (match.sourceMatchIds != null && (!Array.isArray(match.sourceMatchIds) || match.sourceMatchIds.length !== 2 || match.sourceMatchIds.some((id) => typeof id !== 'string'))) return false;
    }
  }
  if (state.status === 'open' && (state.rounds.length !== 0 || state.winnerId != null)) return false;
  if (state.status === 'active' && (state.rounds.length === 0 || state.winnerId != null)) return false;
  if (state.status === 'complete') {
    const final = state.rounds.length && state.rounds[state.rounds.length - 1][0];
    if (!final || !TERMINAL.has(final.status) || !state.winnerId || final.winnerId !== state.winnerId) return false;
  }
  return true;
}

function parseStoredState(raw, code) {
  let state;
  try { state = JSON.parse(raw); } catch (_) { fail(503, 'tournament_corrupt', 'O estado deste torneio não pôde ser lido.'); }
  if (!validStoredState(state, code)) fail(503, 'tournament_corrupt', 'O estado deste torneio tem formato inválido.');
  if (Date.now() >= state.createdAt + TTL_SECONDS * 1000) fail(410, 'tournament_expired', 'O prazo de sete dias deste torneio terminou.');
  return state;
}

async function getState(code) {
  const raw = await redisCommand(['GET', makeKey(code)]);
  if (!raw) fail(404, 'tournament_not_found', 'Torneio não encontrado ou expirado.');
  return parseStoredState(raw, code);
}

async function mutateState(code, mutate, operation = null) {
  const key = makeKey(code);
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const raw = await redisCommand(['GET', key]);
    if (!raw) fail(404, 'tournament_not_found', 'Torneio não encontrado ou expirado.');
    const state = parseStoredState(raw, code);
    const expectedVersion = state.version;
    const remainingTtl = Math.ceil((state.createdAt + TTL_SECONDS * 1000 - Date.now()) / 1000);
    if (remainingTtl <= 0) fail(410, 'tournament_expired', 'O prazo de sete dias deste torneio terminou.');
    const draft = JSON.parse(JSON.stringify(state));
    if (!Array.isArray(draft.operationReceipts)) draft.operationReceipts = [];
    if (operation) {
      const actor = requireActor(draft, operation.body);
      const previous = draft.operationReceipts.find((receipt) => receipt.playerId === actor.id && receipt.requestId === operation.requestId);
      if (previous) {
        if (previous.fingerprint !== operation.fingerprint) fail(409, 'idempotency_conflict', 'Este identificador já foi usado com outra ação ou conteúdo.');
        return { state, result: null, replay: true };
      }
    }
    const result = mutate(draft);
    if (operation) {
      if (draft.operationReceipts.length >= MAX_OPERATION_RECEIPTS) fail(409, 'operation_receipts_full', 'Este torneio atingiu o limite seguro de operações. Crie uma nova chave para continuar.');
      const actor = requireActor(draft, operation.body);
      draft.operationReceipts.push({ playerId: actor.id, requestId: operation.requestId, fingerprint: operation.fingerprint, at: Date.now() });
    }
    draft.version = expectedVersion + 1;
    draft.updatedAt = Date.now();
    const saved = Number(await redisCommand(['EVAL', CAS_SCRIPT, '1', key, String(expectedVersion), JSON.stringify(draft), String(remainingTtl)]));
    if (saved === 1) return { state: draft, result };
    if (saved < 0) fail(503, 'tournament_corrupt', 'O estado deste torneio não pôde ser atualizado.');
  }
  fail(409, 'concurrent_update', 'O torneio recebeu alterações simultâneas. Atualize e tente novamente.');
}

function requireActor(state, body) {
  const actor = state.players.find((player) => player.id === String(body.playerId || ''));
  if (!actor || !safeEqualHex(actor.tokenHash, tokenHash(body.token || ''))) fail(401, 'invalid_player_token', 'Token de participante inválido. Entre no torneio novamente neste navegador.');
  return actor;
}

function requireOwner(state, actor) {
  if (!actor || actor.id !== state.ownerId) fail(403, 'organizer_only', 'Somente o organizador pode realizar esta ação.');
}

function nextPowerOfTwo(value) {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

function matchRecord(roundIndex, matchIndex, playerIds, status, winnerId, sourceMatchIds) {
  return {
    id: `r${roundIndex + 1}m${matchIndex + 1}`,
    round: roundIndex + 1,
    index: matchIndex + 1,
    playerIds,
    sourceMatchIds: sourceMatchIds || null,
    status,
    winnerId: winnerId || null,
      hostPlayerId: playerIds.find(Boolean) || null,
      roomCode: null,
      connectedPlayerId: null,
      startedBy: [],
    claim: null,
    dispute: null,
    updatedAt: Date.now(),
  };
}

function buildBracket(players) {
  const size = nextPowerOfTwo(players.length);
  const slots = players.map((p) => p.id);
  while (slots.length < size) slots.push(null);
  const rounds = [];
  const first = [];
  for (let i = 0; i < size / 2; i++) {
    const playerIds = [slots[i * 2] || null, slots[i * 2 + 1] || null];
    if (playerIds[0] && playerIds[1]) first.push(matchRecord(0, i, playerIds, 'ready'));
    else if (playerIds[0] || playerIds[1]) first.push(matchRecord(0, i, playerIds, 'bye', playerIds[0] || playerIds[1]));
    else first.push(matchRecord(0, i, playerIds, 'void'));
  }
  rounds.push(first);
  let previousCount = first.length;
  for (let roundIndex = 1; previousCount > 1; roundIndex++) {
    const count = previousCount / 2;
    const round = [];
    for (let i = 0; i < count; i++) {
      const sourceMatchIds = [rounds[roundIndex - 1][i * 2].id, rounds[roundIndex - 1][i * 2 + 1].id];
      round.push(matchRecord(roundIndex, i, [null, null], 'waiting', null, sourceMatchIds));
    }
    rounds.push(round);
    previousCount = count;
  }
  return rounds;
}

function advanceBracket(state) {
  for (let roundIndex = 1; roundIndex < state.rounds.length; roundIndex++) {
    for (const match of state.rounds[roundIndex]) {
      if (match.status !== 'waiting') continue;
      const sources = match.sourceMatchIds.map((id) => state.rounds.flat().find((entry) => entry.id === id));
      if (!sources.every((entry) => entry && TERMINAL.has(entry.status))) continue;
      match.playerIds = sources.map((entry) => entry.winnerId || null);
      if (match.playerIds[0] && match.playerIds[1]) {
        match.status = 'ready';
        match.hostPlayerId = match.playerIds[0];
      } else if (match.playerIds[0] || match.playerIds[1]) {
        match.status = 'bye';
        match.winnerId = match.playerIds[0] || match.playerIds[1];
      } else {
        match.status = 'void';
      }
      match.updatedAt = Date.now();
    }
  }
  const finalRound = state.rounds[state.rounds.length - 1] || [];
  const final = finalRound[0];
  if (final && TERMINAL.has(final.status)) {
    state.status = 'complete';
    state.winnerId = final.winnerId || null;
  } else {
    state.status = 'active';
    state.winnerId = null;
  }
}

function findMatch(state, matchId) {
  const match = state.rounds.flat().find((entry) => entry.id === String(matchId || ''));
  if (!match) fail(404, 'match_not_found', 'Confronto não encontrado.');
  return match;
}

function matchPlayer(match, playerId) { return match.playerIds.includes(playerId); }
function validWinner(match, playerId) { return match.playerIds.includes(playerId) && !!playerId; }

function publicMatch(match, playersById) {
  return {
    id: match.id,
    round: match.round,
    index: match.index,
    playerIds: match.playerIds.slice(),
    players: match.playerIds.map((id) => id ? (playersById.get(id) || {}).name || 'Jogador' : null),
    status: match.status,
    winnerId: match.winnerId,
    winnerName: match.winnerId ? (playersById.get(match.winnerId) || {}).name || 'Jogador' : null,
    hostPlayerId: match.hostPlayerId,
    roomCode: match.roomCode,
    sourceMatchIds: match.sourceMatchIds,
    claim: match.claim ? { winnerId: match.claim.winnerId, winnerName: (playersById.get(match.claim.winnerId) || {}).name || 'Jogador', byPlayerId: match.claim.byPlayerId, byName: (playersById.get(match.claim.byPlayerId) || {}).name || 'Jogador' } : null,
    dispute: match.dispute ? { firstWinnerId: match.dispute.firstWinnerId, secondWinnerId: match.dispute.secondWinnerId, firstName: (playersById.get(match.dispute.firstWinnerId) || {}).name || 'Jogador', secondName: (playersById.get(match.dispute.secondWinnerId) || {}).name || 'Jogador' } : null,
  };
}

function publicState(state) {
  const players = state.players.map(({ id, name, seed, joinedAt }) => ({ id, name, seed, joinedAt }));
  const playersById = new Map(players.map((player) => [player.id, player]));
  return {
    code: state.code,
    name: state.name,
    status: state.status,
    capacity: state.capacity,
    ownerId: state.ownerId,
    players,
    rounds: state.rounds.map((round) => round.map((match) => publicMatch(match, playersById))),
    winnerId: state.winnerId || null,
    winnerName: state.winnerId ? (playersById.get(state.winnerId) || {}).name || 'Jogador' : null,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    expiresAt: state.createdAt + TTL_SECONDS * 1000,
  };
}

async function createTournament(body) {
  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 32) fail(400, 'invalid_capacity', 'O torneio deve aceitar entre 2 e 32 participantes.');
  const name = cleanName(body.name || 'Torneio DS Fighters');
  const playerName = cleanName(body.playerName || 'Organizador');
  const identity = requestIdentity('create', body.requestId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const now = Date.now();
    const state = {
      schema: 1,
      version: 0,
      code,
      name,
      status: 'open',
      capacity,
      ownerId: identity.playerId,
      players: [{ id: identity.playerId, name: playerName, seed: 1, joinedAt: now, tokenHash: tokenHash(identity.token) }],
      rounds: [],
      operationReceipts: [],
      winnerId: null,
      createdAt: now,
      updatedAt: now,
    };
    const recordText = JSON.stringify({ code, playerId: identity.playerId });
    const result = await redisCommand(['EVAL', CREATE_SCRIPT, '2', `${PREFIX}request:create:${identity.requestKey}`, makeKey(code), JSON.stringify(state), recordText, String(TTL_SECONDS)]);
    if (!Array.isArray(result) || !result.length) fail(503, 'storage_bad_response', 'Resposta inválida ao criar o torneio.');
    if (result[0] === 'COLLISION') continue;
    if (result[0] === 'DUPLICATE') {
      let prior;
      try { prior = JSON.parse(result[1]); } catch (_) { fail(503, 'tournament_corrupt', 'O pedido anterior de torneio não pôde ser recuperado.'); }
      if (!prior || !validCode(prior.code) || prior.playerId !== identity.playerId) fail(503, 'tournament_corrupt', 'O pedido anterior de torneio não pôde ser recuperado.');
      const saved = await getState(prior.code);
      const owner = saved.players.find((player) => player.id === identity.playerId);
      if (!owner || saved.ownerId !== identity.playerId || !safeEqualHex(owner.tokenHash, tokenHash(identity.token))) fail(409, 'idempotency_conflict', 'Este pedido já pertence a outra identidade.');
      return { code: prior.code, playerId: identity.playerId, token: identity.token, tournament: publicState(saved) };
    }
    if (result[0] === 'CREATED') return { code, playerId: identity.playerId, token: identity.token, tournament: publicState(state) };
    fail(503, 'storage_bad_response', 'O armazenamento não confirmou a criação do torneio.');
  }
  fail(503, 'code_generation_failed', 'Não foi possível gerar um código. Tente novamente.');
}

async function joinTournament(body) {
  const code = String(body.code || '').toUpperCase();
  if (!validCode(code)) fail(400, 'invalid_code', 'O código deve ter seis letras/números.');
  const identity = requestIdentity('join', body.requestId, code);
  const { state } = await mutateState(code, (draft) => {
    const existing = draft.players.find((player) => player.id === identity.playerId);
    if (existing) {
      if (!safeEqualHex(existing.tokenHash, tokenHash(identity.token))) fail(409, 'idempotency_conflict', 'Este pedido de inscrição já está associado a outra identidade.');
      return;
    }
    if (draft.status !== 'open') fail(409, 'tournament_started', 'As inscrições já foram encerradas.');
    if (draft.players.length >= draft.capacity) fail(409, 'tournament_full', 'Torneio cheio.');
    draft.players.push({ id: identity.playerId, name: cleanName(body.playerName || body.name || 'Jogador'), seed: draft.players.length + 1, joinedAt: Date.now(), tokenHash: tokenHash(identity.token) });
  });
  return { code, playerId: identity.playerId, token: identity.token, tournament: publicState(state) };
}

function authenticateAndLookup(state, body) {
  const actor = requireActor(state, body);
  return actor;
}

async function updateTournament(body) {
  const code = String(body.code || '').toUpperCase();
  if (!validCode(code)) fail(400, 'invalid_code', 'O código deve ter seis letras/números.');
  const action = String(body.action || '');
  const requestId = String(body.requestId || '');
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(requestId)) fail(400, 'invalid_request_id', 'Tente novamente com um identificador de operação válido.');
  const fingerprint = operationFingerprint(body);
  const { state, result } = await mutateState(code, (draft) => {
    const actor = authenticateAndLookup(draft, body);
    if (action === 'start') {
      requireOwner(draft, actor);
      if (draft.status !== 'open') fail(409, 'cannot_start', 'O torneio já começou ou foi encerrado.');
      if (draft.players.length < 2) fail(409, 'not_enough_players', 'São necessários pelo menos dois participantes.');
      draft.rounds = buildBracket(draft.players);
      draft.status = 'active';
      advanceBracket(draft);
      return;
    }

    if (action === 'room') {
    if (draft.status !== 'active') fail(409, 'tournament_not_active', 'O torneio ainda não está em andamento.');
    const match = findMatch(draft, body.matchId);
    const roomCode = String(body.roomCode || '').toUpperCase();
    if (match.status !== 'ready' && !(match.status === 'joining' && match.roomCode === roomCode)) fail(409, 'match_not_ready', 'Este confronto não está pronto para criar uma sala.');
    if (actor.id !== match.hostPlayerId) fail(403, 'match_host_only', 'Somente o anfitrião designado pode abrir a sala do confronto.');
    if (!validCode(roomCode)) fail(400, 'invalid_room_code', 'O código da sala online precisa ter seis letras/números.');
    match.roomCode = roomCode;
    match.connectedPlayerId = null;
    match.startedBy = [];
    match.status = 'joining';
    match.updatedAt = Date.now();
    return;
  }

  if (action === 'connected') {
    const match = findMatch(draft, body.matchId);
    if (!matchPlayer(match, actor.id)) fail(403, 'not_match_player', 'Você não participa deste confronto.');
    if (actor.id === match.hostPlayerId) fail(403, 'opponent_confirmation_only', 'A conexão precisa ser confirmada pelo adversário que entrou na sala.');
    const roomCode = String(body.roomCode || '').toUpperCase();
    if (match.status === 'complete' && match.startedBy.includes(actor.id)) return;
    if (match.connectedPlayerId === actor.id && match.roomCode === roomCode && ['connected', 'playing', 'reported', 'disputed'].includes(match.status)) return;
    if (!['joining', 'connected', 'playing'].includes(match.status) || !match.roomCode || roomCode !== match.roomCode) fail(409, 'room_not_joined', 'O código informado não corresponde à sala publicada pelo anfitrião.');
    if (match.connectedPlayerId && match.connectedPlayerId !== actor.id) fail(409, 'room_already_joined', 'Outro participante já confirmou esta sala.');
    match.status = 'connected';
    match.connectedPlayerId = actor.id;
    if (match.playerIds.filter(Boolean).every((id) => match.startedBy.includes(id))) match.status = 'playing';
    match.updatedAt = Date.now();
    return;
  }

  if (action === 'started') {
    const match = findMatch(draft, body.matchId);
    if (!matchPlayer(match, actor.id)) fail(403, 'not_match_player', 'Você não participa deste confronto.');
    const roomCode = String(body.roomCode || '').toUpperCase();
    if (['playing', 'reported', 'disputed'].includes(match.status) && roomCode === match.roomCode && match.startedBy.includes(actor.id)) return;
    if (!['joining', 'connected', 'playing'].includes(match.status) || !match.roomCode || roomCode !== match.roomCode) fail(409, 'match_not_started', 'A sala P2P ainda não corresponde a este confronto.');
    if (!match.startedBy.includes(actor.id)) match.startedBy.push(actor.id);
    if (actor.id !== match.hostPlayerId) match.connectedPlayerId = actor.id;
    if (match.startedBy.length === 2) {
      match.status = 'playing';
      match.startedAt = Date.now();
    } else if (match.connectedPlayerId) {
      match.status = 'connected';
    } else {
      match.status = 'joining';
    }
    match.updatedAt = Date.now();
    return;
  }

  if (action === 'rehost') {
      requireOwner(draft, actor);
      const match = findMatch(draft, body.matchId);
    if (!['ready', 'joining', 'connected', 'playing'].includes(match.status)) fail(409, 'cannot_rehost', 'Só é possível recuperar uma partida pronta ou em andamento sem resultado registrado.');
      const candidates = match.playerIds.filter(Boolean);
      if (candidates.length !== 2) fail(409, 'invalid_match', 'Este confronto não tem dois participantes.');
      const nextHost = String(body.hostPlayerId || '');
      if (!candidates.includes(nextHost)) fail(400, 'invalid_match_host', 'O anfitrião precisa participar deste confronto.');
    match.hostPlayerId = nextHost;
    match.status = 'ready';
    match.roomCode = null;
    match.connectedPlayerId = null;
    match.startedBy = [];
      match.claim = null;
      match.dispute = null;
      match.updatedAt = Date.now();
      return;
    }

    if (action === 'claim') {
      const match = findMatch(draft, body.matchId);
      if (!matchPlayer(match, actor.id)) fail(403, 'not_match_player', 'Você não participa deste confronto.');
      if (match.status !== 'playing' || !match.roomCode) fail(409, 'match_not_played', 'Abra e conclua a sala online antes de informar o resultado.');
      const winnerId = String(body.winnerId || '');
      if (!validWinner(match, winnerId)) fail(400, 'invalid_winner', 'O vencedor precisa ser um dos participantes do confronto.');
      if (match.claim) fail(409, 'result_already_claimed', 'Já existe um resultado aguardando confirmação.');
      match.claim = { winnerId, byPlayerId: actor.id, at: Date.now() };
      match.status = 'reported';
      match.updatedAt = Date.now();
      return;
    }

    if (action === 'confirm') {
      const match = findMatch(draft, body.matchId);
      if (!matchPlayer(match, actor.id)) fail(403, 'not_match_player', 'Você não participa deste confronto.');
      if (match.status !== 'reported' || !match.claim) fail(409, 'no_result_to_confirm', 'Não há resultado aguardando confirmação.');
      if (actor.id === match.claim.byPlayerId) fail(403, 'opponent_confirmation_only', 'O resultado precisa ser confirmado pelo outro participante.');
      const winnerId = String(body.winnerId || '');
      if (!validWinner(match, winnerId)) fail(400, 'invalid_winner', 'O vencedor precisa ser um dos participantes do confronto.');
      if (winnerId !== match.claim.winnerId) {
        match.dispute = { firstWinnerId: match.claim.winnerId, secondWinnerId: winnerId, byPlayerId: actor.id, at: Date.now() };
        match.status = 'disputed';
        match.updatedAt = Date.now();
        return;
      }
      match.winnerId = winnerId;
    match.status = 'complete';
    match.claim = null;
    match.roomCode = null;
    match.connectedPlayerId = null;
      match.updatedAt = Date.now();
      advanceBracket(draft);
      return;
    }

    if (action === 'resolve') {
      requireOwner(draft, actor);
      const match = findMatch(draft, body.matchId);
      if (match.status !== 'disputed') fail(409, 'match_not_disputed', 'Este confronto não está contestado.');
      const winnerId = String(body.winnerId || '');
      if (!validWinner(match, winnerId)) fail(400, 'invalid_winner', 'O vencedor precisa ser um dos participantes do confronto.');
      match.winnerId = winnerId;
    match.status = 'complete';
    match.claim = null;
    match.dispute = null;
    match.roomCode = null;
    match.connectedPlayerId = null;
      match.updatedAt = Date.now();
      advanceBracket(draft);
      return;
    }

    fail(400, 'unknown_action', 'Ação de torneio desconhecida.');
  }, { body, requestId, fingerprint });
  return { tournament: publicState(state), result: result || null };
}

function parseUrl(req) {
  try { return new URL(req.url || '/', 'https://ds-fighters.invalid'); } catch (_) { return new URL('https://ds-fighters.invalid/'); }
}

function checkOrigin(req) {
  const origin = req.headers && req.headers.origin;
  if (!origin) return;
  const host = String((req.headers && req.headers.host) || '').toLowerCase();
  let originHost = '';
  try { originHost = new URL(origin).host.toLowerCase(); } catch (_) { fail(403, 'origin_denied', 'Origem não autorizada.'); }
  if (!host || originHost !== host) fail(403, 'origin_denied', 'Origem não autorizada.');
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    const size = Buffer.byteLength(JSON.stringify(req.body));
    if (size > MAX_BODY_BYTES) fail(413, 'body_too_large', 'Requisição muito grande.');
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) req.body = req.body.toString('utf8');
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) fail(413, 'body_too_large', 'Requisição muito grande.');
    try { return JSON.parse(req.body); } catch (_) { fail(400, 'invalid_json', 'JSON inválido.'); }
  }
  return {};
}

function respond(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

async function handler(req, res) {
  try {
    checkOrigin(req);
    const origin = req.headers && req.headers.origin;
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(''); return; }
    if (req.method !== 'GET' && req.method !== 'POST') fail(405, 'method_not_allowed', 'Use GET ou POST.');

    if (req.method === 'GET') {
      const url = parseUrl(req);
      if (url.searchParams.get('health') === '1') {
        await enforceRate(req, 'health');
        const pong = await redisCommand(['PING']);
        respond(res, 200, { ok: pong === 'PONG', storage: 'persistent', provider: 'upstash-redis', tournamentTtlDays: 7, maxPlayers: 32 });
        return;
      }
      const code = String(url.searchParams.get('code') || '').toUpperCase();
      if (!validCode(code)) fail(400, 'missing_code', 'Informe o código do torneio.');
      await enforceRate(req, 'read');
      const state = await getState(code);
      respond(res, 200, { tournament: publicState(state) });
      return;
    }

    const body = parseBody(req);
    const action = String(body.action || '');
    await enforceRate(req, action === 'create' ? 'create' : action === 'join' ? 'join' : 'mutation');
    if (action === 'create') {
      const created = await createTournament(body);
      respond(res, 201, created);
      return;
    }
    if (action === 'join') {
      const joined = await joinTournament(body);
      respond(res, 200, joined);
      return;
    }
    const updated = await updateTournament(body);
    respond(res, 200, updated);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    const message = error instanceof HttpError ? error.message : 'Falha interna no serviço de torneio.';
    respond(res, status, { error: code, message });
  }
}

module.exports = handler;
module.exports.__test = { CAS_SCRIPT, RATE_SCRIPT, publicState, buildBracket, advanceBracket, cleanName, redisConfig };
