#!/usr/bin/env node
/*
 * Teste focado do Lobão: alcance/contra-jogo do Modo Selvagem, dano da chuva
 * de cadeiras e snapshot do BHM (que não participou do diff recente).
 * Uso: node tools/lobao_combat_test.mjs
 * FIGHTER_SOURCE=... permite comparar a mesma suíte com uma versão anterior.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({
  console,
  Math,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false } } },
  PETS: [{ id: 'none', fx: {}, row: -1 }],
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  SpriteGen: { count() { return 4; }, blit() {} },
});
const scripts = [
  'js/data/fighters.js',
  'js/data/powers.js',
  'js/data/powers-turbo.js',
  'js/data/powers-v4.js',
  'js/data/powers-v5.js',
  'js/data/powers-v6.js',
  'js/engine/projectile.js',
];
for (const rel of scripts) {
  const filename = path.join(ROOT, rel);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx, { filename });
}
const fighterSource = process.env.FIGHTER_SOURCE || path.join(ROOT, 'js/engine/fighter.js');
vm.runInContext(fs.readFileSync(fighterSource, 'utf8'), ctx, { filename: fighterSource });
const api = vm.runInContext('({ Fighter, Strike, FIGHTERS, POWERS })', ctx);

function makeGame() {
  return {
    W: 960, H: 540, time: 0, round: 1, reduced: true,
    weather: { kind: 'clear', wind: 0 }, projectiles: [], strikes: [], zones: [],
    walls: [], beams: [], bursts: [], sparks: [], texts: [], events: [],
    combo: { owner: null, count: 0, until: 0 },
    audio: { play() {}, sfx() {}, voice() {}, block() {}, hit() {}, land() {}, punch() {}, kick() {}, jump() {}, dash() {}, ko() {}, ensure() {} },
    fighters() { return this._fighters; },
    opponentsOf(f) { return this._fighters.filter((other) => other.team !== f.team && other.alive && !other.benched); },
    enemyOf(f) { return this._fighters.find((other) => other.team !== f.team && !other.benched) || null; },
    spawnBurst() {}, spawnImgFx() {}, spawnAbilityImpact() {}, addCrack() {}, shake() {},
    floatText() {}, spark() {},
    registerHit(atk, victim, d, blocked) {
      if (!blocked) victim.redHp = Math.max(victim.hp, Math.min(victim.redHp, victim.hp + d * 0.5));
    },
  };
}

function def(id) {
  const result = api.FIGHTERS.find((fighter) => fighter.id === id);
  assert.ok(result, `fighter ${id} exists`);
  return result;
}

function pairAt(lobaoX, targetX) {
  const game = makeGame();
  const lobao = new api.Fighter(def('lobao'), lobaoX, 1, game, { team: 0, pet: ctx.PETS[0] });
  const target = new api.Fighter(def('bhm'), targetX, -1, game, { team: 1, pet: ctx.PETS[0] });
  game._fighters = [lobao, target];
  return { game, lobao, target };
}

function tickStrikes(game, frames) {
  for (let i = 0; i < frames; i++) {
    game.time++;
    for (const strike of game.strikes) strike.update(game);
  }
}

const wildmode = api.POWERS.lobao.powers.find((power) => power.id === 'wildmode');
const chairrain = api.POWERS.lobao.powers.find((power) => power.id === 'chairrain');
assert.equal(wildmode.time, 720, 'Modo Selvagem mantém os 12 s aumentados');
assert.equal(wildmode.dmgMult, 1.5, 'Modo Selvagem não dobra dano junto com todas as defesas');
assert.equal(wildmode.dodge, 0.1, 'Modo Selvagem deixa uma esquiva moderada');
assert.equal(wildmode.armor, undefined, 'Modo Selvagem não empilha armadura e esquiva');
assert.equal(chairrain.count, 6, 'Chuva mantém seis cadeiras');
assert.equal(chairrain.dmg, 8, 'Cada cadeira permanece fraca à distância');

// Longe: não há Strike teleguiado nem dano automático no alvo do outro lado.
{
  const { game, lobao, target } = pairAt(120, 840);
  const hp = target.hp;
  lobao.fire(wildmode);
  assert.equal(game.strikes.length, 0, 'aura não cria golpe através da arena');
  assert.equal(target.hp, hp, 'alvo distante não sofre dano na ativação');
}

// Perto: o golpe é local, não segue o alvo; mover antes do impacto é contra-jogo.
{
  const { game, lobao, target } = pairAt(300, 500);
  lobao.fire(wildmode);
  assert.equal(game.strikes.length, 1, 'aura cria golpe apenas dentro do alcance');
  assert.equal(game.strikes[0].follow, undefined, 'golpe de ativação não persegue o alvo');
  const hp = target.hp;
  target.x = 820;
  tickStrikes(game, 2);
  assert.equal(target.hp, hp, 'alvo pode sair da área antes do impacto');
}

// Se ficar parado dentro da área, o mesmo golpe realmente conecta.
{
  const { game, lobao, target } = pairAt(300, 500);
  lobao.fire(wildmode);
  tickStrikes(game, 2);
  assert.ok(target.hp < target.maxHp, 'golpe local acerta alvo ao alcance');
}

// Snapshot mínimo: o kit BHM não mudou nesta regressão.
{
  const bhm = def('bhm');
  assert.equal(JSON.stringify(bhm.stats), JSON.stringify({ power: 1.34, speed: 1.16, weight: 1.02, hp: 136, meterRate: 1.24 }), 'stats BHM preservados');
  assert.equal(JSON.stringify(api.POWERS.bhm.powers.map(({ id, dmg, speed, count, time, burstDmg }) => ({ id, dmg, speed, count, time, burstDmg }))), JSON.stringify([
    { id: 'plasma', dmg: 9, speed: 11, count: undefined, time: undefined, burstDmg: undefined },
    { id: 'torpedo', dmg: 12, speed: 18, count: undefined, time: undefined, burstDmg: undefined },
    { id: 'clone', dmg: 13, speed: 7, count: undefined, time: undefined, burstDmg: undefined },
    { id: 'portal', dmg: undefined, speed: undefined, count: undefined, time: 120, burstDmg: 14 },
    { id: 'storm', dmg: 38, speed: undefined, count: 7, time: undefined, burstDmg: undefined },
  ]), 'kit BHM preservado');
}

console.log('lobao_combat_test: alcance, contra-jogo, chuva e BHM OK');
