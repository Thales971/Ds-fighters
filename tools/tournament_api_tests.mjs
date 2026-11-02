import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/tournaments.js');
const { CAS_SCRIPT, CREATE_SCRIPT, RATE_SCRIPT } = handler.__test;

function response(result, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({ result }) };
}

function createFakeRedis() {
  const values = new Map();
  const ttls = new Map();
  const fakeFetch = async function fakeFetch(_url, options) {
    const command = JSON.parse(options.body);
    const [name, ...args] = command;
    if (name === 'PING') return response('PONG');
    if (name === 'GET') {
      await new Promise((resolve) => setTimeout(resolve, 2));
      return response(values.has(args[0]) ? values.get(args[0]) : null);
    }
    if (name === 'SET') {
      const [key, value, ...flags] = args;
      if (flags.includes('NX') && values.has(key)) return response(null);
      values.set(key, value);
      const exIndex = flags.indexOf('EX');
      if (exIndex >= 0) ttls.set(key, Number(flags[exIndex + 1]));
      return response('OK');
    }
    if (name === 'EVAL') {
      const [script, numKeys, ...operands] = args;
      const keys = operands.slice(0, Number(numKeys));
      const rest = operands.slice(Number(numKeys));
      const key = keys[0];
      if (script === RATE_SCRIPT || script.includes('dsf-rate-v1')) {
        const count = (Number(values.get(key)) || 0) + 1;
        values.set(key, String(count));
        if (count === 1) ttls.set(key, Number(rest[0]));
        return response(count);
      }
      if (script === CREATE_SCRIPT || script.includes('dsf-create-v1')) {
        const [requestKey, stateKey] = keys;
        const [stateText, recordText, ttlSeconds] = rest;
        if (values.has(requestKey)) return response(['DUPLICATE', values.get(requestKey)]);
        if (values.has(stateKey)) return response(['COLLISION']);
        values.set(stateKey, stateText);
        values.set(requestKey, recordText);
        ttls.set(stateKey, Number(ttlSeconds));
        ttls.set(requestKey, Number(ttlSeconds));
        return response(['CREATED', recordText]);
      }
      if (script === CAS_SCRIPT || script.includes('dsf-cas-v1')) {
        const [expected, replacement, ttlSeconds] = rest;
        const raw = values.get(key);
        if (!raw) return response(-1);
        const current = JSON.parse(raw);
        if (Number(current.version || 0) !== Number(expected)) return response(0);
        values.set(key, replacement);
        ttls.set(key, Number(ttlSeconds));
        return response(1);
      }
      return response(null, 400);
    }
    return response(null, 400);
  };
  fakeFetch.values = values;
  fakeFetch.ttls = ttls;
  return fakeFetch;
}

async function call(method, path, body = {}, ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`) {
  const req = {
    method,
    url: path,
    headers: { host: 'game.test', origin: 'https://game.test', 'x-forwarded-for': ip },
    body,
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(text) { this.text = text; },
  };
  await handler(req, res);
  return { status: res.statusCode, body: res.text ? JSON.parse(res.text) : null, headers: res.headers };
}

let requestCounter = 0;
async function post(body, ip) {
  const payload = { ...body };
  if (payload.action && !payload.requestId) payload.requestId = `test-${++requestCounter}-${'x'.repeat(22)}`;
  return call('POST', '/api/tournaments', payload, ip);
}
async function get(code, ip) { return call('GET', `/api/tournaments?code=${code}`, {}, ip); }

const savedEnv = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  kvUrl: process.env.KV_REST_API_URL,
  kvToken: process.env.KV_REST_API_TOKEN,
};
const savedFetch = globalThis.fetch;
let assertions = 0;
const check = (condition, message) => { assert.ok(condition, message); assertions++; };
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); assertions++; };

try {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  const noStore = await call('GET', '/api/tournaments?health=1');
  eq(noStore.status, 503, 'missing Redis must fail closed');
  eq(noStore.body.error, 'storage_not_configured', 'missing Redis explains required setup');

  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token-not-real';
  const fakeRedis = createFakeRedis();
  globalThis.fetch = fakeRedis;

  const health = await call('GET', '/api/tournaments?health=1');
  eq(health.status, 200, 'health verifies storage');
  eq(health.body.provider, 'upstash-redis', 'health identifies persistent provider');
  const healthIp = '192.0.2.250';
  const healthKey = crypto.createHash('sha256').update(healthIp).digest('hex').slice(0, 20);
  fakeRedis.values.set(`dsfighters:tournament:rate:health:${healthKey}`, '300');
  const throttledHealth = await call('GET', '/api/tournaments?health=1', {}, healthIp);
  eq(throttledHealth.status, 429, 'public health is rate-limited without blocking 32 users behind one NAT');

  const invalidCapacity = await post({ action: 'create', capacity: 33, playerName: 'Owner' }, '192.0.2.1');
  eq(invalidCapacity.status, 400, 'capacity cannot exceed 32');

  const created = await post({ action: 'create', name: 'Copa DS Fighters', capacity: 3, playerName: 'Organizador' }, '192.0.2.2');
  eq(created.status, 201, 'organizer can create a tournament');
  check(/^[A-Z0-9]{6}$/.test(created.body.code), 'tournament code is six characters');
  check(created.body.token && created.body.playerId, 'organizer receives a capability token');
  check(!JSON.stringify(created.body.tournament).includes('tokenHash'), 'public state omits token hashes');

  const ttlCreated = await post({ action: 'create', name: 'TTL absoluto', capacity: 2, playerName: 'TTL' }, '192.0.2.205');
  const ttlKey = `dsfighters:tournament:${ttlCreated.body.code}`;
  eq(fakeRedis.ttls.get(ttlKey), 7 * 24 * 60 * 60, 'new tournament is created with a seven-day Redis TTL');
  const originalNow = Date.now;
  try {
    Date.now = () => ttlCreated.body.tournament.createdAt + 2 * 24 * 60 * 60 * 1000;
    await post({ action: 'join', code: ttlCreated.body.code, playerName: 'Mais um' }, '192.0.2.206');
  } finally { Date.now = originalNow; }
  eq(fakeRedis.ttls.get(ttlKey), 5 * 24 * 60 * 60, 'mutations do not extend the absolute seven-day expiry');

  fakeRedis.values.set('dsfighters:tournament:BAD123', JSON.stringify({ schema: 1, code: 'BAD123' }));
  const corrupt = await get('BAD123', '192.0.2.207');
  eq(corrupt.status, 503, 'malformed stored tournament state fails closed');
  eq(corrupt.body.error, 'tournament_corrupt', 'corrupt data does not fall through to an internal error');
  const expiredState = JSON.parse(fakeRedis.values.get(ttlKey));
  expiredState.code = 'OLD123';
  expiredState.createdAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
  fakeRedis.values.set('dsfighters:tournament:OLD123', JSON.stringify(expiredState));
  const expired = await get('OLD123', '192.0.2.208');
  eq(expired.status, 410, 'tournament state is rejected after the absolute seven-day window');

  const retryCreateRequestId = 'retry-create-' + 'a'.repeat(24);
  const retryCreateBody = { action: 'create', requestId: retryCreateRequestId, name: 'Retry seguro', capacity: 2, playerName: 'Host retry' };
  const retryCreateFirst = await post(retryCreateBody, '192.0.2.201');
  const retryCreateAgain = await post(retryCreateBody, '192.0.2.202');
  eq(retryCreateAgain.body.code, retryCreateFirst.body.code, 'retrying create returns the original tournament code');
  eq(retryCreateAgain.body.playerId, retryCreateFirst.body.playerId, 'retrying create returns the same organizer identity');
  eq(retryCreateAgain.body.token, retryCreateFirst.body.token, 'retrying create returns the same organizer capability');

  const retryJoinBody = { action: 'join', code: retryCreateFirst.body.code, requestId: 'retry-join-' + 'b'.repeat(24), playerName: 'Guest retry' };
  const retryJoinFirst = await post(retryJoinBody, '192.0.2.203');
  const retryJoinAgain = await post(retryJoinBody, '192.0.2.204');
  eq(retryJoinAgain.status, 200, 'retrying join does not consume another seat');
  eq(retryJoinAgain.body.playerId, retryJoinFirst.body.playerId, 'retrying join returns the same participant identity');
  eq(retryJoinAgain.body.token, retryJoinFirst.body.token, 'retrying join returns the same participant capability');
  eq(retryJoinAgain.body.tournament.players.length, 2, 'retrying join does not duplicate the participant');

  const joinOne = await post({ action: 'join', code: created.body.code, playerName: '<script>Jogador Dois</script>' }, '192.0.2.3');
  eq(joinOne.status, 200, 'participant can join before start');
  eq(joinOne.body.tournament.players[1].name, 'Jogador Dois', 'HTML tags are removed from names');
  const joinedToken = { code: created.body.code, playerId: joinOne.body.playerId, token: joinOne.body.token };
  const hostAuth = { code: created.body.code, playerId: created.body.playerId, token: created.body.token };
  const guestAuth = { code: created.body.code, playerId: joinOne.body.playerId, token: joinOne.body.token };

  const unauthorized = await post({ action: 'start', code: created.body.code, playerId: guestAuth.playerId, token: 'wrong' }, '192.0.2.4');
  eq(unauthorized.status, 401, 'invalid capability tokens are rejected');
  const guestStart = await post({ action: 'start', ...guestAuth }, '192.0.2.5');
  eq(guestStart.status, 403, 'only organizer can start');
  const missingOperationId = await call('POST', '/api/tournaments', { action: 'start', ...hostAuth }, '192.0.2.51');
  eq(missingOperationId.status, 400, 'state mutations require an idempotency key');

  const third = await post({ action: 'join', code: created.body.code, playerName: 'Terceiro' }, '192.0.2.6');
  eq(third.status, 200, 'third entrant fits capacity three');
  const fourth = await post({ action: 'join', code: created.body.code, playerName: 'Quarto' }, '192.0.2.7');
  eq(fourth.status, 409, 'capacity cannot be exceeded');

  const startBody = { action: 'start', ...hostAuth, requestId: 'retry-start-' + 's'.repeat(24) };
  const started = await post(startBody, '192.0.2.8');
  eq(started.status, 200, 'organizer starts with at least two participants');
  eq(started.body.tournament.status, 'active', 'start changes tournament state');
  check(started.body.tournament.rounds[0].some((match) => match.status === 'bye'), 'three entrants produce a first-round bye');
  const startedRetry = await post(startBody, '192.0.2.81');
  eq(startedRetry.status, 200, 'retrying a committed start is idempotent');
  eq(startedRetry.body.tournament.status, 'active', 'start retry returns the already-started bracket');

  const firstMatch = started.body.tournament.rounds[0].find((match) => match.status === 'ready');
  const [matchHost, matchGuest] = firstMatch.playerIds;
  const hostPlayer = started.body.tournament.players.find((p) => p.id === matchHost);
  const guestPlayer = started.body.tournament.players.find((p) => p.id === matchGuest);
  const hostToken = hostPlayer.id === hostAuth.playerId ? hostAuth.token : guestAuth.token;
  const guestToken = guestPlayer.id === hostAuth.playerId ? hostAuth.token : guestAuth.token;
  const hostCapability = { code: created.body.code, playerId: hostPlayer.id, token: hostToken };
  const guestCapability = { code: created.body.code, playerId: guestPlayer.id, token: guestToken };
  const wrongHost = await post({ action: 'room', ...guestCapability, matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.9');
  eq(wrongHost.status, 403, 'only the designated participant can publish the P2P room');

  const opened = await post({ action: 'room', ...hostCapability, matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.10');
  eq(opened.status, 200, 'designated match host opens room');
  eq(opened.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'joining', 'publishing a code waits for the opponent P2P join before starting match status');
  const earlyClaim = await post({ action: 'claim', ...hostCapability, matchId: firstMatch.id, winnerId: guestPlayer.id }, '192.0.2.111');
  eq(earlyClaim.status, 409, 'a room code alone cannot make a match reportable');
  const earlyStart = await post({ action: 'started', ...hostCapability, requestId: 'host-start-' + 'h'.repeat(24), matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.110');
  eq(earlyStart.status, 200, 'host start can be recorded before the guest join acknowledgement arrives');
  eq(earlyStart.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'joining', 'one early start acknowledgement does not make the lobby reportable');
  const hostCannotConfirmJoin = await post({ action: 'connected', ...hostCapability, matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.112');
  eq(hostCannotConfirmJoin.status, 403, 'only the opponent, not the P2P host, confirms connection');
  const wrongRoomJoin = await post({ action: 'connected', ...guestCapability, matchId: firstMatch.id, roomCode: 'ZZZ999' }, '192.0.2.113');
  eq(wrongRoomJoin.status, 409, 'opponent connection must name the room code stored by the organizer');
  const guestStartsFirst = await post({ action: 'started', ...guestCapability, requestId: 'guest-start-' + 'g'.repeat(24), matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.114');
  eq(guestStartsFirst.status, 200, 'the guest start event is accepted even if the separate connected request is delayed');
  eq(guestStartsFirst.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'playing', 'both start events release the reportable match despite request reordering');
  const connectedLate = await post({ action: 'connected', ...guestCapability, requestId: 'guest-connect-' + 'c'.repeat(24), matchId: firstMatch.id, roomCode: 'ABC123' }, '192.0.2.115');
  eq(connectedLate.status, 200, 'a late Net.join acknowledgement is idempotent after start');
  eq(connectedLate.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'playing', 'late connection acknowledgement cannot downgrade a live match');
  const claimBody = { action: 'claim', ...hostCapability, requestId: 'claim-result-' + 'r'.repeat(24), matchId: firstMatch.id, winnerId: guestPlayer.id };
  const claim = await post(claimBody, '192.0.2.11');
  eq(claim.status, 200, 'participant can submit a proposed result');
  const claimRetry = await post(claimBody, '192.0.2.1111');
  eq(claimRetry.status, 200, 'retrying a persisted result claim is idempotent');
  eq(claimRetry.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'reported', 'claim retry does not duplicate or lose the pending result');
  const alteredReplay = await post({ ...claimBody, winnerId: matchHost }, '192.0.2.1112');
  eq(alteredReplay.status, 409, 'an idempotency key cannot be reused with a different winner payload');
  const selfConfirm = await post({ action: 'confirm', ...hostCapability, matchId: firstMatch.id, winnerId: guestPlayer.id }, '192.0.2.12');
  eq(selfConfirm.status, 403, 'claimant cannot confirm their own result');
  const confirmBody = { action: 'confirm', ...guestCapability, requestId: 'confirm-result-' + 'f'.repeat(24), matchId: firstMatch.id, winnerId: guestPlayer.id };
  const confirmed = await post(confirmBody, '192.0.2.13');
  eq(confirmed.status, 200, 'opponent confirms matching result');
  eq(confirmed.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).status, 'complete', 'confirmed result resolves match');
  const confirmRetry = await post(confirmBody, '192.0.2.1313');
  eq(confirmRetry.status, 200, 'retrying a completed confirmation is idempotent');
  eq(confirmRetry.body.tournament.rounds[0].find((m) => m.id === firstMatch.id).winnerId, guestPlayer.id, 'confirm retry preserves the chosen winner');
  eq(confirmed.body.tournament.rounds[1][0].status, 'ready', 'bye and confirmed match advance the bracket');

  const dispute = await post({ action: 'create', name: 'Desempate', capacity: 2, playerName: 'Dono' }, '192.0.2.14');
  const disputeGuest = await post({ action: 'join', code: dispute.body.code, playerName: 'Rival' }, '192.0.2.15');
  const disputeHostAuth = { code: dispute.body.code, playerId: dispute.body.playerId, token: dispute.body.token };
  const disputeGuestAuth = { code: dispute.body.code, playerId: disputeGuest.body.playerId, token: disputeGuest.body.token };
  const disputeStart = await post({ action: 'start', ...disputeHostAuth }, '192.0.2.16');
  const disputeMatch = disputeStart.body.tournament.rounds[0][0];
  const disputeHostPlayer = disputeStart.body.tournament.players.find((p) => p.id === disputeMatch.hostPlayerId);
  const disputeOtherId = disputeMatch.playerIds.find((id) => id !== disputeMatch.hostPlayerId);
  const disputeOtherPlayer = disputeStart.body.tournament.players.find((p) => p.id === disputeOtherId);
  const disputeHostToken = disputeHostPlayer.id === disputeHostAuth.playerId ? disputeHostAuth.token : disputeGuestAuth.token;
  const disputeOtherToken = disputeOtherPlayer.id === disputeHostAuth.playerId ? disputeHostAuth.token : disputeGuestAuth.token;
  const disputeHostCap = { code: dispute.body.code, playerId: disputeHostPlayer.id, token: disputeHostToken };
  const disputeOtherCap = { code: dispute.body.code, playerId: disputeOtherPlayer.id, token: disputeOtherToken };
  const initialRoomBody = { action: 'room', ...disputeHostCap, requestId: 'room-retry-' + 'r'.repeat(24), matchId: disputeMatch.id, roomCode: 'XYZ789' };
  const initialRoom = await post(initialRoomBody, '192.0.2.17');
  eq(initialRoom.status, 200, 'initial match host opens the P2P room');
  const roomRetry = await post(initialRoomBody, '192.0.2.171');
  eq(roomRetry.status, 200, 'retrying a committed room publication is idempotent');
  eq(roomRetry.body.tournament.rounds[0][0].roomCode, 'XYZ789', 'room retry does not lose the published P2P code');
  const rehostBody = { action: 'rehost', ...disputeHostAuth, requestId: 'rehost-retry-' + 'h'.repeat(24), matchId: disputeMatch.id, hostPlayerId: disputeOtherPlayer.id };
  const recovered = await post(rehostBody, '192.0.2.27');
  eq(recovered.status, 200, 'organizer can recover a disconnected P2P room');
  const rehostRetry = await post(rehostBody, '192.0.2.271');
  eq(rehostRetry.status, 200, 'retrying a committed rehost is idempotent');
  eq(rehostRetry.body.tournament.rounds[0][0].status, 'ready', 'rehost retry does not re-open a newer room');
  eq(recovered.body.tournament.rounds[0][0].status, 'ready', 'recovery returns the match to ready');
  eq(recovered.body.tournament.rounds[0][0].roomCode, null, 'recovery removes the stale room code');
  eq(recovered.body.tournament.rounds[0][0].hostPlayerId, disputeOtherPlayer.id, 'recovery assigns the other participant as host');
  const reopened = await post({ action: 'room', ...disputeOtherCap, matchId: disputeMatch.id, roomCode: 'QWE456' }, '192.0.2.28');
  eq(reopened.status, 200, 'replacement host opens a fresh P2P room');
  const reopenedConnection = await post({ action: 'connected', ...disputeHostCap, matchId: disputeMatch.id, roomCode: 'QWE456' }, '192.0.2.29');
  eq(reopenedConnection.status, 200, 'the opponent confirms joining the replacement P2P room');
  const preStartClaim = await post({ action: 'claim', ...disputeOtherCap, matchId: disputeMatch.id, winnerId: disputeHostPlayer.id }, '192.0.2.2910');
  eq(preStartClaim.status, 409, 'a connected but not started P2P lobby cannot report a result');
  const concurrentStarts = await Promise.all([
    post({ action: 'started', ...disputeOtherCap, matchId: disputeMatch.id, roomCode: 'QWE456' }, '192.0.2.291'),
    post({ action: 'started', ...disputeHostCap, matchId: disputeMatch.id, roomCode: 'QWE456' }, '192.0.2.292'),
  ]);
  check(concurrentStarts.every((result) => result.status === 200), 'simultaneous host/guest start events survive a Redis CAS conflict');
  const disputeStarted = await get(dispute.body.code, '192.0.2.293');
  eq(disputeStarted.body.tournament.rounds[0][0].status, 'playing', 'concurrent start acknowledgements release only after both players start');
  await post({ action: 'claim', ...disputeHostCap, matchId: disputeMatch.id, winnerId: disputeHostPlayer.id }, '192.0.2.18');
  const contested = await post({ action: 'confirm', ...disputeOtherCap, matchId: disputeMatch.id, winnerId: disputeOtherPlayer.id }, '192.0.2.19');
  eq(contested.body.tournament.rounds[0][0].status, 'disputed', 'conflicting scores go to organizer');
  const resolved = await post({ action: 'resolve', ...disputeHostAuth, matchId: disputeMatch.id, winnerId: disputeOtherPlayer.id }, '192.0.2.20');
  eq(resolved.status, 200, 'organizer resolves a dispute');
  eq(resolved.body.tournament.status, 'complete', 'two-player bracket declares a champion');
  eq(resolved.body.tournament.winnerId, disputeOtherPlayer.id, 'resolved winner advances');

  const full = await post({ action: 'create', name: '32 participantes', capacity: 32, playerName: 'Seed 1' }, '192.0.2.21');
  const credentials = [{ id: full.body.playerId, token: full.body.token }];
  for (let i = 2; i <= 32; i++) {
    const join = await post({ action: 'join', code: full.body.code, playerName: `Seed ${i}` }, `203.0.113.${i}`);
    eq(join.status, 200, `entrant ${i} joins a 32-person tournament`);
    credentials.push({ id: join.body.playerId, token: join.body.token });
  }
  const fullStart = await post({ action: 'start', code: full.body.code, playerId: credentials[0].id, token: credentials[0].token }, '192.0.2.22');
  eq(fullStart.body.tournament.players.length, 32, 'all 32 participants are retained');
  eq(fullStart.body.tournament.rounds.map((round) => round.length).join(','), '16,8,4,2,1', '32-player single-elimination bracket has five rounds');
  eq(fullStart.body.tournament.rounds.flat().length, 31, '32-player bracket contains 31 matches');

  const race = await post({ action: 'create', name: 'Corrida CAS', capacity: 3, playerName: 'Host' }, '192.0.2.23');
  await post({ action: 'join', code: race.body.code, playerName: 'Já inscrito' }, '192.0.2.24');
  const raceJoinBody = { action: 'join', code: race.body.code, playerName: 'Concorrente' };
  const raceResults = await Promise.all([
    post(raceJoinBody, '192.0.2.25'),
    post(raceJoinBody, '192.0.2.26'),
  ]);
  eq(raceResults.filter((r) => r.status === 200).length, 1, 'atomic compare-and-set admits only one racer into the last seat');
  eq(raceResults.filter((r) => r.status === 409).length, 1, 'the concurrent overflow is rejected');

  console.log(`Tournament API: ${assertions} assertions passed; 2–32 player brackets, CAS, results and fail-closed storage — PASS`);
} finally {
  globalThis.fetch = savedFetch;
  for (const [key, value] of [
    ['UPSTASH_REDIS_REST_URL', savedEnv.url],
    ['UPSTASH_REDIS_REST_TOKEN', savedEnv.token],
    ['KV_REST_API_URL', savedEnv.kvUrl],
    ['KV_REST_API_TOKEN', savedEnv.kvToken],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
