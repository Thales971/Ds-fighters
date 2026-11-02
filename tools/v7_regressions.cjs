#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const ids = ['winx-exe', 'kimi', 'deepseek', 'dandara-query'];
const mapIds = ['area-de-trabalho', 'abismo-das-baleias', 'vale-do-cache'];
const legacyMapIds = ['dojo-noite', 'circo', 'pizzaria'];
const context = vm.createContext({
  console,
  HEALTH_MULTIPLIER: 1,
  EMPTY_INPUT: { left:false, right:false, up:false, down:false, punch:false, kick:false },
  PETS: [{ id:'none', fx:{} }],
  SIGNATURES: {},
});
for (const f of [
  'js/data/fighters.js', 'js/data/powers.js', 'js/data/powers-v4.js',
  'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js',
  'js/data/powers-v7.js',
]) vm.runInContext(read(f), context, { filename:f });
const fighters = vm.runInContext('FIGHTERS', context);
for (const id of ids) assert(fighters.some((f) => f.id === id), `lutador não carregado: ${id}`);
assert.strictEqual(fighters.filter((f) => ids.includes(f.id)).length, 4, 'os quatro IDs devem ser únicos');
const winx = fighters.find((f) => f.id === 'winx-exe');
const du = fighters.find((f) => f.id === 'du');
assert(winx.secret, 'Winx deve ser secreta');
assert.strictEqual(winx.stats.power, du.stats.power, 'Winx deve ter a força-base de Du');
for (const id of ids.slice(1)) assert(!fighters.find((f) => f.id === id).secret, `${id} deve ser normal e livre`);
const powers = vm.runInContext('POWERS', context);
for (const id of ids) {
  assert(powers[id], `kit ausente: ${id}`);
  const moves = Object.values(powers[id]).find(Array.isArray) || [];
  assert(moves.length >= 5, `${id} deve ter pelo menos cinco golpes`);
}
const winxMoves = Object.values(powers['winx-exe']).find(Array.isArray) || [];
assert(winxMoves.length >= 5 && winxMoves.every((p) => p.fx && p.fx.glitch > 0), 'os cinco golpes da Winx precisam aplicar travamento');
const winxMove = winxMoves[0];

context.Game = function() {};
vm.runInContext(read('js/engine/fighter.js'), context, { filename:'js/engine/fighter.js' });
const Fighter = vm.runInContext('Fighter', context);
const game = { round:1, weather:{kind:'clear'}, floatText(){}, spark(){}, shake(){}, spawnBurst(){},
  audio:{ voice(){}, play(){}, ko(){} }, onKO(){} };
const attacker = new Fighter(winx, 100, 1, game, { team:0 });
const target = new Fighter(du, 420, -1, game, { team:1 });
target.applyEffects({ ability:true, power:winxMove }, attacker, 10, 1);
assert(target.has('glitch'), 'applyEffects precisa aplicar o status glitch da habilidade');
assert(context.STATUS_LABEL?.glitch || vm.runInContext("STATUS_LABEL.glitch.t === 'TRAVAMENTO'", context), 'rótulo do status ausente');
const baseSpeed = target.def.stats.speed || 1;
assert(target.speedMult() < baseSpeed && target.speedMult() > baseSpeed * 0.8, 'glitch reduz movimento de forma leve');
const original = { left:true, right:false, up:false, down:false, punch:true, kick:false, a0:true };
target.now = 31;
const stalled = target.glitchInput(original);
assert(!stalled.left && !stalled.punch && !stalled.a0, 'pulso de travamento precisa atrasar comandos brevemente');
target.now = 34;
const recovered = target.glitchInput(original);
assert(recovered.left && recovered.punch && recovered.a0, 'os comandos precisam voltar após o pulso');
assert(original.left && original.punch && original.a0, 'o modificador de input não deve mutar a entrada original');
target.now = 35;
for (let t = 36; t <= 80; t += 4) { target.now = t; target.addStatus('glitch', 90, attacker); }
assert(target.status.glitch <= 122, 'renovação do glitch precisa respeitar o teto anti-loop');

const layoutCtx = vm.createContext({ Image: class ImageStub {} });
vm.runInContext(read('assets/sprites/layout.js'), layoutCtx, { filename:'assets/sprites/layout.js' });
vm.runInContext(read('js/engine/sprites.js'), layoutCtx, { filename:'js/engine/sprites.js' });
const spriteMap = vm.runInContext('SpriteGen', layoutCtx);
for (const id of ids) {
  const sheet = path.join(root, `assets/sprites/${id}.png`);
  assert(fs.existsSync(sheet), `spritesheet ausente: ${id}`);
  assert(fs.existsSync(path.join(root, `assets/ui/face-${id}.png`)), `face do recorte de combate ausente: ${id}`);
  assert.strictEqual(spriteMap.count('idle', id), 4, `idle 4 quadros ausente: ${id}`);
  assert.strictEqual(spriteMap.rowOf('special', id), 6, `linha de especial incorreta: ${id}`);
}
assert.strictEqual(spriteMap.rowOf('special', 'stack'), 10, 'layout antigo 4×15 deve continuar intacto');

const online = require(path.join(root, 'online-server/room-core.js'));
for (const id of ids) assert(online.FIGHTER_IDS.includes(id), `ID V7 não permitido online: ${id}`);
const stageCtx = vm.createContext({ STAGE_SHEETS:[] });
vm.runInContext(read('assets/maps/anim.js'), stageCtx, { filename:'assets/maps/anim.js' });
vm.runInContext(read('js/data/stages.js'), stageCtx, { filename:'js/data/stages.js' });
const stages = vm.runInContext('STAGE_LIST', stageCtx);
const animationManifest = vm.runInContext('MAP_ANIM', stageCtx);
for (const id of mapIds) {
  const stage = stages.find((s) => s.id === id);
  assert(stage, `mapa não selecionável: ${id}`);
  assert.strictEqual(stage.frames, 24, `mapa não usa loop de 24 quadros: ${id}`);
  assert(fs.existsSync(path.join(root, stage.sheet)), `folha animada ausente: ${id}`);
}
for (const id of legacyMapIds) {
  assert(stages.some((s) => s.id === id), `arena clássica removida: ${id}`);
  assert.strictEqual(animationManifest[id]?.frames, 24, `folha clássica removida do manifest: ${id}`);
  assert(fs.existsSync(path.join(root, animationManifest[id].sheet)), `asset clássico ausente: ${id}`);
}

const storage = new Map();
const profileCtx = vm.createContext({
  FIGHTERS: fighters,
  localStorage:{ getItem:(k)=>storage.has(k)?storage.get(k):null, setItem:(k,v)=>storage.set(k,String(v)) },
  Cloud:{ queueSave(){} }, console,
});
vm.runInContext(read('js/core/profile.js'), profileCtx, { filename:'js/core/profile.js' });
vm.runInContext('Profile.load()', profileCtx);
const Profile = vm.runInContext('Profile', profileCtx);
const batata = Profile.redeem('batata');
assert.deepStrictEqual(JSON.parse(JSON.stringify(batata.ids)), ['du','iales','felipinho','qwen']);
assert(!Profile.isUnlocked('winx-exe'), 'Batata não deve desbloquear Winx');
const winxCode = Profile.redeem('WINX.EXE');
assert(winxCode.ok && Profile.isUnlocked('winx-exe'), 'código WINX.EXE precisa desbloquear Winx');
assert.deepStrictEqual(JSON.parse(JSON.stringify(winxCode.ids)), ['winx-exe']);
const aliasStorage = new Map();
const aliasCtx = vm.createContext({ FIGHTERS:fighters, localStorage:{ getItem:(k)=>aliasStorage.get(k)||null, setItem:(k,v)=>aliasStorage.set(k,String(v)) }, Cloud:{ queueSave(){} }, console });
vm.runInContext(read('js/core/profile.js'), aliasCtx, { filename:'js/core/profile.js' });
vm.runInContext('Profile.load()', aliasCtx);
const shortCode = vm.runInContext("Profile.redeem('WINX')", aliasCtx);
assert(shortCode.ok && vm.runInContext("Profile.isUnlocked('winx-exe')", aliasCtx), 'código curto WINX também precisa funcionar');
assert.deepStrictEqual(JSON.parse(JSON.stringify(shortCode.ids)), ['winx-exe']);

console.log(`V7: ${ids.length} lutadores, ${mapIds.length} mapas, glitch limitado, WINX separado e compatibilidade online — PASS`);
