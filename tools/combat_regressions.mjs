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
  'js/data/powers-v5.js',
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
    round: 1,
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
  assert.equal(f.maxHp, Math.round((fdef.stats.hp || 100) * 2.00), `${fdef.id} hp multiplier`);
}

// 2) Slots V4, resgate e ranking: a força permanente é apenas stats.power,
//    sem contar o status temporário Astra ou qualquer aura.
for (const id of ['urbano', 'xeon', 'qwen', 'dolynho', 'thl']) {
  const kit = api.POWERS[id].powers;
  assert.equal(kit.length, 5, `${id} has five powers`);
  assert.equal(new Set(kit.map((p) => p.id)).size, 5, `${id} powers are distinct`);
}
assert.ok(api.POWERS.iales.powers[7] && api.POWERS.iales.powers[7].id === 'afo2', 'IALES AFO2 is the eighth hotkey contract');
assert.ok(api.POWERS.iales.powers[5] && api.POWERS.iales.powers[5].id === 'remotesteal', 'IALES second steal (remote copy) is hotkey 6');
assert.ok(api.POWERS.iales.powers[6] && api.POWERS.iales.powers[6].id === 'grabsteal' && api.POWERS.iales.powers[6].kind === 'grabsteal', 'IALES grab-steal is hotkey 7');
assert.ok(api.Profile.SECRET_IDS.includes('qwen'), 'Batata unlock includes Qwen');
assert.ok(!api.Profile.SECRET_IDS.includes('dolynho') && !api.Profile.SECRET_IDS.includes('thl'), 'Dolynho and THL are normal unlocked fighters');
assert.equal(def('dolynho').stats.power, 1.08, 'Dolynho permanent power');
assert.equal(def('dolynho').stats.hp, 126, 'Dolynho catalog HP');
assert.equal(def('dolynho').stats.meterRate, 1.1, 'Dolynho meter rate');
assert.equal(def('dolynho').stats.speed, 1.03, 'Dolynho speed');
assert.equal(def('thl').stats.power, 1.38, 'THL permanent power');
assert.equal(def('thl').stats.hp, 140, 'THL catalog HP');
assert.equal(def('thl').stats.meterRate, 1.35, 'THL meter rate');
assert.equal(def('thl').stats.speed, 1.0, 'THL speed');
const permanentPowerRanking = [...api.FIGHTERS].sort((a, b) => b.stats.power - a.stats.power);
const permanentTop5 = permanentPowerRanking.slice(0, 5);
assert.deepEqual([...permanentTop5].map((f) => f.id), ['iales', 'felipinho', 'qwen', 'du', 'thl'], 'permanent top five power ranking');
assert.deepEqual([...permanentTop5].map((f) => f.stats.power), [1.5, 1.4, 1.39, 1.38, 1.38], 'permanent top five power values');
assert.deepEqual([...permanentPowerRanking.slice(0, 2)].map((f) => [f.id, f.stats.power]), [['iales', 1.5], ['felipinho', 1.4]], 'existing top two remain unchanged');
assert.equal(new Set(permanentPowerRanking.slice(0, 3).map((f) => f.stats.power)).size, 3, 'permanent top three have no power ties');
assert.equal(def('qwen').stats.hp, 140, 'Qwen has a strong but bounded permanent HP value');
assert.equal(def('qwen').stats.meterRate, 1.5, 'Qwen has a strong but bounded meter rate');
const qwenAstra = api.POWERS.qwen.powers[4];
assert.equal(qwenAstra.id, 'thinking', 'Qwen ability five remains Astra');
assert.equal(qwenAstra.slot, 'ultimate', 'Astra remains Qwen\'s ultimate slot');
assert.equal(qwenAstra.transform, 'astra', 'Astra transform contract is preserved');
assert.equal(qwenAstra.time, 780, 'Astra remains temporary');
assert.equal(qwenAstra.dmg, 56, 'Astra ability damage is preserved');
assert.equal(qwenAstra.heal, 26, 'Astra ability heal is preserved');
assert.equal(qwenAstra.fx.lock, 300, 'Astra lock effect is preserved');
assert.equal(qwenAstra.fx.vuln, 300, 'Astra vulnerability effect is preserved');
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
  const afo2 = api.POWERS.iales.powers[7];
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
  const baseDamage = qwen.dmgMult();
  const baseSpeed = qwen.speedMult();
  qwen.addStatus('astra', 100);
  assert.equal(qwen.def.stats.power, 1.39, 'Astra does not mutate permanent Qwen power');
  assert.ok(Math.abs(qwen.dmgMult() - baseDamage * 1.35) < 1e-9, 'Astra keeps the documented temporary damage multiplier');
  assert.ok(Math.abs(qwen.speedMult() - baseSpeed * 1.18) < 1e-9, 'Astra keeps the documented temporary speed multiplier');
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

// 11) Os dez poderes V5 usam somente kinds executados e criam a entidade correta.
{
  const expected = { shot: 'projectiles', dash: 'dashHit', pillar: 'strikes', zone: 'zones', blast: 'strikes', barrage: 'projectiles' };
  for (const id of ['dolynho', 'thl']) {
    for (const p of api.POWERS[id].powers) {
      const { game, a } = pair(id, 'stack');
      a.fire(p);
      const bucket = expected[p.kind];
      assert.ok(bucket, `${id}/${p.id} kind is an executor contract`);
      if (bucket === 'dashHit') assert.ok(a.dashHit, `${id}/${p.id} creates dash hit state`);
      else if (p.kind === 'shot' || p.kind === 'barrage') {
        assert.ok(a.queue.length > 0, `${id}/${p.id} queues projectile creation`);
        a.queue[0].fn();
        assert.ok(game.projectiles.length > 0, `${id}/${p.id} creates projectiles after queue flush`);
      }
      else assert.ok(game[bucket].length > 0, `${id}/${p.id} creates ${bucket}`);
    }
  }
}

// 12) Dolynho stun, THL expose/bleed/zone/pillar and Lockdown apply real effects.
{
  const dol = pair('dolynho', 'stack');
  const fizz = api.POWERS.dolynho.powers[0];
  const fizzShot = new api.Projectile(dol.a, fizz, {});
  fizzShot.x = dol.b.x; fizzShot.y = -100;
  const fizzHp = dol.b.hp;
  fizzShot.update(dol.game);
  assert.ok(dol.b.hp < fizzHp, 'Dolynho shot deals damage');
  assert.ok(dol.b.stunGauge > 0, 'Dolynho shot adds stun pressure');
  assert.ok(dol.b.has('slow'), 'Dolynho shot applies slow');

  const expose = pair('thl', 'stack');
  const exposePower = api.POWERS.thl.powers[0];
  const exposeShot = new api.Projectile(expose.a, exposePower, {});
  exposeShot.x = expose.b.x; exposeShot.y = -100;
  exposeShot.update(expose.game);
  assert.ok(expose.b.has('vuln'), 'THL expose applies vulnerability');
  assert.ok(expose.b.has('blind'), 'THL expose applies bounded blind');
  assert.ok(expose.b.has('meterSlow'), 'THL expose slows meter gain');

  const dash = pair('thl', 'stack');
  const bleed = api.POWERS.thl.powers[1];
  dash.a.cast = { p: bleed, t: 0, fired: true };
  dash.a.x = 470;
  dash.b.x = 520;
  dash.a.fire(bleed);
  dash.a.stepCast();
  assert.ok(dash.b.has('bleed'), 'THL dash applies bleed');

  const zonePair = pair('thl', 'stack');
  zonePair.a.fire(api.POWERS.thl.powers[2]);
  runZone(zonePair.game.zones[0], zonePair.game, 6);
  assert.ok(zonePair.b.has('chill'), 'THL zone applies chill');
  assert.ok(zonePair.b.has('vuln'), 'THL zone applies vulnerability');
  assert.ok(zonePair.b.has('meterSlow'), 'THL zone applies meter slow');

  const pillar = pair('thl', 'stack');
  const skull = api.POWERS.thl.powers[3];
  pillar.a.fire(skull);
  for (let i = 0; i < 16; i++) { pillar.game.time++; pillar.game.strikes[0].update(pillar.game); }
  assert.ok(pillar.b.has('vuln') && pillar.b.has('bleed'), 'THL pillar applies tactical debuffs');
  assert.ok(pillar.b.hitstun > 0, 'THL pillar confirms a real hit stun');

  const barrage = pair('thl', 'stack');
  const lockdown = api.POWERS.thl.powers[4];
  barrage.a.fire(lockdown);
  const firstQueued = barrage.a.queue.find((q) => q.fn);
  assert.ok(firstQueued, 'THL barrage has a queued projectile');
  firstQueued.fn();
  const lockdownShot = barrage.game.projectiles[0];
  lockdownShot.x = barrage.b.x; lockdownShot.y = -100;
  lockdownShot.update(barrage.game);
  assert.ok(barrage.b.has('locked'), 'THL Lockdown disables powers, not movement');
  assert.ok(barrage.b.powerState(0).locked, 'locked status is visible to power readiness');
  barrage.b.state = 'idle';
  barrage.b.hitstun = 0;
  assert.ok(barrage.b.canAct(), 'locked status does not freeze movement state');
  assert.ok(barrage.b.has('vuln'), 'THL Lockdown applies vulnerability');
}

// 13) Hard crowd control is bounded/diminishing while a single normal hit keeps its stun.
{
  const { game, a, b } = pair('dolynho', 'stack');
  const hardPower = api.POWERS.dolynho.powers[0];
  const durations = [];
  for (let i = 0; i < 3; i++) {
    b.now = i + 1;
    b.state = 'idle';
    b.hitstun = 0;
    b.takeHit(0, { attacker: a, height: 'unblockable', noScale: true, stun: 60, freeze: true, ability: true, power: hardPower });
    durations.push(b.hitstun);
  }
  assert.deepEqual(durations, [60, 43, 30], 'repeated hard control diminishes deterministically');
  assert.ok(b.has('freeze'), 'freeze remains functional after diminishing');
  b.now = 200;
  b.state = 'idle'; b.hitstun = 0;
  b.takeHit(0, { attacker: a, height: 'unblockable', noScale: true, stun: 60, freeze: true, ability: true, power: hardPower });
  assert.equal(b.hitstun, 60, 'hard-control chain recovers after a quiet window');

  const normal = pair('stack', 'urbano');
  normal.b.resetControlMemory(1);
  normal.b.takeHit(0, { attacker: normal.a, height: 'unblockable', noScale: true, stun: 14 });
  assert.equal(normal.b.hitstun, 14, 'single normal hit stun is unchanged');
  assert.equal(normal.b.hardControl.chain, 0, 'normal hit does not consume hard-control budget');
}

// 14) Repeated dizzy events diminish, blind/shock loops expire, and round reset clears memory.
{
  const dizzy = pair('stack', 'urbano');
  dizzy.b.now = 0;
  dizzy.b.stunGauge = 99;
  dizzy.b.takeHit(1, { attacker: dizzy.a, height: 'unblockable', noScale: true, stun: 14 });
  assert.equal(dizzy.b.left('dizzy'), 100, 'first dizzy keeps the documented duration');
  dizzy.b.now = 101;
  dizzy.b.state = 'idle'; dizzy.b.hitstun = 0; dizzy.b.stunGauge = 99;
  dizzy.b.takeHit(1, { attacker: dizzy.a, height: 'unblockable', noScale: true, stun: 14 });
  assert.equal(dizzy.b.left('dizzy'), 72, 'repeated dizzy duration diminishes');

  const effects = pair('thl', 'stack').b;
  effects.now = 0;
  for (let i = 0; i < 21; i++) {
    effects.addStatus('blind', 180);
    effects.addStatus('shock', 180);
    effects.now += 10;
  }
  effects.now = 221;
  assert.ok(!effects.has('blind') && !effects.has('shock'), 'blind/shock refresh loops have an absolute expiry');
  effects.hardControl.chain = 3;
  effects.statusPulse = { blind: { start: 1, last: 2, count: 2, cap: 220 } };
  effects.game.round = 2;
  effects.syncControlMemory();
  assert.equal(effects.hardControl.chain, 0, 'round change resets hard-control memory');
  assert.equal(Object.keys(effects.statusPulse).length, 0, 'round change resets status-loop memory');
}

// 15) Fighter snapshots preserve new control fields and round/replay state deterministically.
{
  const { game, a } = pair('thl', 'dolynho');
  a.now = 12;
  a.addStatus('blind', 120);
  a.hardControl = { last: 9, chain: 2, dizzyLast: 5, dizzyCount: 1 };
  const snap = a.snap();
  assert.ok(snap[23] && snap[24] && snap[25] === 1, 'snapshot includes status pulse, control memory, and round');
  const restored = new api.Fighter(def('thl'), 300, 1, game, { team: 0, pet: ctx.PETS[0] });
  restored.applySnap(snap);
  assert.equal(JSON.stringify(restored.snap()), JSON.stringify(snap), 'fighter snapshot round-trips deterministically');
  assert.equal(JSON.stringify(restored.snap()), JSON.stringify(snap), 'snapshot encoding is stable');
}

// 16) Explosões respeitam stun/launch declarados; reforços modestos não mudam o top.
{
  const { game, a } = pair('dolynho', 'stack');
  const ultimate = api.POWERS.dolynho.powers[4];
  a.fire(ultimate);
  assert.equal(game.strikes[0].stun, ultimate.stun, 'blast uses configured stun');
  assert.equal(game.strikes[0].launch, ultimate.launch, 'blast uses configured launch');
  assert.equal(def('bughunter').stats.hp, 112);
  assert.equal(def('scrum').stats.hp, 118);
  assert.equal(api.POWERS.bughunter.powers[1].range, 380);
  assert.equal(api.POWERS.scrum.powers[1].range, 280);
}

console.log('combat_regressions: PASS (16 grupos + V5/ranking/control contracts)');
