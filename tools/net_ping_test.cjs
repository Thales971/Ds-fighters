#!/usr/bin/env node
'use strict';
/* PING NO ONLINE: o convidado conta o ping real e a sala repassa pro anfitriao
   (no P2P o anfitriao mede contra a propria sala local e sempre dava 0 ms). */
const assert = require('node:assert/strict');
const path = require('node:path');
let ok = 0;
for (const file of ['js/net/room-core.js', 'online-server/room-core.js']) {
  const RoomCore = require(path.join(__dirname, '..', file));
  const core = RoomCore.createRooms({ single: true, code: 'ABC234', maxRooms: 1 });
  const inbox = { h: [], g: [] };
  const host = { id: 'h1', send: (m) => inbox.h.push(m) };
  const guest = { id: 'g1', send: (m) => inbox.g.push(m) };
  core.onMessage(host, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Anfitriao' });
  core.onMessage(host, { t: 'create', mode: '1v1', config: {}, stagePool: ['kernel'] });
  const code = (inbox.h.find((m) => m.t === 'joined') || {}).code;
  assert.ok(code, 'sala criada');
  core.onMessage(guest, { t: 'hello', v: RoomCore.PROTOCOL, name: 'Primo' });
  core.onMessage(guest, { t: 'join', code });
  assert.ok(inbox.g.some((m) => m.t === 'joined'), 'convidado entrou');
  core.onMessage(guest, { t: 'ping', at: 5 });
  assert.ok(inbox.g.some((m) => m.t === 'pong' && m.at === 5), 'pong volta pro convidado');
  core.onMessage(guest, { t: 'rtt', ms: 42.4 });
  const got = inbox.h.find((m) => m.t === 'rtt');
  assert.ok(got && got.ms === 42 && got.name === 'Primo', 'anfitriao recebe o ping do convidado: ' + JSON.stringify(got));
  assert.ok(!inbox.g.some((m) => m.t === 'rtt'), 'quem mandou nao recebe o proprio rtt');
  core.onMessage(guest, { t: 'rtt', ms: 1e9 });
  assert.equal(inbox.h.filter((m) => m.t === 'rtt').pop().ms, 9999, 'valor absurdo e limitado');
  assert.ok(!inbox.g.some((m) => m.t === 'error'), 'rtt nao gera erro');
  ok++;
}
console.log('net_ping_test: PASS (' + ok + ' cores: pong, rtt repassado ao anfitriao, limite, sem erro)');
