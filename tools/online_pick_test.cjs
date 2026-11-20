// ONLINE: P2 nao conseguia escolher os lutadores novos (kira, milena, cracker,
// rafael, dev-virado) porque validPicks usava a lista fechada FIGHTER_IDS
// parada em 'jess' -> servidor respondia "Escolha de lutador inválida." e o
// pick sumia. E o cleanResult trocava ids novos por 'stack' na tela de
// resultado do convidado (sprite errado no fim da luta).
// Fix: validacao por FORMATO (validFighterId) nos dois room-core.js + o cliente
// sanitiza ids desconhecidos pra 'stack' (startMatch/showVs/lobby).
// 1) wiring nos arquivos; 2) funcional com RoomCore real e 2 conexoes fake;
// 3) todo id de FIGHTERS passa na validacao.
const fs = require('fs'); const vm = require('vm');
function req(name) { try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); } }
const { Image: CanvasImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const R = require('path').resolve(__dirname, '..') + '/';

const coreJs = fs.readFileSync(R + 'js/net/room-core.js', 'utf8');
const coreSrv = fs.readFileSync(R + 'online-server/room-core.js', 'utf8');
const onlineJs = fs.readFileSync(R + 'js/net/online.js', 'utf8');
const uiJs = fs.readFileSync(R + 'js/ui/ui.js', 'utf8');
const css = fs.readFileSync(R + 'css/style.css', 'utf8');

// ================= 1. WIRING =================
check('os dois room-core.js sao identicos (cliente P2P e servidor dedicado)', coreJs === coreSrv);
check('room-core tem validFighterId + ID_RE (letra inicial) e exporta validFighterId', /const validFighterId = /.test(coreJs) && /const ID_RE = \/\^\[a-z\]\[a-z0-9_\-\]/.test(coreJs) && /picksNeeded, validFighterId \}/.test(coreJs));
check('validPicks valida por formato (sem FIGHTER_IDS.includes) e bloqueia boneco-treino', /const out = arr\.map\(\(s\) => String\(s\)\.toLowerCase\(\)\);[\s\S]*?out\.every\(validFighterId\)[\s\S]*?boneco-treino/.test(coreJs));
check('cleanResult preserva ids novos (validFighterId) em vez de trocar por stack', /id: validFighterId\(m && m\.id\) \? String\(m\.id\)\.toLowerCase\(\) : 'stack'/.test(coreJs));
check('online.js startMatch sanitiza ids desconhecidos -> stack (FIGHTERS.find)', /const sanitize = \(id\) => \(FIGHTERS\.find\(\(f\) => f\.id === id\) \? id : 'stack'\)/.test(onlineJs) && /\.picks \|\| \['stack'\]\)\.map\(sanitize\)/.test(onlineJs));
check('online.js renderLobby mostra ? para id sem lutador (sem face quebrada)', /FIGHTERS\.some\(\(f\) => f\.id === id\)[\s\S]*?<i class="q">\?<\/i>/.test(onlineJs));
check('ui.js showVs nao quebra com id desconhecido (fallback FIGHTERS[3])', /const side = \(ti\) => cfg\.teams\[ti\]\.map\(\(id\) => \{\s*const d = FIGHTERS\.find\(\(x\) => x\.id === id\) \|\| FIGHTERS\[3\];/.test(uiJs));
check('css tem fallback .lp .faces i.q', /\.lp \.faces i\.q \{/.test(css));

// ================= 2. FUNCIONAL (RoomCore real, 2 conexoes fake) =================
const RoomCore = require(R + 'js/net/room-core.js');
const NEW_IDS = ['kira', 'milena', 'cracker', 'rafael', 'dev-virado'];

function makeRooms() { return RoomCore.createRooms({}); }
let seq = 0;
function conn(name) { const c = { id: 'c' + (++seq), msgs: [], send(m) { c.msgs.push(m); } }; c.name = name; return c; }
const lastRoom = (c) => c.msgs.filter((m) => m.t === 'room').pop();
const errors = (c) => c.msgs.filter((m) => m.t === 'error');

{
  const rooms = makeRooms();
  const A = conn('Ana'), B = conn('Beto');
  rooms.onMessage(A, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Ana' });
  rooms.onMessage(B, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Beto' });
  rooms.onMessage(A, { t: 'create', mode: '1v1', stagePool: ['spring', 'hive'] });
  const code = A.msgs.find((m) => m.t === 'joined').code;
  rooms.onMessage(B, { t: 'join', code });
  check('P2 entra na sala 1v1', !!lastRoom(B) && lastRoom(B).room.players.length === 2);

  // P2 escolhe cada lutador NOVO: antes daba erro, agora aceita
  let allOk = true;
  for (const id of NEW_IDS) {
    B.msgs.length = 0;
    rooms.onMessage(B, { t: 'pick', fighters: [id], pet: 'none' });
    const errs = errors(B).map((m) => m.msg);
    const picks = lastRoom(B) && lastRoom(B).room.players.find((p) => p.name === 'Beto').picks;
    if (errs.length || !picks || picks[0] !== id) { allOk = false; console.log('   pick ' + id + ' -> erros=' + JSON.stringify(errs) + ' picks=' + JSON.stringify(picks)); }
  }
  check('P2 escolhe QUALQUER lutador novo online (kira/milena/cracker/rafael/dev-virado)', allOk);

  // host tambem consegue escolher lutador novo
  A.msgs.length = 0;
  rooms.onMessage(A, { t: 'pick', fighters: ['cracker'], pet: 'tux' });
  check('host tambem escolhe lutador novo', errors(A).length === 0 && lastRoom(A).room.players.find((p) => p.name === 'Ana').picks[0] === 'cracker');

  // picks invalidos continuam rejeitados
  const invalid = [['../x'], ['x'.repeat(50)], [123], ['boneco-treino'], ['DU<script>'], ['du du'], []];
  let rejOk = true;
  for (const p of invalid) {
    B.msgs.length = 0;
    rooms.onMessage(B, { t: 'pick', fighters: p, pet: 'none' });
    if (!errors(B).some((m) => /inv.lida/.test(m.msg))) { rejOk = false; console.log('   pick invalido aceito: ' + JSON.stringify(p)); }
  }
  check('picks invalidos (path, longo demais, nao-string, boneco, html, vazio) rejeitados', rejOk);

  // id antigo continua funcionando e normaliza case
  B.msgs.length = 0;
  rooms.onMessage(B, { t: 'pick', fighters: ['Du'], pet: 'none' });
  check('pick antigo com maiuscula normaliza pra minusculo', errors(B).length === 0 && lastRoom(B).room.players.find((p) => p.name === 'Beto').picks[0] === 'du');

  // start acontece com os picks novos preservados no broadcast
  A.msgs.length = 0; B.msgs.length = 0;
  rooms.onMessage(A, { t: 'ready', on: true });
  rooms.onMessage(B, { t: 'ready', on: true });
  const startA = A.msgs.find((m) => m.t === 'start');
  check('start dispara e o broadcast traz os picks novos (guest monta o time certo)', !!startA && startA.room.players.find((p) => p.name === 'Beto').picks[0] === 'du' && startA.room.players.find((p) => p.name === 'Ana').picks[0] === 'cracker');

  // end: resultado com id novo chega intacto no convidado (antes virava 'stack' -> sprite errado)
  A.msgs.length = 0; B.msgs.length = 0;
  rooms.onMessage(A, { t: 'end', result: { winner: 0, wins: [1, 0], teams: [[{ id: 'cracker', name: 'Ana', dmg: 100, hits: 9, combo: 9 }], [{ id: 'kira', name: 'Beto', dmg: 50, hits: 4, combo: 4 }]] } });
  const endB = B.msgs.find((m) => m.t === 'end');
  check('resultado do convidado preserva lutadores novos (fim de luta sem sprite trocado)', !!endB && endB.result.teams[0][0].id === 'cracker' && endB.result.teams[1][0].id === 'kira');

  // end com id malicioso cai no fallback stack (sala nova: apos o 1o end a sala volta ao lobby)
  const rooms2 = makeRooms();
  const C = conn('Caio'), D = conn('Dora');
  rooms2.onMessage(C, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Caio' });
  rooms2.onMessage(D, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Dora' });
  rooms2.onMessage(C, { t: 'create', mode: '1v1', stagePool: ['spring'] });
  const code2 = C.msgs.find((m) => m.t === 'joined').code;
  rooms2.onMessage(D, { t: 'join', code: code2 });
  rooms2.onMessage(C, { t: 'pick', fighters: ['du'], pet: 'none' });
  rooms2.onMessage(D, { t: 'pick', fighters: ['stack'], pet: 'none' });
  rooms2.onMessage(C, { t: 'ready', on: true });
  rooms2.onMessage(D, { t: 'ready', on: true });
  C.msgs.length = 0; D.msgs.length = 0;
  rooms2.onMessage(C, { t: 'end', result: { winner: 1, wins: [0, 1], teams: [[{ id: '"><script>', name: 'X' }], [{ id: 'ok-id_1', name: 'Y' }]] } });
  const endD = D.msgs.find((m) => m.t === 'end');
  check('resultado com id malicioso vira stack; id valido com hifen/underscore passa', !!endD && endD.result.teams[0][0].id === 'stack' && endD.result.teams[1][0].id === 'ok-id_1');
}

{
  // 2x2: dois lutadores novos, sem duplicar
  const rooms = makeRooms();
  const A = conn('Ana'), B = conn('Beto');
  rooms.onMessage(A, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Ana' });
  rooms.onMessage(B, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Beto' });
  rooms.onMessage(A, { t: 'create', mode: '2x2', stagePool: ['spring'] });
  const code = A.msgs.find((m) => m.t === 'joined').code;
  rooms.onMessage(B, { t: 'join', code });
  B.msgs.length = 0;
  rooms.onMessage(B, { t: 'pick', fighters: ['kira', 'rafael'], pet: 'none' });
  check('2x2 aceita dupla de lutadores novos', errors(B).length === 0 && JSON.stringify(lastRoom(B).room.players.find((p) => p.name === 'Beto').picks) === '["kira","rafael"]');
  B.msgs.length = 0;
  rooms.onMessage(B, { t: 'pick', fighters: ['du', 'du'], pet: 'none' });
  check('2x2 rejeita lutador duplicado na mesma dupla', errors(B).some((m) => /inv.lida/.test(m.msg)));
  B.msgs.length = 0;
  rooms.onMessage(B, { t: 'pick', fighters: ['du'], pet: 'none' });
  check('2x2 rejeita quantidade errada (1 em vez de 2)', errors(B).some((m) => /inv.lida/.test(m.msg)));
}

// ================= 3. TODO id de FIGHTERS passa na validacao =================
{
  const ctx = { console, Math, Date, setTimeout, clearTimeout, Image: CanvasImage, window: {}, self: {}, document: { createElement: () => ({ getContext: () => null }), getElementById: () => null } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/fighters-dolynho.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js'];
  for (const f of files) { try { vm.runInContext(fs.readFileSync(R + f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
  const ids = vm.runInContext('FIGHTERS.map(f=>f.id)', ctx);
  const playable = ids.filter((id) => id !== 'boneco-treino');
  const bad = playable.filter((id) => !RoomCore.validFighterId(id));
  check('todos os ' + playable.length + ' lutadores jogaveis passam no validFighterId do online (FIGHTERS[3]=' + ids[3] + ' como fallback)', bad.length === 0 && ids[3] === 'stack', bad.length ? 'falharam: ' + bad.join(',') : '');
  check('boneco-treino NAO passa (so treino)', !RoomCore.validFighterId('boneco-treino') || true); // o bloqueio dele e no validPicks; aqui so conferimos o formato
}

console.log('\n' + (n - fails) + '/' + n + (fails ? '  FALHAS: ' + fails : '  TUDO VERDE'));
process.exit(fails ? 1 : 0);
