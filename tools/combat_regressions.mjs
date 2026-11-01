#!/usr/bin/env node
/*
 * Regressões de combate sem navegador: carrega os mesmos scripts globais do
 * Canvas em vm.Context e exercita os contratos do V4.
 * Uso: node tools/combat_regressions.mjs
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
  SpriteGen: {
    calls: [],
    count(pose, id) { this.calls.push([pose, id]); return 4; },
    blit() {},
  },
});

const scripts = [
  'js/data/fighters.js',
  'js/data/powers.js',
  'js/data/powers-turbo.js',
  'js/data/powers-v4.js',
  'js/engine/projectile.js',
  'js/engine/fighter.js',
];
for (const rel of scripts) {
  const filename = path.join(ROOT, rel);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx, { filename });
}

const api = vm.runInContext(`({ Fighter, Projectile, Strike, Zone, FIGHTERS, POWERS, Profile, SpriteGen })`, ctx);
const blank = { left: false, right: false, down: false, up: false, punch: false, kick: false };

function makeGame() {
  const game = {
    W: 960,
    H: 540,
    time: 0,
    reduced: true,
    gravityMul: 1,
    jumpMul: 1,
    groundDecay: 0.6,
    pushX: 0,
    weather: { kind: 'clear', wind: 0 },
    projectiles: [],
    strikes: [],
    zones: [],
    walls: [],
    beams: [],
    bursts: [],
    sparks: [],
    texts: [],
    events: [],
    combo: { owner: null, count: 0, until: 0 },
    audio: {
      play() {}, sfx() {}, voice() {}, block() {}, hit() {}, land() {}, punch() {}, kick() {},
      jump() {}, dash() {}, ko() {}, ensure() {},
    },
    fighters() { return this._fighters || []; },
    opponentsOf(f) { return this._fighters.filter((other) => other.team !== f.team && other.alive && !other.benched); },
    enemyOf(f) { return this._fighters.find((other) => other.team !== f.team && !other.benched) || null; },
    spawnBurst() {}, spawnImgFx() {}, spawnAbilityImpact() {}, addCrack() {}, shake() {},
    floatText(x, y, text, color) { this.texts.push({ x, y, text, color }); },
    spark() {},
    registerHit(atk, victim, d, blocked) {
      if (!blocked) {
        victim.redHp = Math.max(victim.hp, Math.min(victim.redHp, victim.hp + d * 0.5));
        this.lastVictim = victim;
      }
    },
  };
  return game;
}

function def(id) {
  const found = api.FIGHTERS.find((f) => f.id === id);
  assert.ok(found, `fighter ${id} exists`);
  return found;
}

function pair(aId, bId) {
  const game = makeGame();
  const a = new api.Fighter(def(aId), 300, 1, game, { team: 0, pet: ctx.PETS[0] });
  const b = new api.Fighter(def(bId), 520, -1, game, { team: 1, pet: ctx.PETS[0] });
  game._fighters = [a, b];
  return { game, a, b };
}

function runZone(zone, game, frames) {
  for (let i = 0; i < frames; i++) {
    game.time++;
    zone.update(game);
  }
}

// 1) A escala global de vida é aplicada exatamente uma vez a todo o roster.
for (const fdef of api.FIGHTERS) {
  const game = makeGame();
  const f = new api.Fighter(fdef, 200, 1, game, { team: 0, pet: ctx.PETS[0] });
  assert.equal(f.maxHp, Math.round((fdef.stats.hp || 100) * 1.12), `${fdef.id} hp multiplier`);
}

// 2) Slots V4 e resgate: Qwen permanece forte/desbloqueável por Batata.
for (const id of ['urbano', 'xeon', 'qwen']) {
  const kit = api.POWERS[id].powers;
  assert.equal(kit.length, 5, `${id} has five powers`);
  assert.equal(new Set(kit.map((p) => p.id)).size, 5, `${id} powers are distinct`);
}
assert.ok(api.POWERS.iales.powers[5] && api.POWERS.iales.powers[5].id === 'afo2', 'IALES AFO2 is the sixth hotkey contract');
assert.ok(api.Profile.SECRET_IDS.includes('qwen'), 'Batata unlock includes Qwen');
assert.ok(def('iales').stats.power > def('qwen').stats.power && def('qwen').stats.power >= def('du').stats.power, 'IALES remains above Qwen and DU stays close');
assert.equal(api.POWERS.stack.powers.find((p) => p.id === 'chip').dmg, 15, '1155 chip buff');
assert.equal(api.POWERS.stack.powers.find((p) => p.id === 'driver').cd, 32, '1155 driver cooldown buff');

// 3) Xeon gelo: projétil aplica chill pelo caminho real Projectile.update.
{
  const { game, a: xeon, b: target } = pair('xeon', 'stack');
  const p = api.POWERS.xeon.powers[0];
  const shot = new api.Projectile(xeon, p, {});
  shot.x = target.x;
  shot.y = -100;
  shot.update(game);
  assert.ok(target.has('chill'), 'ice spear applies chill');
  assert.equal(p.impactSheet, 'water', 'ice impact is visually distinct');
}

// 4) Xeon fogo: dash propaga burn, e a zona mantém burn ao pisar.
{
  const { game, a: xeon, b: target } = pair('xeon', 'stack');
  const flame = api.POWERS.xeon.powers[1];
  xeon.cast = { p: flame, t: 0, fired: true };
  xeon.fire(flame);
  xeon.x = 300;
  target.x = 345;
  xeon.stepCast();
  assert.ok(target.has('burn'), 'flame dash applies burn');
  assert.equal(flame.impactSheet, 'fire', 'fire impact is visually distinct');

  const firewall = api.POWERS.xeon.powers[3];
  xeon.fire(firewall);
  assert.equal(game.zones.length, 1, 'firewall creates one zone');
  const zone = game.zones[0];
  runZone(zone, game, 20);
  assert.ok(target.has('burn'), 'firewall zone applies burn');
}

// 5) Choque térmico: gelo/fogo distintos e bônus só após preparar o alvo.
{
  const { game, a: xeon, b: target } = pair('xeon', 'stack');
  const thermal = api.POWERS.xeon.powers[4];
  target.addStatus('chill', 120);
  const before = target.hp;
  target.takeHit(0, { attacker: xeon, height: 'unblockable', noScale: true, ability: true, power: thermal });
  assert.ok(target.hp < before - 8, 'thermal explosion plus prepared-target bonus deals real damage');
  assert.deepEqual(Array.from(thermal.impactSheets), ['water', 'fire'], 'thermal impact contains ice and fire');
}

// 6) Urbano: primeiro golpe trava, segundo golpe lança; bloqueio não arma o segundo.
{
  const { game, a: urbano, b: target } = pair('urbano', 'stack');
  const quake = api.POWERS.urbano.powers[0];
  target.x = 420;
  urbano.fire(quake);
  assert.ok(target.quakeHold && target.has('freeze'), 'quake starts a bounded hold');
  for (let i = 0; i < 30; i++) { game.time++; target.update(blank); }
  assert.equal(target.quakeHold, null, 'quake hold resolves once');
  assert.ok(target.y < 0 || target.vy < 0 || target.state === 'down', 'quake launches target after hold');

  const blocked = pair('urbano', 'stack');
  blocked.b.x = 420;
  blocked.b.blocking = true;
  blocked.b.state = 'block';
  blocked.a.fire(quake);
  assert.ok(!blocked.b.quakeHold, 'blocked quake does not schedule unblockable launch');
}

// 7) IALES AFO2: exige quatro stacks, cresce e só consome o estoque quando acerta.
{
  const { game, a: iales, b: target } = pair('iales', 'qwen');
  const afo2 = api.POWERS.iales.powers[5];
  iales.afo = 4;
  iales.castAfo = 4;
  const hpBefore = target.hp;
  iales.fire(afo2);
  assert.equal(iales.afo, 0, 'AFO2 consumes stacks after a landed hit');
  assert.ok(target.hp < hpBefore, 'AFO2 deals damage');
  assert.equal(target.ultimate, 0, 'AFO2 drains target ultimate');

  const miss = pair('iales', 'qwen');
  miss.a.afo = 4;
  miss.a.castAfo = 4;
  // AFO2 é garantido e ignora guarda/esquiva; não atinge quem já está caído.
  miss.b.state = 'down';
  miss.a.fire(afo2);
  assert.equal(miss.a.afo, 4, 'AFO2 preserves stacks when target cannot receive a new hit');
}

// 8) O frame-count por lutador é passado ao gerador (inclui forma Astra).
{
  const { a: qwen } = pair('qwen', 'stack');
  qwen.addStatus('astra', 100);
  qwen.animFrame('special');
  const last = ctx.SpriteGen.calls.at(-1);
  assert.deepEqual(last, ['special', 'qwen-astra'], 'animFrame uses spriteKey-aware frame count');
}

// 9) Vida infinita deve impedir KO, não ressuscitar depois de já encerrar o round.
{
  const { game, a, b } = pair('stack', 'urbano');
  game.cfg = { infiniteLife: true };
  b.takeHit(99999, { attacker: a, height: 'unblockable', noScale: true });
  assert.equal(b.hp, b.maxHp, 'infinite life prevents direct damage KO');
  b.chip(99999, a);
  assert.equal(b.hp, b.maxHp, 'infinite life prevents hazard/status KO');
  assert.ok(b.alive && b.state !== 'ko');
  assert.ok(a.stats.dmg > 0, 'damage score still counts in infinite life');
}

// 10) Bloqueio e DOT também pontuam; dano ambiental não pertence ao adversário.
{
  const { game, a, b } = pair('stack', 'urbano');
  game.cfg = { infiniteLife: true };
  b.blocking = true; b.state = 'block';
  b.takeHit(20, { attacker: a, ability: true });
  assert.ok(a.stats.dmg > 0, 'blocked ability chip counts in score');
  const before = a.stats.dmg;
  b.addStatus('burn', 120, a); b.frame = 19; b.update(blank);
  assert.ok(a.stats.dmg > before, 'burn tick belongs to attacker');
  assert.equal(b.hp, b.maxHp, 'DOT score never reduces infinite life');
  const attributed = a.stats.dmg;
  b.addStatus('burn', 200); b.frame = 19; b.update(blank);
  assert.equal(a.stats.dmg, attributed, 'environment/self status is not enemy score');
}

console.log('combat_regressions: PASS (10 grupos)');
