#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const fighters = ['mis', 'dev-senior'];
const required = [
  'js/data/fighters-v11.js', 'js/data/powers-v11.js',
  ...fighters.map((id) => `assets/sprites/${id}.png`),
  'assets/sprites/dev-senior-nano.png',
  ...fighters.map((id) => `assets/abilities/${id}.png`),
  'assets/abilities/dev-senior-electric.png',
  ...fighters.map((id) => `assets/ui/face-${id}.png`),
];
for (const rel of required) assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing V11 source or art: ${rel}`);

const ctx = vm.createContext({
  console, Math, Date,
  Image: class TestImage { set src(value) { this._src = value; } },
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false } } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  SpriteGen: { calls: [], count() { return 4; }, blit() {} },
});
const scripts = [
  'assets/sprites/layout.js',
  'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js',
  'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js',
  'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js',
  'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js',
  'js/data/powers-v10.js', 'js/data/powers-v11.js',
  'js/data/pets.js', 'js/data/stages.js', 'js/engine/fx.js',
  'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js',
];
for (const rel of scripts) {
  const filename = path.join(ROOT, rel);
  assert.ok(fs.existsSync(filename), `missing source module: ${rel}`);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx, { filename });
}
const api = vm.runInContext('({FIGHTERS,POWERS,SPRITE_LAYOUT,ART_SHEETS,STATUS_LABEL,Fighter,Projectile,Zone,PETS})', ctx);
let checks = 0;
function pass(condition, message) { assert.ok(condition, message); checks++; }
function def(id) { const f = api.FIGHTERS.find((x) => x.id === id); assert.ok(f, `fighter ${id} exists`); return f; }

const expectedPower = { mis: 1.37, 'dev-senior': 1.42 };
for (const id of fighters) {
  const f = def(id);
  pass(f.secret !== true, `${id} is a normal unlocked fighter`);
  assert.equal(f.stats.power, expectedPower[id], `${id} has requested power level`); checks++;
  assert.ok(api.POWERS[id] && api.POWERS[id].powers.length === 5, `${id} has five attacks`); checks++;
  assert.equal(new Set(api.POWERS[id].powers.map((p) => p.id)).size, 5, `${id} attacks have distinct ids`); checks++;
  api.POWERS[id].powers.forEach((p, row) => {
    assert.equal(p.visualSheet, id, `${id}/${p.id} uses its own visual atlas`); checks++;
    assert.equal(p.visualRow, row, `${id}/${p.id} uses unique atlas row ${row}`); checks++;
    assert.deepEqual(Array.from(p.impactSheets), [], `${id}/${p.id} has no generic impacts`); checks++;
  });
  pass(!!api.SPRITE_LAYOUT.files[id] && !!api.SPRITE_LAYOUT.perFighter[id], `${id} has a registered combat sheet`);
  pass(!!api.ART_SHEETS['abil:' + id] && !!api.ART_SHEETS['fx2:' + id], `${id} has exclusive HUD and combat atlas`);
  assert.equal(api.ART_SHEETS['abil:' + id].rows, 5, `${id} atlas has five rows`); checks++;
  pass(f.special && f.special.proj && f.special.proj.visualSheet === id, `${id} legacy special points to its own atlas`);
  pass(f.super && f.super.visualSheet === id, `${id} legacy super points to its own atlas`);
}

pass(!!api.SPRITE_LAYOUT.files['dev-senior-nano'] && !!api.SPRITE_LAYOUT.perFighter['dev-senior-nano'], 'Dev Senior nano form has its own complete sprite sheet');
pass(api.ART_SHEETS['fx2:dev-senior-electric']?.cols === 4 && api.ART_SHEETS['fx2:dev-senior-electric']?.rows === 1, 'Dev Senior has a dedicated four-frame red electricity atlas');
pass(!!api.STATUS_LABEL.vertigo && !!api.STATUS_LABEL.paralyze && !!api.STATUS_LABEL.nanomachines, 'new status effects are labelled in the HUD');
const misUlt = api.POWERS.mis.powers[4];
pass(misUlt.fx && misUlt.fx.vertigo > 0 && misUlt.fx.blind > 0 && misUlt.fx.burn > 0, 'Mis ultimate inverts the target view, blinds and applies continuous fire damage');
const nanoUlt = api.POWERS['dev-senior'].powers[4];
pass(nanoUlt.kind === 'aura' && nanoUlt.grant === 'nanomachines' && nanoUlt.form === 'nano', 'Dev Senior ultimate activates the alternate shirtless nano form');
pass(nanoUlt.time <= 240 && nanoUlt.armor && nanoUlt.dmgMult >= 1.15 && nanoUlt.defMult <= 0.85, 'Dev Senior ultimate has strong but finite armor, force and defense');

function makeGame() {
  return {
    W: 960, H: 540, time: 0, round: 1, reduced: true,
    weather: { kind: 'clear', wind: 0 }, combo: { owner: null, count: 0, until: 0 }, cfg: {}, walls: [],
    projectiles: [], strikes: [], zones: [], beams: [], events: [],
    audio: { loop() {}, play() {}, block() {}, hit() {}, voice() {}, ko() {}, dash() {}, sfx() {} },
    fighters() { return this._fighters || []; },
    opponentsOf(f) { return this._fighters.filter((x) => x.team !== f.team && x.alive); },
    enemyOf(f) { return this._fighters.find((x) => x.team !== f.team) || null; },
    spawnBurst(...args) { this.bursts.push(args); }, bursts: [], spawnImgFx() {}, spawnAbilityImpact() {}, addCrack() {}, shake() {},
    floatText() {}, registerHit() {}, splash() {}, announce() {}, say() {}, superFreeze() {},
    spark() {}, dust() {}, onKO() {},
  };
}
function pair(aId, bId = 'stack') {
  const game = makeGame();
  const a = new api.Fighter(def(aId), 300, 1, game, { team: 0, pet: api.PETS[0] });
  const b = new api.Fighter(def(bId), 520, -1, game, { team: 1, pet: api.PETS[0] });
  game._fighters = [a, b];
  return { game, a, b };
}

{
  const { a, b } = pair('mis');
  b.addStatus('paralyze', 300, a);
  pass(b.left('paralyze') <= 72, 'paralysis is capped to a short absolute window');
  pass(!b.canAct(), 'paralyzed fighters cannot attack or act');
  b.now = 30; b.addStatus('paralyze', 300, a);
  pass(b.left('paralyze') <= 42, 'repeated black-hole pulses cannot extend paralysis indefinitely');
  for (let frame = 36; frame <= 96; frame += 12) { b.now = frame; b.addStatus('paralyze', 20, a); }
  pass(!b.has('paralyze'), 'continuous pulses cannot reopen a status window at its exact expiry');
  b.now = 110; b.addStatus('paralyze', 20, a);
  pass(b.left('paralyze') <= 20, 'paralysis can be applied again after a clear recovery window');
}
{
  const { game, a, b } = pair('mis');
  const ult = { time: 96, dmg: 0.16, fx: { paralyze: 20 } };
  const zone = new api.Zone(a, { x: b.x, w: 220, time: ult.time, dmg: ult.dmg, fx: ult.fx, power: ult, fid: 'mis', key: 'abil:mis', row: 4 });
  zone.age = 11; zone.update(game);
  pass(b.has('paralyze'), 'paralysis Zone applies paralysis through the real Zone update');
  let chip = 0; b.chip = (amount) => { chip += amount; };
  zone.age = 17; zone.update(game);
  pass(chip > 0, 'paralysis Zone causes damage-over-time on its tick');
}
{
  const { a } = pair('dev-senior');
  const ult = api.POWERS['dev-senior'].powers[4];
  a.fire(ult);
  pass(a.has('nanomachines') && a.has('armor'), 'nano ultimate grants its status and superarmor');
  const power = api.Fighter.prototype.dmgMult.call(a, ult);
  const defense = api.Fighter.prototype.defMult.call(a);
  pass(power >= ult.dmgMult - 1e-9, 'nano status applies the declared strength multiplier');
  pass(defense <= ult.defMult + 1e-9, 'nano status applies the declared defense multiplier');
  pass(a.spriteKey() === 'dev-senior-nano', 'shirtless nano sprite is active only during the nano status');
  a.now = ult.time + 1;
  pass(!a.has('nanomachines') && a.spriteKey() === 'dev-senior', 'nano power and alternate sprite expire together');
}
{
  const { game, a, b } = pair('dev-senior');
  const ult = api.POWERS['dev-senior'].powers[4];
  a.fire(ult);
  b.x = a.x + 120; a.frame = 36;
  const hp = b.hp;
  pass(a.nanoElectricPulse() === true, 'Nano Overdrive hits a nearby opponent with a red-electric pulse');
  pass(b.hp < hp && b.has('shock') && b.left('shock') <= 8, 'proximity pulse deals damage with only a brief shock');
  pass(game.bursts.at(-1)?.[0] === 'fx2:dev-senior-electric' && game.bursts.at(-1)?.[1] === 0, 'red lightning uses its own networkable visual burst');
  b.x = a.x + 151; a.frame = 72;
  const farHp = b.hp;
  pass(a.nanoElectricPulse() === false && b.hp === farHp, 'red-electric field does not reach beyond its radius');
}

const online = require(path.join(ROOT, 'online-server/room-core.js'));
for (const id of fighters) pass(online.FIGHTER_IDS.includes(id), `${id} is accepted by online rooms`);
assert.equal(fs.readFileSync(path.join(ROOT, 'js/net/room-core.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'online-server/room-core.js'), 'utf8'), 'client and server room cores remain identical'); checks++;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const rel of ['fighters-v11.js', 'powers-v11.js']) pass(html.includes(rel), `${rel} is loaded by the game`);
const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
pass(/#game\.vertigo/.test(css), 'Mis view inversion only transforms the game canvas');

console.log(`V11 regressions: ${checks} assertions passed.`);
