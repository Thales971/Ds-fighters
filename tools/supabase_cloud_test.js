#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const profileSource = fs.readFileSync(path.join(ROOT, 'js/core/profile.js'), 'utf8');
const cloudSource = fs.readFileSync(path.join(ROOT, 'js/core/cloud.js'), 'utf8');
const supabaseSource = fs.readFileSync(path.join(ROOT, 'js/core/supabase-cloud.js'), 'utf8');

const PROJECT_URL = 'https://ownxbuailthavxgfxtem.supabase.co';
const PROJECT_KEY = 'sb_publishable_test';
const STORAGE_KEY = 'dsfighters.supabase.ownxbuailthavxgfxtem.auth.v1';

function makeStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); },
  };
}

function validConfig() {
  return {
    url: PROJECT_URL,
    publishableKey: PROJECT_KEY,
    table: 'ds_fighters_profiles',
    storageKey: STORAGE_KEY,
  };
}

function makeSupabase(state, options) {
  const settings = options && options.settings ? options.settings : { external: { providers: { google: true } } };
  const auth = {
    callback: null,
    getSessionCalls: 0,
    oauthCalls: [],
    signOutCalls: [],
    onAuthStateChange(callback) {
      this.callback = callback;
      return { data: { subscription: { unsubscribe() { state.unsubscribed = true; } } } };
    },
    async getSession() {
      this.getSessionCalls += 1;
      if (state.getSessionError) return { data: { session: null }, error: state.getSessionError };
      return { data: { session: state.session || null }, error: null };
    },
    async signInWithOAuth(payload) {
      this.oauthCalls.push(payload);
      return { data: { url: 'https://accounts.google.test/oauth' }, error: null };
    },
    async signOut(payload) {
      this.signOutCalls.push(payload);
      state.session = null;
      if (typeof this.callback === 'function') setTimeout(() => this.callback('SIGNED_OUT', null), 0);
      return { error: null };
    },
  };
  state.auth = auth;

  const client = {
    auth,
    from(table) {
      assert.equal(table, 'ds_fighters_profiles', 'the provider must never address another table');
      const query = {
        selected: null,
        uid: null,
        limitValue: null,
        select(fields) { this.selected = fields; return this; },
        eq(field, value) { assert.equal(field, 'user_id'); this.uid = value; return this; },
        limit(value) { this.limitValue = value; return this; },
        async maybeSingle() {
          state.queries.push({ table, selected: this.selected, uid: this.uid, limit: this.limitValue });
          const delay = state.queryDelay[this.uid] || 0;
          await sleep(delay);
          if (state.queryErrors[this.uid]) return { data: null, error: state.queryErrors[this.uid] };
          return { data: state.remote[this.uid] || null, error: null };
        },
        async upsert(payload, conflict) {
          assert.equal(conflict && conflict.onConflict, 'user_id');
          assert.deepEqual(Object.keys(payload).sort(), ['name', 'photo', 'profile', 'updated_at', 'user_id']);
          state.upserts.push({ payload, conflict });
          if (state.nextUpsertGate) {
            const gate = state.nextUpsertGate;
            state.nextUpsertGate = null;
            await gate.promise;
          }
          if (state.upsertError) return { error: state.upsertError };
          return { error: null, data: null };
        },
      };
      return query;
    },
  };
  state.client = client;
  state.settings = settings;
  return { createClient(url, key, clientOptions) {
    state.createClientCalls.push({ url, key, options: clientOptions });
    return client;
  } };
}

function boot(options) {
  const opts = options || {};
  const storage = makeStorage(opts.storage);
  const listeners = {};
  const state = {
    session: opts.session || null,
    remote: Object.assign({}, opts.remote),
    queryDelay: Object.assign({}, opts.queryDelay),
    queryErrors: Object.assign({}, opts.queryErrors),
    queries: [],
    upserts: [],
    createClientCalls: [],
    fetchCalls: [],
    unsubscribed: false,
    settings: opts.settings || { external: { providers: { google: true } } },
  };
  const window = {
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    location: {
      origin: 'https://game.test',
      pathname: '/index.html',
      search: '?keep=1&code=pkce-code&error_description=old-error',
      hash: '#fight',
    },
    history: {
      state: null,
      replaceState(_state, _title, url) { window.replacedUrl = url; },
    },
    URLSearchParams,
  };
  const document = {
    visibilityState: 'visible',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
  };
  const fetch = async (url, request) => {
    state.fetchCalls.push({ url, request });
    if (opts.settingsError) throw opts.settingsError;
    return {
      ok: true,
      status: 200,
      async json() { return state.settings; },
    };
  };
  if (opts.config !== false) window.DS_SUPABASE_CONFIG = opts.config || validConfig();
  if (opts.sdk !== false) window.supabase = makeSupabase(state, opts);
  const nativeSetTimeout = setTimeout;
  const testSetTimeout = opts.fastTimers ? (fn, ms, ...args) => nativeSetTimeout(fn, ms === 2000 ? 0 : ms, ...args) : nativeSetTimeout;
  const context = vm.createContext({
    console,
    Date,
    Error,
    JSON,
    Math,
    Number,
    Object,
    Promise,
    String,
    Array,
    URL,
    URLSearchParams,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: testSetTimeout,
    clearTimeout,
    window,
    document,
    localStorage: storage,
    navigator: { onLine: opts.online !== false, userAgent: 'node-test' },
    fetch,
  });
  vm.runInContext(profileSource, context, { filename: 'profile.js' });
  context.Profile = vm.runInContext('Profile', context);
  vm.runInContext(cloudSource, context, { filename: 'cloud.js' });
  context.Cloud = context.window.Cloud;
  vm.runInContext(supabaseSource, context, { filename: 'supabase-cloud.js' });
  context.Cloud = context.window.Cloud;
  return { context, storage, state, Profile: context.Profile, Cloud: context.Cloud, window };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeout = 500) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error('Timed out waiting for test condition');
    await sleep(1);
  }
}

async function testFallbackAndNamespace() {
  const offline = boot({ config: false, sdk: false });
  assert.equal(offline.Cloud.isConfigured(), false);
  offline.Profile.data.unlocked.push('du');
  assert.doesNotThrow(() => offline.Profile.save());
  assert.equal(offline.Cloud.googleEnabled, undefined, 'unconfigured Firebase Cloud must remain untouched');

  const sdkFree = boot({ sdk: false });
  assert.equal(sdkFree.Cloud.isConfigured(), true);
  assert.equal(await sdkFree.Cloud.init(), false, 'missing SDK must degrade to the offline provider');
  assert.equal(await sdkFree.Cloud.signIn(), false);
  assert.equal(sdkFree.Cloud.status, 'error');
  assert.equal(sdkFree.Cloud._uid({ uid: '123e4567-e89b-12d3-a456-426614174000' }), 'supabase:ownxbuailthavxgfxtem:123e4567-e89b-12d3-a456-426614174000');
  sdkFree.Profile.data.unlocked.push('qwen');
  assert.doesNotThrow(() => sdkFree.Profile.save(), 'local profile saves must continue without the SDK');
}

async function testRemoteMergeAndManualSync() {
  const uid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const env = boot({
    remote: {
      [uid]: {
        profile: {
          unlocked: ['iales'],
          pets: ['remote-pet', 'none'],
          name: 'Remote A',
          settings: { music: 0.05, serverUrl: 'https://remote-must-not-apply' },
          stats: { fights: 4, wins: 2, bestArcade: 8, maxCombo: 7 },
        },
        name: 'Remote A',
        photo: 'https://avatar.test/a',
        updated_at: '2026-11-01T10:00:00.000Z',
      },
    },
  });
  assert.equal(await env.Cloud.init(), true);
  const user = { uid, displayName: 'Account A', photoURL: 'https://avatar.test/local' };
  await env.Cloud._handleUser(user);
  env.Profile.data.unlocked.push('du', 'qwen');
  env.Profile.data.settings.music = 0.8;
  env.Profile.data.settings.serverUrl = 'wss://device-only';
  env.Profile.data.settings.touch = 'on';
  env.Profile.data.stats.fights = 9;
  env.Profile.save();
  await env.Cloud.flush();
  await env.Cloud.sync();

  assert.equal(env.Profile.accountUid, 'supabase:ownxbuailthavxgfxtem:' + uid);
  assert.deepEqual(new Set(env.Profile.data.unlocked), new Set(['du', 'qwen', 'iales']));
  assert.equal(env.Profile.data.settings.music, 0.8, 'remote cloud settings must not overwrite device settings');
  assert.equal(env.Profile.data.settings.serverUrl, 'wss://device-only');
  assert.equal(env.Profile.data.settings.touch, 'on');
  assert.deepEqual({ ...env.Profile.data.stats }, { fights: 9, wins: 2, bestArcade: 8, maxCombo: 7 });
  assert.equal(env.state.queries.at(-1).selected, 'profile,name,photo,updated_at');
  assert.equal(env.state.queries.at(-1).uid, uid);
  assert.equal(env.state.queries.at(-1).limit, 1);
  assert.ok(env.state.upserts.every((write) => write.payload.user_id === uid), 'database rows use the real Supabase UUID');
  assert.ok(env.state.upserts.at(-1).payload.profile.unlocked.includes('qwen'));
  assert.equal(env.state.fetchCalls[0].url, PROJECT_URL + '/auth/v1/settings');
  assert.equal(env.state.fetchCalls[0].request.headers.apikey, PROJECT_KEY);
}

async function testGooglePkceAndDisabledProvider() {
  const env = boot();
  assert.equal(await env.Cloud.init(), true);
  assert.equal(await env.Cloud.signIn(), true);
  assert.equal(env.state.auth.oauthCalls.length, 1);
  assert.equal(env.state.auth.oauthCalls[0].provider, 'google');
  assert.equal(env.state.auth.oauthCalls[0].options.redirectTo, 'https://game.test/index.html');
  assert.equal(env.state.auth.oauthCalls[0].options.queryParams.prompt, 'select_account');
  const authOptions = env.state.createClientCalls[0].options.auth;
  assert.equal(authOptions.persistSession, true);
  assert.equal(authOptions.autoRefreshToken, true);
  assert.equal(authOptions.flowType, 'pkce');
  assert.equal(authOptions.detectSessionInUrl, true);
  assert.equal(authOptions.storageKey, STORAGE_KEY);
  assert.equal(env.window.replacedUrl, '/index.html?keep=1#fight', 'only OAuth callback parameters are removed');

  const disabled = boot({ settings: { external: { providers: { google: false } } } });
  assert.equal(await disabled.Cloud.init(), true);
  assert.equal(await disabled.Cloud.signIn(), false);
  assert.equal(disabled.state.auth.oauthCalls.length, 0, 'disabled Google must not start an OAuth redirect');
  assert.match(disabled.Cloud.error, /desativado/i);
}

async function testAutosaveManualFlushAndDirtyInFlight() {
  const uid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const env = boot({ fastTimers: true });
  assert.equal(await env.Cloud.init(), true);
  await env.Cloud._handleUser({ uid, displayName: 'Autosave' });
  const initialWrites = env.state.upserts.length;

  env.Profile.data.unlocked.push('du');
  env.Profile.save();
  await waitFor(() => env.state.upserts.length > initialWrites);
  assert.equal(env.Cloud._dirty, false, 'the autosave timer flushes queued profile changes');

  const gate = {};
  gate.promise = new Promise((resolve) => { gate.release = resolve; });
  env.state.nextUpsertGate = gate;
  env.Profile.data.unlocked.push('iales');
  env.Profile.save();
  clearTimeout(env.Cloud._saveTimer);
  env.Cloud._saveTimer = null;
  const first = env.Cloud._upload();
  await waitFor(() => env.state.upserts.length >= initialWrites + 2);
  env.Profile.data.unlocked.push('qwen');
  env.Profile.save();
  gate.release();
  await first;
  await waitFor(() => env.state.upserts.length >= initialWrites + 3 && !env.Cloud._dirty);
  assert.ok(env.state.upserts.at(-1).payload.profile.unlocked.includes('qwen'), 'a save made during an in-flight upload is not lost');

  env.Profile.data.stats.wins = 3;
  env.Profile.save();
  await env.Cloud.flush();
  assert.equal(env.Cloud._dirty, false, 'manual flush drains the current revision');
}

async function testStaleAccountSwitchAndAuthCallback() {
  const uidA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const uidB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const env = boot({
    remote: {
      [uidA]: { profile: { unlocked: ['du'], name: 'A', stats: { fights: 1 } }, name: 'A', updated_at: '2026-11-01T10:00:00.000Z' },
      [uidB]: { profile: { unlocked: ['iales'], name: 'B', stats: { fights: 2 } }, name: 'B', updated_at: '2026-11-01T10:00:01.000Z' },
    },
    queryDelay: { [uidA]: 35, [uidB]: 0 },
  });
  assert.equal(await env.Cloud.init(), true);
  const first = env.Cloud._handleUser({ uid: uidA, displayName: 'A' });
  await waitFor(() => env.state.queries.some((query) => query.uid === uidA));
  const second = env.Cloud._handleUser({ uid: uidB, displayName: 'B' });
  await Promise.all([first, second]);
  assert.equal(env.Cloud.user.uid, uidB);
  assert.equal(env.Profile.accountUid, 'supabase:ownxbuailthavxgfxtem:' + uidB);
  assert.equal(env.Profile.data.name, 'B');
  assert.equal(env.Profile.data.unlocked.includes('du'), false, 'the old account response must not leak into the new account');
  assert.equal(env.Profile.data.unlocked.includes('iales'), true);
  assert.equal(env.state.upserts.some((write) => write.payload.user_id === uidA), false, 'stale account must not write after switching');

  let callbackRunning = true;
  const originalGetSession = env.state.auth.getSession.bind(env.state.auth);
  env.state.auth.getSession = async function () {
    assert.equal(callbackRunning, false, 'auth callback must not await another SDK request');
    return originalGetSession();
  };
  const beforeGetSession = env.state.auth.getSessionCalls;
  const callbackResult = env.state.auth.callback('SIGNED_IN', { user: { id: uidB, user_metadata: { name: 'B' } } });
  callbackRunning = false;
  assert.equal(callbackResult, undefined);
  await sleep(10);
  assert.equal(env.state.auth.getSessionCalls, beforeGetSession, 'deferred auth handling does not call getSession from the callback');
}

async function testLocalSignOut() {
  const uid = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const env = boot();
  await env.Cloud.init();
  await env.Cloud._handleUser({ uid, displayName: 'Logout' });
  env.Profile.data.unlocked.push('du');
  env.Profile.save();
  assert.equal(await env.Cloud.signOut(), true);
  assert.equal(env.state.auth.signOutCalls.length, 1);
  assert.equal(env.state.auth.signOutCalls[0].scope, 'local');
  assert.equal(env.Cloud.user, null);
  assert.equal(env.Profile.accountUid, null);
  assert.equal(env.Cloud.status, 'ready');
}

(async () => {
  await testFallbackAndNamespace();
  await testRemoteMergeAndManualSync();
  await testGooglePkceAndDisabledProvider();
  await testAutosaveManualFlushAndDirtyInFlight();
  await testStaleAccountSwitchAndAuthCallback();
  await testLocalSignOut();
  console.log('supabase_cloud_test: PASS (fallback, namespace, merge, PKCE, autosave, stale sessions, callback safety, local signout)');
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
