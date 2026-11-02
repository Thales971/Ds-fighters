#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const requiredFiles = [
  'js/data/fighters-v10.js', 'js/data/powers-v10.js',
  'assets/sprites/gemini.png', 'assets/sprites/meta.png',
  'assets/ui/face-gemini.png', 'assets/ui/face-meta.png',
  'assets/abilities/gemini.png', 'assets/abilities/meta.png',
];
for (const rel of requiredFiles) assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing V10 asset/module: ${rel}`);

const ctx = vm.createContext({
  console, Math, Date,
  Image: class TestImage { set src(value) { this._src = value; } },
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false } } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  SpriteGen: { calls: [], count() { return 4; }, blit() {} },
});
const scripts = [
  'assets/sprites/layout.js',
  'js/data/fighters.js', 'js/data/fighters-v10.js',
  'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js',
  'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js',
  'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js',
  'js/data/pets.js', 'js/data/stages.js', 'js/engine/fx.js',
  'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js',
];
for (const rel of scripts) {
  const filename = path.join(ROOT, rel);
  assert.ok(fs.existsSync(filename), `missing source module: ${rel}`);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), ctx, { filename });
}
const api = vm.runInContext('({FIGHTERS,POWERS,SPRITE_LAYOUT,ART_SHEETS,STATUS_LABEL,WEATHER_INFO,STAGE_LIST,Weather,Fighter,Projectile,Zone,PETS})', ctx);
let checks = 0;
function pass(condition, message) { assert.ok(condition, message); checks++; }
function def(id) { const f = api.FIGHTERS.find((x) => x.id === id); assert.ok(f, `fighter ${id} exists`); return f; }

const reference = def('stack').stats;
for (const id of ['gemini', 'meta']) {
  const f = def(id);
  pass(f.secret !== true, `${id} is a normal unlocked fighter`);
  for (const k of ['power', 'speed', 'weight', 'hp', 'meterRate']) assert.equal(f.stats[k], reference[k], `${id} matches ET 1155 ${k}`);
  const kit = api.POWERS[id];
  assert.ok(kit && kit.powers.length === 5, `${id} has five skills`); checks++;
  assert.equal(new Set(kit.powers.map((p) => p.id)).size, 5, `${id} skill ids are distinct`); checks++;
  kit.powers.forEach((p, row) => {
    assert.equal(p.visualSheet, id, `${id}/${p.id} uses its own atlas`); checks++;
    assert.equal(p.visualRow, row, `${id}/${p.id} uses unique row ${row}`); checks++;
    assert.deepEqual(Array.from(p.impactSheets), [], `${id}/${p.id} has no generic impact sheets`); checks++;
  });
  assert.ok(api.SPRITE_LAYOUT.files[id] && api.SPRITE_LAYOUT.perFighter[id], `${id} has a registered sprite sheet`); checks++;
  assert.ok(api.ART_SHEETS['abil:' + id] && api.ART_SHEETS['fx2:' + id], `${id} is registered for HUD and combat`); checks++;
  assert.equal(api.ART_SHEETS['abil:' + id].rows, 5, `${id} atlas has five rows`); checks++;
  pass(!!f.special.proj.visualSheet && f.special.proj.visualSheet === id, `${id} legacy special uses its own atlas`);
  pass(f.super.visualSheet === id, `${id} legacy super uses its own atlas`);
}

pass(!!api.STATUS_LABEL.resonance && !!api.STATUS_LABEL.veil, 'both new status effects have HUD labels');
const online = require(path.join(ROOT, 'online-server/room-core.js'));
for (const id of ['gemini', 'meta']) pass(online.FIGHTER_IDS.includes(id), `${id} is accepted by online rooms`);
assert.equal(fs.readFileSync(path.join(ROOT, 'js/net/room-core.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'online-server/room-core.js'), 'utf8'), 'client and server room cores remain identical'); checks++;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const id of ['fighters-v10.js', 'powers-v10.js']) pass(html.includes(id), `${id} is loaded by the game`);
for (const weather of ['aurora', 'heatwave']) pass(html.includes(`value="${weather}"`) && api.WEATHER_INFO[weather], `${weather} is selectable and described`);
pass(api.STAGE_LIST.some((s) => (s.weather || []).includes('aurora')), 'Aurora is in at least one stage weather pool');
pass(api.STAGE_LIST.some((s) => (s.weather || []).includes('heatwave')), 'Heatwave is in at least one stage weather pool');

function makeGame() {
  return {
    W: 960, H: 540, time: 0, round: 1, reduced: true,
    weather: { kind: 'clear', wind: 0 }, combo: { owner: null, count: 0, until: 0 }, cfg: {}, walls: [],
    audio: { loop() {}, play() {}, block() {}, hit() {}, voice() {}, ko() {} },
    fighters() { return this._fighters || []; },
    opponentsOf(f) { return this._fighters.filter((x) => x.team !== f.team && x.alive); },
    enemyOf(f) { return this._fighters.find((x) => x.team !== f.team) || null; },
    spawnBurst() {}, spawnImgFx() {}, spawnAbilityImpact() {}, addCrack() {}, shake() {},
    floatText() {}, registerHit() {}, splash() {}, announce() {},
  };
}
function pair(aId = 'gemini', bId = 'stack') {
  const game = makeGame();
  const a = new api.Fighter(def(aId), 300, 1, game, { team: 0, pet: api.PETS[0] });
  const b = new api.Fighter(def(bId), 520, -1, game, { team: 1, pet: api.PETS[0] });
  game._fighters = [a, b];
  return { game, a, b };
}

{
  const { game, a, b } = pair();
  b.addStatus('resonance', 500, a);
  pass(b.left('resonance') <= 150, 'Resonance duration is capped at 150 frames');
  b.now = 100; b.addStatus('resonance', 150, a);
  pass(b.left('resonance') <= 50, 'refresh cannot extend Resonance beyond its first 150-frame window');
  const before = b.hp;
  b.takeHit(10, { attacker: a, height: 'unblockable', noScale: true });
  const markedDamage = before - b.hp;
  pass(!b.has('resonance'), 'Resonance is consumed by the first landed hit');
  const beforeNext = b.hp;
  b.takeHit(10, { attacker: a, height: 'unblockable', noScale: true });
  const regularDamage = beforeNext - b.hp;
  pass(Math.abs(markedDamage / regularDamage - 1.15) < 0.015, 'Resonance adds 15% damage exactly once');
}
{
  const { a, b } = pair();
  b.addStatus('resonance', 90, a);
  b.blocking = true; b.state = 'block';
  b.takeHit(10, { attacker: a, height: 'mid' });
  pass(b.has('resonance'), 'blocked hits do not consume Resonance');
  b.now += 151;
  pass(!b.has('resonance'), 'Resonance expires without input-control effects');
}
{
  const { game, a, b } = pair();
  const pulse = api.POWERS.gemini.powers[0];
  const projectile = new api.Projectile(a, pulse, {});
  projectile.x = b.x; projectile.y = -100;
  projectile.update(game);
  pass(b.has('resonance'), 'Gemini Twin Pulse applies Resonance through a real projectile hit');
}
{
  const { game, a, b } = pair();
  const baseline = b.defMult();
  b.addStatus('veil', 500, a);
  pass(b.left('veil') <= 150, 'Veil duration is capped at 150 frames');
  pass(Math.abs(b.defMult() - baseline * 0.9) < 1e-9, 'Veil reduces incoming damage by 10%');
  b.now = 100; b.addStatus('veil', 150, a);
  pass(b.left('veil') <= 50, 'recasting Veil cannot extend its active 150-frame window');
  b.now = 151;
  pass(Math.abs(b.defMult() - baseline) < 1e-9, 'Veil mitigation ends when its status expires');
  b.addStatus('veil', 150, a);
  pass(b.left('veil') === 150, 'a new Veil window can begin after the old one expires');
  game.weather.kind = 'aurora';
  const f = new api.Fighter(def('stack'), 300, 1, game, { team: 0, pet: api.PETS[0] });
  pass(Math.abs(f.meterRate() - reference.meterRate * 1.08) < 1e-9, 'Aurora increases meter gain by 8% for both sides');
}
{
  const { game, a } = pair('du', 'felipinho');
  const fire = api.POWERS.du.powers[0];
  const water = api.POWERS.felipinho.powers[0];
  game.weather.kind = 'clear';
  const fireClear = a.dmgMult(fire);
  game.weather.kind = 'heatwave';
  pass(Math.abs(a.dmgMult(fire) / fireClear - 1.08) < 1e-9, 'Heatwave boosts fire/magma by 8%');
  const waterFighter = new api.Fighter(def('felipinho'), 600, -1, game, { team: 1, pet: api.PETS[0] });
  const waterClear = (() => { game.weather.kind = 'clear'; return waterFighter.dmgMult(water); })();
  game.weather.kind = 'heatwave';
  pass(Math.abs(waterFighter.dmgMult(water) / waterClear - 0.95) < 1e-9, 'Heatwave reduces water damage by 5%');
}
{
  const { game, a, b } = pair('deepseek', 'stack');
  const zone = new api.Zone(a, { x: b.x, w: 200, time: 60, dmg: 0.08, power: api.POWERS.deepseek.powers[3] });
  let chip = 0; b.chip = (amount) => { chip = amount; };
  const tick = (kind) => { game.weather.kind = kind; zone.age = 5; chip = 0; zone.update(game); return chip; };
  const clearZone = tick('clear');
  const heatZone = tick('heatwave');
  pass(Math.abs(heatZone / clearZone - 0.95) < 1e-9, 'Heatwave reduces persistent DeepSeek water-zone damage by 5%');
}
{
  const game = makeGame();
  game.rnd = () => 0.5;
  game.stageDef = { weather: ['aurora'] };
  const weather = new api.Weather(game, game.stageDef);
  weather.roll('aurora');
  weather.update(false);
  pass(weather.kind === 'aurora' && weather.drops.length > 0, 'Aurora climate initializes and renders particles');
  weather.pool = ['heatwave']; weather.roll('heatwave'); weather.update(false);
  pass(weather.kind === 'heatwave', 'Heatwave climate initializes in the shared weather engine');
}

console.log(`V10 regressions: ${checks} assertions passed.`);
