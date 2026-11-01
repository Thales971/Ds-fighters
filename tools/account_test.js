#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const accountSource = fs.readFileSync(path.join(ROOT, 'js/ui/account.js'), 'utf8');

class FakeElement {
  constructor(tagName, attributes) {
    this.tagName = String(tagName || '').toUpperCase();
    this.attributes = Object.assign({}, attributes || {});
    this.id = this.attributes.id || '';
    this.className = this.attributes.class || '';
    this.name = this.attributes.name || '';
    this.type = this.attributes.type || '';
    this.value = this.attributes.value || '';
    this.disabled = Object.prototype.hasOwnProperty.call(this.attributes, 'disabled');
    this.listeners = {};
    this.focused = false;
    this.selected = false;
  }

  addEventListener(type, callback) {
    (this.listeners[type] ||= []).push(callback);
  }

  dispatch(type, extra) {
    const event = Object.assign({
      type,
      preventDefault() { this.defaultPrevented = true; },
      defaultPrevented: false,
      currentTarget: this,
      target: this,
    }, extra || {});
    for (const callback of this.listeners[type] || []) callback(event);
    return event;
  }

  focus() { this.focused = true; }
  select() { this.selected = true; }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  querySelector(selector) {
    return this.ownerBox ? this.ownerBox.querySelector(selector) : null;
  }
}

class FakeBox extends FakeElement {
  constructor() {
    super('div');
    this.ownerBox = this;
    this.nodes = [];
    this.renderCount = 0;
    this._innerHTML = '';
  }

  set innerHTML(value) {
    this._innerHTML = String(value || '');
    this.renderCount += 1;
    this.nodes = [];
    const openingTags = /<([a-z][a-z0-9-]*)([^>]*)>/gi;
    let match;
    while ((match = openingTags.exec(this._innerHTML))) {
      const tagName = match[1];
      const rawAttributes = match[2] || '';
      const attributes = {};
      const attrPattern = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attr;
      while ((attr = attrPattern.exec(rawAttributes))) {
        attributes[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
      }
      const node = new FakeElement(tagName, attributes);
      node.ownerBox = this;
      this.nodes.push(node);
    }
  }

  get innerHTML() { return this._innerHTML; }

  querySelector(selector) {
    if (selector.startsWith('#')) return this.nodes.find((node) => node.id === selector.slice(1)) || null;
    if (selector.startsWith('.')) return this.nodes.find((node) => node.className.split(/\s+/).includes(selector.slice(1))) || null;
    return this.nodes.find((node) => node.tagName.toLowerCase() === selector.toLowerCase()) || null;
  }
}

function boot() {
  const box = new FakeBox();
  let cloudListener = null;
  const calls = { signin: [], signup: [], recovery: [], updatePassword: [] };
  const cloud = {
    provider: 'supabase',
    status: 'ready',
    error: '',
    user: null,
    passwordRecoveryPending: false,
    googleEnabled: false,
    emailEnabled: true,
    emailSignupEnabled: true,
    isConfigured() { return true; },
    onChange(callback) {
      cloudListener = callback;
      return () => { cloudListener = null; };
    },
    async init() { return true; },
    async signIn() { return true; },
    async signOut() { return true; },
    async signInWithEmail(email, password) { calls.signin.push({ email, password }); return true; },
    async signUpWithEmail(email, password) { calls.signup.push({ email, password }); return true; },
    async resetPasswordForEmail(email) { calls.recovery.push(email); return true; },
    async updatePassword(password) {
      calls.updatePassword.push(password);
      this.passwordRecoveryPending = false;
      this.error = '';
      this.status = 'saved';
      if (cloudListener) cloudListener();
      return true;
    },
  };
  const document = {
    readyState: 'complete',
    getElementById(id) { return id === 'account-box' ? box : null; },
    addEventListener() {},
  };
  const window = { Cloud: cloud, addEventListener() {} };
  const context = vm.createContext({
    console,
    String,
    Object,
    Array,
    Promise,
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    document,
    window,
    Cloud: cloud,
    Profile: { data: { name: 'Jogador' } },
  });
  vm.runInContext(accountSource, context, { filename: 'account.js' });
  return { Account: window.Account, box, cloud, calls, emit: () => cloudListener && cloudListener() };
}

async function main() {
  const env = boot();
  const account = env.Account;
  assert.ok(account, 'Account global is created');
  assert.match(env.box.innerHTML, /account-email-signin/);
  assert.match(env.box.innerHTML, /account-email-signup/);
  assert.match(env.box.innerHTML, /account-signin/);

  env.box.querySelector('#account-email-signin').dispatch('click');
  const email = env.box.querySelector('#account-email');
  const password = env.box.querySelector('#account-password');
  assert.equal(email.getAttribute('autocomplete'), 'email');
  assert.equal(password.getAttribute('autocomplete'), 'current-password');
  assert.equal(email.focused, true, 'email receives focus when the form opens');
  assert.equal(env.box.querySelector('#account-auth-form').getAttribute('aria-label'), null);

  email.value = 'player@example.com';
  const inputBeforeTyping = email;
  const rendersBeforeTyping = env.box.renderCount;
  email.dispatch('input');
  assert.equal(env.box.renderCount, rendersBeforeTyping, 'typing does not re-render the form');
  assert.equal(env.box.querySelector('#account-email'), inputBeforeTyping, 'typing keeps the focused input node');

  password.value = 'secret123';
  env.box.querySelector('#account-auth-form').dispatch('submit');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(env.calls.signin, [{ email: 'player@example.com', password: 'secret123' }]);
  assert.equal(Object.prototype.hasOwnProperty.call(account, '_authPassword'), false, 'Account does not retain a password field');

  env.box.querySelector('#account-auth-switch').dispatch('click');
  assert.equal(env.box.querySelector('#account-email').value, 'player@example.com', 'email survives a status/form mode render');
  assert.equal(env.box.querySelector('#account-password').getAttribute('autocomplete'), 'new-password');
  assert.equal(env.box.querySelector('#account-password').value, '', 'password is not copied into the new DOM');

  env.box.querySelector('#account-auth-recovery').dispatch('click');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(env.calls.recovery, ['player@example.com']);

  env.cloud.status = 'confirm-email';
  env.cloud.error = 'Conta criada. Confira seu email para confirmar a conta antes de entrar.';
  env.emit();
  assert.match(env.box.innerHTML, /Confirmação de email necessária/);
  assert.match(env.box.innerHTML, /Confira seu email/);
  assert.equal(env.cloud.user, null, 'confirmation copy does not claim a logged-in user');

  env.cloud.user = { uid: 'recovery-user', displayName: 'Recovery Player' };
  env.cloud.status = 'saved';
  env.cloud.error = '';
  env.cloud.passwordRecoveryPending = true;
  env.emit();
  assert.match(env.box.innerHTML, /NOVA SENHA/);
  const newPassword = env.box.querySelector('#account-new-password');
  const confirmation = env.box.querySelector('#account-new-password-confirm');
  assert.equal(newPassword.getAttribute('autocomplete'), 'new-password');
  assert.equal(confirmation.getAttribute('autocomplete'), 'new-password');
  newPassword.value = 'secret123';
  confirmation.value = 'different123';
  env.box.querySelector('#account-recovery-form').dispatch('submit');
  assert.deepEqual(env.calls.updatePassword, [], 'mismatched passwords never reach Auth');
  assert.match(env.box.innerHTML, /As senhas não conferem/);

  env.box.querySelector('#account-new-password').value = 'secret123';
  env.box.querySelector('#account-new-password-confirm').value = 'secret123';
  env.box.querySelector('#account-recovery-form').dispatch('submit');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(env.calls.updatePassword, ['secret123']);
  assert.match(env.box.innerHTML, /Recovery Player/);
  assert.equal(Object.prototype.hasOwnProperty.call(account, '_authPassword'), false, 'recovery passwords are not retained');

  console.log('account_test: PASS (accessible email form, stable typing, autocomplete, email preservation, password recovery, mismatch validation, non-retention, confirmation copy)');
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
