/* Teste do servidor de salas: duas conexões, isolamento, validação,
   retransmissão, placar e reconexão. Uso: npm test */
'use strict';
const assert = require('assert');
const WebSocket = require('ws');
process.env.GRACE_MS = '1500';
const { createServer } = require('./server');
const RoomCore = require('./room-core');

const PORT = 18787;
const URL = `ws://localhost:${PORT}`;
const STAGES = ['spring', 'hive', 'rust'];

function client(name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(URL);
    const c = { ws, msgs: [], waiters: [] };
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      c.msgs.push(m);
      c.waiters = c.waiters.filter((w) => { if (w.pred(m)) { w.res(m); return false; } return true; });
    });
    c.send = (o) => ws.send(JSON.stringify(o));
    c.wait = (pred, ms = 2000) => new Promise((res, rej) => {
      const hit = c.msgs.find(pred);
      if (hit) { c.msgs.splice(c.msgs.indexOf(hit), 1); return res(hit); }
      const t = setTimeout(() => rej(new Error('timeout esperando mensagem em ' + name)), ms);
      c.waiters.push({ pred, res: (m) => { clearTimeout(t); c.msgs.splice(c.msgs.indexOf(m), 1); res(m); } });
    });
    c.none = async (pred, ms = 300) => { await new Promise((r) => setTimeout(r, ms)); assert(!c.msgs.find(pred), 'mensagem inesperada em ' + name); };
    ws.on('open', () => { c.send({ t: 'hello', v: 2, name }); resolve(c); });
  });
}
const T = (t) => (m) => m.t === t;

(async () => {
  const { server, wss } = createServer(PORT);
  await new Promise((r) => setTimeout(r, 200));
  let ok = 0;
  const pass = (s) => { ok++; console.log('  ✔ ' + s); };
  try {
    assert.equal(RoomCore.normalizeConfig({ roundsToWin: 9 }).roundsToWin, 9);
    assert.equal(RoomCore.normalizeConfig({ roundsToWin: 99 }).roundsToWin, 9);
    assert.equal(RoomCore.normalizeConfig({ roundsToWin: 0 }).roundsToWin, 1);
    pass('normaliza rounds extras entre 1 e 9');
    // protocolo incompatível
    const bad = await new Promise((res) => { const ws = new WebSocket(URL); ws.on('open', () => ws.send(JSON.stringify({ t: 'hello', v: 99 }))); ws.on('message', (d) => res(JSON.parse(d.toString()))); });
    assert.equal(bad.code, 'protocol'); pass('rejeita versão de protocolo diferente');

    const A = await client('Ana'); await A.wait(T('welcome'));
    const B = await client('Beto'); await B.wait(T('welcome'));
    const C = await client('Caio'); await C.wait(T('welcome'));

    A.send({ t: 'create', mode: '1v1', stagePool: STAGES });
    const ja = await A.wait(T('joined'));
    assert(/^[A-Z0-9]{6}$/.test(ja.code)); pass('cria sala com código ' + ja.code);
    const directory = await B.wait((m) => m.t === 'rooms' && m.rooms.some((r) => r.code === ja.code));
    const listed = directory.rooms.find((r) => r.code === ja.code);
    assert.deepEqual({ players: listed.players, cap: listed.cap, open: listed.open }, { players: 1, cap: 2, open: true });
    pass('diretório público anuncia somente a sala real e uma vaga livre');

    B.send({ t: 'join', code: 'ZZZZZZ' });
    assert.match((await B.wait(T('error'))).msg, /não encontrada/); pass('código inexistente é recusado');

    B.send({ t: 'join', code: listed.code });
    const jb = await B.wait(T('joined'));
    const room = await A.wait((m) => m.t === 'room' && m.room.players.length === 2);
    assert.equal(room.room.players[1].name, 'Beto'); pass('convidado entra e lobby atualiza');

    A.send({ t: 'config', config: { roundsToWin: 9, timer: 120, infiniteLife: true, infiniteMeter: true } });
    const configured = await B.wait((m) => m.t === 'room' && m.room.config && m.room.config.roundsToWin === 9);
    assert.deepEqual(configured.room.config, { roundsToWin: 9, timer: 120, infiniteLife: true, infiniteMeter: true });
    pass('anfitrião sincroniza vida infinita, medidores, tempo e até nove rounds');
    B.send({ t: 'config', config: { roundsToWin: 1, timer: 30, infiniteLife: false } });
    await B.none((m) => m.t === 'room' && m.room.config && m.room.config.roundsToWin === 1);
    pass('convidado não pode substituir as regras da sala');

    C.send({ t: 'join', code: ja.code });
    assert.match((await C.wait(T('error'))).msg, /cheia/); pass('terceiro jogador recebe "Sala cheia"');

    // sala isolada para C
    C.send({ t: 'create', mode: '2x2', stagePool: STAGES, config: null });
    const jc = await C.wait(T('joined'));
    assert.notEqual(jc.code, ja.code);
    const cRoom = await C.wait((m) => m.t === 'room' && m.room.code === jc.code);
    assert.deepEqual(cRoom.room.config, { roundsToWin: 2, timer: 99, infiniteLife: false, infiniteMeter: false });
    pass('configuração nula usa regras padrão sem derrubar a conexão');

    // validação de escolhas
    A.send({ t: 'pick', fighters: ['senpai'] });
    assert.match((await A.wait(T('error'))).msg, /inválida/); pass('lutador inexistente (Senpai) é recusado');
    A.send({ t: 'pick', fighters: ['iales', 'du'] });
    await A.wait(T('error')); pass('quantidade errada de lutadores para 1x1 é recusada');
    B.send({ t: 'stage', id: 'hive' });
    await B.none((m) => m.t === 'room' && m.room.stage === 'hive'); pass('só o anfitrião escolhe a arena');
    A.send({ t: 'stage', id: 'rust' });
    await A.wait((m) => m.t === 'room' && m.room.stage === 'rust');

    // entrada antes da partida é ignorada
    B.send({ t: 'input', i: 5 });
    await A.none(T('input')); pass('entradas fora de partida são ignoradas');

    A.send({ t: 'pick', fighters: ['iales'], pet: 'tux' });
    B.send({ t: 'pick', fighters: ['du'], pet: 'hacker' });
    await B.wait((m) => m.t === 'room' && m.room.players.every((p) => p.picks.length));
    A.send({ t: 'ready', on: true });
    B.send({ t: 'ready', on: true });
    const sa = await A.wait(T('start'));
    const sb = await B.wait(T('start'));
    assert.equal(sa.stage, 'rust'); assert.equal(sb.matchId, sa.matchId);
    const pb = sb.room.players.find((p) => p.name === 'Beto');
    assert.equal(pb.pet, 'none'); pass('partida inicia quando os dois estão prontos (mascote inválido vira "nenhum")');

    // retransmissão
    B.send({ t: 'input', i: 0b10001 });
    assert.equal((await A.wait(T('input'))).i, 0b10001); pass('entrada do convidado chega ao anfitrião');
    B.send({ t: 'input', i: 0b10010, seq: 9 });
    assert.equal((await A.wait(T('input'))).seq, 9);
    B.send({ t: 'input', i: '0x31', seq: 10 });
    B.send({ t: 'input', i: 0b10011, seq: 8 });
    await A.none((m) => m.t === 'input' && m.seq === 8);
    pass('entrada com tipo inválido e sequência atrasada não entra na fila do anfitrião');
    A.send({ t: 'input', i: 1 });
    await B.none(T('input')); pass('anfitrião não envia entrada (autoridade é dele)');
    A.send({ t: 'snap', s: { t: 1, teams: [[], []] } });
    assert.equal((await B.wait(T('snap'))).s.t, 1); pass('snapshot do anfitrião chega ao convidado');
    A.send({ t: 'snap', s: { t: 0, teams: [[], []] } });
    await B.none((m) => m.t === 'snap' && m.s && m.s.t === 0);
    pass('snapshot atrasado é descartado');
    B.send({ t: 'snap', s: { t: 2 } });
    await A.none(T('snap')); pass('convidado não consegue enviar snapshot');
    await C.none((m) => m.t === 'snap' || m.t === 'input'); pass('salas isoladas: outra sala não recebe nada');

    // fim só pelo anfitrião
    B.send({ t: 'end', result: { winner: 1 } });
    await A.none(T('end')); pass('convidado não pode declarar vitória');
    A.send({ t: 'end', result: { winner: 0, wins: [2, 1], teams: [[], []] } });
    const eb = await B.wait(T('end'));
    assert.deepEqual(eb.score, [1, 0]); pass('anfitrião encerra e placar da sala vira 1 × 0');

    // revanche
    A.send({ t: 'rematch' }); B.send({ t: 'rematch' });
    await A.wait(T('start')); await B.wait(T('start')); pass('revanche com os dois confirmando');

    // queda e reconexão
    B.ws.terminate();
    await A.wait((m) => m.t === 'peer' && m.ev === 'left'); pass('anfitrião é avisado da queda do convidado');
    const B2 = await new Promise((resolve) => {
      const ws = new WebSocket(URL);
      const c = { ws, msgs: [] };
      ws.on('message', (d) => c.msgs.push(JSON.parse(d.toString())));
      ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', v: 2, name: 'Beto', resume: { code: ja.code, token: jb.token } })); resolve(c); });
    });
    await A.wait((m) => m.t === 'peer' && m.ev === 'back');
    await new Promise((r) => setTimeout(r, 200));
    assert(B2.msgs.find((m) => m.t === 'start' && m.resume)); pass('convidado volta com token e recebe a partida em andamento');
    B2.ws.send(JSON.stringify({ t: 'resume-bad' }));

    // token errado
    const X = await new Promise((resolve) => { const ws = new WebSocket(URL); ws.on('open', () => ws.send(JSON.stringify({ t: 'hello', v: 2, resume: { code: ja.code, token: 'x' } }))); ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.t === 'error') resolve(m); }); });
    assert.equal(X.code, 'resume_failed'); pass('token falso não assume a vaga de ninguém');

    // abandono definitivo
    B2.ws.terminate();
    await A.wait((m) => m.t === 'abort', 4000); pass('após 30 s (1,5 s no teste) a partida é cancelada');

    // anfitrião sai -> sala fecha
    const D = await client('Duda'); await D.wait(T('welcome'));
    D.send({ t: 'join', code: ja.code }); await D.wait(T('joined'));
    A.send({ t: 'leave' });
    await D.wait(T('closed')); pass('se o anfitrião sai, a sala é encerrada para todos');

    // limite de taxa
    for (let k = 0; k < 60; k++) C.send({ t: 'stage', id: 'hive' });
    await new Promise((r) => setTimeout(r, 300));
    pass('rajada de mensagens não derruba o servidor');
    // 2x2 com 4 jogadores: slots, equipes, parceiro não repete lutador, entradas com slot
    const P = await Promise.all(['E1', 'E2', 'E3', 'E4'].map((n) => client(n)));
    await Promise.all(P.map((c) => c.wait(T('welcome'))));
    P[0].send({ t: 'create', mode: '2x2-4', stagePool: STAGES });
    const j4 = await P[0].wait(T('joined'));
    for (const c of P.slice(1)) { c.send({ t: 'join', code: j4.code }); await c.wait(T('joined')); }
    const r4 = await P[0].wait((m) => m.t === 'room' && m.room.players.length === 4);
    assert.deepEqual(r4.room.players.map((p) => p.slot).sort(), [0, 1, 2, 3]);
    assert.equal(r4.room.players.filter((p) => p.team === 0).length, 2); pass('sala 2x2 com 4 jogadores distribui 2 por equipe');
    const X5 = await client('E5'); await X5.wait(T('welcome'));
    X5.send({ t: 'join', code: j4.code }); const full = await X5.wait(T('error'));
    assert(/cheia/.test(full.msg)); pass('quinto jogador recebe "Sala cheia"');
    const bySlot = {}; r4.room.players.forEach((p, k) => { bySlot[p.slot] = p; });
    const conn = (slot) => P[r4.room.players.findIndex((p) => p.slot === slot)];
    conn(0).send({ t: 'pick', fighters: ['kotlin'], pet: 'tux' });
    await new Promise((r) => setTimeout(r, 80));
    conn(1).send({ t: 'pick', fighters: ['kotlin'] });
    const dup = await conn(1).wait(T('error')); assert(/parceiro/.test(dup.msg)); pass('parceiro de equipe não pode repetir o lutador');
    conn(1).send({ t: 'pick', fighters: ['java'] }); conn(2).send({ t: 'pick', fighters: ['merc'] }); conn(3).send({ t: 'pick', fighters: ['bhm'] });
    await new Promise((r) => setTimeout(r, 120));
    P.forEach((c) => c.send({ t: 'ready', on: true }));
    const st4 = await P[3].wait(T('start')); assert(STAGES.includes(st4.stage)); pass('com os 4 prontos a partida começa');
    conn(3).send({ t: 'input', i: 0x31 });
    const in4 = await P[0].wait(T('input')); assert.equal(in4.slot, 3); pass('entrada de cada jogador chega ao anfitrião com o slot certo');
    P.concat([X5]).forEach((c) => c.ws.close());
    const health = await (await fetch(`http://localhost:${PORT}/health`)).json();
    assert.equal(health.ok, true); pass('/health responde: ' + JSON.stringify(health));

    console.log(`\nOK — ${ok} verificações passaram.`);
    [A, C, D].forEach((c) => c.ws.close());
  } catch (e) {
    console.error('FALHOU:', e.message);
    process.exitCode = 1;
  } finally {
    wss.clients.forEach((c) => c.terminate());
    wss.close();
    server.close();
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  }
})();
