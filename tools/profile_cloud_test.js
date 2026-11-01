#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const profileSource = fs.readFileSync(path.join(ROOT, 'js/core/profile.js'), 'utf8');
const cloudSource = fs.readFileSync(path.join(ROOT, 'js/core/cloud.js'), 'utf8');

function makeStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); },
  };
}

function boot(initialStorage) {
  const storage = makeStorage(initialStorage);
  const listeners = {};
  const window = {
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
  };
  const document = {
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
  };
  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
    Promise,
    String,
    Array,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout,
    clearTimeout,
    window,
    document,
    localStorage: storage,
    navigator: { onLine: true, userAgent: 'node-test' },
  });
  vm.runInContext(profileSource, context, { filename: 'profile.js' });
  context.Profile = vm.runInContext('Profile', context);
  vm.runInContext(cloudSource, context, { filename: 'cloud.js' });
  context.Cloud = context.window.Cloud;
  return { context, storage, Profile: context.Profile, Cloud: context.window.Cloud };
}

async function testAccountIsolationAndMerge() {
  const { Profile, Cloud, storage } = boot();
  Profile.save();

  Profile.activateAccount('account-a');
  Profile.data.unlocked.push('du');
  Profile.save();
  await Cloud.signOut();
  assert.deepEqual(Array.from(Profile.data.unlocked), [], 'logout must restore the anonymous profile, not account A');

  Profile.activateAccount('account-b');
  assert.deepEqual(Array.from(Profile.data.unlocked), [], 'a new account must not inherit account A unlocks');
  Profile.data.settings.serverUrl = 'wss://device-only';
  Profile.data.settings.touch = 'on';
  Profile.data.settings.music = 0.8;
  Profile.save();

  Profile.applyCloud({
    profile: {
      unlocked: ['iales', 'qwen'],
      pets: ['remote-pet', 'none'],
      name: 'Remote B',
      settings: { music: 0.1, serverUrl: 'wss://must-not-apply' },
      stats: { fights: 4, wins: 2, bestArcade: 3, maxCombo: 8 },
    },
    updatedAt: { toMillis: () => 2000 },
    name: 'Remote B',
  });
  assert.deepEqual(new Set(Profile.data.unlocked), new Set(['iales', 'qwen']));
  assert.equal(Profile.data.settings.music, 0.8, 'cloud settings must not overwrite device settings');
  assert.equal(Profile.data.settings.serverUrl, 'wss://device-only');
  assert.equal(Profile.data.settings.touch, 'on');
  assert.deepEqual({ ...Profile.data.stats }, { fights: 4, wins: 2, bestArcade: 3, maxCombo: 8 });

  assert.doesNotThrow(() => Profile.applyCloud({ profile: { unlocked: {}, pets: null, stats: { fights: 'bad' } } }), 'malformed remote data must not crash the profile');
  assert.ok(Profile.SECRET_IDS.includes('qwen'), 'Batata must include Qwen in the profile secret set');
  Cloud._deps = { firestoreFns: { serverTimestamp: () => ({ mocked: true }) } };
  const payload = Cloud._payload({ uid: 'account-b', displayName: 'Account B' });
  assert.equal(Object.prototype.hasOwnProperty.call(payload.profile.settings, 'serverUrl'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(payload.profile.settings, 'touch'), false);
  assert.ok(JSON.parse(storage.getItem('dsfighters.profile.account.v1.account-b')), 'account B must have a local snapshot');
}

async function testStaleSyncAndLogoutFlush() {
  const { Profile, Cloud } = boot();
  const writes = [];
  const remote = {
    a: { profile: { unlocked: ['du'], pets: ['a-pet', 'none'], name: 'A', stats: { fights: 1 } }, updatedAt: { toMillis: () => 100 } },
    b: { profile: { unlocked: ['iales'], pets: ['b-pet', 'none'], name: 'B', stats: { fights: 2 } }, updatedAt: { toMillis: () => 200 } },
  };
  Cloud._ready = true;
  Cloud._db = {};
  Cloud._deps = {
    firestoreFns: {
      doc: (db, collection, id) => ({ id }),
      getDoc: (ref) => new Promise((resolve) => setTimeout(() => resolve({ exists: () => true, data: () => remote[ref.id] }), ref.id === 'a' ? 35 : 0)),
      serverTimestamp: () => ({ mocked: true }),
      setDoc: (ref, data) => { writes.push({ uid: ref.id, data }); return Promise.resolve(); },
    },
    authFns: { signOut: () => Promise.resolve() },
  };

  const first = Cloud._handleUser({ uid: 'a', displayName: 'A' });
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = Cloud._handleUser({ uid: 'b', displayName: 'B' });
  await Promise.all([first, second]);
  assert.equal(Cloud.user.uid, 'b');
  assert.equal(Profile.accountUid, 'b');
  assert.equal(Profile.data.name, 'B', 'the stale A response must not apply after switching to B');
  assert.equal(Profile.data.unlocked.includes('du'), false, 'account A unlock must not leak into account B');
  assert.equal(Profile.data.unlocked.includes('iales'), true);

  Profile.data.unlocked.push('qwen');
  Profile.save();
  await Cloud.signOut();
  assert.equal(Cloud.user, null);
  assert.ok(writes.some((write) => write.uid === 'b' && write.data.profile.unlocked.includes('qwen')), 'logout must flush a pending save before ending the session');
  assert.equal(Profile.accountUid, null);
}

async function testSdkFailureKeepsConfiguredError() {
  const { Cloud } = boot();
  Cloud.isConfigured = () => true;
  Cloud.init = async () => false;
  Cloud.status = 'error';
  Cloud.error = 'falha de carregamento';
  const result = await Cloud.signIn();
  assert.equal(result, false);
  assert.equal(Cloud.status, 'error');
  assert.notEqual(Cloud.error, 'Login com Google não configurado.');
}

(async () => {
  await testAccountIsolationAndMerge();
  await testStaleSyncAndLogoutFlush();
  await testSdkFailureKeepsConfiguredError();
  console.log('profile_cloud_test: PASS (isolamento, merge local, corrida stale e flush no logout)');
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
