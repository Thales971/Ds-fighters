'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(require.resolve('../js/net/online.js'), 'utf8');
let now = 10000;
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { value: '', textContent: '', className: '', checked: false });
  return elements.get(id);
}

class FakeDataConnection {
  constructor() {
    this.open = false;
    this.handlers = {};
    this.sent = [];
  }
  on(event, fn) { (this.handlers[event] || (this.handlers[event] = [])).push(fn); }
  emit(event, value) { (this.handlers[event] || []).forEach((fn) => fn(value)); }
  send(value) { this.sent.push(value); }
  close() { this.open = false; this.emit('close'); }
}

class FakePeer {
  constructor() {
    this.destroyed = false;
    this.open = false;
    this.handlers = {};
    queueMicrotask(() => { this.open = true; this.emit('open'); });
  }
  on(event, fn) { (this.handlers[event] || (this.handlers[event] = [])).push(fn); }
  emit(event, value) { (this.handlers[event] || []).forEach((fn) => fn(value)); }
  connect() {
    const dc = new FakeDataConnection();
    queueMicrotask(() => { dc.open = true; dc.emit('open'); });
    return dc;
  }
  destroy() { this.destroyed = true; }
  reconnect() {}
}

const context = {
  RoomCore: { PROTOCOL: 2 },
  EMPTY_INPUT: {},
  INPUT_BITS: [],
  EDGE_ACTIONS: [],
  STAGE_LIST: [],
  PETS: [],
  Peer: FakePeer,
  RTCPeerConnection: function RTCPeerConnection() {},
  performance: { now: () => now },
  location: { hostname: 'localhost', origin: 'http://localhost', pathname: '/' },
  document: { getElementById: element, createElement: () => ({}) },
  navigator: {},
  history: { replaceState() {} },
  sessionStorage: { setItem() {}, removeItem() {} },
  Profile: { data: { name: 'Guest', pets: [] }, setting() {}, save() {} },
  UI: { game: null, screen: 'online', show() {}, toast() {}, startFlow() {} },
  AudioSys: { select() {} },
  Input: { read: () => ({}), down: () => false },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  console,
};
vm.runInNewContext(`${source}\nthis.__Net = Net;`, context, { filename: 'js/net/online.js' });
const Net = context.__Net;

(async () => {
  Net.lastPongAt = 100;
  await Net.joinP2P('ABCDEF');
  assert.equal(Net.status, 'open');
  assert.equal(Net.lastPongAt, now, 'uma nova conexão P2P deve começar com heartbeat fresco');
  console.log('OK — reconexão P2P reinicia a janela do heartbeat');
})().catch((err) => {
  console.error('FALHOU:', err.message);
  process.exitCode = 1;
});
