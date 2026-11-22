#!/usr/bin/env node
'use strict';
/* Recompensa de login (Captcha Guard + Raposa do Firefox), tempo do torneio e
   modulo do ranking. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function storage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const ctx = vm.createContext({ console, Date, JSON, Math, Number, Object, Array, String, Set, Map, Promise, setTimeout, clearTimeout,
  localStorage: storage(), window: { matchMedia: () => ({ matches: false }) }, document: { querySelector: () => null } });
ctx.window.localStorage = ctx.localStorage;
vm.runInContext(read('js/data/pets.js') + '\nthis.PETS = PETS;', ctx, { filename: 'pets.js' });
vm.runInContext(read('js/core/profile.js') + '\nthis.Profile = Profile;', ctx, { filename: 'profile.js' });
vm.runInContext(read('js/core/ranking.js') + '\nthis.Ranking = Ranking;', ctx, { filename: 'ranking.js' });
const { Profile, Ranking, PETS } = ctx;

// sem conta: tudo travado
assert.equal(Profile.loggedIn(), false);
assert.equal(Profile.isUnlocked('captcha-guard'), false, 'Captcha Guard trava sem login');
assert.equal(Profile.isLoginLocked('captcha-guard'), true);
assert.equal(Profile.isUnlocked('stack'), true, 'lutador normal continua livre');
const fox = PETS.find((p) => p.id === 'firefox');
assert.ok(fox && fox.login, 'raposa existe e e de login');
assert.ok(fox.fx.speed > 0.1 && fox.fx.dmg >= 0.1, 'raposa acima da media');
Profile.setPet(0, 'firefox');
assert.notEqual(Profile.data.pets[0], 'firefox', 'sem login nao equipa a raposa');
// codigo nenhum libera
for (const c of ['captcha', 'captcha-guard', 'firefox', 'raposa']) assert.equal(Profile.redeem(c).ok, false, 'codigo nao libera recompensa de login: ' + c);

// com conta: libera
Profile.activateAccount('supabase:proj:uid-1');
assert.equal(Profile.loggedIn(), true);
assert.equal(Profile.isUnlocked('captcha-guard'), true);
Profile.setPet(0, 'firefox');
assert.equal(Profile.petFor(0).id, 'firefox');
assert.equal(Profile.loginReward(), true, 'primeira entrada da recompensa');
assert.equal(Profile.loginReward(), false, 'so uma vez');
assert.ok(Profile.hasAchievement('login-1'));

// tempo do torneio: guarda o MENOR
assert.equal(Profile.recordTourneyTime(400), true);
assert.equal(Profile.recordTourneyTime(500), false);
assert.equal(Profile.recordTourneyTime(350), true);
assert.equal(Profile.data.stats.bestTourneySecs, 350);
assert.equal(Profile._normalize(JSON.parse(JSON.stringify(Profile.data))).stats.bestTourneySecs, 350, 'sobrevive ao normalize');

// saiu da conta: trava de novo e a raposa volta pro padrao
Profile.deactivateAccount();
assert.equal(Profile.isUnlocked('captcha-guard'), false);
assert.notEqual(Profile.petFor(0).id, 'firefox');

// ranking: linha sem email, apelido limpo, tempo valido
Profile.data.name = '<b>Primo</b>';
Profile.data.stats.wins = 12;
Profile.data.stats.bestTourneySecs = 10; // abaixo do minimo da tabela
const row = Ranking.row();
assert.equal(row.name.includes('<'), false);
assert.equal(row.wins, 12);
assert.equal(row.best_tourney_secs, null, 'tempo impossivel nao vai pro ranking');
assert.equal(Ranking.fmtTime(125), '2:05');
assert.equal(Object.keys(row).some((k) => /mail/.test(k)), false, 'ranking nunca manda email');

// SQL do ranking: RLS e dono escreve so a propria linha
const sql = read('supabase/sql/ds_fighters_ranking.sql');
assert.match(sql, /enable row level security/);
assert.match(sql, /auth\.uid\(\)\) = uid/);
assert.doesNotMatch(sql, /grant (insert|update)[^;]*anon/);

// arte gerada
for (const f of ['assets/sprites/captcha-guard.png', 'assets/abilities/captcha-guard.png', 'assets/abilities/captcha-guard-extra.png', 'assets/pets/firefox.png', 'assets/ui/face-firefox.png', 'assets/ui/portrait-captcha-guard.png']) {
  assert.ok(fs.existsSync(path.join(ROOT, f)), 'falta ' + f);
}
console.log('login_reward_test: PASS (trava sem login, libera com conta, raposa, recompensa 1x, tempo do torneio, ranking sem email, RLS)');
